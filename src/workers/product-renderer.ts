import {
  ACESFilmicToneMapping, BufferGeometry, Color, DirectionalLight, HemisphereLight,
  Material, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry,
  PMREMGenerator, Scene, SRGBColorSpace, Texture, Vector3, WebGLRenderer,
} from 'three';
import { createProjector, type CinemaScene, type Finish } from '../lib/scene-model';

export interface ProductState {
  scrollProgress: number;
  finish: Finish;
  scene: CinemaScene;
  motionEnabled: boolean;
}

interface Dimensions { width: number; height: number; dpr: number }

export type RendererInput =
  | { type: 'init'; canvas: OffscreenCanvas; state: ProductState; size: Dimensions; visible: boolean }
  | { type: 'update'; state: ProductState }
  | { type: 'resize'; size: Dimensions }
  | { type: 'visibility'; visible: boolean }
  | { type: 'dispose' };

export type RendererOutput =
  | { type: 'ready' | 'contextlost' | 'restored' | 'error' }
  | { type: 'frame'; alpha: number };

interface WorkerScope {
  onmessage: ((event: MessageEvent<RendererInput>) => void) | null;
  postMessage(message: RendererOutput): void;
  requestAnimationFrame?: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame?: (handle: number) => void;
  close(): void;
}

const scope = self as unknown as WorkerScope;
const nativeFrames = typeof scope.requestAnimationFrame === 'function';
const requestFrame = (callback: FrameRequestCallback) => nativeFrames
  ? scope.requestAnimationFrame!(callback)
  : setTimeout(() => callback(performance.now()), 16);
const cancelFrame = (handle: number) => {
  if (nativeFrames) scope.cancelAnimationFrame!(handle);
  else clearTimeout(handle);
};

interface Pose { at: number; x: number; y: number; rx: number; ry: number; rz: number; scale: number; alpha: number }
const poses: Pose[] = [
  { at: 0, x: 0, y: -0.08, rx: 0.14, ry: -0.48, rz: -0.065, scale: 1, alpha: 1 },
  { at: 0.24, x: 0.52, y: -0.02, rx: 0.07, ry: -1.12, rz: 0.03, scale: 1.06, alpha: 1 },
  { at: 0.44, x: -0.08, y: -0.08, rx: 0.015, ry: -0.06, rz: 0, scale: 1.25, alpha: 1 },
  { at: 0.6, x: 0.6, y: 0.04, rx: 0, ry: 0, rz: 0, scale: 1.85, alpha: 1 },
  { at: 0.66, x: 1.45, y: 0.1, rx: 0, ry: 0, rz: 0, scale: 4.2, alpha: 0 },
  { at: 0.8, x: 0, y: -0.08, rx: 0.14, ry: -0.48, rz: -0.035, scale: 0.9, alpha: 0 },
  { at: 0.86, x: 0, y: -0.08, rx: 0.14, ry: -0.48, rz: -0.035, scale: 0.95, alpha: 1 },
  { at: 1, x: 0, y: -0.08, rx: 0.09, ry: -0.34, rz: 0, scale: 0.9, alpha: 1 },
];

function getPose(progress: number) {
  const clamped = Math.max(0, Math.min(1, progress));
  const endIndex = poses.findIndex((pose) => pose.at >= clamped);
  if (endIndex <= 0) return poses[0];
  const start = poses[endIndex - 1];
  const end = poses[endIndex];
  let t = (clamped - start.at) / (end.at - start.at);
  t = t * t * (3 - 2 * t);
  const mix = (a: number, b: number) => a + (b - a) * t;
  return { at: clamped, x: mix(start.x, end.x), y: mix(start.y, end.y),
    rx: mix(start.rx, end.rx), ry: mix(start.ry, end.ry), rz: mix(start.rz, end.rz),
    scale: mix(start.scale, end.scale), alpha: mix(start.alpha, end.alpha) };
}

function studioEnvironment(renderer: WebGLRenderer) {
  const room = new Scene();
  room.background = new Color('#25272c');
  const panelGeometry = new PlaneGeometry(1, 1);
  const panels = [
    { color: '#ffffff', intensity: 6, position: [-4, 5, 2], scale: [3, 6] },
    { color: '#d9e5f4', intensity: 2.8, position: [5, 3, 1], scale: [2, 6] },
    { color: '#ffbb84', intensity: 2.6, position: [0, 1, -5], scale: [6, 1.5] },
  ];
  const materials: MeshBasicMaterial[] = [];
  for (const panel of panels) {
    const material = new MeshBasicMaterial({ color: new Color(panel.color).multiplyScalar(panel.intensity) });
    const mesh = new Mesh(panelGeometry, material);
    mesh.position.set(panel.position[0], panel.position[1], panel.position[2]);
    mesh.scale.set(panel.scale[0], panel.scale[1], 1);
    mesh.lookAt(0, 0, 0);
    room.add(mesh);
    materials.push(material);
  }
  const generator = new PMREMGenerator(renderer);
  const target = generator.fromScene(room, 0, 0.1, 30, { size: 128 });
  generator.dispose();
  panelGeometry.dispose();
  materials.forEach((material) => material.dispose());
  return target;
}

let state: ProductState = { scrollProgress: 0, finish: 'graphite', scene: 'aurora', motionEnabled: true };
let size: Dimensions = { width: 1, height: 1, dpr: 1 };
let visible = true;
let frame = 0;
let disposed = false;
let contextLost = false;
let initializing = true;
let compileGeneration = 0;
let currentProgress = 0;
let hasDrawn = false;
let updateSize: (() => void) | undefined;
let cleanup: (() => void) | undefined;
let draw: (() => void) | undefined;

function stop() {
  if (frame) cancelFrame(frame);
  frame = 0;
}

function invalidate() {
  if (!frame && !disposed && !initializing && !contextLost && visible && draw) {
    frame = requestFrame(draw);
  }
}

function initialize(canvas: OffscreenCanvas) {
  try {
    const context = canvas.getContext('webgl2', { antialias: true, alpha: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
    if (!context) throw new Error('WebGL unavailable in this worker');
    const renderer = new WebGLRenderer({ canvas, context, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    const world = new Scene();
    const camera = new PerspectiveCamera(33, 1, 0.1, 50);
    camera.position.set(0, 0.12, 9.6);
    camera.lookAt(new Vector3(0, 0, 0));
    const projector = createProjector();
    world.add(projector.root);
    let environment: ReturnType<typeof studioEnvironment> | undefined;
    world.environmentIntensity = 0.8;
    world.add(new HemisphereLight('#c4d3e7', '#252020', 1.6));
    const key = new DirectionalLight('#ffe4c6', 5.4);
    key.position.set(-3, 5, 6);
    world.add(key);
    const fill = new DirectionalLight('#b4d8ff', 2.4);
    fill.position.set(5, 2, 4);
    world.add(fill);
    const rim = new DirectionalLight('#ff9b57', 5.8);
    rim.position.set(-2, 1, -4);
    world.add(rim);
    let lastFinish = state.finish;
    let lastScene = state.scene;
    currentProgress = state.scrollProgress;
    projector.setFinish(lastFinish);
    projector.setScene(lastScene);

    updateSize = () => {
      renderer.setPixelRatio(Math.min(size.dpr || 1, 1.5));
      renderer.setSize(Math.max(1, size.width), Math.max(1, size.height), false);
      camera.aspect = Math.max(1, size.width) / Math.max(1, size.height);
      camera.updateProjectionMatrix();
      invalidate();
    };

    draw = () => {
      frame = 0;
      if (disposed || initializing || contextLost || !visible) return;
      const targetProgress = Math.max(0, Math.min(1, state.scrollProgress));
      const delta = targetProgress - currentProgress;
      currentProgress = state.motionEnabled && Math.abs(delta) > 0.0002 ? currentProgress + delta * 0.17 : targetProgress;
      const choreographedPose = getPose(currentProgress);
      const pose = state.motionEnabled ? choreographedPose : { ...poses[0], alpha: choreographedPose.alpha };
      const portrait = size.width < size.height * 0.88;
      const fit = portrait ? Math.min(0.75, size.width / size.height * 1.24) : Math.min(1.12, size.width / size.height * 0.7);
      const approach = state.motionEnabled ? Math.max(0, Math.min(1, (currentProgress - 0.44) / 0.16)) : 0;
      const returnToObject = state.motionEnabled ? Math.max(0, Math.min(1, (currentProgress - 0.78) / 0.08)) : 0;
      const horizontalOffset = portrait ? 0 : 1.6 * (1 - approach + returnToObject);
      projector.root.position.set(pose.x * (portrait ? 0.35 : 1) + horizontalOffset, pose.y + (portrait ? 0.46 : 0), 0);
      projector.root.rotation.set(pose.rx, pose.ry, pose.rz);
      projector.root.scale.setScalar(pose.scale * fit);
      if (lastFinish !== state.finish) { projector.setFinish(state.finish); lastFinish = state.finish; }
      if (lastScene !== state.scene) { projector.setScene(state.scene); lastScene = state.scene; }
      const cold = Math.min(1, currentProgress * 2);
      rim.color.setRGB(1 - cold * 0.5, 0.4 + cold * 0.14, 0.15 + cold * 0.85);
      try {
        renderer.render(world, camera);
        scope.postMessage({ type: 'frame', alpha: pose.alpha });
        if (!hasDrawn) { hasDrawn = true; scope.postMessage({ type: 'ready' }); }
      } catch {
        contextLost = true;
        scope.postMessage({ type: 'error' });
        return;
      }
      if (state.motionEnabled && Math.abs(targetProgress - currentProgress) > 0.0002) invalidate();
    };

    const prepare = async () => {
      if (disposed || contextLost) return;
      const generation = ++compileGeneration;
      initializing = true;
      try {
        environment?.dispose();
        environment = studioEnvironment(renderer);
        world.environment = environment.texture;
        await renderer.compileAsync(world, camera);
        if (disposed || contextLost || generation !== compileGeneration) return;
        currentProgress = state.scrollProgress;
        initializing = false;
        invalidate();
      } catch {
        if (!disposed && generation === compileGeneration) scope.postMessage({ type: 'error' });
      }
    };
    const lost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      initializing = true;
      hasDrawn = false;
      compileGeneration += 1;
      stop();
      scope.postMessage({ type: 'contextlost' });
    };
    const restored = () => {
      if (disposed) return;
      contextLost = false;
      scope.postMessage({ type: 'restored' });
      void prepare();
    };
    canvas.addEventListener('webglcontextlost', lost);
    canvas.addEventListener('webglcontextrestored', restored);
    cleanup = () => {
      canvas.removeEventListener('webglcontextlost', lost);
      canvas.removeEventListener('webglcontextrestored', restored);
      const geometries = new Set<BufferGeometry>();
      const materials = new Set<Material>();
      const textures = new Set<Texture>();
      world.traverse((object) => {
        if (object instanceof Mesh) {
          geometries.add(object.geometry);
          const list = Array.isArray(object.material) ? object.material : [object.material];
          list.forEach((material) => materials.add(material));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => {
        Object.values(material).forEach((value: unknown) => { if (value instanceof Texture) textures.add(value); });
        material.dispose();
      });
      textures.forEach((texture) => texture.dispose());
      environment?.dispose();
      renderer.dispose();
    };
    updateSize();
    void prepare();
  } catch {
    scope.postMessage({ type: 'error' });
  }
}

scope.onmessage = (event) => {
  if (disposed) return;
  const message = event.data;
  if (message.type === 'init') {
    state = message.state;
    size = message.size;
    visible = message.visible;
    initialize(message.canvas);
  } else if (message.type === 'update') {
    state = message.state;
    invalidate();
  } else if (message.type === 'resize') {
    size = message.size;
    updateSize?.();
  } else if (message.type === 'visibility') {
    visible = message.visible;
    if (visible) invalidate();
    else stop();
  } else if (message.type === 'dispose') {
    disposed = true;
    compileGeneration += 1;
    stop();
    cleanup?.();
    scope.close();
  }
};

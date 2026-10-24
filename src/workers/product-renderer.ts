import {
  ACESFilmicToneMapping, BufferGeometry, CanvasTexture, Color, DirectionalLight, HemisphereLight,
  Material, Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry,
  PMREMGenerator, Scene, SRGBColorSpace, Texture, Vector3, WebGLRenderer,
} from 'three';
import { loadProjector, type CinemaScene, type Finish } from '../lib/blender-projector';

export interface ProductState {
  scrollProgress: number;
  finish: Finish;
  scene: CinemaScene;
  motionEnabled: boolean;
}

interface Dimensions { width: number; height: number; dpr: number }

export type RendererInput =
  | { type: 'init'; canvas: OffscreenCanvas; state: ProductState; size: Dimensions; visible: boolean; modelUrl: string }
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
  // Studio lighting only: feathered softboxes keep clear optical glass from
  // reflecting hard, decal-like rectangles. No product geometry is made here.
  const softbox = new OffscreenCanvas(128, 128);
  const paint = softbox.getContext('2d');
  let softboxMap: CanvasTexture<OffscreenCanvas> | undefined;
  if (paint) {
    const falloff = paint.createRadialGradient(64, 64, 0, 64, 64, 64);
    falloff.addColorStop(0, '#ffffff');
    falloff.addColorStop(.62, '#ffffff');
    falloff.addColorStop(.82, '#9b9b9b');
    falloff.addColorStop(1, '#000000');
    paint.fillStyle = falloff;
    paint.fillRect(0, 0, 128, 128);
    softboxMap = new CanvasTexture(softbox);
    softboxMap.colorSpace = SRGBColorSpace;
  }
  const panels = [
    { color: '#ffffff', intensity: 6, position: [-4, 5, 2], scale: [3, 6] },
    { color: '#d9e5f4', intensity: 2.8, position: [5, 3, 1], scale: [2, 6] },
    { color: '#e4e8ef', intensity: 1.5, position: [0, 1, -5], scale: [6, 1.5] },
    { color: '#f3f5f8', intensity: 5, position: [-1, 3.5, 6], scale: [4.5, 2] },
    { color: '#c0d4ea', intensity: 1.8, position: [3, -2, 5], scale: [2, 0.6] },
    { color: '#eef3f8', intensity: 4, position: [-5, 0.8, 4], scale: [0.65, 3.6] },
  ];
  const materials: MeshBasicMaterial[] = [];
  for (const panel of panels) {
    const material = new MeshBasicMaterial({ color: new Color(panel.color).multiplyScalar(panel.intensity), map: softboxMap });
    const mesh = new Mesh(panelGeometry, material);
    mesh.position.set(panel.position[0], panel.position[1], panel.position[2]);
    mesh.scale.set(panel.scale[0], panel.scale[1], 1);
    mesh.lookAt(0, 0, 0);
    room.add(mesh);
    materials.push(material);
  }
  const generator = new PMREMGenerator(renderer);
  const target = generator.fromScene(room, 0, 0.1, 30, { size: 256 });
  generator.dispose();
  panelGeometry.dispose();
  materials.forEach((material) => material.dispose());
  softboxMap?.dispose();
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

async function initialize(canvas: OffscreenCanvas, modelUrl: string) {
  try {
    // Model data is loaded before creating the GPU context, so there is no
    // unhandled context-loss interval while a network request is pending.
    const projector = await loadProjector(modelUrl);
    if (disposed) return;
    const context = canvas.getContext('webgl2', { antialias: true, alpha: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true });
    if (!context) throw new Error('WebGL unavailable in this worker');
    const renderer = new WebGLRenderer({ canvas, context, antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    const world = new Scene();
    const camera = new PerspectiveCamera(33, 1, 0.1, 50);
    camera.position.set(0, 0.12, 9.6);
    camera.lookAt(new Vector3(0, 0, 0));
    world.add(projector.root);
    let environment: ReturnType<typeof studioEnvironment> | undefined;
    world.environmentIntensity = 1.4;
    world.add(new HemisphereLight('#d4dae2', '#17191d', 1));
    const key = new DirectionalLight('#f3f2ee', 2.3);
    key.position.set(-3, 5, 6);
    world.add(key);
    const fill = new DirectionalLight('#d7e2ee', .8);
    fill.position.set(5, 2, 4);
    world.add(fill);
    const frontFill = new DirectionalLight('#e1e8f0', 2.4);
    frontFill.position.set(-.5, 1, 7);
    world.add(frontFill);
    const rim = new DirectionalLight('#d8b69c', 1.9);
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
      const scale = pose.scale * fit;
      // The camera moves through the Blender-authored lens, whose center is
      // offset from the body's center. Keep that optical axis at screen center.
      const centeredX = 0.97 * scale;
      const centeredY = -0.08505 * scale;
      const positionX = pose.x * (portrait ? 0.35 : 1) + horizontalOffset;
      const positionY = pose.y + (portrait ? 0.46 : 0);
      const lensAlignment = approach * (1 - returnToObject);
      projector.root.position.set(positionX + (centeredX - positionX) * lensAlignment, positionY + (centeredY - positionY) * lensAlignment, 0);
      projector.root.rotation.set(pose.rx, pose.ry, pose.rz);
      projector.root.scale.setScalar(scale);
      if (lastFinish !== state.finish) { projector.setFinish(state.finish); lastFinish = state.finish; }
      if (lastScene !== state.scene) { projector.setScene(state.scene); lastScene = state.scene; }
      const cold = Math.min(1, currentProgress * 2);
      rim.color.setRGB(1 - cold * 0.25, 0.88 + cold * 0.04, 0.78 + cold * 0.22);
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
    void initialize(message.canvas, message.modelUrl);
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

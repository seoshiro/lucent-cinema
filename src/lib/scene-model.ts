import {
  BufferGeometry, CanvasTexture, CircleGeometry, Color, CylinderGeometry, Float32BufferAttribute, Group,
  InstancedMesh, Matrix4, Mesh, MeshBasicMaterial, MeshPhysicalMaterial,
  MeshStandardMaterial, Object3D, PlaneGeometry, RingGeometry,
  SRGBColorSpace, TorusGeometry,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export type Finish = 'graphite' | 'silver' | 'copper';
export type CinemaScene = 'aurora' | 'dune' | 'orbit';

export const finishColors: Record<Finish, string> = {
  graphite: '#47494b', silver: '#aeb0ad', copper: '#a86d4b',
};

export const sceneColors: Record<CinemaScene, string> = {
  aurora: '#52b8de', dune: '#f0ac72', orbit: '#8c90ff',
};

function canvasTexture(width: number, height: number, paint: (ctx: OffscreenCanvasRenderingContext2D) => void) {
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) return null;
  paint(context);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function lensTexture() {
  return canvasTexture(512, 512, (ctx) => {
    const optical = ctx.createRadialGradient(280, 210, 8, 256, 256, 250);
    optical.addColorStop(0, '#172e4b');
    optical.addColorStop(0.28, '#0c1935');
    optical.addColorStop(0.55, '#0c0c1c');
    optical.addColorStop(0.79, '#153440');
    optical.addColorStop(0.9, '#020810');
    optical.addColorStop(1, '#010306');
    ctx.fillStyle = optical;
    ctx.fillRect(0, 0, 512, 512);
    ctx.save();
    ctx.translate(256, 256);
    ctx.rotate(-0.45);
    const reflectedWindow = ctx.createLinearGradient(-220, -180, -65, 0);
    reflectedWindow.addColorStop(0, '#bfdcf255');
    reflectedWindow.addColorStop(0.4, '#75bce636');
    reflectedWindow.addColorStop(1, '#65cce500');
    ctx.fillStyle = reflectedWindow;
    ctx.fillRect(-205, -230, 114, 430);
    ctx.restore();
    ctx.strokeStyle = '#9bdbf252';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(256, 256, 226, 3.7, 5.7);
    ctx.stroke();
    ctx.strokeStyle = '#d6b7ff29';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(256, 256, 170, 0.1, 2.5);
    ctx.stroke();
  });
}

function labelTexture() {
  return canvasTexture(512, 128, (ctx) => {
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = '#c3c4bf';
    ctx.font = '500 53px Arial, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('L U C E N T', 4, 64);
  });
}

function convexOpticalSurface(radius: number) {
  const geometry = new BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const rings = 18;
  const segments = 96;
  for (let ring = 0; ring <= rings; ring += 1) {
    const r = ring / rings;
    for (let segment = 0; segment <= segments; segment += 1) {
      const angle = segment / segments * Math.PI * 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      positions.push(x * radius, y * radius, Math.sqrt(1 - r * r * 0.72) * 0.11);
      uvs.push(x * 0.5 + 0.5, y * 0.5 + 0.5);
      if (ring < rings && segment < segments) {
        const a = ring * (segments + 1) + segment;
        const b = a + segments + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function box(parent: Group, material: MeshStandardMaterial, dimensions: [number, number, number], position: [number, number, number], radius = 0.1) {
  const mesh = new Mesh(new RoundedBoxGeometry(...dimensions, 4, radius), material);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function cylinder(parent: Group, radius: number, depth: number, material: MeshStandardMaterial | MeshPhysicalMaterial, x: number, y: number, z: number) {
  const mesh = new Mesh(new CylinderGeometry(radius, radius, depth, 80, 1), material);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

export function createProjector() {
  const root = new Group();
  root.name = 'LUCENT original procedural cinema projector';
  const shell = new MeshStandardMaterial({ color: finishColors.graphite, metalness: 0.84, roughness: 0.31 });
  const edge = new MeshStandardMaterial({ color: '#858887', metalness: 0.95, roughness: 0.23 });
  const black = new MeshStandardMaterial({ color: '#101214', metalness: 0.58, roughness: 0.39 });
  const softBlack = new MeshStandardMaterial({ color: '#060708', metalness: 0.1, roughness: 0.7 });
  const opticalBlack = new MeshStandardMaterial({ color: '#0c1015', metalness: 0.87, roughness: 0.21 });
  const glass = new MeshPhysicalMaterial({
    color: '#93b5df', map: lensTexture(), metalness: 0.24, roughness: 0.09,
    clearcoat: 1, clearcoatRoughness: 0.04, iridescence: 0.38,
    iridescenceIOR: 1.38, iridescenceThicknessRange: [160, 360],
  });
  const blueGlass = new MeshStandardMaterial({ color: '#101d3c', metalness: 0.6, roughness: 0.12, emissive: '#122345', emissiveIntensity: 0.22 });
  const indicatorMaterial = new MeshBasicMaterial({ color: '#bcefe4' });

  // The continuous softly machined housing reads as one physical object.
  box(root, shell, [3.4, 2.3, 2.6], [0, 0, 0], 0.24);
  box(root, black, [3.23, 2.12, 0.12], [0, 0, 1.28], 0.2);
  box(root, shell, [3.27, 2.16, 0.07], [0, 0, 1.35], 0.19);
  box(root, black, [3.29, 0.045, 2.38], [0, 0.94, -0.02], 0.016);

  // A black inset reveals actual side cooling fins, rather than a printed grille.
  box(root, softBlack, [0.024, 1.48, 1.91], [1.704, -0.06, -0.08], 0.008);
  const fins = new InstancedMesh(new RoundedBoxGeometry(0.045, 1.48, 0.047, 2, 0.016), shell, 24);
  const transform = new Object3D();
  for (let index = 0; index < 24; index += 1) {
    transform.position.set(1.726, -0.06, -0.96 + index * 0.078);
    transform.updateMatrix();
    fins.setMatrixAt(index, transform.matrix);
  }
  root.add(fins);
  box(root, softBlack, [0.022, 1.32, 1.8], [-1.703, -0.08, -0.13], 0.008);
  const oppositeFins = new InstancedMesh(new RoundedBoxGeometry(0.044, 0.044, 1.77, 2, 0.012), shell, 17);
  for (let index = 0; index < 17; index += 1) {
    transform.position.set(-1.724, -0.68 + index * 0.073, -0.13);
    transform.updateMatrix();
    oppositeFins.setMatrixAt(index, transform.matrix);
  }
  root.add(oppositeFins);

  // Oversized optical assembly: nested anodized barrels and precision ridges.
  const lensX = -0.31;
  const lensY = -0.03;
  cylinder(root, 0.96, 0.12, black, lensX, lensY, 1.43);
  cylinder(root, 0.9, 0.21, opticalBlack, lensX, lensY, 1.55);
  const rings = new InstancedMesh(new TorusGeometry(0.88, 0.017, 6, 96), edge, 9);
  for (let index = 0; index < 9; index += 1) {
    const matrix = new Matrix4().makeTranslation(lensX, lensY, 1.47 + index * 0.025);
    rings.setMatrixAt(index, matrix);
  }
  root.add(rings);
  cylinder(root, 0.835, 0.065, black, lensX, lensY, 1.69);
  cylinder(root, 0.771, 0.04, blueGlass, lensX, lensY, 1.724);
  const innerRing = new Mesh(new RingGeometry(0.71, 0.77, 96), opticalBlack);
  innerRing.position.set(lensX, lensY, 1.751);
  root.add(innerRing);
  const opticalSurface = new Mesh(convexOpticalSurface(0.736), glass);
  opticalSurface.position.set(lensX, lensY, 1.745);
  root.add(opticalSurface);
  const opticalRim = new Mesh(new TorusGeometry(0.738, 0.008, 6, 96), edge);
  opticalRim.position.set(lensX, lensY, 1.781);
  root.add(opticalRim);

  // Laser range sensor, status diode, and recessed upper control dial.
  cylinder(root, 0.102, 0.025, black, 1.14, 0.55, 1.404);
  cylinder(root, 0.061, 0.026, blueGlass, 1.14, 0.55, 1.424);
  const indicator = new Mesh(new CircleGeometry(0.022, 16), indicatorMaterial);
  indicator.position.set(1.14, 0.25, 1.397);
  root.add(indicator);
  const dial = new Mesh(new CylinderGeometry(0.27, 0.27, 0.035, 64), black);
  dial.position.set(0.94, 1.157, -0.55);
  root.add(dial);
  const dialRim = new Mesh(new TorusGeometry(0.269, 0.008, 6, 64), edge);
  dialRim.rotation.x = Math.PI / 2;
  dialRim.position.set(0.94, 1.177, -0.55);
  root.add(dialRim);
  box(root, edge, [0.025, 0.004, 0.1], [0.94, 1.18, -0.66], 0.002);

  const label = new Mesh(new PlaneGeometry(0.7, 0.175), new MeshBasicMaterial({ map: labelTexture(), transparent: true, depthWrite: false }));
  label.position.set(0.84, -0.79, 1.394);
  root.add(label);
  for (const x of [-1.13, 1.13]) {
    for (const z of [-0.78, 0.78]) {
      const foot = new Mesh(new CylinderGeometry(0.13, 0.14, 0.12, 24), softBlack);
      foot.position.set(x, -1.18, z);
      root.add(foot);
    }
  }
  // Discreet rear connections make the rotating object complete from all views.
  box(root, black, [1.62, 0.3, 0.032], [0, -0.55, -1.302], 0.065);
  box(root, edge, [0.27, 0.09, 0.012], [-0.38, -0.55, -1.325], 0.018);
  box(root, black, [0.23, 0.055, 0.02], [-0.38, -0.55, -1.335], 0.012);
  box(root, edge, [0.15, 0.075, 0.012], [0.07, -0.55, -1.325], 0.027);
  box(root, black, [0.113, 0.042, 0.02], [0.07, -0.55, -1.335], 0.018);

  return {
    root,
    setFinish(finish: Finish) {
      shell.color.set(finishColors[finish]);
      shell.roughness = finish === 'silver' ? 0.27 : 0.31;
    },
    setScene(scene: CinemaScene) {
      blueGlass.emissive.set(sceneColors[scene]);
      glass.color.copy(new Color(sceneColors[scene])).lerp(new Color('#ffffff'), 0.55);
    },
  };
}

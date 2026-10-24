import { Color, Group, Mesh, MeshStandardMaterial, type Material } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type Finish = 'graphite' | 'silver' | 'copper';
export type CinemaScene = 'aurora' | 'dune' | 'orbit';

/** The projector geometry, optics and materials are authored in Blender. */
export async function loadProjector(url: string, signal?: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Projector model HTTP ' + response.status);
  const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), new URL('.', url).href);
  const root = new Group();
  root.name = 'LUCENT_Blender_Product';
  root.add(gltf.scene);
  const bodyMaterials = new Map<MeshStandardMaterial, Color>();
  const visit = (material: Material) => {
    if (material instanceof MeshStandardMaterial && material.name === 'body_finish') bodyMaterials.set(material, material.color.clone());
  };
  root.traverse(object => {
    if (object instanceof Mesh) (Array.isArray(object.material) ? object.material : [object.material]).forEach(visit);
  });
  if (!bodyMaterials.size) throw new Error('Blender model is missing body_finish');
  return {
    root,
    setFinish(finish: Finish) {
      bodyMaterials.forEach((original, material) => {
        if (finish === 'graphite') material.color.copy(original);
        else if (finish === 'silver') material.color.setRGB(.38, .4, .43);
        else material.color.setRGB(.28, .12, .055);
      });
    },
    setScene(scene: CinemaScene) {
      // The cinema artwork changes; real optical glass keeps its authored material.
      root.userData.cinemaScene = scene;
    },
  };
}

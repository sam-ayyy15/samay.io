import * as THREE from "three";
import config, { PartStyle } from "../config";

type StdMat = THREE.MeshStandardMaterial & Partial<THREE.MeshPhysicalMaterial>;

function styleMaterial(source: THREE.Material, style: PartStyle): THREE.Material {
  // Clone so meshes that share a material (e.g. cap crown + shoes) stay independent.
  const mat = source.clone() as StdMat;
  if (style.color && mat.color) mat.color = new THREE.Color(style.color);
  if (style.roughness !== undefined && "roughness" in mat) mat.roughness = style.roughness;
  if (style.metalness !== undefined && "metalness" in mat) mat.metalness = style.metalness;
  if (style.sheen !== undefined && "sheen" in mat) mat.sheen = style.sheen;
  if (style.sheenColor && mat.sheenColor && mat.sheen) {
    mat.sheenColor = new THREE.Color(style.sheenColor);
  }
  if (style.clearcoat !== undefined && "clearcoat" in mat) mat.clearcoat = style.clearcoat;
  return mat;
}

/** Applies config.parts to every matching mesh (including sub-meshes of groups). */
export function applyAppearance(character: THREE.Object3D) {
  Object.entries(config.parts).forEach(([name, style]) => {
    const root = character.getObjectByName(name);
    if (!root) {
      if (import.meta.env.DEV) console.warn(`[character] no mesh named "${name}"`);
      return;
    }
    if (style.visible === false) root.visible = false;
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || !mesh.material) return;
      mesh.material = Array.isArray(mesh.material)
        ? mesh.material.map((m) => styleMaterial(m, style))
        : styleMaterial(mesh.material, style);
    });
  });
}

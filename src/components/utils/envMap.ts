import * as THREE from "three";
import { RGBELoader } from "three-stdlib";

/**
 * The character scene and the tech-stack scene use the same HDR environment.
 * Decoding it is expensive (~300 KB of RGBE -> half floats on the main
 * thread), so it's loaded once and the texture is shared: a three.js Texture
 * can be used by several renderers, each uploads it to its own GPU context.
 */
let envPromise: Promise<THREE.DataTexture | null> | null = null;

export function loadEnvMap(): Promise<THREE.DataTexture | null> {
  if (!envPromise) {
    envPromise = new Promise((resolve) => {
      new RGBELoader().load(
        "/models/char_enviorment.hdr?v=2",
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          resolve(texture);
        },
        undefined,
        (err) => {
          console.error("Environment map failed to load:", err);
          resolve(null);
        }
      );
    });
  }
  return envPromise;
}

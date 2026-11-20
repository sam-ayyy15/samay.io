import * as THREE from "three";
import { DRACOLoader, GLTF, GLTFLoader } from "three-stdlib";
import { setCharTimeline, setAllTimeline } from "../../utils/GsapScroll";
import { decryptFile } from "./decrypt";
import { applyAppearance } from "./appearance";
import { addGlasses } from "./accessories";

const setCharacter = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) => {
  const loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  dracoLoader.setDecoderConfig({ type: "wasm" });
  // Spin up the Draco WASM worker while the model is still downloading.
  dracoLoader.preload();
  loader.setDRACOLoader(dracoLoader);

  const loadCharacter = (onProgress?: (fraction: number) => void) => {
    return new Promise<GLTF | null>(async (resolve, reject) => {
      try {
        // v=3: Draco-compressed model (2.34 MB -> 1.33 MB)
        const decrypted = await decryptFile(
          "/models/character.enc?v=3",
          "MyCharacter12",
          onProgress
        );

        let character: THREE.Object3D;
        loader.parse(
          decrypted,
          "",
          async (gltf) => {
            character = gltf.scene;
            // Look + accessories are defined in ../config.ts
            applyAppearance(character);
            addGlasses(character);
            await renderer.compileAsync(character, camera, scene);
            character.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) child.frustumCulled = true;
            });
            character!.getObjectByName("footR")!.position.y = 3.36;
            character!.getObjectByName("footL")!.position.y = 3.36;
            resolve(gltf);
            setCharTimeline(character, camera);
            setAllTimeline();

            // Monitor scale is handled by GsapScroll.ts animations

            dracoLoader.dispose();
          },
          (error) => {
            console.error("Error loading GLTF model:", error);
            reject(error);
          }
        );
      } catch (err) {
        reject(err);
        console.error(err);
      }
    });
  };

  return { loadCharacter };
};

export default setCharacter;

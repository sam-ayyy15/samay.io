import * as THREE from "three";
import { loadEnvMap } from "../../utils/envMap";
import { gsap } from "gsap";

const setLighting = (scene: THREE.Scene) => {
  // Red rim/key light to match the red & white theme
  const directionalLight = new THREE.DirectionalLight(0xff2d55, 0);
  directionalLight.intensity = 0;
  directionalLight.position.set(-0.47, -0.32, -1);
  // (shadow maps are never enabled on this renderer, so shadow setup was dead weight)
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0xff3a5c, 0, 100, 3);
  pointLight.position.set(3, 12, 4);
  scene.add(pointLight);

  // Resolves once the environment map is in place, so shaders can be
  // pre-compiled with it (adding it later forces a recompile on first use).
  const envReady = loadEnvMap().then((texture) => {
    if (!texture) return;
    scene.environment = texture;
    scene.environmentIntensity = 0;
    scene.environmentRotation.set(5.76, 85.85, 1);
  });

  function setPointLight(screenLight: any) {
    if (!screenLight) return;
    if (screenLight.material.opacity > 0.9) {
      pointLight.intensity = screenLight.material.emissiveIntensity * 20;
    } else {
      pointLight.intensity = 0;
    }
  }
  const duration = 2;
  const ease = "power2.inOut";
  function turnOnLights() {
    gsap.to(scene, {
      environmentIntensity: 0.64,
      duration: duration,
      ease: ease,
    });
    gsap.to(directionalLight, {
      intensity: 1,
      duration: duration,
      ease: ease,
    });
    gsap.to(".character-rim", {
      y: "55%",
      opacity: 1,
      delay: 0.2,
      duration: 2,
    });
  }

  return { setPointLight, turnOnLights, envReady };
};

export default setLighting;

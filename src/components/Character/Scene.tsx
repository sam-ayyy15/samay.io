import { useEffect, useRef } from "react";
import * as THREE from "three";
import setCharacter from "./utils/character";
import setLighting from "./utils/lighting";
import { useLoading } from "../../context/LoadingProvider";
import handleResize from "./utils/resizeUtils";
import {
  handleMouseMove,
  handleTouchEnd,
  handleTouchMove,
} from "./utils/mouseUtils";
import setAnimations from "./utils/animationUtils";
import { createRig, Rig } from "./utils/proceduralRig";
import { setProgress } from "../Loading";

// Rendering a full-viewport canvas at devicePixelRatio 2–3 is the single most
// expensive thing on retina / 4K screens. 1.5 is visually near-identical here.
const MAX_PIXEL_RATIO = 1.5;

const Scene = () => {
  const canvasDiv = useRef<HTMLDivElement | null>(null);
  const hoverDivRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef(new THREE.Scene());
  const { setLoading } = useLoading();

  useEffect(() => {
    const container = canvasDiv.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const aspect = rect.width / rect.height;
    const scene = sceneRef.current;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(rect.width, rect.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(14.5, aspect, 0.1, 1000);
    camera.position.set(0, 13.1, 24.7);
    camera.zoom = 1.1;
    camera.updateProjectionMatrix();

    let rig: Rig | null = null;
    let screenLight: any | null = null;
    let mixer: THREE.AnimationMixer | undefined;
    let character: THREE.Object3D | null = null;
    let disposed = false;
    let rafId = 0;
    let isVisible = true;
    let resizeTimer: number | undefined;
    const timers: number[] = [];

    const clock = new THREE.Clock();
    const light = setLighting(scene);
    const progress = setProgress((value) => setLoading(value));
    const { loadCharacter } = setCharacter(renderer, scene, camera);

    const onResize = () => {
      // Keep the canvas size in sync cheaply, debounce the expensive timeline rebuild.
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (character) handleResize(renderer, camera, canvasDiv, character);
      }, 150);
    };

    loadCharacter(progress.report)
      .catch((err) => {
        // Never leave visitors stuck on the loading screen: if the model
        // fails (network, decoder…), finish loading and show the site anyway.
        console.error("Character failed to load:", err);
        if (!disposed) progress.clear();
        return null;
      })
      .then((gltf) => {
      if (!gltf || disposed) return;
      const animations = setAnimations(gltf);
      hoverDivRef.current && animations.hover(gltf, hoverDivRef.current);
      mixer = animations.mixer;
      character = gltf.scene;
      scene.add(character);
      rig = createRig({
        character,
        mixer,
        introAction: animations.introAction,
        typingAction: animations.typingAction,
      });
      // Dev-only handle for poking at the scene from the console.
      // Warm-up: compile every shader and upload every texture now, while the
      // loading screen is up. Otherwise parts that first appear mid-scroll
      // (desk, monitor, screen light) compile on first use and freeze scrolling.
      light.envReady.then(async () => {
        if (disposed || !character) return;
        renderer.render(scene, camera); // builds the env-map PMREM once
        await renderer.compileAsync(scene, camera);
        character.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((mat) => {
            Object.values(mat).forEach((v) => {
              if (v && (v as THREE.Texture).isTexture) renderer.initTexture(v as THREE.Texture);
            });
          });
        });
      });
      if (import.meta.env.DEV)
        Object.assign(window, { __char: { character, scene, camera, renderer, THREE, mixer, rig } });
      screenLight = character.getObjectByName("screenlight") || null;
      progress.loaded().then(() => {
        timers.push(
          window.setTimeout(() => {
            light.turnOnLights();
            rig?.start();
            animations.startIntro();
          }, 1000)
        );
      });
      window.addEventListener("resize", onResize);
    });

    let mouse = { x: 0, y: 0 };

    const onMouseMove = (event: MouseEvent) => {
      handleMouseMove(event, (x, y) => (mouse = { x, y }));
    };
    const onTouchMove = (e: TouchEvent) =>
      handleTouchMove(e, (x, y) => (mouse = { x, y }));

    let debounce: number | undefined;
    let touchTarget: HTMLElement | null = null;
    const onTouchStart = (event: TouchEvent) => {
      const element = event.target as HTMLElement;
      window.clearTimeout(debounce);
      debounce = window.setTimeout(() => {
        // previously a NEW anonymous listener was added on every touch and never removed
        touchTarget?.removeEventListener("touchmove", onTouchMove);
        touchTarget = element;
        element?.addEventListener("touchmove", onTouchMove, { passive: true });
      }, 200);
    };

    const onTouchEnd = () => {
      // The rig's springs handle easing back to centre.
      handleTouchEnd((x, y) => {
        mouse = { x, y };
      });
    };

    document.addEventListener("mousemove", onMouseMove, { passive: true });
    // Click / tap the face for a reaction.
    const hoverDiv = hoverDivRef.current;
    const onPoke = () => rig?.react();
    hoverDiv?.addEventListener("pointerdown", onPoke);

    const landingDiv = document.getElementById("landingDiv");
    if (landingDiv) {
      landingDiv.addEventListener("touchstart", onTouchStart, { passive: true });
      landingDiv.addEventListener("touchend", onTouchEnd, { passive: true });
    }

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      // Cap the step so a hitch (GC, tab switch, heavy scroll) doesn't make
      // the animation lurch forward.
      const delta = Math.min(clock.getDelta(), 0.1);
      // Skip all GPU work while the character is scrolled out of view.
      if (!isVisible) return;
      if (screenLight) light.setPointLight(screenLight);
      rig?.beforeMixer(delta, mouse);
      if (mixer) mixer.update(delta);
      rig?.afterMixer();
      renderer.render(scene, camera);
      rig?.afterRender();
    };
    animate();

    // IntersectionObserver accounts for the GSAP transforms that slide the
    // model off-screen, so this pauses rendering once you scroll past it.
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) clock.getDelta(); // avoid a giant animation jump on resume
      },
      { threshold: 0 }
    );
    observer.observe(container);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.clearTimeout(debounce);
      window.clearTimeout(resizeTimer);
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("resize", onResize);
      document.removeEventListener("mousemove", onMouseMove);
      hoverDiv?.removeEventListener("pointerdown", onPoke);
      rig?.dispose();
      touchTarget?.removeEventListener("touchmove", onTouchMove);
      if (landingDiv) {
        landingDiv.removeEventListener("touchstart", onTouchStart);
        landingDiv.removeEventListener("touchend", onTouchEnd);
      }
      scene.clear();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <>
      <div className="character-container">
        <div className="character-model" ref={canvasDiv}>
          <div className="character-rim"></div>
          <div className="character-hover" ref={hoverDivRef}></div>
        </div>
      </div>
    </>
  );
};

export default Scene;

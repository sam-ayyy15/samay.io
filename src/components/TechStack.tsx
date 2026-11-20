import * as THREE from "three";
import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { loadEnvMap } from "./utils/envMap";
import { Environment } from "@react-three/drei";
import { EffectComposer, N8AO } from "@react-three/postprocessing";
import {
  BallCollider,
  Physics,
  RigidBody,
  CylinderCollider,
  RapierRigidBody,
} from "@react-three/rapier";

const textureLoader = new THREE.TextureLoader();
const imageUrls = [
  "/images/python.webp",
  "/images/power_bi.webp",
  "/images/mysql.webp",
  "/images/r.webp",
  "/images/ml.webp",
];

// Tools from the resume without a logo asset: drawn once into a canvas
// (no network requests), in the cherry / porcelain palette.
const labelTools = [
  "PySpark", "Airflow", "Kafka", "Databricks", "dbt",
  "AWS", "Docker", "Postgres", "DuckDB", "SQL",
];
function makeLabelTexture(text: string, cherry: boolean) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = cherry ? "#D2042D" : "#FBF6F4";
  g.fillRect(0, 0, 512, 256);
  g.fillStyle = cherry ? "#FFFFFF" : "#D2042D";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const size = text.length > 7 ? 34 : 44;
  g.font = `800 ${size}px Syne, Manrope, sans-serif`;
  // drawn twice around the sphere so a label is visible from both sides
  g.fillText(text, 128, 128);
  g.fillText(text, 384, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

const textures = [
  ...imageUrls.map((url) => textureLoader.load(url)),
  ...labelTools.map((t, i) => makeLabelTexture(t, i % 2 === 0)),
];

const sphereGeometry = new THREE.SphereGeometry(1, 28, 28);

// Material index is picked ONCE here. It used to be Math.random() inside render,
// so every re-render (e.g. isActive toggling) reshuffled all sphere textures.
const spheres = [...Array(30)].map(() => ({
  scale: [0.7, 1, 0.8, 1, 1][Math.floor(Math.random() * 5)],
  materialIndex: Math.floor(Math.random() * textures.length),
}));

const scratchVec = new THREE.Vector3();

type SphereProps = {
  vec?: THREE.Vector3;
  scale: number;
  r?: typeof THREE.MathUtils.randFloatSpread;
  material: THREE.MeshPhysicalMaterial;
  isActive: boolean;
};

function SphereGeo({
  vec = new THREE.Vector3(),
  scale,
  r = THREE.MathUtils.randFloatSpread,
  material,
  isActive,
}: SphereProps) {
  const api = useRef<RapierRigidBody | null>(null);

  useFrame((_state, delta) => {
    if (!isActive) return;
    if (!api.current) return;
    delta = Math.min(0.1, delta);
    const impulse = vec
      .copy(api.current.translation())
      .normalize()
      .multiply(
        scratchVec.set(-50 * delta * scale, -150 * delta * scale, -50 * delta * scale)
      );

    api.current?.applyImpulse(impulse, true);
  });

  return (
    <RigidBody
      linearDamping={0.75}
      angularDamping={0.15}
      friction={0.2}
      position={[r(20), r(20) - 25, r(20) - 10]}
      ref={api}
      colliders={false}
    >
      <BallCollider args={[scale]} />
      <CylinderCollider
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 1.2 * scale]}
        args={[0.15 * scale, 0.275 * scale]}
      />
      <mesh
        scale={scale}
        geometry={sphereGeometry}
        material={material}
        rotation={[0.3, 1, 1]}
      />
    </RigidBody>
  );
}

type PointerProps = {
  vec?: THREE.Vector3;
  isActive: boolean;
};

function Pointer({ vec = new THREE.Vector3(), isActive }: PointerProps) {
  const ref = useRef<RapierRigidBody>(null);

  useFrame(({ pointer, viewport }) => {
    if (!isActive) return;
    const targetVec = vec.lerp(
      scratchVec.set(
        (pointer.x * viewport.width) / 2,
        (pointer.y * viewport.height) / 2,
        0
      ),
      0.2
    );
    ref.current?.setNextKinematicTranslation(targetVec);
  });

  return (
    <RigidBody
      position={[100, 100, 100]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[2]} />
    </RigidBody>
  );
}

/**
 * Renders a few frames as soon as everything is mounted (env map included),
 * so all shaders - including the post-processing passes - compile now, while
 * the section is still off screen, instead of on the first visible frame.
 */
function WarmUp() {
  const { advance, gl, scene, camera } = useThree();
  useEffect(() => {
    // The spheres start off screen, so a normal render skips them. compile()
    // ignores visibility: it builds every shader and the env-map PMREM now.
    gl.compile(scene, camera);
    scene.traverse((obj) => {
      const mat = (obj as THREE.Mesh).material as THREE.MeshPhysicalMaterial | undefined;
      if (mat?.map) gl.initTexture(mat.map);
    });
    // Then a couple of real frames through the post-processing pipeline, with
    // culling off so the off-screen spheres are drawn (their render-target
    // shader variant differs from what compile() builds).
    const culled: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && o.frustumCulled) {
        o.frustumCulled = false;
        culled.push(o);
      }
    });
    const restore = () => culled.forEach((o) => (o.frustumCulled = true));
    let frames = 2;
    let id = 0;
    const step = () => {
      advance(performance.now());
      if (--frames > 0) id = requestAnimationFrame(step);
      else restore();
    };
    id = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(id);
      restore();
    };
  }, [advance, gl, scene, camera]);
  return null;
}

const TechStack = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [envMap, setEnvMap] = useState<THREE.Texture | null>(null);

  // Reuse the HDR the character already decoded instead of parsing it again.
  useEffect(() => {
    let alive = true;
    loadEnvMap().then((tex) => alive && setEnvMap(tex));
    return () => {
      alive = false;
    };
  }, []);

  // Run physics + rendering only while the section is on screen.
  // (Before: a scroll listener + the canvas rendered every frame forever.)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsActive(entry.isIntersecting),
      { rootMargin: "100px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const materials = useMemo(() => {
    return textures.map(
      (texture) =>
        new THREE.MeshPhysicalMaterial({
          map: texture,
          emissive: "#ffffff",
          emissiveMap: texture,
          emissiveIntensity: 0.25,
          metalness: 0.5,
          roughness: 1,
          clearcoat: 0.1,
        })
    );
  }, []);

  return (
    <div className="techstack" ref={containerRef}>
      <h2>
        My <span>Techstack</span>
      </h2>

      <Canvas
        frameloop={isActive ? "always" : "never"}
        // Don't re-measure on scroll: ScrollSmoother moves the page with
        // transforms, so every scroll looked like a "resize" and R3F called
        // gl.setSize(), reallocating the whole drawing buffer mid-scroll.
        resize={{ scroll: false, debounce: { scroll: 0, resize: 150 } }}
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          stencil: false,
          depth: false,
          antialias: false,
          powerPreference: "high-performance",
        }}
        camera={{ position: [0, 0, 20], fov: 32.5, near: 1, far: 100 }}
        onCreated={(state) => (state.gl.toneMappingExposure = 1.5)}
        className="tech-canvas"
      >
        <ambientLight intensity={1} />
        <spotLight
          position={[20, 20, 25]}
          penumbra={1}
          angle={0.2}
          color="white"
        />
        <directionalLight position={[0, 5, -4]} intensity={2} />
        <Physics gravity={[0, 0, 0]}>
          <Pointer isActive={isActive} />
          {spheres.map((props, i) => (
            <SphereGeo
              key={i}
              {...props}
              material={materials[props.materialIndex]}
              isActive={isActive}
            />
          ))}
        </Physics>
        {envMap && (
          <>
            <Environment
              map={envMap}
              environmentIntensity={0.5}
              environmentRotation={[0, 4, 2]}
            />
            <WarmUp />
          </>
        )}
        <EffectComposer enableNormalPass={false}>
          <N8AO color="#3d0512" aoRadius={2} intensity={1.15} halfRes />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default TechStack;

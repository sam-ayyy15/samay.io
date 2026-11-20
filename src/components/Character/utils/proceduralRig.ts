import * as THREE from "three";
import config from "../config";
import { eyebrowBoneNames } from "../../../data/boneData";

/**
 * Procedural "life" layer that runs on top of the baked GLTF clips.
 *
 * - Spring-driven head look (overshoot + settle instead of a linear lerp)
 * - Attention states: watches the cursor -> drifts back to focused work when
 *   the pointer is idle -> occasionally pauses typing to "think"
 * - Natural, randomised blinking (with double blinks and blinks on fast turns)
 * - Breathing + subtle torso sway
 * - Click / tap reaction ("boop")
 *
 * Frame order (see Scene.tsx):
 *   rig.beforeMixer(dt, pointer) -> mixer.update(dt) -> rig.afterMixer()
 *   -> renderer.render() -> rig.afterRender()
 *
 * Additive offsets are applied after the mixer and reverted after rendering,
 * so they never accumulate and never fight the baked clips or GSAP tweens.
 */

type Pointer = { x: number; y: number };
type State = "attentive" | "focus" | "think";

class Spring {
  v = 0;
  constructor(public x = 0, public k = 40, public damping = 0.75) {}
  step(target: number, dt: number) {
    const c = 2 * Math.sqrt(this.k) * this.damping;
    // Fixed-size substeps keep it stable even at very low frame rates.
    const n = Math.max(1, Math.ceil(dt * 120));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      this.v += (this.k * (target - this.x) - c * this.v) * h;
      this.x += this.v * h;
    }
    return this.x;
  }
}

/** Cheap smooth 1D noise (sum of incommensurate sines), roughly -1..1. */
const noise = (t: number, seed = 0) =>
  (Math.sin(t * 0.73 + seed) * 0.5 +
    Math.sin(t * 1.37 + seed * 2.1) * 0.3 +
    Math.sin(t * 2.91 + seed * 3.7) * 0.2);

const rand = (a: number, b: number) => a + Math.random() * (b - a);

export type Rig = ReturnType<typeof createRig>;

export function createRig(opts: {
  character: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  introAction: THREE.AnimationAction | null;
  typingAction: THREE.AnimationAction | null;
}) {
  const { character, mixer, introAction, typingAction } = opts;
  const m = config.motion;
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const bone = (n: string) => character.getObjectByName(n) ?? null;
  const head = bone("spine006");
  const neck = bone("spine005");
  const chest = bone("spine003");
  const lowerSpine = bone("spine001");
  const shoulderL = bone("shoulderL");
  const shoulderR = bone("shoulderR");

  // Blink morphs (the baked "Blink" clip drives these two together).
  const face = character.getObjectByName("Face002") as THREE.Mesh | undefined;
  const dict = face?.morphTargetDictionary ?? {};
  const blinkIdx = ["Key 2", "eyeL_100"].map((k) => dict[k]).filter((i) => i !== undefined);

  // Eyebrow bones, raised directly for clear expressions.
  const [browL, browR] = eyebrowBoneNames.map(bone);

  // Read scroll/viewport from events, not every frame: reading window.scrollY
  // while GSAP is animating forces a synchronous layout (a real frame-time cost).
  let scrollY = window.scrollY;
  let isDesktop = window.innerWidth > 1024;
  const onScroll = () => (scrollY = window.scrollY);
  const onResize = () => (isDesktop = window.innerWidth > 1024);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });

  // ---- state ----
  let started = false;
  let active = false; // true once the intro has finished
  let time = 0;
  let lastDt = 1 / 60;
  let state: State = "attentive";
  let stateTime = 0;
  let lastPointer: Pointer = { x: 0, y: 0 };
  let sincePointer = 0;
  let nextThink = rand(m.thinkEvery * 0.6, m.thinkEvery * 1.4);
  let thinkSide = 1;
  let thinkDuration = 3;

  const yaw = new Spring(0, m.lookStiffness, m.lookDamping);
  const pitch = new Spring(0, m.lookStiffness, m.lookDamping);
  const roll = new Spring(0, 18, 0.8);
  const lean = new Spring(0, 60, 0.35); // reaction lean, bouncy on purpose
  let baseRoll = 0;

  let typingWeight = 1;
  let browWeight = 0;
  let browTarget = 0;
  let browHold = 0; // seconds a reaction keeps the brows up
  let pauseTyping = 0; // seconds remaining of a forced typing pause

  // blink
  let nextBlink = rand(...m.blinkInterval);
  let blinkT = -1; // <0 = not blinking
  let queuedBlink = false;
  let blinkCooldown = 0;
  let lastYawTarget = 0;

  const BLINK_CLOSE = 0.07;
  const BLINK_HOLD = 0.04;
  const BLINK_OPEN = 0.13;
  const blinkWeight = (t: number) => {
    if (t < BLINK_CLOSE) return t / BLINK_CLOSE;
    if (t < BLINK_CLOSE + BLINK_HOLD) return 1;
    const o = (t - BLINK_CLOSE - BLINK_HOLD) / BLINK_OPEN;
    return o >= 1 ? 0 : 1 - o * o * (3 - 2 * o);
  };
  const blink = () => {
    if (blinkT >= 0) return;
    blinkT = 0;
    queuedBlink = Math.random() < m.doubleBlinkChance;
  };

  // bones we offset after the mixer, with their pre-offset pose for revert
  const saved = new Map<THREE.Object3D, THREE.Quaternion>();
  const savedPos = new Map<THREE.Object3D, THREE.Vector3>();
  const addLift = (b: THREE.Object3D | null, dy: number) => {
    if (!b || dy === 0) return;
    if (!savedPos.has(b)) savedPos.set(b, b.position.clone());
    b.position.y += dy;
  };
  const tmpQ = new THREE.Quaternion();
  const tmpE = new THREE.Euler();
  const addOffset = (b: THREE.Object3D | null, x: number, y: number, z: number) => {
    if (!b || (x === 0 && y === 0 && z === 0)) return;
    if (!saved.has(b)) saved.set(b, b.quaternion.clone());
    b.quaternion.multiply(tmpQ.setFromEuler(tmpE.set(x, y, z)));
  };

  const onFinished = (e: THREE.Event & { action?: THREE.AnimationAction }) => {
    if (started && e.action === introAction && head) {
      active = true;
      // Continue from wherever the intro left the head: no snapping.
      yaw.x = head.rotation.y;
      pitch.x = head.rotation.x;
      baseRoll = head.rotation.z;
      roll.x = 0;
    }
  };
  mixer.addEventListener("finished", onFinished);

  function setState(s: State) {
    if (state === s) return;
    state = s;
    stateTime = 0;
    if (s === "think") {
      thinkSide = Math.random() < 0.5 ? -1 : 1;
      thinkDuration = rand(2.2, 3.6);
      browTarget = 1;
      blink();
    } else if (browHold <= 0) {
      browTarget = 0;
    }
    if (s === "focus") nextThink = rand(m.thinkEvery * 0.6, m.thinkEvery * 1.4);
  }

  return {
    /** Call when the intro starts; blinking begins right away. */
    start() {
      started = true;
      active = false;
    },

    /** Make him pause and think (also happens on its own while idle). */
    think() {
      if (active && scrollY < 200) {
        sincePointer = m.idleToFocus;
        setState("think");
      }
    },

    /** Poke the character (click/tap on the face). */
    react() {
      if (!active) return;
      pitch.v -= 4.5; // head kicks up/back
      yaw.v += rand(-2.5, 2.5);
      lean.v -= 3.5;
      roll.v += rand(-1.5, 1.5);
      pauseTyping = 0.9;
      blinkT = -1;
      blink();
      sincePointer = 0;
      setState("attentive");
      browTarget = 1;
      browHold = 1;
    },

    beforeMixer(dt: number, pointer: Pointer) {
      // Timers use real time (so idle/think timing is right on slow devices);
      // motion uses a capped step so a dropped frame never causes a jump.
      dt = Math.min(dt, 0.25);
      const mdt = Math.min(dt, 1 / 20);
      lastDt = Math.min(dt, 1 / 20);
      time += dt;
      stateTime += dt;

      // ---- blinking (starts with the intro, like the old looped clip) ----
      if (started) {
        blinkCooldown -= dt;
        if (blinkT >= 0) {
          // Capped step: on very slow frames a blink still shows as closed.
          blinkT += Math.min(dt, 0.06);
          if (blinkT > BLINK_CLOSE + BLINK_HOLD + BLINK_OPEN) {
            blinkT = -1;
            if (queuedBlink) {
              queuedBlink = false;
              nextBlink = 0.12;
            } else nextBlink = rand(...m.blinkInterval);
          }
        } else if ((nextBlink -= dt) <= 0) blink();
      }

      if (!active || !head) return;

      // ---- attention state machine ----
      const moved = Math.abs(pointer.x - lastPointer.x) + Math.abs(pointer.y - lastPointer.y) > 0.002;
      lastPointer = { ...pointer };
      sincePointer = moved ? 0 : sincePointer + dt;

      const scrolled = scrollY >= 200;
      if (scrolled) {
        if (state === "think") setState("focus");
      } else if (moved) {
        setState("attentive");
      } else if (state === "attentive" && sincePointer > m.idleToFocus) {
        setState("focus");
      } else if (state === "focus" && !reduced && (nextThink -= dt) <= 0) {
        setState("think");
      } else if (state === "think" && stateTime > thinkDuration) {
        setState("focus");
      }

      // ---- head look targets ----
      const maxRot = Math.PI / 6;
      let ty: number, tx: number, tz = 0;
      if (scrolled) {
        if (isDesktop) {
          ty = -0.3;
          tx = -0.4;
        } else {
          ty = yaw.x;
          tx = pitch.x;
        }
      } else if (state === "attentive") {
        // Same mapping the site always used, now spring-driven.
        ty = pointer.x * maxRot;
        tx = THREE.MathUtils.clamp(-pointer.y, -maxRot, 0.3) - 0.5 * maxRot;
        // tiny saccade-like drift so he never looks frozen
        ty += noise(time * 1.7, 3) * 0.015;
        tx += noise(time * 1.3, 7) * 0.012;
      } else if (state === "focus") {
        ty = -0.06 + noise(time * 0.35, 1) * 0.12;
        tx = 0.0 + noise(time * 0.5, 5) * 0.05;
      } else {
        // think: glance up and to the side, slight head tilt
        const ramp = Math.min(stateTime / 0.6, 1);
        ty = thinkSide * 0.32 * ramp;
        tx = -0.62 * ramp + 0.1 * (1 - ramp);
        tz = -thinkSide * 0.09 * ramp;
      }

      // People blink when they snap their gaze somewhere new.
      if (Math.abs(ty - lastYawTarget) > 0.25 && blinkCooldown <= 0) {
        blink();
        blinkCooldown = 1.2;
      }
      lastYawTarget = ty;

      if (reduced) {
        yaw.k = pitch.k = 12;
        yaw.damping = pitch.damping = 1;
      }
      head.rotation.y = yaw.step(ty, mdt);
      head.rotation.x = pitch.step(tx, mdt);
      head.rotation.z = baseRoll + roll.step(tz, mdt);

      // ---- typing rhythm ----
      if (typingAction) {
        pauseTyping = Math.max(0, pauseTyping - dt);
        // Steady rhythm (varying the speed read as stutter); typing only
        // fades out for "think" pauses and reactions.
        let wTarget = 1;
        if (!scrolled && state === "think") wTarget = 0;
        if (pauseTyping > 0) wTarget = 0;
        typingWeight += (wTarget - typingWeight) * Math.min(mdt * 6, 1);
        typingAction.setEffectiveWeight(typingWeight);
        typingAction.timeScale = 1.2;
      }

      // ---- brows ----
      if (browHold > 0 && (browHold -= dt) <= 0 && state !== "think") browTarget = 0;
      browWeight += (browTarget - browWeight) * Math.min(mdt * 8, 1);
    },

    afterMixer() {
      // Blink morphs (mixer no longer drives them).
      if (face?.morphTargetInfluences && blinkIdx.length) {
        const w = blinkT >= 0 ? blinkWeight(blinkT) : 0;
        blinkIdx.forEach((i) => (face.morphTargetInfluences![i] = w));
      }
      if (!active) return;

      const b = reduced ? 0.4 : m.breathAmount;
      const phase = time * (m.breathRate / 60) * Math.PI * 2;
      const breath = Math.sin(phase);
      const inhale = Math.max(0, Math.sin(phase)); // shoulders only rise

      const leanX = lean.step(0, lastDt);
      addOffset(chest, -0.018 * b * breath + leanX * 0.12, 0, 0);
      addOffset(shoulderL, 0, 0, 0.012 * b * inhale);
      addOffset(shoulderR, 0, 0, -0.012 * b * inhale);
      if (!reduced) {
        addOffset(lowerSpine, noise(time * 0.4, 2) * 0.01, noise(time * 0.3, 9) * 0.018, noise(time * 0.35, 4) * 0.008);
      }
      // Brows: both up when surprised; one higher (quizzical) when thinking.
      if (browWeight > 0.001) {
        const lift = 0.09 * browWeight;
        const quiz = state === "think" ? 0.5 : 0;
        addLift(browL, lift * (thinkSide > 0 ? 1 : 1 - quiz));
        addLift(browR, lift * (thinkSide > 0 ? 1 - quiz : 1));
      }

      // Neck shares a little of the head turn for a more natural silhouette.
      if (scrollY < 200) addOffset(neck, 0, yaw.x * 0.18, 0);
    },

    afterRender() {
      saved.forEach((q, b) => b.quaternion.copy(q));
      saved.clear();
      savedPos.forEach((p, b) => b.position.copy(p));
      savedPos.clear();
    },

    /** Snapshot for debugging / tests. */
    debug() {
      return { started, active, state, stateTime, blinkT, nextBlink, sincePointer };
    },

    dispose() {
      mixer.removeEventListener("finished", onFinished);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    },
  };
}

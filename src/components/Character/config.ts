/**
 * Character customization — edit this file to restyle the 3D character.
 *
 * Mesh names here are the names three.js gives them after loading (dots are
 * stripped, so "BODY.SHIRT" becomes "BODYSHIRT"). Colors accept any CSS color.
 */

export type PartStyle = {
  color?: string;
  roughness?: number;
  metalness?: number;
  /** Fabric sheen 0..1 (soft velvet-like edge highlight). */
  sheen?: number;
  /** Fabric sheen tint (only used when sheen > 0). */
  sheenColor?: string;
  clearcoat?: number;
  visible?: boolean;
};

export type CharacterConfig = {
  /** Keys are mesh (or group) names; every sub-mesh of a group gets the style. */
  parts: Record<string, PartStyle>;
  glasses: {
    enabled: boolean;
    frameColor: string;
    lensTint: string;
    /** 0 = clear, 1 = fully tinted */
    lensOpacity: number;
    /** Overall frame size multiplier. */
    scale: number;
  };
  motion: {
    /** Seconds between blinks (random within range). */
    blinkInterval: [number, number];
    /** Chance a blink is a quick double-blink. */
    doubleBlinkChance: number;
    /** Breaths per minute. */
    breathRate: number;
    /** 0..1 strength of chest/shoulder breathing. */
    breathAmount: number;
    /** Seconds of no pointer movement before he goes back to focused work. */
    idleToFocus: number;
    /** Average seconds between "thinking" pauses while focused. */
    thinkEvery: number;
    /** Spring stiffness of the head following the cursor (higher = snappier). */
    lookStiffness: number;
    /** 0..1, 1 = critically damped (no overshoot). */
    lookDamping: number;
  };
};

const config: CharacterConfig = {
  parts: {
    BODYSHIRT: { color: "#C2032A", roughness: 0.85, sheen: 0.6, sheenColor: "#ff6b81" },
    Pant: { color: "#1A0E12", roughness: 0.9 },
    CAP001: { color: "#1A0E12", roughness: 0.95, clearcoat: 0 }, // crown
    CAP002: { color: "#C2032A", roughness: 0.5, clearcoat: 0.4 }, // brim
    Shoe: { color: "#F6F1F1", roughness: 0.6 },
    Sole: { color: "#1A0E12" },
    Hair: { color: "#14090c" },
    Eyebrow: { color: "#14090c" },
  },
  glasses: {
    enabled: true,
    frameColor: "#1A0E12",
    lensTint: "#fff1f3",
    lensOpacity: 0.12,
    scale: 1,
  },
  motion: {
    blinkInterval: [2.2, 5.5],
    doubleBlinkChance: 0.2,
    breathRate: 14,
    breathAmount: 1,
    idleToFocus: 3.5,
    thinkEvery: 11,
    lookStiffness: 38,
    lookDamping: 0.72,
  },
};

export default config;

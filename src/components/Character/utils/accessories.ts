import * as THREE from "three";
import config from "../config";

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/**
 * Builds a pair of glasses sized from the character's eye mesh and rigidly
 * attaches them to the head bone, so they follow every head movement.
 * Must run while the character is still in its rest pose (right after load).
 */
export function addGlasses(character: THREE.Object3D) {
  const g = config.glasses;
  if (!g.enabled) return null;
  const eyes = character.getObjectByName("EYEs001");
  const face = character.getObjectByName("Face002");
  const head = character.getObjectByName("spine006");
  if (!eyes || !face || !head) return null;

  character.updateMatrixWorld(true);
  const eyeBox = new THREE.Box3().setFromObject(eyes, true);
  const faceBox = new THREE.Box3().setFromObject(face, true);
  const eyeSize = eyeBox.getSize(new THREE.Vector3());
  const eyeCenter = eyeBox.getCenter(new THREE.Vector3());

  const s = g.scale;
  const lensW = (eyeSize.x / 2) * 0.8 * s;
  const lensH = eyeSize.y * 1.12 * s;
  const rim = 0.06 * s;
  const offsetX = eyeSize.x / 4 + 0.07;
  const frontZ = eyeBox.max.z + 0.11;
  const wrap = 0.2; // frames angle back to follow the round head

  const frameMat = new THREE.MeshPhysicalMaterial({
    color: g.frameColor,
    roughness: 0.32,
    metalness: 0.1,
    clearcoat: 0.8,
    clearcoatRoughness: 0.2,
  });
  const lensMat = new THREE.MeshPhysicalMaterial({
    color: g.lensTint,
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: g.lensOpacity,
    depthWrite: false,
  });

  const outer = roundedRect(lensW + rim * 2, lensH + rim * 2, Math.min(lensH, lensW) * 0.42 + rim);
  outer.holes.push(roundedRect(lensW, lensH, Math.min(lensH, lensW) * 0.42));
  const frameGeo = new THREE.ExtrudeGeometry(outer, {
    depth: 0.05 * s,
    bevelEnabled: true,
    bevelThickness: 0.02 * s,
    bevelSize: 0.018 * s,
    bevelSegments: 3,
    curveSegments: 20,
  });
  frameGeo.translate(0, 0, -0.025 * s);
  const lensGeo = new THREE.ShapeGeometry(roundedRect(lensW, lensH, Math.min(lensH, lensW) * 0.42), 20);

  const glasses = new THREE.Group();
  glasses.name = "glasses";

  const outerEdge: THREE.Vector3[] = [];
  [-1, 1].forEach((side) => {
    const lens = new THREE.Group();
    lens.position.set(eyeCenter.x + side * offsetX, eyeCenter.y + 0.02, frontZ);
    lens.rotation.y = side * wrap;
    lens.add(new THREE.Mesh(frameGeo, frameMat));
    const glass = new THREE.Mesh(lensGeo, lensMat);
    glass.renderOrder = 2;
    lens.add(glass);
    glasses.add(lens);
    lens.updateMatrix();
    outerEdge.push(new THREE.Vector3(side * (lensW / 2 + rim * 0.6), lensH * 0.22, 0).applyMatrix4(lens.matrix));
  });

  // Bridge: a small arch between the two frames.
  const innerL = new THREE.Vector3(eyeCenter.x - offsetX + lensW / 2 + rim * 0.5, eyeCenter.y + lensH * 0.12, frontZ + 0.02);
  const innerR = innerL.clone().setX(eyeCenter.x + offsetX - lensW / 2 - rim * 0.5);
  const bridgeTop = innerL.clone().lerp(innerR, 0.5).add(new THREE.Vector3(0, 0.07, 0.05));
  const bridge = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(innerL, bridgeTop, innerR), 16, 0.032 * s, 8),
    frameMat
  );
  glasses.add(bridge);

  // Temples: hug the side of the head back towards the ears.
  const halfHead = Math.max(Math.abs(faceBox.min.x), Math.abs(faceBox.max.x));
  outerEdge.forEach((start) => {
    const side = Math.sign(start.x);
    const curve = new THREE.CatmullRomCurve3([
      start,
      new THREE.Vector3(side * (halfHead + 0.02), start.y, frontZ - 0.35),
      new THREE.Vector3(side * (halfHead + 0.04), start.y - 0.04, frontZ - 1.0),
    ]);
    glasses.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.035 * s, 8), frameMat));
  });

  // attach() keeps the world placement and parents the glasses to the head bone.
  character.add(glasses);
  head.attach(glasses);
  return glasses;
}

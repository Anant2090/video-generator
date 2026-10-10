import {useLoader} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import React, {useMemo} from 'react';
import {staticFile} from 'remotion';
import * as THREE from 'three';
import {DecalGeometry} from 'three/examples/jsm/geometries/DecalGeometry.js';
import {GLTFLoader, type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone as cloneSkinned} from 'three/examples/jsm/utils/SkeletonUtils.js';
import faceBoxes from '../../public/legion/vee3d/face/face.json';
import lutValues from '../../public/legion/vee3d/lut.json';
import type {Pose} from './choreo';
import {blinkAt, mouthAt} from './performance';

// VEE in 3D: a mesh generated from the official art (Hunyuan3D-2.1, video/vee3d/gen3d.py), with the
// art re-projected onto its front and a skeleton (video/vee3d/rig_vee.py). Rendered with the same
// screen-space 8x8 Bayer dither (3 px dots) and the official tone curve (dither_mascot.eq_lut), so at
// rest it reads as mascot-test/vee_dither.png — but it can turn, nod and move its arms in 3D.
// Model units = source px of the art (x 0..329, y up 0..633, front +z).

const VS = /* glsl */ `
#include <common>
#include <skinning_pars_vertex>
uniform float uThick;
varying vec2 vUv;
varying vec3 vN;
void main() {
  #include <skinbase_vertex>
  #include <begin_vertex>
  #include <beginnormal_vertex>
  #include <skinnormal_vertex>
  #include <skinning_vertex>
  vUv = uv;
  vN = normalize(normalMatrix * objectNormal);
  transformed += objectNormal * uThick;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}`;
const FS = /* glsl */ `
uniform sampler2D uMap;
uniform sampler2D uLut;
uniform float uCell;
uniform float uOutline;
uniform vec3 uInk;
uniform vec3 uPaper;
varying vec2 vUv;
varying vec3 vN;
float b2(vec2 a) { a = floor(a); return fract(a.x * 0.5 + a.y * a.y * 0.75); }
float b4(vec2 a) { return b2(0.5 * a) * 0.25 + b2(a); }
float b8(vec2 a) { return b4(0.5 * a) * 0.25 + b2(a); }
void main() {
  if (uOutline > 0.5) { gl_FragColor = vec4(uInk, 1.0); return; }
  vec4 tx = texture2D(uMap, vUv);
  if (tx.a < 0.5) discard; // face decals are feathered sprites
  vec3 c = pow(tx.rgb, vec3(1.0 / 2.2)); // sRGB, like PIL's convert('L')
  float g = dot(c, vec3(0.299, 0.587, 0.114));
  // the texture already holds the art's lighting; add only a little so turns read in 3D (1.0 facing front)
  vec3 n = normalize(vN);
  g *= 0.82 + 0.18 * clamp(dot(n, normalize(vec3(-0.35, 0.3, 0.89))), 0.0, 1.0) / 0.97;
  g = texture2D(uLut, vec2(clamp(g, 0.0, 1.0) * (255.0 / 256.0) + 0.5 / 256.0, 0.5)).r; // official tone curve
  gl_FragColor = vec4(g > b8(gl_FragCoord.xy / uCell) ? uPaper : uInk, 1.0);
}`;

const LUT = (() => {
  const data = new Uint8Array(256 * 4);
  lutValues.forEach((v, i) => data.set([v, v, v, 255], i * 4));
  const tex = new THREE.DataTexture(data, 256, 1, THREE.RGBAFormat);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.needsUpdate = true;
  return tex;
})();
const INK = new THREE.Color(10 / 255, 10 / 255, 10 / 255);
const PAPER = new THREE.Color(1, 1, 1);
const makeMat = (map: THREE.Texture | null, outline: boolean) =>
  new THREE.ShaderMaterial({
    vertexShader: VS,
    fragmentShader: FS,
    side: outline ? THREE.BackSide : THREE.FrontSide,
    uniforms: {
      uMap: {value: map},
      uLut: {value: LUT},
      uCell: {value: 3},
      uOutline: {value: outline ? 1 : 0},
      uInk: {value: INK},
      uPaper: {value: PAPER},
      uThick: {value: 0},
    },
  });

// Face decals: mouth/eyelid sprites (video/vee3d/face_sprites.py, same shapes as the 2D rig) projected
// from the front onto the head at their art boxes and parented to the head bone.
const FACE = Object.keys(faceBoxes) as (keyof typeof faceBoxes)[];
const FACE_URLS = FACE.map((n) => staticFile(`legion/vee3d/face/${n}.png`));
const buildFace = (mesh: THREE.SkinnedMesh, head: THREE.Bone, tex: THREE.Texture[]) => {
  const out: Record<string, THREE.Mesh> = {};
  const ray = new THREE.Raycaster();
  FACE.forEach((name, i) => {
    const [x0, y0, x1, y1] = faceBoxes[name];
    const cx = (x0 + x1) / 2;
    const cy = 633 - (y0 + y1) / 2; // art y (down) -> model y (up)
    ray.set(new THREE.Vector3(cx, cy, 2000), new THREE.Vector3(0, 0, -1));
    const hit = ray.intersectObject(mesh, false)[0];
    if (!hit) return;
    const geo = new DecalGeometry(mesh, hit.point, new THREE.Euler(0, 0, 0), new THREE.Vector3(x1 - x0, y1 - y0, 140));
    tex[i].colorSpace = THREE.SRGBColorSpace;
    const mat = makeMat(tex[i], false);
    mat.polygonOffset = true;
    mat.polygonOffsetFactor = -4;
    const decal = new THREE.Mesh(geo, mat);
    decal.visible = false;
    head.attach(decal); // decal geometry is in model space (root untransformed here); keep it on the head
    out[name] = decal;
  });
  return out;
};

type Rig = {
  root: THREE.Object3D;
  bones: Record<string, THREE.Bone>;
  rest: Record<string, THREE.Quaternion>;
  outlines: THREE.ShaderMaterial[];
  face: Record<string, THREE.Mesh>;
};
const prepare = (src: GLTF, faceTex: THREE.Texture[]): Rig => {
  const root = cloneSkinned(src.scene);
  const bones: Rig['bones'] = {};
  const outlines: THREE.ShaderMaterial[] = [];
  const skinned: THREE.SkinnedMesh[] = [];
  root.traverse((o) => {
    if ((o as THREE.Bone).isBone) bones[o.name] = o as THREE.Bone;
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinned.push(o as THREE.SkinnedMesh);
  });
  for (const m of skinned) {
    const map = ((m.material as THREE.MeshStandardMaterial).map ?? null) as THREE.Texture | null;
    m.material = makeMat(map, false);
    const hull = new THREE.SkinnedMesh(m.geometry, makeMat(map, true));
    hull.bind(m.skeleton, m.bindMatrix);
    hull.frustumCulled = false;
    m.frustumCulled = false;
    m.parent!.add(hull);
    outlines.push(hull.material as THREE.ShaderMaterial);
  }
  const rest = Object.fromEntries(Object.entries(bones).map(([k, b]) => [k, b.quaternion.clone()]));
  root.updateMatrixWorld(true);
  const face = skinned[0] && bones.head ? buildFace(skinned[0], bones.head, faceTex) : {};
  return {root, bones, rest, outlines, face};
};

// R3F's loader suspends; ThreeCanvas holds the Remotion frame until the model is in (cached per tab).
const useRig = () => {
  const gltf = useLoader(GLTFLoader, staticFile('legion/vee3d/vee.glb')) as GLTF;
  const faceTex = useLoader(THREE.TextureLoader, FACE_URLS) as THREE.Texture[];
  return useMemo(() => prepare(gltf, faceTex), [gltf, faceTex]);
};

// rotate a bone about a MODEL-space axis (x right, y up, z toward camera), on top of its rest pose
const tmpQ = new THREE.Quaternion();
const tmpA = new THREE.Vector3();
const turnBone = (b: THREE.Bone | undefined, axis: [number, number, number], angle: number) => {
  if (!b || !angle) return;
  const parentQ = new THREE.Quaternion();
  b.parent?.getWorldQuaternion(parentQ);
  const rootQ = new THREE.Quaternion();
  let top: THREE.Object3D = b;
  while (top.parent && !(top.parent as THREE.Scene).isScene) top = top.parent;
  top.getWorldQuaternion(rootQ); // model orientation (glTF root)
  tmpA.set(...axis).applyQuaternion(rootQ).applyQuaternion(parentQ.invert()).normalize();
  b.quaternion.premultiply(tmpQ.setFromAxisAngle(tmpA, angle));
  b.updateMatrixWorld(true);
};

/** Pose the rig: face from the lip-sync track, body/arms/legs from the choreography (choreo.ts). */
const perform = (rig: Rig, t: number, pose: Pose | null, forceMouth?: number) => {
  for (const [k, q] of Object.entries(rig.rest)) rig.bones[k].quaternion.copy(q);
  rig.root.updateMatrixWorld(true);
  // face: lip-sync (0 = the art's own smile, no decal) and blinks
  const mouth = forceMouth ?? (pose ? mouthAt(t) : 0);
  const blink = pose ? blinkAt(t) : 0;
  for (const [name, m] of Object.entries(rig.face)) m.visible = name === `mouth${mouth}` || name === `blink${blink}`;
  if (!pose) return;
  const B = rig.bones;
  turnBone(B.spine, [0, 0, 1], pose.spine.roll);
  turnBone(B.spine, [0, 1, 0], pose.spine.yaw);
  turnBone(B.head, [0, 1, 0], pose.head.yaw);
  turnBone(B.head, [1, 0, 0], pose.head.pitch);
  turnBone(B.head, [0, 0, 1], pose.head.roll);
  // left (thumbs-up) arm; the fist is modelled closed with the thumb up, so the hand stays upright in
  // world space whatever the arm does (otherwise a raised arm tips it into a thumbs-down)
  const handRest = new THREE.Quaternion();
  B.hand_l?.getWorldQuaternion(handRest);
  turnBone(B.upperarm_l, [0, 0, 1], pose.armL.dz);
  if (B.hand_l?.parent) {
    const parentQ = new THREE.Quaternion();
    B.hand_l.parent.getWorldQuaternion(parentQ);
    B.hand_l.quaternion.copy(parentQ.invert().multiply(handRest));
    B.hand_l.updateMatrixWorld(true);
  }
  // right (open-hand) arm: planar IK / wave angles from choreo.ts
  turnBone(B.upperarm_r, [0, 0, 1], pose.armR.d1);
  turnBone(B.forearm_r, [0, 0, 1], pose.armR.d2);
  if (B.hand_r && pose.armR.twist) {
    B.hand_r.rotateY(pose.armR.twist); // palm toward the camera for the wave
    B.hand_r.updateMatrixWorld(true);
  }
  // legs: knees bend toward the camera for crouch / tuck
  for (const side of ['l', 'r']) {
    turnBone(B[`thigh_${side}`], [1, 0, 0], -pose.legs);
    turnBone(B[`shin_${side}`], [1, 0, 0], 2 * pose.legs);
  }
};

const Character: React.FC<{t: number; pose: Pose | null; k: number; forceMouth?: number}> = ({t, pose, k, forceMouth}) => {
  const rig = useRig();
  perform(rig, t, pose, forceMouth);
  for (const m of rig.outlines) m.uniforms.uThick.value = 3 / k; // 3 px ink outline
  // model units = source px with the feet midpoint (186, 0) as the anchor
  return <primitive object={rig.root} position={[-186, 0, 0]} />;
};

/** Full-frame transparent 3D layer. `pose` (choreo.veeAt) places the feet midpoint at screen (x, y), k px per
 *  source px, with squash & stretch about the feet; pose === null renders the rest pose at `at`. */
export const Vee3DLayer: React.FC<{t: number; pose: Pose | null; at?: {x: number; y: number; k: number}; forceMouth?: number}> = ({t, pose, at, forceMouth}) => {
  const p = pose ?? {...at!, sx: 1, sy: 1};
  return (
    <ThreeCanvas
      width={1920}
      height={1080}
      orthographic
      camera={{position: [0, 0, 3000], near: 1, far: 8000, zoom: 1}}
      gl={{antialias: false, alpha: true}}
      style={{position: 'absolute', left: 0, top: 0}}
    >
      <group position={[p.x - 960, 540 - p.y, 0]} scale={[p.k * p.sx, p.k * p.sy, p.k]}>
        <Character t={t} pose={pose} k={p.k} forceMouth={forceMouth} />
      </group>
    </ThreeCanvas>
  );
};

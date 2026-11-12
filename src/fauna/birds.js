// Chim: đàn quạ/chim bay lượn trên mái; chim sẻ, bồ câu nhặt hạt dưới sân và bay vụt khi có người lại gần.
// Cánh vỗ tính trong vertex shader (thuộc tính instanced aPhase, aFlap, aFold) nên rất nhẹ.
import * as THREE from 'three';
import {px,pz,walking} from '../app/game.js';
import {camera,scene} from '../core/scene.js';
import {npcSpots,npcs} from '../npc/npcs.js';

let flyMesh, groundMesh, flocks = [], groups = [], time = 0;
const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), E = new THREE.Euler(0, 0, 0, 'YXZ');
let rnd = (() => { let s = 77123; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();

function birdGeometry() {
  const P = [], W = [];
  const tri = (a, b, c, wing = 0) => { P.push(...a, ...b, ...c); W.push(wing ? Math.abs(a[0]) : 0, wing ? Math.abs(b[0]) : 0, wing ? Math.abs(c[0]) : 0); };
  const N = [0, .01, .25], T = [0, .01, -.17], L = [-.06, 0, 0], R = [.06, 0, 0], U = [0, .07, .02], D = [0, -.05, 0];
  tri(N, L, U); tri(N, U, R); tri(N, D, L); tri(N, R, D); tri(T, U, L); tri(T, R, U); tri(T, L, D); tri(T, D, R);
  tri([0, .01, -.14], [-.08, 0, -.32], [.08, 0, -.32]);
  for (const s of [-1, 1]) {
    const a = [s * .05, .02, .09], b = [s * .05, .02, -.09], c = [s * .46, 0, -.02], d = [s * .4, 0, -.14];
    tri(a, c, b, 1); tri(b, c, d, 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aWing', new THREE.Float32BufferAttribute(W, 1));
  g.computeVertexNormals();
  return g;
}

function birdMaterial() {
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .85, side: THREE.DoubleSide });
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = { value: 0 };
    m.userData.shader = sh;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aWing;attribute float aPhase;attribute float aFlap;attribute float aFold;uniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        if(aWing>.0){
          float ang=sin(uTime*(13.+aPhase)+aPhase*7.)*.95*aFlap+(1.-aFlap)*.12;
          float r=aWing*mix(1.,.28,aFold);
          transformed.x=sign(transformed.x)*(0.05+(r-0.05)*cos(ang));
          transformed.y+=(r-0.05)*sin(ang);
          transformed.z-=aFold*(aWing-.05)*.35;
        }`);
  };
  return m;
}

function makeMesh(count) {
  const g = birdGeometry().clone();
  const mk = (n, v = 0) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(n).fill(v), 1); a.setUsage(THREE.DynamicDrawUsage); return a; };
  g.setAttribute('aPhase', mk(count)); g.setAttribute('aFlap', mk(count, 1)); g.setAttribute('aFold', mk(count));
  for (let i = 0; i < count; i++) g.attributes.aPhase.setX(i, rnd() * 6);
  const mesh = new THREE.InstancedMesh(g, birdMaterial(), count);
  mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);
  return mesh;
}

export function buildBirds() {
  // Đàn bay: quạ (đen) và chim sáo/chim ác là (đen trắng) lượn trên mái.
  const flockCount = 8, perFlock = 22;
  flyMesh = makeMesh(flockCount * perFlock);
  const c = new THREE.Color();
  let idx = 0;
  for (let f = 0; f < flockCount; f++) {
    const fl = {
      cx: (rnd() - .5) * 520, cz: (rnd() - .5) * 760, r: 50 + rnd() * 110, rz: .6 + rnd() * .7,
      alt: 22 + rnd() * 40, w: (.09 + rnd() * .1) * (rnd() < .5 ? -1 : 1), ph: rnd() * 6.28, birds: [],
      scale: f % 3 === 0 ? 1.15 : .8,
    };
    for (let i = 0; i < perFlock; i++) {
      fl.birds.push({ i: idx, ox: (rnd() - .5) * 22, oy: (rnd() - .5) * 6, oz: (rnd() - .5) * 22, f: .3 + rnd() * .5, p: rnd() * 6.28 });
      c.set(f % 3 === 0 ? '#1d1d20' : (rnd() < .5 ? '#2a2724' : '#5b544c'));
      flyMesh.setColorAt(idx++, c);
    }
    flocks.push(fl);
  }
  flyMesh.instanceColor.needsUpdate = true;

  // Chim dưới sân: bồ câu xám và chim sẻ nâu, từng nhóm nhỏ.
  const groupCount = 16, perGroup = 7;
  groundMesh = makeMesh(groupCount * perGroup);
  idx = 0;
  for (let gI = 0; gI < groupCount && npcSpots.length; gI++) {
    const [x, z] = npcSpots[Math.floor(rnd() * npcSpots.length)];
    const pigeon = gI % 2 === 0;
    const gr = { x, z, state: 'ground', t: 0, next: 30 + rnd() * 80, birds: [], scale: pigeon ? .75 : .42 };
    for (let i = 0; i < perGroup; i++) {
      const b = { i: idx, ox: (rnd() - .5) * 4, oz: (rnd() - .5) * 4, h: rnd() * 6.28, hop: rnd() * 5, peck: rnd() * 4, x, y: .02, z, sx: 0, sy: 0, sz: 0, ex: 0, ez: 0 };
      b.x = x + b.ox; b.z = z + b.oz;
      gr.birds.push(b);
      c.set(pigeon ? (rnd() < .7 ? '#8d9196' : '#c8c6c0') : (rnd() < .6 ? '#7a5e43' : '#9b8166'));
      groundMesh.setColorAt(idx++, c);
    }
    groups.push(gr);
  }
  groundMesh.instanceColor.needsUpdate = true;
}

function startFlight(gr) {
  gr.state = 'fly'; gr.t = 0;
  let nx = gr.x, nz = gr.z;
  for (let k = 0; k < 10; k++) {
    const [x, z] = npcSpots[Math.floor(rnd() * npcSpots.length)];
    if (Math.hypot(x - gr.x, z - gr.z) < 90) { nx = x; nz = z; break; }
  }
  gr.dur = 3 + Math.hypot(nx - gr.x, nz - gr.z) / 9;
  for (const b of gr.birds) {
    b.sx = b.x; b.sy = b.y; b.sz = b.z;
    b.ex = nx + b.ox + (rnd() - .5) * 2; b.ez = nz + b.oz + (rnd() - .5) * 2;
    b.delay = rnd() * .35; b.arc = 7 + rnd() * 9;
  }
  gr.x = nx; gr.z = nz;
}

export function updateBirds(dt) {
  if (!flyMesh) return;
  time += dt;
  for (const mesh of [flyMesh, groundMesh]) if (mesh.material.userData.shader) mesh.material.userData.shader.uniforms.uTime.value = time;

  // Đàn bay theo quỹ đạo elip, mỗi con lệch và lượn nhẹ.
  for (const fl of flocks) {
    const a = fl.ph + time * fl.w;
    const cx = fl.cx + Math.cos(a) * fl.r, cz = fl.cz + Math.sin(a) * fl.r * fl.rz;
    const tx = -Math.sin(a) * fl.w, tz = Math.cos(a) * fl.rz * fl.w;
    const heading = Math.atan2(tx, tz), bank = -Math.sign(fl.w) * .35;
    for (const b of fl.birds) {
      const wob = time * b.f + b.p;
      const ca = Math.cos(heading), sa = Math.sin(heading);
      const ox = b.ox + Math.sin(wob) * 2.5, oz = b.oz + Math.cos(wob * .8) * 2.5;
      V.set(cx + ox * ca + oz * sa, fl.alt + b.oy + Math.sin(wob * 1.3) * 1.5, cz - ox * sa + oz * ca);
      E.set(Math.sin(wob * 1.3) * .15, heading, bank + Math.sin(wob) * .2);
      Q.setFromEuler(E); S.setScalar(fl.scale);
      M.compose(V, Q, S); flyMesh.setMatrixAt(b.i, M);
      flyMesh.geometry.attributes.aFlap.setX(b.i, Math.sin(time * .6 + b.p) > -.2 ? 1 : .15);
    }
  }
  flyMesh.instanceMatrix.needsUpdate = true; flyMesh.geometry.attributes.aFlap.needsUpdate = true;

  // Chim dưới sân.
  const ga = groundMesh.geometry.attributes;
  for (const gr of groups) {
    gr.t += dt;
    if (gr.state === 'ground') {
      let scare = gr.t > gr.next;
      if (walking && Math.hypot(px - gr.x, pz - gr.z) < 7) scare = true;
      if (!scare && Math.hypot(camera.position.x - gr.x, camera.position.z - gr.z) < 220) {
        for (let k = 0; k < 6; k++) { const n = npcs[(Math.floor(time * 13) + k * 37 + gr.birds[0].i) % npcs.length]; if (n && n.moving && Math.hypot(n.x - gr.x, n.z - gr.z) < 3.2) { scare = true; break; } }
      }
      if (scare) { startFlight(gr); gr.next = 40 + rnd() * 90; }
    }
    for (const b of gr.birds) {
      let fold = 1, flap = 0, pitch = 0;
      if (gr.state === 'fly') {
        const u = THREE.MathUtils.clamp((gr.t - b.delay) / gr.dur, 0, 1);
        const e = u * u * (3 - 2 * u);
        b.x = b.sx + (b.ex - b.sx) * e; b.z = b.sz + (b.ez - b.sz) * e;
        b.y = .02 + Math.sin(Math.PI * u) * b.arc;
        if (u > 0 && u < 1) { b.h = Math.atan2(b.ex - b.sx, b.ez - b.sz); fold = 0; flap = 1; pitch = (u < .5 ? -.25 : .2); }
        if (gr.birds.every(q => (gr.t - q.delay) / gr.dur >= 1)) { gr.state = 'ground'; gr.t = 0; }
      } else {
        b.hop -= dt;
        if (b.hop < 0) { b.hop = 1.5 + rnd() * 4; b.h += (rnd() - .5) * 2; const st = .25; const nx = b.x + Math.sin(b.h) * st, nz = b.z + Math.cos(b.h) * st; if (Math.hypot(nx - gr.x, nz - gr.z) < 3.5) { b.x = nx; b.z = nz; } }
        const hopUp = Math.max(0, Math.sin((b.hop % .4) / .4 * Math.PI)) * (b.hop < .4 ? .08 : 0);
        b.y = .02 + hopUp;
        b.peck += dt; pitch = Math.max(0, Math.sin(b.peck * 3.3)) > .85 ? .6 : 0;
      }
      E.set(pitch, b.h, 0); Q.setFromEuler(E); S.setScalar(gr.scale);
      V.set(b.x, b.y + .05 * gr.scale, b.z);
      M.compose(V, Q, S); groundMesh.setMatrixAt(b.i, M);
      ga.aFold.setX(b.i, fold); ga.aFlap.setX(b.i, flap);
    }
  }
  groundMesh.instanceMatrix.needsUpdate = true; ga.aFold.needsUpdate = true; ga.aFlap.needsUpdate = true;
}

// Vị trí các nhóm chim dưới sân (dùng để gỡ lỗi / đặt camera).
export function birdGroundSpots() { return groups.map(g => [g.x, g.z, g.state]); }

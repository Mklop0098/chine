// Mèo Cố Cung: đi dạo chậm, ngồi, nằm phơi nắng; né người chơi; dùng chung va chạm với người.
import * as THREE from 'three';
import {px,pz,walking} from '../app/game.js';
import {scene} from '../core/scene.js';
import {npcSpots} from '../npc/npcs.js';
import {walkableFloor} from '../player/collision.js';

const cats = [];
const parts = {};
const M = new THREE.Matrix4(), B = new THREE.Matrix4(), T = new THREE.Matrix4(), R = new THREE.Matrix4();
let rnd = (() => { let s = 5512; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();

function merge(list) {
  const P = [], N = [];
  for (let g of list) { if (g.index) g = g.toNonIndexed(); P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); m.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  return m;
}

const COATS = [['#d98c45', '#f2e6d6'], ['#efeae2', '#efeae2'], ['#26262a', '#26262a'], ['#8b8782', '#d9d5cf'], ['#a8794e', '#e8dcc8'], ['#e6d2b2', '#f4ece0'], ['#3a332d', '#f1ece4']];

export function buildCats(count = 22) {
  const geo = {
    body: new THREE.SphereGeometry(1, 14, 10).scale(.15, .14, .29).translate(0, .25, 0),
    chest: new THREE.SphereGeometry(1, 10, 8).scale(.11, .12, .1).translate(0, .25, .2),
    head: merge([
      new THREE.SphereGeometry(.1, 12, 10).scale(1, .9, .95).translate(0, .36, .3),
      new THREE.ConeGeometry(.035, .075, 6).translate(.055, .45, .29),
      new THREE.ConeGeometry(.035, .075, 6).translate(-.055, .45, .29),
      new THREE.SphereGeometry(.04, 8, 6).scale(1, .75, 1).translate(0, .33, .385),
    ]),
    tail: new THREE.CylinderGeometry(.022, .016, .34, 6).translate(0, .17, 0),
    leg: new THREE.CylinderGeometry(.026, .022, .22, 6).translate(0, -.11, 0),
  };
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: .92 });
  mat.envMapIntensity = .3;
  const per = { body: 1, chest: 1, head: 1, tail: 1, leg: 4 };
  for (const [k, g] of Object.entries(geo)) {
    const m = new THREE.InstancedMesh(g, mat, count * per[k]);
    m.frustumCulled = false; m.castShadow = false; m.receiveShadow = true;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(m); parts[k] = m;
  }
  const c = new THREE.Color();
  for (let i = 0; i < count && npcSpots.length; i++) {
    const [x, z] = npcSpots[Math.floor(rnd() * npcSpots.length)];
    const coat = COATS[Math.floor(rnd() * COATS.length)];
    const cat = { i, x, z, y: walkableFloor(x, z, 0) ?? 0, h: rnd() * 6.28, phase: 0, state: 'sit', timer: rnd() * 8, tx: x, tz: z, pose: 0, tailT: rnd() * 6 };
    cats.push(cat);
    for (const k of ['body', 'head', 'tail']) parts[k].setColorAt(i, c.set(coat[0]));
    parts.chest.setColorAt(i, c.set(coat[1]));
    for (let l = 0; l < 4; l++) parts.leg.setColorAt(i * 4 + l, c.set(l < 2 ? coat[1] : coat[0]));
  }
  for (const m of Object.values(parts)) m.instanceColor.needsUpdate = true;
}

function think(cat) {
  const r = rnd();
  if (r < .45) {
    cat.state = 'walk'; cat.timer = 6 + rnd() * 10;
    for (let k = 0; k < 10; k++) { const [x, z] = npcSpots[Math.floor(rnd() * npcSpots.length)]; if (Math.hypot(x - cat.x, z - cat.z) < 25) { cat.tx = x; cat.tz = z; break; } }
  } else if (r < .75) { cat.state = 'sit'; cat.timer = 5 + rnd() * 12; }
  else { cat.state = 'lie'; cat.timer = 10 + rnd() * 20; }
}

export function updateCats(dt) {
  if (!cats.length) return;
  for (const cat of cats) {
    cat.timer -= dt; cat.tailT += dt;
    if (walking && Math.hypot(px - cat.x, pz - cat.z) < 2.2 && cat.state !== 'flee') {
      cat.state = 'flee'; cat.timer = 2.2; cat.h = Math.atan2(cat.x - px, cat.z - pz);
    }
    if (cat.timer < 0) think(cat);
    let speed = 0;
    if (cat.state === 'walk') {
      const dx = cat.tx - cat.x, dz = cat.tz - cat.z, d = Math.hypot(dx, dz);
      if (d < .5) { cat.state = 'sit'; cat.timer = 4 + rnd() * 8; }
      else {
        const want = Math.atan2(dx, dz), dh = Math.atan2(Math.sin(want - cat.h), Math.cos(want - cat.h));
        cat.h += THREE.MathUtils.clamp(dh, -dt * 2.5, dt * 2.5); speed = .55;
      }
    } else if (cat.state === 'flee') speed = 2.6;
    if (speed) {
      const nx = cat.x + Math.sin(cat.h) * speed * dt, nz = cat.z + Math.cos(cat.h) * speed * dt, y = walkableFloor(nx, nz, cat.y);
      if (y !== null) { cat.x = nx; cat.z = nz; cat.y = y; cat.phase += dt * speed * 9; }
      else { cat.h += 1.6; if (cat.state === 'walk') cat.timer = Math.min(cat.timer, .5); }
    }
    const targetPose = cat.state === 'sit' ? 1 : cat.state === 'lie' ? 2 : 0;
    cat.pose += (targetPose - cat.pose) * Math.min(1, dt * 4);

    const sit = THREE.MathUtils.clamp(cat.pose, 0, 1), lie = THREE.MathUtils.clamp(cat.pose - 1, 0, 1);
    B.makeRotationY(cat.h).setPosition(cat.x, cat.y - lie * .12, cat.z);
    // Thân: ngồi thì ngửa lên, nằm thì hạ thấp
    T.makeTranslation(0, .25, -.15).multiply(R.makeRotationX(-sit * (1 - lie) * .75)).multiply(M.makeTranslation(0, -.25, .15));
    const body = B.clone().multiply(T);
    parts.body.setMatrixAt(cat.i, body); parts.chest.setMatrixAt(cat.i, body);
    const headM = body.clone().multiply(M.makeTranslation(0, lie * -.05, 0));
    parts.head.setMatrixAt(cat.i, headM);
    const sway = Math.sin(cat.tailT * (speed ? 3 : 1.2)) * .5;
    parts.tail.setMatrixAt(cat.i, body.clone().multiply(T.makeTranslation(0, .28, -.27)).multiply(R.makeRotationX(-(speed ? .9 : .3 + sit * .9 + lie * .6))).multiply(M.makeRotationZ(sway)));
    const legs = [[.07, .2], [-.07, .2], [.07, -.17], [-.07, -.17]];
    legs.forEach(([lx, lz], li) => {
      const swing = speed ? Math.sin(cat.phase + (li === 0 || li === 3 ? 0 : Math.PI)) * .55 : 0;
      const fold = li >= 2 ? sit * 1.35 : 0;
      const L = (li < 2 && sit > .5 ? B : body).clone().multiply(T.makeTranslation(lx, .23 - lie * .1, lz)).multiply(R.makeRotationX(swing - fold + lie * 1.3));
      parts.leg.setMatrixAt(cat.i * 4 + li, L);
    });
  }
  for (const m of Object.values(parts)) m.instanceMatrix.needsUpdate = true;
}

export function catSpots() { return cats.map(c => [c.x, c.z, c.state]); }

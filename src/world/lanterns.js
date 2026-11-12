import * as THREE from 'three';
import {camera, scene} from '../core/scene.js';
import {windowMat} from '../builders/ornaments.js';
import {SKY} from '../weather/uniforms.js';

const fixtures = [];
const nearestCarried = [];
const nearestFixed = [];
const lightCount = 4;
const lightColor = '#ffac58';
const paper = new THREE.MeshStandardMaterial({
 color: '#bd3721', roughness: .75, emissive: '#ff993d', emissiveIntensity: 0,
});
const trim = new THREE.MeshStandardMaterial({color: '#743721', roughness: .85});
let fixedLights, carriedLights;

export function addFacadeLantern(x, y, z, scale) {
 fixtures.push({position: new THREE.Vector3(x, y, z), scale});
}

function makeLightPool() {
 return Array.from({length: lightCount}, () => {
  const light = new THREE.PointLight(lightColor, 0, 0, 2);
  scene.add(light);
  return light;
 });
}

export function buildLanterns() {
 const matrix = new THREE.Matrix4();
 const globe = new THREE.InstancedMesh(new THREE.SphereGeometry(.31, 10, 6).scale(1, 1.18, 1), paper, fixtures.length);
 const cap = new THREE.InstancedMesh(new THREE.CylinderGeometry(.16, .16, .08, 10), trim, fixtures.length * 2);
 const hanger = new THREE.InstancedMesh(new THREE.CylinderGeometry(.018, .018, .46, 6), trim, fixtures.length);
 fixtures.forEach(({position: {x,y,z}, scale}, i) => {
  matrix.makeScale(scale, scale, scale);
  globe.setMatrixAt(i, matrix.setPosition(x,y,z));
  cap.setMatrixAt(i * 2, matrix.setPosition(x,y + .34 * scale,z));
  cap.setMatrixAt(i * 2 + 1, matrix.setPosition(x,y - .34 * scale,z));
  hanger.setMatrixAt(i, matrix.setPosition(x,y + .60 * scale,z));
 });
 for (const mesh of [globe, cap, hanger]) mesh.instanceMatrix.needsUpdate = true;
 scene.add(globe, cap, hanger);
 fixedLights = makeLightPool();
 carriedLights = makeLightPool();
}

function offerNearest(list, position, range, scale = 1) {
 const distance = position.distanceToSquared(camera.position);
 if (distance > range * range || (list.length === lightCount && distance >= list.at(-1).distance)) return;
 const index = list.findIndex(entry => distance < entry.distance);
 if (index === -1) list.push({position, distance, scale});
 else list.splice(index, 0, {position, distance, scale});
 if (list.length > lightCount) list.pop();
}

export function offerCarriedLantern(position) {
 offerNearest(nearestCarried, position, 32);
}

function applyLights(lights, nearest, intensity, reach) {
 lights.forEach((light, index) => {
  const entry = nearest[index];
  light.intensity = entry ? intensity * entry.scale : 0;
  if (entry) {
   light.position.copy(entry.position);
   light.distance = reach * entry.scale;
  }
 });
 nearest.length = 0;
}

export function updateLanterns() {
 const night = SKY.uNight.value;
 paper.emissiveIntensity = night * 2.8;
 windowMat.emissiveIntensity = night * .68;
 if (night > .02) {
  for (const {position, scale} of fixtures) offerNearest(nearestFixed, position, 72, scale);
 }
 applyLights(fixedLights, nearestFixed, night * 125, 13);
 applyLights(carriedLights, nearestCarried, night * 38, 7);
}

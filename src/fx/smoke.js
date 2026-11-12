// Khói hương mảnh bốc lên từ các đỉnh đồng (hạt vẽ bằng shader, gió nhẹ thổi lệch).
import * as THREE from 'three';
import {scene} from '../core/scene.js';
import {smokeSources} from '../world/props.js';

let smoke, time = 0;

export function buildSmoke(perSource = 46) {
  const n = smokeSources.length * perSource;
  if (!n) return;
  const base = new Float32Array(n * 3), seed = new Float32Array(n);
  smokeSources.forEach(([x, y, z], s) => {
    for (let i = 0; i < perSource; i++) { base.set([x, y, z], (s * perSource + i) * 3); seed[s * perSource + i] = i / perSource + Math.random() * .02; }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(base, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uScale: { value: 600 } }]),
    vertexShader: `#include <common>\n#include <fog_pars_vertex>\n#include <logdepthbuf_pars_vertex>
      attribute float aSeed;uniform float uTime,uScale;varying float vLife;
      void main(){
        float life=fract(uTime*.09+aSeed);vLife=life;
        vec3 p=position+vec3(sin(life*7.+aSeed*40.)*.25*life+life*1.6,life*6.5,cos(life*5.+aSeed*30.)*.25*life+life*.6);
        vec4 mvPosition=viewMatrix*vec4(p,1.);
        gl_Position=projectionMatrix*mvPosition;
        gl_PointSize=uScale*(.18+life*1.2)/-mvPosition.z;
        #include <logdepthbuf_vertex>
        #include <fog_vertex>
      }`,
    fragmentShader: `#include <common>\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>
      varying float vLife;
      void main(){
        #include <logdepthbuf_fragment>
        float d=length(gl_PointCoord-.5);
        float a=smoothstep(.5,.0,d)*smoothstep(0.,.08,vLife)*(1.-vLife)*.22;
        gl_FragColor=vec4(vec3(.86,.86,.84),a);
        #include <fog_fragment>
      }`,
  });
  smoke = new THREE.Points(g, m);
  smoke.frustumCulled = false; smoke.renderOrder = 4;
  scene.add(smoke);
}

export function updateSmoke(dt) {
  if (!smoke) return;
  time += dt;
  smoke.material.uniforms.uTime.value = time;
  smoke.material.uniforms.uScale.value = innerHeight * .9;
}

// Scene, renderer, camera, ánh sáng và bóng đổ.
import * as THREE from 'three';
import {ui} from './dom.js';

export let scene,renderer,camera,sun,hemi;

export function buildScene(){
scene=new THREE.Scene();
scene.background=new THREE.Color('#d2dfd7');
renderer=new THREE.WebGLRenderer({antialias:true,logarithmicDepthBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.prepend(renderer.domElement);
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();ui('status').textContent='Trình duyệt đã ngừng kết xuất 3D. Hãy tải lại file.'});
camera=new THREE.PerspectiveCamera(47,innerWidth/innerHeight,.14,7200);
hemi=new THREE.HemisphereLight('#eef2f4','#8c7d6a',.4);
scene.add(hemi);
renderer.toneMappingExposure=.92;
sun=new THREE.DirectionalLight('#ffeacc',2.45);
sun.position.set(-510,680,450);
sun.target.position.set(0,0,12);
sun.castShadow=true;
sun.shadow.mapSize.set(4096,4096);
Object.assign(sun.shadow.camera,{left:-680,right:680,top:680,bottom:-680,near:5,far:1700});
sun.shadow.normalBias=.22;
sun.shadow.bias=-.00015;
scene.add(sun,sun.target);
}

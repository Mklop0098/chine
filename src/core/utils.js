// Hàm tiện ích: vec(), material(), pattern() vẽ texture bằng canvas, random() có hạt giống cố định.
import * as THREE from 'three';

export let vec,material,seed;

export function pattern(w,h,paint){
 const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'));
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}

export function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}

export function buildUtils(){
vec=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
material=c=>new THREE.MeshStandardMaterial({color:c,roughness:.86});
seed=1452;
}

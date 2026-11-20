// Hàm tiện ích: vec(), material(), pattern() vẽ texture bằng canvas, random() có hạt giống cố định.
import * as THREE from 'three';

export let vec,material,seed;

export function pattern(w,h,paint){
 const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'));
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;
}

export function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}

// Chạy fn với hạt giống riêng rồi trả lại hạt giống chung: thêm chi tiết mới (texture, hình học)
// mà không làm xê dịch vị trí cây, NPC… vốn phụ thuộc thứ tự gọi random().
export function isolated(s,fn){
 const saved=seed;seed=s>>>0;
 try{return fn()}finally{seed=saved}
}

// Tạo bump map (ảnh xám) từ một hàm vẽ canvas; lặp lại giống texture màu.
export function heightMap(w,h,paint){
 const t=pattern(w,h,paint);t.colorSpace=THREE.NoColorSpace;return t;
}

export function buildUtils(){
vec=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
material=c=>new THREE.MeshStandardMaterial({color:c,roughness:.86});
seed=1452;
}

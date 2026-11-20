// Chi tiết trang phục dùng chung: nếp gấp áo (biến dạng hình học), vân dệt lụa (texture + bump), vật liệu lụa có ánh.
import * as THREE from 'three';

let maps=null;
// Vân dệt mảnh màu trắng (nhân với màu áo), kèm bump cùng hình. Hạt giống riêng: không đụng random() chung.
export function weaveMaps(){
 if(maps)return maps;
 let s=424242;const rnd=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};
 const S=256,paint=(height)=>{
  const c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d');
  s=424242;
  x.fillStyle=height?'#808080':'#f2f2f2';x.fillRect(0,0,S,S);
  // sợi ngang và dọc đan xen
  for(let i=0;i<S;i+=2){
   x.fillStyle=height?(i%4?'#a0a0a0':'#606060'):(i%4?'rgba(255,255,255,.35)':'rgba(0,0,0,.06)');
   x.fillRect(0,i,S,1);
   x.fillStyle=height?(i%4?'rgba(70,70,70,.5)':'rgba(170,170,170,.5)'):(i%4?'rgba(0,0,0,.05)':'rgba(255,255,255,.25)');
   x.fillRect(i,0,1,S);
  }
  // loang nhẹ của vải nhuộm tay
  for(let i=0;i<70;i++){
   const r=10+rnd()*40,v=rnd();
   x.fillStyle=height?'rgba(128,128,128,0)':(v<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.045)');
   x.beginPath();x.arc(rnd()*S,rnd()*S,r,0,6.283);x.fill();
  }
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.repeat.set(10,8);
  t.colorSpace=height?THREE.NoColorSpace:THREE.SRGBColorSpace;return t;
 };
 maps={map:paint(false),bump:paint(true)};
 return maps;
}

// Nếp gấp dọc thân áo: bán kính gợn theo góc, sâu dần về phía gấu (y nhỏ). Dùng cho LatheGeometry trục Y.
// n: số nếp, amp: độ sâu ở gấu (m), top: độ cao nếp tắt hẳn, bottom: độ cao gấu.
export function pleat(geo,{n=14,amp=.01,top=1,bottom=0,phase=0}={}){
 const p=geo.attributes.position;
 for(let i=0;i<p.count;i++){
  const x=p.getX(i),y=p.getY(i),z=p.getZ(i),r=Math.hypot(x,z);if(r<1e-4)continue;
  const a=Math.atan2(z,x),t=THREE.MathUtils.clamp((top-y)/(top-bottom),0,1);
  // nếp không đều: trộn hai tần số để vải trông mềm chứ không như bánh răng
  const w=Math.sin(a*n+phase)*.75+Math.sin(a*(n*.5+1)+phase*2.3)*.25;
  const k=1+amp*t*t*w/r;
  p.setX(i,x*k);p.setZ(i,z*k);
 }
 geo.computeVertexNormals();
 return geo;
}

// Vật liệu lụa: ánh sheen ở góc nghiêng, vân dệt nổi nhẹ.
export function silkMaterial(params={}){
 const {map:weave,bump}=weaveMaps();
 const m=new THREE.MeshPhysicalMaterial({roughness:.55,sheen:.6,sheenRoughness:.45,sheenColor:new THREE.Color('#ffffff'),bumpMap:bump,bumpScale:.6,...params});
 if(!params.map)m.map=weave;
 m.envMapIntensity=.45;
 return m;
}

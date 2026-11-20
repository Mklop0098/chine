// Chi tiết kiến trúc: diềm ngói ống, mặt dưới mái, đấu củng, si vẫn, cửa đinh vàng, cửa sổ.
import * as THREE from 'three';
import {add,box} from './primitives.js';
import {material,pattern} from '../core/utils.js';
import {bumpFrom} from '../materials/textures.js';

export let eaveTex,eaveMat,soffitTex,soffitMat,bracketTex,bracketMat,dgBlue,dgGreen,dgGold,beastBody,beastHead,studDoorTex,studDoor,windowTex,windowMat;

export function bandStrip(a,b,off,y,h,mat,unit){
 const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.3)return;
 const g=new THREE.PlaneGeometry(len,h),uv=g.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setX(i,uv.getX(i)*len/unit);
 const o=add(g,mat,(a[0]+b[0])/2+off*dz/len,y,(a[1]+b[1])/2-off*dx/len,{shadow:false});
 o.rotation.y=-Math.atan2(dz,dx)+(off>0?Math.PI:0);
 return o;
}

// Đấu củng: hàng con-sơn ba tầng dưới diềm mái
export function dougongRow(x,z,w,d,y,k=.405){
 const unit=(cx,cz,alongX)=>{
  const W=(a,b)=>alongX?[a,b]:[b,a];
  let [sx,sz]=W(.3,.42);box(cx,y+.1,cz,sx,.2,sz,dgBlue);
  [sx,sz]=W(.62,.56);box(cx,y+.29,cz,sx,.18,sz,dgGreen);
  [sx,sz]=W(.92,.68);box(cx,y+.46,cz,sx,.16,sz,dgBlue);
  box(cx,y+.29,cz,.16,.12,.16,dgGold);
 };
 for(const s of [-1,1]){
  const zz=z+s*d*k,n=Math.max(2,Math.round(w*.9/1.25));
  box(x,y+.28,z+s*(d*k-.18),w*.9,.56,.12,dgBlue);
  for(let i=0;i<=n;i++)unit(x+(i/n-.5)*w*.88,zz,true);
  const inset=d*(.5-k),xx=x+s*(w/2-inset),m=Math.max(2,Math.round(d*.76/1.25));
  box(x+s*(w/2-inset-.18),y+.28,z,.12,.56,d*.78,dgBlue);
  for(let i=0;i<=m;i++)unit(xx,z+(i/m-.5)*d*.76,false);
 }
}

// Si vẫn (鸱吻) ở hai đầu nóc
export function chiwen(p,side,dx,dz,s,mat){
 const yaw=-Math.atan2(dz,dx);
 const at=(u,y,v=0)=>[p.x+u*dx-v*dz,p.y+y,p.z+u*dz+v*dx];
 const put=(o)=>{o.rotation.y=yaw;return o};
 put(box(...at(side*.08*s,.55*s),.55*s,1.1*s,.3*s,mat));
 put(box(...at(-side*.28*s,.28*s),.42*s,.32*s,.34*s,mat));
 put(box(...at(side*.36*s,.86*s),.14*s,.36*s,.22*s,mat));
 put(box(...at(-side*.06*s,1.24*s),.08*s,.42*s,.08*s,dgBlue));
 const t=add(new THREE.TorusGeometry(.26*s,.085*s,6,12,Math.PI*1.25),mat,...at(side*.14*s,1.12*s));
 t.rotation.y=yaw+(side<0?Math.PI:0);
}

export function buildOrnaments(){
// ---------- Chi tiết kiến trúc ----------
eaveTex=pattern(64,64,c=>{
 c.fillStyle='#1d3a35';c.fillRect(0,0,64,64);
 c.fillStyle='#c9973a';c.fillRect(0,0,64,8);
 const g=c.createRadialGradient(30,18,2,32,20,16);g.addColorStop(0,'#f7da84');g.addColorStop(.7,'#c8952f');g.addColorStop(1,'#6b4615');
 c.fillStyle=g;c.beginPath();c.arc(32,20,14,0,6.283);c.fill();
 c.strokeStyle='#8a5d1c';c.lineWidth=2;c.beginPath();c.arc(32,20,8,0,6.283);c.stroke();
 c.fillStyle='#d9a843';
 for(const x0 of [0,50]){c.beginPath();c.moveTo(x0,6);c.lineTo(x0+14,6);c.lineTo(x0+7,30);c.closePath();c.fill()}
 c.fillStyle='#2f6f78';c.fillRect(9,40,20,20);c.fillStyle='#e8d9a0';c.fillRect(14,45,10,10);
 c.fillStyle='#3b7a4f';c.fillRect(37,40,20,20);c.fillStyle='#d8b250';c.beginPath();c.arc(47,50,6,0,6.283);c.fill();
});
eaveMat=new THREE.MeshStandardMaterial({map:eaveTex,roughness:.6,side:THREE.DoubleSide});
soffitTex=pattern(64,64,c=>{
 c.fillStyle='#16282a';c.fillRect(0,0,64,64);
 for(const x of [4,36]){const g=c.createLinearGradient(x,0,x+24,0);g.addColorStop(0,'#1f4c47');g.addColorStop(.5,'#3a8580');g.addColorStop(1,'#1f4c47');c.fillStyle=g;c.fillRect(x,0,24,64)}
 c.fillStyle='rgba(214,178,90,.55)';for(const x of [4,36])c.fillRect(x,0,24,2);
});
soffitMat=new THREE.MeshStandardMaterial({map:soffitTex,roughness:.75,side:THREE.DoubleSide});
bracketTex=pattern(128,48,c=>{
 c.fillStyle='#14281f';c.fillRect(0,0,128,48);
 const blk=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);c.strokeStyle='#d6b25a';c.lineWidth=1.3;c.strokeRect(x+.7,y+.7,w-1.4,h-1.4)};
 for(const cx of [32,96]){blk(cx-8,35,16,13,'#2e6b73');blk(cx-15,25,30,10,'#3d7d55');blk(cx-22,15,44,10,'#2e6b73');blk(cx-29,5,58,10,'#3d7d55')}
 c.fillStyle='#8c2c22';c.fillRect(0,0,128,4);c.fillStyle='#d6b25a';c.fillRect(0,4,128,1.5);
});
bracketMat=new THREE.MeshStandardMaterial({map:bracketTex,roughness:.7,side:THREE.DoubleSide});
dgBlue=material('#2f6a72');
dgGreen=material('#3d7a52');
dgGold=material('#c79a45');
// Thú chầu trên nóc: con thú gọn hơn (thân, đầu, vây)
beastBody=new THREE.SphereGeometry(.16,8,6);
beastHead=new THREE.IcosahedronGeometry(.1,1);
studDoorTex=pattern(128,128,c=>{
 c.fillStyle='#8a2a1f';c.fillRect(0,0,128,128);
 c.fillStyle='#5e1c15';c.fillRect(62,0,4,128);c.fillRect(0,0,128,4);c.fillRect(0,124,128,4);c.fillRect(0,0,4,128);c.fillRect(124,0,4,128);
 for(const ox of [8,70])for(let r=0;r<9;r++)for(let k=0;k<4;k++){
  const x=ox+6+k*13,y=10+r*12.6,g=c.createRadialGradient(x-1,y-1,0,x,y,4.2);
  g.addColorStop(0,'#fbe39a');g.addColorStop(.6,'#c99a3e');g.addColorStop(1,'#6e4a16');c.fillStyle=g;c.beginPath();c.arc(x,y,3.8,0,6.283);c.fill();
 }
 c.fillStyle='#d4a849';for(const x of [56,72]){c.beginPath();c.arc(x,66,5,0,6.283);c.fill()}
});
studDoor=new THREE.MeshStandardMaterial({map:studDoorTex,bumpMap:bumpFrom(studDoorTex,'grayscale(1) contrast(1.6)'),bumpScale:3,roughness:.55,metalness:.15});
windowTex=pattern(96,64,c=>{
 c.fillStyle='#5a1f18';c.fillRect(0,0,96,64);
 c.fillStyle='#e9dcc0';c.fillRect(6,6,84,52);
 c.strokeStyle='#8b2b1f';c.lineWidth=3;
 for(let x=6;x<=90;x+=10.5){c.beginPath();c.moveTo(x,6);c.lineTo(x,58);c.stroke()}
 for(let y=6;y<=58;y+=10.4){c.beginPath();c.moveTo(6,y);c.lineTo(90,y);c.stroke()}
 c.strokeStyle='#c99a3e';c.lineWidth=1.5;c.strokeRect(6,6,84,52);
});
windowMat=new THREE.MeshStandardMaterial({map:windowTex,bumpMap:bumpFrom(windowTex,'grayscale(1) invert(1) contrast(1.5)'),bumpScale:1.5,emissiveMap:windowTex,emissive:'#ffad60',emissiveIntensity:0,roughness:.75});
}

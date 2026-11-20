// Nội Kim Thủy Hà, cầu đá, lối đi trong vườn.
import * as THREE from 'three';
import {add,beamBetween,bounds,box,surfaceRect} from '../builders/primitives.js';
import {pattern,random,vec} from '../core/utils.js';
import {data} from '../data.js';
import {bridges,carvedStone,gardenPebbles,poolDeck,stone,water,waterways} from '../materials/textures.js';

export let river,ripples;

export function ribbon(points,width,mat,y){
 const positions=[],indices=[],uv=[];
 for(let i=0;i<points.length;i++){
  const [x,z]=points[i],a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];
  const dir=vec(b[0]-a[0],0,b[1]-a[1]).normalize();
  for(const s of [-1,1]){
   const xx=x+s*dir.z*width/2,zz=z-s*dir.x*width/2;
   positions.push(xx,y,zz);uv.push(xx*.52,zz*.52);
  }
  if(i){const k=i*2;indices.push(k-2,k-1,k,k-1,k+1,k)}
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
 mat.side=THREE.DoubleSide;add(g,mat,0,0,0,{shadow:false});
}

export function buildWater(){
river=data.river;
ribbon(river,11.9,poolDeck,.039);
ribbon(river,9.5,water,.046);
ripples=pattern(128,128,c=>{
 c.fillStyle='#a8b0a0';c.fillRect(0,0,128,128);
 for(let i=0;i<70;i++){
  c.strokeStyle=i%2?'#cfdbcb45':'#566c652c';c.lineWidth=.55+random()*.8;
  const x=random()*128,y=random()*128;
  c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+5,y+1.8,x+10+random()*9,y);c.stroke();
 }
});
water.map=ripples;
water.roughness=.45;
water.needsUpdate=true;
for(const path of data.gardenPaths)ribbon(path,1.6,gardenPebbles,.057);
for(let i=1;i<river.length;i++)waterways.push([river[i-1],river[i]]);
for(const outline of data.bridges){
 const [x,z,w,d]=bounds(outline),south=z+d/2,north=z-d/2;
 const profile=zz=>.06+.68*Math.max(0,Math.sin(Math.PI*(zz-north)/d))**1.65;
 const n=Math.ceil(d/.38);
 for(let i=0;i<n;i++){
  const zz=north+(i+.5)*d/n,y=profile(zz);
  box(x,y-.17,zz,w*.91,.34,d/n+.018,stone);
  surfaceRect(x,zz,w*.91,d/n+.025,y);
 }
 for(const side of [-1,1]){
  const xx=x+side*w*.453;
  for(let i=0;i<15;i++){
   const a=north+i*d/15,b=north+(i+1)*d/15;
   box(xx,profile(a)+.48,a,.31,.96,.33,stone,true);
   box(xx,profile(a)+1.01,a,.4,.12,.4,stone);
   beamBetween(vec(xx,profile(a)+.73,a),vec(xx,profile(b)+.73,b),.125,stone);
   beamBetween(vec(xx,profile(a)+.30,a),vec(xx,profile(b)+.30,b),.085,stone);
  }
  box(xx,.54,south,.31,.96,.33,stone,true);
 }
 bridges.push({outline,axis:[[x,north],[x,south]]});
}
riverRails();
}

// Lan can đá dọc hai bờ Nội Kim Thủy Hà (đoạn giữa hai dãy hành lang), ngắt ở đầu năm cây cầu:
// trụ vuông đầu tròn, ô chắn chạm hoa, tay vịn trên.
function riverRails(){
 const off=5.75,step=2.2,limitX=95;
 // Khung cầu (nới 0,15 m): lan can chạy sát tới mép cầu rồi dừng.
 const bridgeBoxes=data.bridges.map(o=>{const [x,z,w,d]=bounds(o);return [x-w/2-.15,z-d/2-.15,x+w/2+.15,z+d/2+.15]});
 const blocked=([x,z])=>Math.abs(x)>limitX||bridgeBoxes.some(([a,b,c,d])=>x>a&&x<c&&z>b&&z<d);
 // Lấy mẫu đều theo chiều dài đường sông, dời sang hai bên theo pháp tuyến.
 const P=river,samples=[];
 for(let i=1;i<P.length;i++){
  const [ax,az]=P[i-1],[bx,bz]=P[i],len=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.round(len/step));
  for(let k=i===1?0:1;k<=n;k++){const t=k/n;samples.push([ax+(bx-ax)*t,az+(bz-az)*t,(bx-ax)/len,(bz-az)/len])}
 }
 const post=([x,z])=>{box(x,.5,z,.26,1,.26,stone,true);add(new THREE.SphereGeometry(.14,8,6),carvedStone,x,1.1,z)};
 const panel=([x,z],[x2,z2])=>{
  const len=Math.hypot(x2-x,z2-z);if(len<.35)return;
  const yaw=-Math.atan2(z2-z,x2-x);
  const p=box((x+x2)/2,.42,(z+z2)/2,len-.26,.5,.14,carvedStone,true);p.rotation.y=yaw;
  const r=box((x+x2)/2,.84,(z+z2)/2,len-.2,.12,.2,stone);r.rotation.y=yaw;
 };
 // Điểm ranh giới giữa đoạn đi được và khung cầu (chia đôi).
 const edgeOf=(p,q)=>{let a=p,b=q;for(let k=0;k<20;k++){const m=[(a[0]+b[0])/2,(a[1]+b[1])/2];if(blocked(m))b=m;else a=m}return a};
 for(const s of [-1,1]){
  const pts=samples.map(([x,z,dx,dz])=>[x+s*dz*off,z-s*dx*off]);
  const ok=pts.map(p=>!blocked(p));
  for(let i=0;i<pts.length;i++){
   if(ok[i])post(pts[i]);
   if(i+1>=pts.length)continue;
   if(ok[i]&&ok[i+1])panel(pts[i],pts[i+1]);
   else if(ok[i]!==ok[i+1]){
    const [good,bad]=ok[i]?[pts[i],pts[i+1]]:[pts[i+1],pts[i]];
    const e=edgeOf(good,bad);post(e);panel(good,e);
   }
  }
 }
}

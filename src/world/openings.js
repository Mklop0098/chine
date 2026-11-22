// Trổ lối đi: cắt các đa giác tường / nhà theo một ô chữ nhật quanh mỗi lối mở,
// thêm cửa gỗ đinh vàng mở toang, xà ngang và mái nhỏ trên cổng tường.
import * as THREE from 'three';
import {box} from '../builders/primitives.js';
import {roof} from '../builders/roof.js';
import {OPENINGS} from './openingsData.js';
import {data} from '../data.js';
import {inWestSix} from '../core/westSixLayout.js';
import {inWestRear} from '../core/westSixRearLayout.js';
import {inEastSix} from '../core/eastSixLayout.js';
import {inFengxian,inTrai} from '../core/fengxianLayout.js';
import {paintedBeam,red,roofGold,stone} from '../materials/textures.js';
import {studDoor} from '../builders/ornaments.js';

const HALF_W=1.55;

// Cắt đa giác theo nửa mặt phẳng a*x+b*z+c >= 0 (Sutherland–Hodgman).
function clipHalf(poly,a,b,c){
 const out=[],f=p=>a*p[0]+b*p[1]+c;
 for(let i=0;i<poly.length;i++){
  const P=poly[i],Q=poly[(i+1)%poly.length],fp=f(P),fq=f(Q);
  if(fp>=0)out.push(P);
  if((fp>=0)!==(fq>=0)){const t=fp/(fp-fq);out.push([P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t])}
 }
 return out;
}
const area=p=>Math.abs(p.reduce((s,[x,z],i)=>{const [u,v]=p[(i+1)%p.length];return s+x*v-u*z},0))/2;

function frame(o){
 const [x,z,dx,dz,len]=o;
 return {x,z,ax:dx,az:dz,px:-dz,pz:dx,band:len/2+.9};
}
// Toạ độ cục bộ: dọc lối đi (along) và ngang lối (perp).
const along=(f,p)=>(p[0]-f.x)*f.ax+(p[1]-f.z)*f.az;
const perp=(f,p)=>(p[0]-f.x)*f.px+(p[1]-f.z)*f.pz;
function hits(f,poly){
 let a0=Infinity,a1=-Infinity,p0=Infinity,p1=-Infinity;
 for(const q of poly){const a=along(f,q),p=perp(f,q);a0=Math.min(a0,a);a1=Math.max(a1,a);p0=Math.min(p0,p);p1=Math.max(p1,p)}
 return a1>-f.band&&a0<f.band&&p1>-HALF_W&&p0<HALF_W;
}
// Trừ ô chữ nhật lối đi khỏi đa giác: trả về các mảnh còn lại.
function subtract(poly,f){
 const pieces=[];
 // perp < -W ; perp > W
 pieces.push(clipHalf(poly,-f.px,-f.pz,f.px*f.x+f.pz*f.z-HALF_W));
 pieces.push(clipHalf(poly,f.px,f.pz,-(f.px*f.x+f.pz*f.z)-HALF_W));
 // phần giữa nhưng nằm ngoài dải dọc lối
 const mid=clipHalf(clipHalf(poly,f.px,f.pz,-(f.px*f.x+f.pz*f.z)+HALF_W),-f.px,-f.pz,f.px*f.x+f.pz*f.z+HALF_W);
 if(mid.length>=3){
  pieces.push(clipHalf(mid,-f.ax,-f.az,f.ax*f.x+f.az*f.z-f.band));
  pieces.push(clipHalf(mid,f.ax,f.az,-(f.ax*f.x+f.az*f.z)-f.band));
 }
 return pieces.filter(p=>p.length>=3&&area(p)>.02);
}
// Phần đa giác nằm trong lối đi (để dựng xà ngang phía trên).
export function insideGap(poly,f){
 let p=clipHalf(poly,f.px,f.pz,-(f.px*f.x+f.pz*f.z)+HALF_W);
 p=clipHalf(p,-f.px,-f.pz,f.px*f.x+f.pz*f.z+HALF_W);
 p=clipHalf(p,f.ax,f.az,-(f.ax*f.x+f.az*f.z)+f.band);
 p=clipHalf(p,-f.ax,-f.az,f.ax*f.x+f.az*f.z+f.band);
 return p.length>=3&&area(p)>.02?p:null;
}
// Các phần nằm trong lối đi của một đa giác (dùng để dựng xà / trần phía trên lối).
export function gapsFor(poly){return allFrames().filter(f=>hits(f,poly)).map(f=>insideGap(poly,f)).filter(Boolean)}

// Lối mở gốc + lối mở cho tường / cổng bổ sung từ OSM (tính khi dữ liệu đã nạp).
let _frames=null;
// Lối chéo cũ tại góc tường Càn Thanh Môn đã được thay bằng tường chữ L.
const allFrames=()=>_frames||(_frames=[...OPENINGS,...(data?.osmAdditions?.openings||[])]
 .filter(o=>!inWestSix(o[0],o[1]))
 .filter(o=>!inWestRear(o[0],o[1]))
 .filter(o=>!inEastSix(o[0],o[1]))
 .filter(o=>!inFengxian(o[0],o[1]))
 .filter(o=>!inTrai(o[0],o[1]))
 .filter(o=>!(Math.abs(o[0]+158.22)<.01&&Math.abs(o[1]+60.45)<.01))
 // Bỏ cổng nhỏ gạch X giữa tường ngoài sân phụ Từ Ninh; xây liền tường.
 .filter(o=>!(Math.abs(o[0]+157.99)<.01&&Math.abs(o[1]+113.71)<.01))
 .filter(o=>!(o[0]>-262&&o[0]<-175&&o[1]>-164&&o[1]<-60))
 .filter(o=>!(o[0]>-149&&o[0]<-68&&o[1]>-209&&o[1]<-115))
 .filter(o=>!(o[0]===-24&&o[1]===-121.5)&&!(o[0]===-45&&o[1]===-297))
 .filter(o=>!(o[0]===-56.31&&o[1]===-339.03))
 .filter(o=>!(o[0]===-18&&o[1]===-408.75))
 .filter(o=>!(Math.abs(o[0])<18&&o[1]<-414&&o[1]>-431))
 .filter(o=>!(Math.abs(o[0])>=65&&Math.abs(o[0])<=73&&o[1]>-427&&o[1]<-114))
 .map(frame));
const used=new Set();
// Trả về các mảnh của đa giác sau khi trổ mọi lối đi đi qua nó; ghi lại lối nào đã cắt vào loại vật cản nào.
export function cutOut(poly,kind='wall',top=3.1){
 let pieces=[poly];
 allFrames().forEach((f,i)=>{
  if(!hits(f,poly))return;
  const next=[];for(const p of pieces){if(hits(f,p))next.push(...subtract(p,f));else next.push(p)}
  pieces=next;
  if(!f.cut||f.top<top){f.cut=kind;f.top=top;f.poly=poly}
  used.add(i);
 });
 return pieces;
}

// Cửa gỗ đinh vàng mở toang ở hai đầu lối đi, xà ngang, mái nhỏ trên cổng tường.
export function decorateOpenings(){
 const yawOf=f=>-Math.atan2(f.pz,f.px);
 for(const f of allFrames()){
  if(!f.cut)continue;
  // Giữ khe xuyên tường nhưng dùng riêng cổng mới, tránh dựng thêm mái/cánh cửa lên nó.
  if(f.x===-66&&f.z===-333)continue;
  const yaw=yawOf(f),H=Math.min(2.6,f.top-.35);
  for(const end of [-1,1]){
   const ex=f.x+f.ax*end*(f.band-.75),ez=f.z+f.az*end*(f.band-.75);
   // Khung cửa: hai trụ đỏ, xà sơn.
   for(const s of [-1,1]){
    const px=ex+f.px*s*(HALF_W+.08),pz=ez+f.pz*s*(HALF_W+.08);
    const post=box(px,H/2,pz,.26,H,.26,red);post.rotation.y=yaw;
    // Cánh cửa mở áp vào tường bên trong lối.
    const lx=px-f.px*s*.12+f.ax*end*-.75,lz=pz-f.pz*s*.12+f.az*end*-.75;
    const leaf=box(lx,H*.47,lz,.08,H*.9,1.45,studDoor);leaf.rotation.y=yaw;
   }
   const lintel=box(ex,H+.12,ez,HALF_W*2+.5,.26,.3,paintedBeam);lintel.rotation.y=yaw;
   const sill=box(ex,.04,ez,HALF_W*2+.3,.08,.34,stone);sill.rotation.y=yaw;
  }
  if(f.cut==='wall'){
   // Trần lối đi và mái ngói nhỏ trên cổng tường.
   const cap=box(f.x,f.top-.15,f.z,HALF_W*2+.1,.3,f.band*2,red,false,false);cap.rotation.y=yaw;
   const w=HALF_W*2+1.2,d=f.band*2+1;
   roof(f.x,f.z,w,d,f.top+.05,1.0,roofGold,true,{dx:f.px,dz:f.pz,style:'hip-gable'});
  }
 }
 return used.size;
}
export const openingFrames=()=>allFrames();

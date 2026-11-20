// Mái cong Trung Hoa: lũ điện (hipped), hiết sơn (hip-gable), mái hồi, chóp; thú chầu, diềm, mặt dưới mái.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {chiwen,eaveMat,soffitMat} from './ornaments.js';
import {add,beamBetween} from './primitives.js';
import {vec} from '../core/utils.js';
import {baseStone,gold,paintedBeam,red,roofGold} from '../materials/textures.js';

// Thú chầu trên gờ mái (tẩu thú): thú ngồi chồm hướng ra mép mái, có bờm, sừng, đuôi; con đầu là tiên nhân cưỡi phượng.
const T=THREE,mk=(g,x=0,y=0,z=0,sx=1,sy=1,sz=1,rx=0)=>{g.scale(sx,sy,sz);if(rx)g.rotateX(rx);return g.translate(x,y,z)};
let _beast=null,_rider=null;
function beastGeo(){
 if(_beast)return _beast;
 const parts=[
  mk(new T.BoxGeometry(.2,.05,.32),0,.025,0),
  mk(new T.SphereGeometry(.13,8,6),0,.17,-.03,.72,.85,1.1),
  mk(new T.CylinderGeometry(.035,.04,.17,6),.065,.12,.09),mk(new T.CylinderGeometry(.035,.04,.17,6),-.065,.12,.09),
  mk(new T.SphereGeometry(.09,8,6),0,.33,.09,1,.95,1.05),
  mk(new T.BoxGeometry(.075,.055,.09),0,.3,.17),
  mk(new T.ConeGeometry(.028,.11,6),0,.43,.06,1,1,1,-.5),
  mk(new T.ConeGeometry(.05,.14,6),0,.3,-.03,1.3,1,.5,-.9),
  mk(new T.ConeGeometry(.035,.18,6),0,.25,-.19,1,1,1,-2.3)
 ];
 return _beast=mergeGeometries(parts.map(g=>g.index?g.toNonIndexed():g));
}
function riderGeo(){
 if(_rider)return _rider;
 const parts=[
  mk(new T.BoxGeometry(.2,.05,.32),0,.025,0),
  mk(new T.SphereGeometry(.12,8,6),0,.15,0,.8,.7,1.3),
  mk(new T.ConeGeometry(.05,.22,6),0,.17,-.2,1.6,1,.5,-1.9),
  mk(new T.CylinderGeometry(.015,.02,.12,6),0,.24,.14),mk(new T.SphereGeometry(.035,8,6),0,.31,.17),
  mk(new T.CylinderGeometry(.04,.07,.2,8),0,.32,.0),mk(new T.SphereGeometry(.05,8,6),0,.46,.0),
  mk(new T.CylinderGeometry(.03,.05,.05,8),0,.52,0),
  mk(new T.BoxGeometry(.3,.02,.1),0,.2,-.02)
 ];
 return _rider=mergeGeometries(parts.map(g=>g.index?g.toNonIndexed():g));
}

export function roof(x,z,w,d,eave,rise,mat=roofGold,detail=false,options={}){
 const {style='hipped',inner=null,animals=0,keepAxis=false}=options;
 let {dx=1,dz=0}=options;
 // keepAxis: giữ nóc mái theo (dx, dz) kể cả khi nhà sâu hơn dài (đoạn nhà nối ngắn).
 if(d>w&&!keepAxis){
  [w,d]=[d,w];
  [dx,dz]=[-dz,dx];
 }
 const hipGable=style==='hip-gable',pyramid=style==='pyramid',gable=style.startsWith('gable');
 const a=w/2+(style==='gable-overhang'?.35:0),b=d/2;
 const kneeX=a-Math.min(b*.40,a*.23),kneeZ=b*.48;
 const ridgeX=pyramid?0:hipGable?kneeX:gable?a:Math.max(a*.24,a-b*.78);
 const topX=inner?Math.max(...inner)/2:ridgeX,topZ=inner?Math.min(...inner)/2:0;
 const cap=pyramid&&detail&&!inner?Math.min(.86,rise*.22):0;
 const bodyRise=rise-cap;
 const curl=gable?0:Math.min(.68,rise*.19,b*.095);
 const trim=mat===roofGold?gold:options.trim||baseStone;
 const point=(u,v,h)=>vec(x+u*dx-v*dz,eave+h,z+u*dz+v*dx);
 const sweep=(hx,hz,endX,endZ,base,peak,lift)=>({hx,hz,endX,endZ,base,peak,lift});
 const lower=hipGable&&!inner
  ?sweep(a,b,kneeX,kneeZ,0,bodyRise*.47,curl)
  :sweep(a,b,topX,topZ,0,bodyRise,curl);
 const upper=hipGable&&!inner?sweep(kneeX,kneeZ,kneeX,0,bodyRise*.47,bodyRise,0):null;
 const faces=[{front:true,side:1},{front:false,side:1},{front:true,side:-1},{front:false,side:-1}];
 function sample(band,face,u,t){
  const hw=THREE.MathUtils.lerp(band.hx,band.endX,t),hd=THREE.MathUtils.lerp(band.hz,band.endZ,t);
  const h=THREE.MathUtils.lerp(band.base,band.peak,.24*t+.76*t**1.55)+band.lift*Math.abs(u)**7*(1-t)**4;
  return face.front?point(u*hw,face.side*hd,h):point(face.side*hw,u*hd,h);
 }
 function surface(band,face){
  const span=face.front?band.hx:band.hz;
  const columns=detail?Math.min(32,Math.max(12,Math.ceil(span))):8;
  const rows=detail?16:8,pos=[],uv=[],idx=[];
  const reverse=face.front?face.side<0:face.side>0;
  for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
   const u=2*i/columns-1,t=j/rows,p=sample(band,face,u,t);
   pos.push(p.x-x,p.y-eave,p.z-z);
   uv.push(u*span*.49,t*Math.hypot(band.peak-band.base,face.front?band.hz-band.endZ:band.hx-band.endX)*.54);
   if(i===columns||j===rows)continue;
   const k=j*(columns+1)+i,n=k+columns+1;
   if(reverse)idx.push(k,n,k+1,k+1,n,n+1);
   else idx.push(k,k+1,n,k+1,n+1,n);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(idx);
  geometry.computeVertexNormals();
  add(geometry,mat,x,eave,z);
 }
 for(const face of faces){
  if(!gable||face.front||inner)surface(lower,face);
  if(upper&&face.front)surface(upper,face);
 }
 function trace(at,segments,radius,material=trim){
  let start=at(0);
  for(let i=1;i<=segments;i++){
   const end=at(i/segments);
   if(start.distanceToSquared(end)>1e-8)beamBetween(start,end,radius,material,7);
   start=end;
  }
 }
 if(upper||gable&&!inner){
  const band=upper||lower;
  for(const side of [-1,1]){
   const pos=[];
   for(const face of faces.filter(face=>face.front)){
    const foot=sample(band,face,side,0),center=point(side*band.hx,0,band.base);
    let start=foot;
    for(let i=1;i<=16;i++){
     const end=sample(band,face,side,i/16);
     const triangle=face.side===side?[center,end,start]:[center,start,end];
     pos.push(...triangle.flatMap(p=>[p.x-x,p.y-eave,p.z-z]));
     start=end;
    }
   }
   const geometry=new THREE.BufferGeometry();
   geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
   geometry.computeVertexNormals();
   add(geometry,upper?red:baseStone,x,eave,z);
   if(upper)beamBetween(point(side*band.hx,-band.hz,band.base),point(side*band.hx,band.hz,band.base),.10,paintedBeam,6);
   for(const face of faces.filter(face=>face.front)){
    trace(t=>sample(band,face,side,t),detail?10:5,style==='gable-hard'?.13:.115);
   }
  }
 }
 if(!inner&&!pyramid){
  beamBetween(point(-ridgeX-.08,0,bodyRise),point(ridgeX+.08,0,bodyRise),detail?.20:.095,trim,9);
  if(detail){const cs=Math.min(3.1,Math.max(.42,a*.075));for(const sd of [-1,1])chiwen(point(sd*(ridgeX+.05),0,bodyRise),sd,dx,dz,cs,trim)}
 }
 if(cap){
  const profile=[[0,0],[.34,0],[.34,.12],[.24,.22],[.18,.32],[.25,.47],[.22,.64],[.10,.82],[0,1]];
  add(new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r*cap/.7,y*cap)),16),trim,x,eave+bodyRise,z);
 }
 if(!detail)return;
 {
  const strip=(band,face)=>{
   const span=face.front?band.hx:band.hz,N=Math.max(8,Math.ceil(span*2.6));
   const P=[],U=[],I=[];let dist=0,prev=null;
   for(let i=0;i<=N;i++){
    const u=2*i/N-1,p=sample(band,face,u,0);if(prev)dist+=p.distanceTo(prev);prev=p;
    P.push(p.x-x,p.y-eave+.03,p.z-z,p.x-x,p.y-eave-.38,p.z-z);U.push(dist/.34,1,dist/.34,0);
    if(i<N){const k=i*2;I.push(k,k+1,k+2,k+1,k+3,k+2)}
   }
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setIndex(I);g.computeVertexNormals();
   add(g,eaveMat,x,eave,z,{shadow:false});
   const hz=face.front?band.hz:band.hx,ez=face.front?band.endZ:band.endX;
   const depth=Math.min(.9,.26*hz/Math.max(.5,hz-ez)),rows=3,cols=Math.min(40,Math.max(10,Math.ceil(span)));
   const P2=[],U2=[],I2=[];
   for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const u=2*i/cols-1,t=j/rows*depth,p=sample(band,face,u,t);
    P2.push(p.x-x,p.y-eave-.15,p.z-z);U2.push(u*span/.68,t*6);
    if(i<cols&&j<rows){const k=j*(cols+1)+i,n=k+cols+1;I2.push(k,k+1,n,k+1,n+1,n)}
   }
   const g2=new THREE.BufferGeometry();g2.setAttribute('position',new THREE.Float32BufferAttribute(P2,3));g2.setAttribute('uv',new THREE.Float32BufferAttribute(U2,2));g2.setIndex(I2);g2.computeVertexNormals();
   add(g2,soffitMat,x,eave,z,{shadow:false});
  };
  for(const face of faces){if(gable&&!face.front&&!inner)continue;strip(lower,face)}
 }
 for(const face of faces){
  if(gable&&!face.front&&!inner)continue;
  trace(t=>sample(lower,face,t*2-1,0),14,.112);
  if(!face.front||gable)continue;
  for(const side of [-1,1]){
   const at=t=>sample(lower,face,side,t);
   trace(at,14,.145);
   const end=Math.min(.64,(animals+1)*.50/at(0).distanceTo(at(1)));
   for(let i=0;i<animals;i++){
    const t=(i+1)/(animals+1)*end;
    const foot=at(t),forward=at(Math.max(0,t-.016)).sub(foot).normalize();
    const o=add(i===0&&animals>=3?riderGeo():beastGeo(),trim,foot.x,foot.y+.02,foot.z);
    o.rotation.y=Math.atan2(forward.x,forward.z);
   }
  }
 }
}

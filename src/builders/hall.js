// Điện có cột, cửa, đấu củng, mái một hoặc hai tầng; lan can nền đá; cầu thang có lan can.
import * as THREE from 'three';
import {dougongRow,windowMat} from './ornaments.js';
import {add,beamBetween,box,plaque,surfaceRect} from './primitives.js';
import {roof} from './roof.js';
import {vec} from '../core/utils.js';
import {baseStone,carvedStone,deep,doorPanels,paintedBeam,red,roofGold,stone,wallRed} from '../materials/textures.js';
import {addFacadeLantern} from '../world/lanterns.js';

// Cột gỗ sơn son: thân thu nhỏ dần lên trên (thu phân), mép đáy bo; chân cột đá tảng hình trống chạm cánh sen.
const colCache=new Map();
function columnGeo(h){
 const k=Math.round(h*20)/20;
 if(!colCache.has(k)){
  const pts=[[.43,-k/2],[.41,-k/2+.1],[.40,-k/2+.3],[.37,k/2-.25],[.36,k/2]].map(([r,y])=>new THREE.Vector2(r*.95,y));
  colCache.set(k,new THREE.LatheGeometry(pts,16));
 }
 return colCache.get(k);
}
const plinthGeo=(()=>{
 const pts=[[.5,0],[.5,.07],[.47,.1],[.5,.15],[.43,.23],[.0,.23]];
 const g=new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),16);
 // cánh sen: gợn tròn quanh trống đá
 const p=g.attributes.position;
 for(let i=0;i<p.count;i++){const a=Math.atan2(p.getZ(i),p.getX(i)),y=p.getY(i),f=y>.08&&y<.21?1+.045*Math.abs(Math.sin(a*8)):1;p.setX(i,p.getX(i)*f);p.setZ(i,p.getZ(i)*f)}
 g.computeVertexNormals();return g;
})();

export function columns(x,z,w,d,y,h,bays,ornate){
 for(const side of [-1,1]){
  const front=z+side*d*.39;
  box(x,y+h-.32,front,w*.97,.64,.56,paintedBeam);
  box(x,y+h-.69,front,w*.96,.15,.63,red);
  for(let i=0;i<=bays;i++){
   const xx=x+(i/bays-.5)*w*.91;
   add(columnGeo(h),red,xx,y+h/2,front,{solid:true});
   box(xx,y+.09,front,1.02,.18,1.02,baseStone);
   add(plinthGeo,carvedStone,xx,y+.18,front);
   box(xx,y+h-.73,front,.94,.24,1.05,deep);
   if(ornate){
    for(let row=0;row<3;row++)box(xx,y+h-.7+row*.19,front+side*row*.14,.78+row*.27,.15,.89+row*.26,row%2?paintedBeam:red);
    box(xx,y+.38,front,.83,.13,.83,stone);
   }
  }
 }
}

export function hall(x,z,w,d,y,top,{double=false,bays=7,columnBays=bays,open=false,ornate=false,sign='',style='hipped',animals=0,lowerAnimals=0,roofMat=roofGold}={}){
 const h=top-y,lower=y+h*(double?.49:.63),columnHeight=lower-y;
 if(!open){
  box(x,y+columnHeight/2,z,w*.83,columnHeight,d*.68,deep,true);
  for(const side of [-1,1]){
   const panelZ=z+side*(d*.34+.048);
   for(let i=0;i<bays;i++){
    const xx=x+((i+.5)/bays-.5)*w*.82;
    box(xx,y+columnHeight*.43,panelZ,w*.81/bays,columnHeight*.85,.15,doorPanels);
    box(xx-w*.405/bays,y+columnHeight*.44,panelZ,.14,columnHeight*.88,.19,red);
   }
  }
  if(d>7)for(const side of [-1,1]){
   const sx=x+side*(w*.415+.05);
   box(sx,y+columnHeight*.16,z,.2,columnHeight*.32,d*.66,wallRed);
   const n=Math.max(1,Math.round(d*.62/3.2));
   for(let i=0;i<n;i++)box(sx+side*.02,y+columnHeight*.55,z+((i+.5)/n-.5)*d*.6,.14,columnHeight*.38,d*.6/n*.84,windowMat);
  }
 }
 columns(x,z,w,d,y,columnHeight,columnBays,ornate);
 for(const side of [-1,1]){
  box(x,lower-.54,z+side*d*.43,w,.42,.5,paintedBeam);
  box(x,lower-.18,z+side*d*.46,w,.31,.44,red);
  const scale=THREE.MathUtils.clamp(columnHeight*.16,.65,2.1);
  for(let i=0;i<bays;i+=bays>=7?2:1){
   const xx=x+((i+.5)/bays-.5)*w*.91;
   addFacadeLantern(xx,lower-.54-.82*scale,z+side*d*.43,scale);
  }
 }
 if(sign)plaque(x,lower-1.15,z+d*.411,sign,Math.min(5,w*.13));
 if(w>6&&d>6)dougongRow(x,z,w,d,lower-.02);
 if(double){
  const neckW=w*.65,neckD=d*.61,upperEave=y+h*.71;
  roof(x,z,w,d,lower,h*.15,roofMat,true,{style,inner:[neckW,neckD],animals:lowerAnimals});
  box(x,(lower+h*.15+upperEave)/2,z,neckW,upperEave-lower-h*.15,neckD,ornate?paintedBeam:red);
  for(const side of [-1,1])box(x,upperEave-.15,z+side*neckD*.5,neckW,.38,.28,paintedBeam);
  dougongRow(x,z,w*.79,d*.76,upperEave);
  roof(x,z,w*.79,d*.76,upperEave,top-upperEave,roofMat,true,{style,animals});
 }else roof(x,z,w,d,lower,top-lower,roofMat,true,{style,animals});
}

export function terraceRails(outline,y,south,spouts=true,gap=13,skip=null){
 const signedA=outline.reduce((sum,[x,z],i)=>{const [u,v]=outline[(i+1)%outline.length];return sum+x*v-u*z},0),outw=signedA>0?1:-1;
 for(let i=0;i<outline.length;i++){
  const [x,z]=outline[i],[xx,zz]=outline[(i+1)%outline.length];
  const len=Math.hypot(xx-x,zz-z),count=Math.max(1,Math.ceil(len/2.4)),yaw=-Math.atan2(zz-z,xx-x);
  const nx=outw*(zz-z)/len,nz=-outw*(xx-x)/len;
  for(let j=0;j<count;j++){
   const t=j/count,u=(j+.5)/count,a=x+(xx-x)*t,b=z+(zz-z)*t,c=x+(xx-x)*u,d=z+(zz-z)*u;
   if(Math.abs(b-south)<.02&&Math.abs(a-1)<gap||skip&&skip(a,b))continue;
   box(a,y+.62,b,.31,1.24,.32,stone,true);box(a,y+1.255,b,.39,.11,.39,stone);
   add(new THREE.SphereGeometry(.17,8,6),carvedStone,a,y+1.42,b);
   if(spouts){const sp=box(a+nx*.32,y-.3,b+nz*.32,.2,.2,.62,carvedStone);sp.rotation.y=Math.atan2(nx,nz);add(new THREE.SphereGeometry(.15,8,6),carvedStone,a+nx*.66,y-.28,b+nz*.66)}
   if(Math.abs(d-south)<.02&&Math.abs(c-1)<gap+.8||skip&&skip(c,d))continue;
   const panel=box(c,y+.54,d,len/count,.55,.20,carvedStone,true);panel.rotation.y=yaw;
  }
 }
}

export function flight(x,front,width,rise,run,bottom=0){
 const n=Math.ceil(rise/.19);
 for(let i=0;i<n;i++){
  const step=rise*(i+1)/n;
  const z=front-(i+.5)*run/n;
  box(x,bottom+step/2,z,width,step,run/n+.035,stone,true).userData.step=true;
  surfaceRect(x,z,width,run/n+.035,bottom+step);
  box(x,bottom+step-.032,z+run/n/2,width,.038,.045,baseStone);
 }
 if(rise<.45)return;
 const L=Math.hypot(rise,run),slope=Math.atan2(rise,run);
 for(const side of [-1,1]){
  const xx=x+side*(width/2+.24);
  const cheek=box(xx,bottom+rise/2+.1,front-run/2,.48,.34,L,stone,true);cheek.rotation.x=slope;
  const m=Math.max(2,Math.ceil(run/1.6));
  for(let k=0;k<=m;k++){
   const t=k/m,pz=front-t*run,py=bottom+t*rise+.26;
   box(xx,py+.5,pz,.24,1,.24,stone,true);add(new THREE.SphereGeometry(.15,8,6),carvedStone,xx,py+1.1,pz);
  }
  beamBetween(vec(xx,bottom+.26+.82,front),vec(xx,bottom+rise+.26+.82,front-run),.09,stone,6);
  const panel=box(xx,bottom+rise/2+.26+.48,front-run/2,.14,.5,L,carvedStone);panel.rotation.x=slope;
 }
}

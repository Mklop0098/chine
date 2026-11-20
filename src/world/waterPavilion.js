import * as THREE from 'three';
import {beamBetween,box,polygon,slab,surfacePoly,surfaceRect} from '../builders/primitives.js';
import {hall} from '../builders/hall.js';
import {grandStair} from '../builders/stairs.js';
import {baseStone,bridges,glaze,paved,red,stone} from '../materials/textures.js';

export const PAVILION_CENTER=[-52.5,-391.5];
const shoreline=[
 [-65.1,-408.5],[-62,-409.5],[-43,-409.5],[-39.4,-407.5],[-39,-405],
 [-40.5,-398],[-38,-390],[-37.4,-381],[-41,-372],[-47,-367],
 [-54,-366.6],[-63,-372],[-66,-382],[-65,-396],[-65,-406],
];
const shoreCurve=new THREE.CatmullRomCurve3(shoreline.map(([x,z])=>new THREE.Vector3(x,0,z)),true,'centripetal');
export const PAVILION_POND=shoreCurve.getPoints(120).slice(0,-1).map(p=>[p.x,p.z]);
export const EAST_PAVILION_CENTER=[53.6,-391.5];
export const EAST_PAVILION_POND=PAVILION_POND.map(([x,z])=>[-x+1.1,z]).reverse();
export const PAVILION_PONDS=[PAVILION_POND,EAST_PAVILION_POND];

export function buildPondRailings(pond=PAVILION_POND,center=PAVILION_CENTER){
 const [cx,cz]=center;
 for(let i=0;i<pond.length;i++){
  const a=pond[i],b=pond[(i+1)%pond.length];
  const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;
  // Chừa lối qua cầu dẫn phía nam.
  if(Math.abs(x-cx)<1.9&&(z>cz+15||z< -406))continue;
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]),yaw=-Math.atan2(b[1]-a[1],b[0]-a[0]);
  const hand=box(x,1.16,z,length+.04,.12,.16,red,true);
  hand.rotation.y=yaw;
  const lower=box(x,.48,z,length+.04,.5,.1,glaze,true);
  lower.rotation.y=yaw;
  if(i%2===0){
   box(a[0],.65,a[1],.18,1.12,.18,red,true);
   box(a[0],1.27,a[1],.26,.13,.26,stone);
  }
 }
}

function rail(x,z,length,alongZ=false,y=1.5){
 const count=Math.ceil(length/1.8),span=length/count;
 const B=(at,yy,w,h,d,mat)=>alongZ?box(x,yy,z+at,d,h,w,mat,true):box(x+at,yy,z,w,h,d,mat,true);
 for(let i=0;i<=count;i++){
  B(-length/2+i*span,y+.56,.16,1.12,.16,red);
  B(-length/2+i*span,y+1.16,.24,.12,.24,stone);
 }
 B(0,y+1.02,length,.12,.15,red);
 for(let i=0;i<count;i++)B(-length/2+(i+.5)*span,y+.48,span-.2,.5,.1,glaze);
}

export function buildWaterPavilion(roofMat,{east=false}={}){
 const [x,z]=east?EAST_PAVILION_CENTER:PAVILION_CENTER,y=1.5;
 const deck=[[x-6,z-6],[x+6,z-6],[x+6,z+6],[x-6,z+6]];
 polygon(deck,.12,y-.12,baseStone,true);
 slab(x,z,12,12,paved,y+.01);
 surfacePoly(deck,y);
 bridges.push({outline:deck.map(p=>[...p]),axis:[[x,z-6],[x,z+6]]});
 // Mở hoàn toàn bốn phía, chỉ giữ cột góc và mái đình.
 hall(x,z,10,10,y,9.85,{open:true,bays:1,ornate:true,style:'pyramid',roofMat});
 rail(x-3.7,z-5.8,4.2);rail(x+3.7,z-5.8,4.2);
 rail(x-5.8,z,11.6,true);rail(x+5.8,z,11.6,true);
 rail(x-3.7,z+5.8,4.2);rail(x+3.7,z+5.8,4.2);
 for(const [bridgeStart,bridgeEnd,out] of [[z+6,-365.35,1],[z-6,-408.9,-1]]){
  const length=Math.abs(bridgeEnd-bridgeStart);
  const endY=.7,count=Math.ceil(length/.65);
  const heightAt=t=>y+(endY-y)*t+.45*Math.sin(Math.PI*t);
  for(let i=0;i<count;i++){
   const t0=i/count,t1=(i+1)/count;
   const z0=bridgeStart+(bridgeEnd-bridgeStart)*t0,z1=bridgeStart+(bridgeEnd-bridgeStart)*t1;
   const y0=heightAt(t0),y1=heightAt(t1),midZ=(z0+z1)/2,midY=(y0+y1)/2;
   const slope=Math.atan((y1-y0)/(z1-z0));
   const floor=box(x,midY-.14,midZ,3,.28,Math.hypot(z1-z0,y1-y0)+.015,paved,true);
   floor.rotation.x=-slope;
   surfaceRect(x,midZ,3,Math.abs(z1-z0)+.015,midY);
   for(const side of [-1,1]){
    const rx=x+side*1.48;
    beamBetween(new THREE.Vector3(rx,y0+1.02,z0),new THREE.Vector3(rx,y1+1.02,z1),.07,red);
    beamBetween(new THREE.Vector3(rx,y0+.4,z0),new THREE.Vector3(rx,y1+.4,z1),.05,red);
    if(i%2===0){
     box(rx,y0+.56,z0,.16,1.12,.16,red,true);
     box(rx,y0+1.16,z0,.24,.12,.24,stone);
    }
   }
  }
  // Bề mặt đầu cầu khớp tuyệt đối với sàn đình và bậc xuống bờ.
  surfaceRect(x,bridgeStart,3,.08,y);
  surfaceRect(x,bridgeEnd,3,.08,endY);
  bridges.push({outline:[[x-1.5,bridgeStart],[x+1.5,bridgeStart],[x+1.5,bridgeEnd],[x-1.5,bridgeEnd]],axis:[[x,bridgeStart],[x,bridgeEnd]]});
  grandStair(x,bridgeEnd,out,3,endY,2.3,'z');
  const stairFoot=bridgeEnd+out*2.3;
  bridges.push({outline:[[x-1.5,bridgeEnd],[x+1.5,bridgeEnd],[x+1.5,stairFoot],[x-1.5,stairFoot]],axis:[[x,bridgeEnd],[x,stairFoot]]});
  if(out<0){
   const front=east?-418.8:-418.12;
   slab(x,(stairFoot+front)/2,3,Math.abs(front-stairFoot),paved,.052);
  }
 }
}

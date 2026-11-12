// Ngọ Môn (mặt bằng chữ U) và các cổng thành.
import {hall} from '../builders/hall.js';
import {archHeader,bounds,box,polygon,slab} from '../builders/primitives.js';
import {data} from '../data.js';
import {baseStone,darkMasonry,paintedBeam,paved,stone,wallRed} from '../materials/textures.js';
import {sideX} from './moat.js';
import {eastZ,westZ} from './rampart.js';

export let wu,wuX,wuZ,wuW,wuD,wuPassages,previous;

export function splitAtX(points,cut,keepLeft){
 const out=[];
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],ok=p=>keepLeft?p[0]<=cut:p[0]>=cut;
  if(ok(a))out.push(a);
  if(ok(a)!==ok(b)){
   const t=(cut-a[0])/(b[0]-a[0]);out.push([cut,a[1]+(b[1]-a[1])*t]);
  }
 }
 return out;
}

export function cityGate(x,z,w,d,top,sideways=false){
 const base=9.9,span=sideways?d:w,depth=sideways?w:d;
 for(const side of [-1,1]){
  const offset=side*(span/4+2.3);
  box(x+(sideways?0:offset),base/2,z+(sideways?offset:0),sideways?depth:span/2-4.6,base,sideways?span/2-4.6:depth,wallRed,true);
 }
 box(x,7.65,z,w,4.5,d,wallRed);
 if(!sideways)archHeader(x,z,d,4.6,3.42,5.42);
 hall(x,z,w*.76,d*.76,base,top,{double:true,bays:5,ornate:true,sign:sideways?"":"神武門"});
}

export function buildWumen(){
wu=data.wuBase;
[wuX,wuZ,wuW,wuD]=bounds(wu);
wuPassages=[-13,0,13];
previous=-1000;
for(const center of [...wuPassages,1002]){
 const segment=splitAtX(splitAtX(wu,previous,false),center-2.45,true);
 if(segment.length>=3)polygon(segment,0,5.2,darkMasonry,true);
 previous=center+2.45;
}
polygon(wu,5.2,6.8,wallRed);
for(const x of wuPassages)archHeader(x,469.15,27.28,4.9,3.07,5.22);
for(let i=0;i<wu.length-1;i++){
 const a=wu[i],b=wu[i+1],length=Math.hypot(a[0]-b[0],a[1]-b[1]);
 if(length<2)continue;
 const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,rotation=-Math.atan2(b[1]-a[1],b[0]-a[0]);
 for(const y of [5.22,11.95]){
  const trim=box(x,y,z,length,.27,.38,y>10?stone:baseStone);trim.rotation.y=rotation;
 }
}
polygon(wu,12,.36,stone);
hall(.5,469.2,65,27,12.36,35.3,{double:true,bays:9,ornate:true,sign:"午門"});
for(const side of [-1,1]){
 const wingX=side<0?-51.6:50.5;
 hall(wingX,side<0?467:468.2,18.8,18.8,12.36,30.2,{double:true,bays:3,ornate:true,style:'pyramid'});
 hall(wingX,549,18.5,18.8,12.36,29.4,{double:true,bays:3,ornate:true,style:'pyramid'});
 hall(wingX,509.8,13.7,62.0,12.36,22.2,{bays:5});
 for(const z of [486,493,500,507,514,521,528]){
  box(wingX,14.95,z,10.9,4.65,1.2,paintedBeam);
 }
}
slab(0,549,62,146,paved,.065);
cityGate(0,-476,105,22,28);
cityGate(sideX-5,eastZ,23,74,23.5,true);
cityGate(-sideX+5,westZ,23,74,23.5,true);
slab(0,-519,24,96,paved,.062);
for(const s of [-1,1])slab(s*413,s>0?eastZ:westZ,82,16,paved,.062);
}

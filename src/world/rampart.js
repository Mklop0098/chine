// Tường thành, lỗ châu mai, giác lâu bốn góc và cổng Đông Hoa, Tây Hoa, Thần Vũ.
import * as THREE from 'three';
import {hall} from '../builders/hall.js';
import {add,bounds,box} from '../builders/primitives.js';
import {roof} from '../builders/roof.js';
import {data} from '../data.js';
import {baseStone,red,roofGold,wallRed} from '../materials/textures.js';
import {sideX,sideZ} from './moat.js';

export let eastZ,westZ;

export function rampart(axis,fixed,start,end){
 const section=new THREE.Shape();
 section.moveTo(-4.31,0);section.lineTo(4.31,0);section.lineTo(3.33,9.9);section.lineTo(-3.33,9.9);section.closePath();
 const g=new THREE.ExtrudeGeometry(section,{depth:end-start,bevelEnabled:false});
 if(axis==='x'){
  g.rotateY(Math.PI/2);add(g,wallRed,start,0,fixed,{solid:true});
  box((start+end)/2,10.17,fixed,end-start,.54,6.75,baseStone);
 }else{
  add(g,wallRed,fixed,0,start,{solid:true});
  box(fixed,10.17,(start+end)/2,6.75,.54,end-start,baseStone);
 }
 const outward=Math.sign(fixed);
 for(let v=start+2;v<end-1;v+=3.15){
  if(axis==='x')box(v,10.72,fixed+outward*3.08,1.9,1.04,.43,wallRed);
  else box(fixed+outward*3.08,10.72,v,.43,1.04,1.9,wallRed);
 }
 if(axis==='x')box((start+end)/2,10.9,fixed-outward*3.1,end-start,.95,.42,wallRed);
 else box(fixed-outward*3.1,10.9,(start+end)/2,.42,.95,end-start,wallRed);
}

export function buildRampart(){
eastZ=bounds(data.sites['40343947'][1])[1];
westZ=eastZ+1;
for(const s of [-1,1]){
 const z=s*(sideZ-4.31),half=s===1?62:51;
 rampart('x',z,-sideX,-half);rampart('x',z,half,sideX);
 const x=s*(sideX-4.31),gateZ=s>0?eastZ:westZ;
 rampart('z',x,-sideZ,gateZ-35);rampart('z',x,gateZ+35,sideZ);
 for(const sz of [-1,1]){
  const tx=s*(sideX-6),tz=sz*(sideZ-7);
  box(tx,5.1,tz,15,10.2,15,wallRed,true);
  hall(tx,tz,16.5,16.5,10.1,24.5,{double:true,bays:3,style:'hip-gable'});
  roof(tx,tz,22,7,15.2,2.4,roofGold,true,{style:'hip-gable'});
  roof(tx,tz,7,22,15.2,2.4,roofGold,true,{style:'hip-gable'});
  for(const [ox,oz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const px=tx+ox*8.6,pz=tz+oz*8.6;
   box(px,11.6,pz,ox?2.4:8,2.9,ox?8:2.4,red);
   roof(px,pz,ox?3.6:9.2,ox?9.2:3.6,13.05,1.5,roofGold,true,{style:'hip-gable'});
  }
 }
}
}

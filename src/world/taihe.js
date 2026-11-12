// Nền Thái Hòa ba tầng, ngự lộ chạm rồng, bậc thang.
import * as THREE from 'three';
import {flight,terraceRails} from '../builders/hall.js';
import {add,box,polygon,surfaceRect} from '../builders/primitives.js';
import {bronze,carvedStone,stone} from '../materials/textures.js';

export let knownHeight,terraceHeight;

export function buildTaihe(){
knownHeight=35.05;
terraceHeight=8.13;
for(let i=0;i<3;i++){
 const w=110-i*7.5,north=-60+i*2.5,south=129.5-i*6.5;
 const y=i*terraceHeight/3,h=terraceHeight/3,top=y+h;
 const frontW=w,waistW=w*.79,backW=w*.91;
 const left=w=>1-w/2,right=w=>1+w/2;
 const outline=[
  [left(frontW),south],[right(frontW),south],[right(frontW),58],[right(waistW),58],
  [right(waistW),13],[right(backW),13],[right(backW),north],[left(backW),north],
  [left(backW),13],[left(waistW),13],[left(waistW),58],[left(frontW),58]
 ];
 polygon(outline,y,h,stone,true);
 for(const [width,start,end] of [[frontW,58,south],[waistW,13,58],[backW,north,13]])surfaceRect(1,(start+end)/2,width,end-start,top);
 for(let j=0;j<outline.length;j++){
  const [x,z]=outline[j],[xx,zz]=outline[(j+1)%outline.length],len=Math.hypot(xx-x,zz-z);
  for(const level of [y+.12,top-.19]){
   const trim=box((x+xx)/2,level,(z+zz)/2,len,.18,.24,stone);
   trim.rotation.y=-Math.atan2(zz-z,xx-x);
  }
 }
 terraceRails(outline,top,south);
 const front=i===0?149:128-(i-1)*6.5,run=i===0?19.5:5;
 for(const x of [-10,10])flight(x,front,5.3,h,run,y);
 const ramp=box(1,y+h/2,front-run/2,5.2,.23,Math.hypot(h,run),carvedStone,true);
 ramp.rotation.x=Math.atan2(h,run);
}
for(const x of [-21.5,23.5]){
 const z=104;
 add(new THREE.CylinderGeometry(.53,.74,.85,14),bronze,x,terraceHeight/3+.44,z);
 const vessel=add(new THREE.SphereGeometry(.73,18,11),bronze,x,terraceHeight/3+1.15,z);vessel.scale.y=.71;
 const ring=add(new THREE.TorusGeometry(.59,.083,8,24),bronze,x,terraceHeight/3+1.48,z);ring.rotation.x=Math.PI/2;
}
}

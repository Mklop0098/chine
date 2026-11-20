// Nền Thái Hòa ba tầng, ngự lộ chạm rồng, bậc thang.
import * as THREE from 'three';
import {flight,terraceRails} from '../builders/hall.js';
import {add,box,polygon,surfaceRect} from '../builders/primitives.js';
import {grandStair} from '../builders/stairs.js';
import {baseStone,bronze,carvedStone,stone} from '../materials/textures.js';

export const RAMP_WIDTH=5.2,FLIGHT_WIDTH=5.3,FLIGHT_OFFSET=5.75,SIDE_Z=35.5,SIDE_W=5;

// Ngự lộ chạm rồng: khối đá đặc hình nêm (không còn là tấm mỏng lơ lửng),
// mặt dốc lặp hoa văn theo từng ô ~3,2 m, hai bên có gờ đá.
export function dragonRamp(x,front,width,rise,run,bottom){
 const L=Math.hypot(rise,run),slope=Math.atan2(rise,run),back=front-run,top=bottom+rise,hw=width/2;
 const p=[],tri=(a,b,c)=>p.push(...a,...b,...c);
 for(const s of [-1,1]){
  const A=[x+s*hw,bottom,front],B=[x+s*hw,bottom,back],C=[x+s*hw,top,back];
  s>0?tri(A,B,C):tri(A,C,B);
 }
 const body=new THREE.BufferGeometry();
 body.setAttribute('position',new THREE.Float32BufferAttribute(p,3));
 body.setAttribute('uv',new THREE.Float32BufferAttribute(new Array(p.length/3*2).fill(0),2));
 body.computeVertexNormals();
 add(body,stone,0,0,0,{solid:true}).userData.outline=[[x-hw,back],[x+hw,back],[x+hw,front],[x-hw,front]];
 const face=new THREE.PlaneGeometry(width,L);
 const uv=face.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*Math.max(1,Math.round(L/3.2)));
 face.rotateX(-Math.PI/2);face.rotateX(slope);
 add(face,carvedStone,x,bottom+rise/2+.004,front-run/2);
 for(const s of [-1,1]){
  const curb=box(x+s*(hw+.13),bottom+rise/2+.07,front-run/2,.26,.2,L,baseStone);
  curb.rotation.x=slope;
 }
 box(x,bottom+.06,front+.12,width+.52,.12,.3,baseStone);
}

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
 // Cầu thang hai bên eo nền (ngang Điện Trung Hòa) theo bản vẽ: chừa lan can chỗ đầu cầu thang.
 terraceRails(outline,top,south,true,9.3,(x,z)=>z>13.5&&z<57.5&&Math.abs(z-SIDE_Z)<SIDE_W/2+.9);
 for(const s of [-1,1])grandStair(SIDE_Z,1+s*waistW/2,s,SIDE_W,h,i===0?5.4:2.6,'x',{bottom:y});
 const front=i===0?149:128-(i-1)*6.5,run=i===0?19.5:5;
 // Ngự lộ ở giữa trục (x=1), hai dãy bậc ôm sát hai bên.
 for(const s of [-1,1])flight(1+s*FLIGHT_OFFSET,front,FLIGHT_WIDTH,h,run,y);
 dragonRamp(1,front,RAMP_WIDTH,h,run,y);
}
for(const x of [-21.5,23.5]){
 const z=104;
 add(new THREE.CylinderGeometry(.53,.74,.85,14),bronze,x,terraceHeight/3+.44,z);
 const vessel=add(new THREE.SphereGeometry(.73,18,11),bronze,x,terraceHeight/3+1.15,z);vessel.scale.y=.71;
 const ring=add(new THREE.TorusGeometry(.59,.083,8,24),bronze,x,terraceHeight/3+1.48,z);ring.rotation.x=Math.PI/2;
}
}

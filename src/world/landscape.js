// Bồn cây, mặt nước nhỏ, Cửu Long Bích.
import * as THREE from 'three';
import {area,bounds,box,lineDistance,polygon} from '../builders/primitives.js';
import {roof} from '../builders/roof.js';
import {material,pattern} from '../core/utils.js';
import {data} from '../data.js';
import {lawn,roofGold,stone,water} from '../materials/textures.js';
import {places} from './landmarks.js';
import {edgeBox} from './mappedBuildings.js';
import {river} from './water.js';
import {buildPondRailings,PAVILION_PONDS,PAVILION_CENTER,EAST_PAVILION_CENTER} from './waterPavilion.js';

export let plantingMat,plantingEdge,mappedWater,dragonWallData;

export function buildLandscape(){
plantingMat=lawn;
plantingEdge=material('#8e8c70');
mappedWater=[];
for(const [kind,outline] of data.landscape){
 const [x,z,w,d]=bounds(outline);
 if(Math.min(w,d)<.6||area(outline)<2)continue;
 if(kind===1){
  if(lineDistance(x,z,river)<11)continue;
  polygon(outline,.042,0,water);
  mappedWater.push(outline);
 }else{
  polygon(outline,.049,0,plantingMat);
  for(let i=0;i<outline.length;i++){
   const a=outline[i],b=outline[(i+1)%outline.length];
   if(Math.hypot(a[0]-b[0],a[1]-b[1])<24)edgeBox(a,b,0,.071,.13,.11,plantingEdge);
  }
 }
}
// Hồ mới đặt cao hơn thảm cỏ để mặt nước phủ kín phần cây cỏ cũ.
for(const [index,pond] of PAVILION_PONDS.entries()){
polygon(pond,.085,0,water);
mappedWater.push(pond.map(p=>[...p]));
for(let i=0;i<pond.length;i++){
 const a=pond[i],b=pond[(i+1)%pond.length];
 edgeBox(a,b,0,.095,.19,.22,stone);
}
buildPondRailings(pond,index===0?PAVILION_CENTER:EAST_PAVILION_CENTER);
}
dragonWallData=data.scenicFeatures['41661995'];
if(dragonWallData?.length){
 const [x,z]=bounds(dragonWallData),w=29.4;
 const relief=pattern(768,144,c=>{
  c.fillStyle='#506d65';c.fillRect(0,0,768,144);
  c.fillStyle='#e2c786';c.fillRect(0,0,768,15);c.fillRect(0,127,768,17);
  for(let i=0;i<9;i++){
   const x=i*768/9;
   c.strokeStyle='#aaba95';c.lineWidth=1;c.strokeRect(x+1,16,82,110);
   c.strokeStyle=['#e2b75f','#e7d4a2','#98714c'][i%3];c.lineWidth=6;c.lineCap='round';
   c.beginPath();c.moveTo(x+17,98);c.bezierCurveTo(x+60,109,x+79,33,x+39,39);c.bezierCurveTo(x+11,44,x+24,80,x+62,67);c.stroke();
   c.fillStyle='#d5bb78';c.beginPath();c.ellipse(x+64,66,7,4,-.2,0,6.28);c.fill();
   c.strokeStyle='#829f8e';c.lineWidth=2;
   for(let j=0;j<3;j++){c.beginPath();c.moveTo(x+9,112+j*4);c.quadraticCurveTo(x+30,105+j*4,x+76,114+j*4);c.stroke()}
  }
 });
 box(x,.18,z,w+.4,.36,.7,stone);
 box(x,1.77,z,w,3.25,.45,new THREE.MeshStandardMaterial({map:relief,roughness:.64}),true);
 roof(x,z,w+.48,1.12,3.39,.11,roofGold,true);
 places.push({name:'Cửu Long Bích',x,z,y:3.5,d:19,detail:true,note:'Bình phong lưu ly dài 29,4 m, cao 3,5 m. Họa tiết chín rồng được phỏng dựng.'});
}
}

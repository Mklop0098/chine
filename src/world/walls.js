// Tường cung, cổng nhỏ trên tường (có cánh cửa), mái ngói phủ đỉnh tường.
import {hall} from '../builders/hall.js';
import {bounds,box,polygon} from '../builders/primitives.js';
import {roof} from '../builders/roof.js';
import {data} from '../data.js';
import {baseStone,red,roofGold,stone,wallRed} from '../materials/textures.js';
import {edgeBox,gateDoors} from './mappedBuildings.js';

export function wallCap(p,top,mat=roofGold){
 const signed=p.reduce((sum,[x,z],i)=>{const [u,v]=p[(i+1)%p.length];return sum+x*v-u*z},0);
 const outward=signed>0?1:-1;
 polygon(p,top,.2,mat);
 for(let i=0;i<p.length;i++){
  const a=p[i],b=p[(i+1)%p.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(len<.35)continue;
  const o=edgeBox(a,b,.2*outward,top+.1,.07,.66,mat);
  if(o){o.rotation.order='YXZ';o.rotation.x=-outward*.42}
  edgeBox(a,b,.06*outward,top-.1,.18,.12,baseStone);
 }
}

export function buildWalls(){
for(const [outline,parts] of data.gatewayWalls){
 for(const part of parts)polygon(part,0,3.1,wallRed,true);
 polygon(outline,2.75,.35,wallRed);
}
for(const [outline,parts,mappedHeight,isGate] of data.gatewayBuildings){
 const [x,z,w,d]=bounds(outline);
 for(const part of parts)polygon(part,0,2.85,wallRed,true);
 if(isGate&&d>35){
  const span=Math.min(18,d*.39);
  box(x,3.14,z,w*.81,.6,span,stone);
  hall(x,z,w*.85,span,3.45,11.9,{double:false,bays:3});
 }else{
  polygon(outline,2.82,.31,red);
  gateDoors(outline,2.85);
  if(w>2.5&&d>2.1)roof(x,z,w+.62,d+.62,3.12,Math.min(2.2,Math.min(w,d)*.3));
 }
}
for(const p of data.walls)polygon(p,0,3.1,wallRed,true);
for(const p of data.walls)wallCap(p,3.1);
for(const [outline] of data.gatewayWalls)wallCap(outline,3.1);
}

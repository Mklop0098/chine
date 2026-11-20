// Ngự đạo, sư tử đồng, vạc nước, đỉnh đồng, rùa – hạc, nhật quỹ, gia lượng.
import * as THREE from 'three';
import {add,beamBetween,bounds,box,lineDistance,pointInPolygon,slab} from '../builders/primitives.js';
import {roof} from '../builders/roof.js';
import {material,pattern,random,vec} from '../core/utils.js';
import {data} from '../data.js';
import {baseStone,bronze,carvedStone,deep,gold,roofGold,stone,water} from '../materials/textures.js';
import {weather} from '../materials/weather.js';
import {places} from './landmarks.js';
import {terraceHeight} from './taihe.js';
import {flushClumps,inBuilding} from './trees.js';
import {river} from './water.js';
import {INNER_TERRACE_HEIGHT,INNER_TERRACE_OUTLINE} from './innerTerrace.js';

export let giltMat,siteBox;

export function lion(x,z,face=1,variant=1,s=1.15,y=0){
 const P=(dx,dy,dz)=>[x+dx*s,y+dy*s,z+dz*s*face];
 box(...P(0,.15,0),2.3*s,.3*s,3.1*s,baseStone,true);
 box(...P(0,.78,0),1.85*s,.95*s,2.65*s,carvedStone,true);
 box(...P(0,1.32,0),2.15*s,.16*s,2.95*s,stone);
 box(...P(0,1.47,0),1.75*s,.16*s,2.55*s,bronze);
 const body=add(new THREE.SphereGeometry(.75*s,18,12),bronze,...P(0,2.2,-.35));body.scale.set(1,1.25,1.1);
 add(new THREE.SphereGeometry(.62*s,16,10),bronze,...P(0,2.62,.32));
 const mane=add(new THREE.IcosahedronGeometry(.74*s,2),bronze,...P(0,3.28,.32));mane.scale.set(1.05,.95,.8);
 const head=add(new THREE.SphereGeometry(.52*s,16,10),bronze,...P(0,3.25,.78));head.scale.set(1,.9,.85);
 box(...P(0,3.05,1.17),.52*s,.3*s,.26*s,bronze);
 for(const sx of [-1,1]){
  box(...P(sx*.4,2.0,.8),.3*s,1.12*s,.32*s,bronze);
  add(new THREE.SphereGeometry(.18*s,10,8),bronze,...P(sx*.4,1.6,.98));
  add(new THREE.SphereGeometry(.12*s,8,6),bronze,...P(sx*.26,3.48,1.04));
 }
 for(let i=0;i<7;i++)add(new THREE.SphereGeometry(.13*s,8,6),bronze,...P((i-3)*.22,3.92,.18+Math.abs(i-3)*.05));
 if(variant>0)add(new THREE.SphereGeometry(.34*s,14,10),bronze,...P(.62*variant,1.9,1.15));
 else{const cub=add(new THREE.SphereGeometry(.3*s,12,8),bronze,...P(-.6,1.82,1.1));cub.scale.set(.8,.8,1.2)}
}

export function vat(x,z,y=0,gilt=false){
 if(inBuilding(x,z,1.4))return;
 const m=gilt?giltMat:bronze;
 box(x,y+.36,z,1.9,.72,1.9,carvedStone,true);
 box(x,y+.2,z,.7,.4,1.95,deep);
 add(new THREE.CylinderGeometry(1.02,.84,1.3,24),m,x,y+1.37,z,{solid:true});
 const rim=add(new THREE.TorusGeometry(1.02,.075,8,28),m,x,y+2.02,z);rim.rotation.x=Math.PI/2;
 for(const s of [-1,1]){
  const h=add(new THREE.TorusGeometry(.2,.05,6,12),m,x+s*1.0,y+1.45,z);h.rotation.y=Math.PI/2;
  add(new THREE.SphereGeometry(.17,8,6),m,x+s*.98,y+1.68,z);
 }
 add(new THREE.CylinderGeometry(.94,.94,.04,24),water,x,y+1.86,z);
}

export const smokeSources=[];

export function ding(x,z,y){
 smokeSources.push([x,y+2.9,z]);
 box(x,y+.45,z,1.15,.9,1.15,carvedStone,true);
 for(let i=0;i<3;i++){const a=i*2.094;add(new THREE.CylinderGeometry(.07,.09,.5,6),bronze,x+Math.cos(a)*.36,y+1.15,z+Math.sin(a)*.36)}
 const b=add(new THREE.SphereGeometry(.56,16,10),bronze,x,y+1.66,z);b.scale.y=.75;
 add(new THREE.CylinderGeometry(.5,.57,.14,16),bronze,x,y+2.06,z);
 add(new THREE.ConeGeometry(.44,.8,8),bronze,x,y+2.53,z);
 add(new THREE.SphereGeometry(.12,8,6),gold,x,y+2.98,z);
 for(const s of [-1,1]){const r=add(new THREE.TorusGeometry(.14,.035,6,10),bronze,x+s*.52,y+2.18,z);r.rotation.y=Math.PI/2}
}

export function turtle(x,z,y){
 box(x,y+.4,z,1.7,.8,2.3,carvedStone,true);
 const sh=add(new THREE.SphereGeometry(.85,18,10),bronze,x,y+1.15,z);sh.scale.set(.95,.5,1.25);
 const hd=add(new THREE.SphereGeometry(.24,10,8),bronze,x,y+1.55,z+1.15);hd.scale.z=1.4;
 beamBetween(vec(x,y+1.1,z+.9),vec(x,y+1.5,z+1.12),.15,bronze,8);
 for(const [a,b] of [[-1,1],[1,1],[-1,-1],[1,-1]])add(new THREE.SphereGeometry(.16,8,6),bronze,x+a*.7,y+.92,z+b*.75);
}

export function crane(x,z,y){
 box(x,y+.4,z,1.4,.8,1.6,carvedStone,true);
 for(const s of [-1,1])beamBetween(vec(x+s*.18,y+.8,z),vec(x+s*.15,y+1.75,z),.045,bronze,6);
 const b=add(new THREE.SphereGeometry(.5,14,10),bronze,x,y+2.1,z);b.scale.set(.75,.75,1.2);
 beamBetween(vec(x,y+2.3,z+.45),vec(x,y+3.3,z+.6),.07,bronze,6);
 add(new THREE.SphereGeometry(.14,8,6),bronze,x,y+3.38,z+.65);
 beamBetween(vec(x,y+3.38,z+.72),vec(x,y+3.3,z+1.05),.03,bronze,5);
}

export function sundial(x,z,y){
 box(x,y+.2,z,2.2,.4,2.2,stone,true);box(x,y+1,z,1.3,1.3,1.3,carvedStone,true);
 const d=add(new THREE.CylinderGeometry(1,1,.16,32),carvedStone,x,y+2.05,z);d.rotation.x=-(Math.PI/2-.69);
 beamBetween(vec(x,y+2.05-.6,z-.5),vec(x,y+2.05+.6,z+.5),.03,bronze,5);
}

export function jialiang(x,z,y){
 box(x,y+.2,z,2.4,.4,2.4,stone,true);box(x,y+.95,z,1.4,1.1,1.4,carvedStone,true);
 add(new THREE.CylinderGeometry(.45,.45,.7,20),bronze,x,y+1.85,z);
 for(const [a,b] of [[-1,-1],[1,-1],[-1,1],[1,1]])box(x+a*.95,y+1.9,z+b*.95,.18,1.8,.18,carvedStone);
 roof(x,z,2.6,2.6,2.8,1.1,roofGold,true,{style:'pyramid'});
}

export function buildProps(){
// ---------- Ngự đạo, sư tử đồng, vạc nước, đỉnh đồng, vật phẩm nền Thái Hòa ----------
{
 const pathTex=pattern(256,256,c=>{
  c.fillStyle='#a49d8c';c.fillRect(0,0,256,256);
  for(let r=0;r<4;r++)for(let i=-1;i<3;i++){
   const x=i*128+(r%2)*64,y=r*64,v=198+(random()*20|0);
   c.fillStyle='rgb('+v+','+(v-4)+','+(v-15)+')';c.fillRect(x+2,y+2,124,60);
   for(let k=0;k<6;k++){c.fillStyle='rgba(90,80,60,'+(.03+random()*.05).toFixed(3)+')';c.beginPath();c.ellipse(x+random()*128,y+random()*64,3+random()*14,2+random()*5,random()*3,0,6.283);c.fill()}
  }
 });
 pathTex.anisotropy=8;
 const pathMat=weather(new THREE.MeshStandardMaterial({map:pathTex,color:'#ece6d8',roughness:.9}),{scale:.05,amount:.12,fine:.05,fineScale:.7});
 const curbMat=weather(material('#9a9486'),{scale:.2,amount:.08});
 const pathX=z=>z< -130?0:1;
 const ok=z=>Math.abs(z)<468&&!inBuilding(pathX(z),z,1.8)&&!(z>-66&&z<154)&&lineDistance(pathX(z),z,river)>8;
 let start=null;
 for(let z=-468;z<=468.5;z+=.5){
  const good=z<468&&ok(z);
  if(good&&start===null)start=z;
  if(!good&&start!==null){
   const len=z-start;
   if(len>4){
    const cz=start+len/2,cx=pathX(cz);
    slab(cx,cz,6.2,len,pathMat,.052);
    for(const s of [-1,1])slab(cx+s*3.35,cz,.5,len,curbMat,.05);
   }
   start=null;
  }
 }
}
giltMat=new THREE.MeshStandardMaterial({color:'#caa04a',metalness:.75,roughness:.32});
siteBox=id=>bounds(data.sites[id][1]);
{
 const [tx,tz,tw,td]=siteBox('638308745');
 for(const s of [-1,1]){
  lion(tx+s*15.5,tz+td/2+3,1,s>0?1:-1);
  for(const offset of [22,28])ding(tx+s*offset,tz+td/2+2,0);
 }
 const [qx,qz,qw,qd]=siteBox('638807674');
 for(const s of [-1,1]){
  lion(qx+s*11.5,qz+qd/2+3,1,s>0?1:-1,.95);
  if(s<0)vat(qx+s*(qw/2+5),qz+4,0,true);
 }
 const T=terraceHeight;
 for(const s of [-1,1]){
  for(const z of [76,96])vat(1+s*40,z,T,true);
  turtle(1+s*18,111.5,T);crane(1+s*24,111.5,T);
  for(const x of [38,44])ding(1+s*x,111.5,T);
  for(const z of [175,210,245])vat(1+s*58,z,0,false);
 }
 sundial(1+31,111.5,T);jialiang(1-30,111.5,T);
 const [gx,gz,gw,gd]=siteBox('638981317');
 for(const s of [-1,1]){
  const x=gx+s*(gw/2+3.5),z=gz+gd/2-2;
  vat(x,z,pointInPolygon(x,z,INNER_TERRACE_OUTLINE)?INNER_TERRACE_HEIGHT:0,true);
  ding(gx+s*12,gz+gd/2+4,INNER_TERRACE_HEIGHT);
 }
 for(const [name,x,z,span] of data.districtPlaces){
  if(!name.endsWith('Cung'))continue;
  for(const s of [-1,1])vat(x+s*5.5,z+span*.28,0,false);
 }
 places.push({name:'Sư tử đồng Thái Hòa Môn',x:tx,z:tz+td/2+3,y:5,d:20,detail:true,note:'Cặp sư tử đồng trước Thái Hòa Môn: con đực (phía đông) vờn cầu, con cái (phía tây) giữ sư tử con.'});
 places.push({name:'Nền Thái Hòa · Nhật quỹ, Gia lượng',x:1,z:111.5,y:T+3,d:28,detail:true,note:'Trên nền đá: rùa đồng, hạc đồng, đỉnh đồng, nhật quỹ (đồng hồ mặt trời) phía đông và gia lượng phía tây; vạc nước mạ vàng hai bên điện.'});
}
places.push({name:'Thái giám & cung nữ',x:1,z:240,y:4,d:60,detail:true,note:'Khoảng 140 thái giám và cung nữ trang phục triều Thanh đi lại trong cung: thái giám mặc áo dài màu trầm (xanh đậm, xám, đen, nâu, xanh cổ vịt), ống tay hẹp, đội mũ vải hoặc mũ chóp nhỏ, tóc tết đuôi sam; cung nữ phổ thông mặc tiện bào xanh lơ, khoác khảm khiên xanh đậm viền thêu hoa mai; đại cung nữ mặc màu phong phú, viền thêu vàng nhạt, đội Lưỡng bả đầu cài hoa. Ba đoàn có người cầm đèn lồng đi dọc trục chính.'});
flushClumps();
}

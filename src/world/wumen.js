// Ngọ Môn (mặt bằng chữ U) và các cổng thành.
import {hall} from '../builders/hall.js';
import {archHeader,bounds,box,polygon,slab} from '../builders/primitives.js';
import {roof} from '../builders/roof.js';
import {windowMat} from '../builders/ornaments.js';
import {data} from '../data.js';
import * as THREE from 'three';
import {baseStone,darkMasonry,doorPanels,grayTiles,paintedBeam,paved,red,stone,tileBump,wallRed} from '../materials/textures.js';
import {sideX} from './moat.js';
import {weather} from '../materials/weather.js';
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

// Cổng thành trên nền tường đỏ. Cổng chính (không xoay): các lối vòm cuốn đúng bằng khe trong khối tường
// (trước đây khe 9,2 m mà vòm chỉ 4,6 m nên lối vào hở hình chữ nhật). passages: [[x lệch tâm, bề rộng], …].
export function cityGate(x,z,w,d,top,sideways=false,sign="神武門",passages=[[0,5]]){
 const base=9.9,span=sideways?d:w,depth=sideways?w:d;
 if(sideways){
  for(const side of [-1,1]){
   const offset=side*(span/4+2.3);
   box(x,base/2,z+offset,depth,base,span/2-4.6,wallRed,true);
  }
  box(x,7.65,z,w,4.5,d,wallRed);
 }else{
  // Khối tường đặc giữa các lối, rồi phần tường trên đỉnh vòm.
  const cuts=[...passages].sort((a,b)=>a[0]-b[0]);let from=-span/2;
  for(const [px,pw] of [...cuts,[span/2+1e3,0]]){
   const to=Math.min(span/2,px-pw/2);
   if(to-from>.05)box(x+(from+to)/2,base/2,z,to-from,base,depth,wallRed,true);
   from=px+pw/2;
  }
  for(const [px,pw] of cuts){
   const crown=Math.min(base-.6,pw*.5+3.4+pw*.5);
   archHeader(x+px,z,depth,pw,crown-pw/2,crown);
   box(x+px,(crown+.12+base)/2,z,pw,base-crown-.12,depth,wallRed);
  }
 }
 hall(x,z,w*.76,d*.76,base,top,{double:true,bays:5,ornate:true,sign:sideways?"":sign});
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
// Hai dãy hành lang thấp (廊庑) nối điện chính với lầu góc phía bắc, như bản vẽ.
hall(-37.1,469.2,9.6,14,12.36,19.2,{bays:2,ornate:true,style:'hip-gable'});
hall(37.05,469.2,8.1,14,12.36,19.2,{bays:2,ornate:true,style:'hip-gable'});
buildDuanmenCourt();
cityGate(0,-476,105,22,28);
cityGate(sideX-5,eastZ,23,74,23.5,true);
cityGate(-sideX+5,westZ,23,74,23.5,true);
slab(0,-519,24,96,paved,.062);
for(const s of [-1,1])slab(s*413,s>0?eastZ:westZ,82,16,paved,.062);
}

// Ngói xám cho dãy triều phòng (bản vẽ tô mái xám).
let _grayRoof=null;
const grayRoof=()=>_grayRoof||(_grayRoof=weather(new THREE.MeshStandardMaterial({map:grayTiles,bumpMap:tileBump,bumpScale:3,color:'#b4b7b2',roughness:.8,side:THREE.DoubleSide}),{scale:.06,amount:.12,fine:.06,fineScale:.35}));

// Dãy triều phòng (朝房): nhà dài mái ngói xám, tường đỏ, hàng cột và cửa dọc hai mặt dài.
function chaofang(x,z0,z1,w,h){
 const d=z1-z0,zc=(z0+z1)/2,n=Math.max(1,Math.round(d/3.6));
 box(x,.25,zc,w+.8,.5,d+.8,baseStone,true);
 box(x,.5+h/2,zc,w*.8,h,d-.6,wallRed,true);
 for(const s of [-1,1]){
  const fx=x+s*(w*.4+.06);
  for(let i=0;i<=n;i++)box(fx+s*.14,.5+h/2,z0+.3+(d-.6)*i/n,.32,h,.32,red);
  for(let i=0;i<n;i++)box(fx+s*.05,.5+h*.43,z0+.3+(d-.6)*(i+.5)/n,.12,h*.72,(d-.6)/n*.8,i%3===1?doorPanels:windowMat);
  box(fx+s*.1,.5+h-.28,zc,.3,.46,d-.6,paintedBeam);
 }
 roof(x,zc,w+1.3,d+1.3,.5+h,Math.min(3.2,w*.3),grayRoof(),true,{style:'hip-gable'});
}

// Sân trước Ngọ Môn tới Đoan Môn theo bản vẽ: hai dãy triều phòng dài hai bên (vị trí theo OSM),
// Khuyết Tả Môn / Khuyết Hữu Môn mái vàng chen giữa dãy, Đoan Môn trên nền tường đỏ ở đầu nam.
function buildDuanmenCourt(){
 const Z0=566,Z1=821,GATE=[580,609],DZ=845;
 slab(0,(Z0+DZ)/2,150,DZ-Z0+30,paved,.058);
 for(const s of [-1,1]){
  const x=s*59.1;
  chaofang(x,Z0,GATE[0],14.6,4.6);
  chaofang(x,GATE[1],Z1,14.6,4.6);
  hall(x,(GATE[0]+GATE[1])/2,15.6,GATE[1]-GATE[0],.6,13.5,{bays:3,ornate:true,style:'hip-gable',sign:s<0?'闕右門':'闕左門'});
 }
 cityGate(0,DZ,62,24,30,false,'端門',[[-14,3.6],[-7,3.6],[0,5],[7,3.6],[14,3.6]]);
 for(const s of [-1,1]){
  box(s*49.5,4.95,DZ,37,9.9,24,wallRed,true);
  box(s*49.5,10.05,DZ,37.6,.3,24.6,stone);
 }
}

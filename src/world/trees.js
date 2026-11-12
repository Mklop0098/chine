// Cây (bách cổ, tùng, cây tán rộng, hải đường) vẽ bằng instancing; bụi hoa; hòn non bộ.
import * as THREE from 'three';
import {hall} from '../builders/hall.js';
import {add,beamBetween,bounds,box,lineDistance,pointInPolygon,slab} from '../builders/primitives.js';
import {scene} from '../core/scene.js';
import {random,vec} from '../core/utils.js';
import {data} from '../data.js';
import {baseStone,foliageRock,grayCourt,oldBark,poolDeck,water} from '../materials/textures.js';
import {weather} from '../materials/weather.js';
import {eastZ} from './rampart.js';

export let treeCrownGeo,treeCrownAlt,clumpGeos,gardenRockGeo,foliageColors,leafKinds,leafMats,clumps,blossomChance,occupied,treePositions,rockX,rockZ,mound,heightAtHill;

export function smoothNormals(g){
 const p=g.attributes.position,map=new Map(),keys=[];
 g.computeVertexNormals();
 const n=g.attributes.normal;
 for(let i=0;i<p.count;i++){
  const k=p.getX(i).toFixed(4)+','+p.getY(i).toFixed(4)+','+p.getZ(i).toFixed(4);keys.push(k);
  if(!map.has(k))map.set(k,vec());
  map.get(k).add(vec(n.getX(i),n.getY(i),n.getZ(i)));
 }
 for(let i=0;i<p.count;i++){const v=map.get(keys[i]).clone().normalize();n.setXYZ(i,v.x,v.y,v.z)}
 n.needsUpdate=true;return g;
}

export function lumpy(detail,amp,phase,flatBottom=.72){
 const g=new THREE.IcosahedronGeometry(1,detail),p=g.attributes.position;
 for(let i=0;i<p.count;i++){
  const v=vec(p.getX(i),p.getY(i),p.getZ(i)).normalize();
  const k=1+amp*(Math.sin(v.x*3.3+phase)*Math.sin(v.y*2.9+phase*1.7)*Math.sin(v.z*3.6+.7)*1.6+.45*Math.sin(v.x*8.1+v.z*6.7+phase)*Math.cos(v.y*7.3));
  v.multiplyScalar(k);if(v.y<0)v.y*=flatBottom;p.setXYZ(i,v.x,v.y,v.z);
 }
 return smoothNormals(g);
}

export function clump(x,y,z,sx,sy,sz,kind,color=null){
 const gi=Math.floor(random()*3),key=gi+':'+kind;
 if(!clumps.has(key))clumps.set(key,[]);
 clumps.get(key).push([x,y,z,sx,sy,sz,random()*6.28,color]);
}

export function flushClumps(){
 const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),c=new THREE.Color(),up=vec(0,1,0);
 for(const [key,list] of clumps){
  const [gi,kind]=key.split(':');
  const m=new THREE.InstancedMesh(clumpGeos[+gi],leafMats[kind],list.length);
  list.forEach(([x,y,z,sx,sy,sz,r,color],i)=>{
   q.setFromAxisAngle(up,r);m4.compose(vec(x,y,z),q,vec(sx,sy,sz));m.setMatrixAt(i,m4);
   if(color)c.set(color);else{const v=.82+random()*.3;c.setRGB(v,v*(.97+random()*.06),v*(.92+random()*.1))}
   m.setColorAt(i,c);
  });
  m.castShadow=kind!=='flower';m.receiveShadow=true;m.material.envMapIntensity=.2;m.material.userData.envSet=true;
  scene.add(m);
 }
}

export function addTree(x,z,base,h,cypress=false,kind=null){
 kind=kind||(cypress?(random()<.55?'cypress':'pine'):(random()<blossomChance?'blossom':'broad'));
 if(kind==='blossom')h*=.72;
 const r=h*(kind==='cypress'?.06:.05);
 const lean=vec((random()-.5)*h*.2,0,(random()-.5)*h*.2);
 const trunkTop=kind==='pine'?.62:kind==='cypress'?.72:.5;
 let p=vec(x,base,z);
 for(let s=1;s<=3;s++){
  const t=s/3,q=vec(x+lean.x*t+(random()-.5)*h*.05,base+h*trunkTop*t,z+lean.z*t+(random()-.5)*h*.05);
  beamBetween(p,q,r*(1.15-t*.45),oldBark,7);p=q;
 }
 const top=p;
 if(kind==='cypress'){
  const n=10;
  for(let i=0;i<n;i++){
   const f=i/(n-1),a=random()*6.28,sp=h*.1*(1-f*.5),rad=h*(.16-.075*f)*(.8+random()*.4);
   clump(x+lean.x*f+Math.cos(a)*sp,base+h*(.36+f*.56),z+lean.z*f+Math.sin(a)*sp,rad,rad*1.15,rad,'cypress');
  }
 }else if(kind==='pine'){
  for(let i=0;i<6;i++){
   const f=i/5,a=i*2.3+random(),len=h*(.34-.16*f),y=base+h*(.42+f*.46);
   const from=vec(x+lean.x*(.4+f*.5),y-.3,z+lean.z*(.4+f*.5)),to=vec(from.x+Math.cos(a)*len,y+.15,from.z+Math.sin(a)*len);
   beamBetween(from,to,r*.42,oldBark,5);
   clump(to.x,to.y+.2,to.z,len*.55,len*.2,len*.5,'pine');
   clump((from.x+to.x)/2,y+.3,(from.z+to.z)/2,len*.4,len*.16,len*.38,'pine');
  }
  clump(top.x,top.y+h*.1,top.z,h*.17,h*.09,h*.16,'pine');
 }else{
  const n=kind==='blossom'?7:9;
  for(let i=0;i<n;i++){
   const a=i*2.4+random(),f=i/(n-1),sp=h*.22*(1-f*.55),y=base+h*(.56+f*.36);
   if(i<4)beamBetween(vec(top.x,top.y-.3,top.z),vec(top.x+Math.cos(a)*sp*.8,y-.25,top.z+Math.sin(a)*sp*.8),r*.45,oldBark,5);
   const rad=h*(.21-.05*f)*(.85+random()*.3);
   clump(top.x+Math.cos(a)*sp,y,top.z+Math.sin(a)*sp,rad,rad*.75,rad*.9,kind,kind==='blossom'&&random()<.3?'#fff4f2':null);
  }
 }
 treePositions.push([x,z,r]);
}

export function inBuilding(x,z,margin=.3){
 return occupied.some(({p,b:[cx,cz,w,d]})=>Math.abs(cx-x)<w/2+margin&&Math.abs(cz-z)<d/2+margin&&pointInPolygon(x,z,p));
}

export function buildTrees(){
treeCrownGeo=lumpy(2,.16,1.3);
treeCrownAlt=lumpy(2,.2,4.1);
clumpGeos=[treeCrownGeo,treeCrownAlt,lumpy(2,.24,2.7)];
gardenRockGeo=lumpy(2,.22,2.2,1);
foliageColors=['#3f5338','#4a5f3e','#5b7046','#6b7d4c','#3a4b37'].map(c=>weather(new THREE.MeshStandardMaterial({color:c,roughness:.92}),{scale:.75,amount:.26,fine:.12,fineScale:3.2}));
leafKinds={
 cypress:'#33452f',pine:'#3d5639',broad:'#5c7343',blossom:'#efc3cc',shrub:'#55703e',flower:'#ffffff',willow:'#7d9450'
};
leafMats={};
for(const [k,c] of Object.entries(leafKinds))leafMats[k]=weather(new THREE.MeshStandardMaterial({color:c,roughness:.93}),{scale:.8,amount:k==='blossom'?.14:.26,fine:.12,fineScale:3});
clumps=new Map();
blossomChance=0;
occupied=[...data.buildings.map(r=>r[0]),...Object.values(data.sites).map(r=>r[1]),...data.walls].map(p=>({p,b:bounds(p)}));
treePositions=[];
for(const [x,z] of data.mappedTrees){
 if(lineDistance(x,z,data.route)<2.1||inBuilding(x,z))continue;
 addTree(x,z,.04,5.1+random()*5.7,random()>.44);
}
blossomChance=.28;
for(const garden of data.gardens){
 const [cx,cz,w,d]=bounds(garden);
 const attempts=Math.min(115,Math.floor(w*d/86));
 for(let i=0;i<attempts;i++){
  const x=cx+(random()-.5)*w,z=cz+(random()-.5)*d;
  if(!pointInPolygon(x,z,garden)||inBuilding(x,z)||lineDistance(x,z,data.route)<2.9||data.gardenPaths.some(p=>lineDistance(x,z,p)<2.5)||treePositions.some(([tx,tz])=>Math.hypot(tx-x,tz-z)<4.3))continue;
  box(x,.105,z,1.8,.21,1.8,baseStone);
  addTree(x,z,.2,4.7+random()*4.7,random()>.36);
 }
}
blossomChance=0;
// The rockery in the northeast part of the Imperial Garden supports Yujing Pavilion.
rockX=29.9;
rockZ=-419.5;
for(let i=0;i<24;i++){
 const a=random()*6.28,r=random()*4.9,h=1.2+random()*3.7;
 const o=add(gardenRockGeo,foliageRock,rockX+Math.cos(a)*r,h*.66,rockZ+Math.sin(a)*r);
 o.scale.set(1.1+random()*2.2,h,.85+random()*1.6);o.rotation.set(random()*.5,a,random()*.43);
}
mound=add(gardenRockGeo,foliageRock,rockX,3.6,rockZ,{solid:true});
mound.scale.set(5.7,3.6,5.5);
hall(rockX,rockZ,5.4,5.4,7.1,12,{bays:2,ornate:true,style:'pyramid'});
for(const [x,z] of [[-53,-406.4],[54,-406.5]]){
 slab(x,z,9.4,10.2,poolDeck,.043);
 slab(x,z,8.1,8.8,water,.048);
}
heightAtHill=(x,z)=>{
 const zz=(z+693)/55;
 let h=0;
 for(const [center,amplitude] of [[-145,21],[-73,29],[0,43],[78,29],[145,20]])h=Math.max(h,amplitude*Math.exp(-(((x-center)/61)**2)-zz*zz));
 return h<1.5?0:h;
};
for(const [kind,p] of data.landscape){
 if(kind===1)continue;
 const [cx,cz,w,d]=bounds(p);
 if(w*d<16||w*d>7600)continue;
 for(let i=0;i<Math.min(25,Math.floor(w*d/22));i++){
  const x=cx+(random()-.5)*w,z=cz+(random()-.5)*d;
  if(!pointInPolygon(x,z,p)||inBuilding(x,z)||lineDistance(x,z,data.route)<2.2||data.gardenPaths.some(p=>lineDistance(x,z,p)<1.25))continue;
  if(random()<.17&&treePositions.every(([a,b])=>Math.hypot(a-x,b-z)>3.4))addTree(x,z,.05,4+random()*4.5);
  else{
   const size=.38+random()*.62;clump(x,size*.5,z,size,size*.67,size*.82,'shrub');
   if(random()<.35){const col=['#d8485a','#f0c94a','#e98aa8','#f4efe4','#b34fa0'][Math.floor(random()*5)];for(let f=0;f<5;f++){const fs=.12+random()*.12;clump(x+(random()-.5)*1.2,fs*.8+.05,z+(random()-.5)*1.2,fs,fs*.8,fs,'flower',col)}}
  }
 }
}
for(const side of [-1,1]){
 slab(side*451,0,9,1080,grayCourt,.015);
 for(let i=0;i<38;i++){
  const z=-493+i*26.5;
  if(Math.abs(z-eastZ)<18)continue;
  addTree(side*(464+random()*14),z,-.04,3.5+random()*4,random()>.49);
 }
}
slab(0,-566,975,11,grayCourt,.015);
}

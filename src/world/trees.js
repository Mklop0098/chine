// Cây (bách cổ, tùng, cây tán rộng, hải đường, liễu) vẽ bằng instancing chia ô + LOD; bụi hoa; hòn non bộ.
import * as THREE from 'three';
import {add,bounds,box,lineDistance,pointInPolygon,slab} from '../builders/primitives.js';
import {scene} from '../core/scene.js';
import {heightMap,isolated,pattern,random,vec} from '../core/utils.js';
import {data} from '../data.js';
import {baseStone,foliageRock,grayCourt,lawn,oldBark,water} from '../materials/textures.js';
import {weather} from '../materials/weather.js';
import {eastZ} from './rampart.js';
import {defineGroup,flushGroups,pushBeam,pushTRS} from './instancer.js';
import {PAVILION_CENTER,PAVILION_POND,PAVILION_PONDS,EAST_PAVILION_CENTER} from './waterPavilion.js';
import {YANGXIN_GROUNDS,YANGXIN_TREES} from './yangxin.js';
import {CINING_GROUNDS,CINING_TREES,CINING_PLATFORM,CINING_PLATFORM_HEIGHT} from './cining.js';

export let trunkGeos,treeCrownGeo,treeCrownAlt,clumpGeos,gardenRockGeo,foliageColors,leafKinds,leafMats,clumps,blossomChance,occupied,treePositions,heightAtHill;

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

// Mọi loại lá dùng chung một vật liệu trắng; màu từng loại nằm trong màu instance
// => ít nhóm hơn, ít draw call hơn.
const _tint=new THREE.Color(),kindColor={},groupOf={cypress:'crown:0',blossom:'crown:2',pine:'crown:1',broad:'crown:2',willow:'crown:2',shrub:'shrub',flower:'flowerClump'};
export function clump(x,y,z,sx,sy,sz,kind,color=null){
 if(color)_tint.set(color);
 else{const v=.82+random()*.3;_tint.setRGB(v,v*(.97+random()*.06),v*(.92+random()*.1)).multiply(kindColor[kind])}
 pushTRS(groupOf[kind],x,y,z,sx,sy,sz,random()*6.28,_tint);
}

const trunk=(a,b,r)=>pushBeam('trunk',a,b,r);

// Gom toàn bộ instance (cây, bụi, cỏ, hoa) thành các mesh theo ô.
export function flushClumps(){flushGroups()}

function courtyardTreePosition(x,z){
 if(x<=-19.8||x>=20.7||z<=-408.8||z>=-375.8)return [x,z];
 // Dải cỏ sát ba cạnh tường, tránh trục cửa giữa và hai thang bên nền lầu.
 const positions=[];
 for(const sideX of [-18.25,19.15]){
  for(const atZ of [-378.5,-384,-390,-396,-402,-407])positions.push([sideX,atZ]);
 }
 for(const atX of [-13,-7,8,14])positions.push([atX,-377.6]);
 positions.sort((a,b)=>Math.hypot(a[0]-x,a[1]-z)-Math.hypot(b[0]-x,b[1]-z));
 return positions.find(([px,pz])=>treePositions.every(([tx,tz])=>Math.hypot(px-tx,pz-tz)>3))
  ||positions[0];
}

export function addTree(x,z,base,h,cypress=false,kind=null){
 [x,z]=courtyardTreePosition(x,z);
 kind=kind||(cypress?(random()<.55?'cypress':'pine'):(random()<blossomChance?'blossom':'broad'));
 if(kind==='blossom')h*=.72;
 if(kind==='willow')h*=.9;
 const r=h*(kind==='cypress'?.06:.05);
 const lean=vec((random()-.5)*h*.2,0,(random()-.5)*h*.2);
 const trunkTop=kind==='pine'?.62:kind==='cypress'?.72:kind==='willow'?.6:.5;
 let p=vec(x,base,z);
 for(let s=1;s<=3;s++){
  const t=s/3,q=vec(x+lean.x*t+(random()-.5)*h*.05,base+h*trunkTop*t,z+lean.z*t+(random()-.5)*h*.05);
  trunk(p,q,r*(1.15-t*.45));p=q;
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
   trunk(from,to,r*.42);
   clump(to.x,to.y+.2,to.z,len*.55,len*.2,len*.5,'pine');
   clump((from.x+to.x)/2,y+.3,(from.z+to.z)/2,len*.4,len*.16,len*.38,'pine');
  }
  clump(top.x,top.y+h*.1,top.z,h*.17,h*.09,h*.16,'pine');
 }else if(kind==='willow'){
  // Liễu rủ: các chùm lá dài treo quanh tán.
  for(let i=0;i<11;i++){
   const a=i*2.4+random(),sp=h*(.18+random()*.14),y=base+h*(.5+random()*.3);
   if(i<5)trunk(vec(top.x,top.y-.2,top.z),vec(top.x+Math.cos(a)*sp*.75,y+h*.12,top.z+Math.sin(a)*sp*.75),r*.4);
   const rad=h*(.09+random()*.04);
   clump(top.x+Math.cos(a)*sp,y,top.z+Math.sin(a)*sp,rad,rad*2.6,rad,'willow');
  }
  clump(top.x,top.y+h*.12,top.z,h*.2,h*.12,h*.2,'willow');
 }else{
  const n=kind==='blossom'?7:9;
  for(let i=0;i<n;i++){
   const a=i*2.4+random(),f=i/(n-1),sp=h*.22*(1-f*.55),y=base+h*(.56+f*.36);
   if(i<4)trunk(vec(top.x,top.y-.3,top.z),vec(top.x+Math.cos(a)*sp*.8,y-.25,top.z+Math.sin(a)*sp*.8),r*.45);
   const rad=h*(.21-.05*f)*(.85+random()*.3);
   clump(top.x+Math.cos(a)*sp,y,top.z+Math.sin(a)*sp,rad,rad*.75,rad*.9,kind,kind==='blossom'&&random()<.3?'#fff4f2':null);
  }
 }
 treePositions.push([x,z,r]);
}

export function inBuilding(x,z,margin=.3){
 return occupied.some(({p,b:[cx,cz,w,d]})=>Math.abs(cx-x)<w/2+margin&&Math.abs(cz-z)<d/2+margin&&pointInPolygon(x,z,p));
}

// ---------- Tán lá chi tiết ----------
// Texture "nhành lá" (ảnh xám + alpha, màu thật lấy từ màu instance):
// Ô vuông 512 trên cùng là nhành lá; dải 128px phía dưới là màu đặc (trái: sáng vừa cho tán ở xa,
// phải: tối cho lõi tán gần) – đủ rộng để mipmap ở xa không pha lẫn với vùng trong suốt.
const ATLAS_V=.2,cardV=v=>ATLAS_V+(1-ATLAS_V)*v;
function leafAtlas(kind){
 const S=512,C=S/2;
 const g=v=>{const k=Math.max(0,Math.min(255,v|0));return 'rgb('+k+','+Math.min(255,k+4)+','+Math.max(0,k-8)+')'};
 return isolated(kind==='needle'?5770:9110,()=>pattern(S,S*1.25,c=>{
  c.clearRect(0,0,S,S*1.25);
  c.fillStyle='rgb(176,178,170)';c.fillRect(0,S,S/2,S/4);
  c.fillStyle='rgb(118,118,112)';c.fillRect(S/2,S,S/2,S/4);
  c.fillStyle='rgb(150,152,140)';c.beginPath();c.arc(C,C,S*.07,0,6.283);c.fill();
  if(kind==='needle'){
   // Nhành kim/vảy (tùng, trắc bá): cành chính cong tỏa ra, kim mọc hai bên.
   const branches=34;
   for(let b=0;b<branches;b++){
    const a=b/branches*6.283+(random()-.5)*.35,len=S*(.24+random()*.22),bend=(random()-.5)*.5;
    const mx=C+Math.cos(a)*len*.55,my=C+Math.sin(a)*len*.55,ex=C+Math.cos(a+bend)*len,ey=C+Math.sin(a+bend)*len;
    c.strokeStyle='rgb(122,112,92)';c.lineWidth=2;
    c.beginPath();c.moveTo(C,C);c.quadraticCurveTo(mx,my,ex,ey);c.stroke();
    const steps=Math.floor(len/5);
    for(let k=2;k<steps;k++){
     const t=k/steps,u=1-t,x=u*u*C+2*u*t*mx+t*t*ex,y=u*u*C+2*u*t*my+t*t*ey,aa=a+bend*t;
     const nl=S*(.02+.03*(1-t)*random()+.012);
     for(const sd of [-1,1]){
      const na=aa+sd*(.75+random()*.3);
      c.strokeStyle=g(150+t*80+random()*35);c.lineWidth=1.6+random()*1.2;
      c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(na)*nl,y+Math.sin(na)*nl);c.stroke();
     }
    }
   }
  }else{
   // Nhành lá rộng: cuống mảnh tỏa ra, lá hình mũi mác hai nửa sáng tối, gân giữa, mép ngoài sáng hơn.
   const leaves=[];
   for(let i=0;i<170;i++){const r=S*(.06+.4*Math.sqrt(random()));leaves.push([random()*6.283,r,random(),random(),random()])}
   leaves.sort((p,q)=>p[1]-q[1]);
   c.strokeStyle='rgb(78,70,58)';c.lineWidth=1.6;
   for(const [a,r] of leaves)if(r>S*.2){c.beginPath();c.moveTo(C+Math.cos(a)*r*.45,C+Math.sin(a)*r*.45);c.lineTo(C+Math.cos(a)*r,C+Math.sin(a)*r);c.stroke()}
   for(const [a,r,u,v,w] of leaves){
    const L=S*(.052+.04*u),W=L*(.36+.14*v),x=C+Math.cos(a)*r,y=C+Math.sin(a)*r,rot=a+(w-.5)*1.1;
    const lum=135+105*(r/(S*.46))+(v-.5)*45;
    c.save();c.translate(x,y);c.rotate(rot);
    c.fillStyle=g(lum);
    c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(L*.45,-W,L,0);c.quadraticCurveTo(L*.45,W,0,0);c.fill();
    c.fillStyle=g(lum*.82);c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(L*.45,W,L,0);c.quadraticCurveTo(L*.5,W*.25,0,0);c.fill();
    c.strokeStyle=g(lum*1.18);c.lineWidth=1;c.beginPath();c.moveTo(L*.08,0);c.lineTo(L*.9,0);c.stroke();
    c.restore();
   }
  }
 }));
}

// Điểm trên bề mặt khối tán lumpy theo hướng d (cùng công thức với lumpy()).
function lumpPoint(d,amp,phase,flatBottom=.72){
 const k=1+amp*(Math.sin(d.x*3.3+phase)*Math.sin(d.y*2.9+phase*1.7)*Math.sin(d.z*3.6+.7)*1.6+.45*Math.sin(d.x*8.1+d.z*6.7+phase)*Math.cos(d.y*7.3));
 const p=d.clone().multiplyScalar(k);if(p.y<0)p.y*=flatBottom;return p;
}

// Cụm tán = lõi lumpy tối + nhiều phiến lá (2 mặt, pháp tuyến hướng ra ngoài để sáng mềm như khối cầu).
// Màu đỉnh (vertexColors) giả lập bóng che trong tán: dưới và trong tối hơn, trên sáng hơn.
// cards=0: chỉ lõi, dùng mảng sáng vừa trong texture (tán ở xa).
// coreBright: lõi dùng màu sáng vừa (tán trung bình / xa) thay vì màu tối (tán gần, lá phủ kín).
function leafyCrown(detail,amp,phase,cards,size,coreBright=!cards){
 const P=[],N=[],U=[],Cl=[];
 const core=lumpy(detail,amp*.8,phase);
 const cp=core.attributes.position,cn=core.attributes.normal,shrink=cards?.8:1;
 for(let i=0;i<cp.count;i++){
  const y=cp.getY(i),up=THREE.MathUtils.clamp(y*.5+.5,0,1);
  P.push(cp.getX(i)*shrink,y*shrink,cp.getZ(i)*shrink);N.push(cn.getX(i),cn.getY(i),cn.getZ(i));
  if(coreBright){U.push(.25,ATLAS_V/2);const a=.74+.26*up;Cl.push(a,a,a)}
  else{U.push(.75,ATLAS_V/2);const a=.72+.24*up;Cl.push(a,a,a)}
 }
 core.dispose();
 let s=Math.floor(phase*7919)>>>0;const rnd=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};
 const d=vec(),n=vec(),t1=vec(),t2=vec(),sn=vec(),UP=vec(0,1,0),X=vec(1,0,0);
 const uvs=[[.03,cardV(.03)],[.97,cardV(.03)],[.97,cardV(.97)],[.03,cardV(.97)]];
 for(let i=0;i<cards;i++){
  const y=1-2*(i+.5)/cards,rr=Math.sqrt(Math.max(0,1-y*y)),th=i*2.39996+rnd()*.6;
  d.set(Math.cos(th)*rr+(rnd()-.5)*.15,y+(rnd()-.5)*.15,Math.sin(th)*rr+(rnd()-.5)*.15).normalize();
  const c=lumpPoint(d,amp,phase).multiplyScalar(.86+rnd()*.14);
  const sz=size*(.78+rnd()*.5);
  n.set(d.x+(rnd()-.5)*1.3,d.y+(rnd()-.5)*1.3+.25,d.z+(rnd()-.5)*1.3).normalize();
  t1.crossVectors(n,Math.abs(n.y)>.9?X:UP).normalize();
  t2.crossVectors(n,t1);
  const r=rnd()*6.283,cs=Math.cos(r),sr=Math.sin(r);
  const a=t1.clone().multiplyScalar(cs).addScaledVector(t2,sr).multiplyScalar(sz/2);
  const b=t1.clone().multiplyScalar(-sr).addScaledVector(t2,cs).multiplyScalar(sz/2);
  const q=[c.clone().sub(a).sub(b),c.clone().add(a).sub(b),c.clone().add(a).add(b),c.clone().sub(a).add(b)];
  sn.copy(d).lerp(n,.3).normalize();
  const lum=.8+.26*THREE.MathUtils.clamp(d.y*.5+.5,0,1)+(rnd()-.5)*.12;
  for(const order of [[0,1,2,0,2,3],[0,2,1,0,3,2]])for(const k of order){
   P.push(q[k].x,q[k].y,q[k].z);N.push(sn.x,sn.y,sn.z);U.push(...uvs[k]);Cl.push(lum,lum,lum);
  }
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(P,3));
 geo.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
 geo.setAttribute('color',new THREE.Float32BufferAttribute(Cl,3));
 geo.computeBoundingSphere();
 return geo;
}

// Vỏ cây cổ thụ: rãnh dọc ngoằn ngoèo, mảng vỏ bong; cùng hạt giống cho màu và bump nên khớp nhau.
function barkMaps(){
 const W=256,H=512,paint=height=>c=>{
  c.fillStyle=height?'#8a8a8a':'#6b604c';c.fillRect(0,0,W,H);
  for(let i=0;i<46;i++){
   let x=random()*W;const w=3+random()*7;
   c.strokeStyle=height?'#202020':'#2c261e';c.lineWidth=w;c.beginPath();c.moveTo(x,0);
   for(let y=0;y<=H;y+=24){x+=(random()-.5)*10;c.lineTo(x,y)}c.stroke();
  }
  for(let i=0;i<260;i++){
   const x=random()*W,y=random()*H,w=6+random()*16,h=18+random()*40,v=random();
   c.fillStyle=height?'rgba(255,255,255,'+(.08+v*.18)+')':'rgba('+(120+v*50|0)+','+(110+v*40|0)+','+(88+v*30|0)+','+(.18+v*.25)+')';
   c.fillRect(x,y,w,h);
  }
 };
 const map=isolated(3301,()=>pattern(W,H,paint(false)));
 const bump=isolated(3301,()=>heightMap(W,H,paint(true)));
 for(const t of [map,bump])t.repeat.set(2,1.4);
 return {map,bump};
}

export function buildTrees(){
treeCrownGeo=lumpy(2,.16,1.3);
treeCrownAlt=lumpy(2,.2,4.1);
clumpGeos=[treeCrownGeo,treeCrownAlt,lumpy(2,.24,2.7)];
// Ba mức chi tiết cho mỗi dạng tán: lõi + 64 phiến lá / lõi + 20 phiến / lõi trơn.
const crownLods=[[1.3,.16],[4.1,.2],[2.7,.24]].map(([ph,amp])=>[leafyCrown(1,amp,ph,64,.62),leafyCrown(0,amp,ph,20,.95,true),leafyCrown(0,amp*.6,ph,0,0)]);
trunkGeos=[new THREE.CylinderGeometry(1,1,1,12,3,true),new THREE.CylinderGeometry(1,1,1,5,1,true)];
{
 // Thân gần: mặt cắt gồ ghề (gân rễ, sẹo) thay vì trụ tròn đều; vỏ có màu và bump.
 const p=trunkGeos[0].attributes.position;
 for(let i=0;i<p.count;i++){const a=Math.atan2(p.getZ(i),p.getX(i)),k=1+.07*Math.sin(a*5+p.getY(i)*3)+.04*Math.sin(a*11);p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*k)}
 trunkGeos[0].computeVertexNormals();
 const bark=barkMaps();
 oldBark.map=bark.map;oldBark.bumpMap=bark.bump;oldBark.bumpScale=2.2;oldBark.color.set('#d8cdb8');oldBark.roughness=.95;oldBark.needsUpdate=true;
}
gardenRockGeo=lumpy(2,.22,2.2,1);
foliageColors=['#3f5338','#4a5f3e','#5b7046','#6b7d4c','#3a4b37'].map(c=>weather(new THREE.MeshStandardMaterial({color:c,roughness:.92}),{scale:.75,amount:.26,fine:.12,fineScale:3.2}));
leafKinds={
 cypress:'#33452f',pine:'#3d5639',broad:'#5c7343',blossom:'#efc3cc',shrub:'#55703e',flower:'#ffffff',willow:'#7d9450'
};
// Lá rộng và lá kim dùng hai texture nhành lá; cắt alpha để viền tán lởm chởm, bóng đổ lốm đốm.
const makeLeafMat=kind=>{
 const m=weather(new THREE.MeshStandardMaterial({color:'#ffffff',map:leafAtlas(kind),alphaTest:.42,vertexColors:true,roughness:.88}),{scale:.8,amount:.2,fine:.1,fineScale:3});
 m.map.anisotropy=8;m.envMapIntensity=.2;m.userData.envSet=true;return m;
};
const leafMat=makeLeafMat('broad'),needleMat=makeLeafMat('needle');
leafMats={};
for(const [k,c] of Object.entries(leafKinds)){kindColor[k]=new THREE.Color(c);leafMats[k]=k==='cypress'||k==='pine'?needleMat:leafMat}
// Texture xám nhân với màu instance: nâng màu gốc một chút để tổng thể không tối đi.
for(const k in kindColor)if(k!=='flower')kindColor[k].multiplyScalar(k==='cypress'?1.85:k==='pine'?1.55:1.25);
const lv=(geos,far)=>far.map((max,i)=>({geo:geos[i],max}));
for(let i=0;i<3;i++)defineGroup('crown:'+i,{levels:lv(crownLods[i],[110,420,Infinity]),material:i<2?needleMat:leafMat,cell:150,colored:true});
defineGroup('shrub',{levels:lv(crownLods[1],[45,180,Infinity]),material:leafMat,cell:96,colored:true});
defineGroup('flowerClump',{levels:lv(crownLods[2],[35,140]),material:leafMat,cell:96,castShadow:false,hideBeyond:320,colored:true});
defineGroup('trunk',{levels:[{geo:trunkGeos[0],max:150},{geo:trunkGeos[1],max:Infinity}],material:oldBark,cell:150});
clumps=new Map();
blossomChance=0;
occupied=[...data.buildings.map(r=>r[0]),...Object.values(data.sites).map(r=>r[1]),...data.walls,...PAVILION_PONDS,YANGXIN_GROUNDS,CINING_GROUNDS].map(p=>({p,b:bounds(p)}));
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
  let x=cx+(random()-.5)*w,z=cz+(random()-.5)*d;
  if(!pointInPolygon(x,z,garden)||inBuilding(x,z)||lineDistance(x,z,data.route)<2.9||data.gardenPaths.some(p=>lineDistance(x,z,p)<2.5)||treePositions.some(([tx,tz])=>Math.hypot(tx-x,tz-z)<4.3))continue;
  [x,z]=courtyardTreePosition(x,z);
  box(x,.105,z,1.8,.21,1.8,baseStone);
  addTree(x,z,.2,4.7+random()*4.7,random()>.36);
 }
}
blossomChance=0;
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
// Liễu rủ theo bờ hồ bất quy tắc. Thân ở ngoài lan can, tán rủ về mặt nước.
isolated(3818526,()=>{
 for(const [pond,center] of [[PAVILION_POND,PAVILION_CENTER],[PAVILION_PONDS[1],EAST_PAVILION_CENTER]]){
 const [cx,cz]=center;
 for(const i of [20,38,55,73,88,106]){
  const [px,pz]=pond[i],distance=Math.hypot(px-cx,pz-cz);
  const x=px+(px-cx)/distance*2,z=pz+(pz-cz)/distance*2;
  if(x< -66.5||x>67.6||inBuilding(x,z,.7)||data.gardenPaths.some(p=>lineDistance(x,z,p)<1.1))continue;
  addTree(x,z,.04,9+random()*2,false,'willow');
 }
 }
});
// Chuyển cụm cây ở hồ nhỏ cũ vào khoảng trống giữa hai nhà phía bắc.
isolated(20112026,()=>{
 for(const [x,z] of CINING_TREES){
  const y=pointInPolygon(x,z,CINING_PLATFORM)?CINING_PLATFORM_HEIGHT:0;
  box(x,y+.08,z,2.3,.16,2.3,baseStone);
  addTree(x,z,y+.16,6+random()*1.5,false,'broad');
 }
 for(const [x,z] of YANGXIN_TREES){
  box(x,.08,z,2.3,.16,2.3,baseStone);
  addTree(x,z,.16,5.5+random()*2,false,'broad');
 }
});
isolated(417426,()=>{
 addTree(-39.8,-424.5,.04,8.5,false,'broad');
 addTree(-39.6,-420.8,.04,8,false,'broad');
});
// Cây tán rộng che góc nối giữa hai cổng Ngự Hoa Viên và đầu hành lang.
// Thân đặt phía vườn, cách mặt cổng để giữ lối qua cửa thoáng.
isolated(19112026,()=>{
 for(const [x,z] of [[-57.3,-344.2],[58.6,-344.2]]){
  addTree(x,z,.04,11,false,'broad');
 }
});
// Hai khoảng trống giữa đầu nam dãy triều phòng và tường Đoan Môn: mỗi bên một hàng bách cổ trên thảm cỏ.
isolated(4417,()=>{
 for(const side of [-1,1]){
  slab(side*63,827,34,10.5,lawn,.03);
  for(const x of [52,61,70,78])addTree(side*(x+(random()-.5)*1.5),826.5+(random()-.5)*1.5,.03,15+random()*4,true,random()<.7?'cypress':'pine');
 }
});
}

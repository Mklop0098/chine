// Thái giám và cung nữ triều Thanh: trang phục, đi lại tự do, đoàn người theo trục chính (instancing).
import * as THREE from 'three';
import {scene} from '../core/scene.js';
import {data} from '../data.js';
import {walkableFloor} from '../player/collision.js';
import {SKY} from '../weather/uniforms.js';
import {offerCarriedLantern} from '../world/lanterns.js';
import {NPC_LIMIT,planDeployment,routePose} from './deployment.js';

export let npcRand,lathe,npcGeo,nm,npcMats,partDefs,pick,eunuchRobes,eunuchJackets,eunuchHats,maidRobes,maidVests,plumTrim,seniorRobes,seniorVests,goldTrim,flowers,npcSpots,npcs,npcMeshes,_B,_A,_T,_R,_S,_G,npcTime;
let nightPole, nightBody, dayItems;
export let formations;
const lanternCenter=new THREE.Vector3(0,-.62,.68);

export function segGeo(a,b,r){
 const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A);
 const g=new THREE.CylinderGeometry(r,r,d.length(),6);
 g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()));
 return g.translate((A.x+B.x)/2,(A.y+B.y)/2,(A.z+B.z)/2);
}
export function mergeGeos(list){
 const P=[],N=[];
 for(let g of list){if(g.index)g=g.toNonIndexed();P.push(...g.attributes.position.array);N.push(...g.attributes.normal.array)}
 const m=new THREE.BufferGeometry();m.setAttribute('position',new THREE.Float32BufferAttribute(P,3));m.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));return m;
}

export function makeSpec(type){
 const s={type,parts:{},colors:{}};
 const on=(k,c)=>{s.parts[k]=true;if(c)s.colors[k]=c};
 if(type==='guard'){
  on('robe','#3c3544');on('hem','#842e25');on('guardVest');on('guardBelt');
  on('neck');on('head');on('queue');on('hatCone','#342026');on('guardPlume');
  on('arm','#653530');on('cuff');on('hand');on('shoe','#17191d');
 }else if(type==='eunuch'){
  const robe=pick(eunuchRobes);on('robe',robe);on('hem',robe);
  if(npcRand()<.75)on('jacket',pick(eunuchJackets));
  on('neck');on('head');on('queue');
  const hat=pick(eunuchHats);
  if(npcRand()<.55){on('cap',hat);on('capBand');on('knob')}else{on('hatCone',hat);on('tassel')}
  on('arm',robe);on('cuff');on('hand');on('shoe','#18181b');
  const r=npcRand();s.item=r<.3?'whisk':r<.4?'lantern':null;
 }else{
  const senior=type==='senior';
  const robe=pick(senior?seniorRobes:maidRobes),vest=pick(senior?seniorVests:maidVests),trim=pick(senior?goldTrim:plumTrim);
  on('robe',robe);on('hem',trim);on('jacket',vest);on('vestTrim',trim);on('vestEdge',trim);
  on('collar');on('neck');on('head');on('hair');on('board');on('flower',pick(flowers));
  if(senior)on('fringe');
  on('arm',robe);on('cuff');on('hand');on('shoe',vest);on('sole');
  const r=npcRand();s.item=senior?(r<.25?'lantern':null):(r<.25?'tray':r<.37?'lantern':null);
 }
 if(s.item==='whisk'){on('whiskH');on('whiskT')}
 if(s.item==='lantern'){on('lanternPole');on('lanternBody')}
 if(s.item==='tray'){on('tray');on('cups')}
 on('shadow');
 s.scale=type==='guard'?1.08:type==='eunuch'?.97+npcRand()*.08:.92+npcRand()*.06;
 return s;
}

function spawn(type,x,z,h,extra={}){
 const y=walkableFloor(x,z,0)??0;
 const n={spec:makeSpec(type),x,z,y,ry:y,h,phase:npcRand()*6,...extra};
 npcs.push(n);
 return n;
}

function spawnFormation(route,count,offset,speed,role,{eunuchs=0,name}={}){
 if(npcs.length+count>NPC_LIMIT)return;
 const formation={route,progress:offset,speed,count,name};
 formations.push(formation);
 for(let i=0;i<count;i++){
  const gap=i*1.45;
  const [x,z,h]=routePose(route,offset-gap);
  const type=role==='guard'?'guard':role==='sweep'||i<eunuchs?'eunuch':i===eunuchs&&count>=6?'senior':'maid';
  const n=spawn(type,x,z,h,{formation,gap,sweep:role==='sweep'});
  if(n.sweep){
   for(const key of ['whiskH','whiskT','lanternPole','lanternBody'])delete n.spec.parts[key];
   n.spec.item='broom';
   n.spec.parts.broomStick=n.spec.parts.broomHead=true;
  }
 }
}

export function updateNPCs(dt){
 if(!npcs.length)return;
 npcTime+=dt;
 const night=SKY.uNight.value;
 const carryLantern=night>.15;
 nightPole.visible=nightBody.visible=carryLantern;
 nightBody.material.emissiveIntensity=night*2.8;
 for(const mesh of dayItems)mesh.visible=!carryLantern;
 for(const group of formations){
  group.progress=(group.progress+dt*group.speed)%group.route.total;
 }
 let lanternIndex=0;
 for(const n of npcs){
  const moving=!!n.formation;
  if(moving){
   const {route,progress,speed}=n.formation;
   const [x,z,heading]=routePose(route,progress-n.gap);
   const turn=Math.atan2(Math.sin(heading-n.h),Math.cos(heading-n.h));
   n.x=x;n.z=z;n.h+=THREE.MathUtils.clamp(turn,-dt*6,dt*6);
   n.phase+=dt*speed*5.2;
  }
  n.ry+=(n.y-n.ry)*Math.min(1,dt*12);
  const s=n.spec.scale,sw=moving?Math.sin(n.phase):0,bob=moving?Math.abs(Math.cos(n.phase))*.022:0;
  _S.makeScale(s,s,s);
  _B.makeRotationY(n.h).setPosition(n.x,n.ry+bob,n.z).multiply(_S);
  _G.makeTranslation(n.x,n.ry+.025,n.z).multiply(_S);
  const carries=carryLantern&&moving&&!n.sweep;
  const holding=carries||!!n.spec.item;
  const leftArmAngle=-.62+sw*.05;
  if(carries){
   _A.copy(_B).multiply(_T.makeTranslation(-.215,1.42,0)).multiply(_R.makeRotationZ(-.1)).multiply(_R.makeRotationX(leftArmAngle));
   nightPole.setMatrixAt(lanternIndex,_A);
   nightBody.setMatrixAt(lanternIndex++,_A);
   offerCarriedLantern(n.lanternPosition.copy(lanternCenter).applyMatrix4(_A));
  }
  for(const sl of n.slots){
   if(carries&&sl.kind==='item')continue;
   const m=npcMeshes[sl.k].mesh;
   if(sl.kind==='body')m.setMatrixAt(sl.i,_B);
   else if(sl.kind==='ground')m.setMatrixAt(sl.i,_G);
   else if(sl.kind==='arm'||sl.kind==='item'){
    const side=sl.kind==='item'?-1:sl.side;
    let ang=side<0&&holding?leftArmAngle:sw*.38*side,rz=side*.1;
    if(n.sweep&&side<0){const sw2=Math.sin(npcTime*2.6+n.x);ang=-.25+sw2*.12;rz=-.1+sw2*.42}
    _A.copy(_B).multiply(_T.makeTranslation(side*.215,1.42,0)).multiply(_R.makeRotationZ(rz)).multiply(_R.makeRotationX(ang));
    m.setMatrixAt(sl.i,_A);
   }else if(sl.kind==='foot'){
    const f=sw*sl.side,lift=n.moving?Math.max(0,Math.cos(n.phase)*sl.side)*.045:0;
    _A.copy(_B).multiply(_T.makeTranslation(sl.side*.085,lift+(sl.k==='shoe'&&n.spec.parts.sole?.06:0),f*.17));
    m.setMatrixAt(sl.i,_A);
   }
  }
 }
 nightPole.count=nightBody.count=lanternIndex;
 if(carryLantern)nightPole.instanceMatrix.needsUpdate=nightBody.instanceMatrix.needsUpdate=true;
 for(const {mesh} of Object.values(npcMeshes))mesh.instanceMatrix.needsUpdate=true;
}

export function buildNpcs(){
// ---------- Thái giám & cung nữ triều Thanh (NPC) ----------
npcRand=(()=>{let s=20261111;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296}})();
lathe=(pts,seg=18)=>new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),seg);
npcGeo={
 robe:lathe([[0,.05],[.3,.05],[.285,.3],[.24,.68],[.195,.97],[.2,1.18],[.215,1.35],[.17,1.45],[.07,1.5],[0,1.5]]).scale(1,1,.8),
 jacket:lathe([[0,.72],[.262,.72],[.248,.98],[.228,1.2],[.24,1.37],[.19,1.47],[.08,1.52],[0,1.52]]).scale(1,1,.83),
 hem:lathe([[.305,.05],[.31,.13],[.29,.13],[.285,.05]],18).scale(1,1,.8),
 collar:new THREE.TorusGeometry(.07,.022,6,14).rotateX(Math.PI/2).translate(0,1.505,.0),
 neck:new THREE.CylinderGeometry(.045,.05,.1,8).translate(0,1.55,0),
 head:new THREE.SphereGeometry(.105,14,10).scale(.95,1.08,1).translate(0,1.63,.01),
 cap:new THREE.SphereGeometry(.118,14,7,0,Math.PI*2,0,Math.PI/2).scale(1,.85,1).translate(0,1.65,0),
 capBand:new THREE.CylinderGeometry(.12,.12,.035,14).translate(0,1.66,0),
 knob:new THREE.SphereGeometry(.03,8,6).translate(0,1.76,0),
 hatCone:mergeGeos([new THREE.ConeGeometry(.16,.12,16).translate(0,1.74,0),new THREE.CylinderGeometry(.165,.165,.025,16).translate(0,1.68,0)]),
 tassel:new THREE.SphereGeometry(.022,8,6).translate(0,1.81,0),
 vestTrim:lathe([[.27,.72],[.272,.8],[.262,.8],[.26,.72]],20).scale(1,1,.83),
 vestEdge:new THREE.BoxGeometry(.035,.74,.02).translate(.06,1.12,.2),
 queue:new THREE.CylinderGeometry(.024,.01,.62,6).translate(0,-.31,0).rotateX(.1).translate(0,1.62,-.1),
 hair:new THREE.SphereGeometry(.115,14,10).scale(1,1,1.06).translate(0,1.65,-.014),
 board:mergeGeos([new THREE.BoxGeometry(.4,.14,.045).translate(0,1.8,-.045),new THREE.CylinderGeometry(.05,.065,.1,8).translate(0,1.72,-.04)]),
 flower:mergeGeos([new THREE.SphereGeometry(.04,8,6).translate(.11,1.81,.0),new THREE.SphereGeometry(.034,8,6).translate(-.13,1.8,0),new THREE.SphereGeometry(.03,8,6).translate(.02,1.86,-.01)]),
 fringe:new THREE.CylinderGeometry(.012,.006,.2,5).translate(.19,1.66,-.03),
 arm:new THREE.CylinderGeometry(.055,.064,.56,8).translate(0,-.28,0),
 cuff:new THREE.CylinderGeometry(.067,.067,.05,8).translate(0,-.565,0),
 hand:new THREE.SphereGeometry(.043,8,6).translate(0,-.625,.01),
 shoe:new THREE.BoxGeometry(.1,.075,.25).translate(0,.04,.03),
 sole:new THREE.BoxGeometry(.065,.08,.075).translate(0,.0,.04),
 whiskH:new THREE.CylinderGeometry(.016,.016,.34,6).translate(0,-.47,.03),
 whiskT:new THREE.CylinderGeometry(.045,.012,.42,8).translate(0,-.5,-.08),
 lanternPole:new THREE.CylinderGeometry(.012,.012,.75,6).rotateX(1.25).translate(0,-.5,.33),
 lanternBody:mergeGeos([new THREE.SphereGeometry(.13,14,10).scale(1,1.2,1).translate(0,-.62,.68),new THREE.CylinderGeometry(.08,.08,.04,10).translate(0,-.47,.68),new THREE.CylinderGeometry(.08,.08,.04,10).translate(0,-.78,.68)]),
 tray:new THREE.BoxGeometry(.38,.03,.25).translate(0,0,.12).rotateX(.62).translate(0,-.6,0),
 cups:mergeGeos([new THREE.CylinderGeometry(.04,.03,.05,10).translate(-.08,.04,.12),new THREE.CylinderGeometry(.04,.03,.05,10).translate(.08,.04,.12),new THREE.SphereGeometry(.06,10,8).translate(0,.05,.17)]).rotateX(.62).translate(0,-.6,0),
 broomStick:segGeo([0,-.6,0],[0,-1.62,.86],.016),
 broomHead:new THREE.BoxGeometry(.42,.07,.16).rotateX(-.35).translate(0,-1.66,.92),
 guardVest:lathe([[.28,.68],[.28,.96],[.25,1.24],[.25,1.38],[.19,1.49],[.08,1.51]],16).scale(1,1,.86),
 guardBelt:new THREE.CylinderGeometry(.255,.265,.085,14).scale(1,1,.9).translate(0,1.01,0),
 guardPlume:new THREE.CylinderGeometry(.034,.052,.20,10).translate(0,1.83,0),
 shadow:new THREE.CircleGeometry(.42,18).rotateX(-Math.PI/2)
};
nm=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.8,...o});
npcMats={
 cloth:nm('#ffffff'),skin:nm('#e2bb98',{roughness:.7}),black:nm('#16161a',{roughness:.55}),red:nm('#b0261d',{roughness:.6}),
 white:nm('#eee7d8'),wood:nm('#5a3b22'),straw:nm('#d9c99b',{roughness:.9}),
 lantern:nm('#c42e1f',{emissive:'#5c1209',roughness:.5}),
 shadow:new THREE.MeshBasicMaterial({color:'#000',transparent:true,opacity:.26,depthWrite:false})
};
for(const m of Object.values(npcMats))m.envMapIntensity=.4;
partDefs={
 robe:['cloth','body'],jacket:['cloth','body'],hem:['cloth','body'],collar:['white','body'],neck:['skin','body'],head:['skin','body'],
 cap:['cloth','body'],capBand:['black','body'],knob:['red','body'],hatCone:['cloth','body'],tassel:['red','body'],queue:['black','body'],
 hair:['black','body'],vestTrim:['cloth','body'],vestEdge:['cloth','body'],board:['black','body'],flower:['cloth','body'],fringe:['red','body'],
 arm:['cloth','arm'],cuff:['white','arm'],hand:['skin','arm'],shoe:['cloth','foot'],sole:['white','foot'],
 broomStick:['wood','item'],broomHead:['straw','item'],whiskH:['wood','item'],whiskT:['white','item'],lanternPole:['wood','item'],lanternBody:['lantern','item'],tray:['red','item'],cups:['white','item'],
 guardVest:['black','body'],guardBelt:['wood','body'],guardPlume:['red','body'],
 shadow:['shadow','ground']
};
pick=a=>a[Math.floor(npcRand()*a.length)];
// Thái giám: màu trầm (xanh đậm, xám, đen, nâu, xanh cổ vịt), không dùng màu vàng
eunuchRobes=['#26344d','#2d3a4f','#4a4e54','#5a5d61','#1c1d21','#4a3a2c','#5b4634','#22504f','#2e5e5c'];
eunuchJackets=['#141418','#1d2029','#26221f','#2a2d33'];
eunuchHats=['#141417','#1c1d22','#2a2622'];
// Cung nữ phổ thông: tiện bào xanh lơ, khảm khiên xanh đậm viền thêu hoa mai
maidRobes=['#8fc4d6','#9acbd8','#86bccf','#a1cfdb'];
maidVests=['#22385a','#1f3354','#283f63'];
plumTrim=['#f1d3dc','#ecc0cd','#f6e6ea'];
// Đại cung nữ: màu phong phú, thêu tinh tế hơn
seniorRobes=['#c9a9d6','#e3b1c0','#a6cdb4','#d8c3a0','#b7c6e4','#e7c6b0'];
seniorVests=['#5a2f4e','#30476b','#2f5a49','#6b3a33','#3f3a6b'];
goldTrim=['#e8c983','#f0dca6','#e2b8c8'];
flowers=['#e45d79','#f2c6d2','#d9364a','#f6efe6','#c76bd1'];
// Điểm đi lại hợp lệ trên mặt sân
npcSpots=[];
for(let i=0;i<14000&&npcSpots.length<4200;i++){
 const x=(npcRand()-.5)*730,z=-470+npcRand()*1075;
 const y=walkableFloor(x,z,0);
 if(y!==null&&y<.5)npcSpots.push([x,z]);
}
npcs=[];
formations=[];
const {groups,patrols,posts,courtRoutes}=planDeployment(data);
for(let i=0;i<20;i++){
 const route=courtRoutes[i%courtRoutes.length];
 spawnFormation(route,1,(i*7.1+route.total*.45)%route.total,.34,'sweep');
}
for(const group of groups)spawnFormation(group.route,group.count,group.offset,.95,'staff',group);
for(const patrol of patrols)spawnFormation(patrol.route,patrol.count,patrol.offset,1.17,'guard',patrol);
for(const {x,z,heading} of posts){
 if(npcs.length>=NPC_LIMIT)break;
 spawn('guard',x,z,heading);
}
// Tạo instanced mesh cho từng bộ phận
npcMeshes={};
{
 const counts={};
 for(const n of npcs)for(const k in n.spec.parts){const per=['arm','foot'].includes(partDefs[k][1])?2:1;counts[k]=(counts[k]||0)+per}
 const col=new THREE.Color();
 for(const [k,c] of Object.entries(counts)){
  const [mat]=partDefs[k];
  const m=new THREE.InstancedMesh(npcGeo[k],npcMats[mat],c);
  m.frustumCulled=false;m.castShadow=false;m.receiveShadow=k!=='shadow';
  if(k==='shadow')m.renderOrder=2;
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(m);npcMeshes[k]={mesh:m,next:0};
 }
 for(const n of npcs){
  n.slots=[];
  n.lanternPosition=new THREE.Vector3();
  for(const k in n.spec.parts){
   const kind=partDefs[k][1],per=['arm','foot'].includes(kind)?2:1;
   for(let s=0;s<per;s++){
    const slot={k,kind,side:per===2?(s?-1:1):0,i:npcMeshes[k].next++};
    if(npcMeshes[k].mesh.instanceColor||n.spec.colors[k]||k==='robe'){col.set(n.spec.colors[k]||'#ffffff');npcMeshes[k].mesh.setColorAt(slot.i,col)}
    n.slots.push(slot);
   }
  }
 }
 for(const {mesh} of Object.values(npcMeshes))if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
 dayItems=Object.entries(npcMeshes).filter(([k])=>partDefs[k][1]==='item'&&!k.startsWith('broom')).map(([,entry])=>entry.mesh);
 nightPole=new THREE.InstancedMesh(npcGeo.lanternPole,npcMats.wood,npcs.length);
 nightBody=new THREE.InstancedMesh(npcGeo.lanternBody,new THREE.MeshStandardMaterial({color:'#b93620',emissive:'#ffac58',roughness:.65}),npcs.length);
 for(const mesh of [nightPole,nightBody]){
  mesh.visible=false;
  mesh.frustumCulled=false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);
 }
}
_B=new THREE.Matrix4();
_A=new THREE.Matrix4();
_T=new THREE.Matrix4();
_R=new THREE.Matrix4();
_S=new THREE.Matrix4();
_G=new THREE.Matrix4();
npcTime=0;
}

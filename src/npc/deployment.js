import {walkableFloor} from '../player/collision.js';

export const NPC_LIMIT = 400;
const CENTRAL_COURTS = [
 [0,245],[0,205],[-48,172],[48,171],[-72,72],[74,61],
 [-76,-68],[70,-81],[-26,-175],[24,-174],[-33,-243],[30,-241],
 [-26,-306],[30,-303],[-44,257],[46,257],[-68,211],[68,211],
];
const PATROL_AREAS = [[0,375],[72,176],[68,-108],[22,-357],[-151,-263],[153,-265],[-207,224],[199,204],[-245,-110],[286,-157]];
// Court index, total staff, eunuchs and route name.
const STAFF_GROUPS = [
 [0,10,2,'Đội chuẩn bị nghi lễ · sân Thái Hòa'],
 [2,2,1,'Chuyển trà · hành lang tây Thái Hòa'],
 [4,6,1,'Bàn giao đồ dùng · phía tây Thái Hòa'],
 [6,2,1,'Chuyển sổ · phía tây Bảo Hòa'],
 [8,10,2,'Đội trực Nội đình · sân Càn Thanh'],
 [10,6,1,'Giao vải · phía tây Hậu Tam Cung'],
 [12,2,1,'Trực hiên · phía tây Khôn Ninh'],
 [14,2,1,'Chuyển vật dụng · sân phía trong Thái Hòa Môn'],
];
const PATROL_NAMES=['Ngọ Môn – sân phía trong','Đông Thái Hòa','Đông Nội đình','Ngự Hoa Viên','Tây lục cung','Đông lục cung','Vũ Anh','Văn Hoa','Từ Ninh','Ninh Thọ'];
const OUTER_GATES = ['638156366','638741722','40343947'];

function inside(x,z) {
 return Math.abs(x)<369&&z>-478&&z<452;
}

function openGround(x,z) {
 if(!inside(x,z))return false;
 const floor=walkableFloor(x,z,0);
 return floor!==null&&floor<=.25;
}

function makeLoop(x,z,length,across,bend) {
 const width=1.6;
 const shape=bend
  ?[[-width,-length],[width,-length],[width,0],[width+bend,0],[width+bend,length],[-width,length]]
  :[[-width,-length],[width,-length],[width,length],[-width,length]];
 const points=shape.map(([u,v])=>across?[x+v,z+u]:[x+u,z+v]);
 if(!points.every(([x,z])=>openGround(x,z)))return null;
 const edges=[];
 let total=0;
 for(let i=0;i<points.length;i++){
  const [x,z]=points[i],[endX,endZ]=points[(i+1)%points.length];
  const dx=endX-x,dz=endZ-z,len=Math.hypot(dx,dz),steps=Math.ceil(len/.55);
  for(let j=1;j<steps;j++){
   if(!openGround(x+dx*j/steps,z+dz*j/steps))return null;
  }
  edges.push({x,z,dx,dz,len,start:total});
  total+=len;
 }
 return {edges,total};
}

function findLoop(x,z,lengths,maxShift=20,bends=[0]) {
 for(let shift=0;shift<=maxShift;shift+=4){
  const centers=shift===0?[[x,z]]:[[x+shift,z],[x-shift,z],[x,z+shift],[x,z-shift]];
  for(const [cx,cz] of centers)for(const length of lengths)for(const across of [false,true])for(const bend of bends){
   const loop=makeLoop(cx,cz,length,across,bend);
   if(loop)return loop;
  }
 }
 return null;
}

export function routePose(route,offset) {
 const progress=((offset%route.total)+route.total)%route.total;
 const edge=route.edges.find(edge=>progress<edge.start+edge.len);
 const t=(progress-edge.start)/edge.len;
 return [edge.x+edge.dx*t,edge.z+edge.dz*t,Math.atan2(edge.dx,edge.dz)];
}

function gatePosts(outline,frontX=0,frontZ=1) {
 const projections=outline.map(([x,z])=>[x*frontX+z*frontZ,x*frontZ-z*frontX]);
 const front=Math.max(...projections.map(([depth])=>depth));
 const across=projections.map(([,width])=>width);
 const left=Math.min(...across),right=Math.max(...across);
 const center=(left+right)/2,spread=Math.max(1.1,Math.min(4,(right-left)*.31));
 const heading=Math.atan2(frontX,frontZ);
 const posts=[];
 for(const sign of [-1,1]){
  for(const setback of [1.2,2.4,4.5,7,10,15,22,32,44,56]){
   const depth=front+setback,width=center+sign*spread;
   const x=depth*frontX+width*frontZ,z=depth*frontZ-width*frontX;
   if(openGround(x,z)){posts.push({x,z,heading});break}
  }
 }
 return posts;
}

export function planDeployment(data) {
 const courts=CENTRAL_COURTS.map(([x,z])=>findLoop(x,z,[13,8,5]));
 const courtRoutes=courts.filter(Boolean);
 if(!courtRoutes.length)throw new Error('Không tìm được lối đi cho NPC trong các sân trung tâm.');
 const groups=STAFF_GROUPS.map(([court,count,eunuchs,name],i)=>{
  const [x,z]=CENTRAL_COURTS[court];
  const route=findLoop(x,z,[18,13,8],12,[5,0])??courts[court]??courtRoutes[i%courtRoutes.length];
  return {route,count,eunuchs,name,offset:i*5.3};
 });
 const patrols=PATROL_AREAS.flatMap(([x,z],i)=>{
  const route=findLoop(x,z,[32,25,17,10],28,[7,0]);
  return route?[{route,count:4,name:'Tuần tra · '+PATROL_NAMES[i],offset:i*6.7}]:[];
 });
 const posts=[];
 const buildings=new Map(data.buildings.map(([outline,,,id])=>[id,outline]));
 const protectedOutlines=[
  ...Object.entries(data.sites).filter(([id])=>!OUTER_GATES.includes(id)).map(([,site])=>site[1]),
  ...data.districtPlaces.map(([, , , , id])=>buildings.get(id)).filter(Boolean),
  ...data.gatewayBuildings.map(([outline])=>outline),
  ...data.buildings.filter(([, ,gate])=>gate).map(([outline])=>outline),
 ];
 const addPosts=candidates=>{
  for(const post of candidates){
   if(!posts.some(p=>Math.hypot(p.x-post.x,p.z-post.z)<1.5))posts.push(post);
  }
 };
 for(const outline of protectedOutlines)addPosts(gatePosts(outline));
 // These three entrances are on the perimeter, so posts face outward from the inner approach.
 addPosts(gatePosts(data.sites['638156366'][1],0,-1).map(p=>({...p,heading:0})));
 addPosts(gatePosts(data.sites['638741722'][1]).map(p=>({...p,heading:Math.PI})));
 addPosts(gatePosts(data.sites['40343947'][1],-1,0).map(p=>({...p,heading:Math.PI/2})));
 return {groups,patrols,posts,courtRoutes};
}

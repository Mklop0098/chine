import * as THREE from 'three';
import {add,beamBetween,box,polygon,surfaceRect,walkSurfaces} from '../builders/primitives.js';
import {hall,terraceRails} from '../builders/hall.js';
import {roof} from '../builders/roof.js';
import {grandStair} from '../builders/stairs.js';
import {baseStone,gold,grayCourt,paintedBeam,roofGold,staticMeshes,wallRed} from '../materials/textures.js';
import {eaveMat,soffitMat,windowMat} from '../builders/ornaments.js';
import {buildLWall} from './walls.js';
import {buildQianqingmen} from './landmarks.js';

export const YANGXIN_GROUNDS=[[-147.5,-208],[-68.25,-208],[-68.25,-116],[-147.5,-116]];
export const YANGXIN_TREES=[[-132,-170],[-125,-168],[-91,-168],[-83,-171],[-117,-154],[-110,-153],[-103,-154],[-96,-153],[-133,-196]];

function gallery(x0,z0,x1,z1,alongZ=false){
 const x=(x0+x1)/2,z=(z0+z1)/2,w=x1-x0,d=z1-z0,base=.38,h=4.5;
 box(x,base/2,z,w,base,d,baseStone,true);
 // Chỉ thu chiều ngang thân nhà; giữ đủ chiều dài để các ô cửa cuối
 // vẫn nằm trên tường, kể cả ở những dãy hành lang dài.
 box(x,base+h/2,z,alongZ?w*.88:w,h,alongZ?d:d*.88,wallRed,true);
 const length=alongZ?d:w,count=Math.max(2,Math.round(length/3.5));
 for(const side of [-1,1]){
  for(let i=0;i<count;i++){
   const at=-length/2+(i+.5)*length/count;
   if(alongZ)box(x+side*w*.445,base+2.3,z+at,.12,2.4,length/count*.7,windowMat);
   else box(x+at,base+2.3,z+side*d*.445,length/count*.7,2.4,.12,windowMat);
  }
  if(alongZ)box(x+side*w*.45,base+h-.2,z,.24,.4,d,paintedBeam);
  else box(x,base+h-.2,z+side*d*.45,w,.4,.24,paintedBeam);
 }
 roof(x,z,(alongZ?d:w)+.9,(alongZ?w:d)+.6,base+h,2,roofGold,true,{
  style:'gable-hard',dx:alongZ?0:1,dz:alongZ?1:0,keepAxis:true,
 });
}

function gate(x,z,width){
 buildQianqingmen(x,z,width,3.5,0,5.7,{
  singleDoor:true,singleDoorWidth:.55,columnBays:1,sign:'',
 });
}

export function westGate(x,z,width){
 const meshStart=staticMeshes.length,surfaceStart=walkSurfaces.length;
 gate(0,0,width);
 const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),Math.PI/2);
 const transform=([px,pz])=>[x+pz,z-px];
 for(const mesh of staticMeshes.slice(meshStart)){
  mesh.position.applyQuaternion(rotation).add(new THREE.Vector3(x,0,z));
  mesh.quaternion.premultiply(rotation);
  if(mesh.userData.outline)mesh.userData.outline=mesh.userData.outline.map(transform);
 }
 for(const surface of walkSurfaces.slice(surfaceStart)){
  [surface.x,surface.z]=transform([surface.x,surface.z]);
  [surface.w,surface.d]=[surface.d,surface.w];
  if(surface.poly)surface.poly=surface.poly.map(transform);
 }
}

// Một thân nhà chữ U, mái chạy liên tục theo đường nóc gấp góc.
// Các mặt dốc dùng chung đường phân thủy 45 độ ở góc, không ghép mái nhà rời.
export function uGallery(points){
 const base=.38,eave=4.88,rise=2,half=3.3;
 const height=t=>eave+rise*(.24*t+.76*t**1.55);
 const direction=(a,b)=>{const l=Math.hypot(b[0]-a[0],b[1]-a[1]);return [(b[0]-a[0])/l,(b[1]-a[1])/l]};
 const offset=distance=>points.map(([x,z],i)=>{
  const a=direction(points[Math.max(0,i-1)],points[i===0?1:i]);
  const b=i===points.length-1?a:direction(points[i],points[i+1]);
  // Ở đầu cuối chỉ dùng pháp tuyến của đoạn kề.
  const after=i===points.length-1?a:b;
  const nx=-a[1]-after[1],nz=a[0]+after[0],scale=distance/(nx*-a[1]+nz*a[0]);
  return [x+nx*scale,z+nz*scale];
 });
 const outline=distance=>[...offset(distance),...offset(-distance).reverse()];
 polygon(outline(3),0,base,baseStone,true);
 const body=outline(2.7);
 polygon(body,base,eave-base,wallRed,true);
 // Mái đua thêm 45 cm qua hai tường hồi; thân nhà giữ nguyên chiều dài.
 const bodyPath=points;
 points=bodyPath.map(([x,z],i)=>{
  if(i!==0&&i!==bodyPath.length-1)return [x,z];
  const neighbor=bodyPath[i===0?1:i-1],out=direction(neighbor,[x,z]);
  return [x+out[0]*.45,z+out[1]*.45];
 });
 const positions=[],uvs=[];
 function face(vertices,coords){
  const order=[0,1,2,0,2,3];
  const a=new THREE.Vector3(...vertices[0]),b=new THREE.Vector3(...vertices[1]),c=new THREE.Vector3(...vertices[2]);
  if(b.sub(a).cross(c.sub(a)).y<0)order.splice(0,6,0,2,1,0,3,2);
  for(const i of order){positions.push(...vertices[i]);uvs.push(...coords[i])}
 }
 for(const side of [-1,1]){
  let along=0;
  for(let i=0;i<points.length-1;i++){
   const length=Math.hypot(points[i+1][0]-points[i][0],points[i+1][1]-points[i][1]);
   for(let j=0;j<16;j++){
    const t=j/16,next=(j+1)/16,outer=offset(side*half*(1-t)),inner=offset(side*half*(1-next));
    face([[outer[i][0],height(t),outer[i][1]],
     [outer[i+1][0],height(t),outer[i+1][1]],
     [inner[i+1][0],height(next),inner[i+1][1]],
     [inner[i][0],height(next),inner[i][1]]],
     [[along*.49,t*Math.hypot(half,rise)*.54],[(along+length)*.49,t*Math.hypot(half,rise)*.54],[(along+length)*.49,next*Math.hypot(half,rise)*.54],[along*.49,next*Math.hypot(half,rise)*.54]]);
   }
   along+=length;
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.computeVertexNormals();add(geometry,roofGold);
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1];
  beamBetween(new THREE.Vector3(a[0],eave+rise,a[1]),new THREE.Vector3(b[0],eave+rise,b[1]),.20,gold,9);
 }
 // Diềm ngói ống và mặt dưới mái dùng cùng vật liệu với builders/roof.js.
 for(const side of [-1,1]){
  const edge=offset(side*half),under=offset(side*(half-.85));
  for(let i=0;i<points.length-1;i++){
   const a=edge[i],b=edge[i+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
   const strip=new THREE.BufferGeometry();
   strip.setAttribute('position',new THREE.Float32BufferAttribute([a[0],eave+.03,a[1],a[0],eave-.38,a[1],b[0],eave+.03,b[1],b[0],eave-.38,b[1]],3));
   strip.setAttribute('uv',new THREE.Float32BufferAttribute([0,1,0,0,length/.34,1,length/.34,0],2));
   strip.setIndex([0,1,2,1,3,2]);strip.computeVertexNormals();add(strip,eaveMat,0,0,0,{shadow:false});
   const insideA=under[i],insideB=under[i+1],y=height(.85/half)-.15;
   const soffit=new THREE.BufferGeometry();
   soffit.setAttribute('position',new THREE.Float32BufferAttribute([a[0],eave-.15,a[1],b[0],eave-.15,b[1],insideB[0],y,insideB[1],insideA[0],y,insideA[1]],3));
   soffit.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,length/.68,0,length/.68,1,0,1],2));
   soffit.setIndex([0,1,2,0,2,3]);soffit.computeVertexNormals();add(soffit,soffitMat,0,0,0,{shadow:false});
   beamBetween(new THREE.Vector3(a[0],eave,a[1]),new THREE.Vector3(b[0],eave,b[1]),.112,gold,7);
  }
 }
 // Diềm và các ô cửa cùng chạy quanh một đường bao thân nhà duy nhất.
 for(let i=0;i<body.length;i++){
  const [x,z]=body[i],[xx,zz]=body[(i+1)%body.length],dx=xx-x,dz=zz-z,length=Math.hypot(dx,dz),yaw=-Math.atan2(dz,dx);
  const trim=box((x+xx)/2,eave-.18,(z+zz)/2,length,.36,.16,paintedBeam);trim.rotation.y=yaw;
  const count=Math.floor((length-1)/3.4);
  for(let j=0;j<count;j++){
   const t=(j+.5)/count,window=box(x+dx*t,base+2.3,z+dz*t,Math.min(2.3,length/count-1),2.4,.14,windowMat);
   window.rotation.y=yaw;
  }
 }
 // Mặt hồi bám đúng đường cong mái, giống mái hồi trong builders/roof.js.
 // Một mặt có pháp tuyến hướng ra ngoài; không nhân đôi tam giác ngược chiều
 // vì hai pháp tuyến sẽ triệt tiêu và làm mặt hồi bị đen.
 for(const i of [0,points.length-1]){
  const p=points[i],neighbor=points[i===0?1:i-1],out=direction(neighbor,p);
  const pos=[],uv=[];
  for(const side of [-1,1])for(let j=0;j<16;j++){
   const t=j/16,next=(j+1)/16,a=offset(side*half*(1-t))[i],b=offset(side*half*(1-next))[i];
   const start=new THREE.Vector3(a[0],height(t),a[1]),end=new THREE.Vector3(b[0],height(next),b[1]),center=new THREE.Vector3(p[0],eave,p[1]);
   const normal=start.clone().sub(center).cross(end.clone().sub(center));
   const triangle=normal.x*out[0]+normal.z*out[1]>0?[center,start,end]:[center,end,start];
   for(const v of triangle){pos.push(v.x,v.y,v.z);uv.push(Math.hypot(v.x-p[0],v.z-p[1])*.45,(v.y-eave)*.47)}
   beamBetween(start,end,.13,gold,7);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.computeVertexNormals();add(g,baseStone);
 }
}

export function buildYangxin(){
 polygon(YANGXIN_GROUNDS,0,.025,grayCourt);
 // Phía đông dùng chung tuyến tường đã dựng dọc Hậu tam cung.
 buildLWall([[-147.5,-116],[-147.5,-130.2]]);
 buildLWall([[-147.5,-137.8],[-147.5,-208],[-68.25,-208]]);
 westGate(-147.5,-134,7.6);
 buildLWall([[-147.5,-116],[-68.25,-116]]);
 buildLWall([[-147.5,-162],[-111.5,-162]]);
 buildLWall([[-104.5,-162],[-68.25,-162]]);
 gate(-108,-162,7);

 // Hai cánh và dãy sau điện chính dùng chung thân nhà, nóc và mái chữ U.
 // Bỏ nhà nhỏ và cổng cũ ở giữa để dãy ngang nối liền hoàn toàn.
 uGallery([[-140,-165],[-140,-201.5],[-76,-201.5],[-76,-165]]);

 const x=-108,z=-187.5,y=2.2,w=40,d=22;
 const platform=[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]];
 box(x,y/2,z,w,y,d,baseStone,true);
 polygon(platform,y,.025,grayCourt);
 surfaceRect(x,z,w,d,y);
 hall(x,z,36,16,y,15.2,{bays:7,style:'hip-gable',ornate:true,sign:'養心殿'});
 const stairs=[x-8,x,x+8],front=z+d/2;
 for(const center of stairs)grandStair(center,front,1,4.2,y,5.5,'z');
 terraceRails(platform,y,front,false,0,(px,pz)=>Math.abs(pz-front)<.5&&stairs.some(center=>Math.abs(px-center)<3.2));

 // Hai dãy chữ U hướng vào sân giữa, cùng cao độ mái và nền.
 const leftU=[[-126,-156],[-140,-156],[-140,-144],[-126,-144]];
 uGallery(leftU);
 uGallery(leftU.map(([x,z])=>[-216-x,z]));
 // Dịch dãy ngang 10 m về phía trước, chừa sân và lối tới cổng tây.
 gallery(-143,-128,-73,-121);
}

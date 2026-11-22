// Tường cung, cổng nhỏ trên tường (có cánh cửa), mái ngói phủ đỉnh tường.
import * as THREE from 'three';
import {hall} from '../builders/hall.js';
import {add,beamBetween,bounds,box,polygon,surfaceRect} from '../builders/primitives.js';
import {roof} from '../builders/roof.js';
import {data} from '../data.js';
import {baseStone,gold,paleCourt,red,roofGold,stone,wallRed} from '../materials/textures.js';
import {edgeBox,gateDoors} from './mappedBuildings.js';
import {cutOut} from './openings.js';
import {buildSideGates} from './sideGates.js';
import {buildQianqingmen} from './landmarks.js';
import {pattern} from '../core/utils.js';
import {studDoor} from '../builders/ornaments.js';
import {FENGXIAN_SIDE_GATE} from '../core/fengxianLayout.js';
import {YANGXIN_EAST_GATE} from '../core/yangxinLayout.js';

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

function junctionRoof(main,branch,top,side=1){
 // Hai mái chung sống nóc tại nút T, với hai đường giao mái thay cho hai lớp ngói đè lên nhau.
 const [northWest,,southWest,southEast,northEast]=main;
 const [x,z,w,d]=bounds(branch);
 const north=northWest[1]-.15,south=southEast[1]+.15;
 const rise=.55;
 const section=(at)=>{
  const edge=([nx,nz],[sx,sz])=>nx+(sx-nx)*(at-nz)/(sz-nz);
  const west=edge(northWest,southWest),east=edge(northEast,southEast);
  return [
   [west-.19,top,at],
   [(west+east)/2,top+rise,at],
   [east+.19,top,at],
  ];
 };
 const [nw,nr,ne]=section(north),[sw,sr,se]=section(south);
 const half=d/2+.17,tip=x-w/2-.19;
 const [vn]=section(z-half),[vs]=section(z+half),[,joint]=section(z);
 const bn=[tip,top,z-half],br=[tip,top+rise,z],bs=[tip,top,z+half];
 function face(points,alongX=false,mat=roofGold){
  points=points.map(([x,y,z])=>[x*side,y,z]);
  const geometry=new THREE.BufferGeometry();
  const [a,b,c]=points;
  const upward=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
  if(upward<0)points.reverse();
  const uv=points.flatMap(([px,,pz])=>alongX?[px*.49,pz*.54]:[pz*.49,px*.54]);
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(points.length===4?[0,1,2,0,2,3]:[0,1,2]);
  geometry.computeVertexNormals();
  add(geometry,mat);
 }
 face([nw,nr,joint,vn]);
 face([vs,joint,sr,sw]);
 face([nr,ne,se,sr]);
 face([bn,vn,joint,br],true);
 face([br,joint,vs,bs],true);
 for(const [a,b] of [[nr,sr],[br,joint]]){
  beamBetween(new THREE.Vector3(a[0]*side,a[1],a[2]),new THREE.Vector3(b[0]*side,b[1],b[2]),.085,gold);
 }
 // Bịt mặt hồi ở ba đầu tường.
 face([nw,ne,nr],false,wallRed);
 face([se,sw,sr],false,wallRed);
 face([bs,bn,br],true,wallRed);
}

export function buildLWall(points,{endInset=0,cutOpenings=false}={}){
 const top=3.1;
 // Các đường song song chung một góc vát 45 độ, cả tường và mái đều nối kín.
 function offset(distance){
  return points.map(([x,z],i)=>{
   const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)];
   const direction=(a,b)=>{
    const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    return [(b[0]-a[0])/length,(b[1]-a[1])/length];
   };
   const first=direction(i===0?points[0]:before,i===0?points[1]:points[i]);
   const second=direction(i===points.length-1?before:points[i],i===points.length-1?points[i]:after);
   const nx=-first[1]-second[1],nz=first[0]+second[0];
   const scale=distance/(nx*(-first[1])+nz*first[0]);
   return [x+nx*scale,z+nz*scale];
  });
 }
 const bodyPoints=points.map(p=>[...p]);
 if(endInset>0){
  for(const [end,neighbor] of [[0,1],[points.length-1,points.length-2]]){
   const dx=points[neighbor][0]-points[end][0],dz=points[neighbor][1]-points[end][1];
   const length=Math.hypot(dx,dz);
   bodyPoints[end]=[points[end][0]+dx/length*endInset,points[end][1]+dz/length*endInset];
  }
 }
 const bodyLeft=offset(.625),bodyRight=offset(-.625);
 for(const end of [0,points.length-1]){
  for(const edge of [bodyLeft,bodyRight]){
   edge[end][0]+=bodyPoints[end][0]-points[end][0];
   edge[end][1]+=bodyPoints[end][1]-points[end][1];
  }
 }
 const body=[...bodyLeft,...bodyRight.reverse()];
 for(const piece of cutOpenings?cutOut(body):[body])polygon(piece,0,top,wallRed,true);
 const left=offset(.82),right=offset(-.82);
 function face(vertices,material){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices.flat(),3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(vertices.flatMap(([x,y,z])=>[x*.49,(z+y)*.54]),2));
  geometry.setIndex(vertices.length===4?[0,1,2,0,2,3]:[0,1,2]);
  geometry.computeVertexNormals();
  add(geometry,material);
 }
 for(let i=0;i<points.length-1;i++){
  const a=[points[i][0],top+.5,points[i][1]],b=[points[i+1][0],top+.5,points[i+1][1]];
  face([[left[i][0],top,left[i][1]],a,b,[left[i+1][0],top,left[i+1][1]]],roofGold);
  face([a,[right[i][0],top,right[i][1]],[right[i+1][0],top,right[i+1][1]],b],roofGold);
  beamBetween(new THREE.Vector3(...a),new THREE.Vector3(...b),.07,gold);
 }
 for(const i of [0,points.length-1]){
  face([[left[i][0],top,left[i][1]],[right[i][0],top,right[i][1]],[points[i][0],top+.5,points[i][1]]],roofGold);
 }
}

function buildLowGate(x,z,width,{doors=false,height=5.6}={}){
 const base=.15,depth=3.1;
 const lift=height-5.6;
 box(x,base/2,z,width+1,base,depth+1,stone,true);
 surfaceRect(x,z,width+1,depth+1,base);
 hall(x,z,width,depth,base,height,{bays:1,open:true,ornate:true,style:'hip-gable'});
 for(const side of [-1,1])box(x+side*(width*.455-.5),1.65+lift/2,z,1,3+lift,depth*.7,wallRed,true);
 if(doors){
  const halfOpening=width*.455-1;
  const leafWidth=halfOpening-.06,doorHeight=2.8+lift;
  for(const side of [-1,1]){
   const leaf=box(x+side*(halfOpening+.14),base+doorHeight/2,z+leafWidth/2,leafWidth,doorHeight,.22,studDoor,true);
   leaf.rotation.y=side*Math.PI/2;
  }
 }
}

function buildNoticeWalls(){
 const texture=pattern(256,384,context=>{
  context.fillStyle='#e5d8b3';context.fillRect(0,0,256,384);
  context.strokeStyle='#a39370';context.lineWidth=3;context.strokeRect(10,10,236,364);
  context.fillStyle='#87382a';context.textAlign='center';
  context.font='bold 38px "Microsoft YaHei",serif';context.fillText('公告',128,57);
  context.fillStyle='#423a2b';context.font='22px "Microsoft YaHei",serif';
  const columns=['宮中值日各司其職','謹守規矩依時交接','出入有序保持肅靜','文書交驗登記備查'];
  columns.forEach((line,i)=>[...line].forEach((character,j)=>context.fillText(character,207-i*52,105+j*30)));
  context.strokeStyle='#a44634';context.lineWidth=3;context.strokeRect(31,326,31,29);
 });
 const paper=new THREE.MeshStandardMaterial({map:texture,roughness:1});
 for(const id of ['638981206','638981228']){
  const entry=data.buildings.find(b=>b[3]===id);
  if(!entry)continue;
  const [x,z]=bounds(entry[0]);
  buildLWall([[x,z-4],[x,z+4]],{endInset:.5});
  for(const side of [-1,1])for(const offset of [-2.1,0,2.1]){
   const sheet=box(x+side*.638,1.85,z+offset,1.05,1.55,.018,paper);
   sheet.rotation.y=side*Math.PI/2;
  }
 }
}

export function buildWalls(){
buildNoticeWalls();
// Tuyến tường đỏ dày 1,25 m, mái hai dốc chung sống nóc như tường chữ T.
// Đoạn giữa dùng tường bao sáu cung dựng trong westSix.js, tránh mái chồng nhau.
buildLWall([[-68.25,-428.65],[-68.25,-366]]);
buildLWall([[-68.25,-214],[-68.25,YANGXIN_EAST_GATE.z-YANGXIN_EAST_GATE.width/2]]);
buildLWall([[-68.25,YANGXIN_EAST_GATE.z+YANGXIN_EAST_GATE.width/2],[-68.25,-114.4]]);
buildLWall([[70,-428.65],[70,-366]]);
// Mép tây Trai Cung (-208 đến -138) do fengxian.js dựng liền góc với sân.
// Hành lang ngang -214 đến -204 để thông, không dựng đoạn tường chắn đầu.
buildLWall([[70,-138],[70,FENGXIAN_SIDE_GATE.z-FENGXIAN_SIDE_GATE.width/2]]);
buildLWall([[70,FENGXIAN_SIDE_GATE.z+FENGXIAN_SIDE_GATE.width/2],[70,-114.4]]);
// Tường bắc cùng bề dày, mái hai dốc, nối tới cổng đóng trên trục giữa.
buildLWall([[-240.26,-428.65],[-4.86,-428.65]]);
buildLWall([[6.64,-428.65],[230.36,-428.65]]);
buildQianqingmen(.89,-428.65,11.5,6.5,0,9,{
 singleDoor:true,singleDoorWidth:.4,columnBays:1,openCenter:false,sign:'',
});
// Cổng ngang tại vị trí gạch xanh, nối đầu hành lang với tường ranh Ngự Hoa Viên.
buildLowGate(-63.575,-340.1,7.55,{doors:true,height:6.1});
buildLowGate(65.1,-340.1,8,{doors:true,height:6.1});
// Sân trung tâm Ngự Hoa Viên: tường mỏng, bỏ cổng hông, chừa duy nhất cổng chính.
buildLWall([[-10.46,-408.8],[-19.8,-408.8],[-19.8,-375.8],[-2.35,-375.8]]);
buildLWall([[13.24,-408.55],[20.7,-408.55],[20.7,-375.8],[3.86,-375.8]]);
for(const [outline,parts] of data.gatewayWalls){
 for(const part of parts)for(const piece of cutOut(part))polygon(piece,0,3.1,wallRed,true);
 polygon(outline,2.75,.35,wallRed);
}
for(const [outline,parts,mappedHeight,isGate] of data.gatewayBuildings){
 const [x,z,w,d]=bounds(outline);
 if(Math.abs(x-63.385)<.1&&Math.abs(z+114.165)<.1){
  buildLowGate(x,z,w);
  continue;
 }
 for(const part of parts)for(const piece of cutOut(part,'wall',2.85))polygon(piece,0,2.85,wallRed,true);
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
// Tường sân: trổ thêm lối đi để mọi sân đều thông nhau.
const main=data.walls.find(p=>p.length===5&&p[0][0]===108.25&&p[0][1]===-68.42);
const branch=data.walls.find(p=>p.length===4&&p[0][0]===93.13&&p[0][1]===-52.46);
const westMain=data.walls.find(p=>p.length===5&&p[0][0]===-109.1&&p[0][1]===-68.25);
const westBranch=data.walls.find(p=>p.length===4&&p[0][0]===-106.39&&p[0][1]===-52.36);
const eastL=data.walls.find(p=>p[0][0]===20.1&&p[0][1]===-118.88);
const westL=data.walls.find(p=>p[0][0]===-61.66&&p[0][1]===-113.27);
for(const p of data.walls){
 if(p===eastL||p===westL)continue;
 const eastJunction=main&&branch&&(p===main||p===branch);
 const westJunction=westMain&&westBranch&&(p===westMain||p===westBranch);
 const atJunction=eastJunction||westJunction;
 let outline=p;
 if(eastJunction&&p===branch)outline=p.map(([x,z])=>[x>100?x+.25:x,z]);
 if(westJunction&&p===westBranch)outline=p.map(([x,z])=>[x< -100?x-.25:x,z]);
 for(const piece of cutOut(outline)){
  polygon(piece,0,3.1,wallRed,true);
  if(!atJunction)wallCap(piece,3.1);
 }
}
if(eastL)buildLWall([[60.63,-114.17],[19.4,-114.17],[19.4,-128]]);
if(westL)buildLWall([[-61.64,-114.36],[-19.4,-114.36],[-19.4,-128]]);
buildLowGate(-64.365,-114.41,5.49);
if(main&&branch)junctionRoof(main,branch,3.1);
if(westMain&&westBranch){
 const mirror=points=>points.map(([x,z])=>[-x,z]);
 // Đưa các đỉnh phía tây về cùng thứ tự với phía đông trước khi dựng mái đối xứng.
 const ordered=[4,3,2,1,0].map(i=>westMain[i]);
 junctionRoof(mirror(ordered),mirror(westBranch),3.1,-1);
}
for(const [outline] of data.gatewayWalls)wallCap(outline,3.1);
// Lối đá trắng (甬路) từ điện xuống cổng sân theo bản đồ minh họa: mặt đá nhạt cao 12 cm, viền đá hai bên.
for(const [,x,z0,z1,w] of data.illustration?.paths||[]){
 const z=(z0+z1)/2,d=Math.abs(z1-z0);
 box(x,.06,z,w,.12,d,paleCourt,false,false);
 for(const s of [-1,1])box(x+s*(w/2+.12),.08,z,.24,.16,d,stone,false,false);
 surfaceRect(x,z,w+.48,d,.12);
}
buildSideGates();
}

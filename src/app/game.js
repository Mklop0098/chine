// Vòng lặp game: camera quỹ đạo, chế độ đi bộ, dẫn đường, đo, nhãn địa điểm, sự kiện bàn phím/chuột.
import * as THREE from 'three';
import {ui} from '../core/dom.js';
import {camera,renderer,scene} from '../core/scene.js';
import {sky} from '../core/sky.js';
import {vec} from '../core/utils.js';
import {data} from '../data.js';
import {waterNormal} from '../materials/textures.js';
import {npcs,updateNPCs} from '../npc/npcs.js';
import {royalNpcs} from '../npc/royal.js';
import {setWeather,updateWeather} from '../weather/weather.js';
import {WX} from '../weather/uniforms.js';
import {birdGroundSpots,updateBirds} from '../fauna/birds.js';
import {catSpots,updateCats} from '../fauna/cats.js';
import {updateSmoke} from '../fx/smoke.js';
import {walkableFloor} from '../player/collision.js';
import {activeRoom,closeRoom,renderRoom,roomCamera,roomScenes,showRoom} from '../rooms/rooms.js';
import {places} from '../world/landmarks.js';
import {detailedBuildings,mappedRoofParts} from '../world/mappedBuildings.js';
import {S} from '../core/state.js';
import {updateLanterns} from '../world/lanterns.js';

export let tags,target,focus,ray,plane,ruler,clock,keys,angle,pitch,distance,walking,measuring,first,drag,px,pz,yaw,look,feet,eyeY,guiding,guideIndex,route,routeLength,routeLine,canvas,moveCodes;

export function guideUI(){
 ui('guide').setAttribute('aria-pressed',String(guiding));
 ui('guide').textContent=guiding?'Dừng dẫn đường':'Đi theo tuyến';
}

export function hint(){
 ui('status').textContent=walking?'WASD hoặc mũi tên để đi · Kéo để nhìn quanh':measuring?'Chọn hai điểm trên mặt bằng để đo ngang.':'Kéo để xoay · Cuộn để thu phóng';
}

export function setWalk(value){
 walking=value;keys.clear();if(!value){guiding=false;guideUI()}document.body.classList.toggle('walking',value);
 ui('walk').setAttribute('aria-pressed',String(value));hint();
}

export function setMeasure(value){
 measuring=value;first=null;ruler.visible=false;ui('measure').setAttribute('aria-pressed',String(value));hint();
}

export function view(x,z,y,d,a,p){
 closeRoom();
 setWalk(false);setMeasure(false);routeLine.visible=false;target.set(x,y,z);focus.copy(target);distance=d;angle=a;pitch=p;
}

export function selectPlace(){
 const p=places[+ui('places').value];
 view(p.x,p.z,Math.min(15,p.y*.45),Math.max(p.detail?46:105,p.d*(p.detail?2.15:1.9)),.26,p.detail?.39:.18);ui('info').textContent=p.note;
}

export function tryPosition(x,z){
 const y=walkableFloor(x,z,feet);
 if(y===null)return false;
 px=x;pz=z;feet=y;return true;
}

export function move(dx,dz,slide=true){
 const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.115));
 let moved=false;
 for(let i=0;i<n;i++){
  if(tryPosition(px+dx/n,pz+dz/n)){moved=true;continue}
  if(!slide)break;
  if(dx&&tryPosition(px+dx/n,pz))moved=true;
  if(dz&&tryPosition(px,pz+dz/n))moved=true;
 }
 return moved;
}

export function guideStep(dt){
 const p=route[guideIndex];
 if(!p){
  guiding=false;guideUI();ui('status').textContent='Đã tới lối ra Thần Vũ Môn.';return;
 }
 const dx=p[0]-px,dz=p[1]-pz,d=Math.hypot(dx,dz);
 if(d<.022){guideIndex++;return}
 const wanted=Math.atan2(-dx,-dz);
 const delta=Math.atan2(Math.sin(wanted-yaw),Math.cos(wanted-yaw));
 yaw+=delta*(1-Math.exp(-dt*5.8));look*=Math.exp(-dt*3);
 const stride=Math.min(d,8.4*dt);
 if(stride>.001&&!move(dx/d*stride,dz/d*stride,false)){
  guiding=false;guideUI();ui('status').textContent='Đã dừng dẫn đường · Dùng WASD để tiếp tục.';
 }
}

export function render(){
 requestAnimationFrame(render);const dt=Math.min(clock.getDelta(),.09);
 if(activeRoom){updateWeather(dt);renderRoom();return}
 if(walking){
  if(guiding)guideStep(dt);
  else{
  const f=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
  const s=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
  const v=(keys.has('ShiftLeft')||keys.has('ShiftRight')?8:3.6)*dt/(Math.hypot(f,s)||1);
  const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*s)*v,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*s)*v;
  if(dx||dz)move(dx,dz);
  }
  eyeY=THREE.MathUtils.lerp(eyeY,feet+1.73,1-Math.exp(-dt*18));
  if(camera.near!==.14){camera.near=.14;camera.updateProjectionMatrix()}
  camera.position.set(px,eyeY,pz);camera.rotation.order='YXZ';camera.rotation.set(look,yaw,0);
 }else{
  const near=Math.max(2,distance*.045);
  if(camera.near!==near){camera.near=near;camera.updateProjectionMatrix()}
  focus.lerp(target,.16);
  camera.position.copy(focus).add(vec(Math.sin(angle)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(angle)*Math.cos(pitch)*distance));camera.lookAt(focus);
 }
 camera.updateMatrixWorld();
 const shown=[];
 const selected=+ui('places').value;
 const order=places.map((_,i)=>i).sort((a,b)=>Number(b===selected)-Number(a===selected));
 for(const i of order){
  const el=tags[i],p=places[i],v=vec(p.x,p.y+3,p.z).project(camera);
  const x=(v.x+1)*innerWidth/2,y=(1-v.y)*innerHeight/2,w=p.name.length*6.3+16;
  const rect={x:x-w/2,y:y-24,w};
  const overlaps=shown.some(r=>Math.abs(r.y-rect.y)<26&&r.x<rect.x+rect.w&&rect.x<r.x+r.w);
  const farLabel=distance<330&&i!==selected&&Math.hypot(p.x-focus.x,p.z-focus.z)>155;
  el.hidden=walking||v.z< -1||v.z>1||Math.abs(v.x)>1||Math.abs(v.y)>1||overlaps||farLabel||(distance>750&&![0,1,2,6,9,15].includes(i));
  if(!el.hidden){el.style.left=x+'px';el.style.top=y+'px';shown.push(rect)}
 }
 updateWeather(dt);updateNPCs();updateLanterns();updateBirds(dt);updateCats(dt);updateSmoke(dt);sky.position.copy(camera.position);waterNormal.offset.x+=dt*.012;waterNormal.offset.y+=dt*.006;
 renderer.render(scene,camera);renderer.shadowMap.autoUpdate=false;
}

export function buildGame1(){
tags=places.map((p,i)=>{
 ui('places').add(new Option(p.name,i));
 const el=document.createElement('span');el.className='pin';el.textContent=p.name;ui('labels').append(el);return el;
});
target=vec(0,12,481);
focus=target.clone();
ray=new THREE.Raycaster();
plane=new THREE.Plane(vec(0,1,0),0);
ruler=new THREE.Line(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:'#fff2a0',depthTest:false}));
ruler.visible=false;
ruler.renderOrder=20;
scene.add(ruler);
clock=new THREE.Clock();
keys=new Set();
angle=.25;
pitch=.19;
distance=229;
walking=false;
measuring=false;
first=null;
drag=null;
px=0;
pz=565;
yaw=0;
look=0;
feet=0;
eyeY=1.73;
guiding=false;
guideIndex=1;
route=data.route;
routeLength=route.reduce((sum,p,i)=>sum+(i?Math.hypot(p[0]-route[i-1][0],p[1]-route[i-1][1]):0),0);
routeLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(route.map(([x,z])=>vec(x,.32,z))),new THREE.LineBasicMaterial({color:'#714814',depthTest:false}));
routeLine.visible=false;
routeLine.renderOrder=19;
scene.add(routeLine);
}

export function buildGame2(){
ui('places').onchange=selectPlace;
roomScenes.forEach((room,i)=>ui('rooms').add(new Option(room.name,String(i))));
ui('rooms').onchange=()=>{const value=ui('rooms').value;if(value==='')closeRoom();else showRoom(+value)};
ui('backRoom').onclick=closeRoom;
ui('all').onclick=()=>{view(0,38,0,1420,.43,.97);ui('info').textContent='Ngoại triều ở phía nam, Nội đình ở phía bắc.'};
ui('plan').onclick=()=>{view(0,0,0,1390,0,1.568);routeLine.visible=true;ui('info').textContent='Tuyến Ngọ Môn → Thần Vũ Môn · '+Math.round(routeLength).toLocaleString('vi-VN')+' m.'};
ui('walk').onclick=()=>{
 closeRoom();
 if(walking){setWalk(false);return}
 setMeasure(false);routeLine.visible=false;px=0;pz=566;yaw=look=feet=0;eyeY=1.73;setWalk(true);ui('info').textContent='Điểm bắt đầu ở sân phía nam Ngọ Môn. Chế độ đi bộ theo mặt sân.';
};
ui('guide').onclick=()=>{
 closeRoom();
 if(guiding){guiding=false;guideUI();hint();return}
 setMeasure(false);routeLine.visible=false;
 [px,pz]=route[0];feet=0;eyeY=1.73;yaw=look=0;guideIndex=1;
 setWalk(true);guiding=true;guideUI();
 ui('info').textContent='Ngọ Môn → cầu Nội Kim Thủy → các hành lang bên điện → Ngự Hoa Viên → Thần Vũ Môn.';
 ui('status').textContent='Đang đi theo tuyến · WASD để tự điều khiển';
};
ui('measure').onclick=()=>{closeRoom();setWalk(false);setMeasure(!measuring)};
canvas=renderer.domElement;
canvas.addEventListener('pointerdown',e=>{drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(Math.abs(dx)+Math.abs(dy)>1)drag.moved=true;
 if(activeRoom){S.roomYaw-=dx*.006;S.roomPitch=THREE.MathUtils.clamp(S.roomPitch+dy*.004,.07,1.35)}
 else if(walking){yaw-=dx*.003;look=THREE.MathUtils.clamp(look-dy*.003,-1.2,1.2)}
 else if(!measuring){angle-=dx*.005;pitch=THREE.MathUtils.clamp(pitch+dy*.004,.13,1.568)}
 drag.x=e.clientX;drag.y=e.clientY;
});
canvas.addEventListener('pointerup',e=>{
 if(measuring&&drag&&!drag.moved){
  ray.setFromCamera(new THREE.Vector2(e.clientX/innerWidth*2-1,1-e.clientY/innerHeight*2),camera);
  const p=ray.ray.intersectPlane(plane,vec());
  if(p&&first){
   const meters=p.distanceTo(first);
   ruler.geometry.dispose();ruler.geometry=new THREE.BufferGeometry().setFromPoints([first.clone().setY(.8),p.clone().setY(.8)]);ruler.visible=true;first=null;
   ui('status').textContent=meters.toLocaleString('vi-VN',{maximumFractionDigits:1})+' m · Chọn hai điểm để đo tiếp';
  }else if(p){first=p;ruler.visible=false;ui('status').textContent='Chọn điểm thứ hai.'}
 }
 drag=null;
});
canvas.addEventListener('pointercancel',()=>{drag=null});
canvas.addEventListener('wheel',e=>{e.preventDefault();if(activeRoom)S.roomDistance=THREE.MathUtils.clamp(S.roomDistance*Math.exp(e.deltaY*.001),5,33);else if(!walking)distance=THREE.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),24,2200)},{passive:false});
moveCodes=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight']);
ui('settingsMenu').addEventListener('toggle',()=>keys.clear());
addEventListener('keydown',e=>{
 if(ui('settingsMenu').matches(':popover-open')){
  keys.clear();
  return;
 }
 if(walking&&moveCodes.has(e.code)){e.preventDefault();if(guiding){guiding=false;guideUI();hint()}keys.add(e.code)}
 if(e.code==='Escape'){if(activeRoom)closeRoom();else if(walking)setWalk(false)}
});
addEventListener('keyup',e=>keys.delete(e.code));
addEventListener('blur',()=>keys.clear());
for(const b of ui('directions').querySelectorAll('button')){
 b.onpointerdown=e=>{e.preventDefault();if(guiding){guiding=false;guideUI();hint()}b.setPointerCapture(e.pointerId);keys.add(b.dataset.code)};
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys.delete(b.dataset.code));
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();roomCamera.aspect=innerWidth/innerHeight;roomCamera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
}

export function buildGame4(){
const royalSelect=ui('royalNpc');
for(const npc of royalNpcs)royalSelect.add(new Option(npc.title,npc.id));
ui('royalView').onclick=()=>{
 const npc=royalNpcs.find(n=>n.id===royalSelect.value);
 view(npc.rig.position.x,npc.rig.position.z,1,8,.28,.22);
 ui('info').textContent=npc.title+' · Sân trước Ngọ Môn';
 ui('settingsMenu').hidePopover();
};
ui('npcAssembly').onclick=()=>{
 view(0,576,0,86,0,.77);
 ui('info').textContent='Đội hình NPC · Sân trước Ngọ Môn';
 ui('settingsMenu').hidePopover();
};
ui('info').textContent=places[0].name+' · '+places[0].note;
render();
window.palaceModel={unitsPerMeter:1,wall:[753,961,9.9,8.62,6.66],moatWidth:52,taiheHeight:35.05,footprints:detailedBuildings,mappedRoofParts,places:places.length,rooms:roomScenes.length,position:()=>[px,pz]};
// Lệnh gỡ lỗi trong console: palaceModel.setWeather('snow'), palaceModel.walkTo(0,300)
window.palaceModel.setWeather=setWeather;
window.palaceModel.weatherUniforms=WX;
window.palaceModel.npcCount=()=>npcs.length;
window.palaceModel.royalNpcCount=()=>royalNpcs.length;
window.palaceModel.birdSpots=birdGroundSpots;
window.palaceModel.catSpots=catSpots;
window.palaceModel.walkTo=(x,z,yw=0,lk=0)=>{setWalk(true);px=x;pz=z;yaw=yw;look=lk;feet=walkableFloor(x,z,0)??0};
}

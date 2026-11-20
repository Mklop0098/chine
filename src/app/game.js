// Vòng lặp game: camera quỹ đạo, chế độ đi bộ, dẫn đường, đo, nhãn địa điểm, sự kiện bàn phím/chuột.
import * as THREE from 'three';
import {ui} from '../core/dom.js';
import {adaptResolution,camera,renderer,scene} from '../core/scene.js';
import {sky} from '../core/sky.js';
import {vec} from '../core/utils.js';
import {data} from '../data.js';
import {waterNormal} from '../materials/textures.js';
import {npcs,updateNPCs} from '../npc/npcs.js';
import {royalNpcs,updateRoyals} from '../npc/royal.js';
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
import {chunks,stats as vegStats,updateLOD} from '../world/instancer.js';
import {updateVegetation,vegetationStats} from '../world/vegetation.js';
import {buildHero,hero,heroKneeling,placeHeroCamera,setHeroVisible,toggleKneel,updateHero} from '../player/hero.js';
import {buildMinimap,updateMinimap,zoomMinimap} from '../ui/minimap.js';
import {exitStory,startChapter1,storyMouseBusy,storyBeat,storyMarkers,storyFloor,storyDebug,storyFastForward,storyFog,storyInputLocked,storyMode,updateStory} from '../story/chapter1.js';
import {buildUI,dialogueOpen,pauseUI,showPause,startScreen} from '../story/ui.js';
import {suspendAudio} from '../story/audio.js';
import {buildProfileUI,profileOpen,showProfile} from '../story/profile.js';

export let tags,target,focus,ray,plane,ruler,clock,keys,angle,pitch,distance,walking,measuring,first,drag,px,pz,yaw,look,feet,eyeY,guiding,guideIndex,route,routeLength,routeLine,canvas,moveCodes;
let flight=null;
let heroMode=false;
let paused=false;
// Tạm dừng: đóng băng mọi cập nhật (cinematic, nhân vật, NPC, thời tiết, âm thanh) nhưng vẫn vẽ khung hình.
export function setPaused(v){
 if(paused===v)return;
 paused=v;keys.clear();drag=null;
 suspendAudio(v);
 const sm=storyMode();
 showPause(v,{story:['cine','free','play','done','catch'].includes(sm)});
}
const HERO_SPAWNS=[[1,262],[1,300],[0,566]];

export function guideUI(){
 ui('guide').setAttribute('aria-pressed',String(guiding));
 ui('guide').textContent=guiding?'Dừng dẫn đường':'Đi theo tuyến';
}

export function hint(){
 ui('status').textContent=walking&&heroMode?(document.pointerLockElement?'Chuột xoay camera · WASD đi · Shift chạy · E hành lễ · Q quỳ · Esc nhả chuột':'Bấm vào màn hình để khóa chuột (xoay camera theo chuột) · WASD đi · Shift chạy · E hành lễ · Q quỳ'):walking?'WASD hoặc mũi tên để đi · Kéo để nhìn quanh':measuring?'Chọn hai điểm trên mặt bằng để đo ngang.':'Kéo để di chuyển · Kéo chuột phải để xoay · Cuộn để thu phóng';
}

export function setWalk(value){
 if(value)flight=null;
 walking=value;keys.clear();if(!value){guiding=false;guideUI();heroMode=false}
 setHeroVisible(walking&&heroMode);ui('hero').setAttribute('aria-pressed',String(walking&&heroMode));
 document.body.classList.toggle('walking',value);
 ui('walk').setAttribute('aria-pressed',String(value));hint();
}

export function setMeasure(value){
 if(value)flight=null;
 measuring=value;first=null;ruler.visible=false;ui('measure').setAttribute('aria-pressed',String(value));hint();
}

// Khi đang điều khiển nhân vật mà chuyển sang góc nhìn bản đồ (Toàn cảnh, chọn công trình…),
// nhân vật vẫn đứng nguyên tại chỗ và có nút "Quay lại nhân vật".
let savedHero=null;
function rememberHero(){
 if(walking&&heroMode&&!savedHero)savedHero={x:px,z:pz,feet,camYaw:hero.camYaw,camPitch:hero.camPitch,camDist:hero.camDist};
}
function keepHeroShown(){
 if(!savedHero)return;
 setHeroVisible(true);ui('backHero').hidden=false;
 // Bản đồ nhìn từ trên cao: đặt tâm quay quanh vị trí nhân vật nếu đang ở góc nhìn gần.
}
export function returnToHero(){
 if(!savedHero)return;
 const s=savedHero;savedHero=null;ui('backHero').hidden=true;
 closeRoom();flight=null;setMeasure(false);routeLine.visible=false;
 px=s.x;pz=s.z;feet=s.feet;hero.camYaw=s.camYaw;hero.camPitch=s.camPitch;hero.camDist=s.camDist;hero.camCur=s.camDist;
 heroMode=true;setWalk(true);
}
function forgetHero(){savedHero=null;ui('backHero').hidden=true}

export function view(x,z,y,d,a,p){
 rememberHero();
 closeRoom();
 flight=null;
 setWalk(false);setMeasure(false);routeLine.visible=false;target.set(x,y,z);focus.copy(target);distance=d;angle=a;pitch=p;
 keepHeroShown();
}

export function selectPlace(){
 const p=places[+ui('places').value];
 rememberHero();
 closeRoom();
 setWalk(false);keepHeroShown();setMeasure(false);routeLine.visible=false;
 const turn=Math.atan2(Math.sin(.26-angle),Math.cos(.26-angle));
 flight={elapsed:0,from:focus.clone(),to:vec(p.x,Math.min(15,p.y*.45),p.z),
  distance,toDistance:Math.max(p.detail?46:105,p.d*(p.detail?2.15:1.9)),angle,turn,pitch,toPitch:p.detail?.39:.18};
 ui('info').textContent=p.note;
}

function updateMapCamera(){
 const near=Math.max(2,distance*.045);
 if(camera.near!==near){camera.near=near;camera.updateProjectionMatrix()}
 camera.position.copy(focus).add(vec(Math.sin(angle)*Math.cos(pitch)*distance,Math.sin(pitch)*distance,Math.cos(angle)*Math.cos(pitch)*distance));
 camera.lookAt(focus);
}

function zoomMap(e){
 flight=null;
 const next=THREE.MathUtils.clamp(distance*Math.exp(e.deltaY*.001),Math.min(distance,24),2200);
 if(next===distance)return;
 updateMapCamera();camera.updateMatrixWorld();
 const rect=canvas.getBoundingClientRect();
 ray.setFromCamera(new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2),camera);
 const anchor=ray.ray.intersectPlane(plane,vec());
 if(anchor&&anchor.distanceTo(camera.position)<distance*4){
  const shift=1-next/distance;
  focus.x+=(anchor.x-focus.x)*shift;
  focus.z+=(anchor.z-focus.z)*shift;
  focus.y+=(anchor.y-focus.y)*shift;
  target.copy(focus);
 }
 distance=next;
}

export function tryPosition(x,z){
 const sf=storyFloor(x,z);
 const y=sf===undefined?walkableFloor(x,z,feet):sf;
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

// Di chuyển nhân vật theo hướng camera; nhân vật xoay mượt về hướng đi.
function heroStep(dt){
 if(storyInputLocked()||profileOpen()){hero.speed=0;return}
 const f=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
 const s=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
 const running=keys.has('ShiftLeft')||keys.has('ShiftRight');
 const bowing=hero.bow>=0;
 // Đang quỳ: bấm phím đi sẽ đứng dậy trước, chưa di chuyển.
 if(heroKneeling()){if(f||s)hero.kneelTarget=0;hero.speed=0;return}
 let target=0,prevYaw=hero.yaw;
 if((f||s)&&!bowing){
  const len=Math.hypot(f,s),cy=hero.camYaw;
  const dx=(-Math.sin(cy)*f+Math.cos(cy)*s)/len,dz=(-Math.cos(cy)*f-Math.sin(cy)*s)/len;
  const want=Math.atan2(dx,dz),delta=Math.atan2(Math.sin(want-hero.yaw),Math.cos(want-hero.yaw));
  hero.yaw+=delta*(1-Math.exp(-dt*11));
  target=Math.min(running?5.2:2.1,hero.speedCap||99);
  const v=hero.speed*dt*Math.max(.25,Math.cos(delta));
  if(v>0&&!move(dx*v,dz*v))target=0;
 }
 hero.speed=THREE.MathUtils.lerp(hero.speed,target,1-Math.exp(-dt*(target>hero.speed?6:9)));
 if(hero.speed<.02&&!target)hero.speed=0;
 hero.turnRate=THREE.MathUtils.lerp(hero.turnRate,Math.atan2(Math.sin(hero.yaw-prevYaw),Math.cos(hero.yaw-prevYaw))/Math.max(dt,1e-3),1-Math.exp(-dt*6));
}

export function startHero(){
 closeRoom();
 setMeasure(false);routeLine.visible=false;
 const near=walking&&Number.isFinite(px)?[[px,pz]]:[];
 for(const [x,z] of [...near,...HERO_SPAWNS]){const y=walkableFloor(x,z,0);if(y!==null){px=x;pz=z;feet=y;break}}
 hero.y=feet;hero.yaw=Math.PI;hero.camYaw=0;hero.camPitch=.3;hero.speed=0;hero.bow=-1;hero.kneel=hero.kneelTarget=0;
 heroMode=true;setWalk(true);
 ui('info').textContent='Cung nữ · Tiện bào xanh lơ, khảm khiên xanh đậm viền hoa mai, giày hoa bồn để. Điều khiển góc nhìn thứ ba.';
}

// Cầu nối cho cốt truyện: đặt người chơi, đọc vị trí, dọn các chế độ khác.
export function storyApi(){return{
 prepare(){forgetHero();showProfile(false);closeRoom();setMeasure(false);routeLine.visible=false;flight=null;setWalk(false);try{ui('settingsMenu').hidePopover()}catch{}},
 placePlayer(x,z,yawV,camYaw){px=x;pz=z;feet=walkableFloor(x,z,0)??0;hero.y=feet;hero.yaw=yawV;hero.camYaw=camYaw;hero.camPitch=.22;hero.camDist=3.6;hero.camCur=3.6;hero.speed=0;hero.bow=-1;hero.kneel=hero.kneelTarget=0;heroMode=true;setWalk(true)},
 player(){return{x:px,y:feet,z:pz}},
 release(){keys.clear();setWalk(false)}
}}

export function render(){
 requestAnimationFrame(render);const raw=clock.getDelta(),dt=Math.min(raw,.09);
 if(paused){renderer.render(scene,camera);return}
 adaptResolution(raw);
 // Cinematic của cốt truyện: camera do kịch bản điều khiển.
 const sm=storyMode();
 if(sm==='cine'||sm==='loading'||sm==='catch'){
  if(sm!=='loading')updateStory(dt);
  updateLOD(camera.position);updateVegetation(dt);updateRoyals(clock.elapsedTime);
  updateWeather(dt);storyFog();updateNPCs();updateLanterns();updateBirds(dt);updateCats(dt);updateSmoke(dt);
  sky.position.copy(camera.position);waterNormal.offset.x+=dt*.012;waterNormal.offset.y+=dt*.006;
  renderer.render(scene,camera);renderer.shadowMap.autoUpdate=false;return;
 }
 if(activeRoom){updateWeather(dt);renderRoom();return}
 if(walking){
  if(guiding)guideStep(dt);
  else if(heroMode){}
  else{
  const f=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
  const s=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
  const v=(keys.has('ShiftLeft')||keys.has('ShiftRight')?8:3.6)*dt/(Math.hypot(f,s)||1);
  const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*s)*v,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*s)*v;
  if(dx||dz)move(dx,dz);
  }
  if(heroMode){heroStep(dt);updateHero(dt,px,feet,pz);placeHeroCamera(camera,dt)}
  else{
  eyeY=THREE.MathUtils.lerp(eyeY,feet+1.73,1-Math.exp(-dt*18));
  if(camera.near!==.14){camera.near=.14;camera.updateProjectionMatrix()}
  camera.position.set(px,eyeY,pz);camera.rotation.order='YXZ';camera.rotation.set(look,yaw,0);
  }
 }else{
  if(flight){
   flight.elapsed+=dt;
   const progress=Math.min(1,flight.elapsed/1.35);
   const blend=progress*progress*(3-2*progress);
   focus.lerpVectors(flight.from,flight.to,blend);target.copy(focus);
   distance=THREE.MathUtils.lerp(flight.distance,flight.toDistance,blend);
   angle=flight.angle+flight.turn*blend;
   pitch=THREE.MathUtils.lerp(flight.pitch,flight.toPitch,blend);
   if(progress===1)flight=null;
  }
  updateMapCamera();
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
 updateLOD(camera.position);updateVegetation(dt);updateRoyals(clock.elapsedTime);
 updateWeather(dt);if(sm==='play'||sm==='done'||sm==='free')updateStory(dt);updateNPCs();updateLanterns();updateBirds(dt);updateCats(dt);updateSmoke(dt);sky.position.copy(camera.position);waterNormal.offset.x+=dt*.012;waterNormal.offset.y+=dt*.006;
 minimapTick();
 renderer.render(scene,camera);renderer.shadowMap.autoUpdate=false;
}

// Cập nhật minimap: theo nhân vật khi đang đi, theo tâm bản đồ khi xem toàn cảnh.
// Khóa chuột kiểu game bắn súng: bấm vào màn hình khi điều khiển nhân vật, camera xoay theo chuột.
const mouseLookAllowed=()=>walking&&heroMode&&!paused&&!storyMouseBusy()&&!activeRoom&&!profileOpen()&&!dialogueOpen()&&!['cine','catch','loading'].includes(storyMode());
function mouseLookTick(){
 if(document.pointerLockElement===canvas&&!mouseLookAllowed())document.exitPointerLock();
}
function buildMouseLook(){
 canvas.addEventListener('click',()=>{
  if(mouseLookAllowed()&&document.pointerLockElement!==canvas){try{const r=canvas.requestPointerLock();r?.catch?.(()=>{})}catch{}}
 });
 document.addEventListener('mousemove',e=>{
  if(document.pointerLockElement!==canvas)return;
  hero.camYaw-=e.movementX*.0026;
  hero.camPitch=THREE.MathUtils.clamp(hero.camPitch+e.movementY*.002,-.25,1.25);
 });
 document.addEventListener('pointerlockchange',()=>{drag=null;hint()});
}

function minimapTick(){
 mouseLookTick();
 let x,z,hx,hz,isHero=false;
 if(walking){x=px;z=pz;isHero=heroMode;if(heroMode){hx=Math.sin(hero.yaw);hz=Math.cos(hero.yaw)}else{hx=-Math.sin(yaw);hz=-Math.cos(yaw)}}
 else if(savedHero){x=savedHero.x;z=savedHero.z;hx=Math.sin(hero.yaw);hz=Math.cos(hero.yaw);isHero=true}
 else{x=focus.x;z=focus.z;hx=-Math.sin(angle);hz=-Math.cos(angle)}
 let place='',best=75;
 for(const p of places){const d=Math.hypot(p.x-x,p.z-z);if(d<best){best=d;place=p.name}}
 updateMinimap({x,z,hx,hz,hero:isHero,markers:storyMarkers(),place:place?'Gần: '+place:'Tử Cấm Thành'},clock.elapsedTime);
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
ui('rooms').onchange=()=>{flight=null;const value=ui('rooms').value;if(value==='')closeRoom();else showRoom(+value)};
ui('backRoom').onclick=closeRoom;
ui('all').onclick=()=>{view(0,38,0,1420,.43,.97);ui('info').textContent='Ngoại triều ở phía nam, Nội đình ở phía bắc.'};
ui('plan').onclick=()=>{view(0,0,0,1390,0,1.568);routeLine.visible=true;ui('info').textContent='Tuyến Ngọ Môn → Thần Vũ Môn · '+Math.round(routeLength).toLocaleString('vi-VN')+' m.'};
ui('walk').onclick=()=>{
 closeRoom();
 if(walking){setWalk(false);return}
 setMeasure(false);routeLine.visible=false;heroMode=false;px=0;pz=566;yaw=look=feet=0;eyeY=1.73;setWalk(true);ui('info').textContent='Điểm bắt đầu ở sân phía nam Ngọ Môn. Chế độ đi bộ theo mặt sân.';
};
ui('guide').onclick=()=>{
 closeRoom();
 if(guiding){guiding=false;guideUI();hint();return}
 setMeasure(false);routeLine.visible=false;
 heroMode=false;[px,pz]=route[0];feet=0;eyeY=1.73;yaw=look=0;guideIndex=1;
 setWalk(true);guiding=true;guideUI();
 ui('info').textContent='Ngọ Môn → cầu Nội Kim Thủy → các hành lang bên điện → Ngự Hoa Viên → Thần Vũ Môn.';
 ui('status').textContent='Đang đi theo tuyến · WASD để tự điều khiển';
};
ui('measure').onclick=()=>{closeRoom();setWalk(false);setMeasure(!measuring)};
buildHero();
ui('hero').onclick=()=>{if(walking&&heroMode){setWalk(false);return}startHero()};
canvas=renderer.domElement;
canvas.addEventListener('contextmenu',e=>{if(!activeRoom&&!walking&&!measuring)e.preventDefault()});
canvas.addEventListener('pointerdown',e=>{
 if(document.pointerLockElement===canvas)return;
 if(drag||(e.button!==0&&(e.button!==2||activeRoom||walking||measuring)))return;
 flight=null;
 drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,rotate:e.button===2||e.shiftKey};
 canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 if(['cine','catch'].includes(storyMode()))return;
 const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
 if(Math.abs(dx)+Math.abs(dy)>1)drag.moved=true;
 if(activeRoom){S.roomYaw-=dx*.006;S.roomPitch=THREE.MathUtils.clamp(S.roomPitch+dy*.004,.07,1.35)}
 else if(walking&&heroMode){hero.camYaw-=dx*.005;hero.camPitch=THREE.MathUtils.clamp(hero.camPitch+dy*.004,-.25,1.25)}
 else if(walking){yaw-=dx*.003;look=THREE.MathUtils.clamp(look-dy*.003,-1.2,1.2)}
 else if(!measuring){
  if(drag.rotate){angle-=dx*.005;pitch=THREE.MathUtils.clamp(pitch+dy*.004,.13,1.568)}
  else{
   const scale=2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))/canvas.clientHeight;
   const across=-dx*scale,depth=-dy*scale/Math.max(.25,Math.sin(pitch));
   focus.x+=Math.cos(angle)*across+Math.sin(angle)*depth;
   focus.z-=Math.sin(angle)*across-Math.cos(angle)*depth;
   target.copy(focus);
  }
 }
 drag.x=e.clientX;drag.y=e.clientY;
});
canvas.addEventListener('pointerup',e=>{
 if(!drag||drag.id!==e.pointerId)return;
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
canvas.addEventListener('lostpointercapture',e=>{if(drag?.id===e.pointerId)drag=null});
canvas.addEventListener('wheel',e=>{e.preventDefault();if(['cine','catch'].includes(storyMode()))return;if(activeRoom)S.roomDistance=THREE.MathUtils.clamp(S.roomDistance*Math.exp(e.deltaY*.001),5,33);else if(walking&&heroMode)hero.camDist=THREE.MathUtils.clamp(hero.camDist*Math.exp(e.deltaY*.001),1.4,12);else if(!walking)zoomMap(e)},{passive:false});
moveCodes=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight']);
ui('settingsMenu').addEventListener('toggle',()=>keys.clear());
// Phím P: tạm dừng / tiếp tục. Lắng nghe ở pha capture để chặn mọi phím khác khi đang dừng.
addEventListener('keydown',e=>{
 if(e.target.closest?.('input,select,textarea'))return;
 if(e.code==='KeyP'&&!e.repeat&&storyMode()!=='loading'){e.preventDefault();e.stopImmediatePropagation();setPaused(!paused);return}
 if(paused){e.preventDefault();e.stopImmediatePropagation();if(e.code==='Escape')setPaused(false);return}
 // Phím I: bảng nhân vật / hành trang (không mở trong cinematic).
 const sm=storyMode();
 if(e.code==='KeyI'&&!e.repeat&&!['cine','catch','loading'].includes(sm)){e.preventDefault();e.stopImmediatePropagation();showProfile(!profileOpen());return}
 if(profileOpen()){e.preventDefault();e.stopImmediatePropagation();if(e.code==='Escape')showProfile(false);return}
 // Phím Backspace / B: quay lại nhân vật khi đang xem toàn cảnh.
 if(e.code==='KeyM'&&!e.repeat&&!['cine','catch','loading'].includes(sm)){e.preventDefault();zoomMinimap();return}
 if((e.code==='KeyB'||e.code==='Backspace')&&savedHero){e.preventDefault();e.stopImmediatePropagation();returnToHero()}
},true);
addEventListener('keydown',e=>{
 if(ui('settingsMenu').matches(':popover-open')){
  keys.clear();
  return;
 }
 if(walking&&moveCodes.has(e.code)){e.preventDefault();if(guiding){guiding=false;guideUI();hint()}keys.add(e.code)}
 if(walking&&heroMode&&e.code==='KeyE'&&hero.bow<0&&hero.speed<.6&&!heroKneeling())hero.bow=0;
 if(walking&&heroMode&&e.code==='KeyQ'&&!e.repeat)toggleKneel();
 if(e.code==='Escape'&&['cine','free','play','loading','catch'].includes(storyMode()))return;
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
buildUI();
buildMinimap();
buildMouseLook();
buildProfileUI(open=>{keys.clear();if(open&&paused)setPaused(false)});
ui('backHero').onclick=returnToHero;
pauseUI({toggle:()=>setPaused(!paused),action:a=>{
 setPaused(false);
 if(a==='restart')startChapter1(storyApi());
 if(a==='explore'){exitStory();forgetHero();setWalk(false);view(0,481,12,229,.25,.19)}
}});
showPause(false);
ui('chapter1').onclick=()=>{setPaused(false);startChapter1(storyApi())};
startScreen(()=>startChapter1(storyApi()),()=>{});
window.palaceModel={unitsPerMeter:1,wall:[753,961,9.9,8.62,6.66],moatWidth:52,taiheHeight:35.05,footprints:detailedBuildings,mappedRoofParts,places:places.length,rooms:roomScenes.length,position:()=>[px,pz]};
// Lệnh gỡ lỗi trong console: palaceModel.setWeather('snow'), palaceModel.walkTo(0,300)
window.palaceModel.setWeather=setWeather;
window.palaceModel.weatherUniforms=WX;
window.palaceModel.npcCount=()=>npcs.length;
window.palaceModel.vegetation=()=>({...vegetationStats,...vegStats,visibleChunks:chunks.filter(c=>c.cur>=0).length});
window.palaceModel.royalNpcCount=()=>royalNpcs.length;
window.palaceModel.birdSpots=birdGroundSpots;
window.palaceModel.catSpots=catSpots;
window.palaceModel.hero=()=>({x:px,z:pz,y:feet,mode:heroMode,speed:hero.speed});
window.palaceModel.playHero=startHero;
window.palaceModel.floorAt=(x,z,c=0)=>walkableFloor(x,z,c);
window.palaceModel.view=view;
window.palaceModel.storyFF=storyFastForward;
window.palaceModel.storyBeat=storyBeat;
window.palaceModel.storyDebug=storyDebug;
window.palaceModel.walkTo=(x,z,yw=0,lk=0)=>{setWalk(true);px=x;pz=z;yaw=yw;look=lk;feet=walkableFloor(x,z,0)??0};
}

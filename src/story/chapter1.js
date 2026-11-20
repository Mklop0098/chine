// HẬU CUNG CẨM LAN TRUYỆN — Chương I: Nhất mộng nhập cung.
// Cinematic theo kịch bản (5 cảnh, 32 shot) rồi chuyển sang phần chơi với nhiệm vụ "Bước đầu nhập cung".
import * as THREE from 'three';
import {camera,renderer,scene} from '../core/scene.js';
import {buildFigure,poseFigure} from '../npc/figure.js';
import {hero,heroParts,setHeroVisible,updateHero} from '../player/hero.js';
import {walkableFloor} from '../player/collision.js';
import {westZ} from '../world/rampart.js';
import {paved} from '../materials/textures.js';
import {seekGameTime} from '../weather/calendar.js';
import {setWeather} from '../weather/weather.js';
import {animateCarriage,animateFlags,buildMontageSet,buildSuburb,makeBanner,makeBirds,makeCarriage,makeGateDoors,makeLeaves,makeTable,mat} from './props.js';
import * as A from './audio.js';
import * as UI from './ui.js';
import {addRelation,learn,profile,resetProfile,stat,unlockSystems} from './profile.js';

const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
const turn=(a,b,k)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*Math.min(1,k);

let mode='idle',api=null,built=false;
export const storyMode=()=>mode;
export const storyActive=()=>['cine','free','play','catch'].includes(mode);
let inputLocked=false;
export const storyInputLocked=()=>inputLocked||UI.dialogueOpen();
export const storyMouseBusy=()=>false;
const selProps=[];

// ---------- Toạ độ trong thế giới ----------
let GZ,GATE_X,DOOR_X,SUB_X,MONT;
const ROAD_X=-451,YARD_X=-473;
let carriages=[],lead,doors,leaves,birds,montage,table,actors={},girls=[],staticExtras=[],selection=null;
let stage='A',stageT=0,convoySpeed=0,leadZ=0,simT=0;

function F(spec){return buildFigure({roundels:0,cloud:false,...spec})}
function place(root,x,y,z,yaw=0,parent=scene){root.position.set(x,y,z);root.rotation.y=yaw;parent.add(root);return root}

// ---------- Diễn viên ----------
function makeActor(name,o){const a={name,pos:V(),yaw:0,speed:0,path:null,sit:0,sitLower:0,...o};actors[name]=a;return a}
function goTo(a,pts,speed=1.2,done){a.path=pts.map(p=>p.clone?p.clone():V(...p));a.pathSpeed=speed;a.done=done}
function setPos(a,x,y,z,yaw){a.pos.set(x,y,z);if(yaw!==undefined)a.yaw=a.faceYaw=yaw;a.path=null}
function tickActor(a,dt){
 let sp=0;
 if(a.path&&a.path.length){
  const t=a.path[0],dx=t.x-a.pos.x,dz=t.z-a.pos.z,d=Math.hypot(dx,dz);
  if(d<.04){a.pos.y=t.y;a.path.shift();if(!a.path.length){a.path=null;const f=a.done;a.done=null;f?.()}}
  else{const st=Math.min(d,a.pathSpeed*dt);a.pos.x+=dx/d*st;a.pos.z+=dz/d*st;a.pos.y=lerp(a.pos.y,t.y,Math.min(1,st/d));a.yaw=turn(a.yaw,Math.atan2(dx,dz),dt*9);sp=a.pathSpeed}
 }else if(a.faceYaw!==undefined&&a.faceYaw!==null)a.yaw=turn(a.yaw,a.faceYaw,dt*6);
 a.speed=lerp(a.speed,sp,1-Math.exp(-dt*9));
 if(a.isHero){
  hero.yaw=a.yaw;hero.speed=a.speed;hero.y=a.pos.y;hero.pose=a.pose||null;hero.sitTarget=a.sit;
  updateHero(dt,a.pos.x,a.pos.y,a.pos.z);
 }else{
  a.root.position.copy(a.pos);a.root.rotation.y=a.yaw;
  if(a.fig.limbs)poseFigure(a.fig,dt,{speed:a.speed,sit:a.sit,arms:a.arms,head:a.head,lean:a.lean});
  else{a.bob=(a.bob||0)+dt*a.speed*5.6;a.root.position.y=a.pos.y+Math.abs(Math.cos(a.bob))*.02*Math.min(1,a.speed)-a.sitLower;
   if(a.fig.head){a.fig.head.rotation.y=lerp(a.fig.head.rotation.y,a.head?a.head[1]:0,1-Math.exp(-dt*4))}}
 }
}
const headPos=(a,out=V())=>{if(a.isHero){heroParts().head.getWorldPosition(out);out.y+=.11}else{a.fig.head.getWorldPosition(out);out.y+=.11}return out};
const cab=(x,y,z,c=lead)=>c.cabin.localToWorld(V(x,y,z));

// ---------- Dựng bối cảnh ----------
function build(){
 if(built)return;built=true;
 GZ=westZ;GATE_X=-371.5;DOOR_X=-382.6;SUB_X=-1150;
 UI.buildUI();
 buildSuburb(SUB_X,-460,460);
 montage=buildMontageSet(-1650,0);
 // Bóng phi tần sau rèm lụa trong montage.
 const consort=buildFigure({sex:'f',robe:'#4a2a40',collarCape:'#1b1626',roundels:0,cloud:false,board:{w:.44,h:.16},flowers:['#9a5a7a','#d8c0c8','#6a4a6a']});
 place(consort.root,montage.room.position.x-1650-0.0+0,0,0);consort.root.position.set(-1650-10-.4,0,6-1.0);consort.root.rotation.y=.3;
 // Đoàn xe.
 const coats=[['#24384f','#2f4a3a'],['#3a2f28','#4a3a2a'],['#2f3a4a','#3a4a3a']];
 carriages=coats.map(([cover,curtain],i)=>makeCarriage({cover,curtain}));
 lead=carriages[0];
 // Cổng phụ (Tây Hoa Môn) – hai cánh cửa gỗ son đinh vàng.
 doors=makeGateDoors(DOOR_X,GZ,4.55,5.35);doors.set(0);
 // Sân tập trung ngoài cổng, bàn kiểm danh, cờ hiệu.
 const yard=new THREE.Mesh(new THREE.PlaneGeometry(30,34).rotateX(-Math.PI/2),paved);yard.position.set(YARD_X,.035,GZ+2);yard.receiveShadow=true;scene.add(yard);
 table=makeTable(-470,GZ-11.5,0);
 for(const [x,z] of [[-447.5,GZ-9.5],[-447.5,GZ+9.5],[-389.5,GZ-8],[-389.5,GZ+8],[-486,GZ-14],[-486,GZ+18]])makeBanner(x,z,'#e2b52f',6.5);
 leaves=makeLeaves(240);
 birds=makeBirds(10);birds.group.visible=false;

 // Nhân vật.
 makeActor('clan',{isHero:true});
 const tu=F({sex:'f',robe:'#f3b5c4',hem:'#fbe3ea',hairStyle:'braid',lowShoes:true,shoe:'#e48aa4',kerchief:'#fff3f6',flowers:['#ffffff'],ribbon:'#e9506e',animated:true,seed:31,face:'textures/tunhi-face.png',skin:'#ebbca6'});
 makeActor('tu',{fig:tu,root:place(tu.root,0,0,0)});
 const mama=F({sex:'f',robe:'#4e3426',hem:'#6a4a32',vest:'#2c2019',vestTrim:'#8a6a3a',hairStyle:'bun',hair:'#4a4440',old:true,lowShoes:true,shoe:'#2a1d16',lips:'#8a4a46',skin:'#e2b896',kerchief:'#d9cdb4',animated:true,seed:37});
 makeActor('mama',{fig:mama,root:place(mama.root,0,0,0)});
 const clerk=F({sex:'m',robe:'#2d3a4f',hem:'#1c2433',hat:'eunuch',clothShoes:true,skin:'#e6bf9e',animated:true,seed:41});
 makeActor('clerk',{fig:clerk,root:place(clerk.root,-470,0,GZ-12.6)});
 for(const k of [0,1]){
  const g=F({sex:'m',robe:'#3c3544',hem:'#842e25',vest:'#1d1a20',vestTrim:'#c9a24a',hat:'guard',skin:'#d9ad88',animated:true,seed:43+k});
  makeActor('guard'+k,{fig:g,root:place(g.root,0,0,0)});
 }
 // Các thiếu nữ (Lý Ngọc Trân và những người khác) – tĩnh, chỉ trượt khi di chuyển.
 const cols=['#cfc6b2','#b9c6b4','#c9bfa8','#b5bfc9','#d2c2b0','#bfc8b0','#c8b8c8','#ad9f8a'];
 cols.forEach((c,i)=>{const g=F({sex:'f',robe:c,hem:'#e9e2d0',hairStyle:'braid',lowShoes:true,shoe:'#4a4a5a',flowers:[['#f2a6bd','#ffffff','#f2c445'][i%3]],seed:50+i});
  girls.push(makeActor('girl'+i,{fig:g,root:place(g.root,0,0,0)}))});
 actors.tran=girls[0];
 // Phu xe (ngồi trên ghế trước).
 carriages.forEach((c,i)=>{const d=F({sex:'m',robe:['#7a6a55','#6a5a48','#80705a'][i],hem:'#5a4a38',hat:'straw',clothShoes:true,skin:'#c99a74'});
  d.root.position.set(-.38,1.02-.46,-1.62);d.root.rotation.y=Math.PI;c.cabin.add(d.root);c.driver=d});
 // Thị vệ đứng dọc đường men tường cung.
 for(let z=GZ+30;z<530;z+=24){const g=F({sex:'m',robe:'#3c3544',hem:'#842e25',vest:'#1d1a20',vestTrim:'#c9a24a',hat:'guard',skin:'#d9ad88'});place(g.root,-446.6,0,z,-Math.PI/2);staticExtras.push(g)}
 for(const s of [-1,1]){const g=F({sex:'m',robe:'#3c3544',hem:'#842e25',vest:'#1d1a20',vestTrim:'#c9a24a',hat:'guard',skin:'#d9ad88'});place(g.root,-447.2,0,GZ+s*7.2,-Math.PI/2);staticExtras.push(g)}
 // Túi vải thêu hoa bên hông Cẩm Lan (trong xe).
 const pouch=new THREE.Mesh(new THREE.SphereGeometry(.07,10,8).scale(1,1.2,.6),mat('#4a6a8a'));pouch.position.set(.6,1.47,-.2);lead.cabin.add(pouch);
 buildSelectionArea();
}

// ---------- Mô phỏng đoàn xe ----------
function convoyPositions(){
 carriages.forEach((c,i)=>{
  const x=stage==='A'?SUB_X:ROAD_X,z=leadZ+i*11;
  c.group.position.set(x,0,z);
 });
}
function setStage(s){
 stage=s;stageT=0;
 if(s==='A'){leadZ=380;convoySpeed=3.2}
 if(s==='B'){leadZ=GZ+16+150;convoySpeed=3.5}
 if(s==='C'){leadZ=GZ+16;convoySpeed=0}
 convoyPositions();
 for(const c of carriages)c.group.updateMatrixWorld(true);
 renderer.shadowMap.needsUpdate=true;
}
function simulate(dt){
 simT+=dt;stageT+=dt;
 if(stage==='A'){leadZ-=convoySpeed*dt}
 if(stage==='B'){
  // Chạy đều rồi giảm tốc, dừng ở mép sân tập trung.
  const remain=leadZ-(GZ+16);
  const target=remain>8?3.5:Math.sqrt(Math.max(0,remain)*1.53);
  convoySpeed=lerp(convoySpeed,target,1-Math.exp(-dt*3));
  leadZ=Math.max(GZ+16,leadZ-convoySpeed*dt);
  if(remain<.02)convoySpeed=0;
 }
 if(stage==='C'||stage==='M')convoySpeed=0;
 convoyPositions();
 for(const c of carriages){animateCarriage(c,dt,convoySpeed,simT,{rough:stage==='A'?1.3:.6})}
 A.setTravel(convoySpeed,{vol:stage==='M'?0:1,stone:stage!=='A'});
 animateFlags(simT);
 for(const a of Object.values(actors))if(!(mode==='free'&&a.isHero))tickActor(a,dt);
 for(const c of carriages)c.group.updateMatrixWorld(true);
}
function simulateLight(dt){
 simT+=dt;animateFlags(simT);
}

// ---------- Kịch bản: thoại ----------
const NAMES={tu:'Thẩm Tú Nhi',clan:'Cẩm Lan',mama:'Tôn ma ma',clerk:'Thái giám',tran:'Lý Ngọc Trân',inner:'Cẩm Lan (nội tâm)'};
function say(who,text,kind=''){UI.subtitle(NAMES[who]||who,text,who==='inner'?'inner':kind)}

// ---------- Camera ----------
const cam={pos:V(),look:V(),fov:47,shake:0};
function setCam(pos,look,fov=47,shake=0){cam.pos.copy(pos);cam.look.copy(look);cam.fov=fov;cam.shake=shake}
function applyCam(){
 const s=cam.shake;
 camera.position.copy(cam.pos);
 if(s){camera.position.x+=Math.sin(simT*23)*.006*s;camera.position.y+=Math.sin(simT*31+1)*.006*s}
 if(camera.near!==.05){camera.near=.05;camera.updateProjectionMatrix()}
 if(Math.abs(camera.fov-cam.fov)>.01){camera.fov=cam.fov;camera.updateProjectionMatrix()}
 camera.lookAt(cam.look);
}

// ---------- Trạng thái nhân vật trong xe ----------
function seatInCarriage(){
 const c=actors.clan,t=actors.tu;
 lead.cabin.add(heroParts().rig);setHeroVisible(true);
 hero.sit=1;hero.kneel=hero.kneelTarget=0;hero.bow=-1;
 setPos(c,.6,1.0,-.5,-Math.PI/2);c.sit=1;c.pose={head:[.35,.25,.42],l:[-.38,-.12,-1.08],r:[-.38,.12,-1.08]};
 lead.cabin.add(t.root);setPos(t,.6,1.0,.34,-Math.PI/2);t.sit=1;t.fig.sit=1;
 const [g0,g1]=girls;
 for(const [g,z] of [[g0,-.5],[g1,.34]]){lead.cabin.add(g.root);setPos(g,-.6,1.0,z,Math.PI/2);g.sitLower=.46}
 const m=actors.mama;lead.cabin.add(m.root);setPos(m,.36,1.02,-1.62,Math.PI);m.sit=1;m.fig.sit=1;
 lead.curtains.front.mesh.scale.x=.55;
}
function toWorld(a,x,y,z,yaw){scene.add(a.isHero?heroParts().rig:a.root);setPos(a,x,y,z,yaw)}

// ---------- Các shot ----------
const B=[];
const beat=(name,dur,o)=>B.push({name,dur,...o});
const pick=(arr)=>arr;

beat('black',6,{enter(){setStage('A');seatInCarriage();UI.fade(1,0);A.startTravel();A.startAmbience();A.setAmbience(.06,true)},
 update(t){if(t>3.2&&t<5.8)say('tu','…Cẩm Lan tỷ tỷ… tỷ tỷ…','far');else UI.clearSubtitle();
  const w=lead.wheels[1].getWorldPosition(V());setCam(V(w.x+1.0,.3,w.z-1.6),w)}});
beat('wheel',7,{enter(){UI.fade(0,2.5)},update(t){const w=lead.wheels[1].getWorldPosition(V());setCam(V(w.x+.95,.28+t*.01,w.z-1.5+t*.08),V(w.x,.45,w.z),40)}});
beat('convoy',8,{enter(){A.playMusic('calm')},update(t){setCam(V(SUB_X+13-t*.15,2.4+t*.08,leadZ+8-t*1.2),V(SUB_X,1.7,leadZ+6),42)}});
beat('pov',10,{enter(){setHeroVisible(false);UI.canvasFilter('blur(10px)');UI.fade(.7,.01);actors.tu.arms={r:[-.95,-.55,-.35,1]};actors.tu.head=[.15,-.5,-.1];actors.tu.lean=.12},
 update(t){
  const b=clamp(10*(1-(t-1.5)/5),0,10);UI.canvasFilter(b>.05?`blur(${b.toFixed(2)}px)`:'');
  UI.fade(t<1.2?.7:t<1.6?.25:t<1.9?.65:t<2.6?.1:0,.15);
  actors.tu.arms={r:[-.95+Math.sin(t*14)*.08*(t<4),-.55,-.35,t<5?1:0]};
  if(t>4.5){actors.clan.pose={head:[0,.55,0]}}
  if(t>.5&&t<5)say('tu','Cẩm Lan tỷ tỷ! Tỷ tỷ, mau tỉnh lại!');
  else if(t>6.2)say('clan','Đây… đây là đâu?');else UI.clearSubtitle();
  const e=headPos(actors.clan),f=headPos(actors.tu);e.y-=.02;
  setCam(e,f.clone().add(V(0,-.04+Math.sin(t*.8)*.02,0)),50,1.2);
 },exit(){setHeroVisible(true);UI.canvasFilter('');UI.fade(0,.2)}});
beat('twoShot',7,{enter(){actors.tu.arms=null;actors.tu.lean=0;actors.tu.head=[0,-.6,0];actors.clan.pose={head:[0,.5,0]}},
 update(t){if(t>.3)say('tu','Tỷ ngủ đến hồ đồ rồi sao? Chúng ta đang trên đường vào kinh thành đấy.');
  const a=headPos(actors.clan),b=headPos(actors.tu),m=a.clone().lerp(b,.5);m.y-=.15;
  setCam(cab(-.42,2.0,1.0),m,48,1)}});
beat('hands',7,{enter(){actors.clan.pose={head:[.7,0,0],l:[-1.05,-.32,-1.0],r:[-1.05,.32,-1.0]};actors.tu.head=[.1,-.4,0]},
 update(t){
  if(t>3){actors.clan.pose={head:[.55,-.25,.05],l:[-.5,-.1,-.6],r:[-.15,-.25,-.25]}}
  if(t>3.4)say('clan','Điện thoại của tôi đâu rồi?');else UI.clearSubtitle();
  setCam(cab(.02,2.28,-.66),cab(.44,1.52,-.46),46,1)}});
beat('tuCU',4,{enter(){actors.tu.head=[0,-.75,.18];actors.clan.pose={head:[0,.6,0]}},
 update(t){if(t>.2)say('tu','Điện… thoại? Tỷ đang nói gì vậy?');
  const f=headPos(actors.tu);setCam(cab(-.15,2.18,-.15),f,38,1)}});
beat('clanCU',8,{enter(){actors.clan.pose={head:[-.05,0,0],l:[-.7,-.1,-.8],r:[-2.55,-.45,-1.6]};actors.tu.head=[0,-.6,0]},
 update(t){
  if(t>3.4)actors.clan.pose={head:[0,Math.sin((t-3.4)*1.6)*.55,0],l:[-.7,-.1,-.8],r:[-.75,.1,-.8]};
  if(t>.8)say('inner','Xe ngựa? Cổ phục? Rõ ràng tối qua mình còn đang đọc tiểu thuyết ở nhà…');
  const h=headPos(actors.clan);setCam(cab(-.15,2.15,-.45),h.clone().add(V(0,-.02,0)),36,1)}});
beat('front',6,{enter(){actors.clan.pose={head:[0,-.7,0]};actors.tu.head=[0,-.75,0];A.setMusic(.3)},
 update(t){if(t>.4)say('mama','Các ngươi giữ yên lặng! Sắp đến nơi rồi. Kẻ nào làm mất thể diện trong ngày tuyển cung nữ thì đừng trách ta không khách khí!');
  actors.mama.head=[0,Math.sin(t*2)*.2+.4,0];
  setCam(cab(-.05,2.1,1.0),cab(0,2.08,-1.6),50,1)},exit(){A.setMusic(.55)}});
beat('ots1',10,{enter(){actors.clan.pose={head:[0,.75,0]};actors.tu.head=[0,-.75,0]},
 update(t){if(t>.3&&t<4)say('clan','Tuyển cung nữ? Chúng ta sắp vào hoàng cung?');else if(t>4.2)say('tu','Đúng vậy. Tỷ mong ngày này suốt mấy tháng rồi, chẳng lẽ quên hết sao?');
  const h=headPos(actors.clan),f=headPos(actors.tu);setCam(h.clone().add(V(-.3,.15,-.52)),f,45,1)}});
beat('ots2',5,{update(t){if(t>.3)say('clan','Vậy… hoàng đế hiện tại là ai?');
  const h=headPos(actors.clan),f=headPos(actors.tu);setCam(f.clone().add(V(-.3,.15,.52)),h,45,1)}});
beat('shh',7,{enter(){actors.tu.arms={r:[-1.25,.38,-2.15,1]};actors.tu.lean=.12;actors.tu.head=[.08,-.7,0]},
 update(t){if(t>.4&&t<3.2)say('tu','Suỵt! Tỷ đừng tùy tiện hỏi như thế.');else if(t>3.2)say('tu','Bây giờ là năm Càn Long thứ mười hai.','far');
  if(t>3)actors.tu.arms={r:[-.72,.14,-.75,1]};
  const f=headPos(actors.tu);setCam(cab(-.1,2.12,.05),f,36,1)},exit(){actors.tu.arms=null;actors.tu.lean=0}});
beat('dolly',8,{enter(){A.stopMusic();A.setTravel(1,{vol:.4});A.heartbeat(true,1.15);actors.clan.pose={head:[0,.1,0]}},
 update(t){if(t>1)say('inner','Càn Long? Nhà Thanh? Không thể nào…');
  const h=headPos(actors.clan),d=lerp(1.25,.24,ease(t/8));
  setCam(h.clone().add(V(-d,-.01,0)),h.clone().add(V(0,-.015,0)),lerp(40,28,t/8),.6);
  if(t>7.2)UI.fade(1,.6)}});
// ---- Cảnh 02 ----
beat('wheel2',6,{enter(){setStage('B');A.heartbeat(false);UI.fade(0,.4);UI.clearSubtitle();A.playMusic('calm');A.setAmbience(.04,true)},
 update(t){const w=lead.wheels[1].getWorldPosition(V());setCam(V(w.x+.95,.28,w.z-1.5+t*.05),V(w.x,.45,w.z),40)}});
beat('window',9,{enter(){actors.clan.pose={head:[0,0,0],r:[-2.2,.3,-1.0]};actors.clan.faceYaw=Math.PI/2;actors.tu.head=[.05,-.2,0];A.sfx('curtain')},
 update(t){
  const cr=lead.curtains.right;cr.lifted=true;cr.mesh.scale.y=lerp(1,.18,ease((t-.4)/1.4));cr.group.rotation.x=0;
  if(t>2.2&&t<4)actors.clan.pose={head:[.35,0,0],l:[-.95,-.25,-1.1],r:[-.95,.25,-1.1]};
  else if(t>=4)actors.clan.pose={head:[-.15,0,0],l:[-.6,-.12,-.8],r:[-.6,.12,-.8]};
  if(t>4.6)say('inner','Đau… không phải mơ. Những thứ này đều là thật sao?');else UI.clearSubtitle();
  const h=headPos(actors.clan);setCam(h.clone().add(V(-.45,.12,-.42)),cab(3.5,2.5,.2),48,.7)}});
beat('povWin',8,{update(t){setCam(cab(.97,2.05,-.4),cab(7,2.9,-1.6),55,.8)}});
beat('low',7,{enter(){A.playMusic('title')},update(t){if(t>.8)say('inner','Chẳng lẽ mình thực sự đã xuyên không?');
  setCam(V(-380.4,.3,GZ+64-t*1.4),V(-377,17,GZ+30),58)}});
beat('crane',15,{enter(){UI.clearSubtitle()},update(t){
  const k=ease(t/15);
  setCam(V(lerp(-460,-575,k),lerp(2.6,165,k),lerp(leadZ+6,GZ+240,k)),V(lerp(ROAD_X,-120,k),lerp(1.6,6,k),lerp(leadZ,170,k)),50);
  UI.titleCard(t>5.5&&t<12.5)}});
// ---- Cảnh 03 ----
beat('stop',7,{enter(){UI.titleCard(false);A.playMusic('calm');A.setMusic(.35)},update(t){
  setCam(V(-467,3.2,GZ+4),V(ROAD_X,1.4,leadZ+5),46);
  if(convoySpeed<.05){for(const c of carriages)c.step.visible=true;
   if(!this.done){this.done=true;renderer.shadowMap.needsUpdate=true;A.stopTravel()}}}});
beat('mama',8,{enter(){
  leadZ=GZ+16;convoySpeed=0;convoyPositions();
  const m=actors.mama;toWorld(m,-455.4,0,GZ+20.5,Math.PI/2);m.sit=0;m.head=null;
  m.arms={r:[-1.25,.25,-.5,1]};m.faceYaw=Math.PI*.62;
  // Tú Nhi và các thiếu nữ khác xuống xe, đi về hàng.
  const t=actors.tu;toWorld(t,ROAD_X,0,GZ+19.2,Math.PI);t.sit=0;t.head=null;t.fig.sit=0;
  goTo(t,[V(-455,0,GZ+17),V(-468.8,0,GZ+3),V(-468.8,0,GZ-1.6)],1.5,()=>{t.faceYaw=Math.PI});
  linePositions().forEach((p,i)=>{
   const g=girls[i];if(!g)return;g.sitLower=0;
   const c=carriages[Math.min(2,1+(i%2))],from=i<2?V(ROAD_X,0,GZ+19.4):V(ROAD_X-.4,0,c.group.position.z+2);
   toWorld(g,from.x,0,from.z+i*.3,Math.PI);
   setTimeout(()=>goTo(g,[V(-456,0,from.z-2),p],1.4,()=>{g.faceYaw=Math.PI}),i*250);
  });
 },update(t){
  if(t>.5)say('mama','Đến nơi rồi! Tất cả xuống xe, xếp thành hai hàng. Không được nói chuyện, không được nhìn ngang ngó dọc!');
  if(t>2)actors.mama.arms=null;
  const h=headPos(actors.mama);setCam(V(-453.3,1.62,GZ+22.2),h,40)}});
beat('shoe',7,{enter(){
  const c=actors.clan;toWorld(c,ROAD_X,1.0,lead.group.position.z+1.0,0);c.sit=0;hero.sit=0;
  c.pose={head:[.3,0,0],l:[-.35,-.32,-.55],r:[-.35,.32,-.55]};leaves&&(this.gust=true);
 },update(t){
  const c=actors.clan,z0=lead.group.position.z;
  if(t>1.8&&!c.path&&!this.went){this.went=true;c.pose=null;goTo(c,[V(ROAD_X,1.0,z0+1.45),V(ROAD_X,.34,z0+1.8),V(ROAD_X,0,z0+2.4)],.65);setTimeout(()=>A.sfx('step'),900);setTimeout(()=>A.sfx('step'),1700)}
  setCam(V(ROAD_X+1.0,.55,z0+2.9),V(ROAD_X,.35,z0+1.85),44)}});
beat('orbit',9,{enter(){const c=actors.clan;c.faceYaw=-Math.PI*.6;c.pose={head:[-.25,.3,0]}},
 update(t){
  const c=actors.clan,p=c.pos,a=lerp(-2.4,-1.0,ease(t/9)),r=1.7,k=ease(t/4);
  if(t>1.5&&t<4.2)say('tu','Cẩm Lan tỷ tỷ, nhanh lên!');
  else if(t>4.6){say('mama','Cô gái áo xanh kia! Ngươi còn đứng đó làm gì?');c.pose={head:[0,.9,0],l:[-.3,-.2,-.4],r:[-.3,.2,-.4]}}
  else UI.clearSubtitle();
  setCam(V(p.x+Math.sin(a)*r,lerp(.3,1.6,k),p.z+Math.cos(a)*r),V(p.x,lerp(.25,1.62,k),p.z),44)}});
// Đoạn tự do 1: người chơi tự đi tới bàn kiểm danh; lại gần thái giám thì vào cảnh 04.
beat('freeLine',Infinity,{free:'line'});
// ---- Cảnh 04 ----
beat('lineWide',8,{enter(){
  UI.fade(1,0);setTimeout(()=>UI.fade(0,.9),120);
  const c=actors.clan;setPos(c,-471.2,0,GZ-1.6,Math.PI);
  const t=actors.tu;setPos(t,-468.8,0,GZ-1.6,Math.PI);
  linePositions().forEach((p,i)=>{if(girls[i])setPos(girls[i],p.x,0,p.z,Math.PI)});
  setPos(actors.mama,-465.6,0,GZ-7,-Math.PI/2);actors.mama.arms=null;
  actors.clerk.arms={l:[-.9,-.32,-1.3,1],r:[-.9,.32,-1.3,1]};actors.clerk.head=[.35,0,0];
  UI.clearSubtitle();A.setMusic(.25);
 },update(t){const k=ease(t/8);setCam(V(lerp(-479,-475.5,k),lerp(3.2,2.1,k),lerp(GZ+7,GZ-3,k)),V(-470,1.1,GZ-11.5),46)}});
beat('book',8,{enter(){A.sfx('brush')},update(t){
  if(t<3){setCam(V(-470.05,1.32,GZ-11.05),V(-470.1,.84,GZ-11.45),40)}
  else{const h=headPos(actors.clerk);setCam(V(-468.6,1.72,GZ-10.4),h,38);actors.clerk.head=[.05,0,0]}
  if(t>3.3&&t<5.2)say('clerk','Thẩm Tú Nhi!');else if(t>5.3)say('tu','Có!');else UI.clearSubtitle()}});
beat('roll',16,{update(t){
  const clerkShot=()=>{const h=headPos(actors.clerk);setCam(V(-468.9,1.7,GZ-10.2),h,38)};
  if(t<5){clerkShot();if(t>.3&&t<1.8)say('clerk','Lý Ngọc Trân!');else if(t>=1.8&&t<3.4)say('tran','Có!');else if(t>3.5)say('clerk','Ô Nhã Cẩm Lan!')}
  else if(t<9.5){
   const h=headPos(actors.clan);setCam(V(-471.3,1.62,GZ-3.5),h,36);
   if(t>5.8&&t<8){say('tu','Tỷ tỷ, đến lượt tỷ rồi!','far');actors.tu.arms={l:[-.55,.65,-.35,1]};actors.tu.head=[0,.6,0]}
   if(t>=8){say('clan','Có… có mặt!');actors.tu.arms=null;actors.tu.head=null;
    if(!this.walked){this.walked=true;const c=actors.clan;goTo(c,[V(-471.2,0,GZ-3.5),V(-470,0,GZ-9.7)],1.2,()=>{c.faceYaw=Math.PI})}}
  }else{
   clerkShot();if(t>10.2)say('clerk','Ô Nhã Cẩm Lan, mười bảy tuổi. Danh sách không sai. Sang bên kia chờ.');
   if(t>14.3&&!this.wait){this.wait=true;const c=actors.clan;goTo(c,[V(-466,0,GZ-9.6),V(-463.4,0,GZ-9.8)],1.1,()=>{c.faceYaw=-Math.PI/2})}
  }}});
beat('montage',16,{enter(){
  setStage('M');UI.canvasFilter('grayscale(.55) sepia(.3) hue-rotate(170deg) saturate(.75) brightness(.62) contrast(1.08)');
  UI.vignette(true);UI.snow(true);A.playMusic('tense');A.setAmbience(.12,false);A.setMusic(.35);
 },update(t){
  const S=montage.shots,i=Math.min(3,Math.floor(t/4)),u=(t%4)/4;
  const [p,l]=S[['corridor','shoe','curtain','door'][i]];
  const pos=p.clone(),look=l.clone();
  if(i===0)pos.z-=u*3;if(i===1)pos.lerp(l,u*.2);
  montage.flame.scale.y=1+Math.sin(t*23)*.2;montage.light.intensity=6+Math.sin(t*17)*1.2;
  if(i===3)montage.doors.set(clamp(1-u*1.4,0,1));else montage.doors.set(1);
  setCam(pos,look,i===1?32:46);
  if(t>.3&&t<7.6)say('inner','Ô Nhã Cẩm Lan… Không sai được. Đây chính là cuốn tiểu thuyết mình đọc tối qua.');
  else if(t>=7.8&&t<14.5)say('inner','Nhưng tại sao lại là nàng ấy? Trong sách, nàng ấy thậm chí còn không sống nổi qua mùa đông năm nay!');
  else UI.clearSubtitle();
  if(t>14.6){A.stopMusic();A.setAmbience(0,false)}
 },exit(){setStage('C');UI.canvasFilter('');UI.vignette(false);UI.snow(false);A.setAmbience(.05,true)}});
beat('pale',7,{enter(){A.heartbeat(true,1.4);const c=actors.clan;setPos(c,-463.4,0,GZ-9.8,-Math.PI/2);c.pose={head:[.1,0,0],l:[-.45,-.3,-.6],r:[-.45,.3,-.6]}},
 update(t){const h=headPos(actors.clan);setCam(h.clone().add(V(-.75,-.02,.08)),h,34);
  UI.canvasFilter(t>3.8?`blur(${clamp((t-3.8)*2,0,2.5).toFixed(2)}px)`:'');
  if(t>4.5){say('mama','Tất cả đi theo ta!');A.heartbeat(false)}}
 ,exit(){UI.canvasFilter('')}});
// ---- Cảnh 05 ----
beat('gateOpen',9,{enter(){
  UI.clearSubtitle();A.playMusic('resolve');A.setMusic(.4);
  // Đoàn người đã sang cầu, dừng trước cổng; Cẩm Lan đi cuối.
  const m=actors.mama;setPos(m,-389,0,GZ,Math.PI/2);m.arms=null;
  const files=[actors.tu,...girls];
  files.forEach((g,i)=>setPos(g,-391-Math.floor(i/2)*1.4,0,GZ+(i%2?-.8:.8),Math.PI/2));
  setPos(actors.clan,-391-5*1.4-.4,0,GZ+.8,Math.PI/2);actors.clan.pose=null;
  for(const [k,s] of [[0,-1],[1,1]]){const g=actors['guard'+k];setPos(g,-384.6,0,GZ+s*2.2,Math.PI/2);g.arms={l:[-1.45,-.15,-.15,1],r:[-1.45,.15,-.15,1]};g.head=[0,0,0]}
  setTimeout(()=>A.sfx('creak'),900);
 },update(t){
  const k=ease((t-1)/6);doors.set(k*.95);
  for(const [kk,s] of [[0,-1],[1,1]]){const g=actors['guard'+kk];g.pos.x=-384.6+k*1.6}
  setCam(V(-388.6,.32,GZ+3.2),V(-382.5,4.6,GZ),58)}});
// Đoạn tự do 2: người chơi tự bước qua cánh cửa định mệnh.
beat('freeGate',Infinity,{free:'gate'});
beat('close',10,{enter(){
  const c=actors.clan;c.pose={head:[.05,0,0]};goTo(c,[V(-368,0,c.pos.z*.0+GZ+.3)],1.2);
  birds.group.visible=false;
  for(const k of [0,1]){const g=actors['guard'+k];g.faceYaw=-Math.PI/2;g.arms={l:[-1.3,-.1,-.2,1],r:[-1.3,.1,-.2,1]}}
  setTimeout(()=>A.sfx('creak'),2600);
 },update(t){
  if(t>.6&&t<6)say('inner','Mà là mình.');else UI.clearSubtitle();
  if(t<.1)setCam(V(-414,1.6,GZ+.6),V(-382,3.6,GZ),44);
  const k=ease((t-2.8)/5);doors.set(.95*(1-k));
  if(t>7.9&&!this.thud){this.thud=true;A.sfx('thud');UI.fade(1,1.2);A.stopMusic();A.finalNote()}
  setCam(V(-414,1.6,GZ+.6),V(-382,3.6,GZ),44)}});
beat('toPlay',2.5,{enter(){UI.clearSubtitle()},update(){}});

function linePositions(){
 const out=[];
 // Hai hàng, mỗi hàng 5 người; chừa chỗ cuối hàng cho Tú Nhi và Cẩm Lan.
 for(let r=0;r<4;r++)for(const x of [-468.8,-471.2])out.push(V(x,0,GZ-8+r*1.6));
 return out;
}

// ---------- Điều phối ----------
let bi=0,bt=0;
function enterBeat(i){
 const b=B[i];if(!b)return;
 b.done=b.walked=b.wait=b.thud=b.went=false;
 if(b.free){enterFree(b.free);return}
 b.enter?.call(b);
}
function nextBeat(){bi++;bt=0;if(bi>=B.length)startGameplay();else enterBeat(bi)}

// ---------- Đoạn tự do giữa cinematic ----------
// Người chơi điều khiển Cẩm Lan (góc thứ ba). Các NPC vẫn diễn theo kịch bản.
const free={kind:null,t:0,flags:{}};
const CLERK=V();
function enterFree(kind){
 mode='free';free.kind=kind;free.t=0;free.flags={};CLERK.set(-470,0,GZ-12.6);
 UI.cinematic(false);UI.clearSubtitle();UI.fade(0,.5);
 const c=actors.clan;c.path=null;c.pose=null;hero.pose=null;hero.sit=hero.sitTarget=0;
 scene.add(heroParts().rig);setHeroVisible(true);
 camera.fov=47;camera.updateProjectionMatrix();
 if(kind==='line'){
  api.placePlayer(c.pos.x,c.pos.z,c.yaw,c.yaw+Math.PI);
  UI.quest('Tuyển cung nữ',[{text:'Nhập hàng và đến bàn kiểm danh.',state:'on'}]);
  A.setMusic(.3);
 }
 if(kind==='gate'){
  // Cả đoàn đi qua cổng và chờ phía trong; Cẩm Lan đứng cuối đoàn, trước cầu.
  [actors.mama,actors.tu,...girls].forEach((a,i)=>goTo(a,[V(-360+(i?-1.6-Math.floor((i-1)/2)*1.3:0),0,GZ+(i?(i%2?.8:-.8):0))],1.3,()=>{a.faceYaw=-Math.PI/2}));
  for(const k of [0,1]){const g=actors['guard'+k];g.arms=null;goTo(g,[V(-379.5,0,GZ+(k?3.8:-3.8))],1,()=>{g.faceYaw=-Math.PI/2})}
  api.placePlayer(-400,GZ+.6,Math.PI/2,-Math.PI/2);
  UI.quest('Cánh cửa định mệnh',[{text:'Bước qua cổng cung.',state:'on'}]);
 }
 UI.prompt('<kbd>W A S D</kbd>Di chuyển · Kéo chuột xoay camera');
 setTimeout(()=>{if(mode==='free')UI.prompt(null)},4500);
}
function endFree(){
 const P=api.player(),c=actors.clan;
 setPos(c,P.x,P.y,P.z,hero.yaw);c.pose=null;
 UI.prompt(null);UI.quest(null);UI.clearSubtitle();
 api.release();setHeroVisible(true);
 mode='cine';UI.cinematic(true);
 nextBeat();
}
// Mặt đất đi được bên ngoài tường thành trong các đoạn tự do (sân tập trung, cầu, lối cổng).
export function storyFloor(x,z){
 if(mode!=='free')return undefined;
 if(x>-369)return undefined;
 const yard=x>-488&&x<-446&&z>GZ-16&&z<GZ+24;
 if(free.kind==='line'){
  if(!yard)return null;
  if(Math.abs(x+470)<1.05&&Math.abs(z-(GZ-11.5))<.6)return null;
  if(Math.hypot(x-CLERK.x,z-CLERK.z)<.45)return null;
  return 0;
 }
 const bridge=x>=-446&&x<-393&&Math.abs(z-GZ)<7.3;
 const gate=x>=-393.5&&x<=-369&&Math.abs(z-GZ)<4.3;
 if(gate&&x<-382.3&&doors.open<.6)return null;
 return yard||bridge||gate?0:null;
}
function tickFree(dt){
 free.t+=dt;
 simulate(dt);
 leaves.mesh.visible=true;
 leaves.update(dt,simT,camera.position.clone().setY(0),.8);
 const P=api.player();
 if(free.kind==='line'){
  // Nhắc khéo nếu người chơi đứng yên lâu.
  if(free.t>18&&!free.flags.nag){free.flags.nag=true;say('mama','Còn không mau đến bàn kiểm danh!');setTimeout(()=>{if(mode==='free')UI.clearSubtitle()},3000)}
  if(Math.hypot(P.x-CLERK.x,P.z-CLERK.z)<3.2)endFree();
 }else if(free.kind==='gate'){
  if(P.x>-410&&!free.flags.l1){free.flags.l1=true;say('inner','Nếu tất cả những gì được viết trong cuốn sách đều trở thành sự thật… thì mình chỉ còn vài tháng để sống.')}
  if(P.x>-398&&!free.flags.birds){free.flags.birds=true;free.flags.bt=0;birds.group.visible=true;A.sfx('flutter')}
  if(free.flags.birds){free.flags.bt+=dt;birds.update(free.flags.bt,V(P.x-40,16,GZ-30),V(.25,.05,1).normalize());if(free.flags.bt>14)birds.group.visible=false}
  if(P.x>-392&&!free.flags.l2){free.flags.l2=true;say('inner','Nhưng lần này, người quyết định số phận của Ô Nhã Cẩm Lan sẽ không phải là tác giả.')}
  if(P.x>-378.5)endFree();
 }
}
export function updateStory(dt){
 A.tickAudio();
 if(mode==='cine'){
  const b=B[bi];
  bt+=dt;
  simulate(dt);
  b.update?.call(b,bt,dt);
  leaves.mesh.visible=stage!=='M';
  leaves.update(dt,simT,camera.position.clone().setY(0),stage==='A'?1.4:.8);
  applyCam();
  if(bt>=b.dur){b.exit?.call(b);nextBeat()}
 }else if(mode==='catch')tickCatch(dt);
 else if(mode==='free')tickFree(dt);
 else if(mode==='play')tickGameplay(dt);
}
// Sương mỏng ở đường ngoại ô: gọi sau khi hệ thời tiết cập nhật sương.
export function storyFog(){
 if(mode==='cine'&&stage==='A'&&scene.fog){scene.fog.near=18;scene.fog.far=210}
}

export function startChapter1(gameApi){
 api=gameApi;
 UI.buildUI();
 if(mode!=='idle')exitStory();
 inputLocked=false;UI.quest(null);UI.prompt(null);
 A.initAudio();
 UI.fade(1,0);UI.cinematic(true);
 mode='loading';
 // Bối cảnh: buổi sáng mùa thu, năm Càn Long thứ 12 (1747), trời quang.
 seekGameTime(Date.UTC(1747,9,12,8,15));setWeather('clear',true);
 api.prepare();
 resetProfile();
 catchS.on=false;
 setTimeout(()=>{
  build();
  resetActors();
  mode='cine';bi=0;bt=0;simT=0;enterBeat(0);
 },60);
}
function resetActors(){
 doors.set(0);UI.titleCard(false);
 for(const c of carriages){c.step.visible=false;const cr=c.curtains.right;cr.lifted=false;cr.mesh.scale.y=1}
 for(const k of ['guard0','guard1']){const g=actors[k];setPos(g,-385.4,0,GZ+(k==='guard0'?-5.4:5.4),Math.PI/2);g.arms=null}
 setPos(actors.clerk,-470,0,GZ-12.6,0);
 girls.slice(2).forEach((g,i)=>setPos(g,-1000,-50,0));
 q.stage='none';
}
export function skipCinematic(){skip()}
// Về chế độ tham quan: dừng cốt truyện, dọn giao diện.
export function exitStory(){
 if(mode==='idle')return;
 const b=B[bi];if(mode==='cine')b?.exit?.call(b);
 mode='idle';inputLocked=false;
 UI.cinematic(false);UI.clearSubtitle();UI.titleCard(false);UI.canvasFilter('');UI.vignette(false);UI.snow(false);UI.quest(null);UI.prompt(null);UI.fade(0,.4);
 A.heartbeat(false);A.stopTravel();A.stopMusic();A.setAmbience(0,false);
 if(selection)selection.ring.visible=selection.beam.visible=false;
}
function skip(){
 if(mode!=='cine')return;
 const b=B[bi];b?.exit?.call(b);
 UI.canvasFilter('');UI.vignette(false);UI.snow(false);UI.titleCard(false);
 A.heartbeat(false);A.stopTravel();A.stopMusic();
 setStage('C');leadZ=GZ+16;convoyPositions();for(const c of carriages)c.step.visible=true;
 startGameplay();
}

// ---------- Phần chơi ----------
const q={stage:'none',path:null,lens:null,total:0,s:0,talkDone:false,lastNag:0,arrivedMsg:false,choice:-1};
// Khu tuyển chọn: giữa sân hình chữ U phía tây (đã bỏ gian nhà chắn phía nam sân).
const TARGET=[-300.5,319];

function astar(sx,sz,tx,tz){
 const X0=-369,X1=-270,Z0=300,Z1=420,W=X1-X0+1,H=Z1-Z0+1;
 const ok=new Int8Array(W*H).fill(-1);
 const free=(i,j)=>{const k=j*W+i;if(ok[k]<0){const y=walkableFloor(X0+i,Z0+j,0);ok[k]=y!==null&&y<.35?1:0}return ok[k]===1};
 const idx=(i,j)=>j*W+i,si=Math.round(sx-X0),sj=Math.round(sz-Z0),ti=Math.round(tx-X0),tj=Math.round(tz-Z0);
 const g=new Float32Array(W*H).fill(1e9),came=new Int32Array(W*H).fill(-1),open=[[0,si,sj]];g[idx(si,sj)]=0;
 const h=(i,j)=>Math.hypot(i-ti,j-tj);
 while(open.length){
  let bi2=0;for(let k=1;k<open.length;k++)if(open[k][0]<open[bi2][0])bi2=k;
  const [,i,j]=open.splice(bi2,1)[0];
  if(i===ti&&j===tj)break;
  for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=W||nj>=H||!free(ni,nj))continue;
   if(di&&dj&&(!free(i+di,j)||!free(i,j+dj)))continue;
   const ng=g[idx(i,j)]+Math.hypot(di,dj);
   if(ng<g[idx(ni,nj)]){g[idx(ni,nj)]=ng;came[idx(ni,nj)]=idx(i,j);open.push([ng+h(ni,nj),ni,nj])}
  }
 }
 const pts=[];let k=idx(ti,tj);if(came[k]<0)return [V(sx,0,sz),V(tx,0,tz)];
 while(k>=0){pts.push(V(X0+k%W,0,Z0+Math.floor(k/W)));k=came[k]}
 pts.reverse();
 // Làm mượt: bỏ điểm thừa nếu đi thẳng được.
 const clear=(a,b)=>{const d=a.distanceTo(b);for(let s=0;s<=d;s+=.5){const x=lerp(a.x,b.x,s/d),z=lerp(a.z,b.z,s/d),y=walkableFloor(x,z,0);if(y===null||y>.35)return false}return true};
 const out=[pts[0]];let a=0;
 while(a<pts.length-1){let b=pts.length-1;while(b>a+1&&!clear(pts[a],pts[b]))b--;out.push(pts[b]);a=b}
 return out;
}
function pathPoint(s,out=V()){
 const P=q.path,L=q.lens;s=clamp(s,0,q.total);
 let i=1;while(i<L.length-1&&L[i]<s)i++;
 const t=(s-L[i-1])/Math.max(1e-6,L[i]-L[i-1]);out.copy(P[i-1]).lerp(P[i],clamp(t,0,1));return out;
}
function pathDir(s){const a=pathPoint(s-.5),b=pathPoint(s+.5);return b.sub(a).setY(0).normalize()}

function buildSelectionArea(){
 // Khu vực tuyển chọn cung nữ: bàn, thái giám, ma ma, cờ, các tú nữ đang chờ; vòng sáng đánh dấu.
 // Bàn kiểm tuyển đặt sâu trong sân (phía bắc), quay mặt ra lối vào phía nam.
 const [x,z]=TARGET;
 selProps.push(makeTable(x,z-9,0).group);
 const e=F({sex:'m',robe:'#3a2f4a',hem:'#22192e',hat:'eunuch',clothShoes:true,skin:'#e3bc9a'});place(e.root,x,0,z-10.2,0);selProps.push(e.root);
 const m=F({sex:'f',robe:'#3d4a5a',hem:'#2a3440',vest:'#232a33',vestTrim:'#9a8a5a',hairStyle:'bun',hair:'#3b3735',old:true,lowShoes:true,shoe:'#1d2228'});place(m.root,x+2.6,0,z-8.6,-.3);selProps.push(m.root);
 for(let i=0;i<8;i++){const g=F({sex:'f',robe:['#d6c9b2','#c2cdbd','#cbbfd2','#d9c4b6','#bfc6cf','#d0c0a8','#c6d0c0','#cfc4d8'][i],hem:'#ece6d6',hairStyle:'braid',lowShoes:true,shoe:'#4a4a5a'});place(g.root,x-5.4+(i%4)*1.1+(i>3?6.4:0),0,z-5.2+(i%2)*.3,Math.PI);selProps.push(g.root)}
 for(const s of [-1,1])selProps.push(makeBanner(x+s*6.5,z-9.5,'#c9302c',5.5));
 const ring=new THREE.Mesh(new THREE.RingGeometry(3.2,3.6,48).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#ffd27a',transparent:true,opacity:.6,depthWrite:false}));
 ring.position.set(x,.06,z);ring.visible=false;scene.add(ring);
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,14,12,1,true),new THREE.MeshBasicMaterial({color:'#ffe2a0',transparent:true,opacity:.25,depthWrite:false,side:THREE.DoubleSide}));
 beam.position.set(x,7,z);beam.visible=false;scene.add(beam);
 selection={ring,beam};
}

function questUI(){
 const st=q.stage,order=['follow','talk','reach','done'],at=order.indexOf(st);
 const it=(k,text)=>({text,state:order.indexOf(k)<at?'done':k===st?'on':''});
 UI.quest('Nhiệm vụ chính: Bước đầu nhập cung',[it('follow','Đi theo Tôn ma ma.'),it('talk','Trò chuyện với Tú Nhi.'),it('reach','Đến khu vực tuyển chọn cung nữ.')]);
}

function startGameplay(){
 mode='play';
 UI.cinematic(false);UI.clearSubtitle();UI.titleCard(false);UI.canvasFilter('');
 A.stopTravel();A.setAmbience(.04,true);A.playMusic('calm');A.setMusic(.3);
 doors.set(0);birds.group.visible=false;
 camera.fov=47;camera.updateProjectionMatrix();
 const start=V(-365,0,GZ+.2);
 // Đặt người chơi sau lưng đoàn, camera góc thứ ba.
 scene.add(heroParts().rig);hero.pose=null;hero.sit=hero.sitTarget=0;
 api.placePlayer(start.x,start.z,Math.PI/2,-Math.PI/2);
 actors.clan.path=null;
 // Đường đi của Tôn ma ma tới khu tuyển chọn.
 q.path=astar(-358,GZ,TARGET[0],TARGET[1]);
 for(const p of q.path)p.y=walkableFloor(p.x,p.z,0)??0;
 q.lens=[0];for(let i=1;i<q.path.length;i++)q.lens.push(q.lens[i-1]+q.path[i].distanceTo(q.path[i-1]));
 q.total=q.lens[q.lens.length-1];q.s=6;
 const m=actors.mama;m.path=null;m.arms=null;m.head=null;
 const all=[actors.tu,...girls];
 all.forEach((g,i)=>{g.path=null;g.head=null;g.arms=null;const p=pathPoint(Math.max(0,q.s-1.6-Math.floor(i/2)*1.3));setPos(g,p.x,p.y,p.z,Math.PI/2)});
 const p=pathPoint(q.s);setPos(m,p.x,p.y,p.z,Math.PI/2);
 setPos(actors.tu,-362.6,0,GZ+1.4,Math.PI/2);
 for(const k of [0,1]){const g=actors['guard'+k];setPos(g,-379.2,0,GZ+(k?2.4:-2.4),-Math.PI/2);g.arms=null}
 q.stage='follow';q.talkDone=false;q.arrivedMsg=false;questUI();
 UI.fade(0,1.6);
 setTimeout(()=>UI.toast('Nhiệm vụ mới: Bước đầu nhập cung',3.2),900);
 A.sfx('quest');
}

const tmp=V();
function tickGameplay(dt){
 simT+=dt;animateFlags(simT);
 leaves.mesh.visible=true;leaves.update(dt,simT,camera.position.clone().setY(0),.7);
 const P=api.player(),me=V(P.x,P.y,P.z);
 const m=actors.mama;
 // Tôn ma ma dẫn đường; chờ nếu người chơi tụt lại xa.
 const dist=me.distanceTo(m.pos);
 const pauseAt=q.stage==='talk'?q.total*.62:q.total-1.5;
 let speed=0;
 if(dist<13&&q.s<pauseAt)speed=1.25;
 if(dist>18&&simT-q.lastNag>9){q.lastNag=simT;say('mama','Còn đứng đó làm gì? Theo sát vào!');setTimeout(UI.clearSubtitle,2600)}
 q.s=Math.min(pauseAt,q.s+speed*dt);
 followPath(m,q.s,0,dt);
 // Các thiếu nữ đi thành hai hàng sau lưng ma ma.
 girls.forEach((g,i)=>followPath(g,Math.max(0,q.s-1.6-Math.floor(i/2)*1.3),(i%2?-.75:.75),dt));
 // Tú Nhi: đi cạnh người chơi cho tới khi trò chuyện xong.
 const t=actors.tu;
 if(!q.talkDone){
  const right=V(Math.cos(hero.yaw),0,-Math.sin(hero.yaw));
  const want=me.clone().addScaledVector(right,-1.1).addScaledVector(V(Math.sin(hero.yaw),0,Math.cos(hero.yaw)),-.4);
  const d=want.distanceTo(t.pos);
  if(d>.25){const step=Math.min(d,Math.min(3.4,d*1.8)*dt);t.pos.add(want.sub(t.pos).setY(0).normalize().multiplyScalar(step));t.pos.y=walkableFloor(t.pos.x,t.pos.z,t.pos.y)??t.pos.y;t.yaw=turn(t.yaw,hero.yaw,dt*5)}
  t.path=null;t.speed=lerp(t.speed,d>.3?Math.min(3.4,d*1.8):0,1-Math.exp(-dt*6));
  t.root.position.copy(t.pos);t.root.rotation.y=t.yaw;
  poseFigure(t.fig,dt,{speed:t.speed,head:q.stage==='talk'&&me.distanceTo(t.pos)<3?[0,0,0]:[0,.25,0]});
 }else followPath(t,Math.max(0,q.s-1.6-4*1.3),.75,dt);
 for(const k of ['mama','clerk','guard0','guard1'])if(k!=='mama'){tickActor(actors[k],dt)}
 // Đi quá xa phạm vi nhiệm vụ: thị vệ bắt về.
 if(q.stage!=='done'&&!UI.dialogueOpen()&&distToPath(me)>CATCH_RADIUS){startCatch(me);return}
 // Diễn tiến nhiệm vụ.
 if(q.stage==='follow'&&q.s>q.total*.35&&dist<9){
  q.stage='talk';questUI();UI.toast('Hoàn thành: Đi theo Tôn ma ma');A.sfx('ui');
  say('tu','Tỷ tỷ…','far');setTimeout(UI.clearSubtitle,2000);
 }
 if(q.stage==='talk'){
  const near=me.distanceTo(t.pos)<2.8;
  UI.prompt(near&&!UI.dialogueOpen()?'<kbd>F</kbd>Trò chuyện với Tú Nhi':null);
 }else UI.prompt(null);
 if(q.stage==='reach'){
  selection.ring.visible=selection.beam.visible=true;
  selection.ring.material.opacity=.45+Math.sin(simT*3)*.2;selection.ring.rotation.y+=dt*.4;
  if(Math.hypot(me.x-TARGET[0],me.z-TARGET[1])<4.2)finishChapter();
 }
}
function followPath(a,s,lat,dt){
 const p=pathPoint(s),d=pathDir(s);
 p.x+=-d.z*lat;p.z+=d.x*lat;
 const dd=Math.hypot(p.x-a.pos.x,p.z-a.pos.z);
 a.path=null;
 if(dd>.05){const st=Math.min(dd,Math.max(1.3,dd*1.5)*dt);a.pos.x+=(p.x-a.pos.x)/dd*st;a.pos.z+=(p.z-a.pos.z)/dd*st;a.yaw=turn(a.yaw,Math.atan2(p.x-a.pos.x,p.z-a.pos.z)||a.yaw,dt*6);a.pos.y=p.y}
 const sp=dd>.08?Math.min(1.6,Math.max(1.0,dd*1.5)):0;
 a.speed=lerp(a.speed,sp,1-Math.exp(-dt*6));
 if(a.fig.limbs){a.root.position.copy(a.pos);a.root.rotation.y=a.yaw;poseFigure(a.fig,dt,{speed:a.speed,head:a.head})}
 else{a.bob=(a.bob||0)+dt*a.speed*5.6;a.root.position.set(a.pos.x,a.pos.y+Math.abs(Math.cos(a.bob))*.02*Math.min(1,a.speed),a.pos.z);a.root.rotation.y=a.yaw}
}

// Hội thoại tương tác đầu tiên.
const CHOICES=[
 ['Ta không sao, chỉ hơi mệt một chút.','Vậy tỷ nhớ giữ sức nhé. Lát nữa vào điện, muội sẽ đứng cạnh tỷ.',()=>{addRelation('tu',2);UI.toast('Thiện cảm Tú Nhi +2')}],
 ['Muội có biết những chuyện xảy ra trong hậu cung không?','Muội chỉ nghe mẫu thân dặn: trong cung nói ít một câu là bớt một phần họa. Các nương nương tranh sủng, người chịu khổ trước tiên luôn là cung nữ chúng ta.',()=>{learn('Hậu cung: nói ít một câu là bớt một phần họa. Các nương nương tranh sủng, cung nữ là người chịu khổ trước.');UI.toast('Mở khóa: Thông tin hậu cung')}],
 ['Nếu không muốn làm cung nữ, liệu có thể rời khỏi đây không?','Tỷ tỷ nói khẽ thôi! Đã ghi tên vào sổ thì phải qua tuyển chọn. Người không được chọn mới được về nhà, còn người được chọn phải hầu hạ đến năm hai mươi lăm tuổi mới được xuất cung.',()=>{learn('Quy củ nhập cung: đã ghi tên thì phải qua tuyển chọn; người được chọn hầu hạ đến 25 tuổi mới được xuất cung.');UI.toast('Mở khóa: Quy củ nhập cung')}],
 ['Ta muốn yên tĩnh một lát.','…Vâng. Muội không làm phiền tỷ nữa.',()=>{}],
];
addEventListener('keydown',e=>{
 if(mode!=='play'||e.code!=='KeyF'||UI.dialogueOpen()||q.stage!=='talk')return;
 const P=api.player();if(Math.hypot(P.x-actors.tu.pos.x,P.z-actors.tu.pos.z)>2.8)return;
 e.preventDefault();inputLocked=true;UI.prompt(null);
 UI.dialogue({who:'Thẩm Tú Nhi',text:'Tỷ tỷ, sắc mặt tỷ không tốt lắm. Tỷ vẫn còn lo lắng chuyện tuyển chọn sao?',choices:CHOICES.map(c=>c[0]),onChoose:i=>{
  q.choice=i;A.sfx('ui');
  UI.dialogue({who:'Thẩm Tú Nhi',text:CHOICES[i][1],onContinue:()=>{
   CHOICES[i][2]();inputLocked=false;q.talkDone=true;q.stage='reach';questUI();
   setTimeout(()=>UI.toast('Hoàn thành: Trò chuyện với Tú Nhi'),2700);
  }});
 }});
});

function finishChapter(){
 q.stage='done';mode='done';UI.quest(null);UI.prompt(null);
 selection.ring.visible=selection.beam.visible=false;
 A.sfx('quest');A.playMusic('resolve');
 say('mama','Đến nơi rồi. Từng người đứng ngay ngắn, đợi gọi tên.');setTimeout(UI.clearSubtitle,3500);
 unlockSystems();
 try{localStorage.setItem('camlan.ch1',JSON.stringify({done:true,at:Date.now()}))}catch{}
 const R=profile.relations,rl=r=>`${r.v>=10?'Thiện cảm':r.v>0?'Quen biết':r.v<0?'Không hài lòng':'Xa lạ'} · ${r.v}`;
 const bar=v=>`<span class="meter" style="width:${v*12}px"></span>${v}`;
 setTimeout(()=>{
  if(mode!=='done'||q.stage!=='done')return;
  inputLocked=true;UI.reward(`<h3>Hoàn thành: Bước đầu nhập cung</h3>
  <p>Mở khóa hệ thống <b>thân phận</b>, <b>thuộc tính</b> và <b>quan hệ NPC</b>.</p>
  <table><tr><td>Thân phận</td><td>Tú nữ ứng tuyển · Ô Nhã Cẩm Lan, 17 tuổi</td></tr></table>
  <table><tr><td>Dung mạo</td><td>${bar(stat('beauty'))}</td></tr><tr><td>Tài trí</td><td>${bar(stat('wit'))}</td></tr><tr><td>Lễ nghi</td><td>${bar(stat('etiquette'))}</td></tr><tr><td>Tâm cơ</td><td>${bar(stat('cunning'))}</td></tr></table>
  <table><tr><td>Thẩm Tú Nhi</td><td>${rl(R.tu)}</td></tr><tr><td>Tôn ma ma</td><td>${rl(R.mama)}</td></tr><tr><td>Lý Ngọc Trân</td><td>${rl(R.tran)}</td></tr></table>
  ${profile.knowledge.length?`<p>Thông tin đã biết: ${profile.knowledge.length} mục (xem trong Hành trang · I)</p>`:''}
  <p>Mở <b>🎒 Hành trang</b> (phím I) để xem chỉ số, quan hệ và trang bị.</p>
  <p>Bạn có thể tự do di chuyển và khám phá Tử Cấm Thành.</p>`,()=>{
   inputLocked=false;UI.quest(null);UI.prompt(null);mode='done';
   hero.speedCap=0;
  })},2200);
}

// Gỡ lỗi: tua nhanh cinematic (giây) và xem shot hiện tại.
export function storyFastForward(sec){const n=Math.round(sec/.1);for(let i=0;i<n&&['cine','play','free','catch'].includes(mode);i++)updateStory(.1)}
export const storyBeat=()=>mode==='cine'?B[bi]?.name+' @'+bt.toFixed(1):mode==='free'?'free:'+free.kind:mode;
export const storyDebug=()=>({stage:q.stage,s:q.s,total:q.total,mama:actors.mama?.pos.toArray(),tu:actors.tu?.pos.toArray(),aff:profile.relations.tu.v,knowledge:profile.knowledge,catching:catchS.on});

// ---------- Cutscene: thị vệ bắt người chơi đi quá xa phạm vi nhiệm vụ ----------
const CATCH_RADIUS=22;
const catchS={on:false,t:0,phase:'',ret:V(),face:0,from:V(),lines:{}};
function distToPath(p){
 let best=Infinity;const P=q.path;if(!P)return 0;
 for(let i=1;i<P.length;i++){
  const a=P[i-1],b=P[i],dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz||1;
  const t=clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/l,0,1);
  best=Math.min(best,Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz));
 }
 return best;
}
function startCatch(me){
 catchS.on=true;catchS.t=0;catchS.phase='run';catchS.lines={};
 mode='catch';inputLocked=true;
 UI.prompt(null);UI.cinematic(true);
 api.release();setHeroVisible(true);scene.add(heroParts().rig);
 const c=actors.clan;setPos(c,me.x,me.y,me.z,hero.yaw);c.pose=null;c.sit=0;
 // Điểm trả về: trên tuyến đi, phía sau Tôn ma ma.
 catchS.ret.copy(pathPoint(Math.max(0,q.s-3)));catchS.face=Math.atan2(actors.mama.pos.x-catchS.ret.x,actors.mama.pos.z-catchS.ret.z);
 // Hai thị vệ chạy tới từ phía tuyến đi.
 const dir=V(catchS.ret.x-me.x,0,catchS.ret.z-me.z).normalize(),side=V(-dir.z,0,dir.x);
 catchS.dir=dir;catchS.side=side;
 for(const [k,s] of [['guard0',1],['guard1',-1]]){
  const g=actors[k];g.arms=null;g.head=null;
  const start=me.clone().addScaledVector(dir,9).addScaledVector(side,s*2.2);start.y=walkableFloor(start.x,start.z,0)??me.y;
  setPos(g,start.x,start.y,start.z,Math.atan2(-dir.x,-dir.z));
  goTo(g,[me.clone().addScaledVector(side,s*.55).addScaledVector(dir,.15)],4.2);
 }
 A.heartbeat(true,1.5);A.setMusic(.15);
 setTimeout(()=>{if(mode==='catch')say('guard','Đứng lại! Kẻ nào dám tự tiện đi lại trong cung?!')},300);
}
NAMES.guard='Thị vệ';
function tickCatch(dt){
 catchS.t+=dt;const t=catchS.t;
 simulateLight(dt);
 const c=actors.clan,g0=actors.guard0,g1=actors.guard1;
 for(const a of [c,g0,g1,actors.mama,actors.tu,...girls])tickActor(a,dt);
 const mid=c.pos.clone(),dir=catchS.dir,side=catchS.side;
 if(catchS.phase==='run'){
  // Cẩm Lan giật mình quay lại nhìn.
  c.faceYaw=Math.atan2(dir.x,dir.z);c.pose={head:[-.1,0,0],l:[-.9,-.4,-1.2],r:[-.9,.4,-1.2]};
  const cam=mid.clone().addScaledVector(dir,-3.2).addScaledVector(side,1.6);cam.y+=1.6;
  setCam(cam,mid.clone().add(V(0,1.3,0)).addScaledVector(dir,2),48);
  if(!g0.path&&!g1.path&&t>1){catchS.phase='grab';catchS.t=0;A.sfx('thud');A.heartbeat(false)}
 }else if(catchS.phase==='grab'){
  // Hai thị vệ giữ chặt hai tay.
  g0.faceYaw=g1.faceYaw=Math.atan2(dir.x,dir.z);
  g0.arms={r:[-1.15,.35,-.6,1],l:[-.4,0,-.4,1]};g1.arms={l:[-1.15,-.35,-.6,1],r:[-.4,0,-.4,1]};
  c.pose={head:[.25,Math.sin(t*6)*.25,0],l:[-.55,-.55,-.2],r:[-.55,.55,-.2]};
  if(t>.2&&!catchS.lines.a){catchS.lines.a=1;say('clan','Xin… xin đại nhân buông ra! Ta chỉ lạc đường thôi…')}
  if(t>3.2&&!catchS.lines.b){catchS.lines.b=1;say('guard','Tú nữ mới vào cung mà không biết quy củ! Về hàng ngay!')}
  const cam=mid.clone().addScaledVector(side,2.6).addScaledVector(dir,1.2);cam.y+=1.55;
  setCam(cam,mid.clone().add(V(0,1.35,0)),44);
  if(t>6){
   catchS.phase='drag';catchS.t=0;
   // Lôi về tuyến đi: đi một đoạn rồi chuyển cảnh.
   const tgt=mid.clone().addScaledVector(dir,Math.min(8,mid.distanceTo(catchS.ret)));
   const walk=(a,off)=>goTo(a,[tgt.clone().addScaledVector(side,off)],1.5);
   walk(c,0);walk(g0,.55);walk(g1,-.55);
  }
 }else if(catchS.phase==='drag'){
  c.pose={head:[.3,Math.sin(t*5)*.2,0],l:[-.55,-.55,-.2],r:[-.55,.55,-.2]};
  const cam=mid.clone().addScaledVector(dir,4.5).addScaledVector(side,1.2);cam.y+=1.9;
  setCam(cam,mid.clone().add(V(0,1.2,0)),46);
  if(t>2.8&&!catchS.lines.fade){catchS.lines.fade=1;UI.fade(1,.6)}
  if(t>3.6){
   // Đặt về điểm trả.
   const r=catchS.ret,f=catchS.face,fw=V(Math.sin(f),0,Math.cos(f)),sd=V(-fw.z,0,fw.x);
   setPos(c,r.x,r.y,r.z,f);c.pose={head:[.35,0,0],l:[-.45,-.3,-.6],r:[-.45,.3,-.6]};
   setPos(g0,r.x-fw.x*1.2+sd.x*1.1,r.y,r.z-fw.z*1.2+sd.z*1.1,f);setPos(g1,r.x-fw.x*1.2-sd.x*1.1,r.y,r.z-fw.z*1.2-sd.z*1.1,f);
   g0.arms=g1.arms=null;
   const m=actors.mama;m.faceYaw=f+Math.PI;
   catchS.phase='scold';catchS.t=0;UI.fade(0,.6);
   addRelation('mama',-2);profile.base.etiquette=Math.max(0,profile.base.etiquette-1);
  }
 }else if(catchS.phase==='scold'){
  const r=catchS.ret,m=actors.mama,h=headPos(c);
  setCam(h.clone().add(V(Math.sin(catchS.face+2.4)*2.2,.2,Math.cos(catchS.face+2.4)*2.2)),m.pos.clone().lerp(c.pos,.5).add(V(0,1.45,0)),44);
  if(t>.3&&!catchS.lines.m){catchS.lines.m=1;say('mama','Mới ngày đầu đã dám chạy lung tung! Còn có lần sau thì đừng trách ta vô tình!')}
  if(t>4.2&&!catchS.lines.toast){catchS.lines.toast=1;UI.toast('Tôn ma ma không hài lòng (−2) · Lễ nghi −1',3)}
  if(t>4.6){
   // Thị vệ rời đi, trả quyền điều khiển.
   for(const g of [actors.guard0,actors.guard1])goTo(g,[g.pos.clone().addScaledVector(V(Math.sin(catchS.face),0,Math.cos(catchS.face)),-12)],1.3);
   catchS.on=false;mode='play';inputLocked=false;c.pose=null;
   // Trả tay về tư thế thả lỏng (xóa tư thế do cutscene điều khiển).
   hero.pose=null;hero.sitTarget=0;hero.bow=-1;
   UI.clearSubtitle();UI.cinematic(false);A.setMusic(.3);
   api.placePlayer(r.x,r.z,catchS.face,catchS.face+Math.PI);
  }
 }
 applyCam();
}

// Điểm đánh dấu cho minimap.
export function storyMarkers(){
 const out=[];
 if(!['play','free','catch','done'].includes(mode)||!actors.mama)return out;
 const add=(a,color,label)=>{if(a&&a.pos.y>-10)out.push({x:a.pos.x,z:a.pos.z,color,label})};
 add(actors.mama,'#f08a2a','Tôn ma ma');add(actors.tu,'#ef7fa8','Thẩm Tú Nhi');
 if(mode==='free'&&free.kind==='line')out.push({x:CLERK.x,z:CLERK.z,kind:'target'});
 else if(mode==='free'&&free.kind==='gate')out.push({x:-376,z:GZ,kind:'target'});
 else if(mode==='play'){
  if(q.stage==='talk')out.push({x:actors.tu.pos.x,z:actors.tu.pos.z,kind:'target'});
  else if(q.stage==='reach')out.push({x:TARGET[0],z:TARGET[1],kind:'target'});
  else if(q.stage==='follow')out.push({x:actors.mama.pos.x,z:actors.mama.pos.z,kind:'target'});
 }
 return out;
}

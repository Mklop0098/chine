// Ba phòng nội thất (cảnh riêng) mở từ menu "Xem nội thất".
import * as THREE from 'three';
import {hint,routeLine,setMeasure,setWalk} from '../app/game.js';
import {ui} from '../core/dom.js';
import {renderer} from '../core/scene.js';
import {material,pattern,vec} from '../core/utils.js';
import {baseStone,fabric,grayCourt,paintedBeam} from '../materials/textures.js';
import {S} from '../core/state.js';

export let roomScenes,roomCamera,activeRoom,roomGold,roomRed,lacquer,ivory,bookBlue,upholstery,bookSpines,paperGold,silk,dragons,dragonMat;

export function roomMesh(g,mat,root,x,y,z){
 const o=new THREE.Mesh(g,mat);o.position.set(x,y,z);o.castShadow=!mat.transparent&&g.type!=='PlaneGeometry';o.receiveShadow=true;root.add(o);return o;
}

export function roomBox(root,x,y,z,w,h,d,mat=lacquer){
 return roomMesh(new THREE.BoxGeometry(w,h,d),mat,root,x,y,z);
}

export function roomCyl(root,x,y,z,r1,r2,h,mat=roomGold){
 return roomMesh(new THREE.CylinderGeometry(r1,r2,h,18),mat,root,x,y,z);
}

export function roomVase(root,x,y,z,scale=1){
 const shape=[[.11,0],[.19,.05],[.29,.15],[.34,.34],[.30,.54],[.17,.66],[.15,.74],[.22,.81]].map(([x,y])=>new THREE.Vector2(x*scale,y*scale));
 roomMesh(new THREE.LatheGeometry(shape,26),roomGold,root,x,y,z);
}

export function seat(root,x,y,z,w=1.22){
 roomBox(root,x,y+.14,z,w+.28,.23,.87,roomGold);
 roomBox(root,x,y+.46,z,w,.34,.72,lacquer);
 roomBox(root,x,y+.66,z+.02,w*.91,.13,.69,upholstery);
 roomBox(root,x,y+1.06,z-.39,w,.91,.15,dragonMat);
 for(const side of [-1,1]){
  roomBox(root,x+side*w*.47,y+.8,z,.14,.19,.78,roomGold);
  roomCyl(root,x+side*w*.47,y+.8,z+.35,.08,.08,.45,roomGold);
 }
}

export function roomTable(root,x,y,z,w,d){
 roomBox(root,x,y+.81,z,w,.10,d,lacquer);
 roomBox(root,x,y+.71,z,w-.1,.13,d-.1,dragonMat);
 for(const dx of [-1,1])for(const dz of [-1,1])roomBox(root,x+dx*(w/2-.09),y+.37,z+dz*(d/2-.09),.11,.74,.11,lacquer);
}

export function roomWindow(root,x,y,z,w,h){
 roomBox(root,x,y,z,w,h,.11,ivory);
 for(let i=0;i<8;i++)roomBox(root,x+(i/7-.5)*w,y,z+.083,.048,h+.05,.09,roomRed);
 for(let i=0;i<5;i++)roomBox(root,x,y+(i/4-.5)*h,z+.092,w+.05,.044,.09,roomRed);
}

export function makeRoom(name,desc,url,width,depth){
 const sc=new THREE.Scene();sc.background=new THREE.Color('#d7d9cb');
 sc.add(new THREE.HemisphereLight('#fff1d4','#9e7862',1.65));
 const light=new THREE.DirectionalLight('#fff4dc',2.55);
 light.position.set(-5,11,9);light.castShadow=true;light.shadow.mapSize.set(1024,1024);
 Object.assign(light.shadow.camera,{left:-10,right:10,top:8,bottom:-8,near:.2,far:32});
 light.shadow.normalBias=.038;sc.add(light);
 const fill=new THREE.PointLight('#ffdda0',19,20,1.7);fill.position.set(1,4.3,1.1);sc.add(fill);
 const root=new THREE.Group();sc.add(root);
 roomBox(root,0,-.22,0,width,.41,depth,baseStone);
 const floor=new THREE.PlaneGeometry(width-.06,depth-.06);
 floor.rotateX(-Math.PI/2);const uv=floor.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*width*.6,uv.getY(i)*depth*.6);
 roomMesh(floor,grayCourt,root,0,.006,0);
 roomBox(root,0,1.91,-depth/2,width,3.82,.18,lacquer);
 roomBox(root,-width/2,1.65,0,.19,3.3,depth,lacquer);
 for(let i=0;i<4;i++)roomWindow(root,(i-1.5)*width*.225,2,-depth/2+.11,width*.188,2.35);
 roomBox(root,0,3.65,-depth/2+.15,width,.38,.31,paintedBeam);
 roomBox(root,0,.26,-depth/2+.18,width,.50,.25,dragonMat);
 for(let i=0;i<5;i++)roomBox(root,(i-2)*width*.24,1.86,-depth/2+.21,.14,3.72,.22,roomRed);
 roomBox(root,-width/2+.17,3.39,0,.35,.41,depth,paintedBeam);
 const row={scene:sc,root,name,desc,url,width,depth,shadowReady:false};
 roomScenes.push(row);return root;
}

export function showRoom(index){
 const entry=roomScenes[index];
 if(!entry)return;
 setWalk(false);setMeasure(false);routeLine.visible=false;
 activeRoom=entry;S.roomYaw=.45;S.roomPitch=.27;S.roomDistance=Math.max(13,entry.width*1.57);
 document.body.classList.add('room-open');
 ui('roomInfo').textContent=entry.desc;
 ui('roomSource').href=entry.url;
 ui('status').textContent='Kéo để xem các phía · Cuộn để thu phóng';
}

export function closeRoom(){
 if(!activeRoom)return;
 activeRoom=null;document.body.classList.remove('room-open');ui('rooms').value='';hint();
}

export function renderRoom(){
 const focus=vec(0,1.15,-.34);
 roomCamera.position.copy(focus).add(vec(Math.sin(S.roomYaw)*Math.cos(S.roomPitch)*S.roomDistance,Math.sin(S.roomPitch)*S.roomDistance,Math.cos(S.roomYaw)*Math.cos(S.roomPitch)*S.roomDistance));
 roomCamera.lookAt(focus);
 if(!activeRoom.shadowReady){renderer.shadowMap.needsUpdate=true;activeRoom.shadowReady=true}
 renderer.render(activeRoom.scene,roomCamera);
}

export function buildRooms(){
roomScenes=[];
roomCamera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.035,140);
activeRoom=null;
S.roomYaw=.47;
S.roomPitch=.32;
S.roomDistance=19;
roomGold=new THREE.MeshStandardMaterial({color:'#bb8a41',roughness:.47,metalness:.28});
roomRed=material('#8b3d2f');
lacquer=material('#673526');
ivory=material('#e0c9a0');
bookBlue=material('#3a5551');
upholstery=material('#a23e30');
bookSpines=['#826044','#8b3b34','#bc934a','#848179'].map(c=>material(c));
paperGold=new THREE.MeshStandardMaterial({color:'#e2b969',roughness:.75,transparent:true,opacity:.62,side:THREE.DoubleSide});
silk=new THREE.MeshStandardMaterial({map:fabric,color:'#e9d4a2',roughness:.88});
dragons=pattern(256,256,c=>{
 c.fillStyle='#703729';c.fillRect(0,0,256,256);
 c.strokeStyle='#bd904d';c.lineWidth=4;c.strokeRect(11,11,234,234);
 for(let x=23;x<238;x+=20){
  c.fillStyle='#c59d60';c.beginPath();c.arc(x,24,2,0,6.28);c.arc(x,231,2,0,6.28);c.fill();
 }
 c.strokeStyle='#d8ad60';c.lineWidth=10;c.lineCap='round';
 c.beginPath();c.moveTo(65,171);c.bezierCurveTo(22,89,151,69,185,102);c.bezierCurveTo(219,152,143,201,105,171);c.bezierCurveTo(74,150,106,106,151,119);c.stroke();
 c.fillStyle='#ebc573';c.beginPath();c.ellipse(167,114,16,11,-.2,0,6.28);c.fill();
 c.strokeStyle='#edc879';c.lineWidth=3;
 for(const [x,y] of [[54,117],[117,94],[173,161],[111,183]]){
  c.beginPath();c.moveTo(x,y);c.lineTo(x-15,y-11);c.lineTo(x-20,y-4);c.stroke();
 }
});
dragonMat=new THREE.MeshStandardMaterial({map:dragons,roughness:.66,metalness:.14});
{
 const g=makeRoom('Điện Thái Hòa · Gian ngai','Bệ ngai, bình phong và sáu cột trang trí lấy ý từ hồ sơ Điện Thái Hòa. Đây là góc cắt tái dựng, kích thước nội thất được ước lượng.','https://www.dpm.org.cn/explore/building/236465.html',13,8);
 for(let i=0;i<3;i++)roomBox(g,0,.10+i*.18,-1.73-i*.13,4.35-i*.47,.19,2.96-i*.33,roomGold);
 for(let i=-2;i<=2;i++){
  roomBox(g,i*.65,1.61,-3.05,.68,2.17+(.35-Math.abs(i)*.1),.12,dragonMat);
  roomBox(g,i*.65,2.78+(.35-Math.abs(i)*.1)/2,-3.05,.69,.12,.19,roomGold);
 }
 seat(g,0,.56,-2.05,1.44);
 for(const side of [-1,1]){
  for(let i=0;i<3;i++){
   const z=-2.61+i*1.95;
   const c=roomCyl(g,side*2.92,1.9,z,.21,.22,3.8,roomGold);
   c.material=dragonMat;
   roomCyl(g,side*2.92,.115,z,.32,.36,.23,roomGold);
  }
  roomVase(g,side*2.02,0,-1.28,1.27);
 }
 roomBox(g,0,.025,1.23,1.96,.027,4.71,upholstery);
}
{
 const g=makeRoom('Dưỡng Tâm Điện · Đông Noãn Các','Bệ ngồi, bình phong và rèm gợi lại không gian thính chính. Vị trí, hoa văn và kích thước là phần tái dựng.','https://www.dpm.org.cn/classify_detail/257945.html',10,7.2);
 roomBox(g,0,.32,-2.18,5.03,.63,2.25,lacquer);
 roomBox(g,0,.66,-2.18,4.82,.09,2.13,ivory);
 seat(g,0,.70,-2.36,1.26);
 for(const side of [-1,1]){
  roomBox(g,side*1.92,1.56,-2.86,.86,1.84,.14,dragonMat);
  roomTable(g,side*2.81,0,-.55,.73,.62);
  roomVase(g,side*2.81,.86,-.55,.64);
 }
 roomBox(g,0,3.35,-.88,5.15,.23,.19,paintedBeam);
 for(let i=0;i<62;i++){
  const x=(i/61-.5)*4.93;
  roomCyl(g,x,2.43,-.88,.014,.014,1.60,paperGold);
 }
 roomTable(g,-2.3,0,1.59,1.67,.76);
 roomBox(g,-2.3,.87,1.62,.57,.018,.41,ivory);
 roomBox(g,-1.8,.96,1.38,.11,.19,.11,bookBlue);
 roomBox(g,0,.018,1.09,2.42,.025,2.46,upholstery);
}
{
 const g=makeRoom('Văn Uyên Các · Gian tàng thư','Sách được đặt trong hộp gỗ. Bốn màu gáy gợi bốn bộ Kinh, Sử, Tử, Tập theo tài liệu bảo tàng. Bố trí kệ mang tính minh họa.','https://www.dpm.org.cn/explore/building/236513.html',13,8);
 for(const side of [-1,1])for(let bay=0;bay<3;bay++){
  const x=side*(2.02+bay*1.47),z=-2.65;
  roomBox(g,x,1.38,z-.29,1.32,2.68,.13,bookBlue);
  for(const q of [-1,1])roomBox(g,x+q*.65,1.38,z,.12,2.67,.67,lacquer);
  for(let shelf=0;shelf<5;shelf++){
   const y=.15+shelf*.53;
   roomBox(g,x,y,z,1.34,.075,.68,lacquer);
   for(let j=0;j<6;j++){
    const h=.31+((j+shelf*3)%4)*.03;
    roomBox(g,x+(j-2.5)*.19,y+.047+h/2,z+.02,.145,h,.39,bookSpines[(bay+shelf)%4]);
    roomBox(g,x+(j-2.5)*.19,y+.17,z+.224,.086,.13,.012,ivory);
   }
  }
 }
 seat(g,0,0,-2.26,1.24);
 roomTable(g,0,0,.5,2.42,1.10);
 roomBox(g,0,.88,.53,1.14,.027,.55,ivory);
 for(const side of [-1,1]){
  roomBox(g,side*2.38,.31,1.41,.64,.56,.62,bookBlue);
  roomBox(g,side*2.38,.64,1.41,.64,.10,.62,upholstery);
 }
}
}

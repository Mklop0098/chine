import * as THREE from 'three';
import {scene} from '../core/scene.js';
import {walkableFloor} from '../player/collision.js';
import {royalRank,rankPositions} from './deployment.js';
import {buildFigure,idleFigure} from './figure.js';

import {thaiHau} from './thai-hau/index.js';
import {vua} from './vua/index.js';
import {hoangHau} from './hoang-hau/index.js';
import {phiTan} from './phi-tan/index.js';

export const royalNpcs=[];
const materials=new Map();
const box=new THREE.BoxGeometry(), head=new THREE.SphereGeometry(.115,14,10);
const robe=new THREE.CylinderGeometry(.17,.29,1.26,16);
const hat=new THREE.CylinderGeometry(.07,.22,.15,16);
const leg=new THREE.BoxGeometry(.10,.34,.14);
const arm=new THREE.CylinderGeometry(.065,.086,.51,8);

function part(group,geometry,color,x,y,z,sx=1,sy=1,sz=1){
 if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.75}));
 const mesh=new THREE.Mesh(geometry,materials.get(color));
 mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
 mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
 return mesh;
}

function person(color,crown,emperor=false){
 const root=new THREE.Group();
 part(root,robe,color,0,.81,0,1,1,.84);
 part(root,box,crown? '#dcad53':'#615357',0,1.02,.16,.29,.11,.05);
 part(root,head,'#d7ad87',0,1.56,0);
 part(root,hat,crown?'#382026':'#302934',0,1.70,0);
 if(crown){
  const width=emperor?.26:.40;
  part(root,box,'#e3b458',0,1.74,.01,width,.055,.20);
  for(const x of [-width*.32,0,width*.32])part(root,head,'#bd4139',x,1.80,.06,.35,.43,.35);
 }
 for(const side of [-1,1]){
  part(root,leg,'#29232b',side*.09,.17,0);
  part(root,arm,color,side*.23,1.08,0);
 }
 return root;
}


const royalMembers=[thaiHau,vua,hoangHau,phiTan]
 .sort((a,b)=>a.priority-b.priority)
 .flatMap(role=>role.members.map(member=>({...member,role})));

// Trang phục chi tiết theo chức vị (cùng mức chi tiết với nhân vật chính).
const COURT_WAVES=['#3c66a8','#4a9a7a','#c94a5a','#f4efe1'];
const CONSORT_ORDER=['imperial-consort','noble-consort','consort','concubine','noble-lady','attendant'];
function royalSpec({id,color,crown}){
 if(crown==='imperial')return{
  sex:'m',robe:'#e9b82a',gold:'#f3d27a',collarCape:'#1c2747',cuff:'#1c2747',waves:['#2f5fa8','#3a8f6d','#c43c3c','#f4efe1','#e1b040'],
  roundel:'dragon',roundels:8,hat:'emperor',necklace:'#c98a3a',hem:'#1c2747',skin:'#e9c09e',seed:3
 };
 if(id==='dowager')return{
  sex:'f',robe:color,gold:'#e7c56e',collarCape:'#251e36',cuff:'#251e36',waves:COURT_WAVES,roundel:'dragon',roundels:6,
  phoenixCrown:true,necklace:'#d6a64a',torque:true,nailGuards:true,old:true,hair:'#2b2828',board:{w:.46,h:.17},
  flowers:['#f2c6d2','#e8d9a8','#c9b6e6'],tassel:'#e3c063',kerchief:'#f3e3bf',skin:'#e9c3a6',lips:'#a8424c',seed:11
 };
 if(id==='empress')return{
  sex:'f',robe:color,gold:'#efcc72',collarCape:'#1f2440',cuff:'#1f2440',waves:COURT_WAVES,roundel:'phoenix',roundels:6,
  phoenixCrown:true,necklace:'#efe6cf',torque:true,nailGuards:true,board:{w:.46,h:.17},
  flowers:['#e04462','#f6efe6','#f2a6bd'],tassel:'#c22a33',seed:17
 };
 const level=Math.max(0,CONSORT_ORDER.indexOf(id));
 return{
  sex:'f',robe:color,gold:level<2?'#e8c56c':'#d8c08a',collarCape:level<3?'#232640':null,cuff:level<3?'#232640':'#f3eee2',
  waves:level<4?COURT_WAVES:null,roundel:level<2?'phoenix':'flower',roundels:level<2?4:2,
  phoenixCrown:level===0,necklace:level<3?'#c8564e':null,torque:level<2,nailGuards:level<4,
  board:{w:.44-level*.016,h:.16-level*.006},flowers:[['#e45d79','#f6efe6','#f2c6d2'],['#c76bd1','#f6efe6','#9fc7e8'],['#f2c445','#f6efe6','#e45d79']][level%3],
  tassel:level<3?'#c22a33':'#d36f8e',seed:23+level*5
 };
}

export function updateRoyals(t){
 for(const n of royalNpcs)idleFigure(n.figure,t);
}

export function buildRoyalNpcs(){
 const positions=rankPositions(royalRank);
 royalMembers.forEach((member,index)=>{
  const {id,title,role}=member;
  const [x,z]=positions[index];
  const figure=buildFigure(royalSpec(member));
  const rig=figure.root;
  rig.position.set(x,walkableFloor(x,z,0),z);
  scene.add(rig);
  royalNpcs.push({id,title,rig,role,figure});
 });
 // Đoàn tùy tùng (escortRanks) nay được dựng trong npcs.js bằng mô hình NPC chi tiết.
}

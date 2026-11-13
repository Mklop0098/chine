import * as THREE from 'three';
import {scene} from '../core/scene.js';
import {walkableFloor} from '../player/collision.js';
import {escortRanks,royalRank,rankPositions} from './deployment.js';

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

export function buildRoyalNpcs(){
 const positions=rankPositions(royalRank);
 royalMembers.forEach(({id,title,color,crown,role},index)=>{
  const [x,z]=positions[index];
  const rig=person(color,true,crown==='imperial');
  rig.position.set(x,walkableFloor(x,z,0),z);
  scene.add(rig);
  royalNpcs.push({id,title,rig,role});
 });
 for(const rank of escortRanks){
  for(const [x,z] of rankPositions(rank)){
   const attendant=person(rank.color,false);
   attendant.position.set(x,walkableFloor(x,z,0),z);
   scene.add(attendant);
  }
 }
}

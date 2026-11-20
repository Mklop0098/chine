// Instancing chia ô (chunk) + LOD theo khoảng cách cho cây, bụi, cỏ, hoa.
// Mỗi nhóm được chia theo lưới ô vuông để frustum culling loại bỏ ô ngoài tầm nhìn;
// mỗi ô có nhiều mức chi tiết (dùng chung instanceMatrix) và một "bóng giả" chỉ vẽ vào shadow map.
import * as THREE from 'three';
import {scene,sun} from '../core/scene.js';

const groups=new Map();
export const chunks=[];
export const stats={instances:0,chunks:0,meshes:0};
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new THREE.Vector3(),_s=new THREE.Vector3();
const SHADOW_LAYER=1;

// levels: [{geo,max}] – max là khoảng cách (m) tối đa để dùng mức đó; mức cuối dùng tới hideBeyond.
export function defineGroup(name,{levels,material,cell=96,castShadow=true,receiveShadow=true,hideBeyond=Infinity,colored=false,shadowLevel=1}){
 if(!groups.has(name))groups.set(name,{levels,material,cell,castShadow,receiveShadow,hideBeyond,colored,shadowLevel:Math.min(shadowLevel,levels.length-1),cells:new Map()});
}

export function pushMatrix(name,m,color){
 const g=groups.get(name),e=m.elements,k=Math.floor(e[12]/g.cell)+','+Math.floor(e[14]/g.cell);
 let c=g.cells.get(k);
 if(!c)g.cells.set(k,c={m:[],c:[]});
 for(let i=0;i<16;i++)c.m.push(e[i]);
 if(g.colored){if(color)c.c.push(color.r,color.g,color.b);else c.c.push(1,1,1)}
}

export function pushTRS(name,x,y,z,sx,sy,sz,ry=0,color=null,rx=0,rz=0){
 _q.setFromEuler(_e.set(rx,ry,rz));
 pushMatrix(name,_m.compose(_p.set(x,y,z),_q,_s.set(sx,sy,sz)),color);
}

const UP=new THREE.Vector3(0,1,0),_axis=new THREE.Vector3();
// Đoạn hình trụ đơn vị (cao 1, bán kính 1) kéo từ a tới b.
export function pushBeam(name,a,b,r){
 _axis.subVectors(b,a);const len=_axis.length();if(len<1e-4)return;
 _q.setFromUnitVectors(UP,_axis.multiplyScalar(1/len));
 pushMatrix(name,_m.compose(_p.addVectors(a,b).multiplyScalar(.5),_q,_s.set(r,len,r)));
}

function makeMesh(geo,material,count,matAttr,colAttr){
 const mesh=new THREE.InstancedMesh(geo,material,0);
 mesh.count=count;mesh.instanceMatrix=matAttr;if(colAttr)mesh.instanceColor=colAttr;
 mesh.matrixAutoUpdate=false;mesh.computeBoundingSphere();
 return mesh;
}

export function flushGroups(){
 sun.shadow.camera.layers.enable(SHADOW_LAYER);
 for(const g of groups.values()){
  for(const c of g.cells.values()){
   const count=c.m.length/16;if(!count)continue;
   const matAttr=new THREE.InstancedBufferAttribute(new Float32Array(c.m),16);
   const colAttr=g.colored?new THREE.InstancedBufferAttribute(new Float32Array(c.c),3):null;
   const meshes=g.levels.map(({geo,max})=>{
    const mesh=makeMesh(geo,g.material,count,matAttr,colAttr);
    mesh.castShadow=false;mesh.receiveShadow=g.receiveShadow;mesh.visible=false;scene.add(mesh);
    return {mesh,max};
   });
   if(g.castShadow){
    // Bóng giả: chỉ camera bóng đổ thấy (layer 1), nên bóng luôn ổn định dù LOD đổi.
    const proxy=makeMesh(g.levels[g.shadowLevel].geo,g.material,count,matAttr,null);
    proxy.layers.set(SHADOW_LAYER);proxy.castShadow=true;proxy.receiveShadow=false;scene.add(proxy);
   }
   const bs=meshes[0].mesh.boundingSphere;
   chunks.push({c:bs.center.clone(),r:bs.radius,meshes,hide:g.hideBeyond,cur:-2});
   stats.instances+=count;stats.meshes+=meshes.length+(g.castShadow?1:0);
  }
  g.cells.clear();
 }
 stats.chunks=chunks.length;
}

const last=new THREE.Vector3(1e9,1e9,1e9);
let frames=0;
// Gọi mỗi khung hình; chỉ tính lại khi camera dịch > 3 m hoặc sau 20 khung hình.
export function updateLOD(cam){
 if(cam.distanceToSquared(last)<9&&++frames<20)return;
 frames=0;last.copy(cam);
 for(const ch of chunks){
  const d=Math.max(0,cam.distanceTo(ch.c)-ch.r);
  let li=-1;
  if(d<ch.hide){li=ch.meshes.findIndex(l=>d<l.max);if(li<0)li=ch.meshes.length-1}
  if(li===ch.cur)continue;
  ch.cur=li;
  for(let i=0;i<ch.meshes.length;i++)ch.meshes[i].mesh.visible=i===li;
 }
}

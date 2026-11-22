import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {add} from '../builders/primitives.js';
import {stone,carvedStone} from '../materials/textures.js';
import {scene} from '../core/scene.js';
import {warpX,warpZ} from '../core/warp.js';
import {YANXI_POND} from '../core/yanxiPondLayout.js';

export const YANXI_STATUE_HEIGHT=8.5;
export const YANXI_STATUE_BASE_Y=YANXI_POND.statueBaseY;
let statuePosition=null;

// Mặt nước và vùng cấm đi được đăng ký trong landscape; không còn bệ đá đặc.
export function buildGuanyinStatue(x,z){
 statuePosition={x,z};
 const {rx,rz,waterY}=YANXI_POND;
 const rim=new THREE.TorusGeometry(rx+.14,.14,8,96);
 rim.rotateX(Math.PI/2);rim.scale(1,1,rz/rx);
 add(rim,stone,x,.12,z);
 // Lan can đá chạy kín theo bờ elip, hai thanh ngang và trụ đầu tròn.
 for(const y of [.5,1.05]){
  const rail=new THREE.TorusGeometry(rx+.38,.065,8,96);
  rail.rotateX(Math.PI/2);rail.scale(1,1,rz/rx);
  add(rail,carvedStone,x,y,z);
 }
 for(let i=0;i<28;i++){
  const a=i*Math.PI*2/28,px=x+Math.cos(a)*(rx+.38),pz=z+Math.sin(a)*(rz+.38*rz/rx);
  add(new THREE.CylinderGeometry(.095,.12,1.06,10),carvedStone,px,.55,pz,{solid:true});
  add(new THREE.SphereGeometry(.145,12,8),carvedStone,px,1.12,pz);
 }
 const leafMat=new THREE.MeshStandardMaterial({color:'#3b7045',roughness:.92,side:THREE.DoubleSide});
 const veinMat=new THREE.MeshStandardMaterial({color:'#86a16a',roughness:1});
 const petalMat=new THREE.MeshStandardMaterial({color:'#eeb8c9',roughness:.8});
 const heartMat=new THREE.MeshStandardMaterial({color:'#e9c76b',roughness:.88});
 function stem(dx,dz,height,r=.035){
  const curve=new THREE.CatmullRomCurve3([
   new THREE.Vector3(x+dx*.9,waterY,z+dz*.9),
   new THREE.Vector3(x+dx*.95,waterY+height*.52,z+dz*.95+.18),
   new THREE.Vector3(x+dx,waterY+height,z+dz),
  ]);
  add(new THREE.TubeGeometry(curve,18,r,8,false),leafMat);
 }
 // Lá sen vươn lên trên cuống dài; vài lá thấp xen kẽ để mặt ao vẫn tự nhiên.
 const leaves=[[-4,-1,.62],[-3.8,2,.7],[-2.4,3.7,.6],[.2,4.1,.65],
  [3.4,3,.65],[4.5,.8,.55],[3.8,-2.8,.65],[1.7,-4.2,.6],[-2,-3.9,.55],[-4.2,-2.6,.55]];
 for(const [index,[dx,dz,r]] of leaves.entries()){
  const height=index===3||index===8?.08:1.15+(index%4)*.48;
  if(height>.1)stem(dx,dz,height);
  const leaf=new THREE.CircleGeometry(r,28,.25,Math.PI*2-.5);leaf.rotateX(-Math.PI/2);
  // Mép lá khum nhẹ, gân cùng cao độ với phiến lá.
  const positions=leaf.attributes.position;
  for(let i=0;i<positions.count;i++){
   const distance=Math.hypot(positions.getX(i),positions.getZ(i));
   positions.setY(i,.09*(distance/r)**2);
  }
  leaf.computeVertexNormals();
  add(leaf,leafMat,x+dx,waterY+height,z+dz);
  for(let j=0;j<7;j++){
   const a=.4+j*(Math.PI*2-.8)/7;
   const curve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(x+dx,waterY+height+.01,z+dz),
    new THREE.Vector3(x+dx+Math.cos(a)*r*.44,waterY+height+.027,z+dz+Math.sin(a)*r*.44),
    new THREE.Vector3(x+dx+Math.cos(a)*r*.88,waterY+height+.08,z+dz+Math.sin(a)*r*.88),
   ]);
   add(new THREE.TubeGeometry(curve,6,.008,4,false),veinMat);
  }
 }
 for(const [dx,dz,height] of [[-3.5,2.9,3.2],[3.6,2.7,4],[2,-3.7,2.7],
  [-4.1,-1.6,4.8],[.4,4.2,1.9],[3.9,-1.5,3.6]]){
  stem(dx,dz,height,.045);
  for(let j=0;j<18;j++){
   const inner=j>=12,a=inner?(j-12)*Math.PI/3:j*Math.PI/6,petal=new THREE.SphereGeometry(1,14,10);
   petal.scale(inner?.13:.19,inner?.34:.3,.09);petal.rotateX(inner?.3:.85);petal.rotateY(a);
   const radius=inner?.12:.26;
   add(petal,petalMat,x+dx+Math.sin(a)*radius,waterY+height+.1,z+dz+Math.cos(a)*radius);
  }
  const heart=new THREE.SphereGeometry(.13,12,8);heart.scale(1,.6,1);
  add(heart,heartMat,x+dx,waterY+height+.16,z+dz);
 }
}

// Gọi sau finalize: chỉ uốn vị trí, giữ nguyên tỉ lệ mô hình và vật liệu gốc.
export async function loadYanxiStatue(){
 if(!statuePosition)return;
 const gltf=await new GLTFLoader().loadAsync(import.meta.env.BASE_URL+'models/yanxi-guanyin.glb');
 const model=gltf.scene;
 model.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
 if(!Number.isFinite(size.y)||size.y<=0)throw new Error('Mô hình tượng Diên Hy không có kích thước hợp lệ.');
 model.scale.multiplyScalar(YANXI_STATUE_HEIGHT/size.y);
 model.updateMatrixWorld(true);
 bounds.setFromObject(model);
 const center=bounds.getCenter(new THREE.Vector3());
 model.position.add(new THREE.Vector3(
  warpX(statuePosition.x)-center.x,
  YANXI_STATUE_BASE_Y-bounds.min.y,
  warpZ(statuePosition.z)-center.z,
 ));
 model.name='Diên Hy — tượng GLB';
 model.traverse(object=>{
  if(!object.isMesh)return;
  object.castShadow=true;object.receiveShadow=true;
  for(const material of Array.isArray(object.material)?object.material:[object.material]){
   if(material.isMeshStandardMaterial)material.envMapIntensity=.45;
  }
 });
 scene.add(model);
 model.updateMatrixWorld(true);
 return model;
}

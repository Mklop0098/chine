// Áp shader phong hóa, lưới va chạm, gộp mesh tĩnh theo vật liệu để giảm draw call.
import * as THREE from 'three';
import {scene} from '../core/scene.js';
import {baseStone,bronze,carvedStone,darkMasonry,gardenPebbles,grass,grayCourt,paleCourt,paved,red,roofGold,solids,staticMeshes,stone,wallRed,water} from '../materials/textures.js';
import {weather} from '../materials/weather.js';
import {plantingMat} from './landscape.js';
import {courtyardBase,facadePlaster,grayTile,greenTile,wallPlaster} from './mappedBuildings.js';
import {groundMat} from './moat.js';
import {foliageColors} from './trees.js';
import {scaleX,scaleZ,warpX,warpZ} from '../core/warp.js';
import {warpWorld} from './warpWorld.js';

export let grid,batches;

export function buildFinalize(){
for(const m of [paved,grayCourt,paleCourt])weather(m,{scale:.045,amount:.15,fine:.06,fineScale:.8});
weather(groundMat,{scale:.012,amount:.14,fine:.08,fineScale:.22});
weather(grass,{scale:.035,amount:.2,fine:.1,fineScale:.45});
weather(wallRed,{scale:.22,amount:.09,grime:.3,grimeH:2.4,streak:.2});
weather(facadePlaster,{scale:.3,amount:.08,grime:.3,grimeH:1.3,streak:.12});
weather(wallPlaster,{scale:.25,amount:.1,grime:.32,grimeH:1.8,streak:.2});
weather(red,{scale:.5,amount:.06});
weather(roofGold,{scale:.05,amount:.12,fine:.07,fineScale:.35});
weather(grayTile,{scale:.06,amount:.12,fine:.06,fineScale:.35});
weather(greenTile,{scale:.06,amount:.12});
for(const m of [stone,baseStone,courtyardBase])weather(m,{scale:.18,amount:.07,grime:.2,grimeH:.9});
weather(carvedStone,{scale:.2,amount:.06,grime:.15,grimeH:.8});
weather(darkMasonry,{scale:.1,amount:.1,grime:.2,grimeH:1});
weather(gardenPebbles,{scale:.15,amount:.1});
weather(plantingMat,{scale:.09,amount:.22,fine:.12,fineScale:1.1});
for(const m of staticMeshes){const mt=m.material;if(mt.isMeshStandardMaterial&&!mt.userData.envSet){mt.envMapIntensity=mt===roofGold?.75:mt===water?.6:mt===grayTile?.55:.42;mt.userData.envSet=true}}
scene.traverse(o=>{if(o.isInstancedMesh&&!o.material.userData.envSet){o.material.envMapIntensity=.38;o.material.userData.envSet=true}});
for(const m of foliageColors)m.envMapIntensity=.3;
bronze.metalness=.45;
bronze.roughness=.48;
scene.updateMatrixWorld(true);
// Uốn mặt bằng theo bản đồ minh họa: dữ liệu, mặt đi, cây cỏ… (mesh tĩnh và hộp va chạm uốn ngay dưới đây).
warpWorld();
grid=new Map();
for(const o of solids){
 const b=new THREE.Box3().setFromObject(o);
 b.min.x=warpX(b.min.x);b.max.x=warpX(b.max.x);b.min.z=warpZ(b.min.z);b.max.z=warpZ(b.max.z);
 const outline=o.userData.outline&&o.userData.outline.map(([x,z])=>[warpX(x),warpZ(z)]);
 const collider={b,outline,step:o.userData.step};
 const x1=Math.floor(b.min.x/18),x2=Math.floor(b.max.x/18),z1=Math.floor(b.min.z/18),z2=Math.floor(b.max.z/18);
 for(let x=x1;x<=x2;x++)for(let z=z1;z<=z2;z++){
  const k=x+','+z;
  if(!grid.has(k))grid.set(k,[]);
  grid.get(k).push(collider);
 }
}
// Combine static meshes by material to keep the large footprint dataset interactive.
// Hai lượt, ghi thẳng vào mảng đích (không toNonIndexed/clone/applyMatrix4 từng mesh), và gỡ cả loạt mesh
// khỏi scene một lần: gỡ lẻ từng cái (indexOf + splice trên ~190 nghìn con) là O(n²).
batches=new Map();
const removed=new Set();
for(const mesh of staticMeshes){
 const key=mesh.material.id+':'+mesh.castShadow;
 let b=batches.get(key);
 if(!b)batches.set(key,b={material:mesh.material,shadow:mesh.castShadow,items:[],size:0});
 const g=mesh.geometry;
 b.items.push(mesh);b.size+=g.index?g.index.count:g.attributes.position.count;
 removed.add(mesh);
}
for(const parent of new Set(staticMeshes.map(m=>m.parent).filter(Boolean))){
 const kept=parent.children.filter(c=>!removed.has(c));
 for(const c of parent.children)if(removed.has(c))c.parent=null;
 parent.children=kept;
}
const nm=new THREE.Matrix3();
for(const {material,shadow,items,size} of batches.values()){
 const p=new Float32Array(size*3),n=new Float32Array(size*3),uv=new Float32Array(size*2);
 let at=0;
 for(const mesh of items){
  const g=mesh.geometry,idx=g.index,pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv;
  const e=mesh.matrixWorld.elements,m=nm.getNormalMatrix(mesh.matrixWorld).elements;
  const count=idx?idx.count:pa.count;
  // Đường nhanh: đọc thẳng mảng khi thuộc tính là mảng phẳng thường (mọi hình dựng sẵn của three.js).
  const plain=a=>a&&!a.isInterleavedBufferAttribute&&!a.normalized;
  const P=plain(pa)&&pa.itemSize===3?pa.array:null,Nn=plain(na)&&na.itemSize===3?na.array:null,Uv=plain(ua)&&ua.itemSize===2?ua.array:null,I=idx?idx.array:null;
  for(let k=0;k<count;k++,at++){
   const v=I?I[k]:k,o=at*3,v3=v*3;
   const x=P?P[v3]:pa.getX(v),y=P?P[v3+1]:pa.getY(v),z=P?P[v3+2]:pa.getZ(v);
   const wx=e[0]*x+e[4]*y+e[8]*z+e[12],wz=e[2]*x+e[6]*y+e[10]*z+e[14];
   p[o]=warpX(wx);p[o+1]=e[1]*x+e[5]*y+e[9]*z+e[13];p[o+2]=warpZ(wz);
   // Pháp tuyến theo phép uốn: nhân nghịch đảo hệ số giãn từng trục.
   const a=Nn?Nn[v3]:na.getX(v),b=Nn?Nn[v3+1]:na.getY(v),c=Nn?Nn[v3+2]:na.getZ(v);
   const nx=(m[0]*a+m[3]*b+m[6]*c)/scaleX(wx),ny=m[1]*a+m[4]*b+m[7]*c,nz=(m[2]*a+m[5]*b+m[8]*c)/scaleZ(wz);
   const l=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;n[o]=nx/l;n[o+1]=ny/l;n[o+2]=nz/l;
   if(Uv){uv[at*2]=Uv[v*2];uv[at*2+1]=Uv[v*2+1]}
   else if(ua){uv[at*2]=ua.getX(v);uv[at*2+1]=ua.getY(v)}
  }
  g.dispose();
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('normal',new THREE.BufferAttribute(n,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
 g.computeBoundingSphere();
 const mesh=new THREE.Mesh(g,material);mesh.castShadow=shadow;mesh.receiveShadow=true;mesh.matrixAutoUpdate=false;scene.add(mesh);
}
}

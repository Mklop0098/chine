// Áp shader phong hóa, lưới va chạm, gộp mesh tĩnh theo vật liệu để giảm draw call.
import * as THREE from 'three';
import {scene} from '../core/scene.js';
import {baseStone,bronze,carvedStone,darkMasonry,gardenPebbles,grass,grayCourt,paleCourt,paved,red,roofGold,solids,staticMeshes,stone,wallRed,water} from '../materials/textures.js';
import {weather} from '../materials/weather.js';
import {plantingMat} from './landscape.js';
import {courtyardBase,facadePlaster,grayTile,greenTile,wallPlaster} from './mappedBuildings.js';
import {groundMat} from './moat.js';
import {foliageColors} from './trees.js';

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
weather(plantingMat,{scale:.3,amount:.25,fine:.15,fineScale:2});
for(const m of staticMeshes){const mt=m.material;if(mt.isMeshStandardMaterial&&!mt.userData.envSet){mt.envMapIntensity=mt===roofGold?.75:mt===water?.6:mt===grayTile?.55:.42;mt.userData.envSet=true}}
scene.traverse(o=>{if(o.isInstancedMesh&&!o.material.userData.envSet){o.material.envMapIntensity=.38;o.material.userData.envSet=true}});
for(const m of foliageColors)m.envMapIntensity=.3;
bronze.metalness=.45;
bronze.roughness=.48;
scene.updateMatrixWorld(true);
grid=new Map();
for(const o of solids){
 const b=new THREE.Box3().setFromObject(o);
 const collider={b,outline:o.userData.outline,step:o.userData.step};
 const x1=Math.floor(b.min.x/18),x2=Math.floor(b.max.x/18),z1=Math.floor(b.min.z/18),z2=Math.floor(b.max.z/18);
 for(let x=x1;x<=x2;x++)for(let z=z1;z<=z2;z++){
  const k=x+','+z;
  if(!grid.has(k))grid.set(k,[]);
  grid.get(k).push(collider);
 }
}
// Combine static meshes by material to keep the large footprint dataset interactive.
batches=new Map();
for(const mesh of staticMeshes){
 const key=mesh.material.id+':'+mesh.castShadow;
 if(!batches.has(key))batches.set(key,{material:mesh.material,shadow:mesh.castShadow,items:[]});
 const geo=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
 geo.applyMatrix4(mesh.matrixWorld);
 batches.get(key).items.push(geo);
 mesh.removeFromParent();mesh.geometry.dispose();
}
for(const {material,shadow,items} of batches.values()){
 const size=items.reduce((sum,g)=>sum+g.attributes.position.count,0),p=new Float32Array(size*3),n=new Float32Array(size*3),uv=new Float32Array(size*2);
 let at=0;
 for(const g of items){
  const len=g.attributes.position.count;p.set(g.attributes.position.array,at*3);n.set(g.attributes.normal.array,at*3);
  if(g.attributes.uv)uv.set(g.attributes.uv.array,at*2);
  at+=len;g.dispose();
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('normal',new THREE.BufferAttribute(n,3));g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
 const mesh=new THREE.Mesh(g,material);mesh.castShadow=shadow;mesh.receiveShadow=true;scene.add(mesh);
}
}

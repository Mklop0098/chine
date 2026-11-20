// Áp phép uốn mặt bằng (src/core/warp.js) cho mọi thứ đã dựng trước bước gộp mesh:
// dữ liệu bản đồ, mặt đi được, nước, cầu, điểm tham quan, đèn lồng, khói hương, cây cỏ instancing.
// Mesh tĩnh và hộp va chạm được uốn ngay trong finalize.js (lúc gộp mesh / dựng lưới va chạm).
import {scene} from '../core/scene.js';
import {warpPair,warpX,warpZ} from '../core/warp.js';
import {data} from '../data.js';
import {walkSurfaces} from '../builders/primitives.js';
import {bridges,waterways} from '../materials/textures.js';
import {places} from './landmarks.js';
import {mappedWater} from './landscape.js';
import {smokeSources} from './props.js';
import {warpFixtures} from './lanterns.js';
import {chunks} from './instancer.js';
import {resetSurfaceIndex} from '../player/collision.js';

const isPair=a=>Array.isArray(a)&&a.length===2&&typeof a[0]==='number'&&typeof a[1]==='number';

export function warpWorld(){
 // 1) Điểm [x, z] trong dữ liệu: duyệt sâu, mỗi mảng điểm chỉ uốn một lần (nhiều danh sách dùng chung điểm).
 const done=new Set();
 const walk=o=>{
  if(Array.isArray(o)){
   if(isPair(o)){if(!done.has(o)){done.add(o);warpPair(o)}return}
   for(const v of o)walk(v);
  }else if(o&&typeof o==='object')for(const v of Object.values(o))walk(v);
 };
 for(const [k,v] of Object.entries(data))if(k!=='districtPlaces')walk(v);
 for(const e of data.districtPlaces){e[1]=warpX(e[1]);e[2]=warpZ(e[2])}
 for(const list of [mappedWater,waterways])walk(list);
 for(const b of bridges){walk(b.outline);walk(b.axis)}

 // 2) Mặt đi được: hình chữ nhật thẳng trục vẫn là chữ nhật sau khi uốn tách trục.
 for(const s of walkSurfaces){
  const x0=warpX(s.x-s.w/2),x1=warpX(s.x+s.w/2),z0=warpZ(s.z-s.d/2),z1=warpZ(s.z+s.d/2);
  s.x=(x0+x1)/2;s.z=(z0+z1)/2;s.w=x1-x0;s.d=z1-z0;
  if(s.poly){s.poly=s.poly.map(p=>[warpX(p[0]),warpZ(p[1])])}
 }
 resetSurfaceIndex();

 // 3) Điểm tham quan, khói hương, đèn lồng treo hiên.
 for(const p of places){p.x=warpX(p.x);p.z=warpZ(p.z)}
 for(const s of smokeSources){s[0]=warpX(s[0]);s[2]=warpZ(s[2])}
 warpFixtures(v=>{v.x=warpX(v.x);v.z=warpZ(v.z)});

 // 4) Instancing (cây, bụi, cỏ, hoa…): dời vị trí từng instance; ma trận dùng chung giữa các mức LOD chỉ uốn một lần.
 const attrs=new Set();
 scene.traverse(o=>{
  if(o.isInstancedMesh&&!attrs.has(o.instanceMatrix)){
   attrs.add(o.instanceMatrix);
   const a=o.instanceMatrix.array;
   for(let i=0;i<a.length;i+=16){a[i+12]=warpX(a[i+12]);a[i+14]=warpZ(a[i+14])}
   o.instanceMatrix.needsUpdate=true;
  }
  if(o.isInstancedMesh){o.boundingSphere=null;o.computeBoundingSphere()}
 });
 for(const ch of chunks){const s=ch.meshes[0].mesh.boundingSphere;ch.c.copy(s.center);ch.r=s.radius;ch.cur=-2}
}

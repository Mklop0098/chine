// Va chạm khi đi bộ: floorAt(), walkableFloor() – dùng chung cho người chơi và NPC.
import * as THREE from 'three';
import {pointInPolygon,walkSurfaces} from '../builders/primitives.js';
import {bridges,waterways} from '../materials/textures.js';
import {grid} from '../world/finalize.js';
import {mappedWater} from '../world/landscape.js';
import {scaleX,scaleZ,warpX,warpZ} from '../core/warp.js';

export function distSegment(x,z,[a,b]){
 const dx=b[0]-a[0],dz=b[1]-a[1];
 const t=THREE.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);
 return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);
}

// Chỉ mục lưới cho các mặt đi được (tránh duyệt toàn bộ danh sách mỗi bước chân).
const SG=8;let surfGrid=null,surfCount=-1;
// Gọi sau khi uốn mặt bằng (warpWorld) để lập lại chỉ mục mặt đi.
export function resetSurfaceIndex(){surfCount=-1}
// Hai hồ nước trong Ngự Hoa Viên (tọa độ gốc, dời theo phép uốn).
const POOLS=[[-53,-406.4],[54,-406.5]].map(([x,z])=>({x:warpX(x),z:warpZ(z),hx:4*scaleX(x),hz:4.4*scaleZ(z)}));
function surfaces(x,z){
 if(surfCount!==walkSurfaces.length){
  surfGrid=new Map();surfCount=walkSurfaces.length;
  for(const s of walkSurfaces){
   for(let i=Math.floor((s.x-s.w/2-.1)/SG);i<=Math.floor((s.x+s.w/2+.1)/SG);i++)
    for(let j=Math.floor((s.z-s.d/2-.1)/SG);j<=Math.floor((s.z+s.d/2+.1)/SG);j++){
     const k=i+','+j;if(!surfGrid.has(k))surfGrid.set(k,[]);surfGrid.get(k).push(s);
    }
  }
 }
 return surfGrid.get(Math.floor(x/SG)+','+Math.floor(z/SG))||[];
}

export function floorAt(x,z,current){
 let best=current<=.40?0:-Infinity;
 for(const s of surfaces(x,z)){
  if(Math.abs(x-s.x)>s.w/2+.012||Math.abs(z-s.z)>s.d/2+.012)continue;
  if(s.poly&&!pointInPolygon(x,z,s.poly))continue;
  if(s.y<=current+.267&&s.y>=current-.42)best=Math.max(best,s.y);
 }
 return Number.isFinite(best)?best:null;
}

export function walkableFloor(x,z,current){
 if(Math.abs(x)>369||z< -552||z>880||z< -479&&Math.abs(x)>10.5)return null;
 const inBridge=bridges.some(b=>pointInPolygon(x,z,b.outline));
 if(!inBridge&&mappedWater.some(p=>pointInPolygon(x,z,p)))return null;
 if(!inBridge&&waterways.some(s=>distSegment(x,z,s)<4.75))return null;
 if((z>497.5&&z<549.5&&Math.abs(x)>30.7)||(z< -497.5&&z> -549.5&&Math.abs(x)>10.5))return null;
 if(POOLS.some(p=>Math.abs(x-p.x)<p.hx&&Math.abs(z-p.z)<p.hz))return null;
 const floor=floorAt(x,z,current);
 if(floor===null)return null;
 for(const [dx,dz] of [[0,0],[-.24,-.24],[.24,-.24],[-.24,.24],[.24,.24]]){
  const xx=x+dx,zz=z+dz,near=grid.get(Math.floor(xx/18)+','+Math.floor(zz/18))||[];
  for(const {b,outline,step} of near){
   if(step&&(dx||dz))continue;
   if(b.max.y<=floor+.274||b.min.y>=floor+1.78||xx<=b.min.x||xx>=b.max.x||zz<=b.min.z||zz>=b.max.z)continue;
   if(!outline||pointInPolygon(xx,zz,outline))return null;
  }
 }
 return floor;
}

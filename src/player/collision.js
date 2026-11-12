// Va chạm khi đi bộ: floorAt(), walkableFloor() – dùng chung cho người chơi và NPC.
import * as THREE from 'three';
import {pointInPolygon,walkSurfaces} from '../builders/primitives.js';
import {bridges,waterways} from '../materials/textures.js';
import {grid} from '../world/finalize.js';
import {mappedWater} from '../world/landscape.js';

export function distSegment(x,z,[a,b]){
 const dx=b[0]-a[0],dz=b[1]-a[1];
 const t=THREE.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1);
 return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);
}

export function floorAt(x,z,current){
 let best=current<=.40?0:-Infinity;
 for(const s of walkSurfaces){
  if(Math.abs(x-s.x)>s.w/2+.012||Math.abs(z-s.z)>s.d/2+.012)continue;
  if(s.y<=current+.267&&s.y>=current-.42)best=Math.max(best,s.y);
 }
 return Number.isFinite(best)?best:null;
}

export function walkableFloor(x,z,current){
 if(Math.abs(x)>369||z< -552||z>614||z< -479&&Math.abs(x)>10.5)return null;
 const inBridge=bridges.some(b=>pointInPolygon(x,z,b.outline));
 if(!inBridge&&mappedWater.some(p=>pointInPolygon(x,z,p)))return null;
 if(!inBridge&&waterways.some(s=>distSegment(x,z,s)<4.75))return null;
 if((z>497.5&&z<549.5&&Math.abs(x)>30.7)||(z< -497.5&&z> -549.5&&Math.abs(x)>10.5))return null;
 if(Math.abs(x+53)<4&&Math.abs(z+406.4)<4.4||Math.abs(x-54)<4&&Math.abs(z+406.5)<4.4)return null;
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

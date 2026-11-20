// Khối dựng cơ bản: add/box/slab/polygon, bề mặt đi được, va chạm, xà, biển hiệu, vòm cổng.
import * as THREE from 'three';
import {scene} from '../core/scene.js';
import {pattern,vec} from '../core/utils.js';
import {baseStone,darkMasonry,gardenPebbles,paved,roofGold,solids,staticMeshes} from '../materials/textures.js';
import {distSegment} from '../player/collision.js';

export let walkSurfaces;

export function surfaceRect(x,z,w,d,y){
 walkSurfaces.push({x,z,w,d,y});
}

// Mặt đi được dạng đa giác (bậc xoay, nền nghiêng theo bản đồ…).
export function surfacePoly(points,y){
 const [x,z,w,d]=bounds(points);
 walkSurfaces.push({x,z,w,d,y,poly:points});
}

export function beamBetween(a,b,r,mat,sides=8){
 const axis=b.clone().sub(a);
 const o=add(new THREE.CylinderGeometry(r,r,axis.length(),sides),mat);
 o.position.copy(a).add(b).multiplyScalar(.5);
 o.quaternion.setFromUnitVectors(vec(0,1,0),axis.normalize());
 return o;
}

export function plaque(x,y,z,label,w){
 const texture=pattern(384,128,c=>{
  c.fillStyle='#294754';c.fillRect(0,0,384,128);
  c.strokeStyle='#c3a664';c.lineWidth=7;c.strokeRect(7,7,370,114);
  c.font='bold 67px "Microsoft YaHei",serif';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#edd08b';
  c.fillText(label,192,67);
 });
 box(x,y,z,w,w*.31,.22,new THREE.MeshStandardMaterial({map:texture,roughness:.72}));
}

export function archHeader(x,z,d,width,spring,crown,mat=darkMasonry){
 const h=crown-spring,r=width/2;
 const shape=new THREE.Shape();
 shape.moveTo(-r,spring);
 for(let i=1;i<=18;i++){
  const angle=Math.PI*(1-i/18);
  shape.lineTo(r*Math.cos(angle),spring+h*Math.sin(angle));
 }
 shape.lineTo(r,crown+.12);shape.lineTo(-r,crown+.12);shape.closePath();
 const g=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false});
 const uv=g.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.42,uv.getY(i)*.4);
 add(g,mat,x,0,z-d/2);
 for(const side of [-1,1])for(let i=0;i<17;i++){
  const from=Math.PI*i/17,to=Math.PI*(i+1)/17;
  const point=a=>vec(x+(r+.12)*Math.cos(a),spring+(h+.12)*Math.sin(a),z+side*(d/2+.04));
  beamBetween(point(from),point(to),.12,baseStone,7);
 }
}

export function lineDistance(x,z,coords){
 let distance=Infinity;
 for(let i=1;i<coords.length;i++)distance=Math.min(distance,distSegment(x,z,[coords[i-1],coords[i]]));
 return distance;
}

export function pointInPolygon(x,z,points){
 let inside=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [a,b]=points[i],[c,d]=points[j];
  if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)inside=!inside;
 }
 return inside;
}

export function add(geometry,mat,x=0,y=0,z=0,{solid=false,shadow=true}={}){
 const m=new THREE.Mesh(geometry,mat);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;scene.add(m);staticMeshes.push(m);
 if(solid)solids.push(m);
 return m;
}

export function box(x,y,z,w,h,d,mat,solid=false,shadow=true){
 return add(new THREE.BoxGeometry(w,h,d),mat,x,y,z,{solid,shadow});
}

export function slab(x,z,w,d,mat=paved,y=.02){
 const g=new THREE.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);
 const uv=g.attributes.uv;
 for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w*.36+x*.36,uv.getY(i)*d*.36-z*.36);
 return add(g,mat,x,y,z,{shadow:false});
}

export function polygon(points,y,h,mat,solid=false){
 const shape=new THREE.Shape();
 points.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));
 shape.closePath();
 const g=h?new THREE.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false}):new THREE.ShapeGeometry(shape);
 g.rotateX(-Math.PI/2);
 if(mat===darkMasonry||mat===gardenPebbles||mat.map&&mat!==roofGold){
  const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
  for(let i=0;i<p.count;i++)uv.setXY(i,(Math.abs(n.getX(i))>.5?p.getZ(i):p.getX(i))*.45,(Math.abs(n.getY(i))>.5?p.getZ(i):p.getY(i))*.47);
 }
 const object=add(g,mat,0,y,0,{solid,shadow:!!h});
 if(solid)object.userData.outline=points;
 return object;
}

export function bounds(points){
 let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity;
 for(const [x,z] of points){a=Math.min(a,x);b=Math.min(b,z);c=Math.max(c,x);d=Math.max(d,z)}
 return [(a+c)/2,(b+d)/2,c-a,d-b];
}

export function area(points){
 return Math.abs(points.reduce((sum,[x,z],i)=>{
  const [u,v]=points[(i+1)%points.length];return sum+x*v-u*z;
 },0))*.5;
}

export function buildPrimitives(){
walkSurfaces=[];
}

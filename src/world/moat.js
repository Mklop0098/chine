// Mặt đất, hào nước chìm có kè đá, cầu qua hào, nền vườn.
import * as THREE from 'three';
import {add,bounds,box,polygon} from '../builders/primitives.js';
import {data} from '../data.js';
import {baseStone,darkMasonry,groundTex,lawn,stone,water} from '../materials/textures.js';
import {edgeBox} from './mappedBuildings.js';

export let sideX,sideZ,moatOffset,moatWidth,moatIn,moatOut,wuHalf,moatY,moatPoly,groundMat;

export function moatBridge(x,z,w,d){
 const along=d>w;
 box(x,-.62,z,w,1.3,d,stone);
 for(const s of [-1,1]){
  const bx=along?x+s*(w/2-.25):x,bz=along?z:z+s*(d/2-.25);
  box(bx,.62,bz,along?.42:w,1.1,along?d:.42,stone);
  box(bx,1.22,bz,along?.55:w,.12,along?d:.55,baseStone);
  const n=Math.floor((along?d:w)/2.4);
  for(let i=0;i<=n;i++){const t=(i/n-.5)*(along?d:w);box(along?bx:x+t,.82,along?z+t:bz,.5,1.5,.5,baseStone)}
 }
}

export function eastZWall(){return bounds(data.sites['40343947'][1])[1]}

export function westZWall(){return bounds(data.sites['40343947'][1])[1]+1}

export function buildMoat(){
sideX=376.5;
sideZ=480.5;
moatOffset=17;
moatWidth=52;
moatIn=[sideX+moatOffset,sideZ+moatOffset];
moatOut=[sideX+moatOffset+moatWidth,sideZ+moatOffset+moatWidth];
wuHalf=64.5;
moatY=-1.65;
moatPoly=[
 [-wuHalf,moatOut[1]],[-moatOut[0],moatOut[1]],[-moatOut[0],-moatOut[1]],[moatOut[0],-moatOut[1]],[moatOut[0],moatOut[1]],[wuHalf,moatOut[1]],
 [wuHalf,moatIn[1]],[moatIn[0],moatIn[1]],[moatIn[0],-moatIn[1]],[-moatIn[0],-moatIn[1]],[-moatIn[0],moatIn[1]],[-wuHalf,moatIn[1]]
];
groundMat=new THREE.MeshStandardMaterial({map:groundTex,color:'#d9d3c3',roughness:1});
{
 const shape=new THREE.Shape(),G=7000;
 shape.moveTo(-G,G);shape.lineTo(G,G);shape.lineTo(G,-G);shape.lineTo(-G,-G);shape.closePath();
 const hole=new THREE.Path();moatPoly.forEach(([x,z],i)=>i?hole.lineTo(x,-z):hole.moveTo(x,-z));hole.closePath();shape.holes.push(hole);
 const g=new THREE.ShapeGeometry(shape);g.rotateX(-Math.PI/2);
 const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*.14,uv.getY(i)*.14);
 add(g,groundMat,0,-.06,0,{shadow:false});
}
polygon(moatPoly,moatY,0,water);
for(let i=0;i<moatPoly.length;i++){
 const a=moatPoly[i],b=moatPoly[(i+1)%moatPoly.length];
 const outer=(Math.abs(a[0])===moatOut[0]&&Math.abs(b[0])===moatOut[0])||(Math.abs(a[1])===moatOut[1]&&Math.abs(b[1])===moatOut[1]&&Math.abs(a[0])+Math.abs(b[0])>2*wuHalf+1);
 edgeBox(a,b,0,(moatY-.8+.1)/2,.1-(moatY-.8),1.3,darkMasonry);
 edgeBox(a,b,0,.2,.22,1.7,stone);
 if(outer){
  edgeBox(a,b,0,.78,.95,.42,stone);
  edgeBox(a,b,0,1.31,.12,.56,baseStone);
 }
}
moatBridge(0,-523.5,24,52);
for(const s of [-1,1])moatBridge(s*(moatIn[0]+moatWidth/2),s>0?eastZWall():westZWall(),52,16);
for(const p of data.gardens)polygon(p,.038,0,lawn);
}

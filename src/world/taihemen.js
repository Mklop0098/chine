import * as THREE from 'three';
import {hall} from '../builders/hall.js';
import {studDoor,windowMat} from '../builders/ornaments.js';
import {add,box,surfaceRect} from '../builders/primitives.js';
import {grandStair} from '../builders/stairs.js';
import {baseStone,carvedStone,deep,paintedBeam,paleCourt,red,wallRed} from '../materials/textures.js';

const PLATFORM_Y=1.45;
const PLATFORM_WIDTH=56.4;
const PLATFORM_DEPTH=29.6;
const PLATFORM_CAP_HEIGHT=.15;
const PLATFORM_CAP_OVERHANG=.03;
const BAY=6.15;
const STAIR_WIDTH=4.3;
const SIDE_STAIR_WIDTH=3.4;
const RAIL_HEIGHT=.82;
const marble=new THREE.MeshStandardMaterial({color:'#d9d7ce',roughness:.85});

function stoneRail(x,z,length,y,alongZ=false){
 const count=Math.ceil(length/2.5);
 const span=length/count;
 const place=(u,height,w,h,d,mat,solid=false)=>alongZ
  ?box(x,height,z+u,d,h,w,mat,solid)
  :box(x+u,height,z,w,h,d,mat,solid);
 for(let i=0;i<=count;i++){
  const at=i*span-length/2;
  place(at,y+RAIL_HEIGHT*.52,.24,RAIL_HEIGHT,.25,marble,true);
  place(at,y+RAIL_HEIGHT+.035,.33,.12,.33,carvedStone);
 }
 for(let i=0;i<count;i++){
  const at=(i+.5)*span-length/2;
  place(at,y+.34,span-.18,.39,.15,carvedStone,true);
  place(at,y+.64,span-.14,.11,.23,marble,true);
 }
}

function stair(x,z,width,run,side,alongX=false){
 const count=Math.ceil(PLATFORM_Y/.18);
 for(let i=0;i<count;i++){
  const y=PLATFORM_Y*(i+1)/count;
  // Meet the cap edge without overlapping its coplanar top face.
  const trim=i===count-1?PLATFORM_CAP_OVERHANG+.0125:0;
  const offset=side*(run-(i+.5)*run/count+trim/2);
  const depth=run/count+.025-trim;
  const [cx,cz,w,d]=alongX?[x+offset,z,depth,width]:[x,z+offset,width,depth];
  const step=box(cx,y/2,cz,w,y,d,marble,true);
  step.userData.step=true;
  surfaceRect(cx,cz,w,d,y);
  for(const flank of [-1,1]){
   const edge=flank*(width/2+.11);
   if(alongX)box(cx,y+.11,cz+edge,depth,.25,.19,baseStone,true);
   else box(cx+edge,y+.11,cz,.19,.25,depth,baseStone,true);
  }
 }
}

export function buildTaihemen(x,z,top){
 const y=PLATFORM_Y,w=PLATFORM_WIDTH,d=PLATFORM_DEPTH;
 // Stop the marble base below the paving so only the cap draws at floor level.
 const baseHeight=y-PLATFORM_CAP_HEIGHT+.01;
 box(x,baseHeight/2,z,w,baseHeight,d,marble,true);
 box(x,y-PLATFORM_CAP_HEIGHT/2,z,w+2*PLATFORM_CAP_OVERHANG,PLATFORM_CAP_HEIGHT,d+2*PLATFORM_CAP_OVERHANG,paleCourt,true);
 surfaceRect(x,z,w,d,y);
 hall(x,z,9*BAY/.91,27,y,top,{style:'hip-gable',double:true,bays:9,open:true,ornate:true,sign:'太和門'});
 const height=(top-y)*.49;
 const screenZ=z-27*.39;
 for(let i=0;i<9;i++){
  const xx=x+(i-4)*BAY;
  const passage=i>=3&&i<=5;
  const head=y+height*.73;
  box(xx,(head+y+height)/2,screenZ,BAY,height*.27,.43,wallRed,true);
  if(passage){
   const width=STAIR_WIDTH+.6;
   const jamb=(BAY-width)/2;
   for(const side of [-1,1]){
    box(xx+side*(width+jamb)/2,(head+y)/2,screenZ,jamb,head-y,.53,red,true);
    // Fold each leaf toward the covered porch so the three passages stay walkable.
    const leaf=box(xx+side*(width/2-.15),y+(head-y)*.47,screenZ+width*.22,width*.48,(head-y)*.94,.16,studDoor,true);
    leaf.rotation.y=Math.PI/2;
   }
   box(xx,head-.12,screenZ,width,.24,.65,paintedBeam,true);
  }else{
   const sill=height*.29;
   box(xx,y+sill/2,screenZ,BAY,sill,.56,wallRed,true);
   box(xx,(head+y+sill)/2,screenZ,BAY*.95,head-y-sill,.49,windowMat,true);
   box(xx,y+sill,screenZ,BAY,.18,.62,red);
  }
 }
 for(const side of [-1,1]){
  const sx=x+side*BAY*4.5;
  const screenDepth=27*.78;
  box(sx,y+height*.24,z,.44,height*.48,screenDepth,wallRed,true);
  box(sx,y+height*.65,z,.36,height*.34,screenDepth,windowMat,true);
  box(sx,y+height*.91,z,.42,height*.18,screenDepth,deep,true);
  for(const row of [-1,0,1]){
   const zz=z+row*screenDepth/4;
   for(const line of [-1,1])add(new THREE.CylinderGeometry(.29,.36,height,12),red,x+line*BAY*1.5,y+height/2,zz,{solid:true});
  }
  const front=z+side*d/2;
  const gaps=[-BAY,0,BAY].map(offset=>x+offset);
  let start=x-w/2;
  // Ba cầu thang trước / sau cổng: thành bên đặc, lan can trụ đầu tròn (giống cầu thang các cổng bên).
  for(const center of gaps){
   const end=center-STAIR_WIDTH/2-.7;
   stoneRail((start+end)/2,front,end-start,y);
   grandStair(center,front,side,STAIR_WIDTH,y,6,'z');
   start=center+STAIR_WIDTH/2+.7;
  }
  const end=x+w/2;
  stoneRail((start+end)/2,front,end-start,y);
  const edge=x+side*w/2;
  const flank=(d-SIDE_STAIR_WIDTH)/2-.16;
  for(const end of [-1,1])stoneRail(edge,z+end*(d/2-flank/2),flank,y,true);
  stair(edge,z,SIDE_STAIR_WIDTH,4,side,true);
 }
}

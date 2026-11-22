import {EAST_SIX_COURTS,EAST_ANNEXES} from '../core/eastSixLayout.js';
import {WEST_SIX_CROSS_PASSAGES} from '../core/westSixLayout.js';
import {buildPalaceCourts} from './westSix.js';
import {buildLWall} from './walls.js';
import {buildQianqingmen} from './landmarks.js';
import {hall} from '../builders/hall.js';
import {uGallery} from './yangxin.js';
import {box,slab,surfaceRect} from '../builders/primitives.js';
import {grandStair} from '../builders/stairs.js';
import {baseStone,grayCourt,paleCourt} from '../materials/textures.js';

export function buildEastSix(){
 slab(122.5,-290,12,152,grayCourt,.03);
 for(const {z,width,rear,front} of WEST_SIX_CROSS_PASSAGES){
  slab(122.5,z,105,width,grayCourt,.03);
  buildLWall([[70,rear],[70,front]]);
 }
 buildPalaceCourts(EAST_SIX_COURTS);
 // Hành lang 10 m giữa Đông Lục Cung và viện phụ: không có tường ngang chắn đầu.
 slab(180,-290,10,152,grayCourt,.03);
 // Hai cổng C ở đầu bắc các hành lang, cùng hàng với tường sau các cung.
 for(const [left,right] of [[116.5,128.5],[175,185]]){
  const x=(left+right)/2,z=-366,width=7.6;
  buildLWall([[left,z],[x-width/2,z]]);
  buildLWall([[x+width/2,z],[right,z]]);
  buildQianqingmen(x,z,width,3.5,0,5.7,{
   singleDoor:true,singleDoorWidth:.55,columnBays:1,sign:'',openCenter:true,
  });
 }
 // Mỗi viện chỉ có một tường bao; bỏ vòng tường ngoài cũ gây tường kép.
 for(const [index,c] of EAST_ANNEXES.entries()){
  const x=(c.left+c.right)/2,width=c.gateWidth;
  slab(x,(c.rear+c.front)/2,c.right-c.left,c.front-c.rear,grayCourt,.027);
  // Khép cả cạnh sau dãy chữ U; một tuyến bao chung thân và mái tại các góc.
  buildLWall([[x-width/2,c.front],[c.left,c.front],[c.left,c.rear],
   [c.right,c.rear],[c.right,c.front],[x+width/2,c.front]]);
  // Cổng ba lối trên tuyến ngang, không còn cổng đơn bé lọt giữa một tường dài.
  buildQianqingmen(x,c.front,width,4.5,0,7.5,{
   singleDoor:false,columnBays:5,sign:'',openCenter:true,
  });
  const {w,d}=c,y=.6;
  box(x,y/2,c.main,w+2,y,d+2,baseStone,true);surfaceRect(x,c.main,w+2,d+2,y);
  hall(x,c.main,w,d,y,c.top,{double:index>0,bays:3,ornate:true,style:index===0?'hipped':'hip-gable'});
  grandStair(x,c.main+(d+2)/2,1,3.6,y,1.8,'z');
  if(index>0){
   const smallZ=c.rear+11.5;
   box(x,.15,smallZ,13,.3,7,baseStone,true);
   surfaceRect(x,smallZ,13,7,.3);
   hall(x,smallZ,12,6,.3,7,{bays:3,ornate:true,style:'hipped'});
   uGallery([[c.left+3.8,c.front-8],[c.left+3.8,c.rear+3],
    [c.right-3.8,c.rear+3],[c.right-3.8,c.front-8]]);
   slab(x,(smallZ+3+c.main-d/2)/2,2.4,c.main-d/2-smallZ-3,paleCourt,.055);
  }else{
   for(const side of [c.left+3.8,c.right-3.8])uGallery([[side,c.rear+11],[side,c.front-8]]);
  }
  slab(x,(c.main+d/2+c.front)/2,3,c.front-c.main-d/2,paleCourt,.055);
 }
 // Dãy ngang nhỏ giữa viện phía bắc và hai viện phía nam.
 uGallery([[188.8,-318.5],[224.7,-318.5]]);
 for(const [a,b] of [[-330,-307],[-271,-261]])buildLWall([[228.5,a],[228.5,b]]);
}

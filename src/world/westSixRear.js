import {WEST_REAR_BOUNDS,WEST_REAR_HALLS,WEST_REAR_WINGS,WEST_REAR_EAST_PATH_Z} from '../core/westSixRearLayout.js';
import {buildLWall} from './walls.js';
import {buildQianqingmen} from './landmarks.js';
import {hall} from '../builders/hall.js';
import {uGallery} from './yangxin.js';
import {box,slab,surfaceRect} from '../builders/primitives.js';
import {grandStair} from '../builders/stairs.js';
import {baseStone,grayCourt,paleCourt} from '../materials/textures.js';

export function buildWestSixRear(){
 const {left,right,rear,front}=WEST_REAR_BOUNDS;
 slab((left+right)/2,(rear+front)/2,right-left,front-rear,grayCourt,.027);
 // Tường bắc/đông dùng chung tuyến ngoài hiện có, tránh hai lớp mái đè nhau.
 const gates=[-151,-118],width=5.6;
 buildLWall([[left,rear],[left,front],[gates[0]-width/2,front]]);
 buildLWall([[gates[0]+width/2,front],[gates[1]-width/2,front]]);
 buildLWall([[gates[1]+width/2,front],[right,front]]);
 for(const x of gates){
  buildQianqingmen(x,front,width,3.2,0,5.7,{
   singleDoor:true,singleDoorWidth:.55,columnBays:1,sign:'',openCenter:true,
  });
  slab(x,front+2.25,3,4.5,paleCourt,.055);
 }
 for(const [x,z,w,d,top,double] of WEST_REAR_HALLS){
  const y=.35;
  box(x,y/2,z,w+1,y,d+1,baseStone,true);
  surfaceRect(x,z,w+1,d+1,y);
  hall(x,z,w,d,y,top,{double,bays:w>18?5:3,ornate:true,style:'hip-gable'});
  grandStair(x,z+(d+1)/2,1,3,y,1.1,'z');
 }
 for(const path of WEST_REAR_WINGS)uGallery(path);
 // Các nhánh đá nối trước nhà, chừa các khe ngang thông giữa ba dải.
 for(const [x,a,b] of [[-151,-416.5,-410.5],[-151,-401.5,-392],[-151,-381,-370.5],
  [-118,-416.5,-411.5],[-118,-402.5,-393],[-118,-382,-370.5]])
  slab(x,(a+b)/2,3,b-a,paleCourt,.055);
 slab(-118,-374.8,97,3,grayCourt,.03);
 // Hai khoảng nhà vừa bỏ trở thành lối đá ngang trong dải phía đông.
 for(const z of WEST_REAR_EAST_PATH_Z)slab(-83.1,z,27.8,3,paleCourt,.055);
}

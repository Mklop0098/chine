import {WEST_SIX_COURTS,WEST_SIX_CROSS_PASSAGES} from '../core/westSixLayout.js';
import {buildLWall} from './walls.js';
import {buildQianqingmen} from './landmarks.js';
import {uGallery} from './yangxin.js';
import {hall} from '../builders/hall.js';
import {grandStair} from '../builders/stairs.js';
import {box,slab,surfaceRect} from '../builders/primitives.js';
import {baseStone,grayCourt,paleCourt} from '../materials/textures.js';
import {buildGuanyinStatue} from './guanyinStatue.js';

export function buildWestSix(){
 // Trục giao thông giữa hai hàng cung và các lối ngang giữa ba hàng sân.
 slab(-121,-290,12,152,grayCourt,.03);
 for(const passage of WEST_SIX_CROSS_PASSAGES)slab(-120.375,passage.z,104.25,passage.width,grayCourt,.03);
 // Khép các khe giao ngang ở tường ranh phía đông, không dựng đè lên mái sân.
 for(const {rear,front} of WEST_SIX_CROSS_PASSAGES)buildLWall([[-68.25,rear],[-68.25,front]]);
 // Cổng cuối hành lang giữa hai hàng cung, cùng tuyến tường nam của Thái Cực/Vĩnh Thọ.
 const centerGateX=-121,centerGateZ=-214,centerGateWidth=7.6;
 buildLWall([[-127,centerGateZ],[centerGateX-centerGateWidth/2,centerGateZ]]);
 buildLWall([[centerGateX+centerGateWidth/2,centerGateZ],[-115,centerGateZ]]);
 buildQianqingmen(centerGateX,centerGateZ,centerGateWidth,3.5,0,5.7,{
  singleDoor:true,singleDoorWidth:.55,columnBays:1,sign:'',openCenter:true,
 });
 buildPalaceCourts(WEST_SIX_COURTS);
}

export function buildPalaceCourts(courts){
 for(const c of courts){
  const {left,right,rear,front,x,mainZ}=c;
  const largeGate=c.id==='40631817';
  const width=largeGate?11.5:7.6,half=width/2;
  slab(x,(rear+front)/2,right-left,front-rear,grayCourt,.025);
  // Chỉ giữ cổng chính ra hành lang ngang; bỏ toàn bộ cổng hông gạch X.
  buildLWall([[x-half,front],[left,front],[left,rear],[right,rear],[right,front],[x+half,front]]);
  buildQianqingmen(x,front,width,largeGate?4.8:3.5,0,largeGate?7.5:5.7,{
   singleDoor:!largeGate,singleDoorWidth:.55,columnBays:largeGate?5:1,sign:'',openCenter:true,
  });
  // Điện chính, nền thấp có bậc lên; mặt điện và cổng cùng trục giữa sân.
  const mainW=c.mainWidth??(c.id==='40631832'?20.4:26),mainD=c.statue?12:11.8,y=.6;
  if(c.statue){
   buildGuanyinStatue(x,mainZ);
  }else{
  box(x,y/2,mainZ,mainW+1.4,y,mainD+1.4,baseStone,true);
  surfaceRect(x,mainZ,mainW+1.4,mainD+1.4,y);
  hall(x,mainZ,mainW,mainD,y,13.2,{
   double:true,bays:5,ornate:true,style:'hip-gable',sign:c.sign,
  });
  grandStair(x,mainZ+(mainD+1.4)/2,1,4.2,y,1.8,'z');
  }
  if(c.rearHall){
   const z=rear+5.3;
   box(x,.2,z,27.4,.4,7.4,baseStone,true);
   hall(x,z,26,6,.4,8.5,{bays:5,ornate:true,style:'hip-gable'});
   slab(x,(z+3+mainZ-mainD/2)/2,3,mainZ-mainD/2-z-3,paleCourt,.055);
  }else{
   // Dãy hậu ngang gọn, thay các mái phụ ghép lộn xộn ở Trường Xuân/Thái Cực.
   uGallery([[left+4.1,rear+5.3],[right-4.1,rear+5.3]]);
  }
  // Hai cặp nhà phụ song song tường, đối xứng và chừa khoảng trước cổng hông.
  for(const sx of [left+4.1,right-4.1]){
   uGallery([[sx,rear+10.5],[sx,rear+23]]);
   uGallery([[sx,rear+27],[sx,front-11]]);
  }
  slab(x,(mainZ+mainD/2+front)/2,3,front-mainZ-mainD/2,paleCourt,.055);
 }
}

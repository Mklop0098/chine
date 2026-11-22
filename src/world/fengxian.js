import {FENGXIAN_MAIN,FENGXIAN_SIDE_GATE} from '../core/fengxianLayout.js';
import {buildLWall} from './walls.js';
import {buildQianqingmen} from './landmarks.js';
import {hall} from '../builders/hall.js';
import {uGallery,westGate} from './yangxin.js';
import {grandStair} from '../builders/stairs.js';
import {box,slab,surfaceRect} from '../builders/primitives.js';
import {baseStone,grayCourt,paleCourt,stone,wallRed} from '../materials/textures.js';

function platformHall(x,z,w,d,y,top,{stairs=true,...options}={}){
 box(x,y/2,z,w+2,y,d+2,baseStone,true);
 surfaceRect(x,z,w+2,d+2,y);
 hall(x,z,w,d,y,top,{bays:7,ornate:true,style:'hip-gable',...options});
 if(stairs)for(const dx of [-8,0,8])grandStair(x+dx,z+(d+2)/2,1,4.2,y,2.2,'z');
}

export function buildFengxian(){
 const left=151.5,right=228.5,rear=-204,front=-69,x=FENGXIAN_MAIN.x;
 // Lùi mép sau để có hành lang ngang 10 m trước Đông Lục Cung.
 slab(149.25,-209,158.5,10,grayCourt,.03);
 slab((left+right)/2,(rear+front)/2,right-left,front-rear,grayCourt,.028);
 // Một tuyến bao liên tục, thay các dãy nhà dài che kín mép phải sân.
 const sideGate=FENGXIAN_SIDE_GATE;
 buildLWall([[left,sideGate.z-sideGate.width/2],[left,rear],[right,rear],
  [right,front],[left,front],[left,sideGate.z+sideGate.width/2]]);
 for(const gx of [sideGate.left,sideGate.right])westGate(gx,sideGate.z,sideGate.width);
 // Hai điện trên cùng trục, không còn khối nhà phụ gắn trước điện chính.
 platformHall(x,-192,46,16,1,16.5);
 platformHall(x,FENGXIAN_MAIN.z,FENGXIAN_MAIN.w,FENGXIAN_MAIN.d,1.2,21,{
  double:true,sign:'奉先殿',
 });
 slab(x,-178.25,5,7.5,paleCourt,.055);
 slab(x,-133,5,28,paleCourt,.055);
 // Dãy cổng nhiều gian: mái chạy ngang trên hàng cột, các gian để thông sân.
 const gateZ=-116,gateW=58;
 buildLWall([[left,gateZ],[x-gateW/2,gateZ]]);
 buildLWall([[x+gateW/2,gateZ],[right,gateZ]]);
 hall(x,gateZ,gateW,4.8,0,7.8,{
  open:true,bays:7,columnBays:7,ornate:true,style:'hip-gable',
 });
 slab(x,-102,4,28,paleCourt,.055);
 // Sân thứ hai khép bằng tường thấp, hai trụ đá và lối giữa không mái.
 const lowGate=-88,opening=5;
 for(const [a,b] of [[left,x-opening/2],[x+opening/2,right]]){
  box((a+b)/2,.8,lowGate,b-a,1.6,.8,wallRed,true);
  box((a+b)/2,1.68,lowGate,b-a,.16,1.05,stone);
 }
 for(const side of [-1,1])box(x+side*(opening/2+.35),1.15,lowGate,.7,2.3,.9,stone,true);
 // Dãy nhà cuối khu, tách khỏi sân trước bằng khoảng trống đúng bản vẽ.
 platformHall(x,-75.5,53,6,.3,7.3,{double:false,bays:9,stairs:false});
 // Viện hẹp giữa Trai Cung và điện: bốn nhà nhỏ, hai dãy phụ thẳng hàng.
 const sideLeft=116.2,sideRight=151.5,sideX=(sideLeft+sideRight)/2,sideFront=-138,width=7.6;
 slab(sideX,-171,sideRight-sideLeft,66,grayCourt,.026);
 // Cạnh đông dùng chung tường bao điện, không dựng đè thêm một lớp mái.
 buildLWall([[sideX-width/2,sideFront],[sideLeft,sideFront],[sideLeft,rear],[sideRight,rear]]);
 buildLWall([[sideX+width/2,sideFront],[sideRight,sideFront]]);
 buildQianqingmen(sideX,sideFront,width,3.5,0,5.7,{
  singleDoor:true,singleDoorWidth:.55,columnBays:1,sign:'',openCenter:true,
 });
 for(const z of [-198,-182,-166,-150]){
  box(sideX,.15,z,17,.3,8,baseStone,true);
  hall(sideX,z,16,7,.3,7.5,{bays:3,ornate:true,style:'hip-gable'});
 }
 for(const sx of [120.3,147.4])uGallery([[sx,-202],[sx,-142]]);
 // Trai Cung: hai điện và hai dãy phụ thẳng thay các mảnh mái đỏ ghép lệch.
 const traiX=93.1,traiFront=-138;
 slab(traiX,-171,46.2,66,grayCourt,.027);
 buildLWall([[traiX-width/2,traiFront],[70,traiFront],[70,rear],[sideLeft,rear]]);
 // Tường phía đông dùng chung với viện bốn nhà, không dựng thêm mái chồng.
 buildLWall([[traiX+width/2,traiFront],[sideLeft,traiFront]]);
 buildQianqingmen(traiX,traiFront,width,3.5,0,5.7,{
  singleDoor:true,singleDoorWidth:.55,columnBays:1,sign:'',openCenter:true,
 });
 platformHall(traiX,-193,23,9,.5,10);
 platformHall(traiX,-168,25,12,.8,13.2,{double:true,sign:'齋宮',bays:5});
 for(const sx of [74.5,111.5])uGallery([[sx,-197],[sx,-149]]);
 slab(traiX,-180,3,10,paleCourt,.055);
 slab(traiX,-151.5,3,27,paleCourt,.055);
 // Nhà gạch X đã bỏ: khép lại sân ngoài bằng một tường ngang dài tới Phụng Tiên.
 buildLWall([[70,-116],[left,-116]]);
}

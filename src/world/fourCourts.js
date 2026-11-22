// Bốn sân theo thiết kế: tường đỏ mái hai dốc, cổng mở trên mép trước.
import {buildLWall} from './walls.js';
import {buildQianqingmen} from './landmarks.js';
import {FOUR_COURT_DIVISIONS,FOUR_COURT_CENTERS} from '../core/fourCourtsLayout.js';

export function buildFourCourts(){
 const rear=-205,front=-163,left=-262.2;
 // Các tường phân sân thay cho nhà phụ, không đặt tường ngang qua trục điện.
 const divisions=FOUR_COURT_DIVISIONS;
 const gateCenters=FOUR_COURT_CENTERS,width=7.6;
 // Tường hậu và góc đông dùng chung tuyến liên tục dựng trong shoukang.js.
 buildLWall([[gateCenters[0]-width/2,front],[left,front],[left,rear]]);
 for(const x of divisions.slice(1,-1))buildLWall([[x,rear],[x,front]]);
 let start=left;
 for(const x of gateCenters){
  if(x!==gateCenters[0])buildLWall([[start,front],[x-width/2,front]]);
  buildQianqingmen(x,front,width,3.5,0,5.7,{
   singleDoor:true,singleDoorWidth:.55,columnBays:1,sign:'',openCenter:true,
  });
  start=x+width/2;
 }
}

import {box,polygon,slab,surfaceRect} from '../builders/primitives.js';
import {hall,terraceRails} from '../builders/hall.js';
import {grandStair} from '../builders/stairs.js';
import {baseStone,grayCourt,paleCourt} from '../materials/textures.js';
import {buildQianqingmen} from './landmarks.js';
import {buildLWall} from './walls.js';
import {uGallery,westGate} from './yangxin.js';

export const CINING_GROUNDS=[[-261,-161],[-181,-161],[-181,-60],[-261,-60]];
export const CINING_TREES=[[-243,-96],[-199,-96],[-244,-136],[-198,-136]];
export const CINING_PLATFORM=[[-247.5,-155],[-194.5,-155],[-194.5,-99.9],[-247.5,-99.9]];
export const CINING_PLATFORM_HEIGHT=2.4;

function sharedPlatform(){
 const x=-221,y=CINING_PLATFORM_HEIGHT,front=-99.9,rear=-155;
 box(x,y/2,(front+rear)/2,53,y,front-rear,baseStone,true);
 polygon(CINING_PLATFORM,y,.025,grayCourt);
 surfaceRect(x,(front+rear)/2,53,front-rear,y);
 const stairs=[x-8,x,x+8];
 for(const center of stairs)grandStair(center,front,1,4.6,y,5.5,'z');
 terraceRails(CINING_PLATFORM,y,front,false,0,(px,pz)=>
  Math.abs(pz-front)<.4&&stairs.some(cx=>Math.abs(px-cx)<3.2));
}

export function buildCining(){
 polygon(CINING_GROUNDS,0,.025,grayCourt);
 // Hai cặp chữ L: chung một thân và mái vát nối kín ở từng góc.
 const upper=[[-254,-99],[-254,-150],[-244,-150]];
 // Đưa nhánh ngang ra phía trước 6 m để cùng hàng với cổng nhỏ;
 // kéo dài cánh dọc để vẫn nối liền khối nhà bên hông.
 const lower=[[-254,-81],[-254,-61],[-232.5,-61]];
 const mirror=path=>path.map(([x,z])=>[-442-x,z]);
 for(const path of [upper,mirror(upper),lower,mirror(lower)])uGallery(path);

 // Hai điện cùng một nền, không còn thang hay lan can chia cắt sân giữa.
 sharedPlatform();
 hall(-221,-115.4,37,21.8,CINING_PLATFORM_HEIGHT,18,{
  double:true,bays:7,ornate:true,style:'hip-gable',sign:'慈寧宮',
 });
 // Dịch điện sau về trước 6 m, chừa lối sau mái và sân phía bắc.
 hall(-221,-146,41.5,13,CINING_PLATFORM_HEIGHT,15.1,{
  bays:7,ornate:true,style:'hip-gable',
 });
 // Cổng chính có nền cao, cửa giữa mở và bậc lên ở hai mặt.
 buildQianqingmen(-221,-66.4,25.2,13.4,1.2,11.5,{sign:'慈寧門'});
 // Trục lát đá trắng nối chân thang cổng, điện chính và điện sau.
 slab(-221,-86,5.8,17.6,paleCourt,.055);
 slab(-221,-132.9,5.8,13.2,paleCourt,CINING_PLATFORM_HEIGHT+.055);

 // Tường mỏng mái hai dốc tạo hành lang dọc bên đông; cổng ở đầu nam.
 // Khép góc sân phụ và trổ cửa thông ngang đúng vị trí đánh dấu.
 buildLWall([[-177,-163],[-177,-73.7]]);
 buildLWall([[-177,-69.3],[-177,-61],[-157.9,-61]]);
 westGate(-177,-71.5,4.4);
 buildLWall([[-177,-61],[-177.9,-61]]);
 // Cổng nằm giữa mép dãy chữ L và tường ngoài, cùng trục hành lang.
 buildQianqingmen(-181.2,-61,6.6,3.5,0,5.7,{
  singleDoor:true,singleDoorWidth:.55,columnBays:1,sign:'',
 });
}

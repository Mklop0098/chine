import {buildLWall} from './walls.js';
import {buildQianqingmen} from './landmarks.js';
import {uGallery} from './yangxin.js';
import {hall} from '../builders/hall.js';
import {slab} from '../builders/primitives.js';
import {baseStone,lawn,paleCourt} from '../materials/textures.js';
import {FOUR_COURT_CENTERS} from '../core/fourCourtsLayout.js';

export const SHOUKANG_GROUNDS=[[-316.5,-205],[-266,-205],[-266,-58.3],[-316.5,-58.3]];
export const SHOUKANG_TREES=[
 [-304,-182.5],[-299,-183.5],[-276,-182.5],[-281,-183.5],
 [-304,-157],[-302,-151],[-274,-157],[-276,-151],
 [-304,-116],[-299,-113],[-277,-113],[-272,-116],
 [-303,-99],[-300,-94],[-304,-88],[-299,-82],[-294,-83],
 [-278,-99],[-282,-94],[-273,-88],[-278,-82],[-284,-83],
];

export function buildShoukang(){
 const east=-266,width=7.6;
 // Mép thân dãy nhà phía tây Từ Ninh: tâm x=-254, nửa bề dày 2,7 m.
 // Ba tường ngang nối tới thân nhà để khép hẳn hành lang giữa hai khu.
 const adjoiningHouseX=-256.7;
 // Tường ngang nối tới tường bao tây; bỏ tuyến tường trong chạy song song.
 // Căn mặt tường trước với mép trước dãy chữ L Từ Ninh (z=-61+2,7).
 // Lùi ranh vườn 3,5 m để nới rộng ô sân cuối.
 // Cổng sát góc nối Từ Ninh, đối ứng cổng nhỏ bên kia trục cung.
 const southGateX=-260.8,south=-58.3,gardenEnd=-79.5;
 // Chung một tường hậu với bốn sân bên cạnh: một sống mái, không ghép lệch cao độ.
 buildLWall([[FOUR_COURT_CENTERS[3]+width/2,-163],[-157.9,-163],
  [-157.9,-205],[-316.5,-205],[-316.5,south],[southGateX-width/2,south]]);
 // Dãy chữ U bao hai điện: ba cánh chung thân và mái vát liền ở hai góc.
 // Mở đầu phía trước, thay tường sau, tường phải và cổng hông gạch X.
 uGallery([[-310,-114],[-310,-190],[east,-190],[east,-114]]);
 // Hai đoạn cụt trước và sau cánh phải đã bỏ theo dấu X.
 buildLWall([[-316.5,gardenEnd],[adjoiningHouseX,gardenEnd]]);
 // Không còn tường ngăn dọc gạch X trong ô cuối.
 buildLWall([[southGateX+width/2,south],[adjoiningHouseX,south]]);
 buildQianqingmen(southGateX,south,width,3.5,0,5.7,{
  singleDoor:true,singleDoorWidth:.55,columnBays:1,sign:'',openCenter:true,
 });
 // Lầu nhỏ mái hai tầng trong ô xanh, chừa sân trước và khoảng thoáng quanh nhà.
 slab(-291,-69,24,9,baseStone,.24);
 hall(-291,-69,23,8,.24,10.5,{
  double:true,bays:5,ornate:true,style:'hip-gable',
 });
 // Cổng giữa từ sân điện xuống vườn, cũng là một vị trí C trên thiết kế.
 const center=-288;
 buildLWall([[-316.5,-105],[center-width/2,-105]]);
 buildLWall([[center+width/2,-105],[adjoiningHouseX,-105]]);
 buildQianqingmen(center,-105,width,3.5,0,5.7,{
  singleDoor:true,singleDoorWidth:.55,columnBays:1,sign:'',openCenter:true,
 });
 // Lối trung tâm để trống, hai bồn cây gom về hai phía của khu vườn.
 for(const x of [-300,-277])slab(x,-90,13,21,lawn,.04);
 slab(center,-120,3,23,paleCourt,.055);
 slab(center,-90,3,24,paleCourt,.055);
 slab(center,-157.5,3,13,paleCourt,.055);
}

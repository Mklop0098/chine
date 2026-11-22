// Tường phân khu vườn Từ Ninh và các viện nhỏ phía đông theo bản vẽ.
import {buildLWall as wall} from './walls.js';
import {buildQianqingmen} from './landmarks.js';
import {hall} from '../builders/hall.js';
import {uGallery as gallery} from './yangxin.js';
import {slab as floor} from '../builders/primitives.js';
import {baseStone,paleCourt,grayCourt} from '../materials/textures.js';
import {gardenZ,GARDEN_DEPTH_SCALE,GARDEN_STONE_PATHS} from '../core/ciningGardenLayout.js';

const buildLWall=points=>wall(points.map(([x,z])=>[x,gardenZ(z)]));
const uGallery=points=>gallery(points.map(([x,z])=>[x,gardenZ(z)]));
const slab=(x,z,w,d,mat,y)=>floor(x,gardenZ(z),w,d*GARDEN_DEPTH_SCALE,mat,y);

export const GARDEN_EAST_GROUNDS=[[-226,-54],[-143,-54],[-143,104],[-226,104]].map(([x,z])=>[x,gardenZ(z)]);
export const GARDEN_EAST_TREES=[
 [-222,-42],[-216,-32],[-221,-9],[-217,14],[-222,36],[-217,58],[-222,78],
 [-178,-45],[-162,-43],[-154,-18],[-151,7],[-150,30],[-151,55],
 [-164,91],[-155,96],[-174,97],
].map(([x,z])=>[x,gardenZ(z)]);

function smallHall(x,z,w=13,d=8,top=7.5){
 slab(x,z,w+1,d+1,baseStone,.2);
 hall(x,gardenZ(z),w,d*GARDEN_DEPTH_SCALE,.2,top,{bays:3,ornate:true,style:'hip-gable'});
}
function gate(x,z,width=5.6){
 buildQianqingmen(x,gardenZ(z),width,3.2,0,5.7,{
  singleDoor:true,singleDoorWidth:.55,columnBays:1,sign:'',openCenter:true,
 });
}

export function buildCiningGarden(){
 const rear=-54,front=89;
 const gardenBackGate=-260.8,backGateWidth=5.6;
 const corridorGateX=-219.25,corridorGateWidth=15.5;
 // Hành lang ngang trước Từ Ninh Môn mở suốt hai đầu, không có tường/cây chắn.
 floor(-231,-46.15,171,24.3,grayCourt,.028);
 // Khép tuyến ngang phía bắc theo nét xanh, nối toàn bộ các sân bằng mái hai dốc.
 // Cổng vào vườn vẫn mở; hành lang phía trước tuyến này giữ nguyên.
 buildLWall([[gardenBackGate-backGateWidth/2,rear],[-316.5,rear],
  [-316.5,104],[-145.5,104],[-145.5,rear],[corridorGateX+corridorGateWidth/2,rear]]);
 buildLWall([[gardenBackGate+backGateWidth/2,rear],[corridorGateX-corridorGateWidth/2,rear]]);
 // Cổng mái hai tầng tại đầu trục hành lang, lối giữa mở xuyên tường.
 buildQianqingmen(corridorGateX,gardenZ(rear),corridorGateWidth,5.2,0,10,{
  doubleRoof:true,columnBays:3,sign:'',openCenter:true,
 });
 // Vườn phía tây và hành lang trung tâm: giữ nguyên các điện, cây trong vườn.
 buildLWall([[-286,front],[-286,rear]]);
 buildLWall([[-228.5,rear],[-228.5,front]]);
 gate(gardenBackGate,rear,backGateWidth);
 // Cụm sân phía đông: lối ngang và lối dọc để trống giữa các nhánh tường.
 buildLWall([[-210,front],[-210,-4],[-190,-4],[-190,front]]);
 buildLWall([[-210,rear],[-210,-12],[-190,-12],[-190,-30]]);
 buildLWall([[-181,-40],[-181,-12],[-156,-12],[-156,rear]]);
 buildLWall([[-181,-4],[-181,68],[-176,68],[-176,76],[-156,76],[-156,-4]]);
 buildLWall([[-190,front],[-181,front],[-181,104]]);
 // Ba cổng trên tuyến ngang: vườn, hành lang rộng, sân bốn nhà.
 const centers=[-258.4,-219.25,-200],width=5.6;
 // Bỏ nhánh tường gạch X trong lối dọc phía tây, bắt đầu từ mép vườn.
 let start=-286;
 for(const x of centers){
  buildLWall([[start,front],[x-width/2,front]]);
  gate(x,front,width);start=x+width/2;
 }
 buildLWall([[start,front],[-190,front]]);
 // Bốn nhà nhỏ xếp cùng trục trong viện hẹp, thay các khối dài sai bố cục.
 for(const z of [9,28,47,67])smallHall(-200,z,13,8,7.5);
 smallHall(-200,-39,12,8,7.5);
 smallHall(-168,-27,12,8,7.5);
 smallHall(-150,-43,7,6,6.3);
 smallHall(-150,-31,7,6,6.3);
 // Dãy nhà mảnh trong sân phía đông, chừa khoảng trống hai đầu.
 uGallery([[-168.5,8],[-168.5,58]]);
 // Đường đá theo hai trục thông sân và lối ngang giữa các viện.
 slab(-219.25,17,3,143,paleCourt,.055);
 slab(-185.5,37,3,102,paleCourt,.055);
 slab(-178,-8,64,3,paleCourt,.055);
 // Các đường lát trong vườn dùng tọa độ thực, nằm trên thảm cỏ mới.
 for(const path of GARDEN_STONE_PATHS)for(let i=1;i<path.length;i++){
  const [x,z]=path[i-1],[xx,zz]=path[i];
  floor((x+xx)/2,(z+zz)/2,Math.abs(xx-x)+3,Math.abs(zz-z)+3,paleCourt,.075);
 }
}

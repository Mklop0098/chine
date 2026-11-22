// Dữ liệu bản đồ (OSM đã xử lý), nạp từ public/data/forbidden-city.json trước khi dựng.

import {FOUR_COURT_CENTERS} from './core/fourCourtsLayout.js';
import {gardenZ,GARDEN_LAWN,GARDEN_STONE_PATHS} from './core/ciningGardenLayout.js';
import {WEST_SIX_COURTS,inWestSix} from './core/westSixLayout.js';
import {WEST_REAR_BOUNDS,inWestRear} from './core/westSixRearLayout.js';
import {EAST_SIX_COURTS,EAST_SIX_BOUNDS,inEastSix} from './core/eastSixLayout.js';
import {FENGXIAN_BOUNDS,FENGXIAN_MAIN,inFengxian,TRAI_BOUNDS,inTrai} from './core/fengxianLayout.js';
import {YANXI_POND_OUTLINE} from './core/yanxiPondLayout.js';

export let data;

// osmAdditions (tools/osm_sync.py): tường sân, nhà, cây bổ sung từ OSM – gộp vào các danh sách gốc.
export function setData(d){
 const x=d.osmAdditions;
 if(x){
  d.walls=[...d.walls,...x.walls];
  d.buildings=[...d.buildings,...x.buildings];
  d.mappedTrees=[...d.mappedTrees,...x.trees];
 }
 // illustration (tools/illustration_sync.py): bớt / thêm nhà cho khớp số lượng trên bản đồ minh họa.
 const il=d.illustration;
 if(il){
  const gone=new Set(il.remove);
  d.buildings=[...d.buildings.filter(b=>!gone.has(b[3])),...il.buildings];
 }
 // Dưỡng Tâm Điện được dựng lại trọn mặt bằng trong world/yangxin.js.
 const yangxinOld=new Set(['40606449','40606450','40606451','40606452','40606453',
  '40606454','40606455','40606456','40606457','40606458','40606459','40606460',
  '40606461','42509102','43512263','688124109','688124111']);
 d.buildings=d.buildings.filter(b=>!yangxinOld.has(b[3]));
 const insideYangxin=p=>p.every(([x,z])=>x>=-149&&x<=-68&&z>=-209&&z<=-115);
 d.walls=d.walls.filter(p=>!insideYangxin(p));
 // Bỏ tuyến tường tây OSM dày nằm chồng lên tường mỏng dựng tay.
 d.walls=d.walls.filter(p=>!p.every(([x,z])=>x>=-150&&x<=-145&&z>=-208&&z<=-113));
 d.gatewayBuildings=d.gatewayBuildings.filter(b=>!insideYangxin(b[0]));
 // Từ Ninh Cung: thay các dãy ghép, hai điện và cổng bằng kiến trúc dựng tay.
 const ciningOld=new Set(['40593735','40593736','40593737','40593741','40593742',
  '40593743','40593744','650780269','650780270','illus-46',
  // Các nhà gạch X dọc phía đông và những mảnh nối thuộc cùng khối nhà.
  '40605413','40605414','40605417','40605419','40605420','40605421',
  '40605424','40605425','42509078','42509079',
  // Cổng ở đầu sân được thay bằng cổng có lối đi và cánh mở trong cining.js.
  '42509080']);
 d.buildings=d.buildings.filter(b=>!ciningOld.has(b[3]));
 // Sao chép nguyên mẫu hai nhà trong sân phụ vào hai ô đánh dấu tiếp theo.
 for(const [sourceId,copyId,dz] of [
  ['40605415','cining-side-house-1-copy',-40],
  ['40605416','cining-side-house-2-copy',-37],
 ]){
  const source=d.buildings.find(b=>b[3]===sourceId);
  if(!source)continue;
  const copy=structuredClone(source),move=p=>p.map(([x,z])=>[x,z+dz]);
  copy[0]=move(copy[0]);copy[3]=copyId;
  copy[4]=copy[4].map(part=>[move(part[0]),...part.slice(1)]);
  d.buildings.push(copy);
 }
 // Bỏ hai mảng lát đá trước các nhà và các nhánh tường dư tại đầu bắc sân.
 if(d.illustration?.paths)d.illustration.paths=d.illustration.paths.filter(
  ([name])=>name!=='头所殿'&&name!=='二所殿');
 d.walls=d.walls.filter(p=>!p.every(([x,z])=>
  x>=-184&&x<=-156&&z>=-164&&z<=-156));
 // Dọn các cổng/tường vụn trên tuyến hành lang đông để dựng tường mỏng liền.
 const ciningCorridor=p=>p.every(([x,z])=>x>=-183&&x<=-175&&z>=-164&&z<=-60);
 d.walls=d.walls.filter(p=>!ciningCorridor(p));
 // Hai đoạn tường ngoài sân phụ được thay bằng tuyến chữ L liền trong cining.js.
 // Không giữ mái phẳng OSM chồng lên mái hai dốc của tuyến mới.
 d.walls=d.walls.filter(p=>!p.every(([x,z])=>x>=-159&&x<=-157&&z>=-158.2&&z<=-59.4));
 d.buildings=d.buildings.filter(b=>!ciningCorridor(b[0]));
 d.gatewayBuildings=d.gatewayBuildings.filter(b=>!ciningCorridor(b[0]));
 // Bỏ hai đoạn tường ngang dư trước các dãy chữ L.
 const ciningFront=p=>p.every(([x,z])=>x>=-263&&x<=-181&&z>=-63&&z<=-59);
 d.walls=d.walls.filter(p=>!ciningFront(p));
 // Dải tường ngang có mái dư ở chân hành lang đông.
 d.walls=d.walls.filter(p=>!p.every(([x,z])=>x>=-206&&x<=-156&&z>=-62&&z<=-59));
 d.gatewayBuildings=d.gatewayBuildings.filter(b=>!ciningFront(b[0]));
 // Cụm bốn sân phía bắc Từ Ninh: giữ các điện chính, thay nhà phụ
 // gạch X và tường/cổng ghép cũ bằng mặt bằng tường dựng trong fourCourts.js.
 const fourCourtsRemoved=new Set(['40605544','40605545','40605547','40605548',
  '40605549','40605550','40605551','40605552',
  '1008750883','1008750884','1008750885','42509064','42509075']);
 d.buildings=d.buildings.filter(b=>!fourCourtsRemoved.has(b[3]));
 const inFourCourts=p=>p.every(([x,z])=>x>=-264&&x<=-156&&z>=-205&&z<=-162);
 d.walls=d.walls.filter(p=>!inFourCourts(p));
 // Bỏ mảnh mái/tường hậu OSM lệch tuyến, thay bằng tường chung mái hai dốc.
 d.walls=d.walls.filter(p=>!p.every(([x,z])=>x>=-264&&x<=-234&&z>=-206&&z<=-203));
 // Nhánh cụt gạch X nhô ra khỏi góc tây nam cụm bốn sân.
 d.walls=d.walls.filter(p=>!p.every(([x,z])=>x>=-261&&x<=-259&&z>=-164&&z<=-156));
 d.gatewayBuildings=d.gatewayBuildings.filter(b=>!inFourCourts(b[0]));
 d.gatewayWalls=d.gatewayWalls.filter(b=>!inFourCourts(b[0]));
 // Thọ Khang Cung: thay dãy phụ, tường ghép và cổng cũ theo bản thiết kế.
 const shoukangKeep=new Set(['40593166','40593167']);
 const inShoukang=p=>p.every(([x,z])=>x>=-319&&x<=-260&&z>=-207&&z<=-59);
 d.buildings=d.buildings.filter(b=>shoukangKeep.has(b[3])||!inShoukang(b[0]));
 // Bỏ cả dãy nhà ngang trong ô cuối và dãy dọc gạch X ngay bên ngoài.
 d.buildings=d.buildings.filter(b=>!['40593159','40543888'].includes(b[3]));
 d.walls=d.walls.filter(p=>!inShoukang(p));
 d.gatewayBuildings=d.gatewayBuildings.filter(b=>!inShoukang(b[0]));
 d.gatewayWalls=d.gatewayWalls.filter(b=>!inShoukang(b[0]));
 d.mappedTrees=d.mappedTrees.filter(([x,z])=>!(x>-319&&x<-260&&z>-207&&z<-59));
 if(d.illustration?.paths)d.illustration.paths=d.illustration.paths.filter(p=>p[0]!=='Thọ Khang Cung');
 // Vườn Từ Ninh và các viện phía đông: thay tường ghép bằng tuyến dựng theo thiết kế.
 const inGardenPrecinct=p=>p.every(([x,z])=>x>=-319&&x<=-143&&z>=-58&&z<=105);
 const inGardenEast=p=>p.every(([x,z])=>x>=-226&&x<=-143&&z>=-55&&z<=102);
 d.walls=d.walls.filter(p=>!inGardenPrecinct(p));
 d.gatewayWalls=d.gatewayWalls.filter(b=>!inGardenPrecinct(b[0]));
 d.gatewayBuildings=d.gatewayBuildings.filter(b=>!inGardenPrecinct(b[0]));
 const gardenOldGates=new Set(['42509828','42509830','42509062',
  // Các mái nhà gạch X: cổng hông vườn, nhà góc tây nam và dãy nhà chữ L cuối vườn.
  '650781513','40543886','40543893']);
 d.buildings=d.buildings.filter(b=>!inGardenEast(b[0])&&!gardenOldGates.has(b[3]));
 d.mappedTrees=d.mappedTrees.filter(([x,z])=>!(x>=-226&&x<=-143&&z>=-55&&z<=104));
 if(d.illustration?.paths)d.illustration.paths=d.illustration.paths.filter(p=>
  !(p[1]>=-226&&p[1]<=-143&&p[2]>=-55&&p[3]<=104));
 // Lùi đồng bộ nhà, cây và mặt vườn; giữ mép nam để trả lại hành lang ngang phía bắc.
 for(const b of d.buildings)if(inGardenPrecinct(b[0])){
  const move=p=>p.map(([x,z])=>[x,gardenZ(z)]);
  b[0]=move(b[0]);b[4]=b[4].map(part=>[move(part[0]),...part.slice(1)]);
 }
 const moved=new Set();
 const moveGardenPoints=p=>{
  if(!inGardenPrecinct(p))return;
  for(const point of p)if(!moved.has(point)){point[1]=gardenZ(point[1]);moved.add(point);}
 };
 for(const p of d.gardens)moveGardenPoints(p);
 for(const p of d.gardenPaths)moveGardenPoints(p);
 for(const [,p] of d.landscape)if(Array.isArray(p))moveGardenPoints(p);
 for(const p of d.mappedTrees)if(p[0]>=-319&&p[0]<=-143&&p[1]>=-54&&p[1]<=104)p[1]=gardenZ(p[1]);
 for(const p of d.districtPlaces)if(p[0]==='Hàm Nhược Quán')p[2]=gardenZ(p[2]);
 for(const p of d.illustration?.paths||[])if(p[1]>=-319&&p[1]<=-143&&p[2]>=-54&&p[3]<=104){
  p[2]=gardenZ(p[2]);p[3]=gardenZ(p[3]);
 }
 // Bố cục đối xứng trong vườn Hàm Nhược Quán theo ảnh tham chiếu.
 const gardenAxis=-257.7;
 function placeGardenBuilding(id,cx,cz,w=null,depth=null){
  const b=d.buildings.find(b=>b[3]===id);if(!b)return;
  const xs=b[0].map(p=>p[0]),zs=b[0].map(p=>p[1]);
  const ox=(Math.min(...xs)+Math.max(...xs))/2,oz=(Math.min(...zs)+Math.max(...zs))/2;
  const sx=w===null?1:w/(Math.max(...xs)-Math.min(...xs));
  const sz=depth===null?1:depth/(Math.max(...zs)-Math.min(...zs));
  const move=p=>p.map(([x,z])=>[cx+(x-ox)*sx,cz+(z-oz)*sz]);
  b[0]=move(b[0]);b[4]=b[4].map(part=>[move(part[0]),...part.slice(1)]);
  return b;
 }
 function mirrorGardenBuilding(sourceId,targetId){
  const source=d.buildings.find(b=>b[3]===sourceId);if(!source)return;
  const copy=structuredClone(source),mirror=p=>p.map(([x,z])=>[2*gardenAxis-x,z]).reverse();
  copy[0]=mirror(copy[0]);copy[3]=targetId;
  copy[4]=copy[4].map(part=>[mirror(part[0]),...part.slice(1)]);
  d.buildings=d.buildings.filter(b=>b[3]!==targetId);d.buildings.push(copy);
 }
 placeGardenBuilding('40543909',gardenAxis,-20.72);
 placeGardenBuilding('40543884',gardenAxis,-3.01);
 placeGardenBuilding('40543910',-279.2,-3,6.6,23);
 mirrorGardenBuilding('40543910','40543911');
 placeGardenBuilding('40587070',-279.2,19.5,9,7);
 mirrorGardenBuilding('40587070','40587069');
 placeGardenBuilding('40587068',-279.2,49,6.6,16);
 mirrorGardenBuilding('40587068','40543894');
 placeGardenBuilding('40543883',gardenAxis,34);
 d.buildings=d.buildings.filter(b=>b[3]!=='illus-54');
 // Hai hàng nhà bên ngoài vườn: bỏ độ xiên footprint OSM, căn cùng trục với tường.
 for(const [id,cx] of [
  ['40543889',-310],['40543887',-310],
  ['40543890',-292.7],['40543891',-292.7],['40543892',-292.7],
 ]){
  const b=d.buildings.find(b=>b[3]===id);if(!b)continue;
  const xs=b[0].map(p=>p[0]),zs=b[0].map(p=>p[1]);
  const halfWidth=(Math.max(...xs)-Math.min(...xs))/2;
  const front=Math.max(...zs),rear=Math.min(...zs);
  b[0]=[[cx-halfWidth,rear],[cx+halfWidth,rear],[cx+halfWidth,front],[cx-halfWidth,front]];
 }
 // Một thảm cỏ phủ kín ô, thay các mảng trồng cây có viền cũ bên trong.
 const insideGarden=p=>p.every(([x,z])=>x>=-286&&x<=-228.5&&z>=-34&&z<=gardenZ(89));
 d.landscape=d.landscape.filter(([kind,p])=>kind===1||!insideGarden(p));
 d.landscape.push([0,GARDEN_LAWN.map(p=>[...p])]);
 const pathDistance=([x,z],a,b)=>{
  const dx=b[0]-a[0],dz=b[1]-a[1],length=dx*dx+dz*dz;
  const t=length?Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/length)):0;
  return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);
 };
 d.gardenPaths.push(...GARDEN_STONE_PATHS.map(p=>p.map(q=>[...q])));
 d.mappedTrees=d.mappedTrees.filter(p=>!GARDEN_STONE_PATHS.some(path=>
  path.slice(1).some((b,i)=>pathDistance(p,path[i],b)<2.6)));
 // Thay cây giữa sân bằng hai cây hai bên mỗi cổng (dựng trong trees.js).
 d.mappedTrees=d.mappedTrees.filter(([x,z])=>!(x>-262.2&&x<-157.9&&z>-204&&z<-163));
 // Các trục lát đá thống nhất cho cả bốn sân.
 d.illustration.paths=d.illustration.paths.filter(p=>
  !['西宫殿','中宫殿','三所殿'].includes(p[0])&&!p[0].startsWith('four-courts-'));
 // Căn các điện và lối đá theo tâm mới của bốn sân, giữ kích thước nhà.
 for(const [index,id] of [
  [0,'40605555'],[1,'40605553'],[2,'40605554'],[3,'40605556'],
 ]){
  const hall=d.buildings.find(b=>b[3]===id);
  if(!hall)continue;
  for(const building of [hall,...(index===3?d.buildings.filter(b=>b[3]==='40605559'):[])]){
   const bx=building[0].map(p=>p[0]);
   const dx=FOUR_COURT_CENTERS[index]-(Math.min(...bx)+Math.max(...bx))/2;
   const move=p=>p.map(([x,z])=>[x+dx,z]);
   building[0]=move(building[0]);
   building[4]=building[4].map(part=>[move(part[0]),...part.slice(1)]);
  }
  const front=Math.max(...hall[0].map(p=>p[1]));
  d.illustration.paths.push(['four-courts-front-'+index,FOUR_COURT_CENTERS[index],front,-163,3]);
  if(index===3){
   const rearHall=d.buildings.find(b=>b[3]==='40605559');
   if(rearHall)d.illustration.paths.push(['four-courts-rear',FOUR_COURT_CENTERS[index],
    Math.max(...rearHall[0].map(p=>p[1])),Math.min(...hall[0].map(p=>p[1])),3]);
  }
 }
 // Hai khối nhà giữa hành lang thu ngang bằng bề rộng dãy chữ L.
 for(const b of d.buildings)if(b[3]==='40593738'||b[3]==='40593739'){
  const xs=b[0].map(p=>p[0]),cx=(Math.min(...xs)+Math.max(...xs))/2;
  const scale=6.6/(Math.max(...xs)-Math.min(...xs)),target=b[3]==='40593738'?-254:-188;
  const resize=p=>p.map(([x,z])=>[target+(x-cx)*scale,z]);
  b[0]=resize(b[0]);b[4]=b[4].map(part=>[resize(part[0]),...part.slice(1)]);
 }
 // Dãy nhà phía đông đối xứng qua trục cổng bắc Ngự Hoa Viên (x=0,885 m).
 const gardenNorthRow=d.buildings.find(b=>b[3]==='40795238');
 if(gardenNorthRow){
  const mirror=p=>p.map(([x,z])=>[1.77-x,z]).reverse();
  d.buildings.push([mirror(gardenNorthRow[0]),gardenNorthRow[1],gardenNorthRow[2],
   'garden-north-row-east',[],gardenNorthRow[5],gardenNorthRow[6]]);
 }
 // Bỏ thềm và các dốc đá nhô vào lối dọc hai hành lang Hậu tam cung.
 const groundCorridorPavilions=new Set(['639048947','639048962','639048965','639048970']);
 for(const b of d.buildings)if(groundCorridorPavilions.has(b[3])){
  b[4]=b[4].filter(part=>part[7]!=='stone');
  const body=b[4].find(part=>part[7]==='wood'&&part[4]==='flat'&&part[2]===10);
  if(body)b[0]=body[0].map(p=>[...p]);
 }
 // Dời hai đoạn tường có mái cạnh Giao Thái ra ngoài mép nền chung (x = ±17 m).
 for(const b of d.buildings){
  if(b[3]==='638981206'||b[3]==='638981228'){
   const shift=b[3]==='638981206'?5:-5;
   b[0]=b[0].map(([x,z])=>[x+shift,z]);
   const xs=b[0].map(p=>p[0]),cx=(Math.min(...xs)+Math.max(...xs))/2;
   // Tường cáo thị ngắn, chừa khoảng trống trước thang Giao Thái tại z=-264.
   b[0]=[[cx-.625,-258],[cx+.625,-258],[cx+.625,-250],[cx-.625,-250]];
   b[4]=[];
  }
 }
 // Các nhà nhỏ và hành lang phụ đánh dấu cạnh Càn Thanh, cùng phần đối diện.
 // Khối 638981252 gồm các nhánh nối cũ trên nền chung Hậu tam cung.
 const innerExtras=new Set(['638981252','638981264','638981265','638981270','638981271',
  '639012133','639012159','639012166',
  // Các đoạn hành lang tây được thay bằng hai dãy thẳng trong sideGates.js.
  '639070163','639070159','639070135','639109002','639108984','639109004',
  '639080220','639080218','639108995','639108996','639108997',
  '639108991','639108990','42509107',
  // Cổng cũ ở góc Ngự Hoa Viên: dựng lại cửa mở cùng tường, bỏ mảnh chui vào mái hành lang.
  '42424146','42424195','42424144','43485438',
  '40795246','40795247',
  // Bốn nhà gạch chéo quanh hồ thủy đình phía tây Ngự Hoa Viên.
  '40795243','42353091','42424136','42424173','42424162',
  '40795241','42393617','42393622','42424137','42424165']);
 d.buildings=d.buildings.filter(b=>!innerExtras.has(b[3]));
 for(const b of d.buildings){
  if(['638981272','638981273','639012180','639012191'].includes(b[3])){
   // Giảm diện tích 10%, thu đều hai trục quanh tâm nhà.
   const xs=b[0].map(p=>p[0]),zs=b[0].map(p=>p[1]);
   const cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2;
   const scale=Math.sqrt(.9);
   const shrink=outline=>outline.map(([x,z])=>[cx+(x-cx)*scale,cz+(z-cz)*scale]);
   b[0]=shrink(b[0]);
   b[4]=b[4].map(part=>[shrink(part[0]),...part.slice(1)]);
  }
  // Bỏ hai dải mái thấp ở đầu nam của cặp nhà bên hông.
  if(b[3]==='638981273')b[4]=b[4].filter((part,i)=>i!==3&&i!==4);
  if(b[3]==='638981272')b[4]=b[4].filter((part,i)=>i!==5&&i!==6);
 }
 // Dãy hành lang tây giữa Điện Thái Hòa và Điện Bảo Hòa trong OSM bị xiên:
 // mép nhà trôi dần theo z, trong khi dãy phía đông thẳng. Dùng đúng hình đối xứng
 // của dãy đông cho footprint, thân, mái, thềm và các bậc; giữ nguyên ID phía tây.
 const eastGallery=d.buildings.find(b=>b[3]==='638513244');
 const westGallery=d.buildings.find(b=>b[3]==='638513245');
 if(eastGallery&&westGallery){
  const mirror=outline=>outline.map(([x,z])=>[-x,z]).reverse();
  westGallery[0]=mirror(eastGallery[0]);
  westGallery[1]=eastGallery[1];westGallery[2]=eastGallery[2];
  westGallery[4]=eastGallery[4].map(part=>{
   const copy=[mirror(part[0]),...part.slice(1)];
   if(copy[5]>=0)copy[5]=(copy[5]+180)%360;
   return copy;
  });
  westGallery[5]=eastGallery[5];westGallery[6]=eastGallery[6];
 }
 // Tại nút giao Hậu Tả/Hữu Môn, mái hành lang ngang đã che đủ phần nối.
 // Bỏ riêng dải mái cạnh thấp của hai lầu góc để không chồng hai lớp mái;
 // giữ nguyên thân lầu, mái chính và các diềm còn lại.
 for(const b of d.buildings){
  // Cụm 1–4 là thân nối nhỏ, hai mái dốc và mái hồi nhô ra ngay trên đầu
  // hành lang. Bỏ cả cụm và mái cạnh; hành lang ngang sẽ kéo thẳng tới thân lầu chính.
  if(b[3]==='638507610')b[4]=b[4].filter((p,i)=>![1,2,3,4,15].includes(i));
  if(b[3]==='638507657')b[4]=b[4].filter((p,i)=>![1,2,3,4,9].includes(i));
 }
 // Bốn cổng quanh sân Thái Hòa Môn được dựng lại trong world/sideGates.js: bỏ khối OSM cũ
 // (Hy Hòa Môn, Hiệp Hòa Môn, Trinh Độ Môn và Chiêu Đức Môn – cái sau nằm trong gatewayBuildings).
 // Tương tự cho 4 cổng tường ngang khu Tam Đại Điện (Hậu Tả/Hữu, Trung Tả/Hữu Môn) và Tả/Hữu Dực Môn;
 // bỏ thêm các nhà nhỏ dư, sai hướng trong sân (theo bản vẽ không có).
 const replaced=new Set(['638218765','638238294','638320793','638507769','638507841','638590140','638590169',
  '638507583','638507581','40605849','40605845','638517188','638517180','638590262','638590254']);
 // Hai dãy phía nam Thể Nhân Các / Hoằng Nghĩa Các có nhiều mảnh mái OSM chồng lấn.
 // sideGates.js dựng lại mỗi bên thành một dãy liên tục, có cầu thang và lan can riêng.
 replaced.add('638590074');
 replaced.add('638590075');
 d.buildings=d.buildings.filter(b=>!replaced.has(b[3]));
 // Chiêu Đức Môn cũ gồm cả khối cổng và một dải tường mỏng phía bắc.
 // Lọc cả hai; nếu giữ dải thứ hai, nó chồng lên cổng dựng tay và chắn lối đi.
 const gwGone=[[62.9,304.5],[62.765,314.335],[77.3,-33.55],[77.7,102.3],
  // Hai cổng OSM cũ nhô vào lối giữa hành lang đông và Cảnh Nhân Cung–Trai Cung.
  [64.485,-191.595],[56.215,-225.365],
  [59.095,-340.415],[65.19,-331.94],
  [53.81,-382.505],[49.485,-368.025],[1.095,-418.04]];
 const centre=p=>{const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);return [(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2]};
 d.gatewayBuildings=d.gatewayBuildings.filter(g=>{const [x,z]=centre(g[0]);return !gwGone.some(([a,b])=>Math.hypot(a-x,b-z)<6)});
 // Các dốc đá OSM ở hành lang và hai gác bị dài, trơn, không có lan can.
 // Bỏ chúng khỏi footprint; sideGates.js dựng lại cầu thang đúng tỉ lệ.
 const rebuiltStairs=new Set(['638218767','638238311','638590122','638590123','638513244','638513245']);
 for(const b of d.buildings)if(rebuiltStairs.has(b[3])){
  b[4]=b[4].filter(p=>!(p[7]==='stone'&&p[4]==='skillion'));
  // Đường bao cũ phình ra chỗ dốc đá: thu về khung các phần còn lại để nền móng không lộ thành tấm đá.
  const xs=b[4].flatMap(p=>p[0].map(q=>q[0])),zs=b[4].flatMap(p=>p[0].map(q=>q[1]));
  const [x0,x1,z0,z1]=[Math.min(...xs),Math.max(...xs),Math.min(...zs),Math.max(...zs)];
  b[0]=[[x0,z0],[x1,z0],[x1,z1],[x0,z1]];
 }
 // Hạ nền đá các dãy hành lang / lầu quanh quảng trường Thái Hòa và khu Tam Đại Điện xuống 0,6 m,
 // bỏ bậc lên nền cũ (nền cao 2–4 m lộ thành khối xám lớn trước dãy nhà).
 const lowBase=new Set(['638513245','638513244','638590075','638590074','638590123','638590122','638507657','638507610','638218767','638238311']);
 const BASE=1.2;
 for(const b of d.buildings)if(lowBase.has(b[3])){
  // Bỏ các mảnh tường hẹp có mái riêng ở hai đầu lầu / dãy hành lang (nhìn như nhà nhỏ sai hướng)
  // và khối gác nhỏ trên dãy hành lang ở chỗ nối tường ngang (chồng lấn với dãy nhà nối).
  b[4]=b[4].filter(p=>{
   const xs=p[0].map(q=>q[0]),zs=p[0].map(q=>q[1]),w=Math.max(...xs)-Math.min(...xs),dd=Math.max(...zs)-Math.min(...zs);
   if(p[7]==='wood'&&p[4]==='gabled'&&p[1]<1&&Math.min(w,dd)<2.6)return false;
   if(['638513245','638513244'].includes(b[3])&&Math.min(...zs)>90&&Math.max(...zs)<112)return false;
   return true;
  });
  // Nền đá thấp xuống còn 1,2 m; bậc lên nền giữ lại, hạ cho khớp.
  for(const p of b[4])if(p[7]==='stone'&&p[1]<.5&&p[2]<=5){
   if(p[4]==='flat'){p[2]=BASE;p[3]=0}
   else if(p[4]==='skillion'){p[2]=BASE;p[3]=BASE}
  }
 }
 // Hai tuyến tường ngoài Hậu tam cung được dựng liền trong walls.js.
 // Loại các mảnh tường/cổng cũ để không còn mái chồng và khe mở tự sinh.
 const oldWallGates=new Set(['42509104','42509110','685428160']);
 d.buildings=d.buildings.filter(b=>!oldWallGates.has(b[3]));
 d.walls=d.walls.filter(outline=>{
  if(outline[0][0]===10.97&&outline[0][1]===-426.82)return false;
  if(outline[0][0]===-240.26&&outline[0][1]===-430.86)return false;
  const enclosureXs=outline.map(p=>p[0]),enclosureZs=outline.map(p=>p[1]);
  if(Math.min(...enclosureXs)>-17&&Math.max(...enclosureXs)<18&&
   Math.min(...enclosureZs)>-421&&Math.max(...enclosureZs)<-416)return false;
  // Tường sân lầu ba mái được dựng lại với cùng bề dày và mái như tường chữ T.
  if(Math.min(...enclosureXs)>-21&&Math.max(...enclosureXs)<22&&
   Math.min(...enclosureZs)>-410&&Math.max(...enclosureZs)<-374)return false;
  if(outline[0][0]===69.99&&outline[0][1]===-426.83)return false;
  if(outline[0][0]===-68.56&&outline[0][1]===-342.02)return false;
  const xs=outline.map(p=>p[0]),zs=outline.map(p=>p[1]);
  const x=(Math.min(...xs)+Math.max(...xs))/2;
  const w=Math.max(...xs)-Math.min(...xs),depth=Math.max(...zs)-Math.min(...zs);
  return !(Math.abs(x)>65&&Math.abs(x)<72&&Math.min(...zs)>-345&&Math.max(...zs)<-114&&w<3.5&&depth>w);
 });
 d.gatewayWalls=d.gatewayWalls.filter(([p])=>{
  const [x,z]=centre(p);
  return !(Math.abs(x)<3&&z< -426&&z> -431);
 });
 // Hồ vuông phía bắc được gộp vào hồ thủy đình, bỏ đường bao nước cũ.
 d.landscape=d.landscape.filter(([kind,p])=>!(kind===1&&p.some(([x,z])=>x===-64.32&&z===-416.5)));
 d.landscape=d.landscape.filter(([kind,p])=>{
  if(kind!==1)return true;
  const [x,z]=centre(p);
  return !(x>40&&x<65&&z< -402&&z> -418);
 });
 // Dựng lại sáu cung tây theo bản thiết kế: bỏ nhà/tường/cổng OSM cũ trong phạm vi.
 const westSixCenter=p=>{
  const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);
  return inWestSix((Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2);
 };
 d.buildings=d.buildings.filter(b=>!westSixCenter(b[0]));
 // Cắt riêng phần tường nằm trong vùng sửa, giữ các nhánh ngoài phạm vi.
 function clipWall(p,axis,value,positive){
  const out=[],f=q=>positive?q[axis]-value:value-q[axis];
  for(let i=0;i<p.length;i++){
   const a=p[i],b=p[(i+1)%p.length],fa=f(a),fb=f(b);
   if(fa>=0)out.push([...a]);
   if((fa>=0)!==(fb>=0)){const t=fa/(fa-fb);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);}
  }
  return out;
 }
 d.walls=d.walls.flatMap(p=>{
  const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);
  if(Math.max(...xs)<=-172.5||Math.min(...xs)>=-68.25||Math.max(...zs)<=-366||Math.min(...zs)>=-214)return [p];
  let remaining=p;const outside=[];
  for(const [axis,value,inside] of [[0,-172.5,true],[0,-68.25,false],[1,-366,true],[1,-214,false]]){
   const part=clipWall(remaining,axis,value,!inside);if(part.length>=3)outside.push(part);
   remaining=clipWall(remaining,axis,value,inside);if(remaining.length<3)break;
  }
  return outside.filter(p=>Math.abs(p.reduce((sum,[x,z],i)=>{
   const [xx,zz]=p[(i+1)%p.length];return sum+x*zz-xx*z;
  },0))>.04);
 });
 d.gatewayBuildings=d.gatewayBuildings.filter(b=>!westSixCenter(b[0]));
 d.gatewayWalls=d.gatewayWalls.filter(b=>!westSixCenter(b[0]));
 // Dọn ba nhánh nối gạch X còn sót giữa sáu cung và tuyến tường Dưỡng Tâm phía nam.
 d.walls=d.walls.filter(p=>!p.every(([x,z])=>x>=-174&&x<=-68&&z>=-214&&z<=-207));
 d.buildings=d.buildings.filter(b=>!['42450627','42450628'].includes(b[3]));
 d.mappedTrees=d.mappedTrees.filter(([x,z])=>!inWestSix(x,z));
 d.gardens=d.gardens.filter(p=>!westSixCenter(p));
 d.landscape=d.landscape.filter(([,p])=>!westSixCenter(p));
 d.illustration.paths=d.illustration.paths.filter(p=>!inWestSix(p[1],(p[2]+p[3])/2));
 for(const c of WEST_SIX_COURTS){
  let place=d.districtPlaces.find(p=>p[4]===c.id);
  if(!place){place=[c.name,c.x,c.mainZ,26,c.id];d.districtPlaces.push(place);}
  place[0]=c.name;place[1]=c.x;place[2]=c.mainZ;
 }
 // Khu sau Lục Cung: thay các khối nhà lớn ghép cũ bằng ba dải nhà theo bản vẽ.
 const rearCenter=p=>{
  const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);
  return inWestRear((Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2);
 };
 d.buildings=d.buildings.filter(b=>!rearCenter(b[0]));
 // Dãy mái dài cũ nằm vắt qua ranh trước, không dựng chồng lên hành lang mới.
 d.buildings=d.buildings.filter(b=>b[3]!=='40632240');
 d.gatewayBuildings=d.gatewayBuildings.filter(b=>!rearCenter(b[0]));
 d.gatewayWalls=d.gatewayWalls.filter(b=>!rearCenter(b[0]));
 const rb=WEST_REAR_BOUNDS;
 d.walls=d.walls.flatMap(p=>{
  const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);
  if(Math.max(...xs)<=rb.left||Math.min(...xs)>=rb.right||Math.max(...zs)<=rb.rear||Math.min(...zs)>=rb.front)return [p];
  let remaining=p;const outside=[];
  for(const [axis,value,inside] of [[0,rb.left,true],[0,rb.right,false],[1,rb.rear,true],[1,rb.front,false]]){
   const part=clipWall(remaining,axis,value,!inside);if(part.length>=3)outside.push(part);
   remaining=clipWall(remaining,axis,value,inside);if(remaining.length<3)break;
  }
  return outside.filter(p=>Math.abs(p.reduce((sum,[x,z],i)=>{
   const [xx,zz]=p[(i+1)%p.length];return sum+x*zz-xx*z;
  },0))>.04);
 });
 d.mappedTrees=d.mappedTrees.filter(([x,z])=>!inWestRear(x,z));
 d.walls=d.walls.filter(p=>!p.every(([x,z])=>x>=rb.left&&x<=rb.right&&z>=rb.front&&z<=-366));
 d.gardens=d.gardens.filter(p=>!rearCenter(p));
 d.landscape=d.landscape.filter(([,p])=>!rearCenter(p));
 d.illustration.paths=d.illustration.paths.filter(p=>!inWestRear(p[1],(p[2]+p[3])/2));
 // Đông Lục Cung và ba viện cạnh đông dựng lại theo bản vẽ, thay các khối ghép cũ.
 const eastCenter=p=>{
  const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);
  return inEastSix((Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2);
 };
 d.buildings=d.buildings.filter(b=>!eastCenter(b[0]));
 d.gatewayBuildings=d.gatewayBuildings.filter(b=>!eastCenter(b[0]));
 d.gatewayWalls=d.gatewayWalls.filter(b=>!eastCenter(b[0]));
 const eb=EAST_SIX_BOUNDS;
 d.walls=d.walls.flatMap(p=>{
  const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);
  if(Math.max(...xs)<=eb.left||Math.min(...xs)>=eb.right||Math.max(...zs)<=eb.rear||Math.min(...zs)>=eb.front)return [p];
  let remaining=p;const outside=[];
  for(const [axis,value,inside] of [[0,eb.left,true],[0,eb.right,false],[1,eb.rear,true],[1,eb.front,false]]){
   const part=clipWall(remaining,axis,value,!inside);if(part.length>=3)outside.push(part);
   remaining=clipWall(remaining,axis,value,inside);if(remaining.length<3)break;
  }
  return outside.filter(p=>Math.abs(p.reduce((sum,[x,z],i)=>{
   const [xx,zz]=p[(i+1)%p.length];return sum+x*zz-xx*z;
  },0))>.04);
 });
 d.mappedTrees=d.mappedTrees.filter(([x,z])=>!inEastSix(x,z));
 d.gardens=d.gardens.filter(p=>!eastCenter(p));
 d.landscape=d.landscape.filter(([,p])=>!eastCenter(p));
 d.illustration.paths=d.illustration.paths.filter(p=>!inEastSix(p[1],(p[2]+p[3])/2));
 for(const c of EAST_SIX_COURTS){
  let place=d.districtPlaces.find(p=>p[4]===c.id||p[0]===c.name);
  if(!place){place=[c.name,c.x,c.mainZ,26,c.id];d.districtPlaces.push(place);}
  place[0]=c.name;place[1]=c.x;place[2]=c.mainZ;place[4]=c.id;
 }
 // Phụng Tiên Điện và viện phụ cạnh trái, giữ nguyên Trai Cung phía tây.
 const fengxianCenter=p=>{
  const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);
  return inFengxian((Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2);
 };
 d.buildings=d.buildings.filter(b=>!fengxianCenter(b[0]));
 d.gatewayBuildings=d.gatewayBuildings.filter(b=>!fengxianCenter(b[0]));
 d.gatewayWalls=d.gatewayWalls.filter(b=>!fengxianCenter(b[0]));
 const fb=FENGXIAN_BOUNDS;
 d.walls=d.walls.flatMap(p=>{
  const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);
  if(Math.max(...xs)<=fb.left||Math.min(...xs)>=fb.right||Math.max(...zs)<=fb.rear||Math.min(...zs)>=fb.front)return [p];
  let remaining=p;const outside=[];
  for(const [axis,value,inside] of [[0,fb.left,true],[0,fb.right,false],[1,fb.rear,true],[1,fb.front,false]]){
   const part=clipWall(remaining,axis,value,!inside);if(part.length>=3)outside.push(part);
   remaining=clipWall(remaining,axis,value,inside);if(remaining.length<3)break;
  }
  return outside.filter(p=>Math.abs(p.reduce((sum,[x,z],i)=>{
   const [xx,zz]=p[(i+1)%p.length];return sum+x*zz-xx*z;
  },0))>.04);
 });
 d.mappedTrees=d.mappedTrees.filter(([x,z])=>!inFengxian(x,z));
 d.gardens=d.gardens.filter(p=>!fengxianCenter(p));
 d.landscape=d.landscape.filter(([,p])=>!fengxianCenter(p));
 d.illustration.paths=d.illustration.paths.filter(p=>!inFengxian(p[1],(p[2]+p[3])/2));
 const fengxianLabel=d.districtPlaces.find(p=>p[0]==='Phụng Tiên Điện');
 if(fengxianLabel){fengxianLabel[1]=FENGXIAN_MAIN.x;fengxianLabel[2]=FENGXIAN_MAIN.z;}
 // Chỉnh tiếp Trai Cung theo phần khoanh: bỏ nhà phụ xiên, cổng cũ và nhà gạch X.
 const traiCenter=p=>{
  const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);
  return inTrai((Math.min(...xs)+Math.max(...xs))/2,(Math.min(...zs)+Math.max(...zs))/2);
 };
 d.buildings=d.buildings.filter(b=>!traiCenter(b[0]));
 d.gatewayBuildings=d.gatewayBuildings.filter(b=>!traiCenter(b[0]));
 d.gatewayWalls=d.gatewayWalls.filter(b=>!traiCenter(b[0]));
 const tb=TRAI_BOUNDS;
 d.walls=d.walls.flatMap(p=>{
  const xs=p.map(q=>q[0]),zs=p.map(q=>q[1]);
  if(Math.max(...xs)<=tb.left||Math.min(...xs)>=tb.right||Math.max(...zs)<=tb.rear||Math.min(...zs)>=tb.front)return [p];
  let remaining=p;const outside=[];
  for(const [axis,value,inside] of [[0,tb.left,true],[0,tb.right,false],[1,tb.rear,true],[1,tb.front,false]]){
   const part=clipWall(remaining,axis,value,!inside);if(part.length>=3)outside.push(part);
   remaining=clipWall(remaining,axis,value,inside);if(remaining.length<3)break;
  }
  return outside.filter(p=>Math.abs(p.reduce((sum,[x,z],i)=>{
   const [xx,zz]=p[(i+1)%p.length];return sum+x*zz-xx*z;
  },0))>.04);
 });
 d.mappedTrees=d.mappedTrees.filter(([x,z])=>!inTrai(x,z));
 d.gardens=d.gardens.filter(p=>!traiCenter(p));
 d.landscape=d.landscape.filter(([,p])=>!traiCenter(p));
 d.illustration.paths=d.illustration.paths.filter(p=>!inTrai(p[1],(p[2]+p[3])/2));
 const traiLabel=d.districtPlaces.find(p=>p[0]==='Trai Cung');
 if(traiLabel){traiLabel[1]=93.1;traiLabel[2]=-168;}
 // Những nhánh cũ nằm trong hành lang giữa Đông Lục Cung và hai khu phía nam.
 d.walls=d.walls.filter(p=>!p.every(([x,z])=>x>=70&&x<=230&&z>=-214&&z<=-204));
 const inEastPassage=p=>p.every(([x,z])=>x>175&&x<185&&z>=-366&&z<=-214);
 d.walls=d.walls.filter(p=>!inEastPassage(p));
 // Bỏ dải cực mỏng còn sót ngoài mép cắt OSM, từng tạo mái thứ hai cạnh tường đông.
 d.walls=d.walls.filter(p=>!p.every(([x,z])=>x>=228.5&&x<=230.3&&z>=-372&&z<=-204));
 // Không giữ nền/bậc hay mái cổng tự sinh ở mép nam Phụng Tiên.
 d.gatewayBuildings=d.gatewayBuildings.filter(b=>!b[0].every(([x,z])=>x>=151.5&&x<=230&&z>=-70&&z<=-64));
 d.gatewayWalls=d.gatewayWalls.filter(b=>!b[0].every(([x,z])=>x>=151.5&&x<=230&&z>=-70&&z<=-64));
 // Ao sen quanh tượng Diên Hy: landscape dựng mặt nước và đăng ký va chạm nước.
 d.landscape.push([1,YANXI_POND_OUTLINE.map(p=>[...p])]);
 data=d;
}

// Dữ liệu bản đồ (OSM đã xử lý), nạp từ public/data/forbidden-city.json trước khi dựng.

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
  '40605424','40605425']);
 d.buildings=d.buildings.filter(b=>!ciningOld.has(b[3]));
 // Dọn các cổng/tường vụn trên tuyến hành lang đông để dựng tường mỏng liền.
 const ciningCorridor=p=>p.every(([x,z])=>x>=-183&&x<=-175&&z>=-164&&z<=-60);
 d.walls=d.walls.filter(p=>!ciningCorridor(p));
 d.buildings=d.buildings.filter(b=>!ciningCorridor(b[0]));
 d.gatewayBuildings=d.gatewayBuildings.filter(b=>!ciningCorridor(b[0]));
 // Bỏ hai đoạn tường ngang dư trước các dãy chữ L.
 const ciningFront=p=>p.every(([x,z])=>x>=-263&&x<=-181&&z>=-63&&z<=-59);
 d.walls=d.walls.filter(p=>!ciningFront(p));
 // Dải tường ngang có mái dư ở chân hành lang đông.
 d.walls=d.walls.filter(p=>!p.every(([x,z])=>x>=-206&&x<=-156&&z>=-62&&z<=-59));
 d.gatewayBuildings=d.gatewayBuildings.filter(b=>!ciningFront(b[0]));
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
 data=d;
}

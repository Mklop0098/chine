// Bốn cổng quanh sân Thái Hòa Môn theo bản vẽ: Trinh Độ Môn, Chiêu Đức Môn (hai bên Thái Hòa Môn)
// và Hy Hòa Môn, Hiệp Hòa Môn (giữa hai dãy hành lang đông, tây). Dữ liệu OSM dựng chúng thành khối nhà
// đặc trên nền đá cao; ở đây dựng lại thành cổng: nền thấp, gian giữa để trống làm lối đi, cánh cửa đinh
// mở áp vào tường, các gian bên xây tường có cửa sổ, đấu củng và mái Hiết Sơn ngói vàng.
import * as THREE from 'three';
import {add,box,surfaceRect} from '../builders/primitives.js';
import {roof} from '../builders/roof.js';
import {grandStair} from '../builders/stairs.js';
import {dougongRow,studDoor,windowMat} from '../builders/ornaments.js';
import {carvedStone,paintedBeam,red,roofGold,stone,wallRed} from '../materials/textures.js';
import {addFacadeLantern} from './lanterns.js';

// [tên, tâm x, tâm z, dài theo dãy tường, sâu theo lối đi, trục dãy tường ('z': dãy chạy bắc–nam, lối đi đông–tây)]
export const SIDE_GATES=[
 ['熙和門',-108.9,390.7,36.8,11,'z'],
 ['協和門',108.1,390.1,36.4,11,'z'],
 ['貞度門',-63.9,303.2,23.6,14,'x',true],
 ['昭德門',62.9,303.2,23.6,14,'x',true],
 // Khu Tam Đại Điện: cổng trên tường ngang nối nền đá với dãy hành lang (lối bắc–nam)…
 ['後右門',-78.55,-33.35,23.5,15,'x',true],
 ['後左門',77.3,-33.55,23.5,15,'x',true],
 ['中右門',-79.25,101.25,23.5,15,'x',true],
 ['中左門',77.7,102.3,23.5,15,'x',true],
];

// Dãy nhà nối (廊庑) lấp khoảng hở: dọc hai dãy hành lang quảng trường Thái Hòa (chỗ Tả/Hữu Dực Môn cũ,
// hai đầu Thể Nhân Các / Hoằng Nghĩa Các, khe sát góc Thái Hòa Môn) và trên tường ngang giữa các cổng
// Trung/Hậu Tả Hữu Môn với dãy hành lang. [x0, z0, x1, z1] – tọa độ mô hình chưa uốn.
// Hướng: 'z' dãy chạy bắc–nam (dọc hành lang), 'x' chạy đông–tây (trên tường ngang).
export const GALLERIES=[
 // Hai hành lang Hậu tam cung có cùng trục mái, gồm cả đoạn góc phía bắc.
 [-58.9,-339,-47.6,-275,'z'],
 [-58.9,-254.4,-47.6,-170,'z'],
 [48.9,-339,60.2,-275,'z'],
 [48.9,-254.4,60.2,-170,'z'],
 [-47.6,-339,-10.04,-329.6,'x'],
 [10.38,-339,48.9,-329.6,'x'],
 // Dãy tây lấy đúng trục đối xứng của dãy đông để mái và mặt tiền thẳng hàng.
 [-115.3,125.6,-104,178.4,'z'],[-115.3,223.2,-104,295,'z'],
 [104,127,115.3,178,'z'],[104,222.7,115.3,294.6,'z'],
 [-104.8,96.2,-91.6,106.3,'x'],[89.6,97.2,102.5,107.4,'x'],
 // Kéo thân và mái hành lang tới sát mặt tường chính của hai lầu góc.
 [-100.9,-38.4,-91.6,-28.3,'x'],[89.6,-38.6,101.2,-28.5,'x'],
];
// Các khối OSM cũ ở chỗ bốn cổng này bị data.js lọc bỏ trước khi dựng (REPLACED_BY_GATES).

// Nhà dài một gian sâu: tường đỏ, cửa sổ / cửa xen kẽ, cột hai mặt dài, xà sơn, mái Hiết Sơn ngói vàng.
// Đầu hồi thẳng (gable) và mái hiên cao ~7 m như dãy hành lang bên cạnh, để hai đầu chui gọn vào nhà kế bên.
function gallery(x0,z0,x1,z1,axis,h=6.6,base=1.2){
 const alongZ=axis==='z',L=alongZ?z1-z0:x1-x0,D=alongZ?x1-x0:z1-z0,cx=(x0+x1)/2,cz=(z0+z1)/2;
 const B=(u,v,y,lu,lv,hh,mat,solid=false)=>alongZ?box(cx+v,y,cz+u,lv,hh,lu,mat,solid):box(cx+u,y,cz+v,lu,hh,lv,mat,solid);
 const n=Math.max(1,Math.round(L/3.8)),bw=L/n,face=D*.4;
 B(0,0,base/2,L,D+.6,base,stone,true);
 B(0,0,base+h/2,L-.2,D*.78,h,wallRed,true);
 for(const s of [-1,1]){
  for(let i=0;i<=n;i++)B(-L/2+i*bw,s*face,base+h/2,.36,.36,h,red);
  for(let i=0;i<n;i++)B(-L/2+(i+.5)*bw,s*(D*.39+.06),base+h*.45,bw*.72,.1,h*.62,windowMat);
  B(0,s*(face+.05),base+h-.3,L,.4,.5,paintedBeam);
 }
 roof(cx,cz,L,D+1.2,base+h,Math.min(3.6,D*.34),roofGold,true,{style:'gable-hard',dx:alongZ?0:1,dz:alongZ?1:0,keepAxis:true});
}

// Dải ngói che khe giữa mái dưới và thân tầng trên của Thể Nhân Các / Hoằng Nghĩa Các.
const PAVILION_NECKS=[[102.9,180.2,117,220.4],[-117,180.7,-102.9,220.9]];

// Lan can đá dọc một cạnh thềm; các đoạn ngắn được chia ra để chừa miệng cầu thang.
function railRun(x,z,length,y,alongZ=true){
 if(length<.7)return;
 const count=Math.max(1,Math.ceil(length/2.4)),span=length/count;
 const B=(u,yy,w,h,d,mat,solid=false)=>alongZ?box(x,yy,z+u,d,h,w,mat,solid):box(x+u,yy,z,w,h,d,mat,solid);
 for(let i=0;i<=count;i++){
  const at=i*span-length/2;
  B(at,y+.43,.24,.82,.24,stone,true);
  const px=alongZ?x:x+at,pz=alongZ?z+at:z;
  add(new THREE.SphereGeometry(.15,10,8),carvedStone,px,y+.94,pz);
 }
 for(let i=0;i<count;i++){
  const at=(i+.5)*span-length/2;
  B(at,y+.37,span-.16,.42,.14,carvedStone,true);
  B(at,y+.72,span-.1,.09,.2,stone,true);
 }
}

function railEdge(x,z0,z1,y,gaps=[]){
 let start=z0;
 for(const [center,width] of gaps.sort((a,b)=>a[0]-b[0])){
  const end=Math.max(start,center-width/2);
  railRun(x,(start+end)/2,end-start,y,true);
  start=Math.min(z1,center+width/2);
 }
 railRun(x,(start+z1)/2,z1-start,y,true);
}

export function buildSideGates(){
 for(const [x0,z0,x1,z1,axis] of GALLERIES)gallery(x0,z0,x1,z1,axis);
 // Năm cầu thang dọc mỗi hành lang chính của khu Tam Đại Điện. Dốc OSM cũ đã
 // bị bỏ trong data.js; dựng lại bằng bậc thật, thành bên và tay vịn.
 const mainStairZ=[1.9,19.9,38.1,57.1,79.2];
 for(const [x,out] of [[99.25,-1],[-99.25,1]]){
  for(const z of mainStairZ)grandStair(z,x,out,3.6,1.2,5.2,'x');
 }
 // Lan can dọc hai mép thềm hướng vào sân. Chừa năm miệng thang và khoảng nhà gác ở z≈102.
 const mainGaps=[...mainStairZ.map(z=>[z,5]),[102.5,17]];
 railEdge(99.12,-20.8,127.2,1.2,mainGaps.map(g=>[...g]));
 railEdge(-99.12,-20.8,127.2,1.2,mainGaps.map(g=>[...g]));
 // Hai bậc lên mỗi dãy hành lang phía nam: giữ vị trí OSM, thay dốc trơn bằng
 // cầu thang đá có thành bên, trụ đầu tròn và tay vịn chạy theo độ dốc.
 for(const [x,out,zs] of [[104,-1,[248.4,271.9]],[-104,1,[248.9,272.3]]]){
  for(const z of zs)grandStair(z,x,out,5.4,1.2,5.2,'x');
 }
 // Cầu thang chính của Thể Nhân Các và Hoằng Nghĩa Các: thay dốc OSM dài bằng thang có lan can.
 grandStair(198.9,93.5,-1,6.1,1.2,5.4,'x');
 grandStair(199.2,-94.8,1,6.1,1.2,5.4,'x');
 // Lan can trên những mép thềm lộ ra sân, chừa khoảng trống đúng bề rộng cầu thang.
 railEdge(103.88,222.7,294.6,1.2,[[248.4,6.8],[271.9,6.8]]);
 railEdge(-103.88,223.2,295,1.2,[[248.9,6.8],[272.3,6.8]]);
 railEdge(93.38,167.9,230.7,1.2,[[198.9,7.5]]);
 railEdge(-94.83,168.3,231.1,1.2,[[199.2,7.5]]);
 for(const [x0,z0,x1,z1] of PAVILION_NECKS){
  const cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0,t=1.3;
  for(const s of [-1,1]){
   box(cx+s*(w/2+t/2-.1),13.9,cz,t,.55,d+2*t-.2,roofGold);
   box(cx,13.9,cz+s*(d/2+t/2-.1),w+.2,.55,t,roofGold);
   box(cx+s*(w/2+.05),14.35,cz,.18,.35,d,paintedBeam);
   box(cx,14.35,cz+s*(d/2+.05),w,.35,.18,paintedBeam);
  }
 }
 for(const [,cx,cz,len,depth,axis,tall] of SIDE_GATES){
  // Tọa độ cục bộ: u dọc dãy tường, v theo lối đi.
  const P=(u,v)=>axis==='z'?[cx+v,cz+u]:[cx+u,cz+v];
  const B=(u,v,y,lu,lv,h,mat,solid=false)=>{const [x,z]=P(u,v);return axis==='z'?box(x,y,z,lv,h,lu,mat,solid):box(x,y,z,lu,h,lv,mat,solid)};
  const base=tall?1.45:.75,H=6.4,n=len>30?5:3,bw=len/n,mid=(n-1)/2,face=depth*.42;
  // Nền đá cao 0,75 m (chặn khi đứng dưới đất), đi được ở trên.
  B(0,0,base/2,len+2,depth+3,base,stone,true);
  const rect=(u,v,lu,lv,y)=>{const [x,z]=P(u,v);axis==='z'?surfaceRect(x,z,lv,lu,y):surfaceRect(x,z,lu,lv,y)};
  rect(0,0,len+2,depth+3,base);
  const pd=(depth+3)/2,sw=bw+1.2,run=.45;
  if(tall){
   // Trinh Độ Môn, Chiêu Đức Môn: nền cao bằng nền Thái Hòa Môn, cầu thang đá có thành bên và lan can hai phía.
   for(const s of [-1,1]){const [ex,ez]=P(0,s*pd);axis==='z'?grandStair(ez,ex,s,bw,base,5.2,'x'):grandStair(ex,ez,s,bw,base,5.2,'z')}
  }else{
  // Tam cấp trước gian giữa ở cả hai phía lối đi: hai bậc 0,25 m + mặt nền = ba bậc.
  for(const s of [-1,1])for(const k of [1,2]){
   const v=s*(pd+(2-k+.5)*run),h=k*.25;
   B(0,v,h/2,sw,run+.02,h,stone,true).userData.step=true;
   rect(0,v,sw,run+.02,h);
  }
  for(const s of [-1,1])for(const e of [-1,1])B(e*(sw/2+.18),s*(pd+run),base/2,.36,run*2,base,stone);
  }
  // Cột hai mặt.
  for(let i=0;i<=n;i++)for(const s of [-1,1])B(-len/2+i*bw,s*face,base+H/2,.55,.55,H,red,true);
  // Gian bên: tường xây giữa, ô cửa sổ hai mặt; gian giữa: lối đi, hai cánh cửa mở áp vào tường.
  for(let i=0;i<n;i++){
   const u=-len/2+(i+.5)*bw;
   if(i===mid){
    for(const s of [-1,1])B(u+s*(bw/2-.2),depth*.12,base+H*.44,.14,bw*.42,H*.86,studDoor);
    B(u,0,base+H-.45,bw,.9,.8,paintedBeam);
    continue;
   }
   B(u,0,base+H/2,bw-.55,.7,H,wallRed,true);
   for(const s of [-1,1])B(u,s*.4,base+H*.5,bw*.7,.1,H*.5,windowMat);
  }
  // Xà sơn trên hai mặt, đấu củng, mái.
  for(const s of [-1,1])B(0,s*face,base+H-.3,len+.4,.6,.6,paintedBeam);
  const [x,z]=P(0,0),W=axis==='z'?depth:len,D=axis==='z'?len:depth;
  dougongRow(x,z,W+.6,D+.6,base+H);
  roof(x,z,W+2.4,D+2.4,base+H+.7,Math.min(4.6,Math.min(W,D)*.42),roofGold,true,{style:'hip-gable',animals:3});
  for(const s of [-1,1]){const [lx,lz]=P(0,s*(face+.1));addFacadeLantern(lx,base+H-1.4,lz,.9)}
 }
}

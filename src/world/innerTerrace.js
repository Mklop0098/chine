import {polygon,surfacePoly} from '../builders/primitives.js';
import {terraceRails} from '../builders/hall.js';
import {grandStair} from '../builders/stairs.js';
import {baseStone,paleCourt} from '../materials/textures.js';

export const INNER_TERRACE_HEIGHT=3.6;
export const INNER_HALLS=new Set(['638981317','638981229','639012193']);

// Nền liên tục từ sân trước Càn Thanh tới sau Khôn Ninh, thu hẹp ở Giao Thái.
export const INNER_TERRACE_OUTLINE=[
 [-25.7,-192],[26.3,-192],[26.3,-247],[17,-247],[17,-280],
 [26.3,-280],[26.3,-313],[-24.8,-313],[-24.8,-280],
 [-17,-280],[-17,-247],[-25.7,-247],
];

export function buildInnerTerrace(){
 const height=INNER_TERRACE_HEIGHT;
 polygon(INNER_TERRACE_OUTLINE,0,height,baseStone,true);
 polygon(INNER_TERRACE_OUTLINE,height,.035,paleCourt);
 surfacePoly(INNER_TERRACE_OUTLINE,height);
 const stairs=[];
 // Lối xuống phía sau Khôn Ninh, nối sang cổng Ngự Hoa Viên.
 stairs.push({c:0,edge:-313,out:-1,width:5.5,axis:'z',run:8.64});
 for(const x of [-7,0,7]){
  stairs.push({c:x,edge:-192,out:1,width:4.6,axis:'z',run:8.64});
 }
 // Cặp thang sân trước lùi về sau; bỏ cặp thang bị hai nhà bên hông che khuất.
 for(const side of [-1,1]){
  stairs.push({c:-210,edge:side>0?26.3:-25.7,out:side,width:3.6,axis:'x',run:8.64});
  stairs.push({c:-264,edge:side*17,out:side,width:4.8,axis:'x',run:8.64});
  // Đặt thang Khôn Ninh trước hai nhà thấp, tránh chui vào nhà và hành lang ngoài.
  stairs.push({c:-288.5,edge:side>0?26.3:-24.8,out:side,width:4.8,axis:'x',run:8.64});
 }
 for(const stair of stairs){
  grandStair(stair.c,stair.edge,stair.out,stair.width,height,stair.run,stair.axis);
 }
 const opening=(x,z)=>stairs.some(stair=>stair.axis==='x'
  ?Math.abs(x-stair.edge)<.7&&Math.abs(z-stair.c)<stair.width/2+1.2
  :Math.abs(z-stair.edge)<.7&&Math.abs(x-stair.c)<stair.width/2+1.2);
 terraceRails(INNER_TERRACE_OUTLINE,height,-192,false,0,opening);
}

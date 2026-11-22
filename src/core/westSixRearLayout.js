// Khu nhà phía sau Tây Lục Cung, đối chiếu bản vẽ ba dải nhà nhỏ.
import {warpZ} from './warp.js';
export const WEST_REAR_BOUNDS={left:-169.5,right:-68.25,rear:-428.65,front:-370.5};
const {left,right,rear,front}=WEST_REAR_BOUNDS;
export const WEST_REAR_GROUNDS=[[left,rear],[right,rear],[right,front],[left,front]];
export const inWestRear=(x,z)=>x>=left&&x<=right&&z>=rear&&z<=front;
export const WEST_REAR_HALLS=[
 // [tâm x, tâm z, rộng, sâu, cao, mái hai tầng]
 [-151,-420,13,6,7,false],[-151,-406,20,8,8.2,false],[-151,-386.5,22,10,10.5,true],
 [-118,-420,15,6,7,false],[-118,-407,20,8,10,true],[-118,-387.5,22,10,10.5,true],
 // Bỏ nhà thứ hai và thứ tư để có hai lối đi ngang giữa ba nhà còn lại.
 [-84.7,-421,13,5,7,false],[-84.7,-401,13,5,7,false],[-84.7,-382.5,21,8,10,true],
];
// Chia đều khoảng hở sau co giãn mặt bằng, kể cả hai khoảng ở đầu dãy.
const eastHalls=WEST_REAR_HALLS.filter(h=>h[0]===-84.7);
function unwarpZ(value){
 let lo=rear,hi=front;
 for(let i=0;i<50;i++){const mid=(lo+hi)/2;if(warpZ(mid)<value)lo=mid;else hi=mid;}
 return (lo+hi)/2;
}
const firstEdge=warpZ(rear+.82),lastEdge=warpZ(-374.5-3.3);
function arrange(gap){
 let edge=firstEdge;
 const centers=eastHalls.map(h=>{
  const center=unwarpZ(edge+gap)+h[3]/2;
  edge=warpZ(center+h[3]/2);return center;
 });
 return {centers,end:edge+gap};
}
let minGap=0,maxGap=(lastEdge-firstEdge)/4;
for(let i=0;i<50;i++){
 const gap=(minGap+maxGap)/2;
 if(arrange(gap).end>lastEdge)maxGap=gap;else minGap=gap;
}
arrange((minGap+maxGap)/2).centers.forEach((z,i)=>eastHalls[i][1]=z);
export const WEST_REAR_EAST_PATH_Z=eastHalls.slice(1).map((h,i)=>
 unwarpZ((warpZ(eastHalls[i][1]+eastHalls[i][3]/2)+warpZ(h[1]-h[3]/2))/2));
export const WEST_REAR_WINGS=[
 [[-165.4,-420],[-165.4,-410]],[[ -165.4,-402],[-165.4,-393]],[[ -165.4,-383],[-165.4,-374.5]],
 [[-135,-417],[-135,-407]],[[ -135,-392],[-135,-376]],
 [[-101.5,-417],[-101.5,-407]],[[ -101.5,-397],[-101.5,-376]],
 [[-95.95,-374.5],[-73.45,-374.5]],
];
export const WEST_REAR_TREES=[[-140,-399.5],[-145,-396],[-133,-399],[-139,-394.5]];

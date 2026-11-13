import {walkableFloor} from '../player/collision.js';
import {cungNu} from './cung-nu/index.js';
import {thaiGiam} from './thai-giam/index.js';

export const commonRanks=[
 {type:'guard',count:88,columns:11,x:-22,z:568},
 {type:'guard',count:40,columns:8,x:22,z:568},
 ...[cungNu,thaiGiam].flatMap(role=>role.formations.map(rank=>({...rank,type:role.type,role}))),
];

export const royalRank={count:9,columns:9,x:0,z:579,spacing:1.6};
export const escortRanks=[
 {count:24,columns:8,x:-10,z:591,color:'#584453'},
 {count:6,columns:3,x:10,z:591,color:'#3b4051'},
];

export function rankPositions({count,columns,x,z,spacing=1.35}){
 return Array.from({length:count},(_,index)=>{
  const row=Math.floor(index/columns);
  const width=Math.min(columns,count-row*columns);
  const px=x+(index%columns-(width-1)/2)*spacing;
  const pz=z+row*spacing;
  if(walkableFloor(px,pz,0)===null)throw new Error('Invalid Ngọ Môn formation position: '+px+', '+pz);
  return [px,pz];
 });
}

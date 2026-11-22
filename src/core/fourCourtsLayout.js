import {warpX} from './warp.js';

const left=-262.2,right=-157.9;
function unwarpX(value){
 let lo=left,hi=right;
 for(let i=0;i<50;i++){
  const mid=(lo+hi)/2;
  if(warpX(mid)<value)lo=mid;else hi=mid;
 }
 return (lo+hi)/2;
}
// Chia chiều rộng hiển thị theo tỉ lệ 1 : 1 : 1 : 1,2.
const start=warpX(left),unit=(warpX(right)-start)/4.2;
export const FOUR_COURT_DIVISIONS=[left,...[1,2,3].map(n=>unwarpX(start+n*unit)),right];
export const FOUR_COURT_CENTERS=[.5,1.5,2.5,3.6].map(n=>unwarpX(start+n*unit));

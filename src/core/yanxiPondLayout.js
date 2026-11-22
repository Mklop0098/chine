import {EAST_SIX_COURTS} from './eastSixLayout.js';

const court=EAST_SIX_COURTS.find(c=>c.statue);
export const YANXI_POND={x:court.x,z:court.mainZ,rx:5.8,rz:5.5,waterY:.042,statueBaseY:.065};
export const YANXI_POND_OUTLINE=Array.from({length:96},(_,i)=>{
 const a=i*Math.PI*2/96;
 return [YANXI_POND.x+Math.cos(a)*YANXI_POND.rx,YANXI_POND.z+Math.sin(a)*YANXI_POND.rz];
});

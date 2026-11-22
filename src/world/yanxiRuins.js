import {box,surfaceRect} from '../builders/primitives.js';
import {grandStair} from '../builders/stairs.js';
import {baseStone,carvedStone} from '../materials/textures.js';

// Khung công trình đá không mái tại Diên Hy, theo ký hiệu công trình dang dở trên bản vẽ.
export function buildYanxiRuins(x,z){
 const y=.5,w=18,d=16;
 box(x,y/2,z,w,y,d,baseStone,true);surfaceRect(x,z,w,d,y);
 grandStair(x,z+d/2,1,4,y,1.5,'z');
 // Các trụ và lanh tô để lộ ô cửa, không biến thành một điện mái ngói khác.
 for(const side of [-1,1]){
  for(const dx of [-7,0,7]){
   box(x+dx,y+2.8,z+side*6.5,.7,5.6,.7,carvedStone,true);
   box(x+dx,y+5.7,z+side*6.5,1,.35,1,carvedStone);
  }
  for(const dz of [-6.5,0,6.5]){
   if(dz===0)box(x+side*7,y+2.8,z,.7,5.6,.7,carvedStone,true);
  }
  box(x,y+5.4,z+side*6.5,14.7,.45,.65,carvedStone);
  box(x+side*7,y+5.4,z,.65,.45,13.7,carvedStone);
  if(side<0)box(x,y+.6,z+side*6.5,14,1.2,.45,baseStone,true);
  else for(const end of [-1,1])box(x+end*4.45,y+.6,z+6.5,5.1,1.2,.45,baseStone,true);
 }
 // Lõi khung cao ở giữa; các tầng vẫn trống và nhìn xuyên được.
 for(const dx of [-3,3])for(const dz of [-3,3]){
  box(x+dx,y+5,z+dz,.75,10,.75,carvedStone,true);
  box(x+dx,y+10.15,z+dz,1.05,.35,1.05,carvedStone);
 }
 for(const height of [4.5,8.5,10])for(const side of [-1,1]){
  box(x,y+height,z+side*3,6.75,.45,.65,carvedStone);
  box(x+side*3,y+height,z,.65,.45,6.75,carvedStone);
 }
}

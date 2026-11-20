// Cầu thang đá có thành bên đặc (mặt bên hình thang) và lan can trụ đầu tròn, tay vịn chạy theo độ dốc.
import * as THREE from 'three';
import {add,beamBetween,box,surfaceRect} from './primitives.js';
import {vec} from '../core/utils.js';
import {baseStone,carvedStone,stone} from '../materials/textures.js';

/*
 Cầu thang từ mép nền (edge) đi ra ngoài theo hướng out (+1 / -1).
 axis 'z': bậc chạy theo trục z (mép nền là z = edge, tâm ngang tại x = c); axis 'x': ngược lại.
 rise: chiều cao nền; run: chiều dài cầu thang; width: bề rộng mặt bậc (chưa tính thành bên).
*/
export function grandStair(c,edge,out,width,rise,run,axis='z',{bottom=0,cheek=.62,rails=true}={}){
 const n=Math.max(2,Math.round(rise/.16)),foot=edge+out*run;
 // (a: tọa độ dọc cầu thang, b: tọa độ ngang) -> thế giới
 const W=(a,b)=>axis==='z'?[c+b,a]:[a,c+b];
 const B=(a,b,y,la,lb,h,mat,solid=false)=>{const [x,z]=W(a,b);return axis==='z'?box(x,y,z,lb,h,la,mat,solid):box(x,y,z,la,h,lb,mat,solid)};
 const S=(a,b,y)=>{const [x,z]=W(a,b);return vec(x,y,z)};
 for(let i=0;i<n;i++){
  const h=rise*(i+1)/n,a=foot-out*(i+.5)*run/n,la=run/n+.03;
  const st=B(a,0,bottom+h/2,la,width,h,stone,true);st.userData.step=true;
  {const [x,z]=W(a,0);axis==='z'?surfaceRect(x,z,width,la,bottom+h):surfaceRect(x,z,la,width,bottom+h)}
  B(a+out*(run/n/2-.03),0,bottom+h-.02,.06,width,.04,baseStone);
 }
 // Thành bên đặc: mặt cắt hình thang từ chân (thấp) lên mép nền.
 const cap=.32;
 for(const s of [-1,1]){
  const shape=new THREE.Shape();
  shape.moveTo(0,0);shape.lineTo(run,0);shape.lineTo(run,rise+cap);shape.lineTo(0,cap);shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:cheek,bevelEnabled:false});
  // Hình dựng trong mặt phẳng (u lên dốc theo +x cục bộ, y), dày theo z cục bộ; xoay về trục cầu thang.
  g.translate(0,0,-cheek/2);
  const m=add(g,stone,0,bottom,0,{solid:true});
  const [x0,z0]=W(foot,s*(width/2+cheek/2));
  m.position.set(x0,bottom,z0);
  // hướng +x cục bộ phải chỉ từ chân lên mép nền (ngược hướng out)
  if(axis==='z')m.rotation.y=out>0?Math.PI/2:-Math.PI/2;
  else m.rotation.y=out>0?Math.PI:0;
  // Đá phủ mặt dốc thành bên.
  beamBetween(S(foot,s*(width/2+cheek/2),bottom+cap+.03),S(edge,s*(width/2+cheek/2),bottom+rise+cap+.03),.36,carvedStone,4);
  if(!rails)continue;
  // Lan can: trụ đầu tròn theo dốc, tay vịn trên, thanh dưới.
  const posts=Math.max(2,Math.ceil(run/1.7));
  const rail=.95;
  for(let k=0;k<=posts;k++){
   const t=k/posts,a=foot-out*t*run,y=bottom+cap+t*rise;
   B(a,s*(width/2+cheek/2),y+rail/2,.22,.22,rail,stone,true);
   const [px,pz]=W(a,s*(width/2+cheek/2));
   add(new THREE.SphereGeometry(.15,10,8),carvedStone,px,y+rail+.1,pz);
  }
  beamBetween(S(foot,s*(width/2+cheek/2),bottom+cap+rail-.12),S(edge,s*(width/2+cheek/2),bottom+cap+rise+rail-.12),.07,stone,6);
  beamBetween(S(foot,s*(width/2+cheek/2),bottom+cap+.35),S(edge,s*(width/2+cheek/2),bottom+cap+rise+.35),.05,stone,6);
 }
}

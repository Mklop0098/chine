// Nhân vật chính: một cung nữ triều Thanh, điều khiển được, camera góc thứ ba phía sau.
// Trang phục: tiện bào xanh lơ, khảm khiên (áo gile) xanh đậm viền hoa mai, cổ đứng trắng,
// giày "hoa bồn để" đế cao, tóc tết một bím dài buộc nơ đỏ, búi trên đỉnh cài hoa và tua đỏ.
import * as THREE from 'three';
import {scene} from '../core/scene.js';
import {pointInPolygon} from '../builders/primitives.js';
import {grid} from '../world/finalize.js';
import {pleat,silkMaterial} from '../npc/cloth.js';

export const hero={
 rig:null,yaw:Math.PI,camYaw:0,camPitch:.3,camDist:4.2,camCur:4.2,
 y:0,speed:0,phase:0,bow:-1,time:0,turnRate:0,
 kneel:0,kneelTarget:0,kneelT:0,
 // Dùng cho cinematic: sit 0..1 (ngồi), pose {head:[cúi,quay,nghiêng], l/r:[x,z,khuỷu], w} ghi đè tư thế.
 sit:0,sitTarget:0,pose:null,poseW:0
};

const PALETTE={
 robe:'#8fc4d6',vest:'#22385a',trim:'#f1d3dc',skin:'#edc5ad',hair:'#141216',lips:'#c23c4f',
 white:'#f2ede2',shoe:'#22385a',sole:'#f4f0e6',gold:'#d9b25a',red:'#c22a33',pink:'#ef9fb4',kerchief:'#f5c6d4'
};
const mats=new Map();
const mat=(c,o={})=>{
 const k=c+JSON.stringify(o);
 if(!mats.has(k)){const m=new THREE.MeshStandardMaterial({color:c,roughness:.72,...o});m.envMapIntensity=.45;mats.set(k,m)}
 return mats.get(k);
};
function part(parent,geo,color,x=0,y=0,z=0,o){
 const m=new THREE.Mesh(geo,typeof color==='string'?mat(color,o):color);
 m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;
}
const group=(parent,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g};
const lathe=(pts,seg=28)=>new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),seg);
const sphere=(r,w=14,h=10)=>new THREE.SphereGeometry(r,w,h);

// Hồ sơ áo khảm khiên (bán kính theo chiều cao) – dùng cả để dựng và để đặt hoa thêu lên mặt áo.
const VEST=[[.245,.66],[.232,.9],[.205,1.12],[.212,1.3],[.168,1.41],[.07,1.46]];
const VEST_Z=.84;
function vestR(y){
 for(let i=1;i<VEST.length;i++){const [r0,y0]=VEST[i-1],[r1,y1]=VEST[i];if(y<=y1)return r0+(r1-r0)*(y-y0)/(y1-y0)}
 return VEST[VEST.length-1][0];
}

function plum(parent,a,y,size=1){
 // Hoa mai thêu: 5 cánh quanh một nhụy vàng, đặt sát mặt áo.
 const r=vestR(y)+.004,x=Math.sin(a)*r,z=Math.cos(a)*r*VEST_Z;
 const f=group(parent,x,y,z);f.lookAt(x*2,y,z*2);
 for(let i=0;i<5;i++){const t=i/5*6.283;part(f,sphere(.011*size,6,5),PALETTE.pink,Math.cos(t)*.014*size,Math.sin(t)*.014*size,0).scale.z=.4}
 part(f,sphere(.007*size,6,5),PALETTE.gold,0,0,.002).scale.z=.5;
}

let rig,hips,robe,head,braid=[],arms=[],forearms=[],shoes=[],kerchief,tassel,shadow;

export function buildHero(){
 rig=new THREE.Group();rig.visible=false;rig.scale.setScalar(.97);
 hero.rig=rig;scene.add(rig);
 shadow=new THREE.Mesh(new THREE.CircleGeometry(.36,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#000',transparent:true,opacity:.3,depthWrite:false}));
 shadow.position.y=.02;shadow.renderOrder=2;rig.add(shadow);

 // Giày hoa bồn để: đế cao giữa lòng bàn chân, thân giày xanh thêu hoa.
 for(const side of [1,-1]){
  const s=group(rig,side*.08,0,0);
  part(s,new THREE.CylinderGeometry(.034,.05,.095,10),PALETTE.sole,0,.048,.0);
  part(s,new THREE.BoxGeometry(.085,.05,.2),PALETTE.shoe,0,.12,.02);
  part(s,sphere(.022,8,6),PALETTE.shoe,0,.125,.115).scale.set(1.6,1,1);
  part(s,sphere(.012,6,5),PALETTE.pink,0,.15,.07);
  shoes.push(s);
 }

 hips=group(rig);
 // Tiện bào (áo dài) và viền gấu.
 // Nếp áo sâu dần về gấu; viền gấu gợn cùng nếp. Lụa có ánh sheen và vân dệt.
 const RP={n:18,amp:.012,top:.95,bottom:.15};
 robe=part(hips,pleat(lathe([[0,.15],[.27,.15],[.268,.22],[.265,.32],[.23,.62],[.185,.92],[.17,1.12],[.185,1.3],[.15,1.4],[.06,1.45],[0,1.45]],48),RP),silkMaterial({color:PALETTE.robe}));
 robe.scale.z=.82;
 const hem=part(hips,pleat(lathe([[.272,.15],[.276,.23],[.268,.23],[.266,.15]],48),RP),silkMaterial({color:PALETTE.trim}));hem.scale.z=.82;
 // Khảm khiên, viền dưới và hai nẹp trước.
 const VP={n:12,amp:.006,top:1.05,bottom:.66};
 const vest=part(hips,pleat(lathe([[0,.66],...VEST,[0,1.46]],40),VP),silkMaterial({color:PALETTE.vest}));vest.scale.z=VEST_Z;
 const vestHem=part(hips,pleat(lathe([[.249,.66],[.244,.73],[.236,.73],[.24,.66]],40),VP),PALETTE.trim);vestHem.scale.z=VEST_Z;
 for(const side of [-1,1]){
  const edge=part(hips,new THREE.BoxGeometry(.016,.7,.01),PALETTE.trim,side*.04,1.04,0);
  edge.position.z=vestR(1.04)*VEST_Z+.004;edge.rotation.x=-.05;
 }
 for(const [a,y,s] of [[0,.82,1],[.5,1.0,.9],[-.5,1.0,.9],[Math.PI,.86,1.1],[Math.PI+.45,1.08,1],[Math.PI-.45,1.08,1],[Math.PI,1.22,.9],[1.5,.9,.9],[-1.5,.9,.9],[2.4,1.15,.8],[-2.4,1.15,.8]])plum(hips,a,y,s);
 // Khăn tay hồng giắt ở cúc áo bên phải.
 kerchief=group(hips,.085,1.36,vestR(1.36)*VEST_Z+.01);
 const kg=new THREE.PlaneGeometry(.07,.1).translate(0,-.05,0);
 part(kerchief,kg,new THREE.MeshStandardMaterial({color:PALETTE.kerchief,roughness:.8,side:THREE.DoubleSide})).rotation.z=.2;
 // Cổ áo đứng và cổ.
 part(hips,new THREE.CylinderGeometry(.062,.07,.06,16),PALETTE.white,0,1.48,0);
 part(hips,new THREE.TorusGeometry(.068,.012,6,18).rotateX(Math.PI/2),PALETTE.trim,0,1.51,0);
 part(hips,new THREE.CylinderGeometry(.038,.043,.08,10),PALETTE.skin,0,1.54,0);

 // Đầu, mặt, tóc.
 head=group(hips,0,1.545,0);head.scale.setScalar(1.1);
 part(head,sphere(.1,20,16),PALETTE.skin,0,.1,0).scale.set(.92,1.08,.98);
 // Khuôn mặt: ảnh chân dung (public/textures/hero-face.png) dán lên mặt trước của đầu.
 // Nếu không tải được ảnh thì dùng mặt vẽ đơn giản.
 const drawn=group(head);
 for(const side of [-1,1]){
  part(drawn,sphere(.013,10,8),'#1b1414',side*.034,.108,.086,{roughness:.3}).scale.set(1.35,.7,.45);
  part(drawn,new THREE.BoxGeometry(.036,.006,.006),'#2a1f1f',side*.034,.131,.089).rotation.z=side*-.12;
  part(head,sphere(.017,8,6),PALETTE.skin,side*.093,.098,0).scale.set(.5,1,.8);
  part(head,sphere(.008,6,5),PALETTE.gold,side*.095,.07,.005,{metalness:.6,roughness:.35});
 }
 part(drawn,sphere(.009,6,5),PALETTE.skin,0,.088,.098);
 part(drawn,sphere(.013,10,6),PALETTE.lips,0,.055,.088).scale.set(1.5,.55,.5);
 drawn.visible=false;
 const faceMat=new THREE.MeshStandardMaterial({transparent:true,roughness:.62,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
 faceMat.envMapIntensity=.35;
 const face=part(head,new THREE.SphereGeometry(.1015,32,26,Math.PI/2-.85,1.7,.62,2.05),faceMat,0,.1,0);
 face.scale.set(.92,1.08,.98);face.renderOrder=1;face.visible=false;
 new THREE.TextureLoader().load(import.meta.env.BASE_URL+'textures/hero-face.png',tex=>{
  tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;faceMat.map=tex;faceMat.needsUpdate=true;face.visible=true;
 },undefined,()=>{drawn.visible=true});
 const cap=part(head,new THREE.SphereGeometry(.108,20,12,0,Math.PI*2,0,Math.PI*.56),PALETTE.hair,0,.105,-.008,{roughness:.45});
 cap.scale.set(1,1.05,1.04);cap.rotation.x=-.8;
 // Kiểu tóc "tiểu lưỡng bả đầu": hai búi tròn hai bên đỉnh đầu, giữa là búi nhỏ, trâm vàng xuyên ngang.
 part(head,sphere(.045,14,10),PALETTE.hair,0,.2,-.04,{roughness:.45}).scale.set(1.1,.8,1);
 for(const side of [-1,1])part(head,sphere(.045,14,10),PALETTE.hair,side*.075,.2,-.045,{roughness:.45}).scale.set(.95,.85,.75);
 part(head,new THREE.CylinderGeometry(.005,.005,.26,6).rotateZ(Math.PI/2),PALETTE.gold,0,.205,-.012,{metalness:.7,roughness:.3});
 for(const [x,c] of [[.11,PALETTE.pink],[-.115,'#e45d79'],[.03,'#f6efe6']]){
  const f=group(head,x,.225,-.005);
  for(let i=0;i<5;i++){const t=i/5*6.283;part(f,sphere(.016,8,6),c,Math.cos(t)*.018,Math.sin(t)*.018,.01).scale.z=.5}
  part(f,sphere(.01,6,5),PALETTE.gold,0,0,.018);
 }
 tassel=group(head,.125,.215,-.03);
 part(tassel,new THREE.CylinderGeometry(.004,.004,.12,5).translate(0,-.06,0),PALETTE.red);
 part(tassel,new THREE.ConeGeometry(.016,.05,8).translate(0,-.14,0),PALETTE.red);
 // Bím tóc dài sau lưng, buộc nơ đỏ ở gốc và tua ở ngọn.
 let parent=group(head,0,.07,-.105);
 part(parent,new THREE.TorusGeometry(.03,.01,6,12).rotateX(Math.PI/2),PALETTE.red,0,-.01,0);
 for(let i=0;i<9;i++){
  const seg=group(parent,0,i?-.068:-.02,0);
  part(seg,sphere(.032-i*.0018,10,8),PALETTE.hair,0,-.035,0,{roughness:.45}).scale.set(1,1.35,.85);
  braid.push(seg);parent=seg;
 }
 part(parent,new THREE.CylinderGeometry(.012,.004,.05,6),PALETTE.red,0,-.09,0);
 part(parent,new THREE.ConeGeometry(.02,.09,8).rotateX(Math.PI),PALETTE.red,0,-.15,0);

 // Tay: vai → cánh tay → khuỷu → cẳng tay, ống tay loe, viền tay áo trắng hồng, bàn tay.
 for(const side of [1,-1]){
  const sh=group(hips,side*.19,1.38,0);
  part(sh,sphere(.06,12,8),PALETTE.robe,0,0,0);
  part(sh,new THREE.CylinderGeometry(.052,.062,.3,12).translate(0,-.15,0),PALETTE.robe);
  const el=group(sh,0,-.3,0);
  part(el,new THREE.CylinderGeometry(.062,.088,.27,12).translate(0,-.135,0),PALETTE.robe);
  part(el,new THREE.CylinderGeometry(.09,.09,.05,12).translate(0,-.275,0),PALETTE.white);
  part(el,new THREE.CylinderGeometry(.091,.091,.018,12).translate(0,-.252,0),PALETTE.trim);
  part(el,sphere(.038,10,8),PALETTE.skin,0,-.325,.005).scale.set(.75,1.15,.55);
  arms.push(sh);forearms.push(el);
 }
 rig.traverse(o=>{if(o.isMesh&&o!==shadow)o.castShadow=false});
 return rig;
}

export function setHeroVisible(v){if(rig)rig.visible=v}
export const heroParts=()=>({rig,head,hips});

// Quỳ hành lễ: bật/tắt. Khi quỳ xong sẽ cúi lạy một lần rồi giữ tư thế quỳ.
export function toggleKneel(){
 if(hero.bow>=0||hero.speed>.6)return false;
 hero.kneelTarget=hero.kneelTarget?0:1;
 if(hero.kneelTarget)hero.kneelT=0;
 return true;
}
export const heroKneeling=()=>hero.kneelTarget>0||hero.kneel>.04;
const smooth=t=>t*t*(3-2*t);

const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

// Gọi mỗi khung hình khi đang điều khiển nhân vật: đặt vị trí và chạy hoạt ảnh.
export function updateHero(dt,x,feet,z){
 hero.time+=dt;
 hero.y=lerp(hero.y,feet,1-Math.exp(-dt*16));
 rig.position.set(x,hero.y,z);rig.rotation.y=hero.yaw;
 const sp=hero.speed,amp=clamp(sp/2.1,0,1),run=clamp((sp-2.6)/2.4,0,1);
 hero.phase+=dt*sp*(5.4-run*1.4);
 const s=Math.sin(hero.phase),c=Math.cos(hero.phase);
 // Hành lễ (vạn phúc): khụy gối, cúi đầu, hai tay đặt bên hông phải.
 let bowK=0;
 if(hero.bow>=0){hero.bow+=dt/1.9;if(hero.bow>=1)hero.bow=-1;else bowK=Math.sin(Math.PI*hero.bow)}
 // Quỳ: k = mức hạ người (0 đứng → 1 quỳ hẳn); prost = mức cúi lạy khi đã quỳ.
 hero.kneel+=Math.sign(hero.kneelTarget-hero.kneel)*Math.min(Math.abs(hero.kneelTarget-hero.kneel),dt/.75);
 const k=smooth(hero.kneel);
 let prost=0;
 if(hero.kneelTarget&&hero.kneel>.98){hero.kneelT+=dt;const t=(hero.kneelT-.25)/1.5;if(t>0&&t<1)prost=Math.sin(Math.PI*t)}
 const stride=.15+run*.12;
 shoes.forEach((sh,i)=>{
  const d=i?-1:1;
  sh.position.z=lerp(d*s*stride*amp,-.3,k)+hero.sit*.3;
  sh.position.y=lerp(Math.max(0,d*c)*(.045+run*.05)*amp,.05,k);
  sh.position.x=d*lerp(.08,.11,k);
  sh.rotation.x=lerp(-Math.max(0,d*c)*.35*amp,1.45,k);
 });
 const breathe=Math.sin(hero.time*2.1)*.004*(1-amp);
 hero.sit+=(hero.sitTarget-hero.sit)*(1-Math.exp(-dt*5));
 const sitK=hero.sit;
 hips.position.y=Math.abs(c)*(.022+run*.03)*amp+breathe-bowK*.14-k*.5-sitK*.46;
 hips.position.z=-bowK*.03-k*.06+prost*.05;
 hips.rotation.x=lerp(hips.rotation.x,sp*.02+run*.1+bowK*.12+prost*.62+(hero.lean||0),1-Math.exp(-dt*8));
 robe.scale.z=.82*(1+k*.22);
 hips.rotation.y=s*.06*amp;
 hips.rotation.z=hero.turnRate*-.04*amp;
 robe.rotation.z=s*.03*amp;robe.scale.x=1+Math.abs(s)*.03*amp+k*.12;
 head.rotation.y=-s*.05*amp;
 head.rotation.x=bowK*.42+prost*.35-hips.rotation.x*.4+Math.sin(hero.time*.7)*.02*(1-amp)+k*.06;
 // Tay: đứng yên thì chắp tay trước bụng; đi thì đung đưa; chạy thì gập khuỷu.
 const w=clamp(amp*1.6,0,1);
 arms.forEach((a,i)=>{
  const side=i?-1:1,el=forearms[i];
  // Đứng yên: hai tay thả lỏng hai bên người.
  const clasp=[.04,side*.1],swing=[side*s*(.32+run*.45),side*.06];
  const bowPose=side>0?[-.18,-.32]:[-.12,-.08];
  let ax=lerp(clasp[0],swing[0],w),az=lerp(clasp[1],swing[1],w),ex=lerp(-.14,-.2-run*1.1,w);
  ax=lerp(ax,bowPose[0],bowK);az=lerp(az,bowPose[1],bowK);ex=lerp(ex,-.75,bowK);
  // Quỳ: tay đặt trên đùi; khi cúi lạy thì hai tay chống xuống đất phía trước.
  ax=lerp(ax,lerp(-.42,-1.15,prost),k);az=lerp(az,-side*lerp(.2,.1,prost),k);ex=lerp(ex,lerp(-.85,-.15,prost),k);
  // Ngồi: tay đặt trên đùi.
  ax=lerp(ax,-.38,hero.sit);az=lerp(az,-side*.12,hero.sit);ex=lerp(ex,-1.08,hero.sit);
  // Tư thế do kịch bản điều khiển.
  const P=hero.pose&&(side>0?hero.pose.l:hero.pose.r);
  if(P){const b=(P[3]??1)*hero.poseW;ax=lerp(ax,P[0],b);az=lerp(az,P[1],b);ex=lerp(ex,P[2],b)}
  a.rotation.x=lerp(a.rotation.x,ax,1-Math.exp(-dt*12));
  a.rotation.z=lerp(a.rotation.z,az,1-Math.exp(-dt*12));
  el.rotation.x=lerp(el.rotation.x,ex,1-Math.exp(-dt*12));
 });
 hero.poseW+=((hero.pose?1:0)-hero.poseW)*(1-Math.exp(-dt*6));
 if(hero.pose&&hero.pose.head){
  const [hx,hy,hz]=hero.pose.head,b=hero.poseW;
  head.rotation.x=lerp(head.rotation.x,hx,b);head.rotation.y=lerp(head.rotation.y,hy,b);head.rotation.z=lerp(head.rotation.z,hz||0,b);
 }else head.rotation.z=lerp(head.rotation.z,0,1-Math.exp(-dt*5));
 // Bím tóc, khăn tay, tua đỏ đung đưa có độ trễ.
 const lean=hips.rotation.x+head.rotation.x;
 braid.forEach((b,i)=>{
  const tx=(i?0:.12-lean)+.03+sp*.012+Math.sin(hero.phase*.5-i*.55)*.035*amp;
  const tz=Math.sin(hero.phase*.5-i*.6)*.05*amp+hero.turnRate*.03;
  b.rotation.x=lerp(b.rotation.x,tx,1-Math.exp(-dt*(10-i*.6)));
  b.rotation.z=lerp(b.rotation.z,tz,1-Math.exp(-dt*(10-i*.6)));
 });
 kerchief.rotation.x=-.08-sp*.06+Math.sin(hero.phase)*.12*amp;
 kerchief.rotation.z=Math.sin(hero.phase*.5)*.15*amp;
 tassel.rotation.x=-sp*.05+Math.sin(hero.phase)*.2*amp;
 tassel.rotation.z=Math.sin(hero.time*1.3)*.05;
 shadow.scale.setScalar(1-bowK*.05);
}

// Camera sau lưng: kéo vào gần khi bị tường/công trình che (dùng lưới va chạm có sẵn).
function blocked(x,y,z){
 const near=grid.get(Math.floor(x/18)+','+Math.floor(z/18));
 if(!near)return false;
 for(const {b,outline} of near){
  if(x<b.min.x-.15||x>b.max.x+.15||z<b.min.z-.15||z>b.max.z+.15||y<b.min.y-.1||y>b.max.y+.15)continue;
  if(!outline||pointInPolygon(x,z,outline))return true;
 }
 return false;
}

export function placeHeroCamera(camera,dt){
 const tx=rig.position.x,ty=hero.y+1.48-smooth(hero.kneel)*.45,tz=rig.position.z;
 const cp=Math.cos(hero.camPitch),dx=Math.sin(hero.camYaw)*cp,dy=Math.sin(hero.camPitch),dz=Math.cos(hero.camYaw)*cp;
 let want=hero.camDist;
 for(let t=.35;t<=hero.camDist;t+=.18){if(blocked(tx+dx*t,ty+dy*t,tz+dz*t)){want=Math.max(.55,t-.3);break}}
 hero.camCur=want<hero.camCur?want:lerp(hero.camCur,want,1-Math.exp(-dt*3.5));
 const d=hero.camCur;
 if(camera.near!==.08){camera.near=.08;camera.updateProjectionMatrix()}
 camera.position.set(tx+dx*d,Math.max(ty+dy*d,hero.y+.3),tz+dz*d);
 camera.lookAt(tx,ty+.08,tz);
 rig.visible=d>.7;
}

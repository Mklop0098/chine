// Đạo cụ cho Chương I: xe ngựa, ngựa, cổng cung hai cánh, bàn kiểm danh, cờ, lá rơi, chim, đường ngoại ô, cảnh montage.
import * as THREE from 'three';
import {scene} from '../core/scene.js';
import {pushBeam,pushTRS,flushGroups} from '../world/instancer.js';
import {clump} from '../world/trees.js';
import {bake} from '../npc/figure.js';

const M=new Map();
export function mat(c,o={}){
 const k=c+JSON.stringify(o);
 if(!M.has(k)){const m=new THREE.MeshStandardMaterial({color:c,roughness:.8,...o});m.envMapIntensity=.4;M.set(k,m)}
 return M.get(k);
}
export function canvasTex(w,h,paint,repeat=false){
 const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
 if(repeat)t.wrapS=t.wrapT=THREE.RepeatWrapping;
 return t;
}
function mesh(parent,geo,m,x=0,y=0,z=0,shadow=true){
 const o=new THREE.Mesh(geo,typeof m==='string'?mat(m):m);o.position.set(x,y,z);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o;
}
const box=(p,w,h,d,m,x,y,z,sh)=>mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z,sh);

// ---------- Ngựa ----------
export function makeHorse(coat='#6b4429',mane='#1f1612'){
 const g=new THREE.Group(),coatM=mat(coat,{roughness:.6}),maneM=mat(mane,{roughness:.7}),hoofM=mat('#2a2421');
 const bodyG=new THREE.Group();g.add(bodyG);
 mesh(bodyG,new THREE.SphereGeometry(.42,20,14).scale(1,1,2.05),coatM,0,1.38,0);
 mesh(bodyG,new THREE.SphereGeometry(.4,16,12).scale(1,1,1),coatM,0,1.4,.55);
 mesh(bodyG,new THREE.SphereGeometry(.4,16,12),coatM,0,1.42,-.55);
 // Cổ, đầu, tai, bờm.
 const neck=new THREE.Group();neck.position.set(0,1.62,-.72);neck.rotation.x=-.75;bodyG.add(neck);
 mesh(neck,new THREE.CylinderGeometry(.17,.28,.85,14).translate(0,.4,0),coatM);
 const head=new THREE.Group();head.position.set(0,.82,0);head.rotation.x=-1.34;neck.add(head);
 mesh(head,new THREE.CylinderGeometry(.1,.16,.62,12).translate(0,.28,0),coatM);
 mesh(head,new THREE.SphereGeometry(.11,10,8),coatM,0,.6,.0);
 for(const s of [-1,1]){
  mesh(head,new THREE.ConeGeometry(.04,.14,6),coatM,s*.07,.02,.13).rotation.x=Math.PI/2;
  mesh(head,new THREE.SphereGeometry(.025,8,6),'#0e0b0a',s*.115,.16,.04);
 }
 for(let i=0;i<9;i++)box(neck,.06,.16,.12,maneM,0,.05+i*.09,.16+i*.004-i*.012).rotation.x=-.2;
 // Dây cương, yên cương.
 mesh(neck,new THREE.TorusGeometry(.27,.045,8,16),'#5a2d1d',0,.08,0).rotation.x=Math.PI/2;
 box(bodyG,.86,.08,.5,'#7a3424',0,1.79,-.35);
 // Đuôi.
 const tail=new THREE.Group();tail.position.set(0,1.55,.9);bodyG.add(tail);
 mesh(tail,new THREE.CylinderGeometry(.06,.02,.75,8).translate(0,-.37,0),maneM).rotation.x=.35;
 // Bốn chân, mỗi chân hai khớp.
 const legs=[];
 for(const [x,z,ph] of [[-.2,-.62,Math.PI*.5],[.2,-.62,Math.PI*1.5],[-.2,.62,0],[.2,.62,Math.PI]]){
  const hip=new THREE.Group();hip.position.set(x,1.22,z);bodyG.add(hip);
  mesh(hip,new THREE.CylinderGeometry(.08,.065,.55,10).translate(0,-.27,0),coatM);
  const knee=new THREE.Group();knee.position.y=-.55;hip.add(knee);
  mesh(knee,new THREE.CylinderGeometry(.05,.045,.55,8).translate(0,-.27,0),coatM);
  mesh(knee,new THREE.CylinderGeometry(.065,.07,.1,10),hoofM,0,-.6,0);
  legs.push({hip,knee,ph});
 }
 return {group:g,bodyG,neck,head,tail,legs,phase:Math.random()*6,stride:0};
}
export function animateHorse(h,dt,speed,t){
 h.phase+=dt*speed*2.6;
 const amp=Math.min(1,speed/1.5);
 for(const {hip,knee,ph} of h.legs){
  const a=h.phase+ph;
  hip.rotation.x=Math.sin(a)*.42*amp;
  knee.rotation.x=Math.max(0,-Math.cos(a))*.8*amp;
 }
 h.bodyG.position.y=Math.abs(Math.sin(h.phase*2))*.03*amp;
 h.neck.rotation.x=-.75+Math.sin(h.phase*2)*.06*amp+Math.sin(t*.7)*.03;
 h.tail.rotation.z=Math.sin(t*1.7)*.25;h.tail.rotation.x=Math.sin(t*1.1)*.1;
}

// ---------- Xe ngựa ----------
function curtainTex(color){
 return canvasTex(128,128,(c)=>{
  c.fillStyle=color;c.fillRect(0,0,128,128);
  for(let x=0;x<128;x+=8){const g=c.createLinearGradient(x,0,x+8,0);g.addColorStop(0,'rgba(0,0,0,.25)');g.addColorStop(.5,'rgba(255,255,255,.08)');g.addColorStop(1,'rgba(0,0,0,.25)');c.fillStyle=g;c.fillRect(x,0,8,128)}
  c.fillStyle='rgba(220,190,110,.7)';c.fillRect(0,118,128,10);
 });
}
/*
 Hệ toạ độ xe: gốc ở mặt đất giữa trục bánh, xe tiến theo hướng −z.
 Khoang: sàn y=1.0, trong khoảng x∈[−.85,.85], z∈[−1.2,1.2]; ghế dài dọc hai bên, mặt ghế cao 1.46.
*/
export function makeCarriage({cover='#24384f',curtain='#2f4a3a',wood='#6b4a2b'}={}){
 const g=new THREE.Group(),cabin=new THREE.Group();g.add(cabin);
 const woodM=mat(wood,{roughness:.75}),darkWood=mat('#4a3220',{roughness:.8}),coverM=mat(cover,{roughness:.9,side:THREE.DoubleSide});
 const curtainM=new THREE.MeshStandardMaterial({map:curtainTex(curtain),roughness:.95,side:THREE.DoubleSide});
 // Sàn, váy che dưới gầm.
 box(cabin,1.84,.12,2.6,darkWood,0,.94,0);
 for(const s of [-1,1])box(cabin,.05,.42,2.5,woodM,s*.92,.72,0);
 // Vách: dưới cửa sổ là ván, trên là khung; cửa sổ hai bên ở giữa.
 const H0=1.0,winY0=1.75,winY1=2.32,top=2.62;
 for(const s of [-1,1]){
  box(cabin,.06,winY0-H0,2.5,woodM,s*.89,(H0+winY0)/2,0);
  box(cabin,.06,top-winY1,2.5,woodM,s*.89,(winY1+top)/2,0);
  for(const z of [-1.0,1.0])box(cabin,.06,winY1-winY0,.5,woodM,s*.89,(winY0+winY1)/2,z);
  for(const y of [winY0,winY1])box(cabin,.08,.05,2.52,darkWood,s*.9,y,0);
 }
 // Vách trước có ô cửa nhỏ, vách sau là cửa lên xuống có rèm.
 box(cabin,1.84,winY0-H0,.06,woodM,0,(H0+winY0)/2,-1.25);
 for(const s of [-1,1])box(cabin,.55,winY1-winY0,.06,woodM,s*.645,(winY0+winY1)/2,-1.25);
 box(cabin,1.84,top-winY1,.06,woodM,0,(winY1+top)/2,-1.25);
 for(const s of [-1,1])box(cabin,.45,top-H0,.06,woodM,s*.695,(H0+top)/2,1.25);
 box(cabin,.95,top-2.15,.06,woodM,0,(2.15+top)/2,1.25);
 // Mui xe: nửa trụ phủ vải.
 const roof=mesh(cabin,new THREE.CylinderGeometry(1.02,1.02,2.9,20,1,true,-Math.PI/2,Math.PI),coverM,0,top-.35,0);
 roof.rotation.x=-Math.PI/2;roof.scale.set(1,1,.55);
 for(const z of [-1.4,-.5,.5,1.4])mesh(cabin,new THREE.TorusGeometry(1.0,.03,6,20,Math.PI),darkWood,0,top-.35,z).scale.set(1,.55,1);
 // Ghế dài hai bên.
 for(const s of [-1,1]){
  box(cabin,.46,.46,2.3,woodM,s*.62,1.23,0);
  box(cabin,.48,.05,2.32,mat('#8a3a2a',{roughness:.9}),s*.62,1.48,0);
 }
 // Rèm: cửa sổ phải (vén được), trái, trước, cửa sau.
 const curtains={};
 const cur=(name,w,h,x,y,z,ry)=>{const c=new THREE.Group();c.position.set(x,y,z);c.rotation.y=ry;cabin.add(c);const m=mesh(c,new THREE.PlaneGeometry(w,h).translate(0,-h/2,0),curtainM,0,0,0,false);curtains[name]={group:c,mesh:m,h};return c};
 cur('right',1.5,winY1-winY0,.86,winY1,0,Math.PI/2);
 cur('left',1.5,winY1-winY0,-.86,winY1,0,-Math.PI/2);
 cur('front',.74,winY1-winY0,0,winY1,-1.22,0);curtains.front.mesh.scale.x=.55;curtains.front.mesh.position.x=-.17;
 cur('back',.95,2.15-H0,0,2.15,1.23,0);
 // Ghế phu xe phía trước, bậc lên xuống phía sau.
 box(cabin,1.6,.08,.55,woodM,0,1.55,-1.6);
 box(cabin,1.6,.5,.08,woodM,0,1.3,-1.86);
 box(cabin,1.5,.06,.5,darkWood,0,1.02,-1.85);
 for(const s of [-1,1])box(cabin,.08,.6,.08,darkWood,s*.75,1.25,-1.6);
 // Đèn lồng nhỏ treo góc.
 mesh(cabin,new THREE.SphereGeometry(.12,10,8).scale(1,1.25,1),mat('#c22a2a',{emissive:'#3a0806'}),.95,2.3,-1.3);
 // Bánh xe: vành, nan hoa, moay-ơ.
 const wheels=[];
 for(const s of [-1,1]){
  const w=new THREE.Group();w.position.set(s*1.02,.75,.15);g.add(w);
  const wg=new THREE.Group();wg.rotation.z=Math.PI/2;w.add(wg);
  mesh(wg,new THREE.TorusGeometry(.72,.05,8,28),darkWood).rotation.x=Math.PI/2;
  mesh(wg,new THREE.CylinderGeometry(.73,.73,.07,28,1,true),mat('#2d2d2d',{metalness:.5,roughness:.5,side:THREE.DoubleSide}));
  mesh(wg,new THREE.CylinderGeometry(.12,.12,.2,14),darkWood);
  mesh(wg,new THREE.CylinderGeometry(.05,.05,.24,10),mat('#2d2d2d',{metalness:.5}));
  for(let i=0;i<12;i++){const sp=box(wg,.035,.62,.035,woodM,0,0,0);sp.rotation.y=0;sp.position.set(0,0,0);sp.geometry=new THREE.BoxGeometry(.035,.035,.62).translate(0,0,.36);sp.rotation.y=i/12*Math.PI*2;}
  wheels.push(w);
 }
 box(g,2.2,.1,.1,darkWood,0,.75,.15);
 // Càng xe và ngựa.
 for(const s of [-1,1]){const sh=box(g,.07,.07,2.9,woodM,s*.48,1.18,-2.9);sh.rotation.x=.07}
 const horse=makeHorse();horse.group.position.set(0,0,-3.75);g.add(horse.group);
 // Bậc gỗ đặt sau xe (chỉ hiện khi xe dừng).
 const step=new THREE.Group();step.position.set(0,0,1.75);g.add(step);
 box(step,.6,.3,.42,woodM,0,.15,0);box(step,.64,.04,.46,darkWood,0,.31,0);step.visible=false;
 // Gộp các phần tĩnh theo vật liệu để giảm draw call; phần chuyển động giữ riêng.
 for(const k of Object.values(curtains))k.group.userData.keep=true;
 for(const o of [cabin,step,horse.group,...wheels,horse.neck,horse.tail])o.userData.keep=true;
 for(const {hip,knee} of horse.legs){hip.userData.keep=knee.userData.keep=true;bake(knee);bake(hip)}
 bake(horse.neck);bake(horse.tail);bake(horse.bodyG);
 for(const w of wheels)bake(w);
 bake(cabin);bake(step);bake(g);
 scene.add(g);
 return {group:g,cabin,wheels,horse,curtains,step,dist:0};
}
export function animateCarriage(c,dt,speed,t,{rough=1}={}){
 c.dist+=speed*dt;
 for(const w of c.wheels)w.rotation.x=-c.dist/.75;
 const amp=Math.min(1,speed/2)*rough;
 c.cabin.position.y=(Math.sin(t*9.1)*.012+Math.sin(t*15.7)*.007)*amp+Math.max(0,Math.sin(c.dist*1.3))**12*.03*amp;
 c.cabin.rotation.z=(Math.sin(t*3.3)*.012+Math.sin(t*7.9)*.006)*amp;
 c.cabin.rotation.x=Math.sin(t*4.1)*.006*amp;
 animateHorse(c.horse,dt,speed,t);
 for(const k of Object.values(c.curtains))if(!k.lifted)k.group.rotation.x=Math.sin(t*2.3+k.h)*.06*amp;
}

// ---------- Cổng cung hai cánh ----------
function doorTex(){
 return canvasTex(256,512,(c,w,h)=>{
  c.fillStyle='#8f2a21';c.fillRect(0,0,w,h);
  const g=c.createLinearGradient(0,0,w,0);g.addColorStop(0,'rgba(0,0,0,.25)');g.addColorStop(.5,'rgba(255,255,255,.06)');g.addColorStop(1,'rgba(0,0,0,.25)');c.fillStyle=g;c.fillRect(0,0,w,h);
  for(let r=0;r<9;r++)for(let k=0;k<7;k++){
   const x=24+k*(w-48)/6,y=36+r*(h-72)/8;
   const rg=c.createRadialGradient(x-3,y-3,1,x,y,11);rg.addColorStop(0,'#fff1b5');rg.addColorStop(.5,'#d9a740');rg.addColorStop(1,'#7a5214');
   c.fillStyle=rg;c.beginPath();c.arc(x,y,10,0,7);c.fill();
  }
 });
}
export function makeGateDoors(x,z,halfWidth,height){
 const tex=doorTex(),m=new THREE.MeshStandardMaterial({map:tex,roughness:.55});
 const leaves=[];
 for(const s of [-1,1]){
  const pivot=new THREE.Group();pivot.position.set(x,0,z+s*halfWidth);scene.add(pivot);
  const leaf=mesh(pivot,new THREE.BoxGeometry(.22,height,halfWidth),m,0,height/2,-s*halfWidth/2);
  // Khoen cửa (đầu thú ngậm vòng).
  for(const side of [-1,1]){
   mesh(pivot,new THREE.SphereGeometry(.13,12,8),mat('#c9962e',{metalness:.7,roughness:.3}),side*.13,height*.48,-s*(halfWidth-.35));
   const ring=mesh(pivot,new THREE.TorusGeometry(.14,.025,8,16),mat('#c9962e',{metalness:.7,roughness:.3}),side*.15,height*.48-.18,-s*(halfWidth-.35));ring.rotation.y=Math.PI/2;
  }
  leaves.push({pivot,s,leaf});
 }
 return {leaves,open:0,set(v){this.open=v;for(const {pivot,s} of this.leaves)pivot.rotation.y=s*v*1.75}};
}

// ---------- Bàn kiểm danh ----------
export function makeTable(x,z,ry=0){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);
 const wood=mat('#5a3420',{roughness:.6});
 box(g,1.6,.06,.7,wood,0,.8,0);
 for(const a of [-1,1])for(const b of [-1,1])box(g,.07,.78,.07,wood,a*.72,.39,b*.28);
 box(g,1.62,.12,.04,mat('#3d2316'),0,.7,.34);
 // Sổ danh sách mở, bút lông, nghiên mực, ống bút.
 const page=canvasTex(256,128,(c,w,h)=>{c.fillStyle='#efe4c8';c.fillRect(0,0,w,h);c.strokeStyle='#b9a77f';c.beginPath();c.moveTo(w/2,0);c.lineTo(w/2,h);c.stroke();c.fillStyle='#222';
  for(let col=0;col<14;col++){const xx=w-14-col*17-(col>6?8:0);for(let k=0;k<6;k++){c.fillRect(xx-4,10+k*18,8,2+((col*7+k)%3)*3);c.fillRect(xx-1,10+k*18,2,12)}}});
 const book=mesh(g,new THREE.BoxGeometry(.56,.025,.36),new THREE.MeshStandardMaterial({map:page,roughness:.9}),-.1,.845,.05);
 mesh(g,new THREE.CylinderGeometry(.008,.006,.24,6),'#3a2a1e',.28,.845,.08).rotation.z=Math.PI/2.2;
 mesh(g,new THREE.SphereGeometry(.012,6,5),'#111',.39,.85,.08);
 box(g,.18,.04,.12,'#2a2a2c',.42,.84,-.15);
 mesh(g,new THREE.CylinderGeometry(.05,.05,.16,12),'#7d5a36',-.6,.9,-.15);
 return {group:g,book};
}

// ---------- Cờ hiệu bay trong gió ----------
const flags=[];
export function makeBanner(x,z,color='#e0b42e',h=6){
 const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
 mesh(g,new THREE.CylinderGeometry(.06,.08,h,8),'#5a3420',0,h/2,0);
 mesh(g,new THREE.SphereGeometry(.12,10,8),mat('#d9b04a',{metalness:.6,roughness:.35}),0,h+.08,0);
 const geo=new THREE.PlaneGeometry(1.4,2.2,10,6).translate(.72,0,0);
 const tex=canvasTex(128,200,(c,w,hh)=>{c.fillStyle=color;c.fillRect(0,0,w,hh);c.strokeStyle='#b2352a';c.lineWidth=10;c.strokeRect(5,5,w-10,hh-10);
  c.fillStyle='#b2352a';c.beginPath();c.arc(w/2,hh/2,26,0,7);c.fill();c.strokeStyle=color;c.lineWidth=5;c.beginPath();c.arc(w/2,hh/2,14,0,5);c.stroke()});
 const flag=mesh(g,geo,new THREE.MeshStandardMaterial({map:tex,side:THREE.DoubleSide,roughness:.85}),0,h-1.25,0,false);
 flags.push({flag,base:geo.attributes.position.array.slice(),seed:Math.random()*6});
 return g;
}
export function animateFlags(t){
 for(const {flag,base,seed} of flags){
  const p=flag.geometry.attributes.position;
  for(let i=0;i<p.count;i++){const x=base[i*3];p.setZ(i,Math.sin(t*3.2+x*2.6+seed)*.18*x+Math.sin(t*5.1+base[i*3+1]*2)*.04*x)}
  p.needsUpdate=true;flag.geometry.computeVertexNormals();
 }
}

// ---------- Lá vàng rơi quanh camera ----------
export function makeLeaves(count=220){
 const geo=new THREE.PlaneGeometry(.09,.07);geo.translate(0,0,0);
 const m=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.8,side:THREE.DoubleSide});
 const im=new THREE.InstancedMesh(geo,m,count);im.frustumCulled=false;im.castShadow=false;scene.add(im);
 const cols=['#e0a52e','#d27a26','#c4561f','#e8c55a','#b8862f'].map(c=>new THREE.Color(c));
 const P=[];for(let i=0;i<count;i++){P.push({p:new THREE.Vector3((Math.random()-.5)*40,Math.random()*12,(Math.random()-.5)*40),s:Math.random()*6,r:Math.random()*6,v:.5+Math.random()*.8});im.setColorAt(i,cols[i%cols.length])}
 im.instanceColor.needsUpdate=true;
 const q=new THREE.Quaternion(),e=new THREE.Euler(),m4=new THREE.Matrix4(),one=new THREE.Vector3(1,1,1),w=new THREE.Vector3();
 return {mesh:im,update(dt,t,center,wind=1){
  if(!im.visible)return;
  P.forEach((a,i)=>{
   a.p.y-=a.v*dt;a.p.x+=(Math.sin(t*.8+a.s)*.6+.9*wind)*dt;a.p.z+=Math.cos(t*.6+a.s)*.5*dt;
   w.copy(a.p).add(center);
   if(a.p.y<-.1){a.p.y=10+Math.random()*4;a.p.x=(Math.random()-.5)*40;a.p.z=(Math.random()-.5)*40}
   if(a.p.x>20)a.p.x-=40;
   e.set(t*2+a.r,t*1.3+a.s,t*.7);q.setFromEuler(e);m4.compose(w,q,one);im.setMatrixAt(i,m4);
  });
  im.instanceMatrix.needsUpdate=true;
 }};
}

// ---------- Đàn chim ----------
export function makeBirds(n=9){
 const g=new THREE.Group();scene.add(g);
 const birds=[];
 for(let i=0;i<n;i++){
  const b=new THREE.Group();g.add(b);
  const m=mat('#2a2622');
  mesh(b,new THREE.SphereGeometry(.12,8,6).scale(1,.7,2),m,0,0,0,false);
  const wings=[];
  for(const s of [-1,1]){const w=new THREE.Group();b.add(w);mesh(w,new THREE.BoxGeometry(.55,.02,.22).translate(s*.27,0,0),m,0,0,0,false);wings.push({w,s})}
  birds.push({b,wings,o:new THREE.Vector3((Math.random()-.5)*8,(Math.random()-.5)*3,(Math.random()-.5)*6),ph:Math.random()*6});
 }
 return {group:g,update(t,origin,dir){
  for(const {b,wings,o,ph} of birds){
   b.position.copy(origin).addScaledVector(dir,t*9).add(o);b.position.y+=Math.sin(t*1.3+ph)*.4;
   b.lookAt(b.position.clone().add(dir));
   for(const {w,s} of wings)w.rotation.z=s*Math.sin(t*11+ph)*.7;
  }
 }};
}

// ---------- Đường đất ngoại ô mùa thu ----------
export function buildSuburb(X,Z0,Z1){
 const len=Z1-Z0;
 const dirt=canvasTex(256,512,(c,w,h)=>{
  c.fillStyle='#8b7556';c.fillRect(0,0,w,h);
  for(let i=0;i<4000;i++){c.fillStyle=['#7a6449','#9b8564','#6d5a42','#a48e6a'][i%4];c.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*3)}
  for(const x of [70,186]){c.fillStyle='rgba(60,45,30,.35)';c.fillRect(x-10,0,20,h)}
  for(const x of [0,w-26]){c.fillStyle='rgba(110,120,60,.45)';c.fillRect(x,0,26,h)}
 },true);
 dirt.repeat.set(1,len/16);
 const road=new THREE.Mesh(new THREE.PlaneGeometry(8,len).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:dirt,roughness:1}));
 road.position.set(X,.02,(Z0+Z1)/2);road.receiveShadow=true;scene.add(road);
 // Ruộng cỏ hai bên.
 const fieldTex=canvasTex(256,256,(c,w,h)=>{c.fillStyle='#8f8a52';c.fillRect(0,0,w,h);for(let i=0;i<5000;i++){c.fillStyle=['#a0944f','#7d7c45','#b3a35c','#6f733f'][i%4];c.fillRect(Math.random()*w,Math.random()*h,1,2+Math.random()*3)}},true);
 fieldTex.repeat.set(12,len/20);
 const field=new THREE.Mesh(new THREE.PlaneGeometry(240,len).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({map:fieldTex,roughness:1}));
 field.position.set(X,.005,(Z0+Z1)/2);field.receiveShadow=true;scene.add(field);
 // Hàng cây lá vàng, cam, đỏ (dùng hệ instancing của bản đồ).
 const autumn=['#d9a23a','#e0b84a','#c97a2b','#b85a22','#e8c860','#a8742c','#8a9a3c'];
 let seed=91;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const v=(x,y,z)=>new THREE.Vector3(x,y,z);
 for(const side of [-1,1]){
  for(let z=Z0+3;z<Z1;z+=5.5+rnd()*3){
   for(const row of [0,1]){
    if(row&&rnd()<.5)continue;
    const x=X+side*(6.5+row*7+rnd()*2.5),h=6+rnd()*5,lean=(rnd()-.5)*.6;
    const top=v(x+lean,h*.55,z);pushBeam('trunk',v(x,0,z),top,h*.045);
    const col=autumn[Math.floor(rnd()*autumn.length)];
    for(let i=0;i<8;i++){
     const a=i*2.4+rnd(),sp=h*.2*(1-i/12),y=h*(.58+i/8*.36),r=h*(.2-.04*i/8)*(.85+rnd()*.3);
     if(i<4)pushBeam('trunk',top,v(top.x+Math.cos(a)*sp*.8,y-.3,z+Math.sin(a)*sp*.8),h*.02);
     const cc=new THREE.Color(col).offsetHSL((rnd()-.5)*.03,0,(rnd()-.5)*.08);
     clump(top.x+Math.cos(a)*sp,y,z+Math.sin(a)*sp,r,r*.75,r*.9,'broad','#'+cc.getHexString());
    }
   }
  }
  // Cỏ dại ven đường.
  for(let z=Z0;z<Z1;z+=.55)for(let k=0;k<3;k++){
   const x=X+side*(4.2+rnd()*5),s=.7+rnd()*.7;
   const c=new THREE.Color().setRGB(.95+rnd()*.15,.85+rnd()*.1,.55+rnd()*.15);
   pushTRS('grass',x,.02,z+rnd()*.5,s,s*(.8+rnd()*.6),s,rnd()*6.28,c);
  }
 }
 flushGroups();
 // Lá khô trên mặt đường.
 const n=2600,lg=new THREE.PlaneGeometry(.1,.08).rotateX(-Math.PI/2);
 const lm=new THREE.InstancedMesh(lg,new THREE.MeshStandardMaterial({roughness:.9,side:THREE.DoubleSide}),n);
 const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),cols=['#c98a2e','#a8642a','#d9b04a','#8a5a26','#b5452a'].map(c=>new THREE.Color(c));
 for(let i=0;i<n;i++){q.setFromAxisAngle(new THREE.Vector3(0,1,0),rnd()*6.28);m4.compose(v(X+(rnd()-.5)*9,.03+rnd()*.01,Z0+rnd()*len),q,v(1+rnd(),1,1+rnd()));lm.setMatrixAt(i,m4);lm.setColorAt(i,cols[i%5])}
 lm.receiveShadow=true;scene.add(lm);
}

// ---------- Cảnh montage (đọc trong sách): hành lang tuyết đêm, chiếc hài, rèm lụa, cửa cung ----------
export function buildMontageSet(X,Z){
 const g=new THREE.Group();g.position.set(X,0,Z);scene.add(g);
 const snow=mat('#e9eef4',{roughness:.95});
 const ground=mesh(g,new THREE.PlaneGeometry(60,60).rotateX(-Math.PI/2),snow,0,.03,0,false);ground.receiveShadow=true;
 // 1. Hành lang: hai bức tường son dài, mái ngói, đèn lồng tắt.
 for(const s of [-1,1]){
  box(g,.6,4,40,mat('#7d3328'),s*2.2,2,-10);
  box(g,1.1,.3,40,mat('#c9b48a'),s*2.2,4.15,-10);
  box(g,1.2,.12,40,mat('#f2f4f7'),s*2.2,4.36,-10);
 }
 for(let z=0;z>-30;z-=6)mesh(g,new THREE.SphereGeometry(.22,10,8).scale(1,1.3,1),mat('#5a2420'),1.7,3,z);
 // 2. Chiếc hài thêu nằm lẻ loi trên tuyết.
 const shoe=new THREE.Group();shoe.position.set(8,.05,4);shoe.rotation.set(0,.6,1.45);shoe.scale.setScalar(1.6);g.add(shoe);
 mesh(shoe,new THREE.BoxGeometry(.09,.055,.21),'#5b8fc0',0,.07,0);
 mesh(shoe,new THREE.SphereGeometry(.03,10,8).scale(1.5,.9,1.4),'#5b8fc0',0,.075,.1);
 mesh(shoe,new THREE.CylinderGeometry(.034,.05,.09,10),'#f4efe4',0,.02,0);
 for(let i=0;i<5;i++){const a=i/5*6.28;mesh(shoe,new THREE.SphereGeometry(.012,6,5),'#ef9fb4',.047,.07+Math.sin(a)*.016,.02+Math.cos(a)*.016)}
 mesh(shoe,new THREE.SphereGeometry(.008,6,5),'#e8c55a',.05,.07,.02);
 for(let i=0;i<12;i++){const f=mesh(g,new THREE.SphereGeometry(.06+Math.random()*.05,8,6).scale(1,.35,1),snow,8+(Math.random()-.5)*.8,.04,4+(Math.random()-.5)*.8)}
 // 3. Rèm lụa, ánh nến, bóng phi tần phía sau.
 const room=new THREE.Group();room.position.set(-10,0,6);g.add(room);
 box(room,8,5,.2,mat('#1a1414'),0,2.5,-2.5);box(room,.2,5,6,mat('#1a1414'),-4,2.5,0);box(room,.2,5,6,mat('#1a1414'),4,2.5,0);
 const silk=new THREE.MeshStandardMaterial({color:'#f3e3c4',transparent:true,opacity:.62,side:THREE.DoubleSide,roughness:1,emissive:'#3a2a12'});
 const curtain=mesh(room,new THREE.PlaneGeometry(4.5,3.6,24,1),silk,0,1.8,0,false);
 const cp=curtain.geometry.attributes.position;for(let i=0;i<cp.count;i++)cp.setZ(i,Math.sin(cp.getX(i)*5)*.06);curtain.geometry.computeVertexNormals();
 const candle=new THREE.Group();candle.position.set(.9,0,-1.2);room.add(candle);
 mesh(candle,new THREE.CylinderGeometry(.05,.05,.35,10),'#efe3c8',0,1.25,0);box(candle,.4,1.05,.4,mat('#3a2216'),0,.53,0);
 const flame=mesh(candle,new THREE.SphereGeometry(.035,8,6).scale(1,1.8,1),new THREE.MeshBasicMaterial({color:'#ffcf6a'}),0,1.48,0,false);
 const light=new THREE.PointLight('#ffb35a',6,9,1.6);light.position.set(.9,1.6,-1.2);room.add(light);
 // 4. Cửa cung đóng lại.
 const door=new THREE.Group();door.position.set(0,0,22);g.add(door);
 box(door,10,6,1.2,mat('#7d3328'),0,3,0);
 const doors=makeGateDoorsLocal(door);
 return {group:g,shoe,room,flame,light,doors,curtain,
  shots:{corridor:[new THREE.Vector3(X,1.5,Z+6),new THREE.Vector3(X,1.4,Z-24)],shoe:[new THREE.Vector3(X+8.75,.55,Z+4.6),new THREE.Vector3(X+8,.1,Z+4)],
   curtain:[new THREE.Vector3(X-10,1.7,Z+10),new THREE.Vector3(X-10,1.7,Z+5)],door:[new THREE.Vector3(X,2,Z+30),new THREE.Vector3(X,2.2,Z+22)]}};
}
function makeGateDoorsLocal(parent){
 const m=new THREE.MeshStandardMaterial({map:doorTex(),roughness:.55});
 const leaves=[];
 for(const s of [-1,1]){
  const p=new THREE.Group();p.position.set(s*1.6,0,.7);parent.add(p);
  mesh(p,new THREE.BoxGeometry(1.6,4.2,.15),m,-s*.8,2.1,0);leaves.push({p,s});
 }
 return {set(v){for(const {p,s} of leaves)p.rotation.y=-s*(1-v)*1.3}};
}

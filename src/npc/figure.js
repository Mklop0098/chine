// Hình người chi tiết cho NPC cấp cao (Hoàng đế, Thái hậu, Hoàng hậu, Phi tần) – cùng mức chi tiết với nhân vật chính.
// Áo bào có hoa văn vẽ bằng canvas: mây lành, sóng "lập thủy" ở gấu áo, huy hiệu rồng / phượng / hoa.
// Sau khi dựng, các phần tĩnh được gộp theo vật liệu (vài draw call mỗi người); riêng đầu tách ra để cử động nhẹ.
import * as THREE from 'three';
import {pleat,silkMaterial} from './cloth.js';

const lathe=(pts,seg=28)=>new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),seg);
const sphere=(r,w=16,h=12)=>new THREE.SphereGeometry(r,w,h);
const group=(parent,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g};

function canvasTex(w,h,paint){
 const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;t.wrapS=THREE.RepeatWrapping;return t;
}
const shade=(hex,k)=>{const c=new THREE.Color(hex);if(k>0)c.lerp(new THREE.Color('#ffffff'),k);else c.multiplyScalar(1+k);return '#'+c.getHexString()};

// Bán kính áo theo chiều cao & vị trí v của LatheGeometry (để vẽ gấu áo đúng chỗ).
function profileAt(pts,y){
 for(let i=1;i<pts.length;i++){const [r0,y0]=pts[i-1],[r1,y1]=pts[i];if(y1!==y0&&y>=Math.min(y0,y1)&&y<=Math.max(y0,y1))return r0+(r1-r0)*(y-y0)/(y1-y0)}
 return pts[pts.length-1][0];
}
function vAt(pts,y){
 for(let i=1;i<pts.length;i++){const [,y0]=pts[i-1],[,y1]=pts[i];if(y1!==y0&&y>=Math.min(y0,y1)&&y<=Math.max(y0,y1))return (i-1+(y-y0)/(y1-y0))/(pts.length-1)}
 return 1;
}

function robeTexture(spec,pts){
 const H=1024,W=1024,cy=y=>(1-vAt(pts,y))*H;
 return canvasTex(W,H,(c)=>{
  c.fillStyle=spec.robe;c.fillRect(0,0,W,H);
  // Mây lành rải đều thân áo.
  const cloud=spec.cloud||shade(spec.robe,.35);
  c.strokeStyle=cloud;c.lineWidth=3;
  let s=spec.seed||7;const rnd=()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296};
  const top=cy(1.38),bottom=cy(.5);
  for(let i=0;i<(spec.cloud===false?0:70);i++){
   const x=rnd()*W,y=top+rnd()*(bottom-top),r=8+rnd()*8;
   c.beginPath();c.arc(x,y,r,Math.PI,Math.PI*2.6);c.stroke();
   c.beginPath();c.arc(x+r*1.4,y+2,r*.7,Math.PI,Math.PI*2.5);c.stroke();
   c.beginPath();c.moveTo(x-r,y+r*.5);c.quadraticCurveTo(x+r,y+r*1.3,x+r*2.6,y+r*.4);c.stroke();
  }
  if(spec.waves){
   // Sóng biển và các sọc chéo "lập thủy" ở gấu áo.
   const h0=spec.hemY+.012,a=cy(h0+.36),b=cy(h0+.2),z=cy(h0);
   const cols=spec.waves;
   c.save();c.beginPath();c.rect(0,b,W,z-b);c.clip();
   for(let x=-H;x<W+H;x+=14){c.strokeStyle=cols[(x/14|0)&3?((x/14|0)%cols.length+cols.length)%cols.length:0];c.lineWidth=9;c.beginPath();c.moveTo(x,z);c.lineTo(x+(z-b)*.9,b);c.stroke()}
   c.restore();
   c.fillStyle=shade(cols[0],-.1);c.fillRect(0,a,W,b-a);
   for(let row=0;row<3;row++)for(let x=0;x<W+40;x+=40){
    const y=a+(b-a)*(row+.6)/3;
    c.strokeStyle=row%2?'#f4f0e4':shade(cols[0],.4);c.lineWidth=3;
    c.beginPath();c.arc(x+(row%2)*20,y,16,Math.PI,Math.PI*2);c.stroke();
    c.beginPath();c.arc(x+(row%2)*20+6,y-2,7,Math.PI*1.1,Math.PI*2.3);c.stroke();
   }
   c.fillStyle=spec.gold;c.fillRect(0,a-6,W,6);c.fillRect(0,b-3,W,4);
   // Núi đá vàng giữa sóng, trước và sau.
   for(const x of [W*.25,W*.75]){c.fillStyle=spec.gold;c.beginPath();c.moveTo(x-40,b);c.lineTo(x,a+4);c.lineTo(x+40,b);c.fill()}
  }
  if(spec.cloud===false){
   // Vải thường: vân dệt mảnh thay cho mây lành.
   c.globalAlpha=.12;c.strokeStyle='#000';c.lineWidth=1;
   for(let y=0;y<H;y+=6){c.beginPath();c.moveTo(0,y);c.lineTo(W,y+2);c.stroke()}
   c.globalAlpha=1;
  }
  c.fillStyle=spec.hem||spec.gold;c.fillRect(0,cy(spec.hemY+.05),W,cy(spec.hemY+.005)-cy(spec.hemY+.05)+2);
 });
}

function roundelTexture(bg,kind,gold){
 return canvasTex(256,256,(c)=>{
  c.fillStyle=gold;c.beginPath();c.arc(128,128,126,0,7);c.fill();
  c.fillStyle=bg;c.beginPath();c.arc(128,128,110,0,7);c.fill();
  c.strokeStyle=gold;c.fillStyle=gold;c.lineCap='round';c.lineJoin='round';
  if(kind==='dragon'){
   // Rồng cuộn tròn ôm ngọc lửa.
   c.lineWidth=16;c.beginPath();c.moveTo(70,190);c.bezierCurveTo(30,120,90,50,150,70);c.bezierCurveTo(215,92,200,170,140,165);c.bezierCurveTo(100,162,105,120,135,118);c.stroke();
   c.lineWidth=5;for(let i=0;i<9;i++){const t=i/8,x=70+t*80,y=180-t*100;c.beginPath();c.moveTo(x,y);c.lineTo(x-14,y-10);c.stroke()}
   c.beginPath();c.ellipse(158,70,22,15,.3,0,7);c.fill();
   c.lineWidth=4;c.beginPath();c.moveTo(172,60);c.quadraticCurveTo(200,40,210,52);c.moveTo(165,55);c.quadraticCurveTo(180,25,200,28);c.stroke();
   for(const [x,y] of [[60,110],[195,130],[110,200]]){c.lineWidth=6;c.beginPath();c.moveTo(x,y);c.lineTo(x+12,y+14);c.moveTo(x,y);c.lineTo(x-6,y+16);c.stroke()}
   c.fillStyle='#d23a2c';c.beginPath();c.arc(128,128,13,0,7);c.fill();
   c.strokeStyle='#f39a3a';c.lineWidth=3;for(let i=0;i<6;i++){const a=i*1.05;c.beginPath();c.moveTo(128+Math.cos(a)*14,128+Math.sin(a)*14);c.lineTo(128+Math.cos(a)*24,128+Math.sin(a)*24);c.stroke()}
  }else if(kind==='phoenix'){
   c.lineWidth=12;c.beginPath();c.moveTo(80,90);c.bezierCurveTo(110,70,150,90,140,130);c.stroke();
   c.beginPath();c.ellipse(75,88,14,10,-.4,0,7);c.fill();
   c.lineWidth=7;for(const k of [-1,0,1]){c.beginPath();c.moveTo(140,130);c.bezierCurveTo(170,150+k*20,200,180+k*25,180+k*20,215);c.stroke()}
   c.lineWidth=6;for(let i=0;i<5;i++){c.beginPath();c.moveTo(115,105);c.lineTo(150+i*10,60+i*8);c.stroke()}
   c.fillStyle='#d23a2c';c.beginPath();c.arc(68,84,4,0,7);c.fill();
  }else{
   for(let i=0;i<5;i++){const a=i/5*6.283-1.57;c.beginPath();c.ellipse(128+Math.cos(a)*42,128+Math.sin(a)*42,30,22,a,0,7);c.fill()}
   c.fillStyle=bg;c.beginPath();c.arc(128,128,20,0,7);c.fill();
   c.fillStyle='#e9425a';c.beginPath();c.arc(128,128,13,0,7);c.fill();
   c.lineWidth=5;for(let i=0;i<8;i++){const a=i/8*6.283;c.beginPath();c.moveTo(128+Math.cos(a)*76,128+Math.sin(a)*76);c.lineTo(128+Math.cos(a)*96,128+Math.sin(a)*96);c.stroke()}
  }
 });
}

// Gộp mọi mesh trong cây con thành 1 mesh / vật liệu (đầu được tách riêng trước khi gộp).
export function bake(root,{shadow=true}={}){
 root.updateMatrixWorld(true);
 const inv=root.matrixWorld.clone().invert(),by=new Map(),meshes=[];
 const walk=o=>{for(const c of o.children){if(c.userData.keep)continue;if(c.isMesh)meshes.push(c);walk(c)}};walk(root);
 for(const o of meshes){
  let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
  g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));
  if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
  if(!by.has(o.material))by.set(o.material,[]);
  by.get(o.material).push(g);o.removeFromParent();
 }
 for(const child of [...root.children])if(child.isGroup&&!child.userData.keep)root.remove(child);
 for(const [material,list] of by){
  const n=list.reduce((s,g)=>s+g.attributes.position.count,0),P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2);
  let at=0;
  for(const g of list){P.set(g.attributes.position.array,at*3);N.set(g.attributes.normal.array,at*3);U.set(g.attributes.uv.array,at*2);at+=g.attributes.position.count;g.dispose()}
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('normal',new THREE.BufferAttribute(N,3));geo.setAttribute('uv',new THREE.BufferAttribute(U,2));
  geo.computeBoundingSphere();
  const m=new THREE.Mesh(geo,material);m.castShadow=shadow&&!material.transparent;m.receiveShadow=true;root.add(m);
 }
}

/*
 spec: {
  sex:'m'|'f', robe, gold, cuff, collarCape, waves:[màu sọc], roundel:'dragon'|'phoenix'|'flower', roundels:số huy hiệu,
  hat:'emperor'|'board', board:{w,h}, phoenixCrown, necklace, torque, nailGuards, old, hair, skin, lips, flowers:[màu], tassel
 }
*/
export function buildFigure(spec){
 const mats=new Map();
 const mat=(c,o={})=>{
  if(c instanceof THREE.Material)return c;
  const k=c+JSON.stringify(o);
  if(!mats.has(k)){const m=new THREE.MeshStandardMaterial({color:c,roughness:.7,...o});m.envMapIntensity=.45;mats.set(k,m)}
  return mats.get(k);
 };
 const part=(parent,geo,c,x=0,y=0,z=0,o)=>{const m=new THREE.Mesh(geo,mat(c,o));m.position.set(x,y,z);parent.add(m);return m};
 const gold=spec.gold||'#d9b04a',goldM=mat(gold,{metalness:.65,roughness:.32});
 const skin=spec.skin||'#efc6a4',hair=spec.hair||'#141216',female=spec.sex!=='m';

 const root=new THREE.Group();
 const body=group(root);
 const animated=!!spec.animated,limbs={shoes:[],arms:[]};
 // Khi cần cử động (đi, ngồi, vẫy tay…), tay và giày là nhóm riêng không bị gộp.
 const limbGroup=(x,y,z)=>{const g=group(animated?root:body,x,y,z);if(animated)g.userData.keep=true;return g};

 // Giày: nữ đi hoa bồn để (thấp hơn với người thường), nam đi hia đen đế trắng hoặc giày vải.
 const lowShoe=female&&spec.lowShoes;
 for(const side of [-1,1]){
  const g=limbGroup(side*(female?.08:.09),0,0);limbs.shoes.push(g);
  if(female){
   const ph=lowShoe?.05:.14;
   part(g,new THREE.CylinderGeometry(.036,.052,ph,10),'#f4efe4',0,ph/2,.0);
   part(g,new THREE.BoxGeometry(.09,.055,.21),spec.shoe||'#2b2b48',0,ph+.025,.02);
   part(g,sphere(.014,6,5),'#e9a3b8',0,ph+.055,.08);
  }else if(spec.clothShoes){
   part(g,new THREE.BoxGeometry(.1,.08,.25),spec.shoe||'#2b2622',0,.04,.03);
  }else{
   part(g,new THREE.BoxGeometry(.11,.05,.27),'#f2eee4',0,.025,.03);
   part(g,new THREE.BoxGeometry(.1,.12,.25),'#151517',0,.1,.03);
  }
 }
 const hemY=female?(lowShoe?.12:.2):.07;
 // Áo bào (lathe) phủ texture hoa văn.
 const robePts=[[0,hemY],[.28,hemY],[.272,hemY+.18],[.24,.62],[.2,.92],[.185,1.12],[.2,1.3],[.16,1.41],[.06,1.46],[0,1.46]];
 if(!female){robePts[1][0]=.3;robePts[2][0]=.29;robePts[3][0]=.255;robePts[4][0]=.225;robePts[5][0]=.215;robePts[6][0]=.22;robePts[7][0]=.175}
 const robeTex=robeTexture({...spec,gold,hemY},robePts);
 // Gấm thêu: lụa có ánh sheen, vân dệt nổi; thân áo có nếp gấp sâu dần về gấu.
 const robeMat=silkMaterial({map:robeTex,roughness:.5});robeMat.envMapIntensity=.5;
 const RP={n:20,amp:.011,top:.95,bottom:hemY};
 part(body,pleat(lathe(robePts,60),RP),robeMat).scale.z=.83;
 // Áo gile (khảm khiên) cho ma ma, cung nữ…
 if(spec.vest){
  const V=[[.252,.7],[.235,.92],[.208,1.12],[.214,1.3],[.17,1.41],[.072,1.465]];
  const VP={n:12,amp:.006,top:1.05,bottom:.7};
  part(body,pleat(lathe([[0,.7],...V,[0,1.465]],40),VP),silkMaterial({color:spec.vest})).scale.z=.84;
  part(body,pleat(lathe([[.256,.7],[.25,.76],[.242,.76],[.246,.7]],40),VP),spec.vestTrim||gold).scale.z=.84;
  for(const s of [-1,1]){const e=part(body,new THREE.BoxGeometry(.016,.66,.01),spec.vestTrim||gold,s*.04,1.06,.2);e.rotation.x=-.05}
 }
 // Đai lưng (nam): đai vàng, ngọc bội, túi thơm và dải lụa buông hai bên.
 if(!female){
  part(body,new THREE.CylinderGeometry(.228,.228,.06,28),gold,0,.98,0,{metalness:.4,roughness:.4}).scale.z=.83;
  for(let i=0;i<6;i++){const a=i/6*6.283;part(body,new THREE.BoxGeometry(.04,.045,.012),'#9fcfaa',Math.sin(a)*.23,.98,Math.cos(a)*.23*.83+.002,{roughness:.2}).rotation.y=a}
  for(const side of [-1,1]){
   part(body,new THREE.BoxGeometry(.04,.45,.008),'#f2e3b0',side*.12,.73,.17).rotation.z=side*.04;
   part(body,sphere(.035,10,8),'#2f6d5b',side*.2,.86,.1).scale.set(.8,1.2,.6);
  }
 }
 // Huy hiệu tròn (rồng/phượng/hoa) trên ngực, lưng, hai vai.
 const roundTex=roundelTexture(shade(spec.robe,-.12),spec.roundel||'dragon',gold);
 const roundMat=new THREE.MeshStandardMaterial({map:roundTex,roughness:.5,metalness:.15,transparent:false});
 const places=spec.roundels===0?[]:[[0,1.18,.12],[Math.PI,1.18,.12],...(spec.roundels>2?[[Math.PI/2,1.3,.075],[-Math.PI/2,1.3,.075]]:[]),...(spec.roundels>4?[[.0,.66,.1],[Math.PI,.66,.1],[.9,.7,.08],[-.9,.7,.08]]:[])];
 for(const [a,y,r] of places){
  const R=profileAt(robePts,y)+.004,x=Math.sin(a)*R,z=Math.cos(a)*R*.83;
  const d=part(body,new THREE.CircleGeometry(r,28),roundMat,x,y,z);d.lookAt(x*3,y,z*3);
 }
 // Phi lĩnh (cổ choàng vai) xanh đậm viền vàng.
 if(spec.collarCape){
  part(body,new THREE.CylinderGeometry(.075,.255,.13,32,1,true),spec.collarCape,0,1.415,0,{side:THREE.DoubleSide}).scale.z=.85;
  part(body,new THREE.TorusGeometry(.252,.012,6,32).rotateX(Math.PI/2),goldM,0,1.352,0).scale.y=.85;
 }
 // Cổ áo đứng, vòng cổ vàng (lĩnh ước), chuỗi triều châu.
 part(body,new THREE.CylinderGeometry(.062,.072,.065,16),'#f2ede2',0,1.48,0);
 part(body,new THREE.TorusGeometry(.069,.012,6,18).rotateX(Math.PI/2),spec.collarCape||gold,0,1.51,0);
 part(body,new THREE.CylinderGeometry(.039,.044,.07,10),skin,0,1.54,0);
 if(spec.torque){
  const t=part(body,new THREE.TorusGeometry(.1,.011,8,28,Math.PI*1.7).rotateX(Math.PI/2),goldM,0,1.475,0);t.rotation.y=Math.PI*.65;
  for(let i=0;i<5;i++)part(body,sphere(.012,8,6),'#d24a64',Math.sin((i-2)*.5)*.1,1.47,Math.cos((i-2)*.5)*.1,{roughness:.25});
 }
 if(spec.necklace){
  const beadM=mat(spec.necklace,{roughness:.3,metalness:.1});
  for(let i=0;i<=56;i++){
   const t=i/56,a=(t-.5)*Math.PI*1.25,y=1.43-Math.pow(Math.cos(a*.8),1)*.0-(1-Math.abs(t-.5)*2)*.38;
   const r=profileAt(robePts,y)+.016,ang=(t-.5)*1.9;
   const m=new THREE.Mesh(sphere(i%14===0?.016:.0105,8,6),i%14===0?goldM:beadM);
   m.position.set(Math.sin(ang)*r,y,Math.cos(ang)*r*.83+.006);body.add(m);
  }
 }
 // Tay: ống tay áo, tay áo móng ngựa (mã đề tụ), bàn tay, hộ giáp vàng.
 for(const side of [1,-1]){
  const sh=limbGroup(side*(female?.19:.215),1.37,0);
  part(sh,sphere(female?.062:.07,12,8),spec.robe,0,0,0);
  const upper=part(sh,new THREE.CylinderGeometry(female?.054:.06,female?.064:.07,.3,20).translate(0,-.15,0),spec.robe);
  const el=group(sh,0,-.3,0);if(animated)el.userData.keep=true;limbs.arms.push({sh,el,side});
  part(el,pleat(new THREE.CylinderGeometry(.064,.08,.25,20,4).translate(0,-.125,0),{n:6,amp:.004,top:0,bottom:-.25}),spec.robe);
  part(el,new THREE.CylinderGeometry(.083,.083,.06,20).translate(0,-.27,0),spec.cuff||spec.collarCape||'#f2ede2');
  part(el,new THREE.SphereGeometry(.07,12,8,0,Math.PI*2,0,Math.PI/2).scale(1,.6,1).rotateX(Math.PI*.6).translate(0,-.29,.03),spec.cuff||spec.collarCape||'#f2ede2');
  part(el,sphere(.04,10,8),skin,0,-.33,.01).scale.set(.75,1.15,.55);
  if(spec.nailGuards)for(const k of [-1,1])part(el,new THREE.ConeGeometry(.007,.07,6).translate(0,-.035,0),goldM,k*.012,-.36,.02);
  if(female){sh.rotation.set(.04,0,side*.1);el.rotation.x=-.14}
  else{sh.rotation.set(-.12,0,side*.08);el.rotation.x=-.3}
  void upper;
 }
 // Khăn tay lụa (nữ).
 if(female){
  const k=part(body,new THREE.PlaneGeometry(.075,.11).translate(0,-.055,0),spec.kerchief||'#f7e7c6',.09,1.36,.175,{side:THREE.DoubleSide});k.rotation.z=.2;
 }

 // ---------- Đầu ----------
 const head=group(root,0,1.545,0);head.userData.keep=true;head.scale.setScalar(1.1);
 part(head,sphere(.1,32,24),skin,0,.1,0).scale.set(female?.92:.98,1.08,.98);
 // Mặt vẽ (mắt, mày, mũi, môi). Khi có ảnh chân dung (spec.face), các chi tiết này nằm trong nhóm "drawn"
 // để bật lại nếu ảnh không tải được.
 const faceParts=spec.face?group(head):head;
 if(spec.face){faceParts.userData.keep=true;faceParts.visible=false}
 const eyeW=spec.old?.012:.0135;
 for(const side of [-1,1]){
  const ex=side*.034;
  part(faceParts,sphere(eyeW,10,8),'#fbf6f0',ex,.106,.084).scale.set(1.5,.72,.4);
  part(faceParts,sphere(.0085,10,8),'#2a1a14',ex,.106,.0895,{roughness:.2}).scale.set(1,1,.4);
  part(faceParts,sphere(.003,6,4),'#ffffff',ex+.003,.109,.093,{emissive:'#ffffff',emissiveIntensity:.4});
  const lid=part(faceParts,new THREE.BoxGeometry(.034,.004,.006),'#1d1414',ex,.1145,.09);lid.rotation.z=side*(female?-.18:-.05);
  const brow=part(faceParts,new THREE.BoxGeometry(.037,female?.005:.009,.006),spec.old?'#6a625e':'#2a1f1f',side*.035,.131,.088);brow.rotation.z=side*(female?-.16:-.06);
  part(head,sphere(.018,8,6),skin,side*.094,.098,0).scale.set(.5,1,.8);
  if(female){
   part(faceParts,sphere(.02,8,6),'#f0a3a0',side*.05,.077,.075,{transparent:true,opacity:.3}).scale.set(1.2,.7,.4);
   part(head,sphere(.0085,6,5),goldM,side*.096,.07,.004);
   part(head,sphere(.006,6,5),'#7fd0c0',side*.096,.058,.004,{roughness:.2});
  }
  if(spec.old)part(faceParts,new THREE.BoxGeometry(.02,.002,.004),'#c79c86',side*.05,.09,.088).rotation.z=side*.5;
 }
 part(faceParts,sphere(.0095,8,6),skin,0,.088,.098).scale.set(.9,1,1.1);
 part(faceParts,sphere(.012,10,6),spec.lips||(female?'#b8323f':'#a96a60'),0,.058,.088).scale.set(1.55,.5,.5);
 part(faceParts,sphere(.011,10,6),spec.lips||(female?'#c84452':'#b07368'),0,.049,.087).scale.set(1.3,.45,.45);
 if(!female){
  for(const side of [-1,1]){const m=part(faceParts,new THREE.BoxGeometry(.03,.005,.006),'#1e1817',side*.02,.069,.093);m.rotation.z=side*.3}
  part(faceParts,new THREE.BoxGeometry(.006,.02,.005),'#1e1817',0,.03,.09);
 }
 if(spec.face){
  // Ảnh chân dung dán lên mặt trước đầu (cùng cách làm với nhân vật chính).
  const faceMat=new THREE.MeshStandardMaterial({transparent:true,opacity:0,roughness:.62,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
  faceMat.envMapIntensity=.35;
  const fm=part(head,new THREE.SphereGeometry(.1015,32,26,Math.PI/2-.85,1.7,.62,2.05),faceMat,0,.1,0);
  fm.scale.set(female?.92:.98,1.08,.98);fm.renderOrder=1;
  new THREE.TextureLoader().load(import.meta.env.BASE_URL+spec.face,tex=>{tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;faceMat.map=tex;faceMat.opacity=1;faceMat.needsUpdate=true},undefined,()=>{faceParts.visible=true});
 }
 if(female){
  const cap=part(head,new THREE.SphereGeometry(.108,22,12,0,Math.PI*2,0,Math.PI*.56),hair,0,.105,-.008,{roughness:.45});cap.scale.set(1,1.05,1.04);cap.rotation.x=-.8;
  if(spec.old)for(const side of [-1,1])part(head,new THREE.BoxGeometry(.004,.05,.02),'#9b9592',side*.06,.17,.04).rotation.z=side*.6;
  const style=spec.hairStyle||'board';
  if(style==='braid'){
   // Thiếu nữ: hai búi nhỏ trên đỉnh, trâm, hoa nhỏ và một bím tóc dài sau lưng.
   for(const s of [-1,1])part(head,sphere(.043,12,8),hair,s*.07,.2,-.04,{roughness:.45}).scale.set(.95,.85,.8);
   part(head,sphere(.042,12,8),hair,0,.2,-.035,{roughness:.45}).scale.set(1.1,.8,1);
   part(head,new THREE.CylinderGeometry(.004,.004,.24,6).rotateZ(Math.PI/2),spec.pin||'#8a5a32',0,.205,-.012);
   const fl=spec.flowers||['#f2a6bd'];
   const f=group(head,.1,.22,-.01);
   for(let p=0;p<5;p++){const t=p/5*6.283;part(f,sphere(.013,8,6),fl[0],Math.cos(t)*.015,Math.sin(t)*.015,0).scale.z=.45}
   part(f,sphere(.008,6,5),goldM,0,0,.006);
   let q=group(head,0,.07,-.105);
   part(q,new THREE.TorusGeometry(.028,.009,6,12).rotateX(Math.PI/2),spec.ribbon||'#c22a33',0,-.01,0);
   for(let i=0;i<9;i++){const seg=group(q,0,i?-.066:-.02,0);seg.rotation.x=i?.02:.1;part(seg,sphere(.03-i*.0017,8,6),hair,0,-.034,0,{roughness:.45}).scale.set(1,1.35,.85);q=seg}
   part(q,new THREE.ConeGeometry(.018,.08,8).rotateX(Math.PI),spec.ribbon||'#c22a33',0,-.11,0);
  }else if(style==='bun'){
   // Phụ nữ lớn tuổi: búi thấp sau gáy, trâm bạc, tóc chải gọn.
   part(head,sphere(.058,12,9),hair,0,.09,-.115,{roughness:.5}).scale.set(1.15,.85,.8);
   part(head,new THREE.CylinderGeometry(.005,.005,.2,6).rotateZ(Math.PI/2),spec.pin||'#c9c9c9',0,.1,-.15,{metalness:.6,roughness:.35});
   part(head,sphere(.012,8,6),spec.pin||'#c9c9c9',.1,.1,-.15,{metalness:.6,roughness:.35});
  }
  if(style==='board'){
  // Đại lạp sí: khung tóc cao trên đỉnh và tấm bản lớn bọc sa-tanh đen.
  const B=spec.board||{w:.44,h:.16};
  part(head,new THREE.CylinderGeometry(.05,.065,.1,14),hair,0,.235,-.03,{roughness:.45});
  const board=group(head,0,.265+B.h/2,-.035);board.rotation.x=-.12;
  part(board,new THREE.BoxGeometry(B.w,B.h,.04),'#141322',0,0,0,{roughness:.35});
  part(board,new THREE.BoxGeometry(B.w+.008,.012,.045),goldM,0,-B.h/2,0);
  part(board,new THREE.BoxGeometry(B.w+.008,.01,.045),goldM,0,B.h/2,0);
  const fl=spec.flowers||['#e45d79','#f2c6d2','#f6efe6'];
  const spots=[[-B.w*.36,0,1.25],[B.w*.36,0,1.25],[-B.w*.16,.02,.9],[B.w*.16,.02,.9],[0,-.035,.8]];
  spots.forEach(([x,y,sz],i)=>{
   const f=group(board,x,y,.03);
   for(let p=0;p<6;p++){const t=p/6*6.283;part(f,sphere(.02*sz,8,6),fl[i%fl.length],Math.cos(t)*.024*sz,Math.sin(t)*.024*sz,0).scale.z=.45}
   part(f,sphere(.013*sz,8,6),goldM,0,0,.01);
  });
  if(spec.phoenixCrown){
   // Phượng vàng ở giữa bản, đính ngọc.
   const ph=group(board,0,.0,.05);
   part(ph,sphere(.022,10,8),goldM,0,0,0).scale.set(1.4,1,.7);
   part(ph,sphere(.013,8,6),goldM,-.032,.018,0);
   for(const s of [-1,1]){const w=part(ph,new THREE.BoxGeometry(.06,.012,.008),goldM,s*.03,.022,-.004);w.rotation.z=s*.6}
   for(let k=0;k<5;k++){const t=part(ph,new THREE.BoxGeometry(.008,.07,.006),goldM,.025+k*.008,-.04,-.002);t.rotation.z=.4+k*.12}
   part(ph,sphere(.009,8,6),'#d22f3f',0,-.005,.016,{roughness:.2});
   part(ph,sphere(.007,6,5),'#f4f2ea',-.04,.02,.008,{roughness:.2});
  }
  // Tua lụa buông bên phải xuống vai.
  const tc=spec.tassel||'#c22a33';
  for(let k=0;k<3;k++){
   part(board,new THREE.CylinderGeometry(.003,.003,.2,4).translate(0,-.1,0),tc,B.w*.43+k*.008,-B.h/2,.01);
   part(board,sphere(.008,6,5),k===1?goldM:'#f4f2ea',B.w*.43+k*.008,-B.h/2-.205,.01);
  }
  part(board,new THREE.ConeGeometry(.018,.06,8),tc,B.w*.43+.008,-B.h/2-.25,.01).rotation.x=Math.PI;
  }
 }else{
  // Nam: trán cạo, bím tóc dài sau gáy, mũ triều lương mạo tua đỏ, chóp ngọc vàng.
  const cap=part(head,new THREE.SphereGeometry(.104,22,12,0,Math.PI*2,0,Math.PI*.6),hair,0,.1,-.006,{roughness:.45});cap.scale.set(1,1.08,1);cap.rotation.x=-1.2;
  let p=group(head,0,.03,-.1);
  for(let i=0;i<10;i++){const seg=group(p,0,i?-.07:-.02,0);seg.rotation.x=.04;part(seg,sphere(.027-i*.0015,8,6),hair,0,-.035,0,{roughness:.45}).scale.set(1,1.4,.85);p=seg}
  part(p,new THREE.CylinderGeometry(.01,.004,.08,6),'#1a1a1d',0,-.1,0);
  if(spec.hat==='eunuch'){
   // Mũ thái giám: vành đen, chóp thấp, núm đỏ.
   part(head,new THREE.CylinderGeometry(.118,.122,.04,24),'#151518',0,.19,0,{roughness:.55});
   part(head,new THREE.SphereGeometry(.115,20,8,0,Math.PI*2,0,Math.PI/2).scale(1,.55,1),spec.hatColor||'#1d1e24',0,.205,0,{roughness:.6});
   part(head,sphere(.022,10,8),'#b9262a',0,.275,0,{roughness:.4});
  }else if(spec.hat==='guard'){
   // Mũ thị vệ: nón đỏ tua, vành đen, lông chim cắm sau.
   part(head,new THREE.CylinderGeometry(.115,.122,.035,24),'#1d1a17',0,.2,0);
   part(head,new THREE.ConeGeometry(.19,.13,24,1,true),'#b52a26',0,.27,0,{side:THREE.DoubleSide,roughness:.85});
   part(head,sphere(.02,8,6),'#d9b04a',0,.34,0,{metalness:.6,roughness:.35});
   const pl=part(head,new THREE.CylinderGeometry(.006,.018,.26,6),'#3c6b4a',0,.36,-.09);pl.rotation.x=-.6;
  }else if(spec.hat==='straw'){
   // Nón lá rộng của phu xe.
   part(head,new THREE.ConeGeometry(.3,.15,24,1,true),'#cbb07a',0,.25,0,{side:THREE.DoubleSide,roughness:.95});
   part(head,new THREE.TorusGeometry(.295,.008,4,24).rotateX(Math.PI/2),'#8f7442',0,.177,0);
  }else if(spec.hat==='emperor'){
   part(head,new THREE.CylinderGeometry(.115,.122,.035,28),'#2a2016',0,.2,0,{roughness:.6});
   part(head,new THREE.ConeGeometry(.2,.13,32,1,true),'#c22a2a',0,.27,0,{side:THREE.DoubleSide,roughness:.85});
   part(head,new THREE.CylinderGeometry(.2,.2,.008,32,1,true),'#e6c37a',0,.205,0,{side:THREE.DoubleSide});
   const tip=group(head,0,.34,0);
   part(tip,new THREE.CylinderGeometry(.02,.03,.03,12),goldM,0,0,0);
   part(tip,sphere(.024,12,8),goldM,0,.03,0);
   part(tip,sphere(.018,12,8),'#f6f1e2',0,.062,0,{roughness:.15});
   part(tip,sphere(.014,10,8),goldM,0,.085,0);
   part(tip,sphere(.011,10,8),'#f6f1e2',0,.104,0,{roughness:.15});
   for(let i=0;i<4;i++)part(tip,sphere(.009,8,6),goldM,Math.cos(i*1.57)*.024,.045,Math.sin(i*1.57)*.024);
  }
 }

 bake(body);bake(head);
 if(animated){for(const {sh,el} of limbs.arms){bake(el);bake(sh)}for(const g of limbs.shoes)bake(g)}
 root.traverse(o=>{if(o.isMesh)o.receiveShadow=true});
 return {root,head,body,phase:Math.random()*6.28,limbs:animated?limbs:null,female,walk:0,sit:0};
}

// Cử động nhẹ khi đứng: thở, quay đầu nhìn quanh chậm rãi.
export function idleFigure(f,t){
 f.body.scale.y=1+Math.sin(t*2+f.phase)*.004;
 f.head.position.y=1.545+Math.sin(t*2+f.phase)*.003;
 f.head.rotation.y=Math.sin(t*.27+f.phase)*.32*Math.max(0,Math.sin(t*.11+f.phase*2));
 f.head.rotation.x=Math.sin(t*.4+f.phase)*.03;
}

const lerp=(a,b,t)=>a+(b-a)*t;
/*
 Tư thế cho nhân vật có tay chân cử động (spec.animated):
 o.speed (m/s) – đi bộ; o.sit 0..1 – ngồi; o.arms {l:[x,z,khuỷu,w], r:[…]} – ghi đè góc tay;
 o.head [cúi, quay, nghiêng] – góc đầu; o.lean – nghiêng người.
*/
export function poseFigure(f,dt,o={}){
 const L=f.limbs;if(!L)return;
 const speed=o.speed||0,amp=Math.min(1,speed/2);
 f.walk+=dt*speed*5.6;
 f.sit=lerp(f.sit,o.sit||0,1-Math.exp(-dt*6));
 const s=Math.sin(f.walk),c=Math.cos(f.walk),down=f.sit*.46;
 const bob=Math.abs(c)*.02*amp-down;
 f.body.position.y=bob;f.body.rotation.x=lerp(f.body.rotation.x,(o.lean||0)+speed*.02,1-Math.exp(-dt*6));
 f.head.position.y=1.545+bob;f.head.position.z=Math.sin(f.body.rotation.x)*1.5;
 L.shoes.forEach((g,i)=>{const d=i?1:-1;
  g.position.z=d*s*.16*amp+f.sit*.3;g.position.y=Math.max(0,d*c)*.04*amp;g.rotation.x=-Math.max(0,d*c)*.3*amp;
 });
 const k=1-Math.exp(-dt*10),w=Math.min(1,amp*1.6);
 for(const {sh,el,side} of L.arms){
  sh.position.y=1.37+bob;sh.position.z=f.head.position.z*.85;
  let ax=f.female?.04:-.04,az=side*(f.female?.1:.08),ex=f.female?-.14:-.2;
  ax=lerp(ax,side*s*.34,w);az=lerp(az,side*.06,w);ex=lerp(ex,-.25,w);
  if(f.sit>.01){ax=lerp(ax,-.38,f.sit);az=lerp(az,-side*.12,f.sit);ex=lerp(ex,-1.08,f.sit)}
  const t=o.arms&&(side>0?o.arms.l:o.arms.r);
  if(t){const b=t[3]??1;ax=lerp(ax,t[0],b);az=lerp(az,t[1],b);ex=lerp(ex,t[2],b)}
  sh.rotation.x=lerp(sh.rotation.x,ax,k);sh.rotation.z=lerp(sh.rotation.z,az,k);el.rotation.x=lerp(el.rotation.x,ex,k);
 }
 const h=o.head||[0,0,0],kh=1-Math.exp(-dt*5);
 f.head.rotation.x=lerp(f.head.rotation.x,h[0],kh);f.head.rotation.y=lerp(f.head.rotation.y,h[1],kh);f.head.rotation.z=lerp(f.head.rotation.z,h[2]||0,kh);
}

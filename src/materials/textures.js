// Texture vẽ bằng canvas (ngói, gạch sân, cỏ, nước, vải, cửa, đá chạm…) và vật liệu cơ bản.
import * as THREE from 'three';
import {heightMap,isolated,material,pattern,random} from '../core/utils.js';

export let tileBump,courtBump,beamBump,doorBump,lawn,tiles,courtTex,grassTex,groundTex,waterNormal,grayTiles,roofGold,roofDark,red,deep,wallRed,stone,baseStone,grass,water,glaze,gold,paved,staticMeshes,solids,waterways,bridges,fabric,doors,masonry,carving,pebbleTex,paintedBeam,doorPanels,darkMasonry,carvedStone,gardenPebbles,grayCourt,paleCourt,bronze,foliageRock,oldBark,poolDeck;

// Bump map suy từ texture màu (mạch vữa, đinh cửa, hoa văn chạm) qua bộ lọc canvas: không tốn thêm random().
export function bumpFrom(tex,filter='grayscale(1)'){
 const img=tex.image,t=heightMap(img.width,img.height,c=>{c.filter=filter;c.drawImage(img,0,0)});
 t.repeat.copy(tex.repeat);return t;
}

export function buildTextures(){
tiles=pattern(256,256,c=>{
 const cw=32,rh=32;
 c.fillStyle='#5a3c15';c.fillRect(0,0,256,256);
 for(let i=0;i<8;i++){
  const x=i*cw;
  const g=c.createLinearGradient(x,0,x+cw,0);
  g.addColorStop(0,'#6b4818');g.addColorStop(.14,'#b98a30');g.addColorStop(.4,'#f3d27a');g.addColorStop(.58,'#e2b34b');g.addColorStop(.86,'#a2721e');g.addColorStop(1,'#573a12');
  c.fillStyle=g;c.fillRect(x+1.5,0,cw-3,256);
  for(let j=0;j<8;j++){
   const y=j*rh,v=random();
   c.fillStyle=v<.5?'rgba(255,240,195,'+((.5-v)*.30).toFixed(3)+')':'rgba(80,52,16,'+((v-.5)*.32).toFixed(3)+')';
   c.fillRect(x+1.5,y,cw-3,rh);
   const lip=c.createLinearGradient(0,y+rh-8,0,y+rh);lip.addColorStop(0,'rgba(55,32,8,0)');lip.addColorStop(1,'rgba(55,32,8,.36)');
   c.fillStyle=lip;c.fillRect(x+1.5,y+rh-8,cw-3,8);
   c.fillStyle='rgba(255,238,175,.28)';c.fillRect(x+5,y+.5,cw-10,1.4);
  }
 }
});
// Bản ngói chi tiết 512px thay cho bản cũ (bản cũ vẫn vẽ để giữ nguyên chuỗi random()).
tiles.dispose();
{
 const S=512,cols=8,cw=S/cols,rows=8,rh=S/rows;
 // Ngói ống (cover) lồi xen ngói lòng máng (pan) lõm; mỗi hàng chồng mí, đầu ngói có bóng.
 const paint=height=>c=>{
  c.fillStyle=height?'#1a1a1a':'#4a3110';c.fillRect(0,0,S,S);
  for(let i=0;i<cols;i++){
   const x=i*cw;
   // lòng máng giữa hai ống ngói
   const pan=c.createLinearGradient(x+cw*.5,0,x+cw*1.5,0);
   if(height){pan.addColorStop(0,'#3a3a3a');pan.addColorStop(.5,'#202020');pan.addColorStop(1,'#3a3a3a')}
   else{pan.addColorStop(0,'#8a6220');pan.addColorStop(.5,'#5c3e12');pan.addColorStop(1,'#8a6220')}
   c.fillStyle=pan;c.fillRect(x+cw*.5,0,cw,S);
   if(i===cols-1){c.save();c.translate(-S,0);c.fillRect(x+cw*.5,0,cw,S);c.restore()}
  }
  for(let i=0;i<cols;i++){
   const x=i*cw,w=cw*.56,x0=x+(cw-w)/2;
   for(let j=0;j<rows;j++){
    const y=j*rh,v=random();
    const g=c.createLinearGradient(x0,0,x0+w,0);
    if(height){g.addColorStop(0,'#404040');g.addColorStop(.5,'#ffffff');g.addColorStop(1,'#404040')}
    else{g.addColorStop(0,'#6b4818');g.addColorStop(.2,'#c39233');g.addColorStop(.45,'#f6d886');g.addColorStop(.62,'#e2b34b');g.addColorStop(.85,'#a2721e');g.addColorStop(1,'#5a3c12')}
    c.fillStyle=g;c.fillRect(x0,y,w,rh-3);
    if(!height){
     c.fillStyle=v<.5?'rgba(255,240,195,'+((.5-v)*.3).toFixed(3)+')':'rgba(70,46,14,'+((v-.5)*.34).toFixed(3)+')';c.fillRect(x0,y,w,rh-3);
     c.fillStyle='rgba(255,240,190,.32)';c.fillRect(x0+w*.32,y+2,w*.18,rh-8);
     // vệt rêu/bụi mờ dưới chân ống ngói
     if(random()<.3){c.fillStyle='rgba(60,58,30,.18)';c.fillRect(x0,y+rh*.6,w,rh*.4)}
    }
    // mí chồng: bóng dưới đầu viên ngói trên
    const lip=c.createLinearGradient(0,y+rh-12,0,y+rh);
    lip.addColorStop(0,height?'rgba(0,0,0,0)':'rgba(40,24,6,0)');lip.addColorStop(1,height?'rgba(0,0,0,.7)':'rgba(40,24,6,.5)');
    c.fillStyle=lip;c.fillRect(x0-2,y+rh-12,w+4,12);
    c.fillStyle=height?'#ffffff':'rgba(255,236,170,.45)';c.fillRect(x0+2,y,w-4,2);
   }
  }
 };
 tiles=isolated(7001,()=>pattern(S,S,paint(false)));
 tileBump=isolated(7001,()=>heightMap(S,S,paint(true)));
 tiles.anisotropy=tileBump.anisotropy=8;
}
courtTex=pattern(512,512,c=>{
 c.fillStyle='#8a8478';c.fillRect(0,0,512,512);
 const bw=512/5,bh=512/10;
 for(let r=0;r<10;r++)for(let i=-1;i<6;i++){
  const x=i*bw+(r%2)*bw/2,y=r*bh,v=170+(random()*20|0)-(random()<.1?16:0);
  c.fillStyle='rgb('+v+','+(v-3)+','+(v-11)+')';c.fillRect(x+1.6,y+1.6,bw-3.2,bh-3.2);
  for(let k=0;k<7;k++){
   c.fillStyle=random()<.5?'rgba(255,252,240,'+(.03+random()*.05).toFixed(3)+')':'rgba(70,62,50,'+(.03+random()*.06).toFixed(3)+')';
   c.beginPath();c.ellipse(x+random()*bw,y+random()*bh,2+random()*10,1+random()*4,random()*3,0,6.283);c.fill();
  }
  c.fillStyle='rgba(255,255,250,.10)';c.fillRect(x+1.6,y+1.6,bw-3.2,1.2);
 }
});
courtTex.anisotropy=8;
grassTex=pattern(256,256,c=>{
 c.fillStyle='#6f7d4c';c.fillRect(0,0,256,256);
 for(let i=0;i<5200;i++){
  const x=random()*256,y=random()*256;
  c.fillStyle=['#5d6b3e','#7f8d55','#8a9459','#66753f','#9b9a62','#55623a'][i%6];
  c.fillRect(x,y,1+random()*2.2,1+random()*3.5);
 }
});
groundTex=pattern(256,256,c=>{
 c.fillStyle='#a19c8d';c.fillRect(0,0,256,256);
 for(let i=0;i<3800;i++){
  const x=random()*256,y=random()*256,r=random()*3;
  c.fillStyle=['#8f8b7e','#b1ab9b','#9a978a','#a9a28f','#878377'][i%5];c.fillRect(x,y,r,r);
 }
});
waterNormal=(()=>{
 const n=256,c=document.createElement('canvas');c.width=c.height=n;
 const ctx=c.getContext('2d'),img=ctx.createImageData(n,n),waves=[];
 for(let i=0;i<14;i++)waves.push([Math.round((random()-.5)*14)||3,Math.round((random()-.5)*14)||2,random()*6.283,.5+random()]);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  let nx=0,ny=0;
  for(const [a,b,p,amp] of waves){const k=Math.cos((i*a+j*b)/n*6.2832+p)*amp/Math.hypot(a,b);nx+=k*a;ny+=k*b}
  const v=new THREE.Vector3(-nx*.09,-ny*.09,1).normalize(),o=(j*n+i)*4;
  img.data[o]=(v.x*.5+.5)*255;img.data[o+1]=(v.y*.5+.5)*255;img.data[o+2]=(v.z*.5+.5)*255;img.data[o+3]=255;
 }
 ctx.putImageData(img,0,0);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(.18,.18);return t;
})();
grayTiles=pattern(256,256,c=>{c.filter='grayscale(1) brightness(.9) contrast(1.1)';c.drawImage(tiles.image,0,0)});
grayTiles.anisotropy=8;
roofGold=new THREE.MeshStandardMaterial({map:tiles,bumpMap:tileBump,bumpScale:3,color:'#fff1cf',roughness:.46,side:THREE.DoubleSide});
roofDark=new THREE.MeshStandardMaterial({map:tiles,bumpMap:tileBump,bumpScale:3,color:'#7a7970',roughness:.79,side:THREE.DoubleSide});
red=material('#9e382e');
deep=material('#542c26');
wallRed=material('#9d4d3e');
stone=material('#bdb9a6');
baseStone=material('#9e9887');
grass=material('#909b69');
// Nền cỏ xanh cho bồn cây và vườn (nơi có cỏ, hoa, cây).
lawn=new THREE.MeshStandardMaterial({map:grassTex,color:'#b4d38a',roughness:.96});
water=material('#58877d');
glaze=material('#42665c');
gold=material('#ac793e');
courtBump=bumpFrom(courtTex,'grayscale(1) contrast(2.2) brightness(1.1)');
paved=new THREE.MeshStandardMaterial({map:courtTex,bumpMap:courtBump,bumpScale:1.4,color:'#dcd6ca',roughness:1});
staticMeshes=[];
solids=[];
waterways=[];
bridges=[];
fabric=pattern(256,128,c=>{
 c.fillStyle='#2e4e54';c.fillRect(0,0,256,128);
 for(let i=0;i<8;i++){
  const x=i*32;
  c.fillStyle=i%2?'#47695d':'#345962';c.fillRect(x,10,31,106);
  c.strokeStyle='#c9a45d';c.lineWidth=2;
  c.strokeRect(x+2,14,27,97);
  c.beginPath();c.moveTo(x+16,27);c.lineTo(x+27,64);c.lineTo(x+16,101);c.lineTo(x+5,64);c.closePath();c.stroke();
  c.fillStyle='#d6b56a';c.beginPath();c.arc(x+16,64,3.8,0,Math.PI*2);c.fill();
  c.strokeStyle='#739c8f';c.strokeRect(x+7,36,17,55);
 }
 c.fillStyle='#bea36a';c.fillRect(0,2,256,5);c.fillRect(0,121,256,5);
});
doors=pattern(192,192,c=>{
 c.fillStyle='#632b25';c.fillRect(0,0,192,192);
 for(let i=0;i<4;i++){
  const x=i*48;
  c.fillStyle='#743a29';c.fillRect(x+3,4,42,184);
  c.fillStyle='#322e24';c.fillRect(x+6,14,36,96);
  c.strokeStyle='#ab7045';c.lineWidth=2;
  c.strokeRect(x+6,14,36,96);c.strokeRect(x+6,117,36,63);
  c.save();c.beginPath();c.rect(x+6,14,36,96);c.clip();
  for(let j=-90;j<102;j+=11){
   c.beginPath();c.moveTo(x+4,18+j);c.lineTo(x+43,58+j);c.moveTo(x+43,18+j);c.lineTo(x+4,58+j);c.stroke();
  }
  c.restore();c.fillStyle='#b49152';c.fillRect(x+21,126,7,5);
 }
});
masonry=pattern(256,128,c=>{
 c.fillStyle='#66594f';c.fillRect(0,0,256,128);
 for(let row=0;row<8;row++)for(let i=-1;i<8;i++){
  const v=95+Math.floor(random()*32);
  c.fillStyle='rgb('+v+','+(v-10)+','+(v-16)+')';
  c.fillRect(i*36+(row%2)*18,row*16,35,15);
 }
});
carving=pattern(192,64,c=>{
 c.fillStyle='#d4cfc0';c.fillRect(0,0,192,64);
 c.strokeStyle='#aaa597';c.lineWidth=2;
 c.strokeRect(3,4,186,55);c.strokeRect(8,9,176,45);
 for(let x=24;x<180;x+=36){
  c.beginPath();c.ellipse(x,32,12,11,0,0,Math.PI*2);c.stroke();
  c.beginPath();c.moveTo(x-9,32);c.bezierCurveTo(x+13,13,x-9,51,x+9,32);c.stroke();
 }
});
pebbleTex=pattern(192,192,c=>{
 c.fillStyle='#a09a83';c.fillRect(0,0,192,192);
 for(let i=0;i<430;i++){
  const x=random()*192,y=random()*192,size=1.4+random()*2.9;
  c.fillStyle=['#696a60','#b9b19b','#d1c4a8','#8a7970','#786f62'][i%5];
  c.beginPath();c.ellipse(x,y,size,size*.64,random()*6,0,6.283);c.fill();
 }
});
// Xà vẽ kiểu "toàn tử thải họa": dải xanh lục – lam, hoa xoáy ở hai đầu, ô giữa có rồng/hoa vàng.
fabric.dispose();
fabric=pattern(512,256,c=>{
 const W=512,H=256;
 c.fillStyle='#1f4f5c';c.fillRect(0,0,W,H);
 const cell=128;
 for(let k=0;k<4;k++){
  const x=k*cell,blue=k%2===0;
  c.fillStyle=blue?'#2a6170':'#2f6a4c';c.fillRect(x,18,cell,H-36);
  // khung ô
  c.strokeStyle='#e7c46c';c.lineWidth=4;c.strokeRect(x+6,26,cell-12,H-52);
  c.strokeStyle='#f3efe2';c.lineWidth=2;c.strokeRect(x+12,32,cell-24,H-64);
  // hoa xoáy (xuanzi): vòng cánh lồng nhau
  const cx=x+cell/2,cy=H/2;
  for(const [r,col] of [[46,'#f3efe2'],[38,blue?'#3f8ea0':'#4d9a6c'],[30,'#f3efe2'],[23,blue?'#2a6170':'#2f6a4c']]){
   c.fillStyle=col;
   for(let p=0;p<10;p++){const a=p/10*6.283;c.beginPath();c.ellipse(cx+Math.cos(a)*r*.55,cy+Math.sin(a)*r*.55,r*.48,r*.22,a,0,6.283);c.fill()}
  }
  const core=c.createRadialGradient(cx-3,cy-3,1,cx,cy,14);core.addColorStop(0,'#fff2b0');core.addColorStop(.6,'#d9a443');core.addColorStop(1,'#7a5214');
  c.fillStyle=core;c.beginPath();c.arc(cx,cy,13,0,6.283);c.fill();
  // nửa hoa xoáy ở góc
  c.fillStyle='#e7c46c';for(const [qx,qy] of [[x+12,32],[x+cell-12,32],[x+12,H-32],[x+cell-12,H-32]]){c.beginPath();c.arc(qx,qy,8,0,6.283);c.fill()}
 }
 c.fillStyle='#c79a45';c.fillRect(0,0,W,8);c.fillRect(0,H-8,W,8);
 c.fillStyle='#8c2c22';c.fillRect(0,8,W,10);c.fillRect(0,H-18,W,10);
 c.fillStyle='rgba(255,240,200,.35)';c.fillRect(0,9,W,2);c.fillRect(0,H-17,W,2);
});
fabric.anisotropy=8;
beamBump=bumpFrom(fabric,'grayscale(1) contrast(1.4)');
paintedBeam=new THREE.MeshStandardMaterial({map:fabric,bumpMap:beamBump,bumpScale:.8,roughness:.72});
doorBump=bumpFrom(doors,'grayscale(1) contrast(1.8)');
doorPanels=new THREE.MeshStandardMaterial({map:doors,bumpMap:doorBump,bumpScale:2,roughness:.8});
darkMasonry=new THREE.MeshStandardMaterial({map:masonry,bumpMap:bumpFrom(masonry,'grayscale(1) contrast(2)'),bumpScale:2,color:'#c1b7a7',roughness:.95});
carvedStone=new THREE.MeshStandardMaterial({map:carving,bumpMap:bumpFrom(carving,'grayscale(1) contrast(2.4)'),bumpScale:2.5,roughness:.87});
gardenPebbles=new THREE.MeshStandardMaterial({map:pebbleTex,roughness:1,side:THREE.DoubleSide});
grayCourt=new THREE.MeshStandardMaterial({map:courtTex,bumpMap:courtBump,bumpScale:1.4,color:'#d2cec5',roughness:.97});
paleCourt=new THREE.MeshStandardMaterial({map:courtTex,bumpMap:courtBump,bumpScale:1.4,color:'#dcd9cb',roughness:.95});
bronze=material('#5e6041');
foliageRock=material('#8b8a77');
oldBark=material('#635842');
poolDeck=material('#a9a496');
}

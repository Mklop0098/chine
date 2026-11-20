// Thảm cỏ (cụm lá cỏ có gió), hoa nhiều màu, thêm cây trong vườn và bồn cây – chỉ bên trong Tử Cấm Thành.
// Tất cả dùng instancing chia ô + LOD (xem instancer.js) nên số lượng lớn vẫn nhẹ.
import * as THREE from 'three';
import {bounds,lineDistance,pointInPolygon} from '../builders/primitives.js';
import {random} from '../core/utils.js';
import {data} from '../data.js';
import {WX} from '../weather/uniforms.js';
import {defineGroup,pushTRS} from './instancer.js';
import {mappedWater} from './landscape.js';
import {addTree,clump,occupied,treePositions} from './trees.js';
import {river} from './water.js';

export const windTime={value:0};
export const vegetationStats={grass:0,flowers:0,trees:0};

// ---------- Hình học ----------
function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}

function pushTri(pos,col,nor,a,b,c,ca,cb,cc,n){
 // Mỗi tam giác ghi hai mặt (đảo chiều) với pháp tuyến hướng lên, để mặt sau không bị tối.
 for(const [p,q,r,cp,cq,cr] of [[a,b,c,ca,cb,cc],[a,c,b,ca,cc,cb]]){
  pos.push(...p,...q,...r);col.push(...cp,...cq,...cr);nor.push(...n,...n,...n);
 }
}

function build(pos,col,nor,tint=1){
 const g=new THREE.BufferGeometry();
 g.setAttribute('aTint',new THREE.Float32BufferAttribute(new Float32Array(pos.length/3).fill(tint),1));
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
 g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
 g.computeBoundingSphere();return g;
}

function tuftGeo(blades,segs,seed){
 const r=rng(seed),pos=[],col=[],nor=[];
 const base=new THREE.Color('#355422'),tipA=new THREE.Color('#8fb653'),tipB=new THREE.Color('#699a3b');
 for(let b=0;b<blades;b++){
  const a=r()*6.283,off=r()*.1,h=.2+r()*.24,w=.03+r()*.025,lean=.12+r()*.22,face=a+1.4+r()*.4;
  const ox=Math.cos(a)*off,oz=Math.sin(a)*off,dx=Math.cos(a),dz=Math.sin(a),fx=Math.cos(face),fz=Math.sin(face);
  const tip=tipA.clone().lerp(tipB,r()),n=new THREE.Vector3(dx*.35,1,dz*.35).normalize().toArray();
  const L=[],R=[],C=[];
  for(let s=0;s<=segs;s++){
   const t=s/segs,y=h*t,o=lean*h*t*t,ww=w*(1-t*.85),cx=ox+dx*o,cz=oz+dz*o;
   L.push([cx-fx*ww,y,cz-fz*ww]);R.push([cx+fx*ww,y,cz+fz*ww]);C.push(base.clone().lerp(tip,Math.pow(t,.7)).toArray());
  }
  const T=[ox+dx*lean*h*1.15,h*1.04,oz+dz*lean*h*1.15],ct=tip.toArray();
  for(let s=0;s<segs;s++){
   if(s===segs-1){pushTri(pos,col,nor,L[s],R[s],T,C[s],C[s],ct,n);continue}
   pushTri(pos,col,nor,L[s],R[s],R[s+1],C[s],C[s],C[s+1],n);
   pushTri(pos,col,nor,L[s],R[s+1],L[s+1],C[s],C[s+1],C[s+1],n);
  }
 }
 return build(pos,col,nor);
}

// Hoa: đầu hoa 5 cánh (màu trắng, nhân với màu instance) đặt ở y=1; thân và lá đặt riêng.
function headGeo(petals,seed){
 const r=rng(seed),pos=[],col=[],nor=[],white=[1,1,1],edge=[.93,.9,.88],mid=[.98,.86,.45],up=[0,1,0];
 for(let i=0;i<petals;i++){
  const a=i/petals*6.283+r()*.2,s=.42;
  const p=(ang,rad,y)=>[Math.cos(ang)*rad,1+y,Math.sin(ang)*rad];
  const c=p(a,.015,.012),l=p(a-s,.075,.02),t=p(a,.125,.045),rr=p(a+s,.075,.02);
  pushTri(pos,col,nor,c,l,t,mid,white,edge,up);pushTri(pos,col,nor,c,t,rr,mid,edge,white,up);
 }
 for(let i=0;i<5;i++){
  const a=i/5*6.283,b=(i+1)/5*6.283,y=1.03;
  pushTri(pos,col,nor,[0,y+.01,0],[Math.cos(a)*.028,y,Math.sin(a)*.028],[Math.cos(b)*.028,y,Math.sin(b)*.028],mid,mid,mid,up);
 }
 return build(pos,col,nor);
}

function stemGeo(tint=0){
 const pos=[],col=[],nor=[],g0=[.24,.34,.15],g1=[.36,.48,.22],up=[0,1,0];
 for(const a of [0,Math.PI/2]){
  const dx=Math.cos(a)*.012,dz=Math.sin(a)*.012;
  pushTri(pos,col,nor,[-dx,0,-dz],[dx,0,dz],[0,1,0],g0,g0,g1,up);
 }
 for(const [a,y] of [[.6,.25],[3.5,.4]]){
  const dx=Math.cos(a),dz=Math.sin(a),px=-dz*.03,pz=dx*.03;
  pushTri(pos,col,nor,[0,y,0],[dx*.09+px,y+.06,dz*.09+pz],[dx*.17,y+.1,dz*.17],g0,g1,g1,up);
  pushTri(pos,col,nor,[0,y,0],[dx*.17,y+.1,dz*.17],[dx*.09-px,y+.06,dz*.09-pz],g0,g1,g1,up);
 }
 return build(pos,col,nor,tint);
}

// Gió nhẹ (đỉnh lay nhiều hơn gốc) + phủ tuyết/ướt rẻ tiền thay cho shader phong hóa đầy đủ.
function mergeFlower(head,stem){
 const g=new THREE.BufferGeometry();
 for(const k of ['position','color','normal','aTint']){
  const a=head.attributes[k],b=stem.attributes[k],arr=new Float32Array(a.array.length+b.array.length);
  arr.set(a.array);arr.set(b.array,a.array.length);g.setAttribute(k,new THREE.BufferAttribute(arr,a.itemSize));
 }
 g.computeBoundingSphere();return g;
}

function plantMaterial(amp,roughness=.95){
 const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness});
 mat.envMapIntensity=.25;mat.userData.envSet=true;mat.userData.weathered=true;
 mat.onBeforeCompile=sh=>{
  sh.uniforms.uWind=windTime;sh.uniforms.uSnow=WX.snow;sh.uniforms.uWet=WX.wet;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uWind;attribute float aTint;')
   .replace('#include <color_vertex>',`vColor=vec3(1.);vColor*=color;
   #ifdef USE_INSTANCING_COLOR
   vColor*=mix(vec3(1.),instanceColor,aTint);
   #endif`)
   .replace('#include <begin_vertex>',`#include <begin_vertex>
   {vec3 ip=vec3(0.);
   #ifdef USE_INSTANCING
   ip=instanceMatrix[3].xyz;
   #endif
   float h=position.y*position.y;
   float sw=sin(uWind*1.7+ip.x*.21+ip.z*.17)+.45*sin(uWind*3.3+ip.x*.93-ip.z*.61);
   transformed.x+=sw*${amp.toFixed(3)}*h;transformed.z+=cos(uWind*1.3+ip.z*.23+ip.x*.07)*${(amp*.6).toFixed(3)}*h;}`);
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uSnow,uWet;')
   .replace('#include <color_fragment>',`#include <color_fragment>
   diffuseColor.rgb*=1.-.3*uWet;
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.9,.93,.96),uSnow*.8);`);
 };
 mat.customProgramCacheKey=()=>'plant'+amp;
 return mat;
}

// ---------- Kiểm tra vị trí nhanh (lưới không gian cho công trình) ----------
const OCC=24;
let occGrid;
function buildOccGrid(){
 occGrid=new Map();
 for(const o of occupied){
  const [cx,cz,w,d]=o.b;
  for(let x=Math.floor((cx-w/2-2)/OCC);x<=Math.floor((cx+w/2+2)/OCC);x++)
   for(let z=Math.floor((cz-d/2-2)/OCC);z<=Math.floor((cz+d/2+2)/OCC);z++){
    const k=x+','+z;if(!occGrid.has(k))occGrid.set(k,[]);occGrid.get(k).push(o);
   }
 }
}
function blocked(x,z,margin=.4){
 const list=occGrid.get(Math.floor(x/OCC)+','+Math.floor(z/OCC));
 return !!list&&list.some(({p,b:[cx,cz,w,d]})=>Math.abs(cx-x)<w/2+margin&&Math.abs(cz-z)<d/2+margin&&pointInPolygon(x,z,p));
}
const inWater=(x,z)=>mappedWater.some(p=>pointInPolygon(x,z,p))||lineDistance(x,z,river)<6.5;
const nearPools=(x,z)=>Math.abs(x+53)<6&&Math.abs(z+406.4)<6.5||Math.abs(x-54)<6&&Math.abs(z+406.5)<6.5;
const patch=(x,z)=>(Math.sin(x*.19+z*.07)+Math.sin(x*.05-z*.23+1.7)+Math.sin((x+z)*.41)*.5+2.5)/5;

// ---------- Rải cỏ, hoa ----------
const _c=new THREE.Color();
function grassAt(x,z,y,s=1){
 const v=.82+random()*.32;_c.setRGB(v*(.95+random()*.12),v,v*(.85+random()*.15));
 const sc=(.6+random()*.45)*s;
 pushTRS('grass',x,y,z,sc,sc*(.7+random()*.45),sc,random()*6.283,_c);
 vegetationStats.grass++;
}

const flowerColors=['#d83a4f','#f2c445','#f39ab8','#f7f2e8','#9a58cf','#ee7a36','#cfe0ff','#e64f8c'];
function flowerAt(x,z,y,color,s=1){
 const h=(.28+random()*.3)*s,hs=(1.1+random()*.6)*s,ry=random()*6.283,tx=(random()-.5)*.25,tz=(random()-.5)*.25;
 _c.set(color);const v=.9+random()*.2;_c.multiplyScalar(v);
 pushTRS('flower',x,y,z,hs,h,hs,ry,_c,tx,tz);
 vegetationStats.flowers++;
}

function scatterGrass(poly,step,keep,y,reject){
 const [cx,cz,w,d]=bounds(poly);
 for(let x=cx-w/2;x<cx+w/2;x+=step)for(let z=cz-d/2;z<cz+d/2;z+=step){
  const px=x+random()*step,pz=z+random()*step;
  if(random()>keep*(.35+patch(px,pz)))continue;
  if(!pointInPolygon(px,pz,poly)||blocked(px,pz)||reject?.(px,pz))continue;
  grassAt(px,pz,y);
 }
}

function flowerCluster(poly,x,z,y,reject,big=false){
 const color=flowerColors[Math.floor(random()*flowerColors.length)],n=6+Math.floor(random()*(big?22:14)),rad=.5+random()*(big?1.6:1);
 for(let i=0;i<n;i++){
  const a=random()*6.283,r=Math.sqrt(random())*rad,fx=x+Math.cos(a)*r,fz=z+Math.sin(a)*r;
  if(!pointInPolygon(fx,fz,poly)||blocked(fx,fz)||reject?.(fx,fz))continue;
  flowerAt(fx,fz,y,color,big?1.15:1);
 }
}

function tryTree(x,z,base,h,cypress,kind,gap=4.2){
 if(blocked(x,z,1.2)||treePositions.some(([a,b])=>Math.abs(a-x)<gap&&Math.abs(b-z)<gap&&Math.hypot(a-x,b-z)<gap))return false;
 addTree(x,z,base,h,cypress,kind);vegetationStats.trees++;return true;
}

export function buildVegetation(){
 buildOccGrid();
 const tufts=[tuftGeo(7,3,11),tuftGeo(4,1,11)];
 defineGroup('grass',{levels:[{geo:tufts[0],max:65},{geo:tufts[1],max:240}],material:plantMaterial(.28),cell:64,castShadow:false,hideBeyond:240,colored:true});
 const stem=stemGeo(0);
 defineGroup('flower',{levels:[{geo:mergeFlower(headGeo(5,3),stem),max:90},{geo:headGeo(4,5),max:170}],material:plantMaterial(.07,.75),cell:64,castShadow:false,hideBeyond:170,colored:true});

 // Ngự đạo lát đá chạy dọc trục x≈1 (dựng trong props.js) – không mọc cỏ trên đó.
 const routeNear=(x,z,d)=>Math.abs(x-1)<4.6+d&&Math.abs(z)<470||lineDistance(x,z,data.route)<d;
 const pathNear=(x,z,d)=>data.gardenPaths.some(p=>lineDistance(x,z,p)<d);

 // 1) Bồn cây có sẵn: thêm cây, bụi, cỏ dày và khóm hoa.
 for(const [kind,p] of data.landscape){
  if(kind===1)continue;
  const [cx,cz,w,d]=bounds(p),area=w*d;
  if(area<4)continue;
  const reject=(x,z)=>routeNear(x,z,1.6)||inWater(x,z);
  scatterGrass(p,.82,1,.05,reject);
  for(let i=0;i<Math.min(70,area/32);i++){
   const x=cx+(random()-.5)*w,z=cz+(random()-.5)*d;
   if(!pointInPolygon(x,z,p)||reject(x,z)||routeNear(x,z,2.4))continue;
   if(random()<.26)tryTree(x,z,.05,4.2+random()*5,random()>.62,random()<.22?'blossom':null,3.8);
   else if(random()<.6){const s=.4+random()*.7;clump(x,s*.5,z,s,s*.67,s*.82,'shrub')}
   else flowerCluster(p,x,z,.05,reject);
  }
 }

 // 2) Các vườn (Ngự Hoa Viên, Từ Ninh, Kiến Phúc, Ninh Thọ…): cỏ ven, viền hoa dọc lối đi, thêm cây.
 for(const g of data.gardens){
  const [cx,cz,w,d]=bounds(g);
  const planters=treePositions.filter(([a,b])=>Math.abs(a-cx)<w/2+2&&Math.abs(b-cz)<d/2+2);
  const reject=(x,z)=>routeNear(x,z,2.2)||pathNear(x,z,1.25)||inWater(x,z)||nearPools(x,z)||planters.some(([a,b])=>Math.abs(a-x)<1.1&&Math.abs(b-z)<1.1);
  scatterGrass(g,.95,.75,.042,reject);
  for(const path of data.gardenPaths){
   for(let i=1;i<path.length;i++){
    const [ax,az]=path[i-1],[bx,bz]=path[i],len=Math.hypot(bx-ax,bz-az);
    if(!len)continue;
    const nx=-(bz-az)/len,nz=(bx-ax)/len;
    for(let t=random()*3;t<len;t+=2.6+random()*2.2){
     if(random()<.45)continue;
     const side=random()<.5?-1:1,off=1.7+random()*.6,x=ax+(bx-ax)*t/len+nx*off*side,z=az+(bz-az)*t/len+nz*off*side;
     if(pointInPolygon(x,z,g))flowerCluster(g,x,z,.042,reject);
    }
   }
  }
  for(let i=0;i<Math.min(60,w*d/120);i++){
   const x=cx+(random()-.5)*w,z=cz+(random()-.5)*d;
   if(!pointInPolygon(x,z,g)||reject(x,z)||pathNear(x,z,2.6))continue;
   if(random()<.5)tryTree(x,z,.04,4.4+random()*4.6,random()>.55,random()<.35?'blossom':null,4.6);
   else flowerCluster(g,x,z,.042,reject,true);
  }
 }

 console.info('[vegetation]',vegetationStats);
}

export function updateVegetation(dt){windTime.value+=dt}

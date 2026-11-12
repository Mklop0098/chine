// Hơn 900 công trình dựng từ footprint OSM: tường, cửa, mái theo nhiều kiểu, bậc đá.
import * as THREE from 'three';
import {bandStrip,bracketMat,studDoor,windowMat} from '../builders/ornaments.js';
import {add,area,beamBetween,bounds,box,pointInPolygon,polygon} from '../builders/primitives.js';
import {roof} from '../builders/roof.js';
import {material,pattern,random,vec} from '../core/utils.js';
import {data} from '../data.js';
import {baseStone,carvedStone,doorPanels,glaze,grayTiles,paintedBeam,red,roofGold,stone,tiles} from '../materials/textures.js';
import {distSegment} from '../player/collision.js';
import {places} from './landmarks.js';
import {westZ} from './rampart.js';
import {addFacadeLantern} from './lanterns.js';

export let plasterTexture,facadePlaster,wallPlaster,grayTile,greenTile,roofMaterials,decoratedRoofEdge,courtyardBase,detailedBuildings,mappedRoofParts;

export function dominantFrame(points,direction=-1){
 let dx=1,dz=0,best=0;
 if(direction>=0){
  const theta=(direction+2.2)*Math.PI/180;
  dx=Math.sin(theta);dz=-Math.cos(theta);
 }else for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],l=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(l>best){best=l;dx=(b[0]-a[0])/l;dz=(b[1]-a[1])/l}
 }
 const projected=points.map(([x,z])=>[x*dx+z*dz,z*dx-x*dz]);
 const [u,v,w,d]=bounds(projected);
 return {dx,dz,u,v,w,d};
}

export function borderDistance(x,z,p){
 let min=Infinity;
 for(let i=0;i<p.length;i++)min=Math.min(min,distSegment(x,z,[p[i],p[(i+1)%p.length]]));
 return min;
}

export function footprintRoof(points,y,rise,style,mat,direction=-1,greenBorder=false,{fallback=false}={}){
 const frame=dominantFrame(points,direction);
 const {dx,dz,u,v,w,d}=frame;
 if(style!=='skillion'&&style!=='pyramidal')rise=Math.min(rise,Math.max(.35,Math.min(w,d)*.58));
 const rectangular=area(points)/(w*d)>.90;
 if(rectangular&&!greenBorder&&style!=='skillion'){
  const gable=style==='gabled';
  const roofStyle=style==='pyramidal'?'pyramid':gable?(fallback?'gable-hard':'gable-overhang'):'hipped';
  roof(u*dx-v*dz,u*dz+v*dx,w,d,y,rise,mat,false,{style:roofStyle,dx,dz});
  return;
 }
 const outline=points.map(p=>new THREE.Vector2(...p));
 const tris=THREE.ShapeUtils.triangulateShape(outline,[]);
 if(!tris.length)return;
 const isSlope=style==='skillion';
 const isGable=style==='gabled',isPyramid=style==='pyramidal';
 const irregular=!isSlope&&!isGable&&area(points)/(w*d)<.84;
 const depth=Math.max(.2,Math.min(w,d)/2);
 const n=Math.min(12,Math.max(4,2*Math.ceil(Math.max(w,d)/14)));
 let maxInterior=depth;
 if(irregular){
  maxInterior=.1;
  for(let i=0;i<10;i++)for(let j=0;j<10;j++){
   const a=u+(i/9-.5)*w,b=v+(j/9-.5)*d,x=a*dx-b*dz,z=a*dz+b*dx;
   if(pointInPolygon(x,z,points))maxInterior=Math.max(maxInterior,borderDistance(x,z,points));
  }
 }
 function roofHeight(x,z){
  const U=x*dx+z*dz,V=z*dx-x*dz;
  if(isSlope)return y+rise*(1-THREE.MathUtils.clamp((U-u+w/2)/Math.max(w,.01),0,1));
  if(isPyramid){
   const t=1-Math.max(Math.abs(U-u)/(w/2),Math.abs(V-v)/(d/2));
   return y+rise*Math.pow(THREE.MathUtils.clamp(t,0,1),1.45);
  }
  if(isGable){
   const t=w>=d?1-Math.abs(V-v)/Math.max(.01,d/2):1-Math.abs(U-u)/Math.max(.01,w/2);
   return y+rise*Math.pow(THREE.MathUtils.clamp(t,0,1),1.22);
  }
  const f=irregular?borderDistance(x,z,points)/maxInterior:Math.min(w/2-Math.abs(U-u),d/2-Math.abs(V-v))/depth;
  return y+rise*Math.pow(THREE.MathUtils.clamp(f,0,1),1.3);
 }
 const pos=[],uv=[],normal=[],idx=[];
 for(const [i,j,k] of tris){
  const A=points[i],B=points[j],C=points[k],start=pos.length/3;
  for(let row=0;row<=n;row++)for(let col=0;col<=n-row;col++){
   const a=row/n,b=col/n,c=1-a-b,x=A[0]*c+B[0]*a+C[0]*b,z=A[1]*c+B[1]*a+C[1]*b;
   const h=roofHeight(x,z);
   pos.push(x,h,z);
   uv.push((x*dx+z*dz)*.6,(z*dx-x*dz)*.55);
   const slopeX=(roofHeight(x+.085,z)-roofHeight(x-.085,z))/.17,slopeZ=(roofHeight(x,z+.085)-roofHeight(x,z-.085))/.17;
   const nrm=vec(-slopeX,1,-slopeZ).normalize();normal.push(nrm.x,nrm.y,nrm.z);
  }
  const at=(row,col)=>start+row*(n+1)-row*(row-1)/2+col;
  for(let row=0;row<n;row++)for(let col=0;col<n-row;col++){
   idx.push(at(row,col),at(row,col+1),at(row+1,col));
   if(col<n-row-1)idx.push(at(row,col+1),at(row+1,col+1),at(row+1,col));
  }
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
 add(g,mat);
 if(greenBorder){
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
   if(length>.8)beamBetween(vec(a[0],roofHeight(...a)+.02,a[1]),vec(b[0],roofHeight(...b)+.02,b[1]),.095,glaze,8);
  }
 }
 if(Math.min(w,d)>3&&Math.max(w,d)>7&&rise>.6&&!isSlope&&!isPyramid&&!irregular&&area(points)/(w*d)>.9){
  const along=w>=d,span=Math.max(.24,(isGable?Math.max(w,d)*.92:Math.abs(w-d))*.5),aU=along?u-span:u,aV=along?v:v-span,bU=along?u+span:u,bV=along?v:v+span;
  beamBetween(vec(aU*dx-aV*dz,y+rise-.045,aU*dz+aV*dx),vec(bU*dx-bV*dz,y+rise-.045,bU*dz+bV*dx),.125,mat===grayTile?baseStone:decoratedRoofEdge,7);
 }
}

export function edgeBox(a,b,offset,y,h,d,mat){
 const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
 if(len<.07)return;
 const x=(a[0]+b[0])/2+offset*dz/len,z=(a[1]+b[1])/2-offset*dx/len;
 const o=box(x,y,z,len,h,d,mat);
 o.rotation.y=-Math.atan2(dz,dx);
 return o;
}

export function frontStep(p,h){
 const signed=p.reduce((sum,[x,z],i)=>{const [u,v]=p[(i+1)%p.length];return sum+x*v-u*z},0),outward=signed>0?1:-1;
 let best=null;
 for(let i=0;i<p.length;i++){
  const a=p[i],b=p[(i+1)%p.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(len<4)continue;
  const nx=outward*(b[1]-a[1])/len,nz=-outward*(b[0]-a[0])/len;
  if(nz>.8&&(!best||len>best.len))best={a,b,len,nx,nz};
 }
 if(!best)return;
 const {a,b,len,nx,nz}=best,w=Math.min(len*.3,6),mx=(a[0]+b[0])/2,mz=(a[1]+b[1])/2;
 const st=box(mx+nx*.42,h/4,mz+nz*.42,w,h/2,.84,stone);st.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);
 const cap=box(mx+nx*.86,h/4,mz+nz*.86,w+.5,h/2,.08,baseStone);cap.rotation.y=st.rotation.y;
}

// ---------- Cửa, cửa sổ, bậc đá ----------
export function stoneStairs(outline,y0,rise,direction){
 const {dx,dz,u,v,w,d}=dominantFrame(outline,direction);
 const toW=(U,V)=>[U*dx-V*dz,U*dz+V*dx],yaw=-Math.atan2(dz,dx);
 if(rise/Math.max(w,.1)<.2){
  footprintRoof(outline,y0,rise,'skillion',stone,direction);
  for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length];edgeBox(a,b,0,y0+.06,.12,.3,baseStone)}
  return;
 }
 const N=Math.max(2,Math.round(rise/.16)),sw=w/N,cw=Math.min(.6,Math.max(.32,d*.08)),inner=d-2*cw;
 for(let i=0;i<N;i++){
  const U=u+w/2-(i+.5)*sw,h=rise*(i+1)/N,[x,z]=toW(U,v);
  const b=box(x,y0+h/2,z,sw+.02,h,d,stone,true);b.rotation.y=yaw;b.userData.step=true;
  const [nx,nz]=toW(U+sw/2-.03,v);const e=box(nx,y0+h-.03,nz,.06,.06,inner,baseStone);e.rotation.y=yaw;
 }
 const L=Math.hypot(w,rise),tilt=Math.atan2(rise,w);
 for(const s of [-1,1]){
  const [x,z]=toW(u,v+s*(d/2-cw/2));
  const ch=box(x,y0+rise/2+.12,z,L,.42,cw,stone,true);ch.rotation.order='YZX';ch.rotation.y=yaw;ch.rotation.z=-tilt;
  if(rise>1.2){
   const m=Math.max(2,Math.ceil(w/1.8));
   for(let k=0;k<=m;k++){const t=k/m,[px,pz]=toW(u-w/2+t*w,v+s*(d/2-cw/2));const py=y0+rise*(1-t)+.33;box(px,py+.45,pz,.22,.9,.22,stone);add(new THREE.SphereGeometry(.13,8,6),carvedStone,px,py+.98,pz)}
   const [ax,az]=toW(u-w/2,v+s*(d/2-cw/2)),[cx,cz]=toW(u+w/2,v+s*(d/2-cw/2));
   beamBetween(vec(ax,y0+rise+.33+.78,az),vec(cx,y0+.33+.78,cz),.07,stone,6);
  }
 }
}

export function gateDoors(outline,h){
 const fr=dominantFrame(outline),yaw=-Math.atan2(fr.dz,fr.dx);
 if(fr.w<2.4||fr.d<1.2)return;
 const dw=Math.min(3.4,fr.w*.45),dh=Math.min(2.55,h*.88);
 for(const s of [-1,1]){
  const V=fr.v+s*(fr.d/2+.03),x=fr.u*fr.dx-V*fr.dz,z=fr.u*fr.dz+V*fr.dx;
  const dr=box(x,dh/2,z,dw,dh,.1,studDoor);dr.rotation.y=yaw;
  const V2=fr.v+s*(fr.d/2+.07),x2=fr.u*fr.dx-V2*fr.dz,z2=fr.u*fr.dz+V2*fr.dx;
  const lt=box(x2,dh+.13,z2,dw+.5,.26,.12,paintedBeam);lt.rotation.y=yaw;
  for(const q of [-1,1]){const U=fr.u+q*(dw/2+.12),px=U*fr.dx-V2*fr.dz,pz=U*fr.dz+V2*fr.dx;const pst=box(px,dh/2,pz,.24,dh,.14,red);pst.rotation.y=yaw}
  const V3=fr.v+s*(fr.d/2+.32),sx=fr.u*fr.dx-V3*fr.dz,sz=fr.u*fr.dz+V3*fr.dx;
  const st=box(sx,.08,sz,dw+.9,.16,.6,stone);st.rotation.y=yaw;
 }
}

export function detailFacade(p,y,height,ornate=false,upper=false){
 if(height<1.2)return;
 const signed=p.reduce((sum,[x,z],i)=>{const [u,v]=p[(i+1)%p.length];return sum+x*v-u*z},0);
 const outward=signed>0?1:-1;
 const lens=p.map((a,i)=>Math.hypot(p[(i+1)%p.length][0]-a[0],p[(i+1)%p.length][1]-a[1]));
 const longest=Math.max(...lens);
 for(let i=0;i<p.length;i++){
  const a=p[i],b=p[(i+1)%p.length],len=lens[i];
  if(len<1.65)continue;
  if(!upper)edgeBox(a,b,.047*outward,y+.19,.36,.19,courtyardBase);
  edgeBox(a,b,.063*outward,y+height-.16,.25,.19,ornate?paintedBeam:red);
  if(len<2.2)continue;
  bandStrip(a,b,.16*outward,y+height-.5,.56,bracketMat,1.3);
  const main=len>=longest*.55||len>=8;
  const bays=Math.max(1,Math.round(len/(ornate?3.0:3.65)));
  const at=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  if(main && height>=2.6){
   const scale=Math.min(1.05,height*.18);
   const count=ornate&&bays>=5?2:1;
   for(let i=0;i<count;i++){
    const mid=(i+1)/(count+1);
    const [x,z]=at(mid);
    addFacadeLantern(x+outward*(b[1]-a[1])*.46/len,y+height-.44-.82*scale,z-outward*(b[0]-a[0])*.46/len,scale);
    edgeBox(at(mid-.055/len),at(mid+.055/len),.24*outward,y+height-.44,.09,.52,red);
   }
  }
  const doorH=Math.min(3.1,height*.7);
  for(let bay=0;bay<bays;bay++){
   const mid=(bay+.5)/bays,half=.39/bays;
   if(upper){
    const wh=Math.min(1.5,height*.45);
    edgeBox(at(mid-half*.85),at(mid+half*.85),.09*outward,y+height*.5,wh,.12,windowMat);
   }else if(main){
    edgeBox(at(mid-half),at(mid+half),.09*outward,y+.28+doorH/2,doorH,.14,doorPanels);
    edgeBox(at(mid-half),at(mid+half),.12*outward,y+.28+doorH+.08,.16,.1,paintedBeam);
    if(height>doorH+2.2){
     const wh=Math.min(1.6,(height-doorH)*.45);
     edgeBox(at(mid-half*.8),at(mid+half*.8),.09*outward,y+doorH+.4+(height-doorH-.4)/2,wh,.12,windowMat);
    }
   }else{
    const wh=Math.min(1.5,height*.32),centerDoor=bays===1&&len<5.5&&height>2.6;
    if(centerDoor){edgeBox(at(mid-half*.75),at(mid+half*.75),.09*outward,y+.28+doorH*.45,doorH*.9,.14,doorPanels)}
    else edgeBox(at(mid-half*.8),at(mid+half*.8),.09*outward,y+Math.min(height*.55,2.2),wh,.12,windowMat);
    if(height>5.2)edgeBox(at(mid-half*.8),at(mid+half*.8),.09*outward,y+height*.72,Math.min(1.4,height*.18),.12,windowMat);
   }
   const s=at(bay/bays);
   const x=s[0]+outward*(b[1]-a[1])*.094/len,z=s[1]-outward*(b[0]-a[0])*.094/len;
   const width=ornate?.24:.19;
   box(x,y+height/2,z,width,height,width,red);
   if(ornate&&!upper){box(x,y+.16,z,.37,.32,.37,stone);box(x,y+height-.49,z,.51,.17,.45,paintedBeam)}
  }
  if(!upper&&height>doorH+2.2&&main)edgeBox(a,b,.07*outward,y+doorH+.42,.22,.16,ornate?paintedBeam:red);
 }
}

export function renderMappedBuilding(p,mappedHeight,isGate,id,parts,color,shape){
 const [, ,w,d]=bounds(p),small=Math.min(w,d);
 const isComplex=parts.length>1;
 const base=.38;
 const mat=roofMaterials[color]||roofGold;
 polygon(p,0,base,courtyardBase,true);
 frontStep(p,base);
 if(isComplex){
  for(const [outline,minY,top,rise,style,direction,partColor,construction] of parts){
   if(construction==='stone'&&style==='skillion'&&minY<.5&&rise>.3){stoneStairs(outline,minY,rise,direction);continue}
   const wallTop=top-rise;
   const wallBase=Math.max(minY,base);
   const finish=construction==='stone'||construction==='concrete'?baseStone:facadePlaster;
   if(wallTop>wallBase+.055){
    polygon(outline,wallBase,wallTop-wallBase,finish);
    if(finish===facadePlaster&&wallTop-wallBase>1.2)detailFacade(outline,wallBase,wallTop-wallBase,area(p)>260,minY>=1.5);
   }
   if(rise>.09){footprintRoof(outline,wallTop,rise,style,id==="40478704"?grayTile:roofMaterials[partColor]||mat,direction,id==="40478704");mappedRoofParts++}
   else if(style==='flat'&&minY>1&&wallTop-wallBase<.7)polygon(outline,wallTop,.065,finish);
  }
 }else{
  const height=mappedHeight>3.1&&mappedHeight<30?mappedHeight:Math.min(12.2,3.65+small*.36);
  const rise=Math.min(height*.43,small*.37),eave=height-rise;
  polygon(p,base,Math.max(1,eave-base),facadePlaster);
  detailFacade(p,base,Math.max(1,eave-base),area(p)>170||isGate);
  if(id==='40593735'||id==='40606461'){
   const {dx,dz,u,v,w,d}=dominantFrame(p);
   const x=u*dx-v*dz,z=u*dz+v*dx;
   const style='hip-gable';
   if(id==='40593735'){
    const upperEave=eave+rise*.53,neckW=w*.65,neckD=d*.61;
    roof(x,z,w,d,eave,rise*.39,mat,true,{dx,dz,style,inner:[neckW,neckD]});
    const neck=box(x,eave+rise*.46,z,neckW,rise*.14,neckD,paintedBeam);
    neck.rotation.y=-Math.atan2(dz,dx);
    roof(x,z,w*.79,d*.76,upperEave,rise*.47,mat,true,{dx,dz,style});
   }else roof(x,z,w,d,eave,rise,mat,true,{dx,dz,style});
  }else footprintRoof(p,eave,rise,shape,mat,-1,id==="40478704",{fallback:true});
 }
 detailedBuildings++;
}

export function buildMappedBuildings(){
plasterTexture=pattern(192,192,c=>{
 c.fillStyle='#b36954';c.fillRect(0,0,192,192);
 for(let i=0;i<4500;i++){
  const x=random()*192,y=random()*192,r=random()*2.4;
  c.fillStyle=i%2?'#5f31221c':'#efd1aa1f';
  c.fillRect(x,y,r,r);
 }
});
facadePlaster=new THREE.MeshStandardMaterial({map:plasterTexture,color:'#c27460',roughness:.91});
wallPlaster=new THREE.MeshStandardMaterial({map:plasterTexture,color:'#d38972',roughness:.94});
grayTile=new THREE.MeshStandardMaterial({map:grayTiles,color:'#a3a8a4',roughness:.78,side:THREE.DoubleSide});
greenTile=new THREE.MeshStandardMaterial({map:tiles,color:'#689483',roughness:.72,side:THREE.DoubleSide});
roofMaterials=[roofGold,grayTile,greenTile];
decoratedRoofEdge=material('#a87539');
courtyardBase=material('#a49b8a');
detailedBuildings=0;
mappedRoofParts=0;
for(const entry of data.buildings){
 const [p]=entry,[x,z,w]=bounds(p);
 if(Math.abs(x-29.9)<4&&Math.abs(z+420.8)<4)continue;
 if(Math.abs(x)<4&&w>125&&((z>125&&z<155)||(z> -68&&z< -48)))continue;
 if((Math.abs(x)>343&&Math.abs(z-westZ)<48&&x<0)||(Math.abs(x)<100&&z>444)||(Math.abs(x)<55&&z< -448))continue;
 renderMappedBuilding(...entry);
}
for(const [name,x,z,span] of data.districtPlaces){
 places.push({name,x,z,y:10,d:Math.max(18,span*.61),detail:true,note:'Mặt bằng đối chiếu theo bản đồ kiến trúc và OpenStreetMap. Chi tiết mặt đứng và mái thiếu tư liệu được tái dựng.'});
}
}

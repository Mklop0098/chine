// Bản đồ nhỏ (minimap) góc phải trên: vẽ sẵn toàn bộ mặt bằng Tử Cấm Thành một lần,
// mỗi khung hình chỉ cắt vùng quanh nhân vật, vẽ mũi tên hướng đi, NPC và điểm nhiệm vụ.
import {data} from '../data.js';
import {REMOVED_BUILDINGS} from '../world/mappedBuildings.js';
import {OPENINGS} from '../world/openingsData.js';

const PX=1.6,X0=-560,X1=560,Z0=-760,Z1=700;
let base,wrap,cv,ctx,label,ranges=[45,90,180],ri=1,last=0;

function poly(c,pts,fill,stroke,lw=1){
 c.beginPath();pts.forEach(([x,z],i)=>{const X=(x-X0)*PX,Y=(z-Z0)*PX;i?c.lineTo(X,Y):c.moveTo(X,Y)});c.closePath();
 if(fill){c.fillStyle=fill;c.fill()}
 if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke()}
}
function line(c,pts,color,w){c.beginPath();pts.forEach(([x,z],i)=>{const X=(x-X0)*PX,Y=(z-Z0)*PX;i?c.lineTo(X,Y):c.moveTo(X,Y)});c.strokeStyle=color;c.lineWidth=w*PX;c.lineCap='round';c.lineJoin='round';c.stroke()}

function drawBase(){
 base=document.createElement('canvas');base.width=(X1-X0)*PX;base.height=(Z1-Z0)*PX;
 const c=base.getContext('2d');
 c.fillStyle='#b9ad93';c.fillRect(0,0,base.width,base.height);
 // Hào nước và tường thành.
 const sx=376.5,sz=480.5,mi=393.5,mo=445.5,zi=497.5,zo=549.5;
 poly(c,[[-mo,-zo],[mo,-zo],[mo,zo],[-mo,zo]],'#4f8a80');
 poly(c,[[-mi,-zi],[mi,-zi],[mi,zi],[-mi,zi]],'#b9ad93');
 poly(c,[[-sx,-sz],[sx,-sz],[sx,sz],[-sx,sz]],'#d8d0be','#9a3b2e',4.5*PX);
 // Sân lát chính.
 for(const [x,z,w,d] of [[0,380,187,156],[0,215,137,151],[0,-161,119,63],[0,-251,111,144],[0,590,190,81]])poly(c,[[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]],'#cfc8b8');
 // Vườn, bồn cây, mặt nước.
 for(const g of data.gardens)poly(c,g,'#86a865');
 for(const [kind,p] of data.landscape)poly(c,p,kind===1?'#5d9a8f':'#7fa35c');
 line(c,data.river,'#5d9a8f',9);
 // Nền điện lớn.
 for(const v of Object.values(data.sites))poly(c,v[1],'#c9b98f','#8b6f3c',1);
 // Tường sân (đã trổ lối), cổng.
 for(const p of data.walls)poly(c,p,'#a8473a');
 for(const [outline,parts] of data.gatewayWalls)for(const p of parts)poly(c,p,'#a8473a');
 for(const [outline,parts] of data.gatewayBuildings){poly(c,outline,'#c79a3c','#7a3d2a',1)}
 // Nhà.
 for(const e of data.buildings){if(REMOVED_BUILDINGS.has(e[3]))continue;poly(c,e[0],e[2]?'#c79a3c':'#d9b05a','#7a4a2a',.8)}
 // Lối đi trổ thêm: khoét lại màu nền.
 for(const [x,z,dx,dz,len] of OPENINGS){
  const px=-dz,pz=dx,h=len/2+.9,w=1.5;
  poly(c,[[x-dx*h-px*w,z-dz*h-pz*w],[x+dx*h-px*w,z+dz*h-pz*w],[x+dx*h+px*w,z+dz*h+pz*w],[x-dx*h+px*w,z-dz*h+pz*w]],'#cfc8b8');
 }
}

const CSS=`
#minimap{position:fixed;top:66px;right:16px;z-index:30;width:184px;user-select:none;font:12px system-ui;color:#f6ead2}
#minimap .frame{position:relative;width:184px;height:184px;border-radius:50%;overflow:hidden;border:3px solid #e8c77a;box-shadow:0 4px 18px #0008,inset 0 0 18px #0006;background:#b9ad93;cursor:pointer}
#minimap canvas{width:100%;height:100%;display:block}
#minimap .n{position:absolute;top:2px;left:50%;transform:translateX(-50%);font-weight:700;color:#7a1f16;text-shadow:0 0 3px #fff}
#minimap .cap{margin-top:5px;text-align:center;background:#1a120ecc;border:1px solid #e8c77a55;border-radius:6px;padding:3px 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#minimap .zoom{position:absolute;bottom:6px;right:50%;transform:translateX(50%);font-size:10px;opacity:.8;background:#0006;border-radius:6px;padding:0 5px}
body.story-cine #minimap,body.story-start #minimap{display:none}
@media(max-width:580px){#minimap{top:56px;right:10px;width:130px}#minimap .frame{width:130px;height:130px}}
`;

export function buildMinimap(){
 drawBase();
 const st=document.createElement('style');st.textContent=CSS;document.head.append(st);
 wrap=document.createElement('div');wrap.id='minimap';
 wrap.innerHTML='<div class="frame" title="Bấm để đổi tầm nhìn (phím M)"><canvas></canvas><div class="n">B</div><div class="zoom"></div></div><div class="cap"></div>';
 document.body.append(wrap);
 cv=wrap.querySelector('canvas');ctx=cv.getContext('2d');label=wrap.querySelector('.cap');
 const size=()=>{const r=cv.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);cv.width=Math.round(r.width*d)||184;cv.height=Math.round(r.height*d)||184};
 size();addEventListener('resize',size);
 wrap.querySelector('.frame').onclick=zoomMinimap;
 wrap.querySelector('.zoom').textContent=ranges[ri]+' m';
}
export function zoomMinimap(){ri=(ri+1)%ranges.length;wrap.querySelector('.zoom').textContent=ranges[ri]+' m'}

function star(c,x,y,r,col){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}c.closePath();c.fillStyle=col;c.fill();c.strokeStyle='#5a2a1e';c.lineWidth=1.5;c.stroke()}

// view: {x,z,hx,hz (hướng), markers:[{x,z,color,kind,label}], place}
export function updateMinimap(view,t){
 if(!wrap||t-last<.08)return;last=t;
 const W=cv.width,H=cv.height,R=ranges[ri],s=W/(2*R);
 ctx.save();ctx.clearRect(0,0,W,H);
 // Cắt vùng bản đồ nền quanh vị trí.
 const sx=(view.x-R-X0)*PX,sy=(view.z-R-Z0)*PX,sw=2*R*PX;
 ctx.imageSmoothingEnabled=true;ctx.drawImage(base,sx,sy,sw,sw,0,0,W,H);
 const toS=(x,z)=>[(x-view.x)*s+W/2,(z-view.z)*s+H/2];
 // Điểm đánh dấu (ra ngoài khung thì ghim ở mép).
 for(const m of view.markers||[]){
  let [x,y]=toS(m.x,m.z);const dx=x-W/2,dy=y-H/2,d=Math.hypot(dx,dy),lim=W/2-10;
  const out=d>lim;if(out){x=W/2+dx/d*lim;y=H/2+dy/d*lim}
  if(m.kind==='target'){const pulse=1+Math.sin(t*5)*.15;star(ctx,x,y,(out?8:10)*pulse*(W/184),'#ffd34d')}
  else{ctx.beginPath();ctx.arc(x,y,(out?4:5)*(W/184),0,7);ctx.fillStyle=m.color;ctx.fill();ctx.strokeStyle='#1a120e';ctx.lineWidth=1.5;ctx.stroke()}
 }
 // Mũi tên người chơi.
 const a=Math.atan2(view.hz,view.hx),k=W/184;
 ctx.translate(W/2,H/2);ctx.rotate(a);
 ctx.beginPath();ctx.moveTo(11*k,0);ctx.lineTo(-7*k,-7*k);ctx.lineTo(-3*k,0);ctx.lineTo(-7*k,7*k);ctx.closePath();
 ctx.fillStyle=view.hero?'#2b5bd7':'#ffffff';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();
 ctx.restore();
 const cap=view.place||'';if(label.textContent!==cap)label.textContent=cap;
}

// Giao diện kể chuyện: màn hình bắt đầu, khung phim (letterbox), phụ đề, độc thoại nội tâm, tiêu đề chương,
// nút bỏ qua, bảng nhiệm vụ, lời nhắc tương tác, hộp hội thoại có lựa chọn, thông báo nhỏ, bảng phần thưởng.
import {renderer} from '../core/scene.js';

const CSS=`
#story{position:fixed;inset:0;pointer-events:none;z-index:30;font-family:"Noto Serif","Times New Roman",serif;color:#f6ead2}
#story .bar{position:absolute;left:0;right:0;height:0;background:#000;transition:height 1.2s ease}
#story .bar.top{top:0}#story .bar.bottom{bottom:0}
#story.cine .bar{height:11vh}
#story .fade{position:absolute;inset:0;background:#000;opacity:0;transition:opacity 1s ease}
#story .sub{position:absolute;left:50%;bottom:13.5vh;transform:translateX(-50%);max-width:min(860px,88vw);text-align:center;font-size:clamp(16px,2.2vw,23px);line-height:1.45;text-shadow:0 2px 6px #000,0 0 2px #000;opacity:0;transition:opacity .35s}
#story .sub.show{opacity:1}
#story .sub .who{display:block;font-size:.72em;letter-spacing:.12em;color:#e8c77a;text-transform:uppercase;margin-bottom:2px}
#story .sub.inner .txt{font-style:italic;color:#d9e3ec}
#story .sub.far .txt{opacity:.55;font-style:italic}
#story .title{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity 1.6s ease;text-shadow:0 3px 18px #000}
#story .title.show{opacity:1}
#story .title h1{margin:0;font-size:clamp(24px,4.3vw,60px);letter-spacing:.12em;color:#f3d892;font-weight:600;white-space:nowrap;text-align:center}
#story .title h2{margin:.6em 0 0;font-size:clamp(15px,2vw,24px);font-weight:400;font-style:italic;letter-spacing:.08em}
#story .title hr{width:min(360px,50vw);border:0;border-top:1px solid #e8c77a88;margin:14px 0 0}
#story button{pointer-events:auto;font:inherit;cursor:pointer}
#story .skip{position:absolute;right:24px;bottom:calc(11vh + 14px);background:#0008;border:1px solid #e8c77a66;color:#f6ead2;padding:7px 14px;border-radius:6px;font-size:14px;display:none}
#story.cine .skip{display:none}
#story .start{position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;background:radial-gradient(ellipse at center,#0006,#000c);pointer-events:auto}
#story .start.show{display:flex}
#story .start h1{margin:0;font-size:clamp(24px,4.3vw,58px);white-space:nowrap;letter-spacing:.16em;color:#f3d892;font-weight:600;text-shadow:0 3px 18px #000}
#story .start p{margin:.4em 0 1.6em;font-style:italic;opacity:.85}
#story .start button{display:block;min-width:300px;margin:6px;padding:12px 22px;border-radius:8px;border:1px solid #e8c77a88;background:#2a1712cc;color:#f6ead2;font-size:17px}
#story .start button:hover{background:#5a2a1ecc}
#story .start small{margin-top:18px;opacity:.7;font-size:13px;font-family:system-ui}
#story .quest{position:absolute;left:18px;top:70px;min-width:250px;max-width:320px;background:#1a120ecc;border:1px solid #e8c77a55;border-radius:8px;padding:10px 14px;display:none;font-size:14px}
#story .quest.show{display:block}
#story .quest b{color:#e8c77a;display:block;margin-bottom:4px;letter-spacing:.05em}
#story .quest li{list-style:none;margin:3px 0;opacity:.6}
#story .quest li.on{opacity:1}#story .quest li.done{opacity:.5;text-decoration:line-through}
#story .quest li::before{content:'☐ ';color:#e8c77a}#story .quest li.done::before{content:'☑ '}
#story .quest ul{margin:0;padding:0}
#story .prompt{position:absolute;left:50%;bottom:120px;transform:translateX(-50%);background:#000a;border:1px solid #e8c77a66;padding:7px 14px;border-radius:6px;display:none;font-size:15px}
#story .prompt.show{display:block}
#story .prompt kbd{border:1px solid #e8c77a;border-radius:4px;padding:0 6px;margin-right:6px;color:#e8c77a;font-family:system-ui}
#story .dlg{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);width:min(760px,92vw);background:#1a120ee8;border:1px solid #e8c77a77;border-radius:10px;padding:14px 18px;display:none;pointer-events:auto}
#story .dlg.show{display:block}
#story .dlg .who{color:#e8c77a;font-size:13px;letter-spacing:.12em;text-transform:uppercase}
#story .dlg .txt{font-size:18px;margin:4px 0 10px;line-height:1.45}
#story .dlg button{display:block;width:100%;text-align:left;margin:5px 0;padding:8px 12px;border-radius:6px;border:1px solid #e8c77a44;background:#2e1f18;color:#f6ead2;font-size:15px}
#story .dlg button:hover,#story .dlg button:focus{background:#5a2a1e;outline:none}
#story .dlg button span{color:#e8c77a;margin-right:8px;font-family:system-ui}
#story .dlg .cont{text-align:right;width:auto;display:inline-block;float:right}
#story .toast{position:absolute;left:50%;top:70px;transform:translateX(-50%);background:#2a1712e6;border:1px solid #e8c77a88;color:#f3d892;padding:8px 16px;border-radius:8px;opacity:0;transition:opacity .4s, transform .4s;font-size:15px}
#story .toast.show{opacity:1;transform:translate(-50%,6px)}
#story .reward{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:#0008;pointer-events:auto}
#story .reward.show{display:flex}
#story .reward .card{width:min(560px,92vw);max-height:90vh;overflow:auto;background:#1a120ef0;border:1px solid #e8c77a99;border-radius:12px;padding:20px 24px;font-size:15px}
#story .reward h3{margin:0 0 4px;color:#f3d892;letter-spacing:.08em}
#story .reward table{width:100%;border-collapse:collapse;margin:8px 0}
#story .reward td{padding:3px 4px;border-bottom:1px solid #e8c77a22}
#story .reward td:last-child{text-align:right;color:#e8c77a}
#story .reward .meter{display:inline-block;height:6px;background:#e8c77a;border-radius:3px;vertical-align:middle;margin-right:6px}
#story .reward button{margin-top:12px;padding:9px 18px;border-radius:7px;border:1px solid #e8c77a88;background:#5a2a1e;color:#f6ead2}
#story .vignette{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 45%,#000c);opacity:0;transition:opacity 1s}
#story .vignette.show{opacity:1}
#story canvas.snow{position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity .8s}
#story canvas.snow.show{opacity:1}
#pauseBtn{position:fixed;top:16px;right:132px;z-index:31;pointer-events:auto;display:flex;align-items:center;gap:6px;padding:9px 12px;border-radius:7px;border:1px solid #e8c77a58;background:#23332cf5;color:#fff1d3;font:14px system-ui;cursor:pointer;box-shadow:0 4px 18px #172c2840}
#pauseBtn:hover{background:#3a4639}
body.story-cine #pauseBtn{top:calc(11vh + 12px);right:16px;background:#0008}
#story .pause{position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;background:#000a;pointer-events:auto;backdrop-filter:blur(3px)}
#story .pause.show{display:flex}
#story .pause h2{margin:0 0 18px;font-size:clamp(26px,4vw,44px);letter-spacing:.2em;color:#f3d892;font-weight:600}
#story .pause button{display:block;min-width:260px;margin:5px;padding:11px 20px;border-radius:8px;border:1px solid #e8c77a88;background:#2a1712cc;color:#f6ead2;font-size:16px}
#story .pause button:hover,#story .pause button:focus{background:#5a2a1ecc;outline:none}
#story .pause small{margin-top:14px;opacity:.7;font:13px system-ui}
@media(max-width:580px){#pauseBtn{top:10px;right:122px}}
body.story-start #pauseBtn{display:none}
body.story-cine #labels,body.story-start #labels,body.story-cine #settingsToggle,body.story-cine #status,body.story-cine #credit,body.story-cine #directions,body.story-start #status{display:none!important}
`;

let root,el={},subTimer,toastTimer,snowRAF;
const make=(tag,cls,parent,html='')=>{const e=document.createElement(tag);if(cls)e.className=cls;e.innerHTML=html;(parent||root).append(e);return e};

export function buildUI(){
 if(root)return;
 const style=document.createElement('style');style.textContent=CSS;document.head.append(style);
 root=document.createElement('div');root.id='story';document.body.append(root);
 el.snow=make('canvas','snow');
 el.vignette=make('div','vignette');
 el.top=make('div','bar top');el.bottom=make('div','bar bottom');
 el.sub=make('div','sub','',`<span class="who"></span><span class="txt"></span>`);
 el.title=make('div','title','',`<h1>HẬU CUNG CẨM LAN TRUYỆN</h1><hr><h2>Chương I — Nhất mộng nhập cung</h2>`);
 el.quest=make('div','quest');
 el.prompt=make('div','prompt');
 el.dlg=make('div','dlg');
 el.toast=make('div','toast');
 el.reward=make('div','reward');
 el.skip=make('button','skip','','Bỏ qua ▸▸');
 el.fade=make('div','fade');
 el.pause=make('div','pause','',`<h2>TẠM DỪNG</h2><button data-a="resume">▶ Tiếp tục</button><button data-a="restart">Chơi lại Chương I</button><button data-a="explore">Về chế độ tham quan</button><small>Nhấn P hoặc Esc để tiếp tục</small>`);
 el.pauseBtn=document.createElement('button');el.pauseBtn.id='pauseBtn';el.pauseBtn.type='button';el.pauseBtn.setAttribute('aria-label','Tạm dừng');document.body.append(el.pauseBtn);
 el.start=make('div','start','',`<h1>HẬU CUNG CẨM LAN TRUYỆN</h1><p>Sau những bức tường son cao vời vợi…</p>
  <button data-a="play">Chương I — Nhất mộng nhập cung</button><button data-a="explore">Tham quan Tử Cấm Thành</button>
  <small>Cinematic khoảng 4 phút, xen kẽ những đoạn tự điều khiển nhân vật · P để tạm dừng</small>`);
}

export function startScreen(onPlay,onExplore){
 el.start.classList.add('show');document.body.classList.add('story-start');
 el.start.onclick=e=>{const a=e.target.closest('button')?.dataset.a;if(!a)return;el.start.classList.remove('show');document.body.classList.remove('story-start');({play:onPlay,explore:onExplore})[a]?.()};
}
// Nút và màn hình tạm dừng. handlers: {toggle, action(name)}; options: các nút hiện theo ngữ cảnh.
export function pauseUI(handlers){
 el.pauseBtn.onclick=()=>handlers.toggle();
 el.pause.onclick=e=>{const a=e.target.closest('button')?.dataset.a;if(a)handlers.action(a)};
}
export function showPause(on,{cine=false,story=false}={}){
 el.pause.classList.toggle('show',on);
 el.pauseBtn.innerHTML=on?'<span aria-hidden="true">▶</span> Tiếp tục':'<span aria-hidden="true" style="letter-spacing:-2px">❚❚</span> Tạm dừng';
 el.pauseBtn.setAttribute('aria-pressed',String(on));
 el.pause.querySelector('[data-a=restart]').style.display=story?'block':'none';
 el.pause.querySelector('[data-a=explore]').style.display=story?'block':'none';
 if(on)el.pause.querySelector('[data-a=resume]').focus();
}
export function cinematic(on){root.classList.toggle('cine',on);document.body.classList.toggle('story-cine',on)}
export function onSkip(fn){el.skip.onclick=fn}
export function fade(opacity,seconds=1){el.fade.style.transition=`opacity ${seconds}s ease`;el.fade.style.opacity=opacity}
export function subtitle(who,text,kind='',hold=0){
 clearTimeout(subTimer);
 el.sub.className='sub show '+kind;
 el.sub.querySelector('.who').textContent=who||'';
 el.sub.querySelector('.txt').textContent=text;
 if(hold)subTimer=setTimeout(clearSubtitle,hold*1000);
}
export function clearSubtitle(){el.sub.classList.remove('show')}
export function titleCard(show){el.title.classList.toggle('show',show)}
export function vignette(show){el.vignette.classList.toggle('show',show)}
export function canvasFilter(css){renderer.domElement.style.filter=css||''}
export function snow(on){
 el.snow.classList.toggle('show',on);
 cancelAnimationFrame(snowRAF);
 if(!on)return;
 const c=el.snow,ctx=c.getContext('2d');c.width=innerWidth;c.height=innerHeight;
 const flakes=Array.from({length:180},()=>({x:Math.random()*c.width,y:Math.random()*c.height,r:1+Math.random()*2.5,v:30+Math.random()*60,s:Math.random()*6}));
 let last=performance.now();
 const step=t=>{const dt=Math.min(.05,(t-last)/1000);last=t;ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='rgba(255,255,255,.8)';
  for(const f of flakes){f.y+=f.v*dt;f.x+=Math.sin(t/900+f.s)*20*dt;if(f.y>c.height){f.y=-5;f.x=Math.random()*c.width}ctx.beginPath();ctx.arc(f.x,f.y,f.r,0,7);ctx.fill()}
  snowRAF=requestAnimationFrame(step)};
 snowRAF=requestAnimationFrame(step);
}
export function quest(title,items){
 if(!title){el.quest.classList.remove('show');return}
 el.quest.innerHTML=`<b>${title}</b><ul>${items.map(i=>`<li class="${i.state||''}">${i.text}</li>`).join('')}</ul>`;
 el.quest.classList.add('show');
}
export function prompt(text){if(!text){el.prompt.classList.remove('show');return}el.prompt.innerHTML=text;el.prompt.classList.add('show')}
export function toast(text,sec=2.6){el.toast.textContent=text;el.toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.toast.classList.remove('show'),sec*1000)}
let dlgKeys=null;
export function dialogue({who,text,choices,onChoose,onContinue}){
 el.dlg.innerHTML=`<div class="who">${who}</div><div class="txt">${text}</div>`;
 if(choices){choices.forEach((c,i)=>{const b=make('button','',el.dlg,`<span>${i+1}</span>${c}`);b.onclick=()=>pick(i)})}
 else{const b=make('button','cont',el.dlg,'Tiếp tục ▸');b.onclick=()=>cont()}
 el.dlg.classList.add('show');
 const close=()=>{el.dlg.classList.remove('show');removeEventListener('keydown',dlgKeys,true);dlgKeys=null};
 const pick=i=>{close();onChoose?.(i)};
 const cont=()=>{close();onContinue?.()};
 if(dlgKeys)removeEventListener('keydown',dlgKeys,true);
 dlgKeys=e=>{
  if(choices){const n=+e.key;if(n>=1&&n<=choices.length){e.preventDefault();e.stopPropagation();pick(n-1)}}
  else if(['Enter','Space','KeyF'].includes(e.code)){e.preventDefault();e.stopPropagation();cont()}
 };
 addEventListener('keydown',dlgKeys,true);
}
export const dialogueOpen=()=>el.dlg.classList.contains('show');
export function reward(html,onClose){
 el.reward.innerHTML=`<div class="card">${html}<button>Tiếp tục</button></div>`;
 el.reward.classList.add('show');
 el.reward.querySelector('button').onclick=()=>{el.reward.classList.remove('show');onClose?.()};
}

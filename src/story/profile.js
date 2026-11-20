// Hồ sơ nhân vật chính: thân phận, thuộc tính, quan hệ NPC, thông tin đã biết, hành trang và trang bị.
// Lưu vào localStorage; bảng xem mở bằng nút "Hành trang" hoặc phím I.

export const ITEMS={
 'tram-go':{name:'Trâm gỗ đào',icon:'🪵',slot:'head',desc:'Cây trâm gỗ đào mộc mạc mẫu thân cài cho trước ngày lên kinh.',bonus:{etiquette:1}},
 'hoa-cai':{name:'Hoa cài tóc lụa hồng',icon:'🌸',slot:'head',desc:'Đóa hoa lụa nhỏ, cài bên búi tóc. Không quá nổi bật để tránh chướng mắt các ma ma.',bonus:{beauty:1}},
 'tien-bao':{name:'Tiện bào xanh lơ',icon:'👘',slot:'body',desc:'Áo dài thường phục màu xanh lơ của tú nữ.',bonus:{}},
 'kham-khien':{name:'Khảm khiên viền hoa mai',icon:'🦺',slot:'vest',desc:'Áo gile xanh đậm, viền và thêu hoa mai hồng.',bonus:{beauty:1}},
 'hoa-bon-de':{name:'Giày hoa bồn để',icon:'👡',slot:'feet',desc:'Giày đế cao giữa lòng bàn chân, đi lại phải giữ dáng thẳng.',bonus:{etiquette:1}},
 'khan-tay':{name:'Khăn tay lụa hồng',icon:'🧣',slot:'acc',desc:'Khăn tay giắt ở cúc áo, dùng khi hành lễ vạn phúc.',bonus:{etiquette:1}},
 'tui-vai':{name:'Túi vải thêu hoa',icon:'👝',slot:'acc',desc:'Túi thơm nhỏ thêu hoa lan. Bên trong có ít hương liệu khô.',bonus:{cunning:1}},
 'bac-vun':{name:'Bạc vụn',icon:'🪙',stack:true,desc:'Bạc vụn mang theo phòng thân. Trong cung, đôi khi một chút bạc mở được nhiều cánh cửa.'},
 'banh-que':{name:'Bánh hoa quế',icon:'🥮',stack:true,use:{health:1},desc:'Bánh hoa quế gói trong giấy dầu. Dùng để hồi chút sức lực (Sức khỏe +1).'},
 'kim-chi':{name:'Kim chỉ thêu',icon:'🪡',desc:'Bộ kim chỉ nhỏ. Tú nữ khéo tay thường được để mắt tới.'},
 'theu-mau-don':{name:'Khăn lụa thêu mẫu đơn',icon:'🌺',desc:'Thành phẩm bài học thêu. Có thể làm quà tặng.',gift:true},
 'tram-ngoc':{name:'Trâm ngọc bích',icon:'💚',slot:'head',desc:'Cây trâm ngọc nhặt được trong đống lá ở sân sau. Không rõ chủ nhân.',bonus:{beauty:2}},
 'thu-nha':{name:'Thư nhà',icon:'✉️',quest:true,desc:'Lá thư mẫu thân gửi theo: “Vào cung rồi, nói ít một câu, nhìn thêm một chút.”'},
};
export const SLOTS=[['head','Đầu'],['body','Y phục'],['vest','Áo khoác'],['feet','Giày'],['acc','Phụ kiện'],['acc2','Phụ kiện']];
export const STATS=[['beauty','Dung mạo'],['wit','Tài trí'],['etiquette','Lễ nghi'],['cunning','Tâm kế'],['health','Sức khỏe'],['stamina','Thể lực'],['dexterity','Khéo léo'],['needle','Nữ công'],['knowledge','Kiến thức'],['memory','Trí nhớ'],['diligence','Chăm chỉ'],['caution','Cẩn trọng']];

const KEY='camlan.profile';
function fresh(){return{
 name:'Ô Nhã Cẩm Lan',age:17,identity:'Tú nữ ứng tuyển',systems:false,
 base:{beauty:5,wit:7,etiquette:2,cunning:4,health:8,stamina:6,dexterity:3,needle:2,knowledge:4,memory:5,diligence:3,caution:3},
 relations:{tu:{name:'Thẩm Tú Nhi',v:10,note:'Bạn cùng xe, gọi Cẩm Lan là tỷ tỷ'},mama:{name:'Tôn ma ma',v:0,note:'Ma ma dẫn đoàn tú nữ, nghiêm khắc'},tran:{name:'Lý Ngọc Trân',v:0,note:'Tú nữ cùng xe, ít nói'}},
 knowledge:[],
 bag:[['hoa-cai',1],['tui-vai',1],['bac-vun',5],['banh-que',2],['kim-chi',1],['thu-nha',1]],
 personality:{},
 equipped:{head:'tram-go',body:'tien-bao',vest:'kham-khien',feet:'hoa-bon-de',acc:'khan-tay',acc2:null},
}}
export let profile=load();
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.base){const f=fresh();s.base={...f.base,...s.base};s.personality=s.personality||{};return s}}catch{}return fresh()}
export function saveProfile(){try{localStorage.setItem(KEY,JSON.stringify(profile))}catch{}}
export function resetProfile(){profile=fresh();saveProfile();render()}
export function stat(k){
 let v=profile.base[k]||0;
 for(const id of Object.values(profile.equipped))if(id&&ITEMS[id].bonus?.[k])v+=ITEMS[id].bonus[k];
 return v;
}
export function addRelation(k,d){const r=profile.relations[k];if(r){r.v=Math.max(-50,Math.min(100,r.v+d));saveProfile();render()}}
export function learn(text){if(!profile.knowledge.includes(text)){profile.knowledge.push(text);saveProfile();render()}}
export function addStat(k,d){profile.base[k]=Math.max(0,Math.min(10,(profile.base[k]||0)+d));saveProfile();render()}
export function addItem(id,n=1){addBag(id,n);saveProfile();render()}
export function addTrait(k,n=1){profile.personality[k]=(profile.personality[k]||0)+n;saveProfile();render()}
export function unlockSystems(){profile.systems=true;saveProfile();render()}
const relLabel=v=>v>=30?'Thân thiết':v>=10?'Thiện cảm':v>0?'Quen biết':v===0?'Xa lạ':v>-10?'Không hài lòng':'Ác cảm';

// ---------- Giao diện ----------
const CSS=`
#profileBtn{position:fixed;top:16px;right:258px;z-index:31;display:flex;align-items:center;gap:6px;padding:9px 12px;border-radius:7px;border:1px solid #e8c77a58;background:#23332cf5;color:#fff1d3;font:14px system-ui;cursor:pointer;box-shadow:0 4px 18px #172c2840}
#profileBtn:hover{background:#3a4639}
body.story-cine #profileBtn,body.story-start #profileBtn{display:none}
@media(max-width:580px){#profileBtn{top:10px;right:234px}}
#profile{position:fixed;inset:0;z-index:40;display:none;align-items:center;justify-content:center;background:#000a;font-family:"Noto Serif","Times New Roman",serif;color:#f6ead2}
#profile.show{display:flex}
#profile .card{width:min(860px,96vw);max-height:92vh;overflow:auto;background:#1a120ef2;border:1px solid #e8c77a88;border-radius:12px;box-shadow:0 10px 40px #000a}
#profile header{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #e8c77a33}
#profile header .tabs{display:flex;gap:6px;flex:1}
#profile button{font:inherit;cursor:pointer;color:#f6ead2}
#profile .tab{background:#2e1f18;border:1px solid #e8c77a44;border-radius:7px;padding:7px 14px}
#profile .tab[aria-selected=true]{background:#5a2a1e;border-color:#e8c77a}
#profile .x{background:none;border:0;font-size:22px;line-height:1}
#profile .body{padding:16px}
#profile .who{display:flex;gap:16px;align-items:center;margin-bottom:12px}
#profile .ava{width:88px;height:110px;border-radius:44px/55px;background:#ebbca6 center/cover;border:2px solid #e8c77a;flex:none}
#profile h3{margin:0;color:#f3d892;letter-spacing:.06em}
#profile .muted{opacity:.7;font-size:14px}
#profile .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media(max-width:640px){#profile .grid2{grid-template-columns:1fr}}
#profile section{background:#24170f;border:1px solid #e8c77a26;border-radius:9px;padding:10px 12px}
#profile section h4{margin:0 0 8px;color:#e8c77a;font-weight:600;letter-spacing:.05em;font-size:15px}
#profile .row{display:flex;align-items:center;gap:8px;margin:5px 0;font-size:14px}
#profile .row span:first-child{width:78px;flex:none}
#profile .bar{flex:1;height:7px;background:#ffffff14;border-radius:4px;overflow:hidden}
#profile .bar i{display:block;height:100%;background:linear-gradient(90deg,#c9963a,#f3d892)}
#profile .row b{width:34px;text-align:right;color:#f3d892;font-weight:600}
#profile .row em{color:#9fd49a;font-style:normal;font-size:12px;width:26px}
#profile .lock{opacity:.6;font-style:italic;font-size:14px;padding:6px 0}
#profile .slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
#profile .bag{display:grid;grid-template-columns:repeat(auto-fill,minmax(64px,1fr));gap:8px}
#profile .cell{position:relative;aspect-ratio:1;background:#2e1f18;border:1px solid #e8c77a33;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:26px;padding:2px}
#profile .cell small{font-size:10px;opacity:.65;font-family:system-ui;text-align:center;line-height:1.1}
#profile .cell .n{position:absolute;right:4px;bottom:2px;font-size:12px;font-family:system-ui;color:#f3d892}
#profile .cell.sel{border-color:#f3d892;box-shadow:0 0 0 2px #f3d89255 inset}
#profile .cell.empty{opacity:.45;font-size:13px}
#profile .detail{margin-top:12px;min-height:74px}
#profile .detail .acts{margin-top:8px;display:flex;gap:8px}
#profile .detail .acts button{background:#5a2a1e;border:1px solid #e8c77a88;border-radius:6px;padding:6px 14px;font-size:14px}
#profile ul{margin:0;padding-left:18px;font-size:14px}
#profile .hint{margin-top:10px;font:12px system-ui;opacity:.6;text-align:right}
`;
let root,btn,tab='char',sel=null,onToggle=null;
export const profileOpen=()=>!!root&&root.classList.contains('show');
export function buildProfileUI(toggle){
 if(root)return;onToggle=toggle;
 const st=document.createElement('style');st.textContent=CSS;document.head.append(st);
 btn=document.createElement('button');btn.id='profileBtn';btn.type='button';btn.innerHTML='<span aria-hidden="true">🎒</span> Hành trang';btn.onclick=()=>showProfile(!profileOpen());document.body.append(btn);
 root=document.createElement('div');root.id='profile';root.setAttribute('role','dialog');root.setAttribute('aria-label','Nhân vật và hành trang');document.body.append(root);
 root.addEventListener('click',e=>{
  if(e.target===root){showProfile(false);return}
  const t=e.target.closest('[data-tab],[data-sel],[data-act],.x');if(!t)return;
  if(t.classList.contains('x'))return showProfile(false);
  if(t.dataset.tab){tab=t.dataset.tab;sel=null;render()}
  if(t.dataset.sel){sel=t.dataset.sel;render()}
  if(t.dataset.act)act(t.dataset.act);
 });
}
export function showProfile(on){
 if(!root)return;
 if(on===profileOpen())return;
 root.classList.toggle('show',on);if(on){sel=null;render()}
 onToggle?.(on);
}
function act(a){
 if(!sel)return;
 const [where,key]=sel.split(':');
 if(a==='unequip'){const id=profile.equipped[key];if(!id)return;profile.equipped[key]=null;addBag(id,1);sel=null}
 if(a==='equip'){
  const i=+key,[id]=profile.bag[i],it=ITEMS[id];
  let slot=it.slot;if(slot==='acc'&&profile.equipped.acc&&!profile.equipped.acc2)slot='acc2';
  takeBag(i,1);const old=profile.equipped[slot];profile.equipped[slot]=id;if(old)addBag(old,1);sel='slot:'+slot;
 }
 if(a==='use'){
  const i=+key,[id]=profile.bag[i],it=ITEMS[id];
  for(const [k,v] of Object.entries(it.use||{}))profile.base[k]=Math.min(10,(profile.base[k]||0)+v);
  takeBag(i,1);sel=profile.bag[i]&&profile.bag[i][0]===id?sel:null;
 }
 saveProfile();render();
}
function addBag(id,n){const e=profile.bag.find(b=>b[0]===id);if(e&&ITEMS[id].stack)e[1]+=n;else profile.bag.push([id,n])}
function takeBag(i,n){profile.bag[i][1]-=n;if(profile.bag[i][1]<=0)profile.bag.splice(i,1)}

function render(){
 if(!root||!profileOpen())return;
 const P=profile;
 const tabs=`<div class="tabs" role="tablist"><button class="tab" role="tab" data-tab="char" aria-selected="${tab==='char'}">Nhân vật</button><button class="tab" role="tab" data-tab="bag" aria-selected="${tab==='bag'}">Hành trang</button></div>`;
 let body='';
 if(tab==='char'){
  const bonus=k=>stat(k)-(P.base[k]||0);
  const stats=STATS.map(([k,n])=>`<div class="row"><span>${n}</span><span class="bar"><i style="width:${stat(k)*10}%"></i></span><b>${stat(k)}</b><em>${bonus(k)?'+'+bonus(k):''}</em></div>`).join('');
  const rel=Object.values(P.relations).map(r=>`<div class="row"><span>${r.name.split(' ').slice(-2).join(' ')}</span><span class="bar"><i style="width:${Math.max(0,r.v)}%"></i></span><b>${r.v}</b></div><div class="muted" style="margin:-2px 0 6px">${relLabel(r.v)} · ${r.note}</div>`).join('');
  const locked='<div class="lock">🔒 Mở khóa sau nhiệm vụ “Bước đầu nhập cung”.</div>';
  body=`<div class="who"><div class="ava" style="background-image:url(${import.meta.env.BASE_URL}textures/hero-face.png)"></div><div><h3>${P.name}</h3><div>${P.age} tuổi · ${P.systems?P.identity:'Tú nữ (chưa nhập danh sách)'}</div><div class="muted">Linh hồn của một cô gái hiện đại trong thân xác thiếu nữ thời Càn Long.</div></div></div>
  <div class="grid2"><section><h4>Thuộc tính</h4>${P.systems?stats:locked}</section><section><h4>Quan hệ</h4>${P.systems?rel:locked}</section></div>
  <section style="margin-top:16px"><h4>Thông tin đã biết</h4>${P.knowledge.length?'<ul>'+P.knowledge.map(k=>`<li>${k}</li>`).join('')+'</ul>':'<div class="muted">Chưa có. Hãy trò chuyện với mọi người trong cung.</div>'}</section>`;
 }else{
  const slots=SLOTS.map(([k,n])=>{const id=P.equipped[k],it=id&&ITEMS[id];
   return it?`<button class="cell ${sel==='slot:'+k?'sel':''}" data-sel="slot:${k}" title="${it.name}">${it.icon}<small>${n}</small></button>`:`<button class="cell empty" data-sel="slot:${k}">${n}</button>`}).join('');
  const bag=P.bag.map(([id,n],i)=>{const it=ITEMS[id];return `<button class="cell ${sel==='bag:'+i?'sel':''}" data-sel="bag:${i}" title="${it.name}">${it.icon}${n>1?`<span class="n">${n}</span>`:''}</button>`}).join('')+Array.from({length:Math.max(0,12-P.bag.length)},()=>'<div class="cell empty"></div>').join('');
  let detail='<div class="muted">Chọn một món để xem.</div>';
  if(sel){
   const [w,k]=sel.split(':'),id=w==='slot'?P.equipped[k]:P.bag[+k]?.[0],it=id&&ITEMS[id];
   if(it){
    const b=Object.entries(it.bonus||{}).map(([s,v])=>`${STATS.find(x=>x[0]===s)[1]} +${v}`).join(', ');
    const acts=w==='slot'?'<button data-act="unequip">Tháo ra</button>':it.slot?'<button data-act="equip">Trang bị</button>':it.use?'<button data-act="use">Dùng</button>':'';
    detail=`<b style="color:#f3d892">${it.icon} ${it.name}</b>${it.quest?' <span class="muted">· Vật phẩm cốt truyện</span>':''}<div style="margin-top:4px;font-size:14px">${it.desc}</div>${b?`<div class="muted" style="margin-top:4px">Hiệu quả khi trang bị: ${b}</div>`:''}<div class="acts">${acts}</div>`;
   }else detail='<div class="muted">Ô trống.</div>';
  }
  body=`<div class="grid2"><section><h4>Trang bị</h4><div class="slots">${slots}</div></section><section><h4>Balo</h4><div class="bag">${bag}</div></section></div><section class="detail">${detail}</section>`;
 }
 root.innerHTML=`<div class="card"><header>${tabs}<button class="x" aria-label="Đóng">×</button></header><div class="body">${body}<div class="hint">I: mở/đóng · Esc: đóng</div></div></div>`;
}

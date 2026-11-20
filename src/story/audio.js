// Âm thanh tổng hợp bằng Web Audio (không cần file): vó ngựa, bánh xe, gió, chim, tim đập, bản lề cổng,
// rèm vải, và nhạc nền cổ phong (đàn cổ cầm gảy theo âm giai ngũ cung, tiêu trúc, trống trầm).
let ctx,master,musicGain,sfxGain,noiseBuf;
const loops={};

export function initAudio(){
 if(ctx)return ctx.resume();
 const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
 ctx=new AC();
 master=ctx.createGain();master.gain.value=.8;master.connect(ctx.destination);
 musicGain=ctx.createGain();musicGain.gain.value=.55;musicGain.connect(master);
 sfxGain=ctx.createGain();sfxGain.gain.value=.9;sfxGain.connect(master);
 noiseBuf=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);
 const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
}
const now=()=>ctx.currentTime;
function noise(){const s=ctx.createBufferSource();s.buffer=noiseBuf;s.loop=true;return s}
function env(g,t,a,peak,dec){g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec)}

export function suspendAudio(on){if(!ctx)return;on?ctx.suspend():ctx.resume()}
export function setMaster(v){if(master)master.gain.setTargetAtTime(v,now(),.3)}
export function setMusic(v,tc=.6){if(musicGain)musicGain.gain.setTargetAtTime(v,now(),tc)}

// Tiếng vó ngựa (lộc cộc) và tiếng bánh xe lăn.
function hoof(t,vol,stone){
 const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();
 f.type='bandpass';f.frequency.value=stone?1400:600;f.Q.value=stone?6:3;
 s.connect(f);f.connect(g);g.connect(sfxGain);env(g,t,.002,vol,stone?.06:.09);s.start(t);s.stop(t+.15);
 const o=ctx.createOscillator(),og=ctx.createGain();o.frequency.setValueAtTime(stone?220:140,t);o.frequency.exponentialRampToValueAtTime(60,t+.08);
 o.connect(og);og.connect(sfxGain);env(og,t,.002,vol*.6,.08);o.start(t);o.stop(t+.12);
}
export function startTravel(){
 if(!ctx||loops.travel)return;
 const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='lowpass';f.frequency.value=180;g.gain.value=.0;
 s.connect(f);f.connect(g);g.connect(sfxGain);s.start();
 loops.travel={s,g,f,next:now(),speed:0,stone:false,vol:0};
}
export function setTravel(speed,{vol=1,stone=false}={}){
 const L=loops.travel;if(!L)return;
 L.speed=speed;L.stone=stone;L.vol=vol;
 L.g.gain.setTargetAtTime(Math.min(1,speed/3)*.22*vol,now(),.4);
 L.f.frequency.setTargetAtTime(stone?320:180,now(),.4);
}
export function stopTravel(){const L=loops.travel;if(!L)return;L.g.gain.setTargetAtTime(0,now(),.3);setTimeout(()=>{try{L.s.stop()}catch{}},1500);delete loops.travel}

// Gió và chim buổi sớm.
export function startAmbience(){
 if(!ctx||loops.wind)return;
 const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain(),lfo=ctx.createOscillator(),lg=ctx.createGain();
 f.type='bandpass';f.frequency.value=500;f.Q.value=.6;g.gain.value=.05;
 lfo.frequency.value=.13;lg.gain.value=300;lfo.connect(lg);lg.connect(f.frequency);lfo.start();
 s.connect(f);f.connect(g);g.connect(sfxGain);s.start();
 loops.wind={s,g,lfo,birds:true,nextBird:now()+1};
}
export function setAmbience(wind=.05,birds=true){const L=loops.wind;if(!L)return;L.g.gain.setTargetAtTime(wind,now(),.8);L.birds=birds}
function chirp(t){
 const n=2+Math.floor(Math.random()*4),base=2400+Math.random()*1800;
 for(let i=0;i<n;i++){
  const o=ctx.createOscillator(),g=ctx.createGain(),s=t+i*(.07+Math.random()*.05);
  o.type='sine';o.frequency.setValueAtTime(base,s);o.frequency.exponentialRampToValueAtTime(base*(1.3+Math.random()*.5),s+.05);
  o.connect(g);g.connect(sfxGain);env(g,s,.005,.035,.06);o.start(s);o.stop(s+.1);
 }
}

// Hiệu ứng đơn.
export function sfx(name){
 if(!ctx)return;const t=now();
 if(name==='curtain'){const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='highpass';f.frequency.value=2500;s.connect(f);f.connect(g);g.connect(sfxGain);env(g,t,.08,.12,.5);s.start(t);s.stop(t+.7)}
 if(name==='step'){const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='lowpass';f.frequency.value=900;s.connect(f);f.connect(g);g.connect(sfxGain);env(g,t,.003,.15,.08);s.start(t);s.stop(t+.12)}
 if(name==='brush'){const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='bandpass';f.frequency.value=3200;s.connect(f);f.connect(g);g.connect(sfxGain);env(g,t,.05,.05,.35);s.start(t);s.stop(t+.5)}
 if(name==='creak'){
  // Bản lề cổng gỗ: tiếng cót két kéo dài.
  const o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type='sawtooth';
  o.frequency.setValueAtTime(70,t);for(let i=0;i<14;i++)o.frequency.linearRampToValueAtTime(60+Math.random()*90,t+.25+i*.25);
  f.type='bandpass';f.frequency.value=700;f.Q.value=9;o.connect(f);f.connect(g);g.connect(sfxGain);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.25,t+.3);g.gain.linearRampToValueAtTime(.18,t+3);g.gain.linearRampToValueAtTime(0,t+3.8);o.start(t);o.stop(t+4);
 }
 if(name==='thud'){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(40,t+.4);o.connect(g);g.connect(sfxGain);env(g,t,.005,.7,.6);o.start(t);o.stop(t+.8)}
 if(name==='heart'){for(const d of [0,.22]){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(70,t+d);o.frequency.exponentialRampToValueAtTime(38,t+d+.15);o.connect(g);g.connect(sfxGain);env(g,t+d,.008,d?.35:.5,.18);o.start(t+d);o.stop(t+d+.3)}}
 if(name==='flutter'){for(let i=0;i<18;i++){const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain(),tt=t+i*.05+Math.random()*.03;f.type='bandpass';f.frequency.value=1200+Math.random()*900;s.connect(f);f.connect(g);g.connect(sfxGain);env(g,tt,.005,.06,.04);s.start(tt);s.stop(tt+.08)}}
 if(name==='cup'){[2600,3400].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(sfxGain);env(g,t+i*.05,.002,.08,.4);o.start(t+i*.05);o.stop(t+.6)})}
 if(name==='break'){for(let i=0;i<7;i++){const o=ctx.createOscillator(),g=ctx.createGain(),tt=t+i*.03+Math.random()*.03;o.type='triangle';o.frequency.value=2200+Math.random()*3000;o.connect(g);g.connect(sfxGain);env(g,tt,.001,.09,.18);o.start(tt);o.stop(tt+.25)}const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='highpass';f.frequency.value=3000;s.connect(f);f.connect(g);g.connect(sfxGain);env(g,t,.002,.2,.3);s.start(t);s.stop(t+.4)}
 if(name==='splash'){const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='bandpass';f.frequency.value=900;f.Q.value=1.5;s.connect(f);f.connect(g);g.connect(sfxGain);env(g,t,.02,.18,.45);s.start(t);s.stop(t+.6)}
 if(name==='sweep'){const s=noise(),f=ctx.createBiquadFilter(),g=ctx.createGain();f.type='bandpass';f.frequency.value=2200;f.Q.value=.7;s.connect(f);f.connect(g);g.connect(sfxGain);env(g,t,.06,.07,.25);s.start(t);s.stop(t+.4)}
 if(name==='good'){[784,1047].forEach((f,i)=>pluck(f,t+i*.07,.12,.8))}
 if(name==='miss'){const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.setValueAtTime(220,t);o.frequency.exponentialRampToValueAtTime(140,t+.2);o.connect(g);g.connect(sfxGain);env(g,t,.005,.05,.22);o.start(t);o.stop(t+.3)}
 if(name==='bell'){for(const [f,a] of [[196,.5],[392,.18],[587,.08]]){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f;o.connect(g);g.connect(sfxGain);env(g,t,.01,a,6);o.start(t);o.stop(t+6.5)}}
 if(name==='ui'){const o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.value=880;o.connect(g);g.connect(sfxGain);env(g,t,.005,.08,.25);o.start(t);o.stop(t+.3)}
 if(name==='quest'){[523,659,784,1047].forEach((f,i)=>pluck(f,t+i*.12,.16))}
}
export function heartbeat(on,rate=1.1){
 if(loops.heart){clearInterval(loops.heart);delete loops.heart}
 if(on&&ctx){sfx('heart');loops.heart=setInterval(()=>sfx('heart'),1000/rate)}
}

// ---------- Nhạc cổ phong ----------
// Cổ cầm: dây gảy (Karplus–Strong rút gọn bằng bộ lọc), âm giai ngũ cung D (D E F# A B).
function pluck(freq,t,vol=.2,len=2.4){
 const o=ctx.createOscillator(),o2=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();
 o.type='triangle';o2.type='sawtooth';o.frequency.value=freq;o2.frequency.value=freq*1.003;
 f.type='lowpass';f.frequency.setValueAtTime(freq*6,t);f.frequency.exponentialRampToValueAtTime(freq*1.2,t+len*.6);
 const g2=ctx.createGain();g2.gain.value=.25;
 o.connect(f);o2.connect(g2);g2.connect(f);f.connect(g);g.connect(musicGain);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.004);g.gain.exponentialRampToValueAtTime(.0008,t+len);
 // Luyến láy: trượt cao độ nhẹ sau khi gảy.
 if(Math.random()<.3){o.frequency.setValueAtTime(freq,t+.25);o.frequency.linearRampToValueAtTime(freq*1.06,t+.55);o.frequency.linearRampToValueAtTime(freq,t+.9)}
 o.start(t);o2.start(t);o.stop(t+len);o2.stop(t+len);
}
function flute(freq,t,dur,vol=.05){
 const o=ctx.createOscillator(),g=ctx.createGain(),v=ctx.createOscillator(),vg=ctx.createGain(),s=noise(),nf=ctx.createBiquadFilter(),ng=ctx.createGain();
 o.type='sine';o.frequency.value=freq;v.frequency.value=5.2;vg.gain.value=freq*.008;v.connect(vg);vg.connect(o.frequency);
 nf.type='bandpass';nf.frequency.value=freq*2;nf.Q.value=4;s.connect(nf);nf.connect(ng);ng.connect(musicGain);
 o.connect(g);g.connect(musicGain);
 for(const [gg,peak] of [[g,vol],[ng,vol*.25]]){gg.gain.setValueAtTime(0,t);gg.gain.linearRampToValueAtTime(peak,t+.25);gg.gain.setValueAtTime(peak,t+dur-.3);gg.gain.linearRampToValueAtTime(0,t+dur)}
 o.start(t);v.start(t);s.start(t);o.stop(t+dur);v.stop(t+dur);s.stop(t+dur);
}
function drum(t,vol=.5){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.setValueAtTime(110,t);o.frequency.exponentialRampToValueAtTime(42,t+.35);o.connect(g);g.connect(musicGain);env(g,t,.004,vol,.9);o.start(t);o.stop(t+1)}

const SCALE=[146.83,164.81,185,220,246.94,293.66,329.63,369.99,440,493.88,587.33];
let music=null;
export function playMusic(mood='calm'){
 if(!ctx)return;
 stopMusic(false);
 music={mood,next:now()+.2,bar:0};
 setMusic(.55,.5);
}
export function stopMusic(fade=true){if(!music)return;music=null;if(fade&&musicGain)setMusic(0,.25)}

// Bộ lập lịch: gọi mỗi khung hình để xếp nốt trước ~0,5 s.
export function tickAudio(){
 if(!ctx)return;
 const t=now();
 const L=loops.travel;
 if(L&&L.speed>.2){
  const gap=.62/Math.min(2.2,Math.max(.5,L.speed/2.4));
  while(L.next<t+.3){
   if(L.next>t-.05){const v=.08*L.vol*Math.min(1,L.speed/2);hoof(L.next,v,L.stone);hoof(L.next+gap*.22,v*.7,L.stone)}
   L.next+=gap;
  }
 }else if(L)L.next=t;
 const W=loops.wind;
 if(W&&W.birds&&t>W.nextBird){chirp(t+.05);W.nextBird=t+1.5+Math.random()*4}
 if(music){
  while(music.next<t+.5){
   const b=music.bar++,beat=music.next,m=music.mood;
   if(m==='calm'||m==='title'){
    const phrase=[5,4,3,2,3,1,2,0,2,3,4,3,5,7,6,5][b%16];
    pluck(SCALE[phrase],beat,.17,3);
    if(b%2===0)pluck(SCALE[phrase]/2,beat+.02,.1,3.5);
    if(m==='title'&&b%4===0)drum(beat,.45);
    if(b%8===4)flute(SCALE[[7,8,6,5][(b/8|0)%4]]*2,beat,2.6,.035);
    music.next+=m==='title'?.62:.8;
   }else if(m==='tense'){
    if(b%2===0)drum(beat,.35);
    pluck(SCALE[[0,3,1,4,0,3,2,1][b%8]],beat,.12,2.2);
    music.next+=.75;
   }else if(m==='resolve'){
    pluck(SCALE[[2,4,5,7,9,7,5,4][b%8]],beat,.16,3);
    if(b%4===0){drum(beat,.4);flute(SCALE[[5,7,8,9][(b/4|0)%4]]*2,beat,2.8,.04)}
    music.next+=.7;
   }else music.next+=1;
  }
 }
}
export function finalNote(){if(!ctx)return;const t=now();pluck(73.42,t,.35,5);drum(t,.5)}

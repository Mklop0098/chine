// Ánh sáng theo giờ và lượng giáng thủy theo lịch Bắc Kinh.
// Chuyển cảnh mượt bằng cách nội suy dần các tham số; mưa/tuyết là hạt vẽ bằng shader quanh camera.
import * as THREE from 'three';
import {camera,hemi,renderer,scene,sun} from '../core/scene.js';
import {refreshEnv} from '../core/sky.js';
import {SKY,WX} from './uniforms.js';
import {calendarAt,gameTime,MINUTE,seekGameTime} from './calendar.js';

const PHASES = {
  day:   { name: 'Sáng', sun: 2.45, sunColor: '#ffeacc', hemi: .40, exposure: .92, haze: [.79, .82, .82], cloud: .68, warm: 0, night: 0, position: [-510, 680, 450] },
  dawn:  { name: 'Bình minh', sun: 1.6, sunColor: '#ffd0a3', hemi: .42, exposure: .96, haze: [.85, .75, .70], cloud: .52, warm: .65, night: 0, position: [880, 190, 260] },
  dusk:  { name: 'Hoàng hôn', sun: 2, sunColor: '#ffad6b', hemi: .30, exposure: .98, haze: [.92, .74, .60], cloud: .42, warm: 1, night: 0, position: [-880, 190, 260] },
  night: { name: 'Tối', sun: .24, sunColor: '#aec8ff', hemi: .20, exposure: .78, haze: [.009, .017, .038], cloud: .32, warm: 0, night: 1, position: [-510, 680, 450] },
};
const WEATHER = {
  clear: { name: 'Khô ráo', sun: 1, fog: [420, 1900], cloud: 0, dark: .04, tint: 1 },
  rain: { name: 'Mưa', sun: .23, fog: [110, 820], cloud: 1, dark: .78, tint: .65 },
  snow: { name: 'Tuyết', sun: .48, fog: [90, 720], cloud: .96, dark: .42, tint: .85 },
};
const day = PHASES.day;
const cur = { ...day, fogNear: 420, fogFar: 1900, haze: new THREE.Vector3(...day.haze), sunColor: new THREE.Color(day.sunColor), dark: .04, tint: 1, rain: 0, snowfall: 0 };
let target, state, controls, lastMinute, weatherMode = 'auto', currentWeather;
let envTimer = 0, envDirty = false, time = 0;
let rain, snow;

const PARTICLE_VS_HEAD = `#include <common>\n#include <logdepthbuf_pars_vertex>\n`;
const PARTICLE_FS_HEAD = `#include <common>\n#include <logdepthbuf_pars_fragment>\n`;

function makeRain(count = 9000) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 2 * 3), end = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const x = Math.random(), y = Math.random(), z = Math.random();
    pos.set([x, y, z, x, y, z], i * 6); end[i * 2 + 1] = 1;
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uSize: { value: new THREE.Vector3(90, 50, 90) }, uAmount: { value: 0 } },
    vertexShader: PARTICLE_VS_HEAD + `attribute float aEnd;uniform float uTime;uniform vec3 uCenter,uSize;varying float vA;
      void main(){
        vec3 p=position*uSize;
        p.y=mod(p.y-uTime*22.,uSize.y);
        p.x=mod(p.x+uTime*2.2,uSize.x);
        vec3 w=uCenter-vec3(uSize.x*.5,uSize.y*.35,uSize.z*.5)+p;
        w+=vec3(.09,.85,0.)*aEnd;
        vA=1.-aEnd*.6;
        gl_Position=projectionMatrix*viewMatrix*vec4(w,1.);
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: PARTICLE_FS_HEAD + `uniform float uAmount;varying float vA;
      void main(){
        #include <logdepthbuf_fragment>
        gl_FragColor=vec4(.78,.82,.88,.32*uAmount*vA);
      }`,
  });
  const l = new THREE.LineSegments(g, m);
  l.frustumCulled = false; l.renderOrder = 5; l.visible = false;
  scene.add(l);
  return l;
}

function makeSnow(count = 7000) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), seed = new Float32Array(count);
  for (let i = 0; i < count; i++) { pos.set([Math.random(), Math.random(), Math.random()], i * 3); seed[i] = Math.random() * 6.283; }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false,
    uniforms: { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uSize: { value: new THREE.Vector3(80, 45, 80) }, uAmount: { value: 0 }, uScale: { value: 400 } },
    vertexShader: PARTICLE_VS_HEAD + `attribute float aSeed;uniform float uTime,uScale;uniform vec3 uCenter,uSize;
      void main(){
        vec3 p=position*uSize;
        p.y=mod(p.y-uTime*(1.1+fract(aSeed)*.8),uSize.y);
        p.x=mod(p.x+sin(uTime*.7+aSeed)*1.4+uTime*.5,uSize.x);
        p.z=mod(p.z+cos(uTime*.53+aSeed*1.3)*1.2,uSize.z);
        vec3 w=uCenter-vec3(uSize.x*.5,uSize.y*.35,uSize.z*.5)+p;
        vec4 mv=viewMatrix*vec4(w,1.);
        gl_Position=projectionMatrix*mv;
        gl_PointSize=uScale*(.05+fract(aSeed*3.7)*.05)/-mv.z;
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: PARTICLE_FS_HEAD + `uniform float uAmount;
      void main(){
        #include <logdepthbuf_fragment>
        float d=length(gl_PointCoord-.5);
        gl_FragColor=vec4(1.,1.,1.,smoothstep(.5,.15,d)*.9*uAmount);
      }`,
  });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false; p.renderOrder = 5; p.visible = false;
  scene.add(p);
  return p;
}

export function setWeather(next, instant = false) {
  const allowed = calendarAt(gameTime()).snowy ? 'snow' : 'rain';
  if (!['auto','clear',allowed].includes(next)) return false;
  syncCalendar();
  weatherMode = next;
  syncCalendar(true);
  if (instant) updateWeather(0, true);
  return true;
}

function syncCalendar(force = false) {
  const timestamp = gameTime();
  const minute = Math.floor(timestamp / MINUTE);
  if (!force && minute === lastMinute) return;
  lastMinute = minute;
  const next = calendarAt(timestamp);
  if (!state || next.snowy !== state.snowy) {
    const wet = next.snowy ? 'snow' : 'rain';
    controls.weather.innerHTML = '<option value="auto">Theo lịch tự động</option>'
      + `<option value="clear">${WEATHER.clear.name}</option><option value="${wet}">${WEATHER[wet].name}</option>`;
    if (state) {
      weatherMode = 'auto';
      if (next.snowy) { cur.rain = 0; WX.wet.value = 0; }
      else { cur.snowfall = 0; WX.snow.value = 0; }
    }
  }
  const selectedWeather = weatherMode === 'auto' ? next.weather : weatherMode;
  const phase = PHASES[next.phase];
  if (!state || next.phase !== state.phase) {
    sun.position.set(...phase.position);
    SKY.sunDir.value.copy(sun.position).normalize();
    renderer.shadowMap.needsUpdate = true;
  }
  if (!state || next.phase !== state.phase || selectedWeather !== currentWeather) {
    const weather = WEATHER[selectedWeather];
    target = {
      ...phase, sun: phase.sun * weather.sun, fog: weather.fog,
      cloud: weather.cloud || phase.cloud, dark: weather.dark, tint: weather.tint,
      rain: Number(selectedWeather === 'rain'), snow: Number(selectedWeather === 'snow'),
    };
    envDirty = true;
  }
  state = next;
  currentWeather = selectedWeather;
  controls.phase.value = next.phase;
  if (document.activeElement !== controls.date) controls.date.value = next.date;
  if (document.activeElement !== controls.minute) controls.minute.value = next.minute;
  controls.weather.value = weatherMode;
  const hours = String(Math.floor(next.minute / 60)).padStart(2,'0');
  const minutes = String(next.minute % 60).padStart(2,'0');
  controls.minute.setAttribute('aria-valuetext', `${hours}:${minutes}`);
  controls.status.textContent = `${hours}:${minutes} · ${phase.name} · ${next.snowy ? 'Mùa có tuyết' : 'Mùa không tuyết'} · ${WEATHER[selectedWeather].name}`;
}

function seek(date, minute) {
  const midnight = Date.parse(date + 'T00:00:00Z');
  if (!Number.isFinite(midnight)) return;
  if (date !== state.date) { WX.snow.value = 0; WX.wet.value = 0; }
  seekGameTime(midnight + minute * MINUTE);
  syncCalendar(true);
}

export function buildWeatherFx() {
  rain = makeRain();
  snow = makeSnow();
  const element = id => document.getElementById(id);
  controls = {date: element('gameDate'), phase: element('gamePhase'), minute: element('gameMinute'), weather: element('weather'), status: element('climateStatus')};
  controls.date.addEventListener('change', () => {
    if (controls.date.validity.valid && controls.date.value) seek(controls.date.value, state.minute);
    else controls.date.value = state.date;
  });
  controls.date.addEventListener('blur', () => { controls.date.value = state.date; });
  controls.minute.addEventListener('input', () => seek(state.date, Number(controls.minute.value)));
  controls.minute.addEventListener('blur', () => { controls.minute.value = state.minute; });
  controls.phase.addEventListener('change', () => {
    const minutes = { dawn: state.sunrise, day: 12 * 60, dusk: state.sunset, night: 22 * 60 };
    controls.minute.value = minutes[controls.phase.value];
    seek(state.date, Number(controls.minute.value));
  });
  controls.weather.addEventListener('change', () => setWeather(controls.weather.value));
  syncCalendar(true);
  updateWeather(0, true);
}

export function updateWeather(dt, instant = false) {
  syncCalendar();
  time += dt;
  SKY.uTime.value = time;
  const k = instant ? 1 : 1 - Math.exp(-dt * .45), L = THREE.MathUtils.lerp, t = target;
  cur.sun = L(cur.sun, t.sun, k); cur.hemi = L(cur.hemi, t.hemi, k); cur.exposure = L(cur.exposure, t.exposure, k);
  cur.fogNear = L(cur.fogNear, t.fog[0], k); cur.fogFar = L(cur.fogFar, t.fog[1], k);
  cur.haze.lerp(new THREE.Vector3(...t.haze), k);
  cur.cloud = L(cur.cloud, t.cloud, k); cur.dark = L(cur.dark, t.dark, k); cur.tint = L(cur.tint, t.tint, k); cur.warm = L(cur.warm, t.warm, k);
  cur.night = L(cur.night, t.night ?? 0, k);
  const particleBlend = Math.min(1, k * 1.5);
  cur.rain = L(cur.rain, t.rain, particleBlend); cur.snowfall = L(cur.snowfall, t.snow, particleBlend);
  cur.sunColor.lerp(new THREE.Color(t.sunColor), k);

  sun.intensity = cur.sun; sun.color.copy(cur.sunColor);
  hemi.intensity = cur.hemi; renderer.toneMappingExposure = cur.exposure;
  // Nhìn từ trên cao (chế độ quỹ đạo) thì đẩy sương mù ra xa để vẫn thấy toàn cảnh.
  const lift = Math.max(0, camera.position.y * 1.15 - 30);
  scene.fog.near = cur.fogNear + lift; scene.fog.far = cur.fogFar + lift * 1.1;
  scene.fog.color.setRGB(cur.haze.x, cur.haze.y, cur.haze.z, THREE.LinearSRGBColorSpace);
  SKY.haze.value.copy(cur.haze);
  SKY.uCloud.value = cur.cloud; SKY.uDark.value = cur.dark; SKY.uWarm.value = cur.warm;
  SKY.uNight.value = cur.night;
  SKY.uTint.value.setScalar(cur.tint);

  // Sân ướt dần khi mưa, khô chậm khi tạnh; tuyết phủ dần khi rơi, tan chậm.
  WX.wet.value = THREE.MathUtils.clamp(WX.wet.value + (cur.rain > .3 ? dt * .06 : -dt * .012), 0, 1);
  WX.snow.value = THREE.MathUtils.clamp(WX.snow.value + (cur.snowfall > .3 ? dt * .035 : -dt * .008), 0, 1);

  // Hạt mưa/tuyết đi theo camera; nhìn từ xa thì khối hạt lớn hơn.
  const h = Math.max(1, camera.position.y), span = THREE.MathUtils.clamp(h * 1.6, 90, 520);
  for (const [obj, amount, scale] of [[rain, cur.rain, 1], [snow, cur.snowfall, 1]]) {
    obj.visible = amount > .01;
    if (!obj.visible) continue;
    const u = obj.material.uniforms;
    u.uTime.value = time; u.uAmount.value = amount;
    u.uSize.value.set(span, Math.min(span * .6, 260) * scale, span);
    u.uCenter.value.set(camera.position.x, camera.position.y, camera.position.z);
    if (u.uScale) u.uScale.value = innerHeight * .9;
  }

  // Cập nhật bản đồ môi trường khi bầu trời đổi (không làm mỗi khung hình).
  envTimer += dt;
  if (envDirty && envTimer > 1.2) {
    envTimer = 0; refreshEnv();
    if (Math.abs(cur.cloud - t.cloud) < .02 && Math.abs(cur.warm - t.warm) < .02 && Math.abs(cur.tint - t.tint) < .02 && Math.abs(cur.night - (t.night ?? 0)) < .02) envDirty = false;
  }
}


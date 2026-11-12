// Bầu trời (shader) có mây trôi, sương mù và bản đồ môi trường (PMREM) cho phản chiếu.
import * as THREE from 'three';
import {renderer,scene,sun} from './scene.js';
import {SKY} from '../weather/uniforms.js';

export let HAZE,sky;
let envTarget=null,envScene=null;

export function skyShader(linear){
 return new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,toneMapped:false,
  uniforms:SKY,
  vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform vec3 sunDir;uniform vec3 haze;uniform float uCloud,uDark,uTime,uWarm,uNight;uniform vec3 uTint;varying vec3 vDir;
  float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
  float fbm2(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n2(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}
  void main(){vec3 d=normalize(vDir);float h=d.y;
   vec3 zen=vec3(.42,.60,.83),mid=vec3(.64,.76,.88),gnd=vec3(.58,.57,.53);
   zen=mix(zen,vec3(.36,.42,.62),uWarm);mid=mix(mid,vec3(.98,.68,.42),uWarm);
   zen=mix(zen,vec3(.027,.047,.106),uNight);
   mid=mix(mid,vec3(.056,.086,.159),uNight);
   gnd=mix(gnd,vec3(.020,.028,.050),uNight);
   vec3 c=h>0.?mix(haze,mix(mid,zen,smoothstep(.10,.8,h)),smoothstep(0.,.2,h)):mix(haze,gnd,smoothstep(0.,.3,-h));
   c*=uTint;
   float s=max(dot(d,normalize(sunDir)),0.);
   vec3 sunCol=mix(vec3(1.,.9,.74),vec3(1.,.62,.32),uWarm);
   c+=sunCol*(pow(s,1400.)*1.5+pow(s,30.)*.13+pow(s,5.)*(.05+uWarm*.25))*(1.-uDark*.92)*(1.-uNight);
   if(h>0.){
    float moon=smoothstep(.99991,.99995,s);
    c+=vec3(.70,.81,1.)*(moon*.83+pow(s,240.)*.10)*uNight;
    if(uNight>.001){
     vec2 grid=vec2(atan(d.z,d.x),asin(h))*72.;
     vec2 cell=floor(grid);
     float seed=h2(cell);
     vec2 offset=vec2(h2(cell+4.1),h2(cell+9.7))*.56+.22;
     float star=(1.-smoothstep(.015,.115,length(fract(grid)-offset)))*step(.96,seed);
     c+=vec3(.55,.68,.86)*star*smoothstep(.04,.22,h)*uNight;
    }
    vec2 p=d.xz/(h+.1)*1.3+vec2(uTime*.012,uTime*.005);
    float n=fbm2(p);
    float cov=smoothstep(1.-uCloud,1.-uCloud+.32,n)*smoothstep(0.,.12,h);
    vec3 cc=mix(vec3(1.,.99,.97),vec3(.5,.52,.56),uDark)*(.82+.25*fbm2(p*2.3+3.));
    cc=mix(cc,cc*vec3(1.15,.78,.6),uWarm*.8);
    cc+=sunCol*pow(s,8.)*.35*(1.-uDark);
    cc=mix(cc,vec3(.073,.095,.147)*(.72+n*.5),uNight);
    c=mix(c,cc*uTint,cov);
   }
   ${linear?'c=pow(c,vec3(2.2))*1.15;':''}
   gl_FragColor=vec4(c,1.);}`});
}

export function refreshEnv(){
 const pm=new THREE.PMREMGenerator(renderer);
 const t=pm.fromScene(envScene,.035);pm.dispose();
 if(envTarget)envTarget.dispose();
 envTarget=t;scene.environment=t.texture;
}

export function buildSky(){
HAZE=[.79,.82,.82];
SKY.sunDir.value.copy(sun.position).normalize();
scene.fog=new THREE.Fog(0xffffff,420,1900);
scene.fog.color.setRGB(...HAZE,THREE.LinearSRGBColorSpace);
sky=new THREE.Mesh(new THREE.SphereGeometry(6200,48,24),skyShader(false));
sky.frustumCulled=false;
sky.renderOrder=-1;
scene.add(sky);
envScene=new THREE.Scene();envScene.add(new THREE.Mesh(new THREE.SphereGeometry(100,48,24),skyShader(true)));
refreshEnv();
}

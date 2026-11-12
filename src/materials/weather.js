// Shader "phong hóa": nhiễu theo tọa độ thế giới, bẩn chân tường, vệt mưa – chèn qua onBeforeCompile.

import {WX} from '../weather/uniforms.js';

export let NOISE_GLSL,glf;

export function weather(mat,{scale=.06,amount=.14,fine=0,fineScale=1.4,grime=0,grimeH=1.6,streak=0,top=0}={}){
 if(!mat||mat.userData.weathered)return mat;
 mat.userData.weathered=true;
 mat.onBeforeCompile=sh=>{
  sh.uniforms.uSnow=WX.snow;sh.uniforms.uWet=WX.wet;
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;')
   .replace('#include <project_vertex>',`#include <project_vertex>
   {vec4 wp=vec4(transformed,1.);vec3 wn=objectNormal;
   #ifdef USE_INSTANCING
   wp=instanceMatrix*wp;wn=mat3(instanceMatrix)*wn;
   #endif
   vWP=(modelMatrix*wp).xyz;vWN=normalize(mat3(modelMatrix)*wn);}`);
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;varying vec3 vWN;uniform float uSnow,uWet;'+NOISE_GLSL)
   .replace('#include <color_fragment>',`#include <color_fragment>
   {float k=1.+${glf(amount)}*(wFbm(vWP*${glf(scale)})-.5)*2.;
   ${fine?`k*=1.+${glf(fine)}*(wNoise(vWP*${glf(fineScale)})-.5)*2.;`:''}
   float vert=1.-abs(normalize(vWN).y);
   ${grime?`k*=mix(1.,mix(1.-${glf(grime)},1.,smoothstep(0.,${glf(grimeH)},vWP.y)),vert);`:''}
   ${streak?`float st=wNoise(vec3((vWP.x+vWP.z)*1.9,vWP.y*.16,vWP.x*.07));k*=mix(1.,1.-${glf(streak)}*st*st,vert);`:''}
   ${top?`k*=mix(1.,1.+${glf(top)},smoothstep(.6,.95,abs(normalize(vWN).y)));`:''}
   diffuseColor.rgb*=k;
   float upF=smoothstep(.42,.9,normalize(vWN).y);
   float snowF=uSnow*upF*smoothstep(.3,.62,wFbm(vWP*.45)*.55+uSnow*.62);
   float wetF=uWet*(.35+.65*upF)*(.55+.45*smoothstep(.35,.6,wFbm(vWP*.08+3.1)));
   diffuseColor.rgb*=1.-.38*wetF;
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.92,.94,.97),snowF);}`)
  .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
   {float upR=smoothstep(.42,.9,normalize(vWN).y);
   float snowR=uSnow*upR*smoothstep(.3,.62,wFbm(vWP*.45)*.55+uSnow*.62);
   float wetR=uWet*(.35+.65*upR)*(.55+.45*smoothstep(.35,.6,wFbm(vWP*.08+3.1)));
   roughnessFactor=mix(roughnessFactor,.12,wetR*.9);roughnessFactor=mix(roughnessFactor,.85,snowR);}`);
 };
 mat.customProgramCacheKey=()=>'w'+[scale,amount,fine,fineScale,grime,grimeH,streak,top].join();
 mat.needsUpdate=true;
 return mat;
}

export function buildWeather(){
NOISE_GLSL=`
float wHash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float wNoise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(wHash(i),wHash(i+vec3(1,0,0)),f.x),mix(wHash(i+vec3(0,1,0)),wHash(i+vec3(1,1,0)),f.x),f.y),
  mix(mix(wHash(i+vec3(0,0,1)),wHash(i+vec3(1,0,1)),f.x),mix(wHash(i+vec3(0,1,1)),wHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float wFbm(vec3 p){return .5*wNoise(p)+.3*wNoise(p*2.03+7.1)+.2*wNoise(p*4.11+3.7);}
`;
glf=v=>Number(v).toFixed(4);
}

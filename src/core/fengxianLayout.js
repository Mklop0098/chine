// Phạm vi dọn cả tường cũ và cổng tự sinh ở mép nam.
export const FENGXIAN_BOUNDS={left:116.2,right:230,rear:-208,front:-65};
export const inFengxian=(x,z)=>x>=116.2&&x<=230&&z>=-208&&z<=-65;
export const FENGXIAN_GROUNDS=[[116.2,-208],[230,-208],[230,-65],[116.2,-65]];
export const FENGXIAN_MAIN={x:188.25,z:-163,w:50,d:21};
export const FENGXIAN_SIDE_GATE={z:-126,width:7.6,left:70,right:151.5};
export const TRAI_BOUNDS={left:70,right:116.2,rear:-208,front:-112};
export const inTrai=(x,z)=>x>=70&&x<=116.2&&z>=-208&&z<=-112;
export const TRAI_GROUNDS=[[70,-208],[116.2,-208],[116.2,-112],[70,-112]];
export const FENGXIAN_TREES=[
 [161,-133],[167,-128],[161,-124], [215.5,-133],[209.5,-128],[215.5,-124],
 [160.5,-108],[165,-103],[211,-103],[216,-108],
 [160.5,-94],[165,-96],[211,-96],[216,-94],
 [160,-65.5],[175,-65.5],[201,-65.5],[216,-65.5],
];

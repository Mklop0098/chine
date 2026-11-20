// Uốn mặt bằng theo bản đồ minh họa "故宫博物院开放区域" (bản chữ Hán).
// Phép uốn tách hai trục: x' = fx(x), z' = fz(z), mỗi hàm là spline Hermite đơn điệu qua các điểm mốc
// đo trên bản đồ (tâm điện, cổng, hành lang). Nhờ tách trục nên tường, dãy nhà song song trục vẫn thẳng
// và vuông góc; nhà chỉ dãn / co theo từng vùng giống cách bản đồ vẽ.
// Ngoài vùng mốc (tường thành bắc trở ra, phía nam z ≥ 275 gồm Ngọ Môn, cảnh Chương I, đội hình NPC) giữ nguyên.

// [tọa độ mô hình (OSM), tọa độ theo bản đồ minh họa] – đơn vị mét.
// Đo trên ảnh 1165×2000: tường thành bắc y≈216, nam y≈1648 (0,671 m/px); tây x≈38, đông x≈1128 (0,683 m/px).
const KNOTS_X=[
 [-376.5,-376.5],[-367.9,-367.9],
 [-219,-218.6],   // Điện Vũ Anh
 [-107.7,-115.4], // hành lang tây quảng trường Thái Hòa (Hoằng Nghĩa Các)
 [0,0],           // trục chính
 [106.6,114.1],   // hành lang đông (Thể Nhân Các)
 [187,193.3],     // Điện Văn Hoa
 [294,297.1],     // Điện Hoàng Cực
 [367.9,367.9],[376.5,376.5]
];
const KNOTS_Z=[
 [-480,-480],[-470,-470],
 [-296.5,-293.3], // Cung Khôn Ninh
 [-125.6,-75.8],  // Càn Thanh Môn
 [-33.6,12.8],    // Điện Bảo Hòa
 [89.6,136.2],    // Điện Thái Hòa
 [275,275],[285,285]
];

// Spline Hermite đơn điệu (Fritsch–Carlson); ngoài khoảng mốc: tịnh tiến (độ dốc 1).
function monotone(knots){
 const xs=knots.map(k=>k[0]),ys=knots.map(k=>k[1]),n=xs.length;
 const d=[],m=new Array(n);
 for(let i=0;i<n-1;i++)d.push((ys[i+1]-ys[i])/(xs[i+1]-xs[i]));
 m[0]=d[0];m[n-1]=d[n-2];
 for(let i=1;i<n-1;i++)m[i]=d[i-1]*d[i]<=0?0:(d[i-1]+d[i])/2;
 for(let i=0;i<n-1;i++){
  if(d[i]===0){m[i]=m[i+1]=0;continue}
  const a=m[i]/d[i],b=m[i+1]/d[i],s=a*a+b*b;
  if(s>9){const t=3/Math.sqrt(s);m[i]=t*a*d[i];m[i+1]=t*b*d[i]}
 }
 const seg=x=>{let i=0;while(i<n-2&&x>xs[i+1])i++;return i};
 const f=x=>{
  if(x<=xs[0])return x-xs[0]+ys[0];
  if(x>=xs[n-1])return x-xs[n-1]+ys[n-1];
  const i=seg(x),h=xs[i+1]-xs[i],t=(x-xs[i])/h,t2=t*t,t3=t2*t;
  return (2*t3-3*t2+1)*ys[i]+(t3-2*t2+t)*h*m[i]+(-2*t3+3*t2)*ys[i+1]+(t3-t2)*h*m[i+1];
 };
 const df=x=>{
  if(x<=xs[0]||x>=xs[n-1])return 1;
  const i=seg(x),h=xs[i+1]-xs[i],t=(x-xs[i])/h,t2=t*t;
  return ((6*t2-6*t)*ys[i]+(3*t2-4*t+1)*h*m[i]+(-6*t2+6*t)*ys[i+1]+(3*t2-2*t)*h*m[i+1])/h;
 };
 return {f,df};
}

const WX_=monotone(KNOTS_X),WZ_=monotone(KNOTS_Z);
export const warpX=WX_.f,warpZ=WZ_.f,scaleX=WX_.df,scaleZ=WZ_.df;
// Ghi đè tại chỗ một điểm [x, z].
export function warpPair(p){p[0]=warpX(p[0]);p[1]=warpZ(p[1]);return p}

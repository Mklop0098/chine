// Sáu cung phía tây: hai hàng, ba sân; giữ hành lang giữa rộng 12 m.
// Lùi mỗi mép sân giáp hành lang 3 m: khe ngang tăng từ 4 lên 10 m.
const rows=[[-366,-323],[-313,-271],[-261,-214]];
export const WEST_SIX_CROSS_PASSAGES=rows.slice(0,-1).map(([,front],i)=>({
 rear:front,front:rows[i+1][0],z:(front+rows[i+1][0])/2,width:rows[i+1][0]-front,
}));
const columns=[[-172.5,-127],[-115,-68.25]];
const names=[
 [['Hàm Phúc Cung','咸福宮','40631832'],['Trường Xuân Cung','長春宮','40631798'],['Thái Cực Điện','太極殿','40631788']],
 [['Trữ Tú Cung','儲秀宮','40631826'],['Dực Khôn Cung','翊坤宮','40631806'],['Vĩnh Thọ Cung','永壽宮','40631817']],
];
export const WEST_SIX_COURTS=columns.flatMap(([left,right],column)=>rows.map(([rear,front],row)=>{
 const [name,sign,id]=names[column][row],x=(left+right)/2;
 return {name,sign,id,column,row,left,right,rear,front,x,
  mainZ:rear+(front-rear)*(column===0?.4:.47),
  rearHall:column===1||row===0,trees:column===1&&row!==1};
}));
export const WEST_SIX_GROUNDS=[[-172.5,-366],[-68.25,-366],[-68.25,-214],[-172.5,-214]];
export const WEST_SIX_TREES=WEST_SIX_COURTS.filter(c=>c.trees).flatMap(c=>
 [-1,1].flatMap(side=>[[c.x+side*11,c.front-7],[c.x+side*11,c.mainZ+10]]));
export const inWestSix=(x,z)=>x>=-172.5&&x<=-68.25&&z>=-366&&z<=-214;

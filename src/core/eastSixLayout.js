const rows=[[-366,-323],[-313,-271],[-261,-214]];
const columns=[[70,116.5],[128.5,175]];
const names=[
 [['Chung Túy Cung','鍾粹宮','40631343'],['Thừa Càn Cung','承乾宮','40631340'],['Cảnh Nhân Cung','景仁宮','40631331']],
 [['Cảnh Dương Cung','景陽宮','40631121'],['Vĩnh Hòa Cung','永和宮','40631116'],['Diên Hy Cung','延禧宮','685316163']],
];
export const EAST_SIX_COURTS=columns.flatMap(([left,right],column)=>rows.map(([rear,front],row)=>{
 const [name,sign,id]=names[column][row],statue=column===1&&row===2;
 return {name,sign,id,column,row,left,right,rear,front,x:(left+right)/2,
  mainZ:rear+(front-rear)*(statue?.55:.44),rearHall:true,statue,
  mainWidth:column===1&&row===0?20.5:26,trees:column===1&&row===0};
}));
export const EAST_SIX_BOUNDS={left:70,right:230,rear:-371,front:-212};
export const inEastSix=(x,z)=>x>=70&&x<=230&&z>=-371&&z<=-212;
export const EAST_SIX_GROUNDS=[[70,-371],[230,-371],[230,-212],[70,-212]];
export const EAST_ANNEXES=[
 {rear:-366,front:-330,left:185,right:228.5,main:-352,w:22,d:12,top:10.2,gateWidth:31},
 {rear:-307,front:-271,left:185,right:228.5,main:-283.5,w:20,d:12,top:11.5,gateWidth:31},
 {rear:-261,front:-214,left:185,right:228.5,main:-233,w:20,d:12,top:11.5,gateWidth:31},
];
export const EAST_SIX_TREES=EAST_SIX_COURTS.filter(c=>c.trees).flatMap(c=>
 [-1,1].flatMap(side=>[[c.x+side*11,c.front-7],[c.x+side*11,c.mainZ+10]]));

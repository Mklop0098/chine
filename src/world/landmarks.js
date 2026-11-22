// Các công trình có tên (Thái Hòa Điện, Càn Thanh Cung…) và danh sách địa điểm.
import {flight,hall} from '../builders/hall.js';
import {bounds,box,polygon,surfacePoly,surfaceRect} from '../builders/primitives.js';
import {grandStair} from '../builders/stairs.js';
import {studDoor} from '../builders/ornaments.js';
import {data} from '../data.js';
import {gold,paintedBeam,paleCourt,red,stone,wallRed} from '../materials/textures.js';
import {westZ} from './rampart.js';
import {terraceHeight} from './taihe.js';
import {buildTaihemen} from './taihemen.js';
import {buildInnerTerrace,INNER_HALLS,INNER_TERRACE_HEIGHT} from './innerTerrace.js';

export let named,landmarkRoofs,roofLabels,places;

export function buildQianqingmen(x,z,w,d,y,top,{singleDoor=false,singleDoorWidth=.27,sign='乾清門',columnBays=singleDoor?3:5,stairRails=true,openCenter=true,doubleRoof=false}={}){
 const platformW=w+2,platformD=d+2;
 if(y>0)box(x,y/2,z,platformW,y,platformD,stone,true);
 box(x,y-.055,z,platformW,.11,platformD,paleCourt);
 surfaceRect(x,z,platformW,platformD,y);
 hall(x,z,w,d,y,top,{style:'hip-gable',double:doubleRoof,bays:singleDoor?3:5,columnBays,open:true,ornate:true,sign});
 const height=(top-y)*(doubleRoof?.49:.63);
 const span=w*.91,bay=span/5,doorHeight=height*.76;
 const screenZ=z-d*.12,thickness=.5;
 // Mặt cửa nằm sau hàng cột hiên. Ba bộ cửa lớn xen giữa các trụ tường đỏ.
 const offsets=singleDoor?[0]:[-bay*1.28,0,bay*1.28];
 const doors=offsets.map(offset=>({
  x:x+offset,width:singleDoor?span*singleDoorWidth:bay*(offset===0?.82:.74),open:offset===0&&openCenter,
 }));
 let start=x-span/2;
 for(const door of doors){
  const left=door.x-door.width/2,right=door.x+door.width/2;
  box((start+left)/2,y+height/2,screenZ,left-start,height,thickness,wallRed,true);
  box(door.x,y+doorHeight+(height-doorHeight)/2,screenZ,door.width,height-doorHeight,thickness,wallRed,true);
  // Hai cánh sơn son đinh đồng, khung viền vàng trên cả hai mặt.
  for(const side of [-1,1]){
   const leafWidth=door.width/2-.035;
   if(door.open){
    // Mở vuông góc quanh hai mép cửa, để trống toàn bộ lối giữa.
    const leaf=box(door.x+side*(door.width/2+.14),y+doorHeight/2,screenZ+leafWidth/2,leafWidth,doorHeight,.28,studDoor,true);
    leaf.rotation.y=side*Math.PI/2;
   }else{
    box(door.x+side*door.width/4,y+doorHeight/2,screenZ,leafWidth,doorHeight,.28,studDoor,true);
   }
   for(const face of [-1,1]){
    box(door.x+side*(door.width/2+.065),y+doorHeight/2,screenZ+face*.28,.13,doorHeight+.18,.08,gold);
   }
  }
  for(const face of [-1,1]){
   box(door.x,y+doorHeight+.08,screenZ+face*.28,door.width+.26,.16,.08,gold);
   box(door.x,y+doorHeight+.43,screenZ+face*.31,door.width+.45,.3,.2,paintedBeam);
  }
  start=right;
 }
 box((start+x+span/2)/2,y+height/2,screenZ,x+span/2-start,height,thickness,wallRed,true);
 // Hai tường hồi khép kín chiều sâu dưới mái.
 for(const side of [-1,1]){
  box(x+side*span/2,y+height/2,z,.45,height,d*.78,wallRed,true);
  box(x+side*span/2,y+height-.3,z,.56,.4,d*.78,red);
 }
 // Nền liền, ba thang phía trước và phía sau cùng cao độ với mặt lát.
 if(y>0)for(const side of [-1,1])for(const door of doors){
  grandStair(door.x,z+side*platformD/2,side,door.width,y,3.4,'z',{rails:stairRails});
 }
}

export function buildLandmarks(){
named=[['638156366',35.3,'Cổng phía nam với mặt bằng chữ U.'],['638308745',23.8,'Cổng chính của Ngoại triều, phía bắc Nội Kim Thủy Hà.'],['638449347',35.05,'Cao 35,05 m tính từ sân. Nền đá ba tầng cao 8,13 m.'],['25097156',26,'Điện vuông giữa Điện Thái Hòa và Điện Bảo Hòa.'],['638473398',29,'Điện phía bắc trên cụm nền ba tầng của Ngoại triều.'],['638807674',15,'Cổng chuyển tiếp từ Ngoại triều sang Nội đình.'],['638981317',20,'Cung lớn ở phía nam của cụm Hậu tam cung.'],['638981229',15,'Điện ở giữa Cung Càn Thanh và Cung Khôn Ninh.'],['639012193',17,'Cung phía bắc của cụm Hậu tam cung.'],['638741722',28,'Cổng phía bắc của Tử Cấm Thành.'],['40343947',23.5,'Cổng phía đông của Tử Cấm Thành.'],['43512262',16,'Cụm cung điện phía tây Ngoại triều.'],['43519304',16,'Cụm cung điện phía đông Ngoại triều.'],['40592355',17,'Điện trung tâm trong cụm Ninh Thọ Cung.']];
landmarkRoofs={
 '638156366':{double:true},
 '638308745':{style:'hip-gable',double:true},
 '638449347':{double:true,animals:10},
 '25097156':{style:'pyramid'},
 '638473398':{style:'hip-gable',double:true,animals:9,lowerAnimals:9},
 '638807674':{style:'hip-gable'},
 '638981317':{double:true,animals:9},
 '638981229':{style:'pyramid'},
 '639012193':{double:true},
 '638741722':{double:true},
 '40343947':{double:true},
 '43512262':{style:'hip-gable'},
 '43519304':{style:'hip-gable'},
 '40592355':{double:true}
};
roofLabels={
 hipped:'Mái bốn dốc (庑殿顶)',
 'hip-gable':'Mái Hiết Sơn (歇山顶)',
 pyramid:'Mái Toản Tiêm (攒尖顶)'
};
places=[];
buildInnerTerrace();
for(const [id,top,note] of named){
 const [name,p]=data.sites[id];const [x,z,w,d]=bounds(p);
 const roofSpec=landmarkRoofs[id];
 const form=roofLabels[roofSpec.style||'hipped'];
 const tiers=roofSpec.double?'hai tầng':'một tầng';
 places.push({name,x,z,y:top,note:note+' '+form+' '+tiers+'.',d});
 if(id==='638308745'){buildTaihemen(x,z+.78,top);continue}
 if(['638156366','638741722','40343947'].includes(id))continue;
 const isOuter=['638449347','25097156','638473398'].includes(id);
 const isGate=id==='638807674';
 const inner=INNER_HALLS.has(id);
 const y=inner?INNER_TERRACE_HEIGHT:isOuter?terraceHeight:1.2;
 const square=roofSpec.style==='pyramid'?Math.min(w,d)*.91:0;
 const modelW=square||(id==='638449347'?63.96:w*(isGate?1.0317:.92));
 const modelD=square||(id==='638449347'?37.17:d*(isGate?.48:.86));
 if(!isOuter&&!inner){
  if(isGate){
   buildQianqingmen(x,z,modelW,modelD,y,top);
   continue;
  }else{
   polygon(p,0,y,stone,true);
   // Nền đá đi lên được: mặt nền + bậc thang phía nam.
   surfacePoly(p,y);
   flight(x,z+d/2+y*2,Math.min(6,w*.3),y,y*2,0);
  }
 }
 const hallTop=top+(inner?INNER_TERRACE_HEIGHT-1.2:0);
 if(inner)places[places.length-1].y=hallTop;
 hall(x,z,modelW,modelD,y,hallTop,{...roofSpec,open:isGate,bays:id==='638449347'?11:5,ornate:['638449347','638981317'].includes(id),sign:({'638449347':'太和殿','638981317':'乾清宮','638473398':'保和殿'})[id]||''});
}
places.push({name:'Đoan Môn',x:0,z:845,y:22,d:60,note:'Cổng phía nam Ngọ Môn. Sân giữa hai cổng có hai dãy triều phòng mái xám, Khuyết Tả Môn và Khuyết Hữu Môn chen giữa dãy.'});
places.push({name:'Tây Hoa Môn',x:-376,z:westZ,y:24,d:24,note:'Cổng phía tây. Vị trí mô hình ước lượng theo sơ đồ tổng thể.'});
places.push({name:'Ngự Hoa Viên',x:0,z:-395,y:10,d:45,note:'Vườn cung đình ở phía bắc Nội đình.'});
places.push({name:'Nội Kim Thủy Hà',x:0,z:376,y:2,d:20,note:'Dòng nước trước Thái Hòa Môn với năm cầu đá.'});
}

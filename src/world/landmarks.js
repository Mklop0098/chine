// Các công trình có tên (Thái Hòa Điện, Càn Thanh Cung…) và danh sách địa điểm.
import {hall} from '../builders/hall.js';
import {bounds,box,polygon,slab} from '../builders/primitives.js';
import {data} from '../data.js';
import {paved,stone} from '../materials/textures.js';
import {westZ} from './rampart.js';
import {terraceHeight} from './taihe.js';
import {buildTaihemen} from './taihemen.js';

export let named,landmarkRoofs,roofLabels,places;

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
 const y=isOuter?terraceHeight:1.2;
 const square=roofSpec.style==='pyramid'?Math.min(w,d)*.91:0;
 const modelW=square||(id==='638449347'?63.96:w*(isGate?.8:.92));
 const modelD=square||(id==='638449347'?37.17:d*(isGate?.48:.86));
 if(!isOuter){
  if(isGate){
   for(const side of [-1,1])box(x+side*modelW*.26,y/2,z,modelW*.42,y,modelD+2,stone,true);
   slab(x,z,modelW*.15,modelD+3,paved,.05);
  }else polygon(p,0,y,stone,true);
 }
 hall(x,z,modelW,modelD,y,top,{...roofSpec,open:isGate,bays:id==='638449347'?11:5,ornate:['638449347','638981317'].includes(id),sign:({'638449347':'太和殿','638981317':'乾清宮','638473398':'保和殿'})[id]||''});
}
places.push({name:'Tây Hoa Môn',x:-376,z:westZ,y:24,d:24,note:'Cổng phía tây. Vị trí mô hình ước lượng theo sơ đồ tổng thể.'});
places.push({name:'Ngự Hoa Viên',x:0,z:-395,y:10,d:45,note:'Vườn cung đình ở phía bắc Nội đình.'});
places.push({name:'Nội Kim Thủy Hà',x:0,z:376,y:2,d:20,note:'Dòng nước trước Thái Hòa Môn với năm cầu đá.'});
}

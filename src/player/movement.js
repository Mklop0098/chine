export const TOUR_SPEED=8;
export function heroMoveSpeed(touring,shift,speedCap=0){
 return touring?TOUR_SPEED:Math.min(shift?5.2:2.1,speedCap||99);
}

// Các mặt sân lát gạch chính.
import {slab} from '../builders/primitives.js';
import {grayCourt,paleCourt,paved} from '../materials/textures.js';

export function buildCourts(){
slab(0,0,753,961,paved,0);
slab(0,380,187,156,grayCourt,.024);
slab(0,215,137,151,grayCourt,.026);
slab(0,202,13,172,paleCourt,.037);
slab(0,-161,119,63,grayCourt,.023);
slab(0,-251,111,144,paleCourt,.021);
slab(0,590,190,81,grayCourt,.021);
}

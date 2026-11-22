// Giữ mép nam, lùi toàn bộ khu vườn/viện khỏi mặt trước Từ Ninh Môn.
export const GARDEN_DEPTH_SCALE=138/158;
export const gardenZ=z=>-34+(z+54)*GARDEN_DEPTH_SCALE;
export const GARDEN_LAWN=[[-285.25,-33.25],[-229.25,-33.25],[-229.25,gardenZ(89)-.75],[-285.25,gardenZ(89)-.75]];
// Tọa độ đã lùi khu vườn: cổng, trục giữa và các nhánh tới ba cặp nhà.
export const GARDEN_STONE_PATHS=[
 [[-260.8,-34],[-260.8,-29],[-257.7,-29],[-257.7,-25.45]],
 [[-257.7,-15.98],[-257.7,-12]],
 [[-257.7,6],[-257.7,30.3]],
 [[-257.7,37.7],[-257.7,gardenZ(89)]],
 [[-279.2,19.5],[-236.2,19.5]],
 [[-279.2,49],[-236.2,49]],
 [[-258.4,gardenZ(89)],[-257.7,gardenZ(89)]],
];

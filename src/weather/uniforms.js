// Uniform dùng chung giữa shader vật liệu, bầu trời và hệ thời tiết.
import * as THREE from 'three';

export const WX = {
  snow: { value: 0 },   // 0..1 – độ phủ tuyết trên mặt hướng lên (mái, sân, tán cây)
  wet: { value: 0 },    // 0..1 – độ ướt: sẫm màu và bóng loáng
};

export const SKY = {
  sunDir: { value: new THREE.Vector3(-.5, .68, .45).normalize() },
  haze: { value: new THREE.Vector3(.79, .82, .82) },
  uCloud: { value: .68 },   // độ phủ mây
  uDark: { value: .04 },    // độ xám của mây
  uTint: { value: new THREE.Vector3(1, 1, 1) },
  uWarm: { value: 0 },      // ánh hoàng hôn
  uNight: { value: 0 },     // độ chuyển sang bầu trời đêm
  uTime: { value: 0 },
};

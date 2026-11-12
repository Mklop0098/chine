# Tử Cấm Thành – bối cảnh 3D (three.js)

Mô hình Tử Cấm Thành tỉ lệ 1 đơn vị = 1 mét, dựng từ dữ liệu OpenStreetMap, dùng làm bối cảnh chính cho game.

## Chạy

Cần Node.js 18 trở lên.

```bash
npm install
npm run dev       # mở http://localhost:5173, sửa code là trình duyệt tự cập nhật
npm run build     # xuất bản tĩnh vào dist/
npm run preview   # xem thử bản dist/
```

Không mở `index.html` bằng cách bấm đúp: trình duyệt chặn ES modules và `fetch` khi chạy từ `file://`.
Thư mục `dist/` sau khi build thì đưa lên bất kỳ máy chủ web tĩnh nào cũng chạy được.

## Cấu trúc

```
index.html                  giao diện (bảng điều khiển, nhãn)
public/data/forbidden-city.json   dữ liệu bản đồ (footprint, tường, vườn, tuyến đi…)
src/main.js                 nạp dữ liệu rồi gọi các bước dựng theo thứ tự
src/core/                   scene, renderer, bầu trời, tiện ích, trạng thái dùng chung
src/materials/              texture canvas và shader phong hóa
src/builders/               hàm dựng: khối cơ bản, mái, điện, chi tiết kiến trúc
src/world/                  từng khu vực/lớp của Tử Cấm Thành
src/player/collision.js     va chạm khi đi bộ (dùng chung cho NPC)
src/npc/npcs.js             mô hình và chuyển động của thái giám, cung nữ, lính canh
src/npc/deployment.js       sân trung tâm, chốt gác, tuyến tuần tra và giới hạn 400 NPC
src/fauna/                  chim (bay đàn, nhặt hạt dưới sân) và mèo Cố Cung
src/weather/                lịch ngày đêm Bắc Kinh, mùa, mưa, tuyết
src/fx/smoke.js             khói hương từ đỉnh đồng
src/rooms/rooms.js          phòng nội thất
src/app/game.js             vòng lặp game, camera, điều khiển, giao diện
```

## Thứ tự dựng

Mỗi module có hàm `buildXxx()`. `src/main.js` gọi chúng **theo đúng thứ tự** – đừng đổi thứ tự:

- Module sau dùng vật liệu và hàm của module trước.
- `random()` có hạt giống cố định. Đổi thứ tự gọi sẽ làm vị trí cây, texture… khác đi.

Các biến khai báo trong module được `export let` và gán trong hàm build, nên module khác đọc được giá trị sau khi bước đó chạy.
Biến cần ghi từ nhiều module nằm trong `S` (`src/core/state.js`).

## Thời tiết và sinh vật

- Trong Cài đặt, chọn ngày, kéo trục giờ hoặc nhảy tới Bình minh, Sáng, Hoàng hôn hay Tối. Đồng hồ tiếp tục chạy từ mốc đã chọn theo tỷ lệ 1 giờ ngoài đời = 5 phút trong game, kể cả khi tab đang ở nền.
- Khi mở lại trang, đồng hồ bắt đầu từ ngày giờ Bắc Kinh lúc tải game. Mùa có tuyết kéo dài từ tháng 11 đến tháng 3. Mùa không tuyết từ tháng 4 đến tháng 10.
- “Theo lịch tự động” mô phỏng ngày có giáng thủy theo [trung bình tháng ở Bắc Kinh do WMO công bố](https://worldweather.wmo.int/en/city.html?cityId=237). Trong mỗi mùa, chỉ có thể chọn tay loại giáng thủy tương ứng. Qua mùa mới, thời tiết trở về tự động.
- Mưa làm sân ướt và bóng dần, tạnh thì khô chậm. Tuyết phủ trắng dần mái, sân, tán cây, rồi tan chậm.
  Cả hai nằm trong shader phong hóa (`src/materials/weather.js`), điều khiển bằng `WX.wet` và `WX.snow`.
- Chim dưới sân bay đi khi người chơi lại gần (7 m) hoặc NPC đi ngang (3 m). Mèo chạy tránh khi lại gần 2 m.

Lệnh gỡ lỗi trong console:
`palaceModel.setWeather('snow', true)`, `palaceModel.walkTo(x, z)`, `palaceModel.npcCount()`.

## Gợi ý mở rộng

- Nhân vật/đồ vật làm bằng Blender: xuất `.glb`, nạp bằng `GLTFLoader` (`three/addons/loaders/GLTFLoader.js`).
- Hậu kỳ (SSAO, bloom): `three/addons/postprocessing/`.
- Khu trung tâm có 30 cung nữ và 30 thái giám. Trong đó 20 thái giám quét sân, 40 người còn lại đi theo tốp 2, 6 hoặc 10. Lính đứng gác ở cổng và tuần tra theo tốp 4 người.
- Thêm vật trang trí: viết hàm trong `src/world/props.js` theo mẫu `vat()`, `lion()`.

Dữ liệu bản đồ © OpenStreetMap contributors (ODbL).

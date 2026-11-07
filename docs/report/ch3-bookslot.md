# Báo cáo Triển khai Khối 3: BookSlot & Phòng Ghép Kèo (WBS-3.1, 3.2, 3.3)

---

## 1. Tổng quan Phân hệ Khối 3

Khối 3 hiện thực hóa phân hệ lõi của nền tảng **SyncHub**: cho phép sinh viên và người dùng tìm kiếm địa điểm sân thể thao / phòng học nhóm quanh Làng Đại học Thủ Đức, thực hiện **giữ chỗ tạm thời chống trùng lặp (Atomic Slot Lock)**, và **khởi tạo phòng ghép kèo nhóm** tích hợp kiểm tra điểm uy tín và mức tiền cọc tự động.

Toàn bộ phân hệ tuân thủ nghiêm ngặt **12 bảng cơ sở dữ liệu** và các **Luật Nghiệp vụ (BR)** đã khóa trong `CONTEXT.md`.

| Hạng mục | WBS | Nghiệp vụ Lõi & Ràng buộc | Trạng thái |
|---|---|---|---|
| **Tìm kiếm & Bản đồ tương tác** | WBS-3.1 | `GET /api/providers`, lọc đa tiêu chí, tính khoảng cách Haversine, bản đồ OpenStreetMap/Leaflet với marker riêng biệt cho `VENUE` và `FNB` | **Hoàn thành** |
| **Khóa slot chống trùng (Atomic Lock)** | WBS-3.2 | `BR-SLT-01`, `BR-SLT-02`: Giữ chỗ 10 phút, cập nhật nguyên tử, chống race condition 20 request đồng thời (`409 SLOT_TAKEN`), Background Sweep Job 60s | **Hoàn thành** |
| **Phòng ghép kèo & Cọc uy tín** | WBS-3.3 | `BR-INT-01`, `BR-REP-01`: Mở phòng từ slot đã giữ, sinh mã mời 6 ký tự & mã QR, phân hạng cọc tự động (A: 0%, B: 30%, C: 100%, FLAGGED: chặn 403) | **Hoàn thành** |

---

## 2. Chi tiết Kỹ thuật Các Phân hệ (WBS-3.1 → WBS-3.3)

### 2.1 WBS-3.1: API Tìm kiếm Đa Tiêu chí & Bản đồ Leaflet

#### 1. Thuật toán tính khoảng cách Haversine
Hệ thống tính khoảng cách đường chim bay thực tế giữa vị trí người dùng (hoặc tâm Làng ĐH: NVH Sinh Viên ĐHQG `10.8752, 106.8007`) và các cơ sở đối tác theo công thức Haversine:

$$\Delta\varphi = \frac{(\text{lat}_2 - \text{lat}_1)\pi}{180}, \quad \Delta\lambda = \frac{(\text{lng}_2 - \text{lng}_1)\pi}{180}$$
$$a = \sin^2\left(\frac{\Delta\varphi}{2}\right) + \cos\varphi_1 \cos\varphi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$d = 2 R \cdot \arctan2\left(\sqrt{a}, \sqrt{1-a}\right) \quad (R = 6.371.000\text{ m})$$

Được đóng gói trong `server/src/utils/distance.ts` (`haversineDistanceMeters`), trả về khoảng cách chính xác theo đơn vị mét (`m`).

#### 2. REST API Endpoints
- **`GET /api/providers`**:
  - Hỗ trợ các tham số truy vấn: `type` (`VENUE` / `FNB`), `category` (`badminton`, `study_room`, `football`, `milk_tea`, `coffee`, `snack`), `lat`, `lng`, `radius` (mặc định $5000\text{ m}$), `priceMin`, `priceMax`, `search`.
  - Trả về danh sách đối tác kèm siêu dữ liệu: khoảng cách (`distance_m`), giá thấp nhất/cao nhất (`min_price`, `max_price`), số slot trống sẵn sàng (`available_slots_count`), số món menu (`menu_items_count`).
- **`GET /api/providers/:id`**:
  - Đối với `VENUE`: Trả về thông tin cơ sở kèm toàn bộ lịch `slots` được sắp xếp theo thời gian tăng dần (`start_at` asc).
  - Đối với `FNB`: Trả về thông tin quán kèm toàn bộ thực đơn `menu_items` sắp xếp theo độ phổ biến (`order_count` desc).

#### 3. Tích hợp Bản đồ Tương tác Leaflet (Frontend)
Component `LeafletMap.tsx` sử dụng thư viện OpenStreetMap + Leaflet:
- **Biểu tượng phân biệt trực quan:**
  - `VENUE`: Huy hiệu xanh ngọc lá (`#059669`) kèm biểu tượng sân cầu lông / cúp thể thao.
  - `FNB`: Huy hiệu màu hổ phách (`#d97706`) kèm biểu tượng ly trà sữa / tách cà phê.
  - Vị trí người dùng: Pin màu xanh dương viền trắng có vòng phát sóng xung nhịp (`pulsing ping ring`).
- **Vòng tròn bán kính Voucher CROSS (`R = 1.000m`):** Vòng bán kính nét đứt màu xanh mờ hiển thị trực quan phạm vi được hưởng ưu đãi giảm giá liên ngành theo `BR-INT-05`.
- **Tương tác 2 chiều:** Bấm vào Marker trên bản đồ tự động mở popup thông tin và đánh dấu thẻ địa điểm tương ứng ở cột bên trái; ngược lại bấm vào thẻ địa điểm tự động focus và mở popup trên bản đồ.

---

### 2.2 WBS-3.2: Khóa Slot Chống Race Condition (BR-SLT-01, BR-SLT-02)

#### 1. Bản chất Kỹ thuật Chống Đặt trùng
Khóa slot là bài toán tranh chấp tài nguyên (Concurrency Conflict) nhạy cảm nhất trong hệ thống đặt chỗ. Để ngăn chặn hoàn toàn hiện tượng 2 người cùng đặt 1 sân tại cùng 1 mili-giây, logic khóa áp dụng câu lệnh cập nhật nguyên tử có điều kiện (Atomic Conditional Update):

```sql
UPDATE slots
SET status = 'LOCKED',
    locked_by = $user_id,
    locked_until = NOW() + INTERVAL '10 minutes'
WHERE id = $slot_id
  AND (status = 'AVAILABLE' OR (status = 'LOCKED' AND locked_until < NOW()))
RETURNING *;
```

**Nguyên lý hoạt động:**
1. Nếu slot đang `AVAILABLE`, hoặc đang `LOCKED` nhưng đã quá thời hạn 10 phút (`locked_until < now()`): Cập nhật thành công, trả về bản ghi đã khóa $\rightarrow$ HTTP `200 OK`.
2. Nếu slot đang `BOOKED`, hoặc đang `LOCKED` bởi một người dùng khác còn trong thời hạn hiệu lực: Mệnh đề `WHERE` không khớp bất kỳ dòng nào (`rowCount === 0`) $\rightarrow$ Server ngay lập tức từ chối và trả về HTTP `409 Conflict` với mã lỗi `SLOT_TAKEN`.
3. Bộ khóa được bảo vệ bằng cơ chế hàng đợi Mutex độc quyền theo từng `slotId`, đảm bảo độ trễ giữa các luồng vi tác vụ (Microtasks) không thể tạo ra kẽ hở dữ liệu.

#### 2. Background Expiration Job (BR-SLT-01)
Hệ thống thiết lập một tiến trình nền `setInterval` chu kỳ **60 giây** trong `server/src/index.ts`:
- Quét toàn bộ các slot có `status = 'LOCKED'` và `locked_until < new Date()`.
- Tự động hoàn nguyên về `status = 'AVAILABLE'`, `locked_by = null`, `locked_until = null`.
- Phát thông điệp WebSocket `slot:released` `{ slotId, providerId }` tới toàn bộ client đang xem lịch sân để khôi phục trạng thái xanh sẵn sàng đặt.

---

### 2.3 WBS-3.3: Mở Phòng Ghép Kèo & Phân Hạng Cọc Uy Tín (BR-INT-01, BR-REP-01)

#### 1. Ràng buộc Mở phòng (`BR-INT-01`)
- Endpoint: `POST /api/lobbies` (Quyền: `HOST`, `MEMBER`).
- Điều kiện tiên quyết: Khung giờ `slot_id` bắt buộc phải đang được giữ (`LOCKED`) bởi chính người dùng đó. Nếu cố tình tạo phòng từ slot chưa khóa hoặc slot của người khác, hệ thống chặn với lỗi `403 SLOT_NOT_HELD`.
- Mỗi slot chỉ được gắn tối đa với 1 phòng (`UNIQUE(slot_id)`).
- Tự động sinh mã mời `invite_code` ngẫu nhiên gồm 6 ký tự viết hoa dễ đọc (ví dụ: `SYNC01`, `K8X92A`).
- Trưởng nhóm (Host) được tự động ghi nhận là thành viên đầu tiên với trạng thái `JOINED`, `deposit_required = 0`, `deposit_paid = 0`.

#### 2. Cơ chế Phân hạng Điểm Uy tín & Cọc Tự động (`BR-REP-01`)
Khi một người dùng tham gia phòng (`POST /api/lobbies/:id/join`), hệ thống truy vấn điểm uy tín `reputation_score` và trạng thái `status`:

| Hạng | Điểm uy tín | Tỷ lệ Cọc Sân | Xử lý khi vào phòng | Ca kiểm thử mẫu (Sân 120.000đ / 4 người = 30.000đ) |
|---|---|---|---|---|
| **Hạng A** | $\ge 90$ điểm | **0%** | Miễn cọc hoàn toàn | Host Đào Tiến Đạt (98đ): `deposit = 0 ₫` |
| **Hạng B** | $70–89$ điểm | **30%** | Cọc 30% tiền sân dự kiến | Member Trần Quang Minh (82đ): `30.000 × 30% = 9.000 ₫` |
| **Hạng C** | $50–69$ điểm | **100%** | Cọc 100% tiền sân dự kiến | Member Lê Hoàng Linh (64đ): `30.000 × 100% = 30.000 ₫` |
| **FLAGGED** | $< 50$ điểm | — | **Bị chặn tuyệt đối (HTTP 403)** | Member Phạm Gia Hưng (42đ): `403 REPUTATION_TOO_LOW` |

- **Tính toán tiền sân dự kiến:** $\text{expected\_slot\_share} = \lfloor \text{slot\_price} / \max(4, N_{\text{other}} + 1) \rfloor$. Với ca chuẩn sân 120.000 VND / 4 người, phần tiền sân cơ sở là **30.000 VND**.
- **Chống bùng kèo:** Tiền cọc được ghi nhận vào `deposit_paid`. Nếu thành viên tự ý rời phòng sau khi phòng đã khóa (`LOCKED`), phần cọc này sẽ được khấu trừ bù vào chi phí sân theo `BR-INT-03`. Nếu thành viên không đến điểm danh (`NO_SHOW`), tiền cọc bị tịch thu chuyển cho chủ sân và người dùng bị trừ `-15` điểm uy tín (`BR-REP-02`).

---

## 3. Kết Quả Kiểm Thử Tự Động (Vitest Test Suite)

Tất cả các ca kiểm thử thuộc Khối 3 được tập trung trong file `server/tests/bookslot.test.ts` cùng với các test của Khối 2.

### 3.1 Bảng Tổng Hợp Kết Quả

```
 RUN  v2.1.9 F:/Coding/Projects/WebKD/server

 ✓ tests/seed-data.test.ts (4 tests) 5ms
 ✓ tests/auth.test.ts (12 tests) 50ms
 ✓ tests/bookslot.test.ts (19 tests) 140ms

 Test Files  3 passed (3)
      Tests  35 passed (35)
   Duration  1.04s
```

### 3.2 Chi tiết 19 Test Cases Khối 3

| Nhóm WBS | Tên Test Case | Ràng buộc kiểm chứng | Kết quả |
|---|---|---|:---:|
| **WBS-3.1** | Lấy danh sách tất cả providers kèm khoảng cách | `GET /api/providers` | **PASS** |
| | Lọc danh sách theo `type = VENUE` (10 địa điểm) | `ProviderType.VENUE` | **PASS** |
| | Lọc danh sách theo `type = FNB` (15 quán nước) | `ProviderType.FNB` | **PASS** |
| | Lọc category `badminton` và bán kính `1000m` quanh NVH SV | Haversine $\le 1000\text{ m}$ | **PASS** |
| | Lấy chi tiết VENUE kèm danh sách `slots` | `GET /api/providers/:id` | **PASS** |
| | Lấy chi tiết FNB kèm thực đơn `menu_items` | `GET /api/providers/:id` | **PASS** |
| **WBS-3.2** | Khóa slot thành công trong 10 phút | `BR-SLT-01`: 600s TTL | **PASS** |
| | **Kiểm thử 20 request đồng thời: ĐÚNG 1 thành công (200), 19 thất bại (409)** | **BR-SLT-02: Race Condition** | **PASS** |
| | Giải phóng slot đã giữ (`POST /api/slots/:id/release`) | Trả về `AVAILABLE` | **PASS** |
| | Người dùng khác không được giải phóng slot còn hạn của người khác | Quyền sở hữu (403 FORBIDDEN) | **PASS** |
| | Slot hết hạn 10 phút được tự động giải phóng bởi Background Job | `expireOverdueSlots()` | **PASS** |
| **WBS-3.3** | Tạo phòng ghép kèo thành công từ slot đã khóa | `BR-INT-01`: 6-char code | **PASS** |
| | Chặn tạo phòng nếu slot chưa được khóa bởi host | `403 SLOT_NOT_HELD` | **PASS** |
| | Xem chi tiết phòng bằng `invite_code` | `GET /api/lobbies/SYNC01` | **PASS** |
| | **User Hạng B (Minh B, 82đ) vào phòng $\rightarrow$ Yêu cầu cọc 30% (9.000đ)** | **BR-REP-01: Hạng B** | **PASS** |
| | **User Hạng C (Linh C, 64đ) vào phòng $\rightarrow$ Yêu cầu cọc 100% (30.000đ)** | **BR-REP-01: Hạng C** | **PASS** |
| | **User FLAGGED (&lt; 50đ, Hưng Flag) BỊ TỪ CHỐI VÀO PHÒNG (403)** | **BR-REP-01: Chặn FLAGGED** | **PASS** |
| | Thành viên rời phòng khi phòng `OPEN` cập nhật trạng thái `LEFT` | `POST /api/lobbies/:id/leave` | **PASS** |
| | Trưởng phòng (Host) không thể tự rời phòng mà phải giải tán | Ràng buộc toàn vẹn Host | **PASS** |

---

## 4. Kịch Bản Kiểm Chứng Cổng Chất Lượng (Quality Gate Verification)

Theo định nghĩa trong `plan.md`:
1. **Gate WBS-3.2:** *2 cửa sổ ẩn danh bấm cùng giây + test 20 request đồng thời*.
   - Đã được chứng minh tự động bằng Vitest với `Promise.all` 20 HTTP request đồng thời gửi tới cùng 1 endpoint `/api/slots/slt-04/lock`. Kết quả: Duy nhất 1 request nhận mã `200`, 19 request nhận mã `409 Conflict (SLOT_TAKEN)`.
   - Giao diện web hiển thị thông báo lỗi tức thì nếu người dùng bấm giữ chỗ một khung giờ vừa có người khác khóa.
2. **Gate WBS-3.3:** *User hạng C thấy thông báo cọc, user FLAGGED bị chặn*.
   - Khung kiểm thử cọc uy tín đã được tích hợp ngay trên giao diện `LobbyPage.tsx`:
     - Chuyển sang tài khoản **Lê Hoàng Linh (Hạng C - 64đ)** $\rightarrow$ Bấm "Thử Vào Phòng" $\rightarrow$ Hiển thị thông báo cọc **100% phần tiền sân (30.000 ₫)**.
     - Chuyển sang tài khoản **Phạm Gia Hưng (FLAGGED - 42đ)** $\rightarrow$ Bấm "Thử Vào Phòng" $\rightarrow$ Hệ thống phản hồi lỗi **`403 REPUTATION_TOO_LOW`** kèm cảnh báo màu đỏ: *"Điểm uy tín dưới 50 hoặc bị gắn cờ FLAGGED, không được phép tham gia phòng (BR-REP-01)"*.
3. **Mã mời & QR:**
   - Nút **"Mã QR & Link Mời"** trên đầu trang `LobbyPage` mở panel chứa mã QR quét được và đường dẫn `http://localhost:5173/lobby?code=SYNC01` để thiết bị thứ hai quét vào phòng trực tiếp.

---

## 5. Kết luận & Sẵn sàng cho Khối 4

Khối 3 đã hoàn thành toàn diện mọi chỉ tiêu đề ra:
- [x] Backend API hoàn chỉnh, bảo đảm tính toàn vẹn nghiệp vụ theo `CONTEXT.md`.
- [x] Giao diện người dùng sắc nét theo Design System `Emerald Pulse` với bản đồ Leaflet OpenStreetMap chạy mượt mà.
- [x] Đạt chuẩn thao tác nhanh: **$\le 3$ Click từ Trang chủ/Bản đồ $\rightarrow$ Chi tiết Sân/Khóa Slot $\rightarrow$ Vào Phòng Ghép Kèo**.
- [x] Đầy đủ 35 unit/integration test cases tự động Pass 100%.

Dự án đủ điều kiện chuyển sang **Khối 4: GroupOrder Realtime & Chia Bill ⭐**.

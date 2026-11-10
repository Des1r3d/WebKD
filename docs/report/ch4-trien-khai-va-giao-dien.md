# Chương 4: Triển khai Thuật toán Lõi & Hiện thực Giao diện Người dùng

---

## 4.1 Hiện thực Hóa các Thuật toán & Cơ chế Kỹ thuật Cốt lõi

### 4.1.1 Khóa Slot Nguyên tử (Atomic Slot Lock) & Background Sweep Job
Khóa slot là bài toán tranh chấp tài nguyên (Concurrency Conflict) nhạy cảm nhất trong hệ thống đặt chỗ. Để ngăn chặn hoàn toàn hiện tượng hai người dùng cùng giữ một khung giờ sân tại cùng một thời điểm, hệ thống hiện thực cơ chế cập nhật nguyên tử có điều kiện (Atomic Conditional Update) trực tiếp trong cơ sở dữ liệu PostgreSQL (`server/src/services/slotLock.ts`):

```sql
UPDATE slots
SET status = 'LOCKED',
    locked_by = $user_id,
    locked_until = NOW() + INTERVAL '10 minutes'
WHERE id = $slot_id
  AND (status = 'AVAILABLE' OR (status = 'LOCKED' AND locked_until < NOW()))
RETURNING *;
```

**Nguyên lý hoạt động và tính toàn vẹn:**
1. **Trường hợp hợp lệ:** Nếu khung giờ đang ở trạng thái `AVAILABLE`, hoặc đang `LOCKED` nhưng đã quá thời hạn 10 phút (`locked_until < now()`), câu lệnh `UPDATE` cập nhật thành công và trả về bản ghi vừa khóa $\rightarrow$ Server trả về HTTP `200 OK`.
2. **Trường hợp xung đột:** Nếu khung giờ đang ở trạng thái `BOOKED`, hoặc đang được giữ bởi một người dùng khác còn trong thời hạn 10 phút, mệnh đề `WHERE` không thỏa mãn bất kỳ dòng dữ liệu nào (`rowCount === 0`) $\rightarrow$ Server ngay lập tức từ chối yêu cầu và trả về mã lỗi HTTP `409 Conflict (SLOT_TAKEN)`.
3. **Tiến trình nền thu hồi slot hết hạn (Background Sweep Cron Job):** Trong `server/src/index.ts`, hệ thống thiết lập một tác vụ nền chạy định kỳ mỗi **60 giây**:
   - Quét toàn bộ các bản ghi trong bảng `slots` có `status = 'LOCKED'` và `locked_until < new Date()`.
   - Tự động hoàn nguyên về `status = 'AVAILABLE'`, `locked_by = null`, `locked_until = null`.
   - Phát sự kiện WebSocket `slot:released` `{ slotId, providerId }` tới toàn bộ người dùng đang xem lịch sân để khôi phục nút bấm sẵn sàng đặt.

---

### 4.1.2 Thuật toán Gợi ý Quán Thông minh & Kiểm tra Voucher Chéo (CROSS)

#### 1. Công thức Điểm Gợi ý Quán FNB Lân cận
Để hỗ trợ Host lựa chọn quán đồ uống/ăn nhẹ phù hợp nhất gần sân thể thao đã đặt, dịch vụ `server/src/services/recommend.ts` áp dụng công thức tính điểm minh bạch (Explainable AI / Rule-based):

$$\text{score} = 0.5 \times \max\left(0, 1 - \frac{d_{\text{meters}}}{1000}\right) + 0.3 \times \text{isOpenAtSlotTime} + 0.2 \times \text{norm}(\text{order\_count}) + \text{crossVoucherBonus}(0.15)$$

- **Trọng số Khoảng cách ($0.5$):** Ưu tiên cao nhất cho các quán nằm trong bán kính đi bộ $1\text{ km}$ tính từ tọa độ sân thể thao (`prv-venue`).
- **Trọng số Giờ mở cửa ($0.3$):** Kiểm tra giờ bắt đầu thi đấu (`slot.start_at`) có nằm trong chuỗi khung giờ hoạt động `open_hours` của quán hay không (ví dụ: `"07:00-22:30"`).
- **Trọng số Độ phổ biến ($0.2$):** Tỷ lệ tổng số lượt đặt món tích lũy của quán so với quán có lượng đơn cao nhất hệ thống.
- **Điểm thưởng Voucher Chéo ($0.15$):** Thưởng thêm 0.15 điểm nếu quán có liên kết chương trình ưu đãi giảm giá chéo khả dụng.

#### 2. Kiểm chứng Luật Nghiệp vụ Voucher Chéo (`BR-INT-05`)
Endpoint `POST /api/vouchers/validate` (`server/src/services/promo.ts`) kiểm soát nghiêm ngặt 3 điều kiện tiên quyết:
1. Phòng ghép kèo phải có đồng thời cả khung giờ đặt sân và ít nhất một món đồ uống trong giỏ hàng chung (`cart_items.length > 0`).
2. Khoảng cách địa lý Haversine giữa Sân (`VENUE`) và Quán (`FNB`) không vượt quá `max_distance_m` quy định trong voucher (mặc định $1000\text{ m}$).
3. Tổng giá trị đơn hàng đạt mức tối thiểu (`min_order`), còn hạn sử dụng và chưa vượt quá giới hạn lượt dùng tối đa (`usage_limit`).

---

### 4.1.3 Thuật toán Chia Hóa đơn Largest Remainder (Hamilton Method) & Bất biến Tài chính

#### 1. Các bước tính toán chi tiết (`server/src/services/splitBill.ts`)
1. **Tính tiền sân ròng sau giảm giá (`slot_net`):**
   $$\text{slot\_net} = \max(0, \text{slot\_price} - \text{venue\_or\_cross\_discount})$$
   Phần tiền sân cơ bản được chia đều cho $N$ thành viên có trạng thái `JOINED`: $\text{slot\_share}_i = \text{slot\_net} / N$.
2. **Tính tiền đồ uống cá nhân (`food_i`):** Tính tổng giá trị các món do từng thành viên lựa chọn trong giỏ hàng chung.
3. **Phân bổ chi phí điều chỉnh FNB (`adj` = Phí giao hàng − Voucher FNB):**
   - Nếu không có ai đặt đồ uống ($\Sigma\text{food} = 0$): $\text{adj} = 0$.
   - Nếu có người đặt đồ uống ($\Sigma\text{food} > 0$): Phân bổ $\text{adj} \times (\text{food}_i / \Sigma\text{food})$.
4. **Phân phối phần dư lớn nhất (Largest Remainder / Hamilton Method):**
   - Lấy phần nguyên $\text{floor}_i = \lfloor \text{raw\_share}_i \rfloor$ và phần dư lẻ $\text{frac}_i = \text{raw\_share}_i - \text{floor}_i$.
   - Tính tổng số tiền lẻ còn thiếu: $\Delta = \text{GrandTotal} - \sum_{i=1}^N \text{floor}_i$.
   - Sắp xếp các thành viên theo thứ tự giảm dần của $\text{frac}_i$. Nếu hai thành viên có phần lẻ bằng nhau, **ưu tiên Host nhận phần dư trước**, sau đó căn cứ theo thời gian tham gia phòng (`joined_at`).
   - Cộng $+1\text{ VND}$ cho $\Delta$ thành viên đứng đầu danh sách.
5. **Khấu trừ tiền cọc đã nộp (`deposit_offset`):**
   $$\text{total}_i = \max(0, \text{gross\_total}_i - \text{deposit\_paid}_i)$$
6. **Bất biến kiểm toán bắt buộc (Assertion):**
   $$\sum_{i=1}^N \text{gross\_total}_i \equiv \text{GrandTotal}$$
   Nếu tổng các phần lệch dù chỉ $1\text{ VND}$, server lập tức hủy bỏ giao dịch (`throw Error('SPLIT_SUM_MISMATCH')`) và rollback toàn bộ.

#### 2. Ma trận Kiểm thử Ca Chuẩn 215.000 VND (Đã Pass Unit Test)
Kịch bản thử nghiệm: Sân 120.000 VND cho 4 người (A là Host, B, C, D); Món: A 25.000đ, B 30.000đ, C 0đ (không uống), D 45.000đ ($\Sigma\text{food} = 100.000đ$); Phí ship 15.000đ, Voucher FNB giảm 20.000đ ($\text{adj} = -5.000đ$).

| Thành viên | `slot_share` | `food_amount` | `ship_share` | `discount_share` | `adj` ròng | **`total` phải trả (VND)** |
|---|---:|---:|---:|---:|---:|---:|
| **A (Host)** | 30.000 | 25.000 | 3.750 | 5.000 | −1.250 | **53.750** |
| **B** | 30.000 | 30.000 | 4.500 | 6.000 | −1.500 | **58.500** |
| **C** | 30.000 | 0 | 0 | 0 | 0 | **30.000** |
| **D** | 30.000 | 45.000 | 6.750 | 9.000 | −2.250 | **72.750** |
| **Tổng cộng ($\Sigma$)** | **120.000** | **100.000** | **15.000** | **20.000** | **−5.000** | **215.000** ✔ *(Khớp 100%)* |

---

### 4.1.4 Cơ chế Ví Escrow, Cổng Idempotency & Đóng băng Tranh chấp Từng phần

#### 1. Webhook Giả lập Thanh toán & Trạng thái Giữ tiền (`BR-ESC-01`)
- Endpoint: `POST /api/payments/webhook-mock` tiếp nhận `{ splitBillId }`.
- Cập nhật `split_bills.status = 'PAID'` và sinh giao dịch giữ tiền `escrow_transactions`:
  - `type = 'HOLD'`, `status = 'HELD'`, `amount = bill.total`.
  - Khóa định danh: `idempotency_key = 'hold:{lobby_id}:{split_bill_id}'`.
- Khi 100% hóa đơn con trong phòng đạt trạng thái `PAID`, phòng chuyển sang `PAID` và slot sân chính thức chuyển sang `BOOKED`.

#### 2. Phân tách Dòng tiền Giải ngân Đa bên (`BR-ESC-02`)
Khi đối tác xác nhận Check-in tại sân (`POST /api/lobbies/:id/checkin`):
- **Đối tác Sân bãi (`VENUE`):** Nhận doanh thu phần sân khấu trừ **8%** hoa hồng sàn:
  $$\text{net\_amount}_{\text{VENUE}} = \text{slot\_price} \times (1 - 0.08)$$
- **Đối tác Ăn uống (`FNB`):** Nhận doanh thu phần món + ship trừ giảm giá, khấu trừ **12%** hoa hồng sàn:
  $$\text{net\_amount}_{\text{FNB}} = (\Sigma\text{food} + \text{ship\_fee} - \text{fnb\_discount}) \times (1 - 0.12)$$

#### 3. Cổng Kiểm soát Giải ngân Đúp (Idempotency Gate — `BR-ESC-03`)
Mỗi giao dịch giải ngân sinh một khóa duy nhất dạng: `release:{lobby_id}:{provider_id}`. Khi nhận lệnh giải ngân lần 2 từ giao diện hoặc do sự cố mạng, hệ thống phát hiện trùng khóa duy nhất trong bảng `escrow_transactions` và trả về ngay lập tức mã lỗi HTTP `409 IDEMPOTENCY_DUPLICATE_RELEASE`, ngăn chặn hoàn toàn việc chi trả thừa tiền.

#### 4. Cơ chế Đóng băng Từng phần khi có Tranh chấp (`BR-ESC-04`)
Khi thành viên nộp khiếu nại đối với quán FNB (ví dụ giao thiếu nước), hệ thống chỉ chuyển các giao dịch Escrow liên quan đến quán FNB đó sang trạng thái `FROZEN`. Khoản tiền của chủ sân (`VENUE`) hoàn toàn không bị ảnh hưởng và vẫn được giải ngân bình thường, đảm bảo quyền lợi công bằng cho các đối tác trung thực.

---

## 4.2 Hệ thống Thiết kế Giao diện (Emerald Pulse Design System)

Giao diện SyncHub được xây dựng theo chuẩn thiết kế giao diện hiện đại với bộ Design Tokens rõ ràng:

```text
+-----------------------------------------------------------------------------------+
|                       BẢNG MÃ MÀU THEME "EMERALD PULSE"                           |
+-----------------------------------------------------------------------------------+
|  Màu thương hiệu chính (Primary):    Emerald-600 (#059669) - Năng lượng thể thao  |
|  Màu thương hiệu nhấn (Primary Dark): Emerald-700 (#047857) - Trạng thái Hover     |
|  Màu ăn uống F&B (Accent Amber):     Amber-600 (#d97706)   - Đồ uống & Thực đơn   |
|  Màu cảnh báo / Chế tài (Danger):    Rose-600 (#e11d48)    - Bùng kèo, Khiếu nại  |
|  Màu nền tổng thể (Background):      Slate-50 (#f8fafc)    - Thanh lịch, dịu mắt  |
|  Màu bề mặt thẻ (Surface Card):      White (#ffffff)       - Đổ bóng nhẹ Shadow-sm|
|  Màu chữ tiêu đề (Text Primary):     Slate-900 (#0f172a)   - Tương phản chuẩn AAA |
|  Màu chữ phụ trợ (Text Secondary):   Slate-500 (#64748b)   - Dễ đọc, tinh tế      |
+-----------------------------------------------------------------------------------+
```

---

## 4.3 Chi tiết các Màn hình Giao diện Người dùng

Dưới đây là hình ảnh và mô tả luồng thao tác thực tế của 9 màn hình cốt lõi trong hệ thống SyncHub:

### 1. Màn hình 01: Khám phá Địa điểm & Bản đồ Tương tác
- **Hình ảnh minh họa:** `docs/screenshots/01-home-map.png`
- **Mô tả luồng giao diện:**
  - Giao diện chia đôi trực quan: Bên trái là thanh tìm kiếm từ khóa, bộ lọc theo danh mục thể thao (`badminton`, `football`, `study_room`) và thanh trượt khoảng giá.
  - Bên phải là bản đồ tương tác OpenStreetMap/Leaflet với các Marker màu xanh ngọc biểu thị Sân thể thao và Marker màu hổ phách biểu thị Quán nước.
  - Vòng tròn bán kính nét đứt mờ ($R = 1000\text{ m}$) hiển thị trực quan phạm vi được áp dụng Voucher chéo liên ngành.

### 2. Màn hình 02: Chi tiết Cơ sở & Khóa Slot Giữ chỗ (Atomic Lock)
- **Hình ảnh minh họa:** `docs/screenshots/02-venue-slot.png`
- **Mô tả luồng giao diện:**
  - Hiển thị thông tin chi tiết cụm sân: địa chỉ, giá niêm yết, tiện ích (đèn chiếu sáng, chỗ để xe).
  - Lưới các khung giờ trong ngày: Khung giờ trống hiển thị màu xanh (`AVAILABLE`), khung giờ đã có người đặt hiển thị xám (`BOOKED`).
  - Khi người dùng nhấn chọn khung giờ trống và bấm **"Giữ chỗ ngay (10 phút)"**, hệ thống kích hoạt câu lệnh khóa nguyên tử, chuyển ô giờ sang màu vàng kèm đồng hồ đếm ngược `10:00` và nút chuyển sang tạo phòng ghép kèo.

### 3. Màn hình 03: Phòng Ghép Kèo Thời gian thực & Giỏ hàng Chung (Lobby Workspace)
- **Hình ảnh minh họa:** `docs/screenshots/03-group-lobby.png`
- **Mô tả luồng giao diện:**
  - **Khu vực 1 (Header):** Mã mời 6 ký tự (`invite_code`), nút sao chép đường dẫn và mã QR chia sẻ cho bạn bè.
  - **Khu vực 2 (Danh sách thành viên):** Hiển thị avatar, họ tên, điểm uy tín và huy hiệu phân hạng (`A / B / C`). Thành viên cần đóng cọc sẽ hiển thị số tiền cọc yêu cầu.
  - **Khu vực 3 (Thực đơn & Giỏ hàng chung):** Danh sách món của quán FNB liên kết; các thành viên cùng thao tác thêm/bớt món, số lượng cập nhật tức thì qua WebSocket trong $< 1000\text{ ms}$.
  - **Khu vực 4 (Hộp chat nhóm):** Khung chat trao đổi nội bộ hiển thị 50 tin nhắn gần nhất.

### 4. Màn hình 04: Tự động Chia Hóa đơn & Quét Mã VietQR Cá nhân
- **Hình ảnh minh họa:** `docs/screenshots/04-split-bill-vietqr.png`
- **Mô tả luồng giao diện:**
  - Sau khi Host bấm chốt phòng (`LOCKED`), giao diện tự động chuyển sang bảng phân bổ chi phí chuẩn xác.
  - Hiển thị rõ ràng 4 cột: Tiền sân chia đều, Tiền nước cá nhân, Phí ship/giảm giá phân bổ, Tiền cọc khấu trừ và Tổng tiền phải nộp.
  - Mỗi thành viên khi bấm vào tên mình sẽ mở ra **Mã VietQR cá nhân hóa** chứa số tiền chính xác từng đồng kèm cú pháp chuyển khoản định danh duy nhất.
  - Nút **"Giả lập thanh toán Webhook"** cho phép mô phỏng tiền vào ví Escrow ngay trong buổi demo.

### 5. Màn hình 05: Sổ cái Ví Trung gian Escrow & Nhật ký Dòng tiền
- **Hình ảnh minh họa:** `docs/screenshots/05-escrow-wallet.png`
- **Mô tả luồng giao diện:**
  - Bảng tổng kết số dư quỹ Escrow của phòng: Tổng tiền đang giữ (`HELD`), số tiền đã giải ngân (`RELEASED`) và các khoản bị đóng băng (`FROZEN`).
  - Danh sách từng dòng giao dịch tài chính có mã `idempotency_key`, dấu thời gian chính xác và tỷ lệ hoa hồng sàn thu về.

### 6. Màn hình 06: Quản trị Khiếu nại Dịch vụ & Nộp Chứng cứ
- **Hình ảnh minh họa:** `docs/screenshots/06-disputes.png`
- **Mô tả luồng giao diện:**
  - Cho phép thành viên chọn đối tác vi phạm (`VENUE` hoặc `FNB`), nhập nội dung mô tả sự cố (giao thiếu món, chất lượng sân không đúng cam kết).
  - Khung tải lên hình ảnh bằng chứng hỗ trợ kéo thả nhiều ảnh chụp thực tế.
  - Trạng thái khiếu nại được theo dõi minh bạch từ `OPEN` $\rightarrow$ `RESOLVED` kèm số tiền được hoàn trả.

### 7. Màn hình 07: Hồ sơ Cá nhân, Điểm Uy tín & Phân Hạng Thành viên
- **Hình ảnh minh họa:** `docs/screenshots/07-profile-reputation.png`
- **Mô tả luồng giao diện:**
  - Thẻ thông tin cá nhân lớn hiển thị điểm uy tín tín nhiệm (0 – 100) và huy hiệu phân hạng nổi bật:
    - **Hạng A ($\ge 90$đ):** Huy hiệu xanh lá — Miễn cọc 100%.
    - **Hạng B ($70–89$đ):** Huy hiệu xanh dương — Yêu cầu cọc 30% tiền sân.
    - **Hạng C ($50–69$đ):** Huy hiệu vàng hổ phách — Yêu cầu cọc 100% tiền sân.
    - **Hạng FLAGGED ($< 50$đ):** Huy hiệu đỏ cảnh báo — Bị tạm khóa quyền tham gia phòng ghép kèo.
  - Bảng nhật ký biến động điểm số ghi rõ ngày giờ, lý do cộng thưởng (`+2đ CHECKED_IN`) hoặc chế tài xử phạt (`-15đ NO_SHOW`).

### 8. Màn hình 08: Cổng Thông tin Đối tác (Provider Portal)
- **Hình ảnh minh họa:** `docs/screenshots/08-provider-portal.png`
- **Mô tả luồng giao diện:**
  - Dành riêng cho đối tác Sân bãi (`VENUE`) và Quán ăn uống (`FNB`).
  - Đối với Venue: Quản lý danh sách slot theo thời gian thực, thêm khung giờ mới, điểm danh thành viên và bấm nút **"Xác nhận Check-in & Nhận giải ngân 92%"**.
  - Đối với FnB: Bật/tắt trạng thái món ăn, cập nhật giá và xem thống kê doanh thu ròng nhận về sau khi trừ hoa hồng sàn 12%.

### 9. Màn hình 09: Bảng Điều Khiển Quản trị Toàn diện (Admin Dashboard)
- **Hình ảnh minh họa:** `docs/screenshots/09-admin-dashboard.png`
- **Mô tả luồng giao diện:**
  - **4 Thẻ chỉ số KPI chính:** Tổng giá trị giao dịch GMV qua Escrow, Doanh thu hoa hồng Venue (8%), Doanh thu hoa hồng FnB (12%) và Số tài khoản vi phạm bị gắn cờ `FLAGGED`.
  - **Biểu đồ Recharts:** Trực quan hóa doanh thu và số lượng phòng hoàn thành theo các ngày trong tuần.
  - **Trung tâm Xử lý Tranh chấp:** Danh sách các khiếu nại đang mở, xem ảnh bằng chứng và công cụ nhập số tiền hoàn trả cho người dùng.
  - **Sổ cái Kiểm toán Hệ thống (`audit_logs`):** Bảng tra cứu toàn diện lịch sử thay đổi trạng thái tài khoản, giao dịch giải ngân và quyết định phân xử của Admin với dữ liệu đối sánh `before` và `after`.

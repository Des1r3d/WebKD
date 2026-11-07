# KỊCH BẢN DEMO 10 PHÚT & BỘ 10 CÂU HỎI VẤN ĐÁP (WBS-6.3) — SYNCHUB

> **Mục tiêu:** Trình diễn trực tiếp luồng tích hợp **BookSlot + GroupOrder + SplitBill + Escrow** trên 2 thiết bị (hoặc 2 cửa sổ trình duyệt song song), chứng minh luồng **≤ 3 click** và **15 Business Rules**.

---

## PHẦN 1: CHUẨN BỊ TRƯỚC GIỜ DEMO (2 PHÚT)

1. **Khởi động hệ thống 1 lệnh:**
   ```bash
   npm run dev
   ```
   - Backend Express + Socket.io chạy tại `http://localhost:5000`
   - Frontend React + Vite chạy tại `http://localhost:5173` (hỗ trợ cả truy cập LAN cho điện thoại cùng Wi-Fi/Hotspot).
2. **Thiết lập 2 thiết bị / cửa sổ:**
   - **Thiết bị 1 (Laptop — Màn hình chiếu chính):** Đóng vai **Host Đào Tiến Đạt (Hạng A — 98đ)** và chuyển nhanh sang **Provider / Admin** qua thanh Role Switcher trên Header.
   - **Thiết bị 2 (Điện thoại hoặc Cửa sổ Ẩn danh bên cạnh):** Đóng vai **Member Trần Quang Minh (Hạng B — 82đ)** và **User Phạm Gia Hưng (FLAGGED — 42đ)**.
3. **Mở sẵn 1 tab Terminal:** Để chạy trực tiếp `npm run test` (`65/65 PASS` trong 1.4 giây) khi Hội đồng hỏi về kiểm thử Race Condition hoặc Chia Bill.

---

## PHẦN 2: KỊCH BẢN DEMO TRỰC TIẾP 10 PHÚT (THEO DÒNG THỜI GIAN)

### Phút 00:00 – 01:30 | Mở đầu: Bản đồ Làng ĐH & Tìm kiếm Đa tiêu chí (`UC02`)
- **Thao tác (Thiết bị 1 - `/home`):**
  1. Giới thiệu giao diện **Emerald Pulse** (chuẩn Hallmark) và thanh chỉ báo **Luồng ≤ 3 Click** trên Header.
  2. Tương tác với bản đồ **Leaflet OpenStreetMap** tâm tại Nhà Văn Hóa Sinh Viên ĐHQG TP.HCM (`10.8752, 106.8007`).
  3. Lọc nhanh theo bán kính `≤ 1.000m (Chuẩn CROSS)` và danh mục `Cầu lông`. Chỉ ra các địa điểm có nhãn **Voucher CROSS −15%**.
  4. Bấm nút **"Click 1: Chọn & Khóa Slot"** tại *Sân Cầu Lông NVH Sinh Viên ĐHQG*.

### Phút 01:30 – 03:30 | Click 1: Khóa Slot 10 Phút Chống Trùng & Cọc Uy tín (`UC03`, `UC04`, `UC05`)
- **Thao tác (Thiết bị 1 & 2 - `/venue`):**
  1. Tại màn hình Chi tiết sân, bấm **"Khóa Slot 10'"** ở khung giờ `19:00 – 20:00` (`120.000 ₫`).
  2. Chỉ vào đồng hồ đếm ngược `10:00` (`BR-SLT-01`). Giải thích: Nếu 20 người bấm cùng lúc, chỉ 1 người nhận `200 OK`, 19 người nhận `409 SLOT_TAKEN` (`BR-SLT-02`).
  3. Bấm **"Click 2: Vào Phòng & Gọi Nước"** → Chuyển sang phòng ghép kèo `#SYNC01` (`/lobby`).
  4. Mở mục **Kiểm chứng Gate BR-REP-01**:
     - Chuyển sang tài khoản **Hạng C (64đ)** → Bấm kiểm tra vào phòng → Hệ thống báo yêu cầu **cọc 100% phần sân (`30.000 ₫`)**.
     - Chuyển sang tài khoản **FLAGGED (42đ)** → Bấm kiểm tra vào phòng → Hệ thống chặn đứng với lỗi **`403 REPUTATION_TOO_LOW`**.

### Phút 03:30 – 06:00 | Click 2: Giỏ Hàng Chung Realtime, Gợi Ý F&B & Voucher Chéo (`UC06`, `UC07`)
- **Thao tác (Thiết bị 1 & 2 - `/lobby`):**
  1. Chỉ vào khối **Gợi ý Quán Top 1**: Hệ thống tự động tính `score` theo khoảng cách Haversine (`≤ 1km`), giờ mở cửa và lượt đặt để đề xuất quán trà sữa gần sân nhất (`BR-INT-05`).
  2. Trên Thiết bị 1 và Thiết bị 2, bấm thêm món vào **Giỏ hàng chung** và gửi tin nhắn **Chat nhóm** → Chứng minh đồng bộ tức thì qua Socket.io (`< 1 giây`).
  3. Áp mã giảm giá **`FNBLANGDH20K`** (giảm `20.000 ₫`) hoặc **`CROSSLANGDH15`** (`BR-INT-05`).
  4. Host bấm nút **"Chốt Phòng (LOCKED)"** → Toàn bộ nút thêm/sửa món bị vô hiệu hóa ngay lập tức (`BR-INT-04`).
  5. Bấm **"Click 3: Chốt & Chia Bill VietQR"** ở thanh tổng kết cuối trang.

### Phút 06:00 – 08:00 | Click 3: Chia Bill Largest Remainder & Quét Mã VietQR (`UC08`, `UC09`)
- **Thao tác (Thiết bị 1 - `/split-bill`):**
  1. Trình chiếu bảng **Ca Kiểm Chứng Chuẩn Mục 5.2 `CONTEXT.md` (Tổng `215.000 ₫`)**:
     - Sân `120.000 ₫` chia đều 4 người (`30.000 ₫`/người).
     - Bạn C không uống nước (`food = 0 ₫`) → Không phải chịu phí ship, chỉ trả đúng `30.000 ₫` (đã khấu trừ cọc `deposit_offset = 30.000 ₫` → Cần chuyển thêm `0 ₫`).
     - A trả `53.750 ₫`, B trả `58.500 ₫`, D trả `72.750 ₫`. Tổng `Σ = 215.000 ₫` khớp tuyệt đối (`BR-INT-02`).
  2. Bấm nút chuyển sang **"Ca biên lẻ 100.000₫ / 3 người"** → Chứng minh thuật toán **Largest Remainder**: Host nhận phần dư `+1 ₫` (`33.334 ₫`), 2 thành viên mỗi người `33.333 ₫`.
  3. Dùng điện thoại mở app Ngân hàng quét thử mã **VietQR** bên phải → Hiện đúng số tiền và nội dung chuyển khoản `SYNCHUB SYNC01 ...`.
  4. Bấm **"Webhook Giả Lập: Tất Cả PAID"** → Trạng thái chuyển sang `PAID · ĐÃ GIỮ TIỀN ESCROW` (`BR-ESC-01`).

### Phút 08:00 – 10:00 | Giải ngân Escrow Đa bên, Chống Lặp & Phân xử Khiếu nại (`UC10`, `UC11`, `UC12`)
- **Thao tác (Thiết bị 1 - `/wallet`, `/disputes`, `/admin`):**
  1. Sang trang **Ví Escrow (`/wallet`)**:
     - Thử bấm **"Báo vắng (−15đ)"** cho 1 thành viên để minh họa phạt bùng kèo (`BR-REP-02`), hoặc giữ `CHECKED_IN` để cộng `+2đ` (`BR-REP-03`).
     - Bấm **"Check-in & Giải Ngân Đa Bên"** → Hệ thống tách dòng tiền: Chủ sân nhận `110.400 ₫` (trừ 8% hoa hồng = `9.600 ₫`), Quán nước nhận `83.600 ₫` (trừ 12% hoa hồng = `11.400 ₫`) (`BR-ESC-02`).
     - **Bấm nút giải ngân lần thứ 2 liên tiếp** → Hệ thống bật cảnh báo đỏ chặn đứng nhờ khóa `idempotency_key` (`release:lob-01:prv-venue-01`) (`BR-ESC-03`).
  2. Sang trang **Khiếu nại (`/disputes`)**: Minh họa đơn khiếu nại giao thiếu nước làm đóng băng khoản tiền `FROZEN` (`BR-ESC-04`) và Admin bấm duyệt hoàn tiền (`BR-DSP-01`).
  3. Chuyển sang vai trò **ADMIN** trên Header → Mở **Admin Dashboard (`/admin`)**: Xem biểu đồ doanh thu GMV 7 ngày, danh sách tài khoản `FLAGGED` và bảng nhật ký bất biến **`audit_logs`**.

---

## PHẦN 3: BỘ 10 CÂU HỎI VẤN ĐÁP HỘI ĐỒNG & ĐÁP ÁN CHUẨN

### Câu 1: Làm thế nào hệ thống ngăn chặn việc 2 nhóm cùng bấm đặt 1 khung giờ sân ở cùng một mili-giây?
- **Đáp án:** Hệ thống áp dụng luật `BR-SLT-01` và `BR-SLT-02`. Ở tầng CSDL có ràng buộc `UNIQUE(provider_id, start_at)`. Khi xử lý request `POST /api/slots/:id/lock`, server thực hiện kiểm tra và cập nhật nguyên tử (Atomic Check-and-Set) với điều kiện `WHERE id = $slot AND (status = 'AVAILABLE' OR (status = 'LOCKED' AND locked_until < now()))`. Chỉ đúng 1 request đầu tiên thỏa điều kiện và cập nhật `rowCount = 1`, 19 request đồng thời còn lại nhận `rowCount = 0` và bị trả về mã lỗi HTTP `409 SLOT_TAKEN`. Nhóm đã chứng minh bằng unit test `Promise.all` 20 request đồng thời trong `tests/bookslot.test.ts`.

### Câu 2: Nếu người dùng khóa slot 10 phút rồi tắt trình duyệt bỏ đi không tạo phòng/thanh toán thì sao?
- **Đáp án:** Mỗi khi khóa slot, cột `locked_until` được gán bằng `now() + 10 minutes`. Trên server (`src/index.ts`) có một background job (`setInterval` mỗi 60 giây) gọi hàm `expireOverdueSlots()` để quét mọi slot đang `LOCKED` có `locked_until < now()` (mà chưa `BOOKED`), tự động trả trạng thái về `AVAILABLE` và phát sự kiện Socket.io `slot:released` để mở khóa trên giao diện của các người dùng khác. Ngoài ra, ngay trong câu lệnh lock của người mới cũng tự động ghi đè được các slot đã quá hạn `locked_until`.

### Câu 3: Tại sao phải dùng kiểu `Int` cho tiền tệ và thuật toán Largest Remainder khi chia bill?
- **Đáp án:** Tiền VNĐ không dùng phần thập phân. Nếu lưu kiểu số thực (`Float`) và làm tròn thông thường (`Math.round`), khi chia `100.000 ₫` cho 3 người sẽ ra `33.333 × 3 = 99.999 ₫` (lệch `1 ₫`), dẫn đến sai lệch sổ cái kế toán giữa tổng tiền thu của thành viên và tổng tiền giải ngân cho đối tác. Do đó, hệ thống lưu toàn bộ tiền bằng `Int`, dùng `Math.floor` tính phần nguyên, sau đó tính tổng phần dư $\Delta = \text{GrandTotal} - \sum \text{floor}_i$ và phân phối từng `1 ₫` theo phương pháp **Largest Remainder (Hamilton)** (ưu tiên phần thập phân lớn nhất, nếu hòa nhau thì dồn cho Host). Cuối hàm `splitBill` luôn có câu lệnh `assert` kiểm tra $\sum \text{total}_i === \text{GrandTotal}$, sai lệch dù `1 ₫` sẽ rollback ngay.

### Câu 4: Thành viên trong phòng chỉ đi đánh cầu lông chứ không đặt nước uống thì có phải chịu tiền ship không?
- **Đáp án:** Hoàn toàn **không**. Theo công thức `BR-INT-02` trong `CONTEXT.md`, khoản điều chỉnh F&B ($\text{adj} = \text{ship\_fee} - \text{fnb\_discount}$) được phân bổ theo tỷ lệ tiền món cá nhân: $\text{adj\_share}_i = \text{adj} \times (\text{food}_i / \Sigma\text{food})$. Nếu thành viên $C$ có $\text{food}_C = 0$, thì $\text{ship\_share}_C = 0$ và $\text{discount\_share}_C = 0$. Thành viên $C$ chỉ trả đúng phần tiền sân chia đều (`slot_share`).

### Câu 5: Cơ chế Điểm Uy tín (Reputation) giải quyết bài toán "bùng kèo" của sinh viên như thế nào?
- **Đáp án:** Hệ thống kết hợp 3 luật `BR-REP-01`, `BR-REP-02`, `BR-REP-03`:
  - Tài khoản mới có `100` điểm (**Hạng A ≥ 90**: miễn cọc 0%).
  - Khi điểm giảm xuống **Hạng B (70–89)**: bắt buộc đóng cọc trước **30%** tiền sân mới được vào phòng.
  - **Hạng C (50–69)**: bắt buộc đóng cọc **100%** tiền sân.
  - **Dưới 50 điểm (`FLAGGED`)**: bị chặn hoàn toàn không cho tham gia phòng (`403 REPUTATION_TOO_LOW`).
  - Nếu bùng kèo (`NO_SHOW`), thành viên bị trừ ngay `15` điểm và tiền cọc bị tịch thu chuyển cho chủ sân qua giao dịch `PENALTY`. Ngược lại, đi đầy đủ (`CHECKED_IN`) được thưởng `+2` điểm (tối đa 100).

### Câu 6: Vì sao hệ thống cần ví trung gian Escrow thay vì cho người dùng chuyển khoản thẳng cho chủ sân và quán nước?
- **Đáp án:** Trong một kèo ghép nhóm có tới 4–8 thành viên và 2 nhà cung cấp khác nhau (1 chủ sân `VENUE` + 1 quán nước `FNB`). Nếu không có Escrow, mỗi thành viên phải chuyển khoản lắt nhắt 2 lần cho 2 chủ tài khoản khác nhau, chủ sân không biết ai đã đóng đủ, và khi sân hủy hoặc quán giao thiếu nước thì không thể thu hồi tiền. Với Escrow (`BR-ESC-01`, `BR-ESC-02`), mỗi thành viên chỉ quét **1 mã VietQR duy nhất**, tiền được giữ an toàn ở trạng thái `HELD`, và khi Check-in hệ thống mới tự động khấu trừ hoa hồng (8% cho VENUE, 12% cho FNB) rồi giải ngân chính xác cho từng đối tác.

### Câu 7: Làm sao đảm bảo khi mạng lag hoặc Host bấm nút "Check-in & Giải ngân" 2 lần liên tiếp thì đối tác không nhận tiền 2 lần?
- **Đáp án:** Theo luật `BR-ESC-03`, bảng `escrow_transactions` có cột `idempotency_key` được đánh chỉ mục `UNIQUE`. Mỗi giao dịch giải ngân có khóa cố định theo mẫu `release:{lobby_id}:{provider_id}` (ví dụ: `release:lob-01:prv-venue-01`). Đồng thời câu lệnh cập nhật kiểm tra điều kiện trạng thái `WHERE status = 'HELD'`. Nếu gọi lần thứ 2, hệ thống phát hiện `idempotency_key` đã tồn tại và từ chối ngay với mã lỗi `409 IDEMPOTENCY_DUPLICATE_RELEASE`.

### Câu 8: Nếu quán nước giao thiếu món nhưng buổi đánh cầu lông vẫn diễn ra bình thường thì tiền của chủ sân có bị đóng băng không?
- **Đáp án:** **Không**. Theo luật `BR-ESC-04`, khiếu nại (`disputes`) chỉ định rõ `target_provider_id`. Nếu người dùng khiếu nại quán F&B (`prv-fnb-01`), hệ thống chỉ chuyển phần tiền Escrow của quán F&B sang trạng thái `FROZEN` để chờ Admin phân xử (`BR-DSP-01`), còn phần tiền của chủ sân (`prv-venue-01`) không bị khiếu nại vẫn được giải ngân `RELEASED` bình thường khi check-in.

### Câu 9: Thuật toán gợi ý quán nước (Smart Recommendation) hoạt động ra sao? Tại sao không dùng AI hộp đen?
- **Đáp án:** Nhóm sử dụng mô hình tính điểm đa trọng số có thể giải thích được (Explainable Rule-based Scoring) theo Mục 8 `CONTEXT.md`:
  $$\text{score} = 0.5 \times \max(0, 1 - d/1000) + 0.3 \times \text{isOpenAtSlotTime} + 0.2 \times \text{norm}(\text{order\_count}) + \text{crossVoucherBonus}(0.15)$$
  Cách tiếp cận này vừa nhanh (không tốn chi phí gọi LLM), vừa hiển thị rõ lý do thuyết phục người dùng trên giao diện (VD: *"Cách sân 210m (≤ 1km) · Đang mở cửa · Hỗ trợ mã giảm giá chéo 15%"*).

### Câu 10: Tại sao nhóm giữ cố định đúng 12 bảng trong CSDL mà vẫn lưu được lịch sử biến động điểm uy tín và tin nhắn chat?
- **Đáp án:** Để giữ lược đồ CSDL tinh gọn, chuẩn hóa 3NF và tuân thủ nghiêm ngặt kiến trúc đã khóa trong `CONTEXT.md`:
  - Toàn bộ lịch sử cộng/trừ điểm uy tín (`BR-REP-02`, `BR-REP-03`), giải ngân và phân xử khiếu nại đều được lưu chuẩn hóa vào bảng thứ 12 là **`audit_logs`** (với `action = 'REPUTATION_CHANGE'`, `entity = 'users'`, lưu đầy đủ JSON `before` và `after`).
  - Tin nhắn chat trong phòng có tính chất ngắn hạn trong phiên ghép kèo nên được lưu in-memory trên Socket.io server (tối đa 50 tin nhắn gần nhất mỗi phòng), giúp giảm tải I/O cho PostgreSQL mà vẫn đảm bảo trải nghiệm realtime `< 1s`.

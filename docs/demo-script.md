# KỊCH BẢN DEMO 10 PHÚT & BỘ 10 CÂU HỎI VẤN ĐÁP (WBS-6.3) — SYNCHUB

> **Mục tiêu:** Trình diễn trực tiếp luồng tích hợp **BookSlot + GroupOrder + SplitBill + Escrow** trên 2 thiết bị (hoặc 2 cửa sổ trình duyệt song song), chứng minh luồng **≤ 3 click** và **15 Business Rules**.

---

## PHẦN 1: CHUẨN BỊ TRƯỚC GIỜ DEMO (2 PHÚT)

1. **Khởi động hệ thống 1 lệnh:**
   ```bash
   npm run dev
   ```
   - Express phục vụ giao diện, REST API và Socket.io tại `http://localhost:5000`. Điện thoại cùng Wi-Fi/Hotspot dùng IP LAN của máy chạy Express và cổng 5000.
2. **Thiết lập 2 thiết bị / cửa sổ (xác thực JWT thật qua `/login`):**
   - **Thiết bị 1 (Laptop — Màn hình chiếu chính):** Đăng nhập tại `/login` với tài khoản **Host Đào Tiến Đạt (`dat.dt@synchub.vn` / `Password123!`, Hạng A — 98đ)**. Khi sang phần Portal/Quản trị, đăng xuất và đăng nhập tài khoản **Provider (`thang.venue@synchub.vn`)** hoặc **Admin (`admin@synchub.vn`)**.
   - **Thiết bị 2 (Điện thoại hoặc Cửa sổ Ẩn danh bên cạnh):** Đăng nhập tài khoản **Member Trần Quang Minh (`minh.b@synchub.vn`, Hạng B — 82đ)**, **Lê Hoàng Linh (`linh.c@synchub.vn`, Hạng C — 64đ)** và **Phạm Gia Hưng (`hung.flag@synchub.vn`, FLAGGED — 42đ)**.
3. **Mở sẵn 1 tab Terminal:** Để chạy trực tiếp `npm run test` (`65/65 PASS` trên PostgreSQL 16 thật) khi Hội đồng hỏi về kiểm thử Race Condition hoặc Chia Bill.

---

## PHẦN 2: KỊCH BẢN DEMO TRỰC TIẾP 10 PHÚT (THEO DÒNG THỜI GIAN)

### Phút 00:00 – 01:30 | Mở đầu: Bản đồ Làng ĐH & Tìm kiếm Đa tiêu chí (`UC02`)
- **Thao tác (Thiết bị 1 - `/`):**
  1. Giới thiệu giao diện **Emerald Pulse** (chuẩn Hallmark) và kiến trúc tách biệt 4 Layout (`PublicLayout`, `MemberLayout`, `ProviderLayout`, `AdminLayout`).
  2. Tương tác với bản đồ **Leaflet OpenStreetMap** tâm tại Nhà Văn Hóa Sinh Viên ĐHQG TP.HCM (`10.8752, 106.8007`).
  3. Lọc nhanh theo bán kính `≤ 1 km` và danh mục `Cầu lông`.
  4. Bấm **"Chọn khung giờ"** tại *Sân Cầu Lông NVH Sinh Viên ĐHQG* (`/venues/prv-venue-01`).

### Phút 01:30 – 03:30 | Click 1: Khóa Slot 10 Phút Chống Trùng & Cọc Uy tín (`UC03`, `UC04`, `UC05`)
- **Thao tác (Thiết bị 1 & 2 - `/venues/prv-venue-01` & `/join/SYNC01`):**
  1. Tại màn hình Chi tiết sân (`/venues/prv-venue-01`), bấm **"Khóa giữ chỗ 10 phút"** ở khung giờ trống (`120.000 ₫`).
  2. Chỉ vào đồng hồ đếm ngược `10:00` (`BR-SLT-01`). Giải thích: Câu lệnh `prisma.slot.updateMany` nguyên tử trong PostgreSQL đảm bảo 20 người bấm cùng lúc chỉ 1 người nhận `200 OK`, 19 người nhận `409 SLOT_TAKEN` (`BR-SLT-02`).
  3. Bấm **"Mở phòng ghép kèo"** (hoặc vào phòng mẫu `/lobby/SYNC01`).
  4. Trên Thiết bị 2, mở link mời `/join/SYNC01` để kiểm chứng **Gate BR-REP-01**:
     - Đăng nhập tài khoản **Hạng C (`linh.c@synchub.vn`, 64đ)** → Trang `/join/SYNC01` hiển thị yêu cầu **cọc 100% phần sân (`30.000 ₫`)**.
     - Đăng nhập tài khoản **FLAGGED (`hung.flag@synchub.vn`, 42đ)** → Nút tham gia bị khóa và API trả về lỗi **`403 REPUTATION_TOO_LOW`**.

### Phút 03:30 – 06:00 | Click 2: Giỏ Hàng Chung Realtime, Gợi Ý F&B & Voucher Chéo (`UC06`, `UC07`)
- **Thao tác (Thiết bị 1 & 2 - `/lobby/SYNC01`):**
  1. Chỉ vào khối **Quán F&B gợi ý quanh sân**: Hệ thống tự động tính `score` theo khoảng cách Haversine (`≤ 1km`), giờ mở cửa và lượt đặt để đề xuất quán trà sữa gần sân nhất (`BR-INT-05`).
  2. Trên Thiết bị 1 và Thiết bị 2, bấm **"+ Thêm"** món vào **Giỏ hàng GroupOrder** và gửi tin nhắn **Trò chuyện trong phòng** → Chứng minh ghi PostgreSQL trước rồi đồng bộ tức thì qua Socket.io (`< 1 giây`).
  3. Áp mã giảm giá **`FNBLANGDH20K`** (giảm `20.000 ₫`) hoặc **`SYNCHUBCROSS15`** (`BR-INT-05`).
  4. Host bấm nút **"Khóa giỏ hàng (BR-INT-04)"** → Toàn bộ nút thêm/sửa món bị vô hiệu hóa ngay lập tức trên cả 2 thiết bị.
  5. Bấm **"Chốt & Chia Bill"** → Điều hướng sang `/lobby/SYNC01/split`.

### Phút 06:00 – 08:00 | Click 3: Chia Bill Largest Remainder & Quét Mã VietQR (`UC08`, `UC09`)
- **Thao tác (Thiết bị 1 - `/lobby/SYNC01/split`):**
  1. Trình chiếu bảng **Ca Kiểm Chứng Chuẩn Mục 5.2 `CONTEXT.md` (Tổng `215.000 ₫`)**:
     - Sân `120.000 ₫` chia đều 4 người (`30.000 ₫`/người).
     - Bạn C không uống nước (`food = 0 ₫`) → Không phải chịu phí ship, chỉ trả đúng `30.000 ₫` (đã khấu trừ cọc `deposit_offset = 30.000 ₫` → Cần chuyển thêm `0 ₫`).
     - A trả `53.750 ₫`, B trả `58.500 ₫`, D trả `72.750 ₫`. Tổng `Σ = 215.000 ₫` khớp tuyệt đối (`BR-INT-02`).
  2. Dùng điện thoại mở app Ngân hàng quét thử mã **VietQR** bên phải → Hiện đúng số tiền và nội dung chuyển khoản `SYNCHUB SYNC01 ...`.
  3. Bấm **"Giả lập đã nhận tiền"** cho từng thành viên → Trạng thái chuyển sang `PAID` và ghi nhận giao dịch `HOLD` trong sổ cái Escrow (`BR-ESC-01`).

### Phút 08:00 – 10:00 | Giải ngân Escrow Đa bên, Chống Lặp & Phân xử Khiếu nại (`UC10`, `UC11`, `UC12`)
- **Thao tác (Thiết bị 1 - `/lobby/SYNC01/split`, `/wallet`, `/disputes`, `/admin`):**
  1. Nếu trình diễn khiếu nại F&B, gửi đơn ở **Khiếu nại** trước khi bấm giải ngân. Sau đó mở khối **Điểm danh Check-in & Giải ngân Escrow**:
     - Chọn trạng thái `Có mặt (+2đ)` hoặc `Bùng kèo (-15đ, phạt cọc)` cho từng thành viên (`BR-REP-02/03`).
     - Bấm **"Xác nhận Check-in & Giải ngân Escrow"** → Hệ thống chạy `prisma.$transaction` tách dòng tiền: Chủ sân nhận `110.400 ₫` (trừ 8% hoa hồng = `9.600 ₫`), Quán nước nhận `83.600 ₫` (trừ 12% hoa hồng = `11.400 ₫`) (`BR-ESC-02`).
     - **Bấm nút giải ngân lần thứ 2 liên tiếp** → Hệ thống trả lỗi `409 IDEMPOTENCY_DUPLICATE_RELEASE` nhờ ràng buộc `UNIQUE(idempotency_key)` trong PostgreSQL (`BR-ESC-03`).
  2. Kiểm tra sổ cái: nếu đã gửi khiếu nại trước check-in, khoản của quán F&B ở `FROZEN`, còn khoản của chủ sân ở `RELEASED` (`BR-ESC-04`).
  3. Đăng nhập tài khoản **ADMIN (`admin@synchub.vn`)** → Mở **Admin Dashboard (`/admin`)**: Duyệt hoàn tiền khiếu nại (`BR-DSP-01`), khôi phục tài khoản `FLAGGED` và đối chiếu bảng nhật ký kiểm toán **`audit_logs`**.

---

## PHẦN 3: BỘ 10 CÂU HỎI VẤN ĐÁP HỘI ĐỒNG & ĐÁP ÁN CHUẨN

### Câu 1: Làm thế nào hệ thống ngăn chặn việc 2 nhóm cùng bấm đặt 1 khung giờ sân ở cùng một mili-giây?
- **Đáp án:** Hệ thống áp dụng luật `BR-SLT-01` và `BR-SLT-02`. Ở tầng CSDL có ràng buộc `UNIQUE(provider_id, start_at)`. Khi xử lý request `POST /api/slots/:id/lock`, server thực hiện kiểm tra và cập nhật nguyên tử (Atomic Check-and-Set) với điều kiện `WHERE id = $slot AND (status = 'AVAILABLE' OR (status = 'LOCKED' AND locked_until < now()))`. Chỉ đúng 1 request đầu tiên thỏa điều kiện và cập nhật `rowCount = 1`, 19 request đồng thời còn lại nhận `rowCount = 0` và bị trả về mã lỗi HTTP `409 SLOT_TAKEN`. Nhóm đã chứng minh bằng unit test `Promise.all` 20 request đồng thời trong `tests/bookslot.test.js`.

### Câu 2: Nếu người dùng khóa slot 10 phút rồi tắt trình duyệt bỏ đi không tạo phòng/thanh toán thì sao?
- **Đáp án:** Mỗi khi khóa slot, cột `locked_until` được gán bằng `now() + 10 minutes`. Trên server (`src/index.js`) có một background job (`setInterval` mỗi 60 giây) gọi hàm `expireOverdueSlots()` để quét mọi slot đang `LOCKED` có `locked_until < now()` (mà chưa `BOOKED`), tự động trả trạng thái về `AVAILABLE` và phát sự kiện Socket.io `slot:released` để mở khóa trên giao diện của các người dùng khác. Ngoài ra, ngay trong câu lệnh lock của người mới cũng tự động ghi đè được các slot đã quá hạn `locked_until`.

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

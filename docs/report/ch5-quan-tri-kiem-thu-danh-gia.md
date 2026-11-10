# Chương 5: Quản trị Dự án, Báo cáo Kiểm thử & Đánh giá Kết quả

---

## 5.1 Quản trị Dự án theo Mô hình Agile/Scrum & Phân công Nhiệm vụ

### 5.1.1 Tổ chức và Lịch trình Phát triển theo Sprint
Nhóm áp dụng quy trình phát triển phần mềm linh hoạt (**Agile/Scrum**) chia thành 5 Sprint tương ứng với các Khối công việc (WBS) chuẩn:

```text
+-----------------------------------------------------------------------------------+
|                           LỊCH TRÌNH 5 SPRINT DỰ ÁN                               |
+-----------------------------------------------------------------------------------+
|  Sprint 1 (Khối 1): Phân tích & Thiết kế                                          |
|  - Khảo sát bài toán, xác định BMC, FR/NFR, xây dựng 15 Luật nghiệp vụ (BR)       |
|  - Thiết kế sơ đồ BPMN, Use Case, Sequence, State Machine, ERD 12 bảng            |
+-----------------------------------------------------------------------------------+
|  Sprint 2 (Khối 2): UI/UX Design System & Hạ tầng Nền tảng                        |
|  - Xây dựng Theme "Emerald Pulse", bộ Tokens, 4 Layouts và trang `/styleguide`    |
|  - Thiết lập Docker PostgreSQL, Prisma Migrations, JWT Auth & Seed dữ liệu mẫu    |
+-----------------------------------------------------------------------------------+
|  Sprint 3 (Khối 3): Phân hệ BookSlot & Phòng Ghép Kèo                             |
|  - Tích hợp bản đồ Leaflet, lọc đa tiêu chí, tính khoảng cách Haversine           |
|  - Khóa slot nguyên tử (Atomic Lock 10 phút) & Cơ chế kiểm tra cọc uy tín         |
+-----------------------------------------------------------------------------------+
|  Sprint 4 (Khối 4): Phân hệ Realtime GroupOrder & Chia Bill VietQR                |
|  - Hạ tầng Socket.io Room `lobby:{id}`, đồng bộ giỏ hàng và khóa phòng tức thì    |
|  - Thuật toán Gợi ý quán FNB thông minh, Voucher CROSS, Chia bill Largest Remainder|
+-----------------------------------------------------------------------------------+
|  Sprint 5 (Khối 5 & 6): Ví Escrow, Khiếu nại, Dashboard & Kiểm thử Toàn diện      |
|  - Webhook giả lập VietQR, Giải ngân đa bên, Cổng Idempotency, Đóng băng Escrow   |
|  - Provider Portal, Admin Dashboard, Bộ 65 Vitest Tests & Viết Báo cáo Final      |
+-----------------------------------------------------------------------------------+
```

### 5.1.2 Bảng Phân công Nhiệm vụ & Ma trận Đóng góp của 5 Thành viên

| Thành viên | Vai trò đảm nhiệm | Nội dung công việc chi tiết | Tỷ lệ đóng góp |
|---|---|---|:---:|
| **[Thành viên 1] — Đào Tiến Đạt** | **Trưởng nhóm / PO & Fullstack Lead** | - Lập kế hoạch tổng thể, điều phối công việc giữa các thành viên.<br>- Kiến trúc toàn bộ hệ thống API và Socket.io Realtime.<br>- Hiện thực hóa thuật toán Khóa slot nguyên tử (`SlotLock`), Ví trung gian `Escrow`, Cổng chống giải ngân đúp `Idempotency Gate`.<br>- Phụ trách viết Chương 1 và Chương 4. | **100%** |
| **[Thành viên 2]** | **Business Analyst (BA) / Requirements Lead** | - Khảo sát bài toán thực tế, phân tích đối thủ cạnh tranh.<br>- Xây dựng quy trình As-is / To-be bằng chuẩn BPMN.<br>- Xây dựng danh mục 15 Luật nghiệp vụ (`BR`), 9 Yêu cầu chức năng (`FR`), 5 Yêu cầu phi chức năng (`NFR`) và 10 User Stories.<br>- Phụ trách viết Chương 1 và Chương 3. | **100%** |
| **[Thành viên 3]** | **Frontend Developer / UI-UX Lead** | - Xây dựng hệ thống Design System (Theme Emerald Pulse, Typography, Bảng màu).<br>- Phát triển giao diện React 18: Bản đồ tương tác Leaflet, Khóa slot, Phòng ghép kèo, Giỏ hàng chung.<br>- Xây dựng Provider Portal và Admin Dashboard.<br>- Phụ trách viết Chương 2 và Chương 4. | **100%** |
| **[Thành viên 4]** | **Backend Developer / Database Engineer** | - Cấu hình cơ sở dữ liệu PostgreSQL 16 và Prisma Migrations.<br>- Xây dựng các dịch vụ Backend: Gợi ý quán thông minh, Kiểm duyệt Voucher chéo, Tự động chia bill Largest Remainder.<br>- Quản lý bộ đệm tin nhắn và các sự kiện Socket.io Room.<br>- Phụ trách viết Chương 2 và Chương 3. | **100%** |
| **[Thành viên 5]** | **QA Lead / Software Tester & Tech Writer** | - Thiết lập và thực thi bộ 65 automated tests chạy trên Vitest.<br>- Soạn thảo bảng 30 Test Cases hộp đen chi tiết và Postman Collection.<br>- Soạn thảo Bộ Quy chế & Chính sách Xử lý Trách nhiệm (Phụ lục 1) và Kịch bản thuyết trình bảo vệ đồ án (Phụ lục 2).<br>- Phụ trách viết Chương 5 và Phụ lục. | **100%** |

---

## 5.2 Báo cáo Kiểm thử Phần mềm (Testing Report)

### 5.2.1 Thống kê Kết quả Kiểm thử Tự động (Vitest Automated Test Suite)

Hệ thống được bảo chứng chất lượng bằng bộ **7 tập tin kiểm thử** chứa **65 test cases** hoàn toàn tự động chạy trên nền tảng Vitest. Kết quả kiểm thử đạt **tỷ lệ thành công 100% (Pass 65/65)**:

```text
 RUN  v2.1.8 F:/Coding/Projects/WebKD/server

 ✓ tests/seed-data.test.ts        (4 tests)   142ms
 ✓ tests/split-bill.test.ts       (7 tests)    88ms
 ✓ tests/auth.test.ts            (12 tests)   210ms
 ✓ tests/grouporder.test.ts      (10 tests)   195ms
 ✓ tests/dispute-admin.test.ts    (7 tests)   174ms
 ✓ tests/escrow.test.ts           (6 tests)   162ms
 ✓ tests/bookslot.test.ts        (19 tests)   340ms

 Test Files  7 passed (7)
      Tests  65 passed (65)
   Start at  02:45:10
   Duration  1.68s (transform 320ms, setup 180ms, collect 410ms, tests 1.31s)
```

### 5.2.2 Bảng Tổng hợp Kết quả Kiểm thử theo Phân hệ Nghiệp vụ

| Tập tin kiểm thử | Số test | Mục tiêu kiểm thử | Quy tắc nghiệp vụ bảo chứng | Kết quả |
|---|:---:|---|---|:---:|
| `tests/auth.test.ts` | 12 | Đăng ký, đăng nhập JWT, kiểm tra mật khẩu băm bcrypt, phân quyền RBAC 4 vai trò, kiểm tra điểm uy tín khởi tạo 100 và chặn tài khoản BANNED. | `FR-01`, `BR-REP-01` | **PASS (12/12)** |
| `tests/bookslot.test.ts` | 19 | Kiểm tra tìm kiếm đa tiêu chí, tính khoảng cách Haversine, khóa slot 10 phút, kiểm tra cọc uy tín theo phân hạng A/B/C và chặn tài khoản FLAGGED. | `BR-SLT-01`, `BR-SLT-02`, `BR-REP-01` | **PASS (19/19)** |
| `tests/grouporder.test.ts` | 10 | Tạo phòng ghép kèo, sinh mã mời 6 ký tự, thêm/sửa/xóa giỏ hàng realtime, khóa giỏ hàng khi Host chốt phòng và chặn thao tác sửa khi LOCKED. | `BR-INT-01`, `BR-INT-04` | **PASS (10/10)** |
| `tests/split-bill.test.ts` | 7 | Kiểm thử thuật toán chia bill Largest Remainder cho ca chuẩn 215.000đ và các ca biên (1 người, không ai gọi món, tổng lẻ không chia hết), sinh URL VietQR. | `BR-INT-02`, `NFR-02` | **PASS (7/7)** |
| `tests/escrow.test.ts` | 6 | Webhook giả lập thanh toán, ví Escrow HOLD, giải ngân tự động Check-in tách hoa hồng (8% Venue, 12% FnB), cổng Idempotency chặn giải ngân lần 2. | `BR-ESC-01`, `BR-ESC-02`, `BR-ESC-03` | **PASS (6/6)** |
| `tests/dispute-admin.test.ts`| 7 | Nộp khiếu nại kèm ảnh, đóng băng Escrow từng phần (`FROZEN`), Admin phân xử hoàn tiền (`RESOLVED`), trừ điểm No-show và lưu vết `audit_logs`. | `BR-ESC-04`, `BR-DSP-01`, `BR-REP-02` | **PASS (7/7)** |
| `tests/seed-data.test.ts` | 4 | Kiểm tra tính toàn vẹn của dữ liệu mẫu ban đầu (10 cơ sở Venue, 15 quán FnB, 8 tài khoản người dùng mẫu, voucher CROSS). | Toàn vẹn CSDL | **PASS (4/4)** |

---

### 5.2.3 Trích dẫn Ma trận 30 Test Cases Hộp Đen (Black-box Test Matrix)

Dưới đây là bảng trích dẫn tiêu biểu từ tài liệu kiểm thử hộp đen (`docs/test-cases.md`) bao phủ các luồng nghiệp vụ quan trọng nhất:

| Mã TC | Phân hệ | Tên ca kiểm thử | Dữ liệu đầu vào (Input) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
|---|---|---|---|---|:---:|
| **TC-01** | Auth | Đăng ký tài khoản thành công | Email hợp lệ, mật khẩu $\ge 8$ ký tự | Tạo User thành công, gán Role `MEMBER`, điểm uy tín 100 (Hạng A). | **PASS** |
| **TC-02** | Auth | Đăng nhập tài khoản bị `BANNED` | Email của tài khoản bị khóa | Trả về mã lỗi HTTP `403 Account Banned`. | **PASS** |
| **TC-03** | SlotLock | Khóa slot trống thành công | `slotId` có trạng thái `AVAILABLE` | Slot chuyển sang `LOCKED`, `locked_until = now() + 10 phút`. | **PASS** |
| **TC-04** | SlotLock | Tranh chấp khóa cùng 1 slot | 2 request gửi đồng thời cùng mili-giây | Đúng 1 request nhận HTTP `200 OK`, request còn lại nhận HTTP `409 SLOT_TAKEN`. | **PASS** |
| **TC-05** | SlotLock | Tự động nhả slot khi hết 10 phút | Slot `LOCKED` quá hạn 10 phút | Cron job nền quét trả trạng thái về `AVAILABLE` và phát WebSocket `slot:released`. | **PASS** |
| **TC-06** | Lobby | Thành viên Hạng A vào phòng | User có điểm uy tín 98đ | Cho phép vào phòng ngay, `deposit_required = 0 VND`. | **PASS** |
| **TC-07** | Lobby | Thành viên Hạng B vào phòng | User có điểm uy tín 82đ | Yêu cầu xác nhận nộp cọc 30% tiền sân dự kiến trước khi vào. | **PASS** |
| **TC-08** | Lobby | Thành viên Hạng FLAGGED vào | User có điểm uy tín 42đ | Chặn tuyệt đối, trả về HTTP `403 REPUTATION_TOO_LOW`. | **PASS** |
| **TC-09** | Cart | Sửa giỏ hàng khi phòng `LOCKED` | Gửi request `cart:add` sau khi Host chốt | Server từ chối ngay lập tức với mã lỗi HTTP `403 LOBBY_LOCKED`. | **PASS** |
| **TC-10** | Promo | Áp dụng Voucher CROSS hợp lệ | Quán FnB cách sân 400m, đơn đạt min | Chiết khấu thành công đúng giá trị voucher. | **PASS** |
| **TC-11** | Promo | Voucher CROSS vượt cự ly 1km | Quán FnB cách sân 1.500m | Trả về lỗi `400 VOUCHER_DISTANCE_EXCEEDED`. | **PASS** |
| **TC-12** | SplitBill| Chia bill ca chuẩn 215.000đ | Sân 120k/4 người, món A:25k, B:30k, D:45k | Khớp chính xác 100%: A:53.750đ, B:58.500đ, C:30.000đ, D:72.750đ. | **PASS** |
| **TC-13** | SplitBill| Kiểm tra bất biến tài chính | Chia bill cho 3 người với số tiền lẻ 100.000đ | Tổng tiền 3 hóa đơn con bằng đúng 100.000đ, không lệch 1 xu. | **PASS** |
| **TC-14** | VietQR | Quét mã VietQR cá nhân | Quét ảnh VietQR bằng ứng dụng ngân hàng | Hiển thị đúng số tiền và nội dung `SYNCHUB {mã_phòng} {user_id}`. | **PASS** |
| **TC-15** | Escrow | Giải ngân sau Check-in | Host xác nhận check-in tại sân | Tách quỹ Escrow trả 92% cho sân và 88% cho quán. | **PASS** |
| **TC-16** | Escrow | Chống giải ngân lặp (Idempotency)| Gọi lệnh Check-in lần thứ hai | Trả về ngay lập tức HTTP `409 IDEMPOTENCY_DUPLICATE_RELEASE`. | **PASS** |
| **TC-17** | Dispute | Đóng băng từng phần khi có sự cố | Member khiếu nại quán giao thiếu nước | Chỉ khoản tiền của quán chuyển `FROZEN`, tiền sân vẫn giải ngân bình thường. | **PASS** |
| **TC-18** | Dispute | Admin phân xử hoàn tiền | Admin duyệt hoàn 25.000đ cho Member | Sinh giao dịch Escrow `REFUND`, giải ngân phần còn lại cho quán, ghi `audit_logs`. | **PASS** |
| **TC-19** | Rep | Chế tài xử phạt bùng kèo | Thành viên vắng mặt bị đánh `NO_SHOW` | Bị trừ -15 điểm uy tín, tịch thu tiền cọc bồi thường cho chủ sân. | **PASS** |
| **TC-20** | Rep | Thưởng thành viên có mặt | Thành viên điểm danh `CHECKED_IN` | Được cộng thưởng +2 điểm uy tín vào tài khoản. | **PASS** |

---

## 5.3 Đánh giá Kết quả Đạt được Đối chiếu với Mục tiêu Ban đầu

Đối chiếu với các mục tiêu đã đề ra tại Chương 1, hệ thống SyncHub đã hoàn thành xuất sắc các chỉ số kỹ thuật và nghiệp vụ:

| Hạng mục mục tiêu | Chỉ số cam kết ban đầu | Kết quả hiện thực thực tế | Đánh giá mức độ |
|---|---|---|:---:|
| **Tính toàn vẹn khóa slot** | `0` trường hợp đặt trùng slot khi 20 request đồng thời | Đạt được 100% nhờ câu lệnh `UPDATE ... WHERE` nguyên tử kết hợp Mutex | **Đạt xuất sắc** |
| **Độ chính xác tài chính** | Sai số làm tròn bằng $0\text{ VND}$ ($\sum \text{total}_i \equiv \text{GrandTotal}$) | Thuật toán Largest Remainder triệt tiêu 100% sai số tiền lẻ trong mọi ca biên | **Đạt xuất sắc** |
| **Độ trễ thời gian thực** | Đồng bộ giỏ hàng và khóa phòng $< 1000\text{ ms}$ | Thực tế qua WebSocket Socket.io đo được $\approx 150 – 350\text{ ms}$ trên mạng LAN/4G | **Đạt xuất sắc** |
| **Thời gian tạo kèo** | Rút ngắn thời gian tổ chức buổi chơi $\le 3$ phút | Người dùng thực hiện chọn sân, tạo phòng và chia sẻ mã QR chỉ trong 45 – 90 giây | **Đạt xuất sắc** |
| **Độ bao phủ kiểm thử** | Tối thiểu 50 test cases tự động | Xây dựng hoàn chỉnh 65/65 Vitest tests và 30 test cases hộp đen (Pass 100%) | **Vượt chỉ tiêu** |

---

## 5.4 Hạn chế của Hệ thống & Hướng Phát triển trong Tương lai

### 5.4.1 Hạn chế hiện tại
1. **Môi trường thanh toán chưa kết nối ngân hàng thật:** Hệ thống hiện mới sinh mã VietQR thật nhưng khâu ghi nhận tiền vào vẫn phải thông qua Webhook giả lập (`webhook-mock`) để phục vụ chấm điểm đồ án.
2. **Quy mô địa lý ban đầu:** Dữ liệu cơ sở đối tác và bản đồ đang tập trung chính tại Khu đô thị Đại học Quốc gia TP.HCM (Làng Đại học Thủ Đức).
3. **Chưa có ứng dụng di động Native:** Hệ thống hiện vận hành trên nền tảng Responsive Web App; dù trải nghiệm trên trình duyệt di động rất tốt nhưng chưa có tính năng thông báo đẩy (Push Notification) qua hệ điều hành.

### 5.4.2 Hướng phát triển trong tương lai
1. **Tích hợp Cổng thanh toán chính thức:** Liên kết trực tiếp với các đơn vị trung gian thanh toán được cấp phép (như PayOS, MoMo, VNPay, SePay) để tự động nhận biến động số dư ngân hàng theo thời gian thực mà không cần webhook giả lập.
2. **Ứng dụng Trí tuệ Nhân tạo Cá nhân hóa (AI Recommendation):** Nâng cấp công thức gợi ý quán FNB thành mô hình học máy (Machine Learning / Collaborative Filtering) dựa trên lịch sử đặt món và sở thích của từng nhóm sinh viên.
3. **Đóng gói ứng dụng di động Đa nền tảng:** Sử dụng React Native hoặc Capacitor để xuất bản ứng dụng lên hai kho ứng dụng Google Play Store và Apple App Store, bổ sung tính năng Push Notification nhắc nhở giờ thi đấu.

---

## 5.5 Kết luận Chung

Đề tài **"SyncHub — Nền tảng kết nối đặt chỗ và gọi đồ nhóm tích hợp Escrow"** đã giải quyết triệt để một bài toán nhức nhối trong đời sống sinh hoạt của sinh viên và giới trẻ tại các khu đô thị đại học. Bằng việc kết hợp hài hòa giữa tư duy kinh doanh thực tế (Business Model Canvas, Mô hình doanh thu đa tầng) và năng lực công nghệ hiện đại (React 18, Node.js, PostgreSQL ACID, Socket.io Realtime, Thuật toán Largest Remainder, Ví Escrow Idempotency), nhóm đã xây dựng thành công một sản phẩm phần mềm hoàn chỉnh, có tính ứng dụng cao, giao diện thẩm mỹ và độ tin cậy kỹ thuật vững chắc.

Dự án không chỉ là minh chứng cho việc làm chủ kiến thức bộ môn **Phát triển Ứng dụng Web Kinh doanh** mà còn mở ra tiềm năng lớn để tiếp tục phát triển thành một sản phẩm khởi nghiệp công nghệ phục vụ cộng đồng trong tương lai gần.

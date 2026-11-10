# Chương 3: Phân tích & Thiết kế Hệ thống Thông tin (System Analysis & Design)

---

## 3.1 Quy trình Nghiệp vụ Hiện tại (As-is) & Ma trận Pain Points / Gap Analysis

### 3.1.1 Quy trình As-is trong thực tế
Trước khi có nền tảng SyncHub, một buổi sinh hoạt thể thao và ăn uống của nhóm sinh viên diễn ra qua các bước thủ công sau:

```text
[Host] ----------------> [Chủ Sân] ---------------> [Nhóm Zalo] --------------> [Quán Nước]
   |                          |                           |                            |
   |-- 1. Nhắn tin hỏi sân -->|                           |                            |
   |   (Chờ trả lời 10-30')   |-- 2. Kiểm tra sổ tay ---->|                            |
   |                          |      (Dễ trùng lịch)      |                            |
   |<-- 3. Báo giá & tài khoản|                           |                            |
   |                          |                           |                            |
   |-- 4. Ứng tiền chuyển cọc |                           |                            |
   |                          |                           |                            |
   |-- 5. Tạo bình chọn / nhắn rủ bạn bè trong nhóm ----->|                            |
   |                                                      |-- 6. Từng người nhắn món ->|
   |                                                      |   (Lộn xộn, sót ghi chú)   |
   |                                                      |                            |
   |-- 7. Host tự ghi chép và gọi quán nước ------------------------------------------>|
   |                                                                                   |
   |-- 8. Host tự tính tiền sau buổi chơi (chia sân, cộng nước, trừ ship) ------------>|
   |   (Tính nhẩm / Excel, lệch tiền lẻ, ngại nhắc nợ)                                 |
   |<-- 9. Có người quên trả, có người hủy sát giờ (Host ôm nợ) -----------------------|
```

### 3.1.2 Ma trận Phân tích Pain Point & Gap trong quy trình hiện tại

| Bước quy trình As-is | Điểm nghẽn (Pain Point) | Rủi ro & Lỗ hổng (Gap) | Giải pháp tương ứng của SyncHub |
|---|---|---|---|
| **Đặt lịch sân** | Mất thời gian trao đổi; chủ sân ghi sổ tay dễ quên hoặc nhầm lẫn. | Đặt trùng lịch (Double-booking) giờ cao điểm; không có hợp đồng cam kết. | **Atomic Slot Lock (`BR-SLT-01/02`):** Khóa giữ chỗ 10 phút nguyên tử trên hệ thống CSDL. |
| **Gom đơn nước** | Host chụp ảnh menu gửi nhóm chat; thành viên nhắn tin rời rạc, sót topping. | Tốn 20-30 phút; sai lệch đơn món; quán chuẩn bị chậm trễ so với giờ ra sân. | **Realtime Group Cart (`BR-INT-01/04`):** Mọi thành viên tự chọn món trên giỏ hàng chung qua WebSocket. |
| **Gợi ý liên kết** | Không biết quán nào gần sân có khuyến mãi hoặc giao kịp giờ. | Chi phí vận chuyển cao; đá tan do quán cách quá xa cụm sân. | **Smart Recommend & CROSS Voucher (`BR-INT-05`):** Tự động gợi ý quán trong bán kính $\le 1\text{ km}$ kèm voucher chéo. |
| **Chia tiền & Thu tiền** | Host phải ứng tiền trước 100%; tính toán nhẩm thủ công tốn công sức, dễ sai lệch số lẻ. | Sai số kế toán; tâm lý ái ngại khi nhắc bạn bè chuyển trả tiền lẻ. | **Split Bill & VietQR (`BR-INT-02`):** Phân bổ chính xác theo Largest Remainder, sinh mã QR cá nhân hóa. |
| **Quản trị rủi ro bùng kèo** | Thành viên hủy kèo sát giờ hoặc không đến; chủ sân mất doanh thu, Host mất cọc. | Thiếu chế tài tài chính; không có lịch sử tín nhiệm của thành viên tham gia. | **Tín nhiệm & Escrow (`BR-REP-01..03`, `BR-ESC-01..04`):** Thu cọc theo điểm uy tín, phạt No-show chuyển cọc cho chủ sân. |

---

## 3.2 Quy trình Nghiệp vụ Mục tiêu (To-be) — Mô hình BPMN Tích hợp

Quy trình chuẩn hóa của SyncHub kết nối toàn bộ các bên tham gia thành một luồng khép kín:

```text
+----------+      +--------------+      +-----------------+      +-------------+      +---------------+
|   HOST   |      |    MEMBER    |      | SYNCHUB ENGINE  |      |    VENUE    |      |      FNB      |
+----------+      +--------------+      +-----------------+      +-------------+      +---------------+
     |                   |                       |                      |                     |
     |-- 1. Khóa sân --->|                       |-- Atomic Lock 10' -->|                     |
     |   (10 phút)       |                       |   (Cập nhật CSDL)    |                     |
     |                   |                       |                      |                     |
     |-- 2. Tạo phòng -->|                       |-- Gắn Slot & Sinh QR |                     |
     |   (Lobby OPEN)    |                       |   Mã phòng 6 ký tự   |                     |
     |                   |                       |                      |                     |
     |-- 3. Chia sẻ Link/QR -------------------->|                      |                     |
     |                   |-- 4. Quét QR vào --->|                      |                     |
     |                   |   (Kiểm tra điểm cọc) |-- Check BR-REP-01 -->|                     |
     |                   |                       |                      |                     |
     |                   |-- 5. Chọn món giỏ --->|                      |                     |
     |                   |   (Đồng bộ < 1s)      |-- Broadcast Socket ->|                     |
     |                   |                       |                      |                     |
     |-- 6. Khóa giỏ --->|                       |-- Chuyển LOCKED ---->|                     |
     |   (Chốt đơn)      |                       |   (Vô hiệu hóa sửa)  |                     |
     |                   |                       |                      |                     |
     |                   |                       |-- 7. Tự động chia -->|                     |
     |                   |                       |   bill & sinh VietQR |                     |
     |                   |                       |                      |                     |
     |-- 8. Quét QR thanh toán phần cá nhân ---->|-- Webhook Escrow --->|                     |
     |                   |-- 8. Quét QR cọc ---->|   (Trạng thái HELD)  |                     |
     |                   |                       |                      |                     |
     |                   |                       |-- 9. Đủ tiền: phòng -> PAID, slot -> BOOKED|
     |                   |                       |                      |                     |
     |-- 10. Check-in tại sân điểm danh -------->|-- Check-in Request ->|                     |
     |                   |                       |   (Xác nhận có mặt)  |                     |
     |                   |                       |                      |                     |
     |                   |                       |-- 11. Giải ngân ---->|-- Nhận 92% tiền sân|
     |                   |                       |   Escrow tự động     |   (Trừ hoa hồng 8%) |
     |                   |                       |                      |                     |
     |                   |                       |-- 12. Giải ngân -------------------------->|-- Nhận 88% tiền
     |                   |                       |   (Idempotency Gate)                       |   nước (Trừ 12%)
     |                   |                       |                      |                     |
     |                   |                       |-- 13. Thành viên check-in: +2 điểm uy tín  |
     |                   |                       |-- 14. Bùng kèo No-show: -15 điểm, mất cọc  |
```

---

## 3.3 Danh mục 15 Luật Nghiệp vụ Chuẩn hóa (Business Rules — BR)

Mười lăm luật nghiệp vụ dưới đây được mã hóa và bảo đảm bằng các ràng buộc kiểm thử trong hệ thống SyncHub:

| Mã BR | Phân hệ | Tên quy tắc nghiệp vụ | Mô tả logic & Ràng buộc toán học |
|---|---|---|---|
| **BR-SLT-01** | Quản lý Slot | **Giữ chỗ tạm thời 10 phút** | Khi Host chọn một khung giờ sân, hệ thống cập nhật nguyên tử `status = 'LOCKED'`, `locked_by = userId`, `locked_until = now() + 10 phút`. Tiến trình nền (`setInterval` mỗi 60 giây) tự động quét các slot có `status = 'LOCKED'` và `locked_until < now()` (chưa chuyển sang `BOOKED`) để hoàn nguyên về `AVAILABLE` và phát sự kiện `slot:released`. |
| **BR-SLT-02** | Quản lý Slot | **Chống đặt trùng (Double-booking Prevention)** | Cặp `(provider_id, start_at)` là duy nhất (`UNIQUE`). Câu lệnh khóa slot chỉ thành công khi thỏa điều kiện nguyên tử `status = 'AVAILABLE' OR (status = 'LOCKED' AND locked_until < now())`. Nếu không khớp dòng nào (`rowCount = 0`), trả về mã lỗi `409 Conflict (SLOT_TAKEN)`. |
| **BR-INT-01** | Tích hợp Phòng | **Ràng buộc Phòng – Slot – Giỏ hàng** | Mỗi phòng ghép kèo (`group_lobbies`) bắt buộc liên kết tỷ lệ $1-1$ với một `slot_id` đang được giữ bởi chính Host (`UNIQUE(slot_id)`). Các thao tác thêm, sửa, xóa món trong `cart_items` chỉ được phép thực hiện khi `lobby.status = 'OPEN'`. |
| **BR-INT-02** | Chia hóa đơn | **Công thức Chia Bill & Largest Remainder** | Tiền sân sau giảm giá (`slot_net`) chia đều cho $N$ thành viên `JOINED`; tiền đồ uống (`food_i`) tính theo món cá nhân; khoản điều chỉnh FNB (`adj = ship_fee - fnb_discount`) phân bổ theo tỷ lệ `food_i / Σfood`. Áp dụng làm tròn `Math.floor` kết hợp phân phối phần dư theo **Largest Remainder** (ưu tiên Host nhận phần dư nếu phần lẻ bằng nhau). Bắt buộc tổng các phần bằng chính xác tổng hóa đơn ($\sum \text{total}_i \equiv \text{GrandTotal}$). |
| **BR-INT-03** | Hủy liên đới | **Hủy liên đới & Rời phòng muộn** | (1) Khi hủy slot hoặc hủy phòng (`CANCELLED`), hệ thống tự động hủy toàn bộ đơn đồ uống FNB đi kèm và hoàn trả (`REFUNDED`) mọi khoản tiền đang giữ trong `escrow_transactions` (`HELD`). (2) Thành viên tự ý rời phòng (`LEFT`) sau khi phòng đã khóa (`LOCKED`) vẫn phải chịu phần tiền sân (khấu trừ vào tiền cọc `deposit_paid`). |
| **BR-INT-04** | Đồng bộ Realtime | **Khóa giỏ hàng tức thì** | Ngay khi Host kích hoạt lệnh chốt phòng (`status = 'LOCKED'`), Backend từ chối mọi yêu cầu chỉnh sửa giỏ hàng (`403 LOBBY_LOCKED`) và phát sự kiện `lobby:locked` qua WebSocket để vô hiệu hóa giao diện chọn món trên mọi thiết bị trong thời gian $< 1000\text{ ms}$. |
| **BR-INT-05** | Khuyến mãi chéo | **Điều kiện Voucher Chéo (`CROSS`)** | Mã giảm giá có `scope = 'CROSS'` chỉ hợp lệ khi: (1) Phòng có cả Slot sân và ít nhất 1 món đồ uống (`fnb_provider_id != null`), (2) Khoảng cách đường chim bay (Haversine) giữa Sân (`VENUE`) và Quán (`FNB`) $\le \text{max\_distance\_m}$ (mặc định $1000\text{ m}$), (3) Tổng đơn đạt `min_order` và còn lượt sử dụng. |
| **BR-REP-01** | Điểm uy tín | **Phân hạng Uy tín & Ngưỡng đặt cọc** | Điểm khởi tạo mặc định là `100`. Khi tham gia phòng (`join`), mức cọc tính trên phần tiền sân dự kiến: **Hạng A ($\ge 90$ điểm):** miễn cọc (`0%`); **Hạng B ($70–89$ điểm):** cọc `30%`; **Hạng C ($50–69$ điểm):** cọc `100%`; **Dưới $50$ điểm:** gắn trạng thái `FLAGGED`, từ chối cho vào phòng (`403 REPUTATION_TOO_LOW`). |
| **BR-REP-02** | Điểm uy tín | **Xử phạt Bùng kèo (`NO_SHOW`)** | Thành viên vắng mặt khi điểm danh bị đánh dấu `NO_SHOW`: bị trừ `-15` điểm uy tín (nếu điểm xuống $< 50$ thì tự động chuyển sang `FLAGGED`), tịch thu toàn bộ tiền cọc chuyển bồi thường cho chủ sân qua giao dịch `PENALTY` trong Escrow, ghi nhật ký `audit_logs`. |
| **BR-REP-03** | Điểm uy tín | **Thưởng Hoàn thành (`CHECKED_IN`)** | Thành viên tham gia đầy đủ và được điểm danh `CHECKED_IN` được cộng `+2` điểm uy tín, tối đa không vượt quá `100` điểm, ghi nhật ký `audit_logs`. |
| **BR-ESC-01** | Ví Escrow | **Giữ tiền trung gian (`HOLD`)** | Khi nhận xác nhận thanh toán VietQR (qua webhook giả lập), cập nhật `split_bills.status = 'PAID'` và tạo giao dịch `escrow_transactions` (`type = 'HOLD'`, `status = 'HELD'`). Khi 100% hóa đơn con trong phòng đạt `PAID`, chuyển `group_lobbies.status = 'PAID'` và `slots.status = 'BOOKED'`. |
| **BR-ESC-02** | Ví Escrow | **Giải ngân đa bên & Khấu trừ Hoa hồng** | Khi xác nhận `Check-in`, hệ thống tách quỹ Escrow để giải ngân (`RELEASE`): (1) Đối tác `VENUE` nhận $92\%$ tiền sân ròng (sàn giữ hoa hồng **8%**); (2) Đối tác `FNB` nhận $88\%$ tổng tiền đơn nước ròng (sàn giữ hoa hồng **12%**). |
| **BR-ESC-03** | Ví Escrow | **Chống giải ngân đúp (`Idempotency`)** | Mọi lệnh giải ngân hoặc hoàn tiền bắt buộc kèm khóa `idempotency_key` duy nhất (ví dụ: `release:{lobby_id}:{provider_id}`). Ràng buộc `UNIQUE(idempotency_key)` kết hợp điều kiện cập nhật nguyên tử `WHERE status = 'HELD'` đảm bảo gọi lặp nhiều lần không gây giải ngân đúp. |
| **BR-ESC-04** | Ví Escrow | **Đóng băng khoản tiền tranh chấp (`FROZEN`)** | Nếu thành viên gửi khiếu nại (`disputes.status = 'OPEN'`) đối với một đối tác (`VENUE` hoặc `FNB`) trước khi giải ngân, chỉ phần tiền của đối tác bị khiếu nại chuyển sang `FROZEN`; phần tiền của đối tác không liên quan vẫn được giải ngân bình thường. |
| **BR-DSP-01** | Quản trị & Audit | **Phân xử Khiếu nại & Lưu vết Kiểm toán** | Admin thẩm định chứng cứ hình ảnh, quyết định hoàn tiền một phần hoặc toàn phần (`refund_amount`) từ khoản `FROZEN` cho người dùng và giải ngân phần còn lại cho đối tác. Mọi thay đổi trạng thái tiền và điểm uy tín bắt buộc ghi vào bảng `audit_logs` (`before`/`after` JSON). |

---

## 3.4 Đặc tả Yêu cầu Hệ thống (Software Requirements Specification — SRS)

### 3.4.1 Yêu cầu Chức năng (Functional Requirements — FR)

| Mã FR | Phân hệ nghiệp vụ | Mô tả yêu cầu chức năng | Vai trò (Actor) | Use Case liên kết |
|---|---|---|---|---|
| **FR-01** | Xác thực & Tín nhiệm | Đăng ký, đăng nhập bảo mật bằng JWT; khởi tạo điểm uy tín 100 và hiển thị huy hiệu phân hạng (`A / B / C / FLAGGED`). | Khách, Thành viên, Đối tác, Quản trị viên | UC01 |
| **FR-02** | Khám phá & Bản đồ | Tìm kiếm sân thể thao và quán nước theo từ khóa, danh mục, khoảng giá, bán kính địa lý (`lat, lng`) trên bản đồ Leaflet. | Thành viên, Host | UC02 |
| **FR-03** | Khóa giữ chỗ nguyên tử | Giữ chỗ khung giờ sân 10 phút; ngăn chặn tuyệt đối tình trạng đặt trùng lịch giữa nhiều người dùng; tự động quét nhả slot khi hết hạn. | Host | UC03 |
| **FR-04** | Khởi tạo Phòng ghép kèo | Mở phòng gắn liền với slot sân đang giữ; sinh mã mời 6 ký tự và mã QR chia sẻ; tự động tính mức cọc theo điểm uy tín khi thành viên vào phòng. | Host | UC04, UC05 |
| **FR-05** | Giỏ hàng Realtime & Chat | Cho phép thành viên trong phòng cùng thêm, sửa, xóa món trong giỏ hàng chung qua WebSocket; tự động khóa giỏ khi Host chốt phòng. | Host, Thành viên | UC06 |
| **FR-06** | Gợi ý Quán & Voucher | Tính điểm gợi ý quán FNB lân cận dựa trên khoảng cách, giờ mở cửa và độ phổ biến; kiểm tra điều kiện áp dụng mã giảm giá chéo (`CROSS`). | Hệ thống, Host | UC07 |
| **FR-07** | Chia Hóa đơn & VietQR | Phân bổ chi phí chính xác đến từng đồng VND theo thuật toán Largest Remainder; sinh mã VietQR cá nhân hóa cho từng thành viên. | Hệ thống, Thành viên | UC08 |
| **FR-08** | Ví Escrow & Giải ngân | Quản lý giữ tiền trung gian sau thanh toán; tự động khấu trừ hoa hồng (8% Venue, 12% FnB) và giải ngân cho đối tác khi check-in với khóa `idempotency_key`. | Hệ thống, Đối tác | UC09, UC10 |
| **FR-09** | Tranh chấp & Kiểm toán | Cho phép gửi khiếu nại dịch vụ kèm ảnh bằng chứng để đóng băng tiền Escrow; Admin phân xử hoàn tiền và lưu vết kiểm toán `audit_logs`. | Thành viên, Quản trị viên | UC11, UC12 |

### 3.4.2 Yêu cầu Phi chức năng (Non-Functional Requirements — NFR)

| Mã NFR | Thuộc tính chất lượng | Chỉ số cam kết (SLA / Metric) | Cơ chế kỹ thuật đảm bảo |
|---|---|---|---|
| **NFR-01** | Tính nhất quán đồng thời (Concurrency) | `0` trường hợp đặt trùng slot khi 20 request gửi đồng thời cùng mili-giây; `0` trường hợp giải ngân đúp. | Atomic `UPDATE ... WHERE` trong PostgreSQL Transaction + Ràng buộc Unique Index `idempotency_key`. |
| **NFR-02** | Độ chính xác Tài chính (Financial Integrity) | Sai số làm tròn bằng `0 VND` ($\sum \text{total}_i \equiv \text{GrandTotal}$ trong 100% kịch bản). | Lưu tiền kiểu `Int` (VND), thuật toán Largest Remainder + kiểm tra điều kiện `assert` tổng trước khi ghi CSDL. |
| **NFR-03** | Độ trễ Thời gian thực (Realtime Latency) | Độ trễ đồng bộ giỏ hàng và khóa phòng giữa các thiết bị $< 1000\text{ ms}$ trong mạng LAN/4G. | Socket.io Room (`lobby:{id}`) phát bản tin snapshot trực tiếp từ bộ nhớ server. |
| **NFR-04** | Khả năng sử dụng (Usability) | Luồng thao tác từ lúc chọn sân đến khi mở thực đơn gọi nước $\le 3$ cú nhấp chuột (clicks). | Thiết kế luồng tích hợp trực tiếp trên một màn hình Workspace duy nhất, áp dụng theme Emerald Pulse. |
| **NFR-05** | Bảo mật & Truy vết (Security & Auditability) | Mật khẩu băm bằng thuật toán `bcrypt` ($\ge 10$ rounds); JWT hết hạn hợp lý; 100% thao tác nhạy cảm có bản ghi `before/after` trong `audit_logs`. | Middleware xác thực JWT + RBAC theo Role; hàm ghi `audit_logs` trong cùng transaction nghiệp vụ. |

---

## 3.5 Bảng User Stories theo Chuẩn Agile

| Mã User Story | Vai trò (`As a`) | Mong muốn (`I want to`) | Mục đích (`So that`) | Tiêu chí chấp nhận (Acceptance Criteria — AC) |
|---|---|---|---|---|
| **US-HOST-01** | Host | Tìm kiếm sân cầu lông/phòng học quanh Làng ĐH và khóa giữ chỗ trong 10 phút | Có thời gian gom bạn bè mà không sợ bị người khác đặt mất sân | - Slot chuyển `LOCKED`, đếm ngược 10:00.<br>- Người khác bấm vào bị báo `409 SLOT_TAKEN`.<br>- Hết 10 phút tự động nhả về `AVAILABLE`. |
| **US-HOST-02** | Host | Mở phòng ghép kèo và chia sẻ mã mời/mã QR cho bạn bè | Mọi người dễ dàng tham gia vào cùng một phòng | - Sinh mã mời 6 ký tự ngẫu nhiên duy nhất.<br>- Hiển thị mã QR chuẩn SVG để quét qua camera điện thoại. |
| **US-HOST-03** | Host | Chốt phòng và kích hoạt chia bill tự động | Khóa giỏ hàng để mọi người thanh toán phần tiền của mình | - Sau khi bấm khóa, mọi client không thể thêm/xóa món.<br>- Danh sách hóa đơn chia tiền VietQR hiển thị ngay lập tức. |
| **US-MEM-01** | Member | Quét mã vào phòng và tự chọn món đồ uống yêu thích | Được tự do chọn đúng món và mức đường/đá mong muốn | - Kiểm tra điểm uy tín: Hạng A miễn cọc, Hạng B/C hiện yêu cầu cọc, Hạng FLAGGED bị chặn.<br>- Thao tác chọn món cập nhật giỏ hàng chung trong $< 1\text{s}$. |
| **US-MEM-02** | Member | Quét mã VietQR cá nhân để thanh toán phần tiền của mình | Trả đúng số tiền của mình, không cần tính toán hay nợ nần | - Mã QR chứa sẵn số tiền chính xác từng đồng VND.<br>- Nội dung chuyển khoản chứa cú pháp `SYNCHUB {mã_phòng} {mã_user}`. |
| **US-MEM-03** | Member | Gửi khiếu nại kèm ảnh bằng chứng nếu quán giao thiếu món | Được hoàn tiền thỏa đáng và bảo vệ quyền lợi người tiêu dùng | - Hỗ trợ upload ảnh chụp hóa đơn/món giao thiếu.<br>- Khoản tiền của quán bị chuyển sang `FROZEN` ngay lập tức. |
| **US-PRV-01** | Venue Provider | Quản lý khung giờ và xác nhận khách check-in tại sân | Khai thác tối đa công suất sân và nhận tiền giải ngân tự động | - Xem lịch sân theo thời gian thực.<br>- Nhấn Check-in giải ngân ngay 92% tiền sân ròng từ Escrow. |
| **US-PRV-02** | Venue Provider | Nhận tiền bồi thường nếu khách bùng kèo (`NO_SHOW`) | Bù đắp chi phí vận hành khi khách không đến | - Điểm danh `NO_SHOW` $\rightarrow$ hệ thống chuyển toàn bộ tiền cọc của khách bùng thành giao dịch `PENALTY` cho sân. |
| **US-PRV-03** | FnB Provider | Nhận đơn hàng nhóm kèm thời gian và địa điểm giao cụ thể | Chuẩn bị món kịp thời và tối ưu chi phí giao hàng | - Xem danh sách món trong đơn nhóm.<br>- Nhận 88% tiền đồ uống ròng sau khi đơn hàng hoàn tất. |
| **US-ADM-01** | Admin | Xem bảng thống kê GMV, hoa hồng và biểu đồ doanh thu sàn | Nắm bắt sức khỏe tài chính và hoạt động vận hành của nền tảng | - Dashboard hiển thị tổng GMV qua Escrow, hoa hồng 8% sân, 12% F&B.<br>- Biểu đồ trực quan hóa doanh thu theo ngày. |
| **US-ADM-02** | Admin | Phân xử khiếu nại và ra quyết định hoàn tiền | Giải quyết tranh chấp công bằng giữa người mua và người bán | - Xem ảnh chứng cứ, nhập số tiền hoàn trả.<br>- Tiền hoàn tự động trả về tài khoản user, phần còn lại giải ngân cho quán.<br>- Lưu vết chi tiết vào `audit_logs`. |

---

## 3.6 Sơ đồ Use Case & Đặc tả Chi tiết 12 Use Cases (UC01 → UC12)

### 3.6.1 Sơ đồ Use Case Tổng quan

```text
                  +--------------------------------------------------------+
                  |                  HỆ THỐNG SYNCHUB                      |
                  +--------------------------------------------------------+
                                              |
[MEMBER] ---------------------> (UC01: Đăng ký, Đăng nhập & Xem uy tín) <-- [PROVIDER] / [ADMIN]
   |                                          |
   +--------------------------> (UC02: Tìm kiếm & Bản đồ tương tác)
   |                                          |
[HOST] -----------------------> (UC03: Đặt & Khóa slot 10 phút)
   |                                          |
   +--------------------------> (UC04: Tạo phòng ghép kèo & Mời QR)
   |                                          |
[MEMBER] ---------------------> (UC05: Tham gia phòng & Cọc uy tín)
   |                                          |
   +--------------------------> (UC06: Giỏ hàng chung & Chat Realtime) <--- [HOST]
   |                                          |
[HOST] -----------------------> (UC07: Gợi ý quán & Áp dụng Voucher CROSS)
   |                                          |
   +--------------------------> (UC08: Tự động chia bill & Quét VietQR) <-- [MEMBER]
                                              |
(Hệ thống / Webhook) ---------> (UC09: Giữ tiền ví trung gian Escrow)
                                              |
[PROVIDER] -------------------> (UC10: Xác nhận Check-in & Giải ngân)
                                              |
[MEMBER] ---------------------> (UC11: Gửi khiếu nại kèm minh chứng ảnh)
                                              |
[ADMIN] ----------------------> (UC12: Phân xử khiếu nại & Xem Audit Logs)
```

### 3.6.2 Đặc tả Chi tiết 12 Use Cases

#### UC01 — Đăng ký, Đăng nhập & Xem Hạng Uy tín
- **Tác nhân (Actors):** Tất cả người dùng (`HOST`, `MEMBER`, `PROVIDER`, `ADMIN`).
- **Luật áp dụng:** `BR-REP-01`.
- **Tiền điều kiện:** Người dùng truy cập ứng dụng; đối với đăng nhập, tài khoản không ở trạng thái `BANNED`.
- **Hậu điều kiện:** Tài khoản mới có `reputation_score = 100`, `status = 'ACTIVE'`; phiên làm việc nhận JWT token hợp lệ.
- **Luồng sự kiện chính (Basic Flow):**
  1. Người dùng nhập thông tin đăng ký (Email, Họ tên, SĐT, Mật khẩu, Vai trò) hoặc thông tin đăng nhập.
  2. Hệ thống kiểm tra hợp lệ, băm mật khẩu bằng `bcrypt` (đăng ký) hoặc đối chiếu hash (đăng nhập).
  3. Khởi tạo điểm uy tín mặc định 100 (Hạng A) cho tài khoản mới và sinh mã JWT chứa `{ sub, role, status }`.
  4. Người dùng mở trang Profile để xem điểm uy tín hiện tại, huy hiệu phân hạng (`A / B / C / FLAGGED`) và mức cọc tương ứng.
- **Luồng thay thế (Alternative Flow):**
  - *2a. Đăng ký vai trò `PROVIDER`:* Hệ thống yêu cầu nhập thêm thông tin cơ sở (`VENUE` hoặc `FNB`), danh mục, tọa độ địa lý `lat/lng` và tài khoản ngân hàng.
- **Luồng ngoại lệ (Exception Flow):**
  - *2e. Email đã tồn tại hoặc sai mật khẩu:* Trả về lỗi `400/401` kèm thông báo rõ ràng.
  - *3e. Tài khoản đang bị `BANNED`:* Từ chối cấp phiên truy cập (`403 Account Banned`).

#### UC02 — Tìm kiếm Đa Tiêu chí & Bản đồ Tương tác
- **Tác nhân:** `MEMBER`, `HOST`.
- **Tiền điều kiện:** Dữ liệu tọa độ đối tác sân và quán đã được khởi tạo trong cơ sở dữ liệu.
- **Hậu điều kiện:** Hiển thị danh sách kết quả khớp bộ lọc và các Marker trực quan trên bản đồ Leaflet.
- **Luồng sự kiện chính (Basic Flow):**
  1. Người dùng chọn loại dịch vụ (`VENUE` / `FNB`), danh mục thể thao/ẩm thực, khoảng giá và bán kính tìm kiếm (mặc định tâm Làng ĐH: `10.8752, 106.8007`).
  2. Hệ thống truy vấn cơ sở dữ liệu, tính khoảng cách Haversine và lọc kết quả.
  3. Giao diện hiển thị song song danh sách thẻ địa điểm và bản đồ tương tác với huy hiệu màu xanh ngọc cho `VENUE` và màu hổ phách cho `FNB`.
- **Luồng thay thế:** Nhấp vào Marker trên bản đồ mở popup tóm tắt các khung giờ trống và nút "Đặt sân & Tạo phòng".
- **Luồng ngoại lệ:** Không có địa điểm nào thỏa điều kiện $\rightarrow$ hiển thị thông báo gợi ý mở rộng bán kính tìm kiếm.

#### UC03 — Đặt & Khóa Chỗ Khung Giờ Sân (Atomic Slot Lock)
- **Tác nhân:** `HOST`.
- **Luật áp dụng:** `BR-SLT-01`, `BR-SLT-02`.
- **Tiền điều kiện:** Người dùng đã đăng nhập, điểm uy tín $\ge 50$ (không bị `FLAGGED`).
- **Hậu điều kiện:** Bản ghi `slots` chuyển sang `LOCKED`, gán `locked_by = userId` và `locked_until = now() + 10 phút`.
- **Luồng sự kiện chính (Basic Flow):**
  1. Host xem danh sách khung giờ của một sân `VENUE` và chọn khung giờ có trạng thái `AVAILABLE`.
  2. Host nhấn nút **"Giữ chỗ ngay (10 phút)"**.
  3. Hệ thống thực thi câu lệnh `UPDATE` nguyên tử có điều kiện kiểm tra đồng thời trạng thái `AVAILABLE` hoặc `LOCKED` nhưng đã quá hạn `locked_until`.
  4. Trả về thông tin slot đã khóa kèm đồng hồ đếm ngược 10:00 và chuyển thẳng sang bước tạo phòng ghép kèo.
- **Luồng thay thế:** Host chủ động nhấn "Hủy giữ chỗ" $\rightarrow$ hoàn nguyên slot về `AVAILABLE` và phát socket `slot:released`.
- **Luồng ngoại lệ:** Có người khác khóa slot trước vài mili-giây (`rowCount = 0`) $\rightarrow$ trả về HTTP `409 SLOT_TAKEN`, tự động làm mới lịch sân.

#### UC04 — Tạo Phòng Ghép Kèo & Mời qua Link/QR
- **Tác nhân:** `HOST`.
- **Luật áp dụng:** `BR-INT-01`.
- **Tiền điều kiện:** Host đang giữ một slot sân hợp lệ (`status = 'LOCKED'`, còn hạn hiệu lực).
- **Hậu điều kiện:** Tạo bản ghi `group_lobbies` (`status = 'OPEN'`), tự động thêm Host vào `lobby_members` (`status = 'JOINED'`), sinh mã mời `invite_code` và mã QR.
- **Luồng sự kiện chính (Basic Flow):**
  1. Từ màn hình giữ slot thành công, Host xác nhận thời hạn chốt đơn và nhấn **"Mở phòng ghép kèo"**.
  2. Hệ thống tạo phòng liên kết $1-1$ với `slot_id`, sinh mã mời ngẫu nhiên 6 ký tự duy nhất và ghi nhận Host là thành viên đầu tiên.
  3. Giao diện hiển thị màn hình Lobby Workspace kèm thẻ **Mã mời & Mã QR** để Host chia sẻ cho bạn bè.
- **Luồng ngoại lệ:** Slot đã hết hạn 10 phút $\rightarrow$ từ chối tạo phòng (`400 SLOT_EXPIRED_OR_USED`).

#### UC05 — Tham gia Phòng & Kiểm tra Cọc Uy tín
- **Tác nhân:** `MEMBER`.
- **Luật áp dụng:** `BR-REP-01`.
- **Tiền điều kiện:** Phòng đang ở trạng thái `OPEN`; người dùng đã đăng nhập.
- **Hậu điều kiện:** Tạo bản ghi `lobby_members` với mức `deposit_required` đúng theo phân hạng uy tín; phát sự kiện `lobby:members` cho toàn phòng.
- **Luồng sự kiện chính (Basic Flow):**
  1. Thành viên quét mã QR hoặc nhập liên kết `/lobby/:inviteCode` và nhấn **"Tham gia phòng"**.
  2. Hệ thống truy vấn điểm uy tín của thành viên và giá tiền sân để tính mức cọc theo `BR-REP-01`:
     - Nếu điểm $\ge 90$ (Hạng A): `deposit_required = 0`, cho phép vào phòng ngay.
  3. Ghi nhận `lobby_members` (`status = 'JOINED'`) và phát socket cập nhật danh sách thành viên thời gian thực.
- **Luồng thay thế:** Thành viên Hạng B (70–89đ) hoặc Hạng C (50–69đ) $\rightarrow$ hiển thị hộp thoại yêu cầu nộp cọc tương ứng 30% hoặc 100% phần tiền sân trước khi vào phòng.
- **Luồng ngoại lệ:** Thành viên có điểm $< 50$ (`FLAGGED`) $\rightarrow$ chặn tuyệt đối (`403 REPUTATION_TOO_LOW`).

#### UC06 — Giỏ hàng Chung & Chat Thời gian thực (Realtime Cart & Chat)
- **Tác nhân:** `HOST`, `MEMBER`.
- **Luật áp dụng:** `BR-INT-01`, `BR-INT-04`.
- **Tiền điều kiện:** Người dùng là thành viên `JOINED` của phòng; `group_lobbies.status = 'OPEN'`.
- **Hậu điều kiện:** Cập nhật bản ghi `cart_items`; phát sự kiện `cart:updated` và `chat:message` tới toàn bộ client trong room `lobby:{id}`.
- **Luồng sự kiện chính (Basic Flow):**
  1. Thành viên chọn món từ thực đơn quán FNB đã liên kết và nhấn "Thêm vào giỏ".
  2. Server kiểm tra trạng thái phòng `OPEN`, thực hiện lưu bản ghi `cart_items` và phát broadcast `cart:updated` trong $< 1000\text{ ms}$.
  3. Thành viên gửi tin nhắn trao đổi trong hộp chat $\rightarrow$ server lưu vào bộ đệm 50 tin nhắn và phát tới mọi người.
- **Luồng ngoại lệ:** Thao tác khi phòng đã chuyển sang `LOCKED` $\rightarrow$ server chặn ngay lập tức với lỗi `403 LOBBY_LOCKED`.

#### UC07 — Gợi ý Quán Thông minh & Áp dụng Voucher Chéo
- **Tác nhân:** `HOST`, Hệ thống.
- **Luật áp dụng:** `BR-INT-05`.
- **Tiền điều kiện:** Phòng đã có slot sân xác định.
- **Hậu điều kiện:** Danh sách quán FNB được sắp xếp theo điểm score gợi ý; mã voucher `CROSS` được áp dụng và ghi nhận vào `group_lobbies.voucher_id`.
- **Luồng sự kiện chính (Basic Flow):**
  1. Hệ thống tự động tính điểm gợi ý cho các quán FNB lân cận theo công thức 4 yếu tố (Khoảng cách 50%, Giờ mở cửa 30%, Độ phổ biến 20%, Thưởng Voucher chéo +0.15).
  2. Host chọn quán FNB có điểm cao nhất để liên kết vào phòng.
  3. Host nhập mã giảm giá chéo (ví dụ: `CROSS15`) $\rightarrow$ hệ thống kiểm tra điều kiện khoảng cách $\le 1000\text{ m}$ và chiết khấu thành công.
- **Luồng ngoại lệ:** Quán cách sân $> 1000\text{ m}$ $\rightarrow$ từ chối áp dụng voucher (`400 VOUCHER_DISTANCE_EXCEEDED`).

#### UC08 — Tự động Chia Bill (Largest Remainder) & Sinh VietQR
- **Tác nhân:** `HOST`, `MEMBER`, Hệ thống.
- **Luật áp dụng:** `BR-INT-02`.
- **Tiền điều kiện:** Host nhấn chốt đơn (`LOCKED`); phòng có ít nhất 1 thành viên.
- **Hậu điều kiện:** Sinh danh sách `split_bills` cho từng thành viên kèm URL VietQR chuẩn Napas 247; tổng tiền khớp tuyệt đối $\sum \text{total}_i \equiv \text{GrandTotal}$.
- **Luồng sự kiện chính (Basic Flow):**
  1. Host nhấn nút **"Chốt đơn & Chia tiền"**.
  2. Server thực thi thuật toán chia bill theo `BR-INT-02`: chia đều tiền sân, tính tiền món cá nhân, phân bổ phí ship/voucher, phân phối phần dư theo Largest Remainder và trừ tiền cọc đã đóng.
  3. Server tạo bản ghi `split_bills` và sinh URL ảnh VietQR chứa số tiền và nội dung chuyển khoản định danh.
  4. Giao diện của từng thành viên hiển thị thẻ thanh toán cá nhân và mã VietQR tương ứng.

#### UC09 — Giữ tiền Ví Trung gian Escrow
- **Tác nhân:** Hệ thống (Webhook giả lập).
- **Luật áp dụng:** `BR-ESC-01`.
- **Tiền điều kiện:** Đã tạo danh sách `split_bills`.
- **Hậu điều kiện:** `split_bills.status = 'PAID'`; sinh bản ghi `escrow_transactions` (`type = 'HOLD'`, `status = 'HELD'`).
- **Luồng sự kiện chính (Basic Flow):**
  1. Người dùng quét mã VietQR và thực hiện chuyển khoản.
  2. Hệ thống nhận tín hiệu qua Webhook `POST /api/payments/webhook-mock` kèm `{ splitBillId }`.
  3. Cập nhật hóa đơn con thành `PAID` và ghi nhận một khoản giữ tiền `HOLD` vào `escrow_transactions`.
  4. Khi 100% hóa đơn con trong phòng đều đạt `PAID`, phòng chuyển sang `PAID` và slot sân chính thức chuyển sang `BOOKED`.

#### UC10 — Xác nhận Check-in & Giải ngân Đa bên
- **Tác nhân:** `PROVIDER` (Chủ sân `VENUE`).
- **Luật áp dụng:** `BR-ESC-02`, `BR-ESC-03`, `BR-REP-02`, `BR-REP-03`.
- **Tiền điều kiện:** Phòng ở trạng thái `PAID`; đến khung giờ thi đấu.
- **Hậu điều kiện:** Escrow giải ngân ròng cho Venue (trừ 8%) và FnB (trừ 12%); thành viên có mặt được cộng +2 điểm uy tín; thành viên vắng mặt bị trừ -15 điểm và mất cọc.
- **Luồng sự kiện chính (Basic Flow):**
  1. Khách đến sân, Chủ sân thực hiện điểm danh danh sách thành viên trên Provider Portal.
  2. Chủ sân nhấn **"Xác nhận Check-in & Giải ngân"** (`POST /api/lobbies/:id/checkin`).
  3. Hệ thống tạo khóa `idempotency_key` duy nhất, tách quỹ Escrow giải ngân 92% tiền sân cho Venue và 88% tiền nước cho FnB.
  4. Tự động thưởng `+2` điểm uy tín cho người có mặt (`CHECKED_IN`) và phạt `-15` điểm kèm tịch thu cọc đối với người bùng kèo (`NO_SHOW`).
- **Luồng ngoại lệ:** Gọi giải ngân lần 2 với cùng mã phòng $\rightarrow$ Cổng Idempotency phát hiện trùng khóa và chặn ngay lập tức (`409 IDEMPOTENCY_DUPLICATE_RELEASE`).

#### UC11 — Gửi Khiếu nại & Đóng băng Escrow Từng phần
- **Tác nhân:** `MEMBER`.
- **Luật áp dụng:** `BR-ESC-04`.
- **Tiền điều kiện:** Thành viên đã thanh toán trong phòng có phát sinh sự cố (giao thiếu nước, sân hỏng).
- **Hậu điều kiện:** Tạo bản ghi `disputes` (`status = 'OPEN'`); đóng băng khoản tiền của đối tác bị khiếu nại trong Escrow (`FROZEN`).
- **Luồng sự kiện chính (Basic Flow):**
  1. Thành viên mở màn hình Khiếu nại, chọn đối tác vi phạm (`target_provider_id`), nhập lý do và tải lên hình ảnh bằng chứng (qua Multer).
  2. Server lưu bản ghi `disputes`, chuyển phòng sang `DISPUTED`.
  3. Đóng băng có chọn lọc: chỉ các giao dịch Escrow của đối tác bị khiếu nại chuyển sang `FROZEN`; khoản tiền của đối tác không liên quan vẫn được giải ngân bình thường.

#### UC12 — Phân xử Khiếu nại & Tra cứu Audit Logs
- **Tác nhân:** `ADMIN`.
- **Luật áp dụng:** `BR-DSP-01`.
- **Tiền điều kiện:** Có khiếu nại ở trạng thái `OPEN`.
- **Hậu điều kiện:** Khiếu nại chuyển `RESOLVED` hoặc `REJECTED`; thực hiện hoàn tiền một phần/toàn phần; lưu vết đầy đủ vào bảng `audit_logs`.
- **Luồng sự kiện chính (Basic Flow):**
  1. Admin truy cập Admin Dashboard, mở danh sách khiếu nại và xem chi tiết ảnh bằng chứng.
  2. Admin nhập số tiền hoàn trả (`refund_amount`) và nhấn **"Chấp thuận giải quyết (RESOLVED)"**.
  3. Hệ thống sinh giao dịch Escrow loại `REFUND` hoàn tiền cho người dùng, giải ngân phần còn lại cho đối tác.
  4. Toàn bộ thông tin thay đổi được ghi tự động vào bảng `audit_logs` với `action = 'DISPUTE_RESOLVE'`.

---

## 3.7 Sơ đồ Luồng Dữ liệu (Data Flow Diagrams — DFD)

### 3.7.1 Sơ đồ Ngữ cảnh DFD Mức 0 (Context Diagram)

```text
                  +--------------------------------------------+
                  |  [Thông tin đăng ký, tìm kiếm, khóa slot,  |
                  |   chọn món giỏ hàng, nộp cọc, gửi khiếu nại]
                  v                                            |
        +-------------------+                        +-------------------+
        |    NGƯỜI DÙNG     |                        |    HỆ THỐNG LÕI   |
        |  (HOST / MEMBER)  |<-----------------------|      SYNCHUB      |
        +-------------------+  [Mã mời, mã VietQR,   +-------------------+
                                giỏ hàng, kết quả]     ^               ^
                                                       |               |
       [Thông tin slot, menu,                          |               | [Quyết định phân xử,
        xác nhận check-in]                             |               |  tra cứu audit logs]
               v                                       |               v
        +-------------------+                          |     +-------------------+
        | ĐỐI TÁC CUNG CẤP  |--------------------------+     |  QUẢN TRỊ VIÊN    |
        |  (VENUE / FNB)    |<-------------------------------|     (ADMIN)       |
        +-------------------+  [Thông báo đơn, giải ngân     +-------------------+
                                doanh thu ròng 92%/88%]       [Báo cáo GMV, KPI,
                                                               danh sách tranh chấp]
```

### 3.7.2 Sơ đồ DFD Mức 1 (Toàn Hệ thống)

Toàn bộ hệ thống được phân rã thành 5 tiến trình nghiệp vụ cốt lõi:

```text
                                           +--------------------+
                                           | D1: USERS          |
                                           +--------------------+
                                            ^        ^        ^
        [Đăng ký/Đăng nhập]                 |        |        |
(User) ----------------------> [ 1.0 QUẢN TRỊ TÀI KHOẢN & TÍN NHIỆM ]
                                            |
                                            v (Thông tin uy tín & cọc)
        [Khóa slot 10']        +--------------------+
(Host) ----------------------> [ 2.0 QUẢN TRỊ ĐỊA ĐIỂM & KHÓA SLOT ] <---> [ D2: SLOTS / PROVIDERS ]
                                            |
                                            v (Slot đã khóa)
        [Tạo phòng / Chọn món] +--------------------+
(Users) ----------------------> [ 3.0 QUẢN LÝ PHÒNG & GIỎ HÀNG REALTIME ] <-> [ D3: GROUP_LOBBIES / CART ]
                                            |
                                            v (Giỏ hàng đã chốt LOCKED)
        [Chốt đơn / Quét QR]   +--------------------+
(Users) ----------------------> [ 4.0 TỰ ĐỘNG CHIA BILL & VIETQR ] <-----> [ D4: SPLIT_BILLS ]
                                            |
                                            v (Webhook thanh toán PAID)
        [Check-in / Khiếu nại] +--------------------+
(Admin/ ---------------------> [ 5.0 VÍ TRUNG GIAN ESCROW & TRANH CHẤP ] <-> [ D5: ESCROW / DISPUTES / AUDIT ]
 Provider)
```

### 3.7.3 Phân rã DFD Mức 2 Các Tiến trình Trọng tâm

#### 1. Phân rã Tiến trình 2.0: Quản lý Khung giờ & Khóa Slot Nguyên tử
- **2.1 Kiểm tra tính sẵn sàng của khung giờ:** Tiếp nhận yêu cầu khóa slot, truy vấn bảng `slots` với điều kiện `status = 'AVAILABLE' OR (status = 'LOCKED' AND locked_until < now())`.
- **2.2 Cập nhật nguyên tử (Atomic Lock):** Gán `status = 'LOCKED'`, `locked_by = userId`, `locked_until = now() + 10 phút`. Nếu không khớp dòng nào $\rightarrow$ phát sinh lỗi `409 Conflict`.
- **2.3 Tiến trình nền quét giải phóng (Background Sweep Job):** Định kỳ 60 giây quét các slot quá hạn `locked_until` để hoàn nguyên về `AVAILABLE` và phát sự kiện `slot:released`.

#### 2. Phân rã Tiến trình 3.0: Quản lý Phòng ghép kèo & Giỏ hàng Realtime
- **3.1 Mở phòng & Sinh mã định danh:** Gắn `slot_id`, tạo mã `invite_code` 6 ký tự và mã QR.
- **3.2 Thẩm định cọc gia nhập:** Đọc điểm uy tín thành viên, tính mức cọc dự kiến (A: 0%, B: 30%, C: 100%, FLAGGED: Chặn 403) và lưu vào `lobby_members`.
- **3.3 Xử lý giỏ hàng hướng sự kiện:** Nhận sự kiện `cart:add/update/remove`, ghi bản ghi `cart_items` và phát broadcast `cart:updated` cho toàn room.
- **3.4 Khóa giỏ tức thì:** Nhận lệnh khóa phòng từ Host, chuyển trạng thái `LOCKED`, phát sự kiện `lobby:locked` vô hiệu hóa thao tác sửa đổi.

#### 3. Phân rã Tiến trình 4.0: Tự động Chia Bill & Sinh VietQR
- **4.1 Tổng hợp chi phí phòng:** Tính tiền sân ròng, tiền món cá nhân, phân bổ phí ship và voucher.
- **4.2 Thực thi thuật toán Largest Remainder:** Tính phần nguyên `Math.floor`, phân phối phần dư cho các thành viên có phần lẻ lớn nhất (ưu tiên Host).
- **4.3 Khấu trừ tiền cọc & Assert kiểm toán:** Trừ phần cọc `deposit_paid`, kiểm tra đẳng thức $\sum \text{total}_i \equiv \text{GrandTotal}$.
- **4.4 Sinh URL VietQR Napas 247:** Tạo link ảnh QR cá nhân hóa kèm cú pháp định danh duy nhất.

#### 4. Phân rã Tiến trình 5.0: Ví Escrow, Phân xử Tranh chấp & Kiểm toán
- **5.1 Tiếp nhận Webhook thanh toán:** Chuyển `split_bills` sang `PAID`, tạo giao dịch `escrow_transactions` loại `HOLD` (`status = 'HELD'`).
- **5.2 Check-in & Giải ngân Idempotency:** Kiểm tra khóa `idempotency_key`, khấu trừ hoa hồng 8% sân và 12% F&B, chuyển trạng thái sang `RELEASED`.
- **5.3 Đóng băng khiếu nại:** Tiếp nhận khiếu nại kèm ảnh từ Multer, chuyển các giao dịch Escrow của đối tác bị khiếu nại sang `FROZEN`.
- **5.4 Phân xử Admin & Ghi nhật ký kiểm toán:** Thực thi hoàn tiền `REFUND`, giải ngân phần dư và ghi lại `before/after` JSON vào bảng `audit_logs`.

---

## 3.8 Thiết kế Cơ sở Dữ liệu (Database Design) & Từ điển Dữ liệu (Data Dictionary)

### 3.8.1 Sơ đồ Thực thể Liên kết (Entity Relationship Diagram — ERD)

```text
+-------------------+       1:N       +-------------------+       1:N       +-------------------+
|       users       |----------------<|     providers     |----------------<|       slots       |
| (Tài khoản/Uy tín)|                 | (Sân bãi / Quán)  |                 | (Khung giờ đặt)   |
+-------------------+                 +-------------------+                 +-------------------+
        |   ^                                   |                                     |
        |   | 1:N (Host)                        | 1:N                                 | 1:1
        |   +--------------------+              v                                     v
        |                        |    +-------------------+                 +-------------------+
        | 1:N (Member)           +--->|   group_lobbies   |<----------------|   group_lobbies   |
        v                             | (Phòng ghép kèo)  |                 +-------------------+
+-------------------+                 +-------------------+                           |
|   lobby_members   |                   |               |                             | 1:N
| (Thành viên & Cọc)|<------------------+               | 1:N                         v
+-------------------+     1:N                           v                   +-------------------+
        |                                     +-------------------+         |    split_bills    |
        | 1:N                                 |    cart_items     |         | (Hóa đơn VietQR)  |
        v                                     | (Giỏ hàng chung)  |         +-------------------+
+-------------------+                         +-------------------+                   |
|     disputes      |                                   ^                             | 1:N
| (Khiếu nại/Ảnh)   |                                   | 1:N                         v
+-------------------+                                   |                   +-------------------+
        ^                                     +-------------------+         |escrow_transactions|
        | 1:N                                 |    menu_items     |         | (Sổ cái Escrow)   |
+-------------------+                         | (Thực đơn món)    |         +-------------------+
|    audit_logs     |                         +-------------------+
| (Nhật ký kiểm toán|
+-------------------+
```

### 3.8.2 Từ điển Dữ liệu Chi tiết 12 Bảng (Data Dictionary)

#### 1. Bảng `users` — Tài khoản người dùng & Tín nhiệm
Lưu trữ thông tin định danh, vai trò phân quyền và điểm số uy tín của tất cả người dùng trong hệ thống.

| Tên trường (Column) | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Diễn giải ý nghĩa |
|---|---|---|---|---|
| `id` | `UUID / String` | PK, Not Null | `uuid()` | Khóa chính định danh người dùng duy nhất |
| `email` | `String` | Unique, Not Null | — | Email đăng nhập hệ thống |
| `password_hash` | `String` | Not Null | — | Mật khẩu băm an toàn bằng thuật toán `bcrypt` |
| `full_name` | `String` | Not Null | — | Họ và tên đầy đủ |
| `phone` | `String` | Not Null | — | Số điện thoại liên hệ |
| `role` | `Enum (Role)` | Not Null | `'MEMBER'` | Vai trò: `HOST`, `MEMBER`, `PROVIDER`, `ADMIN` |
| `reputation_score` | `Int` | Not Null | `100` | Điểm uy tín tín nhiệm (thang điểm 0 – 100) |
| `status` | `Enum (UserStatus)` | Not Null | `'ACTIVE'` | Trạng thái tài khoản: `ACTIVE`, `FLAGGED`, `BANNED` |
| `created_at` | `DateTime` | Not Null | `now()` | Thời điểm tạo tài khoản |

#### 2. Bảng `providers` — Cơ sở Sân bãi & Quán ăn uống
Lưu trữ thông tin hồ sơ, tọa độ địa lý và tài khoản nhận tiền của các đối tác cung cấp dịch vụ.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Diễn giải ý nghĩa |
|---|---|---|---|---|
| `id` | `UUID / String` | PK, Not Null | `uuid()` | Khóa chính định danh cơ sở |
| `owner_id` | `UUID / String` | FK, Not Null | — | Khóa ngoại tham chiếu `users(id)` (xóa cascade) |
| `type` | `Enum (ProviderType)`| Not Null | — | Phân loại: `VENUE` (Sân thể thao) hoặc `FNB` (Ăn uống) |
| `category` | `String` | Not Null | — | Danh mục: `badminton`, `study_room`, `football`, `milk_tea`... |
| `name` | `String` | Not Null | — | Tên hiển thị của cơ sở kinh doanh |
| `address` | `String` | Not Null | — | Địa chỉ thực tế |
| `lat` | `Float` | Not Null | — | Tọa độ vĩ độ (Latitude) phục vụ bản đồ |
| `lng` | `Float` | Not Null | — | Tọa độ kinh độ (Longitude) phục vụ bản đồ |
| `open_hours` | `String` | Not Null | `'07:00-22:00'` | Khung giờ mở cửa hoạt động |
| `bank_code` | `String` | Not Null | `'MB'` | Mã ngân hàng nhận tiền (theo chuẩn Napas) |
| `bank_account` | `String` | Not Null | `'0123456789'` | Số tài khoản ngân hàng thụ hưởng |
| `commission_rate` | `Float` | Not Null | `0.08` | Tỷ lệ hoa hồng sàn (`VENUE = 0.08`, `FNB = 0.12`) |
| `created_at` | `DateTime` | Not Null | `now()` | Thời điểm đối tác đăng ký |

#### 3. Bảng `slots` — Khung giờ đặt chỗ sân thể thao / phòng học
Quản lý trạng thái giữ chỗ tạm thời và đặt chính thức của từng khung giờ dịch vụ.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Diễn giải ý nghĩa |
|---|---|---|---|---|
| `id` | `UUID / String` | PK, Not Null | `uuid()` | Khóa chính định danh khung giờ |
| `provider_id` | `UUID / String` | FK, Not Null | — | Khóa ngoại tham chiếu `providers(id)` |
| `start_at` | `DateTime` | Not Null | — | Thời điểm bắt đầu khung giờ |
| `end_at` | `DateTime` | Not Null | — | Thời điểm kết thúc khung giờ |
| `price` | `Int` | Not Null | — | Giá thuê sân (VND, số nguyên) |
| `status` | `Enum (SlotStatus)` | Not Null | `'AVAILABLE'` | Trạng thái: `AVAILABLE`, `LOCKED`, `BOOKED` |
| `locked_by` | `UUID / String` | FK, Nullable | `null` | Khóa ngoại tham chiếu `users(id)` người đang giữ chỗ |
| `locked_until` | `DateTime` | Nullable | `null` | Thời hạn hết hiệu lực giữ chỗ 10 phút |

*Ràng buộc đặc biệt:* `UNIQUE(provider_id, start_at)` ngăn chặn tuyệt đối việc tạo 2 slot trùng giờ trên cùng 1 sân.

#### 4. Bảng `menu_items` — Thực đơn món ăn / đồ uống
Danh mục các món ăn, thức uống do đối tác `FNB` cung cấp.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Diễn giải ý nghĩa |
|---|---|---|---|---|
| `id` | `UUID / String` | PK, Not Null | `uuid()` | Khóa chính định danh món ăn/nước |
| `provider_id` | `UUID / String` | FK, Not Null | — | Khóa ngoại tham chiếu `providers(id)` |
| `name` | `String` | Not Null | — | Tên món (VD: Trà đào cam sả, Nước tăng lực...) |
| `price` | `Int` | Not Null | — | Đơn giá món (VND, số nguyên) |
| `image_url` | `String` | Nullable | `null` | Đường dẫn ảnh minh họa món |
| `is_available` | `Boolean` | Not Null | `true` | Trạng thái còn món hay tạm hết |
| `order_count` | `Int` | Not Null | `0` | Số lượt đã đặt (phục vụ thuật toán gợi ý) |

#### 5. Bảng `group_lobbies` — Phòng ghép kèo tích hợp BookSlot + GroupOrder
Bảng trung tâm liên kết khung giờ đặt sân với giỏ hàng gọi món nhóm và luồng thanh toán.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Diễn giải ý nghĩa |
|---|---|---|---|---|
| `id` | `UUID / String` | PK, Not Null | `uuid()` | Khóa chính định danh phòng |
| `host_id` | `UUID / String` | FK, Not Null | — | Khóa ngoại tham chiếu `users(id)` của Host |
| `slot_id` | `UUID / String` | FK, Unique, Not Null | — | Khóa ngoại liên kết 1-1 với `slots(id)` |
| `fnb_provider_id`| `UUID / String` | FK, Nullable | `null` | Khóa ngoại tham chiếu quán `providers(id)` được chọn |
| `invite_code` | `String` | Unique, Not Null | — | Mã mời tham gia phòng 6 ký tự viết hoa |
| `status` | `Enum (LobbyStatus)`| Not Null | `'OPEN'` | `OPEN`, `LOCKED`, `AWAITING_PAYMENT`, `PAID`, `COMPLETED`, `DISPUTED`, `CANCELLED` |
| `deadline_at` | `DateTime` | Not Null | — | Hạn chót đóng phòng để chốt đơn |
| `ship_fee` | `Int` | Not Null | `15000` | Phí giao hàng đồ uống tới sân (VND) |
| `voucher_id` | `UUID / String` | FK, Nullable | `null` | Khóa ngoại tham chiếu `vouchers(id)` |
| `locked_at` | `DateTime` | Nullable | `null` | Thời điểm Host bấm chốt khóa giỏ hàng |
| `created_at` | `DateTime` | Not Null | `now()` | Thời điểm mở phòng |

#### 6. Bảng `lobby_members` — Thành viên phòng & Tiền cọc uy tín
Quản lý danh sách thành viên tham gia phòng và số tiền cọc đã đóng theo luật tín nhiệm.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Diễn giải ý nghĩa |
|---|---|---|---|---|
| `lobby_id` | `UUID / String` | PK, FK, Not Null | — | Khóa ngoại tham chiếu `group_lobbies(id)` |
| `user_id` | `UUID / String` | PK, FK, Not Null | — | Khóa ngoại tham chiếu `users(id)` |
| `deposit_required`| `Int` | Not Null | `0` | Tiền cọc bắt buộc theo phân hạng uy tín (VND) |
| `deposit_paid` | `Int` | Not Null | `0` | Tiền cọc thực tế đã nộp (VND) |
| `status` | `Enum (LobbyMemberStatus)`| Not Null | `'JOINED'` | `JOINED`, `LEFT`, `NO_SHOW`, `CHECKED_IN` |
| `joined_at` | `DateTime` | Not Null | `now()` | Thời điểm tham gia phòng |

*Khóa chính kết hợp:* `PRIMARY KEY (lobby_id, user_id)`.

#### 7. Bảng `cart_items` — Giỏ hàng gọi món chung trong phòng
Lưu chi tiết từng món đồ uống do các thành viên thêm vào giỏ hàng chung.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Diễn giải ý nghĩa |
|---|---|---|---|---|
| `id` | `UUID / String` | PK, Not Null | `uuid()` | Khóa chính định danh dòng giỏ hàng |
| `lobby_id` | `UUID / String` | FK, Not Null | — | Khóa ngoại tham chiếu `group_lobbies(id)` |
| `user_id` | `UUID / String` | FK, Not Null | — | Khóa ngoại tham chiếu `users(id)` người chọn món |
| `menu_item_id` | `UUID / String` | FK, Not Null | — | Khóa ngoại tham chiếu `menu_items(id)` |
| `qty` | `Int` | Not Null | — | Số lượng đặt (tối thiểu 1) |
| `unit_price_snapshot`| `Int` | Not Null | — | Đơn giá tại thời điểm đặt (VND, chống đổi giá sau) |
| `created_at` | `DateTime` | Not Null | `now()` | Thời điểm thêm vào giỏ |

#### 8. Bảng `vouchers` — Mã khuyến mãi đơn lẻ & chéo
Quản lý các chương trình ưu đãi giảm giá và điều kiện áp dụng liên ngành.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Diễn giải ý nghĩa |
|---|---|---|---|---|
| `id` | `UUID / String` | PK, Not Null | `uuid()` | Khóa chính định danh voucher |
| `code` | `String` | Unique, Not Null | — | Mã khuyến mãi (VD: `CROSS15`, `SYNCHUB`) |
| `scope` | `Enum (VoucherScope)`| Not Null | — | Phạm vi: `VENUE`, `FNB`, `CROSS` (ưu đãi chéo) |
| `discount_type`| `Enum (DiscountType)`| Not Null | — | Hình thức: `PERCENT` (%) hoặc `FIXED` (VND) |
| `value` | `Int` | Not Null | — | Giá trị chiết khấu (% hoặc số tiền VND) |
| `max_discount` | `Int` | Not Null | — | Mức giảm tối đa (VND) |
| `min_order` | `Int` | Not Null | `0` | Giá trị đơn tối thiểu để được áp dụng (VND) |
| `max_distance_m`| `Int` | Not Null | `1000` | Cự ly tối đa giữa Sân và Quán (m) áp dụng cho `CROSS` |
| `valid_from` | `DateTime` | Not Null | — | Ngày bắt đầu hiệu lực |
| `valid_to` | `DateTime` | Not Null | — | Ngày kết thúc hiệu lực |
| `usage_limit` | `Int` | Not Null | `100` | Tổng lượt sử dụng tối đa |
| `used_count` | `Int` | Not Null | `0` | Số lượt đã sử dụng |

#### 9. Bảng `split_bills` — Hóa đơn chia tiền từng thành viên & VietQR
Lưu kết quả phân bổ chi phí chuẩn xác và thông tin thanh toán cá nhân hóa.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Diễn giải ý nghĩa |
|---|---|---|---|---|
| `id` | `UUID / String` | PK, Not Null | `uuid()` | Khóa chính định danh hóa đơn con |
| `lobby_id` | `UUID / String` | FK, Not Null | — | Khóa ngoại tham chiếu `group_lobbies(id)` |
| `user_id` | `UUID / String` | FK, Not Null | — | Khóa ngoại tham chiếu `users(id)` |
| `slot_share` | `Int` | Not Null | — | Phần tiền sân phải chịu sau giảm giá (VND) |
| `food_amount` | `Int` | Not Null | — | Tổng tiền món ăn/nước cá nhân đã chọn (VND) |
| `ship_share` | `Int` | Not Null | — | Phần phí vận chuyển được phân bổ (VND) |
| `discount_share`| `Int` | Not Null | — | Phần chiết khấu voucher được phân bổ (VND) |
| `deposit_offset`| `Int` | Not Null | `0` | Tiền cọc đã nộp được khấu trừ trực tiếp (VND) |
| `total` | `Int` | Not Null | — | **Số tiền thực tế phải thanh toán cuối cùng (VND)** |
| `vietqr_url` | `String` | Not Null | — | Đường dẫn ảnh mã VietQR Napas 247 động |
| `status` | `Enum (SplitBillStatus)`| Not Null | `'PENDING'` | Trạng thái thanh toán: `PENDING`, `PAID`, `REFUNDED` |
| `paid_at` | `DateTime` | Nullable | `null` | Thời điểm thanh toán thành công |

*Ràng buộc duy nhất:* `UNIQUE(lobby_id, user_id)`.

#### 10. Bảng `escrow_transactions` — Sổ cái ví giữ tiền trung gian Escrow
Lưu vết chi tiết toàn bộ các dòng tiền giữ, giải ngân, bồi hoàn và xử phạt trong hệ thống.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Diễn giải ý nghĩa |
|---|---|---|---|---|
| `id` | `UUID / String` | PK, Not Null | `uuid()` | Khóa chính định danh giao dịch Escrow |
| `lobby_id` | `UUID / String` | FK, Not Null | — | Khóa ngoại tham chiếu `group_lobbies(id)` |
| `split_bill_id` | `UUID / String` | FK, Nullable | `null` | Khóa ngoại tham chiếu hóa đơn con liên quan |
| `type` | `Enum (EscrowTxType)`| Not Null | — | Loại giao dịch: `HOLD`, `RELEASE`, `REFUND`, `PENALTY` |
| `amount` | `Int` | Not Null | — | Tổng số tiền của giao dịch (VND) |
| `platform_fee` | `Int` | Not Null | `0` | Doanh thu hoa hồng sàn thu về (8% hoặc 12%) |
| `net_amount` | `Int` | Not Null | `0` | Doanh thu ròng thực nhận của đối tác (VND) |
| `payee_provider_id`| `UUID / String`| FK, Nullable | `null` | Đối tác thụ hưởng khoản tiền giải ngân |
| `status` | `Enum (EscrowStatus)`| Not Null | `'HELD'` | Trạng thái: `HELD`, `RELEASED`, `REFUNDED`, `FROZEN` |
| `idempotency_key`| `String` | Unique, Not Null | — | Khóa duy nhất chống giải ngân đúp |
| `created_at` | `DateTime` | Not Null | `now()` | Thời điểm ghi nhận giao dịch |

#### 11. Bảng `disputes` — Khiếu nại dịch vụ & Tranh chấp
Quản lý các sự cố phát sinh, chứng cứ hình ảnh và kết quả phân xử của Quản trị viên.

| Tên trường | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Diễn giải ý nghĩa |
|---|---|---|---|---|
| `id` | `UUID / String` | PK, Not Null | `uuid()` | Khóa chính định danh khiếu nại |
| `lobby_id` | `UUID / String` | FK, Not Null | — | Khóa ngoại tham chiếu `group_lobbies(id)` |
| `reporter_id` | `UUID / String` | FK, Not Null | — | Khóa ngoại tham chiếu `users(id)` người khiếu nại |
| `target_provider_id`| `UUID / String`| FK, Not Null | — | Khóa ngoại tham chiếu đối tác bị khiếu nại |
| `reason` | `String` | Not Null | — | Nội dung mô tả sự cố |
| `evidence_urls` | `String[]` | Not Null | `[]` | Mảng đường dẫn ảnh chứng cứ tải lên qua Multer |
| `status` | `Enum (DisputeStatus)`| Not Null | `'OPEN'` | Trạng thái: `OPEN`, `RESOLVED`, `REJECTED` |
| `refund_amount` | `Int` | Not Null | `0` | Số tiền Admin quyết định hoàn trả người dùng (VND) |
| `resolved_by` | `UUID / String` | FK, Nullable | `null` | Khóa ngoại tham chiếu Admin phân xử |
| `resolved_at` | `DateTime` | Nullable | `null` | Thời điểm hoàn tất phân xử |
| `created_at` | `DateTime` | Not Null | `now()` | Thời điểm gửi khiếu nại |

#### 12. Bảng `audit_logs` — Nhật ký kiểm toán hệ thống
Lưu vết lịch sử thay đổi trạng thái đối với các thao tác nhạy cảm (tín nhiệm, tiền tệ, phân xử).

| Tên trường | Kiểu dữ liệu | Ràng buộc | Giá trị mặc định | Diễn giải ý nghĩa |
|---|---|---|---|---|
| `id` | `UUID / String` | PK, Not Null | `uuid()` | Khóa chính bản ghi kiểm toán |
| `actor_id` | `UUID / String` | FK, Nullable | `null` | Khóa ngoại tham chiếu người thực hiện hành động |
| `action` | `String` | Not Null | — | Tên hành động: `REPUTATION_CHANGE`, `DISPUTE_RESOLVE`... |
| `entity` | `String` | Not Null | — | Bảng bị tác động: `users`, `disputes`, `escrow_transactions` |
| `entity_id` | `String` | Not Null | — | ID của bản ghi bị tác động |
| `before` | `Json` | Nullable | `null` | Trạng thái dữ liệu trước khi thay đổi (JSON snapshot) |
| `after` | `Json` | Nullable | `null` | Trạng thái dữ liệu sau khi thay đổi (JSON snapshot) |
| `created_at` | `DateTime` | Not Null | `now()` | Thời điểm ghi nhận log |

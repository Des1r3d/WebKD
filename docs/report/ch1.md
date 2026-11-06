# Chương 1: Tổng quan Đề tài & Mô hình Kinh doanh (SyncHub)

---

## 1.1 Bối cảnh & Bài toán Thực tế

Trong đời sống sinh viên và giới trẻ tại các khu đô thị đại học (điển hình là Khu đô thị Đại học Quốc gia TP.HCM — Làng Đại học Thủ Đức), nhu cầu sinh hoạt nhóm diễn ra hàng ngày dưới hai hình thức luôn đi kèm nhau:
1. **Đặt chỗ không gian sinh hoạt chung (`BookSlot`):** Đặt sân cầu lông, sân bóng đá mini, hoặc phòng học nhóm/co-working space theo khung giờ cố định.
2. **Gọi đồ ăn thức uống theo nhóm (`GroupOrder`):** Đặt trà sữa, cà phê, nước giải khát hoặc đồ ăn nhẹ giao tới đúng địa điểm và khung giờ sinh hoạt.

Hiện nay, hai nhu cầu này bị phân mảnh trên các nền tảng rời rạc và công cụ thủ công:
- **Quy trình đặt sân rời rạc:** Trưởng nhóm (Host) phải nhắn tin qua Zalo/Facebook hoặc gọi điện cho chủ sân, dễ xảy ra tình trạng trùng lịch (double-booking) vào giờ cao điểm (17h00 – 21h00).
- **Gọi nước và gom đơn thủ công:** Sau khi chốt sân, Host phải gửi link quán nước vào nhóm chat, từng thành viên nhắn món, Host tự tổng hợp và ứng tiền trả trước.
- **Chia tiền phức tạp và dễ sai sót:** Tiền sân chia đều cho số người tham gia, trong khi tiền nước tính theo món cá nhân, cộng thêm phí giao hàng và trừ mã giảm giá theo tỷ lệ. Việc tính nhẩm hoặc lập bảng Excel thủ công sau mỗi buổi chơi tốn nhiều thời gian và dễ lệch số lẻ.
- **Rủi ro "bùng kèo" (No-show) và thiếu cam kết tài chính:** Thành viên đăng ký tham gia nhưng hủy sát giờ hoặc không đến khiến những người còn lại phải gánh thêm chi phí sân, hoặc Host bị mất tiền cọc với chủ sân.

**Giải pháp đề xuất — SyncHub (`BookSlot + GroupOrder`):**
SyncHub là nền tảng Thương mại điện tử hai chiều (Two-sided Marketplace) tích hợp liền mạch quy trình **Đặt khung giờ dịch vụ (BookSlot)** và **Gọi đồ nhóm thời gian thực (GroupOrder)** trong cùng một phòng ghép kèo (`GroupLobby`), kết hợp cơ chế **Tín nhiệm người dùng (`Reputation Score`)**, **Tự động chia hóa đơn (`Split Bill + VietQR`)** và **Giữ tiền trung gian (`Escrow`)** giải ngân đa bên.

---

## 1.2 Mô hình Kinh doanh — Business Model Canvas (BMC)

| Khối BMC | Nội dung chi tiết tại SyncHub |
|---|---|
| **1. Phân khúc Khách hàng (Customer Segments)** | - **Người dùng cuối (Users):** Sinh viên, nhóm bạn trẻ, câu lạc bộ tại khu vực Làng ĐH Thủ Đức (vai trò `HOST` — người khởi tạo kèo và `MEMBER` — thành viên tham gia).<br>- **Đối tác cung cấp (`PROVIDER`):** (1) `VENUE` — Chủ sân cầu lông, sân bóng mini, không gian học nhóm; (2) `FNB` — Quán trà sữa, cà phê, đồ ăn vặt trong bán kính $\le 1\text{ km}$ quanh các cụm sân. |
| **2. Giá trị Đề xuất (Value Propositions)** | - **Với Host & Member:** Đặt sân + gọi nước chung trong $\le 3$ bước; giỏ hàng đồng bộ thời gian thực (`< 1s`); tự động chia bill chính xác đến từng đồng kèm mã VietQR cá nhân; chống bùng kèo nhờ hệ thống điểm uy tín & tiền cọc.<br>- **Với Venue Provider:** Lấp đầy khung giờ trống, khóa lịch tự động chống trùng, nhận tiền cọc bồi thường nếu khách no-show.<br>- **Với FnB Provider:** Nhận đơn hàng nhóm giá trị lớn (High AOV) gắn liền với địa điểm và giờ giao cố định tại sân, tăng đơn nhờ gợi ý chéo (`CROSS Voucher`). |
| **3. Kênh phân phối (Channels)** | - Ứng dụng Web Responsive (Desktop & Mobile Browser) tối ưu thao tác quét QR.<br>- Cơ chế lan truyền tự nhiên (Viral Loop) qua Link mời phòng (`/lobby/:inviteCode`) và mã QR chia sẻ trực tiếp lên Zalo/Messenger. |
| **4. Quan hệ Khách hàng (Customer Relationships)** | - Tự phục vụ (Self-service) thông qua giao diện thời gian thực.<br>- Cơ chế đánh giá tự động qua Điểm uy tín (`Reputation Score` 0–100, phân hạng A/B/C).<br>- Bảo vệ người mua qua ví giữ tiền tạm thời (`Escrow`) và quy trình phân xử khiếu nại minh bạch của `ADMIN`. |
| **5. Dòng Doanh thu (Revenue Streams)** | - **Hoa hồng giao dịch đặt sân (`VENUE Commission`):** Thu **8%** trên giá trị tiền sân giải ngân thành công.<br>- **Hoa hồng đơn hàng đồ uống (`FNB Commission`):** Thu **12%** trên giá trị đơn đồ ăn/thức uống giải ngân thành công.<br>- *(Mở rộng tương lai):* Phí tài trợ hiển thị ưu tiên (Sponsored Listing) trên bản đồ và danh sách gợi ý. |
| **6. Nguồn lực Chính (Key Resources)** | - Hệ thống lõi: Thuật toán khóa slot nguyên tử (`SlotLock`), bộ chia hóa đơn (`SplitBill` — Largest Remainder), sổ cái `Escrow` chống giải ngân trùng (`Idempotency Key`), và hạ tầng WebSocket (`Socket.io`).<br>- Cơ sở dữ liệu không gian địa lý (`lat, lng`) của mạng lưới sân và quán quanh Làng ĐH Thủ Đức. |
| **7. Hoạt động Chính (Key Activities)** | - Vận hành nền tảng đặt chỗ, đồng bộ giỏ hàng nhóm, đối soát thanh toán VietQR và giải ngân tự động sau khi Check-in.<br>- Quản trị rủi ro: Kiểm duyệt tài khoản bị gắn cờ (`FLAGGED`), phân xử tranh chấp dịch vụ (`Disputes`) và lưu vết kiểm toán (`Audit Logs`). |
| **8. Đối tác Chính (Key Partners)** | - Các cụm sân thể thao, phòng học nhóm và chuỗi quán nước địa phương tại Khu đô thị ĐHQG TP.HCM.<br>- Dịch vụ tạo mã thanh toán chuẩn Napas247 (`VietQR.io`) và dữ liệu bản đồ mở (`OpenStreetMap / Leaflet`). |
| **9. Cơ cấu Chi phí (Cost Structure)** | - Chi phí hạ tầng máy chủ (Cloud Server, PostgreSQL Database, WebSocket connection).<br>- Chi phí tài trợ mã giảm giá chéo (`CROSS Voucher`) kích cầu giai đoạn đầu.<br>- Chi phí vận hành, chăm sóc khách hàng và xử lý khiếu nại. |

---

## 1.3 Phạm vi Hệ thống (System Scope)

### 1.3.1 Phạm vi thực hiện (In-Scope)
- **4 Phân quyền người dùng (`RBAC`):** `HOST` (tạo phòng, khóa slot, chốt đơn), `MEMBER` (tham gia phòng, đặt món, thanh toán phần cá nhân), `PROVIDER` (quản lý lịch sân `VENUE` hoặc thực đơn `FNB`, xác nhận check-in, xem doanh thu), `ADMIN` (xử lý khiếu nại, hoàn tiền Escrow, xem thống kê & `audit_logs`).
- **Bản đồ & Tìm kiếm đa tiêu chí:** Tìm kiếm sân và quán theo tọa độ thực tế tại Làng ĐH Thủ Đức với bộ lọc bán kính, mức giá, danh mục.
- **Đặt giữ chỗ nguyên tử (`BR-SLT-01/02`):** Giữ slot trong 10 phút bằng giao dịch cơ sở dữ liệu chống race condition, tự động nhả slot khi hết hạn.
- **Phòng ghép kèo & Giỏ hàng thời gian thực (`BR-INT-01..05`):** Mời qua mã QR/Link, kiểm tra hạng uy tín để yêu cầu cọc (`BR-REP-01`), thêm/sửa/xóa món đồng bộ tức thì qua `Socket.io`, gợi ý quán thông minh và áp dụng mã giảm giá chéo (`CROSS`).
- **Chia hóa đơn tự động & VietQR (`BR-INT-02`):** Phân bổ tiền sân, tiền món cá nhân, phí ship và khuyến mãi theo đúng công thức toán học, đảm bảo tổng các phần khớp tuyệt đối tổng hóa đơn.
- **Ví trung gian Escrow & Giải ngân đa bên (`BR-ESC-01..04`):** Giữ tiền (`HOLD`), tách dòng tiền trả cho `VENUE` (trừ 8%) và `FNB` (trừ 12%) khi check-in, chống giải ngân trùng bằng `idempotency_key`, đóng băng khoản tiền khi có khiếu nại (`FROZEN`).

### 1.3.2 Phạm vi loại trừ (Out-of-Scope)
- **Không tích hợp cổng thanh toán ngân hàng thật (Real Banking API):** Hệ thống sinh mã **VietQR thật** (quét được bằng ứng dụng ngân hàng để hiện đúng số tiền và nội dung chuyển khoản), nhưng bước xác nhận tiền vào được thực hiện qua **Webhook giả lập (`POST /api/payments/webhook-mock`)** để phục vụ kiểm thử và trình diễn.
- **Không điều phối tài xế giao hàng thực tế:** Phí vận chuyển (`ship_fee`) được tính cố định hoặc theo khoảng cách đường chim bay; quán `FNB` tự giao đến sân theo khung giờ của `Slot`.
- **Không phát triển ứng dụng Mobile Native (iOS/Android):** Giao diện được xây dựng dưới dạng Responsive Web App hoạt động mượt trên cả trình duyệt máy tính và điện thoại.

---

## 1.4 Yêu cầu Chức năng (FR) & Phi chức năng (NFR)

### 1.4.1 Yêu cầu Chức năng (Functional Requirements — FR)

| Mã FR | Phân hệ | Mô tả yêu cầu | Use Case |
|---|---|---|---|
| **FR-01** | Auth & Reputation | Đăng ký, đăng nhập JWT, phân quyền 4 role; hiển thị điểm uy tín (khởi tạo 100) và hạng thành viên (`A`, `B`, `C`, `FLAGGED`). | UC01 |
| **FR-02** | Discovery & Map | Tìm kiếm `VENUE` và `FNB` theo từ khóa, danh mục, khoảng giá, bán kính địa lý (`lat, lng`) và hiển thị trực quan trên bản đồ Leaflet. | UC02 |
| **FR-03** | Atomic Slot Lock | Giữ chỗ khung giờ sân trong 10 phút; ngăn chặn tuyệt đối 2 người dùng khóa cùng 1 slot tại cùng thời điểm; tự động mở khóa khi quá hạn. | UC03 |
| **FR-04** | Group Lobby | Khởi tạo phòng ghép kèo gắn với slot đã giữ; sinh mã mời (`invite_code`) và mã QR; kiểm tra điểm uy tín để tính mức cọc khi thành viên vào phòng. | UC04, UC05 |
| **FR-05** | Realtime GroupOrder | Đồng bộ giỏ hàng chung (`cart:add/update/remove`) và tin nhắn chat giữa mọi thành viên trong phòng qua WebSocket; khóa thao tác giỏ hàng tức thì khi Host chốt đơn. | UC06 |
| **FR-06** | Smart Recommend & Promo | Gợi ý quán `FNB` xung quanh sân dựa trên khoảng cách, giờ mở cửa và độ phổ biến; kiểm tra điều kiện áp dụng voucher `VENUE`, `FNB` và `CROSS` ($\le 1\text{ km}$). | UC07 |
| **FR-07** | Split Bill & VietQR | Tính toán chi phí từng thành viên theo công thức `BR-INT-02` (làm tròn Largest Remainder) và tạo mã VietQR cá nhân hóa cho từng người. | UC08 |
| **FR-08** | Escrow & Multi-party Payout | Ghi nhận thanh toán vào trạng thái giữ tiền (`HELD`); khi Check-in, tự động khấu trừ hoa hồng (8% VENUE, 12% FNB) và giải ngân cho các đối tác với `idempotency_key`. | UC09, UC10 |
| **FR-09** | Dispute & Audit | Cho phép gửi khiếu nại kèm ảnh minh chứng để đóng băng khoản tiền liên quan; Admin phân xử hoàn tiền một phần/toàn phần và ghi nhật ký kiểm toán (`audit_logs`). | UC11, UC12 |

### 1.4.2 Yêu cầu Phi chức năng (Non-Functional Requirements — NFR)

| Mã NFR | Thuộc tính chất lượng | Chỉ số cam kết (SLA / Metric) | Cơ chế kỹ thuật đảm bảo |
|---|---|---|---|
| **NFR-01** | Tính nhất quán đồng thời (Concurrency) | `0` trường hợp đặt trùng slot khi 20 request gửi đồng thời cùng mili-giây; `0` trường hợp giải ngân đúp. | Atomic `UPDATE ... WHERE` trong PostgreSQL Transaction + Unique Index `idempotency_key`. |
| **NFR-02** | Độ chính xác Tài chính (Financial Integrity) | Sai số làm tròn bằng `0 VND` ($\sum \text{total}_i \equiv \text{GrandTotal}$ trong 100% kịch bản). | Lưu tiền kiểu `Int` (VND), thuật toán Largest Remainder + `assert` tổng trước khi commit DB. |
| **NFR-03** | Độ trễ Thời gian thực (Realtime Latency) | Độ trễ đồng bộ giỏ hàng và khóa phòng giữa các thiết bị $< 1000\text{ ms}$ trong mạng LAN/4G. | Socket.io Room (`lobby:{id}`) phát bản tin delta/snapshot trực tiếp từ bộ nhớ server. |
| **NFR-04** | Khả năng sử dụng (Usability) | Luồng thao tác từ lúc chọn sân đến khi mở thực đơn gọi nước $\le 3$ cú nhấp chuột (clicks). | Thiết kế luồng tích hợp trực tiếp trên một màn hình Lobby duy nhất, áp dụng chuẩn Hallmark UI. |
| **NFR-05** | Bảo mật & Truy vết (Security & Auditability) | Mật khẩu băm `bcrypt` ($\ge 10$ rounds); JWT hết hạn ngắn; 100% thao tác nhạy cảm (cộng/trừ uy tín, giải ngân, phân xử) có bản ghi `before/after` trong `audit_logs`. | Middleware xác thực JWT + RBAC theo Role; hàm helper ghi `audit_logs` trong cùng transaction nghiệp vụ. |

# Chương 2: Phân tích Nghiệp vụ & Thiết kế Hệ thống (SyncHub)

---

## 2.1 Danh mục 15 Luật Nghiệp vụ (Business Rules — BR)

Mười lăm luật nghiệp vụ dưới đây là xương sống của hệ thống SyncHub, được kiểm chứng trực tiếp bằng Unit Test và Integration Test ở tầng Backend:

| Mã BR | Phân hệ | Quy tắc & Công thức Ràng buộc |
|---|---|---|
| **BR-SLT-01** | Quản lý Slot | **Giữ chỗ tạm thời 10 phút:** Khi Host chọn một khung giờ sân, hệ thống cập nhật nguyên tử `status = 'LOCKED'`, `locked_by = userId`, `locked_until = now() + 10 phút`. Tiến trình nền (`setInterval` mỗi 60 giây) tự động quét các slot có `status = 'LOCKED'` và `locked_until < now()` (chưa chuyển sang `BOOKED`) để trả về `AVAILABLE` và phát sự kiện `slot:released`. |
| **BR-SLT-02** | Quản lý Slot | **Chống đặt trùng (Double-booking Prevention):** Cặp `(provider_id, start_at)` là duy nhất (`UNIQUE`). Câu lệnh khóa slot chỉ thành công khi thỏa điều kiện nguyên tử `status = 'AVAILABLE' OR (status = 'LOCKED' AND locked_until < now())`. Nếu `rowCount = 0`, trả về mã lỗi `409 Conflict (SLOT_TAKEN)`. |
| **BR-INT-01** | Tích hợp Lobby | **Ràng buộc Phòng – Slot – Giỏ hàng:** Mỗi phòng ghép kèo (`group_lobbies`) bắt buộc liên kết `1-1` với một `slot_id` đang được giữ bởi chính Host. Các thao tác thêm/sửa/xóa món trong `cart_items` chỉ được phép khi `lobby.status = 'OPEN'`. |
| **BR-INT-02** | Chia hóa đơn | **Công thức Chia Bill & Largest Remainder:** Tiền sân sau giảm giá (`slot_net`) chia đều cho $N$ thành viên `JOINED`; tiền đồ uống (`food_i`) tính theo món cá nhân; khoản điều chỉnh FNB (`adj = ship_fee - fnb_discount`) phân bổ theo tỷ lệ `food_i / Σfood`. Áp dụng làm tròn `Math.floor` kết hợp phân phối phần dư theo **Largest Remainder** (nếu phần lẻ bằng nhau thì ưu tiên cộng cho Host). Bắt buộc tổng các phần bằng chính xác tổng hóa đơn ($\sum \text{total}_i \equiv \text{GrandTotal}$). |
| **BR-INT-03** | Hủy liên đới | **Hủy liên đới & Rời phòng muộn:** (1) Khi hủy slot hoặc hủy phòng (`CANCELLED`), hệ thống tự động hủy toàn bộ đơn đồ uống FNB đi kèm và hoàn trả (`REFUNDED`) mọi khoản tiền đang giữ trong `escrow_transactions` (`HELD`). (2) Thành viên tự ý rời phòng (`LEFT`) sau khi phòng đã `LOCKED` vẫn phải chịu phần tiền sân (khấu trừ vào tiền cọc `deposit_paid`). |
| **BR-INT-04** | Đồng bộ Realtime | **Khóa giỏ hàng tức thì:** Ngay khi Host bấm chốt phòng (`status = 'LOCKED'`), Backend từ chối mọi yêu cầu chỉnh sửa giỏ hàng (`403 LOBBY_LOCKED`) và phát sự kiện `lobby:locked` qua WebSocket để vô hiệu hóa giao diện chọn món trên mọi thiết bị trong `< 1 giây`. |
| **BR-INT-05** | Khuyến mãi chéo | **Điều kiện Voucher Chéo (`CROSS`):** Mã giảm giá có `scope = 'CROSS'` chỉ hợp lệ khi: (1) Phòng có cả Slot sân và ít nhất 1 món đồ uống (`fnb_provider_id != null`), (2) Khoảng cách đường chim bay (Haversine) giữa Sân (`VENUE`) và Quán (`FNB`) $\le \text{max\_distance\_m}$ (mặc định $1000\text{ m}$), (3) Tổng đơn đạt `min_order` và còn lượt sử dụng. |
| **BR-REP-01** | Điểm uy tín | **Phân hạng Uy tín & Ngưỡng đặt cọc:** Điểm khởi tạo `100`. Khi tham gia phòng (`join`), mức cọc tính trên phần tiền sân dự kiến: **Hạng A ($\ge 90$ điểm):** miễn cọc (`0%`); **Hạng B ($70–89$ điểm):** cọc `30%`; **Hạng C ($50–69$ điểm):** cọc `100%`; **Dưới $50$ điểm:** gắn trạng thái `FLAGGED`, từ chối cho vào phòng (`403 REPUTATION_TOO_LOW`). |
| **BR-REP-02** | Điểm uy tín | **Xử phạt Bùng kèo (`NO_SHOW`):** Thành viên vắng mặt khi điểm danh bị đánh dấu `NO_SHOW`: trừ `-15` điểm uy tín (nếu xuống `< 50` thì chuyển sang `FLAGGED`), tịch thu tiền cọc chuyển cho chủ sân qua giao dịch `PENALTY` trong Escrow, ghi nhật ký `audit_logs`. |
| **BR-REP-03** | Điểm uy tín | **Thưởng Hoàn thành (`CHECKED_IN`):** Thành viên tham gia đầy đủ và được điểm danh `CHECKED_IN` được cộng `+2` điểm uy tín, tối đa không vượt quá `100` điểm, ghi nhật ký `audit_logs`. |
| **BR-ESC-01** | Ví Escrow | **Giữ tiền trung gian (`HOLD`):** Khi nhận xác nhận thanh toán VietQR (qua webhook giả lập), cập nhật `split_bills.status = 'PAID'` và tạo giao dịch `escrow_transactions` (`type = 'HOLD'`, `status = 'HELD'`). Khi 100% hóa đơn con trong phòng đạt `PAID`, chuyển `group_lobbies.status = 'PAID'` và `slots.status = 'BOOKED'`. |
| **BR-ESC-02** | Ví Escrow | **Giải ngân đa bên & Khấu trừ Hoa hồng:** Khi xác nhận `Check-in`, hệ thống tách quỹ Escrow để giải ngân (`RELEASE`): (1) Đối tác `VENUE` nhận $92\%$ tiền sân ròng (nền tảng giữ hoa hồng **8%**); (2) Đối tác `FNB` nhận $88\%$ tổng tiền đơn nước (nền tảng giữ hoa hồng **12%**). |
| **BR-ESC-03** | Ví Escrow | **Chống giải ngân đúp (`Idempotency`):** Mọi lệnh giải ngân hoặc hoàn tiền bắt buộc kèm khóa `idempotency_key` duy nhất (ví dụ: `release:{lobby_id}:{provider_id}`). Ràng buộc `UNIQUE(idempotency_key)` kết hợp điều kiện cập nhật nguyên tử `WHERE status = 'HELD'` đảm bảo gọi lặp nhiều lần không làm thất thoát tiền. |
| **BR-ESC-04** | Khiếu nại | **Đóng băng khoản tiền tranh chấp (`FROZEN`):** Nếu thành viên gửi khiếu nại (`disputes.status = 'OPEN'`) đối với một đối tác (`VENUE` hoặc `FNB`) trước khi giải ngân, chỉ phần tiền của đối tác bị khiếu nại chuyển sang `FROZEN`; phần tiền của đối tác không liên quan vẫn được giải ngân bình thường. |
| **BR-DSP-01** | Quản trị & Audit | **Phân xử Khiếu nại & Lưu vết Kiểm toán:** Admin thẩm định bằng chứng ảnh, quyết định hoàn tiền một phần hoặc toàn phần (`refund_amount`) từ khoản `FROZEN` cho người dùng và giải ngân phần còn lại cho đối tác. Mọi thay đổi trạng thái tiền và điểm uy tín bắt buộc ghi vào bảng `audit_logs` (`before`/`after` JSON). |

---

## 2.2 Đặc tả Chi tiết 12 Use Cases (UC01 → UC12)

### UC01 — Đăng ký, Đăng nhập & Xem hạng uy tín
- **Tác nhân (Actors):** Tất cả người dùng (`HOST`, `MEMBER`, `PROVIDER`, `ADMIN`).
- **Luật áp dụng:** `BR-REP-01`.
- **Tiền điều kiện (Preconditions):** Người dùng truy cập ứng dụng; với đăng nhập, tài khoản đã tồn tại và không bị `BANNED`.
- **Hậu điều kiện (Postconditions):** Tài khoản mới có `reputation_score = 100`, `status = 'ACTIVE'`; phiên đăng nhập nhận JWT token hợp lệ.
- **Luồng sự kiện chính (Basic Flow):**
  1. Người dùng nhập thông tin đăng ký (Email, Họ tên, SĐT, Mật khẩu, Vai trò) hoặc thông tin đăng nhập.
  2. Hệ thống kiểm tra định dạng, băm mật khẩu bằng `bcrypt` (khi đăng ký) hoặc đối chiếu hash (khi đăng nhập).
  3. Hệ thống khởi tạo `reputation_score = 100` (Hạng A) cho tài khoản mới và sinh chuỗi JWT chứa `{ sub, role, status }`.
  4. Người dùng mở trang Hồ sơ cá nhân để xem điểm uy tín hiện tại, huy hiệu hạng (`A / B / C / FLAGGED`) và mức cọc tương ứng.
- **Luồng thay thế (Alternative Flow):**
  - *2a. Chọn vai trò `PROVIDER`:* Hệ thống yêu cầu nhập thêm thông tin cơ sở (`VENUE` hoặc `FNB`, tọa độ `lat/lng`, số tài khoản nhận tiền).
- **Luồng ngoại lệ (Exception Flow):**
  - *2e. Email đã tồn tại hoặc sai mật khẩu:* Trả về lỗi `400/401` kèm thông báo rõ ràng.
  - *3e. Tài khoản đang ở trạng thái `BANNED`:* Từ chối cấp token (`403 Account Banned`).

---

### UC02 — Tìm kiếm đa tiêu chí & Bản đồ trực quan
- **Tác nhân:** `MEMBER`, `HOST`.
- **Luật áp dụng:** Không ràng buộc khóa dữ liệu (chỉ đọc).
- **Tiền điều kiện:** Dữ liệu tọa độ sân (`VENUE`) và quán (`FNB`) đã được khởi tạo trên hệ thống.
- **Hậu điều kiện:** Hiển thị danh sách kết quả khớp bộ lọc và các điểm đánh dấu (Marker) trên bản đồ Leaflet.
- **Luồng sự kiện chính (Basic Flow):**
  1. Người dùng chọn loại dịch vụ (`VENUE` / `FNB`), danh mục (Cầu lông, Phòng học, Trà sữa...), khoảng giá và bán kính quanh vị trí hiện tại (mặc định tâm Làng ĐH Thủ Đức: `10.875, 106.800`).
  2. Hệ thống truy vấn danh sách đối tác, tính khoảng cách Haversine và lọc theo điều kiện.
  3. Giao diện hiển thị song song danh sách thẻ (Card) và bản đồ Leaflet với biểu tượng phân biệt rõ Sân thể thao và Quán nước.
- **Luồng thay thế (Alternative Flow):**
  - *3a. Người dùng nhấp vào một Marker sân trên bản đồ:* Mở popup tóm tắt các khung giờ trống (`AVAILABLE`) trong ngày và nút "Đặt sân & Tạo phòng".
- **Luồng ngoại lệ (Exception Flow):**
  - *2e. Không có địa điểm nào trong bán kính đã chọn:* Hiển thị gợi ý mở rộng bán kính lên $2\text{ km} - 5\text{ km}$.

---

### UC03 — Đặt & Giữ chỗ Khung giờ Sân (Atomic Slot Lock)
- **Tác nhân:** `HOST` (hoặc `MEMBER` khởi tạo kèo).
- **Luật áp dụng:** `BR-SLT-01`, `BR-SLT-02`.
- **Tiền điều kiện:** Người dùng đã đăng nhập, có điểm uy tín $\ge 50$ (không bị `FLAGGED`).
- **Hậu điều kiện:** Bản ghi `slots` chuyển sang `LOCKED`, gán `locked_by = userId` và `locked_until = now() + 10 phút`.
- **Luồng sự kiện chính (Basic Flow):**
  1. Người dùng xem chi tiết một cơ sở `VENUE` và chọn một khung giờ có trạng thái `AVAILABLE`.
  2. Người dùng nhấn nút **"Giữ chỗ ngay (10 phút)"**.
  3. Hệ thống thực thi câu lệnh `UPDATE` nguyên tử trong transaction kiểm tra đồng thời trạng thái `AVAILABLE` hoặc `LOCKED` nhưng đã quá hạn `locked_until`.
  4. Hệ thống trả về thông tin slot đã khóa kèm bộ đếm ngược 10 phút trên giao diện và chuyển thẳng sang bước Tạo phòng ghép kèo.
- **Luồng thay thế (Alternative Flow):**
  - *4a. Người dùng chủ động nhấn "Hủy giữ chỗ" trước khi hết 10 phút:* Hệ thống gọi API `/release`, trả trạng thái về `AVAILABLE` và phát sự kiện `slot:released`.
- **Luồng ngoại lệ (Exception Flow):**
  - *3e. Có người dùng khác vừa khóa slot đó trước vài mili-giây (`rowCount = 0`):* Hệ thống trả về HTTP `409 SLOT_TAKEN`, làm mới lịch sân tức thì để người dùng chọn khung giờ khác.
  - *4e. Quá 10 phút mà phòng chưa thanh toán xong:* Cron job nền tự động thu hồi slot về `AVAILABLE`.

---

### UC04 — Tạo Phòng ghép kèo & Mời qua Link/QR
- **Tác nhân:** `HOST`.
- **Luật áp dụng:** `BR-INT-01`.
- **Tiền điều kiện:** `HOST` đang giữ một slot hợp lệ (`status = 'LOCKED'`, `locked_by = hostId`, chưa hết hạn).
- **Hậu điều kiện:** Tạo mới bản ghi `group_lobbies` (`status = 'OPEN'`), thêm `HOST` vào `lobby_members` (`status = 'JOINED'`), sinh mã `invite_code` và mã QR.
- **Luồng sự kiện chính (Basic Flow):**
  1. Từ màn hình giữ slot thành công, `HOST` xác nhận thời hạn chốt đơn (`deadline_at`) và nhấn **"Mở phòng ghép kèo"**.
  2. Hệ thống tạo bản ghi `group_lobbies` gắn với `slot_id`, sinh `invite_code` duy nhất (6 ký tự chữ-số) và tự động ghi nhận `HOST` là thành viên đầu tiên.
  3. Giao diện hiển thị màn hình Phòng ghép kèo (`Lobby Workspace`) kèm thẻ **Link mời & Mã QR** (`qrcode.react`) để `HOST` chia sẻ cho bạn bè.
- **Luồng thay thế (Alternative Flow):**
  - *1a. `HOST` chọn sẵn một quán nước `FNB` ngay lúc tạo phòng:* Hệ thống gắn luôn `fnb_provider_id` vào phòng.
- **Luồng ngoại lệ (Exception Flow):**
  - *2e. Slot đã hết hạn giữ chỗ hoặc đã gắn với một phòng khác:* Trả về lỗi `400 SLOT_EXPIRED_OR_USED`, yêu cầu khóa lại slot.

---

### UC05 — Tham gia Phòng & Kiểm tra Cọc Uy tín
- **Tác nhân:** `MEMBER`.
- **Luật áp dụng:** `BR-REP-01`.
- **Tiền điều kiện:** Phòng đang ở trạng thái `OPEN`; người dùng đã đăng nhập.
- **Hậu điều kiện:** Tạo bản ghi `lobby_members` với mức `deposit_required` đúng theo hạng uy tín; phát sự kiện `lobby:members` cho cả phòng.
- **Luồng sự kiện chính (Basic Flow):**
  1. `MEMBER` quét mã QR hoặc truy cập đường dẫn `/lobby/:inviteCode` và nhấn **"Tham gia phòng"**.
  2. Hệ thống đọc `reputation_score` của `MEMBER` và giá tiền sân để tính mức cọc theo `BR-REP-01`:
     - Nếu điểm $\ge 90$ (Hạng A): `deposit_required = 0`, cho phép vào phòng ngay.
  3. Hệ thống lưu `lobby_members` (`status = 'JOINED'`) và phát WebSocket `lobby:members` cập nhật danh sách thành viên thời gian thực.
- **Luồng thay thế (Alternative Flow):**
  - *2a. Thành viên thuộc Hạng B ($70–89$ điểm) hoặc Hạng C ($50–69$ điểm):* Hệ thống hiển thị hộp thoại yêu cầu xác nhận nộp cọc tương ứng **30%** (Hạng B) hoặc **100%** (Hạng C) phần tiền sân dự kiến trước khi hoàn tất gia nhập phòng.
- **Luồng ngoại lệ (Exception Flow):**
  - *2e. Thành viên có `reputation_score < 50` (`status = 'FLAGGED'`):* Hệ thống chặn không cho vào phòng (`403 REPUTATION_TOO_LOW`) và hiển thị thông báo lý do.
  - *1e. Phòng đã chuyển sang `LOCKED` hoặc `CANCELLED`:* Từ chối tham gia (`400 LOBBY_NOT_OPEN`).

---

### UC06 — Giỏ hàng chung & Trò chuyện Thời gian thực (Realtime Cart & Chat)
- **Tác nhân:** `HOST`, `MEMBER`.
- **Luật áp dụng:** `BR-INT-01`, `BR-INT-04`.
- **Tiền điều kiện:** Người dùng là thành viên `JOINED` của phòng; `group_lobbies.status = 'OPEN'`.
- **Hậu điều kiện:** Bản ghi `cart_items` được cập nhật trong DB; mọi thiết bị trong room `lobby:{id}` nhận bản tin `cart:updated` hoặc `chat:message` trong `< 1 giây`.
- **Luồng sự kiện chính (Basic Flow):**
  1. Thành viên duyệt thực đơn của quán `FNB` đang chọn trong phòng và nhấn thêm món (`+`) hoặc tăng/giảm số lượng.
  2. Client gửi sự kiện `cart:add` / `cart:update` / `cart:remove` qua Socket.io (hoặc REST API).
  3. Server kiểm tra `lobby.status === 'OPEN'`, lưu `cart_items` kèm `unit_price_snapshot = menu_item.price` và tính lại tổng tiền tạm tính.
  4. Server broadcast sự kiện `cart:updated` chứa toàn bộ giỏ hàng nhóm (ghi rõ ai đặt món nào) tới room `lobby:{id}`.
  5. Thành viên gửi tin nhắn thảo luận qua sự kiện `chat:send` → Server phát `chat:message` tới toàn bộ phòng.
- **Luồng thay thế (Alternative Flow):**
  - *1a. Thành viên xóa món của chính mình:* Hệ thống xóa dòng `cart_items` tương ứng và cập nhật lại tổng giỏ hàng.
- **Luồng ngoại lệ (Exception Flow):**
  - *3e. `HOST` vừa bấm khóa phòng (`LOCKED`):* Server từ chối thao tác thêm/sửa món (`403 LOBBY_LOCKED`), đồng thời giao diện đã tự động khóa nút bấm nhờ sự kiện `lobby:locked` (`BR-INT-04`).

---

### UC07 — Gợi ý Quán/Món Thông minh & Áp dụng Voucher Chéo
- **Tác nhân:** `HOST`.
- **Luật áp dụng:** `BR-INT-05`.
- **Tiền điều kiện:** Phòng đã được gắn với một `slot_id` tại cơ sở `VENUE` có tọa độ `(lat, lng)`.
- **Hậu điều kiện:** Phòng được gắn `fnb_provider_id` và `voucher_id` hợp lệ.
- **Luồng sự kiện chính (Basic Flow):**
  1. Trong màn hình Phòng ghép kèo, `HOST` mở tab **"Gợi ý quán nước gần sân"**.
  2. Hệ thống tính điểm xếp hạng (`score`) cho các quán `FNB` dựa trên: khoảng cách Haversine tới sân ($\le 1\text{ km}$), khung giờ mở cửa khớp với giờ sân, số lượt đặt (`order_count`) và ưu đãi chéo hiện có.
  3. Hệ thống hiển thị danh sách quán kèm nhãn giải thích trực quan (ví dụ: *"Cách sân 350m · Đang mở cửa · Có mã giảm chéo 15%"*) và danh sách món thường được gọi kèm.
  4. `HOST` chọn quán và nhập mã khuyến mãi `CROSS` (hoặc `VENUE`/`FNB`).
  5. Hệ thống kiểm tra điều kiện `BR-INT-05` (phòng có cả sân và đơn nước, khoảng cách $\le \text{max\_distance\_m}$, đạt `min_order`) và áp dụng mức giảm giá vào hóa đơn tạm tính.
- **Luồng thay thế (Alternative Flow):**
  - *4a. `HOST` đổi sang quán `FNB` khác khi giỏ hàng đã có món:* Hệ thống cảnh báo làm mới giỏ hàng hiện tại trước khi chuyển quán.
- **Luồng ngoại lệ (Exception Flow):**
  - *5e. Quán `FNB` cách sân $> 1000\text{ m}$ hoặc giỏ hàng chưa có món nước nào khi áp mã `CROSS`:* Hệ thống trả về lỗi `400 VOUCHER_DISTANCE_EXCEEDED` hoặc `400 CROSS_REQUIRES_FNB_ITEMS`.

---

### UC08 — Chốt Phòng, Chia Bill Tự động & Sinh mã VietQR
- **Tác nhân:** `HOST`.
- **Luật áp dụng:** `BR-INT-02`, `BR-INT-04`.
- **Tiền điều kiện:** Phòng đang ở trạng thái `OPEN` (hoặc vừa `LOCKED`), có ít nhất 1 thành viên `JOINED`.
- **Hậu điều kiện:** `group_lobbies.status = 'AWAITING_PAYMENT'`; tạo các bản ghi `split_bills` cho từng thành viên kèm URL ảnh VietQR; phát sự kiện `lobby:locked` và `bill:ready`.
- **Luồng sự kiện chính (Basic Flow):**
  1. `HOST` nhấn nút **"Chốt đơn & Chia tiền"** trên giao diện Phòng ghép kèo.
  2. Hệ thống chuyển `group_lobbies.status = 'LOCKED'` và phát ngay sự kiện `lobby:locked` để khóa mọi thao tác chỉnh sửa giỏ hàng (`BR-INT-04`).
  3. Hệ thống gọi dịch vụ `splitBill.ts` thực thi thuật toán `BR-INT-02`:
     - Tính `slot_net` chia đều cho số thành viên `JOINED`.
     - Cộng tiền món cá nhân `food_i`.
     - Phân bổ phí ship và giảm giá FNB (`adj = ship_fee - fnb_discount`) theo tỷ lệ `food_i / Σfood`.
     - Làm tròn `Math.floor` và phân bổ số dư VND theo **Largest Remainder** (ưu tiên Host nếu phần dư bằng nhau), kiểm tra bất biến $\sum \text{total}_i \equiv \text{GrandTotal}$.
  4. Hệ thống sinh URL VietQR chuẩn cho từng thành viên (`https://img.vietqr.io/image/...`) chứa đúng số tiền phải trả và nội dung `SYNCHUB {inviteCode} {userId}`, lưu vào bảng `split_bills` và chuyển phòng sang `AWAITING_PAYMENT`.
  5. Hệ thống phát sự kiện `bill:ready` để màn hình của từng thành viên tự động hiển thị bảng kê chi tiết và mã QR thanh toán riêng.
- **Luồng thay thế (Alternative Flow):**
  - *3a. Không có ai đặt đồ uống ($\Sigma\text{food} = 0$):* Hệ thống đặt `ship_fee = 0`, `fnb_discount = 0` và chỉ chia đều tiền sân ròng cho các thành viên.
- **Luồng ngoại lệ (Exception Flow):**
  - *3e. Sai lệch tổng kiểm tra (`SPLIT_SUM_MISMATCH`):* Rollback toàn bộ transaction và báo lỗi hệ thống (không ghi dữ liệu lệch).

---

### UC09 — Thanh toán VietQR & Giữ tiền Trung gian (Escrow Hold)
- **Tác nhân:** `MEMBER`, `HOST`.
- **Luật áp dụng:** `BR-ESC-01`, `BR-INT-03`.
- **Tiền điều kiện:** Phòng ở trạng thái `AWAITING_PAYMENT`; thành viên có bản ghi `split_bills` ở trạng thái `PENDING`.
- **Hậu điều kiện:** `split_bills.status = 'PAID'`; tạo bản ghi `escrow_transactions` (`type = 'HOLD'`, `status = 'HELD'`). Khi tất cả thành viên đã trả, `group_lobbies.status = 'PAID'` và `slots.status = 'BOOKED'`.
- **Luồng sự kiện chính (Basic Flow):**
  1. Thành viên dùng ứng dụng ngân hàng trên điện thoại quét mã VietQR trên màn hình để kiểm tra số tiền và nội dung chuyển khoản.
  2. Trên môi trường demo, thành viên (hoặc người thuyết trình) nhấn nút **"Giả lập Ngân hàng Xác nhận Đã chuyển khoản"** (`POST /api/payments/webhook-mock`).
  3. Hệ thống cập nhật `split_bills.status = 'PAID'`, tạo giao dịch giữ tiền trong `escrow_transactions` với `idempotency_key = "hold:{split_bill_id}"` và phát sự kiện `payment:confirmed`.
  4. Khi hóa đơn của tất cả thành viên trong phòng đều đạt `PAID`, hệ thống tự động nâng trạng thái phòng lên `PAID` và chốt cứng khung giờ sân thành `BOOKED`.
- **Luồng thay thế (Alternative Flow):**
  - *2a. Thành viên đã đóng cọc trước đó (`deposit_paid > 0`):* Số tiền trên mã VietQR đã được trừ đi khoản cọc (`deposit_offset`).
- **Luồng ngoại lệ (Exception Flow):**
  - *4e. Hết thời hạn thanh toán mà vẫn còn thành viên chưa trả hoặc Host hủy kèo (`BR-INT-03`):* Hệ thống chuyển phòng sang `CANCELLED`, hủy đơn FNB và tự động hoàn trả (`REFUNDED`) các khoản `HELD` của những người đã đóng trước đó.

---

### UC10 — Check-in tại Sân & Giải ngân Đa bên (Multi-party Escrow Release)
- **Tác nhân:** `HOST`, `PROVIDER`.
- **Luật áp dụng:** `BR-ESC-02`, `BR-ESC-03`, `BR-REP-02`, `BR-REP-03`.
- **Tiền điều kiện:** Phòng đang ở trạng thái `PAID`.
- **Hậu điều kiện:** Điểm danh thành viên (`CHECKED_IN` / `NO_SHOW`); cập nhật điểm uy tín; tạo giao dịch giải ngân (`RELEASE`) tách dòng tiền cho `VENUE` (trừ 8%) và `FNB` (trừ 12%); chuyển phòng sang `COMPLETED`.
- **Luồng sự kiện chính (Basic Flow):**
  1. Khi đến giờ chơi tại sân, `HOST` hoặc `PROVIDER` mở màn hình Check-in của phòng và tích chọn trạng thái có mặt cho từng thành viên.
  2. Hệ thống cập nhật trạng thái thành viên sang `CHECKED_IN` và cộng `+2` điểm uy tín (tối đa 100) theo `BR-REP-03`, đồng thời ghi `audit_logs`.
  3. Hệ thống gọi `escrow.releaseLobbyPayouts(lobbyId)`:
     - Tính phần giải ngân cho chủ sân `VENUE`: $\text{net\_venue} = \lfloor \text{slot\_net} \times (1 - 0.08) \rfloor$, hoa hồng nền tảng $8\%$, với `idempotency_key = "release:{lobbyId}:{venueProviderId}"`.
     - Tính phần giải ngân cho quán `FNB` (nếu có): $\text{net\_fnb} = \lfloor \text{fnb\_total} \times (1 - 0.12) \rfloor$, hoa hồng nền tảng $12\%$, với `idempotency_key = "release:{lobbyId}:{fnbProviderId}"`.
  4. Hệ thống chuyển các bản ghi giữ tiền sang `RELEASED`, cập nhật `group_lobbies.status = 'COMPLETED'` và phát sự kiện `escrow:released`.
- **Luồng thay thế (Alternative Flow):**
  - *2a. Có thành viên vắng mặt (`NO_SHOW` — `BR-REP-02`):* Hệ thống trừ `-15` điểm uy tín của người đó (chuyển `FLAGGED` nếu `< 50`), tạo giao dịch `PENALTY` chuyển khoản cọc của người vắng mặt cho chủ sân và ghi `audit_logs`.
- **Luồng ngoại lệ (Exception Flow):**
  - *3e. Request giải ngân bị gửi lặp 2 lần liên tiếp (`BR-ESC-03`):* Lần gọi thứ hai bị chặn bởi `UNIQUE(idempotency_key)` và điều kiện `WHERE status = 'HELD'`, trả về kết quả an toàn mà không nhân đôi số tiền giải ngân.

---

### UC11 — Gửi Khiếu nại Dịch vụ & Admin Phân xử Hoàn tiền
- **Tác nhân:** `MEMBER` / `HOST` (người báo cáo), `ADMIN` (người phân xử).
- **Luật áp dụng:** `BR-ESC-04`, `BR-DSP-01`.
- **Tiền điều kiện:** Phòng đã thanh toán (`PAID`), phát sinh sự cố dịch vụ (ví dụ: quán giao thiếu nước hoặc sân không đúng chất lượng) trước khi hoàn tất giải ngân.
- **Hậu điều kiện:** Khoản tiền của đối tác bị khiếu nại được đóng băng (`FROZEN`); sau khi `ADMIN` phân xử, tiền được hoàn (`REFUND`) một phần/toàn phần và ghi vào `audit_logs`.
- **Luồng sự kiện chính (Basic Flow):**
  1. Thành viên mở form **"Khiếu nại dịch vụ"**, chọn đối tác cần khiếu nại (`VENUE` hoặc `FNB`), nhập lý do và tải lên ảnh minh chứng (`multer`).
  2. Hệ thống tạo bản ghi `disputes` (`status = 'OPEN'`), chuyển trạng thái phòng sang `DISPUTED` và đóng băng (`FROZEN`) khoản tiền Escrow của đối tác bị khiếu nại (`BR-ESC-04`).
  3. `ADMIN` mở trang Quản trị Khiếu nại, xem hình ảnh bằng chứng và lịch sử giao dịch của phòng.
  4. `ADMIN` nhập số tiền hoàn trả (`refund_amount`) và nhấn **"Chấp thuận hoàn tiền (`RESOLVED`)"**.
  5. Hệ thống tạo giao dịch `REFUND` trả tiền cho thành viên, giải ngân phần còn lại (nếu có) cho đối tác, chuyển phòng sang `COMPLETED` và ghi chi tiết `before/after` vào bảng `audit_logs` (`BR-DSP-01`).
- **Luồng thay thế (Alternative Flow):**
  - *4a. Bằng chứng không hợp lệ:* `ADMIN` chọn **"Bác bỏ khiếu nại (`REJECTED`)"** → Hệ thống mở khóa khoản `FROZEN` và giải ngân toàn bộ cho đối tác.
- **Luồng ngoại lệ (Exception Flow):**
  - *1e. Khoản tiền của đối tác đã được `RELEASED` trước đó:* Hệ thống thông báo đã hết thời gian giữ tiền trung gian.

---

### UC12 — Cổng Đối tác (Provider Portal) & Bảng điều khiển Quản trị (Admin Dashboard)
- **Tác nhân:** `PROVIDER`, `ADMIN`.
- **Luật áp dụng:** `BR-DSP-01`.
- **Tiền điều kiện:** Đăng nhập đúng vai trò `PROVIDER` hoặc `ADMIN`.
- **Hậu điều kiện:** Cập nhật lịch slot/thực đơn thành công; hiển thị số liệu thống kê thực từ PostgreSQL.
- **Luồng sự kiện chính (Basic Flow):**
  1. **Với `PROVIDER`:** Truy cập `/provider` để thêm khung giờ `slots` mới (nếu là `VENUE`) hoặc thêm/cập nhật món `menu_items`, bật/tắt trạng thái còn hàng (`is_available`) (nếu là `FNB`), và xem bảng kê các khoản tiền đang `HELD` / đã `RELEASED` (sau khi trừ hoa hồng 8% hoặc 12%).
  2. **Với `ADMIN`:** Truy cập `/admin` để xem biểu đồ `Recharts` thống kê tổng giá trị giao dịch (GMV), doanh thu hoa hồng nền tảng theo ngày, danh sách người dùng bị gắn cờ (`FLAGGED` có điểm $< 50$), danh sách khiếu nại và bảng tra cứu nhật ký kiểm toán (`audit_logs`).
- **Luồng thay thế (Alternative Flow):**
  - *2a. `ADMIN` khôi phục tài khoản `FLAGGED`:* Cập nhật lại điểm uy tín và tự động ghi một dòng `audit_logs` mới.
- **Luồng ngoại lệ (Exception Flow):**
  - *1e. Người dùng vai trò `MEMBER` cố truy cập `/admin`:* Middleware RBAC chặn ngay với mã lỗi `403 Forbidden`.

---

## 2.3 Bộ Sơ đồ Phân tích & Thiết kế Hệ thống (UML & BPMN)

Toàn bộ 5 sơ đồ được thiết kế theo chuẩn Editorial Design System (`/diagram-design`, bảng màu `default` đạt độ tương phản WCAG AA, lưới `4px`, đường nối vuông góc bo góc `r=8`), lưu trữ đầy đủ 3 định dạng tại `docs/diagrams/*.{html,svg,png}` (cùng tệp nguồn `.mmd`):

1. **Sơ đồ Use Case & Bản đồ Năng lực (`docs/diagrams/01-use-case.{html,svg,png}`):** Thể hiện 4 tác nhân (`HOST`, `MEMBER`, `PROVIDER`, `ADMIN`) trong vùng RBAC và mối quan hệ `<<include>>` / `<<extend>>` giữa 5 cụm năng lực bao hàm toàn bộ 12 Use Cases (`UC01` – `UC12`).
2. **Sơ đồ Quy trình Nghiệp vụ Tích hợp BPMN (`docs/diagrams/02-bpmn-integrated.{html,svg,png}`):** Thể hiện 4 làn bơi ngang (Swimlanes: `HOST`, `MEMBER`, `SYNCHUB CORE & ESCROW`, `PROVIDER`) xuyên suốt 9 bước từ lúc giữ slot 10 phút, mở phòng QR, gọi nước chung, chia bill Largest Remainder, giữ tiền `Escrow` đến khi Check-in và giải ngân đa bên.
3. **Sơ đồ Tuần tự — Khóa Slot Nguyên tử & Giỏ hàng Realtime (`docs/diagrams/03-sequence-slot-cart.{html,svg,png}`):** Gồm 4 lifelines (`HOST`, `MEMBER`, `Express + Socket.io`, `PostgreSQL 16`), 1 khung `ALT` biểu diễn tranh chấp khóa slot đồng thời (`200 OK` vs `409 Conflict`), thanh kích hoạt (activation bars) và 12 thông điệp cốt lõi.
4. **Sơ đồ Máy trạng thái — Vòng đời Phòng & Ví Escrow (`docs/diagrams/04-state-machine.{html,svg,png}`):** Áp dụng mẫu *Lifecycle Phase Map* chia thành 3 dải (`Primary Happy-Path`, `Dispute Band`, `Cancel Band`) hợp nhất vòng đời `GroupLobby` và trạng thái tương ứng của `EscrowStatus` (`[HELD]`, `[FROZEN]`, `[RELEASED]`, `[REFUNDED]`).
5. **Sơ đồ Thực thể Liên kết — ERD 12 Bảng (`docs/diagrams/05-erd.{html,svg,png}`):** Phân vùng 12 bảng vật lý (`detail=faithful`) thành 3 miền (`Identity & Supply`, `Lobby & GroupOrder`, `Escrow & Governance`), đánh dấu rõ khóa chính (`# PK`), khóa ngoại (`→ FK`), ràng buộc `UNIQUE` và kiểu tiền `Int (VND)`.

---

## 2.4 Giải thích Thiết kế Cơ sở Dữ liệu, Khóa ngoại (FK) & Chỉ mục (Indexes)

Cơ sở dữ liệu PostgreSQL (định nghĩa tại `server/prisma/schema.prisma`) gồm đúng **12 bảng** được thiết kế tối ưu cho tính toàn vẹn giao dịch và tốc độ truy vấn:

1. **Kiểu dữ liệu Tiền tệ (`Int` — VND):**
   Toàn bộ các cột tiền (`slots.price`, `menu_items.price`, `cart_items.unit_price_snapshot`, `split_bills.*`, `escrow_transactions.amount/platform_fee/net_amount`, `disputes.refund_amount`) đều dùng kiểu số nguyên 32-bit `Int` (đơn vị: Đồng Việt Nam). Thiết kế này triệt tiêu hoàn toàn lỗi sai số dấu phẩy động (`IEEE 754 floating-point error`) thường gặp khi tính toán tài chính.
2. **Ràng buộc Duy nhất (`UNIQUE Constraints`) bảo vệ Nghiệp vụ:**
   - `slots`: `@@unique([provider_id, start_at])` ngăn chặn việc tạo 2 khung giờ trùng nhau cho cùng một sân (`BR-SLT-02`).
   - `group_lobbies`: `@unique` trên `slot_id` đảm bảo mỗi khung giờ sân chỉ gắn với tối đa 1 phòng ghép kèo (`BR-INT-01`); `@unique` trên `invite_code` giúp tra cứu nhanh khi quét QR.
   - `split_bills`: `@@unique([lobby_id, user_id])` đảm bảo mỗi thành viên chỉ có đúng 1 hóa đơn chia tiền trong 1 phòng.
   - `escrow_transactions`: `@unique` trên `idempotency_key` là chốt chặn mức CSDL giúp chống giải ngân hoặc hoàn tiền 2 lần (`BR-ESC-03`).
3. **Chiến lược Đánh chỉ mục (`Indexing Strategy`):**
   - `providers`: `@@index([type, category])` và `@@index([lat, lng])` tăng tốc truy vấn lọc địa điểm trên bản đồ (`UC02`, `UC07`).
   - `slots`: `@@index([status, locked_until])` giúp tiến trình nền quét các slot hết hạn 10 phút trong thời gian $O(\log N)$ mà không cần quét toàn bảng (`Full Table Scan`).
   - `cart_items`: `@@index([lobby_id, user_id])` tối ưu việc gom giỏ hàng realtime và tổng hợp `food_i` khi chia bill.
   - `audit_logs`: `@@index([entity, entity_id])` và `@@index([created_at])` phục vụ truy vết nhanh lịch sử biến động điểm uy tín và phân xử khiếu nại trên Admin Dashboard.

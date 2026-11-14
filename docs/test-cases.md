# BẢNG KỊCH BẢN KIỂM THỬ HỘP ĐEN & TỰ ĐỘNG (WBS-6.1) — SYNCHUB

> **Phạm vi:** 30 Test Cases hộp đen bao phủ toàn bộ **12 Use Cases (`UC01` → `UC12`)** và **15 Luật Nghiệp vụ (`BR-SLT-01` → `BR-DSP-01`)** trong `CONTEXT.md`.
> **Tự động hóa:** Thực thi qua **Node test runner + Supertest** (`65/65` ở baseline Giai đoạn 4, `82/82` sau các bản sửa Giai đoạn 5) kết hợp bộ sưu tập `postman/SyncHub.postman_collection.json`.

---

## 1. Tổng hợp Kết quả Kiểm thử Tự động (Node test runner)

| File Kiểm thử (`server/tests/`) | Số lượng Test | Phân hệ & Luật Nghiệp vụ Kiểm chứng | Kết quả |
|---|---:|---|---|
| `tests/seed-data.test.js` | 4 | Dữ liệu mồi Làng ĐH Thủ Đức (10 sân, 15 quán, 8 users, tọa độ Haversine) | **PASS (4/4)** |
| `tests/auth.test.js` | 12 | `UC01`, JWT Authentication, RBAC 4 vai trò (`HOST`, `MEMBER`, `PROVIDER`, `ADMIN`), `BR-REP-01` | **PASS (12/12)** |
| `tests/bookslot.test.js` | 19 | `UC02`, `UC03`, `UC04`, `UC05` · Khóa slot 20 request đồng thời (`BR-SLT-01/02`), Cọc uy tín (`BR-REP-01`) | **PASS (19/19)** |
| `tests/split-bill.test.js` | 7 | `UC08` · Thuật toán chia bill Largest Remainder (`BR-INT-02`), Ca chuẩn `215.000₫` & 6 ca biên | **PASS (7/7)** |
| `tests/grouporder.test.js` | 10 | `UC06`, `UC07` · Giỏ hàng chung, Khóa phòng tức thì (`BR-INT-04`), Gợi ý F&B & Voucher `CROSS` (`BR-INT-05`) | **PASS (10/10)** |
| `tests/escrow.test.js` | 6 | `UC09`, `UC10` · Giữ tiền `HOLD` (`BR-ESC-01`), Giải ngân 8%/12% (`BR-ESC-02`), Chống lặp `idempotency_key` (`BR-ESC-03`) | **PASS (6/6)** |
| `tests/dispute-admin.test.js` | 7 | `UC11`, `UC12` · Đóng băng `FROZEN` (`BR-ESC-04`), Admin phân xử & `audit_logs` (`BR-DSP-01`) | **PASS (7/7)** |
| **TỔNG CỘNG** | **65** | **Suite baseline Giai đoạn 4** | **65 / 65 PASS tại baseline Giai đoạn 4** |

---

## 2. Danh mục 30 Test Cases Hộp đen Chi tiết (Black-Box Test Cases)

### Nhóm A — Xác thực, Phân quyền RBAC & Điểm Uy tín (`UC01`, `BR-REP-01`)

| Mã TC | Tên kịch bản kiểm thử | UC / BR | Đầu vào (Input & Pre-condition) | Kết quả kỳ vọng (Expected Output) | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|---|
| **TC-01** | Đăng ký tài khoản mới khởi tạo 100 điểm uy tín | `UC01`, `BR-REP-01` | `POST /api/auth/register` với email hợp lệ chưa tồn tại | HTTP `201`, tạo user có `reputation_score = 100`, `tier = 'A'`, `status = 'ACTIVE'` | Khớp kỳ vọng (`auth.test.js`) | **PASS** |
| **TC-02** | Đăng nhập thành công trả về JWT và thông tin hạng uy tín | `UC01`, `BR-REP-01` | `POST /api/auth/login` (`dat.dt@synchub.vn` / `123456`) | HTTP `200`, trả về `accessToken` (JWT) + `reputation.tier = 'A'`, `depositPercent = 0` | Khớp kỳ vọng (`auth.test.js`) | **PASS** |
| **TC-03** | Chặn truy cập trái phép vào Portal Provider (RBAC) | `UC01`, `UC12` | User role `MEMBER` gọi `POST /api/providers/prv-venue-01/slots` | HTTP `403 FORBIDDEN`, từ chối thực thi do không có quyền `PROVIDER` | Khớp kỳ vọng (`auth.test.js`) | **PASS** |
| **TC-04** | Chặn truy cập trái phép vào Admin Dashboard (RBAC) | `UC01`, `UC12` | User role `HOST` gọi `GET /api/admin/stats` | HTTP `403 FORBIDDEN`, chỉ cho phép role `ADMIN` | Khớp kỳ vọng (`auth.test.js`) | **PASS** |

---

### Nhóm B — Tìm kiếm Bản đồ & Khóa Slot Chống Trùng (`UC02`, `UC03`, `BR-SLT-01`, `BR-SLT-02`)

| Mã TC | Tên kịch bản kiểm thử | UC / BR | Đầu vào (Input & Pre-condition) | Kết quả kỳ vọng (Expected Output) | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|---|
| **TC-05** | Tìm kiếm địa điểm theo bán kính Haversine ≤ 1.000m | `UC02` | `GET /api/providers?lat=10.8752&lng=106.8007&radius=1000` | HTTP `200`, danh sách trả về chỉ gồm các sân/quán có `distance_m <= 1000`, sắp xếp gần nhất trước | Khớp kỳ vọng (`bookslot.test.js`) | **PASS** |
| **TC-06** | Lọc kết hợp theo loại hình `VENUE` và danh mục `badminton` | `UC02` | `GET /api/providers?type=VENUE&category=badminton` | HTTP `200`, toàn bộ kết quả có `type = 'VENUE'` và `category = 'badminton'` | Khớp kỳ vọng (`bookslot.test.js`) | **PASS** |
| **TC-07** | Khóa slot trống nguyên tử trong 10 phút | `UC03`, `BR-SLT-01` | Host gọi `POST /api/slots/:id/lock` trên slot `AVAILABLE` | HTTP `200`, `status = 'LOCKED'`, `locked_by = hostId`, `locked_until = now + 10 phút` (`expiresInSeconds ≈ 600`) | Khớp kỳ vọng (`bookslot.test.js`) | **PASS** |
| **TC-08** | **Kiểm thử đồng thời 20 request cùng khóa 1 slot (Race Condition)** | `UC03`, `BR-SLT-01`, `BR-SLT-02` | `Promise.all` gửi 20 request `POST /api/slots/:id/lock` từ 20 user cùng mili-giây | **Đúng 1 request nhận HTTP `200`**, **19 request còn lại nhận HTTP `409 SLOT_TAKEN`** | 1 thắng / 19 nhận 409 (`bookslot.test.js`) | **PASS** |
| **TC-09** | Tự động giải phóng slot quá hạn 10 phút (`expireOverdueSlots`) | `UC03`, `BR-SLT-01` | Slot đang `LOCKED` có `locked_until < now()`, chạy tiến trình quét hết hạn | Slot tự động chuyển về `AVAILABLE`, xóa `locked_by` và `locked_until`, cho phép người mới khóa | Khớp kỳ vọng (`bookslot.test.js`) | **PASS** |
| **TC-10** | Chủ động nhả slot đang giữ về trạng thái trống | `UC03`, `BR-SLT-01` | Người đang giữ slot gọi `POST /api/slots/:id/release` | HTTP `200`, slot trở về `AVAILABLE` ngay lập tức | Khớp kỳ vọng (`bookslot.test.js`) | **PASS** |

---

### Nhóm C — Phòng Ghép Kèo & Cọc Uy tín Tự động (`UC04`, `UC05`, `BR-INT-01`, `BR-REP-01`)

| Mã TC | Tên kịch bản kiểm thử | UC / BR | Đầu vào (Input & Pre-condition) | Kết quả kỳ vọng (Expected Output) | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|---|
| **TC-11** | Tạo phòng ghép kèo bắt buộc gắn với slot đã khóa bởi Host | `UC04`, `BR-INT-01` | Host gọi `POST /api/lobbies` với `slotId` đang được chính Host khóa | HTTP `201`, sinh mã `invite_code` duy nhất, `status = 'OPEN'` | Khớp kỳ vọng (`bookslot.test.js`) | **PASS** |
| **TC-12** | Từ chối tạo phòng nếu slot chưa được khóa hoặc khóa bởi người khác | `UC04`, `BR-INT-01` | User gọi `POST /api/lobbies` với `slotId` đang `AVAILABLE` | HTTP `400 SLOT_NOT_LOCKED_BY_HOST`, không tạo phòng | Khớp kỳ vọng (`bookslot.test.js`) | **PASS** |
| **TC-13** | Thành viên Hạng A (≥ 90 điểm) vào phòng được miễn cọc (0%) | `UC05`, `BR-REP-01` | User 98 điểm gọi `POST /api/lobbies/:id/join` | HTTP `200`, `deposit_required = 0`, `deposit_paid = 0`, `status = 'JOINED'` | Khớp kỳ vọng (`bookslot.test.js`) | **PASS** |
| **TC-14** | Thành viên Hạng B (70–89 điểm) vào phòng phải cọc 30% phần sân | `UC05`, `BR-REP-01` | User 82 điểm vào phòng sân `120.000₫` (dự kiến `30.000₫`/người) | HTTP `200`, hệ thống tính `deposit_required = 9000` (30% × 30.000₫) | Khớp kỳ vọng (`bookslot.test.js`) | **PASS** |
| **TC-15** | Thành viên Hạng C (50–69 điểm) vào phòng phải cọc 100% phần sân | `UC05`, `BR-REP-01` | User 64 điểm vào phòng sân `120.000₫` (dự kiến `30.000₫`/người) | HTTP `200`, hệ thống tính `deposit_required = 30000` (100% × 30.000₫) | Khớp kỳ vọng (`bookslot.test.js`) | **PASS** |
| **TC-16** | Chặn tài khoản `FLAGGED` (< 50 điểm) tham gia phòng ghép kèo | `UC05`, `BR-REP-01` | User 42 điểm (`FLAGGED`) gọi `POST /api/lobbies/:id/join` | HTTP `403 REPUTATION_TOO_LOW`, chặn vào phòng | Khớp kỳ vọng (`bookslot.test.js`) | **PASS** |

---

### Nhóm D — Giỏ hàng Realtime, Gợi ý F&B, Voucher Chéo & Chia Bill (`UC06`, `UC07`, `UC08`, `BR-INT-02`, `BR-INT-04`, `BR-INT-05`)

| Mã TC | Tên kịch bản kiểm thử | UC / BR | Đầu vào (Input & Pre-condition) | Kết quả kỳ vọng (Expected Output) | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|---|
| **TC-17** | Thêm/cập nhật món vào giỏ hàng chung khi phòng đang `OPEN` | `UC06`, `BR-INT-01` | Thành viên thêm 2 ly trà sữa (`25.000₫`/ly) vào phòng `OPEN` | Giỏ hàng cập nhật số lượng = 2, `unit_price_snapshot = 25000`, tổng tạm tính tăng `50.000₫` | Khớp kỳ vọng (`grouporder.test.js`) | **PASS** |
| **TC-18** | Khóa giỏ hàng tức thì khi Host chốt phòng (`LOCKED`) | `UC06`, `BR-INT-04` | Host gọi `POST /api/lobbies/:id/lock`, sau đó thành viên gửi yêu cầu thêm món | Server chuyển phòng sang `LOCKED`, phát socket `lobby:locked`, từ chối thêm món với HTTP `403 LOBBY_LOCKED` | Khớp kỳ vọng (`grouporder.test.js`) | **PASS** |
| **TC-19** | Gợi ý thông minh quán F&B quanh sân theo công thức điểm `score` | `UC07`, `BR-INT-05` | `GET /api/recommend?lobbyId=SYNC01` | HTTP `200`, quán F&B cách sân ≤ 1km đang mở cửa và có voucher `CROSS` xếp Top 1 kèm giải thích lý do | Khớp kỳ vọng (`grouporder.test.js`) | **PASS** |
| **TC-20** | Áp dụng thành công mã Voucher `CROSS` khi khoảng cách VENUE–FNB ≤ 1.000m | `UC07`, `BR-INT-05` | `POST /api/vouchers/validate` với mã `CROSSLANGDH15` (khoảng cách 210m ≤ 1.000m) | HTTP `200`, áp dụng giảm giá 15% hợp lệ | Khớp kỳ vọng (`grouporder.test.js`) | **PASS** |
| **TC-21** | Từ chối mã Voucher `CROSS` khi quán F&B cách sân > `max_distance_m` (1.000m) | `UC07`, `BR-INT-05` | Áp mã `CROSS` cho quán F&B cách sân `1.450m` (> `1.000m`) | HTTP `400 VOUCHER_DISTANCE_EXCEEDED`, từ chối áp mã | Khớp kỳ vọng (`grouporder.test.js`) | **PASS** |
| **TC-22** | **Chia bill Ca chuẩn Mục 5.2 `CONTEXT.md` (Tổng `215.000₫` / 4 người)** | `UC08`, `BR-INT-02` | Sân `120k`/4 người; Món: A `25k`, B `30k`, C `0`, D `45k`; Ship `15k`; Voucher FNB `-20k` | **A = `53.750₫`, B = `58.500₫`, C = `30.000₫`, D = `72.750₫`**. Tổng `Σ = 215.000₫` khớp tuyệt đối | Khớp 100% từng đồng (`split-bill.test.js`) | **PASS** |
| **TC-23** | **Chia bill Ca biên làm tròn Largest Remainder (`100.000₫` chia 3 người)** | `UC08`, `BR-INT-02` | Sân `100.000₫` chia 3 người (không gọi nước, phần dư `1₫` hòa nhau) | Host nhận phần dư `+1₫` (`33.334₫`), 2 thành viên còn lại mỗi người `33.333₫`. Tổng `Σ = 100.000₫` | Khớp kỳ vọng (`split-bill.test.js`) | **PASS** |
| **TC-24** | Chia bill khấu trừ tiền cọc (`deposit_offset`) và sinh URL VietQR chuẩn | `UC08`, `BR-INT-02` | Thành viên C đã đóng cọc `30.000₫`, tổng bill cá nhân `30.000₫` | `deposit_offset = 30000`, số tiền cần chuyển thêm `payable = 0₫`, sinh URL `img.vietqr.io` đúng cú pháp | Khớp kỳ vọng (`split-bill.test.js`) | **PASS** |

---

### Nhóm E — Thanh toán Escrow, Check-in, Khiếu nại & Quản trị (`UC09` → `UC12`, `BR-ESC-01` → `04`, `BR-REP-02/03`, `BR-INT-03`, `BR-DSP-01`)

| Mã TC | Tên kịch bản kiểm thử | UC / BR | Đầu vào (Input & Pre-condition) | Kết quả kỳ vọng (Expected Output) | Kết quả thực tế | Trạng thái |
|---|---|---|---|---|---|---|
| **TC-25** | Xác nhận thanh toán qua Webhook giả lập chuyển tiền vào Escrow `HOLD` | `UC09`, `BR-ESC-01` | `POST /api/payments/webhook-mock` cho từng `split_bill` trong phòng | `split_bills.status = 'PAID'`, tạo `escrow_transactions` (`HOLD`, `HELD`). Khi đủ 100% bill → phòng `PAID`, slot `BOOKED` | Khớp kỳ vọng (`escrow.test.js`) | **PASS** |
| **TC-26** | Check-in giải ngân đa bên tách hoa hồng VENUE (8%) & FNB (12%) + thưởng `+2đ` | `UC10`, `BR-ESC-02`, `BR-REP-03` | `POST /api/lobbies/:id/checkin` với 4 thành viên `CHECKED_IN` | Tạo 2 giao dịch `RELEASE`: VENUE nhận `110.400₫` (phí `9.600₫`), FNB nhận `83.600₫` (phí `11.400₫`); cộng `+2đ` uy tín | Khớp kỳ vọng (`escrow.test.js`) | **PASS** |
| **TC-27** | **Chống giải ngân trùng lặp 2 lần bằng `idempotency_key` (`BR-ESC-03`)** | `UC10`, `BR-ESC-03` | Gọi `POST /api/lobbies/:id/checkin` lần thứ 2 trên cùng phòng đã giải ngân | HTTP `409 IDEMPOTENCY_DUPLICATE_RELEASE`, chặn tuyệt đối việc tạo thêm giao dịch `RELEASE` | Khớp kỳ vọng (`escrow.test.js`) | **PASS** |
| **TC-28** | Xử phạt thành viên bùng kèo (`NO_SHOW`): trừ 15 điểm & tịch thu cọc (`PENALTY`) | `UC10`, `BR-REP-02` | Đánh dấu 1 thành viên có cọc là `NO_SHOW` khi check-in | Trừ `15` điểm uy tín (nếu `< 50` chuyển `FLAGGED`), tạo giao dịch `PENALTY` chuyển cọc cho chủ sân, ghi `audit_logs` | Khớp kỳ vọng (`escrow.test.js`) | **PASS** |
| **TC-29** | Gửi khiếu nại đóng băng khoản tiền Escrow (`FROZEN`) & Admin phân xử hoàn tiền | `UC11`, `BR-ESC-04`, `BR-DSP-01` | Member gửi khiếu nại F&B trước check-in, sau đó Admin `PATCH` duyệt `RESOLVED` với `25.000₫` | Khoản Escrow của F&B chuyển sang `FROZEN`; khi Admin duyệt tạo các giao dịch `REFUND` tổng `25.000₫` và ghi `audit_logs` | Khớp kỳ vọng (`dispute-admin.test.js`) | **PASS** |
| **TC-30** | Hủy liên đới phòng ghép kèo (`CANCELLED`) hoàn trả toàn bộ tiền đang giữ | `UC11`, `BR-INT-03` | Host gọi `POST /api/lobbies/:id/cancel` khi phòng có khoản tiền đang `HELD` | Phòng chuyển sang `CANCELLED`, slot trả về `AVAILABLE`, toàn bộ giao dịch `HELD` tự động chuyển sang `REFUNDED` | Ca hủy liên đới pass trong `lobby-cancel.test.js`. Đặt lại slot bị chặn theo quyết định đã chốt. Rời muộn đã kiểm tra riêng | **PASS ca hủy** |

## Kiểm thử hồi quy Giai đoạn 5

| Ca | Kết quả |
| --- | --- |
| Chat gửi 55 tin, vào lại, phòng độc lập | PASS. Chỉ phát lại 50 tin cuối theo thứ tự, payload giữ nguyên. |
| BR-INT-03, hủy sai quyền, lặp, rollback, race webhook/release, COMPLETED | PASS. Webhook muộn trả 409. |
| BR-ESC-03, refund lặp/đồng thời, vượt số dư, khóa cũ | PASS. Một quyết định và tổng hoàn đúng. Refund tiếp chỉ dùng bill chưa hoàn. Khóa cũ thiếu bill cần đối chiếu. |
| BR-INT-01/03, đặt lại slot sau hủy | PASS. Giữ slot trả 409 SLOT_TAKEN, tạo lobby trả 409 LOBBY_EXISTS, giữ lịch sử. |
| BR-ESC-03/DSP-01, quyết định hoàn tiếp | PASS. Hoàn đúng số tiền khi đủ bill chưa hoàn, trả 409 và giữ khiếu nại OPEN khi không đủ. |
| BR-INT-02, SYNC00 COMPLETED | PASS smoke. Trang mở, POST trực tiếp trả 409. |
| BR-INT-03, rời sau khóa | PASS. Hai request đồng thời chỉ giữ một khoản cọc 9.000 VND. Khoản giữ được khấu trừ khi chia sân và hoàn nếu hủy. |
| BR-ESC-02, giá giải ngân với voucher VENUE/CROSS | PASS. Giá theo bill đã chốt dù sửa voucher trước check-in. |
| BR-ESC-04/DSP-01, khiếu nại sau giải ngân và nhiều khiếu nại đồng thời | PASS. Từ chối đóng băng lại khoản đã giải ngân. Giữ FROZEN khi provider còn khiếu nại OPEN. |

Xem [biên bản Giai đoạn 5](migration-baseline/phase-5/README.md) để đối chiếu đủ 15 BR, lệnh, log và ca chưa nghiệm thu.

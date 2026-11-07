# Báo cáo Triển khai Khối 5: Escrow, Khiếu nại, Uy tín, Dashboard (WBS-5.1 → WBS-5.3)

---

## 1. Tổng quan Phân hệ Khối 5

Khối 5 hoàn thiện tầng bảo chứng tài chính và vận hành trung gian của nền tảng **SyncHub**, bảo vệ quyền lợi đa bên (Khách đặt, Chủ sân `VENUE`, Quán ăn/nước `F&B`) thông qua:
1. **Ví trung gian Escrow:** Tự động giữ tiền (`HOLD`), phân tách dòng tiền theo tỷ lệ hoa hồng (`8%` VENUE, `12%` F&B) khi check-in, và ngăn chặn tuyệt đối giải ngân 2 lần bằng khóa `idempotency_key` nguyên tử (`BR-ESC-01..03`).
2. **Cơ chế Đóng băng & Xử lý Khiếu nại (Dispute Resolution):** Đóng băng từng phần (`FROZEN`) đối với nhà cung cấp bị khiếu nại mà không ảnh hưởng đối tác còn lại, cho phép Admin phân xử hoàn tiền minh bạch (`BR-ESC-04`, `BR-DSP-01`).
3. **Động cơ Quản trị Uy tín & Chế tài (Reputation Engine):** Thưởng `+2` điểm khi check-in hoàn thành, phạt `-15` điểm & tịch thu cọc chuyển cho chủ sân khi bùng kèo (`NO_SHOW`), tự động đưa vào danh sách `FLAGGED` nếu điểm rơi xuống dưới 50 (`BR-REP-01..03`).
4. **Cổng Thông tin Đối tác (Provider Portal) & Bảng Điều Khiển Quản Trị (Admin Dashboard):** Trực quan hóa số liệu GMV, hoa hồng, biểu đồ doanh thu theo ngày, tra cứu toàn diện nhật ký kiểm toán `audit_logs` (`UC12`, `WBS-5.3`).

Toàn bộ logic được bảo chứng bằng bộ **65 / 65 automated tests** chạy trên Vitest.

---

## 2. Chi tiết Kỹ thuật Các Phân hệ (WBS-5.1 → WBS-5.3)

### 2.1 WBS-5.1: Escrow Webhook, Check-in & Giải Ngân Đa Bên (BR-ESC-01..03)

#### 1. Webhook Giả Lập Thanh Toán VietQR & Escrow HOLD (BR-ESC-01)
- Endpoint: `POST /api/payments/webhook-mock`
- Khi nhận payload `{ splitBillId }`:
  - Cập nhật `split_bills.status = 'PAID'`, ghi nhận `paid_at = now()`.
  - Sinh giao dịch Escrow giữ tiền trung gian:
    - `type = 'HOLD'`, `status = 'HELD'`, `amount = bill.total`.
    - `idempotency_key = 'hold:{lobby_id}:{split_bill_id}'`.
  - Kiểm tra điều kiện: Nếu toàn bộ split bills của phòng đều đạt `PAID`:
    - Chuyển `group_lobbies.status = 'PAID'`.
    - Chuyển `slots.status = 'BOOKED'`.
    - Broadcast socket `payment:confirmed` đến room `lobby:{id}`.

#### 2. Check-in & Phân Tách Dòng Tiền Giải Ngân (BR-ESC-02)
- Endpoint: `POST /api/lobbies/:id/checkin`
- Khi Host/Provider xác nhận check-in tại sân:
  - **Chủ sân (`VENUE`):** Nhận doanh thu phần sân trừ `8%` hoa hồng sàn:
    $$\text{net\_amount}_{\text{VENUE}} = \text{slot\_price} \times (1 - 0.08)$$
  - **Quán ăn/nước (`FNB`):** Nhận doanh thu phần món + ship trừ giảm giá, trừ `12%` hoa hồng sàn:
    $$\text{net\_amount}_{\text{FNB}} = (\Sigma\text{food} + \text{ship\_fee} - \text{fnb\_discount}) \times (1 - 0.12)$$

#### 3. Chống Giải Ngân Trùng Lặp Idempotency Gate (BR-ESC-03)
- Mỗi lần giải ngân sinh khóa duy nhất:
  - `release:{lobby_id}:{venue_provider_id}`
  - `release:{lobby_id}:{fnb_provider_id}`
- **Cổng kiểm duyệt:** Lần gọi giải ngân thứ 2 sẽ phát hiện khóa trùng trong `escrow_transactions` và trả về ngay lập tức mã lỗi HTTP `409 IDEMPOTENCY_DUPLICATE_RELEASE`.

---

### 2.2 WBS-5.2: Khiếu nại, Phân xử Admin & Uy tín (BR-ESC-04, BR-DSP-01, BR-REP-02/03)

#### 1. Tạo Khiếu Nại Kèm Bằng Chứng & Đóng Băng Escrow Từng Phần (BR-ESC-04)
- Endpoint: `POST /api/disputes` (Hỗ trợ upload đa ảnh qua Multer vào `server/uploads/`).
- Khi Member gửi khiếu nại nhắm vào `target_provider_id`:
  - Tạo bản ghi `disputes` với `status = 'OPEN'`.
  - **Đóng băng có chọn lọc:** Chỉ những giao dịch `escrow_transactions` của `target_provider_id` mới chuyển sang `FROZEN`. Khoản tiền của đối tác còn lại (VD: Chủ sân) vẫn giữ trạng thái `RELEASED` bình thường.
  - Chuyển `group_lobbies.status = 'DISPUTED'`.

#### 2. Admin Phân Xử Khiếu Nại & Hoàn Tiền (BR-DSP-01)
- Endpoint: `PATCH /api/admin/disputes/:id` (hoặc `/:id/resolve`)
- Admin (Role `ADMIN`) có thẩm quyền phân xử:
  - **Chấp thuận (`RESOLVED`):**
    - Sinh giao dịch `escrow_transactions` loại `REFUND` hoàn `refund_amount` cho người dùng (`status = 'REFUNDED'`).
    - Giải ngân phần còn lại $(\text{net\_amount} - \text{refund\_amount})$ cho provider bị khiếu nại.
  - **Từ chối (`REJECTED`):** Giải phóng trạng thái `FROZEN` sang `RELEASED` toàn bộ cho provider.
  - Mọi thao tác bắt buộc sinh bản ghi `audit_logs` tương ứng với `action = 'DISPUTE_RESOLVE'`.

#### 3. Hai Kịch Bản Mẫu Đã Được Seed (WBS-5.2)
1. **Kịch bản (a) — Bùng kèo (`NO_SHOW`):**
   - Thành viên `usr-flag-05` (Phạm Gia Hưng) không đến buổi đặt phòng `lob-00-prev`.
   - Bị trừ `-15` điểm uy tín (từ 57 xuống 42 điểm $\rightarrow$ rơi xuống dưới 50đ $\rightarrow$ tự động gắn cờ `FLAGGED`, bị chặn vào phòng sau này).
   - Tịch thu toàn bộ tiền cọc 30.000đ chuyển thành giao dịch `escrow_transactions` loại `PENALTY` bồi thường cho chủ sân `prv-venue-01`.
2. **Kịch bản (b) — Quán giao thiếu nước:**
   - Khiếu nại `dsp-01` do `usr-mem-02` báo quán `prv-fnb-01` giao thiếu 1 ly trà đào cam sả.
   - Admin `usr-adm-01` duyệt `RESOLVED`, hoàn trả 25.000đ từ Escrow, trừ doanh thu thực nhận của quán.

---

### 2.3 WBS-5.3: Provider Portal & Admin Dashboard (UC12)

#### 1. Provider Portal (`/provider`)
- Kết nối trực tiếp API Backend `GET /api/providers/:id/stats`:
  - Quản lý danh sách slot theo thời gian thực (tổng số slot, slot còn trống, slot đã được đặt `BOOKED`).
  - Thêm slot mới qua `POST /api/providers/:id/slots`.
  - Quản lý thực đơn F&B qua `POST /api/providers/:id/menu` và bật/tắt món qua `PATCH /api/providers/:id/menu/:itemId`.
  - Thống kê doanh thu ròng sau hoa hồng (`net_revenue`), tổng số lượt giải ngân thành công.

#### 2. Admin Dashboard (`/admin`)
- Kết nối API `GET /api/admin/stats`, `GET /api/admin/users`, `GET /api/admin/audit-logs`:
  - Thẻ KPI tổng hợp: Tổng GMV qua Escrow, Hoa hồng VENUE thu về (8%), Hoa hồng F&B thu về (12%), Tổng tài khoản `FLAGGED`.
  - Biểu đồ phân bổ doanh thu & GMV 7 ngày qua.
  - Quản trị tài khoản & điểm uy tín: Mở khóa / gắn cờ `FLAGGED` người dùng có ghi nhật ký kiểm toán.
  - Trung tâm xử lý khiếu nại: Xem chi tiết lý do, ảnh bằng chứng và thực hiện phân xử hoàn tiền trực tiếp.
  - Sổ cái kiểm toán `audit_logs`: Lưu vết lịch sử thay đổi trạng thái user, giao dịch giải ngân và quyết định của Admin.

---

## 3. Tổng Hợp Kết Quả Kiểm Thử (Vitest Test Suite)

Toàn bộ **7 file test** với **65 test cases** đều đạt trạng thái **PASS 100%**:

```text
 ✓ tests/seed-data.test.ts        (4 tests)
 ✓ tests/split-bill.test.ts       (7 tests)
 ✓ tests/auth.test.ts            (12 tests)
 ✓ tests/grouporder.test.ts      (10 tests)
 ✓ tests/dispute-admin.test.ts    (7 tests)
 ✓ tests/escrow.test.ts           (6 tests)
 ✓ tests/bookslot.test.ts        (19 tests)

Test Files  7 passed (7)
     Tests  65 passed (65)
```

### Các Test Case Nghiệp Vụ Cốt Lõi Được Chứng Minh:
1. `BR-ESC-01`: Giả lập webhook cập nhật `PAID`, tạo Escrow `HELD`. Tất cả bill trả đủ $\rightarrow$ phòng chuyển `PAID`, slot chuyển `BOOKED`.
2. `BR-ESC-02`: Giải ngân tách bạch VENUE (trừ 8%) và F&B (trừ 12%), khớp chính xác từng đồng VND.
3. `BR-ESC-03 (GATE)`: Gọi `checkin` giải ngân lần 2 lập tức bị chặn với HTTP `409 IDEMPOTENCY_DUPLICATE_RELEASE`.
4. `BR-REP-02`: Đánh dấu `NO_SHOW` $\rightarrow$ trừ 15đ, dưới 50đ chuyển `FLAGGED`, sinh giao dịch `PENALTY` tịch thu cọc cho sân.
5. `BR-REP-03`: Đánh dấu `CHECKED_IN` $\rightarrow$ cộng +2đ uy tín (tối đa 100đ).
6. `BR-ESC-04`: Gửi khiếu nại $\rightarrow$ chỉ đóng băng `FROZEN` tiền của quán bị khiếu nại, tiền sân vẫn giải ngân bình thường.
7. `BR-DSP-01`: Admin duyệt hoàn tiền một phần từ Escrow, mở giải ngân phần còn lại, tự động ghi `audit_logs`.

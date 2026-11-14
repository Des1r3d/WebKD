# CONTEXT — SyncHub (BookSlot + GroupOrder)

> **SOURCE OF TRUTH (LOCKED — `context-v1`)**
> Mọi AI Agent bắt buộc đọc file này trước khi viết code. **KHÔNG** tự ý thêm/đổi tên bảng, cột, enum, hoặc công thức ngoài file này.

---

## 1. Kiến trúc & Quy ước Chung

- **Stack:** HTML + CSS + JavaScript ES modules + Leaflet (Client cùng origin với Express) · Node.js + Express + JavaScript + Socket.io (Server) · PostgreSQL 16 + Prisma 5.x (Database).
- **Tiền tệ:** Lưu kiểu `Int` (VND, không có phần thập phân). Mọi phép chia dùng `Math.floor` + phân phối phần dư theo thuật toán **Largest Remainder** (Mục 5).
- **Thời gian:** Lưu UTC (`TIMESTAMPTZ` / `DateTime`), hiển thị `Asia/Ho_Chi_Minh` (`UTC+7`).
- **Tỷ lệ hoa hồng mặc định:** `VENUE = 0.08` (8%), `FNB = 0.12` (12%).
- **Phạm vi loại trừ (Out-of-scope):** Cổng thanh toán ngân hàng thật (dùng VietQR thật + webhook giả lập), điều phối shipper thực tế (phí ship cố định/theo khoảng cách), ứng dụng mobile native (dùng responsive web).

---

## 2. Enums (Chuẩn hóa Schema & Code)

```typescript
export enum Role {
  HOST = 'HOST',
  MEMBER = 'MEMBER',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  FLAGGED = 'FLAGGED',
  BANNED = 'BANNED',
}

export enum ProviderType {
  VENUE = 'VENUE',
  FNB = 'FNB',
}

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',
  LOCKED = 'LOCKED',
  BOOKED = 'BOOKED',
}

export enum LobbyStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

export enum LobbyMemberStatus {
  JOINED = 'JOINED',
  LEFT = 'LEFT',
  NO_SHOW = 'NO_SHOW',
  CHECKED_IN = 'CHECKED_IN',
}

export enum VoucherScope {
  VENUE = 'VENUE',
  FNB = 'FNB',
  CROSS = 'CROSS',
}

export enum DiscountType {
  PERCENT = 'PERCENT',
  FIXED = 'FIXED',
}

export enum SplitBillStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export enum EscrowTxType {
  HOLD = 'HOLD',
  RELEASE = 'RELEASE',
  REFUND = 'REFUND',
  PENALTY = 'PENALTY',
}

export enum EscrowStatus {
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  FROZEN = 'FROZEN',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
}
```

---

## 3. Cơ sở dữ liệu — 12 Bảng Khóa

| # | Bảng | Cột chính & Kiểu | Ràng buộc & Index |
|---|---|---|---|
| 1 | `users` | `id` (UUID PK), `email` (String), `password_hash` (String), `full_name` (String), `phone` (String), `role` (`Role`, default `MEMBER`), `reputation_score` (Int, default `100`), `status` (`UserStatus`, default `ACTIVE`), `created_at` | `UNIQUE(email)`, `INDEX(role, status)` |
| 2 | `providers` | `id` (UUID PK), `owner_id` (FK → `users.id`), `type` (`ProviderType`), `category` (String: `badminton`, `study_room`, `football`, `milk_tea`, `coffee`, `snack`), `name` (String), `address` (String), `lat` (Float), `lng` (Float), `open_hours` (String, VD `"07:00-22:00"`), `bank_code` (String), `bank_account` (String), `commission_rate` (Float: VENUE `0.08`, FNB `0.12`), `created_at` | `INDEX(type, category)`, `INDEX(lat, lng)` |
| 3 | `slots` | `id` (UUID PK), `provider_id` (FK → `providers.id`), `start_at` (DateTime), `end_at` (DateTime), `price` (Int), `status` (`SlotStatus`, default `AVAILABLE`), `locked_by` (FK → `users.id`?, nullable), `locked_until` (DateTime?, nullable) | `UNIQUE(provider_id, start_at)`, `INDEX(status, locked_until)` |
| 4 | `menu_items` | `id` (UUID PK), `provider_id` (FK → `providers.id`), `name` (String), `price` (Int), `image_url` (String?), `is_available` (Boolean, default `true`), `order_count` (Int, default `0`) | `INDEX(provider_id, is_available)` |
| 5 | `group_lobbies` | `id` (UUID PK), `host_id` (FK → `users.id`), `slot_id` (FK → `slots.id`), `fnb_provider_id` (FK → `providers.id`?, nullable), `invite_code` (String, 6-8 ký tự), `status` (`LobbyStatus`, default `OPEN`), `deadline_at` (DateTime), `ship_fee` (Int, default `15000`), `voucher_id` (FK → `vouchers.id`?, nullable), `locked_at` (DateTime?, nullable), `created_at` | `UNIQUE(invite_code)`, `UNIQUE(slot_id)`, `INDEX(host_id, status)` |
| 6 | `lobby_members` | `lobby_id` (FK → `group_lobbies.id`), `user_id` (FK → `users.id`), `deposit_required` (Int, default `0`), `deposit_paid` (Int, default `0`), `status` (`LobbyMemberStatus`, default `JOINED`), `joined_at` (DateTime) | `PK(lobby_id, user_id)`, `INDEX(user_id)` |
| 7 | `cart_items` | `id` (UUID PK), `lobby_id` (FK → `group_lobbies.id`), `user_id` (FK → `users.id`), `menu_item_id` (FK → `menu_items.id`), `qty` (Int), `unit_price_snapshot` (Int), `created_at` | `INDEX(lobby_id, user_id)` |
| 8 | `vouchers` | `id` (UUID PK), `code` (String), `scope` (`VoucherScope`), `discount_type` (`DiscountType`), `value` (Int), `max_discount` (Int), `min_order` (Int, default `0`), `max_distance_m` (Int, default `1000`), `valid_from` (DateTime), `valid_to` (DateTime), `usage_limit` (Int), `used_count` (Int, default `0`) | `UNIQUE(code)` |
| 9 | `split_bills` | `id` (UUID PK), `lobby_id` (FK → `group_lobbies.id`), `user_id` (FK → `users.id`), `slot_share` (Int), `food_amount` (Int), `ship_share` (Int), `discount_share` (Int), `deposit_offset` (Int, default `0`), `total` (Int), `vietqr_url` (String), `status` (`SplitBillStatus`, default `PENDING`), `paid_at` (DateTime?) | `UNIQUE(lobby_id, user_id)`, `INDEX(status)` |
| 10 | `escrow_transactions` | `id` (UUID PK), `lobby_id` (FK → `group_lobbies.id`), `split_bill_id` (FK → `split_bills.id`?, nullable), `type` (`EscrowTxType`), `amount` (Int), `platform_fee` (Int, default `0`), `net_amount` (Int, default `0`), `payee_provider_id` (FK → `providers.id`?, nullable), `status` (`EscrowStatus`, default `HELD`), `idempotency_key` (String), `created_at` | `UNIQUE(idempotency_key)`, `INDEX(lobby_id, type, status)` |
| 11 | `disputes` | `id` (UUID PK), `lobby_id` (FK → `group_lobbies.id`), `reporter_id` (FK → `users.id`), `target_provider_id` (FK → `providers.id`), `reason` (String), `evidence_urls` (String[]), `status` (`DisputeStatus`, default `OPEN`), `refund_amount` (Int, default `0`), `resolved_by` (FK → `users.id`?, nullable), `resolved_at` (DateTime?), `created_at` | `INDEX(status)`, `INDEX(lobby_id)` |
| 12 | `audit_logs` | `id` (UUID PK), `actor_id` (FK → `users.id`?, nullable), `action` (String), `entity` (String), `entity_id` (String), `before` (Json?), `after` (Json?), `created_at` (DateTime) | `INDEX(entity, entity_id)`, `INDEX(created_at)` |

> **Lưu ý thiết kế:**
> - Chat trong phòng lưu in-memory tối đa 50 tin nhắn/phòng qua Socket.io (`chat:message`).
> - Lịch sử biến động điểm uy tín lưu trong `audit_logs` với `action = 'REPUTATION_CHANGE'`, `entity = 'users'`.

---

## 4. Mười lăm Luật Nghiệp vụ (15 Business Rules)

| Mã | Tên luật | Đặc tả chi tiết & Ràng buộc |
|---|---|---|
| **BR-SLT-01** | Giữ chỗ tạm 10 phút | Khi Host chọn slot, cập nhật nguyên tử `status = 'LOCKED'`, `locked_by = userId`, `locked_until = now() + 10 minutes`. Cron/interval mỗi 60s quét các slot `LOCKED` có `locked_until < now()` (mà chưa `BOOKED`) để trả về `AVAILABLE` và phát socket `slot:released`. |
| **BR-SLT-02** | Chống đặt trùng slot | Mỗi `(provider_id, start_at)` là duy nhất. Lệnh lock dùng điều kiện nguyên tử `WHERE id = $slot AND (status = 'AVAILABLE' OR (status = 'LOCKED' AND locked_until < now()))`. Nếu `rowCount === 0` → trả HTTP `409 SLOT_TAKEN`. |
| **BR-INT-01** | Gắn kết Lobby & Slot | Một `group_lobbies` bắt buộc gắn với 1 `slot_id` đang được giữ bởi chính `host_id` (hoặc đã `BOOKED`). Thành viên chỉ được thêm/sửa/xóa `cart_items` khi `group_lobbies.status === 'OPEN'`. |
| **BR-INT-02** | Công thức chia bill chuẩn | Tiền sân sau giảm giá VENUE/CROSS (`slot_net`) chia đều cho số thành viên `JOINED`. Tiền đồ ăn (`food_i`) tính theo món từng người đặt. Khoản điều chỉnh FNB (`adj = ship_fee - fnb_discount`) phân bổ theo tỷ lệ `food_i / Σfood`. Áp dụng làm tròn `Math.floor` + **Largest Remainder** (nếu dư bằng nhau thì dồn cho Host). Bắt buộc `Σ total_i === Tổng hóa đơn`. |
| **BR-INT-03** | Hủy liên đới & Rời muộn | (1) Nếu slot/lobby bị hủy (`CANCELLED`) → hủy toàn bộ đơn FNB đi kèm và tự động chuyển các khoản `escrow_transactions` đang `HELD` sang `REFUNDED`. (2) Thành viên tự ý rời phòng sau khi phòng đã `LOCKED` vẫn phải chịu phần tiền sân (khấu trừ từ `deposit_paid`). |
| **BR-INT-04** | Khóa giỏ hàng tức thì | Khi Host bấm chốt phòng (`status = 'LOCKED'`), server lập tức từ chối mọi request chỉnh sửa giỏ hàng (`403 LOBBY_LOCKED`) và broadcast sự kiện `lobby:locked` để mọi client vô hiệu hóa nút thêm/sửa món ngay lập tức. |
| **BR-INT-05** | Điều kiện Voucher chéo (`CROSS`) | Mã giảm giá có `scope = 'CROSS'` chỉ áp dụng được khi: (1) Lobby có `slot_id` và có ít nhất 1 món trong `cart_items` (`fnb_provider_id != null`), (2) Khoảng cách Haversine giữa `VENUE` và `FNB` ≤ `voucher.max_distance_m` (mặc định `1000m`), (3) Đạt `min_order`, còn hạn và còn lượt dùng. |
| **BR-REP-01** | Phân hạng Uy tín & Cọc | Điểm khởi tạo `100`. Khi vào phòng (`join`), kiểm tra `reputation_score`: **Hạng A (≥ 90):** miễn cọc (`0%`); **Hạng B (70–89):** cọc `30%` phần tiền sân dự kiến; **Hạng C (50–69):** cọc `100%` phần tiền sân dự kiến; **Dưới 50 điểm:** trạng thái `FLAGGED`, chặn tham gia phòng (`403 REPUTATION_TOO_LOW`). |
| **BR-REP-02** | Phạt bùng kèo (`NO_SHOW`) | Thành viên không đến khi check-in bị đánh dấu `NO_SHOW`: trừ `15` điểm uy tín (nếu `< 50` thì chuyển `status = 'FLAGGED'`), tịch thu tiền cọc (`deposit_paid`) chuyển cho chủ sân qua giao dịch `escrow_transactions` loại `PENALTY`, ghi `audit_logs`. |
| **BR-REP-03** | Thưởng hoàn thành (`CHECKED_IN`) | Thành viên hoàn thành buổi (`CHECKED_IN`) được cộng `+2` điểm uy tín, tối đa không vượt quá `100` điểm (`Math.min(100, score + 2)`), ghi `audit_logs`. |
| **BR-ESC-01** | Giữ tiền trung gian (`HOLD`) | Khi nhận xác nhận thanh toán cho `split_bill` (qua webhook giả lập), cập nhật `split_bills.status = 'PAID'` và tạo bản ghi `escrow_transactions` (`type = 'HOLD'`, `status = 'HELD'`). Khi tất cả `split_bills` của phòng đều `PAID` → chuyển `group_lobbies.status = 'PAID'`, `slots.status = 'BOOKED'`. |
| **BR-ESC-02** | Giải ngân đa bên & Hoa hồng | Khi Host/Provider xác nhận `check-in`, hệ thống tách dòng tiền từ Escrow giải ngân cho 2 bên: (1) Chủ sân (`VENUE`) nhận `slot_net * (1 - 0.08)`, nền tảng thu `8%`; (2) Quán (`FNB`) nhận `(Σfood + ship_fee - fnb_discount) * (1 - 0.12)`, nền tảng thu `12%`. |
| **BR-ESC-03** | Chống giải ngân trùng (`Idempotency`) | Mọi giao dịch giải ngân/hoàn tiền phải có `idempotency_key` duy nhất theo mẫu `release:{lobby_id}:{provider_id}` hoặc `refund:{lobby_id}:{split_bill_id}`. Ràng buộc `UNIQUE(idempotency_key)` + cập nhật có điều kiện `WHERE status = 'HELD'` ngăn chặn tuyệt đối việc giải ngân 2 lần. |
| **BR-ESC-04** | Đóng băng khi có khiếu nại | Nếu có khiếu nại `disputes.status = 'OPEN'` nhắm vào `target_provider_id` trước thời điểm giải ngân, phần tiền Escrow của provider đó bị chuyển sang `FROZEN` (chỉ giải ngân phần của provider không bị khiếu nại). |
| **BR-DSP-01** | Phân xử Khiếu nại & Audit Log | Admin duyệt khiếu nại (`RESOLVED` hoặc `REJECTED`), quyết định số tiền hoàn `refund_amount` (một phần hoặc toàn phần) từ khoản `FROZEN`/`HELD` trả về cho các thành viên, phần còn lại `RELEASE` cho provider. Mọi thao tác bắt buộc ghi `audit_logs`. |

---

## 5. Thuật toán Chia Bill & Làm tròn (BR-INT-02)

### 5.1 Công thức chuẩn

Cho $N$ thành viên có trạng thái `JOINED` trong phòng ($i \in \{1..N\}$):

1. **Tiền sân ròng (`slot_net`):**
   $$\text{slot\_net} = \max(0, \text{slot\_price} - \text{venue\_or\_cross\_discount})$$
   Phần sân cơ sở mỗi người: $\text{slot\_base}_i = \lfloor \text{slot\_net} / N \rfloor$, phần dư $\text{rem\_slot} = \text{slot\_net} \bmod N$.
2. **Tiền món cá nhân (`food_i`):**
   $$\text{food}_i = \sum_{k \in \text{cart}(i)} (\text{qty}_k \times \text{unit\_price\_snapshot}_k), \quad \Sigma\text{food} = \sum_{i=1}^N \text{food}_i$$
3. **Điều chỉnh FNB (`adj` = Ship − Voucher FNB):**
   $$\text{adj} = \text{ship\_fee} - \text{fnb\_discount}$$
   - Nếu $\Sigma\text{food} = 0$: $\text{adj\_share}_i = 0$ (không có đơn FNB thì `ship_fee = 0`, `fnb_discount = 0`).
   - Nếu $\Sigma\text{food} > 0$: Giá trị thực $\text{raw}_i = \text{slot\_net}/N + \text{food}_i + \text{adj} \times (\text{food}_i / \Sigma\text{food})$.
4. **Làm tròn Largest Remainder (Hamilton Method):**
   - Đặt $\text{floor}_i = \lfloor \text{raw}_i \rfloor$ và phần lẻ $\text{frac}_i = \text{raw}_i - \text{floor}_i$.
   - Tổng cần bù: $\Delta = \text{GrandTotal} - \sum_{i=1}^N \text{floor}_i$, với $\text{GrandTotal} = \text{slot\_net} + \Sigma\text{food} + \text{adj}$.
   - Sắp xếp thành viên giảm dần theo $\text{frac}_i$; nếu $\text{frac}_i$ bằng nhau, ưu tiên cộng cho **Host** (`user_id === host_id`), sau đó theo thứ tự `joined_at` tăng dần.
   - Cộng $+1$ VND cho $\Delta$ người đầu tiên → thu được $\text{gross\_total}_i$.
   - Khấu trừ tiền cọc đã đóng: $\text{payable}_i = \max(0, \text{gross\_total}_i - \text{deposit\_paid}_i)$.
5. **Bất biến bắt buộc (Assertion):**
   $$\sum_{i=1}^N \text{gross\_total}_i === \text{slot\_net} + \Sigma\text{food} + \text{adj}$$
   Nếu sai lệch dù chỉ 1 VND → `throw Error('SPLIT_SUM_MISMATCH')`, rollback transaction.

### 5.2 Ca kiểm tra chuẩn (Test Vector bắt buộc Pass)

- **Đầu vào:** Sân `120.000` VND / 4 người (A là Host, B, C, D); Món: A `25.000`, B `30.000`, C `0`, D `45.000` ($\Sigma\text{food} = 100.000$); Ship `15.000`; Voucher FNB `-20.000` ($\text{adj} = -5.000$).
- **Kết quả kỳ vọng:**

| Thành viên | `slot_share` | `food_amount` | `ship_share` | `discount_share` | `adj` ròng | **`total` (VND)** |
|---|---:|---:|---:|---:|---:|---:|
| **A (Host)** | 30.000 | 25.000 | 3.750 | 5.000 | −1.250 | **53.750** |
| **B** | 30.000 | 30.000 | 4.500 | 6.000 | −1.500 | **58.500** |
| **C** | 30.000 | 0 | 0 | 0 | 0 | **30.000** |
| **D** | 30.000 | 45.000 | 6.750 | 9.000 | −2.250 | **72.750** |
| **Tổng ($\Sigma$)** | **120.000** | **100.000** | **15.000** | **20.000** | **−5.000** | **215.000** |

---

## 6. Mười hai Use Cases (UC01 → UC12)

| Mã | Tên Use Case | Actor chính | BR liên quan | Đầu vào → Đầu ra chính |
|---|---|---|---|---|
| **UC01** | Đăng ký / Đăng nhập / Xem hạng uy tín | All | BR-REP-01 | Email/Pass → JWT token + thông tin điểm uy tín & hạng (A/B/C/FLAGGED). |
| **UC02** | Tìm kiếm đa tiêu chí & Bản đồ | Member, Host | — | Tọa độ `(lat, lng)`, bán kính, loại hình, mức giá → Danh sách `VENUE`/`FNB` + Marker Leaflet. |
| **UC03** | Đặt & Giữ chỗ Slot | Host | BR-SLT-01, BR-SLT-02 | `slot_id` → Lock nguyên tử 10 phút (`locked_until`), trả `409` nếu trùng. |
| **UC04** | Tạo phòng ghép kèo & Mời qua Link/QR | Host | BR-INT-01 | `slot_id`, `deadline_at`, `fnb_provider_id?` → `invite_code`, link & mã QR mời bạn. |
| **UC05** | Tham gia phòng & Kiểm tra cọc uy tín | Member | BR-REP-01 | `invite_code` → Tính `deposit_required` theo hạng A/B/C, chặn nếu `< 50` điểm. |
| **UC06** | Giỏ hàng chung & Chat Realtime | Host, Member | BR-INT-01, BR-INT-04 | Socket `cart:add/update/remove`, `chat:send` → Đồng bộ `< 1s` cho toàn bộ room `lobby:{id}`. |
| **UC07** | Gợi ý Quán/Món & Áp Voucher chéo | Host | BR-INT-05 | `lobby_id` → Top quán FNB theo điểm `score` (khoảng cách, giờ mở, lượt đặt) + kiểm tra mã `CROSS`. |
| **UC08** | Chốt phòng, Chia bill & Sinh VietQR | Host | BR-INT-02, BR-INT-04 | Lock phòng → Chạy `splitBill`, lưu `split_bills`, sinh URL VietQR từng thành viên. |
| **UC09** | Thanh toán & Giữ tiền Escrow | Member | BR-ESC-01 | Webhook giả lập xác nhận chuyển khoản → `split_bills.PAID`, tạo `escrow_transactions.HOLD`. |
| **UC10** | Check-in & Giải ngân đa bên | Host, Provider | BR-ESC-02, BR-ESC-03, BR-REP-02, BR-REP-03 | Đánh dấu `CHECKED_IN`/`NO_SHOW` → Giải ngân tách VENUE (trừ 8%) & FNB (trừ 12%), cộng/trừ điểm uy tín. |
| **UC11** | Gửi & Phân xử Khiếu nại | Member, Admin | BR-ESC-04, BR-DSP-01, BR-INT-03 | Upload ảnh bằng chứng → Đóng băng (`FROZEN`) khoản tiền liên quan → Admin hoàn tiền/giải ngân + ghi `audit_logs`. |
| **UC12** | Portal Provider & Admin Dashboard | Provider, Admin | BR-DSP-01 | Quản lý slot/menu, xem biểu đồ doanh thu, danh sách `FLAGGED`, tra cứu `audit_logs`. |

---

## 7. API Contract & Socket Events

### 7.1 REST API Endpoints

| Phân hệ | Method & Endpoint | Role | Mô tả & Luật áp dụng |
|---|---|---|---|
| **Auth** | `POST /api/auth/register` | Public | Tạo tài khoản (`reputation_score = 100`) |
| | `POST /api/auth/login` | Public | Trả JWT access token + thông tin user |
| | `GET /api/auth/me` | Authenticated | Lấy hồ sơ + điểm uy tín + hạng A/B/C |
| **Providers** | `GET /api/providers` | Public | Lọc theo `type`, `lat`, `lng`, `radius`, `priceMin`, `priceMax`, `category` |
| | `GET /api/providers/:id` | Public | Chi tiết sân (kèm `slots`) hoặc quán (kèm `menu_items`) |
| | `POST /api/providers/:id/slots` | PROVIDER | Tạo lịch slot mới |
| | `POST /api/providers/:id/menu` | PROVIDER | Thêm/cập nhật món trong menu |
| **Slots** | `POST /api/slots/:id/lock` | HOST, MEMBER | Khóa slot nguyên tử 10 phút (`BR-SLT-01`, `BR-SLT-02`) |
| | `POST /api/slots/:id/release` | HOST, MEMBER | Nhả slot đang giữ về `AVAILABLE` |
| **Lobbies** | `POST /api/lobbies` | HOST, MEMBER | Tạo phòng từ slot đã lock (`BR-INT-01`) |
| | `GET /api/lobbies/:code` | Authenticated | Xem chi tiết phòng theo `invite_code` hoặc `id` |
| | `POST /api/lobbies/:id/join` | Authenticated | Vào phòng, kiểm tra uy tín & tính mức cọc (`BR-REP-01`) |
| | `POST /api/lobbies/:id/leave` | Authenticated | Rời phòng (xử lý cọc nếu rời sau `LOCKED` theo `BR-INT-03`) |
| | `POST /api/lobbies/:id/lock` | HOST | Khóa giỏ hàng (`BR-INT-04`) + emit `lobby:locked` |
| | `POST /api/lobbies/:id/cancel` | HOST | Hủy liên đới phòng + đơn FNB + hoàn tiền (`BR-INT-03`) |
| | `POST /api/lobbies/:id/split` | HOST | Tính chia bill (`BR-INT-02`), sinh VietQR, chuyển `AWAITING_PAYMENT` |
| | `POST /api/lobbies/:id/checkin` | HOST, PROVIDER | Điểm danh `CHECKED_IN`/`NO_SHOW`, giải ngân đa bên (`BR-ESC-02`, `BR-ESC-03`, `BR-REP-02`, `BR-REP-03`) |
| **Recommend & Promo** | `GET /api/recommend?lobbyId=` | Authenticated | Gợi ý quán FNB quanh sân + món hay đặt kèm |
| | `POST /api/vouchers/validate` | HOST | Kiểm tra & gắn voucher (`VENUE`/`FNB`/`CROSS`, `BR-INT-05`) |
| **Payments & Escrow** | `POST /api/payments/webhook-mock` | Authenticated | Giả lập nhận tiền VietQR → `PAID` + `escrow HOLD` (`BR-ESC-01`) |
| | `GET /api/escrow/:lobbyId` | Authenticated | Xem trạng thái giữ/giải ngân/hoàn tiền của phòng |
| **Disputes & Admin** | `POST /api/disputes` | Authenticated | Gửi khiếu nại kèm ảnh (`multer`), đóng băng Escrow (`BR-ESC-04`) |
| | `PATCH /api/admin/disputes/:id` | ADMIN | Phân xử hoàn tiền một phần/toàn phần (`BR-DSP-01`) |
| | `GET /api/admin/stats` | ADMIN | Thống kê doanh thu, hoa hồng, danh sách `FLAGGED`, `audit_logs` |

### 7.2 Socket.io Contract (Namespace `/`, Room `lobby:{lobbyId}`)

- **Client → Server:**
  - `lobby:join` `{ lobbyId }`
  - `lobby:leave` `{ lobbyId }`
  - `cart:add` `{ lobbyId, menuItemId, qty }` (kiểm tra `lobby.status === 'OPEN'`)
  - `cart:update` `{ lobbyId, cartItemId, qty }`
  - `cart:remove` `{ lobbyId, cartItemId }`
  - `chat:send` `{ lobbyId, text }`
- **Server → Room:**
  - `lobby:members` `{ members: LobbyMember[] }`
  - `cart:updated` `{ items: CartItem[], subtotal: number, fnbProviderId: string | null }`
  - `chat:message` `{ id, userId, fullName, text, createdAt }`
  - `lobby:locked` `{ lobbyId, lockedAt }`
  - `bill:ready` `{ lobbyId, splitBills: SplitBill[] }`
  - `payment:confirmed` `{ lobbyId, userId, splitBillId, lobbyStatus }`
  - `escrow:released` `{ lobbyId, transactions: EscrowTransaction[] }`
  - `slot:released` `{ slotId, providerId }`
  - `notify` `{ type: 'INFO' | 'WARNING' | 'ERROR', message: string }`

---

## 8. Công thức Gợi ý & VietQR

- **Điểm gợi ý quán FNB:**
  $$\text{score} = 0.5 \times \max\left(0, 1 - \frac{d_{\text{meters}}}{1000}\right) + 0.3 \times \text{isOpenAtSlotTime} + 0.2 \times \text{norm}(\text{order\_count}) + \text{crossVoucherBonus}(0.15)$$
- **URL VietQR chuẩn:**
  `https://img.vietqr.io/image/${BANK}-${ACCOUNT}-compact2.png?amount=${total}&addInfo=${encodeURIComponent(`SYNCHUB ${inviteCode} ${userId.slice(0,6)}`)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`

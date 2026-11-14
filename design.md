# SyncHub Design System (design.md)

> **Theme:** Emerald Pulse (Court & Crisp)  
> **Phiên bản:** 1.0.0 — Khóa theo WBS-2.0 & Hallmark Floor  
> **Mục tiêu:** Giao diện thể thao năng động, tin cậy về tài chính (Escrow/Chia bill), thao tác tối ưu trên Mobile (≤ 3 click từ đặt sân sang giỏ hàng F&B).

> **Công cụ:** Giao diện vanilla dùng `client/vanilla/tokens.css`, CSS theo thành phần và biểu tượng SVG.

---

## 1. Triết lý thiết kế & Tiêu chuẩn Hallmark (The Floor)

1. **Tokens-first:** Toàn bộ màu sắc, kích thước và font đều qua biến CSS `:root` trong `tokens.css`. Không dùng mã màu trực tiếp trong component.
2. **Motion có kiểm soát:** Không sử dụng `transition: all`. Chỉ animate `opacity` và `transform`. Mọi chuyển động có fallback `@media (prefers-reduced-motion: reduce)`.
3. **Typography rõ ràng:** Heading dùng font đậm tự nhiên, không in nghiêng tùy tiện, số tiền luôn dùng font monospace/tabular-nums để căn lề thẳng hàng.
4. **Layout di động:** Cắt cụt ngang `overflow-x: clip` trên `html, body`. Grid linh hoạt `minmax(0, 1fr)`.
5. **Khả năng tiếp cận (a11y):** Mọi thành phần tương tác đều có `:focus-visible` chuẩn sắc nét, độ tương phản văn bản đạt chuẩn WCAG AA.
6. **Không "AI Slop":** Không dùng gradient tím-xanh công nghiệp, không lồng card trong card thừa thãi, không dùng emoji thay thế icon hệ thống (dùng biểu tượng SVG).

---

## 2. Hệ màu (Color Palette & Semantic Tokens)

### 2.1 Bảng màu cốt lõi (Core Palette)

| Tên Token | Biến CSS | Giá trị HEX | Ứng dụng |
|---|---|---|---|
| **Brand Primary** | `--color-primary` | `#059669` (Emerald 600) | Nút chính, thương hiệu, sân đấu, thành công |
| **Brand Primary Hover** | `--color-primary-hover` | `#047857` (Emerald 700) | Trạng thái hover/active nút chính |
| **Brand Primary Light** | `--color-primary-light` | `#ECFDF5` (Emerald 50) | Nền badge, highlight card sân |
| **Brand Accent (F&B)** | `--color-accent` | `#D97706` (Amber 600) | Đồ ăn uống, giỏ hàng, thông báo lưu ý |
| **Brand Accent Light** | `--color-accent-light` | `#FFFBEB` (Amber 50) | Nền giỏ hàng F&B, tag voucher F&B |
| **Background App** | `--color-bg-app` | `#F8FAFC` (Slate 50) | Nền toàn trang |
| **Background Surface** | `--color-bg-surface` | `#FFFFFF` | Nền Card, Modal, Dropdown, Drawer |
| **Background Subtle** | `--color-bg-subtle` | `#F1F5F9` (Slate 100) | Nền input, badge xám, phân cách |
| **Border Default** | `--color-border-default` | `#E2E8F0` (Slate 200) | Đường viền thẻ, bảng |
| **Border Strong** | `--color-border-strong` | `#CBD5E1` (Slate 300) | Đường viền input, focus outline |
| **Text Primary** | `--color-text-primary` | `#0F172A` (Slate 900) | Tiêu đề, số tiền chính, nội dung quan trọng |
| **Text Secondary** | `--color-text-secondary` | `#475569` (Slate 600) | Đoạn văn, nhãn phụ, mô tả |
| **Text Muted** | `--color-text-muted` | `#94A3B8` (Slate 400) | Placeholder, ghi chú nhỏ, timestamp |

### 2.2 Màu trạng thái nghiệp vụ (Business Semantic Tokens)

Tuân thủ nghiêm ngặt theo 12 bảng & 15 Business Rules của `CONTEXT.md`:

#### A. Trạng thái Slot & Phòng ghép kèo (`group_lobbies`)
* `--status-available`: `#10B981` (Emerald 500) — Slot trống, sẵn sàng đặt
* `--status-open`: `#059669` (Emerald 600) — Phòng đang mở, giỏ hàng đang nhận món
* `--status-locked`: `#D97706` (Amber 600) — Slot đang giữ 10' / Host đã chốt giỏ hàng
* `--status-awaiting`: `#2563EB` (Blue 600) — Chờ thanh toán chia bill
* `--status-paid`: `#0D9488` (Teal 600) — Đã thanh toán đầy đủ / Tiền vào Escrow
* `--status-completed`: `#059669` (Emerald 600) — Đã check-in & hoàn tất giải ngân
* `--status-cancelled`: `#64748B` (Slate 500) — Đã hủy / Hết hạn
* `--status-disputed`: `#DC2626` (Red 600) — Đang có khiếu nại đóng băng tiền

#### B. Phân hạng uy tín thành viên (`users.reputation_score`) — `BR-REP-01`
* `--rep-a`: `#059669` (Hạng A ≥ 90): Uy tín cao — Miễn cọc (0% cọc)
* `--rep-b`: `#D97706` (Hạng B 70–89): Uy tín khá — Yêu cầu cọc 30% tiền sân
* `--rep-c`: `#EA580C` (Hạng C 50–69): Rủi ro trung bình — Yêu cầu cọc 100% tiền sân
* `--rep-flagged`: `#DC2626` (Hạng < 50): Bị cảnh báo / Chặn vào phòng ghép kèo

---

## 3. Hệ thống Typography (Kiểu chữ & Cỡ chữ)

* **Font gia đình chính (Sans):** `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
* **Font hiển thị tiền & mã số (Tabular / Mono):** `'JetBrains Mono', 'Fira Code', monospace` (bật tính năng font `font-feature-settings: "tnum"`)

| Kích cỡ | Size / Line-height | Font Weight | Áp dụng |
|---|---|---|---|
| `text-display` | 32px / 40px | Bold (700) | Tiêu đề trang chính, Banner Hero |
| `text-h1` | 24px / 32px | Bold (700) | Tiêu đề trang, Tên phòng, Tên sân |
| `text-h2` | 20px / 28px | SemiBold (600) | Tên mục, Tiêu đề Card lớn |
| `text-h3` | 16px / 24px | SemiBold (600) | Tiêu đề Card nhỏ, Tên món, Tên người |
| `text-body` | 14px / 20px | Regular (400) | Nội dung văn bản thông thường, mô tả |
| `text-caption` | 12px / 16px | Medium (500) | Nhãn phụ, badge, ghi chú thời gian |
| `text-money` | 15px / 20px | SemiBold (600) | Hiển thị tiền VNĐ (Tabular Figures) |

---

## 4. Spacing, Radius & Elevation (Khoảng cách & Khối hình)

* **Spacing Grid (Bội số 4px):**
  * `space-1`: 4px
  * `space-2`: 8px
  * `space-3`: 12px
  * `space-4`: 16px (Padding chuẩn card di động)
  * `space-6`: 24px (Khoảng cách section)
  * `space-8`: 32px
* **Border Radius:**
  * `radius-sm`: 6px (Badge, Tag, Switch)
  * `radius-md`: 8px (Button, Input, Dropdown item)
  * `radius-lg`: 12px (Card chuẩn, Container nhỏ)
  * `radius-xl`: 16px (Modal, Drawer, QR Card)
  * `radius-full`: 9999px (Avatar, Pill badge)
* **Shadows:**
  * `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
  * `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)`
  * `shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.02)`

---

## 5. Quy chuẩn 10 Thành phần Nền tảng (Core Components)

1. **`Button`**: 5 biến thể (`primary`, `secondary`, `outline`, `danger`, `ghost`). 3 cỡ (`sm`, `md`, `lg`). Hỗ trợ icon đầu/cuối, loading spinner, disabled state.
2. **`Card`**: Khung viền tinh tế `border-border-default bg-surface rounded-xl shadow-sm`. Hỗ trợ hover elevation khi là `interactive`.
3. **`Badge`**: Hiển thị trạng thái Slot (`AVAILABLE`, `LOCKED`, `BOOKED`), Lobby (`OPEN`, `LOCKED`, `AWAITING_PAYMENT`, `PAID`, `COMPLETED`), và Hạng uy tín (`A`, `B`, `C`, `FLAGGED`).
4. **`Modal`**: Hộp thoại nổi có backdrop làm mờ nhẹ, đóng bằng ESC hoặc click ngoài, giới hạn chiều rộng theo chuẩn thiết bị.
5. **`Countdown`**: Đồng hồ đếm ngược trực quan với định dạng `mm:ss`, đổi màu vàng khi < 3 phút, đỏ nhấp nháy khi < 1 phút (phục vụ BR-SLT-01 10 phút giữ slot).
6. **`MemberAvatar`**: Ảnh đại diện tròn, kèm badge Host (vương miện) và nhãn xếp hạng uy tín nhỏ gọn ở góc.
7. **`MoneyText`**: Hiển thị số tiền VND chuẩn định dạng Việt Nam (`120.000 ₫`), hỗ trợ tiền âm/giảm giá (`-15.000 ₫`), tiền dương, kiểu chữ tabular figures.
8. **`QRCard`**: Khối hiển thị ảnh VietQR / Invite QR với khung bo cong, nút sao chép link / số tài khoản, thông tin hướng dẫn thanh toán.
9. **`CartRow`**: Hàng hiển thị món ăn trong giỏ hàng chung: ảnh đại diện món, tên món, người đặt (`user_id`/tên), giá đơn vị, nút tăng/giảm số lượng (`+`, `-`). Bị vô hiệu hóa lập tức khi phòng chuyển sang `LOCKED`.
10. **`ChatBubble`**: Bong bóng chat realtime cho phòng ghép: phân biệt rõ ràng giữa tin nhắn của tôi (phải, màu primary sáng), tin nhắn đồng đội (trái, nền xám nhạt kèm tên & avatar), và tin nhắn hệ thống (ở giữa, viền mờ).

---

## 6. Layout & Nguyên tắc UX Hành trình (≤ 3 Click)

```
[Màn 1: Home/Map] ──(Click 1: Chọn sân & Khóa Slot)──> 
[Màn 2: Mở phòng & Mời] ──(Click 2: Gợi ý F&B / Thêm món giỏ chung)──> 
[Màn 3: Chốt phòng & Chia Bill] ──(Click 3: Quét VietQR / Ký quỹ Escrow)
```

* **Mobile-first:** Các nút hành động chính (CTA: Đặt sân, Chốt giỏ, Thanh toán) luôn được ghim cố định ở đáy màn hình (`fixed bottom-0 left-0 right-0 p-4 bg-surface/90 backdrop-blur border-t`).
* **Desktop:** Chia 2 cột: Cột trái (Thông tin sân, menu F&B, giỏ hàng) + Cột phải (Map Leaflet, Tóm tắt chia bill, QR).

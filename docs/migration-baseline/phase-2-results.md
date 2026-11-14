# Giai đoạn 2 — HTML/CSS/JavaScript thuần

Ngày ghi nhận: 14/11/2026. Phạm vi triển khai: `client/vanilla/`; frontend React hiện tại vẫn nằm trong `client/src` và build cũ không đổi.

## Chạy bản đối chiếu

```powershell
npm run dev:phase2 --prefix client
```

Vite phục vụ bản vanilla ở `http://127.0.0.1:5174` (nếu cổng đang dùng, Vite chọn cổng kế tiếp; phiên này dùng 5176). API và Socket.io được proxy tới `http://localhost:5000`. Bản React cũ tiếp tục dùng `npm run dev:client` ở cổng 5173. `/styleguide`, `/login`, `/register` và shell/deep link của các nhóm layout là phạm vi Giai đoạn 2; trang nghiệp vụ vẫn để Giai đoạn 3.

Bundle đối chiếu riêng: `npm run build:phase2 --prefix client`.

## Đã triển khai

- HTML shell riêng, History API với Back/Forward, wildcard về `/`, redirect `/join` về `/`, và route deep link.
- Auth store dùng `localStorage['synchub.token']`, xác thực `/api/auth/me`, đăng nhập/đăng ký qua REST hiện hữu, giữ `from` trong `history.state`, trả người dùng về route yêu cầu và route theo HOST/MEMBER, PROVIDER, ADMIN.
- Layout public, member, provider và admin, gồm sidebar desktop, điều hướng mobile, breadcrumb, account panel và skip link.
- DOM components: Button, Card, Badge, Modal, Countdown, MemberAvatar, MoneyText, QRCard, CartRow, ChatBubble, PageHeader, StatCard, EmptyState; `/styleguide` hiển thị các thành phần và tương tác mẫu.
- CSS reset, token dùng chung từ `client/src/styles/tokens.css`, font và favicon hiện tại, focus-visible, reduced-motion và breakpoint 640/768/1024/1280 tương thích cấu hình React.
- Modal đóng bằng Escape/backdrop/nút, giữ Tab/Shift+Tab trong hộp thoại và trả focus về phần tử mở. Countdown nhận mốc hết hạn, đổi cảnh báo dưới 180 giây và đỏ nhấp nháy dưới 60 giây.

## Kiểm chứng đã thực hiện

| Kiểm tra | Kết quả |
| --- | --- |
| `npm run build` | Pass; TypeScript + Vite build frontend React hiện tại thành công. |
| `npm run build:phase2 --prefix client` | Pass; Vite bundle mới gồm token CSS và dùng chung public assets. |
| `node --check client/vanilla/app.js` | Pass. |
| `node --check client/vanilla/components.js` | Pass. |
| `node --check client/vanilla/vite.config.js` | Pass. |
| `npm test` | Pass: 65/65 trên PostgreSQL 16 test cluster tạm riêng, loopback cổng 55433; migration `20261106000000_init` áp dụng thành công. Log: [phase-2-test-results.txt](phase-2-test-results.txt). Cluster tạm được tạo riêng vì role tại 55432 không khớp và đã dừng sau kiểm tra. |
| Browser preview | Pass tại `http://127.0.0.1:5176/styleguide`; xác nhận token CSS và Plus Jakarta Sans/JetBrains Mono tải, Modal mở, focus trap Tab, Escape đóng và trả focus; deep link `/join/SYNC01` refresh được, Back/Forward hoạt động. Truy cập `/provider/verify` khi chưa đăng nhập đưa tới `/login`; đăng nhập Host bị guard trả về `/`. |
| So sánh browser / ảnh 390×844, 768×1024, 1440×900 | Chưa thu được ảnh đúng kích thước. Browser preview hiện tại là 614×618 và không hỗ trợ viewport override; chưa đối chiếu cả ba breakpoint hoặc lưu ảnh vào repo. |

## Đối chiếu baseline và việc còn mở

Nguồn tham chiếu: [README baseline](README.md), [capture-results.json](capture-results.json), [screenshots](screenshots/), [phase-1-test-results.txt](phase-1-test-results.txt). Baseline có 29 ca ở mỗi kích thước, gồm `/styleguide`, hover/focus/modal, các route role và các trạng thái nghiệp vụ.

Chưa lưu ảnh Giai đoạn 2 vào repo nên pixel/layout/overflow chưa được so sánh với baseline tại 390×844, 768×1024 và 1440×900. Cửa sổ browser hiện là 614×618; browser session không có viewport override. Back/Forward, refresh deep link, login redirect theo role, Modal Escape/focus return và focus trap đã kiểm tra trong browser. Backdrop click, các ngưỡng thời gian Countdown và ba viewport chuẩn còn cần kiểm chứng trực quan. Backend test đã đạt 65/65; đối chiếu với [log Giai đoạn 1](phase-1-test-results.txt) trong [log Giai đoạn 2](phase-2-test-results.txt).

Sai lệch nghiệp vụ đã nêu trong baseline (hủy phòng, khóa refund, giới hạn chat, lỗi split SYNC00 và chiều rộng ảnh chụp cũ) thuộc phạm vi giữ nguyên để xử lý tại Giai đoạn 5.

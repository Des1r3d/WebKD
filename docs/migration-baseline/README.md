# Giai đoạn 0 — Mốc đối chiếu SyncHub

Mã đối chiếu là commit `87c486365d48cff05e791fb25338ef66bbe3185b` trên nhánh `codex/migrate-vanilla-js`, tạo từ `rewrite`. Trước khi thực hiện, Git chỉ báo hai file chưa theo dõi là `MIGRATION_PLAN.md` và `codex.md`.

## Môi trường và kiểm thử

- Node.js 24.19.0, npm 11.17.0. Cài bằng `npm ci` theo từng lockfile. React 19.3.1, Vite 8.3.6, Leaflet 1.9.4, Socket.io Client 4.8.4, Prisma Client 5.22.0 và Vitest 2.1.9.
- PostgreSQL 16.15 bản cài Windows, xác nhận bằng `SHOW server_version`. Instance riêng trên `127.0.0.1:55432`, hai database mới `synchub_baseline_test` và `synchub_baseline_demo`. Cả hai áp dụng migration `20261106000000_init`. Express dùng DB demo và bộ test dùng DB test.
- Kết quả `npm test -- --reporter=verbose` từ thư mục server là **7/7 file, 65/65 test pass**. [Log đầy đủ](test-results.txt)

| Quy tắc | Kết quả trên bản cũ |
| --- | --- |
| BR-SLT-01/02 | 20 yêu cầu cùng slot cho đúng 1 HTTP 200 và 19 HTTP 409 `SLOT_TAKEN`. Test hết hạn slot pass. |
| BR-INT-02 | 53.750, 58.500, 30.000 và 72.750 VND, tổng 215.000 VND. Ca biên Largest Remainder, ưu tiên Host, không có món và trừ cọc đều pass. |
| BR-ESC-03 | Giải ngân lần hai trả HTTP 409 `IDEMPOTENCY_DUPLICATE_RELEASE`. DB chỉ có một giao dịch tương ứng. |

`npm ci` báo 8 cảnh báo audit ở backend (3 moderate, 2 high, 3 critical) và 0 ở frontend tại thời điểm chạy. Phiên bản dependency lấy từ lockfile hiện tại.

## Ảnh giao diện và cách chạy lại

Ảnh PNG lưu trong `screenshots/<width>/<case>.png`. Viewport Edge là 390×844, 768×1024 và 1440×900, DPR 1, locale `vi-VN`, múi giờ `Asia/Ho_Chi_Minh`. Ảnh trang chính chụp toàn chiều dài nội dung. Ảnh tương tác và chia bill chụp trong viewport. [Kết quả từng lần chụp](capture-results.json) ghi URL thực tế, tiêu đề, nội dung đầu trang, tràn ngang, font tải được và lỗi tài nguyên.

1. Áp migration lên hai database trống riêng. Đặt `DATABASE_URL` tương ứng cho từng tiến trình. Chạy lệnh `npm run prisma:seed` tại server trên DB demo để tạo tài khoản, phòng `SYNC01` mở và `SYNC00` đã hoàn tất. Seed tạo ngày giờ tương đối theo lúc chạy.
2. Khởi chạy Express cổng 5000 và Vite cổng 5173. Dùng Edge cài sẵn và cài `playwright-core` ngoài ứng dụng. Truyền đường dẫn module tuyệt đối qua `BASELINE_PLAYWRIGHT`, rồi chạy `node docs/migration-baseline/capture.cjs`.
3. Script cố định đồng hồ trình duyệt theo timestamp trong JSON khi chụp. Ngày DB theo mốc seed và ảnh/font/map ngoài có thể thay đổi giữa các lần chạy. Khi so sánh pixel, dùng cùng timestamp và snapshot dữ liệu tương ứng, hoặc kiểm tra riêng các vùng động đó.
4. Phần loading giữ request danh sách địa điểm đang chờ. Empty trả danh sách rỗng, error trả HTTP 500 từ Playwright. Phần giỏ khóa gọi endpoint khóa phòng thật sau khi đã chụp xong trạng thái mở. Seed lại DB demo riêng trước lần chạy mới.

Lần chụp gốc tạo **87 ảnh, 29 ca mỗi kích thước**, bằng Edge 157.0.4341.46. Đồng hồ trình duyệt cố định tại 09:23:24 ngày 14/11/2026 (UTC+7). Hai ca HTTP 500 là phản hồi mô phỏng lỗi Discover và lỗi thật khi mở chia bill `SYNC00`.

## Checklist đối chiếu theo trang

| Route thực tế | Vai trò và điểm đối chiếu |
| --- | --- |
| `/`, `/discover` | Public. Danh sách, ảnh, map Leaflet, marker, bộ lọc, loading, empty, error. |
| `/login`, `/register` | Public. Form, lỗi xác thực, focus bàn phím, hover nút, chuyển theo vai trò. |
| `/venues/:id` | Public. Ảnh, loại sân/quán, slot hoặc menu, countdown khi đã giữ. |
| `/join/:code`, `/join` | Public và Member. Lời mời khi chưa đăng nhập, cọc/uy tín sau đăng nhập và redirect về `/` khi thiếu mã. |
| `/lobby/:code` | Host/Member. Thành viên, gợi ý, voucher, chat, giỏ mở/khóa và quyền chốt. |
| `/lobby/:code/split` | Host/Member. Bill, QR, thanh toán, check-in, sổ cái. Chụp Host với bill được tạo thật trên `SYNC01`, và lỗi của phòng đã hoàn tất `SYNC00`. |
| `/wallet` | Host/Member. Giao dịch, số dư và chuyển sang chi tiết phòng. |
| `/disputes` | Host/Member. Trạng thái khiếu nại, form gửi và bằng chứng. |
| `/profile` | Host/Member. Hạng uy tín, thông tin cá nhân, lịch sử và phòng. |
| `/provider`, `/provider/*` | Provider. Cùng màn hình cho wildcard. Thống kê, lịch slot, menu và chọn cơ sở. |
| `/admin`, `/admin/*` | Admin. Cùng màn hình cho wildcard. GMV, tranh chấp, user và audit. Member truy cập bị chuyển về trang chủ. |
| `/styleguide` | Public. Biến thể component, dialog mở, đóng bằng Escape và backdrop. |
| `*` | Redirect về `/`. Khi chưa đăng nhập vào route có guard thì chuyển tới `/login` kèm vị trí xuất phát. |

## REST và Socket.io hiện tại

Mọi đường dẫn trong bảng REST có tiền tố `/api`. Ký hiệu sau cột đầu là các đường dẫn tương đối trong router tương ứng.

| Phân hệ | Endpoint đang đăng ký |
| --- | --- |
| Chung | GET `/health`, GET `/escrow/:lobbyId`. File upload ở `/uploads` ngoài tiền tố API. |
| `/auth` | POST `/register`, POST `/login`, GET `/me`. |
| `/providers` | GET `/`, GET `/:id`, GET `/:id/stats`, POST `/:id/slots`, POST `/:id/menu`, PATCH `/:id/menu/:itemId`. |
| `/slots` | POST `/:id/lock`, POST `/:id/release`. |
| `/lobbies` | GET/POST `/`, GET `/:code`, GET `/:id/bills`, POST `/:id/join`, `/:id/leave`, `/:id/lock`, `/:id/split`, `/:id/cart`, `/:id/checkin`. |
| Gợi ý và voucher | GET `/recommend`, POST `/vouchers/validate`. |
| `/payments` | POST `/webhook-mock`, GET `/escrow/:lobbyId`. |
| `/disputes` | GET/POST `/`, GET `/:id`, PATCH `/:id/resolve`. |
| `/admin` | GET `/stats`, `/users`, `/audit-logs`. PATCH `/users/:id/status`, `/disputes/:id`. |
| `/test` | Các endpoint RBAC được gắn khi `NODE_ENV=test`. Route lạ trả JSON 404 `NOT_FOUND`. |

- Client gửi JWT khi kết nối. Room `lobby:{lobbyId}`. Client gửi `lobby:join`, `lobby:leave`, `cart:add`, `cart:update`, `cart:remove`, `chat:send`. Kiểu payload join ở server còn khai báo `userId?`.
- Server gửi `lobby:members`, `cart:updated`, `chat:message`, `lobby:locked`, `bill:ready`, `payment:confirmed`, `escrow:released`, `slot:released`, `notify`. `slot:released` do job phát toàn cục. Khi join, server gửi snapshot thành viên và giỏ cho socket, đồng thời phát lại lịch sử chat. Nguồn đối chiếu payload là `server/src/sockets/lobby.socket.ts`, các controller và `server/src/index.ts`.

## CSS và icon

- Breakpoint theo Tailwind mặc định, `sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px. Đối chiếu các prefix trong Shell, layout lưới các trang và PageHeader, cùng CSS reduced-motion trong `client/src/index.css`.
- Các lớp động trọng tâm gồm bảng variant/size của Button, tone của Badge/StatCard, trạng thái uy tín của MemberAvatar, ngưỡng 180s/60s của Countdown, hướng và màu ChatBubble, dấu tiền của MoneyText, hover của Card, active nav của Shell, lựa chọn filter/slot và trạng thái khóa CartRow/giỏ.
- Icon runtime đến từ các import `lucide-react` trong `client/src`. Các biểu tượng chính gồm điều hướng/auth (Compass, UserRound, Menu, X, LogIn, LogOut), tìm sân (MapPin, Search, SlidersHorizontal, Clock), phòng/giỏ/chat (Users, Lock, Unlock, Plus, Minus, Send, UtensilsCrossed), tài chính (Wallet, ReceiptText, CreditCard, QrCode, Coins), quản trị/uy tín (ShieldAlert, ShieldCheck, Crown, Award). File [kiểm kê theo module](source-inventory.txt) ghi các import đầy đủ và vị trí lớp động. Sprite `client/public/icons.svg` hiện chứa icon xã hội/tài liệu.

## Sai lệch đã xác nhận trước migration

| Sai lệch | Bằng chứng |
| --- | --- |
| Chưa có route hủy phòng theo BR-INT-03 | `server/src/routes/lobby.routes.ts` đăng ký join/leave/lock/split/cart/checkin. |
| Khóa hoàn tiền dùng ID khiếu nại | `server/src/services/dispute.ts` tạo `refund:${dispute.lobby_id}:${dispute.id}`. BR-ESC-03 yêu cầu thành phần cuối là ID split bill. |
| Chat giữ 100 tin | `server/src/sockets/lobby.socket.ts` dùng `list.slice(-100)`. Đặc tả giới hạn 50. |
| Tài liệu lệch phiên bản React và thư viện biểu đồ | `CONTEXT.md` ghi React 18 và nhắc Recharts. Lockfile khóa React 19.3.1 và manifest frontend hiện tại không khai báo Recharts. |
| Mở trang chia bill cho phòng demo đã hoàn tất `SYNC00` hiển thị `SERVER_ERROR` | Phòng cũ trong seed có bản ghi escrow, không có split bill và mọi thành viên đều đã check-in hoặc no-show. Khi Host mở trang, frontend thử tạo bill vì danh sách rỗng. Service tìm thành viên `JOINED` và báo `NO_ACTIVE_MEMBERS`. Ảnh `split-completed-error.png` ghi nhận hành vi hiện tại. |
| Ảnh toàn trang của Provider và Wallet rộng hơn viewport mobile | Tại viewport 390px, Edge xuất PNG rộng 470px cho Provider (cả route gốc và wildcard) và 396px cho Wallet, dù phép đo `documentElement.scrollWidth` trước khi chụp bằng chiều rộng viewport. Giữ ảnh nguyên để đối chiếu. |

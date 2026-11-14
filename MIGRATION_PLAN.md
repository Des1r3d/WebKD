# Kế hoạch đơn giản hóa SyncHub

Ngày lập: 14/11/2026. Giai đoạn 3 đã được người dùng nghiệm thu. Giai đoạn 4 đủ điều kiện bắt đầu.

## 1. Mục tiêu và phạm vi đã chốt

- Frontend dùng HTML, CSS thuần và JavaScript; bỏ React, React Router, TypeScript, TailwindCSS và Vite.
- Backend tiếp tục Node.js + Express, chuyển mã nguồn, seed và test sang JavaScript.
- Giữ PostgreSQL 16, Prisma, Socket.io và Leaflet. Người dùng đã xác nhận giữ hai thư viện realtime/bản đồ.
- Giữ giao diện hiện tại: bố cục, màu, font, icon, hình ảnh, spacing, responsive, trạng thái tương tác và các luồng sử dụng.
- Database chỉ có dữ liệu demo, người dùng cho phép tạo lại. Việc seed/reset vẫn phải chỉ định đúng database dev/test.
- Giữ nguyên 12 bảng, tên cột, enum, ràng buộc, 15 BR, REST contract và socket payload. Không nâng major version Prisma trong đợt này.

Đây là migration công nghệ, không phải thiết kế lại sản phẩm. Việc bỏ React cần viết lại lớp render, quản lý trạng thái và vòng đời trang; không chỉ đổi đuôi `.tsx` thành `.js`.

## 2. Kết quả khảo sát repo

Nguồn đã đọc: `codex.md`, `CONTEXT.md`, `design.md`, `AGENTS.md`, package manifests, router, CSS, API/socket client, server app, cấu hình TypeScript và phần cấu hình Prisma.

| Hạng mục | Hiện trạng | Hướng xử lý |
| --- | --- | --- |
| Database | Docker đã dùng `postgres:16-alpine`, Prisma dùng `postgresql` | Không cần chuyển hệ quản trị; xác minh phiên bản instance thực tế khi triển khai |
| Prisma | `@prisma/client` và CLI khai báo `^5.22.0`, generator `prisma-client-js` | Giữ phiên bản tương thích từ lockfile; gọi Prisma trong JavaScript phía server |
| Frontend | React 19 theo manifest, React Router, 13 module trang TSX | Chuyển sang HTML template và ES modules |
| CSS | Token CSS, CSS tùy chỉnh và Tailwind utilities | Giữ token, viết CSS có tên lớp theo thành phần |
| Icon | `lucide-react`, có sẵn `client/public/icons.svg` | Kiểm kê icon; dùng SVG tương đương, bổ sung sprite cho icon còn thiếu |
| Bản đồ/realtime | Leaflet trực tiếp; Socket.io client lazy import | Giữ thư viện, đổi cách nạp không qua bundler |
| Server | Express + TypeScript, chạy qua `tsx`, build bằng `tsc` | Node chạy JavaScript trực tiếp |
| Test | Vitest + Supertest, test tuần tự | Chuyển sang `node:test` + `node:assert/strict`, giữ Supertest |
| Dev | Vite cổng 5173 proxy đến Express 5000 | Express phục vụ cả frontend và API cùng origin |

`CONTEXT.md` nhắc Recharts nhưng client manifest không có dependency này. Không tự bổ sung thư viện biểu đồ khi migrate; kiểm kê giao diện thực tế của Provider/Admin trước.

## 3. Kiến trúc đích đề xuất

```text
Browser: HTML + CSS + JavaScript modules
       ├── fetch /api/* ──────── Express ─── Prisma ─── PostgreSQL 16
       ├── Socket.io ────────── Socket.io server
       └── Leaflet + assets ─── static files
```

Chọn một HTML shell và bộ điều hướng nhỏ dùng History API để giữ URL cùng trải nghiệm chuyển trang hiện tại. Không đưa framework frontend hoặc template engine mới vào thay React.

```text
client/
  index.html
  css/
    tokens.css
    base.css
    layout.css
    components.css
    pages/
  js/
    app.js
    router.js
    lib/          # api, auth, socket, định dạng tiền/thời gian
    layouts/      # public, member, provider, admin
    components/   # DOM/template dùng chung
    pages/        # các trang tương ứng hiện tại
  public/         # giữ ảnh, favicon, SVG
  vendor/         # bản phân phối browser của Leaflet và tài nguyên đi kèm
server/
  src/            # cấu trúc routes/controllers/services hiện tại, đổi sang .js
  tests/          # .test.js
  prisma/
    schema.prisma
    migrations/
    seed.js
```

- Dùng ESM thống nhất; server khai báo `type: module`, import nội bộ có đuôi `.js`. Chuyển `__dirname` sang đường dẫn suy ra từ `import.meta.url`; rà soát cả seed và test.
- Mỗi trang có hàm mount trả về cleanup. Cleanup hủy fetch, timer, listener, socket subscription và Leaflet map khi rời trang.
- Chỉ cập nhật vùng DOM thay đổi; không render lại toàn trang khi chat/giỏ hàng cập nhật để tránh mất focus, scroll hoặc nội dung đang nhập.
- Auth store nhỏ thay React Context; giữ khóa token, hành vi đăng nhập/đăng xuất và redirect. Phân quyền thật vẫn nằm ở server.
- API dùng URL tương đối `/api`; bỏ `import.meta.env.VITE_API_URL`. Socket dùng cùng origin và giữ JWT handshake.
- Nạp bản Socket.io browser từ endpoint server hoặc bản phân phối cố định tương thích; Leaflet dùng bản phân phối browser cục bộ cùng CSS và marker assets. Không dùng bare npm import trong browser và không phục vụ toàn bộ `node_modules`.
- Dữ liệu từ API/chat đưa vào DOM bằng `textContent` hoặc thuộc tính an toàn; HTML template chỉ chứa markup tin cậy. Giữ bảo vệ dữ liệu người dùng vốn được React escape.
- Express phục vụ asset và HTML shell sau các API route. URL trang hợp lệ hỗ trợ refresh/deep link; API không tồn tại vẫn trả JSON 404, asset thiếu không trả HTML giả.
- Prisma chỉ chạy phía server. Giữ ORM và các truy vấn SQL đang có; không chuyển toàn bộ truy vấn sang SQL viết tay. Không đưa connection string hoặc Prisma Client vào browser.

## 4. Lộ trình triển khai theo cổng nghiệm thu

### Giai đoạn 0 — Chốt mốc đối chiếu

1. Ghi nhận Git status, giữ nguyên file người dùng đang làm; tạo nhánh `codex/migrate-vanilla-js` khi bắt đầu triển khai.
2. Khởi chạy bản hiện tại với fixture demo cố định; kiểm tra Node/dependency từ lockfile và PostgreSQL thực tế.
3. Chạy bộ test cũ trên database test riêng và ghi nhận pass/fail trước migration; không coi lỗi có sẵn là lỗi do migration.
4. Chụp mới toàn bộ trang ở 390px, 768px và 1440px, cùng chiều cao cố định cho từng viewport. Ảnh trong `docs/screenshots` chỉ là tham khảo cho đến khi đối chiếu được với bản hiện tại.
5. Ghi nhận trạng thái loading, empty, error, hover/focus, modal mở, giỏ bị khóa và vai trò tương ứng. Cố định dữ liệu/thời gian cho các ca so sánh.
6. Kiểm kê route, API, socket event, icon, class động và breakpoint. Lập checklist tương ứng từng trang.

Đầu ra: baseline giao diện, kết quả test và danh sách sai lệch có sẵn. Chưa xóa dependency.

### Giai đoạn 1 — Chuyển backend sang JavaScript

1. Chuyển lần lượt utils, Prisma singleton, services, middleware, controllers, routes, sockets, app và entrypoint.
2. Loại type annotation/interface/generic; giữ các giá trị runtime như enum từ Prisma, kiểm tra đầu vào, điều kiện SQL và thứ tự thao tác.
3. Giữ nguyên ranh giới transaction, cập nhật slot nguyên tử, unique idempotency key, số nguyên VND và Largest Remainder.
4. Chuyển `seed.ts` thành `seed.js`, cập nhật lệnh Prisma seed. Không sửa schema/migration để phục vụ việc đổi ngôn ngữ.
5. Chuyển test sang JavaScript và Node test runner: thay assertion, hook, mocking và cấu hình chạy tuần tự tương đương. Không chỉ đổi import từ Vitest.
6. Cấu hình `dev`, `start`, `test` chạy JavaScript trực tiếp. Dùng Node watch nếu phiên bản Node được chọn hỗ trợ.

Nghiệm thu: frontend React cũ vẫn hoạt động với backend JS; bộ test đã chuyển đạt kết quả tương đương và các ca bắt buộc pass.

Kết quả ngày 14/11/2026 trên nhánh `codex/migrate-vanilla-js`:

- Express, seed Prisma và 7 file test chạy trực tiếp bằng Node.js 24 với ES modules. Backend dùng `node --watch` khi phát triển. Test tích hợp lấy database riêng từ `TEST_DATABASE_URL`.
- PostgreSQL 16.15 áp dụng migration hiện có trên hai database riêng cho demo và test. Seed demo chạy thành công, schema vẫn gồm 12 model nghiệp vụ.
- 65/65 ca pass, khớp baseline. Giữ slot đồng thời cho đúng 1 HTTP 200 và 19 HTTP 409 `SLOT_TAKEN`. Chia bill cho 4 người đạt 215.000 VND cùng các ca biên Largest Remainder. Giải ngân lặp trả HTTP 409 `IDEMPOTENCY_DUPLICATE_RELEASE` và chỉ có một giao dịch tương ứng. [Log giai đoạn 1](docs/migration-baseline/phase-1-test-results.txt)
- Build React thành công. Edge headless xác nhận đăng nhập qua proxy Vite, mở trực tiếp phòng `SYNC01`, tải giỏ hàng và nhận lại tin nhắn gửi qua Socket.io.

### Giai đoạn 2 — Khung HTML và CSS giữ nguyên hình thức

1. Dựng HTML shell, router, auth store và các layout tương ứng.
2. Giữ nguyên token, font, ảnh, kích thước icon và markup cần thiết cho bố cục.
3. Chuyển component dùng chung trước: Button, Card, Badge, Modal, Countdown, MemberAvatar, MoneyText, QRCard, CartRow, ChatBubble, PageHeader, StatCard, EmptyState.
4. Chuyển Tailwind utility thành CSS theo thành phần và trạng thái. Bảo toàn breakpoint, hover/focus, disabled, sticky/fixed, z-index và reduced-motion.
5. Chuyển cả reset/preflight cần thiết: box-sizing, margin, button/input font, border, list và hình ảnh. Bỏ Tailwind mà thiếu reset sẽ làm lệch giao diện.
6. Có thể dùng CSS đã biên dịch của bản cũ làm cầu nối đối chiếu trong quá trình chuyển; bản cuối phải là CSS bảo trì được, không giữ nguyên một khối utility sinh tự động làm giải pháp lâu dài.
7. Modal giữ ESC, backdrop, focus trap và trả focus; countdown giữ thời điểm hết hạn và màu cảnh báo.

Nghiệm thu: `/styleguide` và layout khớp baseline ở ba kích thước, không tràn ngang hoặc lệch font.

### Giai đoạn 3 — Chuyển từng nhóm trang

| Thứ tự | Module/URL giữ lại | Kiểm tra trọng tâm |
| --- | --- | --- |
| 1 | Login `/login`, Register `/register`, Profile `/profile` | Auth, validation, token, phân quyền, uy tín |
| 2 | Discover `/`, `/discover`; Venue `/venues/:id` | Bản đồ, lọc, ảnh, giữ slot, countdown, lỗi tranh chấp |
| 3 | Join `/join/:code`, redirect `/join`; Lobby `/lobby/:code` | Mã mời, cọc, giỏ, chat, đồng bộ nhiều client, chốt phòng |
| 4 | Split `/lobby/:code/split`, Wallet `/wallet` | Chia tiền, QR, thanh toán giả lập, trạng thái escrow |
| 5 | Disputes `/disputes` | Upload bằng chứng, gửi khiếu nại, trạng thái đóng băng |
| 6 | Provider `/provider/*`, Admin `/admin/*` | Quản lý slot/menu, thống kê, phân xử, audit, quyền truy cập |
| 7 | Styleguide `/styleguide`, route không tồn tại | Đủ component, fallback và redirect tương đương |

Mỗi nhóm phải đạt đối chiếu giao diện và chức năng trước khi sang nhóm tiếp theo. Bản cũ giữ trên nhánh/mốc baseline; môi trường so sánh không chạy hai backend cùng ghi dữ liệu tiền hoặc cùng quét slot trên một database.

**Nghiệm thu ngày 14/11/2026.** Người dùng chấp nhận giao diện vanilla hiện tại và các sai khác trực quan đã ghi nhận. Smoke browser đạt 11/11, luồng realtime hai phiên đạt và lần kiểm chứng backend gần nhất đạt 65/65. [Biên bản giai đoạn 3](docs/migration-baseline/phase-3-results.md)

### Giai đoạn 4 — Gỡ Vite và công cụ cũ hoàn toàn

**Trạng thái ngày 14/11/2026: đủ điều kiện bắt đầu, chưa triển khai.** [Biên bản giai đoạn 3](docs/migration-baseline/phase-3-results.md)

1. Express phục vụ frontend mới, `/api`, `/uploads` và `/socket.io` cùng origin; bỏ proxy Vite.
2. Thay `scripts/dev.js` và các npm script để `npm run dev` khởi động một server. Giữ lệnh setup/generate/deploy/seed rõ ràng; bỏ bước compile frontend/backend không còn cần thiết.
3. Gỡ React, React DOM, React Router, lucide-react, clsx/tailwind-merge nếu không còn dùng, Tailwind, PostCSS/autoprefixer nếu không còn cần, TypeScript, tsx, Vite/plugin và Vitest.
4. Xóa cấu hình TS/Vite/Tailwind/PostCSS lỗi thời và cập nhật lockfile qua package manager. Kiểm tra dependency tree để Vite không còn bị kéo gián tiếp bởi test runner.
5. Không yêu cầu xóa `.d.ts` thuộc dependency/generated Prisma; tiêu chí là mã nguồn ứng dụng/seed/test không cần TypeScript compiler.
6. Đồng bộ README, codex.md, hướng dẫn chạy/test và tài liệu công nghệ. Cập nhật riêng phần stack và mô tả công cụ trong CONTEXT.md/design.md theo yêu cầu migration; không thay đổi schema hoặc BR.

Nghiệm thu: cài mới từ lockfile, generate Prisma, áp dụng migration trên DB trống và chạy ứng dụng thành công mà không cần React/Vite/Tailwind/TypeScript.

### Giai đoạn 5 — Sửa lỗi nghiệp vụ sau migration

Người dùng đã chốt thực hiện giai đoạn sửa lỗi sau khi migrate. Chỉ bắt đầu khi giai đoạn 0–4 đạt tiêu chí chuyển công nghệ và bảo toàn giao diện; lỗi hồi quy do migration phải được xử lý ngay ở giai đoạn phát sinh, không dồn sang giai đoạn này.

1. Đối chiếu lại ba sai lệch trong `codex.md` với mã JavaScript sau migration và `CONTEXT.md`. Viết test tái hiện trước khi sửa, chia commit theo từng lỗi.
2. **Hủy phòng liên đới — BR-INT-03:** bổ sung route `POST /api/lobbies/:id/cancel` và luồng xử lý còn thiếu. Kiểm tra quyền Host sở hữu phòng và trạng thái được phép hủy; xử lý hủy phòng, đơn FNB đi kèm và hoàn khoản đang `HELD` trong transaction phù hợp. Không thêm bảng đơn hàng mới. Kiểm thử người không có quyền, gọi hủy lặp, rollback khi lỗi và tranh chấp với thanh toán/giải ngân; không hoàn trùng hoặc vừa hoàn vừa giải ngân cùng khoản tiền. Đồng bộ trạng thái lên giao diện hiện có mà không thiết kế lại.
3. **Khóa hoàn tiền — BR-ESC-03:** thay mẫu dựa trên dispute ID bằng `refund:{lobby_id}:{split_bill_id}` theo đặc tả; kiểm tra phân bổ hoàn tiền từng bill, unique constraint và cập nhật có điều kiện trong transaction. Test gọi lặp và đồng thời cùng khóa chỉ tạo một hiệu ứng hoàn tiền, tổng hoàn đúng quyết định phân xử và không vượt số tiền được phép hoàn. Rà soát bản ghi khóa cũ trước khi chạy: với dữ liệu demo có thể seed lại database đã xác nhận; nếu giữ dữ liệu thì phải xử lý tương thích để đổi khóa không mở đường hoàn trùng. Không sửa lịch sử migration hoặc schema để né ràng buộc.
4. **Giới hạn chat:** giới hạn bộ nhớ còn 50 tin gần nhất mỗi phòng. Test gửi hơn 50 tin, thứ tự tin giữ lại, lịch sử khi tham gia lại và tính độc lập giữa các phòng; không thêm bảng chat hoặc đổi payload socket.
5. Rà soát toàn bộ 15 BR và các lỗi còn ghi nhận ở baseline. Xử lý lỗi trong phạm vi đặc tả; nếu gặp quy tắc chưa rõ, ghi tình huống cụ thể để chốt trước khi thay đổi hành vi tài chính.
6. Chạy lại bộ test nghiệp vụ bắt buộc, test tích hợp và smoke test giao diện trên ba viewport. Cập nhật `codex.md`, test cases và danh sách lỗi với bằng chứng kiểm chứng; chỉ đánh dấu lỗi đã sửa khi test tương ứng pass.

Nghiệm thu: ba sai lệch đã có test hồi quy và được sửa theo đặc tả; các ca 20 request giữ slot, chia bill 215.000 VND/Largest Remainder và giải ngân lặp đều pass. Có bảng đối chiếu kết quả cho đủ 15 BR, không còn lỗi chặn nghiệm thu; giữ 12 bảng và giao diện đã chốt. Mốc hoàn thành migration công nghệ và mốc hoàn thành sửa lỗi được ghi riêng; toàn bộ kế hoạch chỉ hoàn tất sau giai đoạn 5.

## 5. Kiểm thử và định nghĩa hoàn thành

### Giao diện và trải nghiệm

- So sánh ảnh trước/sau của tất cả route và các trạng thái quan trọng ở 390/768/1440px trên cùng browser, cùng dữ liệu và font đã tải xong.
- Không có thay đổi chủ ý về bố cục, màu, typography, ảnh, icon, khoảng cách, modal hoặc responsive. Mọi vùng khác biệt phải được kiểm tra; chỉ loại trừ vùng động đã định trước như bản đồ ngoài, timestamp/countdown.
- Kiểm tra bàn phím, focus, reduced-motion, back/forward, refresh URL sâu, logout, phiên hết hạn và redirect theo vai trò.
- Kiểm tra không nhân đôi event/timer sau nhiều lần đổi trang; không mất nội dung chat đang nhập hoặc focus nút giỏ hàng khi nhận cập nhật.
- Có thể dùng Playwright dạng JavaScript cho kiểm thử browser/ảnh; đây là công cụ dev, không thêm framework vào ứng dụng.

### Nghiệp vụ bắt buộc

- BR-SLT-01/02: 20 request đồng thời cùng slot, đúng 1 HTTP 200 và 19 HTTP 409 `SLOT_TAKEN`; giữ thời hạn 10 phút và quét nhả mỗi 60 giây.
- BR-INT-02: ca 4 người ra 53.750, 58.500, 30.000, 72.750 VND, tổng 215.000 VND; giữ các ca Largest Remainder, bằng phần dư ưu tiên Host, không có món và khấu trừ cọc.
- BR-ESC-03: gọi giải ngân hai lần cùng idempotency key chỉ thực thi một lần; giữ contract lỗi hiện tại `409 IDEMPOTENCY_DUPLICATE_RELEASE` cho lần lặp.
- Chạy lại auth/RBAC, grouporder, escrow, dispute/admin và seed-data; đối chiếu đầy đủ 15 BR, ghi rõ lỗi baseline chưa xử lý.
- Hai browser/session trong cùng lobby: giỏ/chat đồng bộ, khóa giỏ ngay khi nhận event, server từ chối sửa sau khóa; reconnect tải lại trạng thái chuẩn và không lặp listener.
- Schema vẫn 12 bảng nghiệp vụ; không đổi tên trường, payload, enum, index/constraint hoặc lịch sử migration. Bảng nội bộ quản lý migration của Prisma không phải bảng nghiệp vụ mới.

Các bước trên là kế hoạch kiểm chứng, chưa có kết quả chạy test trong lượt lập kế hoạch này.

## 6. Sai lệch có sẵn và phạm vi sửa lỗi đã chốt

Theo `codex.md`, cần đối chiếu trực tiếp khi triển khai:

- Route hủy phòng chưa được đăng ký dù đặc tả có luồng hủy liên đới.
- Khóa hoàn tiền trong service phân xử dùng dispute ID, khác mẫu split bill ID của BR-ESC-03.
- Lịch sử chat hiện giữ 100 tin nhắn thay vì 50 theo đặc tả.
- Tài liệu ghi React 18 trong khi manifest là React 19; phần này sẽ hết hiệu lực sau migration.

Ba sai lệch nghiệp vụ được xử lý tại giai đoạn 5, sau khi chuyển công nghệ, bằng các commit và tiêu chí nghiệm thu riêng. Sai lệch phiên bản React được xử lý khi cập nhật tài liệu ở giai đoạn 4. Không tuyên bố đạt đủ 15 BR nếu các sai lệch nghiệp vụ còn tồn tại.

## 7. Dữ liệu, khôi phục và thứ tự an toàn

- Được phép tạo lại dữ liệu demo; mặc định giữ volume hiện có trong lúc chuyển, chỉ seed khi cần fixture rõ ràng.
- Database test tách khỏi dev; kiểm tra DATABASE_URL trước mọi test/seed có xóa dữ liệu.
- Vì không đổi schema, có thể quay lại code cũ với cùng cấu trúc DB. Nếu đã seed/reset thì muốn phục hồi dữ liệu trước đó phải có dump; rollback code không khôi phục dữ liệu.
- Giữ mốc baseline và commit theo giai đoạn. Chưa gỡ frontend cũ khỏi lịch sử khôi phục cho đến khi đối chiếu giao diện và kiểm thử chức năng hoàn tất.

## 8. Tài liệu tham chiếu

- Nguồn repo: `CONTEXT.md`, `design.md`, `codex.md`, `client/src/router.tsx`, các package manifest và `docker-compose.yml`.
- Prisma hỗ trợ dùng Client với JavaScript; JSDoc là lựa chọn hỗ trợ đọc code, không bắt buộc chuyển lại TypeScript: [Prisma — JavaScript với JSDoc](https://github.com/prisma/web/blob/main/apps/blog/content/blog/type-safe-js-with-jsdoc-typeSaf3js/index.mdx).
- Khi triển khai, tra tài liệu theo phiên bản đang khóa; không áp dụng hướng dẫn nâng Prisma major mới vào migration này.

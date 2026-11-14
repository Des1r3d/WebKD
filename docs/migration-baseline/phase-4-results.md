# Kiểm chứng điều kiện bắt đầu giai đoạn 4

Ngày 14/11/2026. Nhánh `codex/migrate-vanilla-js`, cây làm việc sạch trước khi kiểm chứng tại `72d39f2`. Mốc React `87c486365d48cff05e791fb25338ef66bbe3185b` vẫn có thể khôi phục từ lịch sử nhánh. Biên bản này lưu kết quả tại thời điểm kiểm tra ban đầu. Sau đó người dùng đã nghiệm thu giai đoạn 3, mở điều kiện bắt đầu giai đoạn 4. [Biên bản nghiệm thu](phase-3-results.md)

## Môi trường và lệnh đã chạy

- Node.js 24.19.0 và npm 11.17.0. `npm ci --no-audit --no-fund` thành công trên bản sao riêng của backend với lockfile hiện hành sau khi chạy với quyền truy cập npm registry. `npm run prisma:generate` tạo Prisma Client 5.22.0 trong bản sao. Các test bên dưới chạy bằng dependency có sẵn của workspace.
- PostgreSQL 16.15 chạy trong cluster tạm trên loopback cổng 55434. Đã xác minh phiên bản, tên database, cổng và schema public trống trước khi chạy migration. `synchub_phase4_test` dùng riêng cho test và `synchub_phase4_demo` dùng riêng cho seed/browser. Cluster đã dừng sau kiểm chứng.
- Chạy `npm run prisma:deploy --prefix server` với `DATABASE_URL` của từng database tạm. Migration `20261106000000_init` áp dụng thành công trên cả hai. Sau đó chạy `npm test` với `TEST_DATABASE_URL` của database test và `npm run seed` với `DATABASE_URL` của database demo.
- Chạy Express bằng `node src/index.js` trong `server/`, cổng 5000. Chạy Vite với `node node_modules/vite/bin/vite.js --config vanilla/vite.config.js --host 127.0.0.1 --port 5180 --strictPort` trong `client/`. Chạy `python -X utf8 -u scripts/verify_phase3_browser.py` với mật khẩu fixture lấy từ tài liệu demo qua biến môi trường.
- Kiểm tra với `git diff 87c4863 -- server/prisma/schema.prisma server/prisma/migrations` và đếm khai báo `model`. Có đúng 12 model, schema và lịch sử migration khớp baseline. [Cây dependency từ lockfile](phase-4-dependency-tree.txt) xác nhận React, Vite, Tailwind và TypeScript vẫn thuộc frontend hiện hành. `npm ls` trên thư mục backend đã cài sẵn thấy một số package cũ ở trạng thái `extraneous`, gồm Vitest kéo Vite. Các package đó vắng mặt trong cây lockfile backend.

## Kết quả

| Hạng mục | Kết quả |
| --- | --- |
| Suite JavaScript | 65/65 pass trên 7 file, khớp baseline. Bao gồm auth/RBAC, grouporder, escrow, dispute/admin và seed-data. [Log](phase-4-test-results.txt) |
| BR-SLT-01/02 | 20 request đồng thời cho đúng 1 HTTP 200 và 19 HTTP 409 `SLOT_TAKEN`. Ca giữ 10 phút và gọi hàm quét nhả slot hết hạn pass. Entry point giữ interval 60 giây theo mã nguồn. Chưa đo chu kỳ thực tế. |
| BR-INT-02 | Các phần lần lượt 53.750, 58.500, 30.000 và 72.750 VND, tổng 215.000 VND. Largest Remainder, ưu tiên Host khi bằng dư, không có món và khấu trừ cọc đều pass. |
| BR-ESC-03 | Lần giải ngân lặp trả 409 `IDEMPOTENCY_DUPLICATE_RELEASE`. DB có đúng một giao dịch cho khóa được kiểm tra. |
| Browser Giai đoạn 3 | 10/11 check pass, gồm login và redirect, Back/Forward, reload deep link, guard theo role, modal Escape/trả focus và validation. Ca snapshot lobby lặp lại kết quả cũ: có `cart:updated` nhưng script không quan sát được `lobby:members` trong frame WebSocket. Script chỉ quan sát frame WebSocket nên chưa xác định lỗi phát event, polling ban đầu hay lỗi phía client. [Log](phase-4-browser-results.json) |
| Đối chiếu giao diện | Hồ sơ giai đoạn 3 có 87 ảnh ở 390×844, 768×1024, 1440×900 và ghi nhận sai khác lobby mobile ở vùng gợi ý/giỏ, nav cố định và countdown. Chưa xác nhận tương đương toàn bộ trang/trạng thái với cùng fixture, đồng hồ và browser. [Hồ sơ ảnh](phase-3-results.md) |

## Phần còn thiếu tại thời điểm kiểm tra ban đầu

- Khép lại đối chiếu hình ảnh giai đoạn 2–3 và xác minh realtime hai phiên. Cần bao phủ snapshot ban đầu qua các transport Socket.io, đồng bộ giỏ/chat, giỏ khóa tức thì, từ chối chỉnh sửa sau khóa và reconnect không nhân listener.
- Kiểm chứng giai đoạn 4 sau khi mở cổng: `npm ci` cho cây dependency sau dọn, Express một origin, các HTTP 404/fallback và tài nguyên Leaflet, upload, QR, Socket.io. Chưa chạy lại browser cho logout, phiên hết hạn và toàn bộ route/trạng thái trên Express một origin.
- Hủy phòng liên đới, mẫu khóa hoàn tiền và giới hạn lịch sử chat thuộc giai đoạn 5. Lần kiểm chứng này giữ các script, manifests và lockfile hiện hành để dùng cho đối chiếu.

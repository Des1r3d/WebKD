# AGENTS.md — SyncHub Multi-Agent Guide

Mọi AI Agent làm việc trên repo này bắt buộc tuân thủ:

1. **Nguồn sự thật duy nhất:** Đọc [`CONTEXT.md`](./CONTEXT.md) trước khi thiết kế, viết code hoặc viết test.
2. **Thiết kế giao diện:** Đọc `design.md` (tạo ở Khối 2). Không thay đổi logic hoặc tên trường dữ liệu khi chỉnh sửa UI.
3. **Bảo toàn 12 bảng & 15 BR:** Không thêm bảng mới ngoài 12 bảng đã khóa trong `CONTEXT.md` và `server/prisma/schema.prisma`.
4. **Quy tắc kiểm chứng:**
   - `BR-SLT-01/02`: Kiểm thử 20 request đồng thời chỉ 1 request thành công (`200`), 19 request trả về `409 SLOT_TAKEN`.
   - `BR-INT-02`: Kiểm thử ca chuẩn `215.000` VND (4 người) và các ca biên làm tròn Largest Remainder.
   - `BR-ESC-03`: Kiểm thử gọi giải ngân 2 lần cùng `idempotency_key` chỉ thực thi đúng 1 lần.

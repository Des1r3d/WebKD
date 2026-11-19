# SyncHub — BookSlot & GroupOrder

Nền tảng đặt sân thể thao, phòng học nhóm kết hợp gọi đồ ăn/uống (F&B) theo nhóm, tự động phân bổ chi phí (Split Bill) và bảo vệ giao dịch qua cơ chế ký quỹ Escrow.

---

## Tính năng cốt lõi

- **Khám phá & Đặt sân (BookSlot):** Bản đồ tương tác khu vực Làng Đại học Thủ Đức, lọc theo danh mục/bán kính và khóa slot nguyên tử trong **10 phút** chống đặt trùng (`LOCKED` tự giải phóng về `AVAILABLE` khi quá hạn).
- **Gọi đồ nhóm (GroupOrder):** Mở phòng ghép kèo với mã mời 6 ký tự & QR, đồng bộ giỏ hàng và chat realtime qua Socket.io, gợi ý quán F&B quanh sân kèm voucher chéo (`CROSS`).
- **Chia tiền công bằng (Fair Split):** Tự động phân chia tiền sân (đều theo thành viên), tiền món cá nhân, phí giao hàng và giảm giá theo thuật toán **Largest Remainder**, triệt tiêu sai số làm tròn.
- **Ký quỹ Escrow & Khiếu nại:** Tạm giữ thanh toán (`HELD`), giải ngân độc lập cho đối tác sân và F&B sau check-in (`RELEASED`, trừ hoa hồng nền tảng), đóng băng (`FROZEN`) và hoàn tiền (`REFUNDED`) khi xử lý khiếu nại.
- **Hệ thống uy tín (Reputation Ladder):** Phân hạng `A` / `B` / `C` / `FLAGGED` quyết định tỷ lệ đặt cọc (0% / 30% / 100% tiền sân) hoặc chặn tham gia phòng.

---

## Kiến trúc & Sơ đồ

Một tiến trình Node.js/Express duy nhất phục vụ đồng thời giao diện SPA, tài nguyên tĩnh, REST API và Socket.io (cùng origin):

```
Trình duyệt ──HTTP──▶ Express (server/src/app.js)
                        ├─ /            → client/vanilla/index.html (SPA) & client/public/
                        ├─ /assets/*    → client/vanilla/ (ES modules, CSS) & Leaflet
                        ├─ /api/*       → routes → controllers → services
                        ├─ /uploads     → ảnh bằng chứng khiếu nại (multer)
                        └─ /socket.io   → Socket.io (realtime phòng ghép kèo)
                                            │
                                     Prisma ORM ──▶ PostgreSQL 16 (12 bảng)
```

- [ERD của 12 bảng PostgreSQL](docs/diagrams/ERD.drawio)
- [BPMN luồng giữ chỗ, tạo phòng, chia bill và thanh toán giả lập](docs/diagrams/BPMN_tobe.drawio)

---

## Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| **Frontend** | HTML, CSS, JavaScript (ES modules), Leaflet, SVG sprite (`client/vanilla/`) |
| **Backend** | Node.js >= 24, Express 4, Socket.io 4 |
| **Database** | PostgreSQL 16, Prisma ORM 5 |
| **Kiểm thử** | Node.js test runner (`node --test`), Supertest |

---

## Chạy demo bằng một lệnh

Mở Docker Desktop (hoặc Docker Engine có Compose v2), tại thư mục gốc của repo chạy:

```bash
docker compose -p synchub-demo -f compose.demo.yml up --build --wait
```

Lần đầu Docker tải image, cài dependency, tạo DB demo, chạy migration và nạp dữ liệu mẫu. Khi hoàn tất, mở [http://localhost:5000](http://localhost:5000) và đăng nhập bằng `nguyen.minh.phat@synchub.vn` / `Password123!`.

- Theo dõi log: `docker compose -p synchub-demo -f compose.demo.yml logs -f web`
- Dừng demo (giữ dữ liệu trong volume): `docker compose -p synchub-demo -f compose.demo.yml down`
- Cổng mặc định `5000`; nếu bị chiếm, đổi cổng host trong `compose.demo.yml`.

---

## Kiểm thử backend

Cài đặt dependency và sinh Prisma Client:

```powershell
npm ci --prefix server
npm run prisma:generate
```

Tạo một database PostgreSQL riêng cho kiểm thử, áp migration và chạy test (PowerShell):

```powershell
$env:TEST_DATABASE_URL = '<URL của database test riêng>'
$previousDatabaseUrl = $env:DATABASE_URL
try {
  $env:DATABASE_URL = $env:TEST_DATABASE_URL
  npm run prisma:deploy --prefix server
} finally {
  $env:DATABASE_URL = $previousDatabaseUrl
}
npm test
```

Các test tích hợp nạp lại fixture trên `TEST_DATABASE_URL` trước mỗi ca và chạy tuần tự (`--test-concurrency=1`).

---

## Tài khoản thử nghiệm (Mật khẩu chung: `Password123!`)

| Email | Vai trò | Mô tả |
|-------|---------|-------|
| `nguyen.minh.phat@synchub.vn` | **HOST** | Trưởng phòng (phòng mẫu `SYNC00`, `SYNC01`) |
| `dat.dt@synchub.vn` | **HOST** | Đào Tiến Đạt |
| `khuong.thao.vy@synchub.vn` | **MEMBER** | Thành viên nhóm (Hạng B, 82đ — cọc 30%) |
| `tran.minh.quang@synchub.vn` | **MEMBER** | Thành viên nhóm (Hạng C, 64đ — cọc 100%) |
| `tran.quang.bao@synchub.vn` | **MEMBER** | Thành viên nhóm (Hạng A, 95đ — miễn cọc) |
| `hung.flag@synchub.vn` | **MEMBER** | Thành viên bị cảnh báo (`FLAGGED`, 42đ) |
| `thang.venue@synchub.vn` | **PROVIDER** | Chủ sân cầu lông NVH Sinh viên |
| `admin@synchub.vn` | **ADMIN** | Quản trị viên hệ thống |

---

## Cấu trúc thư mục

```
WebKD/
├── client/
│   ├── vanilla/     # HTML shell, History API router, trang, component, CSS
│   └── public/      # Ảnh, favicon và SVG sprite
├── server/
│   ├── prisma/      # Schema 12 bảng, migration và seed script
│   ├── src/         # Routes, controllers, services, middlewares, sockets, utils
│   └── tests/       # Kiểm thử tích hợp & đơn vị
├── compose.demo.yml # Demo một lệnh (app + PostgreSQL)
└── docs/diagrams/   # Sơ đồ Draw.io
```

---

## License & Credits

- Ảnh minh họa danh mục sân và F&B lấy từ **Wikimedia Commons** (CC BY, CC BY-SA).
- Bản quyền dự án thuộc về nhóm phát triển **SyncHub (WebKD)**.

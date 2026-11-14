# SyncHub — BookSlot & GroupOrder

Nền tảng đặt sân thể thao, phòng học nhóm kết hợp gọi đồ ăn/uống (F&B) theo nhóm, tự động phân bổ chi phí (Split Bill) và bảo vệ giao dịch qua cơ chế ký quỹ Escrow.

---

## Tính năng cốt lõi

- **Khám phá & Đặt sân (BookSlot):** Bản đồ tương tác, tìm kiếm sân cầu lông, bóng đá, phòng học khu vực Làng Đại học Thủ Đức. Giữ chỗ tự động 10 phút chống xung đột (concurrency lock).
- **Gọi đồ nhóm (GroupOrder):** Mọi thành viên trong phòng cùng order đồ uống/đồ ăn từ các quán liên kết với thời gian chốt đơn đồng bộ.
- **Chia tiền công bằng (Fair Split):** Tự động phân chia tiền sân, tiền món, phí ship và voucher theo thuật toán **Largest Remainder**, triệt tiêu sai số làm tròn số lẻ.
- **Ký quỹ Escrow & Khiếu nại:** Tiền đặt cọc và thanh toán được tạm giữ an toàn trong sổ cái Escrow, giải ngân độc lập cho từng đối tác sau check-in hoặc đóng băng khi có khiếu nại.
- **Hệ thống uy tín (Reputation Ladder):** Phân hạng thành viên (A, B, C, FLAGGED) dựa trên lịch sử tham gia và thanh toán.

---

## Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| **Frontend** | HTML, CSS, JavaScript ES modules, Leaflet và SVG trong `client/vanilla/`. |
| **Backend**  | Node.js, Express, JavaScript (ES modules), Socket.io |
| **Database** | PostgreSQL 16, Prisma ORM 5.x |
| **Kiểm thử** | Node test runner, Supertest |

---

## Chạy demo bằng một lệnh

Cài và mở Docker Desktop (hoặc dùng Docker Engine có Compose v2). Tại thư mục gốc của repo, chạy:

```bash
docker compose -p synchub-demo -f compose.demo.yml up --build --wait
```

Lần đầu Docker tải image, cài thư viện, tạo cơ sở dữ liệu demo, áp dụng migration và nạp dữ liệu mẫu. Khi web đã khởi động, mở [SyncHub](http://localhost:5000) và đăng nhập bằng `dat.dt@synchub.vn` / `Password123!`. Lệnh có thể chạy lại và giữ dữ liệu đã có trong cơ sở dữ liệu demo.

- Xem tiến độ khởi động hoặc lỗi bằng `docker compose -p synchub-demo -f compose.demo.yml logs -f web`.
- Dừng demo bằng `docker compose -p synchub-demo -f compose.demo.yml down`. Dữ liệu và ảnh tải lên vẫn được giữ trong các volume demo.
- Demo dùng cổng `5000` trên máy. Nếu cổng đang được dùng, dừng ứng dụng đang chiếm cổng hoặc đổi cổng phía máy trong `compose.demo.yml`.

## Hướng dẫn phát triển và kiểm thử

### 1. Yêu cầu môi trường
- Node.js >= 24
- Docker & Docker Compose (cho PostgreSQL)

### 2. Khởi chạy cơ sở dữ liệu
```bash
docker compose up -d
```

### 3. Cài đặt và áp dụng migration

```bash
npm run setup:env
# Xác minh DATABASE_URL trong server/.env hoặc môi trường shell.
npm run setup
```

`setup:env` tạo `server/.env` từ mẫu nếu cần. `setup` chạy `npm ci --prefix server` theo lockfile, `npm run prisma:generate` và `npm run prisma:deploy`.

### 4. Seed dữ liệu mẫu

Xác minh `DATABASE_URL` trỏ tới DB demo trước khi seed.
```bash
npm run seed
```
> ⚠️ `npm run seed` **xoá toàn bộ dữ liệu hiện có** trong 12 bảng rồi tạo lại dữ liệu mẫu — chỉ chạy trên DB dev, đừng chạy khi đã có dữ liệu thật cần giữ.

### 5. Chạy môi trường phát triển (Dev)
```bash
npm run dev
```
Mở [SyncHub](http://localhost:5000). Express phục vụ giao diện, tài nguyên, `/api`, `/uploads` và `/socket.io` cùng origin. Kiểm tra tiến trình qua [API Health](http://localhost:5000/api/health).

### 6. Chạy kiểm thử backend

Tạo cơ sở dữ liệu PostgreSQL riêng cho kiểm thử. Sau đó cấu hình URL và áp dụng migration trước khi chạy test. Ví dụ với PowerShell:

```powershell
$env:TEST_DATABASE_URL = '<URL của database test riêng đã xác minh>'
$previousDatabaseUrl = $env:DATABASE_URL
try {
  $env:DATABASE_URL = $env:TEST_DATABASE_URL
  npm run prisma:deploy --prefix server
} finally {
  $env:DATABASE_URL = $previousDatabaseUrl
}
npm test
```

Các test tích hợp nạp lại fixture trên `TEST_DATABASE_URL` trước mỗi ca.

### 7. Deploy với cấu hình hiện hành

Đưa cả `server/` và `client/` lên máy triển khai theo cấu trúc repo. Xác minh `DATABASE_URL` đích trước khi áp dụng migration.

```bash
npm ci --prefix server
npm run prisma:generate
npm run prisma:deploy
npm start
```

`npm start` chạy `node src/index.js` trong `server/`. Nếu dùng reverse proxy, chuyển tiếp mọi đường dẫn tới Express và bật WebSocket upgrade cho `/socket.io`. Thư mục `server/uploads/` chứa ảnh bằng chứng tải lên.

---

## Tài khoản thử nghiệm (Mật khẩu chung: `Password123!`)

| Email | Vai trò | Mô tả |
|-------|---------|-------|
| `dat.dt@synchub.vn` | **MEMBER / HOST** | Trưởng phòng (phòng mẫu `SYNC00`, `SYNC01`) |
| `minh.b@synchub.vn` | **MEMBER** | Thành viên nhóm (Hạng A) |
| `linh.c@synchub.vn` | **MEMBER** | Thành viên nhóm (Hạng B) |
| `hung.flag@synchub.vn` | **MEMBER** | Thành viên bị cảnh báo (Hạng FLAGGED) |
| `thang.venue@synchub.vn` | **PROVIDER** | Chủ sân cầu lông NVH Sinh viên |
| `admin@synchub.vn` | **ADMIN** | Quản trị viên hệ thống |

---

## Cấu trúc thư mục

```
WebKD/
├── client/          # Giao diện SPA vanilla
│   ├── vanilla/     # HTML shell, router, trang, component và CSS
│   └── public/      # Ảnh, favicon và SVG sprite
├── server/          # Express, REST API và Socket.io cùng origin
│   ├── prisma/      # Schema 12 bảng & seed script
│   ├── src/         # Controllers, services, routes, middleware
│   └── tests/       # Kiểm thử JavaScript
└── docs/diagrams/   # Sơ đồ Draw.io
```

---

## Sơ đồ

- [ERD của 12 bảng PostgreSQL](docs/diagrams/ERD.drawio)
- [Luồng giữ chỗ, tạo phòng, chia bill và thanh toán giả lập](docs/diagrams/BPMN_tobe.drawio)

---

## License & Credits

- Hình ảnh minh họa danh mục sân và F&B được trích dẫn từ nguồn **Wikimedia Commons** (giấy phép CC BY, CC BY-SA).
- Bản quyền dự án thuộc về nhóm phát triển **SyncHub (WebKD)**.

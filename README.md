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
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Leaflet, Lucide Icons |
| **Backend**  | Node.js, Express, TypeScript, Socket.io |
| **Database** | PostgreSQL 16, Prisma ORM |
| **Kiểm thử** | Vitest, Supertest (65 integration tests bám sát 15 quy tắc nghiệp vụ BR) |

---

## Hướng dẫn cài đặt & khởi chạy

### 1. Yêu cầu môi trường
- Node.js >= 18
- Docker & Docker Compose (cho PostgreSQL)

### 2. Khởi chạy cơ sở dữ liệu
```bash
docker compose up -d
```

### 3. Cài đặt dependencies, tạo file môi trường & migrate DB
```bash
npm run setup
```
Lệnh này sẽ:
- cài dependencies cho `server` và `client`,
- tạo `server/.env` từ `server/.env.example` (chỉ khi file chưa tồn tại — không ghi đè cấu hình đang có),
- `prisma generate` và `prisma migrate deploy` để tạo 12 bảng trong `synchub_db`.

### 4. Seed dữ liệu mẫu
```bash
npm run seed
```
> ⚠️ `npm run seed` **xoá toàn bộ dữ liệu hiện có** trong 12 bảng rồi tạo lại dữ liệu mẫu — chỉ chạy trên DB dev, đừng chạy khi đã có dữ liệu thật cần giữ.

### 5. Chạy môi trường phát triển (Dev)
```bash
npm run dev
```
- **Client:** `http://localhost:5173`
- **Server API:** `http://localhost:5000`
- **Health check:** `http://localhost:5000/api/health`

> **Sự cố thường gặp:** `/api/health` trả `ok` nhưng gọi API khác bị `500`/`502`
> → kiểm tra `server/.env` có `DATABASE_URL` chưa và đã chạy `npm run setup` (bước migrate) chưa.
> Nếu server tự tắt sau ~60s, đó là job quét slot hết hạn lỗi kết nối DB — xem log `[SlotJob]`.

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
├── client/          # Ứng dụng React 18 + Vite (SPA)
│   ├── src/
│   │   ├── layouts/ # Shell navigation (Sidebar, Drawer, Bottom Nav)
│   │   ├── pages/   # 12 màn hình chính của ứng dụng
│   │   ├── ui/      # Thư viện component nguyên tử theo design tokens
│   │   └── lib/     # API client, imagery mapper, socket
├── server/          # REST API Node.js + Express
│   ├── prisma/      # Schema 12 bảng & seed script
│   ├── src/         # Controllers, services, routes, middleware
│   └── tests/       # 65 integration tests bao phủ 15 BR
├── docs/            # Tài liệu dự án
├── scripts/         # Script runner đồng thời client + server
├── CONTEXT.md       # Nguồn sự thật (Source of Truth) về nghiệp vụ & schema
└── design.md        # Hướng dẫn thiết kế và hệ thống Design Tokens
```

---

## License & Credits

- Hình ảnh minh họa danh mục sân và F&B được trích dẫn từ nguồn **Wikimedia Commons** (giấy phép CC BY, CC BY-SA).
- Bản quyền dự án thuộc về nhóm phát triển **SyncHub (WebKD)**.

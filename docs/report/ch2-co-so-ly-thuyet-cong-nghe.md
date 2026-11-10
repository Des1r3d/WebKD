# Chương 2: Cơ sở Lý thuyết & Kiến trúc Công nghệ Ứng dụng

---

## 2.1 Kiến trúc Tổng thể Hệ thống (System Architecture)

Hệ thống **SyncHub** được thiết kế theo mô hình kiến trúc phân tầng hiện đại (**Multi-tier Client-Server Architecture**), kết hợp giữa giao tiếp không đồng bộ RESTful API và giao tiếp hướng sự kiện hai chiều thời gian thực (Full-duplex Event-driven WebSocket).

```text
+-----------------------------------------------------------------------------------+
|                            TẦNG TRÌNH DIỄN (FRONTEND)                             |
|  React 18 + Vite + TypeScript + TailwindCSS (Emerald Pulse Design System)         |
|  - Layouts: PublicLayout, MemberLayout, ProviderLayout, AdminLayout              |
|  - Bản đồ tương tác: Leaflet / OpenStreetMap + Realtime Markers                   |
|  - Socket.io Client: Đồng bộ giỏ hàng, chat nhóm, khóa phòng tức thì              |
+-----------------------------------------+-----------------------------------------+
                                          |
                      HTTP REST / JSON    |    WebSocket (WSS) Events
                                          v
+-----------------------------------------------------------------------------------+
|                             TẦNG XỬ LÝ LÕI (BACKEND)                              |
|  Node.js (v20+) + Express + TypeScript + Socket.io Server                         |
|  - Middlewares: Auth (JWT), RBAC (4 roles), Multer (Upload bằng chứng khiếu nại)  |
|  - Core Services:                                                                 |
|    * SlotLock Service (Atomic Conditional Update & Background 60s Sweep Job)      |
|    * Lobby & Socket Service (Room Isolation `lobby:{id}`, In-memory Chat Buffer)  |
|    * SplitBill Service (Hamilton's Largest Remainder Algorithm, VietQR URL)       |
|    * Smart Recommendation Engine (Rule-based 4-Factor Scoring & Voucher CROSS)    |
|    * Escrow Engine (Multi-party Payout, Idempotency Gate, Partial Frozen Lock)    |
|    * Reputation & Audit Engine (Score Tier Calculation, Audit Logs Ledger)        |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          |  Prisma ORM (Type-safe Queries)
                                          v
+-----------------------------------------------------------------------------------+
|                           TẦNG DỮ LIỆU (DATABASE TIER)                            |
|  PostgreSQL 16 (Dockerized Relational Database)                                   |
|  - 12 Tables (Locked context-v1 Schema)                                           |
|  - ACID Transactions & Row-level Mutex Locking                                    |
|  - Unique Constraints: `(provider_id, start_at)`, `idempotency_key`, `invite_code`|
+-----------------------------------------------------------------------------------+
```

---

## 2.2 Công nghệ Frontend (Client Tier)

### 2.2.1 React 18 & TypeScript
- **React 18:** Ứng dụng khai thác triệt để các tính năng hiện đại của React 18 bao gồm cơ chế kết xuất tự động theo lô (Automatic Batching), các React Hooks quản lý trạng thái (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`) và Context API nhằm quản lý trạng thái phiên làm việc (`AuthContext`).
- **TypeScript:** Cung cấp hệ thống kiểm tra kiểu tĩnh (Static Type Checking) nghiêm ngặt từ thời điểm biên dịch (Compile-time), đồng bộ 100% định nghĩa kiểu (`types.ts`) với Schema từ cơ sở dữ liệu, loại bỏ hoàn toàn các lỗi thường gặp như `undefined is not a function` hoặc sai lệch thuộc tính đối tượng.

### 2.2.2 Vite Build Tool
- Thay thế các công cụ đóng gói truyền thống (như Webpack/CRA), **Vite** tận dụng tính năng Native ES Modules trên trình duyệt kết hợp với bộ biên dịch tốc độ cao `esbuild` (viết bằng Go).
- Thời gian khởi động máy chủ phát triển (Dev Server) chỉ dưới 300ms và cơ chế Hot Module Replacement (HMR) tức thì giúp tăng tốc độ phát triển giao diện.

### 2.2.3 TailwindCSS & Hệ thống Thiết kế (Emerald Pulse Design System)
- Sử dụng mô hình Utility-first CSS, loại bỏ hoàn toàn các đoạn mã CSS thừa và giữ kích thước gói sản phẩm (Bundle size) ở mức tối thiểu.
- Xây dựng Theme độc quyền mang tên **"Emerald Pulse"** với bảng màu chủ đạo:
  - Màu thương hiệu chính: Xanh ngọc lục bảo (`Emerald #059669`, `#10b981`) tượng trưng cho năng lượng thể thao và sự tươi mới.
  - Màu nhấn phụ trợ: Màu hổ phách (`Amber #d97706`) dùng cho các dịch vụ ăn uống F&B.
  - Màu cảnh báo & chế tài: Đỏ son (`Rose #e11d48`) cho trạng thái tranh chấp, bị gắn cờ `FLAGGED` hoặc trừ cọc.

### 2.2.4 Bản đồ Tương tác Leaflet & OpenStreetMap
- Tích hợp thư viện bản đồ nguồn mở **Leaflet** kết hợp với lớp dữ liệu địa lý từ **OpenStreetMap**.
- Cho phép hiển thị trực quan mạng lưới sân thể thao (`VENUE`) và quán nước (`FNB`) kèm biểu tượng tùy biến, vòng tròn bán kính voucher chéo ($R = 1000\text{ m}$) và cơ chế tương tác hai chiều (nhấp Marker mở thẻ cơ sở và ngược lại).

### 2.2.5 Thư viện Hỗ trợ Chuyên dụng
- **`qrcode.react`:** Sinh mã QR SVG tức thì tại phía client phục vụ tính năng quét mã mời bạn bè vào phòng ghép kèo.
- **`lucide-react`:** Bộ biểu tượng đồ họa vector sắc nét, đồng bộ và có khả năng tương thích cao.
- **`recharts`:** Trực quan hóa số liệu doanh thu và GMV theo thời gian trên Bảng điều khiển Quản trị viên (`Admin Dashboard`).

---

## 2.3 Công nghệ Backend (Server Tier)

### 2.3.1 Node.js & Express Framework
- **Node.js (v20 LTS):** Môi trường thực thi JavaScript phía máy chủ hoạt động dựa trên cơ chế đơn luồng với vòng lặp sự kiện bất đồng bộ không chặn (Non-blocking I/O Event Loop), đặc biệt phù hợp cho các ứng dụng có lưu lượng truy cập đồng thời lớn và xử lý nhiều kết nối I/O song song.
- **Express.js:** Framework web tối giản, linh hoạt, cung cấp cơ chế Middleware mạnh mẽ để kiểm soát luồng xử lý yêu cầu HTTP:
  - `authMiddleware`: Xác thực chữ ký số JWT và giải mã thông tin phiên người dùng.
  - `requireRole`: Kiểm tra phân quyền truy cập theo vai trò (`RBAC`).
  - `uploadMiddleware`: Quản lý upload đa tập tin hình ảnh bằng thư viện `multer` lưu trữ cục bộ tại `server/uploads/` phục vụ khâu nộp chứng cứ khiếu nại.

### 2.3.2 Hạ tầng Giao tiếp Thời gian thực Socket.io
- Sử dụng **Socket.io** thiết lập kết nối song công (Full-duplex) liên tục giữa client và server dựa trên giao thức WebSocket, tự động hạ cấp xuống HTTP Long-polling nếu mạng gặp hạn chế.
- **Kiến trúc cách ly phòng (Room Isolation):** Mỗi phòng ghép kèo được cấp phát một room riêng biệt trên server (`lobby:${lobbyId}`). Mọi sự kiện phát tán (broadcast) như thay đổi giỏ hàng, tin nhắn trò chuyện hoặc lệnh khóa phòng chỉ được chuyển tiếp nội bộ tới các thành viên thuộc room đó, đảm bảo tính bảo mật và tiết kiệm băng thông mạng.
- **Bộ đệm tin nhắn trong bộ nhớ (In-memory Chat Buffer):** Server duy trì danh sách 50 tin nhắn trò chuyện gần nhất trong RAM cho mỗi phòng, giúp thành viên mới vào phòng có thể đọc lại ngữ cảnh trao đổi ngay lập tức mà không phải truy vấn nặng vào cơ sở dữ liệu.

---

## 2.4 Tầng Dữ liệu & Hệ Quản trị CSDL (Database Tier)

### 2.4.1 Hệ Quản trị CSDL Quan hệ PostgreSQL 16
Hệ thống chọn **PostgreSQL 16** làm cơ sở dữ liệu quan hệ chính thức nhờ các ưu điểm vượt trội:
- **Tuân thủ tuyệt đối chuẩn ACID:** Đảm bảo mọi giao dịch tài chính (chia tiền, giữ tiền Escrow, giải ngân) diễn ra an toàn, không xảy ra hiện tượng đọc dữ liệu bẩn (Dirty Read) hoặc mất dữ liệu khi máy chủ gặp sự cố.
- **Khóa cấp độ dòng (Row-level Locking):** Cho phép thực thi các câu lệnh cập nhật có điều kiện nguyên tử (`UPDATE ... WHERE`) để chống race condition khi nhiều người dùng cùng tranh chấp một khung giờ sân.
- **Ràng buộc toàn vẹn mạnh mẽ:** Các ràng buộc khóa duy nhất (`UNIQUE`), khóa ngoại (`FOREIGN KEY ON DELETE CASCADE/SET NULL`) và chỉ mục kết hợp (`INDEX`) giúp tối ưu tốc độ tìm kiếm không gian địa lý (`lat, lng`) và bảo vệ tính nhất quán dữ liệu.

### 2.4.2 Prisma ORM
- Prisma đóng vai trò là tầng truy cập dữ liệu (Data Access Layer) thế hệ mới cho Node.js và TypeScript:
  - **Prisma Schema (`schema.prisma`):** Khai báo mô hình dữ liệu tập trung, tự động sinh mã migration đồng bộ với cơ sở dữ liệu.
  - **Prisma Client:** Tự động sinh mã nguồn truy vấn với kiểu dữ liệu tĩnh nghiêm ngặt (Strict Type Safety), hỗ trợ tính năng Transaction API (`prisma.$transaction`) để gom nhóm nhiều thao tác ghi dữ liệu vào một khối nguyên tử duy nhất.

### 2.4.3 Chiến lược Lưu trữ Tài chính: Triệt tiêu Sai số Làm tròn
Trong các hệ thống thương mại điện tử, lỗi biểu diễn số thực dấu phẩy động (**Floating Point Arithmetic Error** — ví dụ $0.1 + 0.2 = 0.30000000000000004$) là nguyên nhân hàng đầu gây thất thoát tiền bạc hoặc sai lệch sổ sách kế toán.
- **Quy chuẩn bắt buộc:** Toàn bộ các trường liên quan đến giá tiền (`price`, `total`, `deposit_paid`, `amount`, `net_amount`, `refund_amount`) trong hệ thống SyncHub được lưu trữ dưới dạng **Số nguyên (`Int`)** theo đơn vị tiền tệ **Việt Nam Đồng (VND)**, không có phần thập phân.
- Mọi phép tính chia tỷ lệ được thực hiện bằng phép lấy phần nguyên `Math.floor` kết hợp với thuật toán **Phân phối phần dư lớn nhất (Largest Remainder)** để đảm bảo tổng các phần con luôn khớp chính xác 100% với tổng hóa đơn lớn.

---

## 2.5 Các Công nghệ Tích hợp & Thuật toán Lõi

### 2.5.1 Chuẩn Thanh toán VietQR (Napas 247)
- Hệ thống tích hợp chuẩn sinh mã thanh toán quốc gia VietQR thông qua dịch vụ tạo ảnh động:
  ```text
  https://img.vietqr.io/image/${BANK}-${ACCOUNT}-compact2.png?amount=${total}&addInfo=SYNCHUB%20${inviteCode}%20${userId}&accountName=${NAME}
  ```
- Cho phép sinh động mã QR cá nhân hóa chứa sẵn số tiền phải nộp và cú pháp chuyển khoản chuẩn (`SYNCHUB {mã_phòng} {mã_thành_viên}`). Người dùng có thể mở bất kỳ ứng dụng ngân hàng nào tại Việt Nam để quét mã mà không cần nhập tay thông tin người nhận.

### 2.5.2 Công thức Khoảng cách Địa lý Haversine
Để tính khoảng cách thực tế giữa vị trí người dùng, các sân thể thao và quán nước trên bề mặt Trái Đất mà không cần phụ thuộc vào API trả phí của bên thứ ba (như Google Maps API), hệ thống hiện thực công thức Haversine trong `server/src/utils/distance.ts`:

$$\Delta\varphi = \frac{(\text{lat}_2 - \text{lat}_1)\pi}{180}, \quad \Delta\lambda = \frac{(\text{lng}_2 - \text{lng}_1)\pi}{180}$$
$$a = \sin^2\left(\frac{\Delta\varphi}{2}\right) + \cos\varphi_1 \cos\varphi_2 \sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$d = 2 R \cdot \arctan2\left(\sqrt{a}, \sqrt{1-a}\right) \quad (\text{với } R = 6.371.000\text{ m})$$

### 2.5.3 Cổng Chống Giải Ngân Trùng (Idempotency Gate)
Để bảo vệ hệ thống Escrow khỏi hiện tượng tấn công lặp yêu cầu (Replay Attack) hoặc sự cố mạng khiến một lệnh giải ngân bị gửi nhiều lần, mỗi giao dịch tài chính được gán một khóa `idempotency_key` duy nhất (ví dụ: `release:{lobby_id}:{provider_id}`). Trường này được đánh chỉ mục `UNIQUE` trong cơ sở dữ liệu. Lần gọi thứ hai có cùng khóa sẽ lập tức bị chặn ở tầng cơ sở dữ liệu và trả về mã lỗi HTTP `409 Conflict`.

---

## 2.6 Lý giải Lựa chọn Công nghệ (Technology Justification)

Bảng dưới đây trình bày luận cứ khoa học về lý do nhóm lựa chọn các công nghệ cốt lõi thay vì các giải pháp thay thế phổ biến khác:

| Thành phần | Lựa chọn của đề tài | Giải pháp thay thế | Luận cứ khoa học & Lý do lựa chọn |
|---|---|---|---|
| **Frontend Framework** | **React 18 + TypeScript** | Angular / Vue.js | Hệ sinh thái linh hoạt, cộng đồng hỗ trợ lớn; kết hợp TypeScript đảm bảo kiểm tra kiểu chặt chẽ; khả năng render mượt mà khi tích hợp với thư viện thời gian thực Socket.io và Leaflet. |
| **Backend Runtime** | **Node.js (Express)** | Java Spring Boot / C# .NET | Mô hình xử lý bất đồng bộ I/O non-blocking tối ưu cho các luồng xử lý Webhook và kết nối thời gian thực WebSocket; chia sẻ chung kiểu dữ liệu TypeScript giữa Frontend và Backend. |
| **Cơ sở Dữ liệu** | **PostgreSQL 16** | MongoDB | Bài toán giữ chỗ khung giờ và ví Escrow đòi hỏi tính toàn vẹn giao dịch (ACID) tuyệt đối và khả năng khóa dòng (Row-level Locking) chống đặt trùng. CSDL NoSQL (như MongoDB) dễ gây bất nhất quán dữ liệu trong các kịch bản race condition tài chính phức tạp. |
| **Giao tiếp Realtime** | **Socket.io** | Server-Sent Events (SSE) / Polling | Polling gây lãng phí tài nguyên máy chủ và độ trễ cao; SSE chỉ hỗ trợ luồng 1 chiều (Server $\rightarrow$ Client). Socket.io hỗ trợ kết nối 2 chiều toàn diện, tự động phục hồi kết nối và có cơ chế quản lý Room cách ly tuyệt vời. |
| **ORM Framework** | **Prisma** | TypeORM / Hibernate | Prisma cung cấp hệ thống kiểm tra kiểu dữ liệu tự động từ Schema (Strict Type Safety), cơ chế migration trực quan, mã nguồn gọn gàng và API Transaction an toàn hơn hẳn. |

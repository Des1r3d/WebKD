# ĐỒ ÁN TỐT NGHIỆP / BÁO CÁO MÔN HỌC
## HỌC PHẦN: PHÁT TRIỂN ỨNG DỤNG WEB KINH DOANH

---

# BÁO CÁO KẾT QUẢ ĐỀ TÀI:
# SYNCHUB — NỀN TẢNG KẾT NỐI ĐẶT CHỖ VÀ GỌI ĐỒ NHÓM TÍCH HỢP ESCROW

- **Đơn vị đào tạo:** Khoa Hệ thống Thông tin / Công nghệ Thông tin
- **Mã lớp học phần:** Phát triển Web Kinh doanh
- **Giảng viên hướng dẫn:** Giảng viên phụ trách môn học
- **Nhóm thực hiện:** Nhóm sinh viên (5 thành viên)

---

## BẢNG PHÂN CÔNG NHIỆM VỤ & TỶ LỆ HOÀN THÀNH

Nhóm phát triển đề tài vận hành theo mô hình phối hợp Agile/Scrum, phân định rõ vai trò và trách nhiệm nhằm đảm bảo chất lượng kỹ thuật, tính ứng dụng thực tế và tiến độ nộp bài.

| STT | Họ và tên | MSSV | Vai trò chính | Nhiệm vụ chi tiết | Mức độ đóng góp |
|:---:|---|:---:|---|---|:---:|
| 1 | **[Thành viên 1] — Đào Tiến Đạt** | *(Điền MSSV)* | **Nhóm trưởng / Product Owner & Fullstack Lead** | - Lập kế hoạch tổng thể, quản trị tiến độ dự án theo mô hình Agile/Scrum.<br>- Thiết kế kiến trúc lõi hệ thống (REST API, WebSocket, Database Schema 12 bảng).<br>- Hiện thực hóa các module nhạy cảm: Khóa slot nguyên tử (`SlotLock`), Ví trung gian `Escrow`, Cơ chế chống giải ngân đúp `Idempotency Gate`.<br>- Phụ trách nội dung Chương 1 và Chương 4. | **100%** |
| 2 | **[Thành viên 2]** | *(Điền MSSV)* | **Business Analyst (BA) / Requirements Lead** | - Khảo sát bài toán thực tế tại Làng ĐHQG TP.HCM, phân tích đối thủ cạnh tranh.<br>- Xây dựng quy trình As-is và To-be bằng sơ đồ BPMN.<br>- Xây dựng danh mục 15 Luật nghiệp vụ (`BR`), 9 Yêu cầu chức năng (`FR`), 5 Yêu cầu phi chức năng (`NFR`) và User Stories.<br>- Phụ trách nội dung Chương 1 và Chương 3. | **100%** |
| 3 | **[Thành viên 3]** | *(Điền MSSV)* | **Frontend Developer / UI-UX Lead** | - Xây dựng hệ thống Design System (Theme Emerald Pulse, bảng màu, typography).<br>- Phát triển giao diện React 18: Bản đồ tương tác Leaflet, Chi tiết sân, Phòng ghép kèo Realtime, Chia bill VietQR.<br>- Xây dựng Cổng thông tin Đối tác (`Provider Portal`) và Bảng điều khiển Quản trị (`Admin Dashboard`).<br>- Phụ trách nội dung Chương 2 và Chương 4. | **100%** |
| 4 | **[Thành viên 4]** | *(Điền MSSV)* | **Backend Developer / Database Engineer** | - Cấu hình cơ sở dữ liệu PostgreSQL 16 và migration Prisma ORM.<br>- Xây dựng các dịch vụ Backend: Gợi ý quán thông minh (`Smart Recommendation`), Kiểm duyệt Voucher chéo (`CROSS Voucher`), Tự động chia bill `Largest Remainder`.<br>- Tích hợp hạ tầng Socket.io Room (`lobby:{id}`) đồng bộ giỏ hàng và chat thời gian thực.<br>- Phụ trách nội dung Chương 2 và Chương 3. | **100%** |
| 5 | **[Thành viên 5]** | *(Điền MSSV)* | **QA Lead / Software Tester & Tech Writer** | - Thiết lập bộ 65 automated tests chạy trên Vitest (Seed, Auth, SlotLock, GroupOrder, Escrow, Disputes).<br>- Soạn thảo 30 Test Cases hộp đen chi tiết và Postman Collection kiểm thử API.<br>- Soạn thảo Bộ Quy chế & Chính sách Xử lý Trách nhiệm, Khiếu nại và Tranh chấp (Phụ lục 1) và Kịch bản thuyết trình (Phụ lục 2).<br>- Phụ trách nội dung Chương 5 và Phụ lục. | **100%** |

---

## QUY CHUẨN QUẢN LÝ MÃ NGUỒN & PHÁT TRIỂN HỆ THỐNG (GIT FLOW)

Để đảm bảo tính toàn vẹn của mã nguồn, tránh xung đột (merge conflicts) và duy trì trạng thái ổn định cho nhánh chính, nhóm áp dụng nghiêm ngặt quy chuẩn phân nhánh và commit chuẩn công nghiệp.

### 1. Quy ước đặt tên nhánh (Branch Naming Convention)

Mọi nhánh chức năng phải bắt đầu bằng tiền tố quy định, viết bằng chữ thường và phân cách bằng dấu gạch ngang (`kebab-case`):

| Tiền tố nhánh | Mục đích sử dụng | Ví dụ nhánh thực tế |
|---|---|---|
| `feat/` | Phát triển chức năng mới hoặc endpoint mới | `feat/slot-atomic-lock`, `feat/vietqr-split-bill` |
| `fix/` | Sửa lỗi phát hiện trong quá trình kiểm thử | `fix/rounding-error-largest-remainder`, `fix/socket-room-leak` |
| `refactor/` | Tối ưu hóa cấu trúc code, không đổi hành vi nghiệp vụ | `refactor/escrow-transaction-pipeline`, `refactor/prisma-query` |
| `design/` | Điều chỉnh giao diện, theme CSS, Responsive layout | `design/emerald-pulse-theme`, `design/leaflet-map-markers` |
| `chore/` | Cấu hình dự án, cài đặt thư viện, Docker, CI/CD | `chore/setup-docker-postgres`, `chore/vitest-config` |
| `test/` | Viết bổ sung Unit test, Integration test, E2E test | `test/split-bill-edge-cases`, `test/concurrency-lock-slot` |

### 2. Quy ước thông điệp Commit (Conventional Commits)

Cấu trúc commit tuân thủ định dạng chuẩn:
```text
<type>(<scope>): <mô tả ngắn gọn bằng tiếng Việt hoặc tiếng Anh>

[Mô tả chi tiết lý do thay đổi và mã BR liên quan nếu có]
```

- **Ví dụ chuẩn:**
  - `feat(slot): implement atomic conditional update for BR-SLT-01`
  - `fix(split-bill): enforce largest remainder for odd vnd rounding BR-INT-02`
  - `feat(escrow): add idempotency gate on checkin release BR-ESC-03`
  - `test(dispute): add test case for partial frozen escrow funds BR-ESC-04`

---

## LỜI MỞ ĐẦU & LỜI CẢM ƠN

Trong bối cảnh nền kinh tế số và thương mại điện tử phát triển vượt bậc, nhu cầu tiêu dùng và sinh hoạt của thế hệ trẻ ngày càng đòi hỏi sự liền mạch, tiện lợi và minh bạch. Tại các khu đô thị đại học quy mô lớn, việc tổ chức các hoạt động thể thao, sinh hoạt đội nhóm luôn gắn liền với hai nhu cầu đồng thời: **đặt khung giờ sân bãi** và **gọi đồ ăn thức uống**. Tuy nhiên, việc vận hành qua các kênh truyền thống rời rạc (Zalo, gọi điện thoại, ứng dụng giao đồ ăn riêng lẻ) đang gây ra nhiều phiền toái về thời gian, sai sót trong tính toán chi phí và rủi ro tài chính khi phát sinh tình trạng "bùng kèo".

Đề tài **"SyncHub — Nền tảng kết nối đặt chỗ và gọi đồ nhóm tích hợp Escrow"** được nhóm nghiên cứu và phát triển nhằm mang lại một giải pháp toàn diện: kết hợp trải nghiệm đặt chỗ khung giờ và giỏ hàng nhóm thời gian thực trên cùng một nền tảng, tự động hóa chia tiền chuẩn xác tới từng đồng bằng VietQR, đồng thời thiết lập cơ chế bảo chứng tín nhiệm và giải ngân trung gian Escrow để bảo vệ quyền lợi công bằng cho cả người dùng lẫn đối tác kinh doanh.

Nhóm xin chân thành gửi lời cảm ơn sâu sắc tới Quý Thầy/Cô phụ trách học phần **Phát triển Ứng dụng Web Kinh doanh** đã tận tình hướng dẫn, truyền đạt những kiến thức quý báu về phân tích thiết kế hệ thống thông tin, tư duy kiến trúc phần mềm và mô hình kinh doanh số. Những chỉ dẫn và góp ý của Quý Thầy/Cô là kim chỉ nam giúp nhóm hoàn thiện đồ án này một cách chỉn chu và thiết thực nhất.

---

## MỤC LỤC TỔNG QUAN BÁO CÁO

- **00. Thông tin đồ án, Bảng phân công nhiệm vụ & Quy chuẩn Git Flow**
- **Chương 1: Tổng quan Đề tài, Nghiên cứu Thị trường & Mô hình Kinh doanh**
- **Chương 2: Cơ sở Lý thuyết & Kiến trúc Công nghệ Ứng dụng**
- **Chương 3: Phân tích & Thiết kế Hệ thống Thông tin (System Analysis & Design)**
- **Chương 4: Triển khai Thuật toán Lõi & Hiện thực Giao diện Người dùng**
- **Chương 5: Quản trị Dự án, Báo cáo Kiểm thử Phần mềm & Đánh giá Kết quả**
- **Phụ lục 1: Quy chế & Chính sách Xử lý Trách nhiệm, Khiếu nại và Tranh chấp**
- **Phụ lục 2: Kịch bản Thuyết trình Bảo vệ Đồ án (Presentation Script)**

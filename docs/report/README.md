# BỘ TÀI LIỆU BÁO CÁO TOÀN DIỆN ĐỀ TÀI SYNCHUB
## HỌC PHẦN: PHÁT TRIỂN ỨNG DỤNG WEB KINH DOANH

> **Chuẩn hóa học thuật theo cấu trúc Đồ án xuất sắc (Chuẩn 5 Chương + 2 Phụ lục độc quyền)**  
> **Đơn vị:** Khoa Hệ thống Thông tin / Công nghệ Thông tin  
> **Đề tài:** SyncHub — Nền tảng kết nối đặt chỗ và gọi đồ nhóm tích hợp Escrow  
> **Nhóm thực hiện:** 5 thành viên ([Thành viên 1] — Đào Tiến Đạt, [Thành viên 2], [Thành viên 3], [Thành viên 4], [Thành viên 5])

---

## CẤU TRÚC BỘ TÀI LIỆU BÁO CÁO (MASTER INDEX)

| Thứ tự | Tên tập tin | Nội dung chi tiết |
|:---:|---|---|
| **00** | [**00-thong-tin-va-quy-chuan.md**](./00-thong-tin-va-quy-chuan.md) | - Bìa đồ án & Thông tin đề tài.<br>- **Bảng phân công nhiệm vụ 5 thành viên** (PO, BA, Frontend, Backend, QA) & tỷ lệ đóng góp (100%).<br>- **Quy chuẩn quản lý mã nguồn (Git Flow):** Quy ước đặt tên nhánh (`feat/`, `fix/`...) và commit chuẩn.<br>- Lời mở đầu, Lời cảm ơn, Mục lục tổng quan. |
| **Chương 1** | [**ch1-tong-quan-va-kinh-doanh.md**](./ch1-tong-quan-va-kinh-doanh.md) | - Bối cảnh đô thị đại học (KĐT ĐHQG TP.HCM / Làng ĐH Thủ Đức) & Nỗi đau thực tế.<br>- **Khảo sát & So sánh đối thủ cạnh tranh:** Zalo/Facebook, ShopeeFood/GrabFood, Sporta/Sân Việt.<br>- **4 Chân dung khách hàng (Personas):** Host, Member, Venue Provider, FnB Provider.<br>- **Ma trận SWOT** & Phân tích môi trường kinh doanh.<br>- **Mô hình kinh doanh Business Model Canvas (BMC)** & Cấu trúc Doanh thu 3 nhóm.<br>- Mục tiêu & Phạm vi hệ thống (In-scope và Out-of-scope). |
| **Chương 2** | [**ch2-co-so-ly-thuyet-cong-nghe.md**](./ch2-co-so-ly-thuyet-cong-nghe.md) | - **Kiến trúc hệ thống đa tầng:** Client-Server, REST API + WebSocket song công.<br>- **Công nghệ Frontend:** React 18, Vite, TypeScript, TailwindCSS, Leaflet/OpenStreetMap.<br>- **Công nghệ Backend:** Node.js, Express, TypeScript, Socket.io Room `lobby:{id}`.<br>- **Cơ sở dữ liệu:** PostgreSQL 16 ACID, Prisma ORM, Chiến lược lưu trữ số nguyên VND triệt tiêu sai số.<br>- **Công nghệ tích hợp:** VietQR Napas 247, Khoảng cách Haversine, Cổng Idempotency.<br>- **Luận cứ khoa học lựa chọn công nghệ (Technology Justification).** |
| **Chương 3** | [**ch3-phan-tich-thiet-ke-he-thong.md**](./ch3-phan-tich-thiet-ke-he-thong.md) | - **Quy trình As-is vs To-be (BPMN):** Ma trận Pain points & Gaps.<br>- **15 Luật nghiệp vụ chuẩn hóa (BR):** `BR-SLT`, `BR-INT`, `BR-REP`, `BR-ESC`, `BR-DSP`.<br>- **Đặc tả SRS:** 9 Yêu cầu chức năng (`FR`) & 5 Yêu cầu phi chức năng (`NFR` SLA).<br>- **Bảng User Stories chuẩn Agile** kèm Tiêu chí chấp nhận (`Acceptance Criteria`).<br>- **Sơ đồ Use Case & Đặc tả chi tiết 12 Use Cases (UC01 → UC12):** Basic/Alt/Exception flow.<br>- **Sơ đồ luồng dữ liệu (DFD):** DFD Mức 0, DFD Mức 1 và DFD Mức 2 phân rã 4 tiến trình lõi.<br>- **Thiết kế CSDL & Từ điển dữ liệu (Data Dictionary):** Chi tiết đầy đủ 12 bảng schema. |
| **Chương 4** | [**ch4-trien-khai-va-giao-dien.md**](./ch4-trien-khai-va-giao-dien.md) | - **Hiện thực các thuật toán cốt lõi:** Khóa slot nguyên tử & Cron Sweep 60s; Gợi ý quán Rule-based & Voucher CROSS; Chia bill Largest Remainder (Hamilton) 0 VND lệch; Ví Escrow Idempotency & Đóng băng từng phần.<br>- **Hệ thống thiết kế UI/UX:** Theme "Emerald Pulse", tokens màu, typography.<br>- **Chi tiết 9 Màn hình giao diện (Mapping ảnh thực tế `docs/screenshots/`):** Home Map, Khóa Slot, Lobby Workspace, Chia bill VietQR, Ví Escrow, Khiếu nại, Hồ sơ Uy tín, Provider Portal, Admin Dashboard. |
| **Chương 5** | [**ch5-quan-tri-kiem-thu-danh-gia.md**](./ch5-quan-tri-kiem-thu-danh-gia.md) | - **Quản trị dự án Agile/Scrum:** Kế hoạch 5 Sprint, phân công nhiệm vụ và tiến độ.<br>- **Báo cáo kiểm thử tự động (Vitest):** 7 files, 65/65 test cases PASS 100%.<br>- **Ma trận 30 Test Cases hộp đen** (`docs/test-cases.md`) từ UC01..UC12.<br>- Kiểm thử chịu tải / Race condition đồng thời 20 requests.<br>- Đánh giá kết quả đạt được vs mục tiêu ban đầu, hạn chế & hướng phát triển tương lai. |
| **Phụ lục 1** | [**phu-luc-1-chinh-sach-tranh-chap.md**](./phu-luc-1-chinh-sach-tranh-chap.md) | - **Quy chế & Chính sách Xử lý Trách nhiệm, Khiếu nại và Tranh chấp SyncHub:** Cơ chế bảo lãnh ví Escrow, Chế tài bùng kèo No-show (-15đ, mất cọc cho sân), Quy định nộp bằng chứng ảnh, Khung tỷ lệ bồi hoàn chuẩn của Admin. *(Vũ khí đạt điểm tuyệt đối)*. |
| **Phụ lục 2** | [**phu-luc-2-kich-ban-thuyet-trinh.md**](./phu-luc-2-kich-ban-thuyet-trinh.md) | - **Kịch bản thuyết trình bảo vệ đồ án (Slide-by-slide script):** 15 slides chuẩn từ Câu chuyện nỗi đau $\rightarrow$ Giải pháp $\rightarrow$ Kiến trúc $\rightarrow$ Live Demo 2 thiết bị $\rightarrow$ Quản trị rủi ro & Q&A. |

---

## CÁC TẬP TIN GHI CHÚ TIẾN ĐỘ WBS BAN ĐẦU (ARCHIVED NOTES)
Các tập tin dưới đây là ghi chú sprint kỹ thuật theo từng phân hệ WBS trong quá trình triển khai, đã được tổng hợp trọn vẹn và nâng cấp lên các chương học thuật chính thức phía trên:
- `ch1.md` $\rightarrow$ Đã nâng cấp vào `ch1-tong-quan-va-kinh-doanh.md`
- `ch2.md` $\rightarrow$ Đã nâng cấp vào `ch3-phan-tich-thiet-ke-he-thong.md`
- `ch3-bookslot.md` $\rightarrow$ Đã nâng cấp vào `ch3-...` và `ch4-trien-khai-va-giao-dien.md`
- `ch4-grouporder.md` $\rightarrow$ Đã nâng cấp vào `ch3-...` và `ch4-trien-khai-va-giao-dien.md`
- `ch4-impl.md` $\rightarrow$ Đã nâng cấp vào `ch4-...` và `ch5-quan-tri-kiem-thu-danh-gia.md`

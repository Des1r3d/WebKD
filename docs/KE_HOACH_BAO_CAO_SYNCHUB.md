# Kế hoạch báo cáo và sơ đồ SyncHub

Ngày kiểm tra: 14/11/2026. Trạng thái: kế hoạch triển khai, chưa phải báo cáo nộp cuối cùng.

Yêu cầu đã chốt: báo cáo ít nhất 50 trang; chương 2 chỉ giới thiệu ngắn framework/công nghệ sử dụng; mã và thông tin nhóm để trống. Phạm vi đợt này chỉ là chuẩn bị kế hoạch cho báo cáo và sơ đồ; có thể chụp UI thực tế để minh họa khi triển khai. Không làm slides; Figma để giai đoạn sau.

## 1. Căn cứ và kết quả kiểm tra

- Thư mục mẫu/nộp: `F:\Coding\Projects\MauDoAn\253BIE503004_01`.
- Bộ mẫu gồm `Docs final.docx`, `253BIE503004_01_Slides.pdf`, `Link figma.docx` và năm tệp Draw.io thuộc bốn nhóm Usecase, BPMN, DFD, ERD.
- Đã đọc cấu trúc báo cáo, nội dung mẫu, danh sách trang Draw.io; đối chiếu README, schema và một số luồng xử lý SyncHub tại `F:\Coding\WebKD`. Chưa kiểm tra trực quan toàn bộ sơ đồ, chưa đánh giá nội dung PDF slide hoặc thiết kế ở liên kết Figma.
- Báo cáo mẫu có năm chương; chương 3 chứa tổng quan, As-Is, To-Be, business rules, requirements, user stories, Use Case, DFD và thiết kế dữ liệu. Chương 4 mô tả giao diện; chương 5 tổ chức thực hiện và đánh giá.
- Mẫu lẫn hướng dẫn Git, kịch bản thuyết trình, chính sách, ghi chú biên tập; số mục 3.4–3.7 chưa nhất quán. Khi triển khai cần chuẩn hóa mục lục, không sao chép lỗi cấu trúc.
- Mẫu BPMN As-Is có các trang FB, Shopee, Freelance, Page-6; To-Be có 13 trang nghiệp vụ AntGo. Use Case có 10 trang; DFD có DFD0, DFD1, DFD2; ERD có một trang.
- SyncHub hiện có `docs/diagrams/ERD.drawio` và `BPMN_tobe.drawio`; BPMN gồm hai trang: giữ chỗ/tạo phòng/giải phóng slot và chia bill/VietQR/thanh toán giả lập. Đây là đầu vào để rà soát, chưa mặc định đạt yêu cầu bố cục.

## 2. Nguyên tắc nội dung

AntGo chỉ cung cấp hình thức tổ chức tài liệu. Toàn bộ tác nhân, yêu cầu, quy trình, dữ liệu, hình ảnh và ví dụ phải là SyncHub.

Định vị: SyncHub — nền tảng đặt sân thể thao/phòng học nhóm kết hợp gọi đồ ăn uống theo nhóm, phân bổ chi phí, theo dõi thanh toán và xử lý khiếu nại. Bối cảnh dự kiến theo README là khu vực Làng Đại học Thủ Đức; không trình bày như kết quả khảo sát thực địa nếu chưa có chứng cứ.

Phân biệt ba mức: đã triển khai trong code; đang mô phỏng trong demo; đề xuất phát triển. Thanh toán hiện qua `webhook-mock`; Escrow là mô hình sổ cái trong ứng dụng, không được viết thành hệ thống ngân hàng/ký quỹ thật đã vận hành. Không đưa Ant Xu, đăng yêu cầu giúp việc, ứng tuyển nhận việc hoặc đánh giá dịch vụ kiểu AntGo vào SyncHub.

Nguồn kỹ thuật ưu tiên: routes/middleware và services cho hành vi, Prisma schema cho dữ liệu, giao diện thực tế cho chương 4. README hỗ trợ định hướng nhưng phải đối chiếu code. Sự tồn tại của test không đồng nghĩa test đã chạy đạt; chỉ ghi kết quả sau khi thực thi và lưu bằng chứng.

Tác nhân dự kiến: khách chưa đăng nhập (chỉ các thao tác được phép thực tế), trưởng nhóm, thành viên, nhà cung cấp sân/phòng, nhà cung cấp F&B, quản trị viên. Phân biệt vai trò HOST/MEMBER với quan hệ người tạo phòng: phải đối chiếu quyền thực tế, không suy ra chỉ từ tên enum. Hai nhóm nhà cung cấp cùng role PROVIDER nhưng khác type VENUE/FNB.

## 3. Khung báo cáo theo mẫu

| Phần | Nội dung viết cho SyncHub |
|---|---|
| Đầu tài liệu | Bìa, thông tin nhóm, lời cảm ơn, lời mở đầu, mục lục tự động, danh mục hình/bảng, từ viết tắt |
| Chương 1 — Tổng quan đề tài | Lý do chọn đề tài; vấn đề đặt sân và gom đơn/chia tiền rời rạc; khảo sát giải pháp liên quan; SWOT; bối cảnh thị trường; khách hàng mục tiêu; mô hình doanh thu đề xuất; nhóm chức năng |
| Chương 2 — Giới thiệu framework và công nghệ sử dụng | Giới thiệu ngắn Express trên Node.js, giao diện HTML/CSS/JavaScript ES modules và vai trò của Socket.io, PostgreSQL/Prisma, Leaflet. Nêu lý do chọn và cách sử dụng trong SyncHub; không viết lý thuyết dài hoặc giữ Angular của mẫu. Thuật toán chia tiền, giữ chỗ và escrow chuyển sang chương 3 ở đúng nghiệp vụ |
| Chương 3 — Phân tích và thiết kế | Các mục 3.1–3.9 bên dưới; đây là phần cần hoàn thiện trước khi viết giao diện và đánh giá |
| Chương 4 — Thiết kế và hiện thực giao diện | Nguyên tắc thiết kế, điều hướng, đăng ký/đăng nhập, khám phá sân/phòng, chọn slot, phòng nhóm, giỏ món chung, hóa đơn cá nhân, thanh toán demo, khiếu nại, giao diện provider và admin theo tính năng thực tế |
| Chương 5 — Tổ chức thực hiện và đánh giá | Quy trình làm việc, tiến độ/phân công có dữ liệu thật, kiểm thử và kết quả thực nghiệm, ưu điểm, hạn chế, hướng phát triển |
| Cuối tài liệu | Tài liệu tham khảo, phụ lục đặc tả dài, bộ test, hướng dẫn chạy demo và sơ đồ khổ lớn |

Chi tiết chương 3:

1. **3.1 Tổng quan:** mục tiêu, phạm vi, tác nhân, persona và nhóm chức năng.
2. **3.2 As-Is:** quy trình thủ công đặt sân, gom món, thu tiền; pain point và khoảng trống. Ghi rõ là mô hình giả định phân tích nếu chưa khảo sát thực tế.
3. **3.3 To-Be:** các quy trình SyncHub, bảng so sánh As-Is/To-Be và ngoại lệ.
4. **3.4 Quy tắc nghiệp vụ:** tài khoản/phân quyền, slot, phòng nhóm, giỏ món, voucher, chia tiền, thanh toán/escrow, uy tín, khiếu nại. Giữ mã BR đã có trong code khi phù hợp; bổ sung mã mới có danh mục đối chiếu.
5. **3.5 Yêu cầu:** chức năng và phi chức năng, mỗi yêu cầu có mã, nguồn và tiêu chí nghiệm thu đo được; chỉ ghi chỉ tiêu hiệu năng là mục tiêu khi chưa đo.
6. **3.6 User stories:** theo tác nhân, kèm điều kiện chấp nhận.
7. **3.7 Use Case:** tổng quan, phân rã và đặc tả các luồng chính/ngoại lệ; tiền điều kiện, hậu điều kiện, quyền truy cập.
8. **3.8 DFD:** sơ đồ ngữ cảnh, mức 1, mức 2 cho các tiến trình trọng tâm; từ điển luồng và kho dữ liệu.
9. **3.9 Dữ liệu:** mô hình khái niệm, ERD vật lý, từ điển đủ 12 bảng, khóa/ràng buộc/enum, giải thích các quan hệ tùy chọn.

### 3.10 Phân bổ dung lượng dự kiến

Để bảo đảm yêu cầu ít nhất 50 trang, đặt mục tiêu **56–62 trang nội dung chính**, chưa tính bìa, mục lục, danh mục, tài liệu tham khảo và phụ lục. Đây là cách phân bổ dự phòng của kế hoạch, không phải quy định mới của môn học. Số trang cuối cùng kiểm tra trên PDF đã xuất, không suy từ số từ hoặc số trang bản thảo.

| Chương | Số trang dự kiến | Trọng tâm |
|---|---:|---|
| 1. Tổng quan | 7–8 | Vấn đề, đối tượng, khảo sát, SWOT, phạm vi và giá trị của SyncHub |
| 2. Framework/công nghệ | 2–3 | Tổng quan ngắn, bảng vai trò công nghệ và lý do chọn |
| 3. Phân tích và thiết kế | 32–34 | Quy trình, quy tắc, yêu cầu, đặc tả UC, DFD, ERD và từ điển dữ liệu |
| 4. Giao diện và hiện thực | 9–10 | Các luồng sử dụng chính, ảnh UI chọn lọc và giải thích hành vi |
| 5. Thực hiện và đánh giá | 6–7 | Phương pháp kiểm thử, kết quả có bằng chứng, hạn chế và hướng phát triển |
| **Tổng nội dung chính** | **56–62** | Không tăng trang bằng khoảng trắng, ảnh phóng lớn hoặc nội dung lặp |

Trong chương 3 dự kiến dành 2 trang tổng quan, 3 trang As-Is, 6–7 trang To-Be, 3 trang quy tắc, 2 trang yêu cầu, 2 trang user stories, 5–6 trang Use Case, 4 trang DFD và 5 trang thiết kế dữ liệu. Điều chỉnh theo độ dài thực tế để sơ đồ vẫn đọc rõ. Mỗi hình có mục đích, diễn giải và tham chiếu trong nội dung; các trang chi tiết bổ sung được đưa vào phụ lục khi cần.

Chương 2 không gọi mọi thành phần là framework: Express là framework phía server; Node.js là môi trường chạy; PostgreSQL là hệ quản trị cơ sở dữ liệu; Prisma là ORM; Socket.io và Leaflet là thư viện. Phần frontend hiện dùng JavaScript thuần, không tự thêm Angular/React vào báo cáo. Chỉ xác nhận phiên bản từ manifest/lockfile khi viết.

## 4. Danh mục sơ đồ cần triển khai

Giữ cấu trúc bốn thư mục và năm tệp như mẫu; có thể chia nhiều trang trong một tệp để dễ đọc. Không bắt buộc giữ số lượng trang của AntGo.

| Tệp dự kiến | Các trang/nội dung |
|---|---|
| `Drawio/Usecase/UseCase.drawio` | Tổng quan; tài khoản; tìm kiếm/giữ chỗ; phòng nhóm/thành viên; gọi món; voucher/chia bill; thanh toán/check-in; khiếu nại; quản lý nhà cung cấp; quản trị. Gộp hoặc bỏ trang không có đủ chức năng thực tế |
| `Drawio/BPMN/BPMN_AsIS.drawio` | Đặt sân/phòng qua liên hệ thủ công; gom món và thu tiền nhóm; xử lý hủy/khiếu nại thủ công. Các bước ngoài hệ thống phải có căn cứ hoặc nhãn giả định |
| `Drawio/BPMN/BPMN_tobe.drawio` | Giữ slot/tạo phòng/hết hạn; tham gia/rời phòng và cọc; gọi món/chốt đơn; áp voucher/chia bill; xác nhận thanh toán giả lập; check-in/giải ngân; hủy phòng; gửi/giải quyết khiếu nại. Tách quy trình con nếu quá dày |
| `Drawio/DFD/DFD.drawio` | Ngữ cảnh (mức 0 theo quy ước của bộ này); mức 1 toàn hệ thống; mức 2 cho đặt chỗ/phòng nhóm, giỏ món/chia tiền, thanh toán/escrow và khiếu nại |
| `Drawio/ERD/ERD.drawio` | Tổng quan 12 bảng; các trang chi tiết tài khoản/nhà cung cấp, đặt chỗ/phòng nhóm, giỏ món/voucher/hóa đơn, escrow/khiếu nại/nhật ký. Quan hệ lặp giữa trang phải giữ cùng tên và lực lượng |

12 bảng đã xác nhận: `users`, `providers`, `slots`, `menu_items`, `group_lobbies`, `lobby_members`, `cart_items`, `vouchers`, `split_bills`, `escrow_transactions`, `disputes`, `audit_logs`.

Nhóm tiến trình DFD mức 1 dự kiến: 1.0 tài khoản; 2.0 địa điểm/slot; 3.0 phòng nhóm; 4.0 gọi món; 5.0 phân bổ chi phí/thanh toán; 6.0 hoàn tất/escrow; 7.0 khiếu nại/quản trị. Chốt lại sau khi đối chiếu tất cả routes. Kho dữ liệu có thể nhóm nhiều bảng, nhưng phải có bảng ánh xạ rõ ràng.

BPMN cần thể hiện thời hạn giữ chỗ 10 phút khác thời hạn chốt phòng, nhánh slot bị chiếm/hết hạn, quyền của người chốt, món không hợp lệ, thanh toán lặp, chưa đủ tiền, hủy phòng, đóng băng và xử lý khiếu nại. Trình tự check-in/giải ngân và hoàn tiền phải đọc đầy đủ service trước khi vẽ.

## 5. Quy chuẩn sơ đồ và kiểm tra

- Nền trắng `#FFFFFF`, chữ và đường viền đen `#000000`; không gradient, màu phân nhóm, đổ bóng hoặc ảnh nền. Font phổ thông hỗ trợ tiếng Việt, thống nhất toàn bộ bộ sơ đồ.
- Luồng chính từ trái sang phải hoặc trên xuống; các nhánh phụ xếp riêng. Nối vuông góc, neo ở cạnh hình, không xuyên hình hoặc nhãn. Tách trang/quy trình con để xử lý đường giao nhau; không thu nhỏ toàn bộ cho vừa trang.
- Cùng loại nút dùng cùng kích thước, khoảng cách đều; nhãn ngắn, ngắt dòng có chủ đích. Kiểm tra cỡ chữ sau khi chèn vào báo cáo ở kích thước in thực tế.
- Use Case đúng ranh giới hệ thống và hướng include/extend; không lạm dụng include chỉ để nối chuỗi thao tác.
- BPMN phân biệt sequence flow trong pool với message flow giữa pool; gateway có điều kiện, có điểm bắt đầu/kết thúc; không trộn DFD vào BPMN.
- DFD cân bằng đầu vào/đầu ra giữa các mức; không nối trực tiếp tác nhân với kho dữ liệu; tên luồng là dữ liệu, tên tiến trình là hành động.
- ERD đúng PK/FK, unique, nullable, 1–N/0–1 và khóa ghép theo schema. Không thêm bảng chat/thông báo chỉ vì mẫu có chúng. `audit_logs.entity_id` không tự động là FK tới mọi bảng.
- Xuất từng trang để kiểm tra trực quan: không cắt hình, chữ tràn, nhãn chồng nhau, mũi tên mơ hồ hoặc đường nối đè chữ. Kiểm tra cả bản xuất và hình sau khi chèn vào DOCX/PDF.
- Lập ma trận `BR → yêu cầu → user story → UC → BPMN/DFD → bảng → màn hình → test`. Dùng chung thuật ngữ và trạng thái giữa các tài liệu.

## 6. Trình tự thực hiện và đầu ra

| Bước | Công việc | Điều kiện hoàn tất |
|---|---|---|
| 1 | Đọc toàn bộ routes/quyền/services/test; chốt phạm vi và thuật ngữ | Danh mục chức năng có nguồn; tách rõ demo/đề xuất/đã có |
| 2 | Viết BR, requirements, stories, đặc tả UC; dựng ma trận truy vết | Các quy tắc và ngoại lệ chính có tiêu chí nghiệm thu |
| 3 | Vẽ ERD, Use Case, As-Is, To-Be rồi DFD | Đủ năm tệp, trang đặt tên rõ, nội dung nhất quán với schema và luồng nghiệp vụ |
| 4 | Xuất và rà soát từng trang sơ đồ | Đạt quy chuẩn đen/trắng, không chồng chéo, đọc được khi in |
| 5 | Viết chương 3; tiếp theo chương 1–2, 4, 5 | Mọi chương là SyncHub; số liệu/nhận định có nguồn hoặc nhãn giả định |
| 6 | Chạy demo và kiểm thử phù hợp, chụp màn hình | Ảnh từ SyncHub thật; kết quả kiểm thử có ngày, môi trường, số ca đạt/lỗi |
| 7 | Hoàn thiện DOCX, xuất PDF, rà soát từng trang | Mục lục, số hình/bảng, tham chiếu, ngắt trang, chất lượng ảnh đều đúng; xác nhận ít nhất 50 trang theo bản PDF |
| 8 | Đóng gói riêng bộ báo cáo và sơ đồ SyncHub | Đủ DOCX/PDF, năm tệp Draw.io và hình xuất; mã/thông tin nhóm còn trống; không lẫn tài liệu AntGo |

Đầu ra mục tiêu: `Bao_cao_SyncHub.docx`, `Bao_cao_SyncHub.pdf`; năm tệp Draw.io chỉnh sửa được; bản xuất sơ đồ SVG/PDF hoặc PNG rõ nét. Ma trận truy vết, ảnh UI gốc và bằng chứng kiểm thử là tài liệu hỗ trợ biên soạn/kiểm tra. Không dùng mã nhóm trong tên file trước khi người dùng chốt. Slides và Figma nằm ngoài phạm vi đợt này.

### 6.1 Chuẩn bị ảnh giao diện

- Khi viết chương 4, chạy SyncHub bằng dữ liệu demo và chụp các màn hình cần chứng minh luồng: khám phá/chọn slot, phòng nhóm, giỏ món, bill cá nhân/thanh toán giả lập, khiếu nại, provider và admin.
- Dự kiến 8–12 ảnh có chọn lọc; chỉ chụp màn hình thực sự có và cần giải thích. Không cần ảnh cho mọi nút; không dựng mockup để thay thế chức năng chưa triển khai.
- Mỗi ảnh ghi màn hình, vai trò, trạng thái và liên kết tới UC tương ứng. Dữ liệu nhất quán xuyên suốt một kịch bản demo; tránh lộ dữ liệu cá nhân hoặc thông tin đăng nhập.
- Quy định đen/trắng áp dụng cho sơ đồ. Ảnh UI giữ giao diện thực tế, bố trí rõ nét; không cần chuyển UI sang đen/trắng.
- Chụp UI sau khi ổn định danh mục chức năng và kịch bản; không phụ thuộc vào việc có Figma.

Không lấy thông tin thành viên, mã nhóm, phân công, tiến độ hoặc URL thiết kế của AntGo làm thông tin SyncHub. Không chép số liệu thị trường trong mẫu sang báo cáo mới. Nghiên cứu nguồn cho SyncHub ở bước viết chương 1 và trích dẫn theo quy định môn học.

## 7. Quyết định đã chốt và thông tin bổ sung sau

1. **Mã và thông tin nhóm:** để trống, người dùng chốt sau. Không kế thừa thông tin từ bộ mẫu. Bảng phân công chưa có dữ liệu để trống tên; không dựng lịch sử đóng góp hoặc thời gian thực hiện.
2. **Dung lượng:** tối thiểu 50 trang; kế hoạch nhắm 56–62 trang nội dung chính. Chương 2 giữ ngắn 2–3 trang, tập trung phần phân tích/thiết kế ở chương 3.
3. **Phạm vi:** báo cáo và sơ đồ; ảnh UI được phép dùng khi cần. Không triển khai slides; Figma làm sau.
4. **Thông tin bổ sung sau:** thông tin bìa, phân công thực tế, rubric và hạn nộp nếu có. Các thông tin này không phải điều kiện để bắt đầu chuẩn bị nội dung.

Mặc định lập kế hoạch theo phạm vi mã nguồn hiện tại ở `F:\Coding\WebKD`. Các đầu vào còn thiếu trên không ngăn việc rà soát nghiệp vụ và chuẩn bị sơ đồ.

## 8. Checklist sẵn sàng triển khai

- [ ] Lập danh mục chức năng đã có/demo/đề xuất sau khi đọc đủ routes và services.
- [ ] Chốt thuật ngữ, tác nhân, trạng thái và mã định danh dùng chung.
- [ ] Lập ma trận truy vết và dàn ý tới cấp mục cho từng chương.
- [ ] Chốt danh sách trang Draw.io, luồng chính và ngoại lệ cần vẽ.
- [ ] Chuẩn bị mẫu trang Word theo format mẫu, chuẩn hóa heading/caption/mục lục; giữ trống thông tin nhóm.
- [ ] Chuẩn bị nguồn tham khảo phù hợp SyncHub và kịch bản demo/chụp UI.
- [ ] Biên soạn và kiểm tra sơ đồ trước khi chèn vào chương 3.
- [ ] Viết đủ nội dung theo phân bổ; xác minh thông tin kỹ thuật và kết quả kiểm thử.
- [ ] Xuất PDF kiểm tra số trang, bố cục, khả năng đọc của từng hình và tính nhất quán với Draw.io.
- [ ] Quét nội dung sót từ mẫu: AntGo, Ant Xu, tên thành viên, nghiệp vụ và liên kết thiết kế mẫu; xử lý mọi chỗ không thuộc SyncHub.

Các checkbox trên là công việc dự kiến cho giai đoạn triển khai, chưa được đánh dấu hoàn tất trong lượt cập nhật kế hoạch này.

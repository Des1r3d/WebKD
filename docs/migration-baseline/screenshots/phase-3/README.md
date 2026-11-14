# Ảnh đối chiếu Giai đoạn 3

Playwright capture trên bản vanilla đang proxy tới API local. Có 29 scenario × 3 viewport: `390x844`, `768x1024`, `1440x900` (87 ảnh). Tên file theo mẫu `<scenario>-<width>x<height>.png`.

Scenario bao phủ auth, discover, venue, join, lobby host/member/locked, split, wallet, disputes, provider/admin portal và wildcard, styleguide, empty/loading/error, modal, hover, keyboard focus, login error. Vai trò và route chính xác cùng `scrollWidth`, font/image, API/resource error và page error ở [capture-results.json](capture-results.json).

Capture cuối ghi 0 tràn ngang, 0 font lỗi, 0 lỗi tải tài nguyên/ảnh và 0 lỗi JavaScript. Các HTTP 404/401 là kết quả có chủ đích của scenario không tìm thấy địa điểm/đăng nhập sai. Các sai khác thị giác còn mở được nêu tại [phase-3-results.md](../../phase-3-results.md).

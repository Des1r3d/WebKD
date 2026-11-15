from deck_lib import *


def s10(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "03 · KỸ THUẬT · ESCROW", "Tiền chỉ chảy khi buổi chơi được xác nhận",
           "Mỗi hóa đơn tạo đúng một bút toán HOLD; giải ngân tách riêng cho sân và quán F&B.")

    stats = [("HELD", "176.000đ", GOLD, GOLD2), ("RELEASED", "345.000đ", EMERALD, MINT2),
             ("FROZEN", "95.000đ", RED, RED2), ("REFUNDED", "25.000đ", FOREST, CREAM2)]
    for i, (label, amount, color, fill) in enumerate(stats):
        x = 0.62 + (i % 2) * 3.38
        y = 1.76 + (i // 2) * 1.16
        card(s, x, y, 3.22, 1.00, fill=fill, line=None, radius=0.06, shadow=False)
        text(s, x + 0.18, y + 0.12, 1.6, 0.22, label, size=8.2, color=color, bold=True)
        text(s, x + 0.18, y + 0.38, 2.9, 0.42, amount, size=22, color=color, bold=True, line_spacing=0.95)

    # flow
    flow = [("Bill PAID", "webhook"), ("HOLD", "1 bill = 1 key"), ("RELEASE", "check-in"),
            ("FROZEN", "khiếu nại"), ("REFUND", "admin duyệt")]
    for i, (title, sub) in enumerate(flow):
        x = 0.62 + i * 1.36
        fill = FOREST if i == 0 else (EMERALD if i < 3 else (RED if i == 3 else GOLD))
        rect(s, x, 4.34, 1.20, 0.78, fill=fill, line=None, radius=0.06)
        text(s, x + 0.08, 4.42, 1.04, 0.26, title, size=8.4, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
        text(s, x + 0.08, 4.70, 1.04, 0.22, sub, size=6.6, color=WHITE, align=PP_ALIGN.CENTER)
        if i < 4:
            arrow(s, x + 1.21, 4.63, w=0.12, h=0.16, color=RGBColor(0xB9, 0xC9, 0xBF))

    text(s, 0.62, 5.18, 6.55, 0.22,
         "RELEASE và FROZEN là hai nhánh sau check-in; REFUND chỉ sau quyết định admin.",
         size=7.2, color=MUTED, italic=True)

    chips = ["hold:lobby:bill", "release:lobby:provider", "Hủy phòng → hoàn HELD", "Rời muộn → PENALTY"]
    for i, c in enumerate(chips):
        pill(s, 0.62 + (i % 2) * 3.38, 5.42 + (i // 2) * 0.44, 3.20, 0.32, c,
             fill=WHITE, color=FOREST, size=7.8, line=LINE)

    text(s, 0.62, 6.40, 6.55, 0.46,
         "Release lặp → 409. Hủy phòng và thanh toán cùng khóa hàng phòng để không mâu thuẫn.",
         size=9.0, color=MUTED, line_spacing=1.1)

    picture(s, "07-wallet.png", 7.62, 1.74, 5.10, 3.20, radius=0.06)
    card(s, 7.62, 5.14, 5.10, 1.40, fill=FOREST, line=None, radius=0.06, shadow=False)
    text(s, 7.80, 5.24, 4.7, 0.22, "PHÍ NỀN TẢNG TRÊN KỊCH BẢN DEMO", size=7.6, color=RGBColor(0x9F, 0xD9, 0xC4), bold=True)
    text(s, 7.80, 5.50, 4.75, 0.30, "Sân 8% · 9.600đ      F&B 12% · 11.400đ", size=9.6, color=WHITE, bold=True)
    text(s, 7.80, 5.84, 4.75, 0.30, "Tổng 21.000đ ≈ 9,8% GMV 215.000đ", size=9.6, color=RGBColor(0xCF, 0xEC, 0xDF), bold=True)
    text(s, 7.80, 6.14, 4.75, 0.24, "Đối tác thực nhận 110.400 + 83.600 = 194.000đ", size=7.8, color=RGBColor(0xCF, 0xEC, 0xDF))

    footer(s, 10)
    notes(s, "Sổ cái bên phải là dữ liệu thật sau kịch bản demo: bốn hóa đơn tạo bốn HOLD, tổng 176.000. Khi check-in, phần sân 120.000 được RELEASE, phần F&B 95.000 bị FROZEN vì có khiếu nại. Admin duyệt hoàn 25.000. Mỗi bút toán có idempotency key, nên gọi lặp không sinh tác động trùng; release lặp trả 409. Hủy phòng cũng hoàn các khoản HELD trong cùng transaction với audit. (1:15)")
    return s


def s11(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "03 · KỸ THUẬT · UY TÍN", "Uy tín quyết định ai được vào phòng",
           "Cọc không phải hình phạt: đó là cách chia sẻ rủi ro giữa người đến và người bùng kèo.")

    tiers = [
        ("A", "90–100", "Miễn cọc 0%", "98đ · Host", EMERALD, MINT2),
        ("B", "70–89", "Cọc 30% tiền sân", "82đ → 9.000đ", FOREST, WHITE),
        ("C", "50–69", "Cọc 100% tiền sân", "64đ → 30.000đ", GOLD, GOLD2),
        ("!", "< 50", "Chặn vào phòng", "42đ · FLAGGED", RED, RED2),
    ]
    for i, (tier, score, rule, example, color, fill) in enumerate(tiers):
        y = 1.76 + i * 1.10
        card(s, 0.62, y, 6.55, 0.96, fill=fill, line=None, radius=0.06, shadow=False)
        badge(s, 0.82, y + 0.22, 0.52, tier, fill=color, size=13)
        text(s, 1.52, y + 0.14, 1.3, 0.30, score, size=12.0, color=color, bold=True)
        text(s, 2.66, y + 0.14, 2.55, 0.30, rule, size=11.4, color=INK, bold=True)
        text(s, 5.10, y + 0.16, 1.90, 0.28, example, size=9.2, color=MUTED, align=PP_ALIGN.RIGHT)
        text(s, 1.52, y + 0.50, 4.9, 0.26,
             "Điểm uy tín + lịch sử tham gia" if i < 3 else "Không thể tham gia bất kỳ phòng nào",
             size=8.2, color=MUTED)

    picture(s, "06-disputes.png", 7.52, 1.74, 5.20, 3.24, radius=0.06)

    card(s, 7.52, 5.18, 5.20, 1.34, fill=WHITE, line=LINE, radius=0.06, shadow=False)
    text(s, 7.70, 5.28, 4.8, 0.22, "KHIẾU NẠI CÓ BẰNG CHỨNG", size=7.8, color=EMERALD, bold=True)
    text(s, 7.70, 5.54, 4.85, 0.86,
         "Mở khiếu nại (tối đa 5 ảnh) → đóng băng phần của đối tác → Admin duyệt hoặc từ chối → ghi audit. Hoàn không vượt phần đang giữ.",
         size=8.8, color=FOREST, line_spacing=1.12)

    card(s, 0.62, 6.24, 6.55, 0.62, fill=CREAM2, line=None, radius=0.05, shadow=False)
    text(s, 0.80, 6.36, 6.2, 0.28, "Check-in +2   ·   No-show −15   ·   Admin đặt lại điểm",
         size=9.4, color=FOREST, bold=True)

    footer(s, 11)
    notes(s, "Bốn hạng quyết định mức cọc: A miễn, B 30%, C 100%, dưới 50 bị chặn. Trong seed, B cọc 9.000 và C cọc 30.000 trên phần sân 30.000. Check-in cộng 2 điểm, no-show trừ 15 và có bút toán PENALTY. Khiếu nại có ảnh bằng chứng sẽ đóng băng phần của đối tác; admin duyệt hoặc từ chối và mọi quyết định đều ghi audit. (1:05)")
    return s


def s12(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "03 · SẢN PHẨM", "Một hệ sinh thái, ba góc nhìn",
           "Cùng một nguồn dữ liệu, nhưng mỗi vai trò thấy đúng phần mình cần.")

    # member
    card(s, 0.62, 1.72, 3.85, 4.60, fill=WHITE, line=LINE, radius=0.07)
    text(s, 0.84, 1.86, 3.4, 0.28, "THÀNH VIÊN", size=8.6, color=EMERALD, bold=True)
    phone(s, 1.84, 2.08, 1.42, 2.95, "13-mobile-lobby.png")
    text(s, 0.84, 5.08, 3.45, 0.26, "4 người · 215.000đ · 4 hóa đơn", size=8.6, color=FOREST, bold=True)
    text(s, 0.84, 5.34, 3.45, 0.44, "Thấy phần của mình, trạng thái phòng và mã QR mời.", size=8.0, color=MUTED, line_spacing=1.05)
    text(s, 0.84, 5.62, 3.45, 0.24, "Mã mời SYNC01 · QR chia sẻ", size=7.8, color=EMERALD, bold=True)

    # provider
    card(s, 4.74, 1.72, 3.85, 4.60, fill=WHITE, line=LINE, radius=0.07)
    text(s, 4.96, 1.86, 3.4, 0.28, "ĐỐI TÁC", size=8.6, color=EMERALD, bold=True)
    picture(s, "08-provider.png", 4.96, 2.16, 3.40, 2.13, radius=0.05, shadow=False)
    text(s, 4.96, 4.40, 3.45, 0.26, "40 slot · 38 trống · 220.000đ gross", size=8.6, color=FOREST, bold=True)
    text(s, 4.96, 4.66, 3.45, 0.52, "Thêm slot, quản lý món, xem doanh thu và thực nhận.", size=8.0, color=MUTED, line_spacing=1.05)
    text(s, 4.96, 5.26, 3.45, 0.26, "Phí 8% → thực nhận 202.400đ", size=8.4, color=EMERALD, bold=True)
    text(s, 4.96, 5.56, 3.45, 0.24, "5 món trong menu", size=7.8, color=MUTED)

    # admin
    card(s, 8.86, 1.72, 3.85, 4.60, fill=WHITE, line=LINE, radius=0.07)
    text(s, 9.08, 1.86, 3.4, 0.28, "ADMIN", size=8.6, color=EMERALD, bold=True)
    picture(s, "09-admin.png", 9.08, 2.16, 3.40, 2.13, radius=0.05, shadow=False)
    text(s, 9.08, 4.40, 3.45, 0.26, "GMV 410.000đ · phí 40.400đ", size=8.6, color=FOREST, bold=True)
    text(s, 9.08, 4.66, 3.45, 0.52, "Theo dõi HELD/FROZEN, xử lý khiếu nại, khôi phục tài khoản.", size=8.0, color=MUTED, line_spacing=1.05)
    text(s, 9.08, 5.26, 3.45, 0.26, "HELD 176.000 · FROZEN 95.000", size=8.4, color=RED, bold=True)
    text(s, 9.08, 5.56, 3.45, 0.24, "9 người dùng · 2 phòng", size=7.8, color=MUTED)

    card(s, 0.62, 6.44, 12.09, 0.56, fill=FOREST, line=None, radius=0.05, shadow=False)
    text(s, 0.86, 6.54, 11.6, 0.36,
         "Một tài khoản, một JWT, ba bề mặt giao diện — dữ liệu không bị sao chép giữa các vai trò.",
         size=10.6, color=WHITE, bold=True)

    footer(s, 12)
    notes(s, "Ba ảnh này là ba vai trò thật trong cùng một hệ thống. Thành viên thấy phòng và phần tiền của mình. Đối tác thấy slot, menu và doanh thu; con số 220.000 gross, 202.400 thực nhận sau phí 8%. Admin thấy GMV, phí, HELD/FROZEN, danh sách FLAGGED, khiếu nại và audit log. Không có bảng dashboard riêng: tất cả tính từ dữ liệu giao dịch. (0:40)")
    return s


def s13(prs):
    s = prs.slides.add_slide(prs.slide_layouts[6])
    bg(s)
    header(s, "03 · KIẾN TRÚC", "Một tiến trình, một origin, không bước build",
           "Express phục vụ luôn giao diện, API, Socket.io và ảnh tải lên — client chỉ là ES modules.")

    boxes = [
        (0.62, 3.55, "TRÌNH DUYỆT", "HTML · CSS · ES modules",
         ["History API router", "Leaflet + bản đồ", "Socket.io client", "Không bundler, không build", "Cùng origin, không CORS"]),
        (4.45, 4.00, "EXPRESS 4.22", "Node.js 24 · một tiến trình",
         ["REST 35+ endpoint", "JWT + RBAC middleware", "Static /assets · /images", "Socket.io + Multer uploads", "CSP sandbox cho /uploads"]),
        (8.73, 3.98, "POSTGRESQL 16", "Prisma 5.22 · transaction",
         ["12 bảng · 5 migration", "UPDATE có điều kiện", "SELECT … FOR UPDATE", "Audit log cùng transaction", "Index (status, locked_until)"]),
    ]
    for x, w, title, sub, lines in boxes:
        card(s, x, 1.78, w, 3.20, fill=WHITE, line=LINE, radius=0.07)
        text(s, x + 0.22, 1.94, w - 0.44, 0.26, title, size=9.0, color=EMERALD, bold=True)
        text(s, x + 0.22, 2.22, w - 0.44, 0.28, sub, size=10.4, color=FOREST, bold=True)
        for j, ln in enumerate(lines):
            yy = 2.66 + j * 0.46
            rect(s, x + 0.24, yy + 0.07, 0.13, 0.13, fill=EMERALD, line=None, radius=0.5)
            text(s, x + 0.46, yy, w - 0.66, 0.26, ln, size=8.6, color=MUTED)
    arrow(s, 4.20, 3.12, w=0.20, h=0.24, color=EMERALD)
    arrow(s, 8.48, 3.12, w=0.20, h=0.24, color=EMERALD)

    # one-origin strip
    card(s, 0.62, 5.20, 12.09, 0.62, fill=FOREST, line=None, radius=0.05, shadow=False)
    text(s, 0.86, 5.32, 2.2, 0.24, "MỘT ORIGIN", size=7.8, color=RGBColor(0x9F, 0xD9, 0xC4), bold=True)
    text(s, 2.05, 5.30, 10.3, 0.30, "/  ·  /api  ·  /socket.io  ·  /assets  ·  /uploads",
         size=11.0, color=WHITE, bold=True, font=MONO)

    chips = ["Node 24", "Express 4.22", "Socket.io 4.8.4", "Prisma 5.22", "PostgreSQL 16", "Leaflet 1.9.4", "JWT + bcrypt", "Multer"]
    for i, c in enumerate(chips):
        pill(s, 0.62 + i * 1.52, 6.06, 1.42, 0.32, c, fill=WHITE, color=FOREST, size=7.4, line=LINE)
    text(s, 0.62, 6.52, 12.05, 0.24,
         "12 bảng · 21 quy tắc nghiệp vụ · 14 use case · 14 yêu cầu chức năng · 6 yêu cầu phi chức năng",
         size=8.4, color=MUTED)

    footer(s, 13)
    notes(s, "Kiến trúc cố ý đơn giản: một tiến trình Node, một origin. Express phục vụ giao diện tĩnh, API, Socket.io và ảnh upload; không có bước build cho client. PostgreSQL 16 là nơi xử lý cạnh tranh: UPDATE có điều kiện cho slot, SELECT FOR UPDATE cho phòng. Prisma giữ schema, migration và transaction. Đổi lại, hệ thống dễ chạy demo và dễ truy vết hơn, nhưng không có lợi ích của CDN hay tách frontend. (1:00)")
    return s

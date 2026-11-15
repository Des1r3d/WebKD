"""Shared design system for the SyncHub defense deck."""
import os
from PIL import Image, ImageDraw, ImageFilter
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCREENS = os.path.join(ROOT, "docs", "slides-assets", "screens")
CACHE = os.path.join(ROOT, "docs", "slides", "assets-cards")
os.makedirs(CACHE, exist_ok=True)

# palette
CREAM = RGBColor(0xF7, 0xF4, 0xEC)
CREAM2 = RGBColor(0xEF, 0xEB, 0xDE)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
INK = RGBColor(0x10, 0x23, 0x1C)
MUTED = RGBColor(0x5B, 0x6B, 0x62)
FOREST = RGBColor(0x0B, 0x3B, 0x2E)
FOREST2 = RGBColor(0x14, 0x4D, 0x3C)
EMERALD = RGBColor(0x05, 0x96, 0x69)
MINT = RGBColor(0xDD, 0xF3, 0xE7)
MINT2 = RGBColor(0xEE, 0xF8, 0xF1)
GOLD = RGBColor(0xC9, 0x8A, 0x2E)
GOLD2 = RGBColor(0xFB, 0xF0, 0xD9)
RED = RGBColor(0xB4, 0x45, 0x3A)
RED2 = RGBColor(0xF9, 0xE7, 0xE4)
LINE = RGBColor(0xE2, 0xDE, 0xD0)
CODEBG = RGBColor(0x0F, 0x2A, 0x22)

FONT = "Segoe UI"
MONO = "Consolas"

W = 13.333
H = 7.5
M = 0.62


def rgb_hex(c):
    return "%02X%02X%02X" % (c[0], c[1], c[2])


def bg(slide):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(W), Inches(H))
    shape.fill.solid()
    shape.fill.fore_color.rgb = CREAM
    shape.line.fill.background()
    shape.shadow.inherit = False
    return shape


def rect(slide, x, y, w, h, fill=WHITE, line=None, radius=0.0, lw=1.0):
    kind = MSO_SHAPE.ROUNDED_RECTANGLE if radius else MSO_SHAPE.RECTANGLE
    s = slide.shapes.add_shape(kind, Inches(x), Inches(y), Inches(w), Inches(h))
    if radius:
        s.adjustments[0] = min(0.5, radius)
    if fill is None:
        s.fill.background()
    else:
        s.fill.solid()
        s.fill.fore_color.rgb = fill
    if line is None:
        s.line.fill.background()
    else:
        s.line.color.rgb = line
        s.line.width = Pt(lw)
    s.shadow.inherit = False
    return s


def card(slide, x, y, w, h, fill=WHITE, line=LINE, radius=0.07, shadow=True):
    if shadow:
        rect(slide, x + 0.035, y + 0.045, w, h, fill=CREAM2, line=None, radius=radius)
    return rect(slide, x, y, w, h, fill=fill, line=line, radius=radius)


def text(slide, x, y, w, h, content, size=14, color=INK, bold=False, font=FONT,
         align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, line_spacing=1.08,
         space_after=0, italic=False, margins=(0.0, 0.0, 0.0, 0.0)):
    box = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left, tf.margin_right, tf.margin_top, tf.margin_bottom = [Inches(v) for v in margins]
    tf.vertical_anchor = anchor
    tf.auto_size = None
    paragraphs = content if isinstance(content, list) else [content]
    for i, item in enumerate(paragraphs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = line_spacing
        p.space_after = Pt(space_after)
        runs = item if isinstance(item, list) else [(item, {})]
        for t, opt in runs:
            r = p.add_run()
            r.text = t
            f = r.font
            f.name = opt.get("font", font)
            f.size = Pt(opt.get("size", size))
            f.bold = opt.get("bold", bold)
            f.italic = opt.get("italic", italic)
            f.color.rgb = opt.get("color", color)
    return box


def pill(slide, x, y, w, h, label, fill=MINT, color=EMERALD, size=9.5, bold=True, line=None):
    s = rect(slide, x, y, w, h, fill=fill, line=line, radius=0.5, lw=0.8)
    tf = s.text_frame
    tf.word_wrap = False
    tf.margin_left = tf.margin_right = Inches(0.03)
    tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = label
    r.font.name = FONT
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color
    return s


def badge(slide, x, y, d, label, fill=FOREST, color=WHITE, size=11):
    s = slide.shapes.add_shape(MSO_SHAPE.OVAL, Inches(x), Inches(y), Inches(d), Inches(d))
    s.fill.solid()
    s.fill.fore_color.rgb = fill
    s.line.fill.background()
    s.shadow.inherit = False
    tf = s.text_frame
    tf.margin_left = tf.margin_right = 0
    tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = label
    r.font.name = FONT
    r.font.size = Pt(size)
    r.font.bold = True
    r.font.color.rgb = color
    return s


def arrow(slide, x, y, w=0.30, h=0.22, color=EMERALD):
    s = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, Inches(x), Inches(y), Inches(w), Inches(h))
    s.fill.solid()
    s.fill.fore_color.rgb = color
    s.line.fill.background()
    s.shadow.inherit = False
    return s


def line(slide, x1, y1, x2, y2, color=LINE, width=1.2):
    from pptx.util import Emu
    ln = slide.shapes.add_connector(1, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    ln.line.color.rgb = color
    ln.line.width = Pt(width)
    return ln


def header(slide, kicker, title, sub=None, title_size=29):
    text(slide, M, 0.40, 11.0, 0.26, kicker, size=10, color=EMERALD, bold=True)
    text(slide, M, 0.66, 12.1, 0.72, title, size=title_size, color=FOREST, bold=True, line_spacing=1.0)
    if sub:
        text(slide, M, 1.34, 11.9, 0.34, sub, size=12.2, color=MUTED, line_spacing=1.0)


_footer_counter = 1


def reset_footer():
    global _footer_counter
    _footer_counter = 1


def footer(slide, num=None):
    global _footer_counter
    _footer_counter += 1
    n = _footer_counter
    line(slide, M, 7.10, W - M, 7.10, color=LINE, width=1.0)
    text(slide, M, 7.17, 8.6, 0.22, "SyncHub · Đồ án Phát triển Ứng dụng Web Kinh doanh", size=8.2, color=MUTED)
    text(slide, W - M - 1.2, 7.17, 1.2, 0.22, f"{n:02d} / 20", size=8.2, color=MUTED, align=PP_ALIGN.RIGHT)


def vnd(n):
    return f"{n:,}".replace(",", ".") + "đ"


def notes(slide, body):
    slide.notes_slide.notes_text_frame.text = body


def _rounded_mask(w, h, radius):
    mask = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle((0, 0, w - 1, h - 1), radius=radius, fill=255)
    return mask


def prep_image(name, w_in, h_in, radius=0.10, shadow=True, border=True):
    """Cover-crop a screenshot into a rounded card with a soft shadow."""
    key = f"{name.replace('.png','')}_{w_in:.2f}x{h_in:.2f}_r{radius}_{int(shadow)}.png"
    out = os.path.join(CACHE, key)
    if os.path.exists(out):
        return out
    src = os.path.join(SCREENS, name)
    scale = 200
    Wp, Hp = max(2, int(w_in * scale)), max(2, int(h_in * scale))
    pad = 16 if shadow else 0
    img = Image.open(src).convert("RGB")
    sw, sh = img.size
    target = (Wp - 2 * pad) / (Hp - 2 * pad)
    if sw / sh > target:
        nw = int(sh * target)
        img = img.crop(((sw - nw) // 2, 0, (sw + nw) // 2, sh))
    else:
        nh = int(sw / target)
        img = img.crop((0, (sh - nh) // 2, sw, (sh + nh) // 2))
    img = img.resize((Wp - 2 * pad, Hp - 2 * pad), Image.LANCZOS)

    canvas = Image.new("RGBA", (Wp, Hp), (0, 0, 0, 0))
    if shadow:
        sh_layer = Image.new("RGBA", (Wp, Hp), (0, 0, 0, 0))
        d = ImageDraw.Draw(sh_layer)
        d.rounded_rectangle((pad + 3, pad + 8, Wp - pad + 3, Hp - pad + 8),
                            radius=int(radius * scale), fill=(10, 35, 28, 70))
        sh_layer = sh_layer.filter(ImageFilter.GaussianBlur(7))
        canvas.alpha_composite(sh_layer)
    mask = _rounded_mask(Wp - 2 * pad, Hp - 2 * pad, int(radius * scale))
    canvas.paste(img, (pad, pad), mask)
    if border:
        d = ImageDraw.Draw(canvas)
        d.rounded_rectangle((pad, pad, Wp - pad - 1, Hp - pad - 1),
                            radius=int(radius * scale), outline=(255, 255, 255, 220), width=3)
    canvas.save(out)
    return out


def picture(slide, name, x, y, w, h, radius=0.10, shadow=True, border=True):
    p = prep_image(name, w, h, radius=radius, shadow=shadow, border=border)
    return slide.shapes.add_picture(p, Inches(x), Inches(y), Inches(w), Inches(h))


def phone(slide, x, y, w, h, name):
    rect(slide, x, y, w, h, fill=FOREST, line=None, radius=0.12)
    picture(slide, name, x + 0.055, y + 0.075, w - 0.11, h - 0.15, radius=0.09, shadow=False, border=False)
    rect(slide, x + w / 2 - 0.28, y + 0.035, 0.56, 0.05, fill=FOREST2, line=None, radius=0.5)


def code_block(slide, x, y, w, h, lines, size=9.2):
    rect(slide, x, y, w, h, fill=CODEBG, line=None, radius=0.06)
    text(slide, x + 0.18, y + 0.14, w - 0.36, h - 0.28, lines, size=size, color=RGBColor(0xD8, 0xE8, 0xDF),
         font=MONO, line_spacing=1.16)


def big_number(slide, x, y, w, number, label, color=FOREST, number_size=40, label_size=9.5):
    text(slide, x, y, w, 0.7, number, size=number_size, color=color, bold=True, line_spacing=0.95)
    text(slide, x, y + 0.62, w, 0.3, label, size=label_size, color=MUTED)

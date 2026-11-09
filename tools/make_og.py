# -*- coding: utf-8 -*-
"""Генерирует OG-превью 1200×630 для каждой HTML-страницы в палитре v3 «ГЛУБИНА».
Справа — схематичная изометрическая башня, повторяющая WebGL-сцену hero.
Запуск: python3 tools/make_og.py  (нужны Pillow и DejaVuSans из системы)."""
import re, glob, os, math
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
W, H = 1200, 630
VOID = (5, 8, 15)
INK = (11, 19, 32)
CYAN = (77, 232, 220)
CYAN_D = (34, 191, 196)
AMBER = (255, 180, 92)
FG = (234, 243, 250)
MUT = (168, 188, 208)
GRID = (20, 40, 58)


def wrap(dr, text, f, maxw):
    lines, cur = [], ''
    for w in text.split():
        t = (cur + ' ' + w).strip()
        if dr.textlength(t, font=f) <= maxw:
            cur = t
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def iso_box(dr, cx, cy, w, h, d, fill, edge):
    """Параллелепипед в лёгкой изометрии: передняя грань + верх + бок."""
    dx, dy = d * 0.86, -d * 0.50
    # верхняя грань
    dr.polygon([(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2),
                (cx + w / 2 + dx, cy - h / 2 + dy), (cx - w / 2 + dx, cy - h / 2 + dy)], fill=fill[0])
    # правая грань
    dr.polygon([(cx + w / 2, cy - h / 2), (cx + w / 2, cy + h / 2),
                (cx + w / 2 + dx, cy + h / 2 + dy), (cx + w / 2 + dx, cy - h / 2 + dy)], fill=fill[1])
    # передняя грань
    dr.polygon([(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2),
                (cx + w / 2, cy + h / 2), (cx - w / 2, cy + h / 2)], fill=fill[2])
    # рёбра
    pts = [(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2),
           (cx + w / 2, cy + h / 2), (cx - w / 2, cy + h / 2)]
    for a, b in zip(pts, pts[1:] + pts[:1]):
        dr.line([a, b], fill=edge, width=2)
    dr.line([pts[1], (pts[1][0] + dx, pts[1][1] + dy)], fill=edge, width=2)
    dr.line([(pts[1][0] + dx, pts[1][1] + dy), (pts[2][0] + dx, pts[2][1] + dy)], fill=edge, width=2)
    dr.line([pts[2], (pts[2][0] + dx, pts[2][1] + dy)], fill=edge, width=2)


def tower(dr):
    """Семь смещённых плит + колонны — как в WebGL-сцене."""
    cx, base, w0 = 930, 470, 230
    fills = [(22, 52, 68), (12, 30, 44), (14, 42, 56)]
    for i in range(7):
        cy = base - i * 52
        off = math.sin(i * 0.85) * 13
        w = w0 * (1 - i * 0.045)
        iso_box(dr, cx + off, cy, w, 13, 30, fills,
                CYAN if i % 2 == 0 else (36, 120, 130))
    # колонны
    for sx in (-1, 1):
        x = cx + sx * (w0 / 2 - 6)
        dr.line([(x, base + 10), (x, base - 6 * 52 - 24)], fill=CYAN_D, width=5)
    # ядро и шпиль
    dr.line([(cx, base + 10), (cx, base - 6 * 52 - 44)], fill=AMBER, width=7)
    dr.line([(cx, base - 6 * 52 - 44), (cx, base - 6 * 52 - 88)], fill=AMBER, width=4)
    # основание
    dr.polygon([(cx - 260, base + 32), (cx + 260, base + 32),
                (cx + 330, base + 74), (cx - 190, base + 74)], outline=CYAN_D)


for path in sorted(glob.glob(os.path.join(ROOT, '*.html'))):
    s = open(path, encoding='utf-8').read()
    m = re.search(r'<title>(.*?)</title>', s, re.S)
    title = re.sub(r'\s*\|\s*N7 Construction.*$', '', (m.group(1) if m else path)).strip()
    h = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    h1 = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ',
                re.sub(r'<br\s*/?>', ' ', h.group(1) if h else title))).strip()
    head = h1 if len(h1) <= 58 else title[:58]

    im = Image.new('RGB', (W, H), VOID)
    dr = ImageDraw.Draw(im)
    # свечение двух источников
    glow = Image.new('RGB', (W, H), VOID)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([720, -380, 1520, 400], fill=(12, 48, 60))
    gd.ellipse([-320, 380, 420, 900], fill=(46, 30, 14))
    im = Image.blend(im, glow, .60)
    dr = ImageDraw.Draw(im)
    # инженерная сетка
    for x in range(0, W + 1, 60):
        dr.line([(x, 0), (x, H)], fill=GRID, width=1)
    for y in range(0, H + 1, 60):
        dr.line([(0, y), (W, y)], fill=GRID, width=1)
    # перспективные линии к горизонту справа
    for k in range(-4, 9):
        dr.line([(760 + k * 52, 0), (900 + k * 96, H)], fill=(16, 44, 56), width=1)
    # cyan/amber полосы
    dr.rectangle([0, 0, W, 5], fill=CYAN)
    dr.rectangle([0, H - 5, W, H], fill=CYAN_D)
    dr.rectangle([0, H - 9, 260, H - 5], fill=AMBER)

    tower(dr)

    # логотип
    dr.rectangle([64, 52, 78, 66], fill=CYAN)
    dr.text((92, 44), 'N7', font=ImageFont.truetype(BOLD, 54), fill=FG)
    dr.text((96, 110), 'C O N S T R U C T I O N',
            font=ImageFont.truetype(REG, 18), fill=MUT)
    # заголовок
    f = ImageFont.truetype(BOLD, 54)
    y = 232
    for ln in wrap(dr, head, f, 700)[:3]:
        dr.text((62, y + 2), ln, font=f, fill=(0, 0, 0))
        dr.text((64, y), ln, font=f, fill=FG)
        y += 68
    ly = min(y + 18, 506)
    dr.line([(64, ly), (300, ly)], fill=CYAN, width=4)
    dr.text((64, min(ly + 22, 532)), 'Строительство · Спортивные покрытия · Казахстан и СНГ',
            font=ImageFont.truetype(REG, 22), fill=MUT)
    dr.text((64, 578), '20+ ЛЕТ · 250+ ПРОЕКТОВ', font=ImageFont.truetype(REG, 16), fill=CYAN_D)

    out = os.path.join(ROOT, 'img', 'og', os.path.splitext(os.path.basename(path))[0] + '.webp')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out, 'WEBP', quality=86, method=6)
    print(os.path.relpath(out, ROOT))

# -*- coding: utf-8 -*-
"""Генерирует OG-превью 1200×630 для каждой HTML-страницы в палитре v2 «Сталь».
Запуск: python3 tools/make_og.py  (нужны Pillow и DejaVuSans из системы)."""
import re, glob, os
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
W, H = 1200, 630
GRAPHITE = (11, 16, 22)
AZURE = (78, 168, 255)
STEEL = (234, 240, 245)
SLATE = (159, 178, 197)
GRID = (26, 45, 64)

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

for path in sorted(glob.glob(os.path.join(ROOT, '*.html'))):
    s = open(path, encoding='utf-8').read()
    m = re.search(r'<title>(.*?)</title>', s, re.S)
    title = re.sub(r'\s*\|\s*N7 Construction.*$', '', (m.group(1) if m else path)).strip()
    h = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    h1 = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ',
                re.sub(r'<br\s*/?>', ' ', h.group(1) if h else title))).strip()
    head = h1 if len(h1) <= 58 else title[:58]
    im = Image.new('RGB', (W, H), GRAPHITE)
    dr = ImageDraw.Draw(im)
    # инженерная сетка
    for x in range(0, W + 1, 72):
        dr.line([(x, 0), (x, H)], fill=GRID, width=1)
    for y in range(0, H + 1, 72):
        dr.line([(0, y), (W, y)], fill=GRID, width=1)
    # лазурное свечение справа сверху
    glow = Image.new('RGB', (W, H), GRAPHITE)
    gd = ImageDraw.Draw(glow)
    gd.ellipse([700, -320, 1500, 420], fill=(19, 42, 66))
    im = Image.blend(im, glow, .55)
    dr = ImageDraw.Draw(im)
    dr.line([(980, 0), (620, H)], fill=(30, 74, 120), width=6)
    dr.rectangle([0, 0, W, 6], fill=AZURE)
    dr.rectangle([0, H - 6, W, H], fill=AZURE)
    dr.rectangle([64, 52, 78, 66], fill=AZURE)
    dr.text((92, 46), 'N7', font=ImageFont.truetype(BOLD, 54), fill=AZURE)
    dr.text((96, 112), 'C O N S T R U C T I O N', font=ImageFont.truetype(REG, 19), fill=SLATE)
    f = ImageFont.truetype(BOLD, 56)
    y = 238
    for ln in wrap(dr, head, f, 1000)[:3]:
        dr.text((64, y), ln, font=f, fill=STEEL)
        y += 70
    dr.line([(64, min(y + 18, 500)), (300, min(y + 18, 500))], fill=AZURE, width=4)
    dr.text((64, min(y + 40, 522)), 'Строительство · Спортивные покрытия · Казахстан и СНГ',
            font=ImageFont.truetype(REG, 24), fill=SLATE)
    out = os.path.join(ROOT, 'img', 'og', os.path.splitext(os.path.basename(path))[0] + '.webp')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out, 'WEBP', quality=84, method=6)
    print(os.path.relpath(out, ROOT))

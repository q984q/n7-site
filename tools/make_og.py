# -*- coding: utf-8 -*-
"""Генерирует уникальные OG-превью 1200×630 для каждой HTML-страницы.
Запуск: python3 tools/make_og.py  (нужен Pillow и DejaVuSans из системы)."""
import re, glob, os
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
W, H = 1200, 630
BG, ACC, WHITE, MUT = (20, 21, 22), (242, 194, 0), (236, 236, 232), (169, 170, 164)

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
    h1 = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', h.group(1) if h else title)).strip()
    head = h1 if len(h1) <= 58 else title[:58]
    im = Image.new('RGB', (W, H), BG)
    dr = ImageDraw.Draw(im)
    for x in (620, 760, 900, 1040):
        dr.line([(x + 230, 0), (x - 230, H)], fill=(48, 48, 44), width=6)
    dr.line([(1080, 0), (620, H)], fill=ACC, width=7)
    dr.rectangle([0, 0, W, 8], fill=ACC)
    dr.text((64, 52), 'N7', font=ImageFont.truetype(BOLD, 72), fill=ACC)
    dr.text((70, 136), 'C O N S T R U C T I O N', font=ImageFont.truetype(REG, 20), fill=MUT)
    f = ImageFont.truetype(BOLD, 58)
    y = 250
    for ln in wrap(dr, head, f, 1000)[:3]:
        dr.text((64, y), ln, font=f, fill=WHITE)
        y += 72
    dr.text((64, min(y + 24, 500)), 'Строительство · Спортивные покрытия · Казахстан и СНГ',
            font=ImageFont.truetype(REG, 25), fill=MUT)
    dr.rectangle([0, H - 10, W, H], fill=ACC)
    out = os.path.join(ROOT, 'img', 'og', os.path.splitext(os.path.basename(path))[0] + '.webp')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out, 'WEBP', quality=82, method=6)
    print(os.path.relpath(out, ROOT))

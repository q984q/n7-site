# -*- coding: utf-8 -*-
"""Генерирует OG-превью 1200×630 для каждой страницы в палитре v4 «РЕДАКЦИЯ».

Светлая редакционная сетка, один терракотовый акцент, крупная типографика и
диптих проверенных проектов Almaty Arena и Tamos Space School из img/hero-projects.webp.
Никаких изометрических башен, HUD-статусов и внешних запросов.

Запуск: python3 tools/make_og.py  (нужны Pillow и DejaVuSans из системы).
"""
import glob
import os
import re

from PIL import Image, ImageDraw, ImageEnhance, ImageFont, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
REG = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
W, H = 1200, 630
PAPER = (244, 243, 239)
WHITE = (255, 255, 255)
INK = (16, 24, 32)
MUT = (90, 102, 114)
LINE = (213, 216, 210)
ACCENT = (184, 58, 24)
ACCENT_DARK = (158, 50, 21)


def wrap(dr, text, font, maxw):
    lines, cur = [], ''
    for word in text.split():
        trial = (cur + ' ' + word).strip()
        if dr.textlength(trial, font=font) <= maxw:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


def editorial_photo():
    """Верх диптиха с реальными проектами, приведённый к правой колонке OG."""
    src = Image.open(os.path.join(ROOT, 'img', 'hero-projects.webp')).convert('RGB')
    # Берём верхнюю часть: Almaty Arena, тонкую бумажную разделительную полосу
    # и край второго кадра. Так превью говорит о проектах, а не о «архитектуре вообще».
    src = src.crop((0, 0, src.width, min(1000, src.height)))
    src = ImageOps.fit(src, (460, H), method=Image.LANCZOS, centering=(0.28, 0.0))
    src = ImageEnhance.Color(src).enhance(.92)
    src = ImageEnhance.Contrast(src).enhance(1.02)
    paper = Image.new('RGB', src.size, PAPER)
    return Image.blend(src, paper, .06)


for path in sorted(glob.glob(os.path.join(ROOT, '*.html'))):
    s = open(path, encoding='utf-8').read()
    m = re.search(r'<title>(.*?)</title>', s, re.S)
    title = re.sub(r'\s*\|\s*N7 Construction.*$', '', (m.group(1) if m else path)).strip()
    h = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    h1 = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ',
                re.sub(r'<br\s*/?>', ' ', h.group(1) if h else title))).strip()
    head = h1 if len(h1) <= 64 else title[:64]

    im = Image.new('RGB', (W, H), PAPER)
    dr = ImageDraw.Draw(im)

    # Тонкая редакционная сетка и крупные поля.
    dr.rectangle([0, 0, W, 6], fill=ACCENT)
    for x in range(64, 740, 112):
        dr.line([(x, 0), (x, H)], fill=(232, 231, 226), width=1)
    for y in range(96, H, 112):
        dr.line([(0, y), (740, y)], fill=(232, 231, 226), width=1)
    dr.line([(740, 0), (740, H)], fill=LINE, width=1)
    dr.line([(64, 566), (700, 566)], fill=INK, width=2)
    dr.line([(64, 566), (176, 566)], fill=ACCENT, width=6)

    # Маленькая фирменная рубрика.
    dr.rectangle([64, 52, 78, 66], fill=ACCENT)
    dr.text((92, 42), 'N7', font=ImageFont.truetype(BOLD, 52), fill=INK)
    dr.text((96, 106), 'C O N S T R U C T I O N  /  K Z  ·  C I S',
            font=ImageFont.truetype(REG, 17), fill=MUT)
    dr.text((64, 150), 'СТРОИТЕЛЬСТВО · КАЗАХСТАН И СНГ',
            font=ImageFont.truetype(REG, 17), fill=ACCENT)

    # Заголовок страницы.
    f = ImageFont.truetype(BOLD, 52)
    y = 220
    for ln in wrap(dr, head, f, 610)[:4]:
        dr.text((64, y), ln, font=f, fill=INK)
        y += 66

    # Подпись и короткая доверительная строка.
    dr.text((64, min(y + 18, 500)), 'Строим. Сдаём. Отвечаем.',
            font=ImageFont.truetype(REG, 24), fill=MUT)
    dr.text((64, 586), '20+ ЛЕТ  ·  250+ ПРОЕКТОВ  ·  КАЗАХСТАН И СНГ',
            font=ImageFont.truetype(REG, 17), fill=INK)
    dr.text((548, 586), 'N7 / 2026', font=ImageFont.truetype(REG, 17), fill=ACCENT_DARK)

    # Фотография как главное доказательство: справа, с подписью реальных проектов.
    photo = editorial_photo()
    im.paste(photo, (740, 0))
    dr = ImageDraw.Draw(im)
    dr.rectangle([740, 0, 744, H], fill=ACCENT)
    dr.rectangle([744, 0, 1200, 92], fill=(244, 243, 239))
    dr.text((772, 32), 'ALMATY ARENA / TAMOS SPACE SCHOOL',
            font=ImageFont.truetype(REG, 19), fill=INK)
    dr.text((772, 60), 'N7 CONSTRUCTION',
            font=ImageFont.truetype(REG, 15), fill=ACCENT)
    dr.rectangle([744, H - 70, 1200, H], fill=(244, 243, 239))
    dr.text((772, H - 48), 'Участие в проектах Казахстана и СНГ',
            font=ImageFont.truetype(REG, 16), fill=INK)

    out = os.path.join(ROOT, 'img', 'og', os.path.splitext(os.path.basename(path))[0] + '.webp')
    os.makedirs(os.path.dirname(out), exist_ok=True)
    im.save(out, 'WEBP', quality=88, method=6)
    print(os.path.relpath(out, ROOT))

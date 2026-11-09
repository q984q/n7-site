# -*- coding: utf-8 -*-
"""Обновляет ?v= у локальных CSS/JS во всех HTML после деплоя.

Зачем: GitHub Pages отдаёт статику с HTTP-кэшем. Если HTML обновился, а
style.css / JS остались из кэша браузера, новый HTML встречает старые стили —
интерфейс «разъезжается». Версия в query заставляет браузер скачать свежие файлы.

Использование:  python3 tools/bump_assets.py <метка>
Пример:         python3 tools/bump_assets.py 20261108b
"""
import re, glob, os, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = sys.argv[1] if len(sys.argv) > 1 else None
if not V or not re.fullmatch(r'[A-Za-z0-9._-]+', V):
    raise SystemExit('Укажите метку без пробелов, например: python3 tools/bump_assets.py 20261108b')

n = 0
for path in sorted(glob.glob(os.path.join(ROOT, '*.html'))):
    s = open(path, encoding='utf-8').read()
    o = s
    s = re.sub(r'(<link rel="stylesheet" href="(?:style|fonts|n7-bold)\.css)(\?v=[^"]*)?(")',
               lambda m: m.group(1) + '?v=' + V + m.group(3), s)
    s = re.sub(r'(<script src="[^"?]+\.js)(\?v=[^"]*)?(" defer>)',
               lambda m: m.group(1) + '?v=' + V + m.group(3), s)
    if s != o:
        open(path, 'w', encoding='utf-8').write(s)
        n += 1
print('?v=%s проставлено на %d страницах' % (V, n))

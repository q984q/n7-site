#!/usr/bin/env python3
"""Превью-сервер сайта N7.

Отдаёт только публичные файлы. Внутренние материалы (_source/, tools/, .git/,
исходный архив и служебные .md/.py) не доступны по HTTP — так превью
соответствует тому, что будет выложено на хостинг.

    python3 tools/serve.py
    http://localhost:3000/
"""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BLOCK_PREFIX = ('/.git', '/_source', '/tools', '/n7-site.zip')
BLOCK_EXT = ('.md', '.py')


class Handler(SimpleHTTPRequestHandler):
    def _blocked(self):
        path = self.path.split('?', 1)[0].split('#', 1)[0]
        return path.startswith(BLOCK_PREFIX) or path.endswith(BLOCK_EXT)

    def do_GET(self):
        if self._blocked():
            self.send_error(404, 'Not Found')
            return
        super().do_GET()

    def do_HEAD(self):
        if self._blocked():
            self.send_error(404, 'Not Found')
            return
        super().do_HEAD()


if __name__ == '__main__':
    server = ThreadingHTTPServer(('0.0.0.0', 3000), partial(Handler, directory=ROOT))
    print('Serving', ROOT, 'on http://0.0.0.0:3000')
    server.serve_forever()

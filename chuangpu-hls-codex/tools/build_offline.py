#!/usr/bin/env python3
"""Bundle the local webpage into one offline HTML file; no dependencies."""
import base64
import mimetypes
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def local_file(relative):
    path = (ROOT / relative).resolve()
    if not path.is_relative_to(ROOT) or not path.is_file():
        raise ValueError(f"Missing or invalid local asset: {relative}")
    return path


def build():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    html = re.sub(
        r'<link rel="stylesheet" href="([^"]+)">',
        lambda match: '<style>\n' + local_file(match[1]).read_text(encoding='utf-8') + '\n</style>',
        html,
    )
    html = re.sub(
        r'<script src="([^"]+)"></script>',
        lambda match: '<script>\n' + local_file(match[1]).read_text(encoding='utf-8') + '\n</script>',
        html,
    )
    for relative in set(re.findall(r'assets/images/[^\s\'"<>)}]+', html)):
        path = local_file(relative)
        mime = mimetypes.guess_type(path.name)[0]
        if not mime or not mime.startswith('image/'):
            raise ValueError(f'Unsupported image type: {relative}')
        data = base64.b64encode(path.read_bytes()).decode('ascii')
        html = html.replace(relative, f'data:{mime};base64,{data}')
    if re.search(r'(?:src|href)=[\'"]assets/', html):
        raise ValueError('Unbundled asset reference found')
    output = ROOT / 'dist' / '创谱静力水准检测系统_离线版.html'
    output.parent.mkdir(exist_ok=True)
    output.write_text(html, encoding='utf-8')
    print(f'Built: {output} ({output.stat().st_size:,} bytes)')
    return output


if __name__ == '__main__':
    build()

#!/usr/bin/env python3
"""自动生成 sw.js 里的离线缓存清单（SHELL）。

以前清单是手工写的：加了新 js 或数据文件忘了写进去，离线就会打不开。
现在跑一下这个脚本，清单就按仓库里的实际文件重新生成一遍。

用法：
    python tools/gen_shell.py           # 重新生成（改了代码/加了文件后跑一次）
    python tools/gen_shell.py --check   # 只检查，清单过期就报错（CI 用，提交前也能跑）

GitHub Actions 会在每次推送时跑 --check，清单忘了更新会直接报错提醒。
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SW = os.path.join(ROOT, 'sw.js')

# 固定项：首页、文件清单里必须有根路径（离线时用它顶替找不到的页面）
FIXED = ['./', 'index.html', 'manifest.webmanifest']
# 参与离线缓存的文件类型；data/sets 由 sw.js 按 library.json 动态预缓存，不列在这里
PATTERNS = [
    ('css', r'.*\.css$'),
    ('js', r'.*\.js$'),
    ('icons', r'.*\.png$'),
]
DATA = r'^[^/]+\.json$'   # 只收 data/ 下一层的 json，data/sets/*.json 不列


def collect():
    files = list(FIXED)
    for d, pat in PATTERNS:
        p = os.path.join(ROOT, d)
        if os.path.isdir(p):
            for f in sorted(os.listdir(p)):
                if os.path.isfile(os.path.join(p, f)) and re.match(pat, f, re.I):
                    files.append(f'{d}/{f}')
    p = os.path.join(ROOT, 'data')
    if os.path.isdir(p):
        for f in sorted(os.listdir(p)):
            if os.path.isfile(os.path.join(p, f)) and re.match(DATA, f, re.I):
                files.append(f'data/{f}')
    # 去重并保持顺序
    seen, out = set(), []
    for f in files:
        if f not in seen:
            seen.add(f)
            out.append(f)
    return out


def render(files):
    # 每行 4 个，读起来清楚；生成结果稳定，方便 diff
    lines, cur = [], []
    for f in files:
        cur.append("'" + f + "'")
        if len(cur) == 4:
            lines.append(', '.join(cur))
            cur = []
    if cur:
        lines.append(', '.join(cur))
    body = ',\n  '.join(lines)
    return ('// 下面这份清单由 tools/gen_shell.py 自动生成，不要手改；\n'
            '// 加了新文件后跑一次 python tools/gen_shell.py 即可。\n'
            'const SHELL = [' + body + '];')


def main():
    files = collect()
    src = open(SW, encoding='utf-8').read()
    m = re.search(r'(?:// [^\n]*\n){0,3}const SHELL = \[.*?\];', src, re.S)
    if not m:
        print('sw.js 里找不到 const SHELL = [...];', file=sys.stderr)
        return 2
    new_block = render(files)
    check = '--check' in sys.argv
    if check:
        if m.group(0) != new_block:
            print('❌ sw.js 的离线缓存清单过期了：仓库里现在有 ' + str(len(files)) + ' 个文件要缓存。')
            print('   解决办法：运行 python tools/gen_shell.py 之后再提交。')
            return 1
        print(f'✅ 离线缓存清单是最新的（{len(files)} 个文件）')
        return 0
    if m.group(0) == new_block:
        print(f'清单没有变化（{len(files)} 个文件）')
        return 0
    open(SW, 'w', encoding='utf-8').write(src[:m.start()] + new_block + src[m.end():])
    print(f'✅ 已更新 sw.js 的清单：{len(files)} 个文件')
    for f in files:
        print('  -', f)
    return 0


if __name__ == '__main__':
    sys.exit(main())

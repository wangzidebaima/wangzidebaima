#!/usr/bin/env python3
"""网站文件体检：sw.js 列出的文件、library.json 里的每个题集都必须存在、JSON 必须能读。
本地：python3 tools/check_site.py     GitHub：每次上传后由 .github/workflows/check.yml 自动运行，缺文件时发邮件提醒。"""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
bad = []
def need(path, why=''):
    if not os.path.isfile(os.path.join(ROOT, path)): bad.append(f'缺文件：{path} {why}')
sw = open(os.path.join(ROOT, 'sw.js'), encoding='utf-8').read()
m = re.search(r"const SHELL = \[(.*?)\];", sw, re.S)
shell = re.findall(r"'([^']+\.(?:js|json|css|png|webmanifest|html))'", m.group(1)) if m else []
if not shell: bad.append('sw.js 里找不到文件清单')
for f in shell:
    if f != 'audio/index.json': need(f, '（sw.js 清单里有）')
def load(p):
    try: return json.load(open(os.path.join(ROOT, p), encoding='utf-8'))
    except Exception as e: bad.append(f'读不了 {p}：{e}'); return None
lib = load('data/library.json'); cfg = load('data/config.json')
ids = set()
if lib:
    for s in lib['subjects']:
        ids.add(s['id'])
        for x in s['sets']:
            need('data/' + x['file'], f'（{s["id"]} 的题集）'); d = load('data/' + x['file']) if os.path.isfile(os.path.join(ROOT, 'data/' + x['file'])) else None
if cfg and lib:
    for u in cfg['users']:
        for sid in u.get('subjects', []):
            if sid not in ids: bad.append(f'{u["id"]} 的科目 {sid} 在 library.json 里没有')
for f in shell:
    if f.endswith('.json') and os.path.isfile(os.path.join(ROOT, f)): load(f)
strays = [f for f in os.listdir(ROOT) if re.fullmatch(r'(g[0-9]+[a-z]*-[a-z0-9-]+|cnwords\d|app|views|store|config)\.(json|js)', f)]
if strays: print('提醒（不影响使用，可以删掉）：根目录里有放错位置的文件：' + '、'.join(strays))
print(f'检查了 {len(shell)} 个程序文件和 {sum(len(s["sets"]) for s in lib["subjects"]) if lib else 0} 个题集')
if bad:
    print('发现问题：'); [print(' -', b) for b in bad]; sys.exit(1)
print('✅ 文件齐全')

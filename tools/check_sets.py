#!/usr/bin/env python3
"""题库校验：检查所有题集、词表、配置是否有明显错误。
用法（在 app 目录里）：python3 tools/check_sets.py
有错误时退出码为 1。每次改完内容、打包前由 Claude 自动运行，不需要手动操作。"""
import json, glob, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
errs, warns = [], []
E = lambda m: errs.append(m)
W = lambda m: warns.append(m)
load = lambda p: json.load(open(p, encoding='utf-8'))

def num_ok(a):
    a = str(a).strip().replace('−', '-')
    return bool(re.fullmatch(r'-?\d+(\.\d+)?|-?\d+/\d+|-?\d+又\d+/\d+', a))

lib = load('data/library.json')
cfg = load('data/config.json')
seen_ids = {}
subj_ids = set()
for s in lib['subjects']:
    subj_ids.add(s['id'])
    for m in s['sets']:
        for k in ('id', 'file', 'title', 'subtitle', 'kind'):
            if not m.get(k): E(f"library {s['id']}/{m.get('id')} 缺少 {k}")
        f = 'data/' + m.get('file', '')
        if not os.path.exists(f): E(f"library {m['id']} 文件不存在 {f}"); continue
        d = load(f)
        if d.get('id') != m['id']: E(f"{f} 的 id {d.get('id')} 与 library 的 {m['id']} 不一致")
        if m['kind'] == 'speaking':
            if not d.get('sentences'): E(f'{f} 口语题集没有句子')
            continue
        nq = 0
        for sec in d.get('sections', []):
            for q in sec.get('questions', []):
                nq += 1
                qid = q.get('id'); tag = f"{m['id']}/{qid}"
                if not qid: E(f'{f} 有题缺少 id'); continue
                if qid in seen_ids: E(f'题目 id 重复：{qid}（{seen_ids[qid]} 和 {f}）')
                seen_ids[qid] = f
                if not str(q.get('stem', '')).strip(): E(f'{tag} 题干为空')
                if not (q.get('pts', 1) > 0): E(f'{tag} 分值不对')
                t = q.get('type')
                if t == 'choice':
                    o = q.get('options') or []
                    if len(o) < 2 or len(set(o)) != len(o) or not all(str(x).strip() for x in o): E(f'{tag} 选项少于 2 个、重复或为空')
                    a = q.get('answer')
                    if not (isinstance(a, str) and len(a) == 1 and 'A' <= a <= 'Z' and ord(a) - 65 < len(o)): E(f'{tag} 答案 {a!r} 不在选项范围内')
                elif t == 'tf':
                    if q.get('answer') not in ('T', 'F'): E(f"{tag} 判断题答案应为 T 或 F：{q.get('answer')!r}")
                elif t == 'fill':
                    a = q.get('answers')
                    if not a or not all(isinstance(x, list) and x and all(str(y).strip() for y in x) for x in a): E(f'{tag} 填空答案不完整')
                    elif str(q.get('stem', '')).count('____') != len(a) and '_' in q.get('stem', ''): W(f'{tag} 空格数量和答案数量不一致')
                elif t == 'short':
                    if not q.get('accept'): E(f'{tag} 简答题没有可接受答案')
                elif t == 'math':
                    if not num_ok(q.get('answer', '')): E(f"{tag} 数学题答案无法识别：{q.get('answer')!r}")
                else: E(f'{tag} 未知题型 {t!r}')
        if nq == 0: E(f'{f} 没有题目')
        if m.get('count') not in (None, nq) and m['kind'] in ('math',): W(f"{m['id']} library 里 count={m.get('count')}，实际 {nq} 题")

for u in cfg['users']:
    for s in u['subjects']:
        if s not in subj_ids: E(f"config {u['id']} 引用了不存在的科目 {s}")
r = [x['stars'] for x in cfg['rewards']]
if r != sorted(r) or len(set(r)) != len(r): E('config 奖励星数应从小到大且不重复')
if cfg.get('starGoal', 0) < (r[-1] if r else 0): E('starGoal 小于最大奖励')

ipa = load('data/ipa.json')
for b in ('words7', 'words4'):
    d = load(f'data/{b}.json'); ids = set(); n = 0
    for u in d['units']:
        for it in u.get('items', []) + u.get('sentences', []):
            i = it.get('id'); n += 1
            if not i or i in ids: E(f'{b} id 缺失或重复：{i}')
            ids.add(i)
            if not it.get('en') or not it.get('zh'): E(f'{b} {i} 缺少英文或中文')
        for it in u.get('items', []):
            if it.get('kind') == 'word' and ' ' not in it['en'] and it['en'].lower() not in ipa: W(f"{b} {it['id']} {it['en']} 没有音标")

print(f'题目 {len(seen_ids)} 道，检查完成：{len(errs)} 个错误，{len(warns)} 个提醒')
for w in warns[:20]: print('提醒 ', w)
for e in errs[:40]: print('错误 ', e)
sys.exit(1 if errs else 0)

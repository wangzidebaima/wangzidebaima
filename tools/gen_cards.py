#!/usr/bin/env python3
"""由题集自动整理知识卡草稿（只用题集里已有的解析和填空答案，不新增任何知识）。
用法：python3 tools/gen_cards.py            生成/更新 data/cards/<科目>.json 和 index.json
手写的卡（如 g7poli）不会被覆盖：文件里 "hand": true 的科目整个跳过。
"""
import json, re, difflib, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
SUBJECTS = ['g3sci', 'g4sci', 'g5sci', 'g6sci', 'g7bio', 'g7hist', 'g7geo', 'g8hist', 'g8poli', 'g8phy', 'g8bio', 'g8geo',
            'g9phy', 'g9hist', 'g9poli', 'g9chem']
HAND = {'g7poli'}   # 手写的，不动
MAXP = 9

def clean_why(w):
    w = w.strip()
    m = re.match(r'^([^：:]{1,40})[：:]', w)
    if m and re.search(r'[第课节题《“”「」]', m.group(1)):
        w = w[m.end():].strip()
    w = re.sub(r'正确答案是[“"][^”"]*[”"]。?', '', w).strip()
    w = re.sub(r'^该说法(正确|错误)[。，,]?', '', w).strip()
    w = re.sub(r'^(这|这些|该|此|它|他|她)(是|些|个)', lambda m: '\x00', w)
    if '\x00' in w or len(w) < 10 or '答案' in w:
        return ''
    if not re.search(r'[。！？]$', w):
        w += '。'
    return w

def fill_stmt(q):
    ans = q.get('answers')
    stem = q.get('stem', '')
    if not ans or '_' not in stem:
        return ''
    parts = re.split(r'_{2,}', stem)
    if len(parts) - 1 != len(ans):
        return ''
    out = parts[0]
    for i, a in enumerate(ans):
        out += '【' + a[0] + '】' + parts[i + 1]
    out = out.strip()
    if len(out) < 8:
        return ''
    if not re.search(r'[。！？]$', out):
        out += '。'
    return out

def dedupe(items):
    out = []
    for t in items:
        key = re.sub(r'[【】。，、\s]', '', t)
        dup = False
        for o in out:
            k2 = re.sub(r'[【】。，、\s]', '', o)
            if key in k2 or k2 in key or difflib.SequenceMatcher(None, key, k2).ratio() > 0.8:
                dup = True; break
        if not dup:
            out.append(t)
    return out

def make(d):
    fills, whys, traps = [], [], []
    for s in d.get('sections', []):
        for q in s.get('questions', []):
            t = q.get('type')
            if t == 'fill':
                f = fill_stmt(q)
                if f: fills.append(f)
            w = clean_why(q.get('why', '')) if q.get('why') else ''
            if t == 'tf' and q.get('answer') == 'F':
                if w and len(q.get('stem', '')) <= 40:
                    traps.append('「' + q['stem'].rstrip('。') + '」是错的。' + w)
                continue
            if t in ('choice', 'tf', 'fill') and w:
                whys.append(w)
    pts = dedupe(whys + fills)[:MAXP]
    return pts, dedupe(traps)[:2]

def main():
    idx = {}
    for sid in HAND:
        p = ROOT / 'data' / 'cards' / f'{sid}.json'
        if p.exists():
            idx.update({k: 1 for k in json.loads(p.read_text('utf-8'))})
    total = skipped = 0
    for sid in SUBJECTS:
        cards = {}
        for f in sorted((ROOT / 'data' / 'sets').glob(f'{sid}-*.json'), key=lambda x: int(re.search(r'-(\d+)\.json$', x.name).group(1)) if re.search(r'-(\d+)\.json$', x.name) else 0):
            if not re.fullmatch(rf'{sid}-\d+', f.stem):
                continue
            d = json.loads(f.read_text('utf-8'))
            pts, traps = make(d)
            if len(pts) < 3:
                skipped += 1; print('跳过(要点太少)', f.stem); continue
            cards[d['id']] = {'title': d['title'], 'points': pts, 'traps': traps, 'auto': True}
        (ROOT / 'data' / 'cards' / f'{sid}.json').write_text(json.dumps(cards, ensure_ascii=False, indent=1), 'utf-8')
        idx.update({k: 1 for k in cards}); total += len(cards)
        print(sid, len(cards))
    keys = sorted(idx, key=lambda k: (re.sub(r'-\d+$', '', k), int(k.rsplit('-', 1)[1])))
    (ROOT / 'data' / 'cards' / 'index.json').write_text(json.dumps({'sets': keys}, ensure_ascii=False), 'utf-8')
    print('共', total, '张自动卡，跳过', skipped, '，清单', len(keys))

main()

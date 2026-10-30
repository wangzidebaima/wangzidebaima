# -*- coding: utf-8 -*-
"""按 Claude 回的对照表批量写回选项 / 题干。

对照表格式（每行 7 列，用 | 分隔）：
    题号|题干|选项1|选项2|选项3|选项4|正确位置=N
    题干不改的写 `-`

用法（必须在仓库根跑）：
    python tools/apply_options.py <对照表txt> [--write]
不带 --write 只做 dry-run 校验，不动任何文件。

题集 id = 题号去掉最后一段（g7c-ycjb-a-A3 -> g7c-ycjb-a；g7c-k2-A3 -> g7c-k2）
"""
import json, re, sys
from collections import Counter

TXT = sys.argv[1]
DO_WRITE = '--write' in sys.argv
IDX = {'A': 0, 'B': 1, 'C': 2, 'D': 3}

rows = []
for ln, line in enumerate(open(TXT, encoding='utf-8-sig'), 1):
    line = line.strip()
    if not line:
        continue
    parts = line.split('|')
    assert len(parts) == 7, ('列数不对', ln, line[:60])
    qid = parts[0].strip()
    stem = parts[1].strip()
    opts = [p.strip() for p in parts[2:6]]
    m = re.match(r'^正确位置=(\d)$', parts[6].strip())
    assert m, ('正确位置格式不对', ln, line[:60])
    assert all(opts), ('有空选项', ln, line[:60])
    assert len(set(opts)) == 4, ('选项重复', ln, line[:60])
    rows.append((qid, stem, opts, int(m.group(1))))

print('解析行数: %d' % len(rows))
print('科目分布: %s' % dict(Counter(q.split('-')[0] for q, _, _, _ in rows)))
dups = [k for k, v in Counter(q for q, _, _, _ in rows).items() if v > 1]
print('重复题号: %s' % (dups or '无'))

# ---- 逐题比对 ----
problems, reword, moved, stemchg = [], [], [], []
plan = {}          # setid -> {qid: (opts, answer, stem or None)}
cache = {}
for qid, stem, opts, pos in rows:
    setid = '-'.join(qid.split('-')[:-1])
    if setid not in cache:
        try:
            cache[setid] = json.load(open('data/sets/%s.json' % setid, encoding='utf-8'))
        except FileNotFoundError:
            problems.append((qid, '题集文件不存在: %s' % setid)); continue
    d = cache[setid]
    q = next((qq for sec in d['sections'] for qq in sec['questions'] if qq['id'] == qid), None)
    if q is None:
        problems.append((qid, '题目不存在')); continue
    old = q.get('options')
    if not old or len(old) != 4:
        problems.append((qid, '原选项数异常 %s' % (len(old) if old else 0))); continue
    ai = IDX.get(q.get('answer'))
    if ai is None:
        problems.append((qid, 'answer 异常 %s' % q.get('answer'))); continue
    if ai + 1 != pos:
        moved.append((qid, q['answer'], 'ABCD'[pos - 1]))
    if old[ai] != opts[pos - 1]:
        reword.append((qid, old[ai], opts[pos - 1]))
    if stem != '-':
        stemchg.append((qid, q.get('stem'), stem))
    plan.setdefault(setid, {})[qid] = (opts, 'ABCD'[pos - 1], None if stem == '-' else stem)

print('\n=== 硬性问题: %s' % (problems or '无'))
print('=== 正确项位置发生移动 %d 题（会同步改 answer 键）' % len(moved))
for qid, o, n in moved:
    print('  %s  %s -> %s' % (qid, o, n))
print('=== 正确项措辞被改写 %d 题（需核对 why 有没有引用原句）' % len(reword))
for qid, o, n in reword:
    print('  %s' % qid)
    print('    原: %s' % o)
    print('    新: %s' % n)
print('=== 题干被改写 %d 题' % len(stemchg))
for qid, o, n in stemchg:
    print('  %s' % qid)
    print('    原: %s' % o)
    print('    新: %s' % n)

# ---- 长度校验 ----
def stat(opts, ans):
    c = len(opts[IDX[ans]])
    mx = max(len(o) for i, o in enumerate(opts) if i != IDX[ans])
    return c - mx, max(len(o) for o in opts) - min(len(o) for o in opts)

bad = []
for qid, _, opts, pos in rows:
    g, sp = stat(opts, 'ABCD'[pos - 1])
    if g > 4 or sp > 4:
        bad.append((qid, g, sp, [len(o) for o in opts]))
print('\n=== 长度检查（目标 gap<=4 且四项字数差<=4）===')
if bad:
    print('不达标 %d 题:' % len(bad))
    for qid, g, sp, ls in bad:
        print('  %s gap=%d 字数差=%d 长度=%s' % (qid, g, sp, ls))
else:
    print('全部达标')

if not DO_WRITE:
    print('\n[dry-run] 未写任何文件。确认无误后加 --write 执行。')
    sys.exit(0)
if problems:
    print('\n存在硬性问题，拒绝写回。')
    sys.exit(1)

for setid, mapping in plan.items():
    path = 'data/sets/%s.json' % setid
    raw = open(path, encoding='utf-8').read()
    d = json.loads(raw)
    hit = 0
    for sec in d['sections']:
        for q in sec['questions']:
            if q['id'] in mapping:
                opts, ans, stem = mapping[q['id']]
                before = dict(q)
                q['options'] = opts
                q['answer'] = ans
                if stem is not None:
                    q['stem'] = stem
                assert set(before.keys()) == set(q.keys()), q['id']
                for k in before:
                    if k not in ('options', 'answer', 'stem'):
                        assert before[k] == q[k], (q['id'], k)
                hit += 1
    assert hit == len(mapping), (setid, hit, len(mapping))
    out = json.dumps(d, ensure_ascii=False, indent=1) + ('\n' if raw.endswith('\n') else '')
    open(path, 'w', encoding='utf-8', newline='\n').write(out)
    d2 = json.loads(open(path, encoding='utf-8').read())
    for sec in d2['sections']:
        for q in sec['questions']:
            if q['id'] in mapping:
                opts, ans, stem = mapping[q['id']]
                assert q['options'] == opts and q['answer'] == ans, q['id']
                if stem is not None:
                    assert q['stem'] == stem, q['id']
    print('写回+回读ok: %s  %d 题' % (setid, len(mapping)))

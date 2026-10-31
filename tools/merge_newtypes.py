# -*- coding: utf-8 -*-
"""把 Claude 交回的「第二批新题型」json 合并进对应题集。
用法（必须在仓库根跑）：
  python tools/merge_newtypes.py <交付json>            # 只检查，不写
  python tools/merge_newtypes.py <交付json> --write    # 真写
幂等：同一个题号重复跑不会追加第二份。
"""
import json, io, os, sys, collections

SRC = sys.argv[1]
WRITE = '--write' in sys.argv
SEC = {'order': ('D', '四、排一排'), 'self': ('E', '五、说一说')}

deliv = json.loads(io.open(SRC, encoding='utf-8-sig').read())
err, warn, add, skip = [], [], collections.Counter(), []

for sid, qs in deliv.items():
    path = os.path.join('data', 'sets', sid + '.json')
    if not os.path.exists(path):
        err.append('题集不存在: %s' % sid); continue
    for q in qs:
        qid, t = q.get('id'), q.get('type')
        if not qid or not str(qid).startswith(sid + '-'):
            err.append('%s: 题号不以 setid 开头 -> %r' % (sid, qid)); continue
        if t == 'order':
            items = q.get('items') or []
            if len(items) < 4: err.append('%s: 排序题不足 4 项' % qid)
            if len(set(items)) != len(items): err.append('%s: 排序项有重复' % qid)
            if any(not str(x).strip() for x in items): err.append('%s: 排序项有空值' % qid)
            if 'answer' in q: err.append('%s: 排序题不该写 answer' % qid)
        elif t == 'self':
            if not (q.get('ref') or q.get('points')): err.append('%s: 自评题缺 ref/points' % qid)
        else:
            err.append('%s: 未知题型 %r' % (qid, t))
        if not q.get('stem'): err.append('%s: 缺题干' % qid)
        if not q.get('pts'): warn.append('%s: 没有 pts' % qid)

    if err and not WRITE: continue
    setd = json.loads(io.open(path, encoding='utf-8').read())
    have = {qq['id'] for s in setd.get('sections', []) for qq in s.get('questions', [])}
    for q in qs:
        qid, t = q.get('id'), q.get('type')
        if not str(qid).startswith(sid + '-'): continue
        secid, sectitle = SEC.get(t, ('D', '四、排一排'))
        sec = next((s for s in setd['sections'] if s.get('id') == secid), None)
        if sec is None:
            sec = {'id': secid, 'title': sectitle, 'questions': []}
            setd['sections'].append(sec)
        if qid in have:
            skip.append(qid); continue
        sec['questions'].append(q); add[t] += 1
    if WRITE:
        io.open(path, 'w', encoding='utf-8', newline='\n').write(
            json.dumps(setd, ensure_ascii=False, indent=1) + '\n')

print('交付题集 %d 个，题 %d 道' % (len(deliv), sum(len(v) for v in deliv.values())))
print('本次新增: 排序题 %d 道，自评题 %d 道' % (add['order'], add['self']))
if skip: print('已存在跳过: %d 道 %s' % (len(skip), skip[:5]))
if warn: print('提醒: %s' % warn[:5])
if err:
    print('\n发现 %d 个问题：' % len(err))
    for e in err[:20]: print('  x', e)
else:
    print('格式检查: 全部通过')
print('\n模式: %s' % ('已写入' if WRITE else '只检查（加 --write 才写）'))

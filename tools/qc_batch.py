# -*- coding: utf-8 -*-
"""批质检：对某一前缀的题集做结构与内容体检。用法 python tools/qc_batch.py g7geo"""
import json, glob, re, collections, io, os, sys

PREFIX = sys.argv[1] if len(sys.argv) > 1 else 'g7bio'
L = json.load(io.open('data/library.json', encoding='utf-8'))
UNITS = set(L['unitNames'])
files = sorted(glob.glob('data/sets/%s-*.json' % PREFIX),
               key=lambda x: int(re.search(r'(\d+)\.json$', x).group(1)))

bad = collections.OrderedDict()


def add(k, v):
    bad.setdefault(k, []).append(v)


stems = collections.defaultdict(list)
ansdist = collections.Counter()
tfdist = collections.Counter()
whylen = []
total = 0

for f in files:
    sid = os.path.basename(f)[:-5]
    d = json.load(io.open(f, encoding='utf-8'))
    if d.get('id') != sid:
        add('id与文件名不一致', f)
    if d.get('unit') not in UNITS:
        add('unit不在字典', sid + ' ' + str(d.get('unit')))
    if d.get('kind') not in ('cn', 'reading'):
        add('kind异常', sid + ' ' + str(d.get('kind')))
    if not d.get('title') or not d.get('subtitle'):
        add('缺title/subtitle', sid)
    secs = d.get('sections', [])
    if len(secs) != 3:
        add('section数不是3', sid)
    cnt = collections.Counter()
    for s in secs:
        for q in s.get('questions', []):
            total += 1
            cnt[q.get('type')] += 1
            qid = q.get('id', '')
            if not qid.startswith(sid + '-'):
                add('题id前缀不对', qid)
            stem = (q.get('stem') or '').strip()
            if not stem:
                add('空题干', qid)
            if re.search(r'下图|如图|上图|下表|表中|图中', stem + (q.get('why') or '')):
                add('提到图或表', qid)
            stems[re.sub(r'[，。、；：？！\s“”"\'()]', '', stem)].append(qid)
            why = (q.get('why') or '').strip()
            whylen.append((qid, len(why)))
            if len(why) < 15 or len(why) > 60:
                add('解析字数异常', '%s(%d字)' % (qid, len(why)))
            if re.search(r'(?<![\u4e00-\u9fa5])[ABCD](?![\u4e00-\u9fa5])', why):
                add('解析出现裸字母', qid + ' :: ' + why)
            if re.search(r'选\s*[ABCD]|第[一二三四]个选项|选项[ABCD]', why):
                add('解析指选项', qid)
            if re.match(r'^第\d+课', why):
                add('解析带第N课前缀', qid)
            t = q.get('type')
            if t == 'choice':
                o = q.get('options') or []
                if len(o) < 4:
                    add('选项不足4个', qid)
                if len(set(o)) != len(o):
                    add('选项重复', qid)
                a = q.get('answer')
                if not (isinstance(a, str) and len(a) == 1 and 'A' <= a and ord(a) - 65 < len(o)):
                    add('答案越界', qid)
                else:
                    ansdist[a] += 1
                    if o and len(o[ord(a) - 65]) >= max([len(x) for i, x in enumerate(o) if i != ord(a) - 65] + [0]) + 6:
                        add('正确答案明显偏长(暗示)', qid)
            elif t == 'tf':
                if q.get('answer') not in ('T', 'F'):
                    add('判断答案异常', qid)
                tfdist[q.get('answer')] += 1
                if q.get('pts') != 1:
                    add('判断题分值不是1', qid)
            elif t == 'fill':
                ans = q.get('answers')
                if not isinstance(ans, list) or not ans or not all(
                        isinstance(x, list) and x and all(isinstance(y, str) and y.strip() for y in x) for x in ans):
                    add('填空answers结构错', qid + ' ' + json.dumps(ans, ensure_ascii=False)[:80])
                else:
                    n = len(re.findall(r'_{2,}', stem))
                    if n and n != len(ans):
                        add('填空下划线数与答案数不符', '%s 空%d/答案%d' % (qid, n, len(ans)))
            else:
                add('未知题型', qid + ' ' + str(t))
    if dict(cnt) != collections.Counter({'choice': 5, 'tf': 3, 'fill': 2}):
        add('题型配比不对', sid + ' ' + str(dict(cnt)))

print('== %s ==' % PREFIX)
print('文件 %d 个，题目总数 %d' % (len(files), total))
print('答案分布', dict(ansdist), '| 判断', dict(tfdist))
wl = [n for _, n in whylen]
print('解析字数 min%d max%d 均值%.1f' % (min(wl), max(wl), sum(wl) / len(wl)))
dup = [(k, v) for k, v in stems.items() if len(v) > 1]
print('重复题干', len(dup))
for k, v in dup[:12]:
    print('    ', v, k[:60])
print('=' * 40)
for k, v in bad.items():
    print('[%d] %s' % (len(v), k))
    for x in v[:8]:
        print('    ', x)
    if len(v) > 8:
        print('     ...共%d条' % len(v))
if not bad:
    print('无问题')

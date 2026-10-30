# -*- coding: utf-8 -*-
"""书山小路 · 内容体检

扫 data/ 下所有内容，把肉眼扫不出来的问题一次性列干净。
用法：python tools/check_data.py
退出码：0 = 干净，1 = 有问题（可以直接挂到 CI 上）

只体检【形态】，不判断【对错】——"《观沧海》作者是曹操"对不对，脚本管不了。
"""
import json, glob, os, re, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load = lambda p: json.load(open(p, encoding='utf-8'))

KINDS = {'essay', 'reading', 'cn', 'listening', 'speaking', 'math'}
BAD_WHY = re.compile(r'选\s*[ABCD]|第\s*[一二三四五六七八九]?\s*(?:个)?选项|[ABCD]\s*项')
# 裸序数词：不自动判错（容易误伤），列出来人工复核。
# 历史豁免：Command 022 / 026 里的「第二个」不是指选项。
NUM_WHY = re.compile(r'第\s*[一二三四五六七八九十]\s*个')

ERR = collections.Counter()
REVIEW = collections.defaultdict(list)
BAD = collections.defaultdict(list)


def main():
    os.chdir(ROOT)
    lib = load('data/library.json')
    files = sorted(glob.glob('data/sets/*.json'))
    print('题集文件 %d 个' % len(files))

    # ---------- 1. 三处 id 是否一致 ----------
    libids = set()
    for sb in lib['subjects']:
        if sb['id'] not in KINDS and False:
            pass
        for s in sb['sets']:
            libids.add(s['id'])
            p = 'data/' + s['file']
            if not os.path.exists(p):
                ERR['library 登记了不存在的题集文件'] += 1
                BAD['library 登记了不存在的题集文件'].append(s['file'])
                continue
            real = load(p)
            if real.get('id') != s['id']:
                ERR['三处 id 不一致'] += 1
                BAD['三处 id 不一致'].append('%s vs %s' % (s['id'], real.get('id')))
            if real.get('kind') != s.get('kind'):
                ERR['kind 不一致'] += 1
                BAD['kind 不一致'].append('%s: %s vs %s' % (s['id'], s.get('kind'), real.get('kind')))
            if s.get('kind') == 'speaking':
                continue          # 口语题集装的是句子和打卡计划，本来就没有 questions
            n = sum(len(x.get('questions') or []) for x in real.get('sections', []))
            if s.get('count') is not None and n != s['count']:
                ERR['标称题数与实际不符'] += 1
                BAD['标称题数与实际不符'].append('%s: 标%d 实%d' % (s['id'], s['count'], n))

    for f in files:
        d = load(f)
        base = os.path.basename(f)[:-5]
        if d.get('id') != base:
            ERR['文件名与内部 id 不一致'] += 1
            BAD['文件名与内部 id 不一致'].append('%s != %s' % (base, d.get('id')))
        if d.get('kind') not in KINDS:
            ERR['kind 不是允许的 6 个值'] += 1
            BAD['kind 不是允许的 6 个值'].append('%s: %r' % (d['id'], d.get('kind')))

    orphan = sorted({os.path.basename(f)[:-5] for f in files} - libids)
    if orphan:
        ERR['未被登记引用的孤儿题集'] = len(orphan)
        BAD['孤儿题集'] = orphan

    # ---------- 2. 逐题扫描 ----------
    qids = collections.Counter()
    units = collections.Counter()
    nq = 0
    for f in files:
        d = load(f)
        sid = d['id']
        if d.get('unit'):
            units[d['unit']] += 1
        for sec in d.get('sections', []):
            for q in (sec.get('questions') or []):
                nq += 1
                qid, t = q.get('id'), q.get('type')
                if qid:
                    qids[qid] += 1
                    # 题号必须「题集 id + '-' + section id + 序号」，例如 g7hist-1-A1。
                    # 契约示例里出现过 g7hist-u1-a-A1 这种写法，照抄会让题号对不上题集。
                    if not qid.startswith(sid + '-'):
                        ERR['题号前缀和题集 id 不一致'] += 1
                        BAD['题号前缀和题集 id 不一致'].append('%s/%s 应为 %s-…' % (sid, qid, sid))
                if not q.get('stem'):
                    ERR['题目缺题干'] += 1
                    BAD['题目缺题干'].append('%s/%s' % (sid, qid))
                if q.get('pts') is None:
                    ERR['题目缺分值'] += 1
                    BAD['题目缺分值'].append('%s/%s' % (sid, qid))
                why = (q.get('why') or '').strip()

                if t == 'choice':
                    ops = q.get('options') or []
                    a = q.get('answer')
                    if len(ops) < 2:
                        ERR['选择题选项少于 2 个'] += 1
                        BAD['选择题选项少于 2 个'].append('%s/%s' % (sid, qid))
                    if len(set(ops)) != len(ops):
                        ERR['选择题有重复选项'] += 1
                        BAD['选择题有重复选项'].append('%s/%s' % (sid, qid))
                    if not (isinstance(a, str) and len(a) == 1 and a in 'ABCDEFGH'):
                        ERR['选择题答案不是单个字母'] += 1
                        BAD['选择题答案不是单个字母'].append('%s/%s answer=%r' % (sid, qid, a))
                    elif ord(a) - 65 >= len(ops):
                        ERR['选择题答案下标越界'] += 1
                        BAD['选择题答案下标越界'].append('%s/%s 答案%s 但只有%d项' % (sid, qid, a, len(ops)))
                    if BAD_WHY.search(why):
                        ERR['解析里提到了选项位置（会被打乱）'] += 1
                        BAD['解析里提到了选项位置（会被打乱）'].append('%s/%s %s' % (sid, qid, why[:40]))
                    if NUM_WHY.search(why):
                        REVIEW['解析里有裸序数词，请确认是不是在指选项'].append('%s/%s 「%s」' % (sid, qid, why[:60]))
                    if len(why) <= 6:
                        ERR['选择题解析过短（只写了位置）'] += 1
                        BAD['选择题解析过短（只写了位置）'].append('%s/%s 「%s」' % (sid, qid, why))

                elif t == 'tf':
                    if q.get('answer') not in ('T', 'F'):
                        ERR['判断题答案不是 T/F'] += 1
                        BAD['判断题答案不是 T/F'].append('%s/%s answer=%r' % (sid, qid, q.get('answer')))

                elif t == 'fill':
                    stem = q.get('stem') or ''
                    holes = len(re.findall(r'_{4,}|（\s*）|\(\s*\)|＿', stem))
                    ans = q.get('answers') or []
                    if holes != len(ans):
                        ERR['填空题空位数与答案组数不符'] += 1
                        BAD['填空题空位数与答案组数不符'].append('%s/%s 空%d答%d' % (sid, qid, holes, len(ans)))
                    for grp in ans:
                        if not grp or any(not str(x).strip() for x in grp):
                            ERR['填空题有空答案'] += 1
                            BAD['填空题有空答案'].append('%s/%s' % (sid, qid))

                elif t == 'order':
                    items = q.get('items') or []
                    if len(items) < 4:
                        ERR['排序题少于 4 项'] += 1
                        BAD['排序题少于 4 项'].append('%s/%s 只有%d项' % (sid, qid, len(items)))
                    if len(set(map(str, items))) != len(items):
                        ERR['排序题有重复项'] += 1
                        BAD['排序题有重复项'].append('%s/%s %r' % (sid, qid, items))
                    if any(not str(x).strip() for x in items):
                        ERR['排序题有空项'] += 1
                        BAD['排序题有空项'].append('%s/%s' % (sid, qid))
                    # 写了 answer 最危险：出题的人会以为顺序在这里，其实是 items 的顺序
                    if 'answer' in q:
                        ERR['排序题写了 answer 字段（顺序由 items 决定）'] += 1
                        BAD['排序题写了 answer 字段（顺序由 items 决定）'].append('%s/%s answer=%r' % (sid, qid, q.get('answer')))
                    if BAD_WHY.search(why):
                        ERR['解析里提到了选项位置（会被打乱）'] += 1
                        BAD['解析里提到了选项位置（会被打乱）'].append('%s/%s %s' % (sid, qid, why[:40]))

                elif t == 'self':
                    if not (str(q.get('ref') or '').strip() or (q.get('points') or [])):
                        ERR['简答自评没有参考答案'] += 1
                        BAD['简答自评没有参考答案'].append('%s/%s' % (sid, qid))

                elif t not in ('math',):
                    ERR['未知题型'] += 1
                    BAD['未知题型'].append('%s/%s type=%r' % (sid, qid, t))

    dup = [k for k, v in qids.items() if v > 1]
    if dup:
        ERR['题目 id 重复'] = len(dup)
        BAD['题目 id 重复'] = dup

    # ---------- 3. unitNames ----------
    names = lib.get('unitNames') or {}
    for u in units:
        if u not in names:
            ERR['题集用了没登记的单元代号'] += 1
            BAD['题集用了没登记的单元代号'].append(u)

    # ---------- 4. 页面 🎧 按钮 vs 卷子里实际印的二维码 ----------
    # 真相源是卷子本身。先解码 docx 拿到真实指向，再和 js/grades.js 的 PAPER_HEARS 对账
    src = open('js/grades.js', encoding='utf-8').read()
    blk = re.search(r'PAPER_HEARS\s*=\s*\{(.*?)\};', src, re.S)
    table = {}
    if blk:
        for k, v in re.findall(r"'([a-z0-9\-]+)':\s*\[([^\]]*)\]", blk.group(1)):
            table[k] = re.findall(r"'([^']+)'", v)
    nhear = sum(len(v) for v in table.values())
    for k, ids in sorted(table.items()):
        for i in ids:
            if not os.path.exists('data/sets/%s.json' % i):
                ERR['页面耳机按钮指向的听力题集不存在'] += 1
                BAD['页面耳机按钮指向的听力题集不存在'].append('%s -> %s' % (k, i))
    try:
        import zipfile, io
        from pyzbar.pyzbar import decode
        from PIL import Image
    except ImportError:
        print('\n（没装 pyzbar，跳过「页面按钮 vs 卷子二维码」对账）')
    else:
        for p in sorted(glob.glob('papers/g*-eng-*.docx')):
            key = os.path.basename(p)[:-5]
            z = zipfile.ZipFile(p)
            got = []
            for n in [x for x in z.namelist() if x.startswith('word/media/')]:
                try:
                    for q in decode(Image.open(io.BytesIO(z.read(n)))):
                        m = re.search(r'#/hear/([A-Za-z0-9\-]+)', q.data.decode('utf-8', 'ignore'))
                        if m:
                            got.append(m.group(1))
                except Exception:
                    pass
            real = sorted(got)
            if key not in table:
                ERR['卷子在但页面没有对应的耳机按钮'] += 1
                BAD['卷子在但页面没有对应的耳机按钮'].append(key)
            elif sorted(table[key]) != real:
                ERR['页面耳机按钮与卷子里印的二维码不一致'] += 1
                BAD['页面耳机按钮与卷子里印的二维码不一致'].append(
                    '%s 页面=%s 卷子=%s' % (key, table[key], real))

    # ---------- 报告 ----------
    print('题目总数 %d 道，题 id 唯一 %d 个' % (nq, len(qids)))
    print('英语卷听力引用 %d 处' % nhear)
    print('\n' + '=' * 46)
    if not ERR:
        print('内容体检通过，没发现问题')
    for k, v in ERR.most_common():
        print('\n[%d] %s' % (v, k))
        for x in BAD[k][:8]:
            print('    · %s' % x)
        if len(BAD[k]) > 8:
            print('    …… 还有 %d 条' % (len(BAD[k]) - 8))
    if REVIEW:
        print('\n' + '=' * 46)
        print('以下不判错，只列出来给人工看一眼（正则判断内容容易误伤）：')
        for k, xs in REVIEW.items():
            print('\n[待确认 %d] %s' % (len(xs), k))
            for x in xs[:8]:
                print('    · %s' % x)
    print('\n共 %d 类问题' % len(ERR))
    return 1 if ERR else 0


if __name__ == '__main__':
    sys.exit(main())

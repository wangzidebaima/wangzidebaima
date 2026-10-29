# -*- coding: utf-8 -*-
"""把改好的解析（why）按题号写回题集文件

用法：
    python tools/apply_why.py 新解析.txt           预演，只检查不写文件
    python tools/apply_why.py 新解析.txt --write   检查通过才真的写回

输入文件每行一条：  题号|新解析
    g4c-e10-A1|第一段：蚂蚁们排着队，把一块饼干屑搬回家。
    g4c-e10-A2|结尾：大家一起出力把饼干搬回了家，这就是团结的力量。

题号必须原样照抄（题 id 全局唯一，就靠它定位）。
"""
import json, glob, os, re, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BAD = re.compile(r'选\s*[ABCD]|第\s*[一二三四五六七八九十]?\s*(?:个)?选项|[ABCD]\s*项')
POS_ONLY = re.compile(r'^第?\s*[一二三四五六七八九十\d]+\s*[段节句]\W*$|^[开结尾]\w*[。.]?$')


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    write = '--write' in sys.argv
    src = [a for a in sys.argv[1:] if not a.startswith('--')][0]

    # ---------- 读输入 ----------
    rows, seen = [], collections.Counter()
    for ln, line in enumerate(open(src, encoding='utf-8'), 1):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if '|' not in line:
            print('第 %d 行没有竖线分隔：%s' % (ln, line[:50]))
            return 2
        qid, why = line.split('|', 1)
        qid, why = qid.strip(), why.strip()
        seen[qid] += 1
        rows.append((ln, qid, why))
    dup = [k for k, v in seen.items() if v > 1]
    if dup:
        print('输入里有重复题号 %d 个：%s' % (len(dup), dup[:5]))
        return 2
    print('读到 %d 条解析' % len(rows))

    # ---------- 建立 题 id → 题 的索引 ----------
    os.chdir(ROOT)
    idx, files = {}, {}
    for f in sorted(glob.glob('data/sets/*.json')):
        d = json.load(open(f, encoding='utf-8'))
        files[f] = d
        for sec in d.get('sections', []):
            for q in (sec.get('questions') or []):
                if q.get('id'):
                    idx[q['id']] = q

    # ---------- 逐条检查 ----------
    miss, short, badpos, toolong = [], [], [], []
    ok = 0
    for ln, qid, why in rows:
        if qid not in idx:
            miss.append('%s（第%d行）' % (qid, ln))
            continue
        if not why:
            short.append('%s 内容为空' % qid)
            continue
        if BAD.search(why):
            badpos.append('%s 「%s」' % (qid, why[:40]))
        if len(why) < 8:
            short.append('%s 「%s」只有 %d 字' % (qid, why[:30], len(why)))
        if len(why) > 120:
            toolong.append('%s %d 字' % (qid, len(why)))
        if POS_ONLY.match(why):
            short.append('%s 「%s」还是只写了位置' % (qid, why[:30]))
        ok += 1

    print('\n' + '=' * 46)
    print('能定位到题目的：%d / %d' % (ok, len(rows)))
    if miss:
        print('\n[必须修] 题号在 415 个题集里找不到：%d 条' % len(miss))
        for x in miss[:10]:
            print('    · %s' % x)
        if len(miss) > 10:
            print('    …… 还有 %d 条' % (len(miss) - 10))
    if badpos:
        print('\n[必须修] 解析里提到了选项位置（选项会被打乱）：%d 条' % len(badpos))
        for x in badpos[:10]:
            print('    · %s' % x)
    if short:
        print('\n[建议修] 解析太短或还是只写了位置：%d 条' % len(short))
        for x in short[:10]:
            print('    · %s' % x)
    if toolong:
        print('\n[建议修] 解析超过 120 字：%d 条' % len(toolong))
        for x in toolong[:5]:
            print('    · %s' % x)

    blocking = miss + badpos
    if blocking:
        print('\n有必须修的问题，一条都没写。修好再跑一次。')
        return 1
    if not write:
        print('\n预演通过。要真的写回就加 --write')
        return 0

    # ---------- 写回 ----------
    for _, qid, why in rows:
        idx[qid]['why'] = why
    touched = set()
    for _, qid, _ in rows:
        for f, d in files.items():
            for sec in d.get('sections', []):
                for q in (sec.get('questions') or []):
                    if q.get('id') == qid:
                        touched.add(f)
    for f in sorted(touched):
        with open(f, 'w', encoding='utf-8') as fp:
            json.dump(files[f], fp, ensure_ascii=False, indent=1)
            fp.write('\n')
    print('\n已写回 %d 条解析，改动 %d 个文件' % (len(rows), len(touched)))
    print('接着跑 python tools/check_data.py 复查一遍')
    return 0


if __name__ == '__main__':
    sys.exit(main())

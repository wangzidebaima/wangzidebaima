#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
把一批新题集登记进 data/library.json 的 subjects 里。

为什么不手改：library.json 有 8 万字符、10 个科目、几百套题，手改极易漏逗号、
破坏缩进。这个脚本只做「在 subjects 数组末尾精确插入/替换一条」，其余一个字节不动。

用法：
    python tools/register_sets.py g4sci --title 科学练习 --icon 🔬 --desc 按课本的课，每课一练
    python tools/register_sets.py g4sci --title 科学练习 --icon 🔬 --desc xxx --dry-run

它会扫 data/sets/<科目id>-*.json，按课号排序，从每个文件里读
id / title / subtitle / unit / kind，并【按实际题目数】算 count（不写死数字，
免得 App 上显示「共 9 题」而实际是 8 题）。

已存在同 id 的科目会被整体替换，可以反复跑。
"""
import argparse
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SETS = os.path.join(ROOT, 'data', 'sets')
LIB = os.path.join(ROOT, 'data', 'library.json')


def natural_key(name):
    """g4sci-2 排在 g4sci-10 前面，不能按字符串排。"""
    return [int(s) if s.isdigit() else s for s in re.split(r'(\d+)', name)]


def count_questions(path):
    """数这套题里真正有几道题——以 sections 里的 questions 为准。"""
    try:
        with open(path, encoding='utf-8') as f:
            d = json.load(f)
    except Exception as e:
        raise SystemExit('  ✗ 读不了 %s：%s' % (os.path.basename(path), e))
    n = 0
    for sec in (d.get('sections') or []):
        n += len(sec.get('questions') or [])
    return d, n


def build_entry(sid, title, icon, desc):
    files = sorted(
        [f for f in os.listdir(SETS)
         if f.startswith(sid + '-') and f.endswith('.json')],
        key=natural_key,
    )
    if not files:
        raise SystemExit('✗ data/sets/ 下找不到 %s-*.json，先确认题集文件已经放好' % sid)

    sets = []
    total = 0
    for fn in files:
        d, n = count_questions(os.path.join(SETS, fn))
        if d.get('id') != fn[:-5]:
            print('  ! %s 内部 id 是 %s，和文件名不一致，按文件名登记' % (fn, d.get('id')))
        item = {
            'id': fn[:-5],
            'file': 'sets/' + fn[:-5] + '.json',
            'title': d.get('title') or fn[:-5],
        }
        if d.get('subtitle'):
            item['subtitle'] = d['subtitle']
        item['kind'] = d.get('kind') or 'cn'
        if d.get('unit'):
            item['unit'] = d['unit']
        item['count'] = n
        total += n
        sets.append(item)
    return {
        'id': sid,
        'title': title,
        'icon': icon,
        'desc': desc,
        'sets': sets,
    }, total, len(files)


def indent_block(obj):
    """subjects 数组元素比顶层深两级，json.dumps 出的每行再补两个空格。"""
    body = json.dumps(obj, ensure_ascii=False, indent=1)
    return '\n'.join('  ' + ln for ln in body.split('\n')), body


def find_subject_array_end(raw):
    """做字符串感知的括号配对，找到 subjects 数组那个 ] 的位置。"""
    start = raw.index('[' , raw.index('"subjects"'))
    i, depth, in_str, esc = start, 0, False, False
    while i < len(raw):
        c = raw[i]
        if in_str:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == '"':
                in_str = False
        else:
            if c == '"':
                in_str = True
            elif c in '[{':
                depth += 1
            elif c in ']}':
                depth -= 1
                if depth == 0:
                    return i, start
        i += 1
    raise SystemExit('✗ library.json 的 subjects 数组没闭合，文件可能坏了')


def find_member(raw, arr_start, arr_end, key):
    """在 subjects 数组里找 id == key 的那一项的 [起, 止)。"""
    i, depth, in_str, esc = arr_start, 0, False, False
    begin = None
    while i <= arr_end:
        c = raw[i]
        if in_str:
            if esc:
                esc = False
            elif c == '\\':
                esc = True
            elif c == '"':
                in_str = False
        else:
            if c == '"':
                in_str = True
            elif c == '{':
                depth += 1
                if depth == 1:
                    begin = i
            elif c == '}':
                depth -= 1
                if depth == 0 and begin is not None:
                    if '"id": "%s"' % key in raw[begin:i] or '"id":"%s"' % key in raw[begin:i]:
                        return begin, i + 1
        i += 1
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sid', help='科目 id，如 g4sci')
    ap.add_argument('--title', required=True)
    ap.add_argument('--icon', required=True)
    ap.add_argument('--desc', required=True)
    ap.add_argument('--dry-run', action='store_true', help='只打印要写进去的内容，不落盘')
    a = ap.parse_args()

    entry, total, nfiles = build_entry(a.sid, a.title, a.icon, a.desc)
    print('扫到 %d 个题集文件，合计 %d 道题' % (nfiles, total))
    for s in entry['sets']:
        print('   %-14s %-22s unit=%-5s count=%d' % (s['id'], s['title'], s.get('unit') or '-', s['count']))

    # unit 必须在 unitNames 里登记过，否则页面上那一栏显示不出来
    bak = open(LIB, encoding='utf-8').read()
    lib = json.loads(bak)
    missing = sorted({s['unit'] for s in entry['sets']
                      if s.get('unit') and s['unit'] not in lib['unitNames']})
    if missing:
        print('\n⚠ 这些 unit 还没在 unitNames 里登记，页面上那一栏会显示不出来：')
        print('   ', missing)
        if not a.dry_run:
            raise SystemExit('先登记 unitNames 再跑本脚本')

    block, _ = indent_block(entry)
    raw = bak
    arr_end, arr_start = find_subject_array_end(raw)
    pos = find_member(raw, arr_start, arr_end, a.sid)
    if pos:
        raw = raw[:pos[0]] + block + raw[pos[1]:]
        act = '替换已有的 %s 条目' % a.sid
    else:
        # 追加到 subjects 数组末尾：找到那个收尾的 ]，在它前面插
        # 逗号要给【原来的最后一项】，不是给新块；给新块会变成尾逗号，JSON 直接读不通
        tail = raw.rindex(']', 0, arr_end + 1)
        before = raw[:tail].rstrip()
        after = raw[tail:]                     # 从这里起：],\n "unitNames": {
        if not before.endswith(','):
            before += ','
        raw = before + '\n' + block + '\n ' + after
        act = '新增 %s 条目' % a.sid

    try:
        chk = json.loads(raw)
    except Exception as e:
        raise SystemExit('✗ 拼出来的 JSON 读不通，已放弃写盘：%s' % e)
    ids = [s['id'] for s in chk['subjects']]
    if len(ids) != len(set(ids)):
        raise SystemExit('✗ 科目 id 重复了，已放弃写盘：%s' % ids)

    if a.dry_run:
        print('\n[dry-run] 将要%s，下面是拼好的片段：\n' % act)
        print(block)
        return
    bak_path = LIB + '.bak'
    with open(bak_path, 'w', encoding='utf-8') as f:
        f.write(bak)
    with open(LIB, 'w', encoding='utf-8') as f:
        f.write(raw)
    print('\n✓ %s：%d 套 / %d 题。已写入 library.json（备份在 %s）' % (act, nfiles, total, os.path.basename(bak_path)))
    print('  跑 python tools/check_data.py 复核一遍。')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()

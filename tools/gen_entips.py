#!/usr/bin/env python3
"""英语“本单元要点”：由各年级词表自动整理本单元重点单词和短语（只用词表里已有的词义）。
已有手写要点（七、四年级）不动。用法：python3 tools/gen_entips.py"""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
tips = json.loads((ROOT / 'data' / 'tips.json').read_text('utf-8'))
add = 0
for g in ['3', '5', '6', '8', '9']:
    d = json.loads((ROOT / 'data' / f'words{g}.json').read_text('utf-8'))
    for u in d['units']:
        key = f'e{g}-{u["id"]}'
        if key in tips:
            continue
        words = [i for i in u['items'] if i['kind'] == 'word']
        phrases = [i for i in u['items'] if i['kind'] != 'word']
        key_words = [i for i in words if i.get('bold')] or words
        items = []
        if key_words:
            items.append(['重点单词', ' ｜ '.join(f"{i['en']} {i['zh1']}" for i in key_words[:12])])
        if phrases:
            items.append(['重点短语', ' ｜ '.join(f"{i['en']} {i['zh1']}" for i in phrases[:10])])
        if len(items) == 0:
            continue
        items.append(['怎么记', '先读 3 遍，再用每个词说一句话；不会的回到“单词卡片”再练。'])
        tips[key] = {'title': '本单元要点', 'items': items}
        add += 1
(ROOT / 'data' / 'tips.json').write_text(json.dumps(tips, ensure_ascii=False, indent=1), 'utf-8')
print('新增', add, '条')

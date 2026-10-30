# -*- coding: utf-8 -*-
import json, glob, io, re
from collections import Counter, OrderedDict

SUBJ = OrderedDict([
    ('g7poli', '道法 g7poli'),
    ('g7hist', '历史 g7hist'),
    ('g7geo',  '地理 g7geo'),
    ('g7bio',  '生物 g7bio'),
    ('g4sci',  '科学 g4sci'),
])

rows = []
for pre in SUBJ:
    files = sorted(glob.glob('data/sets/%s-*.json' % pre),
                   key=lambda x: int(re.search(r'-(\d+)\.json', x).group(1)))
    for f in files:
        d = json.load(io.open(f, encoding='utf-8'))
        for s in d.get('sections', []):
            for q in s.get('questions', []):
                if q['type'] != 'choice':
                    continue
                o = q['options']; ai = ord(q['answer']) - 65
                gap = len(o[ai]) - max(len(x) for i, x in enumerate(o) if i != ai)
                if gap >= 7:
                    rows.append((pre, gap, q['id'], q['stem'], o, ai, d.get('title', '')))

cnt = Counter(r[0] for r in rows)
out = []
w = out.append
w('# 返工任务：把 %d 道题的干扰项补齐\n' % len(rows))
w('四科 680 题已经全部上线了（生物 220 / 历史 200 / 道法 130 / 地理 130），孩子手机上都能刷。')
w('上一封《历史道法地理验收》里说过的我不再重复，这份是**现在唯一需要你动手的事**。\n')

w('## 一、为什么要改\n')
w('选择题里，如果正确答案明显比干扰项长，孩子不用读题，看哪个最长就能选对。')
w('我把全库扫了一遍：**正确答案比最长干扰项长 7 个字以上的，有 %d 道**（gap ≥ 7）：\n' % len(rows))
w('| 科目 | 题数 |')
w('|---|---|')
for pre, name in SUBJ.items():
    w('| %s | %d |' % (name, cnt.get(pre, 0)))
w('\n（gap 在 5~6 字的还有 44 道，这次不要求改。但**以后新出题一律按下面的规则来**，别再攒成一批返工。）\n')

w('## 二、怎么改\n')
w('**只改 `options` 数组，其余字段一个字都别动**')
w('（`id` / `type` / `stem` / `answer` / `pts` / `why` / `unit` / `kind` / `title` 全部原样）\n')
w('四条规矩：\n')
w('1. **正确答案原样保留在原位置**，你只改写另外三个干扰项。这样 `answer` 字段不用动，避免你把答案键改错（这个错我们犯过一次，代价很大）。')
w('2. **四个选项字数接近**，差值压到 4 字以内。gap ≥ 7 的必须降到 ≤ 4。')
w('3. **干扰项写成完整表述，不要只写两三个字。**')
w('   反面例子（现在的样子）：')
w('   ```')
w('   题干：保持身体健康的做法是')
w('     A 长期熬夜        B 不吃早餐        C 暴饮暴食        D 均衡饮食、坚持锻炼、规律作息')
w('   ```')
w('   改成：')
w('   ```')
w('     A 熬夜学习，省下睡觉时间')
w('     B 早上不饿就不吃早饭')
w('     C 想吃就吃，吃到撑为止')
w('     D 均衡饮食、坚持锻炼、规律作息')
w('   ```')
w('   四句都是完整的话，孩子必须真读懂内容才能选。')
w('4. **干扰项要"像有人真会那么做"**，别写一看就错的荒唐话。')
w('   比如把干扰项写成「用自己的零花钱请同学吃饭」可以，写成「一个月不吃饭省下钱来」就不行——后者没人会真这么做。')
w('   好的干扰项是：**这个说法听着有道理、生活中也真有人这么想，但按课本是错的。**\n')
w('另外：四个选项不能重复；选项总数保持 4 个。\n')

w('## 三、清单（%d 题）\n' % len(rows))
w('每题给出：题号 · 所在课 · 题干 · 现在的四个选项（带 `*` 的是正确答案）· gap 多少。')
w('你改的时候照着题号去改 `data/sets/` 里对应的 json 就行。\n')

for pre, name in SUBJ.items():
    sub = [r for r in rows if r[0] == pre]
    if not sub:
        continue
    w('### %s（%d 题）\n' % (name, len(sub)))
    for _, gap, qid, stem, o, ai, title in sorted(sub, reverse=True):
        w('**`%s`** · %s · gap +%d' % (qid, title, gap))
        w('```')
        w('题干：%s' % stem)
        for i, t in enumerate(o):
            w('%s %s  (%d字)' % ('*' if i == ai else ' ', t, len(t)))
        w('```')
        w('')
    w('')

w('## 四、交付\n')
w('- 只交付**改过的** json 文件（不用打包全部 68 个），压缩成 zip 发回来就行。')
w('- 如果你更省事：**只回一个「题号 → 新 options」的对照表**（txt 就行），我来批量写回，比传 json 更不容易出错。两种都行，你挑。')
w('- 交付时附一句：**哪些题你顺手发现答案本身有问题**（不是选项长度，是内容），我单独看。\n')

w('## 五、改完之后\n')
w('我会重跑体检 + 重新算一遍 gap。**第二批（排序题、简答自评）还是老规矩：等我改完 App 代码再开工**，在那之前不要动——第一批 680 题够孩子做一两个月，先让他真做起来，比堆量有用。\n')

w('另外，给我地理配图的清单你已经随对照表交了（经纬网、比例尺、等高线、三级阶梯、气温降水、河湖、秦岭—淮河），我正在照着画。'
  '画的时候如果发现哪道题配图效果不好我会告诉你，届时需要你配合改题干措辞。')

src = '\n'.join(out) + '\n'
io.open(r'C:/Users/MSN/WorkBuddy/2026-10-26-13-51-55/给Claude_返工清单_干扰项.md', 'w', encoding='utf-8', newline='').write(src)
print('rows', len(rows), '| chars', len(src))
print(dict(cnt))

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把听力原文变成 MP3（每段自动读两遍，中间停顿；对话里不同的人用不同的声音）。

用法：在本文件所在的 tools 文件夹里打开命令行：
    pip install edge-tts           （只需要装一次，要能上国际网络）
    python make_audio.py           只生成「还没有」的音频
    python make_audio.py --all     全部重新生成
    python make_audio.py g7l3 g4l2 只生成指定的几组
    python make_audio.py --index-only  只更新目录（你已经自己做好 MP3 并放进 audio 文件夹时用）
    python make_audio.py --words       生成所有单词、短语、句子的美式发音（放在 audio/w/ 里）
    python make_audio.py --dry-run 不联网，只生成 2 秒的静音，用来检查流程

生成的 MP3 放在上一级的 audio 文件夹里，同时更新 audio/index.json。
然后把 audio 文件夹上传到 GitHub，孩子的 App 就能听到了。

听力原文来自 data/sets/*.json 里的 "transcript"，说话人对应的声音在 "speakers" 里；
想换声音，改下面的 VOICES 就行。
"""
import asyncio
import json
import math
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / 'data' / 'sets'
AUDIO = ROOT / 'audio'
SIL1 = (pathlib.Path(__file__).resolve().parent / 'silence1s.mp3').read_bytes()

# 声音：m=男 f=女（数字用来区分同性别的两个人）。可换成别的 edge-tts 声音名。
VOICES = {
    'm1': 'en-US-GuyNeural',
    'm2': 'en-US-ChristopherNeural',
    'f1': 'en-US-JennyNeural',
    'f2': 'en-US-AriaNeural',
}
GAP_LINE = 1       # 每句话之间停几秒
GAP_REPEAT = 3     # 第一遍和第二遍之间停几秒
SPEAK_RATE = '-15%'


def silence(sec):
    return SIL1 * max(1, math.ceil(sec))


async def tts(text, voice, rate, dry):
    if dry:
        return silence(2)
    import edge_tts
    last = None
    for _ in range(3):
        try:
            buf = bytearray()
            async for chunk in edge_tts.Communicate(text, voice, rate=rate).stream():
                if chunk['type'] == 'audio':
                    buf += chunk['data']
            if buf:
                return bytes(buf)
        except Exception as e:  # 网络偶尔失败，重试
            last = e
            await asyncio.sleep(2)
    raise RuntimeError('生成失败：%s（%s）' % (text[:30], last))


async def make_listening(s, out, dry):
    spk = s.get('speakers', {})
    rate = s.get('rate', '+0%')
    one = bytearray()
    for line in s['transcript']:
        voice = VOICES.get(spk.get(line['s'], 'f1'), VOICES['f1'])
        one += await tts(line['t'], voice, rate, dry)
        one += silence(GAP_LINE)
    out.write_bytes(bytes(one) + silence(GAP_REPEAT) + bytes(one))


async def make_speaking(s, dry):
    for i, x in enumerate(s['sentences'], 1):
        out = AUDIO / ('sp-%d.mp3' % i)
        if out.exists() and not FORCE:
            continue
        out.write_bytes(await tts(x['en'], VOICES['f1'], SPEAK_RATE, dry) + silence(1))
        print('  口语句子', i, '完成')



# ---------- 单词 / 短语 / 句子发音（美式） ----------
WORD_VOICE = 'en-US-JennyNeural'
SPEAK_FIX = {  # 有些写法直接读不对，这里指定怎么读
    'AM (a.m.)': 'A M', 'PM (p.m.)': 'P M', 'IT': 'I T', 'PE': 'P E', 'Ms': 'Miss',
    "would (’d) like to": 'would like to', 'a lot of / lots of': 'a lot of, lots of',
    'at the back (of)': 'at the back of', 'How about ...?': 'How about', 're': 'ree',
}


def slug(s):
    import re
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def word_jobs():
    """返回 [(文件名, 要读的文字)]，文件名规则要和网页里一致：单词/短语 = slug(原文).mp3，句子 = s-<slug(句子编号)>.mp3"""
    jobs = {}
    for f in ('words7.json', 'words4.json'):
        p = ROOT / 'data' / f
        if not p.exists():
            continue
        for u in json.loads(p.read_text(encoding='utf-8'))['units']:
            for it in u['items']:
                jobs[slug(it['en']) + '.mp3'] = SPEAK_FIX.get(it['en'], it['en'])
            for s in u.get('sentences', []):
                jobs['s-' + slug(s['id']) + '.mp3'] = s['en']
    import re
    for sf in sorted(DATA.glob('*.json')):
        v = json.loads(sf.read_text(encoding='utf-8')).get('vocab')
        for part in re.split(r'\s*·\s*', v or ''):
            m = re.match(r'^(.*?)\s*([（(]?[\u4e00-\u9fff].*)$', part.strip())
            en = (m.group(1) if m else part).strip()
            if en:
                jobs.setdefault(slug(en) + '.mp3', SPEAK_FIX.get(en, en))
    ip = ROOT / 'data' / 'ipa.json'
    if ip.exists():
        for w in json.loads(ip.read_text(encoding='utf-8')):
            jobs.setdefault(slug(w) + '.mp3', SPEAK_FIX.get(w, w))
    return jobs


async def make_words(dry):
    out_dir = AUDIO / 'w'
    out_dir.mkdir(parents=True, exist_ok=True)
    jobs = word_jobs()
    todo = [(n, t) for n, t in jobs.items() if FORCE or not (out_dir / n).exists()]
    print('需要生成 %d 个，已有 %d 个' % (len(todo), len(jobs) - len(todo)))
    sem = asyncio.Semaphore(4)
    done = [0]

    async def one(n, t):
        async with sem:
            (out_dir / n).write_bytes(await tts(t, WORD_VOICE, '-5%', dry))
            done[0] += 1
            if done[0] % 50 == 0:
                print('  已完成', done[0], '/', len(todo))
    await asyncio.gather(*[one(n, t) for n, t in todo])


def write_index():
    files = sorted(['audio/' + p.name for p in AUDIO.glob('*.mp3')] + ['audio/w/' + p.name for p in (AUDIO / 'w').glob('*.mp3')])
    (AUDIO / 'index.json').write_text(json.dumps({'files': files}, ensure_ascii=False, indent=1), encoding='utf-8')
    print('已更新 audio/index.json，共 %d 个音频' % len(files))


async def main():
    global FORCE
    args = [a for a in sys.argv[1:]]
    dry = '--dry-run' in args
    FORCE = '--all' in args
    ids = [a for a in args if not a.startswith('--')]
    AUDIO.mkdir(exist_ok=True)
    if '--index-only' in args:
        write_index(); return
    if '--words' in args:
        await make_words(dry); write_index(); print('完成。把 audio 文件夹上传到 GitHub 即可。'); return
    for f in sorted(DATA.glob('*.json')):
        s = json.loads(f.read_text(encoding='utf-8'))
        if ids and s['id'] not in ids:
            continue
        if s['kind'] == 'listening':
            out = AUDIO / (s['id'] + '.mp3')
            if out.exists() and not FORCE and not ids:
                continue
            print('生成', s['id'], s['title'])
            await make_listening(s, out, dry)
        elif s['kind'] == 'speaking':
            print('生成口语跟读句子')
            await make_speaking(s, dry)
    write_index()
    print('完成。把 audio 文件夹上传到 GitHub 即可。')

FORCE = False
if __name__ == '__main__':
    asyncio.run(main())

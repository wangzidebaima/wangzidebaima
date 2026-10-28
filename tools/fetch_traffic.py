#!/usr/bin/env python3
"""从 GitHub 官方流量接口取这个仓库的访问数据，写成网页能直接读的 json。

为什么要绕这一圈（而不是网页直接调 GitHub 接口）：
  GitHub 的流量接口必须要 token，而网页是公开的，token 写进代码就等于公开泄露。
  所以让 GitHub Actions 每天跑两次，把结果提交成 data/traffic.json，
  网页只读这个静态文件，既不用 token，也不怕接口被墙。

用法：
  GH_TOKEN=xxx python3 tools/fetch_traffic.py      # 本地手动跑一次
  在 GitHub 上由 .github/workflows/traffic.yml 定时跑

token 权限：细粒度 token，只勾这一个仓库，Repository permissions → Administration → Read-only
"""
import datetime
import json
import os
import sys
import urllib.error
import urllib.request

REPO = os.environ.get('REPO') or 'wangzidebaima/wangzidebaima'
TOKEN = (os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN') or '').strip()
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'data', 'traffic.json')
LOG = os.path.join(ROOT, 'data', 'traffic_log.json')
BJ = datetime.timezone(datetime.timedelta(hours=8))
KEEP_DAYS = 400


def api(path):
    req = urllib.request.Request(
        'https://api.github.com/repos/%s%s' % (REPO, path),
        headers={
            'Accept': 'application/vnd.github+json',
            'Authorization': 'Bearer ' + TOKEN,
            'User-Agent': 'shushanxiaolu-traffic',
            'X-GitHub-Api-Version': '2022-11-28',
        })
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.load(r)


def norm(day):
    """GitHub 给的 timestamp 是 UTC 零点，加 8 小时还是同一天，取前 10 位即可。"""
    return str(day.get('timestamp', ''))[:10]


def main():
    if not TOKEN:
        print('没有配置 token（Secrets 里的 TRAFFIC_TOKEN），这次跳过。')
        return 0
    try:
        views = api('/traffic/views?per=day')
        paths = api('/traffic/popular/paths')
        refs = api('/traffic/popular/referrers')
    except urllib.error.HTTPError as e:
        body = ''
        try:
            body = e.read().decode('utf-8', 'ignore')[:200]
        except Exception:
            pass
        print('取数据失败：HTTP %s %s' % (e.code, body))
        if e.code in (401, 403):
            print('多半是 token 没配、过期，或者权限不够（需要 Administration: Read）。')
            print('这次不写文件，网页上会继续显示上一次成功的数据。')
        return 0
    except Exception as e:
        print('取数据失败：%s（网络问题？这次不写文件）' % e)
        return 0

    days = [{'d': norm(v), 'v': int(v.get('count') or 0), 'u': int(v.get('uniques') or 0)}
            for v in (views.get('views') or []) if norm(v)]
    days.sort(key=lambda x: x['d'])

    now = datetime.datetime.now(BJ)
    out = {
        'at': now.strftime('%Y-%m-%d %H:%M'),
        'repo': REPO,
        'days': days,
        'sum': {'v': int(views.get('count') or 0), 'u': int(views.get('uniques') or 0)},
        'paths': [{'p': p.get('path', ''), 'v': int(p.get('count') or 0), 'u': int(p.get('uniques') or 0)}
                  for p in (paths or [])[:5]],
        'refs': [{'r': r.get('referrer', ''), 'v': int(r.get('count') or 0), 'u': int(r.get('uniques') or 0)}
                 for r in (refs or [])[:5]],
    }

    # 长期账本：GitHub 只给最近 14 天，这里把每天的记录攒下来，以后能看总趋势
    log = {}
    if os.path.isfile(LOG):
        try:
            log = json.load(open(LOG, encoding='utf-8'))
        except Exception:
            log = {}
    for d in days:
        log[d['d']] = {'v': d['v'], 'u': d['u']}
    if len(log) > KEEP_DAYS:
        for k in sorted(log)[:-KEEP_DAYS]:
            log.pop(k, None)
    out['all'] = {'v': sum(x.get('v', 0) for x in log.values()),
                  'days': len(log),
                  'since': min(log) if log else ''}

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
        f.write('\n')
    with open(LOG, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(dict(sorted(log.items())), f, ensure_ascii=False, indent=0)
        f.write('\n')

    print('已写入：近 14 天浏览 %d 次、访客 %d 人；累计浏览 %d 次（%d 天）'
          % (out['sum']['v'], out['sum']['u'], out['all']['v'], out['all']['days']))
    return 0


if __name__ == '__main__':
    sys.exit(main())

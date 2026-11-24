// 全站冒烟测试：每个孩子账号打开所有主要页面，检查「页面打不开 / JS 报错 / 空白 / 文件 404」。
// 用法：  NODE_PATH=$(npm root -g) node tools/smoke.mjs          （需要装过 playwright 和 chromium）
//   环境变量：SMOKE_USERS=son,g1  只测这几个账号；SMOKE_FAST=1 每科只抽 2 套题（快）；默认每科抽 5 套
// 不联网，不改任何文件；出现问题时退出码为 1。
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.mp3': 'audio/mpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, r));
const base = `http://localhost:${server.address().port}/`;
const cfg = JSON.parse(fs.readFileSync(path.join(root, 'data/config.json'), 'utf8'));
const lib = JSON.parse(fs.readFileSync(path.join(root, 'data/library.json'), 'utf8'));
const per = process.env.SMOKE_FAST ? 2 : 5;
const only = process.env.SMOKE_USERS ? process.env.SMOKE_USERS.split(',') : null;
const pick = (arr, n) => arr.length <= n ? arr : Array.from({ length: n }, (_, i) => arr[Math.floor(i * (arr.length - 1) / (n - 1))]);
const cardIdx = (s) => { try { return JSON.parse(fs.readFileSync(path.join(root, 'data/cards', s + '.json'), 'utf8')); } catch (e) { return null; } };

const browser = await chromium.launch();
let bad = 0, visited = 0;
for (const u of cfg.users) {
  if (only && !only.includes(u.id)) continue;
  const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 390, height: 800 } });
  await ctx.route(/baidu|hm\.js/, r => r.abort());
  const page = await ctx.newPage(); let errs = [], notFound = [];
  page.on('pageerror', e => errs.push('JS错误: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text())) errs.push('console.error: ' + m.text().slice(0, 150)); });
  page.on('response', r => { if (r.status() >= 400 && r.url().startsWith(base) && !/favicon/.test(r.url())) notFound.push(r.status() + ' ' + r.url().replace(base, '')); });
  await page.goto(base, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(800);
  try { await page.getByText('知道了，开始吧').click({ timeout: 1500 }); } catch (e) { /* 没有介绍页 */ }
  await page.locator('input').first().fill(u.grade); await page.keyboard.press('Enter'); await page.waitForTimeout(900);
  const routes = ['', 'search', 'write', 'plan', 'tell', 'packs', 'errors', 'me', 'badges', 'help', 'learn', 'weekrev', 'papers', 'check'];
  const subs = (u.subjects || []).filter(id => lib.subjects.some(s => s.id === id));
  for (const sid of subs) {
    const S = lib.subjects.find(s => s.id === sid);
    routes.push('s/' + sid);
    if (cardIdx(sid)) routes.push('cards/' + sid);
    pick(S.sets, per).forEach(st => routes.push((st.kind === 'speaking' ? 'speak/' : st.kind === 'listening' ? 'hear/' : 'set/') + st.id));
    const ci = cardIdx(sid); if (ci) pick(Object.keys(ci).filter(k => k !== 'index'), 2).forEach(k => routes.push('card/' + k));
  }
  let uBad = 0;
  for (const r of routes) {
    errs = []; notFound = [];
    await page.goto(base + '#/' + r, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(350);
    const txt = await page.locator('#app').innerText().catch(() => '');
    visited++;
    const why = [];
    if (/这个页面打不开/.test(txt)) why.push('页面打不开');
    if (txt.replace(/\s/g, '').length < 8) why.push('空白');
    why.push(...errs, ...notFound);
    if (why.length) { uBad++; bad++; console.log(`✗ ${u.id} #/${r}  ${why.join(' | ')}`); }
  }
  console.log(`${uBad ? '✗' : '✓'} ${u.id}（${u.grade}）共 ${routes.length} 个页面${uBad ? '，' + uBad + ' 个有问题' : ''}`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(bad ? `\n共 ${bad} 处问题（访问 ${visited} 页）` : `\n✅ 全部通过（访问 ${visited} 页）`);
process.exit(bad ? 1 : 0);

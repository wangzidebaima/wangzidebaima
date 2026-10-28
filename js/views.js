// 所有页面：登录、首页、题库、答题、结果、错题本、随机练习、记录、打印
import { h, esc, mathHtml, toast, keypad, praiseText, playSay, slug, playScript, stopScript, zhVoices, testVoice, getVoicePref, setVoicePref } from './ui.js';
import * as B from './badges.js';
import * as S from './store.js';
import { gradeQuestion, answerText, userText, isAnswered } from './grade.js';
import { RANDOM, makeSession } from './mathgen.js';
import { srReady, listen, similarity, errText } from './speech.js';

export const X = { cfg: null, lib: null, vocab: {}, audio: new Set(), sets: {}, ipa: {} };
const app = () => document.getElementById('app');
// 两个门：adminOk = 开发者后台（config.json 里那个密码）；parentOk = 家长专区或后台都算过
const ses = (k, fb) => { try { return sessionStorage.getItem(k) === '1'; } catch (e) { return !!window[fb]; } };
export const adminOk = () => ses('kp_parent', '__kpParent');
export const parentOk = () => adminOk() || ses('kp_zone', '__kpZone');
export const nav = (hash) => { if (location.hash === hash) window.dispatchEvent(new Event('hashchange')); else location.hash = hash; };
export const user = () => X.cfg.users.find(u => u.id === S.getUser()) || null;
export function setTheme(u) { document.documentElement.dataset.theme = u ? u.theme : ''; document.documentElement.dataset.fs = u ? String(S.P(u.id).font || 0) : '0'; }
export function mount(node) { app().replaceChildren(node); window.scrollTo(0, 0); keypad.close(); }
export const cap = () => X.cfg.dailyStarCap || 30;
export const goal = () => X.cfg.starGoal || 400;
// 进度条每满一轮（默认 400 颗）就重置：pos = 本轮已得的星星，laps = 已经完成的轮数
export const cycle = (total) => { const G = goal(); const laps = total > 0 ? Math.floor((total - 1) / G) : 0; return { pos: total - laps * G, laps }; };

function page(title, content, { back = '#/', right = null } = {}) {
  // back 也可以是一个函数（比如「从哪来的回哪去」用 history.back）
  const backNode = !back ? h('span', { class: 'back' })
    : typeof back === 'function'
      ? h('button', { type: 'button', class: 'back', style: 'background:none;border:0;padding:0;font:inherit;color:inherit', onclick: back }, '‹ 返回')
      : h('a', { class: 'back', href: back }, '‹ 返回');
  return h('div', { class: 'page' },
    h('header', { class: 'top' }, backNode, h('h1', {}, title), right || h('span', { class: 'back' })),
    h('main', {}, content));
}
// 自检页：把需要的文件逐个请求一遍，哪个没传上就列出来
export async function checkPage() {
  const out = h('div', { class: 'list' }), sum = h('p', { class: 'note' }, '正在检查…');
  mount(page('检查文件', [sum, out], { back: '#/me' }));
  let files = [];
  try {
    const t = await (await fetch('sw.js', { cache: 'no-store' })).text(); const m = t.match(/const SHELL = \[([\s\S]*?)\];/);
    files = (m ? [...m[1].matchAll(/'([^']+\.(?:js|json|css|png|webmanifest|html))'/g)].map(x => x[1]) : []);
    const lib = await (await fetch('data/library.json', { cache: 'no-store' })).json();
    lib.subjects.forEach(sb => sb.sets.forEach(x => files.push('data/' + x.file)));
  } catch (e) { sum.textContent = '读不到文件列表，请连上网络再试。'; return; }
  const bad = []; let n = 0;
  for (let i = 0; i < files.length; i += 12) {
    await Promise.all(files.slice(i, i + 12).map(async f => { try { const r = await fetch(f, { cache: 'no-store' }); if (!r.ok) bad.push(f); } catch (e) { bad.push(f); } n++; }));
    sum.textContent = `正在检查… ${Math.min(n, files.length)}/${files.length}`;
  }
  try { localStorage.setItem('kp_hc', JSON.stringify({ t: Date.now(), bad })); } catch (e) { /* 无痕模式 */ }
  if (!bad.length) { sum.textContent = `✅ ${files.length} 个文件都在，没有缺的。`; return; }
  sum.textContent = `有 ${bad.length} 个文件没找到。把下面的截图发给爸爸，请他重新上传：`;
  bad.forEach(f => out.append(h('div', { class: 'row' }, h('div', {}, h('b', {}, f)))));
}
export function showError(msg) {
  mount(h('div', { class: 'login' }, h('div', { class: 'logo' }, '📡'), h('h1', {}, '打不开'), h('p', { class: 'sub' }, msg),
    h('button', { class: 'btn primary wide', onclick: () => location.reload() }, '重新加载')));
}

const subj = (id) => X.lib.subjects.find(s => s.id === id);
const setMeta = (id) => { for (const s of X.lib.subjects) { const m = s.sets.find(x => x.id === id); if (m) return { subject: s, meta: m }; } return null; };
export async function loadSet(id) {
  if (X.sets[id]) return X.sets[id];
  const f = setMeta(id); if (!f) throw new Error('没有找到这套题');
  const r = await fetch('data/' + f.meta.file);
  if (!r.ok) throw new Error('题目加载失败，请检查网络后重试');
  return (X.sets[id] = await r.json());
}

// ---------------- 登录 ----------------
const sha256 = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
function askPassword() {
  const P = X.cfg.parent;
  const inp = h('input', { class: 'big', type: 'password', inputmode: 'numeric', placeholder: '请输入密码', autocomplete: 'off', enterkeyhint: 'go' });
  const msg = h('p', { class: 'msg' });
  const go = async () => {
    try {
      if (await sha256(P.salt + inp.value.trim()) === P.hash) { try { sessionStorage.setItem('kp_parent', '1'); } catch (e) { window.__kpParent = true; } nav('#/parent'); }
      else { msg.textContent = '密码不对，再试一次'; inp.value = ''; }
    } catch (e) { msg.textContent = '这个浏览器暂时无法验证密码'; }
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  setTheme(null);
  mount(h('div', { class: 'login' }, h('div', { class: 'logo' }, '🔒'), h('h1', {}, P.name), h('p', { class: 'sub' }, '请输入密码'), inp,
    h('button', { class: 'btn primary wide', onclick: go }, '进入'), h('button', { class: 'btn ghost wide', style: 'margin-top:10px', onclick: () => nav('#/login') }, '返回'), msg));
  setTimeout(() => inp.focus(), 50);
}
// ---------------- 试卷下载：Word 文件放在 papers/ 里，家长点一下下载打印 ----------------
const PAPERS = [
  { g: 'g7', name: '小七 · 七年级', math: 5, eng: 10 },
  { g: 'g4', name: '小四 · 四年级', math: 5, eng: 6 },
];
export function papersPage() {
  if (!parentOk()) { nav('#/login'); return; }
  setTheme(null);
  const dl = (f, t) => h('a', { class: 'chip', href: 'papers/' + f + '.docx', download: f + '.docx' }, t);
  const blocks = PAPERS.map(x => h('section', { style: 'margin:14px 0' },
    h('h2', { class: 'sh' }, x.name),
    [['math', '📐 数学'], ['eng', '🔤 英语']].map(([sb, t]) => h('div', { style: 'margin:8px 0' },
      h('b', {}, t),
      h('div', { class: 'chips', style: 'margin-top:6px' },
        Array.from({ length: x[sb] }, (_, i) => dl(`${x.g}-${sb}-${i + 1}`, `第 ${i + 1} 单元`)),
        dl(`${x.g}-${sb}-mid`, '期中'), dl(`${x.g}-${sb}-fin`, '期末'))))));
  mount(page('试卷下载', [
    h('p', { class: 'note' }, '点一下下载 Word 文件，用电脑打开打印。手机上点开会先下载，需要用 WPS 之类的打开。'),
    ...blocks,
    h('p', { class: 'note' }, '语文没有做试卷；叶子（二年级）也没有试卷。想让孩子在手机上做题，用「单元小测」更快。'),
  ], { back: '#/parent' }));
}
// ---------------- 一个孩子的卡片：导出备份 / 导入备份 / 发金币 ----------------
// 家长专区（家长自己进来）和开发者后台（#/parent，只有我能进）共用同一份，别写两遍
export function kidCard(u, { vip = false, redraw = null } = {}) {
  const again = redraw || (() => {});
  const st = S.stats(u.id);
  const file = h('input', { type: 'file', accept: '.json,application/json', style: 'display:none', onchange: (ev) => {
    const f = ev.target.files && ev.target.files[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      const name = f.name || '';
      if (!confirm(`用「${name}」里的记录覆盖 ${u.display} 在这台手机上的现有记录吗？\n覆盖后星星、错题以文件里的为准，现有记录会被替换。`)) return;
      if (S.importProfile(u.id, String(rd.result))) { toast('导入成功，正在刷新…'); setTimeout(() => location.reload(), 900); }
      else toast('导入失败：这个文件不是「书山小路」导出的记录文件');
    };
    rd.readAsText(f);
  } });
  // 上次导出提醒：没导出过 / 超过 30 天都会标红
  const bak = h('p', { class: 'note' });
  const setBak = () => {
    const d = S.backupDaysAgo(u.id);
    if (d < 0) { bak.className = 'note bakwarn'; bak.textContent = '⚠️ 还没有导出过备份，建议现在就导出一次'; return; }
    const m = Number(S.lastBackup(u.id).slice(5, 7)), dd = Number(S.lastBackup(u.id).slice(8, 10));
    if (d === 0) { bak.className = 'note'; bak.textContent = '上次导出：今天'; return; }
    if (d > 30) { bak.className = 'note bakwarn'; bak.textContent = `⚠️ 上次导出：${m} 月 ${dd} 日（已过 ${d} 天，建议再导出一次）`; return; }
    bak.className = 'note'; bak.textContent = `上次导出：${m} 月 ${dd} 日`;
  };
  setBak();
  // 金币：这一轮攒到的 + 家长已发放的流水
  const rews = (X.cfg.rewards || []).slice().sort((a, b) => a.stars - b.stars);
  const cyk = cycle(st.total), got = coinsGot(rews, cyk.pos), given = S.coinGivenLap(u.id, cyk.laps, goal());
  const paidAll = S.coinsPaid(u.id), lastCoin = S.coinList(u.id).slice(-1)[0];
  const coinRow = h('div', { class: 'row static' }, h('div', {}, h('b', {}, '🪙 金币'),
    h('small', {}, (got ? (given ? `本轮 ${got} 个已发放` : `本轮可领 ${got} 个`) : '本轮还没攒到') + (paidAll ? ` · 累计已发 ${paidAll} 个` : ' · 还没发过') + (lastCoin ? `，上次 ${Number(lastCoin.d.slice(5, 7))} 月 ${Number(lastCoin.d.slice(8, 10))} 日` : ''))),
    got && !given ? h('button', { type: 'button', class: 'btn small primary', onclick: () => {
      if (!confirm(`确认已经把这一轮的 ${got} 个金币给 ${u.display} 了吗？\n记下后，孩子首页会显示「家长已经发放啦」。`)) return;
      S.payCoins(u.id, cyk.laps, goal(), got); toast('记好啦'); again();
    } }, `记一笔：发 ${got} 个`) : null);
  // 会员占位：只在我的后台显示，家长专区里没有（现在没有任何功能用它做拦截）
  const vipRow = vip ? h('div', { class: 'row static' }, h('div', {}, h('b', {}, '👑 会员'),
    h('small', {}, S.isVip(u.id) ? `已开通，到期：${S.P(u.id).vip.exp}` : '未开通（功能准备中）'))) : null;
  return h('div', { class: 'list' },
    file,
    h('div', { class: 'row static' }, h('div', {}, h('b', {}, u.display), h('small', {}, `${u.grade} · ⭐${st.total} 颗 · 错题 ${st.wrong} 道`)),
      h('span', { class: 'chip' }, S.getUser() === u.id ? '当前登录' : ' ')),
    h('div', { class: 'chips' },
      h('button', { type: 'button', class: 'btn small primary', onclick: () => {
        try {
          const blob = new Blob([S.exportProfile(u.id)], { type: 'application/json' });
          const a = h('a', { href: URL.createObjectURL(blob), download: `书山小路-${u.display}-记录-${S.today()}.json` });
          document.body.append(a); a.click(); a.remove();
          S.markBackup(u.id); setBak();
          toast('已导出，请把文件保存好或发到家长微信/电脑');
        } catch (e) { toast('导出失败，请换浏览器再试'); }
      } }, '导出记录'),
      h('button', { type: 'button', class: 'btn small ghost', onclick: () => file.click() }, '导入记录')),
    bak,
    coinRow,
    vipRow,
    h('p', { class: 'note' }, '换手机或清过浏览器数据后：在新手机上先登录孩子，再到这里点「导入记录」选文件即可恢复。'));
}
// ---------------- 开发者后台：只有我能进（密码写在 config.json 里），客户看不到 ----------------
// 客户家长要用的都在「家长专区」（#/zone），别往这里加
export function parentHome() {
  if (!adminOk()) { nav('#/login'); return; }
  setTheme(null);
  const rows = X.cfg.users.map(u => kidCard(u, { vip: true, redraw: parentHome }));
  // 朗读声音：这是设备级设置（三个孩子共用），显示一次就够；苹果老机型语文“咬舌”时来这换
  const vrow = h('a', { class: 'row', href: '#/voice' }, h('div', {}, h('b', {}, '🔊 朗读声音'),
    h('small', {}, voiceNow())), h('span', { class: 'chip' }, '试听 / 换'));
  mount(h('div', { class: 'login' }, h('div', { class: 'logo' }, '🔒'), h('h1', {}, X.cfg.parent.name),
    h('p', { class: 'sub' }, '这是开发者后台：看访问统计、处理家长的问题。家长自己要用的在「家长专区」。'),
    ...rows,
    h('div', { class: 'list', style: 'margin-top:12px' }, vrow,
      h('a', { class: 'row', href: '#/zone' }, h('div', {}, h('b', {}, '👨‍👩‍👧 家长专区'),
        h('small', {}, '家长自己设密码进来：发金币 / 备份 / 试卷')), h('span', { class: 'chip' }, '去看看')),
      h('a', { class: 'row', href: '#/papers' }, h('div', {}, h('b', {}, '📄 试卷下载'),
        h('small', {}, '数学、英语各单元 + 期中期末，共 34 份 Word')), h('span', { class: 'chip' }, '去下载')),
      h('a', { class: 'row', href: '#/traffic' }, h('div', {}, h('b', {}, '📈 访问统计'),
        h('small', {}, '有多少人打开过这个网站（GitHub 官方数据）')), h('span', { class: 'chip' }, '看看')),
      h('a', { class: 'row', href: '#/help' }, h('div', {}, h('b', {}, '🩺 遇到问题'), h('small', {}, '没声音、打不开、更新不了怎么办；一键自检把状态查出来')), h('span', { class: 'chip' }, '看看'))),
    h('button', { class: 'btn ghost wide', style: 'margin-top:14px', onclick: () => { if (confirm('家长忘了自己设的密码时，用这个清掉：他会重新设一个。孩子的星星和错题不受影响。确定清掉吗？')) { S.pinClear(); toast('已清掉，家长下次进专区会重新设一个'); } } }, '清除本机家长密码（家长忘密码时用）'),
    h('button', { class: 'btn ghost wide', style: 'margin-top:10px', onclick: () => { noticeReset(); toast('好啦，下次打开会重新显示使用须知'); } }, '重新显示使用须知'),
    h('button', { class: 'btn ghost wide', style: 'margin-top:10px', onclick: () => { try { sessionStorage.removeItem('kp_parent'); } catch (e) { window.__kpParent = false; } nav('#/login'); } }, '退出')));
}
// ---------------- 朗读声音：家长页那一行显示“现在用的是哪个中文语音” ----------------
export function voiceNow() {
  const pref = getVoicePref(), list = zhVoices();
  if (!list.length) return '刚打开还没读到手机里的语音，点进去看';
  const hit = pref ? list.find(x => x.key === pref) : null, cur = hit || list[0];
  return `${hit ? '已选' : '自动选'}：${cur.name}（${cur.lang}）`;
}
// 语音不对（苹果老机型语文“咬舌”）时，家长在这里一个个试听、换掉。
// 不锁家长密码：这不涉及孩子的记录，从「遇到问题」页也能直接进来（别的家长找得到）
export function voicePage() {
  setTheme(null);
  const box = h('div', {});
  const draw = () => {
    if (!box.isConnected) return;
    const list = zhVoices(), pref = getVoicePref();
    const rows = list.map(x => {
      const on = pref ? pref === x.key : x === list[0];
      const bad = /^zh-(hk|tw)|^yue|^wuu/i.test(x.lang || '') || /粤|上海|台湾|台灣|cantonese/i.test(x.name);
      return h('div', { class: 'row static' },
        h('div', {}, h('b', {}, (on ? '✅ 当前：' : '') + x.name), h('small', {}, x.lang + (bad ? ' · 不是普通话，读中文会咬舌' : ''))),
        h('div', { class: 'chips' },
          h('button', { type: 'button', class: 'btn small ghost', onclick: () => testVoice(x.v) }, '🔊 试听'),
          on ? null : h('button', { type: 'button', class: 'btn small primary', onclick: () => { setVoicePref(x.key); toast('记住啦，以后就用这个声音'); draw(); } }, '用这个')));
    });
    box.replaceChildren(
      h('p', { class: 'note' }, '先点「试听」听一句，觉得哪个顺耳就点「用这个」。选好回到课文点播放，用的就是它。'),
      list.length ? h('div', { class: 'list' }, rows)
        : h('p', { class: 'note bakwarn' }, '这台手机还没读到中文语音。先到「设置 → 辅助功能 → 朗读内容 → 声音 → 中文」下载一个「普通话」，再回来看这一页。'),
      ...(pref ? [h('button', { class: 'btn ghost wide', style: 'margin-top:12px', onclick: () => { setVoicePref(''); toast('已恢复自动选择'); draw(); } }, '恢复自动选择')] : []));
  };
  const back = () => { if (history.length > 1) history.back(); else nav('#/help'); };
  mount(page('朗读声音', box, { back }));
  draw();
  try { const ss = window.speechSynthesis; if (ss && ss.addEventListener) ss.addEventListener('voiceschanged', () => { if (box.isConnected) draw(); }); } catch (e) { /* ignore */ }
}
// ---------------- 访问统计：数据由 GitHub Actions 每天两次写进 data/traffic.json ----------------
// 为什么绕这一圈：GitHub 的流量接口必须要 token，而网页是公开的，token 写进去就等于泄露。
// 所以让 Actions 抓下来提交成静态文件，这里只负责显示——不需要 token，也不怕外网接口挂了。
const tvDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
// GitHub 给的来源是域名，翻译成人话
const refName = (r) => !r ? '直接打开' : /^github\./.test(r) ? 'GitHub 站内' : /weixin|wechat/i.test(r) ? '微信分享' : /baidu/i.test(r) ? '百度搜索' : /google/i.test(r) ? '谷歌搜索' : /bing/i.test(r) ? '必应搜索' : r;
function trafficView(d) {
  if (!d) {
    return [
      h('div', { class: 'empty' }, h('div', { class: 'logo' }, '📈'), h('h2', {}, '还没有数据'),
        h('p', {}, '还没开始统计。这是新功能，需要在 GitHub 仓库里加一个 TRAFFIC_TOKEN（一次性，约 2 分钟），加好后这里每天自动更新两次。')),
      h('p', { class: 'note' }, '配好后回来点「重新读取」就能看到。'),
      h('button', { class: 'btn ghost wide', onclick: () => trafficPage() }, '重新读取'),
    ];
  }
  const days = (d.days || []).slice(-14);
  const sum = d.sum || {}, all = d.all || {};
  const now = new Date(), today = tvDay(now), yes = tvDay(new Date(Date.now() - 864e5));
  const pick = (k) => days.find(x => x.d === k) || { v: 0, u: 0 };
  const max = Math.max(1, ...days.map(x => x.v));
  const refs = d.refs || [];
  const card = (n, t) => h('div', { class: 'tcard' }, h('b', {}, String(n)), h('small', {}, t));
  return [
    h('div', { class: 'tcards' }, card(sum.v || 0, '近 14 天浏览'), card(sum.u || 0, '近 14 天访客')),
    h('p', { class: 'note' }, `今天 ${pick(today).v} 次（${pick(today).u} 人） · 昨天 ${pick(yes).v} 次（${pick(yes).u} 人）`),
    days.length ? h('div', { class: 'tbar' }, days.map((x, i) => h('div', { class: 'tbarc', title: `${x.d}：${x.v} 次 / ${x.u} 人` },
      h('i', { class: x.v ? '' : 'z', style: `height:${Math.max(4, Math.round(x.v / max * 100))}%` }),
      h('span', {}, i === 0 || i === days.length - 1 || i === 6 ? x.d.slice(5) : '')))) : null,
    h('p', { class: 'note' }, all.v ? `从 ${all.since} 开始攒，累计浏览 ${all.v} 次（共记录 ${all.days} 天）。GitHub 官方只留最近 14 天，所以这里自己攒了一份长账。` : ''),
    ...(refs.length ? [
      h('h3', { class: 'tvh' }, '从哪来'),
      h('div', { class: 'list' }, refs.map(x => h('div', { class: 'row static' },
        h('div', {}, h('b', {}, refName(x.r)), h('small', {}, `${x.u} 位访客`)),
        h('span', { class: 'chip' }, `${x.v} 次`)))),
    ] : []),
    h('p', { class: 'note' }, `数据来自 GitHub 官方统计，更新于 ${d.at}（每天 9:40 / 21:40 自动更新一次）。`),
    h('p', { class: 'note' }, '说明：算的是「有人打开这个网址」，离线做题不计入；所有页面都在同一个网址下，所以分不出是哪个孩子、哪一页。'),
    h('button', { class: 'btn ghost wide', style: 'margin-top:12px', onclick: () => trafficPage() }, '重新读取'),
  ];
}
export function trafficPage() {
  setTheme(null);
  const box = h('div', {}, h('p', { class: 'note' }, '正在读取…'));
  const back = () => { if (history.length > 1) history.back(); else nav('#/parent'); };
  mount(page('访问统计', box, { back }));
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem('kp_traffic') || 'null'); } catch (e) { cached = null; }
  fetch('data/traffic.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null).catch(() => null)
    .then(d => {
      const ok = d && d.at && !d.none;
      if (ok) { try { localStorage.setItem('kp_traffic', JSON.stringify(d)); } catch (e) { /* ignore */ } }
      if (box.isConnected) box.replaceChildren(...trafficView(ok ? d : cached));
    });
}
// ---------------- 使用须知：一台设备只弹一次，点过就永久记住 ----------------
// 存在 localStorage 里，并带上须知版本号（config.json 的 notice.ver）。
// 以后想让所有手机重新看一遍，只要把 ver 改成 2 就行，不用改代码。
const NOTICE_KEY = 'kp_notice_v';
const noticeVer = () => String(((X.cfg || {}).notice || {}).ver || 1);
export function noticeOk() {
  try { return localStorage.getItem(NOTICE_KEY) === noticeVer(); } catch (e) { return !!window.__kpNotice; }
}
// 家长页的「重新显示」按钮用：清掉记录，下次打开会再弹一次
export function noticeReset() {
  try { localStorage.removeItem(NOTICE_KEY); } catch (e) { window.__kpNotice = false; }
}
export function noticeGate(done) {
  const N = (X.cfg || {}).notice || {}, items = N.items || [];
  let closed = false;
  const close = () => {
    if (closed) return; closed = true;
    try { localStorage.setItem(NOTICE_KEY, noticeVer()); } catch (e) { window.__kpNotice = true; }
    done();
  };
  const box = h('div', { class: 'updbox' },
    h('div', { class: 'updt' }, '📢 ' + (N.title || '使用须知')),
    h('div', { class: 'updp' }, items.map((t, i) => h('p', { class: 'nw' }, h('b', {}, (i + 1) + '. '), t))),
    h('button', { class: 'btn primary', onclick: close }, '知道了，开始吧'),
    h('p', { class: 'updp small' }, '这条提示以后不会再弹了。想再看一遍，让家长到「家长专区」里看。'));
  mount(h('div', { id: 'ntcm' }, box));
}
export function login() {
  const inp = h('input', { class: 'big', placeholder: '输入你的年级或名字', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'go' });
  const msg = h('p', { class: 'msg' });
  // 「七年级」「七」「7年级」「7」都能对上；名字也照旧能用
  const norm = (s) => String(s || '').replace(/\s+/g, '').replace(/年级$/, '').replace(/[0-9]/g, d => '零一二三四五六七八九'[+d] || d);
  const enter = () => {
    const v = inp.value.trim();
    const u = X.cfg.users.find(x => x.names.some(n => norm(n) === norm(v))) || X.cfg.users.find(x => norm(x.grade) === norm(v));
    if (!u && X.cfg.parent && v.toLowerCase() === X.cfg.parent.name.toLowerCase()) { askPassword(); return; }
    if (!u) { msg.textContent = '没有找到这个年级或名字，再检查一下～'; return; }
    S.setUser(u.id); setTheme(u); nav('#/');
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') enter(); });
  setTheme(null);
  mount(h('div', { class: 'login' }, h('div', { class: 'logo' }, '⭐'), h('h1', {}, X.cfg.appName),
    h('p', { class: 'sub' }, '输入你的年级（比如：七年级），开始今天的练习'), inp,
    h('button', { class: 'btn primary wide', onclick: enter }, '开始'), msg,
    h('a', { class: 'link instl', href: '#/install' }, '📲 怎么把它装到手机桌面？'),
    h('a', { class: 'link instl', href: '#/help' }, '🩺 打不开 / 没声音 / 更新不了？看这里'),
    h('a', { class: 'link instl', href: '#/zone' }, '👨‍👩‍👧 家长专区：发金币 / 备份 / 打印试卷')));
}

// ---------------- 装到桌面教程（不用登录） ----------------
const standalone = () => { try { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; } catch (e) { return false; } };
export function install() {
  const u = user(), sec = (t, body) => h('section', { class: 'ins' }, h('h2', { class: 'sh' }, t), body);
  const ol = (...a) => h('ol', { class: 'steps' }, a.map(t => h('li', {}, t)));
  mount(page('装到手机桌面', [
    standalone() ? h('p', { class: 'note okbox' }, '✅ 你现在就是从桌面图标打开的，已经装好啦，不用再装。') : null,
    sec('装了有什么好处？', ol('点一下桌面图标就能开始，不用再找网址、不用登录页面翻来翻去。', '打开后是全屏的，像一个真正的 App，没有浏览器的网址栏，不容易分心。', '图标就是「书山小路」，和别的 App 放在一起，孩子自己能找到。', '打开更快；星星、错题和记录都留在这台手机里，不会丢。', '有新版本时会自动弹出「立即更新」，点一下就好。')),
    sec('第一步：用对浏览器', h('div', {}, h('p', {}, '不需要谷歌浏览器，也不需要下载任何东西。用手机自带的浏览器就行：'),
      h('p', { class: 'note' }, '苹果手机：用「Safari」（蓝色指南针图标）。'),
      h('p', { class: 'note' }, '安卓手机：用手机自带的浏览器（华为/荣耀「浏览器」、小米「浏览器」、OPPO/vivo「浏览器」等），或者夸克、UC、QQ 浏览器都可以。'),
      h('p', { class: 'note' }, '注意：不要在微信里直接装。在微信里点开链接后，点右上角「…」，选「在浏览器打开」（苹果选「在 Safari 中打开」），再往下做。'))),
    sec('苹果手机（iPhone）', ol('用 Safari 打开这个网址，进到登录页。', '点屏幕最下面中间的「分享」按钮（一个方框加向上的箭头）。', '往下滑，找到「添加到主屏幕」，点它。', '右上角点「添加」。桌面上就出现「书山小路」图标了。', '以后点这个图标打开，不要再用 Safari 打开网址。')),
    sec('安卓手机', h('div', {}, ol('用手机自带的浏览器打开这个网址，进到登录页。', '点浏览器的菜单（一般在右下角或右上角，是「☰」或「⋮」）。', '找「添加到桌面」（有的叫「添加到主屏幕」「添加快捷方式」「添加书签到桌面」，在「工具箱」或「更多」里）。', '确认名字是「书山小路」，点「添加」；如果弹出「允许创建快捷方式」，选「允许」。', '回到手机桌面，找到图标就行。'),
      h('p', { class: 'note' }, '不同品牌的菜单名字有一点差别，看到「桌面」两个字的选项就是它。找不到就在菜单里往下翻，或者问问身边用同款手机的人。'))),
    sec('电脑或平板', h('div', {}, h('p', { class: 'note' }, 'Windows 电脑：用自带的「Edge」浏览器打开，点右上角「…」→「应用」→「将此站点作为应用安装」。'),
      h('p', { class: 'note' }, '苹果电脑（Mac）：用 Safari 打开，点菜单栏「文件」→「添加到程序坞」。'),
      h('p', { class: 'note' }, 'iPad：和 iPhone 一样，用 Safari 的「分享」→「添加到主屏幕」。'))),
    sec('装好以后', ol('第一次装完，先用图标打开，登录输入名字，让它把内容加载好。', '之后没有网络也能做大部分题，听力和语音用手机自带的声音。', '如果换了新手机，或者图标不见了，重新照上面做一遍就行；换手机后星星会从零开始（记录只保存在每台手机里）。')),
    h('a', { class: 'btn primary wide', href: user() ? '#/' : '#/login' }, u ? '回首页' : '回登录页'),
  ], { back: u ? '#/' : '#/login' }));
}

// ---------------- 首页 ----------------
// 美文：这个孩子的语文科目里所有 kind=essay 的题集，每 3 天轮换一篇
export const essayList = (u) => (u.subjects || []).flatMap(id => { const s = subj(id); return s ? s.sets.filter(x => x.kind === 'essay') : []; });
export const essayNow = (u) => S.essayWindow(essayList(u));
// 每个任务点进去去哪儿：阅读/听力自动挑一套“做得最少”的，语文和英语的阅读隔天轮换
function taskTarget(u, t, ew) {
  const p = S.P(u.id), dn = Math.floor(Date.now() / 86400000);
  if (t.kind === 'rand') return '#/rand/' + (t.subs || [t.sub])[0];
  if (t.kind === 'learn') return '#/learn';
  if (t.kind === 'speak') { const id = (u.subjects || []).find(x => /speaking$/.test(x)); return id ? '#/s/' + id : '#/'; }
  if (t.kind === 'essay') return ew ? '#/set/' + ew.item.id : '#/';
  if (t.kind === 'cat') {
    const groups = (u.subjects || []).map(id => subj(id)).filter(Boolean).map(sb => sb.sets.filter(x => x.kind === t.cat)).filter(a => a.length);
    if (!groups.length) return '#/';
    const g = groups[dn % groups.length];
    const best = g.map((m, i) => ({ m, i, n: (p.sets[m.id] || { n: 0 }).n })).sort((a, b) => a.n - b.n || a.i - b.i)[0].m;
    return '#/set/' + best.id;
  }
  return '#/';
}
export function nextTask(u) {
  const tasks = (u && u.tasks) || []; if (!tasks.length) return null;
  const ew = essayNow(u), shown = tasks.filter(t => t.kind !== 'essay' || ew);
  for (const t of shown) if (S.taskDone(u.id, t, { window: ew }) < t.goal) return { label: t.kind === 'essay' ? '听美文' : t.label, href: taskTarget(u, t, ew), left: shown.filter(x => S.taskDone(u.id, x, { window: ew }) < x.goal).length };
  return null;
}
import { dueCount } from './learn.js';
// 今日复习卡片：把「该复习的单词」和「错后 3 天还没做对的错题」聚合在首页，
// 有到期内容才显示，不打扰没有欠账的日子
function reviewCard(u) {
  let words = 0; try { words = dueCount(u.id); } catch (e) { words = 0; }
  const p = S.P(u.id);
  const dt = new Date(); dt.setDate(dt.getDate() - 3);
  const lim = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  // 有 next 的按调度日期提醒（新记录）；老记录没有 next，退回「错后 3 天」的旧规则
  const stale = Object.values(p.wrong || {}).filter(e => e.next ? e.next <= S.today() : (e.d || '0000') <= lim).length;
  const rows = [];
  if (words) rows.push(h('a', { class: 'row', href: '#/learn/review' }, h('div', {}, h('b', {}, `🔁 单词复习 ${words} 个`), h('small', {}, '到了该再见一面的日子，记更牢')), h('span', { class: 'chip' }, '开始')));
  if (stale) rows.push(h('a', { class: 'row', href: '#/errors' }, h('div', {}, h('b', {}, `📕 错题复习 ${stale} 道`), h('small', {}, '到了该再见面的日子，答对一次、隔天再对就毕业')), h('span', { class: 'chip' }, '开始')));
  if (!rows.length) return null;
  return h('section', { class: 'tasks' }, h('h2', { class: 'sh' }, '今日复习'), h('div', { class: 'list' }, rows));
}
function taskCard(u) {
  const tasks = u.tasks || []; if (!tasks.length) return null;
  const ew = essayNow(u), shown = tasks.filter(t => t.kind !== 'essay' || ew);
  const done = shown.map(t => S.taskDone(u.id, t, { window: ew })), all = shown.every((t, i) => done[i] >= t.goal), nx = nextTask(u);
  return h('section', { class: 'tasks' }, h('h2', { class: 'sh' }, all ? '🎉 今天的任务都完成啦' : '今天做什么'),
    nx ? h('a', { class: 'btn primary wide gobtn', href: nx.href }, `▶ 开始：${nx.label}`) : h('p', { class: 'note' }, '真棒！还想多练的话，往下选一个就行。'),
    shown.map((t, i) => {
      const ok = done[i] >= t.goal, label = t.kind === 'essay' ? `听美文《${ew.item.title.replace(/^《|》$/g, '')}》（${ew.end.slice(5)} 前）` : t.label;
      return h('a', { class: 'task' + (ok ? ' done' : ''), href: taskTarget(u, t, ew) }, h('span', { class: 'tk' }, ok ? '✅' : '⬜'), h('span', { class: 'tl' }, label), h('span', { class: 'tn' }, `${Math.min(done[i], t.goal)}/${t.goal}${t.minutes ? ' 分钟' : ''}`));
    }));
}
export const coinsGot = (rewards, pos) => rewards.filter(r => pos >= r.stars).reduce((a, r) => a + (r.coins || 0), 0);
// 自检结果横幅：app 每天自动检查一次文件，有缺的就在首页亮红条
function healthBanner() {
  try { const r = JSON.parse(localStorage.getItem('kp_hc') || 'null'); if (!r || !r.bad || !r.bad.length) return null;
    return h('a', { class: 'hcbar', href: '#/check', style: 'display:block;margin:8px 0;padding:10px 12px;border-radius:12px;background:#c0392b;color:#fff;text-decoration:none;font-size:14px' }, `⚠️ 有 ${r.bad.length} 个文件没找到，部分内容可能打不开。点这里看看，并告诉爸爸。`);
  } catch (e) { return null; }
}
export function home() {
  const u = user(), st = S.stats(u.id), p = S.P(u.id);
  const rewards = (X.cfg.rewards || []).slice().sort((a, b) => a.stars - b.stars);
  const cy = cycle(st.total), next = rewards.find(r => r.stars > cy.pos), G = goal(), pct = Math.min(100, cy.pos / G * 100);
  const marks = h('div', { class: 'marks' }, rewards.map(r => h('span', { class: 'mk' + (cy.pos >= r.stars ? ' on' : ''), style: `left:${Math.min(100, r.stars / G * 100)}%` }, r.stars)));
  const jar = h('section', { class: 'jar' },
    h('div', { class: 'jar-top' }, h('div', { class: 'jar-n' }, '⭐ ', h('b', {}, cy.pos), h('small', {}, ` / ${G}`)), h('div', { class: 'jar-s' }, `今天 +${st.today}/${cap()}` + (S.streak(u.id) ? ` · 🔥连续 ${S.streak(u.id)} 天` : ''))),
    h('div', { class: 'bar' }, h('i', { style: `width:${pct}%` })), marks,
    h('p', { class: 'jar-t' }, next ? `再得 ${next.stars - cy.pos} 颗星，就能得 ${next.label}（找家长领取）` : '这一轮满啦！再得一颗星，进度条就重新开始。'),
    coinsGot(rewards, cy.pos) ? h('p', { class: 'jar-t' }, `🪙 这一轮已达成 ${coinsGot(rewards, cy.pos)} 个金币，${S.coinGivenLap(u.id, cy.laps, G) ? '家长已经发放啦' : '找家长领取'}`) : null,
    cy.laps ? h('p', { class: 'jar-t' }, `已完成 ${cy.laps} 轮（每轮 ${rewards.reduce((a, r) => a + (r.coins || 0), 0)} 个金币）`) : null,
    st.today >= cap() ? h('p', { class: 'jar-t' }, '今天的星星拿满啦，明天再来～') : null);
  const subjectCards = u.subjects.map(id => {
    const s = subj(id); if (!s || !s.sets.length) return null;
    const speak = s.sets[0].kind === 'speaking';
    const em = speak ? `已打卡 ${Object.keys(p.speak).filter(k => s.sets.some(x => k.startsWith(x.id + '-'))).length}/${s.sets.reduce((a, x) => a + (x.count || 5), 0)} 天` : `${s.sets.filter(x => p.sets[x.id]).length}/${s.sets.length} 已完成`;
    const card = h('a', { class: 'card', href: '#/s/' + id }, h('span', { class: 'ic' }, s.icon), h('b', {}, s.title), h('small', {}, s.desc), h('em', {}, em));
    card._area = /math/.test(id) ? 'math' : /chinese/.test(id) ? 'cn' : 'eng'; return card;
  }).filter(Boolean);
  const randCards = (u.random || []).map(k => {
    const R = RANDOM[k]; const card = h('a', { class: 'card alt', href: '#/rand/' + k }, h('span', { class: 'ic' }, R.icon), h('b', {}, R.title), h('small', {}, /^cnw/.test(k) ? '听词语，写在纸上' : '随机出题，不重样'), h('em', {}, `今天 ${S.starsToday(u.id)}/${cap()} 颗`));
    card._area = /^(math|chap)/.test(k) ? 'math' : /^cn/.test(k) ? 'cn' : 'eng'; return card;
  });
  const hasEng = (u.subjects || []).some(x => /reading$|listening$/.test(x)) && (u.random || []).some(k => /^vocab/.test(k));
  const learnCard = hasEng ? Object.assign(h('a', { class: 'card', href: '#/learn' }, h('span', { class: 'ic' }, '🃏'), h('b', {}, '单词卡片'), h('small', {}, '先学一学，再去测'), h('em', {}, '看词·听音·记意思')), { _area: 'eng' }) : null;
  const ew0 = essayNow(u);
  const essayCard = ew0 ? Object.assign(h('a', { class: 'card', href: '#/set/' + ew0.item.id }, h('span', { class: 'ic' }, '🌸'), h('b', {}, '听美文'), h('small', {}, '《' + String(ew0.item.title || '').replace(/^《|》$/g, '') + '》'), h('em', {}, ew0.end.slice(5) + ' 前听完')), { _area: 'cn' }) : null;
  const areas = [['math', '📐 数学'], ['cn', '📖 语文'], ['eng', '🔤 英语']].map(([a, t0]) => {
    const pub = (u.publishers || {})[a], t = pub ? `${t0}（${pub}）` : t0;
    const cs = [...(learnCard ? [learnCard] : []), ...(essayCard ? [essayCard] : []), ...subjectCards, ...randCards].filter(c => c._area === a); if (!cs.length) return null;
    return [h('h2', { class: 'sh' }, t), h('div', { class: 'grid' }, cs)];
  });
  const wrongN = st.wrong;
  mount(h('div', { class: 'page home' },
    h('header', { class: 'hello' }, h('div', {}, h('small', {}, '你好，'), h('h1', {}, u.display + ' 👋', u.grade ? h('span', { class: 'grade' }, u.grade) : null)), h('div', { class: 'hbtns' }, h('button', { class: 'link', onclick: () => { const f = ((p.font || 0) + 1) % 3; p.font = f; S.save(u.id); setTheme(u); toast(['字号：标准', '字号：大', '字号：特大'][f]); } }, 'Aa'), h('button', { class: 'link', onclick: () => { if (confirm('切换同学？')) { S.setUser(null); nav('#/login'); } } }, '切换'))),
    healthBanner(), jar, taskCard(u), reviewCard(u),
    u.soon && !u.subjects.length ? h('section', { class: 'soonbox' }, h('div', { class: 'logo' }, '🌱'), h('h2', {}, `${u.grade}的练习正在准备中`), h('p', { class: 'note' }, '课本内容马上就来，先把这个小窝准备好啦。')) : null,
    u.tasks && u.tasks.length ? h('p', { class: 'more' }, '想多练一点？从下面自己选：') : null,
    areas,
    h('h2', { class: 'sh' }, '我的'),
    h('div', { class: 'grid' },
      h('a', { class: 'card plain', href: '#/badges' }, h('span', { class: 'ic' }, '🏅'), h('b', {}, '成就徽章'), h('small', {}, '拿到就永远是你的'), h('em', {}, `${B.unlockedCount(u.id)}/${B.totalCount(u.id)}`)),
      h('a', { class: 'card plain', href: '#/errors' }, h('span', { class: 'ic' }, '📒'), h('b', {}, '错题本'), h('small', {}, wrongN ? '做错的题在这里再练' : '现在是空的，真棒'), wrongN ? h('em', { class: 'badge' }, wrongN + ' 道') : null),
      h('a', { class: 'card plain', href: '#/me' }, h('span', { class: 'ic' }, '📊'), h('b', {}, '我的记录'), h('small', {}, '星星、进度、发给家长'))),
    standalone() ? null : h('a', { class: 'link instl', href: '#/install' }, '📲 装到手机桌面，打开更方便')));
}

// ---------------- 语文：按单元学 ----------------
const unitDone = (p, ms) => ms.length && ms.every(m => p.sets[m.id]);
export function cnSubject(id) {
  const u = user(), s = subj(id), p = S.P(u.id);
  const unitName = (x) => (X.lib.unitNames && X.lib.unitNames[x]) || x;
  const order = Object.keys(X.lib.unitNames || {});
  const units = [...new Set(s.sets.filter(m => m.unit && m.unit !== 'E').map(m => m.unit))].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const msOf = (x) => s.sets.filter(m => m.unit === x && m.kind !== 'essay');
  const cur = units.find(x => !unitDone(p, msOf(x))) || units[0];
  const row = (x) => { const ms = msOf(x), n = ms.filter(m => p.sets[m.id]).length;
    return h('a', { class: 'row' + (x === cur ? ' cur' : ''), href: `#/unit/${id}/${x}` }, h('div', {}, h('b', {}, unitName(x)), h('small', {}, n === ms.length ? '都做过啦 ✅' : `做了 ${n}/${ms.length} 套`)), h('span', { class: 'chip' + (n === ms.length ? ' ok' : '') }, n === ms.length ? '再看看' : (x === cur ? '继续' : '去学'))); };
  const doneUnits = units.filter(x => x !== cur && unitDone(p, msOf(x))), openUnits = units.filter(x => x !== cur && !doneUnits.includes(x));
  const essay = s.sets.filter(m => m.kind === 'essay').length;
  mount(page(s.title, [
    cur ? h('a', { class: 'btn primary wide gobtn', href: `#/unit/${id}/${cur}` }, `▶ 继续：${unitName(cur)}`) : null,
    h('p', { class: 'note' }, '每个单元三步：学一学 → 练一练 → 读一读。'),
    cur ? h('div', { class: 'list' }, row(cur)) : null,
    openUnits.length ? [h('h2', { class: 'sh' }, '后面的单元'), h('div', { class: 'list' }, openUnits.map(row))] : null,
    doneUnits.length ? h('details', { class: 'ctx' }, h('summary', {}, `已学完的单元（${doneUnits.length}）`), h('div', { class: 'list' }, doneUnits.map(row))) : null,
    h('h2', { class: 'sh' }, '随时可以'),
    h('div', { class: 'list' },
      essay ? h('a', { class: 'row', href: '#/s/' + id + '/essay' }, h('div', {}, h('b', {}, '🌸 听美文'), h('small', {}, `${essay} 篇，听一听，学好词好句`)), h('span', { class: 'chip' }, '去听')) : null),
  ]));
}
export function cnEssays(id) {
  const u = user(), s = subj(id), p = S.P(u.id);
  mount(page('听美文', [h('p', { class: 'note' }, '一篇一篇听，听完学好词好句，再做小题。'), h('div', { class: 'list' }, s.sets.filter(m => m.kind === 'essay').map(m => { const rec = p.sets[m.id]; return h('a', { class: 'row', href: '#/set/' + m.id }, h('div', {}, h('b', {}, m.title), h('small', {}, m.subtitle)), h('span', { class: 'chip' + (rec ? ' ok' : '') }, rec ? '听过' : '没听过')); }))], { back: '#/s/' + id }));
}
export function unitPage(id, x) {
  const u = user(), s = subj(id), p = S.P(u.id), name = (X.lib.unitNames && X.lib.unitNames[x]) || x;
  const ms = s.sets.filter(m => m.unit === x && m.kind !== 'essay');
  const rowOf = (m) => { const rec = p.sets[m.id]; return h('a', { class: 'row', href: '#/set/' + m.id }, h('div', {}, h('b', {}, m.title), h('small', {}, m.subtitle)), h('span', { class: 'chip' + (rec ? ' ok' : '') }, rec ? `上次 ${rec.last.ok}/${rec.last.total}` : '未做')); };
  const practice = ms.filter(m => m.kind !== 'reading'), reads = ms.filter(m => m.kind === 'reading');
  const learn = [];
  if ((/^g4/.test(id) && /^Y[1-8]$/.test(x)) || (/^g2/.test(id) && /^W[1-8]$/.test(x))) learn.push(h('a', { class: 'row', href: '#/words/' + (/^g2/.test(id) ? 'cnw2' : 'cnw4') + '/' + x }, h('div', {}, h('b', {}, '📖 本单元词语'), h('small', {}, '点一点，听手机读')), h('span', { class: 'chip' }, '去学')));
  learnHook(learn, id, x, ms, p);
  mount(page(name, [
    learn.length ? [h('h2', { class: 'sh' }, '① 学一学'), h('div', { class: 'list' }, learn)] : null,
    practice.length ? [h('h2', { class: 'sh' }, '② 练一练'), h('div', { class: 'list' }, practice.map(rowOf))] : null,
    reads.length ? [h('h2', { class: 'sh' }, '③ 读一读'), h('div', { class: 'list' }, reads.map(rowOf))] : null,
    ms.some(m => m.kind === 'cn') ? [h('h2', { class: 'sh' }, '④ 测一测'), h('div', { class: 'list' }, h('a', { class: 'row', href: '#/utest/cn/' + id + '/' + x }, h('div', {}, h('b', {}, '📝 单元小测'), h('small', {}, '从本单元的题里随机抽 10 题，做完看分数')), h('span', { class: 'chip' }, '去测')))] : null,
  ], { back: '#/s/' + id }));
}
// 单元小测：语文从本单元的题里随机抽 10 题（阅读理解跳过，因为要配原文）
export async function unitTest(kind, a, b) {
  const u = user();
  if (kind === 'cn') {
    const s2 = subj(a), x = b, name = (X.lib.unitNames && X.lib.unitNames[x]) || x;
    mount(page('单元小测', h('p', { class: 'note' }, '出题中…'), { back: '#/unit/' + a + '/' + x }));
    const ms = s2.sets.filter(m => m.unit === x && m.kind === 'cn'); let pool = [];
    for (const m of ms) { try { const st = await loadSet(m.id); if (st.passage) continue; st.sections.forEach(sec => sec.questions.forEach(q => pool.push(q))); } catch (e) { /* 单个题集失败不影响整体 */ } }
    const sh = (arr) => { arr = arr.slice(); for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    const run = () => {
      const qs = JSON.parse(JSON.stringify(sh(pool).slice(0, 10)));
      qs.forEach(q => { if (q.type !== 'choice' || !q.options) return; const right = q.options['ABCDEFG'.indexOf(q.answer)], o = sh(q.options); q.options = o; q.answer = 'ABCDEFG'[o.indexOf(right)]; });
      mount(runQuiz({ uid: u.id, mk: 'cnknow', mode: 'exam', title: name + ' 单元小测', subtitle: `${qs.length} 题，做完看分数`, sections: [{ title: '', questions: qs }], recTitle: name + ' 单元小测',
        back: '#/unit/' + a + '/' + x, metaFor: () => ({ title: name + ' 单元小测', src: 'rand', sub: a, kind: 'rand' }), again: run }));
    };
    if (!pool.length) { toast('这个单元还没有小测题'); nav('#/unit/' + a + '/' + x); return; }
    run(); return;
  }
}
let learnHook = () => {};
export const setLearnHook = (f) => { learnHook = f; };

// ---------------- 科目页 ----------------
export function subject(id, sub) {
  if (/chinese$/.test(id)) return sub === 'essay' ? cnEssays(id) : cnSubject(id);

  const u = user(), s = subj(id), p = S.P(u.id);
  const unitsPresent = [...new Set(s.sets.filter(m => m.unit).map(m => m.unit))];
  const unitName = (x) => (X.lib.unitNames && X.lib.unitNames[x]) || x;
  const sel = new Set(S.getUnits(u.id, 'sub-' + id, []));
  const rowOf = (m) => {
    let chip;
    if (m.kind === 'speaking') { const n = Object.keys(p.speak).filter(k => k.startsWith(m.id + '-')).length; chip = h('span', { class: 'chip' + (n ? ' ok' : '') }, n ? `${n}/${m.count || 5} 天` : '开始'); }
    else { const rec = p.sets[m.id]; chip = rec ? h('span', { class: 'chip ok' }, `上次 ${rec.last.ok}/${rec.last.total}`) : h('span', { class: 'chip' }, '未做'); }
    return h('a', { class: 'row', href: (m.kind === 'speaking' ? '#/speak/' : '#/set/') + m.id }, h('div', {}, h('b', {}, m.title), h('small', {}, m.subtitle)), chip);
  };
  const listBox = h('div', {});
  const draw = () => {
    const show = (m) => !m.unit || !sel.size || sel.has(m.unit);
    const nodes = [];
    const plain = s.sets.filter(m => !m.unit && show(m));
    if (plain.length) nodes.push(h('div', { class: 'list' }, plain.map(rowOf)));
    unitsPresent.filter(x => !sel.size || sel.has(x)).forEach(x => {
      const ms = s.sets.filter(m => m.unit === x); nodes.push(h('h2', { class: 'sh' }, unitName(x)), h('div', { class: 'list' }, ms.map(rowOf)));
    });
    listBox.replaceChildren(...nodes);
  };
  const chips = unitsPresent.length ? h('div', {}, h('div', { class: 'chips' }, h('span', { class: 'lab' }, '选单元（不选就是全部）')),
    h('div', { class: 'chips' }, unitsPresent.map(x => { const b = h('button', { type: 'button', class: 'chipb' + (sel.has(x) ? ' on' : ''), onclick: () => { sel.has(x) ? sel.delete(x) : sel.add(x); b.classList.toggle('on', sel.has(x)); S.setUnits(u.id, 'sub-' + id, [...sel]); draw(); } }, unitName(x)); return b; }))) : null;
  mount(page(s.title, [chips, listBox]));
  draw();
}

// ---------------- 原文 / 听力 ----------------
function passageNode(set) {
  const box = h('section', { class: 'passage' });
  if (set.dialogue) set.dialogue.forEach(l => box.append(h('p', { class: 'dlg' }, h('b', {}, l.s + ': '), l.t)));
  else (set.passage || []).forEach(t => box.append(h('p', {}, t)));
  if (set.vocab) box.append(vocabNode(set.vocab));
  return box;
}
function transcriptNode(set) {
  const box = h('div', { class: 'script' });
  set.transcript.forEach(l => box.append(set.transcript.length === 1 ? h('p', {}, l.t) : h('p', {}, h('b', {}, l.s + ': '), l.t)));
  return box;
}
function listenNode(set, withScript) {
  const box = h('section', { class: 'listen' }, h('h3', {}, '🎧 听力'));
  {
    let rate = 0.9;
    const status = h('p', { class: 'hint' }, '先看题，再点播放。每次会读两遍，听的时候不要看原文。');
    const play = (r) => { rate = r; status.textContent = '正在播放…（读两遍）'; playScript(set.transcript, set.speakers, { rate: r, times: 2, onend: () => { status.textContent = '读完啦。想再听就再点一次。'; } }); };
    box.append(h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn primary', onclick: () => play(0.9) }, '▶ 播放（读两遍）'), h('button', { type: 'button', class: 'btn ghost', onclick: () => play(0.7) }, '🐢 慢一点'), h('button', { type: 'button', class: 'btn ghost', onclick: () => { stopScript(); status.textContent = '已停止。'; } }, '■ 停')), status);
  }
  if (withScript) box.append(h('details', { class: 'ctx', open: true }, h('summary', {}, '听力原文'), transcriptNode(set)));
  return box;
}

// ---------------- 试卷听力（扫二维码进入，不用登录，不显示原文） ----------------
export async function hear(id) {
  let set; try { set = await loadSet(id); } catch (e) { set = null; }
  if (!set || !set.transcript) { mount(h('div', { class: 'page' }, h('h1', {}, '没有找到这段听力'), h('p', { class: 'hint' }, '请确认二维码是最新的，或者联网后再试。'))); return; }
  const status = h('p', { class: 'hint' }, '先看试卷上的题，再点「播放」。每次读两遍，听的时候不要看原文。');
  const play = (r) => { status.textContent = '正在播放…（读两遍）'; playScript(set.transcript, set.speakers, { rate: r, times: 2, onend: () => { status.textContent = '读完啦。想再听就再点一次。'; } }); };
  mount(h('div', { class: 'page hear' }, h('h1', {}, '🎧 听力：' + set.title), h('p', { class: 'hint' }, '只能听，不显示原文。'),
    h('button', { type: 'button', class: 'btn primary wide big', onclick: () => play(0.9) }, '▶ 播放（读两遍）'),
    h('button', { type: 'button', class: 'btn ghost wide', onclick: () => play(0.7) }, '🐢 慢一点再听'),
    h('button', { type: 'button', class: 'btn ghost wide', onclick: () => { stopScript(); status.textContent = '已停止。'; } }, '■ 停'), status));
}

// ---------------- 题库套题 ----------------
export async function setView(id) {
  const set = await loadSet(id);
  if (set.kind === 'essay') return startEssay(set);
  startBank(set);
}
// ---------------- 美文听读：先听，再看好词好句，最后做小题 ----------------
function startEssay(set) {
  const u = user(), sm = setMeta(set.id), P = set.paras || [];
  const state = h('p', { class: 'note' }, '准备好了就点「开始听」。听的时候先不看原文，闭上眼睛想象画面。');
  const textBox = h('section', { class: 'passage essaytext', hidden: true }, P.map(t => h('p', {}, t)));
  const playBtn = h('button', { class: 'btn primary wide', onclick: () => {
    playBtn.textContent = '正在朗读…（点这里重听）'; state.textContent = '听一听，哪些词语、句子让你觉得很美？';
    playScript(P.map(t => ({ t, s: '' })), {}, { lang: 'zh-CN', times: 1, rate: 0.82, pause: 900, onend: () => { playBtn.textContent = '🔁 再听一遍'; state.textContent = '听完啦！可以看原文，再学一学好词好句，然后做小题。'; textBtn.disabled = false; } });
  } }, '▶ 开始听');
  const textBtn = h('button', { class: 'btn ghost wide', style: 'margin-top:10px', onclick: () => { textBox.hidden = !textBox.hidden; textBtn.textContent = textBox.hidden ? '📖 看原文' : '收起原文'; } }, '📖 看原文');
  const words = h('section', {}, h('h2', { class: 'sh' }, '好词'), h('div', { class: 'chips' }, (set.words || []).map(w => h('span', { class: 'chip' }, w))),
    h('h2', { class: 'sh' }, '好句'), h('div', { class: 'list' }, (set.sents || []).map(x => h('div', { class: 'row static' }, h('div', {}, h('b', {}, x[0]), x[1] ? h('small', {}, x[1]) : null),
      h('button', { type: 'button', class: 'spk', onclick: () => playScript([{ t: x[0], s: '' }], {}, { lang: 'zh-CN', times: 1, rate: 0.8 }) }, '🔊')))));
  const go = h('button', { class: 'btn primary wide', style: 'margin-top:14px', onclick: () => {
    stopScript();
    mount(runQuiz({ uid: u.id, mk: 'cnread', mode: 'exam', title: set.title, subtitle: '美文小题', ctxFn: (done) => h('details', { class: 'ctx', open: !done }, h('summary', {}, '📖 原文'), h('section', { class: 'passage' }, P.map(t => h('p', {}, t)))),
      sections: set.sections, recId: set.id, back: '#/set/' + set.id,
      metaFor: () => ({ setId: set.id, title: set.title, src: 'bank', sub: sm.subject.id, kind: 'essay' }), again: () => startEssay(set) }));
  } }, '做小题（算今天的美文任务）');
  mount(page(set.title, [h('p', { class: 'subtitle' }, set.subtitle || ''), state, playBtn, textBtn, textBox, words, go], { back: '#/s/' + sm.subject.id }));
}
// 新题集（带单元）：每次做选择题时打乱选项顺序，重做时不会一模一样
function shuffled(set) {
  if (!set.unit) return set;
  const out = JSON.parse(JSON.stringify(set));
  out.sections.forEach(sec => sec.questions.forEach(q => {
    if (q.type !== 'choice' || !q.options || q.keepOrder) return;
    const right = q.options['ABCDEFG'.indexOf(q.answer)], opts = q.options.slice();
    for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
    q.options = opts; q.answer = 'ABCDEFG'[opts.indexOf(right)];
  }));
  return out;
}
function startBank(set0) {
  const set = shuffled(set0), u = user(), sm = setMeta(set.id);
  const ctxFn = (done) => set.kind === 'listening' ? listenNode(set, done) : (set.kind === 'reading' || (set.kind === 'cn' && set.passage)) ? (done ? h('details', { class: 'ctx' }, h('summary', {}, '📖 原文'), passageNode(set)) : passageNode(set)) : set.tip ? h('div', { class: 'tip' }, '💡 ' + set.tip) : null;
  mount(runQuiz({
    uid: u.id, mk: set.mk ? set.mk : set.kind === 'reading' ? 'reading#' + (String(set.id).split('-').pop()) : set.kind === 'listening' ? 'listening' : 'mathbank', title: set.title, subtitle: set.subtitle, ctxFn, sections: set.sections, recId: set.id,
    back: '#/s/' + sm.subject.id, printHref: '#/print/' + set.id,
    metaFor: () => ({ setId: set.id, title: set.title, src: 'bank', sub: sm.subject.id, kind: set.kind }),
    again: () => startBank(set0),
  }));
}

// ---------------- 重点词：音标 + 发音 ----------------
const ipaFor = (en) => {
  const m = X.ipa || {}, t = m[en] || m[en.toLowerCase()]; if (t) return t;
  const parts = en.split(/\s+/).map(w => m[w] || m[w.toLowerCase()]);
  return parts.length && parts.every(Boolean) ? parts.join(' ') : '';
};
function vocabNode(str) {
  const items = String(str).split(/\s*·\s*/).map(part => { const m = part.trim().match(/^(.*?)\s*([（(]?[\u4e00-\u9fff].*)$/); return m ? { en: m[1].trim(), zh: m[2].trim() } : { en: part.trim(), zh: '' }; }).filter(x => x.en);
  return h('div', { class: 'vocab vlist' }, h('b', {}, '重点词（点一下听发音）'),
    h('div', { class: 'vwrap' }, items.map(it => { const ip = ipaFor(it.en); return h('button', { type: 'button', class: 'vchip', onclick: () => playSay(slug(it.en), it.en, X.audio) },
      h('span', { class: 've' }, it.en), ip ? h('span', { class: 'ipa sm' }, '/' + ip + '/') : null, h('span', { class: 'vz' }, it.zh)); })));
}

// ---------------- 答题引擎 ----------------
const mathish = (q) => !q.plain && (q.type === 'math' || String(q.id).startsWith('r-'));
const stemHtml = (q) => (mathish(q) ? mathHtml(q.stem) : esc(q.stem));
const speakRow = (q) => h('div', { class: 'speakrow' },
  q.say ? h('button', { type: 'button', class: 'spk', onclick: () => playSay(q.sayKey, q.say, X.audio) }, '🔊 听发音') : null,
  q.ipaQ ? h('span', { class: 'ipa' }, '/' + q.ipaQ + '/') : null,
  q.bold ? h('span', { class: 'bmark' }, '★ 重点词，要会拼写') : null);

function ctxDetails(meta) {
  const body = h('div', { class: 'ctxbody' }); let loaded = false;
  return h('details', { class: 'ctx', ontoggle: async (e) => {
    if (e.target.open && !loaded) { loaded = true; try { const set = await loadSet(meta.setId); body.append(set.kind === 'listening' ? listenNode(set, true) : passageNode(set)); } catch (err) { body.textContent = '原文加载失败'; } }
  } }, h('summary', {}, meta.kind === 'listening' ? '🎧 听力和原文' : '📖 看原文'), body);
}

function renderQ(q, no, ans, update) {
  const box = h('article', { class: 'q', id: 'q-' + q.id });
  const setA = (v) => { ans[q.id] = v; update(); };
  const head = (html) => h('div', { class: 'stem' }, h('span', { class: 'no' }, no), h('div', { class: 'qt', html }));
  if (q.type === 'choice') {
    box.append(head(stemHtml(q)));
    if (q.say || q.bold) box.append(speakRow(q));
    const btns = q.options.map((t, k) => h('button', { type: 'button', class: 'opt', onclick: () => { btns.forEach((x, j) => x.classList.toggle('on', j === k)); setA('ABCD'[k]); } }, h('b', {}, 'ABCD'[k]), h('span', {}, t)));
    box.append(h('div', { class: 'opts' }, btns));
  } else if (q.type === 'tf') {
    box.append(head(esc(q.stem)));
    const mk = (v, label) => h('button', { type: 'button', class: 'opt tfb', onclick: (e) => { bs.forEach(x => x.classList.remove('on')); e.currentTarget.classList.add('on'); setA(v); } }, label);
    const bs = [mk('T', '对  T'), mk('F', '错  F')];
    box.append(h('div', { class: 'opts two' }, bs));
  } else if (q.type === 'fill') {
    if (q.hint) box.append(h('span', { class: 'pill' }, q.hint));
    if (q.say || q.bold) box.append(speakRow(q));
    const parts = q.stem.split(/_{2,}/), inputs = [];
    const line = h('div', { class: 'qt fillq' });
    const read = () => setA(inputs.map(e => e.value));
    parts.forEach((txt, i) => {
      line.append(txt);
      if (i < parts.length - 1) {
        let el;
        if (q.bank && q.bankMode === 'select') el = h('select', { class: 'blank sel', onchange: read }, h('option', { value: '' }, '选词'), q.bank.map(w => h('option', { value: w }, w)));
        else if (q.tiles && /^[A-Za-z ]+$/.test(q.tiles)) {
          // 字母格子：一个字母一格，用自己的字母键盘输入（不会弹出手机输入法，也不会被自动纠错）
          const inp = h('input', { class: 'mi abcin', readonly: true, inputmode: 'none', 'aria-label': '答案' });
          inp.dataset.kb = 'abc'; inp.dataset.len = String(q.tiles.length); inp.dataset.pat = q.tiles;
          const tiles = h('div', { class: 'tiles', role: 'button', tabindex: 0 });
          const draw = () => {
            const v = inp.value, foc = inp.classList.contains('focus'); let li = 0;
            tiles.replaceChildren(...[...q.tiles].map((c, k) => c === ' ' ? h('span', { class: 'tgap' }) : h('span', { class: 'tile' + (v[k] && v[k] !== ' ' ? ' f' : '') + (foc && k === v.length ? ' cur' : '') + (q.tiles[0] === c && k === 0 && !v ? ' first' : '') }, v[k] || '')));
          };
          const open = () => { if (!inp.disabled) keypad.open(inp, 'abc'); };
          tiles.addEventListener('click', open); tiles.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
          inp.addEventListener('input', () => { draw(); read(); }); inp.addEventListener('kbfocus', draw);
          draw(); inputs.push(inp); line.append(tiles, inp); return;
        }
        else { const len = Math.max(...q.answers[i].map(s => [...s].reduce((a, c) => a + (c.charCodeAt(0) > 255 ? 2 : 1), 0))); el = h('input', { class: 'blank', type: 'text', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', style: `width:${Math.max(6, len + 3)}ch`, oninput: read }); }
        inputs.push(el); line.append(el);
      }
    });
    box.append(h('div', { class: 'stem' }, h('span', { class: 'no' }, no), line));
  } else if (q.type === 'short') {
    box.append(head(esc(q.stem)));
    box.append(h('input', { class: 'blank wide', type: 'text', placeholder: '写下你的答案（英文）', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', oninput: (e) => setA(e.target.value) }));
  } else if (q.type === 'math') {
    box.append(head(mathHtml(q.stem) + (q.stem.length < 60 && !/[=＝？?]/.test(q.stem) ? ' = ？' : '')));
    if (q.kindName) box.append(h('span', { class: 'pill' }, q.kindName));
    const inp = h('input', { class: 'mi', readonly: true, inputmode: 'none', placeholder: '点这里输入答案', oninput: () => setA(inp.value) });
    inp.dataset.full = q.digits ? '0' : '1'; if (q.digits && /^[0-9]{1,9}$/.test(String(q.answer))) inp.dataset.len = String(String(q.answer).length);
    inp.addEventListener('click', () => keypad.open(inp, !q.digits));
    box.append(inp);
  }
  if (q._meta && (q._meta.kind === 'reading' || q._meta.kind === 'listening') && q._meta.setId) box.append(ctxDetails(q._meta));
  return box;
}

// 静默检查：有问题的题直接跳过，不让整套练习崩掉
export function validQ(q) {
  try {
    if (!q || !q.id || !String(q.stem || '').trim()) return false;
    if (q.type === 'choice') return Array.isArray(q.options) && q.options.length >= 2 && new Set(q.options).size === q.options.length && /^[A-Z]$/.test(q.answer) && q.answer.charCodeAt(0) - 65 < q.options.length;
    if (q.type === 'tf') return q.answer === 'T' || q.answer === 'F';
    if (q.type === 'fill') return Array.isArray(q.answers) && q.answers.length > 0 && q.answers.every(a => Array.isArray(a) && a.length);
    if (q.type === 'short') return Array.isArray(q.accept) && q.accept.length > 0;
    if (q.type === 'math') return String(q.answer || '').trim() !== '';
    return false;
  } catch (e) { return false; }
}
// 做题方式：整套交卷（exam）/ 边做边看（live）。默认值按内容类型和孩子在 config 里设置，孩子可以自己换
const modeOf = (uid, mk) => {
  if (!mk) return 'exam';
  const base = mk.split('#')[0], pref = (S.P(uid).modes || {})[base];
  if (pref) return pref;
  const u = (X.cfg.users || []).find(x => x.id === uid), m = (u && u.modes) || {};
  return m[mk] || m[base] || 'exam';
};
function runQuiz(o) {
  o.t0 = o.t0 || Date.now();
  o = { ...o, sections: o.sections.map(sec => ({ ...sec, questions: sec.questions.filter(validQ) })).filter(sec => sec.questions.length) };
  const live = (o.mode || modeOf(o.uid, o.mk)) === 'live';
  const ans = {}, qs = [], done = {}, nodes = {};
  const info = h('span', { class: 'info' });
  const submit = h('button', { class: 'btn primary', onclick: finish }, live ? '看结果' : '交卷');
  const confirmBtns = [];
  const update = () => {
    const n = qs.filter(q => isAnswered(q, ans[q.id])).length; info.textContent = live ? `已确认 ${Object.keys(done).length} / ${qs.length}` : `已答 ${n} / ${qs.length}`;
    submit.classList.toggle('ready', live ? Object.keys(done).length === qs.length : n === qs.length);
    confirmBtns.forEach(([q, b]) => { b.disabled = !isAnswered(q, ans[q.id]); });
  };
  // 判分并记录（每题只记一次：发星星、进错题本）
  function settle(q) {
    if (done[q.id]) return done[q.id];
    const g = gradeQuestion(q, ans[q.id]), meta = o.metaFor(q), { _meta, ...clean } = q;
    const r = { q, a: ans[q.id], g };
    if (String(q.id).startsWith('r-') && q.typeId) S.typeStat(o.uid, q.typeId, g.ok);
    if (g.ok) { r.gone = S.rightWrong(o.uid, q.id); r.star = S.award(o.uid, q, meta.src, meta.sub, cap()); } else S.addWrong(o.uid, clean, meta);
    done[q.id] = r; return r;
  }
  const modeBar = o.mk ? h('div', { class: 'chips modebar' }, h('span', { class: 'lab' }, '做题方式'),
    ...[['exam', '整套交卷'], ['live', '边做边看']].map(([v, n]) => h('button', { type: 'button', class: 'chipb' + ((live ? 'live' : 'exam') === v ? ' on' : ''), onclick: () => {
      if (v === (live ? 'live' : 'exam')) return;
      if (Object.keys(ans).length) { toast('已经开始做了，下一套再换方式'); return; }
      const P = S.P(o.uid); P.modes = P.modes || {}; P.modes[o.mk.split('#')[0]] = v; S.save(o.uid); mount(runQuiz({ ...o, mode: v }));
    } }, n))) : null;
  const secs = o.sections.map(sec => {
    const box = h('section', { class: 'sec' });
    if (sec.title) box.append(h('h2', {}, sec.title));
    if (sec.bank && sec.bankMode) box.append(h('p', { class: 'bank' }, h('span', {}, sec.bankMode === 'select' ? '方框里的词：' : '可以用的动词：'), sec.bank.map(w => h('i', {}, w))));
    sec.questions.forEach(q0 => {
      const q = { ...q0 }; if (sec.bank) { q.bank = sec.bank; q.bankMode = sec.bankMode; }
      qs.push(q); const node = renderQ(q, qs.length, ans, update); nodes[q.id] = node; box.append(node);
      if (live) {
        const fb = h('div', { class: 'livefb' });
        const ok = h('button', { type: 'button', class: 'btn primary small livebtn', disabled: true, onclick: () => {
          const r = settle(q); ok.remove(); keypad.close();
          node.classList.add('locked', r.g.ok ? 'lok' : 'lbad');
          node.querySelectorAll('.opt, input, select').forEach(x => { x.disabled = true; });
          fb.replaceChildren(reviewItem(r, qs.indexOf(q) + 1)); fb.firstChild.open = true;
          update();
        } }, '确定');
        confirmBtns.push([q, ok]); node.append(ok, fb);
      }
    });
    return box;
  });
  update();
  function finish() {
    const left = qs.filter(q => !done[q.id] && !isAnswered(q, ans[q.id])).length;
    if (left && !confirm(`还有 ${left} 题没做，确定${live ? '看结果' : '交卷'}吗？没做的算错。`)) return;
    const results = qs.map(q => settle(q));
    let newStars = 0, capped = 0, pts = 0, ptsAll = 0, okN = 0;
    results.forEach(r => {
      ptsAll += r.q.pts || 1;
      if (r.g.ok) { okN++; pts += r.q.pts || 1; if (r.star === 'new') newStars++; if (r.star === 'capped') capped++; }
    });
    const m0 = qs.length ? o.metaFor(qs[0]) : {};
    S.recordAttempt(o.uid, o.recId || null, { title: o.recTitle || o.title, ok: okN, total: qs.length, pts, ptsAll, stars: newStars, src: m0.src, sub: m0.sub, kind: m0.kind, secs: Math.min(1500, Math.round((Date.now() - o.t0) / 1000)) });
    // 做完当场查一遍成就，有新解锁立刻报喜
    B.checkAndGrant(o.uid).forEach(x => toast(`🏅 解锁成就：${x.icon} ${x.name}`, 4000));
    keypad.close();
    mount(resultsNode(o, results, { newStars, capped, okN, pts, ptsAll }));
  }
  return page(o.title, [
    o.subtitle ? h('p', { class: 'subtitle' }, o.subtitle) : null, modeBar,
    o.ctxFn ? o.ctxFn(false) : null, secs,
    h('div', { class: 'submitbar' }, info, submit)], { back: o.back, right: o.printHref ? h('a', { class: 'back r', href: o.printHref }, '🖨 打印') : null });
}

function resultsNode(o, results, sum) {
  const total = results.length, ratio = sum.okN / total;
  const had = sum.okN - sum.newStars - sum.capped;
  const head = h('section', { class: 'result' },
    h('div', { class: 'big' }, h('b', {}, sum.okN), h('small', {}, ` / ${total} 题答对`)),
    sum.ptsAll !== total ? h('p', { class: 'pts' }, `得分 ${sum.pts} / ${sum.ptsAll}`) : null,
    h('p', { class: 'praise' }, praiseText(ratio)),
    h('div', { class: 'earn' + (sum.newStars ? ' on' : '') }, sum.newStars ? `⭐ × ${sum.newStars}` : '这次没有新星星'),
    had > 0 ? h('p', { class: 'note' }, `有 ${had} 题以前已经得过星星，一题只得一颗哦。`) : null,
    sum.capped ? h('p', { class: 'note' }, `今天的星星已经拿满 ${cap()} 颗，明天再来～（做对的题明天再做还能得星）`) : null,
    results.length - sum.okN ? h('p', { class: 'note' }, `做错的 ${results.length - sum.okN} 题已放进错题本：先答对 1 次，隔天再答对就毕业。`) : null);
  const nextT = user() ? nextTask(user()) : null;
  const acts = h('div', { class: 'acts' },
    nextT ? h('a', { class: 'btn primary', href: nextT.href }, `下一项：${nextT.label} →`) : null,
    o.again ? h('button', { class: nextT ? 'btn ghost' : 'btn primary', onclick: o.again }, '再做一遍') : null,
    h('a', { class: 'btn ghost', href: o.back || '#/' }, '返回'));
  let only = false;
  const list = h('div', { class: 'rvlist' }, results.map((r, i) => reviewItem(r, i + 1)));
  const toggle = h('button', { class: 'btn ghost small', onclick: () => { only = !only; list.classList.toggle('onlybad', only); toggle.textContent = only ? '看全部' : '只看错题'; } }, '只看错题');
  return page('结果', [head, acts, o.ctxFn ? o.ctxFn(true) : null, h('div', { class: 'rvhead' }, h('h2', {}, '答案与解析'), results.length - sum.okN ? toggle : null), list], { back: o.back });
}

function reviewItem(r, no) {
  const q = r.q, ok = r.g.ok;
  const short = q.type === 'fill' ? q.stem.replace(/_{2,}/g, '____') : q.stem;
  const body = h('div', { class: 'rvb' },
    ok ? null : h('p', { class: 'mine' }, h('b', {}, '你的答案：'), h('span', { html: q.type === 'math' ? mathHtml(userText(q, r.a)) : esc(userText(q, r.a)) })),
    h('p', { class: 'right' }, h('b', {}, '正确答案：'), h('span', { html: q.type === 'math' ? mathHtml(answerText(q)) : esc(answerText(q)) })),
    q.rv ? h('p', { class: 'rvsay' }, h('button', { type: 'button', class: 'spk', onclick: () => playSay(q.rv.key, q.rv.say, X.audio) }, '🔊'), q.rv.ipa ? h('span', { class: 'ipa' }, '/' + q.rv.ipa + '/') : null, q.bold ? h('span', { class: 'bmark' }, '★ 重点词，要会拼写') : null) : null,
    r.g.note ? h('p', { class: 'note' }, r.g.note) : null,
    q.why ? h('p', { class: 'why' }, h('b', {}, '解析：'), ...String(q.why).split('\n').flatMap((t, i) => [i ? h('br') : null, t])) : null,
    r.star === 'new' ? h('p', { class: 'got' }, '⭐ +1') : null);
  return h('details', { class: 'rv ' + (ok ? 'ok' : 'bad'), open: !ok },
    h('summary', {}, h('span', { class: 'mark' }, ok ? '✓' : '✗'), h('span', { class: 'no' }, no), h('span', { class: 'rvs', html: mathish(q) ? mathHtml(short) : esc(short) })), body);
}

// ---------------- 随机练习 ----------------
export function randSetup(kind) {
  const u = user(), R = RANDOM[kind];
  let type = 'mix', level = 2, count = 10;
  const stats = S.P(u.id).rand.types;
  const weak = R.types.map(t => ({ t, s: stats[t.id] })).filter(x => x.s && x.s.n >= 3 && x.s.w / x.s.n >= 0.4).sort((a, b) => b.s.w / b.s.n - a.s.w / a.s.n).slice(0, 3);
  const chipRow = (label, items, get, set) => {
    const row = h('div', { class: 'chips' }, h('span', { class: 'lab' }, label));
    const btns = items.map(it => h('button', { type: 'button', class: 'chipb' + (get() === it.v ? ' on' : ''), onclick: () => { set(it.v); btns.forEach((b, i) => b.classList.toggle('on', items[i].v === it.v)); } }, it.n));
    row.append(...btns); return row;
  };
  const n = S.starsToday(u.id);
  mount(page(R.title, [
    h('section', { class: 'jar mini' }, h('div', { class: 'jar-top' }, h('div', { class: 'jar-n' }, '今天的星星'), h('div', { class: 'jar-s' }, `${n} / ${cap()}`)),
      h('div', { class: 'bar' }, h('i', { style: `width:${Math.min(100, n / cap() * 100)}%` }))),
    weak.length ? h('p', { class: 'note' }, '最近容易错：' + weak.map(x => x.t.name).join('、') + '。选「综合」会多出这些题。') : null,
    chipRow('题型', [{ v: 'mix', n: '综合（自动盯弱项）' }, ...R.types.map(t => ({ v: t.id, n: t.name }))], () => type, v => { type = v; }),
    R.levels ? chipRow('难度', R.levels.map((x, i) => ({ v: i + 1, n: x })), () => level, v => { level = v; }) : null,
    chipRow('题数', [{ v: 5, n: '5 题' }, { v: 10, n: '10 题' }], () => count, v => { count = v; }),
    h('button', { class: 'btn primary wide', onclick: () => startRandom(kind, () => type, () => level, () => count) }, '开始'),
    h('p', { class: 'note' }, '答对的题有星星，每天最多 ' + cap() + ' 颗；做错的题会进错题本。'),
  ]));
}
function startRandom(kind, gt, gl, gc) {
  const u = user(), R = RANDOM[kind];
  const run = () => {
    const qs = makeSession(kind, gt(), gl(), gc(), S.P(u.id).rand.types, X.vocab[R.vocab]);
    if (!qs.length) { toast('出题失败，请重试'); return; }
    mount(runQuiz({
      uid: u.id, mk: 'randmath', title: R.title, subtitle: R.levels ? R.levels[gl() - 1] : '', sections: [{ title: '', questions: qs }],
      recTitle: R.title + '（随机）', back: '#/rand/' + kind,
      metaFor: () => ({ title: R.title, src: 'rand', sub: R.subject, kind: 'rand' }), again: run,
    }));
  };
  run();
}

// ---------------- 错题本 ----------------
export function errors() {
  const u = user(), list = Object.values(S.P(u.id).wrong);
  if (!list.length) { mount(page('错题本', h('div', { class: 'empty' }, h('div', { class: 'logo' }, '🎉'), h('h2', {}, '错题本是空的'), h('p', {}, '做错的题会自动进来；答对 1 次先打上「待巩固」，隔天再做对就从这里毕业。')))); return; }
  const tnames = {}; Object.values(RANDOM).forEach(R => R.types.forEach(t => { tnames[t.id] = t.name; }));
  const keyOf = (e) => (e.q.typeId && tnames[e.q.typeId]) ? `${e.meta.title} · ${tnames[e.q.typeId]}` : e.meta.title;
  const groups = {};
  list.forEach(e => { (groups[keyOf(e)] = groups[keyOf(e)] || []).push(e); });
  const start = (es, label) => {
    const pick = es.slice().sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : b.n - a.n)).slice(0, 10);
    const qs = pick.map(e => ({ ...e.q, _meta: e.meta }));
    mount(runQuiz({ uid: u.id, mk: 'errors', title: label ? '错题专项：' + label : '错题重做', subtitle: `这次 ${qs.length} 题`, sections: [{ title: '', questions: qs }], recTitle: '错题本重做', back: '#/errors', metaFor: q => q._meta, again: () => errors() }));
  };
  const entries = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  mount(page('错题本', [
    h('p', { class: 'note' }, `一共 ${list.length} 道，分成 ${entries.length} 类。点下面一类，就只练这一类；每次最多 10 题。答对 1 次先打上「待巩固」，隔天再做对就从这里毕业。`),
    h('button', { class: 'btn primary wide', onclick: () => start(list, '') }, '全部混着重做'),
    h('a', { class: 'btn ghost wide', style: 'margin-top:10px', href: '#/weekrev' }, '🖨 本周错题复习卷（打印 / 存 PDF）'),
    h('div', { class: 'list' }, entries.map(([t, es]) => h('a', { class: 'row', href: 'javascript:void(0)', onclick: (ev) => { ev.preventDefault(); start(es, t); } }, h('div', {}, h('b', {}, t), h('small', {}, es.map(e => e.q.stem.replace(/_{2,}/g, '__').slice(0, 24)).slice(0, 2).join(' ； '))), h('span', { class: 'chip bad' }, es.length + ' 道')))),
  ]));
}

// ---------------- 记录 / 发给家长 ----------------
function summaryText(u) {
  const p = S.P(u.id), st = S.stats(u.id), t = S.today();
  const todays = p.log.filter(x => x.d === t);
  const rewards = (X.cfg.rewards || []).slice().sort((a, b) => a.stars - b.stars), cy = cycle(st.total), next = rewards.find(r => r.stars > cy.pos);
  const names = {}; Object.values(RANDOM).forEach(R => R.types.forEach(x => { names[x.id] = x.name; }));
  const weakT = Object.entries(p.rand.types).filter(([, s]) => s.n >= 3 && s.w / s.n >= 0.4).sort((a, b) => b[1].w / b[1].n - a[1].w / a[1].n).slice(0, 3).map(([id]) => names[id] || id);
  const weakW = Object.values(p.wrong).filter(x => x.q && x.q.rv && x.q.rv.say).sort((a, b) => b.n - a.n).map(x => x.q.rv.say).filter((w, i, a) => a.indexOf(w) === i).slice(0, 8);
  const ew = essayNow(u), tasks = (u.tasks || []).filter(x => x.kind !== 'essay' || ew), tdone = tasks.filter(x => S.taskDone(u.id, x, { window: ew }) >= x.goal).length;
  const lines = [`【${u.display}的练习小结】${t}`,
    `今天：做了 ${todays.length} 组，新得 ⭐${st.today} 颗` + (tasks.length ? `，任务 ${tdone}/${tasks.length}` : ''),
    S.streak(u.id) ? `🔥 连续练习 ${S.streak(u.id)} 天` : null,
    ...todays.slice(-6).map(x => `  · ${x.title}：${x.ok}/${x.total}`),
    `今天分项：${catLine(u, [t])}`,
    `累计：⭐${st.total} 颗（题库 ${st.bank} · 随机 ${st.rand}）`,
    `错题本：还有 ${st.wrong} 道没掌握`];
  if (weakT.length) lines.push(`最近容易错：${weakT.join('、')}`);
  if (weakW.length) lines.push(`还没掌握的单词：${weakW.join('、')}`);
  if (next) lines.push(`下一个奖励 ${next.label}：${next.stars} 颗，还差 ${next.stars - cy.pos} 颗`);
  if (coinsGot(rewards, cy.pos)) lines.push(`这一轮已达成金币：${coinsGot(rewards, cy.pos)} 个（${S.coinGivenLap(u.id, cy.laps, goal()) ? '家长已发放' : '找家长领取'}，累计已发 ${S.coinsPaid(u.id)} 个）` + (cy.laps ? `；已完成 ${cy.laps} 轮` : ''));
  return lines.filter(Boolean).join('\n');
}
const CATN = [['reading', '阅读理解', '📖'], ['listening', '听力', '🎧'], ['speaking', '口语', '🗣'], ['essay', '美文', '🌸']];
const catLine = (u, days) => CATN.map(([k, n]) => { const c = days.reduce((a, d) => a + S.dayCats(u.id, d)[k], 0); return `${n}${c ? ' ' + c + (k === 'speaking' ? ' 次' : ' 套') : ' 0'}`; }).join('，');
// 家长周报：最近 7 天（含今天）
function weeklyText(u) {
  const p = S.P(u.id), st = S.stats(u.id), pad = (n) => String(n).padStart(2, '0');
  const ds = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); ds.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`); }
  const set = new Set(ds), logs = p.log.filter(x => set.has(x.d));
  const active = new Set([...logs.map(x => x.d), ...Object.keys(p.days).filter(d => set.has(d))]);
  const stars = Object.keys(p.days).filter(d => set.has(d)).reduce((a, d) => a + (p.days[d].n || 0), 0);
  const okN = logs.reduce((a, x) => a + (x.ok || 0), 0), totN = logs.reduce((a, x) => a + (x.total || 0), 0);
  const names = {}; Object.values(RANDOM).forEach(R => R.types.forEach(x => { names[x.id] = x.name; }));
  const weakT = Object.entries(p.rand.types).filter(([, s]) => s.n >= 3 && s.w / s.n >= 0.4).sort((a, b) => b[1].w / b[1].n - a[1].w / a[1].n).slice(0, 3).map(([id]) => names[id] || id);
  const units = {}; Object.values(p.wrong).filter(e => set.has(e.d) && e.meta).forEach(e => { units[e.meta.title] = (units[e.meta.title] || 0) + 1; });
  const weakU = Object.entries(units).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => `${t}（${n} 道）`);
  const cy = cycle(st.total), rewards = (X.cfg.rewards || []).slice().sort((a, b) => a.stars - b.stars), next = rewards.find(r => r.stars > cy.pos);
  const lines = [`【${u.display}的本周小结】${ds[0].slice(5)} ～ ${ds[6].slice(5)}`,
    `练习了 ${active.size} / 7 天，共做 ${logs.length} 组` + (totN ? `，答对率 ${Math.round(okN / totN * 100)}%` : ''),
    `本周分项：${catLine(u, ds)}`,
    `这周新得 ⭐${stars} 颗；进度条 ${cy.pos} / ${goal()}` + (next ? `，离下一个奖励（${next.label}）还差 ${next.stars - cy.pos} 颗` : ''),
    weakU.length ? `本周错得多的内容：${weakU.join('、')}` : '本周没有新增错题，很棒！',
    weakT.length ? `容易错的题型：${weakT.join('、')}` : '',
    `错题本里还有 ${st.wrong} 道没掌握（可以在「错题本」里打印本周错题复习卷）`];
  const tips = [];
  if (active.size < 4) tips.push('这周练习天数偏少，每天只要完成“今天做什么”里的任务，坚持比一次做很多更重要');
  if (weakU.length) tips.push(`周末陪孩子把「${weakU[0].replace(/（.*$/, '')}」再过一遍`);
  if (totN && okN / totN < 0.6) tips.push('答对率偏低，建议先用“单词卡片/学一学”再做题，别急着多做');
  if (!tips.length) tips.push('这周状态不错，保持节奏，可以适当鼓励一下孩子');
  lines.push('建议：' + tips.join('；') + '。');
  return lines.filter(Boolean).join('\n');
}
// 学习日历：某个月，哪天练习过
function calendarNode(u) {
  const p = S.P(u.id), pad = (n) => String(n).padStart(2, '0'), days = {};
  p.log.forEach(x => { days[x.d] = days[x.d] || 0; });
  Object.keys(p.days).forEach(d => { days[d] = (days[d] || 0) + (p.days[d].n || 0); });
  let ym = new Date(); ym.setDate(1);
  const box = h('section', { class: 'cal' }), legend = h('p', { class: 'note calnote' }, '📖 阅读理解　🎧 听力　🗣 口语　🌸 美文');
  const draw = () => {
    const y = ym.getFullYear(), m = ym.getMonth(), first = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate(), t = S.today();
    const cells = []; for (let i = 0; i < first; i++) cells.push(h('i', { class: 'blank' }));
    let cnt = 0;
    for (let d = 1; d <= n; d++) {
      const key = `${y}-${pad(m + 1)}-${pad(d)}`, on = key in days; if (on) cnt++;
      const dc = S.dayCats(u.id, key), ic = CATN.filter(([k]) => dc[k]).map(([, , e]) => e).join('');
      cells.push(h('i', { class: 'd' + (on ? ' on' : '') + (key === t ? ' today' : '') }, String(d), ic ? h('small', { class: 'ics' }, ic) : (on && days[key] ? h('small', {}, '⭐' + days[key]) : null)));
    }
    box.replaceChildren(h('div', { class: 'cal-h' }, h('button', { type: 'button', class: 'btn ghost small', onclick: () => { ym = new Date(y, m - 1, 1); draw(); } }, '‹'), h('b', {}, `${y} 年 ${m + 1} 月 · 练习 ${cnt} 天`), h('button', { type: 'button', class: 'btn ghost small', onclick: () => { ym = new Date(y, m + 1, 1); draw(); } }, '›')),
      h('div', { class: 'cal-w' }, ['日', '一', '二', '三', '四', '五', '六'].map(x => h('span', {}, x))), h('div', { class: 'cal-g' }, cells), legend);
  };
  draw(); return box;
}
// ---------------- 周报图片：家长存到相册/发朋友圈 ----------------
// 纯 canvas 画，不联网、不依赖任何库，离线也能用
function weekData(u) {
  const p = S.P(u.id), st = S.stats(u.id), pad = (n) => String(n).padStart(2, '0');
  const ds = []; for (let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); ds.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`); }
  const set = new Set(ds), logs = p.log.filter(x => set.has(x.d));
  const per = ds.map(d => (p.days[d] && p.days[d].n) || 0);
  const active = new Set([...logs.map(x => x.d), ...ds.filter(d => (p.days[d] && p.days[d].n) > 0)]);
  const stars = per.reduce((a, n) => a + n, 0);
  const okN = logs.reduce((a, x) => a + (x.ok || 0), 0), totN = logs.reduce((a, x) => a + (x.total || 0), 0);
  const units = {}; Object.values(p.wrong).filter(e => set.has(e.d) && e.meta).forEach(e => { units[e.meta.title] = (units[e.meta.title] || 0) + 1; });
  const weakU = Object.entries(units).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => `${t}（${n} 道）`);
  const cy = cycle(st.total);
  const tip = active.size < 4 ? '这周练习天数偏少，每天完成「今天做什么」里的任务就好，坚持比一次做很多更重要'
    : (totN && okN / totN < 0.6) ? '答对率偏低，建议先用「单词卡片 / 学一学」再做题，别急着多做'
      : weakU.length ? `周末陪孩子把「${weakU[0].replace(/（.*$/, '')}」再过一遍` : '这周状态不错，保持节奏，可以适当鼓励一下孩子';
  return { ds, per, active: active.size, stars, okN, totN, weakU, cy, tip, groups: logs.length };
}
function weekCard(u) {
  const d = weekData(u), W = 750, H = 1040, R = 2;
  const cv = document.createElement('canvas'); cv.width = W * R; cv.height = H * R;
  const c = cv.getContext('2d'); c.scale(R, R);
  const cssv = (k, fb) => { try { return getComputedStyle(document.documentElement).getPropertyValue(k).trim() || fb; } catch (e) { return fb; } };
  const accent = cssv('--accent', '#2f6fd0'), ink = '#1f2430', muted = '#8b93a3', lineC = '#e8ecf3';
  const rr = (x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  const font = (w, s) => `${w} ${s}px "PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif`;
  // 背景 + 卡片
  c.fillStyle = '#f2f5fa'; c.fillRect(0, 0, W, H);
  c.save(); c.shadowColor = 'rgba(20,40,80,.10)'; c.shadowBlur = 24; c.shadowOffsetY = 8;
  c.fillStyle = '#fff'; rr(32, 32, W - 64, H - 64, 28); c.fill(); c.restore();
  // 顶部色带
  c.save(); rr(32, 32, W - 64, 250, 28); c.clip();
  const g = c.createLinearGradient(32, 32, W - 32, 282); g.addColorStop(0, accent); g.addColorStop(1, '#7aa7ea');
  c.fillStyle = g; c.fillRect(32, 32, W - 64, 250); c.restore();
  c.fillStyle = 'rgba(255,255,255,.92)'; c.font = font(500, 26); c.textBaseline = 'top';
  c.fillText('书山小路 · 本周小结', 68, 76);
  c.fillStyle = '#fff'; c.font = font(700, 54);
  c.fillText(`${u.display}`, 68, 118);
  c.font = font(500, 26); c.fillStyle = 'rgba(255,255,255,.9)';
  c.fillText(`${d.ds[0].slice(5)} ～ ${d.ds[6].slice(5)} · ${u.grade}`, 68, 190);
  // 三个数字
  const stats = [[String(d.active) + '/7', '练习天数'], ['⭐' + d.stars, '本周新得'], [d.totN ? Math.round(d.okN / d.totN * 100) + '%' : '—', '答对率']];
  stats.forEach(([v, t], i) => {
    const x = 32 + (W - 64) / 3 * i, w = (W - 64) / 3;
    c.textAlign = 'center';
    c.fillStyle = ink; c.font = font(700, 46); c.fillText(v, x + w / 2, 330);
    c.fillStyle = muted; c.font = font(400, 24); c.fillText(t, x + w / 2, 392);
  });
  // 每日星星柱状图
  const baseY = 620, topY = 470, barW = 52, gap = (W - 128 - barW * 7) / 6, max = Math.max(30, ...d.per);
  c.strokeStyle = lineC; c.lineWidth = 2; c.beginPath(); c.moveTo(64, baseY); c.lineTo(W - 64, baseY); c.stroke();
  d.per.forEach((n, i) => {
    const x = 64 + (barW + gap) * i, h = Math.max(n ? 8 : 2, (n / max) * (baseY - topY));
    c.fillStyle = n ? accent : '#e3e8f0';
    rr(x, baseY - h, barW, h, 10); c.fill();
    c.textAlign = 'center'; c.fillStyle = n ? ink : muted; c.font = font(600, 22);
    if (n) c.fillText(String(n), x + barW / 2, baseY - h - 30);
    c.fillStyle = muted; c.font = font(400, 20);
    c.fillText(d.ds[i].slice(8) + '日', x + barW / 2, baseY + 12);
  });
  c.textAlign = 'left';
  // 本周错得多的内容
  let y = 700;
  c.fillStyle = ink; c.font = font(700, 28); c.fillText('本周错得较多的内容', 64, y); y += 46;
  const list = d.weakU.length ? d.weakU : ['本周没有新增错题，很棒！'];
  c.font = font(400, 26); c.fillStyle = d.weakU.length ? '#3a4252' : accent;
  list.forEach(t => { c.fillText('· ' + t, 64, y); y += 40; });
  // 建议
  y += 12;
  c.fillStyle = ink; c.font = font(700, 28); c.fillText('给家长的建议', 64, y); y += 44;
  c.font = font(400, 26); c.fillStyle = '#3a4252';
  const maxW = W - 128; let line = '';
  for (const ch of d.tip) {
    if (c.measureText(line + ch).width > maxW) { c.fillText(line, 64, y); y += 40; line = ch; } else line += ch;
  }
  if (line) { c.fillText(line, 64, y); y += 40; }
  // 底部
  c.fillStyle = muted; c.font = font(400, 22);
  c.fillText(`累计 ⭐${S.stats(u.id).total} 颗 · 进度条 ${d.cy.pos} / ${goal()} · 错题本 ${S.stats(u.id).wrong} 道`, 64, H - 96);
  c.fillStyle = '#c3cad6'; c.font = font(400, 20);
  c.fillText('书山小路 · 每天十分钟', 64, H - 62);
  return cv.toDataURL('image/png');
}
function showCard(url, name) {
  const box = h('div', { style: 'position:fixed;inset:0;background:rgba(12,18,30,.78);z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px' },
    h('img', { src: url, style: 'max-width:100%;max-height:70vh;border-radius:14px;box-shadow:0 10px 34px rgba(0,0,0,.45)' }),
    h('p', { style: 'color:#fff;font-size:15px;margin:0;text-align:center;line-height:1.6' }, '长按图片保存到相册，或者点下面的按钮下载'),
    h('div', { style: 'display:flex;gap:10px' },
      h('a', { class: 'btn primary', href: url, download: name, style: 'text-decoration:none' }, '⬇ 下载图片'),
      h('button', { class: 'btn ghost', style: 'color:#fff;border-color:rgba(255,255,255,.55)', onclick: () => box.remove() }, '关闭')));
  box.addEventListener('click', (e) => { if (e.target === box) box.remove(); });
  document.body.append(box);
}
function saveWeekCard(u, btn) {
  try {
    const url = weekCard(u);
    showCard(url, `书山小路-${u.display}-周报-${S.today()}.png`);
    if (btn) { const t = btn.textContent; btn.textContent = '✓ 已生成'; setTimeout(() => { btn.textContent = t; }, 1600); }
  } catch (e) { toast('生成图片失败，可以先复制文字发给家长'); }
}

export function records() {
  const u = user(), p = S.P(u.id), st = S.stats(u.id);
  const days = {};
  p.log.forEach(x => { const d = (days[x.d] = days[x.d] || { n: 0, s: 0 }); d.n++; d.s += x.stars; });
  const dayRows = Object.entries(days).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 7).map(([d, v]) => h('div', { class: 'row static' }, h('div', {}, h('b', {}, d)), h('span', { class: 'chip' }, `${v.n} 组 · ⭐${v.s}`)));
  const names = {}; Object.values(RANDOM).forEach(R => R.types.forEach(t => { names[t.id] = t.name; }));
  const weak = Object.entries(p.rand.types).filter(([, s]) => s.n >= 3).map(([id, s]) => ({ id, rate: s.w / s.n, s })).sort((a, b) => b.rate - a.rate).slice(0, 4);
  let text = summaryText(u);
  const ta = h('textarea', { class: 'sum', readonly: true, rows: text.split('\n').length + 1 }, text);
  const sumTabs = h('div', { class: 'chips' }, ...[['day', '今天小结'], ['week', '本周周报']].map(([k, n]) => h('button', { type: 'button', class: 'chipb' + (k === 'day' ? ' on' : ''), onclick: (ev) => {
    text = k === 'day' ? summaryText(u) : weeklyText(u); ta.value = text; ta.rows = text.split('\n').length + 1;
    sumTabs.querySelectorAll('.chipb').forEach(b => b.classList.toggle('on', b === ev.currentTarget));
  } }, n)));
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* 下面兜底 */ }
    try { ta.removeAttribute('readonly'); ta.focus(); ta.select(); const ok = document.execCommand('copy'); ta.setAttribute('readonly', ''); return ok; } catch (e) { return false; }
  };
  const toWechat = async () => {
    const ok = await copy();
    toast(ok ? '已复制，正在打开微信，粘贴发给家长' : '请长按上面的文字，选「复制」，再去微信粘贴');
    if (ok) setTimeout(() => { location.href = 'weixin://'; }, 900);
  };
  const shareOther = async () => {
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { return; }
    toast((await copy()) ? '已复制，去微信粘贴发给家长' : '请长按上面的文字，选「复制」');
  };
  mount(page('我的记录', [
    h('section', { class: 'jar mini' }, h('div', { class: 'jar-top' }, h('div', { class: 'jar-n' }, '⭐ ', h('b', {}, st.total)), h('div', { class: 'jar-s' }, `题库 ${st.bank} · 随机 ${st.rand}`))),
    h('h2', { class: 'sh' }, '最近 7 天'), h('div', { class: 'list' }, dayRows.length ? dayRows : h('p', { class: 'note' }, '还没有记录，去做一组题吧。')),
    weak.length ? [h('h2', { class: 'sh' }, '随机练习里的弱项'), h('div', { class: 'list' }, weak.map(w => h('div', { class: 'row static' }, h('div', {}, h('b', {}, names[w.id] || w.id)), h('span', { class: 'chip' + (w.rate >= 0.4 ? ' bad' : ' ok') }, `错 ${w.s.w}/${w.s.n}`))))] : null,
    h('h2', { class: 'sh' }, '学习日历'), calendarNode(u),
    h('h2', { class: 'sh' }, '发给家长'), sumTabs, ta,
    h('button', { class: 'btn primary wide', onclick: (ev) => saveWeekCard(u, ev.currentTarget) }, '📷 周报存成图片（可发朋友圈）'),
    h('button', { class: 'btn primary wide', style: 'margin-top:10px', onclick: toWechat }, '复制并打开微信'),
    h('button', { class: 'btn ghost wide', style: 'margin-top:10px', onclick: shareOther }, '用其他方式分享'),
    h('p', { class: 'note' }, '打开微信后，找到家长的对话，长按输入框选「粘贴」，再发送。'),
    h('a', { class: 'link instl', href: '#/check' }, '🔧 有的内容打不开？点这里检查文件'),
    h('a', { class: 'link instl', href: '#/help' }, '🩺 没声音、打不开、更新不了？看看怎么办'),
    h('a', { class: 'link instl', href: '#/zone' }, '👨‍👩‍👧 家长专区：发金币 / 备份 / 打印试卷'),
  ]));
}

// ---------------- 口语打卡 ----------------
// 支持语音识别的浏览器上：点 🎤 读一句，读对了才能打卡（不再是点一下就给星）。
// 不支持（微信内置浏览器、老系统）：完全按原来的方式，打卡按钮直接可用。跟读检查常开，
// 听不出来会自动退回老方式，所以不需要家长去开/关它。
export async function speak(id) {
  const set = await loadSet(id), u = user();
  const readOk = new Set();     // 本次打开页面里读对了第几句
  let busy = false;
  // 识别彻底用不了（没麦克风权限、没网、浏览器骗人）就自动退回原来的打卡方式，
  // 绝不能因为设备问题把孩子卡在这儿打不了卡
  let srBroken = false, srFails = 0;   // 连续听不清 3 次也放行，别让孩子一直卡在识别上
  const render = () => {
    const p = S.P(u.id);
    const needRead = srReady() && !srBroken;
    const listenOne = async (s, i, btn, info, box) => {
      if (busy) return;
      busy = true;
      const old = btn.textContent;
      btn.disabled = true; btn.textContent = '🎤 正在听…';
      info.className = 'srres'; info.textContent = '请大声读这句话（读完自己会停）';
      const r = await listen(s.en, { lang: /[\u4e00-\u9fa5]/.test(s.en) ? 'zh-CN' : 'en-US' });
      busy = false; btn.disabled = false; btn.textContent = old;
      if (r.err) {
        if (['not-allowed', 'service-not-allowed', 'audio-capture', 'network', 'unsupported', 'start'].includes(r.err)) {
          srBroken = true; toast('这台手机听不了朗读，已换成原来的打卡方式', 4000); render(); return;
        }
        if (++srFails >= 3) { srBroken = true; toast('这台手机老是听不清，先换成原来的打卡方式', 4000); render(); return; }
        info.className = 'srres bad'; info.textContent = errText(r.err); return;
      }
      const sc = similarity(s.en, r.heard);
      if (sc.pct >= 60) {
        readOk.add(i);
        box.classList.add('ok');
        info.className = 'srres good';
        info.textContent = `读对 ${sc.hit}/${sc.total} 个词 · ${sc.pct >= 85 ? '很棒！' : '通过了'}（我听到：${r.heard}）`;
      } else {
        info.className = 'srres bad';
        info.textContent = `我听到：「${r.heard}」只对上 ${sc.hit}/${sc.total} 个词，再大声读一次`;
      }
    };
    const days = set.plan.map(d => {
      const key = `${set.id}-d${d.day}`, done = !!p.speak[key];
      return h('div', { class: 'day' + (done ? ' done' : '') }, h('div', {}, h('b', {}, `Day ${d.day}  ${d.title}`), h('small', {}, `${d.task} · ${d.minutes} 分钟`)),
        done ? h('span', { class: 'chip ok' }, '⭐ 已打卡') : h('button', { class: 'btn small primary', onclick: () => {
          if (needRead && !readOk.size) { toast('先点 🎤 读一句，读对了才能打卡', 3500); return; }
          const r = S.award(u.id, { id: 'speak-' + key }, 'bank', set.id, cap()); S.markSpeak(u.id, key);
          toast(r === 'new' ? (readOk.size ? `⭐ +1  读了 ${readOk.size} 句，今天的口语完成啦！` : '⭐ +1  今天的口语完成啦！') : '已打卡');
          render();
        } }, '今天完成了'));
    });
    const sents = set.sentences.map((s, i) => {
      const info = h('small', { class: 'srres' }, '');
      const box = h('div', { class: 'sent' + (readOk.has(i) ? ' ok' : '') },
        h('div', {}, h('b', {}, s.en), h('small', {}, s.zh)),
        h('div', { class: 'chips' },
          h('button', { class: 'btn small ghost', onclick: () => playSay('sp-' + slug(s.en), s.en, X.audio) }, '🔊'),
          needRead ? h('button', { class: 'btn small ghost', onclick: (e) => listenOne(s, i, e.currentTarget, info, box) }, '🎤 读这句') : null),
        info);
      return box;
    });
    const tip = needRead
      ? h('p', { class: 'note' }, '点「🎤 读这句」读给手机听：读对了才算，打卡前至少读对一句。只在点按钮时才听，录音不会保存。')
      : h('p', { class: 'note' }, srBroken ? '这台手机听不了朗读（可能没给麦克风权限，或者没联网），已经换成原来的打卡方式，不影响打卡。' : '这台手机的浏览器听不懂说话（微信里打开就会这样），按原来的方式打卡就行。想用跟读检查，用系统浏览器（Safari / Chrome）打开。');
    mount(page(set.title, [h('ol', { class: 'steps' }, set.steps.map(t => h('li', {}, t))), tip, h('h2', { class: 'sh' }, `${set.plan.length} 天打卡`), h('div', { class: 'list' }, days), h('h2', { class: 'sh' }, '本单元句子（点 🔊 听，点 🎤 读给手机听）'), h('div', { class: 'list' }, sents)], { back: '#/s/' + (set.id.startsWith('g7') ? 'g7speaking' : 'g4speaking') }));
  };
  render();
}

// ---------------- 打印版 ----------------
// 每周错题复习卷：取最近 7 天做错的题（没有的话取错题本里最近的 30 题），排成一张可打印的卷子
export function weekReview(withAns) {
  const u = user(), list = Object.values(S.P(u.id).wrong).filter(e => e.q);
  const dt = new Date(); dt.setDate(dt.getDate() - 7); const pad = (n) => String(n).padStart(2, '0');
  const lim = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  let pick = list.filter(e => e.d >= lim); const recent = pick.length > 0;
  if (!recent) pick = list.slice().sort((a, b) => (a.d < b.d ? 1 : -1));
  pick = pick.sort((a, b) => (a.meta.title < b.meta.title ? -1 : a.meta.title > b.meta.title ? 1 : 0)).slice(0, 30);
  if (!pick.length) { toast('错题本是空的，暂时不用出复习卷'); location.hash = '#/errors'; return; }
  const secs = {}; pick.forEach(e => { (secs[e.meta.title] = secs[e.meta.title] || []).push({ ...e.q }); });
  const set = { title: `${u.display}的错题复习卷`, subtitle: `${S.today()} · 共 ${pick.length} 题` + (recent ? '（本周做错的题）' : '（错题本里最近的题）'),
    sections: Object.entries(secs).map(([title, questions]) => ({ title, questions })) };
  return renderPrint(set, withAns, '#/errors', '#/weekrev' + (withAns ? '' : '/a'));
}

export async function printView(id, withAns) {
  const set = await loadSet(id);
  return renderPrint(set, withAns, '#/set/' + id, '#/print/' + id + (withAns ? '' : '/a'));
}

function renderPrint(set, withAns, backHref, toggleHref) {
  const tools = h('div', { class: 'ptools noprint' },
    h('a', { class: 'btn ghost small', href: backHref }, '‹ 返回'),
    h('a', { class: 'btn ghost small', href: toggleHref }, withAns ? '不含答案' : '含答案（家长版）'),
    h('button', { class: 'btn primary small', onclick: () => window.print() }, '打印 / 保存为 PDF'));
  const doc = h('div', { class: 'print' }, tools, h('h1', {}, set.title), h('p', { class: 'psub' }, set.subtitle || ''),
    h('p', { class: 'pname' }, '姓名：__________   日期：__________   得分：______'));
  if (set.kind === 'reading') doc.append(passageNode(set));
  if (set.tip) doc.append(h('p', { class: 'ptip' }, '💡 ' + set.tip));
  if (set.kind === 'listening') doc.append(h('p', { class: 'ptip' }, '听力：请家长朗读原文两遍（或播放 App 里的音频），孩子先看题再听。'));
  let no = 0;
  set.sections.forEach(sec => {
    doc.append(h('h2', {}, sec.title));
    if (sec.bank) doc.append(h('p', { class: 'bank' }, sec.bank.join('   ')));
    sec.questions.forEach(q => {
      no++;
      const b = h('div', { class: 'pq' });
      if (q.type === 'choice') b.append(h('p', {}, `${no}. ${q.stem}`), h('p', { class: 'po' }, q.options.map((t, k) => `${'ABCD'[k]}. ${t}`).join('     ')));
      else if (q.type === 'tf') b.append(h('p', {}, `( )  ${no}. ${q.stem}`));
      else if (q.type === 'fill') b.append(h('p', {}, `${no}. ${q.stem}`, q.hint ? `  （${q.hint}）` : ''));
      else if (q.type === 'short') b.append(h('p', {}, `${no}. ${q.stem}`), h('p', {}, 'Answer: ______________________________'));
      else b.append(h('p', { html: `${no}. ${mathHtml(q.stem)} =` }), h('div', { class: 'work' }, '解：'), h('p', {}, '答案：____________'));
      doc.append(b);
    });
  });
  if (withAns) {
    doc.append(h('h2', { class: 'pagebreak' }, '家长页：答案与解析'));
    if (set.transcript) doc.append(h('h3', {}, '听力原文'), transcriptNode(set));
    let k = 0;
    set.sections.forEach(sec => sec.questions.forEach(q => { k++; doc.append(h('p', { class: 'pans' }, h('b', {}, `${k}. `), h('span', { html: q.type === 'math' ? mathHtml(answerText(q)) : esc(answerText(q)) }), q.why ? '　' + String(q.why).split('\n')[0] : '')); }));
  }
  mount(doc);
}
export { page, runQuiz };

import * as V from './views.js';
import * as S from './store.js';
import * as E from './english.js';
import * as CN from './cndict.js';
import * as LN from './learn.js';
import * as PM from './poem.js';
import * as CV from './chapview.js';
import { stopAllSound, toast } from './ui.js';

const getJSON = (u) => fetch(u).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });

function showUpdate() {
  if (document.getElementById('updm')) return;
  const m = document.createElement('div'); m.id = 'updm';
  m.innerHTML = '<div class="updbox"><div class="updt">✨ 有新版本啦</div><div class="updp">怎么更新：点下面绿色的「立即更新」，页面会自动刷新，几秒钟就好。你的星星和记录都会保留。</div>' +
    '<button class="btn primary" id="updgo">立即更新</button><button class="btn ghost" id="updlater">稍后</button><div class="updp small">点「稍后」也行：之后点屏幕下方的「✨ 有新内容，点这里刷新」就能更新。</div></div>';
  document.body.append(m);
  m.querySelector('#updgo').onclick = () => location.reload();
  m.querySelector('#updlater').onclick = () => {
    m.remove();
    if (!document.getElementById('upd')) {
      const b = document.createElement('button'); b.id = 'upd'; b.textContent = '✨ 有新内容，点这里刷新';
      b.onclick = () => location.reload(); document.body.append(b);
    }
  };
}

// ---------- 学习休息提醒：累计用满 N 分钟，弹出休息页，倒计时结束才能继续 ----------
const BRK = { active: 0, last: Date.now(), shown: false, snoozed: false };
['pointerdown', 'keydown', 'touchstart', 'scroll'].forEach(ev => window.addEventListener(ev, () => { BRK.last = Date.now(); }, { passive: true, capture: true }));
function showBreak(restMin) {
  if (document.getElementById('brkm')) return;
  BRK.shown = true; try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  const m = document.createElement('div'); m.id = 'brkm';
  m.innerHTML = '<div class="updbox"><div class="updt">🌿 休息一下吧</div><div class="updp">已经学习一会儿啦！现在请：站起来走一走，看看窗外远处，喝几口水。<br>倒计时结束后，点「休息好了，继续」就能接着学。</div><div class="brkt" id="brkt"></div>' +
    '<button class="btn primary" id="brkgo" disabled>休息好了，继续</button><button class="btn ghost" id="brkmore">还差一点没做完，再给我 2 分钟</button></div>';
  document.body.append(m);
  let left = restMin * 60; const t = m.querySelector('#brkt'), go = m.querySelector('#brkgo'), more = m.querySelector('#brkmore');
  const draw = () => { t.textContent = left > 0 ? `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}` : '休息好啦 👍'; go.disabled = left > 0; };
  const iv = setInterval(() => { left--; draw(); if (left <= 0) clearInterval(iv); }, 1000); draw();
  const close = () => { clearInterval(iv); m.remove(); BRK.shown = false; BRK.last = Date.now(); };
  go.onclick = () => { close(); BRK.active = 0; BRK.snoozed = false; };
  if (BRK.snoozed) more.remove(); else more.onclick = () => { close(); BRK.snoozed = true; BRK.active = Math.max(0, BRK.limit - 120); };
}
setInterval(() => {
  const r = location.hash.replace(/^#\/?/, '').split('/')[0];
  if (BRK.shown || document.visibilityState !== 'visible' || !V.user() || ['login', 'parent', 'hear', 'install'].includes(r)) return;
  if (Date.now() - BRK.last > 90000) return;       // 90 秒没有操作，不算在学习
  BRK.active++;
  const cfg = (V.X && V.X.cfg) || {}; BRK.limit = (cfg.breakMinutes || 15) * 60;
  if (BRK.active >= BRK.limit) showBreak(cfg.breakRestMinutes || 3);
}, 1000);

async function render() {
  try {
    stopAllSound();
    const hash = location.hash.replace(/^#\/?/, '');
    const [r, a, b, c] = hash.split('/');
    // 公告确认：每次打开 App 都要先确认看到公告（ hear 页是扫码听力，不拦外面的人 ）
    if (r !== 'hear' && !V.noticeOk()) { V.noticeGate(render); return; }
    const u = V.user();
    if (!u && r !== 'login' && r !== 'parent' && r !== 'hear' && r !== 'install') { location.replace('#/login'); return; }
    V.setTheme(u);
    switch (r) {
      case 'login': return V.login();
      case 'parent': return V.parentHome();
      case 'install': return V.install();
      case 'hear': return await V.hear(a);
      case 's': return V.subject(a, b);
      case 'tips': return LN.tipsView(a + (b ? '/' + b : ''));
      case 'poem': return PM.poemView(a);
      case 'unit': return V.unitPage(a, b);
      case 'set': return await V.setView(a);
      case 'speak': return await V.speak(a);
      case 'rand': if (/^cnw\d$/.test(a)) return await CN.cnSetup(); if (CV.isChap(a)) return CV.chapSetup(a); return E.isEng(a) ? await E.engSetup(a) : V.randSetup(a);
      case 'words': return /^cnw\d$/.test(a) ? await CN.cnWords(b) : await E.engWords(a);
      case 'learn': return a ? await LN.learnUnit(a) : await LN.learnHome();
      case 'errors': return V.errors();
      case 'me': return V.records();
      case 'check': return await V.checkPage();
      case 'weekrev': return V.weekReview(a === 'a');
      case 'print': return await V.printView(a, b === 'a');
      default: return V.home();
    }
  } catch (e) {
    console.error(e);
    V.showError(String(e.message || e));
  }
}

// 自检：每 12 小时在后台把需要的文件逐个问一遍，缺了就记下来，首页会亮红条
async function selfCheck() {
  try {
    const last = JSON.parse(localStorage.getItem('kp_hc') || 'null');
    if (last && Date.now() - last.t < 12 * 3600 * 1000 && (!last.bad || !last.bad.length)) return;
    await new Promise(r => setTimeout(r, 4000));
    const t = await (await fetch('sw.js', { cache: 'no-store' })).text(); const m = t.match(/const SHELL = \[([\s\S]*?)\];/);
    const files = (m ? [...m[1].matchAll(/'([^']+\.(?:js|json|css|png|webmanifest|html))'/g)].map(x => x[1]) : []);
    (V.X.lib.subjects || []).forEach(sb => sb.sets.forEach(x => files.push('data/' + x.file)));
    const bad = [];
    for (let i = 0; i < files.length; i += 8) await Promise.all(files.slice(i, i + 8).map(async f => { try { const r = await fetch(f, { method: 'HEAD', cache: 'no-store' }); if (!r.ok) bad.push(f); } catch (e) { /* 没网络不算缺文件 */ } }));
    localStorage.setItem('kp_hc', JSON.stringify({ t: Date.now(), bad }));
    if (bad.length && /^#\/?$/.test(location.hash)) render();
  } catch (e) { /* 自检本身不能影响使用 */ }
}

async function boot() {
  try {
    const [cfg, lib, vocab] = await Promise.all([getJSON('data/config.json'), getJSON('data/library.json'), getJSON('data/vocab.json')]);
    V.X.cfg = cfg; V.X.lib = lib; V.X.vocab = vocab;
    V.X.ipa = await getJSON('data/ipa.json').catch(() => ({}));
    V.X.poems = await getJSON('data/poems.json').catch(() => ({}));
    V.X.tips = await getJSON('data/tips.json').catch(() => ({}));
    PM.registerPoemHook();
  } catch (e) {
    V.showError('第一次打开需要连上网络。连上网络后点「重新加载」。'); return;
  }
  try { const a = await getJSON('audio/index.json'); V.X.audio = new Set(a.files || []); } catch (e) { /* 还没有音频 */ }
  window.addEventListener('hashchange', render);
  document.addEventListener('click', (e) => {
    const a = e.target.closest && e.target.closest('a[href^="#/"]');
    if (a && a.getAttribute('href') === location.hash) { e.preventDefault(); render(); }
  });
  render();
  // 访问统计（不蒜子）：8 秒后还没加载出数字，说明服务不可用，就把角标整个撤掉，不留占位
  setTimeout(() => { const b = document.getElementById('bsz'); if (b && document.getElementById('busuanzi_value_site_pv').textContent === '…') b.remove(); }, 8000);
  selfCheck();
  if ('serviceWorker' in navigator) {
    const had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').then((reg) => {
      // 一直不关页面的用户：回到页面、或每 20 分钟，主动检查一次新版本
      let last = Date.now();
      const check = () => { last = Date.now(); reg.update().catch(() => {}); fetch('data/library.json', { cache: 'no-cache' }).catch(() => {}); };
      document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - last > 60000) check(); });
      setInterval(() => { if (!document.hidden) check(); }, 20 * 60 * 1000);
    }).catch(() => {});
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (had) showUpdate(); });
    navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.type === 'updated') showUpdate(); });
  }
}
boot();
// 存储写入失败（空间满/隐私模式）：提示一次，别让孩子的练习悄悄白做
window.addEventListener('kpsavefail', () => {
  if (window.__kpSaveWarned) return; window.__kpSaveWarned = true;
  toast('⚠️ 记录保存失败了！可能是手机存储空间不足或浏览器处于无痕模式，请联系家长处理', 8000);
});

import * as V from './views.js';
import * as S from './store.js';
import * as E from './english.js';
import * as CV from './chapview.js';

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

async function render() {
  try {
    const hash = location.hash.replace(/^#\/?/, '');
    const [r, a, b] = hash.split('/');
    const u = V.user();
    if (!u && r !== 'login' && r !== 'parent' && r !== 'hear') { location.replace('#/login'); return; }
    V.setTheme(u);
    switch (r) {
      case 'login': return V.login();
      case 'parent': return V.parentHome();
      case 'hear': return await V.hear(a);
      case 's': return V.subject(a);
      case 'set': return await V.setView(a);
      case 'speak': return await V.speak(a);
      case 'rand': if (CV.isChap(a)) return CV.chapSetup(a); return E.isEng(a) ? await E.engSetup(a) : V.randSetup(a);
      case 'words': return await E.engWords(a);
      case 'errors': return V.errors();
      case 'me': return V.records();
      case 'weekrev': return V.weekReview(a === 'a');
      case 'print': return await V.printView(a, b === 'a');
      default: return V.home();
    }
  } catch (e) {
    console.error(e);
    V.showError(String(e.message || e));
  }
}

async function boot() {
  try {
    const [cfg, lib, vocab] = await Promise.all([getJSON('data/config.json'), getJSON('data/library.json'), getJSON('data/vocab.json')]);
    V.X.cfg = cfg; V.X.lib = lib; V.X.vocab = vocab;
    V.X.ipa = await getJSON('data/ipa.json').catch(() => ({}));
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

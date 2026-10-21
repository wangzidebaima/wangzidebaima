import * as V from './views.js';
import * as S from './store.js';

const getJSON = (u) => fetch(u).then(r => { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });

function showUpdate() {
  if (document.getElementById('upd')) return;
  const b = document.createElement('button');
  b.id = 'upd'; b.textContent = '✨ 有新内容，点这里刷新';
  b.onclick = () => location.reload();
  document.body.append(b);
}

async function render() {
  try {
    const hash = location.hash.replace(/^#\/?/, '');
    const [r, a, b] = hash.split('/');
    const u = V.user();
    if (!u && r !== 'login') { location.replace('#/login'); return; }
    V.setTheme(u);
    switch (r) {
      case 'login': return V.login();
      case 's': return V.subject(a);
      case 'set': return await V.setView(a);
      case 'speak': return await V.speak(a);
      case 'rand': return V.randSetup(a);
      case 'errors': return V.errors();
      case 'me': return V.records();
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
    navigator.serviceWorker.register('sw.js').catch(() => {});
    navigator.serviceWorker.addEventListener('message', (e) => { if (e.data && e.data.type === 'updated') showUpdate(); });
  }
}
boot();

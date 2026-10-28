// 离线缓存：先用手机里存的（秒开），同时悄悄检查有没有新内容；有就提示刷新。
const VER = 'kp-v31';
const AUDIO = 'kp-audio';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'css/app.css', 'js/app.js', 'js/store.js', 'js/grade.js', 'js/mathgen.js',
  'js/views.js', 'js/ui.js', 'js/english.js', 'js/cndict.js', 'js/learn.js', 'js/poem.js', 'js/chapgen.js', 'js/chapview.js', 'js/chapgen4.js', 'js/chapgen2.js', 'data/words7.json', 'data/words4.json', 'data/cnwords4.json', 'data/cnwords2.json', 'data/poems.json', 'data/tips.json', 'data/ipa.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'data/config.json', 'data/library.json', 'data/vocab.json', 'audio/index.json'];

async function precacheSets(c) {
  try {
    const r = await fetch('data/library.json', { cache: 'no-cache' });
    const lib = await r.json(); const files = [];
    lib.subjects.forEach(s => s.sets.forEach(x => files.push('data/' + x.file)));
    await Promise.all(files.map(f => c.add(new Request(f, { cache: 'no-cache' })).catch(() => {})));
  } catch (e) { /* 离线时跳过 */ }
}

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(VER);
    await Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await precacheSets(c);
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VER && k !== AUDIO) await caches.delete(k);
    await self.clients.claim();
  })());
});

const same = (a, b) => { if (a.byteLength !== b.byteLength) return false; const x = new Uint8Array(a), y = new Uint8Array(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return false; return true; };
// 稍等一下再通知，保证页面已经准备好接收提示
async function notify(url) { await new Promise(r => setTimeout(r, 2500)); for (const c of await self.clients.matchAll()) c.postMessage({ type: 'updated', url }); }

async function swr(req, e) {
  const c = await caches.open(VER);
  const cached = await c.match(req, { ignoreSearch: true });
  const net = fetch(req, { cache: 'no-cache' }).then(async (r) => {
    if (r && r.ok) {
      // 注意：cached 已经交给页面读取了，不能再 clone；比较时重新从缓存里取一份
      const old = cached ? await c.match(req, { ignoreSearch: true }) : null;
      if (old) {
        const [a, b] = await Promise.all([old.arrayBuffer(), r.clone().arrayBuffer()]);
        if (!same(a, b)) { await c.put(req, r.clone()); notify(req.url); if (req.url.endsWith('library.json')) precacheSets(c); }
      } else await c.put(req, r.clone());
    }
    return r;
  }).catch(() => null);
  if (cached) { if (e) e.waitUntil(net.catch(() => {})); return cached; }
  const r = await net;
  if (r) return r;
  const fallback = await c.match('index.html');
  return fallback || new Response('现在没有网络，而且这个页面还没有保存到手机里。', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

// 音频：第一次播放时存下来；iPhone 播放需要支持「分段读取」(Range)
async function audioResp(req) {
  const c = await caches.open(AUDIO);
  let res = await c.match(req.url);
  if (!res) {
    try {
      const net = await fetch(req.url);
      if (!net.ok) return net;
      await c.put(req.url, net.clone()); res = net;
    } catch (e) { return new Response('', { status: 503 }); }
  }
  const range = req.headers.get('range');
  if (!range) return res;
  const buf = await res.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  const size = buf.byteLength;
  let start = m && m[1] ? parseInt(m[1], 10) : 0;
  let end = m && m[2] ? parseInt(m[2], 10) : size - 1;
  if (m && !m[1] && m[2]) { start = size - parseInt(m[2], 10); end = size - 1; }
  end = Math.min(end, size - 1);
  return new Response(buf.slice(start, end + 1), { status: 206, headers: {
    'Content-Type': 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (/\/audio\/(?:w\/)?[^/]+\.mp3$/.test(url.pathname)) { e.respondWith(audioResp(req)); return; }
  e.respondWith(swr(req, e));
});

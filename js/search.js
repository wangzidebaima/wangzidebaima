// 全库搜索：搜当前年级的题集名、知识卡、古诗。只在本机检索，不上传任何搜索内容。
import { h } from './ui.js';
import { ev } from './stat.js';
import { X, mount, page, user } from './views.js';

let idx = null, idxFor = '';
const cardFiles = {};

async function loadCards(subjectId) {
  if (cardFiles[subjectId] !== undefined) return cardFiles[subjectId];
  try {
    const r = await fetch('data/cards/' + subjectId + '.json');
    cardFiles[subjectId] = r.ok ? await r.json() : {};
  } catch (e) { cardFiles[subjectId] = {}; }
  return cardFiles[subjectId];
}

async function build(u) {
  const out = [];
  for (const sid of u.subjects || []) {
    const sb = (X.lib.subjects || []).find(s => s.id === sid); if (!sb) continue;
    const cards = await loadCards(sid);
    for (const m of sb.sets) {
      out.push({ t: '题集', title: sb.title + ' · ' + m.title, body: (m.subtitle || '') + ' ' + (sb.desc || ''), href: '#/set/' + m.id });
      const c = cards[m.id];
      if (c) out.push({ t: '知识卡', title: c.title || m.title, sub: sb.title, body: [...(c.points || []), ...(c.traps || []), ...(c.recite || [])].join(' '), href: '#/card/' + m.id });
    }
  }
  for (const [pid, P] of Object.entries(X.poems || {})) {
    out.push({ t: '古诗文', title: String(P.title || pid).replace(/[《》]/g, ''), sub: P.by || '', body: (P.lines || []).join(' ') + ' ' + (P.by || ''), href: '#/poem/' + pid });
  }
  return out;
}

function snippet(text, q) {
  const i = text.indexOf(q);
  if (i < 0) return text.slice(0, 40);
  const a = Math.max(0, i - 14), b = Math.min(text.length, i + q.length + 28);
  return (a ? '…' : '') + text.slice(a, i) + '\u0001' + q + '\u0002' + text.slice(i + q.length, b) + (b < text.length ? '…' : '');
}
function hl(s) {
  const out = [];
  s.split(/(\u0001[^\u0002]*\u0002)/).forEach(part => {
    if (part.startsWith('\u0001')) out.push(h('mark', {}, part.slice(1, -1))); else if (part) out.push(part);
  });
  return out;
}

export async function searchPage() {
  const u = user(); if (!u) { location.hash = '#/login'; return; }
  const box = h('input', { type: 'search', class: 'big', placeholder: '搜一个词，比如：勾股、光合作用、暮江吟', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'search' });
  const list = h('div', { class: 'sr' });
  const msg = h('p', { class: 'note' }, '正在准备……');
  mount(page('搜索', [box, msg, list], { back: '#/' }));
  if (!idx || idxFor !== u.id) { idx = await build(u); idxFor = u.id; }
  msg.textContent = `可以搜本年级的题集名、知识卡和古诗文（共 ${idx.length} 条）。`;
  let timer = null, sent = '';
  const run = () => {
    const q = box.value.trim().replace(/\s+/g, ' ');
    list.textContent = '';
    if (!q) { msg.textContent = `可以搜本年级的题集名、知识卡和古诗文（共 ${idx.length} 条）。`; return; }
    const terms = q.split(' ').filter(Boolean);
    const hits = [];
    for (const it of idx) {
      const hay = it.title + ' ' + (it.sub || '') + ' ' + it.body;
      if (!terms.every(t => hay.includes(t))) continue;
      let sc = 0;
      terms.forEach(t => { if (it.title.includes(t)) sc += 10; if ((it.sub || '').includes(t)) sc += 3; sc += 1; });
      if (it.t === '知识卡') sc += 2;
      hits.push([sc, it]);
    }
    hits.sort((a, b) => b[0] - a[0]);
    if (!hits.length) { msg.textContent = '没有找到。换个更短的词试试，比如只搜两个字。'; }
    else msg.textContent = `找到 ${hits.length} 条${hits.length > 30 ? '，先显示前 30 条' : ''}：`;
    hits.slice(0, 30).forEach(([, it]) => {
      const key = terms.find(t => !it.title.includes(t)) || terms[0];
      const sn = it.body && !it.title.includes(terms[0]) ? snippet(it.body, key) : (it.body ? it.body.slice(0, 36) : '');
      list.append(h('a', { class: 'sr-it', href: it.href },
        h('div', { class: 'sr-h' }, h('span', { class: 'sr-t' }, it.t), h('b', {}, it.title), it.sub ? h('small', {}, ' ' + it.sub) : null),
        sn ? h('p', { class: 'sr-b' }, hl(sn)) : null));
    });
    clearTimeout(timer);
    timer = setTimeout(() => { if (q !== sent && hits.length !== undefined) { sent = q; ev('全库搜索', hits.length ? '有结果' : '无结果', hits.length); } }, 1500);
  };
  box.addEventListener('input', run);
  box.focus();
}

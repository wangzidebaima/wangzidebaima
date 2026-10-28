// 语文：四年级词语听写（词语表）。先把词全听完（每词两遍）→ 孩子写在纸上 → 自己点“显示答案”→ 自己判对错
import { h, toast, playScript, stopScript } from './ui.js';
import * as S from './store.js';
import { user, mount, page, cap } from './views.js';

const D = {};
// 四年级 → cnw4，二年级 → cnw2
export const kindOf = (u) => (u.grade && /二/.test(u.grade)) ? 'cnw2' : 'cnw4';
async function load(k) {
  if (!D[k]) { const r = await fetch(`data/cn${k.replace('cnw', 'words')}.json`); if (!r.ok) throw new Error('词表加载失败'); D[k] = await r.json(); }
  return D[k];
}
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const missed = (uid) => { const p = S.P(uid); p.cnw = p.cnw || {}; return p.cnw; };
const say = (t) => playScript([{ t, s: 'x' }], {}, { lang: 'zh-CN', times: 1, rate: 0.8 });

export async function cnSetup() {
  const u = user(), KIND = kindOf(u); mount(page('词语听写', h('p', { class: 'note' }, '加载中…'), { back: '#/' }));
  let data; try { data = await load(KIND); } catch (e) { toast('词表加载失败，请连上网络再试'); return; }
  const sel = new Set(S.getUnits(u.id, KIND, [])); let count = 10, onlyMiss = false;
  const info = h('p', { class: 'note' });
  const pool = () => { const m = missed(u.id); const all = data.units.filter(x => sel.has(x.id)).flatMap(x => x.items.map(i => ({ ...i, u: x.id })));
    return onlyMiss ? data.units.flatMap(x => x.items.map(i => ({ ...i, u: x.id }))).filter(i => m[i.w]) : all; };
  const upd = () => { const n = pool().length; info.textContent = onlyMiss ? `写错过的词一共 ${n} 个。` : (sel.size ? `已选 ${sel.size} 个单元，共 ${n} 个词。` : '先点一点，选出学过的单元。'); };
  const ubtns = data.units.map(x => { const b = h('button', { type: 'button', class: 'chipb' + (sel.has(x.id) ? ' on' : ''), onclick: () => { sel.has(x.id) ? sel.delete(x.id) : sel.add(x.id); b.classList.toggle('on', sel.has(x.id)); S.setUnits(u.id, KIND, [...sel]); upd(); } }, `${x.name}（${x.items.length}）`); return b; });
  const chip = (label, items, get, set) => { const row = h('div', { class: 'chips' }, h('span', { class: 'lab' }, label)); const bs = items.map(it => h('button', { type: 'button', class: 'chipb' + (get() === it.v ? ' on' : ''), onclick: () => { set(it.v); bs.forEach((b, i) => b.classList.toggle('on', items[i].v === it.v)); upd(); } }, it.n)); row.append(...bs); return row; };
  const nm = Object.keys(missed(u.id)).length;
  const n = S.starsToday(u.id);
  mount(page('词语听写', [
    h('section', { class: 'jar mini' }, h('div', { class: 'jar-top' }, h('div', { class: 'jar-n' }, '今天的星星'), h('div', { class: 'jar-s' }, `${n} / ${cap()}`)), h('div', { class: 'bar' }, h('i', { style: `width:${Math.min(100, n / cap() * 100)}%` }))),
    h('div', { class: 'chips' }, h('span', { class: 'lab' }, '学过的单元（只会从这些里出词）')),
    h('div', { class: 'chips' }, ubtns),
    h('div', { class: 'chips' }, h('button', { type: 'button', class: 'btn ghost small', onclick: () => { sel.clear(); data.units.forEach(x => sel.add(x.id)); ubtns.forEach(b => b.classList.add('on')); S.setUnits(u.id, KIND, [...sel]); upd(); } }, '全选'), h('button', { type: 'button', class: 'btn ghost small', onclick: () => { sel.clear(); ubtns.forEach(b => b.classList.remove('on')); S.setUnits(u.id, KIND, []); upd(); } }, '清空')),
    chip('范围', [{ v: false, n: '选中的单元' }, { v: true, n: `只练写错过的（${nm}）` }], () => onlyMiss, v => { onlyMiss = v; }),
    info,
    chip('个数', [{ v: 10, n: '10 个' }, { v: 20, n: '20 个' }, { v: 30, n: '30 个' }], () => count, v => { count = v; }),
    h('button', { class: 'btn primary wide', onclick: () => { const p = pool(); if (!p.length) { toast(onlyMiss ? '还没有写错过的词' : '先选一选学过的单元'); return; } flow(u, shuf(p).slice(0, count), KIND); } }, '开始听写'),
    h('a', { class: 'btn ghost wide', style: 'margin-top:10px', href: '#/words/' + KIND }, '📖 看词语表，听发音'),
    h('p', { class: 'note' }, '手机会读每个词（读两遍），你把词写在纸上。写完点“显示答案”，自己对一对。写对有星星，写错的会记下来，下次可以只练它们。'),
  ], { back: '#/' }));
  upd();
}

function flow(u, qs, KIND) {
  const back = '#/rand/' + KIND;
  const status = h('p', { class: 'note dstat' }, `一共 ${qs.length} 个词，准备好纸和笔，点“开始听”。`);
  const showBtn = h('button', { class: 'btn primary wide', style: 'margin-top:10px', disabled: true, onclick: () => { stopScript(); review(); } }, '显示答案');
  const playBtn = h('button', { class: 'btn primary wide', onclick: () => {
    showBtn.disabled = true; playBtn.textContent = '正在听…（点这里重听）';
    status.textContent = `一共 ${qs.length} 个词，每个读两遍，请边听边写在纸上。`;
    const lines = []; qs.forEach(q => { lines.push({ t: q.w, s: 'x' }); lines.push({ t: q.w, s: 'x' }); });
    playScript(lines, {}, { lang: 'zh-CN', times: 1, rate: 0.8, pause: 3200, onend: () => { showBtn.disabled = false; playBtn.textContent = '🔁 再听一遍'; status.textContent = '听完啦！检查一下纸上写的，然后点“显示答案”。'; } });
  } }, '▶ 开始听');
  mount(page('词语听写', [h('p', { class: 'note' }, '不用在手机上打字：先听完全部，写在纸上；写完自己点“显示答案”。'), status, playBtn, showBtn], { back }));
  function review() {
    const mark = {};
    const done = h('button', { class: 'btn primary wide', onclick: () => {
      const left = qs.filter(q => mark[q.w] === undefined).length;
      if (left && !confirm(`还有 ${left} 个没判，没判的算错，确定吗？`)) return;
      let ok = 0, ns = 0, cp = 0; const m = missed(u.id);
      qs.forEach(q => {
        if (mark[q.w] === true) { ok++; delete m[q.w]; const r = S.award(u.id, { id: 'cnw-' + q.w }, 'rand', 'cnw', cap()); if (r === 'new') ns++; if (r === 'capped') cp++; }
        else m[q.w] = { l: q.l, d: S.today() };
      });
      S.save(u.id);
      S.recordAttempt(u.id, null, { title: '语文词语听写', ok, total: qs.length, pts: ok, ptsAll: qs.length, stars: ns, src: 'rand', sub: KIND, kind: 'rand' });
      mount(page('听写结果', [
        h('section', { class: 'result' }, h('div', { class: 'big' }, h('b', {}, ok), h('small', {}, ` / ${qs.length} 个写对`)),
          h('p', { class: 'praise' }, ok === qs.length ? '全对！太棒了！' : '写错的词已记下来，下次可以选“只练写错过的”。'),
          h('p', { class: 'pts' }, `⭐ 新得 ${ns} 颗星` + (cp ? `（今天星星已满，${cp} 个不再加星）` : ''))),
        h('a', { class: 'btn primary wide', href: back }, '再听写一组'), h('a', { class: 'btn ghost wide', style: 'margin-top:10px', href: '#/' }, '回首页'),
      ], { back }));
    } }, '完成');
    const rows = qs.map((q, i) => {
      const yes = h('button', { type: 'button', class: 'chipb', onclick: () => { mark[q.w] = true; yes.classList.add('on'); no.classList.remove('on'); } }, '✅ 写对了');
      const no = h('button', { type: 'button', class: 'chipb', onclick: () => { mark[q.w] = false; no.classList.add('on'); yes.classList.remove('on'); } }, '❌ 写错了');
      return h('div', { class: 'row dr' }, h('div', {}, h('b', {}, `${i + 1}. ${q.w}`), h('small', {}, q.l)), h('button', { type: 'button', class: 'spk', onclick: () => say(q.w) }, '🔊'), h('div', { class: 'chips' }, yes, no));
    });
    mount(page('对答案', [h('p', { class: 'note' }, '对照纸上写的，一个一个点“写对了 / 写错了”。一个字都不能错才算对。'), h('div', { class: 'list' }, rows), done], { back }));
  }
}

export async function cnWords(only) {
  const u = user(), KIND = kindOf(u); mount(page('词语表', h('p', { class: 'note' }, '加载中…'), { back: '#/rand/' + KIND }));
  let data; try { data = await load(KIND); } catch (e) { toast('词表加载失败'); return; }
  const chosen = only ? [only] : S.getUnits(u.id, KIND, []), ids = chosen.length ? chosen : data.units.map(x => x.id);
  const blocks = data.units.filter(x => ids.includes(x.id)).map(x => {
    const ls = [...new Set(x.items.map(i => i.l))];
    return [h('h2', { class: 'sh' }, x.name), ...ls.map(l => h('div', {}, h('p', { class: 'note' }, l), h('div', { class: 'chips' }, x.items.filter(i => i.l === l).map(i => h('button', { type: 'button', class: 'chipb', onclick: () => say(i.w) }, '🔊 ' + i.w)))))];
  });
  mount(page('词语表', [h('p', { class: 'note' }, '点一个词，听手机读。' + (chosen.length ? '（只显示你选的单元）' : '')), ...blocks], { back: only ? '#/unit/' + (KIND === 'cnw2' ? 'g2' : 'g4') + 'chinese/' + (KIND === 'cnw2' ? only.replace('W', 'W') : only) : '#/rand/' + KIND }));
}

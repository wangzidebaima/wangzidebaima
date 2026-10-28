// 英语“学”：单词卡片。先看词、听发音，点一下看意思，自己点“会了 / 不会”。不会的会再出现，一组 5 个。
import { h, toast, playSay, slug, stopAllSound } from './ui.js';
import * as S from './store.js';
import { X, user, mount, page } from './views.js';
import { loadBook } from './english.js';

const bookOf = (u) => (u.grade && /七/.test(u.grade)) ? '7' : '4';
const sayText = (en) => en.replace(/\([^)]*\)/g, '').replace(/\s*\/.*$/, '').replace(/\.\.\./g, '').replace(/[?.]+$/, '').trim();
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const learned = (uid, book) => { const p = S.P(uid); p.learn = p.learn || {}; return (p.learn[book] = p.learn[book] || {}); };
const key = (it) => it.en.toLowerCase();
const GAPS = [1, 3, 7, 14];
const dayN = (d) => Math.floor(new Date(d + 'T00:00:00').getTime() / 86400000);
const isDue = (o) => o && typeof o === 'object' && o.s < 4 && dayN(S.today()) - dayN(o.d) >= GAPS[o.s];
export const dueCount = (uid) => { const p = S.P(uid), b = bookOf(user()); const L = (p.learn && p.learn[b]) || {}; return Object.values(L).filter(isDue).length; };
const uname = (x) => x.name.replace('Starter Unit', 'Starter');
export const learnCount = (uid, book, data) => { const L = learned(uid, book); let n = 0, t = 0; data.units.forEach(u => u.items.forEach(i => { t++; if (L[key(i)]) n++; })); return [n, t]; };

export async function learnHome() {
  const u = user(), book = bookOf(u);
  mount(page('单词卡片', h('p', { class: 'note' }, '加载中…'), { back: '#/' }));
  let data; try { data = await loadBook(book); } catch (e) { toast('词表加载失败，请连上网络再试'); return; }
  const L = learned(u.id, book);
  const stat = (un) => { const n = un.items.filter(i => L[key(i)]).length; return [n, un.items.length]; };
  const cur = data.units.find(un => { const [n, t] = stat(un); return n < t; }) || data.units[0];
  const rows = data.units.map(un => {
    const [n, t] = stat(un), isCur = un === cur;
    return h('a', { class: 'row' + (isCur ? ' cur' : ''), href: '#/learn/' + un.id }, h('div', {}, h('b', {}, uname(un)), h('small', {}, n === t ? '全部学会啦 🎉' : `已学会 ${n}/${t}`)), h('span', { class: 'chip' + (n === t ? ' ok' : '') }, n === t ? '再复习' : (isCur ? '继续学' : '学')));
  });
  const [n0, t0] = learnCount(u.id, book, data);
  mount(page('单词卡片', [
    h('p', { class: 'note' }, `每次学 5 个：先看词听发音，点一下看意思，再点“会了”或“不会”。一共学会 ${n0}/${t0} 个。`),
    h('a', { class: 'btn primary wide gobtn', href: '#/learn/' + cur.id }, `▶ 学 ${uname(cur)}`),
    (X.tips || {})['e' + book + '-' + cur.id] ? h('div', { class: 'list' }, tipsLink('e' + book + '-' + cur.id)) : null,
    h('div', { class: 'list' }, rows),
    h('h2', { class: 'sh' }, '📝 单元小测（10 题）'),
    h('div', { class: 'chips' }, data.units.map(un => h('a', { class: 'chipb', href: '#/utest/eng/' + un.id }, uname(un)))),
    h('a', { class: 'btn ghost wide', style: 'margin-top:12px', href: '#/rand/vocab' + book }, '学完了？去测一测'),
  ], { back: '#/' }));
}

export async function learnUnit(unitId) {
  const u = user(), book = bookOf(u);
  let data; try { data = await loadBook(book); } catch (e) { toast('词表加载失败，请连上网络再试'); return; }
  const L = learned(u.id, book), back = '#/learn', review = unitId === 'review';
  const un = review ? { id: 'review', name: '今日复习', items: data.units.flatMap(x => x.items) } : data.units.find(x => x.id === unitId);
  if (!un) { location.hash = '#/learn'; return; }
  if (review && !un.items.some(i => isDue(L[key(i)]))) { toast('今天没有要复习的词，真棒！'); location.hash = '#/'; return; }
  const dueNow = () => un.items.filter(i => isDue(L[key(i)]));
  const mark = (it, ok, first) => { const k = key(it), o = L[k]; if (!review) { L[k] = { d: S.today(), s: 0 }; return; } L[k] = (!ok || first[k] === false) ? { d: S.today(), s: 0 } : { d: S.today(), s: Math.min(4, (o && o.s || 0) + 1) }; };
  const todo = () => { if (review) return shuf(dueNow()); const fresh = un.items.filter(i => !L[key(i)]); return fresh.length ? fresh : shuf(un.items); };
  const play = (it) => playSay(slug(it.en), sayText(it.en), X.audio);
  let batchNo = 0;
  function batch() {
    const pool = todo(), deck = pool.slice(0, 5), queue = shuf(deck), total = deck.length, first = {};
    // 翻过的卡片：孩子点快了想回头看一眼（或改判），点「◀ 上一个」就退回去
    const hist = [];
    const undo = (rec) => {
      const k = key(rec.it);
      delete first[k];
      if (rec.before) L[k] = rec.before; else delete L[k];
      S.save(u.id);
    };
    const prev = () => {
      if (!hist.length) { toast('这是这一组的第一张'); return; }
      const rec = hist.pop();
      undo(rec);
      queue.unshift(rec.it);
      // 当时点的「不会」：这个词已经排到队尾等着再来一遍，退回去时把队尾那份去掉，免得重复出现
      if (rec.again) { const i = queue.lastIndexOf(rec.it); if (i > 0) queue.splice(i, 1); }
      step();
    };
    batchNo++;
    const step = () => {
      stopAllSound();
      if (!queue.length) return finish();
      const it = queue[0]; let flipped = false;
      const iv = X.ipa && (X.ipa[it.en] || X.ipa[it.en.toLowerCase()]), ipa = iv ? '/' + iv + '/' : '';
      const back_ = h('div', { class: 'cardback', style: 'display:none' }, h('div', { class: 'zh' }, it.zh), it.pos ? h('small', {}, it.pos) : null,
        h('div', { class: 'chips' },
          h('button', { class: 'btn primary', onclick: () => { if (first[key(it)] === undefined) first[key(it)] = true; hist.push({ it, again: false, before: L[key(it)] ? Object.assign({}, L[key(it)]) : null }); mark(it, true, first); S.save(u.id); queue.shift(); step(); } }, '😀 会了'),
          h('button', { class: 'btn ghost', onclick: () => { first[key(it)] = false; hist.push({ it, again: true, before: L[key(it)] ? Object.assign({}, L[key(it)]) : null }); if (review) { mark(it, false, first); S.save(u.id); } queue.push(queue.shift()); step(); } }, '🤔 不会')));
      const face = h('button', { type: 'button', class: 'flash', onclick: () => { if (flipped) return; flipped = true; hint.style.display = 'none'; back_.style.display = ''; } },
        h('div', { class: 'en' }, it.en), ipa ? h('div', { class: 'ipa' }, ipa) : null, it.bold ? h('small', { class: 'bmark' }, '★ 要会拼写') : null);
      const hint = h('p', { class: 'note' }, '点一下卡片，看中文意思');
      mount(page('单词卡片', [h('p', { class: 'note' }, `${uname(un)} · 第 ${batchNo} 组 · 还剩 ${queue.length} 张`),
        face,
        h('div', { class: 'chips' },
          hist.length ? h('button', { type: 'button', class: 'btn ghost', onclick: prev }, '◀ 上一个') : null,
          h('button', { type: 'button', class: 'btn ghost', onclick: () => play(it) }, '🔊 再听一遍')),
        hint, back_], { back }));
      play(it);
    };
    const finish = () => {
      const left = review ? dueNow().length : un.items.filter(i => !L[key(i)]).length, hard = deck.filter(i => first[key(i)] === false).length;
      mount(page('学完一组', [
        h('section', { class: 'result' }, h('div', { class: 'big' }, '👏'), h('p', { class: 'praise' }, `这 ${total} 个词学完啦！`), hard ? h('p', { class: 'note' }, `其中 ${hard} 个有点难，过几天再来看一眼。`) : h('p', { class: 'note' }, '一次就都记住了，真棒！')),
        left ? h('button', { class: 'btn primary wide', onclick: batch }, review ? `再复习 5 个（还有 ${left} 个）` : `再学 5 个（还有 ${left} 个没学）`) : h('p', { class: 'note' }, review ? '今天的复习做完啦！' : `${uname(un)} 的词都学过了！去测一测，看看记得牢不牢。`),
        h('a', { class: left ? 'btn ghost wide' : 'btn primary wide', style: 'margin-top:10px', href: '#/rand/vocab' + book }, '去测一测'),
        (X.tips || {})['e' + book + '-' + un.id] ? h('a', { class: 'btn ghost wide', style: 'margin-top:10px', href: '#/tips/e' + book + '-' + un.id }, '📝 看本单元要点') : null,
        h('a', { class: 'btn ghost wide', style: 'margin-top:10px', href: back }, '回单元列表'),
      ], { back }));
    };
    step();
  }
  batch();
}

// 本单元要点卡：每条一个小标题 + 几句话，能听
import { playScript } from './ui.js';
export function tipsLink(key, back) {
  return (X.tips || {})[key] ? h('a', { class: 'row', href: '#/tips/' + key }, h('div', {}, h('b', {}, '📝 本单元要点'), h('small', {}, '几句话讲清重点')), h('span', { class: 'chip' }, '看看')) : null;
}
export function tipsView(key) {
  const T = (X.tips || {})[key]; if (!T) { location.hash = '#/'; return; }
  const m = key.match(/^e(\d)-(.+)$/), cn = key.match(/^(g\d+chinese)-(.+)$/);
  const back = m ? '#/learn' : cn ? `#/unit/${cn[1]}/${cn[2]}` : '#/';
  const name = m ? ((X.lib.unitNames || {})[m[2]] || m[2]) : cn ? ((X.lib.unitNames || {})[cn[2]] || cn[2]) : '';
  const speakAll = () => playScript(T.items.map(([a, b]) => ({ t: a + '。' + b.replace(/[A-Za-z][A-Za-z\s,.\'’!?/-]*/g, ' '), s: 'x' })), {}, { lang: 'zh-CN', times: 1, rate: 0.85, pause: 700 });
  mount(page('本单元要点', [
    name ? h('p', { class: 'note' }, name) : null,
    ...T.items.map(([a, b]) => h('section', { class: 'tip' }, h('h3', {}, a), h('p', {}, b))),
    cn ? h('button', { type: 'button', class: 'btn ghost wide', onclick: speakAll }, '🔊 听一听') : null,
    h('a', { class: 'btn primary wide', style: 'margin-top:10px', href: back }, '看完了'),
  ], { back }));
}

// 数学章节练习：选「学过的章节」，只从这些章节出题
import { h, toast } from './ui.js';
import * as S from './store.js';
import { user, mount, page, runQuiz, cap } from './views.js';
import { RANDOM } from './mathgen.js';
import { CH7, buildChapSession } from './chapgen.js';
import { CH4 } from './chapgen4.js';

export const CHAP = {
  chap7: { book: 'math7', CH: CH7, pre: 'm7-' },
  chap4: { book: 'math4', CH: CH4, pre: 'm4-' },
};
export const isChap = (k) => !!CHAP[k];

export function chapSetup(kind) {
  const u = user(), R = RANDOM[kind], cfg = CHAP[kind];
  const sel = new Set(S.getUnits(u.id, cfg.book, []));
  let type = 'mix', level = 2, count = 10;
  const save = () => S.setUnits(u.id, cfg.book, [...sel]);
  const info = h('p', { class: 'note' });
  const upd = () => { info.textContent = sel.size ? `已选 ${sel.size} 章。` : '先点一点，选出你已经学过的章节。'; };
  const btns = cfg.CH.map(c => {
    const b = h('button', { type: 'button', class: 'chipb' + (sel.has(c.id) ? ' on' : ''), onclick: () => { sel.has(c.id) ? sel.delete(c.id) : sel.add(c.id); b.classList.toggle('on', sel.has(c.id)); save(); upd(); } }, c.name);
    return b;
  });
  const setAll = (on) => { sel.clear(); if (on) cfg.CH.forEach(c => sel.add(c.id)); btns.forEach((b, i) => b.classList.toggle('on', sel.has(cfg.CH[i].id))); save(); upd(); };
  const chipRow = (label, items, get, set) => {
    const row = h('div', { class: 'chips' }, h('span', { class: 'lab' }, label));
    const bs = items.map(it => h('button', { type: 'button', class: 'chipb' + (get() === it.v ? ' on' : ''), onclick: () => { set(it.v); bs.forEach((b, i) => b.classList.toggle('on', items[i].v === it.v)); } }, it.n));
    row.append(...bs); return row;
  };
  const stats = S.P(u.id).rand.types;
  const run = () => {
    const qs = buildChapSession(cfg.CH, cfg.pre, [...sel], level, count, stats, type);
    if (!qs.length) { toast('出题失败，请换个章节或题型'); return; }
    mount(runQuiz({
      uid: u.id, title: R.title, subtitle: `已选 ${sel.size} 章`, sections: [{ title: '', questions: qs }],
      recTitle: R.title + '（随机）', back: '#/rand/' + kind,
      metaFor: () => ({ title: R.title, src: 'rand', sub: R.subject, kind: 'rand' }), again: run,
    }));
  };
  const typeItems = () => R.types.filter(t => sel.has(t.cid)).map(t => ({ v: t.id, n: t.name }));
  const typeBox = h('div', {});
  const drawTypes = () => { typeBox.replaceChildren(chipRow('题型', [{ v: 'mix', n: '综合（自动盯弱项）' }, ...typeItems()], () => type, v => { type = v; })); };
  btns.forEach(b => b.addEventListener('click', () => { type = 'mix'; drawTypes(); }));
  const n = S.randToday(u.id, R.subject);
  mount(page(R.title, [
    h('section', { class: 'jar mini' }, h('div', { class: 'jar-top' }, h('div', { class: 'jar-n' }, '今天的随机星星'), h('div', { class: 'jar-s' }, `${n} / ${cap()}`)),
      h('div', { class: 'bar' }, h('i', { style: `width:${Math.min(100, n / cap() * 100)}%` }))),
    h('div', { class: 'chips' }, h('span', { class: 'lab' }, '学过的章节（只会从这些里出题）')),
    h('div', { class: 'chips' }, btns),
    h('div', { class: 'chips' }, h('button', { type: 'button', class: 'btn ghost small', onclick: () => { setAll(true); type = 'mix'; drawTypes(); } }, '全选'), h('button', { type: 'button', class: 'btn ghost small', onclick: () => { setAll(false); type = 'mix'; drawTypes(); } }, '清空')),
    info, typeBox,
    chipRow('难度', R.levels.map((x, i) => ({ v: i + 1, n: x })), () => level, v => { level = v; }),
    chipRow('题数', [{ v: 5, n: '5 题' }, { v: 10, n: '10 题' }, { v: 20, n: '20 题' }], () => count, v => { count = v; }),
    h('button', { class: 'btn primary wide', onclick: () => { if (!sel.size) { toast('先选一选学过的章节'); return; } run(); } }, '开始'),
    h('p', { class: 'note' }, '每天每科最多 ' + cap() + ' 颗随机星星；做错的题会进错题本。'),
  ]));
  upd(); drawTypes();
}

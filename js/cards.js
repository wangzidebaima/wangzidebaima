// 知识卡：每课一页要点（只放我们自己总结的，不抄课本原文）。
// 数据在 data/cards/<科目id>.json，清单在 data/cards/index.json；没有清单/没有这个文件就当没有，不影响别的功能。
import { h } from './ui.js';
import { ev } from './stat.js';

const have = new Set();       // 有知识卡的题集 id，如 g7poli-3
const cache = {};             // 科目 id → { 题集id: 卡 }
export const subjOf = (setId) => String(setId).replace(/-\d+$/, '');
// 题目 id 形如 g7poli-3-A2，去掉最后的「-A2」就是题集 id
export const setOfQ = (qid) => String(qid).replace(/-[A-Z]\d+$/, '');
export const hasCard = (setId) => have.has(setId);
export const hasSubjectCards = (setIds) => (setIds || []).some(id => have.has(id));

export async function initCards() {
  try {
    const r = await fetch('data/cards/index.json');
    if (!r.ok) return;
    const j = await r.json();
    (j.sets || []).forEach(id => have.add(id));
  } catch (e) { /* 没有知识卡，一切照旧 */ }
}

async function getCard(setId) {
  const sj = subjOf(setId);
  if (!cache[sj]) {
    const r = await fetch('data/cards/' + sj + '.json');
    if (!r.ok) throw new Error('知识卡加载失败，请检查网络后重试');
    cache[sj] = await r.json();
  }
  return cache[sj][setId] || null;
}

// 知识卡内容（弹窗和整页共用）
function body(c) {
  return h('div', { class: 'kc' },
    h('h3', {}, '📌 要点'),
    h('ol', {}, c.points.map(t => h('li', {}, t))),
    c.traps && c.traps.length ? h('div', { class: 'kc-trap' }, h('h3', {}, '⚠️ 容易错'), h('ul', {}, c.traps.map(t => h('li', {}, t)))) : null,
    c.auto ? h('p', { class: 'muted', style: 'font-size:12px;margin-top:8px' }, '本卡由本节题目的解析整理，仅作复习提示，请以课本为准。') : null,
    c.recite && c.recite.length ? h('div', { class: 'kc-rec' }, h('h3', {}, '🧠 一句话记住'), h('ul', {}, c.recite.map(t => h('li', {}, t)))) : null,
    h('p', { class: 'kc-note' }, '这是按课本内容整理的要点，细节以课本为准。'));
}

// 打印用：只要卡片内容，不带按钮、不记统计。没有就返回 null
export async function cardBlock(setId) {
  try { const c = await getCard(setId); return c ? body(c) : null; } catch (e) { return null; }
}

// 取卡的原始数据（讲给家长听用）
export async function cardBlockData(setId) { try { return await getCard(setId); } catch (e) { return null; } }

// 弹窗：做题中途、看解析时点开，不会离开当前页面，做到一半的题不会丢
export async function openCard(setId, from) {
  if (document.getElementById('kcmodal')) return;
  const close = () => { const m = document.getElementById('kcmodal'); if (m) m.remove(); };
  const box = h('div', { class: 'kc-load' }, '加载中…');
  const mask = h('div', { class: 'vmodal-mask', id: 'kcmodal', onclick: (e) => { if (e.target === mask) close(); } },
    h('div', { class: 'vmodal kcard' },
      h('button', { type: 'button', class: 'vmodal-x', 'aria-label': '关闭', onclick: close }, '×'),
      h('div', { class: 'vmodal-h' }, '📖 知识卡'), box,
      h('div', { class: 'vmodal-btns' }, h('button', { type: 'button', class: 'btn primary', onclick: close }, '看完了，继续'))));
  document.body.append(mask);
  try {
    const c = await getCard(setId);
    if (!c) { box.textContent = '这一课还没有知识卡。'; return; }
    box.replaceChildren(h('div', { class: 'kc-title' }, c.title), body(c));
    ev('看知识卡', setId + (from ? '|' + from : ''));
  } catch (e) { box.textContent = String(e.message || e); }
}

// 整页：从科目页进来慢慢看
export async function cardPageBody(setId) {
  const c = await getCard(setId);
  if (!c) return h('p', { class: 'note' }, '这一课还没有知识卡。');
  ev('看知识卡', setId + '|page');
  return h('div', {}, h('div', { class: 'kc-title' }, c.title), body(c),
    h('div', { class: 'chips', style: 'margin-top:14px' }, h('a', { class: 'btn primary', href: '#/set/' + setId }, '去做这一课的题')));
}

// 一个小按钮：点开弹窗。没有这一课的卡就返回 null
export function cardBtn(setId, from, label = '📖 看这一课的知识卡') {
  if (!have.has(setId)) return null;
  return h('button', { type: 'button', class: 'btn small ghost', onclick: () => openCard(setId, from) }, label);
}

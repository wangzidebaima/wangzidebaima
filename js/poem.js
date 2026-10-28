// 语文“学一学”：古诗文学习页——先听、读原文，看注释和大意，再用“挡一挡”练背，最后去做题
import { h, playScript } from './ui.js';
import * as S from './store.js';
import { X, mount, page, setLearnHook } from './views.js';

export function registerPoemHook() {
  setLearnHook((learn, id, x, ms) => {
    const P = X.poems || {}, tk = (X.tips || {})[id + '-' + x];
    if (tk) learn.unshift(h('a', { class: 'row', href: '#/tips/' + id + '-' + x }, h('div', {}, h('b', {}, '📝 本单元要点'), h('small', {}, '作者、内容、写法，几句话讲清')), h('span', { class: 'chip' }, '看看')));
    ms.forEach(m => { const pid = m.id.replace(/-a$/, ''); if (m.id.endsWith('-a') && P[pid]) learn.push(h('a', { class: 'row', href: '#/poem/' + pid }, h('div', {}, h('b', {}, '📜 学 ' + P[pid].title), h('small', {}, P[pid].by + ' · 原文、注释、大意')), h('span', { class: 'chip' }, '去学'))); });
  });
}

export function poemView(pid) {
  const P = (X.poems || {})[pid]; if (!P) { location.hash = '#/'; return; }
  const back = '#/unit/' + (P.g || 'g7') + 'chinese' + '/' + P.unit;
  const lines = P.lines.map(l => l.replace(/[ ]+$/, ''));
  let level = 0;
  const box = h('section', { class: 'poem' + (P.prose ? ' prose' : '') });
  const half = (t) => { const ch = [...t], core = ch.filter(c => !/[，。？！、；：“”‘’—·\s]/.test(c)); const keep = Math.ceil(core.length / 2); let k = 0; return ch.map(c => /[，。？！、；：“”‘’—·\s]/.test(c) ? c : (++k <= keep ? c : '＿')).join(''); };
  const draw = () => {
    box.replaceChildren(...lines.map(l => {
      if (P.prose || level === 0) return h('p', { class: 'pl' }, l);
      if (level === 1) return h('p', { class: 'pl' }, half(l));
      const p = h('p', { class: 'pl hide', onclick: () => { p.textContent = l; p.classList.remove('hide'); } }, '＿'.repeat(Math.min(12, [...l].length)));
      return p;
    }));
  };
  const hideBtn = h('button', { type: 'button', class: 'btn ghost', onclick: () => { level = (level + 1) % 3; hideBtn.textContent = ['🙈 挡一挡', '🙈 再多挡', '👀 全显示'][level]; draw(); } }, '🙈 挡一挡');
  const status = h('p', { class: 'hint' });
  const play = (rate) => { status.textContent = '正在朗读…'; playScript(lines.map(t => ({ t, s: 'x' })), {}, { lang: 'zh-CN', times: 1, rate, pause: P.prose ? 600 : 1100, onend: () => { status.textContent = '读完啦，可以跟着再读一遍。'; } }); };
  draw();
  mount(page(P.title, [
    h('p', { class: 'note' }, P.by),
    box,
    h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn primary', onclick: () => play(0.8) }, '🔊 朗读'), h('button', { type: 'button', class: 'btn ghost', onclick: () => play(0.6) }, '🐢 慢读'), P.prose ? null : hideBtn),
    status,
    h('h2', { class: 'sh' }, '注释'),
    h('div', { class: 'list notes' }, P.notes.map(([w, e]) => h('div', { class: 'row' }, h('div', {}, h('b', {}, w), h('small', {}, e))))),
    h('h2', { class: 'sh' }, '大意'),
    ...P.meaning.map(t => h('p', { class: 'mean' }, t)),
    h('h2', { class: 'sh' }, '想一想'),
    h('p', { class: 'mean' }, P.feel),
    h('a', { class: 'btn primary wide gobtn', href: '#/set/' + pid + '-a' }, '学好了，去做练习 →'),
    h('a', { class: 'btn ghost wide', style: 'margin-top:8px', href: back }, '回单元'),
  ], { back }));
}

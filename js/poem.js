// 语文“学一学”：古诗文学习页——先听、读原文，看注释和大意，再用“挡一挡”练背，最后去做题
import { h, speakZh, stopScript, pausePlay, resumePlay } from './ui.js';
import * as S from './store.js';
import { ev } from './stat.js';
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
  let mode = 'idle';   // idle 未播 | playing 播放中 | paused 已暂停
  const pauseBtn = h('button', { type: 'button', class: 'btn ghost', disabled: true, onclick: () => {
    if (mode === 'playing') { pausePlay(); mode = 'paused'; pauseBtn.textContent = '▶ 继续'; status.textContent = '已暂停，点「继续」接着读。'; }
    else if (mode === 'paused') { resumePlay(); mode = 'playing'; pauseBtn.textContent = '⏸ 暂停'; status.textContent = '正在朗读…'; }
  } }, '⏸ 暂停');
  const play = (rate) => { mode = 'playing'; pauseBtn.disabled = false; pauseBtn.textContent = '⏸ 暂停'; status.textContent = '正在朗读…'; speakZh(lines, X.audio, { mult: rate < 0.7 ? 0.8 : 1, ttsRate: rate, gap: P.prose ? 600 : 1100, onend: () => { mode = 'idle'; pauseBtn.disabled = true; pauseBtn.textContent = '⏸ 暂停'; status.textContent = '读完啦，可以跟着再读一遍。'; } }); };
  draw();
  mount(page(P.title, [
    h('p', { class: 'note' }, P.by),
    box,
    h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn primary', onclick: () => play(0.8) }, '🔊 朗读'), h('button', { type: 'button', class: 'btn ghost', onclick: () => play(0.6) }, '🐢 慢读'), pauseBtn, P.prose ? null : hideBtn),
    status,
    h('h2', { class: 'sh' }, '注释'),
    h('div', { class: 'list notes' }, P.notes.map(([w, e]) => h('div', { class: 'row' }, h('div', {}, h('b', {}, w), h('small', {}, e))))),
    h('h2', { class: 'sh' }, '大意'),
    ...P.meaning.map(t => h('p', { class: 'mean' }, t)),
    h('h2', { class: 'sh' }, '想一想'),
    h('p', { class: 'mean' }, P.feel),
    h('a', { class: 'btn ghost wide', style: 'margin-bottom:8px', href: '#/dict/' + pid }, '✍️ 默写练习'),
    h('a', { class: 'btn primary wide gobtn', href: '#/set/' + pid + '-a' }, '学好了，去做练习 →'),
    h('a', { class: 'btn ghost wide', style: 'margin-top:8px', href: back }, '回单元'),
  ], { back }));
}

// 默写：逐句给上一句（第一句给题目和前两个字），孩子写下一句，点“对答案”逐句判
const norm = (t) => t.replace(/[，。？！、；：“”‘’—·《》…\s,.?!;:'"-]/g, '');
export function dictView(pid) {
  const P = (X.poems || {})[pid]; if (!P) { location.hash = '#/'; return; }
  const back = '#/poem/' + pid;
  const lines = P.lines.map(l => l.replace(/[ ]+$/, '')).filter(l => norm(l));
  const rows = lines.map((l, i) => {
    const hint = i === 0 ? '第一句：' + [...norm(l)].slice(0, 2).join('') + '……' : '上一句：' + lines[i - 1];
    const inp = h('input', { type: 'text', class: 'dict-in', placeholder: '写这一句', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
    const res = h('div', { class: 'dict-res' });
    return { l, inp, res, el: h('div', { class: 'dict-row' }, h('div', { class: 'dict-hint' }, hint), inp, res) };
  });
  const sum = h('p', { class: 'hint' });
  let done = false;
  const check = () => {
    let ok = 0;
    rows.forEach(r => {
      const good = norm(r.inp.value) === norm(r.l);
      if (good) ok++;
      r.res.className = 'dict-res ' + (good ? 'good' : 'bad');
      r.res.textContent = good ? '✓ 对了' : '✗ 正确：' + r.l;
    });
    sum.textContent = `写对 ${ok} / ${rows.length} 句。${ok === rows.length ? '全对，太棒了！' : '错的句子再读两遍，隔一会儿再默一次。'}`;
    if (!done) { done = true; ev('古诗默写', pid + '|' + ok + '/' + rows.length, ok); }
  };
  mount(page('默写：' + P.title, [
    h('p', { class: 'note' }, P.by + '　先不看原文，凭记忆写。写完点“对答案”，标点不用写。'),
    h('div', { class: 'dict' }, rows.map(r => r.el)),
    h('div', { class: 'acts' }, h('button', { type: 'button', class: 'btn primary', onclick: check }, '✅ 对答案'),
      h('button', { type: 'button', class: 'btn ghost', onclick: () => { rows.forEach(r => { r.inp.value = ''; r.res.textContent = ''; r.res.className = 'dict-res'; }); sum.textContent = ''; done = false; } }, '🔄 重新写')),
    sum,
    h('a', { class: 'btn ghost wide', style: 'margin-top:10px', href: back }, '回去看原文'),
  ], { back }));
}

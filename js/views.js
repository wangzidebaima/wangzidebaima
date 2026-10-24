// 所有页面：登录、首页、题库、答题、结果、错题本、随机练习、记录、打印
import { h, esc, mathHtml, toast, keypad, praiseText, playSay, slug } from './ui.js';
import * as S from './store.js';
import { gradeQuestion, answerText, userText, isAnswered } from './grade.js';
import { RANDOM, makeSession } from './mathgen.js';

export const X = { cfg: null, lib: null, vocab: {}, audio: new Set(), sets: {}, ipa: {} };
const app = () => document.getElementById('app');
export const nav = (hash) => { if (location.hash === hash) window.dispatchEvent(new Event('hashchange')); else location.hash = hash; };
export const user = () => X.cfg.users.find(u => u.id === S.getUser()) || null;
export function setTheme(u) { document.documentElement.dataset.theme = u ? u.theme : ''; document.documentElement.dataset.fs = u ? String(S.P(u.id).font || 0) : '0'; }
export function mount(node) { app().replaceChildren(node); window.scrollTo(0, 0); keypad.close(); }
export const cap = () => X.cfg.dailyStarCap || 30;
export const goal = () => X.cfg.starGoal || 300;

function page(title, content, { back = '#/', right = null } = {}) {
  return h('div', { class: 'page' },
    h('header', { class: 'top' },
      back ? h('a', { class: 'back', href: back }, '‹ 返回') : h('span', { class: 'back' }),
      h('h1', {}, title), right || h('span', { class: 'back' })),
    h('main', {}, content));
}
export function showError(msg) {
  mount(h('div', { class: 'login' }, h('div', { class: 'logo' }, '📡'), h('h1', {}, '打不开'), h('p', { class: 'sub' }, msg),
    h('button', { class: 'btn primary wide', onclick: () => location.reload() }, '重新加载')));
}

const subj = (id) => X.lib.subjects.find(s => s.id === id);
const setMeta = (id) => { for (const s of X.lib.subjects) { const m = s.sets.find(x => x.id === id); if (m) return { subject: s, meta: m }; } return null; };
export async function loadSet(id) {
  if (X.sets[id]) return X.sets[id];
  const f = setMeta(id); if (!f) throw new Error('没有找到这套题');
  const r = await fetch('data/' + f.meta.file);
  if (!r.ok) throw new Error('题目加载失败，请检查网络后重试');
  return (X.sets[id] = await r.json());
}

// ---------------- 登录 ----------------
const sha256 = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
function askPassword() {
  const P = X.cfg.parent;
  const inp = h('input', { class: 'big', type: 'password', inputmode: 'numeric', placeholder: '请输入密码', autocomplete: 'off', enterkeyhint: 'go' });
  const msg = h('p', { class: 'msg' });
  const go = async () => {
    try {
      if (await sha256(P.salt + inp.value.trim()) === P.hash) { try { sessionStorage.setItem('kp_parent', '1'); } catch (e) { window.__kpParent = true; } nav('#/parent'); }
      else { msg.textContent = '密码不对，再试一次'; inp.value = ''; }
    } catch (e) { msg.textContent = '这个浏览器暂时无法验证密码'; }
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  setTheme(null);
  mount(h('div', { class: 'login' }, h('div', { class: 'logo' }, '🔒'), h('h1', {}, P.name), h('p', { class: 'sub' }, '请输入密码'), inp,
    h('button', { class: 'btn primary wide', onclick: go }, '进入'), h('button', { class: 'btn ghost wide', style: 'margin-top:10px', onclick: () => nav('#/login') }, '返回'), msg));
  setTimeout(() => inp.focus(), 50);
}
export function parentHome() {
  let ok = false; try { ok = sessionStorage.getItem('kp_parent') === '1'; } catch (e) { ok = !!window.__kpParent; }
  if (!ok) { nav('#/login'); return; }
  setTheme(null);
  mount(h('div', { class: 'login' }, h('div', { class: 'logo' }, '🔒'), h('h1', {}, X.cfg.parent.name), h('p', { class: 'sub' }, '家长入口。这里的内容还在准备中。'),
    h('button', { class: 'btn primary wide', onclick: () => { try { sessionStorage.removeItem('kp_parent'); } catch (e) { window.__kpParent = false; } nav('#/login'); } }, '退出')));
}
export function login() {
  const inp = h('input', { class: 'big', placeholder: '输入你的名字', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'go' });
  const msg = h('p', { class: 'msg' });
  const enter = () => {
    const v = inp.value.trim().toLowerCase();
    const u = X.cfg.users.find(x => x.names.some(n => n.toLowerCase() === v));
    if (!u && X.cfg.parent && v === X.cfg.parent.name.toLowerCase()) { askPassword(); return; }
    if (!u) { msg.textContent = '没有找到这个名字，再检查一下～'; return; }
    S.setUser(u.id); setTheme(u); nav('#/');
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') enter(); });
  setTheme(null);
  mount(h('div', { class: 'login' }, h('div', { class: 'logo' }, '⭐'), h('h1', {}, X.cfg.appName),
    h('p', { class: 'sub' }, '输入你的名字，开始今天的练习'), inp,
    h('button', { class: 'btn primary wide', onclick: enter }, '开始'), msg));
}

// ---------------- 首页 ----------------
function taskCard(u) {
  const tasks = u.tasks || []; if (!tasks.length) return null;
  const done = tasks.map(t => S.taskDone(u.id, t)), all = tasks.every((t, i) => done[i] >= t.goal);
  return h('section', { class: 'tasks' }, h('h2', { class: 'sh' }, all ? '🎉 今天的任务都完成啦' : '今天的任务'),
    tasks.map((t, i) => h('div', { class: 'task' + (done[i] >= t.goal ? ' done' : '') }, h('span', { class: 'tk' }, done[i] >= t.goal ? '✅' : '⬜'), h('span', { class: 'tl' }, t.label), h('span', { class: 'tn' }, `${Math.min(done[i], t.goal)}/${t.goal}`))));
}
export function home() {
  const u = user(), st = S.stats(u.id), p = S.P(u.id);
  const rewards = (X.cfg.rewards || []).slice().sort((a, b) => a.stars - b.stars);
  const next = rewards.find(r => r.stars > st.total), G = goal(), pct = Math.min(100, st.total / G * 100);
  const marks = h('div', { class: 'marks' }, rewards.map(r => h('span', { class: 'mk' + (st.total >= r.stars ? ' on' : ''), style: `left:${Math.min(100, r.stars / G * 100)}%` }, r.stars)));
  const jar = h('section', { class: 'jar' },
    h('div', { class: 'jar-top' }, h('div', { class: 'jar-n' }, '⭐ ', h('b', {}, st.total), h('small', {}, ` / ${G}`)), h('div', { class: 'jar-s' }, `今天 +${st.today}/${cap()}` + (S.streak(u.id) ? ` · 🔥连续 ${S.streak(u.id)} 天` : ''))),
    h('div', { class: 'bar' }, h('i', { style: `width:${pct}%` })), marks,
    h('p', { class: 'jar-t' }, next ? `再得 ${next.stars - st.total} 颗星，就能换「${next.label}」` : '所有奖励都拿到啦！'),
    st.today >= cap() ? h('p', { class: 'jar-t' }, '今天的星星拿满啦，明天再来～') : null);
  const subjectCards = u.subjects.map(id => {
    const s = subj(id); if (!s) return null;
    const speak = s.sets[0].kind === 'speaking';
    const em = speak ? `已打卡 ${Object.keys(p.speak).filter(k => k.startsWith(s.sets[0].id)).length}/7 天` : `${s.sets.filter(x => p.sets[x.id]).length}/${s.sets.length} 已完成`;
    const card = h('a', { class: 'card', href: '#/s/' + id }, h('span', { class: 'ic' }, s.icon), h('b', {}, s.title), h('small', {}, s.desc), h('em', {}, em));
    card._area = /math/.test(id) ? 'math' : 'eng'; return card;
  }).filter(Boolean);
  const randCards = (u.random || []).map(k => {
    const R = RANDOM[k]; const card = h('a', { class: 'card alt', href: '#/rand/' + k }, h('span', { class: 'ic' }, R.icon), h('b', {}, R.title), h('small', {}, '随机出题，不重样'), h('em', {}, `今天 ${S.starsToday(u.id)}/${cap()} 颗`));
    card._area = /^(math|chap)/.test(k) ? 'math' : 'eng'; return card;
  });
  const areas = [['math', '📐 数学'], ['eng', '🔤 英语']].map(([a, t]) => {
    const cs = [...subjectCards, ...randCards].filter(c => c._area === a); if (!cs.length) return null;
    return [h('h2', { class: 'sh' }, t), h('div', { class: 'grid' }, cs)];
  });
  const wrongN = st.wrong;
  mount(h('div', { class: 'page home' },
    h('header', { class: 'hello' }, h('div', {}, h('small', {}, '你好，'), h('h1', {}, u.display + ' 👋')), h('div', { class: 'hbtns' }, h('button', { class: 'link', onclick: () => { const f = ((p.font || 0) + 1) % 3; p.font = f; S.save(u.id); setTheme(u); toast(['字号：标准', '字号：大', '字号：特大'][f]); } }, 'Aa'), h('button', { class: 'link', onclick: () => { if (confirm('切换同学？')) { S.setUser(null); nav('#/login'); } } }, '切换'))),
    jar, taskCard(u),
    areas,
    h('h2', { class: 'sh' }, '我的'),
    h('div', { class: 'grid' },
      h('a', { class: 'card plain', href: '#/errors' }, h('span', { class: 'ic' }, '📒'), h('b', {}, '错题本'), h('small', {}, wrongN ? '做错的题在这里再练' : '现在是空的，真棒'), wrongN ? h('em', { class: 'badge' }, wrongN + ' 道') : null),
      h('a', { class: 'card plain', href: '#/me' }, h('span', { class: 'ic' }, '📊'), h('b', {}, '我的记录'), h('small', {}, '星星、进度、发给家长')))));
}

// ---------------- 科目页 ----------------
export function subject(id) {
  const u = user(), s = subj(id), p = S.P(u.id);
  const rows = s.sets.map(m => {
    let chip;
    if (m.kind === 'speaking') { const n = Object.keys(p.speak).filter(k => k.startsWith(m.id)).length; chip = h('span', { class: 'chip' + (n ? ' ok' : '') }, n ? `${n}/7 天` : '开始'); }
    else { const rec = p.sets[m.id]; chip = rec ? h('span', { class: 'chip ok' }, `上次 ${rec.last.ok}/${rec.last.total}`) : h('span', { class: 'chip' }, '未做'); }
    return h('a', { class: 'row', href: (m.kind === 'speaking' ? '#/speak/' : '#/set/') + m.id }, h('div', {}, h('b', {}, m.title), h('small', {}, m.subtitle)), chip);
  });
  const extra = s.sets.some(x => x.kind === 'listening')
    ? h('button', { class: 'btn ghost wide', onclick: () => prefetchAudio(s) }, '⬇ 把这一科的听力保存到手机（没网也能听）') : null;
  mount(page(s.title, [h('div', { class: 'list' }, rows), extra]));
}
async function prefetchAudio(s) {
  const files = s.sets.map(m => `audio/${m.id}.mp3`).filter(f => X.audio.has(f));
  if (!files.length) { toast('听力音频还没有放进来'); return; }
  let n = 0; toast(`开始保存 ${files.length} 个音频…`, 4000);
  for (const f of files) { try { const r = await fetch(f); if (r.ok) { await r.arrayBuffer(); n++; } } catch (e) { /* ignore */ } }
  toast(n === files.length ? '已全部保存，没网也能听了' : `保存了 ${n}/${files.length} 个，网络好时再试一次`, 3500);
}

// ---------------- 原文 / 听力 ----------------
function passageNode(set) {
  const box = h('section', { class: 'passage' });
  if (set.dialogue) set.dialogue.forEach(l => box.append(h('p', { class: 'dlg' }, h('b', {}, l.s + ': '), l.t)));
  else (set.passage || []).forEach(t => box.append(h('p', {}, t)));
  if (set.vocab) box.append(vocabNode(set.vocab));
  return box;
}
function transcriptNode(set) {
  const box = h('div', { class: 'script' });
  set.transcript.forEach(l => box.append(set.transcript.length === 1 ? h('p', {}, l.t) : h('p', {}, h('b', {}, l.s + ': '), l.t)));
  return box;
}
function listenNode(set, withScript) {
  const box = h('section', { class: 'listen' }, h('h3', {}, '🎧 听力'));
  if (X.audio.has(set.audio)) box.append(h('audio', { controls: true, preload: 'none', src: set.audio }), h('p', { class: 'hint' }, '音频里已经读了两遍。先看题，再听，听的时候不要看原文。'));
  else box.append(h('p', { class: 'note' }, '这一组的音频还没有放进来。可以请家长先把原文读两遍（原文在交卷后显示）。'));
  if (withScript) box.append(h('details', { class: 'ctx', open: true }, h('summary', {}, '听力原文'), transcriptNode(set)));
  return box;
}

// ---------------- 题库套题 ----------------
export async function setView(id) {
  const set = await loadSet(id);
  startBank(set);
}
function startBank(set) {
  const u = user(), sm = setMeta(set.id);
  const ctxFn = (done) => set.kind === 'listening' ? listenNode(set, done) : set.kind === 'reading' ? (done ? h('details', { class: 'ctx' }, h('summary', {}, '📖 原文'), passageNode(set)) : passageNode(set)) : set.tip ? h('div', { class: 'tip' }, '💡 ' + set.tip) : null;
  mount(runQuiz({
    uid: u.id, title: set.title, subtitle: set.subtitle, ctxFn, sections: set.sections, recId: set.id,
    back: '#/s/' + sm.subject.id, printHref: '#/print/' + set.id,
    metaFor: () => ({ setId: set.id, title: set.title, src: 'bank', sub: sm.subject.id, kind: set.kind }),
    again: () => startBank(set),
  }));
}

// ---------------- 重点词：音标 + 发音 ----------------
const ipaFor = (en) => {
  const m = X.ipa || {}, t = m[en] || m[en.toLowerCase()]; if (t) return t;
  const parts = en.split(/\s+/).map(w => m[w] || m[w.toLowerCase()]);
  return parts.length && parts.every(Boolean) ? parts.join(' ') : '';
};
function vocabNode(str) {
  const items = String(str).split(/\s*·\s*/).map(part => { const m = part.trim().match(/^(.*?)\s*([（(]?[\u4e00-\u9fff].*)$/); return m ? { en: m[1].trim(), zh: m[2].trim() } : { en: part.trim(), zh: '' }; }).filter(x => x.en);
  return h('div', { class: 'vocab vlist' }, h('b', {}, '重点词（点一下听发音）'),
    h('div', { class: 'vwrap' }, items.map(it => { const ip = ipaFor(it.en); return h('button', { type: 'button', class: 'vchip', onclick: () => playSay(slug(it.en), it.en, X.audio) },
      h('span', { class: 've' }, it.en), ip ? h('span', { class: 'ipa sm' }, '/' + ip + '/') : null, h('span', { class: 'vz' }, it.zh)); })));
}

// ---------------- 答题引擎 ----------------
const mathish = (q) => !q.plain && (q.type === 'math' || String(q.id).startsWith('r-'));
const stemHtml = (q) => (mathish(q) ? mathHtml(q.stem) : esc(q.stem));
const speakRow = (q) => h('div', { class: 'speakrow' },
  q.say ? h('button', { type: 'button', class: 'spk', onclick: () => playSay(q.sayKey, q.say, X.audio) }, '🔊 听发音') : null,
  q.ipaQ ? h('span', { class: 'ipa' }, '/' + q.ipaQ + '/') : null,
  q.bold ? h('span', { class: 'bmark' }, '★ 重点词，要会拼写') : null);

function ctxDetails(meta) {
  const body = h('div', { class: 'ctxbody' }); let loaded = false;
  return h('details', { class: 'ctx', ontoggle: async (e) => {
    if (e.target.open && !loaded) { loaded = true; try { const set = await loadSet(meta.setId); body.append(set.kind === 'listening' ? listenNode(set, true) : passageNode(set)); } catch (err) { body.textContent = '原文加载失败'; } }
  } }, h('summary', {}, meta.kind === 'listening' ? '🎧 听力和原文' : '📖 看原文'), body);
}

function renderQ(q, no, ans, update) {
  const box = h('article', { class: 'q', id: 'q-' + q.id });
  const setA = (v) => { ans[q.id] = v; update(); };
  const head = (html) => h('div', { class: 'stem' }, h('span', { class: 'no' }, no), h('div', { class: 'qt', html }));
  if (q.type === 'choice') {
    box.append(head(stemHtml(q)));
    if (q.say || q.bold) box.append(speakRow(q));
    const btns = q.options.map((t, k) => h('button', { type: 'button', class: 'opt', onclick: () => { btns.forEach((x, j) => x.classList.toggle('on', j === k)); setA('ABCD'[k]); } }, h('b', {}, 'ABCD'[k]), h('span', {}, t)));
    box.append(h('div', { class: 'opts' }, btns));
  } else if (q.type === 'tf') {
    box.append(head(esc(q.stem)));
    const mk = (v, label) => h('button', { type: 'button', class: 'opt tfb', onclick: (e) => { bs.forEach(x => x.classList.remove('on')); e.currentTarget.classList.add('on'); setA(v); } }, label);
    const bs = [mk('T', '对  T'), mk('F', '错  F')];
    box.append(h('div', { class: 'opts two' }, bs));
  } else if (q.type === 'fill') {
    if (q.hint) box.append(h('span', { class: 'pill' }, q.hint));
    if (q.say || q.bold) box.append(speakRow(q));
    const parts = q.stem.split(/_{2,}/), inputs = [];
    const line = h('div', { class: 'qt fillq' });
    const read = () => setA(inputs.map(e => e.value));
    parts.forEach((txt, i) => {
      line.append(txt);
      if (i < parts.length - 1) {
        let el;
        if (q.bank && q.bankMode === 'select') el = h('select', { class: 'blank sel', onchange: read }, h('option', { value: '' }, '选词'), q.bank.map(w => h('option', { value: w }, w)));
        else { const len = Math.max(...q.answers[i].map(s => s.length)); el = h('input', { class: 'blank', type: 'text', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', style: `width:${Math.max(6, len + 3)}ch`, oninput: read }); }
        inputs.push(el); line.append(el);
      }
    });
    box.append(h('div', { class: 'stem' }, h('span', { class: 'no' }, no), line));
  } else if (q.type === 'short') {
    box.append(head(esc(q.stem)));
    box.append(h('input', { class: 'blank wide', type: 'text', placeholder: '写下你的答案（英文）', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', oninput: (e) => setA(e.target.value) }));
  } else if (q.type === 'math') {
    box.append(head(mathHtml(q.stem) + (q.stem.length < 60 && !/[=＝？?]/.test(q.stem) ? ' = ？' : '')));
    if (q.kindName) box.append(h('span', { class: 'pill' }, q.kindName));
    const inp = h('input', { class: 'mi', readonly: true, inputmode: 'none', placeholder: '点这里输入答案', oninput: () => setA(inp.value) });
    inp.dataset.full = q.digits ? '0' : '1'; inp.addEventListener('click', () => keypad.open(inp, !q.digits));
    box.append(inp);
  }
  if (q._meta && (q._meta.kind === 'reading' || q._meta.kind === 'listening') && q._meta.setId) box.append(ctxDetails(q._meta));
  return box;
}

// 静默检查：有问题的题直接跳过，不让整套练习崩掉
export function validQ(q) {
  try {
    if (!q || !q.id || !String(q.stem || '').trim()) return false;
    if (q.type === 'choice') return Array.isArray(q.options) && q.options.length >= 2 && new Set(q.options).size === q.options.length && /^[A-Z]$/.test(q.answer) && q.answer.charCodeAt(0) - 65 < q.options.length;
    if (q.type === 'tf') return q.answer === 'T' || q.answer === 'F';
    if (q.type === 'fill') return Array.isArray(q.answers) && q.answers.length > 0 && q.answers.every(a => Array.isArray(a) && a.length);
    if (q.type === 'short') return Array.isArray(q.accept) && q.accept.length > 0;
    if (q.type === 'math') return String(q.answer || '').trim() !== '';
    return false;
  } catch (e) { return false; }
}
function runQuiz(o) {
  o = { ...o, sections: o.sections.map(sec => ({ ...sec, questions: sec.questions.filter(validQ) })).filter(sec => sec.questions.length) };
  const ans = {}, qs = [];
  const info = h('span', { class: 'info' });
  const submit = h('button', { class: 'btn primary', onclick: finish }, '交卷');
  const update = () => { const n = qs.filter(q => isAnswered(q, ans[q.id])).length; info.textContent = `已答 ${n} / ${qs.length}`; submit.classList.toggle('ready', n === qs.length); };
  const secs = o.sections.map(sec => {
    const box = h('section', { class: 'sec' });
    if (sec.title) box.append(h('h2', {}, sec.title));
    if (sec.bank && sec.bankMode) box.append(h('p', { class: 'bank' }, h('span', {}, sec.bankMode === 'select' ? '方框里的词：' : '可以用的动词：'), sec.bank.map(w => h('i', {}, w))));
    sec.questions.forEach(q0 => {
      const q = { ...q0 }; if (sec.bank) { q.bank = sec.bank; q.bankMode = sec.bankMode; }
      qs.push(q); box.append(renderQ(q, qs.length, ans, update));
    });
    return box;
  });
  update();
  function finish() {
    const left = qs.filter(q => !isAnswered(q, ans[q.id])).length;
    if (left && !confirm(`还有 ${left} 题没做，确定交卷吗？没做的算错。`)) return;
    const results = qs.map(q => ({ q, a: ans[q.id], g: gradeQuestion(q, ans[q.id]) }));
    let newStars = 0, capped = 0, pts = 0, ptsAll = 0, okN = 0;
    results.forEach(r => {
      const meta = o.metaFor(r.q); const { _meta, ...clean } = r.q;
      ptsAll += r.q.pts || 1;
      if (String(r.q.id).startsWith('r-') && r.q.typeId) S.typeStat(o.uid, r.q.typeId, r.g.ok);
      if (r.g.ok) {
        okN++; pts += r.q.pts || 1; S.clearWrong(o.uid, r.q.id);
        const s = S.award(o.uid, r.q, meta.src, meta.sub, cap()); r.star = s;
        if (s === 'new') newStars++; if (s === 'capped') capped++;
      } else S.addWrong(o.uid, clean, meta);
    });
    const m0 = qs.length ? o.metaFor(qs[0]) : {};
    S.recordAttempt(o.uid, o.recId || null, { title: o.recTitle || o.title, ok: okN, total: qs.length, pts, ptsAll, stars: newStars, src: m0.src, sub: m0.sub });
    keypad.close();
    mount(resultsNode(o, results, { newStars, capped, okN, pts, ptsAll }));
  }
  return page(o.title, [
    o.subtitle ? h('p', { class: 'subtitle' }, o.subtitle) : null,
    o.ctxFn ? o.ctxFn(false) : null, secs,
    h('div', { class: 'submitbar' }, info, submit)], { back: o.back, right: o.printHref ? h('a', { class: 'back r', href: o.printHref }, '🖨 打印') : null });
}

function resultsNode(o, results, sum) {
  const total = results.length, ratio = sum.okN / total;
  const had = sum.okN - sum.newStars - sum.capped;
  const head = h('section', { class: 'result' },
    h('div', { class: 'big' }, h('b', {}, sum.okN), h('small', {}, ` / ${total} 题答对`)),
    sum.ptsAll !== total ? h('p', { class: 'pts' }, `得分 ${sum.pts} / ${sum.ptsAll}`) : null,
    h('p', { class: 'praise' }, praiseText(ratio)),
    h('div', { class: 'earn' + (sum.newStars ? ' on' : '') }, sum.newStars ? `⭐ × ${sum.newStars}` : '这次没有新星星'),
    had > 0 ? h('p', { class: 'note' }, `有 ${had} 题以前已经得过星星，一题只得一颗哦。`) : null,
    sum.capped ? h('p', { class: 'note' }, `今天的星星已经拿满 ${cap()} 颗，明天再来～（做对的题明天再做还能得星）`) : null,
    results.length - sum.okN ? h('p', { class: 'note' }, `做错的 ${results.length - sum.okN} 题已放进错题本，再做对就会消失。`) : null);
  const acts = h('div', { class: 'acts' },
    o.again ? h('button', { class: 'btn primary', onclick: o.again }, '再做一遍') : null,
    h('a', { class: 'btn ghost', href: o.back || '#/' }, '返回'));
  let only = false;
  const list = h('div', { class: 'rvlist' }, results.map((r, i) => reviewItem(r, i + 1)));
  const toggle = h('button', { class: 'btn ghost small', onclick: () => { only = !only; list.classList.toggle('onlybad', only); toggle.textContent = only ? '看全部' : '只看错题'; } }, '只看错题');
  return page('结果', [head, acts, o.ctxFn ? o.ctxFn(true) : null, h('div', { class: 'rvhead' }, h('h2', {}, '答案与解析'), results.length - sum.okN ? toggle : null), list], { back: o.back });
}

function reviewItem(r, no) {
  const q = r.q, ok = r.g.ok;
  const short = q.type === 'fill' ? q.stem.replace(/_{2,}/g, '____') : q.stem;
  const body = h('div', { class: 'rvb' },
    ok ? null : h('p', { class: 'mine' }, h('b', {}, '你的答案：'), h('span', { html: q.type === 'math' ? mathHtml(userText(q, r.a)) : esc(userText(q, r.a)) })),
    h('p', { class: 'right' }, h('b', {}, '正确答案：'), h('span', { html: q.type === 'math' ? mathHtml(answerText(q)) : esc(answerText(q)) })),
    q.rv ? h('p', { class: 'rvsay' }, h('button', { type: 'button', class: 'spk', onclick: () => playSay(q.rv.key, q.rv.say, X.audio) }, '🔊'), q.rv.ipa ? h('span', { class: 'ipa' }, '/' + q.rv.ipa + '/') : null, q.bold ? h('span', { class: 'bmark' }, '★ 重点词，要会拼写') : null) : null,
    r.g.note ? h('p', { class: 'note' }, r.g.note) : null,
    q.why ? h('p', { class: 'why' }, h('b', {}, '解析：'), ...String(q.why).split('\n').flatMap((t, i) => [i ? h('br') : null, t])) : null,
    r.star === 'new' ? h('p', { class: 'got' }, '⭐ +1') : null);
  return h('details', { class: 'rv ' + (ok ? 'ok' : 'bad'), open: !ok },
    h('summary', {}, h('span', { class: 'mark' }, ok ? '✓' : '✗'), h('span', { class: 'no' }, no), h('span', { class: 'rvs', html: mathish(q) ? mathHtml(short) : esc(short) })), body);
}

// ---------------- 随机练习 ----------------
export function randSetup(kind) {
  const u = user(), R = RANDOM[kind];
  let type = 'mix', level = 2, count = 10;
  const stats = S.P(u.id).rand.types;
  const weak = R.types.map(t => ({ t, s: stats[t.id] })).filter(x => x.s && x.s.n >= 3 && x.s.w / x.s.n >= 0.4).sort((a, b) => b.s.w / b.s.n - a.s.w / a.s.n).slice(0, 3);
  const chipRow = (label, items, get, set) => {
    const row = h('div', { class: 'chips' }, h('span', { class: 'lab' }, label));
    const btns = items.map(it => h('button', { type: 'button', class: 'chipb' + (get() === it.v ? ' on' : ''), onclick: () => { set(it.v); btns.forEach((b, i) => b.classList.toggle('on', items[i].v === it.v)); } }, it.n));
    row.append(...btns); return row;
  };
  const n = S.starsToday(u.id);
  mount(page(R.title, [
    h('section', { class: 'jar mini' }, h('div', { class: 'jar-top' }, h('div', { class: 'jar-n' }, '今天的星星'), h('div', { class: 'jar-s' }, `${n} / ${cap()}`)),
      h('div', { class: 'bar' }, h('i', { style: `width:${Math.min(100, n / cap() * 100)}%` }))),
    weak.length ? h('p', { class: 'note' }, '最近容易错：' + weak.map(x => x.t.name).join('、') + '。选「综合」会多出这些题。') : null,
    chipRow('题型', [{ v: 'mix', n: '综合（自动盯弱项）' }, ...R.types.map(t => ({ v: t.id, n: t.name }))], () => type, v => { type = v; }),
    R.levels ? chipRow('难度', R.levels.map((x, i) => ({ v: i + 1, n: x })), () => level, v => { level = v; }) : null,
    chipRow('题数', [{ v: 5, n: '5 题' }, { v: 10, n: '10 题' }], () => count, v => { count = v; }),
    h('button', { class: 'btn primary wide', onclick: () => startRandom(kind, () => type, () => level, () => count) }, '开始'),
    h('p', { class: 'note' }, '答对的题有星星，每天最多 ' + cap() + ' 颗；做错的题会进错题本。'),
  ]));
}
function startRandom(kind, gt, gl, gc) {
  const u = user(), R = RANDOM[kind];
  const run = () => {
    const qs = makeSession(kind, gt(), gl(), gc(), S.P(u.id).rand.types, X.vocab[R.vocab]);
    if (!qs.length) { toast('出题失败，请重试'); return; }
    mount(runQuiz({
      uid: u.id, title: R.title, subtitle: R.levels ? R.levels[gl() - 1] : '', sections: [{ title: '', questions: qs }],
      recTitle: R.title + '（随机）', back: '#/rand/' + kind,
      metaFor: () => ({ title: R.title, src: 'rand', sub: R.subject, kind: 'rand' }), again: run,
    }));
  };
  run();
}

// ---------------- 错题本 ----------------
export function errors() {
  const u = user(), list = Object.values(S.P(u.id).wrong);
  if (!list.length) { mount(page('错题本', h('div', { class: 'empty' }, h('div', { class: 'logo' }, '🎉'), h('h2', {}, '错题本是空的'), h('p', {}, '做错的题会自动进来，再做对就会消失。')))); return; }
  const tnames = {}; Object.values(RANDOM).forEach(R => R.types.forEach(t => { tnames[t.id] = t.name; }));
  const keyOf = (e) => (e.q.typeId && tnames[e.q.typeId]) ? `${e.meta.title} · ${tnames[e.q.typeId]}` : e.meta.title;
  const groups = {};
  list.forEach(e => { (groups[keyOf(e)] = groups[keyOf(e)] || []).push(e); });
  const start = (es, label) => {
    const pick = es.slice().sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : b.n - a.n)).slice(0, 10);
    const qs = pick.map(e => ({ ...e.q, _meta: e.meta }));
    mount(runQuiz({ uid: u.id, title: label ? '错题专项：' + label : '错题重做', subtitle: `这次 ${qs.length} 题`, sections: [{ title: '', questions: qs }], recTitle: '错题本重做', back: '#/errors', metaFor: q => q._meta, again: () => errors() }));
  };
  const entries = Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  mount(page('错题本', [
    h('p', { class: 'note' }, `一共 ${list.length} 道，分成 ${entries.length} 类。点下面一类，就只练这一类；每次最多 10 题，做对就从这里消失。`),
    h('button', { class: 'btn primary wide', onclick: () => start(list, '') }, '全部混着重做'),
    h('div', { class: 'list' }, entries.map(([t, es]) => h('a', { class: 'row', href: 'javascript:void(0)', onclick: (ev) => { ev.preventDefault(); start(es, t); } }, h('div', {}, h('b', {}, t), h('small', {}, es.map(e => e.q.stem.replace(/_{2,}/g, '__').slice(0, 24)).slice(0, 2).join(' ； '))), h('span', { class: 'chip bad' }, es.length + ' 道')))),
  ]));
}

// ---------------- 记录 / 发给家长 ----------------
function summaryText(u) {
  const p = S.P(u.id), st = S.stats(u.id), t = S.today();
  const todays = p.log.filter(x => x.d === t);
  const rewards = (X.cfg.rewards || []).slice().sort((a, b) => a.stars - b.stars), next = rewards.find(r => r.stars > st.total);
  const names = {}; Object.values(RANDOM).forEach(R => R.types.forEach(x => { names[x.id] = x.name; }));
  const weakT = Object.entries(p.rand.types).filter(([, s]) => s.n >= 3 && s.w / s.n >= 0.4).sort((a, b) => b[1].w / b[1].n - a[1].w / a[1].n).slice(0, 3).map(([id]) => names[id] || id);
  const weakW = Object.values(p.wrong).filter(x => x.q && x.q.rv && x.q.rv.say).sort((a, b) => b.n - a.n).map(x => x.q.rv.say).filter((w, i, a) => a.indexOf(w) === i).slice(0, 8);
  const tasks = u.tasks || [], tdone = tasks.filter(x => S.taskDone(u.id, x) >= x.goal).length;
  const lines = [`【${u.display}的练习小结】${t}`,
    `今天：做了 ${todays.length} 组，新得 ⭐${st.today} 颗` + (tasks.length ? `，任务 ${tdone}/${tasks.length}` : ''),
    S.streak(u.id) ? `🔥 连续练习 ${S.streak(u.id)} 天` : null,
    ...todays.slice(-6).map(x => `  · ${x.title}：${x.ok}/${x.total}`),
    `累计：⭐${st.total} 颗（题库 ${st.bank} · 随机 ${st.rand}）`,
    `错题本：还有 ${st.wrong} 道没掌握`];
  if (weakT.length) lines.push(`最近容易错：${weakT.join('、')}`);
  if (weakW.length) lines.push(`还没掌握的单词：${weakW.join('、')}`);
  if (next) lines.push(`下一个奖励「${next.label}」：${next.stars} 颗，还差 ${next.stars - st.total} 颗`);
  return lines.filter(Boolean).join('\n');
}
export function records() {
  const u = user(), p = S.P(u.id), st = S.stats(u.id);
  const days = {};
  p.log.forEach(x => { const d = (days[x.d] = days[x.d] || { n: 0, s: 0 }); d.n++; d.s += x.stars; });
  const dayRows = Object.entries(days).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 7).map(([d, v]) => h('div', { class: 'row static' }, h('div', {}, h('b', {}, d)), h('span', { class: 'chip' }, `${v.n} 组 · ⭐${v.s}`)));
  const names = {}; Object.values(RANDOM).forEach(R => R.types.forEach(t => { names[t.id] = t.name; }));
  const weak = Object.entries(p.rand.types).filter(([, s]) => s.n >= 3).map(([id, s]) => ({ id, rate: s.w / s.n, s })).sort((a, b) => b.rate - a.rate).slice(0, 4);
  const text = summaryText(u);
  const ta = h('textarea', { class: 'sum', readonly: true, rows: text.split('\n').length + 1 }, text);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* 下面兜底 */ }
    try { ta.removeAttribute('readonly'); ta.focus(); ta.select(); const ok = document.execCommand('copy'); ta.setAttribute('readonly', ''); return ok; } catch (e) { return false; }
  };
  const toWechat = async () => {
    const ok = await copy();
    toast(ok ? '已复制，正在打开微信，粘贴发给家长' : '请长按上面的文字，选「复制」，再去微信粘贴');
    if (ok) setTimeout(() => { location.href = 'weixin://'; }, 900);
  };
  const shareOther = async () => {
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { return; }
    toast((await copy()) ? '已复制，去微信粘贴发给家长' : '请长按上面的文字，选「复制」');
  };
  mount(page('我的记录', [
    h('section', { class: 'jar mini' }, h('div', { class: 'jar-top' }, h('div', { class: 'jar-n' }, '⭐ ', h('b', {}, st.total)), h('div', { class: 'jar-s' }, `题库 ${st.bank} · 随机 ${st.rand}`))),
    h('h2', { class: 'sh' }, '最近 7 天'), h('div', { class: 'list' }, dayRows.length ? dayRows : h('p', { class: 'note' }, '还没有记录，去做一组题吧。')),
    weak.length ? [h('h2', { class: 'sh' }, '随机练习里的弱项'), h('div', { class: 'list' }, weak.map(w => h('div', { class: 'row static' }, h('div', {}, h('b', {}, names[w.id] || w.id)), h('span', { class: 'chip' + (w.rate >= 0.4 ? ' bad' : ' ok') }, `错 ${w.s.w}/${w.s.n}`))))] : null,
    h('h2', { class: 'sh' }, '发给家长'), ta,
    h('button', { class: 'btn primary wide', onclick: toWechat }, '复制并打开微信'),
    h('button', { class: 'btn ghost wide', style: 'margin-top:10px', onclick: shareOther }, '用其他方式分享'),
    h('p', { class: 'note' }, '打开微信后，找到家长的对话，长按输入框选「粘贴」，再发送。'),
  ]));
}

// ---------------- 口语打卡 ----------------
export async function speak(id) {
  const set = await loadSet(id), u = user();
  const render = () => {
    const p = S.P(u.id);
    const days = set.plan.map(d => {
      const key = `${set.id}-d${d.day}`, done = !!p.speak[key];
      return h('div', { class: 'day' + (done ? ' done' : '') }, h('div', {}, h('b', {}, `Day ${d.day}  ${d.title}`), h('small', {}, `${d.task} · ${d.minutes} 分钟`)),
        done ? h('span', { class: 'chip ok' }, '⭐ 已打卡') : h('button', { class: 'btn small primary', onclick: () => { const r = S.award(u.id, { id: 'speak-' + key }, 'bank', set.id, cap()); S.markSpeak(u.id, key); toast(r === 'new' ? '⭐ +1  今天的口语完成啦！' : '已打卡'); render(); } }, '今天完成了'));
    });
    const sents = set.sentences.map(s => h('div', { class: 'sent' }, h('div', {}, h('b', {}, s.en), h('small', {}, s.zh)),
      X.audio.has(s.audio) ? h('button', { class: 'btn small ghost', onclick: () => { new Audio(s.audio).play().catch(() => toast('播放失败')); } }, '🔊') : null));
    mount(page(set.title, [h('ol', { class: 'steps' }, set.steps.map(t => h('li', {}, t))), h('h2', { class: 'sh' }, '7 天打卡'), h('div', { class: 'list' }, days), h('h2', { class: 'sh' }, '重点句子（每天大声读 3 遍）'), h('div', { class: 'list' }, sents)], { back: '#/s/g4speaking' }));
  };
  render();
}

// ---------------- 打印版 ----------------
export async function printView(id, withAns) {
  const set = await loadSet(id);
  const tools = h('div', { class: 'ptools noprint' },
    h('a', { class: 'btn ghost small', href: '#/set/' + id }, '‹ 返回'),
    h('a', { class: 'btn ghost small', href: '#/print/' + id + (withAns ? '' : '/a') }, withAns ? '不含答案' : '含答案（家长版）'),
    h('button', { class: 'btn primary small', onclick: () => window.print() }, '打印 / 保存为 PDF'));
  const doc = h('div', { class: 'print' }, tools, h('h1', {}, set.title), h('p', { class: 'psub' }, set.subtitle || ''),
    h('p', { class: 'pname' }, '姓名：__________   日期：__________   得分：______'));
  if (set.kind === 'reading') doc.append(passageNode(set));
  if (set.tip) doc.append(h('p', { class: 'ptip' }, '💡 ' + set.tip));
  if (set.kind === 'listening') doc.append(h('p', { class: 'ptip' }, '听力：请家长朗读原文两遍（或播放 App 里的音频），孩子先看题再听。'));
  let no = 0;
  set.sections.forEach(sec => {
    doc.append(h('h2', {}, sec.title));
    if (sec.bank) doc.append(h('p', { class: 'bank' }, sec.bank.join('   ')));
    sec.questions.forEach(q => {
      no++;
      const b = h('div', { class: 'pq' });
      if (q.type === 'choice') b.append(h('p', {}, `${no}. ${q.stem}`), h('p', { class: 'po' }, q.options.map((t, k) => `${'ABCD'[k]}. ${t}`).join('     ')));
      else if (q.type === 'tf') b.append(h('p', {}, `( )  ${no}. ${q.stem}`));
      else if (q.type === 'fill') b.append(h('p', {}, `${no}. ${q.stem}`, q.hint ? `  （${q.hint}）` : ''));
      else if (q.type === 'short') b.append(h('p', {}, `${no}. ${q.stem}`), h('p', {}, 'Answer: ______________________________'));
      else b.append(h('p', { html: `${no}. ${mathHtml(q.stem)} =` }), h('div', { class: 'work' }, '解：'), h('p', {}, '答案：____________'));
      doc.append(b);
    });
  });
  if (withAns) {
    doc.append(h('h2', { class: 'pagebreak' }, '家长页：答案与解析'));
    if (set.transcript) doc.append(h('h3', {}, '听力原文'), transcriptNode(set));
    let k = 0;
    set.sections.forEach(sec => sec.questions.forEach(q => { k++; doc.append(h('p', { class: 'pans' }, h('b', {}, `${k}. `), h('span', { html: q.type === 'math' ? mathHtml(answerText(q)) : esc(answerText(q)) }), q.why ? '　' + String(q.why).split('\n')[0] : '')); }));
  }
  mount(doc);
}
export { page, runQuiz };

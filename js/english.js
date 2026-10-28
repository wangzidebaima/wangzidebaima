// 英语：单词 / 短语 / 句子小测，按单元出题；黑体词要会拼写，非黑体词只考意思和发音
import { h, toast, playSay, slug, playScript, stopScript } from './ui.js';
import * as S from './store.js';
import { X, user, mount, page, runQuiz, cap } from './views.js';
import { RANDOM, TW, TS, weighted } from './mathgen.js';

export { slug };
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export const ENG = {
  vocab7: { book: '7', content: 'word' }, phrase7: { book: '7', content: 'phrase' },
  vocab4: { book: '4', content: 'word' }, phrase4: { book: '4', content: 'phrase' },
  sent4: { book: '4', content: 'sent' },
};
export const isEng = (k) => !!ENG[k];

// ---------- 数据 ----------
const D = {};
export async function loadBook(book) {
  if (!D.ipa) D.ipa = await fetch('data/ipa.json').then(r => r.json()).catch(() => ({}));
  if (!D[book]) {
    const r = await fetch(`data/words${book}.json`);
    if (!r.ok) throw new Error('词表加载失败');
    D[book] = await r.json();
  }
  return D[book];
}
const ipaOf = (en) => (D.ipa && D.ipa[en]) || '';
const sayText = (en) => en.replace(/\([^)]*\)/g, '').replace(/\s*\/.*$/, '').replace(/\.\.\./g, '').replace(/[?.]+$/, '').trim();

const segs = (it) => new Set(String(it.zh).split('；').map(x => x.replace(/（[^）]*）/g, '').replace(/\s/g, '')).filter(Boolean));
const share = (a, b) => { const sb = segs(b); for (const x of segs(a)) if (sb.has(x)) return true; return false; };

function poolOf(data, unitIds, content) {
  const map = new Map();
  data.units.filter(u => unitIds.includes(u.id)).forEach(u => {
    if (content === 'sent') { u.sentences.forEach(s => map.set(s.id, { ...s, unit: u.id })); return; }
    u.items.filter(it => it.kind === content).forEach(it => {
      const k = it.en.toLowerCase(), old = map.get(k);
      if (!old) map.set(k, { ...it, unit: u.id });
      else { old.bold = old.bold || it.bold; if (!old.zh.includes(it.zh)) { old.zh += '；' + it.zh; old.zh1 = old.zh1 || it.zh1; } }
    });
  });
  return [...map.values()];
}
const allOf = (data, content) => poolOf(data, data.units.map(u => u.id), content);
const spellable = (it) => it.bold && /^[A-Za-z][A-Za-z' -]*$/.test(it.en);

// ---------- 出题 ----------
function options(correct, pool, all, text, ok) {
  const out = [text(correct)], used = new Set(out);
  for (const src of [shuf(pool), shuf(all)]) {
    for (const x of src) {
      if (out.length >= 4) break;
      if (x === correct || x.en === correct.en || !ok(x) || used.has(text(x))) continue;
      used.add(text(x)); out.push(text(x));
    }
  }
  if (out.length < 4) return null;
  const opts = shuf(out);
  return { opts, answer: 'ABCD'[opts.indexOf(text(correct))] };
}
const STOP = new Set('the and are was were not you your his her our their this that these those with from have has had can will for but too also yes what who whose which when where why how there here like many some any very just then than let'.split(' '));

function build(type, it, content, pool, all, vocabSet) {
  const sent = content === 'sent';
  const key = sent ? 's-' + slug(it.id) : slug(it.en);
  const ipa = sent ? '' : ipaOf(it.en);
  const id = 'r-e-' + type + '-' + (sent ? it.id : slug(it.en));
  const base = { typeId: 'e-' + type, pts: 1, plain: true, id, bold: !!it.bold, rv: { key, say: sent ? it.en : sayText(it.en), ipa } };
  const why = sent ? `${it.en}\n${it.zh}` : `${it.en}${ipa ? '  /' + ipa + '/' : ''}\n意思：${it.zh}${it.pos ? '（' + it.pos + '）' : ''}`;
  const zhOf = (x) => (sent ? x.zh : x.zh1);
  if (type === 'en2zh' || type === 'listen') {
    const o = options(it, pool, all, zhOf, (x) => sent || !share(it, x)); if (!o) return null;
    return { ...base, type: 'choice', stem: type === 'listen' ? '听发音，选出它的意思' : (sent ? `“${it.en}” 是什么意思？` : `“${it.en}” 的意思是？`),
      options: o.opts, answer: o.answer, why, say: base.rv.say, sayKey: key, ipaQ: type === 'en2zh' ? ipa : '' };
  }
  if (type === 'zh2en') {
    const o = options(it, pool, all, (x) => x.en, (x) => sent || !share(it, x)); if (!o) return null;
    return { ...base, type: 'choice', stem: sent ? `「${it.zh}」用英语怎么说？` : `「${it.zh}」用英语怎么说？`, options: o.opts, answer: o.answer, why };
  }
  if (type === 'spell' || type === 'dict') {
    const alts = [it.en, ...all.filter(x => x.en !== it.en && share(it, x) && /^[A-Za-z][A-Za-z' -]*$/.test(x.en)).map(x => x.en)];
    const letters = it.en.replace(/[^A-Za-z]/g, '').length;
    const hint = it.kind === 'phrase' ? `${it.en.split(' ').length} 个单词，首字母 ${it.en[0]}` : `首字母 ${it.en[0]}，共 ${letters} 个字母`;
    const noun = it.kind === 'phrase' ? '短语' : '单词';
    if (type === 'spell') return { ...base, type: 'fill', stem: `「${it.zh}」的英文是：____`, answers: [alts], hint, why, tiles: it.en };
    return { ...base, type: 'fill', stem: `听发音，写出${noun}：____`, answers: [alts], hint: it.kind === 'phrase' ? `${it.en.split(' ').length} 个单词` : `共 ${letters} 个字母`, why, say: base.rv.say, sayKey: key, tiles: it.en };
  }
  if (type === 'cloze') {
    const toks = (it.en.match(/[A-Za-z']+/g) || []);
    const cand = toks.filter((w, i) => !w.includes("'") && w.length >= 3 && !STOP.has(w.toLowerCase()) && !(i > 0 && /^[A-Z]/.test(w)))
      .sort((a, b) => (vocabSet.has(b.toLowerCase()) - vocabSet.has(a.toLowerCase())) || (b.length - a.length));
    if (!cand.length) return null;
    const w = cand[0];
    return { ...base, type: 'fill', stem: it.en.replace(new RegExp('\\b' + w + '\\b'), '____'), answers: [[w]], hint: it.zh, why };
  }
  return null;
}

export function makeEngSession(kind, typeId, count, unitIds) {
  const cfg = ENG[kind], data = D[cfg.book], content = cfg.content;
  const pool = poolOf(data, unitIds, content), all = allOf(data, content);
  if (!pool.length) return [];
  const vocabSet = new Set(allOf(data, 'word').map(x => x.en.toLowerCase()));
  const stats = S.P(user().id).rand.types;
  const typeIds = (content === 'sent' ? TS : TW).map(t => t.id.slice(2));
  const out = [], seen = new Set();
  for (let g = 0; out.length < count && g < count * 60; g++) {
    let tid = typeId === 'mix' ? null : typeId.slice(2), it;
    if (tid === 'spell' || tid === 'dict') {
      const sp = pool.filter(spellable); if (!sp.length) return out;
      it = pick(sp);
    } else it = pick(pool);
    if (!tid) {
      const ok = content === 'sent' ? typeIds : (spellable(it) ? typeIds : typeIds.filter(t => t !== 'spell' && t !== 'dict'));
      tid = weighted(ok.map(t => 'e-' + t), stats).slice(2);
    }
    const q = build(tid, it, content, pool, all, vocabSet);
    if (!q || seen.has(q.id)) continue;
    seen.add(q.id); out.push(q);
  }
  return out;
}

// ---------- 页面 ----------
const unitLabel = (u) => u.name.replace('Starter Unit', 'Starter');

// 听写：先把全部词听完（每个词读两遍，间隔留给孩子写在纸上），听完后孩子自己点“显示答案”，再自己判对错
function dictFlow(u, R, qs, kind) {
  const meta = { title: R.title, src: 'rand', sub: R.subject, kind: 'rand' };
  const backTo = '#/rand/' + kind;
  const status = h('p', { class: 'note dstat' }, `一共 ${qs.length} 个，准备好纸和笔，点“开始听”。`);
  const showBtn = h('button', { class: 'btn primary wide', style: 'margin-top:10px', disabled: true, onclick: () => { stopScript(); review(); } }, '显示答案');
  const playBtn = h('button', { class: 'btn primary wide', onclick: () => {
    showBtn.disabled = true; playBtn.textContent = '正在听…（点这里重听）';
    status.textContent = `一共 ${qs.length} 个词，每个读两遍，请边听边写在纸上。`;
    const lines = []; qs.forEach(q => { lines.push({ t: q.say, s: 'x' }); lines.push({ t: q.say, s: 'x' }); });
    playScript(lines, {}, { times: 1, rate: 0.85, pause: 2600, onend: () => {
      showBtn.disabled = false; playBtn.textContent = '🔁 再听一遍';
      status.textContent = '听完啦！检查一下纸上写的，然后点“显示答案”。';
    } });
  } }, '▶ 开始听');
  mount(page('听写', [
    h('p', { class: 'note' }, '不用在手机上打字：先听完全部，写在纸上；写完自己点“显示答案”，再对一对。'),
    status, playBtn, showBtn,
  ], { back: backTo }));
  function review() {
    const mark = {};
    const done = h('button', { class: 'btn primary wide', onclick: () => {
      const left = qs.filter(q => mark[q.id] === undefined).length;
      if (left && !confirm(`还有 ${left} 个没判，没判的算错，确定吗？`)) return;
      let ok = 0, ns = 0, cp = 0;
      qs.forEach(q => {
        const { _meta, ...clean } = q;
        S.typeStat(u.id, q.typeId, mark[q.id] === true);
        if (mark[q.id] === true) { ok++; S.rightWrong(u.id, q.id); const r = S.award(u.id, q, meta.src, meta.sub, cap()); if (r === 'new') ns++; if (r === 'capped') cp++; }
        else S.addWrong(u.id, clean, meta);
      });
      S.recordAttempt(u.id, null, { title: R.title + '（随机）', ok, total: qs.length, pts: ok, ptsAll: qs.length, stars: ns, src: meta.src, sub: meta.sub });
      mount(page('听写结果', [
        h('section', { class: 'result' }, h('div', { class: 'big' }, h('b', {}, ok), h('small', {}, ` / ${qs.length} 个写对`)),
          h('p', { class: 'praise' }, ok === qs.length ? '全对！太棒了！' : '写错的已放进错题本，记得再练一练。'),
          h('p', { class: 'pts' }, `⭐ 新得 ${ns} 颗星` + (cp ? `（今天星星已满，${cp} 个不再加星）` : ''))),
        h('a', { class: 'btn primary wide', href: backTo }, '再听写一组'),
        h('a', { class: 'btn ghost wide', style: 'margin-top:10px', href: '#/' }, '回首页'),
      ], { back: backTo }));
    } }, '完成');
    const rows = qs.map((q, i) => {
      const w = q.answers[0][0], ip = q.rv && q.rv.ipa;
      const yes = h('button', { type: 'button', class: 'chipb', onclick: () => { mark[q.id] = true; yes.classList.add('on'); no.classList.remove('on'); } }, '✅ 写对了');
      const no = h('button', { type: 'button', class: 'chipb', onclick: () => { mark[q.id] = false; no.classList.add('on'); yes.classList.remove('on'); } }, '❌ 写错了');
      return h('div', { class: 'row dr' }, h('div', {}, h('b', {}, `${i + 1}. ${w}`), h('small', {}, (ip ? '/' + ip + '/  ' : '') + String(q.why).split('\n').pop().replace('意思：', ''))),
        h('button', { type: 'button', class: 'spk', onclick: () => playSay(slug(w), q.say) }, '🔊'), h('div', { class: 'chips' }, yes, no));
    });
    mount(page('对答案', [h('p', { class: 'note' }, '对照纸上写的，一个一个点“写对了 / 写错了”。拼写要完全一样才算对。'), h('div', { class: 'list' }, rows), done], { back: backTo }));
  }
}

export async function engSetup(kind) {
  const u = user(), R = RANDOM[kind], cfg = ENG[kind];
  mount(page(R.title, h('p', { class: 'note' }, '加载中…')));
  let data;
  try { data = await loadBook(cfg.book); } catch (e) { toast('词表加载失败，请连上网络再试'); return; }
  const sel = new Set(S.getUnits(u.id, cfg.book, u.unitsLearned && u.unitsLearned[cfg.book]));
  let type = 'mix', count = 10;
  const saveSel = () => S.setUnits(u.id, cfg.book, [...sel]);
  const counts = (uu) => poolOf(data, [uu.id], cfg.content).length;
  const info = h('p', { class: 'note' });
  const upd = () => { const n = poolOf(data, [...sel], cfg.content).length; info.textContent = sel.size ? `已选 ${sel.size} 个单元，共 ${n} 条${cfg.content === 'sent' ? '句子' : cfg.content === 'phrase' ? '短语' : '单词'}。` : '先点一点，选出你已经学过的单元。'; };
  const ubtns = data.units.map(uu => {
    const b = h('button', { type: 'button', class: 'chipb' + (sel.has(uu.id) ? ' on' : ''), onclick: () => { sel.has(uu.id) ? sel.delete(uu.id) : sel.add(uu.id); b.classList.toggle('on', sel.has(uu.id)); saveSel(); upd(); } }, `${unitLabel(uu)}（${counts(uu)}）`);
    return b;
  });
  const setAll = (on) => { sel.clear(); if (on) data.units.forEach(x => sel.add(x.id)); ubtns.forEach((b, i) => b.classList.toggle('on', sel.has(data.units[i].id))); saveSel(); upd(); };
  const chipRow = (label, items, get, set) => {
    const row = h('div', { class: 'chips' }, h('span', { class: 'lab' }, label));
    const btns = items.map(it => h('button', { type: 'button', class: 'chipb' + (get() === it.v ? ' on' : ''), onclick: () => { set(it.v); btns.forEach((b, i) => b.classList.toggle('on', items[i].v === it.v)); } }, it.n));
    row.append(...btns); return row;
  };
  const n = S.starsToday(u.id);
  const run = () => {
    const ids = [...sel];
    const qs = makeEngSession(kind, type, count, ids);
    if (!qs.length) { toast(type === 'e-spell' || type === 'e-dict' ? '选中的单元里没有要拼写的黑体词' : '出题失败，请多选几个单元'); return; }
    if (type === 'e-dict') { dictFlow(u, R, qs, kind); return; }
    mount(runQuiz({
      uid: u.id, mk: 'engquiz', title: R.title, subtitle: `已选 ${ids.length} 个单元`, sections: [{ title: '', questions: qs }],
      recTitle: R.title + '（随机）', back: '#/rand/' + kind,
      metaFor: () => ({ title: R.title, src: 'rand', sub: R.subject, kind: 'rand' }), again: run,
    }));
  };
  mount(page(R.title, [
    h('section', { class: 'jar mini' }, h('div', { class: 'jar-top' }, h('div', { class: 'jar-n' }, '今天的星星'), h('div', { class: 'jar-s' }, `${n} / ${cap()}`)),
      h('div', { class: 'bar' }, h('i', { style: `width:${Math.min(100, n / (cap()) * 100)}%` }))),
    kind.startsWith('sent') ? null : h('a', { class: 'btn ghost wide', href: '#/learn/' }, '🃏 还没学？先用单词卡片学一学'),
    h('div', { class: 'chips' }, h('span', { class: 'lab' }, '学过的单元（只会从这些里出题）')),
    h('div', { class: 'chips' }, ubtns),
    h('div', { class: 'chips' }, h('button', { type: 'button', class: 'btn ghost small', onclick: () => setAll(true) }, '全选'), h('button', { type: 'button', class: 'btn ghost small', onclick: () => setAll(false) }, '清空')),
    info,
    chipRow('题型', [{ v: 'mix', n: '综合（自动盯弱项）' }, ...R.types.map(t => ({ v: t.id, n: t.name }))], () => type, v => { type = v; }),
    chipRow('题数', [{ v: 5, n: '5 题' }, { v: 10, n: '10 题' }, { v: 20, n: '20 题' }], () => count, v => { count = v; }),
    h('button', { class: 'btn primary wide', onclick: () => { if (!sel.size) { toast('先选一选学过的单元'); return; } run(); } }, '开始'),
    h('a', { class: 'btn ghost wide', style: 'margin-top:10px', href: '#/words/' + kind }, cfg.content === 'sent' ? '📖 看句子，听发音' : '📖 看词表，听发音'),
    h('p', { class: 'note' }, cfg.content === 'sent' ? '每题做完才有答案，做对有星星，做错进错题本。' : '★ 黑体词要会拼写，只有黑体词会出「拼写」和「听写」题；其他词会认、会读就行。'),
  ]));
  upd();
}

export async function engWords(kind) {
  const u = user(), R = RANDOM[kind], cfg = ENG[kind];
  mount(page(R.title, h('p', { class: 'note' }, '加载中…'), { back: '#/rand/' + kind }));
  let data;
  try { data = await loadBook(cfg.book); } catch (e) { toast('词表加载失败，请连上网络再试'); return; }
  const chosen = S.getUnits(u.id, cfg.book, u.unitsLearned && u.unitsLearned[cfg.book]);
  const ids = chosen.length ? chosen : data.units.map(x => x.id);
  const play = (key, text) => playSay(key, text, X.audio);
  const blocks = data.units.filter(x => ids.includes(x.id)).map(uu => {
    const rows = cfg.content === 'sent'
      ? uu.sentences.map(s => h('div', { class: 'row' }, h('div', {}, h('b', {}, s.en), h('small', {}, s.zh)), h('button', { type: 'button', class: 'spk', onclick: () => play('s-' + slug(s.id), s.en) }, '🔊')))
      : uu.items.filter(it => it.kind === cfg.content).map(it => {
        const ip = ipaOf(it.en);
        return h('div', { class: 'row' }, h('div', {}, h('b', {}, (it.bold ? '★ ' : '') + it.en), h('small', {}, [ip ? '/' + ip + '/  ' : '', it.pos ? it.pos + ' ' : '', it.zh].join(''))),
          h('button', { type: 'button', class: 'spk', onclick: () => play(slug(it.en), sayText(it.en)) }, '🔊'));
      });
    return [h('h2', { class: 'sh' }, uu.name), h('div', { class: 'list' }, rows)];
  });
  mount(page(cfg.content === 'sent' ? '句子' : cfg.content === 'phrase' ? '短语表' : '单词表', [
    h('p', { class: 'note' }, (chosen.length ? '只显示你选的单元。' : '你还没选单元，先显示全部。') + (cfg.content === 'sent' ? '' : ' ★ 是黑体词，要会拼写。点 🔊 听发音。')), blocks], { back: '#/rand/' + kind }));
}

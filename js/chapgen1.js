// 一年级上册数学（北师大版）章节随机出题：生活中的数、5以内数加与减、整理与分类、10以内数加与减、有趣的立体图形
// 孩子刚入学、识字很少：题干尽量短，数量用图（emoji）表示，每题都可以点「听题」让手机读出来。
import { chapTypes } from './chapgen.js';
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hash = (s) => { let x = 5381; for (const c of s) x = ((x << 5) + x + c.charCodeAt(0)) >>> 0; return x.toString(36); };
const Q = (typeId, stem, ans, steps, extra) => Object.assign({ type: 'math', typeId, stem, answer: String(ans), pts: 1, id: 'r-' + typeId + '-' + hash(stem + (extra && extra.img ? extra.img : '')), digits: true,
  why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${ans}` }, extra || {});
const MC = (typeId, stem, correct, wrongs, steps, extra) => {
  const ws = [...new Set(wrongs.map(String).filter(w => w !== String(correct)))].slice(0, 3); if (ws.length < 2) return null;
  const opts = shuf([String(correct), ...ws]);
  return Object.assign({ type: 'choice', plain: true, typeId, stem, options: opts, answer: 'ABCD'[opts.indexOf(String(correct))], pts: 1, id: 'r-' + typeId + '-' + hash(stem + correct + (extra && extra.img ? extra.img : '')),
    why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${correct}` }, extra || {});
};
const ICONS = ['🍎', '🐟', '⭐', '🌸', '🐥', '🎈', '🍓', '🚗'];
// 一排小图：n 个 emoji，最多两行，每行 10 个
const row = (icon, n, y0 = 30) => Array.from({ length: n }, (_, i) => `<text x="${14 + (i % 10) * 30}" y="${y0 + Math.floor(i / 10) * 34}" font-size="24">${icon}</text>`).join('');
const pic = (items, h = 60) => `<svg viewBox="0 0 320 ${h}" xmlns="http://www.w3.org/2000/svg">${items}</svg>`;
const CN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

const E1 = [
  { id: 'count', name: '数一数', gen: (L) => { const n = ri(1, L === 1 ? 5 : 10), ic = pick(ICONS);
    return Q('m1-e1-count', '数一数，一共有几个？', n, [`一个一个数，不重复，不漏掉`, `一共有 ${n} 个`], { img: pic(row(ic, n)) }); } },
  { id: 'more', name: '哪边多', gen: (L) => { let a, b; do { a = ri(1, L === 1 ? 6 : 10); b = ri(1, L === 1 ? 6 : 10); } while (a === b); const i1 = ICONS[0], i2 = ICONS[1];
    const svg = pic(row(i1, a, 26) + row(i2, b, 66), 76);
    return MC('m1-e1-more', `上面一行是${i1}，下面一行是${i2}。哪一行多？`, a > b ? '上面一行' : '下面一行', ['上面一行', '下面一行', '一样多'], ['数一数每一行有几个', `${a} 和 ${b} 比，${a > b ? '上面' : '下面'}多`], { img: svg }); } },
  { id: 'order', name: '数的顺序', gen: (L) => { const mx = L === 1 ? 6 : 10, s = ri(1, mx - 2);
    if (Math.random() < 0.5) return Q('m1-e1-order', `${s}，____，${s + 2}`, s + 1, ['按顺序数数', `${s}、${s + 1}、${s + 2}`]);
    const a = ri(1, mx - 1); return MC('m1-e1-order', `比 ${a} 大 1 的数是几？`, a + 1, [a - 1 >= 0 ? a - 1 : a + 2, a + 2, a], [`数到 ${a}，再往后数 1 个就是 ${a + 1}`]); } },
  { id: 'ordinal', name: '第几个', gen: (L) => { const n = ri(5, L === 1 ? 6 : 8), k = ri(1, n), ic = pick(['🐶', '🐱', '🐰', '🐼']);
    return MC('m1-e1-ordinal', `从左边数起，小红旗 🚩 排第几？`, k, [ri(1, n), ri(1, n), k + 1, k - 1].filter(x => x >= 1 && x <= n), [`从左边开始数，数到 🚩 就是第 ${k}`],
      { img: pic(Array.from({ length: n }, (_, i) => `<text x="${14 + i * 36}" y="38" font-size="26">${i + 1 === k ? '🚩' : ic}</text>`).join(''), 52) }); } },
  { id: 'cmp', name: '比大小', gen: (L) => { const mx = L === 1 ? 6 : 10; let a, b; a = ri(0, mx); b = ri(0, mx); const rel = a > b ? '>' : a < b ? '<' : '=';
    return MC('m1-e1-cmp', `${a} ○ ${b}，圆圈里填什么？`, rel, ['>', '<', '='], ['大的一边开口朝着大的数', `${a} 和 ${b} 比，选 ${rel}`], { sayText: `${a}和${b}比，圆圈里填大于号、小于号还是等于号？` }); } },
];
const E2 = [
  { id: 'add', name: '5以内加法', gen: (L) => { const s = ri(2, 5), a = ri(0, s), b = s - a; return Q('m1-e2-add', `${a} + ${b} = ?`, s, [`${a} 和 ${b} 合起来是 ${s}`], { sayText: `${a}加${b}等于几？` }); } },
  { id: 'sub', name: '5以内减法', gen: (L) => { const a = ri(1, 5), b = ri(0, a); return Q('m1-e2-sub', `${a} − ${b} = ?`, a - b, [`从 ${a} 里去掉 ${b}，还剩 ${a - b}`], { sayText: `${a}减${b}等于几？` }); } },
  { id: 'story', name: '看图列算式', gen: (L) => { const a = ri(1, 4), b = ri(1, 5 - a), ic = pick(ICONS);
    return Q('m1-e2-story', `左边有 ${a} 个，又来了 ${b} 个。一共有几个？`, a + b, [`合起来，用加法：${a}+${b}=${a + b}`], { img: pic(row(ic, a) + `<text x="${14 + a * 30 + 10}" y="30" font-size="22">＋</text>` + Array.from({ length: b }, (_, i) => `<text x="${14 + a * 30 + 44 + i * 30}" y="30" font-size="24">${ic}</text>`).join('')), sayText: `左边有${a}个，又来了${b}个。一共有几个？` }); } },
  { id: 'away', name: '飞走了几个', gen: (L) => { const a = ri(2, 5), b = ri(1, a - 1), ic = pick(['🐥', '🐦', '🦆']);
    return Q('m1-e2-away', `有 ${a} 只，飞走了 ${b} 只。还剩几只？`, a - b, [`飞走了，用减法：${a}−${b}=${a - b}`], { img: pic(row(ic, a)), sayText: `有${a}只，飞走了${b}只。还剩几只？` }); } },
  { id: 'zero', name: '认识 0', gen: () => { const a = ri(1, 5), f = pick([0, 1, 2]);
    const stem = f === 0 ? `${a} − ${a} = ?` : f === 1 ? `${a} + 0 = ?` : `0 + ${a} = ?`;
    return Q('m1-e2-zero', stem, f === 0 ? 0 : a, [f === 0 ? '全部去掉，什么也不剩，是 0' : '加上 0，数不变'], { sayText: stem.replace('+', '加').replace('−', '减').replace('= ?', '等于几？') }); } },
];
const E3 = [
  { id: 'kind', name: '哪个不一样', gen: () => {
    const g = [['🍎', '🍌', '🍇', '🍓'], ['🐶', '🐱', '🐰', '🐼'], ['🚗', '🚌', '🚲', '✈️']], odd = [['⚽', '水果'], ['🌳', '动物'], ['🍎', '交通工具']];
    const k = ri(0, 2), a = shuf(g[k]).slice(0, 3), o = odd[k][0], opts = shuf([...a, o]);
    return Object.assign({ type: 'choice', plain: true, typeId: 'm1-e3-kind', stem: `哪一个和其他三个不是一类？`, options: opts, answer: 'ABCD'[opts.indexOf(o)], pts: 1, id: 'r-m1-e3-kind-' + hash(opts.join('')), why: `其他三个是${odd[k][1]}，${o} 不是。\n答案：${o}`, sayText: '哪一个和其他三个不是一类？' }); } },
  { id: 'cnt', name: '分类数一数', gen: (L) => { const a = ri(1, 6), b = ri(1, 6), i1 = '🍎', i2 = '🐟', all = shuf([...Array(a).fill(i1), ...Array(b).fill(i2)]); const which = pick([i1, i2]), n = which === i1 ? a : b;
    return Q('m1-e3-cnt', `一共有几个 ${which} ？`, n, [`只数 ${which}，别的不数`], { img: pic(all.map((c, i) => `<text x="${14 + (i % 10) * 30}" y="${30 + Math.floor(i / 10) * 34}" font-size="24">${c}</text>`).join(''), 70), sayText: '只数指定的那一种，一共有几个？' }); } },
  { id: 'more', name: '哪类多', gen: () => { let a, b; do { a = ri(1, 7); b = ri(1, 7); } while (a === b); const all = shuf([...Array(a).fill('🍎'), ...Array(b).fill('🐟')]);
    return MC('m1-e3-more', '🍎 和 🐟，哪一种多？', a > b ? '🍎' : '🐟', ['🍎', '🐟', '一样多'], [`数一数：🍎 有 ${a} 个，🐟 有 ${b} 个`], { img: pic(all.map((c, i) => `<text x="${14 + (i % 10) * 30}" y="${30 + Math.floor(i / 10) * 34}" font-size="24">${c}</text>`).join(''), 70), sayText: '苹果和小鱼，哪一种多？' }); } },
];
const E4 = [
  { id: 'add', name: '10以内加法', gen: (L) => { const s = ri(L === 1 ? 5 : 6, 10), a = ri(L === 3 ? 2 : 1, s - 1), b = s - a; return Q('m1-e4-add', `${a} + ${b} = ?`, s, [`${a} 和 ${b} 合起来是 ${s}`], { sayText: `${a}加${b}等于几？` }); } },
  { id: 'sub', name: '10以内减法', gen: (L) => { const a = ri(L === 1 ? 5 : 6, 10), b = ri(1, a - 1); return Q('m1-e4-sub', `${a} − ${b} = ?`, a - b, [`想：${b} 加几得 ${a}？`, `${a}−${b}=${a - b}`], { sayText: `${a}减${b}等于几？` }); } },
  { id: 'ten', name: '凑十', gen: () => { const a = ri(1, 9); return Q('m1-e4-ten', `${a} + ____ = 10`, 10 - a, [`${a} 和几合起来是 10？`, `${a}+${10 - a}=10`], { sayText: `${a}加几等于十？` }); } },
  { id: 'miss', name: '填一填', gen: () => { const s = ri(4, 10), a = ri(1, s - 1), f = pick([0, 1]);
    const stem = f ? `${s} − ____ = ${a}` : `${a} + ____ = ${s}`, ans = s - a;
    return Q('m1-e4-miss', stem, ans, [f ? `想：${s} 去掉几，还剩 ${a}？` : `想：${a} 加几得 ${s}？`, `答案是 ${ans}`], { sayText: stem.replace('+', '加').replace('−', '减').replace('= ', '等于').replace('____', '几') }); } },
  { id: 'chain', name: '连加连减', gen: (L) => { if (Math.random() < 0.5) { const a = ri(1, 4), b = ri(1, 4), c = ri(1, 10 - a - b > 1 ? Math.min(4, 10 - a - b) : 1); const t = a + b + c; if (t > 10) return null; return Q('m1-e4-chain', `${a} + ${b} + ${c} = ?`, t, ['从左往右算', `${a}+${b}=${a + b}`, `${a + b}+${c}=${t}`], { sayText: `${a}加${b}加${c}等于几？` }); }
    const a = ri(6, 10), b = ri(1, 3), c = ri(1, Math.min(3, a - b)); return Q('m1-e4-chain', `${a} − ${b} − ${c} = ?`, a - b - c, ['从左往右算', `${a}-${b}=${a - b}`, `${a - b}-${c}=${a - b - c}`], { sayText: `${a}减${b}减${c}等于几？` }); } },
  { id: 'app', name: '小故事', gen: () => { const a = ri(2, 8), b = ri(1, 10 - a), nm = pick(['苹果', '气球', '小鱼', '铅笔']);
    if (Math.random() < 0.5) return Q('m1-e4-app', `小明有 ${a} 个${nm}，又得到 ${b} 个。现在有几个？`, a + b, ['又得到了，用加法', `${a}+${b}=${a + b}`], { sayText: `小明有${a}个${nm}，又得到${b}个。现在有几个？` });
    const c = ri(1, a - 1); return Q('m1-e4-app', `小红有 ${a} 个${nm}，送给别人 ${c} 个。还剩几个？`, a - c, ['送出去了，用减法', `${a}-${c}=${a - c}`], { sayText: `小红有${a}个${nm}，送给别人${c}个。还剩几个？` }); } },
];
const E5 = [
  { id: 'shape', name: '认识形状', gen: () => {
    const items = [['魔方', '正方体'], ['骰子', '正方体'], ['牙膏盒', '长方体'], ['鞋盒', '长方体'], ['罐头', '圆柱'], ['水杯', '圆柱'], ['足球', '球'], ['乒乓球', '球']];
    const x = pick(items); return MC('m1-e5-shape', `${x[0]}像什么形状？`, x[1], ['正方体', '长方体', '圆柱', '球'].filter(s => s !== x[1]), [`${x[0]}的样子像${x[1]}`], { sayText: `${x[0]}像什么形状？` }); } },
  { id: 'roll', name: '会滚的', gen: () => {
    const roll = ['足球', '乒乓球', '水杯（侧放）', '罐头'], flat = ['魔方', '骰子', '牙膏盒', '鞋盒']; const a = pick(roll), bs = shuf(flat).slice(0, 3);
    return MC('m1-e5-roll', '哪一个最容易滚起来？', a, bs, ['有圆圆的面的，容易滚', '方方正正的不容易滚'], { sayText: '哪一个最容易滚起来？' }); } },
];
export const CH1 = [
  { id: 'e1', name: '生活中的数', types: E1 },
  { id: 'e2', name: '5以内数加与减', types: E2 },
  { id: 'e3', name: '整理与分类', types: E3 },
  { id: 'e4', name: '10以内数加与减', types: E4 },
  { id: 'e5', name: '有趣的立体图形', types: E5 },
];
export const CHAP1_TYPES = chapTypes(CH1, 'm1-');

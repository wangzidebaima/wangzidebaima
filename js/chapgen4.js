// 四年级数学（北师大版）章节随机出题：认识更大的数、线与角、整数乘法、运算律、应用题
import { buildChapSession, chapTypes } from './chapgen.js';
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hash = (s) => { let x = 5381; for (const c of s) x = ((x << 5) + x + c.charCodeAt(0)) >>> 0; return x.toString(36); };
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const Q = (typeId, stem, ans, steps, extra) => Object.assign({ type: 'math', typeId, stem, answer: String(ans), pts: 1, id: 'r-' + typeId + '-' + hash(stem), digits: true,
  why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${ans}` }, extra || {});
const MC = (typeId, stem, correct, wrongs, steps) => {
  const ws = [...new Set(wrongs.filter(w => w !== correct))].slice(0, 3); if (ws.length < 3) return null;
  const opts = shuf([correct, ...ws]);
  return { type: 'choice', plain: true, typeId, stem, options: opts, answer: 'ABCD'[opts.indexOf(correct)], pts: 1, id: 'r-' + typeId + '-' + hash(stem),
    why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${correct}` };
};
const UNITS = ['个', '十', '百', '千', '万', '十万', '百万', '千万', '亿'];

const D1 = [
  { id: 'read', name: '数的读写与数位', gen: (L) => {
    const form = pick([0, 1, 2]);
    if (form === 0) { const n = ri(L === 1 ? 10000 : 100000, L === 3 ? 999999999 : 99999999); const d = String(n), p = ri(0, d.length - 1), dig = d[p], place = UNITS[d.length - 1 - p];
      return MC('m4-d1-read', `${fmt(n)} 中，数字 ${dig}（从左往右第 ${p + 1} 位）在哪一位上？`, place + '位', UNITS.filter(u => u !== place).map(u => u + '位').sort(() => Math.random() - .5), [`从右往左数：个位、十位、百位、千位、万位、十万位、百万位、千万位、亿位`, `${fmt(n)} 一共 ${d.length} 位，第 ${p + 1} 位就是${place}位`]); }
    if (form === 1) { const a = ri(2, 9), z = ri(4, 8); const n = a * Math.pow(10, z); const lab = (z >= 8 ? a + '亿' : z >= 4 ? (a * Math.pow(10, z - 4)) + '万' : String(n));
      return Q('m4-d1-read', `${fmt(n)} 是由几个"万"组成的？`, n / 10000, ['"万"是 10000，用总数除以 10000', `${fmt(n)} ÷ 10000 = ${n / 10000}`]); }
    const n = ri(2, 99) * 10000 + ri(0, 9999), d = Math.floor(n / 10000); return Q('m4-d1-read', `${fmt(n)} 里面最多有几个 1 万？`, d, ['看万位及更高位：n ÷ 10000 取整数部分', `${fmt(n)} ÷ 10000 的整数部分是 ${d}`]); } },
  { id: 'compare', name: '比较大小与改写', gen: (L) => {
    const form = pick([0, 1, 2]);
    if (form === 0) { const w = ri(2, 9990), n = w * 10000, rd = ri(1, 4);
      return Q('m4-d1-compare', `把 ${fmt(n)} 改写成用"万"作单位的数，是多少万？（只写数字）`, w, ['末尾 4 个 0 去掉，换成"万"字', `${fmt(n)} = ${w}万`]); }
    if (form === 1) { const a = ri(100000, 999999), b = a + (pick([-1, 1]) * ri(1, 9) * Math.pow(10, ri(0, 4)));
      return MC('m4-d1-compare', `${fmt(a)} ○ ${fmt(b)}，○ 里应填？`, a > b ? '>' : '<', ['>', '<', '='].filter(x => x !== (a > b ? '>' : '<')).concat(['≈', '≠']), ['位数相同，从最高位开始一位一位比，哪一位先不同，那一位大的数就大']); }
    const n = ri(100000, 9999999), r = Math.round(n / 10000);
    return Q('m4-d1-compare', `把 ${fmt(n)} 四舍五入到"万"位，约是多少万？（只写数字）`, r, ['看千位：千位 ≥ 5 就向万位进 1，否则舍去', `${fmt(n)} ≈ ${r}万`]); } },
  { id: 'size', name: '一亿有多大', gen: () => {
    const form = pick([0, 1]);
    if (form === 0) return MC('m4-d1-size', '1 亿里面有多少个 1 万？', '10000 个', ['1000 个', '100000 个', '100 个'], ['1 亿 = 100000000，1 万 = 10000', '100000000 ÷ 10000 = 10000']);
    const k = ri(2, 9); return Q('m4-d1-size', `${k}亿 是几个"千万"？`, k * 10, ['1 亿 = 10 个千万', `${k} × 10 = ${k * 10}`]); } },
];

const D2 = [
  { id: 'angle', name: '角的度量与分类', gen: () => {
    const a = pick([ri(10, 89), ri(91, 179), 90, 180, ri(181, 359)]);
    const kind = a < 90 ? '锐角' : a === 90 ? '直角' : a < 180 ? '钝角' : a === 180 ? '平角' : '优角';
    return MC('m4-d2-angle', `一个角是 ${a}°，它是什么角？`, kind, ['锐角', '直角', '钝角', '平角', '优角'].filter(x => x !== kind), ['小于 90° 是锐角，等于 90° 是直角，大于 90° 小于 180° 是钝角，等于 180° 是平角，大于 180° 是优角']); } },
  { id: 'calc', name: '角的计算', gen: () => {
    const form = pick([0, 1, 2, 3]);
    if (form === 0) { const a = ri(20, 80); return Q('m4-d2-calc', `一个直角被分成两个角，其中一个是 ${a}°，另一个是多少度？`, 90 - a, ['直角是 90°', `90° − ${a}° = ${90 - a}°`]); }
    if (form === 1) { const a = ri(30, 150); return Q('m4-d2-calc', `一条直线（平角 180°）上，有一个角是 ${a}°，和它拼成平角的另一个角是多少度？`, 180 - a, ['平角是 180°', `180° − ${a}° = ${180 - a}°`]); }
    if (form === 2) { const a = ri(30, 100), b = ri(30, 100); return Q('m4-d2-calc', `∠1 = ${a}°，∠2 = ${b}°，∠1 + ∠2 = 多少度？`, a + b, ['两个角的度数直接相加', `${a} + ${b} = ${a + b}`]); }
    const a = ri(3, 9) * 10, c = ri(3, 8) * 10 + 5; return Q('m4-d2-calc', `三角形的两个内角分别是 ${a}° 和 ${c}°，第三个角是多少度？`, 180 - a - c, ['三角形三个内角的和是 180°', `180° − ${a}° − ${c}° = ${180 - a - c}°`]); } },
  { id: 'line', name: '直线、射线、线段', gen: () => {
    const qs = [
      ['射线有几个端点？', '1 个', ['0 个', '2 个', '无数个'], '射线有 1 个端点，可以向一端无限延长。'],
      ['线段有几个端点？', '2 个', ['0 个', '1 个', '无数个'], '线段有 2 个端点，有长度。'],
      ['直线有几个端点？', '0 个', ['1 个', '2 个', '3 个'], '直线没有端点，可以向两端无限延长。'],
      ['过一点可以画几条直线？', '无数条', ['1 条', '2 条', '3 条'], '过一点可以画无数条直线。'],
      ['过两点可以画几条直线？', '1 条', ['2 条', '无数条', '0 条'], '过两点只能画 1 条直线。'],
      ['下面哪个有长度，可以量出来？', '线段', ['直线', '射线', '平角'], '只有线段有两个端点，有确定的长度。'],
    ]; const x = pick(qs); return MC('m4-d2-line', x[0], x[1], x[2], [x[3]]); } },
];

const D3 = [
  { id: 'mul', name: '三位数乘两位数', gen: (L) => {
    const a = ri(L === 1 ? 100 : 101, L === 3 ? 999 : 500), b = ri(11, L === 1 ? 30 : 99);
    return Q('m4-d3-mul', `${a} × ${b} = ？`, a * b, [`先算 ${a} × ${b % 10} = ${a * (b % 10)}`, `再算 ${a} × ${Math.floor(b / 10) * 10} = ${a * Math.floor(b / 10) * 10}`, `两个积相加：${a * b}`]); } },
  { id: 'zero', name: '末尾有0的乘法', gen: () => {
    const a = ri(2, 9) * 10 ** ri(1, 2), b = ri(2, 9) * 10 ** ri(1, 2), za = String(a).length - 1, zb = String(b).length - 1;
    return Q('m4-d3-zero', `${a} × ${b} = ？`, a * b, [`先把 0 去掉：${a / 10 ** za} × ${b / 10 ** zb} = ${(a / 10 ** za) * (b / 10 ** zb)}`, `再添上末尾共 ${za + zb} 个 0：${a * b}`]); } },
  { id: 'rel', name: '积的变化规律', gen: () => {
    const a = ri(12, 60), b = ri(11, 40), p = a * b, k = pick([2, 3, 4, 5, 10]), ask = pick(['a', 'b']);
    return Q('m4-d3-rel', `${a} × ${b} = ${p}，那么 ${ask === 'a' ? a * k : a} × ${ask === 'b' ? b * k : b} = ？`, p * k, [`一个因数乘 ${k}，另一个因数不变，积也乘 ${k}`, `${p} × ${k} = ${p * k}`]); } },
];

const D4 = [
  { id: 'simple', name: '简便计算', gen: (L) => {
    const form = pick([0, 1, 2, 3]);
    if (form === 0) { const a = ri(11, 99), b = 100 - (a % 100 || 1), x = a, y = 100 - x; const c = ri(2, 9) * 10;
      return Q('m4-d4-simple', `用简便方法算：${x} + ${c} + ${y} = ？`, x + c + y, ['用加法交换律、结合律，先把能凑成整百的数加起来', `(${x} + ${y}) + ${c} = 100 + ${c} = ${100 + c}`]); }
    if (form === 1) { const a = ri(2, 9), b = ri(2, 9), n = ri(2, 5) * 25 / 25; const u = pick([25, 125]), v = u === 25 ? 4 : 8, w = ri(3, 9);
      return Q('m4-d4-simple', `用简便方法算：${u} × ${w} × ${v} = ？`, u * w * v, ['用乘法交换律、结合律，先算能凑整的两个数', `(${u} × ${v}) × ${w} = ${u * v} × ${w} = ${u * v * w}`]); }
    if (form === 2) { const a = ri(11, 99), c = pick([99, 101]), m = ri(2, 9) * 0 + ri(12, 40);
      return Q('m4-d4-simple', `用简便方法算：${m} × ${c} = ？`, m * c, [`把 ${c} 看成 100 ${c === 99 ? '−' : '+'} 1`, `${m} × ${c} = ${m} × 100 ${c === 99 ? '−' : '+'} ${m} = ${m * c}`]); }
    const a = ri(11, 40), b = ri(2, 9), c = 10 - b; return Q('m4-d4-simple', `用乘法分配律算：${a} × ${b} + ${a} × ${c} = ？`, a * 10, ['提出相同的因数：a × b + a × c = a × (b + c)', `${a} × (${b} + ${c}) = ${a} × 10 = ${a * 10}`]); } },
  { id: 'law', name: '认识运算律', gen: () => {
    const items = [
      ['27 + 35 = 35 + 27 运用了什么运算律？', '加法交换律', ['加法结合律', '乘法交换律', '乘法分配律'], '交换两个加数的位置，和不变。'],
      ['(18 + 25) + 75 = 18 + (25 + 75) 运用了什么运算律？', '加法结合律', ['加法交换律', '乘法结合律', '乘法分配律'], '先加前两个数或先加后两个数，和不变。'],
      ['4 × 15 = 15 × 4 运用了什么运算律？', '乘法交换律', ['加法交换律', '乘法结合律', '乘法分配律'], '交换两个因数的位置，积不变。'],
      ['(25 × 7) × 4 = 25 × (7 × 4) 运用了什么运算律？', '乘法结合律', ['乘法交换律', '加法结合律', '乘法分配律'], '先乘前两个数或先乘后两个数，积不变。'],
      ['(20 + 5) × 8 = 20 × 8 + 5 × 8 运用了什么运算律？', '乘法分配律', ['乘法结合律', '加法结合律', '乘法交换律'], '两个数的和乘一个数，等于把两个加数分别去乘，再把积相加。'],
    ]; const x = pick(items); return MC('m4-d4-law', x[0], x[1], x[2], [x[3]]); } },
];

const D5 = [
  { id: 'rel', name: '数量关系应用题', gen: (L) => {
    const form = pick([0, 1, 2, 3]);
    if (form === 0) { const p = ri(8, 60), n = ri(12, 60); return Q('m4-d5-rel', `一支钢笔 ${p} 元，买 ${n} 支一共要多少元？`, p * n, ['总价 = 单价 × 数量', `${p} × ${n} = ${p * n}`]); }
    if (form === 1) { const v = ri(30, 90), t = ri(11, 40); return Q('m4-d5-rel', `一辆汽车每小时行 ${v} 千米，行了 ${t} 小时，一共行了多少千米？`, v * t, ['路程 = 速度 × 时间', `${v} × ${t} = ${v * t}`]); }
    if (form === 2) { const s = ri(5, 20) * 36, t = pick([6, 9, 12, 18]); const v = ri(20, 60), tt = ri(3, 12), S = v * tt; return Q('m4-d5-rel', `一列火车 ${tt} 小时行了 ${S} 千米，它每小时行多少千米？`, v, ['速度 = 路程 ÷ 时间', `${S} ÷ ${tt} = ${v}`]); }
    const p = ri(6, 30), n = ri(10, 40), q = p * n, m = ri(2, 9); return Q('m4-d5-rel', `买 ${n} 本练习本一共 ${q} 元，买 ${n + m} 本一共要多少元？`, p * (n + m), ['先求单价：总价 ÷ 数量', `${q} ÷ ${n} = ${p} 元`, `再求 ${n + m} 本：${p} × ${n + m} = ${p * (n + m)}`]); } },
  { id: 'two', name: '两步应用题', gen: () => {
    const form = pick([0, 1]);
    if (form === 0) { const a = ri(12, 40), b = ri(11, 30), c = ri(20, 100); return Q('m4-d5-two', `食堂每天用大米 ${a} 千克，${b} 天用完后还剩 ${c} 千克，大米一共有多少千克？`, a * b + c, ['先求用掉的：每天用量 × 天数', `${a} × ${b} = ${a * b}`, `再加剩下的：${a * b} + ${c} = ${a * b + c}`]); }
    const a = ri(12, 40), n = ri(11, 30), c = ri(20, 100); const tot = a * n + c; return Q('m4-d5-two', `学校买了 ${n} 箱球，每箱 ${a} 个，再买 ${c} 个，一共有多少个球？`, tot, ['先求 n 箱一共有几个：每箱个数 × 箱数', `${a} × ${n} = ${a * n}`, `再加上另买的：${a * n} + ${c} = ${tot}`]); } },
];

export const CH4 = [
  { id: 'd1', name: '认识更大的数', types: D1 },
  { id: 'd2', name: '线与角', types: D2 },
  { id: 'd3', name: '三位数乘两位数', types: D3 },
  { id: 'd4', name: '运算律与简便计算', types: D4 },
  { id: 'd5', name: '应用题（数量关系）', types: D5 },
];
export const CHAP4_TYPES = chapTypes(CH4, 'm4-');
export const makeChap4 = (ids, level, count, stats, typeId) => buildChapSession(CH4, 'm4-', ids, level, count, stats, typeId);

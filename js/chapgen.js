// 七年级数学（北师大版）章节随机出题：立体图形、整式、基本平面图形、一元一次方程、数据整理。
// 只做计算，不依赖页面；每道题的答案都由程序算出，并带分步解析。
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const nz = (a, b) => { let v = 0; while (!v) v = ri(a, b); return v; };
const hash = (s) => { let x = 5381; for (const c of s) x = ((x << 5) + x + c.charCodeAt(0)) >>> 0; return x.toString(36); };
const M = '−';
const num = (n) => (n < 0 ? M + Math.abs(n) : String(n));
const SUP = { 2: '²', 3: '³' };
const CN = { 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九', 10: '十' };

// ---------- 出题外壳 ----------
function MQ(typeId, stem, ans, steps, extra) {
  const a = String(ans);
  return Object.assign({ type: 'math', typeId, stem, answer: a, pts: 1, id: 'r-' + typeId + '-' + hash(stem),
    why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${a.replace(/-/g, M)}` }, extra || {});
}
function MC(typeId, stem, correct, wrongs, steps, extra) {
  const ws = [...new Set(wrongs.filter(w => w !== correct))].slice(0, 3);
  if (ws.length < (extra && extra.nopts ? extra.nopts - 1 : 3)) return null;
  const opts = shuf([correct, ...ws]);
  return Object.assign({ type: 'choice', plain: true, typeId, stem, options: opts, answer: 'ABCD'[opts.indexOf(correct)], pts: 1, id: 'r-' + typeId + '-' + hash(stem),
    why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${correct}` }, extra && extra.nopts ? { } : {});
}

// ---------- 代数式小工具 ----------
// 一项：{c: 系数, f: [[变量, 次数], ...]}
const tStr = (t, first) => {
  const ab = Math.abs(t.c), vars = t.f.map(([v, p]) => v + (p > 1 ? SUP[p] : '')).join('');
  const body = vars ? (ab === 1 ? '' : ab) + vars : String(ab);
  return (t.c < 0 ? M : first ? '' : '+') + body;
};
const eStr = (ts) => { ts = ts.filter(t => t.c); return ts.length ? ts.map((t, i) => tStr(t, i === 0)).join('') : '0'; };
const tVal = (t, env) => t.f.reduce((a, [v, p]) => a * Math.pow(env[v], p), t.c);
const eVal = (ts, env) => ts.reduce((a, t) => a + tVal(t, env), 0);
const tSub = (t, env, first) => {
  const ab = Math.abs(t.c); let s = (t.f.length === 0 || ab !== 1) ? String(ab) : '';
  t.f.forEach(([v, p]) => { s += (s ? '×' : '') + (env[v] < 0 ? `(${num(env[v])})` : env[v]) + (p > 1 ? SUP[p] : ''); });
  return (t.c < 0 ? M : first ? '' : '+') + s;
};
const eSub = (ts, env) => ts.map((t, i) => tSub(t, env, i === 0)).join('');
const lin = (a, b) => eStr([{ c: a, f: [['x', 1]] }, { c: b, f: [] }]);
const envStr = (env) => Object.entries(env).map(([k, v]) => `${k}=${num(v)}`).join('，');

// ============ 第一章 丰富的图形世界 ============
const FACTS = [
  { s: '用一个平面去截圆柱，截面不可能是下面哪一种？', c: '三角形', w: ['圆', '长方形', '椭圆'], why: '圆柱的截面可以是圆、长方形、椭圆，但不可能是三角形。' },
  { s: '用一个平面去截圆锥，截面不可能是下面哪一种？', c: '长方形', w: ['圆', '三角形', '椭圆'], why: '圆锥的截面可以是圆、三角形、椭圆，不可能是长方形。' },
  { s: '用一个平面去截球，截面一定是？', c: '圆', w: ['椭圆', '长方形', '三角形'], why: '不管怎么截，球的截面都是圆。' },
  { s: '用一个平面去截正方体，截面不可能是下面哪一种？', c: '圆', w: ['三角形', '长方形', '六边形'], why: '正方体的截面可以是三角形、四边形、五边形、六边形，但不可能是圆（它的面都是平的）。' },
  { s: '正方体的表面展开图一共有几种不同的形状？', c: '11 种', w: ['6 种', '8 种', '12 种'], why: '正方体的展开图共有 11 种。' },
  { s: '一个长方体从正面、左面、上面看，看到的图形都是？', c: '长方形', w: ['三角形', '圆', '梯形'], why: '长方体每个方向看都是长方形。' },
  { s: '圆柱的侧面展开后（沿高剪开）得到的图形是？', c: '长方形', w: ['圆', '三角形', '扇形'], why: '圆柱沿高剪开，侧面展开是长方形。' },
  { s: '圆锥的侧面展开后得到的图形是？', c: '扇形', w: ['长方形', '三角形', '圆'], why: '圆锥的侧面展开是一个扇形。' },
  { s: '下面哪个几何体的表面都是平的（没有曲面）？', c: '三棱柱', w: ['圆柱', '圆锥', '球'], why: '棱柱的所有面都是平面；圆柱、圆锥、球都有曲面。' },
  { s: '点动成线，线动成面，面动成体。直角三角形绕着一条直角边旋转一周得到的是？', c: '圆锥', w: ['圆柱', '球', '棱锥'], why: '直角三角形绕直角边旋转一周，得到圆锥。' },
  { s: '长方形绕着它的一条边旋转一周得到的是？', c: '圆柱', w: ['圆锥', '球', '棱柱'], why: '长方形绕一边旋转，得到圆柱。' },
  { s: '半圆绕着它的直径旋转一周得到的是？', c: '球', w: ['圆柱', '圆锥', '圆'], why: '半圆绕直径旋转一周，得到球。' },
];
const C1 = [
  { id: 'prism', name: '棱柱、棱锥的面棱顶点', gen: () => {
    const n = ri(3, 8), kind = pick(['柱', '锥']), what = pick(['面', '棱', '顶点']);
    const f = kind === '柱' ? { 面: n + 2, 棱: 3 * n, 顶点: 2 * n } : { 面: n + 1, 棱: 2 * n, 顶点: n + 1 };
    const unit = what === '棱' ? '条' : '个', nm = `${CN[n]}棱${kind}`;
    const why = kind === '柱' ? { 面: `n 棱柱有 2 个底面和 n 个侧面：${n}+2=${n + 2}`, 棱: `n 棱柱有 3n 条棱：3×${n}=${3 * n}`, 顶点: `n 棱柱有 2n 个顶点：2×${n}=${2 * n}` }[what]
      : { 面: `n 棱锥有 1 个底面和 n 个侧面：${n}+1=${n + 1}`, 棱: `n 棱锥有 2n 条棱：2×${n}=${2 * n}`, 顶点: `n 棱锥有 n+1 个顶点：${n}+1=${n + 1}` }[what];
    const q = MQ('m7-c1-prism', `${nm}有几${unit}${what}？`, f[what], [`先想 ${nm} 的样子：${kind === '柱' ? '上下两个底面都是 ' + n + ' 边形' : '底面是 ' + n + ' 边形，再加一个尖顶'}`, why], { digits: true });
    q._v = { n, kind, what, ans: f[what] }; return q; } },
  { id: 'euler', name: '欧拉公式（顶点＋面－棱＝2）', gen: () => {
    const V = ri(4, 12), F = ri(4, 12), E = V + F - 2, ask = pick(['V', 'F', 'E']);
    const stem = { V: `一个多面体有 ${F} 个面、${E} 条棱，它有几个顶点？`, F: `一个多面体有 ${V} 个顶点、${E} 条棱，它有几个面？`, E: `一个多面体有 ${V} 个顶点、${F} 个面，它有几条棱？` }[ask];
    const ans = { V, F, E }[ask];
    const q = MQ('m7-c1-euler', stem, ans, ['欧拉公式：顶点数 + 面数 − 棱数 = 2', { V: `顶点数 = 2 + ${E} − ${F} = ${V}`, F: `面数 = 2 + ${E} − ${V} = ${F}`, E: `棱数 = ${V} + ${F} − 2 = ${E}` }[ask]], { digits: true });
    q._v = { V, F, E, ask }; return q; } },
  { id: 'facts', name: '截面、展开图、旋转体', gen: () => { const f = pick(FACTS); return MC('m7-c1-facts', f.s, f.c, f.w, [f.why]); } },
];

// ============ 第三章 整式及其加减 ============
const C3 = [
  { id: 'coef', name: '单项式的系数和次数', gen: (L) => {
    const c = nz(-9, 9), px = L === 1 ? 1 : ri(1, 3), py = L === 1 ? 0 : (L === 2 ? ri(0, 1) : ri(1, 2));
    const f = [['x', px]]; if (py) f.push(['y', py]);
    const t = { c, f }, s = tStr(t, true), deg = px + py, ask = pick(['系数', '次数']);
    const q = MQ('m7-c3-coef', `单项式 ${s} 的${ask}是？`, ask === '系数' ? c : deg,
      [ask === '系数' ? '系数是单项式里的数字因数，带着前面的符号；只有字母时系数是 1 或 −1' : '次数是所有字母的指数加起来', ask === '系数' ? `${s} 的系数是 ${num(c)}` : `${f.map(([v, p]) => `${v} 的指数 ${p}`).join('，')}，加起来 ${deg}`], { digits: ask === '次数' });
    q._v = { c, deg, ask }; return q; } },
  { id: 'eval', name: '代数式求值', gen: (L) => {
    let ts, env;
    if (L === 1) { ts = [{ c: nz(-6, 6), f: [['x', 1]] }, { c: nz(-9, 9), f: [] }]; env = { x: nz(-5, 5) }; }
    else if (L === 2) { ts = [{ c: nz(-4, 4), f: [['x', 2]] }, { c: nz(-6, 6), f: [['x', 1]] }, { c: nz(-9, 9), f: [] }]; env = { x: nz(-3, 3) }; }
    else { ts = [{ c: nz(-3, 3), f: [['x', 2]] }, { c: nz(-3, 3), f: [['x', 1], ['y', 1]] }, { c: nz(-5, 5), f: [['y', 1]] }]; env = { x: nz(-3, 3), y: nz(-3, 3) }; }
    const v = eVal(ts, env), vals = ts.map(t => num(tVal(t, env)));
    const q = MQ('m7-c3-eval', `当 ${envStr(env)} 时，求 ${eStr(ts)} 的值`, v, [`把字母换成数（负数要加括号）：${eSub(ts, env)}`, `各项分别算出：${vals.join('、')}`, `加起来：${num(v)}`]);
    q._v = { ts, env, v }; return q; } },
  { id: 'like', name: '合并同类项', gen: (L) => {
    let ts, ask, stem;
    if (L === 1) { ts = [{ c: nz(-9, 9), f: [['x', 1]] }, { c: nz(-9, 9), f: [['x', 1]] }, { c: nz(-9, 9), f: [['x', 1]] }]; ask = 'x'; stem = `合并同类项：${eStr(ts)} = □x，□ 是多少？`; }
    else if (L === 2) { ts = shuf([{ c: nz(-7, 7), f: [['a', 1]] }, { c: nz(-7, 7), f: [['b', 1]] }, { c: nz(-7, 7), f: [['a', 1]] }, { c: nz(-7, 7), f: [['b', 1]] }]); ask = pick(['a', 'b']); stem = `化简 ${eStr(ts)}，结果里 ${ask} 的系数是？`; }
    else { ts = shuf([{ c: nz(-6, 6), f: [['x', 2]] }, { c: nz(-6, 6), f: [['x', 1]] }, { c: nz(-6, 6), f: [['x', 2]] }, { c: nz(-6, 6), f: [['x', 1]] }, { c: nz(-9, 9), f: [] }]); ask = pick(['x²', 'x']); stem = `化简 ${eStr(ts)}，结果里 ${ask} 的系数是？`; }
    const key = (t) => t.f.map(([v, p]) => v + (p > 1 ? SUP[p] : '')).join('');
    const mine = ts.filter(t => key(t) === ask), sum = mine.reduce((a, t) => a + t.c, 0);
    if (!sum) return null;
    const q = MQ('m7-c3-like', stem, sum, [`找出同类项（字母和指数都相同）：${mine.map(t => tStr(t, false).replace(/^\+/, '')).join('、')}`, `把它们的系数相加：${mine.map(t => num(t.c)).join(' + ')} = ${num(sum)}`]);
    q._v = { ask, sum, ts: ts.map(t => ({ c: t.c, k: key(t) })) }; return q; } },
  { id: 'brackets', name: '去括号', gen: (L) => {
    const A = { a: nz(-5, 5), b: nz(-9, 9) }, B = { a: nz(-5, 5), b: nz(-9, 9) };
    const k1 = L < 3 ? 1 : nz(-3, 3), k2 = L === 1 ? nz(-1, 1) : (L === 2 ? pick([1, -1]) : nz(-3, 3));
    const part = (k, P, first) => { const ab = Math.abs(k), body = `(${lin(P.a, P.b)})`; return (k < 0 ? M : first ? '' : '+') + (ab === 1 ? '' : ab) + body; };
    const stem = `化简：${L === 1 ? '' : part(k1, A, true)}${L === 1 ? lin(A.a, A.b) : ''}${part(k2, B, false)}`.replace(/^化简：\+/, '化简：');
    const r = { a: k1 * A.a + k2 * B.a, b: k1 * A.b + k2 * B.b };
    const wr = [{ a: r.a, b: k1 * A.b - k2 * B.b }, { a: k1 * A.a - k2 * B.a, b: r.b }, { a: k1 * A.a - k2 * B.a, b: k1 * A.b - k2 * B.b }, { a: r.a, b: r.b + 1 }, { a: r.a + 1, b: r.b }];
    const q = MC('m7-c3-brackets', stem, lin(r.a, r.b), wr.map(w => lin(w.a, w.b)),
      ['括号前是「−」，去括号时括号里每一项都要变号；括号前有数字，要乘进每一项', `按 x 项和常数项分别合并：x 项 ${num(r.a)}，常数项 ${num(r.b)}`]);
    if (q) q._v = { r }; return q; } },
  { id: 'simpev', name: '先化简再求值', gen: (L) => {
    const A = { a: nz(-5, 5), b: nz(-9, 9) }, B = { a: nz(-5, 5), b: nz(-9, 9) }, k2 = pick([1, -1]), x = nz(-4, 4);
    const part = (k, P, first) => (k < 0 ? M : first ? '' : '+') + `(${lin(P.a, P.b)})`;
    const r = { a: A.a + k2 * B.a, b: A.b + k2 * B.b }, v = r.a * x + r.b;
    const q = MQ('m7-c3-simpev', `先化简，再求值：${part(1, A, true)}${part(k2, B, false)}，其中 x=${num(x)}`, v,
      [`先去括号、合并同类项，化简得 ${lin(r.a, r.b)}`, `把 x=${num(x)} 代入：${num(r.a)}×${x < 0 ? '(' + num(x) + ')' : x}${r.b < 0 ? M : '+'}${Math.abs(r.b)}`, `算出 ${num(v)}`]);
    q._v = { A, B, k2, x, v }; return q; } },
  { id: 'pattern', name: '找规律', gen: (L) => {
    const form = L === 1 ? 0 : pick([0, 1, 2]);
    if (form === 0) { const a1 = ri(1, 9), d = ri(2, 7), n = ri(8, 15), seq = [0, 1, 2, 3].map(i => a1 + i * d);
      const q = MQ('m7-c3-pattern', `一列数：${seq.join('，')}，……，照这样排下去，第 ${n} 个数是？`, a1 + (n - 1) * d, [`相邻两个数的差都是 ${d}，所以第 n 个数是 ${a1}+(n−1)×${d}`, `第 ${n} 个：${a1}+${n - 1}×${d} = ${a1 + (n - 1) * d}`], { digits: true }); q._v = { a1, d, n }; return q; }
    if (form === 1) { const n = ri(6, 15), start = ri(3, 5), add = ri(2, 4), ans = start + (n - 1) * add, shape = pick(['三角形', '正方形']);
      const q = MQ('m7-c3-pattern', `用火柴棒摆${shape}：摆 1 个用 ${start} 根，每多摆 1 个就多用 ${add} 根。摆 ${n} 个${shape}要用多少根？`, ans, [`第 1 个 ${start} 根，每多一个加 ${add} 根`, `摆 ${n} 个：${start}+(${n}−1)×${add} = ${ans}`], { digits: true }); q._v = { a1: start, d: add, n }; return q; }
    const a1 = pick([1, 2, 3]), n = ri(5, 7), seq = [0, 1, 2, 3].map(i => a1 * Math.pow(2, i));
    const q = MQ('m7-c3-pattern', `一列数：${seq.join('，')}，……，每个数都是前一个的 2 倍，第 ${n} 个数是？`, a1 * Math.pow(2, n - 1), [`每个数是前一个的 2 倍，第 n 个数是 ${a1}×2^(n−1)`, `第 ${n} 个：${a1}×${Math.pow(2, n - 1)} = ${a1 * Math.pow(2, n - 1)}`], { digits: true }); q._v = { geo: true, a1, n }; return q; } },
];

// ============ 第四章 基本平面图形 ============
const C4 = [
  { id: 'seg', name: '线段的长度计算', gen: (L) => {
    const form = L === 1 ? 0 : pick(L === 2 ? [0, 1] : [0, 1, 2]);
    if (form === 0) { const AB = ri(10, 30), AC = ri(3, AB - 3), ask = pick(['CB', 'AC']);
      const q = MQ('m7-c4-seg', ask === 'CB' ? `点 C 在线段 AB 上，AB=${AB}cm，AC=${AC}cm，则 CB 等于多少 cm？` : `点 C 在线段 AB 上，AB=${AB}cm，CB=${AB - AC}cm，则 AC 等于多少 cm？`, ask === 'CB' ? AB - AC : AC,
        ['整条线段等于两段之和：AB = AC + CB', ask === 'CB' ? `CB = AB − AC = ${AB} − ${AC} = ${AB - AC}` : `AC = AB − CB = ${AB} − ${AB - AC} = ${AC}`], { digits: true }); q._v = { f: 0, AB, AC, ask }; return q; }
    if (form === 1) { const half = ri(3, 15), ask = pick(['AM', 'AB']);
      const q = MQ('m7-c4-seg', ask === 'AM' ? `M 是线段 AB 的中点，AB=${2 * half}cm，则 AM 等于多少 cm？` : `M 是线段 AB 的中点，AM=${half}cm，则 AB 等于多少 cm？`, ask === 'AM' ? half : 2 * half,
        ['线段中点把线段分成相等的两段：AB = 2AM', ask === 'AM' ? `AM = ${2 * half} ÷ 2 = ${half}` : `AB = ${half} × 2 = ${2 * half}`], { digits: true }); q._v = { f: 1, half, ask }; return q; }
    const AB = 2 * ri(4, 20), q = MQ('m7-c4-seg', `点 C 在线段 AB 上，M、N 分别是 AC、CB 的中点，AB=${AB}cm，则 MN 等于多少 cm？`, AB / 2,
      ['MN = MC + CN，MC 是 AC 的一半，CN 是 CB 的一半', `所以 MN = (AC+CB)÷2 = AB÷2 = ${AB}÷2 = ${AB / 2}`], { digits: true }); q._v = { f: 2, AB }; return q; } },
  { id: 'angle-rel', name: '余角和补角', gen: () => {
    const comp = Math.random() < 0.5, a = comp ? ri(10, 80) : ri(20, 160);
    const q = MQ('m7-c4-anglerel', `∠α=${a}°，则它的${comp ? '余角' : '补角'}是多少度？`, (comp ? 90 : 180) - a, [comp ? '两个角的和是 90°，这两个角互为余角' : '两个角的和是 180°，这两个角互为补角', `${comp ? 90 : 180}° − ${a}° = ${(comp ? 90 : 180) - a}°`], { digits: true });
    q._v = { comp, a }; return q; } },
  { id: 'angle-bis', name: '角平分线', gen: () => {
    const half = ri(10, 60), ask = pick(['half', 'whole']);
    const q = MQ('m7-c4-anglebis', ask === 'half' ? `射线 OC 平分 ∠AOB，∠AOB=${2 * half}°，则 ∠AOC 等于多少度？` : `射线 OC 平分 ∠AOB，∠AOC=${half}°，则 ∠AOB 等于多少度？`, ask === 'half' ? half : 2 * half,
      ['角平分线把一个角分成相等的两个角：∠AOB = 2∠AOC', ask === 'half' ? `∠AOC = ${2 * half}° ÷ 2 = ${half}°` : `∠AOB = ${half}° × 2 = ${2 * half}°`], { digits: true });
    q._v = { half, ask }; return q; } },
  { id: 'dms', name: '度、分的互化', gen: () => {
    const d = ri(10, 80), m = pick([6, 12, 18, 24, 30, 36, 42, 48, 54]);
    if (Math.random() < 0.5) { const dec = (m / 60).toFixed(1), q = MQ('m7-c4-dms', `把 ${d}°${m}′ 化成度（用小数表示），等于多少度？`, d + '.' + dec.slice(2), [`1° = 60′，所以 ${m}′ = ${m}÷60 = ${dec}°`, `${d}° + ${dec}° = ${d}.${dec.slice(2)}°`]); q._v = { d, m, to: 'dec' }; return q; }
    const q = MQ('m7-c4-dms', `把 ${d}.${m / 6}° 化成度、分，即 ${d}°□′，□ 是多少？`, m, [`0.${m / 6}° 化成分：0.${m / 6} × 60 = ${m}′`, `所以 ${d}.${m / 6}° = ${d}°${m}′`], { digits: true }); q._v = { d, m, to: 'dms' }; return q; } },
  { id: 'polygon', name: '多边形与圆', gen: () => {
    const form = pick([0, 1, 2]), n = ri(5, 12);
    if (form === 0) { const q = MQ('m7-c4-polygon', `从 ${n} 边形的一个顶点出发，可以画出几条对角线？`, n - 3, [`从一个顶点出发，不能连自己和相邻的两个顶点，所以是 n−3`, `${n} − 3 = ${n - 3}`], { digits: true }); q._v = { form, n }; return q; }
    if (form === 1) { const q = MQ('m7-c4-polygon', `${n} 边形一共有几条对角线？`, n * (n - 3) / 2, [`每个顶点引 n−3 条，共 n 个顶点，每条被数了两次，所以总数是 n(n−3)÷2`, `${n}×${n - 3}÷2 = ${n * (n - 3) / 2}`], { digits: true }); q._v = { form, n }; return q; }
    const k = pick([4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36]); const q = MQ('m7-c4-polygon', `把一个圆平均分成 ${k} 个扇形，每个扇形的圆心角是多少度？`, 360 / k, ['一个圆的圆心角一共是 360°', `360° ÷ ${k} = ${360 / k}°`], { digits: true }); q._v = { form, k }; return q; } },
];

// ============ 第五章 一元一次方程 ============
const C5 = [
  { id: 'solve', name: '解一元一次方程', gen: (L) => {
    const x0 = nz(-9, 9);
    if (L === 1) { const a = nz(-6, 6), b = nz(-12, 12), c = a * x0 + b;
      const q = MQ('m7-c5-solve', `解方程：${lin(a, b)}=${num(c)}`, x0, [`移项：${eStr([{ c: a, f: [['x', 1]] }])} = ${num(c)} ${b < 0 ? '+' : '−'} ${Math.abs(b)}，即 ${eStr([{ c: a, f: [['x', 1]] }])} = ${num(c - b)}`, `两边同除以 ${num(a)}：x = ${num(x0)}`]); q._v = { k: 'ax+b=c', a, b, c, x0 }; return q; }
    if (L === 2) { let a, c; do { a = nz(-6, 6); c = nz(-6, 6); } while (a === c); const b = nz(-12, 12), d = (a - c) * x0 + b;
      const q = MQ('m7-c5-solve', `解方程：${lin(a, b)}=${eStr([{ c, f: [['x', 1]] }, { c: d, f: [] }])}`, x0, [`把含 x 的项移到左边，常数项移到右边（移项要变号）`, `${a}x ${c < 0 ? '+' : '−'} ${Math.abs(c)}x = ${d} ${b < 0 ? '+' : '−'} ${Math.abs(b)}，得 ${num(a - c)}x = ${num(d - b)}`, `x = ${num(x0)}`]); q._v = { k: 'ax+b=cx+d', a, b, c, d, x0 }; return q; }
    const form = pick([0, 1]);
    if (form === 0) { const k = nz(-5, 5), m = nz(-9, 9), n = k * (x0 + m);
      const q = MQ('m7-c5-solve', `解方程：${k === 1 ? '' : k === -1 ? M : k}(x${m < 0 ? M : '+'}${Math.abs(m)})=${num(n)}`, x0, [`先去括号：${k}x ${k * m < 0 ? '−' : '+'} ${Math.abs(k * m)} = ${num(n)}`, `移项：${k}x = ${num(n - k * m)}`, `x = ${num(x0)}`]); q._v = { k: 'k(x+m)=n', kk: k, m, n, x0 }; return q; }
    const d = pick([2, 3, 4, 5]), xx = d * ri(-6, 6) || d, b = nz(-9, 9), c = xx / d + b;
    const q = MQ('m7-c5-solve', `解方程：x/${d}${b < 0 ? M : '+'}${Math.abs(b)}=${num(c)}`, xx, [`先移项：x/${d} = ${num(c)} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${num(c - b)}`, `两边同乘 ${d}：x = ${num(c - b)}×${d} = ${num(xx)}`]); q._v = { k: 'x/d+b=c', d, b, c, x0: xx }; return q; } },
  { id: 'check', name: '检验方程的解', gen: () => {
    const x0 = nz(-6, 6), a = nz(-5, 5), b = nz(-9, 9), c = a * x0 + b, t = pick([x0, x0, x0 + pick([-1, 1, 2, -2])]), ok = t === x0;
    const val = a * t + b;
    const q = MC('m7-c5-check', `x=${num(t)} 是不是方程 ${lin(a, b)}=${num(c)} 的解？`, ok ? '是' : '不是', [ok ? '不是' : '是'],
      [`把 x=${num(t)} 代入左边：${a}×${t < 0 ? '(' + num(t) + ')' : t}${b < 0 ? M : '+'}${Math.abs(b)} = ${num(val)}`, `右边是 ${num(c)}，${ok ? '左右两边相等，所以是解' : '左右两边不相等，所以不是解'}`], { nopts: 2 });
    q._v = { a, b, c, t, ok }; return q; } },
  { id: 'word', name: '列方程解应用题', gen: (L) => {
    const form = pick(L === 1 ? [0, 3] : [0, 1, 2, 3]);
    if (form === 0) { const x0 = ri(5, 40), d = ri(2, 12), s = 2 * x0 + d;
      const q = MQ('m7-c5-word', `甲数比乙数大 ${d}，两个数的和是 ${s}。乙数是多少？`, x0, [`设乙数为 x，则甲数为 x+${d}`, `列方程：x + (x+${d}) = ${s}，即 2x = ${s - d}`, `x = ${x0}`], { digits: true }); q._v = { form, x0, d, s }; return q; }
    if (form === 1) { const k = pick([2, 3, 4]), b = ri(6, 12), t = ri(2, 8), a = k * (b + t) - t;
      const q = MQ('m7-c5-word', `爸爸今年 ${a} 岁，儿子今年 ${b} 岁，几年后爸爸的年龄是儿子的 ${k} 倍？`, t, [`设 x 年后，爸爸 ${a}+x 岁，儿子 ${b}+x 岁`, `列方程：${a}+x = ${k}(${b}+x)`, `去括号：${a}+x = ${k * b}+${k}x，移项得 ${k - 1}x = ${a - k * b}，x = ${t}`], { digits: true }); q._v = { form, k, a, b, t }; return q; }
    if (form === 2) { const v1 = ri(40, 70), v2 = ri(30, 60), t = ri(2, 6), s = (v1 + v2) * t;
      const q = MQ('m7-c5-word', `甲、乙两地相距 ${s} km，两辆车同时从两地出发相向而行，速度分别是 ${v1} km/h 和 ${v2} km/h，几小时后相遇？`, t, ['路程 = 速度 × 时间，相遇时两车走的路程加起来等于总路程', `设 x 小时后相遇：${v1}x + ${v2}x = ${s}，即 ${v1 + v2}x = ${s}`, `x = ${t}`], { digits: true }); q._v = { form, v1, v2, t, s }; return q; }
    const p = ri(2, 9), x0 = ri(3, 12), r = ri(2, 15), T = p * x0 + r;
    const q = MQ('m7-c5-word', `买一些单价 ${p} 元的笔，另外付 ${r} 元的袋子钱，一共付了 ${T} 元。买了几支笔？`, x0, [`设买了 x 支笔`, `列方程：${p}x + ${r} = ${T}`, `${p}x = ${T - r}，x = ${x0}`], { digits: true }); q._v = { form: 3, p, x0, r, T }; return q; } },
];

// ============ 第六章 数据的收集与整理 ============
const med = (a) => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const C6 = [
  { id: 'stat', name: '平均数、中位数、众数、极差', gen: (L) => {
    const kind = pick(L === 1 ? ['avg', 'range'] : ['avg', 'median', 'mode', 'range']);
    let list;
    if (kind === 'avg') { const n = pick([4, 5, 6]); list = Array.from({ length: n - 1 }, () => ri(3, 20)); const s = list.reduce((a, b) => a + b, 0); let last = ri(3, 20); while ((s + last) % n) last++; list.push(last); list = shuf(list); }
    else if (kind === 'median') { list = Array.from({ length: pick([5, 7]) }, () => ri(1, 30)); }
    else if (kind === 'mode') { const m = ri(2, 20); list = shuf([m, m, ...Array.from({ length: 4 }, (_, i) => 21 + i * 2 + ri(0, 1))]); }
    else { list = Array.from({ length: pick([5, 6]) }, () => ri(2, 40)); }
    const sorted = list.slice().sort((a, b) => a - b), sum = list.reduce((a, b) => a + b, 0);
    let ans, why, name;
    if (kind === 'avg') { ans = sum / list.length; name = '平均数'; why = [`平均数 = 数据总和 ÷ 个数`, `(${list.join('+')}) ÷ ${list.length} = ${sum} ÷ ${list.length} = ${ans}`]; }
    else if (kind === 'median') { ans = med(list); name = '中位数'; why = [`先从小到大排列：${sorted.join('，')}`, `个数是奇数，取最中间的一个：${ans}`]; }
    else if (kind === 'mode') { ans = list.slice().sort((a, b) => list.filter(v => v === b).length - list.filter(v => v === a).length)[0]; name = '众数'; why = [`众数是出现次数最多的数`, `${ans} 出现了 2 次，其他数都只出现 1 次`]; }
    else { ans = sorted[sorted.length - 1] - sorted[0]; name = '极差'; why = [`极差 = 最大值 − 最小值`, `${sorted[sorted.length - 1]} − ${sorted[0]} = ${ans}`]; }
    const q = MQ('m7-c6-stat', `一组数据：${list.join('，')}，它的${name}是？`, ans, why, { digits: true }); q._v = { kind, list, ans }; return q; } },
  { id: 'pie', name: '扇形统计图', gen: () => {
    const form = pick([0, 1, 2]);
    if (form === 0) { const N = pick([40, 50, 60, 80, 100, 120, 200]), p = pick([5, 10, 15, 20, 25, 30, 40, 50].filter(x => (N * x) % 100 === 0)), n = N * p / 100;
      const q = MQ('m7-c6-pie', `某班共有 ${N} 名同学，喜欢篮球的同学占 ${p}%，喜欢篮球的有多少人？`, n, ['部分人数 = 总人数 × 占的百分比', `${N} × ${p}% = ${n}`], { digits: true }); q._v = { form, N, p, n }; return q; }
    if (form === 1) { const p = pick([5, 10, 15, 20, 25, 30, 40, 50]), ang = 3.6 * p, ans = Math.round(ang * 10) / 10;
      const q = MQ('m7-c6-pie', `在扇形统计图中，某部分占总数的 ${p}%，它对应的扇形圆心角是多少度？`, ans, ['整个圆是 360°，圆心角 = 360° × 占的百分比', `360° × ${p}% = ${ans}°`], { digits: true }); q._v = { form, p, ans }; return q; }
    const p = pick([5, 10, 15, 20, 25, 30, 40, 50]), ang = Math.round(3.6 * p * 10) / 10;
    const q = MQ('m7-c6-pie', `在扇形统计图中，某个扇形的圆心角是 ${ang}°，它占总数的百分之几？（只填数字）`, p, ['圆心角 ÷ 360° = 占的百分比', `${ang} ÷ 360 = ${p / 100}，也就是 ${p}%`], { digits: true }); q._v = { form: 2, p, ang }; return q; } },
  { id: 'freq', name: '频数与频率', gen: () => {
    const N = pick([20, 25, 40, 50, 100]), f = ri(2, N / 2), form = pick([0, 1]);
    if (form === 0) { const r = f / N, q = MQ('m7-c6-freq', `共有 ${N} 个数据，落在某个小组的频数是 ${f}，这个小组的频率是多少？（用小数表示）`, String(Math.round(r * 1000) / 1000), ['频率 = 频数 ÷ 数据总个数', `${f} ÷ ${N} = ${Math.round(r * 1000) / 1000}`]); q._v = { form, N, f }; return q; }
    const r = Math.round(f / N * 1000) / 1000, q = MQ('m7-c6-freq', `共有 ${N} 个数据，某个小组的频率是 ${r}，这个小组的频数是多少？`, f, ['频数 = 数据总个数 × 频率', `${N} × ${r} = ${f}`], { digits: true }); q._v = { form, N, f, r }; return q; } },
];

export const CH7 = [
  { id: 'c1', name: '第一章 丰富的图形世界', types: C1 },
  { id: 'c3', name: '第三章 整式及其加减', types: C3 },
  { id: 'c4', name: '第四章 基本平面图形', types: C4 },
  { id: 'c5', name: '第五章 一元一次方程', types: C5 },
  { id: 'c6', name: '第六章 数据的收集与整理', types: C6 },
];
export const chapTypes = (CH, pre) => CH.flatMap(c => c.types.map(t => ({ id: pre + c.id + '-' + t.id.replace('-', ''), name: t.name, cid: c.id })));
export const CHAP_TYPES = chapTypes(CH7, 'm7-');

const weightedPick = (types, stats, pre) => {
  const w = types.map(t => { const s = (stats || {})[pre + t.cid + '-' + t.id.replace('-', '')] || { n: 0, w: 0 }; return 1 + 4 * (s.w + 1) / (s.n + 2); });
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < types.length; i++) { r -= w[i]; if (r <= 0) return types[i]; }
  return types[types.length - 1];
};

// 在选中的章节里出题（综合时自动多出常错的题型）；typeId 不是 'mix' 时只出该题型
export function buildChapSession(CH, pre, chapterIds, level, count, stats, typeId) {
  let types = CH.filter(c => chapterIds.includes(c.id)).flatMap(c => c.types.map(t => ({ ...t, cid: c.id })));
  if (typeId && typeId !== 'mix') types = types.filter(t => pre + t.cid + '-' + t.id.replace('-', '') === typeId);
  const out = [], seen = new Set();
  for (let g = 0; types.length && out.length < count && g < count * 60; g++) {
    const t = weightedPick(types, stats, pre), q = t.gen(level);
    if (!q || seen.has(q.id)) continue;
    seen.add(q.id); out.push(q);
  }
  return out;
}
export const makeChapSession = (ids, level, count, stats, typeId) => buildChapSession(CH7, 'm7-', ids, level, count, stats, typeId);

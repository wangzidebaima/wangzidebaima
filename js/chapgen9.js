// 九年级上册数学（北师大版）章节随机出题：特殊平行四边形、一元二次方程、图形的相似、投影与视图、二次函数、概率的进一步认识
// 只做文字题（不依赖图片），答案全部由程序算出，每题带分步解析。
// 填空题答案只有正整数、小数、分数；答案含负数、坐标、方程的题一律用选择题。
import { chapTypes } from './chapgen.js';
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hash = (s) => { let x = 5381; for (const c of s) x = ((x << 5) + x + c.charCodeAt(0)) >>> 0; return x.toString(36); };
const Q = (typeId, stem, ans, steps, extra) => Object.assign({ type: 'math', typeId, stem, answer: String(ans), pts: 1, id: 'r-' + typeId + '-' + hash(stem), digits: true,
  why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${ans}` }, extra || {});
const QD = (typeId, stem, ans, steps) => Q(typeId, stem, ans, steps, { digits: false });
const MC = (typeId, stem, correct, wrongs, steps, min = 2) => {
  const ws = [...new Set(wrongs.map(String).filter(w => w !== String(correct)))].slice(0, 3); if (ws.length < min) return null;
  const opts = shuf([String(correct), ...ws]);
  return { type: 'choice', plain: true, typeId, stem, options: opts, answer: 'ABCD'[opts.indexOf(String(correct))], pts: 1, id: 'r-' + typeId + '-' + hash(stem + correct),
    why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${correct}` };
};
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
const frac = (n, d) => { const g = gcd(n, d); return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`; };
const M = '−';
const num = (n) => (n < 0 ? M + Math.abs(n) : String(n));
const pt = (x, y) => `(${num(x)}, ${num(y)})`;
const P3 = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [6, 8, 10]];
const pyt = (L) => { const [a, b, c] = pick(L === 1 ? [P3[0], P3[3]] : P3); return [a, b, c]; };
// y = a(x − h)² + k 的文字形式
const vf = (a, h, k) => `y = ${a === 1 ? '' : a === -1 ? M : num(a)}${h === 0 ? 'x' : '(x' + (h > 0 ? ' − ' + h : ' + ' + (-h)) + ')'}²${k > 0 ? ' + ' + k : k < 0 ? ' − ' + (-k) : ''}`;
// y = ax² + bx + c 的文字形式
const gf = (a, b, c) => `y = ${a === 1 ? '' : a === -1 ? M : num(a)}x²${b > 0 ? ' + ' + (b === 1 ? '' : b) + 'x' : b < 0 ? ' − ' + (b === -1 ? '' : -b) + 'x' : ''}${c > 0 ? ' + ' + c : c < 0 ? ' − ' + (-c) : ''}`;

// ---------- 一、特殊平行四边形 ----------
const T1 = [['对角线互相垂直的平行四边形是菱形', '菱形的判定定理：对角线互相垂直的平行四边形是菱形'], ['四条边相等的四边形是菱形', '菱形的判定：四边相等'], ['有一个角是直角的平行四边形是矩形', '矩形的判定：有一个角是直角的平行四边形'], ['对角线相等的平行四边形是矩形', '矩形的判定：对角线相等的平行四边形'], ['有三个角是直角的四边形是矩形', '矩形的判定：有三个角是直角的四边形'], ['对角线垂直且相等的平行四边形是正方形', '垂直说明是菱形，相等说明是矩形，既是菱形又是矩形就是正方形'], ['有一组邻边相等的矩形是正方形', '正方形的判定：邻边相等的矩形'], ['有一个角是直角的菱形是正方形', '正方形的判定：有一个角是直角的菱形'], ['菱形的对角线互相垂直平分', '菱形的性质'], ['矩形的对角线相等且互相平分', '矩形的性质']];
const F1 = [['对角线互相垂直的四边形是菱形', '反例：筝形（风筝形）的对角线垂直，但不是菱形；必须是平行四边形'], ['对角线相等的四边形是矩形', '反例：等腰梯形的对角线相等，但不是矩形'], ['有一组邻边相等的四边形是菱形', '反例：筝形有一组邻边相等，但不是菱形；必须是平行四边形'], ['有一个角是直角的四边形是矩形', '反例：直角梯形有一个直角，但不是矩形；必须是平行四边形'], ['四个角相等的四边形是正方形', '四个角相等的四边形是矩形，不一定是正方形'], ['菱形的对角线相等', '菱形的对角线互相垂直平分，但不一定相等'], ['矩形的对角线互相垂直', '矩形的对角线相等且互相平分，不一定垂直'], ['对角线互相平分的四边形是矩形', '对角线互相平分的四边形是平行四边形，不一定是矩形'], ['两条对角线相等的平行四边形是菱形', '对角线相等的平行四边形是矩形，不一定是菱形'], ['有一组对边平行且相等的四边形是菱形', '这是平行四边形的判定，不一定是菱形']];
const S1 = [
  { id: 'rhP', name: '菱形的周长与边长', gen: (L) => {
    const a = ri(3, L === 1 ? 12 : 25);
    if (Math.random() < 0.5) return Q('m9-s1-rhP', `菱形的边长是 ${a}，它的周长是多少？`, 4 * a, ['菱形的四条边都相等', `周长 = 边长 × 4 = ${a} × 4 = ${4 * a}`]);
    return Q('m9-s1-rhP', `菱形的周长是 ${4 * a}，它的边长是多少？`, a, ['菱形的四条边都相等', `边长 = 周长 ÷ 4 = ${4 * a} ÷ 4 = ${a}`]); } },
  { id: 'rhA', name: '菱形的面积', gen: (L) => {
    const d1 = ri(3, 14) * 2, d2 = ri(2, L === 1 ? 8 : 15);
    return Q('m9-s1-rhA', `菱形的两条对角线长分别是 ${d1} 和 ${d2}，它的面积是多少？`, d1 * d2 / 2, ['菱形的面积 = 两条对角线长的乘积 ÷ 2', `面积 = ${d1} × ${d2} ÷ 2 = ${d1 * d2 / 2}`]); } },
  { id: 'rhS', name: '菱形的边长（对角线求边长）', gen: (L) => {
    const [a, b, c] = pyt(L), [p, q] = Math.random() < 0.5 ? [a, b] : [b, a];
    return Q('m9-s1-rhS', `菱形的两条对角线长分别是 ${2 * p} 和 ${2 * q}，它的边长是多少？`, c, ['菱形的对角线互相垂直平分，半条对角线分别是 ' + p + ' 和 ' + q, `边长² = ${p}² + ${q}² = ${p * p + q * q}`, `边长 = ${c}`]); } },
  { id: 'rcD', name: '矩形的对角线', gen: (L) => {
    const [a, b, c] = pyt(L), [p, q] = Math.random() < 0.5 ? [a, b] : [b, a];
    if (Math.random() < 0.5) return Q('m9-s1-rcD', `矩形的长是 ${q}，宽是 ${p}，它的对角线长是多少？`, c, ['矩形的四个角都是直角，对角线是直角三角形的斜边', `对角线² = ${q}² + ${p}² = ${q * q + p * p}`, `对角线 = ${c}`]);
    return Q('m9-s1-rcD', `矩形的对角线长是 ${c}，一条边长是 ${p}，它的面积是多少？`, p * q, [`另一条边² = ${c}² − ${p}² = ${q * q}，另一条边 = ${q}`, `面积 = ${p} × ${q} = ${p * q}`]); } },
  { id: 'rcO', name: '矩形对角线交点', gen: (L) => {
    const d = ri(3, 15), t = Math.random() < 0.5;
    if (t) return Q('m9-s1-rcO', `矩形 ABCD 的对角线 AC、BD 相交于点 O，AC = ${2 * d}，则 OB 的长是多少？`, d, ['矩形的对角线相等且互相平分', `BD = AC = ${2 * d}，OB = BD ÷ 2 = ${d}`]);
    return Q('m9-s1-rcO', `矩形 ABCD 的对角线 AC、BD 相交于点 O，OA = ${d}，则 BD 的长是多少？`, 2 * d, ['矩形的对角线相等且互相平分', `AC = 2 × OA = ${2 * d}，BD = AC = ${2 * d}`]); } },
  { id: 'sqD', name: '正方形的边长与对角线', gen: (L) => {
    const f = ri(0, 2);
    if (f === 0) { const a = ri(2, 9); return MC('m9-s1-sqD', `正方形的边长是 ${a}，它的对角线长是多少？`, `${a}√2`, [`${2 * a}`, `${a}`, `${a}√3`], ['正方形的对角线把它分成两个等腰直角三角形', `对角线² = ${a}² + ${a}² = ${2 * a * a}`, `对角线 = ${a}√2`]); }
    if (f === 1) { const d = 2 * ri(2, 10); return Q('m9-s1-sqD', `正方形的对角线长是 ${d}，它的面积是多少？`, d * d / 2, ['正方形是特殊的菱形，面积 = 对角线乘积 ÷ 2（两条对角线相等）', `面积 = ${d} × ${d} ÷ 2 = ${d * d / 2}`]); }
    const a = ri(2, 12); return Q('m9-s1-sqD', `正方形的周长是 ${4 * a}，它的面积是多少？`, a * a, [`边长 = ${4 * a} ÷ 4 = ${a}`, `面积 = ${a} × ${a} = ${a * a}`]); } },
  { id: 'ang', name: '菱形的角', gen: (L) => {
    const a = ri(4, 17) * 5;
    if (Math.random() < 0.5) return Q('m9-s1-ang', `菱形 ABCD 中，∠A = ${a}°，则 ∠B 是多少度？`, 180 - a, ['菱形是平行四边形，邻角互补', `∠B = 180° − ${a}° = ${180 - a}°`]);
    const e = 2 * ri(15, 70); return Q('m9-s1-ang', `菱形 ABCD 中，∠ABC = ${e}°，对角线 BD 平分 ∠ABC，则 ∠ABD 是多少度？`, e / 2, ['菱形的每条对角线平分一组对角', `∠ABD = ${e}° ÷ 2 = ${e / 2}°`]); } },
  { id: 'judge', name: '特殊平行四边形的性质与判定', gen: (L) => {
    if (Math.random() < 0.5) { const f = pick(F1), ts = shuf(T1).slice(0, 3); return MC('m9-s1-judge', '下列命题中，是假命题的是哪一个？', f[0], ts.map(t => t[0]), [`“${f[0]}”是假命题：${f[1]}`, '其余三个命题都是真命题'], 3); }
    const t = pick(T1), fs = shuf(F1).slice(0, 3); return MC('m9-s1-judge', '下列命题中，是真命题的是哪一个？', t[0], fs.map(f => f[0]), [`“${t[0]}”是真命题：${t[1]}`, '其余三个命题都是假命题（各有反例）'], 3); } },
];

// ---------- 二、一元二次方程 ----------
const S2 = [
  { id: 'gen', name: '一般形式', gen: (L) => {
    const a = ri(1, 6), b = ri(1, 6), c = ri(1, 5);
    if (Math.random() < 0.5) return Q('m9-s2-gen', `把方程 (x + ${a})(x + ${b}) = ${c} 化成一般形式 x² + bx + c = 0，一次项系数 b 是多少？`, a + b, ['展开：x² + ' + (a + b) + 'x + ' + a * b + ' = ' + c, `移项：x² + ${a + b}x + (${a * b} − ${c}) = 0`, `一次项系数是 ${a + b}`]);
    return Q('m9-s2-gen', `方程 ${a + 1}x² + ${b}x = ${c} 化成一般形式 ax² + bx + c = 0 后，二次项系数 a 是多少？`, a + 1, [`一般形式：${a + 1}x² + ${b}x − ${c} = 0`, `二次项系数 a = ${a + 1}`]); } },
  { id: 'facMax', name: '因式分解法（求较大的根）', gen: (L) => {
    let p = ri(1, 9), q = ri(1, 9); while (p === q) q = ri(1, 9); const hi = Math.max(p, q), lo = Math.min(p, q);
    return Q('m9-s2-facMax', `解方程 x² − ${p + q}x + ${p * q} = 0，较大的根是多少？`, hi, [`因式分解：(x − ${p})(x − ${q}) = 0`, `x = ${p} 或 x = ${q}`, `较大的根是 ${hi}`]); } },
  { id: 'facMC', name: '因式分解法（含负根）', gen: (L) => {
    let p = ri(1, 9), q = ri(1, 9); while (p === q) q = ri(1, 9); const sgn = Math.random() < 0.5 ? 1 : -1, r1 = sgn * p, r2 = -sgn * q, s = r1 + r2, t = r1 * r2;
    const eq = `x² ${s === 0 ? '' : (s > 0 ? '+ ' : '− ') + (Math.abs(s) === 1 ? '' : Math.abs(s)) + 'x '}${t > 0 ? '+' : '−'} ${Math.abs(t)} = 0`;
    const w = (a, b) => `x₁ = ${num(a)}，x₂ = ${num(b)}`; const ok = w(r1, r2);
    return MC('m9-s2-facMC', `方程 ${eq} 的两个根是哪一组？`, ok, [w(-r1, -r2), w(Math.abs(r1), Math.abs(r2)), w(r1, -r2)], [`因式分解：(x − ${num(r1)})(x − ${num(r2)}) = 0`, `所以 x₁ = ${num(r1)}，x₂ = ${num(r2)}`], 2); } },
  { id: 'sqrt', name: '直接开平方法', gen: (L) => {
    const k = ri(2, 12), h = ri(1, 9);
    if (L === 1) return Q('m9-s2-sqrt', `方程 x² = ${k * k} 的正根是多少？`, k, [`x = ±√${k * k} = ±${k}`, `正根是 ${k}`]);
    return Q('m9-s2-sqrt', `方程 (x − ${h})² = ${k * k} 的较大的根是多少？`, h + k, [`开平方：x − ${h} = ±${k}`, `x = ${h} + ${k} = ${h + k} 或 x = ${h} − ${k} = ${h - k}`, `较大的根是 ${h + k}`]); } },
  { id: 'delta', name: '根的判别式', gen: (L) => {
    const a = ri(1, 3), b = ri(3, 9), c = ri(1, 4), d = b * b - 4 * a * c; if (d < 0) return S2[4].gen(L);
    return Q('m9-s2-delta', `方程 ${a === 1 ? '' : a}x² + ${b}x + ${c} = 0 的根的判别式 Δ = b² − 4ac 的值是多少？`, d, [`a = ${a}，b = ${b}，c = ${c}`, `Δ = ${b}² − 4 × ${a} × ${c} = ${b * b} − ${4 * a * c} = ${d}`]); } },
  { id: 'deltaMC', name: '判断根的情况', gen: (L) => {
    const a = ri(1, 3), b = ri(-6, 6), c = ri(-4, 4); if (a === 0 || c === 0) return S2[5].gen(L); const d = b * b - 4 * a * c;
    const OK = d > 0 ? '有两个不相等的实数根' : d === 0 ? '有两个相等的实数根' : '没有实数根';
    const bs = b === 0 ? '' : b > 0 ? ` + ${b === 1 ? '' : b}x` : ` − ${b === -1 ? '' : -b}x`, cs = c > 0 ? ` + ${c}` : ` − ${-c}`;
    return MC('m9-s2-deltaMC', `不解方程，判断 ${a === 1 ? '' : a}x²${bs}${cs} = 0 的根的情况：`, OK, ['有两个不相等的实数根', '有两个相等的实数根', '没有实数根'], [`Δ = b² − 4ac = (${num(b)})² − 4 × ${a} × (${num(c)}) = ${d}`, d > 0 ? 'Δ > 0，有两个不相等的实数根' : d === 0 ? 'Δ = 0，有两个相等的实数根' : 'Δ < 0，没有实数根'], 2); } },
  { id: 'vieta', name: '根与系数的关系', gen: (L) => {
    const p = ri(1, 8), q = ri(1, 8), s = p + q, t = p * q, f = ri(0, L === 1 ? 1 : 3), eq = `x² − ${s}x + ${t} = 0`;
    if (f === 0) return Q('m9-s2-vieta', `设 x₁、x₂ 是方程 ${eq} 的两个根，则 x₁ + x₂ 的值是多少？`, s, ['根与系数的关系：x₁ + x₂ = −b/a', `x₁ + x₂ = ${s}`]);
    if (f === 1) return Q('m9-s2-vieta', `设 x₁、x₂ 是方程 ${eq} 的两个根，则 x₁ · x₂ 的值是多少？`, t, ['根与系数的关系：x₁ · x₂ = c/a', `x₁ · x₂ = ${t}`]);
    if (f === 2) return Q('m9-s2-vieta', `设 x₁、x₂ 是方程 ${eq} 的两个根，则 x₁² + x₂² 的值是多少？`, s * s - 2 * t, [`x₁ + x₂ = ${s}，x₁ · x₂ = ${t}`, 'x₁² + x₂² = (x₁ + x₂)² − 2x₁x₂', `= ${s}² − 2 × ${t} = ${s * s - 2 * t}`]);
    return QD('m9-s2-vieta', `设 x₁、x₂ 是方程 ${eq} 的两个根，则 1/x₁ + 1/x₂ 的值是多少？（写成最简分数）`, frac(s, t), [`x₁ + x₂ = ${s}，x₁ · x₂ = ${t}`, '1/x₁ + 1/x₂ = (x₁ + x₂) ÷ (x₁ · x₂)', `= ${s}/${t} = ${frac(s, t)}`]); } },
  { id: 'growth', name: '增长率问题', gen: (L) => {
    const [a, b, r] = pick([[100, 121, 10], [100, 144, 20], [400, 625, 25], [100, 225, 50], [200, 242, 10], [50, 72, 20], [100, 169, 30]]);
    return Q('m9-s2-growth', `某工厂的年产值第一年是 ${a} 万元，第三年是 ${b} 万元，两年来每年的增长率相同，平均每年的增长率是百分之几？（只填数字）`, r, [`设平均每年增长率为 x，列方程：${a}(1 + x)² = ${b}`, `(1 + x)² = ${b / a}，1 + x = ${Math.sqrt(b / a)}（负值舍去）`, `x = ${r / 100} = ${r}%`]); } },
  { id: 'match', name: '比赛场次与握手问题', gen: (L) => {
    const n = ri(4, 12), t = ri(0, 2);
    if (t === 0) return Q('m9-s2-match', `某校组织篮球单循环赛（每两队都比赛一场），共比赛 ${n * (n - 1) / 2} 场，有多少支队伍参赛？`, n, [`设有 x 支队伍，每队比赛 (x − 1) 场，每场重复算了一次`, `x(x − 1) ÷ 2 = ${n * (n - 1) / 2}`, `x² − x − ${n * (n - 1)} = 0，解得 x = ${n}（负值舍去）`]);
    if (t === 1) return Q('m9-s2-match', `参加聚会的每两个人握一次手，共握手 ${n * (n - 1) / 2} 次，一共有多少人参加聚会？`, n, ['设有 x 人，列方程 x(x − 1) ÷ 2 = ' + n * (n - 1) / 2, `x² − x − ${n * (n - 1)} = 0，解得 x = ${n}（负值舍去）`]);
    return Q('m9-s2-match', `某班同学毕业时每两人互赠一张照片（互相各送一张），共送出 ${n * (n - 1)} 张，这个班有多少名同学？`, n, ['设有 x 名同学，每人送出 (x − 1) 张', `x(x − 1) = ${n * (n - 1)}，解得 x = ${n}（负值舍去）`]); } },
  { id: 'rect', name: '面积问题', gen: (L) => {
    const w = ri(3, 12), d = ri(1, 8);
    return Q('m9-s2-rect', `一个长方形的长比宽多 ${d}，面积是 ${w * (w + d)}，它的宽是多少？`, w, [`设宽为 x，则长为 x + ${d}`, `x(x + ${d}) = ${w * (w + d)}`, `x² + ${d}x − ${w * (w + d)} = 0，(x − ${w})(x + ${w + d}) = 0，x = ${w}（负值舍去）`]); } },
];

// ---------- 三、图形的相似 ----------
const T3 = [['两个角分别相等的两个三角形相似', '相似三角形的判定：两角分别相等（AA）'], ['三边成比例的两个三角形相似', '相似三角形的判定：三边成比例（SSS）'], ['所有的等边三角形都相似', '等边三角形的三个角都是 60°，两角分别相等'], ['所有的正方形都相似', '正方形的四个角都是直角，边长都相等，对应边成比例'], ['两边成比例且夹角相等的两个三角形相似', '相似三角形的判定：两边成比例且夹角相等（SAS）'], ['全等三角形一定相似', '全等三角形是相似比为 1 的相似三角形']];
const F3 = [['所有的矩形都相似', '反例：长 2 宽 1 的矩形与长 3 宽 1 的矩形不相似'], ['所有的菱形都相似', '反例：边相等但角不同的菱形不相似'], ['有一个角相等的两个等腰三角形相似', '反例：顶角 40° 的等腰三角形与底角 40° 的等腰三角形不相似'], ['两边成比例的两个三角形相似', '还需要夹角相等才能判定相似'], ['所有的直角三角形都相似', '反例：两个锐角为 30°、60° 的直角三角形与两个锐角都是 45° 的不相似'], ['相似三角形一定全等', '相似比不为 1 时不全等'], ['面积相等的两个三角形相似', '反例：面积相等的两个三角形形状可以完全不同']];
const S3 = [
  { id: 'prop', name: '比例线段', gen: (L) => {
    const r = ri(1, 6), s = ri(2, 9), t = ri(2, 6), u = ri(1, 6), a = r * t, b = s * t, c = r * u;
    return Q('m9-s3-prop', `如果 a : b = c : x，其中 a = ${a}，b = ${b}，c = ${c}，那么 x 是多少？`, s * u, ['比例的基本性质：内项积等于外项积，a · x = b · c', `x = ${b} × ${c} ÷ ${a} = ${s * u}`]); } },
  { id: 'per', name: '相似比与周长', gen: (L) => {
    const m = ri(1, 4), n = m + ri(1, 4), t = ri(2, 9), P = m * t * ri(2, 5), k = P / m * n;
    return Q('m9-s3-per', `两个相似三角形的相似比是 ${m} : ${n}，较小三角形的周长是 ${P}，较大三角形的周长是多少？`, k, ['相似三角形的周长比等于相似比', `较大的周长 = ${P} ÷ ${m} × ${n} = ${k}`]); } },
  { id: 'area', name: '相似比与面积', gen: (L) => {
    const m = ri(1, 4), n = m + ri(1, 4), t = ri(1, 6), S = m * m * t;
    return Q('m9-s3-area', `两个相似三角形的相似比是 ${m} : ${n}，较小三角形的面积是 ${S}，较大三角形的面积是多少？`, n * n * t, ['相似三角形的面积比等于相似比的平方', `面积比 = ${m * m} : ${n * n}`, `较大的面积 = ${S} ÷ ${m * m} × ${n * n} = ${n * n * t}`]); } },
  { id: 'sides', name: '相似三角形的对应边', gen: (L) => {
    const a = ri(2, 6), k = ri(2, 4), c = ri(2, 9), b = a * k, e = c * k;
    return Q('m9-s3-sides', `△ABC ∽ △DEF，AB = ${a}，DE = ${b}，BC = ${c}，那么 EF 的长是多少？`, e, ['相似三角形的对应边成比例：AB : DE = BC : EF', `EF = ${c} × ${b} ÷ ${a} = ${e}`]); } },
  { id: 'par', name: '平行线分线段成比例', gen: (L) => {
    const a = ri(1, 5), b = ri(1, 5), k = ri(1, 4);
    if (Math.random() < 0.5) return Q('m9-s3-par', `在 △ABC 中，D、E 分别在 AB、AC 上，DE ∥ BC，AD = ${a}，DB = ${b}，AE = ${a * k}，那么 EC 的长是多少？`, b * k, ['DE ∥ BC，所以 AD : DB = AE : EC', `${a} : ${b} = ${a * k} : EC`, `EC = ${b} × ${a * k} ÷ ${a} = ${b * k}`]);
    const BC = (a + b) * ri(2, 6);
    return QD('m9-s3-par', `在 △ABC 中，D 在 AB 上，E 在 AC 上，DE ∥ BC，AD : DB = ${a} : ${b}，BC = ${BC}，那么 DE 的长是多少？`, frac(BC * a, a + b), ['DE ∥ BC，△ADE ∽ △ABC', `DE : BC = AD : AB = ${a} : ${a + b}`, `DE = ${BC} × ${a} ÷ ${a + b} = ${frac(BC * a, a + b)}`]); } },
  { id: 'shadow', name: '利用影子测高', gen: (L) => {
    const [h, s] = pick([[2, 3], [3, 2], [4, 3], [6, 5], [5, 4], [2, 1]]), k = ri(2, 12), S = s * k;
    return Q('m9-s3-shadow', `同一时刻，身高 ${h} 米的人影长 ${s} 米，旁边一棵树的影长是 ${S} 米，这棵树高多少米？`, h * k, ['同一时刻，物高与影长成比例（构成相似三角形）', `树高 : ${S} = ${h} : ${s}`, `树高 = ${S} × ${h} ÷ ${s} = ${h * k}（米）`]); } },
  { id: 'homo', name: '位似', gen: (L) => {
    const k = pick([2, 3, 4]), x = ri(1, 6) * (Math.random() < 0.5 ? 1 : -1), y = ri(1, 6) * (Math.random() < 0.5 ? 1 : -1);
    if (Math.random() < 0.7) return MC('m9-s3-homo', `以原点为位似中心，把点 A${pt(x, y)} 放大为原来的 ${k} 倍（位似比为 ${k}，图形在原点同侧），对应点 A′ 的坐标是：`, pt(k * x, k * y), [pt(-k * x, -k * y), pt(x + k, y + k), pt(x * k, y)], ['以原点为位似中心，且在同侧时，对应点的坐标等于原坐标乘位似比', `A′ = (${num(x)} × ${k}, ${num(y)} × ${k}) = ${pt(k * x, k * y)}`]);
    const l = ri(2, 9); return Q('m9-s3-homo', `△ABC 与 △A′B′C′ 是位似图形，位似比是 1 : ${k}，AB = ${l}，那么 A′B′ 的长是多少？`, l * k, ['位似图形是相似图形，对应线段的比等于位似比', `A′B′ = ${l} × ${k} = ${l * k}`]); } },
  { id: 'judge', name: '相似图形的判定', gen: (L) => {
    if (Math.random() < 0.5) { const f = pick(F3), ts = shuf(T3).slice(0, 3); return MC('m9-s3-judge', '下列命题中，是假命题的是哪一个？', f[0], ts.map(t => t[0]), [`“${f[0]}”是假命题：${f[1]}`, '其余三个命题都是真命题'], 3); }
    const t = pick(T3), fs = shuf(F3).slice(0, 3); return MC('m9-s3-judge', '下列命题中，是真命题的是哪一个？', t[0], fs.map(f => f[0]), [`“${t[0]}”是真命题：${t[1]}`, '其余三个命题都是假命题（各有反例）'], 3); } },
];

// ---------- 四、投影与视图 ----------
const PROJ = [['太阳光下，树在地面上的影子', '平行投影'], ['路灯下，人在地面上的影子', '中心投影'], ['手电筒照射下，书本在墙上的影子', '中心投影'], ['正午阳光下，旗杆的影子', '平行投影'], ['皮影戏中，灯光把皮影投在幕布上的影子', '中心投影'], ['日晷上，太阳光下指针的影子', '平行投影'], ['舞台聚光灯下，演员的影子', '中心投影'], ['电影放映机把画面投到银幕上', '中心投影']];
const SOLID = [['圆柱', '主视图', '矩形'], ['圆柱', '俯视图', '圆'], ['圆锥', '主视图', '等腰三角形'], ['圆锥', '俯视图', '圆'], ['球', '主视图', '圆'], ['球', '俯视图', '圆'], ['正方体', '主视图', '正方形'], ['长方体', '左视图', '矩形'], ['长方体', '俯视图', '矩形']];
const SHAPES = ['矩形', '圆', '等腰三角形', '正方形', '梯形'];
const S4 = [
  { id: 'proj', name: '平行投影与中心投影', gen: (L) => {
    const [d, a] = pick(PROJ), why = a === '平行投影' ? '太阳光可看成平行光线，所得投影是平行投影' : '光线从一个点（灯泡、手电筒等点光源）发出，所得投影是中心投影';
    return MC('m9-s4-proj', `${d}，属于哪种投影？`, a, ['平行投影', '中心投影', '不属于投影'], [why], 2); } },
  { id: 'shadow', name: '同一时刻的影长', gen: (L) => {
    const [h, s] = pick([[2, 3], [3, 2], [4, 3], [6, 5], [5, 4], [2, 1], [3, 4]]), k = ri(2, 10);
    return Q('m9-s4-shadow', `在同一时刻的太阳光下，高 ${h} 米的竹竿影长 ${s} 米，旁边一座塔高 ${h * k} 米，塔的影长是多少米？`, s * k, ['同一时刻的太阳光是平行光，物高与影长成比例', `塔影长 : ${s} = ${h * k} : ${h}`, `塔影长 = ${s} × ${h * k} ÷ ${h} = ${s * k}（米）`]); } },
  { id: 'solid', name: '几何体的三视图', gen: (L) => {
    const [g, v, a] = pick(SOLID);
    return MC('m9-s4-solid', `${g}（按常见方式摆放）的${v}是什么形状？`, a, shuf(SHAPES.filter(x => x !== a)).slice(0, 3), [`${g}的${v}是${a}`], 3); } },
  { id: 'cube', name: '长方体的视图面积', gen: (L) => {
    const l = ri(2, 9), w = ri(2, 9), h = ri(2, 9), f = ri(0, 2);
    const base = `一个长方体的长是 ${l}，宽是 ${w}，高是 ${h}，按长边朝左右放在桌面上。`;
    if (f === 0) return Q('m9-s4-cube', base + '它的主视图（从正面看）的面积是多少？', l * h, ['主视图的宽是长方体的长，高是长方体的高', `面积 = ${l} × ${h} = ${l * h}`]);
    if (f === 1) return Q('m9-s4-cube', base + '它的左视图（从左面看）的面积是多少？', w * h, ['左视图的宽是长方体的宽，高是长方体的高', `面积 = ${w} × ${h} = ${w * h}`]);
    return Q('m9-s4-cube', base + '它的俯视图（从上面看）的面积是多少？', l * w, ['俯视图的长是长方体的长，宽是长方体的宽', `面积 = ${l} × ${w} = ${l * w}`]); } },
  { id: 'stack', name: '小立方体的个数', gen: (L) => {
    const r = ri(2, 3), c = ri(2, 3), g = Array.from({ length: r }, () => Array.from({ length: c }, () => ri(1, L === 1 ? 2 : 4))), tot = g.flat().reduce((x, y) => x + y, 0);
    const show = g.map((row, i) => `第 ${i + 1} 行：${row.join('，')}`).join('；');
    return Q('m9-s4-stack', `用小立方体搭一个几何体，俯视图是 ${r} 行 ${c} 列的方格，每个方格里的数字表示该位置小立方体的个数（${show}）。这个几何体一共用了多少个小立方体？`, tot, ['把每个方格里的数字加起来', `${g.flat().join(' + ')} = ${tot}`]); } },
  { id: 'front', name: '主视图的高度', gen: (L) => {
    const r = ri(2, 3), c = ri(3, 4), g = Array.from({ length: r }, () => Array.from({ length: c }, () => ri(1, 4))), j = ri(0, c - 1), ans = Math.max(...g.map(row => row[j]));
    const show = g.map((row, i) => `第 ${i + 1} 行：${row.join('，')}`).join('；');
    return Q('m9-s4-front', `用小立方体搭一个几何体，俯视图是 ${r} 行 ${c} 列的方格，每个方格里的数字表示该位置小立方体的个数（${show}）。从正面看，主视图中从左数第 ${j + 1} 列最高有几个小正方形？`, ans, ['从正面看，同一列（上下各行）叠在一起，看到的是这一列里最高的那个', `第 ${j + 1} 列各行的数字是 ${g.map(row => row[j]).join('、')}，最大的是 ${ans}`]); } },
];

// ---------- 五、二次函数 ----------
const S5 = [
  { id: 'val', name: '求函数值', gen: (L) => {
    for (;;) {
      const a = ri(1, 3), b = ri(-5, 5), c = ri(-4, 6), x = ri(1, 5), y = a * x * x + b * x + c; if (y < 0) continue;
      return Q('m9-s5-val', `二次函数 ${gf(a, b, c)}，当 x = ${x} 时，y 的值是多少？`, y, [`把 x = ${x} 代入`, `y = ${a} × ${x}² ${b < 0 ? '−' : '+'} ${Math.abs(b)} × ${x} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${y}`]); } } },
  { id: 'vertex', name: '顶点式求顶点', gen: (L) => {
    let h = ri(-6, 6), k = ri(-6, 6), a = pick([1, 2, 3, -1, -2]); while (h === 0 || k === 0) { h = ri(-6, 6); k = ri(-6, 6); }
    return MC('m9-s5-vertex', `二次函数 ${vf(a, h, k)} 的图象的顶点坐标是：`, pt(h, k), [pt(-h, k), pt(h, -k), pt(-h, -k)], ['顶点式 y = a(x − h)² + k 的顶点是 (h, k)', `这里 h = ${num(h)}，k = ${num(k)}，顶点是 ${pt(h, k)}`]); } },
  { id: 'axis', name: '对称轴', gen: (L) => {
    const a = pick([1, 2, -1, -2]), x0 = ri(-5, 5) || 3, b = -2 * a * x0, c = ri(-4, 6);
    return MC('m9-s5-axis', `二次函数 ${gf(a, b, c)} 的图象的对称轴是：`, `x = ${num(x0)}`, [`x = ${num(-x0)}`, `x = ${num(b)}`, `x = ${num(-b)}`], ['对称轴公式：x = −b ÷ (2a)', `x = −(${num(b)}) ÷ (2 × ${num(a)}) = ${num(x0)}`]); } },
  { id: 'ext', name: '最大值与最小值', gen: (L) => {
    const a = ri(1, 4), h = ri(1, 7), k = ri(1, 9);
    if (Math.random() < 0.5) return Q('m9-s5-ext', `二次函数 ${vf(a, -h, k)} 的最小值是多少？`, k, ['a > 0，图象开口向上，函数有最小值，在顶点处取得', `顶点纵坐标 k = ${k}，最小值是 ${k}`]);
    return Q('m9-s5-ext', `二次函数 ${vf(-a, h, k)} 的最大值是多少？`, k, ['a < 0，图象开口向下，函数有最大值，在顶点处取得', `顶点纵坐标 k = ${k}，最大值是 ${k}`]); } },
  { id: 'roots', name: '与 x 轴的交点', gen: (L) => {
    let p = ri(-6, 6), q = ri(-6, 6); while (p === q || p === 0 || q === 0) { p = ri(-6, 6); q = ri(-6, 6); }
    const f = (v) => v > 0 ? `(x − ${v})` : `(x + ${-v})`;
    return MC('m9-s5-roots', `二次函数 y = ${f(p)}${f(q)} 的图象与 x 轴的交点坐标是：`, `${pt(p, 0)} 和 ${pt(q, 0)}`, [`${pt(-p, 0)} 和 ${pt(-q, 0)}`, `${pt(0, p)} 和 ${pt(0, q)}`, `${pt(p, 0)} 和 ${pt(-q, 0)}`], ['令 y = 0，解方程', `${f(p)}${f(q)} = 0，x = ${num(p)} 或 x = ${num(q)}`, `交点是 ${pt(p, 0)} 和 ${pt(q, 0)}`], 2); } },
  { id: 'yint', name: '与 y 轴的交点', gen: (L) => {
    const a = ri(1, 3), b = ri(-5, 5), c = ri(-8, 8) || 4;
    return MC('m9-s5-yint', `二次函数 ${gf(a, b, c)} 的图象与 y 轴的交点坐标是：`, pt(0, c), [pt(c, 0), pt(0, -c), pt(0, a)], ['令 x = 0', `y = ${num(c)}，交点是 ${pt(0, c)}`], 2); } },
  { id: 'shift', name: '图象的平移', gen: (L) => {
    const a = pick([1, 2, -1, 3]), h = ri(-3, 3), k = ri(-3, 3), m = ri(1, 3), n = ri(1, 3), dir = Math.random() < 0.5;
    const h2 = dir ? h + m : h - m, k2 = k + n; if (h2 === 0 && false) return null;
    const txt = `把二次函数 ${vf(a, h, k)} 的图象向${dir ? '右' : '左'}平移 ${m} 个单位，再向上平移 ${n} 个单位，所得图象的函数解析式是：`;
    return MC('m9-s5-shift', txt, vf(a, h2, k2), [vf(a, dir ? h - m : h + m, k2), vf(a, h2, k - n), vf(a, dir ? h - m : h + m, k - n)], ['平移规律：左加右减（对 x），上加下减（对 y）', `向${dir ? '右' : '左'}平移 ${m} 个单位：h 变为 ${num(h2)}；向上平移 ${n} 个单位：k 变为 ${num(k2)}`, vf(a, h2, k2)], 2); } },
  { id: 'cnt', name: '与 x 轴交点的个数', gen: (L) => {
    const b = ri(-6, 6), c = ri(-3, 8), d = b * b - 4 * c, n = d > 0 ? 2 : d === 0 ? 1 : 0;
    return MC('m9-s5-cnt', `二次函数 ${gf(1, b, c)} 的图象与 x 轴有几个交点？`, `${n} 个`, ['0 个', '1 个', '2 个'], [`Δ = b² − 4ac = (${num(b)})² − 4 × 1 × ${num(c)} = ${d}`, d > 0 ? 'Δ > 0，有 2 个交点' : d === 0 ? 'Δ = 0，有 1 个交点' : 'Δ < 0，没有交点'], 2); } },
  { id: 'fence', name: '围矩形的最大面积', gen: (L) => {
    const k = ri(2, 12), P = 4 * k;
    return Q('m9-s5-fence', `用长为 ${P} 米的篱笆围成一个矩形，设一边长为 x 米，面积为 S 平方米，S 的最大值是多少？`, k * k, [`另一边长为 (${P / 2} − x) 米`, `S = x(${P / 2} − x) = −x² + ${P / 2}x`, `x = ${P / 2} ÷ 2 = ${k} 时，S 最大，最大值 = ${k} × ${k} = ${k * k}`]); } },
  { id: 'profit', name: '最大利润', gen: (L) => {
    for (;;) {
      const cost = ri(10, 40), p0 = cost + ri(5, 20), q0 = ri(5, 20) * 10, m = pick([5, 10]);
      let best = -1, bx = 0; for (let x = cost; x <= p0 + 60; x++) { const q = q0 - m * (x - p0); if (q <= 0) continue; const v = (x - cost) * q; if (v > best) { best = v; bx = x; } }
      // 顶点处必须是整数
      const xs = (cost + p0 + q0 / m) / 2; if (!Number.isInteger(xs) || xs <= p0 || best <= 0) continue;
      return Q('m9-s5-profit', `某商品进价每件 ${cost} 元，售价每件 ${p0} 元时，每天卖出 ${q0} 件。如果每件涨价 1 元，每天少卖 ${m} 件，设售价为 x 元，每天的利润最大是多少元？`, best,
        [`每天销量 = ${q0} − ${m}(x − ${p0})，利润 w = (x − ${cost})[${q0} − ${m}(x − ${p0})]`, `这是开口向下的二次函数，顶点处最大，x = ${bx}`, `w最大 = (${bx} − ${cost}) × ${q0 - m * (bx - p0)} = ${best}`]); } } },
];

// ---------- 六、概率的进一步认识 ----------
const dice2 = [];
for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) dice2.push([i, j]);
const DP = [
  ['点数之和等于 7', (a, b) => a + b === 7], ['点数之和等于 8', (a, b) => a + b === 8], ['点数之和大于 9', (a, b) => a + b > 9], ['点数之和小于 5', (a, b) => a + b < 5], ['点数相同', (a, b) => a === b], ['点数之和是偶数', (a, b) => (a + b) % 2 === 0], ['点数之积是 6', (a, b) => a * b === 6], ['至少有一个点数是 6', (a, b) => a === 6 || b === 6]];
const S6 = [
  { id: 'dice', name: '掷两枚骰子', gen: (L) => {
    const [t, f] = pick(DP), n = dice2.filter(([a, b]) => f(a, b)).length; if (!n) return null;
    return QD('m9-s6-dice', `同时掷两枚质地均匀的骰子，${t}的概率是多少？（写成最简分数）`, frac(n, 36), ['两枚骰子共有 6 × 6 = 36 种等可能的结果（可用表格列出）', `满足“${t}”的结果有 ${n} 种`, `概率 = ${n}/36 = ${frac(n, 36)}`]); } },
  { id: 'coin', name: '抛硬币', gen: (L) => {
    const n = L === 1 ? 2 : pick([2, 3]), all = [];
    for (let m = 0; m < 1 << n; m++) all.push(Array.from({ length: n }, (_, i) => (m >> i) & 1));
    const P = [[`恰好有 1 枚正面朝上`, (a) => a.reduce((x, y) => x + y, 0) === 1], [`至少有 1 枚正面朝上`, (a) => a.some(x => x)], [`${n} 枚硬币朝上的面相同`, (a) => a.every(x => x === a[0])], [`恰好有 ${n - 1} 枚正面朝上`, (a) => a.reduce((x, y) => x + y, 0) === n - 1]];
    const [t, f] = pick(P), c = all.filter(f).length;
    return QD('m9-s6-coin', `同时抛 ${n} 枚质地均匀的硬币，${t}的概率是多少？（写成最简分数）`, frac(c, all.length), [`${n} 枚硬币共有 ${all.length} 种等可能的结果（用树状图列出）`, `满足条件的结果有 ${c} 种`, `概率 = ${c}/${all.length} = ${frac(c, all.length)}`]); } },
  { id: 'balls', name: '摸球问题', gen: (L) => {
    const r = ri(2, 5), w = ri(2, 5), n = r + w, rep = Math.random() < 0.5, same = Math.random() < 0.5;
    let c, tot; if (rep) { tot = n * n; c = same ? r * r + w * w : 2 * r * w; } else { tot = n * (n - 1); c = same ? r * (r - 1) + w * (w - 1) : 2 * r * w; }
    if (!c) return null;
    return QD('m9-s6-balls', `袋中有 ${r} 个红球和 ${w} 个白球，它们除颜色外完全相同。从中先后摸出两个球（${rep ? '每次摸出后放回' : '摸出的球不放回'}），两次摸到的球颜色${same ? '相同' : '不同'}的概率是多少？（写成最简分数）`, frac(c, tot),
      [`${rep ? `有放回：共 ${n} × ${n} = ${tot} 种等可能结果` : `不放回：共 ${n} × ${n - 1} = ${tot} 种等可能结果`}`, same ? `颜色相同的结果有 ${c} 种（红红与白白）` : `颜色不同的结果有 ${c} 种（红白与白红）`, `概率 = ${c}/${tot} = ${frac(c, tot)}`]); } },
  { id: 'cards', name: '抽卡片', gen: (L) => {
    const n = ri(4, 6), ps = []; for (let i = 1; i <= n; i++) for (let j = 1; j <= n; j++) if (i !== j) ps.push([i, j]);
    const P = [['两张卡片上的数字之和是偶数', (a, b) => (a + b) % 2 === 0], ['两张卡片上的数字之和大于 ' + (n + 1), (a, b) => a + b > n + 1], ['两张卡片上的数字都是奇数', (a, b) => a % 2 && b % 2], ['第二张的数字比第一张大', (a, b) => b > a]];
    const [t, f] = pick(P), c = ps.filter(([a, b]) => f(a, b)).length; if (!c) return null;
    return QD('m9-s6-cards', `有 ${n} 张卡片，分别写有数字 1 到 ${n}（每张一个数），背面完全相同。先后从中不放回地抽出两张，${t}的概率是多少？（写成最简分数）`, frac(c, ps.length), [`共 ${n} × ${n - 1} = ${ps.length} 种等可能的结果`, `满足条件的有 ${c} 种`, `概率 = ${c}/${ps.length} = ${frac(c, ps.length)}`]); } },
  { id: 'freq', name: '用频率估计概率（摸球）', gen: (L) => {
    const [p, T] = pick([[0.2, 50], [0.25, 40], [0.4, 50], [0.5, 30], [0.2, 100], [0.25, 80]]), k = Math.round(p * T);
    return Q('m9-s6-freq', `袋中有若干个除颜色外完全相同的球，其中红球有 ${k} 个。通过大量重复摸球试验，发现摸到红球的频率稳定在 ${p} 附近，估计袋中大约有多少个球？`, T, ['当试验次数很大时，频率稳定在概率附近', `红球数 ÷ 总球数 ≈ ${p}`, `总球数 ≈ ${k} ÷ ${p} = ${T}`]); } },
  { id: 'fish', name: '估计池塘里的鱼数', gen: (L) => {
    for (;;) { const k = pick([20, 30, 40, 50, 60]), m = pick([50, 100, 200]), t = pick([2, 4, 5, 10]); if ((k * m) % t) continue;
      return Q('m9-s6-fish', `为了估计池塘里有多少条鱼，先捞出 ${k} 条做上标记后放回，充分混合后再捞出 ${m} 条，发现其中有 ${t} 条有标记，估计池塘里大约有多少条鱼？`, k * m / t, ['样本中有标记的比例 ≈ 全部鱼中有标记的比例', `${t} : ${m} ≈ ${k} : 总数`, `总数 ≈ ${k} × ${m} ÷ ${t} = ${k * m / t}`]); } } },
  { id: 'out', name: '等可能结果的个数', gen: (L) => {
    const n = ri(3, 7), rep = Math.random() < 0.5;
    return Q('m9-s6-out', `袋中有 ${n} 个不同颜色的球，先后摸出两个球（${rep ? '每次摸出后放回' : '摸出的球不放回'}），用树状图列出所有等可能结果，共有多少种结果？`, rep ? n * n : n * (n - 1), [rep ? `第一次有 ${n} 种，第二次也有 ${n} 种` : `第一次有 ${n} 种，第二次剩下 ${n - 1} 种`, `共 ${rep ? n * n : n * (n - 1)} 种`]); } },
];

export const CH9 = [
  { id: 's1', name: '特殊平行四边形', types: S1 },
  { id: 's2', name: '一元二次方程', types: S2 },
  { id: 's3', name: '图形的相似', types: S3 },
  { id: 's4', name: '投影与视图', types: S4 },
  { id: 's5', name: '二次函数', types: S5 },
  { id: 's6', name: '概率的进一步认识', types: S6 },
];
export const CHAP9_TYPES = chapTypes(CH9, 'm9-');

// 八年级上册数学（北师大版）章节随机出题：勾股定理、实数、位置与坐标、一次函数、二元一次方程组、数据的分析、平行线的证明
// 只做文字题（不依赖图片），答案全部由程序算出，每题带分步解析。
// 答案是根式、坐标、解析式的题一律用选择题；填空题的答案只有整数、小数、分数三种。
import { chapTypes } from './chapgen.js';
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hash = (s) => { let x = 5381; for (const c of s) x = ((x << 5) + x + c.charCodeAt(0)) >>> 0; return x.toString(36); };
const Q = (typeId, stem, ans, steps, extra) => Object.assign({ type: 'math', typeId, stem, answer: String(ans), pts: 1, id: 'r-' + typeId + '-' + hash(stem), digits: true,
  why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${ans}` }, extra || {});
const QD = (typeId, stem, ans, steps) => Q(typeId, stem, ans, steps, { digits: false });
// 选择题：错误选项去重后至少要有 min 个（默认 2，即 3 个选项）
const MC = (typeId, stem, correct, wrongs, steps, min = 2) => {
  const ws = [...new Set(wrongs.map(String).filter(w => w !== String(correct)))].slice(0, 3); if (ws.length < min) return null;
  const opts = shuf([String(correct), ...ws]);
  return { type: 'choice', plain: true, typeId, stem, options: opts, answer: 'ABCD'[opts.indexOf(String(correct))], pts: 1, id: 'r-' + typeId + '-' + hash(stem + correct),
    why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${correct}` };
};
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
// 把整数 n 看成 n / 10^k，写成最简小数
const D = (n, k) => { let s = (n / Math.pow(10, k)).toFixed(k); if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, ''); return s; };
const frac = (n, d) => { const g = gcd(n, d); return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`; };
const M = '−';
const pn = (x) => (x < 0 ? `(${num(x)})` : num(x));
const num = (n) => (n < 0 ? M + Math.abs(n) : String(n));
const pt = (x, y) => `(${num(x)}, ${num(y)})`;
const lin = (k, b) => `y = ${k === 1 ? '' : k === -1 ? M : num(k)}x${b > 0 ? ' + ' + b : b < 0 ? ' − ' + (-b) : ''}`;
const isSq = (n) => Number.isInteger(Math.sqrt(n));
const isTri = (x, y, z) => { const s = [x, y, z].sort((p, q) => p - q); return s[0] * s[0] + s[1] * s[1] === s[2] * s[2]; };
const P3 = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25]];
// 勾股数 [a, b, c]（a<b<c）
const pyt = (L) => { const [a, b, c] = pick(L === 1 ? [P3[0]] : P3); const k = ri(1, L === 1 ? 3 : L === 2 ? 2 : 4); return [a * k, b * k, c * k]; };
const comma = (a) => a.join('，');

// ---------- 一、勾股定理 ----------
const S1 = [
  { id: 'hyp', name: '已知两直角边求斜边', gen: (L) => {
    const [a, b, c] = pyt(L), f = ri(0, 2), [p, q] = Math.random() < 0.5 ? [a, b] : [b, a];
    const stem = f === 0 ? `直角三角形的两条直角边分别是 ${p} 和 ${q}，斜边是多少？` : f === 1 ? `一个长方形的长是 ${q}，宽是 ${p}，它的对角线长是多少？` : `在 Rt△ABC 中，∠C = 90°，AC = ${p}，BC = ${q}，AB 的长是多少？`;
    return Q('m8-s1-hyp', stem, c, ['勾股定理：两条直角边的平方和等于斜边的平方', `${p}² + ${q}² = ${p * p} + ${q * q} = ${c * c}`, `斜边 = √${c * c} = ${c}`]); } },
  { id: 'leg', name: '已知斜边和一直角边求另一直角边', gen: (L) => {
    const [a, b, c] = pyt(L), [p, q] = Math.random() < 0.5 ? [a, b] : [b, a], f = ri(0, 2);
    const stem = f === 0 ? `直角三角形的斜边是 ${c}，一条直角边是 ${p}，另一条直角边是多少？` : f === 1 ? `一个长方形的对角线长 ${c}，一条边长 ${p}，另一条边长是多少？` : `在 Rt△ABC 中，∠C = 90°，AB = ${c}，AC = ${p}，BC 的长是多少？`;
    return Q('m8-s1-leg', stem, q, ['勾股定理：两条直角边的平方和等于斜边的平方', `另一条直角边² = ${c}² − ${p}² = ${c * c} − ${p * p} = ${q * q}`, `另一条直角边 = √${q * q} = ${q}`]); } },
  { id: 'rt', name: '判断能否构成直角三角形', gen: (L) => {
    const [a, b, c] = pyt(L), right = shuf([a, b, c]), ws = [];
    [[a, b, c + 1], [a + 1, b, c], [a, b + 1, c + 2], [a, b, c - 1], [a + 2, b, c], [a, b + 2, c + 1]].forEach(t => { if (!isTri(...t) && Math.min(...t) > 0) ws.push(comma(shuf(t))); });
    return MC('m8-s1-rt', '下列各组数中，能作为直角三角形三边长的是哪一组？', comma(right), ws, ['勾股定理的逆定理：如果两条较短边的平方和等于最长边的平方，这个三角形就是直角三角形', `${a}² + ${b}² = ${a * a + b * b}，${c}² = ${c * c}，相等`, '其余几组都不满足“两短边平方和 = 最长边平方”']); } },
  { id: 'ladder', name: '梯子与高度问题', gen: (L) => {
    if (L < 3 || Math.random() < 0.3) { const [a, b, c] = pyt(L); return Q('m8-s1-ladder', `一架 ${c} 米长的梯子斜靠在墙上，梯子底端离墙 ${a} 米，梯子的顶端离地面多少米？`, b, ['墙与地面垂直，梯子、墙、地面构成直角三角形，梯子是斜边', `顶端高度² = ${c}² − ${a}² = ${c * c} − ${a * a} = ${b * b}`, `顶端高度 = ${b}（米）`]); }
    const [c, a1, h1, a2, h2] = pick([[25, 7, 24, 15, 20], [10, 6, 8, 8, 6], [13, 5, 12, 12, 5], [15, 9, 12, 12, 9], [17, 8, 15, 15, 8]]), d = h1 - h2;
    return Q('m8-s1-ladder', `一架 ${c} 米长的梯子斜靠在墙上，梯子底端离墙 ${a1} 米。如果梯子的顶端沿墙下滑 ${d} 米，那么梯子的底端在水平方向上滑动了多少米？`, a2 - a1,
      [`梯子长度不变。下滑前顶端高度：√(${c * c} − ${a1 * a1}) = ${h1}`, `下滑后顶端高度：${h1} − ${d} = ${h2}`, `下滑后底端离墙：√(${c * c} − ${h2 * h2}) = ${a2}`, `底端滑动：${a2} − ${a1} = ${a2 - a1}（米）`]); } },
  { id: 'hgt', name: '斜边上的高', gen: (L) => {
    const k = ri(1, L === 1 ? 2 : 5), a = 3 * k, b = 4 * k, c = 5 * k;
    return QD('m8-s1-hgt', `直角三角形的两条直角边分别是 ${a} 和 ${b}，斜边上的高是多少？`, D(24 * k, 1), [`斜边 = √(${a}² + ${b}²) = ${c}`, `用面积相等：${a} × ${b} ÷ 2 = ${c} × 高 ÷ 2`, `高 = ${a} × ${b} ÷ ${c} = ${D(24 * k, 1)}`]); } },
  { id: 'box', name: '长方体表面最短路线', gen: (L) => {
    let l, w, h, s1, s2, s3, m;
    for (let i = 0; i < 2000; i++) {
      l = ri(1, 12); w = ri(1, 12); h = ri(1, 12); s1 = (l + w) ** 2 + h * h; s2 = (l + h) ** 2 + w * w; s3 = (w + h) ** 2 + l * l; m = Math.min(s1, s2, s3);
      if (isSq(m) && [s1, s2, s3].filter(v => v === m).length === 1 && (L > 1 || m <= 200)) break;
    }
    if (!isSq(m)) { l = 1; w = 2; h = 4; s1 = 9 + 16; s2 = 25 + 4; s3 = 36 + 1; m = 25; }
    return Q('m8-s1-box', `一个长方体盒子，长 ${l}、宽 ${w}、高 ${h}（单位：厘米）。一只蚂蚁从一个顶点沿表面爬到相对的顶点，最短路线长多少厘米？`, Math.sqrt(m),
      ['把盒子的表面展开成平面，两点之间线段最短，有三种展开方式', `(${l}+${w})² + ${h}² = ${s1}；(${l}+${h})² + ${w}² = ${s2}；(${w}+${h})² + ${l}² = ${s3}`, `取最小的 ${m}，最短路线 = √${m} = ${Math.sqrt(m)}（厘米）`]); } },
];

// ---------- 二、实数 ----------
const S2 = [
  { id: 'sqrt', name: '算术平方根', gen: (L) => {
    if (L === 1) { const n = ri(2, 20); return Q('m8-s2-sqrt', `${n * n} 的算术平方根是多少？`, n, [`因为 ${n}² = ${n * n}，且 ${n} 是正数`, `${n * n} 的算术平方根是 ${n}`]); }
    if (L === 2) { const n = ri(1, 9); return QD('m8-s2-sqrt', `${D(n * n, 2)} 的算术平方根是多少？`, D(n, 1), [`因为 ${D(n, 1)}² = ${D(n * n, 2)}`, `${D(n * n, 2)} 的算术平方根是 ${D(n, 1)}`]); }
    const p = ri(1, 9), q = ri(p + 1, 12); if (gcd(p, q) !== 1) return S2[0].gen(3);
    return QD('m8-s2-sqrt', `${p * p}/${q * q} 的算术平方根是多少？（填分数）`, `${p}/${q}`, [`因为 (${p}/${q})² = ${p * p}/${q * q}`, `${p * p}/${q * q} 的算术平方根是 ${p}/${q}`]); } },
  { id: 'sqrtmc', name: '平方根与算术平方根', gen: (L) => {
    const n = ri(2, 15);
    if (L === 1 || Math.random() < 0.5) return MC('m8-s2-sqrtmc', `${n * n} 的平方根是哪一个？`, `±${n}`, [`${n}`, `${M}${n}`, `±${n * n}`], [`一个正数有两个平方根，它们互为相反数`, `${n}² = ${n * n}，(${M}${n})² = ${n * n}`, `所以 ${n * n} 的平方根是 ±${n}`]);
    const m = ri(2, 4); return MC('m8-s2-sqrtmc', `√${m ** 4} 的平方根是哪一个？`, `±${m}`, [`${m * m}`, `±${m * m}`, `${m}`], [`先算 √${m ** 4} = ${m * m}`, `${m * m} 的平方根是 ±${m}`, '注意：题目问的是“算术平方根的平方根”，不要把两步混在一起']); } },
  { id: 'cbrt', name: '立方根', gen: (L) => {
    const n = ri(1, L === 1 ? 6 : 10);
    if (L === 1 || Math.random() < 0.4) return Q('m8-s2-cbrt', `${n ** 3} 的立方根是多少？`, n, [`因为 ${n}³ = ${n ** 3}`, `${n ** 3} 的立方根是 ${n}`]);
    if (L === 3 && Math.random() < 0.5) { const m = ri(1, 9); return QD('m8-s2-cbrt', `${D(m ** 3, 3)} 的立方根是多少？`, D(m, 1), [`因为 ${D(m, 1)}³ = ${D(m ** 3, 3)}`, `${D(m ** 3, 3)} 的立方根是 ${D(m, 1)}`]); }
    return MC('m8-s2-cbrt', `${M}${n ** 3} 的立方根是哪一个？`, `${M}${n}`, [`${n}`, `±${n}`, `${M}${n ** 3}`], [`立方根的符号与被开方数相同，负数有立方根`, `(${M}${n})³ = ${M}${n ** 3}`, `所以 ${M}${n ** 3} 的立方根是 ${M}${n}`]); } },
  { id: 'irr', name: '识别无理数', gen: (L) => {
    let ns = ri(2, 30); while (isSq(ns)) ns++;
    const cor = pick([`√${ns}`, 'π', `√${ns}`, `∛${[2, 3, 4, 5, 6, 7, 9][ri(0, 6)]}`]);
    const sq = ri(2, 11) ** 2, pool = [`√${sq}`, '3.14', '22/7', `${num(-ri(1, 9))}`, `0.${ri(1, 9)}${ri(1, 9)}`, `∛${ri(2, 4) ** 3}`, `${D(ri(11, 99), 1)}`, '0'];
    return MC('m8-s2-irr', '下列各数中，是无理数的是哪一个？', cor, shuf(pool), ['无理数是无限不循环小数', `${cor} 开不尽方（或是 π），是无限不循环小数，所以是无理数`, '其余选项都能化成整数、有限小数或分数，是有理数']); } },
  { id: 'est', name: '估算根式的大小', gen: (L) => {
    if (L === 3 && Math.random() < 0.5) { let n = ri(2, 120); while (Math.round(Math.cbrt(n)) ** 3 === n) n++; const a = Math.floor(Math.cbrt(n));
      return MC('m8-s2-est', `∛${n} 在哪两个相邻的整数之间？`, `${a} 和 ${a + 1}`, [`${a - 1} 和 ${a}`, `${a + 1} 和 ${a + 2}`, `${a + 2} 和 ${a + 3}`], [`${a}³ = ${a ** 3}，${(a + 1) ** 3} = ${(a + 1) ** 3}`, `${a ** 3} < ${n} < ${(a + 1) ** 3}，所以 ${a} < ∛${n} < ${a + 1}`]); }
    let n = ri(2, L === 1 ? 50 : 120); while (isSq(n)) n++; const a = Math.floor(Math.sqrt(n));
    return MC('m8-s2-est', `√${n} 在哪两个相邻的整数之间？`, `${a} 和 ${a + 1}`, [`${a - 1} 和 ${a}`, `${a + 1} 和 ${a + 2}`, `${a + 2} 和 ${a + 3}`], [`${a}² = ${a * a}，${a + 1}² = ${(a + 1) ** 2}`, `${a * a} < ${n} < ${(a + 1) ** 2}，所以 ${a} < √${n} < ${a + 1}`]); } },
  { id: 'cmp', name: '实数比较大小', gen: (L) => {
    const GT = '>', LT = '<', EQ = '=';
    const opts = (x, y, rel) => [`${x} ${rel} ${y}`, ...[GT, LT, EQ].filter(r => r !== rel).map(r => `${x} ${r} ${y}`)];
    if (L === 1) { let a = ri(2, 60); while (isSq(a)) a++; const b = ri(2, 8), rel = a > b * b ? GT : LT;
      return MC('m8-s2-cmp', `比较大小：√${a} 与 ${b}`, `√${a} ${rel} ${b}`, opts(`√${a}`, b, rel).slice(1), [`把 ${b} 写成 √${b * b}`, `比较被开方数：${a} 与 ${b * b}，${a} ${rel} ${b * b}`, `所以 √${a} ${rel} ${b}`]); }
    if (L === 2) { let a = ri(2, 100); while (Math.round(Math.cbrt(a)) ** 3 === a) a++; const b = ri(2, 5), rel = a > b ** 3 ? GT : LT;
      return MC('m8-s2-cmp', `比较大小：∛${a} 与 ${b}`, `∛${a} ${rel} ${b}`, opts(`∛${a}`, b, rel).slice(1), [`把 ${b} 写成 ∛${b ** 3}`, `比较被开方数：${a} 与 ${b ** 3}，${a} ${rel} ${b ** 3}`, `所以 ∛${a} ${rel} ${b}`]); }
    for (;;) { const p = ri(2, 4), q = pick([2, 3, 5]), r = ri(2, 4), s = pick([2, 3, 5, 6, 7]); const u = p * p * q, v = r * r * s; if (u === v || (p === r && q === s)) continue;
      const rel = u > v ? GT : LT, A = `${p}√${q}`, B = `${r}√${s}`;
      return MC('m8-s2-cmp', `比较大小：${A} 与 ${B}`, `${A} ${rel} ${B}`, opts(A, B, rel).slice(1), [`把系数移到根号里：${A} = √${u}，${B} = √${v}`, `比较被开方数：${u} 与 ${v}，${u} ${rel} ${v}`, `所以 ${A} ${rel} ${B}`]); } } },
  { id: 'real', name: '实数的混合运算', gen: (L) => {
    if (L === 1) { const a = ri(2, 12), b = ri(1, 5); return Q('m8-s2-real', `计算：√${a * a} + ∛${b ** 3}`, a + b, [`√${a * a} = ${a}，∛${b ** 3} = ${b}`, `${a} + ${b} = ${a + b}`]); }
    if (L === 2) { const a = ri(3, 12), b = ri(1, 4), c = ri(1, 6); return Q('m8-s2-real', `计算：√${a * a} − ∛(${M}${b ** 3}) + |${M}${c}|`, a + b + c, [`√${a * a} = ${a}，∛(${M}${b ** 3}) = ${M}${b}，|${M}${c}| = ${c}`, `${a} − (${M}${b}) + ${c} = ${a} + ${b} + ${c} = ${a + b + c}`]); }
    const a = ri(3, 9), b = ri(2, 4), n = ri(1, a * b); return Q('m8-s2-real', `计算：√${a * a} × ∛${b ** 3} − (√${n})²`, a * b - n, [`√${a * a} = ${a}，∛${b ** 3} = ${b}，(√${n})² = ${n}`, `${a} × ${b} − ${n} = ${a * b} − ${n} = ${a * b - n}`]); } },
  { id: 'rsimp', name: '二次根式的化简', gen: (L) => {
    const k = ri(2, L === 1 ? 4 : 7), m = pick([2, 3, 5, 6, 7]), n = k * k * m;
    return MC('m8-s2-rsimp', `化简：√${n}`, `${k}√${m}`, [`${m}√${k}`, `${k * k}√${m}`, `${k}√${n}`, `${m}√${m}`], [`把 ${n} 分解出平方因数：${n} = ${k * k} × ${m}`, `√${n} = √${k * k} × √${m} = ${k}√${m}`]); } },
  { id: 'rmul', name: '二次根式的乘除', gen: (L) => {
    const s = pick([2, 3, 5, 6, 7]);
    if (L === 1 || Math.random() < 0.5) { const x = ri(1, 3), y = ri(1, L === 1 ? 3 : 4), a = s * x * x, b = s * y * y;
      return Q('m8-s2-rmul', `计算：√${a} × √${b}`, s * x * y, [`√a × √b = √(ab)，ab = ${a} × ${b} = ${a * b}`, `√${a * b} = ${s * x * y}`]); }
    const k = ri(2, 6); return Q('m8-s2-rmul', `计算：√${s * k * k} ÷ √${s}`, k, [`√a ÷ √b = √(a ÷ b)`, `${s * k * k} ÷ ${s} = ${k * k}`, `√${k * k} = ${k}`]); } },
  { id: 'radadd', name: '二次根式的加减', gen: (L) => {
    const m = pick([2, 3, 5, 6, 7]), p = ri(2, 6), q = ri(1, 6), sub = L > 1 && p > q && Math.random() < 0.5, r = sub ? p - q : p + q;
    return MC('m8-s2-radadd', `化简：${p}√${m} ${sub ? '−' : '+'} ${q}√${m}`, `${r}√${m}`, [`${r}√${2 * m}`, `${sub ? p + q : p * q}√${m}`, `${r}${m}`, `${p * q}√${m * m}`], [`√${m} 是同类二次根式，只合并系数，根号部分不变`, `${p} ${sub ? '−' : '+'} ${q} = ${r}`, `结果是 ${r}√${m}`]); } },
];

// ---------- 三、位置与坐标 ----------
const nzr = (a, b) => { let v = 0; while (!v) v = ri(a, b); return v; };
const QN = ['第一象限', '第二象限', '第三象限', '第四象限'];
const quadOf = (x, y) => (x > 0 && y > 0 ? 0 : x < 0 && y > 0 ? 1 : x < 0 && y < 0 ? 2 : 3);
const S3 = [
  { id: 'dist', name: '点到坐标轴的距离', gen: (L) => {
    const x = nzr(-9, 9), y = nzr(-9, 9), f = ri(0, 1);
    return Q('m8-s3-dist', `点 P${pt(x, y)} 到 ${f ? 'y' : 'x'} 轴的距离是多少？`, Math.abs(f ? x : y), [f ? '点到 y 轴的距离是横坐标的绝对值' : '点到 x 轴的距离是纵坐标的绝对值', `|${num(f ? x : y)}| = ${Math.abs(f ? x : y)}`]); } },
  { id: 'quad', name: '点所在的象限', gen: (L) => {
    if (L < 3) { const x = nzr(-9, 9), y = nzr(-9, 9), q = quadOf(x, y);
      return MC('m8-s3-quad', `点 P${pt(x, y)} 在第几象限？`, QN[q], QN.filter((_, i) => i !== q), [`横坐标 ${num(x)} ${x > 0 ? '> 0' : '< 0'}，纵坐标 ${num(y)} ${y > 0 ? '> 0' : '< 0'}`, `横坐标${x > 0 ? '正' : '负'}、纵坐标${y > 0 ? '正' : '负'}的点在${QN[q]}`], 3); }
    const sx = pick([1, -1]), sy = pick([1, -1]), tx = pick([1, -1]), ty = pick([1, -1]), q = quadOf(sx * tx, sy * ty), qn = QN[quadOf(sx, sy)], nm = (s, v) => (s * (v === 'm' ? 1 : 1) < 0 ? `−${v}` : v);
    return MC('m8-s3-quad', `已知点 P(m, n) 在${qn}，则点 Q(${tx < 0 ? '−m' : 'm'}, ${ty < 0 ? '−n' : 'n'}) 在第几象限？`, QN[q], QN.filter((_, i) => i !== q),
      [`P 在${qn}：m ${sx > 0 ? '> 0' : '< 0'}，n ${sy > 0 ? '> 0' : '< 0'}`, `Q 的横坐标 ${tx < 0 ? '−m' : 'm'} ${sx * tx > 0 ? '> 0' : '< 0'}，纵坐标 ${ty < 0 ? '−n' : 'n'} ${sy * ty > 0 ? '> 0' : '< 0'}`, `所以 Q 在${QN[q]}`], 3); } },
  { id: 'sym', name: '关于坐标轴、原点对称的点', gen: (L) => {
    const a = nzr(-9, 9); let b = nzr(-9, 9); while (Math.abs(b) === Math.abs(a)) b = nzr(-9, 9);
    const f = ri(0, 2), name = ['x 轴', 'y 轴', '原点'][f], ans = [pt(a, -b), pt(-a, b), pt(-a, -b)][f];
    return MC('m8-s3-sym', `点 A${pt(a, b)} 关于${name}对称的点的坐标是？`, ans, [pt(a, -b), pt(-a, b), pt(-a, -b), pt(b, a)].filter(w => w !== ans), [['关于 x 轴对称：横坐标不变，纵坐标变成相反数', '关于 y 轴对称：纵坐标不变，横坐标变成相反数', '关于原点对称：横、纵坐标都变成相反数'][f], `A${pt(a, b)} 的对称点是 ${ans}`]); } },
  { id: 'shift', name: '图形平移后的坐标', gen: (L) => {
    const x = ri(-6, 6), y = ri(-6, 6), m = ri(1, 6), n = ri(1, 6), h = pick(['右', '左']), v = pick(['上', '下']), dx = h === '右' ? m : -m, dy = v === '上' ? n : -n;
    if (L === 1) { const ans = pt(x + dx, y); return MC('m8-s3-shift', `点 A${pt(x, y)} 向${h}平移 ${m} 个单位长度后的坐标是？`, ans, [pt(x - dx, y), pt(x, y + dx), pt(x, y - dx)], [`向${h}平移，横坐标${h === '右' ? '加' : '减'} ${m}，纵坐标不变`, `${pt(x, y)} → ${ans}`]); }
    const ans = pt(x + dx, y + dy); return MC('m8-s3-shift', `点 A${pt(x, y)} 先向${h}平移 ${m} 个单位长度，再向${v}平移 ${n} 个单位长度，得到的点的坐标是？`, ans, [pt(x - dx, y + dy), pt(x + dx, y - dy), pt(x - dx, y - dy), pt(x + dy, y + dx)],
      [`向${h}平移 ${m}：横坐标${h === '右' ? '加' : '减'} ${m}，得 ${num(x + dx)}`, `向${v}平移 ${n}：纵坐标${v === '上' ? '加' : '减'} ${n}，得 ${num(y + dy)}`, `坐标是 ${ans}`]); } },
  { id: 'dis2', name: '两点间的距离', gen: (L) => {
    const f = L === 1 ? 0 : ri(0, 2);
    if (f < 2) { const x1 = ri(-8, 8); let x2 = ri(-8, 8); while (x2 === x1) x2 = ri(-8, 8); const y = ri(-8, 8), hor = f === 0;
      return Q('m8-s3-dis2', hor ? `点 A${pt(x1, y)} 和点 B${pt(x2, y)} 之间的距离是多少？` : `点 A${pt(y, x1)} 和点 B${pt(y, x2)} 之间的距离是多少？`, Math.abs(x1 - x2), [hor ? '两点纵坐标相同，AB 平行于 x 轴，距离 = 横坐标差的绝对值' : '两点横坐标相同，AB 平行于 y 轴，距离 = 纵坐标差的绝对值', `|${num(x1)} − ${pn(x2)}| = ${Math.abs(x1 - x2)}`]); }
    const k = ri(1, 4), x = ri(-6, 3), y = ri(-6, 3), sx = pick([1, -1]), sy = pick([1, -1]);
    return Q('m8-s3-dis2', `点 A${pt(x, y)} 和点 B${pt(x + sx * 3 * k, y + sy * 4 * k)} 之间的距离是多少？`, 5 * k, [`横坐标相差 ${3 * k}，纵坐标相差 ${4 * k}`, `距离 = √(${3 * k}² + ${4 * k}²) = √${25 * k * k} = ${5 * k}`]); } },
  { id: 'tarea', name: '坐标系中图形的面积', gen: (L) => {
    if (L === 1 || Math.random() < 0.4) { const a = ri(-6, 0), b = a + ri(2, 8), c = ri(-6, 0), d = c + ri(2, 7);
      return Q('m8-s3-tarea', `长方形 ABCD 的四个顶点是 A${pt(a, c)}、B${pt(b, c)}、C${pt(b, d)}、D${pt(a, d)}，它的面积是多少？`, (b - a) * (d - c), [`长 = ${num(b)} − ${pn(a)} = ${b - a}，宽 = ${num(d)} − ${pn(c)} = ${d - c}`, `面积 = ${b - a} × ${d - c} = ${(b - a) * (d - c)}`]); }
    const a = ri(-6, 0), b = a + ri(2, 9), c = ri(-6, 6), h = ri(2, 8), y0 = ri(-5, 0), v = (b - a) * h;
    return QD('m8-s3-tarea', `在平面直角坐标系中，△ABC 的顶点是 A${pt(a, y0)}、B${pt(b, y0)}、C${pt(c, y0 + h)}，它的面积是多少？`, D(v * 5, 1), [`AB 平行于 x 轴，AB = ${b} − ${pn(a)} = ${b - a}`, `点 C 到 AB 的距离（高）= ${num(y0 + h)} − ${pn(y0)} = ${h}`, `面积 = ${b - a} × ${h} ÷ 2 = ${D(v * 5, 1)}`]); } },
  { id: 'onaxis', name: '点在坐标轴上求参数', gen: (L) => {
    if (L === 1 || Math.random() < 0.5) { const q = ri(2, 4), m0 = ri(2, 9), r = q * m0, p = ri(1, 9);
      return Q('m8-s3-onaxis', `点 P(m ${p > 0 ? '+' : '−'} ${p}, ${q}m − ${r}) 在 x 轴上，则 m 的值是多少？`.replace('m + ', 'm + ').replace('−', '−'), m0, ['点在 x 轴上，纵坐标为 0', `${q}m − ${r} = 0，${q}m = ${r}`, `m = ${r} ÷ ${q} = ${m0}`]); }
    const p = ri(2, 9), q = ri(2, 5), r = ri(1, 9); return Q('m8-s3-onaxis', `点 P(m − ${p}, ${q}m + ${r}) 在 y 轴上，则 m 的值是多少？`, p, ['点在 y 轴上，横坐标为 0', `m − ${p} = 0`, `m = ${p}`]); } },
];

// ---------- 四、一次函数 ----------
const S4 = [
  { id: 'eval', name: '求函数值', gen: (L) => {
    for (;;) { const k = L === 1 ? ri(2, 5) : pick([-1, 1, 2, 3, 4, 5, -2, -3]), b = ri(-5, 9), x = ri(1, 8), y = k * x + b; if (y <= 0) continue;
      return Q('m8-s4-eval', `已知一次函数 ${lin(k, b)}，当 x = ${x} 时，y 的值是多少？`, y, ['把 x 的值代入解析式', `y = ${num(k)} × ${x} ${b < 0 ? '− ' + (-b) : '+ ' + b} = ${y}`]); } } },
  { id: 'inv', name: '已知函数值求自变量', gen: (L) => {
    const k = ri(2, 6), b = ri(-5, 9), x = ri(1, 9), y = k * x + b; if (y <= 0) return S4[1].gen(L);
    return Q('m8-s4-inv', `一次函数 ${lin(k, b)} 中，当 y = ${y} 时，x 的值是多少？`, x, ['把 y 的值代入解析式，解方程', `${k}x ${b < 0 ? '− ' + (-b) : '+ ' + b} = ${y}`, `${k}x = ${y - b}，x = ${x}`]); } },
  { id: 'prop', name: '正比例函数求比例系数', gen: (L) => {
    const k = ri(2, 9), a = ri(2, 8);
    if (L === 1 || Math.random() < 0.5) return Q('m8-s4-prop', `正比例函数 y = kx 的图象经过点 (${a}, ${k * a})，k 的值是多少？`, k, ['把点的坐标代入 y = kx', `${k * a} = k × ${a}`, `k = ${k * a} ÷ ${a} = ${k}`]);
    return Q('m8-s4-prop', `已知 y 与 x 成正比例，当 x = ${a} 时，y = ${k * a}。当 x = ${a + 3} 时，y 的值是多少？`, k * (a + 3), [`设 y = kx，把 x = ${a}，y = ${k * a} 代入，得 k = ${k}`, `y = ${k}x，当 x = ${a + 3} 时，y = ${k} × ${a + 3} = ${k * (a + 3)}`]); } },
  { id: 'tdc', name: '待定系数法求解析式', gen: (L) => {
    let k, b; do { k = L === 1 ? ri(1, 5) : nzr(-5, 5); b = nzr(-6, 8); } while (Math.abs(k) === Math.abs(b));
    const x2 = ri(2, 4), y1 = k + b, y2 = k * x2 + b;
    return MC('m8-s4-tdc', `一次函数 y = kx + b 的图象经过点 (1, ${num(y1)}) 和点 (${x2}, ${num(y2)})，它的解析式是？`, lin(k, b), [lin(-k, b), lin(k, -b), lin(b, k), lin(k, y1)],
      ['设解析式为 y = kx + b，把两点的坐标代入', `${num(y1)} = k + b，${num(y2)} = ${x2}k + b`, `两式相减，得 ${x2 - 1}k = ${num(y2 - y1)}，k = ${num(k)}，b = ${num(b)}`, `解析式是 ${lin(k, b)}`]); } },
  { id: 'xint', name: '与 x 轴的交点', gen: (L) => {
    const k = ri(2, 5), t = ri(1, 9); return Q('m8-s4-xint', `一次函数 ${lin(k, -k * t)} 的图象与 x 轴的交点的横坐标是多少？`, t, ['图象与 x 轴相交，纵坐标 y = 0', `${k}x − ${k * t} = 0`, `x = ${t}`]); } },
  { id: 'yint', name: '与 y 轴的交点', gen: (L) => {
    const k = nzr(-5, 5), b = nzr(-8, 9);
    return MC('m8-s4-yint', `一次函数 ${lin(k, b)} 的图象与 y 轴的交点坐标是？`, pt(0, b), [pt(b, 0), pt(0, k), pt(k, 0), pt(0, -b)], ['图象与 y 轴相交，横坐标 x = 0', `y = ${num(k)} × 0 ${b < 0 ? '− ' + (-b) : '+ ' + b} = ${num(b)}`, `交点坐标是 ${pt(0, b)}`]); } },
  { id: 'quad4', name: 'k、b 与图象经过的象限', gen: (L) => {
    const k = nzr(-5, 5), b = nzr(-6, 6), S = { '++': '一、二、三', '+-': '一、三、四', '-+': '一、二、四', '--': '二、三、四' }, key = (k > 0 ? '+' : '-') + (b > 0 ? '+' : '-'), ans = S[key];
    const stem = L === 1 ? `一次函数 y = kx + b 中，k ${k > 0 ? '>' : '<'} 0，b ${b > 0 ? '>' : '<'} 0，它的图象经过哪几个象限？` : `一次函数 ${lin(k, b)} 的图象经过哪几个象限？`;
    return MC('m8-s4-quad4', stem, ans, Object.values(S).filter(v => v !== ans), [`k ${k > 0 ? '> 0：图象从左到右上升' : '< 0：图象从左到右下降'}；b ${b > 0 ? '> 0：与 y 轴交于正半轴' : '< 0：与 y 轴交于负半轴'}`, `所以图象经过第${ans}象限`], 3); } },
  { id: 'incr', name: '增减性', gen: (L) => {
    const k = nzr(-6, 6), b = ri(-5, 9), ans = k > 0 ? '增大' : '减小';
    return MC('m8-s4-incr', `对于一次函数 ${lin(k, b)}，y 随 x 的增大而（ ）`, ans, ['增大', '减小', '不变', '先增大后减小'].filter(v => v !== ans), [`比例系数 k = ${num(k)}`, k > 0 ? 'k > 0 时，y 随 x 的增大而增大' : 'k < 0 时，y 随 x 的增大而减小'], 3); } },
  { id: 'par', name: '两直线平行', gen: (L) => {
    const k = ri(2, 9), b1 = nzr(-6, 8), b2 = nzr(-6, 8);
    if (L < 3) return Q('m8-s4-par', `若一次函数 ${lin(k, b1)} 与 y = mx ${b2 < 0 ? '− ' + (-b2) : '+ ' + b2} 的图象平行，则 m 的值是多少？`, k, ['两条直线平行，比例系数 k 相等', `m = ${k}`]);
    const c = ri(1, 4); return Q('m8-s4-par', `若一次函数 ${lin(k, b1)} 与 y = (m − ${c})x ${b2 < 0 ? '− ' + (-b2) : '+ ' + b2} 的图象平行，则 m 的值是多少？`, k + c, ['两条直线平行，比例系数 k 相等', `m − ${c} = ${k}`, `m = ${k + c}`]); } },
  { id: 'app1', name: '一次函数的实际应用', gen: (L) => {
    const f = ri(0, 2);
    if (f === 0) { const s = ri(8, 14), p = ri(2, 4), x = ri(5, 12);
      return Q('m8-s4-app1', `某市出租车起步价是 ${s} 元（3 千米以内），超过 3 千米的部分每千米 ${p} 元。小明乘车行驶 ${x} 千米，应付车费多少元？`, s + p * (x - 3), [`超出的路程：${x} − 3 = ${x - 3}（千米）`, `车费 = ${s} + ${p} × ${x - 3} = ${s + p * (x - 3)}（元）`]); }
    if (f === 1) { const l0 = ri(10, 20), k = ri(1, 4), m = ri(2, 9);
      return Q('m8-s4-app1', `一根弹簧原长 ${l0} 厘米，每挂 1 千克的物体，弹簧伸长 ${k} 厘米。挂 ${m} 千克的物体时，弹簧的长度是多少厘米？`, l0 + k * m, [`设挂重 x 千克时长度为 y 厘米，y = ${k}x + ${l0}`, `x = ${m} 时，y = ${k} × ${m} + ${l0} = ${l0 + k * m}`]); }
    const q = ri(20, 40), r = ri(2, 6), t = ri(2, 9);
    return Q('m8-s4-app1', `某水池有水 ${q} 立方米，现以每小时 ${r} 立方米的速度向池里注水。${t} 小时后，水池里共有水多少立方米？`, q + r * t, [`y = ${r}x + ${q}（x 为时间，y 为水量）`, `x = ${t} 时，y = ${r} × ${t} + ${q} = ${q + r * t}`]); } },
  { id: 'app2', name: '方案选择', gen: (L) => {
    const x0 = ri(3, 12), d = ri(1, 4), b = ri(2, 6), a = b + d, c = d * x0;
    return Q('m8-s4-app2', `甲商店某种笔每支 ${a} 元；乙商店同样的笔每支 ${b} 元，但要先交 ${c} 元的会员费。买多少支笔时，两家商店的总费用相同？`, x0, [`设买 x 支，甲店费用 y₁ = ${a}x，乙店费用 y₂ = ${b}x + ${c}`, `费用相同：${a}x = ${b}x + ${c}`, `${d}x = ${c}，x = ${x0}`]); } },
  { id: 'app3', name: '行程中的一次函数', gen: (L) => {
    const s0 = ri(2, 10), v = ri(2, 6), t = ri(2, 8), S = s0 + v * t;
    return Q('m8-s4-app3', `小明从离家 ${s0} 千米的地方出发，以每小时 ${v} 千米的速度匀速骑车远离家。骑了多少小时后，他离家 ${S} 千米？`, t, [`设骑了 x 小时，离家 y 千米，y = ${v}x + ${s0}`, `y = ${S} 时，${v}x + ${s0} = ${S}`, `${v}x = ${S - s0}，x = ${t}`]); } },
];

// ---------- 五、二元一次方程组 ----------
const eq = (a, b, c) => `${a === 1 ? '' : a === -1 ? M : num(a)}x ${b < 0 ? '− ' : '+ '}${Math.abs(b) === 1 ? '' : Math.abs(b)}y = ${num(c)}`;
const S5 = [
  { id: 'sol', name: '方程的解', gen: (L) => {
    const a = ri(1, 4), b = ri(1, 4), x0 = ri(1, 8), y0 = ri(1, 8), c = a * x0 + b * y0, fmt = (x, y) => `x = ${x}，y = ${y}`, ws = [];
    [[y0, x0], [x0 + 1, y0], [x0, y0 + 1], [x0 + 2, y0 - 1], [x0 - 1, y0 + 1], [x0 + 1, y0 + 1]].forEach(([x, y]) => { if (x > 0 && y > 0 && a * x + b * y !== c) ws.push(fmt(x, y)); });
    return MC('m8-s5-sol', `下列哪一组 x、y 的值是二元一次方程 ${eq(a, b, c)} 的解？`, fmt(x0, y0), ws, ['把各组值代入方程，看左边是否等于右边', `${a} × ${x0} + ${b} × ${y0} = ${c}，等于右边`, '其余各组代入后左边都不等于右边']); } },
  { id: 'sub', name: '代入消元法', gen: (L) => {
    for (;;) { const x0 = ri(1, 9), y0 = ri(1, 9), k = ri(1, 3), m = y0 - k * x0, a = ri(1, 4), b = ri(1, 3), c = a * x0 + b * y0, f = ri(0, 2);
      const target = f === 0 ? ['x', x0] : f === 1 ? ['y', y0] : ['x + y', x0 + y0];
      return Q('m8-s5-sub', `解方程组 { y = ${k === 1 ? '' : k}x ${m < 0 ? '− ' + (-m) : m > 0 ? '+ ' + m : ''}，${eq(a, b, c)}。求 ${target[0]} 的值。`.replace('{ ', '').replace('，', '； '), target[1],
        [`把 y = ${k === 1 ? '' : k}x ${m < 0 ? '− ' + (-m) : m > 0 ? '+ ' + m : ''} 代入第二个方程，消去 y`, `解得 x = ${x0}`, `代回求得 y = ${y0}`, `${target[0]} = ${target[1]}`]); } } },
  { id: 'add', name: '加减消元法', gen: (L) => {
    for (;;) { const x0 = ri(1, 9), y0 = ri(1, 9), a1 = ri(1, 4), b1 = ri(1, 4), a2 = L === 1 ? a1 : ri(1, 4), b2 = L === 1 ? -b1 : pick([-1, 1]) * ri(1, 4); if (a1 * b2 - a2 * b1 === 0) continue;
      const c1 = a1 * x0 + b1 * y0, c2 = a2 * x0 + b2 * y0, askX = Math.random() < 0.5;
      return Q('m8-s5-add', `解方程组：${eq(a1, b1, c1)}； ${eq(a2, b2, c2)}。求 ${askX ? 'x' : 'y'} 的值。`, askX ? x0 : y0, ['用加减消元法：先把某个未知数的系数化成相同或相反，再把两个方程相加或相减', `消去一个未知数后解得 x = ${x0}`, `代入求得 y = ${y0}`, `${askX ? 'x' : 'y'} = ${askX ? x0 : y0}`]); } } },
  { id: 'sumxy', name: '整体求 x+y、x−y', gen: (L) => {
    for (;;) { const a = ri(1, 4), b = ri(1, 4); if (a === b) continue; let x0 = ri(1, 9), y0 = ri(1, 9); const sum = Math.random() < 0.6; if (!sum && x0 <= y0) [x0, y0] = [y0 + 1, x0];
      const c1 = a * x0 + b * y0, c2 = b * x0 + a * y0;
      return Q('m8-s5-sumxy', `已知 ${eq(a, b, c1)}，${eq(b, a, c2)}，求 ${sum ? 'x + y' : 'x − y'} 的值。`, sum ? x0 + y0 : x0 - y0,
        sum ? ['两个方程相加', `${a + b}x + ${a + b}y = ${c1 + c2}`, `x + y = ${c1 + c2} ÷ ${a + b} = ${x0 + y0}`] : ['两个方程相减（第一个减第二个）', `${a - b}x + ${b - a}y = ${c1 - c2}，即 ${a - b}(x − y) = ${c1 - c2}`, `x − y = ${c1 - c2} ÷ ${a - b} = ${x0 - y0}`]); } } },
  { id: 'same', name: '已知方程组的解求参数', gen: (L) => {
    const x0 = ri(2, 6), y0 = ri(1, 6), m = ri(2, 6), n = ri(1, 4), c1 = m * x0 + y0, c2 = x0 - n * y0;
    if (L === 1) return Q('m8-s5-same', `已知 x = ${x0}，y = ${y0} 是方程 mx + y = ${c1} 的解，则 m 的值是多少？`, m, ['把 x、y 的值代入方程', `${x0}m + ${y0} = ${c1}`, `m = ${m}`]);
    return Q('m8-s5-same', `已知 x = ${x0}，y = ${y0} 是方程组 mx + y = ${c1}，x − ny = ${num(c2)} 的解，则 m + n 的值是多少？`, m + n, ['把 x、y 的值分别代入两个方程', `${x0}m + ${y0} = ${c1}，得 m = ${m}`, `${x0} − ${y0}n = ${num(c2)}，得 n = ${n}`, `m + n = ${m + n}`]); } },
  { id: 'chick', name: '鸡兔同笼类应用题', gen: (L) => {
    const x = ri(3, 20), y = ri(3, 20);
    if (Math.random() < 0.6) return Q('m8-s5-chick', `笼子里有鸡和兔共 ${x + y} 只，它们的脚一共有 ${2 * x + 4 * y} 只。鸡有多少只？`, x, [`设鸡 x 只，兔 y 只：x + y = ${x + y}，2x + 4y = ${2 * x + 4 * y}`, `第二个方程除以 2：x + 2y = ${x + 2 * y}`, `两式相减：y = ${y}，所以 x = ${x}`]);
    return Q('m8-s5-chick', `停车场里有自行车和三轮车共 ${x + y} 辆，车轮一共 ${2 * x + 3 * y} 个。三轮车有多少辆？`, y, [`设自行车 x 辆，三轮车 y 辆：x + y = ${x + y}，2x + 3y = ${2 * x + 3 * y}`, `第一个方程乘 2：2x + 2y = ${2 * x + 2 * y}`, `两式相减：y = ${y}`]); } },
  { id: 'price', name: '购买问题', gen: (L) => {
    for (;;) { const p = ri(2, 9), q = ri(2, 9), a1 = ri(1, 4), b1 = ri(1, 4), a2 = ri(1, 4), b2 = ri(1, 4); if (a1 * b2 === a2 * b1) continue;
      const c1 = a1 * p + b1 * q, c2 = a2 * p + b2 * q, askP = Math.random() < 0.5;
      return Q('m8-s5-price', `买 ${a1} 支钢笔和 ${b1} 本笔记本共 ${c1} 元，买 ${a2} 支钢笔和 ${b2} 本笔记本共 ${c2} 元。${askP ? '每支钢笔' : '每本笔记本'}多少元？`, askP ? p : q,
        [`设每支钢笔 x 元，每本笔记本 y 元：${a1}x + ${b1}y = ${c1}，${a2}x + ${b2}y = ${c2}`, `解方程组得 x = ${p}，y = ${q}`, `${askP ? '每支钢笔' : '每本笔记本'} ${askP ? p : q} 元`]); } } },
  { id: 'flow', name: '行程问题（顺水逆水）', gen: (L) => {
    const w = ri(1, 4), v = w + ri(2, 8), k = ri(1, 2), d = (v + w) * (v - w) * k, t1 = (v - w) * k, t2 = (v + w) * k;
    return Q('m8-s5-flow', `一艘船在静水中的速度是每小时 x 千米，水流速度是每小时 y 千米。船顺水航行 ${d} 千米用了 ${t1} 小时，逆水航行 ${d} 千米用了 ${t2} 小时。船在静水中的速度是每小时多少千米？`, v,
      [`顺水速度 = x + y = ${d} ÷ ${t1} = ${v + w}，逆水速度 = x − y = ${d} ÷ ${t2} = ${v - w}`, `两式相加：2x = ${2 * v}`, `x = ${v}（千米/时）`]); } },
  { id: 'inter', name: '两直线的交点', gen: (L) => {
    for (;;) { const x0 = ri(1, 8), y0 = ri(2, 12), a1 = ri(1, 4), a2 = pick([-3, -2, -1, 1, 2, 3, 4]); if (a1 === a2) continue; const b1 = y0 - a1 * x0, b2 = y0 - a2 * x0, askX = Math.random() < 0.5;
      return Q('m8-s5-inter', `一次函数 ${lin(a1, b1)} 与 ${lin(a2, b2)} 的图象相交，交点的${askX ? '横' : '纵'}坐标是多少？`, askX ? x0 : y0, ['交点同时在两条直线上，所以交点坐标是两个函数解析式组成的方程组的解', `${a1}x ${b1 < 0 ? '−' : '+'} ${Math.abs(b1)} = ${num(a2)}x ${b2 < 0 ? '−' : '+'} ${Math.abs(b2)}，解得 x = ${x0}`, `代入得 y = ${y0}`, `交点是 (${x0}, ${y0})`]); } } },
];

// ---------- 六、数据的分析 ----------
const sortedStr = (a) => a.join('、');
const S6 = [
  { id: 'mean', name: '平均数', gen: (L) => {
    const n = L === 1 ? 5 : pick([5, 6, 8]), m = ri(60, 95); for (;;) { const a = Array.from({ length: n - 1 }, () => m + ri(-12, 12)), last = n * m - a.reduce((s, v) => s + v, 0); if (last < 40 || last > 100) continue;
      const all = shuf([...a, last]); return Q('m8-s6-mean', `某同学 ${n} 次测验的成绩分别是：${all.join('、')}，平均成绩是多少分？`, m, [`总和 = ${all.join(' + ')} = ${n * m}`, `平均数 = ${n * m} ÷ ${n} = ${m}`]); } } },
  { id: 'wmean', name: '加权平均数', gen: (L) => {
    const a = ri(70, 98), b = ri(70, 98), c = ri(70, 98);
    if (L === 1 || Math.random() < 0.5) { const w1 = pick([6, 7, 8, 4, 3]), w2 = 10 - w1, v = a * w1 + b * w2; return QD('m8-s6-wmean', `应聘时，笔试成绩 ${a} 分，面试成绩 ${b} 分，笔试与面试的权重之比是 ${w1}:${w2}，综合成绩是多少分？`, D(v, 1), [`加权平均数 = (${a} × ${w1} + ${b} × ${w2}) ÷ ${w1 + w2}`, `= ${v} ÷ 10 = ${D(v, 1)}`]); }
    const v = a * 3 + b * 3 + c * 4; return QD('m8-s6-wmean', `某同学平时成绩 ${a} 分，期中成绩 ${b} 分，期末成绩 ${c} 分，按 3:3:4 的权重计算，学期成绩是多少分？`, D(v, 1), [`加权平均数 = (${a} × 3 + ${b} × 3 + ${c} × 4) ÷ 10`, `= ${v} ÷ 10 = ${D(v, 1)}`]); } },
  { id: 'median', name: '中位数', gen: (L) => {
    const n = L === 1 ? 5 : pick([5, 6, 7, 8]), a = Array.from({ length: n }, () => ri(10, 99)), s = a.slice().sort((x, y) => x - y), shown = shuf(a).join('、');
    if (n % 2) return Q('m8-s6-median', `一组数据：${shown}，它的中位数是多少？`, s[(n - 1) / 2], [`先从小到大排列：${sortedStr(s)}`, `共 ${n} 个数，中间（第 ${(n + 1) / 2} 个）的数是 ${s[(n - 1) / 2]}`]);
    const x = s[n / 2 - 1], y = s[n / 2]; return QD('m8-s6-median', `一组数据：${shown}，它的中位数是多少？`, D((x + y) * 5, 1), [`先从小到大排列：${sortedStr(s)}`, `共 ${n} 个数，中间两个数是 ${x} 和 ${y}`, `中位数 = (${x} + ${y}) ÷ 2 = ${D((x + y) * 5, 1)}`]); } },
  { id: 'mode', name: '众数', gen: (L) => {
    const n = ri(8, 10), m = ri(5, 40), a = [m, m, m]; const pool = shuf(Array.from({ length: 30 }, (_, i) => i + 41)); const cnt = {};
    while (a.length < n) { const v = pool[ri(0, 14)]; if ((cnt[v] || 0) < 2) { cnt[v] = (cnt[v] || 0) + 1; a.push(v); } }
    return Q('m8-s6-mode', `一组数据：${shuf(a).join('、')}，它的众数是多少？`, m, ['众数是一组数据中出现次数最多的数', `${m} 出现了 3 次，其他数最多出现 2 次`, `众数是 ${m}`]); } },
  { id: 'var', name: '方差', gen: (L) => {
    const n = L === 1 ? 5 : pick([4, 5]), m = ri(8, 30); for (;;) { const d = Array.from({ length: n - 1 }, () => ri(-4, 4)), last = -d.reduce((s, v) => s + v, 0); if (Math.abs(last) > 5) continue;
      const dev = [...d, last], data = dev.map(v => m + v), S = dev.reduce((s, v) => s + v * v, 0); if (S === 0) continue; const val = n === 5 ? D(S * 2, 1) : D(S * 25, 2);
      return QD('m8-s6-var', `一组数据：${shuf(data).join('、')}，它的方差是多少？`, val, [`平均数 = ${data.reduce((s, v) => s + v, 0)} ÷ ${n} = ${m}`, `各数与平均数的差的平方：${dev.map(v => v * v).join('、')}，和为 ${S}`, `方差 = ${S} ÷ ${n} = ${val}`]); } } },
  { id: 'stable', name: '用方差判断稳定性', gen: (L) => {
    let x = ri(2, 30), y = ri(2, 30); while (x === y) y = ri(2, 30); const A = D(x, 1), B = D(y, 1), ans = x < y ? '甲' : '乙';
    return MC('m8-s6-stable', `甲、乙两名同学几次测验的平均分相同，方差分别是 s甲² = ${A}，s乙² = ${B}，成绩更稳定的是哪位同学？`, ans, ['甲', '乙', '一样稳定', '无法判断'].filter(v => v !== ans), ['方差越小，数据的波动越小，越稳定', `${A} ${x < y ? '<' : '>'} ${B}，所以${ans}更稳定`], 3); } },
  { id: 'est', name: '用样本估计总体', gen: (L) => {
    const n = pick([20, 50, 100]), bad = ri(1, 5), T = n === 20 ? 200 * ri(2, 10) : n === 50 ? 500 * ri(2, 10) : 1000 * ri(2, 8), ans = T / n * bad;
    return Q('m8-s6-est', `某工厂从一批产品中随机抽取 ${n} 件检查，发现有 ${bad} 件不合格。这批产品共 ${T} 件，估计其中大约有多少件不合格？`, ans, [`样本中不合格的比例：${bad} ÷ ${n}`, `估计总体：${T} × ${bad} ÷ ${n} = ${ans}（件）`]); } },
  { id: 'shift', name: '数据变化后的统计量', gen: (L) => {
    const f = ri(0, 3), a = ri(5, 40), m = ri(2, 9), k = ri(2, 4);
    if (f === 0) return Q('m8-s6-shift', `一组数据的平均数是 ${a}，把每个数据都加上 ${m}，新数据的平均数是多少？`, a + m, ['每个数据都加上同一个数，平均数也加上这个数', `${a} + ${m} = ${a + m}`]);
    if (f === 1) return Q('m8-s6-shift', `一组数据的平均数是 ${a}，把每个数据都乘以 ${k}，新数据的平均数是多少？`, a * k, ['每个数据都乘以同一个数，平均数也乘以这个数', `${a} × ${k} = ${a * k}`]);
    const s2 = ri(2, 20); if (f === 2) return QD('m8-s6-shift', `一组数据的方差是 ${D(s2, 1)}，把每个数据都加上 ${m}，新数据的方差是多少？`, D(s2, 1), ['每个数据都加上同一个数，波动大小不变，方差不变', `方差仍是 ${D(s2, 1)}`]);
    return QD('m8-s6-shift', `一组数据的方差是 ${D(s2, 1)}，把每个数据都乘以 ${k}，新数据的方差是多少？`, D(s2 * k * k, 1), [`每个数据乘以 ${k}，方差乘以 ${k}² = ${k * k}`, `${D(s2, 1)} × ${k * k} = ${D(s2 * k * k, 1)}`]); } },
  { id: 'concept', name: '统计量的意义', gen: (L) => {
    const Z = ['众数', '中位数', '平均数', '方差'], items = [
      ['一组数据中出现次数最多的数据叫做这组数据的什么？', '众数', ['中位数', '平均数', '方差'], '一组数据中出现次数最多的数据叫众数'],
      ['把一组数据按大小顺序排列，处在最中间位置的数（或最中间两个数的平均数）叫做什么？', '中位数', ['众数', '平均数', '方差'], '按大小排列后处在中间位置的数叫中位数'],
      ['下列统计量中，反映一组数据波动大小的是哪一个？', '方差', ['众数', '中位数', '平均数'], '方差反映数据的波动大小，方差越小越稳定'],
      ['下列统计量中，不能反映一组数据集中趋势的是哪一个？', '方差', ['众数', '中位数', '平均数'], '平均数、中位数、众数反映集中趋势，方差反映波动大小'],
      ['鞋店进货时，决定每种尺码鞋进多少，最应参考这批顾客鞋码的哪个统计量？', '众数', ['平均数', '中位数', '方差'], '销量最大的尺码是众数，进货应多进众数尺码'],
      ['一组数据的方差越小，说明这组数据（ ）', '越稳定', ['越不稳定', '越大', '与稳定性无关'], '方差越小，波动越小，数据越稳定'],
    ], it = pick(items);
    return MC('m8-s6-concept', it[0], it[1], it[2], [it[3]], 3); } },
];

// ---------- 七、证明 ----------
const TRUE_P = [['对顶角相等', '对顶角相等，这是定理'], ['两直线平行，同位角相等', '平行线的性质：两直线平行，同位角相等'], ['三角形的内角和等于 180°', '三角形内角和定理'], ['等角的补角相等', '等角的补角相等，这是补角的性质'], ['内错角相等，两直线平行', '平行线的判定定理之一'],
  ['直角三角形的两个锐角互余', '直角三角形两锐角之和 = 180° − 90° = 90°'], ['三角形的一个外角等于与它不相邻的两个内角的和', '三角形的外角性质'], ['平行于同一条直线的两条直线平行', '平行线的传递性'], ['同旁内角互补，两直线平行', '平行线的判定定理之一'], ['如果两个角都是直角，那么这两个角相等', '直角都等于 90°，所以相等']];
const FALSE_P = [['相等的角是对顶角', '反例：两个直角相等，但不一定是对顶角'], ['同旁内角相等，两直线平行', '平行线的判定是“同旁内角互补”，不是相等'], ['内错角相等', '只有两直线平行时内错角才相等，没有“平行”这个条件不成立'], ['如果 a² = b²，那么 a = b', '反例：(−2)² = 2²，但 −2 ≠ 2'], ['如果 ab > 0，那么 a > 0，b > 0', '反例：a = −1，b = −2 时 ab > 0，但 a、b 都是负数'],
  ['三角形的一个外角大于任何一个内角', '外角大于与它不相邻的内角，但不一定大于与它相邻的内角'], ['两条直线被第三条直线所截，同位角相等', '只有两条直线平行时，同位角才相等'], ['互补的两个角一定是邻补角', '反例：60° 和 120° 的两个角可以不相邻，它们互补但不是邻补角'], ['一个角的补角一定大于这个角', '反例：120° 的补角是 60°，比它小'], ['两个锐角的和一定是钝角', '反例：20° + 30° = 50°，还是锐角']];
const CONV = [['两个角是对顶角', '这两个角相等', '两个角不是对顶角', '这两个角不相等'], ['两直线平行', '同位角相等', '两直线不平行', '同位角不相等'], ['两个角是直角', '这两个角相等', '两个角不是直角', '这两个角不相等'], ['一个三角形是直角三角形', '它的两个锐角互余', '一个三角形不是直角三角形', '它的两个角不互余'], ['两个数相等', '它们的绝对值相等', '两个数不相等', '它们的绝对值不相等']];
const S7 = [
  { id: 'comp', name: '余角与补角', gen: (L) => {
    if (Math.random() < 0.5) { const a = ri(10, 80); return Q('m8-s7-comp', `∠α = ${a}°，它的余角是多少度？`, 90 - a, ['余角：两个角的和是 90°', `90° − ${a}° = ${90 - a}°`]); }
    const a = ri(20, 170); return Q('m8-s7-comp', `∠α = ${a}°，它的补角是多少度？`, 180 - a, ['补角：两个角的和是 180°', `180° − ${a}° = ${180 - a}°`]); } },
  { id: 'vert', name: '对顶角与邻补角', gen: (L) => {
    const f = L === 1 ? 0 : ri(0, 2);
    if (f === 0) { const [p, q] = pick([[1, 2], [1, 5], [2, 3], [1, 3], [1, 8], [4, 5], [1, 4]]), a = 180 * p / (p + q); return Q('m8-s7-vert', `∠1 与 ∠2 是邻补角，∠1 : ∠2 = ${p} : ${q}，∠1 是多少度？`, a, ['邻补角互补，∠1 + ∠2 = 180°', `∠1 = 180° × ${p} ÷ (${p} + ${q}) = ${a}°`]); }
    if (f === 1) { const x = ri(10, 40), a = ri(2, 3), c = a + ri(1, 2), b0 = ri(5, 40), d = (c - a) * x + b0; return Q('m8-s7-vert', `两条直线相交，∠1 = (${a}x + ${b0})°，它的对顶角 ∠2 = (${c}x + ${d - c * x + a * x + b0 - b0 + 0 - 0})°。求 x 的值。`.replace(/\(\d+x \+ -?\d+\)°。求/, '(' + c + 'x + ' + (a * x + b0 - c * x) + ')°。求').replace(/\+ -(\d+)/, '− $1'), x, ['对顶角相等，列方程', '解方程求 x']); }
    const a = 2 * ri(15, 80); return Q('m8-s7-vert', `两条直线相交，对顶角 ∠1 与 ∠3 的和是 ${2 * a}°，那么与 ∠1 相邻的角 ∠2 是多少度？`, 180 - a, [`对顶角相等，∠1 = ∠3 = ${2 * a}° ÷ 2 = ${a}°`, `∠2 与 ∠1 是邻补角，∠2 = 180° − ${a}° = ${180 - a}°`]); } },
  { id: 'para', name: '平行线的性质求角', gen: (L) => {
    const t = ri(35, 85), f = L === 1 ? ri(0, 1) : ri(0, 2);
    if (f === 0) return Q('m8-s7-para', `直线 a ∥ b，直线 c 与 a、b 分别相交，∠1 与 ∠2 是同位角，∠1 = ${t}°，则 ∠2 是多少度？`, t, ['两直线平行，同位角相等', `∠2 = ∠1 = ${t}°`]);
    if (f === 1) return Q('m8-s7-para', `直线 a ∥ b，直线 c 与 a、b 分别相交，∠1 与 ∠2 是内错角，∠1 = ${t}°，则 ∠2 是多少度？`, t, ['两直线平行，内错角相等', `∠2 = ∠1 = ${t}°`]);
    return Q('m8-s7-para', `直线 a ∥ b，直线 c 与 a、b 分别相交，∠1 与 ∠2 是同旁内角，∠1 = ${t}°，则 ∠2 是多少度？`, 180 - t, ['两直线平行，同旁内角互补', `∠2 = 180° − ${t}° = ${180 - t}°`]); } },
  { id: 'judge', name: '平行线的判定条件', gen: (L) => {
    const cor = pick(['同位角相等', '内错角相等', '同旁内角互补']), ws = shuf(['同位角互补', '同旁内角相等', '内错角互补', '对顶角相等', '邻补角互补']).slice(0, 3);
    return MC('m8-s7-judge', '两条直线被第三条直线所截，下列条件中，能判定这两条直线平行的是哪一个？', cor, ws, ['平行线的判定：同位角相等、内错角相等、同旁内角互补，两直线平行', `所以“${cor}”能判定两直线平行`, '其余条件不是判定平行线的条件（对顶角相等、邻补角互补对任意两条相交直线都成立）']); } },
  { id: 'tsum', name: '三角形的内角和', gen: (L) => {
    if (L === 1) { const a = ri(30, 80), b = ri(20, 140 - a); return Q('m8-s7-tsum', `三角形的两个内角分别是 ${a}° 和 ${b}°，第三个内角是多少度？`, 180 - a - b, ['三角形的内角和是 180°', `180° − ${a}° − ${b}° = ${180 - a - b}°`]); }
    if (L === 2 || Math.random() < 0.5) { const [p, q, r] = pick([[1, 2, 3], [2, 3, 4], [3, 4, 5], [1, 2, 6], [1, 1, 2]]), s = p + q + r; return Q('m8-s7-tsum', `三角形三个内角的度数比是 ${p}:${q}:${r}，最大的内角是多少度？`, 180 * r / s, [`三个内角的和是 180°，共 ${s} 份`, `最大的内角 = 180° × ${r} ÷ ${s} = ${180 * r / s}°`]); }
    const a = 2 * ri(10, 60); return Q('m8-s7-tsum', `等腰三角形的顶角是 ${a}°，它的一个底角是多少度？`, (180 - a) / 2, ['等腰三角形的两个底角相等', `底角 = (180° − ${a}°) ÷ 2 = ${(180 - a) / 2}°`]); } },
  { id: 'ext', name: '三角形的外角', gen: (L) => {
    const a = ri(25, 80), b = ri(25, 80);
    if (Math.random() < 0.5) return Q('m8-s7-ext', `在△ABC 中，∠A = ${a}°，∠B = ${b}°，则 ∠C 的外角是多少度？`, a + b, ['三角形的一个外角等于与它不相邻的两个内角的和', `${a}° + ${b}° = ${a + b}°`]);
    return Q('m8-s7-ext', `在△ABC 中，∠C 的外角是 ${a + b}°，∠A = ${a}°，则 ∠B 是多少度？`, b, ['三角形的一个外角等于与它不相邻的两个内角的和', `∠B = ${a + b}° − ${a}° = ${b}°`]); } },
  { id: 'rt2', name: '直角三角形的两个锐角', gen: (L) => {
    const a = ri(15, 75); return Q('m8-s7-rt2', `直角三角形的一个锐角是 ${a}°，另一个锐角是多少度？`, 90 - a, ['直角三角形的两个锐角互余（和为 90°）', `90° − ${a}° = ${90 - a}°`]); } },
  { id: 'propF', name: '找假命题', gen: (L) => {
    const f = pick(FALSE_P), ts = shuf(TRUE_P).slice(0, 3);
    return MC('m8-s7-propF', '下列命题中，是假命题的是哪一个？', f[0], ts.map(t => t[0]), [`“${f[0]}”是假命题：${f[1]}`, '其余三个命题都是真命题'], 3); } },
  { id: 'propT', name: '找真命题', gen: (L) => {
    const t = pick(TRUE_P), fs = shuf(FALSE_P).slice(0, 3);
    return MC('m8-s7-propT', '下列命题中，是真命题的是哪一个？', t[0], fs.map(f => f[0]), [`“${t[0]}”是真命题：${t[1]}`, '其余三个命题都是假命题（各有反例或缺少条件）'], 3); } },
  { id: 'conv', name: '写出逆命题', gen: (L) => {
    const [p, q, np, nq] = pick(CONV);
    return MC('m8-s7-conv', `命题“如果${p}，那么${q}”的逆命题是哪一个？`, `如果${q}，那么${p}`, [`如果${np}，那么${nq}`, `如果${nq}，那么${np}`, `如果${p}，那么${q}`], ['逆命题：把原命题的条件和结论互换', `条件是“${p}”，结论是“${q}”`, `互换后：如果${q}，那么${p}`], 3); } },
];

export const CH8 = [
  { id: 's1', name: '勾股定理', types: S1 },
  { id: 's2', name: '实数', types: S2 },
  { id: 's3', name: '位置与坐标', types: S3 },
  { id: 's4', name: '一次函数', types: S4 },
  { id: 's5', name: '二元一次方程组', types: S5 },
  { id: 's6', name: '数据的分析', types: S6 },
  { id: 's7', name: '证明（平行线、三角形内角和）', types: S7 },
];
export const CHAP8_TYPES = chapTypes(CH8, 'm8-');

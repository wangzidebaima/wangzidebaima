// 五年级上册数学（北师大版）章节随机出题：小数除法、轴对称和平移、倍数与因数、多边形的面积、分数的意义、组合图形的面积、可能性
// 只做文字题（不依赖图片），答案全部由程序算出，每题带分步解析。小数、分数题用完整键盘（带小数点、斜杠、「又」）。
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
const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
const lcm = (a, b) => a / gcd(a, b) * b;
// 把整数 n 看成 n / 10^k，写成最简小数（去掉末尾的 0），用整数运算避免浮点误差
const D = (n, k) => { let s = (n / Math.pow(10, k)).toFixed(k); if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, ''); return s; };
const frac = (n, d) => { const g = gcd(n, d); return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`; };
const isPrime = (n) => { if (n < 2) return false; for (let i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; };
const factors = (n) => { const r = []; for (let i = 1; i <= n; i++) if (n % i === 0) r.push(i); return r; };
// 长除法：返回 a÷b 的整数部分、不循环部分、循环节（b 为正整数）
const longDiv = (a, b) => {
  const ip = Math.floor(a / b); let r = a % b; const seen = new Map(), digs = [];
  while (r !== 0 && !seen.has(r)) { seen.set(r, digs.length); r *= 10; digs.push(Math.floor(r / b)); r %= b; }
  if (r === 0) return { ip, pre: digs.join(''), rep: '' };
  const at = seen.get(r); return { ip, pre: digs.slice(0, at).join(''), rep: digs.slice(at).join('') };
};
const NAMES = ['小明', '小红', '小刚', '小丽', '小华'];

// ---------- 一、小数除法 ----------
const S1 = [
  { id: 'div', name: '小数除以整数', gen: (L) => {
    const f = ri(0, 2);
    if (f === 0) { const n = ri(2, 9), q = ri(11, 99); return QD('m5-s1-div', `${D(q * n, 1)} ÷ ${n} = ?`, D(q, 1), ['按整数除法的方法算，商的小数点要和被除数的小数点对齐', `${D(q * n, 1)} ÷ ${n} = ${D(q, 1)}`]); }
    if (f === 1) { let q = ri(11, 99); if (q % 10 === 0) q += 1; const n = ri(2, L === 1 ? 6 : 9); return QD('m5-s1-div', `${D(q * n, 2)} ÷ ${n} = ?`, D(q, 2), ['商的小数点要和被除数的小数点对齐', `${D(q * n, 2)} ÷ ${n} = ${D(q, 2)}`]); }
    const n = pick([2, 4, 5, 8]); let a = ri(1, 40); if (a % n === 0) a += 1;
    return QD('m5-s1-div', `${a} ÷ ${n} = ?`, D(a * 1000 / n, 3), ['被除数是整数，除到有余数时，在商的个位后面点上小数点，在余数后面添 0 接着除', `${a} ÷ ${n} = ${D(a * 1000 / n, 3)}`]); } },
  { id: 'divdec', name: '除数是小数的除法', gen: (L) => {
    if (L === 1 || Math.random() < 0.4) { const d = ri(2, 9), qq = ri(2, 30); return QD('m5-s1-divdec', `${D(d * qq, 1)} ÷ ${D(d, 1)} = ?`, qq, ['除数是小数时，先把除数变成整数：被除数和除数同时乘 10', `${D(d * qq, 1)} ÷ ${D(d, 1)} = ${d * qq} ÷ ${d} = ${qq}`]); }
    if (L === 2 || Math.random() < 0.5) { const d = ri(2, 9), qq = ri(2, 30); return QD('m5-s1-divdec', `${D(d * qq, 2)} ÷ ${D(d, 2)} = ?`, qq, ['除数是两位小数，被除数和除数同时乘 100，把除数变成整数', `${D(d * qq, 2)} ÷ ${D(d, 2)} = ${d * qq} ÷ ${d} = ${qq}`]); }
    let q = ri(11, 49); if (q % 10 === 0) q += 1; const e = ri(12, 45); if (e % 10 === 0) return null;
    return QD('m5-s1-divdec', `${D(e * q, 2)} ÷ ${D(e, 1)} = ?`, D(q, 1), ['被除数和除数同时乘 10，把除数变成整数', `${D(e * q, 2)} ÷ ${D(e, 1)} = ${D(e * q, 1)} ÷ ${e} = ${D(q, 1)}`]); } },
  { id: 'shift', name: '商的变化规律', gen: () => {
    const y = ri(2, 9), z = ri(2, 12), x = y * z, f = ri(0, 2);
    if (f === 0) return QD('m5-s1-shift', `已知 ${x} ÷ ${y} = ${z}，那么 ${D(x, 1)} ÷ ${D(y, 1)} = ( )`, z, ['被除数和除数同时乘或除以相同的数（0除外），商不变', `${D(x, 1)} ÷ ${D(y, 1)} 是 ${x} ÷ ${y} 的被除数、除数同时缩小到原来的 1/10，商不变`]);
    if (f === 1) return QD('m5-s1-shift', `已知 ${x} ÷ ${y} = ${z}，那么 ${D(x, 2)} ÷ ${y} = ( )`, D(z, 2), ['除数不变，被除数缩小到原来的 1/100，商也缩小到原来的 1/100', `${z} ÷ 100 = ${D(z, 2)}`]);
    return QD('m5-s1-shift', `已知 ${x} ÷ ${y} = ${z}，那么 ${x * 10} ÷ ${y} = ( )`, z * 10, ['除数不变，被除数扩大到原来的 10 倍，商也扩大到原来的 10 倍', `${z} × 10 = ${z * 10}`]); } },
  { id: 'approx', name: '商的近似数', gen: (L) => {
    for (let t = 0; t < 50; t++) {
      const n = pick([3, 6, 7, 9, 11, 12, 13]), A = ri(11, 99), k = L === 1 ? 1 : L === 2 ? 2 : pick([1, 2, 3]);
      const r = longDiv(A, 10 * n); if (!r.rep) continue;
      const v = Math.floor((2 * A * Math.pow(10, k) + 10 * n) / (20 * n)), ans = (v / Math.pow(10, k)).toFixed(k);
      const longer = D(Math.floor(A * 10000 / (10 * n)), 4);
      return QD('m5-s1-approx', `${D(A, 1)} ÷ ${n} 的商，保留 ${['', '一', '两', '三'][k]}位小数约是多少？`, ans, [`除到小数点后第 ${k + 1} 位（商约是 ${longer}…）`, `看第 ${k + 1} 位：用“四舍五入”法保留 ${k} 位小数`, `${D(A, 1)} ÷ ${n} ≈ ${ans}`]);
    } return null; } },
  { id: 'rep', name: '循环小数', gen: () => {
    const b = pick([3, 6, 7, 9, 11, 12]), a = ri(1, b - 1), r = longDiv(a, b); if (!r.rep) return null;
    if (Math.random() < 0.5) {
      const rv = r.rep.split('').reverse().join(''), wr = [rv, r.rep + r.rep.slice(0, 1), r.rep.slice(0, Math.max(1, r.rep.length - 1)), r.pre + r.rep];
      const out = MC('m5-s1-rep', `${a} ÷ ${b} 的商是循环小数，它的循环节是？`, r.rep, wr.filter(w => w !== r.rep && w.length), [`${a} ÷ ${b} = ${r.ip}.${r.pre}${r.rep}${r.rep}…`, `依次重复出现的数字是 ${r.rep}，循环节就是 ${r.rep}`]);
      return out; }
    const n = ri(8, 30), all = r.pre + r.rep.repeat(Math.ceil(n / r.rep.length) + 1), dg = all[n - 1];
    return Q('m5-s1-rep', `${a} ÷ ${b} 的商是循环小数，小数点后第 ${n} 位上的数字是多少？`, dg, [`${a} ÷ ${b} = ${r.ip}.${r.pre}${r.rep}${r.rep}…`, r.pre ? `不循环的部分有 ${r.pre.length} 位，循环节是 ${r.rep}` : `循环节是 ${r.rep}，一共 ${r.rep.length} 位`, `按顺序数到第 ${n} 位是 ${dg}`]); } },
  { id: 'app', name: '解决问题', gen: () => {
    const f = ri(0, 2);
    if (f === 0) { const n = ri(3, 8), q = ri(11, 49); return QD('m5-s1-app', `一根绳子长 ${D(q * n, 1)} 米，平均剪成 ${n} 段，每段长多少米？`, D(q, 1), ['平均分，用除法', `${D(q * n, 1)} ÷ ${n} = ${D(q, 1)}（米）`]); }
    if (f === 1) { const d = ri(2, 9), qq = ri(3, 25); return Q('m5-s1-app', `${D(d * qq, 1)} 升油，每瓶装 ${D(d, 1)} 升，正好装几瓶？`, qq, ['求能装几瓶，用除法', `${D(d * qq, 1)} ÷ ${D(d, 1)} = ${d * qq} ÷ ${d} = ${qq}（瓶）`]); }
    const d = ri(12, 19) , tot = ri(60, 99), q = Math.floor(tot / d), nm = pick(NAMES);
    return Q('m5-s1-app', `${nm}有 ${D(tot, 1)} 米布，做一件衣服要用 ${D(d, 1)} 米，最多能做几件？`, q, [`${D(tot, 1)} ÷ ${D(d, 1)} = ${tot} ÷ ${d} = ${q}……${tot - q * d}`, '余下的布不够再做一件，所以最多做 ' + q + ' 件']); } },
];

// ---------- 二、轴对称和平移 ----------
const SH = [['长方形（不是正方形）', 2], ['正方形', 4], ['等边三角形', 3], ['等腰三角形（不是等边三角形）', 1], ['等腰梯形', 1], ['平行四边形（不是长方形、菱形）', 0], ['菱形（不是正方形）', 2], ['正五边形', 5], ['正六边形', 6]];
const S2 = [
  { id: 'axes', name: '对称轴的条数', gen: () => {
    const [nm, n] = pick(SH);
    return MC('m5-s2-axes', `${nm}有几条对称轴？`, n, shuf([0, 1, 2, 3, 4, 5, 6]).filter(x => x !== n), [`把图形沿一条直线对折，两边能完全重合，这条直线就是对称轴`, `${nm}有 ${n} 条对称轴`]); } },
  { id: 'letter', name: '轴对称图形的判断', gen: () => {
    const yes = ['A', 'H', 'M', 'T', 'U', 'V', 'W', 'X', 'Y', 'O', 'I'], no = ['F', 'G', 'J', 'L', 'N', 'P', 'R', 'S', 'Z'];
    const c = pick(yes), ws = shuf(no).slice(0, 3);
    return MC('m5-s2-letter', `下面的大写字母中，哪一个是轴对称图形？`, c, ws, ['沿一条直线对折，两边能完全重合的图形是轴对称图形', `${c} 沿中间的直线对折，两边完全重合；其他三个字母怎么折都不重合`]); } },
  { id: 'mirror', name: '对称点的位置', gen: () => {
    if (Math.random() < 0.5) {
      const m = ri(4, 8), a = ri(1, m - 1), b = ri(1, 9), cor = `(${2 * m - a}, ${b})`;
      return MC('m5-s2-mirror', `在方格纸上，用数对（第几列，第几行）表示位置。点 A 是 (${a}, ${b})，直线 l 是第 ${m} 列上的竖直直线，点 A 关于直线 l 的对称点是？`, cor,
        [`(${m - a}, ${b})`, `(${2 * m - a}, ${b + 1})`, `(${b}, ${2 * m - a})`, `(${a}, ${b})`], ['对称点和对称轴的距离相等，并且在同一行', `点 A 在第 ${a} 列，离对称轴 ${m - a} 列，所以对称点在对称轴另一侧 ${m - a} 列，也就是第 ${2 * m - a} 列`, `对称点是 ${cor}`]); }
    const r = ri(4, 8), b = ri(1, r - 1), a = ri(1, 9), cor = `(${a}, ${2 * r - b})`;
    return MC('m5-s2-mirror', `在方格纸上，用数对（第几列，第几行，行数从下往上数）表示位置。点 A 是 (${a}, ${b})，直线 l 是第 ${r} 行上的水平直线，点 A 关于直线 l 的对称点是？`, cor,
      [`(${a}, ${r - b})`, `(${a + 1}, ${2 * r - b})`, `(${2 * r - b}, ${a})`, `(${a}, ${b})`], ['对称点和对称轴的距离相等，并且在同一列', `点 A 在第 ${b} 行，离对称轴 ${r - b} 行，所以对称点在另一侧 ${r - b} 行，也就是第 ${2 * r - b} 行`, `对称点是 ${cor}`]); } },
  { id: 'shift', name: '平移后的位置', gen: () => {
    const dir = pick(['右', '左', '上', '下']), k = ri(2, 6); let a = ri(3, 9), b = ri(3, 9);
    const na = dir === '右' ? a + k : dir === '左' ? a - k : a, nb = dir === '上' ? b + k : dir === '下' ? b - k : b;
    if (na < 1 || nb < 1) return null; const cor = `(${na}, ${nb})`;
    return MC('m5-s2-shift', `在方格纸上，用数对（第几列，第几行，行数从下往上数）表示位置。三角形的一个顶点在 (${a}, ${b})，把三角形向${dir}平移 ${k} 格后，这个顶点的位置是？`, cor,
      [`(${dir === '右' || dir === '左' ? b : a + k}, ${dir === '右' || dir === '左' ? a + k : b})`, `(${a + k}, ${b + k})`, `(${Math.max(1, a - k)}, ${b})`, `(${a}, ${b + k})`, `(${a}, ${Math.max(1, b - k)})`],
      [dir === '右' ? '向右平移，列数增加，行数不变' : dir === '左' ? '向左平移，列数减少，行数不变' : dir === '上' ? '向上平移，行数增加，列数不变' : '向下平移，行数减少，列数不变', `顶点的位置是 ${cor}`]); } },
  { id: 'net', name: '平移的距离', gen: () => {
    const a = ri(4, 9), b = ri(1, a - 1), lr = Math.random() < 0.5, d1 = lr ? '右' : '上', d2 = lr ? '左' : '下', cor = `向${d1}平移 ${a - b} 格`;
    return MC('m5-s2-net', `一个图形先向${d1}平移 ${a} 格，再向${d2}平移 ${b} 格，最后相当于？`, cor, [`向${d1}平移 ${a + b} 格`, `向${d2}平移 ${a - b} 格`, `向${d1}平移 ${a} 格`], [`${d1}${a} 格，${d2}${b} 格，方向相反，要相减`, `${a} − ${b} = ${a - b}，方向和多的一次相同，所以${cor}`]); } },
  { id: 'phen', name: '平移和旋转', gen: () => {
    const P = ['电梯上下运动', '推拉窗的移动', '拉开抽屉', '传送带上的货物'], R = ['风车转动', '拧开瓶盖', '钟表的指针转动', '摩天轮转动', '开关门（门绕门轴转动）'];
    const t = Math.random() < 0.5, c = t ? pick(P) : pick(R);
    return MC('m5-s2-phen', `下面哪一种现象属于${t ? '平移' : '旋转'}？`, c, shuf(t ? R : P).slice(0, 3), [t ? '平移是物体沿直线移动，形状、大小和方向都不变' : '旋转是物体绕一个点或一根轴转动', `${c}属于${t ? '平移' : '旋转'}`]); } },
];

// ---------- 三、倍数与因数 ----------
const uniq = (arr, f) => { const out = []; for (const x of arr) if (f(x) && !out.includes(x)) out.push(x); return out; };
const S3 = [
  { id: 'm25', name: '2、5的倍数', gen: () => {
    const f = ri(0, 2);
    const mk = (ends) => ri(10, 199) * 10 + pick(ends);
    const rnd = (ok, bad) => uniq(Array.from({ length: 40 }, () => ri(100, 1990)), x => !ok(x) && bad(x)).slice(0, 3);
    if (f === 0) { const c = mk([0, 5]); return MC('m5-s3-m25', '下面哪个数是 5 的倍数？', c, rnd(x => x % 5 === 0, () => true), ['个位是 0 或 5 的数，是 5 的倍数', `${c} 的个位是 ${c % 10}，是 5 的倍数`]); }
    if (f === 1) { const c = mk([0]); return MC('m5-s3-m25', '下面哪个数既是 2 的倍数，又是 5 的倍数？', c, rnd(x => x % 10 === 0, () => true), ['既是 2 的倍数又是 5 的倍数，个位一定是 0', `${c} 的个位是 0`]); }
    const c = mk([2, 4, 6, 8]); return MC('m5-s3-m25', '下面哪个数是 2 的倍数，但不是 5 的倍数？', c, rnd(x => !(x % 2 === 0 && x % 5 !== 0), () => true), ['个位是 0、2、4、6、8 的数是 2 的倍数；个位是 0 或 5 的数是 5 的倍数', `${c} 的个位是 ${c % 10}，是 2 的倍数，不是 5 的倍数`]); } },
  { id: 'm3', name: '3的倍数', gen: () => {
    const f = ri(0, 2);
    if (f === 0) { const c = 3 * ri(34, 330), ws = uniq([c + 1, c + 2, c - 1, c + 4], x => x % 3 !== 0).slice(0, 3), s = String(c).split('').reduce((a, b) => a + +b, 0);
      return MC('m5-s3-m3', '下面哪个数是 3 的倍数？', c, ws, ['各位上的数的和是 3 的倍数，这个数就是 3 的倍数', `${String(c).split('').join(' + ')} = ${s}，${s} 是 3 的倍数，所以 ${c} 是 3 的倍数`]); }
    const T = [['2、3', 6, 102], ['3、5', 15, 105], ['2、3、5', 30, 120]], [nm, d, a] = pick(T);
    return Q('m5-s3-m3', `同时是 ${nm} 的倍数的最小三位数是多少？`, a, [`同时是 ${nm} 的倍数，就是 ${d} 的倍数`, `最小的三位数从 100 开始找：${a} 是 ${d} 的倍数，而 ${a - 1} 到 100 里没有`, `最小的是 ${a}`]); } },
  { id: 'nfac', name: '找因数', gen: () => {
    const n = pick([12, 18, 20, 24, 28, 30, 36, 40, 42, 45, 48, 50, 60]), fs = factors(n), f = ri(0, 2);
    const lst = `${n} 的因数有：${fs.join('、')}`;
    if (f === 0) return Q('m5-s3-nfac', `${n} 的因数一共有多少个？`, fs.length, ['成对地找：1 × ' + n + '，2 × ' + (n / 2) + '，……', lst, `一共 ${fs.length} 个`]);
    if (f === 1) { const od = fs.filter(x => x % 2 === 1); return Q('m5-s3-nfac', `${n} 的因数中，奇数有多少个？`, od.length, [lst, `其中奇数是 ${od.join('、')}`, `一共 ${od.length} 个`]); }
    const sm = fs.filter(x => x < 10), mx = Math.max(...sm); return Q('m5-s3-nfac', `${n} 的因数中，最大的一位数是几？`, mx, [lst, `一位数的因数有 ${sm.join('、')}`, `最大的是 ${mx}`]); } },
  { id: 'prime', name: '质数与合数', gen: () => {
    const f = ri(0, 3);
    if (f === 0) { const P = Array.from({ length: 90 }, (_, i) => i + 11).filter(isPrime), C = Array.from({ length: 90 }, (_, i) => i + 11).filter(x => !isPrime(x) && x % 2 && x % 5);
      const c = pick(P), ws = shuf(C).slice(0, 3); return MC('m5-s3-prime', '下面哪个数是质数？', c, ws, ['质数：只有 1 和它本身两个因数', `${c} 只有 1 和 ${c} 两个因数，是质数；其他几个数还有别的因数，是合数`]); }
    if (f === 1) { const nn = pick([20, 30, 50, 100]), ps = Array.from({ length: nn }, (_, i) => i + 1).filter(isPrime); return Q('m5-s3-prime', `${nn} 以内（包括 ${nn}）的质数有多少个？`, ps.length, [`${nn} 以内的质数有：${ps.join('、')}`, `一共 ${ps.length} 个`]); }
    if (f === 2) { const T = [['最小的质数是几？', 2, '2 只有 1 和 2 两个因数，是最小的质数'], ['最小的合数是几？', 4, '4 的因数有 1、2、4，是最小的合数'], ['既是质数又是偶数的数是几？', 2, '偶数里只有 2 是质数']], [s, a, w] = pick(T); return Q('m5-s3-prime', s, a, [w]); }
    return MC('m5-s3-prime', '下面哪个数既不是质数，也不是合数？', 1, [2, 9, 15], ['1 只有一个因数（它本身），既不是质数，也不是合数']); } },
  { id: 'mcnt', name: '数倍数', gen: () => {
    if (Math.random() < 0.5) { const a = pick([3, 4, 6, 7, 8, 9, 11, 12]), N = ri(5, 12) * 10 + ri(0, 9), c = Math.floor(N / a);
      return Q('m5-s3-mcnt', `${N} 以内（包括 ${N}）${a} 的倍数有多少个？（不算 0）`, c, [`${N} ÷ ${a} = ${c}……${N - c * a}`, `${a} 的倍数有 ${a}、${2 * a}、${3 * a}……最大的是 ${c * a}`, `一共 ${c} 个`]); }
    const a = ri(3, 12), k = ri(6, 12); return Q('m5-s3-mcnt', `${a} 的第 ${k} 个倍数是多少？`, a * k, [`第 ${k} 个倍数就是 ${a} × ${k}`, `${a} × ${k} = ${a * k}`]); } },
  { id: 'digit', name: '填数字', gen: () => {
    const f = ri(0, 1);
    if (f === 0) { const a = ri(1, 9), b = ri(0, 9), mn = Math.random() < 0.5; let ds = []; for (let d = 0; d <= 9; d++) if ((a + b + d) % 3 === 0) ds.push(d);
      const ans = mn ? ds[0] : ds[ds.length - 1];
      return Q('m5-s3-digit', `在 ${a}${b}□ 的 □ 里填一个数字，使它是 3 的倍数，□ 里最${mn ? '小' : '大'}可以填几？`, ans, [`各位数字的和 ${a} + ${b} + □ 要是 3 的倍数`, `□ 可以填 ${ds.join('、')}`, `最${mn ? '小' : '大'}的是 ${ans}`]); }
    let a, b; do { a = ri(1, 9); b = ri(0, 9); } while ((a + b) % 3 === 2); const ans = (a + b) % 3 === 0 ? 0 : 5;
    return Q('m5-s3-digit', `在 ${a}${b}□ 的 □ 里填一个数字，使它既是 3 的倍数，又是 5 的倍数，□ 里应填几？`, ans, ['是 5 的倍数，个位只能是 0 或 5', `${a} + ${b} + ${ans} = ${a + b + ans}，是 3 的倍数`, `□ 里填 ${ans}`]); } },
];

// ---------- 四、多边形的面积 ----------
const S4 = [
  { id: 'para', name: '平行四边形的面积', gen: (L) => {
    const a = ri(4, L === 1 ? 20 : 40), h = ri(3, L === 1 ? 12 : 25); return Q('m5-s4-para', `一个平行四边形，底是 ${a} 厘米，高是 ${h} 厘米，面积是多少平方厘米？`, a * h, ['平行四边形的面积 = 底 × 高', `${a} × ${h} = ${a * h}（平方厘米）`]); } },
  { id: 'tri', name: '三角形的面积', gen: (L) => {
    let a = ri(4, L === 1 ? 20 : 40), h = ri(3, L === 1 ? 12 : 25); if ((a * h) % 2) h += 1; return Q('m5-s4-tri', `一个三角形，底是 ${a} 厘米，高是 ${h} 厘米，面积是多少平方厘米？`, a * h / 2, ['三角形的面积 = 底 × 高 ÷ 2', `${a} × ${h} ÷ 2 = ${a * h / 2}（平方厘米）`]); } },
  { id: 'trap', name: '梯形的面积', gen: (L) => {
    let b = ri(3, 12), a = b + ri(2, 12), h = ri(4, L === 1 ? 12 : 20); if (((a + b) * h) % 2) h += 1;
    return Q('m5-s4-trap', `一个梯形，上底是 ${b} 厘米，下底是 ${a} 厘米，高是 ${h} 厘米，面积是多少平方厘米？`, (a + b) * h / 2, ['梯形的面积 = （上底 + 下底）× 高 ÷ 2', `(${b} + ${a}) × ${h} ÷ 2 = ${(a + b) * h / 2}（平方厘米）`]); } },
  { id: 'high', name: '求高', gen: () => {
    const f = ri(0, 2);
    if (f === 0) { const a = ri(5, 20), h = ri(4, 15); return Q('m5-s4-high', `一个平行四边形的面积是 ${a * h} 平方厘米，底是 ${a} 厘米，高是多少厘米？`, h, ['平行四边形的面积 = 底 × 高，所以 高 = 面积 ÷ 底', `${a * h} ÷ ${a} = ${h}（厘米）`]); }
    if (f === 1) { const a = ri(5, 20), h = ri(2, 8) * 2; return Q('m5-s4-high', `一个三角形的面积是 ${a * h / 2} 平方厘米，底是 ${a} 厘米，高是多少厘米？`, h, ['三角形的面积 = 底 × 高 ÷ 2，所以 高 = 面积 × 2 ÷ 底', `${a * h / 2} × 2 ÷ ${a} = ${h}（厘米）`]); }
    const b = ri(3, 10), a = b + ri(2, 8), h = ri(3, 12); return Q('m5-s4-high', `一个梯形的面积是 ${(a + b) * h} 平方厘米，上底是 ${b} 厘米，下底是 ${a} 厘米，高是多少厘米？`, h * 2, ['梯形的面积 = （上底 + 下底）× 高 ÷ 2，所以 高 = 面积 × 2 ÷（上底 + 下底）', `${(a + b) * h} × 2 ÷ (${b} + ${a}) = ${(a + b) * h * 2} ÷ ${a + b} = ${h * 2}（厘米）`]); } },
  { id: 'equal', name: '等底等高', gen: () => {
    const f = ri(0, 3);
    if (f === 0) return MC('m5-s4-equal', '一个三角形和一个平行四边形等底等高，三角形的面积是平行四边形的？', '一半', ['2 倍', '相等', '1/3'], ['两个完全一样的三角形可以拼成一个平行四边形', '所以三角形的面积是等底等高的平行四边形面积的一半']);
    if (f === 1) { const s = ri(5, 40) * 2; return Q('m5-s4-equal', `一个平行四边形的面积是 ${s} 平方厘米，和它等底等高的三角形的面积是多少平方厘米？`, s / 2, ['等底等高的三角形的面积是平行四边形的一半', `${s} ÷ 2 = ${s / 2}（平方厘米）`]); }
    if (f === 2) { const s = ri(5, 40); return Q('m5-s4-equal', `一个三角形的面积是 ${s} 平方厘米，和它等底等高的平行四边形的面积是多少平方厘米？`, s * 2, ['等底等高的平行四边形的面积是三角形的 2 倍', `${s} × 2 = ${s * 2}（平方厘米）`]); }
    let b = ri(3, 10), a = b + ri(2, 8), h = ri(4, 12); if (((a + b) * h) % 2) h += 1;
    return Q('m5-s4-equal', `用两个完全一样的梯形拼成一个平行四边形，平行四边形的底是 ${a + b} 厘米，高是 ${h} 厘米，每个梯形的面积是多少平方厘米？`, (a + b) * h / 2, ['两个完全一样的梯形拼成一个平行四边形，每个梯形的面积是平行四边形的一半', `${a + b} × ${h} ÷ 2 = ${(a + b) * h / 2}（平方厘米）`]); } },
  { id: 'app', name: '底和高、解决问题', gen: () => {
    const f = ri(0, 2);
    if (f === 0) { const a = ri(8, 20), h = ri(5, a - 1), c = h + ri(1, 6); const cor = a * h; return MC('m5-s4-app', `一个平行四边形，一条底是 ${a} 厘米，这条底上的高是 ${h} 厘米，另一条邻边是 ${c} 厘米，它的面积是多少平方厘米？`, cor, [a * c, (a + c) * 2, a * h / 2 === Math.floor(a * h / 2) ? a * h / 2 : a * h + 1], ['平行四边形的面积 = 底 × 对应的高，邻边长度不能用来算面积', `${a} × ${h} = ${cor}（平方厘米）`]); }
    if (f === 1) { const a = ri(20, 50), h = ri(10, 30), k = ri(2, 6); return Q('m5-s4-app', `一块平行四边形菜地，底是 ${a} 米，高是 ${h} 米，平均每平方米收蔬菜 ${k} 千克，这块地一共收蔬菜多少千克？`, a * h * k, ['先求菜地的面积：底 × 高', `${a} × ${h} = ${a * h}（平方米）`, `再乘每平方米的产量：${a * h} × ${k} = ${a * h * k}（千克）`]); }
    let b = ri(3, 8), a = b + ri(2, 6), h = ri(3, 8), len = ri(10, 50); if (((a + b) * h) % 2) h += 1;
    return Q('m5-s4-app', `一条水渠的横截面是梯形，上口宽 ${a} 米，渠底宽 ${b} 米，深 ${h} 米，渠长 ${len} 米，挖这条水渠要挖出多少立方米的土？`, (a + b) * h / 2 * len, ['先求横截面（梯形）的面积：（上底 + 下底）× 高 ÷ 2', `(${a} + ${b}) × ${h} ÷ 2 = ${(a + b) * h / 2}（平方米）`, `再乘渠长：${(a + b) * h / 2} × ${len} = ${(a + b) * h / 2 * len}（立方米）`]); } },
];

// ---------- 五、分数的意义 ----------
const S5 = [
  { id: 'sense', name: '分数的意义', gen: () => {
    const f = ri(0, 3);
    if (f === 0) { let d = ri(3, 9), k = ri(1, d - 1); if (gcd(k, d) !== 1) { k = 1; } const n = d * ri(1, 3);
      return QD('m5-s5-sense', `把 ${n} 个苹果平均分成 ${d} 份，取其中的 ${k} 份，取走的占这些苹果的几分之几？`, `${k}/${d}`, [`把 ${n} 个苹果看成单位“1”，平均分成 ${d} 份，每份是它的 1/${d}`, `取 ${k} 份就是 ${k}/${d}`]); }
    if (f === 1) { const d = ri(3, 9), k = ri(1, d - 1), m = d * ri(2, 8); return Q('m5-s5-sense', `${m} 的 ${k}/${d} 是多少？`, m / d * k, [`先求 ${m} 的 1/${d}：${m} ÷ ${d} = ${m / d}`, `再求 ${k} 份：${m / d} × ${k} = ${m / d * k}`]); }
    if (f === 2) { const d = ri(3, 12), k = ri(2, d + 3); return Q('m5-s5-sense', `${k}/${d} 里面有多少个 1/${d}？`, k, [`分数单位是 1/${d}`, `${k}/${d} 就是 ${k} 个 1/${d}`]); }
    const d = ri(3, 9); return QD('m5-s5-sense', `把 1 米长的绳子平均分成 ${d} 段，每段占全长的几分之几？`, `1/${d}`, [`把 1 米看成单位“1”，平均分成 ${d} 段`, `每段占全长的 1/${d}`]); } },
  { id: 'divfrac', name: '分数与除法', gen: () => {
    const f = ri(0, 2);
    if (f === 0) { const b = ri(3, 12); let a = ri(1, b - 1); const ans = frac(a, b); return QD('m5-s5-divfrac', `${a} ÷ ${b} 用分数表示是多少？（要最简分数）`, ans, [`被除数 ÷ 除数 = 被除数/除数`, `${a} ÷ ${b} = ${a}/${b}${ans !== `${a}/${b}` ? `，约分得 ${ans}` : ''}`]); }
    if (f === 1) { const b = ri(3, 12), a = ri(1, b - 1); const g = gcd(a, b); if (g !== 1) return null; return Q('m5-s5-divfrac', `${a}/${b} = ${a} ÷ ( )，括号里应填几？`, b, ['分数的分子相当于被除数，分母相当于除数', `${a}/${b} = ${a} ÷ ${b}`]); }
    const b = ri(3, 8), w = ri(1, 3), r = ri(1, b - 1); if (gcd(r, b) !== 1) return null; const a = w * b + r;
    return QD('m5-s5-divfrac', `把 ${a} 米长的绳子平均分成 ${b} 段，每段长多少米？（写成带分数）`, `${w}又${r}/${b}`, [`${a} ÷ ${b} = ${a}/${b}`, `${a} 里面有 ${w} 个 ${b}，余 ${r}，写成带分数是 ${w}又${r}/${b}`]); } },
  { id: 'prop', name: '分数的基本性质', gen: () => {
    const f = ri(0, 2);
    if (f === 0) { const d = ri(3, 9), k = ri(1, d - 1), m = ri(2, 6); return Q('m5-s5-prop', `${k}/${d} = ( )/${d * m}`, k * m, [`分母乘 ${m}，分子也要乘 ${m}，分数的大小才不变`, `${k} × ${m} = ${k * m}`]); }
    if (f === 1) { const d = ri(3, 9), k = ri(1, d - 1), m = ri(2, 6); return Q('m5-s5-prop', `${k * m}/${d * m} = ( )/${d}`, k, [`分母 ${d * m} 除以 ${m} 得 ${d}，分子也要除以 ${m}`, `${k * m} ÷ ${m} = ${k}`]); }
    return MC('m5-s5-prop', '分数的基本性质是：分数的分子和分母同时乘或除以相同的数（0 除外），分数的大小怎样？', '不变', ['变大', '变小', '无法确定'], ['分数的分子、分母同时乘或除以相同的数（0 除外），分数的大小不变']); } },
  { id: 'gcdlcm', name: '最大公因数和最小公倍数', gen: () => {
    const f = ri(0, 3);
    if (f === 0) { const g = ri(2, 9); let p = ri(2, 6), q = ri(2, 6); if (gcd(p, q) !== 1 || p === q) { p = 2; q = 3; } const a = g * p, b = g * q;
      return Q('m5-s5-gcdlcm', `${a} 和 ${b} 的最大公因数是多少？`, g, [`${a} 的因数有：${factors(a).join('、')}`, `${b} 的因数有：${factors(b).join('、')}`, `公有的因数中最大的是 ${g}`]); }
    if (f === 1) { const a = ri(4, 15), b = ri(4, 15); if (a === b) return null; const l = lcm(a, b);
      return Q('m5-s5-gcdlcm', `${a} 和 ${b} 的最小公倍数是多少？`, l, [`${a} 的倍数：${[1, 2, 3, 4, 5].map(i => a * i).join('、')}……`, `${b} 的倍数：${[1, 2, 3, 4, 5].map(i => b * i).join('、')}……`, `公有的倍数中最小的是 ${l}`]); }
    if (f === 2) { const a = pick([2, 3, 4, 5, 6, 8, 9, 10, 12]), b = pick([3, 4, 5, 6, 8, 10, 12, 15]); if (a === b || (a % b === 0) || (b % a === 0)) return null;
      return Q('m5-s5-gcdlcm', `1/${a} 和 1/${b} 通分，公分母最小是多少？`, lcm(a, b), ['通分时，公分母最小是两个分母的最小公倍数', `${a} 和 ${b} 的最小公倍数是 ${lcm(a, b)}`]); }
    const T = [[7, 9], [5, 8], [4, 9], [3, 10], [8, 15]], [a, b] = pick(T); return Q('m5-s5-gcdlcm', `${a} 和 ${b} 是互质数，它们的最小公倍数是多少？`, a * b, ['两个数互质（公因数只有 1），最小公倍数就是它们的乘积', `${a} × ${b} = ${a * b}`]); } },
  { id: 'reduce', name: '约分和通分', gen: () => {
    const f = ri(0, 2);
    if (f === 0) { let p = ri(2, 9), q = ri(2, 9); while (gcd(p, q) !== 1 || p >= q) { p = ri(1, 8); q = ri(2, 9); } const m = ri(2, 6);
      return QD('m5-s5-reduce', `把 ${p * m}/${q * m} 约成最简分数。`, `${p}/${q}`, [`分子 ${p * m} 和分母 ${q * m} 的最大公因数是 ${m}`, `分子、分母同时除以 ${m}：${p * m} ÷ ${m} = ${p}，${q * m} ÷ ${m} = ${q}`, `最简分数是 ${p}/${q}`]); }
    if (f === 1) { const T = [[2, 3], [3, 4], [1, 4], [5, 6], [2, 5], [3, 8], [1, 6], [3, 10]], [[a, b], [c, d]] = [pick(T), pick(T)]; if (b === d) return null; const L = lcm(b, d);
      return Q('m5-s5-reduce', `把 ${a}/${b} 和 ${c}/${d} 通分，公分母取最小的，那么 ${a}/${b} = ( )/${L}，括号里应填几？`, a * L / b, [`${b} 和 ${d} 的最小公倍数是 ${L}`, `${a}/${b} 的分母乘 ${L / b}，分子也乘 ${L / b}`, `${a} × ${L / b} = ${a * L / b}`]); }
    const p = ri(2, 6), q = ri(p + 1, 9), g = gcd(p, q); if (g !== 1) return null; const m = ri(2, 5);
    return Q('m5-s5-reduce', `${p * m}/${q * m} 约分成最简分数后，分母是多少？`, q, [`分子、分母同时除以它们的最大公因数 ${m}`, `${q * m} ÷ ${m} = ${q}`]); } },
  { id: 'cmp', name: '分数的大小与互化', gen: () => {
    const f = ri(0, 3);
    if (f === 0) { let a = ri(1, 7), b = ri(2, 9), c = ri(1, 7), d = ri(2, 9); if (a >= b || c >= d || b === d || a * d === b * c) return null; const rel = a * d > b * c ? '>' : '<', L = lcm(b, d);
      return MC('m5-s5-cmp', `${a}/${b} ○ ${c}/${d}，○ 里填什么？`, rel, ['>', '<', '='], [`先通分：公分母是 ${L}`, `${a}/${b} = ${a * L / b}/${L}，${c}/${d} = ${c * L / d}/${L}`, `${a * L / b} ${rel} ${c * L / d}，所以 ${a}/${b} ${rel} ${c}/${d}`]); }
    if (f === 1) { const T = [[1, 2, '0.5'], [1, 4, '0.25'], [3, 4, '0.75'], [1, 5, '0.2'], [2, 5, '0.4'], [3, 5, '0.6'], [4, 5, '0.8'], [1, 8, '0.125'], [3, 8, '0.375'], [7, 10, '0.7'], [3, 20, '0.15'], [7, 25, '0.28']], [n, d, s] = pick(T);
      return QD('m5-s5-cmp', `把 ${n}/${d} 化成小数是多少？`, s, [`分数化小数：用分子 ÷ 分母`, `${n} ÷ ${d} = ${s}`]); }
    if (f === 2) { const T = [['0.5', '1/2'], ['0.25', '1/4'], ['0.75', '3/4'], ['0.2', '1/5'], ['0.6', '3/5'], ['0.35', '7/20'], ['0.04', '1/25'], ['0.125', '1/8'], ['0.45', '9/20'], ['0.8', '4/5']], [s, a] = pick(T);
      return QD('m5-s5-cmp', `把 ${s} 化成最简分数是多少？`, a, [`小数化分数：先写成分母是 10、100、1000 的分数`, `再约分，得 ${a}`]); }
    const L = ri(0, 1) ? [['1/2', '2/3', '3/4'], '1/2'] : [['3/5', '1/2', '7/10'], '1/2']; const arr = shuf(L[0]);
    return MC('m5-s5-cmp', `下面三个分数中，最小的是哪一个？${arr.join('、')}`, L[1], L[0].filter(x => x !== L[1]), ['先通分，再比较分子的大小', `${L[1]} 最小`]); } },
];

// ---------- 六、组合图形的面积 ----------
const S6 = [
  { id: 'lshape', name: '拼成的组合图形', gen: () => {
    if (Math.random() < 0.5) { const a = ri(6, 14), b = ri(5, 12), c = ri(2, a - 2), d = ri(2, b - 2); return Q('m5-s6-lshape', `一个长 ${a} 米、宽 ${b} 米的长方形，剪去右上角一个长 ${c} 米、宽 ${d} 米的小长方形，剩下的图形面积是多少平方米？`, a * b - c * d, ['剩下的面积 = 大长方形的面积 − 剪去的小长方形的面积', `${a} × ${b} − ${c} × ${d} = ${a * b} − ${c * d} = ${a * b - c * d}（平方米）`]); }
    const a = ri(4, 12), b = ri(3, 9), c = ri(3, 9), d = ri(3, 9); return Q('m5-s6-lshape', `一个组合图形由两个长方形拼成（没有重叠）：一个长 ${a} 厘米、宽 ${b} 厘米，另一个长 ${c} 厘米、宽 ${d} 厘米。组合图形的面积是多少平方厘米？`, a * b + c * d, ['组合图形的面积 = 两个长方形的面积之和', `${a} × ${b} + ${c} × ${d} = ${a * b} + ${c * d} = ${a * b + c * d}（平方厘米）`]); } },
  { id: 'house', name: '长方形加三角形', gen: () => {
    const l = ri(4, 12) * 2, w = ri(4, 10), h = ri(3, 8); const tri = l * h / 2;
    return Q('m5-s6-house', `一个“小房子”形状的图形，下面是长 ${l} 厘米、宽 ${w} 厘米的长方形，上面是底 ${l} 厘米、高 ${h} 厘米的三角形。它的面积是多少平方厘米？`, l * w + tri, ['分成两部分：长方形 + 三角形', `长方形：${l} × ${w} = ${l * w}；三角形：${l} × ${h} ÷ 2 = ${tri}`, `${l * w} + ${tri} = ${l * w + tri}（平方厘米）`]); } },
  { id: 'hollow', name: '挖去一部分', gen: () => {
    const a = ri(10, 30), b = ri(8, a - 1), s = ri(2, Math.min(6, b - 2)); return Q('m5-s6-hollow', `一块长 ${a} 米、宽 ${b} 米的长方形草地，中间有一个边长 ${s} 米的正方形花坛，草地（不含花坛）的面积是多少平方米？`, a * b - s * s, ['草地的面积 = 长方形的面积 − 花坛的面积', `${a} × ${b} − ${s} × ${s} = ${a * b} − ${s * s} = ${a * b - s * s}（平方米）`]); } },
  { id: 'unit', name: '公顷和平方千米', gen: () => {
    const f = ri(0, 3);
    if (f === 0) { const n = ri(2, 9); return Q('m5-s6-unit', `${n} 公顷 = ( ) 平方米`, n * 10000, ['1 公顷 = 10000 平方米', `${n} × 10000 = ${n * 10000}`]); }
    if (f === 1) { const n = ri(2, 9); return Q('m5-s6-unit', `${n * 10000} 平方米 = ( ) 公顷`, n, ['10000 平方米 = 1 公顷', `${n * 10000} ÷ 10000 = ${n}`]); }
    if (f === 2) { const n = ri(2, 9); return Q('m5-s6-unit', `${n} 平方千米 = ( ) 公顷`, n * 100, ['1 平方千米 = 100 公顷', `${n} × 100 = ${n * 100}`]); }
    const p = ri(2, 9), q = ri(2, 9); return Q('m5-s6-unit', `一块长方形的地，长 ${p * 100} 米，宽 ${q * 100} 米，面积是多少公顷？`, p * q, [`面积：${p * 100} × ${q * 100} = ${p * q * 10000}（平方米）`, `${p * q * 10000} ÷ 10000 = ${p * q}（公顷）`]); } },
  { id: 'upick', name: '选合适的面积单位', gen: () => {
    const T = [['一张邮票的面积约 6', '平方厘米'], ['一间教室地面的面积约 60', '平方米'], ['一个足球场的面积约 0.7', '公顷'], ['一个省的面积约 16 万', '平方千米'], ['一块黑板的面积约 4', '平方米'], ['一枚硬币的面积约 5', '平方厘米'], ['一个学校操场的面积约 1', '公顷'], ['课本封面的面积约 4', '平方分米']], [s, u] = pick(T);
    return MC('m5-s6-upick', `${s}（　）`, u, ['平方厘米', '平方分米', '平方米', '公顷', '平方千米'].filter(x => x !== u), ['先想一想 1 平方厘米、1 平方米、1 公顷、1 平方千米各有多大', `这里应该用“${u}”`]); } },
];

// ---------- 七、可能性 ----------
const S7 = [
  { id: 'word', name: '一定、可能、不可能', gen: () => {
    const T = [['太阳从东方升起', '一定'], ['从装满红球的袋子里摸出一个红球', '一定'], ['掷一枚骰子，点数小于 7', '一定'], ['抛一枚硬币，正面朝上', '可能'], ['明天会下雨', '可能'], ['从有红球也有黄球的袋子里摸出红球', '可能'], ['掷一枚骰子，点数是 7', '不可能'], ['从装满红球的袋子里摸出一个黄球', '不可能'], ['人不吃不喝能活一百天', '不可能']], [s, a] = pick(T);
    return MC('m5-s7-word', `“${s}”这件事是？`, a, ['一定', '可能', '不可能'], [a === '一定' ? '这件事肯定会发生' : a === '不可能' ? '这件事肯定不会发生' : '这件事有可能发生，也有可能不发生', `应该选“${a}”`]); } },
  { id: 'most', name: '摸到哪种球的可能性大', gen: () => {
    const cs = ['红球', '黄球', '蓝球'], ns = shuf([ri(1, 8), ri(1, 8), ri(1, 8)]); const mx = Math.max(...ns), mn = Math.min(...ns);
    if (ns.filter(x => x === mx).length > 1 || ns.filter(x => x === mn).length > 1) return null; const big = Math.random() < 0.6, tg = big ? mx : mn, nm = cs[ns.indexOf(tg)];
    return MC('m5-s7-most', `盒子里有${cs.map((c, i) => ` ${ns[i]} 个${c}`).join('、')}，任意摸一个，摸到哪种球的可能性${big ? '最大' : '最小'}？`, nm, cs.filter(x => x !== nm), ['球的个数越多，摸到的可能性越大；越少，可能性越小', `${cs.map((c, i) => c + ' ' + ns[i] + ' 个').join('，')}，${big ? '最多' : '最少'}的是${nm}`]); } },
  { id: 'frac', name: '可能性的大小', gen: () => {
    const a = ri(1, 6), b = ri(1, 6), t = a + b, cor = frac(a, t);
    return QD('m5-s7-frac', `盒子里有 ${a} 个红球和 ${b} 个黄球，它们除颜色外完全一样，任意摸一个，摸到红球的可能性是多少？（用最简分数表示）`, cor, [`一共有 ${a} + ${b} = ${t} 个球`, `摸到红球的可能性是 ${a}/${t}${cor !== `${a}/${t}` ? `，约分得 ${cor}` : ''}`]); } },
  { id: 'fair', name: '游戏公平吗', gen: () => {
    const f = ri(0, 1);
    if (f === 0) { const k = ri(2, 4), fair = k === 3; return MC('m5-s7-fair', `掷一枚骰子，点数是 1 到 ${k} 甲先走，点数是 ${k + 1} 到 6 乙先走，这个规则公平吗？`, fair ? '公平' : '不公平', ['公平', '不公平', '无法判断'], [`甲：${k} 种点数，乙：${6 - k} 种点数`, fair ? '两人的可能性相同，所以公平' : `${k} 和 ${6 - k} 不相等，可能性不同，所以不公平`]); }
    const a = ri(2, 6), b = ri(2, 6), fair = a === b; return MC('m5-s7-fair', `盒子里有 ${a} 个红球和 ${b} 个白球，任意摸一个，摸到红球甲赢，摸到白球乙赢，这个游戏公平吗？`, fair ? '公平' : '不公平', ['公平', '不公平', '无法判断'], [`红球 ${a} 个，白球 ${b} 个`, fair ? '个数相同，两人赢的可能性一样大，所以公平' : '个数不同，两人赢的可能性不同，所以不公平']); } },
  { id: 'adj', name: '怎样使可能性相等', gen: () => {
    const a = ri(1, 6), b = a + ri(2, 6); return Q('m5-s7-adj', `盒子里有 ${a} 个红球和 ${b} 个黄球，要使摸到两种球的可能性相同，至少要再放入几个红球？`, b - a, ['两种球的个数相同时，摸到的可能性相同', `${b} − ${a} = ${b - a}（个）`]); } },
];

export const CH5 = [
  { id: 's1', name: '小数除法', types: S1 },
  { id: 's2', name: '轴对称和平移', types: S2 },
  { id: 's3', name: '倍数与因数', types: S3 },
  { id: 's4', name: '多边形的面积', types: S4 },
  { id: 's5', name: '分数的意义', types: S5 },
  { id: 's6', name: '组合图形的面积', types: S6 },
  { id: 's7', name: '可能性', types: S7 },
];
export const CHAP5_TYPES = chapTypes(CH5, 'm5-');

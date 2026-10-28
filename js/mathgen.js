// 随机出题：七年级有理数、四年级口算、英语词汇。所有答案由程序用分数精确计算。
import { Fr } from './grade.js';

const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sgn = () => (Math.random() < 0.5 ? -1 : 1);
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; };
const lcm = (a, b) => a / gcd(a, b) * b;
const hash = (s) => { let x = 5381; for (const c of s) x = ((x << 5) + x + c.charCodeAt(0)) >>> 0; return x.toString(36); };
const M = '−';
const SUP = { 2: '²', 3: '³', 4: '⁴' };

// ---------- 数的显示 ----------
function toDec(v) {
  let d = v.d, c2 = 0, c5 = 0;
  while (d % 2 === 0) { d /= 2; c2++; }
  while (d % 5 === 0) { d /= 5; c5++; }
  if (d !== 1) return null;
  const k = Math.max(c2, c5);
  let s = (Math.abs(v.n) / v.d).toFixed(k);
  if (k) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return (v.n < 0 ? '-' : '') + s;
}
const fmtAbs = (v, mode) => (mode === 'dec' ? (toDec(v) || v.str()) : mode === 'mix' ? v.mixed() : v.str());
const ansStr = (v, mode) => (mode === 'dec' ? (toDec(v) || v.str()) : mode === 'mix' ? v.mixed() : v.str());

const T = {
  int: (n) => ({ v: new Fr(n), s: String(Math.abs(n)) }),
  dec: (x) => ({ v: new Fr(x, 10), s: (Math.abs(x) / 10).toFixed(1) }),
  d: (fr) => ({ v: fr, s: toDec(fr.abs()) }),
  frac: (n, d) => ({ v: new Fr(n, d), s: `${Math.abs(n)}/${d}` }),
  mix: (w, n, d, neg) => ({ v: new Fr((w * d + n) * (neg ? -1 : 1), d), s: `${w}又${n}/${d}` }),
};
const disp = (t) => (t.raw ? t.s : t.v.n < 0 ? `(${M}${t.s})` : t.s);
const exprOf = (terms, ops) => terms.map((t, i) => (i ? ops[i - 1] : '') + disp(t)).join('');
const evalAS = (terms, ops) => terms.reduce((a, t, i) => (i === 0 ? t.v : ops[i - 1] === '+' ? a.add(t.v) : a.sub(t.v)), new Fr(0));
const evalMD = (terms, ops) => terms.reduce((a, t, i) => (i === 0 ? t.v : ops[i - 1] === '×' ? a.mul(t.v) : a.div(t.v)), new Fr(1));

function Q(typeId, stem, val, mode, steps, extra) {
  const answer = ansStr(val, mode);
  return Object.assign({
    type: 'math', typeId, stem, answer, pts: 1, id: 'r-' + typeId + '-' + hash(stem),
    why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${answer.replace(/-/g, M)}`,
  }, extra || {});
}

function mkAddSub(terms, ops, mode, typeId, pre) {
  const sv = terms.map((t, i) => (i === 0 ? t.v : ops[i - 1] === '+' ? t.v : t.v.neg()));
  const total = sv.reduce((a, b) => a.add(b), new Fr(0));
  const F = (v) => fmtAbs(v, mode);
  const joined = (arr, f) => arr.map((v, i) => (v.n < 0 ? M : (i ? '+' : '')) + f(v.abs())).join('');
  const st = []; if (pre) st.push(pre);
  st.push('减法变加法（减去一个数，等于加上它的相反数），并去掉括号：' + joined(sv, F));
  if (mode === 'num' || mode === 'dec') {
    const pos = sv.filter(v => v.n > 0), neg = sv.filter(v => v.n < 0);
    const P = pos.reduce((a, b) => a.add(b), new Fr(0)), N = neg.reduce((a, b) => a.add(b.abs()), new Fr(0));
    st.push(`正数相加：${pos.length ? pos.map(v => F(v)).join('+') : '0'} = ${F(P)}；负数的绝对值相加：${neg.length ? neg.map(v => F(v.abs())).join('+') : '0'} = ${F(N)}`);
    st.push(`两部分相减，符号跟绝对值大的一方：${F(P)}${M}${F(N)} = ${(total.n < 0 ? M : '') + F(total.abs())}`);
  } else {
    if (mode === 'mix') st.push('带分数化成假分数：' + joined(sv, v => v.str()));
    const L = sv.reduce((a, v) => lcm(a, v.d), 1);
    if (L > 1) {
      st.push(`通分，分母都化成 ${L}：` + joined(sv, v => `${v.n * (L / v.d)}/${L}`));
      const nums = sv.map(v => v.n * (L / v.d));
      const ns = nums.map((x, i) => (x < 0 ? M + Math.abs(x) : (i ? '+' : '') + x)).join('');
      const tn = nums.reduce((a, b) => a + b, 0);
      st.push(`分子相加：${ns} = ${tn < 0 ? M : ''}${Math.abs(tn)}，得 ${tn < 0 ? M : ''}${Math.abs(tn)}/${L}`);
      if (total.d !== L) st.push(`化简：${(total.n < 0 ? M : '') + F(total.abs())}`);
    }
  }
  return Q(typeId, exprOf(terms, ops), total, mode, st);
}

function mkMulDiv(terms, ops, mode, typeId, pre) {
  const F = (v) => fmtAbs(v, mode);
  const acc = evalMD(terms, ops);
  const neg = terms.filter(t => t.v.n < 0).length, A = terms.map(t => t.v.abs());
  const st = []; if (pre) st.push(pre);
  st.push(`先定符号：共有 ${neg} 个负数，${neg % 2 === 0 ? '偶数个，结果为正' : '奇数个，结果为负'}。`);
  st.push('再算绝对值：' + A.map((a, i) => (i ? ops[i - 1] : '') + F(a)).join(''));
  if (mode === 'frac' || mode === 'mix') {
    const parts = A.map((a, i) => (i === 0 ? a.str() : ops[i - 1] === '×' ? '×' + a.str() : '×' + new Fr(a.d, a.n).str()));
    st.push('除以一个数，等于乘它的倒数（带分数先化成假分数）：' + parts.join(''));
  }
  let r = A[0]; const seq = [];
  for (let i = 1; i < A.length; i++) {
    const nr = ops[i - 1] === '×' ? r.mul(A[i]) : r.div(A[i]);
    seq.push(`${F(r)}${ops[i - 1]}${F(A[i])} = ${F(nr)}`); r = nr;
  }
  st.push('从左到右算：' + seq.join('；'));
  st.push(`加上符号：${(acc.n < 0 ? M : '') + F(acc.abs())}`);
  return Q(typeId, exprOf(terms, ops), acc, mode, st);
}

const FB = () => mkAddSub([T.int(-8), T.int(5), T.int(3)], ['+', '−'], 'num', 'int-addsub');
const randFrac = (dens, maxN) => {
  for (let i = 0; i < 30; i++) {
    const d = pick(dens), nu = ri(1, maxN ? Math.min(maxN, d - 1) : d - 1);
    if (gcd(nu, d) === 1) return T.frac(nu * sgn(), d);
  }
  return T.frac(1, 2);
};
const opsFor = (n, set, need) => { for (let i = 0; i < 40; i++) { const o = Array.from({ length: n - 1 }, () => pick(set)); if (!need || o.includes(need)) return o; } return Array.from({ length: n - 1 }, () => need || set[0]); };

// ---------- 七年级各题型 ----------
const G7 = {
  'int-addsub': (L) => {
    for (let t = 0; t < 300; t++) {
      const n = ri(3, [4, 5, 6][L - 1]), mx = [9, 15, 25][L - 1];
      const terms = Array.from({ length: n }, () => T.int(ri(1, mx) * sgn()));
      const ops = opsFor(n, ['+', '−'], '−');
      if (!terms.some(x => x.v.n < 0)) continue;
      if (Math.abs(evalAS(terms, ops).n) > 30) continue;
      return mkAddSub(terms, ops, 'num', 'int-addsub');
    }
    return FB();
  },
  'int-muldiv': (L) => {
    for (let t = 0; t < 400; t++) {
      const n = L === 3 ? 4 : 3, mx = [9, 12, 15][L - 1];
      let acc = ri(2, mx) * sgn(); const terms = [T.int(acc)], ops = []; let ok = true;
      for (let k = 1; k < n; k++) {
        if (Math.random() < 0.5) { const f = ri(2, mx) * sgn(); acc *= f; terms.push(T.int(f)); ops.push('×'); }
        else {
          const ds = []; for (let d = 2; d <= 12; d++) if (Math.abs(acc) % d === 0) ds.push(d);
          if (!ds.length) { ok = false; break; }
          const d = pick(ds) * sgn(); acc /= d; terms.push(T.int(d)); ops.push('÷');
        }
        if (Math.abs(acc) > 400) { ok = false; break; }
      }
      if (!ok || !ops.includes('÷') || !ops.includes('×') || Math.abs(acc) > 150 || acc === 0) continue;
      return mkMulDiv(terms, ops, 'num', 'int-muldiv');
    }
    return mkMulDiv([T.int(-6), T.int(-4), T.int(-8)], ['×', '÷'], 'num', 'int-muldiv');
  },
  'dec-addsub': (L) => {
    for (let t = 0; t < 300; t++) {
      const n = ri(3, [4, 5, 6][L - 1]), mx = [60, 99, 150][L - 1];
      const terms = Array.from({ length: n }, () => T.dec(ri(1, mx) * sgn()));
      const ops = opsFor(n, ['+', '−'], '−');
      if (!terms.some(x => x.v.n < 0) || !terms.some(x => x.v.d !== 1)) continue;
      if (Math.abs(evalAS(terms, ops).n / evalAS(terms, ops).d) > 30) continue;
      return mkAddSub(terms, ops, 'dec', 'dec-addsub');
    }
    return FB();
  },
  'dec-muldiv': (L) => {
    for (let t = 0; t < 500; t++) {
      const c = new Fr(pick([2, 3, 4, 5, 6, 8, 12, 15, 25]), 10);
      const q = L === 1 ? new Fr(ri(2, 9)) : new Fr(ri(12, 60), 10);
      const a = c.mul(q), b = new Fr(pick([5, 15, 2, 20, 30, 40, 25]), 10);
      const s1 = sgn(), s2 = sgn(), s3 = sgn();
      const ta = T.d(s1 < 0 ? a.neg() : a), tc = T.d(s2 < 0 ? c.neg() : c), tb = T.d(s3 < 0 ? b.neg() : b);
      if (!ta.s || !tc.s || !tb.s) continue;
      const terms = Math.random() < 0.5 ? [ta, tc, tb] : [ta, tb, tc];
      const ops = terms[1] === tc ? ['÷', '×'] : ['×', '÷'];
      const val = evalMD(terms, ops), d = toDec(val);
      if (!d || (d.split('.')[1] || '').length > 2 || val.abs().cmp(new Fr(60)) > 0 || val.n === 0) continue;
      return mkMulDiv(terms, ops, 'dec', 'dec-muldiv');
    }
    return mkMulDiv([T.d(new Fr(-24, 10)), T.d(new Fr(6, 10)), T.d(new Fr(-15, 10))], ['÷', '×'], 'dec', 'dec-muldiv');
  },
  'frac-addsub': (L) => {
    const dens = [[2, 3, 4, 6], [2, 3, 4, 5, 6, 8, 10], [2, 3, 4, 5, 6, 8, 9, 10, 12]][L - 1], lim = [12, 24, 36][L - 1];
    for (let t = 0; t < 400; t++) {
      const n = L === 1 ? 3 : 4;
      const terms = Array.from({ length: n }, () => randFrac(dens));
      if (terms.reduce((a, x) => lcm(a, x.v.d), 1) > lim) continue;
      const ops = opsFor(n, ['+', '−'], '−');
      const tot = evalAS(terms, ops);
      if (tot.n === 0 || Math.abs(tot.n / tot.d) > 3) continue;
      return mkAddSub(terms, ops, 'frac', 'frac-addsub');
    }
    return mkAddSub([T.frac(-1, 2), T.frac(2, 3), T.frac(3, 4)], ['+', '−'], 'frac', 'frac-addsub');
  },
  'frac-muldiv': (L) => {
    for (let t = 0; t < 500; t++) {
      const n = L === 3 ? 4 : 3;
      const terms = Array.from({ length: n }, () => (Math.random() < 0.2 ? T.int(ri(2, 6) * sgn()) : randFrac([2, 3, 4, 5, 6, 8, 9], L === 1 ? 0 : 9)));
      if (terms.some(x => x.v.n === 0)) continue;
      const ops = opsFor(n, ['×', '÷'], '÷');
      const v = evalMD(terms, ops);
      if (v.d > 24 || Math.abs(v.n) > 40 || v.n === 0 || !terms.some(x => x.v.d !== 1)) continue;
      return mkMulDiv(terms, ops, 'frac', 'frac-muldiv');
    }
    return mkMulDiv([T.frac(-3, 4), T.frac(9, 8), T.frac(-2, 3)], ['÷', '×'], 'frac', 'frac-muldiv');
  },
  mixed: (L) => {
    for (let t = 0; t < 500; t++) {
      const mx = () => { const d = pick([2, 3, 4, 6]); let nu = ri(1, d - 1); while (gcd(nu, d) !== 1) nu = ri(1, d - 1); return T.mix(ri(1, 4), nu, d, Math.random() < 0.5); };
      if (Math.random() < 0.5) {
        const n = L === 1 ? 3 : 4;
        const terms = Array.from({ length: n }, (_, k) => (k === n - 1 && Math.random() < 0.6 ? T.int(ri(1, 8) * sgn()) : mx()));
        const ops = opsFor(n, ['+', '−'], '−');
        if (terms.reduce((a, x) => lcm(a, x.v.d), 1) > 12) continue;
        if (Math.abs(evalAS(terms, ops).n / evalAS(terms, ops).d) > 12) continue;
        return mkAddSub(terms, ops, 'mix', 'mixed');
      }
      const first = mx(); const second = randFrac([2, 3, 4, 6, 8, 9], 9); const third = randFrac([2, 3, 4, 6], 3);
      const terms = [first, second, third], ops = Math.random() < 0.5 ? ['×', '÷'] : ['÷', '×'];
      const v = evalMD(terms, ops);
      if (v.d > 12 || Math.abs(v.n) > 40 || v.n === 0) continue;
      return mkMulDiv(terms, ops, 'mix', 'mixed');
    }
    return FB();
  },
  'abs-pow': (L) => {
    const kind = pick(L === 1 ? ['A', 'B'] : ['A', 'B', 'C', 'E']);
    for (let t = 0; t < 500; t++) {
      if (kind === 'A') {
        const useFrac = L > 1 && Math.random() < 0.5;
        if (!useFrac) {
          const x = ri(5, 90), first = { v: new Fr(x, 10), s: `|${M}${(x / 10).toFixed(1)}|`, raw: true };
          const terms = [first, ...Array.from({ length: 3 }, () => (Math.random() < 0.3 ? T.int(ri(1, 12) * sgn()) : T.dec(ri(1, 99) * sgn())))];
          const ops = opsFor(4, ['+', '−'], '−');
          const tot = evalAS(terms, ops);
          if (Math.abs(tot.n / tot.d) > 15) continue;
          return mkAddSub(terms, ops, 'dec', 'abs-pow', `先去绝对值：|${M}${(x / 10).toFixed(1)}| = ${(x / 10).toFixed(1).replace(/\.0$/, '')}`);
        }
        const f = randFrac([2, 4, 3]); const fa = f.v.abs();
        const first = { v: fa, s: `|${M}${f.s}|`, raw: true };
        const terms = [first, randFrac([2, 4, 3]), randFrac([2, 4, 3]), randFrac([2, 4, 3])], ops = opsFor(4, ['+', '−'], '−');
        if (terms.reduce((a, x) => lcm(a, x.v.d), 1) > 12) continue;
        return mkAddSub(terms, ops, 'frac', 'abs-pow', `先去绝对值：|${M}${f.s}| = ${f.s}`);
      }
      if (kind === 'B') {
        const b = pick(L === 1 ? [2] : [2, 3]), k = pick(L === 1 ? [2, 3] : [2, 3, 4]);
        const pv = new Fr(-b).pow(k);
        const first = { v: pv, s: `(${M}${b})${SUP[k]}`, raw: true };
        const p = Math.random() < 0.3 ? T.int(ri(2, 5) * sgn()) : randFrac([2, 3, 4, 6, 8], 5);
        const q = Math.random() < 0.3 ? T.int(ri(2, 4) * sgn()) : randFrac([2, 3, 4, 6]);
        const terms = [first, p, q], ops = Math.random() < 0.5 ? ['×', '÷'] : ['÷', '×'];
        const v = evalMD(terms, ops);
        if (v.d > 12 || Math.abs(v.n) > 100 || v.n === 0) continue;
        return mkMulDiv(terms, ops, 'frac', 'abs-pow', `先算乘方：(${M}${b})${SUP[k]} = ${pv.n < 0 ? M : ''}${Math.abs(pv.n)}（负数的${k % 2 ? '奇' : '偶'}次方是${k % 2 ? '负' : '正'}数）`);
      }
      if (kind === 'C') {
        const b = pick([2, 3, 4, 5, 6]), a = b * ri(2, 9), c = pick([2, 3, 4]), d = pick([2, 3, 4, 5]);
        const stem = `${a}÷(${M}${b})+(${M}${c})${SUP[2]}×${d}`, x = a / b, y = c * c * d, r = -x + y;
        return Q('abs-pow', stem, new Fr(r), 'num', [
          `先算乘方：(${M}${c})² = ${c * c}（负数的偶次方是正数）`,
          `再算乘除：${a}÷(${M}${b}) = ${M}${x}；${c * c}×${d} = ${y}`,
          `最后算加减：(${M}${x})+${y} = ${r < 0 ? M : ''}${Math.abs(r)}`]);
      }
      const x = ri(2, 5), y = ri(2, 9), z = ri(2, 5), w = ri(1, 9) * sgn();
      const stem = `(${M}${x})²${M}|${M}${y}|×${z}${w < 0 ? `+(${M}${-w})` : `+${w}`}`, r = x * x - y * z + w;
      return Q('abs-pow', stem, new Fr(r), 'num', [
        `先算乘方和绝对值：(${M}${x})² = ${x * x}，|${M}${y}| = ${y}`,
        `再算乘法：${y}×${z} = ${y * z}`,
        `最后算加减：${x * x}${M}${y * z}${w < 0 ? M + (-w) : '+' + w} = ${r < 0 ? M : ''}${Math.abs(r)}`]);
    }
    return FB();
  },
  basic: (L) => {
    const kind = pick(['opp', 'abs', 'cmp', 'cmp']);
    const rnd = () => {
      const r = Math.random();
      if (r < 0.35 || L === 1 && r < 0.6) return { t: T.int(ri(1, 20) * sgn()), mode: 'num' };
      if (r < 0.65) return { t: T.dec(ri(11, 99) * sgn()), mode: 'dec' };
      return { t: randFrac(L === 1 ? [2, 3, 4] : [2, 3, 4, 5, 6, 8]), mode: 'frac' };
    };
    const sd = (t) => (t.v.n < 0 ? M : '') + t.s;
    if (kind === 'opp') {
      const { t, mode } = rnd(); const v = t.v.neg();
      return Q('basic', `${sd(t)} 的相反数是？`, v, mode, [`相反数只改变符号：${sd(t)} 的相反数是 ${(v.n < 0 ? M : '') + t.s}`]);
    }
    if (kind === 'abs') {
      const { t, mode } = rnd(); const form = pick(L === 1 ? [0, 1] : [0, 1, 2]);
      if (form === 0) return Q('basic', `|${sd(t)}| = ？`, t.v.abs(), mode, ['绝对值：离原点的距离，永远不是负数。', `|${sd(t)}| = ${t.s}`]);
      if (form === 1) return Q('basic', `${M}|${sd(t)}| = ？`, t.v.abs().neg(), mode, ['先算绝对值，再添上前面的负号。', `|${sd(t)}| = ${t.s}，所以 ${M}|${sd(t)}| = ${M}${t.s}`]);
      return Q('basic', `${M}(${sd(t)}) = ？`, t.v.neg(), mode, ['负号放在括号前面，就是求相反数。', `${M}(${sd(t)}) = ${(t.v.neg().n < 0 ? M : '') + t.s}`]);
    }
    for (let i = 0; i < 100; i++) {
      const a = rnd(), b = rnd();
      if (a.mode !== b.mode || a.t.v.eq(b.t.v)) continue;
      const c = a.t.v.cmp(b.t.v), rel = c > 0 ? '>' : '<';
      const A = sd(a.t), B = sd(b.t);
      let why;
      if (a.t.v.n < 0 && b.t.v.n < 0) why = `两个负数比较，绝对值大的反而小。|${A}| = ${a.t.s}，|${B}| = ${b.t.s}，${a.t.v.abs().cmp(b.t.v.abs()) > 0 ? a.t.s + '>' + b.t.s : a.t.s + '<' + b.t.s}，所以 ${A} ${rel} ${B}`;
      else if (a.t.v.n >= 0 && b.t.v.n >= 0) why = `两个正数直接比大小：${A} ${rel} ${B}`;
      else why = `正数大于负数：${A} ${rel} ${B}`;
      return { type: 'choice', typeId: 'basic', stem: `比较大小：${A}  ○  ${B}`, options: ['>', '<', '='], answer: rel === '>' ? 'A' : 'B', pts: 1, why: `${why}\n答案：${rel}`, id: 'r-basic-cmp-' + hash(A + '|' + B) };
    }
    return FB();
  },
  distribute: (L) => {
    if (Math.random() < 0.65) {
      for (let t = 0; t < 300; t++) {
        const ds = shuf([2, 3, 4, 6, 8, 12, 9, 5, 10]).slice(0, 3);
        const lc = ds.reduce((a, d) => lcm(a, d), 1); if (lc > 36) continue;
        const N = lc * ri(1, L === 3 ? 3 : 2) * sgn();
        const nums = ds.map(d => (L === 3 && Math.random() < 0.4 && d > 2 ? 2 : 1)).map((x, i) => (gcd(x, ds[i]) === 1 ? x : 1));
        const sg = [1, sgn(), sgn()];
        if (!sg.includes(-1)) continue;
        const parts = ds.map((d, i) => ({ s: sg[i], n: nums[i], d }));
        const fr = (p) => `${p.n}/${p.d}`;
        const inside = parts.map((p, i) => (i === 0 ? (p.s < 0 ? M : '') : (p.s < 0 ? M : '+')) + fr(p)).join('');
        const NS = N < 0 ? `(${M}${-N})` : String(N);
        const stem = `${NS}×(${inside})`;
        const prods = parts.map(p => N * p.s * p.n / p.d);
        const val = prods.reduce((a, b) => a + b, 0);
        const sep = (arr) => arr.map((x, i) => (x < 0 ? M + (-x) : (i ? '+' : '') + x)).join('');
        return Q('distribute', stem, new Fr(val), 'num', [
          `用乘法分配律，把 ${NS} 分别乘进括号里的每一项：` + parts.map((p, i) => (i ? (p.s < 0 ? M : '+') : (p.s < 0 ? M : '')) + `${NS}×${fr(p)}`).join(''),
          `分别算出每一项：${sep(prods)}`,
          `相加：${sep(prods)} = ${val < 0 ? M : ''}${Math.abs(val)}`]);
      }
    }
    const a = pick([13, 17, 19, 23, 25, 36, 48, 75]), [b, c] = pick([[6, 4], [7, 3], [8, 2], [12, 8], [15, 5], [18, 2], [35, 65], [27, 73]]);
    const neg = Math.random() < 0.5;
    const stem = neg ? `${a}×(${M}${b})+${a}×(${M}${c})` : `${a}×${b}+${a}×${c}`;
    const val = (neg ? -1 : 1) * a * (b + c);
    return Q('distribute', stem, new Fr(val), 'num', [
      `反过来用乘法分配律，把相同的因数 ${a} 提出来：${a}×[${neg ? `(${M}${b})+(${M}${c})` : `${b}+${c}`}]`,
      `先算括号里：${neg ? `(${M}${b})+(${M}${c}) = ${M}${b + c}` : `${b}+${c} = ${b + c}`}`,
      `再相乘：${a}×${neg ? M : ''}${b + c} = ${neg ? M : ''}${a * (b + c)}`]);
  },
};
export const T7 = [
  { id: 'int-addsub', name: '整数加减' }, { id: 'int-muldiv', name: '整数乘除' },
  { id: 'dec-addsub', name: '小数加减' }, { id: 'dec-muldiv', name: '小数乘除' },
  { id: 'frac-addsub', name: '分数加减' }, { id: 'frac-muldiv', name: '分数乘除' },
  { id: 'mixed', name: '带分数' }, { id: 'abs-pow', name: '绝对值与乘方' },
  { id: 'basic', name: '相反数·绝对值·比大小' }, { id: 'distribute', name: '简便运算' },
];

// ---------- 四年级口算 ----------
const q4 = (typeId, stem, ans, why) => ({ type: 'math', typeId, stem, answer: String(ans), why: why + `\n答案：${ans}`, pts: 1, id: 'r-' + typeId + '-' + hash(stem), digits: true });
const G4 = {
  add: (L) => { const [lo, hi] = [[10, 99], [100, 999], [1000, 9999]][L - 1]; const a = ri(lo, hi), b = ri(lo, hi); return q4('add', `${a}+${b}`, a + b, `${a}+${b}：相同数位对齐，从个位加起，满十进一。`); },
  sub: (L) => { const [lo, hi] = [[10, 99], [100, 999], [1000, 9999]][L - 1]; let a = ri(lo, hi), b = ri(lo, hi); if (b > a) [a, b] = [b, a]; return q4('sub', `${a}−${b}`, a - b, `${a}−${b}：相同数位对齐，从个位减起，不够减就向前一位借 1 当 10。`); },
  mul: (L) => {
    if (L < 3) {
      const a = L === 1 ? ri(11, 99) : ri(101, 999), b = ri(2, 9);
      const parts = String(a).split('').map((c, i, arr) => parseInt(c, 10) * Math.pow(10, arr.length - 1 - i)).filter(x => x);
      return q4('mul', `${a}×${b}`, a * b, `把 ${a} 拆开分别乘：` + parts.map(p => `${p}×${b}=${p * b}`).join('，') + `，加起来是 ${a * b}。`);
    }
    const a = ri(12, 99), b = ri(12, 49), bt = Math.floor(b / 10) * 10, bo = b % 10;
    return q4('mul', `${a}×${b}`, a * b, `把 ${b} 拆成 ${bt}+${bo}：${a}×${bt}=${a * bt}${bo ? `，${a}×${bo}=${a * bo}` : ''}，相加得 ${a * b}。`);
  },
  div: (L) => {
    let a, b, qv;
    if (L === 1) { b = ri(2, 9); qv = ri(2, Math.floor(99 / b)); } else if (L === 2) { b = ri(2, 9); qv = ri(20, Math.floor(999 / b)); } else { b = ri(11, 25); qv = ri(5, 40); }
    a = b * qv; return q4('div', `${a}÷${b}`, qv, `想乘法口诀：${b}×${qv}=${a}，所以 ${a}÷${b}=${qv}。`);
  },
  mix: (L) => {
    if (L === 1) { const a = ri(5, 50), b = ri(2, 9), c = ri(2, 9); return q4('mix', `${a}+${b}×${c}`, a + b * c, `先算乘法：${b}×${c}=${b * c}；再算加法：${a}+${b * c}=${a + b * c}。`); }
    if (L === 2) {
      if (Math.random() < 0.5) { const a = ri(5, 40), b = ri(5, 40), c = ri(2, 9); return q4('mix', `(${a}+${b})×${c}`, (a + b) * c, `先算括号里的：${a}+${b}=${a + b}；再算乘法：${a + b}×${c}=${(a + b) * c}。`); }
      const a = ri(5, 30), b = ri(3, 9), c = ri(2, a * b - 1); return q4('mix', `${a}×${b}−${c}`, a * b - c, `先算乘法：${a}×${b}=${a * b}；再算减法：${a * b}−${c}=${a * b - c}。`);
    }
    if (Math.random() < 0.5) { const c = ri(2, 9), qv = ri(3, 12), b = ri(5, 30), a = b + c * qv; return q4('mix', `(${a}−${b})÷${c}`, qv, `先算括号里的：${a}−${b}=${a - b}；再算除法：${a - b}÷${c}=${qv}。`); }
    const a = ri(10, 60), b = ri(3, 9), c = ri(3, 9), d = ri(2, 30); const v = a + b * c - d;
    if (v < 0) return G4.mix(3);
    return q4('mix', `${a}+${b}×${c}−${d}`, v, `先算乘法：${b}×${c}=${b * c}；再从左到右：${a}+${b * c}=${a + b * c}，${a + b * c}−${d}=${v}。`);
  },
  fast: (L) => {
    if (L === 1) { const n = ri(11, 99); return Math.random() < 0.5 ? q4('fast', `${n}×10`, n * 10, `乘 10，就是在 ${n} 的后面添一个 0。`) : q4('fast', `${n * 10}÷10`, n, `除以 10，就是去掉末尾的一个 0。`); }
    if (L === 2) { const n = ri(11, 99); return Math.random() < 0.5 ? q4('fast', `${n}×100`, n * 100, `乘 100，就是在 ${n} 的后面添两个 0。`) : q4('fast', `${n * 100}÷100`, n, `除以 100，就是去掉末尾的两个 0。`); }
    const a = ri(2, 30), b = pick([20, 30, 50, 40]);
    return q4('fast', `${a}×${b}`, a * b, `先算 ${a}×${b / 10}=${a * b / 10}，再添一个 0，得 ${a * b}。`);
  },
};
export const T4 = [{ id: 'add', name: '加法' }, { id: 'sub', name: '减法' }, { id: 'mul', name: '乘法' }, { id: 'div', name: '除法' }, { id: 'mix', name: '混合运算' }, { id: 'fast', name: '速算' }];


// ---------- 二年级口算 ----------
const q2 = (typeId, stem, ans, why) => ({ type: 'math', typeId, stem, answer: String(ans), why: why + `\n答案：${ans}`, pts: 1, id: 'r-' + typeId + '-' + hash(stem), digits: true });
const G2 = {
  add: (L) => { let a, b; do { a = ri(L === 1 ? 10 : 11, L === 1 ? 50 : 89); b = ri(L === 1 ? 2 : 11, L === 1 ? 9 : 89); } while (a + b > 99 || (L === 3 && (a % 10) + (b % 10) < 10)); return q2('add', `${a}+${b}`, a + b, `${a}+${b}：个位加个位${(a % 10) + (b % 10) >= 10 ? '，满十要向十位进 1' : ''}，十位再加，得 ${a + b}。`); },
  sub: (L) => { let a, b; do { a = ri(20, 99); b = ri(L === 1 ? 2 : 11, L === 1 ? 9 : a - 1); } while (b >= a || (L === 3 && (a % 10) >= (b % 10))); return q2('sub', `${a}−${b}`, a - b, `${a}−${b}：${(a % 10) < (b % 10) ? '个位不够减，向十位借 1 当 10，' : ''}得 ${a - b}。`); },
  mul: (L) => { const hi = L === 1 ? 5 : 9, a = ri(2, hi), b = ri(2, hi); return q2('mul', `${a}×${b}`, a * b, `想乘法口诀：${Math.min(a, b)}×${Math.max(a, b)}=${a * b}。`); },
  div: (L) => { const hi = L === 1 ? 5 : 9, a = ri(2, hi), q = ri(2, hi); return q2('div', `${a * q}÷${a}`, q, `想口诀：${a}×${q}=${a * q}，所以 ${a * q}÷${a}=${q}。`); },
  mix: (L) => {
    if (L === 1) { const a = ri(10, 40), b = ri(5, 30), c = ri(2, 20); return q2('mix', `${a}+${b}+${c}`, a + b + c, `从左往右：${a}+${b}=${a + b}，${a + b}+${c}=${a + b + c}。`); }
    if (L === 2) { const a = ri(60, 99), b = ri(5, 30), c = ri(2, 25); return q2('mix', `${a}−${b}−${c}`, a - b - c, `从左往右：${a}−${b}=${a - b}，${a - b}−${c}=${a - b - c}。`); }
    const a = ri(2, 9), b = ri(2, 9), c = ri(1, 20); return q2('mix', `${a}×${b}+${c}`, a * b + c, `先算乘法：${a}×${b}=${a * b}；再加 ${c}，得 ${a * b + c}。`);
  },
};
export const T2 = [{ id: 'add', name: '加法' }, { id: 'sub', name: '减法' }, { id: 'mul', name: '乘法口诀' }, { id: 'div', name: '除法口诀' }, { id: 'mix', name: '连加连减·乘加' }];

// ---------- 英语词汇 ----------
const vocabQ = (kind, list) => {
  const w = pick(list), pool = shuf(list.filter(x => x.en !== w.en)).slice(0, 3);
  const letters = (s) => s.replace(/[^A-Za-z]/g, '');
  if (kind === 'spell') {
    return { type: 'fill', typeId: 'v-spell', stem: `「${w.zh}」的英文是：____`, answers: [[w.en]], hint: `首字母 ${w.en[0]}，共 ${letters(w.en).length} 个字母`, pts: 1, id: 'r-v-spell-' + w.en.toLowerCase(), why: `${w.zh} 的英文是 ${w.en}` };
  }
  const en2zh = kind === 'en2zh';
  const opts = shuf([w, ...pool]);
  return {
    type: 'choice', typeId: 'v-' + kind, pts: 1, id: `r-v-${kind}-` + w.en.toLowerCase(),
    stem: en2zh ? `“${w.en}” 的意思是？` : `「${w.zh}」用英语怎么说？`,
    options: opts.map(o => (en2zh ? o.zh : o.en)), answer: 'ABCD'[opts.indexOf(w)], why: `${w.en} 的意思是「${w.zh}」`,
  };
};
export const TV = [{ id: 'en2zh', name: '看英文选中文' }, { id: 'zh2en', name: '看中文选英文' }, { id: 'spell', name: '拼写' }];

export const TW = [{ id: 'e-en2zh', name: '看英文选中文' }, { id: 'e-zh2en', name: '看中文选英文' }, { id: 'e-listen', name: '听音选中文' }, { id: 'e-spell', name: '拼写（只考黑体词）' }, { id: 'e-dict', name: '听写（只考黑体词）' }];
export const TS = [{ id: 'e-en2zh', name: '看英文选中文' }, { id: 'e-zh2en', name: '看中文选英文' }, { id: 'e-listen', name: '听音选中文' }, { id: 'e-cloze', name: '句子填空' }];

import { CHAP_TYPES } from './chapgen.js';
import { CHAP4_TYPES } from './chapgen4.js';
import { CHAP2_TYPES } from './chapgen2.js';
export const RANDOM = {
  chap2: { title: '二年级数学章节练习', icon: '📐', subject: 'chap2', types: CHAP2_TYPES, levels: ['简单', '适中', '挑战'] },
  math2: { title: '口算随机练习', icon: '🎲', subject: 'math2', types: T2, levels: ['简单', '适中', '挑战'], gen: (t, l) => G2[t](l) },
  cnw2: { title: '词语听写', icon: '✍️', subject: 'cnw', types: [], levels: null },
  chap4: { title: '四年级数学章节练习', icon: '📐', subject: 'chap4', types: CHAP4_TYPES, levels: ['简单', '适中', '挑战'] },
  chap7: { title: '七年级数学章节练习', icon: '📐', subject: 'chap7', types: [...CHAP_TYPES.filter(t => t.cid === 'c1'), ...T7.map(t => ({ id: 'm7-c2-' + t.id.replace('-', ''), name: t.name, cid: 'c2' })), ...CHAP_TYPES.filter(t => t.cid !== 'c1')], levels: ['简单', '适中', '挑战'] },
  math7: { title: '有理数随机练习', icon: '🎲', subject: 'math7', types: T7, levels: ['简单', '适中', '挑战'], gen: (t, l) => G7[t](l) },
  math4: { title: '口算随机练习', icon: '🎲', subject: 'math4', types: T4, levels: ['简单', '适中', '挑战'], gen: (t, l) => G4[t](l) },
  vocab7: { title: '英语单词小测', icon: '🔤', subject: 'vocab7', types: TW, levels: null },
  phrase7: { title: '英语短语小测', icon: '💬', subject: 'phrase7', types: TW, levels: null },
  vocab4: { title: '英语单词小测', icon: '🔤', subject: 'vocab4', types: TW, levels: null },
  phrase4: { title: '英语短语小测', icon: '💬', subject: 'phrase4', types: TW, levels: null },
  cnw4: { title: '词语听写', icon: '✍️', subject: 'cnw', types: [], levels: null },
  sent4: { title: '英语句子小测', icon: '📝', subject: 'sent4', types: TS, levels: null },
};

export const weighted = (ids, stats) => {
  const w = ids.map(id => { const s = stats[id] || { n: 0, w: 0 }; return 1 + 4 * (s.w + 1) / (s.n + 2); });
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ids.length; i++) { r -= w[i]; if (r <= 0) return ids[i]; }
  return ids[ids.length - 1];
};

export function makeSession(kind, typeId, level, count, stats, vocabList) {
  const R = RANDOM[kind], ids = R.types.map(t => t.id), out = [], seen = new Set();
  for (let g = 0; out.length < count && g < count * 40; g++) {
    const tid = typeId === 'mix' ? weighted(ids, stats || {}) : typeId;
    const q = R.gen(tid, level, vocabList);
    if (!q || seen.has(q.id)) continue;
    seen.add(q.id); out.push(q);
  }
  return out;
}

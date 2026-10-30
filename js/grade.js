// 判分：分数、小数、带分数的解析与比较，英文答案的规范化
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; };

export class Fr {
  constructor(n, d = 1) {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d);
    this.n = n / g; this.d = d / g;
  }
  add(o) { return new Fr(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { return new Fr(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { return new Fr(this.n * o.n, this.d * o.d); }
  div(o) { return new Fr(this.n * o.d, this.d * o.n); }
  neg() { return new Fr(-this.n, this.d); }
  abs() { return new Fr(Math.abs(this.n), this.d); }
  pow(k) { let r = new Fr(1); for (let i = 0; i < k; i++) r = r.mul(this); return r; }
  eq(o) { return this.n === o.n && this.d === o.d; }
  cmp(o) { return Math.sign(this.n * o.d - o.n * this.d); }
  str() { return this.d === 1 ? String(this.n) : this.n + '/' + this.d; }
  mixed() {
    if (this.d === 1) return String(this.n);
    const a = Math.abs(this.n), w = Math.floor(a / this.d), r = a % this.d, s = this.n < 0 ? '-' : '';
    return w ? `${s}${w}又${r}/${this.d}` : `${s}${r}/${this.d}`;
  }
}

// 把学生输入解析成分数。支持：-3  −3  1/12  2又1/2  2 1/2  0.25  -1.2
export function parseNum(raw) {
  if (raw == null) return null;
  let s = String(raw).trim().replace(/[−－—–]/g, '-').replace(/／/g, '/').replace(/[．。]/g, '.').replace(/\s+/g, ' ');
  if (!s) return null;
  if (s[0] === '+') s = s.slice(1);
  let m;
  if ((m = /^(-?)(\d+)\.(\d+)$/.exec(s))) {
    const k = m[3].length; if (k > 8) return null;
    const v = new Fr(parseInt(m[2] + m[3], 10), Math.pow(10, k));
    return { v: m[1] ? v.neg() : v, form: 'dec', simplest: true };
  }
  if ((m = /^(-?)(\d+)$/.exec(s))) {
    const v = new Fr(parseInt(m[2], 10)); return { v: m[1] ? v.neg() : v, form: 'int', simplest: true };
  }
  if ((m = /^(-?)(\d+)\/(\d+)$/.exec(s))) {
    const n = parseInt(m[2], 10), d = parseInt(m[3], 10); if (!d) return null;
    const v = new Fr(n, d);
    return { v: m[1] ? v.neg() : v, form: 'frac', simplest: gcd(n, d) === 1 };
  }
  if ((m = /^(-?)(\d+)(?:又| )(\d+)\/(\d+)$/.exec(s))) {
    const w = parseInt(m[2], 10), n = parseInt(m[3], 10), d = parseInt(m[4], 10); if (!d) return null;
    const v = new Fr(w * d + n, d);
    return { v: m[1] ? v.neg() : v, form: 'mixed', simplest: gcd(n, d) === 1 && n < d };
  }
  return null;
}

export function gradeMath(input, answer) {
  const a = parseNum(answer), u = parseNum(input);
  if (!u) return { ok: false, note: '这个答案的写法看不懂（可以用 − / 又 . 和数字）' };
  if (!u.v.eq(a.v)) return { ok: false };
  if (!u.simplest) return { ok: false, note: '数值是对的，但分数要化成最简分数哦' };
  return { ok: true };
}

export const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/[’‘`´]/g, "'").replace(/：/g, ':')
  .replace(/[.,!?;。，！？\s]+$/g, '').replace(/\s+/g, ' ').trim();

const hasWord = (text, w) => new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-z0-9])').test(text);

export function gradeQuestion(q, a) {
  switch (q.type) {
    case 'choice': case 'tf': return { ok: a === q.answer };
    case 'fill': {
      const arr = Array.isArray(a) ? a : [a];
      const ok = q.answers.every((alts, i) => alts.some(x => norm(x) === norm(arr[i])));
      return { ok };
    }
    case 'short': {
      const t = norm(a);
      const ok = (q.accept || []).some(w => hasWord(t, norm(w))) && !(q.reject || []).some(w => hasWord(t, norm(w)));
      return { ok };
    }
    case 'math': return gradeMath(a, q.answer);
    // 排序题：items 按正确顺序存，a 是孩子排出来的 items 下标序列。
    // 只有全部排对才算对——不是苛刻，是因为半对没法进星星/错题本的二值模型。
    case 'order': return { ok: Array.isArray(a) && Array.isArray(q.items) && a.length === q.items.length && a.every((x, i) => x === i) };
    // 简答自评：孩子自己说对没对，结果只用来显示，不发星星也不进错题本
    case 'self': return { ok: a === 'ok' };
  }
  return { ok: false };
}

export function isAnswered(q, a) {
  if (a == null) return false;
  if (q.type === 'fill') return Array.isArray(a) && q.answers.every((_, i) => a[i] && String(a[i]).trim());
  if (q.type === 'order') return Array.isArray(a) && Array.isArray(q.items) && a.length === q.items.length;
  return String(a).trim() !== '';
}

const showMinus = (s) => String(s).replace(/-/g, '−');
export function answerText(q) {
  switch (q.type) {
    case 'choice': return q.answer + '. ' + q.options['ABCD'.indexOf(q.answer)];
    case 'tf': return q.answer === 'T' ? '对 (T)' : '错 (F)';
    case 'fill': return q.answers.map(x => x[0]).join(' ，');
    case 'short': return q.ref || q.accept[0];
    case 'math': return showMinus(q.answer);
    // 不带序号：打印的答案卷前面已经有「1. 」，再带就变成「1. 1. 口腔」
    case 'order': return (q.items || []).join(' → ');
    case 'self': return q.ref || ((q.points || []).join('；') || '见解析');
  }
  return '';
}
export function userText(q, a) {
  if (a == null || a === '' || (Array.isArray(a) && !a.some(Boolean))) return '（没有作答）';
  switch (q.type) {
    case 'choice': return a + '. ' + q.options['ABCD'.indexOf(a)];
    case 'tf': return a === 'T' ? '对 (T)' : '错 (F)';
    case 'fill': return (Array.isArray(a) ? a : [a]).map(x => x || '（空）').join(' ，');
    case 'order': return Array.isArray(a) ? a.map((x, i) => `${i + 1}. ${(q.items || [])[x]}`).join(' → ') : showMinus(a);
    case 'self': return a === 'ok' ? '自评：说对了' : '自评：还要加油';
    default: return showMinus(a);
  }
}

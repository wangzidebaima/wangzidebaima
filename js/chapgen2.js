// 二年级上册数学（北师大版）章节随机出题：100以内加减(二)、测量(一)、数一数与乘法、乘法口诀(一)(二)、分一分与除法、图形的运动(一)、乘除法的应用(一)
import { buildChapSession, chapTypes } from './chapgen.js';
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hash = (s) => { let x = 5381; for (const c of s) x = ((x << 5) + x + c.charCodeAt(0)) >>> 0; return x.toString(36); };
const Q = (typeId, stem, ans, steps, extra) => Object.assign({ type: 'math', typeId, stem, answer: String(ans), pts: 1, id: 'r-' + typeId + '-' + hash(stem), digits: true,
  why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${ans}` }, extra || {});
const MC = (typeId, stem, correct, wrongs, steps) => {
  const ws = [...new Set(wrongs.filter(w => w !== correct))].slice(0, 3); if (ws.length < 2) return null;
  const opts = shuf([correct, ...ws]);
  return { type: 'choice', plain: true, typeId, stem, options: opts, answer: 'ABCD'[opts.indexOf(correct)], pts: 1, id: 'r-' + typeId + '-' + hash(stem),
    why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${correct}` };
};
const CNN = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const THINGS = ['苹果', '铅笔', '糖果', '气球', '小花', '贴画'];

const E1 = [
  { id: 'add', name: '两位数加法', gen: (L) => {
    const form = pick([0, 1]);
    if (form === 0) { let a, b; do { a = ri(11, L === 1 ? 59 : 89); b = ri(11, L === 1 ? 39 : 89); } while (a + b > 99 || (L > 1 && (a % 10) + (b % 10) < 10)); return Q('m2-e1-add', `${a} + ${b} = ?`, a + b, [`个位加个位：${a % 10}+${b % 10}=${(a % 10) + (b % 10)}${(a % 10) + (b % 10) >= 10 ? '，满十向十位进 1' : ''}`, `十位加十位（别忘了进上来的）`, `${a}+${b}=${a + b}`]); }
    const a = ri(20, 70), b = ri(10, 99 - a); return Q('m2-e1-add', `小红有 ${a} 张贴画，小明有 ${b} 张，两人一共有多少张？`, a + b, ['一共 = 两人的合起来，用加法', `${a}+${b}=${a + b}`]); } },
  { id: 'sub', name: '两位数减法', gen: (L) => {
    const form = pick([0, 1]);
    if (form === 0) { let a, b; do { a = ri(21, 99); b = ri(11, a - 1); } while (L > 1 && (a % 10) >= (b % 10)); return Q('m2-e1-sub', `${a} − ${b} = ?`, a - b, [(a % 10) < (b % 10) ? `个位不够减，向十位借 1 当 10：${10 + (a % 10)}-${b % 10}=${10 + (a % 10) - (b % 10)}` : `个位减个位：${a % 10}-${b % 10}=${(a % 10) - (b % 10)}`, '十位再减（借走的要记得少 1）', `${a}-${b}=${a - b}`]); }
    const a = ri(40, 99), b = ri(11, a - 10); return Q('m2-e1-sub', `书架上有 ${a} 本书，借走了 ${b} 本，还剩多少本？`, a - b, ['还剩 = 原来的 − 借走的，用减法', `${a}-${b}=${a - b}`]); } },
  { id: 'chain', name: '连加连减', gen: (L) => {
    if (Math.random() < 0.5) { const a = ri(10, 40), b = ri(10, 30), c = ri(5, 99 - a - b > 5 ? Math.min(25, 99 - a - b) : 5); const t = a + b + c; if (t > 99) return null; return Q('m2-e1-chain', `${a} + ${b} + ${c} = ?`, t, ['从左往右一步一步算', `${a}+${b}=${a + b}`, `${a + b}+${c}=${t}`]); }
    const a = ri(60, 99), b = ri(5, 30), c = ri(5, Math.min(30, a - b - 1)); return Q('m2-e1-chain', `${a} − ${b} − ${c} = ?`, a - b - c, ['从左往右一步一步算', `${a}-${b}=${a - b}`, `${a - b}-${c}=${a - b - c}`]); } },
  { id: 'guess', name: '猜数游戏', gen: () => {
    const form = pick([0, 1]);
    if (form === 0) { const x = ri(11, 60), d = ri(5, 30); return Q('m2-e1-guess', `一个数加上 ${d} 得 ${x + d}，这个数是多少？`, x, ['求加数：用和减去已知的加数', `${x + d}-${d}=${x}`]); }
    const x = ri(30, 80), d = ri(5, 25); return Q('m2-e1-guess', `一个数减去 ${d} 得 ${x - d}，这个数是多少？`, x, ['求被减数：用差加上减数', `${x - d}+${d}=${x}`]); } },
];
const E2 = [
  { id: 'unit', name: '厘米和米', gen: () => {
    const items = [['一支新铅笔的长度', '厘米', ['米', '千克', '个']], ['教室门的高度', '米', ['厘米', '克', '个']], ['数学书的宽度', '厘米', ['米', '升', '个']], ['一棵大树的高度', '米', ['厘米', '克', '个']], ['课桌的高度', '厘米', ['米', '升', '个']], ['操场跑道一圈', '米', ['厘米', '克', '个']]];
    const x = pick(items); return MC('m2-e2-unit', `${x[0]}用什么单位合适？`, x[1], x[2], ['想一想这个物体大约有多长', `用 ${x[1]} 比较合适`]); } },
  { id: 'conv', name: '米和厘米换算', gen: (L) => {
    if (Math.random() < 0.5) { const m = ri(1, L === 1 ? 5 : 9); return Q('m2-e2-conv', `${m} 米 = ____ 厘米`, m * 100, ['1 米 = 100 厘米', `${m}×100=${m * 100}`]); }
    const m = ri(1, 9); return Q('m2-e2-conv', `${m * 100} 厘米 = ____ 米`, m, ['100 厘米 = 1 米', `${m * 100}÷100=${m}`]); } },
  { id: 'len', name: '长度计算', gen: (L) => {
    if (Math.random() < 0.5) { const a = ri(10, 60), b = ri(10, 90 - a); return Q('m2-e2-len', `一根绳子长 ${a} 厘米，接上 ${b} 厘米后，一共长多少厘米？`, a + b, ['接上就是合起来，用加法', `${a}+${b}=${a + b}`]); }
    const a = ri(40, 99), b = ri(10, a - 10); return Q('m2-e2-len', `一根彩带长 ${a} 厘米，剪去 ${b} 厘米，还剩多少厘米？`, a - b, ['剪去用减法', `${a}-${b}=${a - b}`]); } },
  { id: 'cmp', name: '比一比长短', gen: () => {
    const a = ri(1, 9), b = ri(20, 190); const A = a + ' 米', B = b + ' 厘米'; const rel = a * 100 > b ? '>' : a * 100 < b ? '<' : '=';
    return MC('m2-e2-cmp', `${A} ○ ${B}，○ 里应填？`, rel, ['>', '<', '='], ['先统一单位：1 米 = 100 厘米', `${a} 米 = ${a * 100} 厘米，再和 ${b} 厘米比`]); } },
];
const E3 = [
  { id: 'groups', name: '几个几', gen: (L) => {
    const a = ri(2, 5), b = ri(2, L === 1 ? 5 : 9); return Q('m2-e3-groups', `${b} 个 ${a} 相加，用乘法算是 ${a} × ${b} = ?`, a * b, [`${b} 个 ${a} 相加：${Array(b).fill(a).join('+')}`, `${a}×${b}=${a * b}`]); } },
  { id: 'row', name: '每行几个', gen: () => {
    const r = ri(2, 6), c = ri(2, 6), t = pick(THINGS); return Q('m2-e3-row', `盘子里的${t}摆成 ${r} 行，每行 ${c} 个，一共有多少个？`, r * c, ['每行 c 个，r 行，用乘法', `${c}×${r}=${c * r}`]); } },
  { id: 'add2mul', name: '连加改乘法', gen: () => {
    const a = ri(2, 6), n = ri(3, 6); const sum = a * n; return MC('m2-e3-add2mul', `${Array(n).fill(a).join(' + ')} 写成乘法算式是？`, `${a} × ${n}`, [`${n} × ${n}`, `${a} + ${n}`, `${a * n} × ${a}`], [`${n} 个 ${a} 相加`, `${a}×${n}=${sum}`]); } },
  { id: 'times', name: '乘加乘减', gen: () => {
    const a = ri(2, 5), b = ri(2, 5), c = ri(1, 5); return Q('m2-e3-times', `${a} × ${b} + ${c} = ?`, a * b + c, [`先算乘法：${a}×${b}=${a * b}`, `再加 ${c}：${a * b}+${c}=${a * b + c}`]); } },
];
const mulQ = (typeId, lo, hi) => { const a = ri(lo, hi), b = ri(2, 9); const [x, y] = Math.random() < 0.5 ? [a, b] : [b, a]; return Q(typeId, `${x} × ${y} = ?`, x * y, ['想乘法口诀（小的数在前面）', `${Math.min(x, y)} × ${Math.max(x, y)} = ${x * y}`]); };
const E4 = [
  { id: 'mul', name: '2～5 的乘法口诀', gen: () => mulQ('m2-e4-mul', 2, 5) },
  { id: 'fill', name: '口诀填空', gen: () => { const a = ri(2, 5), b = ri(2, 5), p = a * b; return Q('m2-e4-fill', `${a} × ____ = ${p}`, b, [`想口诀：${a} 乘几得 ${p}？`, `${a}×${b}=${p}`]); } },
  { id: 'app', name: '口诀应用题', gen: () => { const a = ri(2, 5), b = ri(2, 5), t = pick(THINGS); return Q('m2-e4-app', `每盒装 ${a} 个${t}，${b} 盒一共有多少个？`, a * b, ['每份 a 个，b 份，用乘法', `${a}×${b}=${a * b}`]); } },
];
const E5 = [
  { id: 'share', name: '平均分', gen: (L) => {
    const n = ri(2, L === 1 ? 5 : 9), q = ri(2, 5 + (L > 1 ? 4 : 0)), t = pick(THINGS); return Q('m2-e5-share', `把 ${n * q} 个${t}平均分给 ${n} 个小朋友，每人分到几个？`, q, ['平均分，求每份是多少，用除法', `${n * q}÷${n}=${q}`]); } },
  { id: 'group', name: '每份几个分几份', gen: () => {
    const n = ri(2, 9), q = ri(2, 9), t = pick(THINGS); return Q('m2-e5-group', `${n * q} 个${t}，每 ${n} 个放一盘，可以放几盘？`, q, ['每份 n 个，求份数，用除法', `${n * q}÷${n}=${q}`]); } },
  { id: 'div', name: '用口诀求商', gen: (L) => {
    const a = ri(2, L === 1 ? 5 : 9), q = ri(2, L === 1 ? 5 : 9); return Q('m2-e5-div', `${a * q} ÷ ${a} = ?`, q, [`想口诀：${a} 乘几得 ${a * q}？`, `${a}×${q}=${a * q}，所以 ${a * q}÷${a}=${q}`]); } },
  { id: 'read', name: '认识除法算式', gen: () => {
    const a = ri(2, 5), q = ri(2, 5), p = a * q; return MC('m2-e5-read', `${p} ÷ ${a} = ${q} 读作？`, `${p}除以${a}等于${q}`, [`${p}乘${a}等于${q}`, `${a}除以${p}等于${q}`, `${p}加${a}等于${q}`], ['除号读作"除以"', '算式从左往右读']); } },
];
const E6 = [
  { id: 'move', name: '平移还是旋转', gen: () => {
    const items = [['电梯上上下下', '平移'], ['火车在笔直的轨道上行驶', '平移'], ['拉抽屉', '平移'], ['推拉窗开关', '平移'], ['风车转动', '旋转'], ['钟表的指针走动', '旋转'], ['摩天轮转动', '旋转'], ['打开瓶盖（拧）', '旋转']];
    const x = pick(items); return MC('m2-e6-move', `${x[0]}，是什么运动？`, x[1], ['平移', '旋转', '对称'].filter(z => z !== x[1]), ['沿直线移动是平移', '绕着一个点或轴转动是旋转']); } },
  { id: 'sym', name: '轴对称图形', gen: () => {
    const yes = ['正方形', '长方形', '圆', '等腰三角形', '蝴蝶', '汉字"中"', '汉字"田"'], no = ['平行四边形', '字母 F', '不规则的叶子形状', '一般的三角形'];
    const a = pick(yes), bs = shuf(no).slice(0, 3); return MC('m2-e6-sym', '下面哪一个是轴对称图形？', a, bs, ['沿一条线对折，两边能完全重合的是轴对称图形']); } },
  { id: 'dir', name: '平移格数', gen: () => {
    const n = ri(2, 7), d = pick(['向右', '向左', '向上', '向下']); return Q('m2-e6-dir', `小旗${d}平移了 ${n} 格，再${d}平移 ${n} 格，一共平移了几格？`, n * 2, ['同一个方向，格数相加', `${n}+${n}=${n * 2}`]); } },
];
const E7 = [
  { id: 'mul', name: '6～9 的乘法口诀', gen: () => mulQ('m2-e7-mul', 6, 9) },
  { id: 'fill', name: '口诀填空', gen: () => { const a = ri(6, 9), b = ri(2, 9), p = a * b; return Q('m2-e7-fill', `${a} × ____ = ${p}`, b, [`想口诀：${a} 乘几得 ${p}？`, `${a}×${b}=${p}`]); } },
  { id: 'cmp', name: '算一算比一比', gen: () => { const a = ri(6, 9), b = ri(2, 9), c = ri(6, 9), d = ri(2, 9); const x = a * b, y = c * d; return MC('m2-e7-cmp', `${a}×${b} ○ ${c}×${d}，○ 里应填？`, x > y ? '>' : x < y ? '<' : '=', ['>', '<', '='], [`${a}×${b}=${x}`, `${c}×${d}=${y}`]); } },
];
const E8 = [
  { id: 'mul', name: '乘法应用题', gen: () => { const a = ri(3, 9), b = ri(3, 9), t = pick(THINGS); return Q('m2-e8-mul', `每个小朋友分 ${a} 个${t}，${b} 个小朋友一共要多少个？`, a * b, ['每人 a 个，b 人，用乘法', `${a}×${b}=${a * b}`]); } },
  { id: 'div', name: '除法应用题', gen: () => { const a = ri(3, 9), b = ri(3, 9), t = pick(THINGS); return Q('m2-e8-div', `${a * b} 个${t}，每 ${a} 个装一袋，能装几袋？`, b, ['总数 ÷ 每份数 = 份数', `${a * b}÷${a}=${b}`]); } },
  { id: 'two', name: '两步应用题', gen: () => { const a = ri(3, 9), b = ri(3, 9), c = ri(1, 9), t = pick(THINGS); const form = pick([0, 1]); if (form === 0) return Q('m2-e8-two', `每盒 ${a} 个${t}，买 ${b} 盒，吃了 ${c} 个，还剩多少个？`, a * b - c, ['先求一共有多少个：乘法', `${a}×${b}=${a * b}`, `再减去吃了的：${a * b}-${c}=${a * b - c}`]);
    return Q('m2-e8-two', `有 ${a * b} 个${t}，每 ${a} 个装一袋，装完后又买了 ${c} 袋，一共有几袋？`, b + c, ['先求装了几袋：除法', `${a * b}÷${a}=${b}`, `再加上买的：${b}+${c}=${b + c}`]); } },
];
export const CH2 = [
  { id: 'e1', name: '100以内数加与减(二)', types: E1 },
  { id: 'e2', name: '测量(一)', types: E2 },
  { id: 'e3', name: '数一数与乘法', types: E3 },
  { id: 'e4', name: '乘法口诀(一)', types: E4 },
  { id: 'e5', name: '分一分与除法', types: E5 },
  { id: 'e6', name: '图形的运动(一)', types: E6 },
  { id: 'e7', name: '乘法口诀(二)', types: E7 },
  { id: 'e8', name: '乘除法的应用(一)', types: E8 },
];
export const CHAP2_TYPES = chapTypes(CH2, 'm2-');

// 列出「语文朗读 MP3」要生成的全部文字。用法：node tools/zh_jobs.mjs  →  输出 JSON：{ 文件码: {t 文字, v 声音, r 语速} }
// 文件码、各处要读的文字怎么拼，都来自 js/zhtext.js（网页用的同一份），所以网页和这里不会对不上。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'js', 'zhtext.js'), 'utf8');
const Z = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
const rd = (...p) => JSON.parse(fs.readFileSync(path.join(root, ...p), 'utf8'));

const XIAOXIAO = 'zh-CN-XiaoxiaoNeural', XIAOYI = 'zh-CN-XiaoyiNeural';
const jobs = {};
const add = (t, v, r) => { t = String(t || ''); if (!/[一-鿿]/.test(t) && !/^[A-D]，$/.test(t)) return; const k = Z.zhKey(t); if (!jobs[k]) jobs[k] = { t, v, r }; };

const sets = fs.readdirSync(path.join(root, 'data', 'sets')).filter(f => f.endsWith('.json')).map(f => rd('data', 'sets', f));
const byId = Object.fromEntries(sets.map(s => [s.id, s]));

// 1. 美文听读：每段、好句
sets.filter(s => s.kind === 'essay').forEach(s => {
  (s.paras || []).forEach(p => add(p, XIAOXIAO, '-8%'));
  (s.sents || []).forEach(x => add(x[0], XIAOXIAO, '-8%'));
});
// 2. 古诗文：每一句
Object.values(rd('data', 'poems.json')).forEach(P => (P.lines || []).forEach(l => add(l.replace(/[ ]+$/, ''), XIAOXIAO, '-10%')));
// 3. 学一学：本单元要点
Object.values(rd('data', 'tips.json')).forEach(T => (T.items || []).forEach(([a, b]) => add(Z.tipSay(a, b), XIAOXIAO, '-5%')));
// 4. 低年级听题：readAloud 用户的科目里每道题；听音选字 sayzh
const cfg = rd('data', 'config.json'), lib = rd('data', 'library.json');
const subj = new Set(); cfg.users.filter(u => u.readAloud).forEach(u => (u.subjects || []).forEach(s => subj.add(s)));
lib.subjects.filter(s => subj.has(s.id)).forEach(s => s.sets.forEach(m => {
  const d = byId[m.id]; if (!d) return;
  (d.sections || []).forEach(sec => (sec.questions || []).forEach(q => {
    if (q.sayzh) add(q.sayzh, XIAOYI, '-25%');
    if (['choice', 'tf', 'fill', 'math'].includes(q.type)) Z.qSayLines(q).forEach(t => add(t, XIAOYI, '-5%'));
  }));
}));
// 5. 一、二年级「随机」数学题（口算、章节题）：每题都是现编的，录不了整句，
//    就录「数字 0～100」和「题目里反复出现的固定句子」，播放时拼起来读（见 js/zhtext.js 的 zhPieces）。
//    随机抽样很多次来收集；抽样里没出现的罕见句子，网页会自动改用手机朗读，不会没声音。
const { RANDOM } = await import(pathToFileURL(path.join(root, 'js', 'mathgen.js')).href);
const N = Number(process.env.ZH_SAMPLES || 600);
const CHS = { chap1: (await import(pathToFileURL(path.join(root, 'js', 'chapgen1.js')).href)).CH1, chap2: (await import(pathToFileURL(path.join(root, 'js', 'chapgen2.js')).href)).CH2 };
const sampleLines = (kind, n) => {
  const R = RANDOM[kind], res = [];
  const gens = CHS[kind] ? CHS[kind].flatMap(c => c.types.map(t => (L) => t.gen(L))) : R.types.map(t => (L) => R.gen(t.id, L));
  for (const g of gens) for (let L = 0; L < 3; L++) for (let i = 0; i < n; i++) {
    let q = null; try { q = g(L); } catch (e) { q = null; }
    if (q && ['choice', 'tf', 'fill', 'math'].includes(q.type)) res.push(...Z.qSayLines(q));
  }
  return res;
};
const dynKinds = [...new Set(cfg.users.filter(u => u.readAloud).flatMap(u => (u.random || []).filter(k => /^(math|chap)\d$/.test(k))))];
for (let n = 0; n <= 100; n++) add(Z.cnNum(n), XIAOYI, '-5%');
for (let h = 1; h <= 9; h++) add(Z.cnNumParts(h * 100)[0], XIAOYI, '-5%');
['零', '一十', '一千'].forEach(x => add(x, XIAOYI, '-5%'));
add('两', XIAOYI, '-5%');
if (!process.env.ZH_NO_DYN) dynKinds.forEach(kind => sampleLines(kind, N).forEach(line => (Z.zhPieces(line) || []).forEach(p => add(p, XIAOYI, '-5%'))));
if (process.env.ZH_COVER) {   // 自测：另抽一批，看有多少句能完全拼出来
  const ready = new Set(Object.keys(jobs)); let all = 0, ok = 0, bad = {};
  dynKinds.forEach(kind => sampleLines(kind, 100).forEach(line => { all++; const ps = Z.zhPieces(line); const miss = ps ? ps.filter(p => !ready.has(Z.zhKey(p))) : ['(拆不开)']; if (!miss.length) ok++; else bad[line] = miss; }));
  console.error(`拼读覆盖：${ok}/${all}（${(ok / all * 100).toFixed(1)}%）；缺：`, Object.entries(bad).slice(0, 15));
}
process.stdout.write(JSON.stringify(jobs));

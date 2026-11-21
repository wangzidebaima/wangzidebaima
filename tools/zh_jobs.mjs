// 列出「语文朗读 MP3」要生成的全部文字。用法：node tools/zh_jobs.mjs  →  输出 JSON：{ 文件码: {t 文字, v 声音, r 语速} }
// 文件码、各处要读的文字怎么拼，都来自 js/zhtext.js（网页用的同一份），所以网页和这里不会对不上。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'js', 'zhtext.js'), 'utf8');
const Z = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
const rd = (...p) => JSON.parse(fs.readFileSync(path.join(root, ...p), 'utf8'));

const XIAOXIAO = 'zh-CN-XiaoxiaoNeural', XIAOYI = 'zh-CN-XiaoyiNeural';
const jobs = {};
const add = (t, v, r) => { t = String(t || ''); if (!/[一-鿿]/.test(t)) return; const k = Z.zhKey(t); if (!jobs[k]) jobs[k] = { t, v, r }; };

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
process.stdout.write(JSON.stringify(jobs));

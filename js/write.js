// 语文写作辅导：每天一个小题目 → 审题 → 列提纲 → 自己写 → 对照清单自评。
// 不打分、不联网、不上传任何内容；草稿只存在本机。统计只记“完成了一篇”，不含题目和文字。
import { h, toast } from './ui.js';
import * as S from './store.js';
import { ev } from './stat.js';
import { mount, page, user } from './views.js';

const T = (t, k) => ({ t, k });
const BANDS = {
  low: { name: '写话', len: '3～5 句话，写完整就好', topics: [
    T('我最喜欢的一种小动物', 'say'), T('今天我和家人做了一件事', 'say'), T('我的好朋友', 'say'), T('下雨天', 'say'), T('我最爱吃的一样东西', 'say'),
    T('一次开心的游戏', 'say'), T('我的小书包（或小房间）', 'say'), T('放学路上看到的', 'say')] },
  mid: { name: '习作', len: '参考 200～300 字，以老师要求为准', topics: [
    T('一件难忘的小事', 'event'), T('我的家人（写出他最特别的地方）', 'person'), T('秋天里的一处风景', 'view'), T('我学会了……', 'event'),
    T('如果我有一双翅膀', 'fancy'), T('一次小小的失败', 'event'), T('我家附近的一个地方', 'view'), T('我的老师', 'person'),
    T('一个有趣的发现', 'event'), T('给远方朋友的一封信', 'fancy')] },
  up: { name: '习作', len: '参考 400 字左右，以老师要求为准', topics: [
    T('那一刻，我长大了', 'event'), T('我最敬佩的一个人', 'person'), T('家乡的一处景物', 'view'), T('一次让我坚持下来的经历', 'event'),
    T('二十年后的家乡', 'fancy'), T('一件让我感动的事', 'event'), T('我心中的英雄', 'person'), T('校园里的一个角落', 'view'),
    T('这件事让我明白了……', 'event'), T('假如我是……', 'fancy')] },
  jr: { name: '作文', len: '参考 500～600 字，以老师和考试要求为准', topics: [
    T('我从中得到了力量', 'event'), T('身边的美好', 'view'), T('一个难忘的人', 'person'), T('那一次，我真正理解了……', 'event'),
    T('坚持的意义', 'think'), T('我与书', 'think'), T('一次改变我的经历', 'event'), T('成长路上的“第一次”', 'event'),
    T('温暖的瞬间', 'event'), T('说“慢”（或“变”）', 'think')] },
};
const KINDS = {
  say: { n: '写话', o: ['谁？在哪里？', '做了什么？（说清先做什么、再做什么）', '心里觉得怎么样？'] },
  event: { n: '记事', o: ['起因：什么时间、什么地方、遇到什么事', '经过：一步一步写，最精彩的地方多写几句（动作、语言、想法）', '结果：事情怎么结束的', '感受：我明白了什么 / 心情怎样'] },
  person: { n: '写人', o: ['他是谁？最突出的特点是什么（用一个词概括）', '用一件具体的事证明这个特点（动作、语言、神态）', '再补一个小细节（外貌或习惯）', '我对他的感受'] },
  view: { n: '写景', o: ['在哪里？什么时间？按什么顺序看（由远到近 / 由上到下）', '抓住 2～3 样景物的颜色、形状、声音、气味', '景物里有什么变化或小故事', '我的感受（喜欢、敬佩、想念……）'] },
  fancy: { n: '想象', o: ['想象的起点：假如……', '发生了什么奇妙的事（要合情合理，有细节）', '最让我难忘的一幕', '结尾：回到现实，说出想法'] },
  think: { n: '感悟', o: ['开头：亮出我的看法或引出话题', '一个具体的事例（亲身经历优先）', '从事例中想到什么：为什么会这样', '联系生活，收束全文，照应开头'] },
};
const CHECK = {
  low: ['每句话都写完整了（有谁、做什么）', '句末都点了句号', '没有写错的字（不会写的字查过了）', '读了一遍，通顺'],
  mid: ['题目里的关键词，文章里都写到了', '开头、经过、结尾都有', '至少有一处写了动作、语言或想法', '用上了 1～2 个积累的好词', '错字、标点检查过一遍', '读出声来，不顺的地方改了'],
  up: ['紧扣题目，没有跑题', '有一个最想写的重点，写得具体', '有动作、语言、神态或心理描写', '开头结尾呼应', '段落分清，每段开头空两格', '错字、标点检查过；读出声改了不顺的句子'],
  jr: ['中心明确，题目中的关键词都扣住了', '选材真实具体，有细节而不是只讲道理', '详略得当：重点处写透', '结构清楚，开头结尾有照应，过渡自然', '语言准确，有一两处自己的表达，不堆砌', '字数够了，错字标点检查过，读出声修改过'],
};
const bandOf = (g) => { const n = '一二三四五六七八九'.indexOf(String(g || '')[0]) + 1; return n <= 2 ? 'low' : n <= 4 ? 'mid' : n <= 6 ? 'up' : 'jr'; };
const dayNo = () => Math.floor(new Date(S.today()).getTime() / 86400000);

function st(u) { const p = S.P(u.id); p.write = p.write || { done: [], cur: null, shift: 0 }; if (!Array.isArray(p.write.done)) p.write.done = []; return p.write; }
const pick = (u, w) => { const b = BANDS[bandOf(u.grade)]; return b.topics[(w.done.length * 3 + w.shift + (dayNo() % 7)) % b.topics.length]; };

export const hasWrite = (u) => (u.subjects || []).some(id => /chinese$/.test(id));
export function writeCard(u) {
  if (!hasWrite(u)) return null;
  const w = st(u);
  return h('a', { class: 'card plain', href: '#/write' }, h('span', { class: 'ic' }, '✍️'), h('b', {}, BANDS[bandOf(u.grade)].name + '辅导'),
    h('small', {}, w.cur ? '写到一半：' + w.cur.t : '审题、列提纲、对照清单'), h('em', {}, `写完 ${w.done.length} 篇`));
}

export function writePage() {
  const u = user(); if (!hasWrite(u)) { location.hash = '#/'; return; }
  const w = st(u), band = bandOf(u.grade), B = BANDS[band];
  if (!w.cur) { const t = pick(u, w); w.cur = { t: t.t, k: t.k, o: [], d: '', c: [] }; S.save(u.id); }
  const cur = w.cur, K = KINDS[cur.k] || KINDS.event;
  const save = () => S.save(u.id);
  const wc = h('small', { class: 'note' });
  const count = () => { wc.textContent = `已写 ${[...cur.d.replace(/\s/g, '')].length} 字（${B.len}）`; };
  const area = (val, rows, ph, on) => { const t = h('textarea', { class: 'sum', rows, placeholder: ph }); t.value = val || ''; t.addEventListener('input', () => { on(t.value); save(); }); return t; };
  const outline = K.o.map((q, i) => h('div', { style: 'margin:8px 0' }, h('b', {}, (i + 1) + '. ' + q), area(cur.o[i], 2, '用几个词或一句话写下来', v => { cur.o[i] = v; })));
  const draft = area(cur.d, band === 'low' ? 6 : 12, '开始写吧，别怕写得不好，写完再改。', v => { cur.d = v; count(); });
  count();
  const checks = CHECK[band].map((c, i) => { const cb = h('input', { type: 'checkbox' }); cb.checked = !!cur.c[i]; cb.addEventListener('change', () => { cur.c[i] = cb.checked; save(); }); return h('label', { style: 'display:flex;gap:8px;align-items:flex-start;margin:6px 0;line-height:1.6' }, cb, h('span', {}, c)); });
  const copy = async () => { try { await navigator.clipboard.writeText(cur.t + '\n\n' + cur.d); toast('已复制，可以发给老师或家长看'); } catch (e) { toast('复制没成功，长按文字手动复制'); } };
  const finish = () => {
    if (!cur.d.trim()) { toast('先写一点再点完成哦'); return; }
    w.done.push({ d: S.today(), t: cur.t, n: [...cur.d.replace(/\s/g, '')].length }); if (w.done.length > 30) w.done = w.done.slice(-30);
    w.cur = null; save(); ev('写作辅导', band); toast('写完一篇，真棒！'); writePage();
  };
  const swap = () => { w.cur = null; w.shift = (w.shift || 0) + 1; save(); writePage(); };
  mount(page(B.name + '辅导', [
    h('h2', { class: 'sh' }, '✍️ ' + cur.t),
    h('p', { class: 'note' }, `类型：${K.n}。${B.len}。`),
    h('h2', { class: 'sh' }, '第一步 审题'),
    h('ol', { class: 'steps' }, h('li', {}, '把题目里最重要的词圈出来，这是文章不能离开的中心。'), h('li', {}, '想一想：我要写谁、写什么事或什么景？'), h('li', {}, '选一个自己真正经历过、记得最清楚的内容。')),
    h('h2', { class: 'sh' }, '第二步 列提纲'), ...outline,
    h('h2', { class: 'sh' }, '第三步 写出来'), draft, wc,
    h('div', { class: 'chips', style: 'margin:8px 0' }, h('button', { type: 'button', class: 'btn', onclick: copy }, '📋 复制文章')),
    h('h2', { class: 'sh' }, '第四步 对照清单自己改'), ...checks,
    h('p', { class: 'note' }, '这里不会给你打分，是帮你养成“先想后写、写完再改”的习惯。写完大声读一遍，最容易发现问题；也可以拿给爸爸妈妈或老师看。'),
    h('button', { type: 'button', class: 'btn primary wide', onclick: finish }, '✅ 这篇写完了'),
    h('div', { class: 'chips', style: 'margin:10px 0' }, h('button', { type: 'button', class: 'btn', onclick: swap }, '换一个题目'), h('a', { class: 'btn', href: '#/search' }, '🔍 找好词好句')),
    w.done.length ? h('p', { class: 'note' }, '最近写完：' + w.done.slice(-3).reverse().map(x => `《${x.t}》${x.n}字`).join('；')) : null], { back: '#/' }));
}

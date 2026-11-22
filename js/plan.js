// 我的计划：考试倒计时 + 今天该做什么 + 薄弱点推荐。全部由孩子自己在本机的做题记录算出来，不联网、不上传。
// 考试日期：九年级用 config 里的中考预计月份；其余年级给「期末预计时间」。学校真正的日期每年不同，
// 孩子或家长可以在页面里改成学校通知的日期（只存在本机）。
import { h, toast } from './ui.js';
import * as S from './store.js';
import { mount, page, user, X } from './views.js';
import { cardBtn } from './cards.js';
import { dueCount } from './learn.js';

const DAY = 86400000;
const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysTo = (date) => Math.round((new Date(date + 'T00:00:00') - new Date(S.today() + 'T00:00:00')) / DAY);

// 默认的「预计」考试：8 月～次年 1 月 → 期末（预计 1 月中旬）；2 月～7 月 → 期末（预计 6 月底）。
// 这只是参考历年的大致时间，各市各校不同，一定要提示以学校通知为准。
function defaultExam(u) {
  if (u.exam && u.exam.date) return { label: u.exam.label || '中考', date: u.exam.date, est: true, monthOnly: !!u.exam.monthOnly };
  const now = new Date(S.today() + 'T00:00:00'), y = now.getFullYear(), m = now.getMonth() + 1;
  if (m >= 8) return { label: '期末考试', date: `${y + 1}-01-15`, est: true, monthOnly: true };
  if (m === 1) return { label: '期末考试', date: `${y}-01-15`, est: true, monthOnly: true };
  return { label: '期末考试', date: `${y}-06-28`, est: true, monthOnly: true };
}
export function getExam(u) {
  const mine = S.P(u.id).myExam;
  if (mine && mine.date) return { label: mine.label || '考试', date: mine.date, est: false, mine: true };
  return defaultExam(u);
}
const examText = (x) => {
  const n = daysTo(x.date);
  if (x.monthOnly) return `${x.label}预计在 ${+x.date.slice(5, 7)} 月${+x.date.slice(5, 7) === 1 ? '中旬' : +x.date.slice(5, 7) === 6 ? '底' : ''}（约 ${Math.max(n, 0)} 天后）`;
  return `距${x.label}还有 ${Math.max(n, 0)} 天（${+x.date.slice(5, 7)}月${+x.date.slice(8, 10)}日）`;
};

// 薄弱点：错题本里按「哪一课 / 哪个题集」归并，错得多、最近错过的排前面
export function weakSpots(u, max = 5) {
  const p = S.P(u.id), by = {};
  Object.values(p.wrong || {}).forEach(e => {
    const m = e.meta || {}, key = m.setId || ((m.sub || '') + '|' + (m.title || '')); if (!m.title && !m.setId) return;
    const o = by[key] = by[key] || { key, setId: m.setId || null, title: m.title || '', sub: m.sub || '', n: 0, last: '' };
    o.n += 1; if ((e.last || e.d || '') > o.last) o.last = e.last || e.d || '';
  });
  return Object.values(by).sort((a, b) => b.n - a.n || (b.last > a.last ? 1 : -1)).slice(0, max);
}
const subjName = (id) => { const s = X.lib && X.lib.subjects.find(x => x.id === id); return s ? (s.icon || '') + ' ' + s.title : ''; };

export function planCard(u) {
  const x = getExam(u), n = daysTo(x.date), ws = weakSpots(u, 1);
  return h('a', { class: 'card plain', href: '#/plan' }, h('span', { class: 'ic' }, '📅'), h('b', {}, '我的计划'),
    h('small', {}, n >= 0 ? examText(x) : '看看今天该做什么'), h('em', {}, ws.length ? `薄弱：${ws[0].title}` : '今日安排'));
}

export function planPage() {
  const u = user(), p = S.P(u.id), x = getExam(u), n = daysTo(x.date), ws = weakSpots(u, 5);
  let words = 0; try { words = dueCount(u.id); } catch (e) { words = 0; }
  const stale = Object.values(p.wrong || {}).filter(e => e.next ? e.next <= S.today() : false).length;
  // 今日安排：离考试越近，越把时间放在复习错题和薄弱点上，不再学太多新东西
  const phase = n <= 7 ? '冲刺' : n <= 30 ? '巩固' : '平时';
  const tips = { 冲刺: '最后一周：不贪新题。每天过一遍错题和知识卡，早点睡，保持作息。', 巩固: '考前一个月：每天把薄弱点的知识卡看一遍，错题到期就做。', 平时: '时间还充裕：按日常任务做，错题和单词到期就复习。' };
  const rows = [];
  if (stale) rows.push(['📕', `错题复习 ${stale} 道`, '#/errors']);
  if (words) rows.push(['🔁', `单词复习 ${words} 个`, '#/learn/review']);
  ws.slice(0, phase === '冲刺' ? 3 : phase === '巩固' ? 2 : 1).forEach(w => rows.push(['🎯', `重点补：${w.title}（${w.n} 道错题）`, w.setId ? '#/set/' + w.setId : '#/errors']));
  rows.push(['🗣️', '挑一课讲给家长听', '#/tell']);
  const inp = h('input', { type: 'date', value: x.mine ? x.date : '' }); const lab = h('input', { type: 'text', placeholder: '考试名称，如：期末考试', value: x.mine ? x.label : '', maxlength: 12 });
  const saveEx = () => { if (!inp.value) { toast('先选一个日期'); return; } p.myExam = { label: lab.value.trim() || '考试', date: inp.value }; S.save(u.id); planPage(); };
  const clearEx = () => { delete p.myExam; S.save(u.id); planPage(); };
  mount(page('我的计划', [
    h('h2', { class: 'sh' }, '⏳ ' + (n >= 0 ? examText(x) : '考试已经过去')),
    h('p', { class: 'note' }, x.est ? '这是参考往年的大致时间，各地各校不同，请以学校或教育局正式通知为准。拿到通知后可以在下面改成准确日期。' : '日期是你自己设置的。'),
    h('h2', { class: 'sh' }, `📋 今日安排（${phase}阶段）`), h('p', { class: 'note' }, tips[phase]),
    h('div', { class: 'list' }, ...rows.map(([ic, t, href]) => h('a', { class: 'row', href }, h('div', {}, h('b', {}, ic + ' ' + t)), h('span', { class: 'chip' }, '去')))),
    h('h2', { class: 'sh' }, '🎯 薄弱点推荐'),
    ws.length ? h('div', { class: 'list' }, ...ws.map(w => h('div', { class: 'row' }, h('div', {}, h('b', {}, w.title || '（未命名）'), h('small', {}, `${subjName(w.sub)} · 错题本里还有 ${w.n} 道`)),
      w.setId ? (cardBtn(w.setId, '#/plan', '📖 知识卡') || h('a', { class: 'chip', href: '#/set/' + w.setId }, '去练')) : h('a', { class: 'chip', href: '#/errors' }, '看错题'))))
      : h('p', { class: 'note' }, '错题本是空的，暂时没有薄弱点，继续保持！'),
    h('h2', { class: 'sh' }, '📆 设置学校通知的考试日期'), lab, inp,
    h('div', { class: 'chips', style: 'margin:8px 0' }, h('button', { type: 'button', class: 'btn primary', onclick: saveEx }, '保存'), x.mine ? h('button', { type: 'button', class: 'btn', onclick: clearEx }, '清除') : null),
    h('p', { class: 'note' }, '薄弱点只是根据错题本算出来的参考，不是评价；这些数据只在这台设备上。')], { back: '#/' }));
}

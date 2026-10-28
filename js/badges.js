// 成就徽章：以「累计」为主，断了也不掉；「连续」类最多 7 天；
// 拿到就永久点亮（store.ach 里存解锁日期），永不撤销。
// 够不着的徽章不显示（比如没有口语科目的孩子，看不到口语徽章）。
import { h } from './ui.js';
import * as S from './store.js';
import { page, mount } from './views.js';

// group: 0 入门 / 1 积累 / 2 挑战；need: 显示该徽章需要的科目
const DEFS = [
  { id: 'first-star', icon: '🌱', name: '第一颗星', desc: '得到第 1 颗星', group: 0 },
  { id: 'first-quiz', icon: '📖', name: '开了个头', desc: '完成第一组练习', group: 0 },
  { id: 'streak2', icon: '🔥', name: '连着两天', desc: '连续 2 天有练习', group: 0 },
  { id: 'stars50', icon: '⭐', name: '小有积蓄', desc: '累计 50 颗星', group: 1 },
  { id: 'stars200', icon: '🌟', name: '星光闪闪', desc: '累计 200 颗星', group: 1 },
  { id: 'stars500', icon: '💫', name: '星星富翁', desc: '累计 500 颗星', group: 1 },
  { id: 'days10', icon: '📅', name: '常来常往', desc: '累计练习 10 天（断了也不掉）', group: 1 },
  { id: 'days30', icon: '🏠', name: '老朋友', desc: '累计练习 30 天', group: 1 },
  { id: 'streak7', icon: '🏅', name: '一周不断', desc: '连续 7 天有练习', group: 2 },
  { id: 'perfect', icon: '🎯', name: '全对一次', desc: '某一组题全部做对', group: 2 },
  { id: 'wrong-zero', icon: '📕', name: '错题清零', desc: '错题本清空一次', group: 2 },
  { id: 'speak3', icon: '🗣', name: '开口说话', desc: '口语打卡 3 次', group: 2, need: 'speaking' },
];
const GROUPS = [['🌱 入门', '一上来就能摸到的'], ['🌟 积累', '慢慢攒，断一天也不掉'], ['🎯 挑战', '拿到就走，永远点亮']];

// user 查找由 app.js 启动时注入（避免和 views 相互依赖打结）
let X_USER = null;
export const setUserLookup = (fn) => { X_USER = fn; };

// 这个孩子可见的徽章（去掉他根本没有的科目）
export const defsFor = (uid) => {
  const u = X_USER && X_USER(uid);
  return DEFS.filter(d => !d.need || (u && (u.subjects || []).some(x => x.endsWith(d.need))));
};
// 满足条件的徽章 id 集合（纯内存计算，很便宜）
function satisfied(uid) {
  const p = S.P(uid), st = S.stats(uid), got = new Set();
  if (st.total >= 1) got.add('first-star');
  if (p.log.length >= 1) got.add('first-quiz');
  if (S.streak(uid) >= 2) got.add('streak2');
  if (st.total >= 50) got.add('stars50');
  if (st.total >= 200) got.add('stars200');
  if (st.total >= 500) got.add('stars500');
  if (S.totalDays(uid) >= 10) got.add('days10');
  if (S.totalDays(uid) >= 30) got.add('days30');
  if (S.streak(uid) >= 7) got.add('streak7');
  if (p.log.some(x => x.total > 0 && x.ok === x.total)) got.add('perfect');
  if (p.wrongHad && st.wrong === 0) got.add('wrong-zero');
  if (Object.keys(p.speak).length >= 3) got.add('speak3');
  return got;
}
// 检查并落库新解锁的徽章，返回刚解锁的（用来弹提示）；重复调用安全
export function checkAndGrant(uid) {
  if (!uid) return [];
  const got = satisfied(uid);
  return defsFor(uid).filter(d => got.has(d.id) && S.grantAch(uid, d.id)).map(d => ({ id: d.id, icon: d.icon, name: d.name }));
}
export const unlockedCount = (uid) => defsFor(uid).filter(d => S.hasAch(uid, d.id)).length;
export const totalCount = (uid) => defsFor(uid).length;

// 徽章册页面
export function badgesView(uid) {
  if (!uid) { location.replace('#/login'); return; }
  const defs = defsFor(uid);
  const groups = [0, 1, 2].map(g => defs.filter(d => d.group === g)).filter(a => a.length);
  const n = unlockedCount(uid);
  mount(page('成就徽章', [
    h('p', { class: 'note' }, `已点亮 ${n} / ${defs.length}。拿到就永远是你的，一天没练也不会消失。`),
    ...groups.flatMap((list, gi) => [
      h('h2', { class: 'sh' }, `${GROUPS[gi][0]} ${GROUPS[gi][1]}`),
      h('div', { class: 'bgrid' }, list.map(d => {
        const on = S.hasAch(uid, d.id);
        return h('div', { class: 'bdg' + (on ? '' : ' off') },
          h('span', { class: 'bi' }, d.icon),
          h('div', {}, h('b', {}, d.name), h('small', {}, d.desc)),
          h('span', { class: 'bd' }, on ? `🏅 ${S.P(uid).ach[d.id].slice(5).replace('-', ' 月 ')} 日` : '未点亮'));
      })),
    ]),
  ], { back: '#/' }));
}

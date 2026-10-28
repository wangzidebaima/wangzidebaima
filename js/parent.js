// 家长专区（#/zone）：每个用这个网站的家长自己进的地方——发金币、导出备份、换朗读声音、下载试卷。
//
// 和「开发者后台」（#/parent，密码写在 config.json 里）是两回事：那边有访问统计、会员这些
// 只有开发才看的东西，家长根本见不到。所以凡是家长要用的功能，一律放这里，不要往 #/parent 里塞。
//
// 密码由家长第一次进来自己设，存的是 salt + SHA256(salt+密码)，只在这台手机的浏览器里。
// 没有服务器，所以它防的是孩子顺手点进去，不是真加密——别拿它挡什么要紧东西。

import { h, toast } from './ui.js';
import * as S from './store.js';
import { X, nav, page, mount, setTheme, kidCard, voiceNow, askText } from './views.js';

const SES = 'kp_zone';   // 这次打开已经进过专区（关掉页面就失效）

export const zoneOk = () => { try { return sessionStorage.getItem(SES) === '1'; } catch (e) { return !!window.__kpZone; } };
const mark = () => { try { sessionStorage.setItem(SES, '1'); } catch (e) { window.__kpZone = true; } };
const unmark = () => { try { sessionStorage.removeItem(SES); } catch (e) { window.__kpZone = false; } };

// config.json 里那个开发者密码也能进专区，方便我远程帮家长看问题
async function adminCheck(v) {
  const P = (X.cfg || {}).parent;
  if (!P || !P.salt) return false;
  try { return await S.sha256(P.salt + v) === P.hash; } catch (e) { return false; }
}

const pinInput = (ph) => h('input', { class: 'big', type: 'password', inputmode: 'numeric', placeholder: ph, autocomplete: 'off', enterkeyhint: 'go' });

// 第一次进来（或点「修改家长密码」）：自己设一个 4~6 位数字
function setPinPage(isChange) {
  const a = pinInput('新密码（4~6 位数字）'), b = pinInput('再输一遍');
  const msg = h('p', { class: 'msg' });
  const go = async () => {
    const v = a.value.trim();
    if (!/^\d{4,6}$/.test(v)) { msg.textContent = '请用 4~6 位数字，比如 2580'; return; }
    if (v !== b.value.trim()) { msg.textContent = '两次输的不一样，再输一遍'; b.value = ''; return; }
    try { await S.pinSet(v); } catch (e) { msg.textContent = '这个浏览器存不住密码，换个浏览器再试'; return; }
    toast(isChange ? '密码改好啦' : '密码设好啦，记在心里');
    mark(); zoneHome();
  };
  [a, b].forEach(x => x.addEventListener('keydown', e => { if (e.key === 'Enter') go(); }));
  setTheme(null);
  mount(h('div', { class: 'login' }, h('div', { class: 'logo' }, '🔑'),
    h('h1', {}, isChange ? '改家长密码' : '第一次进家长专区'),
    h('p', { class: 'sub' }, isChange ? '换一个 4~6 位数字的密码' : '设一个密码，以后用它进来给孩子发金币、导出备份、下载试卷'),
    a, b,
    h('button', { class: 'btn primary wide', onclick: go }, '设好，进去'),
    isChange ? h('button', { class: 'btn ghost wide', style: 'margin-top:10px', onclick: () => zoneHome() }, '不改了') : null,
    msg,
    h('p', { class: 'sub' }, '密码只存在这台手机里，孩子不会看到它。忘了密码：找给你这个网址的人，他能帮你清掉重设；自己清浏览器数据也能重设，但会连孩子的星星一起清掉，所以平时记得导出备份。')));
  setTimeout(() => a.focus(), 50);
}

// 已经设过密码：输密码进来
function askPinPage() {
  const inp = pinInput('请输入家长密码'), msg = h('p', { class: 'msg' });
  const go = async () => {
    const v = inp.value.trim();
    try {
      if (await S.pinCheck(v) || await adminCheck(v)) { mark(); zoneHome(); return; }
    } catch (e) { /* 下面统一当密码不对 */ }
    msg.textContent = '密码不对，再试一次'; inp.value = '';
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  setTheme(null);
  mount(h('div', { class: 'login' }, h('div', { class: 'logo' }, '👨‍👩‍👧'), h('h1', {}, '家长专区'),
    h('p', { class: 'sub' }, '给孩子发金币、导出备份、换朗读声音、下载试卷'), inp,
    h('button', { class: 'btn primary wide', onclick: go }, '进入'),
    h('button', { class: 'btn ghost wide', style: 'margin-top:10px', onclick: () => nav('#/login') }, '返回'), msg,
    h('p', { class: 'sub' }, '忘了密码：找给你这个网址的人帮着清一下，他会告诉你怎么办。')));
  setTimeout(() => inp.focus(), 50);
}

export function zoneGate() {
  if (zoneOk()) return zoneHome();
  if (!S.pinHas()) return setPinPage(false);
  return askPinPage();
}

// 孩子自己标了「还是不会」的题：家长在这里看，讲明白了就勾掉
function stuckBlock(u, redraw) {
  const list = S.stuckList(u.id);
  if (!list.length) return null;
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); toast('题目已复制，可以发给老师'); } catch (e) { toast('复制没成功，长按上面的文字手动复制'); } };
  const rows = () => list.map(e => h('div', { class: 'row static' },
    h('div', {}, h('b', {}, (e.meta && e.meta.title) || '练习题'), h('small', {}, String(e.q.stem || '').replace(/_{2,}/g, '__').slice(0, 46))),
    h('div', { class: 'chips' },
      h('button', { type: 'button', class: 'btn small ghost', onclick: () => copy(askText(u, e.q)) }, '📋 复制题目'),
      h('button', { type: 'button', class: 'btn small ghost', onclick: () => { S.setStuck(u.id, e.q.id, false); toast('勾掉啦'); redraw(); } }, '✓ 讲过了'))));
  return h('div', {}, h('h2', { class: 'sh' }, `🙋 ${u.display} 说「还是不会」的题（${list.length}）`),
    h('div', { class: 'list' }, rows()),
    h('p', { class: 'note' }, '孩子在错题里自己标的。讲明白之后点「✓ 讲过了」，从清单里去掉；也可以复制下来发给老师。'));
}

export function zoneHome() {
  if (!zoneOk()) { nav('#/login'); return; }
  setTheme(null);
  const rows = X.cfg.users.map(u => h('div', {}, kidCard(u, { vip: false, redraw: zoneHome }), stuckBlock(u, zoneHome)));
  mount(page('家长专区', [
    h('p', { class: 'note' }, '这里只给家长看：给孩子发金币、导出备份（换手机前一定要导出）、换朗读声音、下载打印试卷。孩子的星星和错题都存在这台手机里，清浏览器数据或换手机之前，请先导出备份。'),
    ...rows,
    h('div', { class: 'list', style: 'margin-top:12px' },
      h('a', { class: 'row', href: '#/voice' }, h('div', {}, h('b', {}, '🔊 朗读声音'),
        h('small', {}, voiceNow())), h('span', { class: 'chip' }, '试听 / 换')),
      h('a', { class: 'row', href: '#/papers' }, h('div', {}, h('b', {}, '📄 试卷下载'),
        h('small', {}, '数学、英语各单元 + 期中期末，打印给孩子做')), h('span', { class: 'chip' }, '去下载')),
      h('a', { class: 'row', href: '#/help' }, h('div', {}, h('b', {}, '🩺 遇到问题'),
        h('small', {}, '没声音、打不开、更新不了怎么办')), h('span', { class: 'chip' }, '看看'))),
    h('button', { class: 'btn ghost wide', style: 'margin-top:14px', onclick: () => setPinPage(true) }, '修改家长密码'),
    h('button', { class: 'btn ghost wide', style: 'margin-top:10px', onclick: () => { unmark(); nav('#/login'); } }, '退出'),
  ], { back: '#/login' }));
}

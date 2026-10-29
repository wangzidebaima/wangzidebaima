// 遇到问题：常见毛病按“症状”排，能自己修的先自己修；真修不了就一键自检 + 复制给家长
import { h, toast, zhVoices, getVoicePref } from './ui.js';
import * as S from './store.js';
import { X, mount, page, nav } from './views.js';
import { WECHAT, copyWechat } from './parent.js';

// ---------------- 报错记录：只存本机、只留 10 条，出问题时才有用 ----------------
const ERR_KEY = 'kp_err';
export function logError(msg) {
  try {
    const s = String(msg || '').slice(0, 160); if (!s) return;
    const list = JSON.parse(localStorage.getItem(ERR_KEY) || '[]');
    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    list.push({ t: `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`, m: s });
    localStorage.setItem(ERR_KEY, JSON.stringify(list.slice(-10)));
  } catch (e) { /* 记日志本身不能出错 */ }
}
export function errList() {
  try { return JSON.parse(localStorage.getItem(ERR_KEY) || '[]'); } catch (e) { return []; }
}
// 开机时装上：脚本报错、Promise 没接住，都悄悄记一条
export function installErrorLog() {
  try {
    window.addEventListener('error', (e) => {
      if (!e || !e.message) return; // 图片/文件加载失败没有 message，不算
      const f = String(e.filename || '').split('/').pop();
      logError(e.message + (f ? ' @' + f + ':' + e.lineno : ''));
    });
    window.addEventListener('unhandledrejection', (e) => {
      const r = e && e.reason; logError('未处理的错误：' + ((r && (r.message || r)) || '未知'));
    });
  } catch (e) { /* ignore */ }
}

// ---------------- 常见问题：全是这段时间真遇到过的 ----------------
const FAQ = [
  {
    g: '声音', items: [
      {
        q: '🔇 一点声音都没有',
        steps: [
          '先看手机侧面的静音开关（苹果），再把音量按大一点——孩子自己按过静音键是常事。',
          '看是不是连着蓝牙耳机或音箱：关掉蓝牙再试，声音才会从手机里出来。',
          '苹果手机：设置 → 辅助功能 → 朗读内容，确认没被关掉；再点一次「试听」，系统自己读得出来吗？',
          '安卓手机：设置 → 系统 → 语言和输入法 → 文字转语音，把引擎和语言都设成「中文（中国）」。',
          '还是没声音，就去「朗读声音」里换一个声音试听（在下面最后一块）。',
        ],
      },
      {
        q: '🗣 读得怪：像咬着舌头、带口音、念得像外国人',
        steps: [
          '这台手机拿来念书的声音不对，跟题目和代码没关系。',
          '最有效的办法：进「朗读声音」，一个个试听，挑一个听着顺耳的点「用这个」，以后语文都用它。',
          '苹果老机型：系统里那些「高音质」的声音网页用不了，只能在列表里挑一个能用、还听得过去的。',
          '选完记得回课文再听一遍，古诗、听写用的是同一个声音。',
        ],
      },
      {
        q: '🔈 听写听不清 / 读得太快',
        steps: [
          '听写页面有「再听一遍」，可以重复听。',
          '把音量调到一半以上，离耳朵近一点。',
          '实在快，就让孩子先听着把词写下来，不要跟着慌。',
        ],
      },
      {
        q: '🎧 扫了卷子上的二维码，听不到声音',
        steps: [
          '最常见的原因：用了微信里的「扫一扫」。微信自己带的浏览器放不了朗读声，换成手机自带的【相机】扫就好了。',
          '苹果：打开相机对着二维码，屏幕上方冒出一条提示，点一下，会用 Safari 打开。',
          '安卓：相机里找「扫码 / 识物」；找不到就用手机自带浏览器里的扫一扫。',
          '打开以后要**点一下「▶ 播放」**才会出声，手机不会自动读。',
          '还是没声：看一下手机侧面的静音开关（苹果），拨到静音时朗读是听不见的。',
          '最省事的办法：打开书山小路 → 试卷下载（登录页上就有入口，家长专区里也有），直接点卷子后面的 🎧，手机上就能放给孩子听，不用扫码。',
        ],
      },
    ],
  },
  {
    g: '更新', items: [
      {
        q: '✨ 弹出「有新版本」，点了没变化',
        steps: [
          '点「立即更新」后要等几秒，页面会自己刷新一次。',
          '如果一直开着没关过，可能卡在旧版本：把这个页面完全关掉（不是切到后台），再打开一次。',
          '还不行就把桌面图标删掉，照「装到手机桌面」重新加一次——记录在浏览器里，删图标不会丢。',
          '注意：在浏览器设置里点「清除网站数据」才会真的丢记录，别点。',
        ],
      },
      {
        q: '🧩 有内容打不开 / 提示文件没找到',
        steps: [
          '多半是网络断了，或者这一版还没缓存到这台手机。',
          '连上网络，把这个页面关掉重开一次，让它自己补上。',
          '如果首页顶部出现红色的提醒条，点进去可以看到缺了什么。',
        ],
      },
    ],
  },
  {
    g: '打不开', items: [
      {
        q: '⚪ 打开是白屏，或者一直转圈',
        steps: [
          '第一次打开必须联网，断网打不开是正常的。',
          '装到桌面以后，已经打开过的内容能离线用。',
          '下拉刷新一次；或者关掉页面重新打开。',
          '从微信里打开的链接很不稳定，改用 Safari / 手机自带浏览器打开。',
        ],
      },
      {
        q: '⏳ 点了按钮没反应',
        steps: [
          '先看屏幕下方有没有一条小提示，有时候是网络慢，等两秒就好。',
          '连点好几下容易卡住：退出去重进。',
          '经常这样，就在下面点「一键自检」，把结果复制给家长。',
        ],
      },
    ],
  },
  {
    g: '记录', items: [
      {
        q: '⭐ 星星、错题突然没了',
        steps: [
          '记录只存在这台手机的这个浏览器里，换手机、清浏览器数据、用无痕模式都会没有。',
          '到家长入口点「导入记录」，选之前导出的文件就能恢复。',
          '平时每 30 天导出一次最稳；家长页会标红提醒，看到红色就别拖。',
        ],
      },
      {
        q: '🔄 换新手机，怎么把记录搬过去',
        steps: [
          '旧手机：家长入口 → 每个孩子都点一次「导出记录」，文件存好（发到微信或电脑）。',
          '新手机：先用这个孩子的年级登录一次，再进家长入口 → 「导入记录」选文件。',
          '顺序不能反：要先登录，导入才知道是给谁恢复。',
        ],
      },
      {
        q: '📱 字太小 / 太大',
        steps: [
          '首页右上角的「Aa」，点一下换一档：标准 → 大 → 特大。',
          '换完整个 App 的字都会跟着变，三个孩子各自记各自的。',
        ],
      },
    ],
  },
  {
    g: '安装和其他', items: [
      {
        q: '📲 装不到手机桌面',
        steps: [
          '苹果要用 Safari 打开（微信里打不开安装入口）。',
          '安卓用手机自带浏览器，菜单里找「添加到桌面」。',
          '详细步骤在「装到手机桌面」那一页，有图有字。',
        ],
        go: { t: '📲 看安装教程', hash: '#/install' },
      },
      {
        q: '🎤 口语打卡没反应',
        steps: [
          '第一次用会问「能不能用麦克风」，要选允许；选过「不允许」就要去手机设置里打开这个网站的麦克风权限。',
          '在微信里打开的时候，麦克风经常用不了，换成 Safari / 自带浏览器。',
        ],
      },
      {
        q: '📶 没有网能不能用',
        steps: [
          '装到桌面、并且打开过一次以后，大部分题都能离线做。',
          '听力、朗读用的是手机自带的声音，也不费流量。',
          '第一次打开、以及有新版本要更新时，必须联网。',
        ],
      },
    ],
  },
];

// ---------------- 一键自检：把“手机现在什么状态”一屏看完 ----------------
const osOf = (ua) => {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS ' + String((ua.match(/OS (\d+[_\d]*) /) || [])[1] || '').replace(/_/g, '.');
  if (/Android/i.test(ua)) return 'Android ' + String((ua.match(/Android ([\d.]+)/) || [])[1] || '');
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  return '其他系统';
};
const brOf = (ua) => {
  if (/MicroMessenger/i.test(ua)) return '微信内置浏览器（不稳定）';
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/CriOS/i.test(ua)) return 'Chrome(iOS)';
  if (/FxiOS/i.test(ua)) return 'Firefox(iOS)';
  if (/Chrome\//i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua)) return 'Safari';
  return '其他浏览器';
};
const standaloneNow = () => { try { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true; } catch (e) { return false; } };

async function collect() {
  const rows = [];
  let ver = '未知';
  try { const t = await (await fetch('sw.js', { cache: 'no-store' })).text(); ver = (/const VER = '([^']+)'/.exec(t) || [])[1] || '未知'; } catch (e) { /* 离线时读不到 */ }
  rows.push(['版本', ver]);

  let cacheName = '', cacheN = 0;
  try {
    const keys = await caches.keys(); cacheName = keys[0] || '';
    if (cacheName) { const c = await caches.open(cacheName); cacheN = (await c.keys()).length; }
  } catch (e) { /* ignore */ }
  rows.push(['离线缓存', cacheName ? `${cacheName}（${cacheN} 个文件）` : '没有（离线会打不开）']);
  rows.push(['打开方式', standaloneNow() ? '从桌面图标打开' : '在浏览器里打开' + (/MicroMessenger/i.test(navigator.userAgent) ? '（微信里，建议换浏览器）' : '')]);

  const ua = navigator.userAgent;
  rows.push(['设备', osOf(ua) + ' · ' + brOf(ua)]);
  rows.push(['系统语言', navigator.language || '未知']);

  const vs = zhVoices(), pref = getVoicePref();
  const cur = pref ? vs.find(x => x.key === pref) : vs[0];
  rows.push(['中文语音', vs.length ? `${vs.length} 个，当前 ${cur ? cur.name + '（' + cur.lang + '）' : '未知'}${pref ? '（手选）' : '（自动）'}` : '没读到']);

  let bytes = 0;
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); bytes += (k || '').length + String(localStorage.getItem(k) || '').length; } } catch (e) { /* ignore */ }
  rows.push(['记录占用', `${Math.max(1, Math.round(bytes / 1024))} KB`]);

  const uid = S.getUser();
  if (uid) {
    const d = S.backupDaysAgo(uid);
    rows.push(['最近备份', d < 0 ? '从没导出过' : d === 0 ? '今天' : `${d} 天前`]);
    try { rows.push(['本机记录', `${S.stats(uid).total} 颗星 · 错题 ${S.stats(uid).wrong} 道`]); } catch (e) { /* ignore */ }
  }
  const errs = errList();
  rows.push(['报错记录', errs.length ? `${errs.length} 条（最近：${errs[errs.length - 1].t} ${errs[errs.length - 1].m}）` : '没有']);
  return rows;
}

const diagText = (rows) => ['【书山小路 自检】'].concat(rows.map(([k, v]) => `${k}：${v}`)).join('\n');

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* 兜底 */ }
  try {
    const ta = h('textarea', { style: 'position:fixed;top:-999px' }); ta.value = text;
    document.body.append(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok;
  } catch (e) { return false; }
}

function diagSection() {
  const out = h('div', {});
  const copyBtn = h('button', { type: 'button', class: 'btn ghost wide', style: 'margin-top:10px;display:none' }, '📋 复制诊断信息');
  let rows = [];
  copyBtn.onclick = async () => {
    const ok = await copyText(diagText(rows));
    toast(ok ? '已复制，去微信粘贴发给家长' : '复制没成功，长按上面的文字手动复制');
  };
  const run = async () => {
    out.replaceChildren(h('p', { class: 'note' }, '正在检查…'));
    try { rows = await collect(); } catch (e) { rows = [['自检失败', String(e && e.message || e)]]; }
    out.replaceChildren(
      h('div', { class: 'dgn' }, rows.map(([k, v]) => `${k}：${v}`).join('\n')),
      h('p', { class: 'note' }, '这些只是这台手机的运行状态，不包含孩子的名字和答题内容。发给家长看，就知道是哪里不对。'));
    copyBtn.style.display = '';
  };
  const btn = h('button', { type: 'button', class: 'btn primary wide', onclick: () => { btn.disabled = true; run().finally(() => { btn.disabled = false; }); } }, '🩺 一键自检（看看是哪里不对）');
  return h('section', { class: 'faq' }, h('h2', { class: 'sh' }, '还是不行：把状态发给我'),
    h('p', { class: 'note' }, '点一下，把版本、缓存、声音、备份这些一次看全；复制给家长，基本能直接看出毛病在哪。'),
    btn, out, copyBtn);
}

// ---------------- 页面 ----------------
export function helpPage() {
  const back = S.getUser() ? '#/' : '#/login';
  const groups = FAQ.map(g => h('section', { class: 'faq' },
    h('h2', { class: 'sh' }, g.g),
    g.items.map(it => h('details', {},
      h('summary', {}, it.q),
      h('ul', {}, it.steps.map(s => h('li', {}, s))),
      it.go ? h('a', { class: 'btn small ghost', style: 'margin-top:8px;display:inline-block', href: it.go.hash }, it.go.t) : null))));
  mount(page('遇到问题', [
    h('p', { class: 'note' }, '先按下面找找看，多数毛病自己两下就能修好。真修不了，最下面「一键自检」，把结果复制给家长。'),
    ...groups,
    h('section', { class: 'faq' },
      h('h2', { class: 'sh' }, '🔊 朗读声音'),
      h('p', { class: 'note' }, '读得怪、没声音，多半是这台手机用来念书的声音不合适。点进去一个个试听，挑顺耳的点「用这个」——三个孩子共用这一个选择。'),
      h('button', { type: 'button', class: 'btn primary wide', onclick: () => nav('#/voice') }, '去换朗读声音')),
    diagSection(),
    h('section', { class: 'faq' },
      h('h2', { class: 'sh' }, '💬 联系我'),
      h('p', { class: 'note' }, '上面的办法都试过还是不行，或者发现题目里有错、想加点新内容，直接加我微信说一声，看到就回。'),
      h('button', { type: 'button', class: 'btn primary wide', onclick: copyWechat }, `复制微信号：${WECHAT}`),
      h('p', { class: 'note', style: 'margin-top:8px' }, '复制好以后，打开微信 → 右上角「+」→ 添加朋友 → 粘贴，就能找到我。')),
  ], { back }));
}

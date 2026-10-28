// 口语跟读检查：用浏览器自带的语音识别，听一句孩子读的，跟原句比一比，
// 读对了才算数（而不是点一下按钮就给星）。
//
// 三条底线：
//   1. 只在孩子点 🎤 的那一刻才开始听，别的时候不开麦克风
//   2. 浏览器不支持（微信内置、老系统）就自动退回原来的自评打卡，功能不会缺
//   3. 听出来的文字只在这台手机上比对，不保存
//
// 常开，不提供开关：听不出来、听不清都会自动退回老打卡方式，不会把孩子卡住，
// 所以不需要家长去开/关（家长页是开发者后台，客户本来就看不到）。

// 有的浏览器带前缀；微信内置浏览器两者都没有
export function srApi() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}
// 真的能用吗：只看这台手机的浏览器支不支持
export const srReady = () => !!srApi();

// 单词化：统一小写，去掉标点和撇号（I'm → im，识别结果多半也是 im），只留词
const words = (s) => String(s || '')
  .toLowerCase()
  .replace(/['’`]/g, '')
  .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, ' ')
  .trim().split(' ').filter(Boolean);

// 两个词算不算同一个：完全相同，或者一个是另一个的开头（读快读慢常有 -s/-ed 的差别）
const same = (a, b) => a === b || (a.length > 3 && b.length > 3 && (a.startsWith(b) || b.startsWith(a)));

// 最长公共子序列：按顺序对上的词数。乱读一通是骗不过去的。
export function similarity(say, heard) {
  const A = words(say), B = words(heard);
  if (!A.length) return { hit: 0, total: 0, pct: 0 };
  const dp = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
  for (let i = 1; i <= A.length; i++) {
    for (let j = 1; j <= B.length; j++) {
      dp[i][j] = same(A[i - 1], B[j - 1]) ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const hit = dp[A.length][B.length];
  return { hit, total: A.length, pct: Math.round(hit / A.length * 100) };
}

// 从几个候选识别结果里挑跟原句最像的那个
function best(text, list) {
  let top = '', topPct = -1;
  list.forEach(x => {
    if (!x) return;
    const p = similarity(text, x).pct;
    if (p > topPct) { topPct = p; top = x; }
  });
  return { heard: top, pct: topPct };
}

// 听一句。resolve：{ heard } 听清了 / { err } 没听成（err 是原因代码）
export function listen(text, { lang = 'en-US', ms = 9000 } = {}) {
  return new Promise((resolve) => {
    const C = srApi();
    if (!C) return resolve({ err: 'unsupported' });
    let r = null;
    try { r = new C(); } catch (e) { return resolve({ err: 'unsupported' }); }
    r.lang = lang;
    r.continuous = false;
    r.interimResults = false;
    r.maxAlternatives = 4;          // 多给几条候选，挑最像的（读得含糊时能救回来）

    let done = false;
    const finish = (res) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try { r.stop(); } catch (e) { /* ignore */ }
      try { r.abort(); } catch (e) { /* ignore */ }
      resolve(res);
    };
    const timer = setTimeout(() => finish({ err: 'timeout' }), ms);

    r.onresult = (ev) => {
      const res = ev.results && ev.results[0];
      if (!res) return finish({ err: 'no-speech' });
      const list = [];
      for (let i = 0; i < res.length; i++) if (res[i] && res[i].transcript) list.push(String(res[i].transcript));
      const b = best(text, list);
      if (!b.heard) return finish({ err: 'no-speech' });
      finish({ heard: b.heard, pct: b.pct });
    };
    r.onerror = (ev) => {
      const e = (ev && ev.error) || 'error';
      finish({ err: e });
    };
    r.onend = () => finish({ err: 'no-speech' });

    try { r.start(); } catch (e) { finish({ err: 'start' }); }
  });
}

// 出错时给孩子看的话（不说“错误代码”这种词）
export function errText(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed': return '没有拿到麦克风权限。到浏览器设置里允许「使用麦克风」，或者直接用原来的方式打卡。';
    case 'no-speech': return '没听到声音。靠近一点、大声读出来，再点一次。';
    case 'timeout': return '等太久没听到，再点一次试试。';
    case 'network': return '听声音需要联网，检查一下网络，或者用原来的方式打卡。';
    case 'audio-capture': return '手机没找到麦克风，换个浏览器试试。';
    case 'unsupported': return '这台手机的浏览器不支持听读，按原来的方式打卡就行。';
    default: return '刚才没听清，再点一次试试。';
  }
}

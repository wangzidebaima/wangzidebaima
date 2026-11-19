// 匿名访问统计（百度统计）。只统计「有人打开」和「完成了一次练习（哪个科目）」，
// 绝不发送孩子姓名/账号名/答题内容。统计脚本加载失败（被拦截/没网）时静默跳过，不影响使用。
const HM_ID = 'af56d9493c6f3ff1fe8312a415c3d04f';

export function initStat() {
  try {
    if (window._hmt || !/^https?:$/.test(location.protocol)) return; // 本地文件/开发时不统计
    window._hmt = window._hmt || [];
    const s = document.createElement('script');
    s.src = 'https://hm.baidu.com/hm.js?' + HM_ID;
    s.async = true;
    document.head.appendChild(s);
  } catch (e) { /* ignore */ }
}

// 自定义事件：类别固定为「学习」，action 说明做了什么，label 只放科目 id（如 g7hist）
export function ev(action, label, value) {
  try {
    if (!window._hmt) return;
    const a = ['_trackEvent', '学习', String(action), String(label || '')];
    if (Number.isFinite(value)) a.push(Math.round(value));
    window._hmt.push(a);
  } catch (e) { /* ignore */ }
}

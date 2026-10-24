// 界面小工具：创建元素、提示、数学键盘、分数排版
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  kids.flat(Infinity).forEach(c => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c)); });
  return el;
}

export const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// 3/4 → 竖排分数；2又1/2 → 带分数
export function mathHtml(s) {
  s = esc(s);
  s = s.replace(/(\d+)又(\d+)\/(\d+)/g, (m, a, b, c) => `<span class="mix">${a}<span class="fr"><i>${b}</i><i>${c}</i></span></span>`);
  s = s.replace(/(\d+)\/(\d+)/g, (m, a, b) => `<span class="fr"><i>${a}</i><i>${b}</i></span>`);
  return s.replace(/-/g, '−');
}

export function toast(msg, ms = 2400) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'show';
  clearTimeout(toast._t); toast._t = setTimeout(() => { t.className = ''; }, ms);
}

export const praiseText = (ratio) =>
  ratio === 1 ? '全对！太厉害了！' : ratio >= 0.8 ? '做得真棒！' : ratio >= 0.6 ? '不错，继续加油！' : '没关系，看看解析，下次会更好。';

// 数学键盘：手机自带键盘没有负号和分数线，所以自己做一个
let cur = null, repT = null, repI = null, repeated = false;
const kbEl = () => document.getElementById('kb');
const nextInput = () => {
  const all = [...document.querySelectorAll('input.mi')], i = all.indexOf(cur);
  const after = all.slice(i + 1), before = all.slice(0, i);
  return after.find(x => !x.value) || before.find(x => !x.value) || null;
};
function press(k) {
  if (!cur) return;
  if (k === '⌫') cur.value = cur.value.slice(0, -1);
  else if (k === '清空') cur.value = '';
  else if (k === '下一题' || k === '完成') { const n = nextInput(); if (n && k === '下一题') keypad.open(n, n.dataset.full === '1'); else keypad.close(); return; }
  else cur.value += k;
  cur.dispatchEvent(new Event('input', { bubbles: true }));
}
const stopRep = () => { clearTimeout(repT); clearInterval(repI); repT = repI = null; };
export const keypad = {
  open(input, full) {
    if (cur) cur.classList.remove('focus');
    cur = input; input.dataset.full = full ? '1' : '0'; input.classList.add('focus');
    const last = nextInput() ? '下一题' : '完成';
    const keys = full
      ? ['7', '8', '9', '⌫', '4', '5', '6', '−', '1', '2', '3', '/', '0', '.', '又', last]
      : ['7', '8', '9', '⌫', '4', '5', '6', '清空', '1', '2', '3', last, '0'];
    const el = kbEl(); el.replaceChildren(...keys.map(k => {
      const cls = 'key' + (k === '下一题' || k === '完成' ? ' done' : '') + (full ? '' : ' k3') + (k === '⌫' ? ' bs' : '');
      const b = h('button', { type: 'button', class: cls }, k);
      if (k === '⌫') {
        // 长按退格：按住 0.4 秒后连续删除
        b.addEventListener('pointerdown', () => { repeated = false; stopRep(); repT = setTimeout(() => { repeated = true; repI = setInterval(() => press('⌫'), 70); }, 400); });
        ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stopRep));
        b.addEventListener('contextmenu', (e) => e.preventDefault());
        b.addEventListener('click', () => { if (!repeated) press('⌫'); repeated = false; });
      } else b.addEventListener('click', () => press(k));
      return b;
    }));
    el.hidden = false; document.body.classList.add('kbopen');
    setTimeout(() => input.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
  },
  close() {
    stopRep();
    if (cur) cur.classList.remove('focus');
    cur = null; const el = kbEl(); if (el) el.hidden = true;
    document.body.classList.remove('kbopen');
  },
};

// 播放发音：优先用上传的真人 MP3（audio/w/<key>.mp3），没有就用手机自带的美式朗读
let curAudio = null;
export function playSay(key, text, avail) {
  const file = 'audio/w/' + key + '.mp3';
  const fallback = () => {
    try {
      const ss = window.speechSynthesis; if (!ss) throw new Error('no tts');
      ss.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.85;
      const v = (ss.getVoices() || []).find(x => /en[-_]US/i.test(x.lang)); if (v) u.voice = v; ss.speak(u);
    } catch (e) { toast('这台手机暂时发不出声音'); }
  };
  try { if (curAudio) curAudio.pause(); } catch (e) { /* ignore */ }
  if (avail && avail.has(file)) {
    try { curAudio = new Audio(file); curAudio.play().catch(fallback); return; } catch (e) { /* 用朗读兜底 */ }
  }
  fallback();
}

export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

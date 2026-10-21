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
let cur = null;
const kbEl = () => document.getElementById('kb');
function press(k) {
  if (!cur) return;
  if (k === '⌫') cur.value = cur.value.slice(0, -1);
  else if (k === '清空') cur.value = '';
  else if (k === '完成') { keypad.close(); return; }
  else cur.value += k;
  cur.dispatchEvent(new Event('input', { bubbles: true }));
}
export const keypad = {
  open(input, full) {
    if (cur) cur.classList.remove('focus');
    cur = input; input.classList.add('focus');
    const keys = full
      ? ['7', '8', '9', '⌫', '4', '5', '6', '−', '1', '2', '3', '/', '0', '.', '又', '完成']
      : ['7', '8', '9', '⌫', '4', '5', '6', '清空', '1', '2', '3', '完成', '0'];
    const el = kbEl(); el.replaceChildren(...keys.map(k =>
      h('button', { type: 'button', class: 'key' + (k === '完成' ? ' done' : '') + (full ? '' : ' k3'), onclick: () => press(k) }, k)));
    el.hidden = false; document.body.classList.add('kbopen');
    setTimeout(() => input.scrollIntoView({ block: 'center', behavior: 'smooth' }), 50);
  },
  close() {
    if (cur) cur.classList.remove('focus');
    cur = null; const el = kbEl(); if (el) el.hidden = true;
    document.body.classList.remove('kbopen');
  },
};

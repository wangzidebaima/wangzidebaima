// 一、二年级：给界面和题目里的汉字加拼音（字上面一行小字）。
// 数据 data/pinyin.json：c = 单字默认读音；p = 词语读音（多音字、轻声、一/不变调的固定词）。
// 做法：页面变了就扫一遍文字节点，把每个汉字包成 <span class="py" data-p="pīn">字</span>，
// 拼音用 CSS ::before 画出来，所以 textContent 还是干净的汉字（朗读、复制、判题都不受影响）。
// 「看字选拼音 / 看拼音选字」这类在考拼音的题，题目区不加拼音，免得直接给出答案。
let D = null, loading = false, getUser = () => null, mo = null, timer = 0;
const CJK = /[一-鿿]/;
const SKIP = 'script,style,textarea,input,select,option,svg,.py,#kb,[data-nopy]';
const T1 = 'āēīōūǖ', T2 = 'áéíóúǘ', T3 = 'ǎěǐǒǔǚ', T4 = 'àèìòùǜ';
const tone = (py) => { for (const ch of py || '') { if (T1.includes(ch)) return 1; if (T2.includes(ch)) return 2; if (T3.includes(ch)) return 3; if (T4.includes(ch)) return 4; } return 0; };
const VERBNEXT = '说跑走飞唱笑叫看想问答喊跳爬摇点读写找站坐拍打吃喝爱哭叹望听数转流落洒飘游钻躲藏睡玩';
const ORD = '第十二三四五六七八九零', NUM = '二三四五六七八九十零';

export function annotate(s) {
  const n = s.length, py = new Array(n).fill(''), fixed = new Array(n).fill(false);
  for (let i = 0; i < n;) {
    if (!CJK.test(s[i])) { i++; continue; }
    let hit = 0;
    for (let len = Math.min(6, n - i); len >= 2; len--) {
      const w = s.substr(i, len), v = D.p[w];
      if (v) { v.split(' ').forEach((x, k) => { py[i + k] = x; fixed[i + k] = true; }); hit = len; break; }
    }
    if (hit) { i += hit; continue; }
    py[i] = D.c[s[i]] || ''; i++;
  }
  for (let i = 0; i < n; i++) {
    if (fixed[i]) continue; const ch = s[i], nx = s[i + 1] || '', pv = s[i - 1] || '';
    if (ch === '子' && CJK.test(pv)) py[i] = 'zi';
    else if (ch === '地' && pv && nx && VERBNEXT.includes(nx) && !'土田大天陆山荒'.includes(pv)) py[i] = 'de';
    else if (ch === '得' && pv) py[i] = 'de';   // 绝大多数是「跑得快」的 de；真正读 dé 的词在词表里
  }
  for (let i = 0; i < n; i++) {
    if (fixed[i]) continue; const ch = s[i], nx = s[i + 1] || '', pv = s[i - 1] || '';
    if (ch === '一') {
      if (pv && pv === nx && CJK.test(pv)) py[i] = 'yi';   // 看一看、想一想：中间的「一」读轻声
      else if ((pv && ORD.includes(pv)) || (nx && NUM.includes(nx)) || !CJK.test(nx)) py[i] = 'yī';
      else { const t = tone(py[i + 1]); py[i] = t === 4 ? 'yí' : (t >= 1 ? 'yì' : 'yī'); }
    } else if (ch === '不') py[i] = tone(py[i + 1]) === 4 ? 'bú' : 'bù';
  }
  return py;
}

const nopyHere = (el) => /#\/set\/(g1c-X|g2c-py)/.test(location.hash) && el.closest && el.closest('article.q');
function wrapNode(t) {
  const s = t.nodeValue; if (!CJK.test(s)) return;
  const par = t.parentElement; if (!par || par.closest(SKIP) || nopyHere(par)) return;
  const py = annotate(s), frag = document.createDocumentFragment();
  let buf = '';
  const flush = () => {
    if (!buf) return;
    if (!buf.trim() || buf.length > 12) frag.append(buf);
    else { const sp = document.createElement('span'); sp.className = 'py np'; sp.textContent = buf; frag.append(sp); }
    buf = '';
  };
  for (let i = 0; i < s.length; i++) {
    if (CJK.test(s[i])) { flush(); const sp = document.createElement('span'); sp.className = 'py'; sp.dataset.p = py[i]; sp.textContent = s[i]; frag.append(sp); }
    else buf += s[i];
  }
  flush(); t.replaceWith(frag);
}
function scan(root) {
  if (!D || !root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list = [];
  for (let n = w.nextNode(); n; n = w.nextNode()) if (CJK.test(n.nodeValue)) list.push(n);
  list.forEach(wrapNode);
}
const lowGrade = () => { const u = getUser(); return !!u && (u.grade === '一年级' || u.grade === '二年级'); };
function tick() {
  timer = 0;
  if (!lowGrade()) return;
  if (!D) {
    if (loading) return; loading = true;
    fetch('data/pinyin.json').then(r => r.json()).then(j => { D = j; scan(document.getElementById('app') || document.body); }).catch(() => { loading = false; });
    return;
  }
  scan(document.getElementById('app') || document.body);
}
export function setOn(on) { document.documentElement.dataset.py = on ? 'on' : 'off'; }
export function init(userFn) {
  getUser = userFn;
  mo = new MutationObserver(() => { if (!timer) timer = requestAnimationFrame(tick); });
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  timer = requestAnimationFrame(tick);
}

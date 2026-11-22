// 语文朗读用的「文字 → MP3 文件名」规则，以及各处要读的文字怎么拼。
// 这个文件不依赖页面（不碰 DOM），tools/zh_jobs.mjs 会直接读它来列出「要生成哪些 MP3」，
// 所以网页和生成脚本永远用同一套规则：改了这里的拼法，重新跑一次生成就对得上。

// 53 位字符串哈希（cyrb53），按 UTF-16 码元算；同一段文字永远得到同一个短码
export function zhKey(s) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
export const zhFile = (t) => 'audio/z/' + zhKey(t) + '.mp3';

// 「学一学」本单元要点：一条要点读成「标题。内容」，内容里的英文字母段落不读（英文另有发音）
export const tipSay = (a, b) => a + '。' + String(b).replace(/[A-Za-z][A-Za-z\s,.'’!?/-]*/g, ' ');

// 低年级（readAloud）每题的「听题」：先读题干，再读选项，判断题最后问「对，还是错？」
export function qSayLines(q) {
  // 一、二年级随机口算：题干只有算式（如 54+32），读成「54加32等于几？」
  const bare = !q.sayText && q.type === 'math' && /^[\d\s+＋\-−×÷()（）]+$/.test(String(q.stem || '')) && /[+＋\-−×÷]/.test(String(q.stem));
  const blankMath = !q.sayText && ['math', 'fill'].includes(q.type) && /□|_{2,}/.test(String(q.stem || '')) && /\d/.test(String(q.stem)) && /[+＋\-−×÷=]/.test(String(q.stem)) && !/[一-鿿]/.test(String(q.stem));
  const say0 = blankMath ? String(q.stem).replace(/\s+/g, '').replace(/□|_{2,}/g, '几').replace(/[+＋]/g, '加').replace(/[−-]/g, '减').replace(/×/g, '乘').replace(/÷/g, '除以').replace(/=\??$/, '等于几？').replace(/=/g, '等于') : bare ? String(q.stem).replace(/\s+/g, '').replace(/[+＋]/g, '加').replace(/[−-]/g, '减').replace(/×/g, '乘').replace(/÷/g, '除以').replace(/[（(]/g, '括号').replace(/[）)]/g, '括号') + '等于几？' : q.sayText || String(q.stem || '').replace(/_{2,}|□/g, '空').replace(/\s*[+＋]\s*/g, '加').replace(/\s*[−-]\s*/g, '减').replace(/\s*=\s*\?*/g, '等于几');
  const lines = [say0];
  if (q.type === 'choice' && !q.noOptSay) (q.options || []).forEach((o, k) => { if (o) lines.push('ABCD'[k] + '，' + o); });
  if (q.type === 'tf') lines.push('对，还是错？');
  return lines;
}

// ---- 数字和固定句子拼接朗读 ----
// 一、二年级的题是随机出的，每道都录成 MP3 不现实。办法：把一句话拆成「数字」和「固定的话」，
// 每一块都是一个很短的 MP3（数字读成汉字：37 → 三十七），播放时一块接一块连着放。
// 拆不开（有小数、字母、100 以上的数……）就返回 null，调用方改用手机朗读，保证任何情况都能听到。
const CN_D = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export function cnNum(n) {
  if (!Number.isInteger(n) || n < 0 || n > 100) return null;
  if (n === 100) return '一百';
  if (n < 10) return CN_D[n];
  const t = Math.floor(n / 10), o = n % 10;
  return (t === 1 ? '' : CN_D[t]) + '十' + (o ? CN_D[o] : '');
}
// 数字读成一串小块：37 → [三十七]；305 → [三百, 零, 五]；315 → [三百, 一十, 五]；1000 → [一千]
export function cnNumParts(n) {
  if (!Number.isInteger(n) || n < 0 || n > 1000) return null;
  if (n <= 100) return [cnNum(n)];
  if (n === 1000) return ['一千'];
  const hd = Math.floor(n / 100), r = n % 100, out = [CN_D[hd] + '百'];
  if (r === 0) return out;
  if (r < 10) return [...out, '零', CN_D[r]];
  if (r < 20) return [...out, '一十', ...(r % 10 ? [CN_D[r % 10]] : [])];
  return [...out, cnNum(r)];
}
const MEASURE = '个只条本张把片朵颗棵块盒瓶双根件辆头粒支枝页份组堆行排次层位名辈';
export function zhPieces(text) {
  let t = String(text || '');
  const lead = /^[A-D]，/.exec(t); if (lead) t = t.slice(2);   // 选项前面的「A，」单独一块
  t = t.replace(/○/g, '圆圈').replace(/＞|>/g, '大于').replace(/＜|</g, '小于').replace(/＝|=/g, '等于');
  if (!/[一-鿿]/.test(t) && !/\d/.test(t)) return null;
  if (/\d[.．。,，:：/%％]\d|[A-Za-z]/.test(t)) return null;   // 小数、分数、百分数、英文：不拆
  const out = lead ? [lead[0]] : []; const re = /(\d+)|([^\d]+)/g; let m;
  while ((m = re.exec(t))) {
    if (m[1]) {
      if (m[1].length > 1 && m[1][0] === '0') return null;
      const n = +m[1], nx = t[m.index + m[1].length] || '';
      const c = (n === 2 && MEASURE.includes(nx)) ? ['两'] : cnNumParts(n); if (c == null) return null; out.push(...c);
    } else {
      const f = m[2].replace(/\s+/g, ''); if (!/[一-鿿]/.test(f)) continue;
      if (/[^一-鿿，。？！、；：“”‘’…—（）]/.test(f)) return null;   // 夹着符号、□ 等：不拆
      out.push(f);
    }
  }
  return out.length ? out : null;
}

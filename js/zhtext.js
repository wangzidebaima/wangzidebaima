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
  const say0 = q.sayText || String(q.stem || '').replace(/_{2,}|□/g, '空').replace(/\s*[+＋]\s*/g, '加').replace(/\s*[−-]\s*/g, '减').replace(/\s*=\s*\?*/g, '等于几');
  const lines = [say0];
  if (q.type === 'choice' && !q.noOptSay) (q.options || []).forEach((o, k) => { if (o) lines.push('ABCD'[k] + '，' + o); });
  if (q.type === 'tf') lines.push('对，还是错？');
  return lines;
}

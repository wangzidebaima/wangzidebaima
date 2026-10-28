// 本机记录：每个孩子一份，保存在这台手机的浏览器里
const LS = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};
const mem = {};
const pad = (n) => String(n).padStart(2, '0');
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

export const getUser = () => LS.get('kp_user') || mem.user || null;
export function setUser(id) {
  if (id) { LS.set('kp_user', id); mem.user = id; } else { LS.del('kp_user'); delete mem.user; }
}

const cache = {};
export function P(uid) {
  if (cache[uid]) return cache[uid];
  let p = null;
  try { const raw = LS.get('kp_p_' + uid); p = raw ? JSON.parse(raw) : null; } catch (e) { p = null; }
  p = p || {};
  p.stars = p.stars || {}; p.sets = p.sets || {}; p.wrong = p.wrong || {};
  p.rand = p.rand || { days: {}, types: {} }; p.rand.days = p.rand.days || {}; p.rand.types = p.rand.types || {};
  p.speak = p.speak || {}; p.log = p.log || [];
  cache[uid] = p; return p;
}
export function save(uid) { LS.set('kp_p_' + uid, JSON.stringify(cache[uid])); }

// 发星星：一题一颗，只发一次。每个孩子每天所有来源合计有上限（默认 30）。
export const starsToday = (uid) => { const t = today(); let n = 0; for (const k in P(uid).stars) if (P(uid).stars[k].d === t) n++; return n; };
export function award(uid, q, src, subject, cap = 30) {
  const p = P(uid);
  if (p.stars[q.id]) return 'had';
  if (starsToday(uid) >= cap) return 'capped';
  p.stars[q.id] = { d: today(), src, sub: subject };
  save(uid); return 'new';
}

export function addWrong(uid, q, meta) {
  const p = P(uid), old = p.wrong[q.id];
  p.wrong[q.id] = { q, meta, n: old ? old.n + 1 : 1, d: today() };
  save(uid);
}
export function clearWrong(uid, qid) { const p = P(uid); if (p.wrong[qid]) { delete p.wrong[qid]; save(uid); } }

export function typeStat(uid, typeId, ok) {
  const t = (P(uid).rand.types[typeId] = P(uid).rand.types[typeId] || { n: 0, w: 0 });
  t.n++; if (!ok) t.w++;
}

export function recordAttempt(uid, setId, rec) {
  const p = P(uid);
  if (setId) {
    const o = p.sets[setId] || { n: 0, best: 0 };
    p.sets[setId] = { n: o.n + 1, best: Math.max(o.best, rec.ok), last: rec };
  }
  p.log.push({ d: today(), t: Date.now(), setId: setId || null, title: rec.title, ok: rec.ok, total: rec.total, stars: rec.stars, src: rec.src, sub: rec.sub, kind: rec.kind || null, secs: rec.secs || 0 });
  if (p.log.length > 300) p.log = p.log.slice(-300);
  save(uid);
}

export function stats(uid) {
  const p = P(uid), t = today();
  let total = 0, bank = 0, rand = 0, todayN = 0;
  for (const k in p.stars) {
    total++; const s = p.stars[k];
    if (s.src === 'rand') rand++; else bank++;
    if (s.d === t) todayN++;
  }
  return { total, bank, rand, today: todayN, wrong: Object.keys(p.wrong).length };
}

export function markSpeak(uid, key) { const p = P(uid); p.speak[key] = Date.now(); save(uid); }

// 英语小测：每个孩子选过的「学过的单元」，按课本分开记
export function getUnits(uid, book, dflt) { const e = P(uid).eng; return (e && e[book]) || dflt || []; }
export function setUnits(uid, book, arr) { const p = P(uid); p.eng = p.eng || {}; p.eng[book] = arr; save(uid); }

const dayOf = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
// 连续练习天数：今天还没练就从昨天往回数
export function streak(uid) {
  const p = P(uid), days = new Set(p.log.map(x => x.d));
  Object.values(p.speak).forEach(ts => days.add(dayOf(ts)));
  let n = 0; const d = new Date();
  if (!days.has(dayOf(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayOf(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
// 每条记录属于哪一类：reading 阅读理解 / listening 听力 / essay 美文 / 其余按 sub 猜
export function logCat(x) {
  if (x.kind === 'essay') return 'essay';
  if (x.kind === 'reading') return 'reading';
  if (x.kind === 'listening') return 'listening';
  if (!x.kind && /reading$/.test(x.sub || '')) return 'reading';
  if (!x.kind && /listening$/.test(x.sub || '')) return 'listening';
  return 'other';
}
// 每 3 天换一篇美文：按日期算出「今天这一篇」和这 3 天的起止日期
export function essayWindow(list, date) {
  if (!list.length) return null;
  const d = date ? new Date(date + 'T00:00:00') : new Date();
  const dn = Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000), w = Math.floor(dn / 3);
  const st = new Date((w * 3) * 86400000), en = new Date((w * 3 + 2) * 86400000);
  const f = (x) => `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
  return { item: list[w % list.length], start: f(st), end: f(en) };
}
// 某一天做了哪几类：{ reading: 套数, listening: 套数, essay: 套数, speaking: 次数, other: 组数 }
export function dayCats(uid, d) {
  const p = P(uid), out = { reading: 0, listening: 0, essay: 0, speaking: 0, other: 0 };
  p.log.filter(x => x.d === d).forEach(x => { out[logCat(x)]++; });
  Object.values(p.speak).forEach(ts => { if (dayOf(ts) === d) out.speaking++; });
  return out;
}
// 今日任务完成了多少：bank=题库组数，rand=随机题数（sub 或 subs），cat=某一类的套数，speak=口语打卡，essay=这 3 天的美文
export function taskDone(uid, t, extra) {
  const p = P(uid), tod = today(), logs = p.log.filter(x => x.d === tod);
  if (t.kind === 'bank') return logs.filter(x => x.setId).length;
  if (t.kind === 'rand') { const subs = t.subs || [t.sub]; return logs.filter(x => subs.includes(x.sub)).reduce((a, x) => a + (x.total || 0), 0); }
  if (t.kind === 'cat') { const l = logs.filter(x => logCat(x) === t.cat); return t.minutes ? Math.floor(l.reduce((a, x) => a + (x.secs || 0), 0) / 60) : l.length; }
  if (t.kind === 'speak') return Object.values(p.speak).filter(ts => dayOf(ts) === tod).length;
  if (t.kind === 'essay') { const w = extra && extra.window; if (!w) return 0; return p.log.filter(x => x.setId === w.item.id && x.d >= w.start && x.d <= w.end).length ? 1 : 0; }
  return 0;
}

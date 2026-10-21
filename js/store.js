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

// 发星星：一题一颗，只发一次。随机练习每天每科目有上限。
export function award(uid, q, src, subject, cap = 20) {
  const p = P(uid);
  if (p.stars[q.id]) return 'had';
  if (src === 'rand') {
    const day = (p.rand.days[today()] = p.rand.days[today()] || {});
    if ((day[subject] || 0) >= cap) return 'capped';
    day[subject] = (day[subject] || 0) + 1;
  }
  p.stars[q.id] = { d: today(), src, sub: subject };
  save(uid); return 'new';
}
export const randToday = (uid, subject) => ((P(uid).rand.days[today()] || {})[subject]) || 0;

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
  p.log.push({ d: today(), t: Date.now(), setId: setId || null, title: rec.title, ok: rec.ok, total: rec.total, stars: rec.stars });
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

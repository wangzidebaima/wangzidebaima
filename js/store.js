// 本机记录：每个孩子一份，保存在这台手机的浏览器里
const LS = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } },
};
const mem = {};
const pad = (n) => String(n).padStart(2, '0');
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

// ---------- 备份提醒：记下最近一次导出备份的日期（只存日期字符串，很小） ----------
export const lastBackup = (uid) => LS.get('kp_bak_' + uid) || '';
export const markBackup = (uid) => LS.set('kp_bak_' + uid, today());
// 距上次导出过了多少天：没导出过返回 -1
export function backupDaysAgo(uid) {
  const d = lastBackup(uid);
  if (!d) return -1;
  const t = Date.parse(d + 'T00:00:00');
  if (!t) return -1;
  const now = Date.parse(today() + 'T00:00:00');
  return Math.max(0, Math.round((now - t) / 86400000));
}

export const getUser = () => LS.get('kp_user') || mem.user || null;
export function setUser(id) {
  if (id) { LS.set('kp_user', id); mem.user = id; } else { LS.del('kp_user'); delete mem.user; }
}

// ---------- 星星账本：每日一页 + 每年一页 ----------
// days: { '2026-10-26': { n: 28, b: 10, r: 18 } }  近半年每天得了几颗（n 总数 / b 题库 / r 随机）
// year: { '2026': { n: 3200, b: 1200, r: 2000 } }  半年前的明细按年累计，永久保留
// 说明：只记“每天几颗”，不再记“哪道题得过星”（同一道题重做可以再得星，每天上限 30 颗兜底）
const KEEP_DAYS = 180;
const shiftDay = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const blank = () => ({ n: 0, b: 0, r: 0 });
// 把超过半年的每日账并进年账，保证 days 永远只有半年份量
function sealOld(p) {
  const cut = shiftDay(KEEP_DAYS);
  for (const k of Object.keys(p.days)) {
    if (k >= cut) continue;
    const o = p.days[k] || {}, y = (p.year[k.slice(0, 4)] = p.year[k.slice(0, 4)] || blank());
    y.n += o.n || 0; y.b += o.b || 0; y.r += o.r || 0;
    delete p.days[k];
  }
}

const cache = {};
// 补全字段：读出来的旧数据、导入的数据都要过一遍，保证结构完整
// 老格式（按题记的 stars）会在这一步汇总成每日账，星星总数一颗不少
const normProfile = (p) => {
  p = p || {};
  p.sets = p.sets || {}; p.wrong = p.wrong || {};
  p.rand = p.rand || { days: {}, types: {} }; p.rand.days = p.rand.days || {}; p.rand.types = p.rand.types || {};
  p.speak = p.speak || {}; p.log = p.log || [];
  p.days = p.days || {}; p.year = p.year || {};
  p.coins = p.coins || [];
  p.ach = p.ach || {};
  p.vip = p.vip || null; // VIP 占位：只存字段，不做任何拦截；将来收费时再接
  if (p.stars && typeof p.stars === 'object') {
    for (const k in p.stars) {
      const s = p.stars[k] || {}, d = s.d;
      if (!d) continue;
      const o = (p.days[d] = p.days[d] || blank());
      o.n++; if (s.src === 'rand') o.r++; else o.b++;
    }
    delete p.stars;
  }
  p.ver = 2;
  sealOld(p);
  return p;
};
export function P(uid) {
  if (cache[uid]) return cache[uid];
  let p = null;
  try { const raw = LS.get('kp_p_' + uid); p = raw ? JSON.parse(raw) : null; } catch (e) { p = null; }
  const old = !!(p && p.stars && Object.keys(p.stars).length); // 需要搬家：老格式
  cache[uid] = normProfile(p);
  if (old) save(uid); // 搬家结果立刻写回，不用等下一次操作
  return cache[uid];
}
export function save(uid) {
  const ok = LS.set('kp_p_' + uid, JSON.stringify(cache[uid]));
  if (!ok) { try { window.dispatchEvent(new CustomEvent('kpsavefail')); } catch (e) { /* ignore */ } }
  return ok;
}

// ---------- 备份：导出 / 导入（给家长页用，防止换手机或清浏览器后记录丢失） ----------
// 导出：带一层说明信息的 JSON 文本（导入时也兼容不带说明的裸 profile）
export function exportProfile(uid) {
  const p = P(uid);
  return JSON.stringify({ kp: 1, uid, exportedAt: today(), profile: p }, null, 1);
}
// 导入：成功返回 true 并立即保存；数据不对返回 false（不会动现有记录）
export function importProfile(uid, raw) {
  let d = null;
  try { d = JSON.parse(raw); } catch (e) { return false; }
  const prof = d && d.kp === 1 ? d.profile : d;
  if (!prof || typeof prof !== 'object' || Array.isArray(prof)) return false;
  // 要有星星账（新格式 days/year，老格式 stars），防止导错文件
  if (!prof.days && !prof.year && !prof.stars) return false;
  cache[uid] = normProfile(prof);
  save(uid); return true;
}

// 发星星：做一题给一颗（同一题重做也能再得），每个孩子每天合计上限 30 颗
export const starsToday = (uid) => { const o = P(uid).days[today()]; return o ? o.n || 0 : 0; };
export function award(uid, q, src, subject, cap = 30) {
  const p = P(uid), t = today();
  const day = (p.days[t] = p.days[t] || blank());
  if (day.n >= cap) return 'capped';
  day.n++; if (src === 'rand') day.r++; else day.b++;
  if (Object.keys(p.days).length > KEEP_DAYS + 40) sealOld(p); // 偶尔封一次旧账，几乎零开销
  save(uid); return 'new';
}

// 错题本：做错进来（3 天后再提醒），答对一次先「待巩固」，隔天再答对才真正出库
export function addWrong(uid, q, meta) {
  const p = P(uid), old = p.wrong[q.id];
  p.wrongHad = true; // 记「曾经有过错题」，错题清零徽章用
  p.wrong[q.id] = { q, meta, n: old ? old.n + 1 : 1, d: today(), ok: 0, next: shiftDay(-3) };
  save(uid);
}
// 答对一道错题。返回 true 表示已毕业（从错题本删掉）；
// 返回 false 表示先记一次「待巩固」，隔天再来对一次才算掌握。
export function rightWrong(uid, qid) {
  const p = P(uid), e = p.wrong[qid];
  if (!e) return true;
  if ((e.ok || 0) >= 1 && e.next && e.next <= today()) { delete p.wrong[qid]; save(uid); return true; }
  e.ok = 1; e.next = shiftDay(-1); save(uid); return false;
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
  let total = 0, bank = 0, rand = 0;
  for (const y in p.year) { const o = p.year[y]; total += o.n || 0; bank += o.b || 0; rand += o.r || 0; }
  for (const d in p.days) { const o = p.days[d]; total += o.n || 0; bank += o.b || 0; rand += o.r || 0; }
  const td = p.days[t];
  return { total, bank, rand, today: td ? td.n || 0 : 0, wrong: Object.keys(p.wrong).length };
}

export function markSpeak(uid, key) { const p = P(uid); p.speak[key] = Date.now(); save(uid); }

// ---------- 金币流水：家长在家长页记一笔「已发放」，孩子首页能看到领没领 ----------
// coins: [{ d: '2026-10-28', lap: 2, goal: 400, n: 2 }]  每次发放一条
// lap+goal 一起记：中途改过攒星目标也不怕对错轮次
export const coinList = (uid) => P(uid).coins || [];
export const coinsPaid = (uid) => coinList(uid).reduce((a, c) => a + (c.n || 0), 0);
export const coinGivenLap = (uid, lap, goal) => coinList(uid).some(c => c.lap === lap && c.goal === goal);
export function payCoins(uid, lap, goal, n) {
  const p = P(uid);
  (p.coins = p.coins || []).push({ d: today(), lap, goal, n });
  save(uid);
}

// ---------- 家长专区密码：家长第一次进来自己设，只存在这台手机里 ----------
// 没有服务器，所以它就是「防孩子顺手点进去」，不是真加密。
// 存的是 salt + SHA256(salt+密码)，和开发者后台那个密码一个做法。
const PIN = 'kp_pin';
export const sha256 = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
export const pinHas = () => !!LS.get(PIN);
export function pinSet(v) {
  const salt = [...crypto.getRandomValues(new Uint8Array(8))].map(b => b.toString(16).padStart(2, '0')).join('');
  return sha256(salt + v).then(hash => { LS.set(PIN, JSON.stringify({ salt, hash })); });
}
export async function pinCheck(v) {
  let o = null; try { o = JSON.parse(LS.get(PIN) || 'null'); } catch (e) { o = null; }
  if (!o || !o.salt) return false;
  try { return await sha256(o.salt + v) === o.hash; } catch (e) { return false; }
}
export const pinClear = () => LS.del(PIN);

// ---------- VIP 占位（现在没有任何功能读它做拦截，纯为将来收费铺路） ----------
// vip: { exp: '2027-06-30', code: '兑换码', at: '激活日' }
export const isVip = (uid) => { const v = P(uid).vip; return !!(v && v.exp && String(v.exp) >= today()); };
export function setVip(uid, exp, code) { const p = P(uid); p.vip = { exp, code: code || '', at: today() }; save(uid); }

// 英语小测：每个孩子选过的「学过的单元」，按课本分开记
export function getUnits(uid, book, dflt) { const e = P(uid).eng; return (e && e[book]) || dflt || []; }
export function setUnits(uid, book, arr) { const p = P(uid); p.eng = p.eng || {}; p.eng[book] = arr; save(uid); }

// ---------- 成就徽章：拿到就永久点亮（ach 里存解锁日期，永不撤销、断了也不掉） ----------
export const hasAch = (uid, id) => !!(P(uid).ach || {})[id];
export function grantAch(uid, id) {
  const p = P(uid);
  p.ach = p.ach || {};
  if (p.ach[id]) return false;
  p.ach[id] = today(); save(uid); return true;
}

const dayOf = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
// 「练过的日子」集合：星星账本（存 180 天）+ 练习记录 + 口语打卡，三者合并。
// 之前只看 log（只留 300 条，约几十天），连续天数会被截断算不准。
const activeDays = (uid) => {
  const p = P(uid), s = new Set(Object.keys(p.days));
  p.log.forEach(x => s.add(x.d));
  Object.values(p.speak).forEach(ts => s.add(dayOf(ts)));
  return s;
};
// 连续练习天数：今天还没练就从昨天往回数；打开 App 不算，得真练过
export function streak(uid) {
  const days = activeDays(uid);
  let n = 0; const d = new Date();
  if (!days.has(dayOf(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayOf(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
// 累计练过的天数（不是连续，断一天也不归零）
export const totalDays = (uid) => activeDays(uid).size;
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
  if (t.kind === 'learn') { let n = 0; for (const b of Object.values(p.learn || {})) for (const v of Object.values(b)) if (v && v.d === tod) n++; return n; }
  if (t.kind === 'speak') return Object.values(p.speak).filter(ts => dayOf(ts) === tod).length;
  if (t.kind === 'essay') { const w = extra && extra.window; if (!w) return 0; return p.log.filter(x => x.setId === w.item.id && x.d >= w.start && x.d <= w.end).length ? 1 : 0; }
  return 0;
}

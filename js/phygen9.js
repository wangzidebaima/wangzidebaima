// 九年级上册物理（苏科版）计算与判断随机题：简单机械和功、机械能和内能、电路初探、欧姆定律、电功和电热
// 只做文字题（不依赖图片），数字取整数可除尽，答案全部由程序算出，每题带分步解析。
import { chapTypes } from './chapgen.js';
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hash = (s) => { let x = 5381; for (const c of s) x = ((x << 5) + x + c.charCodeAt(0)) >>> 0; return x.toString(36); };
const Q = (typeId, stem, ans, steps) => ({ type: 'math', typeId, stem, answer: String(ans), pts: 1, id: 'r-' + typeId + '-' + hash(stem), digits: true,
  why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${ans}` });
const MC = (typeId, stem, correct, wrongs, steps, min = 2) => {
  const ws = [...new Set(wrongs.map(String).filter(w => w !== String(correct)))].slice(0, 3); if (ws.length < min) return null;
  const opts = shuf([String(correct), ...ws]);
  return { type: 'choice', plain: true, typeId, stem, options: opts, answer: 'ABCD'[opts.indexOf(String(correct))], pts: 1, id: 'r-' + typeId + '-' + hash(stem + correct),
    why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${correct}` };
};
const P = (id) => 'p9-' + id;

// ---------- 一、简单机械和功 ----------
const S1 = [
  { id: 'lev', name: '杠杆平衡条件', gen: (L) => {
    const L1 = ri(2, 6) * 10, k = ri(2, 4), L2 = L1 / k > 0 && L1 % k === 0 ? L1 / k : 10, F1 = ri(1, L === 1 ? 5 : 12) * k;
    const F2 = F1 * L1 / L2, t = ri(0, 1);
    if (t === 0) return Q(P('s1-lev'), `杠杆平衡时，动力 F₁ = ${F1} N，动力臂 L₁ = ${L1} cm，阻力臂 L₂ = ${L2} cm，则阻力 F₂ 是多少牛？`, F2, ['杠杆平衡条件：F₁L₁ = F₂L₂', `F₂ = F₁L₁ ÷ L₂ = ${F1} × ${L1} ÷ ${L2} = ${F2} N`]);
    return Q(P('s1-lev'), `杠杆平衡时，阻力 F₂ = ${F2} N，阻力臂 L₂ = ${L2} cm，动力臂 L₁ = ${L1} cm，则动力 F₁ 是多少牛？`, F1, ['杠杆平衡条件：F₁L₁ = F₂L₂', `F₁ = F₂L₂ ÷ L₁ = ${F2} × ${L2} ÷ ${L1} = ${F1} N`]); } },
  { id: 'pul', name: '滑轮组的拉力', gen: (L) => {
    const n = ri(2, 4), Gd = ri(1, 4) * n, G = ri(2, 8) * n - Gd + n, F = (G + Gd) / n;
    if (!Number.isInteger(F)) return null;
    return Q(P('s1-pul'), `用滑轮组提升重 ${G} N 的物体，动滑轮重 ${Gd} N，承担物重的绳子有 ${n} 段，不计绳重和摩擦，拉力 F 是多少牛？`, F, ['不计绳重和摩擦：F = (G物 + G动) ÷ n', `F = (${G} + ${Gd}) ÷ ${n} = ${F} N`]); } },
  { id: 'wrk', name: '功的计算', gen: (L) => {
    const F = ri(2, L === 1 ? 20 : 60) * 5, s = ri(2, 12);
    if (Math.random() < 0.6) return Q(P('s1-wrk'), `用 ${F} N 的水平推力使物体沿力的方向移动 ${s} m，推力做的功是多少焦？`, F * s, ['W = Fs', `W = ${F} × ${s} = ${F * s} J`]);
    const m = ri(2, 20) * 5, h = ri(2, 10); return Q(P('s1-wrk'), `把质量为 ${m} kg 的物体匀速举高 ${h} m，克服重力做的功是多少焦？（g 取 10 N/kg）`, m * 10 * h, ['重力 G = mg = ' + m + ' × 10 = ' + (m * 10) + ' N', `W = Gh = ${m * 10} × ${h} = ${m * 10 * h} J`]); } },
  { id: 'pow', name: '功率的计算', gen: (L) => {
    const t = ri(2, 10) * 5, P0 = ri(2, 20) * 5;
    const r = ri(0, 2);
    if (r === 0) return Q(P('s1-pow'), `一台机器在 ${t} s 内做功 ${P0 * t} J，它的功率是多少瓦？`, P0, ['P = W ÷ t', `P = ${P0 * t} ÷ ${t} = ${P0} W`]);
    if (r === 1) return Q(P('s1-pow'), `一台机器的功率是 ${P0} W，工作 ${t} s 做的功是多少焦？`, P0 * t, ['W = Pt', `W = ${P0} × ${t} = ${P0 * t} J`]);
    const v = ri(2, 10), F = ri(2, 30) * 10; return Q(P('s1-pow'), `汽车以 ${v} m/s 的速度匀速行驶，牵引力是 ${F} N，牵引力的功率是多少瓦？`, F * v, ['P = Fv', `P = ${F} × ${v} = ${F * v} W`]); } },
  { id: 'eff', name: '机械效率', gen: (L) => {
    const eta = pick([50, 60, 75, 80, 90]), Wy = eta * ri(1, 5) * (eta % 20 === 0 || eta % 25 === 0 ? 1 : 2), Wz = Wy * 100 / eta;
    if (!Number.isInteger(Wz)) return null;
    if (Math.random() < 0.5) return Q(P('s1-eff'), `某机械做的有用功是 ${Wy} J，总功是 ${Wz} J，机械效率是百分之几？（只填数字）`, eta, ['η = W有 ÷ W总 × 100%', `η = ${Wy} ÷ ${Wz} × 100% = ${eta}%`]);
    const G = ri(2, 8) * 10, Gd = ((100 - eta) * G) / eta; if (!Number.isInteger(Gd) || Gd <= 0) return null;
    return Q(P('s1-eff'), `用动滑轮匀速提升重 ${G} N 的物体，动滑轮重 ${Gd} N，不计绳重和摩擦，机械效率是百分之几？（只填数字）`, eta, ['不计绳重和摩擦：额外功只是提升动滑轮', 'η = G ÷ (G + G动) × 100%', `η = ${G} ÷ ${G + Gd} × 100% = ${eta}%`]); } },
];
// ---------- 二、机械能和内能 ----------
const S2 = [
  { id: 'qh', name: '吸收的热量', gen: (L) => {
    const m = ri(1, 10), dt = ri(2, 6) * 5;
    return Q(P('s2-qh'), `把 ${m} kg 的水从 20 ℃ 加热升高 ${dt} ℃，水吸收的热量是多少焦？（水的比热容 4.2×10³ J/(kg·℃)）`, 4200 * m * dt, ['Q吸 = cmΔt', `Q吸 = 4200 × ${m} × ${dt} = ${4200 * m * dt} J`]); } },
  { id: 'dt', name: '升高的温度', gen: (L) => {
    const m = ri(1, 5) * 2, dt = ri(2, 10) * 2;
    return Q(P('s2-dt'), `${m} kg 的水吸收了 ${4200 * m * dt} J 的热量，温度升高了多少 ℃？（水的比热容 4.2×10³ J/(kg·℃)）`, dt, ['Δt = Q ÷ (cm)', `Δt = ${4200 * m * dt} ÷ (4200 × ${m}) = ${dt} ℃`]); } },
  { id: 'fuel', name: '燃料放出的热量', gen: (L) => {
    const q = pick([3, 4, 5]), m = ri(1, 12);
    return Q(P('s2-fuel'), `完全燃烧 ${m} kg 的某种燃料，其热值为 ${q}×10⁷ J/kg，放出的热量是多少 ×10⁷ J？（只填数字）`, q * m, ['Q放 = mq', `Q放 = ${m} × ${q}×10⁷ J = ${q * m}×10⁷ J`]); } },
  { id: 'eng', name: '热机效率', gen: (L) => {
    const eta = pick([20, 25, 30, 40]), Q0 = ri(1, 9) * 100, W = Q0 * eta / 100;
    return Q(P('s2-eng'), `某热机完全燃烧燃料放出 ${Q0} J 的热量，其中用来做有用功的能量是 ${W} J，热机效率是百分之几？（只填数字）`, eta, ['η = W有 ÷ Q放 × 100%', `η = ${W} ÷ ${Q0} × 100% = ${eta}%`]); } },
  { id: 'ene', name: '机械能与内能判断', gen: (L) => {
    const L0 = [['物体从斜面上匀速下滑，它的动能与重力势能', '动能不变，重力势能减小', ['动能增大，重力势能减小', '动能减小，重力势能不变', '动能不变，重力势能不变'], '匀速下滑速度不变，动能不变；高度降低，重力势能减小']
      , ['汽油机的做功冲程中，能量转化是', '内能转化为机械能', ['机械能转化为内能', '化学能转化为电能', '电能转化为内能'], '做功冲程中高温高压燃气推动活塞，内能转化为机械能']
      , ['下列改变内能的方式，属于做功的是', '搓手取暖', ['晒太阳取暖', '用热水袋取暖', '烤火取暖'], '搓手时克服摩擦做功，机械能转化为内能；其余为热传递']
      , ['质量相同的水和砂石吸收相同的热量，升高温度较多的是', '砂石', ['水', '一样多', '无法判断'], '水的比热容较大，吸热相同时升温较慢，砂石升温更多']
      , ['热传递的方向是', '从高温物体传向低温物体', ['从内能大的传向内能小的', '从质量大的传向质量小的', '从低温传向高温'], '热量自发地从高温物体传向低温物体']];
    const x = pick(L0); return MC(P('s2-ene'), x[0], x[1], x[2], [x[3]]); } },
];
// ---------- 三、电路初探 ----------
const S3 = [
  { id: 'sv', name: '串联电压', gen: (L) => {
    const U1 = ri(1, 8), U2 = ri(1, 8), U = U1 + U2;
    if (Math.random() < 0.5) return Q(P('s3-sv'), `两个灯泡串联，每个灯泡两端的电压分别是 ${U1} V 和 ${U2} V，电源电压是多少伏？`, U, ['串联电路中，电源电压等于各部分电压之和', `U = ${U1} + ${U2} = ${U} V`]);
    return Q(P('s3-sv'), `两个灯泡串联，电源电压是 ${U} V，其中一个灯泡两端的电压是 ${U1} V，另一个灯泡两端的电压是多少伏？`, U2, ['串联电路中，U = U₁ + U₂', `U₂ = ${U} − ${U1} = ${U2} V`]); } },
  { id: 'pc', name: '并联电流', gen: (L) => {
    const I1 = ri(1, 9) * 0.1, I2 = ri(1, 9) * 0.1, a = ri(2, 9), b = ri(2, 9);
    if (Math.random() < 0.5) return Q(P('s3-pc'), `两个灯泡并联，通过它们的电流分别是 ${a} A 和 ${b} A，干路电流是多少安？`, a + b, ['并联电路中，干路电流等于各支路电流之和', `I = ${a} + ${b} = ${a + b} A`]);
    return Q(P('s3-pc'), `两个灯泡并联，干路电流是 ${a + b} A，其中一条支路的电流是 ${a} A，另一条支路的电流是多少安？`, b, ['并联电路中，I = I₁ + I₂', `I₂ = ${a + b} − ${a} = ${b} A`]); } },
  { id: 'cir', name: '电路连接判断', gen: (L) => {
    const L0 = [['串联电路中，一个用电器断路，其他用电器', '都不能工作', ['仍能工作', '变得更亮', '变得更暗'], '串联电路只有一条通路，一处断开，整个电路断路']
      , ['家庭电路中各用电器之间是', '并联', ['串联', '混联', '无法确定'], '家用电器互不影响，是并联的']
      , ['使用电流表时，电流表应该与被测用电器', '串联', ['并联', '混联', '都可以'], '电流表内阻很小，必须串联，绝不能直接接在电源两端']
      , ['使用电压表时，电压表应该与被测用电器', '并联', ['串联', '混联', '都可以'], '电压表内阻很大，应并联在被测电路两端']
      , ['下列物体中，通常情况下属于导体的是', '铜线', ['橡胶', '玻璃', '陶瓷'], '金属容易导电，橡胶、玻璃、陶瓷是绝缘体']];
    const x = pick(L0); return MC(P('s3-cir'), x[0], x[1], x[2], [x[3]]); } },
];
// ---------- 四、欧姆定律 ----------
const S4 = [
  { id: 'ohm', name: '欧姆定律的计算', gen: (L) => {
    const R = ri(2, L === 1 ? 10 : 30), I = ri(1, 6), U = R * I, r = ri(0, 2);
    if (r === 0) return Q(P('s4-ohm'), `一个电阻为 ${R} Ω 的导体，两端电压是 ${U} V，通过它的电流是多少安？`, I, ['I = U ÷ R', `I = ${U} ÷ ${R} = ${I} A`]);
    if (r === 1) return Q(P('s4-ohm'), `一个电阻为 ${R} Ω 的导体，通过的电流是 ${I} A，它两端的电压是多少伏？`, U, ['U = IR', `U = ${I} × ${R} = ${U} V`]);
    return Q(P('s4-ohm'), `一个导体两端电压是 ${U} V，通过的电流是 ${I} A，它的电阻是多少欧？`, R, ['R = U ÷ I', `R = ${U} ÷ ${I} = ${R} Ω`]); } },
  { id: 'rs', name: '串联电路的电阻', gen: (L) => {
    const R1 = ri(2, 20), R2 = ri(2, 20);
    if (Math.random() < 0.5) return Q(P('s4-rs'), `把 ${R1} Ω 和 ${R2} Ω 的两个电阻串联，总电阻是多少欧？`, R1 + R2, ['串联电路的总电阻等于各电阻之和', `R = ${R1} + ${R2} = ${R1 + R2} Ω`]);
    return Q(P('s4-rs'), `串联电路的总电阻是 ${R1 + R2} Ω，其中一个电阻是 ${R1} Ω，另一个电阻是多少欧？`, R2, ['串联：R = R₁ + R₂', `R₂ = ${R1 + R2} − ${R1} = ${R2} Ω`]); } },
  { id: 'rp', name: '并联电路的电阻', gen: (L) => {
    const [a, b] = pick([[3, 6], [4, 12], [6, 12], [20, 30], [10, 40], [15, 30], [12, 24], [5, 20], [30, 60], [10, 15]]);
    const R = a * b / (a + b); if (!Number.isInteger(R)) return null;
    return Q(P('s4-rp'), `把 ${a} Ω 和 ${b} Ω 的两个电阻并联，总电阻是多少欧？`, R, ['并联：1/R = 1/R₁ + 1/R₂，两个电阻时 R = R₁R₂ ÷ (R₁ + R₂)', `R = ${a} × ${b} ÷ ${a + b} = ${R} Ω`]); } },
  { id: 'sc', name: '串联电路的电压分配', gen: (L) => {
    const R1 = ri(2, 10), R2 = ri(2, 10), I = ri(1, 4), U = I * (R1 + R2);
    return Q(P('s4-sc'), `${R1} Ω 和 ${R2} Ω 的两个电阻串联后接在 ${U} V 的电源上，${R1} Ω 的电阻两端的电压是多少伏？`, I * R1, [`总电阻 R = ${R1} + ${R2} = ${R1 + R2} Ω`, `电流 I = ${U} ÷ ${R1 + R2} = ${I} A（串联电流处处相等）`, `U₁ = IR₁ = ${I} × ${R1} = ${I * R1} V`]); } },
  { id: 'pc2', name: '并联电路的干路电流', gen: (L) => {
    const R1 = pick([4, 6, 10, 12, 20]), R2 = pick([5, 10, 15, 30]), l = R1 * R2 / gcd(R1, R2), U = l * ri(1, 2);
    return Q(P('s4-pc2'), `${R1} Ω 和 ${R2} Ω 的两个电阻并联后接在 ${U} V 的电源上，干路电流是多少安？`, U / R1 + U / R2, [`I₁ = ${U} ÷ ${R1} = ${U / R1} A（并联各支路电压相等）`, `I₂ = ${U} ÷ ${R2} = ${U / R2} A`, `干路电流 I = I₁ + I₂ = ${U / R1 + U / R2} A`]); } },
];
function gcd(a, b) { while (b) [a, b] = [b, a % b]; return a; }
// ---------- 五、电功和电热 ----------
const S5 = [
  { id: 'pui', name: '电功率 P = UI', gen: (L) => {
    const U = pick([6, 12, 24, 36, 220]), I = ri(1, 5);
    if (Math.random() < 0.5) return Q(P('s5-pui'), `一个用电器接在 ${U} V 的电路中，通过它的电流是 ${I} A，它的电功率是多少瓦？`, U * I, ['P = UI', `P = ${U} × ${I} = ${U * I} W`]);
    const R = ri(2, 20), I2 = ri(1, 5); return Q(P('s5-pui'), `一个 ${R} Ω 的电阻，通过的电流是 ${I2} A，它消耗的电功率是多少瓦？`, I2 * I2 * R, ['P = I²R', `P = ${I2}² × ${R} = ${I2 * I2 * R} W`]); } },
  { id: 'wk', name: '电功 W = Pt', gen: (L) => {
    const P0 = ri(1, 10) * 100, h = ri(2, 10);
    return Q(P('s5-wk'), `一个电热水壶的电功率是 ${P0} W，正常工作 ${h} h，消耗的电能是多少 W·h？（只填数字）`, P0 * h, ['W = Pt', `W = ${P0} W × ${h} h = ${P0 * h} W·h`]); } },
  { id: 'jq', name: '焦耳定律 Q = I²Rt', gen: (L) => {
    const I = ri(1, 4), R = ri(2, 20), t = ri(2, 10) * 5;
    return Q(P('s5-jq'), `一个 ${R} Ω 的电阻，通过的电流是 ${I} A，通电 ${t} s 产生的热量是多少焦？`, I * I * R * t, ['焦耳定律：Q = I²Rt', `Q = ${I}² × ${R} × ${t} = ${I * I * R * t} J`]); } },
  { id: 'jud', name: '电功率与电能判断', gen: (L) => {
    const L0 = [['灯泡的亮度取决于它的', '实际功率', ['额定功率', '额定电压', '电阻'], '灯泡越亮，说明实际功率越大']
      , ['电能表是测量', '消耗电能（电功）的仪表', ['电流的仪表', '电压的仪表', '电功率的仪表'], '电能表测量一段时间内用电器消耗的电能']
      , ['1 度电等于', '1 kW·h', ['1 W', '1 kW', '1 J'], '1 度 = 1 kW·h = 3.6×10⁶ J']
      , ['一个标有“220 V 40 W”的灯泡，其中 40 W 表示', '额定功率', ['实际功率', '最大电流', '电阻'], '灯泡铭牌上标的是额定电压和额定功率']
      , ['电流通过导体产生热量的多少与下列无关的是', '导体的颜色', ['电流的大小', '导体的电阻', '通电时间'], 'Q = I²Rt，与电流、电阻、通电时间有关']];
    const x = pick(L0); return MC(P('s5-jud'), x[0], x[1], x[2], [x[3]]); } },
];
export const CHP9 = [
  { id: 's1', name: '简单机械和功', types: S1 },
  { id: 's2', name: '机械能和内能', types: S2 },
  { id: 's3', name: '电路初探', types: S3 },
  { id: 's4', name: '欧姆定律', types: S4 },
  { id: 's5', name: '电功和电热', types: S5 },
];
export const PHY9_TYPES = chapTypes(CHP9, 'p9-');

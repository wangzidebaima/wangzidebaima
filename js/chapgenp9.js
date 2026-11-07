// 九年级上册物理（苏科版）计算与判断随机题：简单机械和功、机械能和内能、电路初探、欧姆定律
// 答案由程序算出，每题带分步解析。取 g = 10 N/kg，水的比热容 4.2×10³ J/(kg·℃)。
// 填空只有正整数或小数；其余用选择题。
import { chapTypes } from './chapgen.js';
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuf = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hash = (s) => { let x = 5381; for (const c of s) x = ((x << 5) + x + c.charCodeAt(0)) >>> 0; return x.toString(36); };
const d = (x) => String(+x.toFixed(3));
const Q = (typeId, stem, ans, steps, extra) => Object.assign({ type: 'math', typeId, stem, answer: String(ans), pts: 1, id: 'r-' + typeId + '-' + hash(stem), digits: true,
  why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${ans}` }, extra || {});
const QD = (typeId, stem, ans, steps) => Q(typeId, stem, ans, steps, { digits: false });
const MC = (typeId, stem, correct, wrongs, steps) => {
  const ws = [...new Set(wrongs.map(String).filter(w => w !== String(correct)))].slice(0, 3); if (ws.length < 2) return null;
  const opts = shuf([String(correct), ...ws]);
  return { type: 'choice', plain: true, typeId, stem, options: opts, answer: 'ABCD'[opts.indexOf(String(correct))], pts: 1, id: 'r-' + typeId + '-' + hash(stem + correct),
    why: steps.map((s, i) => `${i + 1}. ${s}`).join('\n') + `\n答案：${correct}` };
};

// ---------- 一、简单机械和功 ----------
const S1 = [
  { id: 'lev', name: '杠杆平衡条件', gen: (L) => {
    const L1 = ri(2, 6) * 10, L2 = pick([10, 20, 30, 40, 50].filter(x => x !== L1)), k = ri(1, L === 1 ? 4 : 8);
    const F2 = (L1 / 10) * k; const F1v = F2 * L2 / L1; // = k*L2/10，整数
    const w = ri(0, 2);
    if (w === 0) return Q('p9-s1-lev', `杠杆平衡时，动力臂是 ${L1} cm，阻力臂是 ${L2} cm，阻力是 ${F2} N，动力是多少 N？`, F1v, ['杠杆平衡条件：动力 × 动力臂 = 阻力 × 阻力臂', `F₁ × ${L1} = ${F2} × ${L2}`, `F₁ = ${F2} × ${L2} ÷ ${L1} = ${F1v} N`]);
    if (w === 1) return Q('p9-s1-lev', `杠杆平衡时，动力是 ${F1v} N，阻力是 ${F2} N，动力臂是 ${L1} cm，阻力臂是多少 cm？`, L2, ['杠杆平衡条件：F₁L₁ = F₂L₂', `${F1v} × ${L1} = ${F2} × L₂`, `L₂ = ${F1v} × ${L1} ÷ ${F2} = ${L2} cm`]);
    return Q('p9-s1-lev', `杠杆平衡时，动力是 ${F1v} N，动力臂是 ${L1} cm，阻力臂是 ${L2} cm，阻力是多少 N？`, F2, ['杠杆平衡条件：F₁L₁ = F₂L₂', `${F1v} × ${L1} = F₂ × ${L2}`, `F₂ = ${F1v} × ${L1} ÷ ${L2} = ${F2} N`]); } },
  { id: 'type', name: '省力杠杆还是费力杠杆', gen: () => {
    const a = ri(2, 9) * 5, b = ri(2, 9) * 5; const r = a > b ? '省力杠杆' : a < b ? '费力杠杆' : '等臂杠杆';
    return MC('p9-s1-type', `一根杠杆，动力臂是 ${a} cm，阻力臂是 ${b} cm，它是什么杠杆？`, r, ['省力杠杆', '费力杠杆', '等臂杠杆'], ['动力臂大于阻力臂是省力杠杆；小于是费力杠杆；相等是等臂杠杆', `${a} cm ${a > b ? '>' : a < b ? '<' : '='} ${b} cm，所以是${r}`]); } },
  { id: 'pul', name: '滑轮组的拉力', gen: (L) => {
    const n = ri(2, 4), g = ri(1, 4) * 10, G = ri(2, 12) * 10 * 1, F = (G + g) / n;
    if (!Number.isInteger(F)) return S1[2].gen(L);
    return Q('p9-s1-pul', `用 ${n} 段绳子承担物重的滑轮组提升重 ${G} N 的物体，动滑轮重 ${g} N，不计绳重和摩擦，拉力是多少 N？`, F, ['不计绳重和摩擦：F = (G物 + G动) ÷ n', `F = (${G} + ${g}) ÷ ${n} = ${F} N`]); } },
  { id: 'work', name: '功的计算', gen: (L) => {
    const F = ri(2, L === 1 ? 10 : 30) * 10, s = ri(2, 20);
    if (Math.random() < 0.5) return Q('p9-s1-work', `用 ${F} N 的水平推力推着物体在水平地面上前进 ${s} m，推力做的功是多少 J？`, F * s, ['功 W = F s（力与距离方向一致）', `W = ${F} × ${s} = ${F * s} J`]);
    const m = ri(2, 20) * 5, h = ri(2, 10); return Q('p9-s1-work', `把质量为 ${m} kg 的物体匀速举高 ${h} m，克服重力做的功是多少 J？（g 取 10 N/kg）`, m * 10 * h, ['物重 G = mg = ' + m + ' × 10 = ' + m * 10 + ' N', `W = Gh = ${m * 10} × ${h} = ${m * 10 * h} J`]); } },
  { id: 'power', name: '功率的计算', gen: (L) => {
    const t = ri(2, 12) * 5, P = ri(2, 20) * 10, W = P * t, w = ri(0, 2);
    if (w === 0) return Q('p9-s1-power', `某机器在 ${t} s 内做功 ${W} J，它的功率是多少 W？`, P, ['功率 P = W ÷ t', `P = ${W} ÷ ${t} = ${P} W`]);
    if (w === 1) return Q('p9-s1-power', `功率为 ${P} W 的机器工作 ${t} s，做的功是多少 J？`, W, ['W = P t', `W = ${P} × ${t} = ${W} J`]);
    const v = ri(2, 10), F = ri(2, 30) * 10; return Q('p9-s1-power', `汽车以 ${v} m/s 的速度匀速行驶，牵引力是 ${F} N，牵引力做功的功率是多少 W？`, F * v, ['P = W/t = Fs/t = Fv', `P = ${F} × ${v} = ${F * v} W`]); } },
  { id: 'eff', name: '机械效率', gen: (L) => {
    const eta = pick([50, 60, 70, 75, 80, 90]), Wz = ri(2, 20) * 100 / (eta % 3 === 0 && eta !== 60 && eta !== 90 ? 1 : 1);
    const Wt = eta === 75 ? ri(1, 10) * 400 : ri(1, 10) * 100 * (eta % 10 === 0 ? 1 : 2), Wy = Wt * eta / 100;
    if (!Number.isInteger(Wy)) return S1[5].gen(L);
    if (Math.random() < 0.5) return Q('p9-s1-eff', `某机械做的有用功是 ${Wy} J，总功是 ${Wt} J，它的机械效率是百分之几？（只填数字）`, eta, ['机械效率 η = W有 ÷ W总 × 100%', `η = ${Wy} ÷ ${Wt} × 100% = ${eta}%`]);
    return Q('p9-s1-eff', `某机械的总功是 ${Wt} J，机械效率是 ${eta}%，它做的有用功是多少 J？`, Wy, ['W有 = W总 × η', `W有 = ${Wt} × ${eta}% = ${Wy} J`]); } },
  { id: 'peff', name: '滑轮组的机械效率', gen: () => {
    const n = ri(2, 3), G = pick([40, 60, 80, 90, 120, 160, 180]), F = pick([25, 30, 40, 50, 60, 100].filter(f => (G / (n * f)) * 100 <= 95)), eta = G / (n * F) * 100;
    if (!Number.isInteger(eta)) return S1[6].gen();
    return Q('p9-s1-peff', `用 ${n} 段绳子承担物重的滑轮组匀速提升重 ${G} N 的物体，拉力 ${F} N，滑轮组的机械效率是百分之几？（只填数字）`, eta, ['η = W有 ÷ W总 = Gh ÷ (F·nh) = G ÷ (nF)', `η = ${G} ÷ (${n} × ${F}) × 100% = ${eta}%`]); } },
];

// ---------- 二、机械能和内能 ----------
const S2 = [
  { id: 'heat', name: '热量的计算（Q=cmΔt）', gen: (L) => {
    const m = pick([0.5, 1, 2, 3, 5]), dt = ri(2, L === 1 ? 10 : 40), Q0 = 4200 * m * dt;
    if (Math.random() < 0.5) return Q('p9-s2-heat', `质量为 ${d(m)} kg 的水温度升高 ${dt} ℃，吸收的热量是多少 J？（水的比热容 4.2×10³ J/(kg·℃)）`, Q0, ['Q吸 = c m Δt', `Q = 4200 × ${d(m)} × ${dt} = ${Q0} J`]);
    return Q('p9-s2-heat', `质量为 ${d(m)} kg 的水吸收 ${Q0} J 的热量，温度升高多少 ℃？（水的比热容 4.2×10³ J/(kg·℃)）`, dt, ['由 Q = c m Δt 得 Δt = Q ÷ (c m)', `Δt = ${Q0} ÷ (4200 × ${d(m)}) = ${dt} ℃`]); } },
  { id: 'fuel', name: '热值与燃料放热', gen: () => {
    const f = pick([['煤', 3], ['焦炭', 3], ['干木柴', 1.2]]), m = ri(1, 10), Qv = f[1] * m;
    return QD('p9-s2-fuel', `完全燃烧 ${m} kg ${f[0]}，放出的热量是多少（单位：×10⁷ J）？（${f[0]}的热值取 ${f[1]}×10⁷ J/kg）`, d(Qv), ['Q放 = m q', `Q = ${m} × ${f[1]}×10⁷ J = ${d(Qv)}×10⁷ J`]); } },
  { id: 'engine', name: '热机效率', gen: () => {
    const Qv = ri(1, 9) * 10, eta = pick([20, 30, 40, 50]), W = Qv * eta / 100;
    if (Math.random() < 0.5) return Q('p9-s2-engine', `某热机燃料完全燃烧放出 ${Qv}×10⁶ J 热量，热机效率是 ${eta}%，它做的有用功是多少（单位：×10⁶ J）？`, W, ['热机效率 η = W有 ÷ Q放', `W有 = Q放 × η = ${Qv} × ${eta}% = ${W}（×10⁶ J）`]);
    return Q('p9-s2-engine', `某热机燃料完全燃烧放出 ${Qv}×10⁶ J 热量，其中 ${W}×10⁶ J 变成有用功，热机效率是百分之几？（只填数字）`, eta, ['η = W有 ÷ Q放 × 100%', `η = ${W} ÷ ${Qv} × 100% = ${eta}%`]); } },
  { id: 'spec', name: '比热容的理解', gen: () => {
    const q = pick([
      ['质量相同的水和沙石吸收相同的热量，谁升温更快？（水的比热容大于沙石）', '沙石', ['水', '一样快', '无法判断'], 'Q = c m Δt，Q、m 相同时，比热容越小，升温越快；沙石的比热容小'],
      ['沿海地区昼夜温差比内陆小，主要因为水的什么较大？', '比热容', ['密度', '热值', '沸点'], '水的比热容大，吸放热相同时温度变化小'],
      ['冬天用热水袋取暖，是利用水的什么特性？', '比热容大', ['密度大', '热值高', '沸点高'], '同质量的水降温时放出的热量多，适合取暖'],
      ['物质的比热容与下列哪个因素有关？', '物质的种类和状态', ['物体吸收的热量', '物体的质量', '物体升高的温度'], '比热容是物质的特性，与质量、吸热多少、温度变化无关']]);
    return MC('p9-s2-spec', q[0], q[1], q[2], [q[3]]); } },
  { id: 'mech', name: '动能与势能的变化', gen: () => {
    const q = pick([
      ['物体沿斜面匀速上升，它的动能和重力势能怎样变化？', '动能不变，重力势能增大', ['动能增大，重力势能不变', '动能减小，重力势能增大', '动能不变，重力势能不变'], '匀速：速度不变，动能不变；高度升高，重力势能增大'],
      ['小球从斜面顶端自由滚下（不计摩擦），下滑过程中', '重力势能减小，动能增大', ['重力势能增大，动能减小', '重力势能和动能都增大', '重力势能和动能都减小'], '高度降低、速度变大'],
      ['卫星从近地点向远地点运动时', '动能减小，势能增大', ['动能增大，势能减小', '动能和势能都增大', '动能和势能都不变'], '离地球越远，势能越大，速度越小'],
      ['质量不变的物体匀速下落时，机械能怎样变化？', '减小', ['增大', '不变', '先增大后减小'], '动能不变，重力势能减小，机械能减小']]);
    return MC('p9-s2-mech', q[0], q[1], q[2], [q[3]]); } },
];

// ---------- 三、电路初探 ----------
const S3 = [
  { id: 'ser', name: '串联电路电压与电流', gen: (L) => {
    const U1 = ri(1, 8), U2 = ri(1, 8), U = U1 + U2;
    const w = ri(0, 1);
    if (w === 0) return Q('p9-s3-ser', `两个灯泡串联接在电源上，电源电压是 ${U} V，灯 L₁ 两端电压是 ${U1} V，灯 L₂ 两端电压是多少 V？`, U2, ['串联电路中，总电压等于各部分电路电压之和：U = U₁ + U₂', `U₂ = ${U} − ${U1} = ${U2} V`]);
    const I = d(ri(2, 8) / 10); return QD('p9-s3-ser', `两个灯泡串联，通过 L₁ 的电流是 ${I} A，通过 L₂ 的电流是多少 A？`, I, ['串联电路中电流处处相等', `I₂ = I₁ = ${I} A`]); } },
  { id: 'par', name: '并联电路电流与电压', gen: () => {
    const a = ri(1, 9) / 10 * 2, b = ri(1, 9) / 10, I = a + b;
    if (Math.random() < 0.5) return QD('p9-s3-par', `两个灯泡并联，通过 L₁ 的电流是 ${d(a)} A，通过 L₂ 的电流是 ${d(b)} A，干路电流是多少 A？`, d(I), ['并联电路中，干路电流等于各支路电流之和：I = I₁ + I₂', `I = ${d(a)} + ${d(b)} = ${d(I)} A`]);
    return QD('p9-s3-par', `两个灯泡并联，干路电流是 ${d(I)} A，通过 L₁ 的电流是 ${d(a)} A，通过 L₂ 的电流是多少 A？`, d(b), ['I = I₁ + I₂', `I₂ = ${d(I)} − ${d(a)} = ${d(b)} A`]); } },
  { id: 'cells', name: '电池组的电压', gen: () => {
    const n = ri(2, 6);
    if (Math.random() < 0.5) return Q('p9-s3-cells', `把 ${n} 节新干电池串联起来，电池组的电压是多少 V？（每节干电池 1.5 V，可以带小数）`, 1.5 * n, ['串联电池组的电压等于各电池电压之和', `U = 1.5 × ${n} = ${1.5 * n} V`].concat(Number.isInteger(1.5 * n) ? [] : []), { digits: Number.isInteger(1.5 * n) });
    return MC('p9-s3-cells', `把 ${n} 节新干电池并联起来，电池组的电压是多少？`, '1.5 V', [`${1.5 * n} V`, `${n} V`, '3 V'], ['并联电池组的电压等于一节电池的电压', '所以仍是 1.5 V']); } },
  { id: 'meter', name: '电流表与电压表的使用', gen: () => {
    const q = pick([
      ['测量灯泡两端的电压，电压表应', '与灯泡并联', ['与灯泡串联', '串联或并联均可', '接在电源两端外'], '电压表要并联在被测电路两端'],
      ['测量通过灯泡的电流，电流表应', '与灯泡串联', ['与灯泡并联', '并联或串联均可', '直接接在电源两端'], '电流表要串联在被测电路中；绝不能直接接在电源两极'],
      ['使用电流表时，电流应', '从“+”接线柱流入，“−”接线柱流出', ['从“−”接线柱流入', '随便怎么接', '同时接“+”接线柱'], '正进负出，否则指针反偏'],
      ['不知道被测电流大小时，电流表应先选', '大量程试触', ['小量程', '任意量程', '不用试触'], '先用大量程试触，防止烧坏电表']]);
    return MC('p9-s3-meter', q[0], q[1], q[2], [q[3]]); } },
];

// ---------- 四、欧姆定律 ----------
const S4 = [
  { id: 'ohm', name: '欧姆定律 I=U/R', gen: (L) => {
    const R = pick([2, 4, 5, 6, 8, 10, 12, 15, 20, 30]), I = ri(1, L === 1 ? 5 : 9), U = R * I, w = ri(0, 2);
    if (w === 0) return Q('p9-s4-ohm', `一段导体的电阻是 ${R} Ω，通过它的电流是 ${I} A，它两端的电压是多少 V？`, U, ['欧姆定律 I = U/R，变形得 U = IR', `U = ${I} × ${R} = ${U} V`]);
    if (w === 1) return Q('p9-s4-ohm', `一段导体两端的电压是 ${U} V，通过的电流是 ${I} A，它的电阻是多少 Ω？`, R, ['R = U ÷ I', `R = ${U} ÷ ${I} = ${R} Ω`]);
    return Q('p9-s4-ohm', `一段导体的电阻是 ${R} Ω，两端电压是 ${U} V，通过它的电流是多少 A？`, I, ['I = U ÷ R', `I = ${U} ÷ ${R} = ${I} A`]); } },
  { id: 'oser', name: '串联电路的电流与分压', gen: () => {
    const R1 = pick([4, 5, 6, 10, 20]), R2 = pick([2, 4, 5, 10, 20]), I = ri(1, 4), U = (R1 + R2) * I, w = ri(0, 1);
    if (w === 0) return Q('p9-s4-oser', `R₁ = ${R1} Ω 与 R₂ = ${R2} Ω 串联，电源电压 ${U} V，电路中的电流是多少 A？`, I, ['串联电路总电阻 R = R₁ + R₂', `R = ${R1} + ${R2} = ${R1 + R2} Ω`, `I = U ÷ R = ${U} ÷ ${R1 + R2} = ${I} A`]);
    return Q('p9-s4-oser', `R₁ = ${R1} Ω 与 R₂ = ${R2} Ω 串联，电源电压 ${U} V，R₂ 两端的电压是多少 V？`, I * R2, ['总电阻 R = R₁ + R₂ = ' + (R1 + R2) + ' Ω', `I = U ÷ R = ${U} ÷ ${R1 + R2} = ${I} A`, `U₂ = I R₂ = ${I} × ${R2} = ${I * R2} V`]); } },
  { id: 'opar', name: '并联电路的电流', gen: () => {
    const [R1, R2] = pick([[10, 20], [6, 12], [20, 30], [12, 4], [15, 30], [10, 40]]), L = R1 * R2 / (function g(a, b) { return b ? g(b, a % b) : a; })(R1, R2), U = L * ri(1, 2), I1 = U / R1, I2 = U / R2;
    if (Math.random() < 0.5) return Q('p9-s4-opar', `R₁ = ${R1} Ω 与 R₂ = ${R2} Ω 并联在 ${U} V 的电源上，干路电流是多少 A？`, I1 + I2, ['并联各支路两端电压都等于电源电压', `I₁ = U ÷ R₁ = ${U} ÷ ${R1} = ${I1} A，I₂ = ${U} ÷ ${R2} = ${I2} A`, `I = I₁ + I₂ = ${I1 + I2} A`]);
    return Q('p9-s4-opar', `R₁ = ${R1} Ω 与 R₂ = ${R2} Ω 并联在 ${U} V 的电源上，通过 R₂ 的电流是多少 A？`, I2, ['并联各支路电压相等，都是 ' + U + ' V', `I₂ = U ÷ R₂ = ${U} ÷ ${R2} = ${I2} A`]); } },
  { id: 'rpar', name: '并联总电阻', gen: () => {
    const [a, b, r] = pick([[6, 3, 2], [12, 4, 3], [20, 30, 12], [10, 10, 5], [15, 10, 6], [12, 6, 4], [60, 20, 15], [30, 30, 15]]);
    return Q('p9-s4-rpar', `${a} Ω 和 ${b} Ω 的两个电阻并联，总电阻是多少 Ω？`, r, ['并联：1/R = 1/R₁ + 1/R₂，即 R = R₁R₂ ÷ (R₁ + R₂)', `R = ${a} × ${b} ÷ (${a} + ${b}) = ${a * b} ÷ ${a + b} = ${r} Ω`]); } },
  { id: 'prop', name: '电阻不变时电流与电压', gen: () => {
    const I = ri(1, 5) * 2, U = ri(1, 4) * 2, k = ri(2, 4);
    if (Math.random() < 0.5) return Q('p9-s4-prop', `某导体两端电压是 ${U} V 时，通过它的电流是 ${I / 2} A；当电压增大到 ${U * k} V 时（电阻不变），通过的电流是多少 A？`, d(I / 2 * k), ['电阻不变时，电流与电压成正比', `电压变为原来的 ${k} 倍，电流也变为 ${k} 倍：${d(I / 2)} × ${k} = ${d(I / 2 * k)} A`], { digits: false });
    return MC('p9-s4-prop', `某导体两端电压为 ${U} V 时电流为 ${I} A，当它两端电压变为 0 V 时，这个导体的电阻是多少 Ω？`, d(U / I), ['0', `${d(U * 2 / I)}`, `${d(U / I / 2)}`], ['电阻是导体本身的性质，与电压、电流无关', `R = U ÷ I = ${U} ÷ ${I} = ${d(U / I)} Ω，电压为 0 时电阻不变`]); } },
];

export const CHP9 = [
  { id: 's1', name: '第十一章 简单机械和功', types: S1 },
  { id: 's2', name: '第十二章 机械能和内能', types: S2 },
  { id: 's3', name: '第十三章 电路初探', types: S3 },
  { id: 's4', name: '第十四章 欧姆定律', types: S4 },
];
export const CHAPP9_TYPES = chapTypes(CHP9, 'p9-');

// 口语打卡：把孩子读的句子录下来，放给他自己听。
//
// 以前用的是浏览器自带的语音识别（webkitSpeechRecognition）。那个是云端识别，
// 每句话都要发到 Google 服务器去算——国内直连根本连不上，孩子点了 🎤 之后干等 9 秒
// 一点反应都没有，看着就像坏了（实测：直连 speech-api 8 秒超时）。
//
// 所以改成纯本地录音回放，四条底线：
//   1. 录音只在这台手机上，不上传、不保存，退出页面就没了
//   2. 完全不联网，微信里、老手机、断网都能用
//   3. 孩子点 🎤 的那一刻才开麦克风，录完立刻关掉
//   4. 手机没有麦克风、或者没给权限，就退回原来的直接打卡，绝不把孩子卡在这儿

// 这支手机能录音吗
export function recApi() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return null;
  return window.MediaRecorder || null;
}
export const recReady = () => !!recApi() && !!(window.AudioContext || window.webkitAudioContext);

// 各浏览器认的格式不一样：Chrome/Edge/安卓要 webm，苹果要 mp4
const MIMES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
function pickMime() {
  const R = recApi();
  if (!R || !R.isTypeSupported) return '';
  for (const m of MIMES) if (R.isTypeSupported(m)) return m;
  return '';
}

// 开录。
//   onLevel(0~1)：实时音量，用来画跳动的声波（孩子看到条在动，才知道手机在听）
//   onTick(秒)：已录了几秒
//   maxMs：最长录多久自动停，防止孩子忘按停
// 返回 { stop() -> Promise<{url, ms, blob}>, cancel() }
// 拿不到麦克风会抛错，调用方自己兜住
export async function startRec({ onLevel, onTick, maxMs = 15000 } = {}) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = pickMime();
  let rec;
  try { rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined); }
  catch (e) { rec = new MediaRecorder(stream); }

  const chunks = [];
  const t0 = Date.now();
  let stopped = false, raf = 0, timer = 0, auto = 0;
  const clean = () => {
    clearTimeout(auto); clearTimeout(timer); cancelAnimationFrame(raf);
    stream.getTracks().forEach(t => { try { t.stop(); } catch (e) { /* ignore */ } });
  };

  // 音量条：拿不到也不影响录音，只是没有动静给孩子看
  let ctx = null;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    const an = ctx.createAnalyser();
    an.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(an);
    const buf = new Uint8Array(an.frequencyBinCount);
    const loop = () => {
      an.getByteFrequencyData(buf);
      let s = 0;
      for (let i = 0; i < buf.length; i++) s += buf[i];
      if (onLevel) onLevel(Math.min(1, s / buf.length / 70));
      raf = requestAnimationFrame(loop);
    };
    loop();
  } catch (e) { /* ignore */ }

  const done = new Promise((resolve) => {
    rec.onstop = () => {
      clean();
      try { ctx && ctx.close(); } catch (e) { /* ignore */ }
      const blob = new Blob(chunks, { type: mime || rec.mimeType || 'audio/webm' });
      resolve({ url: URL.createObjectURL(blob), ms: Date.now() - t0, blob });
    };
  });

  rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
  rec.start(200);

  const api = {
    stop() {
      if (!stopped) { stopped = true; try { if (rec.state !== 'inactive') rec.stop(); } catch (e) { /* ignore */ } }
      return done;
    },
    cancel() {
      if (stopped) return;
      stopped = true;
      chunks.length = 0;
      try { if (rec.state !== 'inactive') rec.stop(); } catch (e) { /* ignore */ }
    },
  };
  auto = setTimeout(() => api.stop(), maxMs);
  if (onTick) {
    const tick = () => {
      if (stopped) return;
      onTick(Math.round((Date.now() - t0) / 1000));
      timer = setTimeout(tick, 250);
    };
    tick();
  }
  return api;
}

// 麦克风拿不到时，给孩子/家长看的话
export function micErrText(e) {
  const n = (e && e.name) || '';
  if (n === 'NotAllowedError' || n === 'SecurityError') return '麦克风没开。到浏览器/手机设置里允许「使用麦克风」，或者直接按下面的方式打卡。';
  if (n === 'NotFoundError' || n === 'DevicesNotFoundError') return '这台手机没找到麦克风，按原来的方式打卡就行。';
  if (n === 'NotReadableError' || n === 'TrackStartError') return '麦克风被别的软件占用了，关掉别的录音软件再试，或者按原来的方式打卡。';
  return '麦克风用不了，按原来的方式打卡就行，不影响拿星星。';
}

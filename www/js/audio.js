// All sounds are synthesized with the Web Audio API (no audio files, works offline).
let ctx = null, master = null, ambientNodes = null;
function ac() {
  if (!ctx) {
    const C = globalThis.AudioContext || globalThis.webkitAudioContext; if (!C) return null;
    ctx = new C(); master = ctx.createGain(); master.gain.value = 0.55; master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}
function tone(freq, start, dur, gain, type = 'sine') {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start); g.gain.exponentialRampToValueAtTime(gain, start + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g); g.connect(master); o.start(start); o.stop(start + dur + 0.05);
}
export const sound = {
  unlock() { ac(); },
  coins() { // bronze coins clinking and settling
    if (!ac()) return; const t = ctx.currentTime;
    [0, 0.09, 0.15, 0.32, 0.4, 0.55, 0.61].forEach((d, i) => { const f = 2400 + ((i * 337) % 900); tone(f, t + d, 0.18, 0.12); tone(f * 1.51, t + d, 0.12, 0.05); tone(f * 2.37, t + d, 0.08, 0.03); });
  },
  settle() { if (!ac()) return; const t = ctx.currentTime; tone(1800, t, 0.25, 0.08); tone(2710, t + 0.02, 0.2, 0.04); },
  stalks() { // dry wooden rustle (filtered noise)
    if (!ac()) return; const t = ctx.currentTime, len = 0.5, buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2) * (Math.random() < 0.2 ? 1 : 0.2);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); f.type = 'bandpass'; f.frequency.value = 3200; f.Q.value = 0.8; g.gain.value = 0.5;
    s.buffer = buf; s.connect(f); f.connect(g); g.connect(master); s.start(t);
  },
  bowl() { // singing bowl for the reveal
    if (!ac()) return; const t = ctx.currentTime;
    [[220, 0.18, 5], [220 * 2.76, 0.08, 4], [220 * 5.4, 0.04, 3], [221.5, 0.12, 5]].forEach(([f, g, d]) => tone(f, t, d, g));
  },
  tap() { if (!ac()) return; tone(880, ctx.currentTime, 0.12, 0.05, 'triangle'); },
  ambient(on) { // soft pentatonic drone (optional)
    if (!on) { if (ambientNodes) { const t = ctx.currentTime; ambientNodes.g.gain.setTargetAtTime(0.0001, t, 0.6); const n = ambientNodes; setTimeout(() => n.os.forEach((o) => o.stop()), 2500); ambientNodes = null; } return; }
    if (!ac() || ambientNodes) return;
    const g = ctx.createGain(); g.gain.value = 0.0001; g.connect(master);
    const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.07; lg.gain.value = 0.02; lfo.connect(lg); lg.connect(g.gain);
    const os = [110, 146.83, 164.81, 220, 293.66].map((f, i) => { const o = ctx.createOscillator(), og = ctx.createGain(); o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (i - 2) * 3; og.gain.value = [0.5, 0.25, 0.2, 0.15, 0.08][i]; o.connect(og); og.connect(g); o.start(); return o; });
    lfo.start(); os.push(lfo); g.gain.setTargetAtTime(0.06, ctx.currentTime, 1.5); ambientNodes = { g, os };
  },
};

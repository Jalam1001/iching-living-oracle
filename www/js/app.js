// I Ching — The Living Oracle · application shell, router and views.
import { castCoins, castYarrow, resolve, makeIndex, LINE, YARROW_BAG, COIN_PROBS, YARROW_PROBS, fromTrigrams, toggleLine, hasSecureRandom, primaryBits } from './engine.js';
import { composeReading, readingToText, hexTitle, POSITION } from './reading.js';
import { journal, prefs, newId, parseImport } from './store.js';
import { sound } from './audio.js';
import { hexSVG, triSVG, coinSVG } from './svg.js';
import { HISTORY, JUNG, HOWTO, ABOUT, REFERENCES, LINKS } from './content.js';

export const VERSION = '0.1';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const view = $('#view');
const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true || isNative();
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let DB, IX, P = prefs.get();
let deferredPrompt = null;
const T = window.__oracle = { casts: [], version: VERSION };

// ---------- theme & sound ----------
function applyTheme() { document.documentElement.dataset.theme = P.theme; }
function effectiveDark() { return P.theme === 'dark' || (P.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches); }
$('#themeBtn').addEventListener('click', () => { P = prefs.set({ theme: effectiveDark() ? 'light' : 'dark' }); applyTheme(); toast(effectiveDark() ? 'Dark theme' : 'Light theme'); });
const soundBtn = $('#soundBtn');
function syncSound() { soundBtn.setAttribute('aria-pressed', String(!!P.sound)); }
soundBtn.addEventListener('click', () => { P = prefs.set({ sound: !P.sound }); syncSound(); if (P.sound) { sound.unlock(); sound.settle(); } else sound.ambient(false); toast(P.sound ? 'Ritual sounds on' : 'Sounds off'); });
const sfx = (name) => { if (P.sound) try { sound[name](); } catch {} };

// ---------- toast & modal ----------
let toastTimer;
function toast(msg, action) {
  const t = $('#toast'); t.innerHTML = esc(msg) + (action ? ` <button type="button">${esc(action.label)}</button>` : '');
  if (action) $('button', t).onclick = () => { action.run(); t.classList.remove('on'); };
  t.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), action ? 9000 : 2600);
}
function modal(html) { const d = $('#modal'); $('.modal-body', d).innerHTML = html; d.showModal ? d.showModal() : d.setAttribute('open', ''); return d; }

// ---------- install / download ----------
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; T.installPromptReady = true; });
window.addEventListener('appinstalled', () => { deferredPrompt = null; toast('Installed! Open I Ching from your home screen.'); });
async function installApp() {
  if (isStandalone()) return toast('You are already using the installed app.');
  if (deferredPrompt) { deferredPrompt.prompt(); const r = await deferredPrompt.userChoice; deferredPrompt = null; if (r.outcome === 'accepted') toast('Installing…'); return; }
  const ua = navigator.userAgent; const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua), firefox = /Firefox/.test(ua), safari = /Safari/.test(ua) && !/Chrome|CriOS|Android/.test(ua);
  let tip = '';
  if (ios) tip = '<li><b>iPhone / iPad (Safari):</b> tap the <b>Share</b> button <span aria-hidden="true">⎋</span>, then <b>Add to Home Screen</b>, then <b>Add</b>.</li>';
  else if (android && firefox) tip = '<li><b>Firefox on Android:</b> open the menu ⋮ and choose <b>Install</b> (or <b>Add to Home screen</b>).</li>';
  else if (android) tip = '<li><b>Android (Chrome, Edge, Samsung Internet):</b> open the browser menu ⋮ and choose <b>Install app</b> or <b>Add to Home screen</b>. Or download the Android APK.</li>';
  else if (safari) tip = '<li><b>Safari on Mac (macOS Sonoma or later):</b> choose <b>File → Add to Dock</b>.</li>';
  else if (firefox) tip = '<li><b>Firefox desktop:</b> Firefox does not install web apps directly. Open this site in Chrome or Edge to install, or bookmark it.</li>';
  else tip = '<li><b>Chrome or Edge on a computer:</b> click the install icon <span aria-hidden="true">⊕</span> at the right end of the address bar, or open the menu ⋮ → <b>Install I Ching</b>.</li>';
  modal(`<h2>Install the app</h2><p>Your browser did not offer one-tap installation here, but you can still install it in a few seconds:</p><ul>${tip}
  <li><b>Other browsers:</b> look for <b>Install</b>, <b>Add to Home Screen</b> or <b>Add to Dock</b> in the browser menu.</li></ul>
  <p>Once installed, I Ching opens from its own icon, in its own window, and works offline. Your journal and settings stay on your device.</p>
  <p class="note">On Android you can also install the <a href="${LINKS.apk}">Android APK</a> (${esc(LINKS.apk.split('/').pop())}).</p>`);
}
T.installApp = installApp;
function distButtons(withLaunch = true) {
  if (isNative()) return `<div class="dist">${withLaunch ? '<a class="btn launch" href="#/consult">☯ Launch I Ching</a>' : ''}<a class="btn ghost" href="${LINKS.repo}" target="_blank" rel="noopener">View Source Code</a></div>`;
  return `<div class="dist" role="group" aria-label="Get the app">
    ${withLaunch ? '<a class="btn launch" href="#/consult" id="launchBtn">☯&nbsp; Launch I Ching</a>' : ''}
    <button class="btn gold" id="installBtn" type="button"><svg viewBox="0 0 24 24"><path d="M12 3v11m0 0l-4-4m4 4l4-4M5 19h14" stroke="currentColor" stroke-width="2" fill="none"/></svg><span>Install App<small>${isStandalone() ? 'Already installed' : 'Home screen · offline'}</small></span></button>
    <a class="btn seal-btn" id="apkBtn" href="${LINKS.apk}" download><svg viewBox="0 0 24 24"><path d="M7 9h10v8a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2zM8 8a4 4 0 0 1 8 0" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M9 4l1 2M15 4l-1 2" stroke="currentColor" stroke-width="1.6"/></svg><span>Download Android APK<small>v0.1-rc2 · signed</small></span></a>
    <a class="btn ghost" id="sourceBtn" href="${LINKS.repo}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5" stroke="currentColor" stroke-width="2" fill="none"/></svg><span>View Source Code<small>GitHub · MIT licence</small></span></a></div>`;
}
function wireDist() { const b = $('#installBtn'); if (b) b.onclick = installApp; }

// ---------- router ----------
const routes = [
  [/^\/?$/, landing], [/^\/consult$/, consult], [/^\/reading$/, readingRoute], [/^\/hexagrams$/, hexagrams], [/^\/hexagram\/(\d+)$/, hexagramDetail],
  [/^\/trigrams$/, trigrams], [/^\/journal$/, journalList], [/^\/journal\/(.+)$/, journalEntry], [/^\/learn$/, landing], [/^\/learn\/(\w+)$/, learnPage], [/^\/about$/, () => learnPage('about')],
];
function parseHash() { const h = location.hash.replace(/^#/, '') || '/'; const [path, qs] = h.split('?'); return { path, q: new URLSearchParams(qs || '') }; }
let currentCleanup = null;
async function router() {
  if (currentCleanup) { try { currentCleanup(); } catch {} currentCleanup = null; }
  const { path, q } = parseHash();
  const section = path.split('/')[1] || 'home';
  const navKey = { reading: 'consult', hexagram: 'hexagrams', home: 'learn' }[section] || section;
  $$('[data-nav]').forEach((a) => (a.dataset.nav === navKey ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
  for (const [re, fn] of routes) { const m = path.match(re); if (m) { await fn(...m.slice(1), q); break; } }
  if (!routes.some(([re]) => re.test(path))) { view.innerHTML = `<div class="card"><h2>Page not found</h2><p><a href="#/">Return home</a></p></div>`; }
  view.focus({ preventScroll: true }); if (!T.keepScroll) window.scrollTo(0, 0); T.keepScroll = false;
  T.route = path;
}
window.addEventListener('hashchange', router);

// ---------- helpers ----------
const footer = () => `<p class="footer">I Ching — The Living Oracle v${VERSION} · Classical texts: James Legge (1882), public domain · No tracking · Works offline</p>`;
function dailyHex() { const d = new Date(); const k = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate(); let x = k * 2654435761 % 4294967296; return (x % 64) + 1; }
const hexLink = (h, extra = '') => `<a href="#/hexagram/${h.n}"${extra}>${esc(h.n + '. ' + h.name)}</a>`;
function bitsArr(h) { return h.bits.split(''); }

// ---------- LANDING (entry screen = Learn) ----------
const TITLE = 'Glimpse Your Future Ahead', TAGLINE = '3,000 years of wisdom, one question away';
function landing() {
  const d = IX.byNum(dailyHex());
  view.innerHTML = `<section class="stage landing">
    <header class="landing-hero"><p class="eyebrow">易經 · The Book of Changes</p>
      <h1 class="landing-title">${TITLE}</h1>
      <p class="tagline">${TAGLINE}</p></header>
    <a class="consult-cta" href="#/consult" id="launchBtn">
      <span class="cta-coins" aria-hidden="true">${coinSVG('lc0')}${coinSVG('lc1')}${coinSVG('lc2')}</span>
      <span class="cta-text"><b>Consult the Oracle</b><small>Ask your question · cast the coins six times · receive your reading</small></span>
      <span class="cta-go" aria-hidden="true">→</span></a>
    <h2 class="section-label">Understand the Book of Changes</h2>
    <div class="learn-nav">${LEARN.map(([k, t, dsc, i]) => `<a class="tile" href="#/learn/${k}"><span class="ic">${i}</span><span><b>${t}</b><small>${dsc}</small></span></a>`).join('')}
      <a class="tile" href="#/trigrams"><span class="ic">八</span><span><b>The Eight Trigrams</b><small>Interactive Bagua explorer</small></span></a><a class="tile" href="#/hexagrams"><span class="ic">卦</span><span><b>The 64 Hexagrams</b><small>Encyclopedia</small></span></a></div>
    <section class="card daily"><div>${hexSVG(bitsArr(d), { size: 70 })}</div><div><p class="eyebrow">Today's contemplation</p>
      <h3 style="margin:0">${esc(d.n + '. ' + d.name)} <span class="cjk" style="color:var(--seal)">${d.zh}</span></h3><p style="margin:.3em 0">${esc(d.core.charAt(0).toUpperCase() + d.core.slice(1))}.</p><a href="#/hexagram/${d.n}">Read more →</a></div></section>
    <h2 class="section-label">Get the app</h2>${distButtons(false)}${footer()}</section>`;
  wireDist();
}

// ---------- CONSULT ----------
const EXAMPLES = ['What should I understand about my present situation?', 'What direction should I take in my life?', 'What should I know about this relationship?', 'How should I approach an important decision?', 'What should I change to improve my circumstances?', 'What should I understand about my future?'];
const S = (T.session = JSON.parse(sessionStorage.getItem('iching.session') || 'null') || { stage: 'ask', question: '', method: P.method, casts: [] });
function saveSession() { sessionStorage.setItem('iching.session', JSON.stringify(S)); }
function resetSession() { Object.assign(S, { stage: 'ask', question: '', method: P.method, casts: [], savedId: null }); saveSession(); }

function consult() {
  if (S.stage === 'done' && S.casts.length === 6) { location.hash = '#/reading'; return; }
  if (S.stage === 'cast' || S.casts.length) return castStage();
  askStage();
}
function stepsBar(i) { return `<div class="steps" aria-hidden="true">${['Ask', 'Method', 'Cast', 'Read'].map((s, k) => `<span class="${k === i ? 'on' : ''}">${k + 1} ${s}</span>`).join('')}</div>`; }
function askStage() {
  view.innerHTML = `<section class="stage">${stepsBar(0)}<div class="card">
   <p class="eyebrow">Step 1 · Your question</p><h2>What would you like to understand?</h2>
   <label class="lbl" for="q">Type a question in your own words, or leave it empty and simply hold your situation in mind.</label>
   <textarea id="q" rows="3" maxlength="500" placeholder="For example: How should I approach this decision?">${esc(S.question)}</textarea>
   <div class="row" style="margin-top:10px" aria-label="Example questions">${EXAMPLES.map((e) => `<button class="chip ex" type="button">${esc(e)}</button>`).join('')}</div>
   <p class="muted" style="font-size:.9rem">Tip: open questions ("what should I understand…", "how should I approach…") work better than yes/no questions.</p></div>
   <div class="card"><p class="eyebrow">Step 2 · Casting method</p>
   <div class="methods" role="group" aria-label="Casting method">
    <button class="method" type="button" data-m="coins" aria-pressed="${S.method === 'coins'}"><b>🪙 Three coins</b><small>The popular method. Toss three coins six times. Changing lines appear 1 time in 4.</small></button>
    <button class="method" type="button" data-m="yarrow" aria-pressed="${S.method === 'yarrow'}"><b>🌾 Yarrow stalks</b><small>A simulation of the oldest method's odds. Changing lines are rarer for yin, more common for yang.</small></button>
   </div>
   <details style="margin-top:12px"><summary>What's the difference?</summary><div class="inner"><p>Both methods produce one of four line types for each of the six lines. The <b>three-coin</b> method is quick and gives Old Yin and Old Yang (the changing lines) equal chances: 1 in 8 each. The ancient <b>yarrow-stalk</b> ritual, which takes about 20 minutes with 50 stalks, has slightly different odds: Old Yin 1 in 16, Young Yang 5 in 16, Young Yin 7 in 16, Old Yang 3 in 16. This app reproduces those exact yarrow odds by drawing from a bag of 16 marbles; it is a <b>probability simulation</b>, not a re-enactment of the full ritual.</p></div></details>
   <div class="row" style="margin-top:14px;justify-content:space-between"><button class="btn cast-btn" id="begin" type="button">Begin casting →</button>
   <a href="#/learn/howto">First time? Read the 3-minute guide</a></div></div>
   ${hasSecureRandom() ? '' : '<p class="note">Your browser lacks a secure random generator; a standard generator is used instead.</p>'}</section>`;
  const q = $('#q');
  $$('.ex').forEach((b) => b.onclick = () => { q.value = b.textContent; q.focus(); sfx('tap'); });
  $$('.method').forEach((b) => b.onclick = () => { S.method = b.dataset.m; P = prefs.set({ method: S.method }); $$('.method').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); sfx('tap'); });
  $('#begin').onclick = () => { S.question = q.value.trim(); S.stage = 'cast'; S.casts = []; S.savedId = null; saveSession(); sound.unlock(); castStage(); window.scrollTo(0, 0); };
}

let busy = false;
function castStage() {
  const yarrow = S.method === 'yarrow';
  view.innerHTML = `<section class="stage">${stepsBar(2)}<div class="card cast-wrap">
    <p class="eyebrow">${yarrow ? 'Yarrow-stalk simulation' : 'Three-coin method'}</p>
    ${S.question ? `<p style="margin:0;font-style:italic">“${esc(S.question)}”</p>` : '<p class="muted" style="margin:0">Silent consultation: hold your situation in mind.</p>'}
    ${yarrow ? `<div class="stalks" aria-hidden="true">${'<i></i>'.repeat(25)}</div><div class="bag" aria-label="Bag of 16 marbles">${YARROW_BAG.map((v, i) => `<span class="marble m${v}" data-i="${i}">${v}</span>`).join('')}</div>
      <div class="legend"><span><i style="background:#6b4a8a"></i>6 Old Yin ×1</span><span><i style="background:#1d5c47"></i>7 Young Yang ×5</span><span><i style="background:#4b5d67"></i>8 Young Yin ×7</span><span><i style="background:#a8701a"></i>9 Old Yang ×3</span></div>`
      : `<div class="coins">${coinSVG('c0')}${coinSVG('c1')}${coinSVG('c2')}</div><div class="row" style="justify-content:center;gap:34px" aria-hidden="true"><span class="coin-val" id="cv0">&nbsp;</span><span class="coin-val" id="cv1">&nbsp;</span><span class="coin-val" id="cv2">&nbsp;</span></div>`}
    <div class="cast-result" id="castResult" aria-live="polite">&nbsp;</div>
    <div class="building"><div id="fig"></div><div class="slots" id="slots"></div></div>
    <div class="progress" id="prog"></div><div class="pbar"><i id="pbar" style="width:0"></i></div>
    <button class="btn cast-btn" id="castBtn" type="button">Cast</button>
    <button class="btn gold cast-btn hide" id="revealBtn" type="button">✦ Reveal your reading</button>
    <p class="shake-hint" id="shakeHint"></p>
    <div class="row" style="justify-content:center"><button class="btn ghost small" id="restart" type="button">Start over</button></div>
  </div></section>`;
  drawProgress(true);
  $('#castBtn').onclick = doCast;
  $('#revealBtn').onclick = () => { S.stage = 'done'; saveSession(); sfx('bowl'); location.hash = '#/reading'; };
  $('#restart').onclick = () => { resetSession(); askStage(); };
  setupShake();
}
function drawProgress(initial) {
  const n = S.casts.length, lines = S.casts.map((c) => c.value);
  const full = [...lines, ...Array(6 - n).fill(null)];
  $('#fig').innerHTML = hexSVG(full, { size: 120, changing: lines.map((v, i) => (v === 6 || v === 9 ? i + 1 : 0)).filter(Boolean), label: `Hexagram being built, ${n} of 6 lines` });
  $('#slots').innerHTML = full.map((v, i) => `<span>${v ? `${i + 1}: ${v} ${LINE[v].name}` : `${i + 1}: –`}</span>`).join('');
  $('#prog').textContent = n < 6 ? `Cast ${n + 1} of 6 · building from the bottom up` : 'All six lines cast';
  $('#pbar').style.width = `${(n / 6) * 100}%`;
  const done = n === 6; $('#castBtn').classList.toggle('hide', done); $('#revealBtn').classList.toggle('hide', !done);
  if (done && !initial) $('#revealBtn').focus();
  if (initial && n) { const last = S.casts[n - 1]; showCastResult(last); if (last.coins) last.coins.forEach((f, i) => { $('#c' + i)?.classList.toggle('show-back', f === 3); $('#cv' + i).textContent = f === 3 ? 'plain · 3' : 'inscribed · 2'; }); }
}
function showCastResult(c) { $('#castResult').innerHTML = `Line ${S.casts.indexOf(c) + 1}: <span class="v">${c.value}</span> · ${LINE[c.value].name} <span class="muted">(${LINE[c.value].desc})</span>`; }
async function doCast() {
  if (busy || S.casts.length >= 6) return; busy = true; $('#castBtn').disabled = true;
  const dur = reduceMotion() ? 250 : 1000;
  if (S.method === 'yarrow') {
    const c = castYarrow(); sfx('stalks');
    const st = $('.stalks'); st.classList.remove('split'); void st.offsetWidth; st.classList.add('split');
    const bag = $('.bag'); bag.classList.remove('drawn'); $$('.marble', bag).forEach((m) => m.classList.remove('pick', 'hl'));
    const steps = reduceMotion() ? 1 : 9; for (let k = 0; k < steps; k++) { const m = $$('.marble', bag)[(c.draw + 16 * 3 - (steps - k) * 5) % 16]; m.classList.add('hl'); await wait(dur / steps); m.classList.remove('hl'); }
    bag.classList.add('drawn'); $(`.marble[data-i="${c.draw}"]`, bag).classList.add('pick'); sfx('settle');
    S.casts.push(c);
  } else {
    const c = castCoins(); sfx('coins');
    c.coins.forEach((f, i) => { const el = $('#c' + i); el.classList.remove('show-back', 'toss'); el.style.setProperty('--dur', dur + i * 120 + 'ms'); el.style.setProperty('--turn', (1440 + (f === 3 ? 180 : 0) + i * 360) + 'deg'); void el.offsetWidth; el.classList.add('toss'); $('#cv' + i).innerHTML = '&nbsp;'; });
    await wait(dur + 260);
    c.coins.forEach((f, i) => { const el = $('#c' + i); el.classList.remove('toss'); el.classList.toggle('show-back', f === 3); $('#cv' + i).textContent = f === 3 ? 'plain · 3' : 'inscribed · 2'; });
    sfx('settle'); S.casts.push(c);
  }
  const c = S.casts[S.casts.length - 1]; T.casts.push(c); T.lastCast = c;
  saveSession(); showCastResult(c); drawProgress(); busy = false; $('#castBtn').disabled = false;
  if (S.casts.length < 6) $('#castBtn').focus();
}
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
function setupShake() {
  const hint = $('#shakeHint'); if (!hint) return;
  const canMotion = 'DeviceMotionEvent' in window && (navigator.maxTouchPoints > 0);
  if (!canMotion) { hint.textContent = ''; return; }
  const render = () => { hint.innerHTML = P.shake ? 'Shake-to-cast is on · <button class="btn ghost small" id="shakeT" type="button">Turn off</button>' : '<button class="btn ghost small" id="shakeT" type="button">📳 Enable shake-to-cast</button>'; $('#shakeT').onclick = toggle; };
  let last = 0;
  const onMotion = (e) => { const a = e.accelerationIncludingGravity || e.acceleration; if (!a) return; const m = Math.hypot(a.x || 0, a.y || 0, a.z || 0); const now = Date.now(); if (m > 24 && now - last > 1600) { last = now; doCast(); } };
  const toggle = async () => {
    if (!P.shake && typeof DeviceMotionEvent.requestPermission === 'function') { try { const r = await DeviceMotionEvent.requestPermission(); if (r !== 'granted') return toast('Motion permission was not granted'); } catch { return; } }
    P = prefs.set({ shake: !P.shake }); render(); P.shake ? window.addEventListener('devicemotion', onMotion) : window.removeEventListener('devicemotion', onMotion);
  };
  render(); if (P.shake) window.addEventListener('devicemotion', onMotion);
  currentCleanup = () => window.removeEventListener('devicemotion', onMotion);
}

// ---------- READING ----------
function readingRoute(q) {
  // Shareable / demo readings: #/reading?l=687779&q=question  (l = six digits, bottom to top)
  const l = q.get('l');
  if (l && /^[6-9]{6}$/.test(l)) return renderReading({ lines: l.split('').map(Number), question: q.get('q') || '', method: q.get('m') === 'yarrow' ? 'yarrow' : 'coins', demo: true });
  if (S.casts.length !== 6) { location.hash = '#/consult'; return; }
  return renderReading({ lines: S.casts.map((c) => c.value), question: S.question, method: S.method, casts: S.casts, savedId: S.savedId });
}
function hexBlock(h, changing, cls = '') {
  return `<div class="h"><span class="num">HEXAGRAM ${h.n}</span>${hexSVG(bitsArr(h), { size: 100, changing, cls, animate: true, label: `Hexagram ${h.n}, ${h.name}` })}<span class="zh">${h.zh}</span><span class="nm">${esc(h.name)}</span><span class="py">${esc(h.pinyin)} · ${esc(IX.tri[h.upper].image)} over ${esc(IX.tri[h.lower].image)}</span></div>`;
}
function renderReading(o) {
  const res = resolve(o.lines, IX); const r = composeReading(res, IX, o.question);
  T.reading = { lines: o.lines, primary: res.primary.n, resulting: res.resulting?.n || null, changing: res.changing, summary: r.summary };
  const P_ = res.primary, R_ = res.resulting;
  const figs = R_ ? `<div class="pair morph">${hexBlock(P_, res.changing)}<div class="arrow" aria-hidden="true">→</div>${hexBlock(R_, res.changing, 'result')}</div>`
    : `<div class="pair" style="grid-template-columns:1fr">${hexBlock(P_, [])}</div><p class="note" style="text-align:center">No changing lines: this consultation emphasizes the present configuration.</p>`;
  view.innerHTML = `<section class="stage">${o.demo ? '<p class="note">Example reading (not from your own cast).</p>' : stepsBar(3)}
  <div class="card"><p class="eyebrow">${o.question ? 'Your question' : 'Silent consultation'}</p>${o.question ? `<p style="font-size:1.1rem;margin:0 0 10px"><i>“${esc(o.question)}”</i></p>` : ''}
  ${figs}<p class="muted" style="text-align:center;font:.85rem var(--sans);margin-top:10px">Casts, bottom to top: ${o.lines.map((v) => `<b>${v}</b>`).join(' · ')} ${res.changing.length ? `· changing line${res.changing.length > 1 ? 's' : ''} <b style="color:var(--gold)">${res.changing.join(', ')}</b>` : ''}</p></div>
  <article class="card reading-a" id="secA"><p class="eyebrow">A · Your reading in plain English</p><h2>${esc(P_.name)}${R_ ? ` <span style="color:var(--gold)">→</span> ${esc(R_.name)}` : ''}</h2>${r.A.map((p) => `<p>${esc(p)}</p>`).join('')}</article>
  <div class="reading-grid">
   <article class="card" id="secB"><p class="eyebrow">B · Your present situation</p><h3 style="margin-top:0">${esc(hexTitle(P_))}</h3><p>${esc(r.B.text)}</p>
     <p class="muted" style="font-size:.92rem">${triSVG(IX.tri[P_.upper].bits, 26)} Upper: <b>${esc(IX.tri[P_.upper].image)}</b> (${esc(IX.tri[P_.upper].quality.toLowerCase())}) · ${triSVG(IX.tri[P_.lower].bits, 26)} Lower: <b>${esc(IX.tri[P_.lower].image)}</b> (${esc(IX.tri[P_.lower].quality.toLowerCase())})</p>
     <p style="font-size:.95rem"><b>In everyday life:</b> ${esc(P_.example)}</p></article>
   <article class="card" id="secC"><p class="eyebrow">C · What is changing</p>${r.C.length ? `<p>${esc(r.cIntro)}</p>${r.C.map((c) => `<div class="lineitem${c.main ? ' main' : ''}"><h4>Line ${c.pos} · ${esc(c.kind)} (${c.value})${c.main ? '<span class="badge">Key line</span>' : ''}</h4><p style="margin:.2em 0"><small>Position: ${esc(c.role)}.</small></p><p style="margin:.3em 0">${esc(c.plain)}</p><blockquote>${esc(c.legge)}<cite>Legge, 1882</cite></blockquote></div>`).join('')}
     ${r.stillLines.length ? `<p><b>Emphasis on the unchanging line${r.stillLines.length > 1 ? 's' : ''} of ${esc(R_.name)}:</b></p>${r.stillLines.map((l, i) => `<div class="lineitem${i === 0 ? ' main' : ''}" style="border-color:var(--jade);background:var(--jade-soft)"><h4>Line ${l.pos} of ${esc(R_.name)}${i === 0 ? '<span class="badge">Key line</span>' : ''}</h4><p style="margin:.3em 0">${esc(l.plain)}</p><blockquote>${esc(l.legge)}<cite>Legge, 1882</cite></blockquote></div>`).join('')}` : ''}
     ${r.F.special ? `<div class="lineitem main"><h4>All six lines changing<span class="badge">Special text</span></h4><p>${esc(r.F.special.plain)}</p><blockquote>${esc(r.F.special.legge)}<cite>Legge, 1882</cite></blockquote></div>` : ''}
     <p class="note">${esc(r.emphasis.text)} This follows the rules of the Song-dynasty scholar Zhu Xi (1130–1200).</p>`
     : `<p>No lines are changing. Your hexagram is stable: the situation is best understood as it is now, rather than as something in transition.</p><p class="note">${esc(r.emphasis.text)}</p>`}</article>
   ${R_ ? `<article class="card" id="secD"><p class="eyebrow">D · Where the situation may be heading</p><h3 style="margin-top:0">${esc(hexTitle(R_))}</h3><p>${esc(r.D.text)}</p><p class="note">The resulting hexagram is a possible direction of change, not a guaranteed future event.</p><a href="#/hexagram/${R_.n}">Explore ${esc(R_.name)} in depth →</a></article>` : ''}
   <article class="card ${R_ ? '' : 'wide'}" id="secE"><p class="eyebrow">E · Practical guidance${r.context.key !== 'general' ? ` · ${esc(r.context.label)}` : ''}</p><p><b>${esc(r.E.focus)}</b></p>${r.E.focusNext ? `<p>As things develop: ${esc(r.E.focusNext)}</p>` : ''}
     <h4>Consider</h4><ul class="ticks">${r.E.doList.map((d) => `<li>${esc(d)}</li>`).join('')}</ul><h4>Avoid</h4><ul class="ticks x">${r.E.avoidList.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
     <h4>Questions to reflect on</h4><ul>${r.E.questions.map((d) => `<li>${esc(d)}</li>`).join('')}</ul><p class="note">${esc(r.context.frame)}</p></article>
   <div class="wide">
   <details id="secF"><summary>F · Traditional interpretation (classical text)</summary><div class="inner">
     <h4>${esc(hexTitle(P_))}: the Judgment</h4><blockquote>${esc(r.F.primary.judgment)}<cite>Text of King Wen, trans. James Legge (1882)</cite></blockquote>
     <h4>The Image</h4><blockquote>${esc(r.F.primary.image)}<cite>From the Great Symbolism (Ten Wings), trans. James Legge (1882)</cite></blockquote>
     ${r.F.primary.lines.length ? `<h4>Changing lines</h4>${r.F.primary.lines.map((l) => `<blockquote><b>Line ${l.pos}.</b> ${esc(l.legge)}<cite>Text of the Duke of Zhou, trans. Legge</cite></blockquote>`).join('')}` : ''}
     ${r.F.resulting ? `<h4>${esc(hexTitle(R_))}: the Judgment</h4><blockquote>${esc(r.F.resulting.judgment)}<cite>Legge (1882)</cite></blockquote><h4>The Image</h4><blockquote>${esc(r.F.resulting.image)}<cite>Legge (1882)</cite></blockquote>` : ''}
     <p class="note">Legge's parentheses mark words he added to clarify the terse Chinese. Traditional attributions to King Wen and the Duke of Zhou are legendary.</p></div></details>
   <details id="secG"><summary>G · Jungian psychological perspective</summary><div class="inner">${r.G.map((p) => `<p>${esc(p)}</p>`).join('')}<p class="note">This is a modern psychological reading inspired by C. G. Jung. It is not part of the original Chinese text. <a href="#/learn/jung">About Jung and synchronicity →</a></p></div></details>
   </div></div>
  ${o.demo ? '' : `<div class="card" id="saveCard"><p class="eyebrow">Your journal</p><label class="lbl" for="notes">Personal notes (optional)</label><textarea id="notes" rows="3" placeholder="What comes to mind as you read this?"></textarea>
     <div class="actions"><button class="btn" id="saveBtn" type="button">${o.savedId ? '✓ Saved — update notes' : 'Save to journal'}</button></div></div>`}
  <div class="sticky-actions"><button class="btn small" id="newBtn" type="button">New consultation</button><button class="btn ghost small" id="shareBtn" type="button">Share / copy</button>${o.demo ? '' : '<a class="btn ghost small" href="#/journal">Journal</a>'}</div>
  ${footer()}</section>`;
  const text = readingToText(r, { question: o.question, lines: o.lines, method: o.method, date: new Date().toLocaleString() });
  $('#newBtn').onclick = () => { resetSession(); location.hash = '#/consult'; };
  $('#shareBtn').onclick = () => shareText(`I Ching reading: ${r.summary}`, text);
  const sb = $('#saveBtn');
  if (sb) sb.onclick = async () => {
    const id = S.savedId || newId();
    const prev = S.savedId ? await journal.get(id) : null;
    await journal.put({ id, date: prev?.date || new Date().toISOString(), question: o.question, method: o.method, lines: o.lines, casts: o.casts?.map((c) => ({ value: c.value, coins: c.coins, draw: c.draw })) || null,
      primary: res.primary.n, resulting: res.resulting?.n || null, changing: res.changing, context: r.context.key, readingText: text, notes: $('#notes').value, observations: prev?.observations || '' });
    S.savedId = id; saveSession(); sb.textContent = '✓ Saved — update notes'; toast('Saved to your journal', { label: 'Open', run: () => (location.hash = '#/journal/' + id) });
  };
  if (o.savedId) journal.get(o.savedId).then((e) => { if (e && $('#notes')) $('#notes').value = e.notes || ''; });
}
async function shareText(title, text) {
  try { if (navigator.share && !isNative()) { await navigator.share({ title, text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  if (isNative() && window.Capacitor.Plugins?.Share) { try { await window.Capacitor.Plugins.Share.share({ title, text, dialogTitle: 'Share reading' }); return; } catch {} }
  try { await navigator.clipboard.writeText(text); toast('Reading copied to clipboard'); } catch { modal(`<h2>Copy your reading</h2><textarea rows="12" style="width:100%">${esc(text)}</textarea>`); }
}

// ---------- HEXAGRAMS ----------
function hexagrams(q) {
  const mode = q.get('view') || sessionStorage.getItem('iching.hexview') || 'grid';
  view.innerHTML = `<section class="stage"><p class="eyebrow">Encyclopedia · King Wen sequence</p><h1>The 64 Hexagrams</h1>
  <div class="toolbar"><input type="search" id="hs" placeholder="Search hexagrams…" aria-label="Search hexagrams" value="${esc(q.get('q') || '')}">
  <div class="seg" role="group" aria-label="View"><button type="button" data-v="grid" aria-pressed="${mode === 'grid'}">Grid</button><button type="button" data-v="list" aria-pressed="${mode === 'list'}">List</button></div></div>
  <p class="muted" id="hcount" aria-live="polite"></p><div id="hres"></div>${footer()}</section>`;
  let m = mode;
  const draw = () => {
    const s = $('#hs').value.trim().toLowerCase();
    const norm = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const list = DB.hexagrams.filter((h) => !s || String(h.n) === s || norm([h.name, h.alt, h.pinyin, h.zh, h.legge, h.core, ...h.keywords, IX.tri[h.upper].image, IX.tri[h.lower].image].join(' ')).includes(norm(s)));
    $('#hcount').textContent = s ? `${list.length} of 64 hexagrams match “${s}”` : 'All 64 hexagrams. Tap one to open it.';
    $('#hres').innerHTML = m === 'grid' ? `<div class="grid64">${list.map((h) => `<a class="g" href="#/hexagram/${h.n}" aria-label="${h.n}. ${esc(h.name)}"><span class="n">${h.n}</span>${hexSVG(bitsArr(h), { size: 46 })}<span class="zh">${h.zh}</span><span class="t">${esc(h.name)}</span></a>`).join('')}</div>`
      : `<div class="list64 card" style="padding:0">${list.map((h) => `<a href="#/hexagram/${h.n}">${hexSVG(bitsArr(h), { size: 40 })}<div><span class="t">${h.n}. ${esc(h.name)}</span> <span class="cjk" style="color:var(--seal)">${h.zh}</span> <small>${esc(h.pinyin)}</small><p>${esc(h.core.charAt(0).toUpperCase() + h.core.slice(1))}.</p></div></a>`).join('')}</div>`;
    if (!list.length) $('#hres').innerHTML = '<p class="empty">No hexagram matches that search.</p>';
  };
  $('#hs').addEventListener('input', draw);
  $$('.seg button').forEach((b) => b.onclick = () => { m = b.dataset.v; sessionStorage.setItem('iching.hexview', m); $$('.seg button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw(); });
  draw();
}
function hexagramDetail(nStr) {
  const n = Math.min(64, Math.max(1, Number(nStr))), h = IX.byNum(n), up = IX.tri[h.upper], lo = IX.tri[h.lower];
  view.innerHTML = `<section class="stage"><a href="#/hexagrams">← All hexagrams</a>
  <div class="card" style="margin-top:10px"><div class="detail-head"><div id="explorer">${hexSVG(bitsArr(h), { size: 110, interactive: true, cls: 'interactive', label: `Hexagram ${n}` })}</div>
  <div><p class="eyebrow">Hexagram ${n} of 64</p><h1 style="margin:0">${esc(h.name)}</h1><div class="zh">${h.zh}</div><p class="muted" style="margin:.3em 0">${esc(h.pinyin)} · also “${esc(h.alt)}” · Legge: ${esc(h.legge)}</p></div></div>
  <div class="kv"><span>${triSVG(up.bits, 22)} Upper: ${esc(up.image)} ${up.zh} ${esc(up.name)}</span><span>${triSVG(lo.bits, 22)} Lower: ${esc(lo.image)} ${lo.zh} ${esc(lo.name)}</span><span>Themes: ${h.keywords.map(esc).join(', ')}</span></div>
  <p style="font-size:1.1rem"><b>${esc(h.core.charAt(0).toUpperCase() + h.core.slice(1))}.</b></p></div>
  <div class="card"><p class="eyebrow">Transformation explorer</p><p style="margin-top:0">Tap any line of the figure above (or a button below) to change it and see which hexagram results.</p>
   <div class="row" id="flipBtns">${[1, 2, 3, 4, 5, 6].map((p) => `<button class="chip" type="button" data-pos="${p}">Line ${p}</button>`).join('')}</div><div id="flipOut" aria-live="polite" style="margin-top:10px"></div></div>
  <div class="card"><p class="eyebrow">Meaning</p><p>${esc(h.now)}</p><p><b>In everyday life:</b> ${esc(h.example)}</p></div>
  <div class="reading-grid"><div class="card"><p class="eyebrow">Practical guidance</p><h4>Consider</h4><ul class="ticks">${h.do.map((d) => `<li>${esc(d)}</li>`).join('')}</ul><h4>Avoid</h4><ul class="ticks x">${h.avoid.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>
  <div class="card"><p class="eyebrow">In different areas of life</p><p><b>Relationships:</b> ${esc(h.love)}</p><p><b>Work &amp; money:</b> ${esc(h.work)}</p><p><b>Personal growth:</b> ${esc(h.self)}</p></div></div>
  <div class="card"><p class="eyebrow">The six lines · read from the bottom up</p>${h.lines.map((l, i) => `<details><summary>${hexSVG(bitsArr(h), { size: 26, changing: [i + 1] })} Line ${i + 1} · ${h.bits[i] === '1' ? 'Nine (solid)' : 'Six (broken)'} — ${esc(l.plain.split('. ')[0])}</summary><div class="inner"><p>${esc(l.plain)}</p><blockquote>${esc(l.legge)}<cite>Legge, 1882</cite></blockquote></div></details>`).join('')}
   ${h.allLines ? `<details><summary>✦ When all six lines change</summary><div class="inner"><p>${esc(h.allLines.plain)}</p><blockquote>${esc(h.allLines.legge)}<cite>Legge, 1882</cite></blockquote><p class="note">Hexagrams 1 and 2 are the only ones with a seventh text. Following Zhu Xi, it is read when all six lines change.</p></div></details>` : ''}</div>
  <details open><summary>Traditional Judgment and Image</summary><div class="inner"><h4>Judgment</h4><blockquote>${esc(h.judgment)}<cite>James Legge (1882)</cite></blockquote><h4>Image</h4><blockquote>${esc(h.image)}<cite>James Legge (1882)</cite></blockquote></div></details>
  <details><summary>Jungian perspective</summary><div class="inner"><p>${esc(h.jung)}</p><p class="note">A modern psychological reflection, not part of the classical text.</p></div></details>
  <div class="pn">${n > 1 ? `<a class="btn ghost small" href="#/hexagram/${n - 1}">← ${n - 1}. ${esc(IX.byNum(n - 1).name)}</a>` : '<span></span>'}${n < 64 ? `<a class="btn ghost small" href="#/hexagram/${n + 1}">${n + 1}. ${esc(IX.byNum(n + 1).name)} →</a>` : ''}</div>${footer()}</section>`;
  const flip = (p) => { const t = toggleLine(n, p, IX); sfx('tap'); $('#flipOut').innerHTML = `<div class="daily">${hexSVG(bitsArr(h), { size: 56, changing: [p] })}<span class="arrow">→</span>${hexSVG(bitsArr(t), { size: 56, changing: [p] })}<div>Changing line ${p} turns <b>${esc(h.name)}</b> into <a href="#/hexagram/${t.n}"><b>${t.n}. ${esc(t.name)}</b></a> <span class="cjk">${t.zh}</span>.<br><small>${esc(h.lines[p - 1].plain.split('. ')[0])}.</small> <a href="#/reading?l=${bitsArr(h).map((b, i) => (i === p - 1 ? (b === '1' ? 9 : 6) : b === '1' ? 7 : 8)).join('')}">See full reading →</a></div></div>`; };
  $$('#flipBtns .chip').forEach((b) => b.onclick = () => flip(+b.dataset.pos));
  $('#explorer').addEventListener('click', (e) => { const g = e.target.closest('[data-pos]'); if (g) flip(+g.dataset.pos); });
}

// ---------- TRIGRAMS ----------
function trigrams() {
  let lower = 'qian', upper = 'kun', sel = 'lower';
  view.innerHTML = `<section class="stage"><p class="eyebrow">八卦 Bāguà</p><h1>The Eight Trigrams</h1>
  <p class="lede">Two states (solid yang ⚊ and broken yin ⚋) combined three at a time give 2 × 2 × 2 = <b>8 trigrams</b>. Stack two trigrams and you get 8 × 8 = <b>64 hexagrams</b>, every possible six-line figure.</p>
  <div class="card"><p class="eyebrow">Build a hexagram</p><div class="builder"><div class="slotpick" role="group" aria-label="Choose position"><button class="chip" type="button" id="selUpper" aria-pressed="false">Choose upper trigram</button><button class="chip" type="button" id="selLower" aria-pressed="true">Choose lower trigram</button></div>
  <div class="bagua" id="bagua">${DB.trigrams.map((t) => `<button class="tg" type="button" data-k="${t.key}">${triSVG(t.bits, 48)}<span class="zh">${t.zh}</span><b>${esc(t.image)}</b><small>${esc(t.name)} · ${esc(t.quality)}</small></button>`).join('')}</div>
  <div id="built" aria-live="polite"></div></div></div>
  <div class="card" id="triInfo"></div>
  <div class="card"><p class="eyebrow">The mathematics of change</p><p>Read a broken line as 0 and a solid line as 1, from the bottom up. Each trigram is then a three-digit binary number (0–7) and each hexagram a six-digit one (0–63). The philosopher <b>Leibniz</b> noticed this in 1703, when he received a Chinese diagram of the hexagrams arranged in exactly this counting order. The tradition itself did not use the figures as numbers, but the structure is the same: <b>2 states → 2³ = 8 trigrams → 2⁶ = 64 hexagrams</b>, and 4⁶ = 4,096 possible casts once changing lines are counted.</p>
  <table class="vals"><tr><th>Trigram</th><th>Lines (bottom→top)</th><th>Family</th><th>Direction</th><th>Body</th><th>Animal</th></tr>${DB.trigrams.map((t) => `<tr><td>${triSVG(t.bits, 22)} ${t.zh} ${esc(t.image)}</td><td class="binary">${t.bits}</td><td>${esc(t.family)}</td><td>${esc(t.direction)}</td><td>${esc(t.body)}</td><td>${esc(t.animal)}</td></tr>`).join('')}</table>
  <p class="note">Family, direction, body and animal associations come from the Shuo Gua ("Discussion of the Trigrams"), one of the Ten Wings; directions follow the King Wen ("Later Heaven") arrangement.</p></div>${footer()}</section>`;
  const info = (t) => { $('#triInfo').innerHTML = `<div class="daily">${triSVG(t.bits, 70)}<div><p class="eyebrow">${t.zh} ${esc(t.name)}</p><h2 style="margin:0">${esc(t.image)}</h2><p>${esc(t.text)}</p><div class="kv"><span>${esc(t.quality)}</span><span>${esc(t.family)}</span><span>${esc(t.direction)}</span><span>${esc(t.season)}</span><span>Binary ${t.bits}</span></div><p><a href="#/hexagram/${fromTrigrams(t.key, t.key, IX).n}">Doubled, it forms Hexagram ${fromTrigrams(t.key, t.key, IX).n}, ${esc(fromTrigrams(t.key, t.key, IX).name)} →</a></p></div></div>`; };
  const draw = () => {
    const h = fromTrigrams(lower, upper, IX);
    $$('#bagua .tg').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === (sel === 'lower' ? lower : upper))));
    $('#built').innerHTML = `<div class="daily" style="justify-content:center">${hexSVG(bitsArr(h), { size: 90, animate: true })}<div style="text-align:left">Upper <b>${esc(IX.tri[upper].image)}</b> over lower <b>${esc(IX.tri[lower].image)}</b> makes<h3 style="margin:.2em 0"><a href="#/hexagram/${h.n}">${h.n}. ${esc(h.name)}</a> <span class="cjk" style="color:var(--seal)">${h.zh}</span></h3><small>${esc(h.core.charAt(0).toUpperCase() + h.core.slice(1))}.</small><div class="binary" style="margin-top:4px">${h.bits} = ${parseInt(h.bits.split('').reverse().join(''), 2)}</div></div></div>`;
    T.trigramResult = h.n;
  };
  const setSel = (s) => { sel = s; $('#selLower').setAttribute('aria-pressed', String(s === 'lower')); $('#selUpper').setAttribute('aria-pressed', String(s === 'upper')); draw(); };
  $('#selLower').onclick = () => setSel('lower'); $('#selUpper').onclick = () => setSel('upper');
  $$('#bagua .tg').forEach((b) => b.onclick = () => { if (sel === 'lower') { lower = b.dataset.k; setSel('upper'); } else { upper = b.dataset.k; setSel('lower'); } info(IX.tri[b.dataset.k]); sfx('tap'); });
  info(IX.tri.qian); draw();
}

// ---------- JOURNAL ----------
async function journalList(q) {
  const all = await journal.all(); const s = (q.get('q') || '').toLowerCase();
  const counts = {}; all.forEach((e) => { counts[e.primary] = (counts[e.primary] || 0) + 1; if (e.resulting) counts[e.resulting] = (counts[e.resulting] || 0) + 0.5; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4).filter(([, c]) => c >= 1);
  const triCount = {}; all.forEach((e) => { const h = IX.byNum(e.primary); if (h) [h.upper, h.lower].forEach((t) => (triCount[t] = (triCount[t] || 0) + 1)); });
  const topTri = Object.entries(triCount).sort((a, b) => b[1] - a[1])[0];
  view.innerHTML = `<section class="stage"><p class="eyebrow">Private · stored only on this device (${await journal.storageKind()})</p><h1>Your Journal</h1>
  <div class="toolbar"><input type="search" id="js" placeholder="Search questions, notes, hexagrams…" aria-label="Search journal" value="${esc(s)}"></div>
  ${all.length ? `<div class="card"><p class="eyebrow">Recurring themes</p><div class="stats"><span>${all.length} consultation${all.length > 1 ? 's' : ''}</span>${top.map(([n, c]) => `<span>${hexLink(IX.byNum(+n))} × ${Math.floor(c)}</span>`).join('')}${topTri ? `<span>Most frequent trigram: ${esc(IX.tri[topTri[0]].image)}</span>` : ''}<span>${all.filter((e) => e.changing?.length).length} with changing lines</span></div></div>` : ''}
  <div id="jl"></div>
  <div class="card"><p class="eyebrow">Export, import, delete</p><div class="row"><button class="btn ghost small" id="expTxt" type="button">Export as text</button><button class="btn ghost small" id="expJson" type="button">Export as JSON</button>
  <label class="btn ghost small" for="impFile">Import JSON</label><input type="file" id="impFile" accept="application/json,.json" class="sr"><button class="btn ghost small" id="delAll" type="button" style="color:var(--seal);border-color:var(--seal)">Delete all</button></div>
  <p class="muted" style="font-size:.88rem">Nothing leaves your device unless you export it yourself.</p></div>${footer()}</section>`;
  const draw = () => {
    const t = $('#js').value.trim().toLowerCase();
    const list = all.filter((e) => !t || [e.question, e.notes, e.observations, IX.byNum(e.primary)?.name, e.resulting ? IX.byNum(e.resulting)?.name : '', String(e.primary)].join(' ').toLowerCase().includes(t));
    $('#jl').innerHTML = list.length ? list.map((e) => { const a = IX.byNum(e.primary), b = e.resulting ? IX.byNum(e.resulting) : null; return `<a class="entry" href="#/journal/${encodeURIComponent(e.id)}">${hexSVG(a.bits.split(''), { size: 40, changing: e.changing || [] })}<div><span class="q">${esc(e.question || 'Silent consultation')}</span><small>${esc(new Date(e.date).toLocaleString())} · ${a.n}. ${esc(a.name)}${b ? ` → ${b.n}. ${esc(b.name)}` : ''}</small>${e.observations ? '<small>✎ Follow-up recorded</small>' : ''}</div><span aria-hidden="true">›</span></a>`; }).join('')
      : `<div class="empty card">${all.length ? 'No entries match your search.' : `Your journal is empty. After a consultation, tap <b>Save to journal</b>.<br><br><a class="btn" href="#/consult">Consult the oracle</a>`}</div>`;
  };
  $('#js').addEventListener('input', draw); draw();
  $('#expTxt').onclick = () => download(`iching-journal-${today()}.txt`, all.map((e) => `${e.readingText || ''}\n\nNotes: ${e.notes || '-'}\nWhat happened afterwards: ${e.observations || '-'}\n${'─'.repeat(40)}`).join('\n\n') || 'Empty journal', 'text/plain');
  $('#expJson').onclick = () => download(`iching-journal-${today()}.json`, JSON.stringify({ app: 'iching-living-oracle', version: VERSION, exported: new Date().toISOString(), entries: all }, null, 2), 'application/json');
  $('#impFile').onchange = async (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    try { const items = parseImport(await f.text()); for (const it of items) await journal.put(it); toast(`Imported ${items.length} entr${items.length === 1 ? 'y' : 'ies'}`); T.keepScroll = true; journalList(q); }
    catch (err) { toast('Import failed: ' + err.message); }
  };
  $('#delAll').onclick = async () => { if (!all.length) return toast('Journal is already empty'); if (confirm(`Delete all ${all.length} journal entries from this device? This cannot be undone.`)) { await journal.clear(); toast('Journal deleted'); journalList(q); } };
}
async function journalEntry(id) {
  const e = await journal.get(decodeURIComponent(id));
  if (!e) { view.innerHTML = `<div class="card"><h2>Entry not found</h2><a href="#/journal">Back to journal</a></div>`; return; }
  const res = resolve(e.lines, IX), r = composeReading(res, IX, e.question);
  view.innerHTML = `<section class="stage"><a href="#/journal">← Journal</a><div class="card" style="margin-top:10px"><p class="eyebrow">${esc(new Date(e.date).toLocaleString())} · ${e.method === 'yarrow' ? 'Yarrow-stalk simulation' : 'Three coins'}</p>
  <h2>${esc(e.question || 'Silent consultation')}</h2><div class="pair${res.resulting ? '' : ''}" style="${res.resulting ? '' : 'grid-template-columns:1fr'}">${hexBlock(res.primary, res.changing)}${res.resulting ? `<div class="arrow">→</div>${hexBlock(res.resulting, res.changing)}` : ''}</div>
  <p class="muted" style="text-align:center;font:.85rem var(--sans)">Six casts, bottom to top: ${e.lines.join(' · ')}${res.changing.length ? ` · changing ${res.changing.join(', ')}` : ' · no changing lines'}</p></div>
  <div class="card reading-a"><p class="eyebrow">Your reading</p>${r.A.map((p) => `<p>${esc(p)}</p>`).join('')}<details><summary>Full saved interpretation (text)</summary><div class="inner"><pre style="white-space:pre-wrap;font:.9rem/1.5 var(--serif)">${esc(e.readingText)}</pre></div></details>
  <a class="btn ghost small" href="#/reading?l=${e.lines.join('')}&q=${encodeURIComponent(e.question || '')}&m=${e.method}">Open full reading view</a></div>
  <div class="card"><label class="lbl" for="jn">Personal notes</label><textarea id="jn" rows="3">${esc(e.notes)}</textarea>
  <label class="lbl" for="jo" style="margin-top:12px">What actually happened afterwards?</label><textarea id="jo" rows="4" placeholder="Come back later and record how things developed.">${esc(e.observations)}</textarea>
  <div class="actions"><button class="btn" id="jsave" type="button">Save changes</button><button class="btn ghost" id="jshare" type="button">Share / copy</button><button class="btn ghost" id="jdel" type="button" style="color:var(--seal);border-color:var(--seal)">Delete entry</button></div></div>${footer()}</section>`;
  $('#jsave').onclick = async () => { e.notes = $('#jn').value; e.observations = $('#jo').value; e.updated = new Date().toISOString(); await journal.put(e); toast('Changes saved'); };
  $('#jshare').onclick = () => shareText('I Ching reading', `${e.readingText}\n\nNotes: ${e.notes || '-'}\nAfterwards: ${e.observations || '-'}`);
  $('#jdel').onclick = async () => { if (confirm('Delete this journal entry?')) { await journal.remove(e.id); toast('Entry deleted'); location.hash = '#/journal'; } };
}
const today = () => new Date().toISOString().slice(0, 10);
async function download(name, text, type) {
  if (isNative() && window.Capacitor.Plugins?.Filesystem && window.Capacitor.Plugins?.Share) {
    try { const w = await window.Capacitor.Plugins.Filesystem.writeFile({ path: name, data: text, directory: 'CACHE', encoding: 'utf8' }); await window.Capacitor.Plugins.Share.share({ title: name, url: w.uri, dialogTitle: 'Save or share your journal' }); return; }
    catch (err) { if (String(err).includes('cancel')) return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`Exported ${name}`);
}

// ---------- LEARN ----------
const LEARN = [
  ['howto', 'How to Use', 'Beginner\'s guide with an interactive demo', '學'], ['history', 'History & Philosophy', 'Origins, the Ten Wings, Leibniz, the West', '史'],
  ['jung', 'Carl Jung & Synchronicity', 'The psychology of meaningful coincidence', '心'], ['reading', 'Further Reading', 'Verified sources and references', '書'], ['about', 'About & Download', 'Install, APK, source code, privacy', '印'],
];
function learnPage(k) {
  const meta = LEARN.find((x) => x[0] === k); if (!meta) { location.hash = '#/learn'; return; }
  let body = '';
  if (k === 'howto') body = `<div class="card demo" id="demo"><p class="eyebrow">Interactive demonstration</p><h3 style="margin:0">Watch a hexagram being built</h3><p style="margin:0">This example uses the casts 6, 8, 7, 7, 7, 9. Tap <b>Next line</b> to add one line at a time, from the bottom up.</p>
     <div id="demoFig"></div><p id="demoTxt" aria-live="polite" style="min-height:3em"></p><div class="row" style="justify-content:center"><button class="btn" id="demoNext" type="button">Next line</button><button class="btn ghost" id="demoReset" type="button">Restart</button></div></div><div class="prose">${HOWTO}</div><p><a class="btn" href="#/consult">Try it yourself →</a></p>`;
  else if (k === 'history') body = `<div class="prose">${HISTORY}</div>`;
  else if (k === 'jung') body = `<div class="prose">${JUNG}<p><a class="btn ghost small" href="#/reading?l=899787&q=${encodeURIComponent("Jung's question: presenting the I Ching to the West")}">Recreate Jung's consultation (50 → 35)</a> <a class="btn ghost small" href="#/reading?l=876878&q=${encodeURIComponent("Jung's question: writing the foreword")}">Recreate Jung's second consultation (29 → 48)</a></p></div>`;
  else if (k === 'reading') body = `<p class="lede">Classical sources are kept separate from modern explanations and from psychological interpretation. Every link below was checked when this version was released.</p>${REFERENCES.map((g) => `<div class="card"><h3 style="margin-top:0">${esc(g.group)}</h3><ul class="refs">${g.items.map((i) => `<li><a class="ext" href="${i.u}" target="_blank" rel="noopener">${esc(i.t)} ↗</a><br><small>${esc(i.d)}</small><br><small class="muted" style="word-break:break-all">${esc(i.u)}</small></li>`).join('')}</ul></div>`).join('')}`;
  else if (k === 'about') body = `${distButtons()}<div class="prose">${ABOUT}
     <h3>Install on Android (APK)</h3><ol><li>Tap <b>Download Android APK</b> above (file: <code>iching-living-oracle-v0.1-rc2.apk</code>).</li><li>Open the downloaded file. If Android asks, allow your browser to <b>install unknown apps</b> (Settings → Apps → your browser → Install unknown apps).</li><li>Tap <b>Install</b>, then <b>Open</b>. The app needs no permissions and works fully offline.</li></ol>
     <p>Verify the download with its SHA-256 checksum, published on the <a href="${LINKS.apkRelease}" target="_blank" rel="noopener">v0.1-rc2 release page</a>. Requires Android 6.0 or newer.</p>
     <h3>Install as a web app (PWA)</h3><p>Tap <b>Install App</b>. If your browser has no install button, use the browser menu: <b>Add to Home Screen</b> (iPhone/iPad Safari: Share → Add to Home Screen; Android Chrome: ⋮ → Install app; desktop Chrome/Edge: the install icon in the address bar).</p>
     <h3>Links</h3><ul><li>Website: <a href="${LINKS.site}">${LINKS.site}</a></li><li>Source code: <a href="${LINKS.repo}" target="_blank" rel="noopener">${LINKS.repo}</a></li><li>Testing report: <a href="${LINKS.testing}" target="_blank" rel="noopener">docs/TESTING.md</a></li><li>Releases: <a href="${LINKS.webRelease}" target="_blank" rel="noopener">v0.1 (web/PWA)</a> · <a href="${LINKS.apkRelease}" target="_blank" rel="noopener">v0.1-rc2 (Android)</a></li></ul>
     <h3>Settings</h3><div class="row"><button class="btn ghost small" id="ambBtn" type="button">${P.ambient ? 'Stop' : 'Play'} ambient music</button><button class="btn ghost small" id="themeAuto" type="button">Theme: follow system</button></div>
     <p class="muted" style="font-size:.85rem">Version ${VERSION} · ${isNative() ? 'Android app' : isStandalone() ? 'Installed web app' : 'Web'} · Secure random: ${hasSecureRandom() ? 'yes (Web Crypto)' : 'no'}</p></div>`;
  view.innerHTML = `<section class="stage"><a href="#/learn">← Learn</a><p class="eyebrow" style="margin-top:10px">${meta[3]} ${esc(meta[2])}</p><h1>${esc(meta[1])}</h1>${body}${footer()}</section>`;
  if (k === 'about') { wireDist(); $('#ambBtn').onclick = () => { P = prefs.set({ ambient: !P.ambient, sound: P.ambient ? P.sound : true }); syncSound(); sound.ambient(P.ambient); $('#ambBtn').textContent = `${P.ambient ? 'Stop' : 'Play'} ambient music`; }; $('#themeAuto').onclick = () => { P = prefs.set({ theme: 'auto' }); applyTheme(); toast('Theme follows your system'); }; }
  if (k === 'howto') demo();
}
function demo() {
  const L = [6, 8, 7, 7, 7, 9]; let i = 0;
  const draw = () => {
    $('#demoFig').innerHTML = hexSVG([...L.slice(0, i), ...Array(6 - i).fill(null)], { size: 110, changing: L.slice(0, i).map((v, k) => (v === 6 || v === 9 ? k + 1 : 0)).filter(Boolean) });
    if (!i) $('#demoTxt').textContent = 'An empty hexagram: six places, filled from the bottom.';
    else { const v = L[i - 1]; $('#demoTxt').innerHTML = `Line ${i}: the coins total <b>${v}</b>, ${LINE[v].name} (${LINE[v].desc}). ${v === 6 || v === 9 ? '<b style="color:var(--gold)">A changing line, shown in gold.</b>' : ''}`; }
    if (i === 6) { $('#demoTxt').innerHTML += `<br>Complete: <b>33. Retreat</b>. Lines 1 and 6 change, so it becomes <b>49. Revolution</b>. <a href="#/reading?l=687779&q=${encodeURIComponent('What should I understand about my present situation?')}">Open this example reading →</a>`; $('#demoNext').disabled = true; }
  };
  $('#demoNext').onclick = () => { if (i < 6) { i++; sfx('settle'); draw(); } };
  $('#demoReset').onclick = () => { i = 0; $('#demoNext').disabled = false; draw(); };
  draw();
}

// ---------- service worker & boot ----------
function registerSW() {
  if (!('serviceWorker' in navigator) || isNative() || location.protocol === 'file:') return;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    T.swRegistered = true;
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing; if (!nw) return;
      nw.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) toast('A new version is available', { label: 'Update', run: () => nw.postMessage('skipWaiting') }); });
    });
    setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
  }).catch(() => {});
  const hadController = !!navigator.serviceWorker.controller; let reloaded = false; navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
}
async function boot() {
  applyTheme(); syncSound();
  try { DB = window.__ICHING_DB || await (await fetch('data/iching.json')).json(); }
  catch { view.innerHTML = '<div class="card"><h2>Could not load the Book of Changes</h2><p>Please check your connection and reload.</p></div>'; return; }
  IX = makeIndex(DB); T.db = DB; T.ix = IX;
  if (isNative()) document.documentElement.classList.add('native');
  await router(); registerSW(); T.ready = true;
  if (P.ambient && P.sound) document.addEventListener('pointerdown', () => sound.ambient(true), { once: true });
}
boot();

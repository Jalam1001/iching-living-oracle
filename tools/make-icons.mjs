// Renders the app icons (PWA + Android) from SVG using headless Chromium (Playwright).
import { chromium } from 'playwright';
import fs from 'fs';
const coin = (cx, cy, r, chars = true) => `
 <defs><radialGradient id="gold" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fbe39a"/><stop offset=".5" stop-color="#d4a441"/><stop offset="1" stop-color="#8a5c17"/></radialGradient></defs>
 <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#gold)"/>
 <circle cx="${cx}" cy="${cy}" r="${r * 0.9}" fill="none" stroke="#6b4612" stroke-width="${r * 0.035}" opacity=".75"/>
 <rect x="${cx - r * 0.27}" y="${cy - r * 0.27}" width="${r * 0.54}" height="${r * 0.54}" fill="#174a3a" stroke="#6b4612" stroke-width="${r * 0.05}"/>
 ${chars ? [['易', 0, -0.6], ['經', 0, 0.6], ['通', 0.6, 0], ['寶', -0.6, 0]].map(([c, dx, dy]) => `<text x="${cx + dx * r}" y="${cy + dy * r}" font-family="Noto Serif CJK SC" font-weight="900" font-size="${r * 0.42}" fill="#4a2f08" text-anchor="middle" dominant-baseline="central">${c}</text>`).join('') : ''}`;
const bg = (s, rounded) => `<defs><linearGradient id="jade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a7559"/><stop offset="1" stop-color="#113a2d"/></linearGradient></defs><rect width="${s}" height="${s}" rx="${rounded ? s * 0.22 : 0}" fill="url(#jade)"/>`;
const svg = (s, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">${inner}</svg>`;
const icon = (s, { rounded = true, scale = 0.4, transparent = false } = {}) => svg(s, (transparent ? '' : bg(s, rounded)) + coin(s / 2, s / 2, s * scale));
const out = [
  ['www/icons/icon-512.png', 512, icon(512, { rounded: true, scale: 0.38 })],
  ['www/icons/icon-192.png', 192, icon(192, { rounded: true, scale: 0.38 })],
  ['www/icons/maskable-512.png', 512, icon(512, { rounded: false, scale: 0.3 })],
  ['www/icons/maskable-192.png', 192, icon(192, { rounded: false, scale: 0.3 })],
  ['www/icons/apple-touch-icon.png', 180, icon(180, { rounded: false, scale: 0.36 })],
];
const android = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const res = 'android/app/src/main/res';
if (fs.existsSync(res)) for (const [d, f] of Object.entries(android)) {
  out.push([`${res}/mipmap-${d}/ic_launcher.png`, 48 * f, icon(48 * f, { rounded: true, scale: 0.4 })]);
  out.push([`${res}/mipmap-${d}/ic_launcher_round.png`, 48 * f, svg(48 * f, `<defs><linearGradient id="jade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a7559"/><stop offset="1" stop-color="#113a2d"/></linearGradient></defs><circle cx="${24 * f}" cy="${24 * f}" r="${24 * f}" fill="url(#jade)"/>` + coin(24 * f, 24 * f, 48 * f * 0.36))]);
  out.push([`${res}/mipmap-${d}/ic_launcher_foreground.png`, 108 * f, icon(108 * f, { transparent: true, scale: 0.26 })]);
}
const b = await chromium.launch(); const p = await b.newPage();
for (const [file, s, markup] of out) {
  await p.setViewportSize({ width: Math.round(s), height: Math.round(s) });
  await p.setContent(`<html><body style="margin:0;background:transparent">${markup}</body></html>`);
  await p.waitForTimeout(50);
  await p.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: Math.round(s), height: Math.round(s) } });
}
// favicon (vector, no font dependency)
fs.writeFileSync('www/icons/favicon.svg', svg(64, bg(64, true) + coin(32, 32, 24, false)));
// Open Graph image
await p.setViewportSize({ width: 1200, height: 630 });
await p.setContent(`<html><body style="margin:0;width:1200px;height:630px;display:flex;align-items:center;gap:60px;padding:0 90px;box-sizing:border-box;background:linear-gradient(135deg,#f6eedb,#e8dbb8);font-family:Georgia,serif">${svg(360, bg(360, true) + coin(180, 180, 140))}<div><div style="font:600 28px sans-serif;letter-spacing:.15em;color:#8a6210">易經 · THE BOOK OF CHANGES</div><div style="font-size:84px;color:#1d5c47;font-weight:700;line-height:1.05;margin:10px 0">I Ching<br>The Living Oracle</div><div style="font-size:30px;color:#4a4030">Ask. Cast. Understand what is changing.</div></div></body></html>`);
await p.screenshot({ path: 'www/icons/og-image.png' });
await b.close();
console.log('icons written:', out.length + 2);

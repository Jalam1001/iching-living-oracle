// SVG renderers: hexagram figures, trigram figures and Chinese cash coins.
export function hexSVG(lines, { changing = [], size = 96, cls = '', animate = false, interactive = false, label = '' } = {}) {
  // lines: array of 6 (bottom→top): 1/'1'/7/9 = yang, 0/'0'/6/8 = yin; changing positions (1..6)
  const w = 100, lh = 9, gap = 7, h = 6 * lh + 5 * gap;
  const yang = (v) => v === 1 || v === '1' || v === 7 || v === 9;
  let body = '';
  for (let i = 0; i < 6; i++) {
    const y = h - (i + 1) * lh - i * gap, v = lines[i], ch = changing.includes(i + 1);
    const c = `ln${ch ? ' chg' : ''}${animate ? ' rise' : ''}`;
    const st = animate ? ` style="animation-delay:${i * 90}ms"` : '';
    const hit = interactive ? `<rect class="hit" data-pos="${i + 1}" x="-4" y="${y - gap / 2}" width="${w + 8}" height="${lh + gap}" rx="3"/>` : '';
    if (v === undefined || v === null) body += `<rect class="ln empty" x="0" y="${y}" width="${w}" height="${lh}" rx="2"/>`;
    else if (yang(v)) body += `<g class="${c}"${st} data-pos="${i + 1}"><rect x="0" y="${y}" width="${w}" height="${lh}" rx="2"/>${hit}</g>`;
    else body += `<g class="${c}"${st} data-pos="${i + 1}"><rect x="0" y="${y}" width="${w * 0.42}" height="${lh}" rx="2"/><rect x="${w * 0.58}" y="${y}" width="${w * 0.42}" height="${lh}" rx="2"/>${hit}</g>`;
    if (ch) body += `<circle class="dot" cx="${w + 9}" cy="${y + lh / 2}" r="3"/>`;
  }
  const aria = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="hex ${cls}" viewBox="-6 -4 ${w + 22} ${h + 8}" width="${size}" height="${(size * (h + 8)) / (w + 22)}" ${aria}>${body}</svg>`;
}
export function triSVG(bits, size = 40, cls = '') {
  const w = 60, lh = 8, gap = 7, h = 3 * lh + 2 * gap; let b = '';
  for (let i = 0; i < 3; i++) {
    const y = h - (i + 1) * lh - i * gap;
    b += bits[i] === '1' ? `<rect x="0" y="${y}" width="${w}" height="${lh}" rx="2"/>` : `<rect x="0" y="${y}" width="${w * 0.42}" height="${lh}" rx="2"/><rect x="${w * 0.58}" y="${y}" width="${w * 0.42}" height="${lh}" rx="2"/>`;
  }
  return `<svg class="tri ${cls}" viewBox="0 0 ${w} ${h}" width="${size}" height="${(size * h) / w}" aria-hidden="true">${b}</svg>`;
}
// A Chinese cash coin. Front (inscribed, yin = 2) shows 易經通寶; back (plain, yang = 3) shows a simple rim pattern.
export function coinSVG(id) {
  const chars = ['易', '通', '經', '寶']; // top, right, bottom, left (traditional reading order top-bottom-right-left)
  const pos = [[50, 24], [76, 52], [50, 80], [24, 52]];
  const front = chars.map((c, i) => `<text x="${pos[i][0]}" y="${pos[i][1]}" class="cc">${c}</text>`).join('');
  return `<div class="coin" id="${id}" aria-hidden="true"><div class="coin-inner">
  <div class="face front"><svg viewBox="0 0 100 100"><defs><radialGradient id="g${id}" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#f7dc8e"/><stop offset=".55" stop-color="#c8963a"/><stop offset="1" stop-color="#7d5418"/></radialGradient></defs>
  <circle cx="50" cy="50" r="48" fill="url(#g${id})"/><circle cx="50" cy="50" r="44" fill="none" stroke="#6b4612" stroke-width="2.5" opacity=".7"/>
  <rect x="38" y="38" width="24" height="24" fill="var(--coin-hole)" stroke="#6b4612" stroke-width="3"/>${front}</svg></div>
  <div class="face back"><svg viewBox="0 0 100 100"><defs><radialGradient id="h${id}" cx="60%" cy="35%" r="80%"><stop offset="0" stop-color="#e9c46f"/><stop offset=".6" stop-color="#b07f2c"/><stop offset="1" stop-color="#6e4813"/></radialGradient></defs>
  <circle cx="50" cy="50" r="48" fill="url(#h${id})"/><circle cx="50" cy="50" r="44" fill="none" stroke="#6b4612" stroke-width="2.5" opacity=".7"/><circle cx="50" cy="50" r="30" fill="none" stroke="#6b4612" stroke-width="1.5" opacity=".5"/>
  <rect x="38" y="38" width="24" height="24" fill="var(--coin-hole)" stroke="#6b4612" stroke-width="3"/>
  <path d="M50 10v8M50 82v8M10 50h8M82 50h8" stroke="#6b4612" stroke-width="3" opacity=".6"/></svg></div></div></div>`;
}

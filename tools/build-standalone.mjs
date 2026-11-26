// Builds a single self-contained HTML file (no server, no network): standalone/iching-living-oracle.html
// The JS modules are bundled with esbuild; CSS, data and the favicon are inlined.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const W = (p) => join(ROOT, 'www', p);
const js = (await build({ entryPoints: [W('js/app.js')], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020' })).outputFiles[0].text;
const css = readFileSync(W('css/app.css'), 'utf8');
const db = readFileSync(W('data/iching.json'), 'utf8');
const fav = 'data:image/svg+xml;base64,' + readFileSync(W('icons/favicon.svg')).toString('base64');
let html = readFileSync(W('index.html'), 'utf8');
const safe = (s) => s.replace(/<\/script/gi, '<\\/script');
html = html
  .replace(/<link rel="manifest"[^>]*>\n?/, '')
  .replace(/<link rel="icon" href="icons\/icon-192.png"[^>]*>\n?/, '')
  .replace(/<link rel="apple-touch-icon"[^>]*>\n?/, '')
  .replace(/<meta property="og:image"[^>]*>\n?/, '')
  .replace('href="icons/favicon.svg"', `href="${fav}"`)
  .replace('<link rel="stylesheet" href="css/app.css">', () => `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="js/app.js"></script>', () => `<script>window.__ICHING_DB=${safe(db)};window.__ICHING_STANDALONE=true;</script>\n<script>${safe(js)}</script>`);
mkdirSync(join(ROOT, 'standalone'), { recursive: true });
const out = join(ROOT, 'standalone', 'iching-living-oracle.html');
writeFileSync(out, html);
console.log(`wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);

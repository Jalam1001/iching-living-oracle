// Renders the PWA manifest screenshots (used by Chrome's richer install dialog).
import { chromium } from 'playwright';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '../tests/e2e/server.mjs';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { srv, url } = await serve(join(ROOT, 'www'));
const b = await chromium.launch();
for (const [file, w, h, hash, mobile] of [['screenshot-phone.png', 390, 844, '#/reading?l=687779&q=Should%20I%20take%20the%20new%20job%3F', true], ['screenshot-wide.png', 1280, 800, '#/', false]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile });
  await ctx.addInitScript(() => localStorage.setItem('iching.prefs.v1', JSON.stringify({ theme: 'light', sound: false })));
  const p = await ctx.newPage(); await p.goto(url + hash); await p.waitForFunction(() => window.__oracle?.ready); await p.waitForTimeout(1500);
  await p.screenshot({ path: join(ROOT, 'www/icons', file) }); await ctx.close();
}
await b.close(); srv.close(); console.log('manifest screenshots written');

// End-to-end tests in real headless Chromium (Playwright).
// Usage: node tests/e2e/run-e2e.mjs            -> serves ./www locally
//        BASE_URL=https://... node tests/e2e/run-e2e.mjs   -> tests a deployed site
// Writes test-results/e2e-report.json and screenshots to SHOTS (default docs/screenshots).
import { chromium, devices } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { serve } from './server.mjs';
import { contrastAudit } from './contrast.mjs';
import { ROOT } from '../unit/helpers.mjs';

const wiki = JSON.parse(readFileSync(join(ROOT, 'tests/reference/kingwen_wikipedia.json'), 'utf8'));
const wikiByBits = new Map(wiki.map((w) => [w.lines, w.n]));
const SHOTS = process.env.SHOTS || join(ROOT, 'test-results/screenshots');
const OUT = join(ROOT, 'test-results');
mkdirSync(SHOTS, { recursive: true }); mkdirSync(OUT, { recursive: true });

let server = null, BASE = process.env.BASE_URL;
if (!BASE) { server = await serve(join(ROOT, 'www')); BASE = server.url; }
if (!BASE.endsWith('/')) BASE += '/';
const results = [];
const log = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? '✔' : '✖'} ${name}${detail ? ' — ' + detail : ''}`); };
async function check(name, fn) { try { const d = await fn(); log(name, true, typeof d === 'string' ? d : ''); } catch (e) { log(name, false, e.message.split('\n')[0]); } }
const assert = (c, m) => { if (!c) throw new Error(m); };

const browser = await chromium.launch();
async function newPage(opts = {}, theme = 'light') {
  const ctx = await browser.newContext({ ...opts, acceptDownloads: true, serviceWorkers: 'allow' });
  await ctx.addInitScript((t) => { if (!localStorage.getItem('iching.prefs.v1')) localStorage.setItem('iching.prefs.v1', JSON.stringify({ theme: t, sound: false })); }, theme);
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|net::ERR_INTERNET_DISCONNECTED/.test(m.text())) page.errors.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  return { ctx, page };
}
const ready = (p) => p.waitForFunction(() => window.__oracle?.ready === true, null, { timeout: 15000 });
const go = async (p, hash) => { await p.evaluate((h) => { location.hash = h; }, hash); await p.waitForTimeout(350); };

// ---------------------------------------------------------------- functional tests (phone)
const { ctx, page } = await newPage({ ...devices['Pixel 7'] });
await check('Home loads without errors; load time measured', async () => {
  const t0 = Date.now(); await page.goto(BASE); await ready(page); const t = Date.now() - t0;
  const nav = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) }; });
  assert(page.errors.length === 0, page.errors.join('; '));
  return `ready in ${t} ms (DOMContentLoaded ${nav.dcl} ms, load ${nav.load} ms)`;
});
await check('Entry screen is the Learn screen: title, tagline, Consult card first, Learn tab highlighted', async () => {
  assert((await page.locator('h1.landing-title').innerText()).trim() === 'Glimpse Your Future Ahead', 'title');
  assert((await page.locator('.tagline').innerText()).trim() === '3,000 years of wisdom, one question away', 'tagline');
  const cur = await page.$$eval('.tabbar [aria-current="page"]', (a) => a.map((x) => x.dataset.nav));
  assert(cur.length === 1 && cur[0] === 'learn', 'learn tab highlighted: ' + cur);
  const firstLink = await page.$eval('#view a', (a) => a.id); assert(firstLink === 'launchBtn', 'consult card is first link: ' + firstLink);
  const tiles = await page.$$eval('.learn-nav .tile b', (b) => b.map((x) => x.textContent));
  for (const t of ['How to Use', 'History & Philosophy', 'Carl Jung & Synchronicity', 'Further Reading', 'About & Download', 'The Eight Trigrams', 'The 64 Hexagrams']) assert(tiles.includes(t), 'tile ' + t);
  const box = await page.locator('#launchBtn').boundingBox(); assert(box.y + box.height < 844, 'consult card visible without scrolling');
  await go(page, '#/learn'); assert(await page.locator('h1.landing-title').count() === 1, '#/learn shows the same screen');
  await go(page, '#/');
  return `title, tagline, ${tiles.length} learn tiles`;
});
await check('Distribution controls: Consult card, Install, Download APK, View Source', async () => {
  for (const id of ['launchBtn', 'installBtn', 'apkBtn', 'sourceBtn']) assert(await page.locator('#' + id).isVisible(), id + ' visible');
  const apk = await page.getAttribute('#apkBtn', 'href'), src = await page.getAttribute('#sourceBtn', 'href');
  assert(apk === 'https://github.com/Jalam1001/iching-living-oracle/releases/download/v0.1-rc2/iching-living-oracle-v0.1-rc2.apk', 'apk href ' + apk);
  assert(src === 'https://github.com/Jalam1001/iching-living-oracle', 'source href');
  await page.click('#installBtn'); await page.waitForTimeout(300);
  const modalOpen = await page.evaluate(() => document.querySelector('#modal').open);
  assert(modalOpen, 'install instructions shown when no beforeinstallprompt');
  await page.keyboard.press('Escape');
  await page.click('#launchBtn'); await page.waitForTimeout(300);
  assert((await page.evaluate(() => location.hash)) === '#/consult', 'launch → consult');
});

async function fullConsult(p, method, question) {
  await go(p, '#/consult');
  await p.evaluate(() => sessionStorage.removeItem('iching.session'));
  await p.reload(); await ready(p);
  await p.fill('#q', question);
  await p.click(`.method[data-m="${method}"]`);
  await p.click('#begin');
  const checks = [];
  for (let i = 0; i < 6; i++) {
    await p.click('#castBtn');
    await p.waitForFunction((n) => window.__oracle.casts.length >= n && !document.querySelector('#castBtn')?.disabled, i + 1 + (p._castBase || 0), { timeout: 10000 }).catch(() => {});
    await p.waitForTimeout(80);
    const st = await p.evaluate((m) => {
      const c = window.__oracle.lastCast;
      const r = { value: c.value, result: document.querySelector('#castResult .v')?.textContent };
      if (m === 'coins') {
        r.coins = c.coins; r.shownPlain = [0, 1, 2].filter((i) => document.querySelector('#c' + i).classList.contains('show-back')).length;
        r.labels = [0, 1, 2].map((i) => document.querySelector('#cv' + i).textContent);
      } else { r.picked = document.querySelector('.marble.pick')?.textContent; }
      return r;
    }, method);
    checks.push(st);
  }
  p._castBase = (p._castBase || 0) + 6;
  return checks;
}
for (const method of ['coins', 'yarrow']) {
  await check(`Full ${method} consultation: displayed ${method === 'coins' ? 'coin faces' : 'marble'} match every line value; reading A–G correct`, async () => {
    const casts = await fullConsult(page, method, 'How should I approach my new job?');
    for (const [i, c] of casts.entries()) {
      assert(String(c.value) === c.result, `line ${i + 1} result text`);
      if (method === 'coins') {
        assert(c.coins.reduce((a, b) => a + b, 0) === c.value, 'coins sum');
        assert(c.shownPlain === c.coins.filter((x) => x === 3).length, `line ${i + 1}: plain faces shown ${c.shownPlain} vs ${c.coins}`);
        assert(c.labels.filter((l) => l.startsWith('plain')).length === c.value - 6, `line ${i + 1}: labels`);
      } else assert(String(c.value) === c.picked, `line ${i + 1}: picked marble ${c.picked} vs ${c.value}`);
    }
    await page.click('#revealBtn'); await page.waitForTimeout(800);
    const r = await page.evaluate(() => window.__oracle.reading);
    const lines = casts.map((c) => c.value);
    const pb = lines.map((v) => (v % 2 ? '1' : '0')).join(''), rb = lines.map((v) => ({ 6: '1', 7: '1', 8: '0', 9: '0' })[v]).join('');
    assert(r.primary === wikiByBits.get(pb), 'primary vs reference');
    const ch = lines.some((v) => v === 6 || v === 9);
    assert(r.resulting === (ch ? wikiByBits.get(rb) : null), 'resulting vs reference');
    for (const s of ['A', 'B', 'C', 'E', 'F', 'G']) assert(await page.locator('#sec' + s).count() === 1, 'section ' + s);
    assert((await page.locator('#secD').count()) === (ch ? 1 : 0), 'section D presence');
    const txt = await page.locator('#secA').innerText();
    assert(/work|career/i.test(txt), 'career context applied');
    return `lines ${lines.join('')} → ${r.primary}${r.resulting ? ' → ' + r.resulting : ''}`;
  });
}
await check('Journal: save with notes, persists across reload, edit observations', async () => {
  await page.fill('#notes', 'E2E note: first impressions');
  await page.click('#saveBtn'); await page.waitForTimeout(500);
  await go(page, '#/journal');
  await page.reload(); await ready(page); await page.waitForTimeout(400);
  const n = await page.locator('#jl .entry').count(); assert(n === 1, `entries ${n}`);
  await page.locator('#jl .entry').first().click(); await page.waitForTimeout(400);
  assert((await page.inputValue('#jn')) === 'E2E note: first impressions', 'notes persisted');
  await page.fill('#jo', 'Two weeks later: it worked out.'); await page.click('#jsave'); await page.waitForTimeout(300);
  await page.reload(); await ready(page); await page.waitForTimeout(300);
  assert((await page.inputValue('#jo')) === 'Two weeks later: it worked out.', 'observations persisted');
});
let exported = null;
await check('Journal: search, export TXT + JSON, delete all, import JSON, delete one', async () => {
  await go(page, '#/journal'); await page.waitForTimeout(300);
  await page.fill('#js', 'zzzz-no-match'); await page.waitForTimeout(200);
  assert(await page.locator('#jl .entry').count() === 0, 'search filters');
  await page.fill('#js', 'new job'); await page.waitForTimeout(200);
  assert(await page.locator('#jl .entry').count() === 1, 'search finds');
  const [dt] = await Promise.all([page.waitForEvent('download'), page.click('#expTxt')]);
  const txt = readFileSync(await dt.path(), 'utf8'); assert(/I CHING/.test(txt) && /Two weeks later/.test(txt), 'txt export content');
  const [dj] = await Promise.all([page.waitForEvent('download'), page.click('#expJson')]);
  exported = join(OUT, 'journal-export.json'); await dj.saveAs(exported);
  const js = JSON.parse(readFileSync(exported, 'utf8')); assert(js.entries.length === 1 && js.entries[0].lines.length === 6, 'json export content');
  await page.click('#delAll'); await page.waitForTimeout(500);
  assert(await page.locator('#jl .entry').count() === 0, 'deleted all');
  await page.setInputFiles('#impFile', exported); await page.waitForTimeout(800);
  await go(page, '#/consult'); await go(page, '#/journal'); await page.waitForTimeout(300);
  assert(await page.locator('#jl .entry').count() === 1, 'import restored entry');
  await page.locator('#jl .entry').first().click(); await page.waitForTimeout(300);
  assert((await page.inputValue('#jo')).startsWith('Two weeks later'), 'imported observations');
  await page.click('#jdel'); await page.waitForTimeout(500);
  assert(await page.locator('#jl .entry').count() === 0, 'single delete');
});
await check('Encyclopedia: grid of 64, search, list view, hexagram detail with 6 lines', async () => {
  await go(page, '#/hexagrams'); await page.waitForTimeout(300);
  if (await page.locator('[data-v="grid"]').count()) await page.click('[data-v="grid"]');
  assert(await page.locator('#hres .g').count() === 64, 'grid 64');
  await page.fill('#hs', 'fire'); await page.waitForTimeout(200);
  const nFire = await page.locator('#hres .g').count(); assert(nFire >= 8 && nFire < 64, 'fire search ' + nFire);
  await page.fill('#hs', '49'); await page.waitForTimeout(200);
  assert(await page.locator('#hres .g').count() === 1, 'number search');
  await page.fill('#hs', 'gé'); await page.waitForTimeout(200);
  assert(await page.locator('#hres .g').count() >= 1, 'pinyin search');
  await page.click('[data-v="list"]'); await page.fill('#hs', ''); await page.waitForTimeout(200);
  await go(page, '#/hexagram/49'); await page.waitForTimeout(300);
  const t = await page.locator('#view').innerText();
  assert(/Revolution/.test(t) && /革/.test(t), 'detail');
  for (let i = 1; i <= 6; i++) assert(new RegExp(`Line ${i}`).test(t), 'line ' + i);
  return `"fire" matches ${nFire}`;
});
await check('Transformation explorer: flipping a line opens the right hexagram', async () => {
  await go(page, '#/hexagram/1'); await page.waitForTimeout(300);
  const btns = page.locator('#flipBtns button'); assert(await btns.count() === 6, 'six flip buttons');
  await btns.nth(0).click(); await page.waitForTimeout(250);
  const out = await page.locator('#flipOut').innerText(); assert(/44/.test(out), 'Qian line 1 → 44: ' + out.slice(0, 80));
});
await check('Eight Trigrams: builder makes the correct hexagram (Lake over Fire = 49; Fire over Lake = 38)', async () => {
  await go(page, '#/trigrams'); await page.waitForTimeout(300);
  await page.click('#selLower'); await page.locator('[data-k="li"]').first().click();
  await page.click('#selUpper'); await page.locator('[data-k="dui"]').first().click(); await page.waitForTimeout(300);
  const t = await page.locator('#built').innerText(); assert(/49\. Revolution/.test(t), t.slice(0, 140));
  await page.click('#selLower'); await page.locator('[data-k="dui"]').first().click();
  await page.click('#selUpper'); await page.locator('[data-k="li"]').first().click(); await page.waitForTimeout(300);
  const t2 = await page.locator('#built').innerText(); assert(/38\. Opposition/.test(t2), t2.slice(0, 140));
});
await check('How to Use: interactive demo builds 33 → 49', async () => {
  await go(page, '#/learn/howto'); await page.waitForTimeout(300);
  for (let i = 0; i < 6; i++) await page.click('#demoNext');
  const t = await page.locator('#demoTxt').innerText(); assert(/33/.test(t) && /49/.test(t), t);
});
await check('All routes render a heading without errors', async () => {
  const routes = ['#/', '#/consult', '#/reading?l=687779', '#/reading?l=777777', '#/reading?l=999999', '#/reading?l=966968', '#/hexagrams', '#/hexagram/64', '#/trigrams', '#/journal', '#/learn', '#/learn/howto', '#/learn/history', '#/learn/jung', '#/learn/reading', '#/learn/about', '#/about', '#/nonexistent'];
  page.errors.length = 0;
  for (const r of routes) { await go(page, r); const h = await page.locator('#view h1, #view h2').count(); assert(h > 0, 'heading on ' + r); }
  assert(page.errors.length === 0, page.errors.join('; '));
  return `${routes.length} routes`;
});
await check('Jung page: foreword examples link to correct readings (50→35, 29→48)', async () => {
  await go(page, '#/learn/jung');
  const hrefs = await page.$$eval('#view a', (as) => as.map((a) => a.getAttribute('href')));
  assert(hrefs.some((h) => /l=899787/.test(h)) && hrefs.some((h) => /l=876878/.test(h)), 'links');
  await go(page, '#/reading?l=899787'); const a = await page.evaluate(() => window.__oracle.reading);
  assert(a.primary === 50 && a.resulting === 35, '50→35');
  await go(page, '#/reading?l=876878'); const b = await page.evaluate(() => window.__oracle.reading);
  assert(b.primary === 29 && b.resulting === 48, '29→48');
});
await check('Keyboard & accessibility basics: every button/link has an accessible name; textarea labelled', async () => {
  const bad = [];
  for (const r of ['#/', '#/consult', '#/reading?l=687779', '#/hexagrams', '#/trigrams', '#/journal', '#/learn/howto']) {
    await go(page, r);
    const b = await page.$$eval('button, a[href], input, textarea, select', (els) => els.filter((e) => e.offsetParent !== null).filter((e) => {
      const name = e.getAttribute('aria-label') || e.textContent.trim() || e.getAttribute('title') || (e.id && document.querySelector(`label[for="${e.id}"]`)?.textContent) || e.getAttribute('placeholder');
      return !name;
    }).map((e) => e.outerHTML.slice(0, 80)));
    bad.push(...b.map((x) => r + ' ' + x));
  }
  assert(bad.length === 0, bad.join(' | '));
  await go(page, '#/consult'); await page.keyboard.press('Tab'); const f = await page.evaluate(() => document.activeElement.tagName);
  assert(f !== 'BODY', 'focus moves with Tab');
});

// ---------------------------------------------------------------- PWA: manifest, installability, offline
const { ctx: dctx, page: dp } = await newPage({ viewport: { width: 1280, height: 800 } });
await check('Manifest valid; icons load with declared sizes', async () => {
  await dp.goto(BASE); await ready(dp);
  const m = await dp.evaluate(async () => (await fetch('manifest.webmanifest')).json());
  assert(m.name && m.short_name && m.start_url && m.display === 'standalone', 'fields');
  for (const ic of m.icons) {
    const sz = await dp.evaluate(async (src) => { const i = new Image(); i.src = src; await i.decode(); return `${i.naturalWidth}x${i.naturalHeight}`; }, new URL(ic.src, BASE + 'manifest.webmanifest').href);
    if (ic.sizes !== 'any') assert(sz === ic.sizes, `${ic.src} ${sz} vs ${ic.sizes}`);
  }
  for (const s of m.screenshots || []) {
    const ok = await dp.evaluate(async (src) => (await fetch(src)).ok, new URL(s.src, BASE + 'manifest.webmanifest').href); assert(ok, s.src);
  }
  return `${m.icons.length} icons, ${(m.screenshots || []).length} screenshots`;
});
await check('Installability (Chromium DevTools Protocol: Page.getInstallabilityErrors)', async () => {
  await dp.waitForFunction(() => navigator.serviceWorker?.controller || window.__oracle.swRegistered, null, { timeout: 10000 });
  await dp.reload(); await ready(dp); await dp.waitForTimeout(800);
  const cdp = await dctx.newCDPSession(dp);
  const r = await cdp.send('Page.getInstallabilityErrors');
  const errs = (r.installabilityErrors || []).map((e) => e.errorId);
  assert(errs.length === 0, 'errors: ' + errs.join(', '));
  const m = await cdp.send('Page.getAppManifest');
  assert(!(m.errors || []).length, 'manifest parse errors: ' + JSON.stringify(m.errors));
  return 'no installability errors reported';
});
await check('Offline: after first visit the whole app works with the network disabled', async () => {
  await dp.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 10000 });
  await dp.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
  await dp.waitForTimeout(500);
  await dctx.setOffline(true);
  await dp.reload(); await ready(dp);
  for (const r of ['#/hexagrams', '#/hexagram/12', '#/trigrams', '#/learn/history', '#/journal']) { await go(dp, r); assert(await dp.locator('#view h1, #view h2').count() > 0, r); }
  await go(dp, '#/consult'); await dp.evaluate(() => sessionStorage.clear()); await dp.reload(); await ready(dp);
  await dp.click('#begin'); for (let i = 0; i < 6; i++) { await dp.click('#castBtn'); await dp.waitForFunction((n) => window.__oracle.casts.length >= n && !document.querySelector('#castBtn')?.disabled, i + 1); }
  await dp.click('#revealBtn'); await dp.waitForTimeout(500);
  assert(await dp.locator('#secA').count() === 1, 'offline reading');
  await dctx.setOffline(false);
  return 'reload + 5 routes + full consultation offline';
});

// ---------------------------------------------------------------- screenshots & contrast (light + dark, 3 viewports)
const VIEWPORTS = { phone: { ...devices['Pixel 7'] }, tablet: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, desktop: { viewport: { width: 1440, height: 900 } } };
const SCREENS = [['entry', '#/'], ['cast', null], ['reading', '#/reading?l=687779&q=Should%20I%20take%20the%20new%20job%3F'], ['hexagrams', '#/hexagrams'], ['hexagram-49', '#/hexagram/49'], ['trigrams', '#/trigrams'], ['journal', '#/journal'], ['jung', '#/learn/jung']];
const contrastFails = new Map(); let contrastChecked = 0; const shots = [];
for (const theme of ['light', 'dark']) for (const [vp, opts] of Object.entries(VIEWPORTS)) {
  const { ctx: c, page: p } = await newPage(opts, theme);
  await p.goto(BASE); await ready(p);
  for (const [name, hash] of SCREENS) {
    if (name === 'cast') { await go(p, '#/consult'); await p.evaluate(() => sessionStorage.clear()); await p.reload(); await ready(p); await p.fill('#q', 'What should I understand about this new chapter?'); await p.click('#begin'); for (let i = 0; i < 3; i++) { await p.click('#castBtn'); await p.waitForFunction((n) => window.__oracle.casts.length >= n && !document.querySelector('#castBtn')?.disabled, i + 1); } }
    else await go(p, hash);
    await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(name === 'reading' ? 1600 : 700);
    const f = join(SHOTS, `${vp}-${theme}-${name}.png`); await p.screenshot({ path: f }); shots.push(f);
    const audit = await p.evaluate(contrastAudit); contrastChecked += audit.length;
    audit.filter((a) => !a.ok).forEach((a) => contrastFails.set(`${theme}|${a.sel}|${a.text}`, { ...a, theme, page: name }));
  }
  await c.close();
}
log(`Screenshots captured (${shots.length}: phone/tablet/desktop × light/dark)`, true, SHOTS);
log('WCAG AA text contrast (4.5:1 normal, 3:1 large) on all screenshot pages', contrastFails.size === 0, `${contrastChecked} text elements checked, ${contrastFails.size} distinct failures${contrastFails.size ? ': ' + [...contrastFails.values()].slice(0, 8).map((f) => `${f.theme}/${f.page} "${f.text}" ${f.ratio}<${f.need} (${f.sel})`).join('; ') : ''}`);

await browser.close(); server?.srv.close();
const pass = results.filter((r) => r.ok).length;
writeFileSync(join(OUT, 'e2e-report.json'), JSON.stringify({ base: BASE, date: new Date().toISOString(), browser: 'Chromium (Playwright headless)', pass, total: results.length, results, contrastFailures: [...contrastFails.values()] }, null, 2));
console.log(`\n${pass}/${results.length} checks passed`);
process.exit(pass === results.length ? 0 : 1);

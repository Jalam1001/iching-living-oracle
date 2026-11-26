// Database completeness, content quality and readability.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db } from './helpers.mjs';
import { REFERENCES, LINKS, HISTORY, JUNG, HOWTO, ABOUT } from '../../www/js/content.js';

const FIELDS = ['zh', 'pinyin', 'legge', 'name', 'glyph', 'lower', 'upper', 'bits', 'core', 'now', 'dir', 'love', 'work', 'self', 'jung', 'example', 'judgment', 'image'];

test('database has 64 hexagrams, 8 trigrams and 384 lines, with every field filled', () => {
  assert.equal(db.trigrams.length, 8);
  assert.equal(db.hexagrams.length, 64);
  let lines = 0;
  db.hexagrams.forEach((h, i) => {
    assert.equal(h.n, i + 1);
    for (const f of FIELDS) assert.ok(typeof h[f] === 'string' && h[f].trim().length > 0, `${h.n}.${f}`);
    assert.ok(h.keywords.length >= 3 && h.do.length >= 2 && h.avoid.length >= 1, `${h.n} lists`);
    assert.equal(h.glyph.codePointAt(0), 0x4dc0 + i, `Unicode hexagram glyph ${h.n}`);
    lines += h.lines.length;
  });
  assert.equal(lines, 384);
});

test('no placeholders, TODOs or unfinished text anywhere', () => {
  const s = JSON.stringify(db) + HISTORY + JUNG + HOWTO + ABOUT;
  assert.ok(!/lorem|ipsum|TODO|TBD|FIXME|XXX|placeholder|\?\?\?|undefined/i.test(s), s.match(/.{30}(lorem|TODO|TBD|FIXME|XXX|placeholder|\?\?\?|undefined).{30}/i)?.[0]);
});

test('plain-English line texts are distinct from the Legge translation and reasonably readable', () => {
  const syll = (w) => Math.max(1, (w.toLowerCase().replace(/e\b/, '').match(/[aeiouy]+/g) || []).length);
  const flesch = (t) => {
    const words = t.match(/[A-Za-z']+/g) || [], sents = Math.max(1, (t.match(/[.!?]+/g) || []).length);
    const sy = words.reduce((a, w) => a + syll(w), 0);
    return 206.835 - 1.015 * (words.length / sents) - 84.6 * (sy / words.length);
  };
  const scores = [];
  for (const h of db.hexagrams) for (const l of h.lines) {
    assert.notEqual(l.plain.slice(0, 40), l.legge.slice(0, 40));
    scores.push(flesch(l.plain));
  }
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  console.log(`  mean Flesch reading ease of 384 plain-English line texts: ${mean.toFixed(1)}`);
  assert.ok(mean > 50, 'plain English should read at roughly high-school level or easier');
});

test('all hexagram names unique; Legge source attributed', () => {
  assert.equal(new Set(db.hexagrams.map((h) => h.name)).size, 64);
  assert.match(db.source.classical, /Legge/);
});

test('reference links are https and the essential ones are present', () => {
  const all = REFERENCES.flatMap((g) => g.items);
  assert.ok(all.length >= 12);
  for (const r of all) assert.match(r.u, /^https:\/\//);
  assert.match(LINKS.repo, /^https:\/\/github\.com\/Jalam1001\/iching-living-oracle$/);
  assert.match(LINKS.apk, /releases\/download\/v0\.1-rc2\/iching-living-oracle-v0\.1-rc2\.apk$/);
});

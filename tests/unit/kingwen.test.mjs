// Exhaustive verification of the hexagram engine against two independent references.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, wiki, legge, leggeBits, allConfigs } from './helpers.mjs';
import { makeIndex, resolve, primaryBits, resultingBits, changingPositions, fromTrigrams } from '../../www/js/engine.js';

const ix = makeIndex(db);
const SYM = { '☰': 'qian', '☱': 'dui', '☲': 'li', '☳': 'zhen', '☴': 'xun', '☵': 'kan', '☶': 'gen', '☷': 'kun' };
const wikiByBits = new Map(wiki.map((w) => [w.lines, w.n]));

test('references agree with each other (Wikipedia trigram table vs Legge NINE/SIX labels): 64/64', () => {
  assert.equal(wiki.length, 64);
  for (const w of wiki) assert.equal(leggeBits(w.n), w.lines, `hexagram ${w.n}`);
  assert.equal(new Set(wiki.map((w) => w.lines)).size, 64, 'all 64 patterns distinct');
});

test('database: each hexagram has the King Wen number, trigrams and line pattern of the reference', () => {
  assert.equal(db.hexagrams.length, 64);
  for (const w of wiki) {
    const h = ix.byNum(w.n);
    assert.ok(h, `hexagram ${w.n} present`);
    assert.equal(h.bits, w.lines, `bits of ${w.n}`);
    assert.equal(h.lower, SYM[w.lower], `lower trigram of ${w.n}`);
    assert.equal(h.upper, SYM[w.upper], `upper trigram of ${w.n}`);
    // 无/無 are variant forms of the same character (Wikipedia uses the archaic 无 for 25)
    assert.equal(h.zh.replace('無', '无'), w.zh.replace('無', '无'), `Chinese character of ${w.n}`);
  }
});

test('trigram builder: all 64 lower×upper combinations map to the reference hexagram', () => {
  let n = 0;
  for (const lo of db.trigrams) for (const up of db.trigrams) {
    const h = fromTrigrams(lo.key, up.key, ix);
    assert.equal(h.n, wikiByBits.get(lo.bits + up.bits), `${lo.key}/${up.key}`);
    n++;
  }
  assert.equal(n, 64);
});

test('all 4096 configurations of 6/7/8/9 resolve to the correct primary and resulting hexagram', () => {
  let count = 0, transforming = 0;
  const seenPrimary = new Set(), seenResult = new Set();
  for (const lines of allConfigs()) {
    const r = resolve(lines, ix);
    // independent computation from the reference (no engine helpers)
    const pBits = lines.map((v) => (v === 7 || v === 9 ? '1' : '0')).join('');
    const rBits = lines.map((v) => ({ 6: '1', 7: '1', 8: '0', 9: '0' })[v]).join('');
    const ch = lines.map((v, i) => (v === 6 || v === 9 ? i + 1 : 0)).filter(Boolean);
    assert.equal(r.primary.n, wikiByBits.get(pBits), `primary for ${lines.join('')}`);
    assert.deepEqual(r.changing, ch);
    if (ch.length) {
      transforming++;
      assert.ok(r.resulting, `resulting exists for ${lines.join('')}`);
      assert.equal(r.resulting.n, wikiByBits.get(rBits), `resulting for ${lines.join('')}`);
      seenResult.add(r.resulting.n);
    } else {
      assert.equal(r.resulting, null, 'no resulting hexagram without changing lines');
    }
    assert.equal(primaryBits(lines), pBits);
    assert.equal(resultingBits(lines), rBits);
    assert.deepEqual(changingPositions(lines), ch);
    seenPrimary.add(r.primary.n);
    count++;
  }
  assert.equal(count, 4096);
  assert.equal(transforming, 4096 - 2 ** 6);
  assert.equal(seenPrimary.size, 64);
  assert.equal(seenResult.size, 64);
});

test('all 384 lines: each line text belongs to the right hexagram and position', () => {
  let n = 0;
  for (const h of db.hexagrams) {
    const L = legge.text.find((t) => t.n === h.n);
    assert.equal(h.lines.length, 6);
    h.lines.forEach((line, i) => {
      assert.ok(line.legge.length > 20, `legge text ${h.n}.${i + 1}`);
      assert.ok(line.plain.length > 40, `plain text ${h.n}.${i + 1}`);
      // the Legge text stored must be the same line, in the same position, as the source
      const label = line.legge.match(/\b(NINE|SIX)\b/i)[1].toUpperCase();
      assert.equal(label === 'NINE' ? '1' : '0', h.bits[i], `yin/yang label ${h.n}.${i + 1}`);
      const src = L.lines[i].replace(/\s+/g, ' ').slice(0, 25).replace(/[^A-Za-z]/g, '');
      assert.ok(line.legge.replace(/[^A-Za-z]/g, '').startsWith(src.slice(0, 15)), `source order ${h.n}.${i + 1}`);
      n++;
    });
  }
  assert.equal(n, 384);
});

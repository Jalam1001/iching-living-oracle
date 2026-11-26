// Changing-line convention, special cases and reading composition.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, allConfigs } from './helpers.mjs';
import { makeIndex, resolve, emphasis, validateLines, toggleLine } from '../../www/js/engine.js';
import { composeReading, readingToText, detectContext } from '../../www/js/reading.js';

const ix = makeIndex(db);

test('33 with changing lines 1 and 6 becomes 49 (Retreat → Revolution)', () => {
  const r = resolve([6, 8, 7, 7, 7, 9], ix);
  assert.equal(r.primary.n, 33); assert.equal(r.resulting.n, 49);
  assert.deepEqual(r.changing, [1, 6]);
  assert.equal(r.emphasis.main, 6, 'upper changing line carries the weight');
});

test("Jung's foreword examples: 50 lines 2,3 → 35; 29 line 3 → 48", () => {
  const a = resolve([8, 9, 9, 7, 8, 7], ix);
  assert.equal(a.primary.n, 50); assert.equal(a.resulting.n, 35); assert.deepEqual(a.changing, [2, 3]);
  const b = resolve([8, 7, 6, 8, 7, 8], ix);
  assert.equal(b.primary.n, 29); assert.equal(b.resulting.n, 48); assert.deepEqual(b.changing, [3]);
});

test('no changing lines: no resulting hexagram, Judgment emphasised', () => {
  const r = resolve([7, 7, 7, 7, 7, 7], ix);
  assert.equal(r.primary.n, 1); assert.equal(r.resulting, null);
  assert.equal(r.emphasis.focus, 'primary-judgment');
});

test('all lines changing: 1 → 2 and 2 → 1 with the special "use of nines/sixes" text', () => {
  const a = resolve([9, 9, 9, 9, 9, 9], ix), b = resolve([6, 6, 6, 6, 6, 6], ix);
  assert.equal(a.resulting.n, 2); assert.equal(b.resulting.n, 1);
  assert.equal(a.emphasis.focus, 'all-lines'); assert.equal(b.emphasis.focus, 'all-lines');
  assert.ok(ix.byNum(1).allLines?.legge && ix.byNum(2).allLines?.legge);
  const r = composeReading(a, ix, '');
  assert.ok(r.F.special && r.A.join(' ').includes(ix.byNum(1).allLines.plain));
  // other hexagram with all lines changing: resulting judgment
  const c = resolve([9, 6, 9, 6, 9, 6], ix);
  assert.equal(c.emphasis.focus, 'result-judgment');
});

test('emphasis convention (Zhu Xi) for every count of changing lines', () => {
  const E = (l, n = 0) => emphasis(l, n);
  assert.deepEqual(E([9, 7, 8, 7, 8, 7]).lines, [1]);
  assert.equal(E([9, 7, 8, 7, 8, 7]).main, 1);
  assert.equal(E([9, 7, 8, 6, 8, 7]).main, 4);
  assert.equal(E([9, 6, 9, 7, 8, 7]).focus, 'both-judgments');
  const four = E([9, 6, 9, 6, 8, 7]);
  assert.equal(four.focus, 'result-still-lines'); assert.deepEqual(four.lines, [5, 6]); assert.equal(four.main, 5);
  const five = E([9, 6, 9, 6, 9, 7]);
  assert.deepEqual(five.lines, [6]); assert.equal(five.main, 6);
});

test('every one of the 4096 configurations produces a complete reading (A–G)', () => {
  let n = 0;
  for (const lines of allConfigs()) {
    const res = resolve(lines, ix);
    const r = composeReading(res, ix, n % 2 ? 'Should I change my career?' : '');
    assert.ok(r.A.length >= 2 && r.A.every((p) => typeof p === 'string' && p.length > 30));
    assert.ok(r.B.text.length > 50);
    assert.equal(r.C.length, res.changing.length);
    if (res.changing.length) assert.ok(r.D && r.D.text.length > 30); else assert.ok(!r.D);
    assert.ok(r.E.doList.length >= 2 && r.E.avoidList.length >= 1 && r.E.questions.length >= 2);
    assert.ok(r.F.primary.judgment.length > 10);
    assert.ok(r.G.length >= 1);
    const txt = readingToText(r, { question: 'q', lines, method: 'coins' }) + r.A.join(' ');
    assert.ok(!/undefined|NaN|\[object|null\b/.test(txt), `bad text for ${lines.join('')}: ${txt.match(/.{40}(undefined|NaN|\[object|null).{20}/)?.[0]}`);
    n++;
  }
  assert.equal(n, 4096);
});

test('context detection', () => {
  assert.equal(detectContext('Should I leave my job?').key, 'career');
  assert.equal(detectContext('How can I repair things with my sister?').key, 'family');
  assert.equal(detectContext('Will my relationship with my partner last?').key, 'relationships');
  assert.equal(detectContext('Should I invest my savings?').key, 'finance');
  assert.equal(detectContext('I am worried about my health').key, 'health');
  assert.equal(detectContext('').key, 'general');
});

test('health and finance readings carry a disclaimer; no high-stakes certainty language', () => {
  const res = resolve([6, 8, 7, 7, 7, 9], ix);
  const h = composeReading(res, ix, 'Is my illness serious?');
  assert.match(h.A.join(' '), /medical|doctor|professional/i);
  const f = composeReading(res, ix, 'Should I buy shares in this stock?');
  assert.match(f.A.join(' '), /financial|adviser|advisor|professional/i);
  for (const lines of [[7,7,7,7,7,7],[6,8,7,7,7,9],[9,9,9,9,9,9]]) {
    const t = readingToText(composeReading(resolve(lines, ix), ix, 'Will I die?'));
    assert.ok(!/\b(you will (die|definitely|certainly)|guaranteed|will surely)\b/i.test(t));
  }
});

test('input validation and line toggling', () => {
  assert.throws(() => validateLines([7, 7, 7]));
  assert.throws(() => validateLines([7, 7, 7, 7, 7, 5]));
  const h = toggleLine(1, 1, ix); // flip bottom line of Qian → 44
  assert.equal(h.n, 44);
});

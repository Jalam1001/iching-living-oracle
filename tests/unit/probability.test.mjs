// Probability model tests: exact enumeration + statistical tests with the real Web Crypto generator.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COIN_PROBS, YARROW_PROBS, YARROW_BAG, castCoins, castYarrow, coinsForValue, secureInt, hasSecureRandom } from '../../www/js/engine.js';
import { chi2, CHI2_001, seeded } from './helpers.mjs';

test('declared probabilities: coins 1/8,3/8,3/8,1/8; yarrow 1/16,5/16,7/16,3/16', () => {
  assert.deepEqual(COIN_PROBS, { 6: 1 / 8, 7: 3 / 8, 8: 3 / 8, 9: 1 / 8 });
  assert.deepEqual(YARROW_PROBS, { 6: 1 / 16, 7: 5 / 16, 8: 7 / 16, 9: 3 / 16 });
});

test('coins: exact enumeration of all 8 equally likely tosses gives 1/8, 3/8, 3/8, 1/8', () => {
  const counts = { 6: 0, 7: 0, 8: 0, 9: 0 };
  for (let m = 0; m < 8; m++) {
    const seq = [m & 1, (m >> 1) & 1, (m >> 2) & 1];
    let i = 0;
    const c = castCoins(() => seq[i++]);
    assert.equal(c.coins.length, 3);
    assert.equal(c.value, c.coins.reduce((a, b) => a + b, 0), 'value = sum of displayed faces');
    counts[c.value]++;
  }
  for (const v of [6, 7, 8, 9]) assert.equal(counts[v] / 8, COIN_PROBS[v]);
});

test('yarrow: exact enumeration of the 16-marble model gives 1/16, 5/16, 7/16, 3/16', () => {
  const counts = { 6: 0, 7: 0, 8: 0, 9: 0 };
  for (let d = 0; d < 16; d++) counts[castYarrow(() => d).value]++;
  assert.equal(YARROW_BAG.length, 16);
  for (const v of [6, 7, 8, 9]) assert.equal(counts[v] / 16, YARROW_PROBS[v]);
});

test('yarrow model matches an independent simulation of the traditional 49-stalk procedure', () => {
  // Classic procedure (Zhu Xi): 3 changes per line; each change: divide, take 1, count off by fours.
  const rnd = seeded(20261126);
  const change = (stalks) => {
    const left = 1 + rnd(stalks - 1); // random division, both heaps non-empty
    let right = stalks - left;
    right -= 1; // one stalk taken from the right heap, held between the fingers
    const rl = left % 4 || 4, rr = right % 4 || 4;
    const removed = 1 + rl + rr;
    return { removed, rest: stalks - removed };
  };
  const N = 200000, counts = { 6: 0, 7: 0, 8: 0, 9: 0 };
  for (let k = 0; k < N; k++) {
    let s = 49, v = 0;
    for (let c = 0; c < 3; c++) { const r = change(s); v += r.removed <= 5 ? 3 : 2; s = r.rest; }
    counts[v]++;
  }
  // The physical procedure only approximates 1/16,5/16,7/16,3/16 (remainders are not perfectly uniform
  // with a uniform split); check agreement within 1.5 percentage points.
  for (const v of [6, 7, 8, 9]) assert.ok(Math.abs(counts[v] / N - YARROW_PROBS[v]) < 0.015, `value ${v}: ${counts[v] / N}`);
});

test('Web Crypto is available and used', () => {
  assert.ok(hasSecureRandom());
  let calls = 0;
  const fake = { getRandomValues: (b) => { calls++; b[0] = 7; return b; } };
  assert.equal(secureInt(4, fake), 3);
  assert.equal(calls, 1);
});

test('secureInt rejection sampling discards biased values', () => {
  // limit for n=3 is floor(2^32/3)*3 = 4294967295; value 4294967295 must be rejected
  const seq = [4294967295, 5];
  let i = 0;
  const fake = { getRandomValues: (b) => { b[0] = seq[i++]; return b; } };
  assert.equal(secureInt(3, fake), 2);
  assert.equal(i, 2);
  assert.throws(() => secureInt(0));
});

test('statistical: 400,000 crypto coin casts pass chi-square (p>0.001)', () => {
  const N = 400000, c = { 6: 0, 7: 0, 8: 0, 9: 0 };
  for (let i = 0; i < N; i++) c[castCoins().value]++;
  const x = chi2(c, COIN_PROBS, N);
  console.log(`  coins: ${JSON.stringify(Object.fromEntries(Object.entries(c).map(([k, v]) => [k, (v / N).toFixed(4)])))} chi2=${x.toFixed(2)}`);
  assert.ok(x < CHI2_001[3], `chi2 ${x}`);
});

test('statistical: 400,000 crypto yarrow casts pass chi-square (p>0.001)', () => {
  const N = 400000, c = { 6: 0, 7: 0, 8: 0, 9: 0 };
  for (let i = 0; i < N; i++) c[castYarrow().value]++;
  const x = chi2(c, YARROW_PROBS, N);
  console.log(`  yarrow: ${JSON.stringify(Object.fromEntries(Object.entries(c).map(([k, v]) => [k, (v / N).toFixed(4)])))} chi2=${x.toFixed(2)}`);
  assert.ok(x < CHI2_001[3], `chi2 ${x}`);
});

test('statistical: 192,000 crypto coin hexagrams are uniform over the 64 primary hexagrams', () => {
  const N = 192000, c = {};
  for (let i = 0; i < N; i++) {
    let b = 0;
    for (let k = 0; k < 6; k++) b = (b << 1) | (castCoins().value % 2);
    c[b] = (c[b] || 0) + 1;
  }
  const P = Object.fromEntries([...Array(64).keys()].map((k) => [k, 1 / 64]));
  const x = chi2(c, P, N);
  console.log(`  64-hexagram uniformity chi2=${x.toFixed(2)} (df=63)`);
  assert.ok(x < CHI2_001[63]);
});

test('coin faces shown always agree with the line value (every value, many shuffles)', () => {
  for (const v of [6, 7, 8, 9]) for (let k = 0; k < 500; k++) {
    const f = coinsForValue(v);
    assert.equal(f.length, 3);
    assert.equal(f.reduce((a, b) => a + b, 0), v);
    assert.equal(f.filter((x) => x === 3).length, v - 6, 'number of plain (yang, 3) faces');
  }
});

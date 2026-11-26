import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const readJSON = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'));
export const db = readJSON('www/data/iching.json');
/** Independent reference #1: Wikipedia "List of hexagrams of the I Ching" (King Wen order, trigram composition). */
export const wiki = readJSON('tests/reference/kingwen_wikipedia.json');
/** Independent reference #2: James Legge (1882) line labels — "NINE" = yang line, "SIX" = yin line, read bottom to top. */
export const legge = readJSON('sources/legge_raw.json');
export function leggeBits(n) {
  const h = legge.text.find((t) => t.n === n);
  return h.lines.map((l) => {
    const m = l.match(/\b(NINE|SIX)\b/i);
    if (!m) throw new Error(`No NINE/SIX label in Legge hexagram ${n}`);
    return m[1].toUpperCase() === 'NINE' ? '1' : '0';
  }).join('');
}
/** All 4096 six-line configurations of values 6,7,8,9 (bottom to top). */
export function* allConfigs() {
  const V = [6, 7, 8, 9];
  for (let i = 0; i < 4096; i++) {
    const lines = [];
    let x = i;
    for (let k = 0; k < 6; k++) { lines.push(V[x & 3]); x >>= 2; }
    yield lines;
  }
}
/** Deterministic PRNG for reproducible statistical tests (mulberry32). */
export function seeded(seed) {
  let a = seed >>> 0;
  return (n) => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return Math.floor((((t ^ (t >>> 14)) >>> 0) / 4294967296) * n);
  };
}
/** Chi-square critical values at p = 0.001. */
export const CHI2_001 = { 1: 10.828, 2: 13.816, 3: 16.266, 4: 18.467, 5: 20.515, 7: 24.322, 63: 103.442 };
export function chi2(observed, expectedProbs, total) {
  let s = 0;
  for (const k of Object.keys(expectedProbs)) {
    const e = expectedProbs[k] * total;
    s += ((observed[k] || 0) - e) ** 2 / e;
  }
  return s;
}

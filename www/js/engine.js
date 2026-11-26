// I Ching — The Living Oracle · core engine (no DOM). Shared by the web app, PWA, APK and Node tests.
// Line values: 6 = old yin (broken, changing), 7 = young yang (solid), 8 = young yin (broken), 9 = old yang (solid, changing).
// Lines are always stored bottom → top (index 0 = first/lowest line).

export const LINE = {
  6: { name: 'Old Yin', yang: false, changing: true, becomes: 7, desc: 'broken, changing' },
  7: { name: 'Young Yang', yang: true, changing: false, becomes: 7, desc: 'solid, stable' },
  8: { name: 'Young Yin', yang: false, changing: false, becomes: 8, desc: 'broken, stable' },
  9: { name: 'Old Yang', yang: true, changing: true, becomes: 8, desc: 'solid, changing' },
};
export const COIN_PROBS = { 6: 1 / 8, 7: 3 / 8, 8: 3 / 8, 9: 1 / 8 };
export const YARROW_PROBS = { 6: 1 / 16, 7: 5 / 16, 8: 7 / 16, 9: 3 / 16 };
// The 16 "marbles" of the yarrow simulation: 1 × old yin, 5 × young yang, 7 × young yin, 3 × old yang.
export const YARROW_BAG = [6, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9];

/** Unbiased random integer in [0, n) using crypto.getRandomValues with rejection sampling. */
export function secureInt(n, cryptoObj = globalThis.crypto) {
  if (!Number.isInteger(n) || n <= 0 || n > 2 ** 32) throw new RangeError('n out of range');
  if (cryptoObj && cryptoObj.getRandomValues) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(2 ** 32 / n) * n;
    let x;
    do { cryptoObj.getRandomValues(buf); x = buf[0]; } while (x >= limit);
    return x % n;
  }
  return Math.floor(Math.random() * n); // fallback only where Web Crypto is unavailable
}
export const hasSecureRandom = () => !!(globalThis.crypto && globalThis.crypto.getRandomValues);

/** Three-coin cast. Inscribed side (yin) = 2, plain side (yang) = 3. Sum 6..9. */
export function castCoins(randInt = secureInt) {
  const coins = [0, 1, 2].map(() => (randInt(2) === 0 ? 2 : 3));
  const value = coins.reduce((a, b) => a + b, 0);
  return { method: 'coins', coins, value };
}
/** Yarrow-stalk probability simulation: draw one marble from the 16-marble bag. */
export function castYarrow(randInt = secureInt) {
  const draw = randInt(16);
  return { method: 'yarrow', draw, value: YARROW_BAG[draw] };
}
/** Given a line value, produce coin faces consistent with it (used for demos / replay). */
export function coinsForValue(v, randInt = secureInt) {
  const threes = v - 6; // number of yang (3) faces
  const faces = [2, 2, 2].map((_, i) => (i < threes ? 3 : 2));
  for (let i = faces.length - 1; i > 0; i--) { const j = randInt(i + 1); [faces[i], faces[j]] = [faces[j], faces[i]]; }
  return faces;
}

export const isYang = (v) => v === 7 || v === 9;
export const isChanging = (v) => v === 6 || v === 9;
export const primaryBits = (lines) => lines.map((v) => (isYang(v) ? '1' : '0')).join('');
export const resultingBits = (lines) => lines.map((v) => (v === 9 ? '0' : v === 6 ? '1' : isYang(v) ? '1' : '0')).join('');
export const changingPositions = (lines) => lines.map((v, i) => (isChanging(v) ? i + 1 : 0)).filter(Boolean);

export function validateLines(lines) {
  if (!Array.isArray(lines) || lines.length !== 6 || !lines.every((v) => v >= 6 && v <= 9 && Number.isInteger(v))) {
    throw new TypeError('A cast must have exactly six line values between 6 and 9');
  }
}

/** Build a bits → hexagram lookup from the database. */
export function makeIndex(db) {
  const byBits = new Map();
  for (const h of db.hexagrams) byBits.set(h.bits, h);
  const byNum = (n) => db.hexagrams[n - 1];
  const tri = Object.fromEntries(db.trigrams.map((t) => [t.key, t]));
  const triByBits = Object.fromEntries(db.trigrams.map((t) => [t.bits, t]));
  return { byBits, byNum, tri, triByBits };
}

/**
 * Interpretive emphasis — the convention of Zhu Xi (朱熹, Yixue Qimeng 易學啟蒙, 1186):
 * 0 changing → Judgment of the primary hexagram.
 * 1 changing → that line.
 * 2 changing → both lines; the upper one predominates.
 * 3 changing → Judgments of both hexagrams; the primary is the root, the resulting the outcome.
 * 4 changing → the two unchanging lines, read in the resulting hexagram; the lower predominates.
 * 5 changing → the single unchanging line, read in the resulting hexagram.
 * 6 changing → Judgment of the resulting hexagram; for Hexagrams 1 and 2 the special "use of nines/sixes" text.
 */
export function emphasis(lines, primaryN) {
  const ch = changingPositions(lines);
  const still = [1, 2, 3, 4, 5, 6].filter((p) => !ch.includes(p));
  switch (ch.length) {
    case 0: return { count: 0, focus: 'primary-judgment', lines: [], main: null, text: 'No lines are changing, so the Judgment of the present hexagram carries the message.' };
    case 1: return { count: 1, focus: 'primary-lines', lines: ch, main: ch[0], text: `With one changing line, that line (line ${ch[0]}) is the heart of the reading.` };
    case 2: return { count: 2, focus: 'primary-lines', lines: ch, main: ch[1], text: `With two changing lines, both are read; the upper one (line ${ch[1]}) carries the greater weight.` };
    case 3: return { count: 3, focus: 'both-judgments', lines: ch, main: null, text: 'With three changing lines, the Judgments of both hexagrams are read together: the present hexagram is the root, the resulting hexagram the outcome.' };
    case 4: return { count: 4, focus: 'result-still-lines', lines: still, main: still[0], text: `With four changing lines, the emphasis shifts to the two lines that do not change (lines ${still.join(' and ')}), read in the resulting hexagram; the lower one (line ${still[0]}) predominates.` };
    case 5: return { count: 5, focus: 'result-still-lines', lines: still, main: still[0], text: `With five changing lines, the emphasis falls on the single unchanging line (line ${still[0]}), read in the resulting hexagram.` };
    default:
      if (primaryN === 1 || primaryN === 2) return { count: 6, focus: 'all-lines', lines: ch, main: null, text: `All six lines are changing. For Hexagram ${primaryN} the classic adds a special seventh text ("the use of ${primaryN === 1 ? 'nines' : 'sixes'}"), which takes precedence.` };
      return { count: 6, focus: 'result-judgment', lines: ch, main: null, text: 'All six lines are changing, so the situation turns into its complete opposite; the Judgment of the resulting hexagram takes precedence.' };
  }
}

/** Resolve a full cast into hexagrams. */
export function resolve(lines, index) {
  validateLines(lines);
  const pb = primaryBits(lines), rb = resultingBits(lines);
  const primary = index.byBits.get(pb), resulting = index.byBits.get(rb);
  const changing = changingPositions(lines);
  return { lines: [...lines], primary, resulting: changing.length ? resulting : null, changing, emphasis: emphasis(lines, primary.n) };
}

/** Hexagram from two trigram keys. */
export function fromTrigrams(lowerKey, upperKey, index) {
  return index.byBits.get(index.tri[lowerKey].bits + index.tri[upperKey].bits);
}
/** Toggle a line (1..6) of a hexagram and return the new hexagram. */
export function toggleLine(n, pos, index) {
  const b = index.byNum(n).bits.split('');
  b[pos - 1] = b[pos - 1] === '1' ? '0' : '1';
  return index.byBits.get(b.join(''));
}

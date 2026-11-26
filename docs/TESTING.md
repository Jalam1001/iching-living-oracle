# Testing report — website/PWA and Android v0.1-rc2

> **Update for v0.1-rc2 (26 Nov 2026):** after the entry screen changed to the Learn screen, all tests were run again: unit 29/29; browser tests 19/19 locally and on the live site (one new check covers the entry screen: title, tagline, Consult card first and visible without scrolling, Learn tab highlighted, all seven Learn tiles, `#/learn` shows the same screen); contrast 3,934 text elements, 0 failures. APK v0.1-rc2: SHA-256 `e4ea8c51571465b2f2c54f32a8aa16249a52efbbd70811647a32a1986e913355`, versionCode 2, signed with the **same certificate** as rc1 (`eaae9a0a…d10b`), no permissions; public download checksum and signature verified. It still has not been installed on an emulator or device (same reason as below). The rest of this report describes the original v0.1 / v0.1-rc1 run.

Date: 26 November 2026 (America/New_York). Every result below was actually run; anything not run is listed under *Not tested*.

## Summary

| Area | Result |
|---|---|
| Unit tests (`npm test`, Node 24 `node:test`) | **29 / 29 passed** (also run in GitHub Actions before each deploy) |
| End-to-end, local build (`npm run test:e2e`, headless Chromium via Playwright) | **18 / 18 passed** |
| End-to-end, **live site** `https://jalam1001.github.io/iching-living-oracle/` | **18 / 18 passed** |
| King Wen correctness, all 4,096 cast configurations | **4,096 / 4,096** correct primary + resulting hexagram vs independent reference |
| Line texts | **384 / 384** in the right hexagram and position |
| WCAG AA text contrast (8 pages × 3 viewports × light/dark) | **3,904 text elements, 0 failures** |
| PWA installability (Chromium `Page.getInstallabilityErrors`) | **no errors** |
| Offline after first visit | **passed** (reload, 5 routes and a full consultation with network disabled) |
| Standalone single-file HTML from `file://` with all network blocked | **passed** (full consultation + journal save, 0 errors, 0 network requests) |
| APK signature (`apksigner verify`) | **v1 + v2 verified** |
| APK downloaded from the public release link | **SHA-256 matches**, signature verifies |
| APK permissions (`aapt dump permissions`) | none requested except AndroidX's internal signature-level `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`; **no INTERNET** |
| APK install + run on Android emulator | **NOT performed — see below** |
| Further-reading links | **18 / 18 reachable** (see below) |

## 1. Correctness of the oracle (`tests/unit`)

**Independent references.** `tests/reference/kingwen_wikipedia.json` was extracted from Wikipedia's *List of hexagrams of the I Ching* (number, character, lower/upper trigram). A second reference is Legge's own text: every line statement begins "NINE" (yang) or "SIX" (yin), which gives each hexagram's six-line pattern independently. The two references agree on all 64 hexagrams. The app's database and engine are then checked against them; the tests compute expected results without using the engine's own helpers.

- All 64 database entries: number, character, trigrams and line pattern match (无/無 accepted as variant forms for 25).
- All 64 lower × upper trigram combinations in the builder.
- **All 4,096 configurations** of 6/7/8/9 × six lines: primary hexagram, resulting hexagram (none when no line changes), changing positions. All 64 hexagrams occur as both primary and resulting.
- All 384 lines: Legge label agrees with the line's yin/yang, text in source order.
- Special cases: 33 with lines 1 and 6 changing → 49; Jung's foreword examples 50 (lines 2, 3) → 35 and 29 (line 3) → 48; no changing lines; all six changing (1 → 2 and 2 → 1 with the "use of nines/sixes" texts; other hexagrams → resulting Judgment).
- Zhu Xi emphasis rule for 1, 2, 3, 4, 5 and 6 changing lines.
- Every one of the 4,096 configurations produces a complete A–G reading with no `undefined`, `NaN` or `null` in the text.

**Probabilities.**
- Exact enumeration: the 8 equally likely coin tosses give 6/7/8/9 = 1/8, 3/8, 3/8, 1/8; the 16-marble yarrow bag gives 1/16, 5/16, 7/16, 3/16.
- An independent simulation of the traditional 49-stalk procedure (200,000 lines) agrees with the yarrow model within 1.5 percentage points.
- With the real Web Crypto generator: 400,000 coin lines → 6: 0.1253, 7: 0.3763, 8: 0.3740, 9: 0.1245 (χ² = 3.95, df 3); 400,000 yarrow lines → 0.0627, 0.3124, 0.4380, 0.1869 (χ² = 1.17); 192,000 hexagrams uniform over 64 (χ² = 70.1, df 63; critical value at p = 0.001 is 103.4). Exact values vary per run; all runs so far passed.
- Rejection sampling: a biased value is discarded and a new one drawn.
- Coin faces always add up to the line value and show the right number of plain (yang) faces.

**Content.** 64 hexagrams × every field filled, 384 lines, 8 trigrams; no placeholders/TODO; plain-English line texts differ from Legge and have a mean Flesch reading ease of 71.1 (plain English); all names unique; context detection (work, family, relationships, money, health); health and money readings include a "consult a professional" note; no certainty language ("you will die", "guaranteed").

## 2. Real-browser tests (`tests/e2e/run-e2e.mjs`)

Headless Chromium (Playwright 1.65), Pixel 7 phone profile for the functional flow, 1280×800 desktop for PWA checks. Run against the local build and again against the live GitHub Pages site; both 18/18.

1. Home loads with no console errors (live site: app ready in 418 ms, DOMContentLoaded 292 ms; local: 170 ms).
2. Launch / Install App / Download APK / View Source controls present with correct links; Install App shows per-browser instructions when the browser offers no install prompt; Launch opens the consultation.
3. Full **coin** consultation: after each of the six casts the three coins displayed (plain/inscribed) and their labels match the cast value; the reading's primary and resulting hexagrams match the independent reference; sections A–G present (D only when lines change); the career context is applied to a work question.
4. Full **yarrow** consultation: the highlighted marble equals each cast value; same reading checks.
5. Journal: save with notes → survives reload → add "what happened afterwards" → survives reload.
6. Journal: search, export TXT and JSON (contents checked), delete all, import the JSON back, delete one entry.
7. Encyclopedia: 64 in grid, search by theme ("fire" → 15), number, pinyin with accents; list view; hexagram 49 page with all six lines.
8. Transformation explorer: flipping line 1 of Hexagram 1 gives 44.
9. Trigram builder: Lake over Fire = 49, Fire over Lake = 38.
10. How to Use demo builds 33 → 49.
11. 18 routes (including all special readings and an unknown route) render a heading with no errors.
12. Jung page links reproduce his two consultations (50 → 35, 29 → 48).
13. Accessibility basics: every visible control has an accessible name; Tab moves focus.
14. Manifest fields, 4 icons with the declared pixel sizes, 2 screenshots.
15. Installability: Chromium reports no installability errors and no manifest errors.
16. Offline: with the network disabled after one visit, the app reloads, 5 sections open and a full consultation works.
17. 48 screenshots: phone (Pixel 7), tablet (820×1180) and desktop (1440×900), light and dark, 8 screens each. A selection is in `docs/screenshots/`.
18. WCAG 2.1 AA contrast audit of every visible text element on those 48 screens (4.5:1, or 3:1 for large text): 0 failures. The audit uses each element's solid background colour; text over images is skipped and parent opacity is not modelled.

## 3. Android APK

- Built with Capacitor 7 / Gradle (`assembleRelease`), compileSdk/targetSdk 35, minSdk 23.
- `apksigner verify`: verified with v1 and v2 schemes, one signer, RSA 4096, certificate SHA-256 `eaae9a0ac59a2c3b1bdd1b4bd582db519cb0bc68d647cb5b12c2c477b6e5d10b`.
- `aapt dump badging`: package `io.github.jalam1001.ichingoracle`, versionName `0.1-rc1`, label "I Ching", launchable activity present.
- Permissions: no INTERNET or any user-facing permission.
- APK SHA-256 `3f480b326ed5bc65f3000571d5da3b36f1d1c4c8eefc88643e2f6a22b6f060d5`; the file downloaded from the public release URL matched this hash and verified.
- The same `www/` code that passed the browser tests is packaged in the APK.

### Not tested on Android
The APK was **not installed or run** on any emulator or device. The build machine is a cloud container; the Android emulator (API 34 x86_64 image) could not start: with KVM the host kernel raised a KVM bug (`kernel BUG at arch/x86/kvm/x86.c`) while creating the virtual CPU and the emulator never booted, and software emulation could not start either. Install and launch on a real phone or a local emulator is therefore still to be done before calling this release final. That's why the APK is published as a *release candidate*.

## 4. Further-reading links
Checked on 26 Nov 2026: 13 returned HTTP 200 directly; Wikipedia pages that rate-limited the first burst (429) returned 200 on retry; sacred-texts.com returned 200 to a normal browser request; the three Princeton University Press pages block scripted requests (403) but were opened and confirmed (correct book, ISBN) with a web fetch.

## 5. Problems found and fixed during testing
- **King Wen lookup table transposed** — only 8 of 64 hexagrams were right; caught by the independent-reference test and fixed.
- Coin inscriptions in the wrong order (寶 and 通 swapped).
- Jung example links used the wrong line codes.
- Two reference URLs were dead (replaced with working ones).
- Service worker caused one extra page reload on the very first visit.
- WCAG failures: the small captions on the Install App and Download APK buttons inherited a muted colour (2.8:1 and 1.1:1); the gold heading on the jade reading panel was 4.3:1. All fixed (now ≥ 4.5:1).
- Desktop layout: the main area showed a focus outline after navigation; tiles left a gap on wide screens.
- Reading text: "2 lines are changing" → "Two lines are changing"; family questions now detected before relationship ones; the key unchanging line is named in 4/5-change readings.

## Reproduce
```bash
npm install && npx playwright install chromium
npm test
npm run test:e2e                                   # local build
BASE_URL=https://jalam1001.github.io/iching-living-oracle/ npm run test:e2e   # live site
```

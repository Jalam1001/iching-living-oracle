# Changelog

## v0.1-rc2 — Android APK, and website update (2026-11-26)

### Changed
- The app now opens on the Learn screen (web, installed PWA and Android), with the Learn tab highlighted.
- New headline **"Glimpse Your Future Ahead"** with the tagline *"3,000 years of wisdom, one question away"*, also used in the page title, description and PWA manifest.
- A large **Consult the Oracle** card at the top of the entry screen keeps casting one tap away. Today's contemplation and the Install / Download APK / View Source buttons moved onto the same screen.
- Installed PWAs now start on the entry screen (`start_url` `./`); service-worker cache bumped to `v0.1-r3` so installed copies update.
- Website's Download APK button now points to v0.1-rc2 (versionCode 2, signed with the same key as rc1, so it installs over rc1).

## v0.1 — website / PWA (2026-11-26)
## v0.1-rc1 — Android APK release candidate (2026-11-26)

First public release. One shared codebase for the website, the installable PWA and the Android app.

### Added
- Consultation flow: question, three-coin or yarrow-stalk method, animated six-line cast, plain-English reading in seven sections (A–G).
- Correct probabilities: coins 1/8, 3/8, 3/8, 1/8 and yarrow 1/16, 5/16, 7/16, 3/16 for 6, 7, 8, 9; Web Crypto randomness with rejection sampling.
- All 64 hexagrams and 384 line texts (Legge 1882, public domain) plus original plain-English interpretations.
- Changing-line convention of Zhu Xi (1186) for 0–6 changing lines, including the special texts of Hexagrams 1 and 2.
- 64-hexagram encyclopedia (grid, list, search, transformation explorer), Eight Trigrams builder, journal (IndexedDB; notes, observations, search, TXT/JSON export, import, delete), How to Use with interactive demo, History, Jung & Synchronicity, Further Reading.
- PWA: manifest, service worker, offline support, Install App button with per-browser instructions.
- Android app (Capacitor 7): local assets, no permissions, signed APK.
- Single-file standalone HTML version.
- Unit tests (exhaustive 4,096-configuration check against independent references) and Playwright end-to-end tests.

### Fixed during development
- King Wen lookup matrix was transposed (only 8 of 64 hexagrams correct); caught by the independent reference test and fixed.
- Coin inscription order, Jung example line codes, two bad reference URLs, a first-visit service-worker reload, WCAG contrast failures on two buttons and one label.

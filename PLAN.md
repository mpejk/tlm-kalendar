# PLAN

Tick items as they finish. Each run: read this and RUNLOG.md, continue at the first unticked item.
Environment: Node/npm live in `tools.nosync/bin` — run `export PATH="$PWD/tools.nosync/bin:$PATH" NODE_OPTIONS=--use-system-ca` first (Node needs the system CA store for TLS here).
DO data: sparse clone in data/raw/do/repo (git-ignored; re-clone with the command in DECISIONS.md). Missale Meum source for reading: data/raw/mm/repo (git-ignored).

## 0. Setup
- [x] Node 24 + npm installed locally from the npm registry (tools.nosync/)
- [x] git init, .gitignore, package.json (TypeScript, Vitest, Playwright)

## 1. Harvest
- [x] Fetch year pages 2017, 2018, 2019 to data/raw/
- [x] Fetch all Mass pages (propers) and rite pages (actions) for 2017, 2018; probe 2019
- [x] Parse year pages -> data/golden/calendar.json (encoding repaired)
- [x] Parse Mass/rite pages -> data/golden/masses/*.json (ordered sections, both languages)
- [x] Overlap check Dec 2017 / Dec 2018
- [ ] Translation memory data/tm/tm.json + conflicts report (TM-CONFLICTS.md)

## 2. Calendar engine (general)
- [ ] Fetch + OCR the 1962 rubrics PDF to data/rubrics/
- [ ] Fetch Divinum Officium data files (missa Latin, Kalendaria, Tabulae) to data/raw/do/
- [ ] Engine: temporal cycle, sanctoral, precedence (n. 91), commemorations (nn. 106-114), transfers, vigils, octaves, ember/rogation, added orations
- [ ] Test: reproduces every old-site row 27 Nov 2016 - 31 Dec 2019 (DIFFS.md for exceptions)
- [ ] Fetch Missale Meum calendar 2026-2036; test agreement (differences explained)
- [ ] Named edge-date tests with rubric citations

## 3. Latin corpus and assembler
- [ ] Import script DO -> data/corpus/la (each text once)
- [ ] Assembler: day -> ordered Mass (sections, commemorations, preface, Gloria/Credo lines)
- [ ] Test: reproduces every harvested Mass page section by section (Latin)

## 4. Croatian
- [ ] TM lookup for every Latin unit; coverage report
- [ ] Kniewald 1942 (then 1930) for misses, corrected against page images; record source
- [ ] GAPS.md for the rest
- [ ] KNIEWALD-CHECK.md; `croatianPrimary` setting
- [ ] TYPOS.md

## 5. Zagreb layer
- [ ] Re-read HBK page; search for pre-conciliar Zagreb proper
- [ ] data/local/zagreb.yaml with sources; Mass choices; engine integration; "mjesni kalendar" tag

## 6. Site
- [ ] Build pipeline: per-year calendar files + per-formulary files as classic scripts into dist/
- [ ] Day view, tabs, language modes, navigation, date picker, month grid, year list, search
- [ ] Typography, themes, font size, self-hosted fonts, print leaflet, .ics, offline (service worker)

## 7. Verification
- [ ] Calendar vs old site (100% or DIFFS.md)
- [ ] Texts vs old site (100% or listed)
- [ ] Calendar vs Missale Meum 2026-2036
- [ ] Edge dates + fresh-subagent derivation reconciled
- [ ] Coverage report (Latin complete; Croatian by source)
- [ ] Whole-site crawl file:// and http, both calendars
- [ ] Screenshots 40 days x 390/1280 x light/dark reviewed; 5 PDFs checked
- [ ] Lighthouse >= 90, axe clean, offline works

## 8. Publish and report
- [ ] GitHub repo tlm-kalendar, Pages via Actions (dist only), live URL + deep link verified, `npm run deploy`
- [ ] REPORT.md with final audit; DONE

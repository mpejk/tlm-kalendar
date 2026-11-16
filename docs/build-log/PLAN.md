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
- [x] Translation memory data/tm/tm.json + conflicts report (TM-CONFLICTS.md)

## 2. Calendar engine (general)
- [x] Fetch + OCR the 1962 rubrics PDF to data/rubrics/
- [x] Fetch Divinum Officium data files (missa Latin, Kalendaria, Tabulae) to data/raw/do/
- [x] Engine: temporal cycle, sanctoral, precedence (n. 91), commemorations (nn. 106-114), transfers, vigils, octaves, ember/rogation, added orations
- [x] Test: reproduces every old-site row 27 Nov 2016 - 31 Dec 2019 (DIFFS.md for exceptions)
- [x] Fetch Missale Meum calendar 2026-2036; test agreement (differences explained)
- [x] Named edge-date tests with rubric citations (+ fresh-subagent derivation reconciled, EDGE-DERIVATION.md)

## 3. Latin corpus and assembler
- [x] Import script DO -> data/corpus/la (each text once) — `npx tsx scripts/import/import-do.ts`; DO snapshot 326bc4a (Feb 2025); overrides in data/corpus/overrides.yaml
- [x] Assembler: day -> ordered Mass (sections, commemorations, preface, Gloria/Credo lines)
- [x] Test: reproduces every harvested Mass page section by section (Latin) — tests/oldsite-texts.test.ts, exceptions in data/verify/text-exceptions.yaml
- [x] Rites: palms, Good Friday, Mandatum taken whole from the old site's pages (scripts/build/rites.ts); Candlemas, ashes, Easter Vigil from DO [Prelude] (Latin only so far — Croatian: Kniewald / GAPS)

## 4. Croatian
- [x] Block memory (data/tm/blocks.json, `npx tsx scripts/croatian/build-blocks.ts`) + resolver (scripts/croatian/resolve.ts: exact / typo / variant / manual) + coverage (`npx tsx scripts/croatian/coverage.ts` -> data/tm/missing.json, data/tm/variants.txt). 16 Nov: 2432 of 2474 distinct blocks of 2026-2036 (general calendar) have the old site's Croatian; 42 missing.
- [x] Manual map data/tm/manual.json { core: { hr, page, why } } for misses whose Croatian is on the old site under different Latin (see scripts/tmp/miss2.ts output: St Joseph the Worker postcommunion, Assumption gradual, prefaces of Our Lady with another mystery word, Passion Gospels, etc.)
- [x] Kniewald 1942 (then 1930) for misses, corrected against page images; record source
- [x] GAPS.md for the rest
- [x] KNIEWALD-CHECK.md; `croatianPrimary` setting
- [x] TYPOS.md

## 5. Zagreb layer
- [x] Re-read HBK page (data/raw/hbk/, unchanged); searched for a pre-conciliar Zagreb proper (none found online)
- [x] data/local/zagreb.yaml with sources; Mass choices; engine integration; "mjesni kalendar" tag (check with `npx tsx scripts/tmp/zg.ts <dates>`)
- [x] Named tests for the local layer (tests/zagreb.test.ts): ranks, occurrence with Sundays/Corpus Christi, commemorations; St Demetrius collect (Common C3 has the form for bishops: pick the form for non-bishops)

## 6. Site
- [x] Build pipeline: per-year calendar files + per-formulary files as classic scripts into dist/ (`npx tsx scripts/build/build.ts`: data.ts, rites.ts, ics.ts, site.ts)
- [x] Day view, tabs, language modes, navigation, date picker, month grid, year list, search (src/site/main.ts) — first version; needs the screenshot review of stage 7
- [x] Typography, themes, font size, self-hosted fonts, print leaflet, .ics, offline (service worker) — first version; print/offline still to be verified in stage 7

## 7. Verification
- [x] Calendar vs old site (100% or DIFFS.md)
- [x] Texts vs old site (100% or listed)
- [x] Calendar vs Missale Meum 2026-2036
- [x] Edge dates + fresh-subagent derivation reconciled
- [x] Coverage report (Latin complete; Croatian by source)
- [x] Whole-site crawl file:// and http, both calendars
- [x] Screenshots 40 days x 390/1280 x light/dark reviewed; 5 PDFs checked
- [x] Lighthouse >= 90, axe clean, offline works

## 8. Publish and report
- [x] GitHub repo tlm-kalendar, Pages via Actions (dist only), live URL + deep link verified, `npm run deploy`
- [x] REPORT.md with final audit; DONE

## Run 4 additions
- [x] Kniewald for Ash Wednesday (1930) and the Easter Vigil (1942) rites; Laetabitur, Salus autem, 1 Pet 1,3-7
- [x] Zagreb Masses after Kniewald 1942 (data/local/formularies.yaml, massPaschal); BLOCKED.md for the Latin of the proper prayers
- [x] Start-up race fixed (scripts/verify/startup.ts); local tag only where the layer changes the day
- [x] All 8 contact sheets and the other views reviewed; full verification rerun; published; REPORT.md; DONE

## Notes for the next run (design decisions already taken — keep them)
- Env: `export PATH="$PWD/tools.nosync/bin:$PATH" NODE_OPTIONS=--use-system-ca PLAYWRIGHT_BROWSERS_PATH="$PWD/tools.nosync/pw"` (Chromium for Playwright lives inside the project); build `npx tsx scripts/build/build.ts`; smoke `npx tsx scripts/verify/smoke.ts`; tests `npx vitest run`; zsh does not word-split and `$O:w` is a modifier, quote git revs.
- Latin: DO snapshot 326bc4a in data/raw/do/repo (detached HEAD). Re-import: `npx tsx scripts/import/import-do.ts` (applies data/corpus/overrides.yaml). Helpers: scripts/tmp/view.ts <date> [n] [section], scripts/tmp/wdiff.ts, scripts/verify/latin-vs-site.ts.
- Assembler (src/assembler/assemble.ts) returns MassView: items = notes + sections; each section has blocks; block.src = "formulary|section". Prayers are matched to Croatian per block, other sections as a whole (or composed of 2-3 parts): key = blockCore(lines) from src/assembler/norm.ts (shared with the browser).
- Plan for the site data: the build enumerates every day of 2026-2036 in both calendars, assembles each Mass, resolves Croatian per block and writes per-formulary files `dist/data/f/<id>.js` = { sections (Latin units with inline texts), variants, hr: { hash(blockCore): text }, kn: {…} } plus `dist/data/cal-<year>.js`; the browser runs the same engine + assembler (esbuild IIFE) and looks Croatian up by hashKey(blockCore(lines)) in the formulary the block came from (block.src). Rites from the old site (palms, Good Friday, Mandatum) go in as ready bilingual documents built from data/golden/masses/*/actions_*.json; Candlemas, ashes and Easter Vigil from the DO [Prelude] sections.
- Pope for 2026+: Leo XIV, 18 May (config value in generalConfig(pope)); confirm online before publishing.

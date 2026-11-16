# Report

**The calendar is live at https://mpejk.github.io/tlm-kalendar/** (example of a date link: https://mpejk.github.io/tlm-kalendar/?d=2027-03-28).
It also works straight from disk: double-click `dist/index.html`. To publish a later change: `npm run deploy`.

Source code: https://github.com/mpejk/tlm-kalendar (public). Before any command: `export PATH="$PWD/tools.nosync/bin:$PATH" NODE_OPTIONS=--use-system-ca PLAYWRIGHT_BROWSERS_PATH="$PWD/tools.nosync/pw"`.

## Verification results

| Check | Result |
| --- | --- |
| Calendar against the old site, 27 Nov 2016 – 31 Dec 2019 | 1130 of 1130 days agree (title, class, colour, commemorations, number of Masses) |
| Latin texts against the old site | 791 Mass pages, 8205 sections: 7003 identical, 1173 differ only in spelling or by an old-site typo, 29 listed exceptions (on 37 pages); 754 pages identical in every section. Causes in `DIFFS.md` |
| Croatian texts against the old site | 8974 units: 8616 identical, 351 where the old site itself has several renderings of the same Latin (the most frequent is shown), 7 on pages with a Latin exception, 0 different, 0 missing |
| Calendar against Missale Meum, 2026–2036 | 4018 days; the celebration differs on a handful of days and commemorations on more, 114 differences in 12 groups, each with its rubric in `MM-DIFFS.md`; 0 unexplained |
| Edge dates | 41 named tests, each citing its rubric; an independent derivation from the rubrics text agreed except on two points, both reconciled (`EDGE-DERIVATION.md`, `DECISIONS.md`) |
| Zagreb layer | 11 named tests |
| Latin coverage, 2026–2036, both calendars | 4337 Masses, every required section present |
| Whole-site crawl, both calendars, from `file://` and over http under a sub-path | 16,808 views, 174,384 sections: 0 console errors, 0 empty sections, 0 broken links, 0 mojibake |
| Start-up order (new) | 15 cases with one file delayed: all render |
| Screenshots | 160 (40 days × 390/1280 px × light/dark) on 8 contact sheets, all reviewed, plus month, year, search and header views; 5 days printed to PDF |
| Lighthouse, day view | mobile: performance 96, accessibility 100; desktop: 100 / 100 |
| axe | 0 serious or critical violations |
| Offline | works after one visit (711 files cached) |
| Live site | start page, three date links and the month view render (checked three times after the last deployment) |
| Size of `dist` | 15 MB |

How the crawl works, so you know its limits: every date is rendered inside a real headless browser by the site's own code, but by in-page navigation, not by a fresh page load per date. Fresh page loads are covered by the screenshots, the start-up test, the offline test and the live check.

## Found and fixed in the last run

- **The page could stay empty on a slow connection.** The application could start before its base data file had arrived. It showed up on the live site in 4 of 5 loads. Fixed, with a test that fails on the old code.
- The "mjesni kalendar" tag appeared on days the local layer did not change (Ash Wednesday 2027, Sacred Heart 2027).
- St Demetrius had the collect for martyr bishops.
- Stray `_` marks from the source data were visible in the Easter Vigil; one verse (Gen 1, 25) of its first lesson was damaged in the source and is restored from the other Divinum Officium file.

## Croatian coverage by source

Distinct text blocks of the Masses of 2026–2036 (both calendars): **6232**. From the old site **6186**; from Kniewald **41**; missing **5**.
Counting every occurrence: 49,330 blocks; old site 48,990; Kniewald 318; missing 22.

Rites: palms, Good Friday and the washing of the feet are the old site's pages. Candlemas (10 rows) and Ash Wednesday (9 rows) are from Kniewald 1930, the Easter Vigil (38 of 47 rows) from Kniewald 1942, all read against the page scans.

## `GAPS.md` (Latin alone, "hrvatski prijevod nedostaje")

- Five Mass texts that neither source has: the collect *Gregem tuum* for Sts Soter and Caius (22 April) and for St Urban (25 May), the collect and secret of St Maurice (22 September, a commemoration), the gradual of the Queenship of Our Lady (31 May).
- Nine rows of the Easter Vigil that are new in the 1955 rite (preparing the candle, the deacon's blessing, the renewal of baptismal promises, the blessing of incense).

## `BLOCKED.md`

- Kniewald 1942 prints, in Croatian only, proper prayers for St Ladislaus, St Demetrius, Bl. Marko Križevčanin, Bl. Nikola Tavelić, Bl. Augustin Kažotić, Bl. Ozana, Bl. Gracija and a whole Mass of the Holy Relics. I could not find their Latin online, so these feasts use the prayers of the Common. If you have a Zagreb *Proprium* or a 1962 Missal with the *Missae pro aliquibus locis*, the file says where to put the texts.
- No pre-conciliar Zagreb *Proprium* or *Directorium* was found online.

## Decisions you may want to reverse

All are in `DECISIONS.md`. To change a local rank or Mass, edit the entry in `data/local/zagreb.yaml` and run `npm run deploy`.

| Decision | How to change it |
| --- | --- |
| St Ladislaus (27 June) I class as principal patron; dedication of the cathedral (25 August) I class in the whole archdiocese and treated as a feast of the Lord; St Florian (4 May) II class as secondary patron (Code of Rubrics n. 43) | `class` in `zagreb.yaml` |
| Sts Cyril and Methodius II class on 7 July; Our Lady of Bistrica II class; the spomendani III class; the five neobvezatni spomendani are notes only | `class`, or move an entry between `feasts` and `notes` |
| Masses of the local feasts are Commons, chosen as Kniewald 1942 indicates: St Florian *Protexisti* with the Epistle 1 Pet 1, 3-7; St Quirinus *Protexisti* in Paschaltide, *Statuit* after it; Bl. Marko and Bl. Nikola *Laetabitur*; St Ladislaus *Os justi*; Bl. Alojzije Stepinac *Statuit*; St Leopold *Os justi*; Our Lady of Bistrica *Salve sancta parens*; the cathedral *Terribilis* | `mass` (and `massPaschal`) in `zagreb.yaml`; compositions in `data/local/formularies.yaml` |
| St Demetrius "and companions" (the HBK title): Mass *Salus autem* of several martyrs. Kniewald has him as a single martyr with the Mass *In virtute* | `mass: "Commune/C2"` and the title |
| Holy Relics (5 November): Mass *Sapientiam* of several martyrs | `mass` |
| Prayers of a Common keep "N." (Croatian "I."); no name is inserted | would need the Croatian with the name from a printed source |
| The Creed is said on 26 December (n. 475d), although the old site says not | `src/assembler/assemble.ts` |
| 2035: Annunciation on Monday 2 April, St Joseph on Tuesday 3 April (Missale Meum has the reverse) | `src/engine/engine.ts`, transfers |
| When the Transfiguration or the Lateran dedication replaces a Sunday, the saint of the day is not commemorated (as the old site did on 6 August 2017) | engine, commemorations |
| Pope's anniversary oration on 18 May (Leo XIV) on every class of day outside the Triduum | `POPE` in `scripts/build/data.ts` |
| Displayed Croatian is the old site's; Kniewald's version is stored beside it for 2508 blocks, but as uncorrected OCR | `croatianPrimary` in `data/site-config.json`; correct the OCR first |
| Latin source is the Divinum Officium state of February 2025, because the current one has broken Mass Commons | `DECISIONS.md` gives the commands |

Also worth a look: `KNIEWALD-CHECK.md` (2721 old-site blocks compared with Kniewald: 2396 agree in content, 16 flagged, 92 uncertain, 213 not found in Kniewald; the flagged ones are mostly readings whose extent changed after 1942) and `TYPOS.md` (suspected typos in the old site's Croatian and misprints in Kniewald; nothing was corrected).

## Adding years or correcting a text

- **More years:** change `YEARS` in `scripts/build/data.ts` (the engine is valid for 1961–2100), then `npm run deploy`.
- **Correct a Croatian text:** put the corrected cell in `data/tm/manual.json` (keyed like the entries there), or for a Kniewald text edit it in `data/tm/kniewald-found.json` and run `npx tsx scripts/croatian/apply-kniewald.ts`; then `npm run deploy`.
- **Correct a Latin text:** add an entry to `data/corpus/overrides.yaml`, run `npm run import`, then `npm run deploy`.
- **Fill a gap:** the last lines of `GAPS.md` say how.
- **Check before publishing:** `npm test`, `npx tsx scripts/verify/crawl.ts file 2026 2036`, `npx tsx scripts/verify/startup.ts`.

## Final audit against the brief

| Requirement | Evidence |
| --- | --- |
| Static site, any date 2026–2036, Latin and Croatian side by side | live URL; crawl of 4018 dates × 2 calendars |
| 1962 Missal, 1960 rubrics; Zagreb default, general calendar selectable | `src/engine`, tests; "opći kalendar" link and `?k=opci` |
| Croatian from the old site, then Kniewald, else the gap note | coverage above; `GAPS.md` |
| Only the Proper, the two Gloria/Credo lines, Gloria and Credo behind an expander | day view (screenshots) |
| No backend, accounts, cookies, tracking | `dist` is plain files; preferences in local storage only |
| Engine 1961–2100, published 2026–2036 | `YEARS`; old-site test runs 2016–2019 |
| Never asked, never waited; state on disk | `PLAN.md`, `RUNLOG.md`, commits |
| No liturgical text from memory or translated | every text traces to the old site, Divinum Officium or a Kniewald page (`ref` on each Kniewald entry, all read on the scan) |
| Authorized hosts only | fetches went to tradicionalnamisa.com, archive.org, maternalheart.org, hbk.hr, github.com, raw.githubusercontent.com, missalemeum.com, the npm registry |
| Stage 1 harvest, fixtures, translation memory, overlap, conflicts | `data/raw/site`, `data/golden`, `data/tm`, `TM-CONFLICTS.md`; 59 overlapping days agree |
| 2019 Mass pages probed | 404; calendar oracle only (`DECISIONS.md`) |
| Stage 2 engine | 1130/1130; `MM-DIFFS.md` |
| Stage 3 corpus and assembler, import script kept | `npm run import`; `DIFFS.md` |
| Stage 4 Croatian, Kniewald check, `croatianPrimary`, `TYPOS.md` | `KNIEWALD-CHECK.md`, `data/site-config.json`, `TYPOS.md` |
| Stage 5 Zagreb layer: HBK re-read, ranks, dates, proper search, tag, general version one tap away | `data/local/zagreb.yaml`, `data/raw/hbk`, tests; tag and link in the day header |
| Rubrics list and named dates | `tests/edge-dates.test.ts` (41) |
| Site: today (Europe/Zagreb), next Sunday, day view, phone language choice, tabs, previous/next, date picker, month grid, year table, search | screenshots and `data/verify/shots/view-*.png` |
| Serif, red rubrics, ℣ ℟ ✠, font size, light/dark, offline | screenshots; `quality.json` |
| Print leaflet A4/A5 | 5 PDFs in `data/verify/pdf` |
| `.ics` per year | `dist/ics` (both calendars), link in the year view |
| Croatian interface, UTF-8, self-hosted fonts, `lang` attributes | crawl (diacritics, no mojibake); `dist/fonts` |
| Four layers; one file per year and per formulary; under 50 MB | `src/engine`, `data/corpus`, `src/assembler`, `src/site`; 733 files, 15 MB |
| Works from `file://`, any host, a sub-path; script tags, classic scripts; date links | crawl in both modes; live deep links |
| Published with Pages through Actions, `dist` only; `npm run deploy` | `.github/workflows/pages.yml`; live check |
| Verification list | table at the top |
| No background process left | servers start and stop inside each test command |

# Report

**The calendar is live at https://mpejk.github.io/tlm-kalendar/** (example of a date link: https://mpejk.github.io/tlm-kalendar/?d=2027-03-28).
It also works straight from disk: double-click `dist/index.html`. To publish a later change: `npm run deploy`.

Source code: https://github.com/mpejk/tlm-kalendar (public). `README.md` (Croatian) explains how to maintain it; `ODGOVOR-NA-PROVJERU.md` answers the review of November 2026 finding by finding.

Setup on any computer: install Node.js 20 or newer and git, then in the project folder `npm install` and `npx playwright install chromium webkit`. (On the Mac where this was built, Node sits inside the project: `export PATH="$PWD/tools.nosync/bin:$PATH" NODE_OPTIONS=--use-system-ca PLAYWRIGHT_BROWSERS_PATH="$PWD/tools.nosync/pw"` first.)

## The review of November 2026

All 26 findings were checked against the 1962 Missal (page images) and the Code of Rubrics and found right; all are corrected except where a Croatian text would have to be newly translated. In short:

- **Calendar:** the Mass of the Easter Vigil is complete; the Rogation Mass on a Sunday has the Creed and is not offered on days of I class; the prayer for the Pope follows nn. 449–450 (19 May in 2034); a second commemoration of Our Lady is omitted.
- **Texts:** 45 corrections of the Latin of the Masses against the Missal and 12 in the rites, 33 of the Croatian (wrong translation beside a prayer, typos, Scripture references), Alleluias by the rubrics in both languages, saints' and the Pope's names in place of "N." / "I.".
- **Site:** fonts that cannot draw u as v on iPhones, keyboard use of the tabs, narrow screens with large type, malformed links.
- **Still needs a person:** 15 texts without Croatian (`ZA-PRIJEVOD.md` says exactly where to type each), a look at the inserted names (list in `ODGOVOR-NA-PROVJERU.md`), a check on a real iPhone.

## Verification results

| Check | Result |
| --- | --- |
| Unit and data tests (`npm test`) | 131 tests pass, among them 71 written for the review |
| Calendar against the old site, 27 Nov 2016 – 31 Dec 2019 | 1130 days: 1129 agree; 1 listed exception (25 April 2019, Rogation Mass on a I class day, Code of Rubrics n. 341) |
| Latin texts against the old site | 791 Mass pages, 8205 sections: 7045 identical, 1128 differ only in spelling or by an old-site typo, 32 listed exceptions (17 causes, in `DIFFS.md`); 752 pages identical in every section |
| Croatian against the old site (before the corrections listed in `TYPOS.md`) | 8974 units: 8620 identical, 347 where the old site has several renderings of the same Latin, 7 on pages with a Latin exception, 0 different, 0 missing |
| Calendar against Missale Meum, 2026–2036 | 4018 days; every difference explained with its rubric in `MM-DIFFS.md`; 0 unexplained |
| Edge dates | 41 named tests, each citing its rubric |
| Whole-site crawl, both calendars, from `file://` and over http under a sub-path | 16,808 views, 173,952 sections: 0 console errors, 0 empty sections, 0 broken links, 0 mojibake |
| Start-up order | 15 cases with one file delayed: all render |
| Browser checks (`npm run verify:site`), Chromium and WebKit | links 22 cases, keyboard 30 checks, layout 140 cases at 340 px and 100/130/160 % type, fonts shaped and rendered: 0 failures. Firefox does not start on this Mac (`BLOCKED.md`) |
| Live site | start page and 8 deep links show the corrected state (`scripts/verify/live-review.ts`) |
| Size of `dist` | 14 MB, 736 files |

Lighthouse, axe, offline and print were measured before the review (performance 96, accessibility 100; 0 serious axe violations; offline after one visit); axe and offline were rerun after the site changes with the same result.

## Croatian coverage by source

Distinct text blocks of the Masses of 2026–2036 (both calendars): **6241**. From the old site **6193**; from Kniewald **45**; missing **3**.
Counting every occurrence: 49,301 blocks; old site 48,998; Kniewald 292; missing 11.

Rites: palms, Good Friday and the washing of the feet are the old site's pages. Candlemas and Ash Wednesday are from Kniewald 1930, the Easter Vigil with its Mass from Kniewald 1942, all read against the page scans. 12 rows of the Vigil (new in 1955) have no Croatian.

## `ZA-PRIJEVOD.md` and `GAPS.md` (Latin alone, "hrvatski prijevod nedostaje")

- Three Mass texts: the collect and secret of St Maurice (22 September, a commemoration) and the gradual of the Queenship of Our Lady outside Paschaltide (31 May).
- Twelve rows of the Easter Vigil: preparing the candle (3), the deacon's blessing, the last paragraph of the Exsultet, the renewal of baptismal promises (4), the blessing of incense, Psalm 150 and the Benedictus at Lauds.

Both files are written by the build, so they are always current.

## `BLOCKED.md`

- Kniewald 1942 prints, in Croatian only, proper prayers for several Zagreb feasts and a whole Mass of the Holy Relics; their Latin was not found online, so these feasts use the prayers of the Common.
- No pre-conciliar Zagreb *Proprium* or *Directorium* was found online.
- Firefox could not be run here; nothing was tested on a physical iPhone.

## Decisions you may want to reverse

All are in `DECISIONS.md`. To change a local rank or Mass, edit the entry in `data/local/zagreb.yaml` and run `npm run deploy`.

| Decision | How to change it |
| --- | --- |
| St Ladislaus (27 June) I class as principal patron; dedication of the cathedral (25 August) I class in the whole archdiocese and treated as a feast of the Lord; St Florian (4 May) II class as secondary patron (Code of Rubrics n. 43) | `class` in `zagreb.yaml` |
| Sts Cyril and Methodius II class on 7 July; Our Lady of Bistrica II class; the spomendani III class; the five neobvezatni spomendani are notes only | `class`, or move an entry between `feasts` and `notes` |
| Masses of the local feasts are Commons, chosen as Kniewald 1942 indicates: St Florian *Protexisti* with the Epistle 1 Pet 1, 3-7; St Quirinus *Protexisti* in Paschaltide, *Statuit* after it; Bl. Marko and Bl. Nikola *Laetabitur*; St Ladislaus *Os justi*; Bl. Alojzije Stepinac *Statuit*; St Leopold *Os justi*; Our Lady of Bistrica *Salve sancta parens*; the cathedral *Terribilis* | `mass` (and `massPaschal`) in `zagreb.yaml`; compositions in `data/local/formularies.yaml` |
| St Demetrius "and companions" (the HBK title): Mass *Salus autem* of several martyrs. Kniewald has him as a single martyr with the Mass *In virtute* | `mass: "Commune/C2"` and the title |
| Holy Relics (5 November): Mass *Sapientiam* of several martyrs | `mass` |
| Names are put in place of "N." / "I." in prayers of a Common (review, Nov 2026) | `data/calendar/names.yaml`: remove or change an entry |
| The Creed is said on 26 December (n. 475d), although the old site says not | `src/assembler/assemble.ts` |
| 2035: Annunciation on Monday 2 April, St Joseph on Tuesday 3 April (Missale Meum has the reverse) | `src/engine/engine.ts`, transfers |
| When the Transfiguration or the Lateran dedication replaces a Sunday, the saint of the day is not commemorated (as the old site did on 6 August 2017) | engine, commemorations |
| Prayer for the Pope on 18 May (Leo XIV); impeded and transferred by Code of Rubrics nn. 449–450 (2034: 19 May) | `POPE` in `scripts/build/data.ts`, name forms in `data/calendar/names.yaml` |
| Displayed Croatian is the old site's; Kniewald's version is stored beside it for 2508 blocks, but as uncorrected OCR | `croatianPrimary` in `data/site-config.json`; correct the OCR first |
| Latin source is the Divinum Officium state of February 2025, because the current one has broken Mass Commons | `DECISIONS.md` gives the commands |

Also worth a look: `KNIEWALD-CHECK.md` (2721 old-site blocks compared with Kniewald: 2396 agree in content, 16 flagged, 92 uncertain, 213 not found in Kniewald; the flagged ones are mostly readings whose extent changed after 1942) and `TYPOS.md` (suspected typos in the old site's Croatian and misprints in Kniewald; the obvious ones are corrected and listed there with the original reading).

## Adding years or correcting a text

`README.md` has these as step-by-step recipes in Croatian. In short:

- **More years:** change `YEARS` in `scripts/build/data.ts` (the engine is valid for 1961–2100), then `npm run deploy`.
- **Correct a Croatian text:** add an entry to `data/tm/corrections.yaml`; **a Latin text:** `data/corpus/patches.yaml`; **a row of a rite:** `data/tm/rites-hr.yaml`; then `npm run deploy`.
- **Supply a missing translation:** `ZA-PRIJEVOD.md` gives the file and the key for each.
- **Check before publishing:** `npm test`, `npx tsx scripts/verify/crawl.ts file 2026 2036`, `npx tsx scripts/verify/startup.ts`, `npm run verify:site`.

## Final audit against the brief

| Requirement | Evidence |
| --- | --- |
| Static site, any date 2026–2036, Latin and Croatian side by side | live URL; crawl of 4018 dates × 2 calendars |
| 1962 Missal, 1960 rubrics; Zagreb default, general calendar selectable | `src/engine`, tests; "opći kalendar" link and `?k=opci` |
| Croatian from the old site, then Kniewald, else the gap note | coverage above; `GAPS.md` |
| Only the Proper, the two Gloria/Credo lines, Gloria and Credo behind an expander | day view (screenshots) |
| No backend, accounts, cookies, tracking | `dist` is plain files; preferences in local storage only |
| Engine 1961–2100, published 2026–2036 | `YEARS`; old-site test runs 2016–2019 |
| Never asked, never waited; state on disk | `docs/build-log/PLAN.md`, `docs/build-log/RUNLOG.md`, commits |
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

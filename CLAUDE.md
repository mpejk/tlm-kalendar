# Zagreb Traditional Latin Mass calendar — maintenance brief

A static website that shows, for every day from 2026 to 2036, the liturgical day for Zagreb under the 1962 Roman Missal (1960 Code of Rubrics) and the Proper of the Mass in Latin and Croatian side by side. Live at https://mpejk.github.io/tlm-kalendar/. It continues the calendar of tradicionalnamisa.com; the maintainer is not expected to read code. `README.md` (Croatian) is the guide for people; this file is for you.

## Rules that must keep holding

1. **No liturgical text from memory, and no translations of your own**, in Latin or Croatian. Every text on the site traces to a named source: Divinum Officium data and the Missale Romanum 1962 for Latin; the old site's Mass pages and Kniewald's *Rimski misal* (1942, 1930) for Croatian. Interface wording is the only text written here.
2. **Where no Croatian exists, show the Latin alone** with "hrvatski prijevod nedostaje". The build lists such texts in `ZA-PRIJEVOD.md` with the file and key where a person can supply them. Mechanical changes are allowed (adding or removing Aleluja, trimming to the extent of the Latin, an obvious typo, a Scripture reference, inserting a saint's name); a new sentence is not.
3. **Corrections are data with a source.** Latin: `data/corpus/patches.yaml` (cite the Missal page). Croatian: `data/tm/corrections.yaml`. Rites: `data/tm/rites-hr.yaml`. Names: `data/calendar/names.yaml`. Do not edit `data/corpus/la/*.json`, `data/tm/*.json` or `dist/` by hand.
4. **Rubrics decide.** Implement from the Code of Rubrics (`data/rubrics/1962rubrics.txt`), cite paragraph numbers in code and tests, and when the old site or Missale Meum disagrees, list the difference with its rubric (`DIFFS.md`, `MM-DIFFS.md`) rather than follow them.
5. **Tests and crawl pass before publishing**: `npm run check` (= `npm test`, `npm run crawl`, `npm run verify:site`). Every correction gets a test that fails without it. `npm test` builds `dist` first because the text tests read the built data as the browser does.
6. **Decisions go into `DECISIONS.md`** with the reason; things that could not be done into `BLOCKED.md`; every corrected typo into `TYPOS.md` (generated: `npx tsx scripts/verify/typos.ts`).
7. **The site stays static and self-contained**: no backend, cookies or tracking; classic scripts and script-tag data so that `dist/index.html` works from `file://`, from any host and under any sub-path; one file per year and per Mass formulary.
8. Publishing (`npm run deploy`) pushes to GitHub and is outward-facing: do it only when asked.

## Where things are

- `src/engine/` calendar engine (no text): `engine.ts` occurrence, commemorations, transfers; `temporal.ts` the temporal cycle. Pure function from date and configuration to the day.
- `src/assembler/` day + corpus → ordered Mass (sections, commemorations, preface, Gloria/Credo, Alleluia rules, names). Runs in the build and in the browser.
- `src/site/` the single-page site (`main.ts`, `style.css`, `index.html`, fonts).
- `scripts/build/` build of `dist` (`data.ts` holds `YEARS` and `POPE`; `rites.ts` the rites; `za-prijevod.ts` the gap lists).
- `scripts/croatian/` Croatian lookup (`resolve.ts`), corrections, Alleluia agreement, names.
- `scripts/verify/` crawl, start-up, browser checks, snapshot/diff of everything the site shows (`snapshot.ts`), censuses used in the review.
- `scripts/import/` one-off imports from Divinum Officium (need the pinned clone, see `DECISIONS.md`); not needed for maintenance.
- `data/` calendar tables, corpus, translation memory, harvested old-site pages (`data/golden`), verification results.
- `tests/` Vitest: old-site and Missale Meum oracles, edge dates, Zagreb layer, the review (`review.test.ts`, `review-texts.test.ts`).
- `src/igra/`, `scripts/igra/`, `data/igra/` the children's game "Nedjeljni izazov" (`dist/igra`, built by `npm run build`): rounds are generated from the calendar's built data; its own content (vesting order, answers, parts of the Mass, dictionary meanings, Gospel blanks) is sourced data in `data/igra/*.yaml`, under the same rules as above.
- Game checks: `npm run verify:igra` (in `npm run check`) and `npm run play:igra` (play-through by touch, about 10 minutes, after changes in `src/igra`); decisions in `DECISIONS.md` under the game's heading.
- `docs/ORIGINAL-BRIEF.md` the brief the calendar was first built from (its "How this runs" and DONE logic no longer apply); `docs/build-log/` the log of that run.

## Useful when checking a text

- What the site shows for a day: `npx tsx scripts/verify/snapshot.ts save now` then `npx tsx scripts/verify/snapshot.ts show now 'opci|2027-08-15|0' Graduale` (calendar | date | Mass index).
- What a change touched: save a snapshot before and after, then `npx tsx scripts/verify/snapshot.ts diff before after`.
- The Missal scan is not in the repository; `DECISIONS.md` says where it came from. Read the page image, not only its OCR.

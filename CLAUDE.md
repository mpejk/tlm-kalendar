# Zagreb Traditional Latin Mass calendar and daily missal

This file is the whole job. It is loaded at the start of every run. Do not edit it.

## The job

Build a static website that, for any date from 1 January 2026 to 31 December 2036, shows the liturgical day for Zagreb under the 1962 Roman Missal and the full variable texts of that day's Mass in Latin and Croatian, side by side. It continues the old calendar at tradicionalnamisa.com/kalendar, which stopped at 2019.

It is for Marko's own use, and he will share the link with other people. He is not a liturgist or a developer.

## How this runs

A script starts you non-interactively, again and again, until a file named `DONE` or `STOP` exists in this folder. Nobody is watching. Marko is asleep and will next look when the calendar is finished.

- Never ask a question and never wait for an answer. Decide by the rules in this file. Where none applies, do what the old site did. If that does not settle it, take the option best supported by the rubrics and record it with the reason in `DECISIONS.md`.
- At the start of every run, read `PLAN.md` and `RUNLOG.md` if they exist and continue from the first unfinished item. If they do not exist, this is the first run: write `PLAN.md` as a checklist of the stages below.
- Keep state on disk. Tick `PLAN.md` as you go, commit after each completed item, and append one line to `RUNLOG.md` when a run starts and when it ends: the time, what was finished, what is next.
- Work for as long as you can in each run. There is nobody to report to until the job is done, and every early stop costs time.
- If an action is denied, do not retry it. Take another route. If there is none, note it in `BLOCKED.md` and carry on with everything that does not depend on it.
- Run commands in the foreground and keep each one under ten minutes. Split long jobs into batches that save their progress. Leave no server or other background process running when a run ends.
- If a tool you need is missing (Node.js, git, a browser for testing), install it with the platform's package manager. If that is impossible, use an equivalent that is available and record the substitution in `DECISIONS.md`. Never drop a verification silently.
- Create `DONE` only when the final audit passes, and put the link or path to the finished calendar in it. If three runs in a row make no progress for the same cause, write that cause into a file named `STOP` instead.
- Never write a liturgical text from memory in either language, and never translate one yourself. Every liturgical text on the site comes from a source named below. Interface wording is yours to write, in Croatian.

## What Marko has authorized

Marko owns this machine and this account. For this project he authorizes: read-only HTTP requests to tradicionalnamisa.com, archive.org, maternalheart.org, hbk.hr, github.com, raw.githubusercontent.com, missalemeum.com and the npm registry; installing the npm dependencies declared in this project's `package.json` and the Playwright Chromium browser; initialising a git repository in this folder and committing to it; and, only if the GitHub CLI is already signed in, creating a public GitHub repository named `tlm-kalendar` under the signed-in account, adding it as the remote `origin`, pushing the `main` branch to it, and enabling GitHub Pages for it with a GitHub Actions workflow that publishes only the `dist` folder. Nothing else: no other repositories, no credentials or secrets, no files outside this folder.

## Fixed decisions

- 1962 Missal with the 1960 Code of Rubrics.
- The default calendar is Zagreb: the general Roman calendar plus the local layer described below. The general calendar on its own is selectable.
- Croatian texts come from the old site's Mass pages. Where the old site has no Croatian for a text, take it from Kniewald's *Rimski misal*. Where neither has it, show the Latin alone with the note "hrvatski prijevod nedostaje" and list it in `GAPS.md`.
- Only the Proper is shown, plus the two lines the old site prints ("Na ovoj misi govori se Gloria", "Na ovoj misi NE govori se Nicejsko-carigradsko vjerovanje"). Gloria and Credo text may sit behind an expander, since the old pages contain them in both languages.
- Static site: no backend, accounts, cookies or tracking.
- The engine is valid for 1961–2100; the published range is 2026–2036.

## Sources (all checked on 16 November 2026)

**1. Old site: calendar and Mass texts.** This is the model, the Croatian corpus and the test oracle.

- Year pages: `https://tradicionalnamisa.com/kalendar/2017/2017.html` (27 Nov 2016 – 31 Dec 2017), `.../2018/2018.html` (3 Dec 2017 – 31 Dec 2018), `.../2019/2019.html` (2 Dec 2018 – 31 Dec 2019). Each row: date as `4.XII.2017.`, weekday (NED PON UTO SRI ČET PET SUB), class I–IV, title (capitals for I class), commemorations worded "spomen na tihim misama", "spomen i na tihim i na pjevanim misama", "spomen pod istim završetkom na svim misama", and one link per Mass.
- Mass pages for 2017 and 2018 work: `https://tradicionalnamisa.com/kalendar/2018/propers/04122017_0.html`, pattern `/kalendar/<year>/propers/DDMMYYYY_N.html`, N = 0, 1, 2 on days with several Masses (Christmas, All Souls, Ember Saturdays, Rogation days, Holy Thursday, Palm Sunday). Rites outside Mass are under `/kalendar/<year>/actions/DDMMYYYY_0.html` (blessing of palms, Good Friday). Holy Saturday has no page.
- On the 2019 year page the links point to `localhost:8080/catcal/propers.jsp?d=DDMMYYYY&m=N` and the page encoding is broken. Try the 2017/2018 URL pattern under `/kalendar/2019/` in case the files exist. If they do not, 2019 serves as a calendar oracle only.
- Anatomy of a Mass page: weekday and date; title; "Blagdan III. razreda"; commemoration lines; then one two-column table per section, Latin left and Croatian right, each headed in both languages (Antíphona ad intróitum / Ulazna pjesma, Orátio / Molitva, Epístola / Poslanica, Graduále + Allelúia / Gradual + Aleluja, Evangélium / Evanđelje, Antíphona ad offertórium / Prikazna pjesma, Secréta / Prikazna molitva, Praefátio … / Predslovlje …, Antíphona ad communiónem / Pričesna pjesma, Postcommúnio / Popričesna). Scripture references open each block. Commemoration prayers sit inside the Oratio, Secreta and Postcommunio blocks, each labelled with its commemoration type. The preface is printed in full. Reuse these labels.
- The pages state that they show the general Roman calendar without local saints.
- Fetch about one page per second, store the raw HTML under `data/raw/`, and never refetch. Repair encoding damage (for example "Božiæa", "uvoðenja"); that is damage, not text.

**2. Kniewald, *Rimski misal za privatnu upotrebu*.** 1942 (4th edition): `https://archive.org/details/rimski_misal_za_privatnu_upotrebu_1942-dragutin_kniewald`, with OCR text at `https://archive.org/stream/rimski_misal_za_privatnu_upotrebu_1942-dragutin_kniewald/rimski_misal_za_privatnu_upotrebu_1942-dragutin_kniewald_djvu.txt` and page scans in the item. The Propers there are in Croatian only. A 1930 (2nd) edition is in the same collection under identifier `rimski_misal_za_privatnu_upotrebu_1930-dragutin_kniewald`. The OCR is noisy; correct it against the page images when you use a passage.

Already established by comparing the First Sunday of Advent in both: the old site's Croatian is not Kniewald's 1942 text. It reads like a later revision in the same tradition, close in the readings and reworded in the prayers and chants, so a word-for-word match is not expected. Kniewald also predates the changes of 1950–1960.

**3. Rubrics.** `https://maternalheart.org/library/1962rubrics.pdf`, English translation of the Code of Rubrics as amended to 1962. Mostly scanned pages, so OCR it. Implement from the text and cite paragraph numbers in tests.

**4. Latin corpus and second oracle.** Divinum Officium (`github.com/DivinumOfficium/divinum-officium`, `web/www/missa/`, MIT): use its data files only. Missale Meum (`github.com/mmolenda/missalemeum`, live at missalemeum.com), a 1962 calendar and missal built on that data: compare against its public site or API with read-only requests, and read its source to understand the data format. Do not execute code from either project.

**5. Local calendar.** `https://hbk.hr/nacionalni-liturgijski-kalendar/`, the national calendar of the Croatian Bishops' Conference (approved 8 February 2008) with the proper celebrations of each diocese.

## Stages

**1. Harvest.** Download and parse every year page, Mass page and rite page. Produce (a) golden fixtures: for each date, the calendar row and each Mass as ordered sections in both languages; (b) a translation memory keyed on normalised Latin (accents, case, punctuation, spacing, æ/ae, j/i folded) mapping each text unit to its Croatian. December 2017 and December 2018 appear on two year pages each; use the overlap as a consistency check. Report conflicts where one Latin text has more than one Croatian rendering, and keep the most frequent.

**2. Calendar engine, general calendar.** A pure function from date and calendar configuration to the day: titles, class, colour, season, commemorations with type and order, the Mass or Masses, and flags. Done when it reproduces every row of the old pages from 27 November 2016 to 31 December 2019 and agrees with Missale Meum for every day of 2026–2036.

**3. Latin corpus and Mass assembly.** Import the Latin once into your own clean format and keep the import script. The assembler turns a day into the ordered Mass: sections, commemoration prayers in place, preface, Gloria and Credo lines. Done when it reproduces every harvested Mass page section by section.

**4. Croatian.** For each Latin unit, look up the translation memory. For misses, find the unit in Kniewald 1942, then 1930, and record the source. For the rest, apply the gap rule. Then run the Kniewald check: for every unit taken from the old site, find Kniewald's counterpart and compare content, not wording: same pericope boundaries, same prayer, nothing truncated or missing. Write the result to `KNIEWALD-CHECK.md`. Store Kniewald's version beside the site's wherever you found it, behind one setting `croatianPrimary: site | kniewald` (default `site`), so the displayed wording can be switched later without rework. Do not correct Croatian wording; list suspected typos in `TYPOS.md`. Latin typos on the old site may be corrected against Divinum Officium and logged.

**5. Zagreb layer.** Described below.

**6. Site.** Described below.

**7. Verification.** Described below. Fix what it finds and rerun until it passes.

**8. Publish and report.** Described under Architecture and hosting and Final report.

## Rubrics the engine must get right

The old pages already demonstrate most of these; treat them as worked examples. Confirm paragraph numbers against the text. The ones I am fairly sure of: table of precedence n. 91, commemorations nn. 106–114, external solemnities nn. 356–361.

- Temporal cycle from Easter; Advent I as the Sunday nearest 30 November; resumed Sundays after Epiphany before the last Sunday after Pentecost.
- Ember days (note how the 1960 rubrics count the Sundays of September), Rogation days, the Greater Litanies and their transfer.
- Holy Name, Holy Family, Commemoration of the Baptism on 13 January, Christ the King.
- Occurrence by the table of precedence, including the Immaculate Conception over the Second Sunday of Advent, feasts of the Lord replacing a II class Sunday without a commemoration of it, and I class feasts replacing II class Sundays with one.
- Transfer of impeded I class feasts (the old pages show St Joseph moved to 20 March 2017 and the Annunciation to 9 April 2018); All Souls to 3 November.
- Vigils by class; the three octaves only; IV class ferias taking the Sunday Mass; the Saturday Mass of Our Lady.
- Commemorations: privileged and ordinary, all Masses or low Masses only, the maximum per class of day, inseparable pairs under one conclusion (St Peter with St Paul).
- Orations added on set dates, as on the old pages: the papal anniversary (there on 19 March, the inauguration date of the pope at the time) and Mission Sunday (the penultimate Sunday of October). Keep the pope and date as one configuration value. Today that is Leo XIV, inaugurated 18 May 2025; confirm online.
- Days with several Masses or special rites, as listed under the old site's URL pattern, plus Candlemas, Ash Wednesday and the Easter Vigil.

Dates in 2026–2036 that need their own named tests, each citing the rubric that decides it:

- Annunciation impeded: 2027 and 2032 (Holy Thursday), 2029 (Palm Sunday), 2035 (Easter Sunday).
- St Joseph: 2028 and 2034 (a Sunday of Lent), 2035 (Monday of Holy Week).
- 8 December on the Second Sunday of Advent: 2030. All Souls on a Sunday: 2031, 2036.
- Nativity of St John the Baptist on the day of the Sacred Heart: 24 June 2033; on a Sunday: 2029, 2035.
- On a Sunday: Sts Peter and Paul 2031, 2036; Assumption 2027, 2032; Christmas 2033; Epiphany 2030, 2036; Purification 2031; Transfiguration 2028, 2034; Exaltation of the Cross and Dedication of the Lateran 2031, 2036; Precious Blood 2029, 2035; St Michael 2030.
- Earliest Easter 25 March 2035, latest 21 April 2030.

## Zagreb local layer

Keep it as a data file, `data/local/zagreb.yaml`, one entry per celebration with its source. Starting data, from the HBK page:

| Date | Celebration | Scope | Rank given |
| --- | --- | --- | --- |
| 10 Feb | Bl. Alojzije Stepinac, biskup i mučenik | Croatia, Zagreb | spomendan |
| 27 Apr | Bl. Ozana Kotorska, djevica | Croatia | neobvezatni spomendan |
| 4 May | Sv. Florijan, drugi zaštitnik Nadbiskupije | Zagreb | spomendan |
| 10 May | Bl. Ivan Merz | Croatia | neobvezatni spomendan |
| 12 May | Sv. Leopold Mandić, prezbiter | Croatia | spomendan |
| 4 Jun | Sv. Kvirin Sisački | Zagreb | spomendan |
| 27 Jun | Sv. Ladislav, zaštitnik Nadbiskupije | Zagreb | blagdan |
| 5 Jul | Sv. Ćiril i Metod | Croatia | blagdan |
| 9 Jul | Bl. Marija Propetog Isusa, djevica | Croatia | neobvezatni spomendan |
| 13 Jul | Majka Božja Bistrička | Zagreb | blagdan |
| 3 Aug | Bl. Augustin Kažotić, biskup | Croatia | neobvezatni spomendan |
| 25 Aug | Obljetnica posvete prvostolne crkve | Zagreb | svetkovina in the cathedral, blagdan elsewhere |
| 7 Sep | Sv. Marko Križevčanin, prezbiter i mučenik | Croatia | spomendan |
| 8 Oct | Sv. Demetrije i drugovi | Zagreb | spomendan |
| 5 Nov | Spomen mučenika i svetaca čije su relikvije u crkvama Nadbiskupije | Zagreb | spomendan |
| 8 Nov | Bl. Gracija Kotorski, redovnik | Croatia | neobvezatni spomendan |
| 14 Nov | Sv. Nikola Tavelić, prezbiter i mučenik | Croatia | spomendan |

Decision rules:

1. Re-read the HBK page and correct this table if it has changed.
2. Rank. Where the Code of Rubrics itself fixes the rank (principal patron, anniversary of the cathedral's dedication), use the Code. Otherwise map svetkovina to I class, blagdan to II class, spomendan to III class. A neobvezatni spomendan does not change the Mass; show it as a note on the day.
3. Date. If the saint is already in the 1962 general calendar, keep the 1962 date (Sts Cyril and Methodius stay on 7 July) and apply the higher rank.
4. Occurrence and commemoration follow the same table of precedence as every other feast.
5. Mass. Use a proper Mass if one exists in the 1962 Missal's *pro aliquibus locis* section or in a pre-1962 proper you find online in Latin. Otherwise use the Common that fits the saint (martyr bishop, confessor not a bishop, virgin, and so on). Croatian comes from the translation memory like any other text. Never compose a prayer.
6. Search for the pre-conciliar Zagreb proper (a *Proprium* or *Officia propria* of the archdiocese, a Zagreb *Directorium* of 1961–64, or a local section in Kniewald 1930). If you find one online, it overrides rules 2 and 3 for the feasts it contains.
7. No church-specific feasts (titular, dedication of the church). The location of the Mass has changed over the years: sv. Martin at Vlaška 36 from 2011, and svblaz.hr now lists a Sunday traditional Latin Mass. The calendar is for the archdiocese.
8. Mark every day changed by the local layer with a small "mjesni kalendar" tag, with the general-calendar version one tap away.

## Site

- Opens on today's date (Europe/Zagreb), with next Sunday one tap away.
- Day view: date, title, class, colour, season, commemorations in the old site's wording, then the Mass in two columns, Latin left and Croatian right, aligned section by section. On a phone: Latin, Croatian or both interleaved, with the choice remembered. Days with several Masses use tabs.
- Getting around: previous and next day, a date picker, a month grid coloured by liturgical colour, a year list in the old site's table layout, search by feast or saint.
- Reading in church: a legible serif, rubrics and section titles in red, proper ℣ ℟ ✠ glyphs, font-size control, light and dark themes, offline use after the first visit.
- Print: a clean two-column A4 or A5 leaflet for any day.
- An `.ics` export per year.
- Croatian interface, UTF-8 throughout, self-hosted fonts that cover č ć đ š ž and accented Latin including æ and œ, `lang="la"` and `lang="hr"` on the texts.
- Design: quiet and bookish, like a well-made hand missal, with the liturgical colours as accents. Not a generic app template.

## Architecture and hosting

Keep four layers apart: engine (no text), corpus (no dates; each text stored once), assembler, site. The build writes one small file per year for the calendar and one file per Mass formulary; day views are composed in the browser. Do not duplicate texts into thousands of prerendered pages. Keep the deployed site under about 50 MB.

The output is one folder, `dist/`, of plain static files with relative links. It has to work unchanged in three situations: opened straight from disk by double-clicking `dist/index.html` (so load data through script tags, not `fetch`, and emit classic scripts, not ES modules, because neither `fetch` nor modules work from `file://`), served from any static host, and served under a sub-path, with no server rewrite rules. Every date has a shareable link (for example `?d=2027-03-28`). Offline caching applies only when the site is served over http(s).

Suggested stack: TypeScript, Vite or Astro, Vitest, Playwright. Deviate if you have a reason and note it in `DECISIONS.md`.

Publishing:

1. If `gh auth status` succeeds, publish as authorized above: create the public repository `tlm-kalendar`, push, enable GitHub Pages through a GitHub Actions workflow, and wait until the live URL and one deep link to a date both return the page. Add an `npm run deploy` script so that later updates are one command.
2. If it does not succeed, or the publish is denied, skip it. The finished calendar is then `dist/index.html`, and the first lines of `REPORT.md` give the one remaining step (`gh auth login`, then `npm run deploy`).

## Verification

Do all of this yourself. There is no human testing stage. Start any local server a test needs inside the test command and stop it before the command returns.

- **Calendar against the old site:** every day from 27 November 2016 to 31 December 2019 matches on title, class, commemorations (type and order) and number of Masses. Target 100%. Each exception is listed in `DIFFS.md` with its cause.
- **Texts against the old site:** every harvested Mass and rite page is reproduced section by section in both languages after normalising whitespace and typography. Target 100%, exceptions listed.
- **Calendar against Missale Meum:** every day of 2026–2036 on the general calendar. Each difference explained with a rubric citation.
- **Edge dates:** all the named tests above. In addition, have a fresh subagent that has not seen the engine derive those dates from the rubrics text alone, and reconcile any disagreement.
- **Coverage:** every day of 2026–2036, in both calendars, has every required section in Latin. Report Croatian coverage by source: old site, Kniewald, missing.
- **Whole-site crawl:** open every date of 2026–2036 in a headless browser in both calendars, once from `file://` and once over http. No console errors, no empty section, no broken link, no mojibake (search for the replacement character and for sequences such as "æ" or "ð" inside Croatian words), Croatian diacritics present.
- **Look and behaviour:** screenshots at 390 px and 1280 px width, light and dark, for at least 40 representative days (each season, each class, days with commemorations, several Masses, Holy Week, local feasts). Review each one yourself against the Site section and fix what is off. Print five days to PDF and check the leaflet.
- **Quality bars:** Lighthouse performance and accessibility of at least 90 on the day view; no serious axe violations; the site works offline after one visit when served over http.
- **Final audit:** re-read this brief line by line and tick each requirement in `REPORT.md` with the evidence for it.

## Final report

Write `REPORT.md`, short, for Marko. First the link, or the path `dist/index.html` and the one step left to publish it. Then: the verification results as numbers; Croatian coverage by source; what is in `GAPS.md` and `BLOCKED.md`; the decisions you took that he might want to reverse (especially local-calendar ranks and Mass choices), each with how to change it; and how to add years or correct a text. Then create `DONE`.

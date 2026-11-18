# Kalendar tradicionalne latinske mise — Zagreb, 2026.–2036.

**Adresa stranice:** https://mpejk.github.io/tlm-kalendar/ (primjer poveznice na dan: https://mpejk.github.io/tlm-kalendar/?d=2027-03-28)

Ovo je nastavak kalendara s tradicionalnamisa.com/kalendar, koji je stao 2019. Za svaki dan od 1. siječnja 2026. do 31. prosinca 2036. stranica pokazuje liturgijski dan po Rimskom misalu iz 1962. (Kodeks rubrika iz 1960.) i promjenjive dijelove mise toga dana, latinski i hrvatski usporedo. Zadani je kalendar zagrebački (opći rimski kalendar s mjesnim slavljima Zagrebačke nadbiskupije); opći se kalendar može izabrati.

Stranica je obična statična stranica: nema poslužiteljskog programa, računa, kolačića ni praćenja. Radi i s diska (dvoklik na `dist/index.html`) i bez mreže nakon prvog posjeta.

Ovaj je dokument pisan za onoga tko stranicu održava. Ne treba čitati programski kôd: sve što se redovito mijenja nalazi se u nekoliko tekstualnih datoteka s podacima.

## Sadržaj

1. [Što je u repozitoriju](#što-je-u-repozitoriju)
2. [Što treba imati instalirano](#što-treba-imati-instalirano)
3. [Prvo postavljanje](#prvo-postavljanje)
4. [Redoviti poslovi](#redoviti-poslovi)
5. [Igra »Nedjeljni izazov«](#igra-nedjeljni-izazov)
6. [Preseljenje stranice](#preseljenje-stranice)
7. [Otvorene stavke](#otvorene-stavke)
8. [Odakle je koji tekst](#odakle-je-koji-tekst)
9. [Summary in English](#summary-in-english)

## Što je u repozitoriju

| Mapa ili datoteka | Što je |
| --- | --- |
| `dist/` | **Gotova stranica.** Samo se ova mapa objavljuje. Nastaje naredbom `npm run build`; ne uređuje se rukom. |
| `data/calendar/sanctoral.yaml` | Opći kalendar svetaca 1962.: datum, razred, boja, hrvatski naslov. |
| `data/local/zagreb.yaml` | Zagrebački mjesni sloj: slavlja, razredi, mise, napomene. |
| `data/local/formularies.yaml` | Mise mjesnih blagdana sastavljene iz Zajedničkih misa. |
| `data/calendar/names.yaml` | Imena svetaca i pape koja se umeću u molitve umjesto »N.« / »I.«. |
| `data/corpus/la/` | Latinski tekstovi (uvezeni iz Divinum Officium). Ne uređuje se rukom. |
| `data/corpus/patches.yaml` | **Ispravci latinskog teksta.** |
| `data/tm/` | Hrvatski tekstovi sa stare stranice i iz Kniewalda. Ne uređuje se rukom, osim dviju datoteka niže. |
| `data/tm/corrections.yaml` | **Ispravci i dopune hrvatskog teksta misa.** |
| `data/tm/rites-hr.yaml` | **Hrvatski za retke obreda** (Svijećnica, Pepelnica, Vazmeno bdijenje). |
| `data/golden/`, `data/raw/` | Preuzete stranice stare stranice i drugi izvori, kao dokaz i za usporedbu. |
| `src/engine/` | Račun kalendara (datumi, prvenstvo, spomeni). |
| `src/assembler/` | Slaganje mise iz tekstova. |
| `src/site/` | Izgled i ponašanje stranice, fontovi. |
| `scripts/` | Izgradnja stranice (`build`), provjere (`verify`), uvoz izvora. |
| `tests/` | Automatske provjere (131 test). |
| `ZA-PRIJEVOD.md` | Tekstovi kojima nedostaje hrvatski prijevod, s mjestom upisa. Piše ga izgradnja. |
| `ODGOVOR-NA-PROVJERU.md` | Odgovor na stručnu provjeru iz studenoga 2026., nalaz po nalaz. |
| `REPORT.md` | Izvještaj o stanju i rezultatima provjera (engleski). |
| `DECISIONS.md` | Sve odluke i zašto su donesene (engleski). |
| `TYPOS.md` | Sumnjive riječi u hrvatskom i svi dosadašnji ispravci s izvornim čitanjem. |
| `DIFFS.md`, `MM-DIFFS.md` | Razlike prema staroj stranici i prema Missale Meum, svaka s rubrikom koja ju objašnjava. |
| `BLOCKED.md`, `GAPS.md`, `KNIEWALD-CHECK.md`, `TM-CONFLICTS.md` | Što nije bilo moguće, što nedostaje, usporedba s Kniewaldom, različiti prijevodi istog teksta na staroj stranici. |
| `CLAUDE.md` | Kratke upute za rad na projektu s alatom Claude Code. |
| `docs/` | Izvorni zadatak i dnevnik prve izrade (povijest, ne treba za održavanje). |

## Što treba imati instalirano

- **Node.js**, inačica 20 ili novija (https://nodejs.org, izabrati »LTS«). S njim dolazi i naredba `npm`.
- **git** (https://git-scm.com).
- Za objavu na GitHubu: račun na GitHubu s pravom pisanja u repozitorij.
- Za provjere u pregledniku (nije nužno za samu objavu): preglednici koje preuzima Playwright, vidi niže.

Ništa drugo nije potrebno: ni Python, ni baza, ni poslužitelj. Radi na Windowsima, macOS-u i Linuxu; naredbe se upisuju u terminal (na Windowsima PowerShell ili »Git Bash«) unutar mape projekta.

## Prvo postavljanje

```
git clone https://github.com/mpejk/tlm-kalendar.git
cd tlm-kalendar
npm install
npx playwright install chromium webkit
```

Treća naredba preuzima pomoćne programe (jednom, oko minute; upozorenja »install-scripts« mogu se zanemariti). Četvrta preuzima preglednike za provjere (oko 250 MB) i može se preskočiti ako se provjere u pregledniku neće pokretati.

Proba da sve radi:

```
npm test
```

Na kraju mora pisati `Tests 131 passed`. Naredba usput iznova izgradi stranicu u mapi `dist`; nju se može otvoriti dvoklikom na `dist/index.html`.

## Redoviti poslovi

Svaki posao ide istim redom: **promijeniti datoteku s podacima → `npm test` → pogledati `dist/index.html` → `npm run deploy`**. Ako se u datoteku upiše nešto što ne odgovara nijednom tekstu, izgradnja stane i kaže koji je unos pogrešan, pa se pogreška ne može objaviti neopaženo.

Datoteke `.yaml` su obični tekst. Pazi se na uvlake (razmaci, ne tabulatori) i na navodnike oko teksta. U svakoj datoteci na vrhu stoji opis i ima primjera.

### Ispraviti hrvatski tekst

U `data/tm/corrections.yaml` dodati unos na kraj. Dvije su vrste.

Zamjena riječi ili dijela rečenice (tipfeler, oznaka čitanja):

```yaml
- id: moj-ispravak-1
  find: "Korinćamima"
  replace: "Korinćanima"
  why: "tipfeler"
```

Ispravak vrijedi svugdje gdje se `find` javlja. Može se ograničiti: `where: "Sancti/11-16"` (samo taj obrazac mise), `section: Evangelium` (samo taj dio), `ifLatin: "Matt 8:5-13"` (samo gdje latinski stupac sadrži taj tekst).

Cijeli hrvatski tekst uz jedan latinski:

```yaml
- id: moj-ispravak-2
  la: "Accépta tibi sit, Dómine, sacrátæ plebis oblátio…"   # cijeli latinski tekst molitve, kako stoji na stranici
  hr: |-
    Neka ti bude, Gospodine, drag ovaj prinos…
    <i>Po Gospodinu našemu Isusu Kristu…</i>.
  source: "odakle je tekst"
  why: "zašto"
```

Oznaku obrasca mise (`Sancti/11-16`, `Tempora/Quad3-2`, `Commune/C2c`…) najlakše je naći u `ZA-PRIJEVOD.md`, u `TYPOS.md` ili pretragom mape `dist/data/f` za riječ iz teksta.

**Pravilo:** ne upisuje se vlastiti prijevod liturgijskog teksta. Upisuje se tekst iz tiskanog izvora ili od ovlaštenog prevoditelja, i u `source` se navodi odakle je.

### Ispraviti latinski tekst

U `data/corpus/patches.yaml` dodati unos:

```yaml
- { id: moj-latinski-1, formulary: Sancti/08-15, section: Graduale, find: "decórem tuum", replace: "pulchritúdinem tuam", source: "Missale Romanum 1962, str. 628" }
```

`formulary: "*"` znači »u svim obrascima koji taj tekst sadrže« (tekstovi Zajedničkih misa prepisani su u mnoge obrasce), `section: "*"` znači »u svim dijelovima«. `find` mora biti točno onako kako tekst stoji na stranici, s naglascima. U `source` se upisuje stranica Misala na kojoj je ispravno čitanje provjereno.

Nakon ispravka latinskog nije potrebno ništa učiniti s hrvatskim: on ostaje uz ispravljeni tekst.

### Upisati prijevod koji nedostaje (`ZA-PRIJEVOD.md`, `GAPS.md`)

`ZA-PRIJEVOD.md` za svaki tekst daje latinski, mjesto gdje se javlja i gotov predložak upisa: za tekst mise u `data/tm/corrections.yaml`, za redak obreda u `data/tm/rites-hr.yaml`. Predložak se prepiše, umjesto »…ovdje hrvatski tekst…« upiše se prijevod, a u `source` tko ga je dao. Nakon `npm run deploy` tekst nestaje iz popisa (popis se sastavlja iznova pri svakoj izgradnji). `GAPS.md` je isti popis ukratko, na engleskom.

### Promijeniti razred ili misu mjesnog blagdana

U `data/local/zagreb.yaml` svako slavlje ima svoj redak:

```yaml
- { date: "06-27", id: "zg-06-27", class: 1, colour: w, title: "SV. LADISLAV, KRALJ, ZAŠTITNIK NADBISKUPIJE", mass: "Commune/C5", source: "…" }
```

- `class`: razred (1, 2 ili 3). Naslovi I. razreda pišu se velikim slovima.
- `mass`: obrazac mise (npr. `Commune/C5` = misa *Os justi*); `massPaschal` ako je u vazmeno vrijeme druga misa.
- Slavlje koje je samo napomena uz dan (neobvezatni spomendan) stoji u popisu `notes` na dnu.
- Ako misu treba sastaviti iz dviju (npr. druga poslanica), to se opisuje u `data/local/formularies.yaml`; ondje su primjeri.
- Ime sveca za molitve s »N.« dodaje se u `data/calendar/names.yaml` pod istim `id`.

Poslije promjene valja pogledati dane toga blagdana u nekoliko godina (`dist/index.html?d=2027-06-27`) i pokrenuti `npm test`: testovi u `tests/zagreb.test.ts` i `tests/review-texts.test.ts` opisuju sadašnje stanje, pa će onaj koji se odnosi na promijenjeno slavlje pasti i treba ga uskladiti s novom odlukom. Odluku upisati u `DECISIONS.md`.

### Dodati godine

U `scripts/build/data.ts` promijeniti redak

```ts
export const YEARS = { from: 2026, to: 2036 };
```

Račun kalendara vrijedi za 1961.–2100. Nakon toga `npm run check` (provjerava i nove godine) i `npm run deploy`. Neki testovi broje dane ili prikaze za 2026.–2036. i past će ako se promijeni početna godina; pri produljenju kraja ostaju valjani.

### Promijeniti papinu obljetnicu (novi papa)

1. U `scripts/build/data.ts`: `export const POPE = { name: 'Lav XIV.', date: '05-18' };` — ime za prikaz i datum obljetnice (mjesec-dan).
2. U `data/calendar/names.yaml`, unos `pope`: oblici imena za molitve, latinski (`nom`, `gen`, `acc`, `abl`) i hrvatski (`gen`, `acc`, `ins`).
3. `npm test`: testovi skupine T12 u `tests/review-texts.test.ts` i skupine R06 u `tests/review.test.ts` spominju papu Lava i 18. svibnja; treba ih uskladiti s novim imenom i datumom.

Kad obljetnica padne na dan iz br. 1, 2, 3 ili 8 tablice prvenstva (npr. Uzašašće), molitva se sama prenosi na prvi dan koji nije I. razreda (Kodeks rubrika n. 449–450).

### Pokrenuti provjere

| Naredba | Što provjerava | Trajanje |
| --- | --- | --- |
| `npm test` | Izgradi stranicu i pokrene 139 testova: kalendar prema staroj stranici 2016.–2019. i prema Missale Meum 2026.–2036., tekstove prema staroj stranici, rubne datume, sve ispravke iz provjere. | oko 30 s |
| `npm run crawl` | Otvara svaki dan 2026.–2036. u oba kalendara u pregledniku, s diska i preko http-a: bez pogrešaka, praznih odjeljaka i pokvarenih slova. | oko 30 s |
| `npm run verify:site` | Poveznice, tipkovnica, uski zasloni i uvećana slova, fontovi (Chromium i WebKit). | oko 1 min |
| `npm run verify:igra` | Igra »Nedjeljni izazov«: svi izazovi, gumb u zaglavlju, uski zasloni, pristupačnost, rad bez mreže i s diska. | oko 6 min |
| `npm run check` | Sve četvero redom. | oko 8 min |
| `npm run play:igra` | Odigra igru dodirom u Chromiumu i WebKitu (16 dana, sve tri dobi). Nije dio `check`; pokrenuti nakon izmjena u `src/igra`. | oko 10 min |

Ako ijedna provjera javi pogrešku, ne objavljivati dok se ne otkloni.

### Objaviti

```
npm run deploy
```

Naredba izgradi stranicu, spremi promjene u git i pošalje ih na GitHub; ondje se za minutu-dvije sama objavi mapa `dist` (GitHub Pages, radni tijek `.github/workflows/pages.yml`). Posjetitelji koji već imaju stranicu otvorenu dobit će novu inačicu pri sljedećem otvaranju; stranica se tada jednom sama osvježi.

Provjera objavljenog: `npx tsx scripts/verify/live.ts https://mpejk.github.io/tlm-kalendar/`.

## Igra »Nedjeljni izazov«

Uz kalendar postoji kratka igra za djecu, na adresi `igra/` (https://mpejk.github.io/tlm-kalendar/igra/). U zaglavlju kalendara do nje vodi zeleni gumb »Igra«. Dijete je odigra prije nedjeljne mise: boja i dan, oblačenje svećenika, odgovori na misi, red mise, šest latinskih riječi i rečenica iz evanđelja. Za svaku nedjelju i svaki blagdan I. i II. razreda do kraja 2036. postoji jedan izazov; riješeni izazov daje sličicu u albumu. Imena djece i albumi ostaju samo u pregledniku na tom uređaju. Stranica »Za roditelje« u igri objašnjava sve što roditelj treba znati.

Igra se gradi zajedno s kalendarom (`npm run build`) i objavljuje istom naredbom (`npm run deploy`). Boju, dan, dijelove mise i evanđelje uzima iz kalendara, pa se ispravak u kalendaru sam prenosi u igru. Vlastiti sadržaj igre je u četiri datoteke u `data/igra/`:

| Datoteka | Što je u njoj | Izvor |
| --- | --- | --- |
| `odijevanje.yaml` | Red oblačenja misnog ruha i hrvatski nazivi | *Missale Romanum* 1962., Praeparatio ad Missam, str. LXXIII; nazivi uobičajeni hrvatski (Kniewald ih ne donosi) |
| `red-mise.yaml` | Odgovori na misi i dijelovi mise po redu, sa stranicama izvora | Latinski: Misal 1962., Ordo Missae, str. 216–327; hrvatski: Kniewald 1942., »Red i čin sv. mise«, str. 8–31 |
| `rjecnik.yaml` | 197 latinskih riječi s jednim značenjem i stranicom rječnika | S. Žepić, *Latinsko-hrvatski rječnik*, Zagreb 1881. (prvo izdanje rječnika koji je 1900. preradio Divković) |
| `evandjelje.yaml` | Za svako evanđelje: početak rečenice, riječ koja se izostavlja i tri kriva izbora | Rečenica se uzima iz hrvatskog evanđelja u kalendaru; krivi izbori su pisani za igru |

Najčešći poslovi:

- **Promijeniti rečenicu ili riječ iz evanđelja:** u `evandjelje.yaml` naći redak toga evanđelja i upisati prve riječi druge rečenice, riječ koja se izostavlja i tri kriva izbora iste vrste. Ako rečenica ne postoji u evanđelju točno jednom ili se riječ u njoj ne pojavljuje točno jednom, `npm run build` stane i kaže koji redak.
- **Dodati ili ispraviti riječ:** redak u `rjecnik.yaml` (riječ, natuknica kako je tiskana, značenje, stranica, oblici po kojima se riječ prepoznaje u misi). Značenje se prepisuje iz rječnika; riječ koje u rječniku nema ne dodaje se.
- **Dodati godine:** igra slijedi godine kalendara; nakon što se kalendaru dodaju godine, u `scripts/igra/lib.ts` pomaknuti `TO`, a u `evandjelje.yaml` dopisati evanđelja koja build prijavi da nedostaju.
- **Provjeriti:** `npm run check`, a nakon izmjena u izgledu ili ponašanju igre i `npm run play:igra`.

Odluke o igri (što igra koja dob, koja se misa uzima na dan s više misa, kako se otvara izazov) i gdje se koja mijenja: `DECISIONS.md`, odjeljak o igri, i `IGRA-IZVJESTAJ.md`.

## Preseljenje stranice

Stranica koristi samo relativne poveznice, pa radi na bilo kojoj adresi i u bilo kojoj podmapi bez ikakvih pravila na poslužitelju.

### Na vlastiti GitHub račun

1. Na GitHubu otvoriti repozitorij https://github.com/mpejk/tlm-kalendar i pritisnuti **Fork** (ili napraviti novi prazan repozitorij i u mapi projekta izvršiti `git remote set-url origin https://github.com/NOVI-RAČUN/tlm-kalendar.git`, zatim `git push origin main`).
2. U novom repozitoriju: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Kod forka još u kartici **Actions** potvrditi da se radni tijekovi smiju izvršavati.
3. `npm run deploy` (ili u kartici **Actions** ručno pokrenuti »Publish site«).
4. Stranica je na `https://NOVI-RAČUN.github.io/tlm-kalendar/`.

### Na vlastitu adresu društva (npr. kalendar.tradicionalnamisa.com)

1. Kod pružatelja domene dodati DNS zapis **CNAME**: `kalendar` → `NOVI-RAČUN.github.io`.
2. Na GitHubu: **Settings → Pages → Custom domain**, upisati `kalendar.tradicionalnamisa.com`, pričekati provjeru i uključiti **Enforce HTTPS**.

Ništa se u projektu ne mijenja.

### Na web poslužitelj društva

Kopirati **sadržaj mape `dist`** (ne samu mapu projekta) u željenu mapu na poslužitelju, npr. `tradicionalnamisa.com/kalendar/`, FTP-om ili kako se već objavljuje ostatak stranice. Pri svakoj promjeni: `npm run build` i ponovno kopirati cijeli `dist`. Preporučuje se https (rad bez mreže radi samo preko https-a). Stare poveznice oblika `?d=2027-03-28` ostaju valjane na novoj adresi.

## Otvorene stavke

- **Prijevodi koji nedostaju:** `ZA-PRIJEVOD.md` — 3 teksta misa i 12 redaka Vazmenog bdijenja.
- **Umetnuta imena za pregled** i dva teksta Vazmenog bdijenja sastavljena iz dvaju izvora: `ODGOVOR-NA-PROVJERU.md`, odjeljak »Umetnuta imena — za pregled«.
- **Vlastite mise zagrebačkih blagdana:** Kniewald 1942. donosi vlastite molitve nekih slavlja samo hrvatski; latinski izvornik (zagrebački *Proprium*) nije nađen, pa ti blagdani imaju molitve iz Zajedničkih misa. Vidi `BLOCKED.md`; ondje piše i kamo upisati tekstove ako se *Proprium* nađe.
- **Neprovjereno:** Firefox i stvarni iPhone (`BLOCKED.md`).
- **Sumnjive riječi** u hrvatskom koje nisu očiti tipfeleri: `TYPOS.md`, popisi A–C.
- **Kniewaldov tekst kao glavni:** uz 2500-ak tekstova spremljen je i Kniewaldov prijevod, ali kao neispravljen OCR; prekidač `croatianPrimary` u `data/site-config.json` (vidi `REPORT.md`).
- **Odluke koje bi netko mogao htjeti drukčije** (razredi mjesnih blagdana, izbor misa): tablica u `REPORT.md`.

## Odakle je koji tekst

| Vrsta teksta | Izvor |
| --- | --- |
| Kalendar (račun dana, prvenstvo, spomeni) | Kodeks rubrika iz 1960. (engleski prijevod, maternalheart.org); provjeren prema godišnjim stranicama tradicionalnamisa.com 2017.–2019. i prema missalemeum.com |
| Hrvatski naslovi dana | Godišnje stranice tradicionalnamisa.com |
| Latinski tekst misa | Divinum Officium (github.com/DivinumOfficium/divinum-officium, stanje od 27. veljače 2025.), ispravljen prema *Missale Romanum*, editio typica 1962. (sken Church Music Association of America) — svaki ispravak u `data/corpus/patches.yaml` s brojem stranice |
| Hrvatski tekst misa | Stranice misa tradicionalnamisa.com (2017. i 2018.); gdje ga ondje nema, Dragutin Kniewald, *Rimski misal za privatnu upotrebu*, 1942. (i 1930.), pročitan na slikama stranica s archive.org |
| Obredi: blagoslov grančica, Veliki petak, pranje nogu | Stranice tradicionalnamisa.com, oba jezika |
| Obredi: Svijećnica, Pepelnica, Vazmeno bdijenje s misom | Latinski Divinum Officium; hrvatski Kniewald 1930. i 1942. |
| Gloria i Vjerovanje | Stranice tradicionalnamisa.com |
| Mjesni kalendar | Nacionalni liturgijski kalendar HBK (hbk.hr), razredi po Kodeksu rubrika; mise po Kniewaldu 1942. |
| Igra: red oblačenja, odgovori, red mise | *Missale Romanum* 1962. (Praeparatio ad Missam, Ordo Missae); hrvatski Kniewald 1942., »Red i čin sv. mise« |
| Igra: značenja latinskih riječi | Sebastijan Žepić, *Latinsko-hrvatski rječnik*, Zagreb 1881. (archive.org), pročitan na slikama stranica |
| Riječi sučelja (gumbi, napomene, upute u igri, krivi izbori u igri) | Pisane za ovu stranicu |
| Font | EB Garamond (SIL Open Font License), preinačen: `src/site/fonts/LICENSE.txt` |

Nijedan liturgijski tekst nije preveden ni napisan za ovu stranicu. Gdje hrvatskoga nema ni u jednom izvoru, stoji samo latinski s napomenom »hrvatski prijevod nedostaje«.

Izvori koji nisu u repozitoriju jer su veliki (kopija Divinum Officium, slike Kniewaldovih stranica, sken Misala) nisu potrebni za održavanje; kako ih ponovno preuzeti piše u `DECISIONS.md`.

## Summary in English

Static website showing, for every day from 2026 to 2036, the liturgical day for Zagreb under the 1962 Roman Missal and the Proper of the Mass in Latin and Croatian. Live at https://mpejk.github.io/tlm-kalendar/.

- **Requirements:** Node.js 20+ and git. `npm install`, then `npm test` (builds `dist/` and runs 139 tests).
- **Maintenance is data editing:** Croatian corrections in `data/tm/corrections.yaml`, Latin in `data/corpus/patches.yaml`, rites in `data/tm/rites-hr.yaml`, local feasts in `data/local/zagreb.yaml`, names in `data/calendar/names.yaml`, years and the Pope in `scripts/build/data.ts`. An entry that matches nothing stops the build.
- **Checks:** `npm run check` (tests, whole-site crawl, browser checks). **Publish:** `npm run deploy` (GitHub Pages via Actions, `dist` only). The site uses relative links only, so `dist` can also be copied to any web server or sub-folder.
- **Children's game "Nedjeljni izazov"** at `igra/` (source `src/igra`, sourced content in `data/igra/*.yaml`, built and published with the calendar; checks `npm run verify:igra`, `npm run play:igra`). See the Croatian section above and `IGRA-IZVJESTAJ.md`.
- **Rule:** no liturgical text is written from memory or translated for this site; every text traces to a named source. Texts without Croatian are listed in `ZA-PRIJEVOD.md`.
- **Open items:** `ZA-PRIJEVOD.md`, `BLOCKED.md`, the review answer `ODGOVOR-NA-PROVJERU.md`; decisions in `DECISIONS.md`; status in `REPORT.md`.

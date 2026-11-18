# Nedjeljni izazov, druga inačica — izvještaj

**Adresa:** https://mpejk.github.io/tlm-kalendar/igra/

## Što je promijenjeno

- **Svaka nedjelja je drukčija.** Koje igre dijete dobiva, određuje datum (ne slučaj), pa braća i sestre iste dobi taj tjedan igraju isto. Izazov ima najviše 3 igre (6–7 godina), 4 (8–10) ili 5 (11 i više). U svakom je točno jedna igra stalnoga znanja, a ostalo su igre koje se mijenjaju s danom. Igra stalnoga znanja nikad nije ista dva izazova zaredom ni dvije nedjelje zaredom.
- **Razine.** Igre stalnoga znanja imaju razine. Kad dijete riješi igru bez ijedne pogreške u tri različita izazova, sljedeći put dobiva višu razinu. Razine se pamte na uređaju, vide se na stranici »Za roditelje« i na kraju izazova (»Nova razina…«).
  - *Obuci svećenika:* 1 red s imenima, 2 red bez imena (samo crteži), 3 koji dio nedostaje, 4 (11+) početne riječi molitve uz svaki dio ruha.
  - *Složi kalež* (nova): 1 red s imenima, 2 bez imena, 3 što nedostaje.
  - *Pripremi oltar* (nova): 1 na žrtveniku ili na stoliću, 2 gdje na žrtveniku, 3 koliko stolnjaka, što ide na stolić, što stoji s obje strane raspela.
  - *Složi misu:* 1 četiri dijela po redu, 2 »što dolazi odmah poslije«, 3 cijeli red mise toga dana.
  - *Odgovori na misi:* nikad isti skup odgovora dva izazova zaredom; 1 lakši odgovori, 2 pet odgovora, 3 (11+, i 8–10 ako roditelj označi »uči ministrirati«) dulji odgovori: psalam 42 i *Misereatur*.
- **Nove igre koje se mijenjaju s danom:** Koji je ovo dio? (8+), Što se danas ne govori? (8+), Poredaj evanđelje (8+), Sveci tjedna (8+), Boje tjedna (sve dobi; za najmlađe tri boje i nagovještaj nakon dvije pogreške), Koliko još nedjelja? (6–10). Stare ostaju: Boja i dan, Riječi nedjelje, Dopuni evanđelje.
- **List za ispis** slijedi igre toga izazova za dob i razine djeteta koje je odabrano; igre teku u dva stupca na jednoj stranici A4.
- **Albumi i imena djece su sačuvani.** Spremljeni podaci sada imaju inačicu (`igra.v2`); stari zapis (`igra.v1`) se prenese i ostane netaknut kao rezerva.
- **Gumb u kalendaru.** Zeleni gumb »Igra« zamijenjen je tihom stavkom **»Djeca«** na kraju izbornika (Dan · Mjesec · Godina · Traži · O kalendaru · Djeca), desno, iste veličine kao ostale stavke, sa zelenim obrubom i blagom pozadinom (ne punom bojom), u svijetloj i tamnoj temi. Čitač zaslona čuje »Djeca: Nedjeljni izazov, igra za djecu«. Nema je u ispisu.

## Sljedećih osam nedjelja

Podebljano je igra stalnoga znanja.

| Nedjelja | 6–7 godina | 8–10 godina | 11 i više |
| --- | --- | --- | --- |
TABLICA

## Odakle je novi stalni sadržaj

| Sadržaj | Izvor (pročitano na slici stranice) |
| --- | --- |
| Priprema kaleža: kalež, purificatorium, plitica s hostijom, pala, velum, bursa s tjelesnikom | *Missale Romanum* 1962., Ritus servandus I, 1, str. LIV |
| Oltar: tri stolnjaka, raspelo u sredini, svijećnjaci s obje strane, misal na strani Poslanice; gostarice, posudica i ručnik, zvonce na stoliću; kalež u sredini, bursa na strani Evanđelja | Rubrike 1960., br. 526–528 (Misal 1962., str. XXXVI); Ritus servandus II, 2, str. LIV |
| Molitve pri oblačenju (početne riječi) | Misal 1962., str. LXXIII |
| Psalam 42 i *Misereatur* | Misal 1962., str. 216; Kniewald 1942., str. 8–10 |
| Hrvatski nazivi | Kniewald 1942.: kalež, plitica, hostija (str. 16), tjelesnik, strana Poslanice, sredina žrtvenika (str. 17), tri stolnjaka (str. 251), raspelo (str. 263), svijećnjak (str. 525); Proleksis enciklopedija: pala, gostarica, naglavnik (s. v. humerale), naručnik (s. v. manipul) |
| Odlomci za »Poredaj evanđelje« | Hrvatsko evanđelje dana iz kalendara; odlomak od 3–4 rečenice odabran ručno za 86 od 108 evanđelja (`data/igra/poredaj.yaml`) |

Testovi s brojem stranice u `tests/igra.test.ts` (red kaleža, oltar, molitve, dulji odgovori).

## Provjera u brojkama

BROJKE

## Što je izostavljeno jer izvor to ne podupire

- **Hrvatski nazivi** za *purificatorium*, *velum*, *bursa*, *tabellae secretarum*, posudicu i ručnik (*pelvicula et manutergium*) i zvonce (*parva campanula*) nisu nađeni ni u Kniewaldu (1942., 1930.) ni u Proleksisu, pa su u igri samo latinski.
- **Molitve pri oblačenju** Kniewald ne donosi, pa su samo latinski (bez prijevoda).
- **Oltar:** broj svijeća nije zadan (br. 527: »koliko traži vrsta mise«), pa se pita samo »s obje strane«; mjesto oltarnih tablica nije navedeno, pa se ne pita; cvijeće i drugo iz običaja nije u igri.
- **Poredaj evanđelje** nema na 22 evanđelja: 14 ih nema tri kratke rečenice zaredom ili im red nije jednoznačan, a 8 je izostavljeno pri pregledu (rečenice bi se mogle zamijeniti; u odlomku sv. Andrije, 30. 11., u kalendaru stoji tiskarska pogreška »podu« umjesto »pođu«, koju bi trebalo ispraviti u `data/tm/corrections.yaml`).

## Odluke koje možeš htjeti drukčije

| Odluka | Kako promijeniti |
| --- | --- |
| Koje igre igra koja dob, koliko ih je u izazovu | `FIX`, `CHG`, `SIZE` u `scripts/igra/rounds2.ts` |
| Najviša razina po igri i dobi | `MAXLEVEL` u `scripts/igra/rounds2.ts` |
| Razina raste nakon 3 izazova bez ijedne pogreške | `STEP` u `src/igra/store.ts`; »bez pogreške« u `finish()` u `src/igra/main.ts` |
| Dulji odgovori za 8–10 samo uz oznaku »uči ministrirati« | `maxLevel()` u `src/igra/pitanja.ts` |
| Odlomci za slaganje evanđelja | redak toga evanđelja u `data/igra/poredaj.yaml` |
| Boja i izgled stavke »Djeca« | `.views a.djeca` u `src/site/style.css` |
| List za ispis bez odabranog djeteta je za dob 11+ | `viewSheet()` u `src/igra/main.ts` |

Sve odluke s razlozima: `DECISIONS.md`, odjeljak o igri.

## Što ovdje nije moglo biti provjereno

- **Pravi telefoni i tableti, pravi pisač, Firefox** — kao i prije (Chromium i WebKit s profilom iPhonea; list kao PDF).
- **Djeca.** Jesu li razine prave težine i je li pet igara za najstarije još oko pet minuta, pokazat će igranje.
- **Pravi povratni posjetitelj na drugom uređaju.** Provjereno je s profilom preglednika koji je prije objave imao staru inačicu i stari album (vidi brojke).

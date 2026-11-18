# Nedjeljni izazov — izvještaj

**Adresa:** https://mpejk.github.io/tlm-kalendar/igra/
Izravna poveznica na jedan izazov: https://mpejk.github.io/tlm-kalendar/igra/?d=2026-11-29

## Što je napravljeno

- Kratka igra za djecu uz kalendar, u istom repozitoriju (`src/igra`, `data/igra`, `scripts/igra`, izlaz `dist/igra`).
- Jedan izazov za svaku nedjelju i svaki blagdan I. i II. razreda zagrebačkog kalendara, od 22. 11. 2026. do kraja 2036.: **979 izazova** (528 nedjelja, 451 blagdan).
- Tri dobi: 6–7 (2 igre), 8–10 (4 igre), 11 i više (6 igara). Za najmlađe postoji izbor »velika tiskana slova«.
- Album liturgijske godine za svako dijete, počevši od 29. 11. 2026. Nedjelja 22. 11. 2026. služi za zagrijavanje.
- Stranica »Za roditelje« i list za ispis (jedna stranica A4) za svaki izazov.
- U kalendaru je promijenjeno samo jedno: zeleni gumb »Igra« u zaglavlju. Igra ima poveznicu »Kalendar« natrag.
- Nema računa, kolačića ni praćenja. Imena i albumi ostaju u pregledniku na tom uređaju. Igra radi bez mreže nakon prvog posjeta i otvara se s diska.

## Odakle je sadržaj svake igre

| Igra | Izvor |
| --- | --- |
| 1. Boja i dan | Kalendar (zagrebački), glavna misa dana. Na Božić danja misa, što igra i napiše. |
| 2. Obuci svećenika | Red: *Missale Romanum* 1962., Praeparatio ad Missam, str. LXXIII, pročitano na slici stranice. Hrvatski nazivi su uobičajeni (naglavnik, alba, pojas, naručnik, štola, misnica), jer ih Kniewald 1942. ne donosi. Crteži su izvorni. |
| 3. Odgovori na misi | 15 odgovora. Latinski: Misal 1962., Ordo Missae, str. 216–326. Hrvatski: Kniewald 1942., »Red i čin sv. mise«, str. 8–30. Svaki redak nosi obje stranice. |
| 4. Složi misu | Red: Misal 1962., Ordo Missae, str. 216–322. Nazivi promjenjivih dijelova kako ih kalendar prikazuje za taj dan; nazivi stalnih dijelova po Kniewaldu. Slava, Vjerovanje, posljednica i pristupne molitve samo kad ih dan ima. |
| 5. Riječi nedjelje | 197 riječi. Značenja: Sebastijan Žepić, *Latinsko-hrvatski rječnik*, Zagreb 1881. (archive.org), pročitano na slikama stranica; uz svaku riječ natuknica i stranica. Divković 1900. nije dostupan na mreži; Žepić 1881. je prvo izdanje istog rječnika. |
| 6. Dopuni evanđelje | Rečenica iz hrvatskog evanđelja dana, doslovno kako je u kalendaru. Riječ koja se izostavlja i tri kriva izbora odabrani su ručno za svako od 108 evanđelja (`data/igra/evandjelje.yaml`). Sva evanđelja imaju hrvatski tekst, pa se igra nigdje ne preskače. |

## Provjera u brojkama

- **Generator:** 979 izazova × 3 dobi; 20 559 pitanja, 60 698 ponuđenih odgovora; **0 pogrešaka**. Svako pitanje ima točno jedan točan odgovor, krivi se razlikuju od točnog i međusobno, nema praznog teksta ni »N.«, nema latinskog pod hrvatskim ni obrnuto. 95 različitih rečenica iz evanđelja.
- **Stalni sadržaj:** testovi s brojem stranice za red oblačenja, red mise i odgovore (`tests/igra.test.ts`, 8 testova).
- **Rječnik:** drugo, neovisno čitanje 30 natuknica na slikama stranica: 30 od 30 se slaže.
- **Igranje dodirom:** Chromium i WebKit (profil iPhonea), širine 390 i 768 px, 16 dana kroz sva liturgijska vremena, sve tri dobi: **64 izazova, 288 igara, 0 pogrešaka**. 52 sličice i 12 znakova vježbe u albumu. Ruho je 32 puta stavljeno samo dodirom, 32 puta povlačenjem. Četiri profila i albumi preživjeli su ponovno učitavanje; brisanje je uklonilo sve.
- **Izgled:** 470 zaslona na 340 px, uz slova 100 %, 130 % i 160 %, svijetlo i tamno, oba preglednika: nema vodoravnog pomicanja; 6 482 dodirne površine, najmanja 44 px. Snimke svih igara za sve tri dobi u obje teme pregledane su i ispravljene (raspored ruha, izbor boja, album, stranica za roditelje i list na uvećanim slovima).
- **List za ispis:** 8 dana ispisano u PDF, svaki na jednoj stranici A4.
- **Kvaliteta:** axe 94 zaslona, 0 ozbiljnih prekršaja. Lighthouse (mobitel): početna stranica 99 brzina / 100 pristupačnost, izazov 97 / 100. Bez mreže nakon jednog posjeta: 7 od 7 stranica, uključujući odigran cijeli izazov. S diska (`file://`): radi, bez ijednog zahtjeva prema mreži. Zahtjeva prema drugim stranicama: 0.
- **Kalendar:** `npm run check` prolazi u cijelosti (139 testova, pregled svih dana 2026.–2036. bez pogrešaka, provjere stranice 0 pogrešaka). Gumb »Igra«: vidljiv na 340 i 1280 px u obje teme (kontrast 6,45 i 9,14), dostupan tipkovnicom, nema ga u ispisu.

- **Nakon objave (18. 11. 2026., Chromium i WebKit s profilom iPhonea):** adresa igre se učitava i ista je inačica kao lokalno izgrađena; gumb »Igra« je na objavljenom kalendaru i otvara igru; izravna poveznica na izazov 29. 11. 2026. otvara se i izazov je odigran do sličice (6 igara); list za ispis se otvara; poveznica »Kalendar« vraća natrag; 0 zahtjeva prema drugim stranicama (`npx tsx scripts/igra/live.ts`).

## Značenja riječi u nacrtu

Nema ih. Sva značenja su iz rječnika. Izostavljeno je 13 riječi kojih u rječniku nema ili imaju samo klasično značenje koje ne odgovara misi: angelus, apostolus, benedico, benedictio, caro, desertum, ecclesia, hymnus, manduco, mortuus, offero, oratio, propheta.

Za pregled, ako želiš:

- *dominus* je »gospodin« (u natuknici stoji i »gospodar«).
- Neka značenja su točna, ali su u rječniku dublje u natuknici, ne prva: *adoro* – klanjati se, *humilis* – ponizan, *salus* – spas, *turba* – mnoštvo, *peccatum* – grijeh (tiskano samo u objašnjenju u zagradi).
- Pravopis je osuvremenjen (rieč → riječ, množtvo → mnoštvo); tiskani oblik je sačuvan u podacima.

## Odluke koje možeš htjeti drukčije

| Odluka | Kako promijeniti |
| --- | --- |
| Hrvatski nazivi ruha (naglavnik, naručnik…) | `data/igra/odijevanje.yaml`, polje `hr` |
| Kniewaldov tekst odgovora ostavljen kako je tiskan (»Idite misa je!«, »I s duhom Tvojim.«) | `data/igra/red-mise.yaml` |
| Koja pitanja i dijelove mise dobiva dob 8–10 | oznake `lako` i `kratko` u `data/igra/red-mise.yaml` |
| Koje igre igra koja dob | `GAMES` u `src/igra/main.ts` |
| Rečenica, riječ i krivi izbori iz evanđelja | redak toga evanđelja u `data/igra/evandjelje.yaml` |
| Na Božić se uzima danja misa, inače prva misa dana | `principal()` u `scripts/igra/lib.ts` |
| Boja gumba »Igra« (zelena) | `.btn.igra` u `src/site/style.css` |
| Izazov izvan svog tjedna daje tiši znak vježbe, koji kasnija sličica zamijeni | `finish()` u `src/igra/main.ts` |
| Zvuka nema uopće | — |

Sve odluke s razlozima: `DECISIONS.md`, odjeljak o igri.

## Što ovdje nije moglo biti provjereno

- **Pravi telefoni i tableti.** Sve je provjereno u Chromiumu i WebKitu na ovom računalu s profilom telefona. Povlačenje pravim dodirom provjereno je samo u Chromiumu; u WebKitu je oponašano. Dodir bez povlačenja radi u oba.
- **Firefox** se na ovom računalu ne pokreće (kao i kod kalendara, `BLOCKED.md`).
- **Pravi pisač.** List je provjeren kao PDF.
- **Djeca.** Je li igra zaista pet minuta i je li prava mjera za svaku dob, pokazat će tvoje četvero.
- **Cijeli rječnik.** Ponovno je pročitano 30 od 197 natuknica; ostale su pročitane jednom.

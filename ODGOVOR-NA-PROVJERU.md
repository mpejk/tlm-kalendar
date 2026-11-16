# Odgovor na provjeru kalendara

Provjerena je revizija 25a6b7a prema Rimskom misalu iz 1962. i Kodeksu rubrika iz 1960. Svaki je nalaz ponovljen na objavljenim podacima, provjeren na samoj stranici izvora (Misal: sken Church Music Association of America, `missale62.pdf`; Kodeks: prijevod s maternalheart.org) i ispravljen na izvoru pogreške, za sve godine 2026.–2036. i oba kalendara. Za svaki nalaz koji je tražio promjenu postoji test koji na pregledanoj reviziji pada.

**Ishod: 26 nalaza — 26 potvrđeno, 0 djelomično, 0 nije potvrđeno.** Stranica je objavljena: https://mpejk.github.io/tlm-kalendar/

Kako se broje prikazi: jedan prikaz je kalendar + datum + misa ili obred. Opći kalendar ima svaki dan, zagrebački samo dane na koje se razlikuje od općega (tako stranica i sprema podatke), pa su brojevi otprilike upola manji od onih koji broje oba kalendara u cijelosti. Između pregledane revizije i sadašnje promijenilo se ukupno 1311 od 4391 prikaza; svaka je promjena pripisana jednom od ispravaka (`data/verify/review-counts.json`).

## Nalazi

| Nalaz | Ocjena | Što je promijenjeno | Prikaza | Gdje se vidi | Što još treba čovjek |
| --- | --- | --- | --- | --- | --- |
| R01 | potvrđeno | Vazmeno bdijenje sada ima cijelu misu nakon Kyrie: Gloria, molitva, Kol 3, 1-4, Aleluja s Ps 117 i Ps 116, Mt 28, 1-7, napomene o Vjerovanju i prikaznoj pjesmi, prikazna molitva, uskrsno predslovlje (»in hac potissimum nocte«), Jutarnja (Ps 150, antifona, Benedictus), popričesna, otpust. Uzrok: uvoz je svaki tekst prekidao na naslovu »Gloria«. Latinski iz iste datoteke Divinum Officium, provjeren na Misalu str. 212; hrvatski iz Kniewalda 1942., str. 297–298. | 11 (svih 11 godina) | [27. 3. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-03-27) | Hrvatski za Ps 150 i Benedictus (vidi ZA-PRIJEVOD.md). Predslovlje i antifonu »Et valde mane« pregledati (sastavljeno iz dvaju izvora, vidi niže). |
| R04 | potvrđeno | Prosna misa u nedjelju ima Vjerovanje (Kodeks rubrika n. 343a, 475a). Usput: prosna misa se više ne nudi na dane I. razreda (n. 341), tj. 25. 4. 2030. i 1. 5. 2035.; dan nosi napomenu (n. 343c). | 2 + 2 uklonjena | [25. 4. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-04-25&m=1) | — |
| R06 | potvrđeno | Molitva za papu po n. 449–450 (i 364, 363b): izostaje kad je dan iz br. 1, 2, 3 ili 8 tablice prvenstva i prenosi se na prvi dan koji nije I. razreda. U 2026.–2036. to je samo 2034. (Uzašašće): molitva je 19. svibnja. Na duhovski utorak 2027. i 2032. te kvatreni petak 2035. (I. razred, br. 10) ostaje 18. svibnja. Odluka iz DECISIONS.md je preinačena. | 2 | [19. 5. 2034.](https://mpejk.github.io/tlm-kalendar/?d=2034-05-19) | — |
| R08 | potvrđeno | Blagdani i spomeni Gospe označeni su u kalendaru svetaca (17 unosa); drugi marijanski spomen izostaje (n. 112d). U rasponu je to samo subota 16. 7. 2033. | 1 | [16. 7. 2033.](https://mpejk.github.io/tlm-kalendar/?d=2033-07-16) | — |
| T01 | potvrđeno | Uz »Accepta tibi sit« sada stoji njezin prijevod (»Neka ti bude, Gospodine, drag ovaj prinos…«). Stara stranica je uz tu molitvu na 18 stranica tiskala prijevod molitve »Hostias, Domine, tuae plebis«, a na 12 pravi; pravilo »najčešći« izabralo je pogrešan. Pregledana je cijela prijevodna memorija: drugoga takvog križanja nema. | 202 | [16. 11. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-11-16) | — |
| T02 | potvrđeno | Dodano »njezinim zaslugama i zagovorom« (riječi recenzenta). Misal str. 719. | 9 | [16. 11. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-11-16) | — |
| T03 | potvrđeno | Gradual Velike Gospe po Misalu str. 628: »concupiscet Rex pulchritudinem tuam«, »Tota decora ingreditur filia Regis, texturae aureae sunt amictus eius«, »Assumpta … in caelum«. Hrvatski uz njega već je bio prijevod toga teksta; ispravljen je samo tipfeler »zavoljeli« → »zavoljeti«. | 11 | [15. 8. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-08-15) | — |
| T04 | potvrđeno | »animas omnium fidelium defunctorum« u zavlaci sve tri mise Dušnog dana (Misal str. 706, 708). | 33 | [2. 11. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-11-02) | — |
| T05 | potvrđeno | »sanctus Antonius Abbas«, »beatus Antonius Abbas« (Misal str. 446). Isti uzrok (ime u krivom padežu u molitvi iz Zajedničkih misa) nađen je još šest puta: Apolonija, Bibijana, Doroteja, Emerencijana, Margareta (ablativ), Kristina (genitiv). | 10 + 56 za ostala imena | [17. 1. 2028.](https://mpejk.github.io/tlm-kalendar/?d=2028-01-17) | — |
| T06 | potvrđeno | Tri tiskarske pogreške ispravljene; iste su bile i 17. 9. (Rane sv. Franje) i 2. 10. (Anđeli čuvari). Usporedbom svih latinskih riječi s Misalom nađene su i ispravljene još 23 takve pogreške u misama i 12 u obredima (popis u TYPOS.md). | 40 | [4. 10. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-10-04) | — |
| T07 | potvrđeno | Hrvatska prikazna pjesma skraćena na opseg latinske (do »ključeve kraljevstva nebeskoga«). | 8 | [22. 2. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-02-22) | — |
| T08 | potvrđeno | Dodani početni »Aleluja, aleluja« i završni »Aleluja«. Isto je nedostajalo u još četiri graduala (Pohod BDM i druge mise »Benedicta et venerabilis«, Majčinstvo BDM, sv. Šimun i Juda, Tijelovo), a u tri je bilo viška; sve je usklađeno. | 10 | [22. 11. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-11-22) | — |
| T09 | potvrđeno | Aleluja se u vazmeno vrijeme dodaje prikaznoj i pričesnoj pjesmi kad je nema (n. 478, 504), u oba jezika; ulazna po n. 429. Hrvatski se s latinskim usklađuje mehanički (samo riječ Aleluja). Broj se od recenzentova razlikuje jer se ovdje zagrebački kalendar broji samo na dane na koje se razlikuje od općega. | 32 (latinski); hrvatski usklađen u još 259 | [5. 4. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-04-05) | — |
| T10 | potvrđeno | Od Sedamdesetnice do Uskrsa Aleluja se u prikaznoj i pričesnoj pjesmi izostavlja u oba jezika, u svakoj godini. Test provjerava da u tom razdoblju nijedan napjev nema Aleluja. | 1 | [22. 1. 2035.](https://mpejk.github.io/tlm-kalendar/?d=2035-01-22) | — |
| T11 | potvrđeno | Svih pet tekstova doista nije imalo hrvatski. Dva su popunjena bez prevođenja: molitva »Gregem tuum« za sv. Urbana i za sv. Sotera i Kaja ista je kao za druge pape na staroj stranici (jednina i množina), umetnuta su samo imena. Tri ostaju: molitva i prikazna sv. Mauricija, gradual BDM Kraljice izvan vazmenog vremena. | 11 popunjeno | [25. 5. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-05-25) | Tri teksta u ZA-PRIJEVOD.md. Umetnuta imena pregledati (niže). |
| T12 | potvrđeno | Imena umjesto N. / I.: tablica `data/calendar/names.yaml`; latinski oblik po padežu riječi ispred, hrvatski genitiv nakon »blaženoga / svetoga / blažene«. Papa: »Leonem / Lava« (prije je stajalo »I. [Benedikta]«), i na Veliki petak i u Exsultetu. Sv. Florijan, koji nije bio biskup, dobio je molitve »Pro Martyre tantum« mise Protexisti. Ispravljeno i krivo ime na staroj stranici (sv. Anicet s imenom sv. Higina). | 120 | [17. 1. 2028.](https://mpejk.github.io/tlm-kalendar/?d=2028-01-17) | Pregledati popis umetanja niže. N. ostaje gdje su dva ili više neimenovanih mučenika (sv. Demetrije i drugovi, Spomen relikvija) i za biskupa u Exsultetu. |
| T13 | potvrđeno | Svih 15 oznaka ispravljeno, svaka provjerena na oznaci u Misalu. Popis svih čitanja u oba stupca dao je još dvije: Rim 6, 19-23 (7. ned. po Duhovima, HR) i Deut 26, 1-11 (duhovska kvatrena subota, LA). | 279 | [4. 10. 2026.](https://mpejk.github.io/tlm-kalendar/?d=2026-10-04) | — |
| T14 | potvrđeno | »Korinćanima«, »Božjom revnošću« (u svih 11 misa s tim čitanjem). Iz popisa sumnjivih riječi ispravljeno je još osam očitih tipfelera (TYPOS.md). | 96 | [16. 11. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-11-16) | — |
| H01 | potvrđeno | Zadnji odlomak Exsulteta (»Respice etiam ad eos…«) stoji kao zaseban redak s napomenom da prijevod nedostaje; ostatak je zadržao Kniewaldov tekst, a zaključak »Po istom Gospodinu…« došao je na svoje mjesto. | 11 | [27. 3. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-03-27) | Prijevod odlomka (ZA-PRIJEVOD.md, ključ `vigil:exsultet-respice`). |
| H02 | potvrđeno | Devet redaka doista nema hrvatski; ni stara stranica ni Kniewald (1942., 1930.) nemaju obred iz 1955. Ništa nije prevedeno. | 11 (bez promjene) | [27. 3. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-03-27) | Devet redaka u ZA-PRIJEVOD.md, svaki sa svojim ključem. |
| H03 | potvrđeno | Uzeta je Kniewaldova rečenica iste molitve (1942., str. 263): »koji ne tražiš smrti grješnika, nego vazda život…«. | 11 | [26. 3. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-03-26) | — |
| W04 | potvrđeno | Godišnja tablica na uskom zaslonu slaže svaki dan u dva retka. Širina dokumenta pri 340 px: prije 349 / 453 / 558 px (100 / 130 / 160 %), sada 340 px u sva tri slučaja. | — | [godina 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-01-01&v=godina) | — |
| W05 | potvrđeno | Polje za pretragu se sužava na raspoloživi prostor (prije 358,4 px pri 160 %). | — | [pretraga](https://mpejk.github.io/tlm-kalendar/?d=2027-01-01&v=trazi) | — |
| W01 | potvrđeno | `m` se prihvaća samo kao cijeli broj u rasponu; inače se otvara misa dana. Nepostojeći datum otvara današnji dan; prikaz koji ne uspije javlja poruku umjesto da ostane na »Učitavanje«. 22 slučaja u testu. | — | [m=0.5](https://mpejk.github.io/tlm-kalendar/?d=2027-04-25&m=0.5) | — |
| W06 | potvrđeno | Fontovi su zamijenjeni preinačenim kopijama EB Garamonda iz kojih je uklonjen latinski jezični sustav (onaj koji u crta kao v); nova imena datoteka, a nova inačica stranice jednom sama osvježi otvorenu stranicu, pa i stari posjetitelji dobiju nove fontove. `lang="la"` je ostao. Dokazi: (1) HarfBuzz s jezikom »la« na isporučenim datotekama daje u, U, v nepromijenjene u sva tri reza; (2) Playwright WebKit s profilom iPhonea: stara izgradnja crta »jvstítiam, Devs, tvvs« (uspravno i polumasno, kurziv ne), nova ne, pri prvom posjetu i pri povratku sa starom predmemorijom. | — | [28. 3. 2027.](https://mpejk.github.io/tlm-kalendar/?d=2027-03-28) | Provjera na stvarnom iPhoneu (ovdje je nije bilo moguće napraviti). |
| W07 | potvrđeno | Kartice slijede obrazac W3C APG: strelice lijevo/desno kruže među karticama istoga dana, Home/End, razmaknica; prečac za promjenu dana ne reagira dok je fokus na kartici, polju ili skupini gumba ni uz Shift/Alt. 30 provjera u testu. | — | [29. 3. 2026.](https://mpejk.github.io/tlm-kalendar/?d=2026-03-29) | — |

Recenzent nije tražio upute za konventualne mise, izbor među misama, kraću Muku ni vlastite dijelove tihoga Kanona; ništa od toga nije dodano.

## Ista vrsta pogreške izvan popisa

- **Prosna misa na dan I. razreda** (uz R04): uklonjena 25. 4. 2030. (uskrsni četvrtak) i 1. 5. 2035. (sv. Josip Radnik), n. 341. Stara stranica ju je 25. 4. 2019. imala; razlika je upisana u DIFFS.md.
- **Imena u krivom padežu** (uz T05): Apolonija 9. 2., Bibijana 2. 12., Doroteja 6. 2., Emerencijana 23. 1., Margareta 20. 7., Kristina 24. 7.
- **Krivo ime u hrvatskom** (uz T12): sv. Anicet 17. 4. imao je »blaženoga Higina«.
- **Sv. Florijan s molitvama mučenika-biskupa** (uz T12): sada molitve za mučenika koji nije biskup.
- **Latinske tiskarske pogreške** (uz T06): 23 u misama (npr. »repæséntas«, »vobisfacio«, »urna áuea«, »Gamíllo«, »præscibus«, »muniémur«) i 12 u obredima (npr. »hearéticis«, »incólumen«, »terrarium«, »conctis«). Nađene usporedbom svake latinske riječi stranice s rječnikom Misala.
- **Gradual Uskrsa** je počinjao suvišnim »Alleluia, alleluia« (Misal str. 329: počinje »Haec dies«); **sv. Bonifacije u vazmeno vrijeme** imao je jedan Alleluia umjesto dva; **vazmeni Aleluja s dva retka** nije imao Aleluja nakon prvoga retka (Misal, npr. str. [22]).
- **Znak »~«** iz izvornih datoteka vidio se u nekoliko antifona (npr. prikazna pjesma Posvete crkve, ulazna BDM Kraljice).
- **Oznake čitanja** (uz T13): Rim 6, 19-23 i Deut 26, 1-11.
- **Hrvatski tipfeleri** (uz T14): »kraIjuje«, »»ospodine«, »zavaljujemo« (predslovlje), »spasnosno«, »na na nebu«, »svojini«, »nas. molimo«, »zajedrio«.
- **Aleluja u hrvatskom stupcu** (uz T08–T10): u ulaznim, prikaznim i pričesnim pjesmama te gradualima sada je u oba stupca isti broj; test to provjerava za svaki napjev.
- **Na stranici** (uz W nalaze): klik na prvu karticu nije radio kad je prva kartica obred prije mise (Svijećnica, Pepelnica); gumbi prethodni/sljedeći izlazili su sa zaslona pri 160 %; mjesečna mreža rezala je naslove usred riječi.

Svaki ispravak teksta s izvornim čitanjem: `TYPOS.md`, odjeljak *Corrected*. Ispravci su podaci, ne kod: `data/corpus/patches.yaml` (latinski), `data/tm/corrections.yaml` (hrvatski), `data/tm/rites-hr.yaml` (obredi), `data/calendar/names.yaml` (imena).

## Umetnuta imena — za pregled

Latinski oblik uzet je iz Misala gdje on tu molitvu tiska s imenom, inače pravilnom deklinacijom imena iz naslova blagdana; hrvatski je ime iz hrvatskog naslova blagdana u padežu koji rečenica traži. Molim pregledati svaki redak.

| Slavlje | Dio | Latinski | Hrvatski |
| --- | --- | --- | --- |
| sv. Antun, opat | molitva | …ercéssio nos, quǽsumus, Dómine, beáti Antónii Abbátis commé… | …, Gospodine, da nas zagovor blaženoga Antuna opata tebi pr… |
| sv. Antun, opat | prikazna | …Dómine, hóstias superpósitas sanctus Antónius Abbas, quǽsum… | …, Gospodine, da nam zagovorom svetoga Antuna opata ove žrt… |
| sv. Antun, opat | popričesna | …cum tui perceptióne sacraménti beátus Antónius Abbas, pro no… | …e tajne zajedno sa zagovorom blaženog Antuna opata, da se… |
| bl. Alojzije Stepinac, biskup i mučenik | molitva | …pondus própriæ actiónis gravat, beáti Aloísii Mártyris tui… | …nas zaštiti slavni zagovor blaženoga Alojzija, Tvoga mučeni… |
| bl. Alojzije Stepinac, biskup i mučenik | prikazna | …Hóstias tibi, Dómine, beáti Aloísii Mártyris tui… | …o Ti ih prinosimo zaslugama blaženoga Alojzija, Tvoga mučeni… |
| bl. Alojzije Stepinac, biskup i mučenik | popričesna | …exséquimur cultum, intercedénte beáto Aloísio Mártyre tuo a… | …ine, Bože naš, da zagovorom blaženoga Alojzija, Tvoga mučeni… |
| sv. Florijan, mučenik, drugi zaštitnik Nadbiskupije | molitva | …sumus, omnípotens Deus: ut, qui beáti Floriáni Mártyris tui… | …koji svetkujemo rođeni dan blaženoga Florijana, Tvoga mučeni… |
| sv. Leopold Mandić, prezbiter, priznavalac (prosni dan) | molitva | …Deus, qui nos beáti Leopóldi Confessóris t… | …juješ godišnjom svetkovinom blaženoga Leopolda, priznavaoca… |
| Spomen sv. Oca (godišnjica uvođenja u papinsku službu) | molitva | …délium pastor et rector, fámulum tuum Leónem, quem pastóre… | …ka, pogledaj milostivo na slugu svoga Lava, koga si htio… |
| Spomen sv. Oca (godišnjica uvođenja u papinsku službu) | prikazna | …e, placáre munéribus: et fámulum tuum Leónem, quem pastóre… | …neprestanom zaštitom vodi slugu svoga Lava koga si posta… |
| Spomen sv. Oca (godišnjica uvođenja u papinsku službu) | popričesna | …i percéptio prótegat: et fámulum tuum Leónem, quem pastóre… | …olimo, Gospodine, čuva, a slugu tvoga Lava, koga si post… |
| SV. LADISLAV, KRALJ, ZAŠTITNIK NADBISKUPIJE | molitva | …Deus, qui nos beáti Ladislái Confessóris t… | …juješ godišnjom svetkovinom blaženoga Ladislava, priznavaoca… |
| sv. Marko Križevčanin, prezbiter i mučenik | molitva | …nípotens Deus: ut, intercedénte beáto Marco Mártyre tuo,… | …svemogući Bože, da zagovor blaženoga Marka, Tvoga mučeni… |
| sv. Marko Križevčanin, prezbiter i mučenik | popričesna | …exséquimur cultum, intercedénte beáto Marco Mártyre tuo,… | …ine, Bože naš, da zagovorom blaženoga Marka, mučenika Tvo… |
| sv. Nikola Tavelić, prezbiter i mučenik | molitva | …nípotens Deus: ut, intercedénte beáto Nicoláo Mártyre tuo,… | …svemogući Bože, da zagovor blaženoga Nikole, Tvoga mučeni… |
| sv. Nikola Tavelić, prezbiter i mučenik | popričesna | …exséquimur cultum, intercedénte beáto Nicoláo Mártyre tuo,… | …ine, Bože naš, da zagovorom blaženoga Nikole, mučenika Tvo… |
| sv. Saba, opat, priznavalac | prikazna | …Dómine, hóstias superpósitas sanctus Sabbas Abbas, quǽsum… | …, Gospodine, da nam zagovorom svetoga Sabe opata ove žrt… |
| sv. Saba, opat, priznavalac | popričesna | …cum tui perceptióne sacraménti beátus Sabbas Abbas, pro no… | …e tajne zajedno sa zagovorom blaženog Sabe opata, da se… |
| sv. Tekla, djevica, mučenica | molitva | …sumus, omnípotens Deus: ut, qui beátæ Theclæ Vírginis et M… | …i, koji svetkujemo rođeni dan blažene Tekle, Tvoje djevic… |
| sv. Tekla, djevica, mučenica | prikazna | …Súscipe, Dómine, múnera, quæ in beátæ Theclæ Vírginis et M… | …Ti ih prinosimo o svetkovini blažene Tekle, djevice i mu… |
| sv. Tekla, djevica, mučenica | popričesna | …mpta mystéria: et, intercedénte beáta Thecla Vírgine et M… | …njihovim učinkom i zagovorom blažene Tekle, djevice i mu… |
| sv. Kvirin Sisački, biskup i mučenik | molitva | …pondus própriæ actiónis gravat, beáti Quiríni Mártyris tui… | …nas zaštiti slavni zagovor blaženoga Kvirina, Tvoga mučeni… |
| sv. Kvirin Sisački, biskup i mučenik | prikazna | …Hóstias tibi, Dómine, beáti Quiríni Mártyris tui… | …o Ti ih prinosimo zaslugama blaženoga Kvirina, Tvoga mučeni… |
| sv. Kvirin Sisački, biskup i mučenik | popričesna | …exséquimur cultum, intercedénte beáto Quiríno Mártyre tuo a… | …ine, Bože naš, da zagovorom blaženoga Kvirina, Tvoga mučeni… |
| Veliki petak, molitva za papu | obred | …pro beatíssimo Papa nostro Leóne… | …za preblaženoga Papu našega Lava… |
| Vazmeno bdijenje, Exsultet | obred | …una cum beatíssimo Papa nostro Leóne, et Antístite nostro N.… | …skupa s preblaženim papom našim Lavom i biskupom I.… |
| sv. Urban I., 25. 5. (spomen) | molitva | …per beátum Urbánum Mártyrem tuum atque Summum Pontíficem… | …po zagovoru blaženoga Urbana, tvoga mučenika i pape… |
| sv. Soter i sv. Kajo, 22. 4. | molitva | …per beátos Sotérem et Cajum Mártyres tuos… | …po zagovoru blaženih Sotera i Kaja, tvojih mučenika i papa… |
| sv. Anicet, 17. 4. (spomen) | molitva | …per beátum Anicétum… | …blaženoga Aniceta… (bilo: Higina) |

Sv. Florijan (4. 5.) osim imena ima i druge molitve nego prije (vidi gore). Prikazna i popričesna sv. Florijana i sv. Ladislava te prikazna i popričesna sv. Leopolda ne spominju ime, pa u njima nema umetanja.

Dva teksta u Vazmenom bdijenju sastavljena su iz dvaju izvora i zato ih također treba pregledati:

- **Predslovlje**: uskrsno predslovlje stare stranice, s promjenjivim riječima »osobito *ove noći*« prema Kniewaldu 1942., str. 298 (stara stranica ima »danas« i »u ovo«).
- **Antifona »Et valde mane«** uz Benedictus: rečenica Mk 16, 2 iz uskrsnog evanđelja stare stranice (»I prvoga dana po suboti, vrlo rano, kad je sunce izlazilo, dođu na grob«) s dodanim »aleluja«.

## Što još čeka prevoditelja

`ZA-PRIJEVOD.md` u korijenu projekta: 3 teksta misa i 12 redaka Vazmenog bdijenja, svaki s latinskim tekstom, mjestom gdje se javlja te točnom datotekom i ključem pod koji se hrvatski upisuje. Nakon upisa dovoljna je naredba `npm run deploy`.

## Što nije provjereno

- **Firefox**: Playwrightov Firefox se na ovom računalu ne pokreće; prikazi dana, mjeseca, godine i pretrage provjereni su u Chromiumu i WebKitu (340 px, 100 / 130 / 160 %, svijetla i tamna tema; 140 slučajeva bez vodoravnog pomaka).
- **Stvarni iPhone**: pogreška s fontom ponovljena je i uklonjena u Playwright WebKitu s profilom iPhonea, ne na uređaju.

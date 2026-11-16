# Tekstovi kojima nedostaje hrvatski prijevod

Ovdje su svi tekstovi koji se na stranici prikazuju samo latinski, s napomenom »hrvatski prijevod nedostaje«. Nema ih ni stara stranica tradicionalnamisa.com ni Kniewaldov *Rimski misal* (1942. i 1930.), a pravilo je projekta da se liturgijski tekst ne prevodi samostalno. Popis se pri svakoj izgradnji stranice sastavlja iznova, pa je uvijek točan.

Kad netko ovlašten dade prijevod, upisuje se ovako i objavljuje naredbom `npm run deploy`:

- **tekst mise**: u datoteku `data/tm/corrections.yaml` dodati unos s latinskim tekstom (`la`, točno kako je niže ispisan), hrvatskim (`hr`) i izvorom (`source`);
- **redak obreda**: u datoteku `data/tm/rites-hr.yaml` dodati unos pod navedenim ključem.

Primjeri upisa stoje na početku tih dviju datoteka.

## Tekstovi misa (3)

### 1. sv. Toma iz Villanove, biskup, priznavalac — molitva

- Gdje se javlja: prvi put 22. 9. 2026. (opći kalendar), ukupno 1 puta u godinama 2026.–2036.; obrazac `Sancti/09-22o`, dio `Oratio`.
- Latinski:

  > Annue, quǽsumus, omnípotens Deus: ut sanctórum Martyrum tuórum Maurítii et Sociórum ejus nos lætíficet festíva sollémnitas; ut, quorum suffrágiis nítimur, eórum natalítiis gloriémur.

- Upis u `data/tm/corrections.yaml`:

  ```yaml
  - id: prijevod-Sancti-09-22o-Oratio
    la: "Annue, quǽsumus, omnípotens Deus: ut sanctórum Martyrum tuórum Maurítii et Sociórum ejus nos lætíficet festíva sollémnitas; ut, quorum suffrágiis nítimur, eórum natalítiis gloriémur."
    hr: "…ovdje hrvatski tekst…"
    source: "…tko je preveo ili odakle je uzeto…"
  ```

### 2. sv. Toma iz Villanove, biskup, priznavalac — prikazna molitva

- Gdje se javlja: prvi put 22. 9. 2026. (opći kalendar), ukupno 1 puta u godinama 2026.–2036.; obrazac `Sancti/09-22o`, dio `Secreta`.
- Latinski:

  > Réspice, quǽsumus, Dómine, múnera, quæ in sanctórum Mártyrum tuórum Maurítii et Sociórum ejus commemoratióne deférimus: et præsta; ut, quorum honóre sunt grata, eórum nobis fiant intercessióne perpétua.

- Upis u `data/tm/corrections.yaml`:

  ```yaml
  - id: prijevod-Sancti-09-22o-Secreta
    la: "Réspice, quǽsumus, Dómine, múnera, quæ in sanctórum Mártyrum tuórum Maurítii et Sociórum ejus commemoratióne deférimus: et præsta; ut, quorum honóre sunt grata, eórum nobis fiant intercessióne perpétua."
    hr: "…ovdje hrvatski tekst…"
    source: "…tko je preveo ili odakle je uzeto…"
  ```

### 3. BDM Kraljica — gradual

- Gdje se javlja: prvi put 31. 5. 2027. (opći kalendar), ukupno 1 puta u godinama 2026.–2036.; obrazac `Sancti/05-31`, dio `Graduale`.
- Latinski:

  > Ipse habet in vestiménto et in fémore suo scriptum: Rex regum et Dóminus dominántium. Regína adstat ad déxteram eius, ornáta auro ex Ophir. Allelúia, allelúia. Salve, Regína misericórdiæ, tu nos ab hoste prótege, et mortis hora súscipe. Allelúia.

- Upis u `data/tm/corrections.yaml`:

  ```yaml
  - id: prijevod-Sancti-05-31-Graduale
    la: "Ipse habet in vestiménto et in fémore suo scriptum: Rex regum et Dóminus dominántium. Regína adstat ad déxteram eius, ornáta auro ex Ophir. Allelúia, allelúia. Salve, Regína misericórdiæ, tu nos ab hoste prótege, et mortis hora súscipe. Allelúia."
    hr: "…ovdje hrvatski tekst…"
    source: "…tko je preveo ili odakle je uzeto…"
  ```

## Redci obreda (12)

Svi su iz Vazmenog bdijenja (obred iz 1955., kojega u Kniewaldovu misalu iz 1942. još nema).

### 1. De benedictione cerei Paschalis

- Ključ: `Tempora/Quad6-6r:Prelude#1.0`
- Latinski:

  > [Novo igne benedicto, acolythus, seu unus ministrantium, portat cereum paschalem in medium, ante celebrantem, qui cum stilo, inter extrema foramina ad insertionem granorum incensi destinata, incidit crucem. Deinde facit super earn litteram græcam Alpha, subtus vero litteram Omega, et inter bracchia crucis quatuor numeros exprimentes annum currentem, interim dicens:]
  > Christus heri et hódie, (incidit hastam erectam)
  > Princípium et Finis, (incidit hastam transversam)
  > Alpha (incidit supra hastam erectam litteram &Alpha;)
  > et Omega; (incidit subtus hastam erectam litteram &Omega;)
  > Ipsíus sunt témpora (incidit primum numerum anni currentis in angulo sinistro superiore crucis)
  > et sǽcula; (incidit secundum numerum anni currentis in angulo dextro superiore crucis)
  > Ipsi gloria et imperium (incidit tertium numerum anni currentis in angulo sinistro inferiore crucis)
  > per universa æternitátis sǽcula. Amen. (incidit quartum numerum anni currentis in angulo dextro inferiore crucis)

- Upis u `data/tm/rites-hr.yaml`:

  ```yaml
  "Tempora/Quad6-6r:Prelude#1.0":
    hr: "…ovdje hrvatski tekst; novi red piše se kao \n…"
    source: "…tko je preveo ili odakle je uzeto…"
  ```

### 2. De benedictione cerei Paschalis

- Ključ: `Tempora/Quad6-6r:Prelude#1.1`
- Latinski:

  > [Incisione crucis et aliorum signorum, quæ coloribus vel alio modo antea præparari possunt, peracta, diaconus, seu alius ministranttiun, præbet celebranti grana incensi, quæ idem celebrans, si non sunt benedicta ter aspergit et ter adolet incenso, nihil dicens. Deinde infigit quinque grana in foramina, interim dicens:]
  > Per sua sancta vúlnera
  > gloriósa
  > custódiat
  > et consérvet nos
  > Christus Dóminus. Amen.

- Upis u `data/tm/rites-hr.yaml`:

  ```yaml
  "Tempora/Quad6-6r:Prelude#1.1":
    hr: "…ovdje hrvatski tekst; novi red piše se kao \n…"
    source: "…tko je preveo ili odakle je uzeto…"
  ```

### 3. De benedictione cerei Paschalis

- Ključ: `Tempora/Quad6-6r:Prelude#1.2`
- Latinski:

  > [Tum diaconus, seu unus ministrantium, porrigit celebranti parvam candelam, de novo igne accensam, qua cereum accendit, dicens:]
  > Lumen Christi glorióse resurgéntis
  > Díssipet ténebras cordis et mentis.
  > [Mox, celebrans benedicit cereum accensum, dicens:]
  > ℣. Dóminus vobíscum. ℟. Et cum spíritu tuo.
  > Orémus.
  > Véniat, quǽsumus, omnípotens Deus, super hoc incénsum céreum larga tuæ bene + dictiónis infúsio: et hunc noctúrnum splendórem invisíbilis regenerátor, inténde; ut non solum sacrifícium, quod hac nocte litátum est, arcána lúminis tui admixtióne refúlgeat; sed in quocúmque loco ex hujus sanctificatiónis mystério aliquid fúerit deportátum, expúlsa diabólicæ fraudis nequítia, virtus tuæ majestátis assístat. Per Christum Dóminum nostrum.
  > ℟. Amen.

- Upis u `data/tm/rites-hr.yaml`:

  ```yaml
  "Tempora/Quad6-6r:Prelude#1.2":
    hr: "…ovdje hrvatski tekst; novi red piše se kao \n…"
    source: "…tko je preveo ili odakle je uzeto…"
  ```

### 4. De præconio paschali

- Ključ: `Tempora/Quad6-6r:Prelude#3.0`
- Latinski:

  > [Tunc celebrans vadit ad locum suum in choro, in latere Epistolæ; subdiaconus cum cruce stat in latere Evangelii, contra legile; clerus locum suum occupat in scamnis.]
  > [Diaconus deponit cereum paschalem in medio chori, supra parvum sustentaculum, et, postquam celebrans posuerit incensum in thuribulo, accipiens librum, petit benedictionem, dicens:]
  > Iube, domne, benedícere.
  > [Et celebrans subiungit:]
  > Dóminus sit in corde tuo, et in lábiis tuis, ut digne et competénter annúntiem suum paschále præcónium: in nómine Patris, et Fílii, + et Spíritus Sancti.
  > [Et diaconus respondet:]
  > Amen.
  > [(Sacerdos deponit cereum paschalem in medio chori, supra parvum sustentaculum, seque recipit ad abacum; crucifer stat in latere Evangelii, contra legile; ceteri ministrantes disponuntur hinc et inde.]
  > [Sacerdos vero, postquam posuerit incensum in thuribulo, accepto libro, dicit: Iube, Dómine, benedícere. - Dóminus sit in corde meo, et in lábiis meis: ut digne et competénter annúntiem suum paschále præcónium. Amen.)]

- Upis u `data/tm/rites-hr.yaml`:

  ```yaml
  "Tempora/Quad6-6r:Prelude#3.0":
    hr: "…ovdje hrvatski tekst; novi red piše se kao \n…"
    source: "…tko je preveo ili odakle je uzeto…"
  ```

### 5. De renovatione promissionum baptismatis

- Ključ: `Tempora/Quad6-6r:Prelude#7.2`
- Latinski:

  > Hac sacratíssima nocte, fratres caríssimi, sancta Mater Ecclésia, recólens Dómini nostri Iesu Christi mortem ei sepultúram, eum redamándo vígilat; et, célebrans eiúsdem gloriósam resurrectiónem, lætabúnda gáudet.

- Upis u `data/tm/rites-hr.yaml`:

  ```yaml
  "Tempora/Quad6-6r:Prelude#7.2":
    hr: "…ovdje hrvatski tekst; novi red piše se kao \n…"
    source: "…tko je preveo ili odakle je uzeto…"
  ```

### 6. De renovatione promissionum baptismatis

- Ključ: `Tempora/Quad6-6r:Prelude#7.3`
- Latinski:

  > Quóniam vero, ut docet Apóstolus, consepúlti sumus cum Christo per baptísmum in mortem, quómodo Christus resurréxit a mórtuis, ita et nos in novitáte vitæ opórtet ambuláre; sciéntes, véterem hóminem nostrum simul cum Christo crucifíxum esse, ut ultra non serviámus peccáto. Existimémus ergo nos mórtuos quidem esse peccáto, vivéntis áutem Deo in Christo Iesu Dómino nostro.

- Upis u `data/tm/rites-hr.yaml`:

  ```yaml
  "Tempora/Quad6-6r:Prelude#7.3":
    hr: "…ovdje hrvatski tekst; novi red piše se kao \n…"
    source: "…tko je preveo ili odakle je uzeto…"
  ```

### 7. De renovatione promissionum baptismatis

- Ključ: `Tempora/Quad6-6r:Prelude#7.4`
- Latinski:

  > Quaprópter, fratres caríssimi, quadragesimáli exercitatióne absolúta, sancti baptísmatis promissiónis renovémus, quibus olim sátanæ et opéribus eius, sicut et mundo, qui inimícus est Dei, abrenuntiávimus, et Deo in sancta Ecclésia cathólica fidéliter servíre promísimus.

- Upis u `data/tm/rites-hr.yaml`:

  ```yaml
  "Tempora/Quad6-6r:Prelude#7.4":
    hr: "…ovdje hrvatski tekst; novi red piše se kao \n…"
    source: "…tko je preveo ili odakle je uzeto…"
  ```

### 8. De renovatione promissionum baptismatis

- Ključ: `Tempora/Quad6-6r:Prelude#7.5`
- Latinski:

  > Itaque:
  > Abrenuntiátis Sátanæ?
  > O. Abrenuntiámus.
  > Et ómnibus opéribus eius?
  > O. Abrenuntiámus.
  > Et ómnibus pompis eius?
  > O. Abrenuntiámus.
  > Créditis in Deum, Patrem omnipoténtem, Creatórem cœli et terræ?
  > O. Crédimus.
  > Créditis in Iesum Christum, Fílium eius únicum, Dóminum nostrum, natum et passum?
  > O. Crédimus.
  > Créditis et in Spíritum Sanctum, sanctam Ecclésiam cathólicam, Sanctórum communiónem, remissiónem peccatórem, carnis resurrectiónem, et vitam ætérnam?
  > O. Crédimus.
  > Nunc áutem una simul Deum precémur, sicut Dóminus noster Iesus Christus oráre nos dócuit:
  > O. Pater noster, qui es in cœlis, sanctificétur nomen tuum. Advéniat regnum tuum. Fiat volúntas tua, sicut in cœlo et in terra. Panem nostrum quotidiánum da nobis hódie, et dimítte nobis débita nostra, sicut et nos dimíttimus debitóribus nostris. Et ne nos indúcas in tentatiónem, sed líbera nos a malo.
  > Et Deus omnípotens, Pater Dómini nostri Iesu Christi, qui nos regenerávit ex aqua et Spíritu Sancto, quique nobis dedit remissiónem peccatórum, ipse nos custódiat grátia sua in eódem Christo Iesu Dómino nostro in vitam ætérnam.
  > O. Amen.

- Upis u `data/tm/rites-hr.yaml`:

  ```yaml
  "Tempora/Quad6-6r:Prelude#7.5":
    hr: "…ovdje hrvatski tekst; novi red piše se kao \n…"
    source: "…tko je preveo ili odakle je uzeto…"
  ```

### 9. De Missa solemni Vigiliæ paschalis

- Ključ: `Tempora/Quad6-6r:Prelude#9.3`
- Latinski:

  > [Celebrans benedicit, dicens:]
  > Ab illo bene + dicáris, in cujus honore cremáberis. Amen.

- Upis u `data/tm/rites-hr.yaml`:

  ```yaml
  "Tempora/Quad6-6r:Prelude#9.3":
    hr: "…ovdje hrvatski tekst; novi red piše se kao \n…"
    source: "…tko je preveo ili odakle je uzeto…"
  ```

### 10. Pro Láudibus

- Ključ: `vigil:laudes-ps150`
- Latinski:

  > Ant. Allelúia, allelúia, allelúia.
  > Psalmus 150
  > Laudáte Dóminum in sanctis eius * laudáte eum in firmaménto virtútis eius.
  > Laudáte eum in virtútibus eius, * laudáte eum secúndum multitúdinem magnitúdinis eius.
  > Laudáte eum in sono tubæ, * laudáte eum in psaltério, et cíthara.
  > Laudáte eum in týmpano, et choro: * laudáte eum in chordis et órgano.
  > Laudáte eum in cýmbalis benesonántibus: laudáte eum in cýmbalis iubilatiónis: * omnes spíritus laudet Dóminum.
  > Glória Patri, et Fílio, et Spirítui Sancto. Sicut erat in princípio, et nunc, et semper, et in sǽcula sæculórum. Amen.
  > Ant. Allelúia, allelúia, allelúia.

- Upis u `data/tm/rites-hr.yaml`:

  ```yaml
  "vigil:laudes-ps150":
    hr: "…ovdje hrvatski tekst; novi red piše se kao \n…"
    source: "…tko je preveo ili odakle je uzeto…"
  ```

### 11. Pro Láudibus

- Ključ: `vigil:laudes-benedictus`
- Latinski:

  > Luc 1:68-79
  > Benedíctus ✠ Dóminus, Deus Israël: * quia visitávit, et fecit redemptiónem plebis suæ:
  > Et eréxit cornu salútis nobis: * in domo David, púeri sui.
  > Sicut locútus est per os sanctórum, * qui a sǽculo sunt, prophetárum ejus:
  > Salútem ex inimícis nostris, * et de manu ómnium, qui odérunt nos.
  > Ad faciéndam misericórdiam cum pátribus nostris: * et memorári testaménti sui sancti.
  > Jusjurándum, quod jurávit ad Ábraham patrem nostrum, * datúrum se nobis:
  > Ut sine timóre, de manu inimicórum nostrórum liberáti, * serviámus illi.
  > In sanctitáte, et justítia coram ipso, * ómnibus diébus nostris.
  > Et tu, puer, Prophéta Altíssimi vocáberis: * præíbis enim ante fáciem Dómini, paráre vias ejus:
  > Ad dandam sciéntiam salútis plebi ejus: * in remissiónem peccatórum eórum:
  > Per víscera misericórdiæ Dei nostri: * in quibus visitávit nos, óriens ex alto:
  > Illumináre his, qui in ténebris, et in umbra mortis sedent: * ad dirigéndos pedes nostros in viam pacis.
  > Glória Patri, et Fílio, et Spirítui Sancto. Sicut erat in princípio, et nunc, et semper, et in sǽcula sæculórum. Amen.

- Upis u `data/tm/rites-hr.yaml`:

  ```yaml
  "vigil:laudes-benedictus":
    hr: "…ovdje hrvatski tekst; novi red piše se kao \n…"
    source: "…tko je preveo ili odakle je uzeto…"
  ```

### 12. De præconio paschali

- Ključ: `vigil:exsultet-respice`
- Latinski:

  > Réspice étiam ad eos, qui nos in potestáte regunt, et, ineffábili pietátis et misericórdiæ tuæ múnere, dírige cogitatiónes eórum ad iustítiam et pacem, ut de terréna operositáte ad cæléstem pátriam pervéniant cum omni populo tuo.

- Upis u `data/tm/rites-hr.yaml`:

  ```yaml
  "vigil:exsultet-respice":
    hr: "…ovdje hrvatski tekst; novi red piše se kao \n…"
    source: "…tko je preveo ili odakle je uzeto…"
  ```

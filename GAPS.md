# Gaps: Latin shown alone with the note "hrvatski prijevod nedostaje"

Croatian coverage of the Masses of 2026–2036 (both calendars), distinct text blocks: 6232; from the old site 6186; from Kniewald 41; missing 5.
Counting every occurrence over the eleven years: 49330 blocks; old site 48990; Kniewald 318; missing 22.

## Mass texts without Croatian

- Sancti/04-22 — Oratio (sv. Soter i sv. Kajo, pape, mučenici; first on 2026-04-22, 1× in 2026–2036): Gregem tuum, Pastor ætérne, placátus inténde: et per beátos Sotérem et Cajum Mártyres tuos atque Summos Pontíf…
- Sancti/09-22o — Oratio (sv. Toma iz Villanove, biskup, priznavalac; first on 2026-09-22, 1× in 2026–2036): Annue, quǽsumus, omnípotens Deus: ut sanctórum Martyrum tuórum Maurítii et Sociórum ejus nos lætíficet festíva…
- Sancti/09-22o — Secreta (sv. Toma iz Villanove, biskup, priznavalac; first on 2026-09-22, 1× in 2026–2036): Réspice, quǽsumus, Dómine, múnera, quæ in sanctórum Mártyrum tuórum Maurítii et Sociórum ejus commemoratióne d…
- Sancti/05-25o — Oratio (sv. Grgur VII., papa, priznavalac; first on 2027-05-25, 1× in 2026–2036): Gregem tuum, Pastor ætérne, placátus inténde: et, per beátum Urbánum Mártyrem tuum atque Summum Pontíficem, pe…
- Sancti/05-31 — Graduale (BDM Kraljica; first on 2027-05-31, 1× in 2026–2036): Ipse habet in vestiménto et in fémore suo scriptum: Rex regum et Dóminus dominántium. Regína adstat ad déxtera…

## Rites without Croatian (rows)

- Tempora/Quad6-6r:Prelude: 9 rows (Latin from Divinum Officium; the old site has no page for this rite)

To fill a gap: add the Croatian to `data/tm/kniewald-found.json` (ids in `data/tm/gaps-for-kniewald.json` and `data/tm/rite-gaps.json`), run `npx tsx scripts/croatian/apply-kniewald.ts`, then `npm run build`.

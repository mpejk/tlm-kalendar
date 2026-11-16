# Gaps: Latin shown alone with the note "hrvatski prijevod nedostaje"

Croatian coverage of the Masses of 2026–2036 (both calendars), distinct text blocks: 6241; from the old site 6193; from Kniewald 45; missing 3.
Counting every occurrence over the eleven years: 49301 blocks; old site 48998; Kniewald 292; missing 11.

## Mass texts without Croatian

- Sancti/09-22o — Oratio (sv. Toma iz Villanove, biskup, priznavalac; first on 2026-09-22, 1× in 2026–2036): Annue, quǽsumus, omnípotens Deus: ut sanctórum Martyrum tuórum Maurítii et Sociórum ejus nos lætíficet festíva…
- Sancti/09-22o — Secreta (sv. Toma iz Villanove, biskup, priznavalac; first on 2026-09-22, 1× in 2026–2036): Réspice, quǽsumus, Dómine, múnera, quæ in sanctórum Mártyrum tuórum Maurítii et Sociórum ejus commemoratióne d…
- Sancti/05-31 — Graduale (BDM Kraljica; first on 2027-05-31, 1× in 2026–2036): Ipse habet in vestiménto et in fémore suo scriptum: Rex regum et Dóminus dominántium. Regína adstat ad déxtera…

## Rites without Croatian (rows)

- Tempora/Quad6-6r:Prelude: 9 rows (Latin from Divinum Officium; the old site has no page for this rite)
- vigil:laudes-ps150: 1 rows (Latin from Divinum Officium; the old site has no page for this rite)
- vigil:laudes-benedictus: 1 rows (Latin from Divinum Officium; the old site has no page for this rite)
- vigil:exsultet-respice: 1 rows (Latin from Divinum Officium; the old site has no page for this rite)

To fill a gap: add the Croatian to `data/tm/kniewald-found.json` (ids in `data/tm/gaps-for-kniewald.json` and `data/tm/rite-gaps.json`), run `npx tsx scripts/croatian/apply-kniewald.ts`, then `npm run build`.

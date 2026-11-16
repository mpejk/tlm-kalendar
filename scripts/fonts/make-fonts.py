# Makes the font files the site ships (src/site/fonts/) from EB Garamond (SIL OFL 1.1, no Reserved Font Name).
# Only needed again if the typeface is updated; the results are committed, so building the site does not need Python.
#
#   python3 -m pip install --target tools-py fonttools brotli
#   python3 -I scripts/fonts/make-fonts.py tools-py
#
# What it changes: EB Garamond's upright cuts carry an OpenType `locl` rule for text tagged as Latin (lang="la") that draws
# u with the outline of v (U.LAT, u.LAT, v.LAT: the classical spelling "DEVS"). The missal spells with u, and iOS Safari
# applies the rule even when CSS switches `locl` off. The Latin language system is therefore removed from the font files
# themselves, so Latin text is shaped with the default rules. Nothing else is touched. The file for the two signs ℟ ℣ is cut
# down to those two glyphs (the full file had the same rule).
import sys, os
sys.path.insert(0, os.path.abspath(sys.argv[1]))
from fontTools.ttLib import TTFont
from fontTools import subset

SRC = 'node_modules/@fontsource/eb-garamond/files'
OUT = 'src/site/fonts'
NOTE = ' Modified for tlm-kalendar: the OpenType language system for Latin (locl u/v forms) is removed.'

def strip_lat(font):
    removed = 0
    for tag in ('GSUB', 'GPOS'):
        if tag not in font: continue
        t = font[tag].table
        if not t.ScriptList: continue
        for sr in t.ScriptList.ScriptRecord:
            keep = [r for r in sr.Script.LangSysRecord if r.LangSysTag.strip() != 'LAT']
            removed += len(sr.Script.LangSysRecord) - len(keep)
            sr.Script.LangSysRecord = keep; sr.Script.LangSysCount = len(keep)
    # the removed forms can no longer be reached; make that certain by emptying every single substitution to a *.LAT glyph
    if 'GSUB' in font:
        for lk in font['GSUB'].table.LookupList.Lookup:
            for st in lk.SubTable:
                st = getattr(st, 'ExtSubTable', st)
                m = getattr(st, 'mapping', None)
                if isinstance(m, dict):
                    for k in [k for k, v in m.items() if isinstance(v, str) and v.endswith('.LAT')]: del m[k]
    return removed

for style in ('400-normal', '400-italic', '600-normal'):
    for sub in ('latin', 'latin-ext'):
        f = TTFont(f'{SRC}/eb-garamond-{sub}-{style}.woff2')
        n = strip_lat(f)
        for rec in f['name'].names:
            if rec.nameID == 0: rec.string = rec.toUnicode() + NOTE
        f.flavor = 'woff2'
        out = f'{OUT}/ebg-{sub}-{style}.woff2'
        f.save(out); print(out, 'LAT language systems removed:', n, os.path.getsize(out), 'bytes')

# the signs ℟ ℣ only (a plain TrueType file of about 3 kB: every browser and tool reads it)
opts = subset.Options(); opts.layout_features = []; opts.notdef_outline = True; opts.name_IDs = [0, 1, 2, 3, 4, 6]
f = TTFont('data/raw/fonts/EBGaramond.ttf')
if 'fvar' in f:   # the source is a variable font: a plain regular-weight file is enough for two signs
    from fontTools.varLib import instancer
    f = instancer.instantiateVariableFont(f, {'wght': 400}, overlap=instancer.OverlapMode.KEEP_AND_DONT_SET_FLAGS)
s = subset.Subsetter(opts); s.populate(unicodes=[0x211F, 0x2123]); s.subset(f)
for rec in f['name'].names:
    if rec.nameID == 0: rec.string = rec.toUnicode() + ' Subset for tlm-kalendar: the signs U+211F and U+2123 only.'
# clear the "overlapping contours" flag of the outlines: older WOFF2 decoders refuse files that carry it
for name in f.getGlyphOrder():
    g = f['glyf'][name]
    if g.numberOfContours > 0 and len(g.flags): g.flags[0] &= ~0x40
out = f'{OUT}/ebg-vr.ttf'; f.save(out); print(out, os.path.getsize(out), 'bytes', f.getGlyphOrder())

"""Cuts fixed-weight Bricolage Grotesque and Figtree fonts from the variable
originals: TTF for the app, WOFF2 for the web.

    python docs/brand/cut_fonts.py <outdir>

Needs bricolage.ttf and figtree.ttf (the variable fonts, OFL, from
github.com/google/fonts ofl/bricolagegrotesque and ofl/figtree) next to this
script. Copy the .ttf files to client/assets/fonts and the .woff2 files to
website/src/app/fonts and admin/src/fonts. Every cut must contain the rupee sign.
"""
import os, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

# Bricolage at optical size 72 (same as the logo); widths then match Cabinet Grotesk.
CUTS = [
    ('bricolage.ttf', 'Bricolage Grotesque', 'Medium', 500, {'wght': 500, 'opsz': 72, 'wdth': 100}),
    ('bricolage.ttf', 'Bricolage Grotesque', 'Bold', 700, {'wght': 700, 'opsz': 72, 'wdth': 100}),
    ('bricolage.ttf', 'Bricolage Grotesque', 'ExtraBold', 800, {'wght': 800, 'opsz': 72, 'wdth': 100}),
    ('figtree.ttf', 'Figtree', 'Regular', 400, {'wght': 400}),
    ('figtree.ttf', 'Figtree', 'Medium', 500, {'wght': 500}),
    ('figtree.ttf', 'Figtree', 'SemiBold', 600, {'wght': 600}),
    ('figtree.ttf', 'Figtree', 'Bold', 700, {'wght': 700}),
]


def rename(font, family, style, weight):
    ps = family.replace(' ', '') + '-' + style
    name = font['name']
    # Drop the variable-font name records, then write plain static ones.
    name.names = [n for n in name.names if n.nameID not in (1, 2, 3, 4, 6, 16, 17, 25) and n.nameID < 256]
    legacy_style = 'Regular' if style not in ('Regular', 'Bold') else style
    legacy_family = family if style in ('Regular', 'Bold') else f'{family} {style}'
    for nid, val in [(1, legacy_family), (2, legacy_style), (3, f'{ps};static'), (4, f'{family} {style}'),
                     (6, ps), (16, family), (17, style)]:
        name.setName(val, nid, 3, 1, 0x409)
    font['OS/2'].usWeightClass = weight
    fs = font['OS/2'].fsSelection & ~(0b1100001)  # clear italic/bold/regular bits
    fs |= 0b100000 if style == 'Bold' else (0b1000000 if style == 'Regular' else 0)
    font['OS/2'].fsSelection = fs
    font['head'].macStyle = 1 if style == 'Bold' else 0
    return ps


for src, family, style, weight, axes in CUTS:
    f = instancer.instantiateVariableFont(TTFont(os.path.join(HERE, src)), axes)
    for t in ('STAT', 'MVAR', 'HVAR', 'avar', 'fvar', 'gvar'):
        if t in f:
            del f[t]
    ps = rename(f, family, style, weight)
    assert 0x20B9 in f.getBestCmap(), ps + ' has no rupee'
    f.flavor = None
    f.save(os.path.join(OUT, ps + '.ttf'))
    f.flavor = 'woff2'
    f.save(os.path.join(OUT, ps + '.woff2'))
    print(ps, weight, os.path.getsize(os.path.join(OUT, ps + '.ttf')) // 1024, 'KB ttf,',
          os.path.getsize(os.path.join(OUT, ps + '.woff2')) // 1024, 'KB woff2')

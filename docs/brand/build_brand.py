"""Builds the Open Seat brand set: SVG masters + PNGs.

    python docs/brand/build_brand.py <outdir>

Needs font/bricolage.ttf next to this script (Bricolage Grotesque variable,
OFL, from github.com/google/fonts ofl/bricolagegrotesque) and Chrome.
Copy <outdir>/png/brand/*.png to client/assets/brand, svg/ to client/assets/svg,
and the 1024/2000px PNGs to client/assets/png.
"""
import math, os, subprocess, sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1]
os.makedirs(os.path.join(OUT, 'svg'), exist_ok=True)
os.makedirs(os.path.join(OUT, 'png'), exist_ok=True)

ORANGE, CREAM, DARK, INK, LIGHT, PILL = '#FF6B35', '#F1E9D8', '#141110', '#171310', '#F5F0EB', '#F3EEE8'
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

# ---------- wordmark outlines ----------
vf = TTFont(os.path.join(HERE, 'font', 'bricolage.ttf'))
font = instancer.instantiateVariableFont(vf, {'wght': 700, 'opsz': 72, 'wdth': 100})
UPM = font['head'].unitsPerEm
cmap = font.getBestCmap()
gs = font.getGlyphSet()
hmtx = font['hmtx']


def kern(left, right):
    gpos = font['GPOS'].table
    idx = set()
    for fr in gpos.FeatureList.FeatureRecord:
        if fr.FeatureTag == 'kern':
            idx.update(fr.Feature.LookupListIndex)
    total = 0
    for li in sorted(idx):
        lk = gpos.LookupList.Lookup[li]
        for st in lk.SubTable:
            if lk.LookupType == 9:
                st = st.ExtSubTable
            if getattr(st, 'LookupType', 2) != 2 and lk.LookupType not in (2, 9):
                continue
            cov = st.Coverage.glyphs
            if left not in cov:
                continue
            if st.Format == 1:
                for rec in st.PairSet[cov.index(left)].PairValueRecord:
                    if rec.SecondGlyph == right and rec.Value1 is not None:
                        total += getattr(rec.Value1, 'XAdvance', 0) or 0
                        break
            elif st.Format == 2:
                c1 = st.ClassDef1.classDefs.get(left, 0)
                c2 = st.ClassDef2.classDefs.get(right, 0)
                v = st.Class1Record[c1].Class2Record[c2].Value1
                if v is not None:
                    total += getattr(v, 'XAdvance', 0) or 0
    return total


TRACK = -0.035 * UPM
text = 'gorave'
names = [cmap[ord(c)] for c in text]
x = 0
paths = []
xmin = ymin = 1e9
xmax = ymax = -1e9
for i, n in enumerate(names):
    pen = SVGPathPen(gs)
    gs[n].draw(TransformPen(pen, (1, 0, 0, -1, x, 0)))  # flip y: baseline at 0
    paths.append(pen.getCommands())
    bp = BoundsPen(gs)
    gs[n].draw(bp)
    if bp.bounds:
        a, b, c, d = bp.bounds
        xmin, xmax = min(xmin, x + a), max(xmax, x + c)
        ymin, ymax = min(ymin, b), max(ymax, d)
    x += hmtx[n][0] + TRACK
    if i + 1 < len(names):
        x += kern(n, names[i + 1])

WM_D = ' '.join(paths)
# word box in font units (y down): top = -ymax, bottom = -ymin
WX, WY, WW, WH = xmin, -ymax, xmax - xmin, ymax - ymin
print('wordmark units', round(WW), round(WH), 'aspect', round(WW / WH, 4), 'upm', UPM)


def wordmark_svg(color):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{WX:.1f} {WY:.1f} {WW:.1f} {WH:.1f}">'
            f'<path fill="{color}" d="{WM_D}"/></svg>')


# ---------- the Open Seat mark (100-unit box, ring outer edge 14..86) ----------
def mark_g(ink, dot):
    return (f'<path d="M79.54 44.79 A30 30 0 1 1 55.21 20.46" fill="none" stroke="{ink}" stroke-width="12" stroke-linecap="round"/>'
            f'<circle cx="71.21" cy="28.79" r="8.5" fill="{dot}"/>')


def mark_svg(ink, dot):
    # tight square box around the ring (14..86)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="14 14 72 72">{mark_g(ink, dot)}</svg>'


def tile_svg(radius=True):
    r = 22.5 if radius else 0
    # mark at 46% of the tile, centred (ring box 72 -> scale so 72 units = 46)
    s = 46 / 72
    off = 50 - 50 * s
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
            f'<rect width="100" height="100" rx="{r}" fill="{DARK}"/>'
            f'<g transform="translate({off:.3f} {off:.3f}) scale({s:.4f})">{mark_g(LIGHT, ORANGE)}</g></svg>')


# ---------- lockup: mark + wordmark, in font units ----------
def lockup_svg(ink, dot):
    ring_d = 0.78 * UPM                      # ring outer diameter
    s = ring_d / 72                          # mark units -> font units
    centre_y = -(ymax + ymin) / 2            # optical centre of the word (y down)
    gap = 0.30 * UPM
    mx = 0
    my = centre_y - ring_d / 2
    wx_shift = ring_d + gap - xmin           # move word so its left edge sits after the gap
    top = min(my, -ymax)
    bottom = max(my + ring_d, -ymin)
    width = ring_d + gap + WW
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {top:.1f} {width:.1f} {bottom - top:.1f}">'
            f'<g transform="translate({mx - 14 * s:.2f} {my - 14 * s:.2f}) scale({s:.4f})">{mark_g(ink, dot)}</g>'
            f'<path transform="translate({wx_shift:.1f} 0)" fill="{ink}" d="{WM_D}"/></svg>'), width / (bottom - top)


# ---------- sticker: tilted cream pill, orange offset shadow, ink wordmark ----------
def sticker_svg():
    padx, pady = 0.40 * UPM, 0.22 * UPM
    pw, ph = WW + 2 * padx, WH + 2 * pady
    sh = 0.09 * UPM
    ang = -4
    # canvas big enough for rotation
    rad = math.radians(abs(ang))
    cw = (pw + sh) * math.cos(rad) + (ph + sh) * math.sin(rad) + 0.04 * UPM
    chh = (pw + sh) * math.sin(rad) + (ph + sh) * math.cos(rad) + 0.04 * UPM
    cx, cy = cw / 2, chh / 2
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {cw:.1f} {chh:.1f}">'
            f'<g transform="translate({cx:.1f} {cy:.1f}) rotate({ang}) translate({-pw / 2 - sh / 2:.1f} {-ph / 2 - sh / 2:.1f})">'
            f'<rect x="{sh:.1f}" y="{sh:.1f}" width="{pw:.1f}" height="{ph:.1f}" rx="{ph / 2:.1f}" fill="{ORANGE}"/>'
            f'<rect width="{pw:.1f}" height="{ph:.1f}" rx="{ph / 2:.1f}" fill="{PILL}"/>'
            f'<path transform="translate({padx - WX:.1f} {pady - WY:.1f})" fill="{INK}" d="{WM_D}"/>'
            f'</g></svg>'), cw / chh


def write(name, svg):
    p = os.path.join(OUT, 'svg', name)
    open(p, 'w', encoding='utf-8').write(svg)
    return p


def render(svg_path, png_name, w, h):
    html = os.path.join(OUT, '_r.html')
    uri = 'file:///' + svg_path.replace('\\', '/')
    open(html, 'w', encoding='utf-8').write(
        f'<html><body style="margin:0;background:transparent"><img src="{uri}" style="display:block;width:{w}px;height:{h}px"></body></html>')
    out = os.path.join(OUT, 'png', png_name)
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000',
                    '--force-device-scale-factor=1', f'--window-size={w},{h}', f'--screenshot={out}',
                    'file:///' + html.replace('\\', '/')], check=True, capture_output=True, timeout=60)
    os.remove(html)


wm_aspect = WW / WH
lk_cream, lk_aspect = lockup_svg(LIGHT, ORANGE)
lk_black, _ = lockup_svg(INK, ORANGE)
st, st_aspect = sticker_svg()

files = {
    'seal.svg': tile_svg(),                      # self-contained tile: works on dark and light
    'seal-black.svg': mark_svg(INK, ORANGE),     # for light backgrounds
    'seal-cream.svg': mark_svg(LIGHT, ORANGE),   # for dark backgrounds and photos
    'seal-cream-mono.svg': mark_svg(LIGHT, LIGHT),  # one colour: watermarks
    'seal-black-mono.svg': mark_svg(INK, INK),
    'wordmark-cream.svg': wordmark_svg(LIGHT),
    'wordmark-black.svg': wordmark_svg(INK),
    'lockup-horizontal.svg': lk_cream,
    'lockup-horizontal-black.svg': lk_black,
    'sticker-wordmark.svg': st,
    'app-icon.svg': tile_svg(radius=False),      # stores apply their own mask
}
paths = {k: write(k, v) for k, v in files.items()}

H = lambda w, a: round(w / a)
renders = [
    # phone-sized copies (client/assets/brand)
    ('seal.svg', 'brand/seal.png', 384, 384),
    ('seal-black.svg', 'brand/seal-black.png', 384, 384),
    ('seal-cream-mono.svg', 'brand/seal-cream.png', 384, 384),
    ('wordmark-cream.svg', 'brand/wordmark-cream.png', 720, H(720, wm_aspect)),
    ('wordmark-black.svg', 'brand/wordmark-black.png', 720, H(720, wm_aspect)),
    ('sticker-wordmark.svg', 'brand/sticker.png', 720, H(720, st_aspect)),
    ('lockup-horizontal.svg', 'brand/lockup.png', 900, H(900, lk_aspect)),
    # masters
    ('app-icon.svg', 'app-icon-1024.png', 1024, 1024),
    ('seal.svg', 'seal-tile-1024.png', 1024, 1024),
    ('seal-black.svg', 'seal-black-1024.png', 1024, 1024),
    ('seal-cream.svg', 'seal-cream-1024.png', 1024, 1024),
    ('wordmark-cream.svg', 'wordmark-cream.png', 2000, H(2000, wm_aspect)),
    ('wordmark-black.svg', 'wordmark-black.png', 2000, H(2000, wm_aspect)),
    ('sticker-wordmark.svg', 'sticker-wordmark.png', 2000, H(2000, st_aspect)),
    ('lockup-horizontal.svg', 'lockup-horizontal.png', 2000, H(2000, lk_aspect)),
]
os.makedirs(os.path.join(OUT, 'png', 'brand'), exist_ok=True)
for src, dst, w, h in renders:
    render(paths[src], dst, w, h)
    print('png', dst, w, h)
print('ASPECT wordmark', round(wm_aspect, 4), 'sticker', round(st_aspect, 4), 'lockup', round(lk_aspect, 4))

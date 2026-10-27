"""Original geometric lettering, drawn as paths (no font or external artwork).

Run from any directory: python packages/icons-svg/scripts/generate-lettering.py
Dependencies: pip install -r packages/icons-svg/scripts/requirements-lettering.txt
"""
import json
from pathlib import Path
from math import hypot, cos, sin, radians
from functools import lru_cache
from fontTools.pens.basePen import BasePen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.svgLib.path import parse_path
from shapely.geometry import LineString, Polygon
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
STYLES = ('outline', 'duotone', 'solid')
FORMS = ('plain', 'circle', 'square')
UPPER = {
    'A': 'M0 14L5 0L10 14M2 9H8',
    'B': 'M0 14V0H5.5A3.5 3.5 0 0 1 5.5 7H0M5.5 7H6.5A3.5 3.5 0 0 1 6.5 14H0',
    'C': 'M10 2C9 0.7 7.5 0 5.5 0H4A4 4 0 0 0 0 4V10A4 4 0 0 0 4 14H5.5C7.5 14 9 13.3 10 12',
    'D': 'M0 14V0H4A6 6 0 0 1 10 6V8A6 6 0 0 1 4 14Z',
    'E': 'M10 0H0V14H10M0 7H8',
    'F': 'M10 0H0V14M0 7H8',
    'G': 'M10 2C9 0.7 7.5 0 5.5 0H4A4 4 0 0 0 0 4V10A4 4 0 0 0 4 14H6A4 4 0 0 0 10 10V8H6',
    'H': 'M0 0V14M10 0V14M0 7H10',
    'I': 'M1 0H9M5 0V14M1 14H9',
    'J': 'M3 0H10V9A5 5 0 0 1 0 9',
    'K': 'M0 0V14M10 0L0 9M4 5.4L10 14',
    'L': 'M0 0V14H10',
    'M': 'M0 14V0L6 8L12 0V14',
    'N': 'M0 14V0L10 14V0',
    'O': 'M5 0A5 5 0 0 0 0 5V9A5 5 0 0 0 10 9V5A5 5 0 0 0 5 0Z',
    'P': 'M0 14V0H6A3.5 3.5 0 0 1 6 7H0',
    'Q': 'M5 0A5 5 0 0 0 0 5V9A5 5 0 0 0 10 9V5A5 5 0 0 0 5 0ZM6.5 10.5L11 15',
    'R': 'M0 14V0H6A3.5 3.5 0 0 1 6 7H0M5.5 7L10 14',
    'S': 'M10 2C9 0.6 7.5 0 5 0H3.5A3.5 3.5 0 0 0 3.5 7H6.5A3.5 3.5 0 0 1 6.5 14H5C2.5 14 1 13.4 0 12',
    'T': 'M0 0H10M5 0V14',
    'U': 'M0 0V9A5 5 0 0 0 10 9V0',
    'V': 'M0 0L5 14L10 0',
    'W': 'M0 0L3 14L7 5L11 14L14 0',
    'X': 'M0 0L10 14M10 0L0 14',
    'Y': 'M0 0L5 7L10 0M5 7V14',
    'Z': 'M0 0H10L0 14H10',
}
LOWER = {
    'a': 'M9 5V14M9 9.5A4.5 4.5 0 1 0 0 9.5A4.5 4.5 0 1 0 9 9.5Z',
    'b': 'M0 0V14M0 9.5A4.5 4.5 0 1 1 9 9.5A4.5 4.5 0 1 1 0 9.5Z',
    'c': 'M8 6.3A4.5 4.5 0 1 0 8 12.7',
    'd': 'M9 0V14M9 9.5A4.5 4.5 0 1 0 0 9.5A4.5 4.5 0 1 0 9 9.5Z',
    'e': 'M0 9.5H9A4.5 4.5 0 1 0 7.7 12.7',
    'f': 'M3 14V4Q3 0 7 0H9M0 5H7',
    'g': 'M9 5V14A4 4 0 0 1 5 18H2M9 9.5A4.5 4.5 0 1 0 0 9.5A4.5 4.5 0 1 0 9 9.5Z',
    'h': 'M0 0V14M0 9Q0 5 4.5 5Q9 5 9 9V14',
    'i': 'M5 5V14M5 0h.01',
    'j': 'M7 5V14Q7 19 2 18M7 0h.01',
    'k': 'M0 0V14M8 5L0 11M3.4 8.5L9 14',
    'l': 'M4 0V11Q4 14 7 14',
    'm': 'M0 14V5M0 9C0 3.5 7 3.5 7 9V14M7 9C7 3.5 14 3.5 14 9V14',
    'n': 'M0 14V5M0 9Q0 5 4.5 5Q9 5 9 9V14',
    'o': 'M4.5 5A4.5 4.5 0 1 0 4.5 14A4.5 4.5 0 1 0 4.5 5Z',
    'p': 'M0 5V18M0 9.5A4.5 4.5 0 1 1 9 9.5A4.5 4.5 0 1 1 0 9.5Z',
    'q': 'M9 5V18M9 9.5A4.5 4.5 0 1 0 0 9.5A4.5 4.5 0 1 0 9 9.5Z',
    'r': 'M0 14V5M0 9Q0 4 7 5',
    's': 'M8 6C5 3 0 5 0 7C0 10 8 8.5 8 11.5C8 15 2 15 0 13',
    't': 'M4 1V10Q4 14 8 14M0 5H8',
    'u': 'M0 5V10Q0 14 4.5 14Q9 14 9 10M9 5V14',
    'v': 'M0 5L4.5 14L9 5',
    'w': 'M0 5L3 14L7 7L11 14L14 5',
    'x': 'M0 5L9 14M9 5L0 14',
    'y': 'M0 5L4.5 14M9 5L4 16Q3 18 0 18',
    'z': 'M0 5H9L0 14H9',
}
DIGITS = {
    '0': 'M5 0A4.5 4.5 0 0 0 .5 4.5V9.5A4.5 4.5 0 0 0 9.5 9.5V4.5A4.5 4.5 0 0 0 5 0ZM2.5 10L7.5 4',
    '1': 'M1 4L5 0V14M1 14H9',
    '2': 'M0 3.5A3.5 3.5 0 0 1 3.5 0H6.5A3.5 3.5 0 0 1 10 3.5C10 5 9 6.2 7.5 7.5L0 14H10',
    '3': 'M0 1.5C1.3 .5 2.5 0 4 0H6A3.5 3.5 0 0 1 6 7H4M6 7A3.5 3.5 0 0 1 6 14H4C2.5 14 1.3 13.5 0 12.5',
    '4': 'M8 14V0L0 10H11',
    '5': 'M10 0H1V6H5.5A4 4 0 0 1 5.5 14H4C2.5 14 1 13.5 0 12.5',
    '6': 'M9 1C8 .3 6.5 0 5 0A5 5 0 0 0 0 5V9.5A4.5 4.5 0 0 0 4.5 14H5.5A4.5 4.5 0 0 0 5.5 5H4.5A4.5 4.5 0 0 0 0 9.5',
    '7': 'M0 0H10L3 14M3 7H9',
    '8': 'M4 0H6A3.5 3.5 0 0 1 6 7H4A3.5 3.5 0 0 1 4 0ZM4 7H6A3.5 3.5 0 0 1 6 14H4A3.5 3.5 0 0 1 4 7Z',
    '9': 'M1 13C2 13.7 3.5 14 5 14A5 5 0 0 0 10 9V4.5A4.5 4.5 0 0 0 5.5 0H4.5A4.5 4.5 0 0 0 4.5 9H5.5A4.5 4.5 0 0 0 10 4.5',
}
# IDs are ASCII and case-explicit: safe on case-insensitive filesystems.
SYMBOLS = [
    ('period', '.', 'M5 14h.01', 'punctuation'),
    ('comma', ',', 'M6 12Q6 16 3 17', 'punctuation'),
    ('colon', ':', 'M5 5h.01M5 14h.01', 'punctuation'),
    ('semicolon', ';', 'M6 5h.01M6 12Q6 16 3 17', 'punctuation'),
    ('exclamation', '!', 'M5 0V9M5 14h.01', 'punctuation'),
    ('question', '?', 'M0 3C0 -1 10 -1 10 3C10 6 5 6 5 9M5 14h.01', 'punctuation'),
    ('apostrophe', "'", 'M6 0Q6 4 3 5', 'punctuation'),
    ('quotation', '"', 'M3 0Q3 4 0 5M10 0Q10 4 7 5', 'punctuation'),
    ('hyphen', '-', 'M2 7H8', 'punctuation'),
    ('en-dash', '–', 'M0 7H10', 'punctuation'),
    ('em-dash', '—', 'M-2 7H12', 'punctuation'),
    ('underscore', '_', 'M0 14H10', 'punctuation'),
    ('slash', '/', 'M1 14L9 0', 'punctuation'),
    ('backslash', '\\', 'M1 0L9 14', 'punctuation'),
    ('parenthesis-left', '(', 'M7 0Q0 7 7 14', 'punctuation'),
    ('parenthesis-right', ')', 'M3 0Q10 7 3 14', 'punctuation'),
    ('bracket-left', '[', 'M8 0H2V14H8', 'punctuation'),
    ('bracket-right', ']', 'M2 0H8V14H2', 'punctuation'),
    ('brace-left', '{', 'M9 0Q4 0 4 4Q4 7 1 7Q4 7 4 10Q4 14 9 14', 'punctuation'),
    ('brace-right', '}', 'M1 0Q6 0 6 4Q6 7 9 7Q6 7 6 10Q6 14 1 14', 'punctuation'),
    ('plus', '+', 'M0 7H10M5 2V12', 'symbols'),
    ('minus', '−', 'M0 7H10', 'symbols'),
    ('multiply', '×', 'M1 3L9 11M9 3L1 11', 'symbols'),
    ('divide', '÷', 'M0 7H10M5 2h.01M5 12h.01', 'symbols'),
    ('equals', '=', 'M0 4H10M0 10H10', 'symbols'),
    ('not-equal', '≠', 'M0 4H10M0 10H10M8 0L2 14', 'symbols'),
    ('less-than', '<', 'M10 1L0 7L10 13', 'symbols'),
    ('greater-than', '>', 'M0 1L10 7L0 13', 'symbols'),
    ('at', '@', 'M10 4V9Q10 12 13 10C18 -3 -4 -4 -2 9Q-1 17 12 14M10 7C10 1 2 1 2 7C2 13 10 13 10 7Z', 'symbols'),
    ('hash', '#', 'M3 0L1 14M9 0L7 14M0 4H11M-1 10H10', 'symbols'),
    ('ampersand', '&', 'M11 14L2 4C-1 -2 10 -1 7 4L1 8C-4 15 8 18 11 8', 'symbols'),
    ('percent', '%', 'M0 14L10 0M2 0C-1 0 -1 5 2 5C5 5 5 0 2 0ZM8 9C5 9 5 14 8 14C11 14 11 9 8 9Z', 'symbols'),
    ('asterisk', '*', 'M5 2V12M0 4L10 10M0 10L10 4', 'symbols'),
    ('degree', '°', 'M5 0C1 0 1 6 5 6C9 6 9 0 5 0Z', 'symbols'),
    ('euro', '€', 'M11 2C4 -3 1 2 1 7S4 17 11 12M-1 5H8M-1 9H7', 'symbols'),
    ('dollar', '$', 'M10 2C8 -1 0 -1 0 4C0 9 10 5 10 10C10 15 2 15 0 12M5 -2V16', 'symbols'),
    ('pound', '£', 'M10 2C3 -3 1 1 3 7Q5 11 0 14H11M0 7H8', 'symbols'),
    ('yen', '¥', 'M0 0L5 6L10 0M5 6V14M1 8H9M1 11H9', 'symbols'),
]


class FlattenPen(BasePen):
    def __init__(self):
        super().__init__(None)
        self.contours, self.points = [], []

    def _moveTo(self, p):
        self._endPath()
        self.points = [p]

    def _lineTo(self, p):
        self.points.append(p)

    def _curveToOne(self, a, b, c):
        p = self.points[-1]
        for i in range(1, 33):
            t, u = i / 32, 1 - i / 32
            self.points.append(tuple(u**3*p[j]+3*u*u*t*a[j]+3*u*t*t*b[j]+t**3*c[j] for j in (0, 1)))

    def _qCurveToOne(self, a, b):
        p = self.points[-1]
        for i in range(1, 25):
            t, u = i / 24, 1 - i / 24
            self.points.append(tuple(u*u*p[j]+2*u*t*a[j]+t*t*b[j] for j in (0, 1)))

    def _closePath(self):
        self.points.append(self.points[0])
        self._endPath()

    def _endPath(self):
        if self.points:
            self.contours.append(self.points)
            self.points = []


def contours(d):
    pen = FlattenPen()
    parse_path(d, pen)
    pen._endPath()
    return pen.contours


def bounds(d):
    pen = BoundsPen(None)
    parse_path(d, pen)
    return pen.bounds


def num(value):
    return f'{value:.2f}'.rstrip('0').rstrip('.') or '0'


def transform(d, scale=1, dx=0, dy=0):
    pen = SVGPathPen(None, ntos=num)
    parse_path(d, TransformPen(pen, (scale, 0, 0, scale, dx, dy)))
    return pen.getCommands()


def stroke(d, width):
    return unary_union([LineString(p).buffer(width/2, quad_segs=12) for p in contours(d) if len(p) > 1])


def svgpath(geometry):
    geometry = geometry.simplify(.012, preserve_topology=True)
    polygons = [geometry] if geometry.geom_type == 'Polygon' else list(geometry.geoms)
    def ring(coords):
        return 'M'+'L'.join(f'{num(x)} {num(y)}' for x, y in list(coords)[:-1])+'Z'
    return ''.join(ring(p.exterior.coords)+''.join(ring(i.coords) for i in p.interiors) for p in polygons if p.geom_type == 'Polygon')


def add_accents(letters, lower=False):
    caron = 'M2 0L4.5 2L7 0' if lower else 'M2 -4L5 -2L8 -4'
    acute = 'M3 2L6 0' if lower else 'M4 -2L7 -4'
    for char, base, accent in [('č','c',caron),('ć','c',acute),('š','s',caron),('ž','z',caron)]:
        if not lower:
            char, base = char.upper(), base.upper()
        letters[char] = letters[base]+accent
    letters['đ' if lower else 'Đ'] = letters['d' if lower else 'D'] + ('M6 2H12' if lower else 'M-2 7H4')


def digraph(value):
    parts, cursor = [], 0
    for char in value:
        d = (LOWER if char.islower() else UPPER)[char]
        left, _, right, _ = bounds(d)
        parts.append(transform(d, dx=cursor-left))
        cursor += right-left+3.5
    return ''.join(parts)


def normalized(d, form, group):
    left, top, right, bottom = bounds(d)
    # Individual icons are optically centered; short lowercase letters keep
    # their x-height. Punctuation retains its position on the writing line.
    if group == 'punctuation':
        top, bottom = min(0, top), max(14, bottom)
    cx, cy = (left+right)/2, (top+bottom)/2
    width, height = max(right-left, .01), bottom-top
    unit, limit_x, limit_y = {
        'plain': (1.05, 15, 16),
        'circle': (.72, 11, 11.5),
        'square': (.75, 12, 11.5),
    }[form]
    scale = min(unit, limit_x/width, limit_y/max(height, .01))
    if form == 'circle':
        radius = max(hypot(x-cx, y-cy) for part in contours(d) for x, y in part)
        scale = min(scale, 5.9 / max(radius, .01))
    placed = transform(d, scale, 12-cx*scale, 12-cy*scale)
    if form != 'plain':
        safe_area = badge_geometry(form)[3].buffer(-.75)
        for _ in range(30):
            if safe_area.covers(stroke(placed, 1.75)):
                break
            scale *= .97
            placed = transform(d, scale, 12-cx*scale, 12-cy*scale)
        else:
            raise AssertionError((form, group, 'cannot fit glyph'))
    return placed


def badge_paths(form):
    """Two open contours: a detached upper-left corner and the main frame.

    The gaps are real transparent geometry, including in filled variants.
    Cap-to-cap clearance is at least 1.25 units at the 24-unit master size.
    """
    if form == 'square':
        return ('M8.75 3H18A3 3 0 0 1 21 6V18A3 3 0 0 1 18 21H6A3 3 0 0 1 3 18V8.75',
                'M3 5.75A2.75 2.75 0 0 1 5.75 3')
    def point(angle):
        return f'{num(12+9*cos(radians(angle)))} {num(12+9*sin(radians(angle)))}'
    return (f'M{point(256)}A9 9 0 1 1 {point(194)}',
            f'M{point(214)}A9 9 0 0 1 {point(236)}')


@lru_cache(maxsize=2)
def badge_geometry(form):
    main, corner = badge_paths(form)
    # Close only the large contour, leaving a clear diagonal pocket behind
    # the detached corner. The colored fill cannot bridge either gap.
    fill_path = main+('Q8 8 9.82 3.27Z' if form == 'circle' else 'Z')
    plane = Polygon(contours(fill_path)[0])
    main_body = plane.union(stroke(main, 1.75))
    corner_body = stroke(corner, 1.75)
    assert main_body.distance(corner_body) >= 1, (form, 'corner gap too small')
    return main, corner, fill_path, plane, main_body.union(corner_body)


def render(d, form, style):
    primary = 'var(--icon-primary, currentColor)' if style == 'duotone' else 'currentColor'
    secondary = 'var(--icon-secondary, currentColor)'
    base = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"'
    glyph = stroke(d, 1.75)
    if form != 'plain':
        main, corner, fill_path, plane, badge = badge_geometry(form)
    def path(data, attrs=''):
        return f'  <path d="{data}"{attrs}/>'
    if style == 'solid':
        body = glyph if form == 'plain' else badge.difference(glyph)
        lines = [base+' fill="currentColor">', path(svgpath(body), ' fill-rule="evenodd"')]
    else:
        lines = [base+f' fill="none" stroke="{primary}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">']
        if form == 'plain':
            lines.append(path(d))
        else:
            if style == 'duotone':
                lines.append(path(fill_path, f' fill="{secondary}" stroke="none"'))
            lines.extend([path(main), path(corner), path(d)])
        body = glyph if form == 'plain' else badge
    assert min(body.bounds) >= 2 and max(body.bounds) <= 22, (form, style, body.bounds)
    if form != 'plain':
        assert plane.buffer(-.6).covers(glyph), (form, 'glyph touches border')
    return '\n'.join(lines+['</svg>', ''])


def main():
    add_accents(UPPER)
    add_accents(LOWER, lower=True)
    slugs = {'č':'c-caron', 'ć':'c-acute', 'đ':'d-stroke', 'š':'s-caron', 'ž':'z-caron'}
    entries = []
    for group, chars in [('uppercase', UPPER), ('lowercase', LOWER)]:
        for char, d in chars.items():
            slug = slugs.get(char.lower(), char.lower())
            entries.append((f'letter-{group}-{slug}', char, group, d, [slug, 'letter', 'alphabet', 'slovo', 'croatian' if char.lower() in slugs else 'latin']))
    for char in ['DŽ', 'LJ', 'NJ', 'dž', 'lj', 'nj', 'Dž', 'Lj', 'Nj']:
        case = 'uppercase' if char.isupper() else 'lowercase' if char.islower() else 'titlecase'
        slug = char.lower().replace('ž', 'z-caron')
        entries.append((f'letter-{case}-{slug}', char, 'digraphs', digraph(char), ['digraph', 'dvoslov', 'croatian', case]))
    for char, d in DIGITS.items():
        entries.append((f'number-{char}', char, 'numbers', d, ['number', 'digit', 'broj']))
    for slug, char, d, group in SYMBOLS:
        entries.append((f'symbol-{slug}', char, group, d, [slug, 'symbol', 'znak']))
    groups = {'uppercase':'Uppercase', 'lowercase':'Lowercase', 'digraphs':'Croatian digraphs', 'numbers':'Numbers', 'punctuation':'Punctuation', 'symbols':'Math & symbols'}
    metadata = []
    for stem, char, group, d, keywords in entries:
        for form in FORMS:
            name = stem if form == 'plain' else f'{stem}-{form}'
            metadata.append(dict(id=name, label=f'{char} · {groups[group]}'+('' if form == 'plain' else f' · {form.title()}'), group=group, groupLabel=groups[group], glyph=char, form=form, keywords=[char, *keywords, group, form, 'badge' if form != 'plain' else 'standalone']))
            for style in STYLES:
                target = ROOT/'src'/style/f'{name}.svg'
                target.write_text(render(normalized(d, form, group), form, style), encoding='utf-8', newline='\n')
    ids = [i['id'] for i in metadata]
    assert len(ids) == len(set(ids)), 'Duplicate icon ID'
    for other in ('hobbies', 'general', 'content'):
        assert not set(ids).intersection(i['id'] for i in json.loads((ROOT/f'{other}.json').read_text(encoding='utf-8'))), other
    (ROOT/'lettering.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
    print(f'{len(entries)} glyphs × {len(FORMS)} forms = {len(metadata)} icons × {len(STYLES)} styles = {len(metadata)*len(STYLES)} SVGs')


if __name__ == '__main__':
    main()

"""Geometry helpers for original Vectilume SVGs (fonttools + shapely)."""
from fontTools.pens.basePen import BasePen
from fontTools.svgLib.path import parse_path
from shapely.geometry import Polygon, LineString
from shapely.ops import unary_union


class FlattenPen(BasePen):
    def __init__(self):
        super().__init__(None)
        self.contours, self.points = [], []

    def _moveTo(self, point):
        self._endPath()
        self.points = [point]

    def _lineTo(self, point):
        self.points.append(point)

    def _curveToOne(self, a, b, c):
        p = self.points[-1]
        for i in range(1, 33):
            t, u = i / 32, 1 - i / 32
            self.points.append(tuple(u**3*p[j] + 3*u*u*t*a[j] + 3*u*t*t*b[j] + t**3*c[j] for j in (0, 1)))

    def _qCurveToOne(self, a, b):
        p = self.points[-1]
        for i in range(1, 25):
            t, u = i / 24, 1 - i / 24
            self.points.append(tuple(u*u*p[j] + 2*u*t*a[j] + t*t*b[j] for j in (0, 1)))

    def _closePath(self):
        if self.points:
            self.points.append(self.points[0])
        self._endPath()

    def _endPath(self):
        if self.points:
            self.contours.append(self.points)
            self.points = []


def contours(data):
    pen = FlattenPen()
    parse_path(data, pen)
    pen._endPath()
    return pen.contours


def area(data):
    shape = Polygon()
    for points in contours(data):
        if len(points) >= 3:
            shape = shape.symmetric_difference(Polygon(points).buffer(0))
    return shape


def stroke(data, width=1.75):
    return unary_union([LineString(points).buffer(width / 2, quad_segs=12)
                        for points in contours(data) if len(points) > 1])


def svgpath(geometry):
    geometry = geometry.simplify(.012, preserve_topology=True)
    polygons = [geometry] if geometry.geom_type == 'Polygon' else list(geometry.geoms)
    def number(value):
        return f'{value:.2f}'.rstrip('0').rstrip('.') or '0'
    def ring(coords):
        return 'M' + 'L'.join(f'{number(x)} {number(y)}' for x, y in list(coords)[:-1]) + 'Z'
    return ''.join(ring(p.exterior.coords) + ''.join(ring(i.coords) for i in p.interiors)
                   for p in polygons if p.geom_type == 'Polygon')


def render_icon(spec, style):
    """Render shared surfaces, structural strokes and negative Solid details."""
    surfaces = spec.get('surfaces', [])
    edges = spec.get('edges', surfaces)
    structure, details = spec.get('structure', []), spec.get('details', [])
    fine_details = spec.get('fine_details', [])
    def path(data, attrs=''):
        return f'  <path d="{data}"{attrs}/>'
    outline = unary_union([stroke(d) for d in edges + structure + details] + [stroke(d, 1) for d in fine_details])
    assert min(outline.bounds) >= 2 and max(outline.bounds) <= 22, (spec['label'], outline.bounds)
    base = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"'
    if style == 'solid':
        body = unary_union([area(d).buffer(.875, quad_segs=12) for d in surfaces] + [stroke(d) for d in structure])
        body = body.difference(unary_union([stroke(d) for d in details + spec.get('cuts', [])]))
        body = body.difference(unary_union([area(d) for d in spec.get('holes', [])]))
        body = body.union(unary_union([stroke(d, 1) for d in spec.get('solid_overlays', [])]))
        assert not body.is_empty and body.is_valid, spec['label']
        assert min(body.bounds) >= 2 and max(body.bounds) <= 22, (spec['label'], 'solid', body.bounds)
        lines = [base + ' fill="currentColor">', path(svgpath(body), ' fill-rule="evenodd"')]
    else:
        primary = 'currentColor' if style == 'outline' else 'var(--icon-primary, currentColor)'
        lines = [base + f' fill="none" stroke="{primary}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">']
        if style == 'duotone':
            lines.extend(path(d, ' fill="var(--icon-secondary, currentColor)" stroke="none" fill-rule="evenodd"') for d in surfaces)
        lines.extend(path(d) for d in edges + structure + details)
        lines.extend(path(svgpath(stroke(d, 1)), f' fill="{primary}" stroke="none" fill-rule="evenodd"') for d in fine_details)
    return '\n'.join(lines + ['</svg>', ''])

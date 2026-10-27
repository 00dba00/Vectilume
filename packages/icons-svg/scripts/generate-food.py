"""Draw Food & Drink: forty original icons in three Vectilume styles.

Run: python packages/icons-svg/scripts/generate-food.py
Dependencies: requirements-lettering.txt (shared SVG geometry dependencies).
"""
import json
from pathlib import Path
from shapely.ops import unary_union
from svg_geometry import area, stroke, svgpath

ROOT = Path(__file__).resolve().parents[1]
GROUPS = {'drinks': 'Drinks', 'produce': 'Fruit & vegetables',
          'meals': 'Meals', 'bakery-desserts': 'Bakery & desserts'}

def circle(x, y, r):
    return f'M{x-r:g} {y:g}a{r:g} {r:g} 0 1 0 {2*r:g} 0a{r:g} {r:g} 0 1 0 {-2*r:g} 0Z'


ICONS = {
    'coffee': dict(label='Coffee', group='drinks', keywords=['kava', 'espresso', 'cappuccino', 'cafe', 'cup', 'hot drink'],
        surfaces=['M4 8H16V14A4 4 0 0 1 12 18H8A4 4 0 0 1 4 14Z'],
        structure=['M16 9H18A3 3 0 0 1 18 15H16', 'M3 21H19', 'M7 3Q6 4.5 7 5.5M12 3Q11 4.5 12 5.5'],
        details=['M7 11V13.5']),
    'teapot': dict(label='Teapot', group='drinks', keywords=['caj', 'čaj', 'cajnik', 'čajnik', 'tea', 'kettle', 'hot drink'],
        surfaces=['M7 8H15C18 8 19 10 19 13V17A3 3 0 0 1 16 20H9A3 3 0 0 1 6 17V15L3 10H6Z'],
        structure=['M19 10H19.5A1.5 1.5 0 0 1 21 11.5V14A2 2 0 0 1 19 16', 'M8 5H16M12 3V5'],
        details=['M9 13V12Q9 11 10 11H11.5']),
    'wine': dict(label='Wine', group='drinks', keywords=['vino', 'glass', 'goblet', 'alcohol', 'restaurant'],
        surfaces=['M7 3H17L18 8A6 6 0 0 1 6 8Z'],
        structure=['M12 14V21M8 21H16'],
        details=['M6.1 8.5Q9 7.5 12 8.5T17.9 8.5']),
    'apple': dict(label='Apple', group='produce', keywords=['jabuka', 'fruit', 'voce', 'voće', 'fresh', 'healthy'],
        surfaces=['M12 7C9 4 4 6 4 11C4 16 7 21 10 21Q12 20 14 21C17 21 20 16 20 11C20 6 15 4 12 7Z'],
        structure=['M12 7Q11 4 13 3'],
        details=['M7 12V11Q7 9 9 9']),
    'lemon': dict(label='Lemon', group='produce', keywords=['limun', 'citrus', 'fruit', 'voće', 'sour'],
        surfaces=['M3 12L5 9C7 4 17 4 19 9L21 12L19 15C17 20 7 20 5 15Z'],
        details=['M8 10Q9 8.5 11.5 8.5']),
    'carrot': dict(label='Carrot', group='produce', keywords=['mrkva', 'vegetable', 'povrce', 'povrće', 'root', 'healthy'],
        surfaces=['M3 21L8 8Q10 6 13 8L16 11Q18 14 16 16Z'],
        structure=['M13 8Q13 4 16 3M16 11Q20 11 21 8M15 8L20 3'],
        details=['M8 11L10 13M6.2 16L7.2 17']),
    'pizza': dict(label='Pizza', group='meals', keywords=['slice', 'cheese', 'sir', 'italian', 'pizzeria', 'food'],
        surfaces=['M3 6Q12 1 21 6L12 21Z'],
        details=['M4.8 9Q12 5.2 19.2 9', 'M9.7 9.6a1.1 1.1 0 1 0 0 2.2a1.1 1.1 0 1 0 0 -2.2Z', 'M12.7 13.4a.9 .9 0 1 0 0 1.8a.9 .9 0 1 0 0 -1.8Z'],
        holes=['M9.7 9.6a1.1 1.1 0 1 0 0 2.2a1.1 1.1 0 1 0 0 -2.2Z', 'M12.7 13.4a.9 .9 0 1 0 0 1.8a.9 .9 0 1 0 0 -1.8Z']),
    'burger': dict(label='Burger', group='meals', keywords=['hamburger', 'sandwich', 'fast food', 'meal', 'sendvic', 'sendvič'],
        surfaces=['M3 10C3 6 6 3 12 3S21 6 21 10Z', 'M3 17H21V18A3 3 0 0 1 18 21H6A3 3 0 0 1 3 18Z'],
        structure=['M3 13L6 14L9 12L12 14L15 12L18 14L21 13'],
        details=['M6.5 7.2Q7.5 5.8 9 5.8', 'M14 6h.01']),
    'croissant': dict(label='Croissant', group='bakery-desserts', keywords=['kroasan', 'pastry', 'breakfast', 'dorucak', 'doručak', 'bakery', 'pekara'],
        surfaces=['M3.5 14C3.5 10 5 7.5 8 6C9 3.8 15 3.8 16 6C19 7.5 20.5 10 20.5 14L18 18Q16.5 12 12 12Q7.5 12 6 18Z'],
        details=['M8 6Q7.5 9 9 12.5M16 6Q16.5 9 15 12.5', 'M4.7 9.5L8 10.5M19.3 9.5L16 10.5']),
    'ice-cream': dict(label='Ice cream', group='bakery-desserts', keywords=['sladoled', 'cone', 'kornet', 'scoop', 'dessert', 'summer'],
        surfaces=['M7 13L12 21L17 13', 'M6.8 12A6 6 0 1 1 17.2 12Q15.8 14 14 12Q12 14 10 12Q8.2 14 6.8 12Z'],
        details=['M9 8A3 3 0 0 1 11 6'],
        cuts=['M6.8 12Q8.2 14 10 12Q12 14 14 12Q15.8 14 17.2 12']),
}

ICONS.update({
    'water-glass': dict(label='Water glass', group='drinks', keywords=['voda', 'čaša', 'casa', 'water', 'hydration'],
        surfaces=['M5 3H19L17 21H7Z'],
        details=['M5.8 10Q9 8 12 10T18.2 10', 'M9 13L9.5 17']),
    'juice': dict(label='Juice', group='drinks', keywords=['sok', 'orange', 'naranca', 'naranča', 'straw'],
        surfaces=['M5 8H19L17 21H7Z'],
        structure=['M12 12L14 3H19'],
        details=['M8 12L8.5 16']),
    'beer': dict(label='Beer', group='drinks', keywords=['pivo', 'mug', 'pub', 'alcohol'],
        surfaces=['M4 8H16V18A3 3 0 0 1 13 21H7A3 3 0 0 1 4 18Z', 'M4 8C1.8 5 4.5 2.5 7 4Q10 2 13 4C17 2 19 7 16 8Z'],
        structure=['M16 10H18A3 3 0 0 1 21 13V15A3 3 0 0 1 18 18H16'],
        details=['M8 12V17M12 12V17'], cuts=['M4 8H16']),
    'cocktail': dict(label='Cocktail', group='drinks', keywords=['koktel', 'martini', 'bar', 'alcohol'],
        surfaces=['M3 7H21L12 16Z'],
        structure=['M12 16V21M8 21H16M13 10L18 3H21'],
        details=['M6 10H18']),
    'milk-carton': dict(label='Milk carton', group='drinks', keywords=['mlijeko', 'milk', 'dairy', 'carton'],
        surfaces=['M5 7L8 3H16L19 7V21H5Z'],
        details=['M5 7H19M14 3L12 7V21', 'M8 11V14']),
    'soda-can': dict(label='Soda can', group='drinks', keywords=['soda', 'cola', 'limenka', 'gazirano', 'can'],
        surfaces=['M8 3H16L18 6V18A3 3 0 0 1 15 21H9A3 3 0 0 1 6 18V6Z'],
        details=['M6 7H18', 'M9 10V13', 'M6 17Q12 12 18 16']),
    'takeaway-coffee': dict(label='Takeaway coffee', group='drinks', keywords=['coffee', 'kava', 'takeaway', 'za van', 'cup'],
        surfaces=['M6 8H18L16.5 21H7.5Z', 'M4 8L5.5 4H18.5L20 8Z'],
        details=['M6.5 12H17.5M7.1 17H16.9'], cuts=['M6 8H18']),
    'banana': dict(label='Banana', group='produce', keywords=['banana', 'fruit', 'voće', 'tropical'],
        surfaces=['M18 3H21C22 14 14 22 5 20L3 17C12 18 18 12 18 3Z'],
        details=['M7 17Q16 17 19 8']),
    'strawberry': dict(label='Strawberry', group='produce', keywords=['jagoda', 'berry', 'fruit', 'voće'],
        surfaces=['M12 7C3 3 2 12 6 17Q12 24 18 17C22 12 21 3 12 7Z'],
        structure=['M12 7V3M7 4L12 7L17 4'],
        details=['M8 10h.01M15.5 10.5h.01M11.5 14h.01M9 17h.01M16 15h.01']),
    'grapes': dict(label='Grapes', group='produce', keywords=['grožđe', 'grozdje', 'grape', 'fruit', 'voće', 'vine'],
        surfaces=[circle(5.5,7,2.1), circle(12,7,2.1), circle(18.5,7,2.1), circle(8.75,12.75,2.1), circle(15.25,12.75,2.1), circle(12,18.5,2.1)],
        structure=['M12 4.9V4Q12 3 15 3']),
    'pear': dict(label='Pear', group='produce', keywords=['kruška', 'kruska', 'fruit', 'voće'],
        surfaces=['M9 7Q9 5 12 5Q15 5 15 7C15 12 20 13 20 17C20 22 4 22 4 17C4 13 9 12 9 7Z'],
        structure=['M12 5Q12 3 15 3'], details=['M7 17Q7 15 9 14']),
    'cherries': dict(label='Cherries', group='produce', keywords=['trešnje', 'tresnje', 'cherry', 'fruit', 'voće'],
        surfaces=[circle(6.5,16.5,3.5), circle(17.5,16.5,3.5)],
        structure=['M6.5 13Q13 8 13 3Q13 9 17.5 13M13 3Q17 3 19 6'],
        details=['M5 16h.01M16 16h.01']),
    'broccoli': dict(label='Broccoli', group='produce', keywords=['brokula', 'vegetable', 'povrće', 'greens'],
        surfaces=['M9 12H15L16 21H8Z', 'M7 13C2 14 1.8 7 6 7C6 2 12 2 13 5C17 2 21 6 18 9C23 11 19 16 15 13Q11 16 7 13Z'],
        details=['M6 10Q6 8 8 8'], cuts=['M7 13Q11 16 15 13']),
    'bell-pepper': dict(label='Bell pepper', group='produce', keywords=['paprika', 'pepper', 'vegetable', 'povrće'],
        surfaces=['M12 7C6 3 2 8 4 15Q5 23 10 20Q12 22 14 20Q19 23 20 15C22 8 18 3 12 7Z'],
        structure=['M12 7Q11 3 15 3'], details=['M8 10Q6.5 13 8 17M15 10Q17 13 15 17']),
    'sandwich': dict(label='Sandwich', group='meals', keywords=['sendvič', 'sendvic', 'toast', 'lunch', 'ručak'],
        surfaces=['M3 16L12 3L21 16V20H3Z'],
        details=['M3 16H21', 'M8 12.5L11 8']),
    'soup': dict(label='Soup', group='meals', keywords=['juha', 'bowl', 'hot', 'lunch', 'zdjela'],
        surfaces=['M3 10H21C21 16 17 19 12 19S3 16 3 10Z'],
        structure=['M8 21H16M7 6Q6 4.5 7 3M12 6Q11 4.5 12 3M17 6Q16 4.5 17 3'],
        details=['M6.5 13Q7 15 9 15.8']),
    'salad': dict(label='Salad', group='meals', keywords=['salata', 'vegetarian', 'healthy', 'bowl', 'zdjela'],
        surfaces=['M3 12H21Q20 21 12 21Q4 21 3 12Z', 'M5 12C2 8 5 5 8 7C6 2 12 1.5 13 6C15 2 20 5 18 9Q22 9 20 12Z'],
        details=['M8 16Q10 18 12 18'], cuts=['M3 12H21']),
    'sushi': dict(label='Sushi', group='meals', keywords=['sushi', 'maki', 'rice', 'riža', 'japanese'],
        surfaces=['M4 8A8 4 0 0 1 20 8V17A8 4 0 0 1 4 17Z'],
        details=['M4 8A8 4 0 0 0 20 8', 'M9 8a3 1.5 0 1 0 6 0a3 1.5 0 1 0 -6 0Z', 'M7 13V16'],
        holes=['M9 8a3 1.5 0 1 0 6 0a3 1.5 0 1 0 -6 0Z']),
    'taco': dict(label='Taco', group='meals', keywords=['taco', 'tortilla', 'mexican', 'wrap', 'tortilja'],
        surfaces=['M3 19C3 10 8 5 12 5C16 5 21 10 21 19Z'],
        structure=['M4 13L3 10L6 8L7 5L10 4L12 3L15 4L18 7L21 9L20 13'],
        details=['M7 14Q8 10 11 9', 'M15 14h.01M11 17h.01']),
    'fried-egg': dict(label='Fried egg', group='meals', keywords=['jaje', 'egg', 'breakfast', 'doručak', 'protein'],
        surfaces=['M8 4C12 2 15 5 16 7C17 9 21 9 21 13C21 16 18 16 17 18C15 21.7 10 21.7 7 19C5 17 3 17 3 13C3 10 5 10 5 7Q5 4 8 4Z'],
        details=[circle(12,13,3.5)], holes=[circle(12,13,3.5)]),
    'chicken-drumstick': dict(label='Chicken drumstick', group='meals', keywords=['piletina', 'batak', 'chicken', 'meat', 'meso'],
        surfaces=['M10 5C13 1.2 20 3 21 8C21.8 13 17 16 13 14L10 11Q7 8 10 5Z', 'M10 11L6 15Q3 14 3 17Q3 19 5 18Q4 21 7 21Q10 21 9 18L13 14Z'],
        details=['M12 7Q13 5 16 6'], cuts=['M10 11L13 14']),
    'french-fries': dict(label='French fries', group='meals', keywords=['pomfrit', 'fries', 'chips', 'potato', 'krumpir'],
        surfaces=['M5 11V4H8V11M10 11V3H13V12M15 11V5H18V11', 'M3 10Q12 14 21 10L18 21H6Z'],
        details=['M8 15L9 18'], cuts=['M3 10Q12 14 21 10']),
    'bread-loaf': dict(label='Bread loaf', group='bakery-desserts', keywords=['kruh', 'loaf', 'bread', 'bakery', 'pekara'],
        surfaces=['M5 8Q12 2 19 8Q22 11 19 17Q12 22 5 17Q2 13 5 8Z'],
        details=['M8 8L10 11M13 6.5L15 9.5']),
    'baguette': dict(label='Baguette', group='bakery-desserts', keywords=['baget', 'baguette', 'kruh', 'bread', 'french'],
        surfaces=['M4 15L15 4A3.5 3.5 0 0 1 20 9L9 20A3.5 3.5 0 0 1 4 15Z'],
        details=['M6.5 15L8.5 17M10.5 11L12.5 13M14.5 7L16.5 9']),
    'pretzel': dict(label='Pretzel', group='bakery-desserts', keywords=['perec', 'pretzel', 'bakery', 'pekara', 'snack'],
        surfaces=['M12 9C7 1 2.2 5 3.2 10C4 15 9 20 12 20C15 20 20 15 20.8 10C21.8 5 17 1 12 9Z'
                  'M8 8C5 5 4 9 7 12L10 10Z'
                  'M16 8C19 5 20 9 17 12L14 10Z'
                  'M8 15L12 12L16 15Q12 19 8 15Z'],
        holes=['M8 8C5 5 4 9 7 12L10 10Z', 'M16 8C19 5 20 9 17 12L14 10Z', 'M8 15L12 12L16 15Q12 19 8 15Z']),
    'cake': dict(label='Cake', group='bakery-desserts', keywords=['torta', 'birthday', 'rođendan', 'rodjendan', 'celebration'],
        surfaces=['M4 10H20V21H4Z'],
        structure=['M12 10V7', 'M12 3Q9 6 12 6Q15 6 12 3Z'],
        details=['M4 14Q6 17 8 14Q10 17 12 14Q14 17 16 14Q18 17 20 14']),
    'cupcake': dict(label='Cupcake', group='bakery-desserts', keywords=['muffin', 'cupcake', 'kolač', 'kolac', 'frosting'],
        surfaces=['M5 12H19L17 21H7Z', 'M5 12C1 10 5 6 8 7C7 3 13 2 15 6C20 4 22 11 19 12Z'],
        details=['M10 16V18M14 16V18'], cuts=['M5 12H19']),
    'donut': dict(label='Donut', group='bakery-desserts', keywords=['krafna', 'donut', 'doughnut', 'dessert', 'sweet'],
        surfaces=[circle(12,12,8.5)+circle(12,12,2.7)],
        details=['M7 8L8 7M15.5 7.5L16.5 8.5M16 16h.01M7.5 16h.01']),
    'cookie': dict(label='Cookie', group='bakery-desserts', keywords=['keks', 'cookie', 'biscuit', 'chocolate', 'sweet'],
        surfaces=['M20 12A8.5 8.5 0 1 1 12 3.5Q11 7 14 7Q13 11 17 10Q17 12 20 12Z'],
        details=['M8 7h.01M6.5 12h.01M11 15h.01M16 16h.01M8 18h.01']),
    'chocolate': dict(label='Chocolate', group='bakery-desserts', keywords=['čokolada', 'cokolada', 'chocolate', 'bar', 'cocoa'],
        surfaces=['M6 3H18V11L21 14V21H3V14L6 11Z'],
        details=['M6 7H18M12 3V11', 'M3 14L9 12L12 15L15 12L21 14']),
})


def render(spec, style):
    surfaces = spec['surfaces']
    structure, details = spec.get('structure', []), spec.get('details', [])
    def path(data, attrs=''):
        return f'  <path d="{data}"{attrs}/>'
    edges = spec.get('edges', surfaces)
    outline = unary_union([stroke(d) for d in edges + structure + details])
    assert min(outline.bounds) >= 2 and max(outline.bounds) <= 22, (spec['label'], outline.bounds)
    base = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"'
    if style == 'solid':
        body = unary_union([area(d).buffer(.875, quad_segs=12) for d in surfaces] + [stroke(d) for d in structure])
        body = body.difference(unary_union([stroke(d) for d in details + spec.get('cuts', [])]))
        body = body.difference(unary_union([area(d) for d in spec.get('holes', [])]))
        assert not body.is_empty and body.is_valid, spec['label']
        assert min(body.bounds) >= 2 and max(body.bounds) <= 22, (spec['label'], 'solid', body.bounds)
        lines = [base + ' fill="currentColor">', path(svgpath(body), ' fill-rule="evenodd"')]
    else:
        primary = 'currentColor' if style == 'outline' else 'var(--icon-primary, currentColor)'
        lines = [base + f' fill="none" stroke="{primary}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">']
        if style == 'duotone':
            lines.extend(path(d, ' fill="var(--icon-secondary, currentColor)" stroke="none" fill-rule="evenodd"') for d in surfaces)
        lines.extend(path(d) for d in edges + structure + details)
    return '\n'.join(lines + ['</svg>', ''])


def main():
    existing = set()
    for file in ROOT.glob('*.json'):
        if file.stem == 'food':
            continue
        data = json.loads(file.read_text(encoding='utf-8'))
        if isinstance(data, list):
            existing.update(item['id'] for item in data if isinstance(item, dict) and 'id' in item)
    assert not existing.intersection(ICONS), 'Icon ID already used by another collection'
    metadata = []
    assert all(sum(spec['group'] == group for spec in ICONS.values()) == 10 for group in GROUPS)
    ordered = sorted(ICONS.items(), key=lambda item: list(GROUPS).index(item[1]['group']))
    for name, spec in ordered:
        for style in ('outline', 'duotone', 'solid'):
            (ROOT / 'src' / style / f'{name}.svg').write_text(render(spec, style), encoding='utf-8', newline='\n')
        category_words = ['drink', 'piće', 'pića', 'napitak'] if spec['group'] == 'drinks' else ['food', 'hrana']
        metadata.append(dict(id=name, label=spec['label'], group=spec['group'],
                             groupLabel=GROUPS[spec['group']], keywords=[*spec['keywords'], *category_words]))
    (ROOT / 'food.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f'Food & Drink: {len(ICONS)} icons, {len(ICONS) * 3} SVGs')


if __name__ == '__main__':
    main()

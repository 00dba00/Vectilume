"""Original Travel & Transport: 40 motifs, 120 SVGs, no font assets.

Run: python packages/icons-svg/scripts/generate-transport.py
Dependencies: requirements-lettering.txt (shared SVG geometry dependencies).
"""
import json
from pathlib import Path
from svg_geometry import render_icon

ROOT = Path(__file__).resolve().parents[1]
GROUPS = {'road': 'Road transport', 'rail-air-sea': 'Rail, air & sea',
          'luggage-documents': 'Luggage & documents', 'stay-navigation': 'Stay & navigation'}


def circle(x, y, r):
    return f'M{x-r:g} {y:g}a{r:g} {r:g} 0 1 0 {2*r:g} 0a{r:g} {r:g} 0 1 0 {-2*r:g} 0Z'


def rect(x, y, w, h, r=2):
    return (f'M{x+r:g} {y:g}H{x+w-r:g}Q{x+w:g} {y:g} {x+w:g} {y+r:g}'
            f'V{y+h-r:g}Q{x+w:g} {y+h:g} {x+w-r:g} {y+h:g}'
            f'H{x+r:g}Q{x:g} {y+h:g} {x:g} {y+h-r:g}'
            f'V{y+r:g}Q{x:g} {y:g} {x+r:g} {y:g}Z')


ICONS = {
    'bus': dict(label='Bus', group='road', keywords=['autobus', 'public transport', 'coach'],
        surfaces=[rect(4,3,16,16,3)], structure=['M7 19V21M17 19V21'],
        details=[rect(7,6,10,5,1), 'M8 15h.01M16 15h.01'], holes=[rect(7,6,10,5,1)]),
    'taxi': dict(label='Taxi', group='road', keywords=['taksi', 'cab', 'ride', 'car'],
        surfaces=['M3 17V12L6 11L8 7H15L18 11L21 12V17Z', circle(7,19,2), circle(17,19,2)],
        structure=['M10 7V4H14V7'], details=['M6 11H18M12 7V11'], holes=[circle(7,19,.7),circle(17,19,.7)]),
    'truck': dict(label='Truck', group='road', keywords=['kamion', 'delivery', 'dostava', 'cargo'],
        surfaces=['M3 5H14V17H3Z','M14 10H18L21 14V17H14Z',circle(6,19,2),circle(18,19,2)],
        details=['M6 10V8H9','M14 14H21'], holes=[circle(6,19,.7),circle(18,19,.7)]),
    'van': dict(label='Van', group='road', keywords=['kombi', 'minivan', 'shuttle', 'passenger'],
        surfaces=['M3 6H15L21 12V17H3Z',circle(7,19,2),circle(17,19,2)],
        details=['M6 9H11V13H6Z','M15 7V12H20'],
        holes=['M6 9H11V13H6Z',circle(7,19,.7),circle(17,19,.7)]),
    'tram': dict(label='Tram', group='road', keywords=['tramvaj', 'streetcar', 'public transport', 'city'],
        surfaces=[rect(3,7,18,10,2)], structure=['M9 3L12 5L15 3M12 5V7M5 19H19M3 21H21'],
        details=['M3 12H21M9 7V12M15 7V12']),
    'electric-car': dict(label='Electric car', group='road', keywords=['električni auto', 'ev', 'charging', 'punjenje'],
        surfaces=['M3 18V12L5 7H13L15 12V18Z'], structure=['M5 18V21M13 18V21M20 3L17 7H21L18 11'],
        details=['M3 12H15M6 15h.01M12 15h.01']),
    'caravan': dict(label='Caravan', group='road', keywords=['kamp prikolica', 'camper', 'rv', 'camping'],
        surfaces=['M3 6H16Q20 6 20 10V17H3Z',circle(8,19,2)], structure=['M20 17H21'],
        details=['M6 9H11V13H6Z','M15 17V10H20'], holes=['M6 9H11V13H6Z',circle(8,19,.7)]),
    'cable-car': dict(label='Cable car', group='road', keywords=['žičara', 'zicara', 'gondola', 'mountain'],
        surfaces=[rect(5,9,14,12,3)], structure=['M3 6L21 3M12 4.5V9'],
        details=['M5 16H19M12 9V16']),
    'traffic-light': dict(label='Traffic light', group='road', keywords=['semafor', 'signal', 'road', 'stop'],
        surfaces=[rect(8,3,8,16,2)], structure=['M12 19V21'],
        details=[circle(12,6,1),circle(12,11,1),circle(12,16,1)], holes=[circle(12,6,1),circle(12,11,1),circle(12,16,1)]),
    'fuel-pump': dict(label='Fuel pump', group='road', keywords=['benzinska', 'gorivo', 'petrol', 'gas station'],
        surfaces=[rect(4,3,11,18,2)], structure=['M3 21H16M15 11H17V17A2 2 0 0 0 21 17V9L18 6M18 6V10H21'],
        details=['M7 6H12V10H7Z'], holes=['M7 6H12V10H7Z']),
    'train': dict(label='Train', group='rail-air-sea', keywords=['vlak', 'railway', 'rail', 'station'],
        surfaces=[rect(5,3,14,15,3)], structure=['M8 18L5 21M16 18L19 21'],
        details=['M5 10H19M12 3V10','M8 14h.01M16 14h.01']),
    'metro': dict(label='Metro', group='rail-air-sea', keywords=['podzemna', 'subway', 'underground', 'station'],
        surfaces=[rect(8,8,8,10,2)], structure=['M3 21V12A9 9 0 0 1 21 12V21M10 18L8 21M14 18L16 21'],
        details=['M8 12H16','M12 15h.01']),
    'railway-track': dict(label='Railway track', group='rail-air-sea', keywords=['tračnice', 'tracnice', 'rail', 'track', 'željeznica'],
        structure=['M8 3L5 21M16 3L19 21M7.7 5H16.3M7.1 9H16.9M6.4 13H17.6M5.7 17H18.3M5 21H19']),
    'helicopter': dict(label='Helicopter', group='rail-air-sea', keywords=['helikopter', 'flight', 'aircraft', 'air'],
        surfaces=['M10 9H15A6 6 0 0 1 21 15V17H11Q8 17 8 14V11Z'],
        structure=['M8 12L3 10V6M6 5H20M13 5V9M11 17V20M18 17V20M8 20H21'],
        details=['M15 9V14H20']),
    'ferry': dict(label='Ferry', group='rail-air-sea', keywords=['trajekt', 'ship', 'brod', 'sea', 'port'],
        surfaces=['M3 13H21L18 18H6Z','M6 13V7H17V13Z'],
        structure=['M10 7V3H14V7M3 21Q6 19 9 21Q12 19 15 21Q18 19 21 21'],
        details=['M9 10h.01M14 10h.01'], cuts=['M3 13H21']),
    'speedboat': dict(label='Speedboat', group='rail-air-sea', keywords=['gliser', 'boat', 'brod', 'motorboat'],
        surfaces=['M3 13H21L17 18H6Z','M7 13L10 7H15L18 13Z'],
        structure=['M3 21Q6 19 9 21Q12 19 15 21Q18 19 21 21'], details=['M12 7V13'],cuts=['M3 13H21']),
    'anchor': dict(label='Anchor', group='rail-air-sea', keywords=['sidro', 'nautical', 'harbor', 'luka'],
        surfaces=[circle(12,5,2)], structure=['M12 7V21M8 10H16M3 14Q3 21 12 21Q21 21 21 14M3 14L6 16M21 14L18 16'],
        holes=[circle(12,5,1)]),
    'lighthouse': dict(label='Lighthouse', group='rail-air-sea', keywords=['svjetionik', 'coast', 'obala', 'beacon'],
        surfaces=['M9 9H15L18 21H6Z','M8 9V5L12 3L16 5V9Z'],
        structure=['M3 6H5M19 6H21'], details=['M8 9H16M8 13H16M7 17H17']),
    'airport': dict(label='Airport tower', group='rail-air-sea', keywords=['aerodrom', 'zračna luka', 'airport', 'control tower'],
        surfaces=['M9 11H15V21H9Z','M4 4H20L18 11H6Z'],
        structure=['M6 21H18M12 4V3'], details=['M12 4V11M5 7H19']),
    'hot-air-balloon': dict(label='Hot air balloon', group='rail-air-sea', keywords=['balon', 'balloon', 'air', 'flight'],
        surfaces=['M12 3C2 3 3 11 8 15H16C21 11 22 3 12 3Z','M9 18H15V21H9Z'],
        structure=['M8 15L9 18M16 15L15 18'], details=['M12 3C8 6 8 11 10 15M12 3C16 6 16 11 14 15']),
    'rolling-suitcase': dict(label='Rolling suitcase', group='luggage-documents', keywords=['kofer', 'suitcase', 'luggage', 'prtljaga', 'wheels'],
        surfaces=[rect(6,7,12,12,2)], structure=['M9 7V3H15V7M8 19V21M16 19V21'],
        details=['M9 10V16M15 10V16']),
    'backpack': dict(label='Backpack', group='luggage-documents', keywords=['ruksak', 'backpack', 'bag', 'torba'],
        surfaces=['M5 10A7 7 0 0 1 19 10V21H5Z'], structure=['M9 4V3H15V4'],
        details=['M5 12H19','M8 15H16V18H8Z']),
    'passport': dict(label='Passport', group='luggage-documents', keywords=['putovnica', 'passport', 'identity', 'border'],
        surfaces=[rect(5,3,14,18,2)], details=[circle(12,10,4),'M9 18H15'],holes=[circle(12,10,4)],
        fine_details=['M12 6C9 8 9 12 12 14C15 12 15 8 12 6ZM8 10H16'],
        solid_overlays=['M12 6C9 8 9 12 12 14C15 12 15 8 12 6ZM8 10H16']),
    'boarding-pass': dict(label='Boarding pass', group='luggage-documents', keywords=['ukrcajna propusnica', 'boarding', 'ticket', 'karta', 'flight'],
        surfaces=['M3 5H21V10A2 2 0 0 0 21 14V19H3V14A2 2 0 0 0 3 10Z'],
        details=['M15 5V8M15 11V13M15 16V19','M7 9H11M7 13H9']),
    'luggage-tag': dict(label='Luggage tag', group='luggage-documents', keywords=['oznaka prtljage', 'tag', 'label', 'kofer'],
        surfaces=['M5 8L9 4H17V21H5Z'], structure=['M11 7V3'], details=['M8 12H14M8 16H12']),
    'duffel-bag': dict(label='Duffel bag', group='luggage-documents', keywords=['putna torba', 'duffel', 'weekend', 'gym bag'],
        surfaces=['M6 8H18Q21 8 21 11V20H3V11Q3 8 6 8Z'],
        structure=['M8 8V6A4 3 0 0 1 16 6V8'], details=['M7 8V20M17 8V20','M10 12H14']),
    'luggage-cart': dict(label='Luggage cart', group='luggage-documents', keywords=['kolica za prtljagu', 'trolley', 'baggage', 'airport'],
        surfaces=[rect(8,7,11,10,2)], structure=['M3 3H5V17H21M11 7V4H16V7',circle(8,20,1),circle(18,20,1)],
        details=['M11 10V13']),
    'baggage-claim': dict(label='Baggage claim', group='luggage-documents', keywords=['preuzimanje prtljage', 'conveyor', 'luggage', 'airport'],
        surfaces=[rect(7,5,10,9,2),rect(3,17,18,4,2)], structure=['M10 5V3H14V5'],
        details=['M10 8V11','M7 19h.01M12 19h.01M17 19h.01']),
    'travel-adapter': dict(label='Travel adapter', group='luggage-documents', keywords=['adapter', 'utikač', 'utikac', 'plug', 'power'],
        surfaces=[rect(5,7,14,12,3)], structure=['M8 7V3M16 7V3M12 19V21'],
        details=['M9 11V13M15 11V13M12 16h.01']),
    'customs': dict(label='Customs', group='luggage-documents', keywords=['carina', 'customs', 'border', 'kontrola'],
        surfaces=[circle(7,6,2),'M3 17V13Q3 10 7 10Q11 10 11 13V17Z',rect(15,11,6,6,1)],
        structure=['M3 20H21M16 11V8H20V11'], details=['M6 14H8']),
    'hotel': dict(label='Hotel', group='stay-navigation', keywords=['hotel', 'accommodation', 'smještaj', 'smjestaj'],
        surfaces=[rect(5,3,14,18,2)], details=['M9 7h.01M15 7h.01M9 11h.01M15 11h.01','M10 21V16H14V21']),
    'reception': dict(label='Reception bell', group='stay-navigation', keywords=['recepcija', 'bell', 'service', 'check in'],
        surfaces=['M4 17A8 8 0 0 1 20 17Z'], structure=['M3 21H21M12 9V6M9 6H15'],
        details=['M7.5 14Q8.5 12 10 12']),
    'room-key': dict(label='Room key', group='stay-navigation', keywords=['ključ sobe', 'kljuc', 'key card', 'hotel'],
        surfaces=[rect(3,5,18,14,3)], details=['M3 9H21',circle(8,14,1.5),'M9.5 14H16V16'],holes=[circle(8,14,1.5)]),
    'door-hanger': dict(label='Door hanger', group='stay-navigation', keywords=['ne smetaj', 'do not disturb', 'door', 'hotel'],
        surfaces=['M7.5 21V7.5A4.5 4.5 0 1 1 16.5 7.5H14A2 2 0 1 0 10 7.5V12H17V21Z'], details=['M10.5 17H14.5']),
    'route': dict(label='Route', group='stay-navigation', keywords=['ruta', 'itinerary', 'putanja', 'navigation'],
        surfaces=[circle(5,5,2),circle(19,19,2)], structure=['M7 5H16A4 4 0 0 1 16 13H8A3 3 0 0 0 8 19H17'],
        holes=[circle(5,5,.8),circle(19,19,.8)]),
    'signpost': dict(label='Signpost', group='stay-navigation', keywords=['putokaz', 'direction', 'sign', 'smjer'],
        surfaces=['M5 4H17L21 7L17 10H5Z','M7 12H19V18H7L3 15Z'], structure=['M12 18V21','M12 10V12'],
        details=['M8 7H13','M10 15H16']),
    'beach-umbrella': dict(label='Beach umbrella', group='stay-navigation', keywords=['suncobran', 'plaža', 'plaza', 'beach', 'holiday'],
        surfaces=['M3 12A9 8 0 0 1 21 12Z'], structure=['M12 12V21M7 21H17'],
        details=['M12 4Q7 7 8 12M12 4Q17 7 16 12']),
    'cabin': dict(label='Cabin', group='stay-navigation', keywords=['koliba', 'cottage', 'chalet', 'smještaj', 'mountain'],
        surfaces=['M5 11L12 4L19 11V21H5Z'],structure=['M3 12L12 3L21 12'],
        details=['M10 21V14H14V21M5 12H19M5 15H7.5M16.5 15H19M5 18H7.5M16.5 18H19']),
    'swimming-pool': dict(label='Swimming pool', group='stay-navigation', keywords=['bazen', 'pool', 'hotel', 'resort'],
        structure=['M6 15V6A3 3 0 0 1 12 6M15 15V6A3 3 0 0 1 21 6M6 8H15M6 12H15',
                   'M3 17Q6 15 9 17Q12 15 15 17Q18 15 21 17M3 21Q6 19 9 21Q12 19 15 21Q18 19 21 21']),
    'rest-area': dict(label='Rest area', group='stay-navigation', keywords=['odmorište', 'odmoriste', 'picnic', 'table', 'stol'],
        surfaces=['M7 7H17V10H7Z'], structure=['M9 10L6 21M15 10L18 21M3 16H21M4 16V19M20 16V19']),
}


def main():
    existing = set()
    for file in ROOT.glob('*.json'):
        if file.stem == 'transport':
            continue
        data = json.loads(file.read_text(encoding='utf-8'))
        if isinstance(data, list):
            existing.update(item['id'] for item in data if isinstance(item, dict) and 'id' in item)
    assert not existing.intersection(ICONS), ('Duplicate icon IDs', existing.intersection(ICONS))
    assert all(sum(spec['group'] == group for spec in ICONS.values()) == 10 for group in GROUPS)
    outputs, metadata = [], []
    for name, spec in ICONS.items():
        for style in ('outline', 'duotone', 'solid'):
            outputs.append((ROOT / 'src' / style / f'{name}.svg', render_icon(spec, style)))
        metadata.append(dict(id=name, label=spec['label'], group=spec['group'],
                             groupLabel=GROUPS[spec['group']], keywords=[*spec['keywords'], 'travel', 'putovanje']))
    for target, svg in outputs:
        target.write_text(svg, encoding='utf-8', newline='\n')
    (ROOT / 'transport.json').write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f'Travel & Transport: {len(ICONS)} motifs, {len(outputs)} SVGs')


if __name__ == '__main__':
    main()

# Definition of done — po ikoni

Što svaka ikona mora imati da biblioteka bude profesionalna. ✅ = postoji, ⏳ = roadmap.

## Metapodaci (`general.json`, `hobbies.json`)

| Polje | Zašto | Stanje |
|---|---|---|
| `id` (`trash`) | javni API, ne mijenja se nakon objave | ✅ |
| `label`, `group` | katalog, filtriranje | ✅ |
| `keywords` (`delete`, `remove`, `bin`) | pretraga po značenju | ✅ |
| `since` (`0.1.0`) | changelog, oznaka „novo” | ⏳ |
| `deprecated`, `replacedBy` | preimenovanje bez pucanja koda (alias do iduće breaking verzije) | ⏳ |
| `author` | zasluge doprinositeljima | ⏳ |

## Isporuka

| Format | Za koga | Stanje |
|---|---|---|
| SVG × 3 stila (outline, duotone, solid) | svi | ✅ |
| React komponenta (`@vectilume/react`) | React aplikacije | ✅ |
| React Native komponenta | mobilne aplikacije | ⏳ |
| SVG sprite | statični HTML, e-mail | ⏳ |
| PNG 1× / 2× (24, 48 px) | prezentacije, alati bez SVG-a | ⏳ |
| Figma biblioteka | dizajneri | ⏳ |

## Kvaliteta SVG-a

- ✅ Validator: mreža 24×24, stroke 1.75, `currentColor` / CSS varijable, bez hardkodiranih boja.
- ✅ Gloss pravila: razmak odsjaja ≥ 0.5, granice 2–22, solid ne gubi dijelove crteža.
- ✅ Pristupačnost u komponentama: `title` / `aria-label`, bez naslova `aria-hidden`.
- ⏳ Optimizacija veličine (SVGO) bez vidljive promjene.
- ⏳ Vizualni regresijski test: usporedba slika pri svakoj promjeni ikone.

## Katalog, po ikoni

- ✅ Pregled na mreži, veličine 16–48, svijetlo/tamno, prikaz u sučelju („In use”).
- ✅ Copy SVG.
- ✅ Pretraga po ključnim riječima.
- ⏳ Copy JSX i import naredba (`import { Trash } from "@vectilume/react"`).
- ⏳ Download SVG / PNG.
- ⏳ Prikaz verzije dodavanja (`since`).

## Redoslijed

1. Ključne riječi ✅
2. React paket s pristupačnošću ✅
3. Katalog: Copy JSX, import naredba, Download
4. `since`, `deprecated`, alias — prije prve objave na npm
5. SVGO
6. Sprite, PNG, vizualni regresijski testovi
7. Figma

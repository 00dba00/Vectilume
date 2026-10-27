# Plan uvođenja Vectilume ikona u Scout AI i NBA

> **Status: čeka redizajn Hobija.** Kad su hobiji gotovi, krećemo redom po koracima ispod.

## Stanje (2026-10-26)

- Kolekcija **Općenito**: 192 ikone × 3 stila — pokriva sve što koriste Scout AI (web i
  mobile) i NBA frontend, osim sportskih ikona.
- Kolekcija **Hobiji**: 140 ikona, redizajn u tijeku. NBA iz nje treba basketball (44 mjesta),
  football, boxing, karate, hiking, gym i video-games.
- Popisi i mapiranje starih imena na nova: `docs/scout-ai-icons.md`, `docs/nba-icons.md`.
- Na npm još ništa nije objavljeno (`packages/icons-svg/release.json` je prazan).

## Što nedostaje

1. **Objava na npm** — kolekcije se potvrđuju u katalogu (panel „Objava na npm”), paket se
   slaže s `pnpm --filter @vectilume/icons-svg release` i objavljuje iz `dist/npm`.
2. **React paket `@vectilume/react`** — aplikacije koriste ikone kao React komponente
   (`<TrendingUp size={16} />`). Gole SVG datoteke nisu dovoljne: kao `<img>` ne nasljeđuju boju
   (`currentColor`), a ručno uvoženje SVG-ova po datoteci je sporo. Paket treba:
   - komponentu po ikoni i stilu: `Check`, `CheckDuotone`, `CheckSolid`;
   - propove `size`, `color`, `className`, `style` i ostale SVG atribute;
   - tree-shaking (aplikacija dobiva samo ikone koje uvozi);
   - generiranje iz SVG-ova, da se ne održava ručno.
3. **React Native varijanta** za Scout mobile (danas Ionicons) — preko `react-native-svg`.
4. **Vizualni pregled** svih novih ikona u katalogu prije prve objave.

## Redoslijed

1. Završiti redizajn Hobija.
2. Pregledati Općenito i Hobije u katalogu; ispraviti što treba.
3. Napraviti `@vectilume/react`. ✅ Slaže ga isti `release` korak u `dist/react` (iz istih potvrđenih kolekcija).
4. Potvrditi Općenito i Hobije u panelu, objaviti `@vectilume/icons` i `@vectilume/react`
   verzije `0.1.0`.
5. **Scout AI web** — prvi prelazi (sve ikone su u Općenito). Zamjena importa po tablici iz
   `docs/scout-ai-icons.md` (npr. `X` → `Close`, `Trash2` → `Trash`), datoteku po datoteku.
6. **NBA frontend** — zamjena MUI i lucide ikona po tablici iz `docs/nba-icons.md`, uključujući
   sportske ikone iz Hobija.
7. **Scout AI mobile** — kad postoji React Native paket.
8. Stranica „Usage” u katalogu — plan u `docs/usage-plan.md` (nakon `0.1.0`).

## Pravila nakon prve objave

- Ime ikone je javni API: uklanjanje je breaking verzija (release skripta to provjerava prema
  zadnjoj objavljenoj verziji).
- Preimenovanje nije breaking ako novi unos zadrži staro ime u `aliases`, npr.
  `{ "id": "trash", "aliases": ["bin"], … }`. Staro ime se i dalje objavljuje (SVG datoteka,
  `@deprecated` React komponenta, `deprecated`/`replacedBy` u manifestu); alias se briše tek u
  breaking verziji.
- Premještanje ikone između objavljenih kolekcija i kategorija je sigurno.

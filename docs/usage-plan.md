# Plan: stranica „Usage” u katalogu

> **Status: čeka prvu objavu (`0.1.0`).** Prije objave nema podataka; ništa od ovoga se ne radi ranije.

Cilj: vidjeti koliko se Vectilume koristi i koje su ikone važne (njih ne preimenovati olako).
Bez telemetrije u paketima — samo javni izvori i skeniranje vlastitog koda.

## 1. npm preuzimanja (po paketu)

- Izvor: `https://api.npmjs.org/downloads/range/last-year/@vectilume/icons` (i `@vectilume/react`).
- Prikaz: graf tjednih preuzimanja za oba paketa + ukupno zadnjih 7 / 30 dana.
- Ograničenje: samo po paketu, ne po ikoni; uključuje CI i mirrore, pa je broj grub.

## 2. Top ikone prema jsDelivr (po datoteci)

- Izvor: `https://data.jsdelivr.com/v1/stats/packages/npm/@vectilume/icons/files?period=month`.
- Prikaz: top 20 ikona po dohvatima (spojiti stilove: `outline/trash.svg`, `duotone/trash.svg`… → `trash`,
  s raspodjelom po stilu); klik otvara inspektor ikone.
- Ograničenje: broji samo korištenje preko CDN-a, ne `npm install` + bundler.

## 3. Ikone u Scout AI i NBA (skeniranje koda)

- Skripta u `packages/tooling` (npr. `pnpm usage <putanje do repozitorija>`), pokreće se lokalno.
- Traži `import { … } from "@vectilume/react"` i `@vectilume/icons/<stil>/<ime>.svg`; imena komponenti
  vraća u id ikone preko istog `componentName` pravila (uključujući deprecated aliase).
- Rezultat: `packages/icons-svg/usage.json` — po ikoni: aplikacija, stil, broj mjesta, datoteke.
- Prikaz: tablica po ikoni; oznaka „used by Scout AI / NBA” i u inspektoru.
- Korist: prije preimenovanja ili brisanja odmah se vidi što bi puklo; release može upozoriti ako
  se uklanja ikona koju koristi naša aplikacija.

## Tehničke odluke za kasnije

- Podaci 1 i 2 se dohvaćaju u pregledniku ili pri buildu kataloga — provjeriti CORS oba API-ja i
  hoće li katalog biti deployan (zasad nije).
- Ako se ništa ne objavljuje preko CDN-a, točka 2 se odgađa.

## Redoslijed

1. Objaviti `0.1.0`.
2. Skripta za skeniranje + `usage.json` (korisno odmah nakon prelaska Scout AI weba).
3. Stranica „Usage”: npm graf, jsDelivr top lista, tablica iz `usage.json`.

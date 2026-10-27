# Objava na npm — koraci

Objavljuju se dva paketa iz istih potvrđenih kolekcija i s istom verzijom:
`@vectilume/icons` (SVG + `manifest.json`) i `@vectilume/react` (komponente).

## Prije objave

1. U katalogu, panel za objavu: potvrdi kolekcije i verziju (upisuje se u
   `packages/icons-svg/release.json`). Commit.
2. Provjere iz roota: `pnpm validate && pnpm test && pnpm typecheck`.
3. Vizualna provjera: `pnpm --filter @vectilume/icons-svg visual-diff` uspoređuje izvorne SVG-ove sa
   zadnjom objavljenom verzijom i piše `packages/icons-svg/dist/visual-diff.html` (staro / novo /
   promijenjeni pikseli). Svaka „visible change” mora biti namjerna; „code-only” znači da se crtež
   nije promijenio. Izvor prolazi istu SVGO optimizaciju kao release, pa se uspoređuje točno ono što bi se objavilo.
4. Složi pakete: `pnpm --filter @vectilume/icons-svg release`
   → `packages/icons-svg/dist/npm` i `packages/icons-svg/dist/react`.
   Skripta s npm-a čita zadnju objavljenu verziju (treba mreža) i ruši release ako bi ikona nestala
   bez breaking verzije; kod breaking verzije ispiše aliase koji se mogu obrisati.
5. Pregledaj sadržaj: `npm pack --dry-run` u oba `dist/` direktorija
   (orijentacijski za 835 ikona sa SVGO-om: icons ≈ 390 kB, react ≈ 280 kB).

## Objava

6. `npm login` — račun mora biti član organizacije `vectilume` (2FA kod pri objavi).
7. Objavu pokreni **u vlastitom terminalu** (passkey u Chromeu ne daje OTP kod, pa `npm publish`
   iz Claude Codea pada s `EOTP`). npm koristi staged publishing: verzija postane javna nakon
   potvrde i par minuta čekanja (za `0.1.0` ≈ 5 min). Prvo SVG paket, pa React (release skripta sljedeći put čita manifest od `@vectilume/icons`):
   ```sh
   cd packages/icons-svg/dist/npm   && npm publish --access public
   cd ../react                      && npm publish --access public
   ```
8. Provjera: `npm view @vectilume/icons version`, `npm view @vectilume/react version`,
   i da se otvara `https://unpkg.com/@vectilume/icons@<verzija>/manifest.json`.
9. Tag: `git tag v<verzija> && git push origin v<verzija>`.

## Sljedeće verzije

- Nove ikone ili kolekcije: povećaj patch/minor u `release.json` (`0.1.0` → `0.2.0`).
- Uklanjanje ikone ili aliasa: breaking verzija (na 0.x to je minor, npr. `0.2.x` → `0.3.0`).
- Objavljena verzija se ne može ponovno objaviti; greška = nova verzija.

## Provjereno 2026-10-27 (probni build, sve kolekcije)

- Next 16.4.3 + React 19.3: build prolazi, server renderira ispravan SVG, u klijentski bundle
  ulaze samo uvezene ikone (3 ikone ≈ 2 kB).
- `index.d.ts` prolazi strogi TypeScript bez `skipLibCheck`.
- `@vectilume/icons/outline/trash.svg` i `@vectilume/icons/manifest.json` se razrješavaju.

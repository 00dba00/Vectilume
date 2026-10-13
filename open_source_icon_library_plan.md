# Vectilume — koncept i plan razvoja open-source biblioteke ikona

**Status:** početni koncept  
**Naziv projekta:** **Vectilume** (potvrđeno ime)  
**Model:** potpuno besplatna open-source biblioteka  
**Cilj:** napraviti prepoznatljivu, prilagodljivu i praktičnu kolekciju SVG ikona koju će developeri i dizajneri stvarno koristiti.

### Identitet projekta

- **Brend:** Vectilume
- **Puni naziv:** Vectilume Icons
- **Predložena domena:** `vectilume.io` — dostupnost i mogućnost registracije nisu potvrđene
- **Predloženi GitHub naziv:** `vectilume` — dostupnost nije potvrđena
- **Predloženi npm naziv:** `@vectilume/react` — dostupnost nije potvrđena
- **Ideja imena:** *vector* + *illuminate* — jasne, izražajne vektorske ikone.
- **Radni slogan:** *Make every pixel count.*

> Ime **Vectilume** je odabrano. Domena, korisničko ime i naziv paketa samo su prijedlozi dok se ne provjeri njihova dostupnost.

---

## 1. Ideja i pozicioniranje

Razviti vlastitu kolekciju ikona, inspiriranu jednostavnošću korištenja biblioteka poput Rune Icons, Lucide, Phosphor i Iconoir, ali s vlastitim vizualnim identitetom.

**Primarni cilj nije monetizacija.** Projekt služi kao javno koristan alat, open-source doprinos i demonstracija dizajnerskih i razvojnih sposobnosti.

Ne graditi još jednu generičku kolekciju SVG ikona. Razlikovati se kroz tri povezana elementa:

1. **Prepoznatljiva geometrija** — dosljedan karakter ikona, a ne kopija postojećih biblioteka.
2. **Fleksibilne boje i teme** — prilagodba cijele kolekcije identitetu aplikacije u nekoliko klikova.
3. **Semantički povezane i specijalizirane ikone** — posebno za SaaS, financije, poslovne procese, produktivnost i svakodnevne potrebe.

### Referentne biblioteke

| Biblioteka | Istaknute značajke | Što naučiti |
|---|---|---|
| [Rune Icons](https://www.runeicons.com/) | Editor, više stilova, SVG/JSX | Jednostavnost web editora |
| [Lucide](https://lucide.dev/) | Konzistentnost, jednostavan API | Jasan vizualni sustav |
| [Phosphor](https://phosphoricons.com/) | Više stilova i debljina | Fleksibilnost varijanti |
| [Iconoir](https://iconoir.com/) | Minimalistički stil, brojne integracije | Organizacija i distribucija |

> Sama promjena boje, debljine linije ili ponuda više stilova nije dovoljna diferencijacija — konkurencija već ima slične funkcije.

---

## 2. Vizualni identitet ikona

### Preporučeni početni smjer: Soft Geometric

Spoj modernog minimalizma, geometrijske preciznosti i blago zaobljenih oblika. Ikone moraju ostati jasne i pri 16 px.

| Parametar | Početna specifikacija |
|---|---|
| Osnovni SVG viewBox | `0 0 24 24` |
| Dizajnerska mreža | 24 × 24 px |
| Zadana debljina linije | 1.75 px |
| Završeci linija | `round` |
| Spojevi | `round` |
| Kutovi | Blago zaobljeni |
| Primarna boja | Podesiva |
| Sekundarna boja | Neovisno podesiva |
| Zadane izvozne veličine | 16, 20, 24, 32, 48 px |
| Pozadine za provjeru | Svijetla i tamna |

**Pravila dizajna:**

- Geometrija i optičke proporcije moraju biti dosljedne kroz cijelu kolekciju.
- Koristiti suptilne karakteristične detalje, ali ne na štetu čitljivosti.
- Elementi ikona trebaju biti optički centrirani; nije dovoljno samo matematičko centriranje.
- Izbjegavati previše sitnih linija i detalja koji nestaju na malim veličinama.
- Ikone istog značenja moraju zadržati prepoznatljiv siluetni oblik u sva tri stila.
- Provjeriti kontrast i izgled na različitim pozadinama.
- Ne kopirati tuđe SVG putanje; koristiti originalnu geometriju.

### Tri stila

| Stil | Opis | Primjena |
|---|---|---|
| **Outline** | Čiste linije, minimalistički izgled | Navigacija, forme, opći UI |
| **Duotone** | Primarni i sekundarni dio ikone s neovisnim bojama | Kartice, dashboardi, vizualni naglasci |
| **Solid** | Ispunjene siluete istog osnovnog oblika | Aktivna stanja, navigacija, mali elementi |

Sva tri stila trebaju dijeliti zajedničku osnovnu geometriju. Duotone bi mogao postati zaštitni znak projekta.

### Vizualni smjerovi za usporedbu

Prije izbora konačnog stila izraditi nekoliko probnih ikona u tri pristupa:

1. **Soft Geometric** — minimalistički, meko zaobljen.
2. **Modern Duotone** — dvobojni pristup s uravnoteženim plohama.
3. **Distinctive** — izraženiji originalni geometrijski detalji.

Nakon usporedbe izabrati jedan sustav pravila i primijeniti ga na cijelu kolekciju.

---

## 3. Editor ikona na web stranici

Korisnik odabire ikonu i odmah mijenja njezin izgled uz prikaz rezultata uživo.

| Postavka | Mogućnosti |
|---|---|
| Primary color | Bilo koja HEX/CSS boja |
| Secondary color | Neovisna boja (posebno za Duotone) |
| Opacity | 0–100 % |
| Stroke width | Primjerice 1–3 px, gdje je primjenjivo |
| Size | 16–128 px i custom |
| Style | Outline / Duotone / Solid |
| Background preview | Light / Dark / Custom |
| Export | SVG, React/JSX, PNG; dodatni formati naknadno |

**UX ciljevi:**

- Pretraživanje po nazivu, kategoriji i sinonimima.
- Klikom se otvara detalj ikone i prikaz svih dostupnih stilova.
- Mogućnost kopiranja SVG-a i JSX-a jednim klikom.
- Prilagodba teme primjenjuje se odmah na pregled cijele kolekcije.
- Nema registracije, ograničenja korištenja ni plaćanja.
- Responsivan prikaz i podrška za tipkovnicu.

### Primjer React API-ja

```jsx
<Icon
  name="car"
  variant="duotone"
  size={32}
  primary="#2563EB"
  secondary="#93C5FD"
  strokeWidth={1.75}
/>
```

### Tehnička načela boja

- Za jednobojne ikone koristiti `currentColor` kad god je prikladno.
- Za Duotone koristiti CSS custom properties, npr. `--icon-primary` i `--icon-secondary`.
- Ne generirati zasebnu datoteku za svaku kombinaciju boja: mijenjati ih dinamički.
- Paziti da svojstva `stroke` i `fill` nisu nekontrolirano hardkodirana.
- Omogućiti da boje nasljeđuju temu aplikacije, uz mogućnost lokalnog overridea.

---

## 4. Semantička stanja ikona

Osim osnovnih ikona, razviti povezane varijante istog pojma. Na webu ih prikazivati kao skupinu radi jednostavnog otkrivanja.

### Primjeri

**Calendar**

- Calendar
- Calendar Add
- Calendar Completed
- Calendar Warning
- Calendar Cancelled

**Car**

- Car
- Car Service
- Car Warning
- Car Charging
- Car Maintenance

**Finance**

- Wallet
- Wallet Add
- Wallet Minus
- Budget Limit
- Budget Warning

Ove varijante mogu biti zasebne semantičke ikone u paketu, umjesto oslanjanja na kompleksno dinamičko slaganje simbola tijekom izvođenja. Time se osigurava čitljivost i konzistentan dizajn.

---

## 5. Posebna diferencijacija: specijalizirane kategorije

Ciljati potrebe modernih SaaS, fintech i productivity aplikacija, gdje generičke ikone često nisu dovoljno precizne.

### Primjer: Finance & Payments

| Ikona | Namjena |
|---|---|
| Receipt Scan | Skeniranje računa |
| Budget Limit | Ograničenje budžeta |
| Recurring Expense | Ponavljajući troškovi |
| Split Payment | Podjela troška |
| Savings Goal | Cilj štednje |
| Subscription | Pretplate |
| Expense Category | Kategorije troškova |
| Cash Flow | Novčani tok |

Moguće dodatne niše: household management, dokumenti i e-potpis, statusi poslovnih procesa, sigurnost, administracija, analitika i upravljanje imovinom.

Biblioteku je korisno testirati u stvarnim projektima, primjerice **Dayfolio** i **TestCove**, radi otkrivanja nedostajućih simbola i procjene čitljivosti u stvarnom sučelju.

---

## 6. Icon Theme Generator

Jedna od ključnih funkcionalnosti: korisnik definira vizualnu temu, a sve ikone u katalogu automatski se prilagođavaju.

### Primjer teme

```json
{
  "primary": "#2563EB",
  "secondary": "#93C5FD",
  "strokeWidth": 1.75,
  "radius": "rounded",
  "variant": "duotone"
}
```

### Izlazne mogućnosti

1. Izvoz pojedinačnog SVG-a.
2. Izvoz ZIP paketa odabranih ili svih ikona u željenoj temi.
3. Kopiranje CSS varijabli za aplikaciju.
4. Izvoz ili kopiranje React konfiguracije.

**Tehnička napomena:** početni MVP može koristiti statične SVG putanje te parametre za boju i linije. Dinamička promjena zaobljenosti (`radius`) znatno je složenija jer može zahtijevati alternativne putanje, pa je možeš ostaviti za kasniju fazu ili definirati samo kao unaprijed pripremljenu stilsku opciju.

---

## 7. Plan početne kolekcije

Za prvi javni release cilj je **150 originalnih ikona**, a ne tisuće prosječnih.

| Kategorija | Broj osnovnih ikona |
|---|---:|
| Navigation & UI | 30 |
| Finance & Payments | 25 |
| Communication | 15 |
| Files & Documents | 20 |
| Calendar & Productivity | 20 |
| Home & Lifestyle | 15 |
| Technology & Development | 15 |
| Security & Privacy | 10 |
| **Ukupno** | **150** |

Uz tri stila to znači **450 SVG varijanti**, ako se svaka ikona izvede u svakom stilu.

### Prvih 12 ikona za vizualni prototip

1. Home
2. Car
3. Wallet
4. Calendar
5. User
6. Settings
7. Search
8. Bell
9. Shield
10. Document
11. Chart
12. Heart

Za svaku prikazati Outline, Duotone i Solid te provjeriti izgled na svijetloj i tamnoj podlozi i pri 16/24/32 px. Prije masovne izrade potvrditi dizajnerski sustav.

---

## 8. Tehnička arhitektura

| Komponenta | Preporuka |
|---|---|
| Web katalog / editor | Next.js + TypeScript |
| Izrada geometrije | SVG + Figma ili Inkscape |
| Paket ikona | TypeScript, ESM |
| React komponente | React + SVG |
| Tematske boje | CSS custom properties / `currentColor` |
| Optimizacija SVG-a | SVGO |
| Dokumentacija | MDX |
| Hosting | Vercel ili Cloudflare |
| Repozitorij | GitHub |
| Distribucija | npm |
| Licencija | MIT ili Apache-2.0 (konačno odabrati prije objave) |

### Organizacija monorepozitorija — prijedlog

```text
vectilume/
├── apps/
│   └── web/                  # Katalog i live editor
├── packages/
│   ├── icons-svg/            # Izvorne SVG datoteke
│   ├── icons-react/          # Generirane React komponente
│   └── tooling/              # SVG validacija, build, optimizacija
├── docs/
│   ├── design-guidelines.md
│   ├── icon-naming.md
│   └── contributing.md
└── README.md
```

### Kvaliteta i performanse

- Tree-shaking i pojedinačni uvoz ikona bez učitavanja cijele kolekcije.
- Standardizirani `viewBox`, nazivi, atribute i dosljednost stilova.
- Testovi ispravnosti SVG datoteka.
- Automatizirane provjere veličine i pravila geometrije.
- Vizualni regression testovi / pregledne kontaktne ploče.
- Optimizacija SVG-a uz očuvanje važnih putanja.
- Dokumentirani proces prijedloga novih ikona i prijava grešaka.
- Kasnije mogućnost Figma plugina i dodatnih framework paketa.

### Uloga AI alata

AI može pomoći u pisanju SVG-a, generiranju komponenti, validaciji, dokumentaciji i automatizaciji izvoza. **Vizualni QA ostaje obvezan**: ne treba automatski prihvaćati ikone koje nisu usklađene s pravilima geometrije i čitljivosti.

---

## 9. Model distribucije i usvajanja

**Besplatno i bez prepreka korištenju.**

- Javni GitHub repozitorij.
- npm paket s jasnim nazivima i API-jem.
- Jednostavna dokumentacija i primjeri korištenja.
- Katalog s instant pretraživanjem, kopiranjem i izvozom.
- Bez obvezne registracije i bez premium zaključavanja.
- Jasna open-source licencija.
- Javna lista planiranih ikona i mogućnost prijedloga zajednice.
- Objave/demonstracije u frontend i dizajnerskim zajednicama te na Product Huntu.

Metrike koje imaju smisla pratiti: npm preuzimanja, GitHub stars, broj aktivnih korisnika kataloga, broj ponovljenih posjeta, prijedlozi novih ikona i uporaba u otvorenim projektima. Same metrike nisu dokaz stvarne upotrebe, ali mogu pokazati trend usvajanja.

---

## 10. Faze implementacije

### Faza 0 — Definicija dizajnerskog sustava

- [x] Odabrati naziv projekta: **Vectilume**.
- [ ] Provjeriti dostupnost domene `vectilume.io`, npm naziva `@vectilume/react`, GitHub naziva `vectilume` i moguće sukobe sa žigovima.
- [ ] Razraditi tri vizualna smjera.
- [ ] Dizajnirati 12 probnih ikona.
- [ ] Prikazati ih u stvarnim UI komponentama, dark/light temi i na više veličina.
- [ ] Odabrati jedan prepoznatljiv dizajnerski jezik.
- [ ] Dokumentirati mrežu, linije, kutove, margine i primjere.

### Faza 1 — Prvi funkcionalni MVP

- [ ] Izraditi početnih 50 osnovnih ikona.
- [ ] Podržati Outline i Duotone.
- [ ] Postaviti Next.js katalog s kategorijama i pretraživanjem.
- [ ] Implementirati live promjenu boja, veličine i debljine gdje je primjenjivo.
- [ ] Omogućiti SVG i JSX copy/export.
- [ ] Napraviti automatizirani SVG build i validaciju.
- [ ] Objaviti GitHub repozitorij i prvi npm paket.

### Faza 2 — Prvi puni release

- [ ] Proširiti na 150 osnovnih ikona.
- [ ] Dodati Solid varijante.
- [ ] Dodati povezana semantička stanja.
- [ ] Razviti Icon Theme Generator.
- [ ] Omogućiti ZIP preuzimanje odabrane kolekcije.
- [ ] Dovršiti dokumentaciju i primjere integracije.
- [ ] Provesti vizualni QA cijele kolekcije.

### Faza 3 — Rast i zajednica

- [ ] Objaviti projekt u relevantnim zajednicama.
- [ ] Dodati prijedloge ikona i contributor workflow.
- [ ] Pratiti stvarne potrebe korisnika i popunjavati nedostajuće kategorije.
- [ ] Razmotriti Vue/Svelte pakete i Figma plugin.
- [ ] Razmotriti dodatne formate i napredne opcije editora.

---

## 11. Početna procjena

*Subjektivne ocjene izvedivosti i potencijala, ne tržišno istraživanje.*

| Kriterij | Ocjena / 100 |
|---|---:|
| Tehnička izvedivost | 95 |
| Niski troškovi razvoja | 90 |
| Korisnost za developere | 85 |
| Tržišna pozicija s obzirom na konkurenciju | 30 |
| Mogućnost diferencijacije | 75 |
| Potencijal za organski rast | 75 |

**Glavni rizik:** vrlo jaka konkurencija. Projekt će trebati originalnu geometriju, vrhunsko iskustvo korištenja i kvalitetne nišne ikone kako ne bi bio samo još jedan katalog.

**Realističan kriterij uspjeha:** nije nužno prestići Lucide ili Phosphor. Korisna i održavana biblioteka koju aktivno koristi i nekoliko stotina ili tisuća developera već ostvaruje cilj projekta.

---

## 12. Zaključak i sljedeći konkretan korak

**Preporuka:** ne započinjati razvojem 150 ikona ni složenog web editora. Prvo kreirati **12 prepoznatljivih ikona u tri dizajnerska smjera**, usporediti ih u stvarnom sučelju i zaključati pravila dizajna.

Tek nakon odabira smjera krenuti na SVG pipeline, React paket, katalog i rast kolekcije.

**Predloženi fokus projekta:** *A free, beautifully consistent icon system with powerful theming and practical icons for modern apps.*

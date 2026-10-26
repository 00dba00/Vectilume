# Web funkcije za korisnike

Funkcije koje korisnicima omogućujemo kroz web. Sve što ide u kolekciju prolazi
admin odobrenje; na npm ide tek kad je kolekcija potvrđena za objavu
(`packages/icons-svg/release.json`).

## Dogovoreno

### 1. Uređivanje postojeće ikone

- Korisnik u web formi mijenja SVG pojedine ikone (sva tri stila ili samo jedan).
- Prijedlog ide na odobrenje adminima, s prikazom razlike staro/novo.
- Nakon odobrenja izmjena ide u kolekciju, a s idućom objavom na npm.
- Korisnik dobiva obavijest: koja ikona, u kojoj verziji paketa je dostupna i kako je uvesti.

### 2. Nova ikona

- Korisnik crta ili učitava potpuno novu ikonu, predlaže ime, kolekciju i kategoriju.
- Isti tok: odobrenje → kolekcija → npm → obavijest korisniku.

### 3. Zahtjev za custom ikonu

- Korisnik opiše što mu treba (tekst, po želji skica ili primjer).
- Mi je nacrtamo; kad je u objavljenoj kolekciji, korisnik dobiva obavijest s imenom i importom.

### Zajedničko za 1–3

- **Korisnički računi** — tko je predložio, status prijedloga, povijest.
- **Licenca** — pri slanju korisnik prihvaća da doprinos ide pod MIT.
- **Ime je javni API** — admin odobrava i ime; preimenovanje nakon objave je breaking
  (release skripta to već provjerava).
- **Automatske provjere prije admina** — validator (mreža, stroke, boje) i Gloss pravila
  (razmak odsjaja, granice) odmah javljaju greške, da admin gleda samo dizajn.
- **Statusi** — poslano → u pregledu → traže se izmjene → odobreno → objavljeno (verzija).

## Preporuke za bolji UX i izdvajanje

Poredano po omjeru koristi i truda.

1. **Javni popis zahtjeva s glasanjem** — zahtjevi iz točke 3 vidljivi su svima i mogu se
   podržati glasom. Mi vidimo što je najtraženije, korisnici vide da se nešto događa,
   a duplikati se spajaju umjesto da ih crtamo dvaput.
2. **Pretraga po značenju, na hrvatskom i engleskom** — sinonimi i ključne riječi uz svaku
   ikonu ("smeće", "obriši", "delete" → `trash`). Većina biblioteka traži samo po imenu.
3. **Vlastiti set za projekt** — korisnik odabere ikone i temu (boje, stroke) i preuzme samo
   to: ZIP, SVG sprite ili mali npm paket / CDN link sa svojim izborom.
4. **Trenutna Gloss provjera u editoru** — dok korisnik crta, editor odmah pokazuje
   prekršena pravila (odsjaj preblizu detalju, izvan mreže) i nudi automatski solid stil
   iz outlinea. Prijedlozi stižu ujednačeni, a odobrenje je brže.
5. **Pregled u stvarnom sučelju** — svaku ikonu (i svaki prijedlog) vidjeti u gumbu,
   navigaciji, listi, na 16/20/24 px, svijetla i tamna tema, prije preuzimanja.
6. **Povijest verzija s vizualnom razlikom** — za svaku ikonu što se promijenilo u kojoj
   verziji, s usporedbom staro/novo. Kod preimenovanja staro ime ostaje kao alias do
   iduće breaking verzije, pa nikome ništa ne pukne odmah.
7. **Pretplata na kolekcije i ikone** — obavijest kad izađe nova verzija ili kad se
   promijeni ikona koju korisnik koristi.
8. **Zasluge autorima** — ime autora uz ikonu u katalogu i u `manifest.json`, profil
   doprinositelja. Motivira zajednicu da predlaže.
9. **AI skica iz opisa** — korisnik opiše ikonu, sustav predloži nacrt u Gloss stilu koji
   onda dorađuje čovjek. Ubrzava točke 2 i 3.

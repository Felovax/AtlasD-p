# Atlas' dåp – en liten interaktiv eventyrbok 🍯

En invitasjon til dåpen til Atlas, laget for mobil. Gjestene åpner lenken og kommer inn i en akvarellmalt
skog i eventyrbokstil. Der blar de gjennom bilder av Atlas, finner tid og sted, og svarer på om de kommer.
Foreldrene ser alle svarene på en egen, innloggingsbeskyttet oversiktsside.

* **Invitasjonen:** `https://<brukernavn>.github.io/<repo>/`
* **Oversikt over svar (for foreldrene):** `https://<brukernavn>.github.io/<repo>/admin/`

---

## Innhold

1. [Sjekkliste før invitasjonen sendes ut](#1-sjekkliste-før-invitasjonen-sendes-ut)
2. [Kjøre siden på egen maskin](#2-kjøre-siden-på-egen-maskin)
3. [Endre tekst, dato, steder (én fil)](#3-endre-tekst-dato-og-steder)
4. [Bytte eller legge til bilder av Atlas](#4-bytte-eller-legge-til-bilder-av-atlas)
5. [Supabase (databasen for svar)](#5-supabase-databasen-for-svar)
6. [Oversiktssiden for foreldrene](#6-oversiktssiden-for-foreldrene)
7. [Publisering på GitHub Pages](#7-publisering-på-github-pages)
8. [Personvern](#8-personvern)
9. [Prosjektstruktur](#9-prosjektstruktur)
10. [Tester](#10-tester)
11. [Illustrasjoner og rettigheter](#11-illustrasjoner-og-rettigheter)

---

## 1. Sjekkliste før invitasjonen sendes ut

- [ ] Legg inn ønskelisten i `src/config/invitation.ts` → `wishlist` (lenke eller liste over ønsker, se [kapittel 3](#3-endre-tekst-dato-og-steder)).
      `npm run dev` viser øverst på siden hva som mangler.
- [ ] Kontroller veibeskrivelsen til **Moen kirke** (søker på «Moen kirke, Jaren»). Moen bedehus bruker nøyaktige koordinater.
- [ ] **Godkjenn bildene.** Siden blir offentlig på internett, se [Personvern](#8-personvern).
- [ ] Sett opp Supabase og test et ekte svar ([kapittel 5](#5-supabase-databasen-for-svar)).
- [ ] Opprett innlogging for foreldrene ([kapittel 6](#6-oversiktssiden-for-foreldrene)).
- [ ] Publiser ([kapittel 7](#7-publisering-på-github-pages)), og send et testsvar fra din egen telefon.
- [ ] Slett testsvarene i oversikten før lenken sendes ut.

## 2. Kjøre siden på egen maskin

Krever [Node.js](https://nodejs.org) 20 eller nyere.

```bash
npm install
```

```bash
npm run dev
```

Åpne http://localhost:5173 (invitasjonen) og http://localhost:5173/admin/ (oversikten).

**Prøve skjemaet uten database:** lag fila `.env.local` med linja `VITE_RSVP_MOCK=true`.
Da later skjemaet som om svaret ble sendt, uten å lagre noe. Dette virker bare med `npm run dev`
og aldri på den publiserte siden. Skriv «nettfeil» i navnefeltet for å se hvordan en nettverksfeil ser ut.

**Se oversiktssiden med falske testdata:** http://localhost:5173/admin/?demo (kun under utvikling).

## 3. Endre tekst, dato og steder

**Alt innhold ligger i én fil: [`src/config/invitation.ts`](src/config/invitation.ts).**

| Hva | Hvor i fila |
| --- | --- |
| Dato (`'2026-11-08'`) og klokkeslett (`'11:00'`) | `event.date`, `event.time` |
| Kirke: navn, adresse, Google Maps-søk | `event.church` |
| Feiringen: navn, adresse, Google Maps-søk | `event.celebration`, `event.celebrationTime` |
| Svarfrist: dato (`'2026-10-25'`) eller fri tekst («Gi gjerne beskjed så fort som mulig») | `event.rsvpDeadline` |
| Ønskeliste: lenke (f.eks. Ønskeskyen) og/eller egne ønsker | `wishlist` |
| Praktisk informasjon (liste) | `event.practicalInfo` |
| Alle tekster (overskrifter, knapper, takkemeldinger, hilsen) | `texts` |
| Hvilke bilder som brukes hvor, med bildetekster | `photos` |

Verdier som mangler står som `fyllInn('…')`. Bytt dem ut med vanlig tekst.

**Ønskelisten** (kapittel 5, etter svarskjemaet) kan fylles på to måter, eller begge:

```ts
wishlist: {
  enabled: true,
  // 1) Lenke til en ferdig ønskeliste, f.eks. Ønskeskyen (der kan gjestene også markere hva de kjøper):
  url: 'https://onskeskyen.no/…',
  // 2) …og/eller ønsker skrevet rett her (sett da url: null hvis dere ikke har en lenke):
  items: [
    { title: 'Sølvskje med navn' },
    { title: 'Klassiske barnebøker', note: 'Gjerne med en hilsen inni' },
    { title: 'Bidrag til sparekonto' },
  ],
},
```

`enabled: false` skjuler hele ønskelisten. Etter et ja-svar får gjesten også en knapp til ønskelisten.

«Se veibeskrivelse» åpner veibeskrivelse i Google Maps. Stedet finnes slik, i denne rekkefølgen:
en ferdig lenke i `mapsUrl`, nøyaktige koordinater i `coordinates` (slik Moen bedehus er satt opp),
et søk i `mapsQuery`, eller til slutt navn + adresse. Dato vises automatisk som «Søndag 8. november 2026»
og tiden som «kl. 11.00». Nedtellingen («Om 31 dager») og «Legg til i kalenderen» lages også automatisk.

## 4. Bytte eller legge til bilder av Atlas

1. Legg originalbildene i mappa **`photos-originals/`**. Mappa blir aldri lagt på GitHub.
2. Kjør:
   ```bash
   npm run photos
   ```
   Skriptet **fjerner all metadata** (også GPS-posisjon, som ett av de opprinnelige bildene hadde),
   snur bildet riktig vei og lager tre størrelser i WebP (480/720/1080 px) i `public/images/atlas/`.
3. Bruk bildets navn (filnavn med små bokstaver, uten filendelse) i `photos` i `src/config/invitation.ts`:
   ```ts
   { id: 'atlas-dap', alt: 'Kort beskrivelse for skjermlesere', caption: 'Håndskrevet bildetekst', focus: '50% 30%' }
   ```
   `focus` bestemmer hvilken del av bildet som vises når det beskjæres (først vannrett, så loddrett).
   `'50% 30%'` betyr midt på, litt over midten. Gjestene kan uansett trykke på et bilde for å se det i sin helhet.

Bildene som brukes nå:

| Navn | Motiv | Brukes |
| --- | --- | --- |
| `atlas-bjorn` | I bjørnedress, ser opp i kameraet | Hovedbildet i kapittel 1 |
| `atlas-sover` | Nyfødt og sovende | Bildebok, side 1 |
| `atlas-portrett` | Nærbilde med store øyne | Bildebok, side 2 |
| `atlas-tunge` | I bjørnedress, rekker tunge | Bildebok, side 3 |

Bildeboka i kapittel 2 viser så mange bilder som står i lista `photos.story`.

## 5. Supabase (databasen for svar)

Svarene lagres i [Supabase](https://supabase.com) (PostgreSQL). Gratisplanen holder godt.

### 5.1 Opprett prosjekt og database

1. Lag et prosjekt på supabase.com. Velg region **EU (Stockholm eller Frankfurt)**.
2. Gå til **SQL Editor → New query**, lim inn hele
   [`supabase/migrations/20261008120000_rsvp.sql`](supabase/migrations/20261008120000_rsvp.sql), og trykk **Run**.

Det lager:

| | |
| --- | --- |
| `public.rsvps` | Svarene: `id` (UUID), `primary_guest_name`, `secondary_guest_name`, `attending`, `guest_count`, `created_at` |
| `public.submit_rsvp()` | Den **eneste** måten gjester kan sende svar på |
| `public.is_admin()` | Sjekker om innlogget bruker er administrator |
| `private.admins` | Hvem som får se svarene |
| `private.rsvp_attempts` | Teller innsendinger mot spam (kun hashet, slettes etter ett døgn) |

### 5.2 Sikkerhet: hva databasen håndhever

* **Row Level Security** er slått på. Gjester kan **ikke lese, endre eller slette** svar, heller ikke andres.
* Gjester kan bare kalle `submit_rsvp()`. Funksjonen validerer alt på serveren: navn må være 2–80 tegn
  og inneholde bokstaver, «ja» betyr 1 eller 2 personer, «nei» betyr 0, og person nummer 2 må ha et annet navn.
  Mellomrom trimmes.
* Tabellen har i tillegg egne regler (`check constraints`), så ugyldige data ikke kan lagres uansett.
* **Mot spam:** maks 8 svar per nettverk per 10 minutter, og maks 40 svar per minutt totalt.
  Skjemaet har også et skjult felt som fanger roboter.
* **Mot doble svar:** hver innsending har en egen ID. Trykker gjesten to ganger, eller prøver på nytt
  etter et nettverksbrudd, lagres svaret bare én gang.
* **Kun administratorer** (brukere i `private.admins`) kan lese og slette svar. Dette sjekkes i databasen,
  ikke bare på nettsiden.
* Nettsiden bruker **bare den offentlige nøkkelen**. Den hemmelige `service_role`/`secret`-nøkkelen
  skal aldri brukes i dette prosjektet.

> Vurdering: CAPTCHA (f.eks. Cloudflare Turnstile via en Supabase Edge Function) er **ikke** lagt inn.
> For en lenke som bare deles med familie og venner, er begrensningene over nok, og det slipper gjestene
> å klikke på bilder av trafikklys. Dukker det opp spam, kan det legges til senere.

### 5.3 Koble nettsiden til Supabase

Under **Project Settings → API** finner du:

* **Project URL** → `VITE_SUPABASE_URL`
* **Publishable key** (`sb_publishable_…`), eller den eldre **anon public**-nøkkelen → `VITE_SUPABASE_PUBLISHABLE_KEY`

Lokalt legger du dem i `.env.local` (se [`.env.example`](.env.example)). For den publiserte siden legger du dem
inn i GitHub ([kapittel 7](#7-publisering-på-github-pages)).

### 5.4 Innlogging (Supabase Auth)

1. **Authentication → Sign In / Providers → Email:** la e-post med passord være på.
2. Skru **av** «Allow new users to sign up». Da kan bare dere opprette brukere. Selv om noen
   klarte å registrere seg, ville de ikke sett noe, fordi de ikke står i `private.admins`.

### 5.5 Test at alt virker

Send et testsvar fra invitasjonen. Det skal dukke opp i oversikten. Slett det etterpå.

## 6. Oversiktssiden for foreldrene

**Adresse:** `…/admin/`

### Gi en forelder tilgang

1. Supabase → **Authentication → Users → Add user → Create new user**.
   Skriv inn e-post og et sterkt passord, og huk av **Auto Confirm User**.
2. Åpne [`supabase/admin-setup.sql`](supabase/admin-setup.sql), bytt ut e-postadressen og kjør den i **SQL Editor**.

Ingen passord ligger i koden. Hver forelder logger inn med sin egen e-post og sitt eget passord.

### Hva oversikten viser

* **Gjester som kommer** (antall personer totalt), **antall ja-svar** og **antall nei-svar**
* Lister over **hvem som kommer** og **hvem som ikke kommer**, med antall personer per svar og tidspunkt
* Søk etter navn
* **Last ned CSV** med semikolon og UTF-8, slik at norsk Excel åpner fila med æ, ø og å riktig
* **Slett** et svar, for eksempel en dobbeltregistrering (krever bekreftelse)

## 7. Publisering på GitHub Pages

Siden bygges og publiseres automatisk av GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml))
hver gang `main` oppdateres. Workflowen kjører alle tester først.

**Én gang:**

1. Koble mappa til repoet ditt på GitHub (hvis det ikke er gjort):
   ```bash
   git remote add origin https://github.com/<brukernavn>/<repo>.git
   ```
2. På GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. **Settings → Secrets and variables → Actions → Variables → New repository variable:**
   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_PUBLISHABLE_KEY`

   Disse er laget for å være offentlige (de havner i nettleseren uansett), derfor *variables* og ikke *secrets*.
4. Commit og push:
   ```bash
   git add -A
   ```
   ```bash
   git commit -m "Dåpsinvitasjon til Atlas"
   ```
   ```bash
   git push -u origin main
   ```

Adressen til siden og riktig undermappe (`/<repo>/`) settes automatisk. Oversiktssiden virker også når
man laster siden på nytt, fordi den er en egen side (`admin/index.html`) og ikke en «route».

> **Merk:** Gratis GitHub Pages krever at repoet er **offentlig**. Da er også kildekoden og bildene i
> `public/images/atlas/` synlige for alle som finner repoet. Har du GitHub Pro, kan repoet være privat
> mens siden er publisert.

## 8. Personvern

* **Siden er offentlig.** Alle som har lenken kan se den, og lenker kan bli delt videre. At adressen er
  «hemmelig», gjør ikke bildene private. **Godkjenn bildene før publisering.**
* Siden ber søkemotorer om å ikke indeksere den (`noindex`). Det er en høflig forespørsel, ikke en garanti.
* All metadata (GPS, kamera, dato) fjernes fra bildene. Originalene i `photos-originals/` legges aldri på GitHub.
* Gjestenes navn lagres i Supabase og er bare synlige for administratorer. Det lagres ingen IP-adresser,
  bare en hash som ikke kan spores tilbake, og den slettes etter ett døgn.
* **Etter dåpen:** slett svarene (se nederst i `supabase/admin-setup.sql`), og vurder å ta ned siden
  (Settings → Pages → Unpublish) eller fjerne bildene.
* Skriftene ligger på selve siden. Det hentes ikke noe fra Google eller andre tredjeparter, bortsett fra
  Supabase når noen sender et svar.

## 9. Prosjektstruktur

```
├── index.html                  Invitasjonen (Vite-inngang)
├── admin/index.html            Oversiktssiden (egen inngang – lastes ikke av gjestene)
├── src/
│   ├── config/invitation.ts    ← ALT innhold: dato, steder, tekster, bilder
│   ├── sections/               Hero, kapittel 1–4 og sluttscenen (én fil + CSS per seksjon)
│   ├── components/             Bilde/lysbord, «dukk opp»-animasjon, bier, blader, ikoner …
│   ├── lib/                    Validering + innsending av svar, datoformat, kart, kalenderfil
│   ├── admin/                  Innlogging, oversikt, CSV
│   ├── assets/illustrations/   Ferdige akvarellillustrasjoner (WebP)
│   ├── generated/              Bildemanifest (lages av npm run photos)
│   └── styles/global.css       Farger, typografi, knapper
├── public/
│   ├── images/atlas/           Rensede og optimaliserte bilder av Atlas
│   └── og-image.jpg            Forhåndsvisning når lenken deles
├── art/                        SVG-kilder til illustrasjonene
├── scripts/                    Bilder, illustrasjoner og automatisk mobiltest
├── supabase/
│   ├── migrations/             Databaseoppsett (tabell, RLS, funksjoner)
│   ├── admin-setup.sql         Gi foreldrene tilgang
│   └── tests/                  Sikkerhetstester for databasen
├── docs/ILLUSTRASJONER.md      Om illustrasjonene og rettigheter
└── .github/workflows/          Publisering til GitHub Pages
```

**Teknologi:** React 19, Vite, TypeScript, Motion (animasjoner), vanlig CSS, Supabase og GitHub Pages.
Gjestesiden bruker ikke Supabase-biblioteket. Den sender svaret med et lite `fetch`-kall,
så siden blir lettere. Animasjonene bruker bare `transform` og `opacity`, og respekterer
«reduser bevegelse» på telefonen.

## 10. Tester

| Kommando | Hva |
| --- | --- |
| `npm test` | Validering, datoformat, kalenderfil, Google Maps-lenker, CSV, ønskelisten og hele svarskjemaet (41 tester) |
| `npm run test:db` | Databasen mot ekte PostgreSQL (PGlite): RLS, validering, spam-grenser, admin-tilgang (16 tester) |
| `npm run typecheck` | TypeScript |
| `npm run build` | Produksjonsbygg |
| `npm run check:mobile` | Åpner siden i Edge/Chrome i 7 skjermstørrelser (320 px → PC), sjekker at ingenting kan scrolles sidelengs, at alle bilder laster og at konsollen er uten feil, og lagrer skjermbilder i `test-results/mobile/`. Krever at `npm run dev` kjører. |

## 11. Illustrasjoner og rettigheter

Alle illustrasjonene er **originale** og laget for denne invitasjonen. Ingen Disney- eller Ole Brumm-bilder
er brukt. Se [`docs/ILLUSTRASJONER.md`](docs/ILLUSTRASJONER.md) for oversikt, lisens og hvorfor:
Shepards originaltegninger er fri i USA, men beskyttet i Norge til og med 2046.

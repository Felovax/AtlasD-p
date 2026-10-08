# Illustrasjoner, stil og rettigheter

## Kort fortalt

**Alle illustrasjonene i invitasjonen er originale tegninger som er laget for dette prosjektet.**
De er tegnet som kode (SVG) i mappa `art/` og «malt» om til akvarell-lignende WebP-bilder
med `npm run illustrations`. Det er ikke lastet ned eller kopiert bilder fra Disney,
fra Ole Brumm-bøkene eller fra andre nettsider.

Stilen er *inspirert av* klassiske eventyrbøker og Hundremeterskogen (tusjstrek og
akvarell, honningkrukker, bier, trær og en blomstereng), men figurene er egne:

| Fil | Hva | Brukes |
| --- | --- | --- |
| `bear-honey` | Liten honningbjørn med krukke («HONNING») | Velkomstscenen, delingsbildet |
| `piglet-peek` | Liten gris som kikker over kanten | Kapittel 1, bak hovedbildet |
| `tiger-bounce` | Tigerunge som spretter på halen | Slutten av kapittel 2 |
| `donkey-sit` | Ettertenksomt esel ved en tistel | Kapittel 3 (informasjon) |
| `signpost` | Veiviser: KIRKEN / FESTEN | Kapittel 3 |
| `honeypot` | Honningkrukke med skje | Takk-animasjonen etter svar |
| `tree-left`, `tree-right` | Akvarelltrær, det ene med bikube | Velkomstscenen |
| `clouds`, `hills-far`, `meadow-front` | Himmel, åser og blomstereng | Velkomstscenen |
| `closing-hill` | De fire vennene sett bakfra i solnedgang | Siste side |
| `wash-honey`, `wash-green` | Akvarellflekker | Bak hovedbildet |
| `photo-mask`, `page-mask` | Myke/revne kanter på bilder og boksider | Bildene |
| `paper-texture` | Papirstruktur | Bakgrunn |
| `public/og-image.jpg` | Forhåndsvisning når lenken deles | SMS/Messenger |

Bier, blader, ikoner og ornamenter er små SVG-er direkte i koden (`src/components/decor/`).

**Lisens:** Illustrasjonene er laget for denne invitasjonen og kan brukes fritt av familien,
også i andre sammenhenger (trykte kort, takkekort o.l.).

## Hvorfor ikke ekte Ole Brumm-tegninger?

Det ble sjekket før arbeidet startet:

* **Disney-versjonen** (Brumm med rød genser osv.) er beskyttet av opphavsrett og varemerker.
  Den kan ikke brukes.
* **E. H. Shepards originaltegninger** fra *Winnie-the-Pooh* (1926) ble fri i **USA** 1. januar 2022,
  og *The House at Pooh Corner* (1928, der Tigergutt dukker opp) i 2024.
  Men i **Norge, Storbritannia og resten av EØS** gjelder «livstid + 70 år».
  Shepard døde i 1976, så **tegningene hans er beskyttet her til og med 31. desember 2046**.
* **A. A. Milnes tekst** (Milne døde 1956) blir fri i Norge først **1. januar 2027**.

Invitasjonen lages og deles i Norge og ligger på en åpen nettside. Derfor er det tryggest
å ikke bruke originaltegningene, selv om de er frie i USA. Kilder:
[Wikimedia Commons om Winnie-the-Pooh (1926)](https://c.enwp.org/wiki/Category:Winnie_The_Pooh,_1926),
[Wikipedia Signpost, januar 2022](https://signpost.news/2022-01-30/Serendipity).
*(Dette er ikke juridisk rådgivning.)*

## Endre eller lage nye illustrasjoner

1. Rediger SVG-fila i `art/` (de store scenene lages av `scripts/generate-scenes.mjs`).
2. Kjør `npm run illustrations` (eller bare én: `node scripts/render-illustrations.mjs bear-honey`).
3. Ferdige filer havner i `src/assets/illustrations/`.

Akvarelleffekten (ujevne kanter, mørkere pigment i kanten, papirkorn) lages med SVG-filtre
som er definert i `scripts/render-illustrations.mjs`. Filtrene «males ferdig» én gang, slik
at gjestenes telefoner slipper å regne dem ut. Det gjør siden rask.

Vil dere heller bruke kjøpte eller lisensierte tegninger, kan dere bytte ut WebP-filene
i `src/assets/illustrations/` med egne filer med samme navn.

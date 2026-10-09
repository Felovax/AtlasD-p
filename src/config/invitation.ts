/**
 * ════════════════════════════════════════════════════════════════════════════
 *  ALT DU TRENGER Å ENDRE LIGGER I DENNE FILA
 * ════════════════════════════════════════════════════════════════════════════
 *
 *  • Dato, klokkeslett, kirke, sted for feiringen og svarfrist  →  `event`
 *  • Ønskelisten                                                 →  `wishlist`
 *  • Tekstene i invitasjonen                                     →  `texts`
 *  • Hvilke bilder som brukes hvor, og bildetekstene              →  `photos`
 *
 *  Verdier som ennå ikke er bestemt, er satt til `fyllInn('...')`. De vises
 *  tydelig merket på siden, og listes øverst på siden når du kjører `npm run dev`.
 *  Bytt dem ut med ekte tekst, f.eks.:
 *
 *      name: fyllInn('Navn på festlokalet'),   →   name: 'Grendehuset på Jaren',
 *
 *  Se README.md for hvordan du bytter bilder.
 */

/** Markerer en verdi som ikke er bestemt ennå. */
export interface Placeholder {
  readonly placeholder: string;
}
export const fyllInn = (beskrivelse: string): Placeholder => ({ placeholder: beskrivelse });
export type Fillable<T> = T | Placeholder;
export const isPlaceholder = (value: unknown): value is Placeholder =>
  typeof value === 'object' && value !== null && 'placeholder' in value;

export interface Place {
  /** Navnet som vises, f.eks. «Moen kirke». */
  name: Fillable<string>;
  /** Adresse eller stedsangivelse som vises under navnet. */
  address: Fillable<string>;
  /**
   * Det som søkes etter i Google Maps når gjesten trykker «Se veibeskrivelse».
   * Mer nøyaktig: oppgi `coordinates` (breddegrad/lengdegrad), eller lim inn en ferdig
   * Google Maps-lenke i `mapsUrl`.
   */
  mapsQuery?: string;
  coordinates?: { lat: number; lng: number };
  mapsUrl?: string;
}

export interface StoryPhoto {
  /** Bildets navn i public/images/atlas (uten -480.webp osv.). Se README. */
  id: string;
  /** Beskrivelse for skjermlesere. */
  alt: string;
  /** Håndskrevet bildetekst under bildet. */
  caption: string;
  /** Hvilken del av bildet som skal vises hvis det beskjæres (CSS object-position). */
  focus?: string;
}

export interface WishItem {
  /**
   * Fast ID for ønsket: små bokstaver, tall og bindestrek (f.eks. 'gyngehest').
   * Reservasjonene er knyttet til ID-en – ikke endre den etter at gjestene har begynt å reservere.
   */
  id: string;
  /** Hva ønsket er, f.eks. «Gyngehest». */
  title: string;
  /** Valgfri kort kommentar, f.eks. farge, modell eller butikk. */
  note?: string;
  /** Valgfri lenke til produktet. */
  url?: string;
  /** Flere lenker (f.eks. sølv eller gull). Vises som egne knapper. */
  links?: { label: string; url: string }[];
}

export const invitation = {
  childName: 'Atlas',

  event: {
    /** Datoen for dåpen (ÅÅÅÅ-MM-DD). */
    date: '2026-11-08' as Fillable<string>,
    /** Klokkeslett for gudstjenesten (TT:MM). */
    time: '11:00' as Fillable<string>,
    /** Hvor lenge «Legg til i kalenderen»-avtalen varer, i minutter. */
    calendarDurationMinutes: 60,

    church: {
      name: 'Moen kirke',
      address: 'Jaren, Gran kommune',
      mapsQuery: 'Moen kirke, Jaren',
    } satisfies Place as Place,

    celebration: {
      name: 'Moen bedehus',
      address: 'Moen, Gran kommune',
      // Nøyaktig posisjon (fra kartlenke gitt av Erica og Matias)
      coordinates: { lat: 60.407818, lng: 10.568667 },
    } satisfies Place as Place,

    /** Når feiringen starter, f.eks. «Rett etter gudstjenesten» eller «ca. kl. 12.30». */
    celebrationTime: 'Rett etter gudstjenesten' as Fillable<string>,

    /**
     * Svarfrist. Enten en dato (ÅÅÅÅ-MM-DD), som vises som «Gi beskjed innen 30. oktober»,
     * eller en fri tekst som vises akkurat slik den står.
     */
    rsvpDeadline: 'Gi gjerne beskjed så fort som mulig' as Fillable<string>,

    /**
     * Valgfri praktisk informasjon. Hver linje blir et eget punkt.
     * La lista være tom ([]) for å skjule hele boksen.
     */
    practicalInfo: [] as string[],
  },

  /**
   * ØNSKELISTE – bruk én av måtene (eller begge):
   *
   *  1. `url`: lenke til en ferdig ønskeliste, f.eks. fra Ønskeskyen. Der kan gjestene også
   *     markere hva de kjøper, så ingen gir det samme. Vises som en stor knapp.
   *  2. `items`: skriv ønskene rett her. Gjestene kan huke av for å reservere et ønske,
   *     så andre ser at det er tatt (ingen ser hvem). Eksempel:
   *        { id: 'solvskje', title: 'Sølvskje med navn', note: 'Gjerne fra …', url: 'https://…' },
   *     Bruker du bare lista, sett `url: null`.
   *
   * Sett `enabled: false` for å skjule hele ønskelisten.
   */
  wishlist: {
    enabled: true,
    url: null as Fillable<string> | null,
    items: [
      {
        id: 'vognpose',
        title: 'Helårs vognpose',
        note: 'Explorer vognpose, walnut',
        url: 'https://www.barnashus.no/barnevogn/vognpose/explorer-vognpose-walnut-solid-11040956',
      },
      {
        id: 'lekebil',
        title: 'Lekebil',
        note: 'Mini sparkebil med navn, hvit vintage',
        url: 'https://rofadesign.no/no/gaver/gaver-etter-tema/dapsgaver/mini-sparkebil-med-navn-hvit-vintage/',
      },
      {
        id: 'gyngehest',
        title: 'Gyngehest',
        note: 'Gyngedyr med navn – giraff',
        url: 'https://rofadesign.no/no/gaver/gaver-etter-tema/dapsgaver/gyngedyr-med-navn-giraff/',
      },
      {
        id: 'julestrompe',
        title: 'Personlig julestrømpe',
        note: 'Med navn, rød fløyel',
        url: 'https://rofadesign.no/no/sortiment/jul/julestromper/julestrompe-med-navn-rod-floyel/',
      },
      {
        id: 'syttende-mai-sloyfe',
        title: '17. mai-sløyfe',
        note: 'Teddybjørn med 17. mai-sløyfe i tinn',
        url: 'https://www.bjorklund.no/teddybjoern-med-17-mai-sloeyfe-i-tinn',
      },
      {
        id: 'flaggstang',
        title: 'Flaggstang',
        note: 'Bordflaggstang med tinnfot i eik',
        url: 'https://www.bjorklund.no/flaggstang-tinnfot-eik',
      },
      {
        id: 'armband',
        title: 'Armbånd',
        note: 'Med graveringsplate i 925 sølv',
        url: 'https://www.bjorklund.no/armbaand-med-graveringsplate-i-925-soelv-msb10061',
      },
      {
        id: 'kors-smykke',
        title: 'Kors-smykke',
        note: 'I sølv eller gull',
        links: [
          { label: 'Sølv', url: 'https://www.gullfunn.no/produkter/1998554/smykke-til-barn-i-925-solv-med-kors' },
          { label: 'Gull', url: 'https://www.gullfunn.no/produkter/53718/smykke-til-barn-i-585-gult-gull-med-kors' },
        ],
      },
      {
        id: 'smykkeskrin',
        title: 'Smykkeskrin',
        note: 'Skrin til barn med sølvdekor',
        url: 'https://www.gullfunn.no/produkter/96846/skrin-til-barn-med-solvdekor',
      },
      {
        id: 'minnebok',
        title: 'Minnebok',
        note: '«Et lite eventyr», mørk blå',
        url: 'https://www.bjorklund.no/et-lite-eventyr-minnebok-moerk-blaa',
      },
      {
        id: 'sparebosse',
        title: 'Sparebøsse',
        note: 'Racerbil eller sportsbil',
        links: [
          { label: 'Racerbil', url: 'https://www.bjorklund.no/spareboesse-racerbil-fortinnet' },
          { label: 'Sportsbil', url: 'https://www.gullfunn.no/produkter/96830/sparebosse-til-barn-sportsbil' },
        ],
      },
      {
        id: 'barnegrind',
        title: 'Barnegrind',
        note: 'Beemoo Safe Space lekegrind 130 × 130, ash grey',
        url: 'https://www.jollyroom.no/babyutstyr/barnesikring/barnegrinder-trappegrinder/lekegrinder/beemoo-safe-space-lekegrind-130x130-ash-grey',
      },
    ] as WishItem[],
  },

  texts: {
    /** Fanetittel og tittel i forhåndsvisningen når lenken deles. */
    shareTitle: 'Du er invitert til dåpen til Atlas!',
    shareDescription: 'Trykk på lenken for å åpne invitasjonen og gi beskjed om du kommer. 🍯',

    hero: {
      kicker: 'Et lite eventyr begynner …',
      title: 'Du er invitert til dåpen til',
      button: 'Åpne invitasjonen',
    },
    intro: {
      chapterTitle: 'der vi blir kjent med Atlas',
      heading: 'Vår lille Atlas skal døpes!',
      body: 'Vi ønsker å dele denne spesielle dagen med familie og venner, og håper du vil feire sammen med oss.',
    },
    story: {
      chapterTitle: 'der vi blar i en liten bildebok',
      heading: 'Så langt i eventyret …',
    },
    details: {
      chapterTitle: 'der vi finner veien',
      heading: 'Når og hvor',
    },
    rsvp: {
      chapterTitle: 'der vi håper du kommer',
      heading: 'Kommer du på feiringen?',
      subheading: 'Vi håper du vil være med og feire denne spesielle dagen!',
      yesOption: 'Ja, jeg kommer! 🍯',
      noOption: 'Nei, jeg kan dessverre ikke komme',
      successYes: 'Tusen takk! Vi gleder oss til å feire sammen med deg!',
      successYesTwo: 'Tusen takk! Vi gleder oss til å feire sammen med dere!',
      successNo: 'Takk for at du ga beskjed! Vi kommer til å savne deg.',
    },
    wishlist: {
      chapterTitle: 'der vi fyller honningkrukka',
      heading: 'Ønskeliste',
      body: 'Det aller fineste er at du kommer og feirer sammen med oss! Men mange har spurt hva Atlas ønsker seg, så her er noen ideer.',
      reserveHint:
        'Vil du gi et av ønskene? Huk av i ruten ved gaven, så ser de andre at den er tatt. Ingen får vite hvem som har reservert den, og du kan angre fra samme telefon.',
      button: 'Åpne ønskelisten',
    },
    closing: {
      heading: 'Vi gleder oss til en uforglemmelig dag!',
      /** Hilsen nederst. */
      signature: 'Hilsen Erica og Matias' as Fillable<string>,
    },
  },

  photos: {
    /** Hovedbildet i kapittel 1. */
    intro: {
      id: 'atlas-bjorn',
      alt: 'Atlas i en myk, brun bjørnedress med ører på hetta, som ser nysgjerrig opp i kameraet',
      caption: 'Atlas – vår egen lille bjørn',
      focus: '50% 32%',
    } satisfies StoryPhoto as StoryPhoto,

    /** Bildene i «bildeboka» i kapittel 2, i rekkefølge. */
    story: [
      {
        id: 'atlas-sover',
        alt: 'Nyfødte Atlas som sover trygt med en liten knyttneve under haken',
        caption: 'Det begynte med en liten drøm …',
        focus: '50% 38%',
      },
      {
        id: 'atlas-portrett',
        alt: 'Nærbilde av Atlas som ser rett inn i kameraet med store, mørke øyne',
        caption: '… med store, nysgjerrige øyne …',
        focus: '50% 30%',
      },
      {
        id: 'atlas-tunge',
        alt: 'Atlas i bjørnedress som rekker tunge til kameraet',
        caption: '… og en god porsjon sprell!',
        focus: '50% 30%',
      },
    ] satisfies StoryPhoto[] as StoryPhoto[],
  },
};

export type Invitation = typeof invitation;

/** Lister opp alle verdier som fortsatt er plassholdere (vises i utviklingsmodus). */
export function missingConfig(config: Invitation = invitation): string[] {
  const missing: string[] = [];
  const walk = (value: unknown) => {
    if (isPlaceholder(value)) missing.push(value.placeholder);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') Object.values(value).forEach(walk);
  };
  walk(config);
  return missing;
}

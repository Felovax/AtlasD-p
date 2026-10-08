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
  /** Hva ønsket er, f.eks. «Sølvskje med navn». */
  title: string;
  /** Valgfri kort kommentar, f.eks. størrelse, farge eller butikk. */
  note?: string;
  /** Valgfri lenke til produktet. */
  url?: string;
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
   *  2. `items`: skriv ønskene rett her, f.eks.
   *        items: [
   *          { title: 'Sølvskje med navn' },
   *          { title: 'Bøker', note: 'Gjerne klassiske barnebøker' },
   *          { title: 'Sparegris', url: 'https://…' },
   *        ],
   *     Bruker du bare lista, sett `url: null`.
   *
   * Sett `enabled: false` for å skjule hele ønskelisten.
   */
  wishlist: {
    enabled: true,
    url: fyllInn('Lenke til ønskelisten (eller skriv ønskene i «items»)') as Fillable<string> | null,
    items: [] as WishItem[],
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

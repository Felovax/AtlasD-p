import manifest from '../generated/photo-manifest.json';

export interface PhotoSource {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  placeholder: string;
}

interface ManifestEntry {
  width: number;
  height: number;
  widths: number[];
  placeholder: string;
}

const entries = manifest as Record<string, ManifestEntry>;

/**
 * Finner de ferdige, optimaliserte versjonene av et bilde (laget av `npm run photos`).
 * Kaster en tydelig feil hvis bildet mangler, så man ser det med en gang under utvikling.
 */
export function getPhoto(id: string): PhotoSource {
  const entry = entries[id];
  if (!entry) {
    throw new Error(
      `Fant ikke bildet «${id}». Ligger det i photos-originals/, og har du kjørt «npm run photos»? Tilgjengelige: ${Object.keys(entries).join(', ')}`,
    );
  }
  const base = `${import.meta.env.BASE_URL}images/atlas/${id}`;
  // Reserve-bilde for nettlesere uten srcset-støtte: første versjon som er minst 720 px bred.
  const fallback = entry.widths.find((w) => w >= 720) ?? entry.widths[entry.widths.length - 1];
  return {
    src: `${base}-${fallback}.webp`,
    srcSet: entry.widths.map((w) => `${base}-${w}.webp ${w}w`).join(', '),
    width: entry.width,
    height: entry.height,
    placeholder: entry.placeholder,
  };
}

import { isPlaceholder, type Place } from '../config/invitation';

/**
 * Lenke som åpner veibeskrivelse til stedet i Google Maps (appen på mobil, nettsiden ellers).
 * Prioritet: ferdig lenke (`mapsUrl`) → nøyaktige koordinater → søk på `mapsQuery` → navn + adresse.
 */
export function mapsLinkFor(place: Place): string | null {
  if (place.mapsUrl) return place.mapsUrl;
  const directions = (destination: string) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  if (place.coordinates) return directions(`${place.coordinates.lat},${place.coordinates.lng}`);
  const parts = [place.mapsQuery]
    .concat(place.mapsQuery ? [] : [place.name, place.address].map((v) => (isPlaceholder(v) ? undefined : v)))
    .filter((v): v is string => Boolean(v && v.trim()));
  if (parts.length === 0) return null;
  return directions(parts.join(', '));
}

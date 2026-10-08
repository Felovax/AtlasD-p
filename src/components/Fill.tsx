import { isPlaceholder, type Fillable } from '../config/invitation';

/**
 * Viser en verdi fra konfigurasjonen. Hvis den ikke er fylt inn ennå, vises en
 * tydelig merket plassholder i stedet (så det er lett å se hva som mangler).
 */
export function Fill({ value, format }: { value: Fillable<string>; format?: (text: string) => string }) {
  if (isPlaceholder(value)) {
    return (
      <span className="placeholder" title="Denne verdien er ikke fylt inn ennå (src/config/invitation.ts)">
        Fylles inn: {value.placeholder}
      </span>
    );
  }
  return <>{format ? format(value) : value}</>;
}

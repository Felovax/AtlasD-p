import { useEffect, useRef } from 'react';

/** Flytter tastatur-/skjermleserfokus til et element når det dukker opp. */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return ref;
}

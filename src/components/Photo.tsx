import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { StoryPhoto } from '../config/invitation';
import { getPhoto } from '../lib/photos';
import './Photo.css';

/* ─── Lysbord: vis hele bildet uten beskjæring ─────────────────────────────── */
const LightboxContext = createContext<(photo: StoryPhoto) => void>(() => {});

export function LightboxProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [photo, setPhoto] = useState<StoryPhoto | null>(null);

  const open = useCallback((next: StoryPhoto) => setPhoto(next), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !photo) return;
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }, [photo]);

  const close = () => {
    const dialog = dialogRef.current;
    if (dialog?.open && typeof dialog.close === 'function') dialog.close();
    else dialog?.removeAttribute('open');
    setPhoto(null);
  };

  const source = photo ? getPhoto(photo.id) : null;

  return (
    <LightboxContext.Provider value={open}>
      {children}
      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-label="Bilde i full størrelse"
        onClose={() => setPhoto(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        {photo && source && (
          <figure className="lightbox__figure">
            <img src={source.src} srcSet={source.srcSet} sizes="100vw" alt={photo.alt} width={source.width} height={source.height} />
            <figcaption>{photo.caption}</figcaption>
          </figure>
        )}
        <button type="button" className="btn btn--small lightbox__close" onClick={close} autoFocus>
          Lukk
        </button>
      </dialog>
    </LightboxContext.Provider>
  );
}

/* ─── Bilde med myk, malt kant ──────────────────────────────────────────────── */
interface PhotoProps {
  photo: StoryPhoto;
  /** CSS `sizes` – hvor bredt bildet vises, så nettleseren velger riktig fil. */
  sizes: string;
  /** Visningsforhold, f.eks. '4 / 5'. Standard er bildets eget forhold. */
  aspect?: string;
  edge?: 'paint' | 'none';
  className?: string;
}

export function Photo({ photo, sizes, aspect, edge = 'paint', className = '' }: PhotoProps) {
  const source = getPhoto(photo.id);
  const openLightbox = useContext(LightboxContext);
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Bildet kan allerede være ferdig lastet (fra hurtigbuffer) før React rakk å lytte.
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true);
  }, []);

  return (
    <button
      type="button"
      className={`photo photo--${edge} ${loaded ? 'is-loaded' : ''} ${className}`}
      style={{
        aspectRatio: aspect ?? `${source.width} / ${source.height}`,
        backgroundImage: `url(${source.placeholder})`,
      }}
      onClick={() => openLightbox(photo)}
      aria-label={`Vis bildet større: ${photo.alt}`}
    >
      <img
        ref={imgRef}
        src={source.src}
        srcSet={source.srcSet}
        sizes={sizes}
        alt=""
        width={source.width}
        height={source.height}
        loading="lazy"
        decoding="async"
        style={{ objectPosition: photo.focus ?? '50% 50%' }}
        onLoad={() => setLoaded(true)}
      />
      <span className="photo__zoom" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M15 15 L20 20 M10.5 8 V13 M8 10.5 H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
    </button>
  );
}

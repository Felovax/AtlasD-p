import { afterEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LazyMotion, domAnimation } from 'motion/react';
import { invitation, fyllInn } from '../config/invitation';
import { WishlistSection } from './WishlistSection';

const original = { ...invitation.wishlist };
afterEach(() => Object.assign(invitation.wishlist, original));

const renderSection = () =>
  render(
    <LazyMotion features={domAnimation}>
      <WishlistSection />
    </LazyMotion>,
  );

describe('Ønskelisten', () => {
  it('viser en tydelig plassholder når den ikke er fylt inn', () => {
    Object.assign(invitation.wishlist, { enabled: true, url: fyllInn('Lenke til ønskelisten'), items: [] });
    renderSection();
    expect(screen.getByRole('heading', { name: 'Ønskeliste' })).toBeInTheDocument();
    expect(screen.getByText(/Fylles inn: Lenke til ønskelisten/)).toBeInTheDocument();
  });

  it('viser knapp til en ekstern ønskeliste som åpnes i ny fane', () => {
    Object.assign(invitation.wishlist, { enabled: true, url: 'https://onskeskyen.no/eksempel', items: [] });
    renderSection();
    const link = screen.getByRole('link', { name: /Åpne ønskelisten/ });
    expect(link).toHaveAttribute('href', 'https://onskeskyen.no/eksempel');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('viser ønskene som pakkelapper', () => {
    Object.assign(invitation.wishlist, {
      enabled: true,
      url: null,
      items: [{ title: 'Sølvskje med navn' }, { title: 'Bøker', note: 'Gjerne klassikere', url: 'https://example.com/bok' }],
    });
    renderSection();
    expect(screen.getByText('Sølvskje med navn')).toBeInTheDocument();
    expect(screen.getByText('Gjerne klassikere')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Se ønsket: Bøker/ })).toHaveAttribute('href', 'https://example.com/bok');
    expect(screen.queryByText(/Fylles inn/)).not.toBeInTheDocument();
  });

  it('kan skrus av', () => {
    Object.assign(invitation.wishlist, { enabled: false });
    const { container } = renderSection();
    expect(container).toBeEmptyDOMElement();
  });
});

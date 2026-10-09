import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LazyMotion, domAnimation } from 'motion/react';
import { invitation, fyllInn } from '../config/invitation';
import { WishlistSection } from './WishlistSection';
import { fetchReservedWishes, myReservations, reserveWish, unreserveWish, WishError } from '../lib/wishes';

vi.mock('../lib/wishes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/wishes')>();
  return {
    ...actual,
    fetchReservedWishes: vi.fn(),
    myReservations: vi.fn(),
    reserveWish: vi.fn(),
    unreserveWish: vi.fn(),
  };
});

const original = { ...invitation.wishlist };
const items = [
  { id: 'gyngehest', title: 'Gyngehest', note: 'Giraff', url: 'https://example.com/gyngehest' },
  { id: 'minnebok', title: 'Minnebok' },
  { id: 'kors-smykke', title: 'Kors-smykke', links: [{ label: 'Sølv', url: 'https://example.com/solv' }, { label: 'Gull', url: 'https://example.com/gull' }] },
];

beforeEach(() => {
  Object.assign(invitation.wishlist, { enabled: true, url: null, items });
  vi.mocked(fetchReservedWishes).mockResolvedValue(new Set(['minnebok']));
  vi.mocked(myReservations).mockReturnValue(new Set());
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

afterEach(() => {
  Object.assign(invitation.wishlist, original);
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const renderSection = () => {
  const user = userEvent.setup();
  render(
    <LazyMotion features={domAnimation}>
      <WishlistSection />
    </LazyMotion>,
  );
  return user;
};

describe('Ønskelisten', () => {
  it('viser forklaringen og ønskene med lenker', async () => {
    renderSection();
    expect(screen.getByText(/Huk av i ruten ved gaven/)).toBeInTheDocument();
    expect(screen.getByText('Gyngehest')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Se gaven: Gyngehest/ })).toHaveAttribute('href', 'https://example.com/gyngehest');
    expect(screen.getByRole('link', { name: /Sølv: Kors-smykke/ })).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link', { name: /Gull: Kors-smykke/ })).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('viser hva som allerede er reservert, uten å si av hvem', async () => {
    renderSection();
    const taken = await screen.findByRole('checkbox', { name: 'Minnebok er reservert' });
    expect(taken).toBeChecked();
    expect(taken).toBeDisabled();
    expect(screen.getByText('Reservert av en gjest')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Reserver Gyngehest' })).not.toBeChecked();
  });

  it('lar gjesten reservere etter å ha bekreftet', async () => {
    vi.mocked(reserveWish).mockResolvedValue('reserved');
    const user = renderSection();
    const box = await screen.findByRole('checkbox', { name: 'Reserver Gyngehest' });
    await waitFor(() => expect(box).toBeEnabled());
    vi.mocked(fetchReservedWishes).mockResolvedValue(new Set(['minnebok', 'gyngehest']));
    await user.click(box);
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Ingen får vite at det var deg'));
    expect(reserveWish).toHaveBeenCalledWith('gyngehest');
    expect(await screen.findByText(/Du har reservert denne/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Angre reservasjon av Gyngehest' })).toBeChecked();
  });

  it('reserverer ikke hvis gjesten trykker Avbryt', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const user = renderSection();
    const box = await screen.findByRole('checkbox', { name: 'Reserver Gyngehest' });
    await waitFor(() => expect(box).toBeEnabled());
    await user.click(box);
    expect(reserveWish).not.toHaveBeenCalled();
    expect(box).not.toBeChecked();
  });

  it('sier fra hvis noen andre rakk det først', async () => {
    vi.mocked(reserveWish).mockResolvedValue('already_reserved');
    const user = renderSection();
    const box = await screen.findByRole('checkbox', { name: 'Reserver Gyngehest' });
    await waitFor(() => expect(box).toBeEnabled());
    vi.mocked(fetchReservedWishes).mockResolvedValue(new Set(['minnebok', 'gyngehest']));
    await user.click(box);
    expect(await screen.findByText('Noen rakk å reservere denne rett før deg.')).toBeInTheDocument();
  });

  it('lar gjesten angre sin egen reservasjon', async () => {
    vi.mocked(fetchReservedWishes).mockResolvedValue(new Set(['gyngehest']));
    vi.mocked(myReservations).mockReturnValue(new Set(['gyngehest']));
    vi.mocked(unreserveWish).mockResolvedValue(true);
    const user = renderSection();
    const box = await screen.findByRole('checkbox', { name: 'Angre reservasjon av Gyngehest' });
    vi.mocked(fetchReservedWishes).mockResolvedValue(new Set());
    await user.click(box);
    expect(unreserveWish).toHaveBeenCalledWith('gyngehest');
    expect(await screen.findByText('Reservasjonen er angret.')).toBeInTheDocument();
  });

  it('viser en vennlig feilmelding ved nettverksfeil', async () => {
    vi.mocked(reserveWish).mockRejectedValue(new WishError('network'));
    const user = renderSection();
    const box = await screen.findByRole('checkbox', { name: 'Reserver Gyngehest' });
    await waitFor(() => expect(box).toBeEnabled());
    await user.click(box);
    expect(await screen.findByText(/Sjekk nettforbindelsen/)).toBeInTheDocument();
  });

  it('deaktiverer rutene hvis reservasjonene ikke kan hentes', async () => {
    vi.mocked(fetchReservedWishes).mockRejectedValue(new WishError('server'));
    renderSection();
    expect(await screen.findByText(/Reservering er ikke tilgjengelig akkurat nå/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Reserver Gyngehest' })).toBeDisabled();
  });

  it('viser en tydelig plassholder når listen ikke er fylt inn', () => {
    Object.assign(invitation.wishlist, { url: fyllInn('Lenke til ønskelisten'), items: [] });
    renderSection();
    expect(screen.getByText(/Fylles inn: Lenke til ønskelisten/)).toBeInTheDocument();
  });

  it('kan skrus av', () => {
    Object.assign(invitation.wishlist, { enabled: false });
    render(<WishlistSection />);
    expect(screen.queryByRole('heading', { name: 'Ønskeliste' })).not.toBeInTheDocument();
  });
});

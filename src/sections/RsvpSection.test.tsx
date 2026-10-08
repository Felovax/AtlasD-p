import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { RsvpSection } from './RsvpSection';
import { RsvpError, submitRsvp } from '../lib/rsvp';

vi.mock('../lib/rsvp', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/rsvp')>();
  return { ...actual, submitRsvp: vi.fn() };
});

const submit = vi.mocked(submitRsvp);

function setup() {
  const user = userEvent.setup();
  render(
    <MotionConfig reducedMotion="always" transition={{ duration: 0 }}>
      <LazyMotion features={domAnimation}>
        <RsvpSection id="svar" />
      </LazyMotion>
    </MotionConfig>,
  );
  return user;
}

/** Et løfte vi selv bestemmer når skal løses – for å teste «Sender …»-tilstanden. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  submit.mockReset();
});

describe('Svarskjemaet', () => {
  it('viser to store valg, og navnefeltet først etter at man har valgt', async () => {
    const user = setup();
    expect(screen.getByRole('radio', { name: /Ja, jeg kommer!/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Nei, jeg kan dessverre ikke komme/ })).toBeInTheDocument();
    expect(screen.queryByLabelText('Navn')).not.toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Ja, jeg kommer!/ }));
    expect(await screen.findByLabelText('Navn')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '1 person' })).toBeChecked();
  });

  it('gir norske feilmeldinger og flytter fokus til feltet som mangler', async () => {
    const user = setup();
    await user.click(screen.getByRole('radio', { name: /Ja, jeg kommer!/ }));
    await user.click(await screen.findByRole('button', { name: 'Send svar' }));

    expect(await screen.findByText('Skriv inn navnet ditt.')).toBeInTheDocument();
    expect(screen.getByLabelText('Navn')).toHaveFocus();
    expect(screen.getByLabelText('Navn')).toHaveAttribute('aria-invalid', 'true');
    expect(submit).not.toHaveBeenCalled();
  });

  it('registrerer to personer, og bekrefter først når databasen har svart', async () => {
    const pending = deferred<{ id: string }>();
    submit.mockReturnValue(pending.promise);
    const user = setup();

    await user.click(screen.getByRole('radio', { name: /Ja, jeg kommer!/ }));
    await user.click(await screen.findByRole('radio', { name: '2 personer' }));
    await user.type(screen.getByLabelText('Navn'), '  Kari   Nordmann ');
    await user.click(screen.getByRole('button', { name: 'Send svar' }));
    expect(await screen.findByText('Skriv inn navnet på person nummer 2.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Navn på person nummer 2'), 'Ola Nordmann');
    await user.click(screen.getByRole('button', { name: 'Send svar' }));

    expect(await screen.findByRole('button', { name: /Sender/ })).toBeDisabled();
    expect(screen.queryByText(/Tusen takk/)).not.toBeInTheDocument();
    expect(submit).toHaveBeenCalledWith(
      { attending: true, guestCount: 2, primaryName: 'Kari Nordmann', secondaryName: 'Ola Nordmann' },
      expect.objectContaining({ submissionId: expect.any(String) }),
    );

    pending.resolve({ id: 'abc' });
    expect(await screen.findByText('Tusen takk! Vi gleder oss til å feire sammen med dere!')).toBeInTheDocument();
    expect(screen.getByText('Kari Nordmann og Ola Nordmann')).toBeInTheDocument();
  });

  it('registrerer et nei med ett navn', async () => {
    submit.mockResolvedValue({ id: 'abc' });
    const user = setup();
    await user.click(screen.getByRole('radio', { name: /Nei, jeg kan dessverre/ }));
    expect(screen.queryByRole('radio', { name: '2 personer' })).not.toBeInTheDocument();
    await user.type(await screen.findByLabelText('Navn'), 'Per');
    await user.click(screen.getByRole('button', { name: 'Send svar' }));

    expect(await screen.findByText('Takk for at du ga beskjed! Vi kommer til å savne deg.')).toBeInTheDocument();
    expect(submit).toHaveBeenCalledWith({ attending: false, guestCount: 0, primaryName: 'Per', secondaryName: null }, expect.anything());
  });

  it('sender bare én gang selv om man trykker flere ganger', async () => {
    const pending = deferred<{ id: string }>();
    submit.mockReturnValue(pending.promise);
    const user = setup();
    await user.click(screen.getByRole('radio', { name: /Ja, jeg kommer!/ }));
    await user.type(await screen.findByLabelText('Navn'), 'Kari');
    const button = screen.getByRole('button', { name: 'Send svar' });
    await user.dblClick(button);
    await user.click(button);
    expect(submit).toHaveBeenCalledTimes(1);
    pending.resolve({ id: 'x' });
    await screen.findByText(/Tusen takk/);
  });

  it('viser en vennlig feilmelding ved nettverksfeil, og gjenbruker samme ID ved nytt forsøk', async () => {
    submit.mockRejectedValueOnce(new RsvpError('network')).mockResolvedValueOnce({ id: 'ok' });
    const user = setup();
    await user.click(screen.getByRole('radio', { name: /Ja, jeg kommer!/ }));
    await user.type(await screen.findByLabelText('Navn'), 'Kari');
    await user.click(screen.getByRole('button', { name: 'Send svar' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Svaret ble ikke sendt.');
    expect(alert).toHaveTextContent(/internett/);
    expect(screen.queryByText(/Tusen takk/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Prøv igjen' }));
    await screen.findByText(/Tusen takk/);
    expect(submit).toHaveBeenCalledTimes(2);
    expect(submit.mock.calls[0][1].submissionId).toBe(submit.mock.calls[1][1].submissionId);
  });

  it('lar gjesten sende svar for flere etterpå', async () => {
    submit.mockResolvedValue({ id: 'abc' });
    const user = setup();
    await user.click(screen.getByRole('radio', { name: /Ja, jeg kommer!/ }));
    await user.type(await screen.findByLabelText('Navn'), 'Kari');
    await user.click(screen.getByRole('button', { name: 'Send svar' }));
    await user.click(await screen.findByRole('button', { name: 'Send svar for flere' }));
    await waitFor(() => expect(screen.getByRole('radio', { name: /Ja, jeg kommer!/ })).not.toBeChecked());
  });
});

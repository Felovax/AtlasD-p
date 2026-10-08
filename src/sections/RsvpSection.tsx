import { useId, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { invitation } from '../config/invitation';
import { ChapterHeading, Ornament } from '../components/decor/Ornament';
import { FlyingBee } from '../components/decor/Bee';
import { Reveal } from '../components/Reveal';
import { RsvpSuccess } from './RsvpSuccess';
import { daysUntil, textOf, tidy } from '../lib/format';
import {
  NAME_MAX_LENGTH,
  newSubmissionId,
  rsvpErrorMessage,
  submitRsvp,
  validateRsvp,
  type FieldErrors,
  type RsvpDraft,
  type RsvpField,
  type RsvpPayload,
} from '../lib/rsvp';
import './RsvpSection.css';

const emptyDraft: RsvpDraft = { attending: null, guestCount: 1, primaryName: '', secondaryName: '', website: '' };

type Status = { kind: 'idle' } | { kind: 'submitting' } | { kind: 'error'; message: string } | { kind: 'success'; payload: RsvpPayload };

export function RsvpSection({ id }: { id: string }) {
  const texts = invitation.texts.rsvp;
  const formId = useId();
  const [draft, setDraft] = useState<RsvpDraft>(emptyDraft);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  // Synkron sperre mot dobbeltklikk (state oppdateres ikke før neste render).
  const submittingRef = useRef(false);
  // Samme ID gjenbrukes hvis gjesten prøver igjen med nøyaktig samme svar etter en feil,
  // slik at et svar som faktisk kom fram ikke blir lagret to ganger.
  const submission = useRef<{ key: string; id: string } | null>(null);
  const fieldRefs = useRef<Partial<Record<RsvpField, HTMLElement | null>>>({});

  const deadline = textOf(invitation.event.rsvpDeadline);
  const deadlinePassed = deadline ? (daysUntil(deadline) ?? 0) < 0 : false;

  const update = (patch: Partial<RsvpDraft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (showErrors) {
      const result = validateRsvp(next);
      setErrors(result.ok ? {} : result.errors);
    }
    if (status.kind === 'error') setStatus({ kind: 'idle' });
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const result = validateRsvp(draft);
    if (!result.ok) {
      setErrors(result.errors);
      setShowErrors(true);
      const firstInvalid = (['attending', 'primaryName', 'secondaryName'] as RsvpField[]).find((f) => result.errors[f]);
      if (firstInvalid) fieldRefs.current[firstInvalid]?.focus();
      return;
    }

    const key = JSON.stringify(result.payload);
    if (!submission.current || submission.current.key !== key) {
      submission.current = { key, id: newSubmissionId() };
    }

    submittingRef.current = true;
    setStatus({ kind: 'submitting' });
    try {
      await submitRsvp(result.payload, { submissionId: submission.current.id, website: draft.website });
      submission.current = null;
      setStatus({ kind: 'success', payload: result.payload });
    } catch (error) {
      setStatus({ kind: 'error', message: rsvpErrorMessage(error) });
    } finally {
      submittingRef.current = false;
    }
  };

  const reset = () => {
    setDraft(emptyDraft);
    setErrors({});
    setShowErrors(false);
    setStatus({ kind: 'idle' });
    submission.current = null;
  };

  const submitting = status.kind === 'submitting';
  const two = draft.attending === 'yes' && draft.guestCount === 2;

  return (
    <section id={id} className="page rsvp" aria-labelledby={`${id}-heading`}>
      <div className="page__inner">
        <ChapterHeading number={4} title={texts.chapterTitle} />
        <Reveal variant="ink">
          <h2 id={`${id}-heading`} className="section-heading">
            {texts.heading}
          </h2>
          <p className="rsvp__sub">{texts.subheading}</p>
          <Ornament />
        </Reveal>

        <div className="rsvp__card">
          <FlyingBee size={30} style={{ top: '-1.6rem', left: '8%' }} rangeX={30} rangeY={12} duration={6} />
          <FlyingBee size={24} style={{ bottom: '18%', right: '-0.6rem' }} rangeX={10} rangeY={36} duration={7} delay={-2} />

          <AnimatePresence mode="wait" initial={false}>
            {status.kind === 'success' ? (
              <RsvpSuccess key="success" payload={status.payload} onReset={reset} />
            ) : (
              <m.form
                key="form"
                className="rsvp__form"
                noValidate
                onSubmit={onSubmit}
                aria-describedby={deadlinePassed ? `${formId}-deadline` : undefined}
                exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.25 } }}
              >
                {deadlinePassed && (
                  <p id={`${formId}-deadline`} className="rsvp__deadline">
                    Svarfristen har gått ut, men send gjerne svar likevel – vi blir glade for å høre fra deg!
                  </p>
                )}

                <fieldset className="rsvp__choices" aria-describedby={errors.attending ? `${formId}-attending-error` : undefined}>
                  <legend className="visually-hidden">Kommer du?</legend>
                  <ChoiceButton
                    name={`${formId}-attending`}
                    value="yes"
                    checked={draft.attending === 'yes'}
                    onChange={() => update({ attending: 'yes' })}
                    label={tidy(texts.yesOption)}
                    variant="yes"
                    inputRef={(el) => (fieldRefs.current.attending = el)}
                    disabled={submitting}
                  />
                  <ChoiceButton
                    name={`${formId}-attending`}
                    value="no"
                    checked={draft.attending === 'no'}
                    onChange={() => update({ attending: 'no' })}
                    label={tidy(texts.noOption)}
                    variant="no"
                    disabled={submitting}
                  />
                  {errors.attending && (
                    <p id={`${formId}-attending-error`} className="rsvp__field-error">
                      {errors.attending}
                    </p>
                  )}
                </fieldset>

                <AnimatePresence initial={false}>
                  {draft.attending && (
                    <m.div
                      key="fields"
                      className="rsvp__fields"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="rsvp__fields-inner">
                        {draft.attending === 'yes' && (
                          <fieldset className="rsvp__count">
                            <legend>Hvor mange kommer?</legend>
                            <div className="rsvp__count-options">
                              {([1, 2] as const).map((n) => (
                                <label key={n} className={`count-option ${draft.guestCount === n ? 'is-checked' : ''}`}>
                                  <input
                                    type="radio"
                                    name={`${formId}-count`}
                                    value={n}
                                    checked={draft.guestCount === n}
                                    onChange={() => update({ guestCount: n })}
                                    disabled={submitting}
                                  />
                                  <span>{n === 1 ? '1 person' : '2 personer'}</span>
                                </label>
                              ))}
                            </div>
                          </fieldset>
                        )}

                        <TextField
                          id={`${formId}-primary`}
                          label="Navn"
                          value={draft.primaryName}
                          onChange={(value) => update({ primaryName: value })}
                          error={errors.primaryName}
                          autoComplete="name"
                          inputRef={(el) => (fieldRefs.current.primaryName = el)}
                          disabled={submitting}
                        />

                        <AnimatePresence initial={false}>
                          {two && (
                            <m.div
                              key="second"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.35 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <TextField
                                id={`${formId}-secondary`}
                                label="Navn på person nummer 2"
                                value={draft.secondaryName}
                                onChange={(value) => update({ secondaryName: value })}
                                error={errors.secondaryName}
                                autoComplete="off"
                                inputRef={(el) => (fieldRefs.current.secondaryName = el)}
                                disabled={submitting}
                              />
                            </m.div>
                          )}
                        </AnimatePresence>

                        {/* Felle for roboter: usynlig for mennesker, men roboter fyller gjerne ut alt. */}
                        <div className="rsvp__trap" aria-hidden="true">
                          <label htmlFor={`${formId}-website`}>Ikke fyll ut dette feltet</label>
                          <input
                            id={`${formId}-website`}
                            type="text"
                            name="website"
                            tabIndex={-1}
                            autoComplete="off"
                            value={draft.website}
                            onChange={(e) => setDraft({ ...draft, website: e.target.value })}
                          />
                        </div>

                        {status.kind === 'error' && (
                          <div className="rsvp__error" role="alert">
                            <strong>Svaret ble ikke sendt.</strong> {status.message}
                          </div>
                        )}

                        <button type="submit" className="btn btn--honey rsvp__submit" disabled={submitting} aria-disabled={submitting}>
                          {submitting ? (
                            <>
                              <span className="rsvp__spinner" aria-hidden="true" />
                              Sender …
                            </>
                          ) : status.kind === 'error' ? (
                            'Prøv igjen'
                          ) : (
                            'Send svar'
                          )}
                        </button>
                        <p className="visually-hidden" aria-live="polite">
                          {submitting ? 'Sender svaret ditt …' : ''}
                        </p>
                      </div>
                    </m.div>
                  )}
                </AnimatePresence>
              </m.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

interface ChoiceButtonProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  variant: 'yes' | 'no';
  disabled?: boolean;
  inputRef?: (el: HTMLInputElement | null) => void;
}

function ChoiceButton({ name, value, checked, onChange, label, variant, disabled, inputRef }: ChoiceButtonProps) {
  return (
    <label className={`choice choice--${variant} ${checked ? 'is-checked' : ''}`}>
      <input ref={inputRef} type="radio" name={name} value={value} checked={checked} onChange={onChange} disabled={disabled} />
      <span className="choice__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="choice__label">{label}</span>
    </label>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  disabled?: boolean;
  inputRef?: (el: HTMLInputElement | null) => void;
}

function TextField({ id, label, value, onChange, error, autoComplete, disabled, inputRef }: TextFieldProps) {
  const errorId = `${id}-error`;
  const remaining = NAME_MAX_LENGTH - value.length;
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type="text"
        className="field__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={NAME_MAX_LENGTH}
        autoComplete={autoComplete}
        autoCapitalize="words"
        spellCheck={false}
        enterKeyHint="send"
        required
        aria-required="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        disabled={disabled}
      />
      {error && (
        <p id={errorId} className="rsvp__field-error">
          {error}
        </p>
      )}
      {remaining <= 10 && !error && <p className="field__hint">{remaining} tegn igjen</p>}
    </div>
  );
}


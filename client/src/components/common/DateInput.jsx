import { useEffect, useRef, useState } from 'react';
import { formatDate, parseDisplayDate } from '../../utils/displayDate.js';

// Native date inputs follow the OS locale, so use a validated, explicit US date field.
export function DateInput({ value = '', onChange, min, max, onValidityChange, ...props }) {
  const [draft, setDraft] = useState(() => formatDate(value, ''));
  const emittedValue = useRef(value);
  const input = useRef(null);
  useEffect(() => {
    if (value !== emittedValue.current) {
      emittedValue.current = value;
      setDraft(formatDate(value, ''));
    }
  }, [value]);
  const iso = parseDisplayDate(draft);
  const error = draft && !iso ? 'Enter a valid date as MM/DD/YYYY.'
    : iso && min && iso < min ? `Enter a date on or after ${formatDate(min)}.`
    : iso && max && iso > max ? `Enter a date on or before ${formatDate(max)}.` : '';
  useEffect(() => {
    input.current?.setCustomValidity(error);
    onValidityChange?.(!error);
  }, [error, onValidityChange]);
  return <><input {...props} ref={input} type="text" inputMode="numeric" placeholder="MM/DD/YYYY"
    maxLength={10} aria-invalid={Boolean(error)} value={draft}
    onChange={event => {
      const text = event.target.value;
      setDraft(text);
      const next = parseDisplayDate(text);
      emittedValue.current = next;
      onChange({ target: { value: next } });
    }} onBlur={() => { if (iso) setDraft(formatDate(iso)); }} />
    {error && <small role="alert">{error}</small>}</>;
}

// Keep calendar dates in ISO form for storage, and use MM/DD/YYYY in the UI.
export function isCalendarDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function parseDisplayDate(value) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(value).trim());
  if (!match) return '';
  const iso = `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
  return isCalendarDate(iso) ? iso : '';
}

export function formatDate(value, fallback = '—') {
  if (!value) return fallback;
  // Do not shift a stored calendar date when the browser is in a different timezone.
  const text = String(value);
  const iso = isCalendarDate(text) ? text : parseDisplayDate(text);
  if (iso) return `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return fallback;
  return new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).format(date);
}

export function formatDateTime(value) {
  const date = new Date(value);
  if (!value || !Number.isFinite(date.getTime())) return '—';
  return `${formatDate(date)}, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
}

export function formatMonth(value) {
  return /^\d{4}-\d{2}$/.test(value) ? `${value.slice(5)}/${value.slice(0, 4)}` : value;
}

// Older system notifications can contain stored ISO calendar dates in their text.
export function formatDatesInText(value = '') {
  return String(value || '').replace(/\b\d{4}-\d{2}-\d{2}\b/g, date => isCalendarDate(date) ? formatDate(date) : date);
}

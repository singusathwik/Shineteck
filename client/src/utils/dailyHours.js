export function datesInPeriod(start, end) {
  const valid = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  if (!valid(start) || !valid(end) || start > end) throw new Error('Select a valid start and end date.');
  const count = (Date.parse(end) - Date.parse(start)) / 86400000 + 1;
  if (count > 62) throw new Error('Submit at most 62 days in one timesheet.');
  return Array.from({ length: count }, (_, i) => new Date(Date.parse(start) + i * 86400000).toISOString().slice(0, 10));
}
export function validateDailyHours(start, end, input) {
  const dates = datesInPeriod(start, end);
  const entries = typeof input === 'string' ? JSON.parse(input) : input;
  if (!Array.isArray(entries) || entries.length !== dates.length) throw new Error('Enter hours for every date in the period, including zero for days off.');
  const map = new Map();
  for (const row of entries) {
    if (!row || map.has(row.date) || !dates.includes(row.date) || (typeof row.hours === 'string' && !/^\d+(?:\.\d{1,2})?$/.test(row.hours.trim())) || row.hours == null || !['number', 'string'].includes(typeof row.hours)) throw new Error('Each date must have exactly one hours entry.');
    const hours = Number(row.hours);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24 || Math.abs(hours * 100 - Math.round(hours * 100)) > 0.000001) throw new Error('Daily hours must be from 0 to 24, with at most two decimal places.');
    map.set(row.date, hours);
  }
  return dates.map(date => ({ date, hours: map.get(date) }));
}
export function monthlyHours(entries) {
  const totals = {};
  for (const row of entries) {
    const month = row.date.slice(0, 7);
    totals[month] = (totals[month] || 0) + Math.round(Number(row.hours) * 100);
  }
  return Object.fromEntries(Object.entries(totals).map(([month, hours]) => [month, hours / 100]));
}
export function decodeDailyHours(row) {
  try {
    const entries = Array.isArray(row.daily_hours) ? row.daily_hours : JSON.parse(row.daily_hours || '[]');
    if (!Array.isArray(entries) || !entries.length) return [];
    return validateDailyHours(row.start_date || entries[0]?.date, row.end_date || entries.at(-1)?.date, entries);
  } catch { return []; }
}

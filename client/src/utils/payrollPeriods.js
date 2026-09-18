export function isDate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function payrollPeriod(entry) {
  if (entry.start_date && entry.end_date) return { start_date: entry.start_date, end_date: entry.end_date, period_inferred: entry.period_inferred === true };
  const value = entry.payroll_month;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value || '')) return { start_date: '', end_date: '', period_inferred: true };
  const [year, month] = value.split('-').map(Number);
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { start_date: `${value}-01`, end_date: `${value}-${days}`, period_inferred: true };
}

export function overlapsPeriod(entry, start, end) {
  const period = payrollPeriod(entry);
  return (!start || period.end_date >= start) && (!end || period.start_date <= end);
}

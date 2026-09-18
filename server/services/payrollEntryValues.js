import { isDate, payrollPeriod } from '../../client/src/utils/payrollPeriods.js';
import { invoiceAmounts } from '../../client/src/utils/invoiceAmounts.js';

export function normalizePayrollEntry(entry) {
  return { ...entry, currency: entry.currency || (entry.country === 'India' ? 'INR' : 'USD'), ...payrollPeriod(entry) };
}

export function validatePayrollEntry(body) {
  const fail = message => { const error = new Error(message); error.status = 400; throw error; };
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Provide a payroll entry.');
  const entry = {};
  for (const key of ['employee_id', 'employee_name']) {
    if (typeof body[key] !== 'string' || !body[key].trim()) fail('Select an employee.');
    entry[key] = body[key].trim();
  }
  if (entry.employee_id.startsWith('DEMO-')) fail('Sample records cannot be saved to payroll.');
  if (!isDate(body.start_date) || !isDate(body.end_date)) fail('Enter valid payroll start and end dates.');
  if (body.start_date > body.end_date) fail('End date must be on or after start date.');
  Object.assign(entry, { start_date: body.start_date, end_date: body.end_date, payroll_month: body.start_date.slice(0, 7) });
  for (const key of ['total_hours', 'bill_rate', 'emp_bill_rate']) {
    const value = body[key];
    if (!['number', 'string'].includes(typeof value) || String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1000000 || Number(Number(value).toFixed(2)) !== Number(value)) fail('Hours and rates must be nonnegative numbers with at most two decimal places (maximum 1,000,000).');
    entry[key] = Number(value);
  }
  if (!['INR', 'USD'].includes(body.currency)) fail('Choose INR or USD.');
  entry.currency = body.currency;
  entry.country = body.currency === 'INR' ? 'India' : 'United States';
  for (const key of ['vendor_name', 'client_name']) {
    if (body[key] != null && typeof body[key] !== 'string') fail('Vendor and client names must be text.');
    entry[key] = (body[key] || '').trim();
  }
  entry.gross_amount = invoiceAmounts(entry.total_hours, entry.emp_bill_rate).invoice_amount;
  return entry;
}

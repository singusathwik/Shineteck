import { invoiceAmounts } from '../../client/src/utils/invoiceAmounts.js';
export { invoiceAmounts };
export const INVOICE_STATUSES = ['Pending', 'Received', 'Paid'];

export function validateInvoice(body) {
  const fail = message => { const error = new Error(message); error.status = 400; throw error; };
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('Provide an invoice object.');
  const result = {};
  for (const key of ['employee_id', 'invoice_number', 'month', 'currency', 'status']) {
    if (typeof body[key] !== 'string' || !body[key].trim()) fail(`${key.replaceAll('_', ' ')} is required.`);
    result[key] = body[key].trim();
  }
  if (result.invoice_number.length > 80) fail('Invoice number must be 80 characters or fewer.');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(result.month)) fail('Choose a valid invoice month.');
  if (!['USD', 'INR'].includes(result.currency)) fail('Choose USD or INR.');
  if (!INVOICE_STATUSES.includes(result.status)) fail('Choose a valid payment status.');
  for (const key of ['total_hours', 'rate']) {
    const value = body[key];
    if (!['number', 'string'].includes(typeof value) || String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 1000000) fail(`${key.replaceAll('_', ' ')} must be a number from 0 to 1,000,000.`);
    if (Number(Number(value).toFixed(2)) !== Number(value)) fail(`${key.replaceAll('_', ' ')} must have at most two decimal places.`);
    result[key] = Number(value);
  }
  for (const key of ['due_date', 'received_date', 'paid_date']) {
    const value = body[key] ?? '';
    if (typeof value !== 'string') fail('Enter valid dates.');
    if (value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) fail(`Enter a valid ${key.replaceAll('_', ' ')}.`);
    result[key] = value;
  }
  if (!result.due_date) fail('Due date is required.');
  if (result.status !== 'Pending' && !result.received_date) fail('Received date is required for received or paid invoices.');
  if (result.status === 'Paid' && !result.paid_date) fail('Paid date is required for paid invoices.');
  if (result.status === 'Pending' && (result.received_date || result.paid_date)) fail('Change status before adding received or paid dates.');
  if (result.status !== 'Paid' && result.paid_date) fail('Set status to Paid when entering a paid date.');
  if (result.paid_date && result.paid_date < result.received_date) fail('Paid date cannot be before received date.');
  return { ...result, ...invoiceAmounts(result.total_hours, result.rate) };
}

import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { createPayrollEntryHandlers } from './controllers/payrollEntryController.js';
import { validatePayrollEntry } from './services/payrollEntryValues.js';
import { payrollPeriod, overlapsPeriod } from '../client/src/utils/payrollPeriods.js';
import { monthlyPayments, paymentYears } from '../client/src/utils/payrollHistory.js';
import { payrollDemoInvoices, payrollDemoEntries } from '../client/src/utils/payrollDemo.js';

const sample = { employee_id: 'TEST-1', employee_name: 'Test employee', currency: 'USD', start_date: '2025-01-14', end_date: '2025-01-28', total_hours: 80, bill_rate: 60, emp_bill_rate: 45 };
async function call(handler, { body = {}, params = {}, query = {} } = {}) {
  const result = { status: 200 };
  await handler({ body, params, query }, { status(value) { result.status = value; return this; }, json(value) { result.body = value; } });
  return result;
}
test('validates full dates and preserves leap-year legacy periods without claiming exact dates', () => {
  const period = payrollPeriod({ payroll_month: '2024-02' });
  assert.deepEqual(period, { start_date: '2024-02-01', end_date: '2024-02-29', period_inferred: true });
  assert.equal(payrollPeriod({ ...period, payroll_month: '2024-02' }).period_inferred, true);
  assert.equal(overlapsPeriod(sample, '2025-01-28', '2025-02-01'), true);
  assert.equal(overlapsPeriod(sample, '2025-01-29', ''), false);
  for (const change of [{ start_date: '2025-02-29' }, { end_date: '2025-01-13' }, { start_date: '' }, { bill_rate: -1 }, { emp_bill_rate: '' }, { employee_id: 'DEMO-PAYROLL-US' }]) assert.throws(() => validatePayrollEntry({ ...sample, ...change }), { status: 400 });
  assert.equal(validatePayrollEntry(sample).gross_amount, 3600);
});
test('saves full date ranges, edits only one record, and filters region and overlapping dates', async () => {
  const database = new Database(':memory:');
  try {
    database.exec(`CREATE TABLE payroll_entries (id INTEGER PRIMARY KEY AUTOINCREMENT, employee_id TEXT, employee_name TEXT, payroll_month TEXT, start_date TEXT, end_date TEXT, total_hours REAL, bill_rate REAL, emp_bill_rate REAL, gross_amount REAL, currency TEXT, country TEXT, vendor_name TEXT, client_name TEXT, updated_at TEXT)`);
    const handlers = createPayrollEntryHandlers({ database, mongoConnected: () => false, mongoConfigured: () => false });
    const first = await call(handlers.createPayrollEntry, { body: sample });
    const second = await call(handlers.createPayrollEntry, { body: { ...sample, start_date: '2025-01-29', end_date: '2025-01-31' } });
    await call(handlers.createPayrollEntry, { body: { ...sample, employee_id: 'TEST-2', currency: 'INR' } });
    assert.equal(first.status, 201);
    assert.equal((await call(handlers.getAllPayrollEntries, { query: { currency: 'USD', start_date: '2025-01-28', end_date: '2025-01-28' } })).body.entries.length, 1);
    const id = first.body.entry._id;
    assert.equal((await call(handlers.updatePayrollEntry, { params: { id }, body: { ...sample, end_date: '2025-01-25' } })).status, 200);
    assert.equal(database.prepare('SELECT end_date FROM payroll_entries WHERE id = ?').get(second.body.entry.id).end_date, '2025-01-31');
    assert.equal(database.prepare('SELECT end_date FROM payroll_entries WHERE id = ?').get(id).end_date, '2025-01-25');
    assert.equal((await call(handlers.getAllPayrollEntries, { query: { search: '[', currency: 'USD' } })).status, 200);
    assert.equal((await call(handlers.getAllPayrollEntries, { query: { start_date: '2025-02-01', end_date: '2025-01-01' } })).status, 400);
    assert.equal((await call(handlers.deletePayrollEntry, { params: { id } })).status, 200);
    assert.equal(database.prepare('SELECT COUNT(*) AS count FROM payroll_entries').get().count, 2);
  } finally { database.close(); }
});
test('history does not double-count billing, mix currencies, or count unpaid invoices as paid', () => {
  const invoices = [
    { month: '2025-01', currency: 'USD', invoice_amount: 1000, employee_share: 750, tax: 150, net_amount: 600, status: 'Paid' },
    { month: '2025-01', currency: 'USD', invoice_amount: 2000, employee_share: 1500, tax: 300, net_amount: 1200, status: 'Received' },
    { month: '2025-01', currency: 'INR', invoice_amount: 9000, employee_share: 6750, tax: 1350, net_amount: 5400, status: 'Paid' }
  ];
  const months = monthlyPayments(invoices, [{ payroll_month: '2025-01', currency: 'USD', gross_amount: 2250 }], '2025', 'USD');
  assert.equal(months[0].gross, 2250);
  assert.equal(months[0].billingGross, 2250);
  assert.equal(months[0].paid, 600);
  assert.equal(months[0].outstanding, 1200);
  assert.equal(months[1].count, 0);
  assert.equal(months.length, 12);
});
test('demo has 24 matching sample invoices over two years and all twelve months per year', () => {
  assert.equal(payrollDemoInvoices.length, 24);
  assert.deepEqual(paymentYears(payrollDemoInvoices, payrollDemoEntries), ['2025', '2024']);
  for (const year of ['2024', '2025']) {
    const months = monthlyPayments(payrollDemoInvoices, payrollDemoEntries, year, 'USD');
    assert.ok(months.every(row => row.count === 1 && row.gross === row.billingGross && row.paid > 0));
  }
});

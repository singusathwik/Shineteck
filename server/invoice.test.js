import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { validateInvoice, invoiceAmounts } from './services/invoiceValues.js';
import { createInvoiceHandlers } from './controllers/invoiceController.js';
import { serializeCSV } from '../client/src/utils/csvExport.js';
import { parse } from 'csv-parse/sync';

const draft = { employee_id: 'TEST-1', invoice_number: 'INV-001', month: '2026-09', currency: 'USD', total_hours: 160, rate: 50, status: 'Pending', due_date: '2026-10-15', received_date: '', paid_date: '' };
test('amounts use employee share as the tax base and round each stage to cents', () => {
  assert.deepEqual(invoiceAmounts(160, 50), { invoice_amount: 8000, employee_share: 6000, tax: 1200, net_amount: 4800 });
  assert.deepEqual(invoiceAmounts(1, 0.07), { invoice_amount: 0.07, employee_share: 0.05, tax: 0.01, net_amount: 0.04 });
  assert.equal(validateInvoice({ ...draft, net_amount: 900000 }).net_amount, 4800);
});
test('fractional hours round half cents up consistently at every calculation stage', () => {
  assert.deepEqual(invoiceAmounts(0.03, 68.5), { invoice_amount: 2.06, employee_share: 1.55, tax: 0.31, net_amount: 1.24 });
  assert.equal(validateInvoice({ ...draft, total_hours: 0.03, rate: 68.5 }).invoice_amount, 2.06);
  assert.deepEqual(invoiceAmounts(1000000, 1000000), { invoice_amount: 1000000000000, employee_share: 750000000000, tax: 150000000000, net_amount: 600000000000 });
});
test('rejects malformed bodies, non-string dates, and silently rounded inputs', () => {
  for (const body of [undefined, null, [], 'invoice', 1]) assert.throws(() => validateInvoice(body), { status: 400 });
  for (const invalid of [{ rate: 1.005 }, { total_hours: 0.001 }, { received_date: false }, { paid_date: 0 }]) assert.throws(() => validateInvoice({ ...draft, ...invalid }), { status: 400 });
});
test('CSV export neutralizes formulas after whitespace trimming and preserves CSV structure', () => {
  const serialized = serializeCSV([
    { name: '  =1+1', amount: -25.5, notes: 'first\rsecond' },
    { name: '\t@SUM(1)', amount: 0, notes: 'A, "quoted"\nline' },
    { name: '  +123', amount: 4, notes: null },
    { name: ' -1+2', amount: 8, notes: 'normal' }
  ]);
  const rows = parse(serialized, { columns: true });
  assert.deepEqual(rows, [
    { name: "'=1+1", amount: '-25.5', notes: 'first\rsecond' },
    { name: "'@SUM(1)", amount: '0', notes: 'A, "quoted"\nline' },
    { name: "'+123", amount: '4', notes: '' },
    { name: "'-1+2", amount: '8', notes: 'normal' }
  ]);
  assert.equal(serializeCSV([{ value: 'ok' }], { value: 'Value' }), 'Value\r\nok');
  assert.equal(serializeCSV([]), '');
});
test('rejects invalid numbers, impossible dates, and inconsistent payment states', () => {
  for (const invalid of [{ rate: -1 }, { total_hours: '' }, { rate: 'Infinity' }, { rate: true }, { month: '2026-13' }, { due_date: '2026-02-30' }, { invoice_number: ' ' }, { status: 'Paid' }, { status: 'Received' }, { paid_date: '2026-10-12' }, { currency: 'EUR' }, { status: 'Paid', received_date: '2026-10-12', paid_date: '2026-10-11' }]) assert.throws(() => validateInvoice({ ...draft, ...invalid }), { status: 400 });
  assert.equal(validateInvoice({ ...draft, status: 'Paid', received_date: '2026-10-12', paid_date: '2026-10-13' }).status, 'Paid');
});
async function invoke(handler, body = {}, params = {}, query = {}) {
  const result = { code: 200 };
  await handler({ body, params, query }, { status(code) { result.code = code; return this; }, json(value) { result.body = value; } });
  return result;
}
test('invoice persistence: create, reload, edit, duplicates, and employee isolation', async () => {
  const database = new Database(':memory:');
  try {
    database.exec("CREATE TABLE employees (employee_id TEXT PRIMARY KEY); INSERT INTO employees VALUES ('TEST-1'), ('TEST-2');");
    const handlers = createInvoiceHandlers({ database, mongoConnected: () => false, mongoConfigured: () => false });
    const created = await invoke(handlers.save, draft);
    assert.equal(created.code, 201);
    const id = created.body.invoice.id;
    assert.equal((await invoke(handlers.list, {}, {}, { employee_id: 'TEST-1' })).body.invoices[0].net_amount, 4800);
    assert.deepEqual((await invoke(handlers.list, {}, {}, { employee_id: 'TEST-2' })).body.invoices, []);
    assert.equal((await invoke(handlers.save, draft)).code, 409);
    assert.equal((await invoke(handlers.save, { ...draft, employee_id: 'TEST-2' })).code, 201);
    assert.equal((await invoke(handlers.save, { ...draft, employee_id: 'TEST-2' }, { id })).code, 404);
    const paid = await invoke(handlers.save, { ...draft, rate: 60, status: 'Paid', received_date: '2026-10-12', paid_date: '2026-10-13' }, { id });
    assert.equal(paid.code, 200);
    const loaded = (await invoke(handlers.list, {}, {}, { employee_id: 'TEST-1' })).body.invoices[0];
    assert.equal(loaded.status, 'Paid');
    assert.equal(loaded.net_amount, 5760);
    assert.equal(loaded.paid_date, '2026-10-13');
    assert.equal((await invoke(handlers.save, { ...draft, employee_id: 'MISSING' })).code, 404);
    assert.equal((await invoke(handlers.save, draft, { id: 'missing' })).code, 404);
    assert.equal((await invoke(handlers.list)).code, 400);
    assert.equal((await invoke(handlers.save, null)).code, 400);
  } finally { database.close(); }
});
test('configured cloud outage never silently writes invoices to a different database', async () => {
  const handlers = createInvoiceHandlers({ database: null, mongoConnected: () => false, mongoConfigured: () => true });
  assert.equal((await invoke(handlers.save, draft)).code, 503);
});

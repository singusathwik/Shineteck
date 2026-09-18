import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { db } from '../db/schema.js';
import { isMongoConnected } from '../db/mongo.js';
import { Employee } from '../models/index.js';
import { validateInvoice } from '../services/invoiceValues.js';

const schema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  employee_id: { type: String, required: true },
  invoice_number: { type: String, required: true },
  month: String, currency: String, status: String,
  total_hours: Number, rate: Number, invoice_amount: Number,
  employee_share: Number, tax: Number, net_amount: Number,
  due_date: String, received_date: String, paid_date: String,
  updated_at: String
});
schema.index({ employee_id: 1, invoice_number: 1 }, { unique: true });
const Invoice = mongoose.models.EmployeeInvoice || mongoose.model('EmployeeInvoice', schema);

export const invoiceTableSQL = `CREATE TABLE IF NOT EXISTS employee_invoices (
  id TEXT PRIMARY KEY, employee_id TEXT NOT NULL, invoice_number TEXT NOT NULL,
  month TEXT NOT NULL, currency TEXT NOT NULL, status TEXT NOT NULL,
  total_hours REAL NOT NULL, rate REAL NOT NULL, invoice_amount REAL NOT NULL,
  employee_share REAL NOT NULL, tax REAL NOT NULL, net_amount REAL NOT NULL,
  due_date TEXT NOT NULL, received_date TEXT, paid_date TEXT, updated_at TEXT NOT NULL,
  UNIQUE(employee_id, invoice_number)
)`;

// Dependency injection keeps persistence tests isolated from the portal's real data.
export function createInvoiceHandlers({ database = db, mongoConnected = isMongoConnected, mongoConfigured = () => Boolean(process.env.MONGODB_URI?.trim()) } = {}) {
  const backend = () => {
    if (mongoConnected()) return 'mongo';
    if (mongoConfigured()) { const error = new Error('Invoice database is unavailable. Please try again shortly.'); error.status = 503; throw error; }
    database.exec(invoiceTableSQL);
    return 'sqlite';
  };
  const handle = action => async (req, res) => {
    try { await action(req, res, backend()); }
    catch (error) {
      const duplicate = error.code === 11000 || error.code === 'SQLITE_CONSTRAINT_UNIQUE';
      if (!duplicate && !error.status) console.error('[Invoice ledger]', error.message);
      res.status(duplicate ? 409 : error.status || 500).json({ error: duplicate ? 'This employee already has an invoice with that number.' : error.status ? error.message : 'Unable to save or load invoices. Please try again.' });
    }
  };
  return {
    list: handle(async (req, res, source) => {
      if (typeof req.query.employee_id !== 'string' || !req.query.employee_id) { res.status(400).json({ error: 'Select an employee.' }); return; }
      const invoices = source === 'mongo'
        ? await Invoice.find({ employee_id: req.query.employee_id }).sort({ month: -1, invoice_number: 1 }).lean()
        : database.prepare('SELECT * FROM employee_invoices WHERE employee_id = ? ORDER BY month DESC, invoice_number').all(req.query.employee_id);
      res.json({ invoices });
    }),
    save: handle(async (req, res, source) => {
      const values = validateInvoice(req.body);
      const employee = source === 'mongo' ? await Employee.findOne({ employee_id: values.employee_id }).lean() : database.prepare('SELECT employee_id FROM employees WHERE employee_id = ?').get(values.employee_id);
      if (!employee) { res.status(404).json({ error: 'Employee not found.' }); return; }
      const id = req.params.id || randomUUID();
      const invoice = { ...values, id, updated_at: new Date().toISOString() };
      if (source === 'mongo') {
        await Invoice.init();
        if (req.params.id) {
          const saved = await Invoice.findOneAndUpdate({ id, employee_id: values.employee_id }, invoice, { new: true, runValidators: true });
          if (!saved) { res.status(404).json({ error: 'Invoice not found.' }); return; }
        } else await Invoice.create(invoice);
      } else if (req.params.id) {
        const columns = Object.keys(invoice).filter(key => key !== 'id');
        const result = database.prepare(`UPDATE employee_invoices SET ${columns.map(key => `${key} = @${key}`).join(', ')} WHERE id = @id AND employee_id = @employee_id`).run(invoice);
        if (!result.changes) { res.status(404).json({ error: 'Invoice not found.' }); return; }
      } else {
        const columns = Object.keys(invoice);
        database.prepare(`INSERT INTO employee_invoices (${columns.join(', ')}) VALUES (${columns.map(key => `@${key}`).join(', ')})`).run(invoice);
      }
      res.status(req.params.id ? 200 : 201).json({ invoice });
    })
  };
}

export const invoiceHandlers = createInvoiceHandlers();

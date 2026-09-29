import { PayrollEntry } from '../models/index.js';
import { db } from '../db/schema.js';
import { isMongoConnected } from '../db/mongo.js';
import { normalizePayrollEntry, validatePayrollEntry } from '../services/payrollEntryValues.js';
import { isDate, overlapsPeriod } from '../../client/src/utils/payrollPeriods.js';

function fail(res, error) {
  if (!error.status) console.error('[Payroll entries]', error.message);
  return res.status(error.status || 500).json({ error: error.status ? error.message : 'Unable to update or load payroll entries. Please try again.' });
}

export function createPayrollEntryHandlers({ database = db, model = PayrollEntry, mongoConnected = isMongoConnected, mongoConfigured = () => Boolean(process.env.MONGODB_URI?.trim()) } = {}) {
async function getAllPayrollEntries(req, res) {
  try {
    const { search = '', month, currency, employee_id, start_date, end_date } = req.query;
    if (typeof search !== 'string' || (employee_id != null && typeof employee_id !== 'string')) return res.status(400).json({ error: 'Invalid search.' });
    if ((start_date && !isDate(start_date)) || (end_date && !isDate(end_date)) || (start_date && end_date && start_date > end_date)) return res.status(400).json({ error: 'Enter a valid start and end date range.' });
    let all = mongoConnected() ? await model.find({}).sort({ payroll_month: -1, created_at: -1 }).lean() : [];
    if (!all.length) all = database.prepare('SELECT * FROM payroll_entries ORDER BY payroll_month DESC, id DESC').all().map(row => ({ ...row, _id: String(row.id) }));
    all = all.map(normalizePayrollEntry);
    const query = search.toLowerCase();
    const entries = all.filter(entry => (!currency || currency === 'ALL' || entry.currency === currency)
      && (!month || entry.payroll_month === month) && (!employee_id || entry.employee_id === employee_id)
      && overlapsPeriod(entry, start_date, end_date)
      && ['employee_id', 'employee_name', 'vendor_name', 'client_name'].some(key => String(entry[key] || '').toLowerCase().includes(query)));
    const summary = { inrGross: 0, inrHours: 0, inrCount: 0, usdGross: 0, usdHours: 0, usdCount: 0, totalHours: 0, totalEntries: entries.length };
    for (const entry of entries) {
      const prefix = entry.currency === 'INR' ? 'inr' : 'usd';
      summary[`${prefix}Gross`] += entry.gross_amount;
      summary[`${prefix}Hours`] += entry.total_hours;
      summary[`${prefix}Count`]++;
      summary.totalHours += entry.total_hours;
    }
    res.json({ entries, summary });
  } catch (error) { fail(res, error); }
}

async function createPayrollEntry(req, res) {
  try {
    const values = { ...validatePayrollEntry(req.body), ...(req.recordCompanyId ? { company_id: req.recordCompanyId } : {}) };
    if (mongoConfigured() && !mongoConnected()) return res.status(503).json({ error: 'Cloud database is unavailable. Try again shortly.' });
    let entry;
    if (mongoConnected()) entry = await model.create(values);
    else {
      const columns = Object.keys(values);
      const result = database.prepare(`INSERT INTO payroll_entries (${columns.join(', ')}) VALUES (${columns.map(key => `@${key}`).join(', ')})`).run(values);
      entry = { ...values, id: Number(result.lastInsertRowid), _id: String(result.lastInsertRowid) };
    }
    res.status(201).json({ entry });
  } catch (error) { fail(res, error); }
}

async function updatePayrollEntry(req, res) {
  try {
    const { id } = req.params;
    const values = { ...validatePayrollEntry(req.body), ...(req.recordCompanyId ? { company_id: req.recordCompanyId } : {}) };
    if (mongoConfigured() && !mongoConnected()) return res.status(503).json({ error: 'Cloud database is unavailable. Try again shortly.' });
    let entry;
    if (/^[a-f\d]{24}$/i.test(id)) {
      if (!mongoConnected()) return res.status(503).json({ error: 'Cloud database is unavailable. Try again shortly.' });
      entry = await model.findByIdAndUpdate(id, { ...values, updated_at: new Date() }, { new: true, runValidators: true });
    } else if (/^\d+$/.test(id)) {
      const result = database.prepare(`UPDATE payroll_entries SET ${Object.keys(values).map(key => `${key} = @${key}`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = @id`).run({ ...values, id });
      if (result.changes) entry = { ...values, id: Number(id), _id: id };
    }
    if (!entry) return res.status(404).json({ error: 'Payroll entry not found.' });
    res.json({ entry });
  } catch (error) { fail(res, error); }
}

async function deletePayrollEntry(req, res) {
  try {
    const { id } = req.params;
    let deleted;
    if (/^[a-f\d]{24}$/i.test(id)) {
      if (!mongoConnected()) return res.status(503).json({ error: 'Cloud database is unavailable. Try again shortly.' });
      deleted = await model.findByIdAndDelete(id);
    } else if (/^\d+$/.test(id)) deleted = database.prepare('DELETE FROM payroll_entries WHERE id = ?').run(id).changes;
    if (!deleted) return res.status(404).json({ error: 'Payroll entry not found.' });
    res.json({ success: true });
  } catch (error) { fail(res, error); }
}

return { getAllPayrollEntries, createPayrollEntry, updatePayrollEntry, deletePayrollEntry };
}
export const { getAllPayrollEntries, createPayrollEntry, updatePayrollEntry, deletePayrollEntry } = createPayrollEntryHandlers();


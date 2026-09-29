import { randomUUID } from 'node:crypto';
import { accessStore, accessError } from '../services/companyAccessStore.js';

const handle = action => async (req, res) => { try { await action(req, res); } catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'Unable to save expenses. Please try again.' }); } };
export const listExpenses = handle(async (req, res) => {
  if (!['US', 'India'].includes(req.query.region)) throw accessError('Select US or India expenses.', 400);
  const expenses = (await accessStore.list('expense:')).filter(row => row.region === req.query.region && req.companyScope.allowsCompany(row.company_id)).map(({ key, ...row }) => row).sort((a, b) => b.date.localeCompare(a.date));
  res.json({ expenses });
});
export const saveExpense = handle(async (req, res) => {
  const { id, company_id, region, date, payee, category, amount, status, notes } = req.body;
  if (!req.companyScope.allowsCompany(company_id) || !req.companyScope.companies.some(c => c.id === company_id && c.enabled)) throw accessError('Select an enabled company you can manage.');
  if (!['US', 'India'].includes(region) || !['Pending', 'Paid'].includes(status)) throw accessError('Select a valid region and payment status.', 400);
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) throw accessError('Enter a valid expense date.', 400);
  if (typeof payee !== 'string' || !payee.trim() || payee.length > 200 || typeof category !== 'string' || !category.trim() || category.length > 100) throw accessError('Enter a payee and category.', 400);
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0 || value > 1e9 || Math.abs(value * 100 - Math.round(value * 100)) > 1e-5) throw accessError('Enter a positive amount with at most two decimal places.', 400);
  const before = id ? await accessStore.get(`expense:${id}`) : null;
  if (id && (!before || !req.companyScope.allowsCompany(before.company_id))) throw accessError('Expense not found.', 404);
  if (before && (before.company_id !== company_id || before.region !== region)) throw accessError('An expense cannot be moved to another company or region.', 400);
  const record = { id: before?.id || randomUUID(), company_id, region, currency: region === 'India' ? 'INR' : 'USD', date, payee: payee.trim(), category: category.trim(), amount: value, status, notes: String(notes || '').slice(0, 2000), updatedAt: new Date().toISOString(), updatedBy: req.user.employeeId };
  await accessStore.set(`expense:${record.id}`, record);
  const auditId = randomUUID();
  await accessStore.set(`audit:${record.updatedAt}:${auditId}`, { id: auditId, at: record.updatedAt, actorEmail: req.user.email, actor: req.user.employeeId, action: 'EXPENSE_SAVED', target: record.id, before, after: record });
  res.status(id ? 200 : 201).json({ expense: record, message: 'Expense saved.' });
});

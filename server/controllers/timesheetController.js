import { notifyEmployee } from '../services/notifications.js';
import { mergedRecords, timesheetIdentity } from '../services/portalRecords.js';
import { persistPrivateFile, readPrivateFile } from '../services/privateFiles.js';
import { logAudit } from '../middleware/audit.js';
import path from 'node:path';
import fs from 'node:fs';
import { db } from '../db/schema.js';
import { Timesheet as MongoTimesheet, Employee } from '../models/index.js';
import { isMongoConnected } from '../db/mongo.js';
import { TIMESHEET_DIR } from '../middleware/upload.js';
import { validateDailyHours, monthlyHours, decodeDailyHours } from '../../client/src/utils/dailyHours.js';
import { accessError } from '../services/companyAccessStore.js';

// Serialize submissions and review transitions for the same employee in this API process.
const pendingWrites = new Map();
async function withEmployeeLock(id, action) {
  const previous = pendingWrites.get(id) || Promise.resolve();
  const current = previous.catch(() => {}).then(action);
  pendingWrites.set(id, current);
  try { return await current; } finally { if (pendingWrites.get(id) === current) pendingWrites.delete(id); }
}
const normalize = row => ({ ...row, id: String(row._id || row.id), employee_full_name: row.employee_name, daily_hours: decodeDailyHours(row), monthly_hours: monthlyHours(decodeDailyHours(row)) });
const handle = action => async (req, res) => { try { await action(req, res); } catch (error) { if (req.file?.path) fs.promises.unlink(req.file.path).catch(() => {}); res.status(error.status || 500).json({ error: error.status ? error.message : 'Unable to process the timesheet. Please try again.' }); } };
async function find(id) {
  if (/^[a-f0-9]{24}$/i.test(id) && isMongoConnected()) return MongoTimesheet.findById(id).lean();
  return db.prepare('SELECT * FROM timesheets WHERE id = ?').get(id);
}
export async function timesheetRows() {
  return (await mergedRecords('timesheets', MongoTimesheet, timesheetIdentity)).map(normalize);
}
export const submitTimesheet = handle(async (req, res) => withEmployeeLock(req.user.employeeId, async () => {
  let entries;
  try { entries = validateDailyHours(req.body.startDate, req.body.endDate, req.body.dailyHours); }
  catch (error) { throw accessError(error.message, 400); }
  const total = Math.round(entries.reduce((sum, row) => sum + row.hours, 0) * 100) / 100;
  if (total <= 0) throw accessError('Enter work hours for at least one day.', 400);
  if (!req.companyId) throw accessError('Select a company for this timesheet.', 400);
  const employee_id = req.user.employeeId;
  const overlapping = (await timesheetRows()).some(row => row.employee_id === employee_id && (row.company_id || req.legacyCompanyId) === req.companyId && !['Rejected', 'Needs Correction'].includes(row.status) && row.start_date <= req.body.endDate && row.end_date >= req.body.startDate);
  if (overlapping) throw accessError('An active timesheet already covers part of this period for this company. Ask your administrator to mark it Needs Correction before resubmitting.', 409);
  const employee = isMongoConnected() ? await Employee.findOne({ employee_id }).lean() : db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(employee_id);
  const data = { employee_id, employee_name: employee?.full_name || req.user.email, company_id: req.companyId, start_date: req.body.startDate, end_date: req.body.endDate, daily_hours: entries, total_hours: total, vendor_name: String(req.body.vendorName || '').trim(), notes: String(req.body.notes || '').trim(), file_name: req.file?.originalname || null, file_path: req.file?.filename || null, status: 'Pending' };
  if (req.file) await persistPrivateFile(req.file);
  let row;
  if (isMongoConnected()) row = (await MongoTimesheet.create(data)).toObject();
  else {
    const result = db.prepare(`INSERT INTO timesheets (employee_id, employee_name, company_id, start_date, end_date, daily_hours, total_hours, vendor_name, notes, file_name, file_path, status) VALUES (@employee_id, @employee_name, @company_id, @start_date, @end_date, @daily_hours, @total_hours, @vendor_name, @notes, @file_name, @file_path, @status)`).run({ ...data, daily_hours: JSON.stringify(entries) });
    row = db.prepare('SELECT * FROM timesheets WHERE id = ?').get(result.lastInsertRowid);
  }
  logAudit({ userId: employee_id, userName: req.user.email, userRole: 'employee', action: 'TIMESHEET_SUBMITTED', entityType: 'timesheet', entityId: row._id || row.id, details: `${data.start_date} to ${data.end_date}: ${total} hours (${req.companyId})`, ipAddress: req.ip });
  notifyEmployee(employee_id, req.companyId, 'Timesheet submitted', `Your timesheet for ${data.start_date} to ${data.end_date} has been submitted for review.`, 'info');
  res.status(201).json({ message: 'Timesheet submitted for review.', timesheet: normalize(row) });
}));
function filtered(rows, req, self) {
  const { status, startDate, endDate, search = '' } = req.query;
  return rows.filter(row => (!self || row.employee_id === req.user.employeeId) && (!status || status === 'ALL' || row.status === status) && (!startDate || row.end_date >= startDate) && (!endDate || row.start_date <= endDate) && `${row.employee_id} ${row.employee_name} ${row.vendor_name}`.toLowerCase().includes(search.toLowerCase()));
}
export const getMyTimesheets = handle(async (req, res) => res.json({ timesheets: filtered(await timesheetRows(), req, true) }));
export const getAllTimesheets = handle(async (req, res) => res.json({ timesheets: filtered(await timesheetRows(), req, false) }));
export const reviewTimesheet = handle(async (req, res) => {
  const { status, adminFeedback } = req.body;
  if (!['Approved', 'Rejected', 'Needs Correction', 'Pending'].includes(status)) throw accessError('Invalid review status.', 400);
  const row = await find(req.params.id);
  if (!row) throw accessError('Timesheet not found.', 404);
  await withEmployeeLock(row.employee_id, async () => {
  const current = await find(req.params.id);
  if (['Approved', 'Pending'].includes(status)) {
    const company = current.company_id || req.companyScope.legacyCompanyFor(current.employee_id);
    const overlap = (await timesheetRows()).some(other => other.id !== String(current._id || current.id) && other.employee_id === current.employee_id && (other.company_id || req.companyScope.legacyCompanyFor(other.employee_id)) === company && ['Approved', 'Pending'].includes(other.status) && other.start_date <= current.end_date && other.end_date >= current.start_date);
    if (overlap) throw accessError('Another active timesheet covers this period. Reject or correct that timesheet before changing this one.', 409);
  }
  const change = { status, admin_feedback: String(adminFeedback || '').trim(), reviewed_at: new Date().toISOString(), reviewed_by: req.user.email };
  if (row._id) await MongoTimesheet.updateOne({ _id: row._id }, { $set: change });
  else db.prepare('UPDATE timesheets SET status=@status, admin_feedback=@admin_feedback, reviewed_at=@reviewed_at, reviewed_by=@reviewed_by WHERE id=@id').run({ ...change, id: row.id });
  logAudit({ userId: req.user.employeeId, userName: req.user.email, userRole: 'admin', action: 'TIMESHEET_REVIEWED', entityType: 'timesheet', entityId: req.params.id, details: status, ipAddress: req.ip });
  notifyEmployee(row.employee_id, row.company_id || req.companyScope.legacyCompanyFor(row.employee_id), `Timesheet ${status}`, `${row.start_date} to ${row.end_date}: ${status}. ${change.admin_feedback}`, status === 'Approved' ? 'success' : 'warning');
  res.json({ message: `Timesheet ${status.toLowerCase()}.`, timesheet: normalize({ ...current, ...change }) });
  });
});
export const getMonthlyHours = handle(async (req, res) => {
  const month = req.query.month;
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month || '')) throw accessError('Select a payroll month.', 400);
  const rows = (await timesheetRows()).filter(row => req.companyScope.allowsRecord(row) && row.status === 'Approved' && (!req.query.employeeId || row.employee_id === req.query.employeeId));
  const summary = new Map();
  for (const row of rows) {
    const key = `${row.employee_id}:${row.company_id || ''}`;
    const value = summary.get(key) || { employee_id: row.employee_id, employee_name: row.employee_name, company_id: row.company_id, month, hours: 0, unallocated_timesheets: 0 };
    const entries = decodeDailyHours(row);
    value.hours += monthlyHours(entries)[month] || 0;
    if (!entries.length && row.start_date.slice(0, 7) <= month && row.end_date.slice(0, 7) >= month) value.unallocated_timesheets++;
    summary.set(key, value);
  }
  res.json({ month, employees: [...summary.values()].filter(row => row.hours > 0 || row.unallocated_timesheets > 0).map(row => ({ ...row, hours: Math.round(row.hours * 100) / 100 })) });
});
export const downloadTimesheetFile = handle(async (req, res) => {
  const row = await find(req.params.id);
  if (!row) throw accessError('Timesheet not found.', 404);
  if (req.user.role !== 'admin' && row.employee_id !== req.user.employeeId) throw accessError('Access denied.');
  if (row.file_path) {
    const bytes = await readPrivateFile(row.file_path);
    if (bytes) return res.attachment(row.file_name).send(bytes);
    const file = path.resolve(TIMESHEET_DIR, path.basename(row.file_path));
    if (fs.existsSync(file)) return res.download(file, row.file_name);
  }
  const safe = value => `"${String(value ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`;
  const entries = decodeDailyHours(row);
  const lines = entries.length ? [['Date', 'Hours', 'Month'], ...entries.map(entry => [entry.date, entry.hours, entry.date.slice(0, 7)])] : [['Period start', 'Period end', 'Total hours', 'Daily allocation'], [row.start_date, row.end_date, row.total_hours, 'Unavailable for legacy timesheet']];
  res.type('text/csv').attachment(`timesheet-${row.employee_id}-${row.start_date}.csv`).send(lines.map(line => line.map(safe).join(',')).join('\r\n'));
});

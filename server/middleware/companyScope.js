import mongoose from 'mongoose';
import { db } from '../db/schema.js';
import { isMongoConnected } from '../db/mongo.js';
import { Employee, Timesheet, Document, VendorDetail, PayrollEntry } from '../models/index.js';
import { accessStore, getAdminAccess, buildCompanyScope, accessError } from '../services/companyAccessStore.js';
import { COMPANIES, companyName } from '../../client/src/utils/companyCatalog.js';

export function filterCompanyResponse(path, payload, scope) {
  if (!payload || payload.error) return payload;
  const filter = rows => (rows || []).filter(row => scope.allows(row.employee_id));
  const decorate = row => ({ ...row, company_id: scope.companyFor(row.employee_id), company_name: companyName(scope.companyFor(row.employee_id)) });
  if (path === '/admin/employees') {
    if (!Array.isArray(payload.employees)) return payload;
    const employees = filter(payload.employees).map(decorate);
    const active = employees.filter(row => row.employment_status !== 'Inactive').length;
    return { employees, total: employees.length, counts: { all: employees.length, active, inactive: employees.length - active } };
  }
  if (path === '/admin/timesheets') return { timesheets: filter(payload.timesheets) };
  if (path === '/admin/vendors') return { vendors: filter(payload.vendors) };
  if (path === '/admin/employee-invoices') return { invoices: filter(payload.invoices) };
  if (path === '/admin/payroll' || path === '/admin/payroll-entries') {
    const billing = path.endsWith('payroll-entries');
    const rows = filter(billing ? payload.entries : payload.payrollRecords);
    const summary = { inrGross: 0, usdGross: 0, inrNet: 0, usdNet: 0, inrHours: 0, usdHours: 0, inrCount: 0, usdCount: 0, totalHours: 0, totalEntries: rows.length, totalRecords: rows.length };
    for (const row of rows) {
      const key = row.currency === 'INR' || (!row.currency && row.country === 'India') ? 'inr' : 'usd';
      summary[`${key}Gross`] += Number((billing ? row.gross_amount : row.gross_pay) || 0);
      summary[`${key}Net`] += Number(row.net_pay || 0);
      summary[`${key}Hours`] += Number(row.total_hours || 0);
      summary[`${key}Count`]++;
      summary.totalHours += Number(row.total_hours || 0);
    }
    return { [billing ? 'entries' : 'payrollRecords']: rows, summary };
  }
  if (payload.employee?.employee_id) return { ...payload, employee: decorate(payload.employee) };
  return payload;
}

async function mergedRows(table, Model) {
  const rows = db.prepare(`SELECT * FROM ${table}`).all();
  if (!isMongoConnected()) return rows;
  const cloud = await Model.find({}).lean();
  const map = new Map(rows.map(row => [table === 'employees' ? row.employee_id : `${row.employee_id}:${row.file_path || row.start_date}:${row.end_date || row.document_type}`, row]));
  for (const row of cloud) map.set(table === 'employees' ? row.employee_id : `${row.employee_id}:${row.file_path || row.start_date}:${row.end_date || row.document_type}`, row);
  return [...map.values()];
}

async function scopedDashboard(scope) {
  const [allEmployees, allTimesheets, allDocuments] = await Promise.all([mergedRows('employees', Employee), mergedRows('timesheets', Timesheet), mergedRows('documents', Document)]);
  const employees = allEmployees.filter(row => scope.allows(row.employee_id) && !row.employee_id.startsWith('ADMIN'));
  const timesheets = allTimesheets.filter(row => scope.allows(row.employee_id));
  const documents = allDocuments.filter(row => scope.allows(row.employee_id));
  const count = (rows, key, value) => rows.filter(row => row[key] === value).length;
  const recent = rows => [...rows].sort((a, b) => String(b.submitted_at || b.created_at).localeCompare(String(a.submitted_at || a.created_at))).slice(0, 5);
  return {
    stats: { totalEmployees: employees.length, pendingRegistrations: count(employees, 'registration_status', 'Pending Review'), approvedEmployees: count(employees, 'registration_status', 'Approved'), pendingTimesheets: count(timesheets, 'status', 'Pending'), approvedTimesheets: count(timesheets, 'status', 'Approved'), pendingDocuments: documents.filter(row => ['Uploaded', 'Pending Review'].includes(row.status)).length },
    recentEmployees: recent(employees), recentTimesheets: recent(timesheets).map(row => ({ ...row, full_name: employees.find(employee => employee.employee_id === row.employee_id)?.full_name || row.employee_id }))
  };
}

async function recordOwner(kind, id) {
  if (kind === 'employee-invoices') {
    if (isMongoConnected()) return (await mongoose.models.EmployeeInvoice.findOne({ id }).lean())?.employee_id;
    const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='employee_invoices'").get();
    return exists ? db.prepare('SELECT employee_id FROM employee_invoices WHERE id = ?').get(id)?.employee_id : undefined;
  }
  const tables = { vendors: ['vendor_details', VendorDetail], 'payroll-entries': ['payroll_entries', PayrollEntry], documents: ['documents', Document], timesheets: ['timesheets', Timesheet] };
  const [table, Model] = tables[kind];
  // Document and timesheet review/download controllers use SQLite identifiers.
  if (['vendors', 'payroll-entries'].includes(kind) && /^[a-f\d]{24}$/i.test(id) && isMongoConnected()) return (await Model.findById(id).lean())?.employee_id;
  return db.prepare(`SELECT employee_id FROM ${table} WHERE id = ?`).get(id)?.employee_id;
}

export function createCompanyGuard({ store = accessStore, owner = recordOwner, dashboard = scopedDashboard } = {}) {
  return async function companyGuard(req, res, next) {
    try {
      const path = req.path.replace(/\/$/, '') || '/';
      if (/^\/admin(?:\/|$)/i.test(path) && !path.startsWith('/admin/')) throw accessError('Invalid admin route.', 404);
      if (req.user.role !== 'admin') {
        if (path.startsWith('/admin')) return res.status(403).json({ error: 'Administrator access required.' });
        return next();
      }
      const access = await getAdminAccess(req.user, store);
      req.user.isSuperAdmin = access.isSuperAdmin;
      req.user.companyIds = access.companyIds;
      req.user.adminName = access.name;
      const scope = buildCompanyScope(access, await store.list('assignment:'), req.headers['x-company-id'] || 'all');
      req.companyScope = scope;
      if (path === '/admin/company-context') return res.json({ isSuperAdmin: access.isSuperAdmin, companies: COMPANIES.filter(company => access.companyIds.includes(company.id)), selectedCompany: scope.selection });
      if (path.startsWith('/admin/access') || ['/admin/settings', '/admin/audit-logs'].includes(path)) {
        if (!access.isSuperAdmin) throw accessError('Only the super admin can manage administrators, company assignments, system settings, or audit logs.');
        return next();
      }
      if (path === '/admin/dashboard') return res.json(await dashboard(scope));
      const employeeRoute = path.match(/^\/admin\/(?:employees|payroll\/compensation-ledger|payroll\/compensation)\/([^/]+)(?:\/(?:status|employment-status))?$/);
      const recordRoute = path.match(/^\/admin\/(vendors|payroll-entries|employee-invoices|documents|timesheets)\/([^/]+)(?:\/review)?$/)
        || path.match(/^\/(documents)\/stream\/([^/]+)$/)
        || path.match(/^\/(timesheets)\/download\/([^/]+)$/);
      const targets = [];
      if (employeeRoute) targets.push(decodeURIComponent(employeeRoute[1]));
      if (recordRoute) {
        const employeeId = await owner(recordRoute[1], decodeURIComponent(recordRoute[2]));
        if (!employeeId) throw accessError('Record not found.', 404);
        targets.push(employeeId);
      }
      for (const source of [req.body, req.query]) for (const field of ['employee_id', 'employeeId']) if (source?.[field] != null) targets.push(source[field]);
      for (const employeeId of targets) if (!scope.allows(employeeId)) throw accessError('You do not have access to this employee.');
      if (path === '/admin/employees' && req.method === 'POST') {
        const companyId = req.body?.companyId || (scope.selection !== 'all' && scope.selection !== 'unassigned' ? scope.selection : null);
        if (!access.isSuperAdmin && !companyId) throw accessError('Select a company before creating an employee.', 400);
        if (companyId && (!access.companyIds.includes(companyId) || (scope.selection !== 'all' && scope.selection !== companyId))) throw accessError('You cannot create an employee in this company.');
        req.newEmployeeCompanyId = companyId;
      }
      // Routes are deliberately allowlisted; a future admin endpoint must declare its scope.
      const lists = ['/admin/employees', '/admin/vendors', '/admin/timesheets', '/admin/payroll', '/admin/payroll-entries', '/admin/employee-invoices'];
      if (path.startsWith('/admin/') && !lists.includes(path) && !employeeRoute && !recordRoute && path !== '/admin/payroll/disburse-monthly') throw accessError('This admin endpoint has no company access policy.');
      const original = res.json.bind(res);
      res.json = payload => original(req.method === 'GET' ? filterCompanyResponse(path, payload, scope) : payload);
      return next();
    } catch (error) { return res.status(error.status || 503).json({ error: error.status ? error.message : 'Unable to verify company access. Please try again.' }); }
  };
}
export const companyGuard = createCompanyGuard();

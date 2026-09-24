import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import express from 'express';
import { createAccessStore, buildCompanyScope, getAdminAccess, ROOT_ADMIN_ID } from './services/companyAccessStore.js';
import { createCompanyGuard, filterCompanyResponse } from './middleware/companyScope.js';
import { validateGrant, createCompanyAccessHandlers } from './controllers/companyAccessController.js';
import bcrypt from 'bcryptjs';
import { createUploadReceipt, verifyUploadReceipt } from './services/uploadReceipt.js';
import { COMPANIES } from '../client/src/utils/companyCatalog.js';

const [a, b, c, d, e] = COMPANIES.map(company => company.id);
const assignments = [a, b, c, d, e].map((companyId, i) => ({ employeeId: `EMP-${i + 1}`, companyId }));
const restricted = { enabled: true, isSuperAdmin: false, companyIds: [b, c, d] };
const scope = buildCompanyScope(restricted, assignments);

test('company access supports both disjoint admin groups and a protected root', async () => {
  for (const [index, company] of COMPANIES.entries()) assert.equal(scope.allows(`EMP-${index + 1}`), [b, c, d].includes(company.id));
  assert.equal(scope.allows('UNASSIGNED'), false);
  const second = buildCompanyScope({ ...restricted, companyIds: [a, e] }, assignments);
  assert.equal(second.allows('EMP-1'), true); assert.equal(second.allows('EMP-2'), false); assert.equal(second.allows('EMP-5'), true);
  const root = await getAdminAccess({ employeeId: ROOT_ADMIN_ID, role: 'admin' }, { get: async () => ({ enabled: false, companyIds: [] }) });
  assert.equal(root.isSuperAdmin, true); assert.equal(root.companyIds.length, 5);
  assert.equal(buildCompanyScope(root, assignments).allows('UNASSIGNED'), true);
  assert.equal(buildCompanyScope(root, assignments, 'unassigned').allows('EMP-1'), false);
  assert.equal(buildCompanyScope(root, assignments, 'unassigned').allows('UNASSIGNED'), true);
});

test('unknown, forged, unassigned and revoked selections fail closed', () => {
  for (const value of [a, 'unassigned', 'not-a-company', [b]]) assert.throws(() => buildCompanyScope(restricted, assignments, value));
  assert.throws(() => buildCompanyScope({ ...restricted, enabled: false }, assignments));
  assert.equal(buildCompanyScope(restricted, assignments, b).allows('EMP-3'), false);
  assert.throws(() => validateGrant({ enabled: true, companyIds: ['unknown'] }));
  assert.throws(() => validateGrant({ enabled: 'true', companyIds: [a] }));
});

test('SQLite access persists; configured cloud outages never fall back to local grants', async () => {
  const database = new Database(':memory:');
  const options = { database, connected: () => false, configured: () => false };
  const store = createAccessStore(options);
  await store.set('grant:ADMIN-TEST', { enabled: true, companyIds: [a] });
  await store.set('assignment:EMP-1', assignments[0]);
  assert.equal((await createAccessStore(options).get('grant:ADMIN-TEST')).enabled, true);
  assert.equal((await store.list('assignment:')).length, 1);
  const unavailable = createAccessStore({ ...options, configured: () => true });
  await assert.rejects(unavailable.get('grant:ADMIN-TEST'), { status: 503 });
  await assert.rejects(unavailable.set('grant:ADMIN-TEST', {}), { status: 503 });
  database.close();
});

test('lists and currency summaries contain only authorized employees', () => {
  const employees = assignments.map(row => ({ employee_id: row.employeeId, employment_status: 'Active' }));
  const response = filterCompanyResponse('/admin/employees', { employees, counts: { all: 999 } }, scope);
  assert.deepEqual(response.employees.map(row => row.employee_id), ['EMP-2', 'EMP-3', 'EMP-4']);
  assert.equal(response.counts.all, 3); assert.equal(response.employees[0].company_id, b);
  for (const [path, key] of [['/admin/timesheets', 'timesheets'], ['/admin/vendors', 'vendors'], ['/admin/employee-invoices', 'invoices']]) assert.equal(filterCompanyResponse(path, { [key]: employees }, scope)[key].length, 3);
  const result = filterCompanyResponse('/admin/payroll-entries', { entries: [{ employee_id: 'EMP-1', gross_amount: 10000, currency: 'USD' }, { employee_id: 'EMP-2', gross_amount: 80, total_hours: 2, currency: 'INR' }, { employee_id: 'EMP-3', gross_amount: 90, total_hours: 3, currency: 'USD' }], summary: { usdGross: 10090 } }, scope);
  assert.equal(result.summary.usdGross, 90); assert.equal(result.summary.inrGross, 80); assert.equal(result.summary.totalHours, 5);
});

test('HTTP guard blocks cross-company reads, edits, downloads, exports and privilege escalation', async t => {
  const records = new Map([['grant:ADMIN-TEST', restricted]]);
  const store = { get: async key => records.get(key), list: async () => assignments };
  const app = express(); app.enable('case sensitive routing'); app.use(express.json());
  app.use((req, res, next) => { req.user = { role: req.headers['x-role'] || 'admin', employeeId: req.headers['x-user'] || 'ADMIN-TEST' }; next(); });
  app.use(createCompanyGuard({ store, owner: async (kind, id) => id === 'allowed' ? 'EMP-2' : id === 'missing' ? null : 'EMP-1', dashboard: async s => ({ employees: assignments.filter(row => s.allows(row.employeeId)) }) }));
  app.use((req, res) => res.json({ employees: assignments.map(row => ({ employee_id: row.employeeId })), assignedCompany: req.newEmployeeCompanyId }));
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = (path, method = 'GET', body, headers = {}) => fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...headers }, ...(body ? { body: JSON.stringify(body) } : {}) });
  for (const path of ['/admin/employees/EMP-1', '/admin/payroll/compensation-ledger/EMP-1', '/admin/employee-invoices?employee_id=EMP-1', '/documents/stream/blocked', '/timesheets/download/blocked', '/admin/settings', '/admin/audit-logs', '/admin/access/admins', '/admin/access/assignments', '/admin/new-unscoped-endpoint']) assert.equal((await call(path)).status, 403, path);
  for (const path of ['/admin/vendors/blocked', '/admin/payroll-entries/blocked', '/admin/employee-invoices/blocked', '/admin/documents/blocked/review', '/admin/timesheets/blocked/review', '/admin/employees/EMP-1/status']) assert.equal((await call(path, 'PUT', { employee_id: 'EMP-2' })).status, 403, path);
  assert.equal((await call('/admin/vendors/allowed', 'PUT', { employee_id: 'EMP-1' })).status, 403);
  assert.equal((await call('/admin/payroll', 'POST', { employeeId: 'EMP-1' })).status, 403);
  assert.equal((await call('/admin/employees/EMP-2')).status, 200);
  assert.equal((await call('/documents/stream/allowed')).status, 200);
  assert.equal((await call('/documents/stream/missing')).status, 404);
  assert.equal((await call('/admin/employees', 'GET', null, { 'X-Company-Id': a })).status, 403);
  const list = await (await call('/admin/employees')).json(); assert.equal(list.employees.length, 3);
  const filtered = await (await call('/admin/employees', 'GET', null, { 'X-Company-Id': b })).json(); assert.equal(filtered.employees.length, 1);
  assert.equal((await call('/admin/employees', 'POST', { companyId: a })).status, 403);
  assert.equal((await call('/admin/employees', 'POST', {})).status, 400);
  assert.equal((await (await call('/admin/employees', 'POST', { companyId: b })).json()).assignedCompany, b);
  assert.equal((await call('/admin/employees', 'GET', null, { 'X-Role': 'employee' })).status, 403);
  assert.equal((await call('/admin/access/admins', 'GET', null, { 'X-User': ROOT_ADMIN_ID })).status, 200);
  records.set('grant:ADMIN-TEST', { ...restricted, companyIds: [c] });
  assert.equal((await call('/admin/employees/EMP-2')).status, 403);
  records.set('grant:ADMIN-TEST', { ...restricted, enabled: false });
  assert.equal((await call('/admin/employees')).status, 403);
});

test('registration cannot attach another document by changing the uploaded file path', () => {
  const doc = { filePath: 'temporary-unique.pdf', documentType: 'passport' };
  const uploadToken = createUploadReceipt(doc);
  assert.doesNotThrow(() => verifyUploadReceipt({ ...doc, uploadToken }));
  assert.throws(() => verifyUploadReceipt({ ...doc, filePath: 'other-employee.pdf', uploadToken }));
  assert.throws(() => verifyUploadReceipt({ ...doc, documentType: 'w4', uploadToken }));
  assert.throws(() => verifyUploadReceipt(doc));
});

test('super admin can create, grant, revoke and assign with durable audit records; root cannot be disabled', async () => {
  const database = new Database(':memory:');
  database.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, employee_id TEXT UNIQUE, email TEXT UNIQUE, password_hash TEXT, role TEXT, status TEXT); CREATE TABLE employees (employee_id TEXT, full_name TEXT, email TEXT, designation TEXT, country TEXT);");
  database.prepare('INSERT INTO users (employee_id,email,role,status) VALUES (?,?,?,?)').run(ROOT_ADMIN_ID, 'root@example.test', 'admin', 'active');
  database.prepare('INSERT INTO employees VALUES (?,?,?,?,?)').run('EMP-1', 'Example Employee', 'employee@example.test', 'Consultant', 'India');
  const store = createAccessStore({ database, configured: () => false, connected: () => false });
  const handlers = createCompanyAccessHandlers({ database, store, mongoConnected: () => false });
  const invoke = async (handler, body = {}, params = {}, root = true) => {
    const result = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    await handler({ user: { isSuperAdmin: root, employeeId: ROOT_ADMIN_ID, email: 'root@example.test' }, body, params }, result); return result;
  };
  const created = await invoke(handlers.createAdmin, { name: 'Regional Admin', email: 'regional@example.test', password: 'Test-only-Secret-2026!', companyIds: [b, c, d], enabled: true });
  assert.equal(created.code, 201);
  const employeeId = created.data.employeeId;
  const saved = database.prepare('SELECT * FROM users WHERE employee_id=?').get(employeeId);
  assert.equal(saved.role, 'admin'); assert.equal(await bcrypt.compare('Test-only-Secret-2026!', saved.password_hash), true);
  const listed = await invoke(handlers.listAdmins); assert.equal(listed.data.admins.length, 2); assert.equal(JSON.stringify(listed.data).includes(saved.password_hash), false);
  assert.equal((await invoke(handlers.updateAdmin, { companyIds: [a, e], enabled: true }, { employeeId })).code, 200);
  assert.deepEqual((await getAdminAccess({ role: 'admin', employeeId }, store)).companyIds, [a, e]);
  assert.equal((await invoke(handlers.updateAdmin, { companyIds: [], enabled: false }, { employeeId: ROOT_ADMIN_ID })).code, 409);
  assert.equal((await invoke(handlers.updateAdmin, { companyIds: [a], enabled: true }, { employeeId }, false)).code, 403);
  assert.equal((await invoke(handlers.assignEmployees, { employeeIds: ['EMP-1'], companyId: a })).code, 200);
  assert.equal((await invoke(handlers.listAssignments)).data.employees[0].company_id, a);
  assert.equal((await invoke(handlers.assignEmployees, { employeeIds: ['EMP-1', 'missing'], companyId: b })).code, 404);
  assert.equal((await store.get('assignment:EMP-1')).companyId, a);
  assert.equal((await invoke(handlers.updateAdmin, { companyIds: [], enabled: false }, { employeeId })).code, 200);
  assert.equal((await getAdminAccess({ role: 'admin', employeeId }, store)).enabled, false);
  assert.equal((await invoke(handlers.accessAudit)).data.events.length, 4);
  database.close();
});

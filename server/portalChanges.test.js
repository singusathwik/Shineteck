import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { datesInPeriod, validateDailyHours, monthlyHours, decodeDailyHours } from '../client/src/utils/dailyHours.js';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shineteck-portal-test-'));
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = '';
process.env.SHINETECK_DB_PATH = path.join(directory, 'test.db');
process.env.SHINETECK_UPLOAD_DIR = path.join(directory, 'uploads');
const { db, initSchema } = await import('./db/schema.js');
initSchema();
const { app } = await import('./server.js');
const { JWT_SECRET } = await import('./middleware/auth.js');
const { accessStore, getCompanies, buildCompanyScope, getAdminAccess } = await import('./services/companyAccessStore.js');
const { createInvitation, readInvitation, invitationKey, sendInvitationEmail } = await import('./services/invitations.js');
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
const [A, B] = (await getCompanies()).map(c => c.id);
const password = 'Only-for-isolated-tests-2026';
function account(employeeId, role) {
  const email = `${employeeId.toLowerCase()}@example.test`;
  const result = db.prepare('INSERT INTO users (employee_id,email,password_hash,role,status) VALUES (?,?,?,?,?)').run(employeeId, email, bcrypt.hashSync(password, 4), role, 'active');
  if (role === 'employee') db.prepare('INSERT INTO employees (employee_id,full_name,email,country,state,city,zip_code,address,phone,designation,date_of_birth) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(employeeId, employeeId, email, 'United States', 'California', 'Los Angeles', '90001', 'Test address', '5551234567', 'Engineer', '1995-01-01');
  return jwt.sign({ id: Number(result.lastInsertRowid), employeeId, email, role }, JWT_SECRET);
}
const root = account('ADMIN-001', 'admin'), adminA = account('ADMIN-A', 'admin'), adminB = account('ADMIN-B', 'admin'), employee = account('EMP-MULTI', 'employee');
await accessStore.set('grant:ADMIN-A', { enabled: true, companyIds: [A] });
await accessStore.set('grant:ADMIN-B', { enabled: true, companyIds: [B] });
await accessStore.set('assignment:EMP-MULTI', { employeeId: 'EMP-MULTI', companyIds: [A, B], legacyCompanyId: A });
async function call(route, { token = root, method = 'GET', body, company = 'all' } = {}) {
  const headers = { Authorization: `Bearer ${token}`, 'X-Company-Id': company };
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(base + route, { method, headers, body: body ? body instanceof FormData ? body : JSON.stringify(body) : undefined });
  const data = response.headers.get('content-type')?.includes('json') ? await response.json() : await response.text();
  return { status: response.status, data };
}
after(() => { server.closeAllConnections(); server.close(); db.close(); if (path.dirname(directory) === os.tmpdir() && path.basename(directory).startsWith('shineteck-portal-test-')) fs.rmSync(directory, { recursive: true, force: true }); });

test('inclusive daily dates and monthly allocation handle month boundaries and leap years', () => {
  assert.equal(datesInPeriod('2026-01-01', '2026-01-08').length, 8);
  const dates = datesInPeriod('2024-02-28', '2024-03-02');
  const entries = validateDailyHours(dates[0], dates.at(-1), dates.map((date, i) => ({ date, hours: [8, 7.25, 6.5, 0][i] })));
  assert.deepEqual(monthlyHours(entries), { '2024-02': 15.25, '2024-03': 6.5 });
  for (const bad of ['2026-02-29', '2026-13-01', 'garbage']) assert.throws(() => datesInPeriod(bad, '2026-03-01'));
  assert.throws(() => datesInPeriod('2026-03-01', '2026-02-01'));
  for (const hours of ['', '   ', '0x10', null, -1, 25, 'NaN', 1.001, true]) assert.throws(() => validateDailyHours('2026-01-01', '2026-01-01', [{ date: '2026-01-01', hours }]));
  assert.throws(() => validateDailyHours('2026-01-01', '2026-01-02', [{ date: '2026-01-01', hours: 8 }, { date: '2026-01-01', hours: 8 }]));
});

test('company catalog can add/disable without deleting records and restrictions update immediately', async () => {
  assert.equal((await call('/admin/access/companies', { token: adminA })).status, 403);
  const created = await call('/admin/access/companies', { method: 'POST', body: { name: 'Temporary test company' } });
  assert.equal(created.status, 200);
  assert.equal(created.data.companies.length, 6);
  const denied = await call(`/admin/access/companies/${A}`, { method: 'PUT', body: { enabled: false } });
  assert.equal(denied.status, 200);
  assert.equal((await call('/timesheets/my', { token: employee, company: A })).status, 403);
  assert.equal((await call('/admin/employees', { token: adminA, company: A })).status, 403);
  assert.ok(db.prepare('SELECT employee_id FROM employees WHERE employee_id=?').get('EMP-MULTI'));
  await call(`/admin/access/companies/${A}`, { method: 'PUT', body: { enabled: true } });
});

test('timesheet submission, cross-month totals, review and download honor record company', async () => {
  const body = { startDate: '2026-01-30', endDate: '2026-02-02', dailyHours: [{ date: '2026-01-30', hours: 8 }, { date: '2026-01-31', hours: 4.5 }, { date: '2026-02-01', hours: 0 }, { date: '2026-02-02', hours: 7.25 }], totalHours: 9999, vendorName: 'Test vendor' };
  const saved = await call('/timesheets/submit', { token: employee, method: 'POST', company: A, body });
  assert.equal(saved.status, 201, JSON.stringify(saved.data));
  assert.equal(saved.data.timesheet.total_hours, 19.75);
  const id = saved.data.timesheet.id;
  assert.equal((await call(`/admin/timesheets/${id}/review`, { token: adminB, method: 'PATCH', body: { status: 'Approved' } })).status, 403);
  assert.equal((await call(`/timesheets/download/${id}`, { token: employee, company: B })).status, 403);
  assert.equal((await call('/admin/timesheets', { token: adminB })).data.timesheets.length, 0);
  assert.deepEqual((await call('/admin/timesheet-hours?month=2026-01', { token: adminA })).data.employees, [], 'Pending timesheets are excluded from payroll');
  assert.equal((await call(`/admin/timesheets/${id}/review`, { token: adminA, method: 'PATCH', body: { status: 'Approved' } })).status, 200);
  const hours = await call('/admin/timesheet-hours?month=2026-02', { token: adminA });
  assert.equal(hours.data.employees[0].hours, 7.25);
  const january = await call('/admin/timesheet-hours?month=2026-01', { token: adminA });
  assert.equal(january.data.employees[0].hours, 12.5);
  assert.equal(january.data.employees[0].hours + hours.data.employees[0].hours, saved.data.timesheet.total_hours);
  assert.deepEqual((await call('/admin/timesheet-hours?month=2026-03', { token: adminA })).data.employees, []);
  const csv = await call(`/timesheets/download/${id}`, { token: employee, company: A });
  assert.equal(csv.status, 200); assert.match(csv.data, /2026-01-31/);
  assert.equal((await call('/timesheets/submit', { token: employee, method: 'POST', company: A, body })).status, 409);
});

test('documents persist expiry/company, isolate uploads and stream private data', async () => {
  const upload = new FormData(); upload.append('documentType', 'passport'); upload.append('expiryDate', '2030-06-30'); upload.append('document', new Blob(['test document only'], { type: 'application/pdf' }), 'test.pdf');
  const result = await call('/documents/upload', { token: employee, method: 'POST', company: A, body: upload });
  assert.equal(result.status, 201, JSON.stringify(result.data));
  const id = result.data.document.id;
  assert.equal(result.data.document.expiry_date, '2030-06-30');
  assert.equal((await call('/documents', { token: employee, company: B })).data.documents.length, 0);
  assert.equal((await call(`/documents/stream/${id}`, { token: adminB })).status, 403);
  assert.equal((await call(`/documents/stream/${id}`, { token: adminA })).data, 'test document only');
  const row = db.prepare('SELECT * FROM documents WHERE id=?').get(id);
  fs.unlinkSync(path.join(process.env.SHINETECK_UPLOAD_DIR, 'private/documents', row.file_path));
  assert.equal((await call(`/documents/stream/${id}`, { token: employee, company: A })).data, 'test document only');
});

test('vendor visas, PO dates, company ownership and private contract files work', async () => {
  const body = { employee_id: 'EMP-MULTI', employee_name: 'Test Employee', company_id: A, vendor_name: 'Test vendor', client_name: 'Test client', visa_type: 'CPT', hourly_bill_rate: 70, employee_rate: 50, tax_percent: 0, po_start_date: '2026-01-01', po_end_date: '2026-12-31' };
  const saved = await call('/admin/vendors', { token: adminA, method: 'POST', body });
  assert.equal(saved.status, 201, JSON.stringify(saved.data));
  assert.equal(saved.data.vendor.visa_type, 'CPT');
  assert.equal((await call('/admin/vendors', { token: adminB })).data.vendors.length, 0);
  assert.equal((await call('/admin/vendors', { token: adminA, method: 'POST', body: { ...body, po_end_date: '2025-12-31' } })).status, 400);
  const id = saved.data.vendor.id;
  const form = new FormData(); form.append('document', new Blob(['MSA test'], { type: 'application/pdf' }), 'msa.pdf');
  assert.equal((await call(`/admin/vendors/${id}/files/msa`, { token: adminA, method: 'POST', body: form })).status, 200);
  assert.equal((await call(`/admin/vendors/${id}/files/msa`, { token: adminB })).status, 403);
  assert.equal((await call(`/admin/vendors/${id}/files/msa`, { token: adminA })).data, 'MSA test');
});

test('expense records are separated by company and regional currency', async () => {
  const body = { company_id: A, region: 'India', date: '2026-09-29', payee: 'Test payee', category: 'Office', amount: '250.50', status: 'Paid' };
  const saved = await call('/admin/expenses', { token: adminA, method: 'POST', body });
  assert.equal(saved.status, 201); assert.equal(saved.data.expense.currency, 'INR');
  assert.equal((await call('/admin/expenses?region=India', { token: adminB })).data.expenses.length, 0);
  assert.equal((await call('/admin/expenses', { token: adminB, method: 'POST', body: { ...body, id: saved.data.expense.id, company_id: B } })).status, 404);
});

test('invitations reject forged grants, expired/revoked access, replay and sender failures', async () => {
  const actor = { role: 'admin', employeeId: 'ADMIN-001', email: 'admin-001@example.test', ...(await getAdminAccess({ role: 'admin', employeeId: 'ADMIN-001' })) };
  let sent;
  const body = { firstName: 'Invited', lastName: 'Employee', email: 'invited@example.test', role: 'employee', companyIds: [A, B] };
  await createInvitation(body, actor, { send: async message => { sent = message; } });
  assert.deepEqual((await readInvitation(sent.token)).companyIds, [A, B]);
  assert.equal((await accessStore.get(invitationKey(sent.token))).token, undefined);
  await assert.rejects(createInvitation({ ...body, role: 'admin' }, { ...actor, employeeId: 'ADMIN-A', isSuperAdmin: false, companyIds: [A] }, { send: async () => {} }), { status: 403 });
  await assert.rejects(createInvitation(body, { ...actor, employeeId: 'ADMIN-A', isSuperAdmin: false, companyIds: [A] }, { send: async () => {} }), { status: 403 });
  let failedToken;
  await assert.rejects(createInvitation({ ...body, email: 'failed@example.test' }, actor, { send: async message => { failedToken = message.token; throw new Error('Simulated sender outage'); } }));
  await assert.rejects(readInvitation(failedToken), { status: 410 });
  const forgedRegistration = await call('/auth/register', { method: 'POST', body: { invitationToken: sent.token, email: body.email, companyId: 'forged-company', companyIds: ['forged-company'] } });
  assert.equal(forgedRegistration.status, 400);
  assert.deepEqual((await readInvitation(sent.token)).companyIds, [A, B]);
  const register = await call('/auth/register', { method: 'POST', body: { invitationToken: sent.token, companyId: A, firstName: 'Invited', lastName: 'Employee', email: body.email, phone: '5551234567', password, confirmPassword: password, designation: 'Engineer', dateOfBirth: '1995-01-01', country: 'United States', state: 'California', city: 'Los Angeles', zipCode: '90001', address: 'Test address' } });
  assert.equal(register.status, 201, JSON.stringify(register.data));
  assert.deepEqual((await accessStore.get(`assignment:${register.data.user.employeeId}`)).companyIds, [A, B]);
  await assert.rejects(readInvitation(sent.token), { status: 410 });
  const auth = await call('/auth/login', { method: 'POST', body: { identifier: body.email, password } });
  assert.equal(auth.status, 200);
  const context = await call('/employee/company-context', { token: auth.data.token });
  assert.deepEqual(context.data.companies.map(c => c.id), [A, B]);
});

test('legacy ownership is preserved when an employee gains or loses companies', () => {
  const scope = buildCompanyScope({ enabled: true, isSuperAdmin: false, companyIds: [B] }, [{ employeeId: 'EMP', companyIds: [B], legacyCompanyId: A }]);
  assert.equal(scope.allows('EMP'), true);
  assert.equal(scope.allowsRecord({ employee_id: 'EMP' }), false);
  assert.equal(scope.allowsRecord({ employee_id: 'EMP', company_id: B }), true);
  assert.equal(scope.allowsRecord({ employee_id: 'EMP', company_id: A }), false);
});

test('login validates username and password without trusting client roles', async () => {
  for (const body of [{ identifier: {}, password }, { identifier: 'EMP-MULTI', password: [] }, { identifier: ' ', password }]) {
    assert.equal((await call('/auth/login', { method: 'POST', body })).status, 400);
  }
  for (const identifier of ['EMP-MULTI', 'missing@example.test']) {
    const denied = await call('/auth/login', { method: 'POST', body: { identifier, password: 'wrong-password' } });
    assert.equal(denied.status, 401);
    assert.equal(denied.data.token, undefined);
  }
  for (const identifier of [' emp-multi ', 'EMP-MULTI@EXAMPLE.TEST']) {
    const auth = await call('/auth/login', { method: 'POST', body: { identifier, password, role: 'admin', isSuperAdmin: true, companyIds: ['forged'] } });
    assert.equal(auth.status, 200);
    assert.equal(auth.data.user.role, 'employee');
    assert.equal(auth.data.user.isSuperAdmin, false);
    assert.equal((await call('/admin/employees', { token: auth.data.token })).status, 403);
    const context = await call('/employee/company-context', { token: auth.data.token });
    assert.deepEqual(context.data.companies.map(c => c.id), [A, B]);
  }
});

test('employee sessions enforce assignments for profile, uploads and timesheets after revocation', async () => {
  account('EMP-ACCESS', 'employee');
  await accessStore.set('assignment:EMP-ACCESS', { employeeId: 'EMP-ACCESS', companyIds: [A, B], legacyCompanyId: A });
  const auth = await call('/auth/login', { method: 'POST', body: { identifier: 'EMP-ACCESS', password } });
  assert.equal(auth.status, 200);
  const token = auth.data.token;
  const unassigned = (await getCompanies()).find(c => ![A, B].includes(c.id)).id;
  for (const company of [unassigned, 'forged-company']) {
    for (const route of ['/employee/company-context', '/employee/profile', '/documents', '/timesheets/my', '/vendors/my']) {
      assert.equal((await call(route, { token, company })).status, 403, route);
    }
    for (const route of ['/documents/upload', '/timesheets/submit']) {
      assert.equal((await call(route, { token, company, method: 'POST', body: {} })).status, 403, route);
    }
  }
  for (const route of ['/documents/upload', '/timesheets/submit']) {
    assert.equal((await call(route, { token, method: 'POST', body: {} })).status, 400, 'Multi-company writes require a company');
  }
  await accessStore.set('assignment:EMP-ACCESS', { employeeId: 'EMP-ACCESS', companyIds: [B], legacyCompanyId: A });
  const remaining = await call('/employee/company-context', { token });
  assert.deepEqual(remaining.data.companies.map(c => c.id), [B]);
  assert.equal((await call('/employee/profile', { token, company: B })).status, 200);
  assert.equal((await call('/timesheets/my', { token, company: A })).status, 403);
  await accessStore.set('assignment:EMP-ACCESS', { employeeId: 'EMP-ACCESS', companyIds: [], legacyCompanyId: A });
  assert.equal((await call('/employee/company-context', { token })).status, 403);
  assert.equal((await call('/employee/profile', { token })).status, 403);
});


test('concurrent submissions and corrected replacements cannot double count a period', async () => {
  const body = { startDate: '2026-03-01', endDate: '2026-03-01', dailyHours: [{ date: '2026-03-01', hours: 8 }] };
  const results = await Promise.all([call('/timesheets/submit', { token: employee, method: 'POST', company: A, body }), call('/timesheets/submit', { token: employee, method: 'POST', company: A, body })]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  const first = results.find(r => r.status === 201).data.timesheet.id;
  assert.equal((await call(`/admin/timesheets/${first}/review`, {token: adminA, method: 'PATCH', body: {status:'Needs Correction'}})).status, 200);
  const next = await call('/timesheets/submit', { token: employee, method:'POST', company:A, body });
  assert.equal(next.status, 201);
  assert.equal((await call(`/admin/timesheets/${first}/review`, {token:adminA, method:'PATCH', body:{status:'Approved'}})).status, 409);
  assert.equal((await call(`/admin/timesheets/${next.data.timesheet.id}/review`, {token:adminA, method:'PATCH', body:{status:'Approved'}})).status, 200);
  const month = await call('/admin/timesheet-hours?month=2026-03', { token: adminA });
  assert.equal(month.data.employees[0].hours, 8);
  const visible = await call('/notifications', {token:employee,company:B});
  assert.equal(visible.data.notifications.filter(n => n.company_id === A).length, 0);
});

test('domain admin invitation supports multiple companies, filtering, revocation and expiry', async () => {
  const actor = { role:'admin',employeeId:'ADMIN-001',email:'admin-001@example.test',...(await getAdminAccess({role:'admin',employeeId:'ADMIN-001'})) };
  let invitation;
  await createInvitation({ firstName:'Test', lastName:'Administrator', email:'new-admin@example.test', role:'admin', companyIds:[A, B] }, actor, {send: async message => {invitation=message;}});
  const accepted = await call('/auth/invitation/accept', {method:'POST', body:{token:invitation.token,password}});
  assert.equal(accepted.status,201,JSON.stringify(accepted.data));
  const auth = await call('/auth/login',{method:'POST',body:{identifier:'new-admin@example.test',password}});
  assert.equal(auth.status,200);
  const context = await call('/admin/company-context',{token:auth.data.token});
  assert.deepEqual(context.data.companies.map(c => c.id),[A, B]);
  const otherCompany = (await getCompanies()).find(c => ![A, B].includes(c.id)).id;
  for (const [employeeId, companyId] of [['EMP-ONLY-A', A], ['EMP-ONLY-B', B], ['EMP-OUTSIDE', otherCompany]]) {
    account(employeeId, 'employee');
    await accessStore.set(`assignment:${employeeId}`, { employeeId, companyIds: [companyId], legacyCompanyId: companyId });
  }
  const token = auth.data.token;
  const directory = async company => {
    const response = await call('/admin/employees', { token, company });
    assert.equal(response.status, 200);
    return response.data.employees.map(row => row.employee_id);
  };
  const combined = await directory('all');
  assert.ok(combined.includes('EMP-ONLY-A') && combined.includes('EMP-ONLY-B'));
  assert.ok(!combined.includes('EMP-OUTSIDE'));
  assert.ok((await directory(A)).includes('EMP-ONLY-A'));
  assert.ok(!(await directory(A)).includes('EMP-ONLY-B'));
  assert.ok((await directory(B)).includes('EMP-ONLY-B'));
  assert.ok(!(await directory(B)).includes('EMP-ONLY-A'));
  assert.equal((await call('/admin/employees', { token, company: otherCompany })).status, 403);
  const revoked = await call(`/admin/access/admins/${auth.data.user.employeeId}`, { method: 'PUT', body: { enabled: true, companyIds: [B] } });
  assert.equal(revoked.status, 200);
  assert.deepEqual((await call('/admin/company-context', { token })).data.companies.map(c => c.id), [B]);
  assert.equal((await call('/admin/employees', { token, company: A })).status, 403);
  assert.ok(!(await directory('all')).includes('EMP-ONLY-A'));
  assert.equal((await call('/admin/access/companies',{token:auth.data.token})).status,403);
  assert.equal((await call('/auth/invitation/accept',{method:'POST',body:{token:invitation.token,password}})).status,410);
  await createInvitation({firstName:'Expired',lastName:'Invite',email:'expired@example.test',role:'employee',companyIds:[A]},actor,{send:async message=>{invitation=message;}});
  const key=invitationKey(invitation.token), row=await accessStore.get(key);
  await accessStore.set(key,{...row,expiresAt:'2020-01-01T00:00:00Z'});
  await assert.rejects(readInvitation(invitation.token),{status:410});
});

test('domain admin email confirms exactly the selected companies and the general activation URL', async () => {
  const companies = (await getCompanies()).filter(c => [A, B].includes(c.id));
  const invitation = { email: 'domain-admin@example.test', firstName: 'Example', role: 'admin', companies, token: 'a'.repeat(64), id: 'test-email-only' };
  const env = { RESEND_API_KEY: 'synthetic-test-key', INVITATION_FROM_EMAIL: 'Portal <invites@example.test>', APP_PUBLIC_URL: 'https://corporateemployeesignin.vercel.app/' };
  let sent;
  const delivered = await sendInvitationEmail(invitation, env, async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Idempotency-Key'], invitation.id);
    sent = JSON.parse(options.body);
    return { ok: true, json: async () => ({ id: 'test-message-id' }) };
  });
  assert.equal(delivered.id, 'test-message-id');
  assert.deepEqual(sent.to, [invitation.email]);
  assert.match(sent.subject, /domain admin access/);
  assert.match(sent.text, /super admin has granted you domain admin access/);
  assert.deepEqual(sent.text.split('\n').filter(line => line.startsWith('- ')), companies.map(c => `- ${c.name}`));
  const url = new URL(sent.text.split('\n').find(line => line.startsWith('https://')));
  assert.equal(url.origin, 'https://corporateemployeesignin.vercel.app');
  assert.equal(new URLSearchParams(url.hash.slice(1)).get('invite'), invitation.token);
  assert.match(sent.text, /expires in 7 days and can be used once/);
  await assert.rejects(sendInvitationEmail(invitation, {}, async () => { assert.fail('Unconfigured email must not be sent'); }), { status: 503 });
  await assert.rejects(sendInvitationEmail(invitation, env, async () => ({ ok: false })), { status: 502 });
  const denied = await call('/admin/invitations', { token: adminA, method: 'POST', body: { firstName: 'Example', lastName: 'Admin', email: invitation.email, role: 'admin', companyIds: [A] } });
  assert.equal(denied.status, 403, 'Only the super admin may invite another admin');
});

test('domain admin invites an employee to multiple permitted companies with registration instructions', async () => {
  account('ADMIN-INVITER', 'admin');
  await accessStore.set('grant:ADMIN-INVITER', { enabled: true, companyIds: [A, B] });
  const actor = { role: 'admin', employeeId: 'ADMIN-INVITER', email: 'admin-inviter@example.test', ...(await getAdminAccess({ role: 'admin', employeeId: 'ADMIN-INVITER' })) };
  const body = { firstName: 'New', lastName: 'Employee', email: 'domain-invited@example.test', role: 'employee', companyIds: [A, B] };
  let invitation, email;
  await createInvitation(body, actor, { send: async message => {
    invitation = message;
    await sendInvitationEmail(message, { RESEND_API_KEY: 'test-key', INVITATION_FROM_EMAIL: 'Portal <invites@example.test>', APP_PUBLIC_URL: 'https://corporateemployeesignin.vercel.app/' }, async (_url, options) => {
      email = JSON.parse(options.body);
      return { ok: true, json: async () => ({ id: 'employee-test-mail' }) };
    });
  } });
  assert.deepEqual(email.to, [body.email]);
  assert.match(email.text, /Registration steps:/);
  assert.match(email.text, /complete your personal information/);
  assert.match(email.text, /upload documents and submit timesheets for the correct company/);
  assert.deepEqual(email.text.split('\n').filter(line => line.startsWith('- ')), invitation.companies.map(c => `- ${c.name}`));
  const outside = (await getCompanies()).find(c => ![A, B].includes(c.id)).id;
  await assert.rejects(createInvitation({ ...body, companyIds: [outside] }, actor, { send: async () => assert.fail('Unauthorized invitation must not be emailed') }), { status: 403 });
  const registration = await call('/auth/register', { method: 'POST', body: { invitationToken: invitation.token, companyId: B, firstName: body.firstName, lastName: body.lastName, email: body.email, phone: '5551234567', password, confirmPassword: password, designation: 'Engineer', dateOfBirth: '1995-01-01', country: 'United States', state: 'California', city: 'Los Angeles', zipCode: '90001', address: 'Test address' } });
  assert.equal(registration.status, 201, JSON.stringify(registration.data));
  const auth = await call('/auth/login', { method: 'POST', body: { identifier: body.email, password } });
  assert.equal(auth.status, 200);
  assert.deepEqual((await call('/employee/company-context', { token: auth.data.token })).data.companies.map(c => c.id), [A, B]);
  assert.equal((await call('/employee/profile', { token: auth.data.token, company: outside })).status, 403);
});

test('work location saves and shared employee edits require all company grants', async () => {
  const body={workLocationAddress:'100 Test Avenue, Suite 2'};
  assert.equal((await call('/admin/employees/EMP-MULTI',{token:adminA,method:'PUT',body})).status,403);
  const saved=await call('/employee/profile',{token:employee,method:'PUT',company:A,body});
  assert.equal(saved.status,200,JSON.stringify(saved.data));
  const profile=await call('/employee/profile',{token:employee,company:B});
  assert.equal(profile.data.employee.work_location_address,body.workLocationAddress);
  const invoice={employee_id:'EMP-MULTI',company_id:B,invoice_number:'TEST-ONLY',month:'2026-03',total_hours:8,rate:50,currency:'USD',due_date:'2026-04-01',status:'Pending',received_date:'',paid_date:''};
  assert.equal((await call('/admin/employee-invoices',{token:adminA,method:'POST',body:invoice})).status,400);
  const result=await call('/admin/employee-invoices',{token:adminA,method:'POST',body:{...invoice,company_id:A}});
  assert.equal(result.status,201,JSON.stringify(result.data));
  assert.equal((await call('/admin/employee-invoices?employee_id=EMP-MULTI',{token:adminB})).data.invoices.length,0);
});


test('timesheet exports preserve daily month allocation, neutralize formulas and do not invent overtime', async () => {
  const { timesheetCSV } = await import('../client/src/utils/timesheetExport.js');
  const { parse } = await import('csv-parse/sync');
  const csv = timesheetCSV({ id: 1, employee_name: '=1+1', start_date: '2026-01-31', end_date: '2026-02-01', total_hours: 16, daily_hours: [{ date: '2026-01-31', hours: 8 }, { date: '2026-02-01', hours: 8 }] });
  const rows = parse(csv, { columns: true });
  assert.equal(rows.length, 2);
  assert.equal(rows[0]['Employee Name'], "'=1+1");
  assert.deepEqual(rows.map(row => row.Month), ['2026-01', '2026-02']);
  assert.equal(rows.reduce((sum, row) => sum + Number(row.Hours), 0), 16);
  const legacy = parse(timesheetCSV({ total_hours: 80, daily_hours: '{}' }), { columns: true });
  assert.equal(legacy[0].Hours, '80');
  assert.match(legacy[0].Allocation, /daily detail unavailable/);
  assert.doesNotMatch(csv, /Overtime|Regular Hours/);
  for (const daily_hours of ['{}', 'null', 'broken', '[{"date":"invalid","hours":8}]']) assert.deepEqual(decodeDailyHours({ daily_hours }), []);
});

test('uploads require invitations and receipts cannot be reused or altered', async () => {
  const { verifyUploadReceipt } = await import('./services/uploadReceipt.js');
  const makeUpload = () => { const form = new FormData(); form.append('documentType', 'passport'); form.append('document', new Blob(['test PDF'], { type: 'application/pdf' }), 'passport.pdf'); return form; };
  const denied = await fetch(base + '/upload/document', { method: 'POST', body: makeUpload() });
  assert.ok([400, 403, 404, 410].includes(denied.status));
  const actor = { role: 'admin', employeeId: 'ADMIN-001', email: 'admin-001@example.test', ...(await getAdminAccess({ role: 'admin', employeeId: 'ADMIN-001' })) };
  let sent;
  await createInvitation({ firstName: 'Upload', lastName: 'Test', email: 'upload-test@example.test', role: 'employee', companyIds: [A] }, actor, { send: async message => { sent = message; } });
  const uploaded = await fetch(base + '/upload/document', { method: 'POST', headers: { 'X-Invitation-Token': sent.token }, body: makeUpload() });
  assert.equal(uploaded.status, 200);
  const { document } = await uploaded.json();
  assert.doesNotThrow(() => verifyUploadReceipt(document, sent.token));
  assert.throws(() => verifyUploadReceipt(document, 'another-invitation'));
  assert.throws(() => verifyUploadReceipt({ ...document, mimeType: 'text/html' }, sent.token));
  assert.throws(() => verifyUploadReceipt({ ...document, fileName: 'altered.pdf' }, sent.token));
  const avatar = new FormData(); avatar.append('avatar', new Blob(['test image'], { type: 'image/png' }), 'portrait.png');
  const avatarResponse = await fetch(base + '/upload/avatar', { method: 'POST', headers: { 'X-Invitation-Token': sent.token }, body: avatar });
  assert.equal(avatarResponse.status, 200);
  const portrait = await avatarResponse.json();
  fs.unlinkSync(path.join(process.env.SHINETECK_UPLOAD_DIR, 'avatars', portrait.fileName));
  const restored = await fetch(base.replace(/\/api$/, '') + portrait.imageUrl);
  assert.equal(restored.status, 200);
  assert.equal(await restored.text(), 'test image');
  assert.equal((await fetch(base.replace(/\/api$/, '') + '/uploads/avatars/' + document.filePath)).status, 404);

  for (const [name, type] of [['attack.svg', 'image/jpeg'], ['attack.html', 'application/pdf'], ['attack.pdf', 'text/html']]) {
    const form = new FormData(); form.append('documentType', 'passport'); form.append('document', new Blob(['<script>alert(1)</script>'], { type }), name);
    assert.equal((await call('/documents/upload', { token: employee, company: A, method: 'POST', body: form })).status, 400);
  }
  const before = fs.readdirSync(path.join(process.env.SHINETECK_UPLOAD_DIR, 'private/documents')).length;
  const invalid = makeUpload(); invalid.append('expiryDate', '2026-02-30');
  assert.equal((await call('/documents/upload', { token: employee, company: A, method: 'POST', body: invalid })).status, 400);
  assert.equal(fs.readdirSync(path.join(process.env.SHINETECK_UPLOAD_DIR, 'private/documents')).length, before);
});

test('invalid employment edits cannot suspend an employee or reverse employment dates', async () => {
  const route = '/admin/employees/EMP-MULTI';
  const before = db.prepare('SELECT status FROM users WHERE employee_id=?').get('EMP-MULTI');
  assert.equal((await call(route, { method: 'PUT', body: { employmentStatus: 'Inactive', workLocationAddress: 'x'.repeat(1001) } })).status, 400);
  assert.deepEqual(db.prepare('SELECT status FROM users WHERE employee_id=?').get('EMP-MULTI'), before);
  for (const dates of [{ startDate: '2026-02-30' }, { startDate: '2026-01-31', endDate: '2026-01-01' }, { startDate: {} }]) {
    assert.equal((await call(route + '/employment-status', { method: 'PATCH', body: { employmentStatus: 'Inactive', ...dates } })).status, 400);
  }
  assert.deepEqual(db.prepare('SELECT status FROM users WHERE employee_id=?').get('EMP-MULTI'), before);
  const expired = jwt.sign({ employeeId: 'EMP-MULTI', email: 'emp-multi@example.test' }, JWT_SECRET, { expiresIn: -1 });
  assert.equal((await call('/employee/profile', { token: expired })).status, 401);
});

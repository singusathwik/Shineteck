import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db as defaultDb } from '../db/schema.js';
import { Employee, User } from '../models/index.js';
import { isMongoConnected as defaultMongoConnected } from '../db/mongo.js';
import { accessStore as defaultStore, ROOT_ADMIN_ID, accessError } from '../services/companyAccessStore.js';
import { COMPANIES, companyName } from '../../client/src/utils/companyCatalog.js';

const handle = action => async (req, res) => {
  try {
    if (!req.user.isSuperAdmin) throw accessError('Super admin access required.');
    await action(req, res);
  } catch (error) {
    const duplicate = error.code === 11000 || error.code === 'SQLITE_CONSTRAINT_UNIQUE';
    res.status(duplicate ? 409 : error.status || 500).json({ error: duplicate ? 'An account with this email already exists.' : error.status ? error.message : 'Unable to update access. Please try again.' });
  }
};
export function validateGrant(body) {
  if (!body || !Array.isArray(body.companyIds) || typeof body.enabled !== 'boolean') throw accessError('Provide company access and an enabled status.', 400);
  if (body.companyIds.some(id => !COMPANIES.some(company => company.id === id))) throw accessError('Unknown company.', 400);
  return { companyIds: [...new Set(body.companyIds)], enabled: body.enabled };
}
export function createCompanyAccessHandlers({ database: db = defaultDb, store: accessStore = defaultStore, mongoConnected: isMongoConnected = defaultMongoConnected } = {}) {
async function audit(req, action, target, before, after) {
  const id = randomUUID();
  await accessStore.set(`audit:${new Date().toISOString()}:${id}`, { id, actor: req.user.employeeId, actorEmail: req.user.email, action, target, before: before || null, after, at: new Date().toISOString() });
}
async function adminAccounts() {
  const local = db.prepare("SELECT employee_id, email, status FROM users WHERE role = 'admin'").all();
  const cloud = isMongoConnected() ? await User.find({ role: 'admin' }).select('employee_id email status').lean() : [];
  return [...new Map([...local, ...cloud].map(user => [user.employee_id, user])).values()];
}

const listAdmins = handle(async (req, res) => {
  const grants = new Map((await accessStore.list('grant:')).map(row => [row.employeeId, row]));
  res.json({ admins: (await adminAccounts()).map(user => {
    const root = user.employee_id === ROOT_ADMIN_ID;
    const grant = grants.get(user.employee_id);
    return { employeeId: user.employee_id, email: user.email, name: grant?.name || (root ? 'Primary super admin' : user.email), isSuperAdmin: root, enabled: root || grant?.enabled === true, companyIds: root ? COMPANIES.map(company => company.id) : grant?.companyIds || [] };
  }), companies: COMPANIES });
});

const createAdmin = handle(async (req, res) => {
  const grant = validateGrant(req.body);
  const { name, email, password } = req.body;
  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || typeof password !== 'string' || password.length < 12 || password.length > 128) throw accessError('Enter a name, valid email, and a password of 12–128 characters.', 400);
  const cleanEmail = email.trim().toLowerCase();
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail) || (isMongoConnected() && await User.exists({ email: cleanEmail }))) throw accessError('An account with this email already exists.', 409);
  const employeeId = `ADMIN-${randomUUID()}`;
  const password_hash = await bcrypt.hash(password, 12);
  const account = { employee_id: employeeId, email: cleanEmail, password_hash, role: 'admin', status: 'active' };
  if (isMongoConnected()) await User.create(account);
  db.prepare('INSERT INTO users (employee_id, email, password_hash, role, status) VALUES (@employee_id, @email, @password_hash, @role, @status)').run(account);
  const value = { ...grant, employeeId, name: name.trim(), updatedAt: new Date().toISOString() };
  await accessStore.set(`grant:${employeeId}`, value);
  await audit(req, 'ADMIN_CREATED', employeeId, null, { ...value, email: cleanEmail });
  res.status(201).json({ message: 'Administrator created. Share the credentials through your usual secure channel.', employeeId });
});

const updateAdmin = handle(async (req, res) => {
  const id = req.params.employeeId;
  if (id === ROOT_ADMIN_ID) throw accessError('The primary super admin cannot be disabled or have company access removed.', 409);
  if (!(await adminAccounts()).some(user => user.employee_id === id)) throw accessError('Administrator not found.', 404);
  const grant = validateGrant(req.body);
  const before = await accessStore.get(`grant:${id}`);
  const after = { ...before, ...grant, employeeId: id, updatedAt: new Date().toISOString() };
  await accessStore.set(`grant:${id}`, after);
  const accountStatus = grant.enabled ? 'active' : 'suspended';
  if (isMongoConnected()) await User.updateOne({ employee_id: id }, { $set: { status: accountStatus } });
  db.prepare('UPDATE users SET status = ? WHERE employee_id = ?').run(accountStatus, id);
  await audit(req, 'ADMIN_ACCESS_UPDATED', id, before, after);
  res.json({ message: 'Access updated. Changes apply to the next request, including existing sessions.' });
});

async function employeeDirectory() {
  const local = db.prepare('SELECT employee_id, full_name, email, designation, country FROM employees').all();
  const cloud = isMongoConnected() ? await Employee.find({}).select('employee_id full_name email designation country').lean() : [];
  return [...new Map([...local, ...cloud].map(row => [row.employee_id, row])).values()].filter(row => !row.employee_id.startsWith('ADMIN'));
}
const listAssignments = handle(async (req, res) => {
  const assignments = new Map((await accessStore.list('assignment:')).map(row => [row.employeeId, row.companyId]));
  res.json({ companies: COMPANIES, employees: (await employeeDirectory()).map(row => ({ ...row, company_id: assignments.get(row.employee_id) || null, company_name: companyName(assignments.get(row.employee_id)) })) });
});
const assignEmployees = handle(async (req, res) => {
  const { employeeIds, companyId } = req.body;
  if (!Array.isArray(employeeIds) || !employeeIds.length || employeeIds.length > 200 || !employeeIds.every(id => typeof id === 'string') || (companyId !== null && !COMPANIES.some(company => company.id === companyId))) throw accessError('Select up to 200 employees and a valid company (or Unassigned).', 400);
  const directory = new Set((await employeeDirectory()).map(row => row.employee_id));
  for (const id of employeeIds) if (!directory.has(id)) throw accessError('One or more employees were not found.', 404);
  for (const employeeId of new Set(employeeIds)) {
    const before = await accessStore.get(`assignment:${employeeId}`);
    const after = { employeeId, companyId, updatedAt: new Date().toISOString() };
    await accessStore.set(`assignment:${employeeId}`, after);
    await audit(req, 'EMPLOYEE_COMPANY_CHANGED', employeeId, before, after);
  }
  res.json({ message: 'Company assignments updated.' });
});
const accessAudit = handle(async (req, res) => {
  res.json({ events: (await accessStore.list('audit:')).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200) });
});

return { listAdmins, createAdmin, updateAdmin, listAssignments, assignEmployees, accessAudit };
}
export const { listAdmins, createAdmin, updateAdmin, listAssignments, assignEmployees, accessAudit } = createCompanyAccessHandlers();

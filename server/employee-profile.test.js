import mongoose from 'mongoose';
import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createEmployeeProfileReader, withEmployeeProfile } from './services/employeeProfileReader.js';

test('local profiles remain authoritative when MongoDB has a different copy', async () => {
  const db = new Database(':memory:');
  try {
    db.exec("CREATE TABLE employees (employee_id TEXT, full_name TEXT); INSERT INTO employees VALUES ('TEST-1', 'Local profile')");
    const find = createEmployeeProfileReader({ db, isMongoConnected: () => true, Employee: { findOne() { throw new Error('MongoDB must not be queried'); } } });
    assert.equal((await find('TEST-1')).full_name, 'Local profile');
  } finally { db.close(); }
});

test('a cloud-only profile is retrieved by employee ID without writing local data', async () => {
  const db = new Database(':memory:');
  try {
    db.exec('CREATE TABLE employees (employee_id TEXT, full_name TEXT)');
    const find = createEmployeeProfileReader({ db, isMongoConnected: () => true, Employee: { findOne(query) {
      assert.deepEqual(query, { employee_id: 'TEST-1' });
      return { lean: async () => ({ _id: 'mongo-profile', employee_id: 'TEST-1', full_name: 'Cloud profile', emergency_phone: 'test-contact' }) };
    } } });
    const profile = await find('TEST-1');
    assert.equal(profile.id, 'mongo-profile');
    assert.equal(profile.emergency_phone, 'test-contact');
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM employees').get().count, 0);
  } finally { db.close(); }
});

test('profile data cannot replace the authenticated account identity or privileges', () => {
  const account = { id: 7, employee_id: 'TEST-1', email: 'test@example.invalid', role: 'employee', status: 'active', password_hash: 'account-hash', full_name: null };
  const result = withEmployeeProfile(account, { id: 'mongo-profile', employee_id: 'OTHER', email: 'other@example.invalid', role: 'admin', status: 'suspended', password_hash: 'wrong-hash', full_name: 'Cloud profile' });
  for (const field of ['id', 'employee_id', 'email', 'role', 'status', 'password_hash']) assert.equal(result[field], account[field]);
  assert.equal(result.full_name, 'Cloud profile');
});

// Exercise the real route handlers without opening the application's database
// or contacting MongoDB. The fixture reproduces the live account/profile split.
let remoteProfile = { _id: 'mongo-profile', employee_id: 'TEST-1', full_name: 'Cloud profile', designation: 'Engineer' };
let connected = true;
let lookups = 0;
const account = { id: 7, employee_id: 'TEST-1', email: 'test@example.invalid', role: 'employee', status: 'active', full_name: null, password_hash: bcrypt.hashSync('test-account-password', 4) };
let localWrites = 0;
const cloudWrites = [];
let failCloudWrite = false;
const fixtureDb = { prepare(sql) {
  return {
    get() {
      if (sql === 'SELECT * FROM employees WHERE employee_id = ?') return undefined;
      if (sql.includes('COUNT(*)')) return { count: 0 };
      return { ...account };
    },
    all: () => [],
    run: () => { localWrites++; return { changes: 1 }; },
  };
} };
mock.module('./db/schema.js', { namedExports: { db: fixtureDb } });
mock.module('./middleware/audit.js', { namedExports: { logAudit() {} } });
mock.module('./db/mongo.js', { namedExports: { isMongoConnected: () => connected } });
mock.module('./models/index.js', { namedExports: {
  Employee: { findOne() { lookups++; return { lean: async () => remoteProfile }; }, async updateOne(query, update, options) { cloudWrites.push({ model: 'Employee', query, update, options }); if (failCloudWrite) throw new Error('Simulated cloud failure'); } },
  User: { findOne: () => ({ lean: async () => ({ ...account }) }), async updateOne(query, update, options) { cloudWrites.push({ model: 'User', query, update, options }); } }, Notification: {}, Timesheet: {}, Document: { find: () => ({ lean: async () => [] }) },
} });
const { getEmployeeProfile, toggleEmploymentStatus } = await import('./controllers/employeeController.js');
const { getMe, login } = await import('./controllers/authController.js');
function response() {
  return { statusCode: 200, body: null, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } };
}
const request = { params: {}, user: { id: 7, employeeId: 'TEST-1', role: 'employee' } };

test('employee profile endpoint returns a cloud-only profile, including account status', async () => {
  const res = response();
  await getEmployeeProfile(request, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.employee.full_name, 'Cloud profile');
  assert.equal(res.body.employee.role, 'employee');
  assert.equal(res.body.employee.account_status, 'active');
});

test('account endpoint uses the cloud profile name but retains the SQLite account ID', async () => {
  const res = response();
  await getMe(request, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.fullName, 'Cloud profile');
  assert.equal(res.body.user.id, 7);
  assert.equal(res.body.user.designation, 'Engineer');
});

test('login displays the cloud profile and signs a token for the local account', async () => {
  const res = response();
  await login({ body: { identifier: account.email, password: 'test-account-password' }, ip: '127.0.0.1' }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.fullName, 'Cloud profile');
  assert.equal(jwt.decode(res.body.token).id, 7);
  assert.equal(jwt.decode(res.body.token).role, 'employee');
});

test('employees cannot use the fallback to read another employee profile', async () => {
  const before = lookups;
  const res = response();
  await getEmployeeProfile({ ...request, params: { employeeId: 'OTHER' } }, res);
  assert.equal(res.statusCode, 403);
  assert.equal(lookups, before);
});

test('missing cloud profile remains a 404 rather than a fabricated profile', async () => {
  const previous = remoteProfile;
  remoteProfile = null;
  try {
    const res = response();
    await getEmployeeProfile(request, res);
    assert.equal(res.statusCode, 404);
  } finally { remoteProfile = previous; }
});

test('a disconnected cloud database is not queried', async () => {
  connected = false;
  try {
    const before = lookups;
    const res = response();
    await getEmployeeProfile(request, res);
    assert.equal(res.statusCode, 404);
    assert.equal(lookups, before);
  } finally { connected = true; }
});


test('cloud-only employment edits persist account and profile together and do not report success on failure', async () => {
  const priorProfile = remoteProfile;
  remoteProfile = { employee_id: 'TEST-1', full_name: 'Cloud Employee', start_date: '2026-01-01' };
  let ended = 0, committed = 0;
  const session = { async withTransaction(work) { await work(); committed++; }, async endSession() { ended++; } };
  const mockedSession = mock.method(mongoose, 'startSession', async () => session);
  try {
    const req = { params: { employeeId: 'TEST-1' }, user: { employeeId: 'ADMIN-001', email: 'admin@example.test' }, body: { employmentStatus: 'Inactive', endDate: '2026-02-01' } };
    cloudWrites.length = 0;
    const saved = response();
    await toggleEmploymentStatus(req, saved);
    assert.equal(saved.statusCode, 200);
    assert.equal(saved.body.employee.employment_status, 'Inactive');
    assert.equal(committed, 1);
    assert.equal(cloudWrites.length, 2);
    assert.equal(cloudWrites[1].update.$set.status, 'suspended');
    assert.ok(cloudWrites.every(write => write.options.session === session));
    failCloudWrite = true;
    const writesBefore = localWrites;
    const failed = response();
    await toggleEmploymentStatus(req, failed);
    assert.equal(failed.statusCode, 500);
    assert.equal(localWrites, writesBefore);
    assert.equal(committed, 1);
    assert.equal(ended, 2);
  } finally { mockedSession.mock.restore(); failCloudWrite = false; remoteProfile = priorProfile; }
});

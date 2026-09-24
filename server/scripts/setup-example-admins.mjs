// Explicit setup command; never runs automatically on server startup.
import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { User } from '../models/index.js';
import { db } from '../db/schema.js';
import { connectMongoDB, isMongoConnected } from '../db/mongo.js';
import { createAdmin, listAdmins } from '../controllers/companyAccessController.js';
import { login } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { ROOT_ADMIN_ID, getAdminAccess, buildCompanyScope } from '../services/companyAccessStore.js';
import { COMPANIES } from '../../client/src/utils/companyCatalog.js';

const credentialsPath = fileURLToPath(new URL('../../example-admin-credentials.local', import.meta.url));
const response = () => ({ code: 200, status(value) { this.code = value; return this; }, json(value) { this.data = value; return this; } });
try {
  if (process.env.MONGODB_URI?.trim()) {
    await connectMongoDB();
    if (!isMongoConnected()) throw new Error('Configured cloud database is unavailable; no example accounts created.');
  }
  const root = db.prepare("SELECT employee_id, email FROM users WHERE employee_id = ? AND role = 'admin'").get(ROOT_ADMIN_ID);
  if (!root) throw new Error('Primary admin account must already exist. No existing account was replaced.');
  const existingCredentials = existsSync(credentialsPath) ? JSON.parse(readFileSync(credentialsPath, 'utf8')) : [];
  const req = { user: { role: 'admin', isSuperAdmin: true, employeeId: root.employee_id, email: root.email } };
  const listing = response(); await listAdmins(req, listing);
  assert.equal(listing.code, 200);
  const definitions = [
    { name: 'Example Admin 1', email: 'example.admin1@shineteck.test', companyIds: [COMPANIES[0].id, COMPANIES[4].id] },
    { name: 'Example Admin 2', email: 'example.admin2@shineteck.test', companyIds: COMPANIES.slice(1, 4).map(company => company.id) }
  ];
  for (const definition of definitions) {
    let saved = existingCredentials.find(row => row.email === definition.email);
    const existing = listing.data.admins.find(row => row.email === definition.email);
    if (existing && !saved) throw new Error(`Account ${definition.email} already exists; credentials were not overwritten.`);
    if (!existing) {
      saved = { ...definition, password: randomBytes(24).toString('base64url') };
      const created = response();
      await createAdmin({ ...req, body: { ...saved, enabled: true } }, created);
      if (created.code !== 201) throw new Error(created.data.error);
      saved.employeeId = created.data.employeeId;
      existingCredentials.push(saved);
      writeFileSync(credentialsPath, JSON.stringify(existingCredentials, null, 2), { mode: 0o600 });
    }
    const signedIn = response();
    await login({ body: { identifier: saved.email, password: saved.password }, ip: '127.0.0.1' }, signedIn);
    if (signedIn.code !== 200) throw new Error(`Sign-in verification failed: ${signedIn.data.error}`);
    const authenticated = { headers: { authorization: `Bearer ${signedIn.data.token}` }, query: {} };
    let passed = false;
    authenticateToken(authenticated, response(), () => { passed = true; });
    assert.equal(passed, true);
    const access = await getAdminAccess(authenticated.user);
    assert.equal(access.isSuperAdmin, false);
    if (!existing) assert.deepEqual(access.companyIds, definition.companyIds);
    const scope = buildCompanyScope(access, COMPANIES.map((company, i) => ({ employeeId: `CHECK-${i}`, companyId: company.id })));
    for (const [i, company] of COMPANIES.entries()) assert.equal(scope.allows(`CHECK-${i}`), access.companyIds.includes(company.id));
    // The old deployed backend does not enforce company grants yet. Keep these
    // example credentials usable only by the updated local backend until deployment.
    if (isMongoConnected()) await User.updateOne({ employee_id: saved.employeeId }, { $set: { status: 'suspended' } });
    console.log(`${definition.name}: sign-in verified; ${access.companyIds.length} permitted companies; no super-admin privileges. Cloud sign-in suspended pending deployment.`);
  }
  const rootAccess = await getAdminAccess({ role: 'admin', employeeId: root.employee_id });
  assert.equal(rootAccess.isSuperAdmin, true); assert.equal(rootAccess.companyIds.length, 5);
  console.log(`Super admin: ${root.email}. Existing credentials unchanged.`);
  console.log(`Example credentials saved locally to ${credentialsPath}. This file is ignored by Git.`);
} finally {
  await mongoose.disconnect();
  db.close();
}

import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { db } from '../db/schema.js';
import { User } from '../models/index.js';
import { isMongoConnected } from '../db/mongo.js';
import { accessStore, accessError } from '../services/companyAccessStore.js';
import { createInvitation, readInvitation, invitationKey } from '../services/invitations.js';

const handle = action => async (req, res) => { try { await action(req, res); } catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'Unable to process the invitation. Please try again.' }); } };
export const invite = handle(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(email) || (isMongoConnected() && await User.exists({ email }))) throw accessError('This email already has an account. Update its company access instead.', 409);
  res.status(201).json(await createInvitation(req.body, req.user));
});
export const inspect = handle(async (req, res) => {
  const invitation = await readInvitation(req.body.token);
  res.json({ firstName: invitation.firstName, lastName: invitation.lastName, email: invitation.email, role: invitation.role, companies: invitation.companies });
});
export const acceptAdmin = handle(async (req, res) => {
  const invitation = await readInvitation(req.body.token);
  if (invitation.role !== 'admin') throw accessError('Use employee registration for this invitation.', 400);
  const password = req.body.password;
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) throw accessError('Use a password of 12–128 characters.', 400);
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(invitation.email) || (isMongoConnected() && await User.exists({ email: invitation.email }))) throw accessError('An account with this email already exists.', 409);
  const password_hash = await bcrypt.hash(password, 12);
  if (!await accessStore.claim(invitationKey(req.body.token))) throw accessError('Invitation already used.', 409);
  const employee_id = `ADMIN-${randomUUID()}`;
  const account = { employee_id, email: invitation.email, password_hash, role: 'admin', status: 'active' };
  let cloudCreated = false;
  try {
    // Grant first: incomplete provisioning never creates an unrestricted account.
    await accessStore.set(`grant:${employee_id}`, { employeeId: employee_id, name: `${invitation.firstName} ${invitation.lastName}`, companyIds: invitation.companyIds, enabled: true });
    if (isMongoConnected()) { await User.create(account); cloudCreated = true; }
    db.prepare('INSERT INTO users (employee_id,email,password_hash,role,status) VALUES (@employee_id,@email,@password_hash,@role,@status)').run(account);
  } catch (error) {
    if (!cloudCreated) { const current = await accessStore.get(invitationKey(req.body.token)); await accessStore.set(invitationKey(req.body.token), { ...current, usedAt: null }); throw error; }
    // A durable cloud account is complete; login can recreate the local cache.
  }
  res.status(201).json({ message: 'Your account is ready. Sign in with your email and password.' });
});

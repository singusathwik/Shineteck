import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { accessStore, accessError, getAdminAccess, getCompanies } from './companyAccessStore.js';

export const invitationKey = token => `invite:${createHash('sha256').update(String(token)).digest('hex')}`;
export async function readInvitation(token, store = accessStore) {
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw accessError('Invalid invitation.', 400);
  const invitation = await store.get(invitationKey(token));
  if (!invitation || invitation.usedAt || invitation.revokedAt || Date.parse(invitation.expiresAt) <= Date.now()) throw accessError('This invitation has expired or has already been used. Ask your administrator for a new invitation.', 410);
  const [companies, actor] = await Promise.all([getCompanies(store), getAdminAccess({ role: 'admin', employeeId: invitation.invitedBy }, store)]);
  if (!actor.enabled || (invitation.role === 'admin' && !actor.isSuperAdmin) || invitation.companyIds.some(id => !companies.some(c => c.id === id && c.enabled) || !actor.companyIds.includes(id))) throw accessError('The company access on this invitation is no longer available.', 403);
  return { ...invitation, companies: companies.filter(c => invitation.companyIds.includes(c.id)) };
}

export async function sendInvitationEmail({ email, firstName, role, companies, token, id }, env = process.env, sendRequest = fetch) {
  if (!env.RESEND_API_KEY || !env.INVITATION_FROM_EMAIL || !env.APP_PUBLIC_URL) throw accessError('Invitation email is not configured. Ask the super admin to configure the email sender and application URL.', 503);
  let base;
  try { base = new URL(env.APP_PUBLIC_URL); } catch { throw accessError('The application URL is not configured correctly.', 503); }
  if (base.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(base.hostname)) throw accessError('The public application URL must use HTTPS.', 503);
  base.hash = `invite=${token}`;
  const nextSteps = role === 'employee'
    ? '\nRegistration steps:\n1. Open the invitation link, verify your name and email, complete your personal information, and choose a password.\n2. Choose an assigned company for your onboarding documents and upload the required files.\n3. After registration, sign in using your email and password. Use the company selector to upload documents and submit timesheets for the correct company.\n'
    : '';
  const response = await sendRequest('https://api.resend.com/emails', {
    method: 'POST', signal: AbortSignal.timeout(15000),
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': id },
    body: JSON.stringify({ from: env.INVITATION_FROM_EMAIL, to: [email], subject: `Your ${role === 'admin' ? 'domain admin access' : 'employee portal invitation'}`, text: `Hello ${firstName},\n\n${role === 'admin' ? 'Your super admin has granted you domain admin access to the Corporate Employee Portal for the companies listed below. Activate your account using the link in this email.' : 'You have been invited to the Corporate Employee Portal as an employee.'}\n\nYour company access:\n${companies.map(c => `- ${c.name}`).join('\n')}\n\nYou will only be able to access these companies.\n\nOpen this link to ${role === 'admin' ? 'set your password' : 'set your password and register your personal information'}:\n${base.href}\n\nThis link expires in 7 days and can be used once. After registration, sign in using your email and password.\n${nextSteps}` })
  });
  if (!response.ok) throw accessError('The email provider could not send this invitation. Check the sender configuration and try again.', 502);
  return response.json();
}

export async function createInvitation(body, actor, { store = accessStore, send = sendInvitationEmail } = {}) {
  const role = body.role;
  if (!['admin', 'employee'].includes(role) || actor.role !== 'admin' || (role === 'admin' && !actor.isSuperAdmin)) throw accessError('You cannot invite this account type.');
  const firstName = String(body.firstName || '').trim(), lastName = String(body.lastName || '').trim(), email = String(body.email || '').trim().toLowerCase();
  if (!firstName || !lastName || firstName.length > 80 || lastName.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw accessError('Enter first name, last name, and a valid email address.', 400);
  const companies = await getCompanies(store);
  const ids = body.companyIds;
  if (!Array.isArray(ids) || !ids.length || ids.some(id => !companies.some(c => c.id === id && c.enabled) || !actor.companyIds.includes(id))) throw accessError('Select enabled companies that you are allowed to manage.', 403);
  const token = randomBytes(32).toString('hex'), key = invitationKey(token);
  const invitation = { id: randomUUID(), firstName, lastName, email, role, companyIds: [...new Set(ids)], invitedBy: actor.employeeId, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(), usedAt: null };
  await store.set(key, invitation);
  try { await send({ ...invitation, token, companies: companies.filter(c => ids.includes(c.id)) }); }
  catch (error) { await store.set(key, { ...invitation, revokedAt: new Date().toISOString() }); throw error; }
  // Invalidate older invitations only after the replacement has been sent successfully.
  for (const old of await store.list('invite:')) if (old.key !== key && old.email === email && !old.usedAt && !old.revokedAt) await store.set(old.key, { ...old, revokedAt: new Date().toISOString() });
  await store.set(`audit:${invitation.createdAt}:${invitation.id}`, { id: invitation.id, at: invitation.createdAt, actor: actor.employeeId, actorEmail: actor.email, action: 'INVITATION_SENT', target: email, after: { companyIds: invitation.companyIds, enabled: true } });
  return { message: `Invitation email sent to ${email} for ${companies.filter(c => invitation.companyIds.includes(c.id)).map(c => c.name).join(', ')}. The recipient can activate their account within 7 days.` };
}

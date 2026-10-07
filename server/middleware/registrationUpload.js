import { readInvitation } from '../services/invitations.js';

export async function requireRegistrationInvitation(req, res, next) {
  try {
    const token = req.headers['x-invitation-token'];
    const invitation = await readInvitation(token);
    if (invitation.role !== 'employee') return res.status(403).json({ error: 'An employee registration invitation is required.' });
    req.registrationToken = token;
    next();
  } catch (error) {
    res.status(error.status || 503).json({ error: error.status ? error.message : 'Unable to verify your invitation. Please try again.' });
  }
}

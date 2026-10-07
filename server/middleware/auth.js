import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import { accounts } from '../services/accounts.js';

export const JWT_SECRET = process.env.JWT_SECRET || randomBytes(48).toString('hex');

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  // Also support ?token=... query param for direct document streaming/downloads in browser
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user still exists and is active
    if (typeof decoded.employeeId !== 'string' || typeof decoded.email !== 'string') return res.status(401).json({ error: 'Invalid session. Please sign in again.' });
    const account = await accounts.find(decoded.employeeId);
    if (!account || account.employee_id !== decoded.employeeId || account.email !== decoded.email) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    if (account.status === 'suspended') {
      return res.status(403).json({ error: 'Account has been suspended. Please contact HR.' });
    }

    const user = accounts.cache(account);
    req.user = {
      id: user.id,
      employeeId: user.employee_id,
      email: user.email,
      role: user.role,
      status: user.status
    };

    next();
  } catch (err) {
    if (err.status === 503) return res.status(503).json({ error: err.message });
    return res.status(401).json({ error: 'Invalid or expired token. Please sign in again.' });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden. Administrator privileges required.' });
  }
  next();
}

export function requireEmployeeOrAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
}

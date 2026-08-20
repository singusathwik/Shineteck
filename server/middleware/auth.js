import jwt from 'jsonwebtoken';
import { db } from '../db/schema.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'shinetek-enterprise-secret-key-2026';

export function authenticateToken(req, res, next) {
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
    const user = db.prepare('SELECT id, employee_id, email, role, status FROM users WHERE id = ?').get(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Account has been suspended. Please contact HR.' });
    }

    req.user = {
      id: user.id,
      employeeId: user.employee_id,
      email: user.email,
      role: user.role,
      status: user.status
    };

    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
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

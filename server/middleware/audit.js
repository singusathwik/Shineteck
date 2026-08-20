import { db } from '../db/schema.js';

export function logAudit({
  userId = 'SYSTEM',
  userName = 'System',
  userRole = 'system',
  action,
  entityType = null,
  entityId = null,
  details = '',
  ipAddress = '127.0.0.1',
  status = 'SUCCESS'
}) {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, user_role, action, entity_type, entity_id, details, ip_address, status, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(String(userId), userName, userRole, action, entityType, entityId ? String(entityId) : null, details, ipAddress, status);
  } catch (err) {
    console.error('[Audit Log Error]', err);
  }
}

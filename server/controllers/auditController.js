import { db } from '../db/schema.js';

// Admin: Get audit logs with search, filter, and pagination
export function getAuditLogs(req, res) {
  try {
    const {
      search = '',
      action = '',
      userRole = '',
      status = '',
      limit = 100,
      offset = 0
    } = req.query;

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];

    if (search.trim()) {
      query += ' AND (LOWER(user_name) LIKE ? OR LOWER(user_id) LIKE ? OR LOWER(details) LIKE ? OR LOWER(action) LIKE ?)';
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term, term, term, term);
    }

    if (action && action !== 'ALL') {
      query += ' AND action = ?';
      params.push(action);
    }

    if (userRole && userRole !== 'ALL') {
      query += ' AND user_role = ?';
      params.push(userRole);
    }

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit, 10) || 100, parseInt(offset, 10) || 0);

    const logs = db.prepare(query).all(...params);

    const totalCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;

    res.json({
      total: totalCount,
      logs
    });
  } catch (err) {
    console.error('[getAuditLogs Error]', err);
    res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
}

import { db } from '../db/schema.js';

// Notifications are a local cache. A missing legacy profile must not undo a saved review.
export function notifyEmployee(employeeId, companyId, title, message, type = 'info') {
  try {
    db.prepare('INSERT INTO notifications (employee_id,company_id,title,message,type) VALUES (?,?,?,?,?)').run(employeeId, companyId || null, title, message, type);
  } catch (error) { console.warn('[Notification cache]', error.message); }
}

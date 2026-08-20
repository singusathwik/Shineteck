import { db } from '../db/schema.js';

export function getMyNotifications(req, res) {
  try {
    const employeeId = req.user.employeeId;
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE employee_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(employeeId);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    console.error('[getMyNotifications Error]', err);
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
}

export function markNotificationRead(req, res) {
  try {
    const { id } = req.params;
    const employeeId = req.user.employeeId;

    db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE id = ? AND employee_id = ?
    `).run(id, employeeId);

    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('[markNotificationRead Error]', err);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
}

export function markAllNotificationsRead(req, res) {
  try {
    const employeeId = req.user.employeeId;

    db.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE employee_id = ?
    `).run(employeeId);

    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('[markAllNotificationsRead Error]', err);
    res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
}

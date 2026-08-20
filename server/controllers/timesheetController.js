import path from 'path';
import fs from 'fs';
import * as xlsx from 'xlsx';
import { db } from '../db/schema.js';
import { logAudit } from '../middleware/audit.js';
import { TIMESHEET_DIR } from '../middleware/upload.js';

// Parse total work hours from CSV or Excel file if possible
function parseHoursFromFile(filePath, mimeType) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.csv' || ext === '.xlsx' || ext === '.xls') {
      const workbook = xlsx.readFile(filePath);
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      let calculatedHours = 0;
      let hoursFound = false;

      // Scan rows for hour columns (e.g., "Hours", "Total Hours", "Duration", "Daily Hours")
      let hourColIndex = -1;
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (!Array.isArray(row)) continue;

        if (hourColIndex === -1) {
          for (let c = 0; c < row.length; c++) {
            const cell = String(row[c] || '').toLowerCase().trim();
            if (cell === 'hours' || cell === 'total hours' || cell === 'work hours' || cell === 'duration') {
              hourColIndex = c;
              break;
            }
          }
        } else {
          // Read value in hourColIndex
          const val = parseFloat(row[hourColIndex]);
          if (!isNaN(val) && val > 0 && val <= 24) {
            calculatedHours += val;
            hoursFound = true;
          }
        }
      }

      if (hoursFound && calculatedHours > 0) {
        return Math.round(calculatedHours * 10) / 10;
      }
    }
  } catch (err) {
    console.warn('[parseHoursFromFile Warning]', err.message);
  }
  return null;
}

// Submit a new timesheet (Employee)
export function submitTimesheet(req, res) {
  try {
    const { startDate, endDate, totalHours, notes } = req.body;
    const employeeId = req.user.employeeId;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start Date and End Date are required.' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ error: 'Start date cannot be after end date.' });
    }

    let parsedHours = totalHours ? parseFloat(totalHours) : null;
    let fileName = null;
    let filePath = null;

    if (req.file) {
      fileName = req.file.originalname;
      filePath = req.file.filename;

      const extracted = parseHoursFromFile(req.file.path, req.file.mimetype);
      if (extracted !== null && (!parsedHours || parsedHours === 0)) {
        parsedHours = extracted;
      }
    }

    if (parsedHours === null || isNaN(parsedHours) || parsedHours <= 0) {
      return res.status(400).json({ error: 'Total work hours must be a valid positive number.' });
    }

    const employee = db.prepare('SELECT full_name FROM employees WHERE employee_id = ?').get(employeeId);
    const employeeName = employee ? employee.full_name : req.user.email;

    const insertStmt = db.prepare(`
      INSERT INTO timesheets (
        employee_id, employee_name, start_date, end_date, total_hours,
        file_name, file_path, notes, status, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', CURRENT_TIMESTAMP)
    `);

    const result = insertStmt.run(
      employeeId,
      employeeName,
      startDate,
      endDate,
      parsedHours,
      fileName,
      filePath,
      notes ? notes.trim() : null
    );

    // Notify employee of submission
    db.prepare(`
      INSERT INTO notifications (employee_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(
      employeeId,
      'Timesheet Submitted',
      `Your timesheet for period ${startDate} to ${endDate} (${parsedHours} hrs) has been submitted for manager approval.`,
      'info'
    );

    logAudit({
      userId: employeeId,
      userName: employeeName,
      userRole: 'employee',
      action: 'TIMESHEET_SUBMITTED',
      entityType: 'timesheet',
      entityId: result.lastInsertRowid,
      details: `Timesheet submitted for period ${startDate} - ${endDate} (${parsedHours} hrs)`,
      ipAddress: req.ip
    });

    const newTimesheet = db.prepare('SELECT * FROM timesheets WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: 'Timesheet submitted successfully.',
      timesheet: newTimesheet
    });
  } catch (err) {
    console.error('[submitTimesheet Error]', err);
    res.status(500).json({ error: 'Failed to submit timesheet.' });
  }
}

// Get timesheets for logged in employee
export function getMyTimesheets(req, res) {
  try {
    const employeeId = req.user.employeeId;
    const { status, startDate, endDate } = req.query;

    let query = 'SELECT * FROM timesheets WHERE employee_id = ?';
    const params = [employeeId];

    if (status && status !== 'ALL') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (startDate) {
      query += ' AND start_date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND end_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY submitted_at DESC';

    const timesheets = db.prepare(query).all(...params);
    res.json({ timesheets });
  } catch (err) {
    console.error('[getMyTimesheets Error]', err);
    res.status(500).json({ error: 'Failed to fetch timesheets.' });
  }
}

// Admin: Get all timesheets across the organization
export function getAllTimesheets(req, res) {
  try {
    const { search = '', status = '', startDate, endDate } = req.query;

    let query = `
      SELECT t.*, e.full_name as employee_full_name, e.designation
      FROM timesheets t
      LEFT JOIN employees e ON e.employee_id = t.employee_id
      WHERE 1=1
    `;
    const params = [];

    if (search.trim()) {
      query += ` AND (LOWER(t.employee_id) LIKE ? OR LOWER(e.full_name) LIKE ?)`;
      const term = `%${search.trim().toLowerCase()}%`;
      params.push(term, term);
    }

    if (status && status !== 'ALL') {
      query += ` AND t.status = ?`;
      params.push(status);
    }

    if (startDate) {
      query += ` AND t.start_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND t.end_date <= ?`;
      params.push(endDate);
    }

    query += ` ORDER BY t.submitted_at DESC`;

    const timesheets = db.prepare(query).all(...params);
    res.json({ timesheets });
  } catch (err) {
    console.error('[getAllTimesheets Error]', err);
    res.status(500).json({ error: 'Failed to fetch timesheets.' });
  }
}

// Admin: Review timesheet (Approve, Reject, Request Correction)
export function reviewTimesheet(req, res) {
  try {
    const { id } = req.params;
    const { status, adminFeedback } = req.body;

    if (!['Approved', 'Rejected', 'Needs Correction', 'Pending'].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Allowed: Approved, Rejected, Needs Correction, Pending." });
    }

    const timesheet = db.prepare('SELECT * FROM timesheets WHERE id = ?').get(id);
    if (!timesheet) {
      return res.status(404).json({ error: 'Timesheet not found.' });
    }

    db.prepare(`
      UPDATE timesheets
      SET status = ?,
          admin_feedback = ?,
          reviewed_at = CURRENT_TIMESTAMP,
          reviewed_by = ?
      WHERE id = ?
    `).run(status, adminFeedback || null, req.user.email, id);

    // Notify employee
    let notifTitle = `Timesheet ${status}`;
    let notifMsg = `Your timesheet for period ${timesheet.start_date} to ${timesheet.end_date} has been marked as: ${status}.`;
    if (adminFeedback) {
      notifMsg += ` Admin feedback: ${adminFeedback}`;
    }

    db.prepare(`
      INSERT INTO notifications (employee_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(
      timesheet.employee_id,
      notifTitle,
      notifMsg,
      status === 'Approved' ? 'success' : (status === 'Needs Correction' ? 'warning' : 'error')
    );

    logAudit({
      userId: req.user.employeeId,
      userName: req.user.email,
      userRole: 'admin',
      action: `TIMESHEET_${status.toUpperCase().replace(' ', '_')}`,
      entityType: 'timesheet',
      entityId: id,
      details: `Admin ${req.user.email} reviewed timesheet #${id} for ${timesheet.employee_id}: ${status}. Feedback: ${adminFeedback || 'None'}`,
      ipAddress: req.ip
    });

    const updated = db.prepare('SELECT * FROM timesheets WHERE id = ?').get(id);
    res.json({
      message: `Timesheet status updated to ${status}.`,
      timesheet: updated
    });
  } catch (err) {
    console.error('[reviewTimesheet Error]', err);
    res.status(500).json({ error: 'Failed to review timesheet.' });
  }
}

// Download timesheet file
export function downloadTimesheetFile(req, res) {
  try {
    const { id } = req.params;
    const timesheet = db.prepare('SELECT * FROM timesheets WHERE id = ?').get(id);

    if (!timesheet || !timesheet.file_path) {
      return res.status(404).json({ error: 'Timesheet file not found.' });
    }

    // Auth check
    if (req.user.role !== 'admin' && req.user.employeeId !== timesheet.employee_id) {
      return res.status(403).json({ error: 'Unauthorized to download this timesheet.' });
    }

    const fullPath = path.resolve(TIMESHEET_DIR, timesheet.file_path);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Timesheet physical file is missing from storage.' });
    }

    res.download(fullPath, timesheet.file_name || 'timesheet.csv');
  } catch (err) {
    console.error('[downloadTimesheetFile Error]', err);
    res.status(500).json({ error: 'Failed to download timesheet.' });
  }
}

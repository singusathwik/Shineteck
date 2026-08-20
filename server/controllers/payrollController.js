import { db } from '../db/schema.js';
import { logAudit } from '../middleware/audit.js';

// Get payroll records for current employee
export function getMyPayroll(req, res) {
  try {
    const employeeId = req.user.employeeId;
    const records = db.prepare(`
      SELECT * FROM payroll_records
      WHERE employee_id = ?
      ORDER BY payment_date DESC
    `).all(employeeId);

    res.json({ payrollRecords: records });
  } catch (err) {
    console.error('[getMyPayroll Error]', err);
    res.status(500).json({ error: 'Failed to fetch payroll records.' });
  }
}

// Admin: Get all payroll records across employees
export function getAllPayroll(req, res) {
  try {
    const { employeeId } = req.query;
    let query = `
      SELECT p.*, e.full_name as employee_name, e.designation
      FROM payroll_records p
      LEFT JOIN employees e ON e.employee_id = p.employee_id
    `;
    const params = [];

    if (employeeId) {
      query += ` WHERE p.employee_id = ?`;
      params.push(employeeId);
    }

    query += ` ORDER BY p.payment_date DESC`;

    const records = db.prepare(query).all(...params);
    res.json({ payrollRecords: records });
  } catch (err) {
    console.error('[getAllPayroll Error]', err);
    res.status(500).json({ error: 'Failed to fetch payroll records.' });
  }
}

// Admin: Create / Issue a payroll record
export function createPayrollRecord(req, res) {
  try {
    const {
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      grossPay,
      deductions = 0,
      paymentDate,
      paymentStatus = 'Paid'
    } = req.body;

    if (!employeeId || !payPeriodStart || !payPeriodEnd || !grossPay || !paymentDate) {
      return res.status(400).json({ error: 'All payroll fields are required.' });
    }

    const employee = db.prepare('SELECT full_name FROM employees WHERE employee_id = ?').get(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const gross = parseFloat(grossPay);
    const ded = parseFloat(deductions) || 0;
    const net = gross - ded;

    const insert = db.prepare(`
      INSERT INTO payroll_records (
        employee_id, pay_period_start, pay_period_end, gross_pay, deductions, net_pay, payment_date, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      gross,
      ded,
      net,
      paymentDate,
      paymentStatus
    );

    // Send notification
    db.prepare(`
      INSERT INTO notifications (employee_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(
      employeeId,
      'New Payroll Statement Available',
      `A payroll statement for period ${payPeriodStart} to ${payPeriodEnd} (Net: $${net.toLocaleString()}) has been issued.`,
      'success'
    );

    logAudit({
      userId: req.user.employeeId,
      userName: req.user.email,
      userRole: 'admin',
      action: 'PAYROLL_ISSUED',
      entityType: 'payroll',
      entityId: result.lastInsertRowid,
      details: `Issued pay stub for ${employeeId}: Gross $${gross}, Net $${net}, Status: ${paymentStatus}`,
      ipAddress: req.ip
    });

    const newRecord = db.prepare('SELECT * FROM payroll_records WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      message: 'Payroll record created successfully.',
      record: newRecord
    });
  } catch (err) {
    console.error('[createPayrollRecord Error]', err);
    res.status(500).json({ error: 'Failed to create payroll record.' });
  }
}

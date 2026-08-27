import { db } from '../db/schema.js';
import { logAudit } from '../middleware/audit.js';
import { Payroll as MongoPayroll } from '../models/index.js';
import { isMongoConnected } from '../db/mongo.js';

// Get payroll records for current employee
export async function getMyPayroll(req, res) {
  try {
    const employeeId = req.user.employeeId;
    let records = [];

    if (isMongoConnected()) {
      try {
        const mongoRecords = await MongoPayroll.find({ employee_id: employeeId }).sort({ payment_date: -1 }).lean();
        if (mongoRecords && mongoRecords.length > 0) {
          records = mongoRecords.map(r => ({
            ...r,
            id: r._id,
            pay_period_start: r.pay_period_start,
            pay_period_end: r.pay_period_end,
            gross_pay: r.gross_pay,
            deductions: r.deductions,
            net_pay: r.net_pay,
            currency: r.currency || 'USD',
            payment_date: r.payment_date,
            payment_status: r.payment_status
          }));
        }
      } catch (mErr) {
        console.warn('[MongoDB getMyPayroll fallback]', mErr.message);
      }
    }

    if (!records || records.length === 0) {
      records = db.prepare(`
        SELECT p.*, e.country, e.full_name as employee_name, e.designation
        FROM payroll_records p
        LEFT JOIN employees e ON e.employee_id = p.employee_id
        WHERE p.employee_id = ?
        ORDER BY p.payment_date DESC
      `).all(employeeId);
    }

    res.json({ payrollRecords: records });
  } catch (err) {
    console.error('[getMyPayroll Error]', err);
    res.status(500).json({ error: 'Failed to fetch payroll records.' });
  }
}

// Admin: Get all payroll records across employees
export async function getAllPayroll(req, res) {
  try {
    const { employeeId, currency } = req.query;
    let records = [];
    let allRecords = [];

    if (isMongoConnected()) {
      try {
        let query = {};
        if (employeeId) query.employee_id = employeeId;
        if (currency && currency !== 'ALL') query.currency = currency;

        const mongoRecords = await MongoPayroll.find(query).sort({ payment_date: -1 }).lean();
        allRecords = await MongoPayroll.find({}).lean();

        if (mongoRecords && mongoRecords.length > 0) {
          records = mongoRecords.map(r => ({
            ...r,
            id: r._id,
            pay_period_start: r.pay_period_start,
            pay_period_end: r.pay_period_end,
            gross_pay: r.gross_pay,
            deductions: r.deductions,
            net_pay: r.net_pay,
            currency: r.currency || 'USD',
            payment_date: r.payment_date,
            payment_status: r.payment_status
          }));
        }
      } catch (mErr) {
        console.warn('[MongoDB getAllPayroll fallback]', mErr.message);
      }
    }

    if (!records || records.length === 0) {
      let query = `
        SELECT p.*, e.full_name as employee_name, e.designation, e.country
        FROM payroll_records p
        LEFT JOIN employees e ON e.employee_id = p.employee_id
        WHERE 1=1
      `;
      const params = [];

      if (employeeId) {
        query += ` AND p.employee_id = ?`;
        params.push(employeeId);
      }

      if (currency && currency !== 'ALL') {
        query += ` AND (p.currency = ? OR (p.currency IS NULL AND ? = 'USD'))`;
        params.push(currency, currency);
      }

      query += ` ORDER BY p.payment_date DESC`;

      records = db.prepare(query).all(...params);
      allRecords = db.prepare(`
        SELECT p.*, e.country
        FROM payroll_records p
        LEFT JOIN employees e ON e.employee_id = p.employee_id
      `).all();
    }

    // Calculate USD and INR totals
    let usdGross = 0;
    let usdNet = 0;
    let inrGross = 0;
    let inrNet = 0;
    let usdCount = 0;
    let inrCount = 0;

    allRecords.forEach(r => {
      const cur = r.currency || (r.country === 'India' ? 'INR' : 'USD');
      if (cur === 'INR') {
        inrGross += parseFloat(r.gross_pay) || 0;
        inrNet += parseFloat(r.net_pay) || 0;
        inrCount++;
      } else {
        usdGross += parseFloat(r.gross_pay) || 0;
        usdNet += parseFloat(r.net_pay) || 0;
        usdCount++;
      }
    });

    res.json({
      payrollRecords: records,
      summary: {
        usdGross,
        usdNet,
        usdCount,
        inrGross,
        inrNet,
        inrCount,
        totalRecords: allRecords.length
      }
    });
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
      paymentStatus = 'Paid',
      currency
    } = req.body;

    if (!employeeId || !payPeriodStart || !payPeriodEnd || !grossPay || !paymentDate) {
      return res.status(400).json({ error: 'All payroll fields are required.' });
    }

    const employee = db.prepare('SELECT full_name, country FROM employees WHERE employee_id = ?').get(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Default currency based on country if not explicitly provided
    const effectiveCurrency = currency || (employee.country === 'India' ? 'INR' : 'USD');

    const gross = parseFloat(grossPay);
    const ded = parseFloat(deductions) || 0;
    const net = gross - ded;

    const insert = db.prepare(`
      INSERT INTO payroll_records (
        employee_id, pay_period_start, pay_period_end, gross_pay, deductions, net_pay, currency, payment_date, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      gross,
      ded,
      net,
      effectiveCurrency,
      paymentDate,
      paymentStatus
    );

    const symbol = effectiveCurrency === 'INR' ? '₹' : '$';

    // Send notification
    db.prepare(`
      INSERT INTO notifications (employee_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(
      employeeId,
      'New Payroll Statement Available',
      `A payroll statement for period ${payPeriodStart} to ${payPeriodEnd} (Net: ${symbol}${net.toLocaleString()}) has been issued.`,
      'success'
    );

    // Sync to MongoDB Atlas if connected
    if (isMongoConnected()) {
      MongoPayroll.create({
        employee_id: employeeId,
        pay_period_start: payPeriodStart,
        pay_period_end: payPeriodEnd,
        gross_pay: gross,
        deductions: ded,
        net_pay: net,
        currency: effectiveCurrency,
        payment_date: paymentDate,
        payment_status: paymentStatus
      }).catch(e => console.error('[MongoDB Payroll Sync Error]', e.message));
    }

    logAudit({
      userId: req.user.employeeId,
      userName: req.user.email,
      userRole: 'admin',
      action: 'PAYROLL_ISSUED',
      entityType: 'payroll',
      entityId: result.lastInsertRowid,
      details: `Issued pay stub for ${employeeId}: Gross ${symbol}${gross}, Net ${symbol}${net}, Currency: ${effectiveCurrency}, Status: ${paymentStatus}`,
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

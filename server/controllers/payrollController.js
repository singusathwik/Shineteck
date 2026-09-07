import { db } from '../db/schema.js';
import { logAudit } from '../middleware/audit.js';
import { Payroll as MongoPayroll } from '../models/index.js';
import { isMongoConnected } from '../db/mongo.js';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

    const currentYear = new Date().getFullYear();
    const empInfo = db.prepare('SELECT annual_salary, country, designation, full_name FROM employees WHERE employee_id = ?').get(employeeId);
    let annualSummary = null;
    if (empInfo) {
      const cur = empInfo.country === 'India' ? 'INR' : 'USD';
      const annual = parseFloat(empInfo.annual_salary) || (cur === 'INR' ? 1000000 : 120000);
      let ytdGross = 0;
      let ytdNet = 0;
      let monthsCount = 0;
      records.forEach(r => {
        const d = r.payment_date || r.pay_period_start || '';
        if (d.startsWith(`${currentYear}-`)) {
          ytdGross += parseFloat(r.gross_pay) || 0;
          ytdNet += parseFloat(r.net_pay) || 0;
          if (r.payment_status === 'Paid') monthsCount++;
        }
      });
      annualSummary = {
        year: currentYear,
        annualSalary: annual,
        monthlyBase: Math.round(annual / 12),
        currency: cur,
        ytdGross,
        ytdNet,
        remainingCap: Math.max(0, annual - ytdGross),
        monthsPaidCount: monthsCount
      };
    }

    res.json({ payrollRecords: records, annualSummary });
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

// Admin: Get employee annual compensation & 12-month calendar ledger
export async function getEmployeeCompensationLedger(req, res) {
  try {
    const { employeeId } = req.params;
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();

    const employee = db.prepare(`
      SELECT employee_id, full_name, designation, country, annual_salary, email, phone, profile_image_url
      FROM employees
      WHERE employee_id = ?
    `).get(employeeId);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const currency = employee.country === 'India' ? 'INR' : 'USD';
    const annualSalary = parseFloat(employee.annual_salary) || (currency === 'INR' ? 1000000 : 120000);
    const monthlyBase = Math.round(annualSalary / 12);

    // Get all payroll records for this employee in the specified year
    const records = db.prepare(`
      SELECT *
      FROM payroll_records
      WHERE employee_id = ? AND (
        payroll_month LIKE ? OR
        pay_period_start LIKE ?
      )
      ORDER BY payment_date ASC, id ASC
    `).all(employeeId, `${year}-%`, `${year}-%`);

    // Map records to months (1 to 12)
    const monthMap = {};
    let totalGrossPaid = 0;
    let totalNetPaid = 0;
    let totalDeductions = 0;
    let monthsPaidCount = 0;

    for (const r of records) {
      let mKey = r.payroll_month;
      if (!mKey && r.pay_period_start) {
        mKey = r.pay_period_start.substring(0, 7);
      }
      if (mKey && mKey.startsWith(`${year}-`)) {
        const mNum = parseInt(mKey.split('-')[1], 10);
        if (mNum >= 1 && mNum <= 12) {
          if (!monthMap[mNum]) {
            monthMap[mNum] = {
              records: [],
              gross_pay: 0,
              net_pay: 0,
              deductions: 0,
              payment_status: r.payment_status,
              payment_date: r.payment_date,
              latestRecordId: r.id
            };
            if (r.payment_status === 'Paid') {
              monthsPaidCount++;
            }
          }
          monthMap[mNum].records.push(r);
          const g = parseFloat(r.gross_pay) || 0;
          const n = parseFloat(r.net_pay) || 0;
          const d = parseFloat(r.deductions) || 0;
          monthMap[mNum].gross_pay += g;
          monthMap[mNum].net_pay += n;
          monthMap[mNum].deductions += d;
          totalGrossPaid += g;
          totalNetPaid += n;
          totalDeductions += d;
        }
      }
    }

    const currentYear = new Date().getFullYear();
    const currentMonthNum = new Date().getMonth() + 1; // 1-indexed (1 to 12)

    const months = [];
    for (let i = 1; i <= 12; i++) {
      const monthStr = i < 10 ? `0${i}` : `${i}`;
      const monthKey = `${year}-${monthStr}`;
      const monthData = monthMap[i];

      let status = 'UPCOMING';
      if (monthData && monthData.gross_pay > 0) {
        status = monthData.payment_status === 'Paid' ? 'PAID' : 'PROCESSING';
      } else if (year < currentYear || (year === currentYear && i <= currentMonthNum)) {
        status = 'DUE';
      } else {
        status = 'UPCOMING';
      }

      months.push({
        monthNumber: i,
        monthKey,
        monthName: MONTH_NAMES[i - 1],
        shortName: MONTH_SHORT[i - 1],
        status,
        disbursedGross: monthData ? monthData.gross_pay : 0,
        disbursedNet: monthData ? monthData.net_pay : 0,
        deductions: monthData ? monthData.deductions : 0,
        paymentDate: monthData ? monthData.payment_date : null,
        paymentStatus: monthData ? monthData.payment_status : null,
        recordId: monthData ? monthData.latestRecordId : null,
        recordsCount: monthData ? monthData.records.length : 0,
        recommendedBase: monthlyBase
      });
    }

    const remainingCap = Math.max(0, annualSalary - totalGrossPaid);
    const capPercentage = Math.min(100, Math.round((totalGrossPaid / annualSalary) * 1000) / 10);
    const isCapReached = totalGrossPaid >= annualSalary;

    res.json({
      employee: {
        ...employee,
        annual_salary: annualSalary,
        currency
      },
      year,
      annualSalary,
      currency,
      monthlyBase,
      totalGrossPaid,
      totalNetPaid,
      totalDeductions,
      remainingCap,
      capPercentage,
      isCapReached,
      monthsPaidCount,
      months
    });
  } catch (err) {
    console.error('[getEmployeeCompensationLedger Error]', err);
    res.status(500).json({ error: 'Failed to fetch employee compensation ledger.' });
  }
}

// Admin: Update employee's annual salary / LPA
export function updateEmployeeCompensation(req, res) {
  try {
    const { employeeId } = req.params;
    const { annualSalary, notes } = req.body;

    const salaryNum = parseFloat(annualSalary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      return res.status(400).json({ error: 'Annual salary must be a valid positive number.' });
    }

    const existing = db.prepare('SELECT employee_id, full_name, annual_salary, country FROM employees WHERE employee_id = ?').get(employeeId);
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const oldSalary = existing.annual_salary || 0;
    db.prepare('UPDATE employees SET annual_salary = ?, updated_at = CURRENT_TIMESTAMP WHERE employee_id = ?').run(salaryNum, employeeId);

    const currency = existing.country === 'India' ? 'INR' : 'USD';
    const symbol = currency === 'INR' ? '₹' : '$';

    logAudit({
      userId: req.user.employeeId,
      userName: req.user.email,
      userRole: 'admin',
      action: 'COMPENSATION_PACKAGE_UPDATED',
      entityType: 'employee',
      entityId: employeeId,
      details: `Updated annual compensation package for ${existing.full_name} (${employeeId}): from ${symbol}${oldSalary.toLocaleString()} to ${symbol}${salaryNum.toLocaleString()}. Notes: ${notes || 'Standard revision'}`,
      ipAddress: req.ip
    });

    res.json({
      message: `Annual compensation package updated to ${symbol}${salaryNum.toLocaleString()}.`,
      annualSalary: salaryNum
    });
  } catch (err) {
    console.error('[updateEmployeeCompensation Error]', err);
    res.status(500).json({ error: 'Failed to update compensation package.' });
  }
}

// Admin: Disburse monthly salary with strict annual budget cap guardrail & duplicate prevention
export function disburseMonthlySalary(req, res) {
  try {
    const {
      employeeId,
      year,
      monthNumber,
      grossPay,
      deductions = 0,
      paymentDate,
      paymentStatus = 'Paid',
      notes
    } = req.body;

    const y = parseInt(year, 10);
    const m = parseInt(monthNumber, 10);
    const gross = parseFloat(grossPay);
    const ded = parseFloat(deductions) || 0;

    if (!employeeId || !y || !m || isNaN(gross) || gross <= 0 || !paymentDate) {
      return res.status(400).json({ error: 'Employee, year, month, payment date, and valid positive gross pay are required.' });
    }

    if (m < 1 || m > 12) {
      return res.status(400).json({ error: 'Month must be between 1 (January) and 12 (December).' });
    }

    const employee = db.prepare('SELECT employee_id, full_name, designation, country, annual_salary FROM employees WHERE employee_id = ?').get(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const currency = employee.country === 'India' ? 'INR' : 'USD';
    const symbol = currency === 'INR' ? '₹' : '$';
    const annualSalary = parseFloat(employee.annual_salary) || (currency === 'INR' ? 1000000 : 120000);

    const monthStr = m < 10 ? `0${m}` : `${m}`;
    const payrollMonth = `${y}-${monthStr}`;
    const monthName = MONTH_NAMES[m - 1];

    // 1. DUPLICATE CHECK: Prevent disbursing the same calendar month twice
    const existingForMonth = db.prepare(`
      SELECT id, payment_status, gross_pay
      FROM payroll_records
      WHERE employee_id = ? AND payroll_month = ?
    `).get(employeeId, payrollMonth);

    if (existingForMonth) {
      return res.status(400).json({
        error: `Salary for ${monthName} ${y} has already been disbursed (Record #${existingForMonth.id}: ${symbol}${existingForMonth.gross_pay.toLocaleString()}). Duplicate payments for the same month are blocked.`
      });
    }

    // 2. STRICT ANNUAL SALARY BUDGET CAP GUARDRAIL
    // Calculate total gross earnings already disbursed in this year
    const ytdRow = db.prepare(`
      SELECT COALESCE(SUM(gross_pay), 0) as totalGross
      FROM payroll_records
      WHERE employee_id = ? AND (payroll_month LIKE ? OR pay_period_start LIKE ?)
    `).get(employeeId, `${y}-%`, `${y}-%`);

    const currentYtd = parseFloat(ytdRow.totalGross) || 0;
    const remainingCap = Math.max(0, annualSalary - currentYtd);
    const newTotal = currentYtd + gross;

    if (newTotal > annualSalary) {
      const overBy = newTotal - annualSalary;
      return res.status(400).json({
        error: `Payment exceeds annual income limit! Employee annual cap: ${symbol}${annualSalary.toLocaleString()}, Already disbursed in ${y}: ${symbol}${currentYtd.toLocaleString()}, Remaining cap: ${symbol}${remainingCap.toLocaleString()}. Attempted: ${symbol}${gross.toLocaleString()} (Exceeds cap by ${symbol}${overBy.toLocaleString()}). Disbursal blocked.`
      });
    }

    // Calculate dates for pay_period_start and pay_period_end
    const startDateStr = `${y}-${monthStr}-01`;
    // Last day of month
    const lastDay = new Date(y, m, 0).getDate();
    const lastDayStr = lastDay < 10 ? `0${lastDay}` : `${lastDay}`;
    const endDateStr = `${y}-${monthStr}-${lastDayStr}`;

    const net = gross - ded;

    // Insert record
    const insert = db.prepare(`
      INSERT INTO payroll_records (
        employee_id, payroll_month, pay_period_start, pay_period_end, gross_pay, deductions, net_pay, currency, payment_date, payment_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      employeeId,
      payrollMonth,
      startDateStr,
      endDateStr,
      gross,
      ded,
      net,
      currency,
      paymentDate,
      paymentStatus
    );

    // In-app notification for employee
    db.prepare(`
      INSERT INTO notifications (employee_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(
      employeeId,
      `Salary Disbursed for ${monthName} ${y}`,
      `Your monthly compensation for ${monthName} ${y} has been processed. Gross: ${symbol}${gross.toLocaleString()}, Net Take-Home: ${symbol}${net.toLocaleString()}.`,
      'success'
    );

    // Audit log
    logAudit({
      userId: req.user.employeeId,
      userName: req.user.email,
      userRole: 'admin',
      action: 'MONTHLY_SALARY_DISBURSED',
      entityType: 'payroll',
      entityId: result.lastInsertRowid,
      details: `Disbursed ${monthName} ${y} salary for ${employee.full_name} (${employeeId}): Gross ${symbol}${gross.toLocaleString()}, Deductions -${symbol}${ded.toLocaleString()}, Net ${symbol}${net.toLocaleString()}. New YTD: ${symbol}${newTotal.toLocaleString()} of ${symbol}${annualSalary.toLocaleString()} cap. Notes: ${notes || 'Monthly payroll run'}`,
      ipAddress: req.ip
    });

    const newRecord = db.prepare('SELECT * FROM payroll_records WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      message: `Salary for ${monthName} ${y} successfully disbursed (${symbol}${net.toLocaleString()}).`,
      record: newRecord,
      updatedLedger: {
        totalGrossPaid: newTotal,
        remainingCap: Math.max(0, annualSalary - newTotal),
        annualSalary
      }
    });
  } catch (err) {
    console.error('[disburseMonthlySalary Error]', err);
    res.status(500).json({ error: 'Failed to disburse monthly salary.' });
  }
}

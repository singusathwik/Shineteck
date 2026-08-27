import { PayrollEntry } from '../models/index.js';
import { db } from '../db/schema.js';
import { isMongoConnected } from '../db/mongo.js';

// Helper: sync entry to SQLite
function syncEntryToSQLite(entry) {
  try {
    const existing = db.prepare('SELECT id FROM payroll_entries WHERE employee_id = ? AND payroll_month = ?').get(entry.employee_id, entry.payroll_month);
    if (!existing) {
      db.prepare(`
        INSERT INTO payroll_entries (
          employee_id, employee_name, payroll_month, vendor_name, client_name,
          total_hours, bill_rate, emp_bill_rate, gross_amount, currency, country
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        entry.employee_id, entry.employee_name, entry.payroll_month, entry.vendor_name || '', entry.client_name || '',
        entry.total_hours, entry.bill_rate, entry.emp_bill_rate, entry.gross_amount, entry.currency || 'USD', entry.country || 'United States'
      );
    }
  } catch (err) {
    console.warn('[SQLite PayrollEntry Sync Warning]', err.message);
  }
}

// GET /api/admin/payroll-entries
export async function getAllPayrollEntries(req, res) {
  try {
    const { search, month, currency } = req.query;
    let entries = [];

    if (isMongoConnected()) {
      let query = {};
      if (month) query.payroll_month = month;
      if (currency && currency !== 'ALL') query.currency = currency;
      if (search) {
        const regex = new RegExp(search, 'i');
        query.$or = [
          { employee_id: regex },
          { employee_name: regex },
          { vendor_name: regex },
          { client_name: regex }
        ];
      }
      entries = await PayrollEntry.find(query).sort({ payroll_month: -1, created_at: -1 }).lean();
    }

    // Fallback or augment with SQLite if empty
    if (!entries || entries.length === 0) {
      let sql = 'SELECT * FROM payroll_entries WHERE 1=1';
      const params = [];
      if (month) {
        sql += ' AND payroll_month = ?';
        params.push(month);
      }
      if (currency && currency !== 'ALL') {
        sql += ' AND (currency = ? OR (currency IS NULL AND ? = "USD"))';
        params.push(currency, currency);
      }
      if (search) {
        sql += ' AND (employee_id LIKE ? OR employee_name LIKE ? OR vendor_name LIKE ? OR client_name LIKE ?)';
        const s = `%${search}%`;
        params.push(s, s, s, s);
      }
      sql += ' ORDER BY payroll_month DESC, id DESC';
      try {
        const rows = db.prepare(sql).all(...params);
        entries = rows.map(r => ({ ...r, _id: String(r.id) }));
      } catch (sqErr) {
        console.warn('[SQLite Query Warning]', sqErr.message);
      }
    }

    // Calculate Summary Stats
    let inrGross = 0;
    let inrHours = 0;
    let inrCount = 0;
    let usdGross = 0;
    let usdHours = 0;
    let usdCount = 0;

    // Get all records for overall summary calculation
    let allEntries = [];
    if (isMongoConnected()) {
      allEntries = await PayrollEntry.find({}).lean();
    }
    if (!allEntries || allEntries.length === 0) {
      try {
        allEntries = db.prepare('SELECT * FROM payroll_entries').all();
      } catch (e) {}
    }

    allEntries.forEach(e => {
      const cur = e.currency || 'USD';
      const gross = parseFloat(e.gross_amount) || 0;
      const hours = parseFloat(e.total_hours) || 0;
      if (cur === 'INR') {
        inrGross += gross;
        inrHours += hours;
        inrCount++;
      } else {
        usdGross += gross;
        usdHours += hours;
        usdCount++;
      }
    });

    res.json({
      entries,
      summary: {
        inrGross,
        inrHours,
        inrCount,
        usdGross,
        usdHours,
        usdCount,
        totalGross: usdGross + inrGross,
        totalHours: usdHours + inrHours,
        totalEntries: allEntries.length
      }
    });
  } catch (err) {
    console.error('[PayrollEntryController] getAllPayrollEntries error:', err);
    res.status(500).json({ error: 'Failed to fetch payroll entries.' });
  }
}

// POST /api/admin/payroll-entries
export async function createPayrollEntry(req, res) {
  try {
    const {
      employee_id, employee_name, payroll_month,
      vendor_name, client_name,
      total_hours, bill_rate, emp_bill_rate,
      currency, country
    } = req.body;

    if (!employee_id || !employee_name || !payroll_month || total_hours == null || bill_rate == null || emp_bill_rate == null) {
      return res.status(400).json({ error: 'Employee ID, Name, Payroll Month, Total Hours, Bill Rate, and Emp Bill Rate are required.' });
    }

    // Auto-detect currency from employee country if not specified
    let cur = currency;
    let cntry = country;
    if (!cur) {
      const emp = db.prepare('SELECT country FROM employees WHERE employee_id = ?').get(employee_id);
      if (emp && emp.country === 'India') {
        cur = 'INR';
        cntry = 'India';
      } else {
        cur = 'USD';
        cntry = 'United States';
      }
    }

    const hours = parseFloat(total_hours) || 0;
    const empRate = parseFloat(emp_bill_rate) || 0;
    const grossAmount = hours * empRate;

    let createdEntry = null;

    if (isMongoConnected()) {
      createdEntry = await PayrollEntry.create({
        employee_id,
        employee_name,
        payroll_month,
        vendor_name: vendor_name || '',
        client_name: client_name || '',
        total_hours: hours,
        bill_rate: parseFloat(bill_rate) || 0,
        emp_bill_rate: empRate,
        gross_amount: parseFloat(grossAmount.toFixed(2)),
        currency: cur,
        country: cntry
      });
    }

    // Insert into SQLite
    try {
      const resDb = db.prepare(`
        INSERT INTO payroll_entries (
          employee_id, employee_name, payroll_month, vendor_name, client_name,
          total_hours, bill_rate, emp_bill_rate, gross_amount, currency, country
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        employee_id, employee_name, payroll_month, vendor_name || '', client_name || '',
        hours, parseFloat(bill_rate) || 0, empRate, parseFloat(grossAmount.toFixed(2)), cur, cntry
      );
      if (!createdEntry) {
        createdEntry = {
          _id: String(resDb.lastInsertRowid),
          id: resDb.lastInsertRowid,
          employee_id,
          employee_name,
          payroll_month,
          vendor_name,
          client_name,
          total_hours: hours,
          bill_rate,
          emp_bill_rate: empRate,
          gross_amount: grossAmount,
          currency: cur,
          country: cntry
        };
      }
    } catch (sqErr) {
      console.warn('[SQLite Insert PayrollEntry Error]', sqErr.message);
    }

    res.status(201).json({ entry: createdEntry });
  } catch (err) {
    console.error('[PayrollEntryController] createPayrollEntry error:', err);
    res.status(500).json({ error: 'Failed to create payroll entry.' });
  }
}

// PUT /api/admin/payroll-entries/:id
export async function updatePayrollEntry(req, res) {
  try {
    const { id } = req.params;
    const {
      employee_id, employee_name, payroll_month,
      vendor_name, client_name,
      total_hours, bill_rate, emp_bill_rate,
      currency
    } = req.body;

    const hours = parseFloat(total_hours) || 0;
    const empRate = parseFloat(emp_bill_rate) || 0;
    const grossAmount = hours * empRate;

    let entry = null;

    if (isMongoConnected() && id.length === 24) {
      entry = await PayrollEntry.findByIdAndUpdate(id, {
        employee_id,
        employee_name,
        payroll_month,
        vendor_name: vendor_name || '',
        client_name: client_name || '',
        total_hours: hours,
        bill_rate: parseFloat(bill_rate) || 0,
        emp_bill_rate: empRate,
        gross_amount: parseFloat(grossAmount.toFixed(2)),
        currency: currency || 'USD',
        updated_at: new Date()
      }, { new: true });
    }

    // Update in SQLite
    try {
      db.prepare(`
        UPDATE payroll_entries SET
          employee_id = ?, employee_name = ?, payroll_month = ?, vendor_name = ?, client_name = ?,
          total_hours = ?, bill_rate = ?, emp_bill_rate = ?, gross_amount = ?, currency = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? OR employee_id = ? AND payroll_month = ?
      `).run(
        employee_id, employee_name, payroll_month, vendor_name || '', client_name || '',
        hours, parseFloat(bill_rate) || 0, empRate, parseFloat(grossAmount.toFixed(2)), currency || 'USD',
        parseInt(id) || 0, employee_id, payroll_month
      );
    } catch (e) {}

    res.json({ entry: entry || { _id: id, ...req.body, gross_amount: grossAmount } });
  } catch (err) {
    console.error('[PayrollEntryController] updatePayrollEntry error:', err);
    res.status(500).json({ error: 'Failed to update payroll entry.' });
  }
}

// DELETE /api/admin/payroll-entries/:id
export async function deletePayrollEntry(req, res) {
  try {
    const { id } = req.params;
    if (isMongoConnected() && id.length === 24) {
      await PayrollEntry.findByIdAndDelete(id);
    }
    try {
      db.prepare('DELETE FROM payroll_entries WHERE id = ?').run(parseInt(id) || 0);
    } catch (e) {}

    res.json({ success: true, message: 'Payroll entry deleted.' });
  } catch (err) {
    console.error('[PayrollEntryController] deletePayrollEntry error:', err);
    res.status(500).json({ error: 'Failed to delete payroll entry.' });
  }
}


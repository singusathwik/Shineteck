import { PayrollEntry, VendorDetail } from '../models/index.js';

// GET /api/admin/payroll-entries
export async function getAllPayrollEntries(req, res) {
  try {
    const { search, month } = req.query;
    let query = {};

    if (month) {
      query.payroll_month = month;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      const searchConditions = {
        $or: [
          { employee_id: regex },
          { employee_name: regex },
          { vendor_name: regex },
          { client_name: regex }
        ]
      };
      query = { ...query, ...searchConditions };
    }

    const entries = await PayrollEntry.find(query).sort({ created_at: -1 });
    res.json({ entries });
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
      total_hours, bill_rate, emp_bill_rate
    } = req.body;

    if (!employee_id || !employee_name || !payroll_month || total_hours == null || bill_rate == null || emp_bill_rate == null) {
      return res.status(400).json({ error: 'Employee ID, Name, Payroll Month, Total Hours, Bill Rate, and Emp Bill Rate are required.' });
    }

    const hours = parseFloat(total_hours) || 0;
    const empRate = parseFloat(emp_bill_rate) || 0;
    const grossAmount = hours * empRate;

    const entry = await PayrollEntry.create({
      employee_id,
      employee_name,
      payroll_month,
      vendor_name: vendor_name || '',
      client_name: client_name || '',
      total_hours: hours,
      bill_rate: parseFloat(bill_rate) || 0,
      emp_bill_rate: empRate,
      gross_amount: parseFloat(grossAmount.toFixed(2))
    });

    res.status(201).json({ entry });
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
      total_hours, bill_rate, emp_bill_rate
    } = req.body;

    const hours = parseFloat(total_hours) || 0;
    const empRate = parseFloat(emp_bill_rate) || 0;
    const grossAmount = hours * empRate;

    const entry = await PayrollEntry.findByIdAndUpdate(id, {
      employee_id,
      employee_name,
      payroll_month,
      vendor_name: vendor_name || '',
      client_name: client_name || '',
      total_hours: hours,
      bill_rate: parseFloat(bill_rate) || 0,
      emp_bill_rate: empRate,
      gross_amount: parseFloat(grossAmount.toFixed(2)),
      updated_at: new Date()
    }, { new: true });

    if (!entry) {
      return res.status(404).json({ error: 'Payroll entry not found.' });
    }

    res.json({ entry });
  } catch (err) {
    console.error('[PayrollEntryController] updatePayrollEntry error:', err);
    res.status(500).json({ error: 'Failed to update payroll entry.' });
  }
}

// DELETE /api/admin/payroll-entries/:id
export async function deletePayrollEntry(req, res) {
  try {
    const { id } = req.params;
    const entry = await PayrollEntry.findByIdAndDelete(id);
    if (!entry) {
      return res.status(404).json({ error: 'Payroll entry not found.' });
    }
    res.json({ success: true, message: 'Payroll entry deleted.' });
  } catch (err) {
    console.error('[PayrollEntryController] deletePayrollEntry error:', err);
    res.status(500).json({ error: 'Failed to delete payroll entry.' });
  }
}

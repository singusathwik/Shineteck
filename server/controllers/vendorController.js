import { VendorDetail, Employee } from '../models/index.js';
import { db } from '../db/schema.js';
import { isMongoConnected } from '../db/mongo.js';

// GET /api/admin/vendors
export async function getAllVendorDetails(req, res) {
  try {
    const { search } = req.query;
    let vendors = [];

    if (isMongoConnected()) {
      try {
        let query = {};
        if (search) {
          const regex = new RegExp(search, 'i');
          query = {
            $or: [
              { employee_id: regex },
              { employee_name: regex },
              { vendor_name: regex },
              { client_name: regex }
            ]
          };
        }
        vendors = await VendorDetail.find(query).sort({ created_at: -1 }).lean();
      } catch (mErr) {
        console.warn('[getAllVendorDetails MongoDB fallback]', mErr.message);
      }
    }

    if (vendors.length === 0) {
      let sql = 'SELECT * FROM vendor_details WHERE 1=1';
      const params = [];
      if (search?.trim()) {
        const term = `%${search.trim().toLowerCase()}%`;
        sql += ' AND (LOWER(employee_id) LIKE ? OR LOWER(employee_name) LIKE ? OR LOWER(vendor_name) LIKE ? OR LOWER(client_name) LIKE ?)';
        params.push(term, term, term, term);
      }
      sql += ' ORDER BY created_at DESC';
      vendors = db.prepare(sql).all(...params);
    }

    res.json({ vendors });
  } catch (err) {
    console.error('[VendorController] getAllVendorDetails error:', err);
    res.status(500).json({ error: 'Failed to fetch vendor details.' });
  }
}

// GET /api/vendors/my (Authenticated employee's assigned vendors)
export async function getMyVendors(req, res) {
  try {
    const employeeId = req.user.employeeId;
    let vendors = [];

    if (isMongoConnected()) {
      try {
        vendors = await VendorDetail.find({ employee_id: employeeId }).sort({ created_at: -1 }).lean();
      } catch (mErr) {}
    }

    if (vendors.length === 0) {
      vendors = db.prepare('SELECT * FROM vendor_details WHERE employee_id = ? ORDER BY created_at DESC').all(employeeId);
    }

    res.json({ vendors });
  } catch (err) {
    console.error('[getMyVendors Error]', err);
    res.status(500).json({ error: 'Failed to fetch employee vendor records.' });
  }
}

// POST /api/admin/vendors
export async function createVendorDetail(req, res) {
  try {
    const {
      employee_id, employee_name, vendor_name, vendor_address,
      client_name, client_address, hourly_bill_rate, employee_rate,
      visa_type
    } = req.body;

    if (!employee_id || !employee_name || !vendor_name || !client_name) {
      return res.status(400).json({ error: 'Employee ID, Employee Name, Vendor Name, and Client Name are required.' });
    }

    const billRate = parseFloat(hourly_bill_rate) || 0;
    const empRate = parseFloat(employee_rate) || 0;
    const buMargin = billRate - empRate;

    const vType = visa_type === 'OPT' ? 'OPT' : 'H-1B';
    const taxPct = vType === 'H-1B' ? 8.5 : 2.5;
    const netMargin = buMargin - (buMargin * taxPct / 100);

    let vendor = null;
    if (isMongoConnected()) {
      try {
        vendor = await VendorDetail.create({
          employee_id,
          employee_name,
          vendor_name,
          vendor_address: vendor_address || '',
          client_name,
          client_address: client_address || '',
          hourly_bill_rate: billRate,
          employee_rate: empRate,
          bu_margin: buMargin,
          visa_type: vType,
          tax_percent: taxPct,
          net_margin: parseFloat(netMargin.toFixed(2))
        });
      } catch (mErr) {
        console.warn('[MongoDB createVendorDetail fallback]', mErr.message);
      }
    }

    // SQLite dual-sync
    try {
      const stmt = db.prepare(`
        INSERT INTO vendor_details (
          employee_id, employee_name, vendor_name, vendor_address,
          client_name, client_address, hourly_bill_rate, employee_rate,
          bu_margin, visa_type, tax_percent, net_margin
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const r = stmt.run(
        employee_id, employee_name, vendor_name, vendor_address || '',
        client_name, client_address || '', billRate, empRate,
        buMargin, vType, taxPct, parseFloat(netMargin.toFixed(2))
      );
      if (!vendor) {
        vendor = db.prepare('SELECT * FROM vendor_details WHERE id = ?').get(r.lastInsertRowid);
      }
    } catch (sErr) {
      console.warn('[SQLite createVendorDetail warning]', sErr.message);
    }

    res.status(201).json({ vendor });
  } catch (err) {
    console.error('[VendorController] createVendorDetail error:', err);
    res.status(500).json({ error: 'Failed to create vendor detail.' });
  }
}

// PUT /api/admin/vendors/:id
export async function updateVendorDetail(req, res) {
  try {
    const { id } = req.params;
    const {
      employee_id, employee_name, vendor_name, vendor_address,
      client_name, client_address, hourly_bill_rate, employee_rate,
      visa_type
    } = req.body;

    const billRate = parseFloat(hourly_bill_rate) || 0;
    const empRate = parseFloat(employee_rate) || 0;
    const buMargin = billRate - empRate;

    const vType = visa_type === 'OPT' ? 'OPT' : 'H-1B';
    const taxPct = vType === 'H-1B' ? 8.5 : 2.5;
    const netMargin = buMargin - (buMargin * taxPct / 100);

    let vendor = null;
    if (isMongoConnected()) {
      try {
        vendor = await VendorDetail.findByIdAndUpdate(id, {
          employee_id,
          employee_name,
          vendor_name,
          vendor_address: vendor_address || '',
          client_name,
          client_address: client_address || '',
          hourly_bill_rate: billRate,
          employee_rate: empRate,
          bu_margin: buMargin,
          visa_type: vType,
          tax_percent: taxPct,
          net_margin: parseFloat(netMargin.toFixed(2)),
          updated_at: new Date()
        }, { new: true });
      } catch (mErr) {}
    }

    // SQLite fallback / sync
    try {
      db.prepare(`
        UPDATE vendor_details
        SET employee_id = ?, employee_name = ?, vendor_name = ?, vendor_address = ?,
            client_name = ?, client_address = ?, hourly_bill_rate = ?, employee_rate = ?,
            bu_margin = ?, visa_type = ?, tax_percent = ?, net_margin = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? OR employee_id = ?
      `).run(
        employee_id, employee_name, vendor_name, vendor_address || '',
        client_name, client_address || '', billRate, empRate,
        buMargin, vType, taxPct, parseFloat(netMargin.toFixed(2)),
        id, employee_id
      );
      if (!vendor) {
        vendor = db.prepare('SELECT * FROM vendor_details WHERE id = ?').get(id);
      }
    } catch (sErr) {}

    res.json({ vendor });
  } catch (err) {
    console.error('[VendorController] updateVendorDetail error:', err);
    res.status(500).json({ error: 'Failed to update vendor detail.' });
  }
}

// DELETE /api/admin/vendors/:id
export async function deleteVendorDetail(req, res) {
  try {
    const { id } = req.params;
    if (isMongoConnected()) {
      try {
        await VendorDetail.findByIdAndDelete(id);
      } catch (mErr) {}
    }
    try {
      db.prepare('DELETE FROM vendor_details WHERE id = ?').run(id);
    } catch (sErr) {}

    res.json({ success: true, message: 'Vendor detail deleted.' });
  } catch (err) {
    console.error('[VendorController] deleteVendorDetail error:', err);
    res.status(500).json({ error: 'Failed to delete vendor detail.' });
  }
}


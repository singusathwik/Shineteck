import { VendorDetail, Employee } from '../models/index.js';

// GET /api/admin/vendors
export async function getAllVendorDetails(req, res) {
  try {
    const { search } = req.query;
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
    const vendors = await VendorDetail.find(query).sort({ created_at: -1 });
    res.json({ vendors });
  } catch (err) {
    console.error('[VendorController] getAllVendorDetails error:', err);
    res.status(500).json({ error: 'Failed to fetch vendor details.' });
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

    const vendor = await VendorDetail.create({
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

    const vendor = await VendorDetail.findByIdAndUpdate(id, {
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

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor detail not found.' });
    }

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
    const vendor = await VendorDetail.findByIdAndDelete(id);
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor detail not found.' });
    }
    res.json({ success: true, message: 'Vendor detail deleted.' });
  } catch (err) {
    console.error('[VendorController] deleteVendorDetail error:', err);
    res.status(500).json({ error: 'Failed to delete vendor detail.' });
  }
}

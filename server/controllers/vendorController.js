import { mergedRecords, vendorIdentity } from '../services/portalRecords.js';
import fs from 'node:fs/promises';
import { VendorDetail } from '../models/index.js';
import { db } from '../db/schema.js';
import { isMongoConnected } from '../db/mongo.js';
import { accessStore, accessError } from '../services/companyAccessStore.js';

export const VISA_TYPES = ['H-1B', 'OPT', 'CPT', 'H-4 EAD', 'Green Card', 'US Citizen'];
const handle = action => async (req, res) => { try { await action(req, res); } catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'Unable to save vendor details. Please try again.' }); } finally { if (req.file?.path) await fs.unlink(req.file.path).catch(() => {}); } };
async function rows() { return mergedRecords('vendor_details', VendorDetail, vendorIdentity); }
async function find(id) { return isMongoConnected() && /^[a-f0-9]{24}$/i.test(id) ? VendorDetail.findById(id).lean() : db.prepare('SELECT * FROM vendor_details WHERE id = ?').get(id); }
export const getAllVendorDetails = handle(async (req, res) => {
  const term = String(req.query.search || '').toLowerCase();
  res.json({ vendors: (await rows()).filter(row => `${row.employee_id} ${row.employee_name} ${row.vendor_name} ${row.client_name}`.toLowerCase().includes(term)) });
});
export const getMyVendors = handle(async (req, res) => res.json({ vendors: (await rows()).filter(row => row.employee_id === req.user.employeeId) }));
function date(value) { return !value || /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value; }
export function validateVendor(body, previous = {}) {
  for (const key of ['employee_id', 'employee_name', 'vendor_name', 'client_name']) if (typeof body[key] !== 'string' || !body[key].trim()) throw accessError('Employee, vendor, and client are required.', 400);
  if (!VISA_TYPES.includes(body.visa_type)) throw accessError('Select a valid visa type.', 400);
  if (!date(body.po_start_date) || !date(body.po_end_date) || (body.po_start_date && body.po_end_date && body.po_start_date > body.po_end_date)) throw accessError('PO end date cannot be before the start date. Use valid dates.', 400);
  const bill = Number(body.hourly_bill_rate), rate = Number(body.employee_rate), tax = Number(body.tax_percent ?? previous.tax_percent ?? 0);
  if (![bill, rate, tax].every(Number.isFinite) || bill < 0 || rate < 0 || tax < 0 || tax > 100) throw accessError('Enter valid rates and a tax percentage from 0 to 100.', 400);
  return { employee_id: body.employee_id, employee_name: body.employee_name.trim(), vendor_name: body.vendor_name.trim(), vendor_address: String(body.vendor_address || '').trim(), client_name: body.client_name.trim(), client_address: String(body.client_address || '').trim(), hourly_bill_rate: bill, employee_rate: rate, bu_margin: bill - rate, tax_percent: tax, net_margin: Math.round((bill - rate) * (1 - tax / 100) * 100) / 100, visa_type: body.visa_type, po_start_date: body.po_start_date || null, po_end_date: body.po_end_date || null };
}
async function save(req, res) {
  const before = req.params.id ? await find(req.params.id) : null;
  if (req.params.id && !before) throw accessError('Vendor not found.', 404);
  const data = validateVendor(req.body, before || {});
  const scope = req.companyScope;
  const company = before?.company_id || req.body.company_id || (scope.selection !== 'all' ? scope.selection : scope.companiesFor(data.employee_id).length === 1 ? scope.companyFor(data.employee_id) : null);
  if (!company || !scope.allowsCompany(company) || !scope.companiesFor(data.employee_id).includes(company) || !scope.companies.some(c => c.id === company && c.enabled)) throw accessError('Select an enabled company assigned to this employee.', 400);
  data.company_id = company;
  let vendor;
  if (isMongoConnected() && (!before || before._id)) {
    vendor = before ? await VendorDetail.findByIdAndUpdate(before._id, { $set: data }, { new: true, runValidators: true }) : await VendorDetail.create(data);
  } else if (before) {
    db.prepare(`UPDATE vendor_details SET ${Object.keys(data).map(key => `${key}=@${key}`).join(',')}, updated_at=CURRENT_TIMESTAMP WHERE id=@id`).run({ ...data, id: before.id });
    vendor = await find(before.id);
  } else {
    const result = db.prepare(`INSERT INTO vendor_details (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map(key => `@${key}`).join(',')})`).run(data);
    vendor = await find(result.lastInsertRowid);
  }
  res.status(before ? 200 : 201).json({ vendor });
}
export const createVendorDetail = handle(save), updateVendorDetail = handle(save);
export const deleteVendorDetail = handle(async (req, res) => {
  const row = await find(req.params.id);
  if (!row) throw accessError('Vendor not found.', 404);
  if (row._id) await VendorDetail.deleteOne({ _id: row._id }); else db.prepare('DELETE FROM vendor_details WHERE id = ?').run(row.id);
  res.json({ message: 'Vendor placement removed.' });
});
export const uploadVendorFile = handle(async (req, res) => {
  if (!['msa', 'po'].includes(req.params.type) || !req.file) throw accessError('Attach an MSA or PO file.', 400);
  if (req.file.size > 8 * 1024 * 1024) throw accessError('Contract files must be 8 MB or smaller.', 400);
  const row = await find(req.params.id);
  if (!row) throw accessError('Vendor not found.', 404);
  const id = String(row._id || row.id), field = `${req.params.type}_file`;
  await accessStore.set(`contract:${id}:${req.params.type}`, { filename: req.file.originalname, mime: req.file.mimetype, content: (await fs.readFile(req.file.path)).toString('base64'), uploadedAt: new Date().toISOString() });
  if (row._id) await VendorDetail.updateOne({ _id: row._id }, { $set: { [field]: req.file.originalname } }); else db.prepare(`UPDATE vendor_details SET ${field}=? WHERE id=?`).run(req.file.originalname, row.id);
  res.json({ message: 'Contract uploaded.' });
});
export const downloadVendorFile = handle(async (req, res) => {
  const file = await accessStore.get(`contract:${req.params.id}:${req.params.type}`);
  if (!file) throw accessError('Contract not found.', 404);
  res.type(file.mime).attachment(file.filename).send(Buffer.from(file.content, 'base64'));
});

import { db } from '../db/schema.js';
import { isMongoConnected } from '../db/mongo.js';

// Cloud copies win, but legacy local-only records remain accessible by their original IDs.
export async function mergedRecords(table, Model, identity) {
  const local = db.prepare(`SELECT * FROM ${table}`).all();
  if (!isMongoConnected()) return local;
  const cloud = await Model.find({}).lean();
  const map = new Map(local.map(row => [identity(row), row]));
  for (const row of cloud) map.set(identity(row), row);
  return [...map.values()];
}
export const timesheetIdentity = row => `${row.employee_id}:${row.company_id || ''}:${row.start_date}:${row.end_date}:${row.file_path || ''}`;
export const vendorIdentity = row => `${row.employee_id}:${row.company_id || ''}:${row.vendor_name}:${row.client_name}:${row.po_start_date || ''}`;
export const documentIdentity = row => `${row.employee_id}:${row.company_id || ''}:${row.document_type}:${row.file_path}`;

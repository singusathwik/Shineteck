import mongoose from 'mongoose';
import { db } from '../db/schema.js';
import { isMongoConnected } from '../db/mongo.js';
import { COMPANIES } from '../../client/src/utils/companyCatalog.js';

const schema = new mongoose.Schema({ key: { type: String, unique: true }, value: mongoose.Schema.Types.Mixed }, { minimize: false });
const AccessRecord = mongoose.models.CompanyAccessRecord || mongoose.model('CompanyAccessRecord', schema);
export const ROOT_ADMIN_ID = process.env.SUPER_ADMIN_EMPLOYEE_ID || 'ADMIN-001';
export const accessError = (message, status = 403) => Object.assign(new Error(message), { status });

export function createAccessStore({ database = db, model = AccessRecord, connected = isMongoConnected, configured = () => Boolean(process.env.MONGODB_URI?.trim()) } = {}) {
  function backend() {
    if (connected()) return 'mongo';
    if (configured()) throw accessError('Company access service is unavailable. Please try again shortly.', 503);
    database.exec('CREATE TABLE IF NOT EXISTS company_access_records (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    return 'sqlite';
  }
  async function get(key) {
    if (backend() === 'mongo') return (await model.findOne({ key }).lean())?.value;
    const row = database.prepare('SELECT value FROM company_access_records WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : undefined;
  }
  async function set(key, value) {
    if (backend() === 'mongo') {
      await model.init();
      await model.updateOne({ key }, { $set: { value } }, { upsert: true });
    } else database.prepare('INSERT INTO company_access_records (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(key, JSON.stringify(value));
  }
  async function list(prefix) {
    const rows = backend() === 'mongo' ? await model.find({ key: { $regex: `^${prefix}` } }).lean() : database.prepare('SELECT * FROM company_access_records WHERE key LIKE ?').all(`${prefix}%`).map(row => ({ ...row, value: JSON.parse(row.value) }));
    return rows.map(row => ({ key: row.key, ...row.value }));
  }
  return { get, set, list };
}
export const accessStore = createAccessStore();

export async function getAdminAccess(user, store = accessStore) {
  if (user.role !== 'admin') return { isSuperAdmin: false, companyIds: [], enabled: false };
  // Reading the store even for the root account prevents an outage from changing authority.
  const grant = await store.get(`grant:${user.employeeId || user.employee_id}`);
  if ((user.employeeId || user.employee_id) === ROOT_ADMIN_ID) return { isSuperAdmin: true, companyIds: COMPANIES.map(company => company.id), enabled: true };
  return { isSuperAdmin: false, name: grant?.name, companyIds: grant?.companyIds || [], enabled: grant?.enabled === true };
}

export function buildCompanyScope(access, assignments, selection = 'all') {
  if (!access.enabled) throw accessError('Your administrator access has been revoked. Contact the super admin.');
  if (typeof selection !== 'string' || (selection !== 'all' && selection !== 'unassigned' && !COMPANIES.some(company => company.id === selection))) throw accessError('Invalid company selection.', 400);
  if (!access.isSuperAdmin && selection !== 'all' && !access.companyIds.includes(selection)) throw accessError('You do not have access to this company.');
  const map = new Map(assignments.map(row => [row.employeeId, row.companyId]));
  const allows = employeeId => {
    if (typeof employeeId !== 'string' || !employeeId) return false;
    const company = map.get(employeeId);
    if (selection === 'unassigned') return access.isSuperAdmin && !company;
    if (selection !== 'all' && company !== selection) return false;
    return access.isSuperAdmin || Boolean(company && access.companyIds.includes(company));
  };
  return { ...access, selection, allows, companyFor: employeeId => map.get(employeeId) || null };
}

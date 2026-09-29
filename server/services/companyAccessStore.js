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
  async function claim(key, field = 'usedAt') {
    const at = new Date().toISOString();
    if (backend() === 'mongo') {
      const result = await model.updateOne({ key, [`value.${field}`]: null }, { $set: { [`value.${field}`]: at } });
      return result.modifiedCount === 1;
    }
    return database.transaction(() => {
      const row = database.prepare('SELECT value FROM company_access_records WHERE key = ?').get(key);
      if (!row) return false;
      const value = JSON.parse(row.value);
      if (value[field]) return false;
      value[field] = at;
      database.prepare('UPDATE company_access_records SET value = ? WHERE key = ?').run(JSON.stringify(value), key);
      return true;
    })();
  }
  return { get, set, list, claim };
}
export const accessStore = createAccessStore();

export async function getCompanies(store = accessStore) {
  const saved = await store.get('catalog:companies');
  return saved?.companies || COMPANIES.map(company => ({ ...company, enabled: true }));
}
export const assignmentCompanies = row => row?.companyIds || (row?.companyId ? [row.companyId] : []);

export async function getAdminAccess(user, store = accessStore) {
  if (user.role !== 'admin') return { isSuperAdmin: false, companyIds: [], enabled: false };
  // Reading the store even for the root account prevents an outage from changing authority.
  const grant = await store.get(`grant:${user.employeeId || user.employee_id}`);
  const companies = await getCompanies(store);
  if ((user.employeeId || user.employee_id) === ROOT_ADMIN_ID) return { isSuperAdmin: true, companyIds: companies.map(company => company.id), companies, enabled: true };
  return { isSuperAdmin: false, name: grant?.name, companies, companyIds: (grant?.companyIds || []).filter(id => companies.some(company => company.id === id && company.enabled)), enabled: grant?.enabled === true };
}

export function buildCompanyScope(access, assignments, selection = 'all') {
  if (!access.enabled) throw accessError('Your administrator access has been revoked. Contact the super admin.');
  const companies = access.companies || COMPANIES;
  if (typeof selection !== 'string' || (selection !== 'all' && selection !== 'unassigned' && !companies.some(company => company.id === selection))) throw accessError('Invalid company selection.', 400);
  if (!access.isSuperAdmin && selection !== 'all' && !access.companyIds.includes(selection)) throw accessError('You do not have access to this company.');
  const legacy = new Map(assignments.map(row => [row.employeeId, Object.hasOwn(row, 'legacyCompanyId') ? row.legacyCompanyId : assignmentCompanies(row).length === 1 ? assignmentCompanies(row)[0] : null]));
  const map = new Map(assignments.map(row => [row.employeeId, assignmentCompanies(row)]));
  const allows = employeeId => {
    if (typeof employeeId !== 'string' || !employeeId) return false;
    const ids = map.get(employeeId) || [];
    if (selection === 'unassigned') return access.isSuperAdmin && !ids.length;
    if (selection !== 'all' && !ids.includes(selection)) return false;
    return access.isSuperAdmin || ids.some(id => access.companyIds.includes(id));
  };
  const allowsCompany = id => Boolean(id && (selection === 'all' || selection === id) && (access.isSuperAdmin || access.companyIds.includes(id)));
  const allowsRecord = row => {
    if (!allows(row.employee_id)) return false;
    if (row.company_id) return allowsCompany(row.company_id);
    const ids = map.get(row.employee_id) || [];
    // Ambiguous historical records stay private to the root until classified.
    const historicalCompany = legacy.get(row.employee_id);
    return historicalCompany ? allowsCompany(historicalCompany) : access.isSuperAdmin && selection === 'all';
  };
  return { ...access, selection, allows, allowsCompany, allowsRecord, legacyCompanyFor: employeeId => legacy.get(employeeId) || null, companiesFor: employeeId => map.get(employeeId) || [], companyFor: employeeId => (map.get(employeeId) || [])[0] || null };
}

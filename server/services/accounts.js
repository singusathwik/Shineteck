import { db } from '../db/schema.js';
import { User } from '../models/index.js';
import { isMongoConnected } from '../db/mongo.js';

const unavailable = () => Object.assign(new Error('Account service is unavailable. Please try again shortly.'), { status: 503 });

// SQLite is an account cache in cloud deployments, never a second authority.
export function createAccountReader({ database = db, model = User, connected = isMongoConnected, configured = () => Boolean(process.env.MONGODB_URI?.trim()) } = {}) {
  async function find(identifier) {
    const value = identifier.trim().toLowerCase();
    if (connected()) {
      try {
        const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return await model.findOne({ $or: [{ email: value }, { employee_id: new RegExp(`^${escaped}$`, 'i') }] }).lean();
      } catch { throw unavailable(); }
    }
    if (configured()) throw unavailable();
    return database.prepare('SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(employee_id) = ?').get(value, value);
  }
  function cache(account) {
    if (!connected()) return account;
    database.prepare(`INSERT INTO users (employee_id, email, password_hash, role, status)
      VALUES (@employee_id, @email, @password_hash, @role, @status)
      ON CONFLICT(employee_id) DO UPDATE SET email=excluded.email, password_hash=excluded.password_hash,
      role=excluded.role, status=excluded.status`).run({ employee_id: account.employee_id, email: account.email,
      password_hash: account.password_hash, role: account.role, status: account.status || 'active' });
    return { ...account, id: database.prepare('SELECT id FROM users WHERE employee_id = ?').get(account.employee_id).id };
  }
  return { find, cache };
}
export const accounts = createAccountReader();

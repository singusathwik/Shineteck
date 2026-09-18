// Keep local profiles authoritative, as in the admin employee detail endpoint.
// A cloud account can exist in SQLite while its profile exists only in MongoDB.
export function createEmployeeProfileReader({ db, Employee, isMongoConnected }) {
  return async function findEmployeeProfile(employeeId) {
    const local = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(employeeId);
    if (local) return local;
    if (!isMongoConnected()) return null;

    const remote = await Employee.findOne({ employee_id: employeeId }).lean();
    return remote ? { ...remote, id: String(remote._id) } : null;
  };
}

// Profile data must never replace the authenticated account's identity or role.
export function withEmployeeProfile(account, profile) {
  if (!profile) return account;
  return {
    ...account,
    ...profile,
    id: account.id,
    employee_id: account.employee_id,
    email: account.email,
    role: account.role,
    status: account.status,
    password_hash: account.password_hash,
  };
}

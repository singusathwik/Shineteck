import { db } from '../db/schema.js';
import { logAudit } from '../middleware/audit.js';

// Format sequential number according to system settings
export function formatEmployeeId(seqNumber, prefix = '', minLength = 4) {
  let numStr = String(seqNumber);
  if (numStr.length < minLength) {
    numStr = numStr.padStart(minLength, '0');
  }
  return `${prefix}${numStr}`;
}

// Get the current settings and the next prospective ID preview
export function getSettings(req, res) {
  try {
    const settingsRows = db.prepare('SELECT key, value, description FROM system_settings').all();
    const settings = {};
    settingsRows.forEach(row => {
      settings[row.key] = row.value;
    });

    const prefix = settings['id_prefix'] || 'SH-';
    const startNum = parseInt(settings['id_start_number'] || '2005', 10);
    const currentSeq = parseInt(settings['id_current_seq'] || '2005', 10);
    const minLength = parseInt(settings['id_min_length'] || '4', 10);

    const nextIdPreview = formatEmployeeId(currentSeq, prefix, minLength);

    res.json({
      settings: {
        id_prefix: prefix,
        id_start_number: startNum,
        id_current_seq: currentSeq,
        id_min_length: minLength
      },
      nextIdPreview
    });
  } catch (err) {
    console.error('[getSettings Error]', err);
    res.status(500).json({ error: 'Failed to load system settings' });
  }
}

// Update ID format configuration (Admin only)
export function updateSettings(req, res) {
  try {
    const { id_prefix, id_start_number, id_min_length, id_current_seq } = req.body;

    const updateStmt = db.prepare('INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP');

    const transaction = db.transaction(() => {
      if (id_prefix !== undefined) {
        updateStmt.run('id_prefix', String(id_prefix).trim());
      }
      if (id_start_number !== undefined) {
        const start = parseInt(id_start_number, 10);
        if (isNaN(start) || start < 1) throw new Error('Start number must be a positive integer');
        updateStmt.run('id_start_number', String(start));
      }
      if (id_min_length !== undefined) {
        const len = parseInt(id_min_length, 10);
        if (isNaN(len) || len < 1 || len > 10) throw new Error('Minimum length must be between 1 and 10');
        updateStmt.run('id_min_length', String(len));
      }
      if (id_current_seq !== undefined) {
        const seq = parseInt(id_current_seq, 10);
        if (isNaN(seq) || seq < 1) throw new Error('Current sequence number must be a positive integer');
        updateStmt.run('id_current_seq', String(seq));
      }
    });

    transaction();

    logAudit({
      userId: req.user?.employeeId || 'ADMIN',
      userName: req.user?.email || 'Admin',
      userRole: 'admin',
      action: 'UPDATE_ID_SETTINGS',
      entityType: 'system_settings',
      details: `Updated ID generator format: prefix=${id_prefix}, minLen=${id_min_length}, start=${id_start_number}`,
      ipAddress: req.ip
    });

    // Return updated settings
    return getSettings(req, res);
  } catch (err) {
    console.error('[updateSettings Error]', err);
    res.status(400).json({ error: err.message || 'Failed to update system settings' });
  }
}

// Atomically generate and reserve the next sequential Employee ID
export function generateNextEmployeeIdSync() {
  const getSettingsStmt = db.prepare("SELECT key, value FROM system_settings WHERE key IN ('id_prefix', 'id_current_seq', 'id_min_length', 'id_start_number')");
  
  let generatedId = null;

  const generateTx = db.transaction(() => {
    const rows = getSettingsStmt.all();
    const map = {};
    rows.forEach(r => { map[r.key] = r.value; });

    const prefix = map['id_prefix'] !== undefined ? map['id_prefix'] : 'SH-';
    const minLength = parseInt(map['id_min_length'] || '4', 10);
    let currentSeq = parseInt(map['id_current_seq'] || map['id_start_number'] || '2005', 10);

    // Keep checking against existing users and employees to guarantee zero duplicate
    let candidate = formatEmployeeId(currentSeq, prefix, minLength);
    let existsUser = db.prepare('SELECT 1 FROM users WHERE employee_id = ?').get(candidate);
    let existsEmp = db.prepare('SELECT 1 FROM employees WHERE employee_id = ?').get(candidate);
    
    while (existsUser || existsEmp) {
      currentSeq++;
      candidate = formatEmployeeId(currentSeq, prefix, minLength);
      existsUser = db.prepare('SELECT 1 FROM users WHERE employee_id = ?').get(candidate);
      existsEmp = db.prepare('SELECT 1 FROM employees WHERE employee_id = ?').get(candidate);
    }

    // Save incremented next sequence
    db.prepare("INSERT INTO system_settings (key, value, updated_at) VALUES ('id_current_seq', ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP")
      .run(String(currentSeq + 1));

    generatedId = candidate;
  });

  generateTx();
  return generatedId;
}

// Public endpoint to preview what the next sequential employee ID will be (without incrementing)
export function getNextIdPreview(req, res) {
  try {
    const rows = db.prepare("SELECT key, value FROM system_settings WHERE key IN ('id_prefix', 'id_current_seq', 'id_min_length', 'id_start_number')").all();
    const map = {};
    rows.forEach(r => { map[r.key] = r.value; });

    const prefix = map['id_prefix'] !== undefined ? map['id_prefix'] : 'SH-';
    const minLength = parseInt(map['id_min_length'] || '4', 10);
    let currentSeq = parseInt(map['id_current_seq'] || map['id_start_number'] || '2005', 10);

    let candidate = formatEmployeeId(currentSeq, prefix, minLength);
    let existsUser = db.prepare('SELECT 1 FROM users WHERE employee_id = ?').get(candidate);
    let existsEmp = db.prepare('SELECT 1 FROM employees WHERE employee_id = ?').get(candidate);
    while (existsUser || existsEmp) {
      currentSeq++;
      candidate = formatEmployeeId(currentSeq, prefix, minLength);
      existsUser = db.prepare('SELECT 1 FROM users WHERE employee_id = ?').get(candidate);
      existsEmp = db.prepare('SELECT 1 FROM employees WHERE employee_id = ?').get(candidate);
    }

    res.json({
      employeeId: candidate,
      prefix,
      seq: currentSeq
    });
  } catch (err) {
    console.error('[getNextIdPreview Error]', err);
    res.status(500).json({ error: 'Failed to preview employee ID' });
  }
}

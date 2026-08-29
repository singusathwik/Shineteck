import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (e) {
    console.warn('[DB Directory Warning]', e.message);
  }
}

const dbPath = path.resolve(dbDir, 'shinetek.db');
let db;
try {
  db = new Database(dbPath);
  try {
    db.pragma('journal_mode = WAL');
  } catch (walErr) {
    console.warn('[SQLite Notice] WAL mode not supported in this container environment, continuing with default mode.');
  }
  try {
    db.pragma('foreign_keys = ON');
  } catch (fkErr) {
    console.warn('[SQLite Notice] Foreign keys pragma warning:', fkErr.message);
  }
} catch (err) {
  console.error('[SQLite Connection Error]', err);
}

export { db };

export function initSchema() {
  if (!db) {
    console.error('[DB] SQLite database not initialized.');
    return;
  }
  db.exec(`
    -- System Configuration table (configurable sequential employee ID, etc.)
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- User accounts for authentication
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('employee', 'admin')) NOT NULL DEFAULT 'employee',
      status TEXT CHECK(status IN ('active', 'suspended', 'pending')) NOT NULL DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Employee detailed profile and onboarding information
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      employee_id TEXT UNIQUE NOT NULL,
      first_name TEXT,
      last_name TEXT,
      middle_initial TEXT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      gender TEXT,
      designation TEXT NOT NULL,
      date_of_birth TEXT NOT NULL,
      country TEXT NOT NULL,
      state TEXT NOT NULL,
      city TEXT NOT NULL,
      zip_code TEXT NOT NULL,
      zip_code_part1 TEXT,
      zip_code_part2 TEXT,
      address TEXT NOT NULL,
      address_line_1 TEXT,
      address_line_2 TEXT,
      suite_apt TEXT,
      emergency_first_name TEXT,
      emergency_last_name TEXT,
      emergency_email TEXT,
      emergency_phone TEXT,
      emergency_relationship TEXT,
      profile_image_url TEXT,
      start_date TEXT,
      end_date TEXT,
      employment_status TEXT CHECK(employment_status IN ('Active', 'Inactive')) NOT NULL DEFAULT 'Active',
      registration_status TEXT CHECK(registration_status IN ('Pending Review', 'Approved', 'Needs Correction', 'Rejected')) NOT NULL DEFAULT 'Pending Review',
      admin_notes TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      reviewed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- Employee uploaded documents
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      status TEXT CHECK(status IN ('Uploaded', 'Approved', 'Needs Replacement', 'Rejected')) NOT NULL DEFAULT 'Uploaded',
      review_notes TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      reviewed_by TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
    );

    -- Employee timesheets
    CREATE TABLE IF NOT EXISTS timesheets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      employee_name TEXT,
      vendor_name TEXT DEFAULT '',
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      total_hours REAL NOT NULL,
      file_name TEXT,
      file_path TEXT,
      notes TEXT,
      status TEXT CHECK(status IN ('Pending', 'Approved', 'Rejected', 'Needs Correction')) NOT NULL DEFAULT 'Pending',
      admin_feedback TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      reviewed_by TEXT,
      FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
    );

    -- Payroll records (Statements issued to employees)
    CREATE TABLE IF NOT EXISTS payroll_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      pay_period_start TEXT NOT NULL,
      pay_period_end TEXT NOT NULL,
      gross_pay REAL NOT NULL,
      deductions REAL NOT NULL DEFAULT 0.0,
      net_pay REAL NOT NULL,
      currency TEXT CHECK(currency IN ('USD', 'INR')) NOT NULL DEFAULT 'USD',
      payment_date TEXT NOT NULL,
      payment_status TEXT CHECK(payment_status IN ('Paid', 'Processing', 'Scheduled')) NOT NULL DEFAULT 'Paid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
    );

    -- Payroll entries (Monthly client & vendor timesheet billing calculations)
    CREATE TABLE IF NOT EXISTS payroll_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      payroll_month TEXT NOT NULL,
      vendor_name TEXT DEFAULT '',
      client_name TEXT DEFAULT '',
      total_hours REAL NOT NULL,
      bill_rate REAL NOT NULL,
      emp_bill_rate REAL NOT NULL,
      gross_amount REAL NOT NULL,
      currency TEXT CHECK(currency IN ('USD', 'INR')) NOT NULL DEFAULT 'USD',
      country TEXT DEFAULT 'United States',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
    );

    -- Vendor details
    CREATE TABLE IF NOT EXISTS vendor_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      employee_name TEXT NOT NULL,
      vendor_name TEXT NOT NULL,
      vendor_address TEXT DEFAULT '',
      client_name TEXT NOT NULL,
      client_address TEXT DEFAULT '',
      hourly_bill_rate REAL NOT NULL,
      employee_rate REAL NOT NULL,
      bu_margin REAL NOT NULL,
      visa_type TEXT DEFAULT 'H-1B',
      tax_percent REAL NOT NULL,
      net_margin REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
    );

    -- System Audit Trail
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      user_name TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT,
      status TEXT DEFAULT 'SUCCESS',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT CHECK(type IN ('info', 'success', 'warning', 'error')) DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Password Reset tokens (secure simulated/expiring token table)
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Column migrations for existing database files
  try {
    const empColumns = db.prepare("PRAGMA table_info(employees)").all().map(c => c.name);
    if (!empColumns.includes('first_name')) {
      db.exec("ALTER TABLE employees ADD COLUMN first_name TEXT;");
    }
    if (!empColumns.includes('last_name')) {
      db.exec("ALTER TABLE employees ADD COLUMN last_name TEXT;");
    }
    if (!empColumns.includes('middle_initial')) {
      db.exec("ALTER TABLE employees ADD COLUMN middle_initial TEXT;");
    }
    if (!empColumns.includes('gender')) {
      db.exec("ALTER TABLE employees ADD COLUMN gender TEXT;");
    }
    if (!empColumns.includes('address_line_1')) {
      db.exec("ALTER TABLE employees ADD COLUMN address_line_1 TEXT;");
    }
    if (!empColumns.includes('address_line_2')) {
      db.exec("ALTER TABLE employees ADD COLUMN address_line_2 TEXT;");
    }
    if (!empColumns.includes('suite_apt')) {
      db.exec("ALTER TABLE employees ADD COLUMN suite_apt TEXT;");
    }
    if (!empColumns.includes('zip_code_part1')) {
      db.exec("ALTER TABLE employees ADD COLUMN zip_code_part1 TEXT;");
    }
    if (!empColumns.includes('zip_code_part2')) {
      db.exec("ALTER TABLE employees ADD COLUMN zip_code_part2 TEXT;");
    }
    if (!empColumns.includes('emergency_first_name')) {
      db.exec("ALTER TABLE employees ADD COLUMN emergency_first_name TEXT;");
    }
    if (!empColumns.includes('emergency_last_name')) {
      db.exec("ALTER TABLE employees ADD COLUMN emergency_last_name TEXT;");
    }
    if (!empColumns.includes('emergency_email')) {
      db.exec("ALTER TABLE employees ADD COLUMN emergency_email TEXT;");
    }
    if (!empColumns.includes('emergency_phone')) {
      db.exec("ALTER TABLE employees ADD COLUMN emergency_phone TEXT;");
    }
    if (!empColumns.includes('emergency_relationship')) {
      db.exec("ALTER TABLE employees ADD COLUMN emergency_relationship TEXT;");
    }
    if (!empColumns.includes('start_date')) {
      db.exec("ALTER TABLE employees ADD COLUMN start_date TEXT;");
    }
    if (!empColumns.includes('end_date')) {
      db.exec("ALTER TABLE employees ADD COLUMN end_date TEXT;");
    }
    if (!empColumns.includes('employment_status')) {
      db.exec("ALTER TABLE employees ADD COLUMN employment_status TEXT DEFAULT 'Active';");
    }

    const payColumns = db.prepare("PRAGMA table_info(payroll_records)").all().map(c => c.name);
    if (!payColumns.includes('currency')) {
      db.exec("ALTER TABLE payroll_records ADD COLUMN currency TEXT DEFAULT 'USD';");
    }

    const tsColumns = db.prepare("PRAGMA table_info(timesheets)").all().map(c => c.name);
    if (!tsColumns.includes('vendor_name')) {
      db.exec("ALTER TABLE timesheets ADD COLUMN vendor_name TEXT DEFAULT '';");
    }

    // Check if documents table has old check constraint and migrate if needed
    const docTableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='documents'").get()?.sql || '';
    if (docTableSql.includes("CHECK(document_type IN ('w4'")) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS documents_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          employee_id TEXT NOT NULL,
          document_type TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_path TEXT NOT NULL,
          file_size INTEGER NOT NULL,
          mime_type TEXT NOT NULL,
          status TEXT CHECK(status IN ('Uploaded', 'Approved', 'Needs Replacement', 'Rejected')) NOT NULL DEFAULT 'Uploaded',
          review_notes TEXT,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          reviewed_at DATETIME,
          reviewed_by TEXT,
          FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
        );
        INSERT OR IGNORE INTO documents_new SELECT * FROM documents;
        DROP TABLE documents;
        ALTER TABLE documents_new RENAME TO documents;
      `);
    }
  } catch (migErr) {
    console.warn('[DB Migration Warning]', migErr.message);
  }

  console.log('[DB] Database schema initialized.');
}

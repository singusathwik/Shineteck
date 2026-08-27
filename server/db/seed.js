import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db, initSchema } from './schema.js';
import { AVATAR_DIR, PRIVATE_DOCS_DIR, TIMESHEET_DIR } from '../middleware/upload.js';
import { logAudit } from '../middleware/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase() {
  initSchema();
  if (!db) {
    console.warn('[DB] Cannot seed: database instance not available.');
    return;
  }

  console.log('[DB] Checking seed data...');

  // Initialize System Settings for ID generation
  const existingPrefix = db.prepare("SELECT value FROM system_settings WHERE key = 'id_prefix'").get();
  if (!existingPrefix) {
    db.prepare("INSERT INTO system_settings (key, value, description) VALUES ('id_prefix', 'SH-', 'Employee ID prefix (e.g. SH- or 86)')").run();
    db.prepare("INSERT INTO system_settings (key, value, description) VALUES ('id_start_number', '2005', 'Configurable starting ID number')").run();
    db.prepare("INSERT INTO system_settings (key, value, description) VALUES ('id_min_length', '4', 'Minimum digit padding length')").run();
    db.prepare("INSERT INTO system_settings (key, value, description) VALUES ('id_current_seq', '2005', 'Next sequential counter value')").run();
    console.log('[DB] Default ID generator settings inserted.');
  }

  // Create sample dummy files for documents so previews & downloads function
  function createSampleDocFile(filename, content) {
    const filePath = path.resolve(PRIVATE_DOCS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }

  function createSampleTimesheetFile(filename, content) {
    const filePath = path.resolve(TIMESHEET_DIR, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }

  createSampleDocFile('sample_w4_johnathan.pdf', '%PDF-1.4 [Shinetek Inc. Form W-4 Employee Withholding Certificate]');
  createSampleDocFile('sample_i9_johnathan.pdf', '%PDF-1.4 [Shinetek Inc. Form I-9 Employment Eligibility Verification]');
  createSampleDocFile('sample_passport_johnathan.jpg', 'SHINETEK_SAMPLE_PASSPORT_IMAGE_BINARY');
  createSampleDocFile('sample_visa_johnathan.pdf', '%PDF-1.4 [Shinetek Inc. Sample Visa Document]');
  createSampleDocFile('sample_w4_emily.pdf', '%PDF-1.4 [Shinetek Inc. Form W-4 Emily Chen]');
  createSampleDocFile('sample_i9_emily.pdf', '%PDF-1.4 [Shinetek Inc. Form I-9 Emily Chen]');
  createSampleDocFile('sample_w4_marcus.pdf', '%PDF-1.4 [Shinetek Inc. Form W-4 Marcus Brody]');

  const sampleCsvContent = `Date,Day,Work Hours,Task Description,Project\n2026-01-01,Monday,8.0,Core Architecture,Portal\n2026-01-02,Tuesday,8.0,Database Setup,Portal\n2026-01-03,Wednesday,8.0,API Controllers,Portal\n2026-01-04,Thursday,8.0,Frontend Integration,Portal\n2026-01-05,Friday,8.0,Security Audits,Portal\n2026-01-08,Monday,8.0,Timesheet Module,Portal\n2026-01-09,Tuesday,8.0,Admin Review UI,Portal\n2026-01-10,Wednesday,8.0,Cropper Tools,Portal\n2026-01-11,Thursday,8.0,End to End Testing,Portal\n2026-01-12,Friday,8.0,Deployment Prep,Portal`;
  createSampleTimesheetFile('timesheet_johnathan_jan1.csv', sampleCsvContent);
  createSampleTimesheetFile('timesheet_emily_feb1.csv', sampleCsvContent);

  // Check if Admin exists
  const adminUser = db.prepare("SELECT id FROM users WHERE email = 'admin@shinetek.com'").get();
  if (!adminUser) {
    const salt = await bcrypt.genSalt(10);
    const adminPassHash = await bcrypt.hash('Admin@1234', salt);

    const adminRes = db.prepare(`
      INSERT INTO users (employee_id, email, password_hash, role, status)
      VALUES ('ADMIN-001', 'admin@shinetek.com', ?, 'admin', 'active')
    `).run(adminPassHash);

    db.prepare(`
      INSERT INTO employees (
        user_id, employee_id, first_name, last_name, middle_initial, full_name, email, phone, designation,
        date_of_birth, country, state, city, zip_code, address,
        start_date, end_date, employment_status,
        registration_status, submitted_at, reviewed_at, reviewed_by
      ) VALUES (?, 'ADMIN-001', 'System', 'Administrator', '', 'System Administrator', 'admin@shinetek.com', '+1 (555) 019-2831', 'HR & Systems Administrator',
        '1988-04-12', 'United States', 'California', 'Los Angeles', '90001', '100 Corporate Plaza, Suite 400',
        '2024-01-15', null, 'Active',
        'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'System Root')
    `).run(adminRes.lastInsertRowid);

    console.log('[DB] Admin user created (admin@shinetek.com / Admin@1234)');
  }

  const salt = await bcrypt.genSalt(10);
  const empPassHash = await bcrypt.hash('Password@123', salt);

  // List of all employees to ensure exist in SQLite
  const allEmployeesToSeed = [
    {
      id: 'SH-2005', email: 'johnathan.vance@shinetek.com',
      first: 'Johnathan', last: 'Vance', mid: 'E.', full: 'Johnathan E. Vance', phone: '+1 (555) 234-5678',
      role: 'Senior Software Engineer', dob: '1992-06-15',
      country: 'United States', state: 'California', city: 'Los Angeles', zip: '90001', address: '742 Evergreen Terrace, Apt 4B',
      startDate: '2026-01-01', status: 'Active', regStatus: 'Approved'
    },
    {
      id: 'SH-2006', email: 'emily.chen@shinetek.com',
      first: 'Emily', last: 'Chen', mid: '', full: 'Emily Chen', phone: '+1 (555) 456-7890',
      role: 'Senior UX/UI Designer', dob: '1995-11-20',
      country: 'United States', state: 'California', city: 'San Francisco', zip: '94105', address: '500 Howard Street, Suite 300',
      startDate: '2026-02-01', status: 'Active', regStatus: 'Approved'
    },
    {
      id: 'SH-2007', email: 'marcus.brody@shinetek.com',
      first: 'Marcus', last: 'Brody', mid: '', full: 'Marcus Brody', phone: '+1 (555) 789-0123',
      role: 'Cloud Solutions Architect', dob: '1990-03-08',
      country: 'United States', state: 'Texas', city: 'Austin', zip: '78701', address: '1200 Congress Ave',
      startDate: '2025-06-01', status: 'Active', regStatus: 'Approved'
    },
    {
      id: 'SH-2008', email: 'rajesh.sharma@shinetek.com',
      first: 'Rajesh', last: 'Sharma', mid: '', full: 'Rajesh Sharma', phone: '+91 98765 43210',
      role: 'Lead Full Stack Engineer', dob: '1993-04-18',
      country: 'India', state: 'Karnataka', city: 'Bengaluru', zip: '560001', address: '12 MG Road, Indiranagar',
      startDate: '2025-08-01', status: 'Active', regStatus: 'Approved'
    },
    {
      id: 'SH-2009', email: 'priya.patel@shinetek.com',
      first: 'Priya', last: 'Patel', mid: '', full: 'Priya Patel', phone: '+91 91234 56789',
      role: 'Senior QA Automation Engineer', dob: '1996-09-24',
      country: 'India', state: 'Maharashtra', city: 'Pune', zip: '411001', address: '45 Koregaon Park',
      startDate: '2025-11-15', status: 'Active', regStatus: 'Approved'
    },
    {
      id: 'SH-2010', email: 'ananya.reddy@shinetek.com',
      first: 'Ananya', last: 'Reddy', mid: '', full: 'Ananya Reddy', phone: '+91 99887 76655',
      role: 'DevOps & Cloud Engineer', dob: '1994-12-05',
      country: 'India', state: 'Telangana', city: 'Hyderabad', zip: '500081', address: '88 HITEC City, Madhapur',
      startDate: '2026-01-10', status: 'Active', regStatus: 'Approved'
    },
    {
      id: 'SH-2011', email: 'vikram.verma@shinetek.com',
      first: 'Vikram', last: 'Verma', mid: '', full: 'Vikram Verma', phone: '+91 98450 11223',
      role: 'Staff Data Engineer', dob: '1991-08-14',
      country: 'India', state: 'Delhi NCR', city: 'Gurugram', zip: '122002', address: 'DLF Cyber City, Tower B',
      startDate: '2025-05-01', status: 'Active', regStatus: 'Approved'
    },
    // Applicants in Pending Review & Needs Correction for Admin Approvals
    {
      id: 'SH-2012', email: 'amitabh.banerjee@shinetek.com',
      first: 'Amitabh', last: 'Banerjee', mid: 'K.', full: 'Amitabh K. Banerjee', phone: '+91 98300 45678',
      role: 'Cloud Security Specialist', dob: '1991-03-12',
      country: 'India', state: 'West Bengal', city: 'Kolkata', zip: '700091', address: 'Salt Lake Sector V, Block EP',
      startDate: '2026-03-01', status: 'Active', regStatus: 'Pending Review'
    },
    {
      id: 'SH-2013', email: 'sarah.jenkins@shinetek.com',
      first: 'Sarah', last: 'Jenkins', mid: 'M.', full: 'Sarah M. Jenkins', phone: '+1 (555) 678-9012',
      role: 'DevSecOps Consultant', dob: '1994-07-22',
      country: 'United States', state: 'Washington', city: 'Seattle', zip: '98101', address: '1400 4th Ave, Suite 500',
      startDate: '2026-03-01', status: 'Active', regStatus: 'Pending Review'
    },
    {
      id: 'SH-2014', email: 'deepak.gupta@shinetek.com',
      first: 'Deepak', last: 'Gupta', mid: '', full: 'Deepak Gupta', phone: '+91 98111 22334',
      role: 'Full Stack Engineer', dob: '1995-10-10',
      country: 'India', state: 'Uttar Pradesh', city: 'Noida', zip: '201301', address: 'Sector 62, Innovation Hub',
      startDate: '2026-03-01', status: 'Active', regStatus: 'Needs Correction'
    }
  ];

  // 1. Ensure all employees and user accounts exist
  for (const emp of allEmployeesToSeed) {
    let userRow = db.prepare('SELECT id FROM users WHERE employee_id = ?').get(emp.id);
    if (!userRow) {
      const res = db.prepare(`
        INSERT INTO users (employee_id, email, password_hash, role, status)
        VALUES (?, ?, ?, 'employee', 'active')
      `).run(emp.id, emp.email, empPassHash);
      userRow = { id: res.lastInsertRowid };
    }

    const empRow = db.prepare('SELECT id FROM employees WHERE employee_id = ?').get(emp.id);
    if (!empRow) {
      db.prepare(`
        INSERT INTO employees (
          user_id, employee_id, first_name, last_name, middle_initial, full_name, email, phone, designation,
          date_of_birth, country, state, city, zip_code, address,
          start_date, employment_status, registration_status, submitted_at, reviewed_at, reviewed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', ?, CURRENT_TIMESTAMP, ?, 'admin@shinetek.com')
      `).run(
        userRow.id, emp.id, emp.first, emp.last, emp.mid, emp.full, emp.email, emp.phone, emp.role,
        emp.dob, emp.country, emp.state, emp.city, emp.zip, emp.address, emp.startDate,
        emp.regStatus, emp.regStatus === 'Approved' ? new Date().toISOString() : null
      );
    } else {
      db.prepare('UPDATE employees SET country = ?, designation = ?, registration_status = ? WHERE employee_id = ?').run(emp.country, emp.role, emp.regStatus, emp.id);
    }
  }

  // 2. Ensure Sample Documents exist for pending applicants
  const sampleDocs = [
    { empId: 'SH-2012', type: 'passport', name: 'India_Passport_Amitabh.pdf', path: 'sample_passport_johnathan.jpg', size: 1450000, mime: 'application/pdf', status: 'Pending Review' },
    { empId: 'SH-2012', type: 'w4', name: 'Form16_Tax_Amitabh.pdf', path: 'sample_w4_johnathan.pdf', size: 245000, mime: 'application/pdf', status: 'Pending Review' },
    { empId: 'SH-2013', type: 'i9', name: 'Form_I9_Sarah.pdf', path: 'sample_i9_johnathan.pdf', size: 310000, mime: 'application/pdf', status: 'Pending Review' },
    { empId: 'SH-2013', type: 'visa', name: 'Work_Authorization_Sarah.pdf', path: 'sample_visa_johnathan.pdf', size: 420000, mime: 'application/pdf', status: 'Pending Review' },
    { empId: 'SH-2014', type: 'w4', name: 'Tax_Document_Deepak.pdf', path: 'sample_w4_emily.pdf', size: 180000, mime: 'application/pdf', status: 'Needs Correction' }
  ];

  for (const d of sampleDocs) {
    const exists = db.prepare('SELECT id FROM documents WHERE employee_id = ? AND document_type = ?').get(d.empId, d.type);
    if (!exists) {
      db.prepare(`
        INSERT INTO documents (employee_id, document_type, file_name, file_path, file_size, mime_type, status, uploaded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(d.empId, d.type, d.name, d.path, d.size, d.mime, d.status);
    }
  }

  // 3. Ensure sample Timesheets exist in SQLite
  const sampleTimesheets = [
    { empId: 'SH-2005', name: 'Johnathan Vance', vendor: 'Apex Systems', start: '2026-02-01', end: '2026-02-15', hours: 80.0, file: 'timesheet_johnathan_jan1.csv', notes: 'Completed cloud feature sprint', status: 'Pending' },
    { empId: 'SH-2005', name: 'Johnathan Vance', vendor: 'Apex Systems', start: '2026-01-16', end: '2026-01-31', hours: 76.0, file: 'timesheet_johnathan_jan1.csv', notes: 'Infrastructure setup', status: 'Approved' },
    { empId: 'SH-2008', name: 'Rajesh Sharma', vendor: 'Tata Consultancy Services (TCS)', start: '2026-02-01', end: '2026-02-15', hours: 80.0, file: 'timesheet_johnathan_jan1.csv', notes: 'Platform core microservices', status: 'Approved' },
    { empId: 'SH-2009', name: 'Priya Patel', vendor: 'Infosys Technologies', start: '2026-02-01', end: '2026-02-15', hours: 80.0, file: 'timesheet_emily_feb1.csv', notes: 'Automated test suite execution', status: 'Pending' },
    { empId: 'SH-2010', name: 'Ananya Reddy', vendor: 'Wipro Digital', start: '2026-02-01', end: '2026-02-15', hours: 80.0, file: 'timesheet_johnathan_jan1.csv', notes: 'CI/CD pipeline configuration', status: 'Pending' },
    { empId: 'SH-2011', name: 'Vikram Verma', vendor: 'HCL Technologies', start: '2026-02-01', end: '2026-02-15', hours: 84.0, file: 'timesheet_emily_feb1.csv', notes: 'Data ingestion pipeline', status: 'Pending' },
    { empId: 'SH-2006', name: 'Emily Chen', vendor: 'Insight Global', start: '2026-02-01', end: '2026-02-15', hours: 75.0, file: 'timesheet_emily_feb1.csv', notes: 'UX Design System', status: 'Approved' }
  ];

  for (const ts of sampleTimesheets) {
    const exists = db.prepare('SELECT id FROM timesheets WHERE employee_id = ? AND start_date = ? AND end_date = ?').get(ts.empId, ts.start, ts.end);
    if (!exists) {
      db.prepare(`
        INSERT INTO timesheets (
          employee_id, employee_name, vendor_name, start_date, end_date, total_hours, file_name, file_path, notes, status, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(ts.empId, ts.name, ts.vendor, ts.start, ts.end, ts.hours, ts.file, ts.file, ts.notes, ts.status);
    }
  }

  // 4. Ensure sample Payroll Statements (Payroll Management) exist
  const sampleStatements = [
    // Indian Statements (INR)
    { empId: 'SH-2008', start: '2026-01-01', end: '2026-01-31', gross: 185000.00, ded: 28500.00, net: 156500.00, cur: 'INR', date: '2026-01-31', status: 'Paid' },
    { empId: 'SH-2008', start: '2026-02-01', end: '2026-02-28', gross: 185000.00, ded: 28500.00, net: 156500.00, cur: 'INR', date: '2026-02-28', status: 'Paid' },
    { empId: 'SH-2009', start: '2026-01-01', end: '2026-01-31', gross: 135000.00, ded: 19200.00, net: 115800.00, cur: 'INR', date: '2026-01-31', status: 'Paid' },
    { empId: 'SH-2009', start: '2026-02-01', end: '2026-02-28', gross: 135000.00, ded: 19200.00, net: 115800.00, cur: 'INR', date: '2026-02-28', status: 'Paid' },
    { empId: 'SH-2010', start: '2026-02-01', end: '2026-02-28', gross: 160000.00, ded: 24000.00, net: 136000.00, cur: 'INR', date: '2026-03-05', status: 'Processing' },
    { empId: 'SH-2011', start: '2026-01-01', end: '2026-01-31', gross: 210000.00, ded: 32000.00, net: 178000.00, cur: 'INR', date: '2026-01-31', status: 'Paid' },
    { empId: 'SH-2011', start: '2026-02-01', end: '2026-02-28', gross: 210000.00, ded: 32000.00, net: 178000.00, cur: 'INR', date: '2026-02-28', status: 'Paid' },
    // US Statements (USD)
    { empId: 'SH-2005', start: '2026-01-01', end: '2026-01-15', gross: 5200.00, ded: 1150.00, net: 4050.00, cur: 'USD', date: '2026-01-20', status: 'Paid' },
    { empId: 'SH-2005', start: '2026-01-16', end: '2026-01-31', gross: 5200.00, ded: 1150.00, net: 4050.00, cur: 'USD', date: '2026-02-05', status: 'Paid' },
    { empId: 'SH-2005', start: '2026-02-01', end: '2026-02-15', gross: 5200.00, ded: 1150.00, net: 4050.00, cur: 'USD', date: '2026-02-20', status: 'Paid' },
    { empId: 'SH-2006', start: '2026-01-01', end: '2026-01-31', gross: 4800.00, ded: 980.00, net: 3820.00, cur: 'USD', date: '2026-02-05', status: 'Paid' },
    { empId: 'SH-2006', start: '2026-02-01', end: '2026-02-28', gross: 4800.00, ded: 980.00, net: 3820.00, cur: 'USD', date: '2026-03-05', status: 'Paid' },
    { empId: 'SH-2007', start: '2026-01-01', end: '2026-01-31', gross: 6100.00, ded: 1400.00, net: 4700.00, cur: 'USD', date: '2026-02-05', status: 'Paid' },
    { empId: 'SH-2007', start: '2026-02-01', end: '2026-02-28', gross: 6100.00, ded: 1400.00, net: 4700.00, cur: 'USD', date: '2026-03-05', status: 'Paid' }
  ];

  for (const st of sampleStatements) {
    const exists = db.prepare('SELECT id FROM payroll_records WHERE employee_id = ? AND pay_period_start = ? AND pay_period_end = ?').get(st.empId, st.start, st.end);
    if (!exists) {
      db.prepare(`
        INSERT INTO payroll_records (
          employee_id, pay_period_start, pay_period_end, gross_pay, deductions, net_pay, currency, payment_date, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(st.empId, st.start, st.end, st.gross, st.ded, st.net, st.cur, st.date, st.status);
    }
  }

  // 5. Ensure sample Payroll Billing Entries (Payroll Information) exist
  const sampleBillingEntries = [
    // Indian Billing Entries (INR)
    { emp_id: 'SH-2008', name: 'Rajesh Sharma', month: '2026-02', vendor: 'Tata Consultancy Services (TCS)', client: 'Shinetek Cloud Platform', hours: 160, bill: 1500, empRate: 1156.25, gross: 185000.00, cur: 'INR', country: 'India' },
    { emp_id: 'SH-2008', name: 'Rajesh Sharma', month: '2026-01', vendor: 'Tata Consultancy Services (TCS)', client: 'Shinetek Cloud Platform', hours: 160, bill: 1500, empRate: 1156.25, gross: 185000.00, cur: 'INR', country: 'India' },
    { emp_id: 'SH-2009', name: 'Priya Patel', month: '2026-02', vendor: 'Infosys Technologies', client: 'FinTech Global Corp', hours: 160, bill: 1200, empRate: 843.75, gross: 135000.00, cur: 'INR', country: 'India' },
    { emp_id: 'SH-2009', name: 'Priya Patel', month: '2026-01', vendor: 'Infosys Technologies', client: 'FinTech Global Corp', hours: 160, bill: 1200, empRate: 843.75, gross: 135000.00, cur: 'INR', country: 'India' },
    { emp_id: 'SH-2010', name: 'Ananya Reddy', month: '2026-02', vendor: 'Wipro Digital', client: 'Healthcare Nexus Platform', hours: 160, bill: 1400, empRate: 1000, gross: 160000.00, cur: 'INR', country: 'India' },
    { emp_id: 'SH-2011', name: 'Vikram Verma', month: '2026-02', vendor: 'HCL Technologies', client: 'Retail Logistics AI', hours: 168, bill: 1800, empRate: 1250, gross: 210000.00, cur: 'INR', country: 'India' },
    { emp_id: 'SH-2011', name: 'Vikram Verma', month: '2026-01', vendor: 'HCL Technologies', client: 'Retail Logistics AI', hours: 160, bill: 1800, empRate: 1250, gross: 200000.00, cur: 'INR', country: 'India' },
    // US Billing Entries (USD)
    { emp_id: 'SH-2005', name: 'Johnathan Vance', month: '2026-02', vendor: 'Apex Systems', client: 'Google Cloud Services', hours: 160, bill: 95, empRate: 65, gross: 10400.00, cur: 'USD', country: 'United States' },
    { emp_id: 'SH-2005', name: 'Johnathan Vance', month: '2026-01', vendor: 'Apex Systems', client: 'Google Cloud Services', hours: 160, bill: 95, empRate: 65, gross: 10400.00, cur: 'USD', country: 'United States' },
    { emp_id: 'SH-2006', name: 'Emily Chen', month: '2026-02', vendor: 'Insight Global', client: 'Meta Platforms', hours: 160, bill: 85, empRate: 60, gross: 9600.00, cur: 'USD', country: 'United States' },
    { emp_id: 'SH-2007', name: 'Marcus Brody', month: '2026-02', vendor: 'TEKsystems', client: 'Amazon Web Services', hours: 160, bill: 110, empRate: 75, gross: 12000.00, cur: 'USD', country: 'United States' }
  ];

  for (const b of sampleBillingEntries) {
    const exists = db.prepare('SELECT id FROM payroll_entries WHERE employee_id = ? AND payroll_month = ?').get(b.emp_id, b.month);
    if (!exists) {
      db.prepare(`
        INSERT INTO payroll_entries (
          employee_id, employee_name, payroll_month, vendor_name, client_name,
          total_hours, bill_rate, emp_bill_rate, gross_amount, currency, country
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(b.emp_id, b.name, b.month, b.vendor, b.client, b.hours, b.bill, b.empRate, b.gross, b.cur, b.country);
    }
  }

  // 6. Ensure sample Vendor Details exist
  const sampleVendors = [
    { empId: 'SH-2005', name: 'Johnathan Vance', vendor: 'Apex Systems', vAddr: 'Richmond, VA', client: 'Google Cloud Services', cAddr: 'Mountain View, CA', bill: 95, empRate: 65, bu: 30, visa: 'H-1B', tax: 8.5, net: 27.45 },
    { empId: 'SH-2008', name: 'Rajesh Sharma', vendor: 'Tata Consultancy Services (TCS)', vAddr: 'Mumbai, MH, India', client: 'Shinetek Cloud Platform', cAddr: 'Bengaluru, KA, India', bill: 1500, empRate: 1156.25, bu: 343.75, visa: 'H-1B', tax: 8.5, net: 314.53 },
    { empId: 'SH-2009', name: 'Priya Patel', vendor: 'Infosys Technologies', vAddr: 'Electronic City, Bengaluru, India', client: 'FinTech Global Corp', cAddr: 'Pune, MH, India', bill: 1200, empRate: 843.75, bu: 356.25, visa: 'OPT', tax: 2.5, net: 347.34 },
    { empId: 'SH-2010', name: 'Ananya Reddy', vendor: 'Wipro Digital', vAddr: 'Bengaluru, India', client: 'Healthcare Nexus Platform', cAddr: 'Hyderabad, India', bill: 1400, empRate: 1000, bu: 400, visa: 'H-1B', tax: 8.5, net: 366.00 },
    { empId: 'SH-2011', name: 'Vikram Verma', vendor: 'HCL Technologies', vAddr: 'Noida, India', client: 'Retail Logistics AI', cAddr: 'Gurugram, India', bill: 1800, empRate: 1250, bu: 550, visa: 'H-1B', tax: 8.5, net: 503.25 }
  ];

  for (const v of sampleVendors) {
    const exists = db.prepare('SELECT id FROM vendor_details WHERE employee_id = ?').get(v.empId);
    if (!exists) {
      db.prepare(`
        INSERT INTO vendor_details (
          employee_id, employee_name, vendor_name, vendor_address, client_name, client_address,
          hourly_bill_rate, employee_rate, bu_margin, visa_type, tax_percent, net_margin
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(v.empId, v.name, v.vendor, v.vAddr, v.client, v.cAddr, v.bill, v.empRate, v.bu, v.visa, v.tax, v.net);
    }
  }

  // Update sequence counter
  db.prepare("UPDATE system_settings SET value = '2015' WHERE key = 'id_current_seq'").run();

  console.log('[DB] Individual seed checks complete. All multi-national records, timesheets, approvals, and payroll verified in SQLite.');
}

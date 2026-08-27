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

  // Check if sample employees exist
  const existingEmp = db.prepare("SELECT id FROM employees WHERE employee_id = 'SH-2005'").get();
  if (!existingEmp) {
    const salt = await bcrypt.genSalt(10);
    const empPassHash = await bcrypt.hash('Password@123', salt);

    // Employee 1: SH-2005 (Approved & Active)
    const emp1User = db.prepare(`
      INSERT INTO users (employee_id, email, password_hash, role, status)
      VALUES ('SH-2005', 'johnathan.vance@shinetek.com', ?, 'employee', 'active')
    `).run(empPassHash);

    db.prepare(`
      INSERT INTO employees (
        user_id, employee_id, first_name, last_name, middle_initial, full_name, email, phone, designation,
        date_of_birth, country, state, city, zip_code, address,
        start_date, end_date, employment_status,
        registration_status, submitted_at, reviewed_at, reviewed_by
      ) VALUES (?, 'SH-2005', 'Johnathan', 'Vance', 'E.', 'Johnathan E. Vance', 'johnathan.vance@shinetek.com', '+1 (555) 234-5678', 'Senior Software Engineer',
        '1992-06-15', 'United States', 'California', 'Los Angeles', '90001', '742 Evergreen Terrace, Apt 4B',
        '2026-01-01', null, 'Active',
        'Approved', '2026-01-05 09:30:00', '2026-01-06 14:20:00', 'admin@shinetek.com')
    `).run(emp1User.lastInsertRowid);

    // Documents for Johnathan
    db.prepare("INSERT INTO documents (employee_id, document_type, file_name, file_path, file_size, mime_type, status, reviewed_at, reviewed_by) VALUES (?, 'w4', 'Form_W4_Vance.pdf', 'sample_w4_johnathan.pdf', 245120, 'application/pdf', 'Approved', CURRENT_TIMESTAMP, 'admin@shinetek.com')").run('SH-2005');
    db.prepare("INSERT INTO documents (employee_id, document_type, file_name, file_path, file_size, mime_type, status, reviewed_at, reviewed_by) VALUES (?, 'i9', 'Form_I9_Vance.pdf', 'sample_i9_johnathan.pdf', 312450, 'application/pdf', 'Approved', CURRENT_TIMESTAMP, 'admin@shinetek.com')").run('SH-2005');
    db.prepare("INSERT INTO documents (employee_id, document_type, file_name, file_path, file_size, mime_type, status, reviewed_at, reviewed_by) VALUES (?, 'passport', 'US_Passport_Vance.jpg', 'sample_passport_johnathan.jpg', 1845000, 'image/jpeg', 'Approved', CURRENT_TIMESTAMP, 'admin@shinetek.com')").run('SH-2005');
    db.prepare("INSERT INTO documents (employee_id, document_type, file_name, file_path, file_size, mime_type, status, reviewed_at, reviewed_by) VALUES (?, 'visa', 'US_Work_Auth_Vance.pdf', 'sample_visa_johnathan.pdf', 450120, 'application/pdf', 'Approved', CURRENT_TIMESTAMP, 'admin@shinetek.com')").run('SH-2005');

    // Timesheets for Johnathan
    db.prepare(`
      INSERT INTO timesheets (employee_id, employee_name, start_date, end_date, total_hours, file_name, file_path, notes, status, submitted_at, reviewed_at, reviewed_by)
      VALUES ('SH-2005', 'Johnathan E. Vance', '2026-01-01', '2026-01-15', 80.0, 'timesheet_jan1.csv', 'timesheet_johnathan_jan1.csv', 'Completed sprint deliverables', 'Approved', '2026-01-16 10:35:00', '2026-01-17 11:00:00', 'admin@shinetek.com')
    `).run();
    db.prepare(`
      INSERT INTO timesheets (employee_id, employee_name, start_date, end_date, total_hours, file_name, file_path, notes, status, submitted_at)
      VALUES ('SH-2005', 'Johnathan E. Vance', '2026-01-16', '2026-01-31', 76.0, 'timesheet_jan2.csv', 'timesheet_johnathan_jan1.csv', 'Architecture refactoring', 'Pending', '2026-02-01 09:15:00')
    `).run();

    // Payroll for Johnathan
    db.prepare(`
      INSERT INTO payroll_records (employee_id, pay_period_start, pay_period_end, gross_pay, deductions, net_pay, payment_date, payment_status)
      VALUES ('SH-2005', '2026-01-01', '2026-01-15', 5200.00, 1150.00, 4050.00, '2026-01-20', 'Paid')
    `).run();

    // Employee 2: SH-2006 (Pending Review & Active)
    const emp2User = db.prepare(`
      INSERT INTO users (employee_id, email, password_hash, role, status)
      VALUES ('SH-2006', 'emily.chen@shinetek.com', ?, 'employee', 'active')
    `).run(empPassHash);

    db.prepare(`
      INSERT INTO employees (
        user_id, employee_id, first_name, last_name, middle_initial, full_name, email, phone, designation,
        date_of_birth, country, state, city, zip_code, address,
        start_date, end_date, employment_status,
        registration_status, submitted_at
      ) VALUES (?, 'SH-2006', 'Emily', 'Chen', null, 'Emily Chen', 'emily.chen@shinetek.com', '+1 (555) 456-7890', 'Senior UX/UI Designer',
        '1995-11-20', 'United States', 'California', 'San Francisco', '94105', '500 Howard Street, Suite 300',
        '2026-02-01', null, 'Active',
        'Pending Review', '2026-02-10 16:45:00')
    `).run(emp2User.lastInsertRowid);

    db.prepare("INSERT INTO documents (employee_id, document_type, file_name, file_path, file_size, mime_type, status) VALUES (?, 'w4', 'Chen_W4_2026.pdf', 'sample_w4_emily.pdf', 210000, 'application/pdf', 'Uploaded')").run('SH-2006');
    db.prepare("INSERT INTO documents (employee_id, document_type, file_name, file_path, file_size, mime_type, status) VALUES (?, 'i9', 'Chen_I9_Form.pdf', 'sample_i9_emily.pdf', 290000, 'application/pdf', 'Uploaded')").run('SH-2006');

    // Employee 3: SH-2007 (Inactive / Ended Sample)
    const emp3User = db.prepare(`
      INSERT INTO users (employee_id, email, password_hash, role, status)
      VALUES ('SH-2007', 'marcus.brody@shinetek.com', ?, 'employee', 'suspended')
    `).run(empPassHash);

    db.prepare(`
      INSERT INTO employees (
        user_id, employee_id, first_name, last_name, middle_initial, full_name, email, phone, designation,
        date_of_birth, country, state, city, zip_code, address,
        start_date, end_date, employment_status,
        registration_status, admin_notes, submitted_at, reviewed_at, reviewed_by
      ) VALUES (?, 'SH-2007', 'Marcus', 'Brody', null, 'Marcus Brody', 'marcus.brody@shinetek.com', '+1 (555) 789-0123', 'Cloud Solutions Architect',
        '1990-03-08', 'United States', 'Texas', 'Austin', '78701', '1200 Congress Ave',
        '2025-06-01', '2026-02-15', 'Inactive',
        'Needs Correction', 'Please re-upload your W-4 form as page 2 was missing the signature.', '2026-02-08 11:20:00', '2026-02-09 10:15:00', 'admin@shinetek.com')
    `).run(emp3User.lastInsertRowid);

    db.prepare("INSERT INTO documents (employee_id, document_type, file_name, file_path, file_size, mime_type, status, review_notes, reviewed_at, reviewed_by) VALUES (?, 'w4', 'Marcus_W4.pdf', 'sample_w4_marcus.pdf', 195000, 'application/pdf', 'Needs Replacement', 'Page 2 is missing signature. Please re-upload with clear signature.', CURRENT_TIMESTAMP, 'admin@shinetek.com')").run('SH-2007');

    // Employee 4 (India): SH-2008 (Rajesh Sharma - Lead Full Stack Engineer)
    const emp4User = db.prepare(`
      INSERT INTO users (employee_id, email, password_hash, role, status)
      VALUES ('SH-2008', 'rajesh.sharma@shinetek.com', ?, 'employee', 'active')
    `).run(empPassHash);

    db.prepare(`
      INSERT INTO employees (
        user_id, employee_id, first_name, last_name, middle_initial, full_name, email, phone, designation,
        date_of_birth, country, state, city, zip_code, address,
        start_date, end_date, employment_status,
        registration_status, submitted_at, reviewed_at, reviewed_by
      ) VALUES (?, 'SH-2008', 'Rajesh', 'Sharma', null, 'Rajesh Sharma', 'rajesh.sharma@shinetek.com', '+91 98765 43210', 'Lead Full Stack Engineer',
        '1993-04-18', 'India', 'Karnataka', 'Bengaluru', '560001', '12 MG Road, Indiranagar',
        '2025-08-01', null, 'Active',
        'Approved', '2025-08-01 09:00:00', '2025-08-02 11:00:00', 'admin@shinetek.com')
    `).run(emp4User.lastInsertRowid);

    // Indian Payroll Records for Rajesh Sharma (INR)
    db.prepare(`
      INSERT INTO payroll_records (employee_id, pay_period_start, pay_period_end, gross_pay, deductions, net_pay, currency, payment_date, payment_status)
      VALUES ('SH-2008', '2026-01-01', '2026-01-31', 185000.00, 28500.00, 156500.00, 'INR', '2026-01-31', 'Paid')
    `).run();
    db.prepare(`
      INSERT INTO payroll_records (employee_id, pay_period_start, pay_period_end, gross_pay, deductions, net_pay, currency, payment_date, payment_status)
      VALUES ('SH-2008', '2026-02-01', '2026-02-28', 185000.00, 28500.00, 156500.00, 'INR', '2026-02-28', 'Paid')
    `).run();

    // Employee 5 (India): SH-2009 (Priya Patel - Senior QA Automation Engineer)
    const emp5User = db.prepare(`
      INSERT INTO users (employee_id, email, password_hash, role, status)
      VALUES ('SH-2009', 'priya.patel@shinetek.com', ?, 'employee', 'active')
    `).run(empPassHash);

    db.prepare(`
      INSERT INTO employees (
        user_id, employee_id, first_name, last_name, middle_initial, full_name, email, phone, designation,
        date_of_birth, country, state, city, zip_code, address,
        start_date, end_date, employment_status,
        registration_status, submitted_at, reviewed_at, reviewed_by
      ) VALUES (?, 'SH-2009', 'Priya', 'Patel', null, 'Priya Patel', 'priya.patel@shinetek.com', '+91 91234 56789', 'Senior QA Automation Engineer',
        '1996-09-24', 'India', 'Maharashtra', 'Pune', '411001', '45 Koregaon Park',
        '2025-11-15', null, 'Active',
        'Approved', '2025-11-15 10:00:00', '2025-11-16 14:30:00', 'admin@shinetek.com')
    `).run(emp5User.lastInsertRowid);

    // Indian Payroll Records for Priya Patel (INR)
    db.prepare(`
      INSERT INTO payroll_records (employee_id, pay_period_start, pay_period_end, gross_pay, deductions, net_pay, currency, payment_date, payment_status)
      VALUES ('SH-2009', '2026-01-01', '2026-01-31', 135000.00, 19200.00, 115800.00, 'INR', '2026-01-31', 'Paid')
    `).run();
    db.prepare(`
      INSERT INTO payroll_records (employee_id, pay_period_start, pay_period_end, gross_pay, deductions, net_pay, currency, payment_date, payment_status)
      VALUES ('SH-2009', '2026-02-01', '2026-02-28', 135000.00, 19200.00, 115800.00, 'INR', '2026-02-28', 'Paid')
    `).run();

    // Employee 6 (India): SH-2010 (Ananya Reddy - DevOps & Cloud Engineer)
    const emp6User = db.prepare(`
      INSERT INTO users (employee_id, email, password_hash, role, status)
      VALUES ('SH-2010', 'ananya.reddy@shinetek.com', ?, 'employee', 'active')
    `).run(empPassHash);

    db.prepare(`
      INSERT INTO employees (
        user_id, employee_id, first_name, last_name, middle_initial, full_name, email, phone, designation,
        date_of_birth, country, state, city, zip_code, address,
        start_date, end_date, employment_status,
        registration_status, submitted_at, reviewed_at, reviewed_by
      ) VALUES (?, 'SH-2010', 'Ananya', 'Reddy', null, 'Ananya Reddy', 'ananya.reddy@shinetek.com', '+91 99887 76655', 'DevOps & Cloud Engineer',
        '1994-12-05', 'India', 'Telangana', 'Hyderabad', '500081', '88 HITEC City, Madhapur',
        '2026-01-10', null, 'Active',
        'Approved', '2026-01-10 11:15:00', '2026-01-11 16:00:00', 'admin@shinetek.com')
    `).run(emp6User.lastInsertRowid);

    // Indian Payroll Record for Ananya Reddy (INR)
    db.prepare(`
      INSERT INTO payroll_records (employee_id, pay_period_start, pay_period_end, gross_pay, deductions, net_pay, currency, payment_date, payment_status)
      VALUES ('SH-2010', '2026-02-01', '2026-02-28', 160000.00, 24000.00, 136000.00, 'INR', '2026-03-05', 'Processing')
    `).run();

    // Employee 7 (India): SH-2011 (Vikram Verma - Staff Data Engineer)
    const emp7User = db.prepare(`
      INSERT INTO users (employee_id, email, password_hash, role, status)
      VALUES ('SH-2011', 'vikram.verma@shinetek.com', ?, 'employee', 'active')
    `).run(empPassHash);

    db.prepare(`
      INSERT INTO employees (
        user_id, employee_id, first_name, last_name, middle_initial, full_name, email, phone, designation,
        date_of_birth, country, state, city, zip_code, address,
        start_date, end_date, employment_status,
        registration_status, submitted_at, reviewed_at, reviewed_by
      ) VALUES (?, 'SH-2011', 'Vikram', 'Verma', null, 'Vikram Verma', 'vikram.verma@shinetek.com', '+91 98450 11223', 'Staff Data Engineer',
        '1991-08-14', 'India', 'Delhi NCR', 'Gurugram', '122002', 'DLF Cyber City, Tower B',
        '2025-05-01', null, 'Active',
        'Approved', '2025-05-01 10:00:00', '2025-05-02 14:00:00', 'admin@shinetek.com')
    `).run(emp7User.lastInsertRowid);

    // Indian Payroll Records for Vikram Verma (INR)
    db.prepare(`
      INSERT INTO payroll_records (employee_id, pay_period_start, pay_period_end, gross_pay, deductions, net_pay, currency, payment_date, payment_status)
      VALUES ('SH-2011', '2026-01-01', '2026-01-31', 210000.00, 32000.00, 178000.00, 'INR', '2026-01-31', 'Paid')
    `).run();
    db.prepare(`
      INSERT INTO payroll_records (employee_id, pay_period_start, pay_period_end, gross_pay, deductions, net_pay, currency, payment_date, payment_status)
      VALUES ('SH-2011', '2026-02-01', '2026-02-28', 210000.00, 32000.00, 178000.00, 'INR', '2026-02-28', 'Paid')
    `).run();

    // US Payroll Records for Emily Chen and Marcus Brody
    db.prepare(`
      INSERT INTO payroll_records (employee_id, pay_period_start, pay_period_end, gross_pay, deductions, net_pay, currency, payment_date, payment_status)
      VALUES ('SH-2006', '2026-01-01', '2026-01-15', 4800.00, 980.00, 3820.00, 'USD', '2026-01-20', 'Paid')
    `).run();
    db.prepare(`
      INSERT INTO payroll_records (employee_id, pay_period_start, pay_period_end, gross_pay, deductions, net_pay, currency, payment_date, payment_status)
      VALUES ('SH-2007', '2026-01-01', '2026-01-15', 6100.00, 1400.00, 4700.00, 'USD', '2026-01-20', 'Paid')
    `).run();

    // Initial sequence update
    db.prepare("UPDATE system_settings SET value = '2012' WHERE key = 'id_current_seq'").run();

    console.log('[DB] Sample employees and Indian payroll seeded (SH-2005 to SH-2011). Next ID set to SH-2012.');
  }

  // Ensure Payroll Billing Entries (Payroll Information) exist in SQLite
  try {
    const existingEntriesCount = db.prepare('SELECT count(*) as c FROM payroll_entries').get().c;
    if (existingEntriesCount === 0) {
      const sampleEntries = [
        // Indian Employee Billing Entries (INR)
        { emp_id: 'SH-2008', name: 'Rajesh Sharma', month: '2026-02', vendor: 'Tata Consultancy Services (TCS)', client: 'Shinetek Cloud Platform', hours: 160, bill_rate: 1500, emp_rate: 1156.25, gross: 185000.00, cur: 'INR', country: 'India' },
        { emp_id: 'SH-2008', name: 'Rajesh Sharma', month: '2026-01', vendor: 'Tata Consultancy Services (TCS)', client: 'Shinetek Cloud Platform', hours: 160, bill_rate: 1500, emp_rate: 1156.25, gross: 185000.00, cur: 'INR', country: 'India' },
        { emp_id: 'SH-2009', name: 'Priya Patel', month: '2026-02', vendor: 'Infosys Technologies', client: 'FinTech Global Corp', hours: 160, bill_rate: 1200, emp_rate: 843.75, gross: 135000.00, cur: 'INR', country: 'India' },
        { emp_id: 'SH-2009', name: 'Priya Patel', month: '2026-01', vendor: 'Infosys Technologies', client: 'FinTech Global Corp', hours: 160, bill_rate: 1200, emp_rate: 843.75, gross: 135000.00, cur: 'INR', country: 'India' },
        { emp_id: 'SH-2010', name: 'Ananya Reddy', month: '2026-02', vendor: 'Wipro Digital', client: 'Healthcare Nexus Platform', hours: 160, bill_rate: 1400, emp_rate: 1000, gross: 160000.00, cur: 'INR', country: 'India' },
        { emp_id: 'SH-2011', name: 'Vikram Verma', month: '2026-02', vendor: 'HCL Technologies', client: 'Retail Logistics AI', hours: 168, bill_rate: 1800, emp_rate: 1250, gross: 210000.00, cur: 'INR', country: 'India' },
        // US / Foreign Employee Billing Entries (USD)
        { emp_id: 'SH-2005', name: 'Johnathan Vance', month: '2026-02', vendor: 'Apex Systems', client: 'Google Cloud Services', hours: 160, bill_rate: 95, emp_rate: 65, gross: 10400.00, cur: 'USD', country: 'United States' },
        { emp_id: 'SH-2005', name: 'Johnathan Vance', month: '2026-01', vendor: 'Apex Systems', client: 'Google Cloud Services', hours: 160, bill_rate: 95, emp_rate: 65, gross: 10400.00, cur: 'USD', country: 'United States' },
        { emp_id: 'SH-2006', name: 'Emily Chen', month: '2026-02', vendor: 'Insight Global', client: 'Meta Platforms', hours: 160, bill_rate: 85, emp_rate: 60, gross: 9600.00, cur: 'USD', country: 'United States' },
        { emp_id: 'SH-2007', name: 'Marcus Brody', month: '2026-02', vendor: 'TEKsystems', client: 'Amazon Web Services', hours: 160, bill_rate: 110, emp_rate: 75, gross: 12000.00, cur: 'USD', country: 'United States' }
      ];

      const stmt = db.prepare(`
        INSERT INTO payroll_entries (
          employee_id, employee_name, payroll_month, vendor_name, client_name,
          total_hours, bill_rate, emp_bill_rate, gross_amount, currency, country
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      sampleEntries.forEach(s => {
        stmt.run(s.emp_id, s.name, s.month, s.vendor, s.client, s.hours, s.bill_rate, s.emp_rate, s.gross, s.cur, s.country);
      });
      console.log('[DB] Sample Payroll Billing Entries seeded into SQLite.');
    }
  } catch (peErr) {
    console.warn('[DB] payroll_entries seeding notice:', peErr.message);
  }

  // Ensure Vendor Details exist in SQLite
  try {
    const existingVendorsCount = db.prepare('SELECT count(*) as c FROM vendor_details').get().c;
    if (existingVendorsCount === 0) {
      db.prepare(`
        INSERT INTO vendor_details (
          employee_id, employee_name, vendor_name, vendor_address, client_name, client_address,
          hourly_bill_rate, employee_rate, bu_margin, visa_type, tax_percent, net_margin
        ) VALUES
        ('SH-2005', 'Johnathan Vance', 'Apex Systems', 'Richmond, VA', 'Google Cloud Services', 'Mountain View, CA', 95.0, 65.0, 30.0, 'H-1B', 8.5, 27.45),
        ('SH-2008', 'Rajesh Sharma', 'Tata Consultancy Services (TCS)', 'Mumbai, India', 'Shinetek Cloud Platform', 'Bengaluru, India', 1500.0, 1156.25, 343.75, 'H-1B', 8.5, 314.53),
        ('SH-2009', 'Priya Patel', 'Infosys Technologies', 'Bengaluru, India', 'FinTech Global Corp', 'Pune, India', 1200.0, 843.75, 356.25, 'OPT', 2.5, 347.34)
      `).run();
      console.log('[DB] Sample Vendor Details seeded into SQLite.');
    }
  } catch (vdErr) {
    console.warn('[DB] vendor_details seeding notice:', vdErr.message);
  }
}

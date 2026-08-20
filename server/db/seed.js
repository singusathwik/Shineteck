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

    // Notifications
    db.prepare("INSERT INTO notifications (employee_id, title, message, type) VALUES ('SH-2005', 'Registration Approved', 'Welcome to Shinetek Inc.! Your onboarding profile and documents have been approved.', 'success')").run();
    db.prepare("INSERT INTO notifications (employee_id, title, message, type) VALUES ('SH-2005', 'Timesheet Approved', 'Your timesheet for Jan 01 - Jan 15 has been approved by HR.', 'success')").run();
    db.prepare("INSERT INTO notifications (employee_id, title, message, type) VALUES ('SH-2006', 'Registration Under Review', 'Your employee onboarding submission is currently being reviewed by the HR team.', 'info')").run();
    db.prepare("INSERT INTO notifications (employee_id, title, message, type) VALUES ('SH-2007', 'Document Action Required', 'Your W-4 document requires replacement. Reason: Page 2 is missing signature.', 'warning')").run();

    // Initial sequence update
    db.prepare("UPDATE system_settings SET value = '2008' WHERE key = 'id_current_seq'").run();

    console.log('[DB] Sample employees seeded (SH-2005, SH-2006, SH-2007). Next ID set to SH-2008.');
  }
}

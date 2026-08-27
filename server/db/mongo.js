import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import dns from 'dns';
import {
  User,
  Employee,
  Document,
  Timesheet,
  Payroll,
  SystemSetting,
  Notification,
  AuditLog
} from '../models/index.js';

dotenv.config();

// Ensure SRV DNS records resolve reliably across Windows and various ISP networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // Ignore if custom DNS set fails in restricted environments
}

let isConnected = false;

// Attach global error listener on Mongoose connection to prevent unhandled error events
mongoose.connection.on('error', (err) => {
  console.warn('[MongoDB Connection Warning]', err.message);
});

export async function connectMongoDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.trim() === '') {
    console.log('[MongoDB Atlas] No MONGODB_URI configured. Running with SQLite database engine.');
    isConnected = false;
    return false;
  }

  const effectiveUri = mongoUri.trim();

  // Detect unreplaced template placeholders or angle brackets
  if (effectiveUri.includes('<') && effectiveUri.includes('>')) {
    console.warn('[MongoDB Atlas Notice] Angle brackets `<...>` detected in your MONGODB_URI.');
    console.warn('[MongoDB Atlas Notice] Please remove the `<` and `>` characters and insert your actual database password in .env.');
    isConnected = false;
    return false;
  }

  try {
    const maskedUri = effectiveUri.replace(/:[^:@]+@/, ':****@');
    console.log(`[MongoDB Atlas] Connecting to cluster (${maskedUri})...`);
    
    await mongoose.connect(effectiveUri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000
    });

    isConnected = true;
    console.log('[MongoDB Atlas] Connected successfully to Cloud Database.');

    // Seed default settings and admin in MongoDB if empty
    await seedMongoDefaults();

    return true;
  } catch (err) {
    console.warn('[MongoDB Atlas Warning] Could not connect to Atlas instance:', err.message);
    console.warn('[MongoDB Notice] Continuing with built-in SQLite engine.');
    isConnected = false;
    return false;
  }
}

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

// Seed default system settings and admin in MongoDB
async function seedMongoDefaults() {
  try {
    // 1. Settings
    const settingCount = await SystemSetting.countDocuments();
    if (settingCount === 0) {
      await SystemSetting.create([
        { key: 'id_prefix', value: 'SH-', description: 'Employee ID prefix' },
        { key: 'id_start_number', value: '2005', description: 'Starting number' },
        { key: 'id_min_length', value: '4', description: 'Minimum padding length' },
        { key: 'id_current_seq', value: '2008', description: 'Next sequence counter' }
      ]);
      console.log('[MongoDB] Initial system ID settings seeded.');
    }

    // 2. Admin account
    const adminExists = await User.findOne({ email: 'admin@shinetek.com' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const adminPassHash = await bcrypt.hash('Admin@1234', salt);

      const adminUser = await User.create({
        employee_id: 'ADMIN-001',
        email: 'admin@shinetek.com',
        password_hash: adminPassHash,
        role: 'admin',
        status: 'active'
      });

      await Employee.create({
        user_id: adminUser._id,
        employee_id: 'ADMIN-001',
        first_name: 'System',
        last_name: 'Administrator',
        middle_initial: '',
        full_name: 'System Administrator',
        email: 'admin@shinetek.com',
        phone: '+1 (555) 019-2831',
        designation: 'HR & Systems Administrator',
        dateOfBirth: '1988-04-12',
        date_of_birth: '1988-04-12',
        country: 'United States',
        state: 'California',
        city: 'Los Angeles',
        zip_code: '90001',
        address: '100 Corporate Plaza, Suite 400',
        start_date: '2024-01-15',
        end_date: null,
        employment_status: 'Active',
        registration_status: 'Approved',
        reviewed_by: 'System Root'
      });

      console.log('[MongoDB] Default Admin created: admin@shinetek.com / Admin@1234');
    }

    // 3. Sample Employee: Johnathan Vance (SH-2005)
    const emp1Exists = await User.findOne({ employee_id: 'SH-2005' });
    if (!emp1Exists) {
      const salt = await bcrypt.genSalt(10);
      const empPassHash = await bcrypt.hash('Password@123', salt);

      const emp1 = await User.create({
        employee_id: 'SH-2005',
        email: 'johnathan.vance@shinetek.com',
        password_hash: empPassHash,
        role: 'employee',
        status: 'active'
      });

      await Employee.create({
        user_id: emp1._id,
        employee_id: 'SH-2005',
        first_name: 'Johnathan',
        last_name: 'Vance',
        middle_initial: 'E.',
        full_name: 'Johnathan E. Vance',
        email: 'johnathan.vance@shinetek.com',
        phone: '+1 (555) 234-5678',
        designation: 'Senior Software Engineer',
        date_of_birth: '1992-06-15',
        country: 'United States',
        state: 'California',
        city: 'Los Angeles',
        zip_code: '90001',
        address: '742 Evergreen Terrace, Apt 4B',
        start_date: '2026-01-01',
        end_date: null,
        employment_status: 'Active',
        registration_status: 'Approved',
        reviewed_by: 'admin@shinetek.com'
      });

      // Sample Documents
      await Document.create([
        { employee_id: 'SH-2005', document_type: 'w4', file_name: 'Form_W4_Vance.pdf', file_path: 'sample_w4_johnathan.pdf', file_size: 245120, mime_type: 'application/pdf', status: 'Approved' },
        { employee_id: 'SH-2005', document_type: 'i9', file_name: 'Form_I9_Vance.pdf', file_path: 'sample_i9_johnathan.pdf', file_size: 312450, mime_type: 'application/pdf', status: 'Approved' },
        { employee_id: 'SH-2005', document_type: 'passport', file_name: 'US_Passport_Vance.jpg', file_path: 'sample_passport_johnathan.jpg', file_size: 1845000, mime_type: 'image/jpeg', status: 'Approved' },
        { employee_id: 'SH-2005', document_type: 'visa', file_name: 'US_Work_Auth_Vance.pdf', file_path: 'sample_visa_johnathan.pdf', file_size: 450120, mime_type: 'application/pdf', status: 'Approved' }
      ]);

      // Sample Timesheet
      await Timesheet.create({
        employee_id: 'SH-2005',
        employee_name: 'Johnathan Vance',
        start_date: '2026-01-01',
        end_date: '2026-01-15',
        total_hours: 80.0,
        file_name: 'timesheet_jan1.csv',
        file_path: 'timesheet_johnathan_jan1.csv',
        notes: 'Completed sprint deliverables',
        status: 'Approved'
      });

      // Sample Payroll
      await Payroll.create({
        employee_id: 'SH-2005',
        pay_period_start: '2026-01-01',
        pay_period_end: '2026-01-15',
        gross_pay: 5200.00,
        deductions: 1150.00,
        net_pay: 4050.00,
        payment_date: '2026-01-20',
        payment_status: 'Paid'
      });

      console.log('[MongoDB] Sample employee SH-2005 seeded into MongoDB.');
    }
  } catch (err) {
    console.error('[MongoDB Seed Error]', err.message);
  }
}

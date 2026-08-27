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
  AuditLog,
  VendorDetail,
  PayrollEntry
} from '../models/index.js';

dotenv.config();

// Ensure SRV DNS records resolve reliably on Windows local environments without breaking cloud containers
if (process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (dnsErr) {}
}

let isConnected = false;

// Attach global error listener on Mongoose connection to prevent unhandled error events
mongoose.connection.on('error', (err) => {
  // Silent or single line notice
  if (!isConnected) return;
  console.warn('[MongoDB Connection Warning]', err.message);
});

export async function connectMongoDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.trim() === '') {
    console.log('[Database Engine] Running with built-in SQLite engine.');
    isConnected = false;
    return false;
  }

  const effectiveUri = mongoUri.trim();

  // Detect unreplaced template placeholders or angle brackets
  if (effectiveUri.includes('<') && effectiveUri.includes('>')) {
    console.warn('[MongoDB Atlas Notice] Angle brackets `<...>` detected in your MONGODB_URI.');
    console.warn('[MongoDB Atlas Notice] Please remove `<` and `>` and insert your actual database password.');
    isConnected = false;
    return false;
  }

  try {
    const maskedUri = effectiveUri.replace(/:[^:@]+@/, ':****@');
    console.log(`[MongoDB Atlas] Connecting to cluster (${maskedUri})...`);
    
    await mongoose.connect(effectiveUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      family: 4 // Use IPv4, skip IPv6 issues
    });

    isConnected = true;
    console.log('[MongoDB Atlas] Connected successfully to Cloud Database.');

    // Seed default settings and admin in MongoDB if empty
    await seedMongoDefaults();

    return true;
  } catch (err) {
    console.warn('[MongoDB Atlas] Cloud cluster unreachable (IP whitelist required in Atlas dashboard: Network Access -> + Add IP -> Allow From Anywhere 0.0.0.0/0).');
    console.log('[Database Engine] Active and running with built-in SQLite engine (all data persisted and operational).');
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

      // Sample US Payroll
      await Payroll.create({
        employee_id: 'SH-2005',
        pay_period_start: '2026-01-01',
        pay_period_end: '2026-01-15',
        gross_pay: 5200.00,
        deductions: 1150.00,
        net_pay: 4050.00,
        currency: 'USD',
        payment_date: '2026-01-20',
        payment_status: 'Paid'
      });

      console.log('[MongoDB] Sample employee SH-2005 seeded into MongoDB.');
    }

    // 4. Sample Indian Employee: Rajesh Sharma (SH-2008)
    const emp4Exists = await User.findOne({ employee_id: 'SH-2008' });
    if (!emp4Exists) {
      const salt = await bcrypt.genSalt(10);
      const empPassHash = await bcrypt.hash('Password@123', salt);

      const emp4 = await User.create({
        employee_id: 'SH-2008',
        email: 'rajesh.sharma@shinetek.com',
        password_hash: empPassHash,
        role: 'employee',
        status: 'active'
      });

      await Employee.create({
        user_id: emp4._id,
        employee_id: 'SH-2008',
        first_name: 'Rajesh',
        last_name: 'Sharma',
        middle_initial: '',
        full_name: 'Rajesh Sharma',
        email: 'rajesh.sharma@shinetek.com',
        phone: '+91 98765 43210',
        designation: 'Lead Full Stack Engineer',
        date_of_birth: '1993-04-18',
        country: 'India',
        state: 'Karnataka',
        city: 'Bengaluru',
        zip_code: '560001',
        address: '12 MG Road, Indiranagar',
        start_date: '2025-08-01',
        end_date: null,
        employment_status: 'Active',
        registration_status: 'Approved',
        reviewed_by: 'admin@shinetek.com'
      });

      // Indian Payroll Statements (INR)
      await Payroll.create([
        {
          employee_id: 'SH-2008',
          pay_period_start: '2026-01-01',
          pay_period_end: '2026-01-31',
          gross_pay: 185000.00,
          deductions: 28500.00,
          net_pay: 156500.00,
          currency: 'INR',
          payment_date: '2026-01-31',
          payment_status: 'Paid'
        },
        {
          employee_id: 'SH-2008',
          pay_period_start: '2026-02-01',
          pay_period_end: '2026-02-28',
          gross_pay: 185000.00,
          deductions: 28500.00,
          net_pay: 156500.00,
          currency: 'INR',
          payment_date: '2026-02-28',
          payment_status: 'Paid'
        }
      ]);

      console.log('[MongoDB] Indian employee SH-2008 & INR Payroll seeded into MongoDB.');
    }

    // 5. Sample Indian Employee: Priya Patel (SH-2009)
    const emp5Exists = await User.findOne({ employee_id: 'SH-2009' });
    if (!emp5Exists) {
      const salt = await bcrypt.genSalt(10);
      const empPassHash = await bcrypt.hash('Password@123', salt);

      const emp5 = await User.create({
        employee_id: 'SH-2009',
        email: 'priya.patel@shinetek.com',
        password_hash: empPassHash,
        role: 'employee',
        status: 'active'
      });

      await Employee.create({
        user_id: emp5._id,
        employee_id: 'SH-2009',
        first_name: 'Priya',
        last_name: 'Patel',
        middle_initial: '',
        full_name: 'Priya Patel',
        email: 'priya.patel@shinetek.com',
        phone: '+91 91234 56789',
        designation: 'Senior QA Automation Engineer',
        date_of_birth: '1996-09-24',
        country: 'India',
        state: 'Maharashtra',
        city: 'Pune',
        zip_code: '411001',
        address: '45 Koregaon Park',
        start_date: '2025-11-15',
        end_date: null,
        employment_status: 'Active',
        registration_status: 'Approved',
        reviewed_by: 'admin@shinetek.com'
      });

      await Payroll.create([
        {
          employee_id: 'SH-2009',
          pay_period_start: '2026-01-01',
          pay_period_end: '2026-01-31',
          gross_pay: 135000.00,
          deductions: 19200.00,
          net_pay: 115800.00,
          currency: 'INR',
          payment_date: '2026-01-31',
          payment_status: 'Paid'
        },
        {
          employee_id: 'SH-2009',
          pay_period_start: '2026-02-01',
          pay_period_end: '2026-02-28',
          gross_pay: 135000.00,
          deductions: 19200.00,
          net_pay: 115800.00,
          currency: 'INR',
          payment_date: '2026-02-28',
          payment_status: 'Paid'
        }
      ]);

      console.log('[MongoDB] Indian employee SH-2009 & INR Payroll seeded into MongoDB.');
    }

    // 6. Seed Payroll Billing Entries (Payroll Information)
    const entryCount = await PayrollEntry.countDocuments();
    if (entryCount === 0) {
      await PayrollEntry.create([
        // Indian Employee Billing Entries (INR)
        {
          employee_id: 'SH-2008',
          employee_name: 'Rajesh Sharma',
          payroll_month: '2026-02',
          vendor_name: 'Tata Consultancy Services (TCS)',
          client_name: 'Shinetek Cloud Platform',
          total_hours: 160,
          bill_rate: 1500,
          emp_bill_rate: 1156.25,
          gross_amount: 185000.00,
          currency: 'INR',
          country: 'India'
        },
        {
          employee_id: 'SH-2008',
          employee_name: 'Rajesh Sharma',
          payroll_month: '2026-01',
          vendor_name: 'Tata Consultancy Services (TCS)',
          client_name: 'Shinetek Cloud Platform',
          total_hours: 160,
          bill_rate: 1500,
          emp_bill_rate: 1156.25,
          gross_amount: 185000.00,
          currency: 'INR',
          country: 'India'
        },
        {
          employee_id: 'SH-2009',
          employee_name: 'Priya Patel',
          payroll_month: '2026-02',
          vendor_name: 'Infosys Technologies',
          client_name: 'FinTech Global Corp',
          total_hours: 160,
          bill_rate: 1200,
          emp_bill_rate: 843.75,
          gross_amount: 135000.00,
          currency: 'INR',
          country: 'India'
        },
        {
          employee_id: 'SH-2009',
          employee_name: 'Priya Patel',
          payroll_month: '2026-01',
          vendor_name: 'Infosys Technologies',
          client_name: 'FinTech Global Corp',
          total_hours: 160,
          bill_rate: 1200,
          emp_bill_rate: 843.75,
          gross_amount: 135000.00,
          currency: 'INR',
          country: 'India'
        },
        {
          employee_id: 'SH-2010',
          employee_name: 'Ananya Reddy',
          payroll_month: '2026-02',
          vendor_name: 'Wipro Digital',
          client_name: 'Healthcare Nexus Platform',
          total_hours: 160,
          bill_rate: 1400,
          emp_bill_rate: 1000,
          gross_amount: 160000.00,
          currency: 'INR',
          country: 'India'
        },
        {
          employee_id: 'SH-2011',
          employee_name: 'Vikram Verma',
          payroll_month: '2026-02',
          vendor_name: 'HCL Technologies',
          client_name: 'Retail Logistics AI',
          total_hours: 168,
          bill_rate: 1800,
          emp_bill_rate: 1250,
          gross_amount: 210000.00,
          currency: 'INR',
          country: 'India'
        },
        // US / Foreign Employee Billing Entries (USD)
        {
          employee_id: 'SH-2005',
          employee_name: 'Johnathan Vance',
          payroll_month: '2026-02',
          vendor_name: 'Apex Systems',
          client_name: 'Google Cloud Services',
          total_hours: 160,
          bill_rate: 95,
          emp_bill_rate: 65,
          gross_amount: 10400.00,
          currency: 'USD',
          country: 'United States'
        },
        {
          employee_id: 'SH-2005',
          employee_name: 'Johnathan Vance',
          payroll_month: '2026-01',
          vendor_name: 'Apex Systems',
          client_name: 'Google Cloud Services',
          total_hours: 160,
          bill_rate: 95,
          emp_bill_rate: 65,
          gross_amount: 10400.00,
          currency: 'USD',
          country: 'United States'
        },
        {
          employee_id: 'SH-2006',
          employee_name: 'Emily Chen',
          payroll_month: '2026-02',
          vendor_name: 'Insight Global',
          client_name: 'Meta Platforms',
          total_hours: 160,
          bill_rate: 85,
          emp_bill_rate: 60,
          gross_amount: 9600.00,
          currency: 'USD',
          country: 'United States'
        },
        {
          employee_id: 'SH-2007',
          employee_name: 'Marcus Brody',
          payroll_month: '2026-02',
          vendor_name: 'TEKsystems',
          client_name: 'Amazon Web Services',
          total_hours: 160,
          bill_rate: 110,
          emp_bill_rate: 75,
          gross_amount: 12000.00,
          currency: 'USD',
          country: 'United States'
        }
      ]);
      console.log('[MongoDB] Multi-currency Payroll Billing Entries seeded into MongoDB.');
    }

    // 7. Seed Sample Vendor Details
    const vendorCount = await VendorDetail.countDocuments();
    if (vendorCount === 0) {
      await VendorDetail.create([
        {
          employee_id: 'SH-2005',
          employee_name: 'Johnathan Vance',
          vendor_name: 'Apex Systems',
          vendor_address: 'Richmond, VA',
          client_name: 'Google Cloud Services',
          client_address: 'Mountain View, CA',
          hourly_bill_rate: 95,
          employee_rate: 65,
          bu_margin: 30,
          visa_type: 'H-1B',
          tax_percent: 8.5,
          net_margin: 503.25
        }
      ]);
      console.log('[MongoDB] Sample Vendor Details seeded into MongoDB.');
    }

    // 8. Seed Pending Review Applicants & Timesheets into MongoDB if empty
    const pendingCount = await Employee.countDocuments({ registration_status: 'Pending Review' });
    if (pendingCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const empPassHash = await bcrypt.hash('Password@123', salt);

      const u12 = await User.create({ employee_id: 'SH-2012', email: 'amitabh.banerjee@shinetek.com', password_hash: empPassHash, role: 'employee', status: 'active' });
      await Employee.create({
        user_id: u12._id, employee_id: 'SH-2012', first_name: 'Amitabh', last_name: 'Banerjee', middle_initial: 'K.', full_name: 'Amitabh K. Banerjee',
        email: 'amitabh.banerjee@shinetek.com', phone: '+91 98300 45678', designation: 'Cloud Security Specialist', date_of_birth: '1991-03-12',
        country: 'India', state: 'West Bengal', city: 'Kolkata', zip_code: '700091', address: 'Salt Lake Sector V, Block EP',
        start_date: '2026-03-01', employment_status: 'Active', registration_status: 'Pending Review', submitted_at: new Date()
      });
      await Document.create([
        { employee_id: 'SH-2012', document_type: 'passport', file_name: 'India_Passport_Amitabh.pdf', file_path: 'sample_passport_johnathan.jpg', file_size: 1450000, mime_type: 'application/pdf', status: 'Pending Review' },
        { employee_id: 'SH-2012', document_type: 'w4', file_name: 'Form16_Tax_Amitabh.pdf', file_path: 'sample_w4_johnathan.pdf', file_size: 245000, mime_type: 'application/pdf', status: 'Pending Review' }
      ]);

      const u13 = await User.create({ employee_id: 'SH-2013', email: 'sarah.jenkins@shinetek.com', password_hash: empPassHash, role: 'employee', status: 'active' });
      await Employee.create({
        user_id: u13._id, employee_id: 'SH-2013', first_name: 'Sarah', last_name: 'Jenkins', middle_initial: 'M.', full_name: 'Sarah M. Jenkins',
        email: 'sarah.jenkins@shinetek.com', phone: '+1 (555) 678-9012', designation: 'DevSecOps Consultant', date_of_birth: '1994-07-22',
        country: 'United States', state: 'Washington', city: 'Seattle', zip_code: '98101', address: '1400 4th Ave, Suite 500',
        start_date: '2026-03-01', employment_status: 'Active', registration_status: 'Pending Review', submitted_at: new Date()
      });
      await Document.create([
        { employee_id: 'SH-2013', document_type: 'i9', file_name: 'Form_I9_Sarah.pdf', file_path: 'sample_i9_johnathan.pdf', file_size: 310000, mime_type: 'application/pdf', status: 'Pending Review' },
        { employee_id: 'SH-2013', document_type: 'visa', file_name: 'Work_Authorization_Sarah.pdf', file_path: 'sample_visa_johnathan.pdf', file_size: 420000, mime_type: 'application/pdf', status: 'Pending Review' }
      ]);

      console.log('[MongoDB] Pending applicant approvals & compliance documents seeded into MongoDB.');
    }

    // 9. Seed Timesheets into MongoDB if empty
    const tsCount = await Timesheet.countDocuments();
    if (tsCount <= 1) {
      await Timesheet.create([
        { employee_id: 'SH-2005', employee_name: 'Johnathan Vance', vendor_name: 'Apex Systems', start_date: '2026-02-01', end_date: '2026-02-15', total_hours: 80.0, file_name: 'timesheet_johnathan_jan1.csv', file_path: 'timesheet_johnathan_jan1.csv', notes: 'Completed cloud feature sprint', status: 'Pending' },
        { employee_id: 'SH-2008', employee_name: 'Rajesh Sharma', vendor_name: 'Tata Consultancy Services (TCS)', start_date: '2026-02-01', end_date: '2026-02-15', total_hours: 80.0, file_name: 'timesheet_johnathan_jan1.csv', file_path: 'timesheet_johnathan_jan1.csv', notes: 'Platform core microservices', status: 'Approved' },
        { employee_id: 'SH-2009', employee_name: 'Priya Patel', vendor_name: 'Infosys Technologies', start_date: '2026-02-01', end_date: '2026-02-15', total_hours: 80.0, file_name: 'timesheet_emily_feb1.csv', file_path: 'timesheet_emily_feb1.csv', notes: 'Automated test suite execution', status: 'Pending' },
        { employee_id: 'SH-2010', employee_name: 'Ananya Reddy', vendor_name: 'Wipro Digital', start_date: '2026-02-01', end_date: '2026-02-15', total_hours: 80.0, file_name: 'timesheet_johnathan_jan1.csv', file_path: 'timesheet_johnathan_jan1.csv', notes: 'CI/CD pipeline configuration', status: 'Pending' },
        { employee_id: 'SH-2011', employee_name: 'Vikram Verma', vendor_name: 'HCL Technologies', start_date: '2026-02-01', end_date: '2026-02-15', total_hours: 84.0, file_name: 'timesheet_emily_feb1.csv', file_path: 'timesheet_emily_feb1.csv', notes: 'Data ingestion pipeline', status: 'Pending' }
      ]);
      console.log('[MongoDB] Multi-vendor Timesheets seeded into MongoDB.');
    }
  } catch (err) {
    console.error('[MongoDB Seed Error]', err.message);
  }
}

import bcrypt from 'bcryptjs';
import dns from 'dns';
import { db, initSchema } from './schema.js';
import { connectMongoDB, isMongoConnected } from './mongo.js';
import { User as MongoUser, Employee as MongoEmployee, Payroll as MongoPayroll } from '../models/index.js';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function seedIndianPayroll() {
  initSchema();
  await connectMongoDB();

  const salt = await bcrypt.genSalt(10);
  const passHash = await bcrypt.hash('Password@123', salt);

  const indianEmployees = [
    {
      id: 'SH-2008',
      email: 'rajesh.sharma@shinetek.com',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      fullName: 'Rajesh Sharma',
      phone: '+91 98765 43210',
      designation: 'Lead Full Stack Engineer',
      dob: '1993-04-18',
      country: 'India',
      state: 'Karnataka',
      city: 'Bengaluru',
      zip: '560001',
      address: '12 MG Road, Indiranagar',
      startDate: '2025-08-01',
      payroll: [
        {
          start: '2026-01-01',
          end: '2026-01-31',
          gross: 185000.00,
          deductions: 28500.00,
          net: 156500.00,
          currency: 'INR',
          paymentDate: '2026-01-31',
          status: 'Paid'
        },
        {
          start: '2026-02-01',
          end: '2026-02-28',
          gross: 185000.00,
          deductions: 28500.00,
          net: 156500.00,
          currency: 'INR',
          paymentDate: '2026-02-28',
          status: 'Paid'
        }
      ]
    },
    {
      id: 'SH-2009',
      email: 'priya.patel@shinetek.com',
      firstName: 'Priya',
      lastName: 'Patel',
      fullName: 'Priya Patel',
      phone: '+91 91234 56789',
      designation: 'Senior QA Automation Engineer',
      dob: '1996-09-24',
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      zip: '411001',
      address: '45 Koregaon Park',
      startDate: '2025-11-15',
      payroll: [
        {
          start: '2026-01-01',
          end: '2026-01-31',
          gross: 135000.00,
          deductions: 19200.00,
          net: 115800.00,
          currency: 'INR',
          paymentDate: '2026-01-31',
          status: 'Paid'
        },
        {
          start: '2026-02-01',
          end: '2026-02-28',
          gross: 135000.00,
          deductions: 19200.00,
          net: 115800.00,
          currency: 'INR',
          paymentDate: '2026-02-28',
          status: 'Paid'
        }
      ]
    },
    {
      id: 'SH-2010',
      email: 'ananya.reddy@shinetek.com',
      firstName: 'Ananya',
      lastName: 'Reddy',
      fullName: 'Ananya Reddy',
      phone: '+91 99887 76655',
      designation: 'DevOps & Cloud Engineer',
      dob: '1994-12-05',
      country: 'India',
      state: 'Telangana',
      city: 'Hyderabad',
      zip: '500081',
      address: '88 HITEC City, Madhapur',
      startDate: '2026-01-10',
      payroll: [
        {
          start: '2026-02-01',
          end: '2026-02-28',
          gross: 160000.00,
          deductions: 24000.00,
          net: 136000.00,
          currency: 'INR',
          paymentDate: '2026-03-05',
          status: 'Processing'
        }
      ]
    },
    {
      id: 'SH-2011',
      email: 'vikram.verma@shinetek.com',
      firstName: 'Vikram',
      lastName: 'Verma',
      fullName: 'Vikram Verma',
      phone: '+91 98450 11223',
      designation: 'Staff Data Engineer',
      dob: '1991-08-14',
      country: 'India',
      state: 'Delhi NCR',
      city: 'Gurugram',
      zip: '122002',
      address: 'DLF Cyber City, Tower B',
      startDate: '2025-05-01',
      payroll: [
        {
          start: '2026-01-01',
          end: '2026-01-31',
          gross: 210000.00,
          deductions: 32000.00,
          net: 178000.00,
          currency: 'INR',
          paymentDate: '2026-01-31',
          status: 'Paid'
        },
        {
          start: '2026-02-01',
          end: '2026-02-28',
          gross: 210000.00,
          deductions: 32000.00,
          net: 178000.00,
          currency: 'INR',
          paymentDate: '2026-02-28',
          status: 'Paid'
        }
      ]
    }
  ];

  for (const emp of indianEmployees) {
    // 1. Insert or update User in SQLite
    let userRow = db.prepare('SELECT id FROM users WHERE employee_id = ?').get(emp.id);
    if (!userRow) {
      const res = db.prepare(`
        INSERT INTO users (employee_id, email, password_hash, role, status)
        VALUES (?, ?, ?, 'employee', 'active')
      `).run(emp.id, emp.email, passHash);
      userRow = { id: res.lastInsertRowid };
    }

    // 2. Insert or update Employee in SQLite
    const empRow = db.prepare('SELECT id FROM employees WHERE employee_id = ?').get(emp.id);
    if (!empRow) {
      db.prepare(`
        INSERT INTO employees (
          user_id, employee_id, first_name, last_name, full_name, email, phone, designation,
          date_of_birth, country, state, city, zip_code, address,
          start_date, employment_status, registration_status, submitted_at, reviewed_at, reviewed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', 'Approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'admin@shinetek.com')
      `).run(
        userRow.id, emp.id, emp.firstName, emp.lastName, emp.fullName, emp.email, emp.phone, emp.designation,
        emp.dob, emp.country, emp.state, emp.city, emp.zip, emp.address, emp.startDate
      );
    } else {
      db.prepare(`UPDATE employees SET country = 'India' WHERE employee_id = ?`).run(emp.id);
    }

    // 3. Insert Payroll records in SQLite
    for (const pay of emp.payroll) {
      const payExists = db.prepare(`
        SELECT id FROM payroll_records WHERE employee_id = ? AND pay_period_start = ? AND pay_period_end = ?
      `).get(emp.id, pay.start, pay.end);

      if (!payExists) {
        db.prepare(`
          INSERT INTO payroll_records (
            employee_id, pay_period_start, pay_period_end, gross_pay, deductions, net_pay, currency, payment_date, payment_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          emp.id, pay.start, pay.end, pay.gross, pay.deductions, pay.net, pay.currency, pay.paymentDate, pay.status
        );
      }
    }

    // 4. Sync to MongoDB Atlas if connected
    if (isMongoConnected()) {
      try {
        let mUser = await MongoUser.findOne({ employee_id: emp.id });
        if (!mUser) {
          mUser = await MongoUser.create({
            employee_id: emp.id,
            email: emp.email,
            password_hash: passHash,
            role: 'employee',
            status: 'active'
          });
        }

        let mEmp = await MongoEmployee.findOne({ employee_id: emp.id });
        if (!mEmp) {
          await MongoEmployee.create({
            user_id: mUser._id,
            employee_id: emp.id,
            first_name: emp.firstName,
            last_name: emp.lastName,
            full_name: emp.fullName,
            email: emp.email,
            phone: emp.phone,
            designation: emp.designation,
            date_of_birth: emp.dob,
            country: emp.country,
            state: emp.state,
            city: emp.city,
            zip_code: emp.zip,
            address: emp.address,
            start_date: emp.startDate,
            employment_status: 'Active',
            registration_status: 'Approved',
            reviewed_by: 'admin@shinetek.com'
          });
        }

        for (const pay of emp.payroll) {
          const mPayExists = await MongoPayroll.findOne({
            employee_id: emp.id,
            pay_period_start: pay.start,
            pay_period_end: pay.end
          });
          if (!mPayExists) {
            await MongoPayroll.create({
              employee_id: emp.id,
              pay_period_start: pay.start,
              pay_period_end: pay.end,
              gross_pay: pay.gross,
              deductions: pay.deductions,
              net_pay: pay.net,
              currency: pay.currency,
              payment_date: pay.paymentDate,
              payment_status: pay.status
            });
          }
        }
      } catch (mErr) {
        console.error(`MongoDB sync error for ${emp.id}:`, mErr.message);
      }
    }
  }

  // Update current sequential ID in settings
  db.prepare("UPDATE system_settings SET value = '2012' WHERE key = 'id_current_seq'").run();

  console.log('[Seed] Indian employees and Indian payroll statements successfully seeded in SQLite and MongoDB Atlas!');
  const breakdown = db.prepare(`
    SELECT currency, count(*) as count, sum(gross_pay) as total_gross, sum(net_pay) as total_net
    FROM payroll_records
    GROUP BY currency
  `).all();
  console.log('Current Payroll Breakdown:', breakdown);

  process.exit(0);
}

seedIndianPayroll().catch(err => {
  console.error('Seed script error:', err);
  process.exit(1);
});

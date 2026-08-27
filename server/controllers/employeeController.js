import bcrypt from 'bcryptjs';
import { db } from '../db/schema.js';
import { logAudit } from '../middleware/audit.js';
import { validateAddressInfo } from '../data/addressData.js';
import { Employee as MongoEmployee, User as MongoUser, Notification as MongoNotif } from '../models/index.js';
import { isMongoConnected } from '../db/mongo.js';
import { generateNextEmployeeIdSync } from './settingsController.js';

// Admin: Create new employee directly
export async function createEmployeeByAdmin(req, res) {
  try {
    const {
      firstName,
      lastName,
      middleInitial,
      email,
      phone,
      designation,
      dateOfBirth,
      country,
      state,
      city,
      zipCode,
      address,
      startDate,
      endDate,
      employmentStatus = 'Active',
      password = 'Password@123',
      registrationStatus = 'Approved'
    } = req.body;

    const trimmedFirstName = firstName ? firstName.trim() : '';
    const trimmedLastName = lastName ? lastName.trim() : '';
    const trimmedMiddleInitial = middleInitial ? middleInitial.trim() : '';
    const trimmedEmail = email ? email.trim().toLowerCase() : '';
    const trimmedPhone = phone ? phone.trim() : '';
    const trimmedDesignation = designation ? designation.trim() : '';
    const trimmedDob = dateOfBirth ? dateOfBirth.trim() : '';

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail || !trimmedDesignation) {
      return res.status(400).json({ error: 'First Name, Last Name, Email, and Designation are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    // Check duplicate email in users
    const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(trimmedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const fullName = [trimmedFirstName, trimmedMiddleInitial, trimmedLastName].filter(Boolean).join(' ');

    // Address validation if country is specified
    if (country) {
      const addressValidation = validateAddressInfo(country, state || '', city || '', zipCode || '');
      if (!addressValidation.isValid) {
        return res.status(400).json({ error: addressValidation.errors.join(' ') });
      }
    }

    // Hash password
    const finalPassword = password && password.trim() ? password.trim() : 'Password@123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(finalPassword, salt);

    let newEmployeeId = null;
    let userId = null;

    const createTx = db.transaction(() => {
      newEmployeeId = generateNextEmployeeIdSync();

      const userInsert = db.prepare(`
        INSERT INTO users (employee_id, email, password_hash, role, status)
        VALUES (?, ?, ?, 'employee', ?)
      `);
      const userResult = userInsert.run(
        newEmployeeId,
        trimmedEmail,
        passwordHash,
        employmentStatus === 'Active' ? 'active' : 'suspended'
      );
      userId = userResult.lastInsertRowid;

      const effectiveStartDate = startDate && startDate.trim() ? startDate.trim() : new Date().toISOString().split('T')[0];
      const effectiveEndDate = endDate && endDate.trim() ? endDate.trim() : null;

      const employeeInsert = db.prepare(`
        INSERT INTO employees (
          user_id, employee_id, first_name, last_name, middle_initial, full_name, email, phone, designation,
          date_of_birth, country, state, city, zip_code, address,
          start_date, end_date, employment_status, registration_status,
          submitted_at, reviewed_at, reviewed_by
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?
        )
      `);

      employeeInsert.run(
        userId,
        newEmployeeId,
        trimmedFirstName,
        trimmedLastName,
        trimmedMiddleInitial,
        fullName,
        trimmedEmail,
        trimmedPhone || '+1 (555) 000-0000',
        trimmedDesignation,
        trimmedDob || '1995-01-01',
        country || 'United States',
        state || 'California',
        city || 'Los Angeles',
        zipCode || '90001',
        address || '100 Corporate Plaza',
        effectiveStartDate,
        effectiveEndDate,
        employmentStatus,
        registrationStatus,
        req.user?.email || 'Admin'
      );

      // Create welcome notification
      db.prepare(`
        INSERT INTO notifications (employee_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `).run(
        newEmployeeId,
        'Welcome to Shinetek Inc.',
        `Your employee account (${newEmployeeId}) has been created by HR Administrator ${req.user?.email || 'Admin'}.`,
        'success'
      );
    });

    createTx();

    // Sync to MongoDB Atlas if connected
    if (isMongoConnected()) {
      (async () => {
        try {
          const mUser = await MongoUser.create({
            employee_id: newEmployeeId,
            email: trimmedEmail,
            password_hash: passwordHash,
            role: 'employee',
            status: employmentStatus === 'Active' ? 'active' : 'suspended'
          });

          await MongoEmployee.create({
            user_id: mUser._id,
            employee_id: newEmployeeId,
            first_name: trimmedFirstName,
            last_name: trimmedLastName,
            middle_initial: trimmedMiddleInitial,
            full_name: fullName,
            email: trimmedEmail,
            phone: trimmedPhone || '+1 (555) 000-0000',
            designation: trimmedDesignation,
            date_of_birth: trimmedDob || '1995-01-01',
            country: country || 'United States',
            state: state || 'California',
            city: city || 'Los Angeles',
            zip_code: zipCode || '90001',
            address: address || '100 Corporate Plaza',
            start_date: startDate || new Date().toISOString().split('T')[0],
            end_date: endDate || null,
            employment_status: employmentStatus,
            registration_status: registrationStatus,
            reviewed_by: req.user?.email || 'Admin'
          });
        } catch (mErr) {
          console.error('[MongoDB Create Employee Sync Error]', mErr.message);
        }
      })();
    }

    logAudit({
      userId: req.user?.employeeId || 'ADMIN',
      userName: req.user?.email || 'Admin',
      userRole: 'admin',
      action: 'ADMIN_CREATED_EMPLOYEE',
      entityType: 'employee',
      entityId: newEmployeeId,
      details: `Admin ${req.user?.email || 'Admin'} created new employee ${fullName} (${newEmployeeId}, ${trimmedDesignation})`,
      ipAddress: req.ip
    });

    const newEmp = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(newEmployeeId);

    res.status(201).json({
      message: `Employee ${fullName} (${newEmployeeId}) created successfully.`,
      employee: newEmp
    });
  } catch (err) {
    console.error('[createEmployeeByAdmin Error]', err);
    res.status(500).json({ error: err.message || 'Failed to create employee.' });
  }
}

// Get profile of employee (self or admin)
export function getEmployeeProfile(req, res) {
  try {
    const employeeId = req.params.employeeId || req.user.employeeId;

    if (req.user.role !== 'admin' && req.user.employeeId !== employeeId) {
      return res.status(403).json({ error: 'Unauthorized to view this employee profile.' });
    }

    const employee = db.prepare(`
      SELECT e.*, u.role, u.status as account_status
      FROM employees e
      LEFT JOIN users u ON u.employee_id = e.employee_id
      WHERE e.employee_id = ?
    `).get(employeeId);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const documents = db.prepare(`
      SELECT id, document_type, file_name, file_size, mime_type, status, review_notes, uploaded_at, reviewed_at
      FROM documents
      WHERE employee_id = ?
    `).all(employeeId);

    res.json({
      employee,
      documents
    });
  } catch (err) {
    console.error('[getEmployeeProfile Error]', err);
    res.status(500).json({ error: 'Failed to fetch employee profile.' });
  }
}

// Update editable profile information
export function updateEmployeeProfile(req, res) {
  try {
    const employeeId = req.params.employeeId || req.user.employeeId;

    if (req.user.role !== 'admin' && req.user.employeeId !== employeeId) {
      return res.status(403).json({ error: 'Unauthorized to update this employee profile.' });
    }

    const {
      phone,
      country,
      state,
      city,
      zipCode,
      address,
      firstName,
      lastName,
      middleInitial,
      fullName, // Only admin can edit
      designation, // Only admin can edit
      dateOfBirth, // Only admin can edit
      startDate, // Only admin can edit
      endDate, // Only admin can edit
      employmentStatus // Only admin can edit
    } = req.body;

    const currentEmp = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(employeeId);
    if (!currentEmp) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Validate address if changing
    const newCountry = country || currentEmp.country;
    const newState = state || currentEmp.state;
    const newCity = city || currentEmp.city;
    const newZip = zipCode || currentEmp.zip_code;

    const addressCheck = validateAddressInfo(newCountry, newState, newCity, newZip);
    if (!addressCheck.isValid) {
      return res.status(400).json({ error: addressCheck.errors.join(' ') });
    }

    // If regular employee, prevent editing sensitive fields (Name, Designation, DOB, Dates, Status)
    const isAdmin = req.user.role === 'admin';
    let finalFirstName = currentEmp.first_name;
    let finalLastName = currentEmp.last_name;
    let finalMiddleInitial = currentEmp.middle_initial;
    let finalFullName = currentEmp.full_name;
    let finalStartDate = currentEmp.start_date;
    let finalEndDate = currentEmp.end_date;
    let finalEmploymentStatus = currentEmp.employment_status || 'Active';

    if (isAdmin) {
      if (firstName !== undefined) finalFirstName = firstName ? firstName.trim() : null;
      if (lastName !== undefined) finalLastName = lastName ? lastName.trim() : null;
      if (middleInitial !== undefined) finalMiddleInitial = middleInitial ? middleInitial.trim() : null;

      if (finalFirstName || finalLastName) {
        finalFullName = [finalFirstName, finalMiddleInitial, finalLastName].filter(Boolean).join(' ');
      } else if (fullName) {
        finalFullName = fullName.trim();
      }

      if (startDate !== undefined) finalStartDate = startDate ? startDate.trim() : null;
      if (endDate !== undefined) finalEndDate = endDate ? endDate.trim() : null;
      if (employmentStatus !== undefined && ['Active', 'Inactive'].includes(employmentStatus)) {
        finalEmploymentStatus = employmentStatus;
        // Keep users status aligned
        db.prepare('UPDATE users SET status = ? WHERE employee_id = ?')
          .run(finalEmploymentStatus === 'Active' ? 'active' : 'suspended', employeeId);
      }
    }

    const finalDesignation = (isAdmin && designation) ? designation.trim() : currentEmp.designation;
    const finalDob = (isAdmin && dateOfBirth) ? dateOfBirth : currentEmp.date_of_birth;

    db.prepare(`
      UPDATE employees
      SET first_name = ?,
          last_name = ?,
          middle_initial = ?,
          full_name = ?,
          designation = ?,
          date_of_birth = ?,
          start_date = ?,
          end_date = ?,
          employment_status = ?,
          phone = ?,
          country = ?,
          state = ?,
          city = ?,
          zip_code = ?,
          address = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = ?
    `).run(
      finalFirstName,
      finalLastName,
      finalMiddleInitial,
      finalFullName,
      finalDesignation,
      finalDob,
      finalStartDate,
      finalEndDate,
      finalEmploymentStatus,
      phone ? phone.trim() : currentEmp.phone,
      newCountry,
      newState,
      newCity,
      newZip.trim(),
      address ? address.trim() : currentEmp.address,
      employeeId
    );

    logAudit({
      userId: req.user.employeeId,
      userName: req.user.email,
      userRole: req.user.role,
      action: 'PROFILE_UPDATED',
      entityType: 'employee',
      entityId: employeeId,
      details: `Profile updated for ${employeeId} by ${req.user.email}`,
      ipAddress: req.ip
    });

    const updated = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(employeeId);
    const todayStr = new Date().toISOString().split('T')[0];
    const isStillWorking = (updated.employment_status !== 'Inactive') && (!updated.end_date || updated.end_date >= todayStr);

    res.json({
      message: 'Profile updated successfully.',
      employee: {
        ...updated,
        is_still_working: isStillWorking
      }
    });
  } catch (err) {
    console.error('[updateEmployeeProfile Error]', err);
    res.status(500).json({ error: 'Failed to update employee profile.' });
  }
}

// Admin: Toggle / Update Employee Employment Status (Active / Inactive) and Start/End dates
export function toggleEmploymentStatus(req, res) {
  try {
    const { employeeId } = req.params;
    const { employmentStatus, startDate, endDate, reason } = req.body;

    if (!['Active', 'Inactive'].includes(employmentStatus)) {
      return res.status(400).json({ error: "Employment status must be either 'Active' or 'Inactive'." });
    }

    const employee = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const finalStartDate = startDate !== undefined ? (startDate ? startDate.trim() : null) : (employee.start_date || new Date().toISOString().split('T')[0]);
    let finalEndDate = endDate !== undefined ? (endDate ? endDate.trim() : null) : employee.end_date;

    // If making Inactive and no end date specified, default end date to today
    if (employmentStatus === 'Inactive' && !finalEndDate) {
      finalEndDate = new Date().toISOString().split('T')[0];
    } else if (employmentStatus === 'Active' && (endDate === null || endDate === '')) {
      finalEndDate = null;
    }

    db.prepare(`
      UPDATE employees
      SET employment_status = ?,
          start_date = ?,
          end_date = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = ?
    `).run(employmentStatus, finalStartDate, finalEndDate, employeeId);

    // Sync users.status: if Active -> 'active', if Inactive -> 'suspended'
    db.prepare(`
      UPDATE users
      SET status = ?
      WHERE employee_id = ?
    `).run(employmentStatus === 'Active' ? 'active' : 'suspended', employeeId);

    // Sync to Mongo if connected
    if (isMongoConnected()) {
      MongoEmployee.updateOne(
        { employee_id: employeeId },
        {
          employment_status: employmentStatus,
          start_date: finalStartDate,
          end_date: finalEndDate
        }
      ).catch(e => console.error('[MongoDB Employment Status Sync Error]', e.message));

      MongoUser.updateOne(
        { employee_id: employeeId },
        { status: employmentStatus === 'Active' ? 'active' : 'suspended' }
      ).catch(e => console.error('[MongoDB User Status Sync Error]', e.message));
    }

    // Notification
    const notifTitle = `Employment Status: ${employmentStatus}`;
    const notifMsg = employmentStatus === 'Active'
      ? 'Your employee profile has been marked as Active and currently working.'
      : `Your employee record has been marked as Inactive (Effective: ${finalEndDate || 'Immediate'})${reason ? `. Note: ${reason}` : ''}.`;

    db.prepare(`
      INSERT INTO notifications (employee_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(
      employeeId,
      notifTitle,
      notifMsg,
      employmentStatus === 'Active' ? 'success' : 'warning'
    );

    logAudit({
      userId: req.user.employeeId,
      userName: req.user.email,
      userRole: 'admin',
      action: `EMPLOYEE_${employmentStatus.toUpperCase()}`,
      entityType: 'employee',
      entityId: employeeId,
      details: `Admin ${req.user.email} updated status of ${employee.full_name} (${employeeId}) to ${employmentStatus}. Start: ${finalStartDate || 'N/A'}, End: ${finalEndDate || 'None'}. Reason: ${reason || 'N/A'}`,
      ipAddress: req.ip
    });

    const updated = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(employeeId);
    const todayStr = new Date().toISOString().split('T')[0];
    const isStillWorking = (updated.employment_status !== 'Inactive') && (!updated.end_date || updated.end_date >= todayStr);

    res.json({
      message: `Employee employment status successfully updated to ${employmentStatus}.`,
      employee: {
        ...updated,
        is_still_working: isStillWorking
      }
    });
  } catch (err) {
    console.error('[toggleEmploymentStatus Error]', err);
    res.status(500).json({ error: 'Failed to update employment status.' });
  }
}

// Admin: Get all employees with filtering, searching, sorting, and active/inactive tabs
export async function getAllEmployees(req, res) {
  try {
    const {
      search = '',
      status = '',
      employmentStatus = 'ALL',
      country = '',
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    let employees = [];

    // 1. Try MongoDB Atlas if connected
    if (isMongoConnected()) {
      try {
        const filter = {};
        if (search.trim()) {
          const term = search.trim();
          filter.$or = [
            { full_name: { $regex: term, $options: 'i' } },
            { first_name: { $regex: term, $options: 'i' } },
            { last_name: { $regex: term, $options: 'i' } },
            { employee_id: { $regex: term, $options: 'i' } },
            { email: { $regex: term, $options: 'i' } },
            { designation: { $regex: term, $options: 'i' } }
          ];
        }

        if (status && status !== 'ALL') {
          filter.registration_status = status;
        }

        if (employmentStatus && employmentStatus !== 'ALL') {
          if (employmentStatus === 'Active') {
            filter.$or = [{ employment_status: 'Active' }, { employment_status: null }, { employment_status: { $exists: false } }];
          } else if (employmentStatus === 'Inactive') {
            filter.employment_status = 'Inactive';
          }
        }

        if (country && country !== 'ALL') {
          filter.country = country;
        }

        const mEmps = await MongoEmployee.find(filter).sort({ employee_id: 1 }).lean();
        if (mEmps && mEmps.length > 0) {
          const todayStr = new Date().toISOString().split('T')[0];
          employees = mEmps.map(emp => ({
            ...emp,
            id: emp._id.toString(),
            employment_status: emp.employment_status || 'Active',
            is_still_working: (emp.employment_status !== 'Inactive') && (!emp.end_date || emp.end_date >= todayStr)
          }));
        }
      } catch (mErr) {
        console.warn('[getAllEmployees Mongo Notice]', mErr.message);
      }
    }

    // 2. Fallback to SQLite if MongoDB returned 0 or is disconnected
    if (employees.length === 0) {
      let query = `
        SELECT e.id, e.employee_id, e.first_name, e.last_name, e.middle_initial, e.full_name, e.email, e.phone, e.designation,
               e.date_of_birth, e.country, e.state, e.city, e.registration_status,
               e.start_date, e.end_date, e.employment_status,
               e.profile_image_url, e.submitted_at, e.created_at,
               (SELECT COUNT(*) FROM documents WHERE employee_id = e.employee_id) as total_docs,
               (SELECT COUNT(*) FROM documents WHERE employee_id = e.employee_id AND status = 'Approved') as approved_docs,
               (SELECT COUNT(*) FROM timesheets WHERE employee_id = e.employee_id AND status = 'Pending') as pending_timesheets
        FROM employees e
        WHERE 1=1
      `;

      const params = [];

      if (search.trim()) {
        query += ` AND (LOWER(e.full_name) LIKE ? OR LOWER(e.first_name) LIKE ? OR LOWER(e.last_name) LIKE ? OR LOWER(e.employee_id) LIKE ? OR LOWER(e.email) LIKE ? OR LOWER(e.designation) LIKE ?)`;
        const term = `%${search.trim().toLowerCase()}%`;
        params.push(term, term, term, term, term, term);
      }

      if (status && status !== 'ALL') {
        query += ` AND e.registration_status = ?`;
        params.push(status);
      }

      if (employmentStatus && employmentStatus !== 'ALL') {
        if (employmentStatus === 'Active') {
          query += ` AND (e.employment_status = 'Active' OR e.employment_status IS NULL)`;
        } else if (employmentStatus === 'Inactive') {
          query += ` AND e.employment_status = 'Inactive'`;
        }
      }

      if (country && country !== 'ALL') {
        query += ` AND e.country = ?`;
        params.push(country);
      }

      const validSortCols = ['created_at', 'submitted_at', 'full_name', 'employee_id', 'registration_status', 'start_date', 'employment_status'];
      const col = validSortCols.includes(sortBy) ? sortBy : 'employee_id';
      const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      query += ` ORDER BY e.${col} ${order}`;

      const rawEmployees = db.prepare(query).all(...params);

      const todayStr = new Date().toISOString().split('T')[0];
      employees = rawEmployees.map(emp => ({
        ...emp,
        employment_status: emp.employment_status || 'Active',
        is_still_working: (emp.employment_status !== 'Inactive') && (!emp.end_date || emp.end_date >= todayStr)
      }));
    }

    // Quick counts for tabs
    const activeCount = employees.filter(e => e.employment_status !== 'Inactive').length;
    const inactiveCount = employees.filter(e => e.employment_status === 'Inactive').length;
    const totalCount = employees.length;

    res.json({
      total: employees.length,
      counts: {
        all: totalCount,
        active: activeCount,
        inactive: inactiveCount
      },
      employees
    });
  } catch (err) {
    console.error('[getAllEmployees Error]', err);
    res.status(500).json({ error: 'Failed to fetch employees list.' });
  }
}

// Admin: Get complete details for an employee
export function getEmployeeDetail(req, res) {
  try {
    const { employeeId } = req.params;

    const rawEmployee = db.prepare(`
      SELECT e.*, u.role, u.status as user_account_status, u.created_at as user_created_at
      FROM employees e
      LEFT JOIN users u ON u.employee_id = e.employee_id
      WHERE e.employee_id = ?
    `).get(employeeId);

    if (!rawEmployee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const employee = {
      ...rawEmployee,
      employment_status: rawEmployee.employment_status || 'Active',
      is_still_working: (rawEmployee.employment_status !== 'Inactive') && (!rawEmployee.end_date || rawEmployee.end_date >= todayStr)
    };

    const documents = db.prepare(`
      SELECT * FROM documents WHERE employee_id = ? ORDER BY uploaded_at DESC
    `).all(employeeId);

    const timesheets = db.prepare(`
      SELECT * FROM timesheets WHERE employee_id = ? ORDER BY submitted_at DESC
    `).all(employeeId);

    const payroll = db.prepare(`
      SELECT * FROM payroll_records WHERE employee_id = ? ORDER BY payment_date DESC
    `).all(employeeId);

    const auditHistory = db.prepare(`
      SELECT * FROM audit_logs
      WHERE entity_id = ? OR user_id = ?
      ORDER BY timestamp DESC
      LIMIT 15
    `).all(employeeId, employeeId);

    res.json({
      employee,
      documents,
      timesheets,
      payroll,
      auditHistory
    });
  } catch (err) {
    console.error('[getEmployeeDetail Error]', err);
    res.status(500).json({ error: 'Failed to fetch employee details.' });
  }
}

// Admin: Review and update employee registration status (Approve, Reject, Needs Correction)
export function reviewEmployeeStatus(req, res) {
  try {
    const { employeeId } = req.params;
    const { status, adminNotes } = req.body;

    if (!['Approved', 'Needs Correction', 'Rejected', 'Pending Review'].includes(status)) {
      return res.status(400).json({ error: 'Invalid registration status.' });
    }

    const employee = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    db.prepare(`
      UPDATE employees
      SET registration_status = ?,
          admin_notes = ?,
          reviewed_at = CURRENT_TIMESTAMP,
          reviewed_by = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = ?
    `).run(status, adminNotes || null, req.user.email, employeeId);

    // If status is Approved, mark all user permissions active
    if (status === 'Approved') {
      db.prepare("UPDATE users SET status = 'active' WHERE employee_id = ?").run(employeeId);
    }

    // Send notification
    let notifTitle = `Onboarding Status: ${status}`;
    let notifMsg = `Your Shinetek Inc. onboarding registration has been reviewed and marked as: ${status}.`;
    if (adminNotes) {
      notifMsg += ` HR Note: ${adminNotes}`;
    }

    db.prepare(`
      INSERT INTO notifications (employee_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(
      employeeId,
      notifTitle,
      notifMsg,
      status === 'Approved' ? 'success' : (status === 'Needs Correction' ? 'warning' : 'error')
    );

    logAudit({
      userId: req.user.employeeId,
      userName: req.user.email,
      userRole: 'admin',
      action: `EMPLOYEE_${status.toUpperCase().replace(' ', '_')}`,
      entityType: 'employee',
      entityId: employeeId,
      details: `Admin ${req.user.email} updated status of ${employee.full_name} (${employeeId}) to ${status}. Notes: ${adminNotes || 'None'}`,
      ipAddress: req.ip
    });

    const updated = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(employeeId);
    res.json({
      message: `Employee registration status set to ${status}.`,
      employee: updated
    });
  } catch (err) {
    console.error('[reviewEmployeeStatus Error]', err);
    res.status(500).json({ error: 'Failed to update employee status.' });
  }
}

// Admin: Get Dashboard metrics
export function getDashboardStats(req, res) {
  try {
    const totalEmployees = db.prepare("SELECT COUNT(*) as count FROM employees").get().count;
    const pendingRegistrations = db.prepare("SELECT COUNT(*) as count FROM employees WHERE registration_status = 'Pending Review'").get().count;
    const approvedEmployees = db.prepare("SELECT COUNT(*) as count FROM employees WHERE registration_status = 'Approved'").get().count;
    const pendingTimesheets = db.prepare("SELECT COUNT(*) as count FROM timesheets WHERE status = 'Pending'").get().count;
    const approvedTimesheets = db.prepare("SELECT COUNT(*) as count FROM timesheets WHERE status = 'Approved'").get().count;
    const pendingDocuments = db.prepare("SELECT COUNT(*) as count FROM documents WHERE status = 'Uploaded'").get().count;

    const recentEmployees = db.prepare(`
      SELECT employee_id, full_name, designation, country, registration_status, submitted_at
      FROM employees
      ORDER BY submitted_at DESC
      LIMIT 5
    `).all();

    const recentTimesheets = db.prepare(`
      SELECT t.*, e.full_name
      FROM timesheets t
      LEFT JOIN employees e ON e.employee_id = t.employee_id
      ORDER BY t.submitted_at DESC
      LIMIT 5
    `).all();

    res.json({
      stats: {
        totalEmployees,
        pendingRegistrations,
        approvedEmployees,
        pendingTimesheets,
        approvedTimesheets,
        pendingDocuments
      },
      recentEmployees,
      recentTimesheets
    });
  } catch (err) {
    console.error('[getDashboardStats Error]', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
}

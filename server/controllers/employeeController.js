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
      sortBy = 'submitted_at',
      sortOrder = 'DESC'
    } = req.query;

    const empMap = new Map();

    // 1. Fetch from SQLite
    try {
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
      const rawSqlite = db.prepare(query).all();
      for (const emp of rawSqlite) {
        empMap.set(emp.employee_id, {
          ...emp,
          id: String(emp.id),
          employment_status: emp.employment_status || 'Active',
          source: 'sqlite'
        });
      }
    } catch (sqErr) {
      console.warn('[getAllEmployees SQLite Warning]', sqErr.message);
    }

    // 2. Fetch from MongoDB Atlas and merge
    if (isMongoConnected()) {
      try {
        const mEmps = await MongoEmployee.find({}).lean();
        for (const mEmp of mEmps) {
          const empId = mEmp.employee_id;
          const existing = empMap.get(empId);

          if (!existing) {
            empMap.set(empId, {
              ...mEmp,
              id: mEmp._id.toString(),
              employment_status: mEmp.employment_status || 'Active',
              total_docs: 0,
              approved_docs: 0,
              pending_timesheets: 0,
              source: 'mongo'
            });
          } else {
            // Merge properties, prioritizing the more recent registration status
            empMap.set(empId, {
              ...existing,
              ...mEmp,
              id: existing.id || mEmp._id.toString(),
              registration_status: existing.registration_status || mEmp.registration_status,
              employment_status: existing.employment_status || mEmp.employment_status || 'Active',
              total_docs: existing.total_docs || 0,
              approved_docs: existing.approved_docs || 0,
              pending_timesheets: existing.pending_timesheets || 0
            });
          }
        }
      } catch (mErr) {
        console.warn('[getAllEmployees Mongo Notice]', mErr.message);
      }
    }

    let allList = Array.from(empMap.values());
    const todayStr = new Date().toISOString().split('T')[0];

    // Compute working status
    allList = allList.map(emp => ({
      ...emp,
      is_still_working: (emp.employment_status !== 'Inactive') && (!emp.end_date || emp.end_date >= todayStr)
    }));

    // Apply In-Memory Filters
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      allList = allList.filter(e =>
        (e.full_name && e.full_name.toLowerCase().includes(term)) ||
        (e.first_name && e.first_name.toLowerCase().includes(term)) ||
        (e.last_name && e.last_name.toLowerCase().includes(term)) ||
        (e.employee_id && e.employee_id.toLowerCase().includes(term)) ||
        (e.email && e.email.toLowerCase().includes(term)) ||
        (e.designation && e.designation.toLowerCase().includes(term))
      );
    }

    if (status && status !== 'ALL') {
      allList = allList.filter(e => e.registration_status === status);
    }

    if (employmentStatus && employmentStatus !== 'ALL') {
      if (employmentStatus === 'Active') {
        allList = allList.filter(e => e.employment_status !== 'Inactive');
      } else if (employmentStatus === 'Inactive') {
        allList = allList.filter(e => e.employment_status === 'Inactive');
      }
    }

    if (country && country !== 'ALL') {
      allList = allList.filter(e => e.country === country);
    }

    // Sorting
    const isDesc = sortOrder.toUpperCase() === 'DESC';
    allList.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return isDesc ? 1 : -1;
      if (valA > valB) return isDesc ? -1 : 1;
      return 0;
    });

    const activeCount = allList.filter(e => e.employment_status !== 'Inactive').length;
    const inactiveCount = allList.filter(e => e.employment_status === 'Inactive').length;

    res.json({
      total: allList.length,
      counts: {
        all: allList.length,
        active: activeCount,
        inactive: inactiveCount
      },
      employees: allList
    });
  } catch (err) {
    console.error('[getAllEmployees Error]', err);
    res.status(500).json({ error: 'Failed to fetch employees list.' });
  }
}

// Admin: Get complete details for an employee
export async function getEmployeeDetail(req, res) {
  try {
    const { employeeId } = req.params;

    let rawEmployee = null;
    try {
      rawEmployee = db.prepare(`
        SELECT e.*, u.role, u.status as user_account_status, u.created_at as user_created_at
        FROM employees e
        LEFT JOIN users u ON u.employee_id = e.employee_id
        WHERE e.employee_id = ?
      `).get(employeeId);
    } catch (e) {}

    if (!rawEmployee && isMongoConnected()) {
      try {
        const mEmp = await MongoEmployee.findOne({ employee_id: employeeId }).lean();
        if (mEmp) {
          rawEmployee = {
            ...mEmp,
            id: mEmp._id.toString(),
            user_account_status: 'active'
          };
        }
      } catch (e) {}
    }

    if (!rawEmployee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const employee = {
      ...rawEmployee,
      employment_status: rawEmployee.employment_status || 'Active',
      is_still_working: (rawEmployee.employment_status !== 'Inactive') && (!rawEmployee.end_date || rawEmployee.end_date >= todayStr)
    };

    let documents = [];
    try {
      documents = db.prepare(`
        SELECT * FROM documents WHERE employee_id = ? ORDER BY uploaded_at DESC
      `).all(employeeId);
    } catch (e) {}

    let timesheets = [];
    try {
      timesheets = db.prepare(`
        SELECT * FROM timesheets WHERE employee_id = ? ORDER BY submitted_at DESC
      `).all(employeeId);
    } catch (e) {}

    let vendorDetails = null;
    try {
      vendorDetails = db.prepare(`
        SELECT * FROM vendor_details WHERE employee_id = ?
      `).get(employeeId);
    } catch (e) {}

    let auditLogs = [];
    try {
      auditLogs = db.prepare(`
        SELECT * FROM audit_logs
        WHERE entity_id = ? OR user_id = ?
        ORDER BY created_at DESC
        LIMIT 20
      `).all(employeeId, employeeId);
    } catch (e) {}

    res.json({
      employee,
      documents,
      timesheets,
      vendorDetails,
      auditLogs
    });
  } catch (err) {
    console.error('[getEmployeeDetail Error]', err);
    res.status(500).json({ error: 'Failed to fetch employee details.' });
  }
}

// Admin: Review/Update Employee Status (Approve, Needs Correction, Reject)
export async function reviewEmployeeStatus(req, res) {
  try {
    const { employeeId } = req.params;
    const { status, adminNotes } = req.body;

    if (!['Approved', 'Needs Correction', 'Rejected', 'Pending Review'].includes(status)) {
      return res.status(400).json({ error: 'Invalid registration status.' });
    }

    // Update in SQLite
    try {
      db.prepare(`
        UPDATE employees
        SET registration_status = ?,
            admin_notes = ?,
            reviewed_at = CURRENT_TIMESTAMP,
            reviewed_by = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = ?
      `).run(status, adminNotes || null, req.user.email, employeeId);

      if (status === 'Approved') {
        db.prepare("UPDATE users SET status = 'active' WHERE employee_id = ?").run(employeeId);
      }
    } catch (sqErr) {
      console.warn('[SQLite reviewEmployeeStatus Warning]', sqErr.message);
    }

    // Sync to MongoDB Atlas
    if (isMongoConnected()) {
      try {
        await MongoEmployee.findOneAndUpdate(
          { employee_id: employeeId },
          {
            registration_status: status,
            admin_notes: adminNotes || '',
            reviewed_at: new Date(),
            reviewed_by: req.user.email,
            updated_at: new Date()
          }
        );
        if (status === 'Approved') {
          await MongoUser.findOneAndUpdate({ employee_id: employeeId }, { status: 'active' });
        }
      } catch (mErr) {
        console.warn('[MongoDB reviewEmployeeStatus Warning]', mErr.message);
      }
    }

    // Send notification
    let notifTitle = `Onboarding Status: ${status}`;
    let notifMsg = `Your Shinetek Inc. onboarding registration has been reviewed and marked as: ${status}.`;
    if (adminNotes) {
      notifMsg += ` HR Note: ${adminNotes}`;
    }

    try {
      db.prepare(`
        INSERT INTO notifications (employee_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `).run(
        employeeId,
        notifTitle,
        notifMsg,
        status === 'Approved' ? 'success' : (status === 'Needs Correction' ? 'warning' : 'error')
      );
    } catch (e) {}

    logAudit({
      userId: req.user.employeeId,
      userName: req.user.email,
      userRole: 'admin',
      action: `EMPLOYEE_${status.toUpperCase().replace(' ', '_')}`,
      entityType: 'employee',
      entityId: employeeId,
      details: `Admin ${req.user.email} updated status of ${employeeId} to ${status}. Notes: ${adminNotes || 'None'}`,
      ipAddress: req.ip
    });

    let updated = null;
    try {
      updated = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(employeeId);
    } catch (e) {}

    res.json({
      message: `Employee registration status set to ${status}.`,
      employee: updated || { employee_id: employeeId, registration_status: status }
    });
  } catch (err) {
    console.error('[reviewEmployeeStatus Error]', err);
    res.status(500).json({ error: 'Failed to update employee status.' });
  }
}

// Admin: Get Dashboard metrics
export async function getDashboardStats(req, res) {
  try {
    let totalEmployees = 0;
    let pendingRegistrations = 0;
    let approvedEmployees = 0;
    let pendingTimesheets = 0;
    let approvedTimesheets = 0;
    let pendingDocuments = 0;
    let recentEmployees = [];
    let recentTimesheets = [];

    // Query SQLite
    try {
      totalEmployees = db.prepare("SELECT COUNT(*) as count FROM employees").get()?.count || 0;
      pendingRegistrations = db.prepare("SELECT COUNT(*) as count FROM employees WHERE registration_status = 'Pending Review'").get()?.count || 0;
      approvedEmployees = db.prepare("SELECT COUNT(*) as count FROM employees WHERE registration_status = 'Approved'").get()?.count || 0;
      pendingTimesheets = db.prepare("SELECT COUNT(*) as count FROM timesheets WHERE status = 'Pending'").get()?.count || 0;
      approvedTimesheets = db.prepare("SELECT COUNT(*) as count FROM timesheets WHERE status = 'Approved'").get()?.count || 0;
      pendingDocuments = db.prepare("SELECT COUNT(*) as count FROM documents WHERE status = 'Uploaded' OR status = 'Pending Review'").get()?.count || 0;

      recentEmployees = db.prepare(`
        SELECT employee_id, full_name, designation, country, registration_status, submitted_at
        FROM employees
        ORDER BY submitted_at DESC
        LIMIT 5
      `).all();

      recentTimesheets = db.prepare(`
        SELECT t.*, e.full_name
        FROM timesheets t
        LEFT JOIN employees e ON e.employee_id = t.employee_id
        ORDER BY t.submitted_at DESC
        LIMIT 5
      `).all();
    } catch (sqErr) {
      console.warn('[getDashboardStats SQLite Warning]', sqErr.message);
    }

    // Merge with MongoDB Atlas if connected
    if (isMongoConnected()) {
      try {
        const mPending = await MongoEmployee.countDocuments({ registration_status: 'Pending Review' });
        if (mPending > pendingRegistrations) pendingRegistrations = mPending;

        const mApproved = await MongoEmployee.countDocuments({ registration_status: 'Approved' });
        if (mApproved > approvedEmployees) approvedEmployees = mApproved;

        const mTotal = await MongoEmployee.countDocuments({});
        if (mTotal > totalEmployees) totalEmployees = mTotal;

        const mPendingTs = await MongoTimesheet.countDocuments({ status: 'Pending' });
        if (mPendingTs > pendingTimesheets) pendingTimesheets = mPendingTs;

        const mApprovedTs = await MongoTimesheet.countDocuments({ status: 'Approved' });
        if (mApprovedTs > approvedTimesheets) approvedTimesheets = mApprovedTs;

        const mRecent = await MongoEmployee.find({}).sort({ submitted_at: -1, created_at: -1 }).limit(5).lean();
        if (mRecent && mRecent.length > 0) {
          const empMap = new Map();
          for (const e of recentEmployees) empMap.set(e.employee_id, e);
          for (const me of mRecent) {
            if (!empMap.has(me.employee_id)) {
              empMap.set(me.employee_id, {
                employee_id: me.employee_id,
                full_name: me.full_name,
                designation: me.designation,
                country: me.country,
                registration_status: me.registration_status,
                submitted_at: me.submitted_at
              });
            }
          }
          recentEmployees = Array.from(empMap.values()).slice(0, 5);
        }
      } catch (mErr) {
        console.warn('[getDashboardStats Mongo Notice]', mErr.message);
      }
    }

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

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/schema.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { generateNextEmployeeIdSync } from './settingsController.js';
import { validateAddressInfo } from '../data/addressData.js';
import { User as MongoUser, Employee as MongoEmployee, Document as MongoDoc, Notification as MongoNotif } from '../models/index.js';
import { isMongoConnected } from '../db/mongo.js';

export async function register(req, res) {
  try {
    const {
      lastName,
      firstName,
      middleInitial,
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      designation,
      dateOfBirth,
      country,
      state,
      city,
      zipCode,
      address,
      profileImageUrl,
      uploadedDocuments // Array of { documentType, fileName, filePath, fileSize, mimeType }
    } = req.body;

    const trimmedLastName = lastName ? lastName.trim() : '';
    const trimmedFirstName = firstName ? firstName.trim() : '';
    const trimmedMiddleInitial = middleInitial ? middleInitial.trim() : '';

    let effectiveFullName = '';
    if (trimmedFirstName || trimmedLastName) {
      if (!trimmedLastName || !trimmedFirstName) {
        return res.status(400).json({ error: 'First Name and Last Name are required.' });
      }
      effectiveFullName = [trimmedFirstName, trimmedMiddleInitial, trimmedLastName].filter(Boolean).join(' ');
    } else if (fullName && fullName.trim()) {
      effectiveFullName = fullName.trim();
    }

    // Validation checks
    if (!effectiveFullName || !email || !phone || !password || !designation || !dateOfBirth) {
      return res.status(400).json({ error: 'All required personal information fields (First Name, Last Name, Email, Phone, Designation, DOB, Password) must be provided.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Check duplicate email
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Validate Address
    const addressValidation = validateAddressInfo(country, state, city, zipCode);
    if (!addressValidation.isValid) {
      return res.status(400).json({ error: addressValidation.errors.join(' ') });
    }

    // Securely hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let newEmployeeId = null;
    let userId = null;

    // Atomic transaction for ID generation and user/employee insertion
    const registerTx = db.transaction(() => {
      newEmployeeId = generateNextEmployeeIdSync();

      const userInsert = db.prepare(`
        INSERT INTO users (employee_id, email, password_hash, role, status)
        VALUES (?, ?, ?, 'employee', 'active')
      `);
      const userResult = userInsert.run(newEmployeeId, email.trim().toLowerCase(), passwordHash);
      userId = userResult.lastInsertRowid;

      const todayDate = new Date().toISOString().split('T')[0];

      const employeeInsert = db.prepare(`
        INSERT INTO employees (
          user_id, employee_id, first_name, last_name, middle_initial, full_name, email, phone, designation,
          date_of_birth, country, state, city, zip_code, address,
          start_date, end_date, employment_status,
          profile_image_url, registration_status, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Review', CURRENT_TIMESTAMP)
      `);
      employeeInsert.run(
        userId,
        newEmployeeId,
        trimmedFirstName || null,
        trimmedLastName || null,
        trimmedMiddleInitial || null,
        effectiveFullName,
        email.trim().toLowerCase(),
        phone.trim(),
        designation.trim(),
        dateOfBirth,
        country,
        state,
        city,
        zipCode.trim(),
        address.trim(),
        todayDate,
        null,
        'Active',
        profileImageUrl || null
      );

      // Attach any documents uploaded during the registration wizard
      if (Array.isArray(uploadedDocuments) && uploadedDocuments.length > 0) {
        const docInsert = db.prepare(`
          INSERT INTO documents (employee_id, document_type, file_name, file_path, file_size, mime_type, status, uploaded_at)
          VALUES (?, ?, ?, ?, ?, ?, 'Uploaded', CURRENT_TIMESTAMP)
        `);
        for (const doc of uploadedDocuments) {
          docInsert.run(
            newEmployeeId,
            doc.documentType,
            doc.fileName,
            doc.filePath,
            doc.fileSize || 0,
            doc.mimeType || 'application/octet-stream'
          );
        }
      }

      // Add welcoming notification
      db.prepare(`
        INSERT INTO notifications (employee_id, title, message, type)
        VALUES (?, ?, ?, ?)
      `).run(
        newEmployeeId,
        'Registration Submitted',
        'Your employee profile and onboarding documents have been submitted to the Shinetek Inc. HR/Admin team for review.',
        'info'
      );
    });

    registerTx();

    // Sync to MongoDB if connected
    if (isMongoConnected()) {
      (async () => {
        try {
          const mUser = await MongoUser.findOneAndUpdate(
            { employee_id: newEmployeeId },
            {
              employee_id: newEmployeeId,
              email: email.toLowerCase().trim(),
              password_hash: passwordHash,
              role: 'employee',
              status: 'pending'
            },
            { upsert: true, returnDocument: 'after' }
          );

          await MongoEmployee.findOneAndUpdate(
            { employee_id: newEmployeeId },
            {
              user_id: mUser._id,
              employee_id: newEmployeeId,
              first_name: trimmedFirstName || null,
              last_name: trimmedLastName || null,
              middle_initial: trimmedMiddleInitial || null,
              full_name: effectiveFullName,
              email: email.toLowerCase().trim(),
              phone: phone.trim(),
              designation: designation.trim(),
              date_of_birth: dateOfBirth,
              country,
              state,
              city,
              zip_code: zipCode.trim(),
              address: address.trim(),
              start_date: todayDate,
              end_date: null,
              employment_status: 'Active',
              profile_image_url: profileImageUrl || null,
              registration_status: 'Pending Review',
              submitted_at: new Date()
            },
            { upsert: true }
          );

          if (Array.isArray(uploadedDocuments) && uploadedDocuments.length > 0) {
            for (const doc of uploadedDocuments) {
              await MongoDoc.create({
                employee_id: newEmployeeId,
                document_type: doc.documentType,
                file_name: doc.fileName,
                file_path: doc.filePath,
                file_size: doc.fileSize || 0,
                mime_type: doc.mimeType || 'application/octet-stream',
                status: 'Uploaded'
              });
            }
          }

          await MongoNotif.create({
            employee_id: newEmployeeId,
            title: 'Registration Submitted',
            message: 'Your employee profile and onboarding documents have been submitted to the Shinetek Inc. HR/Admin team for review.',
            type: 'info'
          });
        } catch (mErr) {
          console.error('[MongoDB Registration Sync Error]', mErr.message);
        }
      })();
    }

    // Log audit event
    logAudit({
      userId: newEmployeeId,
      userName: fullName,
      userRole: 'employee',
      action: 'EMPLOYEE_REGISTERED',
      entityType: 'employee',
      entityId: newEmployeeId,
      details: `New employee registered: ${fullName} (${newEmployeeId}, ${designation})`,
      ipAddress: req.ip
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, employeeId: newEmployeeId, email: email.toLowerCase(), role: 'employee' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const employee = db.prepare('SELECT * FROM employees WHERE employee_id = ?').get(newEmployeeId);

    res.status(201).json({
      message: 'Registration submitted successfully.',
      token,
      user: {
        id: userId,
        employeeId: newEmployeeId,
        email: email.toLowerCase(),
        role: 'employee',
        fullName: employee.full_name,
        registrationStatus: employee.registration_status,
        designation: employee.designation,
        profileImageUrl: employee.profile_image_url
      },
      employee
    });
  } catch (err) {
    console.error('[Register Error]', err);
    res.status(500).json({ error: err.message || 'An unexpected error occurred during registration.' });
  }
}

export async function login(req, res) {
  try {
    const { identifier, password } = req.body; // identifier can be Employee ID or Email

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Please enter your Employee ID / Email and password.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Query user by employee_id or email
    let user = db.prepare(`
      SELECT u.id, u.employee_id, u.email, u.password_hash, u.role, u.status,
             e.full_name, e.designation, e.profile_image_url, e.registration_status
      FROM users u
      LEFT JOIN employees e ON e.employee_id = u.employee_id
      WHERE LOWER(u.employee_id) = ? OR LOWER(u.email) = ?
    `).get(cleanIdentifier, cleanIdentifier);

    // If not found in SQLite, check MongoDB Atlas as fallback
    if (!user && isMongoConnected()) {
      try {
        const mUser = await MongoUser.findOne({
          $or: [
            { email: cleanIdentifier },
            { employee_id: cleanIdentifier.toUpperCase() }
          ]
        });

        if (mUser) {
          const mEmp = await MongoEmployee.findOne({ employee_id: mUser.employee_id });
          // Sync to local SQLite
          try {
            const insRes = db.prepare(`
              INSERT OR REPLACE INTO users (employee_id, email, password_hash, role, status)
              VALUES (?, ?, ?, ?, ?)
            `).run(mUser.employee_id, mUser.email, mUser.password_hash, mUser.role, mUser.status || 'active');

            if (mEmp) {
              db.prepare(`
                INSERT OR REPLACE INTO employees (
                  user_id, employee_id, first_name, last_name, middle_initial, full_name, email, phone, designation,
                  date_of_birth, country, state, city, zip_code, address, start_date, end_date, employment_status, registration_status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `).run(
                insRes.lastInsertRowid, mEmp.employee_id, mEmp.first_name || '', mEmp.last_name || '', mEmp.middle_initial || '',
                mEmp.full_name || '', mEmp.email || '', mEmp.phone || '', mEmp.designation || '', mEmp.date_of_birth || '',
                mEmp.country || '', mEmp.state || '', mEmp.city || '', mEmp.zip_code || '', mEmp.address || '',
                mEmp.start_date || '', mEmp.end_date || null, mEmp.employment_status || 'Active', mEmp.registration_status || 'Approved'
              );
            }
          } catch (syncErr) {
            console.warn('[Sync SQLite Warning]', syncErr.message);
          }

          user = {
            id: mUser._id.toString(),
            employee_id: mUser.employee_id,
            email: mUser.email,
            password_hash: mUser.password_hash,
            role: mUser.role,
            status: mUser.status || 'active',
            full_name: mEmp ? mEmp.full_name : 'User',
            designation: mEmp ? mEmp.designation : 'Staff',
            profile_image_url: mEmp ? mEmp.profile_image_url : null,
            registration_status: mEmp ? mEmp.registration_status : 'Approved'
          };
        }
      } catch (mErr) {
        console.warn('[MongoDB Atlas Lookup Warning]', mErr.message);
      }
    }

    if (!user) {
      logAudit({
        userId: cleanIdentifier,
        userName: cleanIdentifier,
        userRole: 'unknown',
        action: 'LOGIN_FAILED',
        details: 'User not found',
        ipAddress: req.ip,
        status: 'FAILURE'
      });
      return res.status(401).json({ error: 'Invalid credentials. Please verify your Employee ID / Email and password.' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account is suspended. Please contact Shinetek HR.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      logAudit({
        userId: user.employee_id,
        userName: user.full_name || user.email,
        userRole: user.role,
        action: 'LOGIN_FAILED',
        details: 'Password mismatch',
        ipAddress: req.ip,
        status: 'FAILURE'
      });
      return res.status(401).json({ error: 'Invalid credentials. Please verify your Employee ID / Email and password.' });
    }

    const token = jwt.sign(
      { id: user.id, employeeId: user.employee_id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logAudit({
      userId: user.employee_id,
      userName: user.full_name || user.email,
      userRole: user.role,
      action: user.role === 'admin' ? 'ADMIN_LOGIN' : 'EMPLOYEE_LOGIN',
      details: `Successful login via ${cleanIdentifier.includes('@') ? 'email' : 'employee ID'}`,
      ipAddress: req.ip,
      status: 'SUCCESS'
    });

    res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        employeeId: user.employee_id,
        email: user.email,
        role: user.role,
        fullName: user.full_name || (user.role === 'admin' ? 'Administrator' : 'Employee'),
        designation: user.designation || (user.role === 'admin' ? 'System Administrator' : 'Staff'),
        profileImageUrl: user.profile_image_url,
        registrationStatus: user.registration_status || (user.role === 'admin' ? 'Approved' : 'Pending Review')
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: 'An unexpected server error occurred during login.' });
  }
}

export function getMe(req, res) {
  try {
    const user = db.prepare(`
      SELECT u.id, u.employee_id, u.email, u.role, u.status,
             e.first_name, e.last_name, e.middle_initial, e.full_name, e.phone, e.designation, e.date_of_birth,
             e.country, e.state, e.city, e.zip_code, e.address,
             e.start_date, e.end_date, e.employment_status,
             e.profile_image_url, e.registration_status, e.admin_notes,
             e.submitted_at, e.reviewed_at, e.reviewed_by
      FROM users u
      LEFT JOIN employees e ON e.employee_id = u.employee_id
      WHERE u.id = ?
    `).get(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const unreadCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE employee_id = ? AND is_read = 0')
      .get(user.employee_id)?.count || 0;

    const isStillWorking = (user.employment_status !== 'Inactive') && (!user.end_date || new Date(user.end_date) >= new Date(new Date().toDateString()));

    res.json({
      user: {
        id: user.id,
        employeeId: user.employee_id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        middleInitial: user.middle_initial,
        fullName: user.full_name || (user.role === 'admin' ? 'System Administrator' : 'Employee'),
        phone: user.phone,
        designation: user.designation || (user.role === 'admin' ? 'System Administrator' : 'Staff'),
        dateOfBirth: user.date_of_birth,
        country: user.country,
        state: user.state,
        city: user.city,
        zipCode: user.zip_code,
        address: user.address,
        startDate: user.start_date,
        endDate: user.end_date,
        employmentStatus: user.employment_status || 'Active',
        isStillWorking,
        profileImageUrl: user.profile_image_url,
        registrationStatus: user.registration_status || (user.role === 'admin' ? 'Approved' : 'Pending Review'),
        adminNotes: user.admin_notes,
        submittedAt: user.submitted_at,
        reviewedAt: user.reviewed_at,
        reviewedBy: user.reviewed_by,
        unreadNotifications: unreadCount
      }
    });
  } catch (err) {
    console.error('[getMe Error]', err);
    res.status(500).json({ error: 'Failed to retrieve user profile.' });
  }
}

export function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const user = db.prepare('SELECT id, employee_id, email FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (!user) {
      // Return neutral message for security
      return res.json({ message: 'If an account with this email exists, password reset instructions have been generated.' });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

    db.prepare(`
      INSERT INTO password_resets (email, token, expires_at, used)
      VALUES (?, ?, ?, 0)
    `).run(user.email, token, expiresAt);

    logAudit({
      userId: user.employee_id,
      userName: user.email,
      userRole: 'employee',
      action: 'PASSWORD_RESET_REQUESTED',
      details: `Password reset token generated for ${user.email}`,
      ipAddress: req.ip
    });

    res.json({
      message: 'Password reset link generated successfully.',
      resetToken: token,
      expiresAt
    });
  } catch (err) {
    console.error('[forgotPassword Error]', err);
    res.status(500).json({ error: 'Failed to process password reset request.' });
  }
}

export async function resetPassword(req, res) {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const resetRecord = db.prepare(`
      SELECT id, email, expires_at, used
      FROM password_resets
      WHERE token = ? AND used = 0
    `).get(token);

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or already used reset token.' });
    }

    if (new Date(resetRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const updateTx = db.transaction(() => {
      db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?')
        .run(passwordHash, resetRecord.email);
      db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?')
        .run(resetRecord.id);
    });

    updateTx();

    logAudit({
      userId: resetRecord.email,
      userName: resetRecord.email,
      userRole: 'user',
      action: 'PASSWORD_RESET_COMPLETED',
      details: `Password successfully updated for ${resetRecord.email}`,
      ipAddress: req.ip
    });

    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (err) {
    console.error('[resetPassword Error]', err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
}

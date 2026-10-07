import { accounts } from '../services/accounts.js';
import mongoose from 'mongoose';
import path from 'node:path';
import { PRIVATE_DOCS_DIR } from '../middleware/upload.js';
import { persistPrivateFile } from '../services/privateFiles.js';
import { readInvitation, invitationKey } from '../services/invitations.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { accessStore, accessError, getCompanies, assignmentCompanies, getAdminAccess } from '../services/companyAccessStore.js';
import { verifyUploadReceipt } from '../services/uploadReceipt.js';
import { db } from '../db/schema.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { logAudit } from '../middleware/audit.js';
import { generateNextEmployeeIdSync } from './settingsController.js';
import { validateAddressInfo } from '../data/addressData.js';
import { User as MongoUser, Employee as MongoEmployee, Document as MongoDoc, Notification as MongoNotif } from '../models/index.js';
import { isMongoConnected } from '../db/mongo.js';
import { createEmployeeProfileReader, withEmployeeProfile } from '../services/employeeProfileReader.js';

const findEmployeeProfile = createEmployeeProfileReader({ db, Employee: MongoEmployee, isMongoConnected });

export async function register(req, res) {
  let claimed = false, newEmployeeId = null, cloudCommitted = false, completed = false;
  try {
    if (Object.entries(req.body).some(([key, value]) => !['uploadedDocuments', 'companyIds'].includes(key) && value != null && typeof value !== 'string')) throw accessError('Registration fields must be text.', 400);
    const invitation = await readInvitation(req.body.invitationToken);
    if (invitation.role !== 'employee' || invitation.email !== String(req.body.email || '').trim().toLowerCase()) throw accessError('Use the email address on your employee invitation.', 400);
    const registrationCompany = req.body.companyId;
    if (!invitation.companyIds.includes(registrationCompany)) throw accessError('Select an assigned company for your onboarding documents.', 400);
    const {
      lastName,
      firstName,
      middleInitial,
      fullName,
      email,
      phone,
      gender,
      password,
      confirmPassword,
      designation,
      dateOfBirth,
      country,
      state,
      city,
      zipCode,
      zipCodePart1,
      zipCodePart2,
      address,
      addressLine1,
      addressLine2,
      suiteApt,
      emergencyFirstName,
      emergencyLastName,
      emergencyEmail,
      emergencyPhone,
      emergencyRelationship,
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

    if (Array.isArray(uploadedDocuments)) {
      for (const doc of uploadedDocuments) {
        try { verifyUploadReceipt(doc, req.body.invitationToken); } catch { return res.status(400).json({ error: 'Please upload your registration documents again.' }); }
        if (db.prepare('SELECT id FROM documents WHERE file_path = ?').get(doc.filePath) || (isMongoConnected() && await MongoDoc.exists({ file_path: doc.filePath }))) return res.status(400).json({ error: 'Document already attached to an account.' });
      }
    }

    // Check duplicate email
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existingUser || (isMongoConnected() && await MongoUser.exists({ email: email.trim().toLowerCase() }))) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    // Build structured address string if not provided directly
    const effectiveAddress = address && address.trim()
      ? address.trim()
      : [addressLine1, addressLine2, suiteApt].filter(Boolean).map(s => s.trim()).join(', ');

    const effectiveZip = zipCode && zipCode.trim()
      ? zipCode.trim()
      : (zipCodePart1 && zipCodePart2 ? `${zipCodePart1.trim()}-${zipCodePart2.trim()}` : (zipCodePart1 || zipCodePart2 || '').trim());

    // Validate Address
    const addressValidation = validateAddressInfo(country, state, city, effectiveZip);
    if (!addressValidation.isValid) {
      return res.status(400).json({ error: addressValidation.errors.join(' ') });
    }

    // Securely hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    let userId = null;
    const todayDate = new Date().toISOString().split('T')[0];

    // Atomic transaction for ID generation and user/employee insertion
    const registerTx = db.transaction(() => {
      // ID has been reserved and checked before entering this transaction.

      const userInsert = db.prepare(`
        INSERT INTO users (employee_id, email, password_hash, role, status)
        VALUES (?, ?, ?, 'employee', 'active')
      `);
      const userResult = userInsert.run(newEmployeeId, email.trim().toLowerCase(), passwordHash);
      userId = userResult.lastInsertRowid;

      const employeeInsert = db.prepare(`
        INSERT INTO employees (
          user_id, employee_id, first_name, last_name, middle_initial, full_name, email, phone, gender, designation,
          date_of_birth, country, state, city, zip_code, zip_code_part1, zip_code_part2,
          address, address_line_1, address_line_2, suite_apt,
          emergency_first_name, emergency_last_name, emergency_email, emergency_phone, emergency_relationship,
          start_date, end_date, employment_status,
          profile_image_url, registration_status, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Review', CURRENT_TIMESTAMP)
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
        gender || null,
        designation.trim(),
        dateOfBirth,
        country ? country.trim() : '',
        state ? state.trim() : '',
        city ? city.trim() : '',
        effectiveZip,
        zipCodePart1 ? zipCodePart1.trim() : null,
        zipCodePart2 ? zipCodePart2.trim() : null,
        effectiveAddress,
        addressLine1 ? addressLine1.trim() : null,
        addressLine2 ? addressLine2.trim() : null,
        suiteApt ? suiteApt.trim() : null,
        emergencyFirstName ? emergencyFirstName.trim() : null,
        emergencyLastName ? emergencyLastName.trim() : null,
        emergencyEmail ? emergencyEmail.trim() : null,
        emergencyPhone ? emergencyPhone.trim() : null,
        emergencyRelationship ? emergencyRelationship.trim() : null,
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

    for (const doc of uploadedDocuments || []) await persistPrivateFile({ path: path.join(PRIVATE_DOCS_DIR, path.basename(doc.filePath)), filename: doc.filePath });
    if (!await accessStore.claim(invitationKey(req.body.invitationToken))) throw accessError('Invitation already used.', 409);
    claimed = true;
    do { newEmployeeId = generateNextEmployeeIdSync(); } while (db.prepare('SELECT id FROM users WHERE employee_id=?').get(newEmployeeId) || (isMongoConnected() && await MongoUser.exists({ employee_id: newEmployeeId })));
    registerTx();
    await accessStore.set(`assignment:${newEmployeeId}`, { employeeId: newEmployeeId, companyIds: invitation.companyIds, companyId: invitation.companyIds[0] });
    db.prepare('UPDATE documents SET company_id = ? WHERE employee_id = ?').run(registrationCompany, newEmployeeId);

    // Publish the cloud account/profile/documents atomically; a failed transaction is retryable.
    if (isMongoConnected()) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const [account] = await MongoUser.create([{ employee_id: newEmployeeId, email: email.trim().toLowerCase(), password_hash: passwordHash, role: 'employee', status: 'active' }], { session });
          const { id, user_id, ...profile } = db.prepare('SELECT * FROM employees WHERE employee_id=?').get(newEmployeeId);
          await MongoEmployee.create([{ ...profile, user_id: account._id }], { session });
          const docs = db.prepare('SELECT * FROM documents WHERE employee_id=?').all(newEmployeeId).map(({ id, ...doc }) => doc);
          if (docs.length) await MongoDoc.create(docs, { session });
        });
        cloudCommitted = true;
      } finally { await session.endSession(); }
    }
    completed = true;

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
    if (claimed && !completed && !cloudCommitted) {
      try {
        if (newEmployeeId) { db.prepare('DELETE FROM employees WHERE employee_id=?').run(newEmployeeId); db.prepare('DELETE FROM users WHERE employee_id=?').run(newEmployeeId); }
        const current = await accessStore.get(invitationKey(req.body.invitationToken));
        await accessStore.set(invitationKey(req.body.invitationToken), { ...current, usedAt: null });
      } catch (cleanupError) { console.error('[Registration recovery]', cleanupError.message); }
    }
    console.error('[Register Error]', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'Registration could not be completed. Contact your administrator before trying again.' });
  }
}

export async function login(req, res) {
  try {
    const { identifier, password } = req.body || {};

    if (typeof identifier !== 'string' || !identifier.trim() || typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Enter your username (email or employee ID) and password.' });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    let user = await accounts.find(cleanIdentifier);

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
      return res.status(401).json({ error: 'Invalid username or password.' });
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
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    user = accounts.cache(user);
    if (!user.full_name) {
      user = withEmployeeProfile(user, await findEmployeeProfile(user.employee_id));
    }

    const access = user.role === 'admin' ? await getAdminAccess(user) : {};
    if (user.role === 'admin' && !access.enabled) return res.status(403).json({ error: 'Administrator access is disabled. Contact the super admin.' });
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
      details: 'Successful login via corporate email',
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
        isSuperAdmin: access.isSuperAdmin === true,
        fullName: user.full_name || access.name || (user.role === 'admin' ? 'Administrator' : 'Employee'),
        designation: user.designation || (user.role === 'admin' ? 'System Administrator' : 'Staff'),
        profileImageUrl: user.profile_image_url,
        registrationStatus: user.registration_status || (user.role === 'admin' ? 'Approved' : 'Pending Review')
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(err.status || 500).json({ error: err.status ? err.message : 'An unexpected server error occurred during login.' });
  }
}

export async function getMe(req, res) {
  try {
    let user = db.prepare(`
      SELECT u.id, u.employee_id, u.email, u.role, u.status,
             e.first_name, e.last_name, e.middle_initial, e.full_name, e.phone, e.gender, e.designation, e.date_of_birth,
             e.country, e.state, e.city, e.zip_code, e.zip_code_part1, e.zip_code_part2,
             e.address, e.address_line_1, e.address_line_2, e.suite_apt,
             e.emergency_first_name, e.emergency_last_name, e.emergency_email, e.emergency_phone, e.emergency_relationship,
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

    if (!user.full_name) {
      user = withEmployeeProfile(user, await findEmployeeProfile(user.employee_id));
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
        isSuperAdmin: req.user.isSuperAdmin === true,
        firstName: user.first_name,
        lastName: user.last_name,
        middleInitial: user.middle_initial,
        fullName: user.full_name || req.user.adminName || (user.role === 'admin' ? 'System Administrator' : 'Employee'),
        phone: user.phone,
        gender: user.gender,
        designation: user.designation || (user.role === 'admin' ? 'System Administrator' : 'Staff'),
        dateOfBirth: user.date_of_birth,
        country: user.country,
        state: user.state,
        city: user.city,
        zipCode: user.zip_code,
        zipCodePart1: user.zip_code_part1,
        zipCodePart2: user.zip_code_part2,
        address: user.address,
        addressLine1: user.address_line_1,
        addressLine2: user.address_line_2,
        suiteApt: user.suite_apt,
        emergencyFirstName: user.emergency_first_name,
        emergencyLastName: user.emergency_last_name,
        emergencyEmail: user.emergency_email,
        emergencyPhone: user.emergency_phone,
        emergencyRelationship: user.emergency_relationship,
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
  res.json({ message: 'Contact your administrator to recover your account. Self-service email recovery is not configured.' });
}

export async function resetPassword(req, res) {
  res.status(403).json({ error: 'Contact your administrator to recover your account.' });
}

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { initSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';

import { authenticateToken, requireAdmin } from './middleware/auth.js';
import { uploadAvatar, uploadDocument, uploadTimesheet, AVATAR_DIR } from './middleware/upload.js';

import * as authCtrl from './controllers/authController.js';
import * as addressCtrl from './controllers/addressController.js';
import * as empCtrl from './controllers/employeeController.js';
import * as docCtrl from './controllers/documentController.js';
import * as timeCtrl from './controllers/timesheetController.js';
import * as payCtrl from './controllers/payrollController.js';
import * as settingsCtrl from './controllers/settingsController.js';
import * as auditCtrl from './controllers/auditController.js';
import * as notifCtrl from './controllers/notificationController.js';
import * as vendorCtrl from './controllers/vendorController.js';
import * as payrollEntryCtrl from './controllers/payrollEntryController.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static route for avatars (Publicly viewable profile icons)
app.use('/uploads/avatars', express.static(AVATAR_DIR));

// -------------------------------------------------------------
// Public Routes
// -------------------------------------------------------------

// System & ID Preview
app.get('/api/settings/next-id', settingsCtrl.getNextIdPreview);

// Dynamic Address Data
app.get('/api/address/countries', addressCtrl.getCountries);
app.get('/api/address/states/:country', addressCtrl.getStatesByCountry);
app.get('/api/address/cities/:country/:state', addressCtrl.getCitiesByState);
app.post('/api/address/validate', addressCtrl.validateAddress);

// Authentication
app.post('/api/auth/register', authCtrl.register);
app.post('/api/auth/login', authCtrl.login);
app.post('/api/auth/forgot-password', authCtrl.forgotPassword);
app.post('/api/auth/reset-password', authCtrl.resetPassword);

// Temp upload during registration wizard (pre-auth)
app.post('/api/upload/avatar', uploadAvatar.single('avatar'), docCtrl.uploadProfilePicture);
app.post('/api/upload/document', uploadDocument.single('document'), docCtrl.uploadEmployeeDocument);

// -------------------------------------------------------------
// Protected Routes (Employees & Admins)
// -------------------------------------------------------------
app.use('/api', authenticateToken);

// Auth Me
app.get('/api/auth/me', authCtrl.getMe);

// Employee Profile (self)
app.get('/api/employee/profile', empCtrl.getEmployeeProfile);
app.put('/api/employee/profile', empCtrl.updateEmployeeProfile);

// Documents (self)
app.get('/api/documents', docCtrl.getEmployeeDocuments);
app.post('/api/documents/upload', uploadDocument.single('document'), docCtrl.uploadEmployeeDocument);
app.get('/api/documents/stream/:id', docCtrl.streamDocument);

// Timesheets (self)
app.get('/api/timesheets/my', timeCtrl.getMyTimesheets);
app.post('/api/timesheets/submit', uploadTimesheet.single('timesheetFile'), timeCtrl.submitTimesheet);
app.get('/api/timesheets/download/:id', timeCtrl.downloadTimesheetFile);

// Payroll (self)
app.get('/api/payroll/my', payCtrl.getMyPayroll);

// Notifications (self)
app.get('/api/notifications', notifCtrl.getMyNotifications);
app.patch('/api/notifications/:id/read', notifCtrl.markNotificationRead);
app.post('/api/notifications/read-all', notifCtrl.markAllNotificationsRead);

// -------------------------------------------------------------
// Protected Admin Routes
// -------------------------------------------------------------
app.get('/api/admin/dashboard', requireAdmin, empCtrl.getDashboardStats);

// Admin Employee Management
app.get('/api/admin/employees', requireAdmin, empCtrl.getAllEmployees);
app.get('/api/admin/employees/:employeeId', requireAdmin, empCtrl.getEmployeeDetail);
app.put('/api/admin/employees/:employeeId', requireAdmin, empCtrl.updateEmployeeProfile);
app.patch('/api/admin/employees/:employeeId/status', requireAdmin, empCtrl.reviewEmployeeStatus);
app.patch('/api/admin/employees/:employeeId/employment-status', requireAdmin, empCtrl.toggleEmploymentStatus);

// Admin Document Review
app.patch('/api/admin/documents/:id/review', requireAdmin, docCtrl.reviewDocument);

// Admin Timesheets
app.get('/api/admin/timesheets', requireAdmin, timeCtrl.getAllTimesheets);
app.patch('/api/admin/timesheets/:id/review', requireAdmin, timeCtrl.reviewTimesheet);

// Admin Payroll
app.get('/api/admin/payroll', requireAdmin, payCtrl.getAllPayroll);
app.post('/api/admin/payroll', requireAdmin, payCtrl.createPayrollRecord);

// Admin System Settings (Configurable Employee ID generator)
app.get('/api/admin/settings', requireAdmin, settingsCtrl.getSettings);
app.put('/api/admin/settings', requireAdmin, settingsCtrl.updateSettings);

// Admin Vendor Details
app.get('/api/admin/vendors', requireAdmin, vendorCtrl.getAllVendorDetails);
app.post('/api/admin/vendors', requireAdmin, vendorCtrl.createVendorDetail);
app.put('/api/admin/vendors/:id', requireAdmin, vendorCtrl.updateVendorDetail);
app.delete('/api/admin/vendors/:id', requireAdmin, vendorCtrl.deleteVendorDetail);

// Admin Payroll Entries (Monthly billing)
app.get('/api/admin/payroll-entries', requireAdmin, payrollEntryCtrl.getAllPayrollEntries);
app.post('/api/admin/payroll-entries', requireAdmin, payrollEntryCtrl.createPayrollEntry);
app.put('/api/admin/payroll-entries/:id', requireAdmin, payrollEntryCtrl.updatePayrollEntry);
app.delete('/api/admin/payroll-entries/:id', requireAdmin, payrollEntryCtrl.deletePayrollEntry);

// Admin Audit Logs
app.get('/api/admin/audit-logs', requireAdmin, auditCtrl.getAuditLogs);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'An internal server error occurred.'
  });
});

import { connectMongoDB } from './db/mongo.js';

// Initialize & Start Server
async function startServer() {
  // 1. Initialize SQLite Database & Local Defaults
  await seedDatabase();

  // 2. Connect to MongoDB using MONGODB_URI in .env
  await connectMongoDB();

  app.listen(PORT, () => {
    console.log(`[Shinetek Server] Running on http://localhost:${PORT}`);
  });
}

startServer();

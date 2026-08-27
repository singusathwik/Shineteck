import mongoose from 'mongoose';

// 1. System Settings Schema (Configurable Employee ID sequence, Prefix, etc.)
const SystemSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  description: { type: String },
  updated_at: { type: Date, default: Date.now }
});
export const SystemSetting = mongoose.models.SystemSetting || mongoose.model('SystemSetting', SystemSettingSchema);

// 2. User Accounts Schema
const UserSchema = new mongoose.Schema({
  employee_id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password_hash: { type: String, required: true },
  role: { type: String, enum: ['employee', 'admin'], default: 'employee' },
  status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'pending' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
export const User = mongoose.models.User || mongoose.model('User', UserSchema);

// 3. Employee Profile Schema
const EmployeeSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  employee_id: { type: String, required: true, unique: true, index: true },
  first_name: { type: String },
  last_name: { type: String },
  middle_initial: { type: String, default: null },
  full_name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, required: true },
  designation: { type: String, required: true },
  date_of_birth: { type: String, required: true },
  country: { type: String, required: true },
  state: { type: String, required: true },
  city: { type: String, required: true },
  zip_code: { type: String, required: true },
  address: { type: String, required: true },
  profile_image_url: { type: String, default: null },
  start_date: { type: String, default: null },
  end_date: { type: String, default: null },
  employment_status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  registration_status: {
    type: String,
    enum: ['Pending Review', 'Approved', 'Needs Correction', 'Rejected'],
    default: 'Pending Review'
  },
  admin_notes: { type: String, default: null },
  submitted_at: { type: Date, default: Date.now },
  reviewed_at: { type: Date, default: null },
  reviewed_by: { type: String, default: null },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
export const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

// 4. Document Schema
const DocumentSchema = new mongoose.Schema({
  employee_id: { type: String, required: true, index: true },
  document_type: { type: String, enum: ['w4', 'i9', 'passport', 'visa'], required: true },
  file_name: { type: String, required: true },
  file_path: { type: String, required: true },
  file_size: { type: Number, required: true },
  mime_type: { type: String, required: true },
  status: {
    type: String,
    enum: ['Uploaded', 'Approved', 'Needs Replacement', 'Rejected'],
    default: 'Uploaded'
  },
  review_notes: { type: String, default: null },
  uploaded_at: { type: Date, default: Date.now },
  reviewed_at: { type: Date, default: null },
  reviewed_by: { type: String, default: null }
});
export const Document = mongoose.models.Document || mongoose.model('Document', DocumentSchema);

// 5. Timesheet Schema
const TimesheetSchema = new mongoose.Schema({
  employee_id: { type: String, required: true, index: true },
  employee_name: { type: String },
  start_date: { type: String, required: true },
  end_date: { type: String, required: true },
  total_hours: { type: Number, required: true },
  file_name: { type: String, default: null },
  file_path: { type: String, default: null },
  notes: { type: String, default: null },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Needs Correction'],
    default: 'Pending'
  },
  admin_feedback: { type: String, default: null },
  submitted_at: { type: Date, default: Date.now },
  reviewed_at: { type: Date, default: null },
  reviewed_by: { type: String, default: null }
});
export const Timesheet = mongoose.models.Timesheet || mongoose.model('Timesheet', TimesheetSchema);

// 6. Payroll Record Schema
const PayrollSchema = new mongoose.Schema({
  employee_id: { type: String, required: true, index: true },
  pay_period_start: { type: String, required: true },
  pay_period_end: { type: String, required: true },
  gross_pay: { type: Number, required: true },
  deductions: { type: Number, default: 0.0 },
  net_pay: { type: Number, required: true },
  currency: {
    type: String,
    enum: ['USD', 'INR'],
    default: 'USD'
  },
  payment_date: { type: String, required: true },
  payment_status: {
    type: String,
    enum: ['Paid', 'Processing', 'Scheduled'],
    default: 'Paid'
  },
  created_at: { type: Date, default: Date.now }
});
export const Payroll = mongoose.models.Payroll || mongoose.model('Payroll', PayrollSchema);

// 7. Audit Log Schema
const AuditLogSchema = new mongoose.Schema({
  user_id: { type: String },
  user_name: { type: String },
  user_role: { type: String },
  action: { type: String, required: true },
  entity_type: { type: String, default: null },
  entity_id: { type: String, default: null },
  details: { type: String, default: '' },
  ip_address: { type: String, default: '127.0.0.1' },
  status: { type: String, default: 'SUCCESS' },
  timestamp: { type: Date, default: Date.now }
});
export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);

// 8. Notification Schema
const NotificationSchema = new mongoose.Schema({
  employee_id: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info'
  },
  is_read: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});
export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// 9. Password Reset Schema
const PasswordResetSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  token: { type: String, required: true, unique: true },
  expires_at: { type: Date, required: true },
  used: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});
export const PasswordReset = mongoose.models.PasswordReset || mongoose.model('PasswordReset', PasswordResetSchema);

// 10. Vendor Detail Schema
const VendorDetailSchema = new mongoose.Schema({
  employee_id: { type: String, required: true, index: true },
  employee_name: { type: String, required: true },
  vendor_name: { type: String, required: true },
  vendor_address: { type: String, default: '' },
  client_name: { type: String, required: true },
  client_address: { type: String, default: '' },
  hourly_bill_rate: { type: Number, required: true },
  employee_rate: { type: Number, required: true },
  bu_margin: { type: Number, required: true },
  visa_type: { type: String, enum: ['H-1B', 'OPT'], default: 'H-1B' },
  tax_percent: { type: Number, required: true },
  net_margin: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
export const VendorDetail = mongoose.models.VendorDetail || mongoose.model('VendorDetail', VendorDetailSchema);

// 11. Payroll Entry Schema (Monthly billing & payroll)
const PayrollEntrySchema = new mongoose.Schema({
  employee_id: { type: String, required: true, index: true },
  employee_name: { type: String, required: true },
  payroll_month: { type: String, required: true },
  vendor_name: { type: String, default: '' },
  client_name: { type: String, default: '' },
  total_hours: { type: Number, required: true },
  bill_rate: { type: Number, required: true },
  emp_bill_rate: { type: Number, required: true },
  gross_amount: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});
export const PayrollEntry = mongoose.models.PayrollEntry || mongoose.model('PayrollEntry', PayrollEntrySchema);

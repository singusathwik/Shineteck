import { persistAvatar } from '../services/avatars.js';
import { notifyEmployee } from '../services/notifications.js';
import { accessError } from '../services/companyAccessStore.js';
import { persistPrivateFile, readPrivateFile } from '../services/privateFiles.js';
import { mergedRecords, documentIdentity } from '../services/portalRecords.js';
import { createUploadReceipt } from '../services/uploadReceipt.js';
import path from 'path';
import fs from 'fs';
import { db } from '../db/schema.js';
import { logAudit } from '../middleware/audit.js';
import { AVATAR_DIR, PRIVATE_DOCS_DIR } from '../middleware/upload.js';
import { Document as MongoDoc, Notification as MongoNotif } from '../models/index.js';
import { isMongoConnected } from '../db/mongo.js';

// Upload Cropped Profile Picture (returns public-accessible or tokenized path)
export async function uploadProfilePicture(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    await persistAvatar(req.file);
    const relativeUrl = `/uploads/avatars/${req.file.filename}`;

    // If user is already logged in, update employee table
    if (req.user && req.user.employeeId) {
      db.prepare(`
        UPDATE employees
        SET profile_image_url = ?, updated_at = CURRENT_TIMESTAMP
        WHERE employee_id = ?
      `).run(relativeUrl, req.user.employeeId);

      logAudit({
        userId: req.user.employeeId,
        userName: req.user.email,
        userRole: req.user.role,
        action: 'PROFILE_PICTURE_UPLOADED',
        entityType: 'employee',
        entityId: req.user.employeeId,
        details: `Profile picture updated: ${req.file.filename}`,
        ipAddress: req.ip
      });
    }

    res.json({
      message: 'Profile picture uploaded successfully.',
      imageUrl: relativeUrl,
      fileName: req.file.filename,
      size: req.file.size
    });
  } catch (err) {
    if (req.file?.path) await fs.promises.unlink(req.file.path).catch(() => {});
    console.error('[uploadProfilePicture Error]', err);
    res.status(500).json({ error: 'Failed to save profile picture.' });
  }
}

const ALLOWED_DOC_TYPES = [
  'w4', 'w9', 'i9', 'passport', 'visa',
  'driver_license', 'aadhaar', 'pan', 'ach_form',
  'emergency_contact_form', 'medical_health_insurance',
  'ssn_copy', 'i94', 'employee_agreement', 'offer_letter', 'e_verify'
];

// Required documents are owned by both an employee and a company.
const handle = action => async (req, res) => { try { await action(req, res); } catch (error) { if (req.file?.path) await fs.promises.unlink(req.file.path).catch(() => {}); res.status(error.status || 500).json({ error: error.status ? error.message : 'Unable to process the document. Please try again.' }); } };
const normalize = row => ({ ...row, id: String(row._id || row.id) });
export async function documentRows() { return (await mergedRecords('documents', MongoDoc, documentIdentity)).map(normalize); }
async function find(id) { return /^[a-f0-9]{24}$/i.test(id) && isMongoConnected() ? MongoDoc.findById(id).lean() : db.prepare('SELECT * FROM documents WHERE id = ?').get(id); }
export const uploadEmployeeDocument = handle(async (req, res) => {
  if (!req.file) throw accessError('Select a document to upload.', 400);
  const type = String(req.body.documentType || '').toLowerCase();
  if (!ALLOWED_DOC_TYPES.includes(type)) { await fs.promises.unlink(req.file.path).catch(() => {}); throw accessError('Select a valid document type.', 400); }
  const expiry = req.body.expiryDate || null;
  if (expiry && (!/^\d{4}-\d{2}-\d{2}$/.test(expiry) || !Number.isFinite(Date.parse(expiry)) || new Date(expiry).toISOString().slice(0, 10) !== expiry)) throw accessError('Enter a valid expiry date.', 400);
  const uploaded = { documentType: type, fileName: req.file.originalname, filePath: req.file.filename, fileSize: req.file.size, mimeType: req.file.mimetype, uploadedAt: new Date().toISOString() };
  if (!req.user) return res.json({ message: 'Document uploaded for registration.', document: { ...uploaded, uploadToken: createUploadReceipt(uploaded, req.registrationToken) } });
  if (!req.companyId) throw accessError('Select a company before uploading.', 400);
  await persistPrivateFile(req.file);
  const data = { employee_id: req.user.employeeId, company_id: req.companyId, document_type: type, expiry_date: expiry, file_name: req.file.originalname, file_path: req.file.filename, file_size: req.file.size, mime_type: req.file.mimetype, status: 'Uploaded', review_notes: null, uploaded_at: new Date().toISOString(), reviewed_at: null, reviewed_by: null };
  let row;
  if (isMongoConnected()) row = (await MongoDoc.findOneAndUpdate({ employee_id: data.employee_id, company_id: data.company_id, document_type: type }, { $set: data }, { new: true, upsert: true, runValidators: true })).toObject();
  else {
    const existing = db.prepare('SELECT id FROM documents WHERE employee_id=? AND company_id=? AND document_type=?').get(data.employee_id, data.company_id, type);
    if (existing) { db.prepare(`UPDATE documents SET ${Object.keys(data).map(key => `${key}=@${key}`).join(',')} WHERE id=@id`).run({ ...data, id: existing.id }); row = { ...data, id: existing.id }; }
    else { const result = db.prepare(`INSERT INTO documents (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map(key => `@${key}`).join(',')})`).run(data); row = { ...data, id: Number(result.lastInsertRowid) }; }
  }
  logAudit({ userId: req.user.employeeId, userName: req.user.email, userRole: req.user.role, action: 'DOCUMENT_UPLOADED', entityType: 'document', entityId: row._id || row.id, details: `${type} uploaded for ${req.companyId}`, ipAddress: req.ip });
  res.status(201).json({ message: 'Document uploaded.', document: normalize(row) });
});
export const getEmployeeDocuments = handle(async (req, res) => res.json({ documents: (await documentRows()).filter(row => row.employee_id === req.user.employeeId) }));
export const streamDocument = handle(async (req, res) => {
  const doc = await find(req.params.id);
  if (!doc) throw accessError('Document not found.', 404);
  if (req.user.role !== 'admin' && doc.employee_id !== req.user.employeeId) throw accessError('Access denied.');
  const inline = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'].includes(doc.mime_type);
  res.type(inline ? doc.mime_type : 'application/octet-stream');
  res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(doc.file_name)}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const bytes = await readPrivateFile(doc.file_path);
  if (bytes) return res.send(bytes);
  const fullPath = path.resolve(PRIVATE_DOCS_DIR, path.basename(doc.file_path));
  if (!fs.existsSync(fullPath)) throw accessError('This older file is no longer in storage. Please upload a replacement.', 404);
  return res.sendFile(fullPath);
});
export const reviewDocument = handle(async (req, res) => {
  const { status, reviewNotes } = req.body;
  if (!['Approved', 'Needs Replacement', 'Rejected'].includes(status)) throw accessError('Select a valid review status.', 400);
  const doc = await find(req.params.id);
  if (!doc) throw accessError('Document not found.', 404);
  const changes = { status, review_notes: String(reviewNotes || '').slice(0, 2000), reviewed_at: new Date().toISOString(), reviewed_by: req.user.email };
  if (doc._id) await MongoDoc.updateOne({ _id: doc._id }, { $set: changes });
  else db.prepare('UPDATE documents SET status=@status, review_notes=@review_notes, reviewed_at=@reviewed_at, reviewed_by=@reviewed_by WHERE id=@id').run({ ...changes, id: doc.id });
  logAudit({ userId: req.user.employeeId, userName: req.user.email, userRole: 'admin', action: 'DOCUMENT_REVIEWED', entityType: 'document', entityId: req.params.id, details: status, ipAddress: req.ip });
  notifyEmployee(doc.employee_id, doc.company_id || req.companyScope.legacyCompanyFor(doc.employee_id), `Document ${status}`, `${doc.document_type}: ${status}. ${changes.review_notes}`, status === 'Approved' ? 'success' : 'warning');
  res.json({ message: `Document ${status.toLowerCase()}.`, document: normalize({ ...doc, ...changes }) });
});

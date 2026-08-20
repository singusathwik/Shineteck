import path from 'path';
import fs from 'fs';
import { db } from '../db/schema.js';
import { logAudit } from '../middleware/audit.js';
import { AVATAR_DIR, PRIVATE_DOCS_DIR } from '../middleware/upload.js';
import { Document as MongoDoc, Notification as MongoNotif } from '../models/index.js';
import { isMongoConnected } from '../db/mongo.js';

// Upload Cropped Profile Picture (returns public-accessible or tokenized path)
export function uploadProfilePicture(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

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
    console.error('[uploadProfilePicture Error]', err);
    res.status(500).json({ error: 'Failed to save profile picture.' });
  }
}

// Upload Required Document (W-4, I-9, Passport, Visa)
export function uploadEmployeeDocument(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document file was uploaded.' });
    }

    const { documentType, employeeId } = req.body;
    const targetEmployeeId = req.user ? req.user.employeeId : employeeId;

    if (!documentType || !['w4', 'i9', 'passport', 'visa'].includes(documentType.toLowerCase())) {
      // Remove temporary file if invalid type
      if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid document type. Allowed: w4, i9, passport, visa.' });
    }

    const cleanDocType = documentType.toLowerCase();
    const docData = {
      documentType: cleanDocType,
      fileName: req.file.originalname,
      filePath: req.file.filename,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString()
    };

    // If employee is authenticated and exists in DB, update or insert document record
    if (targetEmployeeId) {
      const existingDoc = db.prepare('SELECT id, file_path FROM documents WHERE employee_id = ? AND document_type = ?')
        .get(targetEmployeeId, cleanDocType);

      if (existingDoc) {
        // Delete old physical file if exists
        const oldPath = path.resolve(PRIVATE_DOCS_DIR, existingDoc.file_path);
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { /* ignore */ }
        }

        db.prepare(`
          UPDATE documents
          SET file_name = ?, file_path = ?, file_size = ?, mime_type = ?,
              status = 'Uploaded', review_notes = NULL, uploaded_at = CURRENT_TIMESTAMP,
              reviewed_at = NULL, reviewed_by = NULL
          WHERE id = ?
        `).run(req.file.originalname, req.file.filename, req.file.size, req.file.mimetype, existingDoc.id);

        if (isMongoConnected()) {
          MongoDoc.updateOne(
            { employee_id: targetEmployeeId, document_type: cleanDocType },
            {
              file_name: req.file.originalname,
              file_path: req.file.filename,
              file_size: req.file.size,
              mime_type: req.file.mimetype,
              status: 'Uploaded',
              review_notes: null,
              uploaded_at: new Date(),
              reviewed_at: null,
              reviewed_by: null
            },
            { upsert: true }
          ).catch(e => console.error('[MongoDB Doc Sync Error]', e.message));
        }

        logAudit({
          userId: targetEmployeeId,
          userName: req.user?.email || targetEmployeeId,
          userRole: req.user?.role || 'employee',
          action: 'DOCUMENT_REPLACED',
          entityType: 'document',
          entityId: existingDoc.id,
          details: `Replaced ${cleanDocType.toUpperCase()} document: ${req.file.originalname}`,
          ipAddress: req.ip
        });

        return res.json({
          message: `${cleanDocType.toUpperCase()} document replaced successfully.`,
          document: {
            id: existingDoc.id,
            employeeId: targetEmployeeId,
            ...docData,
            status: 'Uploaded'
          }
        });
      } else {
        const result = db.prepare(`
          INSERT INTO documents (employee_id, document_type, file_name, file_path, file_size, mime_type, status, uploaded_at)
          VALUES (?, ?, ?, ?, ?, ?, 'Uploaded', CURRENT_TIMESTAMP)
        `).run(targetEmployeeId, cleanDocType, req.file.originalname, req.file.filename, req.file.size, req.file.mimetype);

        if (isMongoConnected()) {
          MongoDoc.create({
            employee_id: targetEmployeeId,
            document_type: cleanDocType,
            file_name: req.file.originalname,
            file_path: req.file.filename,
            file_size: req.file.size,
            mime_type: req.file.mimetype,
            status: 'Uploaded',
            uploaded_at: new Date()
          }).catch(e => console.error('[MongoDB Doc Create Error]', e.message));
        }

        logAudit({
          userId: targetEmployeeId,
          userName: req.user?.email || targetEmployeeId,
          userRole: req.user?.role || 'employee',
          action: 'DOCUMENT_UPLOADED',
          entityType: 'document',
          entityId: result.lastInsertRowid,
          details: `Uploaded ${cleanDocType.toUpperCase()} document: ${req.file.originalname}`,
          ipAddress: req.ip
        });

        return res.json({
          message: `${cleanDocType.toUpperCase()} document uploaded successfully.`,
          document: {
            id: result.lastInsertRowid,
            employeeId: targetEmployeeId,
            ...docData,
            status: 'Uploaded'
          }
        });
      }
    }

    // If uploading before final registration submission (wizard step 4)
    res.json({
      message: 'Document uploaded temporarily for registration.',
      document: docData
    });
  } catch (err) {
    console.error('[uploadEmployeeDocument Error]', err);
    res.status(500).json({ error: 'Failed to upload document.' });
  }
}

// Get list of documents for an employee
export function getEmployeeDocuments(req, res) {
  try {
    const employeeId = req.params.employeeId || req.user.employeeId;

    // Authorization check: only self or admin
    if (req.user.role !== 'admin' && req.user.employeeId !== employeeId) {
      return res.status(403).json({ error: 'Unauthorized to view documents for this employee.' });
    }

    const docs = db.prepare(`
      SELECT id, employee_id, document_type, file_name, file_size, mime_type,
             status, review_notes, uploaded_at, reviewed_at, reviewed_by
      FROM documents
      WHERE employee_id = ?
      ORDER BY uploaded_at DESC
    `).all(employeeId);

    res.json({ documents: docs });
  } catch (err) {
    console.error('[getEmployeeDocuments Error]', err);
    res.status(500).json({ error: 'Failed to retrieve documents.' });
  }
}

// Securely stream / download private document
export function streamDocument(req, res) {
  try {
    const { id } = req.params;
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);

    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Security check: Employee can only stream their own documents; Admin can stream any
    if (req.user.role !== 'admin' && req.user.employeeId !== doc.employee_id) {
      logAudit({
        userId: req.user.employeeId,
        userName: req.user.email,
        userRole: req.user.role,
        action: 'UNAUTHORIZED_DOC_ACCESS_ATTEMPT',
        entityType: 'document',
        entityId: id,
        details: `Employee attempted to access unauthorized document ID ${id}`,
        ipAddress: req.ip,
        status: 'FAILURE'
      });
      return res.status(403).json({ error: 'Access denied. You can only view your own documents.' });
    }

    const fullPath = path.resolve(PRIVATE_DOCS_DIR, doc.file_path);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Physical document file missing from private storage.' });
    }

    res.setHeader('Content-Type', doc.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.file_name)}"`);
    
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
  } catch (err) {
    console.error('[streamDocument Error]', err);
    res.status(500).json({ error: 'Failed to stream document.' });
  }
}

// Admin Document Review (Approve, Reject, Request Replacement)
export function reviewDocument(req, res) {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['Approved', 'Needs Replacement', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'Approved', 'Needs Replacement', or 'Rejected'." });
    }

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    db.prepare(`
      UPDATE documents
      SET status = ?, review_notes = ?, reviewed_at = CURRENT_TIMESTAMP, reviewed_by = ?
      WHERE id = ?
    `).run(status, reviewNotes || null, req.user.email, id);

    // Send notification to employee
    const notifTitle = `Document ${doc.document_type.toUpperCase()}: ${status}`;
    const notifMessage = status === 'Needs Replacement'
      ? `Your ${doc.document_type.toUpperCase()} document requires replacement. Reason: ${reviewNotes || 'Please re-upload a clearer copy.'}`
      : `Your ${doc.document_type.toUpperCase()} document status has been updated to ${status}.`;

    if (isMongoConnected()) {
      MongoDoc.updateOne(
        { employee_id: doc.employee_id, document_type: doc.document_type },
        {
          status,
          review_notes: reviewNotes || null,
          reviewed_at: new Date(),
          reviewed_by: req.user.email
        }
      ).catch(e => console.error('[MongoDB Doc Review Sync Error]', e.message));

      MongoNotif.create({
        employee_id: doc.employee_id,
        title: notifTitle,
        message: notifMessage,
        type: status === 'Approved' ? 'success' : (status === 'Needs Replacement' ? 'warning' : 'error'),
        is_read: 0,
        created_at: new Date()
      }).catch(e => console.error('[MongoDB Notif Sync Error]', e.message));
    }

    db.prepare(`
      INSERT INTO notifications (employee_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(
      doc.employee_id,
      notifTitle,
      notifMessage,
      status === 'Approved' ? 'success' : (status === 'Needs Replacement' ? 'warning' : 'error')
    );

    logAudit({
      userId: req.user.employeeId,
      userName: req.user.email,
      userRole: 'admin',
      action: `DOCUMENT_${status.toUpperCase().replace(' ', '_')}`,
      entityType: 'document',
      entityId: id,
      details: `Admin reviewed ${doc.document_type.toUpperCase()} for ${doc.employee_id}: ${status}. Note: ${reviewNotes || 'None'}`,
      ipAddress: req.ip
    });

    const updatedDoc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    res.json({
      message: `Document status updated to ${status}.`,
      document: updatedDoc
    });
  } catch (err) {
    console.error('[reviewDocument Error]', err);
    res.status(500).json({ error: 'Failed to review document.' });
  }
}

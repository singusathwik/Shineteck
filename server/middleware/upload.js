import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure storage directories exist
export const AVATAR_DIR = path.resolve(process.env.SHINETECK_UPLOAD_DIR || path.resolve(__dirname, '../uploads'), 'avatars');
export const PRIVATE_DOCS_DIR = path.resolve(process.env.SHINETECK_UPLOAD_DIR || path.resolve(__dirname, '../uploads'), 'private/documents');
export const TIMESHEET_DIR = path.resolve(process.env.SHINETECK_UPLOAD_DIR || path.resolve(__dirname, '../uploads'), 'timesheets');

[AVATAR_DIR, PRIVATE_DOCS_DIR, TIMESHEET_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage Engine for Avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, AVATAR_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const filename = `avatar-${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// Storage Engine for Private Documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, PRIVATE_DOCS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const docType = req.body.documentType || req.params.docType || 'doc';
    if (typeof docType !== 'string') return cb(Object.assign(new Error('Invalid document type.'), { status: 400 }));
    const cleanDocType = docType.slice(0, 80).replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = `${cleanDocType}-${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// Storage Engine for Timesheets
const timesheetStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TIMESHEET_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `timesheet-${uuidv4()}${ext}`;
    cb(null, filename);
  }
});

// Validate both extension and MIME type; never accept active SVG/HTML uploads.
const mimeTypes = {
  '.jpg': ['image/jpeg', 'image/jpg'], '.jpeg': ['image/jpeg', 'image/jpg'],
  '.png': ['image/png'], '.webp': ['image/webp'], '.pdf': ['application/pdf'],
  '.doc': ['application/msword'], '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.txt': ['text/plain'], '.csv': ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'],
  '.xls': ['application/vnd.ms-excel'], '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
};
const filter = extensions => (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = extensions.includes(ext) && (mimeTypes[ext].includes(file.mimetype) || file.mimetype === 'application/octet-stream');
  if (!allowed) return cb(Object.assign(new Error('Unsupported file type or mismatched file extension. Use one of: ' + extensions.join(', ')), { status: 400 }));
  file.mimetype = mimeTypes[ext][0];
  cb(null, true);
};
const imageFileFilter = filter(['.jpg', '.jpeg', '.png', '.webp']);
const documentFileFilter = filter(['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx', '.txt']);
const timesheetFileFilter = filter(Object.keys(mimeTypes));

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: { files: 1, fields: 20, fieldSize: 64 * 1024, fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: { files: 1, fields: 20, fieldSize: 64 * 1024, fileSize: 25 * 1024 * 1024 } // 25MB limit
});

export const uploadTimesheet = multer({
  storage: timesheetStorage,
  fileFilter: timesheetFileFilter,
  limits: { files: 1, fields: 20, fieldSize: 64 * 1024, fileSize: 25 * 1024 * 1024 } // 25MB limit
});

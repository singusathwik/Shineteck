import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure storage directories exist
export const AVATAR_DIR = path.resolve(__dirname, '../uploads/avatars');
export const PRIVATE_DOCS_DIR = path.resolve(__dirname, '../uploads/private/documents');
export const TIMESHEET_DIR = path.resolve(__dirname, '../uploads/timesheets');

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
    const cleanDocType = docType.replace(/[^a-zA-Z0-9_-]/g, '');
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

// Filter for Images
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image format. Only JPG, JPEG, PNG, and WebP are supported.'), false);
  }
};

// Filter for Documents
const documentFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid document format. Only PDF, JPG, JPEG, and PNG files are allowed.'), false);
  }
};

// Filter for Timesheets
const timesheetFileFilter = (req, file, cb) => {
  const allowedExts = ['.csv', '.xlsx', '.xls', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid timesheet format. Supported formats: CSV, XLSX, XLS, PDF.'), false);
  }
};

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const uploadDocument = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const uploadTimesheet = multer({
  storage: timesheetStorage,
  fileFilter: timesheetFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

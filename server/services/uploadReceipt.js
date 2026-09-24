import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth.js';

export function createUploadReceipt(doc) {
  return jwt.sign({ purpose: 'registration-upload', filePath: doc.filePath, documentType: doc.documentType }, JWT_SECRET, { expiresIn: '2h' });
}
export function verifyUploadReceipt(doc) {
  const receipt = jwt.verify(doc.uploadToken, JWT_SECRET);
  if (receipt.purpose !== 'registration-upload' || receipt.filePath !== doc.filePath || receipt.documentType !== doc.documentType) throw new Error('Invalid upload receipt');
}

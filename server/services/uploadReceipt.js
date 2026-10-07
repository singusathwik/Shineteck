import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth.js';
import { createHash } from 'node:crypto';

const fields = ['filePath', 'documentType', 'fileName', 'fileSize', 'mimeType'];
const owner = token => token ? createHash('sha256').update(token).digest('hex') : null;
export function createUploadReceipt(doc, invitationToken) {
  return jwt.sign({ purpose: 'registration-upload', owner: owner(invitationToken), ...Object.fromEntries(fields.map(key => [key, doc[key]])) }, JWT_SECRET, { expiresIn: '2h' });
}
export function verifyUploadReceipt(doc, invitationToken) {
  const receipt = jwt.verify(doc.uploadToken, JWT_SECRET);
  if (receipt.purpose !== 'registration-upload' || receipt.owner !== owner(invitationToken) || fields.some(key => receipt[key] !== doc[key])) throw new Error('Invalid upload receipt');
}

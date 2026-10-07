import { accessStore } from './companyAccessStore.js';
import { persistPrivateFile, readPrivateFile } from './privateFiles.js';

// Public portraits have a separate namespace from private employee documents.
const store = {
  get: key => accessStore.get(`avatar:${key}`),
  set: (key, value) => accessStore.set(`avatar:${key}`, value),
};
export const persistAvatar = file => persistPrivateFile(file, store);
export async function serveStoredAvatar(req, res, next) {
  if (!/^avatar-[a-f\d-]{36}\.(?:jpe?g|png|webp)$/i.test(req.params.filename)) return next();
  try {
    const bytes = await readPrivateFile(req.params.filename, store);
    if (!bytes) return res.status(404).end();
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.type(req.params.filename.split('.').at(-1));
    res.send(bytes);
  } catch { res.status(503).json({ error: 'Profile image temporarily unavailable.' }); }
}

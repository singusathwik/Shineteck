import fs from 'node:fs/promises';
import { accessStore } from './companyAccessStore.js';

// Chunks remain below MongoDB's per-document limit, including base64 overhead.
export async function persistPrivateFile(file, store = accessStore) {
  const bytes = await fs.readFile(file.path);
  const chunkSize = 4 * 1024 * 1024;
  const count = Math.ceil(bytes.length / chunkSize);
  for (let i = 0; i < count; i++) await store.set(`file:${file.filename}:${i}`, { content: bytes.subarray(i * chunkSize, (i + 1) * chunkSize).toString('base64') });
  await store.set(`file:${file.filename}:meta`, { count, size: bytes.length });
}
export async function readPrivateFile(filename, store = accessStore) {
  const meta = await store.get(`file:${filename}:meta`);
  if (!meta) return null;
  const chunks = await Promise.all(Array.from({ length: meta.count }, (_, i) => store.get(`file:${filename}:${i}`)));
  if (chunks.some(chunk => !chunk)) throw new Error('Stored file is incomplete.');
  return Buffer.concat(chunks.map(chunk => Buffer.from(chunk.content, 'base64')));
}

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

test('fresh database seeding completes and can be repeated without duplicate documents', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shineteck-seed-test-'));
  process.env.NODE_ENV = 'test';
  process.env.SHINETECK_DB_PATH = path.join(directory, 'test.db');
  process.env.SHINETECK_UPLOAD_DIR = path.join(directory, 'uploads');
  const { db } = await import('./db/schema.js');
  try {
    const { seedDatabase } = await import('./db/seed.js');
    await seedDatabase();
    const documents = db.prepare('SELECT status FROM documents ORDER BY id').all();
    assert.equal(documents.length, 5);
    assert.deepEqual(documents.map(document => document.status), ['Uploaded', 'Uploaded', 'Uploaded', 'Uploaded', 'Needs Replacement']);
    assert.ok(db.prepare('SELECT COUNT(*) AS count FROM vendor_details').get().count > 0);
    await seedDatabase();
    assert.deepEqual(db.prepare('SELECT status FROM documents ORDER BY id').all(), documents);
  } finally {
    db.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

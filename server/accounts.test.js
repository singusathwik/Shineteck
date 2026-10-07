import test from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import { createAccountReader } from './services/accounts.js';

test('cloud account state wins over stale cache and survives local ID changes', async () => {
  const database = new Database(':memory:');
  database.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, employee_id TEXT UNIQUE, email TEXT UNIQUE, password_hash TEXT, role TEXT, status TEXT);
    INSERT INTO users VALUES (91, 'EMP-1', 'user@example.test', 'stale', 'admin', 'active')`);
  let remote = { employee_id: 'EMP-1', email: 'user@example.test', password_hash: 'new-hash', role: 'employee', status: 'suspended' };
  let connected = true;
  const reader = createAccountReader({ database, configured: () => true, connected: () => connected,
    model: { findOne(query) { assert.ok(query.$or[1].employee_id.test('EMP-1')); return { lean: async () => remote }; } } });
  try {
    const account = await reader.find('EMP-1');
    assert.equal(account.status, 'suspended');
    assert.equal(account.role, 'employee');
    assert.equal(reader.cache(account).id, 91, 'cache refresh preserves existing foreign-key references');
    assert.equal(database.prepare('SELECT password_hash FROM users').get().password_hash, 'new-hash');
    database.prepare('DELETE FROM users').run();
    assert.equal(reader.cache(await reader.find('EMP-1')).employee_id, 'EMP-1', 'stable employee identity restores a lost cache');
    remote = null;
    assert.equal(await reader.find('EMP-1'), null, 'deleted cloud users cannot authenticate through stale cache');
    connected = false;
    await assert.rejects(reader.find('EMP-1'), { status: 503 }, 'a cloud outage must not revive local credentials');
  } finally { database.close(); }
});

test('standalone SQLite login supports normalized email and employee ID', async () => {
  const database = new Database(':memory:');
  database.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY, employee_id TEXT, email TEXT);
    INSERT INTO users VALUES (7, 'EMP-LOCAL', 'local@example.test')`);
  try {
    const reader = createAccountReader({ database, connected: () => false, configured: () => false });
    assert.equal((await reader.find(' LOCAL@EXAMPLE.TEST ')).id, 7);
    assert.equal((await reader.find('emp-local')).id, 7);
    assert.equal(await reader.find('unknown'), undefined);
  } finally { database.close(); }
});

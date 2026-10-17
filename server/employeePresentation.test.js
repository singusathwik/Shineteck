import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDate, formatDateTime, formatMonth, formatDatesInText, parseDisplayDate } from '../client/src/utils/displayDate.js';

test('employee dates use MM/DD/YYYY while form values preserve ISO calendar dates', () => {
  assert.equal(parseDisplayDate('01/31/2026'), '2026-01-31');
  assert.equal(parseDisplayDate('2/29/2024'), '2024-02-29');
  for (const invalid of ['02/29/2026', '02/30/2024', '13/01/2026', '00/01/2026', '2026-01-31', '01/3', '']) {
    assert.equal(parseDisplayDate(invalid), '');
  }
  assert.equal(formatDate('2026-01-31'), '01/31/2026');
  assert.equal(formatDate('1/2/1995'), '01/02/1995');
  assert.equal(formatDate('2026-02-29'), '—');
  assert.equal(formatDate(null), '—');
  assert.equal(formatDate('bad date'), '—');
  assert.equal(formatDateTime(null), '—');
  assert.equal(formatMonth('2026-01'), '01/2026');
  assert.equal(formatDatesInText('Dates: 2026-01-31 to 2026-02-02.'), 'Dates: 01/31/2026 to 02/02/2026.');
});

test('date-only formatting never shifts a work day across timezones', () => {
  const previous = process.env.TZ;
  try {
    for (const zone of ['America/Los_Angeles', 'Asia/Kolkata', 'Pacific/Kiritimati']) {
      process.env.TZ = zone;
      assert.equal(formatDate('2026-01-01'), '01/01/2026');
      assert.equal(formatDate('2024-02-29'), '02/29/2024');
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

import { formatDate, formatMonth } from './displayDate.js';
import { decodeDailyHours } from './dailyHours.js';
import { serializeCSV } from './csvExport.js';

export function timesheetCSV(timesheet) {
  const entries = decodeDailyHours(timesheet);
  const rows = entries.length ? entries : [{ date: '', hours: Number(timesheet.total_hours) || 0 }];
  return serializeCSV(rows.map(row => ({
    'Timesheet ID': timesheet.id,
    'Employee ID': timesheet.employee_id,
    'Employee Name': timesheet.employee_full_name || timesheet.employee_name || timesheet.full_name,
    'Vendor / Client': timesheet.vendor_name,
    'Start Date': formatDate(timesheet.start_date, ''),
    'End Date': formatDate(timesheet.end_date, ''),
    Date: formatDate(row.date, ''),
    Month: formatMonth(row.date.slice(0, 7)),
    Hours: row.hours,
    Allocation: entries.length ? 'Daily' : 'Date range total; daily detail unavailable',
    Status: timesheet.status,
    Notes: timesheet.admin_feedback || timesheet.notes,
  })));
}

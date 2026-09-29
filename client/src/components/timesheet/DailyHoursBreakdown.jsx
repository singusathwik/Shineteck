import React from 'react';
import { decodeDailyHours, monthlyHours } from '../../utils/dailyHours.js';

export function DailyHoursBreakdown({ timesheet }) {
  const entries = decodeDailyHours(timesheet);
  if (!entries.length) return <p className="text-xs text-slate-500">Daily allocation is unavailable for this older timesheet.</p>;
  return <details className="company-access"><summary className="cursor-pointer">Daily hours & monthly totals</summary><div className="portal-monthly">{Object.entries(monthlyHours(entries)).map(([month, hours]) => <span key={month}>{month}: <strong>{hours.toFixed(2)} hrs</strong></span>)}</div><div className="company-table-wrap"><table><thead><tr><th>Date</th><th className="numeric">Hours</th></tr></thead><tbody>{entries.map(entry => <tr key={entry.date}><td>{entry.date}</td><td className="numeric">{Number(entry.hours).toFixed(2)}</td></tr>)}</tbody></table></div></details>;
}

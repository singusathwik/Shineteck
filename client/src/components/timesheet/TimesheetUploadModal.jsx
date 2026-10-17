import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api.js';
import { useCompany } from '../../context/CompanyContext.jsx';
import { datesInPeriod, validateDailyHours, monthlyHours } from '../../utils/dailyHours.js';
import { DateInput } from '../common/DateInput.jsx';
import { formatDate, formatMonth } from '../../utils/displayDate.js';

export function TimesheetUploadModal({ isOpen = true, onClose, onSuccess }) {
  const { companies = [] } = useCompany();
  const [companyId, setCompanyId] = useState(() => companies.length === 1 ? companies[0].id : '');
  const [start, setStart] = useState(''), [end, setEnd] = useState(''), [hours, setHours] = useState({}), [vendor, setVendor] = useState(''), [vendors, setVendors] = useState([]), [notes, setNotes] = useState(''), [file, setFile] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const period = useMemo(() => { if (!start || !end) return { dates: [] }; try { return { dates: datesInPeriod(start, end) }; } catch (err) { return { dates: [], error: err.message }; } }, [start, end]);
  const entries = period.dates.map(date => ({ date, hours: hours[date] ?? '' }));
  const totals = monthlyHours(entries.map(row => ({ ...row, hours: Number.isFinite(Number(row.hours)) ? row.hours : 0 })));
  const total = Object.values(totals).reduce((sum, value) => sum + value, 0);
  const company = companies.find(c => c.id === companyId);
  useEffect(() => { if (!isOpen) return; let live = true; api.getMyVendors(companyId || 'all').then(data => { if (live) setVendors(data.vendors || []); }).catch(err => { if (live) setError(err.message); }); return () => { live = false; }; }, [isOpen, companyId]);
  useEffect(() => { if (!isOpen) return; const close = event => { if (event.key === 'Escape' && !busy) onClose(); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [isOpen, busy, onClose]);
  if (!isOpen) return null;
  async function submit(event) {
    event.preventDefault(); setError('');
    try {
      const validated = validateDailyHours(start, end, entries);
      if (!company) throw new Error('Select a company for this timesheet.');
      if (total <= 0) throw new Error('Enter work hours for at least one day.');
      setBusy(true);
      const body = new FormData(); body.append('startDate', start); body.append('endDate', end); body.append('dailyHours', JSON.stringify(validated)); body.append('vendorName', vendor); body.append('notes', notes); if (file) body.append('timesheetFile', file);
      await api.submitTimesheet(body, companyId); await onSuccess?.(); onClose();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="portal-dialog-backdrop"><section className="company-access portal-dialog" role="dialog" aria-modal="true" aria-labelledby="timesheet-title"><div className="company-actions"><div><h2 id="timesheet-title">Submit New Timesheet</h2><p>{company?.name || 'Enter your dates and daily work hours.'}</p></div><button type="button" disabled={busy} onClick={onClose} aria-label="Close timesheet">Close</button></div>
    <form onSubmit={submit}>{error && <p role="alert" className="company-notice company-error">{error}</p>}
    {companies.length > 1 && <label>Company<select required disabled={busy} value={companyId} onChange={e => { setCompanyId(e.target.value); setVendor(''); }}><option value="">Select company</option>{companies.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
    <div className="company-grid"><label>Start Date<DateInput autoFocus required value={start} onChange={e => setStart(e.target.value)} /></label><label>End Date<DateInput required min={start} value={end} onChange={e => setEnd(e.target.value)} /></label></div><p>Enter dates as MM/DD/YYYY.</p>
    {period.error && <p role="alert" className="company-notice company-error">{period.error}</p>}{entries.length > 0 && <><h3 className="portal-section-title">Daily hours</h3><p>Both dates are included. Enter 0 for days off; each day allows up to 24 hours.</p><div className="portal-daily-grid">{entries.map(row => <label key={row.date}>{formatDate(row.date)}<input aria-label={`Hours for ${formatDate(row.date)}`} type="text" inputMode="decimal" required pattern="[0-9]+([.][0-9]{1,2})?" title="Enter 0 to 24 hours, with up to two decimal places" value={row.hours} onChange={e => setHours(previous => ({ ...previous, [row.date]: e.target.value }))} /></label>)}</div><div className="company-notice"><strong>Total: {total.toFixed(2)} hours</strong>{Object.entries(totals).map(([month, value]) => <p key={month}>{formatMonth(month)}: {value.toFixed(2)} hours</p>)}</div></>}
    <label>Vendor / Client<input list="timesheet-vendors" value={vendor} onChange={e => setVendor(e.target.value)} /></label><datalist id="timesheet-vendors">{vendors.map(v => <option key={v._id || v.id} value={v.vendor_name}>{v.client_name}</option>)}</datalist><label>Supporting file (optional)<input type="file" accept=".csv,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt" onChange={e => setFile(e.target.files?.[0] || null)} /></label><label>Notes (optional)<textarea rows={2} maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} /></label><div className="company-actions"><button type="button" disabled={busy} onClick={onClose}>Cancel</button><button className="company-primary" disabled={busy || !company || !entries.length}>{busy ? 'Submitting…' : 'Submit Timesheet'}</button></div>
    </form></section></div>;
}

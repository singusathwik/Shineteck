import { MonthlyHours } from '../../components/timesheet/MonthlyHours.jsx';
import { useCompany } from '../../context/CompanyContext.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Calendar, Download, Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { api } from '../../services/api.js';
import { exportToCSV } from '../../utils/csvExport.js';
import { invoiceAmounts } from '../../utils/invoiceAmounts.js';
import { overlapsPeriod, payrollPeriod } from '../../utils/payrollPeriods.js';
import { payrollDemoEmployee, payrollDemoEntries } from '../../utils/payrollDemo.js';
import { EmployeeAvatar } from '../../components/common/EmployeeAvatar.jsx';
import { EmployeePayrollHistory } from '../../components/payroll/EmployeePayrollHistory.jsx';
import '../../components/payroll/invoice-ledger.css';

const money = (value, currency) => new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency }).format(value || 0);
const date = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not recorded';
const currencyOf = employee => employee.country === 'India' ? 'INR' : 'USD';

function PayrollEntryEditor({ entry, employees, vendors, currency, onCancel, onSaved }) {
  const { companies, selected } = useCompany();
  const employeeCompanies = id => companies.filter(c => c.enabled && (employees.find(e => e.employee_id === id)?.company_ids || []).includes(c.id) && (selected === 'all' || c.id === selected));
  const [form, setForm] = useState(() => entry ? { ...entry, ...payrollPeriod(entry) } : { company_id: '', employee_id: '', employee_name: '', start_date: '', end_date: '', total_hours: '', bill_rate: '', emp_bill_rate: '', vendor_name: '', client_name: '', currency });
  const [saving, setSaving] = useState(false);
  const panel = useRef(null);
  useEffect(() => { panel.current?.focus(); }, []);
  const [error, setError] = useState('');
  const change = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  function chooseEmployee(id) {
    const employee = employees.find(item => item.employee_id === id);
    const choices = employeeCompanies(id);
    const company_id = choices.length === 1 ? choices[0].id : '';
    const vendor = vendors.find(item => item.employee_id === id && item.company_id === company_id);
    setForm(previous => ({ ...previous, employee_id: id, company_id, employee_name: employee?.full_name || '', currency: employee ? currencyOf(employee) : currency, vendor_name: vendor?.vendor_name || '', client_name: vendor?.client_name || '', bill_rate: vendor?.hourly_bill_rate ?? '', emp_bill_rate: vendor?.employee_rate ?? '' }));
  }
  async function save(event) {
    event.preventDefault();
    if (form.start_date > form.end_date) { setError('End date must be on or after start date.'); return; }
    setSaving(true); setError('');
    try {
      if (entry) await api.updatePayrollEntry(entry._id || entry.id, form);
      else await api.createPayrollEntry(form);
      onSaved();
    } catch (err) { setError(err.message); setSaving(false); }
  }
  const field = (key, label, type = 'text', required = true) => <label className="il-field" key={key}><span>{label}</span><input type={type} value={form[key] ?? ''} onChange={event => change(key, event.target.value)} onInput={event => change(key, event.target.value)} required={required} {...(type === 'number' ? { min: 0, max: 1000000, step: '.01' } : {})} {...(key === 'end_date' ? { min: form.start_date } : {})} /></label>;
  return <section className="il-editor" ref={panel} tabIndex={-1} aria-label={entry ? 'Edit payroll entry' : 'Add payroll entry'}><div className="il-section-heading"><h2>{entry ? 'Edit payroll entry' : 'Add payroll entry'} · {currency}</h2><button className="il-icon-button" onClick={onCancel} disabled={saving} aria-label="Close payroll editor"><X size={20} /></button></div><form onSubmit={save}><fieldset disabled={saving}><div className="il-form-grid">
    <label className="il-field"><span>Employee</span><select required disabled={Boolean(entry)} value={form.employee_id} onChange={event => chooseEmployee(event.target.value)}><option value="">Select employee</option>{employees.map(employee => <option key={employee.employee_id} value={employee.employee_id}>{employee.full_name} · {employee.employee_id}</option>)}{entry && !employees.some(employee => employee.employee_id === entry.employee_id) && <option value={entry.employee_id}>{entry.employee_name}</option>}</select></label>
    <label className="il-field"><span>Company</span><select required disabled={Boolean(entry?.company_id)} value={form.company_id || ''} onChange={event => { const company_id = event.target.value; const vendor = vendors.find(v => v.employee_id === form.employee_id && v.company_id === company_id); setForm(previous => ({ ...previous, company_id, vendor_name: vendor?.vendor_name || '', client_name: vendor?.client_name || '', bill_rate: vendor?.hourly_bill_rate ?? '', emp_bill_rate: vendor?.employee_rate ?? '' })); }}><option value="">Select company</option>{employeeCompanies(form.employee_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{form.employee_id && !employeeCompanies(form.employee_id).length && <small>Ask the super admin to assign an enabled company first.</small>}</label>
    {field('start_date', 'Payroll start date', 'date')}{field('end_date', 'Payroll end date', 'date')}
    {field('vendor_name', 'Vendor', 'text', false)}{field('client_name', 'Client', 'text', false)}{field('total_hours', 'Total hours', 'number')}
    {field('bill_rate', `Client bill rate (${form.currency}/hour)`, 'number')}{field('emp_bill_rate', `Employee rate (${form.currency}/hour)`, 'number')}
    <div className="il-field"><span>Gross amount · hours × employee rate</span><strong>{money(invoiceAmounts(form.total_hours, form.emp_bill_rate).invoice_amount, form.currency)}</strong></div>
  </div></fieldset>{entry?.period_inferred && <p className="il-help">This older record only stored a month. Confirm the inferred start and end dates before saving.</p>}{error && <p role="alert" className="il-error">{error}</p>}<div className="il-form-footer"><p className="il-help">Full dates are saved for this payroll period.</p><div className="il-actions"><button type="button" className="il-button" disabled={saving} onClick={onCancel}>Cancel</button><button className="il-button il-primary" disabled={saving}>{saving ? 'Saving…' : 'Save payroll entry'}</button></div></div></form></section>;
}

export function AdminPayrollEntries() {
  const { isSuperAdmin, selected: selectedCompany } = useCompany();
  const [entries, setEntries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [region, setRegion] = useState('INR');
  const [search, setSearch] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState(null);
  const [editor, setEditor] = useState(undefined);
  const [notice, setNotice] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const deletePanel = useRef(null);
  useEffect(() => { if (deleting) deletePanel.current?.focus(); }, [deleting]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    Promise.all([api.getAllPayrollEntries(), api.getAllEmployees(), api.getAllVendorDetails()]).then(([payroll, staff, vendor]) => {
      if (!active) return;
      setEntries(payroll.entries || []);
      setEmployees((staff.employees || []).filter(employee => !employee.employee_id?.startsWith('ADMIN')));
      setVendors(vendor.vendors || []);
    }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);
  const query = search.trim().toLowerCase();
  const invalidRange = start && end && start > end;
  const regionalEmployees = employees.filter(employee => currencyOf(employee) === region);
  const regionalEntries = entries.filter(entry => (entry.currency || currencyOf(entry)) === region);
  const visibleEntries = invalidRange ? [] : regionalEntries.filter(entry => overlapsPeriod(entry, start, end) && [entry.employee_id, entry.employee_name, entry.vendor_name, entry.client_name].some(value => String(value || '').toLowerCase().includes(query)));
  const visibleEmployees = regionalEmployees.filter(employee => !query || `${employee.full_name} ${employee.employee_id}`.toLowerCase().includes(query) || visibleEntries.some(entry => entry.employee_id === employee.employee_id));
  const totalGross = visibleEntries.reduce((sum, entry) => sum + Math.round(entry.gross_amount * 100), 0) / 100;
  function openHistory(employee) { setSelected(employee); setNotice(''); }
  function employeeFor(entry) { return employees.find(employee => employee.employee_id === entry.employee_id) || { employee_id: entry.employee_id, full_name: entry.employee_name, country: entry.country || (entry.currency === 'INR' ? 'India' : 'United States') }; }
  function changeRegion(value) { setRegion(value); setSearch(''); setStart(''); setEnd(''); setNotice(''); }
  async function deleteEntry() {
    setBusy(true); setError('');
    try { await api.deletePayrollEntry(deleting._id || deleting.id); setDeleting(null); setRevision(value => value + 1); setNotice('Payroll entry deleted.'); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  if (selected) return <EmployeePayrollHistory key={selected.employee_id} employee={selected} entries={selected.is_demo ? payrollDemoEntries : entries.filter(entry => entry.employee_id === selected.employee_id)} onBack={() => setSelected(null)} />;
  return <div className="invoice-ledger"><MonthlyHours />
    <header className="il-page-heading"><div><p className="il-eyebrow">Finance & payroll</p><h1>Payroll information</h1><p>Separate regional payroll records, full date ranges, and employee payment history.</p></div><button className="il-button il-primary" onClick={() => setEditor(null)} disabled={loading || Boolean(error) || editor !== undefined}><Plus size={16} /> Add payroll entry</button></header>
    <div className="il-region-tabs" role="group" aria-label="Payroll region"><button aria-pressed={region === 'INR'} onClick={() => changeRegion('INR')} disabled={editor !== undefined}>Indian employees <small>INR · ₹</small></button><button aria-pressed={region === 'USD'} onClick={() => changeRegion('USD')} disabled={editor !== undefined}>U.S. / foreign employees <small>USD · $</small></button></div>
    {notice && <p className="il-success" role="status">{notice}</p>}
    {error && <p className="il-error" role="alert">{error}<button className="il-button" onClick={() => setRevision(value => value + 1)}>Try again</button></p>}
    {editor !== undefined && <PayrollEntryEditor entry={editor} employees={regionalEmployees} vendors={vendors} currency={region} onCancel={() => setEditor(undefined)} onSaved={() => { setEditor(undefined); setNotice('Payroll entry saved.'); setStart(''); setEnd(''); setSearch(''); setRevision(value => value + 1); }} />}
    <div className="il-register-toolbar"><label className="il-search"><Search size={17} /><input aria-label="Search payroll" placeholder="Employee ID, name, vendor, or client" value={search} onChange={event => setSearch(event.target.value)} /></label><div className="il-actions"><label className="il-filter">Start date<input aria-label="Filter start date" type="date" value={start} onChange={event => setStart(event.target.value)} onInput={event => setStart(event.target.value)} /></label><label className="il-filter">End date<input aria-label="Filter end date" type="date" min={start} value={end} onChange={event => setEnd(event.target.value)} onInput={event => setEnd(event.target.value)} /></label>{(start || end || search) && <button className="il-back" onClick={() => { setStart(''); setEnd(''); setSearch(''); }}>Clear filters</button>}</div></div>
    {invalidRange && <p className="il-error" role="alert">End date must be on or after start date.</p>}
    {loading ? <div className="il-loading" role="status">Loading payroll information…<div /><div /></div> : !error && <>
      <section className="il-summary"><div><p>{region === 'INR' ? 'Indian' : 'U.S. / foreign'} billing gross · filtered records</p><strong>{money(totalGross, region)}</strong></div><div><p>Payroll records</p><strong>{visibleEntries.length}</strong></div><div><p>Employees in this region</p><strong>{regionalEmployees.length}</strong></div></section>
      <section aria-label="Employee payment histories"><div className="il-section-heading"><div><h2>Employee payment history</h2><p className="il-help">Click an employee to see all years, monthly gross earnings, and invoice payments. Date filters apply to billing records only.</p></div>{isSuperAdmin && selectedCompany === 'all' && region === 'USD' && <button className="il-button" onClick={() => openHistory(payrollDemoEmployee)} disabled={editor !== undefined}>View demo · 24 sample invoices <ArrowUpRight size={15} /></button>}</div><div className="il-employee-grid il-history-grid">{visibleEmployees.map(employee => <button className="il-employee-card" key={employee.employee_id} onClick={() => openHistory(employee)} disabled={editor !== undefined}><EmployeeAvatar name={employee.full_name} /><div><h3>{employee.full_name}</h3><p>{employee.employee_id}</p><span>View year-wise payments</span></div><ArrowUpRight size={17} /></button>)}</div>{!visibleEmployees.length && <p className="il-help">No employees match this region and search.</p>}</section>
      <section className="il-register il-billing-register"><div className="il-register-toolbar"><div><h2>{region === 'INR' ? 'Indian' : 'U.S. / foreign'} payroll records</h2><p>Records overlapping the selected date range. All amounts in {region}.</p></div><button className="il-button" disabled={!visibleEntries.length} onClick={() => exportToCSV(visibleEntries.map(entry => ({ Employee: entry.employee_name, 'Employee ID': entry.employee_id, 'Start date': payrollPeriod(entry).start_date, 'End date': payrollPeriod(entry).end_date, 'Inferred dates': payrollPeriod(entry).period_inferred ? 'Yes' : 'No', Vendor: entry.vendor_name, Client: entry.client_name, Hours: entry.total_hours, 'Bill rate': entry.bill_rate, 'Employee rate': entry.emp_bill_rate, 'Gross amount': entry.gross_amount, Currency: entry.currency })), `payroll-${region}.csv`)}><Download size={16} /> Export CSV</button></div>
      <div className="il-table-scroll" tabIndex={0} role="region" aria-label="Payroll billing records"><table><thead><tr>{['Employee', 'Start date', 'End date', 'Vendor / client', 'Hours', 'Bill rate', 'Employee rate', 'Gross amount', 'Actions'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{visibleEntries.map(entry => { const period = payrollPeriod(entry); return <tr key={entry._id || entry.id}><td data-label="Employee"><button className="il-edit" onClick={() => openHistory(employeeFor(entry))} disabled={editor !== undefined}>{entry.employee_name}<ArrowUpRight size={14} /></button><small className="il-currency">{entry.employee_id}</small></td><td data-label="Start date">{date(period.start_date)}{period.period_inferred && <small className="il-currency">Inferred from month</small>}</td><td data-label="End date">{date(period.end_date)}</td><td data-label="Vendor / client">{entry.vendor_name || '—'}<small className="il-currency">{entry.client_name || '—'}</small></td><td data-label="Hours">{entry.total_hours}</td><td data-label="Bill rate">{money(entry.bill_rate, region)}</td><td data-label="Employee rate">{money(entry.emp_bill_rate, region)}</td><td data-label="Gross amount"><strong>{money(entry.gross_amount, region)}</strong></td><td data-label="Actions"><div className="il-actions"><button className="il-icon-button" aria-label={`Edit payroll for ${entry.employee_name} ${period.start_date}`} disabled={editor !== undefined} onClick={() => setEditor(entry)}><Edit3 size={15} /></button><button className="il-icon-button" aria-label={`Delete payroll for ${entry.employee_name} ${period.start_date}`} disabled={editor !== undefined} onClick={() => setDeleting(entry)}><Trash2 size={15} /></button></div></td></tr>; })}</tbody></table></div>{!visibleEntries.length && <div className="il-empty"><Calendar size={28} /><h3>No payroll records found</h3><p>Add a payroll entry or change the date range and search.</p></div>}</section>
    </>}
    {deleting && <div className="il-editor" ref={deletePanel} tabIndex={-1} role="alertdialog" aria-labelledby="delete-payroll-title"><h2 id="delete-payroll-title">Delete payroll entry?</h2><p className="il-help">Delete {deleting.employee_name}’s billing entry for {date(payrollPeriod(deleting).start_date)}? This cannot be undone.</p><div className="il-form-footer"><button className="il-button" disabled={busy} onClick={() => setDeleting(null)}>Cancel</button><button className="il-button" disabled={busy} onClick={deleteEntry}>{busy ? 'Deleting…' : 'Delete entry'}</button></div></div>}
  </div>;
}


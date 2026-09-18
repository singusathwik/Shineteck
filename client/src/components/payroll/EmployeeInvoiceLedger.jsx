import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Download, Plus, Receipt, Search, X } from 'lucide-react';
import { api, request } from '../../services/api.js';
import { exportToCSV } from '../../utils/csvExport.js';
import { invoiceAmounts } from '../../utils/invoiceAmounts.js';
import { EmployeeAvatar } from '../common/EmployeeAvatar.jsx';
import './invoice-ledger.css';

const columns = [['invoice_number', 'Inv No'], ['month', 'Month'], ['total_hours', 'Total Hours'], ['rate', 'Rate'], ['invoice_amount', 'Inv Amount'], ['due_date', 'Due Date'], ['status', 'Status'], ['received_date', 'Received Date'], ['employee_share', 'Emp Share 75%'], ['tax', 'Tax 20%'], ['net_amount', 'Net Amt'], ['paid_date', 'Paid Date']];
const moneyKeys = new Set(['rate', 'invoice_amount', 'employee_share', 'tax', 'net_amount']);
const money = (value, currency) => new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency }).format(value || 0);
const date = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const month = value => value ? new Date(`${value}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : '—';

function InvoiceEditor({ employee, invoice, onClose, onSaved }) {
  const [form, setForm] = useState(() => invoice || { invoice_number: '', month: '', total_hours: '', rate: '', due_date: '', status: 'Pending', received_date: '', paid_date: '', currency: employee.country === 'India' ? 'INR' : 'USD' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const panel = useRef(null);
  const amounts = invoiceAmounts(form.total_hours, form.rate);
  useEffect(() => { panel.current?.focus(); }, []);
  const change = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const field = (key, label, type = 'text', required = true) => <label className="il-field" key={key}><span>{label}{!required && <small>Optional</small>}</span><input type={type} value={form[key]} onChange={event => change(key, event.target.value)} onInput={event => change(key, event.target.value)} required={required} {...(type === 'number' ? { min: 0, max: 1000000, step: '0.01' } : {})} {...(key === 'invoice_number' ? { maxLength: 80 } : {})} /></label>;
  async function submit(event) {
    event.preventDefault();
    setSaving(true); setError('');
    try {
      const result = await request(`/admin/employee-invoices${invoice ? `/${encodeURIComponent(invoice.id)}` : ''}`, { method: invoice ? 'PUT' : 'POST', body: { ...form, employee_id: employee.employee_id } });
      onSaved(result.invoice);
    } catch (err) { setError(err.message); setSaving(false); }
  }
  return <section className="il-editor" aria-labelledby="invoice-editor-title" tabIndex={-1} ref={panel}>
    <div className="il-section-heading"><div><p className="il-eyebrow">{employee.full_name} · {employee.employee_id}</p><h2 id="invoice-editor-title">{invoice ? 'Edit invoice' : 'New invoice'}</h2></div><button className="il-icon-button" onClick={onClose} disabled={saving} aria-label="Close invoice editor"><X size={20} /></button></div>
    <form onSubmit={submit}>
      <fieldset disabled={saving}><legend>01 / Invoice details</legend><div className="il-form-grid">
        {field('invoice_number', 'Inv No')}{field('month', 'Month', 'month')}
        <label className="il-field"><span>Currency</span><select value={form.currency} onChange={event => change('currency', event.target.value)}><option value="USD">USD — US dollar</option><option value="INR">INR — Indian rupee</option></select></label>
        {field('total_hours', 'Total Hours', 'number')}{field('rate', 'Rate / hour', 'number')}{field('due_date', 'Due Date', 'date')}
      </div></fieldset>
      <fieldset disabled={saving}><legend>02 / Payment tracking</legend><div className="il-form-grid">
        <label className="il-field"><span>Status</span><select value={form.status} onChange={event => setForm(previous => ({ ...previous, status: event.target.value, ...(event.target.value === 'Pending' ? { received_date: '', paid_date: '' } : event.target.value === 'Received' ? { paid_date: '' } : {}) }))}><option>Pending</option><option>Received</option><option>Paid</option></select></label>
        {field('received_date', 'Received Date', 'date', form.status !== 'Pending')}{field('paid_date', 'Paid Date', 'date', form.status === 'Paid')}
      </div><p className="il-help">Pending: awaiting client payment. Received: client payment received. Paid: employee payment completed.</p></fieldset>
      <div className="il-calculation"><div className="il-section-heading"><h3>Payment breakdown</h3><span>Calculated automatically</span></div><dl>{[['invoice_amount', 'Inv Amount'], ['employee_share', 'Emp Share 75%'], ['tax', 'Tax 20%'], ['net_amount', 'Net Amt']].map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{money(amounts[key], form.currency)}</dd></div>)}</dl><p className="il-help">Invoice = hours × rate. Employee share = 75% of invoice. Tax = 20% of employee share. Net = employee share − tax.</p></div>
      {error && <p className="il-error" role="alert">{error}</p>}
      <div className="il-form-footer"><span>All amounts are in {form.currency}.</span><div className="il-actions"><button type="button" className="il-button" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="il-button il-primary" disabled={saving}>{saving ? 'Saving…' : 'Save invoice'}</button></div></div>
    </form>
  </section>;
}

export function EmployeeInvoiceLedger() {
  const [employees, setEmployees] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [search, setSearch] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [editor, setEditor] = useState(undefined);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [notice, setNotice] = useState('');
  const addButton = useRef(null);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    const load = employee ? request(`/admin/employee-invoices?employee_id=${encodeURIComponent(employee.employee_id)}`) : api.getAllEmployees();
    load.then(data => { if (active) { if (employee) setInvoices(data.invoices || []); else setEmployees((data.employees || []).filter(item => !item.employee_id?.startsWith('ADMIN'))); } }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [employee, retry]);
  const visibleEmployees = employees.filter(item => `${item.full_name} ${item.employee_id} ${item.designation}`.toLowerCase().includes(search.toLowerCase()));
  const visibleInvoices = invoices.filter(item => (!filterMonth || item.month === filterMonth) && (filterStatus === 'All' || item.status === filterStatus));
  const totals = [...new Set(visibleInvoices.map(item => item.currency))].map(currency => {
    const rows = visibleInvoices.filter(item => item.currency === currency);
    return { currency, invoiced: rows.reduce((sum, row) => sum + row.invoice_amount, 0), pending: rows.filter(row => row.status !== 'Paid').reduce((sum, row) => sum + row.net_amount, 0), paid: rows.filter(row => row.status === 'Paid').reduce((sum, row) => sum + row.net_amount, 0) };
  });
  function selectEmployee(item) { setEmployee(item); setInvoices([]); setLoading(true); setError(''); setEditor(undefined); setNotice(''); setFilterMonth(''); setFilterStatus('All'); }
  function closeEditor() { setEditor(undefined); requestAnimationFrame(() => addButton.current?.focus()); }
  function saved(invoice) {
    setInvoices(previous => [invoice, ...previous.filter(item => item.id !== invoice.id)].sort((a, b) => b.month.localeCompare(a.month) || a.invoice_number.localeCompare(b.invoice_number)));
    setFilterMonth('');
    setFilterStatus('All');
    setNotice('Invoice saved successfully. Showing all invoices.');
    closeEditor();
  }
  function exportInvoices() {
    const rows = visibleInvoices.map(item => Object.fromEntries([['Employee', employee.full_name], ['Employee ID', employee.employee_id], ...columns.map(([key, label]) => [label, item[key]]), ['Currency', item.currency]]));
    exportToCSV(rows, `${employee.employee_id}-invoice-ledger.csv`);
  }
  const cell = (item, key) => moneyKeys.has(key) ? money(item[key], item.currency) : key.endsWith('_date') ? date(item[key]) : key === 'month' ? month(item[key]) : item[key];
  return <div className="invoice-ledger">
    <header className="il-page-heading"><div><p className="il-eyebrow">Finance & payroll</p><h1>Payroll management</h1><p>Employee invoices, receipts, and payments in one place.</p></div><span className="il-label"><Receipt size={16} /> Invoice ledger</span></header>
    {employee ? <>
      <button className="il-back" onClick={() => { setEmployee(null); setEditor(undefined); setNotice(''); }} disabled={editor !== undefined}><ArrowLeft size={16} /> All employees</button>
      <section className="il-employee-header"><EmployeeAvatar name={employee.full_name} size="lg" /><div><h2>{employee.full_name}</h2><p><strong>{employee.employee_id}</strong><span>·</span>{employee.designation || 'Employee'}{employee.country && <><span>·</span>{employee.country}</>}</p></div><button ref={addButton} className="il-button il-primary" onClick={() => { setEditor(null); setNotice(''); }} disabled={loading || Boolean(error) || editor !== undefined}><Plus size={17} /> Add invoice</button></section>
      {notice && <p className="il-success" role="status">{notice}</p>}
      {editor !== undefined && <InvoiceEditor employee={employee} invoice={editor} onClose={closeEditor} onSaved={saved} />}
    </> : <section className="il-directory-heading"><div><h2>Select an employee</h2><p>Open an employee to view their invoices or add a payment record.</p></div><label className="il-search"><Search size={18} /><input aria-label="Search employees" placeholder="Search name, ID, or role" value={search} onChange={event => setSearch(event.target.value)} /></label></section>}
    {error ? <div className="il-error" role="alert">{error}<button className="il-button" onClick={() => setRetry(value => value + 1)}>Try again</button></div> : loading ? <div className="il-loading" role="status">Loading {employee ? 'invoices' : 'employees'}…<div /><div /><div /></div> : employee ? <>
      <section className="il-summary" aria-label="Invoice totals for current filters">{[['invoiced', 'Total invoiced'], ['pending', 'Net awaiting payment'], ['paid', 'Net paid to employee']].map(([key, label]) => <div key={key}><p>{label}</p>{totals.length ? totals.map(total => <strong key={total.currency}>{money(total[key], total.currency)} <small>{total.currency}</small></strong>) : <strong>—</strong>}</div>)}</section>
      <section className="il-register"><div className="il-register-toolbar"><div><h2>Invoice register <span>{visibleInvoices.length}</span></h2><p>Follow each invoice from billing to employee payment.</p></div><div className="il-actions"><label className="il-filter">Month<input aria-label="Filter invoice month" type="month" value={filterMonth} onChange={event => setFilterMonth(event.target.value)} onInput={event => setFilterMonth(event.target.value)} /></label><label className="il-filter">Status<select aria-label="Filter invoice status" value={filterStatus} onChange={event => setFilterStatus(event.target.value)}>{['All', 'Pending', 'Received', 'Paid'].map(status => <option key={status}>{status}</option>)}</select></label>{(filterMonth || filterStatus !== 'All') && <button className="il-back" onClick={() => { setFilterMonth(''); setFilterStatus('All'); }}>Clear</button>}<button className="il-button" onClick={exportInvoices} disabled={!visibleInvoices.length}><Download size={16} /> Export CSV</button></div></div>
        {visibleInvoices.length ? <><div className="il-table-scroll" role="region" aria-label="Employee invoice register; scroll horizontally to view all columns" tabIndex={0}><table><caption className="il-sr-only">Invoices for {employee.full_name}. All amounts display their invoice currency.</caption><thead><tr>{columns.map(([key, label]) => <th scope="col" key={key}>{label}</th>)}<th scope="col">Action</th></tr></thead><tbody>{visibleInvoices.map(item => <tr key={item.id}>{columns.map(([key, label]) => <td key={key} data-label={label} className={moneyKeys.has(key) || key === 'total_hours' ? 'il-number' : ''}>{key === 'status' ? <span className={`il-status il-status-${item.status.toLowerCase()}`}>{item.status}</span> : key === 'invoice_number' ? <strong>{item.invoice_number}<small className="il-currency">{item.currency}</small></strong> : cell(item, key)}</td>)}<td data-label="Action"><button className="il-edit" onClick={() => { setEditor(item); setNotice(''); }} disabled={editor !== undefined} aria-label={`Edit invoice ${item.invoice_number}`}>Edit <ArrowUpRight size={14} /></button></td></tr>)}</tbody></table></div><div className="il-register-note">Tax is 20% of the employee’s 75% share. Net amount is the employee share less tax. Scroll horizontally for all fields.</div></> : <div className="il-empty"><Receipt size={30} /><h3>{invoices.length ? 'No matching invoices' : 'Your invoice register starts here'}</h3><p>{invoices.length ? 'Try a different month or status to find a record.' : `Add the first invoice for ${employee.full_name} to start tracking payments.`}</p>{!invoices.length && <button className="il-button il-primary" onClick={() => setEditor(null)} disabled={editor !== undefined}><Plus size={16} /> Add first invoice</button>}</div>}
      </section>
    </> : <><p className="il-count">{visibleEmployees.length} employees</p><div className="il-employee-grid">{visibleEmployees.map(item => <button className="il-employee-card" key={item.employee_id} onClick={() => selectEmployee(item)}><EmployeeAvatar name={item.full_name} size="md" /><div><h3>{item.full_name}</h3><p>{item.designation || 'Employee'}</p><span>{item.employee_id} · {item.country || 'Location not set'}</span></div><ArrowUpRight size={18} /></button>)}</div>{!visibleEmployees.length && <div className="il-empty"><h3>No employees found</h3><p>{search ? 'Try another name or employee ID.' : 'Employees will appear here once added to the directory.'}</p></div>}</>}
  </div>;
}



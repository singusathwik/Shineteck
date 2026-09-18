import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Receipt, Download } from 'lucide-react';
import { request } from '../../services/api.js';
import { payrollDemoInvoices } from '../../utils/payrollDemo.js';
import { monthlyPayments, paymentYears } from '../../utils/payrollHistory.js';
import { exportToCSV } from '../../utils/csvExport.js';
import { EmployeeInvoiceLedger } from './EmployeeInvoiceLedger.jsx';
import './invoice-ledger.css';

const money = (amount, currency) => new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', { style: 'currency', currency }).format(amount);
const date = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('en-GB') : 'Not recorded';

export function EmployeePayrollHistory({ employee, entries, onBack }) {
  const [invoices, setInvoices] = useState([]);
  const [year, setYear] = useState('');
  const [currency, setCurrency] = useState(employee.country === 'India' ? 'INR' : 'USD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [details, setDetails] = useState(false);
  const heading = useRef(null);
  useEffect(() => { if (!details) heading.current?.focus(); }, [details]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    const load = employee.is_demo ? Promise.resolve({ invoices: payrollDemoInvoices }) : request(`/admin/employee-invoices?employee_id=${encodeURIComponent(employee.employee_id)}`);
    load.then(data => { if (active) setInvoices(data.invoices || []); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [employee.employee_id, employee.is_demo, retry]);
  const years = paymentYears(invoices, entries);
  const selectedYear = years.includes(year) ? year : years[0] || String(new Date().getFullYear());
  const months = monthlyPayments(invoices, entries, selectedYear, currency);
  const total = key => months.reduce((sum, row) => sum + Math.round(row[key] * 100), 0) / 100;
  if (details) return <EmployeeInvoiceLedger initialEmployee={employee} readOnly onBack={() => setDetails(false)} />;
  return <div className="invoice-ledger">
    <button className="il-back" onClick={onBack}><ArrowLeft size={16} /> Back to payroll information</button>
    <header className="il-page-heading"><div><p className="il-eyebrow">Employee payment history</p><h1 ref={heading} tabIndex={-1}>{employee.full_name}</h1><p>{employee.employee_id} · {employee.country} · {employee.designation || 'Employee'}</p><p>Employment start: {date(employee.start_date)} · Employment end: {employee.end_date ? date(employee.end_date) : 'Not recorded / ongoing'}</p></div><button className="il-button" onClick={() => setDetails(true)}><Receipt size={16} /> View invoice details</button></header>
    {employee.is_demo && <p className="il-success">Demonstration only · 24 sample invoices, January 2024–December 2025. No real employee payments.</p>}
    {error ? <p className="il-error" role="alert">{error}<button className="il-button" onClick={() => setRetry(value => value + 1)}>Try again</button></p> : loading ? <p role="status">Loading payment history…</p> : <>
      <div className="il-register-toolbar il-history-toolbar"><div><h2>Monthly earnings & payments</h2><p>Grouped by invoice month. Gross earnings are the 75% employee share before tax.</p></div><div className="il-actions il-history-controls"><label className="il-filter">Year<select value={selectedYear} onChange={event => setYear(event.target.value)}>{(years.length ? years : [selectedYear]).map(value => <option key={value}>{value}</option>)}</select></label><label className="il-filter">Currency<select value={currency} onChange={event => setCurrency(event.target.value)}><option>USD</option><option>INR</option></select></label><button className="il-button" disabled={!months.some(row => row.count || row.billingCount)} onClick={() => exportToCSV(months.map(row => ({ Month: row.month, Currency: currency, 'Invoice count': row.count, 'Gross earnings': row.gross, Tax: row.tax, 'Net paid': row.paid, 'Net awaiting payment': row.outstanding, 'Separate billing gross': row.billingGross })), `${employee.employee_id}-${selectedYear}-${currency}-history.csv`)}><Download size={16} /> Export year</button></div></div>
      <section className="il-summary"><div><p>Gross earnings · {selectedYear}</p><strong>{money(total('gross'), currency)}</strong></div><div><p>Net paid to employee</p><strong>{money(total('paid'), currency)}</strong></div><div><p>Net awaiting payment</p><strong>{money(total('outstanding'), currency)}</strong></div></section>
      <div className="il-register"><div className="il-table-scroll" tabIndex={0} role="region" aria-label="Monthly payment history"><table><thead><tr>{['Month', 'Invoices', 'Gross earnings', 'Tax', 'Net paid', 'Net awaiting payment', 'Billing gross (separate)'].map((label, index) => <th key={label} scope="col" className={index >= 2 ? 'il-number' : undefined}>{label}</th>)}</tr></thead><tbody>{months.map(row => <tr key={row.month}><td data-label="Month">{new Date(`${row.month}-01T12:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</td><td data-label="Invoices">{row.count || '—'}</td>{[['gross', 'Gross earnings'], ['tax', 'Tax'], ['paid', 'Net paid'], ['outstanding', 'Net awaiting payment'], ['billingGross', 'Billing gross (separate)']].map(([key, label]) => <td key={key} data-label={label} className="il-number">{(key === 'billingGross' ? row.billingCount : row.count) ? money(row[key], currency) : '—'}</td>)}</tr>)}</tbody></table></div><p className="il-register-note">Only invoices marked Paid count as payments. Billing records are shown separately and never added to invoice earnings, to avoid counting the same work twice. Billing periods spanning months are grouped by their start month. A dash means no records.</p></div>
      {!invoices.length && <p className="il-help">No invoices yet. Add an invoice for this employee in Payroll Management; it will appear here automatically when this history is opened again.</p>}
    </>}
  </div>;
}

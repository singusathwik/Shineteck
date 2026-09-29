import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { InvitationForm } from '../../components/common/InvitationForm.jsx';
import { exportToCSV } from '../../utils/csvExport.js';

export function AdminEmployees({ onSelectEmployee }) {
  const [employees, setEmployees] = useState([]), [vendors, setVendors] = useState([]), [search, setSearch] = useState(''), [status, setStatus] = useState('All'), [error, setError] = useState(''), [loading, setLoading] = useState(true), [invite, setInvite] = useState(false);
  useEffect(() => { let live = true; Promise.all([api.getAllEmployees(), api.getAllVendorDetails()]).then(([directory, placements]) => { if (live) { setEmployees(directory.employees); setVendors(placements.vendors); } }).catch(err => { if (live) setError(err.message); }).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, []);
  const rows = employees.map(emp => {
    const placements = vendors.filter(v => v.employee_id === emp.employee_id);
    const joined = key => [...new Set(placements.map(v => v[key]).filter(Boolean))].join(' · ');
    return { ...emp, vendor_name: joined('vendor_name'), client_name: joined('client_name'), work_location: emp.work_location_address || joined('client_address'), project_status: emp.employment_status || 'Active' };
  }).filter(row => `${row.employee_id} ${row.full_name} ${row.vendor_name} ${row.client_name}`.toLowerCase().includes(search.toLowerCase()) && (status === 'All' || row.project_status === status));
  const columns = [['employee_id', 'Emp ID'], ['full_name', 'Name'], ['designation', 'Job Title'], ['vendor_name', 'Vendor Name'], ['client_name', 'Client Name'], ['work_location', 'Work Location'], ['start_date', 'Start Date'], ['end_date', 'End Date'], ['project_status', 'Project Status']];
  return <div className="company-access"><div className="company-actions"><div><h1>Employee Directory</h1><p>Employees and placements in your company workspace.</p></div><button onClick={() => setInvite(!invite)}>Add Employee</button><button disabled={!rows.length} onClick={() => exportToCSV(rows.map(row => Object.fromEntries(columns.map(([key, title]) => [title, row[key] || '']))), 'Employee_Directory.csv')}>Export CSV</button></div>
    {invite && <InvitationForm onClose={() => setInvite(false)} />}{error && <p role="alert" className="company-notice company-error">{error}</p>}
    <div className="company-panel company-actions"><label>Search employees<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Employee ID, name, vendor or client" /></label><label>Project Status<select value={status} onChange={e => setStatus(e.target.value)}>{['All', 'Active', 'Inactive'].map(value => <option key={value}>{value}</option>)}</select></label><span>{rows.length} employees</span></div>
    <div className="company-panel company-table-wrap"><table><thead><tr>{columns.map(([key, title]) => <th key={key}>{title}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.employee_id}>{columns.map(([key]) => <td key={key}>{key === 'full_name' ? <button className="portal-link" onClick={() => onSelectEmployee(row.employee_id)}>{row.full_name}</button> : row[key] || '—'}</td>)}</tr>)}</tbody></table>{loading ? <p>Loading employees…</p> : !rows.length && <p>No employees match your filters.</p>}</div>
  </div>;
}

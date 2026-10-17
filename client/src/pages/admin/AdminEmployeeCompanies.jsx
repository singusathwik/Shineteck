import { useEffect, useState } from 'react';
import { request } from '../../services/api.js';
import { CompanyChecks } from '../../components/common/InvitationForm.jsx';
import { useCompany } from '../../context/CompanyContext.jsx';

export function AdminEmployeeCompanies() {
  const { companies = [] } = useCompany();
  const [employees, setEmployees] = useState([]);
  const [assignmentIds, setAssignmentIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    let live = true;
    request('/admin/access/assignments')
      .then(data => { if (live) setEmployees(data.employees); })
      .catch(err => { if (live) setError(err.message); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  const saveAssignments = async () => {
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await request('/admin/access/assignments', {
        method: 'PUT', body: { employeeIds: selected, companyIds: assignmentIds },
      });
      setSelected([]);
      const data = await request('/admin/access/assignments');
      setEmployees(data.employees);
      setMessage(result.message);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const visible = employees.filter(row => `${row.full_name} ${row.employee_id} ${row.email}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || (row.company_ids?.includes(filter) || (filter === 'unassigned' && !row.company_ids?.length))));
  const selectedVisible = visible.length > 0 && visible.every(row => selected.includes(row.employee_id));

  return <div className="company-access">
    <h1>Employee Companies</h1>
    <p>Assign employees to one or more companies and review their current company access.</p>
    <div className="company-notice">This page covers all companies. Unassigned employees are visible only to you. Invited employees receive the companies selected by their administrator.</div>
    {error && <div className="company-notice company-error" role="alert">{error}</div>}
    {message && <div className="company-notice" role="status">{message}</div>}
    {loading ? <p role="status">Loading employee assignments…</p> : (
      <section className="company-panel"><h2>Employee company assignments</h2><p>{employees.filter(row => !row.company_ids?.length).length} unassigned · {employees.length} total employees</p>
        <div className="company-actions"><label>Find employee<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, employee ID, or email" /></label><label>Current company<select value={filter} onChange={event => { setFilter(event.target.value); setSelected([]); }}><option value="all">All companies</option><option value="unassigned">Unassigned</option>{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label></div>
        <fieldset><legend>Companies for {selected.length} selected employees</legend><CompanyChecks companies={companies} value={assignmentIds} onChange={setAssignmentIds} disabled={busy} /></fieldset><button className="company-primary" disabled={busy || !selected.length || selected.length > 200} onClick={saveAssignments}>Save assignments</button>
        {selected.length > 200 && <p>Select up to 200 employees at a time.</p>}
        <div className="company-table-wrap"><table><thead><tr><th><input type="checkbox" aria-label="Select all visible employees" checked={selectedVisible} onChange={event => setSelected(event.target.checked ? visible.map(row => row.employee_id) : [])} /></th><th>Employee</th><th>Employee ID</th><th>Company</th></tr></thead><tbody>{visible.map(row => <tr key={row.employee_id}><td><input type="checkbox" aria-label={`Select ${row.full_name}`} checked={selected.includes(row.employee_id)} onChange={event => setSelected(event.target.checked ? [...selected, row.employee_id] : selected.filter(id => id !== row.employee_id))} /></td><td>{row.full_name}<small>{row.email}</small></td><td>{row.employee_id}</td><td>{row.company_name}</td></tr>)}</tbody></table></div>{!visible.length && <p>No employees match these filters.</p>}
      </section>
    )}
  </div>;
}

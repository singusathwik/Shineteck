import React, { useEffect, useState } from 'react';
import { request } from '../../services/api.js';
import { CompanyChecks, InvitationForm } from '../../components/common/InvitationForm.jsx';
import { useCompany } from '../../context/CompanyContext.jsx';

function AdminCard({ admin, save, busy, companies }) {
  const [ids, setIds] = useState(admin.companyIds);
  const [enabled, setEnabled] = useState(admin.enabled);
  const [open, setOpen] = useState(false);
  const changed = enabled !== admin.enabled || [...ids].sort().join(',') !== [...admin.companyIds].sort().join(',');
  const panelId = `admin-companies-${admin.employeeId}`;
  return <article className="company-panel company-admin-row">
    <button className="company-admin-toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}>
      <span><strong>{admin.name}</strong><small>{admin.email}</small></span>
      <span className="company-admin-summary">{admin.isSuperAdmin ? `Super admin · All ${companies.length} companies` : `${admin.enabled ? 'Active' : 'Disabled'} · ${admin.companyIds.length} of ${companies.length} companies`}<span aria-hidden="true">{open ? '−' : '+'}</span></span>
    </button>
    {open && <div id={panelId} className="company-admin-dropdown">
      <h3>{admin.isSuperAdmin ? 'Super admin access' : 'Companies this admin can access'}</h3>
      <p>{admin.isSuperAdmin ? 'This account manages all other admins and all companies.' : 'Select any combination. This admin can only see employees, payroll, vendors and timesheets belonging to the selected companies.'}</p>
      <CompanyChecks companies={companies} value={ids} onChange={setIds} disabled={admin.isSuperAdmin || busy} />
      {!admin.isSuperAdmin && <><p>{ids.length} of {companies.length} companies selected{changed ? ' · Unsaved changes' : ''}</p><label className="company-check"><input type="checkbox" checked={enabled} disabled={busy} onChange={event => setEnabled(event.target.checked)} />Allow admin sign-in and access</label><div className="company-actions"><button className="company-primary" disabled={busy || !changed} onClick={() => save(admin.employeeId, { companyIds: ids, enabled })}>{busy ? 'Saving…' : 'Save access'}</button><button disabled={busy || !changed} onClick={() => { setIds(admin.companyIds); setEnabled(admin.enabled); }}>Discard changes</button></div></>}
    </div>}
  </article>;
}

export function AdminCompanyAccess() {
  const { companies = [] } = useCompany();
  const companyName = id => companies.find(c => c.id === id)?.name || 'Unassigned';
  const [assignmentIds, setAssignmentIds] = useState([]);
  const [tab, setTab] = useState('admins');
  const [employees, setEmployees] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const load = async () => {
    const [directory, accounts, history] = await Promise.all([request('/admin/access/assignments'), request('/admin/access/admins'), request('/admin/access/audit')]);
    setEmployees(directory.employees); setAdmins(accounts.admins); setEvents(history.events);
  };
  useEffect(() => { let live = true; load().catch(err => { if (live) setError(err.message); }).finally(() => { if (live) setLoading(false); }); return () => { live = false; }; }, []);
  const mutate = async (endpoint, body, method = 'PUT') => {
    setBusy(true); setError(''); setMessage('');
    try { const result = await request(endpoint, { method, body }); await load(); setMessage(result.message); return true; }
    catch (err) { setError(err.message); return false; }
    finally { setBusy(false); }
  };
  const visible = employees.filter(row => `${row.full_name} ${row.employee_id} ${row.email}`.toLowerCase().includes(search.toLowerCase()) && (filter === 'all' || (row.company_ids?.includes(filter) || (filter === 'unassigned' && !row.company_ids?.length))));
  const selectedVisible = visible.length > 0 && visible.every(row => selected.includes(row.employee_id));
  return <div className="company-access">
    <h1>Super Admin</h1><p>Manage your administrators and choose which companies each one can access.</p>
    <div className="company-notice">This management page covers all companies. Unassigned employees are visible only to you. Invited employees receive the companies selected by their administrator.</div>
    <div className="company-tabs" aria-label="Access management sections">{[['admins', 'Administrators'], ['employees', 'Employee companies'], ['audit', 'Access history']].map(([id, title]) => <button key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{title}</button>)}</div>
    {error && <div className="company-notice company-error" role="alert">{error}</div>}{message && <div className="company-notice" role="status">{message}</div>}
    {loading ? <p role="status">Loading company assignments…</p> : <>
      {tab === 'employees' && <section className="company-panel"><h2>Employee company assignments</h2><p>{employees.filter(row => !row.company_ids?.length).length} unassigned · {employees.length} total employees</p>
        <div className="company-actions"><label>Find employee<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, employee ID, or email" /></label><label>Current company<select value={filter} onChange={event => { setFilter(event.target.value); setSelected([]); }}><option value="all">All companies</option><option value="unassigned">Unassigned</option>{companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label></div>
        <fieldset><legend>Companies for {selected.length} selected employees</legend><CompanyChecks companies={companies} value={assignmentIds} onChange={setAssignmentIds} disabled={busy} /></fieldset><button className="company-primary" disabled={busy || !selected.length || selected.length > 200} onClick={async () => { if (await mutate('/admin/access/assignments', { employeeIds: selected, companyIds: assignmentIds })) setSelected([]); }}>Save assignments</button>
        {selected.length > 200 && <p>Select up to 200 employees at a time.</p>}
        <div className="company-table-wrap"><table><thead><tr><th><input type="checkbox" aria-label="Select all visible employees" checked={selectedVisible} onChange={event => setSelected(event.target.checked ? visible.map(row => row.employee_id) : [])} /></th><th>Employee</th><th>Employee ID</th><th>Company</th></tr></thead><tbody>{visible.map(row => <tr key={row.employee_id}><td><input type="checkbox" aria-label={`Select ${row.full_name}`} checked={selected.includes(row.employee_id)} onChange={event => setSelected(event.target.checked ? [...selected, row.employee_id] : selected.filter(id => id !== row.employee_id))} /></td><td>{row.full_name}<small>{row.email}</small></td><td>{row.employee_id}</td><td>{row.company_name}</td></tr>)}</tbody></table></div>{!visible.length && <p>No employees match these filters.</p>}
      </section>}
      {tab === 'admins' && <><div className="company-actions"><div><h2>Administrators</h2><p>{admins.filter(admin => admin.isSuperAdmin).length} super admin · {admins.filter(admin => !admin.isSuperAdmin).length} normal admins. Click an admin to expand company access.</p></div><button onClick={() => setShowCreate(value => !value)}>{showCreate ? 'Close new admin form' : 'Add Domain Admin'}</button></div><div className="company-admin-list">{[...admins].sort((a, b) => Number(b.isSuperAdmin) - Number(a.isSuperAdmin)).map(admin => <AdminCard key={`${admin.employeeId}:${JSON.stringify(admin)}`} admin={admin} companies={companies} busy={busy} save={(id, body) => mutate(`/admin/access/admins/${encodeURIComponent(id)}`, body)} />)}</div>{showCreate && <InvitationForm role="admin" onClose={() => setShowCreate(false)} />}</>}
      {tab === 'audit' && <section className="company-panel"><h2>Company access history</h2><p>The most recent 200 changes, including who made them.</p><div className="company-table-wrap"><table><thead><tr><th>Date</th><th>Changed by</th><th>Action / account</th><th>New access</th></tr></thead><tbody>{events.map(event => <tr key={event.id}><td>{new Date(event.at).toLocaleString()}</td><td>{event.actorEmail}</td><td>{event.action.replaceAll('_', ' ').toLowerCase()}<small>{event.target}</small></td><td>{event.after?.companyIds ? `${event.after.enabled ? 'Enabled' : 'Disabled'} · ${event.after.companyIds.map(companyName).join(', ') || 'No companies'}` : companyName(event.after?.companyId)}</td></tr>)}</tbody></table></div>{!events.length && <p>No access changes yet.</p>}</section>}
    </>}
  </div>;
}

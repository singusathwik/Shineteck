import React, { useEffect, useState } from 'react';
import { request } from '../../services/api.js';

export function AdminCompanies() {
  const [companies, setCompanies] = useState([]), [name, setName] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  useEffect(() => { request('/admin/access/companies').then(data => setCompanies(data.companies)).catch(err => setError(err.message)); }, []);
  async function save(id, body) {
    setBusy(true); setError('');
    try { const data = await request(`/admin/access/companies${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body }); setCompanies(data.companies); setName(''); window.dispatchEvent(new Event('company-access-denied')); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="company-access"><h1>Company Management</h1><p>Enable or disable access. Disabling a company retains its employees and records.</p>{error && <p role="alert" className="company-notice company-error">{error}</p>}
    <form className="company-panel company-actions" onSubmit={event => { event.preventDefault(); save(null, { name }); }}><label>Company name<input required maxLength={150} value={name} onChange={event => setName(event.target.value)} /></label><button className="company-primary" disabled={busy}>Add company</button></form>
    <div className="company-panel company-table-wrap"><table><thead><tr><th>Company</th><th>Access</th></tr></thead><tbody>{companies.map(company => <tr key={company.id}><td>{company.name}</td><td><label className="company-check"><input type="checkbox" checked={company.enabled} disabled={busy} onChange={event => save(company.id, { enabled: event.target.checked })} />{company.enabled ? 'Enabled' : 'Disabled'}</label></td></tr>)}</tbody></table></div>
  </div>;
}

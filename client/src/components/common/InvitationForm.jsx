import React, { useState } from 'react';
import { request } from '../../services/api.js';
import { useCompany } from '../../context/CompanyContext.jsx';

export function CompanyChecks({ companies = [], value = [], onChange, disabled }) {
  return <div className="company-checks">{companies.map(company => <label className="company-check" key={company.id}><input type="checkbox" disabled={disabled || (company.enabled === false && !value.includes(company.id))} checked={value.includes(company.id)} onChange={event => onChange(event.target.checked ? [...value, company.id] : value.filter(id => id !== company.id))} />{company.name}{company.enabled === false ? ' (disabled)' : ''}</label>)}</div>;
}
export function InvitationForm({ role = 'employee', onClose }) {
  const { companies = [], selected } = useCompany();
  const [draft, setDraft] = useState({ firstName: '', lastName: '', email: '', companyIds: companies.some(c => c.id === selected && c.enabled) ? [selected] : [] });
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { const data = await request('/admin/invitations', { method: 'POST', body: { ...draft, role } }); setMessage(data.message); setDraft({ firstName: '', lastName: '', email: '', companyIds: [] }); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="company-access company-panel" aria-busy={busy}><h2>{role === 'admin' ? 'Add Domain Admin' : 'Add Employee'}</h2><p>{role === 'admin' ? 'Grant access to the selected companies. The email will list those companies and include a link to set up the admin account.' : 'Invite an employee to register their personal information and set a password. Their email will list the selected companies and explain how to get started.'}</p>
    {error && <p className="company-notice company-error" role="alert">{error}</p>}{message && <p className="company-notice" role="status">{message}</p>}
    <div className="company-grid">{[['firstName', 'First Name'], ['lastName', 'Last Name'], ['email', 'Email ID']].map(([key, title]) => <label key={key}>{title}<input required disabled={busy} autoComplete={key === 'email' ? 'email' : key === 'firstName' ? 'given-name' : 'family-name'} maxLength={key === 'email' ? 254 : 80} type={key === 'email' ? 'email' : 'text'} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>)}</div>
    <fieldset disabled={busy}><legend>Company access</legend><p>Select one or more companies. This account will only have access to the companies you select.</p><CompanyChecks companies={companies} value={draft.companyIds} onChange={companyIds => setDraft({ ...draft, companyIds })} /></fieldset>
    <div className="company-actions"><button className="company-primary" disabled={busy || !draft.companyIds.length}>{busy ? 'Sending…' : 'Send Email'}</button>{onClose && <button type="button" disabled={busy} onClick={onClose}>Close</button>}</div>
  </form>;
}

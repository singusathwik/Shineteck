import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { request, setCompanyScope } from '../services/api.js';
import '../styles/company-access.css';

const CompanyContext = createContext({ companies: [], selected: 'all', isSuperAdmin: false });
export const useCompany = () => useContext(CompanyContext);

export function CompanyProvider({ children }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [context, setContext] = useState(null);
  const [selected, setSelected] = useState('all');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const previous = useRef('');
  useEffect(() => {
    let live = true;
    setCompanyScope('all'); setSelected('all'); setActiveTab('dashboard'); setContext(null); setError(''); previous.current = '';
    if (user?.role !== 'admin') return;
    const refresh = async () => {
      try {
        const data = await request('/admin/company-context');
        if (!live) return;
        const signature = JSON.stringify(data);
        if (previous.current && previous.current !== signature) {
          setCompanyScope('all'); setSelected('all'); setRevision(value => value + 1);
        }
        previous.current = signature;
        setContext(data); setError('');
      } catch (err) { if (live) { setContext(null); setError(err.message); } }
    };
    refresh();
    const interval = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    window.addEventListener('company-access-denied', refresh);
    return () => { live = false; clearInterval(interval); window.removeEventListener('focus', refresh); window.removeEventListener('company-access-denied', refresh); };
  }, [user?.employeeId, user?.role]);
  const choose = value => { setCompanyScope(value); setSelected(value); setRevision(value => value + 1); };
  if (user?.role === 'admin' && !context) return <div className="company-access company-loading" role="status"><h1>{error ? 'Workspace unavailable' : 'Loading company access…'}</h1><p>{error || 'Checking your company permissions.'}</p>{error && <button onClick={logout}>Back to sign in</button>}</div>;
  return <CompanyContext.Provider value={{ ...context, selected, choose, activeTab, setActiveTab, refreshWorkspace: () => setRevision(value => value + 1) }}><React.Fragment key={`${user?.employeeId}:${revision}`}>{children}</React.Fragment></CompanyContext.Provider>;
}

export function CompanySelector() {
  const { companies, selected, choose, isSuperAdmin } = useCompany();
  return <section className="company-access company-toolbar" aria-label="Company workspace">
    <div><strong>{isSuperAdmin ? 'Super admin workspace' : 'Company workspace'}</strong><p>{isSuperAdmin ? 'Manage all five companies or focus on one.' : 'Only employees in your assigned companies are available.'}</p></div>
    <label>Company<select value={selected} onChange={event => choose(event.target.value)}>
      <option value="all">{isSuperAdmin ? 'All employees · All companies' : 'All employees · My companies'}</option>
      {companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
      {isSuperAdmin && <option value="unassigned">Unassigned employees</option>}
    </select></label>
  </section>;
}

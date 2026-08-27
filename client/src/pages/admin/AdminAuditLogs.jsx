import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { EmployeeAvatar } from '../../components/common/EmployeeAvatar.jsx';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  RefreshCw
} from 'lucide-react';

export function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (actionFilter !== 'ALL') params.action = actionFilter;
      if (roleFilter !== 'ALL') params.userRole = roleFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const data = await api.getAuditLogs(params);
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, actionFilter, roleFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="enterprise-card p-6 bg-white border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">System Audit Trail & Security Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Immutable chronological record of employee registrations, document compliance reviews, and timesheet actions
          </p>
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          className="enterprise-btn-secondary"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Logs
        </button>
      </div>

      {/* Filter & Search */}
      <div className="enterprise-card p-4 bg-white border-slate-300">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Actor, Details, ID, or Action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="ALL">All Roles</option>
              <option value="employee">Employee</option>
              <option value="admin">Administrator</option>
              <option value="system">System</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-600/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="table-container shadow-sm">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Role</th>
              <th>Action Event</th>
              <th>Target Record</th>
              <th>Details</th>
              <th className="text-right">Result</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No audit records found matching criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/70 transition-colors">
                  <td className="text-slate-500 whitespace-nowrap font-mono text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <EmployeeAvatar
                        name={log.user_name || log.user_id || 'System'}
                        size="xs"
                      />
                      <span className="font-bold text-slate-900 text-xs font-display">
                        {log.user_name || log.user_id}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      log.user_role === 'admin'
                        ? 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                        : log.user_role === 'employee'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {log.user_role}
                    </span>
                  </td>
                  <td className="font-mono font-bold text-slate-800 text-[11px]">
                    {log.action}
                  </td>
                  <td className="font-mono text-slate-600 text-xs">
                    {log.entity_type ? `${log.entity_type} #${log.entity_id || '—'}` : '—'}
                  </td>
                  <td className="text-slate-600 max-w-[280px] truncate text-xs" title={log.details}>
                    {log.details || '—'}
                  </td>
                  <td className="text-right">
                    <StatusBadge status={log.status} size="sm" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

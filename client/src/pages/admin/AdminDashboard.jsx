import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import {
  Users,
  Clock,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Receipt,
  UserCheck,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export function AdminDashboard({ onSelectEmployee, onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [recentTimesheets, setRecentTimesheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data.stats);
      setRecentEmployees(data.recentEmployees || []);
      setRecentTimesheets(data.recentTimesheets || []);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      {/* Executive Page Header */}
      <div className="enterprise-card p-5 sm:p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Corporate Operations Dashboard
            </h1>
            <span className="text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
              HR Administration
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time workforce metrics, pending onboarding compliance verification, and timesheet authorization queue
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigateTab('approvals')}
            className="enterprise-btn-primary cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Review Applications</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div
          onClick={() => onNavigateTab('employees')}
          className="enterprise-card p-4 bg-white hover:border-slate-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Staff</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.totalEmployees || 0}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Active directory</p>
        </div>

        <div
          onClick={() => onNavigateTab('approvals')}
          className="enterprise-card p-4 bg-amber-50/40 border-amber-200/80 hover:border-amber-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Pending HR</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">{stats?.pendingRegistrations || 0}</div>
          <p className="text-[11px] text-amber-700 font-semibold mt-0.5">Awaiting review</p>
        </div>

        <div
          onClick={() => onNavigateTab('approvals')}
          className="enterprise-card p-4 bg-emerald-50/30 border-emerald-200/80 hover:border-emerald-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900">{stats?.approvedEmployees || 0}</div>
          <p className="text-[11px] text-emerald-700 mt-0.5">Verified workforce</p>
        </div>

        <div
          onClick={() => onNavigateTab('timesheets')}
          className="enterprise-card p-4 bg-white hover:border-slate-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Timesheets</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.pendingTimesheets || 0}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Pending approval</p>
        </div>

        <div
          onClick={() => onNavigateTab('timesheets')}
          className="enterprise-card p-4 bg-white hover:border-slate-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Authorized</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.approvedTimesheets || 0}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Ready for payroll</p>
        </div>

        <div
          onClick={() => onNavigateTab('approvals')}
          className="enterprise-card p-4 bg-white hover:border-slate-400 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Compliance</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.pendingDocuments || 0}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Doc checklists</p>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Employee Registrations Queue */}
        <div className="lg:col-span-7 enterprise-card p-5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recent Employee Registrations
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('employees')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Full Directory <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentEmployees.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Users className="w-6 h-6 text-slate-300 mx-auto mb-2 opacity-50" />
                  No employee records registered yet.
                </div>
              ) : (
                recentEmployees.map((emp) => (
                  <div key={emp.employee_id} className="py-3 flex items-center justify-between text-xs gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">{emp.full_name}</span>
                        <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 font-bold shrink-0">
                          {emp.employee_id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {emp.designation || 'Consultant'} • {emp.country || 'Global'} • {emp.submitted_at ? new Date(emp.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={emp.registration_status} size="sm" />
                      <button
                        type="button"
                        onClick={() => onSelectEmployee(emp.employee_id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-md transition-all cursor-pointer"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Showing top recent submissions</span>
            <button
              type="button"
              onClick={() => onNavigateTab('approvals')}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Open Approvals Dossier &rarr;
            </button>
          </div>
        </div>

        {/* Right Column: Pending Timesheets Queue */}
        <div className="lg:col-span-5 enterprise-card p-5 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Timesheet Approvals Feed
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('timesheets')}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Manage <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentTimesheets.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Clock className="w-6 h-6 text-slate-300 mx-auto mb-2 opacity-50" />
                  No submitted timesheets in queue.
                </div>
              ) : (
                recentTimesheets.map((ts) => (
                  <div
                    key={ts.id || ts._id}
                    className="p-3 bg-slate-50/70 rounded-lg border border-slate-200/80 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">
                        {ts.full_name || ts.employee_name || ts.employee_id}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {ts.start_date} &rarr; {ts.end_date} <span className="font-semibold text-slate-700">({ts.total_hours} hrs)</span>
                      </p>
                      {ts.vendor_name && (
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 inline-block mt-1">
                          {ts.vendor_name}
                        </span>
                      )}
                    </div>
                    <StatusBadge status={ts.status} size="sm" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Pay Cycle 2026-Q1</span>
            <button
              type="button"
              onClick={() => onNavigateTab('timesheets')}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              Review Timesheets &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

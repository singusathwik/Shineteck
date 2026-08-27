import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { EmployeeAvatar } from '../../components/common/EmployeeAvatar.jsx';
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
  TrendingUp,
  Sparkles,
  Search
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
      <div className="enterprise-header-banner p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
              Corporate Operations Dashboard
            </h1>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-0.5 rounded-full font-display shadow-2xs">
              HR Administration
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Real-time workforce metrics, pending onboarding compliance verification, and timesheet authorization queue
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateTab('approvals')}
            className="enterprise-btn-primary"
          >
            <UserCheck className="w-4 h-4" />
            <span>Review Applications</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards with Eye-Friendly Tonal Accents */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        <div
          onClick={() => onNavigateTab('employees')}
          className="enterprise-card p-4.5 bg-blue-50/60 border-blue-200/90 hover:border-blue-400 hover:-translate-y-0.5 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-blue-900 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 font-display">Total Staff</span>
            <div className="w-7 h-7 rounded-lg bg-blue-100/90 text-blue-700 flex items-center justify-center border border-blue-200">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 font-display">{stats?.totalEmployees || 0}</div>
          <p className="text-[11px] text-blue-900/80 mt-1 font-semibold flex items-center gap-1">
            <span className="text-emerald-700 font-bold">Active</span> directory
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('approvals')}
          className="enterprise-card p-4.5 bg-amber-50/60 border-amber-200/90 hover:border-amber-400 hover:-translate-y-0.5 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-amber-900 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 font-display">Pending HR</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-950 font-display">{stats?.pendingRegistrations || 0}</div>
          <p className="text-[11px] text-amber-900 font-bold mt-1">Awaiting review</p>
        </div>

        <div
          onClick={() => onNavigateTab('approvals')}
          className="enterprise-card p-4.5 bg-emerald-50/60 border-emerald-200/90 hover:border-emerald-400 hover:-translate-y-0.5 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-emerald-900 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 font-display">Approved</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-950 font-display">{stats?.approvedEmployees || 0}</div>
          <p className="text-[11px] text-emerald-800 font-semibold mt-1">Verified workforce</p>
        </div>

        <div
          onClick={() => onNavigateTab('timesheets')}
          className="enterprise-card p-4.5 bg-purple-50/60 border-purple-200/90 hover:border-purple-400 hover:-translate-y-0.5 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-purple-900 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 font-display">Timesheets</span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center border border-purple-200">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-950 font-display">{stats?.pendingTimesheets || 0}</div>
          <p className="text-[11px] text-purple-900 font-semibold mt-1">Pending authorization</p>
        </div>

        <div
          onClick={() => onNavigateTab('timesheets')}
          className="enterprise-card p-4.5 bg-sky-50/60 border-sky-200/90 hover:border-sky-400 hover:-translate-y-0.5 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-sky-900 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 font-display">Authorized</span>
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center border border-sky-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-950 font-display">{stats?.approvedTimesheets || 0}</div>
          <p className="text-[11px] text-sky-900 font-semibold mt-1">Ready for payroll</p>
        </div>

        <div
          onClick={() => onNavigateTab('approvals')}
          className="enterprise-card p-4.5 bg-indigo-50/60 border-indigo-200/90 hover:border-indigo-400 hover:-translate-y-0.5 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-indigo-900 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 font-display">Compliance</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center border border-indigo-200">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-950 font-display">{stats?.pendingDocuments || 0}</div>
          <p className="text-[11px] text-indigo-900 font-semibold mt-1">Doc checklists</p>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Employee Registrations Queue */}
        <div className="lg:col-span-7 enterprise-card p-5 sm:p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                  Recent Employee Registrations
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('employees')}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                Full Directory <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentEmployees.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50 stroke-1" />
                  <p className="font-medium">No recent employee records.</p>
                </div>
              ) : (
                recentEmployees.map((emp) => (
                  <div key={emp.employee_id} className="py-3.5 flex items-center justify-between text-xs gap-3 hover:bg-blue-50/50 rounded-xl px-2 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <EmployeeAvatar
                        name={emp.full_name}
                        imageUrl={emp.profile_image_url}
                        size="md"
                        status={emp.registration_status}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 truncate">{emp.full_name}</span>
                          <span className="font-mono text-[10px] text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded-md border border-blue-200 font-bold shrink-0">
                            {emp.employee_id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                          {emp.designation || 'Consultant'} • {emp.country || 'Global'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <StatusBadge status={emp.registration_status} size="sm" />
                      <button
                        type="button"
                        onClick={() => onSelectEmployee(emp.employee_id)}
                        className="px-3 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-2xs"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
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
        <div className="lg:col-span-5 enterprise-card p-5 sm:p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                  Timesheet Approvals Feed
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('timesheets')}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {recentTimesheets.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50 stroke-1" />
                  <p className="font-medium">No submitted timesheets in queue.</p>
                </div>
              ) : (
                recentTimesheets.map((ts) => (
                  <div
                    key={ts.id || ts._id}
                    className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs hover:bg-blue-50/40 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <EmployeeAvatar
                        name={ts.full_name || ts.employee_name || 'Consultant'}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">
                          {ts.full_name || ts.employee_name || ts.employee_id}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                          {ts.start_date} &rarr; {ts.end_date} <span className="font-bold font-mono text-slate-800">({ts.total_hours} hrs)</span>
                        </p>
                        {ts.vendor_name && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.2 rounded-md border border-blue-100 inline-block mt-1">
                            {ts.vendor_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={ts.status} size="sm" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
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

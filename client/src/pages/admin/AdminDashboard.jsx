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
  TrendingUp,
  ShieldCheck
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
      {/* Header */}
      <div className="enterprise-card p-6 bg-white border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Admin Operations Dashboard</h1>
            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded font-semibold">
              HR Administration
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time overview of employee onboarding, pending document reviews, and timesheet authorizations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigateTab('approvals')}
            className="px-3.5 py-1.5 bg-[#0f2b48] hover:bg-[#1a416b] text-white text-xs font-semibold rounded shadow-xs transition-colors"
          >
            Review Applications Queue
          </button>
        </div>
      </div>

      {/* 6 Key Enterprise Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div
          onClick={() => onNavigateTab('employees')}
          className="enterprise-card p-4 bg-white border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL EMPLOYEES</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.totalEmployees || 0}</div>
          <p className="text-[10px] text-slate-500 mt-1">All registered accounts</p>
        </div>

        <div
          onClick={() => onNavigateTab('approvals')}
          className="enterprise-card p-4 bg-amber-50/50 border-amber-200 cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">PENDING REVIEWS</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900">{stats?.pendingRegistrations || 0}</div>
          <p className="text-[10px] text-amber-700 mt-1">Click to Review Applications</p>
        </div>

        <div className="enterprise-card p-4 bg-emerald-50/50 border-emerald-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">APPROVED EMPLOYEES</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-900">{stats?.approvedEmployees || 0}</div>
          <p className="text-[10px] text-emerald-700 mt-1">Active verified staff</p>
        </div>

        <div className="enterprise-card p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PENDING TIMESHEETS</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.pendingTimesheets || 0}</div>
          <p className="text-[10px] text-slate-500 mt-1">Requires approval</p>
        </div>

        <div className="enterprise-card p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">APPROVED TIMESHEETS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.approvedTimesheets || 0}</div>
          <p className="text-[10px] text-slate-500 mt-1">Authorized for payroll</p>
        </div>

        <div className="enterprise-card p-4 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PENDING DOCS</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.pendingDocuments || 0}</div>
          <p className="text-[10px] text-slate-500 mt-1">Awaiting compliance review</p>
        </div>
      </div>

      {/* Grid: Pending Onboarding Submissions & Recent Timesheets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Employee Registrations Queue */}
        <div className="lg:col-span-7 enterprise-card p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Recent Employee Registrations
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('employees')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View Full Directory <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {recentEmployees.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No employee records yet.</p>
            ) : (
              recentEmployees.map((emp) => (
                <div key={emp.employee_id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{emp.full_name}</span>
                      <span className="font-mono text-[11px] text-blue-700 font-semibold">{emp.employee_id}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {emp.designation} • {emp.country} • Submitted {new Date(emp.submitted_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={emp.registration_status} size="sm" />
                    <button
                      type="button"
                      onClick={() => onSelectEmployee(emp.employee_id)}
                      className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Timesheet Approvals */}
        <div className="lg:col-span-5 enterprise-card p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Pending Timesheet Submissions
            </h3>
            <button
              type="button"
              onClick={() => onNavigateTab('timesheets')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {recentTimesheets.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No submitted timesheets.</p>
            ) : (
              recentTimesheets.map((ts) => (
                <div key={ts.id} className="p-3 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{ts.full_name || ts.employee_name || ts.employee_id}</p>
                    <p className="text-[11px] text-slate-500">{ts.start_date} to {ts.end_date} ({ts.total_hours} hrs)</p>
                  </div>
                  <StatusBadge status={ts.status} size="sm" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

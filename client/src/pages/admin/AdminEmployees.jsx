import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  UserCheck,
  UserX,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Briefcase,
  X,
  ShieldAlert,
  Power
} from 'lucide-react';

export function AdminEmployees({ onSelectEmployee }) {
  const [employees, setEmployees] = useState([]);
  const [counts, setCounts] = useState({ all: 0, active: 0, inactive: 0 });
  const [employmentTab, setEmploymentTab] = useState('ALL'); // 'ALL' | 'Active' | 'Inactive'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');
  const [isLoading, setIsLoading] = useState(true);

  // Status Toggle Modal state
  const [toggleModalEmployee, setToggleModalEmployee] = useState(null);
  const [toggleTargetStatus, setToggleTargetStatus] = useState('Active');
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');
  const [modalReason, setModalReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  const fetchEmployees = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (employmentTab !== 'ALL') params.employmentStatus = employmentTab;
      if (countryFilter !== 'ALL') params.country = countryFilter;
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;

      const data = await api.getAllEmployees(params);
      setEmployees(data.employees || []);
      if (data.counts) {
        setCounts(data.counts);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, statusFilter, employmentTab, countryFilter, sortBy, sortOrder]);

  const openStatusToggleModal = (emp, targetStatus) => {
    setToggleModalEmployee(emp);
    setToggleTargetStatus(targetStatus);
    setModalStartDate(emp.start_date || new Date().toISOString().split('T')[0]);
    if (targetStatus === 'Inactive') {
      setModalEndDate(emp.end_date || new Date().toISOString().split('T')[0]);
    } else {
      setModalEndDate('');
    }
    setModalReason('');
  };

  const handleConfirmStatusToggle = async () => {
    if (!toggleModalEmployee) return;
    setIsUpdatingStatus(true);
    setActionFeedback(null);

    try {
      await api.toggleEmploymentStatus(toggleModalEmployee.employee_id, {
        employmentStatus: toggleTargetStatus,
        startDate: modalStartDate,
        endDate: modalEndDate || null,
        reason: modalReason
      });

      setActionFeedback({
        type: 'success',
        message: `Employee ${toggleModalEmployee.full_name} (${toggleModalEmployee.employee_id}) successfully set to ${toggleTargetStatus}.`
      });
      setToggleModalEmployee(null);
      await fetchEmployees();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to update employment status.'
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="enterprise-card p-6 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Employee Directory & Employment Lifecycle</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Track active working status, employment start & end dates, and manage employee records
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              Total Records: <strong className="text-blue-700 font-mono">{counts.all}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Action feedback banner */}
      {actionFeedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between gap-2 ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Active / Inactive Tab Navigation ────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setEmploymentTab('Active')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-xs transition-all border-b-2 ${
            employmentTab === 'Active'
              ? 'border-emerald-600 text-emerald-800 bg-emerald-50/70'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
          <span>Active Employees</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            employmentTab === 'Active' ? 'bg-emerald-200/80 text-emerald-900' : 'bg-slate-100 text-slate-600'
          }`}>
            {counts.active}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setEmploymentTab('Inactive')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-xs transition-all border-b-2 ${
            employmentTab === 'Inactive'
              ? 'border-rose-600 text-rose-800 bg-rose-50/70'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-200"></span>
          <span>Inactive / Ended</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            employmentTab === 'Inactive' ? 'bg-rose-200/80 text-rose-900' : 'bg-slate-100 text-slate-600'
          }`}>
            {counts.inactive}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setEmploymentTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-xs transition-all border-b-2 ${
            employmentTab === 'ALL'
              ? 'border-blue-600 text-blue-800 bg-blue-50/70'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span>All Employees</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            employmentTab === 'ALL' ? 'bg-blue-200/80 text-blue-900' : 'bg-slate-100 text-slate-600'
          }`}>
            {counts.all}
          </span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="enterprise-card p-4 bg-white border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by first/last name, Employee ID, email, or designation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Onboarding Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Onboarding:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Onboarding Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Needs Correction">Needs Correction</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="created_at">Registration Date</option>
              <option value="start_date">Employment Start Date</option>
              <option value="full_name">Employee Name</option>
              <option value="employee_id">Employee ID</option>
              <option value="employment_status">Active / Inactive Status</option>
              <option value="registration_status">Onboarding Status</option>
            </select>
            <button
              type="button"
              onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
              className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="enterprise-card bg-white border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Employee Name</th>
                <th className="py-3.5 px-4">Designation</th>
                <th className="py-3.5 px-4">Start Date</th>
                <th className="py-3.5 px-4">End Date</th>
                <th className="py-3.5 px-4">Working Status</th>
                <th className="py-3.5 px-4">Onboarding</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-500">No employees found in this view.</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your active/inactive tab or search filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const isActive = emp.employment_status === 'Active' || emp.is_still_working;
                  return (
                    <tr key={emp.employee_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {emp.employee_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{emp.full_name}</div>
                        <div className="text-[11px] text-slate-400">{emp.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {emp.designation}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-mono">
                        {emp.start_date ? (
                          <span>{emp.start_date}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {emp.end_date ? (
                          <span className="font-mono text-rose-700 font-semibold">{emp.end_date}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Present / Ongoing
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-emerald-800 bg-emerald-100/80 border border-emerald-200 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            Currently Working (Active)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Inactive / Ended
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={emp.registration_status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectEmployee(emp.employee_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0f2b48] hover:bg-[#1a416b] text-white font-semibold rounded-md shadow-xs text-xs transition-colors"
                            title="Inspect & Review Profile"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>

                          {isActive ? (
                            <button
                              type="button"
                              onClick={() => openStatusToggleModal(emp, 'Inactive')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-semibold rounded-md text-xs transition-colors"
                              title="Deactivate this employee"
                            >
                              <UserX className="w-3 h-3" />
                              <span>Deactivate</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openStatusToggleModal(emp, 'Active')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-semibold rounded-md text-xs transition-colors"
                              title="Reactivate this employee"
                            >
                              <UserCheck className="w-3 h-3" />
                              <span>Reactivate</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Status Toggle Modal ─────────────────────────────────────────── */}
      {toggleModalEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  toggleTargetStatus === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {toggleTargetStatus === 'Active' ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {toggleTargetStatus === 'Active' ? 'Activate Employee' : 'Deactivate Employee'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {toggleModalEmployee.full_name} ({toggleModalEmployee.employee_id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setToggleModalEmployee(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-700">
                  You are setting employment status to{' '}
                  <strong className={toggleTargetStatus === 'Active' ? 'text-emerald-700' : 'text-rose-700'}>
                    {toggleTargetStatus.toUpperCase()}
                  </strong>
                  . {toggleTargetStatus === 'Inactive'
                    ? 'The employee will no longer be able to log in or submit timesheets.'
                    : 'The employee account will be restored and allowed to submit timesheets.'}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employment Start Date</label>
                <input
                  type="date"
                  value={modalStartDate}
                  onChange={(e) => setModalStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Employment End Date {toggleTargetStatus === 'Active' ? '(Leave empty if currently working)' : '(Required for inactive)'}
                </label>
                <input
                  type="date"
                  value={modalEndDate}
                  onChange={(e) => setModalEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">HR Reason / Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Contract completed, Resigned, On leave, Reactivated"
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setToggleModalEmployee(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={handleConfirmStatusToggle}
                className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-xs transition-colors ${
                  toggleTargetStatus === 'Active'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {isUpdatingStatus ? 'Updating...' : `Confirm Set ${toggleTargetStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { exportToCSV } from '../../utils/csvExport.js';
import { SkeletonTable } from '../../components/common/SkeletonLoader.jsx';
import {
  Users,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  UserCheck,
  UserX,
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Briefcase,
  X,
  ShieldAlert,
  Power,
  Plus,
  Mail,
  Phone,
  MapPin,
  Lock,
  Sparkles,
  Download
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

  // Add Employee Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [nextIdPreview, setNextIdPreview] = useState('');
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const [addFormError, setAddFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const initialAddFormData = {
    firstName: '',
    lastName: '',
    middleInitial: '',
    email: '',
    phone: '',
    designation: '',
    dateOfBirth: '1995-01-01',
    country: 'United States',
    state: 'California',
    city: 'Los Angeles',
    zipCode: '90001',
    address: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    employmentStatus: 'Active',
    password: 'Password@123',
    registrationStatus: 'Approved'
  };

  const [addFormData, setAddFormData] = useState(initialAddFormData);

  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    setLoading(true);
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
      setLoading(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, statusFilter, employmentTab, countryFilter, sortBy, sortOrder]);

  const openAddEmployeeModal = async () => {
    setAddFormData({
      ...initialAddFormData,
      startDate: new Date().toISOString().split('T')[0]
    });
    setAddFormError(null);
    setIsAddModalOpen(true);
    try {
      const preview = await api.getNextIdPreview();
      if (preview && preview.nextId) {
        setNextIdPreview(preview.nextId);
      }
    } catch (err) {
      console.warn('Could not fetch next ID preview:', err.message);
    }
  };

  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    setAddFormError(null);

    if (!addFormData.firstName.trim() || !addFormData.lastName.trim()) {
      setAddFormError('First Name and Last Name are required.');
      return;
    }

    if (!addFormData.email.trim()) {
      setAddFormError('Corporate email is required.');
      return;
    }

    if (!addFormData.designation.trim()) {
      setAddFormError('Designation is required.');
      return;
    }

    setIsCreatingEmployee(true);
    try {
      const res = await api.createEmployeeByAdmin(addFormData);
      setActionFeedback({
        type: 'success',
        message: res.message || 'Employee created successfully!'
      });
      setIsAddModalOpen(false);
      await fetchEmployees();
    } catch (err) {
      setAddFormError(err.message || 'Failed to create employee record.');
    } finally {
      setIsCreatingEmployee(false);
    }
  };

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

  const handleExportCSV = () => {
    const formattedData = employees.map(emp => ({
      'Employee ID': emp.employee_id,
      'Full Name': emp.full_name,
      'Email': emp.email,
      'Phone': emp.phone || 'N/A',
      'Designation': emp.designation,
      'Country': emp.country || 'N/A',
      'Start Date': emp.start_date || 'N/A',
      'End Date': emp.end_date || 'N/A',
      'Employment Status': emp.employment_status || 'Active',
      'Onboarding Status': emp.registration_status || 'Approved'
    }));
    exportToCSV(formattedData, `Shineteck_Employee_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Top Banner */}
      <div className="enterprise-card p-6 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
              Employee Directory & Workforce Lifecycle
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Track active working status, employment start & end dates, and manage consultant personnel records
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="enterprise-btn-secondary"
              title="Download entire directory as CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={openAddEmployeeModal}
              className="enterprise-btn-primary"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Employee</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action feedback banner */}
      {actionFeedback && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
            : 'bg-rose-50 text-rose-900 border border-rose-200'
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
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active / Inactive Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-1">
        <button
          type="button"
          onClick={() => setEmploymentTab('Active')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all border-b-2 cursor-pointer font-display ${
            employmentTab === 'Active'
              ? 'border-emerald-600 text-emerald-900 bg-emerald-50/80'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)] animate-status-pulse"></span>
          <span>Active Employees</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
            employmentTab === 'Active' ? 'bg-emerald-200/80 text-emerald-950' : 'bg-slate-100 text-slate-600'
          }`}>
            {counts.active}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setEmploymentTab('Inactive')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all border-b-2 cursor-pointer font-display ${
            employmentTab === 'Inactive'
              ? 'border-rose-600 text-rose-900 bg-rose-50/80'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span>Inactive / Ended</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
            employmentTab === 'Inactive' ? 'bg-rose-200/80 text-rose-950' : 'bg-slate-100 text-slate-600'
          }`}>
            {counts.inactive}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setEmploymentTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold text-xs transition-all border-b-2 cursor-pointer font-display ${
            employmentTab === 'ALL'
              ? 'border-blue-600 text-blue-900 bg-blue-50/80'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span>All Employees</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
            employmentTab === 'ALL' ? 'bg-blue-200/80 text-blue-950' : 'bg-slate-100 text-slate-600'
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
      {loading ? (
        <SkeletonTable rows={6} cols={8} />
      ) : (
        <div className="table-container shadow-sm">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Designation</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Working Status</th>
                <th>Onboarding</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300 mx-auto opacity-50 stroke-1" />
                      <p className="font-bold text-slate-700">No employees found in this view.</p>
                      <p className="text-[11px] text-slate-400">Try adjusting your active/inactive tab or search filters.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const isActive = emp.employment_status === 'Active' || emp.is_still_working;
                  return (
                    <tr key={emp.employee_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="font-mono font-bold text-blue-700">
                      {emp.employee_id}
                    </td>
                    <td>
                      <div className="font-bold text-slate-900">{emp.full_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{emp.email}</div>
                    </td>
                    <td className="text-slate-700 font-medium">
                      {emp.designation}
                    </td>
                    <td className="text-slate-700 font-mono">
                      {emp.start_date ? (
                        <span>{emp.start_date}</span>
                      ) : (
                        <span className="text-slate-400 italic">Not set</span>
                      )}
                    </td>
                    <td>
                      {emp.end_date ? (
                        <span className="font-mono text-rose-700 font-semibold">{emp.end_date}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Present / Ongoing
                        </span>
                      )}
                    </td>
                    <td>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold text-emerald-900 bg-emerald-100/90 border border-emerald-200 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-status-pulse"></span>
                          Working (Active)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold text-slate-700 bg-slate-100 border border-slate-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Inactive / Ended
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={emp.registration_status} size="sm" />
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectEmployee(emp.employee_id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#0f2b48] hover:bg-[#173f67] text-white font-bold rounded-lg shadow-2xs text-xs transition-all cursor-pointer active:scale-98"
                          title="Inspect & Review Profile"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect</span>
                        </button>

                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => openStatusToggleModal(emp, 'Inactive')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold rounded-lg text-xs transition-all cursor-pointer"
                            title="Deactivate this employee"
                          >
                            <UserX className="w-3 h-3" />
                            <span>Deactivate</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openStatusToggleModal(emp, 'Active')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold rounded-lg text-xs transition-all cursor-pointer"
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
      )}

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

      {/* ── Add New Employee Modal ────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Employee</h3>
                  <p className="text-xs text-slate-500">
                    Create employee profile, set working status, and generate login access
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {addFormError && (
              <div className="flex items-center gap-2.5 p-3.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{addFormError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAddEmployeeSubmit} className="space-y-6 text-xs">
              {/* Section 1: Personal Info */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px] text-blue-700">
                    <span>1. Personal Information</span>
                  </h4>
                  {nextIdPreview && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full font-mono text-[10px] font-bold">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      Auto ID: {nextIdPreview}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sarah"
                      value={addFormData.firstName}
                      onChange={(e) => setAddFormData({ ...addFormData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Middle Initial</label>
                    <input
                      type="text"
                      maxLength="10"
                      placeholder="e.g. M."
                      value={addFormData.middleInitial}
                      onChange={(e) => setAddFormData({ ...addFormData, middleInitial: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jenkins"
                      value={addFormData.lastName}
                      onChange={(e) => setAddFormData({ ...addFormData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Corporate Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="sarah.jenkins@shinetek.com"
                      value={addFormData.email}
                      onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 019-2831"
                      value={addFormData.phone}
                      onChange={(e) => setAddFormData({ ...addFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={addFormData.dateOfBirth}
                      onChange={(e) => setAddFormData({ ...addFormData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Job & Role */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px] text-blue-700">
                  2. Role & Employment Lifecycle
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Designation / Role *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Software Engineer"
                      value={addFormData.designation}
                      onChange={(e) => setAddFormData({ ...addFormData, designation: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Employment Status</label>
                    <select
                      value={addFormData.employmentStatus}
                      onChange={(e) => setAddFormData({ ...addFormData, employmentStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="Active">Active (Currently Working)</option>
                      <option value="Inactive">Inactive / On Leave</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Onboarding Status</label>
                    <select
                      value={addFormData.registrationStatus}
                      onChange={(e) => setAddFormData({ ...addFormData, registrationStatus: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="Approved">Approved (Immediate Portal Access)</option>
                      <option value="Pending Review">Pending Review</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Employment Start Date</label>
                    <input
                      type="date"
                      value={addFormData.startDate}
                      onChange={(e) => setAddFormData({ ...addFormData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Employment End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={addFormData.endDate}
                      onChange={(e) => setAddFormData({ ...addFormData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Location & Address */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-900 mb-3 uppercase tracking-wider text-[11px] text-blue-700">
                  3. Location & Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Country</label>
                    <select
                      value={addFormData.country}
                      onChange={(e) => setAddFormData({ ...addFormData, country: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="India">India</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">State / Province</label>
                    <input
                      type="text"
                      placeholder="e.g. California"
                      value={addFormData.state}
                      onChange={(e) => setAddFormData({ ...addFormData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Los Angeles"
                      value={addFormData.city}
                      onChange={(e) => setAddFormData({ ...addFormData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Zip / Postal Code</label>
                    <input
                      type="text"
                      placeholder="e.g. 90001"
                      value={addFormData.zipCode}
                      onChange={(e) => setAddFormData({ ...addFormData, zipCode: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block font-semibold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 100 Corporate Plaza, Suite 400"
                    value={addFormData.address}
                    onChange={(e) => setAddFormData({ ...addFormData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Section 4: Initial Login Credentials */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-bold text-slate-900 mb-2 uppercase tracking-wider text-[11px] text-blue-700 flex items-center justify-between">
                  <span>4. Initial Portal Credentials</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-blue-600 hover:text-blue-800 font-normal lowercase tracking-normal text-[11px]"
                  >
                    {showPassword ? 'Hide password' : 'Show password'}
                  </button>
                </h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={addFormData.password}
                      onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Default temporary password is <strong>Password@123</strong>. The employee will use this password along with their email or Employee ID to log in.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingEmployee}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0f2b48] hover:bg-[#1a416b] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isCreatingEmployee ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Employee...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Employee Record</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


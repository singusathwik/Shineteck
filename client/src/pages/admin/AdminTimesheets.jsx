import React, { useState, useEffect } from 'react';
import { api, getAuthToken, getTimesheetDownloadUrl } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { EmployeeAvatar } from '../../components/common/EmployeeAvatar.jsx';
import { exportToCSV } from '../../utils/csvExport.js';
import {
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  Calendar,
  X
} from 'lucide-react';

export function AdminTimesheets() {
  const [timesheets, setTimesheets] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reviewModalTs, setReviewModalTs] = useState(null);
  const [adminFeedback, setAdminFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchTimesheets = async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const data = await api.getAllTimesheets(params);
      setTimesheets(data.timesheets || []);
    } catch (err) {
      console.error('Failed to load timesheets:', err);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [search, statusFilter]);

  const handleExportCSV = () => {
    const formattedData = timesheets.map(ts => ({
      'Timesheet ID': ts.id,
      'Employee ID': ts.employee_id,
      'Employee Name': ts.full_name,
      'Work Period': `${ts.start_date} to ${ts.end_date}`,
      'Total Hours': ts.total_hours,
      'Vendor Name': ts.vendor_name || 'Direct / Shineteck',
      'Status': ts.status,
      'Submitted At': ts.submitted_at ? new Date(ts.submitted_at).toLocaleDateString() : 'N/A',
      'Reviewed By': ts.reviewed_by || 'N/A'
    }));
    exportToCSV(formattedData, `Shineteck_Timesheets_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleReviewAction = async (newStatus) => {
    if (!reviewModalTs) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await api.reviewTimesheet(reviewModalTs.id, {
        status: newStatus,
        adminFeedback
      });
      setStatusMessage(`Timesheet #${reviewModalTs.id} updated to ${newStatus}.`);
      setReviewModalTs(null);
      setAdminFeedback('');
      await fetchTimesheets();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to review timesheet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = (id) => {
    const token = getAuthToken();
    window.open(getTimesheetDownloadUrl(id, token), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="enterprise-header-banner p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
              Organization Timesheet Approvals
            </h1>
            <p className="text-xs text-slate-600 mt-0.5 font-medium">
              Review work periods, verify CSV/Excel timesheet logs, and authorize payroll hours
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="enterprise-btn-secondary"
            title="Export all filtered timesheets to CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export Timesheets CSV</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 text-xs text-emerald-900 bg-emerald-100/80 border border-emerald-300 rounded-xl flex items-center gap-2 font-bold shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="enterprise-card p-4 bg-slate-100/90 border-slate-300">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Employee Name, ID, or Vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-bold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Needs Correction">Needs Correction</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timesheet List Table */}
      <div className="table-container shadow-sm">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Vendor</th>
              <th>Period</th>
              <th>Work Hours</th>
              <th>Attached Log</th>
              <th>Submitted At</th>
              <th>Feedback / Notes</th>
              <th>Status</th>
              <th className="text-right">Review Action</th>
            </tr>
          </thead>
          <tbody>
            {timesheets.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  No timesheets matching the selected filter.
                </td>
              </tr>
            ) : (
              timesheets.map((ts) => (
                <tr key={ts.id} className="hover:bg-blue-50/70 transition-colors">
                  <td>
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar
                        name={ts.employee_full_name || ts.employee_name || ts.employee_id}
                        size="md"
                        status={ts.status}
                      />
                      <div>
                        <span className="font-bold text-slate-900 block font-display">{ts.employee_full_name || ts.employee_name || ts.employee_id}</span>
                        <span className="font-mono text-[10.5px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 inline-block mt-0.5">{ts.employee_id}</span>
                      </div>
                    </div>
                  </td>
                    <td className="py-3.5 px-4">
                      {ts.vendor_name ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-md font-bold text-[11px]">
                          {ts.vendor_name}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Standard</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {ts.start_date} → {ts.end_date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {ts.total_hours} hrs
                    </td>
                    <td className="py-3.5 px-4">
                      {ts.file_name ? (
                        <button
                          type="button"
                          onClick={() => handleDownload(ts.id)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium truncate max-w-[140px]"
                          title="Download timesheet log"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{ts.file_name}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">Manual Entry</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(ts.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-[180px] truncate">
                      {ts.admin_feedback || ts.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={ts.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setReviewModalTs(ts);
                          setAdminFeedback(ts.admin_feedback || '');
                        }}
                        className="px-3 py-1 bg-[#0f2b48] hover:bg-[#1a416b] text-white text-xs font-semibold rounded shadow-xs transition-colors"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </div>

      {/* Timesheet Review Action Modal */}
      {reviewModalTs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Review Timesheet: {reviewModalTs.employee_full_name || reviewModalTs.employee_id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalTs(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">VENDOR / PLACEMENT</span>
                  <p className="font-bold text-blue-900 text-xs">
                    {reviewModalTs.vendor_name || 'Standard / Direct Placement'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">TOTAL WORK HOURS</span>
                  <p className="font-bold text-slate-900 text-sm">{reviewModalTs.total_hours} hrs</p>
                </div>
                <div className="col-span-2 pt-1 border-t border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">PERIOD RANGE</span>
                  <p className="font-semibold text-slate-900">{reviewModalTs.start_date} to {reviewModalTs.end_date}</p>
                </div>
                {reviewModalTs.file_name && (
                  <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-slate-600">Attached File: {reviewModalTs.file_name}</span>
                    <button
                      type="button"
                      onClick={() => handleDownload(reviewModalTs.id)}
                      className="text-blue-600 font-semibold underline flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Download
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reviewer Notes / Correction Reason (Visible to Employee)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., 'Approved for pay cycle 1.' or 'Please verify hours on Jan 14.'"
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-200">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleReviewAction('Needs Correction')}
                className="px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded transition-colors"
              >
                Request Correction
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReviewAction('Rejected')}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                >
                  Reject
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReviewAction('Approved')}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs transition-colors"
                >
                  Approve Timesheet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

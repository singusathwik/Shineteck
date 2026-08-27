import React, { useState, useEffect } from 'react';
import { api, getAuthToken, getTimesheetDownloadUrl } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { TimesheetUploadModal } from '../../components/timesheet/TimesheetUploadModal.jsx';
import { exportToCSV } from '../../utils/csvExport.js';
import { SkeletonTable } from '../../components/common/SkeletonLoader.jsx';
import {
  Clock,
  Upload,
  Download,
  Filter,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Search,
  Plus
} from 'lucide-react';

export function EmployeeTimesheets() {
  const [timesheets, setTimesheets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTimesheets = async () => {
    try {
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (startDateFilter) params.startDate = startDateFilter;
      if (endDateFilter) params.endDate = endDateFilter;

      const data = await api.getMyTimesheets(params);
      setTimesheets(data.timesheets || []);
    } catch (err) {
      console.error('Failed to load timesheets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [statusFilter, startDateFilter, endDateFilter]);

  const handleExportCSV = () => {
    const formattedData = timesheets.map(ts => ({
      'Timesheet ID': ts.id,
      'Work Period': `${ts.start_date} to ${ts.end_date}`,
      'Total Hours': ts.total_hours,
      'Vendor / Client': ts.vendor_name || 'Direct / Shineteck',
      'Status': ts.status,
      'Submitted Date': ts.submitted_at ? new Date(ts.submitted_at).toLocaleDateString() : 'N/A',
      'Admin Feedback': ts.admin_feedback || 'None'
    }));
    exportToCSV(formattedData, `My_Shineteck_Timesheets_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleDownload = (id) => {
    const token = getAuthToken();
    window.open(getTimesheetDownloadUrl(id, token), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header & Submit CTA */}
      <div className="enterprise-header-banner p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
              Work Timesheet Submissions
            </h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Submit periodic work hours, upload CSV/Excel activity sheets, and track HR payroll authorization
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCSV}
              className="enterprise-btn-secondary"
              title="Download my timesheets as CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="enterprise-btn-primary"
            >
              <Upload className="w-4 h-4" />
              <span>Submit New Timesheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="enterprise-card p-4 bg-slate-100/90 border-slate-300">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-bold flex items-center gap-1 font-display">
              <Filter className="w-3.5 h-3.5" /> Filter by:
            </span>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-600/12 shadow-2xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Needs Correction">Needs Correction</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              placeholder="From Date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-xl text-slate-700 font-medium text-xs shadow-2xs"
            />
            <span className="text-slate-400 font-medium">to</span>
            <input
              type="date"
              placeholder="To Date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-xl text-slate-700 font-medium text-xs shadow-2xs"
            />

            {(statusFilter !== 'ALL' || startDateFilter || endDateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
                className="text-xs text-blue-600 font-bold hover:underline ml-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Timesheets Table */}
      {isLoading ? (
        <SkeletonTable rows={4} cols={6} />
      ) : (
        <div className="table-container shadow-sm">
          <table className="enterprise-table">
          <thead>
            <tr>
              <th>Period Range</th>
              <th>Vendor Assignment</th>
              <th>Work Hours</th>
              <th>Attached File</th>
              <th>Submitted Date</th>
              <th>Reviewer Notes</th>
              <th className="text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {timesheets.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50 stroke-1" />
                  <p className="font-bold text-slate-700">No timesheets found matching the selected criteria.</p>
                </td>
              </tr>
            ) : (
              timesheets.map((ts) => (
                <tr key={ts.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="font-bold text-slate-900">
                    {ts.start_date} <span className="text-slate-400 font-normal">to</span> {ts.end_date}
                  </td>
                  <td>
                    {ts.vendor_name ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-md text-[11px] font-bold">
                        {ts.vendor_name}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Standard Direct</span>
                    )}
                  </td>
                  <td className="font-mono font-bold text-slate-900">
                    {ts.total_hours} hrs
                  </td>
                  <td>
                    {ts.file_name ? (
                      <button
                        type="button"
                        onClick={() => handleDownload(ts.id)}
                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-bold truncate max-w-[180px] cursor-pointer"
                        title="Download timesheet attachment"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{ts.file_name}</span>
                      </button>
                    ) : (
                      <span className="text-slate-400">Manual Entry</span>
                    )}
                  </td>
                  <td className="text-slate-500 font-mono text-[11px]">
                    {new Date(ts.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="text-slate-600 max-w-[200px] truncate text-xs">
                    {ts.admin_feedback || ts.notes || <span className="text-slate-400">—</span>}
                  </td>
                  <td className="text-right">
                    <StatusBadge status={ts.status} size="sm" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      )}

      <TimesheetUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTimesheets}
      />
    </div>
  );
}

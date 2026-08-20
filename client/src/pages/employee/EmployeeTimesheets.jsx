import React, { useState, useEffect } from 'react';
import { api, getAuthToken, getTimesheetDownloadUrl } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { TimesheetUploadModal } from '../../components/timesheet/TimesheetUploadModal.jsx';
import {
  Clock,
  Upload,
  Download,
  Filter,
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  Search
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

  const handleDownload = (id) => {
    const token = getAuthToken();
    window.open(getTimesheetDownloadUrl(id, token), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header & Submit CTA */}
      <div className="enterprise-card p-6 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Work Timesheets</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit periodic work hours, upload CSV/Excel activity sheets, and track manager approvals
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0f2b48] hover:bg-[#1a416b] text-white text-xs font-bold rounded shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Submit New Timesheet</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="enterprise-card p-4 bg-white border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter by:
            </span>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
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
              className="px-2 py-1 border border-slate-300 rounded text-slate-700"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              placeholder="To Date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="px-2 py-1 border border-slate-300 rounded text-slate-700"
            />

            {(statusFilter !== 'ALL' || startDateFilter || endDateFilter) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('ALL');
                  setStartDateFilter('');
                  setEndDateFilter('');
                }}
                className="text-xs text-blue-600 hover:underline ml-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Timesheets Table */}
      <div className="enterprise-card bg-white border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Period Range</th>
                <th className="py-3 px-4">Work Hours</th>
                <th className="py-3 px-4">Attached File</th>
                <th className="py-3 px-4">Submitted At</th>
                <th className="py-3 px-4">Reviewer Feedback</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timesheets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No timesheets found matching the selected criteria.
                  </td>
                </tr>
              ) : (
                timesheets.map((ts) => (
                  <tr key={ts.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {ts.start_date} <span className="text-slate-400 font-normal">to</span> {ts.end_date}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {ts.total_hours} hrs
                    </td>
                    <td className="py-3 px-4">
                      {ts.file_name ? (
                        <button
                          type="button"
                          onClick={() => handleDownload(ts.id)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium truncate max-w-[180px]"
                          title="Download timesheet attachment"
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{ts.file_name}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400">Manual Entry</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(ts.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">
                      {ts.admin_feedback || ts.notes || <span className="text-slate-400">—</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <StatusBadge status={ts.status} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TimesheetUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTimesheets}
      />
    </div>
  );
}

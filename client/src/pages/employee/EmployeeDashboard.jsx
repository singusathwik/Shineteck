import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { EmployeeAvatar } from '../../components/common/EmployeeAvatar.jsx';
import { TimesheetUploadModal } from '../../components/timesheet/TimesheetUploadModal.jsx';
import {
  Clock,
  FileText,
  DollarSign,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Upload,
  Eye,
  Building2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export function EmployeeDashboard({ onNavigateTab }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [profData, timeData, docData] = await Promise.all([
        api.getProfile(),
        api.getMyTimesheets(),
        api.getMyDocuments()
      ]);
      setProfile(profData.employee);
      setTimesheets(timeData.timesheets || []);
      setDocuments(docData.documents || []);
    } catch (err) {
      console.error('Failed to load employee dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const regStatus = profile?.registration_status || user?.registrationStatus || 'Pending Review';
  const pendingTimesheetCount = timesheets.filter(t => t.status === 'Pending').length;
  const approvedDocsCount = documents.filter(d => d.status === 'Approved').length;
  const needsReplacementDocs = documents.filter(d => d.status === 'Needs Replacement');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="enterprise-header-banner p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <EmployeeAvatar
              name={user?.fullName || 'Employee'}
              imageUrl={user?.profileImageUrl}
              size="lg"
              status={regStatus}
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                  Welcome back, {user?.fullName || 'Employee'}
                </h1>
                <StatusBadge status={regStatus} size="sm" />
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Employee ID: <span className="font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{user?.employeeId}</span> • {user?.designation || 'Staff Consultant'} • {profile?.country || 'Global'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsTimesheetModalOpen(true)}
              className="enterprise-btn-primary"
            >
              <Upload className="w-4 h-4" />
              <span>Submit Timesheet</span>
            </button>
          </div>
        </div>

        {/* Status Callout if Pending Review */}
        {regStatus === 'Pending Review' && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2.5 shadow-2xs font-medium">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold font-display">Onboarding Verification In Progress</p>
              <p className="text-[11px] text-amber-900 mt-0.5">
                Your profile and compliance documents have been received and are queued for review by Shineteck HR. You may submit work timesheets normally.
              </p>
            </div>
          </div>
        )}

        {/* Status Callout if Needs Correction */}
        {regStatus === 'Needs Correction' && (
          <div className="mt-4 p-3.5 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-950 flex items-start gap-2.5 shadow-2xs">
            <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold font-display">Action Required: Compliance Update Needed</p>
              <p className="text-[11px] text-orange-900 mt-0.5 font-medium">
                {profile?.admin_notes || 'Please check your documents tab to replace requested compliance documents.'}
              </p>
              <button
                type="button"
                onClick={() => onNavigateTab('documents')}
                className="mt-2 text-xs font-bold text-orange-950 underline cursor-pointer"
              >
                Go to Documents &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards with Eye-Friendly Tonal Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigateTab('timesheet')}
          className="enterprise-card p-4.5 bg-[#e3effa] border-[#b4d3f2] hover:border-[#6fa9e4] hover:-translate-y-0.5 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-[#0c3660] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0c3660] font-display">Timesheets</span>
            <div className="w-7 h-7 rounded-lg bg-[#0c3660] text-white flex items-center justify-center shadow-2xs">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0c3660] font-display">{timesheets.length}</div>
          <p className="text-[11px] text-[#0c3660] font-semibold mt-1">
            <strong className="text-blue-950 font-mono font-bold">{pendingTimesheetCount}</strong> pending authorization
          </p>
        </div>

        <div
          onClick={() => onNavigateTab('documents')}
          className="enterprise-card p-4.5 bg-[#f0eafb] border-[#cebcf7] hover:border-[#9f7ff0] hover:-translate-y-0.5 transition-all cursor-pointer shadow-2xs group"
        >
          <div className="flex items-center justify-between text-[#3b1778] mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3b1778] font-display">Documents</span>
            <div className="w-7 h-7 rounded-lg bg-[#6d28d9] text-white flex items-center justify-center shadow-2xs">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#2c105b] font-display">{documents.length}</div>
          <p className="text-[11px] text-[#3b1778] font-semibold mt-1">
            <strong className="text-emerald-700 font-mono font-bold">{approvedDocsCount}</strong> verified by HR
          </p>
        </div>

      </div>

      {/* Split Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Recent Timesheets */}
        <div className="enterprise-card p-5 sm:p-6 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                  Recent Work Periods
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('timesheet')}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                All Timesheets <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {timesheets.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50 stroke-1" />
                  <p className="font-medium">No timesheet submissions recorded yet.</p>
                </div>
              ) : (
                timesheets.slice(0, 4).map((ts) => (
                  <div
                    key={ts.id || ts._id}
                    className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 text-xs shadow-2xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">
                        {ts.start_date} &rarr; {ts.end_date}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                        <span className="font-bold font-mono text-slate-800">{ts.total_hours} Hours</span>
                        {ts.vendor_name ? ` • Vendor: ${ts.vendor_name}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={ts.status} size="sm" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3.5 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Need to report work hours?</span>
            <button
              type="button"
              onClick={() => setIsTimesheetModalOpen(true)}
              className="text-blue-600 font-bold hover:underline cursor-pointer"
            >
              + Submit New Timesheet
            </button>
          </div>
        </div>

      </div>

      {/* Timesheet Submission Modal */}
      {isTimesheetModalOpen && (
        <TimesheetUploadModal isOpen
          onClose={() => setIsTimesheetModalOpen(false)}
          onSuccess={() => {
            setIsTimesheetModalOpen(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

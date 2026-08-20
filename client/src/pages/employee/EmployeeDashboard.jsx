import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
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
  Eye
} from 'lucide-react';

export function EmployeeDashboard({ onNavigateTab }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      const [profData, timeData, docData, payData] = await Promise.all([
        api.getProfile(),
        api.getMyTimesheets(),
        api.getMyDocuments(),
        api.getMyPayroll()
      ]);
      setProfile(profData.employee);
      setTimesheets(timeData.timesheets || []);
      setDocuments(docData.documents || []);
      setPayroll(payData.payrollRecords || []);
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
      <div className="enterprise-card p-6 bg-white border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-900">
                Welcome, {user?.fullName || 'Employee'}
              </h1>
              <StatusBadge status={regStatus} size="sm" />
            </div>
            <p className="text-xs text-slate-500">
              Employee ID: <span className="font-mono font-semibold text-blue-700">{user?.employeeId}</span> • {user?.designation || 'Staff'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTimesheetModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0f2b48] hover:bg-[#1a416b] text-white text-xs font-semibold rounded shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Submit Timesheet</span>
            </button>
          </div>
        </div>

        {/* Status Callout if Pending Review or Needs Correction */}
        {regStatus === 'Pending Review' && (
          <div className="mt-5 p-3.5 bg-amber-50/70 border border-amber-200 rounded-md text-xs text-amber-900 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Onboarding Profile Under Review</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Your registration package is currently being verified by Shinetek HR. You may still submit timesheets and review your uploaded documents.
              </p>
            </div>
          </div>
        )}

        {regStatus === 'Needs Correction' && (
          <div className="mt-5 p-3.5 bg-orange-50 border border-orange-200 rounded-md text-xs text-orange-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">HR Review Action Required</p>
              <p className="text-[11px] text-orange-800 mt-0.5">
                {profile?.admin_notes || 'Some details or documents in your onboarding submission require correction. Please review the documents tab.'}
              </p>
              {needsReplacementDocs.length > 0 && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('documents')}
                  className="mt-2 text-xs font-bold text-orange-800 underline"
                >
                  View {needsReplacementDocs.length} Flagged Document(s) →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="enterprise-card p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">ONBOARDING STATUS</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mb-1">{regStatus}</div>
          <p className="text-[11px] text-slate-500">Shinetek HR Compliance</p>
        </div>

        <div className="enterprise-card p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">TIMESHEETS</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mb-1">{timesheets.length} Total</div>
          <p className="text-[11px] text-slate-500">{pendingTimesheetCount} awaiting manager approval</p>
        </div>

        <div className="enterprise-card p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">DOCUMENTS</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mb-1">{documents.length} Uploaded</div>
          <p className="text-[11px] text-slate-500">{approvedDocsCount} verified and approved</p>
        </div>

        <div className="enterprise-card p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">LATEST PAY STUB</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 mb-1">
            {payroll.length > 0 ? `$${payroll[0].net_pay.toLocaleString()}` : '$0.00'}
          </div>
          <p className="text-[11px] text-slate-500">
            {payroll.length > 0 ? `Period ending ${payroll[0].pay_period_end}` : 'No pay stubs issued yet'}
          </p>
        </div>
      </div>

      {/* Grid: Recent Timesheets & Documents Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Timesheets */}
        <div className="lg:col-span-7 enterprise-card p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Recent Work Timesheets</h3>
            <button
              type="button"
              onClick={() => onNavigateTab('timesheet')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {timesheets.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No timesheets submitted yet. Click "Submit Timesheet" to submit your hours.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {timesheets.slice(0, 4).map((ts) => (
                <div key={ts.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800">
                      {ts.start_date} → {ts.end_date}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {ts.total_hours} Work Hours • Submitted {new Date(ts.submitted_at).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge status={ts.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Required Document Status Checklist */}
        <div className="lg:col-span-5 enterprise-card p-5 bg-white border-slate-200">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Required Document Vault</h3>
            <button
              type="button"
              onClick={() => onNavigateTab('documents')}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {['w4', 'i9', 'passport', 'visa'].map((type) => {
              const doc = documents.find(d => d.document_type === type);
              const labelMap = {
                w4: 'Form W-4',
                i9: 'Form I-9',
                passport: 'Passport Copy',
                visa: 'Visa / Work Auth'
              };

              return (
                <div key={type} className="p-2.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <div>
                      <p className="font-semibold text-slate-800">{labelMap[type]}</p>
                      <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {doc ? doc.file_name : 'Pending upload'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={doc ? doc.status : 'Not Uploaded'} size="sm" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Timesheet Upload Modal */}
      <TimesheetUploadModal
        isOpen={isTimesheetModalOpen}
        onClose={() => setIsTimesheetModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}

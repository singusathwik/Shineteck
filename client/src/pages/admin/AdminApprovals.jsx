import React, { useState, useEffect } from 'react';
import { api, getAuthToken, getDocumentStreamUrl } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { EmployeeAvatar } from '../../components/common/EmployeeAvatar.jsx';
import { DocumentViewerModal } from '../../components/admin/DocumentViewerModal.jsx';
import {
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  Download,
  FileText,
  User,
  MapPin,
  Calendar,
  Mail,
  Phone,
  ShieldCheck,
  X,
  Briefcase,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';

export function AdminApprovals({ onSelectEmployee }) {
  const [employees, setEmployees] = useState([]);
  const [activeStatusTab, setActiveStatusTab] = useState('Pending Review'); // 'Pending Review' | 'Needs Correction' | 'Approved' | 'Rejected' | 'ALL'
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Detailed selected employee for quick inspection drawer/modal
  const [inspectingEmployee, setInspectingEmployee] = useState(null);
  const [inspectingDetails, setInspectingDetails] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Decision Modals
  const [decisionAction, setDecisionAction] = useState(null); // 'Approve' | 'Correction' | 'Reject'
  const [actionEmployee, setActionEmployee] = useState(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [isProcessingDecision, setIsProcessingDecision] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Document preview modal
  const [selectedDocForReview, setSelectedDocForReview] = useState(null);

  const token = getAuthToken();

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (activeStatusTab !== 'ALL') params.status = activeStatusTab;
      params.sortBy = 'submitted_at';
      params.sortOrder = 'DESC';

      const data = await api.getAllEmployees(params);
      setEmployees(data.employees || []);
    } catch (err) {
      console.error('Failed to load employee approvals queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [activeStatusTab, search]);

  const loadEmployeeQuickInspect = async (emp) => {
    setInspectingEmployee(emp);
    setIsLoadingDetail(true);
    try {
      const res = await api.getEmployeeDetail(emp.employee_id);
      setInspectingDetails(res);
    } catch (err) {
      console.error('Failed to load employee details for inspect:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const openDecisionModal = (emp, action) => {
    setActionEmployee(emp);
    setDecisionAction(action);
    if (action === 'Approve') {
      setAdminNoteInput('All identity details and compliance verification documents verified & approved.');
    } else if (action === 'Correction') {
      setAdminNoteInput('Please re-upload document with clear signature and required details.');
    } else {
      setAdminNoteInput('Application does not meet onboarding compliance requirements.');
    }
  };

  const handleExecuteDecision = async () => {
    if (!actionEmployee || !decisionAction) return;
    setIsProcessingDecision(true);
    setActionFeedback(null);

    let status = 'Approved';
    if (decisionAction === 'Correction') status = 'Needs Correction';
    if (decisionAction === 'Reject') status = 'Rejected';

    try {
      await api.reviewEmployeeStatus(actionEmployee.employee_id, {
        status,
        adminNotes: adminNoteInput
      });

      setActionFeedback({
        type: status === 'Approved' ? 'success' : (status === 'Needs Correction' ? 'warning' : 'error'),
        message: `Application for ${actionEmployee.full_name} (${actionEmployee.employee_id}) has been marked as: ${status}.`
      });

      setDecisionAction(null);
      setActionEmployee(null);
      if (inspectingEmployee?.employee_id === actionEmployee.employee_id) {
        setInspectingEmployee(null);
        setInspectingDetails(null);
      }
      await fetchEmployees();
    } catch (err) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'Failed to update application status.'
      });
    } finally {
      setIsProcessingDecision(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="enterprise-header-banner p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center border border-blue-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">Employee Onboarding Approvals & Decision Center</h1>
                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                  Inspect submitted personal records and uploaded compliance documents to Accept, Request Correction, or Reject applications
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1.5 bg-amber-100 text-amber-950 border border-amber-300 rounded-xl flex items-center gap-1.5 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              Active Review Filter: <strong>{activeStatusTab}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Action Feedback Banner ────────────────────────────────────── */}
      {actionFeedback && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between gap-2 shadow-2xs ${
          actionFeedback.type === 'success'
            ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300 font-bold'
            : (actionFeedback.type === 'warning'
              ? 'bg-amber-100/80 text-amber-950 border border-amber-300 font-bold'
              : 'bg-rose-100/80 text-rose-950 border border-rose-300 font-bold')
        }`}>
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />}
            {actionFeedback.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />}
            {actionFeedback.type === 'error' && <UserX className="w-4 h-4 text-rose-700 shrink-0" />}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Status Tab Navigation (Rich Segmented Bar) ───────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/90 rounded-2xl border border-slate-300 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveStatusTab('Pending Review')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeStatusTab === 'Pending Review'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-300/70'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-950"></span>
          <span>Pending HR Review</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusTab('Needs Correction')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeStatusTab === 'Needs Correction'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-300/70'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-white"></span>
          <span>Needs Correction</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusTab('Approved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeStatusTab === 'Approved'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-300/70'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-200"></span>
          <span>Approved Applications</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusTab('Rejected')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeStatusTab === 'Rejected'
              ? 'bg-rose-700 text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-300/70'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-200"></span>
          <span>Rejected Applications</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveStatusTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeStatusTab === 'ALL'
              ? 'bg-[#0f2b48] text-white shadow-sm'
              : 'text-slate-700 hover:text-slate-950 hover:bg-slate-300/70'
          }`}
        >
          <span>All Records</span>
        </button>
      </div>

      {/* ── Search Bar ─────────────────────────────────────────────── */}
      <div className="enterprise-card p-4 bg-slate-100/90 border-slate-300 flex items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by applicant name, Employee ID, email, or designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <span className="text-slate-600 font-bold">
          Showing <strong className="text-slate-900 font-mono">{employees.length}</strong> applicant(s)
        </span>
      </div>

      {/* ── Applications List / Review Cards ───────────────────────── */}
      {isLoading ? (
        <div className="enterprise-card p-12 text-center text-xs text-slate-400">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p>Loading application queue...</p>
        </div>
      ) : employees.length === 0 ? (
        <div className="enterprise-card p-12 text-center text-slate-400 bg-white border-slate-200">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No applications in this queue</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            There are currently no employee registration records matching the "{activeStatusTab}" status.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {employees.map((emp) => {
            const statusBorder =
              emp.registration_status === 'Approved'
                ? 'border-l-4 border-l-emerald-500'
                : emp.registration_status === 'Needs Correction'
                ? 'border-l-4 border-l-orange-500'
                : emp.registration_status === 'Rejected'
                ? 'border-l-4 border-l-rose-500'
                : 'border-l-4 border-l-amber-500';

            return (
              <div
                key={emp.employee_id}
                className={`enterprise-card p-5 bg-white border-slate-300 hover:border-slate-400 transition-all shadow-xs ${statusBorder} overflow-hidden`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Applicant identity summary */}
                  <div className="flex items-start gap-3.5">
                    <EmployeeAvatar
                      name={emp.full_name}
                      imageUrl={emp.profile_image_url}
                      size="lg"
                      status={emp.registration_status}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 font-display">{emp.full_name}</h3>
                        <StatusBadge status={emp.registration_status} size="sm" />
                        <span className="text-[11px] font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {emp.employee_id}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1 font-medium">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          {emp.designation}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[11.5px]">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {emp.email}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[11.5px]">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {emp.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {emp.city ? `${emp.city}, ${emp.state}` : emp.country}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Action Buttons for Decision */}
                  <div className="flex flex-wrap items-center gap-2 self-end lg:self-center">
                    <button
                      type="button"
                      onClick={() => loadEmployeeQuickInspect(emp)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs border border-slate-300 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Quick Inspect Docs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openDecisionModal(emp, 'Correction')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-lg text-xs border border-amber-300 transition-colors cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Request Correction</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openDecisionModal(emp, 'Reject')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold rounded-lg text-xs border border-rose-300 transition-colors cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5 text-rose-600" />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openDecisionModal(emp, 'Approve')}
                      className="inline-flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accept & Approve</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectEmployee(emp.employee_id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#0f2b48] hover:bg-[#1a416b] text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer"
                      title="Open full employee profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Shaded Footer Info Bar */}
                <div className="flex items-center justify-between pt-2.5 mt-3.5 border-t border-slate-200 text-[11px] text-slate-500 font-medium bg-slate-50/70 -mx-5 -mb-5 px-5 py-2.5">
                  <span className="font-mono">Submitted: {new Date(emp.submitted_at || emp.created_at).toLocaleString()}</span>
                  <span>
                    Documents: <strong className="text-slate-900 font-bold">{emp.total_docs || 0} uploaded</strong> ({emp.approved_docs || 0} approved)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick Inspect Modal ────────────────────────────────────────── */}
      {inspectingEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Application Review: {inspectingEmployee.full_name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    ID: {inspectingEmployee.employee_id} • Status: {inspectingEmployee.registration_status}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInspectingEmployee(null);
                  setInspectingDetails(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {isLoadingDetail ? (
                <div className="p-8 text-center text-slate-400">Loading applicant records...</div>
              ) : inspectingDetails ? (
                <>
                  {/* Identity Grid */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] border-b border-slate-200 pb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" /> Personal Identity Records
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">Last Name</span>
                        <p className="font-semibold text-slate-900">{inspectingDetails.employee.last_name || '—'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">First Name</span>
                        <p className="font-semibold text-slate-900">{inspectingDetails.employee.first_name || '—'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">Middle Initial</span>
                        <p className="font-semibold text-slate-900">{inspectingDetails.employee.middle_initial || 'None'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">Date of Birth</span>
                        <p className="font-semibold text-slate-900">{inspectingDetails.employee.date_of_birth}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">Corporate Email</span>
                        <p className="font-semibold text-slate-900">{inspectingDetails.employee.email}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">Phone</span>
                        <p className="font-semibold text-slate-900">{inspectingDetails.employee.phone}</p>
                      </div>
                      <div className="sm:col-span-3">
                        <span className="text-slate-400 text-[10px] uppercase font-semibold block">Residential Address</span>
                        <p className="font-semibold text-slate-900">
                          {inspectingDetails.employee.address}, {inspectingDetails.employee.city}, {inspectingDetails.employee.state} {inspectingDetails.employee.zip_code}, {inspectingDetails.employee.country}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Documents Grid */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" /> Uploaded Compliance Verification Documents
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {inspectingDetails.documents?.length === 0 ? (
                        <p className="text-slate-400 col-span-2 py-3 text-center">No documents uploaded.</p>
                      ) : (
                        inspectingDetails.documents.map((doc) => (
                          <div key={doc.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <span className="font-bold text-slate-900 uppercase block">{doc.document_type}</span>
                                <span className="text-[11px] text-slate-500 truncate max-w-[180px] block">{doc.file_name}</span>
                              </div>
                              <StatusBadge status={doc.status} size="sm" />
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px]">
                              <a
                                href={getDocumentStreamUrl(doc.id, token)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold"
                              >
                                <Download className="w-3 h-3" />
                                Stream File
                              </a>
                              <button
                                type="button"
                                onClick={() => setSelectedDocForReview(doc)}
                                className="px-2 py-0.5 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 text-[11px]"
                              >
                                Review Doc
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Quick Inspect Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => onSelectEmployee(inspectingEmployee.employee_id)}
                className="text-xs font-semibold text-blue-700 hover:underline inline-flex items-center gap-1"
              >
                <span>Open Full Detailed Dossier</span>
                <ArrowRight className="w-3 h-3" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openDecisionModal(inspectingEmployee, 'Correction')}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-lg text-xs border border-amber-200 transition-colors"
                >
                  Request Correction
                </button>
                <button
                  type="button"
                  onClick={() => openDecisionModal(inspectingEmployee, 'Reject')}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold rounded-lg text-xs border border-rose-200 transition-colors"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => openDecisionModal(inspectingEmployee, 'Approve')}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors"
                >
                  Accept & Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Decision Confirmation Modal ───────────────────────────────── */}
      {decisionAction && actionEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  decisionAction === 'Approve' ? 'bg-emerald-50 text-emerald-600' :
                  (decisionAction === 'Correction' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600')
                }`}>
                  {decisionAction === 'Approve' && <CheckCircle2 className="w-5 h-5" />}
                  {decisionAction === 'Correction' && <AlertTriangle className="w-5 h-5" />}
                  {decisionAction === 'Reject' && <UserX className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {decisionAction === 'Approve' && 'Accept & Approve Onboarding'}
                    {decisionAction === 'Correction' && 'Request Application Correction'}
                    {decisionAction === 'Reject' && 'Reject Onboarding Application'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {actionEmployee.full_name} ({actionEmployee.employee_id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDecisionAction(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600">
                {decisionAction === 'Approve' &&
                  'This will approve the employee application, activate portal login access, and dispatch an official approval notification.'}
                {decisionAction === 'Correction' &&
                  'This will request correction from the applicant and notify them to re-upload required forms.'}
                {decisionAction === 'Reject' &&
                  'This will reject the employee onboarding registration and notify the applicant.'}
              </p>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  HR Admin Notes / Reason
                </label>
                <textarea
                  rows={3}
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  placeholder="Enter HR notes or instructions for the employee..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDecisionAction(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingDecision}
                onClick={handleExecuteDecision}
                className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-xs transition-colors ${
                  decisionAction === 'Approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : (decisionAction === 'Correction'
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-rose-600 hover:bg-rose-700')
                } disabled:opacity-50`}
              >
                {isProcessingDecision ? 'Processing...' : `Confirm ${decisionAction}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Document Viewer Modal ─────────────────────────────────────── */}
      {selectedDocForReview && (
        <DocumentViewerModal
          doc={selectedDocForReview}
          isOpen={!!selectedDocForReview}
          onClose={() => setSelectedDocForReview(null)}
          onReviewed={() => {
            if (inspectingEmployee) {
              loadEmployeeQuickInspect(inspectingEmployee);
            }
            fetchEmployees();
          }}
        />
      )}
    </div>
  );
}

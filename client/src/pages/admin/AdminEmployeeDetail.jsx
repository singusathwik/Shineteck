import React, { useState, useEffect } from 'react';
import { api, getAuthToken, getDocumentStreamUrl } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { DocumentViewerModal } from '../../components/admin/DocumentViewerModal.jsx';
import {
  ArrowLeft,
  User,
  MapPin,
  FileText,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Download,
  Calendar,
  Lock,
  UserCheck,
  UserX,
  Edit2,
  X,
  Briefcase
} from 'lucide-react';

export function AdminEmployeeDetail({ employeeId, onBack }) {
  const [data, setData] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);
  const [selectedDocForReview, setSelectedDocForReview] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Status Toggle Modal state
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
  const [modalTargetStatus, setModalTargetStatus] = useState('Active');
  const [modalStartDate, setModalStartDate] = useState('');
  const [modalEndDate, setModalEndDate] = useState('');
  const [modalReason, setModalReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await api.getEmployeeDetail(employeeId);
      setData(res);
      setAdminNotes(res.employee.admin_notes || '');
      setModalStartDate(res.employee.start_date || new Date().toISOString().split('T')[0]);
      setModalEndDate(res.employee.end_date || '');
    } catch (err) {
      console.error('Failed to load employee details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [employeeId]);

  const handleUpdateStatus = async (newStatus) => {
    setIsSubmittingStatus(true);
    setErrorMsg(null);
    setStatusMessage(null);

    try {
      await api.reviewEmployeeStatus(employeeId, {
        status: newStatus,
        adminNotes
      });
      setStatusMessage(`Employee onboarding status set to ${newStatus}.`);
      await fetchDetail();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update employee status.');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  const openStatusModal = (targetStatus) => {
    setModalTargetStatus(targetStatus);
    setModalStartDate(data?.employee?.start_date || new Date().toISOString().split('T')[0]);
    if (targetStatus === 'Inactive') {
      setModalEndDate(data?.employee?.end_date || new Date().toISOString().split('T')[0]);
    } else {
      setModalEndDate('');
    }
    setModalReason('');
    setIsToggleModalOpen(true);
  };

  const handleConfirmToggleEmployment = async () => {
    setIsUpdatingStatus(true);
    setErrorMsg(null);
    setStatusMessage(null);

    try {
      await api.toggleEmploymentStatus(employeeId, {
        employmentStatus: modalTargetStatus,
        startDate: modalStartDate,
        endDate: modalEndDate || null,
        reason: modalReason
      });

      setStatusMessage(`Employee employment status updated to ${modalTargetStatus}.`);
      setIsToggleModalOpen(false);
      await fetchDetail();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update employment status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (!data || !data.employee) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading employee details...</div>;
  }

  const { employee, documents = [], timesheets = [], payroll = [], auditHistory = [] } = data;
  const token = getAuthToken();
  const isActive = employee.employment_status === 'Active' || employee.is_still_working;

  return (
    <div className="space-y-6">
      {/* Back Button & Top Action Banner */}
      <div className="enterprise-card p-6 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{employee.full_name}</h1>
                <StatusBadge status={employee.registration_status} size="sm" />
                {isActive ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                    Currently Working (Active)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-rose-800 bg-rose-100/90 border border-rose-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    Inactive / Left Company
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Employee ID: <span className="font-mono font-bold text-blue-700">{employee.employee_id}</span> • {employee.designation}
              </p>
            </div>
          </div>

          {/* Quick Decision Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmittingStatus}
              onClick={() => handleUpdateStatus('Needs Correction')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded transition-colors disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Request Correction
            </button>
            <button
              type="button"
              disabled={isSubmittingStatus}
              onClick={() => handleUpdateStatus('Rejected')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject Registration
            </button>
            <button
              type="button"
              disabled={isSubmittingStatus}
              onClick={() => handleUpdateStatus('Approved')}
              className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-xs transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve Onboarding
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* ── Employment Status & Lifecycle Card ────────────────────────────── */}
      <div className="enterprise-card p-6 bg-white border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Employment Lifecycle & Working Status
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {isActive ? (
              <button
                type="button"
                onClick={() => openStatusModal('Inactive')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Mark as Inactive / Left Company</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openStatusModal('Active')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Reactivate Employment</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Working Status</span>
            <div className="mt-1 flex items-center gap-2">
              {isActive ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Currently Working (Active)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-bold text-rose-800">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Inactive / Ended
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {isActive ? 'Employee is active and authorized for timesheets and payroll.' : 'Employee is deactivated; login and timesheet submissions are disabled.'}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Employment Start Date</span>
            <p className="text-sm font-bold text-slate-900 font-mono mt-1">
              {employee.start_date || <span className="text-slate-400 font-normal italic">Not recorded</span>}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Official hire / onboarding start date</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Employment End Date</span>
            <div className="mt-1">
              {employee.end_date ? (
                <p className="text-sm font-bold text-rose-700 font-mono">{employee.end_date}</p>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                  Present / Active Ongoing
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {employee.end_date ? 'Termination / resignation effective date' : 'Employee is currently employed with no end date'}
            </p>
          </div>
        </div>
      </div>

      {/* Admin Notes Box */}
      <div className="enterprise-card p-4 bg-slate-50 border-slate-200 space-y-2">
        <label className="block text-xs font-semibold text-slate-700">
          Admin Onboarding Notes & Feedback for Employee
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g., 'All I-9 verification documents inspected and confirmed.'"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
          />
          <button
            type="button"
            onClick={() => handleUpdateStatus(employee.registration_status)}
            className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded hover:bg-slate-700"
          >
            Update Notes
          </button>
        </div>
      </div>

      {/* Grid: Personal Info, Photo, Address */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card & Avatar */}
        <div className="lg:col-span-4 enterprise-card p-6 bg-white border-slate-200 flex flex-col items-center text-center space-y-3">
          <div className="w-28 h-28 rounded-full border-2 border-blue-600 overflow-hidden bg-slate-100 shadow-inner">
            {employee.profile_image_url ? (
              <img src={employee.profile_image_url} alt={employee.full_name} className="w-full h-full object-cover" />
            ) : (
              <User className="w-12 h-12 text-slate-400 m-auto mt-8" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">{employee.full_name}</h3>
            <p className="text-xs text-slate-500">{employee.designation}</p>
            <p className="font-mono text-xs text-blue-700 font-semibold">{employee.employee_id}</p>
          </div>
          <div className="w-full pt-3 border-t border-slate-100 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Account Status:</span>
              <span className="font-semibold text-slate-800">{employee.user_account_status || 'Active'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Submitted:</span>
              <span className="text-slate-700">{new Date(employee.submitted_at || employee.created_at).toLocaleDateString()}</span>
            </div>
            {employee.reviewed_by && (
              <div className="flex justify-between">
                <span className="text-slate-400">Reviewed By:</span>
                <span className="text-slate-700 truncate max-w-[140px]">{employee.reviewed_by}</span>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Identity, Emergency & Address Record */}
        <div className="lg:col-span-8 space-y-6">
          <div className="enterprise-card p-6 bg-white border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Employee Personal & Legal Identity Record
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Legal Last Name</span>
                <p className="font-medium text-slate-900 mt-0.5">{employee.last_name || employee.full_name?.split(' ').pop() || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Legal First Name</span>
                <p className="font-medium text-slate-900 mt-0.5">{employee.first_name || employee.full_name?.split(' ')[0] || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Middle Initial / Name</span>
                <p className="font-medium text-slate-900 mt-0.5">{employee.middle_initial || <span className="text-slate-400 italic">None</span>}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Full Legal Name on Record</span>
                <p className="font-bold text-slate-900 mt-0.5">{employee.full_name}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Gender</span>
                <p className="font-semibold text-slate-900 mt-0.5">{employee.gender || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Date of Birth (Month/Date/Year)</span>
                <p className="font-mono font-medium text-slate-900 mt-0.5">{employee.date_of_birth || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Corporate Email</span>
                <p className="font-medium text-slate-900 mt-0.5">{employee.email}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Contact Phone</span>
                <p className="font-medium text-slate-900 mt-0.5">{employee.phone}</p>
              </div>
            </div>
          </div>

          {/* Emergency Contact Information */}
          <div className="enterprise-card p-6 bg-white border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Emergency Contact Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Emergency Contact Name</span>
                <p className="font-bold text-slate-900 mt-0.5">
                  {[employee.emergency_first_name, employee.emergency_last_name].filter(Boolean).join(' ') || <span className="text-slate-400 italic">Not provided</span>}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Relationship</span>
                <p className="font-medium text-slate-900 mt-0.5">{employee.emergency_relationship || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Emergency Phone</span>
                <p className="font-mono font-medium text-slate-900 mt-0.5">{employee.emergency_phone || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Emergency Email</span>
                <p className="font-medium text-slate-900 mt-0.5">{employee.emergency_email || <span className="text-slate-400 italic">None</span>}</p>
              </div>
            </div>
          </div>

          {/* Structured Address */}
          <div className="enterprise-card p-6 bg-white border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Location & Residential Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Country</span>
                <p className="font-bold text-slate-900 mt-0.5">{employee.country || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">State / Province</span>
                <p className="font-medium text-slate-900 mt-0.5">{employee.state || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">City</span>
                <p className="font-medium text-slate-900 mt-0.5">{employee.city || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">ZIP / Postal Code</span>
                <p className="font-mono font-bold text-slate-900 mt-0.5">{employee.zip_code || '—'}</p>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Street Address & Suite / Apt</span>
                <p className="font-medium text-slate-900 mt-0.5">
                  {[employee.address_line_1, employee.address_line_2, employee.suite_apt].filter(Boolean).join(', ') || employee.address || '—'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Review Hub */}
      <div className="enterprise-card p-6 bg-white border-slate-200 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Onboarding Documents Verification
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {documents.filter(d => d.status === 'Approved').length} of {documents.length} Approved
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 col-span-2 text-center">No documents uploaded for this employee.</p>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 text-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-900 block">{doc.document_type?.toUpperCase()}</span>
                    <span className="text-[11px] text-slate-500 truncate max-w-[200px] block">{doc.file_name}</span>
                  </div>
                  <StatusBadge status={doc.status} size="sm" />
                </div>

                {doc.review_notes && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                    <strong>Note: </strong>{doc.review_notes}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px]">
                  <span className="text-slate-400">
                    Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={getDocumentStreamUrl(doc.id, token)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-700 font-semibold"
                    >
                      <Download className="w-3 h-3" />
                      Stream File
                    </a>
                    <button
                      type="button"
                      onClick={() => setSelectedDocForReview(doc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      Review & Decide
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Document Review Modal */}
      {selectedDocForReview && (
        <DocumentViewerModal
          doc={selectedDocForReview}
          isOpen={!!selectedDocForReview}
          onClose={() => setSelectedDocForReview(null)}
          onReviewed={fetchDetail}
        />
      )}

      {/* Employment Status Toggle Modal */}
      {isToggleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  modalTargetStatus === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {modalTargetStatus === 'Active' ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {modalTargetStatus === 'Active' ? 'Activate Employment' : 'Deactivate Employment'}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    {employee.full_name} ({employee.employee_id})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsToggleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-700">
                  You are setting employment status to{' '}
                  <strong className={modalTargetStatus === 'Active' ? 'text-emerald-700' : 'text-rose-700'}>
                    {modalTargetStatus.toUpperCase()}
                  </strong>
                  . {modalTargetStatus === 'Inactive'
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
                  Employment End Date {modalTargetStatus === 'Active' ? '(Leave empty if currently working)' : '(Required for inactive)'}
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
                  placeholder="e.g. Resigned, Contract Completed, Rehired"
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsToggleModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUpdatingStatus}
                onClick={handleConfirmToggleEmployment}
                className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-xs transition-colors ${
                  modalTargetStatus === 'Active'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                } disabled:opacity-50`}
              >
                {isUpdatingStatus ? 'Updating...' : `Confirm Set ${modalTargetStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

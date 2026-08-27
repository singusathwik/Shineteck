import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { EmployeeAvatar } from '../../components/common/EmployeeAvatar.jsx';
import { AddressForm } from '../../components/registration/AddressForm.jsx';
import { ShineteckLogo } from '../../components/common/ShineteckLogo.jsx';
import {
  User,
  MapPin,
  Lock,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  Save,
  Printer,
  QrCode,
  Sparkles,
  Zap
} from 'lucide-react';

export function EmployeeProfile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phone, setPhone] = useState('');
  const [addressData, setAddressData] = useState({
    country: '',
    state: '',
    city: '',
    zipCode: '',
    address: ''
  });
  const [errors, setErrors] = useState({});
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showRequestChangeModal, setShowRequestChangeModal] = useState(false);
  const [showBadgePrintModal, setShowBadgePrintModal] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data.employee);
      setPhone(data.employee.phone || '');
      setAddressData({
        country: data.employee.country || 'United States',
        state: data.employee.state || '',
        city: data.employee.city || '',
        zipCode: data.employee.zip_code || '',
        address: data.employee.address || ''
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveContactAndAddress = async () => {
    setErrors({});
    setSaveSuccess(null);
    setIsSaving(true);

    try {
      await api.updateProfile({
        phone,
        country: addressData.country,
        state: addressData.state,
        city: addressData.city,
        zipCode: addressData.zipCode,
        address: addressData.address
      });
      setSaveSuccess('Contact and address information updated successfully.');
      setIsEditingAddress(false);
      setIsEditingPhone(false);
      await fetchProfile();
      if (refreshUser) refreshUser();
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrintBadge = () => {
    window.print();
  };

  if (!profile) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading employee profile...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <div className="enterprise-header-banner p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <EmployeeAvatar
              name={profile.full_name}
              imageUrl={profile.profile_image_url}
              size="xl"
              status={profile.registration_status}
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">{profile.full_name}</h1>
                <StatusBadge status={profile.registration_status} size="sm" />
              </div>
              <p className="text-xs text-slate-600 font-semibold">{profile.designation}</p>
              <p className="text-xs font-mono text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-bold mt-1 inline-block">ID: {profile.employee_id}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowBadgePrintModal(true)}
              className="enterprise-btn-primary"
            >
              <Printer className="w-4 h-4" />
              <span>Digital Corporate ID Badge</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRequestChangeModal(true)}
              className="enterprise-btn-secondary"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Request HR Data Change</span>
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errors.submit && (
        <div className="flex items-center gap-2 p-3 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl shadow-2xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errors.submit}</span>
        </div>
      )}

      {/* Grid: Non-Editable Identity Credentials & Editable Contact/Address */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Locked Identity Fields */}
        <div className="lg:col-span-6 enterprise-card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                Official Identity Record
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 font-medium">
              <Lock className="w-3 h-3 text-slate-400" /> HR Verified & Locked
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">EMPLOYEE IDENTIFIER</span>
              <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-mono font-bold text-blue-700">
                {profile.employee_id}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">LAST NAME</span>
                <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-semibold text-slate-800">
                  {profile.last_name || profile.full_name?.split(' ').pop() || '—'}
                </div>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">FIRST NAME</span>
                <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-semibold text-slate-800">
                  {profile.first_name || profile.full_name?.split(' ')[0] || '—'}
                </div>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">MIDDLE INITIAL</span>
                <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-semibold text-slate-800">
                  {profile.middle_initial || <span className="text-slate-400 italic">None</span>}
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">FULL LEGAL NAME ON RECORD</span>
              <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-bold text-slate-900">
                {profile.full_name}
              </div>
            </div>

            <div>
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">OFFICIAL WORK EMAIL</span>
              <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-slate-800 font-mono">
                {profile.email}
              </div>
            </div>

            <div>
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">CORPORATE DESIGNATION</span>
              <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-slate-800 font-semibold">
                {profile.designation}
              </div>
            </div>

            <div>
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">DATE OF BIRTH</span>
              <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-slate-800 font-mono">
                {profile.date_of_birth}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">START DATE</span>
                <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-mono font-bold text-slate-800">
                  {profile.start_date || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">WORKING STATUS</span>
                <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-slate-800 flex items-center justify-between">
                  {profile.end_date ? (
                    <span className="font-mono text-rose-700 font-semibold">{profile.end_date}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-status-pulse"></span>
                      Currently Working (Active)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Contact & Residential Address */}
        <div className="lg:col-span-6 enterprise-card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                Contact & Address Information
              </h3>
            </div>
            {!isEditingAddress ? (
              <button
                type="button"
                onClick={() => setIsEditingAddress(true)}
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Details
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingAddress(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider font-display text-[10.5px]">Primary Contact Phone</label>
              {isEditingAddress ? (
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2831"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/12 focus:border-blue-600 shadow-2xs"
                />
              ) : (
                <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-medium text-slate-800">
                  {profile.phone || <span className="text-slate-400 italic">No phone number recorded</span>}
                </div>
              )}
            </div>

            {isEditingAddress ? (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <AddressForm
                  values={addressData}
                  onChange={(f, val) => setAddressData(prev => ({ ...prev, [f]: val }))}
                  errors={errors}
                  setErrors={setErrors}
                />

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveContactAndAddress}
                    className="enterprise-btn-primary"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving Changes...' : 'Save Updated Address'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">COUNTRY</span>
                    <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-medium text-slate-800">{profile.country || '—'}</div>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">STATE / PROVINCE</span>
                    <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-medium text-slate-800">{profile.state || '—'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">CITY</span>
                    <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-medium text-slate-800">{profile.city || '—'}</div>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">ZIP / POSTAL CODE</span>
                    <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-mono font-medium text-slate-800">{profile.zip_code || '—'}</div>
                  </div>
                </div>

                <div>
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">STREET ADDRESS</span>
                  <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-medium text-slate-800">{profile.address || '—'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Digital Corporate ID Badge Modal (Printable) ────────────── */}
      {showBadgePrintModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150">
            {/* Holographic Badge Card container */}
            <div id="printable-id-badge" className="relative rounded-2xl overflow-hidden bg-linear-to-b from-[#0f2b48] via-[#0a192f] to-[#050d18] text-white p-6 shadow-xl border border-white/20 space-y-5 text-center">
              {/* Top Shimmer Bar */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <ShineteckLogo size="sm" textColor="white" />
                <span className="text-[9.5px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider font-mono">
                  Verified
                </span>
              </div>

              {/* Photo & Identity */}
              <div className="flex flex-col items-center">
                <EmployeeAvatar
                  name={profile.full_name}
                  imageUrl={profile.profile_image_url}
                  size="xl"
                  className="mb-3 ring-2 ring-blue-400"
                />
                <h3 className="text-base font-black tracking-tight text-white font-display leading-tight">{profile.full_name}</h3>
                <p className="text-[11px] text-blue-300 font-medium mt-0.5">{profile.designation}</p>
                <div className="mt-2 px-3 py-1 bg-white/10 rounded-lg border border-white/15">
                  <span className="font-mono text-xs font-bold text-amber-300 tracking-wider">{profile.employee_id}</span>
                </div>
              </div>

              {/* Clearance Details */}
              <div className="grid grid-cols-2 gap-2 text-left text-[10.5px] pt-3 border-t border-white/10 bg-white/5 p-2.5 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Issue Date</span>
                  <span className="font-mono font-medium text-slate-200">{profile.start_date || '2026-01-01'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Location</span>
                  <span className="font-medium text-slate-200 truncate block">{profile.country || 'Global'}</span>
                </div>
              </div>

              {/* Barcode & Security Chip */}
              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <QrCode className="w-5 h-5 text-blue-400" />
                  <span>SEC-ID-{profile.employee_id}</span>
                </div>
                <span>SOC2 Compliant</span>
              </div>
            </div>

            {/* Print and Close Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handlePrintBadge}
                className="flex-1 enterprise-btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print ID Badge Pass</span>
              </button>
              <button
                type="button"
                onClick={() => setShowBadgePrintModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Data Change Request Modal */}
      {showRequestChangeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold font-display">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Request HR Record Change</span>
              </div>
              <button type="button" onClick={() => setShowRequestChangeModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Legal Name, Date of Birth, and Assigned Employee Identifiers are compliance-locked per Shineteck Inc. and IRS/USCIS employment regulations.
            </p>
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
              <p className="font-bold">Contact Corporate HR Support:</p>
              <p>Email: <a href="mailto:hr@shinetek.com" className="font-bold underline text-blue-700">hr@shinetek.com</a></p>
              <p>Direct HR Line: <strong className="font-mono text-slate-800">+1 (555) 019-2831</strong></p>
            </div>
            <button
              type="button"
              onClick={() => setShowRequestChangeModal(false)}
              className="w-full enterprise-btn-primary py-2.5"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

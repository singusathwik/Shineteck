import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { AddressForm } from '../../components/registration/AddressForm.jsx';
import {
  User,
  MapPin,
  Lock,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building2,
  Save
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

  if (!profile) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading employee profile...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <div className="enterprise-card p-6 bg-white border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-blue-600 overflow-hidden bg-slate-100 shrink-0 shadow-inner">
              {profile.profile_image_url ? (
                <img src={profile.profile_image_url} alt={profile.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-slate-400 m-auto mt-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-900">{profile.full_name}</h1>
                <StatusBadge status={profile.registration_status} size="sm" />
              </div>
              <p className="text-xs text-slate-600 font-medium">{profile.designation}</p>
              <p className="text-xs font-mono text-blue-700 font-semibold mt-0.5">ID: {profile.employee_id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowRequestChangeModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
              Request Official Name/DOB Change
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {errors.submit && (
        <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.submit}</span>
        </div>
      )}

      {/* Grid: Non-Editable Identity Credentials & Editable Contact/Address */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Locked Identity Fields */}
        <div className="lg:col-span-6 enterprise-card p-6 bg-white border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Official Identity Record
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              <Lock className="w-3 h-3 text-slate-400" /> HR Verified & Locked
            </span>
          </div>

          <div className="space-y-3.5 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">EMPLOYEE IDENTIFIER</span>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded font-mono font-bold text-blue-700">
                {profile.employee_id}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">LAST NAME</span>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded font-medium text-slate-800">
                  {profile.last_name || profile.full_name?.split(' ').pop() || '—'}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">FIRST NAME</span>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded font-medium text-slate-800">
                  {profile.first_name || profile.full_name?.split(' ')[0] || '—'}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">MIDDLE INITIAL / NAME</span>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded font-medium text-slate-800">
                  {profile.middle_initial || <span className="text-slate-400 italic">None</span>}
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">FULL LEGAL NAME ON RECORD</span>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded font-bold text-slate-900">
                {profile.full_name}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">OFFICIAL WORK EMAIL</span>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800">
                {profile.email}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">CORPORATE DESIGNATION</span>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800">
                {profile.designation}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">DATE OF BIRTH</span>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800">
                {profile.date_of_birth}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">EMPLOYMENT START DATE</span>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded font-mono font-medium text-slate-800">
                  {profile.start_date || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">EMPLOYMENT STATUS / END DATE</span>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800 flex items-center justify-between">
                  {profile.end_date ? (
                    <span className="font-mono text-rose-700 font-semibold">{profile.end_date}</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Currently Working (Active)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Contact & Residential Address */}
        <div className="lg:col-span-6 enterprise-card p-6 bg-white border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Contact & Address Information
              </h3>
            </div>
            {!isEditingAddress ? (
              <button
                type="button"
                onClick={() => setIsEditingAddress(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Details
              </button>
            ) : (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                Editing Mode
              </span>
            )}
          </div>

          {isEditingAddress ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <AddressForm
                values={addressData}
                onChange={(f, v) => setAddressData(p => ({ ...p, [f]: v }))}
                errors={errors}
                setErrors={setErrors}
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsEditingAddress(false); fetchProfile(); }}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveContactAndAddress}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[#0f2b48] hover:bg-[#1b3d63] rounded transition-colors disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">CONTACT PHONE</span>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800">
                  {profile.phone}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">COUNTRY</span>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800">
                  {profile.country}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">STATE / PROVINCE</span>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800">
                    {profile.state}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">CITY</span>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800">
                    {profile.city}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">ZIP / POSTAL CODE</span>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800">
                  {profile.zip_code}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">STREET ADDRESS</span>
                <div className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-800">
                  {profile.address}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Request Info Dialog */}
      {showRequestChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#0f2b48]">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              <h3 className="text-sm font-bold text-slate-900">Legal Identity Correction Policy</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In compliance with federal tax and payroll regulations, legal identity details (Full Name, Date of Birth, and Employee ID) cannot be casually modified directly in the employee portal.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              To request an official legal change (such as after a legal name change or marriage), please email Shinetek HR Compliance at <strong className="text-blue-700">hr@shinetek.com</strong> with certified supporting documentation (e.g. Court Order, Marriage Certificate).
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowRequestChangeModal(false)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0f2b48] hover:bg-[#1a416b] rounded"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { formatDate } from '../../utils/displayDate.js';
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { EmployeeAvatar } from '../../components/common/EmployeeAvatar.jsx';
import { AddressForm } from '../../components/registration/AddressForm.jsx';
import {
  User,
  MapPin,
  Lock,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Save,
} from 'lucide-react';

export function EmployeeProfile() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [workLocation, setWorkLocation] = useState('');
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

  const fetchProfile = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await api.getProfile();
      if (!data?.employee) throw new Error('The server did not return your employee profile. Please contact HR.');
      setProfile(data.employee);
      setWorkLocation(data.employee.work_location_address || '');
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
      setLoadError(err.name === 'TimeoutError'
        ? 'The server is taking too long to respond. Please try again.'
        : err.message || 'Unable to load your employee profile. Please try again.');
    } finally {
      setIsLoading(false);
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
        workLocationAddress: workLocation,
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

  if (isLoading && !profile) {
    return <div role="status" className="p-8 text-center text-xs text-slate-400">Loading employee profile...</div>;
  }

  if (!profile) {
    return (
      <div role="alert" className="enterprise-card p-6 space-y-3">
        <h1 className="text-lg font-bold text-slate-900">Unable to load your profile</h1>
        <p className="text-sm text-slate-600">{loadError || 'Your employee profile is unavailable. Please contact HR.'}</p>
        <button type="button" className="enterprise-btn-primary" onClick={fetchProfile}>Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadError && <div role="alert" className="enterprise-card p-4 text-sm text-rose-700">{loadError} <button type="button" className="underline" disabled={isLoading} onClick={fetchProfile}>Try again</button></div>}
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
        {/* Left Column: Locked Identity Fields & Emergency Contact */}
        <div className="lg:col-span-6 space-y-6">
          <div className="enterprise-card p-6 bg-white space-y-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">GENDER</span>
                  <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-semibold text-slate-800">
                    {profile.gender || 'Not specified'}
                  </div>
                </div>
                <div>
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">DATE OF BIRTH (MONTH/DATE/YEAR)</span>
                  <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-slate-800 font-mono">
                    {formatDate(profile.date_of_birth)}
                  </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">START DATE</span>
                  <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-mono font-bold text-slate-800">
                    {formatDate(profile.start_date)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact Information Card */}
          <div className="enterprise-card p-6 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider font-display">
                  Emergency Contact Details
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">CONTACT NAME</span>
                <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-semibold text-slate-800">
                  {[profile.emergency_first_name, profile.emergency_last_name].filter(Boolean).join(' ') || '—'}
                </div>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">RELATIONSHIP</span>
                <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-semibold text-slate-800">
                  {profile.emergency_relationship || '—'}
                </div>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">EMERGENCY PHONE</span>
                <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-mono text-slate-800">
                  {profile.emergency_phone || '—'}
                </div>
              </div>
              <div>
                <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">EMERGENCY EMAIL</span>
                <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-slate-800 truncate">
                  {profile.emergency_email || <span className="text-slate-400 italic">None</span>}
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
            <label className="block">Work Location Address{isEditingAddress ? <textarea className="mt-1 w-full border border-slate-300 rounded-lg p-3" maxLength={1000} rows={3} value={workLocation} onChange={e => setWorkLocation(e.target.value)} /> : <div className="mt-1 p-3 rounded-lg bg-slate-50 border border-slate-200">{profile.work_location_address || 'Not provided'}</div>}</label>
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
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-display">STREET ADDRESS & SUITE</span>
                  <div className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl font-medium text-slate-800">
                    {[profile.address_line_1, profile.address_line_2, profile.suite_apt].filter(Boolean).join(', ') || profile.address || '—'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

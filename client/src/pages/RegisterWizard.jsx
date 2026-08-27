import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { PhotoCropper } from '../components/registration/PhotoCropper.jsx';
import { AddressForm } from '../components/registration/AddressForm.jsx';
import { DocumentUploadCard } from '../components/registration/DocumentUploadCard.jsx';
import { StatusBadge } from '../components/common/StatusBadge.jsx';
import { ShineteckLogo } from '../components/common/ShineteckLogo.jsx';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  MapPin,
  Camera,
  FileText,
  CheckSquare,
  AlertCircle,
  Lock,
  ShieldCheck,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Key,
  X,
  Eye,
  Download,
  Clock,
  Sparkles,
  Home
} from 'lucide-react';

import { DEFAULT_PORTRAIT_SVG } from '../assets/defaultPortrait.js';

// Field wrapper helper
const FieldGroup = ({ label, icon: Icon, required, optionalBadge, optionalNote, error, children, span2, className }) => (
  <div className={`${span2 ? 'sm:col-span-2' : ''} ${className || ''}`}>
    <div className="flex items-center justify-between gap-1.5 mb-1.5">
      <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider font-display">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {optionalBadge && (
        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
          Optional
        </span>
      )}
    </div>
    {children}
    {optionalNote && (
      <p className="text-[11px] text-slate-400 mt-1 font-medium">{optionalNote}</p>
    )}
    {error && (
      <p className="flex items-center gap-1 text-xs text-rose-600 mt-1.5 font-semibold">
        <AlertCircle className="w-3.5 h-3.5" />{error}
      </p>
    )}
  </div>
);

const inputCls = (hasErr) =>
  `w-full px-3.5 py-2.5 text-xs font-medium border rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-600/12 focus:border-blue-600 transition-all shadow-2xs ${
    hasErr ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 hover:border-slate-400'
  }`;

const SectionHeader = ({ icon: Icon, title, desc }) => (
  <div className="flex items-start gap-3 pb-4 border-b border-slate-100 mb-5">
    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 shadow-2xs">
      <Icon className="w-4 h-4 text-blue-600" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-900 font-display">{title}</h3>
      <p className="text-xs text-slate-500 mt-0.5 font-medium">{desc}</p>
    </div>
  </div>
);

export function RegisterWizard({ onNavigateLogin, onRegistrationComplete }) {
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [nextIdPreview, setNextIdPreview] = useState('SH-2008');

  // Step 1: Personal Info
  const [personalInfo, setPersonalInfo] = useState({
    lastName: '',
    firstName: '',
    middleInitial: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    designation: '',
    dateOfBirth: ''
  });

  // Step 2: Address Info
  const [addressInfo, setAddressInfo] = useState({
    country: 'United States',
    state: '',
    city: '',
    zipCode: '',
    address: ''
  });

  // Step 3: Profile Picture
  const [profilePhoto, setProfilePhoto] = useState({
    previewUrl: DEFAULT_PORTRAIT_SVG,
    serverUrl: null
  });

  // Step 4: Documents
  const [documents, setDocuments] = useState({
    w4: null,
    i9: null,
    passport: null,
    visa: null
  });

  // Form errors & submission states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [previewModalDoc, setPreviewModalDoc] = useState(null);

  useEffect(() => {
    async function loadNextId() {
      try {
        const data = await api.getNextIdPreview();
        if (data.employeeId) {
          setNextIdPreview(data.employeeId);
        }
      } catch (err) {
        console.error('Failed to load next ID:', err);
      }
    }
    loadNextId();
  }, []);

  const steps = [
    { num: 1, label: 'Personal Information', sub: 'Identity & credentials', icon: User },
    { num: 2, label: 'Address Details', sub: 'Location & contact', icon: MapPin },
    { num: 3, label: 'Profile Picture', sub: 'Photo verification', icon: Camera },
    { num: 4, label: 'Required Documents', sub: 'Tax & identity docs', icon: FileText },
    { num: 5, label: 'Review & Submit', sub: 'Final verification', icon: CheckSquare }
  ];

  const handlePersonalChange = (field, value) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleAddressChange = (field, value) => {
    setAddressInfo(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep1 = () => {
    const errs = {};
    if (!personalInfo.lastName.trim()) errs.lastName = 'Last Name is required.';
    if (!personalInfo.firstName.trim()) errs.firstName = 'First Name is required.';
    if (!personalInfo.email.trim()) {
      errs.email = 'Corporate / Work Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email)) {
      errs.email = 'Please provide a valid email format.';
    }
    if (!personalInfo.phone.trim()) errs.phone = 'Contact Phone number is required.';
    if (!personalInfo.designation.trim()) errs.designation = 'Designation / Job Title is required.';
    if (!personalInfo.dateOfBirth) errs.dateOfBirth = 'Date of Birth is required.';
    if (!personalInfo.password) {
      errs.password = 'Password is required.';
    } else if (personalInfo.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }
    if (personalInfo.password !== personalInfo.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!addressInfo.country) errs.country = 'Country is required.';
    if (!addressInfo.state) errs.state = 'State / Province is required.';
    if (!addressInfo.city) errs.city = 'City is required.';
    if (!addressInfo.zipCode) errs.zipCode = 'ZIP / Postal Code is required.';
    if (!addressInfo.address) errs.address = 'Street address is required.';

    if (addressInfo.country === 'United States' && addressInfo.zipCode) {
      const usZipRegex = /^\d{5}(-\d{4})?$/;
      if (!usZipRegex.test(addressInfo.zipCode.trim())) {
        errs.zipCode = 'Invalid US ZIP Code format. Example: 90001 or 90001-1234';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    if (!profilePhoto) {
      setErrors({ photo: 'Please upload and crop your profile photograph before continuing.' });
      return false;
    }
    setErrors({});
    return true;
  };

  const validateStep4 = () => {
    const missing = [];
    if (!documents.w4) missing.push('Form W-4');
    if (!documents.i9) missing.push('Form I-9');
    if (!documents.passport) missing.push('Passport Copy');
    if (!documents.visa) missing.push('Visa Copy / Work Authorization');

    if (missing.length > 0) {
      setErrors({ docs: `Please upload all required onboarding documents: ${missing.join(', ')}.` });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;
    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setErrors({});
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleDocumentUpload = async (docType, file) => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', docType);

      const res = await api.uploadDocument(formData);
      setDocuments(prev => ({
        ...prev,
        [docType]: res.document
      }));
      setErrors(prev => ({ ...prev, docs: null }));
    } catch (err) {
      throw err;
    }
  };

  const handleDocumentRemove = (docType) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: null
    }));
  };

  const handleProfilePhotoSave = async (result) => {
    try {
      const formData = new FormData();
      formData.append('avatar', result.blob, 'profile_cropped.jpg');
      const uploadRes = await api.uploadAvatar(formData);

      setProfilePhoto({
        blob: result.blob,
        previewUrl: result.previewUrl,
        serverUrl: uploadRes.imageUrl
      });
      setErrors(prev => ({ ...prev, photo: null }));
    } catch (err) {
      console.error(err);
      setErrors(prev => ({ ...prev, photo: 'Failed to upload cropped photo to server.' }));
    }
  };

  const handleFinalSubmit = async () => {
    if (!termsAccepted) {
      setErrors({ submit: 'Please confirm that all submitted details and documents are accurate and legally authentic.' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const docsArray = Object.keys(documents).filter(k => documents[k]).map(k => ({
        documentType: k,
        fileName: documents[k].fileName || `${k}_upload.pdf`,
        filePath: documents[k].filePath || `${k}_file`,
        fileSize: documents[k].fileSize || 1024,
        mimeType: documents[k].mimeType || 'application/pdf'
      }));

      const computedFullName = [
        personalInfo.firstName.trim(),
        personalInfo.middleInitial.trim(),
        personalInfo.lastName.trim()
      ].filter(Boolean).join(' ');

      const payload = {
        lastName: personalInfo.lastName.trim(),
        firstName: personalInfo.firstName.trim(),
        middleInitial: personalInfo.middleInitial.trim(),
        fullName: computedFullName,
        email: personalInfo.email.trim(),
        phone: personalInfo.phone.trim(),
        password: personalInfo.password,
        confirmPassword: personalInfo.confirmPassword,
        designation: personalInfo.designation.trim(),
        dateOfBirth: personalInfo.dateOfBirth,
        country: addressInfo.country,
        state: addressInfo.state,
        city: addressInfo.city,
        zipCode: addressInfo.zipCode.trim(),
        address: addressInfo.address.trim(),
        profileImageUrl: profilePhoto?.serverUrl || profilePhoto?.previewUrl || null,
        uploadedDocuments: docsArray
      };

      const res = await api.register(payload);
      setSubmissionSuccess(res);
      if (onRegistrationComplete) {
        onRegistrationComplete(res);
      }
    } catch (err) {
      setErrors({ submit: err.message || 'Submission failed. Please check your data and try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="glass-header sticky top-0 z-30">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ShineteckLogo size="sm" />
            <span className="text-xs text-slate-500 hidden sm:block font-medium pl-3 border-l border-slate-200/80">
              Employee Onboarding & Identity Registration
            </span>
          </div>
          <button
            type="button"
            onClick={onNavigateLogin}
            className="enterprise-btn-secondary"
          >
            Already registered? Sign In
          </button>
        </div>
      </header>

      {/* Two-panel body */}
      <div className="flex-1 flex w-full">
        {/* LEFT: Sticky step navigator */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 bg-white border-r border-slate-200/80 sticky top-[57px] h-[calc(100dvh-57px)] overflow-y-auto custom-scrollbar">
          <div className="px-6 pt-6 pb-4 border-b border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-display">Onboarding Progress</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-blue-600 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-bold font-mono text-slate-700">{currentStep}/5</span>
            </div>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1.5">
            {steps.map((step) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.num;
              const isCurrent = currentStep === step.num;
              return (
                <div key={step.num} className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  isCurrent ? 'bg-blue-50/80 border border-blue-200 shadow-2xs' :
                  isCompleted ? 'bg-emerald-50/50 border border-emerald-100' : 'border border-transparent'
                }`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                    isCompleted ? 'bg-emerald-600 text-white shadow-xs' :
                    isCurrent ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate font-display ${
                      isCurrent ? 'text-blue-950' : isCompleted ? 'text-emerald-900' : 'text-slate-500'
                    }`}>{step.label}</p>
                    <p className={`text-[11px] truncate font-medium ${
                      isCurrent ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                    }`}>{step.sub}</p>
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-display">Target Employee ID</p>
            <div className="flex items-center gap-2 bg-[#071524] text-white rounded-xl px-3.5 py-2.5 shadow-xs border border-white/10">
              <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="font-mono font-bold text-xs text-blue-300 tracking-wider">{nextIdPreview}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Auto-generated sequence allocation</p>
          </div>
        </aside>

        {/* RIGHT: Scrollable form area */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8 space-y-6">

            {/* Mobile step bar */}
            <div className="lg:hidden enterprise-card p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700">Step {currentStep} of 5</span>
                <span className="text-xs text-blue-600 font-bold">{steps[currentStep - 1]?.label}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${(currentStep / 5) * 100}%` }} />
              </div>
            </div>

            {submissionSuccess ? (
              /* Success / Under Review Screen */
              <div className="enterprise-card p-6 sm:p-10 text-center bg-white border-slate-200 shadow-xl space-y-6 animate-in fade-in zoom-in duration-200">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-3 shadow-2xs">
                    <Clock className="w-8 h-8 animate-pulse" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100/90 border border-amber-200 px-3.5 py-1 rounded-full mb-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-status-pulse"></span>
                    Application Submitted — Under HR Review
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-display">
                    Thank You for Completing Your Onboarding!
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl mx-auto leading-relaxed">
                    Your onboarding package, photograph, and legal compliance records have been securely routed to the Shineteck Inc. Human Resources department.
                  </p>
                </div>

                {/* Prominent HR Review Notice */}
                <div className="p-5 bg-linear-to-br from-blue-50/80 via-slate-50 to-amber-50/50 rounded-2xl border border-blue-200 text-left space-y-3.5 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-blue-200/60 pb-2 font-display">
                    <Mail className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>Important Next Steps & Login Activation</span>
                  </div>

                  <div className="space-y-3 text-xs text-slate-700">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                        1
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-semibold font-display">HR Verification:</strong>
                        <span className="text-slate-600 leading-normal">
                          The Shineteck HR Compliance team will verify your personal identity records and uploaded tax/work forms (W-4, I-9, Passport, Visa).
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                        2
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-semibold font-display">Approval Notification Email:</strong>
                        <span className="text-slate-800 leading-normal font-medium bg-amber-100/60 px-1 py-0.5 rounded">
                          Upon approval, you will receive an official activation email at <strong className="text-blue-700 underline">{submissionSuccess.user?.email || personalInfo.email}</strong> to sign in.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submission Summary Card */}
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
                  <div className="flex justify-between border-b border-slate-200/70 pb-2">
                    <span className="text-slate-500 font-medium">Assigned Employee ID:</span>
                    <span className="font-mono font-bold text-blue-700 text-sm">{submissionSuccess.user?.employeeId}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/70 pb-2">
                    <span className="text-slate-500 font-medium">Full Legal Name:</span>
                    <span className="font-bold text-slate-900">{submissionSuccess.employee?.full_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/70 pb-2">
                    <span className="text-slate-500 font-medium">Work Email:</span>
                    <span className="font-semibold text-slate-800">{submissionSuccess.user?.email || personalInfo.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/70 pb-2">
                    <span className="text-slate-500 font-medium">Designation:</span>
                    <span className="font-semibold text-slate-800">{personalInfo.designation || 'Staff Consultant'}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 font-medium">Application Status:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-[11px]">
                      <Clock className="w-3 h-3 text-amber-600" /> Pending HR Approval
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    onClick={onNavigateLogin}
                    className="enterprise-btn-primary px-8 py-3 w-full sm:w-auto"
                  >
                    <span>Return to Login Screen</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Questions? Contact Shineteck HR at <a href="mailto:hr@shinetek.com" className="text-blue-600 font-bold hover:underline">hr@shinetek.com</a>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Error Banner */}
                {errors.submit && (
                  <div className="flex items-center gap-2.5 p-4 text-xs font-semibold text-rose-900 bg-rose-50 border border-rose-200 rounded-xl shadow-2xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errors.submit}</span>
                  </div>
                )}

                {/* STEP 1: Personal Information */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    {/* Basic Identity */}
                    <div className="enterprise-card bg-white p-6 space-y-5">
                      <SectionHeader
                        icon={User}
                        title="Basic Legal Identity"
                        desc="Provide your legal name as it appears on official government identity documents"
                      />
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldGroup
                          label="Last Name"
                          required
                          error={errors.lastName}
                        >
                          <input
                            type="text"
                            placeholder="e.g. Vance"
                            value={personalInfo.lastName}
                            onChange={e => handlePersonalChange('lastName', e.target.value)}
                            className={inputCls(errors.lastName)}
                          />
                        </FieldGroup>

                        <FieldGroup
                          label="First Name"
                          required
                          error={errors.firstName}
                        >
                          <input
                            type="text"
                            placeholder="e.g. Johnathan"
                            value={personalInfo.firstName}
                            onChange={e => handlePersonalChange('firstName', e.target.value)}
                            className={inputCls(errors.firstName)}
                          />
                        </FieldGroup>

                        <FieldGroup
                          label="Middle Initial / Name"
                          optionalBadge
                          error={errors.middleInitial}
                        >
                          <input
                            type="text"
                            placeholder="e.g. E. or Edward"
                            value={personalInfo.middleInitial}
                            onChange={e => handlePersonalChange('middleInitial', e.target.value)}
                            className={inputCls(errors.middleInitial)}
                          />
                        </FieldGroup>

                        <FieldGroup
                          label="Date of Birth"
                          required
                          error={errors.dateOfBirth}
                        >
                          <input
                            type="date"
                            value={personalInfo.dateOfBirth}
                            onChange={e => handlePersonalChange('dateOfBirth', e.target.value)}
                            className={inputCls(errors.dateOfBirth)}
                          />
                        </FieldGroup>
                      </div>

                      {/* Legal Name Preview Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 font-display">
                            Full Legal Name on Record:
                          </span>
                          <span className="font-bold text-slate-900 truncate">
                            {[personalInfo.firstName.trim(), personalInfo.middleInitial.trim(), personalInfo.lastName.trim()].filter(Boolean).join(' ') || (
                              <span className="text-slate-400 font-normal italic">Will be formatted as First [Middle] Last</span>
                            )}
                          </span>
                        </div>
                        {personalInfo.firstName.trim() && personalInfo.lastName.trim() && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Formatted
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Work & Contact */}
                    <div className="enterprise-card bg-white p-6 space-y-5">
                      <SectionHeader icon={Briefcase} title="Work & Contact Details" desc="Corporate email, designation, and phone number for HR records" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldGroup label="Work / Corporate Email" icon={Mail} required error={errors.email}>
                          <input type="email" placeholder="e.g. j.vance@shinetek.com" value={personalInfo.email}
                            onChange={e => handlePersonalChange('email', e.target.value)}
                            className={inputCls(errors.email)} />
                        </FieldGroup>
                        <FieldGroup label="Contact Phone Number" icon={Phone} required error={errors.phone}>
                          <input type="tel" placeholder="+1 (555) 019-2831" value={personalInfo.phone}
                            onChange={e => handlePersonalChange('phone', e.target.value)}
                            className={inputCls(errors.phone)} />
                        </FieldGroup>
                        <div className="sm:col-span-2">
                          <FieldGroup label="Designation / Role" icon={Briefcase} required error={errors.designation}>
                            <input type="text" placeholder="e.g. Senior Software Architect" value={personalInfo.designation}
                              onChange={e => handlePersonalChange('designation', e.target.value)}
                              className={inputCls(errors.designation)} />
                          </FieldGroup>
                        </div>
                      </div>
                    </div>

                    {/* Account Security */}
                    <div className="enterprise-card bg-white p-6 space-y-5">
                      <SectionHeader icon={Key} title="Account Security" desc="Create a strong password to secure your employee portal access" />
                      <div className="flex items-center gap-3 bg-[#071524] text-white rounded-xl px-4 py-3 border border-white/10 shadow-xs">
                        <Lock className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-display">Assigned Employee Identifier</p>
                          <p className="font-mono font-bold text-sm text-blue-300 tracking-wider">{nextIdPreview}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldGroup label="Account Password" icon={Key} required error={errors.password}>
                          <input type="password" placeholder="Minimum 8 characters" value={personalInfo.password}
                            onChange={e => handlePersonalChange('password', e.target.value)}
                            className={inputCls(errors.password)} />
                        </FieldGroup>
                        <FieldGroup label="Confirm Password" icon={Key} required error={errors.confirmPassword}>
                          <input type="password" placeholder="Re-enter password" value={personalInfo.confirmPassword}
                            onChange={e => handlePersonalChange('confirmPassword', e.target.value)}
                            className={inputCls(errors.confirmPassword)} />
                        </FieldGroup>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: Address Information */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <AddressForm
                      values={addressInfo}
                      onChange={handleAddressChange}
                      errors={errors}
                      setErrors={setErrors}
                    />
                  </div>
                )}

                {/* STEP 3: Profile Picture */}
                {currentStep === 3 && (
                  <PhotoCropper
                    initialImage={profilePhoto?.previewUrl || DEFAULT_PORTRAIT_SVG}
                    onSave={(result) => {
                      handleProfilePhotoSave(result);
                      setCurrentStep(4);
                    }}
                    onBack={handlePrev}
                    onCancel={handlePrev}
                  />
                )}

                {/* STEP 4: Document Uploads */}
                {currentStep === 4 && (
                  <div className="space-y-5">
                    {/* Guidelines */}
                    <div className="enterprise-card bg-white p-6">
                      <SectionHeader icon={ShieldCheck} title="Document Upload Guidelines" desc="Federal and corporate compliance standards for document submission" />
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {[
                          'Upload clear, fully legible copies (PDF / JPG / PNG)',
                          'Ensure all 4 corners of documents are visible',
                          'Avoid shadows, screen glare, or partial cuts',
                          'Form W-4 must include your legal signature',
                          'Form I-9 must include Section 1 employee data',
                          'Maximum file size per document is 10.0 MB'
                        ].map((tip, i) => (
                          <li key={i} className="flex items-start gap-2.5 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs font-medium">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{i + 1}</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {errors.docs && (
                      <div className="flex items-center gap-2 p-3.5 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                        <span>{errors.docs}</span>
                      </div>
                    )}

                    {/* Tax & Employment Forms */}
                    <div className="space-y-4">
                      <DocumentUploadCard
                        docKey="w4"
                        title="Form W-4 — Employee Withholding Certificate"
                        description="IRS federal tax withholding form signed for current fiscal year."
                        uploadedDoc={documents.w4}
                        sampleImageUrl="/sample_docs/w4.png"
                        onUpload={handleDocumentUpload}
                        onRemove={handleDocumentRemove}
                        onPreview={d => setPreviewModalDoc(d)}
                      />
                      <DocumentUploadCard
                        docKey="i9"
                        title="Form I-9 — Employment Eligibility Verification"
                        description="USCIS verification document with Section 1 completed."
                        uploadedDoc={documents.i9}
                        sampleImageUrl="/sample_docs/i9.png"
                        onUpload={handleDocumentUpload}
                        onRemove={handleDocumentRemove}
                        onPreview={d => setPreviewModalDoc(d)}
                      />
                    </div>

                    {/* Identity Documents */}
                    <div className="space-y-4">
                      <DocumentUploadCard
                        docKey="passport"
                        title="Government Passport Copy"
                        description="Color photograph page of your official government passport."
                        uploadedDoc={documents.passport}
                        sampleImageUrl="/sample_docs/passport.png"
                        onUpload={handleDocumentUpload}
                        onRemove={handleDocumentRemove}
                        onPreview={d => setPreviewModalDoc(d)}
                      />
                      <DocumentUploadCard
                        docKey="visa"
                        title="Visa Copy / Work Authorization Document"
                        description="Work authorization, H-1B, Green Card, or EAD document copy."
                        uploadedDoc={documents.visa}
                        sampleImageUrl="/sample_docs/visa.png"
                        onUpload={handleDocumentUpload}
                        onRemove={handleDocumentRemove}
                        onPreview={d => setPreviewModalDoc(d)}
                      />
                    </div>
                  </div>
                )}

                {/* STEP 5: Review & Submit */}
                {currentStep === 5 && (
                  <div className="space-y-5">
                    {/* Personal details review */}
                    <div className="enterprise-card bg-white p-6 space-y-4">
                      <SectionHeader icon={User} title="Personal Information" desc="Review your identity and account details" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        {[
                          ['Employee ID', <span className="font-mono font-bold text-blue-700">{nextIdPreview}</span>],
                          ['Last Name', personalInfo.lastName],
                          ['First Name', personalInfo.firstName],
                          ['Middle Initial / Name', personalInfo.middleInitial ? personalInfo.middleInitial : <span className="text-slate-400 italic">None</span>],
                          ['Full Legal Name', <span className="font-bold text-slate-900">{[personalInfo.firstName.trim(), personalInfo.middleInitial.trim(), personalInfo.lastName.trim()].filter(Boolean).join(' ')}</span>],
                          ['Date of Birth', personalInfo.dateOfBirth],
                          ['Work Email', personalInfo.email],
                          ['Contact Phone', personalInfo.phone],
                          ['Designation', personalInfo.designation],
                        ].map(([label, value]) => (
                          <div key={label} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                            <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider mb-1 font-display">{label}</p>
                            <p className="text-slate-800 font-semibold">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Address review */}
                    <div className="enterprise-card bg-white p-6 space-y-4">
                      <SectionHeader icon={MapPin} title="Residential Address" desc="Verify your location and contact information" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {[
                          ['Country', addressInfo.country],
                          ['State / Province', addressInfo.state],
                          ['City', addressInfo.city],
                          ['ZIP / Postal Code', addressInfo.zipCode],
                        ].map(([label, value]) => (
                          <div key={label} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                            <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider mb-1 font-display">{label}</p>
                            <p className="text-slate-800 font-semibold">{value}</p>
                          </div>
                        ))}
                        <div className="sm:col-span-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                          <p className="text-[10.5px] text-slate-400 font-bold uppercase tracking-wider mb-1 font-display">Street Address</p>
                          <p className="text-slate-800 font-semibold">{addressInfo.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Photo & Docs review */}
                    <div className="enterprise-card bg-white p-6 space-y-4">
                      <SectionHeader icon={FileText} title="Photo & Documents" desc="Confirm all uploaded materials are correct" />
                      <div className="flex flex-col sm:flex-row gap-5">
                        <div className="flex flex-col items-center justify-center p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 shrink-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 font-display">Badge Photo</p>
                          <div className="w-20 h-20 rounded-2xl border-2 border-blue-500 overflow-hidden bg-white shadow mb-2">
                            {profilePhoto?.previewUrl ? (
                              <img src={profilePhoto.previewUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-10 h-10 text-slate-400 m-auto mt-5" />
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">Verified ✓</span>
                        </div>
                        <div className="flex-1 space-y-2.5">
                          {[
                            { label: 'Form W-4 (Withholding)', doc: documents.w4, sample: '/sample_docs/w4.png' },
                            { label: 'Form I-9 (Eligibility)', doc: documents.i9, sample: '/sample_docs/i9.png' },
                            { label: 'Passport Copy', doc: documents.passport, sample: '/sample_docs/passport.png' },
                            { label: 'Visa / Work Authorization', doc: documents.visa, sample: '/sample_docs/visa.png' }
                          ].map(({ label, doc, sample }) => (
                            <div key={label} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                              <div className="flex items-center gap-3">
                                <div
                                  onClick={() => setPreviewModalDoc({
                                    title: label,
                                    previewUrl: doc?.filePath || sample,
                                    fileName: doc?.fileName || 'document_sample.png'
                                  })}
                                  className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-slate-300 shrink-0 cursor-pointer shadow-2xs hover:border-blue-400"
                                >
                                  <img src={doc?.filePath || sample} alt={label} className="w-full h-full object-cover object-top" />
                                </div>
                                <div>
                                  <span className="text-slate-800 font-bold text-xs block">{label}</span>
                                  <span className="text-slate-400 text-[11px] truncate max-w-[160px] block font-mono">
                                    {doc?.fileName || 'Verified Onboarding Doc'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewModalDoc({
                                    title: label,
                                    previewUrl: doc?.filePath || sample,
                                    fileName: doc?.fileName || 'document_sample.png'
                                  })}
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" /> Preview
                                </button>
                                <StatusBadge status={doc ? 'Uploaded' : 'Uploaded'} size="sm" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Legal acknowledgment */}
                    <div className="enterprise-card bg-white p-6">
                      <label className="flex items-start gap-3 text-xs text-slate-700 cursor-pointer font-medium leading-relaxed">
                        <input type="checkbox" checked={termsAccepted}
                          onChange={e => {
                            setTermsAccepted(e.target.checked);
                            if (errors.submit) setErrors(prev => ({ ...prev, submit: null }));
                          }}
                          className="mt-0.5 w-4 h-4 accent-blue-600 rounded shrink-0 cursor-pointer" />
                        <span>I hereby certify that all statements and documents submitted in this onboarding package are <strong>true, accurate, and complete</strong> to the best of my knowledge. I understand that falsification is grounds for immediate rejection or termination per Shineteck Inc. HR Policy.</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                {currentStep !== 3 && (
                  <div className="flex items-center justify-between pt-2 pb-6">
                    {currentStep > 1 ? (
                      <button type="button" onClick={handlePrev}
                        className="enterprise-btn-secondary">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                    ) : <div />}

                    {currentStep < 5 ? (
                      <button type="button" onClick={handleNext}
                        className="enterprise-btn-primary">
                        <span>Continue to Step {currentStep + 1}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button type="button" disabled={isSubmitting} onClick={handleFinalSubmit}
                        className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-98">
                        <span>{isSubmitting ? 'Submitting Package...' : 'Submit Employee Registration'}</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

              </div>
            )}
          </div>
        </main>
      </div>

      {/* Document Preview Modal */}
      {previewModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">{previewModalDoc.title || previewModalDoc.fileName || 'Document Preview'}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{previewModalDoc.fileName || 'High-resolution document view'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewModalDoc.previewUrl && (
                  <a
                    href={previewModalDoc.previewUrl}
                    download={previewModalDoc.fileName || 'document.png'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewModalDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center min-h-[300px]">
              {previewModalDoc.previewUrl ? (
                <img
                  src={previewModalDoc.previewUrl}
                  alt={previewModalDoc.title || 'Document'}
                  className="max-h-[70vh] w-auto max-w-full object-contain rounded-xl shadow-md border border-slate-300 bg-white"
                />
              ) : (
                <div className="text-center py-12 text-slate-400 text-sm">
                  <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>Document preview unavailable</p>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Shineteck Inc. Compliance & Records System</span>
              <button
                type="button"
                onClick={() => setPreviewModalDoc(null)}
                className="enterprise-btn-primary px-4 py-1.5"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 px-6 text-center text-xs text-slate-400 font-medium">
        © {new Date().getFullYear()} Shineteck Inc. HR Onboarding System. Secure transmission with 256-bit encryption.
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { api } from '../services/api.js';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, KeyRound, ShieldCheck, Lock } from 'lucide-react';
import { ShineteckLogo } from '../components/common/ShineteckLogo.jsx';

export function ForgotPasswordPage({ onNavigateLogin }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email) return;

    setIsSubmitting(true);
    try {
      const data = await api.forgotPassword({ email });
      setSuccessData(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process password recovery.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!newPassword || newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.resetPassword({
        token: successData.resetToken,
        newPassword,
        confirmPassword
      });
      setResetSuccess(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden selection:bg-blue-600 selection:text-white bg-slate-50">
      {/* Subtle depth lighting for light mode */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Centered White Card */}
      <div className="relative z-20 w-full max-w-[460px] my-auto">
        <div className="rounded-2xl p-1 bg-slate-100/90 border border-slate-200/80 shadow-2xl shadow-slate-200/80">
          <div className="relative bg-white rounded-xl p-6 sm:p-8 border border-slate-200/70 space-y-6">

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 mb-1 shadow-2xs">
                <KeyRound className="w-6 h-6" />
              </div>
              <ShineteckLogo size="md" className="justify-center" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
                Account Access Recovery
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Reset your corporate portal credentials via verified email
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold">{errorMsg}</span>
              </div>
            )}

            {resetSuccess ? (
              <div className="text-center space-y-4 py-2">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 font-display">Password Updated Successfully</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  Your credentials have been securely updated. You can now authenticate into the portal with your new password.
                </p>
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="w-full py-3 rounded-xl bg-[#0f2b48] hover:bg-[#1a416b] text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-98"
                >
                  Return to Sign In
                </button>
              </div>
            ) : successData ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold font-display block">Verification Token Verified</span>
                    <span>Enter and confirm your new account security password.</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider font-display">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimum 8 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-600/12 focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5 text-xs">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider font-display">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-600/12 focus:border-blue-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#0f2b48] hover:bg-[#1a416b] text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating Password...' : 'Save New Password & Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5 text-xs">
                  <label className="block font-bold text-slate-700 uppercase tracking-wider font-display">Corporate Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="e.g. j.vance@shinetek.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-blue-600/12 focus:border-blue-600 shadow-2xs"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">
                    We will verify your corporate identity and issue a secure password reset link.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#0f2b48] hover:bg-[#1a416b] text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending Request...' : 'Send Password Reset Link'}
                </button>
              </form>
            )}

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={onNavigateLogin}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </button>

              <span className="text-[11px] text-slate-400 font-mono">
                Shineteck Security
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

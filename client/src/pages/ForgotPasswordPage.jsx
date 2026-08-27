import React, { useState } from 'react';
import { api } from '../services/api.js';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, KeyRound, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <ShineteckLogo size="md" className="justify-center" />
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Account Recovery
          </h2>
          <p className="text-xs text-slate-500">
            Reset your Shinetek Inc. corporate portal password
          </p>
        </div>

        <div className="enterprise-card bg-white p-6 sm:p-8 shadow-xs border border-slate-200 rounded-xl">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 mb-4 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resetSuccess ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">Password Updated Successfully</h3>
              <p className="text-xs text-slate-600">
                Your credentials have been securely updated. You can now authenticate with your new password.
              </p>
              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full py-2.5 bg-[#0f2b48] hover:bg-[#173f67] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Return to Sign In
              </button>
            </div>
          ) : successData ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Reset Authorization Verified</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Enter your new password below to complete the account update.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#0f2b48] hover:bg-[#173f67] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered corporate email address. We will verify your employee record and generate a secure password reset token.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Corporate Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="e.g. name@shinetek.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#0f2b48] hover:bg-[#173f67] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                {isSubmitting ? 'Verifying Account...' : 'Generate Reset Token'}
              </button>
            </form>
          )}

          <div className="mt-5 pt-4 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={onNavigateLogin}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { api } from '../services/api.js';
import { Building2, ArrowLeft, Mail, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export function ForgotPasswordPage({ onNavigateLogin }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Reset form states for simulated direct reset
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
      setErrorMsg(err.message || 'Failed to process request.');
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
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#0f2b48] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Account Recovery
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Reset your Shinetek Inc. portal account password
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="enterprise-card bg-white py-8 px-6 sm:px-8 shadow-sm border-slate-200">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 mb-5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resetSuccess ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Password Reset Successful</h3>
              <p className="text-xs text-slate-600">
                Your password has been updated. You can now sign in with your new credentials.
              </p>
              <button
                type="button"
                onClick={onNavigateLogin}
                className="w-full py-2 bg-[#0f2b48] text-white text-xs font-semibold rounded hover:bg-[#1a416b] transition-colors"
              >
                Return to Login
              </button>
            </div>
          ) : successData ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Reset Authorization Verified</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Enter your new password below to complete the account update.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-xs transition-colors"
              >
                {isSubmitting ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Enter your registered corporate email address. We will verify your employee record and generate a secure password reset token.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Corporate Email Address</label>
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
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#0f2b48] hover:bg-[#1a416b] text-white text-xs font-semibold rounded shadow-xs transition-colors"
              >
                {isSubmitting ? 'Verifying Account...' : 'Generate Reset Token'}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <button
              type="button"
              onClick={onNavigateLogin}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium"
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

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { ShineteckLogo } from '../components/common/ShineteckLogo.jsx';

export function LoginPage({ onNavigateRegister, onNavigateForgotPassword }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter your Employee ID or Email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(identifier.trim(), password);
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials. Please verify your login information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        {/* Official Shineteck Inc Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="mb-3">
            <ShineteckLogo size="xl" />
          </div>
          <p className="text-sm sm:text-base text-slate-500 font-medium">
            Employee Access & Management Portal
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="enterprise-card bg-white py-10 px-8 sm:px-12 shadow-lg border-slate-200 rounded-2xl">
          {errorMsg && (
            <div className="flex items-center gap-2.5 p-3.5 mb-6 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Employee ID or Corporate Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="SH-2005 or name@shinetek.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm sm:text-base border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                {onNavigateForgotPassword && (
                  <button
                    type="button"
                    onClick={onNavigateForgotPassword}
                    className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm sm:text-base border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 text-sm sm:text-base font-bold rounded-lg text-white bg-[#0f2b48] hover:bg-[#1a416b] shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Registration link */}
          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-600">
              New employee joining Shinetek Inc.?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="font-bold text-blue-600 hover:text-blue-800 underline transition-colors"
              >
                Create Account / Register
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

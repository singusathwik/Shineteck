import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff, Building2, Briefcase } from 'lucide-react';
import { ShineteckLogo } from '../components/common/ShineteckLogo.jsx';

export function LoginPage({ onNavigateRegister, onNavigateForgotPassword }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter your Corporate Email or Employee ID and password.');
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
    <div className="min-h-screen w-full flex bg-slate-50 text-slate-900">
      {/* Left Brand Visual Side (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a192f] text-white flex-col justify-between p-12 overflow-hidden">
        {/* Background Image with Elegant Dark Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-35 mix-blend-luminosity scale-105 transition-transform duration-1000 ease-out"
          style={{ backgroundImage: "url('/images/login-bg.avif')" }}
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#071524] via-[#0b1f36]/85 to-[#0f2b48]/70" />

        {/* Top Header */}
        <div className="relative z-10">
          <ShineteckLogo size="lg" textColor="white" />
        </div>

        {/* Center Content Value Proposition */}
        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e27a3f]/20 border border-[#e27a3f]/40 text-[#fca369] text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#e27a3f]" />
            Innovating IT Solutions & Professional Staffing
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Empowering Digital Transformation & Global Talent Governance
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Centralized portal for employee onboarding compliance, client-vendor contract placements, work-period timesheet authorizations, and dual-currency payroll management.
          </p>

          {/* Core Competencies Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {['Data Science & BI', 'Cloud Services', 'App Development', 'Staff Augmentation'].map((svc, i) => (
              <span key={i} className="text-[11px] font-semibold bg-white/10 text-slate-200 border border-white/15 px-2.5 py-1 rounded-md">
                {svc}
              </span>
            ))}
          </div>

          {/* Key Trust Signals */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/60">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Global Staff Augmentation</h4>
                <p className="text-[11px] text-slate-400">US & India multi-hub talent</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Multi-Vendor Billing</h4>
                <p className="text-[11px] text-slate-400">USD & INR dual compensation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800 pt-4">
          <span>&copy; {new Date().getFullYear()} Shineteck Inc. • Innovating IT Solutions</span>
          <span className="font-mono text-[11px]">System Status: Operational</span>
        </div>
      </div>

      {/* Right Login Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile Brand Header */}
          <div className="text-center lg:text-left space-y-2">
            <div className="inline-block lg:hidden mb-2">
              <ShineteckLogo size="md" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Sign in to Corporate Portal
            </h2>
            <p className="text-xs text-slate-500">
              Enter your corporate credentials to access your employee workspace or admin dashboard.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Corporate Email or Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. admin@shinetek.com or SH-2005"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                {onNavigateForgotPassword && (
                  <button
                    type="button"
                    onClick={onNavigateForgotPassword}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-600/10 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold rounded-lg text-white bg-[#0f2b48] hover:bg-[#173f67] shadow-xs hover:shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{isSubmitting ? 'Authenticating Security Session...' : 'Authenticate & Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Quick Demo Fill Credentials */}
          <div className="pt-4 border-t border-slate-200/80">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
              Quick Select Demo Credentials
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIdentifier('admin@shinetek.com');
                  setPassword('Admin@1234');
                  setErrorMsg(null);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-lg transition-all cursor-pointer shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Admin Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIdentifier('johnathan.vance@shinetek.com');
                  setPassword('Password@123');
                  setErrorMsg(null);
                }}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-lg transition-all cursor-pointer shadow-2xs"
              >
                <User className="w-3.5 h-3.5 text-slate-600" />
                <span>Employee Login</span>
              </button>
            </div>
          </div>

          {/* Registration link */}
          <div className="pt-3 text-center border-t border-slate-100">
            <p className="text-xs text-slate-600">
              New consultant joining Shinetek Inc.?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="font-bold text-blue-600 hover:text-blue-800 underline transition-colors cursor-pointer"
              >
                Complete Onboarding Registration
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

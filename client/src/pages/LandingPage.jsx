import React from 'react';
import { Building2, ShieldCheck, UserPlus, LogIn, ArrowRight, CheckCircle2, Lock, FileCheck } from 'lucide-react';

export function LandingPage({ onNavigateLogin, onNavigateRegister, onNavigateAdminLogin }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-[#0f2b48] border-b border-[#1b3d63] text-white py-4 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-white block leading-tight">
                Shinetek Inc.
              </span>
              <span className="text-xs text-slate-300">Corporate Employee & Admin Management Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onNavigateLogin}
              className="px-4 py-2 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
            >
              Employee Login
            </button>
            <button
              type="button"
              onClick={onNavigateAdminLogin}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-600 transition-colors"
            >
              Admin Access
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-12 sm:py-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-800 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Enterprise Human Resources Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Shinetek Inc. Employee Onboarding & Workplace Portal
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Welcome to the official Shinetek Inc. corporate portal. Complete your multi-step onboarding, submit required legal and identity documents, manage work-period timesheets, and review payroll statements with enterprise-grade security.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={onNavigateRegister}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#0f2b48] hover:bg-[#1a416b] text-white text-sm font-semibold rounded-md shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Begin Employee Registration</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                type="button"
                onClick={onNavigateLogin}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold rounded-md border border-slate-300 shadow-xs transition-colors"
              >
                <LogIn className="w-4 h-4 text-slate-600" />
                <span>Employee Sign In</span>
              </button>
            </div>

            {/* Trust points */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sequential ID Generator</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Private Document Vault</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Audit Trail Verified</span>
              </div>
            </div>
          </div>

          {/* Quick Access Cards */}
          <div className="lg:col-span-5 space-y-4">
            <div className="enterprise-card p-6 bg-white border-slate-200 shadow-md">
              <h3 className="text-sm font-bold text-slate-900 mb-2">New Employee Registration</h3>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Newly joining Shinetek Inc.? Register your account, input your verified address, crop your official photo badge, and submit W-4 / I-9 documents.
              </p>
              <button
                type="button"
                onClick={onNavigateRegister}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded text-center transition-colors"
              >
                Start 5-Step Registration Wizard
              </button>
            </div>

            <div className="enterprise-card p-6 bg-slate-100/70 border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">Administrator Review Center</h3>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                  HR & Admin Only
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Review employee submissions, verify I-9 and visa records, authorize work timesheets, and configure sequential ID generator settings.
              </p>
              <button
                type="button"
                onClick={onNavigateAdminLogin}
                className="w-full py-2 bg-[#0f2b48] hover:bg-[#1a416b] text-white text-xs font-semibold rounded text-center transition-colors"
              >
                Access Admin Portal
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-6 sm:px-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Shinetek Inc. All rights reserved. Confidential corporate information system.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Security Statement</span>
            <span>HR Helpdesk: hr@shinetek.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

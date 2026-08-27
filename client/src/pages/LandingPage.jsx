import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  UserPlus,
  LogIn,
  ArrowRight,
  CheckCircle2,
  Lock,
  FileCheck,
  Sparkles,
  Users,
  Clock,
  Receipt,
  Globe2,
  ChevronRight,
  Shield,
  Layers,
  Award
} from 'lucide-react';
import { ShineteckLogo } from '../components/common/ShineteckLogo.jsx';

export function LandingPage({ onNavigateLogin, onNavigateRegister, onNavigateAdminLogin }) {
  const [activeFeatureTab, setActiveFeatureTab] = useState('employee');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-150px] left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-[-100px] right-1/4 w-[450px] h-[450px] bg-amber-500/8 rounded-full blur-3xl" />
      </div>

      {/* Floating Island Header */}
      <header className="sticky top-4 z-40 max-w-7xl mx-auto w-full px-4 sm:px-8">
        <div className="glass-island py-3 px-5 sm:px-6 rounded-2xl flex items-center justify-between transition-all">
          <div className="flex items-center gap-3">
            <ShineteckLogo size="md" />
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              type="button"
              onClick={onNavigateLogin}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer rounded-xl hover:bg-slate-100/70"
            >
              Employee Sign In
            </button>
            <button
              type="button"
              onClick={onNavigateAdminLogin}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-2xs"
            >
              Admin Operations
            </button>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-linear-to-r from-[#0f2b48] to-[#173f67] hover:from-[#173f67] hover:to-[#1e5285] rounded-xl border border-[#071524] transition-all cursor-pointer shadow-xs hover:shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Get Started</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column Copy & CTAs */}
          <div className="lg:col-span-7 space-y-7 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50/90 border border-blue-200/80 rounded-full text-blue-800 text-xs font-bold shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-status-pulse" />
              <span>Enterprise Human Capital & Global Placement Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08] font-display">
              Orchestrating Global Talent with <span className="text-transparent bg-clip-text bg-linear-to-r from-[#0f2b48] via-blue-600 to-[#e27a3f]">Precision & Speed</span>
            </h1>

            <p className="text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
              The unified corporate ecosystem for <span className="font-semibold text-slate-800">Shineteck Inc.</span> Complete multi-step onboarding, verify government-compliant identity records, manage work timesheets, and execute dual-currency multi-vendor payroll.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3.5 sm:gap-4">
              <button
                type="button"
                onClick={onNavigateRegister}
                className="group inline-flex items-center gap-2.5 px-6 py-3.5 bg-linear-to-b from-[#0f2b48] to-[#071524] hover:from-[#173f67] hover:to-[#0f2b48] text-white text-xs sm:text-sm font-bold rounded-xl border border-[#071524] shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-98"
              >
                <UserPlus className="w-4 h-4" />
                <span>Begin Employee Onboarding</span>
                <span className="btn-icon-bubble">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </span>
              </button>

              <button
                type="button"
                onClick={onNavigateLogin}
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer active:scale-98"
              >
                <LogIn className="w-4 h-4 text-blue-600" />
                <span>Portal Sign In</span>
              </button>
            </div>

            {/* Micro Trust Points */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200/90">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Sequential ID Engine</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Encrypted Document Vault</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Award className="w-4 h-4 text-amber-600 shrink-0" />
                <span>SOC2 & I-9 Compliant</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-End Live Interactive Preview Card */}
          <div className="lg:col-span-5 relative">
            <div className="enterprise-card-nested shadow-xl">
              <div className="card-core space-y-4">
                {/* Header in simulated card */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-mono text-slate-400 ml-1 font-semibold">portal.shinetek.com</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                    LIVE SYSTEM
                  </span>
                </div>

                {/* Simulated Employee Dossier Card */}
                <div className="p-4 bg-linear-to-br from-slate-900 via-[#0a192f] to-[#071524] text-white rounded-xl relative overflow-hidden shadow-md">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-base font-display text-white shadow-xs">
                        JV
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">Johnathan Vance</h4>
                        <p className="text-[11px] text-blue-200 font-medium">Principal Cloud Architect</p>
                        <div className="inline-block mt-1 bg-white/10 px-2 py-0.2 rounded font-mono text-[10px] text-amber-300 font-bold border border-white/10">
                          ID: SH-2005
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Client Placement</span>
                      <span className="font-semibold text-slate-200">Apple Inc. (Apex)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Pay Rate</span>
                      <span className="font-mono font-bold text-emerald-300">$85.00 / hr</span>
                    </div>
                  </div>
                </div>

                {/* Quick Interactive Portals Navigation */}
                <div className="space-y-2 pt-1">
                  <div
                    onClick={onNavigateLogin}
                    className="p-3 bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          Employee Portal Access
                        </p>
                        <p className="text-[11px] text-slate-500">Timesheets, Pay Stubs, & Document Vault</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>

                  <div
                    onClick={onNavigateAdminLogin}
                    className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0f2b48] text-white flex items-center justify-center font-bold">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">
                          HR & Administrator Suite
                        </p>
                        <p className="text-[11px] text-slate-500">Approvals, Vendor Rates, & System Config</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid Platform Capabilities */}
        <section className="mt-20 sm:mt-28 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-slate-700 text-xs font-bold font-display">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Engineered for Enterprise Compliance</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-display">
              Everything Needed to Manage a High-Performance Workforce
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Integrated modules purpose-built for IT consultancy operations, legal compliance, and multi-currency billing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {/* Bento Card 1: Sequential ID */}
            <div className="enterprise-card p-6 bg-white space-y-3 md:col-span-2">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold border border-blue-200/60">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Automated Sequential Employee ID Generator
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Auto-increments unique IDs (e.g. <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">SH-2026-0001</span>) upon HR approval with configurable prefix and padding lengths.
              </p>
              <div className="pt-2 flex items-center gap-2 font-mono text-xs text-blue-700 font-bold bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                <span>Next Sequential:</span>
                <span className="bg-white px-2 py-0.5 rounded border border-blue-200 shadow-2xs">SH-2026-0008</span>
              </div>
            </div>

            {/* Bento Card 2: Document Vault */}
            <div className="enterprise-card p-6 bg-white space-y-3 md:col-span-1 lg:col-span-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-200/60">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Private Encrypted Document Vault
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stores signed W-4, I-9, Passport, and Visa documents with restricted tokenized streaming and in-app modal preview.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {['W-4 Tax Form', 'I-9 Verification', 'US Visa', 'Passport Copy'].map((doc, idx) => (
                  <span key={idx} className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">
                    {doc}
                  </span>
                ))}
              </div>
            </div>

            {/* Bento Card 3: Dual Currency */}
            <div className="enterprise-card p-6 bg-white space-y-3 md:col-span-1 lg:col-span-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-200/60">
                <Receipt className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Dual-Currency Compensation & Multi-Vendor
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Handles USD & INR payroll with W2 hourly and monthly fixed compensation tracking alongside client invoice generation.
              </p>
            </div>

            {/* Bento Card 4: Timesheets */}
            <div className="enterprise-card p-6 bg-white space-y-3 md:col-span-2">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold border border-purple-200/60">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Work-Period Timesheet Authorization
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consultants submit work hours with supporting PDF/Excel attachments; managers review and batch-authorize for payroll dispatch.
              </p>
            </div>
          </div>
        </section>

        {/* Global Operations Footprint */}
        <section className="mt-20 py-10 px-6 sm:px-10 bg-linear-to-r from-[#071524] via-[#0b1f36] to-[#0f2b48] text-white rounded-3xl relative overflow-hidden shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center relative z-10">
            <div className="md:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 font-display">
                <Globe2 className="w-4 h-4" />
                <span>Global Corporate Infrastructure</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
                Operating Across USA & India Technology Hubs
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
                Shineteck Inc. powers Fortune 500 digital transformations with premier staffing augmentation and software engineering teams.
              </p>
            </div>

            <div className="md:col-span-4 flex flex-col sm:flex-row md:flex-col gap-3 justify-end">
              <button
                type="button"
                onClick={onNavigateRegister}
                className="px-5 py-3 bg-[#e27a3f] hover:bg-[#d56d33] text-white text-xs font-bold rounded-xl text-center transition-all cursor-pointer shadow-sm"
              >
                Join As Consultant
              </button>
              <button
                type="button"
                onClick={onNavigateAdminLogin}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl text-center border border-white/20 transition-all cursor-pointer"
              >
                Operations Login
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Corporate Footer */}
      <footer className="bg-white border-t border-slate-200/90 py-8 px-4 sm:px-8 text-xs text-slate-500 mt-16 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShineteckLogo size="sm" />
            <span className="text-slate-400">|</span>
            <p>© {new Date().getFullYear()} Shineteck Inc. All rights reserved.</p>
          </div>
          <div className="flex items-center gap-6 font-medium text-slate-600">
            <button type="button" onClick={onNavigateLogin} className="hover:text-blue-600 transition-colors cursor-pointer">
              Employee Portal
            </button>
            <button type="button" onClick={onNavigateAdminLogin} className="hover:text-blue-600 transition-colors cursor-pointer">
              Admin Suite
            </button>
            <button type="button" onClick={onNavigateRegister} className="hover:text-blue-600 transition-colors cursor-pointer">
              Onboarding
            </button>
            <span className="text-slate-400">HR: hr@shinetek.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

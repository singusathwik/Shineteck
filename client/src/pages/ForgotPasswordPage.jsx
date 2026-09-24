import React from 'react';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { ShineteckLogo } from '../components/common/ShineteckLogo.jsx';

export function ForgotPasswordPage({ onNavigateLogin }) {
  return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6"><section className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md space-y-5">
    <ShineteckLogo size="md" /><KeyRound className="text-slate-600" />
    <h1 className="text-2xl font-bold text-slate-900">Account recovery</h1>
    <p className="text-slate-600">Contact your HR administrator to recover your account. Administrators should contact the super admin.</p>
    <p className="text-sm text-slate-500">Self-service email recovery is not configured for this portal.</p>
    <button onClick={onNavigateLogin} className="inline-flex items-center gap-2 font-semibold text-slate-800"><ArrowLeft size={16} />Back to sign in</button>
  </section></div>;
}

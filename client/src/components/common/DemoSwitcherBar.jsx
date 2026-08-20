import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { ShieldCheck, UserCheck, Clock, AlertTriangle, UserPlus, ChevronDown } from 'lucide-react';

export function DemoSwitcherBar({ onNavigateRegister }) {
  const { user, login, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const demoAccounts = [
    {
      label: 'Admin (HR Manager)',
      email: 'admin@shinetek.com',
      pass: 'Admin@1234',
      role: 'admin',
      badge: 'Admin Portal',
      icon: ShieldCheck,
      color: 'text-indigo-600'
    },
    {
      label: 'Johnathan Vance (Approved)',
      email: 'johnathan.vance@shinetek.com',
      pass: 'Password@123',
      role: 'employee',
      badge: 'Approved',
      icon: UserCheck,
      color: 'text-emerald-600'
    },
    {
      label: 'Emily Chen (Pending Review)',
      email: 'emily.chen@shinetek.com',
      pass: 'Password@123',
      role: 'employee',
      badge: 'Pending Review',
      icon: Clock,
      color: 'text-amber-600'
    },
    {
      label: 'Marcus Brody (Needs Correction)',
      email: 'marcus.brody@shinetek.com',
      pass: 'Password@123',
      role: 'employee',
      badge: 'Needs Correction',
      icon: AlertTriangle,
      color: 'text-orange-600'
    }
  ];

  const handleQuickLogin = async (acc) => {
    setIsLoading(true);
    setIsOpen(false);
    try {
      await login(acc.email, acc.pass);
    } catch (err) {
      alert(`Login failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#0b1e33] text-slate-300 text-xs px-4 py-1.5 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 z-50">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-white tracking-wide flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Shinetek Inc. Enterprise Portal
        </span>
        <span className="hidden sm:inline text-slate-400">|</span>
        <span className="hidden sm:inline text-slate-400">
          {user ? `Logged in as: ${user.fullName} (${user.role.toUpperCase()})` : 'Not Logged In'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded border border-slate-600 text-[11px] font-medium transition-colors"
          >
            <span>Switch Role / Test Persona</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-white text-slate-800 rounded-md shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Switch Demo Persona
              </div>
              {demoAccounts.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.email}
                    onClick={() => handleQuickLogin(acc)}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${acc.color}`} />
                      <div>
                        <p className="font-medium text-slate-800 leading-tight">{acc.label}</p>
                        <p className="text-[10px] text-slate-400">{acc.email}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {onNavigateRegister && (
          <button
            type="button"
            onClick={onNavigateRegister}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium transition-colors"
          >
            <UserPlus className="w-3 h-3" />
            <span>New Registration</span>
          </button>
        )}

        {user && (
          <button
            type="button"
            onClick={logout}
            className="px-2 py-1 text-slate-400 hover:text-white text-[11px] transition-colors"
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  );
}

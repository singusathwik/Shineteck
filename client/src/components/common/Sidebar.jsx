import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  User,
  Clock,
  FileText,
  DollarSign,
  Bell,
  Users,
  UserCheck,
  Sliders,
  ShieldCheck,
  Building2,
  Receipt,
  X,
  ChevronRight,
  Shield,
  Sparkles
} from 'lucide-react';
import { ShineteckLogo } from './ShineteckLogo.jsx';

export function Sidebar({ activeTab, onSelectTab, isOpen, onClose }) {
  const { user, isAdmin } = useAuth();

  const employeeGroups = [
    {
      groupTitle: 'WORKSPACE',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'profile', label: 'My Profile & ID', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell }
      ]
    },
    {
      groupTitle: 'WORK & COMPLIANCE',
      items: [
        { id: 'timesheet', label: 'Timesheets', icon: Clock },
        { id: 'documents', label: 'Document Vault', icon: FileText },
        { id: 'payroll', label: 'Pay Stubs & Statements', icon: DollarSign }
      ]
    }
  ];

  const adminGroups = [
    {
      groupTitle: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
        { id: 'approvals', label: 'Employee Approvals', icon: UserCheck }
      ]
    },
    {
      groupTitle: 'STAFF & PLACEMENTS',
      items: [
        { id: 'employees', label: 'Employee Directory', icon: Users },
        { id: 'vendors', label: 'Vendor Placements', icon: Building2 },
        { id: 'timesheets', label: 'Timesheet Approvals', icon: Clock }
      ]
    },
    {
      groupTitle: 'FINANCE & PAYROLL',
      items: [
        { id: 'payroll-entries', label: 'Payroll Information', icon: Receipt },
        { id: 'payroll', label: 'Payroll Management', icon: DollarSign }
      ]
    },
    {
      groupTitle: 'SYSTEM & AUDIT',
      items: [
        { id: 'settings', label: 'ID & System Settings', icon: Sliders },
        { id: 'audit', label: 'Security & Audit Logs', icon: ShieldCheck }
      ]
    }
  ];

  const navGroups = isAdmin ? adminGroups : employeeGroups;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel - Executive Slate/Navy Theme */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#071524] text-slate-300 border-r border-slate-800 transition-transform duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] lg:translate-x-0 lg:static lg:z-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Mobile Header in Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/80 lg:hidden bg-slate-900/60">
          <ShineteckLogo size="sm" textColor="white" />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Context Banner */}
        <div className="px-4 py-4 border-b border-slate-800/90 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold text-xs shrink-0 shadow-inner font-display">
              {isAdmin ? 'ADM' : (user?.firstName ? user.firstName.charAt(0) : 'EMP')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate font-display">
                {user?.fullName || 'User Profile'}
              </div>
              <div className="text-[10.5px] text-slate-400 font-mono truncate font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>{isAdmin ? 'System Administrator' : user?.employeeId || 'Consultant'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grouped Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto custom-scrollbar">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-display">
                {group.groupTitle}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md font-bold'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white hover:translate-x-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 transition-transform ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/80 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer System Status */}
        <div className="p-3.5 border-t border-slate-800/80 bg-slate-900/60 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[10.5px] font-bold text-slate-300 font-display">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-status-pulse" />
            <span>Shineteck Enterprise</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5 font-mono">SOC-2 & 256-Bit SSL Protected</p>
        </div>
      </aside>
    </>
  );
}

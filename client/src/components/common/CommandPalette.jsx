import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  Search,
  LayoutDashboard,
  User,
  Clock,
  FileText,
  DollarSign,
  Bell,
  Users,
  UserCheck,
  Building2,
  Sliders,
  ShieldAlert,
  LogOut,
  ArrowRight,
  Sparkles,
  Command,
  X
} from 'lucide-react';

export function CommandPalette({ isOpen, onClose, onNavigateTab }) {
  const { user, isAdmin, isEmployee, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // List of all searchable actions
  const allActions = [
    // Common / Employee
    ...(isEmployee ? [
      { id: 'emp-dash', title: 'Employee Dashboard', subtitle: 'View work overview and stats', category: 'Navigation', icon: LayoutDashboard, tab: 'dashboard' },
      { id: 'emp-prof', title: 'My Profile & ID Badge', subtitle: 'View contact details and holographic badge', category: 'Navigation', icon: User, tab: 'profile' },
      { id: 'emp-time', title: 'Work Timesheets', subtitle: 'Submit hours and view status', category: 'Navigation', icon: Clock, tab: 'timesheet' },
      { id: 'emp-doc', title: 'Document Vault', subtitle: 'W-4, I-9, Passport, and Visa files', category: 'Navigation', icon: FileText, tab: 'documents' },
      { id: 'emp-pay', title: 'Pay Statements', subtitle: 'Earnings history and net payouts', category: 'Navigation', icon: DollarSign, tab: 'payroll' },
      { id: 'emp-notif', title: 'Notifications Center', subtitle: 'Read corporate alerts', category: 'Navigation', icon: Bell, tab: 'notifications' }
    ] : []),

    // Admin Suite
    ...(isAdmin ? [
      { id: 'adm-dash', title: 'Executive Operations Dashboard', subtitle: 'Workforce KPIs and approval feeds', category: 'Admin Suite', icon: LayoutDashboard, tab: 'dashboard' },
      { id: 'adm-emp', title: 'Employee Directory & Lifecycle', subtitle: 'Manage all consultant records', category: 'Admin Suite', icon: Users, tab: 'employees' },
      { id: 'adm-app', title: 'Onboarding Approvals Dossier', subtitle: 'Review pending applications and verify IDs', category: 'Admin Suite', icon: UserCheck, tab: 'approvals' },
      { id: 'adm-time', title: 'Timesheet Approvals', subtitle: 'Authorize periodic consultant hours', category: 'Admin Suite', icon: Clock, tab: 'timesheets' },
      { id: 'adm-ven', title: 'Vendor Placements & Billing', subtitle: 'Client contracts and billing rates', category: 'Admin Suite', icon: Building2, tab: 'vendors' },
      { id: 'adm-paye', title: 'Dual-Currency Payroll Repository', subtitle: 'Monthly gross and net disbursement entries', category: 'Admin Suite', icon: DollarSign, tab: 'payroll-entries' },
      { id: 'adm-set', title: 'Sequential ID Generator Settings', subtitle: 'Configure Prefix, Digits, and Next Counter', category: 'Admin Suite', icon: Sliders, tab: 'settings' },
      { id: 'adm-aud', title: 'Security Audit Logs', subtitle: 'Track user sessions and compliance events', category: 'Admin Suite', icon: ShieldAlert, tab: 'audit' }
    ] : []),

    // System Actions
    { id: 'act-logout', title: 'Sign Out of Portal', subtitle: 'End your current corporate session', category: 'Account', icon: LogOut, action: () => logout() }
  ];

  // Filter actions based on query
  const filteredActions = allActions.filter(item => {
    if (!query.trim()) return true;
    const q = query.toLowerCase().trim();
    return (
      item.title.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredActions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredActions.length) % Math.max(1, filteredActions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredActions[selectedIndex];
      if (selected) {
        executeAction(selected);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const executeAction = (item) => {
    if (item.action) {
      item.action();
    } else if (item.tab && onNavigateTab) {
      onNavigateTab(item.tab);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 sm:p-6 pt-20 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150">
        
        {/* Search Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200 bg-slate-50/80">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, page, or search query..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10.5px] font-mono font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
              ESC to exit
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar max-h-[360px]">
          {filteredActions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50 stroke-1" />
              <p className="font-bold text-slate-700">No matching commands or pages found.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try searching for "Dashboard", "Timesheets", "Profile", or "Settings"</p>
            </div>
          ) : (
            filteredActions.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => executeAction(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all text-xs ${
                    isSelected
                      ? 'bg-blue-50 text-blue-950 font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{item.title}</p>
                      <p className="text-[11px] text-slate-400 font-medium truncate">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-2">
            <span>Navigate with <strong className="font-mono text-slate-600">↑ ↓</strong></span>
            <span>Select with <strong className="font-mono text-slate-600">↵ Enter</strong></span>
          </div>
          <span>Shineteck Quick Command</span>
        </div>

      </div>
    </div>
  );
}

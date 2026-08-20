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
  ShieldAlert,
  Building2,
  Receipt,
  X
} from 'lucide-react';

export function Sidebar({ activeTab, onSelectTab, isOpen, onClose }) {
  const { user, isAdmin } = useAuth();

  const employeeNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'timesheet', label: 'Timesheets', icon: Clock },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'payroll', label: 'Payment / Payroll', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const adminNavItems = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'approvals', label: 'Employee Approvals', icon: UserCheck },
    { id: 'employees', label: 'Employee Directory', icon: Users },
    { id: 'vendors', label: 'Vendor Details', icon: Building2 },
    { id: 'payroll-entries', label: 'Payroll Information', icon: Receipt },
    { id: 'timesheets', label: 'Timesheet Approvals', icon: Clock },
    { id: 'payroll', label: 'Payroll Management', icon: DollarSign },
    { id: 'settings', label: 'ID & System Settings', icon: Sliders },
    { id: 'audit', label: 'Audit Trail Logs', icon: ShieldAlert }
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Mobile Header in Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden bg-slate-50">
          <span className="font-bold text-sm text-slate-800">Portal Navigation</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card Summary in Sidebar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              {isAdmin ? 'System Administrator' : 'Employee ID'}
            </span>
            <div className="font-bold text-slate-800 truncate">
              {isAdmin ? 'Full Corporate Access' : user?.employeeId || 'Pending'}
            </div>
            <div className="text-[11px] text-slate-500 truncate mt-0.5">
              {user?.fullName}
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/60 text-center">
          <p className="text-[10px] text-slate-400">Shineteck Inc. HR Platform v1.0</p>
          <p className="text-[10px] text-slate-400">SOC2 Type II & Fed Compliant</p>
        </div>
      </aside>
    </>
  );
}

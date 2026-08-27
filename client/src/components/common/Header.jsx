import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { NotificationDropdown } from './NotificationDropdown.jsx';
import { LogOut, Menu, User, ShieldCheck, Building } from 'lucide-react';
import { ShineteckLogo } from './ShineteckLogo.jsx';

export function Header({ onToggleSidebar, activePortal = 'employee' }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Left: Brand & Mobile Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none transition-colors"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-3">
              <ShineteckLogo size="sm" />
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
                <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                  {isAdmin ? 'Corporate Operations Hub' : 'Employee Portal'}
                </span>
                <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                  v2.4
                </span>
              </div>
            </div>
          </div>

          {/* Right: Notification & User Profile Actions */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            <NotificationDropdown />

            {user && (
              <div className="flex items-center gap-3 pl-2.5 sm:pl-3.5 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 border border-slate-300 flex items-center justify-center shrink-0 shadow-2xs">
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-slate-500" />
                  )}
                </div>

                <div className="hidden md:block text-left">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span className="font-bold text-xs text-slate-900 truncate max-w-[130px]">
                      {user.fullName}
                    </span>
                    {user.role === 'admin' ? (
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" /> Admin
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] px-1.5 py-0.5 rounded font-semibold font-mono">
                        {user.employeeId}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate max-w-[160px] font-medium">
                    {user.designation || (user.role === 'admin' ? 'System Administrator' : 'Staff Consultant')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                  title="Sign out from portal"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

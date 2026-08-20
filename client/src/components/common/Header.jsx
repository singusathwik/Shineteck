import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { NotificationDropdown } from './NotificationDropdown.jsx';
import { LogOut, Menu, User, Shield } from 'lucide-react';
import { ShineteckLogo } from './ShineteckLogo.jsx';

export function Header({ onToggleSidebar, activePortal = 'employee' }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="bg-[#0f2b48] border-b border-[#1b3d63] text-white sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Mobile Toggle */}
          <div className="flex items-center gap-3 sm:gap-4">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-[#1b3d63] lg:hidden focus:outline-none"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-3">
              <ShineteckLogo size="sm" textColor="white" />
              <span className="text-[11px] text-slate-300 hidden sm:inline-block font-normal tracking-wide pl-2 border-l border-slate-700">
                {isAdmin ? 'Corporate Admin & HR Portal' : 'Employee Onboarding & Portal'}
              </span>
            </div>
          </div>

          {/* Right: User Profile & Actions */}
          <div className="flex items-center gap-3 sm:gap-5">
            <NotificationDropdown />

            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-700">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0">
                  {user.profileImageUrl ? (
                    <img src={user.profileImageUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-slate-300" />
                  )}
                </div>

                <div className="hidden md:block text-left text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-white truncate max-w-[130px]">{user.fullName}</span>
                    {user.role === 'admin' ? (
                      <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] px-1.5 py-0.2 rounded font-semibold flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" /> Admin
                      </span>
                    ) : (
                      <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                        {user.employeeId}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 block truncate max-w-[160px]">{user.designation}</span>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-[#1b3d63] rounded-md transition-colors"
                  title="Sign out"
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

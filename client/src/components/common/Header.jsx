import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { NotificationDropdown } from './NotificationDropdown.jsx';
import { EmployeeAvatar } from './EmployeeAvatar.jsx';
import { LogOut, Menu, User, ShieldCheck, Sparkles, Search, Command } from 'lucide-react';
import { ShineteckLogo } from './ShineteckLogo.jsx';

export function Header({ onToggleSidebar, onOpenCommandPalette, activePortal = 'employee' }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="glass-header sticky top-0 z-40 transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand & Mobile Toggle */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 lg:hidden focus:outline-none transition-all cursor-pointer border border-transparent hover:border-slate-700"
                aria-label="Toggle navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-3">
              <ShineteckLogo size="sm" textColor="white" />
              <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-700/80">
                <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase font-display">
                  {isAdmin ? 'Operations Hub' : 'Employee Portal'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-950/80 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700/60 font-mono">
                  <Sparkles className="w-2.5 h-2.5" /> v2.4
                </span>
              </div>
            </div>
          </div>

          {/* Center: Command Palette Trigger */}
          {onOpenCommandPalette && (
            <div className="hidden md:flex flex-1 max-w-md mx-auto">
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-400 transition-all shadow-2xs group cursor-pointer"
              >
                <span className="flex items-center gap-2 text-slate-300 group-hover:text-white">
                  <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  <span>Search commands, directory, or records...</span>
                </span>
                <kbd className="inline-flex items-center gap-0.5 font-mono text-[10.5px] font-bold text-slate-300 bg-slate-700 border border-slate-600 px-1.5 py-0.5 rounded shadow-2xs">
                  Ctrl K
                </kbd>
              </button>
            </div>
          )}

          {/* Right: Notification & User Profile Actions */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            {onOpenCommandPalette && (
              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="p-2 md:hidden text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all border border-slate-700/60"
                title="Search Command Palette (Ctrl+K)"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            <NotificationDropdown />

            {user && (
              <div className="flex items-center gap-3 pl-2.5 sm:pl-3.5 border-l border-slate-700/80">
                <div className="flex items-center gap-2.5 p-1 sm:pr-3 rounded-full bg-slate-800/90 border border-slate-700 shadow-2xs hover:bg-slate-800 transition-colors">
                  <EmployeeAvatar
                    name={user.fullName}
                    imageUrl={user.profileImageUrl}
                    size="sm"
                  />

                  <div className="hidden md:block text-left">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <span className="font-bold text-xs text-white truncate max-w-[130px]">
                        {user.fullName}
                      </span>
                      {user.role === 'admin' ? (
                        <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold inline-flex items-center gap-0.5 uppercase tracking-wider">
                          <ShieldCheck className="w-2.5 h-2.5" /> Admin
                        </span>
                      ) : (
                        <span className="bg-slate-700 text-slate-200 text-[10px] px-1.5 py-0.2 rounded font-semibold font-mono border border-slate-600">
                          {user.employeeId}
                        </span>
                      )}
                    </div>
                    <span className="text-[10.5px] text-slate-300 block truncate max-w-[160px] font-medium">
                      {user.designation || (user.role === 'admin' ? 'System Administrator' : 'Staff Consultant')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl border border-transparent hover:border-rose-900/60 transition-all cursor-pointer shadow-2xs"
                  title="Sign out from portal"
                  aria-label="Sign out"
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

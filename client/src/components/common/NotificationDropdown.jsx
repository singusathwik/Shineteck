import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api.js';
import { Bell, Check, Info, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer shadow-2xs hover:border-slate-600"
        title="Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-blue-500 text-white text-[10px] font-bold font-mono rounded-full flex items-center justify-center shadow-xs border-2 border-[#091c33] animate-status-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-slate-900/98 backdrop-blur-xl text-slate-100 rounded-2xl shadow-2xl border border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-850 rounded-t-xl">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-white font-display">System Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-700/80 px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold cursor-pointer transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center text-xs text-slate-400">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50 stroke-1" />
                <p className="font-bold text-slate-300">All caught up!</p>
                <p className="text-[11px] text-slate-500 mt-0.5">No pending notifications at this time.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                  className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                    n.is_read ? 'opacity-70 hover:bg-slate-800/40' : 'bg-blue-950/30 hover:bg-blue-950/50'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {n.type === 'error' && (
                      <div className="w-6 h-6 rounded-lg bg-rose-950 text-rose-400 flex items-center justify-center border border-rose-800/60">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {n.type === 'success' && (
                      <div className="w-6 h-6 rounded-lg bg-emerald-950 text-emerald-400 flex items-center justify-center border border-emerald-800/60">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    )}
                    {(!n.type || n.type === 'info') && (
                      <div className="w-6 h-6 rounded-lg bg-blue-950 text-blue-400 flex items-center justify-center border border-blue-800/60">
                        <Info className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold text-white truncate font-display">{n.title}</p>
                      {!n.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 ring-2 ring-blue-400/40 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{n.message}</p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1.5 block">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {!n.is_read && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n.id);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-400 shrink-0 cursor-pointer transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

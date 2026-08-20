import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Bell, Check, CheckCircle2, AlertTriangle, Info, CheckCheck } from 'lucide-react';

export function EmployeeNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAll = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="enterprise-card p-6 bg-white border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications Center</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time updates regarding registration review, document approvals, and timesheets
          </p>
        </div>

        {notifications.some(n => !n.is_read) && (
          <button
            type="button"
            onClick={handleMarkAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark All as Read
          </button>
        )}
      </div>

      <div className="enterprise-card bg-white border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No notifications available.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 text-xs flex items-start justify-between gap-4 transition-colors ${
                !n.is_read ? 'bg-blue-50/40' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                  {n.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                  {n.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600" />}
                  {(!n.type || n.type === 'info') && <Info className="w-5 h-5 text-blue-600" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-xs">{n.title}</h3>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                    )}
                  </div>
                  <p className="text-slate-600 text-xs mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {!n.is_read && (
                <button
                  type="button"
                  onClick={() => handleMarkRead(n.id)}
                  className="px-2 py-1 text-xs text-slate-500 hover:text-blue-600 font-medium shrink-0"
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

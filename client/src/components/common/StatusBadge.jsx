import React from 'react';

export function StatusBadge({ status, size = 'md' }) {
  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  const normalized = (status || '').toLowerCase().trim();

  if (normalized === 'approved' || normalized === 'paid' || normalized === 'active' || normalized === 'success') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (normalized === 'pending' || normalized === 'pending review' || normalized === 'processing' || normalized === 'scheduled' || normalized === 'uploaded') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (normalized === 'needs replacement' || normalized === 'needs correction') {
    colorClasses = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (normalized === 'rejected' || normalized === 'suspended' || normalized === 'invalid' || normalized === 'failure') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs font-medium' 
    : size === 'lg'
    ? 'px-3.5 py-1 text-sm font-semibold'
    : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${colorClasses} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        normalized.includes('approved') || normalized === 'paid' || normalized === 'active'
          ? 'bg-emerald-500'
          : normalized.includes('pending') || normalized === 'processing' || normalized === 'uploaded'
          ? 'bg-amber-500'
          : normalized.includes('needs')
          ? 'bg-orange-500'
          : 'bg-rose-500'
      }`} />
      {status || 'Unknown'}
    </span>
  );
}

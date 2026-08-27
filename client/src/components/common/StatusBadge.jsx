import React from 'react';

export function StatusBadge({ status, size = 'md', className = '' }) {
  let badgeStyle = 'bg-slate-100/90 text-slate-700 border-slate-200/90 shadow-2xs';
  let dotStyle = 'bg-slate-400';

  const normalized = (status || '').toLowerCase().trim();

  if (['approved', 'paid', 'active', 'success', 'verified', 'completed'].includes(normalized)) {
    badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200/80 shadow-2xs';
    dotStyle = 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]';
  } else if (['pending', 'pending review', 'processing', 'scheduled', 'uploaded', 'submitted'].includes(normalized)) {
    badgeStyle = 'bg-amber-50 text-amber-900 border-amber-200/90 shadow-2xs';
    dotStyle = 'bg-amber-500 animate-status-pulse shadow-[0_0_6px_rgba(245,158,11,0.5)]';
  } else if (['needs replacement', 'needs correction', 'correction requested'].includes(normalized)) {
    badgeStyle = 'bg-orange-50 text-orange-900 border-orange-200/90 shadow-2xs';
    dotStyle = 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.5)]';
  } else if (['rejected', 'suspended', 'invalid', 'failure', 'inactive', 'terminated'].includes(normalized)) {
    badgeStyle = 'bg-rose-50 text-rose-900 border-rose-200/80 shadow-2xs';
    dotStyle = 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]';
  } else if (['h-1b', 'opt', 'cpt', 'gc', 'citizen', 'w2', 'c2c'].includes(normalized)) {
    badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200/80 shadow-2xs';
    dotStyle = 'bg-blue-500';
  }

  const sizeClasses = size === 'xs'
    ? 'px-1.5 py-0.5 text-[10px] font-bold'
    : size === 'sm' 
    ? 'px-2 py-0.5 text-[11px] font-bold' 
    : size === 'lg'
    ? 'px-3.5 py-1 text-xs font-bold'
    : 'px-2.5 py-0.5 text-xs font-bold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border tracking-tight shrink-0 select-none ${badgeStyle} ${sizeClasses} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle}`} />
      <span className="capitalize">{status || 'Unknown'}</span>
    </span>
  );
}

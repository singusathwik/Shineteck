import React from 'react';

export function StatusBadge({ status, size = 'md', className = '' }) {
  let badgeStyle = 'bg-slate-50 text-slate-700 border-slate-200';
  let dotStyle = 'bg-slate-400';

  const normalized = (status || '').toLowerCase().trim();

  if (['approved', 'paid', 'active', 'success', 'verified', 'completed'].includes(normalized)) {
    badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
    dotStyle = 'bg-emerald-500';
  } else if (['pending', 'pending review', 'processing', 'scheduled', 'uploaded', 'submitted'].includes(normalized)) {
    badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200/80';
    dotStyle = 'bg-amber-500 animate-pulse';
  } else if (['needs replacement', 'needs correction', 'correction requested'].includes(normalized)) {
    badgeStyle = 'bg-orange-50 text-orange-800 border-orange-200/80';
    dotStyle = 'bg-orange-500';
  } else if (['rejected', 'suspended', 'invalid', 'failure', 'inactive', 'terminated'].includes(normalized)) {
    badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200/80';
    dotStyle = 'bg-rose-500';
  } else if (['h-1b', 'opt', 'cpt', 'gc', 'citizen', 'w2', 'c2c'].includes(normalized)) {
    badgeStyle = 'bg-blue-50 text-blue-800 border-blue-200/80';
    dotStyle = 'bg-blue-500';
  }

  const sizeClasses = size === 'xs'
    ? 'px-1.5 py-0.5 text-[10px] font-semibold'
    : size === 'sm' 
    ? 'px-2 py-0.5 text-[11px] font-semibold' 
    : size === 'lg'
    ? 'px-3.5 py-1 text-sm font-semibold'
    : 'px-2.5 py-0.5 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border tracking-tight shrink-0 select-none ${badgeStyle} ${sizeClasses} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle}`} />
      <span>{status || 'Unknown'}</span>
    </span>
  );
}

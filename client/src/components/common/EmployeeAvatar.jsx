import React, { useState } from 'react';

const AVATAR_PALETTES = [
  { bg: 'bg-linear-to-br from-blue-600 to-blue-800', text: 'text-white font-bold', border: 'border-blue-700 shadow-blue-500/20' },
  { bg: 'bg-linear-to-br from-indigo-600 to-indigo-800', text: 'text-white font-bold', border: 'border-indigo-700 shadow-indigo-500/20' },
  { bg: 'bg-linear-to-br from-purple-600 to-purple-800', text: 'text-white font-bold', border: 'border-purple-700 shadow-purple-500/20' },
  { bg: 'bg-linear-to-br from-emerald-600 to-emerald-800', text: 'text-white font-bold', border: 'border-emerald-700 shadow-emerald-500/20' },
  { bg: 'bg-linear-to-br from-amber-600 to-amber-800', text: 'text-white font-bold', border: 'border-amber-700 shadow-amber-500/20' },
  { bg: 'bg-linear-to-br from-teal-600 to-teal-800', text: 'text-white font-bold', border: 'border-teal-700 shadow-teal-500/20' },
  { bg: 'bg-linear-to-br from-rose-600 to-rose-800', text: 'text-white font-bold', border: 'border-rose-700 shadow-rose-500/20' },
  { bg: 'bg-linear-to-br from-cyan-600 to-cyan-800', text: 'text-white font-bold', border: 'border-cyan-700 shadow-cyan-500/20' },
  { bg: 'bg-linear-to-br from-slate-700 to-slate-900', text: 'text-white font-bold', border: 'border-slate-800 shadow-slate-500/20' }
];

export function EmployeeAvatar({
  name = '',
  imageUrl = null,
  size = 'md',
  status = null,
  className = ''
}) {
  const [imgError, setImgError] = useState(false);

  // Generate clean initials
  const cleanName = (name || '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const parts = cleanName.split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : (cleanName.length >= 2 ? cleanName.slice(0, 2).toUpperCase() : (cleanName ? cleanName[0].toUpperCase() : 'EP'));

  // Deterministic color palette based on string hash
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-xs tracking-wider',
    lg: 'w-12 h-12 text-sm tracking-wider',
    xl: 'w-16 h-16 text-lg tracking-wider'
  };

  const statusDotSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4'
  };

  return (
    <div className={`relative inline-flex shrink-0 select-none ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-xl overflow-hidden border flex items-center justify-center font-display shadow-xs transition-transform duration-200 hover:scale-105 ${
          imageUrl && !imgError
            ? 'bg-slate-100 border-slate-300 ring-1 ring-slate-200'
            : `${palette.bg} ${palette.text} ${palette.border}`
        }`}
      >
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={name || 'Employee Avatar'}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="drop-shadow-xs">{initials}</span>
        )}
      </div>

      {/* High-contrast status indicator ring */}
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${statusDotSizes[size] || 'w-3 h-3'} rounded-full ring-2 ring-white shadow-xs ${
            status === 'Active' || status === 'Approved'
              ? 'bg-emerald-500'
              : status === 'Pending' || status === 'Pending Review' || status === 'Pending HR Review'
              ? 'bg-amber-500'
              : status === 'Needs Correction'
              ? 'bg-orange-500'
              : status === 'Inactive' || status === 'Rejected'
              ? 'bg-rose-500'
              : 'bg-slate-400'
          }`}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
}

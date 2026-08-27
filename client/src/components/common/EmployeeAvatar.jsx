import React, { useState } from 'react';
import { User } from 'lucide-react';

const AVATAR_PALETTES = [
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-300' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-300' }
];

export function EmployeeAvatar({
  name = '',
  imageUrl = null,
  size = 'md',
  status = null,
  className = ''
}) {
  const [imgError, setImgError] = useState(false);

  // Generate initials
  const parts = (name || '').trim().split(' ').filter(Boolean);
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : (name ? name.slice(0, 2).toUpperCase() : 'EP');

  // Deterministic color palette based on name hash
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-xs font-bold',
    lg: 'w-12 h-12 text-sm font-bold',
    xl: 'w-16 h-16 text-lg font-bold'
  };

  const statusDotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5'
  };

  return (
    <div className={`relative inline-flex shrink-0 select-none ${className}`}>
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-xl overflow-hidden border flex items-center justify-center font-display shadow-2xs transition-transform duration-200 hover:scale-105 ${
          imageUrl && !imgError
            ? 'bg-slate-100 border-slate-200'
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
          <span>{initials}</span>
        )}
      </div>

      {/* Optional Status Pulse Dot */}
      {status && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 ${statusDotSizes[size] || 'w-2.5 h-2.5'} rounded-full ring-2 ring-white ${
            status === 'Active' || status === 'Approved'
              ? 'bg-emerald-500'
              : status === 'Pending' || status === 'Pending Review'
              ? 'bg-amber-500'
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

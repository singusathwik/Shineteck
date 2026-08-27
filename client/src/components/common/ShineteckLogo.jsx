import React, { useState } from 'react';

export function ShineteckLogo({ size = 'md', className = '', showText = true, textColor = 'auto' }) {
  const [imgError, setImgError] = useState(false);

  const heightClasses = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-11',
    xl: 'h-14'
  };

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {!imgError ? (
        <img
          src="/shineteck-logo.png"
          alt="Shineteck Inc."
          className={`${heightClasses[size] || 'h-9'} w-auto object-contain shrink-0`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="inline-flex items-center gap-2">
          {/* Official Geometric Dual-Angle Mark Fallback */}
          <svg
            viewBox="0 0 100 100"
            className={`${heightClasses[size] || 'h-9'} w-auto shrink-0`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M 28 26 L 82 26 L 68 56 L 46 56 Z" fill="#439b61" />
            <path d="M 46 12 L 20 54 L 44 54 L 28 88 L 68 46 L 45 46 Z" fill="#e27a3f" />
          </svg>
          {showText && (
            <span
              className={`font-black tracking-tight text-slate-900 ${
                size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg'
              }`}
            >
              Shineteck <span className="text-[#e27a3f] font-extrabold">Inc</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

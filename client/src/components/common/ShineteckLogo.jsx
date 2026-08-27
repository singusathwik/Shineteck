import React, { useState } from 'react';

export function ShineteckLogo({ size = 'md', className = '', showText = true, textColor = 'auto' }) {
  const [imgError, setImgError] = useState(false);

  const heightClasses = {
    sm: 'h-6 sm:h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-10 sm:h-11',
    xl: 'h-12 sm:h-14'
  };

  const isWhiteText = textColor === 'white';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {!imgError ? (
        <img
          src="/shineteck-logo.png"
          alt="Shineteck Inc."
          className={`${heightClasses[size] || 'h-8'} w-auto object-contain shrink-0 transition-transform duration-200 hover:scale-105`}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="inline-flex items-center gap-2.5">
          {/* Official Geometric Dual-Angle Mark Fallback */}
          <div className="relative shrink-0 filter drop-shadow-xs">
            <svg
              viewBox="0 0 100 100"
              className={`${heightClasses[size] || 'h-8'} w-auto`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M 28 26 L 82 26 L 68 56 L 46 56 Z" fill="#439b61" />
              <path d="M 46 12 L 20 54 L 44 54 L 28 88 L 68 46 L 45 46 Z" fill="#e27a3f" />
            </svg>
          </div>
          {showText && (
            <div className="flex flex-col">
              <span
                className={`font-black tracking-tight font-display leading-none ${
                  isWhiteText ? 'text-white' : 'text-slate-900'
                } ${
                  size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : size === 'xl' ? 'text-3xl' : 'text-lg'
                }`}
              >
                Shineteck <span className="text-[#e27a3f] font-extrabold">Inc</span>
              </span>
              {size !== 'sm' && (
                <span className={`text-[9px] tracking-wider uppercase font-semibold mt-0.5 ${
                  isWhiteText ? 'text-slate-300' : 'text-slate-400'
                }`}>
                  Enterprise Solutions
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React from 'react';

export function ShineteckLogo({ size = 'md', className = '', showText = true, textColor = 'auto' }) {
  // Dimension mapping
  const heightMap = {
    sm: 'h-7',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-18'
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* SVG Icon: Orange Lightning Bolt + Green Chevron matching official Shineteck Inc logo */}
      <svg
        viewBox="0 0 100 100"
        className={`${heightMap[size] || 'h-10'} w-auto shrink-0`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Green Accent Chevron / Diagonal Wing */}
        <path
          d="M 28 26 L 82 26 L 68 56 L 46 56 Z"
          fill="#439b61"
        />
        {/* Orange / Terracotta Dynamic Lightning Bolt */}
        <path
          d="M 46 12 L 20 54 L 44 54 L 28 88 L 68 46 L 45 46 Z"
          fill="#e27a3f"
        />
      </svg>

      {showText && (
        <span
          className={`font-black tracking-tight ${
            size === 'sm'
              ? 'text-lg'
              : size === 'lg'
              ? 'text-3xl'
              : size === 'xl'
              ? 'text-4xl'
              : 'text-2xl'
          } ${
            textColor === 'white'
              ? 'text-white'
              : textColor === 'dark'
              ? 'text-slate-900'
              : 'text-[#e27a3f]'
          }`}
          style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
        >
          Shineteck <span className="font-extrabold text-[#e27a3f]">Inc</span>
        </span>
      )}
    </div>
  );
}

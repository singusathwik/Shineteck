import React from 'react';

export function SkeletonCard({ rows = 3, className = '' }) {
  return (
    <div className={`enterprise-card p-6 bg-white space-y-4 animate-pulse ${className}`}>
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded-md w-1/3"></div>
        <div className="h-4 bg-slate-100 rounded-md w-8"></div>
      </div>
      <div className="h-8 bg-slate-200 rounded-lg w-1/2"></div>
      <div className="space-y-2 pt-2 border-t border-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-100 rounded-md w-full" style={{ width: `${85 - i * 15}%` }}></div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonTableRow({ cols = 7 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div
            className="h-3.5 bg-slate-200 rounded-md"
            style={{ width: i === 0 ? '60px' : i === 1 ? '140px' : '90px' }}
          ></div>
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 7 }) {
  return (
    <div className="table-container">
      <table className="enterprise-table">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <div className="h-3 bg-slate-200 rounded-md w-16"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

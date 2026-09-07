import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Image as ImageIcon, FileSpreadsheet, Paperclip, ChevronDown } from 'lucide-react';
import { exportTimesheetAsPdf, exportTimesheetAsImage, exportTimesheetAsCSV, downloadFromUrl } from '../../utils/fileConverter.js';
import { getAuthToken, getTimesheetDownloadUrl } from '../../services/api.js';

export function TimesheetDownloadMenu({ timesheet, variant = 'compact', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!timesheet) return null;

  const handleDownloadPdf = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    exportTimesheetAsPdf(timesheet);
  };

  const handleDownloadImage = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    exportTimesheetAsImage(timesheet);
  };

  const handleDownloadCSV = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    exportTimesheetAsCSV(timesheet);
  };

  const handleDownloadOriginal = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    const token = getAuthToken();
    const downloadUrl = getTimesheetDownloadUrl(timesheet.id, token);
    downloadFromUrl(downloadUrl, timesheet.file_name || 'timesheet_original.csv');
  };

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      {variant === 'full' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="enterprise-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Download Timesheet</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 rounded-lg transition-colors cursor-pointer"
          title="Download in your choice of format (PDF, Image, CSV, Original)"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate max-w-[120px] font-medium">
            {timesheet.file_name ? timesheet.file_name : 'Download'}
          </span>
          <ChevronDown className="w-3 h-3 text-blue-500 shrink-0" />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-56 rounded-xl bg-white border border-slate-200 shadow-xl py-1 text-xs font-medium animate-in fade-in-0 zoom-in-95 duration-100 divide-y divide-slate-100">
          <div className="px-3 py-1.5 bg-slate-50 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider font-display">
            Select Download Format
          </div>

          <div className="py-1">
            {/* 1. PDF Report */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="w-full px-3 py-2 text-left text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-rose-500 shrink-0" />
              <div>
                <span className="font-bold block text-slate-800">Download as PDF</span>
                <span className="text-[10px] text-slate-400 block font-normal">Official verified corporate report</span>
              </div>
            </button>

            {/* 2. Image (PNG) */}
            <button
              type="button"
              onClick={handleDownloadImage}
              className="w-full px-3 py-2 text-left text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold block text-slate-800">Download as Image (PNG)</span>
                <span className="text-[10px] text-slate-400 block font-normal">High-res graphical card</span>
              </div>
            </button>

            {/* 3. CSV Spreadsheet */}
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="w-full px-3 py-2 text-left text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <span className="font-bold block text-slate-800">Download as Sheet / CSV</span>
                <span className="text-[10px] text-slate-400 block font-normal">Excel-compatible tabular data</span>
              </div>
            </button>
          </div>

          {/* 4. Original Attachment (if available) */}
          <div className="py-1">
            <button
              type="button"
              onClick={handleDownloadOriginal}
              className="w-full px-3 py-2 text-left text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Paperclip className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="font-bold block text-slate-800">
                  {timesheet.file_name ? `Original: ${timesheet.file_name}` : 'Original Raw File'}
                </span>
                <span className="text-[10px] text-slate-400 block font-normal">
                  {timesheet.file_name ? 'Unmodified upload' : 'Auto-generated export'}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Image as ImageIcon, Paperclip, ChevronDown, Loader2 } from 'lucide-react';
import { convertImageToPdfAndDownload, convertPdfToImageAndDownload, downloadFromUrl } from '../../utils/fileConverter.js';
import { getAuthToken, getDocumentStreamUrl } from '../../services/api.js';

export function DocumentDownloadMenu({ doc, variant = 'compact', className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
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

  if (!doc) return null;

  const token = getAuthToken();
  const streamUrl = getDocumentStreamUrl(doc.id, token);
  const isImage = doc.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(doc.file_name);
  const isPdf = doc.mime_type === 'application/pdf' || /\.pdf$/i.test(doc.file_name);

  const handleDownloadPdf = async (e) => {
    e.stopPropagation();
    setIsOpen(false);
    setIsConverting(true);
    try {
      if (isPdf) {
        // Direct download
        downloadFromUrl(streamUrl, doc.file_name);
      } else if (isImage) {
        // Convert image to official PDF
        await convertImageToPdfAndDownload(streamUrl, doc.file_name, {
          docType: doc.document_type,
          employeeId: doc.employee_id
        });
      } else {
        downloadFromUrl(streamUrl, doc.file_name);
      }
    } catch (err) {
      console.warn('PDF conversion failed, falling back to direct download:', err);
      downloadFromUrl(streamUrl, doc.file_name);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadImage = async (e) => {
    e.stopPropagation();
    setIsOpen(false);
    setIsConverting(true);
    try {
      if (isImage) {
        // Direct download image
        downloadFromUrl(streamUrl, doc.file_name);
      } else if (isPdf) {
        // Convert PDF page to PNG
        await convertPdfToImageAndDownload(streamUrl, doc.file_name);
      } else {
        downloadFromUrl(streamUrl, doc.file_name);
      }
    } catch (err) {
      console.warn('Image conversion failed, falling back to direct download:', err);
      downloadFromUrl(streamUrl, doc.file_name);
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownloadOriginal = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    downloadFromUrl(streamUrl, doc.file_name);
  };

  return (
    <div ref={menuRef} className={`relative inline-block text-left ${className}`}>
      {variant === 'full' ? (
        <button
          type="button"
          disabled={isConverting}
          onClick={() => setIsOpen(!isOpen)}
          className="enterprise-btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-60"
        >
          {isConverting ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5 text-blue-600" />
          )}
          <span>{isConverting ? 'Converting...' : 'Download Document'}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          type="button"
          disabled={isConverting}
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
          title="Download in your choice of format (PDF, Image, Original)"
        >
          {isConverting ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="font-medium">Download</span>
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
            {/* 1. Download as PDF */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="w-full px-3 py-2 text-left text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-rose-500 shrink-0" />
              <div>
                <span className="font-bold block text-slate-800">Download as PDF</span>
                <span className="text-[10px] text-slate-400 block font-normal">
                  {isPdf ? 'Native PDF Document' : 'Convert Image to PDF'}
                </span>
              </div>
            </button>

            {/* 2. Download as Image */}
            <button
              type="button"
              onClick={handleDownloadImage}
              className="w-full px-3 py-2 text-left text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold block text-slate-800">Download as Image (PNG)</span>
                <span className="text-[10px] text-slate-400 block font-normal">
                  {isImage ? 'Native Image Graphic' : 'Convert PDF Page to Image'}
                </span>
              </div>
            </button>
          </div>

          {/* 3. Download Original */}
          <div className="py-1">
            <button
              type="button"
              onClick={handleDownloadOriginal}
              className="w-full px-3 py-2 text-left text-slate-700 hover:bg-blue-50 hover:text-blue-900 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Paperclip className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <span className="font-bold block text-slate-800">Original File</span>
                <span className="text-[10px] text-slate-400 block font-normal truncate max-w-[170px]">
                  {doc.file_name}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

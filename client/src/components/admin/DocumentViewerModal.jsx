import React, { useState } from 'react';
import { api, getAuthToken, getDocumentStreamUrl } from '../../services/api.js';
import {
  X,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Eye,
  Shield,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Printer,
  Maximize2
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge.jsx';

export function DocumentViewerModal({ doc, isOpen, onClose, onReviewed }) {
  const [reviewNotes, setReviewNotes] = useState(doc?.review_notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Inspection controls
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!isOpen || !doc) return null;

  const handleAction = async (status) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await api.reviewDocument(doc.id, {
        status,
        reviewNotes
      });
      if (onReviewed) onReviewed();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update document status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const token = getAuthToken();
  const streamUrl = getDocumentStreamUrl(doc.id, token);
  const isImage = doc.mime_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(doc.file_name);

  const handleZoomIn = () => setZoom(z => Math.min(2.5, z + 0.25));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, z - 0.25));
  const handleRotate = () => setRotation(r => (r + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-700" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  {doc.document_type?.toUpperCase()} Verification
                </h3>
                <StatusBadge status={doc.status} size="sm" />
              </div>
              <p className="text-[11px] text-slate-500 font-mono">Employee ID: {doc.employee_id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl shadow-2xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* File Metadata Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">FILE NAME</span>
              <span className="font-semibold text-slate-800 truncate block">{doc.file_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">MIME TYPE</span>
              <span className="font-semibold text-slate-800">{doc.mime_type || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">UPLOADED</span>
              <span className="font-mono text-slate-800">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">CURRENT STATUS</span>
              <span className="font-bold text-slate-800">{doc.status}</span>
            </div>
          </div>

          {/* Inspection Toolbar (For Images) */}
          {isImage && (
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100/80 rounded-xl border border-slate-200 text-xs">
              <span className="text-[11px] font-bold text-slate-500 font-display">Document Inspection Toolbar</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10.5px] font-mono font-bold text-slate-600 px-1">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-3.5 bg-slate-300 mx-1" />
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                  title="Rotate 90° Clockwise"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-white hover:text-slate-900 transition-colors cursor-pointer"
                  title="Reset Zoom & Rotation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Inline Document Preview / Streamer */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-100/70 flex flex-col items-center justify-center min-h-[240px] overflow-hidden">
            {isImage ? (
              <div className="overflow-auto max-h-[360px] w-full flex items-center justify-center p-2">
                <img
                  src={streamUrl}
                  alt="Document Preview"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease-out'
                  }}
                  className="max-h-[300px] max-w-full rounded-lg object-contain border border-slate-300 shadow-md origin-center"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
              </div>
            ) : null}

            <div className={`${isImage ? 'hidden' : 'block'} text-center py-6`}>
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700 mb-1">{doc.file_name}</p>
              <p className="text-[11px] text-slate-500 mb-3 font-medium">PDF / Secure Authorized Compliance Document</p>
              <a
                href={streamUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                Open Document in High-Res Secure Viewer
              </a>
            </div>
          </div>

          {/* Review Feedback / Notes Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 font-display">
              Admin Review Notes / Compliance Notes
            </label>
            <textarea
              rows={2}
              placeholder="Provide reason if requesting replacement or rejecting (e.g., 'Page 2 signature was obscured')..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-blue-600/12 focus:border-blue-600 shadow-2xs"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Admin Review Decision</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('Rejected')}
              className="px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Reject Document
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('Needs Replacement')}
              className="px-3.5 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              Request Replacement
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('Approved')}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              Approve Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

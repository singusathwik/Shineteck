import React, { useState } from 'react';
import { api, getAuthToken, getDocumentStreamUrl } from '../../services/api.js';
import { X, Download, CheckCircle2, XCircle, AlertTriangle, FileText, Eye, Shield } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge.jsx';

export function DocumentViewerModal({ doc, isOpen, onClose, onReviewed }) {
  const [reviewNotes, setReviewNotes] = useState(doc?.review_notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-700" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  {doc.document_type?.toUpperCase()} Verification
                </h3>
                <StatusBadge status={doc.status} size="sm" />
              </div>
              <p className="text-[11px] text-slate-500">Employee ID: {doc.employee_id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* File Metadata Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-md border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">FILE NAME</span>
              <span className="font-medium text-slate-800 truncate block">{doc.file_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">MIME TYPE</span>
              <span className="font-medium text-slate-800">{doc.mime_type || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">UPLOADED</span>
              <span className="font-medium text-slate-800">{new Date(doc.uploaded_at).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block">CURRENT STATUS</span>
              <span className="font-medium text-slate-800">{doc.status}</span>
            </div>
          </div>

          {/* Inline Document Preview / Streamer */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-100 flex flex-col items-center justify-center min-h-[220px]">
            {isImage ? (
              <img
                src={streamUrl}
                alt="Document Preview"
                className="max-h-[300px] max-w-full rounded object-contain border border-slate-300 shadow-xs"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}

            <div className={`${isImage ? 'hidden' : 'block'} text-center py-4`}>
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 mb-1">{doc.file_name}</p>
              <p className="text-[11px] text-slate-500 mb-3">PDF / Secure Authorized Document</p>
              <a
                href={streamUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Open / Download Document in Secure Viewer
              </a>
            </div>
          </div>

          {/* Review Feedback / Notes Input */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Admin Review Notes / Replacement Instructions
            </label>
            <textarea
              rows={2}
              placeholder="Provide reason if requesting replacement or rejecting (e.g., 'Page 2 signature was obscured')..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span>Admin Review Action</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('Needs Replacement')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded transition-colors disabled:opacity-50"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Request Replacement
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('Rejected')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleAction('Approved')}
              className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

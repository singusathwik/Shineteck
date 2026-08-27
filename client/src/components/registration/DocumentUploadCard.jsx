import React, { useRef, useState } from 'react';
import { FileText, Upload, CheckCircle2, AlertCircle, RefreshCw, Trash2, Eye, FileCheck, ExternalLink } from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge.jsx';

export function DocumentUploadCard({
  docKey,
  title,
  description,
  required = true,
  uploadedDoc = null,
  sampleImageUrl = null,
  onUpload,
  onRemove,
  onPreview
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFile = async (file) => {
    setErrorMsg(null);
    if (!file) return;

    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File exceeds maximum size of 10MB.');
      return;
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setErrorMsg('Only PDF, JPG, JPEG, and PNG files are allowed.');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(docKey, file);
    } catch (err) {
      setErrorMsg(err.message || 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const status = uploadedDoc ? (uploadedDoc.status || 'Uploaded') : 'Not Uploaded';

  return (
    <div className={`enterprise-card p-5 sm:p-6 transition-all ${
      uploadedDoc ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-50/60 border-slate-200 hover:border-slate-300'
    }`}>
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
            uploadedDoc ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80' : 'bg-blue-50 text-blue-600 border border-blue-200/80'
          }`}>
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 font-display">{title}</h4>
              {required && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                  *Required
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{description}</p>
          </div>
        </div>

        <StatusBadge status={status} size="sm" />
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 mb-4 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content Area: Side-by-side Template Reference & Upload Zone */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Sample Reference Preview Thumbnail */}
        {sampleImageUrl && (
          <div className="md:col-span-4 bg-slate-100/80 rounded-xl p-3 border border-slate-200 flex flex-col items-center justify-center text-center shadow-2xs">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1 font-display">
              <span>Official Template Preview</span>
            </p>
            <div
              onClick={() => onPreview && onPreview({
                title: `${title} (Sample Template)`,
                previewUrl: sampleImageUrl,
                fileName: `${docKey}_template.png`
              })}
              className="relative w-full h-28 rounded-lg overflow-hidden bg-white border border-slate-200 cursor-pointer group shadow-2xs hover:border-blue-400 transition-all"
            >
              <img
                src={sampleImageUrl}
                alt={title}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-[11px] font-bold text-white bg-slate-900/85 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Eye className="w-3.5 h-3.5" /> View Sample
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onPreview && onPreview({
                title: `${title} (Sample Template)`,
                previewUrl: sampleImageUrl,
                fileName: `${docKey}_template.png`
              })}
              className="text-[11px] text-blue-600 hover:text-blue-800 font-bold mt-2 inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Eye className="w-3 h-3" /> Preview Document Form
            </button>
          </div>
        )}

        {/* Upload / Status Details Zone */}
        <div className={sampleImageUrl ? 'md:col-span-8' : 'md:col-span-12'}>
          {uploadedDoc ? (
            <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-200/80 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold text-slate-800 truncate">{uploadedDoc.fileName || uploadedDoc.file_name}</span>
                </div>
                <span className="text-xs text-slate-500 font-mono font-semibold shrink-0">
                  {formatFileSize(uploadedDoc.fileSize || uploadedDoc.file_size)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-emerald-100 text-xs">
                <span className="text-slate-500 text-[11px] font-medium">
                  Uploaded: {uploadedDoc.uploadedAt ? new Date(uploadedDoc.uploadedAt).toLocaleDateString() : 'Just now'}
                </span>

                <div className="flex items-center gap-2">
                  {onPreview && (
                    <button
                      type="button"
                      onClick={() => onPreview({
                        ...uploadedDoc,
                        title: title,
                        previewUrl: uploadedDoc.filePath?.startsWith('http') || uploadedDoc.filePath?.startsWith('data:')
                          ? uploadedDoc.filePath
                          : sampleImageUrl || uploadedDoc.filePath
                      })}
                      className="inline-flex items-center gap-1 px-3 py-1 text-slate-700 bg-white hover:text-blue-700 font-bold rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1 px-3 py-1 text-slate-700 bg-white hover:text-blue-700 font-bold rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Replace
                  </button>
                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(docKey)}
                      className="inline-flex items-center gap-1 px-3 py-1 text-rose-600 bg-white hover:text-rose-800 font-bold rounded-lg border border-rose-200 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
                  : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 bg-white shadow-2xs'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 border border-blue-100">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800 mb-1 font-display">
                {isUploading ? 'Uploading Document to Vault...' : 'Click to Upload or Drag & Drop File'}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Official PDF or high-resolution JPG/PNG scan (Up to 10.0 MB)
              </p>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        onChange={(e) => {
          if (e.target.files?.[0]) handleFile(e.target.files[0]);
        }}
        className="hidden"
      />
    </div>
  );
}

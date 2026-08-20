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
    <div className={`enterprise-card p-5 border transition-all ${
      uploadedDoc ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
    }`}>
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            uploadedDoc ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
          }`}>
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">{title}</h4>
              {required && <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">*Required</span>}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
        </div>

        <StatusBadge status={status} size="sm" />
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 mb-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content Area: Side-by-side Template Reference & Upload Zone */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Sample Reference Preview Thumbnail */}
        {sampleImageUrl && (
          <div className="md:col-span-4 bg-slate-100 rounded-lg p-2.5 border border-slate-200 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>Official Template Preview</span>
            </p>
            <div
              onClick={() => onPreview && onPreview({
                title: `${title} (Sample Template)`,
                previewUrl: sampleImageUrl,
                fileName: `${docKey}_template.png`
              })}
              className="relative w-full h-28 rounded-md overflow-hidden bg-white border border-slate-200 cursor-pointer group shadow-2xs hover:border-blue-400 transition-all"
            >
              <img
                src={sampleImageUrl}
                alt={title}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-[11px] font-semibold text-white bg-slate-900/80 px-2 py-1 rounded flex items-center gap-1">
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
              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold mt-1.5 inline-flex items-center gap-1"
            >
              <Eye className="w-3 h-3" /> Preview Document Form
            </button>
          </div>
        )}

        {/* Upload / Status Details Zone */}
        <div className={sampleImageUrl ? 'md:col-span-8' : 'md:col-span-12'}>
          {uploadedDoc ? (
            <div className="bg-emerald-50/50 rounded-lg p-4 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">{uploadedDoc.fileName || uploadedDoc.file_name}</span>
                </div>
                <span className="text-xs text-slate-500 font-medium shrink-0">
                  {formatFileSize(uploadedDoc.fileSize || uploadedDoc.file_size)}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-emerald-100 text-xs">
                <span className="text-slate-500 text-[11px]">
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
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-white hover:text-blue-700 font-medium rounded border border-slate-200 shadow-2xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-white hover:text-blue-700 font-medium rounded border border-slate-200 shadow-2xs transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Replace
                  </button>
                  {onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(docKey)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-rose-600 bg-white hover:text-rose-800 font-medium rounded border border-rose-200 shadow-2xs transition-colors"
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
              className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/60'
                  : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 bg-white'
              }`}
            >
              <Upload className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800 mb-1">
                {isUploading ? 'Uploading Document...' : 'Click to Upload or Drag & Drop'}
              </p>
              <p className="text-[11px] text-slate-500">
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

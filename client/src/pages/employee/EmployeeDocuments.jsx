import React, { useState, useEffect } from 'react';
import { api, getAuthToken, getDocumentStreamUrl } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { DocumentUploadCard } from '../../components/registration/DocumentUploadCard.jsx';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Download,
  X
} from 'lucide-react';

export function EmployeeDocuments() {
  const [documents, setDocuments] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchDocuments = async () => {
    try {
      const data = await api.getMyDocuments();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadAuth = async (docType, file) => {
    setStatusMessage(null);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', docType);

      const res = await api.uploadDocAuth(formData);
      setStatusMessage(res.message);
      await fetchDocuments();
    } catch (err) {
      throw err;
    }
  };

  const docTypes = [
    { key: 'w4', title: 'Form W-4 (Employee Withholding Certificate)', desc: 'IRS federal tax withholding certificate' },
    { key: 'i9', title: 'Form I-9 (Employment Eligibility Verification)', desc: 'USCIS verification of identity and employment eligibility' },
    { key: 'passport', title: 'Government Passport Copy', desc: 'Valid government passport bio/photo page' },
    { key: 'visa', title: 'Visa Copy / Work Authorization', desc: 'Work authorization or legal residency proof' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="enterprise-header-banner p-6">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">Required Documents Center</h1>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          View compliance verification statuses and upload updated or replacement documents requested by HR
        </p>
      </div>

      {statusMessage && (
        <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Grid of 4 Document Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docTypes.map((dt) => {
          const doc = documents.find(d => d.document_type === dt.key);
          return (
            <div key={dt.key} className="space-y-2">
              <DocumentUploadCard
                docKey={dt.key}
                title={dt.title}
                description={dt.desc}
                required={true}
                uploadedDoc={doc ? {
                  id: doc.id,
                  fileName: doc.file_name,
                  fileSize: doc.file_size,
                  uploadedAt: doc.uploaded_at,
                  status: doc.status
                } : null}
                onUpload={handleUploadAuth}
                onPreview={() => doc && setPreviewDoc(doc)}
              />

              {doc?.review_notes && doc.status === 'Needs Replacement' && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md text-xs text-orange-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">HR Correction Note: </span>
                    <span>{doc.review_notes}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Secure Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  {previewDoc.document_type?.toUpperCase()} — {previewDoc.file_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 text-center space-y-4">
              <p className="text-xs text-slate-600">
                Document Status: <StatusBadge status={previewDoc.status} size="sm" />
              </p>

              <div className="p-8 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center">
                <FileText className="w-16 h-16 text-slate-400 mb-3" />
                <p className="font-semibold text-xs text-slate-800">{previewDoc.file_name}</p>
                <p className="text-[11px] text-slate-500 mb-4">Secure Shinetek Document Vault</p>
                <a
                  href={getDocumentStreamUrl(previewDoc.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0f2b48] hover:bg-[#1a416b] text-white text-xs font-semibold rounded shadow-xs transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  View in Secure Browser Viewer
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

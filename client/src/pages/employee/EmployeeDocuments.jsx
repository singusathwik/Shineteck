import React, { useState, useEffect } from 'react';
import { api, getAuthToken, getDocumentStreamUrl } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { useCompany } from '../../context/CompanyContext.jsx';
import { DocumentDownloadMenu } from '../../components/documents/DocumentDownloadMenu.jsx';
import {
  FileText,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Download,
  X,
  Globe
} from 'lucide-react';

const INDIA_DOCS = [
  { key: 'driver_license', title: "Driver's License", desc: 'Valid Government Driver\'s License card scan (Front & Back)', required: true },
  { key: 'aadhaar', title: 'Aadhaar Card', desc: 'Official 12-digit Unique Identification Aadhaar card copy', required: true },
  { key: 'pan', title: 'PAN Card (Permanent Account Number)', desc: 'Income Tax Department PAN card copy', required: true },
  { key: 'ach_form', title: 'ACH / Direct Deposit Form', desc: 'Bank account verification details and cancelled cheque copy', required: true },
  { key: 'emergency_contact_form', title: 'Emergency Contact Form', desc: 'Signed Emergency Contact nomination declaration', required: true }
];

const GLOBAL_DOCS = [
  { key: 'i9', title: 'Form I-9 (Employment Eligibility Verification)', desc: 'USCIS verification document with Section 1 completed', required: true },
  { key: 'w4', title: 'Form W-4 / W-9 (Withholding Certificate)', desc: 'IRS federal tax withholding form signed for current fiscal year', required: true },
  { key: 'passport', title: 'Government Passport Copy', desc: 'Valid government passport bio/photograph page', required: true },
  { key: 'visa', title: 'Visa Copy / Work Authorization', desc: 'Work authorization, H-1B, Green Card, or EAD document copy', required: true },
  { key: 'emergency_contact_form', title: 'Emergency Contact Form', desc: 'Emergency contact information form and authorization', required: true },
  { key: 'ach_form', title: 'ACH Payment / Direct Deposit Form', desc: 'Direct deposit authorization and voided cheque / bank statement', required: true },
  { key: 'medical_health_insurance', title: 'Medical Health Insurance Form', desc: 'Corporate medical health insurance plan selection and beneficiary form', required: true },
  { key: 'ssn_copy', title: 'Social Security Card (SSN) Copy', desc: 'Legible copy of official US Social Security Number card', required: true },
  { key: 'driver_license', title: "Driver's License Copy", desc: 'State-issued Driver\'s License or REAL ID identity card', required: true },
  { key: 'i94', title: 'Form I-94 (Arrival/Departure Record)', desc: 'Official DHS / CBP most recent electronic Form I-94 record', required: true },
  { key: 'employee_agreement', title: 'Employee Agreement / Contract', desc: 'Signed Shinetek corporate employment agreement and confidentiality terms', required: false },
  { key: 'offer_letter', title: 'Signed Offer Letter', desc: 'Official countersigned company offer letter and appointment terms', required: false },
  { key: 'e_verify', title: 'E-Verify Document / Verification Record', desc: 'DHS E-Verify case verification documentation or reference document', required: false }
];

const FORMS = { w4: 'https://www.irs.gov/pub/irs-pdf/fw4.pdf', w9: 'https://www.irs.gov/pub/irs-pdf/fw9.pdf', i9: 'https://www.uscis.gov/i-9' };
export function EmployeeDocuments() {
  const { user } = useAuth();
  const { companies = [], selected } = useCompany();
  const [documents, setDocuments] = useState([]), [expiry, setExpiry] = useState({}), [busy, setBusy] = useState(''), [error, setError] = useState(''), [message, setMessage] = useState(''), [loading, setLoading] = useState(true);
  const load = async () => { const data = await api.getMyDocuments(); setDocuments(data.documents || []); };
  useEffect(() => { load().catch(err => setError(err.message)).finally(() => setLoading(false)); }, []);
  const company = companies.find(c => c.id === selected);
  const currentDocTypes = (user?.country || '').toLowerCase() === 'india' ? INDIA_DOCS : [...GLOBAL_DOCS.map(dt => dt.key === 'w4' ? { ...dt, title: 'Form W-4' } : dt), { key: 'w9', title: 'Form W-9', required: false }];
  async function upload(type, file) {
    if (!file) return; setBusy(type); setError(''); setMessage('');
    try { if (!company) throw new Error('Select a company in the workspace before uploading.'); const body = new FormData(); body.append('documentType', type); body.append('expiryDate', expiry[type] ?? documents.find(doc => doc.document_type === type)?.expiry_date ?? ''); body.append('document', file); await api.uploadDocAuth(body); await load(); setMessage('Document uploaded successfully.'); } catch (err) { setError(err.message); } finally { setBusy(''); }
  }
  return <div className="company-access"><h1>Document Vault</h1><p>Upload the documents required for {company?.name || 'your assigned companies'}. Set the expiry date before uploading, where applicable.</p>{error && <p role="alert" className="company-error company-notice">{error}</p>}{message && <p role="status" className="company-notice">{message}</p>}
    <div className="company-panel company-table-wrap"><table className="portal-doc-table"><thead><tr>{['Document Name', 'Form to Download', 'Upload', 'Date Uploaded', 'Document Type', 'Expiry Date'].map(title => <th key={title}>{title}</th>)}</tr></thead><tbody>{currentDocTypes.map(type => {
      const matches = documents.filter(doc => doc.document_type === type.key).sort((a, b) => String(b.uploaded_at).localeCompare(String(a.uploaded_at)));
      const doc = matches[0];
      return <tr key={type.key}><td><strong>{type.title}</strong>{doc ? <><small><a className="underline" href={getDocumentStreamUrl(doc.id)} target="_blank" rel="noreferrer">{doc.file_name}</a></small><small>{doc.status}{doc.review_notes ? ` · ${doc.review_notes}` : ''}</small></> : <small>{loading ? 'Loading…' : 'Not uploaded'}</small>}{!company && matches.length > 1 && <small>Select a company to see its document.</small>}</td><td>{FORMS[type.key] ? <a className="underline" href={FORMS[type.key]} target="_blank" rel="noreferrer">Download form</a> : <span>{['passport', 'visa', 'driver_license', 'aadhaar', 'pan', 'ssn_copy', 'i94', 'e_verify'].includes(type.key) ? 'No blank form required' : 'Provided by your HR team'}</span>}</td><td><label><span className="sr-only">Upload {type.title}</span><input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt" disabled={Boolean(busy) || !company} onChange={e => { upload(type.key, e.target.files?.[0]); e.target.value = ''; }} /></label>{busy === type.key && <small>Uploading…</small>}</td><td>{doc?.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : '—'}</td><td>{type.key.replaceAll('_', ' ').toUpperCase()}</td><td><label><span className="sr-only">Expiry date for {type.title}</span><input type="date" disabled={!company || Boolean(busy)} value={expiry[type.key] ?? doc?.expiry_date ?? ''} onChange={e => setExpiry({ ...expiry, [type.key]: e.target.value })} /></label>{doc?.expiry_date && <small>Saved: {doc.expiry_date}</small>}</td></tr>;
    })}</tbody></table></div><p>Identity records do not have blank forms. Obtain company-specific agreements and forms from your HR team.</p>
  </div>;
}

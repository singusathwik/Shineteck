import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api.js';
import { X, Upload, Clock, FileText, AlertCircle, CheckCircle2, Calculator, Building2, ChevronDown } from 'lucide-react';

export function TimesheetUploadModal({ isOpen, onClose, onSuccess }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [availableVendors, setAvailableVendors] = useState([]);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [autoParsedNote, setAutoParsedNote] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch employee's assigned vendors
      api.getMyVendors().then(data => {
        const vList = data.vendors || [];
        setAvailableVendors(vList);
        if (vList.length > 0 && !vendorName) {
          setVendorName(vList[0].vendor_name);
        }
      }).catch(err => {
        console.warn('Could not load employee vendors:', err);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    setErrorMsg(null);
    setAutoParsedNote(null);
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls', 'pdf'].includes(ext)) {
      setErrorMsg('Invalid file format. Supported: CSV, XLSX, XLS, PDF.');
      return;
    }

    setFile(selectedFile);

    // If CSV file, parse in client for instant calculation preview
    if (ext === 'csv') {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          const lines = text.split('\n');
          let sum = 0;
          let found = false;

          let hourIndex = -1;
          for (let i = 0; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().toLowerCase());
            if (hourIndex === -1) {
              hourIndex = cols.findIndex(c => c.includes('hour') || c.includes('duration'));
            } else {
              const val = parseFloat(cols[hourIndex]);
              if (!isNaN(val) && val > 0 && val <= 24) {
                sum += val;
                found = true;
              }
            }
          }

          if (found && sum > 0) {
            setTotalHours(String(sum));
            setAutoParsedNote(`Auto-calculated ${sum} hours from uploaded CSV file.`);
          }
        } catch (err) {
          console.warn('CSV parsing failed:', err);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!startDate || !endDate) {
      setErrorMsg('Please select both Start Date and End Date.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setErrorMsg('Start date cannot be after end date.');
      return;
    }

    const hoursNum = parseFloat(totalHours);
    if (isNaN(hoursNum) || hoursNum <= 0) {
      setErrorMsg('Please enter valid work hours.');
      return;
    }

    if (!vendorName || !vendorName.trim()) {
      setErrorMsg('Please enter or select the Vendor Name for this timesheet.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('totalHours', totalHours);
      formData.append('vendorName', vendorName.trim());
      if (notes) formData.append('notes', notes);
      if (file) formData.append('timesheetFile', file);

      await api.submitTimesheet(formData);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit timesheet.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0f2b48] text-white">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold">Submit Work-Period Timesheet</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Vendor Name Input with Quick Suggestion Chips */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Vendor / Placement Agency <span className="text-rose-500">*</span>
              </label>
              {availableVendors.length > 0 && (
                <span className="text-[10px] text-blue-700 font-semibold bg-blue-100 px-2 py-0.5 rounded-full">
                  {availableVendors.length} assigned vendor{availableVendors.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                required
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Type or select vendor name (e.g. Apex Systems, TCS, Infosys, Wipro)..."
                className="w-full px-3 py-2 text-xs border border-blue-300 rounded-lg bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              {vendorName && (
                <button
                  type="button"
                  onClick={() => setVendorName('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded"
                  title="Clear vendor name"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick-fill pills for assigned vendors */}
            {availableVendors.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-500 block mb-1">
                  Click to auto-fill:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {availableVendors.map((v) => {
                    const isSelected = vendorName.trim().toLowerCase() === v.vendor_name.trim().toLowerCase();
                    return (
                      <button
                        key={v._id || v.id}
                        type="button"
                        onClick={() => setVendorName(v.vendor_name)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700'
                        }`}
                      >
                        {v.vendor_name} {v.client_name ? `(${v.client_name})` : ''}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-500">
              Type or select the vendor this timesheet belongs to so the admin can verify rates and approve quickly.
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Period Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Period End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Total Hours */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                Total Work Hours <span className="text-rose-500">*</span>
              </label>
              {autoParsedNote && (
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" /> Auto-calculated
                </span>
              )}
            </div>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="240"
              required
              placeholder="e.g. 80.0"
              value={totalHours}
              onChange={(e) => setTotalHours(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {autoParsedNote && (
              <p className="text-[11px] text-emerald-600 mt-1">{autoParsedNote}</p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Attach Timesheet File (CSV, XLSX, PDF)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-xl p-3 text-center cursor-pointer transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-800">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-bold">{file.name}</span>
                  <span className="text-slate-400 font-mono">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Click to attach CSV, Excel, or PDF activity log</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes / Comments (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Completed sprint features and sprint review under vendor client..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isSubmitting ? (
                <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
              ) : (
                'Submit Timesheet'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


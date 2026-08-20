import React, { useState, useRef } from 'react';
import { api } from '../../services/api.js';
import { X, Upload, Clock, FileText, AlertCircle, CheckCircle2, Calculator } from 'lucide-react';

export function TimesheetUploadModal({ isOpen, onClose, onSuccess }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalHours, setTotalHours] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [autoParsedNote, setAutoParsedNote] = useState(null);

  const fileInputRef = useRef(null);

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

    // If CSV file, let's parse in client for instant calculation preview!
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

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('totalHours', totalHours);
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
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2 text-[#0f2b48]">
            <Clock className="w-5 h-5 text-blue-700" />
            <h3 className="text-sm font-bold text-slate-900">Submit Work-Period Timesheet</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Period Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Period End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Total Hours */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Total Work Hours <span className="text-rose-500">*</span>
              </label>
              {autoParsedNote && (
                <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                  <Calculator className="w-3 h-3" /> Auto-calculated
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
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
            />
            {autoParsedNote && (
              <p className="text-[11px] text-slate-500 mt-1">{autoParsedNote}</p>
            )}
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Attach Timesheet File (CSV, XLSX, PDF)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-slate-300 hover:border-blue-400 hover:bg-slate-50 rounded-md p-3 text-center cursor-pointer transition-colors"
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-800">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">{file.name}</span>
                  <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <Upload className="w-4 h-4 text-slate-400" />
                  <span>Click to select CSV, Excel, or PDF timesheet</span>
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
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Notes / Comments (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Completed regular shift work and client feature tasks"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0f2b48] hover:bg-[#1b3d63] rounded transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Timesheet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

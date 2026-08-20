import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Sliders, Save, CheckCircle2, AlertCircle, RefreshCw, Hash, Lock, ShieldCheck } from 'lucide-react';

export function AdminSettings() {
  const [settings, setSettings] = useState({
    id_prefix: 'SH-',
    id_start_number: '2005',
    id_current_seq: '2008',
    id_min_length: '4'
  });
  const [nextIdPreview, setNextIdPreview] = useState('SH-2008');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const fetchSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettings(data.settings);
      setNextIdPreview(data.nextIdPreview);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, val) => {
    setSettings(prev => ({ ...prev, [field]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMessage(null);
    setIsSaving(true);

    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated.settings);
      setNextIdPreview(updated.nextIdPreview);
      setStatusMessage('Employee ID generation settings successfully updated.');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update system settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Compute real-time client format preview
  const previewFormatted = () => {
    let numStr = String(settings.id_current_seq || '2005');
    const minLen = parseInt(settings.id_min_length || '4', 10);
    if (!isNaN(minLen) && numStr.length < minLen) {
      numStr = numStr.padStart(minLen, '0');
    }
    return `${settings.id_prefix || ''}${numStr}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="enterprise-card p-6 bg-white border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">System & Employee ID Configuration</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure atomic sequential Employee ID numbering rules, prefix standards, and padding format
        </p>
      </div>

      {statusMessage && (
        <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-7 enterprise-card p-6 bg-white border-slate-200 space-y-6">
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-blue-600" />
              Employee ID Sequence Parameters
            </h3>

            {/* ID Prefix */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Employee ID Prefix
              </label>
              <input
                type="text"
                placeholder="e.g. SH- or 86 or EMP-"
                value={settings.id_prefix}
                onChange={(e) => handleChange('id_prefix', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Optional corporate prefix attached before the sequential number (e.g. "SH-", "86", or blank).
              </p>
            </div>

            {/* Starting ID Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Configured Base Starting Number
              </label>
              <input
                type="number"
                min="1"
                value={settings.id_start_number}
                onChange={(e) => handleChange('id_start_number', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Initial starting number for sequence (e.g. 2005 or 100001).
              </p>
            </div>

            {/* Minimum Digits Length */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Digits Length (Zero-Padding)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.id_min_length}
                onChange={(e) => handleChange('id_min_length', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Pads with leading zeroes if number length is less than this value (e.g. length 4 pads 5 to 0005).
              </p>
            </div>

            {/* Current Sequence Number Counter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Next Sequence Counter
              </label>
              <input
                type="number"
                min="1"
                value={settings.id_current_seq}
                onChange={(e) => handleChange('id_current_seq', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded font-mono focus:ring-1 focus:ring-blue-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                The next sequential integer to be allocated to the next registering employee.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#0f2b48] hover:bg-[#1a416b] text-white text-xs font-bold rounded shadow-xs transition-colors disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Live ID Preview & Formats Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="enterprise-card p-6 bg-slate-50 border-slate-200 space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-4 h-4 text-blue-600" />
              Live Generator Preview
            </h3>

            <div className="p-4 bg-white rounded-lg border border-blue-200 text-center shadow-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                Next Employee Will Receive
              </span>
              <span className="text-2xl font-extrabold font-mono text-blue-700">
                {previewFormatted()}
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <p className="font-semibold text-slate-800">Supported Corporate Formats Examples:</p>
              <ul className="space-y-1.5 text-[11px] text-slate-600">
                <li>• <strong>SH-2008</strong> (Prefix: "SH-", Start: 2005, MinLen: 4)</li>
                <li>• <strong>860001</strong> (Prefix: "86", Start: 1, MinLen: 4)</li>
                <li>• <strong>2005</strong> (Prefix: "", Start: 2005, MinLen: 4)</li>
                <li>• <strong>EMP-00100</strong> (Prefix: "EMP-", Start: 100, MinLen: 5)</li>
              </ul>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-[11px] text-blue-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <span>
                Atomic SQLite transactions guarantee zero race conditions or duplicate IDs even during simultaneous employee registrations.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

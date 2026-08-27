import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api.js';
import { exportToCSV } from '../../utils/csvExport.js';
import {
  Receipt, Search, Plus, X, Edit3, Trash2, DollarSign, Users,
  ChevronDown, AlertCircle, CheckCircle2, Calendar, Calculator, Clock,
  Globe, Layers, Download
} from 'lucide-react';

function formatMoney(amount, currency = 'USD') {
  const num = parseFloat(amount) || 0;
  if (currency === 'INR') {
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminPayrollEntries() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({
    inrGross: 0, inrHours: 0, inrCount: 0,
    usdGross: 0, usdHours: 0, usdCount: 0,
    totalGross: 0, totalHours: 0, totalEntries: 0
  });
  const [employees, setEmployees] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'INR' | 'USD'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const [form, setForm] = useState({
    employee_id: '', employee_name: '',
    payroll_month: '',
    vendor_name: '', client_name: '',
    total_hours: '', bill_rate: '', emp_bill_rate: '',
    currency: 'USD'
  });

  // Employee search dropdown
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const empDropdownRef = useRef(null);

  const fetchData = async () => {
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (filterMonth) params.month = filterMonth;
      if (activeTab !== 'ALL') params.currency = activeTab;

      const [entryData, empData, vendorData] = await Promise.all([
        api.getAllPayrollEntries(params),
        api.getAllEmployees(),
        api.getAllVendorDetails()
      ]);
      setEntries(entryData.entries || []);
      if (entryData.summary) {
        setSummary(entryData.summary);
      }
      setEmployees(empData.employees || []);
      setVendors(vendorData.vendors || []);
    } catch (err) {
      console.error('Failed to load payroll entries:', err);
    }
  };

  useEffect(() => { fetchData(); }, [activeTab]);
  useEffect(() => {
    const t = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(t);
  }, [searchQuery, filterMonth]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (empDropdownRef.current && !empDropdownRef.current.contains(e.target)) {
        setShowEmpDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-calculations
  const totalHours = parseFloat(form.total_hours) || 0;
  const empBillRate = parseFloat(form.emp_bill_rate) || 0;
  const grossAmount = totalHours * empBillRate;
  const totalBill = totalHours * (parseFloat(form.bill_rate) || 0);

  const filteredEmps = employees.filter(e =>
    e.employee_id?.toLowerCase().includes(empSearch.toLowerCase()) ||
    e.full_name?.toLowerCase().includes(empSearch.toLowerCase())
  );

  const resetForm = () => {
    setForm({
      employee_id: '', employee_name: '',
      payroll_month: '',
      vendor_name: '', client_name: '',
      total_hours: '', bill_rate: '', emp_bill_rate: '',
      currency: 'USD'
    });
    setEmpSearch('');
  };

  const openCreate = () => {
    resetForm();
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const openEdit = (entry) => {
    const cur = entry.currency || (entry.country === 'India' ? 'INR' : 'USD');
    setForm({
      employee_id: entry.employee_id,
      employee_name: entry.employee_name,
      payroll_month: entry.payroll_month,
      vendor_name: entry.vendor_name || '',
      client_name: entry.client_name || '',
      total_hours: String(entry.total_hours),
      bill_rate: String(entry.bill_rate),
      emp_bill_rate: String(entry.emp_bill_rate),
      currency: cur
    });
    setEmpSearch(`${entry.employee_id} — ${entry.employee_name}`);
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  // Auto-fill vendor/client when employee is selected
  const selectEmployee = (emp) => {
    const isIndia = emp.country === 'India';
    const cur = isIndia ? 'INR' : 'USD';

    setForm(f => ({
      ...f,
      employee_id: emp.employee_id,
      employee_name: emp.full_name,
      currency: cur
    }));
    setEmpSearch(`${emp.employee_id} — ${emp.full_name} (${isIndia ? 'India' : 'US/Global'})`);
    setShowEmpDropdown(false);

    // Try to auto-fill vendor/client from vendor details
    const vendorRecord = vendors.find(v => v.employee_id === emp.employee_id);
    if (vendorRecord) {
      setForm(f => ({
        ...f,
        vendor_name: vendorRecord.vendor_name || '',
        client_name: vendorRecord.client_name || '',
        bill_rate: String(vendorRecord.hourly_bill_rate || ''),
        emp_bill_rate: String(vendorRecord.employee_rate || '')
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee_id || !form.payroll_month) {
      setStatusMessage({ type: 'error', text: 'Employee and Payroll Month are required.' });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingEntry) {
        await api.updatePayrollEntry(editingEntry._id || editingEntry.id, form);
        setStatusMessage({ type: 'success', text: 'Payroll entry updated successfully.' });
      } else {
        await api.createPayrollEntry(form);
        setStatusMessage({ type: 'success', text: 'Payroll entry created successfully.' });
      }
      setIsModalOpen(false);
      resetForm();
      await fetchData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save payroll entry.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deletePayrollEntry(id);
      setStatusMessage({ type: 'success', text: 'Payroll entry deleted.' });
      setDeleteConfirm(null);
      await fetchData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete.' });
    }
  };

  const fmtMonth = (m) => {
    if (!m) return '—';
    const [y, mo] = m.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(mo) - 1] || mo} ${y}`;
  };

  const handleExportCSV = () => {
    const formattedData = entries.map(ent => ({
      'Employee ID': ent.employee_id,
      'Employee Name': ent.employee_name,
      'Payroll Month': ent.payroll_month,
      'Total Hours': ent.total_hours,
      'Client Bill Rate': ent.bill_rate,
      'Employee Bill Rate': ent.emp_bill_rate,
      'Gross Amount': ent.gross_amount,
      'Currency': ent.currency,
      'Vendor Name': ent.vendor_name || 'N/A',
      'Client Name': ent.client_name || 'N/A'
    }));
    exportToCSV(formattedData, `Shineteck_Payroll_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-emerald-600" />
            Payroll Information
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monthly payroll billing records — hours, rates, and gross amount calculations for Indian & Global consultants.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="enterprise-btn-secondary"
            title="Download payroll entries as CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openCreate}
            className="enterprise-btn-primary"
          >
            <Plus className="w-4 h-4" /> Add Payroll Entry
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* India Total Billing */}
        <div className="enterprise-card p-4 bg-gradient-to-br from-amber-50/60 to-orange-50/40 border-orange-200 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-orange-950 flex items-center gap-1.5">
              <span>🇮🇳</span>
              <span>Indian Billing (INR)</span>
            </span>
            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full font-bold text-[10px]">
              {summary.inrCount} entries
            </span>
          </div>
          <div className="text-lg font-extrabold font-mono text-orange-950">
            {formatMoney(summary.inrGross, 'INR')}
          </div>
          <p className="text-[11px] text-orange-800/80 mt-1">
            Total Hours: <span className="font-bold">{summary.inrHours.toFixed(1)} hrs</span>
          </p>
        </div>

        {/* US & Foreign Total Billing */}
        <div className="enterprise-card p-4 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border-blue-200 rounded-xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
              <span>🌐</span>
              <span>US & Global (USD)</span>
            </span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">
              {summary.usdCount} entries
            </span>
          </div>
          <div className="text-lg font-extrabold font-mono text-blue-950">
            {formatMoney(summary.usdGross, 'USD')}
          </div>
          <p className="text-[11px] text-blue-800/80 mt-1">
            Total Hours: <span className="font-bold">{summary.usdHours.toFixed(1)} hrs</span>
          </p>
        </div>

        {/* Total Hours */}
        <div className="enterprise-card p-4 bg-white border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Billed Hours</p>
              <p className="text-lg font-extrabold text-slate-900">{summary.totalHours.toFixed(1)} hrs</p>
            </div>
          </div>
        </div>

        {/* Total Entries */}
        <div className="enterprise-card p-4 bg-white border-slate-200 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">All Billing Records</p>
              <p className="text-lg font-extrabold text-slate-900">{summary.totalEntries}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Indian Entries vs US/Foreign Entries vs All */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('INR')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-xs transition-all border-b-2 ${
            activeTab === 'INR'
              ? 'border-orange-600 text-orange-900 bg-orange-50/80 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="text-base leading-none">🇮🇳</span>
          <span>Indian Employees (INR ₹)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'INR' ? 'bg-orange-200 text-orange-950' : 'bg-slate-100 text-slate-600'
          }`}>
            {summary.inrCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('USD')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-xs transition-all border-b-2 ${
            activeTab === 'USD'
              ? 'border-blue-600 text-blue-900 bg-blue-50/80 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="text-base leading-none">🌐</span>
          <span>US & Foreign Employees (USD $)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'USD' ? 'bg-blue-200 text-blue-950' : 'bg-slate-100 text-slate-600'
          }`}>
            {summary.usdCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-xs transition-all border-b-2 ${
            activeTab === 'ALL'
              ? 'border-slate-800 text-slate-900 bg-slate-100 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>All Payroll Entries</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'ALL' ? 'bg-slate-200 text-slate-900' : 'bg-slate-100 text-slate-600'
          }`}>
            {summary.totalEntries}
          </span>
        </button>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border ${
          statusMessage.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {statusMessage.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="ml-auto p-0.5 hover:opacity-70">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="enterprise-card p-4 bg-white flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by Employee ID, Name, Vendor, or Client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 text-sm border-none outline-none bg-transparent text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {filterMonth && (
            <button onClick={() => setFilterMonth('')} className="text-xs text-slate-400 hover:text-slate-600 font-medium">Clear</button>
          )}
        </div>
      </div>

      {/* Payroll Entries Table */}
      <div className="enterprise-card bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Employee</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Region / Currency</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Month</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Vendor</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Client</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Hours</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Bill Rate</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Emp Rate</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Gross Amount</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No payroll billing entries found</p>
                    <p className="text-xs mt-1">Click "Add Payroll Entry" to create one.</p>
                  </td>
                </tr>
              ) : entries.map((entry) => {
                const recCur = entry.currency || (entry.country === 'India' ? 'INR' : 'USD');
                const isIndia = recCur === 'INR' || entry.country === 'India';

                return (
                  <tr key={entry._id || entry.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 text-xs">{entry.employee_name || entry.employee_id}</div>
                      <div className="font-mono text-[11px] text-blue-700">{entry.employee_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      {isIndia ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-800 border border-orange-200 rounded-md font-semibold text-[11px]">
                          <span>🇮🇳</span> India (INR)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-md font-semibold text-[11px]">
                          <span>🌐</span> US / Global (USD)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {fmtMonth(entry.payroll_month)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-700">{entry.vendor_name || '—'}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-700">{entry.client_name || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 text-xs">{entry.total_hours}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600 text-xs">{formatMoney(entry.bill_rate, recCur)}/hr</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600 text-xs">{formatMoney(entry.emp_bill_rate, recCur)}/hr</td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-bold text-emerald-700 text-sm">{formatMoney(entry.gross_amount, recCur)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(entry)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm(entry._id || entry.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900">Delete Payroll Entry?</h3>
            <p className="text-sm text-slate-600">This action cannot be undone. The payroll billing entry will be permanently removed.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-[#0f2b48] text-white">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" />
                {editingEntry ? 'Edit Payroll Billing Entry' : 'Add New Payroll Billing Entry'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
              {/* Employee Search Dropdown */}
              <div ref={empDropdownRef} className="relative">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  Employee Name (ID, Name) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={empSearch}
                    onChange={(e) => { setEmpSearch(e.target.value); setShowEmpDropdown(true); }}
                    onFocus={() => setShowEmpDropdown(true)}
                    placeholder="Search by Employee ID or Name..."
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all pr-8"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
                {showEmpDropdown && filteredEmps.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {filteredEmps.map(emp => (
                      <button
                        key={emp.employee_id}
                        type="button"
                        onClick={() => selectEmployee(emp)}
                        className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 text-xs border-b border-slate-50 last:border-none transition-colors"
                      >
                        <span className="font-mono font-bold text-blue-700">{emp.employee_id}</span>
                        <span className="mx-2 text-slate-300">—</span>
                        <span className="font-semibold text-slate-800">{emp.full_name}</span>
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">
                          {emp.country === 'India' ? '🇮🇳 India' : '🌐 US'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Currency & Region Selector */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Billing Currency & Structure
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, currency: 'INR' }))}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border font-semibold text-xs transition-all ${
                      form.currency === 'INR'
                        ? 'bg-orange-100 border-orange-400 text-orange-950 ring-2 ring-orange-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>🇮🇳</span>
                    <span>Indian Rupee (INR ₹/hr)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, currency: 'USD' }))}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border font-semibold text-xs transition-all ${
                      form.currency === 'USD'
                        ? 'bg-blue-100 border-blue-400 text-blue-950 ring-2 ring-blue-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>🌐</span>
                    <span>US Dollar (USD $/hr)</span>
                  </button>
                </div>
              </div>

              {/* Month & Vendor/Client */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Payroll Month <span className="text-rose-500">*</span>
                  </label>
                  <input type="month" value={form.payroll_month} onChange={e => setForm(f => ({ ...f, payroll_month: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Vendor Name</label>
                  <input type="text" value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))}
                    placeholder="e.g. TCS / Apex Systems"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">Client Name</label>
                  <input type="text" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                    placeholder="e.g. Google / Fintech Corp"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 outline-none" />
                </div>
              </div>

              {/* Billing & Gross Amount Section */}
              <div className="p-4 bg-gradient-to-br from-emerald-50/80 via-slate-50 to-blue-50/50 rounded-2xl border border-emerald-200 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200/60 pb-2">
                  <Calculator className="w-4 h-4 text-emerald-700" />
                  Hours, Rates & Gross Amount Calculation ({form.currency === 'INR' ? '₹ INR' : '$ USD'})
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Total Hours <span className="text-rose-500">*</span></label>
                    <input type="number" step="0.5" min="0" value={form.total_hours}
                      onChange={e => setForm(f => ({ ...f, total_hours: e.target.value }))}
                      placeholder="160"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Bill Rate ({form.currency === 'INR' ? '₹/hr' : '$/hr'}) <span className="text-rose-500">*</span>
                    </label>
                    <input type="number" step="0.01" min="0" value={form.bill_rate}
                      onChange={e => setForm(f => ({ ...f, bill_rate: e.target.value }))}
                      placeholder={form.currency === 'INR' ? '1500' : '95'}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Emp Rate ({form.currency === 'INR' ? '₹/hr' : '$/hr'}) <span className="text-rose-500">*</span>
                    </label>
                    <input type="number" step="0.01" min="0" value={form.emp_bill_rate}
                      onChange={e => setForm(f => ({ ...f, emp_bill_rate: e.target.value }))}
                      placeholder={form.currency === 'INR' ? '1156.25' : '65'}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Gross Amount</label>
                    <div className="px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-800">
                      {formatMoney(grossAmount, form.currency)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Hours × Emp Rate</p>
                  </div>
                </div>

                {/* Total Bill summary */}
                <div className="flex items-center justify-between bg-white/80 rounded-xl border border-slate-200 px-4 py-2.5">
                  <span className="text-xs font-medium text-slate-600">Total Client Invoicing (Hours × Bill Rate):</span>
                  <span className="font-mono font-bold text-blue-700">{formatMoney(totalBill, form.currency)}</span>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-lg shadow-sm transition-colors inline-flex items-center gap-2">
                  {isSubmitting ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <>{editingEntry ? 'Update Payroll Entry' : 'Create Payroll Entry'}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


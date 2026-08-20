import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api.js';
import {
  Receipt, Search, Plus, X, Edit3, Trash2, DollarSign, Users,
  ChevronDown, AlertCircle, CheckCircle2, Calendar, Calculator, Clock
} from 'lucide-react';

export function AdminPayrollEntries() {
  const [entries, setEntries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [vendors, setVendors] = useState([]);
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
    total_hours: '', bill_rate: '', emp_bill_rate: ''
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

      const [entryData, empData, vendorData] = await Promise.all([
        api.getAllPayrollEntries(params),
        api.getAllEmployees(),
        api.getAllVendorDetails()
      ]);
      setEntries(entryData.entries || []);
      setEmployees(empData.employees || []);
      setVendors(vendorData.vendors || []);
    } catch (err) {
      console.error('Failed to load payroll entries:', err);
    }
  };

  useEffect(() => { fetchData(); }, []);
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
      total_hours: '', bill_rate: '', emp_bill_rate: ''
    });
    setEmpSearch('');
  };

  const openCreate = () => {
    resetForm();
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const openEdit = (entry) => {
    setForm({
      employee_id: entry.employee_id,
      employee_name: entry.employee_name,
      payroll_month: entry.payroll_month,
      vendor_name: entry.vendor_name || '',
      client_name: entry.client_name || '',
      total_hours: String(entry.total_hours),
      bill_rate: String(entry.bill_rate),
      emp_bill_rate: String(entry.emp_bill_rate)
    });
    setEmpSearch(`${entry.employee_id} — ${entry.employee_name}`);
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  // Auto-fill vendor/client when employee is selected
  const selectEmployee = (emp) => {
    setForm(f => ({ ...f, employee_id: emp.employee_id, employee_name: emp.full_name }));
    setEmpSearch(`${emp.employee_id} — ${emp.full_name}`);
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
        await api.updatePayrollEntry(editingEntry._id, form);
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

  const fmt = (n) => typeof n === 'number' ? `$${n.toFixed(2)}` : '—';
  const fmtMonth = (m) => {
    if (!m) return '—';
    const [y, mo] = m.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(mo) - 1] || mo} ${y}`;
  };

  // Summary stats
  const totalGross = entries.reduce((s, e) => s + (e.gross_amount || 0), 0);
  const totalHoursAll = entries.reduce((s, e) => s + (e.total_hours || 0), 0);

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
            Monthly payroll billing records — hours, rates, and gross amount calculations.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Payroll Entry
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="enterprise-card p-4 bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Entries</p>
            <p className="text-lg font-extrabold text-slate-900">{entries.length}</p>
          </div>
        </div>
        <div className="enterprise-card p-4 bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Hours</p>
            <p className="text-lg font-extrabold text-slate-900">{totalHoursAll.toFixed(1)}</p>
          </div>
        </div>
        <div className="enterprise-card p-4 bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Total</p>
            <p className="text-lg font-extrabold text-emerald-700">${totalGross.toFixed(2)}</p>
          </div>
        </div>
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
      <div className="enterprise-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Employee</th>
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
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No payroll entries found</p>
                    <p className="text-xs mt-1">Click "Add Payroll Entry" to create one.</p>
                  </td>
                </tr>
              ) : entries.map((entry) => (
                <tr key={entry._id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900 text-xs">{entry.employee_id}</div>
                    <div className="text-[11px] text-slate-500 truncate max-w-[140px]">{entry.employee_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
                      <Calendar className="w-3 h-3" />
                      {fmtMonth(entry.payroll_month)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">{entry.vendor_name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-700">{entry.client_name || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 text-xs">{entry.total_hours}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 text-xs">{fmt(entry.bill_rate)}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600 text-xs">{fmt(entry.emp_bill_rate)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-bold text-emerald-700 text-sm">{fmt(entry.gross_amount)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(entry)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDeleteConfirm(entry._id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900">Delete Payroll Entry?</h3>
            <p className="text-sm text-slate-600">This action cannot be undone. The payroll entry will be permanently removed.</p>
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
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                {editingEntry ? 'Edit Payroll Entry' : 'Add New Payroll Entry'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Employee Search Dropdown */}
              <div ref={empDropdownRef} className="relative">
                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
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
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all pr-8"
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
                        className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 text-sm border-b border-slate-50 last:border-none transition-colors"
                      >
                        <span className="font-mono font-bold text-blue-700 text-xs">{emp.employee_id}</span>
                        <span className="mx-2 text-slate-300">—</span>
                        <span className="text-slate-700">{emp.full_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Month & Vendor/Client */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Payroll Month <span className="text-rose-500">*</span>
                  </label>
                  <input type="month" value={form.payroll_month} onChange={e => setForm(f => ({ ...f, payroll_month: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Vendor Name</label>
                  <input type="text" value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))}
                    placeholder="Auto-filled from vendor details"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Client Name</label>
                  <input type="text" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                    placeholder="Auto-filled from vendor details"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
              </div>

              {/* Billing & Gross Amount Section */}
              <div className="p-4 bg-gradient-to-br from-emerald-50/80 via-slate-50 to-blue-50/50 rounded-2xl border border-emerald-200 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-900 border-b border-emerald-200/60 pb-2">
                  <Calculator className="w-4 h-4 text-emerald-700" />
                  Hours, Rates & Gross Amount Calculation
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Total Hours <span className="text-rose-500">*</span></label>
                    <input type="number" step="0.5" min="0" value={form.total_hours}
                      onChange={e => setForm(f => ({ ...f, total_hours: e.target.value }))}
                      placeholder="160"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Bill Rate ($) <span className="text-rose-500">*</span></label>
                    <input type="number" step="0.01" min="0" value={form.bill_rate}
                      onChange={e => setForm(f => ({ ...f, bill_rate: e.target.value }))}
                      placeholder="100"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Emp Bill Rate ($) <span className="text-rose-500">*</span></label>
                    <input type="number" step="0.01" min="0" value={form.emp_bill_rate}
                      onChange={e => setForm(f => ({ ...f, emp_bill_rate: e.target.value }))}
                      placeholder="80"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Gross Amount ($)</label>
                    <div className="px-3 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-sm font-mono font-bold text-emerald-800">
                      ${grossAmount.toFixed(2)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Hours × Emp Bill Rate</p>
                  </div>
                </div>

                {/* Total Bill summary */}
                <div className="flex items-center justify-between bg-white/80 rounded-xl border border-slate-200 px-4 py-2.5">
                  <span className="text-xs font-medium text-slate-600">Total Bill (Hours × Bill Rate):</span>
                  <span className="font-mono font-bold text-blue-700">${totalBill.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 rounded-xl shadow-md transition-colors inline-flex items-center gap-2">
                  {isSubmitting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
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

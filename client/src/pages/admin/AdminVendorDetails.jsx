import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api.js';
import { exportToCSV } from '../../utils/csvExport.js';
import {
  Building2, Search, Plus, X, Edit3, Trash2, DollarSign, Users,
  MapPin, Briefcase, ChevronDown, AlertCircle, CheckCircle2, Calculator,
  Layers, Globe, Download
} from 'lucide-react';

function formatMoney(amount, currency = 'USD') {
  const num = parseFloat(amount) || 0;
  if (currency === 'INR') {
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminVendorDetails() {
  const [vendors, setVendors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'INR' | 'USD'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Form state
  const [form, setForm] = useState({
    employee_id: '', employee_name: '',
    vendor_name: '', vendor_address: '',
    client_name: '', client_address: '',
    hourly_bill_rate: '', employee_rate: '',
    visa_type: 'H-1B',
    currency: 'USD'
  });

  // Employee search dropdown
  const [empSearch, setEmpSearch] = useState('');
  const [showEmpDropdown, setShowEmpDropdown] = useState(false);
  const empDropdownRef = useRef(null);

  const fetchData = async () => {
    try {
      const [vendorData, empData] = await Promise.all([
        api.getAllVendorDetails(searchQuery ? { search: searchQuery } : {}),
        api.getAllEmployees()
      ]);
      setVendors(vendorData.vendors || []);
      setEmployees(empData.employees || []);
    } catch (err) {
      console.error('Failed to load vendor data:', err);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const t = setTimeout(() => fetchData(), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

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
  const billRate = parseFloat(form.hourly_bill_rate) || 0;
  const empRate = parseFloat(form.employee_rate) || 0;
  const buMargin = billRate - empRate;
  const taxPct = form.visa_type === 'OPT' ? 2.5 : 8.5;
  const netMargin = buMargin - (buMargin * taxPct / 100);

  // Search filter for employee picker
  const filteredEmps = employees.filter(e => {
    if (!empSearch.trim()) return true;
    const term = empSearch.toLowerCase().trim();
    const idMatch = e.employee_id?.toLowerCase().includes(term);
    const nameMatch = e.full_name?.toLowerCase().includes(term);
    const desigMatch = e.designation?.toLowerCase().includes(term);
    const emailMatch = e.email?.toLowerCase().includes(term);
    return idMatch || nameMatch || desigMatch || emailMatch;
  });

  const resetForm = () => {
    setForm({
      employee_id: '', employee_name: '',
      vendor_name: '', vendor_address: '',
      client_name: '', client_address: '',
      hourly_bill_rate: '', employee_rate: '',
      visa_type: 'H-1B',
      currency: 'USD'
    });
    setEmpSearch('');
    setShowEmpDropdown(false);
  };

  const openCreate = () => {
    resetForm();
    setEditingVendor(null);
    setIsModalOpen(true);
    fetchData(); // Ensure latest employees list is loaded
  };

  const openEdit = (vendor) => {
    const emp = employees.find(e => e.employee_id === vendor.employee_id);
    const cur = (emp && emp.country === 'India') ? 'INR' : 'USD';

    setForm({
      employee_id: vendor.employee_id,
      employee_name: vendor.employee_name,
      vendor_name: vendor.vendor_name,
      vendor_address: vendor.vendor_address || '',
      client_name: vendor.client_name,
      client_address: vendor.client_address || '',
      hourly_bill_rate: String(vendor.hourly_bill_rate),
      employee_rate: String(vendor.employee_rate),
      visa_type: vendor.visa_type || 'H-1B',
      currency: cur
    });
    setEmpSearch(`${vendor.employee_id} — ${vendor.employee_name}`);
    setEditingVendor(vendor);
    setIsModalOpen(true);
  };

  const selectEmployee = (emp) => {
    const isIndia = emp.country === 'India';
    setForm(f => ({
      ...f,
      employee_id: emp.employee_id,
      employee_name: emp.full_name,
      currency: isIndia ? 'INR' : 'USD'
    }));
    setEmpSearch(`${emp.employee_id} — ${emp.full_name}`);
    setShowEmpDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.employee_id || !form.vendor_name || !form.client_name) {
      setStatusMessage({ type: 'error', text: 'Employee, Vendor Name, and Client Name are required.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        hourly_bill_rate: billRate,
        employee_rate: empRate,
        bu_margin: buMargin,
        tax_percent: taxPct,
        net_margin: netMargin
      };
      if (editingVendor) {
        await api.updateVendorDetail(editingVendor._id || editingVendor.id, payload);
        setStatusMessage({ type: 'success', text: 'Vendor detail updated successfully.' });
      } else {
        await api.createVendorDetail(payload);
        setStatusMessage({ type: 'success', text: 'Vendor detail created successfully.' });
      }
      setIsModalOpen(false);
      resetForm();
      await fetchData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save vendor detail.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteVendorDetail(id);
      setStatusMessage({ type: 'success', text: 'Vendor record deleted.' });
      setDeleteConfirm(null);
      await fetchData();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete.' });
    }
  };

  // Tab Filtering
  const displayedVendors = vendors.filter(v => {
    const emp = employees.find(e => e.employee_id === v.employee_id);
    const isIndia = emp?.country === 'India' || v.vendor_address?.includes('India') || (parseFloat(v.hourly_bill_rate) > 500);
    if (activeTab === 'INR') return isIndia;
    if (activeTab === 'USD') return !isIndia;
    return true;
  });

  const inrVendorsCount = vendors.filter(v => {
    const emp = employees.find(e => e.employee_id === v.employee_id);
    return emp?.country === 'India' || v.vendor_address?.includes('India') || (parseFloat(v.hourly_bill_rate) > 500);
  }).length;

  const usdVendorsCount = vendors.length - inrVendorsCount;

  const handleExportCSV = () => {
    const formattedData = filteredVendors.map(v => ({
      'Employee ID': v.employee_id,
      'Employee Name': v.employee_name,
      'Vendor Name': v.vendor_name,
      'Vendor Address': v.vendor_address || 'N/A',
      'Client Name': v.client_name,
      'Client Address': v.client_address || 'N/A',
      'Hourly Bill Rate': v.hourly_bill_rate,
      'Employee Pay Rate': v.employee_rate,
      'BU Margin': v.bu_margin,
      'Currency': v.currency || 'USD',
      'Visa Type': v.visa_type || 'N/A'
    }));
    exportToCSV(formattedData, `Shineteck_Vendor_Placements_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-blue-600" />
            Vendor Details
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage vendor-client billing, employee rates, and margin calculations for Indian & Global consultants.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="enterprise-btn-secondary"
            title="Download vendor placements as CSV"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openCreate}
            className="enterprise-btn-primary"
          >
            <Plus className="w-4 h-4" /> Add Vendor Record
          </button>
        </div>
      </div>

      {/* Tabs */}
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
          <span>Indian Vendors (INR ₹)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'INR' ? 'bg-orange-200 text-orange-950' : 'bg-slate-100 text-slate-600'
          }`}>
            {inrVendorsCount}
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
          <span>US & Global Vendors (USD $)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'USD' ? 'bg-blue-200 text-blue-950' : 'bg-slate-100 text-slate-600'
          }`}>
            {usdVendorsCount}
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
          <span>All Vendors</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeTab === 'ALL' ? 'bg-slate-200 text-slate-900' : 'bg-slate-100 text-slate-600'
          }`}>
            {vendors.length}
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

      {/* Search Bar */}
      <div className="enterprise-card p-4 bg-white flex items-center gap-3">
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

      {/* Vendor Records Table */}
      <div className="enterprise-card bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Employee</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Region</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Vendor</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Client</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Bill Rate</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Emp Rate</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">BU Margin</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Visa / Tax%</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Net Margin</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedVendors.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold">No vendor records found</p>
                    <p className="text-xs mt-1">Click "Add Vendor Record" to create one.</p>
                  </td>
                </tr>
              ) : displayedVendors.map((v) => {
                const emp = employees.find(e => e.employee_id === v.employee_id);
                const isIndia = emp?.country === 'India' || v.vendor_address?.includes('India') || (parseFloat(v.hourly_bill_rate) > 500);
                const cur = isIndia ? 'INR' : 'USD';

                return (
                  <tr key={v._id || v.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 text-xs">{v.employee_name || v.employee_id}</div>
                      <div className="font-mono text-[11px] text-blue-700">{v.employee_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      {isIndia ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-800 border border-orange-200 rounded-md font-semibold text-[11px]">
                          <span>🇮🇳</span> India
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-md font-semibold text-[11px]">
                          <span>🌐</span> US / Global
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-xs">{v.vendor_name}</div>
                      {v.vendor_address && <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{v.vendor_address}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800 text-xs">{v.client_name}</div>
                      {v.client_address && <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{v.client_address}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-blue-700 text-xs">{formatMoney(v.hourly_bill_rate, cur)}/hr</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700 text-xs">{formatMoney(v.employee_rate, cur)}/hr</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-700 text-xs">{formatMoney(v.bu_margin, cur)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        v.visa_type === 'H-1B'
                          ? 'bg-violet-100 text-violet-800 border border-violet-200'
                          : 'bg-teal-100 text-teal-800 border border-teal-200'
                      }`}>
                        {v.visa_type} ({v.tax_percent}%)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700 text-xs">
                      {formatMoney(v.net_margin, cur)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(v)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Edit">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm(v._id || v.id)} className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Delete">
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
            <h3 className="text-lg font-bold text-slate-900">Delete Vendor Record?</h3>
            <p className="text-sm text-slate-600">This action cannot be undone. The vendor detail mapping will be permanently removed.</p>
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
                <Building2 className="w-5 h-5 text-blue-400" />
                {editingVendor ? 'Edit Vendor Detail' : 'Add New Vendor Detail'}
              </h3>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
              {/* Employee Search Combobox Dropdown */}
              <div ref={empDropdownRef} className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Select Employee (Emp ID, Name) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {employees.length} employees available
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={empSearch}
                    onChange={(e) => {
                      setEmpSearch(e.target.value);
                      setShowEmpDropdown(true);
                    }}
                    onFocus={() => setShowEmpDropdown(true)}
                    placeholder="Click to browse or type Employee ID / Name..."
                    className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all pr-16"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {empSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setEmpSearch('');
                          setShowEmpDropdown(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowEmpDropdown(v => !v)}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Toggle dropdown list"
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${showEmpDropdown ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Selected Employee Chip preview */}
                {form.employee_id && (
                  <div className="mt-1.5 flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-900 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Selected: <strong>{form.employee_name}</strong> (<span className="font-mono">{form.employee_id}</span>)</span>
                    <span className="ml-auto text-[10px] px-2 py-0.5 bg-blue-100 rounded-full font-bold">
                      {form.currency === 'INR' ? '🇮🇳 India (INR ₹)' : '🌐 US (USD $)'}
                    </span>
                  </div>
                )}

                {/* Dropdown Floating Panel */}
                {showEmpDropdown && (
                  <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-50 animate-in fade-in zoom-in duration-150">
                    {filteredEmps.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">
                        <Users className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                        <p className="text-xs font-semibold">No matching employees found</p>
                        <button
                          type="button"
                          onClick={() => setEmpSearch('')}
                          className="mt-1.5 text-[11px] text-blue-600 hover:underline font-bold"
                        >
                          View all {employees.length} employees
                        </button>
                      </div>
                    ) : (
                      filteredEmps.map(emp => {
                        const isIndia = emp.country === 'India';
                        const isSelected = form.employee_id === emp.employee_id;

                        return (
                          <button
                            key={emp.employee_id || emp.id}
                            type="button"
                            onClick={() => selectEmployee(emp)}
                            className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between transition-colors ${
                              isSelected ? 'bg-blue-50/80 font-bold text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{isIndia ? '🇮🇳' : '🌐'}</span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-blue-700">{emp.employee_id}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="font-semibold text-slate-800">{emp.full_name}</span>
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {emp.designation || 'Consultant'} • {emp.country || 'United States'}
                                </div>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isIndia ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {isIndia ? 'INR ₹' : 'USD $'}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Vendor & Client Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Vendor Name <span className="text-rose-500">*</span>
                  </label>
                  <input type="text" value={form.vendor_name} onChange={e => setForm(f => ({ ...f, vendor_name: e.target.value }))}
                    placeholder="e.g. Infosys, TCS, Wipro, Apex Systems"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Vendor Address
                  </label>
                  <input type="text" value={form.vendor_address} onChange={e => setForm(f => ({ ...f, vendor_address: e.target.value }))}
                    placeholder="Vendor office location / city"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> Client Name <span className="text-rose-500">*</span>
                  </label>
                  <input type="text" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))}
                    placeholder="e.g. Google, JPMorgan Chase, Amazon"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> Client Address
                  </label>
                  <input type="text" value={form.client_address} onChange={e => setForm(f => ({ ...f, client_address: e.target.value }))}
                    placeholder="Client work location"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              {/* Billing & Margin Calculation */}
              <div className="p-4 bg-gradient-to-br from-blue-50/80 via-slate-50 to-emerald-50/50 rounded-2xl border border-blue-200 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-blue-200/60 pb-2">
                  <Calculator className="w-4 h-4 text-blue-700" />
                  Billing & Margin Calculation ({form.currency === 'INR' ? '₹ INR' : '$ USD'})
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Hourly Bill Rate ({form.currency === 'INR' ? '₹' : '$'}) <span className="text-rose-500">*</span>
                    </label>
                    <input type="number" step="0.01" min="0" value={form.hourly_bill_rate}
                      onChange={e => setForm(f => ({ ...f, hourly_bill_rate: e.target.value }))}
                      placeholder={form.currency === 'INR' ? '1500' : '95'}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      Employee Rate ({form.currency === 'INR' ? '₹' : '$'}) <span className="text-rose-500">*</span>
                    </label>
                    <input type="number" step="0.01" min="0" value={form.employee_rate}
                      onChange={e => setForm(f => ({ ...f, employee_rate: e.target.value }))}
                      placeholder={form.currency === 'INR' ? '1156.25' : '65'}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">BU Margin</label>
                    <div className="px-3 py-2 bg-amber-50 border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-800">
                      {formatMoney(buMargin, form.currency)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Bill Rate - Emp Rate</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Visa Type</label>
                    <div className="flex gap-2">
                      {['H-1B', 'OPT'].map(vt => (
                        <button key={vt} type="button" onClick={() => setForm(f => ({ ...f, visa_type: vt }))}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                            form.visa_type === vt
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}>
                          {vt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">% Tax</label>
                    <div className="px-3 py-2 bg-violet-50 border border-violet-200 rounded-lg text-xs font-mono font-bold text-violet-800">
                      {taxPct}%
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{form.visa_type}: {taxPct}%</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Net Margin</label>
                    <div className="px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-800">
                      {formatMoney(netMargin, form.currency)}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">BU Margin × (1 - Tax%)</p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-lg shadow-sm transition-colors inline-flex items-center gap-2">
                  {isSubmitting ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <>{editingVendor ? 'Update Vendor Detail' : 'Create Vendor Detail'}</>
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

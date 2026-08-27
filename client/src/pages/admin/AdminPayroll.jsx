import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  FileText,
  Globe,
  Building,
  Eye,
  CreditCard,
  Layers,
  ArrowUpDown
} from 'lucide-react';

function formatMoney(amount, currency = 'USD') {
  const num = parseFloat(amount) || 0;
  if (currency === 'INR') {
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function AdminPayroll() {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [summary, setSummary] = useState({ usdGross: 0, usdNet: 0, usdCount: 0, inrGross: 0, inrNet: 0, inrCount: 0, totalRecords: 0 });
  const [employees, setEmployees] = useState([]);
  const [activeCurrencyTab, setActiveCurrencyTab] = useState('ALL'); // 'ALL' | 'INR' | 'USD'
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStub, setSelectedStub] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [payPeriodStart, setPayPeriodStart] = useState('');
  const [payPeriodEnd, setPayPeriodEnd] = useState('');
  const [grossPay, setGrossPay] = useState('');
  const [deductions, setDeductions] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid');

  const fetchPayrollAndEmps = async () => {
    try {
      const params = {};
      if (activeCurrencyTab !== 'ALL') {
        params.currency = activeCurrencyTab;
      }
      const [payData, empData] = await Promise.all([
        api.getAllPayroll(params),
        api.getAllEmployees()
      ]);
      setPayrollRecords(payData.payrollRecords || []);
      if (payData.summary) {
        setSummary(payData.summary);
      }
      setEmployees(empData.employees || []);
    } catch (err) {
      console.error('Failed to load payroll data:', err);
    }
  };

  useEffect(() => {
    fetchPayrollAndEmps();
  }, [activeCurrencyTab]);

  const handleEmployeeSelect = (e) => {
    const selectedId = e.target.value;
    setEmployeeId(selectedId);
    const emp = employees.find(item => item.employee_id === selectedId);
    if (emp) {
      if (emp.country === 'India') {
        setCurrency('INR');
      } else {
        setCurrency('USD');
      }
    }
  };

  const handleCreatePayroll = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!employeeId || !payPeriodStart || !payPeriodEnd || !grossPay || !paymentDate) {
      setErrorMsg('All fields are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createPayrollRecord({
        employeeId,
        currency,
        payPeriodStart,
        payPeriodEnd,
        grossPay: parseFloat(grossPay),
        deductions: parseFloat(deductions) || 0,
        paymentDate,
        paymentStatus
      });

      setStatusMessage(`Payroll statement successfully issued in ${currency === 'INR' ? 'INR (₹)' : 'USD ($)'}.`);
      setIsModalOpen(false);
      // Reset form
      setEmployeeId('');
      setPayPeriodStart('');
      setPayPeriodEnd('');
      setGrossPay('');
      setDeductions('');
      setPaymentDate('');
      await fetchPayrollAndEmps();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to issue payroll statement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const netCalc = (parseFloat(grossPay) || 0) - (parseFloat(deductions) || 0);

  const filteredRecords = payrollRecords.filter(record => {
    const matchesSearch = !search.trim() || 
      record.employee_name?.toLowerCase().includes(search.toLowerCase()) ||
      record.employee_id?.toLowerCase().includes(search.toLowerCase()) ||
      record.designation?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || record.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="enterprise-card p-6 bg-white border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Corporate Multi-National Payroll Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage international US/Foreign (USD) and Indian domestic (INR) salary disbursements & tax deductions
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsModalOpen(true);
            setErrorMsg(null);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#0f2b48] hover:bg-[#1a416b] text-white text-xs font-bold rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Pay Statement</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button type="button" onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Summary KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* India Payroll KPI */}
        <div className="enterprise-card p-5 bg-gradient-to-br from-amber-50/50 to-orange-50/30 border-orange-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
              <span>🇮🇳</span>
              <span>Indian Payroll Total (INR)</span>
            </span>
            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full font-bold text-[10px]">
              {summary.inrCount} records
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-orange-950">
            {formatMoney(summary.inrNet, 'INR')}
          </div>
          <div className="text-[11px] text-orange-700/80 mt-1 flex justify-between">
            <span>Gross: {formatMoney(summary.inrGross, 'INR')}</span>
            <span>TDS/PF: {formatMoney(summary.inrGross - summary.inrNet, 'INR')}</span>
          </div>
        </div>

        {/* US & Foreign Payroll KPI */}
        <div className="enterprise-card p-5 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border-blue-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <span>🌐</span>
              <span>US & Foreign Total (USD)</span>
            </span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-bold text-[10px]">
              {summary.usdCount} records
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-blue-950">
            {formatMoney(summary.usdNet, 'USD')}
          </div>
          <div className="text-[11px] text-blue-700/80 mt-1 flex justify-between">
            <span>Gross: {formatMoney(summary.usdGross, 'USD')}</span>
            <span>Tax: {formatMoney(summary.usdGross - summary.usdNet, 'USD')}</span>
          </div>
        </div>

        {/* Total Issued */}
        <div className="enterprise-card p-5 bg-white border-slate-200 rounded-xl">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Total Pay Statements</span>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {summary.totalRecords}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Generated & disbursed across regions</p>
        </div>

        {/* Multi-Currency Status */}
        <div className="enterprise-card p-5 bg-white border-slate-200 rounded-xl">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Active Currency Modes</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
              <span>🇮🇳</span> INR (₹)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <span>🌐</span> USD ($)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Domestic & offshore compliance</p>
        </div>
      </div>

      {/* ── Tabs: Indian Payroll vs US/Foreign Payroll vs All ──────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveCurrencyTab('INR')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-xs transition-all border-b-2 ${
            activeCurrencyTab === 'INR'
              ? 'border-orange-600 text-orange-900 bg-orange-50/80 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="text-base leading-none">🇮🇳</span>
          <span>Indian Employees (INR ₹)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeCurrencyTab === 'INR' ? 'bg-orange-200 text-orange-950' : 'bg-slate-100 text-slate-600'
          }`}>
            {summary.inrCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCurrencyTab('USD')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-xs transition-all border-b-2 ${
            activeCurrencyTab === 'USD'
              ? 'border-blue-600 text-blue-900 bg-blue-50/80 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <span className="text-base leading-none">🌐</span>
          <span>US & Foreign Employees (USD $)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeCurrencyTab === 'USD' ? 'bg-blue-200 text-blue-950' : 'bg-slate-100 text-slate-600'
          }`}>
            {summary.usdCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCurrencyTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-semibold text-xs transition-all border-b-2 ${
            activeCurrencyTab === 'ALL'
              ? 'border-slate-800 text-slate-900 bg-slate-100 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>All Payroll Statements</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            activeCurrencyTab === 'ALL' ? 'bg-slate-200 text-slate-900' : 'bg-slate-100 text-slate-600'
          }`}>
            {summary.totalRecords}
          </span>
        </button>
      </div>

      {/* ── Search & Filter Bar ───────────────────────────────────────── */}
      <div className="enterprise-card p-4 bg-white border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search payroll by employee name, ID, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Payment Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Processing">Processing</option>
            <option value="Scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* ── Payroll Table ─────────────────────────────────────────────── */}
      <div className="enterprise-card bg-white border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Region / Currency</th>
                <th className="py-3.5 px-4">Pay Period</th>
                <th className="py-3.5 px-4">Gross Earnings</th>
                <th className="py-3.5 px-4">Taxes / Deductions</th>
                <th className="py-3.5 px-4 font-bold text-slate-800">Net Take-Home</th>
                <th className="py-3.5 px-4">Payment Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <CreditCard className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-500">No payroll statements found in this category.</p>
                      <p className="text-[11px] text-slate-400">Click "Issue Pay Statement" to generate a payroll entry.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((p) => {
                  const recCurrency = p.currency || (p.country === 'India' ? 'INR' : 'USD');
                  const isIndia = recCurrency === 'INR' || p.country === 'India';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{p.employee_name || p.employee_id}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[11px] text-blue-700 font-semibold">{p.employee_id}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-[11px] text-slate-500">{p.designation || 'Staff'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4 text-slate-800 font-medium">
                        <span className="block">{p.pay_period_start}</span>
                        <span className="text-slate-400 text-[10px]">to {p.pay_period_end}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {formatMoney(p.gross_pay, recCurrency)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-rose-600">
                        -{formatMoney(p.deductions, recCurrency)}
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono text-emerald-700 text-sm">
                        {formatMoney(p.net_pay, recCurrency)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {p.payment_date}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.payment_status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedStub(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 font-semibold rounded-md transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Stub</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Issue Pay Statement Modal ─────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0f2b48] text-white">
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">Issue Employee Payroll Statement</h3>
                  <p className="text-[11px] text-slate-300">Generate salary slip for domestic or offshore employees</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePayroll} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Select Employee */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={employeeId}
                  onChange={handleEmployeeSelect}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="">Choose employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.country === 'India' ? '🇮🇳' : '🌐'} {emp.full_name} ({emp.employee_id}) — {emp.designation} [{emp.country || 'USA'}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Currency Selector */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Payment Currency & Region
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrency('INR')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border font-semibold text-xs transition-all ${
                      currency === 'INR'
                        ? 'bg-orange-100 border-orange-400 text-orange-950 ring-2 ring-orange-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>🇮🇳</span>
                    <span>Indian Rupee (INR ₹)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency('USD')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border font-semibold text-xs transition-all ${
                      currency === 'USD'
                        ? 'bg-blue-100 border-blue-400 text-blue-950 ring-2 ring-blue-200'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>🌐</span>
                    <span>US Dollar (USD $)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pay Period Start</label>
                  <input
                    type="date"
                    required
                    value={payPeriodStart}
                    onChange={(e) => setPayPeriodStart(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pay Period End</label>
                  <input
                    type="date"
                    required
                    value={payPeriodEnd}
                    onChange={(e) => setPayPeriodEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gross Earnings ({currency === 'INR' ? '₹ INR' : '$ USD'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder={currency === 'INR' ? 'e.g. 185000.00' : 'e.g. 5200.00'}
                    value={grossPay}
                    onChange={(e) => setGrossPay(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {currency === 'INR' ? 'Deductions / TDS & PF (₹)' : 'Deductions / Taxes ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={currency === 'INR' ? 'e.g. 28500.00' : 'e.g. 1150.00'}
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Live Net Calculation Preview */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex justify-between items-center text-xs">
                <span className="text-emerald-900 font-medium">Calculated Net Take-Home:</span>
                <span className="text-base font-bold font-mono text-emerald-800">
                  {formatMoney(netCalc > 0 ? netCalc : 0, currency)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Disbursement Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Processing">Processing</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0f2b48] hover:bg-[#1a416b] rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Issuing...' : 'Issue Statement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Pay Stub Detail Modal ────────────────────────────────── */}
      {selectedStub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-[#0f2b48] text-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">Shinetek Inc.</h2>
                    <span className="px-2 py-0.5 bg-blue-800 text-blue-200 text-[10px] font-bold rounded-full">
                      {selectedStub.currency === 'INR' ? '🇮🇳 India Payroll' : '🌐 US Payroll'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">Earnings & Statement of Salary Deposit</p>
                </div>
                <StatusBadge status={selectedStub.payment_status} size="sm" />
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Employee</span>
                  <p className="font-bold text-slate-900">{selectedStub.employee_name || selectedStub.employee_id}</p>
                  <p className="font-mono text-[11px] text-blue-700">{selectedStub.employee_id}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Payment Date</span>
                  <p className="font-semibold text-slate-800">{selectedStub.payment_date}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Pay Period</span>
                  <p className="font-medium text-slate-800">{selectedStub.pay_period_start} to {selectedStub.pay_period_end}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Currency</span>
                  <p className="font-bold text-slate-900">{selectedStub.currency || 'USD'}</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Gross Compensation:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatMoney(selectedStub.gross_pay, selectedStub.currency)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">
                    {selectedStub.currency === 'INR' ? 'Statutory TDS, PF & Professional Tax:' : 'Federal/State Tax & Benefit Deductions:'}
                  </span>
                  <span className="font-mono font-semibold text-rose-600">
                    -{formatMoney(selectedStub.deductions, selectedStub.currency)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-300 text-sm font-bold">
                  <span className="text-slate-900">Net Take-Home Deposit:</span>
                  <span className="font-mono text-emerald-700">
                    {formatMoney(selectedStub.net_pay, selectedStub.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStub(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0f2b48] hover:bg-[#1a416b] rounded-lg transition-colors"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


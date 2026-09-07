import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { EmployeeSearchableDropdown } from './EmployeeSearchableDropdown.jsx';
import {
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Lock,
  Edit3,
  Eye,
  X,
  Sparkles,
  AlertTriangle,
  FileText
} from 'lucide-react';

function formatMoney(amount, currency = 'USD') {
  const num = parseFloat(amount) || 0;
  if (currency === 'INR') {
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatLPA(amount, currency = 'USD') {
  const num = parseFloat(amount) || 0;
  if (currency === 'INR') {
    const lpa = (num / 100000).toFixed(1);
    return `${lpa} LPA`;
  }
  return `$${(num / 1000).toFixed(0)}k/yr`;
}

export function EmployeeCompensationLedger({ onSwitchToStatements }) {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [ledgerData, setLedgerData] = useState(null);

  // Modals
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [selectedMonthForDisbursal, setSelectedMonthForDisbursal] = useState(null);
  const [isEditPackageModalOpen, setIsEditPackageModalOpen] = useState(false);
  const [selectedPayStub, setSelectedPayStub] = useState(null);

  // Disburse Form State
  const [disburseGross, setDisburseGross] = useState('');
  const [disburseDeductions, setDisburseDeductions] = useState('');
  const [disburseDate, setDisburseDate] = useState(new Date().toISOString().split('T')[0]);
  const [disburseStatus, setDisburseStatus] = useState('Paid');
  const [disburseNotes, setDisburseNotes] = useState('');
  const [isSubmittingDisburse, setIsSubmittingDisburse] = useState(false);
  const [disburseError, setDisburseError] = useState(null);

  // Edit Package Form State
  const [editSalaryInput, setEditSalaryInput] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSubmittingPackage, setIsSubmittingPackage] = useState(false);
  const [packageError, setPackageError] = useState(null);

  // Toast / Status
  const [statusNotification, setStatusNotification] = useState(null);

  // 1. Initial Load: Fetch all employees
  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await api.getAllEmployees();
        const emps = data.employees || [];
        setEmployees(emps);
        if (emps.length > 0 && !selectedEmployeeId) {
          // Default to first active employee (or Rajesh Sharma if present)
          const rajesh = emps.find(e => e.employee_id === 'SH-2008');
          setSelectedEmployeeId(rajesh ? rajesh.employee_id : emps[0].employee_id);
        }
      } catch (err) {
        console.error('Failed to load employees:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadEmployees();
  }, []);

  // 2. Load Ledger data whenever selectedEmployeeId or selectedYear changes
  const fetchLedger = async () => {
    if (!selectedEmployeeId) return;
    try {
      const data = await api.getEmployeeCompensationLedger(selectedEmployeeId, selectedYear);
      setLedgerData(data);
    } catch (err) {
      console.error('Failed to load employee compensation ledger:', err);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [selectedEmployeeId, selectedYear]);

  // Handle opening Disbursal Modal for a specific month
  const handleOpenDisburse = (month) => {
    setSelectedMonthForDisbursal(month);
    setDisburseError(null);

    // Calculate default recommended gross
    const monthlyBase = ledgerData?.monthlyBase || 83333;
    const remainingCap = ledgerData?.remainingCap ?? 1000000;
    const defaultGross = Math.min(monthlyBase, remainingCap);

    // Standard deduction estimate (~12-15% TDS/Tax)
    const defaultDed = ledgerData?.currency === 'INR'
      ? Math.round(defaultGross * 0.12)
      : Math.round(defaultGross * 0.18);

    setDisburseGross(defaultGross > 0 ? defaultGross.toString() : '');
    setDisburseDeductions(defaultDed > 0 ? defaultDed.toString() : '0');
    setDisburseDate(new Date().toISOString().split('T')[0]);
    setDisburseStatus('Paid');
    setDisburseNotes(`Monthly salary run for ${month.monthName} ${selectedYear}`);
    setIsDisburseModalOpen(true);
  };

  // Handle Disburse Submit with Guardrail check
  const handleSubmitDisburse = async (e) => {
    e.preventDefault();
    setDisburseError(null);

    const gross = parseFloat(disburseGross);
    const ded = parseFloat(disburseDeductions) || 0;
    const remainingCap = ledgerData?.remainingCap ?? 0;

    if (isNaN(gross) || gross <= 0) {
      setDisburseError('Please enter a valid positive gross salary amount.');
      return;
    }

    if (gross > remainingCap) {
      const overBy = gross - remainingCap;
      setDisburseError(
        `Exceeds Annual Income Limit! Remaining annual allowance is ${formatMoney(remainingCap, ledgerData?.currency)}. This payment exceeds the cap by ${formatMoney(overBy, ledgerData?.currency)}.`
      );
      return;
    }

    setIsSubmittingDisburse(true);
    try {
      const res = await api.disburseMonthlySalary({
        employeeId: selectedEmployeeId,
        year: selectedYear,
        monthNumber: selectedMonthForDisbursal.monthNumber,
        grossPay: gross,
        deductions: ded,
        paymentDate: disburseDate,
        paymentStatus: disburseStatus,
        notes: disburseNotes
      });

      setStatusNotification({
        type: 'success',
        message: res.message || `Salary for ${selectedMonthForDisbursal.monthName} successfully disbursed!`
      });
      setIsDisburseModalOpen(false);
      await fetchLedger();
    } catch (err) {
      setDisburseError(err.message || 'Failed to disburse monthly salary.');
    } finally {
      setIsSubmittingDisburse(false);
    }
  };

  // Handle opening Edit Package Modal
  const handleOpenEditPackage = () => {
    setPackageError(null);
    setEditSalaryInput(ledgerData?.annualSalary?.toString() || '1000000');
    setEditNotes('');
    setIsEditPackageModalOpen(true);
  };

  // Handle Update Annual Package Submit
  const handleSavePackage = async (e) => {
    e.preventDefault();
    setPackageError(null);

    const newSalary = parseFloat(editSalaryInput);
    if (isNaN(newSalary) || newSalary <= 0) {
      setPackageError('Please enter a valid positive annual salary.');
      return;
    }

    setIsSubmittingPackage(true);
    try {
      const res = await api.updateEmployeeCompensation(selectedEmployeeId, {
        annualSalary: newSalary,
        notes: editNotes
      });

      setStatusNotification({
        type: 'success',
        message: res.message || 'Annual compensation package successfully updated!'
      });
      setIsEditPackageModalOpen(false);
      await fetchLedger();
    } catch (err) {
      setPackageError(err.message || 'Failed to update package.');
    } finally {
      setIsSubmittingPackage(false);
    }
  };

  // Handle View Slip
  const handleViewSlip = (month) => {
    if (!month.recordId) return;
    setSelectedPayStub({
      employee_id: selectedEmployeeId,
      employee_name: ledgerData?.employee?.full_name,
      designation: ledgerData?.employee?.designation,
      currency: ledgerData?.currency,
      monthName: month.monthName,
      pay_period_start: `${selectedYear}-${month.monthNumber < 10 ? `0${month.monthNumber}` : month.monthNumber}-01`,
      pay_period_end: `${selectedYear}-${month.monthNumber < 10 ? `0${month.monthNumber}` : month.monthNumber}-${new Date(selectedYear, month.monthNumber, 0).getDate()}`,
      gross_pay: month.disbursedGross,
      deductions: month.deductions,
      net_pay: month.disbursedNet,
      payment_date: month.paymentDate || 'Processed',
      payment_status: month.paymentStatus || 'Paid',
      id: month.recordId
    });
  };

  const selectedEmp = employees.find(e => e.employee_id === selectedEmployeeId);
  const currency = ledgerData?.currency || (selectedEmp?.country === 'India' ? 'INR' : 'USD');
  const annualSalary = ledgerData?.annualSalary || (currency === 'INR' ? 1000000 : 120000);
  const totalGrossPaid = ledgerData?.totalGrossPaid || 0;
  const remainingCap = ledgerData?.remainingCap ?? (annualSalary - totalGrossPaid);
  const capPercentage = ledgerData?.capPercentage || Math.min(100, Math.round((totalGrossPaid / annualSalary) * 100));
  const monthsPaidCount = ledgerData?.monthsPaidCount || 0;
  const isCapReached = ledgerData?.isCapReached || totalGrossPaid >= annualSalary;

  // Live calculation in disburse modal
  const modalGrossNum = parseFloat(disburseGross) || 0;
  const modalDedNum = parseFloat(disburseDeductions) || 0;
  const modalNetCalc = Math.max(0, modalGrossNum - modalDedNum);
  const modalExceedsCap = modalGrossNum > remainingCap;
  const modalOverBy = modalGrossNum - remainingCap;

  return (
    <div className="space-y-6">
      {/* ── Status Banner ──────────────────────────────────────────────── */}
      {statusNotification && (
        <div className="p-3 text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{statusNotification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusNotification(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Top Bar: Employee Picker & Year Controls ─────────────────────── */}
      <div className="enterprise-card p-5 bg-white border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Employee Selector & Search */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Select Employee to Inspect Disbursal Ledger:</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {employees.length} Active Staff Registered
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <EmployeeSearchableDropdown
                  employees={employees}
                  selectedEmployeeId={selectedEmployeeId}
                  onSelectEmployee={(empId) => setSelectedEmployeeId(empId)}
                />
              </div>

              {/* Year Selector */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
                <Calendar className="w-4 h-4 text-slate-500 ml-2" />
                <span className="text-xs font-bold text-slate-700">Year:</span>
                {[2025, 2026, 2027].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedYear === yr
                        ? 'bg-[#0f2b48] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Employee Badges Carousel / Pill List */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Quick Select:
          </span>
          {employees.slice(0, 8).map((emp) => {
            const isSelected = emp.employee_id === selectedEmployeeId;
            const isIndia = emp.country === 'India';
            return (
              <button
                key={emp.employee_id}
                type="button"
                onClick={() => setSelectedEmployeeId(emp.employee_id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-900 text-white shadow-xs ring-2 ring-blue-500/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{isIndia ? '🇮🇳' : '🌐'}</span>
                <span>{emp.full_name?.split(' ')[0]}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-blue-800 text-blue-100' : 'bg-white text-slate-500'
                }`}>
                  {emp.employee_id}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected Employee Compensation Dashboard Card ───────────────── */}
      {ledgerData && selectedEmp && (
        <div className="enterprise-card p-6 bg-gradient-to-b from-white to-slate-50/50 border-slate-200 shadow-sm space-y-6">
          {/* Employee Identity & LPA Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
            <div className="flex items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-[#0f2b48] text-white flex items-center justify-center font-bold text-lg shadow-sm border border-slate-300">
                {selectedEmp.first_name?.[0] || 'E'}{selectedEmp.last_name?.[0] || 'M'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{selectedEmp.full_name}</h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    currency === 'INR'
                      ? 'bg-orange-50 text-orange-800 border-orange-200'
                      : 'bg-blue-50 text-blue-800 border-blue-200'
                  }`}>
                    {currency === 'INR' ? '🇮🇳 Indian Payroll (INR ₹)' : '🌐 US / Global Payroll (USD $)'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="font-mono text-blue-700 font-bold">{selectedEmp.employee_id}</span>
                  <span>•</span>
                  <span className="font-medium text-slate-700">{selectedEmp.designation}</span>
                  <span>•</span>
                  <span>{selectedEmp.city}, {selectedEmp.country}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleOpenEditPackage}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Adjust Annual Package</span>
              </button>

              {onSwitchToStatements && (
                <button
                  type="button"
                  onClick={onSwitchToStatements}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Statements Register</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 Core Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Annual CTC / LPA Cap */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-600">Annual Compensation Cap</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded-full font-bold text-[10px]">
                  {formatLPA(annualSalary, currency)}
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-950">
                {formatMoney(annualSalary, currency)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Baseline:</span>
                <span className="font-semibold text-slate-700 font-mono">
                  {formatMoney(ledgerData.monthlyBase, currency)} / mo
                </span>
              </div>
            </div>

            {/* 2. Total Disbursed (YTD) */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-600">Total Disbursed ({selectedYear})</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-full font-bold text-[10px]">
                  {capPercentage}% Disbursed
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-700">
                {formatMoney(totalGrossPaid, currency)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                <span>Net Deposited:</span>
                <span className="font-semibold text-emerald-800 font-mono">
                  {formatMoney(ledgerData.totalNetPaid, currency)}
                </span>
              </div>
            </div>

            {/* 3. Remaining Annual Cap (Budget Safety) */}
            <div className={`p-4 rounded-xl border shadow-2xs ${
              isCapReached
                ? 'bg-rose-50 border-rose-300'
                : remainingCap < (annualSalary * 0.25)
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-emerald-50/60 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Remaining Annual Cap</span>
                </span>
                {isCapReached ? (
                  <span className="px-2 py-0.5 bg-rose-200 text-rose-900 rounded-full font-bold text-[10px] flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> Cap Reached
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-white text-emerald-900 rounded-full font-bold text-[10px] border border-emerald-300">
                    Safe Limit
                  </span>
                )}
              </div>
              <div className={`text-2xl font-bold font-mono ${
                isCapReached ? 'text-rose-800' : 'text-slate-900'
              }`}>
                {formatMoney(remainingCap, currency)}
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {isCapReached
                  ? 'No further disbursements allowed in this fiscal year.'
                  : `Allowed remaining headroom for ${selectedYear}`}
              </p>
            </div>

            {/* 4. Months Paid Tracker */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-600">Disbursal Progress</span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-900 rounded-full font-bold text-[10px]">
                  {monthsPaidCount} of 12 Months
                </span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900">
                {monthsPaidCount} <span className="text-sm font-normal text-slate-400">/ 12</span>
              </div>
              {/* Monthly tick indicators */}
              <div className="grid grid-cols-12 gap-1 mt-2.5">
                {ledgerData.months.map((m) => (
                  <div
                    key={m.monthNumber}
                    title={`${m.monthName}: ${m.status}`}
                    className={`h-2 rounded-xs ${
                      m.status === 'PAID'
                        ? 'bg-emerald-500'
                        : m.status === 'DUE'
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Annual Budget Cap Guardrail Progress Bar ───────────────────── */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-sm space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Annual Compensation Cap Guardrail ({selectedYear})</span>
                <span className="px-2 py-0.5 bg-slate-800 text-emerald-300 text-[10px] font-mono rounded">
                  Max Limit: {formatMoney(annualSalary, currency)}
                </span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                Paid: {formatMoney(totalGrossPaid, currency)} • Remaining: {formatMoney(remainingCap, currency)}
              </div>
            </div>

            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  capPercentage >= 100
                    ? 'bg-rose-500'
                    : capPercentage > 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, capPercentage)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>₹0.00 / $0</span>
              <span className="font-semibold text-slate-300">
                {isCapReached ? (
                  <span className="text-rose-400 font-bold">⚠️ Budget Fully Utilized — Additional Payouts Locked</span>
                ) : (
                  `🛡️ Cap Guardrail Active: System strictly blocks payments exceeding ${formatMoney(annualSalary, currency)}`
                )}
              </span>
              <span>{formatMoney(annualSalary, currency)} (100%)</span>
            </div>
          </div>

          {/* ── 12-Month Disbursal Calendar Grid (Jan - Dec) ──────────────── */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>12-Month Disbursal Ledger & Payment Calendar ({selectedYear})</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Real-time payment status across all 12 calendar months to prevent payment mismatches or duplicate payouts.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Paid
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Due / Pending
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300" /> Upcoming
                </span>
              </div>
            </div>

            {/* Grid of 12 Months */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {ledgerData.months.map((month) => {
                const isPaid = month.status === 'PAID';
                const isDue = month.status === 'DUE';

                return (
                  <div
                    key={month.monthNumber}
                    className={`rounded-2xl border p-4 transition-all flex flex-col justify-between ${
                      isPaid
                        ? 'bg-white border-emerald-200 shadow-2xs hover:shadow-xs'
                        : isDue
                          ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-200 shadow-2xs'
                          : 'bg-slate-50/70 border-slate-200 text-slate-600'
                    }`}
                  >
                    {/* Card Top: Month & Status Badge */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Month #{month.monthNumber < 10 ? `0${month.monthNumber}` : month.monthNumber}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{month.monthName}</h4>
                      </div>

                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PAID
                        </span>
                      ) : isDue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full border border-amber-300 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" /> DUE NOW
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-full">
                          Upcoming
                        </span>
                      )}
                    </div>

                    {/* Card Middle: Financial Figures */}
                    <div className="py-3 space-y-1 text-xs">
                      {isPaid ? (
                        <>
                          <div className="flex justify-between items-center text-slate-500">
                            <span>Gross Disbursed:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {formatMoney(month.disbursedGross, currency)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-slate-500">
                            <span>Taxes / Deductions:</span>
                            <span className="font-mono text-rose-600">
                              -{formatMoney(month.deductions, currency)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-100 font-bold">
                            <span className="text-slate-800">Net Take-Home:</span>
                            <span className="font-mono text-emerald-700 text-sm font-bold">
                              {formatMoney(month.disbursedNet, currency)}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 text-right pt-0.5">
                            Disbursed: {month.paymentDate || 'Processed'}
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1.5 py-1">
                          <div className="flex justify-between items-center text-slate-500">
                            <span>Scheduled Base:</span>
                            <span className="font-mono font-semibold text-slate-700">
                              {formatMoney(month.recommendedBase, currency)}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-100/70 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{isDue ? 'Ready for monthly payroll disbursement' : 'Pending calendar period arrival'}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Bottom: Action Button */}
                    <div className="pt-2 border-t border-slate-100">
                      {isPaid ? (
                        <button
                          type="button"
                          onClick={() => handleViewSlip(month)}
                          className="w-full py-1.5 px-3 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-800 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Pay Stub</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isCapReached}
                          onClick={() => handleOpenDisburse(month)}
                          className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs ${
                            isCapReached
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                              : isDue
                                ? 'bg-[#0f2b48] hover:bg-[#1a416b] text-white shadow-xs'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                          }`}
                        >
                          {isCapReached ? (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>Cap Reached (Locked)</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{isDue ? 'Disburse Salary' : 'Pre-Disburse'}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Disburse Monthly Salary Modal ──────────────────────────────── */}
      {isDisburseModalOpen && selectedMonthForDisbursal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0f2b48] text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-400/30">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">
                    Disburse Salary: {selectedMonthForDisbursal.monthName} {selectedYear}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {selectedEmp?.full_name} ({selectedEmp?.employee_id}) • {currency}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDisburseModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDisburse} className="p-6 space-y-4 text-xs">
              {/* Error Box */}
              {disburseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold">{disburseError}</span>
                </div>
              )}

              {/* Budget Cap Summary Bar inside Modal */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Annual Budget Cap & Remaining Allowance:</span>
                  </span>
                  <span className="font-mono text-slate-900">{formatMoney(annualSalary, currency)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">Disbursed So Far:</span>
                    <span className="font-bold font-mono text-slate-800">
                      {formatMoney(totalGrossPaid, currency)}
                    </span>
                  </div>
                  <div className={`p-2 rounded-lg border ${
                    modalExceedsCap ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-200'
                  }`}>
                    <span className="text-slate-400 block text-[10px]">Remaining Cap:</span>
                    <span className={`font-bold font-mono ${
                      modalExceedsCap ? 'text-rose-700' : 'text-emerald-800'
                    }`}>
                      {formatMoney(remainingCap, currency)}
                    </span>
                  </div>
                </div>

                {/* Over-Budget Alert Guardrail */}
                {modalExceedsCap && (
                  <div className="p-2.5 bg-rose-100 border border-rose-300 text-rose-900 rounded-lg font-bold text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      Over Budget! This amount exceeds the annual cap by {formatMoney(modalOverBy, currency)}. Disbursal is blocked.
                    </span>
                  </div>
                )}
              </div>

              {/* Inputs: Gross & Deductions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Gross Earnings ({currency === 'INR' ? '₹ INR' : '$ USD'}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={disburseGross}
                    onChange={(e) => setDisburseGross(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg font-mono text-xs focus:ring-2 ${
                      modalExceedsCap
                        ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-rose-400'
                        : 'border-slate-300 focus:ring-blue-500/20'
                    }`}
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Base: {formatMoney(ledgerData.monthlyBase, currency)}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {currency === 'INR' ? 'Deductions / TDS & PF (₹)' : 'Deductions / Taxes ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={disburseDeductions}
                    onChange={(e) => setDisburseDeductions(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Calculated Net Take-Home */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-emerald-950 font-bold block">Net Take-Home Deposit:</span>
                  <span className="text-[10px] text-emerald-700">Gross Earnings minus Statutory Deductions</span>
                </div>
                <span className="text-base font-bold font-mono text-emerald-800">
                  {formatMoney(modalNetCalc, currency)}
                </span>
              </div>

              {/* Payment Date & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment / Deposit Date</label>
                  <input
                    type="date"
                    required
                    value={disburseDate}
                    onChange={(e) => setDisburseDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={disburseStatus}
                    onChange={(e) => setDisburseStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Processing">Processing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Reference</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly salary run approved by HR"
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDisburseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDisburse || modalExceedsCap || modalGrossNum <= 0}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0f2b48] hover:bg-[#1a416b] rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmittingDisburse ? (
                    <span>Authorizing...</span>
                  ) : modalExceedsCap ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Exceeds Annual Cap</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Confirm & Disburse</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Annual Compensation Package Modal ─────────────────────── */}
      {isEditPackageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 bg-[#0f2b48] text-white">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold">Adjust Annual Compensation Package</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditPackageModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="p-6 space-y-4 text-xs">
              {packageError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{packageError}</span>
                </div>
              )}

              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Employee</span>
                <p className="text-sm font-bold text-slate-900">{selectedEmp?.full_name}</p>
                <p className="text-slate-500">{selectedEmp?.designation} • {currency}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Annual Package ({currency === 'INR' ? '₹ INR / LPA' : '$ USD'}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="1000"
                  required
                  placeholder={currency === 'INR' ? 'e.g. 1000000 (10 LPA)' : 'e.g. 120000'}
                  value={editSalaryInput}
                  onChange={(e) => setEditSalaryInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>In LPA: {formatLPA(parseFloat(editSalaryInput) || 0, currency)}</span>
                  <span>Monthly Base: {formatMoney(Math.round((parseFloat(editSalaryInput) || 0) / 12), currency)} / mo</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Revision Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Appraisal / Promotion adjustment"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditPackageModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPackage}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#0f2b48] hover:bg-[#1a416b] rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingPackage ? 'Saving...' : 'Save Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Pay Stub Detail Modal ────────────────────────────────── */}
      {selectedPayStub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-[#0f2b48] text-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">Shinetek Inc.</h2>
                    <span className="px-2 py-0.5 bg-blue-800 text-blue-200 text-[10px] font-bold rounded-full">
                      {selectedPayStub.currency === 'INR' ? '🇮🇳 India Payroll' : '🌐 US Payroll'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">Earnings & Statement of Salary Deposit</p>
                </div>
                <StatusBadge status={selectedPayStub.payment_status} size="sm" />
              </div>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Employee</span>
                  <p className="font-bold text-slate-900">{selectedPayStub.employee_name}</p>
                  <p className="font-mono text-[11px] text-blue-700">{selectedPayStub.employee_id}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Payment Date</span>
                  <p className="font-semibold text-slate-800">{selectedPayStub.payment_date}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Pay Period</span>
                  <p className="font-medium text-slate-800">{selectedPayStub.pay_period_start} to {selectedPayStub.pay_period_end}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Currency</span>
                  <p className="font-bold text-slate-900">{selectedPayStub.currency || 'USD'}</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Gross Compensation:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {formatMoney(selectedPayStub.gross_pay, selectedPayStub.currency)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">
                    {selectedPayStub.currency === 'INR' ? 'Statutory TDS, PF & Professional Tax:' : 'Federal/State Tax & Benefit Deductions:'}
                  </span>
                  <span className="font-mono font-semibold text-rose-600">
                    -{formatMoney(selectedPayStub.deductions, selectedPayStub.currency)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-300 text-sm font-bold">
                  <span className="text-slate-900">Net Take-Home Deposit:</span>
                  <span className="font-mono text-emerald-700">
                    {formatMoney(selectedPayStub.net_pay, selectedPayStub.currency)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPayStub(null)}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0f2b48] hover:bg-[#1a416b] rounded-lg transition-colors cursor-pointer"
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

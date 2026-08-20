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
  FileText
} from 'lucide-react';

export function AdminPayroll() {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Form State
  const [employeeId, setEmployeeId] = useState('');
  const [payPeriodStart, setPayPeriodStart] = useState('');
  const [payPeriodEnd, setPayPeriodEnd] = useState('');
  const [grossPay, setGrossPay] = useState('');
  const [deductions, setDeductions] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Paid');

  const fetchPayrollAndEmps = async () => {
    try {
      const [payData, empData] = await Promise.all([
        api.getAllPayroll(),
        api.getAllEmployees()
      ]);
      setPayrollRecords(payData.payrollRecords || []);
      setEmployees(empData.employees || []);
    } catch (err) {
      console.error('Failed to load payroll data:', err);
    }
  };

  useEffect(() => {
    fetchPayrollAndEmps();
  }, []);

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
        payPeriodStart,
        payPeriodEnd,
        grossPay: parseFloat(grossPay),
        deductions: parseFloat(deductions) || 0,
        paymentDate,
        paymentStatus
      });

      setStatusMessage('Payroll statement successfully generated and issued to employee.');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="enterprise-card p-6 bg-white border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Corporate Payroll Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Issue pay stubs, manage withholdings, and maintain employee deposit records
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0f2b48] hover:bg-[#1a416b] text-white text-xs font-bold rounded shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Pay Statement</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Payroll Table */}
      <div className="enterprise-card bg-white border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Pay Period</th>
                <th className="py-3.5 px-4">Gross Compensation</th>
                <th className="py-3.5 px-4">Deductions</th>
                <th className="py-3.5 px-4 font-bold text-slate-800">Net Take-Home</th>
                <th className="py-3.5 px-4">Deposit Date</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrollRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No payroll records created yet. Click "Issue Pay Statement" to add one.
                  </td>
                </tr>
              ) : (
                payrollRecords.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{p.employee_name || p.employee_id}</span>
                      <span className="font-mono text-[11px] text-blue-700 font-semibold">{p.employee_id}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      {p.pay_period_start} → {p.pay_period_end}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      ${parseFloat(p.gross_pay).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-rose-600">
                      -${parseFloat(p.deductions).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700 text-sm">
                      ${parseFloat(p.net_pay).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(p.payment_date).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <StatusBadge status={p.payment_status} size="sm" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Pay Statement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Issue Employee Payroll Statement</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePayroll} className="p-5 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Select Employee <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900 focus:ring-1 focus:ring-blue-600"
                >
                  <option value="">Select an employee</option>
                  {employees.map((emp) => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.full_name} ({emp.employee_id}) — {emp.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pay Period Start</label>
                  <input
                    type="date"
                    required
                    value={payPeriodStart}
                    onChange={(e) => setPayPeriodStart(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pay Period End</label>
                  <input
                    type="date"
                    required
                    value={payPeriodEnd}
                    onChange={(e) => setPayPeriodEnd(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Gross Pay ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 5200.00"
                    value={grossPay}
                    onChange={(e) => setGrossPay(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Deductions / Taxes ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1150.00"
                    value={deductions}
                    onChange={(e) => setDeductions(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                  />
                </div>
              </div>

              {/* Live Net Calculation Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Calculated Net Pay:</span>
                <span className="text-base font-bold text-emerald-700">
                  ${netCalc > 0 ? netCalc.toFixed(2) : '0.00'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded bg-white text-slate-900"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Processing">Processing</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0f2b48] hover:bg-[#1a416b] rounded shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Issuing...' : 'Issue Statement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

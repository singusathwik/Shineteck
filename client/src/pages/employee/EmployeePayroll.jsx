import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { DollarSign, FileText, Calendar, CheckCircle2, Download, Eye, X, Building2, Sparkles } from 'lucide-react';

function formatMoney(amount, currency = 'USD') {
  const num = parseFloat(amount) || 0;
  if (currency === 'INR') {
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function EmployeePayroll() {
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [selectedStub, setSelectedStub] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayroll = async () => {
    try {
      const data = await api.getMyPayroll();
      setPayrollRecords(data.payrollRecords || []);
    } catch (err) {
      console.error('Failed to load payroll:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="enterprise-header-banner p-6">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-display">
          Payment & Payroll Statements
        </h1>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          Review official earnings statements, tax withholdings, and net direct deposits issued by Shineteck Inc. HR
        </p>
      </div>

      {/* Table of Pay Records */}
      <div className="table-container shadow-sm">
        <table className="enterprise-table">
          <thead>
            <tr>
              <th>Pay Period Range</th>
              <th>Gross Earnings</th>
              <th>Taxes & Deductions</th>
              <th>Net Take-Home</th>
              <th>Payment Date</th>
              <th>Status</th>
              <th className="text-right">Statement</th>
            </tr>
          </thead>
          <tbody>
            {payrollRecords.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <DollarSign className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50 stroke-1" />
                  <p className="font-bold text-slate-700">No payroll statements issued yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Statements will appear here once authorized by HR.</p>
                </td>
              </tr>
            ) : (
              payrollRecords.map((p) => {
                const recCurrency = p.currency || (p.country === 'India' ? 'INR' : 'USD');
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="font-bold text-slate-900">
                      {p.pay_period_start} <span className="text-slate-400 font-normal">to</span> {p.pay_period_end}
                    </td>
                    <td className="font-mono text-slate-700 font-bold">
                      {formatMoney(p.gross_pay, recCurrency)}
                    </td>
                    <td className="font-mono text-rose-600 font-semibold">
                      -{formatMoney(p.deductions, recCurrency)}
                    </td>
                    <td className="font-bold font-mono text-emerald-700 text-sm">
                      {formatMoney(p.net_pay, recCurrency)}
                    </td>
                    <td className="text-slate-500 font-mono text-[11px]">
                      {p.payment_date || 'Processed'}
                    </td>
                    <td>
                      <StatusBadge status={p.payment_status || 'Paid'} size="sm" />
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedStub(p)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg border border-blue-200 transition-all cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
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

      {/* Paystub Detail Modal */}
      {selectedStub && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-display">Official Pay Statement</h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Period: {selectedStub.pay_period_start} &rarr; {selectedStub.pay_period_end}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStub(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Earnings Breakdown */}
            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Regular Total Hours:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedStub.hours_worked || 80} hrs</span>
                </div>
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Base Rate:</span>
                  <span className="font-mono text-slate-800">
                    {formatMoney(selectedStub.hourly_rate || (selectedStub.gross_pay / (selectedStub.hours_worked || 80)), selectedStub.currency)} / hr
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200/80 pt-2 font-bold text-slate-900">
                  <span>Total Gross Earnings:</span>
                  <span className="font-mono text-blue-700">{formatMoney(selectedStub.gross_pay, selectedStub.currency)}</span>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 space-y-2">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Federal/State Withholding & FICA:</span>
                  <span className="font-mono text-rose-700">-{formatMoney(selectedStub.deductions, selectedStub.currency)}</span>
                </div>
              </div>

              {/* Net Payout Banner */}
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wider block font-display">Net Direct Deposit Payout</span>
                  <span className="text-xl font-black font-mono text-emerald-900">
                    {formatMoney(selectedStub.net_pay, selectedStub.currency)}
                  </span>
                </div>
                <StatusBadge status={selectedStub.payment_status || 'Paid'} size="sm" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
              <span>Shineteck Inc. Corporate Payroll</span>
              <button
                type="button"
                onClick={() => setSelectedStub(null)}
                className="enterprise-btn-primary px-4 py-1.5"
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

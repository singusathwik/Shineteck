import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { DollarSign, FileText, Calendar, CheckCircle2, Download, Eye } from 'lucide-react';

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
      <div className="enterprise-card p-6 bg-white border-slate-200">
        <h1 className="text-xl font-bold text-slate-900">Payment & Payroll Statements</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review official earnings statements, tax withholdings, and net direct deposits issued by Shinetek Inc. HR
        </p>
      </div>

      {/* Table of Pay Records */}
      <div className="enterprise-card bg-white border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Pay Period</th>
                <th className="py-3.5 px-4">Gross Earnings</th>
                <th className="py-3.5 px-4">Taxes & Deductions</th>
                <th className="py-3.5 px-4 font-bold text-slate-800">Net Take-Home</th>
                <th className="py-3.5 px-4">Payment Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrollRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No payroll statements issued yet. Statements will appear here once authorized by HR.
                  </td>
                </tr>
              ) : (
                payrollRecords.map((p) => {
                  const recCurrency = p.currency || (p.country === 'India' ? 'INR' : 'USD');
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {p.pay_period_start} <span className="text-slate-400 font-normal">to</span> {p.pay_period_end}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {formatMoney(p.gross_pay, recCurrency)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-rose-600">
                        -{formatMoney(p.deductions, recCurrency)}
                      </td>
                      <td className="py-3.5 px-4 font-bold font-mono text-emerald-700 text-sm">
                        {formatMoney(p.net_pay, recCurrency)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {p.payment_date}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={p.payment_status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedStub(p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors"
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

      {/* Pay Stub Detail Modal */}
      {selectedStub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-[#0f2b48] text-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">Shinetek Inc.</h2>
                    <span className="px-2 py-0.5 bg-blue-800 text-blue-200 text-[10px] font-bold rounded-full">
                      {selectedStub.currency === 'INR' ? '🇮🇳 Indian Payroll' : '🌐 US Payroll'}
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
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Pay Period</span>
                  <p className="font-semibold text-slate-800">{selectedStub.pay_period_start} to {selectedStub.pay_period_end}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Disbursement Date</span>
                  <p className="font-semibold text-slate-800">{selectedStub.payment_date}</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Gross Compensation:</span>
                  <span className="font-mono font-semibold text-slate-800">
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

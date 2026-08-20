import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';
import { DollarSign, FileText, Calendar, CheckCircle2, Download, Eye } from 'lucide-react';

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
      <div className="enterprise-card bg-white border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pay Period</th>
                <th className="py-3 px-4">Gross Earnings</th>
                <th className="py-3 px-4">Total Deductions</th>
                <th className="py-3 px-4 font-bold text-slate-800">Net Pay</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Statement</th>
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
                payrollRecords.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {p.pay_period_start} <span className="text-slate-400 font-normal">to</span> {p.pay_period_end}
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
                    <td className="py-3.5 px-4">
                      <StatusBadge status={p.payment_status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedStub(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        View Stub
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Stub Detail Modal */}
      {selectedStub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
            <div className="p-6 bg-[#0f2b48] text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-bold">Shinetek Inc.</h2>
                  <p className="text-xs text-slate-300">Earnings & Statement of Deposit</p>
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
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Payment Date</span>
                  <p className="font-semibold text-slate-800">{selectedStub.payment_date}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Gross Compensation:</span>
                  <span className="font-semibold text-slate-800">${parseFloat(selectedStub.gross_pay).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Federal/State Tax & Benefit Deductions:</span>
                  <span className="font-semibold text-rose-600">-${parseFloat(selectedStub.deductions).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-t-2 border-slate-300 text-sm font-bold">
                  <span className="text-slate-900">Net Take-Home Deposit:</span>
                  <span className="text-emerald-700">${parseFloat(selectedStub.net_pay).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStub(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0f2b48] hover:bg-[#1a416b] rounded"
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

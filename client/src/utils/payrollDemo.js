import { invoiceAmounts } from './invoiceAmounts.js';
import { payrollPeriod } from './payrollPeriods.js';

// Demonstration records only. Never written to employee or accounting databases.
export const payrollDemoEmployee = {
  employee_id: 'DEMO-PAYROLL-US', full_name: 'Alex Morgan (Demo)',
  designation: 'Sample consultant', country: 'United States', is_demo: true,
  start_date: '2024-01-01', end_date: '2025-12-31'
};

export const payrollDemoInvoices = [2024, 2025].flatMap(year => Array.from({ length: 12 }, (_, index) => {
  const month = `${year}-${String(index + 1).padStart(2, '0')}`;
  const total_hours = [160, 152, 168, 176, 160, 164, 176, 168, 160, 184, 152, 160][index];
  const rate = year === 2024 ? 65 : 70;
  const paymentMonth = index === 11 ? `${year + 1}-01` : `${year}-${String(index + 2).padStart(2, '0')}`;
  return {
    id: `demo-${month}`, employee_id: payrollDemoEmployee.employee_id,
    invoice_number: `DEMO-${month}`, month, currency: 'USD', total_hours, rate,
    ...invoiceAmounts(total_hours, rate), status: 'Paid', due_date: `${paymentMonth}-15`,
    received_date: `${paymentMonth}-10`, paid_date: `${paymentMonth}-12`, is_demo: true
  };
}));

export const payrollDemoEntries = payrollDemoInvoices.map(invoice => ({
  id: invoice.id, employee_id: invoice.employee_id, employee_name: payrollDemoEmployee.full_name,
  payroll_month: invoice.month, ...payrollPeriod({ payroll_month: invoice.month }), period_inferred: false,
  total_hours: invoice.total_hours, bill_rate: invoice.rate, emp_bill_rate: invoice.rate * .75,
  gross_amount: invoice.employee_share, currency: 'USD', country: 'United States',
  vendor_name: 'Demo vendor', client_name: 'Demo client', is_demo: true
}));

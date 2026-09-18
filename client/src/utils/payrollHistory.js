export function paymentYears(invoices, entries) {
  return [...new Set([...invoices.map(row => row.month?.slice(0, 4)), ...entries.map(row => row.payroll_month?.slice(0, 4))].filter(Boolean))].sort().reverse();
}

export function monthlyPayments(invoices, entries, year, currency) {
  const sum = (rows, key) => rows.reduce((total, row) => total + Math.round(Number(row[key] || 0) * 100), 0) / 100;
  return Array.from({ length: 12 }, (_, index) => {
    const month = `${year}-${String(index + 1).padStart(2, '0')}`;
    const bills = invoices.filter(row => row.month === month && row.currency === currency);
    const legacy = entries.filter(row => row.payroll_month === month && row.currency === currency);
    return { month, count: bills.length, billingCount: legacy.length,
      invoice_amount: sum(bills, 'invoice_amount'), gross: sum(bills, 'employee_share'),
      tax: sum(bills, 'tax'), net: sum(bills, 'net_amount'),
      paid: sum(bills.filter(row => row.status === 'Paid'), 'net_amount'),
      outstanding: sum(bills.filter(row => row.status !== 'Paid'), 'net_amount'),
      billingGross: sum(legacy, 'gross_amount') };
  });
}

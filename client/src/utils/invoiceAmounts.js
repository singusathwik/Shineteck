// Shared by the editor and API. Integer arithmetic keeps both calculations exact.
export function invoiceAmounts(hours, rate) {
  const toHundredths = value => {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > 1000000) return 0n;
    return BigInt(Math.round(number * 100));
  };
  const invoiceCents = (toHundredths(hours) * toHundredths(rate) + 50n) / 100n;
  const shareCents = (invoiceCents * 75n + 50n) / 100n;
  const taxCents = (shareCents * 20n + 50n) / 100n;
  return {
    invoice_amount: Number(invoiceCents) / 100,
    employee_share: Number(shareCents) / 100,
    tax: Number(taxCents) / 100,
    net_amount: Number(shareCents - taxCents) / 100
  };
}

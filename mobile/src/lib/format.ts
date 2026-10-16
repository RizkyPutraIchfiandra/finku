/**
 * Money formatting — always Indonesian Rupiah (IDR).
 *
 * - `formatIDR(1500000)`  ->  "Rp1.500.000"
 * - `formatIDRCents(1234)` -> "Rp1.234,00" (for exact decimal amounts)
 *
 * A negative number keeps its sign so income/expense signs render correctly.
 */
export function formatIDR(value: number): string {
  const isNegative = value < 0;
  const abs = Math.abs(value);
  const whole = Math.round(abs); // IDR has no meaningful decimals for day-to-day use
  const formatted = whole.toLocaleString('id-ID');
  return `${isNegative ? '-' : ''}Rp${formatted}`;
}

/** Compact form for large numbers, e.g. "Rp1,5 jt" */
export function formatIDRShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) {
    const jt = (abs / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 });
    return `${sign}Rp${jt} jt`;
  }
  if (abs >= 1_000) {
    const rb = (abs / 1_000).toLocaleString('id-ID', { maximumFractionDigits: 0 });
    return `${sign}Rp${rb} rb`;
  }
  return `${sign}Rp${Math.round(abs)}`;
}

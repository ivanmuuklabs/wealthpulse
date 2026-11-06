/**
 * Parses a displayed currency string such as "$1,234.56", "-$12.34" or
 * "Total: $99.00" into a number. Keeps digits, the decimal point and a minus sign.
 */
export function parseMoney(text: string | null): number {
  return parseFloat((text ?? '').replace(/[^0-9.\-]/g, ''));
}

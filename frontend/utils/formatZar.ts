/** Whole ZAR amounts: space-separated thousands (e.g. `1 500 000`). */
export function formatZarInteger(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
    .format(Math.round(value))
    .replace(/,/g, ' ')
}

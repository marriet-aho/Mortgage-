export function money(n: number, currency: string = 'GHS'): string {
  return currency + ' ' + Math.round(n).toLocaleString('en-GB');
}

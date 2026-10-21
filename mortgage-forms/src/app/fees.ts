import { ProductCode } from './formDef';

export interface FeeLine { key: string; label: string; min: number; max: number; basis: string; when: string }

export const SEARCH_FEE = 4000;
export const VALUATION_MIN = 3500;
export const VALUATION_MAX = 10000;
export const REGISTRATION_PCT = 1.85;

function r2(n: number): number { return Math.round(n * 100) / 100; }

/** The five fees on the bank's requirements sheets. Insurance premiums are quoted by the insurer, so they carry no figure. */
export function feeLines(product: ProductCode, propertyValue: number): FeeLine[] {
  const reg = r2((REGISTRATION_PCT / 100) * Math.max(0, propertyValue));
  return [
    { key: 'search', label: 'Estimated Search Fees', min: SEARCH_FEE, max: SEARCH_FEE, basis: product === 'EQUITY_RELEASE' ? 'Ghs 4,000 (where applicable)' : 'Ghs 4,000', when: 'When the Mortgage Unit conducts the search report' },
    { key: 'valuation', label: 'Estimated Valuation Report fees', min: VALUATION_MIN, max: VALUATION_MAX, basis: 'Ranges from Ghs 3,500 to 10,000', when: 'When the Collateral Maintenance Unit orders the valuation. Debited to the account on the valuation form' },
    { key: 'registration', label: 'Estimated Mortgage Registration fee', min: reg, max: reg, basis: '1.85% * Property value', when: 'After approval, advised by the Securities Unit' },
    { key: 'life', label: 'Mortgage Life Insurance Policy', min: 0, max: 0, basis: 'Premium quoted by the insurer', when: 'After approval, before disbursement' },
    { key: 'home', label: 'Mortgage Home Protection policy', min: 0, max: 0, basis: 'Premium quoted by the insurer', when: 'After approval, before disbursement' }
  ];
}

export function feeTotals(lines: FeeLine[]): { min: number; max: number } {
  return lines.reduce(function (t, l) { return { min: t.min + l.min, max: t.max + l.max }; }, { min: 0, max: 0 });
}

export function ghs(n: number): string { return 'Ghs ' + Math.round(n).toLocaleString('en-GB'); }

import { DocCategory, DocRef, MortgageCase } from './types';

export interface DocSpec {
  docType: string;
  label: string;
  category: DocCategory;
  hint: string;
  required: (c: Pick<MortgageCase, 'product' | 'applicant'>) => boolean;
}

/** Document checklist for both products. Stored in a SharePoint library, one folder per case. */
export const DOC_SPECS: DocSpec[] = [
  { docType: 'NATIONAL_ID', label: 'National ID (Ghana Card)', category: 'IDENTITY', hint: 'Front and back', required: () => true },
  { docType: 'EMPLOYMENT_LETTER', label: 'Employment letter', category: 'INCOME', hint: 'Confirms position and employment type', required: () => true },
  { docType: 'PAYSLIPS', label: 'Payslips', category: 'INCOME', hint: 'Last three months', required: () => true },
  { docType: 'BANK_STATEMENTS', label: 'Bank statements', category: 'INCOME', hint: 'Last six months', required: () => true },
  { docType: 'EMPLOYER_CERT', label: 'Employer’s certification of income', category: 'INCOME', hint: 'Stamped by the employer', required: () => true },
  { docType: 'PASSPORT_PHOTOS', label: 'Passport pictures', category: 'IDENTITY', hint: 'Recent, one per borrower', required: () => true },
  { docType: 'OFFER_LETTER', label: 'Property offer letter', category: 'PROPERTY', hint: 'From the vendor or developer', required: (c) => c.product === 'HOME_PURCHASE' },
  { docType: 'SALE_AGREEMENT', label: 'Sale agreement', category: 'PROPERTY', hint: 'Signed or draft', required: (c) => c.product === 'HOME_PURCHASE' },
  { docType: 'PROPERTY_DOCS', label: 'Property documentation', category: 'PROPERTY', hint: 'Site plan, title or lease, building permit', required: () => true },
  { docType: 'REQUEST_LETTER', label: 'Equity release request letter', category: 'APPLICATION', hint: 'Reason and intended use of funds', required: (c) => c.product === 'EQUITY_RELEASE' },
  { docType: 'PURPOSE_EVIDENCE', label: 'Evidence for the purpose', category: 'APPLICATION', hint: 'Quote, invoice, admission letter or statement of need', required: (c) => c.product === 'EQUITY_RELEASE' },
  { docType: 'INSURANCE', label: 'Insurance', category: 'INSURANCE', hint: 'Needed before disbursement', required: () => false },
  { docType: 'OTHER', label: 'Additional supporting documents', category: 'APPLICATION', hint: 'Optional', required: () => false }
];

export function requiredSpecs(c: Pick<MortgageCase, 'product' | 'applicant'>): DocSpec[] {
  return DOC_SPECS.filter(function (s) { return s.required(c); });
}

export function documentCompleteness(
  c: Pick<MortgageCase, 'product' | 'applicant'>,
  docs: DocRef[]
): { pct: number; missing: DocSpec[] } {
  const req = requiredSpecs(c);
  const missing = req.filter(function (s) {
    return !docs.some(function (d) { return d.docType === s.docType; });
  });
  return { pct: req.length ? ((req.length - missing.length) / req.length) * 100 : 100, missing };
}

export function docLabel(docType: string): string {
  const s = DOC_SPECS.filter(function (x) { return x.docType === docType; })[0];
  return s ? s.label : docType;
}

import { DocCategory, DocRef, MortgageCase } from './types';

export type DocStage = 'PRE' | 'POST';

/** MODULE: collected here. AF: attached in Advance Flow, Create Staff Loan Step 2 (pre-approval). */
export type DocOwner = 'MODULE' | 'AF';

export interface DocCtx {
  product: MortgageCase['product'];
  applicant: Pick<MortgageCase['applicant'], 'maritalStatus'>;
  form?: { [key: string]: string | boolean };
  purchase?: Pick<NonNullable<MortgageCase['purchase']>, 'vendorType'>;
}

export interface DocSpec {
  docType: string;
  /** Wording taken from the bank's requirements sheet. */
  label: string;
  category: DocCategory;
  hint: string;
  stage: DocStage;
  owner: DocOwner;
  /** Shown as its own upload section on the application. */
  required: (c: DocCtx) => boolean;
  /** Visible to the applicant at all (optional rows still get an upload section). */
  applies: (c: DocCtx) => boolean;
}

const HP = (c: DocCtx): boolean => c.product === 'HOME_PURCHASE';
const ER = (c: DocCtx): boolean => c.product === 'EQUITY_RELEASE';
const PRIVATE = (c: DocCtx): boolean => HP(c) && !!c.purchase && c.purchase.vendorType === 'PRIVATE';
const MARRIED = (c: DocCtx): boolean => c.applicant.maritalStatus === 'MARRIED';
const always = (): boolean => true;
const never = (): boolean => false;

/** Collected in the module because Advance Flow does not take them: the signed forms and the search request pack. */
const MODULE_OWNED = ['APPLICATION_FORM', 'CONSENT_FORM', 'TITLE_DOCS', 'SITE_PLAN'];

function pre(docType: string, label: string, category: DocCategory, hint: string, required: (c: DocCtx) => boolean, applies?: (c: DocCtx) => boolean): DocSpec {
  return { docType, label, category, hint, stage: 'PRE', owner: MODULE_OWNED.indexOf(docType) >= 0 ? 'MODULE' : 'AF', required, applies: applies || always };
}
function post(docType: string, label: string, category: DocCategory, hint: string, required: (c: DocCtx) => boolean, applies?: (c: DocCtx) => boolean): DocSpec {
  return { docType, label, category, hint, stage: 'POST', owner: 'MODULE', required: never, applies: applies || required };
}

/**
 * Pre-approval and post-approval requirements, from the bank's
 * "REQUIREMENTS FOR STAFF HOME PURCHASE MORTGAGE PROGRAM" and
 * "REQUIREMENTS FOR STAFF EQUITY RELEASE MORTGAGE PROGRAM" (2026).
 * Stored in the SharePoint library, one folder per case.
 */
export const DOC_SPECS: DocSpec[] = [
  /* ---- pre-approval, both products ---- */
  pre('APPLICATION_FORM', 'A completed Mortgage Application form', 'APPLICATION', 'Signed electronically at the end of the application form: filed automatically', always),
  pre('CONSENT_FORM', 'A completed Customer Consent Form', 'CONSENT', 'Consent for credit bureau search: signed electronically and filed automatically', always),
  pre('REQUEST_LETTER', 'Request Letter for Equity Release Mortgage Facility', 'APPLICATION', 'Addressed to the bank, stating the purpose', ER),
  pre('OFFER_LETTER', 'A copy of the Offer letter / sales and purchases agreement', 'PROPERTY', 'From the vendor or developer', HP),
  pre('DOWN_PAYMENT_RECEIPT', 'Receipt of the down payment made to the vendor if available', 'PROPERTY', 'If you have already paid', never, HP),
  pre('SITE_PLAN', 'Personalized site plan on the subject property', 'PROPERTY', 'Sent with the Land Title Certificate to the Mortgage Unit for the search report', always),
  pre('VALUATION_REPORT', 'Valuation report (from FBGL recommended valuer)', 'COLLATERAL', 'Ordered through the Collateral Maintenance Unit: upload when received', always),
  pre('TITLE_DOCS', 'Title documents to the property / Land Title Certificate', 'PROPERTY', 'Also sent to the Mortgage Unit for the search report', always),
  pre('PASSPORT_PHOTO', 'Passport size picture', 'IDENTITY', '1 picture', always),
  pre('GHANA_CARD', 'A copy of Ghana Card (front and back)', 'IDENTITY', 'Must be verified at a branch before submission', always),
  pre('SPOUSE_GHANA_CARD', 'Ghana card (front and back) from spouse', 'IDENTITY', 'If married. Must be verified', MARRIED),
  pre('MARRIAGE_CERT', 'A copy of marriage Certificate', 'IDENTITY', 'Where applicable', MARRIED),
  pre('BUILDING_PERMIT', 'Submission of building/developmental permit', 'PROPERTY', 'Building or development permit (where applicable for Equity Release)', HP, always),
  pre('BILLS_OF_QUANTITIES', 'Submit Bills of Quantities', 'PROPERTY', 'Where applicable, for home improvement/renovation', never, ER),
  /* ---- pre-approval, private vendor ---- */
  pre('VENDOR_ID', 'ID of Vendor (preferably Ghana card, front and back)', 'IDENTITY', 'Must be verified', PRIVATE, PRIVATE),
  pre('VENDOR_DUE_DILIGENCE', 'Private vendor due diligence report', 'LEGAL', 'Place of residence, directional map, office location etc. You are solely responsible for the due diligence on the vendor', PRIVATE, PRIVATE),
  pre('VENDOR_COMPANY_DOCS', 'Certificate of incorporation, commencement of business and profile of management and directors of the Vendor’s company', 'LEGAL', 'Where applicable', never, PRIVATE),
  /* ---- post-approval ---- */
  post('SPOUSE_LEGAL_ADVICE', 'Independent legal advice from spouse and statutory declaration and consent', 'LEGAL', 'Where applicable. Use the sample document advised by Legal', MARRIED),
  post('DOWN_PAYMENT_PROOF', 'Proof of minimum down payment of purchase price of property', 'PROPERTY', 'Payment receipt and bank statement', HP),
  post('DEED_OF_INDENTURE', 'Four (4) Executed Deed of Indenture with site plans (between vendor and staff)', 'LEGAL', 'Add two extra site plans. Borrower and vendor sign behind all copies of the site plans', HP),
  post('ORIGINAL_TITLE', 'Title documents to the property / Land Title Certificate (original copies)', 'LEGAL', 'Original copies', ER),
  post('SUB_LEASE', 'Original Sub-Lease and duplicate copies (with two extra site plans) and all related documents required to perfect the mortgage title', 'LEGAL', 'As required by Fidelity Bank', ER),
  post('LIFE_POLICY', 'Life Insurance Policy with Fidelity Bank as first loss payee', 'INSURANCE', 'Approved vendors: Prudential Life / Enterprise Life (Equity Release); approved list of vendors (Home Purchase)', always),
  post('FIRE_POLICY', 'Fire and Hazard Policy with Fidelity Bank as first loss payee', 'INSURANCE', 'Enterprise / Hollard', always),
  post('LEGAL_FEES_RECEIPT', 'Payment of Mortgage registration fees', 'REGISTRATION', 'Legal fees are advised by the Securities Unit based on documents submitted', always)
];

export function requiredSpecs(c: DocCtx): DocSpec[] {
  return DOC_SPECS.filter(function (s) { return s.stage === 'PRE' && s.required(c); });
}

/** Everything the applicant is shown as an upload section before approval. */
export function preApprovalSpecs(c: DocCtx): DocSpec[] {
  return DOC_SPECS.filter(function (s) { return s.stage === 'PRE' && s.applies(c); });
}

export function postApprovalSpecs(c: DocCtx): DocSpec[] {
  return DOC_SPECS.filter(function (s) { return s.stage === 'POST' && s.applies(c); });
}

export function documentCompleteness(
  c: DocCtx,
  docs: DocRef[]
): { pct: number; missing: DocSpec[] } {
  const afDone = !!c.form && c.form.af_step2_confirmed === true;
  const req = requiredSpecs(c).filter(function (s) { return !(afDone && s.owner === 'AF'); });
  const missing = req.filter(function (s) {
    return !docs.some(function (d) { return d.docType === s.docType; });
  });
  return { pct: req.length ? ((req.length - missing.length) / req.length) * 100 : 100, missing };
}

export function docLabel(docType: string): string {
  const s = DOC_SPECS.filter(function (x) { return x.docType === docType; })[0];
  return s ? s.label : docType;
}

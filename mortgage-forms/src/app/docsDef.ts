import { ProductCode } from './formDef';

export interface DocCtx { product: ProductCode; married: boolean; privateVendor: boolean }

export interface DocItem {
  key: string;
  /** Wording from the bank's requirements sheet. */
  label: string;
  hint?: string;
  stage: 'pre' | 'post';
  /** Completed on this page (signed form), so there is nothing to upload. */
  here?: 'application' | 'consent' | 'request';
  /** Needed before submission. */
  required: boolean;
  /** A fee is payable in connection with this item. */
  fee?: string;
}

/** Pre-approval and post-approval items, in the order printed on the requirements sheets. */
export function docItems(c: DocCtx): DocItem[] {
  const hp = c.product === 'HOME_PURCHASE';
  const out: DocItem[] = [];
  const add = function (i: DocItem): void { out.push(i); };
  add({ key: 'application', label: hp ? 'A completed Mortgage Application form.' : 'A completed Mortgage Application form', stage: 'pre', here: 'application', required: true });
  add({ key: 'consent', label: hp ? 'A completed Customer Consent Form.' : 'A completed Customer Consent Form', stage: 'pre', here: 'consent', required: true });
  if (!hp) { add({ key: 'request', label: 'Request Letter for Equity Release Mortgage Facility', stage: 'pre', here: 'request', required: true }); }
  if (hp) {
    add({ key: 'offer_letter', label: 'A copy of the Offer letter / sales and purchases agreement', stage: 'pre', required: true });
    add({ key: 'down_payment_receipt', label: 'Receipt of the down payment made to the vendor if available', stage: 'pre', required: false });
  }
  add({ key: 'valuation_report', label: hp ? 'Submit Valuation report (from FBGL recommended valuer conducted by the Collateral and Maintenance unit)' : 'Submit Valuation report (from FBGL recommended valuer)', hint: 'Ordered with the Customer Asset Valuation Form. Upload it when the Collateral Maintenance Unit sends it.', stage: 'pre', required: true, fee: 'Valuation Report fee: Ghs 3,500 to 10,000' });
  add({ key: 'title_docs', label: 'Submit Title documents to the property / Land Title Certificate', hint: 'Also needed, with the Personalized site plan, for the Mortgage Unit search report.', stage: 'pre', required: true, fee: 'Search fee: Ghs 4,000' });
  add({ key: 'passport_ghana_card', label: hp ? 'Passport size picture and a copy of Ghana Card (front and back) (Must be Verified)' : '1 Passport size picture and a copy of Ghana Card (front and back) (Must be Verified)', hint: 'Ghana cards must be verified at any branch before submission.', stage: 'pre', required: true });
  add({ key: 'spouse_ghana_card', label: hp ? 'Attach Ghana card (front and back) from spouse (if married) (Must be Verified)' : 'A copy of Ghana Card for spouse - where applicable (Must be Verified)', stage: 'pre', required: c.married });
  add({ key: 'marriage_cert', label: 'Submit a Copy of marriage Certificate – Where applicable.', stage: 'pre', required: c.married });
  if (!hp) { add({ key: 'bills_of_quantities', label: 'Submit Bills of Quantities - where applicable', hint: 'For home improvement/renovation.', stage: 'pre', required: false }); }
  add({ key: 'building_permit', label: hp ? 'Submission of building/developmental permit.' : 'Submit Building Permit - where applicable.', stage: 'pre', required: hp });
  if (hp && c.privateVendor) {
    add({ key: 'vendor_id', label: 'ID of Vendor (preferably Ghana card – front and back) (Must be Verified)', stage: 'pre', required: true });
    add({ key: 'vendor_due_diligence', label: 'Private vendor due diligence report, place of residence, directional map, office location etc.', hint: 'Staff are solely responsible for performing due diligence on the Vendor.', stage: 'pre', required: true });
    add({ key: 'vendor_company_docs', label: 'Certificate of incorporation, commencement of business and profile of management and directors of the Vendor’s company – where applicable', stage: 'pre', required: false });
  }
  /* post approval */
  if (c.married) { add({ key: 'spouse_legal_advice', label: 'Independent legal advice from spouse and statutory declaration and consent (Use Sample document advised by Legal)', stage: 'post', required: false }); }
  if (hp) {
    add({ key: 'down_payment_proof', label: 'Proof of minimum down payment of purchase price of property - Payment receipt and bank statement', stage: 'post', required: false });
    add({ key: 'deed_of_indenture', label: 'Four (4) Executed Deed of Indenture with site plans (Between vendor & staff)', hint: 'Add two extra site plans. Borrower and vendor sign behind all copies of the site plans.', stage: 'post', required: false });
  } else {
    add({ key: 'original_title', label: 'Title documents to the property / Land Title Certificate (Original copies)', stage: 'post', required: false });
    add({ key: 'sub_lease', label: 'Original Sub-Lease and duplicate copies (with two extra site plans) and all related documents required by Fidelity Bank to perfect its Mortgage Title', stage: 'post', required: false });
  }
  add({ key: 'life_policy', label: 'Life Insurance Policy with Fidelity Bank as first loss payee', hint: hp ? 'From the approved list of vendors' : 'Prudential Life / Enterprise Life', stage: 'post', required: false, fee: 'Mortgage Life Insurance premium' });
  add({ key: 'fire_policy', label: 'Fire and Hazard Policy with Fidelity Bank as first loss payee', hint: hp ? 'Enterprise / Hollard (from the approved list of vendors)' : 'Enterprise / Hollard', stage: 'post', required: false, fee: 'Mortgage Home Protection premium' });
  add({ key: 'legal_fees_receipt', label: 'Payment of Mortgage registration fees (receipt)', hint: 'Legal fees are advised by the Securities Unit based on the documents submitted.', stage: 'post', required: false, fee: 'Mortgage registration fee: 1.85% of property value' });
  return out;
}

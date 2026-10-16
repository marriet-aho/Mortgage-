import { ProductCode } from './formDef';

/** Exact wording from "REQUIREMENTS FOR STAFF HOME PURCHASE / EQUITY RELEASE MORTGAGE PROGRAM" (2026). */
export interface Requirements {
  title: string;
  terms: string;
  policy?: string[];
  steps: string[];
  pre: Array<{ text: string; here?: string }>;
  privateVendor?: string[];
  post: string[];
  fees: string[];
  note?: string;
}

export const REQUIREMENTS: { [k in ProductCode]: Requirements } = {
  HOME_PURCHASE: {
    title: 'REQUIREMENTS FOR STAFF HOME PURCHASE MORTGAGE PROGRAM (LOCAL CURRENCY)',
    terms: 'Interest Rate 6% (Fixed). Term of Loan 20 years Maximum/Residual working life.',
    steps: [
      'Kindly submit a completed valuation form to the Collateral Maintenance Unit to conduct a Valuation Report on subject Property.',
      'Kindly send mail to the Mortgage Unit to conduct a search report on the property by providing the Land Title Certificate and Personalized site plan on the subject property.',
      'Kindly originate your loan request on Advanced flow by attaching the following preapproval documents.'
    ],
    pre: [
      { text: 'A completed Mortgage Application form.', here: 'application' },
      { text: 'A completed Customer Consent Form.', here: 'consent' },
      { text: 'A copy of the Offer letter / sales and purchases agreement' },
      { text: 'Receipt of the down payment made to the vendor if available' },
      { text: 'Submit Valuation report (from FBGL recommended valuer conducted by the Collateral and Maintenance unit)' },
      { text: 'Submit Title documents to the property / Land Title Certificate' },
      { text: 'Passport size picture and a copy of Ghana Card (front and back) (Must be Verified)' },
      { text: 'Attach Ghana card (front and back) from spouse (if married) (Must be Verified)' },
      { text: 'Submit a Copy of marriage Certificate – Where applicable.' },
      { text: 'Submission of building/developmental permit.' }
    ],
    privateVendor: [
      'ID of Vendor (preferably Ghana card – front and back) (Must be Verified)',
      'Private vendor due diligence report, place of residence, directional map, office location etc. (Please note that Staff are solely responsible for performing due diligence on the Vendor, for this reason the onus lies on you to submit accurate information on the Vendor for this transaction.)',
      'Certificate of incorporation, commencement of business and profile of management and directors of the Vendor’s company – where applicable'
    ],
    post: [
      'Independent legal advice from spouse and statutory declaration and consent (Where applicable). (Use Sample document advised by Legal).',
      'Submit Proof of minimum down payment of purchase price of property - Payment receipt and bank statement',
      'Submit Four (4) Executed Deed of Indenture with site plans (Between vendor & staff). (Add two extra site plans. Kindly ensure that the borrower and vendor sign behind all copies of the site plans.)',
      'Submit Life Insurance Policy with Fidelity Bank as first loss payee (From Approved list of Vendors)',
      'Submit Fire and Hazard Policy with Fidelity Bank as first loss payee (Enterprise/ Hollard) (From Approved list of Vendors)',
      'Legal fees to be advised by the Securities Unit based on documents submitted. (Payment of Mortgage registration Fees by staff)',
      'Property Inspection',
      'FIT-TO-LEND Certification – to be issued by the securities unit.'
    ],
    fees: ['Estimated Search Fees (Ghs 4,000)', 'Estimated Valuation Report fees (Ranges from Ghs 3,500 to 10,000)', 'Estimated Mortgage Registration fee (1.85% * Property value)', 'Mortgage Life Insurance Policy', 'Mortgage Home Protection policy'],
    note: 'NB – All Ghana cards submitted must be verified at any of our branches before submission.'
  },
  EQUITY_RELEASE: {
    title: 'REQUIREMENTS FOR STAFF EQUITY RELEASE MORTGAGE PROGRAM (LOCAL CURRENCY)',
    terms: 'Interest Rate 6% (Fixed). Term of Loan 20 years Maximum/Residual working life.',
    policy: [
      'Purpose: the following shall be the only grounds for approval under Equity Release: Home improvement/renovation (supported by the required documentation); Family Emergencies; Medical situation; Payment of Tuition.',
      'Property must be in the name of the applicant with perfected documentation.',
      'Amount shall not exceed 70% of the force sale value of the property.',
      'Applicant to bear all fees and charges that may arise in fulfilling request.'
    ],
    steps: [
      'Kindly submit a completed valuation form to the Collateral Maintenance Unit to conduct a Valuation Report on subject Property.',
      'Kindly send mail to the Mortgage Unit to conduct a search report on the property by providing the Land Title Certificate and Personalized site plan on the subject property. (Applicable for new Mortgages)',
      'Kindly originate your loan request on Advanced flow by attaching the following preapproval documents.'
    ],
    pre: [
      { text: 'A completed Mortgage Application form', here: 'application' },
      { text: 'A completed Customer Consent Form', here: 'consent' },
      { text: 'Request Letter for Equity Release Mortgage Facility', here: 'request' },
      { text: 'Submit Valuation report (from FBGL recommended valuer)' },
      { text: 'Submit Title documents to the property / Land Title Certificate' },
      { text: '1 Passport size picture and a copy of Ghana Card (front and back) (Must be Verified)' },
      { text: 'Submit a Copy of marriage Certificate – Where applicable.' },
      { text: 'A copy of Ghana Card for spouse - where applicable (Must be Verified)' },
      { text: 'Submit Bills of Quantities - where applicable' },
      { text: 'Submit Building Permit - where applicable.' }
    ],
    post: [
      'Independent legal advice from spouse and statutory declaration and consent (Use Sample document advised by Legal). (Where applicable)',
      'Submit Title documents to the property / Land Title Certificate (Original copies)',
      'Receipt of original Sub-Lease and duplicate copies (with two extra site plans) and all related documents required by Fidelity Bank to perfect its Mortgage Title.',
      'Submit Life Insurance Policy with Fidelity Bank as first loss payee (Prudential Life/ Enterprise Life)',
      'Submit Fire and Hazard Policy with Fidelity Bank as first loss payee (Enterprise/ Hollard)',
      'Legal fees to be advised by the Securities Unit based on documents submitted. (Payment of Mortgage registration Fees by staff)',
      'Property Inspection',
      'FIT-TO-LEND Certification – to be issued by the securities unit.'
    ],
    fees: ['Estimated Search Fees (Ghs 4,000) (Where applicable)', 'Estimated Valuation Report fees (Ranges from Ghs 3,500 to 10,000)', 'Estimated Mortgage Registration fee (1.85% * Property value)', 'Mortgage Life Insurance Policy', 'Mortgage Home Protection policy']
  }
};

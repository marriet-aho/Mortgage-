/**
 * The bank's own forms, as data. Labels are copied word for word from:
 *   - FB Mortgage Loan Application Form (and the completed samples for Home Purchase and Equity Release)
 *   - Customer Asset Valuation Form
 *   - Customer Consent Letter
 * Where a field was added by the module (not on the paper form) it is marked `module: true`
 * so the bank can see exactly what was added. Sections the staff samples cross out, because
 * Advance Flow already holds the data, are shown read-only from Advance Flow instead.
 */
export type ProductCode = 'HOME_PURCHASE' | 'EQUITY_RELEASE';
export const PRODUCT_LABEL: { [k in ProductCode]: string } = { HOME_PURCHASE: 'Home Purchase', EQUITY_RELEASE: 'Home Equity Release' };

export type FormValues = { [key: string]: string | boolean };

export type FieldKind = 'text' | 'textarea' | 'date' | 'number' | 'tel' | 'email' | 'radio' | 'select' | 'check';

export interface FieldDef {
  /** Base key. A pair row stores `b_<key>` (Borrower) and `c_<key>` (Co-Borrower). */
  key: string;
  /** Label exactly as printed on the form. */
  label: string;
  kind?: FieldKind;
  options?: Array<[string, string]>;
  /** Borrower and Co-Borrower columns, as on the paper form. */
  pair?: boolean;
  req?: boolean;
  wide?: boolean;
  hint?: string;
  /** Added by the module, not printed on the paper form. */
  module?: boolean;
  products?: ProductCode[];
  show?: (f: FormValues) => boolean;
}

export interface SectionDef {
  id: string;
  /** Heading exactly as printed. */
  title: string;
  note?: string;
  fields: FieldDef[];
  products?: ProductCode[];
}

export interface StepDef {
  id: string;
  title: string;
  sections: string[];
}

const YN: Array<[string, string]> = [['yes', 'Yes'], ['no', 'No']];

/* ---------------------------------------------------------------------- */
/* Mortgage Application Form                                              */
/* ---------------------------------------------------------------------- */

export const SECTIONS: SectionDef[] = [
  {
    id: 'type',
    title: 'TYPE OF MORTGAGE REQUESTED',
    note: '(PLEASE CHECK) The type is fixed by the product you chose. 1. Home Purchase, 2. Home Equity, 3. Home Completion, 4. Home Improvement.',
    fields: [
      { key: 'currency', label: 'CURRENCY', kind: 'radio', req: true, options: [['CEDI', 'CEDI'], ['DOLLAR', 'DOLLAR'], ['EURO', 'EURO'], ['OTHER', 'OTHER']] },
      { key: 'currency_other', label: 'OTHER', show: function (f) { return f.currency === 'OTHER'; } },
      { key: 'pension_backed', label: 'Pension-Backed Mortgage?', kind: 'radio', options: YN, products: ['EQUITY_RELEASE'], req: true, hint: 'Shown on the Equity Release sample form. If Yes, the pension checklist below applies.' }
    ]
  },
  {
    id: 'personal',
    title: 'PERSONAL INFORMATION',
    fields: [
      { key: 'residential_status', label: 'Residential Status', kind: 'radio', options: [['tenant', 'Tenant'], ['owner', 'Owner']], products: ['EQUITY_RELEASE'] },
      { key: 'rent_mortgage_amount', label: 'Rent/Mortgage Amount', kind: 'number', products: ['EQUITY_RELEASE'] },
      { key: 'last_name', label: 'Last Name:', pair: true, req: true },
      { key: 'first_name', label: 'First Name:', pair: true, req: true },
      { key: 'middle_name', label: 'Middle Name:', pair: true },
      { key: 'address', label: 'Current Residential Address:', kind: 'textarea', pair: true, req: true },
      { key: 'national_id', label: 'National ID #', pair: true, req: true, hint: 'Ghana Card, format GHA-000000000-0' },
      { key: 'cell', label: 'Cell Phone No:', kind: 'tel', pair: true, req: true },
      { key: 'email', label: 'E-Mail:', kind: 'email', pair: true, req: true },
      { key: 'tel_res', label: 'Tel. No. (Res.):', kind: 'tel', pair: true },
      { key: 'property_use', label: 'Property will be/ is', pair: true, req: true, hint: 'For example: Primary residence' },
      { key: 'previous_address', label: 'If current address is less than 1 year, provide previous address', kind: 'textarea', wide: true },
      { key: 'dob', label: 'Date of Birth', kind: 'date', pair: true, req: true },
      { key: 'sex', label: 'Sex', kind: 'radio', options: [['M', 'M'], ['F', 'F']], pair: true, req: true },
      { key: 'prefix', label: 'Prefix (PLEASE CHECK)', kind: 'radio', options: [['Mr', 'Mr'], ['Mrs', 'Mrs'], ['Ms', 'Ms'], ['Other', 'Other']], pair: true, req: true },
      { key: 'dependants', label: 'No. of Dependants', kind: 'number' },
      { key: 'dependant_ages', label: 'Ages', hint: 'For example: 5, 2' },
      { key: 'relationship', label: 'Relationship btn. Borrowers:', kind: 'radio', options: [['Spouse', 'Spouse'], ['Sibling', 'Sibling'], ['Parent/Child', 'Parent/Child'], ['Other', 'Other (please specify)']], show: function (f) { return f.has_co === true; } },
      { key: 'relationship_other', label: 'Other (please specify)', show: function (f) { return f.has_co === true && f.relationship === 'Other'; } }
    ]
  },
  {
    id: 'employment',
    title: 'EMPLOYMENT DETAILS',
    fields: [
      { key: 'ssn', label: 'Social Security No', pair: true },
      { key: 'occupation', label: 'Occupation', pair: true, req: true },
      { key: 'length_employment', label: 'Length of Employment', pair: true, req: true },
      { key: 'employer', label: 'Name of Current Employer or business if self employed', pair: true, req: true },
      { key: 'employer_address', label: 'Address of Employer or business', kind: 'textarea', pair: true }
    ]
  },
  {
    id: 'references',
    title: "MORTGAGE APPLICANT'S PERSONAL REFERENCE FORM",
    note: 'Please provide at least three relatives and two friends Resident in Ghana. Complete address with popular landmarks.',
    fields: [
      { key: 'ref_borrower_name', label: 'NAME OF BORROWER(S):', req: true },
      { key: 'ref_contact_tel', label: 'CONTACT TEL. NO:', kind: 'tel', req: true }
      // the five reference rows are generated below
    ]
  },
  {
    id: 'selfemp',
    title: 'SELF EMPLOYMENT',
    note: 'Only if self employed. Leave blank for staff.',
    fields: [
      { key: 'se_address', label: 'Address if self employed', pair: true },
      { key: 'se_tel', label: 'Business Telephone No.', kind: 'tel', pair: true },
      { key: 'se_share', label: 'Shareholding in business', pair: true },
      { key: 'se_nature', label: 'Nature of business', pair: true },
      { key: 'se_length', label: 'Length of employment', pair: true },
      { key: 'se_accountant', label: 'Name and address of accountant If self-employed', pair: true },
      { key: 'se_accountant_tel', label: 'Telephone Number (Accountant)', kind: 'tel', pair: true },
      { key: 'se_history', label: 'Please provide employment/business history over last 3 years', kind: 'textarea', wide: true }
    ]
  },
  {
    id: 'previous',
    title: 'PREVIOUS EMPLOYMENT',
    note: 'Leave blank if you have been with your current employer for three years or more.',
    fields: [
      { key: 'pe_occupation', label: 'Previous Occupation', pair: true },
      { key: 'pe_employer', label: 'Previous Employer/business name', pair: true },
      { key: 'pe_tel', label: 'Telephone number', kind: 'tel', pair: true },
      { key: 'pe_share', label: 'Shareholding in business', pair: true },
      { key: 'pe_nature', label: 'Nature of business', pair: true },
      { key: 'pe_length', label: 'Length of previous Employment/business', pair: true }
    ]
  },
  {
    id: 'bank',
    title: 'BANK DETAILS',
    fields: [
      { key: 'bank_name', label: 'Name and Address of Bank', pair: true, req: true },
      { key: 'bank_branch', label: 'Branch', pair: true, req: true },
      { key: 'bank_tel', label: 'Telephone Number', kind: 'tel', pair: true },
      { key: 'bank_account', label: 'Account Number', pair: true, req: true },
      { key: 'bank_years', label: 'How long has account been at this bank', pair: true, req: true }
    ]
  },
  {
    id: 'existing',
    title: 'EXISTING MORTGAGES',
    fields: [
      { key: 'q_mortgage_before', label: 'Have you ever had or applied for a Mortgage before?', kind: 'radio', options: YN, pair: true, req: true },
      { key: 'q_refused', label: 'Have you ever been refused credit before?', kind: 'radio', options: YN, pair: true, req: true },
      { key: 'q_equity', label: 'Are you using the available equity towards the new purchase?', kind: 'radio', options: YN, pair: true, req: true, products: ['HOME_PURCHASE'] },
      { key: 'ex_address', label: 'Address of Property Mortgaged', kind: 'textarea', pair: true },
      { key: 'ex_lender', label: 'Name and Address of first Lender', pair: true },
      { key: 'ex_date', label: 'Date of purchase', kind: 'date', pair: true },
      { key: 'ex_original', label: 'Original for house purchased', kind: 'number', pair: true },
      { key: 'ex_balance', label: 'Outstanding Balance', kind: 'number', pair: true },
      { key: 'ex_equity', label: 'Amount of equity existing on property', kind: 'number', pair: true }
    ]
  },
  {
    id: 'property',
    title: 'DETAILS OF PROPERTY UNDER THIS APPLICATION',
    fields: [
      { key: 'p_address', label: 'Address', kind: 'textarea', req: true, wide: true },
      { key: 'purchase_price', label: 'Purchase Price (Cedi/Dollar/Euro)', kind: 'number', req: true, products: ['HOME_PURCHASE'] },
      { key: 'down_payment', label: 'Down payment - (20% Minimum) (Cedi/Dollar/Euro)', kind: 'number', req: true, products: ['HOME_PURCHASE'] },
      { key: 'tenure', label: 'Is Property:', kind: 'radio', options: [['Freehold', 'Freehold'], ['Leasehold', 'Leasehold']], req: true },
      { key: 'age_years', label: 'Age of Property: (Years)', kind: 'number' },
      { key: 'in_construction', label: 'in the course of construction (new)', kind: 'check' },
      { key: 'house_type', label: 'House of Type:', kind: 'radio', options: [['2-BEDROOM', '2-BEDROOM'], ['3-Bedroom', '3-Bedroom'], ['4-Bedroom', '4-Bedroom'], ['Other', 'Other(specify)']], req: true },
      { key: 'house_other', label: 'Other(specify)', show: function (f) { return f.house_type === 'Other'; } },
      { key: 'developer', label: 'Name and address of developer:', kind: 'textarea', req: true, wide: true, hint: 'For Equity Release the sample form shows the owner here.' },
      { key: 'developer_tel', label: 'Telephone Number:', kind: 'tel', req: true },
      { key: 'unoccupied', label: 'Will the property be left unoccupied for more than 1 month continuously in any one year?', kind: 'radio', options: YN, req: true, wide: true },
      { key: 'unoccupied_details', label: 'Full details (separate sheet)', kind: 'textarea', wide: true, show: function (f) { return f.unoccupied === 'yes'; }, hint: 'If you replied YES, please give full details.' },
    ]
  },
  {
    id: 'insurance',
    title: 'LIFE INSURANCE',
    note: 'Life Insurance Company, Type, Policy Number, Sum Assured, Maturity Date. Optional now: the policies are required after approval.',
    fields: []
  },
  {
    id: 'poa',
    title: 'DETAILS OF HOLDER OF POWER OF ATTORNEY (NRG)',
    note: 'Only if you are a non-resident.',
    fields: [
      { key: 'poa_name', label: 'Name:' },
      { key: 'poa_address', label: 'Address:' },
      { key: 'poa_tel_office', label: 'Telephone No. Office:', kind: 'tel' },
      { key: 'poa_tel_home', label: 'Home:', kind: 'tel' }
    ]
  }
];

/** Rows that repeat: five references, assets, liabilities, life insurance policies. */
export const REFERENCE_ROWS: Array<{ n: number; kind: 'Relative' | 'Friend' }> = [
  { n: 0, kind: 'Relative' }, { n: 1, kind: 'Relative' }, { n: 2, kind: 'Relative' }, { n: 3, kind: 'Friend' }, { n: 4, kind: 'Friend' }
];
export const REFERENCE_COLUMNS: Array<{ key: string; label: string; kind?: FieldKind; req?: boolean }> = [
  { key: 'name', label: 'NAME', req: true },
  { key: 'home', label: 'ADDRESS (Please provide complete location address with popular landmarks): Home', req: true },
  { key: 'business', label: 'Business' },
  { key: 'occupation', label: 'OCCUPATION' },
  { key: 'relationship', label: 'RELATIONSHIP', req: true },
  { key: 'phone', label: 'PHONE NUMBERS', kind: 'tel', req: true }
];
export const ASSET_ROWS = 3;
export const LIABILITY_ROWS = 3;
export const INSURANCE_ROWS = 2;

/* ---------------------------------------------------------------------- */
/* Customer Asset Valuation Form                                          */
/* ---------------------------------------------------------------------- */

export const VALUATION_FORM: SectionDef = {
  id: 'valuation',
  title: 'CUSTOMER ASSET VALUATION FORM',
  note: 'Submitted to the Collateral Maintenance Unit, which assigns a Fidelity-recommended valuer.',
  fields: [
    { key: 'v_description', label: 'Asset Description: (Eg. Three-bedroom house, Factory premises, Head Office building complex, Factory plant and machinery etc)', kind: 'textarea', req: true, wide: true },
    { key: 'v_location', label: 'Location of Asset:', req: true },
    { key: 'v_digital', label: 'Digital Address:', req: true },
    { key: 'v_contact', label: 'Contact person:', req: true },
    { key: 'v_contact_no', label: 'Contact Number:', kind: 'tel', req: true },
    { key: 'v_acct_name', label: 'Account Name', req: true, hint: 'All costs incidental to the valuation of the above property(ies) are debited to this account.' },
    { key: 'v_acct_no', label: 'Account Number', req: true },
    { key: 'v_acct_branch', label: 'Branch', req: true },
    { key: 'v_sign_name', label: 'Authorized Signature: Name', req: true },
    { key: 'v_sign_title', label: 'Title', req: true }
  ]
};

/* ---------------------------------------------------------------------- */
/* Customer Consent Letter                                                */
/* ---------------------------------------------------------------------- */

export const CONSENT_HEADING = 'CONSENT FOR CREDIT BUREAU SEARCH';
export const CONSENT_ADDRESS = ['The Director, Retail Banking', 'Fidelity Bank Ghana Limited', 'PMB 43,', 'Cantonments-Accra'];
export const CONSENT_CLAUSES: Array<{ key: string; letter: string; text: string }> = [
  { key: 'consent_a', letter: 'a', text: 'I consent to Fidelity Bank Ghana Limited making enquiries about my credit records with any licensed credit reference agency to confirm any or all the information provided by me.' },
  { key: 'consent_b', letter: 'b', text: 'I further consent to Fidelity Bank Ghana Limited providing reference agencies with regular or any other relevant agency updates regarding the conduct of my account including any failure to meet these terms and obligations.' },
  { key: 'consent_c', letter: 'c', text: 'I consent to Fidelity Bank Ghana Limited providing other banks with bank reports relating to the conduct of my account on their request.' },
  { key: 'consent_d', letter: 'd', text: "I further consent to Fidelity Bank Ghana Limited carrying out identity and fraud prevention checks and share information relating to this application with the country's relevant law enforcement agencies." }
];

/* ---------------------------------------------------------------------- */
/* Declaration                                                            */
/* ---------------------------------------------------------------------- */

export const DECLARATION: string[] = [
  'I/We declare that all information given above and in any attachment is true and accurate and is to be regarded as forming part of any subsequent contract with and any insurers and acknowledge that I / we will be liable for any loss suffered by you / them as a result of any reliance upon my / our statement.',
  'I/We acknowledge that you may withdraw any offer you made and / or demand repayment of any mortgage monies in the event that I/we make a false declaration.',
  'I/We authorise any enquires considered necessary for the confirmation of the above particulars and for credit assessment and I/We authorise the disclosure of any information relating to this application to any other application [s] credit reference agencies and to any other person acting on your behalf.',
  'I/We understand that you reserve the right to withdraw the mortgage offer at any time upon receipt of any adverse information.',
  'I/We understand that you register information about me/us and the conduct of my/our account with any licensed credit reference agency. This information is used to assist in making credit decisions and to help prevent fraud or for tracing debtors.',
  'I/We understand that you may disclose any information given by me/us to any other member of Fidelity Group by a mailing list for marketing use and for the purpose of transferring the information to any other credit bureau.',
  'I/We understand that all fees payable in advance and is not returnable once expended whether or not an offer is made; and I/We accept that you have no responsibility to me/us or any other person as to the value or condition of the property.',
  'I/We agree to be bound by the Rules of the Housing Finance Program [as may be varied from time to time]',
  'I/We appreciate that this application may be declined without stating a reason.',
  'I/We understand that any mortgage together with any collateral security that may result from this application may at your discretion be transferred/assigned and used in relation to a securitization program. I/We agree that this may happen on the basis that my/our right under the relevant mortgage document will remain unaffected.'
];

/** Pension checklist printed on the Equity Release sample form. */
export const PENSION_CHECKLIST: string[] = [
  'Submit Occupational (tier 2) & or Provident Fund (tier 3) statement authenticated by Pension Scheme Managers',
  'Submit attestation letter from Pension Scheme Managers Confirming: i. That customer has met the minimum vesting period of the scheme; ii. Amount customer can pledge to the Bank; iii. Customer can go ahead with the Mortgage'
];

/* ---------------------------------------------------------------------- */
/* Steps of the Mortgage Application Form                                 */
/* ---------------------------------------------------------------------- */

export const STEPS: StepDef[] = [
  { id: 'personal', title: 'Type and personal information', sections: ['type', 'personal'] },
  { id: 'employment', title: 'Employment, references and bank', sections: ['employment', 'references', 'selfemp', 'previous', 'bank'] },
  { id: 'existing', title: 'Existing mortgages and assets', sections: ['existing', 'assets'] },
  { id: 'property', title: 'Property', sections: ['property', 'insurance', 'poa'] },
  { id: 'declaration', title: 'Declaration and signature', sections: ['declaration'] }
];

/* ---------------------------------------------------------------------- */
/* Helpers                                                                */
/* ---------------------------------------------------------------------- */

export function fieldKeys(f: FieldDef, hasCo: boolean): string[] {
  return f.pair ? (hasCo ? ['b_' + f.key, 'c_' + f.key] : ['b_' + f.key]) : [f.key];
}

export function visibleFields(sec: SectionDef, product: ProductCode, form: FormValues): FieldDef[] {
  return sec.fields.filter(function (f) {
    return (!f.products || f.products.indexOf(product) >= 0) && (!f.show || f.show(form));
  });
}

export function sectionById(id: string): SectionDef | undefined {
  return SECTIONS.filter(function (s) { return s.id === id; })[0];
}

export function str(f: FormValues, k: string): string {
  const v = f[k];
  return typeof v === 'string' ? v : v === true ? 'yes' : '';
}

export function numOf(f: FormValues, k: string): number {
  const n = Number(str(f, k).replace(/,/g, ''));
  return isFinite(n) ? n : 0;
}

export interface FormIssue {
  key: string;
  label: string;
  message: string;
  step: string;
}

const NID = /^GHA-\d{9}-\d$/i;
const PHONE = /^\+?[\d ]{9,15}$/;
const MAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Validates the application form. Every message names the label exactly as printed. */
export function validateForm(product: ProductCode, f: FormValues): FormIssue[] {
  const out: FormIssue[] = [];
  const hasCo = f.has_co === true;
  STEPS.forEach(function (step) {
    step.sections.forEach(function (sid) {
      const sec = sectionById(sid);
      if (!sec) { return; }
      visibleFields(sec, product, f).forEach(function (d) {
        if (d.pair && !hasCo) { check(d, 'b_' + d.key, 'Borrower'); }
        if (d.pair && hasCo) { check(d, 'b_' + d.key, 'Borrower'); check(d, 'c_' + d.key, 'Co-Borrower'); }
        if (!d.pair) { check(d, d.key, ''); }
        function check(def: FieldDef, key: string, who: string): void {
          const v = str(f, key).trim();
          const name = def.label.replace(/:$/, '') + (who ? ' (' + who + ')' : '');
          if (def.req && !v) { out.push({ key, label: name, message: name + ' is required', step: step.id }); return; }
          if (!v) { return; }
          if (def.key === 'national_id' && !NID.test(v)) { out.push({ key, label: name, message: name + ': use the format GHA-000000000-0', step: step.id }); }
          if ((def.kind === 'tel') && !PHONE.test(v)) { out.push({ key, label: name, message: name + ': enter 9 to 15 digits', step: step.id }); }
          if (def.kind === 'email' && !MAIL.test(v)) { out.push({ key, label: name, message: name + ': enter a full email address', step: step.id }); }
        }
      });
    });
  });
  REFERENCE_ROWS.forEach(function (r) {
    REFERENCE_COLUMNS.forEach(function (c) {
      if (c.req && !str(f, 'ref' + r.n + '_' + c.key).trim()) {
        out.push({ key: 'ref' + r.n + '_' + c.key, label: r.kind + ' ' + (r.n < 3 ? r.n + 1 : r.n - 2) + ' ' + c.label, message: 'Reference ' + (r.n + 1) + ' (' + r.kind.toLowerCase() + '): ' + c.label.split(':')[0] + ' is required', step: 'employment' });
      }
    });
  });
  return out;
}

/* ---------------------------------------------------------------------- */
/* Request Letter for Equity Release Mortgage Facility                     */
/* ---------------------------------------------------------------------- */

export const REQUEST_LETTER_HEADING = 'REQUEST FOR EQUITY RELEASE MORTGAGE FACILITY';
export const REQUEST_LETTER_ADDRESS = ['The Director, Retail Banking', 'Fidelity Bank Ghana Limited', 'PMB 43,', 'Cantonments-Accra'];
export const REQUEST_LETTER_PURPOSES: Array<[string, string]> = [
  ['Home improvement/renovation', 'Home improvement/renovation (supported by the required documentation)'],
  ['Family Emergencies', 'Family Emergencies'],
  ['Medical situation', 'Medical situation'],
  ['Payment of Tuition', 'Payment of Tuition']
];
export const REQUEST_LETTER: SectionDef = {
  id: 'request',
  title: REQUEST_LETTER_HEADING,
  note: 'The bank asked for this letter but did not supply a template. The wording below follows the Staff Equity Release policy. Replace it when the bank sends its own.',
  fields: [
    { key: 'rl_name', label: 'Your full name', req: true },
    { key: 'rl_date', label: 'Date', kind: 'date', req: true },
    { key: 'rl_amount', label: 'Amount requested (Cedis)', kind: 'number', req: true },
    { key: 'rl_purpose', label: 'Purpose of the Equity Release', kind: 'select', req: true, options: REQUEST_LETTER_PURPOSES, wide: true },
    { key: 'rl_property', label: 'Property to be mortgaged: address and title number', kind: 'textarea', req: true, wide: true },
    { key: 'rl_use', label: 'What the money will be used for', kind: 'textarea', req: true, wide: true },
    { key: 'rl_in_name', label: 'The property is in my name with perfected documentation', kind: 'check', req: true },
    { key: 'rl_70', label: 'I understand the amount shall not exceed 70% of the forced sale value of the property', kind: 'check', req: true },
    { key: 'rl_fees', label: 'I will bear all fees and charges that arise in fulfilling this request', kind: 'check', req: true }
  ]
};

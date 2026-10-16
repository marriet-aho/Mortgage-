import { CONSENT_CLAUSES, FormValues, ProductCode, REQUEST_LETTER, VALUATION_FORM, str, validateForm } from './formDef';
import { FormId } from './print';

export interface Issue { key: string; message: string; step: string }

/** Everything that stops a form from being complete. Steps only matter for the Application Form. */
export function formIssues(id: FormId, product: ProductCode, f: FormValues): Issue[] {
  const out: Issue[] = [];
  const need = function (key: string, ok: boolean, message: string, step: string): void { if (!ok) { out.push({ key, message, step }); } };
  if (id === 'application') {
    validateForm(product, f).forEach(function (i) { out.push({ key: i.key, message: i.message, step: i.step }); });
    need('sig_references', !!str(f, 'sig_references'), 'Sign the Personal Reference Form', 'employment');
    need('declaration', f.declaration === true, 'You must agree to the declaration', 'declaration');
    need('sig_application_b', !!str(f, 'sig_application_b'), 'Sign the form (Borrower)', 'declaration');
    if (f.has_co === true) { need('sig_application_c', !!str(f, 'sig_application_c'), 'The Co-Borrower must also sign', 'declaration'); }
  } else if (id === 'consent') {
    need('consent', CONSENT_CLAUSES.every(function (c) { return f[c.key] === true; }), 'Tick all four consents (a to d)', 'consent');
    need('consent_name', !!str(f, 'consent_name').trim(), 'Name is required', 'consent');
    need('consent_date', !!str(f, 'consent_date'), 'Date is required', 'consent');
    need('sig_consent', !!str(f, 'sig_consent'), 'Sign the consent letter', 'consent');
  } else if (id === 'valuation') {
    VALUATION_FORM.fields.forEach(function (d) { need(d.key, !d.req || !!str(f, d.key).trim(), d.label.split(':')[0] + ' is required', 'valuation'); });
    need('sig_valuation', !!str(f, 'sig_valuation'), 'Sign the valuation form (Authorized Signature)', 'valuation');
  } else {
    REQUEST_LETTER.fields.forEach(function (d) { need(d.key, d.kind === 'check' ? f[d.key] === true : !d.req || !!str(f, d.key).trim(), d.kind === 'check' ? 'Tick: ' + d.label : d.label + ' is required', 'request'); });
    need('sig_request', !!str(f, 'sig_request'), 'Sign the letter', 'request');
  }
  return out;
}

export function availableForms(product: ProductCode): FormId[] {
  return product === 'EQUITY_RELEASE' ? ['application', 'request', 'consent', 'valuation'] : ['application', 'consent', 'valuation'];
}

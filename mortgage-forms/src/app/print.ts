import {
  ASSET_MAX, CONSENT_ADDRESS, CONSENT_CLAUSES, CONSENT_HEADING, DECLARATION, FormValues,
  PENSION_CHECKLIST, ProductCode, PRODUCT_LABEL, REFERENCE_COLUMNS, REFERENCE_ROWS, REQUEST_LETTER, REQUEST_LETTER_ADDRESS,
  REQUEST_LETTER_HEADING, SECTIONS, SectionDef, VALUATION_FORM, str, visibleFields
} from './formDef';
import { SignatureValue, parseSignature } from './signature';

export type FormId = 'application' | 'consent' | 'valuation' | 'request';

export const FORM_TITLE: { [k in FormId]: string } = {
  application: 'Mortgage Application Form',
  consent: 'Customer Consent Letter',
  valuation: 'Customer Asset Valuation Form',
  request: 'Request Letter for Equity Release Mortgage Facility'
};

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function dateText(iso: string): string {
  return iso ? new Date(iso + (iso.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}

function value(v: string | boolean | undefined, kind?: string): string {
  if (v === true) { return '&#9746;'; }
  if (typeof v !== 'string' || !v) { return ''; }
  if (kind === 'date') { return esc(dateText(v)); }
  if (v === 'yes' || v === 'no') { return v === 'yes' ? 'Yes' : 'No'; }
  return esc(v).replace(/\n/g, '<br>');
}

export function signatureHtml(raw: string | boolean | undefined, label: string): string {
  const s: SignatureValue | undefined = parseSignature(raw);
  if (!s) { return '<div class="sig"><div class="sigbox"></div><div class="small">' + esc(label) + ': <b>not signed</b></div></div>'; }
  const img = s.mode === 'draw' ? '<img src="' + s.data + '" alt="signature" style="max-height:60px">' : '<span class="typed">' + esc(s.data) + '</span>';
  return '<div class="sig"><div class="sigbox">' + img + '</div><div class="small">' + esc(label) + ': signed electronically by <b>' + esc(s.name) + '</b> on ' + esc(new Date(s.at).toLocaleString('en-GB')) + '</div></div>';
}

function kv(rows: Array<[string, string]>): string {
  return '<table class="kv">' + rows.map(function (r) { return '<tr><th>' + esc(r[0]) + '</th><td>' + r[1] + '</td></tr>'; }).join('') + '</table>';
}

function sectionHtml(sec: SectionDef, product: ProductCode, f: FormValues): string {
  const hasCo = f.has_co === true;
  const fields = visibleFields(sec, product, f).filter(function (d) {
    return d.pair ? (!!f['b_' + d.key] || (hasCo && !!f['c_' + d.key])) : (f[d.key] !== undefined && f[d.key] !== '' && f[d.key] !== false);
  });
  if (!fields.length) { return ''; }
  let h = '<h3>' + esc(sec.title) + '</h3>';
  let i = 0;
  while (i < fields.length) {
    const isPair = !!fields[i].pair;
    const run: typeof fields = [];
    while (i < fields.length && !!fields[i].pair === isPair) { run.push(fields[i]); i++; }
    if (isPair) {
      h += '<table class="grid"><tr><th></th><th>Borrower</th>' + (hasCo ? '<th>Co-Borrower</th>' : '') + '</tr>' +
        run.map(function (d) { return '<tr><th>' + esc(d.label) + '</th><td>' + value(f['b_' + d.key], d.kind) + '</td>' + (hasCo ? '<td>' + value(f['c_' + d.key], d.kind) + '</td>' : '') + '</tr>'; }).join('') + '</table>';
    } else {
      h += kv(run.map(function (d) { return [d.label, value(f[d.key], d.kind)] as [string, string]; }));
    }
  }
  return h;
}

function referencesHtml(f: FormValues): string {
  let h = '<h3>MORTGAGE APPLICANT&rsquo;S PERSONAL REFERENCE FORM</h3>';
  h += kv([['NAME OF BORROWER(S):', value(f.ref_borrower_name)], ['CONTACT TEL. NO:', value(f.ref_contact_tel)]]);
  h += '<table class="grid"><tr><th>#</th>' + REFERENCE_COLUMNS.map(function (c) { return '<th>' + esc(c.label.split(' (')[0]) + '</th>'; }).join('') + '</tr>';
  REFERENCE_ROWS.forEach(function (r) {
    h += '<tr><th>' + (r.kind === 'Relative' ? 'Relative ' + (r.n + 1) : 'Friend ' + (r.n - 2)) + '</th>' + REFERENCE_COLUMNS.map(function (c) { return '<td>' + value(f['ref' + r.n + '_' + c.key]) + '</td>'; }).join('') + '</tr>';
  });
  h += '</table><p class="small">I/We do hereby certify that the information given above is true and accurate.</p>' + signatureHtml(f.sig_references, 'Signature');
  return h;
}

function assetsHtml(f: FormValues): string {
  let rows = '';
  for (let i = 0; i < ASSET_MAX; i++) {
    if (f['asset' + i + '_d'] || f['asset' + i + '_v']) { rows += '<tr><td>' + value(f['asset' + i + '_d']) + '</td><td>' + value(f['asset' + i + '_v']) + '</td></tr>'; }
  }
  return rows ? '<h3>ASSETS</h3><table class="grid"><tr><th>Type of Asset</th><th>Value (in Cedis)</th></tr>' + rows + '</table>' : '';
}

export function applicationHtml(product: ProductCode, f: FormValues): string {
  let h = '<h1>FIDELITY BANK</h1><h2>Mortgage Application Form</h2><p class="small">Form FBM0002B · ' + esc(PRODUCT_LABEL[product]) + '</p>';
  SECTIONS.forEach(function (sec) {
    if (sec.products && sec.products.indexOf(product) < 0) { return; }
    if (sec.id === 'references') { h += referencesHtml(f); return; }
    h += sectionHtml(sec, product, f);
    if (sec.id === 'financial') { h += assetsHtml(f); }
  });
  if (product === 'EQUITY_RELEASE' && f.pension_backed === 'yes') { h += '<h3>PENSION-BACKED MORTGAGE</h3><ul>' + PENSION_CHECKLIST.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'; }
  h += '<h3>DECLARATION</h3><ol class="small">' + DECLARATION.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>';
  h += signatureHtml(f.sig_application_b, 'Signed (Borrower)');
  if (f.has_co === true) { h += signatureHtml(f.sig_application_c, 'Signed (Co-Borrower)'); }
  return h;
}

export function consentHtml(f: FormValues): string {
  return '<h1>FIDELITY BANK</h1><h2>' + esc(CONSENT_HEADING) + '</h2>' +
    '<p>' + CONSENT_ADDRESS.map(esc).join('<br>') + '</p><p>Dear Sir/Madam,</p>' +
    '<ol type="a">' + CONSENT_CLAUSES.map(function (c) { return '<li>' + (f[c.key] === true ? '&#9746; ' : '&#9744; ') + esc(c.text) + '</li>'; }).join('') + '</ol>' +
    kv([['Name', value(f.consent_name)], ['Date', value(f.consent_date, 'date')]]) + signatureHtml(f.sig_consent, 'Signature');
}

export function valuationHtml(f: FormValues): string {
  return '<h1>FIDELITY BANK</h1><h2>' + esc(VALUATION_FORM.title) + '</h2><p class="small">' + esc(VALUATION_FORM.note || '') + '</p>' +
    kv(VALUATION_FORM.fields.map(function (d) { return [d.label, value(f[d.key], d.kind)] as [string, string]; })) + signatureHtml(f.sig_valuation, 'Authorized Signature');
}

export function requestHtml(f: FormValues): string {
  const checks = REQUEST_LETTER.fields.filter(function (d) { return d.kind === 'check'; });
  return '<h1>' + esc(str(f, 'rl_name') || '') + '</h1><p>' + value(f.rl_date, 'date') + '</p><p>' + REQUEST_LETTER_ADDRESS.map(esc).join('<br>') + '</p><p>Dear Sir/Madam,</p>' +
    '<h2>' + esc(REQUEST_LETTER_HEADING) + '</h2>' +
    '<p>I, ' + esc(str(f, 'rl_name') || '____') + ', request an Equity Release Mortgage Facility of <b>GHS ' + esc(Number(str(f, 'rl_amount') || '0').toLocaleString('en-GB')) + '</b> under the Staff Equity Release Mortgage Program (6% fixed, term of up to 20 years, maximum/residual working life) for: <b>' + esc(str(f, 'rl_purpose')) + '</b>.</p>' +
    kv([['Property to be mortgaged', value(f.rl_property)], ['What the money will be used for', value(f.rl_use)]]) +
    '<ul>' + checks.map(function (d) { return '<li>' + (f[d.key] === true ? '&#9746; ' : '&#9744; ') + esc(d.label) + '</li>'; }).join('') + '</ul>' +
    '<p>Yours faithfully,</p>' + signatureHtml(f.sig_request, 'Signature');
}

export function formHtml(id: FormId, product: ProductCode, f: FormValues): string {
  return id === 'application' ? applicationHtml(product, f) : id === 'consent' ? consentHtml(f) : id === 'valuation' ? valuationHtml(f) : requestHtml(f);
}

export const PRINT_CSS = `
.mf-sheet{font-family:Segoe UI,Arial,sans-serif;color:#2B2927;font-size:13px;line-height:1.4;background:#fff;padding:24px;max-width:820px;margin:0 auto}
.mf-sheet h1{font-size:20px;margin:0;color:#D95400;letter-spacing:.5px}.mf-sheet h2{font-size:17px;margin:2px 0 8px}
.mf-sheet h3{font-size:12px;letter-spacing:.6px;margin:16px 0 4px;background:#F1EFED;border-top:2px solid #F26A1B;padding:4px 8px}
.mf-sheet table{width:100%;border-collapse:collapse;margin:0 0 6px}.mf-sheet th,.mf-sheet td{border:1px solid #D2CECA;padding:4px 7px;text-align:left;vertical-align:top;font-size:12px}
.mf-sheet th{background:#F8F7F6;font-weight:600;width:34%}.mf-sheet .grid th{width:auto}.mf-sheet .small{font-size:11px;color:#55514E}
.mf-sheet .sig{margin:10px 0;break-inside:avoid}.mf-sheet .sigbox{border-bottom:1px solid #2B2927;min-height:56px;max-width:360px;display:flex;align-items:flex-end}
.mf-sheet .typed{font-family:"Segoe Script","Brush Script MT",cursive;font-size:26px}
`;

export function standalonePage(title: string, body: string): string {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>@page{margin:14mm}body{margin:0}' + PRINT_CSS + '</style></head><body><div class="mf-sheet">' + body + '</div></body></html>';
}

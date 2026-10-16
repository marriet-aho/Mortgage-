import * as React from 'react';
import {
  ASSET_ROWS, CONSENT_ADDRESS, CONSENT_CLAUSES, CONSENT_HEADING, DECLARATION, FieldDef, FormValues, INSURANCE_ROWS,
  LIABILITY_ROWS, PENSION_CHECKLIST, REFERENCE_COLUMNS, REFERENCE_ROWS, SectionDef, VALUATION_FORM, sectionById, str, visibleFields
} from '../domain/formDef';
import { ProductCode } from '../domain/types';
import { estimateFees } from '../domain/rules';
import { money } from '../format';
import { SignaturePad } from './signature';
import { Button, CheckField, Note, NumberField, Panel, RadioField, Section, SelectField, TextArea, TextField } from './ui';

type Set = (patch: FormValues) => void;
type Errs = { [key: string]: string };

function one(d: FieldDef, key: string, f: FormValues, set: Set, errs: Errs, suffix: string): JSX.Element {
  const id = 'f-' + key;
  const label = d.label + suffix;
  const v = str(f, key);
  const e = errs[key];
  const on = function (x: string): void { set({ [key]: x }); };
  if (d.kind === 'radio') { return <RadioField key={key} id={id} label={label} required={d.req} value={v} options={d.options || []} error={e} hint={d.hint} wide={d.wide} onChange={on} />; }
  if (d.kind === 'select') { return <SelectField key={key} id={id} label={label} required={d.req} value={v} options={d.options || []} error={e} hint={d.hint} onChange={function (x) { on(x || ''); }} />; }
  if (d.kind === 'textarea') { return <TextArea key={key} id={id} label={label} required={d.req} wide={d.wide !== false} value={v} error={e} hint={d.hint} onChange={on} />; }
  if (d.kind === 'check') { return <CheckField key={key} id={id} label={label} checked={f[key] === true} onChange={function (x) { set({ [key]: x }); }} />; }
  if (d.kind === 'number') { return <NumberField key={key} id={id} label={label} required={d.req} value={Number(v.replace(/,/g, '')) || 0} error={e} hint={d.hint} onChange={function (x) { on(String(x)); }} />; }
  return <TextField key={key} id={id} label={label} required={d.req} type={d.kind === 'date' ? 'date' : d.kind === 'tel' ? 'tel' : d.kind === 'email' ? 'email' : 'text'} value={v} error={e} hint={d.hint} wide={d.wide} onChange={on} />;
}

/** One section of the Mortgage Application Form, with the printed labels. Pair rows get Borrower and Co-Borrower columns. */
export function FormSection(p: { id: string; product: ProductCode; f: FormValues; set: Set; errs: Errs }): JSX.Element | null {
  const sec = sectionById(p.id);
  if (!sec || (sec.products && sec.products.indexOf(p.product) < 0)) { return null; }
  const hasCo = p.f.has_co === true;
  const fields = visibleFields(sec, p.product, p.f).filter(function (d) { return !(p.id === 'references' && false); });
  return (
    <Section title={sec.title}>
      {sec.note ? <div className="small muted" style={{ marginBottom: 8 }}>{sec.note}</div> : null}
      {p.id === 'personal' ? (
        <div style={{ marginBottom: 10 }}><CheckField id="f-has-co" label="There is a Co-Borrower" checked={hasCo} onChange={function (x) { p.set({ has_co: x }); }} /></div>
      ) : null}
      <div className="ma-fgrid">
        {fields.map(function (d) {
          if (d.pair) {
            return (
              <React.Fragment key={d.key}>
                {one(d, 'b_' + d.key, p.f, p.set, p.errs, hasCo ? ' (Borrower)' : '')}
                {hasCo ? one(d, 'c_' + d.key, p.f, p.set, p.errs, ' (Co-Borrower)') : null}
              </React.Fragment>
            );
          }
          return one(d, d.key, p.f, p.set, p.errs, '');
        })}
      </div>
      {p.id === 'references' ? <References f={p.f} set={p.set} errs={p.errs} name={p.f.b_first_name ? (str(p.f, 'b_first_name') + ' ' + str(p.f, 'b_last_name')).trim() : 'Borrower'} /> : null}
      {p.id === 'insurance' ? <InsuranceRows f={p.f} set={p.set} /> : null}
      {p.id === 'type' && p.product === 'EQUITY_RELEASE' && p.f.pension_backed === 'yes' ? (
        <Note><b>Pension-backed.</b><ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{PENSION_CHECKLIST.map(function (t) { return <li key={t}>{t}</li>; })}</ul></Note>
      ) : null}
    </Section>
  );
}

function References(p: { f: FormValues; set: Set; errs: Errs; name: string }): JSX.Element {
  return (
    <div style={{ marginTop: 12 }} className="ma-stack">
      {REFERENCE_ROWS.map(function (r) {
        return (
          <Panel key={r.n} title={(r.kind === 'Relative' ? 'Relative ' + (r.n + 1) : 'Friend ' + (r.n - 2)) + ' (' + (r.n + 1) + ' of 5)'}>
            <div className="ma-fgrid">
              {REFERENCE_COLUMNS.map(function (c) {
                const key = 'ref' + r.n + '_' + c.key;
                return <TextField key={key} id={'f-' + key} label={c.label} required={c.req} type={c.kind === 'tel' ? 'tel' : 'text'} value={str(p.f, key)} error={p.errs[key]} wide={c.key === 'home'} onChange={function (v) { p.set({ [key]: v }); }} />;
              })}
            </div>
          </Panel>
        );
      })}
      <div className="small" style={{ marginTop: 4 }}>I/We do hereby certify that the information given above is true and accurate.</div>
      <SignaturePad id="sig-references" label="Signature" signerName={p.name} value={p.f.sig_references} error={p.errs.sig_references} onChange={function (v) { p.set({ sig_references: v }); }} />
    </div>
  );
}

function InsuranceRows(p: { f: FormValues; set: Set }): JSX.Element {
  const rows: number[] = [];
  for (let i = 0; i < INSURANCE_ROWS; i++) { rows.push(i); }
  const cols: Array<[string, string]> = [['company', 'Life Insurance Company'], ['type', 'Type'], ['policy', 'Policy Number'], ['sum', 'Sum Assured'], ['maturity', 'Maturity Date']];
  return (
    <div className="ma-stack" style={{ marginTop: 8 }}>
      {rows.map(function (i) {
        return (
          <div key={i} className="ma-fgrid">
            {cols.map(function (c) {
              const key = 'ins' + i + '_' + c[0];
              return <TextField key={key} id={'f-' + key} label={c[1] + ' ' + (i + 1)} type={c[0] === 'maturity' ? 'date' : 'text'} value={str(p.f, key)} onChange={function (v) { p.set({ [key]: v }); }} />;
            })}
          </div>
        );
      })}
    </div>
  );
}

/** Assets and liabilities tables, as on the paper form. */
export function AssetsSection(p: { f: FormValues; set: Set }): JSX.Element {
  const block = function (prefix: string, count: number, head: string, d1: string, d2: string): JSX.Element {
    const rows: number[] = [];
    for (let i = 0; i < count; i++) { rows.push(i); }
    return (
      <Section title={head}>
        <div className="ma-stack">
          {rows.map(function (i) {
            return (
              <div key={i} className="ma-fgrid">
                <TextField id={'f-' + prefix + i + '_d'} label={d1 + ' ' + (i + 1)} value={str(p.f, prefix + i + '_d')} onChange={function (v) { p.set({ [prefix + i + '_d']: v }); }} />
                <NumberField id={'f-' + prefix + i + '_v'} label={d2 + ' ' + (i + 1)} value={Number(str(p.f, prefix + i + '_v')) || 0} onChange={function (v) { p.set({ [prefix + i + '_v']: String(v) }); }} />
              </div>
            );
          })}
        </div>
      </Section>
    );
  };
  return (
    <>
      {block('asset', ASSET_ROWS, 'ASSETS', 'Type of Asset', 'Value (in Cedis)')}
      {block('liab', LIABILITY_ROWS, 'LIABILITITES', 'Type of Liability', 'Value (in Cedis)')}
    </>
  );
}

/** Customer Asset Valuation Form. Its Send action routes to the Collateral Maintenance Unit. */
export function ValuationSection(p: { f: FormValues; set: Set; errs: Errs; sent?: string; onSend: () => void; canSend: boolean; signer: string }): JSX.Element {
  const sec: SectionDef = VALUATION_FORM;
  return (
    <Section title={sec.title}>
      <div className="small muted" style={{ marginBottom: 8 }}>Step 1 of the bank&rsquo;s process. {sec.note}</div>
      <div className="ma-fgrid">{sec.fields.map(function (d) { return one(d, d.key, p.f, p.set, p.errs, ''); })}</div>
      <div style={{ marginTop: 10 }}><SignaturePad id="sig-valuation" label="Authorized Signature" signerName={p.signer} value={p.f.sig_valuation} error={p.errs.sig_valuation} onChange={function (v) { p.set({ sig_valuation: v }); }} /></div>
      <div className="ma-row" style={{ marginTop: 10 }}>
        <Button primary disabled={!p.canSend || !!p.sent} onClick={p.onSend}>{p.sent ? 'Sent to the Collateral Maintenance Unit' : 'Send to the Collateral Maintenance Unit'}</Button>
        {p.sent ? <span className="small muted">The unit assigns a Fidelity-recommended valuer. Upload the valuation report in Pre-approval documents when you get it.</span> : <span className="small muted">Fill in every field to send.</span>}
      </div>
    </Section>
  );
}

export function SearchSection(p: { sent?: string; onSend: () => void; ready: boolean; upload?: React.ReactNode }): JSX.Element {
  return (
    <Section title="SEARCH REPORT REQUEST">
      <div className="small muted" style={{ marginBottom: 8 }}>Step 2 of the bank&rsquo;s process. The Mortgage Unit conducts a search report on the property from the Land Title Certificate and the Personalized site plan. Upload both below, then send.</div>
      {p.upload}
      <div className="ma-row">
        <Button primary disabled={!p.ready || !!p.sent} onClick={p.onSend}>{p.sent ? 'Sent to the Mortgage Unit' : 'Send to the Mortgage Unit'}</Button>
        {!p.ready ? <span className="small muted">Upload the Land Title Certificate and the Personalized site plan first.</span> : null}
      </div>
    </Section>
  );
}

export function FeesPanel(p: { product: ProductCode; propertyValue: number }): JSX.Element {
  const lines = estimateFees(p.product, p.propertyValue);
  return (
    <Panel title="Fees expected">
      <table className="ma-t"><tbody>
        {lines.map(function (l, i) {
          return <tr key={l.label}><td>{i + 1}. {l.label}{l.note ? <div className="small muted">{l.note}</div> : null}</td><td className="right num">{l.max === 0 ? 'Quoted by insurer' : l.min === l.max ? money(l.min) : money(l.min) + ' to ' + money(l.max)}</td></tr>;
        })}
      </tbody></table>
      <div className="small muted" style={{ marginTop: 6 }}>All fees are payable by you and are not returnable once expended, whether or not an offer is made.</div>
    </Panel>
  );
}

export function ConsentLetter(p: { f: FormValues; set: Set; errs: Errs; name: string }): JSX.Element {
  return (
    <Section title={CONSENT_HEADING}>
      <div style={{ marginBottom: 8 }}>{CONSENT_ADDRESS.map(function (l) { return <div key={l}>{l}</div>; })}</div>
      <p>Dear Sir/Madam,</p>
      <div className="ma-stack" style={{ gap: 8 }}>
        {CONSENT_CLAUSES.map(function (c) {
          return <CheckField key={c.key} id={'f-' + c.key} label={c.letter + '. ' + c.text} checked={p.f[c.key] === true} onChange={function (x) { p.set({ [c.key]: x }); }} />;
        })}
      </div>
      {p.errs.consent ? <div style={{ color: '#A04000', fontWeight: 600, marginTop: 6 }}>{p.errs.consent}</div> : null}
      <div className="ma-fgrid" style={{ marginTop: 10 }}>
        <TextField id="f-consent-name" label="Name" required value={str(p.f, 'consent_name')} hint={'As on your Ghana Card: ' + p.name} error={p.errs.consent_name} onChange={function (v) { p.set({ consent_name: v }); }} />
        <TextField id="f-consent-date" label="Date" type="date" required value={str(p.f, 'consent_date')} onChange={function (v) { p.set({ consent_date: v }); }} />
      </div>
      <div style={{ marginTop: 10 }}><SignaturePad id="sig-consent" label="Signature" signerName={p.name} value={p.f.sig_consent} error={p.errs.sig_consent} onChange={function (v) { p.set({ sig_consent: v }); }} /></div>
      <div className="small muted" style={{ marginTop: 6 }}>Once signed, the letter is filed as the Customer Consent Form. You do not need to print or upload it.</div>
    </Section>
  );
}

export function DeclarationSection(p: { f: FormValues; set: Set; errs: Errs; name: string; coName?: string }): JSX.Element {
  return (
    <Section title="DECLARATION">
      <ol style={{ margin: '0 0 10px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>{DECLARATION.map(function (t) { return <li key={t} className="small">{t}</li>; })}</ol>
      <CheckField id="f-declare" label="I/We agree to the declaration above" checked={p.f.declaration === true} onChange={function (x) { p.set({ declaration: x }); }} />
      {p.errs.declaration ? <div style={{ color: '#A04000', fontWeight: 600, marginTop: 6 }}>{p.errs.declaration}</div> : null}
      <div className="ma-stack" style={{ marginTop: 10 }}>
        <SignaturePad id="sig-application-b" label="Signature of Borrower" signerName={p.name} value={p.f.sig_application_b} error={p.errs.sig_application_b} onChange={function (v) { p.set({ sig_application_b: v }); }} />
        {p.coName ? <SignaturePad id="sig-application-c" label="Signature of Co-Borrower" signerName={p.coName} value={p.f.sig_application_c} error={p.errs.sig_application_c} onChange={function (v) { p.set({ sig_application_c: v }); }} /> : null}
      </div>
      <div className="small muted" style={{ marginTop: 6 }}>Once signed, the completed Mortgage Application Form is filed. You do not need to print or upload it.</div>
    </Section>
  );
}

export { VALUATION_FORM };

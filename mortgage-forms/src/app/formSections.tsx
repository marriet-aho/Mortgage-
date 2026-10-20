import * as React from 'react';
import {
  ASSET_MAX, CONSENT_ADDRESS, CONSENT_CLAUSES, CONSENT_HEADING, DECLARATION, FieldDef, FormValues,
  PENSION_CHECKLIST, REFERENCE_COLUMNS, REFERENCE_ROWS, SectionDef, VALUATION_FORM, sectionById, str, visibleFields
} from './formDef';
import { ProductCode } from './formDef';
import { SignaturePad } from './signature';
import { CheckField, Note, NumberField, Panel, RadioField, Section, SelectField, TextArea, TextField } from './ui';

type Set = (patch: FormValues) => void;
type Errs = { [key: string]: string };

export function one(d: FieldDef, key: string, f: FormValues, set: Set, errs: Errs, suffix: string): JSX.Element {
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
  return <TextField key={key} id={id} label={label} readOnly={d.readOnly} required={d.req} type={d.kind === 'date' ? 'date' : d.kind === 'tel' ? 'tel' : d.kind === 'email' ? 'email' : 'text'} value={v} error={e} hint={d.hint} wide={d.wide} onChange={on} />;
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
      {p.id === 'personal' && p.product === 'EQUITY_RELEASE' ? (
        <div style={{ marginBottom: 10 }}><CheckField id="f-has-co" label="There is a Co-Borrower" checked={hasCo} onChange={function (x) { p.set({ has_co: x }); }} /></div>
      ) : null}
      <div className="mf-fgrid">
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
      {p.id === 'type' && p.product === 'EQUITY_RELEASE' && p.f.pension_backed === 'yes' ? (
        <Note><b>Pension-backed.</b><ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{PENSION_CHECKLIST.map(function (t) { return <li key={t}>{t}</li>; })}</ul></Note>
      ) : null}
    </Section>
  );
}

function References(p: { f: FormValues; set: Set; errs: Errs; name: string }): JSX.Element {
  return (
    <div style={{ marginTop: 12 }} className="mf-stack">
      {REFERENCE_ROWS.map(function (r) {
        return (
          <Panel key={r.n} title={(r.kind === 'Relative' ? 'Relative ' + (r.n + 1) : 'Friend ' + (r.n - 2)) + ' (' + (r.n + 1) + ' of 5)'}>
            <div className="mf-fgrid">
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

/** ASSETS, as in the Equity Release sample: type of asset and value, one row to start, more on request. */
export function AssetsSection(p: { f: FormValues; set: Set; errs: Errs }): JSX.Element {
  const count = Math.min(ASSET_MAX, Math.max(1, Number(str(p.f, 'asset_count')) || 1));
  const rows: number[] = [];
  for (let i = 0; i < count; i++) { rows.push(i); }
  return (
    <Section title="ASSETS">
      <div className="mf-stack">
        {rows.map(function (i) {
          return (
            <div key={i} className="mf-fgrid">
              <TextField id={'f-asset' + i + '_d'} label={'Type of Asset' + (count > 1 ? ' ' + (i + 1) : '')} required={i === 0} error={p.errs['asset' + i + '_d']} value={str(p.f, 'asset' + i + '_d')} onChange={function (v) { p.set({ ['asset' + i + '_d']: v }); }} />
              <NumberField id={'f-asset' + i + '_v'} label={'Value (in Cedis)' + (count > 1 ? ' ' + (i + 1) : '')} required={i === 0} error={p.errs['asset' + i + '_v']} value={Number(str(p.f, 'asset' + i + '_v')) || 0} onChange={function (v) { p.set({ ['asset' + i + '_v']: String(v) }); }} />
            </div>
          );
        })}
        {count < ASSET_MAX ? <div><button type="button" className="mf-btn sm" onClick={function () { p.set({ asset_count: String(count + 1) }); }}>Add another asset</button></div> : null}
      </div>
    </Section>
  );
}

/** Customer Asset Valuation Form. */
export function ValuationSection(p: { f: FormValues; set: Set; errs: Errs; signer: string }): JSX.Element {
  const sec: SectionDef = VALUATION_FORM;
  return (
    <Section title={sec.title}>
      <div className="small muted" style={{ marginBottom: 8 }}>{sec.note}</div>
      <div className="mf-fgrid">{sec.fields.map(function (d) { return one(d, d.key, p.f, p.set, p.errs, ''); })}</div>
      <div style={{ marginTop: 10 }}><SignaturePad id="sig-valuation" label="Authorized Signature" signerName={p.signer} value={p.f.sig_valuation} error={p.errs.sig_valuation} onChange={function (v) { p.set({ sig_valuation: v }); }} /></div>
    </Section>
  );
}

export function ConsentLetter(p: { f: FormValues; set: Set; errs: Errs; name: string }): JSX.Element {
  return (
    <Section title={CONSENT_HEADING}>
      <div style={{ marginBottom: 8 }}>{CONSENT_ADDRESS.map(function (l) { return <div key={l}>{l}</div>; })}</div>
      <p>Dear Sir/Madam,</p>
      <div className="mf-stack" style={{ gap: 8 }}>
        {CONSENT_CLAUSES.map(function (c) {
          return <CheckField key={c.key} id={'f-' + c.key} label={c.letter + '. ' + c.text} checked={p.f[c.key] === true} onChange={function (x) { p.set({ [c.key]: x }); }} />;
        })}
      </div>
      {p.errs.consent ? <div style={{ color: '#A04000', fontWeight: 600, marginTop: 6 }}>{p.errs.consent}</div> : null}
      <div className="mf-fgrid" style={{ marginTop: 10 }}>
        <TextField id="f-consent-name" label="Name" required value={str(p.f, 'consent_name')} hint={'As on your Ghana Card: ' + p.name} error={p.errs.consent_name} onChange={function (v) { p.set({ consent_name: v }); }} />
        <TextField id="f-consent-date" label="Date" type="date" required value={str(p.f, 'consent_date')} onChange={function (v) { p.set({ consent_date: v }); }} />
      </div>
      <div style={{ marginTop: 10 }}><SignaturePad id="sig-consent" label="Signature" signerName={p.name} value={p.f.sig_consent} error={p.errs.sig_consent} onChange={function (v) { p.set({ sig_consent: v }); }} /></div>
      <div className="small muted" style={{ marginTop: 6 }}>Once signed, print or save the letter as a PDF to attach in Advance Flow.</div>
    </Section>
  );
}

export function DeclarationSection(p: { f: FormValues; set: Set; errs: Errs; name: string; coName?: string }): JSX.Element {
  return (
    <Section title="DECLARATION">
      <ol style={{ margin: '0 0 10px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>{DECLARATION.map(function (t) { return <li key={t} className="small">{t}</li>; })}</ol>
      <CheckField id="f-declare" label="I/We agree to the declaration above" checked={p.f.declaration === true} onChange={function (x) { p.set({ declaration: x }); }} />
      {p.errs.declaration ? <div style={{ color: '#A04000', fontWeight: 600, marginTop: 6 }}>{p.errs.declaration}</div> : null}
      <div className="mf-stack" style={{ marginTop: 10 }}>
        <SignaturePad id="sig-application-b" label="Signature of Borrower" signerName={p.name} value={p.f.sig_application_b} error={p.errs.sig_application_b} onChange={function (v) { p.set({ sig_application_b: v }); }} />
        {p.coName ? <SignaturePad id="sig-application-c" label="Signature of Co-Borrower" signerName={p.coName} value={p.f.sig_application_c} error={p.errs.sig_application_c} onChange={function (v) { p.set({ sig_application_c: v }); }} /> : null}
      </div>
      <div className="small muted" style={{ marginTop: 6 }}>Once signed, print or save the form as a PDF to attach in Advance Flow.</div>
    </Section>
  );
}



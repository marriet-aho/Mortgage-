import * as React from 'react';
import { AssetsSection, ConsentLetter, DeclarationSection, FormSection, ValuationSection, one } from './formSections';
import { SignaturePad } from './signature';
import { Button, Chip, Head, Note, Panel, Section } from './ui';
import { FormValues, PRODUCT_LABEL, ProductCode, REQUEST_LETTER, STEPS, str } from './formDef';
import { FORM_TITLE, FormId, PRINT_CSS, formHtml, standalonePage } from './print';
import { availableForms, formIssues } from './check';
import { REQUIREMENTS } from './requirements';
import { FormStore } from './store';
import { injectStyles } from './styles';

export interface FormsAppProps {
  store: FormStore;
  userName: string;
  userEmail: string;
  /** Address of Advance Flow, so people can jump to Create Staff Loan. Optional. */
  advanceFlowUrl?: string;
  /** How to leave for Advance Flow. Defaults to opening the address in this window. The preview overrides it. */
  navigate?: (url: string) => void;
}

type View = { kind: 'home' } | { kind: 'pack'; product: ProductCode } | { kind: 'form'; product: ProductCode; form: FormId } | { kind: 'preview'; product: ProductCode; form: FormId };
type Pack = { [form: string]: FormValues };

const FORM_NOTE: { [k in FormId]: string } = {
  application: 'The bank’s application form, with the Personal Reference Form and the Declaration. Sign at the end.',
  consent: 'Consent for credit bureau search, with four consents and your signature.',
  valuation: 'Goes to the Collateral Maintenance Unit, which assigns a Fidelity-recommended valuer.',
  request: 'The letter that states the amount, the purpose and the property.'
};

function today(): string { return new Date().toISOString().slice(0, 10); }

function prefill(id: FormId, name: string, email: string, product?: ProductCode): FormValues {
  const parts = name.split(' ').filter(Boolean);
  if (id === 'application') {
    const f: FormValues = { mortgage_type: product === 'EQUITY_RELEASE' ? '2. Home Equity' : '1. Home Purchase', currency: 'CEDI', b_first_name: parts[0] || '', b_last_name: parts.length > 1 ? parts[parts.length - 1] : '', b_email: email, b_employer: 'Fidelity Bank Ghana Limited', ref_borrower_name: name };
    return f;
  }
  if (id === 'consent') { return { consent_name: name, consent_date: today() }; }
  if (id === 'valuation') { return { v_contact: name, v_sign_name: name }; }
  return { rl_name: name, rl_date: today() };
}

export function FormsApp(p: FormsAppProps): JSX.Element {
  injectStyles();
  const [view, setView] = React.useState<View>({ kind: 'home' });
  const [pack, setPack] = React.useState<Pack>({});
  const [loading, setLoading] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const [saved, setSaved] = React.useState('');
  const timer = React.useRef<number | undefined>(undefined);
  const say = function (m: string): void { setToast(m); window.setTimeout(function () { setToast(''); }, 5000); };

  const open = function (product: ProductCode): void {
    setLoading(true);
    const ids = availableForms(product);
    Promise.all(ids.map(function (id) { return p.store.load(product + '/' + id); })).then(function (loaded) {
      const next: Pack = {};
      ids.forEach(function (id, i) { next[id] = loaded[i] || prefill(id, p.userName, p.userEmail, product); });
      setPack(next); setView({ kind: 'pack', product }); setLoading(false);
    }, function (e) { say(String(e)); setLoading(false); });
  };

  const change = function (product: ProductCode, id: FormId, patch: FormValues): void {
    setPack(function (cur) {
      const next = { ...cur[id], ...patch, _touched: true };
      const all = { ...cur, [id]: next };
      window.clearTimeout(timer.current);
      setSaved('Saving…');
      timer.current = window.setTimeout(function () {
        p.store.save(product + '/' + id, next).then(function () { setSaved('Draft saved ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })); }, function (e) { setSaved(''); say(String(e)); });
      }, 500);
      return all;
    });
  };

  const status = function (product: ProductCode, id: FormId): 'Not started' | 'In progress' | 'Signed' {
    const f = pack[id] || {};
    if (formIssues(id, product, f).length === 0) { return 'Signed'; }
    return f._touched ? 'In progress' : 'Not started';
  };

  let body: JSX.Element;
  if (view.kind === 'home') {
    body = <Home onPick={open} loading={loading} advanceFlowUrl={p.advanceFlowUrl} />;
  } else if (view.kind === 'pack') {
    const pv = view.product;
    const submit = function (): void {
      const ids = availableForms(pv);
      Promise.all(ids.map(function (id) { return p.store.publish(pv, FORM_TITLE[id].toLowerCase().replace(/[^a-z]+/g, '-') + '.html', standalonePage(FORM_TITLE[id], formHtml(id, pv, pack[id] || {}))); })).then(function () {
        say('Forms submitted and saved. Taking you to Advance Flow, Create Staff Loan…');
        window.setTimeout(function () { if (p.advanceFlowUrl) { (p.navigate || function (u: string) { window.location.href = u; })(p.advanceFlowUrl); } }, 1200);
      }, function (e) { say(String(e)); });
    };
    body = <PackView product={pv} canSubmit={availableForms(pv).every(function (id) { return status(pv, id) === 'Signed'; })} onSubmit={submit} status={function (id) { return status(pv, id); }} go={function (id) { setView({ kind: 'form', product: view.product, form: id }); }} back={function () { setView({ kind: 'home' }); }} advanceFlowUrl={p.advanceFlowUrl} />;
  } else if (view.kind === 'form') {
    const v = view;
    body = <FormPage product={v.product} id={v.form} f={pack[v.form] || {}} set={function (patch) { change(v.product, v.form, patch); }} saved={saved} signer={(str(pack[v.form] || {}, 'b_first_name') + ' ' + str(pack[v.form] || {}, 'b_last_name')).trim() || p.userName}
      back={function () { setView({ kind: 'pack', product: v.product }); }} preview={function () { setView({ kind: 'preview', product: v.product, form: v.form }); }} />;
  } else {
    const v = view;
    const f = pack[v.form] || {};
    const complete = formIssues(v.form, v.product, f).length === 0;
    const html = formHtml(v.form, v.product, f);
    body = (
      <>
        <Head title={FORM_TITLE[v.form]} sub={complete ? 'Signed and complete. Print it or save it as a PDF, then attach it in Advance Flow.' : 'Not complete yet: this copy is marked as a draft.'}
          actions={<div className="mf-row">
            <Button onClick={function () { setView({ kind: 'form', product: v.product, form: v.form }); }}>Back to the form</Button>
            <Button primary onClick={function () { window.print(); }}>Print / Save as PDF</Button>
            <Button disabled={!complete} onClick={function () {
              p.store.publish(v.product, FORM_TITLE[v.form].toLowerCase().replace(/[^a-z]+/g, '-') + '.html', standalonePage(FORM_TITLE[v.form], html)).then(function (where) { say('Saved to the library: ' + where); }, function (e) { say(String(e)); });
            }}>Save to SharePoint library</Button>
          </div>} />
        {complete ? null : <Note tone="need">This form still has {formIssues(v.form, v.product, f).length} item(s) to complete or sign.</Note>}
        <style>{PRINT_CSS + '@media print{.mf-noprint{display:none!important}body *{visibility:hidden}.mf-printzone,.mf-printzone *{visibility:visible}.mf-printzone{position:absolute;left:0;top:0;width:100%}}'}</style>
        <div className="mf-printzone"><div className="mf-sheet" style={{ border: '1px solid #D2CECA' }} dangerouslySetInnerHTML={{ __html: (complete ? '' : '<p style="color:#A04000;font-weight:700">DRAFT: NOT YET SIGNED OR COMPLETE</p>') + html }} /></div>
      </>
    );
  }
  return (
    <div className="mf-root">
      <div className="mf-page mf-noprint-wrap">
        {body}
        {toast ? <div role="status" style={{ position: 'fixed', right: 16, bottom: 16, background: '#2B2927', color: '#fff', padding: '10px 14px', borderRadius: 8, maxWidth: 420, zIndex: 50 }}>{toast}</div> : null}
      </div>
    </div>
  );
}

/* ---------------- home ---------------- */

function Where(p: { advanceFlowUrl?: string }): JSX.Element {
  return (
    <Panel title="Where this fits in Advance Flow">
      <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <li><b>Here:</b> fill in and e-sign the forms, then Print / Save as PDF.</li>
        <li><b>Collateral Maintenance Unit:</b> send the signed valuation form.</li>
        <li><b>Mortgage Unit:</b> mail the Land Title Certificate and Personalized site plan for the search report.</li>
        <li><b>Advance Flow, Staff Loan, Create Staff Loan:</b> Step 1 checks eligibility. <b>Step 2 is where you attach the pre-approval documents</b>, including the PDFs from this page.</li>
      </ol>
      {p.advanceFlowUrl ? <div style={{ marginTop: 10 }}><a className="mf-btn pri" href={p.advanceFlowUrl} target="_blank" rel="noreferrer">Open Advance Flow</a></div> : null}
    </Panel>
  );
}

function Home(p: { onPick: (p: ProductCode) => void; loading: boolean; advanceFlowUrl?: string }): JSX.Element {
  return (
    <>
      <Head title="Staff Mortgage Forms" sub="Fidelity Bank staff mortgage programme. Fill in the bank’s forms on screen, sign them electronically, and attach the PDFs in Advance Flow." />
      <div className="mf-grid2" style={{ gridTemplateColumns: 'repeat(2,minmax(0,1fr))', alignItems: 'stretch' }}>
        {(['HOME_PURCHASE', 'EQUITY_RELEASE'] as ProductCode[]).map(function (pr) {
          const r = REQUIREMENTS[pr];
          return (
            <Panel key={pr} title={PRODUCT_LABEL[pr]} style={{ display: 'flex', flexDirection: 'column' }}>
              <p style={{ margin: '0 0 8px' }}>{r.terms}</p>
              <div className="small muted" style={{ marginBottom: 10 }}>Forms: {availableForms(pr).map(function (id) { return FORM_TITLE[id]; }).join(', ')}.</div>
              <div style={{ marginTop: 'auto' }}><Button primary disabled={p.loading} onClick={function () { p.onPick(pr); }}>Start {PRODUCT_LABEL[pr]} forms</Button></div>
            </Panel>
          );
        })}
      </div>
      <Where advanceFlowUrl={p.advanceFlowUrl} />
    </>
  );
}

/* ---------------- pack ---------------- */

function PackView(p: { product: ProductCode; canSubmit: boolean; onSubmit: () => void; status: (id: FormId) => string; go: (id: FormId) => void; back: () => void; advanceFlowUrl?: string }): JSX.Element {
  const r = REQUIREMENTS[p.product];
  const ids = availableForms(p.product);
  const hereLabel = function (here?: string): JSX.Element | null { return here ? <Chip tone="orange">Done on this page</Chip> : null; };
  return (
    <>
      <Head title={PRODUCT_LABEL[p.product] + ' forms'} sub={r.terms} actions={<Button onClick={p.back}>All products</Button>} />
      <Section title="Forms to complete and sign">
        <div className="mf-tw"><table className="mf-t"><thead><tr><th>Form</th><th>Status</th><th /></tr></thead><tbody>
          {ids.map(function (id) {
            const st = p.status(id);
            return <tr key={id}><td><b>{FORM_TITLE[id]}</b><div className="small muted">{FORM_NOTE[id]}</div></td><td><Chip tone={st === 'Signed' ? 'dark' : st === 'In progress' ? 'orange' : 'idle'}>{st}</Chip></td><td className="right"><Button primary={st !== 'Signed'} onClick={function () { p.go(id); }}>{st === 'Not started' ? 'Start' : st === 'Signed' ? 'Review' : 'Continue'}</Button></td></tr>;
          })}
        </tbody></table></div>
      </Section>
      <Panel title="Submit">
        <div className="mf-row">
          <Button primary disabled={!p.canSubmit} onClick={p.onSubmit}>Submit and go to Advance Flow</Button>
          <span className="small muted">{p.canSubmit ? 'Saves your signed forms, then opens Advance Flow, Create Staff Loan.' : 'Complete and sign every form above to submit.'}</span>
        </div>
      </Panel>
      <div className="mf-grid2">
        <div className="mf-stack">
          {r.policy ? <Panel title="Staff policy"><ul style={{ margin: 0, paddingLeft: 18 }}>{r.policy.map(function (t) { return <li key={t}>{t}</li>; })}</ul></Panel> : null}
          <Panel title="Steps to follow"><ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>{r.steps.map(function (t) { return <li key={t}>{t}</li>; })}</ol></Panel>
          <Where advanceFlowUrl={p.advanceFlowUrl} />
          <Panel title="Post approval requirements"><ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>{r.post.map(function (t) { return <li key={t}>{t}</li>; })}</ol></Panel>
        </div>
        <div className="mf-stack">
          <Panel title="Pre-approval requirements (attach in Advance Flow, Create Staff Loan Step 2)">
            <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>{r.pre.map(function (x) { return <li key={x.text}>{x.text} {hereLabel(x.here)}</li>; })}</ol>
            {r.privateVendor ? <><b className="small" style={{ display: 'block', marginTop: 10 }}>FOR PRIVATE VENDORS: (Kindly add the following items)</b><ol style={{ margin: '4px 0 0', paddingLeft: 18 }}>{r.privateVendor.map(function (t) { return <li key={t}>{t}</li>; })}</ol></> : null}
            {r.note ? <div className="small muted" style={{ marginTop: 8 }}>{r.note}</div> : null}
          </Panel>
          <Panel title="Fees expected"><ol style={{ margin: 0, paddingLeft: 18 }}>{r.fees.map(function (t) { return <li key={t}>{t}</li>; })}</ol></Panel>
        </div>
      </div>
    </>
  );
}

/* ---------------- one form ---------------- */

function FormPage(p: { product: ProductCode; id: FormId; f: FormValues; set: (patch: FormValues) => void; saved: string; signer: string; back: () => void; preview: () => void }): JSX.Element {
  const [step, setStep] = React.useState(0);
  const [errs, setErrs] = React.useState<{ [k: string]: string }>({});
  const issues = formIssues(p.id, p.product, p.f);
  const stepId = p.id === 'application' ? STEPS[step].id : p.id;
  const mine = function (): { [k: string]: string } { const e: { [k: string]: string } = {}; issues.filter(function (i) { return i.step === stepId; }).forEach(function (i) { e[i.key] = i.message; }); return e; };
  const last = p.id !== 'application' || step === STEPS.length - 1;
  const next = function (): void {
    const e = mine();
    setErrs(e);
    if (Object.keys(e).length) { return; }
    setStep(step + 1); window.scrollTo(0, 0);
  };
  const showAll = function (): void { const e: { [k: string]: string } = {}; issues.forEach(function (i) { e[i.key] = i.message; }); setErrs(e); };
  const sec = function (id: string): JSX.Element { return <FormSection key={id} id={id} product={p.product} f={p.f} set={p.set} errs={errs} />; };

  let content: JSX.Element;
  if (p.id === 'application') {
    const ids = STEPS[step].sections;
    content = (
      <>
        {ids.map(function (id) {
          if (id === 'assets') { return p.product === 'EQUITY_RELEASE' ? <AssetsSection key={id} f={p.f} set={p.set} errs={errs} /> : null; }
          if (id === 'declaration') { return <DeclarationSection key={id} f={p.f} set={p.set} errs={errs} name={p.signer} coName={p.f.has_co === true ? (str(p.f, 'c_first_name') + ' ' + str(p.f, 'c_last_name')).trim() || 'Co-Borrower' : undefined} />; }
          return sec(id);
        })}
      </>
    );
  } else if (p.id === 'consent') {
    content = <ConsentLetter f={p.f} set={p.set} errs={errs} name={p.signer} />;
  } else if (p.id === 'valuation') {
    content = <ValuationSection f={p.f} set={p.set} errs={errs} signer={p.signer} />;
  } else {
    content = (
      <Section title={REQUEST_LETTER.title}>
        <Note>{REQUEST_LETTER.note}</Note>
        <div className="mf-fgrid" style={{ marginTop: 10 }}>{REQUEST_LETTER.fields.map(function (d) { return one(d, d.key, p.f, p.set, errs, ''); })}</div>
        <div style={{ marginTop: 10 }}><SignaturePad id="sig-request" label="Signature" signerName={p.signer} value={p.f.sig_request} error={errs.sig_request} onChange={function (v) { p.set({ sig_request: v }); }} /></div>
      </Section>
    );
  }

  return (
    <>
      <Head title={FORM_TITLE[p.id]} sub={PRODUCT_LABEL[p.product] + ' · ' + FORM_NOTE[p.id]} actions={<span className="small muted" aria-live="polite">{p.saved}</span>} />
      {p.id === 'application' ? (
        <div className="mf-steps" aria-label="Steps">
          {STEPS.map(function (s, i) { return <button key={s.id} type="button" className={'mf-step' + (i === step ? ' on' : i < step ? ' done' : '')} onClick={function () { setStep(i); setErrs({}); }}>{i + 1}. {s.title}</button>; })}
        </div>
      ) : null}
      {content}
      <div className="mf-row" style={{ justifyContent: 'space-between' }}>
        <div className="mf-row">
          <Button onClick={p.back}>Back to the pack</Button>
          {p.id === 'application' && step > 0 ? <Button onClick={function () { setStep(step - 1); setErrs({}); }}>Previous</Button> : null}
        </div>
        <div className="mf-row">
          <Button onClick={p.preview}>Preview, print or save as PDF</Button>
          {last ? <Button primary onClick={function () { if (issues.length) { showAll(); } else { p.preview(); } }}>{issues.length ? 'Check what is missing (' + issues.length + ')' : 'Finish and preview'}</Button> : <Button primary onClick={next}>Continue</Button>}
        </div>
      </div>
    </>
  );
}

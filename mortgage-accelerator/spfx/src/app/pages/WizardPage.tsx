import * as React from 'react';
import { useApp } from '../context';
import { DocumentsPanel, ReadinessPanel } from '../components/panels';
import { AssetsSection, ConsentLetter, DeclarationSection, FeesPanel, FormSection, SearchSection, ValuationSection } from '../components/formSections';
import { FormValues, STEPS as FORM_STEPS, VALUATION_FORM, numOf, str, validateForm } from '../domain/formDef';
import { Button, Chip, ErrorNote, Head, Loading, Note, Panel, Progress, ScoreRing } from '../components/ui';
import { docLabel, documentCompleteness } from '../domain/documents';
import { minDownPayment } from '../domain/rules';
import { DraftPatch } from '../services/client';
import { EquityPurpose, MortgageCase, PRODUCT_LABEL, ProductCode } from '../domain/types';
import { money } from '../format';
import { EligibilityPhase } from './EligibilityPhase';

const PHASES = ['Loan Eligibility', 'Loan Application', 'Finish'];

/** The same three-phase header the existing Staff Loan flow uses. */
function PhaseBar(p: { phase: number }): JSX.Element {
  return (
    <div className="ma-row" style={{ justifyContent: 'center', gap: 0, flexWrap: 'nowrap', margin: '4px 0 8px' }} aria-label="Progress">
      {PHASES.map(function (n, i) {
        const on = i === p.phase, done = i < p.phase;
        return (
          <React.Fragment key={n}>
            {i > 0 ? <span style={{ flex: '0 1 120px', height: 1, background: done || on ? '#D95400' : '#D2CECA', margin: '0 12px' }} /> : null}
            <span className="ma-row" style={{ gap: 8, flexWrap: 'nowrap' }}>
              <span style={{ width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 600, background: on ? '#D95400' : done ? '#55514E' : '#F1EFED', color: on || done ? '#fff' : '#7B7672' }}>{done ? '✓' : i + 1}</span>
              <span style={{ fontSize: 15, color: on ? '#2B2927' : '#7B7672' }}>{n}</span>
            </span>
          </React.Fragment>
        );
      })}
    </div>
  );
}

const STEP_IDS = FORM_STEPS.map(function (x) { return x.id; });
const LAST = FORM_STEPS.length - 1;

type Errors = { [k: string]: string };

/** Answers the system already knows, filled in once so nobody types them twice. */
function prefill(c: MortgageCase): FormValues {
  const a = c.applicant;
  const parts = a.fullName.split(' ');
  const f: FormValues = { currency: 'CEDI', has_co: !!c.coBorrowerName };
  const put = function (k: string, v: string): void { if (v) { f[k] = v; } };
  put('b_first_name', parts[0]);
  put('b_last_name', parts.length > 1 ? parts[parts.length - 1] : '');
  put('b_middle_name', parts.slice(1, -1).join(' '));
  put('b_dob', a.dateOfBirth);
  put('b_national_id', a.nationalId);
  put('b_cell', a.phone);
  put('b_email', a.email);
  put('b_address', a.address);
  put('b_occupation', a.position);
  put('b_employer', 'Fidelity Bank Ghana Limited');
  put('b_employer_address', 'PMB 43, Cantonments-Accra');
  put('b_property_use', 'Primary residence');
  put('v_contact', a.fullName);
  put('v_contact_no', a.phone);
  put('v_sign_name', a.fullName);
  put('ref_borrower_name', a.fullName);
  put('ref_contact_tel', a.phone);
  put('consent_name', a.fullName);
  return f;
}

/** What the rules engine needs, derived from the form answers. */
function derive(c: MortgageCase, f: FormValues): DraftPatch {
  const out: DraftPatch = {
    applicant: { nationalId: str(f, 'b_national_id') || c.applicant.nationalId, phone: str(f, 'b_cell') || c.applicant.phone, email: str(f, 'b_email') || c.applicant.email, address: str(f, 'b_address') || c.applicant.address },
    consent: {
      creditBureau: f.consent_a === true && f.consent_b === true,
      identity: f.consent_d === true,
      dataProcessing: f.consent_c === true,
      regulatory: f.declaration === true,
      informationSharing: f.declaration === true
    }
  };
  if (c.product === 'HOME_PURCHASE') {
    const price = numOf(f, 'purchase_price');
    out.purchase = {
      purchasePrice: price, propertyValue: price, downPayment: numOf(f, 'down_payment'),
      vendorName: str(f, 'developer').split('\n')[0],
      vendorType: str(f, 'vendor_type') === 'PRIVATE' ? 'PRIVATE' : 'DEVELOPER',
      constructionStatus: f.in_construction === true ? 'UNDER_CONSTRUCTION' : 'COMPLETED'
    };
  } else {
    const purpose = (str(f, 'purpose') || 'HOME_IMPROVEMENT_RENOVATION') as EquityPurpose;
    out.equity = {
      declaredValue: numOf(f, 'declared_value'), purpose,
      ownership: 'SOLE',
      useOfFunds: [{ item: str(f, 'use_of_funds') || purpose, amount: c.amountRequested }]
    };
  }
  return out;
}

function stepErrors(c: MortgageCase, f: FormValues, stepId: string): Errors {
  const e: Errors = {};
  validateForm(c.product, f).filter(function (i) { return i.step === stepId; }).forEach(function (i) { e[i.key] = i.message; });
  if (stepId === 'property' && c.product === 'HOME_PURCHASE') {
    const price = numOf(f, 'purchase_price');
    if (price > 0 && numOf(f, 'down_payment') < minDownPayment(price) - 0.005) { e.down_payment = 'Down payment - (20% Minimum): at least ' + money(minDownPayment(price)); }
  }
  if (stepId === 'requests') {
    VALUATION_FORM.fields.forEach(function (d) { if (d.req && !str(f, d.key).trim()) { e[d.key] = d.label.split(':')[0] + ' is required'; } });
    if (!str(f, 'sig_valuation')) { e.sig_valuation = 'Sign the valuation form (Authorized Signature)'; }
    if (!(c.valuationRequest && c.valuationRequest.sentAt)) { e.valuation_sent = 'Send the valuation form to the Collateral Maintenance Unit'; }
    if (c.product === 'HOME_PURCHASE' && !(c.searchRequest && c.searchRequest.sentAt)) { e.search_sent = 'Send the search request to the Mortgage Unit'; }
  }
  if (stepId === 'consent') {
    if (!(f.consent_a === true && f.consent_b === true && f.consent_c === true && f.consent_d === true)) { e.consent = 'Tick all four consents (a to d)'; }
    if (!str(f, 'sig_consent')) { e.sig_consent = 'Sign the consent letter'; }
    if (!str(f, 'sig_application_b')) { e.sig_application_b = 'Sign the application form (Signature of Borrower)'; }
    if (f.has_co === true && !str(f, 'sig_application_c')) { e.sig_application_c = 'The Co-Borrower must also sign'; }
    if (!str(f, 'consent_name').trim()) { e.consent_name = 'Name is required'; }
    if (f.declaration !== true) { e.declaration = 'You must agree to the declaration'; }
  }
  return e;
}

export function WizardPage(): JSX.Element {
  const app = useApp();
  const productSeg = app.route.segments[1];
  const caseId = app.route.segments[2];
  const product: ProductCode = productSeg === 'equity' ? 'EQUITY_RELEASE' : 'HOME_PURCHASE';
  const [c, setC] = React.useState<MortgageCase | undefined>(undefined);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [step, setStep] = React.useState(0);
  const [errors, setErrors] = React.useState<Errors>({});
  const [saved, setSaved] = React.useState('');
  const [phase, setPhase] = React.useState(0);
  const [doneRef, setDoneRef] = React.useState('');
  const [docsPct, setDocsPct] = React.useState(0);
  const [form, setForm] = React.useState<FormValues>({});
  const timer = React.useRef<number | undefined>(undefined);
  const pending = React.useRef<DraftPatch>({});

  React.useEffect(function () {
    let live = true;
    const load = caseId ? app.client.getCase(caseId) : app.client.createDraft(product);
    load.then(function (d) {
      if (!live) { return; }
      setC(d);
      setForm({ ...prefill(d), ...(d.form || {}) });
      setPhase(d.eligibility || caseId ? 1 : 0);
    }, function (e) { setError(String(e)); });
    return function () { live = false; };
  }, [product, caseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // keep the document completeness in step with uploads
  React.useEffect(function () {
    if (!c) { return; }
    app.client.listDocuments(c.id).then(function (docs) { setDocsPct(documentCompleteness(c, docs).pct); });
  }, [c && c.id, step, app.version]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) { return <ErrorNote message={error} />; }
  if (!c) { return <Loading />; }

  const locked = c.locked && !c.returnedNote;
  if (locked) {
    return <><Head title="Application submitted" /><Note>This application is locked. Open it from case management.</Note><div><Button primary onClick={function () { app.go('/cases/' + c.id); }}>Open the case</Button></div></>;
  }

  const queueSave = function (patch: DraftPatch): void {
    const p = pending.current;
    pending.current = {
      ...p, ...patch,
      applicant: { ...(p.applicant || {}), ...(patch.applicant || {}) },
      financials: { ...(p.financials || {}), ...(patch.financials || {}) },
      purchase: { ...(p.purchase || {}), ...(patch.purchase || {}) },
      equity: { ...(p.equity || {}), ...(patch.equity || {}) },
      consent: { ...(p.consent || {}), ...(patch.consent || {}) },
      form: { ...(p.form || {}), ...(patch.form || {}) },
      valuationFields: { ...(p.valuationFields || {}), ...(patch.valuationFields || {}) }
    };
    setSaved('Saving…');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(function () {
      const toSend = pending.current;
      pending.current = {};
      app.client.saveDraft(c.id, toSend).then(function (d) {
        setC(function (cur) { return cur ? { ...cur, readiness: d.readiness } : d; });
        setSaved('Draft saved ' + new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      }, function (e) { setSaved(''); app.toast(String(e)); });
    }, 400);
  };

  const setField = function (patch: FormValues): void {
    const next: FormValues = { ...form, ...patch };
    setForm(next);
    const valuation: { [k: string]: string } = {};
    Object.keys(patch).forEach(function (k) { if (k.indexOf('v_') === 0) { valuation[k] = String(patch[k]); } });
    const d = derive(c, next);
    setC(function (cur) {
      if (!cur) { return cur; }
      return { ...cur, applicant: { ...cur.applicant, ...(d.applicant || {}) }, consent: { ...cur.consent, ...(d.consent || {}) }, purchase: cur.purchase ? { ...cur.purchase, ...(d.purchase || {}) } : cur.purchase, equity: cur.equity ? { ...cur.equity, ...(d.equity || {}) } : cur.equity };
    });
    const filed = function (key: string, docType: string, category: 'APPLICATION' | 'CONSENT', name: string, ready: boolean): void {
      if (patch[key] === undefined || !ready) { return; }
      if (!patch[key]) { return; }
      app.client.uploadDocument(c.id, docType, category, { name: name, sizeKb: 96 }).then(function () { app.bump(); app.toast(docLabel(docType) + ' signed and filed.'); }, function (e) { app.toast(String(e)); });
    };
    filed('sig_consent', 'CONSENT_FORM', 'CONSENT', 'customer-consent-letter-e-signed.pdf', true);
    filed('sig_application_b', 'APPLICATION_FORM', 'APPLICATION', 'mortgage-application-form-e-signed.pdf', next.has_co !== true || !!str(next, 'sig_application_c'));
    filed('sig_application_c', 'APPLICATION_FORM', 'APPLICATION', 'mortgage-application-form-e-signed.pdf', !!str(next, 'sig_application_b'));
    queueSave({ ...d, form: patch, valuationFields: Object.keys(valuation).length ? valuation : undefined });
  };

  const send = function (kind: 'valuation' | 'search'): void {
    window.clearTimeout(timer.current);
    const toSend: DraftPatch = { ...pending.current, ...(kind === 'valuation' ? { sendValuationRequest: true } : { sendSearchRequest: true }) };
    pending.current = {};
    app.client.saveDraft(c.id, toSend).then(function (d) {
      setC(d);
      app.toast(kind === 'valuation' ? 'Valuation form sent to the Collateral Maintenance Unit.' : 'Search request sent to the Mortgage Unit.');
    }, function (e) { app.toast(String(e)); });
  };

  const go = function (n: number): void {
    if (n > step) {
      const e = stepErrors(c, form, STEP_IDS[step]);
      setErrors(e);
      if (Object.keys(e).length) { app.toast(Object.keys(e).length + ' answer(s) need attention: ' + e[Object.keys(e)[0]]); return; }
    }
    setErrors({});
    setStep(n);
    window.scrollTo(0, 0);
  };

  const submit = function (): void {
    for (let i = 0; i < LAST - 1; i++) {
      if (i === 6) { continue; }
      const e = stepErrors(c, form, STEP_IDS[i]);
      if (Object.keys(e).length) { setStep(i); setErrors(e); app.toast('Step ' + (i + 1) + ' needs attention.'); return; }
    }
    window.clearTimeout(timer.current);
    const flush = Object.keys(pending.current).length ? app.client.saveDraft(c.id, pending.current) : Promise.resolve(c);
    pending.current = {};
    flush.then(function () { return app.client.submitCase(c.id); }).then(function (d) {
      app.toast('Submitted. Reference ' + d.ref + '. Pre-approval is running.');
      app.bump();
      setDoneRef(d.ref);
      setPhase(2);
      window.scrollTo(0, 0);
    }, function (e) { app.toast(e instanceof Error ? e.message : String(e)); });
  };

  const r = c.readiness;

  if (phase === 0) {
    return (
      <>
        <Head title={'Apply: ' + PRODUCT_LABEL[c.product]} sub="Start with your eligibility. It uses the same Staff Loan check you already know, then carries your figures into the application." />
        <PhaseBar phase={0} />
        <EligibilityPhase c={c} product={product} onProductChange={function (pr) { app.go('/apply/' + (pr === 'HOME_PURCHASE' ? 'purchase' : 'equity')); }} onDone={function () {
          app.client.getCase(c.id).then(function (d) { setC(d); setPhase(1); window.scrollTo(0, 0); }, function (e) { app.toast(String(e)); });
        }} />
      </>
    );
  }
  if (phase === 2) {
    return (
      <>
        <Head title="Application submitted" />
        <PhaseBar phase={2} />
        <Note tone="ok"><b>Your mortgage application has been submitted successfully.</b> Reference Number: <b>{doneRef}</b>. You will receive updates as your application progresses.</Note>
        <Panel title="What happens next">
          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li>Pre-approval runs now: employment check, credit bureau, affordability and risk. The target is under 24 hours.</li>
            <li>You will be told the result by notification, email and SMS.</li>
            <li>If you are pre-approved, confirm to start the valuation and legal searches together.</li>
            <li>You can write to HR, Credit, Legal and Collateral directly from your case.</li>
          </ol>
        </Panel>
        <div className="ma-row"><Button primary onClick={function () { app.go('/cases/' + c.id); }}>Track my application</Button><Button onClick={function () { app.go('/'); }}>Back to home</Button></div>
      </>
    );
  }

  return (
    <>
      <Head title={'Apply: ' + PRODUCT_LABEL[c.product]} sub="The questions are the ones on the bank&rsquo;s Mortgage Application Form, word for word. Your draft saves as you type."
        actions={<span className="small muted" aria-live="polite">{saved}</span>} />
      <PhaseBar phase={1} />
      {c.returnedNote ? <Note tone="need"><b>Returned for correction.</b> {c.returnedNote}</Note> : null}
      {c.eligibility ? <Note>Eligibility: DIR {c.eligibility.result.dirAllStaffLoansPct.toFixed(1)}% against a {c.eligibility.result.dirLimitPct}% limit · qualifies for {money(c.eligibility.result.loanAmountQualifiedFor)}{c.eligibility.exceptionalApproval ? ' · exceptional approval requested' : ''}.</Note> : null}
      <Progress pct={((step + (step === LAST ? 1 : 0)) / FORM_STEPS.length) * 100} label={'Step ' + (step + 1) + ' of ' + FORM_STEPS.length} />
      <div className="ma-steps" aria-label="Steps">
        {FORM_STEPS.map(function (s, i) { return <button key={s.id} type="button" className={'ma-step' + (i === step ? ' on' : i < step ? ' done' : '')} onClick={function () { go(i); }}>{i + 1}. {s.title}</button>; })}
      </div>
      <div className="ma-grid2">
        <div className="ma-stack">
          {step === 0 ? (
            <>
              <FormSection id="type" product={c.product} f={form} set={setField} errs={errors} />
              <FormSection id="personal" product={c.product} f={form} set={setField} errs={errors} />
            </>
          ) : null}
          {step === 1 ? (
            <>
              {['employment', 'references', 'selfemp', 'previous', 'bank'].map(function (id) { return <FormSection key={id} id={id} product={c.product} f={form} set={setField} errs={errors} />; })}
            </>
          ) : null}
          {step === 2 ? (
            <>
              <FormSection id="existing" product={c.product} f={form} set={setField} errs={errors} />
              <AssetsSection f={form} set={setField} />
            </>
          ) : null}
          {step === 3 ? (
            <>
              {['property', 'insurance', 'poa'].map(function (id) { return <FormSection key={id} id={id} product={c.product} f={form} set={setField} errs={errors} />; })}
              <FeesPanel product={c.product} propertyValue={c.purchase ? c.purchase.propertyValue : c.equity ? c.equity.declaredValue : 0} />
            </>
          ) : null}
          {step === 4 ? (
            <>
              <ValuationSection f={form} set={setField} errs={errors} sent={c.valuationRequest && c.valuationRequest.sentAt} signer={c.applicant.fullName} canSend={!!str(form, 'sig_valuation') && VALUATION_FORM.fields.every(function (d) { return !d.req || !!str(form, d.key).trim(); })} onSend={function () { send('valuation'); }} />
              {errors.valuation_sent ? <span style={{ color: '#A04000', fontWeight: 600 }}>{errors.valuation_sent}</span> : null}
              <SearchSection sent={c.searchRequest && c.searchRequest.sentAt} ready onSend={function () { send('search'); }} />
              {errors.search_sent ? <span style={{ color: '#A04000', fontWeight: 600 }}>{errors.search_sent}</span> : null}
            </>
          ) : null}
          {step === 5 ? (
            <>
              <ConsentLetter f={form} set={setField} errs={errors} name={c.applicant.fullName} />
              <DeclarationSection f={form} set={setField} errs={errors} name={c.applicant.fullName} coName={form.has_co === true ? (str(form, 'c_first_name') + ' ' + str(form, 'c_last_name')).trim() || 'Co-Borrower' : undefined} />
              <Panel title="Co-borrower"><div className="small muted">A Co-Borrower is added in step 1 (“There is a Co-Borrower”). They receive a secure link to verify and sign separately.</div></Panel>
            </>
          ) : null}
          {step === 6 ? <DocumentsPanel c={c} canUpload canRequest={false} /> : null}
          {step === 7 && r ? (
            <>
              <ReadinessPanel result={r} />
              <Panel title="Before you submit">
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  <li>{docsPct >= 100 ? 'All required pre-approval documents are attached.' : 'Required documents are still missing (' + Math.round(docsPct) + '% attached). Go back to Pre-approval documents.'}</li>
                  <li>{r.hardStops.length ? 'Fix the items marked “must be fixed first”.' : 'No blocking issues.'}</li>
                  <li>Submitting locks the application. A Mortgage Officer can return it to you if something needs correcting.</li>
                </ul>
              </Panel>
            </>
          ) : null}
          <div className="ma-row" style={{ justifyContent: 'space-between' }}>
            <Button disabled={step === 0} onClick={function () { go(step - 1); }}>Back</Button>
            {step < LAST ? <Button primary onClick={function () { go(step + 1); }}>Continue</Button> : <Button primary disabled={!r || r.hardStops.length > 0 || docsPct < 100} onClick={submit}>Submit application</Button>}
          </div>
        </div>
        <div className="ma-stack">
          <Panel title="Your readiness, live">
            {r ? (
              <>
                <div className="ma-row" style={{ gap: 14, flexWrap: 'nowrap' }}>
                  <ScoreRing score={r.score} label="Readiness" />
                  <div><Chip tone={r.band === 'READY' ? 'dark' : r.band === 'ALMOST' ? 'orange' : 'line'}>{r.band === 'READY' ? 'Likely pre-approved' : r.band === 'ALMOST' ? 'Likely referred' : 'Not ready yet'}</Chip>
                    <div className="small muted num" style={{ marginTop: 6 }}>Eligible up to {money(r.eligibleAmount, c.currency)}</div></div>
                </div>
                {r.nextActions.length ? <div style={{ marginTop: 10 }}><b className="small">To improve</b><ul className="small" style={{ margin: '4px 0 0', paddingLeft: 18 }}>{r.nextActions.slice(0, 4).map(function (x) { return <li key={x}>{x}</li>; })}</ul></div> : <div className="small muted" style={{ marginTop: 10 }}>Nothing to fix right now.</div>}
              </>
            ) : <Loading />}
          </Panel>
          <Panel title="Your draft"><div className="small">Reference {c.ref}</div><div className="small muted">Saved automatically. You can leave and come back from Home.</div></Panel>
        </div>
      </div>
    </>
  );
}

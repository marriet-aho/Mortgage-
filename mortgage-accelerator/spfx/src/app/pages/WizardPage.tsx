import * as React from 'react';
import { useApp } from '../context';
import { DocumentsPanel, ReadinessPanel } from '../components/panels';
import { Button, CheckField, Chip, ErrorNote, Head, Loading, Note, NumberField, Panel, Progress, RadioField, ScoreRing, Section, SelectField, TextArea, TextField } from '../components/ui';
import { documentCompleteness } from '../domain/documents';
import { instalment, maxEquityRelease, maxTenorYears, minDownPayment, netIncome, ltvPct } from '../domain/rules';
import { DraftPatch } from '../services/client';
import { MortgageCase, PRODUCT_LABEL, PURPOSE_LABEL, EquityPurpose, ProductCode } from '../domain/types';
import { money } from '../format';

const STEPS = ['Applicant', 'Request', 'Finances', 'Consent', 'Documents', 'Review and submit'];

type Errors = { [k: string]: string };

function validate(c: MortgageCase, step: number): Errors {
  const e: Errors = {};
  const need = function (k: string, ok: boolean, msg: string): void { if (!ok) { e[k] = msg; } };
  const a = c.applicant;
  if (step === 0) {
    need('nationalId', /^GHA-\d{9}-\d$/i.test(a.nationalId), 'Use the Ghana Card format GHA-123456789-0');
    need('phone', /^\+?[\d ]{9,15}$/.test(a.phone), 'Enter 9 to 15 digits');
    need('email', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(a.email), 'Enter a full email address');
    need('address', a.address.trim().length > 5, 'Enter your residential address');
  }
  if (step === 1) {
    need('amountRequested', c.amountRequested > 0, 'Enter the amount you need');
    need('tenorYears', c.tenorYears > 0, 'Enter a tenor in years');
    const cap = maxTenorYears(c.product, a.retirementDate, new Date());
    need('tenorYears', c.tenorYears <= cap, 'The longest tenor before retirement is ' + cap + ' years');
    if (c.purchase) {
      need('purchasePrice', c.purchase.purchasePrice > 0, 'Enter the purchase price');
      need('propertyValue', c.purchase.propertyValue > 0, 'Enter the property value');
      need('downPayment', c.purchase.downPayment >= minDownPayment(c.purchase.purchasePrice) - 0.005, 'The minimum down payment is 20% (' + money(minDownPayment(c.purchase.purchasePrice)) + ')');
      need('vendorName', c.purchase.vendorName.trim().length > 1, 'Enter the vendor or developer name');
      need('amountRequested', c.amountRequested <= c.purchase.purchasePrice - c.purchase.downPayment + 0.005, 'The loan plus the down payment cannot exceed the price');
    }
    if (c.equity) {
      need('declaredValue', c.equity.declaredValue > 0, 'Enter the value of your property');
      if (c.equity.forcedSaleValue) {
        const m = maxEquityRelease(c.equity.forcedSaleValue, c.equity.existingMortgageBalance);
        need('amountRequested', c.amountRequested <= m + 0.005, 'The maximum release is ' + money(m) + ' (70% of forced sale value less your existing mortgage)');
      }
      const total = c.equity.useOfFunds.reduce(function (s, u) { return s + u.amount; }, 0);
      need('useOfFunds', Math.abs(total - c.amountRequested) < 0.5, 'The use of funds must add up to the amount requested');
    }
  }
  if (step === 2) {
    need('basicSalary', c.financials.basicSalary > 0, 'Enter your basic salary');
    need('deductions', c.financials.deductions >= 0, 'Enter your monthly deductions');
  }
  if (step === 3) {
    need('consent', c.consent.creditBureau && c.consent.identity && c.consent.dataProcessing && c.consent.regulatory, 'The four required consents must be accepted');
    need('signName', c.consent.signedBy === c.applicant.fullName || !!c.consent.signedAt, 'Type your full name to sign');
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
  const [signName, setSignName] = React.useState('');
  const [docsPct, setDocsPct] = React.useState(0);
  const timer = React.useRef<number | undefined>(undefined);
  const pending = React.useRef<DraftPatch>({});

  React.useEffect(function () {
    let live = true;
    const load = caseId ? app.client.getCase(caseId) : app.client.createDraft(product);
    load.then(function (d) {
      if (!live) { return; }
      setC(d);
      setSignName(d.consent.signedBy || '');
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
      consent: { ...(p.consent || {}), ...(patch.consent || {}) }
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

  const change = function (patch: DraftPatch): void {
    setC(function (cur) {
      if (!cur) { return cur; }
      const next: MortgageCase = { ...cur };
      if (patch.applicant) { next.applicant = { ...cur.applicant, ...patch.applicant }; }
      if (patch.financials) { next.financials = { ...cur.financials, ...patch.financials }; }
      if (patch.purchase && cur.purchase) { next.purchase = { ...cur.purchase, ...patch.purchase }; }
      if (patch.equity && cur.equity) { next.equity = { ...cur.equity, ...patch.equity }; }
      if (patch.consent) { next.consent = { ...cur.consent, ...patch.consent }; }
      if (patch.amountRequested !== undefined) { next.amountRequested = patch.amountRequested; }
      if (patch.tenorYears !== undefined) { next.tenorYears = patch.tenorYears; }
      if (patch.currency) { next.currency = patch.currency; }
      return next;
    });
    queueSave(patch);
  };

  const go = function (n: number): void {
    if (n > step) {
      const e = validate(c, step);
      setErrors(e);
      if (Object.keys(e).length) { app.toast('Check the highlighted answers.'); return; }
    }
    setErrors({});
    setStep(n);
    window.scrollTo(0, 0);
  };

  const submit = function (): void {
    for (let i = 0; i < 4; i++) {
      const e = validate(c, i);
      if (Object.keys(e).length) { setStep(i); setErrors(e); app.toast('Step ' + (i + 1) + ' needs attention.'); return; }
    }
    window.clearTimeout(timer.current);
    const flush = Object.keys(pending.current).length ? app.client.saveDraft(c.id, pending.current) : Promise.resolve(c);
    pending.current = {};
    flush.then(function () { return app.client.submitCase(c.id); }).then(function (d) {
      app.toast('Submitted. Reference ' + d.ref + '. Pre-approval is running.');
      app.bump();
      app.go('/cases/' + d.id);
    }, function (e) { app.toast(e instanceof Error ? e.message : String(e)); });
  };

  const a = c.applicant;
  const f = c.financials;
  const net = netIncome(f);
  const pay = instalment(c.amountRequested, c.ratePct, c.tenorYears);
  const tenorCap = maxTenorYears(c.product, a.retirementDate, new Date());
  const r = c.readiness;
  const err = function (k: string): string | undefined { return errors[k]; };

  return (
    <>
      <Head title={'Apply: ' + PRODUCT_LABEL[c.product]} sub="Six short steps. Your draft saves as you type, and your readiness updates as you go."
        actions={<span className="small muted" aria-live="polite">{saved}</span>} />
      {c.returnedNote ? <Note tone="need"><b>Returned for correction.</b> {c.returnedNote}</Note> : null}
      <Progress pct={((step + (step === 5 ? 1 : 0)) / STEPS.length) * 100} label={'Step ' + (step + 1) + ' of ' + STEPS.length} />
      <div className="ma-steps" aria-label="Steps">
        {STEPS.map(function (s, i) { return <button key={s} type="button" className={'ma-step' + (i === step ? ' on' : i < step ? ' done' : '')} onClick={function () { go(i); }}>{i + 1}. {s}</button>; })}
      </div>
      <div className="ma-grid2">
        <div className="ma-stack">
          <Section title={STEPS[step]}>
            <div className="ma-fgrid">
              {step === 0 ? (
                <>
                  <TextField id="w-emp" label="Employee number" value={a.employeeNo} readOnly onChange={function () { /* from HR */ }} hint="From the HR system" />
                  <TextField id="w-staff" label="Staff ID" value={a.staffId} readOnly onChange={function () { /* from HR */ }} />
                  <TextField id="w-name" label="Full name" value={a.fullName} readOnly onChange={function () { /* from HR */ }} />
                  <TextField id="w-dept" label="Department and position" value={a.department + ' · ' + a.position} readOnly onChange={function () { /* from HR */ }} />
                  <TextField id="w-emps" label="Employment status" value={a.employmentStatus.toLowerCase()} readOnly onChange={function () { /* from HR */ }} hint={'Employed since ' + a.dateEmployed + '. Retires ' + a.retirementDate + '.'} />
                  <TextField id="w-dob" label="Date of birth" type="date" value={a.dateOfBirth} readOnly onChange={function () { /* from HR */ }} />
                  <TextField id="w-nid" label="National ID number" required value={a.nationalId} error={err('nationalId')} hint="Ghana Card: GHA-123456789-0" onChange={function (v) { change({ applicant: { nationalId: v } }); }} />
                  <TextField id="w-phone" label="Mobile number" type="tel" required value={a.phone} error={err('phone')} onChange={function (v) { change({ applicant: { phone: v } }); }} />
                  <TextField id="w-email" label="Personal email" type="email" required value={a.email} error={err('email')} onChange={function (v) { change({ applicant: { email: v } }); }} />
                  <SelectField id="w-ms" label="Marital status" required value={a.maritalStatus} options={[['SINGLE', 'Single'], ['MARRIED', 'Married'], ['DIVORCED', 'Divorced'], ['WIDOWED', 'Widowed']]} hint={a.maritalStatus === 'MARRIED' ? 'Spousal consent will be a condition.' : undefined} onChange={function (v) { change({ applicant: { maritalStatus: (v || 'SINGLE') as MortgageCase['applicant']['maritalStatus'] } }); }} />
                  <TextArea id="w-addr" label="Residential address" required wide value={a.address} error={err('address')} onChange={function (v) { change({ applicant: { address: v } }); }} />
                </>
              ) : null}
              {step === 1 && c.purchase ? (
                <>
                  <SelectField id="w-cur" label="Currency" required value={c.currency} options={[['GHS', 'Cedi (GHS)'], ['USD', 'US Dollar'], ['EUR', 'Euro']]} onChange={function (v) { change({ currency: (v || 'GHS') as 'GHS' | 'USD' | 'EUR' }); }} />
                  <RadioField id="w-vt" label="Vendor type" required value={c.purchase.vendorType} options={[['DEVELOPER', 'Developer'], ['PRIVATE', 'Private vendor']]} hint={c.purchase.vendorType === 'PRIVATE' ? 'A vendor due-diligence form will be sent to the vendor.' : undefined} onChange={function (v) { change({ purchase: { vendorType: v as 'DEVELOPER' | 'PRIVATE' } }); }} />
                  <TextField id="w-vn" label="Vendor or developer name" required value={c.purchase.vendorName} error={err('vendorName')} onChange={function (v) { change({ purchase: { vendorName: v } }); }} />
                  <SelectField id="w-cs" label="Property status" required value={c.purchase.constructionStatus} options={[['COMPLETED', 'Completed'], ['UNDER_CONSTRUCTION', 'Under construction'], ['OFF_PLAN', 'Off-plan']]} onChange={function (v) { change({ purchase: { constructionStatus: (v || 'COMPLETED') as 'COMPLETED' | 'UNDER_CONSTRUCTION' | 'OFF_PLAN' } }); }} />
                  <NumberField id="w-pp" label="Purchase price" required value={c.purchase.purchasePrice} error={err('purchasePrice')} onChange={function (v) { change({ purchase: { purchasePrice: v, propertyValue: c.purchase && c.purchase.propertyValue ? c.purchase.propertyValue : v } }); }} />
                  <NumberField id="w-pv" label="Property value" required value={c.purchase.propertyValue} error={err('propertyValue')} onChange={function (v) { change({ purchase: { propertyValue: v } }); }} />
                  <NumberField id="w-dp" label="Down payment" required value={c.purchase.downPayment} error={err('downPayment')} hint={'At least 20%: ' + money(minDownPayment(c.purchase.purchasePrice))} onChange={function (v) { change({ purchase: { downPayment: v } }); }} />
                  <NumberField id="w-amt" label="Amount requested" required value={c.amountRequested} error={err('amountRequested')} hint={c.purchase.purchasePrice ? 'Price less down payment: ' + money(Math.max(0, c.purchase.purchasePrice - c.purchase.downPayment)) : undefined} onChange={function (v) { change({ amountRequested: v }); }} />
                  <NumberField id="w-ten" label="Tenor (years)" required value={c.tenorYears} error={err('tenorYears')} hint={'Up to ' + tenorCap + ' years, limited by your retirement date.'} onChange={function (v) { change({ tenorYears: v }); }} />
                  <div className="ma-calc">
                    <div className={c.purchase.purchasePrice && c.purchase.downPayment < minDownPayment(c.purchase.purchasePrice) ? 'warn' : ''}><b>{c.purchase.purchasePrice ? ((c.purchase.downPayment / c.purchase.purchasePrice) * 100).toFixed(1) + '%' : '—'}</b><span>Down payment (minimum 20%)</span></div>
                    <div><b>{c.purchase.propertyValue ? ltvPct(c.amountRequested, c.purchase.propertyValue).toFixed(1) + '%' : '—'}</b><span>Loan to value</span></div>
                    <div><b>{pay ? money(pay, c.currency) : '—'}</b><span>Estimated monthly repayment</span></div>
                  </div>
                </>
              ) : null}
              {step === 1 && c.equity ? (
                <>
                  <SelectField id="w-cur" label="Currency" required value={c.currency} options={[['GHS', 'Cedi (GHS)'], ['USD', 'US Dollar'], ['EUR', 'Euro']]} onChange={function (v) { change({ currency: (v || 'GHS') as 'GHS' | 'USD' | 'EUR' }); }} />
                  <SelectField id="w-pur" label="Purpose of release" required value={c.equity.purpose} options={(Object.keys(PURPOSE_LABEL) as EquityPurpose[]).map(function (k) { return [k, PURPOSE_LABEL[k]] as [string, string]; })} onChange={function (v) { change({ equity: { purpose: (v || 'HOME_RENOVATION') as EquityPurpose } }); }} />
                  <NumberField id="w-dv" label="Property value (your estimate)" required value={c.equity.declaredValue} error={err('declaredValue')} hint="Confirmed by a valuation later" onChange={function (v) { change({ equity: { declaredValue: v } }); }} />
                  <RadioField id="w-own" label="Ownership" required value={c.equity.ownership} options={[['SOLE', 'Sole owner'], ['JOINT', 'Joint owner']]} hint={c.equity.ownership === 'JOINT' ? 'The co-owner must sign the mortgage documents.' : 'The property must be registered in your name.'} onChange={function (v) { change({ equity: { ownership: v as 'SOLE' | 'JOINT' } }); }} />
                  <RadioField id="w-ems" label="Existing mortgage" required value={c.equity.existingMortgageStatus} options={[['NONE', 'None'], ['THIS_BANK', 'With this bank'], ['OTHER_LENDER', 'With another lender']]} onChange={function (v) { change({ equity: { existingMortgageStatus: v as 'NONE' | 'THIS_BANK' | 'OTHER_LENDER', existingMortgageBalance: v === 'NONE' ? 0 : c.equity ? c.equity.existingMortgageBalance : 0 } }); }} />
                  {c.equity.existingMortgageStatus !== 'NONE' ? <NumberField id="w-emb" label="Outstanding mortgage balance" required value={c.equity.existingMortgageBalance} onChange={function (v) { change({ equity: { existingMortgageBalance: v } }); }} /> : null}
                  <NumberField id="w-amt" label="Amount requested" required value={c.amountRequested} error={err('amountRequested')} onChange={function (v) { change({ amountRequested: v, equity: { useOfFunds: [{ item: c.equity && c.equity.useOfFunds[0] ? c.equity.useOfFunds[0].item : PURPOSE_LABEL[c.equity ? c.equity.purpose : 'HOME_RENOVATION'], amount: v }] } }); }} />
                  <NumberField id="w-ten" label="Tenor (years)" required value={c.tenorYears} error={err('tenorYears')} hint={'Up to ' + tenorCap + ' years'} onChange={function (v) { change({ tenorYears: v }); }} />
                  <TextField id="w-use" label="What the money is for (request letter)" required wide value={c.equity.useOfFunds[0] ? c.equity.useOfFunds[0].item : ''} error={err('useOfFunds')} hint="Describe the intended use. Evidence is uploaded in the Documents step." onChange={function (v) { change({ equity: { useOfFunds: [{ item: v, amount: c.amountRequested }] } }); }} />
                  <div className="ma-calc">
                    <div><b>{money(c.equity.forcedSaleValue ? maxEquityRelease(c.equity.forcedSaleValue, c.equity.existingMortgageBalance) : maxEquityRelease(c.equity.declaredValue * 0.8, c.equity.existingMortgageBalance), c.currency)}</b><span>{c.equity.forcedSaleValue ? 'Maximum release: 70% of forced sale value less existing mortgage' : 'Indicative maximum, until the valuation gives the forced sale value'}</span></div>
                    <div><b>{pay ? money(pay, c.currency) : '—'}</b><span>Estimated monthly repayment</span></div>
                    <div><b>{c.equity.declaredValue ? ltvPct(c.amountRequested + c.equity.existingMortgageBalance, c.equity.declaredValue).toFixed(0) + '%' : '—'}</b><span>Total borrowing against your value</span></div>
                  </div>
                </>
              ) : null}
              {step === 2 ? (
                <>
                  <div className="ma-sub">Monthly income</div>
                  <NumberField id="w-bs" label="Basic salary" required value={f.basicSalary} error={err('basicSalary')} onChange={function (v) { change({ financials: { basicSalary: v } }); }} />
                  <NumberField id="w-al" label="Allowances" value={f.allowances} onChange={function (v) { change({ financials: { allowances: v } }); }} />
                  <NumberField id="w-oi" label="Other income" value={f.otherIncome} hint="Evidence may be requested" onChange={function (v) { change({ financials: { otherIncome: v } }); }} />
                  <NumberField id="w-de" label="Tax, pension and other deductions" required value={f.deductions} onChange={function (v) { change({ financials: { deductions: v } }); }} />
                  <div className="ma-sub">Monthly commitments</div>
                  <NumberField id="w-lr" label="Repayments on existing loans" value={f.existingLoanRepayments} onChange={function (v) { change({ financials: { existingLoanRepayments: v } }); }} />
                  <NumberField id="w-oc" label="Rent, maintenance and other commitments" value={f.otherCommitments} onChange={function (v) { change({ financials: { otherCommitments: v } }); }} />
                  <div className="ma-sub">Assets and liabilities</div>
                  <NumberField id="w-as" label="Total assets (savings, investments, vehicles, property)" value={f.assetsTotal} onChange={function (v) { change({ financials: { assetsTotal: v } }); }} />
                  <NumberField id="w-li" label="Total liabilities (loans, mortgages)" value={f.liabilitiesTotal} onChange={function (v) { change({ financials: { liabilitiesTotal: v } }); }} />
                  <div className="ma-calc">
                    <div><b>{money(net, c.currency)}</b><span>Net monthly income</span></div>
                    <div className={r && r.dsrPct > 50 ? 'warn' : ''}><b>{r ? r.dsrPct.toFixed(0) + '%' : '—'}</b><span>Debt service ratio with this mortgage (limit 50%)</span></div>
                    <div><b>{money(f.assetsTotal - f.liabilitiesTotal, c.currency)}</b><span>Net worth</span></div>
                  </div>
                </>
              ) : null}
              {step === 3 ? (
                <>
                  <div className="ma-f wide"><Note>We ask for your permission before we check your credit and verify your details. You can withdraw consent later, which stops the steps that depend on it.</Note></div>
                  <div className="ma-f wide" style={{ gap: 8 }}>
                    <CheckField id="k1" label="Credit bureau: check my credit record (required)" checked={c.consent.creditBureau} onChange={function (v) { change({ consent: { creditBureau: v } }); }} />
                    <CheckField id="k2" label="Identity verification: verify my Ghana Card (required)" checked={c.consent.identity} onChange={function (v) { change({ consent: { identity: v } }); }} />
                    <CheckField id="k3" label="Data processing: store and process my information (required)" checked={c.consent.dataProcessing} onChange={function (v) { change({ consent: { dataProcessing: v } }); }} />
                    <CheckField id="k4" label="Regulatory: share information where the law requires (required)" checked={c.consent.regulatory} onChange={function (v) { change({ consent: { regulatory: v } }); }} />
                    <CheckField id="k5" label="Information sharing: share with valuers, lawyers, insurers and the Lands Commission" checked={c.consent.informationSharing} onChange={function (v) { change({ consent: { informationSharing: v } }); }} />
                    {err('consent') ? <span className="err" style={{ color: '#A04000', fontWeight: 600 }}>{err('consent')}</span> : null}
                  </div>
                  <TextField id="w-sign" label="Electronic signature: type your full name" required value={signName} error={err('signName')} hint={'Signing as ' + a.fullName + '. A time stamp, device and consent text version are recorded.'} onChange={function (v) { setSignName(v); change({ consent: { signedBy: v.trim() === a.fullName ? a.fullName : '' } }); }} />
                  <TextField id="w-co" label="Co-borrower (optional)" value={c.coBorrowerName || ''} hint="They will receive a secure link to verify and sign separately." onChange={function (v) { setC(function (cur) { return cur ? { ...cur, coBorrowerName: v } : cur; }); queueSave({ coBorrowerName: v }); }} />
                </>
              ) : null}
              {step === 4 ? <div className="ma-f wide"><DocumentsPanel c={c} canUpload canRequest={false} /></div> : null}
              {step === 5 && r ? (
                <>
                  <div className="ma-f wide"><ReadinessPanel result={r} /></div>
                  <div className="ma-f wide"><Panel title="Before you submit">
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      <li>{docsPct >= 100 ? 'All required documents are attached.' : 'Required documents are still missing (' + Math.round(docsPct) + '% attached). Go back to Documents.'}</li>
                      <li>{r.hardStops.length ? 'Fix the items marked “must be fixed first”.' : 'No blocking issues.'}</li>
                      <li>Submitting locks the application. A Mortgage Officer can return it to you if something needs correcting.</li>
                    </ul>
                  </Panel></div>
                </>
              ) : null}
            </div>
          </Section>
          <div className="ma-row" style={{ justifyContent: 'space-between' }}>
            <Button disabled={step === 0} onClick={function () { go(step - 1); }}>Back</Button>
            {step < 5 ? <Button primary onClick={function () { go(step + 1); }}>Continue</Button> : <Button primary disabled={!r || r.hardStops.length > 0 || docsPct < 100} onClick={submit}>Submit application</Button>}
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

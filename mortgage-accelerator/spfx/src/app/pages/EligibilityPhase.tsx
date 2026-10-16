import * as React from 'react';
import { useApp } from '../context';
import { Button, Chip, CheckField, NumberField, Panel, SelectField, TextField } from '../components/ui';
import { computeEligibility, POLICY } from '../domain/rules';
import { EligibilityInput, EligibilityResult, MortgageCase, ProductCode } from '../domain/types';
import { money } from '../format';

/**
 * Phase 1 of 3 (Loan Eligibility). It mirrors the existing Staff Loan eligibility screen: account
 * number and OTP, the same inputs, a "Computation Results" panel, a Decision Rule, Exceptional
 * Approval and Next Step. The figures come from the Advance Flow eligibility service.
 */
export function EligibilityPhase(p: { c: MortgageCase; product: ProductCode; onProductChange: (p: ProductCode) => void; onDone: () => void }): JSX.Element {
  const app = useApp();
  const c = p.c;
  const prior = c.eligibility;
  const [account, setAccount] = React.useState(prior ? prior.input.accountNumber : '');
  const [otpSent, setOtpSent] = React.useState('');
  const [code, setCode] = React.useState('');
  const [verified, setVerified] = React.useState(!!prior);
  const [dob, setDob] = React.useState(prior ? prior.input.dateOfBirth : '');
  const [net, setNet] = React.useState(prior ? prior.input.netSalary : 0);
  const [allow, setAllow] = React.useState(prior ? prior.input.allowances : 0);
  const [amount, setAmount] = React.useState(prior ? prior.input.loanAmount : 0);
  const [personal, setPersonal] = React.useState(prior ? prior.input.instalmentPersonal : 0);
  const [mhp, setMhp] = React.useState(prior ? prior.input.instalmentMortgageHp : 0);
  const [payOff, setPayOff] = React.useState(prior ? prior.input.payOffExistingLoans : false);
  const [exceptional, setExceptional] = React.useState(prior ? prior.exceptionalApproval : false);
  const [res, setRes] = React.useState<EligibilityResult | undefined>(prior ? prior.result : undefined);
  const [busy, setBusy] = React.useState(false);

  const input: EligibilityInput = { loanType: p.product, accountNumber: account, dateOfBirth: dob, netSalary: net, allowances: allow, loanAmount: amount, instalmentPersonal: personal, instalmentMortgageHp: mhp, payOffExistingLoans: payOff };
  const acctOk = /^\d{13}$/.test(account);
  const ready = verified && net > 0 && amount > 0;
  const shown = res;
  const decisionOk = !!shown && shown.decisionRule === 'ELIGIBLE';
  const canNext = !!shown && (decisionOk || (shown.exceptionalApprovalAllowed && exceptional));

  const fail = function (e: unknown): void { app.toast(e instanceof Error ? e.message : String(e)); };
  const reset = function (): void { setAccount(''); setOtpSent(''); setCode(''); setVerified(false); setDob(''); setNet(0); setAllow(0); setAmount(0); setPersonal(0); setMhp(0); setPayOff(false); setExceptional(false); setRes(undefined); };

  return (
    <div className="ma-grid2" style={{ gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)' }}>
      <Panel>
        <h2 style={{ textAlign: 'center', fontSize: 20, marginBottom: 14 }}>Step 1 — Loan Eligibility</h2>
        <div className="ma-fgrid">
          <TextField id="e-acct" label="Account number" required value={account} disabled={verified} onChange={function (v) { setAccount(v.replace(/\D/g, '').slice(0, 13)); }} hint="Enter the 13-digit account number to receive an OTP" />
          <SelectField id="e-type" label="Loan type" required value={p.product} onChange={function (v) { if (v) { p.onProductChange(v as ProductCode); } }}
            options={[['HOME_PURCHASE', 'MORTGAGE - NEW ACQUISITION (Home Purchase)'], ['EQUITY_RELEASE', 'MORTGAGE - HOME EQUITY RELEASE']]} />
          {!verified ? (
            <div className="ma-f wide">
              <div className="ma-row">
                <Button disabled={!acctOk || busy} onClick={function () { setBusy(true); app.client.requestOtp(account).then(function (r) { setOtpSent(r.maskedPhone); app.toast('OTP sent to ' + r.maskedPhone); }, fail).then(function () { setBusy(false); }); }}>{otpSent ? 'Resend OTP' : 'Send OTP'}</Button>
                {otpSent ? <><input aria-label="OTP" placeholder="6-digit code" value={code} onChange={function (e) { setCode(e.target.value); }} style={{ border: '1px solid #D2CECA', borderRadius: 6, padding: '8px 10px', width: 140 }} />
                  <Button primary disabled={code.length < 4 || busy} onClick={function () {
                    setBusy(true);
                    app.client.verifyOtp(account, code).then(function (prof) {
                      setVerified(true); setDob(prof.dateOfBirth); setNet(prof.netSalary); setAllow(prof.allowances); setPersonal(prof.instalmentPersonal); setMhp(prof.instalmentMortgageHp);
                      app.toast('Verified. Your salary details were loaded from payroll.');
                    }, fail).then(function () { setBusy(false); });
                  }}>Verify</Button></> : null}
              </div>
              <div className="small muted" style={{ marginTop: 6 }}>{otpSent ? 'Code sent to ' + otpSent : 'The date of birth, salary and allowances fill in after the OTP is verified.'}</div>
            </div>
          ) : null}
          <TextField id="e-dob" label="Date of birth" type="date" value={dob} readOnly onChange={function () { /* payroll */ }} />
          <NumberField id="e-net" label="Net salary" required value={net} disabled={!verified} onChange={setNet} />
          <NumberField id="e-all" label="Allowances (Rent + Clothing)" required value={allow} disabled={!verified} onChange={setAllow} />
          <NumberField id="e-amt" label="Loan amount requested" required value={amount} disabled={!verified} onChange={setAmount} />
          <NumberField id="e-per" label="Monthly instalment (Personal + Auto + Education)" value={personal} disabled={!verified} onChange={setPersonal} />
          <NumberField id="e-mhp" label="Monthly instalment (Mortgage + HP only)" value={mhp} disabled={!verified} onChange={setMhp} />
          <div className="ma-f wide"><CheckField id="e-pay" label="Do you want to pay off existing loans?" checked={payOff} disabled={!verified} onChange={setPayOff} /></div>
        </div>
        <div className="ma-row" style={{ marginTop: 16 }}>
          <Button primary disabled={!ready || busy} onClick={function () {
            setBusy(true);
            app.client.computeEligibility(c.id, input, exceptional).then(function (r) { setRes(r); if (r.decisionRule === 'ELIGIBLE') { setExceptional(false); } }, fail).then(function () { setBusy(false); });
          }}>Compute Eligibility</Button>
          <Button onClick={reset}>Reset</Button>
        </div>
      </Panel>
      <div className="ma-stack">
        <Panel title="Computation Results">
          <table className="ma-t" style={{ minWidth: 0 }}>
            <tbody>
              <Row k="Interest Rate (p.a.)" v={shown ? shown.interestRatePct.toFixed(2) + '%' : '0.00%'} />
              <Row k="DIR Limit" v={shown ? shown.dirLimitPct.toFixed(2) + '%' : (POLICY.maxDsrPct.toFixed(2) + '%')} />
              <Row k="Tenor (Months)" v={shown ? String(shown.tenorMonths) : '-'} />
              <Row k="Periodic Instalment" v={money(shown ? shown.periodicInstalment : 0, 'GHS')} />
              <Row k="DIR (Capital + Personal)" v={(shown ? shown.dirCapitalPersonalPct : 0).toFixed(2) + '%'} warn={!!shown && shown.dirCapitalPersonalPct > shown.dirLimitPct} />
              <Row k="DIR (All Staff Loans)" v={(shown ? shown.dirAllStaffLoansPct : 0).toFixed(2) + '%'} warn={!!shown && shown.dirAllStaffLoansPct > shown.dirLimitPct} />
              <Row k="Loan Amount Qualified For" v={money(shown ? shown.loanAmountQualifiedFor : 0, 'GHS')} />
              <tr><td style={{ padding: '9px 12px' }}>Decision Rule</td><td style={{ padding: '9px 12px', textAlign: 'right' }}>{shown ? <Chip tone={decisionOk ? 'dark' : 'orange'}>{shown.decisionRule === 'ELIGIBLE' ? 'Eligible' : shown.decisionRule === 'NOT_ELIGIBLE' ? '—' : 'Exceeds limit'}</Chip> : <Chip tone="idle">-</Chip>}</td></tr>
            </tbody>
          </table>
          {shown && shown.decisionRule !== 'NOT_ELIGIBLE' ? <div className="small muted" style={{ marginTop: 8 }}>{shown.decisionText}</div> : null}
        </Panel>
        <div className="ma-f"><CheckField id="e-ex" label="Exceptional Approval" checked={exceptional} disabled={!shown || !shown.exceptionalApprovalAllowed} onChange={setExceptional} />
          <span className="hint">Available only when the figures are over the limit. It adds an executive approval level and is recorded in the audit trail.</span></div>
        <div><Button primary disabled={!canNext} onClick={function () { p.onDone(); }}>Next Step</Button></div>
        <div className="small muted">{verified ? 'Compute eligibility, then continue to the Loan Application.' : 'Enter account number (13 digits) to receive OTP'}</div>
      </div>
    </div>
  );
}

function Row(p: { k: string; v: string; warn?: boolean }): JSX.Element {
  return <tr><td style={{ padding: '9px 12px' }}>{p.k}</td><td className="num" style={{ padding: '9px 12px', textAlign: 'right', color: p.warn ? '#A04000' : undefined, fontWeight: p.warn ? 700 : undefined }}>{p.v}</td></tr>;
}

export { computeEligibility };

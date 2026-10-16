import * as React from 'react';
import { useApp } from '../context';
import { Button, Chip, Note, Panel, TextField } from '../components/ui';
import { MortgageCase } from '../domain/types';
import { money } from '../format';

/**
 * Start of a mortgage application. The applicant has already used Create Staff Loan in Advance Flow
 * (Step 1 eligibility, Step 2 pre-approval documents). The module does not repeat either: it links to
 * that loan and shows Advance Flow's eligibility result read-only, with Advance Flow's own labels.
 */
export function LinkLoanPhase(p: { c: MortgageCase; onDone: () => void }): JSX.Element {
  const app = useApp();
  const c = p.c;
  const [loan, setLoan] = React.useState(c.afLoanNumber || '');
  const [acct, setAcct] = React.useState(c.accountNumber || '');
  const [busy, setBusy] = React.useState(false);
  const e = c.eligibility;
  const r = e && e.result;

  const link = function (): void {
    setBusy(true);
    app.client.linkLoan(c.id, loan, acct).then(function () { p.onDone(); }, function (x) { app.toast(x instanceof Error ? x.message : String(x)); }).then(function () { setBusy(false); });
  };

  return (
    <div className="ma-grid2" style={{ gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)' }}>
      <div className="ma-stack">
        <Panel title="Before you start">
          <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li>Submit the completed <b>valuation form</b> to the Collateral Maintenance Unit (step 4 of this application does it for you).</li>
            <li>Send the <b>Land Title Certificate</b> and <b>Personalized site plan</b> to the Mortgage Unit for the search report (also in step 4).</li>
            <li>In Advance Flow, go to <b>Staff Loan, Create Staff Loan</b>. Step 1 checks your eligibility. <b>Step 2 is where you attach the pre-approval documents.</b></li>
            <li>Come back here with the loan number from <b>My Loans</b> to complete the mortgage application form and follow the case.</li>
          </ol>
        </Panel>
        <Panel title="Link your Advance Flow loan">
          <div className="ma-fgrid">
            <TextField id="l-loan" label="Loan number (from My Loans)" required value={loan} onChange={setLoan} hint="For example SL-2026-0042" />
            <TextField id="l-acct" label="Account Number" required value={acct} onChange={function (v) { setAcct(v.replace(/\D/g, '').slice(0, 13)); }} hint="The 13-digit account number you entered in Create Staff Loan" />
          </div>
          <div className="ma-row" style={{ marginTop: 12 }}>
            <Button primary disabled={busy || !loan.trim() || acct.length !== 13} onClick={link}>{e ? 'Link again' : 'Link loan'}</Button>
            {e ? <Button onClick={p.onDone}>Continue</Button> : null}
          </div>
        </Panel>
      </div>
      <Panel title="Loan eligibility (from Advance Flow)">
        {r ? (
          <>
            <table className="ma-t" style={{ minWidth: 0 }}><tbody>
              <tr><td>Interest Rate (p.a.)</td><td className="right num">{r.interestRatePct.toFixed(2)}%</td></tr>
              <tr><td>DIR Limit</td><td className="right num">{r.dirLimitPct.toFixed(2)}%</td></tr>
              <tr><td>Tenor (Months)</td><td className="right num">{r.tenorMonths}</td></tr>
              <tr><td>Periodic Instalment</td><td className="right num">{money(r.periodicInstalment, 'GHS')}</td></tr>
              <tr><td>DIR (Capital + Personal)</td><td className="right num">{r.dirCapitalPersonalPct.toFixed(2)}%</td></tr>
              <tr><td>DIR (All Staff Loans)</td><td className="right num">{r.dirAllStaffLoansPct.toFixed(2)}%</td></tr>
              <tr><td>Loan Amount Qualified For</td><td className="right num">{money(r.loanAmountQualifiedFor, 'GHS')}</td></tr>
              <tr><td>Decision Rule</td><td className="right"><Chip tone={r.decisionRule === 'ELIGIBLE' ? 'dark' : 'orange'}>{r.decisionRule === 'ELIGIBLE' ? 'Eligible' : 'Exceeds limit'}</Chip></td></tr>
            </tbody></table>
            <div className="small muted" style={{ marginTop: 8 }}>Read from loan {c.afLoanNumber}. To change these figures, change the loan in Advance Flow.</div>
          </>
        ) : <Note>Link your loan to see the result Advance Flow calculated. Nothing is computed again here.</Note>}
      </Panel>
    </div>
  );
}

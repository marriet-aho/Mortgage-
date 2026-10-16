import * as React from 'react';
import { useApp } from '../context';
import { ReadinessPanel } from '../components/panels';
import { Button, CheckField, Head, Note, NumberField, Panel, RadioField, Section, SelectField } from '../components/ui';
import { evaluateReadiness, maxTenorYears, POLICY } from '../domain/rules';
import { ProductCode } from '../domain/types';

/**
 * Module 4: Mortgage Readiness Engine, as a what-if tool. It runs the same pure rules the
 * pre-approval workflow runs, in the browser, so applicants can see the outcome before applying.
 */
export function ReadinessPage(): JSX.Element {
  const app = useApp();
  const [product, setProduct] = React.useState<ProductCode>('HOME_PURCHASE');
  const [basic, setBasic] = React.useState(22000);
  const [allow, setAllow] = React.useState(3000);
  const [ded, setDed] = React.useState(6500);
  const [loans, setLoans] = React.useState(1500);
  const [other, setOther] = React.useState(1500);
  const [price, setPrice] = React.useState(520000);
  const [down, setDown] = React.useState(110000);
  const [fsv, setFsv] = React.useState(700000);
  const [existing, setExisting] = React.useState(0);
  const [amount, setAmount] = React.useState(400000);
  const [tenor, setTenor] = React.useState(20);
  const [status, setStatus] = React.useState('PERMANENT');
  const [consent, setConsent] = React.useState(true);
  const [docs, setDocs] = React.useState(100);
  const [rate, setRate] = React.useState(POLICY.defaultRatePct);

  const input = {
    product,
    employmentStatus: status as 'PERMANENT' | 'CONTRACT' | 'PROBATION',
    dateEmployed: '2016-01-01',
    dateOfBirth: '1988-03-14',
    retirementDate: '2048-03-14',
    financials: { basicSalary: basic, allowances: allow, otherIncome: 0, deductions: ded, existingLoanRepayments: loans, otherCommitments: other, assetsTotal: 0, liabilitiesTotal: 0 },
    amountRequested: amount,
    tenorYears: tenor,
    ratePct: rate,
    purchase: product === 'HOME_PURCHASE' ? { purchasePrice: price, propertyValue: price, downPayment: down } : undefined,
    equity: product === 'EQUITY_RELEASE' ? { declaredValue: Math.round(fsv / 0.78), forcedSaleValue: fsv, existingMortgageBalance: existing } : undefined,
    consent: { creditBureau: consent, identity: consent, dataProcessing: consent, regulatory: consent, informationSharing: consent },
    documentsPct: docs,
    titleInApplicantName: product === 'EQUITY_RELEASE' ? true : undefined
  };
  const result = evaluateReadiness(input);
  const cap = maxTenorYears(product, input.retirementDate, new Date());

  const start = function (): void {
    void (async function () {
      const d = await app.client.createDraft(product);
      await app.client.saveDraft(d.id, {
        financials: input.financials, amountRequested: amount, tenorYears: tenor,
        purchase: product === 'HOME_PURCHASE' ? { purchasePrice: price, propertyValue: price, downPayment: down } : undefined,
        equity: product === 'EQUITY_RELEASE' ? { declaredValue: Math.round(fsv / 0.78), existingMortgageBalance: existing } : undefined
      });
      app.go('/apply/' + (product === 'HOME_PURCHASE' ? 'purchase' : 'equity'));
    })().catch(function (e) { app.toast(String(e)); });
  };

  return (
    <>
      <Head title="Mortgage readiness check" sub="Try your figures. The same rules that decide pre-approval run here, so you can see what would pass, what would be referred, and what to change." />
      <div className="ma-grid2">
        <div className="ma-stack">
          <Section title="Your figures">
            <div className="ma-fgrid">
              <RadioField id="r-p" label="Product" wide value={product} options={[['HOME_PURCHASE', 'Home Purchase'], ['EQUITY_RELEASE', 'Home Equity Release']]} onChange={function (v) { setProduct(v as ProductCode); }} />
              <NumberField id="r-b" label="Basic salary (monthly)" value={basic} onChange={setBasic} />
              <NumberField id="r-a" label="Allowances" value={allow} onChange={setAllow} />
              <NumberField id="r-d" label="Tax, pension and deductions" value={ded} onChange={setDed} />
              <NumberField id="r-l" label="Existing loan repayments" value={loans} onChange={setLoans} />
              <NumberField id="r-o" label="Other monthly commitments" value={other} onChange={setOther} />
              <SelectField id="r-s" label="Employment" value={status} options={[['PERMANENT', 'Permanent'], ['CONTRACT', 'Contract'], ['PROBATION', 'Probation']]} onChange={function (v) { setStatus(v || 'PERMANENT'); }} />
              {product === 'HOME_PURCHASE' ? (
                <>
                  <NumberField id="r-pp" label="Purchase price" value={price} onChange={setPrice} />
                  <NumberField id="r-dp" label="Down payment" value={down} onChange={setDown} hint={'Minimum ' + POLICY.minDownPaymentPct + '%: ' + Math.round(price * POLICY.minDownPaymentPct / 100).toLocaleString('en-GB')} />
                </>
              ) : (
                <>
                  <NumberField id="r-f" label="Forced sale value (from a valuation, or your estimate)" value={fsv} onChange={setFsv} />
                  <NumberField id="r-e" label="Existing mortgage balance" value={existing} onChange={setExisting} />
                </>
              )}
              <NumberField id="r-am" label="Amount you want" value={amount} onChange={setAmount} />
              <NumberField id="r-t" label="Tenor (years)" value={tenor} onChange={setTenor} hint={'Up to ' + cap + ' years for this example'} />
              <NumberField id="r-r" label="Annual rate (%)" value={rate} onChange={setRate} hint="Indicative. The approved rate is set at offer." />
              <div className="ma-f wide"><span className="lab">What you have ready</span>
                <CheckField id="r-c" label="I have signed consent" checked={consent} onChange={setConsent} />
                <label htmlFor="r-dc" className="small" style={{ marginTop: 6 }}>Required documents uploaded: <b>{docs}%</b></label>
                <input id="r-dc" type="range" min={0} max={100} step={10} value={docs} onChange={function (e) { setDocs(Number(e.target.value)); }} />
              </div>
            </div>
          </Section>
          <div><Button primary onClick={start}>Start an application with these figures</Button></div>
        </div>
        <div className="ma-stack">
          <ReadinessPanel result={result} />
          <Panel title="How this is scored"><div className="small muted">Affordability 30, employment stability 10, tenor 5, down payment or forced-sale-value rule 15, consent 10, documents 10, credit bureau 10, HR verification 10. A score of 75 or more with no failed check pre-approves; 55 to 74, or any failed check, is referred to a Credit officer; below 55 or any hard stop needs fixing first. The engine never declines on its own.</div></Panel>
          <Note>This is an estimate. HR verification and the credit bureau result are confirmed after you apply.</Note>
        </div>
      </div>
    </>
  );
}

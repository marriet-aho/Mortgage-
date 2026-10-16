import * as React from 'react';
import { useApp, useAsync } from '../context';
import { Button, Chip, Head, Kpis, Loading, Panel, Section, Table } from '../components/ui';
import { requiredSpecs } from '../domain/documents';
import { POLICY } from '../domain/rules';
import { MortgageCase, ProductCode, PRODUCT_LABEL, STATE_LABEL } from '../domain/types';
import { money } from '../format';

const JOURNEY: { [p in ProductCode]: Array<[string, string, string]> } = {
  HOME_PURCHASE: [
    ['Apply', 'Applicant', 'Forms A, B, C, E, F, G (and J for a private vendor), documents, e-signature'],
    ['Pre-approve', 'System, HR, Credit', 'Validation, HR check, bureau, affordability, risk, score, decision. Target under 24 hours.'],
    ['Assess in parallel', 'Collateral, Legal, Credit', 'Valuation, three legal searches, vendor due diligence, credit assessment'],
    ['Approve', 'Approval authorities', 'Tiered matrix, parallel where policy allows'],
    ['Offer', 'System, Applicant', 'Offer and Truth in Lending generated and signed'],
    ['Conditions', 'Applicant, Legal, Credit Admin', 'Down payment, legal advice, declaration, insurance, fees, spousal consent'],
    ['Fit-to-lend', 'Collateral', 'Certificate and security documents'],
    ['Disburse', 'Credit Admin, Operations', 'Gate check, four-eyes approval, payment to vendor, account activation. Stage payments if under construction.'],
    ['Perfect security', 'Post Disbursement', 'Registration, perfection, Lands Commission, title, safe custody']
  ],
  EQUITY_RELEASE: [
    ['Apply', 'Applicant', 'Forms A, C, E, F, G, H, I, documents, e-signature'],
    ['Pre-approve', 'System, HR, Credit', 'Indicative on declared value. Ownership checked against the title number.'],
    ['Assess in parallel', 'Collateral, Legal, Credit', 'Valuation with forced sale value, searches, ownership and encumbrance review'],
    ['Cap check', 'System', 'Release limited to 70% of forced sale value less any existing mortgage'],
    ['Approve', 'Approval authorities', 'Tiered matrix'],
    ['Offer', 'System, Applicant', 'Offer and Truth in Lending generated and signed'],
    ['Conditions', 'Applicant, Legal, Credit Admin', 'Spousal consent, legal advice, declaration, insurance, fees, existing lender consent'],
    ['Disburse', 'Credit Admin, Operations', 'Tuition and medical paid direct; renovation in stages; emergency to the applicant'],
    ['Perfect security', 'Post Disbursement', 'Registration, perfection, title, safe custody']
  ]
};

/** Modules 1 and 2: one landing page per product. */
export function ProductPage(p: { product: ProductCode }): JSX.Element {
  const app = useApp();
  const cases = useAsync(function () { return app.client.listCases({ product: p.product }); }, [p.product]);
  const isApplicant = app.user.roles.indexOf('APPLICANT') >= 0;
  const seg = p.product === 'HOME_PURCHASE' ? 'purchase' : 'equity';
  const sample = { product: p.product, applicant: {} } as Pick<MortgageCase, 'product' | 'applicant'>;
  const list = cases.data || [];
  const active = list.filter(function (c) { return ['CLOSED', 'DECLINED', 'WITHDRAWN', 'EXPIRED', 'DRAFT'].indexOf(c.state) < 0; });
  const rules: Array<[string, string]> = p.product === 'HOME_PURCHASE' ? [
    ['Who', 'Staff buying a completed or under-construction property from a developer or private vendor'],
    ['Minimum down payment', POLICY.minDownPaymentPct + '% of the purchase price'],
    ['Maximum loan to value', POLICY.maxLtvPct + '%'],
    ['Maximum tenor', 'The lower of ' + POLICY.maxTenorYears.HOME_PURCHASE + ' years and the years to retirement'],
    ['Debt service limit', POLICY.maxDsrPct + '% of net income'],
    ['Vendor', 'Private vendors complete a due-diligence form; payment only to a cleared vendor'],
    ['Pre-approval valid for', POLICY.preApprovalValidityDays.HOME_PURCHASE + ' days']
  ] : [
    ['Who', 'Staff releasing equity from a property they own'],
    ['Permitted uses', 'Home improvement, renovation, medical expenses, family emergency, tuition'],
    ['Maximum release', POLICY.maxFsvPct + '% of forced sale value, less any existing mortgage'],
    ['Property', 'Registered in your name, properly documented, valued and fit-to-lend'],
    ['Maximum tenor', 'The lower of ' + POLICY.maxTenorYears.EQUITY_RELEASE + ' years and the years to retirement'],
    ['Debt service limit', POLICY.maxDsrPct + '% of net income'],
    ['Payment', 'Tuition and medical direct to the institution; renovation in stages after inspection'],
    ['Pre-approval valid for', POLICY.preApprovalValidityDays.EQUITY_RELEASE + ' days']
  ];
  if (cases.loading) { return <Loading />; }
  return (
    <>
      <Head title={p.product === 'HOME_PURCHASE' ? 'Home Purchase Mortgage' : PRODUCT_LABEL[p.product]}
        sub={p.product === 'HOME_PURCHASE' ? 'Buy a home with a staff mortgage. Everything from application to title perfection happens in one place.' : 'Release equity from a home you own, with the same digital journey and a built-in 70% forced sale value check.'}
        actions={isApplicant ? <><Button primary onClick={function () { app.go('/apply/' + seg); }}>Start application</Button><Button onClick={function () { app.go('/readiness'); }}>Check my readiness</Button></> : <Button onClick={function () { app.go('/cases'); }}>Open cases</Button>} />
      {!isApplicant ? <Kpis items={[
        { label: 'Active cases', value: String(active.length) },
        { label: 'Pipeline value', value: money(active.reduce(function (s, c) { return s + c.amountRequested; }, 0)) },
        { label: 'In approval', value: String(list.filter(function (c) { return c.state === 'IN_APPROVAL'; }).length) },
        { label: 'Awaiting disbursement', value: String(list.filter(function (c) { return c.state === 'READY_TO_DISBURSE'; }).length) }
      ]} /> : null}
      <div className="ma-grid-even">
        <Section title="Rules"><Panel><Table rowKey={function (r: [string, string]) { return r[0]; }} rows={rules} cols={[{ head: 'Rule', render: function (r) { return <b>{r[0]}</b>; } }, { head: 'This product', render: function (r) { return r[1]; } }]} /></Panel></Section>
        <Section title="Documents you will need"><Panel>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>{requiredSpecs(sample).map(function (s) { return <li key={s.docType}><b>{s.label}</b> <span className="muted small">{s.hint}</span></li>; })}</ul>
          <div className="small muted" style={{ marginTop: 8 }}>Each file is uploaded once to the case folder in SharePoint and read by every unit.</div>
        </Panel></Section>
      </div>
      <Section title="The journey">
        <Table rowKey={function (r: [string, string, string]) { return r[0]; }} rows={JOURNEY[p.product]}
          cols={[{ head: 'Stage', render: function (r) { return <b>{r[0]}</b>; } }, { head: 'Who', render: function (r) { return r[1]; } }, { head: 'What happens', render: function (r) { return r[2]; } }]} />
      </Section>
      {!isApplicant ? (
        <Section title="Cases on this product">
          <Table rowKey={function (c: MortgageCase) { return c.id; }} rows={list.slice(0, 8)} empty="No cases yet." onRow={function (c) { app.go('/cases/' + c.id); }}
            cols={[{ head: 'Case', render: function (c) { return <b>{c.ref}</b>; } }, { head: 'Applicant', render: function (c) { return c.applicant.fullName; } }, { head: 'Amount', right: true, render: function (c) { return money(c.amountRequested, c.currency); } }, { head: 'Status', render: function (c) { return <Chip tone="dark">{STATE_LABEL[c.state]}</Chip>; } }]} />
        </Section>
      ) : null}
    </>
  );
}

export function PurchasePage(): JSX.Element { return <ProductPage product="HOME_PURCHASE" />; }
export function EquityPage(): JSX.Element { return <ProductPage product="EQUITY_RELEASE" />; }

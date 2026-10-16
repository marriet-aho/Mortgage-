import * as React from 'react';
import { useApp, useAsync } from '../context';
import { AuditTable } from '../components/panels';
import { BarChart, Donut, Funnel, HBars, StackedHBars } from '../components/charts';
import { Button, ErrorNote, Head, Kpis, Loading, Note, Panel, Section, SelectField, SlaChip, StateChip, Table, TextField } from '../components/ui';
import { ltvPct } from '../domain/rules';
import { MortgageCase, PRODUCT_LABEL, ProductCode } from '../domain/types';
import { compactMoney, money } from '../format';

/* ===================================================================== */
/* Module 12: Executive dashboard                                         */
/* ===================================================================== */

export function ExecutivePage(): JSX.Element {
  const app = useApp();
  const a = useAsync(function () { return app.client.getAnalytics(); });
  const cases = useAsync(function () { return app.client.listCases(); });
  if (a.loading || cases.loading) { return <Loading />; }
  if (a.error || !a.data) { return <ErrorNote message={a.error || 'No data'} />; }
  const s = a.data;
  const list = cases.data || [];
  const active = list.filter(function (c) { return ['CLOSED', 'DECLINED', 'WITHDRAWN', 'EXPIRED', 'DRAFT'].indexOf(c.state) < 0; });
  const exceptions = active.filter(function (c) { return c.approvals.some(function (x) { return x.level === 'L8'; }) || (c.readiness && c.readiness.decision !== 'PRE_APPROVED'); });
  const top = active.slice().sort(function (x, y) { return y.amountRequested - x.amountRequested; }).slice(0, 5);
  const byDept: { [d: string]: number } = {};
  active.forEach(function (c) { byDept[c.applicant.department] = (byDept[c.applicant.department] || 0) + c.amountRequested; });
  const totalPipeline = active.reduce(function (n, c) { return n + c.amountRequested; }, 0);
  const deptRows = Object.keys(byDept).map(function (d) { return { label: d, value: Math.round(byDept[d] / 1000) }; }).sort(function (x, y) { return y.value - x.value; }).slice(0, 5);
  return (
    <>
      <Head title="Executive dashboard" sub="The whole mortgage business on one page: how much is in flight, how fast it moves, where it sticks, and what is at risk." />
      <Kpis items={s.kpis} />
      <div className="ma-grid-even">
        <Section title="Portfolio by product (GHS millions)"><Panel><Donut parts={s.portfolioByProduct.map(function (x) { return { label: x.label, value: x.value }; })} centre={'GHS ' + s.portfolioByProduct.reduce(function (n, x) { return n + x.value; }, 0).toFixed(1) + 'M'} /></Panel></Section>
        <Section title="Post-disbursement ageing"><Panel><Donut parts={s.ageing.map(function (x) { return { label: x.bucket, value: x.count }; })} centre={s.ageing.reduce(function (n, x) { return n + x.count; }, 0) + ' items'} /></Panel></Section>
      </div>
      <div className="ma-grid-even">
        <Section title="Turnaround against target (days)"><Panel><HBars unit=" d" data={s.turnaround.map(function (t) { return { label: t.label, value: t.days, target: t.target }; })} /></Panel></Section>
        <Section title="Applications received"><Panel><BarChart data={s.monthly.map(function (m) { return { label: m.month, a: m.purchase, b: m.equity }; })} aLabel="Home Purchase" bLabel="Home Equity Release" /></Panel></Section>
      </div>
      <div className="ma-grid-even">
        <Section title="Pipeline exposure by department (GHS thousands)"><Panel><HBars data={deptRows} focusOver={false} /><div className="small muted" style={{ marginTop: 8 }}>Of {money(totalPipeline)} in flight. Watch concentration in a single department.</div></Panel></Section>
        <Section title="Why applications are declined"><Panel><HBars data={s.declineReasons.map(function (d) { return { label: d.reason, value: d.count }; })} focusOver={false} /></Panel></Section>
      </div>
      <Section title="Largest cases in flight">
        <Table rowKey={function (c: MortgageCase) { return c.id; }} rows={top} onRow={function (c) { app.go('/cases/' + c.id); }}
          cols={[{ head: 'Case', render: function (c) { return <b>{c.ref}</b>; } }, { head: 'Applicant', render: function (c) { return c.applicant.fullName + ' · ' + c.applicant.department; } }, { head: 'Product', render: function (c) { return PRODUCT_LABEL[c.product]; } }, { head: 'Amount', right: true, render: function (c) { return money(c.amountRequested, c.currency); } }, { head: 'Status', render: function (c) { return <StateChip state={c.state} />; } }, { head: 'SLA', render: function (c) { return <SlaChip clock={c.sla} />; } }]} />
      </Section>
      <Section title="Needs executive attention" aside={exceptions.length + ' cases'}>
        {exceptions.length === 0 ? <Note>No exceptions or referred cases.</Note> : <Table rowKey={function (c: MortgageCase) { return c.id; }} rows={exceptions} onRow={function (c) { app.go('/cases/' + c.id); }} cols={[{ head: 'Case', render: function (c) { return <b>{c.ref}</b>; } }, { head: 'Applicant', render: function (c) { return c.applicant.fullName; } }, { head: 'Why', render: function (c) { return c.approvals.some(function (x) { return x.level === 'L8'; }) ? 'Executive approval required' : 'Referred to Credit'; } }, { head: 'Amount', right: true, render: function (c) { return money(c.amountRequested, c.currency); } }]} />}
      </Section>
    </>
  );
}

/* ===================================================================== */
/* Module 13: Mortgage analytics                                          */
/* ===================================================================== */

export function AnalyticsPage(): JSX.Element {
  const app = useApp();
  const a = useAsync(function () { return app.client.getAnalytics(); });
  const cases = useAsync(function () { return app.client.listCases(); });
  const [product, setProduct] = React.useState('');
  if (a.loading || cases.loading) { return <Loading />; }
  if (a.error || !a.data) { return <ErrorNote message={a.error || 'No data'} />; }
  const s = a.data;
  const list = (cases.data || []).filter(function (c) { return c.state !== 'DRAFT' && (!product || c.product === (product as ProductCode)); });
  const bands = [
    { label: 'Up to 30%', lo: 0, hi: 30 }, { label: '30–40%', lo: 30, hi: 40 }, { label: '40–50%', lo: 40, hi: 50 }, { label: 'Over 50%', lo: 50, hi: 1000 }
  ];
  const dsr = function (c: MortgageCase): number { return c.readiness ? c.readiness.dsrPct : 0; };
  const dsrData = bands.map(function (b) { return { label: b.label, value: list.filter(function (c) { return dsr(c) >= b.lo && dsr(c) < b.hi; }).length }; });
  const ltvBands = [
    { label: 'Up to 60%', lo: 0, hi: 60 }, { label: '60–70%', lo: 60, hi: 70 }, { label: '70–80%', lo: 70, hi: 80 }, { label: 'Over 80%', lo: 80, hi: 1000 }
  ];
  const ltv = function (c: MortgageCase): number {
    const v = c.purchase ? c.purchase.propertyValue : c.equity ? c.equity.forcedSaleValue || c.equity.declaredValue : 0;
    return ltvPct(c.amountRequested + (c.equity ? c.equity.existingMortgageBalance : 0), v);
  };
  const ltvData = ltvBands.map(function (b) { return { label: b.label, value: list.filter(function (c) { return ltv(c) >= b.lo && ltv(c) < b.hi; }).length }; });
  const decided = list.filter(function (c) { return ['OFFER_ISSUED', 'CONDITIONS_PENDING', 'READY_TO_DISBURSE', 'DISBURSED', 'POST_DISBURSEMENT', 'CLOSED', 'DECLINED'].indexOf(c.state) >= 0; });
  const approved = decided.filter(function (c) { return c.state !== 'DECLINED'; }).length;
  const avgAmt = list.length ? list.reduce(function (n, c) { return n + c.amountRequested; }, 0) / list.length : 0;
  const avgScore = list.length ? list.reduce(function (n, c) { return n + (c.readiness ? c.readiness.score : 0); }, 0) / list.length : 0;
  const csv = function (): void {
    const head = ['Reference', 'Product', 'Applicant', 'Department', 'Amount', 'Tenor', 'Status', 'Readiness', 'DSR %', 'Submitted'];
    const rows = list.map(function (c) { return [c.ref, PRODUCT_LABEL[c.product], c.applicant.fullName, c.applicant.department, c.amountRequested, c.tenorYears, c.state, c.readiness ? c.readiness.score : '', c.readiness ? c.readiness.dsrPct.toFixed(1) : '', c.submittedAt || ''].map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(','); });
    const blob = new Blob([[head.join(',')].concat(rows).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'mortgage-cases.csv'; link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <>
      <Head title="Mortgage analytics" sub="Conversion, speed, quality and risk. Slice by product and export the underlying cases." actions={<Button onClick={csv}>Export cases (CSV)</Button>} />
      <div style={{ maxWidth: 260 }}><SelectField id="ap" label="Product" value={product} onChange={setProduct} options={[['HOME_PURCHASE', PRODUCT_LABEL.HOME_PURCHASE], ['EQUITY_RELEASE', PRODUCT_LABEL.EQUITY_RELEASE]]} /></div>
      <Kpis items={[
        { label: 'Cases', value: String(list.length) },
        { label: 'Average amount', value: 'GHS ' + compactMoney(avgAmt) },
        { label: 'Average readiness score', value: avgScore.toFixed(0) },
        { label: 'Approval rate', value: decided.length ? Math.round((approved / decided.length) * 100) + '%' : '—' },
        { label: 'Declined', value: String(decided.length - approved) }
      ]} />
      <div className="ma-grid-even">
        <Section title="Funnel"><Panel><Funnel rows={s.funnel.map(function (f) { return { label: f.label, count: f.count, value: 'GHS ' + compactMoney(f.value) }; })} /></Panel></Section>
        <Section title="Median days per stage against target"><Panel><HBars unit=" d" data={s.stageDays.map(function (d) { return { label: d.stage, value: d.medianDays, target: d.targetDays }; })} /></Panel></Section>
      </div>
      <div className="ma-grid-even">
        <Section title="Debt service ratio at application"><Panel><HBars data={dsrData} focusOver={false} /><div className="small muted" style={{ marginTop: 6 }}>Cases per band. The policy limit is 50%.</div></Panel></Section>
        <Section title="Loan to value"><Panel><HBars data={ltvData} focusOver={false} /><div className="small muted" style={{ marginTop: 6 }}>Home Purchase is capped at 80%.</div></Panel></Section>
      </div>
      <div className="ma-grid-even">
        <Section title="SLA performance by team"><Panel><StackedHBars data={s.slaByTeam.map(function (t) { return { label: t.team, ok: t.onTime, bad: t.breached }; })} /></Panel></Section>
        <Section title="Turnaround against target"><Panel><HBars unit=" d" data={s.turnaround.map(function (t) { return { label: t.label, value: t.days, target: t.target }; })} /></Panel></Section>
      </div>
      <Note>{s.sample ? 'Monthly, stage-time and team series are illustrative samples from the local harness. Counts, DSR and LTV above are computed from the cases shown. In production every series is computed from Advance Flow data.' : 'All series are computed from Advance Flow data.'}</Note>
    </>
  );
}

/* ===================================================================== */
/* Audit trail                                                            */
/* ===================================================================== */

export function AuditPage(): JSX.Element {
  const app = useApp();
  const [q, setQ] = React.useState('');
  const res = useAsync(function () { return app.client.listAudit({ q }); }, [q]);
  return (
    <>
      <Head title="Audit trail" sub="Every action is time-stamped and linked to its application: creation, submission, uploads, status changes, workflow start, approvals, messages and notifications." />
      <div style={{ maxWidth: 360 }}><TextField id="aq" label="Filter" value={q} onChange={setQ} hint="Reference, actor, action or detail" /></div>
      {res.error ? <ErrorNote message={res.error} /> : res.loading ? <Loading /> : <AuditTable entries={(res.data || []).slice(0, 300)} showCase />}
    </>
  );
}

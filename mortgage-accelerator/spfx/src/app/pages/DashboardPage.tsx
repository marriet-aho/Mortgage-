import * as React from 'react';
import { useApp, useAsync } from '../context';
import { BarChart, Funnel, HBars, StackedHBars } from '../components/charts';
import { Button, Chip, ErrorNote, Head, Kpis, Loading, Panel, Section, SlaChip, StateChip, Table } from '../components/ui';
import { MortgageCase, PRODUCT_LABEL } from '../domain/types';
import { compactMoney, money } from '../format';

/** Module 11: operational dashboard for the Mortgage Team and the units around it. */
export function DashboardPage(): JSX.Element {
  const app = useApp();
  const a = useAsync(function () { return app.client.getAnalytics(); });
  const cases = useAsync(function () { return app.client.listCases(); });
  if (a.loading || cases.loading) { return <Loading />; }
  if (a.error || !a.data) { return <ErrorNote message={a.error || 'No data'} />; }
  const s = a.data;
  const now = Date.now();
  const attention = (cases.data || []).filter(function (c) {
    const open = ['CLOSED', 'DECLINED', 'WITHDRAWN', 'EXPIRED', 'DRAFT'].indexOf(c.state) < 0;
    return open && (c.tasks.some(function (t) { return t.status !== 'DONE' && t.status !== 'CANCELLED' && new Date(t.dueAt).getTime() < now; }) || (c.sla && new Date(c.sla.dueAt).getTime() < now) || c.state === 'REFERRED');
  });
  return (
    <>
      <Head title="Mortgage dashboard" sub="Pipeline, turnaround and what needs attention today." actions={s.sample ? <Chip tone="idle">Trend series are illustrative</Chip> : undefined} />
      <Kpis items={s.kpis} />
      <div className="ma-grid-even">
        <Section title="Pipeline by stage"><Panel><Funnel rows={s.funnel.map(function (f) { return { label: f.label, count: f.count, value: 'GHS ' + compactMoney(f.value) }; })} /></Panel></Section>
        <Section title="Applications received"><Panel><BarChart data={s.monthly.map(function (m) { return { label: m.month, a: m.purchase, b: m.equity }; })} aLabel="Home Purchase" bLabel="Home Equity Release" /></Panel></Section>
      </div>
      <div className="ma-grid-even">
        <Section title="Median days in stage against target"><Panel><HBars unit=" d" data={s.stageDays.map(function (d) { return { label: d.stage, value: d.medianDays, target: d.targetDays }; })} /><div className="small muted" style={{ marginTop: 8 }}>The black tick is the target. Orange bars are over target.</div></Panel></Section>
        <Section title="SLA performance by team"><Panel><StackedHBars data={s.slaByTeam.map(function (t) { return { label: t.team, ok: t.onTime, bad: t.breached }; })} /></Panel></Section>
      </div>
      <Section title="Needs attention" aside={attention.length + ' cases'}>
        <Table rowKey={function (c: MortgageCase) { return c.id; }} rows={attention} empty="Nothing is overdue." onRow={function (c) { app.go('/cases/' + c.id); }}
          cols={[
            { head: 'Case', render: function (c) { return <b>{c.ref}</b>; } },
            { head: 'Applicant', render: function (c) { return c.applicant.fullName; } },
            { head: 'Product', render: function (c) { return PRODUCT_LABEL[c.product]; } },
            { head: 'Amount', right: true, render: function (c) { return money(c.amountRequested, c.currency); } },
            { head: 'Status', render: function (c) { return <StateChip state={c.state} />; } },
            { head: 'SLA', render: function (c) { return <SlaChip clock={c.sla} />; } },
            { head: '', render: function (c) { return <Button small onClick={function () { app.go('/cases/' + c.id); }}>Open</Button>; } }
          ]} />
      </Section>
    </>
  );
}

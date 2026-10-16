import * as React from 'react';
import { useAction, useApp, useAsync } from '../context';
import { ConditionsTable, DisbursementPanel, hasRole } from '../components/panels';
import { Button, Chip, ErrorNote, Head, Kpis, Loading, Note, Section, SelectField, SlaChip, StateChip, Table } from '../components/ui';
import { disbursementBlockers, remainingToDisburse } from '../domain/rules';
import { Condition, MortgageCase, PostItem } from '../domain/types';
import { fmtDate, money, title } from '../format';

/* ===================================================================== */
/* Module 10: Conditions Tracker                                          */
/* ===================================================================== */

export function ConditionsPage(): JSX.Element {
  const app = useApp();
  const conds = useAsync(function () { return app.client.listConditions(); });
  const cases = useAsync(function () { return app.client.listCases(); });
  const [status, setStatus] = React.useState('');
  const [view, setView] = React.useState('');
  if (conds.loading || cases.loading) { return <Loading />; }
  if (conds.error) { return <ErrorNote message={conds.error} />; }
  const byCase: { [k: string]: MortgageCase } = {};
  (cases.data || []).forEach(function (c) { byCase[c.id] = c; });
  const all = (conds.data || []).filter(function (x) { return byCase[x.caseId]; });
  const isOpen = function (x: Condition): boolean { return x.status !== 'VERIFIED' && x.status !== 'WAIVED'; };
  const late = function (x: Condition): boolean { return isOpen(x) && new Date(x.dueDate).getTime() < Date.now(); };
  const mine = function (x: Condition): boolean { return app.user.roles.some(function (r) { return r === x.verifierRole || r === x.ownerRole; }); };
  let list = all.filter(function (x) { return !status || x.status === status; });
  if (view === 'late') { list = list.filter(late); }
  if (view === 'mine') { list = list.filter(function (x) { return isOpen(x) && mine(x); }); }
  const readyCases = Object.keys(byCase).filter(function (id) { return byCase[id].state === 'READY_TO_DISBURSE'; }).length;
  return (
    <>
      <Head title="Conditions tracker" sub="Every condition precedent across every case, with its owner, verifier, due date and evidence. Disbursement stays blocked while a mandatory condition is open." />
      <Kpis items={[
        { label: 'Open conditions', value: String(all.filter(isOpen).length) },
        { label: 'Awaiting verification', value: String(all.filter(function (x) { return x.status === 'EVIDENCE_SUBMITTED'; }).length) },
        { label: 'Late', value: String(all.filter(late).length), tone: all.filter(late).length ? 'ALERT' : 'NORMAL' },
        { label: 'Verified', value: String(all.filter(function (x) { return x.status === 'VERIFIED'; }).length) },
        { label: 'Cases ready to disburse', value: String(readyCases) }
      ]} />
      <div className="ma-fgrid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <SelectField id="cs" label="Status" value={status} onChange={setStatus} options={[['OPEN', 'Open'], ['EVIDENCE_SUBMITTED', 'Evidence submitted'], ['VERIFIED', 'Verified'], ['REJECTED', 'Rejected'], ['WAIVED', 'Waived']]} />
        <SelectField id="cv" label="Show" value={view} onChange={setView} options={[['late', 'Late only'], ['mine', 'Waiting on my team']]} />
      </div>
      <ConditionsTable items={list} showCase refFor={function (id) { return byCase[id] ? byCase[id].ref : id; }} />
    </>
  );
}

/* ===================================================================== */
/* Disbursement management                                                */
/* ===================================================================== */

export function DisbursementPage(): JSX.Element {
  const app = useApp();
  const cases = useAsync(function () { return app.client.listCases(); });
  if (cases.loading) { return <Loading />; }
  if (cases.error) { return <ErrorNote message={cases.error} />; }
  const now = new Date();
  const list = (cases.data || []).filter(function (c) { return ['CONDITIONS_PENDING', 'READY_TO_DISBURSE', 'DISBURSED', 'POST_DISBURSEMENT'].indexOf(c.state) >= 0; });
  const selId = app.route.query.case;
  const sel = list.filter(function (c) { return c.id === selId; })[0];
  return (
    <>
      <Head title="Disbursement" sub="The gate, the four-eyes approval, payment and account activation. Nothing is released while a condition is open." />
      {sel ? (
        <>
          <div className="small"><a href="#/disbursement" onClick={function (e) { e.preventDefault(); app.go('/disbursement'); }}>← All cases</a></div>
          <Head title={sel.ref + ' · ' + sel.applicant.fullName} sub={money(sel.approvedAmount || sel.amountRequested, sel.currency) + ' approved · ' + money(remainingToDisburse(sel), sel.currency) + ' left to disburse'} actions={<StateChip state={sel.state} />} />
          <DisbursementPanel c={sel} />
        </>
      ) : (
        <Table rowKey={function (c: MortgageCase) { return c.id; }} rows={list} empty="No cases are at the disbursement stage." onRow={function (c) { app.go('/disbursement?case=' + c.id); }}
          cols={[
            { head: 'Case', render: function (c) { return <b>{c.ref}</b>; } },
            { head: 'Applicant', render: function (c) { return c.applicant.fullName; } },
            { head: 'Approved', right: true, render: function (c) { return money(c.approvedAmount || c.amountRequested, c.currency); } },
            { head: 'Left to disburse', right: true, render: function (c) { return money(remainingToDisburse(c), c.currency); } },
            { head: 'Status', render: function (c) { return <StateChip state={c.state} />; } },
            { head: 'Gate', render: function (c) { const b = disbursementBlockers(c, now); return b.length === 0 ? <Chip tone="dark">Open</Chip> : <Chip tone="orange">{b.length} blocker{b.length > 1 ? 's' : ''}</Chip>; } },
            { head: 'SLA', render: function (c) { return <SlaChip clock={c.sla} />; } }
          ]} />
      )}
    </>
  );
}

/* ===================================================================== */
/* Post-disbursement monitoring                                           */
/* ===================================================================== */

export function PostDisbursementPage(): JSX.Element {
  const app = useApp();
  const act = useAction();
  const items = useAsync(function () { return app.client.listPostItems(); });
  const cases = useAsync(function () { return app.client.listCases(); });
  if (items.loading || cases.loading) { return <Loading />; }
  if (items.error) { return <ErrorNote message={items.error} />; }
  const byCase: { [k: string]: MortgageCase } = {};
  (cases.data || []).forEach(function (c) { byCase[c.id] = c; });
  const list = (items.data || []).filter(function (x) { return byCase[x.caseId]; });
  const days = function (x: PostItem): number { return Math.round((Date.now() - new Date(x.dueDate).getTime()) / 86400000); };
  const open = list.filter(function (x) { return x.status === 'OPEN' || x.status === 'IN_PROGRESS'; });
  const overdue = open.filter(function (x) { return days(x) > 0; });
  const bucket = function (lo: number, hi: number): number { return overdue.filter(function (x) { return days(x) >= lo && days(x) <= hi; }).length; };
  const canUpdate = hasRole(app.user.roles, 'POST_DISBURSEMENT', 'LEGAL');
  const sorted = list.slice().sort(function (a, b) { return a.dueDate.localeCompare(b.dueDate); });
  return (
    <>
      <Head title="Post-disbursement monitoring" sub="Mortgage registration, security perfection, Lands Commission registration, title perfection and safe custody, each with an owner and a due date." />
      <Kpis items={[
        { label: 'Open items', value: String(open.length) },
        { label: 'Overdue', value: String(overdue.length), tone: overdue.length ? 'ALERT' : 'NORMAL' },
        { label: '1 to 30 days late', value: String(bucket(1, 30)) },
        { label: '31 to 60 days late', value: String(bucket(31, 60)) },
        { label: 'More than 60 days late', value: String(bucket(61, 9999)), tone: bucket(61, 9999) ? 'ALERT' : 'NORMAL' }
      ]} />
      {overdue.length ? <Note tone="need"><b>{overdue.length} item{overdue.length > 1 ? 's are' : ' is'} past due.</b> Alerts have gone to the owner, their supervisor and the Mortgage Team.</Note> : null}
      <Section title="Items">
        <Table rowKey={function (x: PostItem) { return x.id; }} rows={sorted} empty="Nothing to monitor yet."
          cols={[
            { head: 'Case', render: function (x) { const c = byCase[x.caseId]; return <a href={'#/cases/' + x.caseId}>{c.ref}</a>; } },
            { head: 'Applicant', render: function (x) { return byCase[x.caseId].applicant.fullName; } },
            { head: 'Item', render: function (x) { return <b>{title(x.type)}</b>; } },
            { head: 'Owner', render: function (x) { return x.owner || '—'; } },
            { head: 'Due', render: function (x) { const d = days(x); return <span>{fmtDate(x.dueDate)} {(x.status === 'OPEN' || x.status === 'IN_PROGRESS') && d > 0 ? <Chip tone="solid">{d} days late</Chip> : (x.status === 'OPEN') && d > -14 ? <Chip tone="orange">Due soon</Chip> : null}</span>; } },
            { head: 'Status', render: function (x) { return <Chip tone={x.status === 'DONE' ? 'dark' : x.status === 'IN_PROGRESS' ? 'orange' : 'idle'}>{title(x.status)}</Chip>; } },
            { head: '', render: function (x) {
              if (!canUpdate || x.status === 'DONE' || x.status === 'WAIVED') { return null; }
              return <span className="ma-row" style={{ gap: 6 }}>{x.status === 'OPEN' ? <Button small onClick={function () { void act(function () { return app.client.updatePostItem(x.id, 'IN_PROGRESS'); }, 'Marked in progress.'); }}>Start</Button> : null}<Button small primary onClick={function () { void act(function () { return app.client.updatePostItem(x.id, 'DONE'); }, title(x.type) + ' complete.'); }}>Mark done</Button></span>;
            } }
          ]} />
      </Section>
    </>
  );
}

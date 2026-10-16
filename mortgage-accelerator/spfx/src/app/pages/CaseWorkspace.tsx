import * as React from 'react';
import { useAction, useApp, useAsync } from '../context';
import {
  ApprovalsPanel,
  AuditTable,
  ConditionsTable,
  DisbursementPanel,
  DocumentsPanel,
  ReadinessPanel,
  ThreadView,
  TrackingPanel,
  hasRole
} from '../components/panels';
import { Button, Chip, ErrorNote, Head, Loading, Note, Panel, Section, SlaChip, StateChip, Table, Tabs } from '../components/ui';
import { escalationLevel } from '../domain/rules';
import { MortgageCase, PRODUCT_LABEL, PURPOSE_LABEL, Task } from '../domain/types';
import { fmtDate, fmtDateTime, money, title } from '../format';
import { PropertyBlock } from './PropertiesPage';

const TABS = ['summary', 'forms', 'documents', 'tasks', 'approvals', 'property', 'conditions', 'disbursement', 'collaboration', 'audit'];

export function CaseWorkspace(p: { id: string }): JSX.Element {
  const app = useApp();
  const act = useAction();
  const res = useAsync(function () { return app.client.getCase(p.id); }, [p.id]);
  const tab = TABS.indexOf(app.route.query.tab) >= 0 ? app.route.query.tab : 'summary';
  if (res.loading) { return <Loading />; }
  if (res.error || !res.data) { return <ErrorNote message={res.error || 'Case not found'} />; }
  const c = res.data;
  const roles = app.user.roles;
  const isApplicant = roles.indexOf('APPLICANT') >= 0;
  const openTasks = c.tasks.filter(function (t) { return t.status !== 'DONE' && t.status !== 'CANCELLED'; });
  const conditionsOpen = c.conditions.filter(function (x) { return x.status !== 'VERIFIED' && x.status !== 'WAIVED'; }).length;

  const setTab = function (id: string): void { app.go('/cases/' + c.id + '?tab=' + id); };

  const actions: JSX.Element[] = [];
  if (isApplicant && c.state === 'PRE_APPROVED') {
    actions.push(<Button key="go" primary onClick={function () { void act(function () { return app.client.confirmProceed(c.id); }, 'Confirmed. Valuation, legal searches and credit assessment have started in parallel.'); }}>Confirm and proceed</Button>);
  }
  if (isApplicant && c.state === 'OFFER_ISSUED') {
    actions.push(<Button key="offer" primary onClick={function () { void act(function () { return app.client.acceptOffer(c.id); }, 'Offer accepted. Your conditions are now being tracked.'); }}>Sign and accept offer</Button>);
  }
  if (isApplicant && c.state === 'DRAFT') {
    actions.push(<Button key="cont" primary onClick={function () { app.go('/apply/' + (c.product === 'HOME_PURCHASE' ? 'purchase' : 'equity')); }}>Continue application</Button>);
  }
  if (isApplicant && c.returnedNote && !c.locked) {
    actions.push(<Button key="edit" primary onClick={function () { app.go('/apply/' + (c.product === 'HOME_PURCHASE' ? 'purchase' : 'equity') + '/' + c.id); }}>Correct and resubmit</Button>);
  }
  if (hasRole(roles, 'MORTGAGE_OFFICER', 'MORTGAGE_LEAD') && c.locked && ['DISBURSED', 'POST_DISBURSEMENT', 'CLOSED', 'DECLINED', 'WITHDRAWN'].indexOf(c.state) < 0) {
    actions.push(<Button key="ret" onClick={function () { const note = window.prompt ? window.prompt('What should the applicant correct?') : 'Please review'; if (note) { void act(function () { return app.client.returnCase(c.id, note); }, 'Returned to the applicant. The record is unlocked for editing.'); } }}>Return for correction</Button>);
  }
  if ((isApplicant || hasRole(roles, 'MORTGAGE_LEAD')) && ['SUBMITTED', 'PRE_APPROVAL', 'REFERRED', 'PRE_APPROVED', 'IN_ASSESSMENT'].indexOf(c.state) >= 0) {
    actions.push(<Button key="wd" onClick={function () { const why = window.prompt ? window.prompt('Reason for withdrawing') : 'Withdrawn'; if (why) { void act(function () { return app.client.withdrawCase(c.id, why); }, 'Application withdrawn.'); } }}>Withdraw</Button>);
  }

  return (
    <>
      <div className="small"><a href="#/cases" onClick={function (e) { e.preventDefault(); app.go('/cases'); }}>← All cases</a></div>
      <Head title={c.ref + ' · ' + c.applicant.fullName}
        sub={PRODUCT_LABEL[c.product] + ' · ' + money(c.amountRequested, c.currency) + ' over ' + c.tenorYears + ' years · case owner ' + c.ownerName}
        actions={<><StateChip state={c.state} /><SlaChip clock={c.sla} />{actions}</>} />
      {c.returnedNote ? <Note tone="need"><b>Returned for correction.</b> {c.returnedNote}</Note> : null}
      {c.state === 'DECLINED' ? <Note tone="need"><b>Not taken forward.</b> {c.declineReason}</Note> : null}
      <Tabs active={tab} onChange={setTab} tabs={[
        { id: 'summary', label: 'Summary' }, { id: 'forms', label: 'Forms' }, { id: 'documents', label: 'Documents' },
        { id: 'tasks', label: 'Tasks', count: openTasks.length }, { id: 'approvals', label: 'Approvals' }, { id: 'property', label: 'Property and valuation' },
        { id: 'conditions', label: 'Conditions', count: conditionsOpen }, { id: 'disbursement', label: 'Disbursement' },
        { id: 'collaboration', label: 'Collaboration' }, { id: 'audit', label: 'Audit' }
      ]} />
      {tab === 'summary' ? <SummaryTab c={c} /> : null}
      {tab === 'forms' ? <FormsTab c={c} /> : null}
      {tab === 'documents' ? <DocumentsPanel c={c} canUpload={isApplicant ? !c.locked || !!c.returnedNote || c.state !== 'DRAFT' : hasRole(roles, 'MORTGAGE_OFFICER', 'MORTGAGE_LEAD', 'CREDIT', 'LEGAL', 'COLLATERAL', 'CREDIT_ADMIN')} canRequest={!isApplicant && hasRole(roles, 'MORTGAGE_OFFICER', 'MORTGAGE_LEAD', 'CREDIT', 'LEGAL', 'COLLATERAL', 'CREDIT_ADMIN', 'HR')} /> : null}
      {tab === 'tasks' ? <TasksTab c={c} /> : null}
      {tab === 'approvals' ? <ApprovalsPanel c={c} /> : null}
      {tab === 'property' ? <PropertyTab c={c} /> : null}
      {tab === 'conditions' ? (c.conditions.length ? <ConditionsTable items={c.conditions} /> : <Note>Conditions precedent are created when the offer is issued.</Note>) : null}
      {tab === 'disbursement' ? <DisbursementPanel c={c} /> : null}
      {tab === 'collaboration' ? <CollabTab c={c} /> : null}
      {tab === 'audit' ? <AuditTab id={c.id} /> : null}
    </>
  );
}

function SummaryTab(p: { c: MortgageCase }): JSX.Element {
  const c = p.c;
  const app = useApp();
  const ready = useAsync(function () { return app.client.getReadiness(c.id); }, [c.id, c.state]);
  const f = c.financials;
  return (
    <div className="ma-grid2">
      <div className="ma-stack">
        {ready.data ? <ReadinessPanel result={c.readiness && c.state !== 'DRAFT' ? c.readiness : ready.data} /> : <Loading />}
        <Panel title="Key facts">
          <div className="ma-fgrid">
            <Fact label="Applicant">{c.applicant.fullName} · {c.applicant.employeeNo}</Fact>
            <Fact label="Department">{c.applicant.department} · {c.applicant.position}</Fact>
            <Fact label="Net monthly income">{ready.data ? money(ready.data.netIncome, c.currency) : '—'}</Fact>
            <Fact label="Existing monthly obligations">{money(f.existingLoanRepayments + f.otherCommitments, c.currency)}</Fact>
            {c.purchase ? <><Fact label="Purchase price">{money(c.purchase.purchasePrice, c.currency)}</Fact><Fact label="Down payment">{money(c.purchase.downPayment, c.currency)} ({c.purchase.purchasePrice ? ((c.purchase.downPayment / c.purchase.purchasePrice) * 100).toFixed(1) : 0}%)</Fact><Fact label="Vendor">{c.purchase.vendorName} · {title(c.purchase.vendorType)}</Fact></> : null}
            {c.equity ? <><Fact label="Purpose">{PURPOSE_LABEL[c.equity.purpose]}</Fact><Fact label="Forced sale value">{c.equity.forcedSaleValue ? money(c.equity.forcedSaleValue, c.currency) : 'Awaiting valuation'}</Fact><Fact label="Existing mortgage">{title(c.equity.existingMortgageStatus)} · {money(c.equity.existingMortgageBalance, c.currency)}</Fact></> : null}
            <Fact label="Approved amount">{c.approvedAmount ? money(c.approvedAmount, c.currency) : '—'}</Fact>
          </div>
        </Panel>
      </div>
      <div className="ma-stack">
        <TrackingPanel c={c} />
        <Panel title="SLA">
          <div className="ma-row" style={{ justifyContent: 'space-between' }}><span>{c.sla ? c.sla.label : 'No active clock'}</span><SlaChip clock={c.sla} /></div>
          {c.sla ? <div className="small muted" style={{ marginTop: 4 }}>{c.sla.code} · due {fmtDateTime(c.sla.dueAt)}</div> : null}
        </Panel>
      </div>
    </div>
  );
}

function Fact(p: { label: string; children?: React.ReactNode }): JSX.Element {
  return <div className="ma-f"><span className="small muted">{p.label}</span><span>{p.children}</span></div>;
}

function FormsTab(p: { c: MortgageCase }): JSX.Element {
  const c = p.c;
  const a = c.applicant;
  const rows: Array<[string, string]> = [
    ['A. Personal', a.fullName + ' · ' + a.employeeNo + ' · ' + a.nationalId + ' · ' + a.phone + ' · ' + a.email + ' · ' + a.address + ' · ' + title(a.maritalStatus)],
    ['B. Employment', a.staffId + ' · ' + a.department + ' · ' + a.position + ' · ' + title(a.employmentStatus) + ' · employed ' + fmtDate(a.dateEmployed) + ' · retires ' + fmtDate(a.retirementDate)],
    ['C. Request', PRODUCT_LABEL[c.product] + ' · ' + money(c.amountRequested, c.currency) + ' · ' + c.tenorYears + ' years at ' + c.ratePct + '%'],
    ['F. Financial', 'Basic ' + money(c.financials.basicSalary) + ' · allowances ' + money(c.financials.allowances) + ' · deductions ' + money(c.financials.deductions) + ' · loans ' + money(c.financials.existingLoanRepayments) + ' · other ' + money(c.financials.otherCommitments)],
    ['G. Assets and liabilities', 'Assets ' + money(c.financials.assetsTotal) + ' · liabilities ' + money(c.financials.liabilitiesTotal) + ' · net worth ' + money(c.financials.assetsTotal - c.financials.liabilitiesTotal)],
    ['C. Consent', c.consent.signedAt ? 'Signed ' + fmtDateTime(c.consent.signedAt) + ' by ' + c.consent.signedBy : 'Not yet signed']
  ];
  if (c.purchase) {
    rows.push(['E. Property and vendor', money(c.purchase.purchasePrice) + ' · ' + c.purchase.vendorName + ' (' + title(c.purchase.vendorType) + ') · ' + title(c.purchase.constructionStatus)]);
  }
  if (c.equity) {
    rows.push(['H. Equity release', 'Declared value ' + money(c.equity.declaredValue) + ' · purpose ' + PURPOSE_LABEL[c.equity.purpose] + ' · ownership ' + title(c.equity.ownership)]);
    rows.push(['I. Request letter', c.equity.useOfFunds.map(function (u) { return u.item + ' ' + money(u.amount); }).join(', ') || '—']);
  }
  return (
    <div className="ma-stack">
      {c.locked ? <Note>Submitted {fmtDateTime(c.submittedAt)}. The forms are locked unless the case is returned for correction.</Note> : null}
      <Table rowKey={function (r: [string, string]) { return r[0]; }} rows={rows} cols={[{ head: 'Form', render: function (r) { return <b>{r[0]}</b>; } }, { head: 'Captured', render: function (r) { return r[1]; } }]} />
    </div>
  );
}

function TasksTab(p: { c: MortgageCase }): JSX.Element {
  const app = useApp();
  const act = useAction();
  const tasks = useAsync(function () { return app.client.listTasks({ caseId: p.c.id }); }, [p.c.id]);
  if (tasks.loading) { return <Loading />; }
  const now = new Date();
  return (
    <Table rowKey={function (t: Task) { return t.id; }} rows={tasks.data || []} empty="No tasks."
      cols={[
        { head: 'Task', render: function (t) { return <b>{t.title}</b>; } },
        { head: 'Team', render: function (t) { return title(t.ownerTeam); } },
        { head: 'Status', render: function (t) { return <Chip tone={t.status === 'DONE' ? 'dark' : t.status === 'WAITING_APPLICANT' ? 'idle' : 'orange'}>{title(t.status)}</Chip>; } },
        { head: 'Due', render: function (t) { const lvl = t.status === 'DONE' ? 0 : escalationLevel(t.dueAt, now, 8); return <span>{fmtDateTime(t.dueAt)} {lvl ? <Chip tone="solid">{lvl === 1 ? 'Escalated: supervisor' : 'Escalated: unit head'}</Chip> : null}</span>; } },
        { head: '', render: function (t) {
          const mine = app.user.roles.indexOf(t.ownerTeam) >= 0 || app.user.roles.indexOf('ADMIN') >= 0;
          if (t.status === 'DONE' || t.status === 'CANCELLED' || !mine || t.id.indexOf(':') >= 0 || t.ownerTeam === 'APPLICANT') { return null; }
          return <Button small primary onClick={function () { void act(function () { return app.client.completeTask(t.id, t.title.indexOf('Credit review') === 0 ? 'APPROVE' : 'DONE'); }, 'Task completed.'); }}>Complete</Button>;
        } }
      ]} />
  );
}

function PropertyTab(p: { c: MortgageCase }): JSX.Element {
  const app = useApp();
  const props = useAsync(function () { return app.client.listProperties(); });
  const vals = useAsync(function () { return app.client.listValuations(); });
  if (props.loading || vals.loading) { return <Loading />; }
  const prop = (props.data || []).filter(function (x) { return x.id === p.c.propertyId; })[0];
  const val = (vals.data || []).filter(function (x) { return x.caseId === p.c.id; })[0];
  if (!prop) { return <Note>The property is linked when the applicant confirms to proceed after pre-approval.</Note>; }
  return (
    <div className="ma-stack">
      <PropertyBlock prop={prop} />
      <Section title="Valuation">
        {val ? (
          <Panel>
            <div className="ma-row" style={{ justifyContent: 'space-between' }}><b>{val.id}</b><Chip tone={val.status === 'ACCEPTED' ? 'dark' : 'orange'}>{title(val.status)}</Chip></div>
            {val.report ? <div className="ma-fgrid" style={{ marginTop: 10 }}><Fact label="Market value">{money(val.report.marketValue)}</Fact><Fact label="Forced sale value">{money(val.report.forcedSaleValue)}</Fact><Fact label="Valuation date">{fmtDate(val.report.valuationDate)}</Fact><Fact label="Condition">{val.report.condition} · {val.report.occupancy}</Fact></div> : <div className="small muted" style={{ marginTop: 6 }}>Report due {fmtDate(val.dueAt)}.</div>}
            <div style={{ marginTop: 10 }}><Button small onClick={function () { app.go('/valuations?id=' + val.id); }}>Open in valuations</Button> <Button small onClick={function () { app.go('/fit-to-lend/' + p.c.id); }}>Open fit-to-lend</Button></div>
          </Panel>
        ) : <Note>No valuation requested yet.</Note>}
      </Section>
    </div>
  );
}

function CollabTab(p: { c: MortgageCase }): JSX.Element {
  const app = useApp();
  const threads = useAsync(function () { return app.client.listThreads(p.c.id); }, [p.c.id]);
  const [topic, setTopic] = React.useState('GENERAL');
  if (threads.loading) { return <Loading />; }
  const list = threads.data || [];
  const cur = list.filter(function (t) { return t.topic === topic; })[0] || list[0];
  if (!cur) { return <Note>Threads open when the application is submitted.</Note>; }
  void app;
  return (
    <div className="ma-stack">
      <div className="ma-row">{list.map(function (t) {
        const open = t.messages.filter(function (m) { return m.kind === 'REQUEST' && !m.closed; }).length;
        return <Button key={t.id} small primary={t.topic === cur.topic} onClick={function () { setTopic(t.topic); }}>{title(t.topic)}{open ? ' (' + open + ')' : ''}</Button>;
      })}</div>
      <ThreadView thread={cur} />
    </div>
  );
}

function AuditTab(p: { id: string }): JSX.Element {
  const app = useApp();
  const res = useAsync(function () { return app.client.listAudit({ caseId: p.id }); }, [p.id]);
  if (res.loading) { return <Loading />; }
  return <AuditTable entries={res.data || []} />;
}

import * as React from 'react';
import { useApp, useAsync } from '../context';
import { NAV, allowed } from '../nav';
import { Button, Chip, ErrorNote, Head, Kpis, Loading, Note, Panel, Section, SlaChip, StateChip, Table } from '../components/ui';
import { ConditionsTable } from '../components/panels';
import { MortgageCase, PRODUCT_LABEL, Task } from '../domain/types';
import { fmtDateTime, money } from '../format';

export function HomePage(): JSX.Element {
  const app = useApp();
  const isApplicant = app.user.roles.indexOf('APPLICANT') >= 0;
  return isApplicant ? <ApplicantHome /> : <StaffHome />;
}

function ApplicantHome(): JSX.Element {
  const app = useApp();
  const cases = useAsync(function () { return app.client.listCases(); });
  const tasks = useAsync(function () { return app.client.listTasks({ role: 'APPLICANT', open: true }); });
  const threads = useAsync(function () { return app.client.listThreads(); });
  if (cases.loading) { return <Loading />; }
  if (cases.error) { return <ErrorNote message={cases.error} />; }
  const mine = cases.data || [];
  const mineIds = mine.map(function (c) { return c.id; });
  const myTasks = (tasks.data || []).filter(function (t) { return mineIds.indexOf(t.caseId) >= 0; });
  const openReq = (threads.data || []).reduce(function (n, t) { return n + t.messages.filter(function (m) { return m.kind === 'REQUEST' && !m.closed; }).length; }, 0);
  const name = app.user.displayName.split(' ')[0];
  return (
    <>
      <Head title={'Welcome, ' + name} sub="Start a mortgage, check your readiness, and follow every step of your application here." />
      {myTasks.length + openReq > 0 ? (
        <Note tone="need">
          <b>Needs you</b>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {myTasks.map(function (t) { return <li key={t.id}>{t.title} · <a href={'#/cases/' + t.caseId}>open</a></li>; })}
            {openReq > 0 ? <li>{openReq} request{openReq > 1 ? 's' : ''} from the team · <a href="#/hub">open the hub</a></li> : null}
          </ul>
        </Note>
      ) : null}
      <Section title="Your applications">
        <Table rowKey={function (c: MortgageCase) { return c.id; }} rows={mine} empty="You have no applications yet." onRow={function (c) { app.go(c.state === 'DRAFT' ? '/apply/' + (c.product === 'HOME_PURCHASE' ? 'purchase' : 'equity') : '/cases/' + c.id); }}
          cols={[
            { head: 'Reference', render: function (c) { return <b>{c.ref}</b>; } },
            { head: 'Product', render: function (c) { return PRODUCT_LABEL[c.product]; } },
            { head: 'Amount', right: true, render: function (c) { return c.amountRequested ? money(c.amountRequested, c.currency) : '—'; } },
            { head: 'Status', render: function (c) { return <StateChip state={c.state} />; } },
            { head: 'Time left', render: function (c) { return <SlaChip clock={c.sla} />; } },
            { head: 'Updated', render: function (c) { return fmtDateTime(c.updatedAt); } }
          ]} />
      </Section>
      <Section title="Start a new mortgage">
        <div className="ma-cards">
          <div className="ma-card act"><h3>Home Purchase Mortgage</h3><p className="small muted">Buy a completed or under-construction property from a developer or a private vendor.</p><div className="ma-row"><Button primary onClick={function () { app.go('/apply/purchase'); }}>Start application</Button><Button onClick={function () { app.go('/purchase'); }}>Learn more</Button></div></div>
          <div className="ma-card act"><h3>Home Equity Release</h3><p className="small muted">Release up to 70% of your property’s forced sale value for renovation, medical, family or tuition needs.</p><div className="ma-row"><Button primary onClick={function () { app.go('/apply/equity'); }}>Start application</Button><Button onClick={function () { app.go('/equity'); }}>Learn more</Button></div></div>
          <div className="ma-card"><h3>Check my readiness</h3><p className="small muted">Try figures and see whether you would pre-approve, and what to fix, before you apply.</p><div><Button onClick={function () { app.go('/readiness'); }}>Open readiness check</Button></div></div>
        </div>
      </Section>
    </>
  );
}

function StaffHome(): JSX.Element {
  const app = useApp();
  const roles = app.user.roles;
  const role = roles[0];
  const tasks = useAsync(function () { return app.client.listTasks({ role, open: true }); }, [role]);
  const cases = useAsync(function () { return app.client.listCases(); });
  const analytics = useAsync(function () { return app.client.getAnalytics(); });
  const byId: { [k: string]: MortgageCase } = {};
  (cases.data || []).forEach(function (c) { byId[c.id] = c; });
  const now = Date.now();
  const mine = (tasks.data || []).slice().sort(function (a, b) { return a.dueAt.localeCompare(b.dueAt); });
  const modules = NAV.filter(function (n) { return n.module && allowed(n, roles); });
  return (
    <>
      <Head title={'Hello, ' + app.user.displayName.split(' ')[0]} sub="Your queue is first. Everything else you can open is below." />
      {analytics.data ? <Kpis items={analytics.data.kpis.slice(0, 5)} /> : null}
      <Section title="My queue" aside={mine.length + ' open'}>
        <Table rowKey={function (t: Task) { return t.id; }} rows={mine} empty="Nothing waiting for your team." onRow={function (t) { app.go('/cases/' + t.caseId); }}
          cols={[
            { head: 'Task', render: function (t) { return <b>{t.title}</b>; } },
            { head: 'Case', render: function (t) { const c = byId[t.caseId]; return c ? c.ref + ' · ' + c.applicant.fullName : t.caseId; } },
            { head: 'Product', render: function (t) { const c = byId[t.caseId]; return c ? PRODUCT_LABEL[c.product] : ''; } },
            { head: 'Due', render: function (t) { const late = new Date(t.dueAt).getTime() < now; return <span>{fmtDateTime(t.dueAt)} {late ? <Chip tone="solid">Overdue</Chip> : null}</span>; } }
          ]} />
      </Section>
      <Section title="Conditions needing attention">
        <PendingConditions />
      </Section>
      <Section title="Modules">
        <div className="ma-cards">
          {modules.map(function (n) {
            return (
              <div key={n.path} className="ma-card">
                <div className="small muted">Module {n.module}</div>
                <h3>{n.label}</h3>
                <div><Button small onClick={function () { app.go(n.path); }}>Open</Button></div>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}

function PendingConditions(): JSX.Element {
  const app = useApp();
  const conds = useAsync(function () { return app.client.listConditions(); });
  const cases = useAsync(function () { return app.client.listCases(); });
  if (conds.loading || cases.loading) { return <Loading />; }
  const refs: { [k: string]: string } = {};
  (cases.data || []).forEach(function (c) { refs[c.id] = c.ref; });
  const mine = (conds.data || []).filter(function (x) { return x.status === 'EVIDENCE_SUBMITTED' || (x.status !== 'VERIFIED' && x.status !== 'WAIVED' && new Date(x.dueDate).getTime() < Date.now()); });
  return <ConditionsTable items={mine.slice(0, 8)} showCase refFor={function (id) { return refs[id] || id; }} />;
}

export { Panel };

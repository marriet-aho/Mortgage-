import * as React from 'react';
import { useAction, useApp, useAsync } from '../context';
import { hasRole } from '../components/panels';
import { Button, CheckField, Chip, ErrorNote, Head, Kpis, Loading, Note, NumberField, Panel, Section, SelectField, SlaChip, Table, TextArea, TextField } from '../components/ui';
import { fitToLendBlockers, maxEquityRelease } from '../domain/rules';
import { MortgageCase, Property, ValuationRequest, Valuer } from '../domain/types';
import { fmtDate, money, title } from '../format';

/* ===================================================================== */
/* Module 7: Valuation Management                                         */
/* ===================================================================== */

export function ValuationsPage(): JSX.Element {
  const app = useApp();
  const vals = useAsync(function () { return app.client.listValuations(); });
  const valuers = useAsync(function () { return app.client.listValuers(); });
  const cases = useAsync(function () { return app.client.listCases(); });
  if (vals.loading || valuers.loading || cases.loading) { return <Loading />; }
  if (vals.error) { return <ErrorNote message={vals.error} />; }
  const refs: { [k: string]: MortgageCase } = {};
  (cases.data || []).forEach(function (c) { refs[c.id] = c; });
  const list = (vals.data || []).filter(function (v) { return refs[v.caseId]; });
  const selId = app.route.query.id;
  const sel = list.filter(function (v) { return v.id === selId; })[0];
  const open = list.filter(function (v) { return v.status !== 'ACCEPTED' && v.status !== 'REJECTED'; });
  const overdue = open.filter(function (v) { return new Date(v.dueAt).getTime() < Date.now(); });
  const done = list.filter(function (v) { return v.report && v.assignedAt; });
  const avg = done.length ? done.reduce(function (s, v) { return s + (new Date(v.report ? v.report.valuationDate : v.dueAt).getTime() - new Date(v.assignedAt || v.requestedAt).getTime()) / 86400000; }, 0) / done.length : 0;

  if (sel) {
    return <ValuationDetail v={sel} c={refs[sel.caseId]} valuers={valuers.data || []} />;
  }
  return (
    <>
      <Head title="Valuation management" sub="Requests from Form D, panel valuer assignment, report capture, review and acceptance. The forced sale value from here drives the 70% equity release cap." />
      <Kpis items={[
        { label: 'Open requests', value: String(open.length) },
        { label: 'Overdue', value: String(overdue.length), tone: overdue.length ? 'ALERT' : 'NORMAL' },
        { label: 'Reports to review', value: String(list.filter(function (v) { return v.status === 'REPORT_RECEIVED' || v.status === 'UNDER_REVIEW'; }).length) },
        { label: 'Average turnaround', value: avg ? avg.toFixed(1) + ' d' : '—', hint: 'Target 5 days' }
      ]} />
      <Section title="Requests">
        <Table rowKey={function (v: ValuationRequest) { return v.id; }} rows={list} empty="No valuation requests." onRow={function (v) { app.go('/valuations?id=' + v.id); }}
          cols={[
            { head: 'Request', render: function (v) { return <b>{v.id}</b>; } },
            { head: 'Case', render: function (v) { const c = refs[v.caseId]; return c.ref + ' · ' + c.applicant.fullName; } },
            { head: 'Valuer', render: function (v) { const x = (valuers.data || []).filter(function (r) { return r.id === v.valuerId; })[0]; return x ? x.firm : <Chip tone="orange">Not assigned</Chip>; } },
            { head: 'Status', render: function (v) { return <Chip tone={v.status === 'ACCEPTED' ? 'dark' : v.status === 'REVALUATION' ? 'solid' : 'orange'}>{title(v.status)}</Chip>; } },
            { head: 'Due', render: function (v) { const late = new Date(v.dueAt).getTime() < Date.now() && v.status !== 'ACCEPTED'; return <span>{fmtDate(v.dueAt)} {late ? <Chip tone="solid">Late</Chip> : null}</span>; } },
            { head: 'Value', right: true, render: function (v) { return v.report ? money(v.report.marketValue) : '—'; } },
            { head: 'FSV', right: true, render: function (v) { return v.report ? money(v.report.forcedSaleValue) : '—'; } }
          ]} />
      </Section>
      <Section title="Valuer panel">
        <Table rowKey={function (v: Valuer) { return v.id; }} rows={valuers.data || []}
          cols={[
            { head: 'Firm', render: function (v) { return <b>{v.firm}</b>; } },
            { head: 'Registration', render: function (v) { return v.registrationNo; } },
            { head: 'Areas', render: function (v) { return v.areas.join(', '); } },
            { head: 'Open jobs', right: true, render: function (v) { return v.openJobs + ' of ' + v.maxJobs; } },
            { head: 'Average turnaround', right: true, render: function (v) { return v.avgTurnaroundDays + ' days'; } }
          ]} />
      </Section>
    </>
  );
}

function ValuationDetail(p: { v: ValuationRequest; c: MortgageCase; valuers: Valuer[] }): JSX.Element {
  const app = useApp();
  const act = useAction();
  const v = p.v, c = p.c;
  const roles = app.user.roles;
  const [valuerId, setValuerId] = React.useState(v.valuerId || '');
  const [mv, setMv] = React.useState(0);
  const [fsv, setFsv] = React.useState(0);
  const [date, setDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [cond, setCond] = React.useState('Good');
  const [occ, setOcc] = React.useState('Vacant');
  const [note, setNote] = React.useState('');
  const price = c.purchase ? c.purchase.purchasePrice : c.equity ? c.equity.declaredValue : 0;
  const r = v.report;
  const vs = r && price ? ((r.marketValue - price) / price) * 100 : 0;
  const fsvRatio = r && r.marketValue ? (r.forcedSaleValue / r.marketValue) * 100 : 0;
  const maxRel = r && c.equity ? maxEquityRelease(r.forcedSaleValue, c.equity.existingMortgageBalance) : 0;
  return (
    <>
      <div className="small"><a href="#/valuations" onClick={function (e) { e.preventDefault(); app.go('/valuations'); }}>← All valuations</a></div>
      <Head title={v.id + ' · ' + c.ref} sub={c.applicant.fullName + ' · ' + (c.purchase ? 'Home Purchase' : 'Equity Release')} actions={<><Chip tone={v.status === 'ACCEPTED' ? 'dark' : 'orange'}>{title(v.status)}</Chip><span className="small muted">Due {fmtDate(v.dueAt)}</span></>} />
      <div className="ma-grid-even">
        <Panel title="Request (Form D)">
          <div className="ma-fgrid">
            <div className="ma-f"><span className="small muted">Contact person</span><span>{v.contactPerson}</span></div>
            <div className="ma-f"><span className="small muted">Contact number</span><span>{v.contactNumber}</span></div>
            <div className="ma-f wide"><span className="small muted">Property</span><span>{c.applicant.address}</span></div>
            <div className="ma-f"><span className="small muted">{c.purchase ? 'Purchase price' : 'Declared value'}</span><span>{money(price)}</span></div>
            <div className="ma-f"><span className="small muted">Requested</span><span>{money(c.amountRequested)}</span></div>
          </div>
        </Panel>
        <Panel title="Assignment">
          {hasRole(roles, 'COLLATERAL') && (v.status === 'REQUESTED' || v.status === 'REVALUATION') ? (
            <div className="ma-stack">
              <SelectField id="vl" label="Panel valuer" value={valuerId} onChange={setValuerId} options={p.valuers.map(function (x) { return [x.id, x.firm + ' · ' + x.openJobs + '/' + x.maxJobs + ' jobs' + (x.openJobs >= x.maxJobs ? ' (full)' : '')] as [string, string]; })} hint="Chosen by area, capacity and conflict declarations." />
              <div><Button primary disabled={!valuerId} onClick={function () { void act(function () { return app.client.assignValuer(v.id, valuerId); }, 'Valuer assigned. The SLA clock is running.'); }}>Assign valuer</Button></div>
            </div>
          ) : <div>{(p.valuers.filter(function (x) { return x.id === v.valuerId; })[0] || { firm: 'Not assigned' }).firm}<div className="small muted">{v.assignedAt ? 'Assigned ' + fmtDate(v.assignedAt) : ''}</div></div>}
        </Panel>
      </div>
      {r ? (
        <Section title="Report">
          <div className="ma-calc" style={{ marginBottom: 12 }}>
            <div><b>{money(r.marketValue)}</b><span>Market value</span></div>
            <div><b>{money(r.forcedSaleValue)}</b><span>Forced sale value ({fsvRatio.toFixed(0)}% of market)</span></div>
            <div className={Math.abs(vs) > 10 ? 'warn' : ''}><b>{vs >= 0 ? '+' : ''}{vs.toFixed(1)}%</b><span>Value against {c.purchase ? 'price' : 'declared value'}</span></div>
            {c.equity ? <div className={c.amountRequested > maxRel ? 'warn' : ''}><b>{money(maxRel)}</b><span>Maximum release (70% of FSV less existing mortgage)</span></div> : null}
          </div>
          <div className="ma-fgrid"><div className="ma-f"><span className="small muted">Valuation date</span><span>{fmtDate(r.valuationDate)}</span></div><div className="ma-f"><span className="small muted">Condition and occupancy</span><span>{r.condition} · {r.occupancy}</span></div></div>
          {Math.abs(vs) > 10 ? <div style={{ marginTop: 10 }}><Note tone="need">Value differs from {c.purchase ? 'the price' : 'the declared value'} by more than 10%. A second review is recommended.</Note></div> : null}
          {c.equity && c.amountRequested > maxRel ? <div style={{ marginTop: 10 }}><Note tone="need">The request of {money(c.amountRequested)} is above the 70% cap. The applicant must reduce it to {money(maxRel)} or less.</Note></div> : null}
          {hasRole(roles, 'COLLATERAL') && (v.status === 'REPORT_RECEIVED' || v.status === 'UNDER_REVIEW') ? (
            <div className="ma-stack" style={{ marginTop: 12 }}>
              <TextArea id="vr-note" label="Review note" value={note} onChange={setNote} />
              <div className="ma-row"><Button primary onClick={function () { void act(function () { return app.client.reviewValuation(v.id, 'ACCEPTED', note); }, 'Valuation accepted.'); }}>Accept report</Button><Button onClick={function () { void act(function () { return app.client.reviewValuation(v.id, 'RETURNED', note); }, 'Returned to the valuer for revaluation.'); }}>Return to valuer</Button></div>
            </div>
          ) : null}
        </Section>
      ) : null}
      {!r && (hasRole(roles, 'VALUER', 'COLLATERAL')) && v.valuerId ? (
        <Section title="Submit the report">
          <div className="ma-fgrid">
            <NumberField id="vr-mv" label="Market value" required value={mv} onChange={setMv} />
            <NumberField id="vr-fsv" label="Forced sale value" required value={fsv} onChange={setFsv} hint="Cannot exceed market value" error={fsv > mv && mv > 0 ? 'Forced sale value cannot exceed market value' : undefined} />
            <TextField id="vr-d" label="Valuation date" type="date" required value={date} onChange={setDate} />
            <SelectField id="vr-c" label="Condition" value={cond} onChange={setCond} options={[['Good', 'Good'], ['Fair', 'Fair'], ['Poor', 'Poor']]} />
            <TextField id="vr-o" label="Occupancy" value={occ} onChange={setOcc} />
          </div>
          <div style={{ marginTop: 10 }}><Button primary disabled={mv <= 0 || fsv <= 0 || fsv > mv} onClick={function () { void act(function () { return app.client.submitValuationReport(v.id, { marketValue: mv, forcedSaleValue: fsv, valuationDate: date, condition: cond, occupancy: occ }); }, 'Report submitted for review.'); }}>Submit report</Button></div>
        </Section>
      ) : null}
    </>
  );
}

/* ===================================================================== */
/* Module 9: Fit-To-Lend Workspace                                        */
/* ===================================================================== */

export function FitToLendPage(): JSX.Element {
  const app = useApp();
  const cases = useAsync(function () { return app.client.listCases(); });
  const props = useAsync(function () { return app.client.listProperties(); });
  const vals = useAsync(function () { return app.client.listValuations(); });
  if (cases.loading || props.loading || vals.loading) { return <Loading />; }
  const id = app.route.segments[1];
  const list = (cases.data || []).filter(function (c) { return !!c.fitToLend && ['DECLINED', 'WITHDRAWN'].indexOf(c.state) < 0; });
  if (id) {
    const c = (cases.data || []).filter(function (x) { return x.id === id; })[0];
    if (!c) { return <ErrorNote message="Case not found" />; }
    const prop = (props.data || []).filter(function (x) { return x.id === c.propertyId; })[0];
    const val = (vals.data || []).filter(function (x) { return x.caseId === c.id; })[0];
    return <FitToLendWorkspace c={c} prop={prop} val={val} />;
  }
  return (
    <>
      <Head title="Fit-to-lend workspace" sub="Property acceptance and the fit-to-lend certificate. A certificate can be issued only when the valuation is accepted, all three searches are clear and the property is accepted." />
      <Table rowKey={function (c: MortgageCase) { return c.id; }} rows={list} empty="No cases at the collateral stage." onRow={function (c) { app.go('/fit-to-lend/' + c.id); }}
        cols={[
          { head: 'Case', render: function (c) { return <b>{c.ref}</b>; } },
          { head: 'Applicant', render: function (c) { return c.applicant.fullName; } },
          { head: 'Amount', right: true, render: function (c) { return money(c.amountRequested, c.currency); } },
          { head: 'Checklist', render: function (c) { const f = c.fitToLend; return f ? f.checklist.filter(function (i) { return i.done; }).length + ' of ' + f.checklist.length : '—'; } },
          { head: 'Property decision', render: function (c) { const f = c.fitToLend; return f && f.decision ? <Chip tone={f.decision === 'REJECT' ? 'solid' : 'dark'}>{title(f.decision)}</Chip> : <Chip tone="orange">Pending</Chip>; } },
          { head: 'Certificate', render: function (c) { const f = c.fitToLend; return f && f.certificateNo ? <Chip tone="dark">{f.certificateNo}</Chip> : <Chip tone="idle">Not issued</Chip>; } },
          { head: 'SLA', render: function (c) { return <SlaChip clock={c.sla} />; } }
        ]} />
    </>
  );
}

function FitToLendWorkspace(p: { c: MortgageCase; prop?: Property; val?: ValuationRequest }): JSX.Element {
  const app = useApp();
  const act = useAction();
  const c = p.c;
  const f = c.fitToLend;
  const roles = app.user.roles;
  const canAct = hasRole(roles, 'COLLATERAL');
  const [reason, setReason] = React.useState('');
  const [decision, setDecision] = React.useState('ACCEPT');
  const blockers = fitToLendBlockers(c, p.prop, p.val);
  const pre = blockers.filter(function (b) { return b !== 'Collateral checklist is incomplete.' && b !== 'Property has not been accepted by Collateral.'; });
  if (!f) { return <Note>No collateral record yet.</Note>; }
  return (
    <>
      <div className="small"><a href="#/fit-to-lend" onClick={function (e) { e.preventDefault(); app.go('/fit-to-lend'); }}>← All cases</a></div>
      <Head title={c.ref + ' · fit-to-lend'} sub={c.applicant.fullName + ' · ' + money(c.amountRequested, c.currency)} actions={f.certificateNo ? <Chip tone="dark">Certificate {f.certificateNo}</Chip> : <Chip tone={blockers.length ? 'orange' : 'dark'}>{blockers.length ? blockers.length + ' blocker' + (blockers.length > 1 ? 's' : '') : 'Ready to issue'}</Chip>} />
      <div className="ma-grid-even">
        <Panel title="Preconditions">
          <ul className="ma-checks">
            <Pre ok={!!p.val && p.val.status === 'ACCEPTED'} label="Valuation accepted" detail={p.val ? title(p.val.status) : 'No valuation'} />
            {(['LAND', 'CERTIFICATE', 'CONSOLIDATED'] as const).map(function (t) {
              const s = p.prop ? p.prop.searches.filter(function (x) { return x.type === t; })[0] : undefined;
              return <Pre key={t} ok={!!s && s.status === 'COMPLETED' && s.result !== 'ADVERSE'} bad={!!s && s.result === 'ADVERSE'} label={title(t) + ' search clear'} detail={s ? (s.result ? title(s.result) : 'Requested') : '—'} />;
            })}
            {c.equity ? <Pre ok={!!c.equity.forcedSaleValue && c.amountRequested <= maxEquityRelease(c.equity.forcedSaleValue, c.equity.existingMortgageBalance) + 0.005} label="Within 70% of forced sale value" detail={c.equity.forcedSaleValue ? money(maxEquityRelease(c.equity.forcedSaleValue, c.equity.existingMortgageBalance)) + ' maximum' : 'Awaiting valuation'} /> : null}
            <Pre ok={!!f.decision && f.decision !== 'REJECT'} bad={f.decision === 'REJECT'} label="Property accepted by Collateral" detail={f.decision ? title(f.decision) : 'Pending'} />
          </ul>
          {pre.length ? <div style={{ marginTop: 8 }}><Note tone="need">{pre[0]}</Note></div> : null}
        </Panel>
        <Panel title="Collateral review checklist">
          <div className="ma-stack" style={{ gap: 6 }}>
            {f.checklist.map(function (i) {
              return <CheckField key={i.id} id={'ck-' + i.id} label={i.label} checked={i.done} disabled={!canAct || !!f.certificateNo} onChange={function (v) { void act(function () { return app.client.setChecklistItem(c.id, i.id, v); }); }} />;
            })}
          </div>
        </Panel>
      </div>
      {canAct && !f.certificateNo && !f.decision ? (
        <Section title="Property decision">
          <div className="ma-fgrid">
            <SelectField id="fd" label="Decision" required value={decision} onChange={function (v) { setDecision(v || 'ACCEPT'); }} options={[['ACCEPT', 'Accept'], ['ACCEPT_WITH_CONDITIONS', 'Accept with conditions'], ['REJECT', 'Reject']]} />
            <TextArea id="fr" label="Reason or conditions" value={reason} onChange={setReason} />
          </div>
          <div style={{ marginTop: 10 }}><Button primary disabled={decision === 'REJECT' && !reason.trim()} onClick={function () { void act(function () { return app.client.decideProperty(c.id, decision as 'ACCEPT' | 'ACCEPT_WITH_CONDITIONS' | 'REJECT', reason); }, decision === 'REJECT' ? 'Property rejected. The applicant is told and dependent spend stops.' : 'Property accepted.'); }}>Record decision</Button></div>
        </Section>
      ) : null}
      {f.certificateNo ? (
        <Section title="Certificate">
          <Panel>
            <h2>Fit-to-lend certificate {f.certificateNo}</h2>
            <div className="ma-fgrid" style={{ marginTop: 10 }}>
              <div className="ma-f"><span className="small muted">Borrower</span><span>{c.applicant.fullName}</span></div>
              <div className="ma-f"><span className="small muted">Property</span><span>{p.prop ? p.prop.address : '—'} (title {p.prop ? p.prop.titleNumber : '—'})</span></div>
              <div className="ma-f"><span className="small muted">Market value / forced sale value</span><span>{p.val && p.val.report ? money(p.val.report.marketValue) + ' / ' + money(p.val.report.forcedSaleValue) : '—'}</span></div>
              <div className="ma-f"><span className="small muted">Issued · valid until</span><span>{fmtDate(f.issuedAt)} · {fmtDate(f.validUntil)}</span></div>
            </div>
            <div style={{ marginTop: 10 }}><Button small onClick={function () { window.print(); }}>Print or save as PDF</Button></div>
          </Panel>
        </Section>
      ) : canAct ? (
        <div><Button primary disabled={blockers.length > 0} title={blockers[0]} onClick={function () { void act(function () { return app.client.issueFitToLend(c.id); }, 'Fit-to-lend certificate issued.'); }}>Issue fit-to-lend certificate</Button>{blockers.length ? <span className="small muted" style={{ marginLeft: 10 }}>{blockers[0]}</span> : null}</div>
      ) : null}
    </>
  );
}

function Pre(p: { ok: boolean; bad?: boolean; label: string; detail: string }): JSX.Element {
  return (
    <li>
      <span className={'ma-dot ' + (p.ok ? 'PASS' : p.bad ? 'FAIL' : 'WARN')}>{p.ok ? '✓' : p.bad ? '!' : '…'}</span>
      <div><b>{p.label}</b></div>
      <span className="small muted">{p.detail}</span>
    </li>
  );
}

import * as React from 'react';
import { useAction, useApp, useAsync } from '../context';
import { DOC_SPECS, docLabel, requiredSpecs } from '../domain/documents';
import { activeApprovalGroup, disbursementBlockers, LEVEL_LABEL, remainingToDisburse } from '../domain/rules';
import {
  ApprovalStep,
  AuditEntry,
  Condition,
  MortgageCase,
  ReadinessResult,
  Role,
  STATE_LABEL,
  STATE_ORDER,
  Thread
} from '../domain/types';
import { fmtDate, fmtDateTime, money, relTime, title } from '../format';
import { validateFile } from '../services/fileStore';
import { Button, Chip, ErrorNote, Loading, Note, NumberField, Panel, ScoreRing, SelectField, SlaChip, Table, TextArea, TextField } from './ui';

export function hasRole(roles: Role[], ...wanted: Role[]): boolean {
  return roles.some(function (r) { return wanted.indexOf(r) >= 0 || r === 'ADMIN'; });
}

/* ---------------- readiness ---------------- */

export function ReadinessPanel(p: { result: ReadinessResult; compact?: boolean }): JSX.Element {
  const r = p.result;
  const label = r.decision === 'PRE_APPROVED' ? 'Ready for pre-approval' : r.decision === 'REFERRED' ? 'Almost ready: a Credit officer will review' : 'Not ready yet';
  return (
    <Panel>
      <div className="ma-row" style={{ gap: 16, alignItems: 'center', flexWrap: 'nowrap' }}>
        <ScoreRing score={r.score} label="Readiness score" />
        <div>
          <div className="small muted">Mortgage readiness</div>
          <h2>{label}</h2>
          <div className="small muted num" style={{ marginTop: 4 }}>Debt service {r.dsrPct.toFixed(0)}% · eligible up to {money(r.eligibleAmount)} · instalment {money(r.instalment)}</div>
        </div>
      </div>
      {r.hardStops.length ? <div style={{ marginTop: 12 }}><Note tone="need"><b>Must be fixed first</b><ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{r.hardStops.map(function (h) { return <li key={h}>{h}</li>; })}</ul></Note></div> : null}
      <ul className="ma-checks" style={{ marginTop: 10 }}>
        {r.checks.map(function (c) {
          return (
            <li key={c.id}>
              <span className={'ma-dot ' + c.status} aria-label={c.status}>{c.status === 'PASS' ? '✓' : c.status === 'FAIL' ? '!' : c.status === 'WARN' ? '~' : '…'}</span>
              <div><b>{c.label}</b><div className="small muted">{c.detail}</div>{c.fix && (c.status === 'FAIL' || c.status === 'WARN') ? <div className="small" style={{ color: '#A04000' }}>{c.fix}</div> : null}</div>
              <span className="small muted num">{c.weight} pts</span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* ---------------- tracking ---------------- */

const TRACK: Array<{ id: string; label: string; states: string[] }> = [
  { id: 'apply', label: 'Application submitted', states: ['SUBMITTED'] },
  { id: 'pre', label: 'Pre-approval', states: ['PRE_APPROVAL', 'REFERRED', 'PRE_APPROVED'] },
  { id: 'assess', label: 'Assessment: valuation, searches, credit', states: ['IN_ASSESSMENT'] },
  { id: 'approve', label: 'Approval', states: ['IN_APPROVAL'] },
  { id: 'offer', label: 'Offer and acceptance', states: ['OFFER_ISSUED'] },
  { id: 'cond', label: 'Conditions precedent', states: ['CONDITIONS_PENDING'] },
  { id: 'disb', label: 'Disbursement', states: ['READY_TO_DISBURSE', 'DISBURSED'] },
  { id: 'post', label: 'Post-disbursement', states: ['POST_DISBURSEMENT'] },
  { id: 'closed', label: 'Closed', states: ['CLOSED'] }
];

export function TrackingPanel(p: { c: MortgageCase }): JSX.Element {
  const c = p.c;
  const idx = TRACK.map(function (t) { return t.states.indexOf(c.state) >= 0; }).indexOf(true);
  const stalled = idx < 0;
  const orderIdx = STATE_ORDER.indexOf(c.state);
  return (
    <Panel title="Where this application is">
      {stalled ? <Chip tone="line">{STATE_LABEL[c.state]}</Chip> : null}
      <ol className="ma-track">
        {TRACK.map(function (t, i) {
          const done = stalled ? false : i < idx || c.state === 'CLOSED';
          const cur = !stalled && i === idx && c.state !== 'CLOSED';
          return (
            <li key={t.id} className={done ? 'done' : cur ? 'cur' : 'fut'}>
              <span className="d" aria-hidden="true">{done ? '✓' : cur ? '●' : '○'}</span>
              <div><b>{t.label}</b>{cur ? <div className="small muted">Since {fmtDateTime(c.stageEnteredAt)}</div> : null}</div>
            </li>
          );
        })}
      </ol>
      {stalled && orderIdx < 0 ? <div className="small muted">{c.declineReason}</div> : null}
    </Panel>
  );
}

/* ---------------- documents ---------------- */

export function DocumentsPanel(p: { c: MortgageCase; canUpload: boolean; canRequest: boolean }): JSX.Element {
  const app = useApp();
  const act = useAction();
  const docs = useAsync(function () { return app.client.listDocuments(p.c.id); }, [p.c.id]);
  const reqs = useAsync(function () { return app.client.listDocRequests(p.c.id); }, [p.c.id]);
  const [reqType, setReqType] = React.useState('');
  const [reqDue, setReqDue] = React.useState('');
  if (docs.loading || reqs.loading) { return <Loading />; }
  if (docs.error) { return <ErrorNote message={docs.error} />; }
  const list = docs.data || [];
  const required = requiredSpecs(p.c);
  const optional = DOC_SPECS.filter(function (s) { return required.indexOf(s) < 0; });

  const upload = function (docType: string, category: (typeof DOC_SPECS)[0]['category'], files: FileList | null): void {
    if (!files || !files.length) { return; }
    const file = files[0];
    const bad = validateFile(file);
    if (bad) { app.toast(bad); return; }
    void act(async function () {
      const stored = await app.files.upload(p.c.ref, docType, file);
      await app.client.uploadDocument(p.c.id, docType, category, { name: stored.name, sizeKb: stored.sizeKb });
    }, docLabel(docType) + ' uploaded to the case library.');
  };

  const attachSample = function (docType: string, category: (typeof DOC_SPECS)[0]['category']): Promise<unknown> {
    return app.client.uploadDocument(p.c.id, docType, category, { name: docType.toLowerCase() + '-sample.pdf', sizeKb: 120 + docType.length * 7 });
  };
  const attachAllSamples = function (): void {
    void act(async function () {
      for (const s of required) {
        if (!list.some(function (d) { return d.docType === s.docType; })) { await attachSample(s.docType, s.category); }
      }
    }, 'Sample documents attached for every required item.');
  };

  const row = function (s: (typeof DOC_SPECS)[0]): JSX.Element {
    const mine = list.filter(function (d) { return d.docType === s.docType; });
    const last = mine[mine.length - 1];
    const asked = (reqs.data || []).filter(function (r) { return r.docType === s.docType && !r.fulfilledDocId; })[0];
    return (
      <tr key={s.docType}>
        <td><b>{s.label}</b><div className="small muted">{s.hint}</div></td>
        <td>{last ? <Chip tone="dark">v{last.version} attached</Chip> : asked ? <Chip tone="orange">Requested · due {fmtDate(asked.dueDate)}</Chip> : s.required(p.c) ? <Chip tone="solid">Missing</Chip> : <Chip tone="idle">Optional</Chip>}</td>
        <td className="small">{last ? <><div>{last.fileName}</div><div className="muted">{last.sizeKb} KB · {last.classification.toLowerCase()} · {relTime(last.uploadedAt)}</div></> : '—'}</td>
        <td className="right">
          {p.canUpload && app.files.demo ? <Button small onClick={function () { void act(function () { return attachSample(s.docType, s.category); }, s.label + ' attached (sample).'); }}>Attach sample</Button> : null}{' '}
          {p.canUpload ? (
            <label className={'ma-btn sm' + (last ? '' : ' pri')} style={{ cursor: 'pointer' }}>
              {last ? 'Replace' : 'Upload'}
              <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={function (e) { upload(s.docType, s.category, e.target.files); e.target.value = ''; }} />
            </label>
          ) : null}
        </td>
      </tr>
    );
  };

  return (
    <div className="ma-stack">
      {p.canUpload && app.files.demo ? <Note><b>Demo.</b> Some preview windows block the file picker. Use <b>Attach sample</b> on any row, or <Button small onClick={attachAllSamples}>Attach samples for all required documents</Button> to move on.</Note> : null}
      <div className="ma-tw"><table className="ma-t"><thead><tr><th>Document</th><th>Status</th><th>File</th><th /></tr></thead>
        <tbody>{required.map(row)}{optional.map(row)}</tbody></table></div>
      <div className="small muted">Files are stored once in the case folder of the SharePoint document library. Every unit reads the same copy.</div>
      {p.canRequest ? (
        <Panel title="Request a document from the applicant">
          <div className="ma-fgrid">
            <SelectField id="rq-type" label="Document" value={reqType} onChange={setReqType} options={DOC_SPECS.map(function (s) { return [s.docType, s.label] as [string, string]; })} />
            <TextField id="rq-due" label="Due date" type="date" value={reqDue} onChange={setReqDue} />
          </div>
          <div style={{ marginTop: 10 }}>
            <Button primary disabled={!reqType || !reqDue} onClick={function () {
              const spec = DOC_SPECS.filter(function (s) { return s.docType === reqType; })[0];
              void act(function () { return app.client.requestDocument(p.c.id, reqType, spec.category, reqDue); }, 'Request sent. The applicant is notified in-app and by email.');
              setReqType(''); setReqDue('');
            }}>Send request</Button>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

/* ---------------- approvals ---------------- */

export function ApprovalsPanel(p: { c: MortgageCase }): JSX.Element {
  const app = useApp();
  const act = useAction();
  const [comment, setComment] = React.useState('');
  const c = p.c;
  if (c.approvals.length === 0) { return <Note>No approvals yet. Approval routing starts when assessment is complete.</Note>; }
  const active = c.state === 'IN_APPROVAL' ? activeApprovalGroup(c.approvals) : 0;
  const canDecide = hasRole(app.user.roles, 'APPROVER', 'EXECUTIVE');
  const decide = function (s: ApprovalStep, d: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'RETURN' | 'DECLINE'): void {
    void act(function () { return app.client.decideApproval(c.id, s.level, d, comment); }, LEVEL_LABEL[s.level] + ': ' + title(d) + '.');
    setComment('');
  };
  return (
    <div className="ma-stack">
      <Table rowKey={function (s: ApprovalStep) { return s.level; }} rows={c.approvals}
        cols={[
          { head: 'Level', render: function (s: ApprovalStep) { return <b>{s.level} · {LEVEL_LABEL[s.level]}</b>; } },
          { head: 'Group', render: function (s: ApprovalStep) { return 'Step ' + s.group + (s.group === active ? ' (active)' : ''); } },
          { head: 'Decision', render: function (s: ApprovalStep) { return s.decision ? <Chip tone={s.decision === 'DECLINE' ? 'line' : 'dark'}>{title(s.decision)}</Chip> : s.group === active ? <Chip tone="orange">Awaiting</Chip> : <Chip tone="idle">Queued</Chip>; } },
          { head: 'By', render: function (s: ApprovalStep) { return s.approverName || '—'; } },
          { head: 'Comment', render: function (s: ApprovalStep) { return s.comment || '—'; } },
          { head: 'Due', render: function (s: ApprovalStep) { return s.decidedAt ? fmtDate(s.decidedAt) : s.dueAt ? fmtDateTime(s.dueAt) : '—'; } }
        ]} />
      {canDecide && active > 0 ? (
        <Panel title="Your decision">
          <div className="ma-stack">
            <TextArea id="appr-comment" label="Comment (required to return or decline)" value={comment} onChange={setComment} />
            <div className="ma-row">
              {c.approvals.filter(function (s) { return s.group === active && !s.decision; }).map(function (s) {
                return (
                  <div key={s.level} className="ma-row" style={{ border: '1px solid #E6E3E0', borderRadius: 8, padding: 8 }}>
                    <b>{s.level}</b>
                    <Button primary small onClick={function () { decide(s, 'APPROVE'); }}>Approve</Button>
                    <Button small onClick={function () { decide(s, 'APPROVE_WITH_CONDITIONS'); }}>With conditions</Button>
                    <Button small onClick={function () { decide(s, 'RETURN'); }}>Return</Button>
                    <Button small onClick={function () { decide(s, 'DECLINE'); }}>Decline</Button>
                  </div>
                );
              })}
            </div>
            <div className="small muted">A decline or return needs a reason. A decline is confirmed by the next level (BR-12). Each decision is recorded with the matrix version used.</div>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}

/* ---------------- conditions ---------------- */

export function ConditionsTable(p: { items: Condition[]; showCase?: boolean; refFor?: (id: string) => string }): JSX.Element {
  const app = useApp();
  const act = useAction();
  const roles = app.user.roles;
  const update = function (x: Condition, status: Condition['status'], note?: string): void {
    void act(function () { return app.client.updateCondition(x.id, status, note || ''); }, x.title + ': ' + title(status) + '.');
  };
  return (
    <Table rowKey={function (x: Condition) { return x.id; }} rows={p.items} empty="No conditions to show."
      cols={[
        ...(p.showCase ? [{ head: 'Case', render: function (x: Condition) { return <a href={'#/cases/' + x.caseId + '?tab=conditions'}>{p.refFor ? p.refFor(x.caseId) : x.caseId}</a>; } }] : []),
        { head: 'Condition', render: function (x: Condition) { return <><b>{x.title}</b>{x.mandatory ? '' : <span className="muted"> (optional)</span>}</>; } },
        { head: 'Owner', render: function (x: Condition) { return title(x.ownerRole); } },
        { head: 'Verifier', render: function (x: Condition) { return title(x.verifierRole); } },
        { head: 'Due', render: function (x: Condition) { const late = new Date(x.dueDate).getTime() < Date.now() && x.status !== 'VERIFIED' && x.status !== 'WAIVED'; return <span>{fmtDate(x.dueDate)}{late ? <> <Chip tone="solid">Late</Chip></> : null}</span>; } },
        { head: 'Status', render: function (x: Condition) { return <Chip tone={x.status === 'VERIFIED' ? 'dark' : x.status === 'WAIVED' ? 'line' : x.status === 'EVIDENCE_SUBMITTED' ? 'orange' : x.status === 'REJECTED' ? 'solid' : 'idle'}>{title(x.status)}</Chip>; } },
        { head: '', render: function (x: Condition) {
          const done = x.status === 'VERIFIED' || x.status === 'WAIVED';
          if (done) { return <span className="small muted">{x.verifiedBy}</span>; }
          return (
            <span className="ma-row" style={{ gap: 6 }}>
              {hasRole(roles, x.ownerRole) && x.status !== 'EVIDENCE_SUBMITTED' ? <Button small onClick={function () { update(x, 'EVIDENCE_SUBMITTED'); }}>Submit evidence</Button> : null}
              {hasRole(roles, x.verifierRole) && x.status === 'EVIDENCE_SUBMITTED' ? <><Button small primary onClick={function () { update(x, 'VERIFIED'); }}>Verify</Button><Button small onClick={function () { update(x, 'REJECTED', 'Evidence not acceptable'); }}>Reject</Button></> : null}
              {hasRole(roles, 'APPROVER', 'MORTGAGE_LEAD', 'CREDIT_ADMIN') ? <Button small onClick={function () { const why = typeof window !== 'undefined' && window.prompt ? window.prompt('Reason for waiving this condition') : 'Waived with approval'; if (why) { update(x, 'WAIVED', why); } }}>Waive</Button> : null}
            </span>
          );
        } }
      ]} />
  );
}

/* ---------------- disbursement ---------------- */

export function DisbursementPanel(p: { c: MortgageCase }): JSX.Element {
  const app = useApp();
  const act = useAction();
  const c = p.c;
  const [payee, setPayee] = React.useState(c.purchase ? c.purchase.vendorName : '');
  const [amount, setAmount] = React.useState(0);
  const blockers = disbursementBlockers(c, new Date());
  const roles = app.user.roles;
  const left = remainingToDisburse(c);
  const gateOpen = blockers.length === 0 && (c.state === 'READY_TO_DISBURSE' || c.state === 'DISBURSED');
  return (
    <div className="ma-stack">
      <Panel title="Disbursement gate">
        {gateOpen ? <Note tone="ok"><b>Gate passed.</b> Every mandatory condition is verified, the offer is accepted and fit-to-lend is valid.</Note>
          : <Note tone="need"><b>Blocked.</b><ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>{(c.state === 'READY_TO_DISBURSE' || c.state === 'DISBURSED' ? blockers : ['The case is in “' + STATE_LABEL[c.state] + '”.'].concat(blockers.slice(0, 5))).map(function (b) { return <li key={b}>{b}</li>; })}</ul></Note>}
      </Panel>
      <Table rowKey={function (d) { return d.id; }} rows={c.disbursements} empty="No disbursements yet."
        cols={[
          { head: 'Tranche', render: function (d) { return '#' + d.trancheNo; } },
          { head: 'Payee', render: function (d) { return d.payee; } },
          { head: 'Amount', right: true, render: function (d) { return money(d.amount, c.currency); } },
          { head: 'Status', render: function (d) { return <Chip tone={d.status === 'PAID' ? 'dark' : d.status === 'APPROVED' ? 'orange' : 'idle'}>{title(d.status)}</Chip>; } },
          { head: 'Requested / approved by', render: function (d) { return d.requestedBy + (d.approvedBy ? ' / ' + d.approvedBy : ''); } },
          { head: '', render: function (d) {
            return (
              <span className="ma-row" style={{ gap: 6 }}>
                {d.status === 'PENDING_APPROVAL' && hasRole(roles, 'CREDIT_ADMIN', 'APPROVER') ? <Button small onClick={function () { void act(function () { return app.client.approveDisbursement(d.id); }, 'Disbursement approved.'); }}>Approve</Button> : null}
                {d.status === 'APPROVED' && hasRole(roles, 'OPERATIONS') ? <Button small primary onClick={function () { void act(function () { return app.client.payDisbursement(d.id); }, 'Funds released.'); }}>Release funds</Button> : null}
                {d.paymentRef ? <span className="small muted">{d.paymentRef}</span> : null}
              </span>
            );
          } }
        ]} />
      {hasRole(roles, 'CREDIT_ADMIN') && (c.state === 'READY_TO_DISBURSE') ? (
        <Panel title="Request disbursement">
          <div className="ma-fgrid">
            <TextField id="d-payee" label="Payee" required value={payee} onChange={setPayee} hint={c.equity ? 'Tuition and medical are paid direct to the institution; renovation in stages.' : 'Vendor or developer account, matched to its due-diligence record.'} />
            <NumberField id="d-amount" label={'Amount (remaining ' + money(left, c.currency) + ')'} required value={amount} onChange={setAmount} />
          </div>
          <div style={{ marginTop: 10 }}><Button primary disabled={!payee || amount <= 0} onClick={function () { void act(function () { return app.client.requestDisbursement(c.id, payee, amount); }, 'Disbursement requested. A second person must approve it.'); setAmount(0); }}>Request disbursement</Button></div>
        </Panel>
      ) : null}
    </div>
  );
}

/* ---------------- threads ---------------- */

export function ThreadView(p: { thread: Thread; compact?: boolean }): JSX.Element {
  const app = useApp();
  const act = useAction();
  const t = p.thread;
  const [text, setText] = React.useState('');
  const [mode, setMode] = React.useState<'MESSAGE' | 'REQUEST' | 'NOTE'>('MESSAGE');
  const [due, setDue] = React.useState('');
  const isApplicant = app.user.roles.indexOf('APPLICANT') >= 0;
  const oversight = hasRole(app.user.roles, 'MORTGAGE_OFFICER', 'MORTGAGE_LEAD');
  const myName = app.user.displayName;
  return (
    <div className="ma-stack">
      <div className="ma-row" style={{ justifyContent: 'space-between' }}>
        <div><b>{title(t.topic)} thread</b> {t.visibleToApplicant ? <Chip tone="line">Applicant can see</Chip> : <Chip tone="idle">Staff only</Chip>} {t.oversightJoined ? <Chip tone="grey">Mortgage Team joined</Chip> : null}</div>
        {oversight && !t.oversightJoined ? <Button small onClick={function () { void act(function () { return app.client.joinThread(t.id); }, 'You joined for oversight.'); }}>Join for oversight</Button> : null}
      </div>
      <div className="ma-chat">
        {t.messages.length === 0 ? <div className="ma-note">No messages yet.</div> : null}
        {t.messages.map(function (m) {
          const cls = m.kind === 'SYSTEM' ? 'sys' : m.kind === 'NOTE' ? 'note' : m.sender === myName ? 'me' : '';
          return (
            <div key={m.id} className={'ma-msg ' + cls}>
              <div className="by">{m.kind === 'SYSTEM' ? '' : m.sender + ' · '}{fmtDateTime(m.sentAt)}{m.kind === 'NOTE' ? ' · internal note' : ''}</div>
              {m.kind === 'REQUEST' ? <div style={{ marginBottom: 4 }}><Chip tone={m.closed ? 'dark' : 'orange'}>{m.closed ? 'Request closed' : 'Request · due ' + fmtDate(m.dueDate)}</Chip></div> : null}
              <div>{m.body}</div>
              {m.kind === 'REQUEST' && !m.closed && (isApplicant || oversight) ? <div style={{ marginTop: 6 }}><Button small primary onClick={function () { void act(function () { return app.client.closeRequest(t.id, m.id); }, 'Request closed. The case clock resumes.'); }}>{isApplicant ? 'Mark as answered' : 'Close request'}</Button></div> : null}
            </div>
          );
        })}
      </div>
      <div className="ma-stack">
        <TextArea id={'msg-' + t.id} label="Write a message" value={text} onChange={setText} />
        <div className="ma-row">
          <Button primary disabled={!text.trim()} onClick={function () {
            void act(function () { return app.client.postMessage(t.id, text, mode, mode === 'REQUEST' ? due || undefined : undefined); }, mode === 'REQUEST' ? 'Request sent. The case clock pauses until it is answered.' : 'Sent.');
            setText('');
          }}>Send</Button>
          {!isApplicant ? <SelectField id={'mode-' + t.id} label="" value={mode} onChange={function (v) { setMode((v || 'MESSAGE') as 'MESSAGE' | 'REQUEST' | 'NOTE'); }} options={[['MESSAGE', 'Message'], ['REQUEST', 'Request an answer'], ['NOTE', 'Internal note']]} /> : null}
          {mode === 'REQUEST' ? <TextField id={'due-' + t.id} label="" type="date" value={due} onChange={setDue} /> : null}
        </div>
      </div>
    </div>
  );
}

/* ---------------- audit ---------------- */

export function AuditTable(p: { entries: AuditEntry[]; showCase?: boolean }): JSX.Element {
  return (
    <Table rowKey={function (e: AuditEntry) { return e.id; }} rows={p.entries} empty="No entries match."
      cols={[
        { head: 'Time stamp', nowrap: true, render: function (e: AuditEntry) { return fmtDateTime(e.at); } },
        ...(p.showCase ? [{ head: 'Application', render: function (e: AuditEntry) { return <b>{e.ref}</b>; } }] : []),
        { head: 'Actor', render: function (e: AuditEntry) { return e.actor; } },
        { head: 'Action', render: function (e: AuditEntry) { return <b>{e.action}</b>; } },
        { head: 'Detail', render: function (e: AuditEntry) { return e.detail; } }
      ]} />
  );
}

export { SlaChip };

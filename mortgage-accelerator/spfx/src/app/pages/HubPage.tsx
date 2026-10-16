import * as React from 'react';
import { useApp, useAsync } from '../context';
import { ThreadView } from '../components/panels';
import { Chip, ErrorNote, Head, Loading, Note, Panel } from '../components/ui';
import { MortgageCase, Thread } from '../domain/types';
import { fmtDateTime, title } from '../format';

/**
 * Module 6: Stakeholder Collaboration Hub. Applicant and each unit talk directly inside the case.
 * The Mortgage Team watches and can join, but is not a required recipient.
 */
export function HubPage(): JSX.Element {
  const app = useApp();
  const cases = useAsync(function () { return app.client.listCases(); });
  const threads = useAsync(function () { return app.client.listThreads(); });
  const [topic, setTopic] = React.useState('');
  if (cases.loading || threads.loading) { return <Loading />; }
  if (cases.error || threads.error) { return <ErrorNote message={cases.error || threads.error || ''} />; }
  const all = threads.data || [];
  const byCase: { [k: string]: Thread[] } = {};
  all.forEach(function (t) { (byCase[t.caseId] = byCase[t.caseId] || []).push(t); });
  const list = (cases.data || []).filter(function (c) { return (byCase[c.id] || []).length > 0; });
  const openReq = function (cid: string): number {
    return (byCase[cid] || []).reduce(function (n, t) { return n + t.messages.filter(function (m) { return m.kind === 'REQUEST' && !m.closed; }).length; }, 0);
  };
  const last = function (cid: string): string {
    let at = '';
    (byCase[cid] || []).forEach(function (t) { t.messages.forEach(function (m) { if (m.sentAt > at) { at = m.sentAt; } }); });
    return at;
  };
  const selId = app.route.query.case || (list.filter(function (c) { return last(c.id); })[0] || list[0] || { id: '' }).id;
  const sel: MortgageCase | undefined = list.filter(function (c) { return c.id === selId; })[0];
  const myThreads = sel ? (byCase[sel.id] || []) : [];
  const current = myThreads.filter(function (t) { return t.topic === topic; })[0] || myThreads.filter(function (t) { return t.messages.length > 0; })[0] || myThreads[0];
  const isApplicant = app.user.roles.indexOf('APPLICANT') >= 0;
  const oversightWatch = list.filter(function (c) { return openReq(c.id) > 0; }).length;

  return (
    <>
      <Head title="Collaboration hub" sub={isApplicant ? 'Write directly to the unit handling your application. Everything is kept with your case.' : 'Talk to the applicant and to other units inside the case. The Mortgage Team keeps oversight but is not a relay.'} />
      {!isApplicant && oversightWatch ? <Note tone="need"><b>Watch list.</b> {oversightWatch} case{oversightWatch > 1 ? 's have' : ' has'} open requests waiting for a reply.</Note> : null}
      <div className="ma-grid2" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr)' }}>
        <div className="ma-stack">
          {list.length === 0 ? <Note>No conversations yet. Threads open when an application is submitted.</Note> : list.map(function (c) {
            const n = openReq(c.id);
            return (
              <div key={c.id} className="ma-panel" role="button" tabIndex={0} style={{ cursor: 'pointer', borderColor: c.id === selId ? '#D95400' : undefined }}
                onClick={function () { setTopic(''); app.go('/hub?case=' + c.id); }} onKeyDown={function (e) { if (e.key === 'Enter') { app.go('/hub?case=' + c.id); } }}>
                <div className="ma-row" style={{ justifyContent: 'space-between' }}><b>{c.ref}</b>{n ? <Chip tone="solid">{n} open request{n > 1 ? 's' : ''}</Chip> : null}</div>
                <div className="small">{c.applicant.fullName}</div>
                <div className="small muted">Last message {last(c.id) ? fmtDateTime(last(c.id)) : 'none yet'}</div>
              </div>
            );
          })}
        </div>
        <div className="ma-stack">
          {sel && current ? (
            <>
              <div className="ma-row">
                {myThreads.map(function (t) {
                  const n = t.messages.filter(function (m) { return m.kind === 'REQUEST' && !m.closed; }).length;
                  return <button key={t.id} type="button" className={'ma-btn sm' + (t.id === current.id ? ' pri' : '')} onClick={function () { setTopic(t.topic); }}>{title(t.topic)}{n ? ' (' + n + ')' : ''}</button>;
                })}
              </div>
              <Panel><ThreadView thread={current} /></Panel>
              <div className="small muted">Messages and attachments are saved to the case and to the audit trail. <a href={'#/cases/' + sel.id}>Open the case</a></div>
            </>
          ) : <Note>Choose a case to read and write messages.</Note>}
        </div>
      </div>
    </>
  );
}

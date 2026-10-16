/**
 * Local harness. Renders the same <MortgageApp> the SharePoint web part renders, but backed by the
 * in-memory mock instead of Advance Flow, with a role switcher so every persona can be tried.
 * It is not part of the SharePoint package.
 */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MortgageApp } from '../src/app/App';
import { Role } from '../src/app/domain/types';
import { MockAdvanceFlowClient } from '../src/app/services/mockClient';
import { MockFileStore } from '../src/app/services/fileStore';

const client = new MockAdvanceFlowClient();
const files = new MockFileStore();

const ROLES: Array<[string, string, Role, string]> = [
  ['ama', 'Applicant: Ama (has a case in flight)', 'APPLICANT', 'E-04417'],
  ['yaa', 'Applicant: Yaa (new, no cases)', 'APPLICANT', 'E-04499'],
  ['mo', 'Mortgage Officer', 'MORTGAGE_OFFICER', ''],
  ['ml', 'Mortgage Team Lead', 'MORTGAGE_LEAD', ''],
  ['hr', 'HR', 'HR', ''],
  ['cr', 'Credit', 'CREDIT', ''],
  ['lg', 'Legal', 'LEGAL', ''],
  ['co', 'Collateral', 'COLLATERAL', ''],
  ['ap', 'Approver', 'APPROVER', ''],
  ['ca', 'Credit Administration', 'CREDIT_ADMIN', ''],
  ['op', 'Operations', 'OPERATIONS', ''],
  ['pd', 'Post Disbursement', 'POST_DISBURSEMENT', ''],
  ['ex', 'Executive', 'EXECUTIVE', ''],
  ['au', 'Internal Audit', 'AUDITOR', '']
];

function Harness(): JSX.Element {
  const initial = (window.location.search.match(/[?&]as=(\w+)/) || [])[1] || 'ama';
  const [who, setWho] = React.useState(initial);
  const apply = function (key: string): void {
    const r = ROLES.filter(function (x) { return x[0] === key; })[0] || ROLES[0];
    client.setRole(r[2]);
    if (r[3]) { client.setApplicant(r[3]); }
  };
  React.useMemo(function () { apply(initial); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const toolbar = (
    <div className="ma-row" style={{ gap: 8 }}>
      <label htmlFor="who" className="small muted" style={{ textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>View as</label>
      <select id="who" value={who} style={{ border: '1px solid #D2CECA', borderRadius: 6, padding: '5px 8px', fontWeight: 600 }}
        onChange={function (e) { apply(e.target.value); setWho(e.target.value); window.location.hash = '#/'; }}>
        {ROLES.map(function (r) { return <option key={r[0]} value={r[0]}>{r[1]}</option>; })}
      </select>
      <button type="button" className="ma-btn sm" onClick={function () { client.reset(); apply(who); window.location.hash = '#/'; setWho(who); window.location.reload(); }}>Reset demo data</button>
      <span className="ma-chip idle">Local harness · mock Advance Flow</span>
    </div>
  );
  return <MortgageApp client={client} files={files} toolbar={toolbar} identityKey={who} />;
}

ReactDOM.render(<Harness />, document.getElementById('root'));

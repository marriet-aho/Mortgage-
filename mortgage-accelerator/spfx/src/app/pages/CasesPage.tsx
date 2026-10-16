import * as React from 'react';
import { useApp, useAsync } from '../context';
import { Button, ErrorNote, Head, Loading, SlaChip, StateChip, Table, TextField, SelectField } from '../components/ui';
import { CaseState, MortgageCase, PRODUCT_LABEL, ProductCode, STATE_LABEL } from '../domain/types';
import { fmtDate, money } from '../format';
import { CaseWorkspace } from './CaseWorkspace';

export function CasesPage(): JSX.Element {
  const app = useApp();
  const id = app.route.segments[1];
  if (id) {
    return <CaseWorkspace id={id} />;
  }
  return <CaseList />;
}

function CaseList(): JSX.Element {
  const app = useApp();
  const [q, setQ] = React.useState('');
  const [product, setProduct] = React.useState('');
  const [state, setState] = React.useState('');
  const res = useAsync(function () {
    return app.client.listCases({ q, product: (product || undefined) as ProductCode | undefined, states: state ? [state as CaseState] : undefined });
  }, [q, product, state]);
  const isApplicant = app.user.roles.indexOf('APPLICANT') >= 0;
  if (res.error) { return <ErrorNote message={res.error} />; }
  const list = res.data || [];
  return (
    <>
      <Head title={isApplicant ? 'My applications' : 'Mortgage case management'} sub="Every application is a digital case holding its forms, documents, valuation, approvals, tasks, conditions, messages, SLA clocks and audit log."
        actions={isApplicant ? <><Button primary onClick={function () { app.go('/apply/purchase'); }}>New Home Purchase</Button><Button onClick={function () { app.go('/apply/equity'); }}>New Equity Release</Button></> : undefined} />
      <div className="ma-fgrid" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
        <TextField id="f-q" label="Loan or reference number" value={q} onChange={setQ} hint="Reference, account number, name or department" />
        <SelectField id="f-p" label="Product" value={product} onChange={setProduct} options={[['HOME_PURCHASE', PRODUCT_LABEL.HOME_PURCHASE], ['EQUITY_RELEASE', PRODUCT_LABEL.EQUITY_RELEASE]]} />
        <SelectField id="f-s" label="Status" value={state} onChange={setState} options={(Object.keys(STATE_LABEL) as CaseState[]).filter(function (s) { return s !== 'DRAFT'; }).map(function (s) { return [s, STATE_LABEL[s]] as [string, string]; })} />
      </div>
      <div className="ma-row" style={{ justifyContent: 'flex-end' }}>
        <Button onClick={function () { setQ(''); setProduct(''); setState(''); }}>Reset</Button>
        <Button onClick={res.reload} title="Refresh the list">Refresh</Button>
      </div>
      {res.loading ? <Loading /> : (
        <Table rowKey={function (c: MortgageCase) { return c.id; }} rows={list} empty="No cases match." onRow={function (c) { app.go(c.state === 'DRAFT' ? '/apply/' + (c.product === 'HOME_PURCHASE' ? 'purchase' : 'equity') : '/cases/' + c.id); }}
          cols={[
            { head: 'Reference', render: function (c) { return <b>{c.ref}</b>; } },
            { head: 'Loan account', render: function (c) { return c.accountNumber || <span className="muted">Not yet active</span>; } },
            { head: 'Applicant', render: function (c) { return <>{c.applicant.fullName}<div className="small muted">{c.applicant.department}</div></>; } },
            { head: 'Product', render: function (c) { return PRODUCT_LABEL[c.product]; } },
            { head: 'Amount', right: true, render: function (c) { return c.amountRequested ? money(c.amountRequested, c.currency) : '—'; } },
            { head: 'Status', render: function (c) { return <StateChip state={c.state} />; } },
            { head: 'Open tasks', right: true, render: function (c) { return String(c.tasks.filter(function (t) { return t.status !== 'DONE' && t.status !== 'CANCELLED'; }).length); } },
            { head: 'SLA', render: function (c) { return <SlaChip clock={c.sla} />; } },
            { head: 'Submitted', render: function (c) { return fmtDate(c.submittedAt); } }
          ]} />
      )}
    </>
  );
}

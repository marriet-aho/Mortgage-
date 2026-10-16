import * as React from 'react';
import { useAction, useApp, useAsync } from '../context';
import { hasRole } from '../components/panels';
import { Button, Chip, ErrorNote, Head, Loading, Note, Panel, Section, SelectField, Table, TextField } from '../components/ui';
import { LegalSearch, Property } from '../domain/types';
import { fmtDate, title } from '../format';

export function PropertyBlock(p: { prop: Property }): JSX.Element {
  const app = useApp();
  const act = useAction();
  const prop = p.prop;
  const canRecord = hasRole(app.user.roles, 'LEGAL', 'COLLATERAL');
  const [result, setResult] = React.useState<{ [type: string]: string }>({});
  const [notes, setNotes] = React.useState<{ [type: string]: string }>({});
  return (
    <div className="ma-stack">
      <Panel>
        <div className="ma-row" style={{ justifyContent: 'space-between' }}>
          <div><h2>{prop.address}</h2><div className="small muted">Title {prop.titleNumber}{prop.digitalAddress ? ' · digital address ' + prop.digitalAddress : ''}</div></div>
          <Chip tone={prop.encumbrance === 'NONE' ? 'dark' : prop.encumbrance === 'UNKNOWN' ? 'idle' : 'solid'}>{prop.encumbrance === 'NONE' ? 'No encumbrance' : prop.encumbrance === 'UNKNOWN' ? 'Encumbrance not yet known' : 'Existing charge'}</Chip>
        </div>
        <div className="ma-fgrid" style={{ marginTop: 10 }}>
          <div className="ma-f"><span className="small muted">Registered owner</span><span>{prop.registeredOwner || '—'}</span></div>
          <div className="ma-f"><span className="small muted">Ownership</span><span>{title(prop.ownershipType)} · {title(prop.constructionStatus)}</span></div>
          <div className="ma-f"><span className="small muted">Type</span><span>{prop.propertyType} · {prop.region}</span></div>
          <div className="ma-f"><span className="small muted">Linked cases</span><span>{prop.caseIds.map(function (id) { return <a key={id} href={'#/cases/' + id} style={{ marginRight: 8 }}>{id}</a>; })}</span></div>
          <div className="ma-f wide"><span className="small muted">Description</span><span>{prop.description || '—'}</span></div>
        </div>
      </Panel>
      <Section title="Legal searches">
        <Table rowKey={function (s: LegalSearch) { return s.id; }} rows={prop.searches}
          cols={[
            { head: 'Search', render: function (s) { return <b>{title(s.type)} search</b>; } },
            { head: 'Status', render: function (s) { return <Chip tone={s.status === 'COMPLETED' ? 'dark' : 'orange'}>{title(s.status)}</Chip>; } },
            { head: 'Result', render: function (s) { return s.result ? <Chip tone={s.result === 'ADVERSE' ? 'solid' : s.result === 'CLEAR' ? 'line' : 'orange'}>{title(s.result)}</Chip> : '—'; } },
            { head: 'Requested', render: function (s) { return fmtDate(s.requestedAt); } },
            { head: 'Notes', render: function (s) { return s.notes || '—'; } },
            { head: '', render: function (s) {
              if (s.status === 'COMPLETED' || !canRecord) { return null; }
              return (
                <span className="ma-row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                  <select aria-label="Result" value={result[s.type] || ''} onChange={function (e) { setResult({ ...result, [s.type]: e.target.value }); }}><option value="">Result…</option><option value="CLEAR">Clear</option><option value="CLEAR_WITH_NOTES">Clear with notes</option><option value="ADVERSE">Adverse</option></select>
                  <input aria-label="Notes" placeholder="Notes" value={notes[s.type] || ''} onChange={function (e) { setNotes({ ...notes, [s.type]: e.target.value }); }} style={{ width: 120 }} />
                  <Button small primary disabled={!result[s.type]} onClick={function () { void act(function () { return app.client.recordSearch(prop.id, s.type, result[s.type] as NonNullable<LegalSearch['result']>, notes[s.type] || ''); }, title(s.type) + ' search recorded.'); }}>Record</Button>
                </span>
              );
            } }
          ]} />
        <div className="small muted" style={{ marginTop: 6 }}>Results are entered here and attached from the Lands Commission. Where an integration is available the result arrives automatically.</div>
      </Section>
    </div>
  );
}

export function PropertiesPage(): JSX.Element {
  const app = useApp();
  const res = useAsync(function () { return app.client.listProperties(); });
  const [q, setQ] = React.useState('');
  const [enc, setEnc] = React.useState('');
  const sel = app.route.query.id;
  if (res.loading) { return <Loading />; }
  if (res.error) { return <ErrorNote message={res.error} />; }
  const all = res.data || [];
  const list = all.filter(function (x) {
    return (!q || (x.address + x.titleNumber + x.registeredOwner).toLowerCase().indexOf(q.toLowerCase()) >= 0) && (!enc || x.encumbrance === enc);
  });
  const current = all.filter(function (x) { return x.id === sel; })[0];
  return (
    <>
      <Head title="Property repository" sub="One record per property, kept across applications. A title number can sit in only one active application at a time." />
      {current ? (
        <>
          <div className="small"><a href="#/properties" onClick={function (e) { e.preventDefault(); app.go('/properties'); }}>← All properties</a></div>
          <PropertyBlock prop={current} />
        </>
      ) : (
        <>
          <div className="ma-fgrid" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <TextField id="pq" label="Search" value={q} onChange={setQ} hint="Address, title number or owner" />
            <SelectField id="penc" label="Encumbrance" value={enc} onChange={setEnc} options={[['NONE', 'None'], ['EXISTING_CHARGE', 'Existing charge'], ['UNKNOWN', 'Unknown']]} />
          </div>
          <Table rowKey={function (x: Property) { return x.id; }} rows={list} empty="No properties match." onRow={function (x) { app.go('/properties?id=' + x.id); }}
            cols={[
              { head: 'Property', render: function (x) { return <><b>{x.address}</b><div className="small muted">Title {x.titleNumber}</div></>; } },
              { head: 'Owner', render: function (x) { return x.registeredOwner || '—'; } },
              { head: 'Region', render: function (x) { return x.region; } },
              { head: 'Tenure', render: function (x) { return title(x.ownershipType); } },
              { head: 'Searches', render: function (x) { return x.searches.filter(function (s) { return s.status === 'COMPLETED'; }).length + ' of ' + x.searches.length + ' done'; } },
              { head: 'Encumbrance', render: function (x) { return <Chip tone={x.encumbrance === 'NONE' ? 'dark' : x.encumbrance === 'UNKNOWN' ? 'idle' : 'solid'}>{title(x.encumbrance)}</Chip>; } },
              { head: 'Cases', right: true, render: function (x) { return String(x.caseIds.length); } }
            ]} />
          <Note>Open a property to see its legal searches and linked cases.</Note>
        </>
      )}
    </>
  );
}

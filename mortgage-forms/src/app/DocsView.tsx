import * as React from 'react';
import { DocItem, docItems } from './docsDef';
import { FormValues, ProductCode } from './formDef';
import { FormStore, StoredDoc, checkFile } from './store';
import { Button, Chip, Head, Note, Panel, RadioField, Section, TextField } from './ui';

export interface DocsViewProps {
  product: ProductCode;
  store: FormStore;
  docs: StoredDoc[];
  meta: FormValues;
  setMeta: (patch: FormValues) => void;
  /** Which signed forms are complete, by DocItem.here key. */
  signed: { [k: string]: boolean };
  refresh: () => void;
  say: (m: string) => void;
  openForm: (id: 'application' | 'consent' | 'request') => void;
  back: () => void;
}

export function ctxOf(product: ProductCode, meta: FormValues): { product: ProductCode; married: boolean; privateVendor: boolean } {
  return { product, married: meta.docs_married === 'yes', privateVendor: meta.docs_private === 'yes' };
}

/** Required items that are still missing, so the submit button and this page agree. */
export function missingDocs(product: ProductCode, meta: FormValues, docs: StoredDoc[]): DocItem[] {
  return docItems(ctxOf(product, meta)).filter(function (i) {
    return i.stage === 'pre' && !i.here && i.required && !docs.some(function (d) { return d.key === i.key; });
  });
}

function fmt(iso: string): string { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }

export function DocsView(p: DocsViewProps): JSX.Element {
  const [other, setOther] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const items = docItems(ctxOf(p.product, p.meta));
  const pre = items.filter(function (i) { return i.stage === 'pre'; });
  const post = items.filter(function (i) { return i.stage === 'post'; });
  const others = p.docs.filter(function (d) { return d.key.indexOf('other') === 0; });
  const missing = missingDocs(p.product, p.meta, p.docs);

  const upload = function (key: string, files: FileList | null): void {
    if (!files || !files.length) { return; }
    const file = files[0];
    const bad = checkFile(file);
    if (bad) { p.say(bad); return; }
    setBusy(true);
    p.store.upload(p.product, key, file).then(function () { p.say('Uploaded ' + file.name); p.refresh(); }, function (e) { p.say(String(e)); }).then(function () { setBusy(false); });
  };
  const sample = function (key: string): void {
    if (!p.store.attachSample) { return; }
    p.store.attachSample(p.product, key).then(function () { p.refresh(); });
  };
  const remove = function (d: StoredDoc): void { p.store.removeDoc(p.product, d).then(function () { p.say('Removed ' + d.name); p.refresh(); }, function (e) { p.say(String(e)); }); };

  const actions = function (key: string, haveAny: boolean, label?: string): JSX.Element {
    return (
      <span className="mf-row" style={{ justifyContent: 'flex-end' }}>
        {p.store.attachSample ? <Button small onClick={function () { sample(key); }}>Attach sample</Button> : null}
        <label className={'mf-btn sm' + (haveAny ? '' : ' pri')} style={{ cursor: 'pointer' }}>
          {label || (haveAny ? 'Add another' : 'Upload')}
          <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" disabled={busy} onChange={function (e) { upload(key, e.target.files); e.target.value = ''; }} />
        </label>
      </span>
    );
  };

  const row = function (i: DocItem): JSX.Element {
    const mine = p.docs.filter(function (d) { return d.key === i.key; });
    let status: JSX.Element;
    if (i.here) { status = p.signed[i.here] ? <Chip tone="dark">Signed on this page</Chip> : <Chip tone="solid">Sign the form</Chip>; }
    else if (mine.length) { status = <Chip tone="dark">Uploaded</Chip>; }
    else { status = i.required ? <Chip tone="solid">Missing</Chip> : <Chip tone="idle">Optional</Chip>; }
    return (
      <tr key={i.key}>
        <td>
          <b>{i.label}</b>
          {i.hint ? <div className="small muted">{i.hint}</div> : null}
          {i.fee ? <div className="small" style={{ color: '#A04000', fontWeight: 600 }}>Fee to pay: {i.fee}</div> : null}
        </td>
        <td>{status}</td>
        <td className="small">{mine.map(function (d) { return <div key={d.name + d.at}>{d.name} <span className="muted">· {d.sizeKb} KB · {fmt(d.at)}</span> <button type="button" className="mf-btn sm" onClick={function () { remove(d); }} aria-label={'Remove ' + d.name}>Remove</button></div>; })}{mine.length === 0 ? '—' : null}</td>
        <td className="right">{i.here ? <Button small primary={!p.signed[i.here]} onClick={function () { p.openForm(i.here as 'application' | 'consent' | 'request'); }}>{p.signed[i.here] ? 'Review' : 'Open form'}</Button> : actions(i.key, mine.length > 0)}</td>
      </tr>
    );
  };

  const head = <thead><tr><th>Document</th><th>Status</th><th>Files</th><th /></tr></thead>;
  return (
    <>
      <Head title="Supporting documents" sub="Upload each document next to the requirement it answers. PDF, JPG or PNG, up to 10 MB each." actions={<Button onClick={p.back}>Back to the pack</Button>} />
      {p.store.attachSample ? <Note><b>Preview.</b> Some preview windows block the file picker. Use <b>Attach sample</b> on any row to move on.</Note> : null}
      <Panel title="Tell us what applies">
        <div className="mf-fgrid">
          <RadioField id="d-married" label="Are you married?" value={String(p.meta.docs_married || '')} options={[['yes', 'Yes'], ['no', 'No']]} hint="Adds the spouse’s Ghana card and the marriage certificate." onChange={function (v) { p.setMeta({ docs_married: v }); }} />
          {p.product === 'HOME_PURCHASE' ? <RadioField id="d-private" label="Is the vendor a private vendor?" value={String(p.meta.docs_private || '')} options={[['yes', 'Yes'], ['no', 'No']]} hint="Adds the vendor documents." onChange={function (v) { p.setMeta({ docs_private: v }); }} /> : null}
        </div>
      </Panel>
      <Section title={'Pre-approval documents' + (missing.length ? ' · ' + missing.length + ' still needed' : ' · all required documents are in')}>
        <div className="mf-tw"><table className="mf-t">{head}<tbody>{pre.map(row)}</tbody></table></div>
      </Section>
      <Section title="After approval" aside="Upload these when you have them">
        <div className="mf-tw"><table className="mf-t">{head}<tbody>{post.map(row)}</tbody></table></div>
      </Section>
      <Section title="Other documents">
        <div className="small muted" style={{ marginBottom: 8 }}>Anything else that supports your application. Describe it, then upload.</div>
        <div className="mf-fgrid">
          <TextField id="d-other" label="What is this document?" value={other} onChange={setOther} hint="For example: letter from the developer" />
        </div>
        <div style={{ marginTop: 8 }}>{actions('other' + (other.trim() ? '-' + other.trim().replace(/[^A-Za-z0-9 ]/g, '').slice(0, 40) : ''), others.length > 0, 'Upload another document')}</div>
        {others.length ? <div className="small" style={{ marginTop: 8 }}>{others.map(function (d) { return <div key={d.name + d.at}>{d.key.length > 5 ? d.key.slice(6) + ': ' : ''}{d.name} <span className="muted">· {d.sizeKb} KB</span> <button type="button" className="mf-btn sm" onClick={function () { remove(d); }}>Remove</button></div>; })}</div> : null}
      </Section>
    </>
  );
}

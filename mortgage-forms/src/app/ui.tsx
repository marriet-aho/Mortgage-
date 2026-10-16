import * as React from 'react';

export function Chip(p: { tone?: 'grey' | 'dark' | 'orange' | 'solid' | 'line' | 'idle'; children?: React.ReactNode; title?: string }): JSX.Element {
  return <span className={'mf-chip ' + (p.tone || 'grey')} title={p.title}>{p.children}</span>;
}

export function Button(p: { children?: React.ReactNode; onClick?: () => void; primary?: boolean; small?: boolean; disabled?: boolean; title?: string }): JSX.Element {
  return (
    <button type="button" className={'mf-btn' + (p.primary ? ' pri' : '') + (p.small ? ' sm' : '')} onClick={p.onClick} disabled={p.disabled} title={p.title}>
      {p.children}
    </button>
  );
}

export function Head(p: { title: string; sub?: string; actions?: React.ReactNode }): JSX.Element {
  return (
    <div className="mf-head">
      <div>
        <h1>{p.title}</h1>
        {p.sub ? <p>{p.sub}</p> : null}
      </div>
      {p.actions ? <div className="mf-row">{p.actions}</div> : null}
    </div>
  );
}

export function Section(p: { title: string; aside?: string; children?: React.ReactNode }): JSX.Element {
  return (
    <section>
      <div className="mf-sec"><h2>{p.title}</h2>{p.aside ? <span className="small muted" style={{ order: 3, paddingLeft: 10, alignSelf: 'center' }}>{p.aside}</span> : null}</div>
      {p.children}
    </section>
  );
}

export function Panel(p: { children?: React.ReactNode; title?: string; style?: React.CSSProperties }): JSX.Element {
  return <div className="mf-panel" style={p.style}>{p.title ? <h3 style={{ marginBottom: 10 }}>{p.title}</h3> : null}{p.children}</div>;
}

export function Note(p: { children?: React.ReactNode; tone?: 'grey' | 'need' | 'ok' }): JSX.Element {
  return <div className={p.tone === 'need' ? 'mf-need' : p.tone === 'ok' ? 'mf-ok' : 'mf-note'}>{p.children}</div>;
}

export function Loading(): JSX.Element {
  return <div className="mf-note">Loading…</div>;
}

export function ErrorNote(p: { message: string }): JSX.Element {
  return <div className="mf-need"><b>Something went wrong.</b> {p.message}</div>;
}

/* ---------------- form fields ---------------- */

interface FieldBase {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  wide?: boolean;
  id: string;
}

function Wrap(p: FieldBase & { children?: React.ReactNode; group?: boolean }): JSX.Element {
  return (
    <div className={'mf-f' + (p.wide ? ' wide' : '') + (p.error ? ' bad' : '')}>
      {p.group ? <span className="lab">{p.label}{p.required ? <span className="req"> *</span> : null}</span> : <label htmlFor={p.id}>{p.label}{p.required ? <span className="req"> *</span> : null}</label>}
      {p.children}
      {p.hint ? <span className="hint">{p.hint}</span> : null}
      {p.error ? <span className="err" role="alert">{p.error}</span> : null}
    </div>
  );
}

export function TextField(p: FieldBase & { value: string | number | undefined; onChange: (v: string) => void; type?: string; readOnly?: boolean; disabled?: boolean }): JSX.Element {
  return (
    <Wrap {...p}>
      <input id={p.id} type={p.type || 'text'} value={p.value === undefined ? '' : p.value} readOnly={p.readOnly} disabled={p.disabled}
        onChange={function (e) { p.onChange(e.target.value); }} inputMode={p.type === 'number' ? 'decimal' : undefined} min={p.type === 'number' ? 0 : undefined} />
    </Wrap>
  );
}

export function NumberField(p: FieldBase & { value: number | undefined; onChange: (v: number) => void; disabled?: boolean }): JSX.Element {
  return (
    <Wrap {...p}>
      <input id={p.id} type="number" min={0} inputMode="decimal" value={p.value === undefined || p.value === 0 ? '' : p.value} disabled={p.disabled}
        onChange={function (e) { p.onChange(e.target.value === '' ? 0 : Number(e.target.value)); }} />
    </Wrap>
  );
}

export function TextArea(p: FieldBase & { value: string | undefined; onChange: (v: string) => void; disabled?: boolean }): JSX.Element {
  return (
    <Wrap {...p}>
      <textarea id={p.id} value={p.value || ''} disabled={p.disabled} onChange={function (e) { p.onChange(e.target.value); }} />
    </Wrap>
  );
}

export function SelectField(p: FieldBase & { value: string; options: Array<[string, string]>; onChange: (v: string) => void; disabled?: boolean }): JSX.Element {
  return (
    <Wrap {...p}>
      <select id={p.id} value={p.value} disabled={p.disabled} onChange={function (e) { p.onChange(e.target.value); }}>
        <option value="">Choose…</option>
        {p.options.map(function (o) { return <option key={o[0]} value={o[0]}>{o[1]}</option>; })}
      </select>
    </Wrap>
  );
}

export function RadioField(p: FieldBase & { value: string; options: Array<[string, string]>; onChange: (v: string) => void; disabled?: boolean }): JSX.Element {
  return (
    <Wrap {...p} group>
      <div className="mf-opts" role="radiogroup" aria-label={p.label}>
        {p.options.map(function (o) {
          return (
            <label key={o[0]} className="mf-opt">
              <input type="radio" name={p.id} value={o[0]} checked={p.value === o[0]} disabled={p.disabled} onChange={function () { p.onChange(o[0]); }} />
              {o[1]}
            </label>
          );
        })}
      </div>
    </Wrap>
  );
}

export function CheckField(p: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }): JSX.Element {
  return (
    <label className="mf-opt" style={{ alignSelf: 'flex-start' }}>
      <input id={p.id} type="checkbox" checked={p.checked} disabled={p.disabled} onChange={function (e) { p.onChange(e.target.checked); }} />
      {p.label}
    </label>
  );
}


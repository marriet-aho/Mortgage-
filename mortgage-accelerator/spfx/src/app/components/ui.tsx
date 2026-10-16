import * as React from 'react';
import { slaState } from '../domain/rules';
import { CaseState, Kpi, SlaClock, STATE_LABEL } from '../domain/types';
import { duration } from '../format';

export function Chip(p: { tone?: 'grey' | 'dark' | 'orange' | 'solid' | 'line' | 'idle'; children?: React.ReactNode; title?: string }): JSX.Element {
  return <span className={'ma-chip ' + (p.tone || 'grey')} title={p.title}>{p.children}</span>;
}

export function StateChip(p: { state: CaseState }): JSX.Element {
  const s = p.state;
  const tone = s === 'DECLINED' || s === 'WITHDRAWN' || s === 'EXPIRED' ? 'line' : s === 'CLOSED' || s === 'DRAFT' ? 'grey' : s === 'REFERRED' || s === 'ON_HOLD' ? 'orange' : 'dark';
  return <Chip tone={tone}>{STATE_LABEL[s]}</Chip>;
}

export function SlaChip(p: { clock?: SlaClock }): JSX.Element {
  if (!p.clock) {
    return <span className="muted">—</span>;
  }
  const s = slaState(p.clock, new Date());
  if (p.clock.pausedSince) {
    return <Chip tone="idle">Paused: waiting on applicant</Chip>;
  }
  return s.status === 'BREACHED' ? <Chip tone="solid">Overdue {duration(-s.remainingMs)}</Chip>
    : s.status === 'WARNING' ? <Chip tone="orange">{duration(s.remainingMs)} left</Chip>
    : <Chip tone="line">{duration(s.remainingMs)} left</Chip>;
}

export function Button(p: { children?: React.ReactNode; onClick?: () => void; primary?: boolean; small?: boolean; disabled?: boolean; title?: string }): JSX.Element {
  return (
    <button type="button" className={'ma-btn' + (p.primary ? ' pri' : '') + (p.small ? ' sm' : '')} onClick={p.onClick} disabled={p.disabled} title={p.title}>
      {p.children}
    </button>
  );
}

export function Head(p: { title: string; sub?: string; actions?: React.ReactNode }): JSX.Element {
  return (
    <div className="ma-head">
      <div>
        <h1>{p.title}</h1>
        {p.sub ? <p>{p.sub}</p> : null}
      </div>
      {p.actions ? <div className="ma-row">{p.actions}</div> : null}
    </div>
  );
}

export function Section(p: { title: string; aside?: string; children?: React.ReactNode }): JSX.Element {
  return (
    <section>
      <div className="ma-sec"><h2>{p.title}</h2>{p.aside ? <span className="small muted" style={{ order: 3, paddingLeft: 10, alignSelf: 'center' }}>{p.aside}</span> : null}</div>
      {p.children}
    </section>
  );
}

export function Panel(p: { children?: React.ReactNode; title?: string; style?: React.CSSProperties }): JSX.Element {
  return <div className="ma-panel" style={p.style}>{p.title ? <h3 style={{ marginBottom: 10 }}>{p.title}</h3> : null}{p.children}</div>;
}

export function Note(p: { children?: React.ReactNode; tone?: 'grey' | 'need' | 'ok' }): JSX.Element {
  return <div className={p.tone === 'need' ? 'ma-need' : p.tone === 'ok' ? 'ma-ok' : 'ma-note'}>{p.children}</div>;
}

export function Kpis(p: { items: Kpi[] }): JSX.Element {
  return (
    <div className="ma-kpis">
      {p.items.map(function (k) {
        return (
          <div key={k.label} className={'ma-kpi' + (k.tone === 'ALERT' ? ' alert' : '')}>
            <div className="v">{k.value}{k.trend === 'UP' ? ' ↑' : k.trend === 'DOWN' ? ' ↓' : ''}</div>
            <div className="l">{k.label}</div>
            {k.hint ? <div className="h">{k.hint}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

export interface Col<T> {
  head: string;
  render: (row: T) => React.ReactNode;
  right?: boolean;
  nowrap?: boolean;
}

export function Table<T>(p: { cols: Array<Col<T>>; rows: T[]; onRow?: (row: T) => void; selected?: (row: T) => boolean; empty?: string; rowKey: (row: T) => string }): JSX.Element {
  if (p.rows.length === 0) {
    return <div className="ma-note">{p.empty || 'Nothing here.'}</div>;
  }
  return (
    <div className="ma-tw">
      <table className="ma-t">
        <thead><tr>{p.cols.map(function (c) { return <th key={c.head} className={c.right ? 'right' : ''}>{c.head}</th>; })}</tr></thead>
        <tbody>
          {p.rows.map(function (r) {
            const cls = (p.onRow ? 'click ' : '') + (p.selected && p.selected(r) ? 'sel' : '');
            return (
              <tr key={p.rowKey(r)} className={cls} onClick={p.onRow ? function () { p.onRow && p.onRow(r); } : undefined}>
                {p.cols.map(function (c) { return <td key={c.head} className={(c.right ? 'right num ' : '') + (c.nowrap ? 'nowrap' : '')}>{c.render(r)}</td>; })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function Tabs(p: { tabs: Array<{ id: string; label: string; count?: number }>; active: string; onChange: (id: string) => void }): JSX.Element {
  return (
    <div className="ma-tabs" role="tablist">
      {p.tabs.map(function (t) {
        return (
          <button key={t.id} type="button" role="tab" className="ma-tab" aria-selected={t.id === p.active} onClick={function () { p.onChange(t.id); }}>
            {t.label}{t.count ? <span className="ma-badge" style={{ marginLeft: 6 }}>{t.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

export function Loading(): JSX.Element {
  return <div className="ma-note">Loading…</div>;
}

export function ErrorNote(p: { message: string }): JSX.Element {
  return <div className="ma-need"><b>Something went wrong.</b> {p.message}</div>;
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
    <div className={'ma-f' + (p.wide ? ' wide' : '') + (p.error ? ' bad' : '')}>
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
      <div className="ma-opts" role="radiogroup" aria-label={p.label}>
        {p.options.map(function (o) {
          return (
            <label key={o[0]} className="ma-opt">
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
    <label className="ma-opt" style={{ alignSelf: 'flex-start' }}>
      <input id={p.id} type="checkbox" checked={p.checked} disabled={p.disabled} onChange={function (e) { p.onChange(e.target.checked); }} />
      {p.label}
    </label>
  );
}

export function Progress(p: { pct: number; label?: string }): JSX.Element {
  return (
    <div className="ma-row" style={{ gap: 12, flexWrap: 'nowrap' }}>
      <div className="ma-bar" style={{ flex: 1 }} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p.pct)}><i style={{ width: Math.max(0, Math.min(100, p.pct)) + '%' }} /></div>
      <b className="num">{Math.round(p.pct)}%</b>
      {p.label ? <span className="small muted">{p.label}</span> : null}
    </div>
  );
}

export function ScoreRing(p: { score: number; label: string }): JSX.Element {
  const r = 38;
  const c = 2 * Math.PI * r;
  const dash = (Math.max(0, Math.min(100, p.score)) / 100) * c;
  return (
    <svg className="ma-ring" viewBox="0 0 92 92" role="img" aria-label={p.label + ' ' + p.score + ' out of 100'}>
      <circle cx="46" cy="46" r={r} fill="none" stroke="#E6E3E0" strokeWidth="9" />
      <circle cx="46" cy="46" r={r} fill="none" stroke="#F26A1B" strokeWidth="9" strokeLinecap="round" strokeDasharray={dash + ' ' + c} transform="rotate(-90 46 46)" />
      <text x="46" y="50" textAnchor="middle" fontSize="22" fontWeight="700" fill="#2B2927">{p.score}</text>
    </svg>
  );
}

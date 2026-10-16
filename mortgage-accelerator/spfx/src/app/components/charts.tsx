import * as React from 'react';

/** Dependency-free SVG charts in the module palette: orange for the focus series, greys for the rest. */
const O = '#F26A1B';
const G7 = '#55514E';
const G4 = '#A6A19D';
const G2 = '#E6E3E0';

export function BarChart(p: { data: Array<{ label: string; a: number; b?: number }>; aLabel: string; bLabel?: string; height?: number }): JSX.Element {
  const w = 520, h = p.height || 200, pad = { l: 30, r: 8, t: 10, b: 26 };
  const max = Math.max(1, ...p.data.map(function (d) { return d.a + (d.b || 0); }));
  const bw = (w - pad.l - pad.r) / p.data.length;
  const y = function (v: number): number { return pad.t + (h - pad.t - pad.b) * (1 - v / max); };
  return (
    <div>
      <svg className="ma-chart" viewBox={'0 0 ' + w + ' ' + h} role="img" aria-label={p.aLabel + (p.bLabel ? ' and ' + p.bLabel : '')}>
        {[0, 0.5, 1].map(function (t) { return <g key={t}><line x1={pad.l} x2={w - pad.r} y1={y(max * t)} y2={y(max * t)} stroke={G2} /><text x={pad.l - 4} y={y(max * t) + 4} textAnchor="end">{Math.round(max * t)}</text></g>; })}
        {p.data.map(function (d, i) {
          const x = pad.l + i * bw + bw * 0.18, ww = bw * 0.64;
          return (
            <g key={d.label}>
              <rect x={x} y={y(d.a)} width={ww} height={y(0) - y(d.a)} fill={O} rx={2} />
              {d.b ? <rect x={x} y={y(d.a + d.b)} width={ww} height={y(d.a) - y(d.a + d.b)} fill={G4} rx={2} /> : null}
              <text x={x + ww / 2} y={h - 8} textAnchor="middle">{d.label}</text>
            </g>
          );
        })}
      </svg>
      <div className="ma-legend"><span><i style={{ background: O }} />{p.aLabel}</span>{p.bLabel ? <span><i style={{ background: G4 }} />{p.bLabel}</span> : null}</div>
    </div>
  );
}

export function HBars(p: { data: Array<{ label: string; value: number; target?: number }>; unit?: string; focusOver?: boolean }): JSX.Element {
  const max = Math.max(1, ...p.data.map(function (d) { return Math.max(d.value, d.target || 0); }));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr max-content', gap: '8px 10px', alignItems: 'center', fontSize: 13 }}>
      {p.data.map(function (d) {
        const over = d.target !== undefined && d.value > d.target;
        return (
          <React.Fragment key={d.label}>
            <span style={{ color: G7 }}>{d.label}</span>
            <div style={{ position: 'relative', height: 14, borderLeft: '1px solid #D2CECA' }}>
              <div style={{ position: 'absolute', top: 0, height: 14, width: (d.value / max) * 100 + '%', background: over && p.focusOver !== false ? O : G7, borderRadius: '0 3px 3px 0' }} />
              {d.target !== undefined ? <div title={'Target ' + d.target} style={{ position: 'absolute', top: -3, height: 20, width: 2, left: (d.target / max) * 100 + '%', background: '#2B2927' }} /> : null}
            </div>
            <span className="num">{d.value}{p.unit || ''}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function StackedHBars(p: { data: Array<{ label: string; ok: number; bad: number }> }): JSX.Element {
  const max = Math.max(1, ...p.data.map(function (d) { return d.ok + d.bad; }));
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr max-content', gap: '8px 10px', alignItems: 'center', fontSize: 13 }}>
        {p.data.map(function (d) {
          return (
            <React.Fragment key={d.label}>
              <span style={{ color: G7 }}>{d.label}</span>
              <div style={{ display: 'flex', height: 14, width: ((d.ok + d.bad) / max) * 100 + '%' }}>
                <div style={{ flex: d.ok, background: G7, borderRadius: '0 0 0 0' }} />
                <div style={{ flex: d.bad, background: O }} />
              </div>
              <span className="num">{d.bad} late</span>
            </React.Fragment>
          );
        })}
      </div>
      <div className="ma-legend" style={{ marginTop: 8 }}><span><i style={{ background: G7 }} />On time</span><span><i style={{ background: O }} />Breached</span></div>
    </div>
  );
}

export function Funnel(p: { rows: Array<{ label: string; count: number; value: string }> }): JSX.Element {
  const max = Math.max(1, ...p.rows.map(function (r) { return r.count; }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {p.rows.map(function (r, i) {
        return (
          <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 90px', gap: 10, alignItems: 'center', fontSize: 13 }}>
            <span style={{ color: G7 }}>{r.label}</span>
            <div style={{ background: '#F1EFED', height: 20, borderRadius: 3 }}>
              <div style={{ width: Math.max(r.count ? 4 : 0, (r.count / max) * 100) + '%', height: 20, background: i === 0 ? O : G7, borderRadius: 3, color: '#fff', paddingLeft: 6, lineHeight: '20px', fontWeight: 600 }}>{r.count || ''}</div>
            </div>
            <span className="num muted" style={{ textAlign: 'right' }}>{r.value}</span>
          </div>
        );
      })}
    </div>
  );
}

export function Donut(p: { parts: Array<{ label: string; value: number }>; centre: string }): JSX.Element {
  const total = Math.max(1, p.parts.reduce(function (s, x) { return s + x.value; }, 0));
  const shades = [O, G7, G4, '#D2CECA'];
  const r = 42, c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="ma-row" style={{ gap: 18 }}>
      <svg viewBox="0 0 120 120" width={130} height={130} role="img" aria-label={p.centre}>
        {p.parts.map(function (x, i) {
          const len = (x.value / total) * c;
          const el = <circle key={x.label} cx="60" cy="60" r={r} fill="none" stroke={shades[i % shades.length]} strokeWidth="16" strokeDasharray={len + ' ' + (c - len)} strokeDashoffset={-offset} transform="rotate(-90 60 60)" />;
          offset += len;
          return el;
        })}
        <text x="60" y="64" textAnchor="middle" fontSize="13" fontWeight="700" fill="#2B2927">{p.centre}</text>
      </svg>
      <div className="ma-legend" style={{ flexDirection: 'column', gap: 6 }}>
        {p.parts.map(function (x, i) { return <span key={x.label}><i style={{ background: shades[i % shades.length] }} />{x.label}: <b>{x.value}</b></span>; })}
      </div>
    </div>
  );
}

export function Sparkline(p: { values: number[]; width?: number; height?: number }): JSX.Element {
  const w = p.width || 120, h = p.height || 30;
  const max = Math.max(1, ...p.values), min = Math.min(...p.values);
  const pts = p.values.map(function (v, i) { return (i / Math.max(1, p.values.length - 1)) * (w - 4) + 2 + ',' + (h - 3 - ((v - min) / Math.max(1, max - min)) * (h - 6)); }).join(' ');
  return <svg viewBox={'0 0 ' + w + ' ' + h} width={w} height={h} aria-hidden="true"><polyline points={pts} fill="none" stroke={O} strokeWidth="2" /></svg>;
}

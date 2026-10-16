import * as React from 'react';
import { Button } from './ui';

/** Value stored with the form: a drawn image or a typed name, with who and when. */
export interface SignatureValue { mode: 'draw' | 'type'; data: string; name: string; at: string }

export function parseSignature(s: string | boolean | undefined): SignatureValue | undefined {
  if (typeof s !== 'string' || !s) { return undefined; }
  try { return JSON.parse(s) as SignatureValue; } catch (e) { return undefined; }
}

/**
 * Electronic signature: draw with a mouse, finger or pen, or type your full name.
 * The signature is saved with the form together with a time stamp.
 */
export function SignaturePad(p: { id: string; label: string; signerName: string; value: string | boolean | undefined; onChange: (v: string) => void; error?: string }): JSX.Element {
  const sig = parseSignature(p.value);
  const [mode, setMode] = React.useState<'draw' | 'type'>('draw');
  const [typed, setTyped] = React.useState('');
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const dirty = React.useRef(false);

  const pos = function (e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const r = e.currentTarget.getBoundingClientRect();
    return [(e.clientX - r.left) * (e.currentTarget.width / r.width), (e.clientY - r.top) * (e.currentTarget.height / r.height)];
  };
  const down = function (e: React.PointerEvent<HTMLCanvasElement>): void {
    const c = canvas.current; if (!c) { return; }
    const ctx = c.getContext('2d'); if (!ctx) { return; }
    drawing.current = true; dirty.current = true;
    c.setPointerCapture(e.pointerId);
    const [x, y] = pos(e);
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#2B2927';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.1, y + 0.1); ctx.stroke();
  };
  const move = function (e: React.PointerEvent<HTMLCanvasElement>): void {
    if (!drawing.current) { return; }
    const ctx = e.currentTarget.getContext('2d'); if (!ctx) { return; }
    const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke();
  };
  const up = function (): void { drawing.current = false; };
  const clear = function (): void {
    const c = canvas.current; if (!c) { return; }
    const ctx = c.getContext('2d'); if (ctx) { ctx.clearRect(0, 0, c.width, c.height); }
    dirty.current = false;
  };
  const sign = function (): void {
    let data = '';
    if (mode === 'draw') {
      const c = canvas.current; if (!c || !dirty.current) { return; }
      data = c.toDataURL('image/png');
    } else {
      if (typed.trim().length < 3) { return; }
      data = typed.trim();
    }
    p.onChange(JSON.stringify({ mode, data, name: p.signerName, at: new Date().toISOString() } as SignatureValue));
  };

  if (sig) {
    return (
      <div className="ma-f wide" id={p.id}>
        <span className="lab">{p.label}</span>
        <div style={{ border: '1px solid #F6B48A', background: '#FDEEE3', borderRadius: 8, padding: 12 }}>
          {sig.mode === 'draw'
            ? <img src={sig.data} alt={'Signature of ' + sig.name} style={{ maxHeight: 70, background: '#fff', borderRadius: 4, border: '1px solid #E6E3E0' }} />
            : <div style={{ fontFamily: '"Segoe Script","Brush Script MT",cursive', fontSize: 28, color: '#2B2927' }}>{sig.data}</div>}
          <div className="small" style={{ marginTop: 6 }}>Signed electronically by <b>{sig.name}</b> on {new Date(sig.at).toLocaleString('en-GB')}</div>
          <div style={{ marginTop: 8 }}><Button small onClick={function () { p.onChange(''); }}>Sign again</Button></div>
        </div>
      </div>
    );
  }
  return (
    <div className="ma-f wide" id={p.id}>
      <span className="lab">{p.label} <span aria-hidden="true">*</span></span>
      <div style={{ border: '1px solid #D2CECA', borderRadius: 8, padding: 12, background: '#fff' }}>
        <div className="ma-row" style={{ marginBottom: 8 }}>
          <Button small primary={mode === 'draw'} onClick={function () { setMode('draw'); }}>Draw signature</Button>
          <Button small primary={mode === 'type'} onClick={function () { setMode('type'); }}>Type signature</Button>
        </div>
        {mode === 'draw' ? (
          <>
            <canvas ref={canvas} width={560} height={140} aria-label="Signature pad: draw your signature" data-testid="sig-canvas"
              style={{ width: '100%', maxWidth: 560, height: 140, border: '1px dashed #A6A19D', borderRadius: 6, touchAction: 'none', background: '#F8F7F6', cursor: 'crosshair' }}
              onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
            <div className="small muted">Sign inside the box with your mouse, finger or pen.</div>
            <div className="ma-row" style={{ marginTop: 6 }}><Button small onClick={clear}>Clear</Button></div>
          </>
        ) : (
          <>
            <input aria-label="Type your full name to sign" placeholder={'Type your full name: ' + p.signerName} value={typed} onChange={function (e) { setTyped(e.target.value); }}
              style={{ width: '100%', maxWidth: 560, padding: '10px 12px', border: '1px solid #D2CECA', borderRadius: 6, fontFamily: '"Segoe Script","Brush Script MT",cursive', fontSize: 22 }} />
            <div className="small muted">Typing your full name has the same effect as signing.</div>
          </>
        )}
        <div style={{ marginTop: 8 }}><Button primary onClick={sign}>Apply my signature</Button></div>
        <div className="small muted" style={{ marginTop: 6 }}>By signing you confirm you are {p.signerName}. The date, time and your name are saved with the form.</div>
      </div>
      {p.error ? <span style={{ color: '#A04000', fontWeight: 600 }}>{p.error}</span> : null}
    </div>
  );
}

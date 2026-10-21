import * as React from 'react';
import { ProductCode } from './formDef';
import { feeLines, feeTotals, ghs } from './fees';
import { Button, CheckField, Note } from './ui';

/** Always-visible reminder of what the person will pay, with the line that matters at this step highlighted. */
export function FeeStrip(p: { product: ProductCode; propertyValue: number; focus?: string; message?: string }): JSX.Element {
  const [open, setOpen] = React.useState(false);
  const lines = feeLines(p.product, p.propertyValue);
  const t = feeTotals(lines);
  return (
    <div className="mf-panel" style={{ background: '#FDEEE3', borderColor: '#F6B48A' }} role="note" aria-label="Fees you will pay">
      <div className="mf-row" style={{ justifyContent: 'space-between' }}>
        <div>
          <b>Fees you will pay in this process.</b>{' '}
          <span>About {ghs(t.min)} to {ghs(t.max)} plus insurance premiums.</span>
          {p.message ? <div style={{ marginTop: 4, color: '#A04000', fontWeight: 600 }}>{p.message}</div> : null}
        </div>
        <Button small onClick={function () { setOpen(!open); }}>{open ? 'Hide fees' : 'See the fees'}</Button>
      </div>
      {open ? (
        <>
          <div className="mf-tw" style={{ marginTop: 8 }}>
            <table className="mf-t" style={{ minWidth: 0 }}><tbody>
              {lines.map(function (l, i) {
                return (
                  <tr key={l.key} style={p.focus === l.key ? { background: '#fff', fontWeight: 600 } : undefined}>
                    <td>{i + 1}. {l.label}<div className="small muted">{l.basis}. {l.when}.</div></td>
                    <td className="right num">{l.max === 0 ? 'Quoted by insurer' : l.min === l.max ? ghs(l.min) : ghs(l.min) + ' to ' + ghs(l.max)}</td>
                  </tr>
                );
              })}
            </tbody></table>
          </div>
          <div className="small muted" style={{ marginTop: 6 }}>All fees are payable by you in advance and are not returnable once expended, whether or not an offer is made. The registration fee uses the property value{p.propertyValue ? ' of ' + ghs(p.propertyValue) : ' (enter it in the application or on the documents page)'}.</div>
        </>
      ) : null}
    </div>
  );
}

/** Asks for explicit acknowledgement before the forms are submitted. */
export function FeeAcknowledgement(p: { product: ProductCode; propertyValue: number; onCancel: () => void; onConfirm: () => void }): JSX.Element {
  const [ok, setOk] = React.useState(false);
  const lines = feeLines(p.product, p.propertyValue);
  const t = feeTotals(lines);
  return (
    <div role="dialog" aria-modal="true" aria-label="Fees you will pay" style={{ position: 'fixed', inset: 0, background: 'rgba(43,41,39,.55)', display: 'grid', placeItems: 'center', zIndex: 60, padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 22, maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
        <h2 style={{ margin: '0 0 6px', color: '#D95400' }}>Before you submit: the fees you will pay</h2>
        <p style={{ margin: '0 0 10px' }}>These are the fees on the bank’s requirements sheet. You pay them as the process moves forward.</p>
        <table className="mf-t" style={{ minWidth: 0 }}><tbody>
          {lines.map(function (l, i) { return <tr key={l.key}><td>{i + 1}. {l.label}<div className="small muted">{l.when}</div></td><td className="right num">{l.max === 0 ? 'Quoted by insurer' : l.min === l.max ? ghs(l.min) : ghs(l.min) + ' to ' + ghs(l.max)}</td></tr>; })}
          <tr><td><b>Estimated total, before insurance</b></td><td className="right num"><b>{ghs(t.min)} to {ghs(t.max)}</b></td></tr>
        </tbody></table>
        <div style={{ margin: '12px 0' }}><CheckField id="f-fee-ack" label="I understand these fees are payable by me in advance and are not returnable once expended, whether or not an offer is made." checked={ok} onChange={setOk} /></div>
        <div className="mf-row" style={{ justifyContent: 'flex-end' }}>
          <Button onClick={p.onCancel}>Cancel</Button>
          <Button primary disabled={!ok} onClick={p.onConfirm}>Submit and go to Advance Flow</Button>
        </div>
      </div>
    </div>
  );
}

export function FeeNote(p: { children: React.ReactNode }): JSX.Element { return <Note tone="need"><b>Fee reminder.</b> {p.children}</Note>; }

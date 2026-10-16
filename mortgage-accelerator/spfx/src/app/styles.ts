/**
 * Design system: orange (primary), grey and white only.
 * Injected once as a <style> element, scoped under .ma-root so it cannot leak into the
 * SharePoint page and SharePoint's own CSS cannot reach in.
 */
export const CSS = `
.ma-root{
  --o:#F26A1B;--o-strong:#D95400;--o-ink:#A04000;--o-tint:#FDEEE3;--o-line:#F6B48A;
  --ink:#2B2927;--g700:#55514E;--g600:#6A6561;--g500:#7B7672;--g400:#A6A19D;--g300:#D2CECA;--g200:#E6E3E0;--g100:#F1EFED;--g50:#F8F7F6;--w:#fff;
  font-family:'Segoe UI','IBM Plex Sans',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.45;color:var(--ink);
  background:var(--w);box-sizing:border-box;min-height:600px;
}
.ma-root *,.ma-root *::before,.ma-root *::after{box-sizing:border-box}
.ma-root h1,.ma-root h2,.ma-root h3{margin:0;font-weight:600;line-height:1.2}
.ma-root h1{font-size:24px}.ma-root h2{font-size:16px}.ma-root h3{font-size:14px}
.ma-root p{margin:0}.ma-root a{color:var(--o-ink)}
.ma-root button,.ma-root input,.ma-root select,.ma-root textarea{font:inherit;color:inherit}
.ma-root :focus-visible{outline:2px solid var(--o);outline-offset:2px}
.ma-root .muted{color:var(--g500)}.ma-root .small{font-size:12.5px}.ma-root .num{font-variant-numeric:tabular-nums}
.ma-root .right{text-align:right}.ma-root .nowrap{white-space:nowrap}

.ma-shell{display:grid;grid-template-columns:232px minmax(0,1fr);min-height:640px}
.ma-side{background:var(--g100);border-right:1px solid var(--g200);padding:14px 10px;display:flex;flex-direction:column;gap:6px}
.ma-brand{display:flex;gap:10px;align-items:center;padding:4px 8px 12px}
.ma-mark{width:30px;height:30px;border-radius:6px 6px 14px 6px;background:var(--o);color:#fff;display:grid;place-items:center;font-weight:700}
.ma-brand b{display:block;line-height:1.1}.ma-brand span{font-size:11.5px;color:var(--g500)}
.ma-navgroup{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--g500);padding:10px 10px 3px;font-weight:600}
.ma-nav{display:flex;justify-content:space-between;align-items:center;width:100%;text-align:left;border:0;background:none;border-radius:6px;padding:7px 10px;cursor:pointer;font-weight:500;color:var(--ink)}
.ma-nav:hover{background:var(--g200)}
.ma-nav[aria-current="page"]{background:var(--o-strong);color:#fff}
.ma-badge{background:var(--o);color:#fff;border-radius:10px;font-size:11px;font-weight:600;padding:0 7px;line-height:18px}
.ma-nav[aria-current="page"] .ma-badge{background:#fff;color:var(--o-ink)}
.ma-main{min-width:0;display:flex;flex-direction:column}
.ma-top{display:flex;flex-wrap:wrap;gap:10px 16px;align-items:center;justify-content:space-between;padding:10px 24px;border-bottom:1px solid var(--g200);background:var(--w);position:sticky;top:0;z-index:5}
.ma-page{padding:22px 24px 48px;display:flex;flex-direction:column;gap:18px;max-width:1280px;width:100%}
.ma-head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:12px}
.ma-head p{color:var(--g700);margin-top:4px;max-width:70ch}
.ma-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.ma-stack{display:flex;flex-direction:column;gap:14px;min-width:0}
.ma-grid2{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:18px;align-items:start}
.ma-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.ma-grid-even{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}

.ma-sec{display:flex;align-items:stretch;margin-bottom:10px}
.ma-sec h2{background:var(--g500);color:#fff;font-size:12px;letter-spacing:.07em;text-transform:uppercase;padding:6px 16px 6px 12px;border-radius:0 0 14px 0;white-space:nowrap}
.ma-sec::after{content:"";flex:1;border-top:1px solid var(--o);min-width:12px}
.ma-panel{border:1px solid var(--g200);border-radius:8px;background:var(--w);padding:16px;min-width:0}
.ma-note{background:var(--g50);border-radius:6px;padding:10px 12px;color:var(--g700);font-size:13px}
.ma-need{background:var(--o-tint);border:1px solid var(--o-line);border-radius:8px;padding:12px 14px}
.ma-ok{background:var(--g50);border:1px solid var(--g300);border-left:4px solid var(--o-strong);border-radius:8px;padding:12px 14px}

.ma-btn{border:1px solid var(--g300);background:var(--w);border-radius:6px;padding:7px 12px;font-weight:600;cursor:pointer;display:inline-flex;gap:6px;align-items:center;white-space:nowrap}
.ma-btn:hover{border-color:var(--g500)}
.ma-btn.pri{background:var(--o-strong);border-color:var(--o-strong);color:#fff}.ma-btn.pri:hover{background:#C24B00}
.ma-btn.sm{padding:4px 9px;font-size:12.5px}
.ma-btn:disabled{opacity:.45;cursor:not-allowed}
.ma-link{background:none;border:0;padding:0;color:var(--o-ink);font-weight:600;cursor:pointer;text-decoration:underline}

.ma-chip{display:inline-flex;align-items:center;gap:5px;border-radius:20px;padding:1px 9px;font-size:12px;font-weight:600;white-space:nowrap;border:1px solid transparent;line-height:18px}
.ma-chip.grey{background:var(--g100);color:var(--g700)}
.ma-chip.dark{background:var(--g700);color:#fff}
.ma-chip.orange{background:var(--o-tint);color:var(--o-ink);border-color:var(--o-line)}
.ma-chip.solid{background:var(--o-strong);color:#fff}
.ma-chip.line{border-color:var(--g300);color:var(--g700)}
.ma-chip.idle{border:1px dashed var(--g300);color:var(--g500);font-weight:500}

.ma-tw{overflow-x:auto;border:1px solid var(--g200);border-radius:8px}
table.ma-t{width:100%;border-collapse:collapse;font-size:13.5px;min-width:620px}
.ma-t th{text-align:left;font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;color:var(--g500);padding:9px 12px;background:var(--g50);border-bottom:1px solid var(--g200);white-space:nowrap}
.ma-t td{padding:9px 12px;border-bottom:1px solid var(--g100);vertical-align:top}
.ma-t tr:last-child td{border-bottom:0}
.ma-t tr.click{cursor:pointer}.ma-t tr.click:hover td{background:var(--g50)}
.ma-t tr.sel td{background:var(--o-tint)}

.ma-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));border:1px solid var(--g200);border-radius:8px;overflow:hidden}
.ma-kpi{padding:14px 16px;box-shadow:1px 0 0 var(--g200),0 1px 0 var(--g200)}
.ma-kpi .v{font-size:26px;font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums}
.ma-kpi .l{font-size:12.5px;color:var(--g700);margin-top:4px}.ma-kpi .h{font-size:12px;color:var(--g500)}
.ma-kpi.alert .v{color:var(--o-ink)}

.ma-tabs{display:flex;gap:2px;border-bottom:1px solid var(--g200);overflow-x:auto}
.ma-tab{border:0;background:none;padding:9px 14px;cursor:pointer;font-weight:600;color:var(--g600);border-bottom:3px solid transparent;white-space:nowrap}
.ma-tab[aria-selected="true"]{color:var(--ink);border-bottom-color:var(--o-strong)}
.ma-tab:hover{color:var(--ink)}

.ma-steps{display:flex;gap:4px;overflow-x:auto}
.ma-step{flex:1 0 auto;border:0;background:var(--g100);color:var(--g700);padding:8px 12px;font-weight:600;font-size:12.5px;cursor:pointer;border-radius:3px;white-space:nowrap;text-align:left;border-bottom:3px solid transparent}
.ma-step.done{border-bottom-color:var(--g700)}.ma-step.on{background:var(--o-strong);color:#fff}
.ma-bar{height:8px;background:var(--g200);border-radius:4px;overflow:hidden}.ma-bar i{display:block;height:100%;background:var(--o);transition:width .25s}
.ma-rail{display:flex;gap:2px}.ma-rail i{flex:1;height:8px;background:var(--g200);border-radius:1px}.ma-rail i.d{background:var(--g700)}.ma-rail i.c{background:var(--o)}

.ma-fgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 18px}
.ma-f{display:flex;flex-direction:column;gap:5px;min-width:0}.ma-f.wide{grid-column:1/-1}
.ma-f label,.ma-f .lab{font-weight:600;font-size:13px}.ma-f .req{color:var(--o-ink)}
.ma-f input,.ma-f select,.ma-f textarea{border:1px solid var(--g300);border-radius:6px;padding:8px 10px;background:var(--w);width:100%}
.ma-f textarea{min-height:72px;resize:vertical}.ma-f input[readonly]{background:var(--g50);color:var(--g700)}
.ma-f .hint{font-size:12px;color:var(--g500)}.ma-f .err{font-size:12.5px;color:var(--o-ink);font-weight:600}
.ma-f.bad input,.ma-f.bad select,.ma-f.bad textarea{border-color:var(--o-strong);background:var(--o-tint)}
.ma-opts{display:flex;flex-wrap:wrap;gap:8px}
.ma-opt{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--g300);border-radius:6px;padding:7px 12px;cursor:pointer;font-weight:500}
.ma-opt input{width:auto;margin:0}.ma-opt:has(input:checked){border-color:var(--o-strong);background:var(--o-tint)}
.ma-sub{grid-column:1/-1;font-size:12.5px;font-weight:600;color:var(--g700);text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid var(--g200);padding-bottom:4px;margin-top:6px}

.ma-calc{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;grid-column:1/-1}
.ma-calc>div{border:1px solid var(--g200);border-radius:8px;padding:10px 12px;background:var(--w)}
.ma-calc b{display:block;font-size:18px;font-variant-numeric:tabular-nums}.ma-calc span{font-size:12.5px;color:var(--g700)}
.ma-calc .warn b{color:var(--o-ink)}

.ma-ring{width:92px;height:92px}
.ma-checks{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.ma-checks li{display:grid;grid-template-columns:24px minmax(0,1fr) auto;gap:10px;align-items:start;padding:8px 0;border-bottom:1px solid var(--g100)}
.ma-checks li:last-child{border-bottom:0}
.ma-dot{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;background:var(--g100);color:var(--g600);border:2px solid var(--g200)}
.ma-dot.PASS{background:var(--g700);border-color:var(--g700);color:#fff}
.ma-dot.WARN{background:var(--o-tint);border-color:var(--o-line);color:var(--o-ink)}
.ma-dot.FAIL{background:var(--o-strong);border-color:var(--o-strong);color:#fff}

.ma-track{list-style:none;margin:0;padding:0}
.ma-track li{display:grid;grid-template-columns:26px minmax(0,1fr);gap:10px;padding-bottom:12px;position:relative}
.ma-track li::before{content:"";position:absolute;left:12px;top:26px;bottom:0;width:2px;background:var(--g200)}
.ma-track li:last-child::before{display:none}.ma-track li.done::before{background:var(--g700)}
.ma-track .d{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--g100);border:2px solid var(--g200);color:var(--g500);font-size:12px}
.ma-track .done .d{background:var(--g700);border-color:var(--g700);color:#fff}
.ma-track .cur .d{background:var(--o-tint);border-color:var(--o-strong);color:var(--o-ink)}
.ma-track .fut{color:var(--g500)}.ma-track .cur b{color:var(--o-ink)}

.ma-chat{display:flex;flex-direction:column;gap:10px}
.ma-msg{border:1px solid var(--g200);border-radius:8px;padding:9px 12px;max-width:78%;background:var(--w)}
.ma-msg.me{align-self:flex-end;background:var(--o-tint);border-color:var(--o-line)}
.ma-msg.sys{align-self:center;background:var(--g50);color:var(--g600);font-size:12.5px;max-width:90%}
.ma-msg.note{background:var(--g100);border-style:dashed}
.ma-msg .by{font-size:12px;color:var(--g500);margin-bottom:2px}

.ma-bell{position:relative}
.ma-drawer{position:absolute;right:0;top:36px;width:360px;max-height:420px;overflow:auto;background:var(--w);border:1px solid var(--g300);border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:20}
.ma-drawer .item{padding:10px 12px;border-bottom:1px solid var(--g100);cursor:pointer}
.ma-drawer .item.unread{background:var(--o-tint)}
.ma-toast{position:fixed;right:20px;bottom:20px;display:flex;flex-direction:column;gap:8px;z-index:50;max-width:380px}
.ma-toast div{background:var(--ink);color:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 4px 18px rgba(0,0,0,.25);border-left:4px solid var(--o)}

.ma-chart{width:100%;height:auto;display:block}
.ma-chart text{font-family:inherit;font-size:11px;fill:var(--g700)}
.ma-legend{display:flex;flex-wrap:wrap;gap:6px 14px;font-size:12.5px;color:var(--g700)}
.ma-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px}
.ma-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px}
.ma-card{border:1px solid var(--g200);border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:10px;background:var(--w);text-align:left}
.ma-card.act{border-color:var(--o-line);box-shadow:0 0 0 1px var(--o-line)}

@media (max-width:900px){
  .ma-shell{grid-template-columns:1fr}.ma-side{flex-direction:row;flex-wrap:wrap;border-right:0;border-bottom:1px solid var(--g200)}
  .ma-grid2,.ma-grid3,.ma-grid-even{grid-template-columns:1fr}.ma-top,.ma-page{padding-left:14px;padding-right:14px}
}
@media (max-width:620px){.ma-fgrid{grid-template-columns:1fr}.ma-msg{max-width:100%}}
`;

let injected = false;
export function injectStyles(): void {
  if (injected || typeof document === 'undefined') {
    return;
  }
  const el = document.createElement('style');
  el.setAttribute('data-mortgage-accelerator', '');
  el.textContent = CSS;
  document.head.appendChild(el);
  injected = true;
}

/** Local preview of the Mortgage Forms web part, using browser storage instead of SharePoint. */
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { FormsApp } from '../src/app/App';
import { LocalFormStore } from '../src/app/store';

const store = new LocalFormStore();
const who = (window.location.search.match(/[?&]as=(\w+)/) || [])[1];
const name = who === 'ama' ? 'Ama Serwaa Owusu' : 'Yaa Pokua Adjei';

ReactDOM.render(
  <div>
    <div style={{ padding: '8px 16px', background: '#F8F7F6', borderBottom: '1px solid #E6E3E0', fontFamily: 'Segoe UI, sans-serif', fontSize: 13 }}>Local preview · saved in this browser only · signed in as <b>{name}</b></div>
    <FormsApp store={store} userName={name} userEmail="yaa.adjei@fidelitybank.com.gh" advanceFlowUrl="https://advanceflow.example/staff-loan/create" navigate={function (u) { const d = document.createElement('div'); d.setAttribute('role', 'dialog'); d.style.cssText = 'position:fixed;inset:0;background:rgba(43,41,39,.55);display:grid;place-items:center;z-index:99;font-family:Segoe UI,sans-serif'; d.innerHTML = '<div style="background:#fff;border-radius:10px;padding:24px;max-width:460px"><h2 style="margin:0 0 8px;color:#D95400">Opening Advance Flow</h2><p>In SharePoint this step opens <b>' + u + '</b> (Staff Loan, Create Staff Loan). In this preview it stays here.</p><button id="x" style="background:#D95400;color:#fff;border:0;border-radius:6px;padding:8px 14px;cursor:pointer">Close</button></div>'; document.body.appendChild(d); (d.querySelector('#x') as HTMLElement).onclick = function () { d.remove(); }; }} />
  </div>,
  document.getElementById('root')
);

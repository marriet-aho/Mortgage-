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
    <FormsApp store={store} userName={name} userEmail="yaa.adjei@fidelitybank.com.gh" advanceFlowUrl="https://advanceflow.example/staff-loan/create" />
  </div>,
  document.getElementById('root')
);

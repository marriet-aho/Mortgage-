import * as React from 'react';
import { useAsync, useApp } from '../context';
import { FormValues } from '../domain/formDef';
import { docLabel, preApprovalSpecs } from '../domain/documents';
import { MortgageCase } from '../domain/types';
import { Chip, CheckField, Loading, Note, Panel, Section, Table } from './ui';

/**
 * Pre-approval documents. Advance Flow (Create Staff Loan, Step 2) is where these are attached, so the module
 * lists the exact requirements and only tracks them. The signed application form and consent letter are filed
 * by the module when they are e-signed, and are offered to Advance Flow with the loan.
 */
export function PreApprovalPack(p: { c: MortgageCase; f: FormValues; set: (v: FormValues) => void }): JSX.Element {
  const app = useApp();
  const docs = useAsync(function () { return app.client.listDocuments(p.c.id); }, [p.c.id, app.version]);
  if (docs.loading) { return <Loading />; }
  const have = function (t: string): boolean { return (docs.data || []).some(function (d) { return d.docType === t; }); };
  const specs = preApprovalSpecs({ product: p.c.product, applicant: p.c.applicant, purchase: p.c.purchase });
  const confirmed = p.f.af_step2_confirmed === true;
  return (
    <div className="ma-stack">
      <Note><b>Attach these in Advance Flow.</b> In Advance Flow go to <b>Staff Loan, Create Staff Loan, Step 2 (Loan Application)</b> and attach the pre-approval documents below. The module does not take a second copy. All Ghana cards must be verified at a branch before submission.</Note>
      <Section title="Pre-approval requirements">
        <Table rowKey={function (s) { return s.docType; }} rows={specs}
          cols={[
            { head: 'Document', render: function (s) { return <><b>{s.label}</b><div className="small muted">{s.hint}</div></>; } },
            { head: 'Where', render: function (s) { return s.owner === 'MODULE' ? <Chip tone="orange">Filed by this module</Chip> : <Chip tone="line">Attach in Advance Flow Step 2</Chip>; } },
            { head: 'Status', render: function (s) {
              if (s.owner === 'MODULE') { return have(s.docType) ? <Chip tone="dark">Filed</Chip> : s.required({ product: p.c.product, applicant: p.c.applicant, purchase: p.c.purchase }) ? <Chip tone="solid">Missing</Chip> : <Chip tone="idle">Optional</Chip>; }
              return confirmed ? <Chip tone="dark">Attached in Advance Flow</Chip> : <Chip tone="idle">Awaiting your confirmation</Chip>;
            } }
          ]} />
      </Section>
      <Panel title="Confirm">
        <CheckField id="f-af-step2" label="I have attached all the pre-approval documents above to my loan in Advance Flow (Create Staff Loan, Step 2)" checked={confirmed} onChange={function (x) { p.set({ af_step2_confirmed: x }); }} />
        <div className="small muted" style={{ marginTop: 6 }}>{have('APPLICATION_FORM') ? docLabel('APPLICATION_FORM') + ' and ' : ''}{have('CONSENT_FORM') ? docLabel('CONSENT_FORM') + ' are already filed from your e-signatures.' : 'Sign the application form and consent letter in the previous step; they are filed automatically.'}</div>
      </Panel>
    </div>
  );
}

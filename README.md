# Advance Flow – Mortgage Application Entry Module

Open `index.html` in a browser (no build step). Sign in with any password, choose **Mortgage**, complete sections A–H and submit.

- **Trigger:** selecting Mortgage creates (or resumes) an auto-saved draft and opens the form.
- **Form:** sections A–G as specified, plus H (references and declaration) from the paper form; co-borrower, bank details, assets/liabilities, insurance and existing-mortgage questions come from the Fidelity Bank form.
- **Validation:** all mandatory fields, 20% minimum equity, required documents; errors are listed with links to each field.
- **Submit:** unique reference `MTG-YYYY-NNNNNN`, status Submitted, timestamp, documents stored, record locked, audit entries.
- **Workflow:** `AdvanceFlow.startWorkflow()` is the integration seam; the prototype assigns to the Mortgage Team Review Queue and starts SLA timers and escalation rules.
- **Tracking page, notifications and audit trail** as specified. Use "View as → Mortgage Team" to see the queue and to return a case for correction (which unlocks it).

Data is kept in browser storage (records in localStorage, files in IndexedDB). Repayment estimates use an illustrative 18% rate (`CONFIG.rate`).

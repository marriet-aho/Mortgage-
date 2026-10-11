# 5. Functional Requirements and 6. Non-Functional Requirements

Priority: **M** must have, **S** should have, **C** could have. Phase refers to [the roadmap](14-roadmap-benefits.md).

## 5. Functional requirements

### 5.1 Application and forms

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-01 | Applicant selects Home Purchase or Equity Release and the matching form set opens, with a draft saved automatically. | M | 1 |
| FR-02 | Forms A to J are digital with field validation, conditional sections and save-as-draft. | M | 1 |
| FR-03 | Staff identity is verified against the HR system at start; name, staff ID, department, branch, position, employment status, date employed and retirement date are pre-filled and read-only where HR is the source. | M | 1 |
| FR-04 | Duplicate check blocks a second active application for the same employee and product, and flags the same title number across active cases. | M | 1 |
| FR-05 | The system calculates LTV, affordability and eligible amount live as the applicant types. | M | 1 |
| FR-06 | Submission is blocked until mandatory fields and required documents are complete, with plain error messages. | M | 1 |
| FR-07 | On submission a unique application number is generated, the record is locked and an audit entry is written. | M | 1 |
| FR-08 | A returned application unlocks only the fields the reviewer flagged. | S | 2 |
| FR-09 | Co-borrower is invited by secure link, verifies identity and signs separately. | M | 1 |
| FR-10 | Consent (Form C) is recorded with text version, timestamp, device and signer; no bureau call without it. | M | 1 |
| FR-11 | Vendor Due Diligence (Form J) appears when vendor type is private. | M | 1 |
| FR-12 | Equity Release validates the 70% forced-sale-value rule once an FSV exists and warns before then. | M | 1 |

### 5.2 Pre-approval and assessment

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-20 | Pre-approval runs automatically: validation, HR verification, affordability, bureau check, risk assessment, eligibility score, decision, notification. | M | 1 |
| FR-21 | Outcomes are Pre-Approved, Referred to Credit, or Not Eligible-Referred. The system never issues a final decline automatically. | M | 1 |
| FR-22 | Pre-approval letter states amount, tenor, indicative rate, conditions and validity period. | M | 1 |
| FR-23 | HR verification task is created automatically with employment record pre-loaded; HR confirms or corrects. | M | 1 |
| FR-24 | Credit bureau request is sent automatically after consent and result is stored with the case. | M | 2 |
| FR-25 | Affordability engine computes gross, net, disposable income, DSR, DTI and score from Form F. | M | 1 |
| FR-26 | Credit Team sees the full computed assessment and records recommendation with reasons. | M | 2 |
| FR-27 | Credit queries are tasks to the applicant with a due date and response clock. | M | 2 |

### 5.3 Case management

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-30 | Every application is a case with a single timeline of events. | M | 3 |
| FR-31 | Cases and tasks are assigned by rule (skill, workload, round-robin or named) with conflict-of-interest exclusion. | M | 3 |
| FR-32 | SLA clocks run per task and per case, with pause while waiting on the applicant. | M | 3 |
| FR-33 | Escalation fires automatically at configured thresholds and notifies the next level. | M | 3 |
| FR-34 | Case closure requires all post-disbursement items closed or formally waived. | M | 3 |
| FR-35 | Authorised users can put a case on hold, withdraw or reopen with a reason. | S | 3 |

### 5.4 Documents

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-40 | Documents upload once and every unit reads the same copy. | M | 1 |
| FR-41 | OCR extracts key fields and flags mismatches against form data. | S | 2 |
| FR-42 | Versions are kept; replaced documents remain viewable with who and when. | M | 2 |
| FR-43 | Each document has a category, security classification and retention class. | M | 2 |
| FR-44 | Full-text and metadata search within permissions. | S | 3 |
| FR-45 | Generated documents (offer, TIL, deed, fit-to-lend) are produced from templates and filed automatically. | M | 2 |

### 5.5 Collaboration

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-50 | Case-bound chat and comment threads between applicant and each unit. | M | 5 |
| FR-51 | File attachments in messages are saved to the document repository. | M | 5 |
| FR-52 | Internal staff notes are hidden from the applicant. | M | 5 |
| FR-53 | Mortgage Team can view and join any thread but is not a required participant. | M | 5 |
| FR-54 | Messages are searchable and form part of the audit record. | M | 5 |
| FR-55 | Notifications by in-app, email and SMS with per-event templates. | M | 2 |

### 5.6 Valuation, collateral and legal

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-60 | Valuation request (Form D) routes to Collateral, which assigns a panel valuer by rule. | M | 6 |
| FR-61 | Valuer uploads report through a restricted portal; report fields (market value, forced sale value, condition) are captured as data. | M | 6 |
| FR-62 | Collateral reviews the report and records property acceptance or rejection. | M | 6 |
| FR-63 | Legal searches (land, certificate, consolidated) are requested and tracked with results stored. | M | 6 |
| FR-64 | Fit-to-lend certificate is generated only after valuation accepted, searches clear and property accepted. | M | 6 |
| FR-65 | Property rejected at any point stops dependent spend and notifies the applicant. | M | 6 |

### 5.7 Approval, offer, conditions, disbursement

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-70 | Approval routing is derived from amount, product and exceptions via the matrix in [07](07-approvals.md). | M | 2 |
| FR-71 | Approvers see the whole case and decide approve, approve with conditions, return, or decline with a mandatory reason. | M | 2 |
| FR-72 | Delegation and acting arrangements are recorded with dates and limits. | M | 2 |
| FR-73 | Offer letter and Truth in Lending disclosure are generated and signed electronically. | M | 2 |
| FR-74 | Conditions precedent are a checklist per case with owner, due date, evidence and verifier. | M | 3 |
| FR-75 | Disbursement is blocked while any mandatory condition is open. | M | 3 |
| FR-76 | Disbursement request is approved by Credit Administration, paid by Operations, and the mortgage account is created and activated. | M | 6 |
| FR-77 | Equity Release can disburse to the applicant or direct to a payee, in tranches where configured. | S | 6 |

### 5.8 Post-disbursement, reporting, audit

| ID | Requirement | Pri | Phase |
|---|---|---|---|
| FR-80 | Registration, perfection, Lands Commission, title perfection and safe custody are tracked items with due dates. | M | 6 |
| FR-81 | Alerts fire for items nearing or past due. | M | 6 |
| FR-82 | Role dashboards in [12](12-dashboards.md) with drill-through to cases. | M | 7 |
| FR-83 | Every create, change, view of sensitive data, decision and message is logged immutably with who, what, when and from where. | M | 1 |
| FR-84 | Audit export for internal audit and regulators. | M | 3 |
| FR-85 | Predictive analytics (delay risk, document quality) as a later enhancement. | C | 7 |

## 6. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Availability | 99.9% monthly for applicant and staff portals; planned maintenance outside 06:00 to 20:00 Monday to Friday. |
| NFR-02 | Recovery | RPO 15 minutes, RTO 4 hours (proposed), tested twice a year. |
| NFR-03 | Performance | 95% of page loads under 2 seconds; live calculations under 300 ms; pre-approval engine completes automated steps under 5 minutes excluding external waits. |
| NFR-04 | Scale | 1,000 active cases and 200 concurrent users with headroom to 5x; document store sized for 50 files per case. |
| NFR-05 | Security | SSO with MFA, role-based access plus attribute rules for staff ring-fencing, encryption in transit and at rest. See [10](10-architecture-integration-security.md). |
| NFR-06 | Audit | Append-only audit store; tamper evidence by hash chaining; retained as long as the record. |
| NFR-07 | Privacy | Compliance with Ghana's Data Protection Act, 2012 (Act 843), consent capture, purpose limitation, subject access and correction. Confirm with Compliance. |
| NFR-08 | Retention | Per bank policy (decision D6); proposed at least 7 years after account closure for case data and for the life of the loan plus perfection for title documents. |
| NFR-09 | Accessibility | WCAG 2.1 AA; usable on a phone with a 360 px width; keyboard-only operation. |
| NFR-10 | Usability | A first-time applicant can submit a complete application without help; autosave means no lost work. |
| NFR-11 | Configurability | Rates, ratios, limits, SLAs, matrices, templates and checklists editable by authorised business admins with approval and version history; no code change. |
| NFR-12 | Integration | Every external call has timeout, retry, circuit breaker, idempotency key and a manual fallback. |
| NFR-13 | Observability | Central logging, metrics, tracing; alerts on SLA engine lag, integration failures, queue depth. |
| NFR-14 | Portability | Standards-based interfaces (REST/JSON, OIDC, SAML, BPMN 2.0 or DMN where Advance Flow supports) to avoid lock-in. |
| NFR-15 | Quality | Automated tests for rules and calculations; UAT with each stakeholder unit; penetration test before go-live. |
| NFR-16 | Localisation | GHS default, optional USD or EUR for facilities; dates in day-month-year. |
| NFR-17 | Data quality | Reference data (departments, branches, banks, valuers) maintained in one place and validated at entry. |
| NFR-18 | Document limits | PDF, JPG, PNG; up to 10 MB each; virus scan on upload. |

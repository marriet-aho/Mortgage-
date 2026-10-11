# 1. Executive Summary and 2. Current-State Pain Points

## 1. Executive summary

The bank's staff mortgage is processed on paper and by hand-off. Reading the AS-IS diagram, a single application passes through eleven stakeholder lanes and about sixty-five steps and decisions. The Mortgage Team sits in the middle of the journey, preparing packages, relaying queries and issuing documents, so almost every question between the applicant and another unit travels through it.

This design replaces that with one digital platform, built inside Advance Flow, in which:

- **Every application is a digital case.** One record holds the forms, documents, valuation, assessments, approvals, tasks, messages, conditions, SLA clocks and audit log.
- **Pre-approval is automated** and targets a decision in under 24 hours: validation, HR verification, affordability, credit bureau check, risk assessment, eligibility score, decision, notification.
- **Work runs in parallel instead of in sequence.** After pre-approval, valuation, legal searches, vendor due diligence and full credit assessment start together.
- **Stakeholders talk to the applicant directly** through a case-bound communication centre. The Mortgage Team keeps oversight and can step in, but is no longer the relay.
- **Rules decide routing and eligibility.** Loan to value, affordability, the 70% forced-sale-value cap, approval tiers and escalation are configuration in a rules engine.
- **Disbursement is gated.** The system will not release funds until every condition precedent is satisfied and verified.
- **Everything after disbursement is tracked.** Mortgage registration, security perfection, Lands Commission registration, title perfection and safe custody have owners, due dates and alerts.

Two products run on the same platform: **Home Purchase Mortgage** and **Home Equity Release**. They share the case engine, documents, communications, approvals and audit, and differ in forms, rules and a few workflow steps.

### Business objectives and where they are met

| Objective | How the design meets it | Detail |
|---|---|---|
| Eliminate paper | All forms digital, e-signature, scanned legacy documents ingested with OCR | [05](05-digital-forms-catalogue.md) |
| Eliminate email-driven workflow | Communication centre, task inbox, notifications | [06](06-case-workflow-communication.md) |
| Reduce Mortgage Team middleman role | Direct applicant-to-stakeholder threads, Mortgage Team oversight only | [02](02-operating-model-business-architecture.md) |
| Automate approvals and routing | Rules-driven approval matrix with escalation and delegation | [07](07-approvals.md) |
| Improve turnaround | Parallel tracks, SLA clocks, auto-escalation, 24-hour pre-approval | [04](04-products-and-journeys.md), [11](11-process-flows.md) |
| One source of truth | Single case record and document repository | [09](09-data-model-and-schema.md) |
| Operational visibility | Role dashboards and pipeline analytics | [12](12-dashboards.md) |
| Auditability and compliance | Immutable audit log, consent records, segregation of duties | [10](10-architecture-integration-security.md) |

### What the bank is asked to decide

Eight decisions (D1 to D8 in [the README](00-README.md)) control the numbers in this design. None blocks Phase 1, which is forms and pre-approval; D2, D3, D5 are needed before it goes live.

## 2. Current-state pain points

Source: the AS-IS Staff Mortgage Process diagram. Findings below are what the diagram shows; durations and volumes are not on it, so they are to be measured in Phase 0 before targets are finalised.

### 2.1 What the diagram shows, by lane

| Lane | Steps visible | Observation |
|---|---|---|
| Applicant | Start, Application Submission, then Sign TIL, Sign Offer, Pay Fees, Sign Mortgage Documents | Applicant re-enters the process four times late in the journey, each time as a separate hand-off. |
| HR | Employment Review and Affordability Check, HR Approval, Director HR Approval, DMD Approval, No Objection Issued | Five steps in strict sequence before any other unit can start. |
| Mortgage Team | Review Application, Documents Complete?, Applicant Resubmits, Request Missing Documents, Prepare Credit Package, Credit Memo, Truth in Lending, Offer Letter, Fulfil Conditions Precedent | Nine activities, including both ends of the missing-documents loop and every document sent to the applicant. |
| Credit Team | Affordability Assessment, Credit Bureau Check, Property Assessment, Risk Assessment, Information Complete?, Credit Query, Applicant Response, Reassess, Credit Recommendation | A query loop back to the applicant; Property Assessment sits in Credit, not with collateral. |
| Approval Authorities | Head of Mortgage, Credit Admin, Head Personal Banking, Head Credit Evaluation, then Approved? | Four approvers in series. |
| Legal Team | Review Offer Letter, Land Search, Certificate Search, Consolidated Search, Mortgage Deed Preparation | Searches are in series and run late. |
| Vendor | Provide Property Documents | One touch point, routed through other lanes. |
| Collateral Team | Review Search Reports, Property Acceptable?, Reject Property, Fit-to-Lend Assessment, Issue Fit-to-Lend, Mortgage Security Documentation, Registration Fee Assessment, Final Pre-Disbursement Verification, Availment Processing | Property can be rejected only after legal searches have already been paid for and done. |
| Credit Admin | Verify Authorities, Verify Documents, Verify Security | Three checks in series. |
| Operations | Disburse Funds, Pay Vendor, Activate Mortgage Account | |
| Post Disbursement | Mortgage Registration, Security Perfection, Lands Commission Registration, Title Perfection, Safe Custody | Five sequential items with no visible alerting or owner. |

### 2.2 Pain points and the design response

| ID | Pain point (from the diagram) | Effect | Design response |
|---|---|---|---|
| P1 | Mortgage Team appears in nine activities and relays documents and queries both ways. | Single bottleneck; slow answers; no direct accountability for other units. | Direct threads between applicant and each unit; Mortgage Team watches. [06](06-case-workflow-communication.md) |
| P2 | HR chain is five sequential steps before Credit starts. | Long wait before any assessment. | HR verification runs in parallel with the bureau check; Director HR and DMD only for higher tiers. [07](07-approvals.md) |
| P3 | Affordability is assessed twice (HR lane and Credit lane). | Duplicate effort, possibly different answers. | One affordability calculation, reviewed by Credit, shown to everyone. [04](04-products-and-journeys.md) |
| P4 | Property is assessed in Credit and again in Collateral. | Overlap and unclear ownership. | Collateral owns property acceptance; Credit consumes the result. [08](08-valuation-collateral-disbursement.md) |
| P5 | Four approvers in series. | Approval time is the sum of four queues. | Tiered matrix; approvers work in parallel where the policy allows; SLA clock per approver. [07](07-approvals.md) |
| P6 | Legal searches (land, certificate, consolidated) run in series and after approval. | Late discovery of title problems. | Searches start at pre-approval in parallel with valuation; early property rejection. [08](08-valuation-collateral-disbursement.md) |
| P7 | Missing-documents and credit-query loops go through the Mortgage Team and back. | Rework and long loops. | Document checklist with validation at upload; queries sent straight to the applicant with a response clock. |
| P8 | Verification repeats near the end: Credit Admin verifies authorities, documents and security, and Collateral does a final pre-disbursement verification. | Repeated checking, no single readiness view. | One conditions-precedent checklist that gates disbursement. [08](08-valuation-collateral-disbursement.md) |
| P9 | Applicant re-enters four times late (TIL, offer, fees, mortgage documents). | Slow, because each is a separate hand-off. | One offer pack with sequenced e-signature and fee payment. |
| P10 | Post-disbursement items have no visible owner, due date or alert. | Security perfection can lag without anyone noticing. | Tracked items with owners, due dates and aging alerts. [08](08-valuation-collateral-disbursement.md) |
| P11 | Forms are paper (the Fidelity application, employer certification, personal reference form). | Re-keying, lost documents, no validation. | Smart forms with validation and calculation. [05](05-digital-forms-catalogue.md) |
| P12 | No visible case record, SLA clock or audit trail across lanes. | Cannot see where an application is or who is late. | Case record, SLA engine, immutable audit. [06](06-case-workflow-communication.md), [12](12-dashboards.md) |
| P13 | Staff applying means colleagues process their own colleague's finances. | Confidentiality and conflict-of-interest risk. | Ring-fencing and conflict checks on task assignment. [10](10-architecture-integration-security.md) |

P13 is not on the diagram; it follows from the products being staff mortgages and is included because it affects the security design.

### 2.3 What to measure in Phase 0

Before targets are committed, sample at least the last 50 closed applications and record: elapsed days per lane, number of returns for missing documents, number of credit queries, share rejected at property stage, and time from approval to disbursement. These become the baselines in [the benefits plan](14-roadmap-benefits.md).

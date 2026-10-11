# 23. Implementation Roadmap and 24. Benefits Realization Plan

> Timelines are planning estimates for a small number of cross-functional squads (A6). They assume decisions D1 to D8 are made before the phase that needs them, and are to be re-estimated after Phase 0.

## 23.1 Phase 0: Mobilise and baseline (weeks 1 to 4)

Not in the brief but needed before Phase 1.

| Item | Detail |
|---|---|
| Objectives | Confirm scope and decisions, measure the AS-IS baseline, confirm Advance Flow capabilities, set up environments |
| Deliverables | Baseline report (elapsed time per lane from the last 50 cases), Advance Flow capability gap list, decision log for D1 to D8, delivery plan |
| Dependencies | Access to case files and process owners |
| Risks | No usable history to measure; mitigate with a four-week manual sample |
| Success metrics | Baseline agreed; decisions D2, D3, D5 made |

## 23.2 Phase summary

| Phase | Name | Timeline (indicative) | Depends on |
|---|---|---|---|
| 1 | Digital Forms and Pre-Approval | Weeks 5 to 18 | Phase 0; HR and identity integrations |
| 2 | Workflow Automation | Weeks 15 to 30 | Phase 1 forms and engine |
| 3 | Case Management | Weeks 25 to 38 | Phase 2 workflow |
| 4 | Applicant Portal | Weeks 31 to 44 | Phases 1 to 3 services |
| 5 | Stakeholder Collaboration | Weeks 39 to 50 | Phase 3 case model and Phase 4 portal |
| 6 | Valuation and Collateral Automation | Weeks 43 to 58 | Phases 2, 3, valuer onboarding, Lands Commission approach |
| 7 | Analytics and AI | Weeks 55 to 68 | Phases 1 to 6 data |

Phases overlap. Total about 68 weeks, roughly 16 months.

## Phase 1: Digital Forms and Pre-Approval

| | |
|---|---|
| Objectives | Replace paper with smart forms; deliver automated pre-approval in under 24 hours for both products |
| Deliverables | Forms A to J with validation and calculations; consent with e-signature; staff verification and duplicate checks; HR verification task; bureau and identity adapters; affordability and eligibility rules; pre-approval letters; application numbers; first audit log; extension of the existing Entry Module |
| Timeline | 14 weeks |
| Dependencies | HR system access, identity verification and bureau contracts, D2, D3, D5, final consent wording from Compliance |
| Risks | Bureau or identity integration delays (mitigate: manual upload fallback); rule parameters not agreed (mitigate: configurable defaults); low form completion (mitigate: UAT with staff) |
| Success metrics | 100% of new applications submitted digitally; 80% decided within 24 hours of a complete submission; under 10% returned for missing information |

## Phase 2: Workflow Automation

| | |
|---|---|
| Objectives | Automate routing, approvals, offer and document generation |
| Deliverables | Full workflow definitions for both products; approval matrix and delegation; offer, TIL, deed and certificate templates; notification templates; document service with OCR and versioning; e-signature of offers |
| Timeline | 16 weeks |
| Dependencies | Phase 1; approved Delegated Authority Matrix (D4); legal templates |
| Risks | Template approval slow; OCR accuracy on local documents (mitigate: human confirmation of extracted values) |
| Success metrics | 100% of approvals routed by rule; offer generated within 1 hour of final approval; 90% of required documents accepted first time |

## Phase 3: Case Management

| | |
|---|---|
| Objectives | One case record with tasks, SLA clocks, escalation, conditions and closure |
| Deliverables | Case workspace; task inbox; assignment rules; SLA and escalation service; conditions checklist and disbursement gate; ring-fencing; audit export; operational dashboards v1 |
| Timeline | 14 weeks |
| Dependencies | Phase 2; SLA definitions (D3) |
| Risks | Staff resistance to task inbox; mitigate with training and champions in each unit |
| Success metrics | 100% of cases with an owner and SLA clocks; SLA breach rate visible weekly; no disbursement without a passed gate |

## Phase 4: Applicant Portal

| | |
|---|---|
| Objectives | Self-service for applicants on web and mobile |
| Deliverables | Applicant portal with tracking, tasks, documents, payments; mobile layout; notifications by SMS and email; co-borrower and vendor links |
| Timeline | 14 weeks |
| Dependencies | Phases 1 to 3 services; SMS and email gateways; payment gateway |
| Risks | Mobile usability; mitigate with usability tests on real devices |
| Success metrics | 90% of applicants complete without help; status enquiries to the Mortgage Team reduced by half against baseline |

## Phase 5: Stakeholder Collaboration

| | |
|---|---|
| Objectives | Remove the Mortgage Team as relay |
| Deliverables | Communication centre with threads, requests, notes, attachments, search; Mortgage Team watch list; response SLA; thread-based notifications |
| Timeline | 12 weeks |
| Dependencies | Phase 3 case model, Phase 4 portal |
| Risks | Users continue by email; mitigate by switching off email routing for case matters and training |
| Success metrics | 95% of case communication inside the platform; Mortgage Team forwards under 5% of messages; median response time within SLA-16 |

## Phase 6: Valuation and Collateral Automation

| | |
|---|---|
| Objectives | Automate valuation, searches, property acceptance, fit-to-lend, security tracking, disbursement and post-disbursement |
| Deliverables | Valuer portal and assignment rules; structured valuation report; legal search tracking and Lands Commission adapter; collateral review and fit-to-lend generation; disbursement workflow with core banking; account activation; post-disbursement items and alerts |
| Timeline | 16 weeks |
| Dependencies | Valuer panel onboarding; core banking interface; Lands Commission approach (A5); D1 |
| Risks | No Lands Commission API; mitigate with assisted entry; valuer adoption; core banking change windows |
| Success metrics | Valuation turnaround within SLA-06 for 90%; fit-to-lend within one business day of acceptance; zero disbursements outside the gate; 100% of post-disbursement items with owner and due date |

## Phase 7: Analytics and AI

| | |
|---|---|
| Objectives | Management insight and assisted decisions |
| Deliverables | Role dashboards at full scope; reporting store and semantic layer; scheduled reports; predictive delay model; document quality and fraud signals; assisted credit memo drafting |
| Timeline | 14 weeks |
| Dependencies | Enough clean history; data governance; model risk approval |
| Risks | AI used where explainability is required; mitigate by using it only for assistance and flags, never for decisions on adverse outcomes (principle 7) |
| Success metrics | Dashboard adoption by all units; delay prediction accurate enough to cut breaches by an agreed margin; reviewers accept at least 80% of draft memo content with edits |

## 23.3 Cross-cutting workstreams

| Workstream | Activities |
|---|---|
| Change management | Stakeholder briefings, training per unit, champions, floor-walkers at go-live |
| Testing | Rule and calculation test packs, integration tests with mocks and sandboxes, UAT per unit, performance and penetration tests |
| Data migration | In-flight cases at go-live: finish on the old process or load as imported cases with scanned documents; decide per stage |
| Governance | Steering committee monthly; design authority for rules and forms; change control for configuration |
| Compliance | Data protection review, consent wording, audit review before each go-live |

## 23.4 Top programme risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Decisions D1 to D8 delayed | Medium | High | Decision owners named in Phase 0; configurable defaults |
| External integrations unavailable | Medium | Medium | Adapters with assisted-manual fallback |
| Advance Flow capability gaps | Medium | High | Gap list in Phase 0; build-or-buy decisions early |
| Low adoption by approvers and units | Medium | High | Early involvement, simple inbox, leadership sponsorship |
| In-flight cases during cutover | High | Medium | Dual-running plan, cut-off date |
| Data protection or regulatory objection | Low | High | Early review with Compliance |

## 24. Benefits realization plan

### 24.1 Benefits and measures

Baselines are **to be measured in Phase 0**; the AS-IS diagram has no durations, so none are asserted here. Targets are proposals.

| Benefit | Measure | Baseline | Proposed target | When |
|---|---|---|---|---|
| Faster pre-approval | Share decided within 24 hours | Phase 0 | 80% by Phase 1, 90% later | After Phase 1 |
| Shorter end-to-end time | Median business days, submission to disbursement | Phase 0 | At least 40% shorter | After Phase 6 |
| Less rework | Applications returned for missing information | Phase 0 | Under 10% | After Phase 2 |
| Less relay work | Messages forwarded by the Mortgage Team | Phase 0 | Under 5% | After Phase 5 |
| Fewer approval delays | Time in approval | Phase 0 | Within 1 business day per level | After Phase 2 |
| Control | Disbursements outside the gate | Phase 0 | Zero | After Phase 3 |
| Post-disbursement completion | Items done by due date | Phase 0 | 95% | After Phase 6 |
| Compliance | Audit findings on mortgage process | Phase 0 | Reduced and tracked | After Phase 3 |
| Paper | Paper forms in use | Phase 0 | Zero for new cases | After Phase 1 |
| Applicant experience | Satisfaction, status enquiries | Phase 0 | Improved | After Phase 4 |
| Visibility | Cases with a visible SLA clock | Phase 0 | 100% | After Phase 3 |

### 24.2 Cost and effort benefits (to quantify)

| Area | How to quantify |
|---|---|
| Mortgage Team time | Hours per case on relay, packages and document handling, before and after |
| HR time | Hours per verification |
| Courier and printing | Direct spend removed |
| Cost of delay | Pipeline value waiting multiplied by days saved, where the bank can price it |
| Error and rework cost | Returned cases times average handling time |

### 24.3 Governance of benefits

| Item | Detail |
|---|---|
| Owner | One named business owner per benefit |
| Tracking | Monthly review using the management dashboard |
| Reporting | Benefits review at each phase end; steering committee sees trend against baseline |
| Adjustment | If a benefit lags, the owner brings an action to the next steering meeting |
| Close-out | Twelve months after Phase 6, a formal review compares results to the baseline |

### 24.4 Qualitative benefits

One source of truth; defensible audit trail; clearer accountability between units; a better experience for staff borrowers; a platform that supports further products.

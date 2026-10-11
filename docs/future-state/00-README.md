# Future-State Digital Mortgage Management System (Advance Flow)

Design package for the Staff **Home Purchase Mortgage** and **Home Equity Release** platform.

**Status:** design proposal for review. It is detailed enough for build teams to estimate and start, but every number marked *proposed* (limits, ratios, SLAs, timelines) is a default for the bank to confirm, not a policy the bank has stated.

## How this package maps to the 24 required outputs

| # | Required output | File |
|---|---|---|
| 1, 2 | Executive summary, current-state pain points | [01-executive-summary-current-state.md](01-executive-summary-current-state.md) |
| 3, 4 | Future-state operating model, business architecture | [02-operating-model-business-architecture.md](02-operating-model-business-architecture.md) |
| 5, 6 | Functional and non-functional requirements | [03-requirements.md](03-requirements.md) |
| 8, 9, 10 | Product design, Home Purchase journey, Equity Release journey | [04-products-and-journeys.md](04-products-and-journeys.md) |
| 7 | Digital forms catalogue (Forms A–J) | [05-digital-forms-catalogue.md](05-digital-forms-catalogue.md) |
| 11, 12, 14 | Case management, workflow automation matrix, communication framework | [06-case-workflow-communication.md](06-case-workflow-communication.md) |
| 13 | Approval matrix | [07-approvals.md](07-approvals.md) |
| (sections 11–14 of the brief) | Valuation and collateral, conditions, disbursement, post-disbursement | [08-valuation-collateral-disbursement.md](08-valuation-collateral-disbursement.md) |
| 15, 16 | ERD, logical model, database schema | [09-data-model-and-schema.md](09-data-model-and-schema.md) |
| 17, 18 | Integration and security architecture | [10-architecture-integration-security.md](10-architecture-integration-security.md) |
| 20, 21 | Process flows, swimlanes, journey map, lifecycle | [11-process-flows.md](11-process-flows.md) |
| 19 | Dashboard specifications | [12-dashboards.md](12-dashboards.md) |
| 22 | Wireframes | [13-wireframes.md](13-wireframes.md) |
| 23, 24 | Implementation roadmap, benefits realization | [14-roadmap-benefits.md](14-roadmap-benefits.md) |

Diagrams are Mermaid and render on GitHub and in most Markdown viewers.

## Sources used

1. The **AS-IS Staff Mortgage Process** diagram (three phases, eleven stakeholder lanes).
2. The **Fidelity Bank Mortgage Application Form** (paper form, employer certification, personal reference form).
3. The **Staff Mortgage LOS Prototype** (stage list and SLA targets).
4. The **Mortgage Application Entry Module** already built in this repository (`index.html`), which becomes the front half of Form A, B, E, F and G.

## Conventions

- `FR-nn` functional requirement, `NFR-nn` non-functional, `BR-nn` business rule, `AUT-nn` automation, `SLA-nn` service level.
- Money is stored as `NUMERIC(18,2)` in the facility currency, GHS by default.
- "Applicant" means the staff member borrowing. "Case" means one mortgage application and everything attached to it.

## Assumptions (change any of these and the design adjusts)

| ID | Assumption |
|---|---|
| A1 | Ratios and limits (80% maximum loan to value on purchase, 50% debt service cap, 30-year maximum tenor) are proposed defaults held as configuration, not hard-coded. The 20% minimum down payment comes from the paper form, and the 70% forced-sale-value cap from the brief. |
| A2 | The approval authority limits in [07-approvals.md](07-approvals.md) are illustrative. The bank's Board-approved Delegated Authority Matrix replaces them. |
| A3 | The AS-IS process is read from the diagram only. Step durations and volumes are not known, so no baseline numbers are claimed. Phase 0 measures them. |
| A4 | Advance Flow provides workflow, rules, forms, tasks and notifications. Where it does not, the architecture names the component to build or buy. |
| A5 | The Lands Commission, identity verification and credit bureau providers may not all expose APIs. Every external integration has an adapter and an assisted-manual fallback. |
| A6 | Delivery by a small number of cross-functional squads. Timelines in the roadmap (about 16 months) are estimates, not commitments. |

## Decisions needed from the bank

| ID | Decision | Why it matters |
|---|---|---|
| D1 | Equity release when the property already has a mortgage: is the cap 70% of FSV *less* the outstanding balance? This design assumes yes. | Changes the eligible amount and whether a second charge is needed. |
| D2 | Is pre-approval a binding commitment, and for how long is it valid? Proposed: non-binding, 90 days. | Legal wording and customer expectations. |
| D3 | Does the SLA clock run in calendar or business hours, and does it pause while waiting on the applicant? Proposed: business hours, paused while waiting on the applicant. | Every SLA metric depends on it. |
| D4 | Final Delegated Authority Matrix and the Executive Approval threshold. | Approval routing. |
| D5 | Staff mortgage rate and fee schedule by product. | Instalment and affordability calculations. |
| D6 | Document retention periods and where data may be hosted. | Storage design and compliance. |
| D7 | Is mortgage protection insurance mandatory for both products? | Condition precedent list. |
| D8 | May the Mortgage Team override an automated decision, and with what justification? | Rules engine override design. |

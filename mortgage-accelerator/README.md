# Mortgage Accelerator for Advance Flow

A module inside the existing Advance Flow LOS for **Home Purchase** and **Home Equity Release** mortgages. It is a SharePoint Framework (SPFx) web part in React and TypeScript, signed in with Microsoft Entra ID, calling Advance Flow APIs, with files in SharePoint Online document libraries. It is not a standalone application.

Colours: orange (primary), grey and white.

## The 13 modules

| # | Module | Open at |
|---|---|---|
| 1 | Home Purchase Mortgage | `#/purchase` |
| 2 | Home Equity Release Mortgage | `#/equity` |
| 3 | Mortgage Application Wizard (Loan Eligibility, Loan Application, Finish) | `#/apply/purchase`, `#/apply/equity` |
| 4 | Mortgage Readiness Engine | `#/readiness` and live in the wizard |
| 5 | Mortgage Case Management | `#/cases` |
| 6 | Stakeholder Collaboration Hub | `#/hub` |
| 7 | Valuation Management | `#/valuations` |
| 8 | Property Repository | `#/properties` |
| 9 | Fit-To-Lend Workspace | `#/fit-to-lend/:caseId` |
| 10 | Conditions Tracker | `#/conditions` |
| 11 | Mortgage Dashboard | `#/dashboard` |
| 12 | Executive Dashboard | `#/executive` |
| 13 | Mortgage Analytics | `#/analytics` |

Also: Disbursement, Post-disbursement monitoring and the Audit trail.

## Try it locally (no SharePoint or Advance Flow needed)

```bash
cd mortgage-accelerator/spfx
npm install
npm run harness          # writes dist/index.html, a single self-contained page
open dist/index.html     # or just double-click it
```

Use **View as** at the top to switch role. Start with *Applicant: Yaa (new, no cases)* → *Application wizard*. The demo OTP code is `123456`. Pre-approval completes a few seconds after you submit, and notifications arrive in real time. Data lives in memory and resets on reload.

## Tests

```bash
npm test            # 48 tests: business rules, eligibility, the whole lifecycle in the mock
npm run typecheck
```

## Package for SharePoint

SPFx 1.18 needs Node 18.17 or later 18.x.

```bash
npm run package     # gulp bundle --ship && gulp package-solution --ship
# -> sharepoint/solution/mortgage-accelerator.sppkg
```

Deployment steps, Entra ID registration and permissions are in [docs/01-solution-architecture.md](docs/01-solution-architecture.md) section 1.8 and [docs/06-permissions-model.md](docs/06-permissions-model.md).

## Design documents

| File | Covers |
|---|---|
| [01-solution-architecture.md](docs/01-solution-architecture.md) | Architecture, reuse of Advance Flow capabilities, fit with the existing Staff Loan screens, deploy |
| [02-data-model.md](docs/02-data-model.md) | Advance Flow extension tables, SharePoint libraries and metadata |
| [03-workflow-architecture.md](docs/03-workflow-architecture.md) | States, both processes, SLA, gates, notifications, audit |
| [04-ui-navigation-pages.md](docs/04-ui-navigation-pages.md) | Design system, navigation by role, every page, key screens |
| [05-api-contract.md](docs/05-api-contract.md) | Endpoints the module needs from Advance Flow |
| [06-permissions-model.md](docs/06-permissions-model.md) | Entra roles, permission matrix, ring-fencing, SharePoint permissions |
| [07-dashboards-analytics.md](docs/07-dashboards-analytics.md) | Metrics and the three dashboards |
| [08-business-rules.md](docs/08-business-rules.md) | Parameters, rule catalogue, eligibility, readiness, approvals |
| [09-end-to-end-lifecycle.md](docs/09-end-to-end-lifecycle.md) | The whole journey, both products |

The wider programme design (operating model, forms catalogue, roadmap, benefits) is in [`../docs/future-state`](../docs/future-state/00-README.md).

## What is real and what is assumed

| | Status |
|---|---|
| Pages, rules, readiness engine, approval matrix, SLA, gates | Built and tested |
| SPFx web part and `.sppkg` | Built with the real SPFx toolchain |
| HTTP client to Advance Flow, SharePoint file store | Written, **not run against a live system** |
| Endpoint paths | The module's contract; confirm against the Advance Flow API reference |
| DIR definitions, DIR limit, rates, tenor cap, retirement age 60, SLA targets, approval limits | **Assumed**, held as configuration |
| Existing LOS | Known only from two screenshots |

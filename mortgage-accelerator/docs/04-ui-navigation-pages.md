# 4. UI, Navigation and Pages

## 4.1 Design system

Orange is the primary colour; everything else is grey and white. Orange is reserved for what needs action or what is current.

| Token | Value | Use |
|---|---|---|
| Orange | `#F26A1B` | Progress, current stage, focus rings, chart focus series |
| Orange strong | `#D95400` | Primary buttons, active menu item, current step |
| Orange ink | `#A04000` | Warnings and error text on white |
| Orange tint / line | `#FDEEE3` / `#F6B48A` | Needs-attention panels, "waiting" chips |
| Ink | `#2B2927` | Text |
| Greys | `#55514E`, `#7B7672`, `#A6A19D`, `#D2CECA`, `#E6E3E0`, `#F1EFED`, `#F8F7F6` | Completed steps, borders, side rail, table headers |
| White | `#FFFFFF` | Work surface, cards |

There is no green or red: done is dark grey, problems are dark orange. Section headers use the grey tab with an orange hairline, as in the earlier prototype. All styles are injected once under `.ma-root`, so SharePoint's CSS cannot reach in and the module's CSS cannot leak out. Layout is responsive: the side rail becomes a top strip under 900 px and forms go to one column under 620 px. Controls are labelled, status is never colour-only, and focus is visible.

## 4.2 Navigation

The side rail shows only what the signed-in role may open (`nav.ts`). Navigation is hash-based (`#/cases/CASE-1001?tab=audit`), which works inside a SharePoint page and survives refresh.

| Group | Item | Module | Roles |
|---|---|---|---|
| Workspace | Home | | All |
| Products | Home Purchase | 1 | All |
| | Home Equity Release | 2 | All |
| Applications | Application wizard | 3 | Applicant, Mortgage |
| | Readiness check | 4 | Applicant, Mortgage, Credit |
| | Case management | 5 | All |
| Collaboration | Collaboration hub | 6 | All |
| Collateral | Valuations | 7 | Collateral, Valuer, Mortgage, Credit, Executive, Audit |
| | Property repository | 8 | Collateral, Legal, Mortgage, Credit, Executive, Audit |
| | Fit-to-lend workspace | 9 | Collateral, Legal, Credit Admin, Mortgage, Audit |
| After approval | Conditions tracker | 10 | Applicant and all staff |
| | Disbursement | | Credit Admin, Operations, Approver, Mortgage, Executive, Audit |
| | Post-disbursement | | Post Disbursement, Legal, Mortgage, Executive, Audit |
| Insight | Mortgage dashboard | 11 | Staff except Executive |
| | Executive dashboard | 12 | Executive, Mortgage Lead, Audit |
| | Analytics | 13 | Mortgage Lead, Executive, Credit, Audit |
| | Audit trail | | All (applicants see their own) |

A page the role cannot open shows "You do not have access", and the API enforces the same rule.

## 4.3 Pages

| Route | Page | What it does | Key actions |
|---|---|---|---|
| `#/` | Home | Applicant: your applications, what needs you, start a mortgage. Staff: KPIs, your queue, conditions needing attention, modules | Open case, start application |
| `#/purchase`, `#/equity` | Product pages | Rules, documents, journey, cases on the product | Start application, check readiness |
| `#/apply/purchase`, `#/apply/equity` | Application wizard | **Loan Eligibility** (account number, OTP, compute, results, exceptional approval), **Loan Application** in six steps with autosave and live readiness, **Finish** | Send OTP, compute, save, upload, sign, submit |
| `#/readiness` | Readiness check | What-if figures run through the same rules; start an application with them | Start with these figures |
| `#/cases` | Case list | Search, product and status filters, SLA chip | Open case |
| `#/cases/:id?tab=` | Case workspace | Summary, Forms, Documents, Tasks, Approvals, Property and valuation, Conditions, Disbursement, Collaboration, Audit | Confirm and proceed, sign and accept offer, return for correction, withdraw, request document, complete task, decide approval, verify condition, request disbursement |
| `#/hub` | Collaboration hub | Cases with threads, watch list of open requests, thread by unit | Message, request, internal note, join for oversight |
| `#/valuations` | Valuation management | Requests, KPIs, valuer panel; detail with assign, report, review | Assign valuer, submit report, accept or return |
| `#/properties` | Property repository | Search, encumbrance filter; detail with searches | Record a legal search |
| `#/fit-to-lend/:id` | Fit-to-lend workspace | Preconditions, checklist, property decision, certificate | Tick checklist, decide, issue certificate |
| `#/conditions` | Conditions tracker | All conditions with filters and KPIs | Submit evidence, verify, reject, waive |
| `#/disbursement` | Disbursement | Cases at the gate; per-case gate, tranches | Request, approve, release funds |
| `#/post-disbursement` | Post-disbursement | Ageing KPIs and items | Start, mark done |
| `#/dashboard` | Mortgage dashboard | Pipeline, throughput, stage time against target, SLA by team, needs attention | Open case |
| `#/executive` | Executive dashboard | Portfolio, ageing, turnaround, exposure by department, decline reasons, largest cases, exceptions | Open case |
| `#/analytics` | Analytics | Funnel, stage time, DSR and LTV bands, SLA, turnaround; product filter; CSV export | Export |
| `#/audit` | Audit trail | Time-stamped, filterable log | Filter |

## 4.4 Key screens

### Loan Eligibility (mirrors the existing Staff Loan screen)

```
 (1) Loan Eligibility ──── (2) Loan Application ──── (3) Finish
+---------------------------------------------+  +-------------------------------+
| Step 1 — Loan Eligibility                    |  | Computation Results           |
| Account number [1234567890123]  Loan type [v]|  |  Interest Rate (p.a.)  18.00% |
| [Send OTP] [code] [Verify]                   |  |  DIR Limit             50.00% |
| Date of birth (from payroll)  Net salary     |  |  Tenor (Months)          285  |
| Allowances (Rent + Clothing)  Loan amount    |  |  Periodic Instalment  6,087   |
| Instalment (Personal+Auto+Education)         |  |  DIR (Capital + Personal) 17% |
| Instalment (Mortgage + HP only)              |  |  DIR (All Staff Loans)    21% |
| [ ] Pay off existing loans?                  |  |  Loan Amount Qualified For    |
| [Compute Eligibility] [Reset]                |  |  Decision Rule        Eligible |
+---------------------------------------------+  | [ ] Exceptional Approval       |
                                                  | [Next Step]                    |
                                                  +-------------------------------+
```

### Case workspace

```
< All cases
MTG-2026-001001 · Ama Serwaa Owusu      [In assessment] [3d 23h left] [Withdraw]
Home Purchase · GHS 620,000 over 20 years · case owner Kwame Mensah
Summary | Forms | Documents | Tasks (4) | Approvals | Property | Conditions | Disbursement | Collaboration | Audit
+--------------------------------------+  +------------------------------+
| (100) Ready for pre-approval          |  | Where this application is    |
|  ✓ Affordability       30 pts         |  |  ✓ Application submitted     |
|  ✓ Employment          10 pts         |  |  ✓ Pre-approval              |
|  ✓ Tenor               5 pts          |  |  ● Assessment  since 13 Oct  |
|  ✓ Down payment and LTV 15 pts        |  |  ○ Approval ○ Offer ○ ...    |
|  ...                                  |  +------------------------------+
| Key facts                             |  | SLA: Parallel assessment     |
+--------------------------------------+  +------------------------------+
```

## 4.5 Behaviour

- **Autosave:** the wizard saves 400 ms after typing stops and shows "Draft saved 10:42".
- **Live readiness:** the right-hand panel updates after each save, with the specific things to fix.
- **Locking:** a submitted case is read-only. A returned case unlocks, shows the reviewer's note, and resumes at its prior stage on resubmission.
- **Actions are role-aware:** a button appears only when the role and the case state allow it, and the server checks again.
- **Errors:** failed actions show a toast with the reason (for example "Four-eyes rule: the requester cannot approve").
- **Real time:** toasts and the bell update as events arrive.
- **Print:** the fit-to-lend certificate has a print or save as PDF action.

## 4.6 Placement in Advance Flow

A new **Mortgage Accelerator** item under Staff Loan opens the SharePoint page that hosts the web part. "Create Staff Loan" can pre-select the mortgage loan type and route into the wizard (`#/apply/purchase`). "My Loans" can deep-link to a case (`#/cases/:id`). The web part's property pane has "Open on this module" so separate SharePoint pages can open straight on Valuations, Fit-to-lend or a dashboard.

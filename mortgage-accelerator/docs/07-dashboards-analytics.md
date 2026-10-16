# 7. Dashboards and Analytics

Three modules read from `GET /analytics` and from the case list. The same definitions apply on every page, so the same number never differs between two screens.

## 7.1 Metric definitions

| Metric | Definition | Source |
|---|---|---|
| Applications received | Cases with a submission date in the period, by product | `MA_Case.submitted_at` |
| Open pipeline | Sum of requested amounts of cases not closed, declined, withdrawn or expired | `MA_Case` |
| Approval rate | Cases that reached an offer or beyond, divided by cases decided (offered or declined) | `MA_Case.state` |
| Pre-approved within 24 hours | Pre-approval decisions made within 24 hours of submission, divided by all decisions | Workflow history |
| Median days in stage | Median of days between entering and leaving each stage | Workflow history |
| SLA breaches (open) | Open tasks past their due time | Tasks |
| SLA performance by team | Tasks completed on time and late, per owning team | Tasks |
| Valuation, legal, fit-to-lend, disbursement turnaround | Business days from the start event to completion | `MA_Valuation`, `MA_LegalSearch`, `MA_FitToLend`, `MA_Disbursement` |
| Portfolio disbursed | Sum of paid disbursements on active accounts | `MA_Disbursement` |
| Post-disbursement ageing | Open items by days past due: not due, 1 to 30, 31 to 60, over 60 | `MA_PostItem` |
| Debt service ratio band | Cases by DIR at application: up to 30, 30 to 40, 40 to 50, over 50 | Eligibility result |
| Loan to value band | Cases by loan (plus existing mortgage) over value: up to 60, 60 to 70, 70 to 80, over 80 | `MA_HomePurchase`, `MA_EquityRelease` |
| Decline reasons | Declined cases by reason code | `MA_Case.decline_reason` |

## 7.2 Mortgage dashboard (module 11)

For the Mortgage Team and the units around it.

| Widget | Content |
|---|---|
| KPI strip | Applications received, open pipeline, approval rate, pre-approved within 24 hours, SLA breaches, portfolio disbursed |
| Pipeline by stage | Funnel with count and value per stage |
| Applications received | Monthly stacked columns, Home Purchase and Equity Release |
| Median days in stage against target | Bars with a target tick; over-target bars in orange |
| SLA performance by team | Stacked bars, on time against breached |
| Needs attention | Cases that are referred, past SLA, or have an overdue task, with a link to open each |

## 7.3 Executive dashboard (module 12)

For executives, the Mortgage Lead and Audit.

| Widget | Content |
|---|---|
| KPI strip | Same headline numbers |
| Portfolio by product | Donut, in GHS millions |
| Post-disbursement ageing | Donut by days late |
| Turnaround against target | Valuation, legal searches, fit-to-lend, disbursement |
| Applications received | Trend |
| Pipeline exposure by department | Concentration risk, top five departments |
| Why applications are declined | Reason counts |
| Largest cases in flight | Top five by amount, with SLA |
| Needs executive attention | Cases needing the executive approval level, or referred |

## 7.4 Mortgage analytics (module 13)

For the Mortgage Lead, Executives, Credit and Audit.

| Widget | Content |
|---|---|
| Filters | Product |
| KPIs | Cases, average amount, average readiness score, approval rate, declined |
| Funnel | Conversion by stage |
| Median days per stage against target | Where time goes |
| DIR distribution | Cases per band, against the 50% limit |
| Loan to value distribution | Cases per band, against the 80% cap for purchases |
| SLA performance and turnaround | By team and by process |
| Export | Cases to CSV (reference, product, applicant, department, amount, tenor, status, readiness, DIR, submission date) |

## 7.5 Live and illustrative data

In the local harness the **counts, DIR and LTV bands, funnel, needs-attention lists and exceptions are computed from the cases shown**. The monthly series, median stage times, SLA by team, decline reasons and ageing buckets are **illustrative samples** and labelled so on the pages ("Trend series are illustrative", and a note on Analytics). In production every series comes from `GET /analytics`, which computes them from Advance Flow data.

## 7.6 Design rules

- Orange marks what needs attention or is over target; grey carries everything else.
- Every number has a label and, where it matters, a target.
- Every list links to the case behind it.
- Charts are plain SVG with text alternatives; there are no third-party chart libraries to approve or patch.
- Personal data in dashboards follows the same role rules as the case pages; aggregates are the default.

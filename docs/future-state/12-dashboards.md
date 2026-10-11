# 19. Dashboard Specifications

## 19.1 Metric definitions

| Metric | Definition | Source | Refresh |
|---|---|---|---|
| Applications received | Count of cases with `submitted_at` in the period, by product | `mortgage_application` | 5 minutes |
| Processing time | Median and 90th percentile business days from submission to disbursement, and by stage | `workflow_history` | Hourly |
| Approval rate | Approved ÷ (approved + declined) among cases decided in the period | `approval`, `mortgage_application` | Hourly |
| Rejection rate | Declined (any stage, including property rejection) ÷ cases decided | As above | Hourly |
| Mortgage pipeline | Count and value of open cases by state | `mortgage_application` | 5 minutes |
| Valuation turnaround | Business days from valuer assignment to report received | `valuation_request`, `valuation_report` | Hourly |
| Legal turnaround | Business days from search request to result, per search type | `legal_search` | Hourly |
| Fit-to-lend turnaround | Business days from property accepted to certificate issued | `collateral_assessment`, `fit_to_lend` | Hourly |
| Disbursement turnaround | Business days from gate passed to funds released | `disbursement` | Hourly |
| SLA breaches | Tasks completed or open past due, with count and percentage by team | `task` | 5 minutes |
| Portfolio value | Sum of principal of active mortgage accounts, by product and tenor band | `mortgage_account` | Daily |
| Pre-approval within 24 hours | Share of pre-approvals decided in 24 hours | `pre_approval` | Hourly |
| First-time-right documents | Cases with no document returned ÷ cases submitted | `task`, `document` | Daily |
| Conditions ageing | Open conditions by days since offer | `condition_precedent` | Hourly |
| Post-disbursement ageing | Open items by days past due | `post_disbursement` | Daily |

All dashboards support period filters, product filters and drill-through to the list of cases behind any number.

## 19.2 Dashboards by audience

### Mortgage Team (operational)

| Panel | Content |
|---|---|
| Pipeline | Funnel by state with counts and values |
| Needs attention | Cases breaching SLA, unanswered threads, no activity for 5 days |
| Applications received | Daily and weekly trend by product |
| Pre-approval performance | Within 24 hours share, referral rate |
| Conditions | Cases waiting on the applicant, by condition |
| My cases | Cases the officer owns |

### Credit Team

| Panel | Content |
|---|---|
| Queue | Referred cases and credit recommendations due, by age |
| Assessment quality | DSR distribution, score distribution, exceptions count |
| Bureau | Result time, failures and manual overrides |
| Decisions | Approval and decline reasons |
| Query loops | Open queries to applicants, average response time |

### Legal Team

| Panel | Content |
|---|---|
| Searches | Open and overdue by type; result mix (clear, notes, adverse) |
| Turnaround | By search type against SLA-07 |
| Documents | Mortgage deeds in preparation, awaiting signature |
| Conditions | Legal advice, declarations and consents outstanding |

### Collateral Team

| Panel | Content |
|---|---|
| Valuations | Requests by status, valuer workload, overdue reports |
| Turnaround | Valuation, property acceptance, fit-to-lend |
| Property decisions | Accept, accept with conditions, reject, with reasons |
| Valuation quality | Value versus price, FSV ratio outliers |
| Stage payments | Inspections due and certificates pending |

### Operations

| Panel | Content |
|---|---|
| Disbursement queue | Ready, approved, paid, pending posting |
| Turnaround | Gate-to-payment time |
| Exceptions | Payee mismatch, posting failures |
| Activations | Accounts created and activated today |
| Reconciliation | Differences between platform and core banking |

### Post Disbursement

| Panel | Content |
|---|---|
| Items by status | Open, in progress, done, overdue by item type |
| Ageing | 0–30, 31–60, 61–90, 90+ days |
| Safe custody | Originals received and outstanding |
| Alerts | Due soon and overdue |

### Management

| Panel | Content |
|---|---|
| Headline | Applications, pipeline value, approvals, disbursements, portfolio value |
| End-to-end time | Median and 90th percentile, trend, by stage |
| Bottlenecks | Stages with longest queue and most breaches |
| Quality | Rejection reasons, return rates, exception counts |
| Risk | Concentration by department and branch, DSR bands, LTV bands |
| Benefits | Metrics versus baseline from [14](14-roadmap-benefits.md) |

## 19.3 Alerts and scheduled reports

| Item | Detail |
|---|---|
| SLA digest | Daily email to unit heads with breaches and nearing breaches |
| Weekly management pack | PDF of the management dashboard |
| Regulatory and audit extracts | On demand, with filters and audit logging |
| Threshold alerts | Pipeline stalls, spike in declines, integration failure rate |

## 19.4 Data design

Reporting reads from an event-fed reporting store, not the transaction database, so heavy queries do not slow operations. Metrics are defined once in a semantic layer so every dashboard uses the same definition. Personal data in dashboards is limited to what the viewer's role allows; aggregates are shown by default.

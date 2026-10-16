# 8. Business Rules

Every rule here is a pure function in `spfx/src/app/domain/rules.ts` with unit tests (`rules.test.ts`, `lifecycle.test.ts`), so the same logic runs in the wizard preview, the harness and (as a reference implementation) alongside the server's own checks.

## 8.1 Parameters

All values are configuration in `MA_Config` with effective dates and version history. **Source** says where each value comes from.

| Parameter | Value | Source |
|---|---|---|
| Minimum down payment, purchase | 20% of price | Paper mortgage form |
| Maximum equity release | 70% of forced sale value, less existing mortgage balance | Your brief; deduction is decision D1 |
| Maximum loan to value, purchase | 80% (follows from 20% down) | Derived |
| DIR limit | 50% of income | **Assumed.** Production uses the DIR Limit from the Staff Loan eligibility service, shown in the existing screen |
| Comfortable DIR | 40% | Assumed, for scoring |
| Maximum tenor | 30 years purchase, 20 years equity release, and never beyond age 60 | **Assumed.** Retirement age 60 and the caps need confirming |
| Interest rate | 18% p.a. | **Assumed placeholder.** Production uses the service's rate |
| Pre-approval validity | 90 days purchase, 60 days equity release | Assumed (D2) |
| Offer validity | 30 days | Assumed |
| Minimum service for stability | 2 years | Assumed |
| Approval tiers | up to 500,000, up to 1,500,000, up to 3,000,000, above | **Illustrative** (D4) |
| SLA targets | See [03](03-workflow-architecture.md) | Proposed (D3) |
| Post-disbursement due days | 30, 60, 90, 120, 130 | Proposed |

## 8.2 Rule catalogue

| ID | Rule | Function | Tested |
|---|---|---|---|
| BR-01 | One active application per employee per product | readiness `duplicateActive` hard stop; unique index | Yes |
| BR-02 | Tenor may not pass the retirement date or the product cap | `maxTenorYears`, `wholeYearsBetween` | Yes |
| BR-03 | Equity release at most 70% of FSV less existing mortgage | `maxEquityRelease` | Yes |
| BR-04 | Equity release property must be in the applicant's name | readiness hard stop `titleInApplicantName` | Yes |
| BR-05 | No credit bureau check without consent | `consentComplete`, readiness hard stop | Yes |
| BR-06 | Valuation and searches start only after pre-approval and the applicant's confirmation | `confirmProceed` | Yes |
| BR-07 | Fit-to-lend needs accepted valuation, clear searches, accepted property, complete checklist | `fitToLendBlockers` | Yes |
| BR-08 | Nobody works on or approves their own case or one with a declared conflict | `UserContext.conflictCaseIds`; server | Server |
| BR-09 | The preparer of a recommendation cannot approve it | server | Server |
| BR-10 | No disbursement while a mandatory condition is open | `disbursementBlockers` | Yes |
| BR-11 | Under-construction purchases and renovations disburse in stages | `equityPayeeRule`, tranche limits | Yes |
| BR-12 | A decline needs a reason and is never automatic | `decideApproval`, readiness decisions | Yes |
| BR-13 | A married applicant needs spousal consent as a condition | `conditionTemplates` | Yes |
| BR-14 | A change after pre-approval re-runs the affected checks | `refreshReadiness` | Yes |
| BR-15 | A disbursement approver differs from the requester | `approveDisbursement` | Yes |
| BR-16 | Total disbursed at most the approved amount | `remainingToDisburse` | Yes |
| BR-17 | Exceptional Approval is available only when the eligibility result is over the limit, and adds the executive level | `computeEligibility`, `approvalPlan` | Yes |

## 8.3 Eligibility (the Loan Eligibility step)

Mirrors the existing Staff Loan screen. In production the Advance Flow service's numbers are shown; the module's function is the reference for the local preview.

```
income                  = net salary + allowances
tenor (months)          = min(product cap, months to age 60, requested)
periodic instalment     = P × r / (1 − (1 + r)^−n)        r = monthly rate, n = months
DIR (Capital + Personal)= (new instalment + mortgage/HP instalments) / income
DIR (All Staff Loans)   = (new instalment + mortgage/HP + personal/auto/education) / income
                          (personal/auto/education excluded if existing loans are paid off)
room                    = DIR limit × income − mortgage/HP − personal (as above)
Loan Amount Qualified For = the loan whose instalment equals `room`
Decision Rule           = Eligible
                          | Exceeds DIR limit            (DIR all > limit)
                          | Exceeds qualified amount     (amount > qualified)
                          | Not eligible                 (missing figures)
```

The two DIR definitions are an assumption (question Q1 in [01](01-solution-architecture.md)). Exceptional Approval can be ticked only for the two "exceeds" outcomes.

## 8.4 Readiness engine (pre-approval)

Weights sum to 100. Each check scores Pass 100%, Warn 60%, Pending 50%, Fail 0%.

| Check | Weight | Pass | Warn | Fail |
|---|---|---|---|---|
| Affordability | 30 | DIR at or below 40% | up to 50% | above 50% |
| Employment stability | 10 | Permanent and 2+ years | Contract, probation or short service | |
| Tenor within retirement | 5 | Within cap | | Beyond cap |
| Down payment and LTV (purchase) | 15 | At least 20% down and loan within 80% | | Otherwise |
| 70% of FSV (equity release) | 15 | Request within the cap | | Over the cap; Pending until a valuation exists |
| Consent | 10 | Four required consents | | Missing (hard stop) |
| Documents | 10 | 100% | 60% or more | Less |
| Credit bureau | 10 | Good | Fair | Poor; Pending until run |
| HR verification | 10 | Verified | | Not verified (hard stop); Pending until done |

| Score and flags | Decision |
|---|---|
| 75 or more and no failed check, no hard stop | **Pre-approved** |
| 55 to 74, or any failed check | **Referred** to a Credit officer |
| Below 55, or any hard stop | **Not eligible as submitted**: a Credit officer confirms before the applicant is told |

Hard stops: under 18, no tenor possible before retirement, consent incomplete, HR could not verify, duplicate active application, equity property not in the applicant's name. **The engine never declines on its own** (BR-12).

Eligible amount = the lowest of the amount requested, the collateral cap (price less down payment and 80% of the lower of price and value, or 70% of FSV less existing mortgage), and the affordability cap (the loan whose instalment equals 50% of net income less existing obligations).

## 8.5 Approval matrix (illustrative amounts, D4)

| Tier | Amount | Levels | Groups (run in parallel inside a group) |
|---|---|---|---|
| T1 | up to 500,000 | L1, L4, L5, L7 | {L1, L4} then {L5} then {L7} |
| T2 | up to 1,500,000 | L1, L2, L4, L5, L6, L7 | {L1, L2, L4} then {L5} then {L6, L7} |
| T3 | up to 3,000,000 | L1, L2, L3, L4, L5, L6, L7 | {L1, L2, L3, L4} then {L5} then {L6, L7} |
| T4 | above 3,000,000 | T3 plus L8 | then {L8} |

L1 HR, L2 Director HR, L3 DMD, L4 Head of Mortgage, L5 Credit Administration, L6 Head Personal Banking, L7 Head Credit Evaluation, L8 Executive. A policy exception, including **Exceptional Approval** at eligibility, adds L8 to any tier. A decision needs a reason to return or decline.

## 8.6 Conditions precedent

| Condition | Applies to |
|---|---|
| Down payment proof | Home Purchase |
| Vendor due diligence cleared | Home Purchase with a private vendor |
| Spousal consent | Married applicant |
| Independent legal advice, statutory declaration, insurance, registration fees, property inspection, mortgage documents signed | Both |
| Existing lender consent to a second charge | Equity Release with another lender |

## 8.7 SLA and escalation

A clock has a start, a due time, paused minutes and a paused-since time. State: on track below 75% elapsed, warning from 75%, breached from 100%. A paused clock does not advance. A task past due escalates to the supervisor, and to the unit head after half the SLA again.

## 8.8 Equity release payee rules

| Purpose | Payee | Stages |
|---|---|---|
| Tuition | The institution, direct | Single payment |
| Medical | Hospital or provider, direct | Single payment |
| Home improvement, renovation | Contractor | Stage payments after inspection |
| Family emergency | Applicant's account | Single payment |

# 8. Mortgage Product Design, 9. Home Purchase Journey, 10. Equity Release Journey

## 8.1 Products

| | **Product A: Home Purchase Mortgage** | **Product B: Home Equity Release** |
|---|---|---|
| Purpose | Buy a completed or under-construction property from a developer or private vendor | Release equity from a property the applicant owns |
| Permitted uses | Purchase | Home improvement, home renovation, medical expenses, family emergency, tuition payments |
| Security | First legal mortgage over the property bought | Legal mortgage over the owned property (first, or second subject to D1) |
| Counterparty | Vendor or developer (Form J if private) | None; optional payee (school, hospital, contractor) |
| Maximum amount | Lowest of requested amount, 80% of price or value, and affordability limit | Lowest of requested amount, 70% of forced sale value less any existing mortgage balance, and affordability limit |
| Customer contribution | Minimum 20% down payment (from the paper form) | Not applicable |
| Valuation | Required | Required |
| Property rule | Property acceptable to Collateral; searches clear | Property must belong to the applicant, be properly documented, and pass valuation and fit-to-lend |
| Disbursement | To vendor or developer; stage payments for under-construction property | To applicant account or direct to payee; stage payments for renovation |
| Specific documents | Offer letter from vendor, sale agreement, vendor due diligence | Title in applicant's name, equity release request letter, purpose evidence |

Both products use the same case, document, communication and approval services.

## 8.2 Product parameters

All values are configuration with effective dates and version history. Defaults below are **proposed** unless marked.

| Parameter | Home Purchase | Equity Release | Source |
|---|---|---|---|
| Minimum down payment | 20% of price | n/a | Paper form |
| Maximum LTV | 80% | n/a (see FSV cap) | Derived from 20% down |
| Maximum release | n/a | 70% of FSV | Brief |
| Maximum tenor | Lower of 30 years and years to retirement date | Lower of 20 years and years to retirement date | Proposed |
| Minimum / maximum amount | Set by product owner | Set by product owner | To confirm |
| Maximum debt service ratio | 50% of net income | 50% of net income | Proposed |
| Interest rate | Staff rate table by tenor | Staff rate table by tenor | D5 |
| Pre-approval validity | 90 days | 60 days | Proposed (D2) |
| Offer validity | 30 days | 30 days | Proposed |
| Mortgage protection insurance | Required | Required | Proposed (D7) |

## 8.3 System calculations

**Gross monthly income** = basic salary + allowances + other verified income.
**Net monthly income** = gross − tax − pension and social security − other statutory deductions.
**Existing obligations** = sum of monthly repayments on loans and facilities, rent or current mortgage payment, maintenance.
**Proposed instalment** = `P × r / (1 − (1 + r)^−n)` where P is the loan amount, r the monthly rate and n the months. If r is 0, instalment = P ÷ n.
**Disposable income** = net income − existing obligations − proposed instalment.
**Debt service ratio (DSR)** = (existing obligations + proposed instalment) ÷ net income.
**Debt to income (DTI)** = (existing obligations + proposed instalment) ÷ gross income.
**LTV** = loan amount ÷ lower of purchase price and valuation (purchase) or ÷ market value (equity release).
**Maximum instalment** = DSR cap × net income − existing obligations.
**Affordability-based maximum loan** = present value of the maximum instalment over the tenor at the product rate.
**Eligible amount (purchase)** = min(requested, 80% × lower of price and value, affordability-based maximum).
**Eligible amount (equity release)** = min(requested, 70% × FSV − existing mortgage balance, affordability-based maximum), never below zero.
**Net worth** = total assets − total liabilities. **Exposure ratio** = (total liabilities + new loan) ÷ total assets.

### Affordability score (0 to 100, proposed weights)

| Component | Weight | Scoring idea |
|---|---|---|
| Debt service ratio | 50 | Full marks at or below 30%, zero at the cap, linear between |
| Residual income after instalment | 30 | Full marks at or above a configured living-cost buffer, zero at zero |
| Income stability | 20 | Permanent and long service score highest; probation and contract lower |

### Eligibility score (0 to 100, proposed weights)

| Component | Weight |
|---|---|
| Affordability score | 40 |
| Credit bureau result | 30 |
| HR and employment verification | 15 |
| Collateral and LTV strength | 15 |

| Score | Pre-approval decision |
|---|---|
| 75 and above, no hard-stop flags | **Pre-Approved** automatically |
| 55 to 74, or any soft flag | **Referred to Credit** for human decision |
| Below 55, or any hard stop | **Referred, not eligible as submitted**: a Credit Officer must confirm before the applicant is told |

Hard stops: employment not verified, applicant under 18 or past retirement date before tenor end, duplicate active application, bureau consent missing, sanctions or internal blacklist match, equity release where the property is not in the applicant's name.

## 8.4 Business rules

| ID | Rule |
|---|---|
| BR-01 | One active application per employee per product. |
| BR-02 | Tenor may not extend beyond the applicant's retirement date. |
| BR-03 | Equity release cannot exceed 70% of forced sale value (less existing mortgage balance, D1). |
| BR-04 | Equity release property must be registered in the applicant's name (or jointly with a consenting co-owner who signs). |
| BR-05 | Bureau check requires recorded consent. |
| BR-06 | Valuation and legal searches start only after pre-approval and the applicant's confirmation to proceed. |
| BR-07 | The fit-to-lend certificate needs accepted valuation, clear searches and property acceptance. |
| BR-08 | A user cannot work on or approve their own case, a relative's case, or a case where a conflict is declared. |
| BR-09 | The person who prepares a recommendation cannot approve it. |
| BR-10 | Disbursement is impossible while any mandatory condition precedent is open. |
| BR-11 | Under-construction purchases disburse in stages against a valuer's progress certificate. |
| BR-12 | A decline requires a reason code and an approver, and is never automatic. |
| BR-13 | A married applicant needs spousal consent as a condition (Form checklist). |
| BR-14 | A change to amount, property or applicant after pre-approval re-runs the affected checks. |

## 9. Home Purchase journey

| # | Step | Actor | Automation | Target time |
|---|---|---|---|---|
| 1 | Sign in, choose Home Purchase | Applicant | Draft created, staff data pre-filled | minutes |
| 2 | Complete Forms A, B, F, G, E; Form J if private vendor; upload documents | Applicant | Validation, live calculations, duplicate check | applicant paced |
| 3 | Sign consent (Form C), co-borrower signs if any | Applicant, co-borrower | E-signature with timestamp | minutes |
| 4 | Submit | Applicant | Application number, case, lock, audit | instant |
| 5 | **Pre-approval**: validation, HR verification, bureau check, affordability, risk, score | System, HR | Parallel HR and bureau; HR task with 4 business hours | under 24 hours |
| 6 | Pre-approval decision and notification | System, Credit (if referred) | Letter generated | with step 5 |
| 7 | Applicant confirms to proceed; pays valuation and search fees if charged | Applicant | Payment link | applicant paced |
| 8 | **Parallel tracks**: valuation (D), legal searches, vendor due diligence, full credit assessment | Collateral, Legal, Credit | Four task sets open together | 5 business days target |
| 9 | Property acceptance | Collateral | Rule check on valuation and searches | 2 business days |
| 10 | Credit recommendation | Credit | Pre-filled memo from case data | 2 business days |
| 11 | Approval by tier | Approvers | Matrix routing, parallel where allowed | 1 business day per approver |
| 12 | Offer letter and Truth in Lending generated; applicant signs; pays fees | System, Applicant | Template generation, e-signature | 1 hour to generate |
| 13 | Conditions precedent satisfied and verified | Applicant, Legal, Collateral, Credit Admin | Checklist gating | 30 days |
| 14 | Fit-to-lend certificate; mortgage security documentation; applicant signs mortgage documents | Collateral, Legal, Applicant | Generated | 1 to 2 business days |
| 15 | Disbursement request, verification, approval | Credit Admin, Operations | Gate check | 2 business days |
| 16 | Pay vendor; create and activate mortgage account | Operations | Core banking integration | same day |
| 17 | Registration, perfection, Lands Commission, title perfection, safe custody | Post Disbursement | Tracked items with alerts | per item due date |

Under-construction properties repeat steps 14 to 16 for each stage payment against a progress certificate.

## 10. Equity Release journey

| # | Step | Actor | Automation | Target time |
|---|---|---|---|---|
| 1 | Sign in, choose Equity Release | Applicant | Draft created | minutes |
| 2 | Complete Forms A, F, G, E (own property), H (equity release application), I (request letter); upload title documents and purpose evidence | Applicant | 70% FSV rule shown as a warning until valuation exists | applicant paced |
| 3 | Sign consent (Form C) | Applicant | E-signature | minutes |
| 4 | Submit | Applicant | Case created, ownership check against title number | instant |
| 5 | **Pre-approval** on affordability, bureau, HR; indicative release based on declared value | System, HR | Same engine; collateral strength uses declared value, flagged as indicative | under 24 hours |
| 6 | Valuation request (Form D) and legal searches start after confirmation | Applicant, Collateral, Legal | Valuer assigned, searches opened | 5 business days |
| 7 | Valuation report gives market value and **forced sale value**; system recalculates maximum release at 70% of FSV less existing mortgage balance | Valuer, Collateral, System | Rule check; if request exceeds cap, applicant may reduce amount in the portal | 1 day |
| 8 | Ownership and encumbrance review; property acceptance | Legal, Collateral | Searches compared to declared ownership | 2 business days |
| 9 | Credit recommendation, approval by tier | Credit, Approvers | As Home Purchase | 3 business days |
| 10 | Offer, Truth in Lending, e-signature, fees | System, Applicant | Generated | 1 hour |
| 11 | Conditions: spousal consent, independent legal advice, statutory declaration, insurance, registration fees, existing lender consent if a prior charge exists | Applicant, Legal, Credit Admin | Checklist gating | 30 days |
| 12 | Fit-to-lend, security documentation, mortgage signing | Collateral, Legal, Applicant | Generated | 2 business days |
| 13 | Disbursement to applicant, or direct to payee for tuition, medical or contractor payments; tranches for renovation against progress inspection | Credit Admin, Operations | Purpose-based payee rules | 2 business days |
| 14 | Account activation and post-disbursement tracking | Operations, Post Disbursement | As Home Purchase | per item |

### Equity Release specifics

- **Purpose evidence by use** (proposed): home improvement or renovation needs a contractor quote and a plan; medical needs an invoice or a doctor's letter; tuition needs an admission or fee letter; family emergency needs a signed statement of need and evidence where available.
- **Payee rules**: tuition and medical default to direct payment to the institution; renovation defaults to stage payments. The applicant may request an exception, which the Mortgage Team and Credit decide.
- **Existing mortgage with another lender** needs that lender's consent to a second charge, and is a condition precedent.
- **Request letter (Form I)** is compared to the declared purpose; a mismatch raises a Credit query.

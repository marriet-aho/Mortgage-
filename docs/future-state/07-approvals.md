# 13. Approval Matrix

> **Illustrative.** The amounts below are placeholders to show how the matrix works (A2, D4). The bank's Board-approved Delegated Authority Matrix replaces them, loaded as configuration with effective dates.

## 13.1 Approval levels

| Level | Role | Purpose |
|---|---|---|
| L1 | HR Approval | Confirms employment, standing and eligibility under staff policy |
| L2 | Director HR Approval | No-objection from the HR Director on higher staff exposure |
| L3 | DMD Approval | No-objection from the Deputy Managing Director for the largest staff exposure |
| L4 | Head Mortgage Approval | Product and process approval |
| L5 | Credit Administration Approval | Confirms documentation and conditions are in order |
| L6 | Personal Banking Approval | Head of Personal Banking approval of the exposure |
| L7 | Head Credit Evaluation Approval | Credit risk approval |
| L8 | Executive Approval | Final authority above the Head of Credit limit |

The AS-IS process sends every application through the HR chain (HR Approval, Director HR, DMD, No Objection) and then four approvers in order. The future state selects the levels by tier so smaller facilities need fewer steps.

## 13.2 Tiers and required approvals (illustrative GHS limits)

Amount is the facility amount for the case, including any related existing exposure to the same applicant.

| Tier | Facility amount | Required levels | Parallel groups |
|---|---|---|---|
| T1 | Up to 500,000 | L1, L4, L5, L7 | L1 and L4 together, then L5, then L7 |
| T2 | Above 500,000 up to 1,500,000 | L1, L2, L4, L5, L6, L7 | L1 and L2 and L4 together, then L5, then L6 and L7 together |
| T3 | Above 1,500,000 up to 3,000,000 | L1, L2, L3, L4, L5, L6, L7 | L1, L2, L3, L4 together, then L5, then L6 and L7 |
| T4 | Above 3,000,000 | All of T3 plus L8 | As T3, then L8 |

Additional routing rules:

| Condition | Effect |
|---|---|
| Any policy exception (DSR above cap, LTV above limit, tenor beyond retirement, bureau adverse) | Add L8 or the next tier up, with an exception record |
| Applicant is a senior officer (grade configurable) | Move up one tier for HR levels |
| Equity Release | Same tiers; L5 also confirms purpose evidence and payee |
| Co-borrower income used | No change in tier; Credit notes it in the recommendation |
| Amount changes after approval | Re-route to the tier for the new amount; earlier approvals stand if within their limits and the change is a decrease |

## 13.3 Authority limits per approver

Each approver has a limit per product. The system refuses a decision above the approver's limit and routes up instead.

| Level | Per-case limit (illustrative) | Can approve exceptions |
|---|---|---|
| L1 HR Approval | Up to 1,500,000 | No |
| L2 Director HR | Up to 3,000,000 | No |
| L3 DMD | Above 3,000,000 | No |
| L4 Head Mortgage | Up to 3,000,000 | Minor (tenor, document waivers) |
| L5 Credit Administration | Up to 3,000,000 (documentation only) | Document waivers |
| L6 Head Personal Banking | Up to 3,000,000 | Yes, within limit |
| L7 Head Credit Evaluation | Up to 3,000,000 | Yes, within limit |
| L8 Executive | Unlimited within bank policy | Yes |

## 13.4 Decision options

Each approver chooses one:

| Decision | Result |
|---|---|
| Approve | Moves to next group |
| Approve with conditions | Adds conditions precedent to the case; later approvers see them |
| Return | Back to Credit or Mortgage Team with a required reason; case goes to the stage named |
| Decline | Requires reason code and comment; decline needs a second approver at the next level to confirm (BR-12) |

## 13.5 Segregation and conflict rules

| Rule | Description |
|---|---|
| No self-approval | Approver cannot be the applicant, co-borrower, or a person in their reporting line |
| Preparer not approver | A person who prepared the credit recommendation cannot approve it |
| One vote per person per case | If a person holds two roles, they approve once at the higher level |
| Relative or conflict declaration | Approver declares a conflict; the task reroutes to the alternate |
| Same-branch rule | Optional: approvers from the applicant's branch cannot approve |

## 13.6 Escalation rules

| Trigger | Action |
|---|---|
| 75% of SLA used | Reminder to approver |
| 100% of SLA | Notify approver's supervisor and Mortgage Team |
| 150% of SLA | Reassign to alternate or delegate with a reason |
| Approver absent (leave) | Task goes to delegate automatically |
| Two returns on the same case | Flag to Head of Mortgage for review |

## 13.7 Delegation rules

| Rule | Detail |
|---|---|
| Recording | Delegator sets delegate, start, end and scope in the platform |
| Maximum period | 30 days by default; longer needs the next level up |
| Limit | A delegate acts within the lower of the delegator's and delegate's own limits |
| No chain | A delegate cannot re-delegate |
| Conflict | Delegate subject to the same conflict checks |
| Audit | Every decision shows "decided by X on behalf of Y" |
| Revocation | Delegator can revoke at any time; open tasks return to the delegator |

## 13.8 Approval record

Each decision stores: level, approver, delegator if any, decision, conditions, reason code, comment, exception flag, decision time, time in queue, and the version of the matrix used. The matrix version is kept so past decisions can be explained.

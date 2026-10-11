# 11. Case Management Design, 12. Workflow Automation Matrix, 14. Communication Framework

## 11. Case management design

### 11.1 Case structure

A case is created automatically when the applicant starts an application and persists until closure.

| Section | Contents |
|---|---|
| Applicant | Applicant, co-borrower, HR verification |
| Mortgage | Product, amount, tenor, rate, pre-approval, offer |
| Property | Property, vendor, valuation, searches, collateral assessment, fit-to-lend |
| Documents | All files with versions |
| Credit | Financial assessment, bureau, recommendation |
| Approvals | Each approval level and decision |
| Tasks | Open and closed, by unit |
| Communications | Threads and notes |
| Conditions | Conditions precedent and post-disbursement items |
| SLA | Clocks per stage and task |
| Audit | Timeline of every event |

### 11.2 Case states

| State | Meaning | Exit |
|---|---|---|
| Draft | Applicant filling forms | Submit |
| Submitted | Locked, awaiting validation | Validated or returned |
| Pre-Approval | Automated checks and HR verification running | Decision |
| Referred | Credit Officer deciding | Pre-approved or declined with reason |
| Pre-Approved | Applicant may proceed | Applicant confirms, or letter expires |
| In Assessment | Parallel tracks: valuation, legal, vendor, credit | All tracks complete |
| In Approval | Approvers deciding | Approved, declined, or returned |
| Offer Issued | Offer and TIL with applicant | Accepted, expired, withdrawn |
| Conditions Pending | Conditions precedent being satisfied | All verified |
| Ready to Disburse | Gate passed | Disbursement approved |
| Disbursed | Funds released, account being activated | Account active |
| Post-Disbursement | Registration and perfection tracked | All items closed |
| Closed | Complete | Reopen with reason |
| On Hold, Withdrawn, Declined, Expired | Terminal or paused | Hold can resume; others are final |

Diagram: [11-process-flows.md, lifecycle](11-process-flows.md).

### 11.3 Capabilities

| Capability | Design |
|---|---|
| **Creation** | On product selection; case ID `MTG-yyyy-nnnnnn`; owner is a Mortgage Officer assigned by rule on submission. |
| **Assignment** | Rules choose a team, then a person: named, round-robin, least loaded, or skill-based. Excludes users with a conflict. Manual reassign by supervisor with a reason. |
| **Tasks** | Each stage opens tasks with owner team, due time and required evidence. Tasks close with an outcome code. |
| **SLA** | Clock per task and per case, in business hours, paused while a request to the applicant is open. See table 11.4. |
| **Escalation** | Warning at 75% of SLA, breach at 100%, escalate to supervisor at breach, to unit head at 150% (configurable). Notifies via in-app and email. |
| **Workflow tracking** | Applicant sees stage and status; staff see tasks and history. |
| **Activity history** | Chronological feed of events, messages, document changes and decisions. |
| **Conditions** | Checklist with owner, due date, evidence and verifier. |
| **Closure** | Requires all post-disbursement items closed or waived with approval; produces a closure summary. |
| **Hold, withdraw, reopen** | Reason required; withdrawal stops dependent tasks and spend. |
| **Ring-fencing** | Case hidden from users in the applicant's reporting line, same branch or declared conflict. |

### 11.4 SLA policy (proposed; D3)

| ID | Task | Target | Clock |
|---|---|---|---|
| SLA-01 | Pre-approval, submission to decision | 24 hours | Elapsed, pauses for applicant |
| SLA-02 | HR verification | 4 business hours | Business |
| SLA-03 | Bureau result | 15 minutes automated, 1 business day manual | Mixed |
| SLA-04 | Credit review of a referred application | 1 business day | Business |
| SLA-05 | Valuer assignment | 1 business day | Business |
| SLA-06 | Valuation report | 5 business days | Business |
| SLA-07 | Legal searches (each) | 5 business days | Business |
| SLA-08 | Property acceptance | 2 business days | Business |
| SLA-09 | Credit recommendation | 2 business days | Business |
| SLA-10 | Each approval level | 1 business day | Business |
| SLA-11 | Offer generation | 1 hour | Elapsed |
| SLA-12 | Fit-to-lend issuance | 1 business day | Business |
| SLA-13 | Disbursement verification and approval | 2 business days | Business |
| SLA-14 | Payment after approval | Same business day | Business |
| SLA-15 | Applicant response to a query | 5 business days, then reminder and hold | Business |
| SLA-16 | Responses in a thread | 1 business day | Business |

## 12. Workflow automation matrix

| ID | Automation | Trigger | Process | Output | Business benefit |
|---|---|---|---|---|---|
| AUT-01 | Application number generation | Applicant submits | Allocate next sequence from a per-year counter, check uniqueness | `MTG-yyyy-nnnnnn` shown to applicant and stamped on every document | Single identifier across systems |
| AUT-02 | Case creation | Product selected | Create case, draft, owner assignment on submit, SLA clocks start at submit | Case with timeline | One record from the first click |
| AUT-03 | Document validation | File uploaded | Check type, size, virus scan, required category, legibility score | Accepted or rejected with reason | Fewer rework loops |
| AUT-04 | OCR extraction | Document accepted | Extract fields (name, ID, salary, title number, dates), compare to form data | Extracted data and mismatch flags | Less manual checking and keying |
| AUT-05 | Employee verification | Submission | Query HR system for status, salary, dates; compare to form | HR task pre-filled, discrepancies flagged | Faster HR step, fewer errors |
| AUT-06 | Affordability assessment | Form F saved or HR verified | Compute income, DSR, DTI, score, eligible amount | Assessment record and score | Consistent decisions |
| AUT-07 | Credit bureau request | Consent signed and identity verified | Call bureau adapter, parse score and exposures, store report | Bureau result on case | Removes a manual hand-off |
| AUT-08 | Pre-approval decision | Assessments complete | Compute eligibility score; apply hard stops; decide band | Pre-approved, referred or ineligible-as-submitted; letter | Decision under 24 hours |
| AUT-09 | Valuation request | Applicant confirms to proceed | Create Form D task for Collateral; suggest valuer; start SLA | Valuation request, valuer assignment | Starts early, in parallel |
| AUT-10 | Legal search requests | Applicant confirms to proceed | Open land, certificate and consolidated searches in parallel | Search tasks with SLA | Early title findings |
| AUT-11 | Approval routing | Credit recommendation complete | Evaluate matrix from amount, product, flags; create approval tasks, parallel where allowed | Approval chain with due times | No manual routing |
| AUT-12 | Offer generation | Final approval | Merge case data into offer and TIL templates; send for e-signature | Signed offer pack | Consistent documents, quick turnaround |
| AUT-13 | Mortgage deed generation | Offer accepted and property accepted | Merge into deed template, route to Legal for review | Draft deed | Faster legal drafting |
| AUT-14 | Fit-to-lend issuance | Valuation, searches and acceptance complete | Check three preconditions, generate certificate | Fit-to-lend certificate | Blocks unsafe lending |
| AUT-15 | Security registration tracking | Mortgage documents signed | Create registration items with due dates and owners | Tracked items with alerts | Visibility of perfection |
| AUT-16 | Disbursement request | All mandatory conditions verified | Gate check; create request with payee and amount; route to Credit Admin | Disbursement request | Prevents early release |
| AUT-17 | Mortgage account activation | Funds released | Create account in core banking, set schedule and rate, activate | Mortgage account number | Same-day activation |
| AUT-18 | Reminders and escalation | SLA thresholds, open applicant queries | Send reminders, escalate by rule | Notifications and escalation record | Fewer breaches |
| AUT-19 | Expiry handling | Pre-approval or offer validity ends | Expire, notify, offer to renew | Case state change | Clean pipeline |

## 14. Communication framework

### 14.1 Components

| Component | Description |
|---|---|
| Threads | Each case has threads by purpose: with HR, with Credit, with Legal, with Collateral, with Operations, with Vendor (if any), and a general thread. Each thread has named participants. |
| Messages | Text, mentions, file attachments, reply-to. Attachments are filed in the case's document repository with a category and classification. |
| Requests for information | A message type that creates a task for the recipient, with due date and a clock that pauses the case SLA while open. |
| Internal notes | Staff-only notes on the case, never shown to the applicant. |
| Search | Full text across threads the user may see. |
| Audit | Messages are immutable; edits and deletions leave a visible trace. |

### 14.2 Who can talk to whom

| From \ To | Applicant | HR | Credit | Legal | Collateral | Operations | Mortgage Team | Vendor |
|---|---|---|---|---|---|---|---|---|
| Applicant | | Yes | Yes | Yes | Yes | Yes | Yes | Via case only |
| HR | Yes | | Internal | No | No | No | Yes | No |
| Credit | Yes | Internal | | Internal | Internal | Internal | Yes | No |
| Legal | Yes | No | Internal | | Internal | Internal | Yes | Yes (property matters) |
| Collateral | Yes | No | Internal | Internal | | Internal | Yes | Yes (property matters) |
| Operations | Yes | No | Internal | No | Internal | | Yes | Payment details only |
| Mortgage Team | Yes (oversight and exceptions) | Yes | Yes | Yes | Yes | Yes | | Yes |

"Internal" means staff-only threads that the applicant cannot see.

### 14.3 Mortgage Team oversight

- A watch list shows threads with an unanswered message past SLA-16, requests past due, and cases with no activity.
- The team can join a thread with a visible "Mortgage Team joined" marker.
- They do not need to read or forward routine messages.

### 14.4 Notification matrix

| Event | Applicant | Owner unit | Mortgage Team | Channels |
|---|---|---|---|---|
| Submission | Yes (with reference number) | Mortgage Team queue | Yes | In-app, email, SMS |
| Request for information | Yes | Requester | Watch list | In-app, email, SMS |
| Pre-approval decision | Yes | Credit if referred | Yes | In-app, email, SMS |
| Valuation scheduled and completed | Yes | Collateral | Yes | In-app, email |
| Property accepted or rejected | Yes | Collateral, Legal | Yes | In-app, email, SMS |
| Approval decision | Yes | Credit | Yes | In-app, email |
| Offer ready to sign | Yes | | Yes | In-app, email, SMS |
| Condition due | Yes | Verifier | Watch list | In-app, email |
| Disbursed | Yes | Operations | Yes | In-app, email, SMS |
| Post-disbursement item overdue | | Post Disbursement | Yes | In-app, email |
| SLA warning and breach | | Task owner, supervisor | Yes | In-app, email |

Templates are configurable per event, with approved wording, language and variables. The submission wording for the applicant is: "Your mortgage application has been submitted successfully. Reference Number: {reference}. You will receive updates as your application progresses." The team message is: "A new mortgage application has been submitted and requires review."

### 14.5 Visibility rules

- Credit assessment details and bureau data are hidden from Vendor, Operations and unit staff outside Credit, Approvers and Mortgage Team.
- HR sees employment and income fields but not bureau data.
- Valuers see only the valuation request and property details.
- Vendors see only their own due-diligence form and property documents.

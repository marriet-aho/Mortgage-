# 5. API Contract

This is the contract the module needs from Advance Flow. It is implemented as the `AdvanceFlowClient` interface (`services/client.ts`), with `HttpAdvanceFlowClient` as the production implementation and a mock for the harness. Paths below are what the HTTP client calls today.

> **To confirm.** I have not seen the Advance Flow API reference. Treat the paths as the module's requirement. Where Advance Flow already offers an endpoint for the same purpose (applications, tasks, approvals, notifications, audit), map it in `HttpAdvanceFlowClient` or put a thin adapter in front of it. Nothing else in the module changes.

## 5.1 Conventions

| Topic | Rule |
|---|---|
| Base URL | Web part property `apiBaseUrl`, for example `https://advanceflow.example/api/mortgage` |
| Authentication | `Authorization: Bearer <token>` issued by Microsoft Entra ID for the API's App ID URI (`apiResourceUri`), obtained through SPFx `AadHttpClient`. The API validates the token, maps the user to roles, and enforces permissions on every call |
| Format | JSON in and out, UTF-8, ISO 8601 UTC times, money as numbers in the case currency |
| Errors | HTTP status with a plain-text or JSON message. `400` validation or rule failure (message shown to the user), `401` not signed in, `403` not allowed, `404` not found, `409` state conflict (for example already approved), `422` a business gate is closed |
| Idempotency | `POST` actions that move money or state (`/submit`, `/disbursements`, `/pay`) accept an `Idempotency-Key` header |
| Concurrency | Case responses carry an `etag`; `PATCH` sends `If-Match`. The mock does not enforce this |
| Pagination | Lists accept `?top=&skip=`; the module requests the first page and filters server-side |
| Time | The server owns the clock for SLA, not the browser |
| Rules | Every rule in the UI is enforced again on the server; the client only previews |

## 5.2 Endpoints

### Identity

| Method and path | Purpose | Returns |
|---|---|---|
| `GET /me` | Current user, roles from Entra groups, employee number, ring-fenced case ids | `UserContext` |

### Eligibility (the existing Staff Loan step)

| Method and path | Body | Purpose | Returns |
|---|---|---|---|
| `POST /eligibility/otp` | `{ accountNumber }` | Send an OTP to the staff member's registered phone | `{ sent, maskedPhone }` |
| `POST /eligibility/verify` | `{ accountNumber, code }` | Verify the OTP and load payroll data | `StaffProfile` |
| `POST /cases/{id}/eligibility` | `{ input: EligibilityInput, exceptionalApproval }` | Compute eligibility and store it on the case | `EligibilityResult` |

### Cases (Application Management, Applicant Tracking)

| Method and path | Purpose | Returns |
|---|---|---|
| `GET /cases?product=&states=&mine=&q=` | List the cases the user may see | `MortgageCase[]` |
| `GET /cases/{id}` | One case with tasks, approvals, conditions, disbursements, post items | `MortgageCase` |
| `POST /cases` `{ product }` | Create or resume the draft for a product | `MortgageCase` |
| `PATCH /cases/{id}` | Autosave a draft (partial `DraftPatch`); rejected if the case is locked | `MortgageCase` |
| `POST /cases/{id}/submit` | Validate, assign the reference, lock, start the workflow | `MortgageCase` |
| `POST /cases/{id}/proceed` | Applicant confirms after pre-approval; opens valuation, searches, credit in parallel | `MortgageCase` |
| `POST /cases/{id}/offer/accept` | Applicant signs and accepts the offer | `MortgageCase` |
| `POST /cases/{id}/return` `{ note }` | Return for correction (Mortgage Team) | `MortgageCase` |
| `POST /cases/{id}/withdraw` `{ reason }` | Withdraw | `MortgageCase` |
| `GET /cases/{id}/readiness` | Server-side readiness result | `ReadinessResult` |

### Tasks (Workflow Engine)

| Method and path | Purpose |
|---|---|
| `GET /tasks?role=&caseId=&open=` | Tasks for a team or a case, including pending approvals as tasks |
| `POST /tasks/{id}/complete` `{ outcome? }` | Complete a user task; the engine advances the case when gates are met |

### Approvals (Approval Routing)

| Method and path | Body | Notes |
|---|---|---|
| `POST /cases/{id}/approvals/{level}` | `{ decision, comment }` | `decision` is `APPROVE`, `APPROVE_WITH_CONDITIONS`, `RETURN` or `DECLINE`. A reason is required to return or decline. The server rejects a level that is not active, a user over their limit, or a conflicted approver |

### Documents and document requests

| Method and path | Purpose |
|---|---|
| `GET /cases/{id}/documents` | Document references (library URL, version, classification) |
| `POST /cases/{id}/documents` | Register a file after it was uploaded to SharePoint: `{ docType, category, fileName, sizeKb }` |
| `GET /cases/{id}/document-requests` | Open and fulfilled requests |
| `POST /cases/{id}/document-requests` | Ask the applicant for a document: `{ docType, category, dueDate }` |

The bytes are uploaded by the web part directly to the SharePoint library with the user's identity (`SharePointFileStore`), then registered here.

### Valuation, property, fit-to-lend

| Method and path | Purpose |
|---|---|
| `GET /valuations`, `GET /valuers` | Requests and the valuer panel |
| `POST /valuations` | Request a valuation (Form D) |
| `POST /valuations/{id}/assign` `{ valuerId }` | Assign a panel valuer (capacity checked) |
| `POST /valuations/{id}/report` | Submit `{ marketValue, forcedSaleValue, valuationDate, condition, occupancy }`; FSV must not exceed market value |
| `POST /valuations/{id}/review` `{ outcome, note }` | Accept or return |
| `GET /properties`, `GET /properties/{id}` | Property repository |
| `POST /properties/{id}/searches` | Record `{ type, result, notes }` |
| `GET /cases/{id}/fit-to-lend` | Checklist, decision, certificate |
| `PATCH /cases/{id}/fit-to-lend/checklist/{itemId}` | `{ done }` |
| `POST /cases/{id}/fit-to-lend/decision` | `{ decision, reason }`; a rejection stops the case and cancels open work |
| `POST /cases/{id}/fit-to-lend/issue` | Issue the certificate; `422` with the blocker if a precondition fails |

### Conditions, collaboration

| Method and path | Purpose |
|---|---|
| `GET /conditions` | All conditions the user may see |
| `PATCH /conditions/{id}` | `{ status, note }`; waiving needs a reason and an authorised role |
| `GET /threads?caseId=` | Threads with messages |
| `POST /threads/{id}/messages` | `{ body, kind, dueDate? }` with `kind` `MESSAGE`, `REQUEST` or `NOTE`; a request pauses the case SLA clock |
| `POST /threads/{id}/join` | Mortgage Team oversight |
| `POST /threads/{id}/messages/{messageId}/close` | Close a request; resumes the clock when none are open |

### Disbursement and post-disbursement

| Method and path | Purpose |
|---|---|
| `POST /cases/{id}/disbursements` | `{ payee, amount }`; `422` if the gate is closed or the amount exceeds what remains |
| `POST /disbursements/{id}/approve` | A different user from the requester |
| `POST /disbursements/{id}/pay` | Release funds through core banking; creates and activates the account when the last tranche is paid |
| `GET /post-disbursement` | All items |
| `PATCH /post-disbursement/{id}` | `{ status }`; the case closes when every item is done or waived |

### Audit, notifications, reporting

| Method and path | Purpose |
|---|---|
| `GET /audit?caseId=&q=` | Audit entries the user may see |
| `GET /notifications`, `GET /notifications?since=` | Notifications; `since` is used for polling |
| `POST /notifications/{id}/read` | Mark read |
| `GET /analytics` | KPIs, funnel, stage times, SLA by team, ageing, turnaround |

## 5.3 Real-time

Preferred: a SignalR hub or webhook relay from the Notification Engine that pushes `AppNotification` objects. The module calls `client.subscribe(listener)` and does not care how events arrive. Fallback: the HTTP client polls `GET /notifications?since=` every 15 seconds.

```json
{ "id": "NTF-8841", "at": "2026-10-16T10:21:07Z", "caseId": "CASE-1001",
  "title": "Pre-approved", "body": "You are pre-approved for up to 400,000.",
  "severity": "INFO", "read": false }
```

## 5.4 Core payloads

The TypeScript definitions in `src/app/domain/types.ts` are the schema: `MortgageCase`, `EligibilityInput`, `EligibilityResult`, `ReadinessResult`, `ApprovalStep`, `Task`, `Condition`, `DocRef`, `DocRequest`, `Property`, `LegalSearch`, `ValuationRequest`, `ValuationReport`, `FitToLend`, `Disbursement`, `PostItem`, `Thread`, `Message`, `AuditEntry`, `AppNotification`, `UserContext`. A JSON Schema or OpenAPI document can be generated from them when Advance Flow publishes the endpoints.

## 5.5 Server-side checks the API must perform

| Check | Rule |
|---|---|
| Role and case access | Caller's role allows the action; case is not ring-fenced from the caller |
| Locked cases | `PATCH` on a locked case fails until returned |
| Duplicate application | One active application per employee and product (BR-01) |
| Consent | No bureau call without recorded consent (BR-05) |
| Equity cap | Request at most 70% of forced sale value less existing mortgage (BR-03) |
| Gates | Fit-to-lend and disbursement preconditions (BR-07, BR-10) |
| Four-eyes | Approver differs from requester on disbursement |
| Approver limits | A decision above the approver's limit is refused and routed up |
| SLA | Clocks pause on open applicant requests and resume when they close |

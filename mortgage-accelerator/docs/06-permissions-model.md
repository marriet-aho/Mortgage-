# 6. Permissions Model

Three layers must agree: **Microsoft Entra ID** decides who the user is and which groups they are in; **Advance Flow** decides what the user may do on each case; **SharePoint** decides who may open each file. The web part hides what a user cannot do, but it is never the control: the API and SharePoint enforce.

## 6.1 Identity and roles

| Entra ID security group (suggested) | Module role | Purpose |
|---|---|---|
| `MA-Applicants` (all staff) | `APPLICANT` | Apply and track own cases |
| `MA-MortgageOfficers`, `MA-MortgageLeads` | `MORTGAGE_OFFICER`, `MORTGAGE_LEAD` | Oversight, exceptions, returns |
| `MA-HR` | `HR` | Employment verification, HR approvals |
| `MA-Credit` | `CREDIT` | Assessment and recommendation |
| `MA-Legal` | `LEGAL` | Searches, deeds, legal conditions |
| `MA-Collateral` | `COLLATERAL` | Valuations, property acceptance, fit-to-lend |
| `MA-Valuers` (external, B2B guests) | `VALUER` | Their own assignments only |
| `MA-Approvers` | `APPROVER` | Approval levels L1 to L7 by individual limit |
| `MA-Executives` | `EXECUTIVE` | L8, executive dashboard |
| `MA-CreditAdmin` | `CREDIT_ADMIN` | Conditions, disbursement requests and approval |
| `MA-Operations` | `OPERATIONS` | Release funds, activate accounts |
| `MA-PostDisbursement` | `POST_DISBURSEMENT` | Registration and perfection |
| `MA-Audit` | `AUDITOR` | Read everything, change nothing |
| `MA-Admins` | `ADMIN` | Configuration; no case content by default |

The API reads group claims from the token (or calls Microsoft Graph) and returns the roles in `GET /me`. A user can hold more than one role.

## 6.2 Who can do what

A = allowed, o = own case only, r = read only, – = not allowed. Approver limits apply on top (see [08](08-business-rules.md)).

| Action | Applicant | Mortgage | HR | Credit | Legal | Collateral | Valuer | Approver | Credit Admin | Ops | Post Disb. | Exec | Audit |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Create, edit draft, submit | o | – | – | – | – | – | – | – | – | – | – | – | – |
| View a case | o | A | r | A | r | r | assigned | r | r | r | r | r | r |
| Confirm to proceed, accept offer | o | – | – | – | – | – | – | – | – | – | – | – | – |
| Return for correction, hold | – | A | – | – | – | – | – | – | – | – | – | – | – |
| Verify employment | – | – | A | – | – | – | – | – | – | – | – | – | – |
| Complete credit review and recommendation | – | – | – | A | – | – | – | – | – | – | – | – | – |
| Assign valuer, review report | – | – | – | – | – | A | – | – | – | – | – | – | – |
| Submit valuation report | – | – | – | – | – | A | assigned | – | – | – | – | – | – |
| Record legal search | – | – | – | – | A | A | – | – | – | – | – | – | – |
| Property decision, issue fit-to-lend | – | – | – | – | – | A | – | – | – | – | – | – | – |
| Decide approval | – | – | – | – | – | – | – | within limit | – | – | – | A | – |
| Submit condition evidence | owner | – | – | – | owner | owner | – | – | – | – | – | – | – |
| Verify or reject condition | – | – | – | verifier | verifier | verifier | – | – | verifier | – | – | – | – |
| Waive a condition (reason) | – | Lead only | – | – | – | – | – | A | A | – | – | – | – |
| Request disbursement | – | – | – | – | – | – | – | – | A | – | – | – | – |
| Approve disbursement (not the requester) | – | – | – | – | – | – | – | A | A | – | – | – | – |
| Release funds | – | – | – | – | – | – | – | – | – | A | – | – | – |
| Update post-disbursement items | – | – | – | – | A | – | – | – | – | – | A | – | – |
| Message the applicant | o | A | A | A | A | A | – | – | A | A | – | – | – |
| Internal notes | – | A | A | A | A | A | – | – | A | A | – | – | – |
| Join a thread for oversight | – | A | – | – | – | – | – | – | – | – | – | – | – |
| Open the Mortgage dashboard | – | A | A | A | A | A | – | A | A | A | A | – | A |
| Open the Executive dashboard | – | Lead only | – | – | – | – | – | – | – | – | – | A | A |
| Open Analytics | – | Lead only | – | A | – | – | – | – | – | – | – | A | A |
| Change configuration | – | – | – | – | – | – | – | – | – | – | – | – | – (Admin only) |

The module's `nav.ts` and the `hasRole` checks on actions implement the visible part of this table. The harness test sweeps every route for every role.

## 6.3 Case-level rules

| Rule | Description |
|---|---|
| Ring-fencing | A user cannot see or act on a case where they are the applicant, are in the applicant's reporting line, are on the declared relatives list, or have declared a conflict. `GET /me` returns `conflictCaseIds`; the API enforces it at assignment, view and decision time |
| Segregation | The person who prepared a recommendation cannot approve it; the person who requested a disbursement cannot approve it |
| Stage-based access | Units see a case only from the stage where they have work, and keep read access after |
| Valuers and vendors | See only their own assignment, with the minimum fields |
| Break-glass | A time-limited, approved and logged access path for support |

## 6.4 SharePoint permissions

| Item | Permission |
|---|---|
| Library `Case Documents` | No inheritance at folder level. Site owners and the module's service identity manage; users have no library-wide rights |
| Case folder | Applicant: contribute to their folder. Owner-team groups for the stages reached: read. Compliance and Audit: read. Ring-fenced users: none |
| `Restricted` documents (identity, income) | Sensitivity label blocks download on unmanaged devices; only Credit, HR (income), Legal and Mortgage read |
| `Mortgage Templates` | Mortgage Leads edit, everyone else read; changes go through approval |
| `Valuation Reports` | Collateral and Credit read; valuers write only through the module |

The module sets folder permissions when a case is submitted and again at each stage change, using an Advance Flow service identity rather than the user's rights.

## 6.5 API permissions and consent

| Item | Value |
|---|---|
| Delegated scope | `Mortgage.ReadWrite` on the Advance Flow API app registration in Entra ID |
| SharePoint | `AllSites.Write` is not requested; the web part uses the signed-in user's own SharePoint rights |
| Approval | A tenant admin approves the pending request in SharePoint Admin Centre, API access |
| Conditional access | Require MFA for all staff roles; approvers re-authenticate for each decision (step-up) |
| Guests | Valuers are Entra B2B guests restricted to the `VALUER` role |

## 6.6 Data classification

| Class | Examples | Handling |
|---|---|---|
| Internal | Product rules, templates | All staff |
| Confidential | Application forms, valuation reports, offers | Case team; encrypted at rest |
| Restricted | National ID, payslips, bank statements, bureau reports, account numbers | Named roles only; field-level encryption in the database; masked in lists; every view logged |

## 6.7 Audit of access

The audit trail records who viewed Restricted data, every permission-relevant action, every approval and every waiver. Auditors can read it all; nobody can edit it.

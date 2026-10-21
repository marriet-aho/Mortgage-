# Building the forms inside Advance Flow

Advance Flow stays the master loan origination system. Mortgage is a specialised product inside it. Applicant tracking, notifications, approvals and document requests stay in Advance Flow. The forms are a mortgage-specific module.

## What exists today

`FormsApp` (src/app/App.tsx) is one React component. It needs exactly three things from its host:

| Prop | Meaning |
|---|---|
| `store` | Where drafts, signed forms and uploaded documents go. A `FormStore` (src/app/store.ts). |
| `userName`, `userEmail` | The signed-in staff member, used to pre-fill the forms. |
| `advanceFlowUrl`, `navigate` | Where "Submit and go to Advance Flow" takes the person. Inside Advance Flow this becomes an in-app route. |

Today the host is a SharePoint web part and the store is a SharePoint library. To move the forms into Advance Flow, only the host and the store change. The forms, signatures, fee reminders and document lists are reused as they are.

## What the Advance Flow team has to provide

1. **The front-end stack Advance Flow is built with** (React? Angular? something else) and how a new menu item and page are added under Staff Loan. If Advance Flow is React, `FormsApp` drops in as a component. If it is not, the module is hosted as a micro front-end or an iframe.
2. **An API for the mortgage module**, scoped to a loan number. `src/app/advanceFlowFormStore.ts` is the client for the proposed contract below. Please confirm or replace the paths.

| Purpose | Proposed call |
|---|---|
| Read a saved form (draft) | `GET /mortgage/loans/{loanNumber}/forms/{product}/{form}` |
| Save a form (draft) | `PUT /mortgage/loans/{loanNumber}/forms/{product}/{form}` |
| Submit a signed form | `PUT /mortgage/loans/{loanNumber}/signed/{product}/{file}` |
| Upload a document for a requirement | `POST /mortgage/loans/{loanNumber}/documents` (multipart: file, requirement, product) |
| List documents | `GET /mortgage/loans/{loanNumber}/documents?product=` |
| Remove a document | `DELETE /mortgage/loans/{loanNumber}/documents/{id}` |

3. **Where the loan number comes from.** The forms need the loan the person created in Create Staff Loan. Either Advance Flow passes it to the page, or the person picks it from My Loans.
4. **Sign-in.** Unified Access Management signs in through Microsoft, so inside Advance Flow no separate sign-in is needed. Calls use Advance Flow's existing session.
5. **Which Advance Flow parts the documents feed.** Uploaded documents should appear in the loan's existing document list, so approvers and document requests keep working from Advance Flow.

## What the forms module will not do

It does not track applicants, send notifications, route approvals or request documents. Those remain Advance Flow features. The module only collects the signed forms, the supporting documents and the fee acknowledgement, and hands them to the loan.

## Fees

The fee reminders and acknowledgement come from the bank's requirements sheets (src/app/fees.ts): search Ghs 4,000, valuation Ghs 3,500 to 10,000, registration 1.85% of property value, life insurance and home protection quoted by the insurer. If Advance Flow later collects or records the fees, only `fees.ts` needs to read them from there.

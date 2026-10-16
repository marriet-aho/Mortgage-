# 0. What Advance Flow Already Has, and What This Module Must Not Duplicate

Everything below is captured **exactly as it appears** in the screenshots of the live Advance Flow (Fidelity Bank LOS). Labels, spelling and order are kept as shown, including "AQUISITION", because the module must match them.

## 0.1 Screens captured

### Unified Access Management (the app launcher)

| Item | Exact content |
|---|---|
| Title | Unified Access Management |
| Menu | **Home**, **My Apps** |
| Search | "Search app by name" |
| App tile | **Advance Flow**, "Fidelity Bank LOS", badge **Active** |

Advance Flow is opened from this launcher. **Confirmed:** Unified Access Management signs in through Microsoft, so the module's Entra ID sign-in matches. The Advance Flow API must still accept the module's Entra ID token (to confirm with the Advance Flow team).

### Advance Flow: left menu

| Item | Sub-items |
|---|---|
| Dashboard | |
| Staff Loan | **Create Staff Loan**, **My Loans**, **Loan Calculator**, **Collateral Release**, **Staff Saving Scheme** |

### Dashboard

| Item | Exact content |
|---|---|
| Heading | Dashboard, then **Requester Overview** |
| Buttons | **New Application**, **View All Staff Loans** |
| Cards | **Active Applications**, **Approved**, **Rejections**, **Disbursed Value** |
| Panels | **My Applications** (columns: Loan Number, Product, Amount, Status, Submitted), **Product Type Distribution** |

### Create Staff Loan (three phases: 1 Loan Eligibility, 2 Loan Application, 3 Finish)

Page title "Create Staff Loan", sub-title "Staff Loan Application". **Step 1 was captured. You have confirmed that Step 2 (Loan Application) is where all the pre-approval documents are attached. Its screenshots are still wanted for the exact fields. Step 3 (Finish) is not yet seen.**

**Step 1: Loan Eligibility, left side**

| Field (exact label) | Notes shown on screen |
|---|---|
| * Account Number | Placeholder "Enter 13-digit account number" |
| * Loan Type | Dropdown, shows "MORTGAGE - NEW AQUISITION" |
| Link: Read Loan Product Requirements (PDF) | |
| Date of Birth | Placeholder "Select date of birth"; greyed |
| * Net Salary | Greyed, 0 |
| * Allowances(Rent + Clothing) | Greyed, 0 |
| * Loan Amount Requested | 0 |
| Monthly Instal. (Personal+Auto+Education) | 0 |
| Monthly Instal.(Mortgage+HP only) | 0 |
| Checkbox: Do you want to pay off existing loans? | |
| Buttons | **Compute Eligibility**, **Reset** |
| Help text | "Enter account number (13 digits) to receive OTP" |

**Step 1: Computation Results, right side**

| Row (exact label) | Format |
|---|---|
| Interest Rate (p.a.) | 0.00% |
| DIR Limit | 0.00% |
| Tenor (Months) | - |
| Periodic Instalment | ₵ 0.00 |
| DIR (Capital + Personal) | 0.00% |
| DIR (All Staff Loans) | 0.00% |
| Loan Amount Qualified For | ₵ 0.00 |
| Decision Rule | status tag, "-" before computing |

Below the table: checkbox **Exceptional Approval**, button **Next Step** (disabled until eligibility is computed).

### My Loans

| Item | Exact content |
|---|---|
| Breadcrumb | Staff Loan / My Loans |
| Filters | **Name** ("Search by name"), **Product** ("Select product"), **Status** ("Select status"), buttons **Search**, **Reset** |
| Table columns | **Loan**, **Product**, **Amount Requested**, **Department**, **Branch**, **Designation**, **Status**, **Date**, **Action** |
| Tools | Refresh, density, column settings. Empty state "No data" |

### Collateral Release

| Item | Exact content |
|---|---|
| Filters | **Loan Number** ("Search by loan number"), **Product**, **Status**, buttons **Search**, **Reset** |
| Panel | Collateral Release, button **+ New Request**, refresh, density, settings |
| Table columns | **Loan Number**, **Account Number**, **Product**, **Amount**, **Status**, **Date**, **Action** |

### Look and feel

Dark navy header with the Advance Flow logo and the signed-in user (here "maho") and a dark-mode toggle; white left menu; white cards on a light grey page; **red** primary buttons. The module uses orange as its primary colour, as you asked, so it will read as a separate, clearly labelled panel rather than pretending to be Advance Flow.

## 0.2 Duplication audit

Rule: if Advance Flow already does it, the module reads from it or links to it and does not build it again.

| Module page or feature | In Advance Flow already? | Decision |
|---|---|---|
| Applicant **Home** (requester overview, KPI cards, My Applications, New Application) | **Yes**: Dashboard | **Removed.** Applicants use the Advance Flow Dashboard. They land in the module only to reach their mortgage details |
| Applicant **My applications** list | **Yes**: My Loans | **Removed from the applicant menu.** My Loans links into the case using its loan number |
| **Loan Eligibility** phase (account number, OTP, compute, DIR, Decision Rule, Exceptional Approval) | **Yes**: Create Staff Loan Step 1 | **Removed.** The module shows Advance Flow's eligibility result read-only, with the same labels |
| **Readiness check** (what-if figures) | **Partly**: Loan Calculator and eligibility | **Page removed.** The readiness *engine* stays, but it takes the DIR and Decision Rule from Advance Flow and adds only the mortgage checks (down payment and loan-to-value, 70% of forced sale value, tenor, documents, consent, bureau, HR) |
| **Application wizard** (applicant, finances, request) | **Yes** in Create Staff Loan Steps 1 and 2 (Step 2 not yet seen) | **Reduced to "Mortgage details"**: only the property, vendor, valuation request, equity release details, consent and documents that Advance Flow does not ask for. Needs Step 2 to confirm |
| **Collateral Release** | **Yes** | Not rebuilt. Linked at the end of a mortgage's life |
| Loan **Calculator** | **Yes** | Not rebuilt |
| Loan **number** | **Yes** (Advance Flow issues it) | The module no longer invents its own reference. It uses the Advance Flow loan number |
| Product pages (Home Purchase, Home Equity Release) | Partly: the product requirements PDF | **Staff-only** rules and pipeline view; applicants are not shown a second copy of the product information |
| Case list for staff | Not seen (only the requester's My Loans) | **Kept**, as "Mortgage cases", using My Loans' exact column names plus the mortgage columns. Question below |
| Approval decisions and tasks | **Unknown**: the brief lists Approval Routing as an existing capability, but no approver screen was captured | **Kept for now**, as the mortgage view of approvals. If Advance Flow has an approver inbox, the module should show status and link there |
| Valuation, Property repository, Fit-to-lend, Conditions, Collaboration hub, Disbursement control, Post-disbursement, Mortgage dashboard, Executive dashboard, Analytics | **Not seen** | **New.** These are what the module exists for |
| Audit trail | Advance Flow has one (listed as an existing capability) | A mortgage-filtered **view** of it, not a second log |

## 0.3 What the module now adds

1. **Mortgage details** for a loan that already exists in Advance Flow: property and vendor information, valuation request, equity release details, consent and documents.
2. **Collateral and legal**: valuation, property repository, searches, fit-to-lend.
3. **Conditions** and the **disbursement gate**.
4. **Collaboration** between the applicant and each unit.
5. **Post-disbursement** tracking of registration, perfection and custody.
6. **Mortgage-specific dashboards and analytics.**

## 0.4 What I still need from you

| # | Needed | Why |
|---|---|---|
| 1 | Screenshots of **Create Staff Loan Step 2 (Loan Application)** and **Step 3 (Finish)**, for the mortgage loan type, scrolled to show every field | You asked me to capture the exact information on the application forms. Only Step 1 has been seen, and the mortgage details must not ask again for anything Step 2 already collects |
| 2 | A screenshot of an **opened loan** from My Loans (the Action button) | To see what the applicant sees for a loan after submission |
| 3 | Any **approver or task screen** (inbox, approve, return), and the staff-side list of all loans | To avoid rebuilding approval decisions and the staff list |
| 5 | **Loan Calculator** and **Staff Saving Scheme**, only if they touch mortgages | To be sure of no overlap |

## 0.5 Decisions after your answers

| Your answer | What changed |
|---|---|
| "Create Staff Loan Step 2 is where all the pre-approvals are done" | The module **no longer collects the pre-approval documents**. Its step 7 lists the bank's exact requirements and tracks them: the applicant confirms they were attached in Advance Flow, Create Staff Loan, Step 2. The module keeps only what Advance Flow does not take: the signed Application Form and Consent Letter (filed automatically when e-signed), and the Land Title Certificate and Personalized site plan that go to the Mortgage Unit for the search report. Eligibility is no longer recomputed: the applicant links their Advance Flow loan number and the module shows the result read-only |
| "Use the sample in the zip folder for the application form" | The form follows the bank's blank form and the completed Home Purchase and Equity Release samples, label for label. Financial Information is not asked again: Advance Flow holds salary and deductions. The Employer's Certification of Income is not in the staff requirements list and is not asked |
| "Unified Access Management signs in through Microsoft" | Module sign-in stays Microsoft Entra ID |
| "Esignature should be there for them to sign" | Application form (Borrower and Co-Borrower), reference form, consent letter and valuation form are signed on screen, drawn or typed, with name, date and time saved |

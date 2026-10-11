# 7. Digital Forms Catalogue

Ten smart forms. Field type codes: T text, N number, M money, D date, S select, R radio, B boolean, F file, X textarea, C computed (read-only), E e-signature.
"Source" says where a pre-filled value comes from. **Req** = mandatory (Y), conditional (C) or optional (N).

The Mortgage Application Entry Module already built in this repository (`index.html`) implements the staff-facing front half of Forms A, B, E, F and G. It is the starting point for Phase 1, and its field names carry across.

## Form map

| Form | Name | Home Purchase | Equity Release | Completed by | Next step |
|---|---|---|---|---|---|
| A | Mortgage Loan Application | Yes | Yes | Applicant | Pre-approval |
| B | Mortgage Request Details | Yes | Replaced by H for equity release | Applicant | Pre-approval |
| C | Customer Consent | Yes | Yes | Applicant, co-borrower | Unlocks bureau and verification |
| D | Asset Valuation Request | Yes | Yes | Applicant | Collateral, then Valuer |
| E | Property Information | Yes | Yes | Applicant, Vendor | Collateral, Legal |
| F | Financial and Affordability | Yes | Yes | Applicant | Affordability engine |
| G | Assets and Liabilities | Yes | Yes | Applicant | Credit |
| H | Equity Release Application | No | Yes | Applicant | Pre-approval, Collateral |
| I | Equity Release Request Letter | No | Yes | Applicant | Credit |
| J | Vendor Due Diligence | If private vendor | No | Vendor or applicant | Legal, Credit |

## Form A: Mortgage Loan Application

| Field | Type | Req | Source | Validation |
|---|---|---|---|---|
| Employee number | T | Y | HR system | Must exist and be active |
| Staff ID | T | Y | HR system | Matches employee number |
| Full name | C | Y | HR system | Read-only |
| Department | S | Y | HR system | Reference list |
| Branch | S | Y | HR system | Reference list |
| Position | T | Y | HR system | |
| Employment status | S | Y | HR system | Permanent, contract, probation; contract and probation raise a flag |
| Date employed | D | Y | HR system | Not in the future |
| Retirement date | C | Y | HR system | DOB plus bank retirement age; used for tenor cap |
| Date of birth | D | Y | HR system | Age 18 or over |
| National ID | T | Y | Applicant, then verified | Ghana Card format `GHA-123456789-0`; checksum and identity verification service |
| Phone number | T | Y | Applicant | 9 to 15 digits; OTP verified |
| Email | T | Y | Applicant | Valid format; link verified |
| Residential address | X | Y | Applicant | Digital address suggested and validated |
| Marital status | S | Y | Applicant | Single, married, divorced, widowed; married raises spousal consent condition |
| Co-borrower? | R | Y | Applicant | If yes, invite sent (see FR-09) |

Form-level rules: **staff verification** against HR (blocks if inactive); **duplicate check** on employee number and product (blocks) and on National ID (flags).

## Form B: Mortgage Request Details (Home Purchase)

| Field | Type | Req | Validation |
|---|---|---|---|
| Mortgage purpose | S | Y | Purchase of completed, purchase off-plan or under construction |
| Mortgage type | S | Y | Home Purchase (fixed here) |
| Property type | S | Y | Detached, semi-detached, townhouse, apartment, land and construction |
| Property location | T | Y | Region and area; digital address if known |
| Property value | M | Y | More than zero |
| Purchase price | M | Y | Not above property value by more than a configured tolerance |
| Requested amount | M | Y | At most price minus down payment |
| Down payment | M | Y | At least 20% of price |
| Mortgage tenor | N | Y | 1 to 30 years, and not past retirement date |
| Vendor type | R | Y | Developer or private vendor; private opens Form J |
| LTV | C | | Loan ÷ lower of price and value |
| Affordability | C | | From Form F |
| Eligible amount | C | | See [04 section 8.3](04-products-and-journeys.md) |

## Form C: Customer Consent

| Consent | Text version held | Required for |
|---|---|---|
| Credit bureau consent | Yes | Bureau check |
| Identity verification consent | Yes | National ID verification |
| Data processing consent | Yes | Processing and storage |
| Regulatory consent | Yes | Regulatory reporting and checks |
| Information sharing consent | Yes | Sharing with valuers, legal counsel, insurers, Lands Commission |

Capture for each: accepted yes or no, signer, signature (typed name plus OTP, or drawn), co-borrower signature in a separate step, timestamp, device and IP, text version hash. Consent can be withdrawn by the applicant, which stops any step that depends on it and raises a task for the Mortgage Team. Forms cannot be submitted without the first four; the fifth blocks only the steps that share data.

## Form D: Asset Valuation Request

| Field | Type | Req | Notes |
|---|---|---|---|
| Property address | X | Y | |
| Digital address | T | N | Validated against the address service when given |
| Property type | S | Y | |
| Property description | X | Y | |
| Contact person | T | Y | Person who gives the valuer access |
| Contact number | T | Y | |
| Property owner | T | Y | Must match title or sale documents |

Flow: Applicant → Collateral Team (checks, chooses valuer) → Valuer (visits, reports) → Valuation Report (stored as structured data and PDF). See [08](08-valuation-collateral-disbursement.md).

## Form E: Property Information

| Field | Type | Req | Notes |
|---|---|---|---|
| Property type | S | Y | |
| Title number | T | Y | Used in duplicate and search checks |
| Registration number | T | C | If registered |
| Site plan reference | T | Y | |
| Construction status | S | Y | Completed, under construction, off-plan |
| Ownership type | S | Y | Freehold or leasehold; lease term if leasehold |
| Developer information | X | C | If developer |
| Vendor information | X | C | Vendor name, contact, email, phone |

## Form F: Financial and Affordability

| Field | Type | Req | Notes |
|---|---|---|---|
| Basic salary | M | Y | Checked against HR record, difference flagged |
| Allowances | M | N | |
| Other income | M | N | With description and evidence |
| Existing loans | table | C | Lender, balance, monthly repayment, expiry |
| Monthly obligations | M | Y | Rent or current mortgage, maintenance, other commitments |
| Gross income | C | | |
| Net income | C | | |
| Disposable income | C | | |
| Debt service ratio | C | | |
| Debt to income ratio | C | | |
| Affordability score | C | | See [04 section 8.3](04-products-and-journeys.md) |

## Form G: Assets and Liabilities

| Section | Entries |
|---|---|
| Assets | Savings, investments, vehicles, real estate; each with description and value |
| Liabilities | Existing mortgages, salary loans, car loans, personal loans; each with lender, balance and monthly payment |
| Calculated | Net worth, exposure ratio |

Existing loans in Form F and liabilities here are reconciled: a liability not present in Form F is flagged for the Credit Team, and bureau results are compared to both.

## Form H: Equity Release Application

| Field | Type | Req | Validation |
|---|---|---|---|
| Property address | X | Y | |
| Property value (declared) | M | Y | Treated as indicative until valuation |
| Forced sale value | M | C | Filled from the valuation report; applicant may enter an estimate that is marked indicative |
| Requested amount | M | Y | At most 70% of FSV less existing mortgage balance |
| Purpose of release | S | Y | Home improvement, home renovation, medical expenses, family emergency, tuition payments |
| Existing mortgage status | S | Y | None, with this bank, with another lender; balance and lender if any |
| Ownership status | S | Y | Sole owner, joint owner (co-owner consent required) |

**70% FSV rule:** `maximum release = 0.70 × FSV − existing mortgage balance`. Before valuation, the form warns. After valuation, it blocks a request above the cap and offers the applicant a one-click reduction to the maximum.

## Form I: Equity Release Request Letter

| Field | Type | Req |
|---|---|---|
| Reason for request | X | Y |
| Justification | X | Y |
| Intended use of funds, with amounts by use | table | Y |
| Supporting evidence | F (multiple) | Y, by purpose |
| Declaration and signature | E | Y |

The use of funds table must add up to the requested amount and each line must match the purpose in Form H.

## Form J: Vendor Due Diligence

Shown when vendor type is private. Completed by the vendor through a secure link, or by the applicant if the vendor cannot.

| Field | Type | Req | Validation |
|---|---|---|---|
| Vendor name | T | Y | Matches title or sale agreement |
| Ghana Card details | T, F | Y | Identity verification service |
| Company details | T | C | If the vendor is a company |
| Business registration details | T, F | C | Registrar of Companies number |
| Contact information | T | Y | Phone and email verified |
| Authority to sell | F | Y | Document |
| Bank details for payment | T | Y | Account name must match vendor |

Outcome: Legal and Credit mark the vendor Cleared, Cleared with conditions or Not cleared. Not cleared blocks disbursement to that vendor.

## Common behaviour for all forms

- Autosave every few seconds; resume on any device.
- Conditional sections show only what applies.
- Calculations update live; the saved value is recomputed on the server at submission.
- Each form has a version; a case keeps the version it was filled on.
- After submission fields are locked; Mortgage Team or a reviewing unit can return specific fields for correction.
- Every save, view of sensitive data, signature and return is audited.
- Scanned paper forms from before go-live are attached as documents and keyed by Mortgage Team once, with OCR assistance.

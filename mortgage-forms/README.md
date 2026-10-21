# Staff Mortgage Forms (Advance Flow add-on)

A small SharePoint web part that digitizes the bank's staff mortgage forms with electronic signature. It does **not** repeat anything Advance Flow already does (eligibility, loan creation, pre-approval document upload, approvals).

## What is in it

| Form | Home Purchase | Home Equity Release | Source |
|---|---|---|---|
| Mortgage Application Form (with Personal Reference Form and Declaration) | Yes | Yes | `FB_Mortgage_Loan_Application_Form` and the completed samples |
| Customer Consent Letter (Consent for Credit Bureau Search) | Yes | Yes | `CUSTOMER CONSENT LETTER` |
| Customer Asset Valuation Form | Yes | Yes | `CUSTOMER_ASSET VALUATION FORM` |
| Request Letter for Equity Release Mortgage Facility | | Yes | **No template was supplied.** Wording follows the Staff Equity Release policy; replace it when the bank sends its own |

Also shown on each product page, word for word: the staff policy, steps to follow, pre-approval and post-approval requirements, and fees expected.

Every question uses the label printed on the paper form. Each form is signed on screen (draw with a mouse, finger or pen, or type your name; name, date and time are saved). Then **Submit and go to Advance Flow**: the signed forms are saved to the SharePoint library and the person is taken to Advance Flow (Create Staff Loan) to finish the loan there. **Print / Save as PDF** is still available on every form.

**The application form keeps only what the bank's completed samples filled in.** Blank and struck-through parts of the samples are not asked.

| | Home Purchase sample | Equity Release sample |
|---|---|---|
| Form version | Older (4 mortgage types, no pension question) | Newer (pension-backed question, residential status) |
| Co-Borrower | None | Yes (optional tick) |
| Asked | Currency, personal information, employment (employer, occupation, length), 5 references with signature, bank details, existing mortgages (3 questions), property details with purchase price and down payment, declaration | Pension-backed question, residential status, personal information with Tel. No. (Res.) and prefix, relationship, employment with address and Social Security No, 5 references with signatures, previous employment, bank details, financial information (basic salary, sub total, tax, net salary), assets, property details (no price), declaration |
| Not asked (blank or struck through) | Middle name, Tel. No. (Res.), previous address, prefix, Social Security No, employer address, self employment, previous employment, financial information, assets and liabilities, life insurance, power of attorney, employer certification of income | Middle name, previous address, self employment, liabilities, life insurance, power of attorney, purchase price, down payment |

The printed copy also leaves out any answer that is empty.

## Supporting documents and fees

- **Documents:** each item on the bank's pre-approval list has its own upload (PDF, JPG or PNG, up to 10 MB). Spouse and private-vendor items appear when the person says they apply. Post-approval items (deed of indenture, insurance policies, registration receipt and so on) and "Other documents" can be uploaded too. Submit stays disabled until every required pre-approval document is in.
- **Fees:** a fee reminder sits at the top of the pack, the documents page and each form, and the reminder at each step names the fee that applies (search Ghs 4,000, valuation Ghs 3,500 to 10,000, registration 1.85% of property value, insurance premiums). Before submitting, the person must acknowledge the full fee table.
- **Files go to:** `Mortgage Forms/<person>/<product>/documents/<requirement>__<file name>`.

## Where it fits in Advance Flow

```
Advance Flow (Fidelity Bank LOS)
 Staff Loan
  ├─ Create Staff Loan  Step 1 Loan Eligibility
  │                     Step 2 Loan Application  <-- attach the PDFs from this web part with the other pre-approval documents
  │                     Step 3 Finish
  ├─ My Loans
  ├─ Loan Calculator
  ├─ Collateral Release
  ├─ Staff Saving Scheme
  └─ Mortgage Forms     <-- NEW menu item opening the SharePoint page that hosts this web part
```

Staff journey:

1. Open **Mortgage Forms** (from Advance Flow or the SharePoint page), choose Home Purchase or Home Equity Release.
2. Complete and sign each form. Drafts save as they type.
3. Save each form as a PDF. Send the **valuation form** to the Collateral Maintenance Unit. Mail the Land Title Certificate and Personalized site plan to the Mortgage Unit.
4. In Advance Flow, **Create Staff Loan, Step 2**, attach the PDFs together with the rest of the pre-approval documents.

To build it inside Advance Flow rather than SharePoint, see [docs/advance-flow-integration.md](docs/advance-flow-integration.md): the forms module needs only a host page and an Advance Flow API for forms and documents.

Two ways to place it, from simplest:

| Option | How | Needs from Advance Flow |
|---|---|---|
| A. Link (recommended first) | Add a "Mortgage Forms" link under Staff Loan, and a link in the Step 2 help text, pointing to the SharePoint page | A menu or text change by the Advance Flow team |
| B. Embedded | Show the SharePoint page inside Advance Flow in a frame | The SharePoint tenant must allow framing from the Advance Flow address, and sign-in through Microsoft must work in the frame |

Unified Access Management signs in through Microsoft, so the same Microsoft account works in SharePoint. No Advance Flow API is called in this version. There is nothing to configure on the Advance Flow side for option A.

## Install

1. SharePoint admin: upload `sharepoint/solution/mortgage-forms.sppkg` to the tenant **App Catalog** (Apps for SharePoint) and choose **Deploy**. The package does not request any API permission.
2. Create a **document library** called `Mortgage Forms` on the SharePoint site. Give staff **Contribute** on the library. Break inheritance on the library if every person should see only their own folder (the web part makes one folder per person).
3. On the site, create a page, add the **Mortgage Forms** web part (group "Advance Flow"). Optionally set the library name and the Advance Flow address in the web part properties.
4. In the web part properties, set **Advance Flow address** to the Create Staff Loan page. This is where **Submit and go to Advance Flow** takes people.
5. Ask the Advance Flow team to add the menu link (option A).

## Build

Needs Node 18.17 or later (not 20 or 22) and the SPFx 1.18.2 toolchain.

```
npm install
npm run package          # gulp bundle --ship, gulp package-solution --ship
npm run harness          # local preview: dist/index.html, no SharePoint needed
```

## Where files go

`Mortgage Forms/<person>/<HOME_PURCHASE|EQUITY_RELEASE>/application.json` (draft data, per form) and the finished, printable `mortgage-application-form.html` etc. SharePoint downloads `.html` files instead of showing them, so open the downloaded file and choose Print, Save as PDF. The **Print / Save as PDF** button inside the web part gives the same result directly.

## Verified

- TypeScript compiles cleanly; real SPFx 1.18.2 production bundle and `.sppkg` built.
- Browser run for both products: every form filled, signed (drawn and typed), previewed, saved; no console errors.
- Not done: install in a real tenant, and saving to a real SharePoint library (needs your tenant).

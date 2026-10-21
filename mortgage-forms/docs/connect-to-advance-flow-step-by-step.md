# Connecting the Mortgage Forms to Advance Flow: step by step

The forms already work on their own. This guide is what to do **before** Advance Flow gives you an API, so that when it does, switching on direct submit takes days, not weeks.

## Stage 1: Run it for real, with a manual hand-off (no Advance Flow help needed)

1. Upload `mortgage-forms.sppkg` to the SharePoint **App Catalog** and deploy it.
2. On a test SharePoint site create a document library named `Mortgage Forms`. Turn on versioning. Give pilot staff **Contribute**; break inheritance so each person sees only their own folder.
3. Create a page, add the **Mortgage Forms** web part, and set **Advance Flow address** to the Create Staff Loan page.
4. Pilot with 3 to 5 staff on one real Home Purchase and one Equity Release. Watch for questions that confuse people, forms that block them, and documents they cannot find.
5. Agree the **interim hand-off** with the Mortgage Unit: staff submit; the Mortgage Unit opens the person's folder and attaches the files to the loan in Advance Flow Step 2 until the integration exists.
6. Note how long each step takes. This becomes the case for the integration.

## Stage 2: Find out what Advance Flow can accept

7. **Find the owner.** Ask: who built and who runs Advance Flow (a vendor, an internal team, IT integration)? You need that person, not a general contact.
8. **Send them `advance-flow-integration.md`** and ask the questions below. Ask for an API reference (Swagger / OpenAPI) if there is one.
9. **Ask for a test environment** with a test loan. Never test uploads on real loans.
10. Choose the route with them:

| If Advance Flow has... | Use |
|---|---|
| A REST API to attach a document to a loan | **A. Direct submit** (best) |
| No API, but a database or import folder, and Power Automate is available | **B. Power Automate** |
| No API, but can read SharePoint | **C. Advance Flow pulls from the library** |
| The team can host new pages | **D. Build it inside Advance Flow** |

### Questions for the Advance Flow team

1. How is a document attached to a loan today (Create Staff Loan, Step 2)? Is there an API behind it?
2. What is the address, method, fields and file limits of that call?
3. How do we authenticate? Does Advance Flow accept Microsoft Entra ID tokens, and which application ID / resource should we request?
4. How does the page learn the loan number? Can Advance Flow open our page with the loan number, or should the person pick it?
5. Can we save a form draft against a loan (or must drafts stay in SharePoint)?
6. Will uploaded documents appear in the loan's document list, so approvers and document requests keep working?
7. What is the front-end stack, and how does a new menu item or page get added under Staff Loan?
8. Is there a test environment, and who approves a change to Staff Loan menus?

## Stage 3: Prepare on your side while you wait

11. **Security and compliance.** The forms hold Ghana Card numbers, addresses and signatures. Ask InfoSec and the data protection officer to approve: who can read the library, the retention period, and what happens when a person leaves.
12. **Entra ID app registration** (only for option A). The Advance Flow API owner registers the API and exposes a permission, for example `Mortgage.ReadWrite`. Then, in `package-solution.json`, we add that permission, and a SharePoint admin approves it in the SharePoint admin center under **Advanced, API access**.
13. **Approve the interim fee text and the Equity Release request letter** with Retail Banking, since the bank did not supply the letter template.
14. **Decide the loan number rule.** Forms are saved per person and product today. Once connected, they are saved per loan number.

## Stage 4: Switch it on

15. Hand the developer the API reference. The change is limited to one file, `advanceFlowFormStore.ts`, plus one line that chooses it instead of the SharePoint store.
16. Test in the test environment: draft save, form submit, each document upload, remove, and a rejected file.
17. Run a short second pilot, then roll out.
18. Remove the interim hand-off. Decide whether to keep the SharePoint library as a backup or retire it.

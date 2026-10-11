# 22. Wireframes

Low-fidelity layouts for the key screens. Visual language follows the Staff Mortgage LOS prototype and the Entry Module in this repository: charcoal side rail, white work surface, orange only for what needs action.

Legend: `[ ]` input, `( )` choice, `[Button]`, `▓▓░░` progress, `!` needs attention.

## W1. Applicant portal: home

```
+--------------------------------------------------------------------------------+
| Advance Flow · Mortgage                                   Ama Owusu ▾   Sign out |
+---------------+----------------------------------------------------------------+
| Home          |  Your mortgage                                                  |
| Apply         |  +----------------------------------------------------------+   |
| My cases      |  | MTG-2026-001001   Home Purchase        Status: In Assessment |  |
| Messages  (2) |  | ▓▓▓▓▓▓▓░░░░░  Step 5 of 11                                |  |
| Documents     |  | Next: Credit recommendation · Expected 12 Oct              |  |
| Profile       |  +----------------------------------------------------------+   |
|               |  Needs you                                                       |
|               |  ! Credit Team asked: "Confirm other income"   Due 14 Oct [Reply]|
|               |  ! Upload: Insurance certificate                   [Upload]      |
|               |  Start something new                                             |
|               |  [ Home Purchase Mortgage ]   [ Home Equity Release ]            |
+---------------+----------------------------------------------------------------+
```

## W2. Smart form with calculator (Form B, Home Purchase)

```
+--------------------------------------------------------------------------------+
| Home Purchase application                          Saved 10:42    [Save draft]  |
| ▓▓▓▓▓▓░░░░░░  62%                                                              |
| [A Personal ✓] [B Request ●] [C Consent] [E Property] [F Financial] [G Assets]  |
+--------------------------------------------------------------------------------+
| B. Mortgage request                                                             |
|  Purpose            [ Purchase of completed house          ▾]                    |
|  Property type      [ Detached house ▾]    Location [ Oyarifa, Accra       ]    |
|  Purchase price     [ 780,000 ]            Down payment [ 160,000 ]  ! 20.5%    |
|  Requested amount   [ 620,000 ]            Tenor (years) [ 20 ]                  |
|  Vendor type        (•) Developer   ( ) Private vendor                           |
|  +---------------------+----------------------+---------------------------+      |
|  | LTV 79.5%           | Est. repayment       | Eligible amount           |      |
|  | within 80%          | GHS 9,430 / month    | GHS 620,000               |      |
|  +---------------------+----------------------+---------------------------+      |
|  [Back]                                                       [Save and continue]|
+--------------------------------------------------------------------------------+
```

## W3. Consent (Form C)

```
+--------------------------------------------------------------------------------+
| Consent                                                                         |
|  [x] Credit bureau        View text v3                                          |
|  [x] Identity verification View text v2                                         |
|  [x] Data processing       View text v4                                         |
|  [x] Regulatory            View text v2                                         |
|  [x] Information sharing   View text v2                                         |
|  Sign: Type your full name [ Ama Serwaa Owusu ]  Code sent to 024 555 0142 [ ]  |
|  Co-borrower: (•) Not applicable  ( ) Send signing link                         |
|  [Sign and continue]                                                            |
+--------------------------------------------------------------------------------+
```

## W4. Pre-approval result

```
+--------------------------------------------------------------------------------+
|  Pre-approved                                                                   |
|  You can borrow up to GHS 620,000 over 20 years. Valid until 8 Jan 2027.        |
|  Checks:  Employment ✓  Identity ✓  Credit check ✓  Affordability ✓             |
|  Next steps: confirm, pay valuation fee, we start valuation and searches.       |
|  [Confirm and proceed]   [Change amount]   [Download letter]                     |
+--------------------------------------------------------------------------------+
```

## W5. Staff case workspace

```
+--------------------------------------------------------------------------------+
| MTG-2026-001001 · Ama Owusu · Home Purchase · GHS 620,000   State: In Assessment|
| Owner: K. Mensah   SLA: 2d 4h left   ! 1 task overdue                           |
+--------------------------------------------------------------------------------+
| Summary | Forms | Documents | Credit | Property | Approvals | Conditions | Chat | Audit |
+--------------------------------------------------------------------------------+
| Tasks                                   | Key facts                              |
|  Valuation report  Collateral  due 12 Oct| Net income     GHS 11,000             |
|  Land search       Legal       due 13 Oct| DSR            38%   LTV 79.5%        |
|  ! Credit review   Credit      overdue   | Eligibility    82 (Pre-approved)      |
|                                          | Property       Cedar Court, Oyarifa   |
| Timeline                                 | Vendor         Cedar Court Ltd cleared|
|  10 Oct 09:00 Pre-approved               |                                        |
|  10 Oct 09:05 Applicant confirmed        | Conflict check: clear                  |
+--------------------------------------------------------------------------------+
| [Reassign]  [Extend SLA]  [Escalate]  [Put on hold]                              |
+--------------------------------------------------------------------------------+
```

## W6. Communication centre

```
+--------------------------------------------------------------------------------+
| Messages · MTG-2026-001001                                                      |
| Threads: [Credit (1)] [Legal] [Collateral] [HR] [Operations] [General] [Internal]|
+--------------------------------------------------------------------------------+
| Credit Team · Kwame A.                                10 Oct 10:14              |
|  Request: Please confirm the source of the 3,200 other income.   Due 14 Oct     |
| Ama Owusu                                             10 Oct 11:02              |
|  Rental income from Madina. Lease attached.            [lease.pdf]              |
| System: Request closed. Case SLA resumed.                                       |
| Mortgage Team joined (oversight)                                                |
+--------------------------------------------------------------------------------+
| [ Write a message...                                 ] [Attach] [Make a request] [Send]|
+--------------------------------------------------------------------------------+
```

## W7. Valuation request and review (Collateral)

```
+--------------------------------------------------------------------------------+
| Valuation · MTG-2026-001001                       Status: Report received       |
|  Address: House 7, Cedar Court, Oyarifa   Digital address: GA-123-4567           |
|  Contact: Kojo Mensah 030 255 0190         Owner: Cedar Court Ltd               |
|  Valuer: Prime Valuers (assigned 8 Oct)    Due 15 Oct                           |
|  Market value [ 790,000 ]   Forced sale value [ 620,000 ]   Date [ 9 Oct ]       |
|  Report: [view PDF]          Price vs value: -1.3%   FSV ratio 78%  ✓ in range   |
|  Decision: (•) Accept ( ) Accept with conditions ( ) Reject   Reason [        ]  |
|  [Return to valuer]                                           [Record decision] |
+--------------------------------------------------------------------------------+
```

## W8. Equity release application (Form H)

```
+--------------------------------------------------------------------------------+
| Equity release                                                                  |
|  Property [ House 12, Madina ]    Declared value [ 900,000 ]                    |
|  Forced sale value [ 700,000 ]  (from valuation)                                |
|  Existing mortgage: ( ) None (•) This bank ( ) Other   Balance [ 150,000 ]      |
|  Purpose [ Home renovation ▾ ]        Requested [ 300,000 ]                     |
|  ! Maximum release = 70% × 700,000 − 150,000 = 340,000        within limit ✓    |
|  Use of funds: Roofing 180,000 · Kitchen 120,000                 Total 300,000  |
|  [Back]                                                      [Save and continue]|
+--------------------------------------------------------------------------------+
```

## W9. Approver inbox and decision

```
+--------------------------------------------------------------------------------+
| My approvals (3)                                                                |
|  MTG-...1001  Ama Owusu   GHS 620,000   L7 Head Credit   due 11 Oct             |
|--------------------------------------------------------------------------------|
| MTG-2026-001001 · Level 7                                                       |
|  Summary | Credit memo | Property | Conditions | Prior approvals                  |
|  Recommendation: Recommend with conditions (insurance, legal advice)            |
|  Exceptions: none     Your limit: GHS 3,000,000     Conflict: none              |
|  Decision (•) Approve ( ) Approve with conditions ( ) Return ( ) Decline         |
|  Comment [                                                       ]              |
|  [Confirm with MFA]                                                             |
+--------------------------------------------------------------------------------+
```

## W10. Conditions and disbursement gate

```
+--------------------------------------------------------------------------------+
| Conditions · MTG-2026-001001                       Gate: BLOCKED (3 open)        |
|  ✓ Down payment proof          Verified by Credit Admin  9 Oct                  |
|  ✓ Fit-to-lend certificate     Issued 10 Oct                                    |
|  ● Independent legal advice    Evidence submitted      [Verify] [Reject]        |
|  ○ Insurance policies          Open, due 20 Oct        [Remind]                 |
|  ○ Registration fees           Open, due 20 Oct                                 |
|  [Create disbursement request]  (disabled until the gate passes)                |
+--------------------------------------------------------------------------------+
```

## W11. Post-disbursement tracker

```
+--------------------------------------------------------------------------------+
| Post-disbursement · Account 1234567890                                          |
|  Mortgage registration   due 9 Nov   In progress   Legal                        |
|  Security perfection     due 9 Dec   Open                                       |
|  Lands Commission        due 8 Jan   Open                                       |
|  ! Title perfection      due 8 Feb   Open                                       |
|  Safe custody            on receipt  Open                                       |
+--------------------------------------------------------------------------------+
```

## W12. Management dashboard

```
+--------------------------------------------------------------------------------+
| Mortgage management · Last 30 days   Product [All ▾]                            |
| Received 42 | Pipeline GHS 31.4M | Approval rate 78% | Disbursed 9 | SLA breaches 6|
| End-to-end median 21 days (p90 38)      Pre-approval within 24h 91%             |
| Funnel   Submitted ████████ 42  Assessing █████ 24  Approval ███ 11 ...         |
| Bottlenecks  Collateral valuation  ███████ 5.2d                                 |
|              Legal searches        █████ 3.8d                                   |
| [Open breaching cases]                                                          |
+--------------------------------------------------------------------------------+
```

The figures in the wireframes are illustrative sample values to show layout.

## Interaction principles

- A phone-width layout stacks the form and moves calculators below the field they belong to.
- Every needed action appears once, in "Needs you" or the task inbox.
- Errors name the field and say what to change.
- Every status shows who has the next move and by when.

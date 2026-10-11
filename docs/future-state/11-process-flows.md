# 20. Future-State Process Flows and 21. Swimlane Diagrams

Seven views. All diagrams are Mermaid.

## 1. End-to-end process flow

```mermaid
flowchart TD
  S(["Start"]) --> A1["Applicant selects product<br/>and completes forms"]
  A1 --> A2["Consent and e-signature"]
  A2 --> A3["Submit"]
  A3 --> V{"Validation<br/>passed?"}
  V -->|"No"| A1
  V -->|"Yes"| PA

  subgraph PA["Pre-approval (target under 24 hours)"]
    direction TB
    P1["HR verification"]
    P2["Credit bureau check"]
    P3["Affordability assessment"]
    P1 --> P4["Risk assessment"]
    P2 --> P4
    P3 --> P4
    P4 --> P5["Eligibility score"]
  end

  PA --> D{"Decision"}
  D -->|"Pre-approved"| C1["Applicant confirms to proceed"]
  D -->|"Referred"| R1["Credit Officer decides"]
  R1 -->|"Pre-approve"| C1
  R1 -->|"Decline with reason"| E1(["Declined"])

  C1 --> T1
  subgraph T1["Parallel assessment"]
    direction TB
    T2["Valuation"]
    T3["Legal searches"]
    T4["Vendor due diligence<br/>(private vendor)"]
    T5["Full credit assessment"]
  end

  T1 --> PR{"Property<br/>acceptable?"}
  PR -->|"No"| E2(["Reject, notify applicant"])
  PR -->|"Yes"| AP["Approval by tier"]
  AP --> AD{"Approved?"}
  AD -->|"No"| E1
  AD -->|"Yes"| O1["Offer and Truth in Lending<br/>generated and signed"]
  O1 --> CP["Conditions precedent"]
  CP --> FL["Fit-to-lend and security documents"]
  FL --> G{"Disbursement<br/>gate passed?"}
  G -->|"No"| CP
  G -->|"Yes"| DB["Disbursement approval and payment"]
  DB --> AC["Account creation and activation"]
  AC --> PD["Post-disbursement tracking"]
  PD --> E3(["Closed"])
```

## 2. Swimlane diagram (Home Purchase)

```mermaid
flowchart LR
  subgraph Applicant
    a1["Complete forms<br/>and consent"]
    a2["Confirm to proceed"]
    a3["Sign offer and TIL,<br/>pay fees"]
    a4["Provide conditions"]
    a5["Sign mortgage documents"]
  end
  subgraph System
    s1["Validate and<br/>duplicate check"]
    s2["Affordability, bureau,<br/>eligibility score"]
    s3["Route approvals"]
    s4["Generate offer"]
    s5["Disbursement gate"]
  end
  subgraph HR
    h1["Verify employment"]
  end
  subgraph Credit
    c1["Credit review<br/>and recommendation"]
  end
  subgraph Collateral
    k1["Assign valuer,<br/>review report"]
    k2["Accept property,<br/>fit-to-lend"]
  end
  subgraph Legal
    l1["Searches"]
    l2["Mortgage deed,<br/>legal advice check"]
  end
  subgraph Approvers
    p1["Approve by tier"]
  end
  subgraph CreditAdmin["Credit Admin"]
    ca1["Verify conditions,<br/>approve disbursement"]
  end
  subgraph Operations
    o1["Pay vendor,<br/>activate account"]
  end
  subgraph PostDisb["Post Disbursement"]
    d1["Register, perfect,<br/>safe custody"]
  end

  a1 --> s1 --> s2
  s2 --> h1
  h1 --> s2
  s2 --> a2
  a2 --> k1
  a2 --> l1
  a2 --> c1
  k1 --> k2
  l1 --> k2
  k2 --> c1
  c1 --> s3 --> p1 --> s4 --> a3
  a3 --> a4
  a4 --> ca1
  a3 --> l2 --> a5
  a5 --> s5
  ca1 --> s5
  s5 --> o1 --> d1
```

## 3. Applicant journey map

```mermaid
journey
  title Staff applicant journey (Home Purchase)
  section Start
    Sign in and choose product: 5: Applicant
    Pre-filled staff details: 5: Applicant
  section Apply
    Complete forms with live affordability: 4: Applicant
    Upload documents once: 4: Applicant
    Sign consent: 5: Applicant
  section Pre-approval
    Wait for automated checks: 3: Applicant, System
    Receive pre-approval notice: 5: Applicant
  section Assess
    Confirm to proceed and pay fees: 3: Applicant
    Track valuation and searches: 4: Applicant
    Answer a query directly: 4: Applicant, Credit
  section Offer
    Receive and sign offer: 5: Applicant
  section Conditions
    Provide legal advice and insurance: 3: Applicant
    Sign mortgage documents: 4: Applicant
  section Funds
    Vendor paid, account active: 5: Applicant
  section After
    Follow registration progress: 4: Applicant
```

| Stage | Applicant sees | Pain removed |
|---|---|---|
| Apply | One guided form, calculators, draft saved | Paper, re-keying |
| Pre-approval | A clear status and the expected time | Silence |
| Assess | Each unit's progress and open requests | Relay through Mortgage Team |
| Offer | One signing session | Four separate hand-offs |
| After | Registration and perfection status | No visibility |

## 4. System interaction diagram

```mermaid
sequenceDiagram
  participant A as Applicant
  participant P as Portals
  participant W as Workflow and case
  participant R as Rules
  participant D as Documents
  participant X as External services
  participant S as Staff units
  A->>P: Forms, documents, signatures
  P->>W: Create and submit case
  W->>X: Identity, HR, bureau
  W->>R: Eligibility and routing
  R-->>W: Decision and next steps
  W->>S: Create tasks for HR, Collateral, Legal, Credit
  S->>P: Messages and requests to applicant
  A->>P: Reply and upload
  P->>D: Store and index documents
  S->>W: Complete tasks and decide
  W->>D: Generate offer, deed, certificates
  W->>X: Core banking disbursement and account
  W-->>A: Notifications at each milestone
```

## 5. Mortgage lifecycle diagram

```mermaid
stateDiagram-v2
  [*] --> Draft
  Draft --> Submitted: submit
  Submitted --> PreApproval: validated
  Submitted --> Draft: returned
  PreApproval --> PreApproved: score and checks pass
  PreApproval --> Referred: refer
  Referred --> PreApproved: Credit approves
  Referred --> Declined: Credit declines with reason
  PreApproved --> InAssessment: applicant confirms
  PreApproved --> Expired: validity ended
  InAssessment --> InApproval: assessments complete
  InAssessment --> Declined: property rejected
  InApproval --> OfferIssued: approved
  InApproval --> InAssessment: returned
  InApproval --> Declined: declined
  OfferIssued --> ConditionsPending: offer accepted
  OfferIssued --> Expired: offer validity ended
  ConditionsPending --> ReadyToDisburse: gate passed
  ReadyToDisburse --> Disbursed: funds released
  Disbursed --> PostDisbursement: account active
  PostDisbursement --> Closed: all items closed
  Draft --> Withdrawn: withdraw
  InAssessment --> OnHold: hold
  OnHold --> InAssessment: resume
  Closed --> [*]
  Declined --> [*]
  Withdrawn --> [*]
  Expired --> [*]
```

## 6. Home Purchase workflow

```mermaid
flowchart TD
  H1["Forms A, B, C, E, F, G<br/>(J if private vendor)"] --> H2["Submit and pre-approval"]
  H2 --> H3{"Pre-approved?"}
  H3 -->|"No"| H3x(["Referred or declined"])
  H3 -->|"Yes"| H4["Applicant confirms"]
  H4 --> H5["Valuation (Form D)"]
  H4 --> H6["Legal searches"]
  H4 --> H7["Vendor due diligence"]
  H4 --> H8["Full credit assessment"]
  H5 --> H9{"Property accepted?"}
  H6 --> H9
  H7 --> H9
  H9 -->|"No"| H9x(["Reject property"])
  H9 -->|"Yes"| H10["Credit recommendation"]
  H8 --> H10
  H10 --> H11["Approval by tier"]
  H11 --> H12["Offer and TIL"]
  H12 --> H13["Conditions: down payment, spousal consent,<br/>legal advice, declaration, insurance, fees"]
  H13 --> H14["Fit-to-lend, mortgage documents"]
  H14 --> H15{"Under construction?"}
  H15 -->|"Yes"| H16["Stage payment against progress certificate"]
  H15 -->|"No"| H17["Single disbursement to vendor"]
  H16 --> H18["Account activation"]
  H17 --> H18
  H18 --> H19["Post-disbursement tracking"]
```

## 7. Equity Release workflow

```mermaid
flowchart TD
  E1["Forms A, C, E, F, G, H, I"] --> E2["Ownership and title-number check"]
  E2 --> E3["Submit and pre-approval<br/>(indicative, on declared value)"]
  E3 --> E4{"Pre-approved?"}
  E4 -->|"No"| E4x(["Referred or declined"])
  E4 -->|"Yes"| E5["Applicant confirms"]
  E5 --> E6["Valuation (Form D) with FSV"]
  E5 --> E7["Legal searches and ownership review"]
  E6 --> E8{"Request within<br/>70% of FSV less existing balance?"}
  E8 -->|"No"| E9["Applicant reduces amount<br/>or application stops"]
  E9 --> E8
  E8 -->|"Yes"| E10{"Property accepted?"}
  E7 --> E10
  E10 -->|"No"| E10x(["Reject property"])
  E10 -->|"Yes"| E11["Credit recommendation and approval by tier"]
  E11 --> E12["Offer and TIL"]
  E12 --> E13["Conditions: spousal consent, legal advice,<br/>declaration, insurance, fees,<br/>existing lender consent"]
  E13 --> E14["Fit-to-lend and mortgage documents"]
  E14 --> E15{"Purpose"}
  E15 -->|"Tuition or medical"| E16["Pay institution directly"]
  E15 -->|"Renovation or improvement"| E17["Stage payments after inspection"]
  E15 -->|"Family emergency"| E18["Pay applicant account"]
  E16 --> E19["Account activation"]
  E17 --> E19
  E18 --> E19
  E19 --> E20["Post-disbursement tracking"]
```

## Mapping to the AS-IS process

| AS-IS step | Where it goes |
|---|---|
| HR chain (Employment Review, HR Approval, Director HR, DMD, No Objection) | HR verification in pre-approval; HR approvals L1 to L3 by tier |
| Review Application, Documents Complete?, Request Missing Documents | Validation and document checklist at submission |
| Prepare Credit Package, Credit Memo | Generated from case data |
| Truth in Lending, Offer Letter | Generated offer pack |
| Affordability, Bureau, Property Assessment, Risk | Pre-approval and credit assessment; property decision moves to Collateral |
| Credit Query, Applicant Response, Reassess | Request for information task between Credit and applicant |
| Four-level approval | Tiered approval matrix |
| Legal searches and deed | Parallel legal track |
| Review Search Reports, Property Acceptable?, Fit-to-Lend | Collateral track |
| Credit Admin verification, Final Pre-Disbursement Verification | One disbursement gate checklist |
| Disburse Funds, Pay Vendor, Activate Account | Operations steps after the gate |
| Registration, Perfection, Lands Commission, Title, Safe Custody | Tracked post-disbursement items |

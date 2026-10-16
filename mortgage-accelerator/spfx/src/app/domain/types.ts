/**
 * Domain model for the Mortgage Accelerator module.
 * These shapes are the contract between the UI and the Advance Flow API layer.
 * Extension tables in the Advance Flow database mirror them (see docs/02-data-model.md).
 */

export type ProductCode = 'HOME_PURCHASE' | 'EQUITY_RELEASE';

export type Role =
  | 'APPLICANT'
  | 'MORTGAGE_OFFICER'
  | 'MORTGAGE_LEAD'
  | 'HR'
  | 'CREDIT'
  | 'LEGAL'
  | 'COLLATERAL'
  | 'VALUER'
  | 'APPROVER'
  | 'CREDIT_ADMIN'
  | 'OPERATIONS'
  | 'POST_DISBURSEMENT'
  | 'EXECUTIVE'
  | 'AUDITOR'
  | 'ADMIN';

export type CaseState =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PRE_APPROVAL'
  | 'REFERRED'
  | 'PRE_APPROVED'
  | 'IN_ASSESSMENT'
  | 'IN_APPROVAL'
  | 'OFFER_ISSUED'
  | 'CONDITIONS_PENDING'
  | 'READY_TO_DISBURSE'
  | 'DISBURSED'
  | 'POST_DISBURSEMENT'
  | 'CLOSED'
  | 'ON_HOLD'
  | 'DECLINED'
  | 'WITHDRAWN'
  | 'EXPIRED';

export const STATE_ORDER: CaseState[] = [
  'DRAFT',
  'SUBMITTED',
  'PRE_APPROVAL',
  'REFERRED',
  'PRE_APPROVED',
  'IN_ASSESSMENT',
  'IN_APPROVAL',
  'OFFER_ISSUED',
  'CONDITIONS_PENDING',
  'READY_TO_DISBURSE',
  'DISBURSED',
  'POST_DISBURSEMENT',
  'CLOSED'
];

export const STATE_LABEL: Record<CaseState, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PRE_APPROVAL: 'Pre-approval',
  REFERRED: 'Referred to Credit',
  PRE_APPROVED: 'Pre-approved',
  IN_ASSESSMENT: 'In assessment',
  IN_APPROVAL: 'In approval',
  OFFER_ISSUED: 'Offer issued',
  CONDITIONS_PENDING: 'Conditions pending',
  READY_TO_DISBURSE: 'Ready to disburse',
  DISBURSED: 'Disbursed',
  POST_DISBURSEMENT: 'Post-disbursement',
  CLOSED: 'Closed',
  ON_HOLD: 'On hold',
  DECLINED: 'Declined',
  WITHDRAWN: 'Withdrawn',
  EXPIRED: 'Expired'
};

export const PRODUCT_LABEL: Record<ProductCode, string> = {
  HOME_PURCHASE: 'Home Purchase',
  EQUITY_RELEASE: 'Home Equity Release'
};

export type EquityPurpose =
  | 'HOME_IMPROVEMENT_RENOVATION'
  | 'MEDICAL'
  | 'FAMILY_EMERGENCY'
  | 'TUITION';

export const PURPOSE_LABEL: Record<EquityPurpose, string> = {
  HOME_IMPROVEMENT_RENOVATION: 'Home improvement/renovation',
  MEDICAL: 'Medical situation',
  FAMILY_EMERGENCY: 'Family Emergencies',
  TUITION: 'Payment of Tuition'
};

export interface UserContext {
  userId: string;
  displayName: string;
  email: string;
  roles: Role[];
  employeeNo?: string;
  /** Ids of cases the user may not touch because of ring-fencing. */
  conflictCaseIds: string[];
}

export interface Applicant {
  employeeNo: string;
  staffId: string;
  fullName: string;
  department: string;
  branch: string;
  position: string;
  employmentStatus: 'PERMANENT' | 'CONTRACT' | 'PROBATION';
  dateEmployed: string;
  dateOfBirth: string;
  retirementDate: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
  maritalStatus: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
}

export interface Financials {
  basicSalary: number;
  allowances: number;
  otherIncome: number;
  /** Tax, pension and other statutory deductions per month. */
  deductions: number;
  /** Repayments on existing loans per month. */
  existingLoanRepayments: number;
  /** Rent, maintenance and other monthly commitments. */
  otherCommitments: number;
  assetsTotal: number;
  liabilitiesTotal: number;
}

export interface HomePurchaseDetails {
  purchasePrice: number;
  propertyValue: number;
  downPayment: number;
  vendorType: 'DEVELOPER' | 'PRIVATE';
  vendorName: string;
  constructionStatus: 'COMPLETED' | 'UNDER_CONSTRUCTION' | 'OFF_PLAN';
}

export interface EquityDetails {
  declaredValue: number;
  forcedSaleValue?: number;
  existingMortgageBalance: number;
  existingMortgageStatus: 'NONE' | 'THIS_BANK' | 'OTHER_LENDER';
  ownership: 'SOLE' | 'JOINT';
  purpose: EquityPurpose;
  useOfFunds: Array<{ item: string; amount: number }>;
}

export interface ConsentSet {
  creditBureau: boolean;
  identity: boolean;
  dataProcessing: boolean;
  regulatory: boolean;
  informationSharing: boolean;
  signedAt?: string;
  signedBy?: string;
}

export interface ReadinessCheck {
  id: string;
  label: string;
  status: 'PASS' | 'WARN' | 'FAIL' | 'PENDING';
  weight: number;
  detail: string;
  fix?: string;
  hardStop?: boolean;
}

export interface ReadinessResult {
  score: number;
  band: 'READY' | 'ALMOST' | 'NOT_READY';
  decision: 'PRE_APPROVED' | 'REFERRED' | 'NOT_ELIGIBLE_AS_SUBMITTED';
  checks: ReadinessCheck[];
  hardStops: string[];
  eligibleAmount: number;
  maxInstalment: number;
  instalment: number;
  dsrPct: number;
  netIncome: number;
  nextActions: string[];
}

export type ApprovalLevel = 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7' | 'L8';

export interface ApprovalStep {
  level: ApprovalLevel;
  group: number;
  approverName?: string;
  decision?: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'RETURN' | 'DECLINE';
  comment?: string;
  assignedAt?: string;
  decidedAt?: string;
  dueAt?: string;
}

export type TaskStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_APPLICANT' | 'DONE' | 'CANCELLED';

export interface Task {
  id: string;
  caseId: string;
  title: string;
  ownerTeam: Role;
  assignee?: string;
  status: TaskStatus;
  createdAt: string;
  dueAt: string;
  completedAt?: string;
  slaCode?: string;
}

export type ConditionStatus = 'OPEN' | 'EVIDENCE_SUBMITTED' | 'VERIFIED' | 'REJECTED' | 'WAIVED';

export interface Condition {
  id: string;
  caseId: string;
  code: string;
  title: string;
  mandatory: boolean;
  ownerRole: Role;
  verifierRole: Role;
  dueDate: string;
  status: ConditionStatus;
  evidenceDoc?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  note?: string;
}

export type DocCategory =
  | 'APPLICATION'
  | 'CONSENT'
  | 'IDENTITY'
  | 'INCOME'
  | 'PROPERTY'
  | 'CREDIT'
  | 'LEGAL'
  | 'COLLATERAL'
  | 'INSURANCE'
  | 'REGISTRATION'
  | 'DISBURSEMENT';

export interface DocRef {
  id: string;
  caseId: string;
  category: DocCategory;
  docType: string;
  fileName: string;
  sizeKb: number;
  version: number;
  uploadedBy: string;
  uploadedAt: string;
  classification: 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  /** Server-relative URL of the file in the SharePoint document library. */
  libraryUrl: string;
}

export interface DocRequest {
  id: string;
  caseId: string;
  docType: string;
  category: DocCategory;
  requestedBy: string;
  dueDate: string;
  fulfilledDocId?: string;
}

export interface Property {
  id: string;
  titleNumber: string;
  address: string;
  digitalAddress?: string;
  propertyType: string;
  description: string;
  ownershipType: 'FREEHOLD' | 'LEASEHOLD';
  registeredOwner: string;
  constructionStatus: 'COMPLETED' | 'UNDER_CONSTRUCTION' | 'OFF_PLAN';
  region: string;
  caseIds: string[];
  searches: LegalSearch[];
  encumbrance: 'NONE' | 'EXISTING_CHARGE' | 'UNKNOWN';
}

export interface LegalSearch {
  id: string;
  type: 'LAND' | 'CERTIFICATE' | 'CONSOLIDATED';
  status: 'REQUESTED' | 'COMPLETED';
  result?: 'CLEAR' | 'CLEAR_WITH_NOTES' | 'ADVERSE';
  requestedAt: string;
  completedAt?: string;
  notes?: string;
}

export type ValuationStatus =
  | 'REQUESTED'
  | 'ASSIGNED'
  | 'VISIT_SCHEDULED'
  | 'REPORT_RECEIVED'
  | 'UNDER_REVIEW'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'REVALUATION';

export interface ValuationRequest {
  id: string;
  caseId: string;
  propertyId: string;
  status: ValuationStatus;
  valuerId?: string;
  contactPerson: string;
  contactNumber: string;
  requestedAt: string;
  assignedAt?: string;
  dueAt: string;
  report?: ValuationReport;
}

export interface ValuationReport {
  marketValue: number;
  forcedSaleValue: number;
  valuationDate: string;
  condition: string;
  occupancy: string;
  reportDoc?: string;
  reviewedBy?: string;
  reviewOutcome?: 'ACCEPTED' | 'RETURNED';
}

export interface Valuer {
  id: string;
  firm: string;
  registrationNo: string;
  areas: string[];
  openJobs: number;
  maxJobs: number;
  avgTurnaroundDays: number;
}

export interface FitToLend {
  caseId: string;
  checklist: Array<{ id: string; label: string; done: boolean }>;
  decision?: 'ACCEPT' | 'ACCEPT_WITH_CONDITIONS' | 'REJECT';
  reason?: string;
  certificateNo?: string;
  issuedAt?: string;
  validUntil?: string;
}

export interface Disbursement {
  id: string;
  caseId: string;
  trancheNo: number;
  payee: string;
  amount: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID' | 'REJECTED';
  requestedBy: string;
  approvedBy?: string;
  paidAt?: string;
  paymentRef?: string;
}

export interface PostItem {
  id: string;
  caseId: string;
  type: 'MORTGAGE_REGISTRATION' | 'SECURITY_PERFECTION' | 'LANDS_COMMISSION' | 'TITLE_PERFECTION' | 'SAFE_CUSTODY';
  owner?: string;
  dueDate: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'WAIVED';
  completedAt?: string;
}

export interface Message {
  id: string;
  threadId: string;
  sender: string;
  senderRole: Role;
  kind: 'MESSAGE' | 'REQUEST' | 'NOTE' | 'SYSTEM';
  body: string;
  sentAt: string;
  attachments: string[];
  /** For REQUEST: the due date and whether it has been closed. */
  dueDate?: string;
  closed?: boolean;
}

export interface Thread {
  id: string;
  caseId: string;
  topic: 'HR' | 'CREDIT' | 'LEGAL' | 'COLLATERAL' | 'OPERATIONS' | 'GENERAL' | 'INTERNAL';
  visibleToApplicant: boolean;
  messages: Message[];
  oversightJoined: boolean;
}

export interface AuditEntry {
  id: string;
  at: string;
  caseId: string;
  ref: string;
  actor: string;
  action: string;
  detail: string;
}

export interface AppNotification {
  id: string;
  at: string;
  caseId?: string;
  title: string;
  body: string;
  severity: 'INFO' | 'WARN' | 'ALERT';
  read: boolean;
}

export interface SlaClock {
  code: string;
  label: string;
  startedAt: string;
  dueAt: string;
  pausedMinutes: number;
  pausedSince?: string;
}

export interface MortgageCase {
  id: string;
  ref: string;
  /** The loan account number in core banking, set when the mortgage account is activated. */
  accountNumber?: string;
  product: ProductCode;
  state: CaseState;
  applicant: Applicant;
  coBorrowerName?: string;
  currency: 'GHS' | 'USD' | 'EUR';
  amountRequested: number;
  approvedAmount?: number;
  tenorYears: number;
  ratePct: number;
  financials: Financials;
  purchase?: HomePurchaseDetails;
  equity?: EquityDetails;
  consent: ConsentSet;
  /** Answers to the bank's Mortgage Application Form, keyed by formDef field keys. */
  form?: { [key: string]: string | boolean };
  /** Customer Asset Valuation Form, sent to the Collateral Maintenance Unit. */
  valuationRequest?: { sentAt?: string; fields: { [key: string]: string } };
  /** Search request, sent by mail to the Mortgage Unit. */
  searchRequest?: { sentAt?: string };
  propertyId?: string;
  ownerName: string;
  createdAt: string;
  submittedAt?: string;
  updatedAt: string;
  stageEnteredAt: string;
  sla?: SlaClock;
  approvals: ApprovalStep[];
  conditions: Condition[];
  tasks: Task[];
  fitToLend?: FitToLend;
  disbursements: Disbursement[];
  postItems: PostItem[];
  readiness?: ReadinessResult;
  /** Result of the Loan Eligibility step, computed by the Advance Flow eligibility service. */
  eligibility?: { input: EligibilityInput; result: EligibilityResult; exceptionalApproval: boolean };
  offer?: { issuedAt: string; validUntil: string; acceptedAt?: string };
  declineReason?: string;
  locked: boolean;
  /** Set when a reviewer returned the case to the applicant. */
  returnedNote?: string;
  /** The state the case was in when it was returned, so resubmission resumes there. */
  returnedFromState?: CaseState;
}

/** What the existing Staff Loan "Loan Eligibility" step asks for. */
export interface EligibilityInput {
  loanType: ProductCode;
  accountNumber: string;
  dateOfBirth: string;
  netSalary: number;
  allowances: number;
  loanAmount: number;
  /** Monthly instalment on personal, auto and education loans. */
  instalmentPersonal: number;
  /** Monthly instalment on mortgage and hire purchase only. */
  instalmentMortgageHp: number;
  payOffExistingLoans: boolean;
  tenorMonths?: number;
}

/** What the "Computation Results" panel shows. */
export interface EligibilityResult {
  interestRatePct: number;
  dirLimitPct: number;
  tenorMonths: number;
  periodicInstalment: number;
  dirCapitalPersonalPct: number;
  dirAllStaffLoansPct: number;
  loanAmountQualifiedFor: number;
  decisionRule: 'ELIGIBLE' | 'EXCEEDS_DIR_LIMIT' | 'EXCEEDS_QUALIFIED_AMOUNT' | 'NOT_ELIGIBLE';
  decisionText: string;
  exceptionalApprovalAllowed: boolean;
  computedAt: string;
}

/** Returned once the staff member passes the account-number and OTP check. */
export interface StaffProfile {
  fullName: string;
  dateOfBirth: string;
  netSalary: number;
  allowances: number;
  instalmentPersonal: number;
  instalmentMortgageHp: number;
}

export interface Kpi {
  label: string;
  value: string;
  hint?: string;
  trend?: 'UP' | 'DOWN' | 'FLAT';
  tone?: 'NORMAL' | 'ALERT';
}

import {
  AppNotification,
  ApprovalLevel,
  AuditEntry,
  Condition,
  ConditionStatus,
  DocCategory,
  DocRef,
  DocRequest,
  Disbursement,
  EquityDetails,
  Financials,
  FitToLend,
  HomePurchaseDetails,
  Applicant,
  ConsentSet,
  Kpi,
  LegalSearch,
  MortgageCase,
  PostItem,
  ProductCode,
  Property,
  ReadinessResult,
  Task,
  Thread,
  UserContext,
  ValuationReport,
  ValuationRequest,
  Valuer,
  CaseState,
  Role
} from '../domain/types';

export interface CaseFilter {
  product?: ProductCode;
  states?: CaseState[];
  /** Only cases owned by, or belonging to, the current user. */
  mine?: boolean;
  q?: string;
}

export interface DraftPatch {
  applicant?: Partial<Applicant>;
  financials?: Partial<Financials>;
  purchase?: Partial<HomePurchaseDetails>;
  equity?: Partial<EquityDetails>;
  consent?: Partial<ConsentSet>;
  amountRequested?: number;
  tenorYears?: number;
  ratePct?: number;
  currency?: 'GHS' | 'USD' | 'EUR';
  coBorrowerName?: string;
}

export interface FunnelRow {
  label: string;
  count: number;
  value: number;
}

export interface AnalyticsSnapshot {
  kpis: Kpi[];
  funnel: FunnelRow[];
  monthly: Array<{ month: string; purchase: number; equity: number }>;
  stageDays: Array<{ stage: string; medianDays: number; targetDays: number }>;
  slaByTeam: Array<{ team: string; onTime: number; breached: number }>;
  declineReasons: Array<{ reason: string; count: number }>;
  portfolioByProduct: Array<{ label: string; value: number }>;
  ageing: Array<{ bucket: string; count: number }>;
  turnaround: Array<{ label: string; days: number; target: number }>;
  /** True when the series are illustrative samples rather than live data. */
  sample: boolean;
}

/**
 * Every call the Mortgage Accelerator makes. Each method maps to an Advance Flow
 * capability (see docs/05-api-contract.md): Application Management, Workflow Engine,
 * Notification Engine, Document Requests, Approval Routing, Applicant Tracking, Audit Trail.
 */
export interface AdvanceFlowClient {
  /* identity */
  getCurrentUser(): Promise<UserContext>;

  /* Application Management + Applicant Tracking */
  listCases(filter?: CaseFilter): Promise<MortgageCase[]>;
  getCase(id: string): Promise<MortgageCase>;
  createDraft(product: ProductCode): Promise<MortgageCase>;
  saveDraft(id: string, patch: DraftPatch): Promise<MortgageCase>;
  submitCase(id: string): Promise<MortgageCase>;
  confirmProceed(id: string): Promise<MortgageCase>;
  acceptOffer(id: string): Promise<MortgageCase>;
  withdrawCase(id: string, reason: string): Promise<MortgageCase>;
  returnCase(id: string, note: string): Promise<MortgageCase>;
  getReadiness(id: string): Promise<ReadinessResult>;

  /* Workflow Engine: tasks */
  listTasks(filter?: { role?: Role; caseId?: string; open?: boolean }): Promise<Task[]>;
  completeTask(taskId: string, outcome?: string): Promise<Task>;

  /* Approval Routing */
  decideApproval(caseId: string, level: ApprovalLevel, decision: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'RETURN' | 'DECLINE', comment: string): Promise<MortgageCase>;

  /* Document Requests + SharePoint library */
  listDocuments(caseId: string): Promise<DocRef[]>;
  uploadDocument(caseId: string, docType: string, category: DocCategory, file: { name: string; sizeKb: number }): Promise<DocRef>;
  listDocRequests(caseId: string): Promise<DocRequest[]>;
  requestDocument(caseId: string, docType: string, category: DocCategory, dueDate: string): Promise<DocRequest>;

  /* Valuation Management */
  listValuations(): Promise<ValuationRequest[]>;
  listValuers(): Promise<Valuer[]>;
  requestValuation(caseId: string, contactPerson: string, contactNumber: string): Promise<ValuationRequest>;
  assignValuer(valuationId: string, valuerId: string): Promise<ValuationRequest>;
  submitValuationReport(valuationId: string, report: ValuationReport): Promise<ValuationRequest>;
  reviewValuation(valuationId: string, outcome: 'ACCEPTED' | 'RETURNED', note: string): Promise<ValuationRequest>;

  /* Property Repository */
  listProperties(): Promise<Property[]>;
  getProperty(id: string): Promise<Property>;
  recordSearch(propertyId: string, type: LegalSearch['type'], result: NonNullable<LegalSearch['result']>, notes: string): Promise<Property>;

  /* Fit-To-Lend Workspace */
  getFitToLend(caseId: string): Promise<FitToLend>;
  setChecklistItem(caseId: string, itemId: string, done: boolean): Promise<FitToLend>;
  decideProperty(caseId: string, decision: NonNullable<FitToLend['decision']>, reason: string): Promise<MortgageCase>;
  issueFitToLend(caseId: string): Promise<MortgageCase>;

  /* Conditions Tracker */
  listConditions(): Promise<Condition[]>;
  updateCondition(id: string, status: ConditionStatus, note: string): Promise<Condition>;

  /* Stakeholder Collaboration Hub */
  listThreads(caseId?: string): Promise<Thread[]>;
  postMessage(threadId: string, body: string, kind: 'MESSAGE' | 'REQUEST' | 'NOTE', dueDate?: string): Promise<Thread>;
  joinThread(threadId: string): Promise<Thread>;
  closeRequest(threadId: string, messageId: string): Promise<Thread>;

  /* Disbursement and post-disbursement */
  requestDisbursement(caseId: string, payee: string, amount: number): Promise<Disbursement>;
  approveDisbursement(id: string): Promise<Disbursement>;
  payDisbursement(id: string): Promise<Disbursement>;
  listPostItems(): Promise<PostItem[]>;
  updatePostItem(id: string, status: PostItem['status']): Promise<PostItem>;

  /* Audit Trail */
  listAudit(filter?: { caseId?: string; q?: string }): Promise<AuditEntry[]>;

  /* Notification Engine */
  listNotifications(): Promise<AppNotification[]>;
  markNotificationRead(id: string): Promise<void>;
  /** Real-time push. Returns an unsubscribe function. */
  subscribe(listener: (n: AppNotification) => void): () => void;

  /* Reporting */
  getAnalytics(): Promise<AnalyticsSnapshot>;
}

export interface DevControls {
  /** Present only on the local mock. Lets the harness switch role. */
  setRole(role: Role): void;
  setApplicant(employeeNo: string): void;
  reset(): void;
}

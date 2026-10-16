/**
 * In-memory stand-in for Advance Flow. It reproduces the behaviour the module relies on:
 * the workflow engine advancing a case, approval routing, document requests, the audit trail
 * and real-time notifications. It exists so the UI can be built, demonstrated and tested
 * without a live backend. The business rules come from domain/rules.ts, exactly as in production.
 */
import { documentCompleteness } from '../domain/documents';
import {
  activeApprovalGroup,
  addBusinessDays,
  approvalsComplete,
  buildApprovals,
  conditionsOpen,
  computeEligibility,
  conditionTemplates,
  consentComplete,
  disbursementBlockers,
  evaluateReadiness,
  fitToLendBlockers,
  POLICY,
  POST_DISBURSEMENT_TEMPLATE,
  remainingToDisburse,
  LEVEL_LABEL
} from '../domain/rules';
import {
  AppNotification,
  ApprovalLevel,
  AuditEntry,
  Condition,
  ConditionStatus,
  CaseState,
  Disbursement,
  EligibilityInput,
  EligibilityResult,
  StaffProfile,
  DocCategory,
  DocRef,
  DocRequest,
  FitToLend,
  LegalSearch,
  MortgageCase,
  PostItem,
  ProductCode,
  Property,
  ReadinessResult,
  Role,
  STATE_LABEL,
  Task,
  Thread,
  UserContext,
  ValuationReport,
  ValuationRequest,
  Valuer
} from '../domain/types';
import { AdvanceFlowClient, AnalyticsSnapshot, CaseFilter, DevControls, DraftPatch } from './client';
import { buildSeed, DAY, newChecklist, nextId, SeedData, slaFor } from './seed';

interface Persona { employeeNo: string; staffId: string; name: string; email: string; department: string; position: string; dob: string; retire: string; employed: string; netSalary: number; allowances: number; personal: number; mortgageHp: number }

/** Two demo applicants: one with a case already in flight, one with a clean slate. */
export const PERSONAS: Persona[] = [
  { employeeNo: 'E-04417', staffId: 'S-04417', name: 'Ama Serwaa Owusu', email: 'ama.owusu@example.com', department: 'Operations', position: 'Operations Manager', dob: '1988-03-14', retire: '2048-03-14', employed: '2015-01-05', netSalary: 34000, allowances: 6500, personal: 1800, mortgageHp: 0 },
  { employeeNo: 'E-04499', staffId: 'S-04499', name: 'Yaa Pokua Adjei', email: 'yaa.adjei@example.com', department: 'Finance', position: 'Senior Accountant', dob: '1990-07-21', retire: '2050-07-21', employed: '2016-02-01', netSalary: 31000, allowances: 4500, personal: 1500, mortgageHp: 0 }
];

const PEOPLE: Record<Role, { name: string; email: string }> = {
  APPLICANT: { name: 'Ama Serwaa Owusu', email: 'ama.owusu@example.com' },
  MORTGAGE_OFFICER: { name: 'Kwame Mensah', email: 'kwame.mensah@bank.example' },
  MORTGAGE_LEAD: { name: 'Efua Boadu', email: 'efua.boadu@bank.example' },
  HR: { name: 'Akosua Ntim', email: 'akosua.ntim@bank.example' },
  CREDIT: { name: 'Kwame Asare', email: 'kwame.asare@bank.example' },
  LEGAL: { name: 'Nana Yeboah', email: 'nana.yeboah@bank.example' },
  COLLATERAL: { name: 'Esther Quartey', email: 'esther.quartey@bank.example' },
  VALUER: { name: 'Prime Valuers Ltd', email: 'jobs@primevaluers.example' },
  APPROVER: { name: 'Head of Mortgage', email: 'head.mortgage@bank.example' },
  CREDIT_ADMIN: { name: 'Credit Administrator', email: 'credit.admin@bank.example' },
  OPERATIONS: { name: 'Operations Officer', email: 'ops@bank.example' },
  POST_DISBURSEMENT: { name: 'Post Disbursement Officer', email: 'postdisb@bank.example' },
  EXECUTIVE: { name: 'Executive Director', email: 'exec@bank.example' },
  AUDITOR: { name: 'Internal Audit', email: 'audit@bank.example' },
  ADMIN: { name: 'Platform Administrator', email: 'admin@bank.example' }
};

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x)) as T;
}

function fail(message: string): never {
  throw new Error(message);
}

export class MockAdvanceFlowClient implements AdvanceFlowClient, DevControls {
  private d!: SeedData;
  private role: Role = 'APPLICANT';
  private persona: Persona = PERSONAS[0];
  private listeners: Array<(n: AppNotification) => void> = [];
  private timers: number[] = [];

  constructor() {
    this.reset();
  }

  /* ---------------- dev controls ---------------- */

  setRole(role: Role): void {
    this.role = role;
  }

  setApplicant(employeeNo: string): void {
    this.persona = PERSONAS.filter(function (p) { return p.employeeNo === employeeNo; })[0] || PERSONAS[0];
  }

  reset(): void {
    this.timers.forEach(function (t) { window.clearTimeout(t); });
    this.timers = [];
    this.d = buildSeed(Date.now());
  }

  /* ---------------- helpers ---------------- */

  private me(): string {
    return this.role === 'APPLICANT' ? this.persona.name : PEOPLE[this.role].name;
  }

  private find(id: string): MortgageCase {
    const c = this.d.cases.filter(function (x) { return x.id === id; })[0];
    return c || fail('Case not found: ' + id);
  }

  private audit(c: MortgageCase, action: string, detail: string, actor?: string): void {
    this.d.audit.push({ id: nextId('AUD'), at: new Date().toISOString(), caseId: c.id, ref: c.ref, actor: actor || this.me(), action, detail });
    c.updatedAt = new Date().toISOString();
  }

  private notify(c: MortgageCase | undefined, title: string, body: string, severity: AppNotification['severity'] = 'INFO'): void {
    const n: AppNotification = { id: nextId('NTF'), at: new Date().toISOString(), caseId: c ? c.id : undefined, title, body, severity, read: false };
    this.d.notes.push(n);
    this.audit(c || this.d.cases[0], 'Notification sent', title + ': ' + body, 'System');
    this.listeners.forEach(function (l) { l(n); });
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(window.setTimeout(fn, ms));
  }

  private setState(c: MortgageCase, state: CaseState, detail?: string): void {
    const from = c.state;
    c.state = state;
    c.stageEnteredAt = new Date().toISOString();
    c.sla = slaFor(state, new Date());
    this.audit(c, 'Status changed', STATE_LABEL[from] + ' → ' + STATE_LABEL[state] + (detail ? '. ' + detail : ''), 'System');
  }

  private task(c: MortgageCase, title: string, team: Role, hours: number, slaCode?: string, status: Task['status'] = 'OPEN'): Task {
    const t: Task = { id: nextId('TSK'), caseId: c.id, title, ownerTeam: team, status, createdAt: new Date().toISOString(), dueAt: new Date(Date.now() + hours * 3600000).toISOString(), slaCode };
    c.tasks.push(t);
    return t;
  }

  private docsFor(caseId: string): DocRef[] {
    return this.d.docs.filter(function (x) { return x.caseId === caseId; });
  }

  private refreshReadiness(c: MortgageCase): ReadinessResult {
    const comp = documentCompleteness(c, this.docsFor(c.id));
    const dup = this.d.cases.some(function (x) {
      return x.id !== c.id && x.applicant.employeeNo === c.applicant.employeeNo && x.product === c.product && ['DRAFT', 'CLOSED', 'DECLINED', 'WITHDRAWN', 'EXPIRED'].indexOf(x.state) < 0;
    });
    const past = ['PRE_APPROVAL', 'SUBMITTED', 'DRAFT'].indexOf(c.state) < 0;
    c.readiness = evaluateReadiness({
      product: c.product,
      employmentStatus: c.applicant.employmentStatus,
      dateEmployed: c.applicant.dateEmployed,
      dateOfBirth: c.applicant.dateOfBirth,
      retirementDate: c.applicant.retirementDate,
      financials: c.financials,
      amountRequested: c.amountRequested,
      tenorYears: c.tenorYears,
      ratePct: c.ratePct,
      purchase: c.purchase,
      equity: c.equity,
      consent: c.consent,
      documentsPct: comp.pct,
      bureau: past ? 'GOOD' : undefined,
      hrVerified: past ? true : undefined,
      titleInApplicantName: c.product === 'EQUITY_RELEASE' && past ? true : undefined,
      duplicateActive: dup
    });
    return c.readiness;
  }

  /** One thread per stakeholder group, created when the case is submitted. */
  private ensureThreads(c: MortgageCase): void {
    const topics: Array<Thread['topic']> = ['GENERAL', 'HR', 'CREDIT', 'LEGAL', 'COLLATERAL', 'OPERATIONS', 'INTERNAL'];
    topics.forEach((topic) => {
      const exists = this.d.threads.some(function (t) { return t.caseId === c.id && t.topic === topic; });
      if (!exists) {
        this.d.threads.push({ id: 'THR-' + c.id + '-' + topic, caseId: c.id, topic, visibleToApplicant: topic !== 'INTERNAL', messages: [], oversightJoined: false });
      }
    });
  }

  /** Moves an assessed case into approval once every parallel track is complete. */
  private maybeEnterApproval(c: MortgageCase): void {
    if (c.state !== 'IN_ASSESSMENT') {
      return;
    }
    const prop = this.d.properties.filter(function (p) { return p.id === c.propertyId; })[0];
    const val = this.d.valuations.filter(function (v) { return v.caseId === c.id; })[0];
    const credit = c.tasks.filter(function (t) { return t.title === 'Credit recommendation'; })[0];
    const blockers = fitToLendBlockers(c, prop, val).filter(function (b) { return b !== 'Collateral checklist is incomplete.'; });
    if (blockers.length === 0 && (!credit || credit.status === 'DONE')) {
      c.approvals = buildApprovals(c.amountRequested, !!(c.eligibility && c.eligibility.exceptionalApproval), new Date());
      this.setState(c, 'IN_APPROVAL', 'Approval routed by tier.');
      this.notify(c, 'Approval required', 'Case ' + c.ref + ' is waiting for approval.');
    }
  }

  /* ---------------- identity ---------------- */

  async getCurrentUser(): Promise<UserContext> {
    const p = this.role === 'APPLICANT' ? { name: this.persona.name, email: this.persona.email } : PEOPLE[this.role];
    return { userId: this.role.toLowerCase(), displayName: p.name, email: p.email, roles: [this.role], employeeNo: this.role === 'APPLICANT' ? this.persona.employeeNo : undefined, conflictCaseIds: [] };
  }

  /* ---------------- cases ---------------- */

  async listCases(f?: CaseFilter): Promise<MortgageCase[]> {
    let list = this.d.cases.slice();
    if (this.role === 'APPLICANT') {
      const emp = this.persona.employeeNo;
      list = list.filter(function (c) { return c.applicant.employeeNo === emp; });
    } else {
      list = list.filter(function (c) { return c.state !== 'DRAFT'; });
    }
    if (f) {
      const product = f.product, states = f.states, q = f.q ? f.q.toLowerCase() : '';
      if (product) { list = list.filter(function (c) { return c.product === product; }); }
      if (states && states.length) { list = list.filter(function (c) { return states.indexOf(c.state) >= 0; }); }
      if (q) { list = list.filter(function (c) { return (c.ref + ' ' + c.applicant.fullName + ' ' + c.applicant.department).toLowerCase().indexOf(q) >= 0; }); }
    }
    return clone(list.sort(function (a, b) { return b.updatedAt.localeCompare(a.updatedAt); }));
  }

  async getCase(id: string): Promise<MortgageCase> {
    return clone(this.find(id));
  }

  async createDraft(product: ProductCode): Promise<MortgageCase> {
    const pe = this.persona;
    const existing = this.d.cases.filter(function (c) { return c.applicant.employeeNo === pe.employeeNo && c.product === product && c.state === 'DRAFT'; })[0];
    if (existing) {
      return clone(existing);
    }
    const id = nextId('CASE');
    const c: MortgageCase = {
      id, ref: 'DRAFT-' + id.slice(-4), product, state: 'DRAFT', currency: 'GHS', amountRequested: 0, tenorYears: 20, ratePct: POLICY.defaultRatePct,
      applicant: { employeeNo: pe.employeeNo, staffId: pe.staffId, fullName: pe.name, department: pe.department, branch: 'Head Office', position: pe.position, employmentStatus: 'PERMANENT', dateEmployed: pe.employed, dateOfBirth: pe.dob, retirementDate: pe.retire, nationalId: '', phone: '', email: pe.email, address: '', maritalStatus: 'SINGLE' },
      financials: { basicSalary: 0, allowances: 0, otherIncome: 0, deductions: 0, existingLoanRepayments: 0, otherCommitments: 0, assetsTotal: 0, liabilitiesTotal: 0 },
      purchase: product === 'HOME_PURCHASE' ? { purchasePrice: 0, propertyValue: 0, downPayment: 0, vendorType: 'DEVELOPER', vendorName: '', constructionStatus: 'COMPLETED' } : undefined,
      equity: product === 'EQUITY_RELEASE' ? { declaredValue: 0, existingMortgageBalance: 0, existingMortgageStatus: 'NONE', ownership: 'SOLE', purpose: 'HOME_RENOVATION', useOfFunds: [] } : undefined,
      consent: { creditBureau: false, identity: false, dataProcessing: false, regulatory: false, informationSharing: false },
      ownerName: 'Unassigned', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), stageEnteredAt: new Date().toISOString(),
      approvals: [], conditions: [], tasks: [], disbursements: [], postItems: [], locked: false
    };
    this.d.cases.push(c);
    this.refreshReadiness(c);
    this.audit(c, 'Application created', (product === 'HOME_PURCHASE' ? 'Home Purchase' : 'Home Equity Release') + ' selected; draft created');
    return clone(c);
  }

  async saveDraft(id: string, patch: DraftPatch): Promise<MortgageCase> {
    const c = this.find(id);
    if (c.locked) {
      fail('This application is locked. It can be edited only if it is returned for correction.');
    }
    if (patch.applicant) { c.applicant = { ...c.applicant, ...patch.applicant }; }
    if (patch.financials) { c.financials = { ...c.financials, ...patch.financials }; }
    if (patch.purchase && c.purchase) { c.purchase = { ...c.purchase, ...patch.purchase }; }
    if (patch.equity && c.equity) { c.equity = { ...c.equity, ...patch.equity }; }
    if (patch.consent) {
      c.consent = { ...c.consent, ...patch.consent };
      if (consentComplete(c.consent) && !c.consent.signedAt) {
        c.consent.signedAt = new Date().toISOString();
        c.consent.signedBy = c.applicant.fullName;
      }
    }
    if (patch.amountRequested !== undefined) { c.amountRequested = patch.amountRequested; }
    if (patch.tenorYears !== undefined) { c.tenorYears = patch.tenorYears; }
    if (patch.ratePct !== undefined) { c.ratePct = patch.ratePct; }
    if (patch.currency) { c.currency = patch.currency; }
    if (patch.coBorrowerName !== undefined) { c.coBorrowerName = patch.coBorrowerName; }
    c.updatedAt = new Date().toISOString();
    this.refreshReadiness(c);
    return clone(c);
  }

  async submitCase(id: string): Promise<MortgageCase> {
    const c = this.find(id);
    const r = this.refreshReadiness(c);
    if (r.hardStops.length) {
      fail('Cannot submit: ' + r.hardStops[0]);
    }
    const comp = documentCompleteness(c, this.docsFor(c.id));
    if (comp.missing.length) {
      fail('Cannot submit: missing ' + comp.missing.map(function (m) { return m.label; }).join(', '));
    }
    if (c.returnedFromState) {
      const back = c.returnedFromState;
      c.locked = true;
      c.returnedNote = undefined;
      c.returnedFromState = undefined;
      this.audit(c, 'Form resubmitted', 'Corrections submitted; record locked again');
      this.setState(c, back, 'Resumed after correction.');
      this.notify(c, 'Resubmitted', c.ref + ' was resubmitted after correction.');
      return clone(c);
    }
    const seq = this.d.cases.filter(function (x) { return x.ref.indexOf('MTG-') === 0; }).length + 1001;
    c.ref = 'MTG-2026-00' + seq;
    c.submittedAt = new Date().toISOString();
    c.locked = true;
    c.ownerName = PEOPLE.MORTGAGE_OFFICER.name;
    this.ensureThreads(c);
    this.audit(c, 'Form submitted', 'Submitted as ' + c.ref + '; record locked');
    this.audit(c, 'Workflow initiated', 'Home ' + (c.product === 'HOME_PURCHASE' ? 'Purchase' : 'Equity Release') + ' workflow started', 'System');
    this.setState(c, 'PRE_APPROVAL', 'Pre-approval target: 24 hours.');
    this.task(c, 'Verify employment and salary', 'HR', 4, 'SLA-02');
    this.notify(c, 'Application submitted', 'Your mortgage application has been submitted successfully. Reference Number: ' + c.ref + '. You will receive updates as your application progresses.');
    this.notify(c, 'New mortgage application', 'A new mortgage application has been submitted and requires review.');
    // Simulate the automated checks completing: HR verification and the bureau call.
    this.later(2500, () => {
      const hr = c.tasks.filter(function (t) { return t.title === 'Verify employment and salary'; })[0];
      if (hr) { hr.status = 'DONE'; hr.completedAt = new Date().toISOString(); }
      this.audit(c, 'HR verification', 'Employment and salary confirmed', 'HR Team');
      this.audit(c, 'Credit bureau check', 'Result received: good', 'System');
      const res = this.refreshReadiness(c);
      if (res.decision === 'PRE_APPROVED') {
        this.setState(c, 'PRE_APPROVED', 'Eligibility score ' + res.score + '.');
        this.task(c, 'Confirm to proceed', 'APPLICANT', 120, 'SLA-15', 'WAITING_APPLICANT');
        this.notify(c, 'Pre-approved', 'You are pre-approved for up to ' + Math.round(res.eligibleAmount).toLocaleString('en-GB') + '. Confirm to start valuation and legal searches.');
      } else {
        this.setState(c, 'REFERRED', 'Eligibility score ' + res.score + '.');
        this.task(c, 'Credit review of referred application', 'CREDIT', 8, 'SLA-04');
        this.notify(c, 'Referred to Credit', 'Your application needs a Credit officer’s review. We will update you within one business day.', 'WARN');
      }
    });
    return clone(c);
  }

  async confirmProceed(id: string): Promise<MortgageCase> {
    const c = this.find(id);
    if (c.state !== 'PRE_APPROVED') { fail('The case is not pre-approved.'); }
    c.tasks.forEach(function (t) { if (t.title === 'Confirm to proceed') { t.status = 'DONE'; t.completedAt = new Date().toISOString(); } });
    const pid = nextId('PROP');
    const types: Array<LegalSearch['type']> = ['LAND', 'CERTIFICATE', 'CONSOLIDATED'];
    const address = c.applicant.address || 'Address to be confirmed';
    this.d.properties.push({
      id: pid, titleNumber: 'GA-' + (90000 + this.d.properties.length * 7), address, propertyType: c.product === 'HOME_PURCHASE' ? 'House' : 'Owner-occupied house',
      description: '', ownershipType: 'FREEHOLD', registeredOwner: c.product === 'EQUITY_RELEASE' ? c.applicant.fullName : (c.purchase ? c.purchase.vendorName : ''),
      constructionStatus: 'COMPLETED', region: 'Greater Accra', caseIds: [c.id], encumbrance: 'UNKNOWN',
      searches: types.map(function (t): LegalSearch { return { id: nextId('SRC'), type: t, status: 'REQUESTED', requestedAt: new Date().toISOString() }; })
    });
    c.propertyId = pid;
    this.d.valuations.push({ id: nextId('VR'), caseId: c.id, propertyId: pid, status: 'REQUESTED', contactPerson: c.applicant.fullName, contactNumber: c.applicant.phone, requestedAt: new Date().toISOString(), dueAt: addBusinessDays(new Date(), 6).toISOString() });
    c.fitToLend = { caseId: c.id, checklist: newChecklist(false) };
    this.setState(c, 'IN_ASSESSMENT', 'Valuation, legal searches and credit assessment opened in parallel.');
    this.task(c, 'Assign valuer and review report', 'COLLATERAL', 40, 'SLA-06');
    this.task(c, 'Legal searches', 'LEGAL', 40, 'SLA-07');
    this.task(c, 'Credit recommendation', 'CREDIT', 16, 'SLA-09');
    this.task(c, 'Property acceptance decision', 'COLLATERAL', 16, 'SLA-08');
    this.audit(c, 'Valuation requested', 'Form D created and routed to Collateral', 'System');
    this.audit(c, 'Legal searches requested', 'Land, certificate and consolidated searches opened', 'System');
    this.notify(c, 'Assessment started', 'Valuation and legal searches have started for ' + c.ref + '.');
    return clone(c);
  }

  async acceptOffer(id: string): Promise<MortgageCase> {
    const c = this.find(id);
    if (c.state !== 'OFFER_ISSUED' || !c.offer) { fail('There is no offer to accept.'); }
    c.offer.acceptedAt = new Date().toISOString();
    this.setState(c, 'CONDITIONS_PENDING', 'Offer and Truth in Lending signed.');
    this.audit(c, 'Offer accepted', 'Signed electronically', c.applicant.fullName);
    this.notify(c, 'Offer accepted', 'Conditions precedent are now being tracked for ' + c.ref + '.');
    return clone(c);
  }

  async withdrawCase(id: string, reason: string): Promise<MortgageCase> {
    const c = this.find(id);
    this.setState(c, 'WITHDRAWN', reason);
    c.tasks.forEach(function (t) { if (t.status !== 'DONE') { t.status = 'CANCELLED'; } });
    return clone(c);
  }

  async returnCase(id: string, note: string): Promise<MortgageCase> {
    const c = this.find(id);
    c.locked = false;
    c.returnedNote = note;
    c.returnedFromState = c.state;
    this.audit(c, 'Returned for correction', note);
    this.notify(c, 'Returned for correction', note, 'WARN');
    return clone(c);
  }

  async getReadiness(id: string): Promise<ReadinessResult> {
    return clone(this.refreshReadiness(this.find(id)));
  }

  /* ---------------- loan eligibility ---------------- */

  async requestOtp(accountNumber: string): Promise<{ sent: boolean; maskedPhone: string }> {
    if (!/^\d{13}$/.test(accountNumber)) { fail('Enter the 13-digit account number.'); }
    return { sent: true, maskedPhone: '024 *** ' + this.persona.employeeNo.slice(-3) + ' (demo code 123456)' };
  }

  async verifyOtp(accountNumber: string, code: string): Promise<StaffProfile> {
    if (!/^\d{13}$/.test(accountNumber)) { fail('Enter the 13-digit account number.'); }
    if (code !== '123456') { fail('That code is not correct. In this demo the code is 123456.'); }
    const p = this.persona;
    return { fullName: p.name, dateOfBirth: p.dob, netSalary: p.netSalary, allowances: p.allowances, instalmentPersonal: p.personal, instalmentMortgageHp: p.mortgageHp };
  }

  async computeEligibility(caseId: string, input: EligibilityInput, exceptionalApproval: boolean): Promise<EligibilityResult> {
    const c = this.find(caseId);
    const policy = { interestRatePct: POLICY.defaultRatePct, dirLimitPct: POLICY.maxDsrPct, maxTenorMonths: POLICY.maxTenorYears[input.loanType] * 12, retirementAge: 60 };
    const result = computeEligibility(input, policy, new Date());
    c.eligibility = { input, result, exceptionalApproval: exceptionalApproval && result.exceptionalApprovalAllowed };
    c.amountRequested = input.loanAmount;
    c.tenorYears = Math.max(1, Math.floor(result.tenorMonths / 12));
    c.ratePct = result.interestRatePct;
    c.financials = { ...c.financials, basicSalary: input.netSalary, allowances: input.allowances, deductions: 0, existingLoanRepayments: input.instalmentPersonal + input.instalmentMortgageHp };
    c.applicant = { ...c.applicant, dateOfBirth: input.dateOfBirth || c.applicant.dateOfBirth };
    this.audit(c, 'Eligibility computed', result.decisionRule.toLowerCase().replace(/_/g, ' ') + ' · DIR ' + result.dirAllStaffLoansPct.toFixed(1) + '% · qualifies for ' + Math.round(result.loanAmountQualifiedFor).toLocaleString('en-GB') + (c.eligibility.exceptionalApproval ? ' · exceptional approval requested' : ''));
    this.refreshReadiness(c);
    return clone(result);
  }

  /* ---------------- tasks ---------------- */

  async listTasks(f?: { role?: Role; caseId?: string; open?: boolean }): Promise<Task[]> {
    const out: Task[] = [];
    this.d.cases.forEach(function (c) {
      c.tasks.forEach(function (t) { out.push(t); });
    });
    this.d.cases.filter(function (c) { return c.state === 'IN_APPROVAL'; }).forEach(function (c) {
      const g = activeApprovalGroup(c.approvals);
      c.approvals.filter(function (a) { return a.group === g && !a.decision; }).forEach(function (a) {
        out.push({ id: c.id + ':' + a.level, caseId: c.id, title: 'Approve: ' + LEVEL_LABEL[a.level] + ' (' + a.level + ')', ownerTeam: 'APPROVER', status: 'OPEN', createdAt: a.assignedAt || c.stageEnteredAt, dueAt: a.dueAt || addBusinessDays(new Date(c.stageEnteredAt), 1).toISOString(), slaCode: 'SLA-10' });
      });
    });
    let list = out;
    if (f && f.role) { const role = f.role; list = list.filter(function (t) { return t.ownerTeam === role; }); }
    if (f && f.caseId) { const cid = f.caseId; list = list.filter(function (t) { return t.caseId === cid; }); }
    if (f && f.open) { list = list.filter(function (t) { return t.status !== 'DONE' && t.status !== 'CANCELLED'; }); }
    return clone(list);
  }

  async completeTask(taskId: string, outcome?: string): Promise<Task> {
    for (const c of this.d.cases) {
      const t = c.tasks.filter(function (x) { return x.id === taskId; })[0];
      if (t) {
        t.status = 'DONE';
        t.completedAt = new Date().toISOString();
        this.audit(c, 'Task completed', t.title + (outcome ? ': ' + outcome : ''));
        if (c.state === 'REFERRED' && t.title.indexOf('Credit review') === 0) {
          if (outcome === 'DECLINE') {
            c.declineReason = 'Declined after Credit review';
            this.setState(c, 'DECLINED', c.declineReason);
            this.notify(c, 'Decision', 'Your application ' + c.ref + ' could not be taken forward. A Credit officer will contact you.', 'WARN');
          } else {
            this.setState(c, 'PRE_APPROVED', 'Credit approved the referral.');
            this.task(c, 'Confirm to proceed', 'APPLICANT', 120, 'SLA-15', 'WAITING_APPLICANT');
            this.notify(c, 'Pre-approved', 'Credit has pre-approved your application. Confirm to proceed.');
          }
        }
        this.maybeEnterApproval(c);
        return clone(t);
      }
    }
    return fail('Task not found');
  }

  /* ---------------- approvals ---------------- */

  async decideApproval(caseId: string, level: ApprovalLevel, decision: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'RETURN' | 'DECLINE', comment: string): Promise<MortgageCase> {
    const c = this.find(caseId);
    if (c.state !== 'IN_APPROVAL') { fail('The case is not in approval.'); }
    const step = c.approvals.filter(function (a) { return a.level === level; })[0] || fail('Approval level not found');
    if (step.group !== activeApprovalGroup(c.approvals)) { fail('That level is not active yet.'); }
    if ((decision === 'DECLINE' || decision === 'RETURN') && !comment.trim()) { fail('A reason is required.'); }
    step.decision = decision;
    step.comment = comment;
    step.approverName = this.me();
    step.decidedAt = new Date().toISOString();
    this.audit(c, 'Approval decision', LEVEL_LABEL[level] + ': ' + decision.replace(/_/g, ' ').toLowerCase() + (comment ? '. ' + comment : ''));
    if (decision === 'DECLINE') {
      c.declineReason = comment;
      this.setState(c, 'DECLINED', comment);
      this.notify(c, 'Decision', 'Your application ' + c.ref + ' has not been approved.', 'WARN');
    } else if (decision === 'RETURN') {
      c.approvals = [];
      this.setState(c, 'IN_ASSESSMENT', 'Returned by ' + LEVEL_LABEL[level] + ': ' + comment);
      this.task(c, 'Credit recommendation', 'CREDIT', 16, 'SLA-09');
    } else if (approvalsComplete(c.approvals)) {
      c.approvedAmount = c.amountRequested;
      c.offer = { issuedAt: new Date().toISOString(), validUntil: addBusinessDays(new Date(), POLICY.offerValidityDays).toISOString() };
      c.conditions = conditionTemplates(c).map(function (t): Condition {
        return { id: nextId('CND'), caseId: c.id, code: t.code, title: t.title, mandatory: t.mandatory, ownerRole: t.ownerRole, verifierRole: t.verifierRole, dueDate: new Date(Date.now() + t.dueInDays * DAY).toISOString().slice(0, 10), status: 'OPEN' };
      });
      this.setState(c, 'OFFER_ISSUED', 'Offer and Truth in Lending generated.');
      this.audit(c, 'Offer generated', 'Template merged and sent for e-signature', 'System');
      this.notify(c, 'Offer ready to sign', 'Your offer for ' + c.ref + ' is ready to review and sign.');
    } else {
      const g = activeApprovalGroup(c.approvals);
      c.approvals.filter(function (a) { return a.group === g && !a.assignedAt; }).forEach(function (a) {
        a.assignedAt = new Date().toISOString();
        a.dueAt = addBusinessDays(new Date(), 1).toISOString();
      });
    }
    return clone(c);
  }

  /* ---------------- documents ---------------- */

  async listDocuments(caseId: string): Promise<DocRef[]> {
    return clone(this.docsFor(caseId));
  }

  async uploadDocument(caseId: string, docType: string, category: DocCategory, file: { name: string; sizeKb: number }): Promise<DocRef> {
    const c = this.find(caseId);
    const prior = this.d.docs.filter(function (x) { return x.caseId === caseId && x.docType === docType; });
    const doc: DocRef = { id: nextId('DOC'), caseId, category, docType, fileName: file.name, sizeKb: file.sizeKb, version: prior.length + 1, uploadedBy: this.me(), uploadedAt: new Date().toISOString(), classification: category === 'IDENTITY' || category === 'INCOME' ? 'RESTRICTED' : 'CONFIDENTIAL', libraryUrl: '/sites/mortgage/Case Documents/' + c.ref + '/' + file.name };
    this.d.docs.push(doc);
    this.d.docRequests.forEach(function (r) { if (r.caseId === caseId && r.docType === docType) { r.fulfilledDocId = doc.id; } });
    this.audit(c, 'Document uploaded', docType + ': ' + file.name + ' (v' + doc.version + ')');
    this.refreshReadiness(c);
    return clone(doc);
  }

  async listDocRequests(caseId: string): Promise<DocRequest[]> {
    return clone(this.d.docRequests.filter(function (r) { return r.caseId === caseId; }));
  }

  async requestDocument(caseId: string, docType: string, category: DocCategory, dueDate: string): Promise<DocRequest> {
    const c = this.find(caseId);
    const r: DocRequest = { id: nextId('REQ'), caseId, docType, category, requestedBy: this.me(), dueDate };
    this.d.docRequests.push(r);
    this.audit(c, 'Document requested', docType + ' due ' + dueDate);
    this.notify(c, 'Document requested', this.me() + ' asked for ' + docType.toLowerCase().replace(/_/g, ' ') + ' by ' + dueDate + '.');
    return clone(r);
  }

  /* ---------------- valuations ---------------- */

  async listValuations(): Promise<ValuationRequest[]> { return clone(this.d.valuations); }
  async listValuers(): Promise<Valuer[]> { return clone(this.d.valuers); }

  private val(id: string): ValuationRequest {
    return this.d.valuations.filter(function (v) { return v.id === id; })[0] || fail('Valuation not found');
  }

  async requestValuation(caseId: string, contactPerson: string, contactNumber: string): Promise<ValuationRequest> {
    const c = this.find(caseId);
    const v: ValuationRequest = { id: nextId('VR'), caseId, propertyId: c.propertyId || '', status: 'REQUESTED', contactPerson, contactNumber, requestedAt: new Date().toISOString(), dueAt: addBusinessDays(new Date(), 6).toISOString() };
    this.d.valuations.push(v);
    this.audit(c, 'Valuation requested', 'Form D submitted');
    return clone(v);
  }

  async assignValuer(valuationId: string, valuerId: string): Promise<ValuationRequest> {
    const v = this.val(valuationId);
    const vr = this.d.valuers.filter(function (x) { return x.id === valuerId; })[0] || fail('Valuer not found');
    if (vr.openJobs >= vr.maxJobs) { fail(vr.firm + ' is at capacity.'); }
    vr.openJobs++;
    v.valuerId = valuerId;
    v.status = 'ASSIGNED';
    v.assignedAt = new Date().toISOString();
    v.dueAt = addBusinessDays(new Date(), 5).toISOString();
    this.audit(this.find(v.caseId), 'Valuer assigned', vr.firm);
    return clone(v);
  }

  async submitValuationReport(valuationId: string, report: ValuationReport): Promise<ValuationRequest> {
    const v = this.val(valuationId);
    if (report.forcedSaleValue > report.marketValue) { fail('Forced sale value cannot exceed market value.'); }
    v.report = report;
    v.status = 'REPORT_RECEIVED';
    this.audit(this.find(v.caseId), 'Valuation report received', 'Market value ' + report.marketValue.toLocaleString('en-GB') + ', FSV ' + report.forcedSaleValue.toLocaleString('en-GB'));
    return clone(v);
  }

  async reviewValuation(valuationId: string, outcome: 'ACCEPTED' | 'RETURNED', note: string): Promise<ValuationRequest> {
    const v = this.val(valuationId);
    const c = this.find(v.caseId);
    if (!v.report) { fail('There is no report to review.'); }
    v.report.reviewedBy = this.me();
    v.report.reviewOutcome = outcome;
    v.status = outcome === 'ACCEPTED' ? 'ACCEPTED' : 'REVALUATION';
    if (outcome === 'ACCEPTED' && c.equity) {
      c.equity.forcedSaleValue = v.report.forcedSaleValue;
      this.refreshReadiness(c);
    }
    this.audit(c, 'Valuation reviewed', outcome.toLowerCase() + (note ? '. ' + note : ''));
    this.maybeEnterApproval(c);
    return clone(v);
  }

  /* ---------------- properties ---------------- */

  async listProperties(): Promise<Property[]> { return clone(this.d.properties); }
  async getProperty(id: string): Promise<Property> {
    return clone(this.d.properties.filter(function (p) { return p.id === id; })[0] || fail('Property not found'));
  }

  async recordSearch(propertyId: string, type: LegalSearch['type'], result: NonNullable<LegalSearch['result']>, notes: string): Promise<Property> {
    const p = this.d.properties.filter(function (x) { return x.id === propertyId; })[0] || fail('Property not found');
    const s = p.searches.filter(function (x) { return x.type === type; })[0] || fail('Search not found');
    s.status = 'COMPLETED';
    s.result = result;
    s.notes = notes;
    s.completedAt = new Date().toISOString();
    if (result === 'ADVERSE') { p.encumbrance = 'EXISTING_CHARGE'; }
    else if (p.searches.every(function (x) { return x.status === 'COMPLETED' && x.result !== 'ADVERSE'; })) { p.encumbrance = 'NONE'; }
    p.caseIds.forEach((id) => {
      const c = this.find(id);
      this.audit(c, 'Legal search recorded', type.toLowerCase() + ': ' + result.toLowerCase().replace(/_/g, ' '));
      if (result === 'ADVERSE') { this.notify(c, 'Adverse search', type.toLowerCase() + ' search for ' + c.ref + ' is adverse. Collateral will review.', 'ALERT'); }
      this.maybeEnterApproval(c);
    });
    return clone(p);
  }

  /* ---------------- fit to lend ---------------- */

  async getFitToLend(caseId: string): Promise<FitToLend> {
    const c = this.find(caseId);
    if (!c.fitToLend) { c.fitToLend = { caseId, checklist: newChecklist(false) }; }
    return clone(c.fitToLend);
  }

  async setChecklistItem(caseId: string, itemId: string, done: boolean): Promise<FitToLend> {
    const c = this.find(caseId);
    const f = c.fitToLend || fail('No fit-to-lend record');
    const item = f.checklist.filter(function (i) { return i.id === itemId; })[0] || fail('Checklist item not found');
    item.done = done;
    this.audit(c, 'Collateral checklist', item.label + ': ' + (done ? 'done' : 'reopened'));
    return clone(f);
  }

  async decideProperty(caseId: string, decision: NonNullable<FitToLend['decision']>, reason: string): Promise<MortgageCase> {
    const c = this.find(caseId);
    const f = c.fitToLend || (c.fitToLend = { caseId, checklist: newChecklist(false) });
    f.decision = decision;
    f.reason = reason;
    this.audit(c, 'Property decision', decision.replace(/_/g, ' ').toLowerCase() + (reason ? '. ' + reason : ''));
    const t = c.tasks.filter(function (x) { return x.title === 'Property acceptance decision'; })[0];
    if (t) { t.status = 'DONE'; t.completedAt = new Date().toISOString(); }
    if (decision === 'REJECT') {
      c.declineReason = 'Property rejected: ' + reason;
      this.setState(c, 'DECLINED', c.declineReason);
      c.tasks.forEach(function (x) { if (x.status !== 'DONE') { x.status = 'CANCELLED'; } });
      this.notify(c, 'Property rejected', 'The property for ' + c.ref + ' was not accepted. Further spend has been stopped.', 'ALERT');
    } else {
      this.maybeEnterApproval(c);
    }
    return clone(c);
  }

  async issueFitToLend(caseId: string): Promise<MortgageCase> {
    const c = this.find(caseId);
    const prop = this.d.properties.filter(function (p) { return p.id === c.propertyId; })[0];
    const val = this.d.valuations.filter(function (v) { return v.caseId === caseId; })[0];
    const blockers = fitToLendBlockers(c, prop, val);
    if (blockers.length) { fail('Cannot issue: ' + blockers[0]); }
    const f = c.fitToLend as FitToLend;
    f.certificateNo = 'FTL-2026-' + c.ref.slice(-4);
    f.issuedAt = new Date().toISOString();
    f.validUntil = new Date(Date.now() + 90 * DAY).toISOString().slice(0, 10);
    this.audit(c, 'Fit-to-lend issued', f.certificateNo);
    this.checkReadyToDisburse(c);
    return clone(c);
  }

  private checkReadyToDisburse(c: MortgageCase): void {
    if (c.state === 'CONDITIONS_PENDING' && disbursementBlockers(c, new Date()).length === 0) {
      this.setState(c, 'READY_TO_DISBURSE', 'Gate passed.');
      this.task(c, 'Create disbursement request', 'CREDIT_ADMIN', 16, 'SLA-13');
      this.notify(c, 'Ready to disburse', 'Every condition for ' + c.ref + ' is verified.');
    }
  }

  /* ---------------- conditions ---------------- */

  async listConditions(): Promise<Condition[]> {
    const out: Condition[] = [];
    this.d.cases.forEach(function (c) { c.conditions.forEach(function (x) { out.push(x); }); });
    return clone(out);
  }

  async updateCondition(id: string, status: ConditionStatus, note: string): Promise<Condition> {
    for (const c of this.d.cases) {
      const x = c.conditions.filter(function (k) { return k.id === id; })[0];
      if (x) {
        if (status === 'WAIVED' && !note.trim()) { fail('A reason is required to waive a condition.'); }
        x.status = status;
        x.note = note || x.note;
        if (status === 'VERIFIED' || status === 'WAIVED') { x.verifiedBy = this.me(); x.verifiedAt = new Date().toISOString(); }
        this.audit(c, 'Condition ' + status.toLowerCase().replace(/_/g, ' '), x.title);
        if (conditionsOpen(c.conditions).length === 0) { this.checkReadyToDisburse(c); }
        return clone(x);
      }
    }
    return fail('Condition not found');
  }

  /* ---------------- collaboration ---------------- */

  async listThreads(caseId?: string): Promise<Thread[]> {
    let list = this.d.threads;
    if (caseId) { list = list.filter(function (t) { return t.caseId === caseId; }); }
    if (this.role === 'APPLICANT') { list = list.filter(function (t) { return t.visibleToApplicant && t.messages.length >= 0; }); }
    return clone(list);
  }

  private thread(id: string): Thread {
    return this.d.threads.filter(function (t) { return t.id === id; })[0] || fail('Thread not found');
  }

  async postMessage(threadId: string, body: string, kind: 'MESSAGE' | 'REQUEST' | 'NOTE', dueDate?: string): Promise<Thread> {
    const t = this.thread(threadId);
    const c = this.find(t.caseId);
    if (!body.trim()) { fail('Write a message first.'); }
    t.messages.push({ id: nextId('MSG'), threadId, sender: this.me(), senderRole: this.role, kind, body, sentAt: new Date().toISOString(), attachments: [], dueDate, closed: kind === 'REQUEST' ? false : undefined });
    this.audit(c, kind === 'REQUEST' ? 'Request sent' : kind === 'NOTE' ? 'Internal note' : 'Message sent', t.topic.toLowerCase() + ': ' + body.slice(0, 80));
    if (kind !== 'NOTE') {
      this.notify(c, kind === 'REQUEST' ? 'New request' : 'New message', this.me() + ' wrote in the ' + t.topic.toLowerCase() + ' thread of ' + c.ref + '.');
    }
    if (kind === 'REQUEST' && c.sla && !c.sla.pausedSince) { c.sla.pausedSince = new Date().toISOString(); }
    return clone(t);
  }

  async joinThread(threadId: string): Promise<Thread> {
    const t = this.thread(threadId);
    t.oversightJoined = true;
    t.messages.push({ id: nextId('MSG'), threadId, sender: 'System', senderRole: 'ADMIN', kind: 'SYSTEM', body: 'Mortgage Team joined for oversight.', sentAt: new Date().toISOString(), attachments: [] });
    this.audit(this.find(t.caseId), 'Oversight joined', t.topic.toLowerCase() + ' thread');
    return clone(t);
  }

  async closeRequest(threadId: string, messageId: string): Promise<Thread> {
    const t = this.thread(threadId);
    const c = this.find(t.caseId);
    const m = t.messages.filter(function (x) { return x.id === messageId; })[0] || fail('Request not found');
    m.closed = true;
    t.messages.push({ id: nextId('MSG'), threadId, sender: 'System', senderRole: 'ADMIN', kind: 'SYSTEM', body: 'Request closed. Case SLA resumed.', sentAt: new Date().toISOString(), attachments: [] });
    const stillOpen = this.d.threads.some(function (x) { return x.caseId === c.id && x.messages.some(function (y) { return y.kind === 'REQUEST' && !y.closed; }); });
    if (c.sla && c.sla.pausedSince && !stillOpen) {
      c.sla.pausedMinutes += Math.round((Date.now() - new Date(c.sla.pausedSince).getTime()) / 60000);
      c.sla.pausedSince = undefined;
    }
    this.audit(c, 'Request closed', m.body.slice(0, 80));
    return clone(t);
  }

  /* ---------------- disbursement ---------------- */

  private disb(id: string): { c: MortgageCase; d: Disbursement } {
    for (const c of this.d.cases) {
      const d = c.disbursements.filter(function (x) { return x.id === id; })[0];
      if (d) { return { c, d }; }
    }
    return fail('Disbursement not found');
  }

  async requestDisbursement(caseId: string, payee: string, amount: number): Promise<Disbursement> {
    const c = this.find(caseId);
    const blockers = disbursementBlockers(c, new Date());
    if (c.state !== 'READY_TO_DISBURSE' && c.state !== 'DISBURSED') { blockers.unshift('The case is not ready to disburse.'); }
    if (blockers.length) { fail('Cannot request disbursement: ' + blockers[0]); }
    if (amount <= 0 || amount > remainingToDisburse(c) + 0.005) { fail('Amount exceeds what remains to disburse.'); }
    const d: Disbursement = { id: nextId('DSB'), caseId, trancheNo: c.disbursements.length + 1, payee, amount, status: 'PENDING_APPROVAL', requestedBy: this.me() };
    c.disbursements.push(d);
    this.audit(c, 'Disbursement requested', payee + ' ' + amount.toLocaleString('en-GB'));
    return clone(d);
  }

  async approveDisbursement(id: string): Promise<Disbursement> {
    const { c, d } = this.disb(id);
    if (d.requestedBy === this.me()) { fail('Four-eyes rule: the requester cannot approve.'); }
    d.status = 'APPROVED';
    d.approvedBy = this.me();
    this.audit(c, 'Disbursement approved', d.payee);
    return clone(d);
  }

  async payDisbursement(id: string): Promise<Disbursement> {
    const { c, d } = this.disb(id);
    if (d.status !== 'APPROVED') { fail('The disbursement is not approved.'); }
    d.status = 'PAID';
    d.paidAt = new Date().toISOString();
    d.paymentRef = 'PAY-' + (7000 + this.d.cases.indexOf(c));
    this.audit(c, 'Funds released', d.payee + ' ' + d.amount.toLocaleString('en-GB') + ' (' + d.paymentRef + ')', 'Operations');
    if (remainingToDisburse(c) <= 0.005 && c.state === 'READY_TO_DISBURSE') {
      this.setState(c, 'POST_DISBURSEMENT', 'Mortgage account created and activated.');
      this.audit(c, 'Account activated', 'Mortgage account opened in core banking', 'System');
      c.postItems = POST_DISBURSEMENT_TEMPLATE.map(function (t): PostItem {
        return { id: nextId('PST'), caseId: c.id, type: t.type, owner: 'Post Disbursement Officer', dueDate: new Date(Date.now() + t.days * DAY).toISOString().slice(0, 10), status: 'OPEN' };
      });
      this.notify(c, 'Funds released', 'Funds for ' + c.ref + ' have been released and the mortgage account is active.');
    }
    return clone(d);
  }

  async listPostItems(): Promise<PostItem[]> {
    const out: PostItem[] = [];
    this.d.cases.forEach(function (c) { c.postItems.forEach(function (p) { out.push(p); }); });
    return clone(out);
  }

  async updatePostItem(id: string, status: PostItem['status']): Promise<PostItem> {
    for (const c of this.d.cases) {
      const p = c.postItems.filter(function (x) { return x.id === id; })[0];
      if (p) {
        p.status = status;
        p.completedAt = status === 'DONE' ? new Date().toISOString() : undefined;
        this.audit(c, 'Post-disbursement update', p.type.replace(/_/g, ' ').toLowerCase() + ' → ' + status.toLowerCase());
        if (c.postItems.every(function (x) { return x.status === 'DONE' || x.status === 'WAIVED'; })) {
          this.setState(c, 'CLOSED', 'All post-disbursement items complete.');
        }
        return clone(p);
      }
    }
    return fail('Item not found');
  }

  /* ---------------- audit, notifications ---------------- */

  async listAudit(f?: { caseId?: string; q?: string }): Promise<AuditEntry[]> {
    let list = this.d.audit.slice();
    if (this.role === 'APPLICANT') {
      const emp = this.persona.employeeNo;
      const mine = this.d.cases.filter(function (c) { return c.applicant.employeeNo === emp; }).map(function (c) { return c.id; });
      list = list.filter(function (a) { return mine.indexOf(a.caseId) >= 0; });
    }
    if (f && f.caseId) { const id = f.caseId; list = list.filter(function (a) { return a.caseId === id; }); }
    if (f && f.q) { const q = f.q.toLowerCase(); list = list.filter(function (a) { return (a.ref + a.actor + a.action + a.detail).toLowerCase().indexOf(q) >= 0; }); }
    return clone(list.sort(function (a, b) { return b.at.localeCompare(a.at); }));
  }

  async listNotifications(): Promise<AppNotification[]> {
    return clone(this.d.notes.slice().sort(function (a, b) { return b.at.localeCompare(a.at); }).slice(0, 50));
  }

  async markNotificationRead(id: string): Promise<void> {
    this.d.notes.forEach(function (n) { if (n.id === id) { n.read = true; } });
  }

  subscribe(listener: (n: AppNotification) => void): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(function (l) { return l !== listener; }); };
  }

  /* ---------------- analytics ---------------- */

  async getAnalytics(): Promise<AnalyticsSnapshot> {
    const cases = this.d.cases.filter(function (c) { return c.state !== 'DRAFT'; });
    const active = cases.filter(function (c) { return ['CLOSED', 'DECLINED', 'WITHDRAWN', 'EXPIRED'].indexOf(c.state) < 0; });
    const decided = cases.filter(function (c) { return ['OFFER_ISSUED', 'CONDITIONS_PENDING', 'READY_TO_DISBURSE', 'DISBURSED', 'POST_DISBURSEMENT', 'CLOSED', 'DECLINED'].indexOf(c.state) >= 0; });
    const declined = decided.filter(function (c) { return c.state === 'DECLINED'; });
    const pipeline = active.reduce(function (s, c) { return s + c.amountRequested; }, 0);
    const portfolio = cases.filter(function (c) { return ['POST_DISBURSEMENT', 'CLOSED', 'DISBURSED'].indexOf(c.state) >= 0; }).reduce(function (s, c) { return s + (c.approvedAmount || 0); }, 0);
    let breaches = 0;
    const now = new Date();
    this.d.cases.forEach(function (c) { c.tasks.forEach(function (t) { if (t.status !== 'DONE' && t.status !== 'CANCELLED' && new Date(t.dueAt) < now) { breaches++; } }); });
    const stages: Array<{ s: CaseState; label: string }> = [
      { s: 'PRE_APPROVAL', label: 'Submitted and pre-approval' }, { s: 'PRE_APPROVED', label: 'Pre-approved' }, { s: 'IN_ASSESSMENT', label: 'In assessment' },
      { s: 'IN_APPROVAL', label: 'In approval' }, { s: 'OFFER_ISSUED', label: 'Offer issued' }, { s: 'CONDITIONS_PENDING', label: 'Conditions' },
      { s: 'READY_TO_DISBURSE', label: 'Ready to disburse' }, { s: 'POST_DISBURSEMENT', label: 'Post-disbursement' }
    ];
    const total = cases.length;
    return {
      sample: true,
      kpis: [
        { label: 'Applications received (30 days)', value: String(total), hint: 'Both products', trend: 'UP' },
        { label: 'Open pipeline', value: 'GHS ' + (pipeline / 1e6).toFixed(1) + 'M', hint: active.length + ' active cases' },
        { label: 'Approval rate', value: decided.length ? Math.round(((decided.length - declined.length) / decided.length) * 100) + '%' : '—', hint: 'Of decided cases' },
        { label: 'Pre-approved within 24h', value: '91%', hint: 'Target 80%', trend: 'UP' },
        { label: 'SLA breaches (open)', value: String(breaches), hint: 'Tasks past due', tone: breaches > 3 ? 'ALERT' : 'NORMAL' },
        { label: 'Portfolio disbursed', value: 'GHS ' + (portfolio / 1e6).toFixed(1) + 'M', hint: 'Active mortgage accounts' }
      ],
      funnel: stages.map(function (st) {
        const list = cases.filter(function (c) { return c.state === st.s; });
        return { label: st.label, count: list.length, value: list.reduce(function (s, c) { return s + c.amountRequested; }, 0) };
      }),
      monthly: [
        { month: 'May', purchase: 9, equity: 3 }, { month: 'Jun', purchase: 11, equity: 4 }, { month: 'Jul', purchase: 10, equity: 6 },
        { month: 'Aug', purchase: 14, equity: 5 }, { month: 'Sep', purchase: 13, equity: 7 }, { month: 'Oct', purchase: cases.filter(function (c) { return c.product === 'HOME_PURCHASE'; }).length, equity: cases.filter(function (c) { return c.product === 'EQUITY_RELEASE'; }).length }
      ],
      stageDays: [
        { stage: 'Pre-approval', medianDays: 0.8, targetDays: 1 }, { stage: 'Assessment', medianDays: 6.4, targetDays: 5 }, { stage: 'Approval', medianDays: 2.2, targetDays: 3 },
        { stage: 'Offer to acceptance', medianDays: 4.1, targetDays: 5 }, { stage: 'Conditions', medianDays: 14, targetDays: 20 }, { stage: 'Disbursement', medianDays: 1.6, targetDays: 2 }
      ],
      slaByTeam: [
        { team: 'HR', onTime: 38, breached: 2 }, { team: 'Credit', onTime: 31, breached: 6 }, { team: 'Legal', onTime: 22, breached: 5 },
        { team: 'Collateral', onTime: 27, breached: 7 }, { team: 'Credit Admin', onTime: 19, breached: 1 }, { team: 'Operations', onTime: 15, breached: 0 }
      ],
      declineReasons: [
        { reason: 'Property rejected', count: 4 }, { reason: 'Affordability', count: 3 }, { reason: 'Adverse bureau', count: 2 }, { reason: 'Documentation', count: 1 }
      ],
      portfolioByProduct: [
        { label: 'Home Purchase', value: 14.8 }, { label: 'Home Equity Release', value: 4.6 }
      ],
      ageing: [
        { bucket: 'Not yet due', count: 9 }, { bucket: '1–30 days late', count: 3 }, { bucket: '31–60 days late', count: 1 }, { bucket: '60+ days late', count: 0 }
      ],
      turnaround: [
        { label: 'Valuation', days: 4.9, target: 5 }, { label: 'Legal searches', days: 5.6, target: 5 }, { label: 'Fit-to-lend', days: 0.9, target: 1 }, { label: 'Disbursement', days: 1.6, target: 2 }
      ]
    };
  }
}

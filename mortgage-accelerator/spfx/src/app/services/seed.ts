/**
 * Demo data for the local harness. Never shipped to SharePoint: the SPFx web part
 * uses HttpAdvanceFlowClient. Dates are relative to "now" so the demo always looks current.
 */
import { DOC_SPECS, requiredSpecs } from '../domain/documents';
import {
  addBusinessDays,
  buildApprovals,
  conditionTemplates,
  evaluateReadiness,
  instalment,
  POLICY,
  POST_DISBURSEMENT_TEMPLATE
} from '../domain/rules';
import {
  AppNotification,
  AuditEntry,
  CaseState,
  Condition,
  DocRef,
  DocRequest,
  FitToLend,
  LegalSearch,
  MortgageCase,
  ProductCode,
  Property,
  Role,
  Task,
  Thread,
  ValuationRequest,
  Valuer
} from '../domain/types';

export const DAY = 86400000;
let counter = 5000;
export function nextId(prefix: string): string {
  counter++;
  return prefix + '-' + counter;
}

export interface SeedData {
  cases: MortgageCase[];
  properties: Property[];
  valuations: ValuationRequest[];
  valuers: Valuer[];
  docs: DocRef[];
  docRequests: DocRequest[];
  threads: Thread[];
  audit: AuditEntry[];
  notes: AppNotification[];
}

export const CHECKLIST_ITEMS: Array<{ id: string; label: string }> = [
  { id: 'title', label: 'Title in the correct name' },
  { id: 'encumbrance', label: 'No adverse encumbrance' },
  { id: 'siteplan', label: 'Site plan matches the property' },
  { id: 'permit', label: 'Building permit where applicable' },
  { id: 'valuation', label: 'Valuation reasonable against price' },
  { id: 'fsv', label: 'Forced sale value recorded' },
  { id: 'insurance', label: 'Insurance arranged' }
];

export function newChecklist(done: boolean): FitToLend['checklist'] {
  return CHECKLIST_ITEMS.map(function (i) { return { id: i.id, label: i.label, done }; });
}

interface Spec {
  n: number;
  name: string;
  dept: string;
  position: string;
  product: ProductCode;
  state: CaseState;
  amount: number;
  tenor: number;
  salary: number;
  ageDays: number;
  stageDays: number;
  address: string;
  region: string;
  married?: boolean;
  tenure?: 'FREEHOLD' | 'LEASEHOLD';
  vendor?: 'DEVELOPER' | 'PRIVATE';
  purpose?: 'HOME_IMPROVEMENT' | 'HOME_RENOVATION' | 'MEDICAL' | 'FAMILY_EMERGENCY' | 'TUITION';
  approvedLevels?: number;
  condVerified?: number;
  valStatus?: ValuationRequest['status'];
  searchesDone?: number;
  missingDocs?: string[];
  postDone?: number;
  overduePost?: boolean;
  declineReason?: string;
}

export const SPECS: Spec[] = [
  { n: 17, name: 'Ama Serwaa Owusu', dept: 'Operations', position: 'Operations Manager', product: 'HOME_PURCHASE', state: 'IN_ASSESSMENT', amount: 620000, tenor: 20, salary: 24000, ageDays: 9, stageDays: 3, address: 'House 7, Cedar Court, Oyarifa', region: 'Greater Accra', married: true, vendor: 'DEVELOPER', valStatus: 'REPORT_RECEIVED', searchesDone: 2 },
  { n: 18, name: 'Kofi Boateng', dept: 'Information Technology', position: 'Senior Developer', product: 'HOME_PURCHASE', state: 'IN_APPROVAL', amount: 450000, tenor: 25, salary: 19000, ageDays: 21, stageDays: 1, address: 'Plot 22, Tema Community 25', region: 'Greater Accra', vendor: 'DEVELOPER', approvedLevels: 2 },
  { n: 19, name: 'Abena Asante', dept: 'Retail Banking', position: 'Branch Manager', product: 'HOME_PURCHASE', state: 'PRE_APPROVAL', amount: 380000, tenor: 20, salary: 17000, ageDays: 1, stageDays: 0, address: 'Ahodwo, Kumasi', region: 'Ashanti', vendor: 'PRIVATE' },
  { n: 20, name: 'Yaw Darko', dept: 'Treasury', position: 'Head of Dealing', product: 'HOME_PURCHASE', state: 'CONDITIONS_PENDING', amount: 910000, tenor: 22, salary: 36000, ageDays: 41, stageDays: 6, address: '4-bedroom house, East Legon Hills', region: 'Greater Accra', married: true, vendor: 'DEVELOPER', condVerified: 4 },
  { n: 21, name: 'Efua Mensah', dept: 'Finance', position: 'Financial Controller', product: 'EQUITY_RELEASE', state: 'IN_ASSESSMENT', amount: 300000, tenor: 10, salary: 26000, ageDays: 12, stageDays: 6, address: 'House 12, Kasoa', region: 'Central', purpose: 'HOME_RENOVATION', valStatus: 'UNDER_REVIEW', searchesDone: 3 },
  { n: 22, name: 'Kwabena Osei', dept: 'Risk Management', position: 'Risk Analyst', product: 'EQUITY_RELEASE', state: 'READY_TO_DISBURSE', amount: 240000, tenor: 8, salary: 15000, ageDays: 52, stageDays: 2, address: 'Spintex Road, Accra', region: 'Greater Accra', purpose: 'TUITION' },
  { n: 23, name: 'Esi Quaye', dept: 'Customer Experience', position: 'Team Lead', product: 'HOME_PURCHASE', state: 'POST_DISBURSEMENT', amount: 410000, tenor: 20, salary: 16000, ageDays: 95, stageDays: 40, address: 'Dansoman, Accra', region: 'Greater Accra', vendor: 'DEVELOPER', postDone: 2, overduePost: true },
  { n: 24, name: 'Fiifi Tetteh', dept: 'Internal Audit', position: 'Audit Manager', product: 'HOME_PURCHASE', state: 'REFERRED', amount: 365000, tenor: 20, salary: 13000, ageDays: 2, stageDays: 1, address: 'Anaji, Takoradi', region: 'Western', vendor: 'PRIVATE' },
  { n: 25, name: 'Adwoa Sarpong', dept: 'Compliance', position: 'Compliance Officer', product: 'EQUITY_RELEASE', state: 'OFFER_ISSUED', amount: 500000, tenor: 12, salary: 30000, ageDays: 33, stageDays: 2, address: 'Pokuase, Accra', region: 'Greater Accra', purpose: 'MEDICAL', married: true },
  { n: 26, name: 'Mawuli Dzokoto', dept: 'Operations', position: 'Settlement Officer', product: 'HOME_PURCHASE', state: 'CLOSED', amount: 720000, tenor: 25, salary: 28000, ageDays: 210, stageDays: 20, address: 'Ho, Volta', region: 'Volta', vendor: 'DEVELOPER' },
  { n: 27, name: 'Naa Lamptey', dept: 'Trade Finance', position: 'Trade Officer', product: 'HOME_PURCHASE', state: 'DECLINED', amount: 330000, tenor: 20, salary: 12000, ageDays: 30, stageDays: 14, address: 'Teshie, Accra', region: 'Greater Accra', vendor: 'PRIVATE', declineReason: 'Property rejected: adverse land search' },
  { n: 28, name: 'Selorm Agbeko', dept: 'Information Technology', position: 'Network Engineer', product: 'EQUITY_RELEASE', state: 'DRAFT', amount: 180000, tenor: 8, salary: 14000, ageDays: 3, stageDays: 3, address: 'Tema Community 18', region: 'Greater Accra', purpose: 'FAMILY_EMERGENCY' },
  { n: 29, name: 'Zainab Alhassan', dept: 'Retail Banking', position: 'Relationship Manager', product: 'HOME_PURCHASE', state: 'PRE_APPROVED', amount: 290000, tenor: 20, salary: 12500, ageDays: 4, stageDays: 2, address: 'Tamale', region: 'Northern', vendor: 'DEVELOPER' },
  { n: 30, name: 'Kwaku Ofori', dept: 'Treasury', position: 'Dealer', product: 'HOME_PURCHASE', state: 'IN_ASSESSMENT', amount: 680000, tenor: 22, salary: 27000, ageDays: 18, stageDays: 12, address: 'Trasacco Valley', region: 'Greater Accra', vendor: 'DEVELOPER', valStatus: 'ASSIGNED', searchesDone: 1 }
];

const VALUERS: Valuer[] = [
  { id: 'VAL-1', firm: 'Prime Valuers Ltd', registrationNo: 'GIS/VAL/0147', areas: ['Greater Accra', 'Central'], openJobs: 4, maxJobs: 8, avgTurnaroundDays: 4.2 },
  { id: 'VAL-2', firm: 'Golden Gate Surveyors', registrationNo: 'GIS/VAL/0233', areas: ['Greater Accra', 'Western', 'Volta'], openJobs: 6, maxJobs: 7, avgTurnaroundDays: 5.9 },
  { id: 'VAL-3', firm: 'Ashanti Property Consultants', registrationNo: 'GIS/VAL/0310', areas: ['Ashanti', 'Northern'], openJobs: 2, maxJobs: 6, avgTurnaroundDays: 5.1 }
];

export function slaFor(state: CaseState, from: Date): MortgageCase['sla'] {
  const mk = function (code: string, label: string, days: number) {
    return { code, label, startedAt: from.toISOString(), dueAt: addBusinessDays(from, days).toISOString(), pausedMinutes: 0 };
  };
  switch (state) {
    case 'SUBMITTED':
    case 'PRE_APPROVAL':
      return { code: 'SLA-01', label: 'Pre-approval decision', startedAt: from.toISOString(), dueAt: new Date(from.getTime() + DAY).toISOString(), pausedMinutes: 0 };
    case 'REFERRED':
      return mk('SLA-04', 'Credit review of referral', 1);
    case 'PRE_APPROVED':
      return mk('SLA-15', 'Applicant to confirm', 5);
    case 'IN_ASSESSMENT':
      return mk('SLA-06', 'Parallel assessment', 5);
    case 'IN_APPROVAL':
      return mk('SLA-10', 'Approval group', 1);
    case 'OFFER_ISSUED':
      return mk('SLA-15', 'Applicant to accept offer', 10);
    case 'CONDITIONS_PENDING':
      return mk('SLA-C', 'Conditions precedent', 20);
    case 'READY_TO_DISBURSE':
      return mk('SLA-13', 'Disbursement', 2);
    default:
      return undefined;
  }
}

export function buildSeed(nowMs: number): SeedData {
  const now = new Date(nowMs);
  const data: SeedData = { cases: [], properties: [], valuations: [], valuers: VALUERS.map(function (v) { return { ...v }; }), docs: [], docRequests: [], threads: [], audit: [], notes: [] };
  const log = function (c: MortgageCase, actor: string, action: string, detail: string, at: number): void {
    data.audit.push({ id: nextId('AUD'), at: new Date(at).toISOString(), caseId: c.id, ref: c.ref, actor, action, detail });
  };

  SPECS.forEach(function (s, idx) {
    const id = 'CASE-' + (1001 + idx);
    const ref = s.state === 'DRAFT' ? 'DRAFT-' + (1001 + idx) : 'MTG-2026-00' + (1001 + idx);
    const created = nowMs - s.ageDays * DAY;
    const entered = nowMs - s.stageDays * DAY;
    const dob = new Date(Date.UTC(1984 + (s.n % 9), s.n % 12, 5 + (s.n % 20)));
    const retire = new Date(Date.UTC(dob.getUTCFullYear() + 60, dob.getUTCMonth(), dob.getUTCDate()));
    const price = Math.round(s.amount / 0.78);
    // Cases that progressed past pre-approval are affordable; the referred case is deliberately not.
    const basic = s.state === 'REFERRED' || s.state === 'DRAFT'
      ? s.salary
      : Math.max(s.salary, Math.round(instalment(s.amount, POLICY.defaultRatePct, s.tenor) / 0.2 / 100) * 100);
    const fsv = Math.round(s.amount / 0.55);

    const c: MortgageCase = {
      id,
      ref,
      product: s.product,
      state: s.state,
      applicant: {
        employeeNo: 'E-0' + (4400 + s.n),
        staffId: 'S-0' + (4400 + s.n),
        fullName: s.name,
        department: s.dept,
        branch: 'Head Office',
        position: s.position,
        employmentStatus: 'PERMANENT',
        dateEmployed: new Date(Date.UTC(2010 + (s.n % 8), s.n % 12, 3)).toISOString().slice(0, 10),
        dateOfBirth: dob.toISOString().slice(0, 10),
        retirementDate: retire.toISOString().slice(0, 10),
        nationalId: 'GHA-7' + (12345000 + s.n * 311) + '-' + (s.n % 10),
        phone: '024 555 0' + (100 + s.n),
        email: s.name.toLowerCase().split(' ')[0] + '.' + s.name.toLowerCase().split(' ').slice(-1)[0] + '@example.com',
        address: s.address,
        maritalStatus: s.married ? 'MARRIED' : 'SINGLE'
      },
      currency: 'GHS',
      amountRequested: s.amount,
      approvedAmount: undefined,
      tenorYears: s.tenor,
      ratePct: POLICY.defaultRatePct,
      financials: {
        basicSalary: basic,
        allowances: Math.round(basic * 0.18),
        otherIncome: 0,
        deductions: Math.round(basic * 0.27),
        existingLoanRepayments: Math.round(basic * 0.05),
        otherCommitments: Math.round(basic * 0.08),
        assetsTotal: s.amount * 0.6,
        liabilitiesTotal: s.amount * 0.08
      },
      purchase: s.product === 'HOME_PURCHASE' ? { purchasePrice: price, propertyValue: price, downPayment: Math.round(price * 0.22), vendorType: s.vendor || 'DEVELOPER', vendorName: s.vendor === 'PRIVATE' ? 'Mr. K. Adjei' : 'Cedar Court Developments', constructionStatus: 'COMPLETED' } : undefined,
      equity: s.product === 'EQUITY_RELEASE' ? { declaredValue: Math.round(fsv / 0.78), forcedSaleValue: undefined, existingMortgageBalance: 0, existingMortgageStatus: 'NONE', ownership: 'SOLE', purpose: s.purpose || 'HOME_RENOVATION', useOfFunds: [{ item: 'Main use', amount: s.amount }] } : undefined,
      consent: { creditBureau: s.state !== 'DRAFT', identity: s.state !== 'DRAFT', dataProcessing: s.state !== 'DRAFT', regulatory: s.state !== 'DRAFT', informationSharing: s.state !== 'DRAFT', signedAt: s.state === 'DRAFT' ? undefined : new Date(created).toISOString(), signedBy: s.name },
      ownerName: 'Kwame Mensah',
      createdAt: new Date(created).toISOString(),
      submittedAt: s.state === 'DRAFT' ? undefined : new Date(created + 0.2 * DAY).toISOString(),
      updatedAt: new Date(entered).toISOString(),
      stageEnteredAt: new Date(entered).toISOString(),
      approvals: [],
      conditions: [],
      tasks: [],
      disbursements: [],
      postItems: [],
      locked: s.state !== 'DRAFT',
      declineReason: s.declineReason
    };
    c.sla = slaFor(s.state, new Date(entered));
    data.cases.push(c);

    log(c, s.name, 'Application created', PRODUCT(s.product) + ' selected; draft created', created);
    if (s.state === 'DRAFT') {
      return;
    }
    log(c, s.name, 'Form submitted', 'Consent signed electronically; locked', created + 0.2 * DAY);
    log(c, 'System', 'Workflow initiated', 'Pre-approval started', created + 0.2 * DAY);

    // documents
    const missing = s.missingDocs || [];
    requiredSpecs(c).forEach(function (spec) {
      if (missing.indexOf(spec.docType) >= 0) {
        return;
      }
      data.docs.push({
        id: nextId('DOC'),
        caseId: id,
        category: spec.category,
        docType: spec.docType,
        fileName: spec.docType.toLowerCase() + '-' + (1001 + idx) + '.pdf',
        sizeKb: 180 + ((s.n * 37) % 600),
        version: 1,
        uploadedBy: s.name,
        uploadedAt: new Date(created + 0.1 * DAY).toISOString(),
        classification: spec.category === 'IDENTITY' || spec.category === 'INCOME' ? 'RESTRICTED' : 'CONFIDENTIAL',
        libraryUrl: '/sites/mortgage/Case Documents/' + ref + '/' + spec.docType.toLowerCase() + '.pdf'
      });
    });

    // readiness at submission
    c.readiness = evaluateReadiness({
      product: s.product,
      employmentStatus: c.applicant.employmentStatus,
      dateEmployed: c.applicant.dateEmployed,
      dateOfBirth: c.applicant.dateOfBirth,
      retirementDate: c.applicant.retirementDate,
      financials: c.financials,
      amountRequested: s.amount,
      tenorYears: s.tenor,
      ratePct: c.ratePct,
      purchase: c.purchase,
      equity: c.equity,
      consent: c.consent,
      documentsPct: 100,
      bureau: s.state === 'PRE_APPROVAL' ? undefined : 'GOOD',
      hrVerified: s.state === 'PRE_APPROVAL' ? undefined : true,
      titleInApplicantName: s.product === 'EQUITY_RELEASE' ? true : undefined,
      now
    });

    const mkTask = function (title: string, team: Role, hours: number, status: Task['status'], slaCode?: string): Task {
      return { id: nextId('TSK'), caseId: id, title, ownerTeam: team, status, createdAt: new Date(entered).toISOString(), dueAt: new Date(entered + hours * 3600000).toISOString(), slaCode };
    };

    const idxState = ['PRE_APPROVAL', 'REFERRED', 'PRE_APPROVED', 'IN_ASSESSMENT', 'IN_APPROVAL', 'OFFER_ISSUED', 'CONDITIONS_PENDING', 'READY_TO_DISBURSE', 'DISBURSED', 'POST_DISBURSEMENT', 'CLOSED'].indexOf(s.state);
    const pastAssessment = idxState >= 4 && s.state !== 'DECLINED';

    if (s.state === 'PRE_APPROVAL') {
      c.tasks.push(mkTask('Verify employment and salary', 'HR', 4, 'OPEN', 'SLA-02'));
    }
    if (s.state === 'REFERRED') {
      c.tasks.push(mkTask('Credit review of referred application', 'CREDIT', 8, 'OPEN', 'SLA-04'));
    }
    if (s.state === 'PRE_APPROVED') {
      c.tasks.push(mkTask('Confirm to proceed', 'APPLICANT', 120, 'WAITING_APPLICANT', 'SLA-15'));
    }
    if (idxState >= 3 || s.state === 'DECLINED') {
      log(c, 'System', 'Pre-approval decided', 'Pre-approved; letter sent', created + 0.4 * DAY);
      log(c, s.name, 'Confirmed to proceed', 'Valuation and legal searches started', created + 1 * DAY);
    }

    // property and valuation
    if (idxState >= 3 || s.state === 'DECLINED') {
      const pid = 'PROP-' + (1001 + idx);
      const done = idxState >= 4 || s.state === 'DECLINED' ? 3 : s.searchesDone || 0;
      const types: Array<LegalSearch['type']> = ['LAND', 'CERTIFICATE', 'CONSOLIDATED'];
      const searches: LegalSearch[] = types.map(function (t, k) {
        const complete = k < done;
        const adverse = s.state === 'DECLINED' && t === 'LAND';
        return { id: nextId('SRC'), type: t, status: complete ? 'COMPLETED' : 'REQUESTED', result: complete ? (adverse ? 'ADVERSE' : 'CLEAR') : undefined, requestedAt: new Date(created + 1 * DAY).toISOString(), completedAt: complete ? new Date(created + 3 * DAY).toISOString() : undefined, notes: adverse ? 'Existing charge in favour of another party.' : undefined };
      });
      data.properties.push({
        id: pid,
        titleNumber: 'GA-' + (88000 + s.n * 13),
        address: s.address,
        digitalAddress: 'GA-' + (100 + s.n) + '-' + (4000 + s.n * 7),
        propertyType: s.product === 'HOME_PURCHASE' ? 'Detached house' : 'Owner-occupied house',
        description: '3-bedroom house, fenced, in an established neighbourhood.',
        ownershipType: s.tenure || 'FREEHOLD',
        registeredOwner: s.product === 'EQUITY_RELEASE' ? s.name : c.purchase ? c.purchase.vendorName : '',
        constructionStatus: 'COMPLETED',
        region: s.region,
        caseIds: [id],
        searches,
        encumbrance: s.state === 'DECLINED' ? 'EXISTING_CHARGE' : 'NONE'
      });
      c.propertyId = pid;

      const vstatus: ValuationRequest['status'] = idxState >= 4 || s.state === 'DECLINED' ? 'ACCEPTED' : s.valStatus || 'REQUESTED';
      const reportDone = vstatus === 'REPORT_RECEIVED' || vstatus === 'UNDER_REVIEW' || vstatus === 'ACCEPTED';
      const mv = s.product === 'HOME_PURCHASE' ? Math.round((c.purchase as NonNullable<typeof c.purchase>).propertyValue * 1.02) : Math.round(fsv / 0.78);
      const val: ValuationRequest = {
        id: 'VR-' + (1001 + idx),
        caseId: id,
        propertyId: pid,
        status: vstatus,
        valuerId: vstatus === 'REQUESTED' ? undefined : VALUERS[idx % 3].id,
        contactPerson: 'Property contact',
        contactNumber: '030 255 0' + (100 + s.n),
        requestedAt: new Date(created + 1 * DAY).toISOString(),
        assignedAt: vstatus === 'REQUESTED' ? undefined : new Date(created + 1.2 * DAY).toISOString(),
        dueAt: new Date(addBusinessDays(new Date(created + 1.2 * DAY), 5)).toISOString(),
        report: reportDone ? { marketValue: mv, forcedSaleValue: s.product === 'EQUITY_RELEASE' ? fsv : Math.round(mv * 0.78), valuationDate: new Date(created + 3 * DAY).toISOString().slice(0, 10), condition: 'Good', occupancy: s.product === 'EQUITY_RELEASE' ? 'Owner occupied' : 'Vacant', reviewedBy: vstatus === 'ACCEPTED' ? 'Collateral Officer' : undefined, reviewOutcome: vstatus === 'ACCEPTED' ? 'ACCEPTED' : undefined } : undefined
      };
      data.valuations.push(val);
      if (c.equity && val.report && (vstatus === 'ACCEPTED' || vstatus === 'UNDER_REVIEW')) {
        c.equity.forcedSaleValue = val.report.forcedSaleValue;
      }

      if (s.state === 'IN_ASSESSMENT') {
        c.tasks.push(mkTask('Review valuation report', 'COLLATERAL', 40, vstatus === 'UNDER_REVIEW' || vstatus === 'REPORT_RECEIVED' ? 'OPEN' : 'IN_PROGRESS', 'SLA-06'));
        c.tasks.push(mkTask('Legal searches', 'LEGAL', 40, 'IN_PROGRESS', 'SLA-07'));
        c.tasks.push(mkTask('Credit recommendation', 'CREDIT', 16, 'OPEN', 'SLA-09'));
        c.tasks.push(mkTask('Property acceptance decision', 'COLLATERAL', 16, 'OPEN', 'SLA-08'));
      }
      c.fitToLend = { caseId: id, checklist: newChecklist(idxState >= 4), decision: idxState >= 4 ? 'ACCEPT' : s.state === 'DECLINED' ? 'REJECT' : undefined, reason: s.state === 'DECLINED' ? 'Adverse land search' : undefined };
      if (idxState >= 7) {
        c.fitToLend.certificateNo = 'FTL-2026-' + (1001 + idx);
        c.fitToLend.issuedAt = new Date(entered - 3 * DAY).toISOString();
        c.fitToLend.validUntil = new Date(entered + 87 * DAY).toISOString().slice(0, 10);
      }
    }

    // approvals
    if (pastAssessment) {
      c.approvals = buildApprovals(s.amount, false, new Date(created + 6 * DAY));
      const decided = s.state === 'IN_APPROVAL' ? s.approvedLevels || 0 : c.approvals.length;
      c.approvals.forEach(function (a, k) {
        if (k < decided) {
          a.decision = 'APPROVE';
          a.decidedAt = new Date(created + 7 * DAY).toISOString();
          a.approverName = 'Approver ' + a.level;
          a.comment = 'Within policy.';
        }
      });
      if (s.state !== 'IN_APPROVAL') {
        c.approvedAmount = s.amount;
      }
      log(c, 'Credit Team', 'Credit recommendation', 'Recommended with conditions', created + 5 * DAY);
    }

    // offer and conditions
    if (idxState >= 5) {
      c.offer = { issuedAt: new Date(created + 9 * DAY).toISOString(), validUntil: new Date(created + 39 * DAY).toISOString(), acceptedAt: idxState >= 6 ? new Date(created + 11 * DAY).toISOString() : undefined };
      log(c, 'System', 'Offer issued', 'Offer and Truth in Lending generated', created + 9 * DAY);
      c.conditions = conditionTemplates(c).map(function (t, k): Condition {
        const verified = idxState >= 7 || (s.state === 'CONDITIONS_PENDING' && k < (s.condVerified || 0));
        return { id: nextId('CND'), caseId: id, code: t.code, title: t.title, mandatory: t.mandatory, ownerRole: t.ownerRole, verifierRole: t.verifierRole, dueDate: new Date(created + (9 + t.dueInDays) * DAY).toISOString().slice(0, 10), status: verified ? 'VERIFIED' : k === (s.condVerified || 0) && s.state === 'CONDITIONS_PENDING' ? 'EVIDENCE_SUBMITTED' : 'OPEN', verifiedBy: verified ? 'Credit Administrator' : undefined, verifiedAt: verified ? new Date(entered).toISOString() : undefined };
      });
    }

    // disbursement and post-disbursement
    if (idxState >= 8) {
      const paidAt = nowMs - (s.state === 'POST_DISBURSEMENT' ? 40 : s.state === 'CLOSED' ? 190 : 1) * DAY;
      c.accountNumber = '300000010' + (1001 + idx);
      c.disbursements.push({ id: nextId('DSB'), caseId: id, trancheNo: 1, payee: c.purchase ? c.purchase.vendorName : 'Applicant account', amount: s.amount, status: 'PAID', requestedBy: 'Credit Administrator', approvedBy: 'Head Credit Administration', paidAt: new Date(paidAt).toISOString(), paymentRef: 'PAY-' + (7000 + idx) });
      log(c, 'Operations', 'Funds released', 'Paid to ' + c.disbursements[0].payee, paidAt);
      POST_DISBURSEMENT_TEMPLATE.forEach(function (t, k) {
        const done = s.state === 'CLOSED' || (s.state === 'POST_DISBURSEMENT' && k < (s.postDone || 0));
        const overdue = s.overduePost && k === (s.postDone || 0);
        c.postItems.push({ id: nextId('PST'), caseId: id, type: t.type, owner: 'Post Disbursement Officer', dueDate: new Date(paidAt + (overdue ? 35 : t.days) * DAY).toISOString().slice(0, 10), status: done ? 'DONE' : 'OPEN', completedAt: done ? new Date(paidAt + t.days * 0.8 * DAY).toISOString() : undefined });
      });
    }
    if (s.state === 'DECLINED') {
      log(c, 'Collateral Team', 'Property rejected', s.declineReason || '', created + 4 * DAY);
    }

    // threads
    const topics: Array<Thread['topic']> = ['GENERAL', 'CREDIT', 'COLLATERAL', 'LEGAL', 'HR', 'OPERATIONS', 'INTERNAL'];
    topics.forEach(function (topic) {
      data.threads.push({ id: 'THR-' + (1001 + idx) + '-' + topic, caseId: id, topic, visibleToApplicant: topic !== 'INTERNAL', messages: [], oversightJoined: false });
    });
    if (s.n === 17) {
      const cred = data.threads.filter(function (t) { return t.caseId === id && t.topic === 'CREDIT'; })[0];
      cred.messages.push(
        { id: nextId('MSG'), threadId: cred.id, sender: 'Kwame Asare', senderRole: 'CREDIT', kind: 'REQUEST', body: 'Please confirm the source of the 3,200 other income shown on Form F.', sentAt: new Date(nowMs - 1 * DAY).toISOString(), attachments: [], dueDate: addBusinessDays(now, 3).toISOString(), closed: false }
      );
      const col = data.threads.filter(function (t) { return t.caseId === id && t.topic === 'COLLATERAL'; })[0];
      col.messages.push(
        { id: nextId('MSG'), threadId: col.id, sender: 'Esther Quartey', senderRole: 'COLLATERAL', kind: 'MESSAGE', body: 'The valuer will visit on Thursday. Please make sure someone can give access to the property.', sentAt: new Date(nowMs - 2 * DAY).toISOString(), attachments: [] },
        { id: nextId('MSG'), threadId: col.id, sender: s.name, senderRole: 'APPLICANT', kind: 'MESSAGE', body: 'The developer’s site agent will be there from 9am.', sentAt: new Date(nowMs - 2 * DAY + 3600000).toISOString(), attachments: [] }
      );
    }
    if (s.n === 18) {
      const gen = data.threads.filter(function (t) { return t.caseId === id && t.topic === 'GENERAL'; })[0];
      gen.messages.push({ id: nextId('MSG'), threadId: gen.id, sender: 'Kofi Boateng', senderRole: 'APPLICANT', kind: 'MESSAGE', body: 'Is there anything outstanding on my side?', sentAt: new Date(nowMs - 3 * DAY).toISOString(), attachments: [] },
        { id: nextId('MSG'), threadId: gen.id, sender: 'Kwame Mensah', senderRole: 'MORTGAGE_OFFICER', kind: 'MESSAGE', body: 'Nothing outstanding. Your case is with the approvers.', sentAt: new Date(nowMs - 3 * DAY + 1800000).toISOString(), attachments: [] });
    }
  });

  data.docRequests.push({ id: nextId('REQ'), caseId: 'CASE-1001', docType: 'INSURANCE', category: 'INSURANCE', requestedBy: 'Credit Administrator', dueDate: addBusinessDays(now, 5).toISOString().slice(0, 10) });

  data.notes.push(
    { id: nextId('NTF'), at: new Date(nowMs - 3600000).toISOString(), caseId: 'CASE-1001', title: 'Request from Credit', body: 'Please confirm the source of the other income.', severity: 'INFO', read: false },
    { id: nextId('NTF'), at: new Date(nowMs - 7200000).toISOString(), caseId: 'CASE-1007', title: 'Post-disbursement item overdue', body: 'Lands Commission registration is past due for MTG-2026-001007.', severity: 'ALERT', read: false }
  );
  return data;
}

function PRODUCT(p: ProductCode): string {
  return p === 'HOME_PURCHASE' ? 'Home Purchase' : 'Home Equity Release';
}

export const SPEC_COUNT = DOC_SPECS.length;

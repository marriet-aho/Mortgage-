/**
 * Pure business rules. No I/O, no React. Everything here is unit tested.
 * Values in POLICY are proposed defaults; in production they are read from the
 * Advance Flow configuration store (see docs/08-business-rules.md).
 */
import {
  ApprovalLevel,
  ApprovalStep,
  Condition,
  EquityDetails,
  Financials,
  MortgageCase,
  ProductCode,
  Property,
  ReadinessCheck,
  ReadinessResult,
  SlaClock,
  ValuationRequest,
  ConsentSet,
  EligibilityInput,
  EligibilityResult
} from './types';

export const POLICY = {
  minDownPaymentPct: 20,
  maxLtvPct: 80,
  maxFsvPct: 70,
  maxDsrPct: 50,
  comfortableDsrPct: 40,
  maxTenorYears: { HOME_PURCHASE: 20, EQUITY_RELEASE: 20 } as Record<ProductCode, number>,
  minAge: 18,
  preApprovalValidityDays: { HOME_PURCHASE: 90, EQUITY_RELEASE: 60 } as Record<ProductCode, number>,
  offerValidityDays: 30,
  /** Years of service below which employment stability is flagged. */
  minServiceYears: 2,
  /** Staff mortgage programme: 6% fixed (requirements sheets, 2026). */
  defaultRatePct: 6,
  searchFee: 4000,
  valuationFeeMin: 3500,
  valuationFeeMax: 10000,
  registrationFeePct: 1.85,
  tiers: [
    { tier: 'T1', max: 500000 },
    { tier: 'T2', max: 1500000 },
    { tier: 'T3', max: 3000000 },
    { tier: 'T4', max: Number.POSITIVE_INFINITY }
  ] as Array<{ tier: ApprovalTier; max: number }>
};

export type ApprovalTier = 'T1' | 'T2' | 'T3' | 'T4';

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

export const DAY_MS = 86400000;

export function yearsBetween(from: Date, to: Date): number {
  return (to.getTime() - from.getTime()) / (365.25 * DAY_MS);
}

/** Whole calendar years from `from` to `to`, in UTC. 2026-10-12 to 2031-10-12 is exactly 5. */
export function wholeYearsBetween(from: Date, to: Date): number {
  let y = to.getUTCFullYear() - from.getUTCFullYear();
  const m = to.getUTCMonth() - from.getUTCMonth();
  if (m < 0 || (m === 0 && to.getUTCDate() < from.getUTCDate())) {
    y--;
  }
  return y;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from.getTime());
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    if (w !== 0 && w !== 6) {
      left--;
    }
  }
  return d;
}

export function businessDaysBetween(from: Date, to: Date): number {
  let n = 0;
  const d = new Date(from.getTime());
  while (d.getTime() < to.getTime()) {
    d.setDate(d.getDate() + 1);
    const w = d.getDay();
    if (w !== 0 && w !== 6) {
      n++;
    }
  }
  return n;
}

/* ------------------------------------------------------------------ */
/* Money maths                                                         */
/* ------------------------------------------------------------------ */

/** Level monthly payment on a loan. A zero rate divides the principal evenly. */
export function instalment(principal: number, annualRatePct: number, years: number): number {
  const n = Math.round(years * 12);
  if (principal <= 0 || n <= 0) {
    return 0;
  }
  const r = annualRatePct / 100 / 12;
  if (r === 0) {
    return principal / n;
  }
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

/** Largest loan whose instalment is at most `payment`. Inverse of `instalment`. */
export function loanForInstalment(payment: number, annualRatePct: number, years: number): number {
  const n = Math.round(years * 12);
  if (payment <= 0 || n <= 0) {
    return 0;
  }
  const r = annualRatePct / 100 / 12;
  if (r === 0) {
    return payment * n;
  }
  return (payment * (1 - Math.pow(1 + r, -n))) / r;
}

export function grossIncome(f: Financials): number {
  return f.basicSalary + f.allowances + f.otherIncome;
}

export function netIncome(f: Financials): number {
  return Math.max(0, grossIncome(f) - f.deductions);
}

export function existingObligations(f: Financials): number {
  return f.existingLoanRepayments + f.otherCommitments;
}

export function dsrPct(f: Financials, proposedInstalment: number): number {
  const net = netIncome(f);
  return net > 0 ? ((existingObligations(f) + proposedInstalment) / net) * 100 : 100;
}

export function dtiPct(f: Financials, proposedInstalment: number): number {
  const gross = grossIncome(f);
  return gross > 0 ? ((existingObligations(f) + proposedInstalment) / gross) * 100 : 100;
}

export function maxInstalment(f: Financials): number {
  return Math.max(0, (POLICY.maxDsrPct / 100) * netIncome(f) - existingObligations(f));
}

export function netWorth(f: Financials): number {
  return f.assetsTotal - f.liabilitiesTotal;
}

/* ------------------------------------------------------------------ */
/* Product limits                                                      */
/* ------------------------------------------------------------------ */

/** Longest tenor allowed: the product cap, limited by the retirement date. */
export function maxTenorYears(product: ProductCode, retirementDate: string, now: Date): number {
  const toRetirement = wholeYearsBetween(now, new Date(retirementDate));
  return Math.max(0, Math.min(POLICY.maxTenorYears[product], toRetirement));
}

/** BR-03: release is capped at 70% of forced sale value less any existing mortgage. */
export function maxEquityRelease(fsv: number, existingMortgageBalance: number): number {
  return Math.max(0, round2((POLICY.maxFsvPct * fsv) / 100 - existingMortgageBalance));
}

export function minDownPayment(price: number): number {
  return (POLICY.minDownPaymentPct / 100) * price;
}

export function ltvPct(loan: number, value: number): number {
  return value > 0 ? (loan / value) * 100 : 0;
}

/* ------------------------------------------------------------------ */
/* Readiness engine                                                    */
/* ------------------------------------------------------------------ */

export interface ReadinessInput {
  product: ProductCode;
  employmentStatus: 'PERMANENT' | 'CONTRACT' | 'PROBATION';
  dateEmployed: string;
  dateOfBirth: string;
  retirementDate: string;
  financials: Financials;
  amountRequested: number;
  tenorYears: number;
  ratePct: number;
  purchase?: { purchasePrice: number; propertyValue: number; downPayment: number };
  equity?: Pick<EquityDetails, 'declaredValue' | 'forcedSaleValue' | 'existingMortgageBalance'>;
  consent: ConsentSet;
  /** 0 to 100: share of required documents accepted. */
  documentsPct: number;
  /** Undefined until the bureau result is back. */
  bureau?: 'GOOD' | 'FAIR' | 'POOR';
  /** Undefined until HR has verified. */
  hrVerified?: boolean;
  /** Equity release only. Undefined until the title search is back. */
  titleInApplicantName?: boolean;
  duplicateActive?: boolean;
  now?: Date;
}

const FACTOR: Record<ReadinessCheck['status'], number> = { PASS: 1, WARN: 0.6, PENDING: 0.5, FAIL: 0 };

export function consentComplete(c: ConsentSet): boolean {
  return c.creditBureau && c.identity && c.dataProcessing && c.regulatory;
}

/**
 * Scores how ready an application is and what the pre-approval decision would be.
 * Weights sum to 100. Hard stops always refer the case; the engine never declines.
 */
export function evaluateReadiness(input: ReadinessInput): ReadinessResult {
  const now = input.now || new Date();
  const f = input.financials;
  const checks: ReadinessCheck[] = [];
  const hardStops: string[] = [];
  const net = netIncome(f);

  const tenorCap = maxTenorYears(input.product, input.retirementDate, now);
  const tenor = Math.min(Math.max(input.tenorYears, 0), tenorCap || 0);
  const pay = instalment(input.amountRequested, input.ratePct, input.tenorYears);
  const dsr = dsrPct(f, pay);
  const maxPay = maxInstalment(f);
  const affordCap = loanForInstalment(maxPay, input.ratePct, tenor || input.tenorYears);

  /* 1 affordability */
  checks.push({
    id: 'affordability',
    label: 'Affordability',
    weight: 30,
    status: net <= 0 ? 'PENDING' : dsr <= POLICY.comfortableDsrPct ? 'PASS' : dsr <= POLICY.maxDsrPct ? 'WARN' : 'FAIL',
    detail: net <= 0 ? 'Enter income to assess.' : `Debt service ratio ${dsr.toFixed(0)}% against a ${POLICY.maxDsrPct}% limit.`,
    fix: dsr > POLICY.maxDsrPct ? 'Lower the amount, lengthen the tenor, or reduce existing commitments.' : undefined
  });

  /* 2 income stability */
  const service = yearsBetween(new Date(input.dateEmployed), now);
  checks.push({
    id: 'stability',
    label: 'Employment stability',
    weight: 10,
    status: input.employmentStatus === 'PERMANENT' && service >= POLICY.minServiceYears ? 'PASS' : 'WARN',
    detail: `${input.employmentStatus.toLowerCase()} · ${service.toFixed(1)} years of service`,
    fix: 'Contract, probation or short service goes to a Credit officer for review.'
  });

  /* 3 tenor against retirement */
  const age = yearsBetween(new Date(input.dateOfBirth), now);
  if (age < POLICY.minAge) {
    hardStops.push('Applicant is under 18.');
  }
  if (tenorCap <= 0) {
    hardStops.push('Retirement date leaves no room for a tenor.');
  }
  checks.push({
    id: 'tenor',
    label: 'Tenor within retirement date',
    weight: 5,
    status: input.tenorYears <= tenorCap && tenorCap > 0 ? 'PASS' : 'FAIL',
    detail: `Requested ${input.tenorYears} years, maximum ${tenorCap} years.`,
    fix: input.tenorYears > tenorCap ? `Reduce the tenor to ${tenorCap} years or less.` : undefined
  });

  /* 4 collateral and contribution */
  let eligibleByCollateral = Number.POSITIVE_INFINITY;
  if (input.product === 'HOME_PURCHASE' && input.purchase) {
    const p = input.purchase;
    const minDown = minDownPayment(p.purchasePrice);
    const lower = Math.min(p.purchasePrice, p.propertyValue || p.purchasePrice);
    eligibleByCollateral = Math.min(p.purchasePrice - p.downPayment, (POLICY.maxLtvPct / 100) * lower);
    const ok = p.downPayment >= minDown - 0.005 && input.amountRequested <= eligibleByCollateral + 0.005;
    checks.push({
      id: 'collateral',
      label: 'Down payment and loan to value',
      weight: 15,
      status: p.purchasePrice <= 0 ? 'PENDING' : ok ? 'PASS' : 'FAIL',
      detail: `Down payment ${p.purchasePrice ? ((p.downPayment / p.purchasePrice) * 100).toFixed(1) : '0'}% (minimum ${POLICY.minDownPaymentPct}%).`,
      fix: ok ? undefined : `Pay at least ${Math.round(minDown).toLocaleString('en-GB')} and keep the loan within ${POLICY.maxLtvPct}% of value.`
    });
  } else if (input.product === 'EQUITY_RELEASE' && input.equity) {
    const e = input.equity;
    if (e.forcedSaleValue && e.forcedSaleValue > 0) {
      eligibleByCollateral = maxEquityRelease(e.forcedSaleValue, e.existingMortgageBalance);
      const ok = input.amountRequested <= eligibleByCollateral + 0.005;
      checks.push({
        id: 'collateral',
        label: '70% of forced sale value',
        weight: 15,
        status: ok ? 'PASS' : 'FAIL',
        detail: `Maximum release ${Math.round(eligibleByCollateral).toLocaleString('en-GB')} (70% of FSV less existing mortgage).`,
        fix: ok ? undefined : 'Reduce the amount to the maximum release.'
      });
    } else {
      const indicative = maxEquityRelease(e.declaredValue * 0.8, e.existingMortgageBalance);
      eligibleByCollateral = indicative;
      checks.push({
        id: 'collateral',
        label: '70% of forced sale value',
        weight: 15,
        status: 'PENDING',
        detail: 'Forced sale value comes from the valuation. Indicative maximum is shown.',
        fix: 'Complete the valuation to confirm the maximum release.'
      });
    }
    if (input.titleInApplicantName === false) {
      hardStops.push('The property is not registered in the applicant’s name.');
    }
  } else {
    checks.push({ id: 'collateral', label: 'Collateral', weight: 15, status: 'PENDING', detail: 'Property details not entered yet.' });
  }

  /* 5 consent (BR-05) */
  const consented = consentComplete(input.consent);
  if (!consented) {
    hardStops.push('Consent is incomplete, so the credit bureau cannot be queried.');
  }
  checks.push({
    id: 'consent',
    label: 'Consent signed',
    weight: 10,
    status: consented ? 'PASS' : 'FAIL',
    detail: consented ? 'Required consents recorded.' : 'Bureau, identity, data processing and regulatory consents are required.',
    fix: consented ? undefined : 'Sign the consent form.',
    hardStop: !consented
  });

  /* 6 documents */
  checks.push({
    id: 'documents',
    label: 'Documents',
    weight: 10,
    status: input.documentsPct >= 100 ? 'PASS' : input.documentsPct >= 60 ? 'WARN' : input.documentsPct > 0 ? 'FAIL' : 'PENDING',
    detail: `${Math.round(input.documentsPct)}% of required documents accepted.`,
    fix: input.documentsPct < 100 ? 'Upload the outstanding required documents.' : undefined
  });

  /* 7 credit bureau */
  checks.push({
    id: 'bureau',
    label: 'Credit bureau',
    weight: 10,
    status: input.bureau === undefined ? 'PENDING' : input.bureau === 'GOOD' ? 'PASS' : input.bureau === 'FAIR' ? 'WARN' : 'FAIL',
    detail: input.bureau === undefined ? 'Runs automatically after consent.' : `Bureau result: ${input.bureau.toLowerCase()}.`
  });

  /* 8 HR verification */
  if (input.hrVerified === false) {
    hardStops.push('HR could not verify employment.');
  }
  checks.push({
    id: 'hr',
    label: 'HR verification',
    weight: 10,
    status: input.hrVerified === undefined ? 'PENDING' : input.hrVerified ? 'PASS' : 'FAIL',
    detail: input.hrVerified === undefined ? 'HR confirms employment and salary.' : input.hrVerified ? 'Employment and salary confirmed.' : 'Not verified.',
    hardStop: input.hrVerified === false
  });

  if (input.duplicateActive) {
    hardStops.push('An active application already exists for this product (BR-01).');
  }

  let score = 0;
  for (const c of checks) {
    score += c.weight * FACTOR[c.status];
  }
  score = Math.round(score);

  const anyFail = checks.some(function (c) { return c.status === 'FAIL'; });
  const decision: ReadinessResult['decision'] =
    hardStops.length > 0 || score < 55 ? 'NOT_ELIGIBLE_AS_SUBMITTED' : score >= 75 && !anyFail ? 'PRE_APPROVED' : 'REFERRED';
  const band: ReadinessResult['band'] = decision === 'PRE_APPROVED' ? 'READY' : decision === 'REFERRED' ? 'ALMOST' : 'NOT_READY';

  const capacity = Math.min(eligibleByCollateral, affordCap);
  const eligibleAmount = Math.max(0, Math.min(input.amountRequested, capacity));

  const nextActions: string[] = [];
  for (const h of hardStops) {
    nextActions.push(h);
  }
  for (const c of checks) {
    if ((c.status === 'FAIL' || c.status === 'WARN') && c.fix) {
      nextActions.push(c.fix);
    }
  }

  return {
    score,
    band,
    decision,
    checks,
    hardStops,
    eligibleAmount,
    maxInstalment: maxPay,
    instalment: pay,
    dsrPct: dsr,
    netIncome: net,
    nextActions
  };
}

/* ------------------------------------------------------------------ */
/* Approval matrix                                                     */
/* ------------------------------------------------------------------ */

export const LEVEL_LABEL: Record<ApprovalLevel, string> = {
  L1: 'HR Approval',
  L2: 'Director HR',
  L3: 'DMD',
  L4: 'Head of Mortgage',
  L5: 'Credit Administration',
  L6: 'Head Personal Banking',
  L7: 'Head Credit Evaluation',
  L8: 'Executive'
};

export function tierFor(amount: number): ApprovalTier {
  for (const t of POLICY.tiers) {
    if (amount <= t.max) {
      return t.tier;
    }
  }
  return 'T4';
}

/** Approval levels per tier, grouped so levels in the same group run in parallel. */
export function approvalPlan(amount: number, hasPolicyException: boolean): Array<{ level: ApprovalLevel; group: number }> {
  const tier = tierFor(amount);
  const plan: Array<{ level: ApprovalLevel; group: number }> = [];
  const add = function (level: ApprovalLevel, group: number): void {
    plan.push({ level, group });
  };
  add('L1', 1);
  if (tier !== 'T1') {
    add('L2', 1);
  }
  if (tier === 'T3' || tier === 'T4') {
    add('L3', 1);
  }
  add('L4', 1);
  add('L5', 2);
  if (tier !== 'T1') {
    add('L6', 3);
  }
  add('L7', 3);
  if (tier === 'T4' || hasPolicyException) {
    add('L8', 4);
  }
  return plan;
}

export function buildApprovals(amount: number, hasPolicyException: boolean, now: Date): ApprovalStep[] {
  return approvalPlan(amount, hasPolicyException).map(function (p) {
    return {
      level: p.level,
      group: p.group,
      assignedAt: p.group === 1 ? now.toISOString() : undefined,
      dueAt: p.group === 1 ? addBusinessDays(now, 1).toISOString() : undefined
    };
  });
}

/** True once every step in every group up to and including `group` is approved. */
export function approvalsComplete(steps: ApprovalStep[]): boolean {
  return steps.length > 0 && steps.every(function (s) {
    return s.decision === 'APPROVE' || s.decision === 'APPROVE_WITH_CONDITIONS';
  });
}

/** The group currently awaiting decisions, or 0 when finished or blocked. */
export function activeApprovalGroup(steps: ApprovalStep[]): number {
  const groups = Array.from(new Set(steps.map(function (s) { return s.group; }))).sort();
  for (const g of groups) {
    const open = steps.filter(function (s) { return s.group === g && !s.decision; });
    if (open.length > 0) {
      return g;
    }
  }
  return 0;
}

/* ------------------------------------------------------------------ */
/* SLA                                                                 */
/* ------------------------------------------------------------------ */

export type SlaStatus = 'ON_TRACK' | 'WARNING' | 'BREACHED';

export function slaState(clock: SlaClock, now: Date): { status: SlaStatus; pct: number; remainingMs: number } {
  const start = new Date(clock.startedAt).getTime();
  const due = new Date(clock.dueAt).getTime() + clock.pausedMinutes * 60000;
  const at = clock.pausedSince ? new Date(clock.pausedSince).getTime() : now.getTime();
  const total = Math.max(1, due - start);
  const pct = ((at - start) / total) * 100;
  return { status: pct >= 100 ? 'BREACHED' : pct >= 75 ? 'WARNING' : 'ON_TRACK', pct, remainingMs: due - at };
}

/** Escalation level for a task past its due date: 0 none, 1 supervisor, 2 unit head. */
export function escalationLevel(dueAt: string, now: Date, slaHours: number): 0 | 1 | 2 {
  const over = now.getTime() - new Date(dueAt).getTime();
  if (over <= 0) {
    return 0;
  }
  return over >= 0.5 * slaHours * 3600000 ? 2 : 1;
}

/* ------------------------------------------------------------------ */
/* Gates                                                               */
/* ------------------------------------------------------------------ */

/** BR-07: fit-to-lend needs accepted valuation, clear searches and property acceptance. */
export function fitToLendBlockers(c: MortgageCase, prop: Property | undefined, valuation: ValuationRequest | undefined): string[] {
  const out: string[] = [];
  if (!valuation || valuation.status !== 'ACCEPTED') {
    out.push('Valuation report has not been accepted.');
  }
  if (!prop) {
    out.push('No property is linked to the case.');
  } else {
    const types: Array<'LAND' | 'CERTIFICATE' | 'CONSOLIDATED'> = ['LAND', 'CERTIFICATE', 'CONSOLIDATED'];
    for (const t of types) {
      const s = prop.searches.filter(function (x) { return x.type === t; })[0];
      if (!s || s.status !== 'COMPLETED') {
        out.push(`${t.charAt(0) + t.slice(1).toLowerCase()} search is not complete.`);
      } else if (s.result === 'ADVERSE') {
        out.push(`${t.charAt(0) + t.slice(1).toLowerCase()} search is adverse.`);
      }
    }
  }
  const f = c.fitToLend;
  if (!f || !f.decision || f.decision === 'REJECT') {
    out.push('Property has not been accepted by Collateral.');
  }
  if (f && f.checklist.some(function (x) { return !x.done; })) {
    out.push('Collateral checklist is incomplete.');
  }
  if (c.product === 'EQUITY_RELEASE' && c.equity) {
    if (!c.equity.forcedSaleValue) {
      out.push('Forced sale value is missing.');
    } else if (c.amountRequested > maxEquityRelease(c.equity.forcedSaleValue, c.equity.existingMortgageBalance) + 0.005) {
      out.push('Amount exceeds 70% of forced sale value less existing mortgage.');
    }
  }
  return out;
}

export function conditionsOpen(conds: Condition[]): Condition[] {
  return conds.filter(function (x) {
    return x.mandatory && x.status !== 'VERIFIED' && x.status !== 'WAIVED';
  });
}

/** BR-10: nothing is disbursed while any mandatory condition is open. */
export function disbursementBlockers(c: MortgageCase, now: Date): string[] {
  const out: string[] = [];
  if (!c.offer || !c.offer.acceptedAt) {
    out.push('Offer has not been accepted.');
  }
  for (const x of conditionsOpen(c.conditions)) {
    out.push(`Condition open: ${x.title}`);
  }
  if (!c.fitToLend || !c.fitToLend.certificateNo) {
    out.push('Fit-to-lend certificate has not been issued.');
  } else if (c.fitToLend.validUntil && new Date(c.fitToLend.validUntil).getTime() < now.getTime()) {
    out.push('Fit-to-lend certificate has expired.');
  }
  return out;
}

export function disbursedTotal(c: MortgageCase): number {
  return c.disbursements.filter(function (d) { return d.status === 'PAID' || d.status === 'APPROVED' || d.status === 'PENDING_APPROVAL'; })
    .reduce(function (s, d) { return s + d.amount; }, 0);
}

export function remainingToDisburse(c: MortgageCase): number {
  return Math.max(0, (c.approvedAmount || c.amountRequested) - disbursedTotal(c));
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export interface ConditionTemplate {
  code: string;
  title: string;
  mandatory: boolean;
  ownerRole: Condition['ownerRole'];
  verifierRole: Condition['verifierRole'];
  dueInDays: number;
}

/** Conditions precedent for a case, from product, marital status and existing charges. */
export function conditionTemplates(c: Pick<MortgageCase, 'product' | 'applicant' | 'equity' | 'purchase'>): ConditionTemplate[] {
  const list: ConditionTemplate[] = [];
  if (c.product === 'HOME_PURCHASE') {
    list.push({ code: 'DOWN_PAYMENT', title: 'Down payment proof', mandatory: true, ownerRole: 'APPLICANT', verifierRole: 'CREDIT_ADMIN', dueInDays: 21 });
    if (c.purchase && c.purchase.vendorType === 'PRIVATE') {
      list.push({ code: 'VENDOR_CLEARED', title: 'Vendor due diligence cleared', mandatory: true, ownerRole: 'LEGAL', verifierRole: 'CREDIT', dueInDays: 14 });
    }
  }
  if (c.applicant.maritalStatus === 'MARRIED') {
    list.push({ code: 'SPOUSAL_CONSENT', title: 'Spousal consent', mandatory: true, ownerRole: 'APPLICANT', verifierRole: 'LEGAL', dueInDays: 21 });
  }
  list.push({ code: 'LEGAL_ADVICE', title: 'Independent legal advice', mandatory: true, ownerRole: 'APPLICANT', verifierRole: 'LEGAL', dueInDays: 21 });
  list.push({ code: 'STAT_DECLARATION', title: 'Statutory declaration', mandatory: true, ownerRole: 'APPLICANT', verifierRole: 'LEGAL', dueInDays: 21 });
  list.push({ code: 'INSURANCE', title: 'Insurance policies', mandatory: true, ownerRole: 'APPLICANT', verifierRole: 'CREDIT_ADMIN', dueInDays: 28 });
  list.push({ code: 'REG_FEES', title: 'Registration fees', mandatory: true, ownerRole: 'APPLICANT', verifierRole: 'COLLATERAL', dueInDays: 28 });
  list.push({ code: 'INSPECTION', title: 'Property inspection', mandatory: true, ownerRole: 'COLLATERAL', verifierRole: 'COLLATERAL', dueInDays: 21 });
  list.push({ code: 'MORTGAGE_DOCS', title: 'Mortgage documentation signed', mandatory: true, ownerRole: 'APPLICANT', verifierRole: 'LEGAL', dueInDays: 28 });
  if (c.product === 'EQUITY_RELEASE' && c.equity && c.equity.existingMortgageStatus === 'OTHER_LENDER') {
    list.push({ code: 'LENDER_CONSENT', title: 'Existing lender consent to second charge', mandatory: true, ownerRole: 'APPLICANT', verifierRole: 'LEGAL', dueInDays: 28 });
  }
  return list;
}

export const POST_DISBURSEMENT_TEMPLATE: Array<{ type: 'MORTGAGE_REGISTRATION' | 'SECURITY_PERFECTION' | 'LANDS_COMMISSION' | 'TITLE_PERFECTION' | 'SAFE_CUSTODY'; days: number }> = [
  { type: 'MORTGAGE_REGISTRATION', days: 30 },
  { type: 'SECURITY_PERFECTION', days: 60 },
  { type: 'LANDS_COMMISSION', days: 90 },
  { type: 'TITLE_PERFECTION', days: 120 },
  { type: 'SAFE_CUSTODY', days: 130 }
];

export function equityPayeeRule(purpose: EquityDetails['purpose']): { payee: string; staged: boolean } {
  switch (purpose) {
    case 'TUITION':
      return { payee: 'Institution (direct payment)', staged: false };
    case 'MEDICAL':
      return { payee: 'Hospital or provider (direct payment)', staged: false };
    case 'HOME_IMPROVEMENT_RENOVATION':
      return { payee: 'Contractor (stage payments)', staged: true };
    default:
      return { payee: 'Applicant account', staged: false };
  }
}

/* ------------------------------------------------------------------ */
/* Loan eligibility (mirrors the Staff Loan "Compute Eligibility" step) */
/* ------------------------------------------------------------------ */

export interface EligibilityPolicy {
  interestRatePct: number;
  dirLimitPct: number;
  maxTenorMonths: number;
  retirementAge: number;
}

/**
 * Local implementation used by the harness and by the live preview in the wizard.
 * In production the Advance Flow eligibility service is the source of truth: the module calls it
 * (see HttpAdvanceFlowClient.computeEligibility) and shows its numbers, so there is one set of policy.
 * Assumed definitions, to confirm against the service:
 *   income  = net salary + allowances
 *   DIR (Capital + Personal) = (new instalment + mortgage/HP instalments) / income
 *   DIR (All Staff Loans)    = (new instalment + mortgage/HP + personal/auto/education) / income,
 *                              with personal/auto/education removed when existing loans are paid off.
 */
export function computeEligibility(i: EligibilityInput, policy: EligibilityPolicy, now: Date): EligibilityResult {
  const income = i.netSalary + i.allowances;
  const retire = new Date(i.dateOfBirth);
  retire.setUTCFullYear(retire.getUTCFullYear() + policy.retirementAge);
  const monthsToRetire = Math.max(0, (retire.getUTCFullYear() - now.getUTCFullYear()) * 12 + (retire.getUTCMonth() - now.getUTCMonth()));
  const tenorMonths = i.dateOfBirth ? Math.min(policy.maxTenorMonths, monthsToRetire, i.tenorMonths || policy.maxTenorMonths) : 0;
  const periodic = instalment(i.loanAmount, policy.interestRatePct, tenorMonths / 12);
  const personal = i.payOffExistingLoans ? 0 : i.instalmentPersonal;
  const dirCap = income > 0 ? ((periodic + i.instalmentMortgageHp) / income) * 100 : 0;
  const dirAll = income > 0 ? ((periodic + i.instalmentMortgageHp + personal) / income) * 100 : 0;
  const room = Math.max(0, (policy.dirLimitPct / 100) * income - i.instalmentMortgageHp - personal);
  const qualified = Math.floor(loanForInstalment(room, policy.interestRatePct, tenorMonths / 12));
  let rule: EligibilityResult['decisionRule'] = 'ELIGIBLE';
  let text = 'Within the DIR limit and the qualifying amount.';
  if (tenorMonths <= 0 || income <= 0 || i.loanAmount <= 0) {
    rule = 'NOT_ELIGIBLE';
    text = 'Enter the figures above to compute eligibility.';
  } else if (dirAll > policy.dirLimitPct + 1e-9) {
    rule = 'EXCEEDS_DIR_LIMIT';
    text = 'DIR ' + dirAll.toFixed(1) + '% is above the ' + policy.dirLimitPct + '% limit.';
  } else if (i.loanAmount > qualified) {
    rule = 'EXCEEDS_QUALIFIED_AMOUNT';
    text = 'The amount is above what you qualify for.';
  }
  return {
    interestRatePct: policy.interestRatePct,
    dirLimitPct: policy.dirLimitPct,
    tenorMonths,
    periodicInstalment: periodic,
    dirCapitalPersonalPct: dirCap,
    dirAllStaffLoansPct: dirAll,
    loanAmountQualifiedFor: qualified,
    decisionRule: rule,
    decisionText: text,
    exceptionalApprovalAllowed: rule === 'EXCEEDS_DIR_LIMIT' || rule === 'EXCEEDS_QUALIFIED_AMOUNT',
    computedAt: now.toISOString()
  };
}

/* ------------------------------------------------------------------ */
/* Fees expected (requirements sheets)                                  */
/* ------------------------------------------------------------------ */

export interface FeeLine { label: string; min: number; max: number; note?: string }

/** The five fees printed on both requirements sheets. Insurance premiums are quoted by the insurer. */
export function estimateFees(product: ProductCode, propertyValue: number): FeeLine[] {
  const reg = round2((POLICY.registrationFeePct / 100) * Math.max(0, propertyValue));
  return [
    { label: 'Estimated Search Fees', min: POLICY.searchFee, max: POLICY.searchFee, note: product === 'EQUITY_RELEASE' ? 'Where applicable' : undefined },
    { label: 'Estimated Valuation Report fees', min: POLICY.valuationFeeMin, max: POLICY.valuationFeeMax, note: 'Ranges from Ghs 3,500 to 10,000' },
    { label: 'Estimated Mortgage Registration fee', min: reg, max: reg, note: POLICY.registrationFeePct + '% x Property value' },
    { label: 'Mortgage Life Insurance Policy', min: 0, max: 0, note: 'Premium quoted by the insurer' },
    { label: 'Mortgage Home Protection policy', min: 0, max: 0, note: 'Premium quoted by the insurer' }
  ];
}

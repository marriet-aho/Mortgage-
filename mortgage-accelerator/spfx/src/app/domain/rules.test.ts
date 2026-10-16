import { describe, expect, it } from 'vitest';
import {
  activeApprovalGroup,
  addBusinessDays,
  approvalPlan,
  approvalsComplete,
  buildApprovals,
  computeEligibility,
  conditionTemplates,
  disbursementBlockers,
  dsrPct,
  equityPayeeRule,
  escalationLevel,
  evaluateReadiness,
  instalment,
  loanForInstalment,
  maxEquityRelease,
  maxInstalment,
  maxTenorYears,
  netIncome,
  ReadinessInput,
  slaState,
  tierFor
} from './rules';
import { Financials, MortgageCase } from './types';

const NOW = new Date('2026-10-12T09:00:00Z'); // a Monday

const fin: Financials = {
  basicSalary: 20000,
  allowances: 3000,
  otherIncome: 0,
  deductions: 5000,
  existingLoanRepayments: 900,
  otherCommitments: 2500,
  assetsTotal: 300000,
  liabilitiesTotal: 40000
};

const consent = { creditBureau: true, identity: true, dataProcessing: true, regulatory: true, informationSharing: true };

function purchaseInput(over: Partial<ReadinessInput> = {}): ReadinessInput {
  return {
    product: 'HOME_PURCHASE',
    employmentStatus: 'PERMANENT',
    dateEmployed: '2015-01-05',
    dateOfBirth: '1988-03-14',
    retirementDate: '2048-03-14',
    financials: fin,
    amountRequested: 200000,
    tenorYears: 20,
    ratePct: 18,
    purchase: { purchasePrice: 400000, propertyValue: 400000, downPayment: 100000 },
    consent,
    documentsPct: 100,
    bureau: 'GOOD',
    hrVerified: true,
    now: NOW,
    ...over
  };
}

describe('money maths', () => {
  it('instalment and loanForInstalment are inverses', () => {
    const p = instalment(500000, 18, 20);
    expect(Math.round(loanForInstalment(p, 18, 20))).toBe(500000);
  });
  it('zero rate divides evenly', () => {
    expect(instalment(120000, 0, 10)).toBe(1000);
    expect(loanForInstalment(1000, 0, 10)).toBe(120000);
  });
  it('returns zero for no principal or tenor', () => {
    expect(instalment(0, 18, 10)).toBe(0);
    expect(instalment(1000, 18, 0)).toBe(0);
  });
  it('net income subtracts deductions and never goes negative', () => {
    expect(netIncome(fin)).toBe(18000);
    expect(netIncome({ ...fin, deductions: 99999 })).toBe(0);
  });
  it('dsr counts existing obligations and the new instalment', () => {
    expect(dsrPct(fin, 3000)).toBeCloseTo(((900 + 2500 + 3000) / 18000) * 100, 5);
  });
  it('max instalment is the dsr cap less obligations', () => {
    expect(maxInstalment(fin)).toBeCloseTo(0.5 * 18000 - 3400, 5);
  });
});

describe('product limits', () => {
  it('equity release is 70% of FSV less existing mortgage (BR-03)', () => {
    expect(maxEquityRelease(700000, 150000)).toBe(340000);
    expect(maxEquityRelease(100000, 90000)).toBe(0);
  });
  it('tenor is capped by product and by retirement date (BR-02)', () => {
    expect(maxTenorYears('HOME_PURCHASE', '2060-01-01', NOW)).toBe(30);
    expect(maxTenorYears('EQUITY_RELEASE', '2060-01-01', NOW)).toBe(20);
    expect(maxTenorYears('HOME_PURCHASE', '2031-10-12', NOW)).toBe(5);
    expect(maxTenorYears('HOME_PURCHASE', '2025-01-01', NOW)).toBe(0);
  });
});

describe('readiness engine', () => {
  it('pre-approves a strong, complete purchase', () => {
    const r = evaluateReadiness(purchaseInput());
    expect(r.decision).toBe('PRE_APPROVED');
    expect(r.band).toBe('READY');
    expect(r.score).toBeGreaterThanOrEqual(75);
    expect(r.hardStops).toHaveLength(0);
    expect(r.eligibleAmount).toBe(200000);
  });

  it('blocks when consent is missing (BR-05)', () => {
    const r = evaluateReadiness(purchaseInput({ consent: { ...consent, creditBureau: false } }));
    expect(r.decision).toBe('NOT_ELIGIBLE_AS_SUBMITTED');
    expect(r.hardStops.join(' ')).toMatch(/Consent/);
  });

  it('refers rather than declines when the down payment is short', () => {
    const r = evaluateReadiness(purchaseInput({ purchase: { purchasePrice: 400000, propertyValue: 400000, downPayment: 20000 }, amountRequested: 200000 }));
    expect(r.checks.filter((c) => c.id === 'collateral')[0].status).toBe('FAIL');
    expect(r.decision).not.toBe('PRE_APPROVED');
  });

  it('flags a tenor beyond retirement', () => {
    const r = evaluateReadiness(purchaseInput({ retirementDate: '2031-10-12', tenorYears: 20 }));
    expect(r.checks.filter((c) => c.id === 'tenor')[0].status).toBe('FAIL');
    expect(r.nextActions.join(' ')).toMatch(/Reduce the tenor to 5 years/);
  });

  it('hard-stops a duplicate active application (BR-01) and failed HR verification', () => {
    expect(evaluateReadiness(purchaseInput({ duplicateActive: true })).hardStops.length).toBe(1);
    expect(evaluateReadiness(purchaseInput({ hrVerified: false })).decision).toBe('NOT_ELIGIBLE_AS_SUBMITTED');
  });

  it('never returns a decline decision', () => {
    const worst = evaluateReadiness(
      purchaseInput({ bureau: 'POOR', hrVerified: false, documentsPct: 0, consent: { ...consent, regulatory: false }, amountRequested: 900000 })
    );
    expect(['PRE_APPROVED', 'REFERRED', 'NOT_ELIGIBLE_AS_SUBMITTED']).toContain(worst.decision);
    expect(worst.decision).toBe('NOT_ELIGIBLE_AS_SUBMITTED');
  });

  it('caps equity release at 70% of FSV once a valuation exists', () => {
    const r = evaluateReadiness({
      ...purchaseInput(),
      product: 'EQUITY_RELEASE',
      purchase: undefined,
      amountRequested: 400000,
      tenorYears: 10,
      equity: { declaredValue: 900000, forcedSaleValue: 700000, existingMortgageBalance: 150000 },
      titleInApplicantName: true
    });
    expect(r.checks.filter((c) => c.id === 'collateral')[0].status).toBe('FAIL');
    expect(r.eligibleAmount).toBeLessThanOrEqual(340000);
  });

  it('treats equity release without FSV as indicative and requires ownership', () => {
    const base = {
      ...purchaseInput(),
      product: 'EQUITY_RELEASE' as const,
      purchase: undefined,
      amountRequested: 200000,
      tenorYears: 10,
      equity: { declaredValue: 900000, existingMortgageBalance: 0 }
    };
    expect(evaluateReadiness(base).checks.filter((c) => c.id === 'collateral')[0].status).toBe('PENDING');
    expect(evaluateReadiness({ ...base, titleInApplicantName: false }).hardStops.join(' ')).toMatch(/registered/);
  });
});

describe('approval matrix', () => {
  it('maps amounts to tiers', () => {
    expect(tierFor(500000)).toBe('T1');
    expect(tierFor(500001)).toBe('T2');
    expect(tierFor(3000000)).toBe('T3');
    expect(tierFor(3000001)).toBe('T4');
  });
  it('T1 needs L1, L4, L5, L7', () => {
    expect(approvalPlan(400000, false).map((p) => p.level)).toEqual(['L1', 'L4', 'L5', 'L7']);
  });
  it('T3 adds Director HR, DMD and Personal Banking', () => {
    expect(approvalPlan(2000000, false).map((p) => p.level)).toEqual(['L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7']);
  });
  it('a policy exception adds the executive level', () => {
    expect(approvalPlan(400000, true).map((p) => p.level)).toContain('L8');
  });
  it('runs groups in order and completes when all decide', () => {
    const steps = buildApprovals(400000, false, NOW);
    expect(activeApprovalGroup(steps)).toBe(1);
    steps.filter((s) => s.group === 1).forEach((s) => (s.decision = 'APPROVE'));
    expect(activeApprovalGroup(steps)).toBe(2);
    expect(approvalsComplete(steps)).toBe(false);
    steps.forEach((s) => (s.decision = 'APPROVE'));
    expect(approvalsComplete(steps)).toBe(true);
    expect(activeApprovalGroup(steps)).toBe(0);
  });
});

describe('sla', () => {
  it('skips weekends when adding business days', () => {
    expect(addBusinessDays(new Date('2026-10-16T09:00:00Z'), 1).getDay()).toBe(1); // Friday -> Monday
  });
  it('reports on track, warning, breached', () => {
    const clock = { code: 'SLA-10', label: 'x', startedAt: '2026-10-12T00:00:00Z', dueAt: '2026-10-13T00:00:00Z', pausedMinutes: 0 };
    expect(slaState(clock, new Date('2026-10-12T06:00:00Z')).status).toBe('ON_TRACK');
    expect(slaState(clock, new Date('2026-10-12T20:00:00Z')).status).toBe('WARNING');
    expect(slaState(clock, new Date('2026-10-13T01:00:00Z')).status).toBe('BREACHED');
  });
  it('a paused clock does not advance', () => {
    const clock = { code: 'x', label: 'x', startedAt: '2026-10-12T00:00:00Z', dueAt: '2026-10-13T00:00:00Z', pausedMinutes: 0, pausedSince: '2026-10-12T06:00:00Z' };
    expect(slaState(clock, new Date('2026-10-20T00:00:00Z')).status).toBe('ON_TRACK');
  });
  it('escalates by lateness', () => {
    expect(escalationLevel('2026-10-12T10:00:00Z', new Date('2026-10-12T09:00:00Z'), 8)).toBe(0);
    expect(escalationLevel('2026-10-12T10:00:00Z', new Date('2026-10-12T11:00:00Z'), 8)).toBe(1);
    expect(escalationLevel('2026-10-12T10:00:00Z', new Date('2026-10-12T15:00:00Z'), 8)).toBe(2);
  });
});

describe('conditions and disbursement gate', () => {
  const baseCase = {
    product: 'HOME_PURCHASE',
    applicant: { maritalStatus: 'MARRIED' },
    purchase: { vendorType: 'PRIVATE' }
  } as unknown as Pick<MortgageCase, 'product' | 'applicant' | 'equity' | 'purchase'>;

  it('adds spousal consent and vendor clearance when they apply', () => {
    const codes = conditionTemplates(baseCase).map((c) => c.code);
    expect(codes).toContain('SPOUSAL_CONSENT');
    expect(codes).toContain('VENDOR_CLEARED');
    expect(codes).toContain('DOWN_PAYMENT');
  });

  it('adds existing lender consent for equity release with another lender', () => {
    const codes = conditionTemplates({
      product: 'EQUITY_RELEASE',
      applicant: { maritalStatus: 'SINGLE' } as MortgageCase['applicant'],
      equity: { existingMortgageStatus: 'OTHER_LENDER' } as MortgageCase['equity']
    }).map((c) => c.code);
    expect(codes).toContain('LENDER_CONSENT');
    expect(codes).not.toContain('SPOUSAL_CONSENT');
    expect(codes).not.toContain('DOWN_PAYMENT');
  });

  it('blocks disbursement while mandatory conditions are open (BR-10)', () => {
    const c = {
      offer: { issuedAt: '', validUntil: '', acceptedAt: '2026-10-01T00:00:00Z' },
      conditions: [
        { title: 'Insurance', mandatory: true, status: 'OPEN' },
        { title: 'Optional', mandatory: false, status: 'OPEN' },
        { title: 'Legal advice', mandatory: true, status: 'WAIVED' }
      ],
      fitToLend: { certificateNo: 'FTL-1', validUntil: '2027-01-01' }
    } as unknown as MortgageCase;
    const b = disbursementBlockers(c, NOW);
    expect(b).toEqual(['Condition open: Insurance']);
  });

  it('flags an expired fit-to-lend certificate', () => {
    const c = {
      offer: { issuedAt: '', validUntil: '', acceptedAt: 'x' },
      conditions: [],
      fitToLend: { certificateNo: 'FTL-1', validUntil: '2026-01-01' }
    } as unknown as MortgageCase;
    expect(disbursementBlockers(c, NOW)[0]).toMatch(/expired/);
  });
});

describe('equity payee rules', () => {
  it('pays tuition and medical direct, renovation in stages', () => {
    expect(equityPayeeRule('TUITION').staged).toBe(false);
    expect(equityPayeeRule('MEDICAL').payee).toMatch(/direct/);
    expect(equityPayeeRule('HOME_RENOVATION').staged).toBe(true);
  });
});

describe('loan eligibility (Staff Loan step)', () => {
  const policy = { interestRatePct: 18, dirLimitPct: 50, maxTenorMonths: 360, retirementAge: 60 };
  const base = { loanType: 'HOME_PURCHASE' as const, accountNumber: '1234567890123', dateOfBirth: '1988-03-14', netSalary: 30000, allowances: 5000, loanAmount: 300000, instalmentPersonal: 1500, instalmentMortgageHp: 0, payOffExistingLoans: false };

  it('is eligible when DIR is within the limit and the amount is qualified', () => {
    const r = computeEligibility(base, policy, NOW);
    expect(r.decisionRule).toBe('ELIGIBLE');
    expect(r.dirAllStaffLoansPct).toBeLessThanOrEqual(50);
    expect(r.tenorMonths).toBe(257); // 60th birthday is in March 2048
    expect(r.exceptionalApprovalAllowed).toBe(false);
  });
  it('limits the tenor by retirement at 60', () => {
    expect(computeEligibility({ ...base, dateOfBirth: '1971-10-12' }, policy, NOW).tenorMonths).toBe(60);
  });
  it('flags a DIR above the limit and allows exceptional approval', () => {
    const r = computeEligibility({ ...base, loanAmount: 1500000 }, policy, NOW);
    expect(r.decisionRule).toBe('EXCEEDS_DIR_LIMIT');
    expect(r.exceptionalApprovalAllowed).toBe(true);
    expect(r.loanAmountQualifiedFor).toBeLessThan(1500000);
  });
  it('paying off existing loans lowers DIR and raises the qualifying amount', () => {
    const keep = computeEligibility({ ...base, instalmentPersonal: 9000 }, policy, NOW);
    const off = computeEligibility({ ...base, instalmentPersonal: 9000, payOffExistingLoans: true }, policy, NOW);
    expect(off.dirAllStaffLoansPct).toBeLessThan(keep.dirAllStaffLoansPct);
    expect(off.loanAmountQualifiedFor).toBeGreaterThan(keep.loanAmountQualifiedFor);
  });
  it('does not compute without figures', () => {
    expect(computeEligibility({ ...base, netSalary: 0, allowances: 0 }, policy, NOW).decisionRule).toBe('NOT_ELIGIBLE');
  });
});

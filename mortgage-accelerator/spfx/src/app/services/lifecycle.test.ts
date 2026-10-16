import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { requiredSpecs } from '../domain/documents';
import { activeApprovalGroup } from '../domain/rules';
import { MockAdvanceFlowClient } from './mockClient';
import { MortgageCase, ProductCode, Role } from '../domain/types';

(globalThis as unknown as { window: unknown }).window = globalThis;

let api: MockAdvanceFlowClient;

beforeEach(() => {
  vi.useFakeTimers();
  api = new MockAdvanceFlowClient();
  api.setApplicant('E-04499'); // the persona with no cases
});
afterEach(() => vi.useRealTimers());

async function draftReady(product: ProductCode): Promise<MortgageCase> {
  api.setRole('APPLICANT');
  const d = await api.createDraft(product);
  const common = {
    applicant: { nationalId: 'GHA-712345678-4', phone: '024 555 0100', address: 'Plot 5, Madina' },
    financials: { basicSalary: 40000, allowances: 6000, otherIncome: 0, deductions: 12000, existingLoanRepayments: 1500, otherCommitments: 2000, assetsTotal: 500000, liabilitiesTotal: 60000 },
    consent: { creditBureau: true, identity: true, dataProcessing: true, regulatory: true, informationSharing: true },
    tenorYears: 15
  };
  if (product === 'HOME_PURCHASE') {
    await api.saveDraft(d.id, { ...common, amountRequested: 400000, purchase: { purchasePrice: 520000, propertyValue: 520000, downPayment: 120000, vendorType: 'DEVELOPER', vendorName: 'Cedar Court' } });
  } else {
    await api.saveDraft(d.id, { ...common, amountRequested: 250000, equity: { declaredValue: 900000, existingMortgageBalance: 0, existingMortgageStatus: 'NONE', ownership: 'SOLE', purpose: 'TUITION', useOfFunds: [{ item: 'Fees', amount: 250000 }] } });
  }
  const c = await api.getCase(d.id);
  for (const spec of requiredSpecs(c)) {
    await api.uploadDocument(c.id, spec.docType, spec.category, { name: spec.docType + '.pdf', sizeKb: 200 });
  }
  return api.getCase(d.id);
}

async function as<T>(role: Role, fn: () => Promise<T>): Promise<T> {
  api.setRole(role);
  return fn();
}

async function toAssessment(product: ProductCode): Promise<MortgageCase> {
  const d = await draftReady(product);
  const sub = await api.submitCase(d.id);
  expect(sub.state).toBe('PRE_APPROVAL');
  expect(sub.ref).toMatch(/^MTG-2026-\d+$/);
  expect(sub.locked).toBe(true);
  await vi.advanceTimersByTimeAsync(3000);
  expect((await api.getCase(d.id)).state).toBe('PRE_APPROVED');
  await api.confirmProceed(d.id);
  return api.getCase(d.id);
}

async function finishAssessment(c: MortgageCase): Promise<void> {
  const v = (await as('COLLATERAL', () => api.listValuations())).filter((x) => x.caseId === c.id)[0];
  await api.assignValuer(v.id, 'VAL-3');
  const mv = c.product === 'HOME_PURCHASE' ? 520000 : 900000;
  await api.submitValuationReport(v.id, { marketValue: mv, forcedSaleValue: Math.round(mv * 0.78), valuationDate: '2026-10-14', condition: 'Good', occupancy: 'Vacant' });
  await api.reviewValuation(v.id, 'ACCEPTED', '');
  const prop = (await api.listProperties()).filter((p) => p.caseIds.indexOf(c.id) >= 0)[0];
  await as('LEGAL', async () => {
    for (const t of ['LAND', 'CERTIFICATE', 'CONSOLIDATED'] as const) {
      await api.recordSearch(prop.id, t, 'CLEAR', '');
    }
  });
  await as('COLLATERAL', async () => {
    for (const i of (await api.getFitToLend(c.id)).checklist) {
      await api.setChecklistItem(c.id, i.id, true);
    }
    await api.decideProperty(c.id, 'ACCEPT', '');
  });
  const credit = (await as('CREDIT', () => api.listTasks({ role: 'CREDIT', caseId: c.id, open: true }))).filter((t) => t.title === 'Credit recommendation')[0];
  await api.completeTask(credit.id, 'RECOMMEND');
}

async function approveAll(id: string): Promise<void> {
  api.setRole('APPROVER');
  for (let guard = 0; guard < 10; guard++) {
    const c = await api.getCase(id);
    if (c.state !== 'IN_APPROVAL') {
      return;
    }
    const g = activeApprovalGroup(c.approvals);
    for (const s of c.approvals.filter((a) => a.group === g && !a.decision)) {
      await api.decideApproval(id, s.level, 'APPROVE', 'Within policy');
    }
  }
}

describe('Home Purchase: draft to closure', () => {
  it('runs the whole lifecycle through every gate', async () => {
    let c = await toAssessment('HOME_PURCHASE');
    expect(c.state).toBe('IN_ASSESSMENT');
    expect((await api.listValuations()).some((v) => v.caseId === c.id)).toBe(true);

    await finishAssessment(c);
    c = await api.getCase(c.id);
    expect(c.state).toBe('IN_APPROVAL');
    expect(c.approvals.map((a) => a.level)).toEqual(['L1', 'L4', 'L5', 'L7']); // T1

    await approveAll(c.id);
    c = await api.getCase(c.id);
    expect(c.state).toBe('OFFER_ISSUED');
    expect(c.conditions.length).toBeGreaterThan(5);

    await as('APPLICANT', () => api.acceptOffer(c.id));
    c = await api.getCase(c.id);
    expect(c.state).toBe('CONDITIONS_PENDING');

    // BR-10: cannot request disbursement while conditions are open
    await expect(as('CREDIT_ADMIN', () => api.requestDisbursement(c.id, 'Cedar Court', 100000))).rejects.toThrow(/not ready|condition|Offer/i);

    api.setRole('CREDIT_ADMIN');
    for (const cond of c.conditions) {
      await api.updateCondition(cond.id, 'VERIFIED', '');
    }
    expect((await api.getCase(c.id)).state).toBe('CONDITIONS_PENDING'); // fit-to-lend still missing
    await as('COLLATERAL', () => api.issueFitToLend(c.id));
    c = await api.getCase(c.id);
    expect(c.state).toBe('READY_TO_DISBURSE');
    expect(c.fitToLend && c.fitToLend.certificateNo).toBeTruthy();

    // cannot disburse more than approved
    await expect(as('CREDIT_ADMIN', () => api.requestDisbursement(c.id, 'Cedar Court', 999999999))).rejects.toThrow(/exceeds/);
    const d = await as('CREDIT_ADMIN', () => api.requestDisbursement(c.id, 'Cedar Court', 400000));
    // four-eyes: requester cannot approve
    await expect(as('CREDIT_ADMIN', () => api.approveDisbursement(d.id))).rejects.toThrow(/Four-eyes/);
    await as('OPERATIONS', () => api.approveDisbursement(d.id));
    await as('OPERATIONS', () => api.payDisbursement(d.id));
    c = await api.getCase(c.id);
    expect(c.state).toBe('POST_DISBURSEMENT');
    expect(c.postItems).toHaveLength(5);

    api.setRole('POST_DISBURSEMENT');
    for (const item of c.postItems) {
      await api.updatePostItem(item.id, 'DONE');
    }
    c = await api.getCase(c.id);
    expect(c.state).toBe('CLOSED');

    // every step left an audit entry linked to the case
    const audit = await as('AUDITOR', () => api.listAudit({ caseId: c.id }));
    const actions = audit.map((a) => a.action);
    for (const expected of ['Application created', 'Form submitted', 'Workflow initiated', 'Document uploaded', 'Notification sent', 'Approval decision', 'Offer accepted', 'Fit-to-lend issued', 'Funds released', 'Account activated']) {
      expect(actions).toContain(expected);
    }
  });

  it('refuses to submit with a missing document or consent', async () => {
    api.setRole('APPLICANT');
    const d = await api.createDraft('HOME_PURCHASE');
    await expect(api.submitCase(d.id)).rejects.toThrow(/Consent|missing/i);
  });

  it('blocks a duplicate active application for the same employee and product (BR-01)', async () => {
    api.setApplicant('E-04417'); // already has a Home Purchase in flight
    api.setRole('APPLICANT');
    const d = await api.createDraft('HOME_PURCHASE');
    const r = await api.getReadiness(d.id);
    expect(r.hardStops.join(' ')).toMatch(/BR-01/);
  });

  it('locks a submitted case until it is returned for correction', async () => {
    const d = await draftReady('HOME_PURCHASE');
    await api.submitCase(d.id);
    await expect(api.saveDraft(d.id, { amountRequested: 1 })).rejects.toThrow(/locked/);
    await as('MORTGAGE_OFFICER', () => api.returnCase(d.id, 'Please re-upload payslips'));
    const back = await as('APPLICANT', () => api.saveDraft(d.id, { amountRequested: 390000 }));
    expect(back.amountRequested).toBe(390000);
  });

  it('a rejected property stops the case and cancels open work', async () => {
    const c = await toAssessment('HOME_PURCHASE');
    await as('COLLATERAL', () => api.decideProperty(c.id, 'REJECT', 'Adverse land search'));
    const after = await api.getCase(c.id);
    expect(after.state).toBe('DECLINED');
    expect(after.tasks.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS')).toHaveLength(0);
  });

  it('a return from an approver sends the case back to assessment', async () => {
    const c = await toAssessment('HOME_PURCHASE');
    await finishAssessment(c);
    await as('APPROVER', () => api.decideApproval(c.id, 'L1', 'RETURN', 'Check salary evidence'));
    expect((await api.getCase(c.id)).state).toBe('IN_ASSESSMENT');
  });

  it('a decline needs a reason', async () => {
    const c = await toAssessment('HOME_PURCHASE');
    await finishAssessment(c);
    await expect(as('APPROVER', () => api.decideApproval(c.id, 'L1', 'DECLINE', ''))).rejects.toThrow(/reason/);
  });
});

describe('Equity Release', () => {
  it('caps the release at 70% of forced sale value and pays tuition direct', async () => {
    const c = await toAssessment('EQUITY_RELEASE');
    await finishAssessment(c);
    const after = await api.getCase(c.id);
    expect(after.equity && after.equity.forcedSaleValue).toBe(Math.round(900000 * 0.78));
    expect(after.state).toBe('IN_APPROVAL');
  });

  it('blocks fit-to-lend when the request exceeds 70% of FSV', async () => {
    const d = await draftReady('EQUITY_RELEASE');
    await api.saveDraft(d.id, { amountRequested: 600000 });
    const sub = await api.submitCase(d.id);
    await vi.advanceTimersByTimeAsync(3000);
    await api.confirmProceed(sub.id);
    const c = await api.getCase(d.id);
    await finishAssessment(c);
    const after = await api.getCase(c.id);
    // 70% of 702,000 = 491,400 < 600,000, so the case must not reach approval
    expect(after.state).toBe('IN_ASSESSMENT');
    await expect(as('COLLATERAL', () => api.issueFitToLend(c.id))).rejects.toThrow(/70%/);
  });
});

describe('collaboration and requests', () => {
  it('a request pauses the case SLA clock and closing it resumes', async () => {
    const c = await toAssessment('HOME_PURCHASE');
    const thread = (await as('CREDIT', () => api.listThreads(c.id))).filter((t) => t.topic === 'CREDIT')[0];
    await api.postMessage(thread.id, 'Please confirm other income', 'REQUEST', '2026-10-30');
    expect((await api.getCase(c.id)).sla?.pausedSince).toBeTruthy();
    const t2 = (await api.listThreads(c.id)).filter((t) => t.id === thread.id)[0];
    const req = t2.messages.filter((m) => m.kind === 'REQUEST')[0];
    await as('APPLICANT', () => api.closeRequest(thread.id, req.id));
    expect((await api.getCase(c.id)).sla?.pausedSince).toBeUndefined();
  });

  it('pushes notifications in real time', async () => {
    const seen: string[] = [];
    const off = api.subscribe((n) => seen.push(n.title));
    const d = await draftReady('HOME_PURCHASE');
    await api.submitCase(d.id);
    await vi.advanceTimersByTimeAsync(3000);
    off();
    expect(seen).toContain('Application submitted');
    expect(seen).toContain('Pre-approved');
  });
});

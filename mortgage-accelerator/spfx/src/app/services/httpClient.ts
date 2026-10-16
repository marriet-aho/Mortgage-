/**
 * Production client. Talks to the Advance Flow mortgage API with a bearer token for
 * Microsoft Entra ID, supplied by SPFx AadHttpClient through the `Fetcher` below.
 * Endpoint paths are defined in docs/05-api-contract.md. Confirm each one against the
 * Advance Flow API reference before go-live: the module's contract is the source of truth
 * for what it needs, and an adapter can map any difference.
 */
import { AdvanceFlowClient, AnalyticsSnapshot, CaseFilter, DraftPatch } from './client';
import {
  AppNotification,
  ApprovalLevel,
  AuditEntry,
  Condition,
  ConditionStatus,
  Disbursement,
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
  Task,
  Thread,
  UserContext,
  ValuationReport,
  ValuationRequest,
  Valuer
} from '../domain/types';

export interface FetchResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export type Fetcher = (path: string, init?: { method?: string; body?: string; headers?: { [k: string]: string } }) => Promise<FetchResponse>;

export class AdvanceFlowApiError extends Error {
  public status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, AdvanceFlowApiError.prototype);
  }
}

function qs(params: { [k: string]: string | number | boolean | undefined | string[] }): string {
  const parts: string[] = [];
  Object.keys(params).forEach(function (k) {
    const v = params[k];
    if (v === undefined || v === '') {
      return;
    }
    parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(Array.isArray(v) ? v.join(',') : String(v)));
  });
  return parts.length ? '?' + parts.join('&') : '';
}

export class HttpAdvanceFlowClient implements AdvanceFlowClient {
  private listeners: Array<(n: AppNotification) => void> = [];
  private timer: number | undefined;
  private lastPoll: string = new Date().toISOString();

  constructor(private fetcher: Fetcher, private pollMs: number = 15000) {}

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await this.fetcher(path, {
      method,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
    });
    if (!res.ok) {
      let message = res.status + '';
      try {
        message = (await res.text()) || message;
      } catch (e) {
        /* keep status */
      }
      throw new AdvanceFlowApiError(res.status, message);
    }
    if (res.status === 204) {
      return undefined as unknown as T;
    }
    return (await res.json()) as T;
  }

  private get<T>(path: string): Promise<T> { return this.call<T>('GET', path); }
  private post<T>(path: string, body?: unknown): Promise<T> { return this.call<T>('POST', path, body === undefined ? {} : body); }
  private patch<T>(path: string, body: unknown): Promise<T> { return this.call<T>('PATCH', path, body); }

  getCurrentUser() { return this.get<UserContext>('/me'); }

  listCases(f?: CaseFilter) {
    return this.get<MortgageCase[]>('/cases' + qs({ product: f && f.product, states: f && f.states, mine: f && f.mine, q: f && f.q }));
  }
  getCase(id: string) { return this.get<MortgageCase>('/cases/' + id); }
  createDraft(product: ProductCode) { return this.post<MortgageCase>('/cases', { product }); }
  saveDraft(id: string, patch: DraftPatch) { return this.patch<MortgageCase>('/cases/' + id, patch); }
  submitCase(id: string) { return this.post<MortgageCase>('/cases/' + id + '/submit'); }
  confirmProceed(id: string) { return this.post<MortgageCase>('/cases/' + id + '/proceed'); }
  acceptOffer(id: string) { return this.post<MortgageCase>('/cases/' + id + '/offer/accept'); }
  withdrawCase(id: string, reason: string) { return this.post<MortgageCase>('/cases/' + id + '/withdraw', { reason }); }
  returnCase(id: string, note: string) { return this.post<MortgageCase>('/cases/' + id + '/return', { note }); }
  getReadiness(id: string) { return this.get<ReadinessResult>('/cases/' + id + '/readiness'); }

  listTasks(f?: { role?: Role; caseId?: string; open?: boolean }) {
    return this.get<Task[]>('/tasks' + qs({ role: f && f.role, caseId: f && f.caseId, open: f && f.open }));
  }
  completeTask(taskId: string, outcome?: string) { return this.post<Task>('/tasks/' + taskId + '/complete', { outcome }); }

  decideApproval(caseId: string, level: ApprovalLevel, decision: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'RETURN' | 'DECLINE', comment: string) {
    return this.post<MortgageCase>('/cases/' + caseId + '/approvals/' + level, { decision, comment });
  }

  listDocuments(caseId: string) { return this.get<DocRef[]>('/cases/' + caseId + '/documents'); }
  /**
   * Metadata is registered with Advance Flow; the bytes go to the SharePoint library through
   * the SharePoint document service (see sharePointDocs.ts), so the file never passes through the API.
   */
  uploadDocument(caseId: string, docType: string, category: DocCategory, file: { name: string; sizeKb: number }) {
    return this.post<DocRef>('/cases/' + caseId + '/documents', { docType, category, fileName: file.name, sizeKb: file.sizeKb });
  }
  listDocRequests(caseId: string) { return this.get<DocRequest[]>('/cases/' + caseId + '/document-requests'); }
  requestDocument(caseId: string, docType: string, category: DocCategory, dueDate: string) {
    return this.post<DocRequest>('/cases/' + caseId + '/document-requests', { docType, category, dueDate });
  }

  listValuations() { return this.get<ValuationRequest[]>('/valuations'); }
  listValuers() { return this.get<Valuer[]>('/valuers'); }
  requestValuation(caseId: string, contactPerson: string, contactNumber: string) {
    return this.post<ValuationRequest>('/valuations', { caseId, contactPerson, contactNumber });
  }
  assignValuer(valuationId: string, valuerId: string) { return this.post<ValuationRequest>('/valuations/' + valuationId + '/assign', { valuerId }); }
  submitValuationReport(valuationId: string, report: ValuationReport) {
    return this.post<ValuationRequest>('/valuations/' + valuationId + '/report', report);
  }
  reviewValuation(valuationId: string, outcome: 'ACCEPTED' | 'RETURNED', note: string) {
    return this.post<ValuationRequest>('/valuations/' + valuationId + '/review', { outcome, note });
  }

  listProperties() { return this.get<Property[]>('/properties'); }
  getProperty(id: string) { return this.get<Property>('/properties/' + id); }
  recordSearch(propertyId: string, type: LegalSearch['type'], result: NonNullable<LegalSearch['result']>, notes: string) {
    return this.post<Property>('/properties/' + propertyId + '/searches', { type, result, notes });
  }

  getFitToLend(caseId: string) { return this.get<FitToLend>('/cases/' + caseId + '/fit-to-lend'); }
  setChecklistItem(caseId: string, itemId: string, done: boolean) {
    return this.patch<FitToLend>('/cases/' + caseId + '/fit-to-lend/checklist/' + itemId, { done });
  }
  decideProperty(caseId: string, decision: NonNullable<FitToLend['decision']>, reason: string) {
    return this.post<MortgageCase>('/cases/' + caseId + '/fit-to-lend/decision', { decision, reason });
  }
  issueFitToLend(caseId: string) { return this.post<MortgageCase>('/cases/' + caseId + '/fit-to-lend/issue'); }

  listConditions() { return this.get<Condition[]>('/conditions'); }
  updateCondition(id: string, status: ConditionStatus, note: string) { return this.patch<Condition>('/conditions/' + id, { status, note }); }

  listThreads(caseId?: string) { return this.get<Thread[]>('/threads' + qs({ caseId })); }
  postMessage(threadId: string, body: string, kind: 'MESSAGE' | 'REQUEST' | 'NOTE', dueDate?: string) {
    return this.post<Thread>('/threads/' + threadId + '/messages', { body, kind, dueDate });
  }
  joinThread(threadId: string) { return this.post<Thread>('/threads/' + threadId + '/join'); }
  closeRequest(threadId: string, messageId: string) { return this.post<Thread>('/threads/' + threadId + '/messages/' + messageId + '/close'); }

  requestDisbursement(caseId: string, payee: string, amount: number) { return this.post<Disbursement>('/cases/' + caseId + '/disbursements', { payee, amount }); }
  approveDisbursement(id: string) { return this.post<Disbursement>('/disbursements/' + id + '/approve'); }
  payDisbursement(id: string) { return this.post<Disbursement>('/disbursements/' + id + '/pay'); }
  listPostItems() { return this.get<PostItem[]>('/post-disbursement'); }
  updatePostItem(id: string, status: PostItem['status']) { return this.patch<PostItem>('/post-disbursement/' + id, { status }); }

  listAudit(f?: { caseId?: string; q?: string }) { return this.get<AuditEntry[]>('/audit' + qs({ caseId: f && f.caseId, q: f && f.q })); }

  listNotifications() { return this.get<AppNotification[]>('/notifications'); }
  async markNotificationRead(id: string) { await this.post('/notifications/' + id + '/read'); }

  /**
   * Real-time notifications. Advance Flow's Notification Engine pushes over SignalR where
   * available; this client falls back to polling so the module works either way.
   */
  subscribe(listener: (n: AppNotification) => void): () => void {
    this.listeners.push(listener);
    if (this.timer === undefined) {
      this.timer = window.setInterval(() => { void this.poll(); }, this.pollMs);
    }
    return () => {
      this.listeners = this.listeners.filter(function (l) { return l !== listener; });
      if (this.listeners.length === 0 && this.timer !== undefined) {
        window.clearInterval(this.timer);
        this.timer = undefined;
      }
    };
  }

  private async poll(): Promise<void> {
    try {
      const since = this.lastPoll;
      this.lastPoll = new Date().toISOString();
      const fresh = await this.get<AppNotification[]>('/notifications' + qs({ since }));
      fresh.forEach((n) => this.listeners.forEach(function (l) { l(n); }));
    } catch (e) {
      /* try again on the next tick */
    }
  }

  getAnalytics() { return this.get<AnalyticsSnapshot>('/analytics'); }
}

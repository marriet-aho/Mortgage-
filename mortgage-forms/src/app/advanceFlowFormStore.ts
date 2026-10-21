import { FormValues } from './formDef';
import { FormStore, StoredDoc } from './store';

/**
 * Store that talks to Advance Flow instead of SharePoint. THE PATHS BELOW ARE A PROPOSAL, not Advance Flow's real API:
 * the Advance Flow team should confirm or replace them (see docs/advance-flow-integration.md). Everything the forms
 * app needs from Advance Flow goes through this one class, so changing the contract means changing only this file.
 *
 * `call` is supplied by the host. Inside Advance Flow it is the app's own authenticated request function.
 */
export type Call = (method: 'GET' | 'PUT' | 'POST' | 'DELETE', path: string, body?: unknown) => Promise<{ status: number; json: () => Promise<unknown> }>;

export class AdvanceFlowFormStore implements FormStore {
  public readonly demo = false;
  /** `loanNumber` is the loan the person created in Create Staff Loan. */
  constructor(private call: Call, private loanNumber: string) {}

  private base(): string { return '/mortgage/loans/' + encodeURIComponent(this.loanNumber); }

  public async load(key: string): Promise<FormValues | undefined> {
    const r = await this.call('GET', this.base() + '/forms/' + key);
    if (r.status === 404) { return undefined; }
    if (r.status >= 300) { throw new Error('Reading your draft failed (' + r.status + ').'); }
    return (await r.json()) as FormValues;
  }

  public async save(key: string, values: FormValues): Promise<void> {
    const r = await this.call('PUT', this.base() + '/forms/' + key, values);
    if (r.status >= 300) { throw new Error('Saving failed (' + r.status + ').'); }
  }

  public async publish(folder: string, fileName: string, html: string): Promise<string> {
    const r = await this.call('PUT', this.base() + '/signed/' + folder + '/' + fileName, { contentType: 'text/html', content: html });
    if (r.status >= 300) { throw new Error('Submitting ' + fileName + ' failed (' + r.status + ').'); }
    return 'Advance Flow loan ' + this.loanNumber + ': ' + fileName;
  }

  public async upload(product: string, key: string, file: File): Promise<StoredDoc> {
    const form = new FormData();
    form.append('file', file); form.append('requirement', key); form.append('product', product);
    const r = await this.call('POST', this.base() + '/documents', form);
    if (r.status >= 300) { throw new Error('Uploading ' + file.name + ' failed (' + r.status + ').'); }
    return (await r.json()) as StoredDoc;
  }

  public async listDocs(product: string): Promise<StoredDoc[]> {
    const r = await this.call('GET', this.base() + '/documents?product=' + encodeURIComponent(product));
    if (r.status === 404) { return []; }
    if (r.status >= 300) { throw new Error('Reading your documents failed (' + r.status + ').'); }
    return (await r.json()) as StoredDoc[];
  }

  public async removeDoc(product: string, doc: StoredDoc): Promise<void> {
    const r = await this.call('DELETE', this.base() + '/documents/' + encodeURIComponent(doc.url || doc.name) + '?product=' + encodeURIComponent(product));
    if (r.status >= 300) { throw new Error('Removing the file failed (' + r.status + ').'); }
  }
}

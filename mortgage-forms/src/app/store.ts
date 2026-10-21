import { FormValues } from './formDef';

export interface StoredDoc { key: string; name: string; sizeKb: number; at: string; url?: string }

export const MAX_UPLOAD_MB = 10;
const OK_TYPES = /\.(pdf|jpe?g|png)$/i;

/** Returns a reason the file cannot be uploaded, or undefined when it is fine. */
export function checkFile(f: { name: string; size: number }): string | undefined {
  if (!OK_TYPES.test(f.name)) { return 'Upload a PDF, JPG or PNG file.'; }
  if (f.size > MAX_UPLOAD_MB * 1024 * 1024) { return 'The file is larger than ' + MAX_UPLOAD_MB + ' MB.'; }
  return undefined;
}

/** Where drafts, completed forms and uploaded documents are kept. */
export interface FormStore {
  readonly demo: boolean;
  load(key: string): Promise<FormValues | undefined>;
  save(key: string, values: FormValues): Promise<void>;
  /** Saves a finished form as a printable file next to its data. Returns where it was saved. */
  publish(folder: string, fileName: string, html: string): Promise<string>;
  /** Supporting documents, kept per product. `key` says which requirement the file answers (or `other`). */
  upload(product: string, key: string, file: File): Promise<StoredDoc>;
  listDocs(product: string): Promise<StoredDoc[]>;
  removeDoc(product: string, doc: StoredDoc): Promise<void>;
  /** Preview only: attach a stand-in file where the browser blocks the file picker. */
  attachSample?(product: string, key: string): Promise<StoredDoc>;
}

/** Browser storage, for the local preview. Falls back to memory when storage is blocked. */
export class LocalFormStore implements FormStore {
  public readonly demo = true;
  private mem: { [k: string]: string } = {};
  public async load(key: string): Promise<FormValues | undefined> {
    let raw: string | undefined;
    try { raw = window.localStorage.getItem('mortgage-forms:' + key) || undefined; } catch (e) { raw = this.mem[key]; }
    return raw ? (JSON.parse(raw) as FormValues) : undefined;
  }
  public async save(key: string, values: FormValues): Promise<void> {
    const raw = JSON.stringify(values);
    this.mem[key] = raw;
    try { window.localStorage.setItem('mortgage-forms:' + key, raw); } catch (e) { /* memory copy kept */ }
  }
  public async publish(folder: string, fileName: string): Promise<string> {
    return 'Mortgage Forms/' + folder + '/' + fileName + ' (preview only: nothing is uploaded)';
  }
  private docs: { [product: string]: StoredDoc[] } = {};
  public async upload(product: string, key: string, file: File): Promise<StoredDoc> {
    const d: StoredDoc = { key, name: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)), at: new Date().toISOString() };
    (this.docs[product] = this.docs[product] || []).push(d);
    return d;
  }
  public async attachSample(product: string, key: string): Promise<StoredDoc> {
    const d: StoredDoc = { key, name: key.replace(/_/g, '-') + '-sample.pdf', sizeKb: 120, at: new Date().toISOString() };
    (this.docs[product] = this.docs[product] || []).push(d);
    return d;
  }
  public async listDocs(product: string): Promise<StoredDoc[]> { return (this.docs[product] || []).slice(); }
  public async removeDoc(product: string, doc: StoredDoc): Promise<void> { this.docs[product] = (this.docs[product] || []).filter(function (d) { return d !== doc && !(d.key === doc.key && d.name === doc.name); }); }
}


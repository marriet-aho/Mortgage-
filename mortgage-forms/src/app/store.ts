import { FormValues } from './formDef';

/** Where drafts and completed forms are kept. */
export interface FormStore {
  readonly demo: boolean;
  load(key: string): Promise<FormValues | undefined>;
  save(key: string, values: FormValues): Promise<void>;
  /** Saves a finished form as a printable file next to its data. Returns where it was saved. */
  publish(folder: string, fileName: string, html: string): Promise<string>;
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
}


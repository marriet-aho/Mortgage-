import { SPHttpClient } from '@microsoft/sp-http';
import { FormValues } from './formDef';
import { FormStore } from './store';

/**
 * SharePoint Online document library. One folder per person and product, so the library's own permissions
 * keep each applicant's forms private. Drafts are JSON; completed forms are printable HTML (open and Save as PDF).
 */
export class SharePointFormStore implements FormStore {
  public readonly demo = false;
  constructor(private http: SPHttpClient, private webUrl: string, private webServerRelativeUrl: string, private library: string, private userKey: string) {}

  private get root(): string {
    return (this.webServerRelativeUrl === '/' ? '' : this.webServerRelativeUrl) + '/' + this.library;
  }
  private folder(sub: string): string { return this.root + '/' + this.userKey + (sub ? '/' + sub : ''); }
  private json = { Accept: 'application/json;odata=nometadata' };

  private async ensureFolder(sub: string): Promise<void> {
    const parts = [this.userKey].concat(sub ? sub.split('/') : []);
    let path = this.root;
    for (const part of parts) {
      path += '/' + part;
      const res = await this.http.post(this.webUrl + '/_api/web/folders', SPHttpClient.configurations.v1, {
        headers: { ...this.json, 'Content-Type': 'application/json;odata=nometadata' }, body: JSON.stringify({ ServerRelativeUrl: path })
      });
      if (!res.ok) { throw new Error('Creating the folder failed (' + res.status + '). Does the library "' + this.library + '" exist?'); }
    }
  }

  private async put(sub: string, name: string, body: string): Promise<string> {
    await this.ensureFolder(sub);
    const folder = this.folder(sub);
    const res = await this.http.post(
      this.webUrl + "/_api/web/GetFolderByServerRelativeUrl('" + folder.replace(/'/g, "''") + "')/Files/add(url='" + encodeURIComponent(name).replace(/'/g, '%27') + "',overwrite=true)",
      SPHttpClient.configurations.v1, { headers: this.json, body }
    );
    if (!res.ok) { throw new Error('Saving ' + name + ' failed (' + res.status + ').'); }
    return ((await res.json()) as { ServerRelativeUrl: string }).ServerRelativeUrl;
  }

  public async load(key: string): Promise<FormValues | undefined> {
    const i = key.lastIndexOf('/');
    const url = this.folder(key.slice(0, i)) + '/' + key.slice(i + 1) + '.json';
    const res = await this.http.get(this.webUrl + "/_api/web/GetFileByServerRelativeUrl('" + url.replace(/'/g, "''") + "')/$value", SPHttpClient.configurations.v1);
    if (res.status === 404) { return undefined; }
    if (!res.ok) { throw new Error('Reading your draft failed (' + res.status + ').'); }
    return (await res.json()) as FormValues;
  }

  public async save(key: string, values: FormValues): Promise<void> {
    const i = key.lastIndexOf('/');
    await this.put(key.slice(0, i), key.slice(i + 1) + '.json', JSON.stringify(values));
  }

  public async publish(folder: string, fileName: string, html: string): Promise<string> {
    return this.put(folder, fileName, html);
  }
}

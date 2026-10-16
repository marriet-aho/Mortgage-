/**
 * Stores case documents in a SharePoint Online document library through the SharePoint REST API,
 * using the signed-in user's Entra ID identity (SPHttpClient). One folder per case reference.
 * Library columns (create these once, see docs/02-data-model.md): CaseRef, DocType, Classification.
 * Permissions come from the library and folder, so a user can only read files they are allowed to see.
 */
import { SPHttpClient, SPHttpClientResponse } from '@microsoft/sp-http';
import { FileStore, StoredFile } from './fileStore';

export class SharePointFileStore implements FileStore {
  constructor(private http: SPHttpClient, private webUrl: string, private webServerRelativeUrl: string, private library: string) {}

  private get root(): string {
    const base = this.webServerRelativeUrl === '/' ? '' : this.webServerRelativeUrl;
    return base + '/' + this.library;
  }

  private async ok(res: SPHttpClientResponse, what: string): Promise<SPHttpClientResponse> {
    if (!res.ok) {
      throw new Error(what + ' failed (' + res.status + '). ' + (await res.text()).slice(0, 200));
    }
    return res;
  }

  public async upload(caseRef: string, docType: string, file: File): Promise<StoredFile> {
    const folder = this.root + '/' + encodeURIComponent(caseRef).replace(/%20/g, ' ');
    // 1. make sure the case folder exists (the call returns the existing folder if it is already there)
    await this.ok(await this.http.post(this.webUrl + '/_api/web/folders', SPHttpClient.configurations.v1, {
      headers: { Accept: 'application/json;odata=nometadata', 'Content-Type': 'application/json;odata=nometadata' },
      body: JSON.stringify({ ServerRelativeUrl: folder })
    }), 'Creating the case folder');

    // 2. upload the bytes; the file name carries the document type so versions sort together
    const name = docType.toLowerCase() + '-' + file.name.replace(/[#%&*:<>?/\\|"]/g, '_');
    const add = await this.ok(await this.http.post(
      this.webUrl + "/_api/web/GetFolderByServerRelativeUrl('" + folder.replace(/'/g, "''") + "')/Files/add(url='" + encodeURIComponent(name).replace(/'/g, '%27') + "',overwrite=true)",
      SPHttpClient.configurations.v1,
      { headers: { Accept: 'application/json;odata=nometadata' }, body: file }
    ), 'Uploading the file');
    const added = (await add.json()) as { ServerRelativeUrl: string };

    // 3. stamp the metadata columns so search, retention and permissions can use them
    const item = await this.ok(await this.http.get(
      this.webUrl + "/_api/web/GetFileByServerRelativeUrl('" + added.ServerRelativeUrl.replace(/'/g, "''") + "')/ListItemAllFields?$select=Id",
      SPHttpClient.configurations.v1,
      { headers: { Accept: 'application/json;odata=nometadata' } }
    ), 'Reading the file record');
    const id = ((await item.json()) as { Id: number }).Id;
    await this.ok(await this.http.post(
      this.webUrl + "/_api/web/lists/getbytitle('" + this.library.replace(/'/g, "''") + "')/items(" + id + ')',
      SPHttpClient.configurations.v1,
      { headers: { Accept: 'application/json;odata=nometadata', 'Content-Type': 'application/json;odata=nometadata', 'IF-MATCH': '*', 'X-HTTP-Method': 'MERGE' }, body: JSON.stringify({ CaseRef: caseRef, DocType: docType }) }
    ), 'Setting the document metadata');

    return { name: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)), libraryUrl: added.ServerRelativeUrl };
  }
}

/**
 * Where document bytes go. In production this is a SharePoint Online document library
 * (one folder per case, metadata columns set on upload). Advance Flow only stores the
 * reference, so files never pass through the mortgage API.
 */
export interface StoredFile {
  name: string;
  sizeKb: number;
  libraryUrl: string;
}

export interface FileStore {
  upload(caseRef: string, docType: string, file: File): Promise<StoredFile>;
}

export const MAX_FILE_MB = 10;
export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export function validateFile(file: { name: string; size: number; type: string }): string | undefined {
  if (ACCEPTED_TYPES.indexOf(file.type) < 0) {
    return file.name + ': only PDF, JPG or PNG files are accepted.';
  }
  if (file.size > MAX_FILE_MB * 1048576) {
    return file.name + ' is larger than ' + MAX_FILE_MB + ' MB.';
  }
  return undefined;
}

/** Local stand-in: pretends to store the file and returns a library-style URL. */
export class MockFileStore implements FileStore {
  upload(caseRef: string, docType: string, file: File): Promise<StoredFile> {
    return Promise.resolve({ name: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)), libraryUrl: '/sites/mortgage/Case Documents/' + caseRef + '/' + docType.toLowerCase() + '/' + file.name });
  }
}

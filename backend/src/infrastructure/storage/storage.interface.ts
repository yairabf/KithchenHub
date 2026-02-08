export interface StoragePort {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<void>;
  getSignedUrl(key: string): Promise<string>;
  delete(key: string): Promise<void>;
}

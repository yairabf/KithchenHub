export interface StoragePort {
  putObject(
    key: string,
    buffer: Buffer,
    contentType: string,
    cacheControl?: string,
    metadata?: Record<string, string>,
  ): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}

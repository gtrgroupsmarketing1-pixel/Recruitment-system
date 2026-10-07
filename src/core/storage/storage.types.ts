export interface StorageClient {
  getSignedUploadUrl(key: string, mimeType: string, expiresIn: number): Promise<string>;
  getSignedDownloadUrl(key: string, expiresIn: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
  headObject(key: string): Promise<{ size: number; contentType: string } | null>;
  writeObject(key: string, bytes: Buffer, contentType: string): Promise<void>;
  getObject(key: string): Promise<Buffer | null>;
  headBucket(): Promise<{ ok: boolean; latencyMs: number }>;
}

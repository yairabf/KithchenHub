import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StoragePort } from './storage.interface';

@Injectable()
export class S3StorageAdapter implements StoragePort {
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly logger = new Logger(S3StorageAdapter.name);
  private readonly signedUrlCache = new Map<
    string,
    { url: string; expiresAt: number }
  >();

  constructor(private readonly configService: ConfigService) {
    const region = this.configService.get<string>('S3_REGION') || 'us-east-1';
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY');
    this.bucket =
      this.configService.get<string>('STORAGE_BUCKET') ?? 'household-uploads';

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Needed for MinIO
    });
  }

  async putObject(
    key: string,
    buffer: Buffer,
    contentType: string,
    cacheControl?: string,
    metadata?: Record<string, string>,
  ): Promise<void> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: cacheControl,
        Metadata: metadata,
      });
      await this.s3Client.send(command);
      this.logger.log(`Uploaded file to ${key}`);
    } catch (error) {
      this.logger.error(`Failed to upload file to ${key}`, error);
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    try {
      this.pruneExpiredSignedUrls();
      const cacheKey = `${this.bucket}:${key}`;
      const cached = this.signedUrlCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.url;
      }
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });
      this.signedUrlCache.set(cacheKey, {
        url,
        expiresAt: Date.now() + expiresInSeconds * 1000,
      });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for ${key}`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
      this.logger.log(`Deleted file ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}`, error);
      throw error;
    }
  }

  private pruneExpiredSignedUrls(): void {
    const now = Date.now();
    for (const [cacheKey, entry] of this.signedUrlCache.entries()) {
      if (entry.expiresAt <= now) {
        this.signedUrlCache.delete(cacheKey);
      }
    }
  }
}

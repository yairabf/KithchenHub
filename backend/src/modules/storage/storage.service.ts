import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../supabase/supabase.service';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/** AWS SDK / S3-compatible error shape for bucket operations */
interface S3BucketError {
  name?: string;
  message?: string;
  $metadata?: { httpStatusCode?: number };
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly BUCKET_NAME: string;
  private readonly SIGNED_URL_EXPIRATION = 60 * 60 * 24 * 7; // 7 days
  private s3Client: S3Client | null = null;
  private readonly provider: string;
  private s3InitPromise: Promise<void> | null = null;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {
    this.provider = this.configService.get('STORAGE_PROVIDER', 'supabase');
    this.BUCKET_NAME =
      this.provider === 's3'
        ? this.configService.get('S3_BUCKET_NAME', 'household-uploads')
        : 'household-uploads';
  }

  /**
   * Returns a promise that resolves when S3 client is ready. Used to avoid race where
   * uploadFile runs before constructor's async init completes.
   */
  private getS3InitPromise(): Promise<void> {
    if (this.s3InitPromise) return this.s3InitPromise;
    this.s3InitPromise = this.initializeS3();
    return this.s3InitPromise;
  }

  private async initializeS3(): Promise<void> {
    const region = this.configService.get('S3_REGION', 'us-east-1');
    const endpoint = this.configService.get('S3_ENDPOINT');
    const accessKeyId = this.configService.get('S3_ACCESS_KEY');
    const secretAccessKey = this.configService.get('S3_SECRET_KEY');

    if (!accessKeyId || !secretAccessKey) {
      this.logger.error('S3 credentials missing');
      throw new Error('S3 credentials missing');
    }

    this.s3Client = new S3Client({
      region,
      endpoint,
      forcePathStyle: true, // required for MinIO
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.logger.log(`Initialized S3 Storage Provider (Endpoint: ${endpoint})`);

    // Await bucket creation so first upload does not fail with NoSuchBucket on fresh setups
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    if (!this.s3Client) return;
    try {
      await this.s3Client.send(
        new HeadBucketCommand({ Bucket: this.BUCKET_NAME }),
      );
      this.logger.log(`Bucket '${this.BUCKET_NAME}' exists.`);
    } catch (error: unknown) {
      const err = error as S3BucketError;
      if (err?.$metadata?.httpStatusCode === 404 || err?.name === 'NotFound') {
        this.logger.log(`Bucket '${this.BUCKET_NAME}' not found. Creating...`);
        try {
          await this.s3Client!.send(
            new CreateBucketCommand({ Bucket: this.BUCKET_NAME }),
          );
          this.logger.log(`Bucket '${this.BUCKET_NAME}' created successfully.`);
        } catch (createError) {
          const msg =
            createError instanceof Error
              ? createError.message
              : String(createError);
          this.logger.error(
            `Failed to create bucket '${this.BUCKET_NAME}': ${msg}`,
          );
          throw createError;
        }
      } else {
        const msg = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Error checking bucket '${this.BUCKET_NAME}': ${msg}`,
        );
      }
    }
  }

  /**
   * Uploads a file to the storage bucket and returns the storage path.
   */
  async uploadFile(
    path: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    if (this.provider === 's3') {
      await this.getS3InitPromise();
      await this.uploadFileS3(path, fileBuffer, mimeType);
      return path;
    }
    await this.uploadFileSupabase(path, fileBuffer, mimeType);
    return path;
  }

  private async uploadFileS3(
    path: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    if (!this.s3Client) throw new Error('S3 Client not initialized');

    try {
      const command = new PutObjectCommand({
        Bucket: this.BUCKET_NAME,
        Key: path,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`S3 Upload failed: ${msg}`);
      throw new Error(`Failed to upload file to storage: ${msg}`);
    }
  }

  private async uploadFileSupabase(
    path: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<void> {
    const client = this.supabaseService.getClient();

    const { error: uploadError } = await client.storage
      .from(this.BUCKET_NAME)
      .upload(path, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      this.logger.error(
        `Failed to upload file to ${path}: ${uploadError.message}`,
      );
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }
  }

  /**
   * Creates a signed URL for a stored object path.
   */
  async createSignedUrl(path: string): Promise<string> {
    if (this.provider === 's3') {
      await this.getS3InitPromise();
      return this.createSignedUrlS3(path);
    }
    return this.createSignedUrlSupabase(path);
  }

  private async createSignedUrlS3(path: string): Promise<string> {
    if (!this.s3Client) throw new Error('S3 Client not initialized');

    const getCommand = new GetObjectCommand({
      Bucket: this.BUCKET_NAME,
      Key: path,
    });

    const signedUrl = await getSignedUrl(this.s3Client, getCommand, {
      expiresIn: this.SIGNED_URL_EXPIRATION,
    });

    // Replace internal endpoint with public URL if configured (for local dev access from mobile)
    const publicUrl = this.configService.get('S3_PUBLIC_URL');
    if (publicUrl && this.provider === 's3') {
      const endpoint = this.configService.get('S3_ENDPOINT');
      if (endpoint && signedUrl.includes(endpoint)) {
        return signedUrl.replace(endpoint, publicUrl);
      }
      // Fallback for cases where endpoint might be localhost but signedUrl uses 127.0.0.1 or vice versa
      return signedUrl
        .replace('http://localhost:9000', publicUrl)
        .replace('http://127.0.0.1:9000', publicUrl);
    }

    return signedUrl;
  }

  private async createSignedUrlSupabase(path: string): Promise<string> {
    const client = this.supabaseService.getClient();

    const { data, error: urlError } = await client.storage
      .from(this.BUCKET_NAME)
      .createSignedUrl(path, this.SIGNED_URL_EXPIRATION);

    if (urlError || !data?.signedUrl) {
      this.logger.error(
        `Failed to generate signed URL for ${path}: ${urlError?.message}`,
      );
      throw new Error(`Failed to generate signed URL: ${urlError?.message}`);
    }

    return data.signedUrl;
  }
}

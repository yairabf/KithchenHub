import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StoragePort } from './storage.interface';

@Injectable()
export class SupabaseStorageAdapter implements StoragePort {
  private readonly client: SupabaseClient;
  private readonly bucket: string;
  private readonly logger = new Logger(SupabaseStorageAdapter.name);
  private readonly signedUrlCache = new Map<
    string,
    { url: string; expiresAt: number }
  >();

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );
    this.bucket = this.configService.get<string>('STORAGE_BUCKET');

    if (!url) {
      throw new Error('SUPABASE_URL environment variable is not defined');
    }
    if (!serviceKey) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY environment variable is not defined',
      );
    }
    if (!this.bucket) {
      throw new Error('STORAGE_BUCKET environment variable is not defined');
    }

    this.client = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }

  async putObject(
    key: string,
    buffer: Buffer,
    contentType: string,
    cacheControl?: string,
    metadata?: Record<string, string>,
  ): Promise<void> {
    void metadata; // Reserved for future Supabase metadata support
    try {
      const { error } = await this.client.storage
        .from(this.bucket)
        .upload(key, buffer, {
          contentType,
          cacheControl,
          upsert: true,
        });

      if (error) {
        throw error;
      }

      this.logger.log(`Uploaded file to ${key}`);
    } catch (error) {
      this.logger.error(`Failed to upload file to ${key}`, error);
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    try {
      const cacheKey = `${this.bucket}:${key}`;
      const cached = this.signedUrlCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.url;
      }

      const { data, error } = await this.client.storage
        .from(this.bucket)
        .createSignedUrl(key, expiresInSeconds);

      if (error || !data?.signedUrl) {
        throw error || new Error('Failed to create signed URL');
      }

      this.signedUrlCache.set(cacheKey, {
        url: data.signedUrl,
        expiresAt: Date.now() + expiresInSeconds * 1000,
      });

      return data.signedUrl;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for ${key}`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const { error } = await this.client.storage
        .from(this.bucket)
        .remove([key]);
      if (error) {
        throw error;
      }
      this.logger.log(`Deleted file ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}`, error);
      throw error;
    }
  }
}

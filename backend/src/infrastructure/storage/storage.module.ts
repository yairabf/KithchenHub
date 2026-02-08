import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3StorageAdapter } from './s3-storage.adapter';
import { SupabaseStorageAdapter } from './supabase-storage.adapter';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'StoragePort',
      useFactory: (configService: ConfigService) => {
        const provider =
          configService.get<string>('STORAGE_PROVIDER')?.toLowerCase() ??
          'minio';
        if (provider === 'supabase') {
          return new SupabaseStorageAdapter(configService);
        }
        return new S3StorageAdapter(configService);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['StoragePort'],
})
export class StorageModule {}

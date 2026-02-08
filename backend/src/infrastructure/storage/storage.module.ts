import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3StorageAdapter } from './s3-storage.adapter';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'StoragePort',
      useClass: S3StorageAdapter,
    },
  ],
  exports: ['StoragePort'],
})
export class StorageModule {}

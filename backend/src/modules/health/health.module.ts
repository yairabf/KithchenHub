import { Module } from '@nestjs/common';
import { VersionController } from './controllers/version.controller';

@Module({
  controllers: [VersionController],
})
export class HealthModule {}

import { Module } from '@nestjs/common';
import { VersionController } from './controllers/version.controller';
import { HealthController } from './controllers/health.controller';
import { HealthService } from './services/health.service';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VersionController, HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}

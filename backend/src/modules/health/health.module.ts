import { Module } from '@nestjs/common';
import { ClientLinksController } from './controllers/client-links.controller';
import { DeployInfoController } from './controllers/deploy-info.controller';
import { VersionController } from './controllers/version.controller';
import { HealthController } from './controllers/health.controller';
import { ClientLinksService } from './services/client-links.service';
import { HealthService } from './services/health.service';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    ClientLinksController,
    DeployInfoController,
    VersionController,
    HealthController,
  ],
  providers: [ClientLinksService, HealthService],
  exports: [HealthService, ClientLinksService],
})
export class HealthModule {}

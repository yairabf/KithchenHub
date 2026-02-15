import { Module } from '@nestjs/common';
import { AuditService } from './services/audit.service';
import { AuditRepository } from './repositories/audit.repository';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuditService, AuditRepository],
  exports: [AuditService],
})
export class AuditModule {}

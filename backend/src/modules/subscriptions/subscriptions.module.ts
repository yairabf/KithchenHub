import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma/prisma.module';
import { SubscriptionsRepository } from './repositories/subscriptions.repository';
import { SubscriptionsService } from './services/subscriptions.service';

@Module({
  imports: [PrismaModule],
  providers: [SubscriptionsRepository, SubscriptionsService],
  exports: [SubscriptionsRepository, SubscriptionsService],
})
export class SubscriptionsModule {}

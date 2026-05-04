import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { EntitlementGuard } from '../../common/guards';
import { PremiumDemoController } from './controllers/premium-demo.controller';
import { PremiumDemoService } from './services/premium-demo.service';

@Module({
  imports: [SubscriptionsModule],
  controllers: [PremiumDemoController],
  providers: [PremiumDemoService, EntitlementGuard],
})
export class PremiumDemoModule {}

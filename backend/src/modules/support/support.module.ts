import { Module } from '@nestjs/common';

import { SupportTicketsController } from './controllers/support-tickets.controller';
import { SupportTicketRateLimitGuard } from './guards/support-ticket-rate-limit.guard';
import { SupportTicketRateLimitService } from './services/support-ticket-rate-limit.service';
import { SupportTicketsService } from './services/support-tickets.service';

@Module({
  controllers: [SupportTicketsController],
  providers: [
    SupportTicketsService,
    SupportTicketRateLimitService,
    SupportTicketRateLimitGuard,
  ],
})
export class SupportModule {}

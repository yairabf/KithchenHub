import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { CreateSupportTicketDto } from '../dtos/create-support-ticket.dto';
import { SupportTicketRateLimitGuard } from '../guards/support-ticket-rate-limit.guard';
import {
  SupportTicketsService,
  type SupportTicketSubmissionResponse,
} from '../services/support-tickets.service';

@Controller({ path: 'support/tickets', version: '1' })
@UseGuards(SupportTicketRateLimitGuard)
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  @Post()
  async createTicket(
    @Body() payload: CreateSupportTicketDto,
  ): Promise<SupportTicketSubmissionResponse> {
    return this.supportTicketsService.createTicket(payload);
  }
}

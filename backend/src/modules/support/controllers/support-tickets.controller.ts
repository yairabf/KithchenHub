import { Body, Controller, Post } from '@nestjs/common';

import { Public } from '../../../common/decorators/public.decorator';
import { CreateSupportTicketDto } from '../dtos/create-support-ticket.dto';
import {
  SupportTicketsService,
  type SupportTicketSubmissionResponse,
} from '../services/support-tickets.service';

@Controller({ path: 'support/tickets', version: '1' })
@Public()
export class SupportTicketsController {
  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  @Post()
  async createTicket(
    @Body() payload: CreateSupportTicketDto,
  ): Promise<SupportTicketSubmissionResponse> {
    return this.supportTicketsService.createTicket(payload);
  }
}

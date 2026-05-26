import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import { AuthenticatedFastifyRequest } from '../../../common/types/fastify-request.interface';
import { CreateSupportTicketDto } from '../dtos/create-support-ticket.dto';
import { SupportTicketRateLimitGuard } from '../guards/support-ticket-rate-limit.guard';
import { SupportTicketRateLimitService } from '../services/support-ticket-rate-limit.service';
import {
  SupportTicketsService,
  type SupportTicketSubmissionResponse,
} from '../services/support-tickets.service';

@Controller({ path: 'support/tickets', version: '1' })
@UseGuards(SupportTicketRateLimitGuard)
export class SupportTicketsController {
  constructor(
    private readonly supportTicketsService: SupportTicketsService,
    private readonly rateLimitService: SupportTicketRateLimitService,
  ) {}

  @Post()
  async createTicket(
    @Body() payload: CreateSupportTicketDto,
    @Req() request: AuthenticatedFastifyRequest,
  ): Promise<SupportTicketSubmissionResponse> {
    const userId = request.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }

    const response = await this.supportTicketsService.createTicket(payload);
    this.rateLimitService.consume(userId);
    return response;
  }
}

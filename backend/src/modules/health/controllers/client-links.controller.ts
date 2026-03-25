import { Controller, Get } from '@nestjs/common';

import { Public } from '../../../common/decorators/public.decorator';
import {
  ClientLegalLinks,
  ClientLinksService,
} from '../services/client-links.service';

/**
 * Public client metadata (no JWT). Mobile/web fetch these on startup so legal
 * URLs are controlled by the backend without shipping static URLs in the app.
 */
@Controller({ path: 'client-links', version: '1' })
@Public()
export class ClientLinksController {
  constructor(private readonly clientLinksService: ClientLinksService) {}

  @Get()
  getClientLinks(): ClientLegalLinks {
    return this.clientLinksService.getLegalLinks();
  }
}

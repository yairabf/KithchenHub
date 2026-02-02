import { Controller, Get, Query } from '@nestjs/common';
import { HouseholdsService } from '../services/households.service';
import { Public } from '../../../common/decorators/public.decorator';

/**
 * Public invite controller for resolving invite codes before sign-in.
 * API Version: 1
 * Endpoints are public (no auth required).
 */
@Controller({ path: 'invite', version: '1' })
export class InviteController {
  constructor(private householdsService: HouseholdsService) {}

  /**
   * Validates an invite code and returns household id and name.
   * Used by unauthenticated users before Google sign-in when joining an existing household.
   *
   * @param code - The invite code (inviteToken) shared by a household member
   * @returns householdId and householdName for display
   */
  @Get('validate')
  @Public()
  async validateInviteCode(
    @Query('code') code: string,
  ): Promise<{ householdId: string; householdName: string }> {
    return this.householdsService.validateInviteCode(code ?? '');
  }
}

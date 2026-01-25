import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ImportService } from '../services/import.service';
import { ImportRequestDto, ImportResponseDto } from '../dto/import.dto';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators';
import { HouseholdUtils } from '../../../common/utils';

/**
 * Controller for handling data import operations
 * Allows users to import recipes and shopping lists from guest mode to their household
 */
@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  /**
   * Import recipes and shopping lists into a household
   * Creates deduplication mappings to prevent duplicate imports
   *
   * @param user - The authenticated user payload
   * @param importRequest - The import payload containing recipes and shopping lists
   * @returns ImportResponseDto with counts and ID mappings
   * @throws BadRequestException if user doesn't belong to a household
   */
  @Post()
  async importData(
    @CurrentUser() user: CurrentUserPayload,
    @Body() importRequest: ImportRequestDto,
  ): Promise<ImportResponseDto> {
    HouseholdUtils.validateHouseholdMembership(user.householdId);
    return this.importService.executeImport(
      user.userId,
      user.householdId,
      importRequest,
    );
  }
}

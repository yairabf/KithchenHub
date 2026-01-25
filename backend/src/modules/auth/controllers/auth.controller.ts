import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import {
  GoogleAuthDto,
  GuestAuthDto,
  SyncDataDto,
  RefreshTokenDto,
} from '../dtos';
import { JwtAuthGuard } from '../../../common/guards';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators';
import { Public } from '../../../common/decorators/public.decorator';

/**
 * Authentication controller handling user authentication and data synchronization.
 *
 * Public endpoints:
 * - POST /auth/google - Google OAuth authentication
 * - POST /auth/guest - Guest user authentication
 * - POST /auth/refresh - Token refresh
 *
 * Protected endpoints:
 * - POST /auth/sync - Offline data synchronization
 */
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Authenticates a user using Google OAuth ID token.
   *
   * @param dto - Contains Google ID token
   * @returns Authentication response with tokens and user info
   */
  @Post('google')
  @Public()
  @HttpCode(HttpStatus.OK)
  async authenticateGoogle(@Body() dto: GoogleAuthDto) {
    return this.authService.authenticateGoogle(dto);
  }

  /**
   * Authenticates a guest user by device ID.
   *
   * @param dto - Contains device ID
   * @returns Authentication response with access token
   */
  @Post('guest')
  @Public()
  @HttpCode(HttpStatus.OK)
  async authenticateGuest(@Body() dto: GuestAuthDto) {
    return this.authService.authenticateGuest(dto);
  }

  /**
   * Synchronizes offline data to the cloud.
   * Requires authentication.
   *
   * @param user - Current authenticated user
   * @param dto - Data to synchronize (lists, recipes, chores)
   * @returns Sync result with status and conflicts
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncData(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SyncDataDto,
  ) {
    return this.authService.syncData(user.userId, dto);
  }

  /**
   * Refreshes an access token using a refresh token.
   *
   * @param dto - Contains refresh token
   * @returns New access token
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }
}

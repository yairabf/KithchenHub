import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import {
  GoogleAuthDto,
  SyncDataDto,
  RefreshTokenDto,
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from '../dtos';
import { CurrentUser, CurrentUserPayload } from '../../../common/decorators';
import { Public } from '../../../common/decorators/public.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Authentication controller handling user authentication and data synchronization.
 *
 * API Version: 1
 *
 * Public endpoints:
 * - POST /auth/google - Google OAuth authentication
 * - POST /auth/register - Email/password registration
 * - POST /auth/login - Email/password login
 * - POST /auth/verify-email - Verify email address
 * - POST /auth/resend-verification - Resend verification email
 * - POST /auth/refresh - Token refresh
 *
 * Protected endpoints:
 * - GET /auth/me - Get current user information
 * - POST /auth/sync - Offline data synchronization
 */
@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
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
   * Registers a new user with email and password.
   *
   * @param dto - Registration data (email, password, optional name and household)
   * @returns Success message (user must verify email before login)
   */
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Creates a new user account. Email verification required before login.',
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /**
   * Authenticates a user with email and password.
   *
   * @param dto - Login credentials (email and password)
   * @returns Authentication response with tokens and user info
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates user with email and password. Email must be verified.',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  /**
   * Verifies a user's email address using the verification token (GET endpoint for email links).
   *
   * @param token - Verification token from query parameter
   * @returns Authentication response with tokens (auto-login after verification)
   */
  @Get('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address (GET)',
    description:
      'Verifies user email via GET request (for email links) and automatically logs them in.',
  })
  async verifyEmailGet(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }
    return this.authService.verifyEmail({ token });
  }

  /**
   * Verifies a user's email address using the verification token (POST endpoint for API calls).
   *
   * @param dto - Contains the verification token
   * @returns Authentication response with tokens (auto-login after verification)
   */
  @Post('verify-email')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address (POST)',
    description:
      'Verifies user email via POST request and automatically logs them in.',
  })
  async verifyEmailPost(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  /**
   * Resends email verification email to the user.
   *
   * @param dto - Contains the user's email
   * @returns Success message
   */
  @Post('resend-verification')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend verification email',
    description: 'Sends a new email verification link to the user.',
  })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto);
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

  /**
   * Gets the current authenticated user's information.
   *
   * Used by mobile app after OAuth callback to retrieve full user object
   * without embedding sensitive data in the callback URL.
   *
   * @param user - Current authenticated user from JWT
   * @returns User information with household data
   */
  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user',
    description: 'Returns authenticated user information',
  })
  async getCurrentUser(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getCurrentUser(user.userId);
  }
}

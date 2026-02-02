import {
  Controller,
  Get,
  Query,
  Logger,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { OAuthStateService } from '../services/oauth-state.service';
import { AuthService } from '../services/auth.service';
import { loadConfiguration } from '../../../config/configuration';

/**
 * Controller handling OAuth authentication flows.
 * 
 * This controller implements backend-driven OAuth flows where all OAuth secrets
 * and token exchanges happen on the server side. The mobile app simply opens
 * a WebBrowser session to the start endpoint and receives a JWT via deep link.
 * 
 * Flow:
 * 1. Client opens /auth/google/start in browser
 * 2. Backend generates state token and redirects to Google
 * 3. Google redirects back to /auth/google/callback with code
 * 4. Backend validates state, exchanges code for tokens, creates user
 * 5. Backend redirects to app deep link with JWT: kitchen-hub://auth/callback?token=JWT
 */
@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);
  private readonly googleClientId: string;
  private readonly googleClientSecret: string;
  private readonly backendBaseUrl: string;
  private readonly appScheme: string;

  constructor(
    private readonly oauthStateService: OAuthStateService,
    private readonly authService: AuthService,
  ) {
    // Load OAuth configuration
    const config = loadConfiguration();
    this.googleClientId = config.google.clientId!;
    this.googleClientSecret = config.google.clientSecret!;
    this.backendBaseUrl = config.auth.backendBaseUrl;
    this.appScheme = config.auth.appScheme;
  }

  /**
   * Initiates Google OAuth flow.
   * 
   * GET /auth/google/start?householdId=xxx (optional)
   * 
   * Generates a state token with CSRF protection and redirects to Google's
   * authorization endpoint. The state token includes optional metadata like
   * householdId for join flows.
   * 
   * @param householdId - Optional household ID for join flow
   * @returns Redirect to Google authorization URL
   * 
   * @example
   * // Normal sign in
   * GET /auth/google/start
   * 
   * @example
   * // Sign in and join household
   * GET /auth/google/start?householdId=abc-123
   */
  @Get('google/start')
  @Public()
  @ApiOperation({
    summary: 'Start Google OAuth flow',
    description: 'Redirects to Google authorization page with state token',
  })
  @ApiQuery({
    name: 'householdId',
    required: false,
    description: 'Optional household ID for join flow',
  })
  @ApiQuery({
    name: 'redirect_uri',
    required: false,
    description: 'Optional web redirect URI (for web platform)',
  })
  async startGoogleAuth(
    @Query('householdId') householdId: string | undefined,
    @Query('redirect_uri') redirectUri: string | undefined,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    if (!this.googleClientId || !this.googleClientSecret) {
      this.logger.error('Google OAuth not configured');
      throw new BadRequestException('Google OAuth not configured');
    }

    // Generate state token with optional metadata
    const state = this.oauthStateService.generateState(
      householdId || redirectUri
        ? { householdId, redirectUri }
        : undefined,
    );

    // Build Google authorization URL
    const callbackUrl = `${this.backendBaseUrl}/api/v1/auth/google/callback`;
    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', this.googleClientId);
    googleAuthUrl.searchParams.set('redirect_uri', callbackUrl);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('state', state);
    // Add access_type=offline to get refresh token (optional)
    googleAuthUrl.searchParams.set('access_type', 'offline');
    // Add prompt=consent to force consent screen (ensures refresh token on repeat auth)
    googleAuthUrl.searchParams.set('prompt', 'consent');

    this.logger.log(
      `Starting Google OAuth flow${householdId ? ` for household: ${householdId}` : ''}`,
    );

    // Use Fastify's redirect
    return reply.redirect(302, googleAuthUrl.toString());
  }

  /**
   * Handles Google OAuth callback.
   * 
   * GET /auth/google/callback?code=...&state=...
   * 
   * Validates the state token (CSRF protection), exchanges the authorization
   * code for tokens, creates/finds the user, generates a JWT, and redirects
   * to the mobile app's deep link with the token.
   * 
   * @param code - Authorization code from Google
   * @param state - State token generated in /start
   * @param error - Error from Google (if user denied permission)
   * @returns Redirect to app deep link with token or error
   * 
   * @example
   * // Success redirect
   * kitchen-hub://auth/callback?token=JWT&isNewHousehold=true
   * 
   * @example
   * // Error redirect
   * kitchen-hub://auth/callback?error=access_denied&message=User%20denied%20permission
   */
  @Get('google/callback')
  @Public()
  @ApiOperation({
    summary: 'Handle Google OAuth callback',
    description: 'Exchanges code for tokens and redirects to app with JWT',
  })
  @ApiQuery({ name: 'code', required: false, description: 'Authorization code from Google' })
  @ApiQuery({ name: 'state', required: false, description: 'State token for CSRF protection' })
  @ApiQuery({ name: 'error', required: false, description: 'Error from Google' })
  async handleGoogleCallback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') error: string | undefined,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    try {
      // Check for error from Google (user denied permission)
      if (error) {
        this.logger.warn(`Google OAuth error: ${error}`);
        const errorUrl = this.buildErrorRedirect(
          error === 'access_denied' ? 'cancelled' : 'oauth_error',
          error === 'access_denied'
            ? 'User cancelled sign in'
            : `OAuth error: ${error}`,
        );
        return reply.redirect(302, errorUrl);
      }

      // Validate required parameters
      if (!code || !state) {
        this.logger.warn('Google callback missing code or state');
        const errorUrl = this.buildErrorRedirect(
          'invalid_request',
          'Missing required parameters',
        );
        return reply.redirect(302, errorUrl);
      }

      // Validate state token (CSRF protection)
      let decodedState;
      try {
        decodedState = this.oauthStateService.validateState(state);
      } catch (stateError) {
        this.logger.warn(
          `State validation failed: ${stateError instanceof Error ? stateError.message : String(stateError)}`,
        );
        const errorUrl = this.buildErrorRedirect(
          'invalid_state',
          'Invalid or expired state token',
        );
        return reply.redirect(302, errorUrl);
      }

      // Exchange code for tokens and authenticate user
      const callbackUrl = `${this.backendBaseUrl}/api/v1/auth/google/callback`;
      const authResponse = await this.authService.authenticateGoogleWithCode(
        code,
        callbackUrl,
        decodedState.metadata,
      );

      // Build success redirect with JWT
      // Use web redirect URI if provided (for web platform), otherwise use deep link
      const redirectUrl = decodedState.metadata?.redirectUri
        ? this.buildWebSuccessRedirect(
            decodedState.metadata.redirectUri,
            authResponse.accessToken,
            authResponse.isNewHousehold,
          )
        : this.buildSuccessRedirect(
            authResponse.accessToken,
            authResponse.householdId,
            authResponse.isNewHousehold,
          );

      this.logger.log(
        `Google OAuth success for user: ${authResponse.user.id}${decodedState.metadata?.householdId ? ` (joined household: ${decodedState.metadata.householdId})` : ''}`,
      );

      return reply.redirect(302, redirectUrl);
    } catch (error) {
      this.logger.error('Google OAuth callback failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      const errorUrl = this.buildErrorRedirect(
        'authentication_failed',
        'Failed to complete sign in',
      );
      return reply.redirect(302, errorUrl);
    }
  }

  /**
   * Builds success redirect URL to mobile app.
   * 
   * Format: kitchen-hub://auth/callback?token=JWT&isNewHousehold=true|false
   */
  private buildSuccessRedirect(
    accessToken: string,
    householdId?: string | null,
    isNewHousehold?: boolean,
  ): string {
    const url = new URL(`${this.appScheme}://auth/callback`);
    url.searchParams.set('token', accessToken);
    
    // Include isNewHousehold flag if provided
    if (isNewHousehold !== undefined) {
      url.searchParams.set('isNewHousehold', String(isNewHousehold));
    }

    return url.toString();
  }

  /**
   * Builds success redirect URL for web platform.
   * 
   * Format: {redirectUri}?token=JWT&isNewHousehold=true|false
   */
  private buildWebSuccessRedirect(
    redirectUri: string,
    accessToken: string,
    isNewHousehold?: boolean,
  ): string {
    const url = new URL(redirectUri);
    url.searchParams.set('token', accessToken);
    
    // Include isNewHousehold flag if provided
    if (isNewHousehold !== undefined) {
      url.searchParams.set('isNewHousehold', String(isNewHousehold));
    }

    return url.toString();
  }

  /**
   * Builds error redirect URL to mobile app.
   * 
   * Format: kitchen-hub://auth/callback?error=error_code&message=error_message
   */
  private buildErrorRedirect(errorCode: string, message: string): string {
    const url = new URL(`${this.appScheme}://auth/callback`);
    url.searchParams.set('error', errorCode);
    url.searchParams.set('message', message);
    return url.toString();
  }
}

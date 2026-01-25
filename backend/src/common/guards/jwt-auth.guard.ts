import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { loadConfiguration } from '../../config/configuration';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { CurrentUserPayload } from '../decorators/current-user.decorator';
import { AuthenticatedFastifyRequest } from '../types/fastify-request.interface';

/**
 * JWT authentication guard that validates Bearer tokens.
 * Skips validation for routes marked with @Public() decorator.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private reflector: Reflector,
  ) {}

  /**
   * Validates JWT token from Authorization header.
   *
   * @param context - Execution context containing request
   * @returns true if authentication succeeds
   * @throws UnauthorizedException if token is missing or invalid
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedFastifyRequest>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const config = loadConfiguration();
      const payload = await this.jwtService.verifyAsync(token, {
        secret: config.jwt.secret,
      });

      request.user = {
        userId: payload.sub as string,
        householdId: (payload.householdId as string | null) || null,
        email: payload.email as string | undefined,
        isGuest: (payload.isGuest as boolean) || false,
      } as CurrentUserPayload;
    } catch (error) {
      this.logger.warn('JWT token validation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }

  /**
   * Extracts Bearer token from Authorization header.
   */
  private extractTokenFromHeader(
    request: AuthenticatedFastifyRequest,
  ): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader || typeof authHeader !== 'string') {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}

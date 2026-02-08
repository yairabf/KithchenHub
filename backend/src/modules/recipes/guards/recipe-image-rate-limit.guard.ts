import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthenticatedFastifyRequest } from '../../../common/types/fastify-request.interface';
import { RecipeImageRateLimitService } from '../services/recipe-image-rate-limit.service';

@Injectable()
export class RecipeImageRateLimitGuard implements CanActivate {
  constructor(private readonly rateLimitService: RecipeImageRateLimitService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedFastifyRequest>();
    const response = context.switchToHttp().getResponse();

    const userId = request.user?.userId;
    if (!userId) {
      throw new UnauthorizedException('User not found');
    }

    const decision = this.rateLimitService.check(userId);
    if (!decision.allowed) {
      if (response?.header && decision.retryAfterSeconds) {
        response.header('Retry-After', String(decision.retryAfterSeconds));
      }
      throw new HttpException(
        'Upload rate limit exceeded. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

@Injectable()
export class HouseholdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: CurrentUserPayload = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.householdId) {
      throw new ForbiddenException('User does not belong to a household');
    }

    return true;
  }
}

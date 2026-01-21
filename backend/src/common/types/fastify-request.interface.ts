import { FastifyRequest } from 'fastify';
import { CurrentUserPayload } from '../decorators/current-user.decorator';

/**
 * Extended Fastify request with user payload.
 */
export interface AuthenticatedFastifyRequest extends FastifyRequest {
  user: CurrentUserPayload;
}

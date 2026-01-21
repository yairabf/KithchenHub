/**
 * JWT payload structure for access and refresh tokens.
 */
export interface JwtPayload {
  sub: string;
  email?: string;
  householdId?: string | null;
  isGuest: boolean;
}

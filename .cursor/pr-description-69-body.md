## The Issue

Currently, users can only authenticate using Google OAuth. This limits user adoption as some users prefer traditional email/password authentication or may not have Google accounts. Additionally, there was a bug where refresh token unique constraint violations (P2002) occurred when `verifyEmail()` and `login()` were called in quick succession, both generating tokens for the same user.

## Root Cause

**Authentication Limitation:**
- The authentication system only supported Google OAuth via `authenticateGoogle()` method
- No email/password registration or login endpoints existed
- User schema lacked password hash and email verification fields

**Refresh Token Bug:**
The `generateTokens()` method in `AuthService` was creating refresh tokens without checking for existing ones. When `verifyEmail()` generated tokens for auto-login and then `login()` was called immediately after, both attempted to create refresh tokens with the same token value, violating the unique constraint on the `refreshToken.token` field:

```typescript
// Before fix - no cleanup of existing tokens
await this.authRepository.createRefreshToken(user.id, refreshToken, expiresAt);
// This would fail with P2002 if a token already existed
```

## The Solution

**Email/Password Authentication:**
1. **Schema Updates**: Added `passwordHash`, `emailVerified`, `emailVerificationToken`, and `emailVerificationTokenExpiry` fields to the User model
2. **Registration Flow**: 
   - `POST /api/v1/auth/register` - Creates user with hashed password (bcrypt, 12 rounds)
   - Generates cryptographically secure verification token (32 bytes hex)
   - Sends verification email via `EmailService` (MVP: console logging, ready for SMTP)
   - Creates default household if none provided
3. **Email Verification**:
   - `GET /api/v1/auth/verify-email?token=...` - For email links
   - `POST /api/v1/auth/verify-email` - For API calls
   - Validates token and expiry, marks email as verified
   - Auto-logs user in by generating tokens
4. **Login Flow**:
   - `POST /api/v1/auth/login` - Validates credentials and email verification status
   - Returns JWT access and refresh tokens
   - Prevents login for unverified emails
5. **Resend Verification**:
   - `POST /api/v1/auth/resend-verification` - Generates new token and resends email

**Refresh Token Fix:**
Added `deleteAllRefreshTokensForUser()` method to `AuthRepository` and integrated it into `generateTokens()` with error handling:

```typescript
// After fix - cleanup before creation
try {
  await this.authRepository.deleteAllRefreshTokensForUser(user.id);
} catch (error) {
  this.logger.warn('Failed to delete existing refresh tokens, continuing with creation', {...});
  // Continue - worst case is we have multiple tokens (handled by unique constraint)
}
await this.authRepository.createRefreshToken(user.id, refreshToken, expiresAt);
```

This ensures only one active refresh token exists per user at any time, preventing unique constraint violations.

**Email Service:**
Created `EmailService` with MVP implementation that logs verification emails to console. The service is designed to be easily extended with SMTP (nodemailer), SendGrid, or AWS SES in production.

**Configuration:**
Added email configuration support with environment variables:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `EMAIL_FROM`
- `EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS` (default: 24)

## Testing

- [x] I have tested this PR on my local machine.
- [x] I have added unitests for the changes I made.

**Unit Tests:**
- Added `EmailService` mock to all `AuthService` test suites
- Added `deleteAllRefreshTokensForUser` mock to `AuthRepository` mocks
- Added parameterized tests for refresh token cleanup edge cases:
  - No existing tokens scenario
  - Successful deletion scenario
  - Deletion failure with graceful handling

**E2E Tests:**
Added comprehensive end-to-end test suite (`backend/test/auth-flow.e2e-spec.ts`) covering:
- User registration and email verification flow
- Household editing
- Custom shopping items creation and retrieval
- Shopping list CRUD operations (create, add items, remove items, delete)
- Recipe CRUD operations (create, edit, delete, list)
- Chore CRUD operations (create, edit, delete, list)
- Validates soft-delete behavior for all entities
- Tests complete user lifecycle from registration through all core features

**Test Coverage:**
- All new endpoints tested via e2e suite
- Edge cases covered (token expiry, duplicate emails, unverified login attempts)
- Refresh token cleanup tested with various failure scenarios

## Additional Changes

- [x] Docs changed - Added email configuration to `.env.example`
- [ ] UI Changed
- [x] Config Changed - Added email configuration support
- [x] Other - Added Prisma migration for schema changes, updated dependencies (bcrypt types)

**Files Changed:**
- 21 files modified/added
- 1,951 insertions, 20 deletions
- New DTOs: `RegisterDto`, `LoginDto`, `VerifyEmailDto`, `ResendVerificationDto`
- New service: `EmailService`
- New repository methods: `deleteAllRefreshTokensForUser`, `findUserByEmailVerificationToken`, `updateUserEmailVerification`
- New endpoints: `POST /auth/register`, `POST /auth/login`, `GET/POST /auth/verify-email`, `POST /auth/resend-verification`

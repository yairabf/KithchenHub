---
taskNumber: 001
taskName: api-versioning-infrastructure
epic: api-design-and-compatibility
created: 2026-01-28
status: Planning
---

# 001 - API Versioning Infrastructure

**Epic:** api-design-and-compatibility  
**Created:** 2026-01-28  
**Status:** Planning

## Overview

Design and implement a comprehensive API versioning strategy for the Kitchen Hub backend API. This includes:

- Establishing infrastructure to support multiple API versions simultaneously (`/api/v1`, `/api/v2`, etc.)
- Defining clear guidelines for when and how to introduce breaking changes
- Creating a deprecation policy and mechanisms for managing API lifecycle
- Documenting versioning best practices for the development team
- Ensuring backward compatibility while enabling API evolution

This foundation will protect existing mobile app builds while allowing the API to evolve safely.

## Current Status Analysis

### ✅ Already Implemented

1. **Global API Prefix:**
   - `backend/src/main.ts` sets global prefix `api/v1` via `app.setGlobalPrefix('api/v1')`
   - All endpoints currently accessible under `/api/v1/*`
   - Swagger documentation configured at `/api/docs`

2. **Payload-Level Versioning (Sync Endpoint):**
   - `SyncDataDto` includes optional `payloadVersion?: number` field
   - Current version: `1` (default if omitted)
   - Backend treats missing or `payloadVersion = 1` identically
   - This is **payload contract versioning**, not API-level versioning
   - Located in: `backend/src/modules/auth/dtos/sync-data.dto.ts`

3. **Module-Based Architecture:**
   - Clean separation of controllers, services, repositories
   - Controllers use simple paths: `@Controller('auth')`, `@Controller('recipes')`, etc.
   - All modules registered in `app.module.ts`

4. **Mobile API Client:**
   - Hardcoded base URL: `http://localhost:3000/api/v1` (dev) or production equivalent
   - Located in: `mobile/src/services/api.ts`
   - Uses fetch-based `ApiClient` class

5. **Response Format Standardization:**
   - `TransformInterceptor` wraps all responses in `ApiResponse<T>` format
   - `HttpExceptionFilter` standardizes error responses
   - Consistent response structure: `{ success: boolean, data: T, message?: string, errors?: string[] }`

### ❌ Missing Implementation

1. **API Version Routing Infrastructure:**
   - No NestJS versioning configuration (`app.enableVersioning()`)
   - No version-specific controllers or routing
   - Controllers not annotated with `@Version()` decorator
   - Cannot route requests to different versions based on URL path

2. **Version Management:**
   - No version constants or configuration
   - No version discovery endpoint
   - No version negotiation mechanism

3. **Deprecation Mechanisms:**
   - No deprecation headers or warnings
   - No sunset date tracking
   - No deprecation notices in responses

4. **Breaking Change Guidelines:**
   - No documented criteria for what constitutes a breaking change
   - No process for introducing breaking changes
   - No migration guides between versions

5. **Version Documentation:**
   - Swagger only shows single version (1.0)
   - No multi-version API documentation
   - No changelog or version history

6. **Mobile App Version Support:**
   - Mobile app hardcodes `/api/v1` in base URL
   - No version negotiation or fallback mechanism
   - No way to specify API version per request

## Architecture

### API Versioning Strategy

**Decision: URI Versioning (Path-Based)**

We will use **URI versioning** as the primary strategy because:
- Most visible and explicit for clients
- Easy to understand and debug
- Works well with REST principles
- Default NestJS versioning type
- Mobile apps can easily switch versions by changing base URL

**Alternative Considered:** Header versioning (`X-API-Version`) - Rejected because:
- Less visible, harder to debug
- Requires custom middleware
- Mobile apps would need to modify all requests

### Version Numbering

- **Semantic Versioning for API Versions:** Use integer versions (`v1`, `v2`, `v3`, etc.)
- **Major Version Increments:** Only for breaking changes
- **Minor Changes:** Additive changes stay in same version (new optional fields, new endpoints)
- **Payload Version vs API Version:** 
  - **API Version** (`/api/v1`, `/api/v2`): Controls entire endpoint contract (URLs, request/response shapes, behavior)
  - **Payload Version** (`payloadVersion` in sync DTO): Controls specific payload format within an API version
  - These are **orthogonal** - API v2 can support payloadVersion 1, 2, 3, etc.

### Version Lifecycle

```
┌─────────────┐
│   Current   │ ← Actively developed, new features added here
└──────┬──────┘
       │
       │ Breaking change needed
       │
┌──────▼──────┐
│   Deprecated│ ← Still supported, but marked for removal
└──────┬──────┘
       │
       │ After deprecation period (e.g., 6 months)
       │
┌──────▼──────┐
│   Sunset     │ ← No longer available, returns 410 Gone
└─────────────┘
```

### NestJS Versioning Implementation

NestJS supports versioning via:
1. **Global Versioning:** Enable at app level with `app.enableVersioning()`
2. **Controller-Level Versioning:** `@Controller({ path: 'auth', version: '1' })`
3. **Route-Level Versioning:** `@Version('2')` decorator on individual routes
4. **Multiple Versions:** Same controller can handle multiple versions

**Recommended Approach:**
- Enable global URI versioning **without defaultVersion** (require explicit version in URL)
- Use controller-level versioning via `@Controller({ path: 'X', version: '1' })` metadata
- Only use route-level `@Version()` decorator for rare selective endpoint updates (exception, not rule)
- Support multiple versions simultaneously
- **Critical:** Only `/api/v1/*` and `/api/v2/*` are canonical URLs - no `/api/*` default routing

### File Structure

```
backend/src/
├── common/
│   ├── versioning/
│   │   ├── api-version.constants.ts      # Version constants
│   │   ├── versioning.config.ts          # Versioning configuration
│   │   ├── deprecation.decorator.ts      # @Deprecated() decorator
│   │   ├── version.guard.ts              # Version validation guard
│   │   └── index.ts
│   └── ...
├── modules/
│   ├── auth/
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts       # v1 controller
│   │   │   └── auth.v2.controller.ts    # v2 controller (when needed)
│   │   └── ...
│   └── ...
└── main.ts                               # Enable versioning here
```

## Implementation Steps

### Phase 1: Infrastructure Setup

#### 1.1 Create Versioning Constants and Configuration

**Files:**
- `backend/src/common/versioning/api-version.constants.ts` (new)
- `backend/src/common/versioning/versioning.config.ts` (new)

**Tasks:**
- Define `CURRENT_API_VERSION = '1'` constant
- Define `SUPPORTED_API_VERSIONS = ['1']` array
- Define `DEPRECATED_API_VERSIONS: string[] = []` array
- Define `SUNSET_API_VERSIONS: string[] = []` array
- Create `VersioningConfig` interface with version metadata:
  ```typescript
  interface VersionMetadata {
    version: string;
    status: 'current' | 'deprecated' | 'sunset';
    deprecatedAt?: Date;
    sunsetAt?: Date;
    migrationGuide?: string;
  }
  ```
- Export helper functions:
  - `isVersionSupported(version: string): boolean`
  - `isVersionDeprecated(version: string): boolean`
  - `isVersionSunset(version: string): boolean`
  - `getVersionMetadata(version: string): VersionMetadata | null`

#### 1.2 Enable NestJS Versioning

**File:** `backend/src/main.ts`

**Tasks:**
- Import `VersioningType` from `@nestjs/common`
- Call `app.enableVersioning({ type: VersioningType.URI })` after app creation
- Remove hardcoded `api/v1` from `app.setGlobalPrefix()` - change to `app.setGlobalPrefix('api')`
- Update Swagger configuration for separate docs per version:
  - Create separate Swagger document for v1: `/api/docs/v1`
  - Use `DocumentBuilder` with version-specific filtering
  - NestJS Swagger doesn't auto-provide version dropdown - we generate separate docs
  - Future: When v2 exists, create `/api/docs/v2` separately
- Update console log messages to reflect new structure

**Code Changes:**
```typescript
// Before:
app.setGlobalPrefix('api/v1');

// After:
app.setGlobalPrefix('api');
app.enableVersioning({
  type: VersioningType.URI,
  // NO defaultVersion - require explicit /api/v1/* or /api/v2/* URLs
  // This ensures canonical URLs and prevents /api/* ambiguity
});
```

**Critical Constraint:**
- **Do NOT** allow `/api/*` to route to v1 by default
- Only `/api/v1/*` and `/api/v2/*` (when available) are valid public contracts
- Requests to `/api/*` without version should return 404 (or optional redirect/help response)
- This prevents URL ambiguity, caching issues, and makes deprecation measurement clear

#### 1.3 Add Version Metadata to Controllers

**Files:** All controller files in `backend/src/modules/*/controllers/`

**Tasks:**
- Update all controllers to use controller-level version metadata instead of `@Version()` decorator
- Change from `@Controller('auth')` to `@Controller({ path: 'auth', version: '1' })`
- This is cleaner, more consistent, and harder to miss on new controllers
- Update controller documentation to mention API version

**Example:**
```typescript
// Before:
@Controller('auth')
export class AuthController {
  // ...
}

// After:
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  // ...
}
```

**Enforcement:**
- Create controller metadata audit test (`backend/src/common/versioning/controller-metadata-audit.spec.ts`)
- Test ensures every controller has version metadata in `@Controller()` decorator
- Exception allowlist: Meta endpoints like `VersionController` (`/api/version`) can be unversioned
- Test fails if any controller lacks version metadata (prevents "mystery unversioned routes")
- This is critical to prevent accidental bypassing of versioning on new controllers

#### 1.4 Create Deprecation Infrastructure

**Files:**
- `backend/src/common/versioning/deprecation.decorator.ts` (new)
- `backend/src/common/versioning/version.guard.ts` (new)
- `backend/src/common/interceptors/deprecation.interceptor.ts` (new)

**Tasks:**

**Version-Wide Deprecation (Primary Mechanism):**
- Create `DeprecationInterceptor` that checks version metadata from constants/config
- If request version is in `DEPRECATED_API_VERSIONS`:
  - Automatically adds deprecation headers to **all responses** for that version:
    - `Deprecation: true`
    - `Sunset: <RFC 3339 date>` (if sunset date configured)
    - `Link: <migration-guide-url>; rel="deprecation"` (if migration guide configured)
- This applies automatically to all endpoints in a deprecated version
- No need to annotate every controller/route individually

**Endpoint-Level Deprecation (Optional, Rare):**
- Create `@Deprecated()` decorator for rare per-route deprecations:
  - `sunsetDate?: Date` - When endpoint will be removed
  - `migrationGuide?: string` - URL to migration guide
- `DeprecationInterceptor` applies both:
  - Version-wide headers (if version deprecated)
  - Endpoint-level headers (if route specifically deprecated)
- Use this only when deprecating individual endpoints within a current version

**Version Guard:**
- Create `VersionGuard` that:
  - Validates requested version is supported
  - Returns **404 Not Found** for unknown/unsupported versions (matches "route not found" semantics)
  - Returns **410 Gone** for sunset versions (with clear error message and migration link)
  - Allows requests through for supported/deprecated versions (deprecation headers added by interceptor)

#### 1.5 Create Version Discovery Endpoint

**File:** `backend/src/modules/health/controllers/version.controller.ts` (new)

**Tasks:**
- Create `GET /api/version` endpoint (public, no auth required, unversioned meta endpoint)
- This endpoint is intentionally **not versioned** (exception to version requirement)
- Returns supported versions, current version, deprecated versions, and docs links
- Response format:
  ```typescript
  {
    current: '1',
    supported: ['1'],
    deprecated: [],
    sunset: [],
    docs: {
      v1: '/api/docs/v1',
      // v2: '/api/docs/v2', // when available
    }
  }
  ```
- Add this controller to the allowlist in controller metadata audit test

### Phase 2: Documentation and Guidelines

#### 2.1 Create Breaking Change Guidelines Document

**File:** `backend/docs/api-versioning-guidelines.md` (new)

**Content:**
- **What is a Breaking Change?**
  - Removing or renaming endpoints
  - Removing required fields from requests
  - Changing field types (string → number)
  - Changing response structure in incompatible ways
  - Changing authentication/authorization requirements
  - Changing error response formats

- **What is NOT a Breaking Change?**
  - Adding new optional fields to requests
  - Adding new fields to responses
  - Adding new endpoints
  - Adding new query parameters
  - Changing internal implementation (as long as contract stays same)

- **Process for Introducing Breaking Changes:**
  1. Create new API version (e.g., `v2`)
  2. Implement new version alongside existing version
  3. Mark old version as deprecated with `@Deprecated()` decorator
  4. Update documentation and migration guide
  5. Announce deprecation to mobile team
  6. Wait for deprecation period (minimum 6 months for mobile apps)
  7. Sunset old version after migration period

#### 2.2 Create Deprecation Policy Document

**File:** `backend/docs/api-deprecation-policy.md` (new)

**Content:**
- **Deprecation Period:** Minimum 6 months for mobile apps (accounts for app store review cycles)
- **Deprecation Announcement:** 
  - Add deprecation headers to all responses
  - Update API documentation
  - Notify mobile team via Slack/email
  - Add to changelog
- **Sunset Process:**
  - After deprecation period, version returns 410 Gone
  - Log all sunset version requests for monitoring
  - Provide clear error message with migration guide link
- **Exception Handling:**
  - Critical security issues may have shorter deprecation periods
  - Document exceptions in deprecation notice

#### 2.3 Update API Documentation

**Files:**
- `backend/README.md` (update)
- `backend/src/main.ts` (Swagger config)

**Tasks:**
- Add API versioning section to README
- Document how to use different API versions
- Add examples of versioned endpoints
- **Swagger Configuration:** Generate separate OpenAPI docs per major version:
  - `/api/docs/v1` - Documents only v1 routes
  - `/api/docs/v2` - Documents only v2 routes (when available)
  - `/api/docs` - Optional index page listing available docs
- NestJS Swagger doesn't automatically provide version dropdown - we'll generate separate docs
- Add deprecation notices to deprecated endpoints in Swagger

### Phase 3: Mobile App Support

#### 3.1 Update Mobile API Client

**File:** `mobile/src/services/api.ts`

**Tasks:**
- Add `apiVersion` parameter to `ApiClient` constructor (default: '1')
- Update base URL construction to use version:
  ```typescript
  constructor(baseUrl: string, apiVersion: string = '1') {
    this.baseUrl = `${baseUrl}/v${apiVersion}`;
  }
  ```
- Add method to change API version dynamically: `setApiVersion(version: string)`
- **Version Negotiation (Future, Optional, with Safety Constraints):**
  - **Do NOT** auto-jump to "highest supported" immediately
  - Default stays v1 (safest)
  - Allow remote config / env override to opt-in to v2: `EXPO_PUBLIC_API_VERSION`
  - Only add negotiation once v2 is stable and mobile app feature flags/data models are ready
  - If negotiation is implemented, it must consider:
    - Minimum supported client build
    - API supported versions from `/api/version`
    - Feature flags on mobile app side
  - This prevents clients picking v2 before they're ready (critical for offline sync/idempotency safety)

#### 3.2 Add Version Configuration

**File:** `mobile/src/config/index.ts`

**Tasks:**
- Add `apiVersion: string` to config object
- Default to `'1'`
- Allow override via environment variable: `EXPO_PUBLIC_API_VERSION`

### Phase 4: Testing and Validation

#### 4.1 Create Versioning Tests

**Files:**
- `backend/src/common/versioning/versioning.config.spec.ts` (new)
- `backend/src/common/versioning/version.guard.spec.ts` (new)
- `backend/src/common/versioning/controller-metadata-audit.spec.ts` (new) - **Critical enforcement test**
- `backend/src/modules/health/controllers/version.controller.spec.ts` (new)

**Tasks:**
- Test version validation logic
- Test deprecation header injection
- Test sunset version handling (410 Gone)
- Test version discovery endpoint
- Parameterized tests for all version states

#### 4.2 Integration Tests

**Files:**
- `backend/src/modules/auth/controllers/auth.controller.spec.ts` (update)
- Add tests for versioned endpoints
- Test backward compatibility

#### 4.3 E2E Tests

**Tasks:**
- Test mobile app with v1 API
- Test version negotiation (when implemented)
- Test deprecation header handling in mobile app

## API Changes

### New Endpoints

1. **Version Discovery:**
   - `GET /api/version` (Public, unversioned meta endpoint)
   - Returns supported API versions and metadata

### Modified Endpoints

All existing endpoints remain unchanged in behavior, but now:
- **Only** accessible via `/api/v1/*` (explicit version required)
- **NOT** accessible via `/api/*` (no default routing - returns 404)
- Include version information in responses (via headers or metadata)
- This ensures canonical URLs and prevents ambiguity

### Future v2 Endpoints (Example)

When v2 is introduced:
- `POST /api/v2/auth/sync` - New sync endpoint with different contract
- `GET /api/v2/recipes` - Enhanced recipes endpoint
- Old v1 endpoints remain available until deprecated

## Breaking Change Decision Framework

### When to Create v2

Create a new API version when you need to:

1. **Remove Required Fields:**
   - ❌ v1: `POST /auth/sync` requires `lists`, `recipes`, `chores`
   - ✅ v2: `POST /auth/sync` only requires `entities` (unified structure)

2. **Change Field Types:**
   - ❌ v1: `quantity: number`
   - ✅ v2: `quantity: string` (to support fractional units like "1.5 cups")

3. **Change Response Structure:**
   - ❌ v1: Returns flat array
   - ✅ v2: Returns paginated response with metadata

4. **Change Authentication:**
   - ❌ v1: JWT Bearer token
   - ✅ v2: OAuth2 with different flow

5. **Remove Endpoints:**
   - ❌ v1: `GET /recipes/:id` exists
   - ✅ v2: Removed, use `GET /recipes?filter[id]=:id` instead

### When NOT to Create v2

Do NOT create a new version for:

1. **Additive Changes:**
   - ✅ Adding optional `tags?: string[]` to recipe creation
   - ✅ Adding new `GET /recipes/categories` endpoint
   - ✅ Adding new query parameter `?include=ingredients`

2. **Internal Changes:**
   - ✅ Changing database schema (as long as API contract unchanged)
   - ✅ Refactoring service layer (as long as behavior unchanged)
   - ✅ Performance optimizations (as long as response format unchanged)

3. **Bug Fixes:**
   - ✅ Fixing incorrect validation logic
   - ✅ Fixing incorrect response data
   - ✅ Fixing security vulnerabilities

## Deprecation Policy

### Timeline

```
┌─────────────────────────────────────────────────────────────┐
│  Current Version (v1)                                       │
│  - Actively developed                                       │
│  - New features added here                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Breaking change needed
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  New Version Released (v2)                                  │
│  - v1 marked as deprecated                                  │
│  - Deprecation headers added                                │
│  - Migration guide published                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Minimum 6 months
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Deprecation Period (6+ months)                            │
│  - v1 still functional                                      │
│  - v1 returns deprecation warnings                           │
│  - Mobile apps migrate to v2                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ After migration period
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Sunset (v1 removed)                                       │
│  - v1 returns 410 Gone                                      │
│  - All traffic must use v2                                  │
└─────────────────────────────────────────────────────────────┘
```

### Deprecation Headers

When a version is deprecated, all responses include:

```
Deprecation: true
Sunset: Sat, 31 Dec 2026 23:59:59 GMT
Link: <https://docs.kitchenhub.com/api/migration/v1-to-v2>; rel="deprecation"
```

### Communication Plan

1. **Internal Announcement:**
   - Slack message to mobile team
   - GitHub issue/discussion
   - Update project documentation

2. **External Documentation:**
   - Update API documentation
   - Add migration guide
   - Update changelog

3. **Monitoring:**
   - Track usage of deprecated versions
   - Alert if usage increases unexpectedly
   - Provide migration support

## Testing Strategy

### Unit Tests

- Version validation logic
- Deprecation header injection (version-wide and endpoint-level)
- Version guard behavior (404 for unknown, 410 for sunset)
- Version discovery endpoint
- **Controller Metadata Audit Test (Critical):**
  - Scans all controllers in the codebase
  - Verifies each controller has `version` in `@Controller()` metadata
  - Allows explicit exceptions (e.g., `VersionController` for `/api/version`)
  - Fails build/test if any controller lacks version metadata
  - Prevents accidental unversioned routes

### Integration Tests

- Test v1 endpoints still work via `/api/v1/*` (explicit version)
- Test `/api/*` without version returns 404 (no default routing)
- Test version routing to correct controllers
- Test deprecation headers (version-wide automatic injection)
- Test sunset behavior (410 Gone with migration link)

### Contract Tests

- Verify API contract hasn't changed unexpectedly
- Test backward compatibility
- Validate response formats

### Mobile App Tests

- Test mobile app with v1 API
- Test version negotiation (future)
- Test error handling for sunset versions

## Success Criteria

1. ✅ Multiple API versions can run simultaneously
2. ✅ All existing v1 endpoints work unchanged
3. ✅ Version discovery endpoint returns correct information
4. ✅ Deprecation headers are added to deprecated versions
5. ✅ Sunset versions return 410 Gone
6. ✅ Mobile app can specify API version
7. ✅ Documentation clearly explains versioning strategy
8. ✅ Breaking change guidelines are documented
9. ✅ Deprecation policy is defined and documented
10. ✅ Tests cover all versioning scenarios

## Migration Path for Existing Code

### Backend

1. **No Breaking Changes Required:**
   - All existing endpoints continue to work via `/api/v1/*`
   - Update controllers to use `@Controller({ path: 'X', version: '1' })` metadata
   - Enable versioning in `main.ts` without defaultVersion
   - Add controller metadata audit test to enforce versioning

2. **Gradual Migration:**
   - Start with infrastructure (Phase 1)
   - Add versioning to controllers one module at a time
   - Test each module after adding versioning

### Mobile App

1. **Backward Compatible:**
   - Existing code continues to work
   - API client defaults to v1
   - No immediate changes required

2. **Future Migration:**
   - When v2 is available, update API client version
   - Test thoroughly before switching
   - Can roll back to v1 if issues found

## Future Considerations

### Version Negotiation

**Future enhancement (optional, with safety constraints):**

Mobile app can negotiate API version on startup, but only with proper safeguards:
1. Call `/api/version` endpoint to get supported versions
2. **Do NOT** auto-select highest version - default stays v1
3. Version selection must consider:
   - Minimum supported client build (from mobile app)
   - Feature flags on mobile app side
   - API supported versions from server
4. Only opt-in to v2 via remote config / env variable
5. Fallback to v1 if negotiation fails or if client isn't ready
6. This prevents clients picking v2 before their data models/sync flows are ready

**Rationale:** Offline sync and idempotency machinery requires careful backward compatibility. Auto-upgrading to v2 could break clients that aren't ready.

### Payload Versioning vs API Versioning

- **API Versioning:** Controls entire endpoint contract
- **Payload Versioning:** Controls specific payload format (already implemented in sync endpoint)
- These work together:
  - `/api/v2/auth/sync` can support `payloadVersion: 1, 2, 3`
  - Different API versions can support different payload version ranges

### GraphQL Consideration

If GraphQL is introduced in the future:
- GraphQL has its own versioning strategy (schema evolution)
- Can coexist with REST API versions
- Document how they relate

## Related Tasks

- **Sync Endpoint Payload Versioning:** Already implemented (`payloadVersion` field)
- **Schema Versioning:** Mobile app storage schema versioning (separate concern)
- **API Documentation:** Swagger/OpenAPI documentation updates

## Notes

- This is **infrastructure-only** - no breaking changes to existing API
- All existing endpoints continue to work via `/api/v1/*` (explicit version required)
- **Critical:** `/api/*` without version returns 404 - no default routing to prevent URL ambiguity
- Versioning is opt-in for new versions (v2, v3, etc.)
- v1 will remain supported indefinitely (until explicitly deprecated)
- Payload versioning (`payloadVersion` in sync DTO) is separate from API versioning and will continue to work alongside it
- Controller-level version metadata (`@Controller({ version: '1' })`) is preferred over `@Version()` decorator for consistency
- Version-wide deprecation is primary mechanism; endpoint-level deprecation is rare exception
- Unknown versions return 404 (not 400) to match "route not found" semantics
- Swagger docs are separate per version (`/api/docs/v1`, `/api/docs/v2`) rather than combined

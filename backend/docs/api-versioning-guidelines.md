# API Versioning Guidelines

This document outlines the guidelines for API versioning in the Kitchen Hub backend API.

## What is a Breaking Change?

A **breaking change** is any modification to the API that would cause existing clients to fail or behave incorrectly. Breaking changes require creating a new API version.

### Breaking Changes Include:

1. **Removing or Renaming Endpoints:**
   - ❌ v1: `GET /recipes/:id` exists
   - ✅ v2: Removed, use `GET /recipes?filter[id]=:id` instead

2. **Removing Required Fields from Requests:**
   - ❌ v1: `POST /auth/sync` requires `lists`, `recipes`, `chores`
   - ✅ v2: `POST /auth/sync` only requires `entities` (unified structure)

3. **Changing Field Types:**
   - ❌ v1: `quantity: number`
   - ✅ v2: `quantity: string` (to support fractional units like "1.5 cups")

4. **Changing Response Structure in Incompatible Ways:**
   - ❌ v1: Returns flat array `[{ id, name }]`
   - ✅ v2: Returns paginated response `{ data: [...], meta: { total, page } }`

5. **Changing Authentication/Authorization Requirements:**
   - ❌ v1: JWT Bearer token
   - ✅ v2: OAuth2 with different flow

6. **Changing Error Response Formats:**
   - ❌ v1: `{ error: "message" }`
   - ✅ v2: `{ success: false, message: "message", code: "ERROR_CODE" }`

## What is NOT a Breaking Change?

These changes can be made within the same API version:

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

## Process for Introducing Breaking Changes

When you need to introduce a breaking change:

1. **Create New API Version:**
   - Create new version constant in `api-version.constants.ts`
   - Add version to `SUPPORTED_API_VERSIONS`
   - Create new controller files (e.g., `auth.v2.controller.ts`) or use `@Version('2')` decorator for selective updates

2. **Implement New Version Alongside Existing:**
   - Both versions run simultaneously
   - Old version remains fully functional
   - New version implements the breaking changes

3. **Mark Old Version as Deprecated:**
   - Move old version from `SUPPORTED_API_VERSIONS` to `DEPRECATED_API_VERSIONS`
   - Add deprecation metadata (dates, migration guide)
   - Deprecation headers are automatically added to all responses

4. **Update Documentation:**
   - Document changes in API documentation
   - Create migration guide
   - Update Swagger docs for new version

5. **Announce Deprecation:**
   - Notify mobile team via Slack/email
   - Add to changelog
   - Update project documentation

6. **Wait for Deprecation Period:**
   - Minimum 6 months for mobile apps (accounts for app store review cycles)
   - Monitor usage of deprecated version
   - Provide migration support

7. **Sunset Old Version:**
   - After migration period, move version to `SUNSET_API_VERSIONS`
   - Version returns 410 Gone with migration guide link
   - Log all sunset version requests for monitoring

## Version Numbering

- **Semantic Versioning for API Versions:** Use integer versions (`v1`, `v2`, `v3`, etc.)
- **Major Version Increments:** Only for breaking changes
- **Minor Changes:** Additive changes stay in same version (new optional fields, new endpoints)

## Payload Version vs API Version

- **API Version** (`/api/v1`, `/api/v2`): Controls entire endpoint contract (URLs, request/response shapes, behavior)
- **Payload Version** (`payloadVersion` in sync DTO): Controls specific payload format within an API version
- These are **orthogonal** - API v2 can support payloadVersion 1, 2, 3, etc.

## Examples

### Example 1: Adding Optional Field (No Breaking Change)

**v1:**
```typescript
POST /api/v1/recipes
{
  "name": "Pasta",
  "ingredients": [...]
}
```

**v1 (updated):**
```typescript
POST /api/v1/recipes
{
  "name": "Pasta",
  "ingredients": [...],
  "tags": ["italian", "dinner"]  // New optional field
}
```

✅ **No new version needed** - existing clients continue to work.

### Example 2: Changing Field Type (Breaking Change)

**v1:**
```typescript
POST /api/v1/recipes
{
  "servings": 4  // number
}
```

**v2:**
```typescript
POST /api/v2/recipes
{
  "servings": "4-6"  // string to support ranges
}
```

❌ **New version required** - v1 clients sending numbers would fail.

### Example 3: Removing Endpoint (Breaking Change)

**v1:**
- `GET /api/v1/recipes/:id` exists

**v2:**
- `GET /api/v1/recipes/:id` removed
- Use `GET /api/v2/recipes?filter[id]=:id` instead

❌ **New version required** - v1 clients using the old endpoint would fail.

## Best Practices

1. **Minimize Breaking Changes:** Design APIs to be extensible from the start
2. **Use Optional Fields:** Prefer optional fields over required ones
3. **Version Early:** If unsure, create a new version rather than risk breaking clients
4. **Document Changes:** Always document what changed and why
5. **Provide Migration Guides:** Help clients migrate smoothly
6. **Monitor Usage:** Track usage of deprecated versions
7. **Communicate Clearly:** Announce deprecations well in advance

## Related Documentation

- [API Deprecation Policy](./api-deprecation-policy.md)
- [Backend README](../README.md)

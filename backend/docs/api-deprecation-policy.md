# API Deprecation Policy

This document outlines the deprecation policy for the Kitchen Hub backend API.

## Deprecation Timeline

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

## Deprecation Period

**Minimum 6 months** for mobile apps. This accounts for:
- App store review cycles (iOS: 1-7 days, Android: 1-3 days)
- User update adoption time
- Development and testing time for migration
- Rollout and monitoring period

## Deprecation Announcement

When a version is deprecated, the following actions are taken:

1. **Automatic Deprecation Headers:**
   - All responses from deprecated versions include:
     - `Deprecation: true`
     - `Sunset: <RFC 3339 date>` (if sunset date configured)
     - `Link: <migration-guide-url>; rel="deprecation"` (if migration guide configured)

2. **API Documentation Updates:**
   - Deprecated endpoints marked in Swagger documentation
   - Migration guide added to documentation
   - Changelog updated

3. **Internal Communication:**
   - Slack message to mobile team
   - GitHub issue/discussion created
   - Project documentation updated

4. **External Documentation:**
   - API documentation updated with deprecation notices
   - Migration guide published
   - Changelog entry added

## Deprecation Headers

When a version is deprecated, all responses include:

```
Deprecation: true
Sunset: Sat, 31 Dec 2026 23:59:59 GMT
Link: <https://docs.kitchenhub.com/api/migration/v1-to-v2>; rel="deprecation"
```

### Header Details

- **Deprecation:** Always `true` for deprecated versions
- **Sunset:** RFC 3339 formatted date when the version will be removed
- **Link:** URL to migration guide with `rel="deprecation"`

## Sunset Process

After the deprecation period:

1. **Version Moved to Sunset:**
   - Version moved from `DEPRECATED_API_VERSIONS` to `SUNSET_API_VERSIONS` in `api-version.constants.ts`

2. **410 Gone Response:**
   - All requests to sunset versions return `410 Gone`
   - Error message includes migration guide link
   - Clear indication that version is no longer available

3. **Monitoring:**
   - All sunset version requests are logged
   - Alerts if usage increases unexpectedly
   - Track migration progress

4. **Error Response Format:**
   ```json
   {
     "success": false,
     "message": "API version 1 has been sunset and is no longer available. See https://docs.kitchenhub.com/api/migration/v1-to-v2 for migration instructions.",
     "statusCode": 410
   }
   ```

## Exception Handling

**Critical Security Issues:**
- Security vulnerabilities may have shorter deprecation periods
- Minimum 30 days for critical security fixes
- Document exception in deprecation notice
- Coordinate with mobile team for urgent updates

**Breaking Security Changes:**
- If a security fix requires a breaking change, coordinate closely with mobile team
- Provide migration path and support
- Consider temporary workarounds if possible

## Communication Plan

### Internal Announcement

1. **Slack Message:**
   - Post in #mobile-dev channel
   - Include deprecation timeline
   - Link to migration guide
   - Schedule follow-up meeting if needed

2. **GitHub:**
   - Create issue/discussion
   - Tag mobile team members
   - Link to migration guide

3. **Project Documentation:**
   - Update README with deprecation notice
   - Add to changelog

### External Documentation

1. **API Documentation:**
   - Update Swagger docs with deprecation notices
   - Add migration guide link
   - Document breaking changes

2. **Migration Guide:**
   - Step-by-step migration instructions
   - Code examples
   - Common issues and solutions

3. **Changelog:**
   - Document deprecation
   - List breaking changes
   - Provide migration timeline

## Monitoring

### Usage Tracking

- Track requests to deprecated versions
- Monitor migration progress
- Alert if usage increases unexpectedly
- Provide usage statistics to mobile team

### Metrics to Track

- Number of requests per version
- Percentage of traffic on deprecated versions
- Error rates for sunset versions
- Migration completion rate

### Alerts

- Alert if deprecated version usage increases
- Alert if sunset version receives significant traffic
- Alert if migration is not progressing as expected

## Support

During the deprecation period:

1. **Migration Support:**
   - Answer questions from mobile team
   - Provide code examples
   - Help troubleshoot migration issues

2. **Documentation:**
   - Keep migration guide up to date
   - Add FAQ section
   - Document common issues

3. **Communication:**
   - Regular check-ins with mobile team
   - Address concerns promptly
   - Provide timeline updates if needed

## Best Practices

1. **Plan Ahead:**
   - Announce deprecations well in advance
   - Provide clear migration timeline
   - Give mobile team time to plan

2. **Clear Communication:**
   - Use clear, concise language
   - Provide concrete examples
   - Link to detailed documentation

3. **Monitor Progress:**
   - Track migration progress
   - Provide regular updates
   - Adjust timeline if needed

4. **Be Flexible:**
   - Extend deprecation period if needed
   - Provide additional support if requested
   - Consider exceptions for critical issues

## Related Documentation

- [API Versioning Guidelines](./api-versioning-guidelines.md)
- [Backend README](../README.md)

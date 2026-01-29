# Structured Logging Guide

This guide explains how to use structured logging in the Kitchen Hub backend API.

## Overview

The API uses **Pino** for structured JSON logging, which provides:
- Fast, low-overhead logging
- JSON-formatted output for log aggregation
- Pretty-printed logs in development
- Request correlation IDs
- Contextual information in all logs

## Configuration

### Environment Variables

```bash
# Log level: fatal, error, warn, info, debug, trace
LOG_LEVEL=info

# Log format: json (production) or pretty (development)
LOG_FORMAT=json
```

### Default Behavior

- **Development**: Pretty-printed logs (`LOG_FORMAT=pretty` or `NODE_ENV=development`)
- **Production**: JSON-formatted logs (`LOG_FORMAT=json`)

## Using the Logger

### In Services

```typescript
import { Injectable } from '@nestjs/common';
import { StructuredLoggerService } from '../common/logger/structured-logger.service';

@Injectable()
export class MyService {
  constructor(private readonly logger: StructuredLoggerService) {}

  async doSomething() {
    this.logger.log('Processing request', 'MyService');
    
    try {
      // ... your code
      this.logger.log('Request processed successfully', 'MyService');
    } catch (error) {
      this.logger.error('Failed to process request', error.stack, 'MyService');
    }
  }
}
```

### With Context

```typescript
this.logger.logWithContext(
  'info',
  'User action completed',
  {
    userId: 'user-123',
    action: 'create-recipe',
    recipeId: 'recipe-456',
    duration: 150,
  }
);
```

### Request Logging

Request/response logging is automatic via the `LoggingInterceptor`. Each request is logged with:
- Request ID (correlation ID)
- HTTP method and path
- Response status code
- Response time
- User ID (if authenticated)

## Log Format

### JSON Format (Production)

```json
{
  "level": 30,
  "time": "2026-01-29T12:00:00.000Z",
  "msg": "Request completed",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "method": "GET",
  "path": "/api/v1/recipes",
  "statusCode": 200,
  "responseTime": 45,
  "userId": "user-id"
}
```

### Pretty Format (Development)

```
[12:00:00.000] INFO: Request completed
    requestId: "550e8400-e29b-41d4-a716-446655440000"
    method: "GET"
    path: "/api/v1/recipes"
    statusCode: 200
    responseTime: 45
    userId: "user-id"
```

## Log Levels

| Level | Use Case | Example |
|-------|----------|---------|
| `fatal` | Application cannot continue | Database connection lost |
| `error` | Error occurred but app continues | API call failed |
| `warn` | Warning condition | Deprecated API used |
| `info` | Informational message | Request completed |
| `debug` | Debug information | Query executed |
| `trace` | Very detailed tracing | Function entry/exit |

## Request Correlation

Every request gets a unique `requestId` that:
- Is generated automatically (or uses `X-Request-Id` header if provided)
- Is added to response headers as `X-Request-Id`
- Is included in all logs for that request
- Can be used to trace a request across services

### Using Request ID in Logs

The `LoggingInterceptor` automatically adds `requestId` to all request logs. To include it in service logs:

```typescript
import { Injectable } from '@nestjs/common';
import { StructuredLoggerService } from '../common/logger/structured-logger.service';

@Injectable()
export class MyService {
  constructor(private readonly logger: StructuredLoggerService) {}

  async processData(requestId: string, data: unknown) {
    this.logger.logWithContext(
      'info',
      'Processing data',
      {
        requestId,
        dataSize: JSON.stringify(data).length,
      }
    );
  }
}
```

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ✅ Good
this.logger.error('Database query failed', error.stack, 'DatabaseService');
this.logger.warn('Rate limit approaching', 'ApiService');
this.logger.info('User logged in', 'AuthService');

// ❌ Bad
this.logger.error('User logged in', undefined, 'AuthService'); // Wrong level
this.logger.info('Database connection lost', undefined, 'DatabaseService'); // Wrong level
```

### 2. Include Context

```typescript
// ✅ Good
this.logger.logWithContext('info', 'Recipe created', {
  recipeId: recipe.id,
  userId: user.id,
  householdId: household.id,
});

// ❌ Bad
this.logger.log('Recipe created', 'RecipeService'); // No context
```

### 3. Don't Log Sensitive Data

```typescript
// ✅ Good
this.logger.logWithContext('info', 'User authenticated', {
  userId: user.id,
  // Don't log password or tokens
});

// ❌ Bad
this.logger.logWithContext('info', 'User authenticated', {
  userId: user.id,
  password: user.password, // NEVER log passwords
  token: token, // NEVER log tokens
});
```

### 4. Use Structured Data

```typescript
// ✅ Good - structured data
this.logger.logWithContext('info', 'Request processed', {
  requestId,
  userId,
  duration: 150,
  status: 'success',
});

// ❌ Bad - string concatenation
this.logger.log(`Request ${requestId} processed by user ${userId} in ${duration}ms`, 'Service');
```

### 5. Error Logging

```typescript
// ✅ Good - include stack trace
try {
  await riskyOperation();
} catch (error) {
  this.logger.error(
    'Risky operation failed',
    error instanceof Error ? error.stack : String(error),
    'MyService'
  );
}

// ✅ Also good - with context
try {
  await riskyOperation();
} catch (error) {
  this.logger.logWithContext('error', 'Risky operation failed', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    context: 'additional context',
  });
}
```

## Log Aggregation

Structured JSON logs work seamlessly with log aggregation services:

### AWS CloudWatch Logs

Logs are automatically parsed. Query example:
```
fields @timestamp, @message, requestId, method, path, statusCode
| filter statusCode >= 500
| sort @timestamp desc
```

### GCP Cloud Logging

Logs are automatically parsed. Query example:
```
jsonPayload.statusCode>=500
jsonPayload.requestId="550e8400-e29b-41d4-a716-446655440000"
```

### Elasticsearch/OpenSearch

JSON logs are automatically indexed. Search example:
```json
{
  "query": {
    "match": {
      "requestId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }
}
```

## Performance Considerations

1. **Log Level**: Use `info` or higher in production to reduce log volume
2. **Context Size**: Keep log context objects small (don't log large payloads)
3. **Async Logging**: Pino uses async logging by default for better performance
4. **Sample Rate**: Consider sampling for high-volume endpoints

## Troubleshooting

### Logs Not Appearing

1. Check `LOG_LEVEL` - logs below the configured level won't appear
2. Verify `LOG_FORMAT` is set correctly
3. Check application has write permissions

### Logs Too Verbose

1. Increase `LOG_LEVEL` (e.g., from `debug` to `info`)
2. Remove unnecessary debug logs
3. Use conditional logging for debug information

### Missing Request IDs

1. Ensure `RequestContextInterceptor` is registered in `AppModule`
2. Check that interceptors are in the correct order
3. Verify `X-Request-Id` header is being set in responses

---

## Additional Resources

- [Pino Documentation](https://getpino.io/)
- [NestJS Logging](https://docs.nestjs.com/techniques/logger)

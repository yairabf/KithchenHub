# Monitoring Setup Guide

This guide provides step-by-step instructions for setting up cloud-agnostic monitoring for the Kitchen Hub backend API. All monitoring solutions work across AWS, GCP, Azure, and other cloud platforms.

## Table of Contents

- [Sentry Error Tracking](#sentry-error-tracking)
- [Uptime Monitoring](#uptime-monitoring)
- [Health Check Endpoints](#health-check-endpoints)
- [Log Aggregation](#log-aggregation)
- [Alert Configuration](#alert-configuration)
- [Dashboard Setup](#dashboard-setup)

---

## Sentry Error Tracking

Sentry provides real-time error tracking, performance monitoring, and release tracking.

### Step 1: Create Sentry Account and Project

1. Go to [https://sentry.io](https://sentry.io) and sign up for a free account
2. Create a new project:
   - Select **Node.js** as the platform
   - Name it "Kitchen Hub Backend" (or similar)
   - Choose your organization

### Step 2: Get Your DSN

1. After creating the project, Sentry will show you a **DSN** (Data Source Name)
2. It looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`
3. Copy this DSN - you'll need it for configuration

### Step 3: Configure Environment Variables

Add the following to your environment variables:

```bash
# Required: Your Sentry project DSN
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Optional: Environment name (defaults to NODE_ENV)
SENTRY_ENVIRONMENT=production

# Optional: Performance monitoring sample rate (0.0 to 1.0, default: 0.1)
SENTRY_TRACES_SAMPLE_RATE=0.1
```

**For Production:**
- Set `SENTRY_ENVIRONMENT=production`
- Use a lower `SENTRY_TRACES_SAMPLE_RATE` (0.1 = 10% of requests) to reduce overhead

**For Development:**
- Set `SENTRY_ENVIRONMENT=development`
- Use a higher sample rate (0.5-1.0) for more detailed monitoring

### Step 4: Verify Integration

1. Deploy your application with Sentry configured
2. Trigger a test error (or wait for a real one)
3. Check your Sentry dashboard - you should see the error appear within seconds

### Step 5: Configure Alerts (Optional)

1. In Sentry, go to **Alerts** → **Create Alert Rule**
2. Set up alerts for:
   - **New Issues**: Get notified when new errors occur
   - **Error Rate**: Alert if error rate exceeds threshold
   - **Performance Issues**: Alert on slow requests

---

## Uptime Monitoring

Uptime monitoring services check your health endpoints at regular intervals and alert you if the service is down.

### Recommended Services

#### Option 1: UptimeRobot (Free Tier)

**Setup:**
1. Go to [https://uptimerobot.com](https://uptimerobot.com) and sign up
2. Click **Add New Monitor**
3. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Kitchen Hub API
   - **URL**: `https://your-api-domain.com/api/health/ready`
   - **Monitoring Interval**: 5 minutes (free tier)
   - **Alert Contacts**: Add your email/Slack

**Health Endpoint:** Use `/api/health/ready` for readiness checks

#### Option 2: Pingdom

**Setup:**
1. Go to [https://www.pingdom.com](https://www.pingdom.com)
2. Create a new uptime check
3. Configure:
   - **URL**: `https://your-api-domain.com/api/health/ready`
   - **Check Interval**: 1-5 minutes
   - **Alert Settings**: Configure email/SMS alerts

#### Option 3: StatusCake

**Setup:**
1. Go to [https://www.statuscake.com](https://www.statuscake.com)
2. Create a new uptime test
3. Configure:
   - **Website URL**: `https://your-api-domain.com/api/health/ready`
   - **Test Interval**: 1-5 minutes
   - **Contact Group**: Add your notification preferences

#### Option 4: AWS CloudWatch Synthetics (AWS Deployments)

**Setup:**
1. Go to AWS CloudWatch → Synthetics
2. Create a new canary
3. Configure:
   - **Script**: Use the following:
   ```javascript
   var synthetics = require('Synthetics');
   const log = require('SyntheticsLogger');

   exports.handler = async () => {
     const requestOptions = {
       hostname: 'your-api-domain.com',
       method: 'GET',
       path: '/api/health/ready',
       port: 443,
       protocol: 'https:',
     };

     return await synthetics.executeHttpStep('Health Check', requestOptions);
   };
   ```
   - **Schedule**: Every 1-5 minutes
   - **Alerts**: Configure SNS topic for notifications

#### Option 5: GCP Uptime Checks (GCP Deployments)

**Setup:**
1. Go to GCP Console → Monitoring → Uptime Checks
2. Create a new uptime check
3. Configure:
   - **Resource Type**: URL
   - **URL**: `https://your-api-domain.com/api/health/ready`
   - **Check Frequency**: 1-5 minutes
   - **Alert Policy**: Create alert for when check fails

---

## Health Check Endpoints

The API provides multiple health check endpoints for different use cases:

### Endpoints

| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| `GET /api/health` | Basic health check | Simple liveness probe |
| `GET /api/health/live` | Liveness probe | Container orchestration (Kubernetes, ECS) |
| `GET /api/health/ready` | Readiness probe | Load balancer health checks, uptime monitoring |
| `GET /api/health/detailed` | Detailed status | Debugging, comprehensive monitoring |

### Response Examples

**Basic Health (`/api/health`):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-29T12:00:00.000Z"
}
```

**Readiness (`/api/health/ready`):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-29T12:00:00.000Z",
  "checks": {
    "database": {
      "status": "up"
    }
  }
}
```

**Detailed (`/api/health/detailed`):**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-29T12:00:00.000Z",
  "uptime": 3600,
  "version": "0.0.1",
  "checks": {
    "database": {
      "status": "up",
      "latency": 5
    },
    "memory": {
      "used": 128,
      "total": 512,
      "percentage": 25
    }
  }
}
```

### Status Codes

- **200 OK**: Service is healthy
- **503 Service Unavailable**: Service is unhealthy (for `/api/health/ready` and `/api/health/detailed`)

### Configuration for Container Orchestration

**Kubernetes:**
```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

**AWS ECS:**
```json
{
  "healthCheck": {
    "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health/ready || exit 1"],
    "interval": 30,
    "timeout": 5,
    "retries": 3,
    "startPeriod": 60
  }
}
```

**GCP Cloud Run:**
- Health check path: `/api/health/ready`
- Configure in Cloud Run service settings

---

## Log Aggregation

The API uses structured JSON logging that works with all major log aggregation services.

### Log Format

Logs are output in JSON format in production:

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

### Cloud-Specific Log Aggregation

#### AWS CloudWatch Logs

**Automatic (ECS):**
- Logs are automatically sent to CloudWatch if configured in task definition
- Log group: `/ecs/kitchen-hub-api`

**Manual Setup:**
1. Install CloudWatch Logs agent (if not using ECS)
2. Configure log group and stream
3. JSON logs are automatically parsed

**Query Example:**
```
fields @timestamp, @message, requestId, method, path, statusCode
| filter statusCode >= 500
| sort @timestamp desc
```

#### GCP Cloud Logging

**Automatic (Cloud Run):**
- Logs are automatically sent to Cloud Logging
- View in: Cloud Console → Logging → Logs Explorer

**Query Example:**
```
resource.type="cloud_run_revision"
resource.labels.service_name="kitchen-hub-api"
jsonPayload.statusCode>=500
```

#### Azure Monitor

**Setup:**
1. Enable Application Insights or Log Analytics
2. Configure log collection
3. JSON logs are automatically parsed

---

## Alert Configuration

### Sentry Alerts

1. **New Issues Alert:**
   - Go to Sentry → Alerts → Create Alert Rule
   - Condition: "A new issue is created"
   - Action: Send email/Slack notification

2. **Error Rate Alert:**
   - Condition: "The error rate of an issue is greater than X%"
   - Threshold: 5% (adjust based on your needs)
   - Action: Send notification

3. **Performance Alert:**
   - Condition: "The p95 transaction duration is greater than X ms"
   - Threshold: 1000ms (adjust based on your needs)

### Uptime Monitoring Alerts

Configure alerts in your uptime monitoring service:

- **Downtime Alert**: Trigger when health check fails
- **Response Time Alert**: Alert if response time exceeds threshold
- **SSL Certificate Alert**: Alert if SSL certificate is expiring

### Log-Based Alerts

#### AWS CloudWatch Alarms

```bash
# Create alarm for high error rate
aws cloudwatch put-metric-alarm \
  --alarm-name kitchen-hub-high-error-rate \
  --alarm-description "Alert when error rate exceeds 5%" \
  --metric-name ErrorRate \
  --namespace KitchenHub \
  --statistic Average \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

#### GCP Alerting Policy

1. Go to Cloud Console → Monitoring → Alerting
2. Create Policy
3. Condition: Log-based metric for error rate
4. Notification: Email/Slack/PagerDuty

---

## Dashboard Setup

### Sentry Dashboard

Sentry provides built-in dashboards:
- **Issues**: List of all errors
- **Performance**: Request performance metrics
- **Releases**: Release tracking and error trends

### Custom Dashboards

#### AWS CloudWatch Dashboard

Create a dashboard with:
- Request count
- Error rate
- Response time (p50, p95, p99)
- Database connection pool metrics
- Memory usage

#### GCP Monitoring Dashboard

Create a dashboard with:
- Request latency
- Error rate
- Request count by endpoint
- Database query performance

### Grafana (Multi-Cloud)

If using Grafana:
1. Connect to your log aggregation service (CloudWatch, Cloud Logging, etc.)
2. Create dashboards with:
   - Request rate
   - Error rate
   - Response time percentiles
   - Database latency
   - Memory usage

---

## Best Practices

1. **Health Check Frequency:**
   - Uptime monitoring: 1-5 minutes
   - Container orchestration: 5-30 seconds

2. **Alert Fatigue:**
   - Set appropriate thresholds
   - Use alert grouping (don't alert on every single error)
   - Configure quiet hours for non-critical alerts

3. **Log Retention:**
   - Keep logs for at least 30 days
   - Archive older logs for compliance/audit

4. **Performance Monitoring:**
   - Sample rate: 10% (0.1) for production
   - Increase for debugging specific issues

5. **Security:**
   - Don't log sensitive data (passwords, tokens)
   - Health endpoints are public (no auth required)
   - Sentry automatically filters sensitive headers

---

## Troubleshooting

### Sentry Not Receiving Errors

1. Check `SENTRY_DSN` is set correctly
2. Verify network connectivity (firewall rules)
3. Check Sentry project settings
4. Review application logs for Sentry initialization errors

### Health Checks Failing

1. Check database connectivity
2. Verify application is running
3. Check health endpoint response manually: `curl https://your-api/api/health/ready`
4. Review application logs

### Logs Not Appearing

1. Verify `LOG_FORMAT` is set to `json` in production
2. Check log aggregation service configuration
3. Verify application has permissions to write logs
4. Check log retention settings

---

## Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [UptimeRobot Documentation](https://uptimerobot.com/api/)
- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [GCP Monitoring Documentation](https://cloud.google.com/monitoring/docs)

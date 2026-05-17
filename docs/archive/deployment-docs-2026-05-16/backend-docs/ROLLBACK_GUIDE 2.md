# Rollback Guide

This guide provides detailed rollback procedures for the Kitchen Hub backend API across all deployment platforms. Rollback may be necessary when a deployment introduces critical bugs, performance issues, or data corruption.

## Table of Contents

1. [Rollback Overview](#rollback-overview)
2. [Application Rollback Procedures](#application-rollback-procedures)
3. [Database Rollback Procedures](#database-rollback-procedures)
4. [Migration Rollback Procedures](#migration-rollback-procedures)
5. [Automated Rollback](#automated-rollback)
6. [Rollback Verification](#rollback-verification)
7. [Related Documentation](#related-documentation)

---

## Rollback Overview

### When to Rollback

Rollback should be considered when:
- Application crashes or fails to start
- Critical bugs are discovered in production
- Performance degradation affects users
- Data corruption or loss occurs
- Security vulnerabilities are exposed
- Health checks consistently fail

### Rollback Types

1. **Application Rollback**: Revert to previous container image/revision
   - Fastest rollback method
   - Does not undo database schema changes
   - Suitable for code-level issues

2. **Database Rollback**: Restore database from backup
   - Required for data corruption or schema issues
   - Platform-specific procedures
   - May require application rollback as well

3. **Migration Rollback**: Fix Prisma migration history
   - For failed or partially applied migrations
   - Uses `prisma migrate resolve` command
   - See [MIGRATIONS.md](./MIGRATIONS.md) for details

### Rollback Decision Tree

```
Deployment Issue Detected
    │
    ├─ Application won't start?
    │   └─> Application Rollback (GCP Cloud Run or AWS ECS)
    │
    ├─ Data corruption or schema issues?
    │   └─> Database Rollback + Application Rollback
    │
    ├─ Migration failed?
    │   └─> Migration Rollback (prisma migrate resolve)
    │
    └─ Performance issues?
        └─> Application Rollback (if recent change) or Scale Resources
```

---

## Application Rollback Procedures

### GCP Cloud Run Rollback

#### Prerequisites

- Access to GCP Cloud Run console or `gcloud` CLI
- Service name and region
- Previous revision identifier (optional, can list revisions)

#### Step-by-Step Procedure

**Method 1: Using Cloud Run Console (Recommended)**

1. **Navigate to Cloud Run Service**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to Cloud Run → Services
   - Select your service (e.g., `kitchen-hub-api`)

2. **View Revisions**:
   - Click on "Revisions" tab
   - Review revision history
   - Identify the previous working revision
   - Note the revision name (e.g., `kitchen-hub-api-00042-abc`)

3. **Route Traffic to Previous Revision**:
   - Click "Manage Traffic" button
   - In the traffic allocation section:
     - Set current revision to 0% (or remove)
     - Set previous revision to 100%
   - Click "Save"

4. **Verify Rollback**:
   - Wait for traffic to shift (usually < 1 minute)
   - Check service URL: `curl https://your-service-url/api/version`
   - Verify logs show previous revision is serving traffic
   - Confirm application is functioning correctly

5. **Optional: Delete Failed Revision**:
   - After confirming rollback success, you can delete the failed revision
   - Go to Revisions tab → Select failed revision → Delete

**Method 2: Using gcloud CLI**

```bash
# 1. List revisions
gcloud run revisions list \
  --service kitchen-hub-api \
  --region us-central1 \
  --format="table(metadata.name,status.conditions[0].status,spec.containers[0].image)"

# 2. Get current traffic allocation
gcloud run services describe kitchen-hub-api \
  --region us-central1 \
  --format="value(status.traffic)"

# 3. Route 100% traffic to previous revision
gcloud run services update-traffic kitchen-hub-api \
  --region us-central1 \
  --to-revisions PREVIOUS_REVISION_NAME=100

# 4. Verify rollback
curl https://your-service-url/api/version
```

**Method 3: Using GitHub Actions (Manual Dispatch)**

If you need to rollback via CI/CD:

1. Go to GitHub Actions → Deploy to Production
2. Click "Run workflow"
3. Select `main` branch
4. Enter previous image tag in `image_tag` field (e.g., `main-abc123def456`)
5. Approve deployment
6. This will deploy the previous image as a new revision

#### Rollback Verification

**Check Revision Status**:
```bash
gcloud run services describe kitchen-hub-api \
  --region us-central1 \
  --format="value(status.traffic)"
```

**Check Application Health**:
```bash
curl https://your-service-url/api/version
# Expected: {"version":"1.0.0","environment":"production"}
```

**Check Logs**:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=kitchen-hub-api" \
  --limit 50 \
  --format json
```

#### Troubleshooting

**Traffic Not Shifting**:
- Wait a few minutes for traffic to fully shift
- Check if revision is healthy
- Verify traffic allocation in console

**Previous Revision Not Available**:
- Check revision history (revisions are retained for a period)
- If revision was deleted, you'll need to deploy a specific image tag
- Use GitHub Actions to deploy previous image tag

**Rollback Failed**:
- Check service account permissions
- Verify revision exists
- Check Cloud Run service status

### AWS ECS Rollback

#### Prerequisites

- Access to AWS ECS console or AWS CLI
- Cluster name and service name
- Previous task definition ARN or revision number

#### Step-by-Step Procedure

**Method 1: Using ECS Console (Recommended)**

1. **Navigate to ECS Service**:
   - Go to [AWS ECS Console](https://console.aws.amazon.com/ecs)
   - Select your cluster (e.g., `kitchen-hub-cluster`)
   - Click on your service (e.g., `kitchen-hub-api`)

2. **View Task Definition History**:
   - Click on "Task Definition" link
   - Review task definition revisions
   - Identify the previous working revision
   - Note the task definition ARN (e.g., `arn:aws:ecs:us-east-1:123456789012:task-definition/kitchen-hub-api:42`)

3. **Update Service to Previous Task Definition**:
   - Go back to service page
   - Click "Update" button
   - In "Task definition" section:
     - Select "Previous revision" or enter previous task definition ARN
   - Scroll down and click "Update"

4. **Force New Deployment** (if needed):
   - After updating task definition, ECS will automatically deploy
   - If not deploying, check "Force new deployment" option
   - Click "Update"

5. **Monitor Deployment**:
   - Go to "Deployments" tab
   - Monitor new deployment progress
   - Wait for deployment to complete (tasks to become healthy)

6. **Verify Rollback**:
   - Check service is running with previous task definition
   - Test application: `curl https://your-api-domain.com/api/version`
   - Verify logs show previous image is running
   - Confirm application is functioning correctly

**Method 2: Using AWS CLI**

```bash
# 1. List task definitions
aws ecs list-task-definitions \
  --family-prefix kitchen-hub-api \
  --sort DESC

# 2. Get current task definition
aws ecs describe-services \
  --cluster kitchen-hub-cluster \
  --services kitchen-hub-api \
  --query 'services[0].taskDefinition'

# 3. Update service to previous task definition
aws ecs update-service \
  --cluster kitchen-hub-cluster \
  --service kitchen-hub-api \
  --task-definition kitchen-hub-api:PREVIOUS_REVISION \
  --force-new-deployment

# 4. Wait for deployment to complete
aws ecs wait services-stable \
  --cluster kitchen-hub-cluster \
  --services kitchen-hub-api

# 5. Verify rollback
curl https://your-api-domain.com/api/version
```

**Method 3: Using GitHub Actions (Manual Dispatch)**

1. Go to GitHub Actions → Deploy to Production
2. Click "Run workflow"
3. Select `main` branch
4. Enter previous image tag in `image_tag` field
5. **Important**: Update workflow to use `aws-ecs` as `deploy_target` (if migrating)
6. Approve deployment
7. This will create a new task definition with previous image and update the service

#### Rollback Verification

**Check Service Status**:
```bash
aws ecs describe-services \
  --cluster kitchen-hub-cluster \
  --services kitchen-hub-api \
  --query 'services[0].{status:status,runningCount:runningCount,desiredCount:desiredCount,taskDefinition:taskDefinition}'
```

**Check Task Status**:
```bash
aws ecs list-tasks \
  --cluster kitchen-hub-cluster \
  --service-name kitchen-hub-api

aws ecs describe-tasks \
  --cluster kitchen-hub-cluster \
  --tasks TASK_ARN \
  --query 'tasks[0].{lastStatus:lastStatus,healthStatus:healthStatus,containers:containers[0].image}'
```

**Check Application Health**:
```bash
curl https://your-api-domain.com/api/version
```

**Check Logs**:
```bash
aws logs tail /ecs/kitchen-hub-api --follow
```

#### Troubleshooting

**Service Not Updating**:
- Check IAM permissions for ECS service role
- Verify task definition exists and is valid
- Check service events for errors

**Tasks Not Starting**:
- Check task definition configuration
- Verify image exists and is pullable
- Check CloudWatch logs for errors
- Verify resource constraints (CPU, memory)

**Rollback Failed**:
- Check ECS service events
- Review CloudWatch logs
- Verify task definition is correct
- Check load balancer health checks

### Docker/Manual Rollback

For manual Docker deployments:

```bash
# 1. Stop current container
docker stop kitchen-hub-api
docker rm kitchen-hub-api

# 2. Start previous version
docker run -d \
  --name kitchen-hub-api \
  -p 3000:3000 \
  --env-file .env.prod \
  --restart unless-stopped \
  ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-PREVIOUS_SHA

# 3. Verify rollback
curl http://localhost:3000/api/version
docker logs kitchen-hub-api
```

---

## Database Rollback Procedures

### Overview

Database rollback is required when:
- Database schema changes cause issues
- Data corruption occurs
- Migration fails and leaves database in inconsistent state

**Important**: Database rollback typically requires restoring from a backup. This is platform-specific.

### GCP Cloud SQL Rollback

#### Using Point-in-Time Recovery (PITR)

```bash
# 1. Identify restore point (before problematic migration)
# Note the timestamp when migration was run

# 2. Create new instance from backup
gcloud sql instances create kitchen-hub-api-restored \
  --backup-start-time RESTORE_TIMESTAMP \
  --source-instance kitchen-hub-api \
  --region us-central1

# 3. Update application to use restored instance
# Update DATABASE_URL and DIRECT_URL environment variables

# 4. Verify data integrity
# Test application with restored database

# 5. If successful, promote restored instance
# (Swap instance names or update connection strings)
```

#### Using Backup Restore

```bash
# 1. List available backups
gcloud sql backups list --instance kitchen-hub-api

# 2. Restore from specific backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance kitchen-hub-api \
  --restore-instance kitchen-hub-api-restored

# 3. Update application connection strings
# 4. Verify and promote
```

### AWS RDS Rollback

#### Using Point-in-Time Recovery

```bash
# 1. Identify restore point
# Note the timestamp before problematic migration

# 2. Restore to point in time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier kitchen-hub-api \
  --target-db-instance-identifier kitchen-hub-api-restored \
  --restore-time RESTORE_TIMESTAMP

# 3. Wait for restore to complete
aws rds wait db-instance-available \
  --db-instance-identifier kitchen-hub-api-restored

# 4. Update application connection strings
# 5. Verify and promote
```

#### Using Snapshot Restore

```bash
# 1. List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier kitchen-hub-api

# 2. Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier kitchen-hub-api-restored \
  --db-snapshot-identifier SNAPSHOT_ID

# 3. Update application connection strings
# 4. Verify and promote
```

### Supabase/Neon Rollback

**Supabase**:
- Use Supabase dashboard → Database → Backups
- Restore from available backup
- Or use point-in-time recovery if enabled

**Neon**:
- Use Neon dashboard → Branches
- Create branch from previous point in time
- Update application connection string to branch

### Post-Rollback Steps

After database rollback:

1. **Update Application**:
   - Update `DATABASE_URL` and `DIRECT_URL` environment variables
   - Redeploy application if needed

2. **Fix Migration History**:
   - Use `prisma migrate resolve` to fix migration state
   - See [Migration Rollback Procedures](#migration-rollback-procedures)

3. **Verify Data**:
   - Check critical data is intact
   - Verify application functionality
   - Run smoke tests

---

## Migration Rollback Procedures

### Prisma Migration Resolve

When a migration fails or is applied manually, use `prisma migrate resolve` to fix the migration history.

#### Mark Migration as Rolled Back

Use when a migration failed and you've fixed it in code:

```bash
# Set database connection
export DATABASE_URL="postgresql://user:password@host:5432/db"

# Mark migration as rolled back
npx prisma migrate resolve --rolled-back "20260125000000_migration_name" \
  --schema=src/infrastructure/database/prisma/schema.prisma
```

This allows Prisma to re-apply the migration on next `prisma migrate deploy`.

#### Mark Migration as Applied

Use when you applied migration SQL manually:

```bash
# Mark migration as applied
npx prisma migrate resolve --applied "20260125000000_migration_name" \
  --schema=src/infrastructure/database/prisma/schema.prisma
```

This tells Prisma the migration is already applied and should be skipped.

#### Migration Name Format

Use the **folder name** from `src/infrastructure/database/prisma/migrations/`:
- Example: `20260125000000_add_soft_delete_timestamps`
- Not the SQL file name, but the migration folder name

#### Typical Failed Migration Flow

1. Migration fails in production
2. Fix the migration SQL in code (or revert the change)
3. Run `prisma migrate resolve --rolled-back "<migration_name>"` against production DB
4. Deploy fixed code
5. Run `prisma migrate deploy` again (or let CI run it)

For detailed migration procedures, see [MIGRATIONS.md](./MIGRATIONS.md).

---

## Automated Rollback

### Health Check Failure Rollback

Currently, the deployment workflow includes health checks but does not automatically rollback on failure. Health check failures will fail the deployment workflow, requiring manual intervention.

**Future Enhancement**: Automated rollback on health check failure could be implemented by:
1. Detecting health check failure in workflow
2. Automatically triggering rollback workflow
3. Notifying team of automatic rollback

### Rollback Notification

After manual rollback:
1. Document rollback in deployment notes
2. Notify team via Slack/email
3. Create incident report if critical
4. Schedule post-mortem if needed

---

## Rollback Verification

### Post-Rollback Checklist

- [ ] Application is running with previous version
- [ ] Health checks are passing
- [ ] Application functionality verified
- [ ] Database connectivity confirmed
- [ ] No critical errors in logs
- [ ] Performance is acceptable
- [ ] Users can access application
- [ ] Monitoring shows healthy metrics

### Verification Commands

**Health Check**:
```bash
curl https://your-api-domain.com/api/version
```

**Log Verification**:
```bash
# GCP Cloud Run
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# AWS ECS
aws logs tail /ecs/kitchen-hub-api --follow
```

**Service Status**:
```bash
# GCP Cloud Run
gcloud run services describe SERVICE_NAME --region REGION

# AWS ECS
aws ecs describe-services --cluster CLUSTER --services SERVICE
```

### Smoke Testing

After rollback, perform basic smoke tests:
1. Health endpoint responds
2. API documentation accessible
3. Authentication works (if applicable)
4. Database queries succeed
5. No critical errors in logs

---

## Related Documentation

- **[DEPLOYMENT_COMPREHENSIVE.md](./DEPLOYMENT_COMPREHENSIVE.md)**: Complete deployment guide
- **[MIGRATIONS.md](./MIGRATIONS.md)**: Database migration procedures
- **[PLATFORM_MIGRATION.md](./PLATFORM_MIGRATION.md)**: Platform migration guide
- **[DEPLOYMENT.md](../DEPLOYMENT.md)**: Quick start deployment guide

---

## Support

For rollback issues:
1. Check this guide for platform-specific procedures
2. Review platform logs (Cloud Run, ECS)
3. Check application logs
4. Consult team or create issue in repository

**Emergency Rollback**: If critical production issue, prioritize speed over documentation. Rollback first, document later.

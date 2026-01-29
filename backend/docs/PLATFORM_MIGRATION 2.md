# Platform Migration Guide

This guide provides step-by-step instructions for migrating the Kitchen Hub backend API between deployment platforms (GCP Cloud Run and AWS ECS/Fargate) with minimal workflow changes.

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Migrating from GCP Cloud Run to AWS ECS/Fargate](#migrating-from-gcp-cloud-run-to-aws-ecsfargate)
3. [Migrating from AWS ECS to GCP Cloud Run](#migrating-from-aws-ecs-to-gcp-cloud-run)
4. [Workflow Changes](#workflow-changes)
5. [Testing During Migration](#testing-during-migration)
6. [Post-Migration Cleanup](#post-migration-cleanup)
7. [Troubleshooting](#troubleshooting)

---

## Migration Overview

### When to Migrate

Consider migrating when:
- Cost optimization is needed (different pricing models)
- Integration with platform-specific services is required
- Compliance or regulatory requirements change
- Performance requirements change
- Team expertise shifts to different platform

### Migration Strategies

1. **Blue-Green Deployment**: Run both platforms in parallel, switch traffic gradually
2. **Canary Deployment**: Route small percentage of traffic to new platform
3. **Direct Migration**: Switch entirely to new platform (faster, higher risk)

**Recommended**: Blue-Green deployment for production, Direct migration for staging.

### Prerequisites

Before starting migration:
- [ ] Both platforms are accessible and configured
- [ ] Database is accessible from both platforms
- [ ] GitHub Actions workflows are understood
- [ ] Rollback procedures are documented
- [ ] Team is available for migration window
- [ ] Monitoring and alerting are set up for both platforms

### Migration Checklist

- [ ] Pre-migration checklist completed
- [ ] New platform infrastructure created
- [ ] Environment variables configured
- [ ] Database connectivity verified
- [ ] GitHub Secrets updated
- [ ] Workflow files updated (if needed)
- [ ] Testing completed
- [ ] Rollback plan documented
- [ ] Team notified

---

## Migrating from GCP Cloud Run to AWS ECS/Fargate

### Pre-Migration Checklist

- [ ] AWS account created and configured
- [ ] ECS cluster created (Fargate launch type)
- [ ] VPC and subnets configured (if not using default)
- [ ] Application Load Balancer created (if needed)
- [ ] IAM roles created (task execution role, task role, service role)
- [ ] ECR or GHCR access configured
- [ ] Database accessible from AWS (security groups, firewall rules)
- [ ] Monitoring and logging configured (CloudWatch)

### Step 1: Create AWS Infrastructure

#### 1.1 Create ECS Cluster

```bash
# Create Fargate cluster
aws ecs create-cluster \
  --cluster-name kitchen-hub-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy \
    capacityProvider=FARGATE,weight=1 \
    capacityProvider=FARGATE_SPOT,weight=0
```

#### 1.2 Create VPC and Networking (if not using default)

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create subnets (public and private)
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.1.0/24
aws ec2 create-subnet --vpc-id vpc-xxx --cidr-block 10.0.2.0/24

# Create internet gateway and route tables
# (See AWS documentation for complete networking setup)
```

#### 1.3 Create Application Load Balancer (if needed)

```bash
# Create load balancer
aws elbv2 create-load-balancer \
  --name kitchen-hub-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Create target group
aws elbv2 create-target-group \
  --name kitchen-hub-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --health-check-path /api/version
```

#### 1.4 Create IAM Roles

**Task Execution Role** (for pulling images and writing logs):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "*"
    }
  ]
}
```

**Task Role** (for application permissions):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:kitchen-hub/*"
    }
  ]
}
```

Create roles:
```bash
# Create task execution role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://trust-policy.json

aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create task role
aws iam create-role \
  --role-name ecsTaskRole \
  --assume-role-policy-document file://trust-policy.json
```

### Step 2: Configure Environment Variables

#### 2.1 Create Secrets in AWS Secrets Manager

```bash
# Create secrets
aws secretsmanager create-secret \
  --name kitchen-hub/jwt-secret \
  --secret-string "your-jwt-secret"

aws secretsmanager create-secret \
  --name kitchen-hub/jwt-refresh-secret \
  --secret-string "your-refresh-secret"

aws secretsmanager create-secret \
  --name kitchen-hub/database-url \
  --secret-string "postgresql://user:pass@host:5432/db"

aws secretsmanager create-secret \
  --name kitchen-hub/direct-url \
  --secret-string "postgresql://user:pass@host:5432/db"

aws secretsmanager create-secret \
  --name kitchen-hub/supabase-url \
  --secret-string "https://xxx.supabase.co"

aws secretsmanager create-secret \
  --name kitchen-hub/supabase-anon-key \
  --secret-string "your-anon-key"
```

#### 2.2 Create Task Definition

```json
{
  "family": "kitchen-hub-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "kitchen-hub-api",
      "image": "ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:kitchen-hub/jwt-secret"
        },
        {
          "name": "JWT_REFRESH_SECRET",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:kitchen-hub/jwt-refresh-secret"
        },
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:kitchen-hub/database-url"
        },
        {
          "name": "DIRECT_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:kitchen-hub/direct-url"
        },
        {
          "name": "SUPABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:kitchen-hub/supabase-url"
        },
        {
          "name": "SUPABASE_ANON_KEY",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:kitchen-hub/supabase-anon-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/kitchen-hub-api",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/version || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register task definition:
```bash
aws ecs register-task-definition --cli-input-json file://task-definition.json
```

#### 2.3 Create CloudWatch Log Group

```bash
aws logs create-log-group --log-group-name /ecs/kitchen-hub-api
```

### Step 3: Create ECS Service

```bash
aws ecs create-service \
  --cluster kitchen-hub-cluster \
  --service-name kitchen-hub-api \
  --task-definition kitchen-hub-api:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:REGION:ACCOUNT:targetgroup/kitchen-hub-targets/xxx,containerName=kitchen-hub-api,containerPort=3000" \
  --health-check-grace-period-seconds 60
```

### Step 4: Update GitHub Secrets

Add AWS secrets to GitHub:

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `AWS_ACCESS_KEY_ID` - AWS access key
   - `AWS_SECRET_ACCESS_KEY` - AWS secret key
   - `AWS_REGION` - AWS region (e.g., `us-east-1`)
   - `ECS_CLUSTER` - ECS cluster name (e.g., `kitchen-hub-cluster`)
   - `ECS_SERVICE` - ECS service name (e.g., `kitchen-hub-api`)
   - `ECS_TASK_DEFINITION_FAMILY` - Task definition family (e.g., `kitchen-hub-api`)
   - `PROD_DIRECT_URL` or `PROD_DATABASE_URL` - For migrations (if not already set)

### Step 5: Update Workflow Files

**Minimal Change Required**: Only update `deploy_target` in workflow files.

#### Update `deploy-production.yml`:

```yaml
# Change this line:
deploy_target: gcp-cloudrun

# To:
deploy_target: aws-ecs
```

#### Update secrets in workflow:

```yaml
secrets:
  DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
  DIRECT_URL: ${{ secrets.PROD_DIRECT_URL }}
  # Remove GCP secrets, add AWS secrets:
  AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
  AWS_REGION: ${{ secrets.AWS_REGION }}
  ECS_CLUSTER: ${{ secrets.ECS_CLUSTER }}
  ECS_SERVICE: ${{ secrets.ECS_SERVICE }}
  ECS_TASK_DEFINITION_FAMILY: ${{ secrets.ECS_TASK_DEFINITION_FAMILY }}
```

**That's it!** The `_deploy.yml` workflow already supports AWS ECS, so no changes needed there.

### Step 6: Test Deployment

1. **Test in Staging First**:
   - Update `deploy-staging.yml` with `deploy_target: aws-ecs`
   - Push to `develop` branch
   - Verify staging deployment works

2. **Verify Application**:
   - Check ECS service is running
   - Test health endpoint
   - Verify database connectivity
   - Check logs for errors

3. **Test Migrations**:
   - Verify migrations run successfully
   - Check database schema is up-to-date

### Step 7: Production Migration

1. **Blue-Green Deployment** (Recommended):
   - Keep Cloud Run running
   - Deploy to ECS in parallel
   - Test ECS deployment thoroughly
   - Gradually route traffic to ECS
   - Monitor both platforms
   - Once stable, switch all traffic to ECS

2. **Direct Migration**:
   - Update `deploy-production.yml` to use `aws-ecs`
   - Deploy to production
   - Monitor closely
   - Have rollback plan ready

### Step 8: Update DNS (if applicable)

If using custom domain:
1. Update DNS records to point to AWS load balancer
2. Wait for DNS propagation
3. Verify domain resolves correctly

### Step 9: Post-Migration Verification

- [ ] Application is running on ECS
- [ ] Health checks are passing
- [ ] Database connectivity verified
- [ ] All endpoints responding correctly
- [ ] Logs show no errors
- [ ] Performance is acceptable
- [ ] Monitoring and alerting working

---

## Migrating from AWS ECS to GCP Cloud Run

### Pre-Migration Checklist

- [ ] GCP project created and configured
- [ ] Cloud Run API enabled
- [ ] Service account created with proper permissions
- [ ] Database accessible from GCP (firewall rules)
- [ ] Monitoring and logging configured

### Step 1: Create GCP Infrastructure

#### 1.1 Create Service Account

```bash
# Create service account
gcloud iam service-accounts create kitchen-hub-api \
  --display-name="Kitchen Hub API Service Account"

# Grant Cloud Run Admin role
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:kitchen-hub-api@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

# Create and download key
gcloud iam service-accounts keys create key.json \
  --iam-account=kitchen-hub-api@PROJECT_ID.iam.gserviceaccount.com
```

#### 1.2 Create Cloud Run Service (Initial)

```bash
# Deploy initial service (will be updated by CI/CD)
gcloud run deploy kitchen-hub-api \
  --image ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --service-account kitchen-hub-api@PROJECT_ID.iam.gserviceaccount.com
```

### Step 2: Configure Environment Variables

#### 2.1 Create Secrets in Secret Manager

```bash
# Create secrets
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-
echo -n "your-refresh-secret" | gcloud secrets create jwt-refresh-secret --data-file=-
echo -n "postgresql://..." | gcloud secrets create database-url --data-file=-
echo -n "postgresql://..." | gcloud secrets create direct-url --data-file=-
echo -n "https://xxx.supabase.co" | gcloud secrets create supabase-url --data-file=-
echo -n "your-anon-key" | gcloud secrets create supabase-anon-key --data-file=-

# Grant access to service account
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:kitchen-hub-api@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
# Repeat for all secrets
```

#### 2.2 Configure Environment Variables in Cloud Run

Via Console:
1. Go to Cloud Run → Service → Edit & Deploy New Revision
2. Navigate to "Variables & Secrets" tab
3. Add environment variables or reference secrets
4. Deploy revision

Via gcloud:
```bash
gcloud run services update kitchen-hub-api \
  --region us-central1 \
  --set-env-vars NODE_ENV=production,PORT=8080 \
  --update-secrets JWT_SECRET=jwt-secret:latest,DATABASE_URL=database-url:latest
```

### Step 3: Update GitHub Secrets

Add GCP secrets to GitHub:

1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `GCP_PROJECT_ID` - GCP project ID
   - `GCP_REGION` - Cloud Run region (e.g., `us-central1`)
   - `GCP_CLOUD_RUN_SERVICE` - Service name (e.g., `kitchen-hub-api`)
   - `GCP_SA_KEY` - Service account JSON key (from Step 1.1)
   - `PROD_DIRECT_URL` or `PROD_DATABASE_URL` - For migrations (if not already set)

### Step 4: Update Workflow Files

**Minimal Change Required**: Only update `deploy_target` in workflow files.

#### Update `deploy-production.yml`:

```yaml
# Change this line:
deploy_target: aws-ecs

# To:
deploy_target: gcp-cloudrun
```

#### Update secrets in workflow:

```yaml
secrets:
  DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
  DIRECT_URL: ${{ secrets.PROD_DIRECT_URL }}
  # Remove AWS secrets, add GCP secrets:
  GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  GCP_REGION: ${{ secrets.GCP_REGION }}
  GCP_CLOUD_RUN_SERVICE: ${{ secrets.GCP_CLOUD_RUN_SERVICE }}
  GCP_SA_KEY: ${{ secrets.GCP_SA_KEY }}
```

**That's it!** The `_deploy.yml` workflow already supports GCP Cloud Run.

### Step 5: Test Deployment

1. **Test in Staging First**:
   - Update `deploy-staging.yml` with `deploy_target: gcp-cloudrun`
   - Push to `develop` branch
   - Verify staging deployment works

2. **Verify Application**:
   - Check Cloud Run service is running
   - Test health endpoint
   - Verify database connectivity
   - Check logs for errors

### Step 6: Production Migration

Follow same steps as AWS to GCP migration (blue-green or direct).

### Step 7: Post-Migration Verification

Same verification steps as AWS migration.

---

## Workflow Changes

### Minimal Changes Required

The beauty of the current architecture is that **only one line needs to change** in workflow files:

```yaml
# In deploy-production.yml or deploy-staging.yml
deploy_target: gcp-cloudrun  # or aws-ecs
```

The `_deploy.yml` reusable workflow handles all platform-specific logic.

### Workflow File Structure

```
.github/workflows/
├── build.yml                    # No changes needed
├── _deploy.yml                  # No changes needed (supports both platforms)
├── deploy-staging.yml           # Change deploy_target only
└── deploy-production.yml        # Change deploy_target only
```

### Secret Management Changes

**From GCP to AWS**:
- Remove: `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_CLOUD_RUN_SERVICE`, `GCP_SA_KEY`
- Add: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `ECS_CLUSTER`, `ECS_SERVICE`, `ECS_TASK_DEFINITION_FAMILY`

**From AWS to GCP**:
- Remove: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `ECS_CLUSTER`, `ECS_SERVICE`, `ECS_TASK_DEFINITION_FAMILY`
- Add: `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_CLOUD_RUN_SERVICE`, `GCP_SA_KEY`

**Common** (no changes):
- `PROD_DATABASE_URL` / `PROD_DIRECT_URL`
- `STAGING_DATABASE_URL` / `STAGING_DIRECT_URL`
- `PRODUCTION_SERVICE_URL` / `STAGING_SERVICE_URL` (optional)

---

## Testing During Migration

### Parallel Deployment Testing

1. **Deploy to Both Platforms**:
   - Keep existing platform running
   - Deploy to new platform in parallel
   - Use different service URLs for testing

2. **Compare Functionality**:
   - Test same endpoints on both platforms
   - Compare response times
   - Verify data consistency
   - Check logs for differences

3. **Load Testing**:
   - Test both platforms under load
   - Compare performance metrics
   - Verify scaling behavior

### Traffic Routing Strategies

**Blue-Green**:
- Route 10% traffic to new platform
- Monitor for issues
- Gradually increase to 50%, then 100%
- Keep old platform as backup

**Canary**:
- Route specific user segments to new platform
- Monitor user experience
- Expand gradually

**Direct**:
- Switch all traffic at once
- Monitor closely
- Have immediate rollback plan

### Data Consistency Verification

- [ ] Database queries return same results
- [ ] Authentication works identically
- [ ] Data writes are consistent
- [ ] No data loss or corruption
- [ ] Timestamps are correct

---

## Post-Migration Cleanup

### Infrastructure Cleanup

**After Migrating from GCP to AWS**:
- [ ] Delete Cloud Run service (after verification period)
- [ ] Delete GCP service account (if not used elsewhere)
- [ ] Delete Secret Manager secrets (if not used elsewhere)
- [ ] Remove GCP secrets from GitHub

**After Migrating from AWS to GCP**:
- [ ] Delete ECS service (after verification period)
- [ ] Delete ECS cluster (if not used elsewhere)
- [ ] Delete IAM roles (if not used elsewhere)
- [ ] Delete Secrets Manager secrets (if not used elsewhere)
- [ ] Delete CloudWatch log groups (optional)
- [ ] Remove AWS secrets from GitHub

### DNS Updates

- [ ] Update DNS records to new platform
- [ ] Verify DNS propagation
- [ ] Update CDN configuration (if applicable)
- [ ] Update CORS settings (if applicable)

### Monitoring Updates

- [ ] Update monitoring dashboards
- [ ] Update alerting rules
- [ ] Update runbooks
- [ ] Update documentation

### Documentation Updates

- [ ] Update deployment documentation
- [ ] Update runbooks
- [ ] Update architecture diagrams
- [ ] Notify team of changes

---

## Troubleshooting

### Common Migration Issues

**Database Connectivity**:
- Verify firewall rules allow access from new platform
- Check security groups (AWS) or VPC firewall (GCP)
- Verify database credentials are correct
- Test connection manually

**Image Pull Failures**:
- Verify image exists in GHCR
- Check authentication (service account or IAM role)
- Verify image pull permissions
- Check network connectivity

**Environment Variables**:
- Verify all variables are set correctly
- Check variable names (case-sensitive)
- Verify secrets are accessible
- Check Secret Manager permissions

**Deployment Failures**:
- Review platform-specific error messages
- Check IAM/service account permissions
- Verify resource limits (CPU, memory)
- Review application logs

### Rollback During Migration

If issues occur during migration:

1. **Immediate Rollback**:
   - Revert workflow file changes
   - Route traffic back to old platform
   - Investigate issues

2. **Fix Issues**:
   - Address root cause
   - Test fixes in staging
   - Retry migration

3. **Document Issues**:
   - Document what went wrong
   - Update migration plan
   - Share learnings with team

---

## Related Documentation

- **[DEPLOYMENT_COMPREHENSIVE.md](./DEPLOYMENT_COMPREHENSIVE.md)**: Complete deployment guide
- **[ROLLBACK_GUIDE.md](./ROLLBACK_GUIDE.md)**: Rollback procedures
- **[ENV_VAR_CHECKLIST.md](./ENV_VAR_CHECKLIST.md)**: Environment variable checklist
- **[MIGRATIONS.md](./MIGRATIONS.md)**: Database migration procedures

---

## Support

For migration issues:
1. Check this guide for platform-specific steps
2. Review platform documentation (AWS, GCP)
3. Test in staging first
4. Have rollback plan ready
5. Consult team or create issue in repository

**Remember**: Test thoroughly in staging before production migration!

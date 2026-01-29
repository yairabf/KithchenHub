# Environment Variable Checklist

This document provides comprehensive checklists for all environment variables required for deploying the Kitchen Hub backend API across different environments and platforms.

## Table of Contents

1. [Environment Variable Overview](#environment-variable-overview)
2. [Complete Environment Variable Checklist](#complete-environment-variable-checklist)
3. [Environment Variable Setup by Platform](#environment-variable-setup-by-platform)
4. [Validation Checklist](#validation-checklist)
5. [Secrets Management](#secrets-management)
6. [Troubleshooting](#troubleshooting)

---

## Environment Variable Overview

### Variable Categories

1. **Required**: Must be set for application to function
2. **Optional**: Has default values or is only needed for specific features
3. **Platform-Specific**: Only needed for specific deployment platforms

### Variable Types

- **Application**: Core application configuration
- **Database**: Database connection strings
- **Authentication**: JWT and OAuth secrets
- **External Services**: Supabase, Google OAuth
- **Platform**: Platform-specific configuration (PORT, etc.)

---

## Complete Environment Variable Checklist

### Staging Environment Checklist

#### Required Variables

- [ ] `NODE_ENV=staging` (or `production` for production-like staging)
- [ ] `PORT=3000` (or platform default, e.g., `8080` for Cloud Run)
- [ ] `DATABASE_URL` - Staging database connection (pooled)
- [ ] `DIRECT_URL` - Staging database direct connection (for migrations, preferred)
- [ ] `JWT_SECRET` - JWT signing secret (minimum 32 characters)
- [ ] `JWT_REFRESH_SECRET` - Refresh token secret (minimum 32 characters)
- [ ] `SUPABASE_URL` - Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Supabase anonymous key

#### Optional Variables

- [ ] `JWT_EXPIRES_IN=15m` (default: `15m`)
- [ ] `JWT_REFRESH_EXPIRES_IN=7d` (default: `7d`)
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID (if using Google sign-in)
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth secret (if using Google sign-in)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)

#### GitHub Secrets (for CI/CD)

- [ ] `STAGING_DATABASE_URL` - For migrations (if `DIRECT_URL` not set)
- [ ] `STAGING_DIRECT_URL` - For migrations (preferred)
- [ ] `GCP_PROJECT_ID` - GCP project ID (if using Cloud Run)
- [ ] `GCP_REGION` - Cloud Run region (if using Cloud Run)
- [ ] `GCP_CLOUD_RUN_SERVICE_STAGING` - Staging service name (if using Cloud Run)
- [ ] `GCP_SA_KEY` - GCP service account JSON key (if using Cloud Run)
- [ ] `STAGING_SERVICE_URL` - Staging service URL (optional, for health checks)
- [ ] `AWS_ACCESS_KEY_ID` - AWS access key (if using ECS)
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret key (if using ECS)
- [ ] `AWS_REGION` - AWS region (if using ECS)
- [ ] `ECS_CLUSTER` - ECS cluster name (if using ECS)
- [ ] `ECS_SERVICE` - ECS service name (if using ECS)
- [ ] `ECS_TASK_DEFINITION_FAMILY` - Task definition family (if using ECS)

### Production Environment Checklist

#### Required Variables

- [ ] `NODE_ENV=production`
- [ ] `PORT=3000` (or platform default, e.g., `8080` for Cloud Run)
- [ ] `DATABASE_URL` - Production database connection (pooled)
- [ ] `DIRECT_URL` - Production database direct connection (for migrations, preferred)
- [ ] `JWT_SECRET` - **Production JWT secret (different from staging/dev, minimum 32 characters)**
- [ ] `JWT_REFRESH_SECRET` - **Production refresh secret (different from staging/dev, minimum 32 characters)**
- [ ] `SUPABASE_URL` - Production Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Production Supabase anonymous key

#### Optional Variables

- [ ] `JWT_EXPIRES_IN=15m` (default: `15m`)
- [ ] `JWT_REFRESH_EXPIRES_IN=7d` (default: `7d`)
- [ ] `GOOGLE_CLIENT_ID` - Production Google OAuth client ID (if using Google sign-in)
- [ ] `GOOGLE_CLIENT_SECRET` - Production Google OAuth secret (if using Google sign-in)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Production Supabase service role key (for admin operations)

#### GitHub Secrets (for CI/CD)

- [ ] `PROD_DATABASE_URL` - For migrations (if `DIRECT_URL` not set)
- [ ] `PROD_DIRECT_URL` - For migrations (preferred)
- [ ] `GCP_PROJECT_ID` - GCP project ID (if using Cloud Run)
- [ ] `GCP_REGION` - Cloud Run region (if using Cloud Run)
- [ ] `GCP_CLOUD_RUN_SERVICE` - Production service name (if using Cloud Run)
- [ ] `GCP_SA_KEY` - GCP service account JSON key (if using Cloud Run)
- [ ] `PRODUCTION_SERVICE_URL` - Production service URL (optional, for health checks)
- [ ] `AWS_ACCESS_KEY_ID` - AWS access key (if using ECS)
- [ ] `AWS_SECRET_ACCESS_KEY` - AWS secret key (if using ECS)
- [ ] `AWS_REGION` - AWS region (if using ECS)
- [ ] `ECS_CLUSTER` - ECS cluster name (if using ECS)
- [ ] `ECS_SERVICE` - ECS service name (if using ECS)
- [ ] `ECS_TASK_DEFINITION_FAMILY` - Task definition family (if using ECS)

### Variable Reference Table

| Variable | Required | Default | Description | Example |
|----------|----------|---------|-------------|---------|
| `NODE_ENV` | ✅ | `development` | Environment name | `production` |
| `PORT` | ✅ | `3000` | Server port | `3000` or `8080` |
| `DATABASE_URL` | ✅ | - | Database connection (pooled) | `postgresql://user:pass@host:5432/db` |
| `DIRECT_URL` | ⚠️ | `DATABASE_URL` | Direct DB connection (migrations) | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | ✅ | - | JWT signing secret (32+ chars) | Generated secret |
| `JWT_REFRESH_SECRET` | ✅ | - | Refresh token secret (32+ chars) | Generated secret |
| `JWT_EXPIRES_IN` | ❌ | `15m` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | ❌ | `7d` | Refresh token expiry | `7d` |
| `GOOGLE_CLIENT_ID` | ❌ | - | Google OAuth client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ❌ | - | Google OAuth secret | Generated secret |
| `SUPABASE_URL` | ✅ | - | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | ✅ | - | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | - | Supabase service role key | `eyJ...` |

**Legend**: ✅ Required | ⚠️ Recommended | ❌ Optional

---

## Environment Variable Setup by Platform

### GCP Cloud Run

#### Method 1: Cloud Run Console

1. Go to [Cloud Run Console](https://console.cloud.google.com/run)
2. Select your service
3. Click "Edit & Deploy New Revision"
4. Navigate to "Variables & Secrets" tab
5. Add environment variables:
   - Click "Add Variable"
   - Enter variable name and value
   - Click "Save"
6. Deploy new revision

#### Method 2: Using Secret Manager (Recommended for Secrets)

1. **Create Secret**:
```bash
# Create secret in Secret Manager
gcloud secrets create jwt-secret \
  --data-file=- <<< "your-secret-value"

# Or from file
echo "your-secret-value" | gcloud secrets create jwt-secret --data-file=-
```

2. **Grant Access to Cloud Run Service Account**:
```bash
# Get service account email
SERVICE_ACCOUNT=$(gcloud run services describe SERVICE_NAME \
  --region REGION \
  --format="value(spec.template.spec.serviceAccountName)")

# Grant secret accessor role
gcloud secrets add-iam-policy-binding jwt-secret \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

3. **Reference Secret in Cloud Run**:
   - Go to Cloud Run Console → Service → Edit & Deploy New Revision
   - Navigate to "Variables & Secrets" tab
   - Click "Reference a secret"
   - Select secret and environment variable name
   - Deploy new revision

#### Method 3: Using gcloud CLI

```bash
# Deploy with environment variables
gcloud run deploy kitchen-hub-api \
  --image ghcr.io/OWNER/kitchen-hub-api:main-latest \
  --region us-central1 \
  --set-env-vars NODE_ENV=production,PORT=8080 \
  --set-secrets JWT_SECRET=jwt-secret:latest \
  --update-secrets DATABASE_URL=database-url:latest
```

### AWS ECS/Fargate

#### Method 1: Task Definition (Environment Variables)

```json
{
  "containerDefinitions": [
    {
      "name": "kitchen-hub-api",
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"},
        {"name": "DATABASE_URL", "value": "postgresql://..."}
      ]
    }
  ]
}
```

#### Method 2: Secrets Manager (Recommended for Secrets)

1. **Create Secret**:
```bash
# Create secret
aws secretsmanager create-secret \
  --name kitchen-hub/jwt-secret \
  --secret-string "your-secret-value"

# Or JSON for multiple values
aws secretsmanager create-secret \
  --name kitchen-hub/app-secrets \
  --secret-string '{"JWT_SECRET":"value1","JWT_REFRESH_SECRET":"value2"}'
```

2. **Reference in Task Definition**:
```json
{
  "containerDefinitions": [
    {
      "name": "kitchen-hub-api",
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:kitchen-hub/jwt-secret"
        },
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:kitchen-hub/database-url"
        }
      ]
    }
  ]
}
```

3. **Grant Task Execution Role Access**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:region:account:secret:kitchen-hub/*"
      ]
    }
  ]
}
```

#### Method 3: Using AWS CLI

```bash
# Register task definition with environment variables
aws ecs register-task-definition \
  --family kitchen-hub-api \
  --container-definitions '[
    {
      "name": "kitchen-hub-api",
      "image": "ghcr.io/OWNER/kitchen-hub-api:main-latest",
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:kitchen-hub/jwt-secret"
        }
      ]
    }
  ]'
```

### GitHub Secrets (for CI/CD)

#### Setting Repository Secrets

1. Go to GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Enter secret name and value
5. Click "Add secret"

#### Setting Environment Secrets

1. Go to GitHub repository
2. Navigate to Settings → Environments
3. Select environment (e.g., `production`)
4. Click "Add secret"
5. Enter secret name and value
6. Click "Add secret"

#### Required Secrets by Environment

**Staging**:
- `STAGING_DIRECT_URL` or `STAGING_DATABASE_URL`
- `GCP_PROJECT_ID` (if using Cloud Run)
- `GCP_REGION` (if using Cloud Run)
- `GCP_CLOUD_RUN_SERVICE_STAGING` (if using Cloud Run)
- `GCP_SA_KEY` (if using Cloud Run)
- `STAGING_SERVICE_URL` (optional)

**Production**:
- `PROD_DIRECT_URL` or `PROD_DATABASE_URL`
- `GCP_PROJECT_ID` (if using Cloud Run)
- `GCP_REGION` (if using Cloud Run)
- `GCP_CLOUD_RUN_SERVICE` (if using Cloud Run)
- `GCP_SA_KEY` (if using Cloud Run)
- `PRODUCTION_SERVICE_URL` (optional)
- `AWS_ACCESS_KEY_ID` (if using ECS)
- `AWS_SECRET_ACCESS_KEY` (if using ECS)
- `AWS_REGION` (if using ECS)
- `ECS_CLUSTER` (if using ECS)
- `ECS_SERVICE` (if using ECS)
- `ECS_TASK_DEFINITION_FAMILY` (if using ECS)

---

## Validation Checklist

### Pre-Deployment Validation

- [ ] All required variables are set
- [ ] Variable names are correct (case-sensitive)
- [ ] Variable values are valid (URLs, secrets format)
- [ ] Secrets are stored securely (not in code)
- [ ] Database URLs are accessible from deployment environment
- [ ] JWT secrets are different for each environment
- [ ] JWT secrets meet minimum length (32 characters)
- [ ] Supabase credentials are correct for environment
- [ ] Google OAuth credentials are correct for environment (if used)
- [ ] Platform-specific variables are set (PORT for Cloud Run, etc.)

### Post-Deployment Verification

- [ ] Application starts successfully
- [ ] Database connection established
- [ ] Health endpoint responds (`/api/version`)
- [ ] No environment variable errors in logs
- [ ] Authentication works (if applicable)
- [ ] External service connections work (Supabase, etc.)

### Validation Commands

**Check Environment Variables in Container**:
```bash
# GCP Cloud Run
gcloud run services describe SERVICE_NAME \
  --region REGION \
  --format="value(spec.template.spec.containers[0].env)"

# AWS ECS
aws ecs describe-task-definition \
  --task-definition TASK_DEFINITION \
  --query 'taskDefinition.containerDefinitions[0].environment'
```

**Test Application Startup**:
```bash
# Check logs for environment variable errors
# GCP Cloud Run
gcloud logging read "resource.type=cloud_run_revision" --limit 50

# AWS ECS
aws logs tail /ecs/kitchen-hub-api --follow
```

---

## Secrets Management

### Best Practices

1. **Never Commit Secrets**:
   - Use `.gitignore` for `.env` files
   - Never commit secrets to version control
   - Use secrets management services

2. **Use Different Secrets per Environment**:
   - Staging and production must have different secrets
   - Never reuse development secrets in production

3. **Rotate Secrets Regularly**:
   - Rotate JWT secrets periodically
   - Rotate database passwords
   - Update secrets in all locations (platform, GitHub, etc.)

4. **Use Secret Management Services**:
   - GCP Secret Manager for Cloud Run
   - AWS Secrets Manager for ECS
   - GitHub Secrets for CI/CD

5. **Limit Secret Access**:
   - Use least privilege principle
   - Grant access only to necessary services/roles
   - Review access periodically

### Secret Rotation Procedure

1. **Generate New Secret**:
```bash
# Generate new JWT secret
openssl rand -base64 32
```

2. **Update in All Locations**:
   - Update in platform (Cloud Run, ECS)
   - Update in GitHub Secrets
   - Update in Secret Manager (if used)

3. **Deploy with New Secret**:
   - Deploy new revision/service with updated secret
   - Verify application works with new secret

4. **Invalidate Old Secret**:
   - After confirming new secret works
   - Remove or disable old secret
   - Update documentation

### Secret Generation

**JWT Secrets**:
```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using online generator (less secure)
# Visit: https://randomkeygen.com/
```

**Database Passwords**:
- Use database provider's password generator
- Ensure password meets complexity requirements
- Store securely after generation

---

## Troubleshooting

### Missing Environment Variables

**Symptoms**:
- Application fails to start
- Error: "Environment variable X is required"
- Application crashes on startup

**Solution**:
1. Check all required variables are set
2. Verify variable names (case-sensitive)
3. Check platform-specific variable requirements
4. Review application logs for specific missing variable

### Invalid Environment Variables

**Symptoms**:
- Database connection errors
- Authentication failures
- Invalid URL errors

**Solution**:
1. Validate URL formats
2. Check secret values are correct
3. Verify database credentials
4. Test connections manually

### Platform-Specific Issues

**GCP Cloud Run**:
- `PORT` must be set to `8080` (or read from `PORT` env var)
- Secrets must be accessible to service account
- Check Secret Manager permissions

**AWS ECS**:
- Task execution role must have Secrets Manager permissions
- Environment variables in task definition must be valid JSON
- Check IAM role policies

### Validation Script

Create a validation script to check environment variables:

```bash
#!/bin/bash
# validate-env.sh

REQUIRED_VARS=(
  "NODE_ENV"
  "PORT"
  "DATABASE_URL"
  "JWT_SECRET"
  "JWT_REFRESH_SECRET"
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo "ERROR: Missing required environment variables:"
  printf '  - %s\n' "${MISSING_VARS[@]}"
  exit 1
fi

echo "✓ All required environment variables are set"
```

---

## Related Documentation

- **[DEPLOYMENT_COMPREHENSIVE.md](./DEPLOYMENT_COMPREHENSIVE.md)**: Complete deployment guide
- **[ROLLBACK_GUIDE.md](./ROLLBACK_GUIDE.md)**: Rollback procedures
- **[PLATFORM_MIGRATION.md](./PLATFORM_MIGRATION.md)**: Platform migration guide
- **[ENV_SETUP_GUIDE.md](../ENV_SETUP_GUIDE.md)**: Local development environment setup
- **[DEPLOYMENT.md](../DEPLOYMENT.md)**: Quick start deployment guide

---

## Support

For environment variable issues:
1. Check this checklist for required variables
2. Review platform-specific setup instructions
3. Validate variables using validation commands
4. Check application logs for specific errors
5. Consult team or create issue in repository

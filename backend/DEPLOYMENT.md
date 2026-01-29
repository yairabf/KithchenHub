# Deployment Guide

This guide covers deploying the Kitchen Hub backend API to production.

## Prerequisites

- ✅ Production Dockerfile (already exists)
- ✅ Production environment variables configured
- ✅ Database migrations ready
- ✅ Production database accessible
- ✅ Docker or container orchestration platform (Docker, Kubernetes, etc.)

---

## Quick Start: Local Development

**You can deploy locally right now!**

```bash
cd backend

# 1. Ensure .env is configured (already done)
# 2. Start services
docker-compose up -d

# 3. Run migrations
docker-compose exec backend npx prisma migrate deploy --schema=src/infrastructure/database/prisma/schema.prisma

# 4. Verify it's running
curl http://localhost:3000/api/version
```

**That's it!** Your backend is running locally at `http://localhost:3000`.

---

## Automated Staging Deployment

The staging environment is automatically deployed when code is merged to the `develop` branch via GitHub Actions.

### How It Works

1. **Build Workflow** (`.github/workflows/build.yml`):
   - Triggers on pushes to `develop` branch
   - Builds Docker image and pushes to GHCR with tag `develop-latest`
   - Creates images tagged with `develop-SHA` and `develop-latest`

2. **Staging Deployment Workflow** (`.github/workflows/deploy-staging.yml`):
   - Triggers on pushes to `develop` branch (runs independently, assumes image exists from `build.yml`)
   - Calls reusable `_deploy.yml` workflow with:
     - `environment: staging`
     - `deploy_target: gcp-cloudrun`
     - `image_tag: develop-latest`
   - Automatically runs database migrations
   - Deploys to GCP Cloud Run (direct deploy from Actions; no deploy hook)
   - Optionally performs health checks

### Prerequisites

Before automated staging deployment can work, you need to configure GitHub secrets and complete the [GCP Cloud Run one-time setup](#gcp-cloud-run). See that section for required secrets: `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_CLOUD_RUN_SERVICE_STAGING`, `GCP_SA_KEY`, and optionally `STAGING_DATABASE_URL` / `STAGING_DIRECT_URL` for migrations and `STAGING_SERVICE_URL` for health checks.

### Deployment Flow

```mermaid
graph LR
    A[Push to develop] --> B[build.yml triggers]
    B --> C[Build Docker image]
    C --> D[Push to GHCR]
    D --> E[deploy-staging.yml triggers]
    E --> F[Call _deploy.yml]
    F --> G[Run migrations]
    G --> H[Deploy to Cloud Run]
    H --> I[Staging Environment]
```

### What Happens During Deployment

1. **Migrations Job**:
   - Pulls Docker image from GHCR (`develop-latest`)
   - Runs Prisma migrations using `STAGING_DIRECT_URL` or `STAGING_DATABASE_URL`
   - Ensures database schema is up-to-date

2. **Deploy Job**:
   - Validates deployment configuration
   - Deploys to GCP Cloud Run via `gcloud run deploy` using the staging service name
   - Cloud Run pulls the `develop-latest` image from GHCR and runs the new revision

3. **Health Check Job** (if `STAGING_SERVICE_URL` is provided):
   - Waits for service to become healthy
   - Checks `/api/version` endpoint
   - Verifies deployment success

### Monitoring Deployments

- **GitHub Actions**: Check `.github/workflows/deploy-staging.yml` runs in Actions tab
- **GCP Cloud Run**: Monitor deployment status in Google Cloud Console → Cloud Run
- **Logs**: View deployment and application logs in Cloud Run or GitHub Actions logs

### Troubleshooting Staging Deployments

**Deployment doesn't trigger:**
- Verify you pushed to `develop` branch
- Check path filters: workflow only triggers on `backend/**` changes
- Verify workflow file exists: `.github/workflows/deploy-staging.yml`

**Cloud Run deployment fails:**
- Verify `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_CLOUD_RUN_SERVICE_STAGING`, and `GCP_SA_KEY` secrets are set
- Check GCP Cloud Run console for deployment errors
- Ensure the service account has Cloud Run Admin (and optionally Artifact Registry or GHCR access if needed)

**Migrations fail:**
- Verify `STAGING_DIRECT_URL` or `STAGING_DATABASE_URL` secrets are set
- Check database connection string is correct
- Verify database is accessible from GitHub Actions runners

**Health check fails:**
- Verify `STAGING_SERVICE_URL` is correct (Cloud Run service URL)
- Check application is running and accessible
- Review application logs in Cloud Run console

### Manual Staging Deployment

If you need to manually trigger a staging deployment:

1. **Via GitHub Actions**:
   - Go to Actions → Deploy to Staging
   - Click "Run workflow" → Select `develop` branch → Run workflow

---

## Automated Production Deployment

The production environment is automatically deployed when code is merged to the `main` branch via GitHub Actions, with manual approval protection via GitHub Environments.

### How It Works

1. **Build Workflow** (`.github/workflows/build.yml`):
   - Triggers on pushes to `main` branch
   - Builds Docker image and pushes to GHCR with tag `main-latest`
   - Creates images tagged with `main-SHA` and `main-latest`

2. **Production Deployment Workflow** (`.github/workflows/deploy-production.yml`):
   - Triggers on pushes to `main` branch (runs independently, assumes image exists from `build.yml`)
   - Calls reusable `_deploy.yml` workflow with:
     - `environment: production`
     - `deploy_target: gcp-cloudrun`
     - `image_tag: main-latest`
   - **Requires manual approval** before deployment proceeds (via GitHub Environment protection)
   - Automatically runs database migrations after approval
   - Deploys to GCP Cloud Run (direct deploy from Actions)
   - Optionally performs health checks

### Prerequisites

Before automated production deployment can work, you need to:

1. **Configure GitHub Environment** (one-time setup):
   - See [GitHub Environment Setup](#github-environment-setup) section below

2. **Configure GitHub Secrets**:
   - See [Required GitHub Secrets](#required-github-secrets-for-production) section below

### GitHub Environment Setup

The production deployment workflow uses GitHub Environments to require manual approval before deployment. Follow these steps to configure it:

#### Step 1: Create Production Environment

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Environments**
3. Click **"New environment"**
4. Name it: `production`
5. Click **"Configure environment"**

#### Step 2: Add Required Reviewers

1. Scroll to **"Deployment protection rules"**
2. Enable **"Required reviewers"**
3. Add 1-6 reviewers (users or teams who can approve deployments)
4. Optionally enable **"Prevent self-review"** to require approval from someone other than the person who triggered the deployment
5. Click **"Save protection rules"**

#### Step 3: Configure Deployment Branches

1. Scroll to **"Deployment branches"**
2. Select **"Selected branches"**
3. Add branch: `main`
4. This ensures only the `main` branch can deploy to production
5. Click **"Save"**

#### Step 4: Environment Secrets (Optional)

You can optionally store production secrets at the environment level instead of repository level:

1. In the production environment settings, scroll to **"Environment secrets"**
2. Click **"Add secret"**
3. Add secrets like `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_CLOUD_RUN_SERVICE`, `GCP_SA_KEY`, `PROD_DATABASE_URL`, etc.
4. These secrets are scoped to the production environment only

### Required GitHub Secrets for Production

See [GCP Cloud Run](#gcp-cloud-run) for one-time setup. Production workflow expects these secrets (repository or production environment):

#### Required Secrets

1. **GCP Cloud Run** (for deployment):
   - `GCP_PROJECT_ID` – GCP project ID
   - `GCP_REGION` – Cloud Run region (e.g. `us-central1`)
   - `GCP_CLOUD_RUN_SERVICE` – Production Cloud Run service name (e.g. `kitchen-hub-api`)
   - `GCP_SA_KEY` – Service account JSON key for GitHub Actions

2. **`PROD_DATABASE_URL`** (for migrations):
   - Production database connection URL (pooled connection)
   - Used for running migrations before deployment
   - Add to GitHub secrets

3. **`PROD_DIRECT_URL`** (for migrations, preferred):
   - Direct production database connection URL
   - Preferred over `PROD_DATABASE_URL` for migrations
   - Add to GitHub secrets

#### Optional Secrets

4. **`PRODUCTION_SERVICE_URL`** (optional, for health checks):
   - Base URL of production service
   - Used for post-deployment health checks
   - Example: `https://api.production.example.com`
   - **Recommended for production**: Health checks verify deployment success before marking as complete
   - If not set, health checks are skipped (workflow will still succeed)
   - To enable: Add this secret, then uncomment `service_url` line in `deploy-production.yml`

### Deployment Flow

```mermaid
graph LR
    A[Push to main] --> B[build.yml triggers]
    B --> C[Build Docker image]
    C --> D[Push to GHCR]
    D --> E[deploy-production.yml triggers]
    E --> F[Production Environment]
    F --> G{Approval Required?}
    G -->|Yes| H[Wait for Manual Approval]
    H --> I[Reviewer Approves]
    I --> J[Call _deploy.yml]
    J --> K[Run Migrations]
    K --> L[Deploy to Production]
    L --> M[Health Check]
    M --> N[Production Live]
```

### What Happens During Deployment

1. **Workflow Trigger**:
   - When code is pushed to `main`, `deploy-production.yml` triggers
   - Workflow pauses and waits for manual approval

2. **Approval Process**:
   - **Important**: Approval happens before any deployment steps begin (migrations, deployment, health checks)
   - Required reviewers receive email notifications
   - Reviewer goes to GitHub Actions → Workflow run → "Review deployments"
   - Reviewer can approve or reject the deployment
   - If approved, workflow continues with migrations and deployment
   - If rejected, workflow stops immediately and no deployment occurs

3. **Migrations Job** (after approval):
   - Pulls Docker image from GHCR (`main-latest`)
   - Runs Prisma migrations using `PROD_DIRECT_URL` or `PROD_DATABASE_URL`
   - Ensures database schema is up-to-date

4. **Deploy Job**:
   - Validates deployment configuration
   - Deploys to GCP Cloud Run via `gcloud run deploy` with image from GHCR
   - Cloud Run runs the new revision with the `main-latest` image

5. **Health Check Job** (if `PRODUCTION_SERVICE_URL` is configured):
   - Waits for service to become healthy
   - Checks `/api/version` endpoint
   - Verifies deployment success
   - **Note**: Health checks are currently disabled by default. To enable, uncomment `service_url` in `deploy-production.yml` and configure `PRODUCTION_SERVICE_URL` secret.

### Manual Production Deployment

You can also manually trigger a production deployment:

1. **Via GitHub Actions**:
   - Go to Actions → Deploy to Production
   - Click "Run workflow"
   - Select `main` branch
   - Optionally specify custom `image_tag` (e.g., `main-abc123def456` for specific commit)
   - Click "Run workflow"
   - Wait for approval prompt
   - Approve deployment when ready

2. **Use Cases for Manual Dispatch**:
   - Deploy specific commit SHA instead of `main-latest`
   - Re-deploy previous version (rollback)
   - Deploy to production outside normal merge flow
   - Emergency deployments

### Monitoring Production Deployments

- **GitHub Actions**: Check `.github/workflows/deploy-production.yml` runs in Actions tab
- **Approval Status**: View pending approvals in the workflow run
- **GCP Cloud Run**: Monitor deployment status in Google Cloud Console → Cloud Run
- **Logs**: View deployment and application logs in Cloud Run or GitHub Actions logs

### Troubleshooting Production Deployments

**Deployment doesn't trigger:**
- Verify you pushed to `main` branch
- Check path filters: workflow only triggers on `backend/**` changes
- Verify workflow file exists: `.github/workflows/deploy-production.yml`

**Approval prompt doesn't appear:**
- Verify GitHub Environment "production" is configured
- Check that required reviewers are set up
- Verify job references `environment: production` in workflow file
- Check that you have permission to view the environment

**Cloud Run deployment fails:**
- Verify `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_CLOUD_RUN_SERVICE`, and `GCP_SA_KEY` secrets are set (in production environment or repo)
- Check GCP Cloud Run console for deployment errors
- Ensure the service account has Cloud Run Admin and can pull the image from GHCR if needed

**Migrations fail:**
- Verify `PROD_DIRECT_URL` or `PROD_DATABASE_URL` secrets are set
- Check database connection string is correct
- Verify database is accessible from GitHub Actions runners
- Ensure database user has migration permissions

**Health check fails:**
- Verify `PRODUCTION_SERVICE_URL` secret is set correctly (Cloud Run production URL)
- Check application is running and accessible
- Review application logs in Cloud Run console
- Verify `/api/version` endpoint is responding

---

## Production Deployment (Manual)

### Step 1: Prepare Production Environment

1. **Copy production environment template:**
   ```bash
   cp .env.production.example .env.prod
   ```

2. **Generate production JWT secrets** (different from dev!):
   ```bash
   openssl rand -base64 32  # For JWT_SECRET
   openssl rand -base64 32  # For JWT_REFRESH_SECRET
   ```

3. **Fill in production values in `.env.prod`:**
   - Database connection strings (production database)
   - JWT secrets (new ones, not dev secrets!)
   - Supabase production credentials
   - Google OAuth production credentials (if using)

4. **Store secrets securely:**
   - Use your hosting platform's secrets manager
   - Never commit `.env.prod` to git
   - Use environment variables in CI/CD

### Step 2: Get Production Docker Image

#### Option A: Pull from GitHub Container Registry (GHCR) - Recommended

Images are automatically built and pushed to GHCR on every code change. Use these images for production deployments.

**Authenticate to GHCR:**

1. Create a GitHub Personal Access Token (PAT) with `read:packages` scope:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `read:packages` permission
   - Copy the token

2. Login to GHCR:
   ```bash
   echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
   ```

   Or set as environment variable:
   ```bash
   export GITHUB_TOKEN=your_pat_token
   echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
   ```

**Pull image from GHCR:**

Images are tagged with branch name and commit SHA. For production, use the `main` branch:

```bash
# Pull latest main branch image
docker pull ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest

# Or pull specific commit SHA
docker pull ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-abc123def456

# Or pull by SHA only
docker pull ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:abc123def456
```

**Tag for convenience:**
```bash
docker tag ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest kitchen-hub-api:latest
```

**Verify image:**
```bash
docker images ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api
# Should show ~150MB image size
```

> **Note**: Replace `YOUR_GITHUB_USERNAME` with your GitHub username or organization name. For organization repos, use the organization name.

#### Option B: Build Locally

If you need to build the image locally:

```bash
cd backend
docker build -t kitchen-hub-api:latest .
```

**Verify image:**
```bash
docker images kitchen-hub-api:latest
# Should show ~150MB image size
```

### Step 3: Run Database Migrations

**Before starting the application, run migrations:**

```bash
docker run --rm \
  --env-file .env.prod \
  kitchen-hub-api:latest \
  npx prisma migrate deploy --schema=src/infrastructure/database/prisma/schema.prisma
```

**Or if using environment variables directly:**
```bash
docker run --rm \
  -e DATABASE_URL="$PROD_DIRECT_URL" \
  -e DIRECT_URL="$PROD_DIRECT_URL" \
  kitchen-hub-api:latest \
  npx prisma migrate deploy --schema=src/infrastructure/database/prisma/schema.prisma
```

### Step 4: Deploy the Application

#### Option A: Docker Run (Simple Deployment)

**Using GHCR image:**
```bash
docker run -d \
  --name kitchen-hub-api \
  -p 3000:3000 \
  --env-file .env.prod \
  --restart unless-stopped \
  ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest
```

**Using locally built image:**
```bash
docker run -d \
  --name kitchen-hub-api \
  -p 3000:3000 \
  --env-file .env.prod \
  --restart unless-stopped \
  kitchen-hub-api:latest
```

#### Option B: Docker Compose (Production)

Create `docker-compose.prod.yml`:

**Using GHCR image:**
```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest
    container_name: kitchen-hub-api-prod
    ports:
      - "3000:3000"
    env_file:
      - .env.prod
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/version', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**Using locally built image:**
```yaml
version: '3.8'

services:
  backend:
    image: kitchen-hub-api:latest
    container_name: kitchen-hub-api-prod
    ports:
      - "3000:3000"
    env_file:
      - .env.prod
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/version', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Then deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### Option C: Cloud Platform (AWS, GCP, Azure, etc.)

**Common platforms:**
- **AWS**: ECS, EKS, App Runner, Elastic Beanstalk
- **Google Cloud**: Cloud Run, GKE (see [GCP Cloud Run](#gcp-cloud-run) for automated deploy)
- **Azure**: Container Instances, AKS
- **DigitalOcean**: App Platform, Droplets
- **Heroku**: Container Registry
- **Railway**: Direct Dockerfile support

**General steps:**
1. Pull image from GHCR (already pushed automatically) or use your platform's container registry
2. Configure environment variables in platform
3. Deploy container with health checks
4. Set up reverse proxy/load balancer if needed

**Using GHCR images:**
- Images are automatically available at `ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:TAG`
- Use `main-latest` tag for production deployments
- Use specific commit SHA tags for reproducible deployments

### Step 5: Verify Deployment

```bash
# Check health endpoint
curl https://your-domain.com/api/version

# Check Swagger docs
curl https://your-domain.com/api/docs/v1

# Check logs
docker logs kitchen-hub-api
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Production database is set up and accessible
- [ ] Database migrations have been run
- [ ] Production JWT secrets generated (different from dev)
- [ ] Production environment variables configured
- [ ] `.env.prod` file created (not committed to git)
- [ ] Docker image built and tested
- [ ] Health checks configured
- [ ] Reverse proxy/load balancer configured (if needed)
- [ ] SSL/TLS certificates configured (HTTPS)
- [ ] CORS settings verified for production domain
- [ ] Monitoring and logging set up
- [ ] Backup strategy in place

---

## Database migrations and rollback

- **Running migrations:** Use `npm run prisma:deploy` (or `npx prisma migrate deploy --schema=src/infrastructure/database/prisma/schema.prisma`) with `DIRECT_URL` or `DATABASE_URL`. Same command works locally, in CI, on Render, GCP, and AWS. See [docs/MIGRATIONS.md](docs/MIGRATIONS.md) for platform-specific steps (including Render).
- **Rollback posture:** (1) **Application** – revert to previous image/revision (see [Rollback Procedure](#rollback-procedure) below). (2) **Database** – use your provider’s snapshot/restore (Render, Supabase/Neon, GCP Cloud SQL, AWS RDS). (3) **Migration history** – use `prisma migrate resolve --rolled-back` or `--applied` when a migration failed or was applied manually; see [docs/MIGRATIONS.md](docs/MIGRATIONS.md).

---

## Environment Variables for Production

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | Database connection (pooled) | `postgresql://...` |
| `DIRECT_URL` | Direct database connection | `postgresql://...` |
| `JWT_SECRET` | JWT signing secret (32+ chars) | Generated secret |
| `JWT_REFRESH_SECRET` | Refresh token secret (32+ chars) | Generated secret |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJ...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | (optional) |

---

## Security Best Practices

1. **Never commit secrets to git**
   - `.env.prod` should be in `.gitignore`
   - Use secrets manager or environment variables

2. **Use different secrets for production**
   - Generate new JWT secrets for production
   - Don't reuse development secrets

3. **Enable HTTPS**
   - Use reverse proxy (nginx, Traefik) with SSL
   - Or use platform-managed SSL (Cloud Run, App Runner)

4. **Restrict database access**
   - Use connection pooling for `DATABASE_URL`
   - Use direct connection only for migrations
   - Enable SSL/TLS for database connections

5. **Monitor and log**
   - Set up application monitoring
   - Log errors and security events
   - Monitor database connections

6. **Regular updates**
   - Keep Docker base images updated
   - Update dependencies regularly
   - Apply security patches promptly

---

## Common Deployment Platforms

### Railway

1. Connect GitHub repository
2. Railway detects Dockerfile automatically
3. Add environment variables in dashboard
4. Deploy!

### GCP Cloud Run

Staging and production deployments use **GCP Cloud Run**. GitHub Actions builds the Docker image, pushes it to GHCR, runs migrations, then deploys directly to Cloud Run via `gcloud run deploy` (no deploy hook).

#### One-time setup

1. **GCP project**
   - Create or select a project in [Google Cloud Console](https://console.cloud.google.com).
   - Enable the [Cloud Run API](https://console.cloud.google.com/apis/library/run.googleapis.com).

2. **Service account for GitHub Actions**
   - Create a service account with roles: **Cloud Run Admin** (and, if needed, **Artifact Registry Reader** or access to pull from GHCR).
   - Create a JSON key and store it in GitHub secret `GCP_SA_KEY`. Do not commit the key.

3. **Cloud Run services**
   - Create two services in the same project (or use two projects):
     - **Staging**: e.g. `kitchen-hub-api-staging` (used by `deploy-staging.yml`).
     - **Production**: e.g. `kitchen-hub-api` (used by `deploy-production.yml`).
   - Configure env vars (e.g. `DATABASE_URL`, `JWT_SECRET`) in Cloud Run or via Secret Manager.
   - Cloud Run sets `PORT=8080` by default; the app binds to `process.env.PORT` on `0.0.0.0`.
   - For public API access, set the service to allow unauthenticated invocations if required.

#### Required GitHub secrets

| Secret | Used by | Description |
|--------|--------|-------------|
| `GCP_PROJECT_ID` | Staging + Production | GCP project ID |
| `GCP_REGION` | Staging + Production | Cloud Run region (e.g. `us-central1`) |
| `GCP_CLOUD_RUN_SERVICE_STAGING` | Staging | Staging Cloud Run service name |
| `GCP_CLOUD_RUN_SERVICE` | Production | Production Cloud Run service name |
| `GCP_SA_KEY` | Staging + Production | Service account JSON key |
| `STAGING_DIRECT_URL` / `STAGING_DATABASE_URL` | Staging | For migrations (optional but recommended) |
| `PROD_DIRECT_URL` / `PROD_DATABASE_URL` | Production | For migrations |
| `STAGING_SERVICE_URL` | Staging | Staging Cloud Run URL (optional, for health checks) |
| `PRODUCTION_SERVICE_URL` | Production | Production Cloud Run URL (optional, for health checks) |

Production secrets can be set at repository level or in the **production** GitHub Environment.

#### Deployment flow

1. Push to `develop` or `main` triggers `build.yml` → image pushed to GHCR (`develop-latest` or `main-latest`).
2. `deploy-staging.yml` or `deploy-production.yml` calls `_deploy.yml` with `deploy_target: gcp-cloudrun`.
3. `_deploy.yml` runs Prisma migrations (using `DIRECT_URL` or `DATABASE_URL`), then runs `gcloud run deploy` with the image from GHCR.
4. Cloud Run deploys the new revision. No deploy hook; deployment is done from GitHub Actions.

#### Optional

- **Min instances / concurrency**: Configure in Cloud Run for cost or latency.
- **Workload Identity Federation**: Use OIDC instead of `GCP_SA_KEY` for production (see Google Cloud docs).

### Fly.io

```bash
# Install flyctl
# Create app
fly launch

# Set secrets
fly secrets set JWT_SECRET=xxx JWT_REFRESH_SECRET=xxx

# Deploy
fly deploy
```

### AWS App Runner

1. Create service from container image
2. Configure environment variables
3. Set up auto-scaling
4. Deploy

---

## Troubleshooting

### Container won't start
- Check environment variables are set
- Verify database connection string
- Check container logs: `docker logs <container-name>`

### Database connection errors
- Verify `DATABASE_URL` and `DIRECT_URL` are correct
- Check database is accessible from deployment environment
- Ensure SSL mode is correct (`sslmode=require` for production)

### Migration errors
- Ensure migrations run before application starts
- Check `DIRECT_URL` is set correctly
- Verify database user has migration permissions

### Prisma engine mismatch (Alpine vs Debian)

If you see an error like:
- `Prisma Client could not locate the Query Engine for runtime "debian-openssl-3.0.x"`
- `Prisma Client was generated for "linux-musl-openssl-3.0.x"`

It means Prisma Client was generated in an Alpine (musl) build environment, but is running on a Debian (glibc) runtime image.

**Fix:**
- Update `src/infrastructure/database/prisma/schema.prisma` Prisma generator to include both binary targets (Debian + musl).
- Rebuild and push the Docker image to GHCR.
- Redeploy on Cloud Run so the new image is used.

### Health check failures
- Verify `/api/version` endpoint is accessible
- Check application is listening on correct port
- Review application logs for errors

---

## Rollback Procedure

**Application-only rollback** (revert to previous container/image). For database snapshot/restore and Prisma migration resolve, see [docs/MIGRATIONS.md](docs/MIGRATIONS.md).

If deployment fails:

1. **Stop new container:**
   ```bash
   docker stop kitchen-hub-api
   docker rm kitchen-hub-api
   ```

2. **Start previous version:**
   ```bash
   # Using GHCR image with specific SHA
   docker run -d --name kitchen-hub-api \
     -p 3000:3000 \
     --env-file .env.prod \
     ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:previous-commit-sha
   
   # Or using locally tagged image
   docker run -d --name kitchen-hub-api \
     -p 3000:3000 \
     --env-file .env.prod \
     kitchen-hub-api:previous-version
   ```

3. **Or use docker-compose:**
   ```bash
   docker-compose -f docker-compose.prod.yml down
   # Update image tag to previous version
   docker-compose -f docker-compose.prod.yml up -d
   ```

---

## Next Steps

After successful deployment:

1. Set up monitoring (e.g., Sentry, DataDog)
2. Configure logging aggregation
3. Set up CI/CD pipeline
4. Configure auto-scaling (if needed)
5. Set up database backups
6. Configure alerts for errors/downtime

---

## Support

For issues or questions:
- Check [README.md](./README.md) for general documentation
- Review [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) for environment setup
- Check [GHCR_QUICK_REFERENCE.md](./docs/GHCR_QUICK_REFERENCE.md) for GHCR usage
- Check application logs for errors

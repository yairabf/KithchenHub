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

## Production Deployment

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

### Step 2: Build Production Docker Image

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
- **Google Cloud**: Cloud Run, GKE
- **Azure**: Container Instances, AKS
- **DigitalOcean**: App Platform, Droplets
- **Heroku**: Container Registry
- **Railway**: Direct Dockerfile support
- **Render**: Dockerfile support

**General steps:**
1. Push image to container registry (Docker Hub, ECR, GCR, etc.)
2. Configure environment variables in platform
3. Deploy container with health checks
4. Set up reverse proxy/load balancer if needed

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

### Render

1. Create new Web Service
2. Connect repository
3. Set build command: `docker build -t app .`
4. Set start command: `docker run -p 3000:3000 app`
5. Add environment variables
6. Deploy

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

### Health check failures
- Verify `/api/version` endpoint is accessible
- Check application is listening on correct port
- Review application logs for errors

---

## Rollback Procedure

If deployment fails:

1. **Stop new container:**
   ```bash
   docker stop kitchen-hub-api
   docker rm kitchen-hub-api
   ```

2. **Start previous version:**
   ```bash
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
- Check application logs for errors

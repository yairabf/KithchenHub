# GitHub Container Registry (GHCR) Quick Reference

Quick reference guide for using Kitchen Hub backend Docker images from GitHub Container Registry.

## Image Location

All backend Docker images are automatically built and pushed to GHCR on every code change:

```
ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:TAG
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username or organization name.

> **Note**: For personal repositories, use your GitHub username. For organization repositories, use the organization name. You can find this in your repository URL: `https://github.com/OWNER/repo-name` - use `OWNER` as the username.

## Tagging Strategy

Images are tagged with multiple formats for flexibility:

### Branch + SHA Tags
- Format: `BRANCH-SHA`
- Example: `main-abc123def456`, `develop-xyz789ghi012`
- Use for: Specific commit deployments, reproducible builds

### Branch Latest Tags
- Format: `BRANCH-latest`
- Example: `main-latest`, `develop-latest`
- Use for: Latest code from a specific branch

### SHA-Only Tags
- Format: `SHA` (full or short)
- Example: `abc123def456`, `abc123def`
- Use for: Commit-specific deployments without branch context

## Authentication

### Step 1: Create GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "GHCR Docker Access")
4. Select scopes:
   - ✅ `read:packages` (required to pull images)
   - ✅ `write:packages` (only needed if you want to push images manually)
5. Click "Generate token"
6. **Copy the token immediately** (you won't be able to see it again)

### Step 2: Login to GHCR

**Using environment variable:**
```bash
export GITHUB_TOKEN=your_pat_token_here
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

**Using password prompt:**
```bash
docker login ghcr.io -u YOUR_GITHUB_USERNAME
# Enter your Personal Access Token when prompted for password
```

**Using Docker credential helper (recommended for automation):**
```bash
# Store token securely
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
# Credentials are stored in ~/.docker/config.json
```

## Pulling Images

### Pull Latest Main Branch Image
```bash
docker pull ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest
```

### Pull Specific Commit
```bash
# Using branch-SHA format
docker pull ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-abc123def456

# Using SHA-only format
docker pull ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:abc123def456
```

### Pull Feature Branch Image
```bash
docker pull ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:feature-branch-name-latest
```

## Running Images

### Basic Run
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/db" \
  -e DIRECT_URL="postgresql://user:password@host:5432/db" \
  -e JWT_SECRET="your-jwt-secret-min-32-chars" \
  -e JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars" \
  -e SUPABASE_URL="https://your-project.supabase.co" \
  -e SUPABASE_ANON_KEY="your-anon-key" \
  ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest
```

### Using Environment File
```bash
docker run -p 3000:3000 \
  --env-file .env.prod \
  ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest
```

### Tag for Convenience
```bash
# Tag GHCR image with a friendly name
docker tag ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest kitchen-hub-api:latest

# Now use the friendly name
docker run -p 3000:3000 --env-file .env.prod kitchen-hub-api:latest
```

## Docker Compose Example

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

## Finding Available Tags

### Via GitHub Web Interface

1. Go to your repository on GitHub
2. Click "Packages" in the right sidebar (or navigate to `https://github.com/YOUR_GITHUB_USERNAME?tab=packages`)
3. Click on `kitchen-hub-api` package
4. View all available tags and versions

### Via Docker CLI

```bash
# List all tags (requires authentication)
curl -H "Authorization: Bearer $GITHUB_TOKEN" \
  https://ghcr.io/v2/YOUR_GITHUB_USERNAME/kitchen-hub-api/tags/list
```

## Common Workflows

### Production Deployment

```bash
# 1. Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# 2. Pull latest production image
docker pull ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest

# 3. Run migrations
docker run --rm \
  -e DATABASE_URL="$PROD_DIRECT_URL" \
  -e DIRECT_URL="$PROD_DIRECT_URL" \
  ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest \
  npx prisma migrate deploy --schema=src/infrastructure/database/prisma/schema.prisma

# 4. Start application
docker run -d \
  --name kitchen-hub-api \
  -p 3000:3000 \
  --env-file .env.prod \
  --restart unless-stopped \
  ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-latest
```

### Testing Feature Branch

```bash
# Pull feature branch image
docker pull ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:feature-branch-name-latest

# Run with test environment
docker run -p 3000:3000 \
  --env-file .env.test \
  ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:feature-branch-name-latest
```

### Rollback to Previous Version

```bash
# Find the commit SHA of the previous working version
# Then pull that specific image
docker pull ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-previous-sha

# Deploy the previous version
docker run -d \
  --name kitchen-hub-api \
  -p 3000:3000 \
  --env-file .env.prod \
  --restart unless-stopped \
  ghcr.io/YOUR_GITHUB_USERNAME/kitchen-hub-api:main-previous-sha
```

## Troubleshooting

### Authentication Errors

**Error**: `unauthorized: authentication required`

**Solution**:
1. Verify you're logged in: `docker login ghcr.io`
2. Check your Personal Access Token has `read:packages` scope
3. Ensure you're using the correct username (GitHub username or organization name)

### Image Not Found

**Error**: `manifest unknown: manifest unknown`

**Solution**:
1. Verify the image tag exists (check GitHub Packages page)
2. Ensure you're using the correct repository owner name
3. Check that the workflow has successfully built and pushed the image

### Permission Denied

**Error**: `permission_denied: write_package`

**Solution**:
- This error occurs when trying to push images
- For pulling, you only need `read:packages` scope
- Pushing is handled automatically by GitHub Actions workflows

### Rate Limiting

**Error**: `too many requests`

**Solution**:
- GitHub has rate limits for anonymous pulls
- Authenticate with a Personal Access Token to avoid rate limits
- For organization accounts, consider using a service account token

## Security Best Practices

1. **Never commit tokens**: Store Personal Access Tokens in environment variables or secret managers
2. **Use least privilege**: Only grant `read:packages` scope unless you need to push
3. **Rotate tokens regularly**: Update tokens periodically for security
4. **Use organization accounts**: For team projects, use organization-level packages
5. **Review package visibility**: Ensure packages are set to the correct visibility (public/private)

## Additional Resources

- [GitHub Container Registry Documentation](https://docs.github.com/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Login Documentation](https://docs.docker.com/engine/reference/commandline/login/)
- [Backend Deployment Guide](../DEPLOYMENT.md)
- [Backend README](../README.md)

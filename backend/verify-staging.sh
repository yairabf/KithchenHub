#!/bin/bash
set -e

# Configuration constants
readonly MAX_HEALTH_ATTEMPTS=30
readonly HEALTH_SLEEP_SECONDS=2
readonly MIGRATION_MAX_ATTEMPTS=3
readonly MIGRATION_RETRY_SLEEP_SECONDS=5

echo "🚀 Starting Staging Deployment Verification..."

# Pre-flight checks
if [ ! -f .env.staging ]; then
  echo "❌ Missing .env.staging file!"
  echo "   Please create .env.staging with required environment variables (e.g., DATABASE_URL)"
  exit 1
fi

# Cleanup previous run
echo "🧹 Cleaning up previous containers..."
docker-compose -f docker-compose.staging.yml down -v || true

# Build and Start
echo "🏗️ Building and Starting Application..."
docker-compose -f docker-compose.staging.yml up -d --build

# Wait for DB to be healthy
echo "⏳ Waiting for Database to be ready..."
db_attempt=0
until docker-compose -f docker-compose.staging.yml exec -T staging_db pg_isready -U "${POSTGRES_USER:-staging_user}" -d "${POSTGRES_DB:-kitchen_hub_staging}" > /dev/null 2>&1; do
  if [ $db_attempt -ge $MAX_HEALTH_ATTEMPTS ]; then
    echo "❌ Database did not become ready in time!"
    docker-compose -f docker-compose.staging.yml logs staging_db
    exit 1
  fi
  printf '.'
  db_attempt=$((db_attempt+1))
  sleep $HEALTH_SLEEP_SECONDS
done
echo "✅ Database is ready!"

# Run Migrations with retry
echo "🔄 Running Database Migrations..."
migration_attempt=0
migration_success=false
while [ $migration_attempt -lt $MIGRATION_MAX_ATTEMPTS ]; do
  if docker-compose -f docker-compose.staging.yml exec -T staging_api npx prisma migrate deploy --schema=src/infrastructure/database/prisma/schema.prisma > /tmp/migration.log 2>&1; then
    migration_success=true
    break
  fi
  migration_attempt=$((migration_attempt+1))
  if [ $migration_attempt -lt $MIGRATION_MAX_ATTEMPTS ]; then
    echo "⚠️ Migration attempt $migration_attempt failed, retrying in ${MIGRATION_RETRY_SLEEP_SECONDS}s..."
    sleep $MIGRATION_RETRY_SLEEP_SECONDS
  fi
done

if [ "$migration_success" = false ]; then
  echo "❌ Database migrations failed after $MIGRATION_MAX_ATTEMPTS attempts!"
  cat /tmp/migration.log
  exit 1
fi
echo "✅ Migrations completed successfully"

# Wait for API Health
echo "🩺 Waiting for API to be healthy..."
api_attempt=0
until curl -s http://localhost:3001/api/version > /dev/null; do
  if [ $api_attempt -ge $MAX_HEALTH_ATTEMPTS ]; then
    echo "❌ API failed to start in time!"
    docker-compose -f docker-compose.staging.yml logs staging_api
    exit 1
  fi
  printf '.'
  api_attempt=$((api_attempt+1))
  sleep $HEALTH_SLEEP_SECONDS
done
echo "✅ API is up!"

# Smoke Tests
echo "🧪 Running Smoke Tests..."

# Test 1: Version Endpoint
echo "Checking /api/version..."
VERSION_HTTP_CODE=$(curl -s -o /tmp/version.json -w "%{http_code}" http://localhost:3001/api/version)
if [[ $VERSION_HTTP_CODE != "200" ]]; then
  echo "❌ Version check failed (HTTP $VERSION_HTTP_CODE)!"
  cat /tmp/version.json
  exit 1
fi

# Check for success:true in JSON response (TransformInterceptor wraps responses)
if ! grep -q '"success"\s*:\s*true' /tmp/version.json 2>/dev/null; then
  echo "❌ Version response missing success:true!"
  cat /tmp/version.json
  exit 1
fi
echo "✅ Version check passed"

# Test 2: Swagger Documentation Endpoint
echo "Checking /api/docs/v1..."
DOCS_HTTP_CODE=$(curl -L -o /dev/null -s -w "%{http_code}" http://localhost:3001/api/docs/v1)
if [[ $DOCS_HTTP_CODE == "200" ]]; then
  echo "✅ Docs endpoint accessible (HTTP $DOCS_HTTP_CODE)"
else
  echo "⚠️ Docs endpoint returned HTTP $DOCS_HTTP_CODE (Might be okay if auth required or endpoint differs)"
fi

echo "🎉 Staging Deployment Verification Completed Successfully!"

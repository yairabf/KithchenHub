# =============================================================================
# Stage 1: Dependencies
# Install all dependencies (including devDependencies) for building
# =============================================================================
FROM node:20-alpine AS dependencies

WORKDIR /usr/src/app

# Prisma (and some transitive deps) may require OpenSSL detection on Alpine.
RUN apk add --no-cache openssl

# Copy package files for dependency installation
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for build)
# `npm ci` is already lockfile-frozen (no --frozen-lockfile flag in npm).
RUN npm ci

# =============================================================================
# Stage 2: Builder
# Generate Prisma Client and build TypeScript application
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Ensure OpenSSL is available for Prisma generate on Alpine.
RUN apk add --no-cache openssl

# Copy dependencies from previous stage
COPY --from=dependencies /usr/src/app/node_modules ./node_modules

# Copy package files
COPY package.json package-lock.json ./

# Copy Prisma schema (required for generation)
COPY src/infrastructure/database/prisma ./src/infrastructure/database/prisma

# Generate Prisma Client with custom schema path
RUN npx prisma generate --schema=src/infrastructure/database/prisma/schema.prisma

# Copy source code
COPY . .

# Build TypeScript application
RUN npm run build

# =============================================================================
# Stage 3: Production
# Minimal runtime image with only production dependencies
# =============================================================================
FROM node:20-slim AS production

# Install required system dependencies:
# - libssl-dev: Required by Prisma for SSL/TLS connections
# - dumb-init: Proper PID 1 init system for signal handling
# - ca-certificates: For HTTPS connections
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libssl-dev \
        dumb-init \
        ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy package files
COPY --chown=node:node package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built application from builder stage
COPY --chown=node:node --from=builder /usr/src/app/dist ./dist

# Copy generated Prisma Client from builder stage
COPY --chown=node:node --from=builder /usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client

# Copy Prisma schema (needed for migrations in production if required)
COPY --chown=node:node --from=builder /usr/src/app/src/infrastructure/database/prisma ./src/infrastructure/database/prisma

# Set NODE_ENV to production
ENV NODE_ENV=production

# Use non-root user for security
USER node

# Expose application port
EXPOSE 3000

# Use dumb-init to handle signals properly and prevent zombie processes
# This ensures graceful shutdown of the NestJS application
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]

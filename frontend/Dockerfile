# Dockerfile - Ultra-optimized Next.js Frontend
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Dependencies stage - install only production dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production --no-audit --no-fund && \
    npm cache clean --force

# Build stage - install all dependencies and build
FROM base AS builder
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && \
    npm prune --production && \
    npm cache clean --force

# Production stage - minimal runtime image
FROM node:18-alpine AS runner
WORKDIR /app

# Install only curl for health checks
RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Copy only necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Optimized health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=2 \
    CMD curl -f http://localhost:3000 || exit 1

# Start the application
CMD ["node", "server.js"]